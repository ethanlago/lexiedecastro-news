const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeLexieStories() {
    console.log('Starting scraper...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    
    console.log('Navigating to author page...');
    await page.goto('https://www.kplctv.com/authors/lexie-decastro/', { waitUntil: 'networkidle2' });

    let previousHeight = 0;
    let unchangedCycles = 0;
    
    console.log('Scrolling to load all stories...');
    while (unchangedCycles < 3) {
        // Try to click any "Load More" button if it exists
        try {
            const loadMoreBtn = await page.$x("//button[contains(text(), 'Load More') or contains(text(), 'Show More')]");
            if (loadMoreBtn.length > 0) {
                await loadMoreBtn[0].click();
                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (e) {
            // Ignore if no button found
        }

        // Scroll to the bottom
        previousHeight = await page.evaluate('document.body.scrollHeight');
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        
        // Wait for potential network requests to finish
        await new Promise(r => setTimeout(r, 2000));
        
        const newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight) {
            unchangedCycles++;
        } else {
            unchangedCycles = 0;
        }
    }

    console.log('Finished scrolling. Extracting stories...');

    const stories = await page.evaluate(() => {
        const results = [];
        
        // Find all cards on the page
        const cards = Array.from(document.querySelectorAll('.card'));
        const seenUrls = new Set();

        cards.forEach(card => {
            // Ensure this card actually belongs to Lexie
            const textContent = card.textContent || '';
            if (textContent.toLowerCase().includes('lexie')) {
                // Find all links in the card
                const links = Array.from(card.querySelectorAll('a'));
                
                let articleLink = '';
                let titleText = '';

                // Iterate links to find the best one
                links.forEach(link => {
                    const href = link.href;
                    if (href && (href.match(/\/\d{4}\/\d{2}\/\d{2}\//) || href.includes('kplctv.com/news/') || href.includes('kplctv.com/video/'))) {
                        articleLink = href;
                        const linkText = link.innerText.trim();
                        // If this link has text, it's likely the headline
                        if (linkText.length > 10) {
                            titleText = linkText;
                        }
                    }
                });

                if (articleLink && !seenUrls.has(articleLink)) {
                    seenUrls.add(articleLink);
                    
                    // Fallback to searching for a header element for the title if no link had text
                    if (!titleText) {
                        const heading = card.querySelector('h1, h2, h3, h4, h5, h6, .headline');
                        if (heading) {
                            titleText = heading.innerText.trim();
                        }
                    }
                    
                    // Extract Image URL
                    let imageUrl = '';
                    const img = card.querySelector('img');
                    if (img) {
                        // Gray TV/Arc often uses data-src for lazy loading or src directly
                        imageUrl = img.getAttribute('data-src') || img.src || '';
                    }

                    let pubDate = new Date().toISOString();
                    
                    // The URLs contain the exact publication date: /YYYY/MM/DD/
                    const urlDateMatch = articleLink.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
                    if (urlDateMatch) {
                        const year = urlDateMatch[1];
                        const month = urlDateMatch[2];
                        const day = urlDateMatch[3];
                        // Construct an ISO date string
                        pubDate = new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString();
                    } else {
                        // Fallback: try to find the date snippet in text
                        const dateMatch = textContent.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/i);
                        if (dateMatch) {
                            pubDate = new Date(dateMatch[0]).toISOString();
                        }
                    }

                    if (titleText.length > 5) {
                        results.push({
                            title: titleText,
                            link: articleLink,
                            pubDate: pubDate,
                            image: imageUrl,
                            snippet: ''
                        });
                    }
                }
            }
        });
        return results;
    });

    console.log(`Extracted ${stories.length} stories!`);
    
    // Sort stories by date descending (rough estimate based on our parsing)
    stories.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    fs.writeFileSync('stories.json', JSON.stringify({ success: true, stories }, null, 2));
    console.log('Saved to stories.json');

    await browser.close();
}

scrapeLexieStories().catch(err => {
    console.error('Scraper failed:', err);
});
