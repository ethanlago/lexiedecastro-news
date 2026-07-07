const https = require('https');

const url = 'https://www.kplctv.com/authors/lexie-decastro/?outputType=rss';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Content starts with: ${data.substring(0, 200)}`);
    });
}).on('error', err => {
    console.error('Error:', err.message);
});
