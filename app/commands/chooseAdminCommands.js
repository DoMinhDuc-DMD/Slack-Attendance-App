const { buildModal } = require('./blocks/chooseAdminBlocks');
const { checkCommandMiddleware } = require('../../services/utils');
const { loadingModal } = require('./blocks/loadingModal');

module.exports = (app, db) => {
    app.command('/chonquantri', async ({ command, ack, client }) => {
        await ack();

        const checkCommand = await checkCommandMiddleware(db, client, command);
        if (!checkCommand) return;

        const { user_id: requesterID, trigger_id } = command;
        const loadingView = await loadingModal(client, trigger_id, 'Chọn thông tin quản trị');

        try {
            // Channels
            const { channels } = await client.conversations.list();
            const channelOptions = channels
                .filter(c => c.is_channel)
                .map(c => ({
                    text: { type: 'plain_text', text: c.name },
                    value: c.id
                }));
            const defaultChannel = channelOptions[0];

            // Members
            const { members: allUsers } = await client.users.list();
            const { members } = await client.conversations.members({ channel: defaultChannel.value });

            const userOptions = allUsers
                .filter(u => members.includes(u.id) && !u.is_bot && u.id !== process.env.SLACK_BOT_ID)
                .map(u => ({ text: { type: 'plain_text', text: u.real_name || u.name }, value: u.id }));

            await client.views.update({
                view_id: loadingView.view.id,
                view: buildModal(channelOptions, defaultChannel, userOptions, requesterID)
            });
        } catch (error) {
            console.error('Error handling choose admin command:', error);
        }
    });

    app.action('channel_select', async ({ ack, body, client }) => {
        await ack();
        try {
            const { channelOptions, userOptions, requesterID } = JSON.parse(body.view.private_metadata);
            const selectedChannel = body.actions[0].selected_option;

            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: buildModal(channelOptions, selectedChannel, userOptions, requesterID)
            });
        } catch (error) {
            console.error('Error handling channel select action:', error);
        }
    });
}