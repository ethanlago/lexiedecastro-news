require('dotenv').config();
const fs = require('fs');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'stories.json');

// Helper to scrape the latest stories
async function scrapeStories() {
    console.log('Starting scraper for notifications...');
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.goto('https://www.kplctv.com/authors/lexie-decastro/', { waitUntil: 'networkidle2' });
    
    // Scroll a few times to load stories
    for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise(r => setTimeout(r, 1000));
    }

    const stories = await page.evaluate(() => {
        const results = [];
        const cards = Array.from(document.querySelectorAll('.card'));
        const seenUrls = new Set();

        cards.forEach(card => {
            const textContent = card.textContent || '';
            if (textContent.toLowerCase().includes('lexie')) {
                const links = Array.from(card.querySelectorAll('a'));
                let articleLink = '';
                let titleText = '';

                links.forEach(link => {
                    const href = link.href;
                    if (href && (href.match(/\/\d{4}\/\d{2}\/\d{2}\//) || href.includes('kplctv.com/news/') || href.includes('kplctv.com/video/'))) {
                        articleLink = href;
                        const linkText = link.innerText.trim();
                        if (linkText.length > 10) {
                            titleText = linkText;
                        }
                    }
                });

                if (articleLink && !seenUrls.has(articleLink)) {
                    seenUrls.add(articleLink);
                    if (!titleText) {
                        const heading = card.querySelector('h1, h2, h3, h4, h5, h6, .headline');
                        if (heading) {
                            titleText = heading.innerText.trim();
                        }
                    }
                    
                    let imageUrl = '';
                    const img = card.querySelector('img');
                    if (img) {
                        imageUrl = img.getAttribute('data-src') || img.src || '';
                    }

                    let pubDate = new Date().toISOString();
                    const urlDateMatch = articleLink.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
                    if (urlDateMatch) {
                        const year = urlDateMatch[1];
                        const month = urlDateMatch[2];
                        const day = urlDateMatch[3];
                        pubDate = new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString();
                    }

                    if (titleText.length > 5) {
                        results.push({ title: titleText, link: articleLink, pubDate: pubDate, image: imageUrl });
                    }
                }
            }
        });
        return results;
    });

    await browser.close();
    return stories;
}

// Send Email Function
async function sendEmailNotification(newStories) {
    console.log(`Sending email for ${newStories.length} new stories...`);
    
    let transporter = nodemailer.createTransport({
        service: 'gmail', // Usually Gmail for personal alerts
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let storyHtml = newStories.map(s => `
        <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
            <h2 style="color: #2563eb; margin-bottom: 5px;"><a href="${s.link}" style="text-decoration: none; color: #2563eb;">${s.title}</a></h2>
            <p style="color: #64748b; font-size: 14px;">Published: ${new Date(s.pubDate).toLocaleDateString()}</p>
            ${s.image ? `<img src="${s.image}" style="max-width: 100%; border-radius: 8px; margin-top: 10px;" />` : ''}
            <br/>
            <a href="${s.link}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #facc15; color: #0f172a; text-decoration: none; border-radius: 6px; font-weight: bold;">Read Story</a>
        </div>
    `).join('');

    let mailOptions = {
        from: `"Lexie News Alert" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_RECIPIENT,
        subject: `Lexie published ${newStories.length} new stor${newStories.length === 1 ? 'y' : 'ies'}!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
                <h1 style="color: #1e3a8a; text-align: center;">New Stories from Lexie DeCastro!</h1>
                <p style="text-align: center; color: #475569; font-size: 16px;">The automated dashboard just detected new stories.</p>
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    ${storyHtml}
                </div>
            </div>
        `
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
}

// Main Logic
async function runNotifier() {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_RECIPIENT) {
            console.error("ERROR: Email credentials are not fully set in .env");
            return;
        }

        const freshStories = await scrapeStories();
        
        // Read existing cache
        let cachedData = { stories: [] };
        if (fs.existsSync(CACHE_FILE)) {
            const raw = fs.readFileSync(CACHE_FILE, 'utf8');
            try {
                cachedData = JSON.parse(raw);
            } catch (e) {
                console.error('Error parsing cache file, proceeding with empty cache.');
            }
        }

        const cachedLinks = new Set(cachedData.stories.map(s => s.link));
        const newStories = [];

        // Compare fresh stories to cache
        freshStories.forEach(story => {
            if (!cachedLinks.has(story.link)) {
                newStories.push(story);
            }
        });

        if (newStories.length > 0) {
            console.log(`Found ${newStories.length} NEW stories!`);
            await sendEmailNotification(newStories);
            
            // Add new stories to cache and write it back
            cachedData.stories = [...newStories, ...cachedData.stories];
            fs.writeFileSync(CACHE_FILE, JSON.stringify({ success: true, stories: cachedData.stories }, null, 2));
            console.log("Cache updated.");
        } else {
            console.log("No new stories found.");
        }

    } catch (error) {
        console.error("Error running notifier:", error);
    }
}

// Run the script
runNotifier();
