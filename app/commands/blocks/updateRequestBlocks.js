const dayjs = require("dayjs");
const { periodMapOptions, getLabelFromValue, formatOptions, durationMapOptions, getPeriodInfo } = require("../../../services/utils");
const { DMY_FORMAT } = require("../../../services/formatDate");

const getRequestOptions = async (db, workspaceId, userId) => {
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

const periodOptions = formatOptions(periodMapOptions, 'leavePeriod');
const durationOptions = formatOptions(durationMapOptions, 'leaveDuration');

const requestBlock = (options, initialOption) => ({
    type: 'input',
    block_id: 'update_request',
    dispatch_action: true,
    label: { type: 'plain_text', text: 'Yêu cầu nghỉ' },
    element: {
        type: 'static_select',
        action_id: 'update_request_input',
        placeholder: { type: 'plain_text', text: 'Chọn yêu cầu nghỉ cần cập nhật' },
        options,
        initial_option: initialOption
    }
});

const updatePeriodBlock = (options) => ({
    type: 'input',
    block_id: 'update_period',
    dispatch_action: true,
    label: { type: 'plain_text', text: 'Buổi nghỉ' },
    element: {
        type: 'static_select',
        action_id: 'update_period_input',
        placeholder: { type: 'plain_text', text: 'Chọn buổi nghỉ mới' },
        options
    },
});

const updateDurationBlock = (isFull, fullOption, options) => ({
    type: 'input',
    block_id: 'update_duration',
    dispatch_action: false,
    label: { type: 'plain_text', text: 'Thời gian nghỉ' },
    element: isFull ? {
        type: 'plain_text_input',
        action_id: 'update_duration_input',
        initial_value: fullOption
    } : {
        type: 'static_select',
        action_id: 'update_duration_input',
        placeholder: { type: 'plain_text', text: 'Chọn khoảng thời gian nghỉ mới' },
        options
    },
})

function buildModal(metadata, blocks) {
    return {
        type: 'modal',
        callback_id: 'update_request_modal',
        private_metadata: metadata,
        title: { type: 'plain_text', text: 'Cập nhật yêu cầu nghỉ' },
        submit: { type: 'plain_text', text: 'Gửi yêu cầu' },
        close: { type: 'plain_text', text: 'Hủy' },
        blocks
    };
};

function buildBlocks(periodValue, requestOptions, selectedRequest, updatePeriodOptions) {
    const { isFull, fullDurationOption } = getPeriodInfo(periodValue);

    const blocks = [
        requestBlock(requestOptions, selectedRequest),
        updatePeriodBlock(updatePeriodOptions),
        updateDurationBlock(isFull, fullDurationOption, durationOptions)
    ];

    return { blocks, fullDurationOption };
};

module.exports = {
    periodOptions,
    durationOptions,
    getRequestOptions,
    requestBlock,
    updatePeriodBlock,
    updateDurationBlock,
    buildModal,
    buildBlocks
};