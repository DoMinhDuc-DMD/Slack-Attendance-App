const dayjs = require("dayjs");
const { autoUpdateDuration } = require("./autoUpdateDuration");
const { DATETIME_FORMAT } = require("./formatDate");
const { periodMapGet, insertLeaveRequest } = require("./utils");

// Kiểm tra yêu cầu nghỉ có tồn tại
async function leaveRequestGet(db, userId, leaveDay, leavePeriod, leaveDuration, receiveTime) {
    try {
        const updateTime = dayjs().format(DATETIME_FORMAT);
        const [allRequests] = await db.execute(
            `SELECT * FROM leave_requests WHERE user_id = ? AND leave_day = ? AND request_status = ?`,
            [userId, leaveDay, 'enabled']
        );
        // Lấy danh sách các bản ghi đã có trong ngày
        const existing = allRequests.find(req => req.leave_period === leavePeriod);
        // Lấy danh sách các period đã có trong ngày
        const existingPeriods = new Set(allRequests.map(req => req.leave_period));

        // Có full_day -> return
        if (existingPeriods.has('full_day')) return { type: 'existed' };
        // Có full, xin start hoặc end -> return
        for (const [full, subs] of Object.entries(periodMapGet)) {
            if (full === 'full_day') continue; // Đã ktr ở trên -> skip
            // Ktr full morning, afternoon
            if (existingPeriods.has(full) && subs.includes(leavePeriod)) {
                return { type: 'existed' };
            }
        }

        // Xin full -> disable start và end
        if (periodMapGet[leavePeriod]) {
            const subPeriods = periodMapGet[leavePeriod];

            if (subPeriods && subPeriods.some(p => existingPeriods.has(p))) {
                await db.execute(`UPDATE leave_requests 
                    SET request_status = ?, updated_at = ?
                    WHERE user_id = ? AND leave_day = ? AND leave_period IN (${subPeriods.map(() => '?').join(', ')})`,
                    ['disabled', updateTime, userId, leaveDay, ...subPeriods]
                );
                await insertLeaveRequest(db, userId, leaveDay, leavePeriod, leaveDuration, receiveTime, updateTime)
                await autoUpdateDuration(db, userId, leaveDay);
                return { type: 'updated' };
            }
        }

        // Nếu đã có bản ghi rồi thì chỉ update nếu duration tăng
        if (existing) {
            if (existing.leave_duration < leaveDuration) {
                await db.execute(`UPDATE leave_requests SET leave_duration = ?, updated_at = ? WHERE id = ?`,
                    [leaveDuration, updateTime, existing.id]
                );
                await autoUpdateDuration(db, userId, leaveDay);
                return { type: 'updated' };
            }
            return { type: 'existed' };
        }

        // Nếu không trùng, insert bản ghi mới
        await insertLeaveRequest(db, userId, leaveDay, leavePeriod, leaveDuration, receiveTime, updateTime)
        await autoUpdateDuration(db, userId, leaveDay);
        return { type: 'inserted' };
    } catch (error) {
        console.error("Error checking existing leave request: ", error);
        throw error;
    }
}

module.exports = { leaveRequestGet }