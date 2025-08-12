const { App } = require('@slack/bolt');
require('dotenv').config();
const { createDbConnection } = require('./services/createDbConnection');

const registerCommands = require('./commands');
const registerEvents = require('./events');
const registerMessages = require('./messages');
const registerViews = require('./views');

const app = new App({
    token: process.env.SLACK_OAUTH_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
});

(async () => {
    try {
        const db = await createDbConnection();

        registerCommands(app, db);
        registerEvents(app, db);
        registerMessages(app, db);
        registerViews(app, db);

        await app.start();
    } catch (error) {
        console.error("Error starting the bot:", error);
    }
})();
