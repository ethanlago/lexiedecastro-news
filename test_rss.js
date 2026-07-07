const Parser = require('rss-parser');
const parser = new Parser();

async function test() {
    const query = '"Lexie DeCastro" site:kplctv.com';
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}`;
    try {
        const feed = await parser.parseURL(feedUrl);
        feed.items.forEach((item, index) => {
            console.log(`${index + 1}. ${item.title}`);
        });
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
