const ngrok = require('ngrok');

// load app + server
require('./app');
require('./server');

(async function () {
    try {
        const url = await ngrok.connect({
            addr: 3000,
            authtoken: process.env.NGROK_TOKEN,
        });
        console.log("Ngrok tunnel running at:", url);
    } catch (err) {
        console.error("Failed to start ngrok:", err);
    }
})();
