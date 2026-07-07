const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'stories.json');
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

if (data.stories && data.stories.length > 0) {
    const removed = data.stories.shift(); // Remove the newest story
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`Successfully removed the newest story ("${removed.title}") from cache.`);
    console.log(`Running the notifier should now detect this as a "new" story and email you!`);
} else {
    console.log("No stories in cache to remove.");
}
