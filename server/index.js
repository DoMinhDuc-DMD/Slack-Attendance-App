const express = require('express');
const axios = require('axios');
const { dbConnections } = require('../services/dbConnections')
require('dotenv').config();

const app = express();
// 'https://b19b4865a0fe.ngrok-free.app/slack/oauth_redirect'
(async () => {

    const res = await axios.get('http://ngrok:4040/api/tunnels')
    const redirectUri = res.data.tunnels[0].public_url + '/slack/oauth_redirect';
    console.log('Ngrok URL: ', redirectUri);

    app.get('/slack/oauth_redirect', async (req, res) => {
        const code = req.query.code;
        if (!code) return res.status(400).send('Missing code parameter!');

        try {
            const response = await axios.get('https://slack.com/api/oauth.v2.access', {
                params: {
                    code,
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    redirect_uri: 'https://6c10883ef373.ngrok-free.app/slack/oauth_redirect'
                }
            });

            const data = response.data;
            if (!data.ok) return res.status(500).send('Slack OAuth failed');

            const workspaceId = data.team.id;
            const workspaceName = data.team.name;
            const accessToken = data.access_token;
            const botUserId = data.bot_user_id;
            const adminUserId = data.authed_user.id;

            const db = await dbConnections();
            await db.query(`
                INSERT INTO workspace (workspace_id, workspace_name, access_token, bot_user_id, super_admin_id) VALUES (?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                    workspace_name = VALUES(workspace_name),
                    access_token = VALUES(access_token), 
                    bot_user_id = VALUES(bot_user_id)`,
                [workspaceId, workspaceName, accessToken, botUserId, adminUserId]
            );

            res.send(`App installed to workspace ${workspaceName}. You can close this tab.`);
        } catch (error) {
            console.error('Error during Slack OAuth:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.listen(3000, () => {
        console.log('OAuth is running on port 3000.');
    });
})();