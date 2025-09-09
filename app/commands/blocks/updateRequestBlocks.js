const dayjs = require('dayjs');
const { periodOptions, durationOptions, periodMapOptions, getLabelFromValue, getPeriodInfo } = require('../../../services/modalOptions');
const { DMY_FORMAT, YMD_FORMAT } = require('../../../services/formatDate');
const { today } = require('../../../services/utils');

const getRequestOptions = async (db, workspaceId, userId) => {
    const [requestList] = await db.execute(
        `SELECT * FROM leave_requests 
        WHERE workspace_id = ? AND user_id = ? AND leave_day >= ? AND request_status != ?`,
        [workspaceId, userId, today.format(YMD_FORMAT), 'disabled']
    );

    const requestListFormat = requestList.map(req => ({
        label: `${getLabelFromValue(req.leave_period)} ${dayjs(req.leave_day).format(DMY_FORMAT)}`,
        value: `${getLabelFromValue(req.leave_period)} ${dayjs(req.leave_day).format(DMY_FORMAT)}`
    }));
    return requestListFormat.map(req => ({
        text: { type: 'plain_text', text: req.label },
        value: req.value
    }));
};

const getPeriodOptions = (selectedRequest) => {
    const periodRequest = selectedRequest.value.split(' ').slice(0, -1).join(' ');
    const { leavePeriod } = periodMapOptions[periodRequest];

    const periodPart = leavePeriod.split('_')[1];
    const updatePeriodOptions = periodOptions.filter(p => p.value.includes(periodPart) || p.value.includes('day'));

    return { periodPart, updatePeriodOptions };
}

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

const updateDurationBlock = (options) => ({
    type: 'input',
    block_id: 'update_duration',
    dispatch_action: false,
    label: { type: 'plain_text', text: 'Thời gian nghỉ' },
    element: {
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
        updatePeriodBlock(updatePeriodOptions)
    ];

    if (!isFull) {
        blocks.push(updateDurationBlock(durationOptions));
    }

    return { blocks, fullDurationOption };
};

module.exports = { getRequestOptions, getPeriodOptions, buildModal, buildBlocks };