const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('author.html', 'utf8');
const $ = cheerio.load(html);

// Let's look for elements containing her name in the byline
const bylines = [];
$('.card').each((i, el) => {
    const text = $(el).text();
    if (text.includes('Lexie')) {
        bylines.push($(el).find('a').first().attr('href'));
    }
});

console.log(`Cards with Lexie in them: ${bylines.length}`);
console.log(bylines);

// Let's find the parent of the cards to isolate the main feed from the sidebar.
// The main feed usually has a distinct class.
const cardContainers = [];
$('.card').each((i, el) => {
    const parentClass = $(el).parent().attr('class');
    const grandParentClass = $(el).parent().parent().attr('class');
    cardContainers.push({ parent: parentClass, grand: grandParentClass });
});
console.log([...new Set(cardContainers.map(c => c.parent))]);
console.log([...new Set(cardContainers.map(c => c.grand))]);
