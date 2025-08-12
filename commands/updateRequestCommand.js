const dayjs = require("dayjs");
const { DMY_FORMAT } = require("../services/formatDate");
const { getLabelFromValue, periodMapOptions, replyInThread } = require("../services/utils");

module.exports = (app, db) => {
    const getRequestOptions = async (userId) => {
        const [requestList] = await db.execute(`SELECT * FROM leave_requests WHERE user_id = ? AND request_status != 'disabled'`, [userId]);
        const requestListFormat = requestList.map(req => ({
            label: `${getLabelFromValue(req.leave_period)} ${dayjs(req.leave_day).format(DMY_FORMAT)}`,
            value: `${getLabelFromValue(req.leave_period)} ${dayjs(req.leave_day).format(DMY_FORMAT)}`
        }));
        return requestListFormat.map(req => ({
            text: { type: 'plain_text', text: req.label },
            value: req.value
        }));
    };

    const getPeriodOptions = () => Object.entries(periodMapOptions).map(([label, value]) => ({
        text: { type: 'plain_text', text: label },
        value: value.leavePeriod
    }));

    app.command('/capnhatnghi', async ({ command, ack, client }) => {
        await ack();
        try {
            const userId = command.user_id
            const requestOptions = await getRequestOptions(userId);
            const periodOptions = getPeriodOptions();

            if (requestOptions.length === 0) {
                return await replyInThread(client, userId, `Bạn chưa có yêu cầu xin nghỉ nào để cập nhật. Hãy đăng ký nghỉ trước!`);
            }

            await client.views.open({
                trigger_id: command.trigger_id,
                view: {
                    type: 'modal',
                    callback_id: 'update_request_modal',
                    private_metadata: userId,
                    title: { type: 'plain_text', text: 'Cập nhật yêu cầu nghỉ' },
                    submit: { type: 'plain_text', text: 'Gửi yêu cầu' },
                    close: { type: 'plain_text', text: 'Hủy' },
                    blocks: [
                        {
                            type: 'input',
                            block_id: 'update_request',
                            dispatch_action: true,
                            label: { type: 'plain_text', text: 'Yêu cầu nghỉ' },
                            element: {
                                type: 'static_select',
                                action_id: 'update_request_input',
                                placeholder: { type: 'plain_text', text: 'Chọn yêu cầu nghỉ cần cập nhật' },
                                options: requestOptions
                            }
                        },
                        {
                            type: 'input',
                            block_id: 'update_period',
                            dispatch_action: true,
                            label: { type: 'plain_text', text: 'Buổi nghỉ' },
                            element: {
                                type: 'static_select',
                                action_id: 'update_period_input',
                                placeholder: { type: 'plain_text', text: 'Chọn buổi nghỉ mởi' },
                                options: periodOptions
                            },
                        },
                        {
                            type: 'input',
                            block_id: 'update_duration',
                            label: { type: 'plain_text', text: 'Thời gian nghỉ' },
                            element: {
                                type: 'plain_text_input',
                                action_id: 'update_duration_input',
                                placeholder: { type: 'plain_text', text: 'Nhập thời gian nghỉ mới (VD: 1h, 30 phút)' }
                            },
                        }
                    ]
                }
            });
        } catch (error) {
            console.error("Error handling leave request:", error);
        }
    });

    app.action('update_request_input', async ({ body, ack, client }) => {
        await ack();
        try {
            const userId = body.user.id;
            const requestOptions = await getRequestOptions(userId);
            const periodOptions = getPeriodOptions();

            const selectedRequest = body.actions[0].selected_option.value;

            const periodRequest = selectedRequest.split(" ").slice(0, -1).join(" ");
            const period = periodMapOptions[periodRequest].leavePeriod.split("_")[1];

            const updatePeriodOptions = periodOptions.filter(p => p.value.includes(period));

            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: {
                    type: 'modal',
                    callback_id: 'update_request_modal',
                    private_metadata: JSON.stringify({
                        userId,
                        updatePeriodOptions
                    }),
                    title: { type: 'plain_text', text: 'Cập nhật yêu cầu nghỉ' },
                    submit: { type: 'plain_text', text: 'Gửi yêu cầu' },
                    close: { type: 'plain_text', text: 'Hủy' },
                    blocks: [
                        {
                            type: 'input',
                            block_id: 'update_request',
                            dispatch_action: true,
                            label: { type: 'plain_text', text: 'Yêu cầu nghỉ' },
                            element: {
                                type: 'static_select',
                                action_id: 'update_request_input',
                                placeholder: { type: 'plain_text', text: 'Chọn yêu cầu nghỉ cần cập nhật' },
                                options: requestOptions
                            }
                        },
                        {
                            type: 'input',
                            block_id: 'update_period',
                            dispatch_action: true,
                            label: { type: 'plain_text', text: 'Buổi nghỉ' },
                            element: {
                                type: 'static_select',
                                action_id: 'update_period_input',
                                placeholder: { type: 'plain_text', text: 'Chọn buổi nghỉ mởi' },
                                options: updatePeriodOptions
                            },
                        },
                        {
                            type: 'input',
                            block_id: 'update_duration',
                            label: { type: 'plain_text', text: 'Thời gian nghỉ' },
                            element: {
                                type: 'plain_text_input',
                                action_id: 'update_duration_input',
                                placeholder: { type: 'plain_text', text: 'Nhập thời gian nghỉ mới (VD: 1h, 30 phút)' }
                            },
                        }
                    ]
                }
            });
        } catch (error) {
            console.error("Error handling leave request:", error);
        }
    });

    app.action('update_period_input', async ({ body, ack, client }) => {
        await ack();
        try {
            const metadata = JSON.parse(body.view.private_metadata);

            const userId = metadata.userId;
            const updatePeriodOptions = metadata.updatePeriodOptions;

            const requestOptions = await getRequestOptions(userId);
            const selectedPeriod = body.actions[0].selected_option.value;

            const [type] = selectedPeriod.split('_');

            let durationBlock = {
                type: 'input',
                block_id: 'update_duration',
                label: { type: 'plain_text', text: 'Thời gian nghỉ' },
                element: {
                    type: 'plain_text_input',
                    action_id: 'update_duration_input',
                    placeholder: { type: 'plain_text', text: 'Nhập thời gian nghỉ mới (VD: 1h, 30 phút)' }
                },
            };

            let initialDuration = "";
            if (type === 'full') {
                initialDuration = Object.values(periodMapOptions).find(period => period.leavePeriod === selectedPeriod)?.leaveDuration;
                durationBlock.element.initial_value = initialDuration;
            }

            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: {
                    type: 'modal',
                    callback_id: 'update_request_modal',
                    private_metadata: JSON.stringify({ userId, initialDuration }),
                    title: { type: 'plain_text', text: 'Cập nhật yêu cầu nghỉ' },
                    submit: { type: 'plain_text', text: 'Gửi yêu cầu' },
                    close: { type: 'plain_text', text: 'Hủy' },
                    blocks: [
                        {
                            type: 'input',
                            block_id: 'update_request',
                            dispatch_action: true,
                            label: { type: 'plain_text', text: 'Yêu cầu nghỉ' },
                            element: {
                                type: 'static_select',
                                action_id: 'update_request_input',
                                placeholder: { type: 'plain_text', text: 'Chọn yêu cầu nghỉ cần cập nhật' },
                                options: requestOptions
                            }
                        },
                        {
                            type: 'input',
                            block_id: 'update_period',
                            dispatch_action: true,
                            label: { type: 'plain_text', text: 'Buổi nghỉ' },
                            element: {
                                type: 'static_select',
                                action_id: 'update_period_input',
                                placeholder: { type: 'plain_text', text: 'Chọn buổi nghỉ mởi' },
                                options: updatePeriodOptions,
                                initial_option: updatePeriodOptions.find(opt => opt.value === selectedPeriod)
                            },
                        },
                        durationBlock
                    ]
                }
            });
        } catch (error) {
            console.error("Error handling leave request:", error);
        }
    });
};
