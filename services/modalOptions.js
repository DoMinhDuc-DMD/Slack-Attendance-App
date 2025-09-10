const periodMapOptions = {
    'Đầu buổi sáng': { leavePeriod: 'start_morning' },
    'Cuối buổi sáng': { leavePeriod: 'end_morning' },
    'Cả buổi sáng': { leavePeriod: 'full_morning', leaveDuration: '3 giờ 30 phút' },
    'Đầu buổi chiều': { leavePeriod: 'start_afternoon' },
    'Cuối buổi chiều': { leavePeriod: 'end_afternoon' },
    'Cả buổi chiều': { leavePeriod: 'full_afternoon', leaveDuration: '4 giờ 30 phút' },
    'Cả ngày': { leavePeriod: 'full_day', leaveDuration: '8 giờ' },
};

const durationMapOptions = {
    '30 phút': { leaveDuration: '30 phút' },
    '1 giờ': { leaveDuration: '1 giờ' },
    '1 giờ 30 phút': { leaveDuration: '1 giờ 30 phút' },
    '2 giờ': { leaveDuration: '2 giờ' },
};

const reasonMapOptions = {
    'Cá nhân': { leaveReason: 'personal' },
    'Gia đình': { leaveReason: 'family' },
    'Ốm': { leaveReason: 'sick' },
    'Hỏng xe': { leaveReason: 'vehicle_issue' },
    'Tắc đường': { leaveReason: 'traffic' },
    'Khác': { leaveReason: 'other' },
};

const formatOptions = (map, key) => Object.entries(map).map(([label, value]) => ({
    text: { type: 'plain_text', text: label },
    value: value[key]
}));

const periodOptions = formatOptions(periodMapOptions, 'leavePeriod');
const durationOptions = formatOptions(durationMapOptions, 'leaveDuration');
const reasonOptions = formatOptions(reasonMapOptions, 'leaveReason');

const getPeriodInfo = (periodValue) => {
    const period = Object.values(periodMapOptions).find(p => p.leavePeriod === periodValue);
    return {
        isFull: periodValue.includes('full'),
        fullDurationOption: period ? period.leaveDuration : ''
    };
};

function getLabelFromValue(val) {
    return Object.entries(periodMapOptions).find(([label, value]) => value.leavePeriod === val)?.[0] || null;
}

module.exports = { periodMapOptions, durationMapOptions, reasonMapOptions, periodOptions, durationOptions, reasonOptions, getPeriodInfo, getLabelFromValue }