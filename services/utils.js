const periodMapOptions = {
    'Đầu buổi sáng': { leavePeriod: 'start_morning' },
    'Cuối buổi sáng': { leavePeriod: 'end_morning' },
    'Cả buổi sáng': { leavePeriod: 'full_morning', leaveDuration: '3 giờ 30 phút' },
    'Đầu buổi chiều': { leavePeriod: 'start_afternoon' },
    'Cuối buổi chiều': { leavePeriod: 'end_afternoon' },
    'Cả buổi chiều': { leavePeriod: 'full_afternoon', leaveDuration: '4 giờ 30 phút' },
    'Cả ngày': { leavePeriod: 'full_day', leaveDuration: '8 giờ' },
};

function getLabelFromValue(val) {
    return Object.entries(periodMapOptions).find(([label, value]) => value.leavePeriod === val)?.[0] || null;
}

function capitalizeFirstLetter(period) {
    return period.charAt(0).toUpperCase() + period.slice(1);
}

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

async function checkExistRequest(db, userId, leaveDay, leavePeriod) {
    return await db.execute(
        `SELECT * FROM leave_requests 
            WHERE user_id = ? AND leave_day = ? AND leave_period LIKE ?`,
        [userId, leaveDay, `%${leavePeriod.split("_")[1]}%`]
    );
}

async function insertLeaveRequest(db, userId, leaveDay, leavePeriod, leaveDuration, timestamp, receiveTime) {
    await db.execute(
        `INSERT INTO leave_requests 
            (user_id, leave_day, leave_period, leave_duration, timestamp, request_status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, leaveDay, leavePeriod, leaveDuration, timestamp, 'pending', receiveTime, receiveTime]
    );
}

async function confirmLeaveRequest(db, receiveTime, userId, timestamp) {
    await db.execute(
        `UPDATE leave_requests
            SET request_status = ?, updated_at = ?
            WHERE user_id = ? AND timestamp = ?`,
        ['confirmed', receiveTime, userId, timestamp]
    );
}

async function disableLeaveRequest(db, receiveTime, userId, leaveDay, period, timestamp) {
    if (period === 'day') {
        await db.execute(
            `UPDATE leave_requests 
                SET request_status = ?, updated_at = ?
                WHERE user_id = ? AND leave_day = ? AND timestamp <> ?`,
            ['disabled', receiveTime, userId, leaveDay, timestamp]
        );
    } else {
        await db.execute(
            `UPDATE leave_requests 
                SET request_status = ?, updated_at = ?
                WHERE user_id = ? AND leave_day = ? AND leave_period LIKE ? AND timestamp <> ?`,
            ['disabled', receiveTime, userId, leaveDay, `%${period}%`, timestamp]
        );
    }
}

module.exports = { periodMapOptions, getLabelFromValue, capitalizeFirstLetter, calculateDuration, responseMessage, checkExistRequest, insertLeaveRequest, confirmLeaveRequest, disableLeaveRequest }