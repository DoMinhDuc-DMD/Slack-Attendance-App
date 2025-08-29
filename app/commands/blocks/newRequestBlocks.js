const dayjs = require("dayjs");
const { YMD_FORMAT } = require("../../../services/formatDate");
const { periodMapOptions, durationMapOptions, reasonMapOptions, formatOptions } = require("../../../services/utils");

const periodOptions = formatOptions(periodMapOptions, 'leavePeriod');
const durationOptions = formatOptions(durationMapOptions, 'leaveDuration');
const reasonOptions = formatOptions(reasonMapOptions, 'leaveReason');

const defaultOptions = {
    period: periodOptions[0],
    duration: durationOptions[1],
    reason: reasonOptions[0]
};

const getPeriodInfo = (periodValue) => {
    const period = Object.values(periodMapOptions).find(p => p.leavePeriod === periodValue);
    return {
        isFull: periodValue.includes('full'),
        fullDurationOption: period ? period.leaveDuration : ""
    };
};

const datePickerBlock = {
    type: 'input',
    block_id: 'new_datepicker',
    label: { type: 'plain_text', text: 'Ngày nghỉ' },
    element: {
        type: 'datepicker',
        action_id: 'new_datepicker_input',
        placeholder: { type: 'plain_text', text: 'Chọn ngày xin nghỉ' },
        initial_date: dayjs().format(YMD_FORMAT)
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
        placeholder: { type: 'plain_text', text: 'Chọn buổi nghỉ' },
        options,
        initial_option: initialOption
    },
});

const durationBlock = (isFull, fullOption, options, initialOption) => ({
    type: 'input',
    block_id: 'new_duration',
    label: { type: 'plain_text', text: 'Thời gian nghỉ' },
    element: isFull ? {
        type: 'plain_text_input',
        action_id: 'new_duration_input',
        initial_value: fullOption
    } : {
        type: 'static_select',
        action_id: 'new_duration_input',
        placeholder: { type: 'plain_text', text: 'Chọn khoảng thời gian nghỉ' },
        options,
        initial_option: initialOption
    },
});

const reasonSelectBlock = (options, initial) => ({
    type: 'input',
    block_id: 'new_reason_select',
    dispatch_action: true,
    label: { type: 'plain_text', text: 'Lý do nghỉ' },
    element: {
        type: 'static_select',
        action_id: 'new_reason_select_input',
        placeholder: { type: 'plain_text', text: 'Chọn lý do nghỉ' },
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
        placeholder: {
            type: "plain_text",
            text: "Lý do khác"
        }
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
        durationBlock(isFull, fullDurationOption, durationOptions, selectedDuration),
        reasonSelectBlock(reasonOptions, selectedReason)
    ];

    if (selectedReason.value === 'other') {
        blocks.push(reasonInputBlock);
    }

    return { blocks, fullDurationOption };
};

module.exports = { defaultOptions, buildModal, buildBlocks };