const https = require('https');

const query = encodeURIComponent(JSON.stringify({ author: "lexie-decastro", size: 100 }));
const url = `https://www.kplctv.com/pf/api/v3/content/fetch/author-api?query=${query}&d=576`;

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                if (json.content_elements) {
                    console.log(`Found ${json.content_elements.length} articles!`);
                } else {
                    console.log('No content_elements in response.', Object.keys(json));
                }
            } catch (e) {
                console.log('Failed to parse JSON');
            }
        } else {
            console.log(data.substring(0, 100));
        }
    });
}).on('error', err => {
    console.error('Error:', err.message);
});
