const { App } = require('@slack/bolt');
require('dotenv').config();
const { DBConnection } = require('../services/DBConnection');

const registerCommands = require('./commands');
const registerEvents = require('./events');
const registerMessages = require('./messages');
const registerViews = require('./views');

const app = new App({
    socketMode: true,
    appToken: process.env.APP_TOKEN,
    signingSecret: process.env.SIGNING_SECRET,
    authorize: async ({ teamId }) => {
        const db = await DBConnection();
        const [rows] = await db.query('SELECT access_token, bot_user_id FROM workspace WHERE team_id = ?', [teamId]);

        if (rows.length === 0) {
            throw new Error('Not found workspace!');
        }

        return {
            botToken: rows[0].access_token,
            botUserId: rows[0].bot_user_id
        };
    }
});

(async () => {
    try {
        const db = await DBConnection();

        registerCommands(app, db);
        registerEvents(app, db);
        registerMessages(app, db);
        registerViews(app, db);

        await app.start();
    } catch (error) {
        console.error("Error starting the bot:", error);
    }
})();