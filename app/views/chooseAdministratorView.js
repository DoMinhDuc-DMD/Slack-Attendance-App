const { responseMessage } = require("../../services/utils");

module.exports = (app, db) => {
    app.view('choose_administrator_modal', async ({ ack, view, client }) => {
        await ack();

        try {
            const selectedUserId = view.state.values.user_block.user_select.selected_option.value;
            const selectedChannel = view.state.values.channel_block.channel_select.selected_option.value;

            const [workspace] = await db.execute('SELECT * FROM workspace WHERE workspace_id = ?', [view.team_id]);
            let currentChannelId = workspace[0]?.channel_id;

            if (!currentChannelId) {
                await db.execute('UPDATE workspace SET channel_id = ? WHERE workspace_id = ?', [selectedChannel, view.team_id]);
                currentChannelId = selectedChannel;
                await db.execute(`INSERT INTO admins (workspace_id, admin_id, channel_id) VALUES (?, ?, ?)`, [view.team_id, selectedUserId, currentChannelId]);

                try {
                    await client.conversations.join({ channel: currentChannelId });
                } catch (error) {
                    console.warn(`Bot không thể tham gia kênh ${currentChannelId}:`, error);
                }

                await responseMessage(client, currentChannelId, `<@${selectedUserId}> là quản trị viên của kênh.`);
            } else {
                return await responseMessage(client, currentChannelId, 'Workspace này đã có kênh điểm danh và quản trị viên, không thể thay đổi nữa.');
            }
        } catch (error) {
            console.error("Error handling choose administrator modal:", error);
        }
    });
}