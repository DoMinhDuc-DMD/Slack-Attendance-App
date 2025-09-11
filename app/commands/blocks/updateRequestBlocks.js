const { getPeriodInfo, durationOptions } = require('../../../services/modalOptions');

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

module.exports = { buildModal, buildBlocks };