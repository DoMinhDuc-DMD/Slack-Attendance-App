async function getLeaveStatistic(db, workspaceId, userId, month, year) {
    return await db.execute(
        `SELECT * FROM leave_requests 
            WHERE workspace_id = ? AND user_id = ? AND MONTH(leave_day) = ? AND YEAR(leave_day) = ? AND request_status = ?`,
        [workspaceId, userId, month, year, 'confirmed']);
}

async function getInfoToRequest(db, workspaceId) {
    return await db.execute(`SELECT admin_id, channel_id from attendance_channels where workspace_id = ?`, [workspaceId]);
}

async function checkExistRequest(db, workspaceId, userId, leaveDay, leavePeriod) {
    return await db.execute(
        `SELECT * FROM leave_requests 
            WHERE workspace_id = ? AND user_id = ? AND leave_day = ? AND leave_period LIKE ?`,
        [workspaceId, userId, leaveDay, `%${leavePeriod.split('_')[1]}%`]
    );
}

async function insertLeaveRequest(db, workspaceId, userId, leaveDay, leavePeriod, leaveDuration, leaveReason, leaveReasonNote, timestamp, receiveTime) {
    await db.execute(
        `INSERT INTO leave_requests 
            (workspace_id, user_id, leave_day, leave_period, leave_duration, leave_reason, reason_note, timestamp, request_status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [workspaceId, userId, leaveDay, leavePeriod, leaveDuration, leaveReason, leaveReasonNote, timestamp, 'pending', receiveTime, receiveTime]
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

async function exportData(db, workspaceId, userId, month, year) {
    return await db.execute(
        `SELECT * FROM leave_requests 
            WHERE workspace_id = ? AND user_id = ? AND MONTH(leave_day) = ? AND YEAR(leave_day) = ? AND request_status = ? ORDER BY leave_day`,
        [workspaceId, userId, month, year, 'confirmed']);
}

module.exports = {
    getLeaveStatistic,
    getInfoToRequest,
    checkExistRequest,
    insertLeaveRequest,
    confirmLeaveRequest,
    disableLeaveRequest,
    exportData
}