const dayjs = require("dayjs");
const { YMD_FORMAT, DMY_FORMAT } = require("./formatDate");
const { today } = require("./utils");

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

// Update functions
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

module.exports = {
    periodMapOptions,
    durationMapOptions,
    reasonMapOptions,
    periodOptions,
    durationOptions,
    reasonOptions,
    getPeriodInfo,
    getLabelFromValue,
    getRequestOptions,
    getPeriodOptions
}