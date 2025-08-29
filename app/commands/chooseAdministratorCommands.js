const { buildModal } = require("./blocks/chooseAdministratorBlocks");

module.exports = (app) => {
    app.command('/chonquantri', async ({ command, ack, client }) => {
        await ack();
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

            await client.views.open({
                trigger_id: command.trigger_id,
                view: buildModal(channelOptions, defaultChannel, userOptions)
            });
        } catch (error) {
            console.error("Error handling choose administrator command:", error);
        }
    });

    app.action('channel_select', async ({ ack, body, client }) => {
        await ack();
        try {
            const { channelOptions, userOptions } = JSON.parse(body.view.private_metadata);
            const selectedChannel = body.actions[0].selected_option;

            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: buildModal(channelOptions, selectedChannel, userOptions)
            });
        } catch (error) {
            console.error("Error handling channel select action:", error);
        }
    });
}