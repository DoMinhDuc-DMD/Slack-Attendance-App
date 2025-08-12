const { insertLeaveRequest } = require("./utils");

// Kiểm tra yêu cầu nghỉ có tồn tại
async function newRequest(db, userId, leaveDay, leavePeriod, leaveDuration, timestamp, receiveTime) {
    try {
        // Các buổi xin nghỉ đang chờ xét duyệt
        const [allRequestsPending] = await db.execute(`
            SELECT * FROM leave_requests WHERE user_id = ? AND leave_day = ? AND leave_period = ? AND request_status = ?`
            , [userId, leaveDay, leavePeriod, 'pending']
        );
        // Các buổi xin nghỉ đã được chấp nhận
        const [allRequestsConfirmed] = await db.execute(`
            SELECT * FROM leave_requests WHERE user_id = ? AND leave_day = ? AND leave_period = ? AND request_status = ?`
            , [userId, leaveDay, leavePeriod, 'confirmed']
        );

        if (allRequestsPending.length > 0 || allRequestsConfirmed.length > 0) return;

        await insertLeaveRequest(db, userId, leaveDay, leavePeriod, leaveDuration, timestamp, receiveTime);

    } catch (error) {
        console.error("Error checking existing leave request: ", error);
        throw error;
    }
}

module.exports = { newRequest }