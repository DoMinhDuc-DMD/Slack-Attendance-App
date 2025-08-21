module.exports = (app) => {
    app.command('/chonquantri', async ({ command, ack, client }) => {
        await ack();

        try {
            const channelList = await client.conversations.list();
            const channels = channelList.channels.filter(channel => channel.is_channel);
            const channelOptions = channels.map(channel => ({
                text: { type: 'plain_text', text: channel.name },
                value: channel.id
            }));

            await client.views.open({
                trigger_id: command.trigger_id,
                view: {
                    type: 'modal',
                    callback_id: 'choose_administrator_modal',
                    private_metadata: JSON.stringify({ channelOptions }),
                    title: { type: 'plain_text', text: 'Chọn thông tin quản trị' },
                    submit: { type: 'plain_text', text: 'Xác nhận' },
                    close: { type: 'plain_text', text: 'Huỷ' },
                    blocks: [
                        {
                            type: 'input',
                            block_id: 'channel_block',
                            dispatch_action: true,
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
    });

    app.action('channel_select', async ({ ack, body, client }) => {
        await ack();

        try {
            const channelOptions = JSON.parse(body.view.private_metadata).channelOptions;
            const selectedChannelId = body.actions[0].selected_option.value;

            const memberList = await client.conversations.members({
                channel: selectedChannelId
            });

            const userList = await Promise.all(memberList.members.map(member => client.users.info({ user: member })));

            const userOptions = userList
                .filter(user => !user.user.is_bot && user.user.id !== process.env.SLACK_BOT_ID)
                .map(user => ({
                    text: { type: 'plain_text', text: user.user.real_name || user.user.name },
                    value: user.user.id
                }));

            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: {
                    type: 'modal',
                    callback_id: 'choose_administrator_modal',
                    title: { type: 'plain_text', text: 'Chọn thông tin quản trị' },
                    submit: { type: 'plain_text', text: 'Xác nhận' },
                    close: { type: 'plain_text', text: 'Huỷ' },
                    blocks: [
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
                        },
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
                        }
                    ]
                }
            });
        } catch (error) {
            console.error("Error handling channel select action:", error);
        }
    })
}