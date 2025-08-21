const { responseMessage } = require("../../services/utils");

module.exports = (app, db) => {
    app.view('choose_administrator_modal', async ({ ack, view, client }) => {
        await ack();

        try {
            const selectedUserId = view.state.values.user_block.user_select.selected_option.value;
            const selectedChannel = view.state.values.channel_block.channel_select.selected_option.value;

            await db.execute(`UPDATE workspace SET attendance_admin_id = ?, attendance_channel_id = ? WHERE team_id = ?`, [selectedUserId, selectedChannel, view.team_id]);

            try {
                await client.conversations.join({
                    channel: selectedChannel
                });
            } catch (error) {
                console.warn(`Bot không thể tham gia kênh ${selectedChannel}:`, error);
            }

            await responseMessage(client, selectedChannel, 'Cập nhật thông tin quản trị thành công!');
        } catch (error) {
            console.error("Error handling choose administrator modal:", error);
        }
    });
}