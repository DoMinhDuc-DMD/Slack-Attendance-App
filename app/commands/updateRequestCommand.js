const dayjs = require("dayjs");
const { DMY_FORMAT } = require("../../services/formatDate");
const { getLabelFromValue, periodMapOptions, responseMessage, durationMapOptions } = require("../../services/utils");

module.exports = (app, db) => {
    const getRequestOptions = async (workspaceId, userId) => {
        const [requestList] = await db.execute(`SELECT * FROM leave_requests WHERE workspace_id = ? AND user_id = ? AND request_status != ?`, [workspaceId, userId, 'disabled']);
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
            const userId = command.user_id;
            const workspaceId = command.team_id;
            const requestOptions = await getRequestOptions(workspaceId, userId);

            if (requestOptions.length === 0) {
                return await responseMessage(client, userId, `Bạn chưa có yêu cầu xin nghỉ nào để cập nhật. Hãy đăng ký nghỉ trước!`);
            }

            await client.views.open({
                trigger_id: command.trigger_id,
                view: {
                    type: 'modal',
                    callback_id: 'update_request_modal',
                    private_metadata: JSON.stringify({ workspaceId, userId }),
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
            const { workspaceId, userId } = JSON.parse(body.view.private_metadata);
            const requestOptions = await getRequestOptions(workspaceId, userId);
            const periodOptions = getPeriodOptions();

            const selectedRequest = body.actions[0].selected_option.value;

            const periodRequest = selectedRequest.split(" ").slice(0, -1).join(" ");
            const period = periodMapOptions[periodRequest].leavePeriod.split("_")[1];

            const updatePeriodOptions = periodOptions.filter(p => p.value.includes(period) || p.value.includes('day'));

            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: {
                    type: 'modal',
                    callback_id: 'update_request_modal',
                    private_metadata: JSON.stringify({ workspaceId, userId, updatePeriodOptions }),
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
            const { workspaceId, userId, updatePeriodOptions } = JSON.parse(body.view.private_metadata);
            const requestOptions = await getRequestOptions(workspaceId, userId);

            const selectedPeriod = body.actions[0].selected_option.value;
            const [type] = selectedPeriod.split('_');

            const initialDuration = Object.values(periodMapOptions).find(period => period.leavePeriod === selectedPeriod)?.leaveDuration;
            const durationOptions = Object.entries(durationMapOptions).map(([label, value]) => ({
                text: { type: 'plain_text', text: label },
                value: value.leaveDuration
            }));

            await client.views.update({
                view_id: body.view.id,
                hash: body.view.hash,
                view: {
                    type: 'modal',
                    callback_id: 'update_request_modal',
                    private_metadata: JSON.stringify({ workspaceId, userId, updatePeriodOptions, initialDuration }),
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
                        {
                            type: 'input',
                            block_id: 'update_duration',
                            dispatch_action: false,
                            label: { type: 'plain_text', text: 'Thời gian nghỉ' },
                            element: type === 'full' ? {
                                type: 'plain_text_input',
                                action_id: 'update_duration_input',
                                initial_value: initialDuration
                            } : {
                                type: 'static_select',
                                action_id: 'update_duration_input',
                                placeholder: { type: 'plain_text', text: 'Chọn khoảng thời gian nghỉ mới' },
                                options: durationOptions
                            },
                        }
                    ]
                }
            });
        } catch (error) {
            console.error("Error handling leave request:", error);
        }
    });
};
