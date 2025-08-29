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

function getLabelFromValue(val) {
    return Object.entries(periodMapOptions).find(([label, value]) => value.leavePeriod === val)?.[0] || null;
}

function capitalizeFirstLetter(period) {
    return period.charAt(0).toUpperCase() + period.slice(1);
}

function formatPeriod(period) {
    const map = {
        start_morning: "Đầu buổi sáng",
        end_morning: "Cuối buổi sáng",
        full_morning: "Cả buổi sáng",
        start_afternoon: "Đầu buổi chiều",
        end_afternoon: "Cuối buổi chiều",
        full_afternoon: "Cả buổi chiều",
        full_day: "Cả ngày",
    };
    return map[period] || period;
}

function formatDuration(duration) {
    if (duration < 1) {
        return `${Math.round(duration * 60)} phút`;
    }

    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);

    let result = '';
    if (hours > 0) result += `${hours} giờ`;
    if (minutes > 0) result += ` ${minutes} phút`;

    return result.trim();
}

const formatOptions = (map, key) => Object.entries(map).map(([label, value]) => ({
    text: { type: 'plain_text', text: label },
    value: value[key]
}));

const getPeriodInfo = (periodValue) => {
    const period = Object.values(periodMapOptions).find(p => p.leavePeriod === periodValue);
    return {
        isFull: periodValue.includes('full'),
        fullDurationOption: period ? period.leaveDuration : ""
    };
};

function calculateDuration(newDuration) {
    const regex = /(?:(\d+)\s*(?:giờ|h))|(?:(\d+)\s*phút)/gi;
    let match;
    let duration = 0;
    let matched = false;

    while ((match = regex.exec(newDuration)) !== null) {
        matched = true;
        if (match[1]) {
            duration += parseFloat(match[1]);
        } else if (match[2]) {
            duration += parseFloat(match[2]) / 60;
        }
    }

    if (!matched) {
        console.log("Không đúng định dạng thời gian!");
        return;
    }

    return parseFloat(duration.toFixed(2));
}

async function responseMessage(client, channelId, text, threadTs = null) {
    const payload = {
        channel: channelId,
        text: text
    }
    if (threadTs && /^\d+\.\d+$/.test(threadTs.toString())) {
        payload.thread_ts = threadTs.toString();
    }
    return await client.chat.postMessage(payload);
}

async function getLeaveStatistic(db, workspaceId, userId, month, year) {
    return await db.execute(
        `SELECT * FROM leave_requests 
            WHERE workspace_id = ? AND user_id = ? AND MONTH(leave_day) = ? AND YEAR(leave_day) = ? AND request_status = ?`,
        [workspaceId, userId, month, year, 'confirmed']);
}

async function getInfoToRequest(db, workspaceId) {
    return await db.execute(`SELECT admin_id, channel_id from admins where workspace_id = ?`, [workspaceId]);
}

async function checkExistRequest(db, workspaceId, userId, leaveDay, leavePeriod) {
    return await db.execute(
        `SELECT * FROM leave_requests 
            WHERE workspace_id = ? AND user_id = ? AND leave_day = ? AND leave_period LIKE ?`,
        [workspaceId, userId, leaveDay, `%${leavePeriod.split("_")[1]}%`]
    );
}

async function insertLeaveRequest(db, workspaceId, userId, leaveDay, leavePeriod, leaveDuration, leaveReason, timestamp, receiveTime) {
    await db.execute(
        `INSERT INTO leave_requests 
            (workspace_id, user_id, leave_day, leave_period, leave_duration, leave_reason, timestamp, request_status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [workspaceId, userId, leaveDay, leavePeriod, leaveDuration, leaveReason, timestamp, 'pending', receiveTime, receiveTime]
    );
}

async function confirmLeaveRequest(db, workspaceId, receiveTime, userId, timestamp) {
    await db.execute(
        `UPDATE leave_requests
            SET request_status = ?, updated_at = ?
            WHERE workspace_id = ? AND user_id = ? AND timestamp = ?`,
        ['confirmed', receiveTime, workspaceId, userId, timestamp]
    );
}

async function disableLeaveRequest(db, workspaceId, receiveTime, userId, leaveDay, period, timestamp) {
    if (period === 'day') {
        await db.execute(
            `UPDATE leave_requests 
                SET request_status = ?, updated_at = ?
                WHERE workspace_id = ? AND user_id = ? AND leave_day = ? AND timestamp <> ?`,
            ['disabled', receiveTime, workspaceId, userId, leaveDay, timestamp]
        );
    } else {
        await db.execute(
            `UPDATE leave_requests 
                SET request_status = ?, updated_at = ?
                WHERE workspace_id = ? AND user_id = ? AND leave_day = ? AND leave_period LIKE ? AND timestamp <> ?`,
            ['disabled', receiveTime, workspaceId, userId, leaveDay, `%${period}%`, timestamp]
        );
    }
}

async function attendanceExport(db, workspaceId, userId, month, year) {
    return await db.execute(
        `SELECT * FROM leave_requests 
            WHERE workspace_id = ? AND user_id = ? AND MONTH(leave_day) = ? AND YEAR(leave_day) = ? AND request_status = ? ORDER BY leave_day`,
        [workspaceId, userId, month, year, 'confirmed']);
}

module.exports = {
    durationMapOptions,
    periodMapOptions,
    reasonMapOptions,
    getLabelFromValue,
    capitalizeFirstLetter,
    formatPeriod,
    formatDuration,
    formatOptions,
    getPeriodInfo,
    calculateDuration,
    responseMessage,
    getLeaveStatistic,
    getInfoToRequest,
    checkExistRequest,
    insertLeaveRequest,
    confirmLeaveRequest,
    disableLeaveRequest,
    attendanceExport
}