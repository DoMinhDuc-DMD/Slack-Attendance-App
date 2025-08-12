const { periodMapOptions } = require("../services/utils");

module.exports = (app) => {
    app.command('/xinnghi', async ({ command, ack, client }) => {
        await ack();

        try {
            const userId = command.user_id;
            const periodOptions = Object.entries(periodMapOptions).map(([label, value]) => ({
                text: { type: 'plain_text', text: label },
                value: value.leavePeriod
            }));

            await client.views.open({
                trigger_id: command.trigger_id,
                view: {
                    type: 'modal',
                    callback_id: 'new_request_modal',
                    private_metadata: JSON.stringify({ userId, initialDuration: "" }),
                    title: { type: 'plain_text', text: 'Xin phép nghỉ' },
                    submit: { type: 'plain_text', text: 'Gửi yêu cầu' },
                    close: { type: 'plain_text', text: 'Hủy' },
                    blocks: [
                        {
                            type: 'input',
                            block_id: 'new_datepicker',
                            label: { type: 'plain_text', text: 'Ngày nghỉ' },
                            element: {
                                type: 'datepicker',
                                action_id: 'new_datepicker_input',
                                placeholder: { type: 'plain_text', text: 'Chọn ngày xin nghỉ' }
                            }
                        },
                        {
                            type: 'input',
                            block_id: 'new_period',
                            dispatch_action: true,
                            label: { type: 'plain_text', text: 'Buổi nghỉ' },
                            element: {
                                type: 'static_select',
                                action_id: 'new_period_input',
                                placeholder: { type: 'plain_text', text: 'Chọn buổi nghỉ' },
                                options: periodOptions
                            },
                        },
                        {
                            type: 'input',
                            block_id: 'new_duration',
                            label: { type: 'plain_text', text: 'Thời gian nghỉ' },
                            element: {
                                type: 'plain_text_input',
                                action_id: 'new_duration_input',
                                placeholder: { type: 'plain_text', text: 'Nhập thời gian nghỉ (VD: 1h, 30 phút)' }
                            },
                        }
                    ]
                }
            });
        } catch (error) {
            console.error("Error handling leave request:", error);
        }
    });

    app.action('new_period_input', async ({ body, ack, client }) => {
        await ack();

        const metadata = JSON.parse(body.view.private_metadata);

        const selectedValue = body.actions[0].selected_option.value;
        const [type] = selectedValue.split('_');

        let initialDuration = "";
        if (type === 'full') {
            initialDuration = Object.values(periodMapOptions).find(period => period.leavePeriod === selectedValue)?.leaveDuration;
        }

        await client.views.update({
            view_id: body.view.id,
            hash: body.view.hash,
            view: {
                type: 'modal',
                callback_id: 'new_request_modal',
                private_metadata: JSON.stringify({ ...metadata, initialDuration }),
                title: { type: 'plain_text', text: 'Xin phép nghỉ' },
                submit: { type: 'plain_text', text: 'Gửi yêu cầu' },
                close: { type: 'plain_text', text: 'Hủy' },
                blocks: [
                    {
                        type: 'input',
                        block_id: 'new_datepicker',
                        label: { type: 'plain_text', text: 'Ngày nghỉ' },
                        element: {
                            type: 'datepicker',
                            action_id: 'new_datepicker_input',
                            placeholder: { type: 'plain_text', text: 'Chọn ngày xin nghỉ' }
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'new_period',
                        dispatch_action: true,
                        label: { type: 'plain_text', text: 'Buổi nghỉ' },
                        element: {
                            type: 'static_select',
                            action_id: 'new_period_input',
                            placeholder: { type: 'plain_text', text: 'Chọn buổi nghỉ' },
                            options: Object.entries(periodMapOptions).map(([label, value]) => ({
                                text: { type: 'plain_text', text: label },
                                value: value.leavePeriod
                            })),
                            initial_option: {
                                text: { type: 'plain_text', text: body.actions[0].selected_option.text.text },
                                value: selectedValue
                            }
                        },
                    },
                    {
                        type: 'input',
                        block_id: 'new_duration',
                        label: { type: 'plain_text', text: 'Thời gian nghỉ' },
                        element: {
                            type: 'plain_text_input',
                            action_id: 'new_duration_input',
                            placeholder: { type: 'plain_text', text: 'Nhập thời gian nghỉ (VD: 1h, 30 phút)' },
                            initial_value: initialDuration
                        },
                    }
                ]
            }
        });
    });
};
