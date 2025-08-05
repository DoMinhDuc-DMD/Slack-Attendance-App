const { App } = require('@slack/bolt');
require('dotenv').config();
const { createDbConnection } = require('./services/createDbConnection');

const registerEvents = require('./events');
const registerMessages = require('./messages');

const app = new App({
    token: process.env.SLACK_OAUTH_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
});

(async () => {
    try {
        const db = await createDbConnection();

        registerEvents(app, db);
        registerMessages(app, db);

        await app.start();
    } catch (error) {
        console.error("Error starting the bot:", error);
    }
})();
