const { App } = require('@slack/bolt');
require('dotenv').config();
const { dbConnections } = require('../services/dbConnections');

const registerCommands = require('./commands');
const registerEvents = require('./events');
const registerMessages = require('./messages');
const registerViews = require('./views');

const app = new App({
    socketMode: true,
    appToken: process.env.APP_TOKEN,
    signingSecret: process.env.SIGNING_SECRET,
    retryConfig: {
        retries: 5,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 60000,
    },
    authorize: async ({ teamId }) => {
        const db = await dbConnections();
        const [rows] = await db.query('SELECT access_token, bot_user_id FROM workspace WHERE workspace_id = ?', [teamId]);

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
<<<<<<< HEAD
        const db = await DBConnection();
        
=======
        const db = await dbConnections();

>>>>>>> 173b60c714a8e1a347682a14cf1260393b8dcf4d
        registerCommands(app, db);
        registerEvents(app, db);
        registerMessages(app, db);
        registerViews(app, db);

        await app.start();
    } catch (error) {
        console.error('Error starting the bot: ', error);
    }
})();