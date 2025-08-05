const periodMapGet = {
    'full_morning': ['start_morning', 'end_morning'],
    'full_afternoon': ['start_afternoon', 'end_afternoon'],
    'full_day': [
        'full_morning', 'full_afternoon',
        'start_morning', 'end_morning',
        'start_afternoon', 'end_afternoon'
    ]
}

const periodMap = (durationValue) => ({
    'đầu buổi sáng': { leavePeriod: 'start_morning', leaveDuration: durationValue },
    'cuối buổi sáng': { leavePeriod: 'end_morning', leaveDuration: durationValue },
    'cả buổi sáng': { leavePeriod: 'full_morning', leaveDuration: 3.5 },

    'đầu buổi chiều': { leavePeriod: 'start_afternoon', leaveDuration: durationValue },
    'cuối buổi chiều': { leavePeriod: 'end_afternoon', leaveDuration: durationValue },
    'cả buổi chiều': { leavePeriod: 'full_afternoon', leaveDuration: 4.5 },

    'đầu ngày': { leavePeriod: 'start_morning', leaveDuration: durationValue },
    'cuối ngày': { leavePeriod: 'end_afternoon', leaveDuration: durationValue },
    'cả ngày': { leavePeriod: 'full_day', leaveDuration: 8 },
})

async function addIcon(client, channel, threadTs, icon) {
    try {
        await client.reactions.add({
            name: icon,
            channel: channel,
            timestamp: threadTs,
        });
    } catch (error) {
        if (error.data && error.data.error === 'already_reacted') return;
        else console.error("Error adding reaction:", error);
    }
}

async function responseInThread(client, channel, threadTs, text) {
    await client.chat.postMessage({
        channel: channel,
        thread_ts: threadTs,
        text: text
    });
}

async function insertLeaveRequest(db, userId, leaveDay, leavePeriod, leaveDuration, receiveTime, updateTime) {
    await db.execute(
        `INSERT INTO leave_requests 
            (user_id, leave_day, leave_period, leave_duration, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, leaveDay, leavePeriod, leaveDuration, receiveTime, updateTime]
    );
}

async function updateLeaveRequest(db, updateTime, userId, leaveDay, periods) {
    await db.execute(
        `UPDATE leave_requests
            SET request_status = ?, updated_at = ?
            WHERE user_id = ? AND leave_day = ? AND leave_period IN (?, ?)`,
        ['disabled', updateTime, userId, leaveDay, ...periods]
    );
}

module.exports = { periodMapGet, periodMap, addIcon, responseInThread, insertLeaveRequest, updateLeaveRequest }