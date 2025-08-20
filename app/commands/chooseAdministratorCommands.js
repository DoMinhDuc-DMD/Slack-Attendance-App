module.exports = (app) => {
    app.command('/chonquantri', async ({ command, ack, client }) => {
        await ack();

        try {
            const userList = await client.users.list();
            const users = userList.members.filter(user => !user.is_bot && user.id !== process.env.SLACK_BOT_ID);

            const userOptions = users.map(user => ({
                text: { type: 'plain_text', text: user.real_name || user.name },
                value: user.id
            }));

            const channelList = await client.conversations.list();
            const channels = channelList.channels.filter(channel => channel.is_member && channel.is_channel);
            const channelOptions = channels.map(channel => ({
                text: { type: 'plain_text', text: channel.name },
                value: channel.id
            }))

            await client.views.open({
                trigger_id: command.trigger_id,
                view: {
                    type: 'modal',
                    callback_id: 'choose_administrator_modal',
                    title: { type: 'plain_text', text: 'Chọn thông tin quản trị' },
                    submit: { type: 'plain_text', text: 'Xác nhận' },
                    close: { type: 'plain_text', text: 'Huỷ' },
                    blocks: [
                        {
                            type: 'input',
                            block_id: 'user_block',
                            label: { type: 'plain_text', text: 'Chọn quản trị viên:' },
                            element: {
                                type: 'static_select',
                                action_id: 'user_select',
                                options: userOptions,
                                placeholder: { type: 'plain_text', text: 'Chọn một người dùng' }
                            }
                        },
                        {
                            type: 'input',
                            block_id: 'channel_block',
                            label: { type: 'plain_text', text: 'Chọn kênh:' },
                            element: {
                                type: 'static_select',
                                action_id: 'channel_select',
                                options: channelOptions,
                                placeholder: { type: 'plain_text', text: 'Chọn một kênh' }
                            }
                        }
                    ]
                }
            });
        } catch (error) {
            console.error("Error handling choose administrator command:", error);
        }
    })
}