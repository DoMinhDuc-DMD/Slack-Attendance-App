const express = require('express');
const axios = require('axios');
const { createDBConnection } = require('../services/createDBConnection');
require('dotenv').config();

const app = express();

app.get('/slack/oauth_redirect', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send('Missing code parameter!');
    }

    try {
        const response = await axios.get('https://slack.com/api/oauth.v2.access', {
            params: {
                code,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                redirect_uri: process.env.REDIRECT_URI
            }
        });

        const data = response.data;
        if (!data.ok) {
            return res.status(500).send('Slack OAuth failed');
        }

        const teamId = data.team.id;
        const teamName = data.team.name;
        const accessToken = data.access_token;
        const botUserId = data.bot_user_id;

        const db = await createDBConnection();
        await db.query(`
            INSERT INTO workspace (team_id, team_name, access_token, bot_user_id) VALUES (?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
                team_name = VALUES(team_name),
                access_token = VALUES(access_token), 
                bot_user_id = VALUES(bot_user_id)`,
            [teamId, teamName, accessToken, botUserId]
        );

        res.send(`App installed to workspace ${teamName}. You can close this tab.`);
    } catch (error) {
        console.error('Error during Slack OAuth:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(3000, () => {
    console.log('OAuth is running on port 3000.');
});