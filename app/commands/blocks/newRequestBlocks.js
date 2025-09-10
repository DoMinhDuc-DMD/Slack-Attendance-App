const { YMD_FORMAT } = require('../../../services/formatDate');
const { periodOptions, durationOptions, reasonOptions, getPeriodInfo } = require('../../../services/modalOptions');
const { today } = require('../../../services/utils');

const defaultOptions = {
    period: periodOptions[0],
    duration: durationOptions[1],
    reason: reasonOptions[0]
};

const datePickerBlock = {
    type: 'input',
    block_id: 'new_datepicker',
    label: { type: 'plain_text', text: 'Ngày nghỉ' },
    element: {
        type: 'datepicker',
        action_id: 'new_datepicker_input',
        initial_date: today.format(YMD_FORMAT)
    }
};

const periodBlock = (options, initialOption) => ({
    type: 'input',
    block_id: 'new_period',
    dispatch_action: true,
    label: { type: 'plain_text', text: 'Buổi nghỉ' },
    element: {
        type: 'static_select',
        action_id: 'new_period_input',
        options,
        initial_option: initialOption
    },
});

const durationBlock = (options, initialOption) => ({
    type: 'input',
    block_id: 'new_duration',
    label: { type: 'plain_text', text: 'Thời gian nghỉ' },
    element: {
        type: 'static_select',
        action_id: 'new_duration_input',
        options,
        initial_option: initialOption
    }
});

const reasonSelectBlock = (options, initial) => ({
    type: 'input',
    block_id: 'new_reason_select',
    dispatch_action: true,
    label: { type: 'plain_text', text: 'Lý do nghỉ' },
    element: {
        type: 'static_select',
        action_id: 'new_reason_select_input',
        options,
        initial_option: initial
    }
});

const reasonInputBlock = {
    type: 'input',
    block_id: 'new_reason_input',
    label: { type: 'plain_text', text: 'Nhập lý do' },
    element: {
        type: 'plain_text_input',
        action_id: 'new_reason_input_input',
        placeholder: { type: 'plain_text', text: 'Lý do khác' }
    }
};

function buildModal(metadata, blocks) {
    return {
        type: 'modal',
        callback_id: 'new_request_modal',
        private_metadata: metadata,
        title: { type: 'plain_text', text: 'Xin phép nghỉ' },
        submit: { type: 'plain_text', text: 'Gửi yêu cầu' },
        close: { type: 'plain_text', text: 'Hủy' },
        blocks
    };
};

function buildBlocks(selectedPeriod, selectedDuration, selectedReason) {
    const { isFull, fullDurationOption } = getPeriodInfo(selectedPeriod.value);

    const blocks = [
        datePickerBlock,
        periodBlock(periodOptions, selectedPeriod),
        reasonSelectBlock(reasonOptions, selectedReason)
    ];

    if (!isFull) {
        blocks.splice(2, 0, durationBlock(durationOptions, selectedDuration));
    }

    if (selectedReason.value === 'other') {
        blocks.push(reasonInputBlock);
    }

    return { blocks, fullDurationOption };
};

module.exports = { defaultOptions, buildModal, buildBlocks };