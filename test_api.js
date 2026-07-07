const https = require('https');

const query = encodeURIComponent(JSON.stringify({ searchTerm: "Lexie DeCastro" }));
const url = `https://www.kplctv.com/pf/api/v3/content/fetch/search-api?query=${query}&d=576`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                if (json.content_elements) {
                    console.log(`Found ${json.content_elements.length} articles!`);
                    json.content_elements.slice(0, 3).forEach(el => console.log(el.headlines?.basic || el.title));
                } else {
                    console.log('No content_elements in response.');
                }
            } catch (e) {
                console.log('Failed to parse JSON');
            }
        }
    });
}).on('error', err => {
    console.error('Error:', err.message);
});
