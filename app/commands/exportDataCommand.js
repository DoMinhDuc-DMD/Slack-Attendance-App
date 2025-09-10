const { checkCommandMiddleware, today } = require('../../services/utils');
const { loadingModal } = require('./blocks/loadingModal');

module.exports = (app, db) => {
    app.command('/xuatdulieu', async ({ command, ack, client }) => {
        await ack();

        const checkCommand = await checkCommandMiddleware(db, client, command);
        if (!checkCommand) return;

        const { trigger_id } = command;
        const loadingView = await loadingModal(client, trigger_id, 'Xuất dữ liệu')

        try {
            const currentMonth = today.month() + 1;
            const currentYear = today.year();

            const userList = await client.users.list();
            const users = userList.members.filter(user => !user.is_bot && user.id !== process.env.SLACK_BOT_ID);

            const userOptions = users.map(user => ({
                text: { type: 'plain_text', text: user.real_name || user.name },
                value: user.id
            }));
            const monthOptions = Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                return {
                    text: { type: 'plain_text', text: `Tháng ${month}` },
                    value: month.toString()
                };
            });
            const yearOptions = Array.from({ length: 3 }, (_, i) => {
                const year = currentYear - i;
                return {
                    text: { type: 'plain_text', text: `${year}` },
                    value: year.toString()
                };
            });

            await client.views.update({
                view_id: loadingView.view.id,
                view: {
                    type: 'modal',
                    callback_id: 'export_data_modal',
                    title: { type: 'plain_text', text: 'Xuất dữ liệu' },
                    submit: { type: 'plain_text', text: 'Xuất' },
                    close: { type: 'plain_text', text: 'Huỷ' },
                    blocks: [
                        {
                            type: 'input',
                            block_id: 'user_block',
                            label: { type: 'plain_text', text: 'Chọn nhân viên' },
                            element: {
                                type: 'multi_static_select',
                                action_id: 'user_select',
                                options: userOptions,
                                placeholder: { type: 'plain_text', text: 'Chọn nhân viên' }
                            }
                        },
                        {
                            type: 'input',
                            block_id: 'month_block',
                            label: { type: 'plain_text', text: 'Chọn tháng' },
                            element: {
                                type: 'static_select',
                                action_id: 'month_select',
                                options: monthOptions,
                                initial_option: monthOptions.find(option => option.value === currentMonth.toString())
                            }
                        },
                        {
                            type: 'input',
                            block_id: 'year_block',
                            label: { type: 'plain_text', text: 'Chọn năm' },
                            element: {
                                type: 'static_select',
                                action_id: 'year_select',
                                options: yearOptions,
                                initial_option: yearOptions.find(option => option.value === currentYear.toString())
                            }
                        }
                    ]
                }
            });
        } catch (error) {
            console.error('Error handling export attendance:', error);
        }
    });
}