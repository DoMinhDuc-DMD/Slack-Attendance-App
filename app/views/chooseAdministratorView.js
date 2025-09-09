const { responseMessage } = require("../../services/utils");

module.exports = (app, db) => {
    app.view('choose_administrator_modal', async ({ ack, view, client }) => {
        await ack();

        try {
            const requesterID = JSON.parse(view.private_metadata).requesterID;
            const selectedUser = view.state.values.user_block.user_select.selected_option.value;
            const selectedChannel = view.state.values.channel_block.channel_select.selected_option.value;

            const [workspace] = await db.execute('SELECT * FROM admins WHERE workspace_id = ?', [view.team_id]);

            if (!workspace[0]?.channel_id) {
                await db.execute(`INSERT INTO admins (workspace_id, admin_id, channel_id) VALUES (?, ?, ?)`, [view.team_id, selectedUser, selectedChannel]);

                try {
                    await client.conversations.join({ channel: selectedChannel });
                } catch (error) {
                    console.warn(`Bot không thể tham gia kênh ${selectedChannel}:`, error);
                }

                await responseMessage(client, selectedChannel, `<@${requesterID}> đưa <@${selectedUser}> làm quản trị viên của kênh.`);
            } else {
                return await responseMessage(client, requesterID, 'Workspace này đã có kênh điểm danh và quản trị viên, hiện chưa thể thay đổi.');
            }
        } catch (error) {
            console.error("Error handling choose administrator modal:", error);
        }
    });
}