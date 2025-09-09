const dayjs = require("dayjs");
const { checkCommandMiddleware } = require("../../services/utils");

module.exports = (app, db) => {
    app.command('/thongkenghi', async ({ command, ack, client }) => {
        await ack();

        const checkCommand = await checkCommandMiddleware(db, client, command);
        if (!checkCommand) return;

        try {
            const currentMonth = dayjs().month() + 1;
            const currentYear = dayjs().year();

            const userList = await client.users.list();
            const users = userList.members.filter(user => !user.is_bot && user.id !== process.env.SLACK_BOT_ID);

            const userOptions = users.map(user => ({
                text: { type: 'plain_text', text: user.real_name || user.name },
                value: user.id
            }));
            const monthOptions = Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                return {
                    text: { type: "plain_text", text: `Tháng ${month}` },
                    value: month.toString()
                };
            });
            const yearOptions = Array.from({ length: 5 }, (_, i) => {
                const year = currentYear - i;
                return {
                    text: { type: "plain_text", text: `${year}` },
                    value: year.toString()
                };
            });

            await client.views.open({
                trigger_id: command.trigger_id,
                view: {
                    type: "modal",
                    callback_id: "leave_statistic_modal",
                    title: { type: "plain_text", text: "Thống kê nghỉ" },
                    submit: { type: "plain_text", text: "Xem" },
                    close: { type: "plain_text", text: "Huỷ" },
                    blocks: [
                        {
                            type: "input",
                            block_id: "user_block",
                            label: { type: "plain_text", text: "Chọn nhân viên" },
                            element: {
                                type: "multi_static_select",
                                action_id: "user_select",
                                options: userOptions,
                                placeholder: { type: 'plain_text', text: 'Chọn nhân viên' }
                            }
                        },
                        {
                            type: "input",
                            block_id: "month_block",
                            label: { type: "plain_text", text: "Chọn tháng" },
                            element: {
                                type: "static_select",
                                action_id: "month_select",
                                options: monthOptions,
                                initial_option: monthOptions.find(option => option.value === currentMonth.toString())
                            }
                        },
                        {
                            type: "input",
                            block_id: "year_block",
                            label: { type: "plain_text", text: "Chọn năm" },
                            element: {
                                type: "static_select",
                                action_id: "year_select",
                                options: yearOptions,
                                initial_option: yearOptions.find(option => option.value === currentYear.toString())
                            }
                        }
                    ]
                }
            });
        } catch (error) {
            console.error("Error opening modal:", error);
        }
    });
}