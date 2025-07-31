const dayjs = require("dayjs");
const { autoUpdateDuration } = require("./autoUpdateDuration");
const { DATETIME_FORMAT } = require("./formatDate");

// Kiểm tra yêu cầu nghỉ có tồn tại
async function checkLeaveRequest(db, userId, leaveDay, leavePeriod, leaveDuration, receiveTime) {
    try {
        const updateTime = dayjs().format(DATETIME_FORMAT);
        const [allRequests] = await db.execute(
            `SELECT * FROM leave_requests WHERE user_id = ? AND leave_day = ? AND request_status = ?`,
            [userId, leaveDay, 'enabled']
        );
        // Có full_day -> return
        if (allRequests.some(req => req.leave_period === 'full_day')) return { type: 'existed' };
        // Có full, xin start hoặc end -> return
        if ((leavePeriod === 'start_morning' || leavePeriod === 'end_morning')
            && allRequests.some(req => req.leave_period === 'full_morning'))
            return { type: 'existed' };

        if ((leavePeriod === 'start_afternoon' || leavePeriod === 'end_afternoon')
            && allRequests.some(req => req.leave_period === 'full_afternoon'))
            return { type: 'existed' };

        const existing = allRequests.find(req => req.leave_period === leavePeriod);
        const periodMap = {
            'full_morning': ['start_morning', 'end_morning'],
            'full_afternoon': ['start_afternoon', 'end_afternoon'],
            'full_day': ['full_morning', 'full_afternoon']
        }
        // Xin full -> disable start và end
        if (leavePeriod === 'full_morning' || leavePeriod === 'full_afternoon' || leavePeriod === 'full_day') {
            if (allRequests.some(req => periodMap[leavePeriod].includes(req.leave_period))) {
                if (existing) return { type: 'existed' };

                await db.execute(`UPDATE leave_requests 
                    SET request_status = ?, updated_at = ?
                    WHERE user_id = ? AND leave_day = ? AND leave_period IN (${periodMap[leavePeriod].map(() => '?').join(', ')})`,
                    ['disabled', updateTime, userId, leaveDay, ...periodMap[leavePeriod]]
                );

                await db.execute(`INSERT INTO leave_requests 
                    (user_id, leave_day, leave_period, leave_duration, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [userId, leaveDay, leavePeriod, leaveDuration, receiveTime, updateTime]
                );

                return { type: 'updated' };
            }
        }
        // Xin full_day -> disable tất cả các bản ghi khác và thêm bản ghi mới
        if (leavePeriod === 'full_day' && allRequests.some(req => periodMap['full_day'].includes(req.leave_period))) {
            if (existing) return { type: 'existed' };

            await db.execute(`UPDATE leave_requests 
                SET request_status = ?, updated_at = ?
                WHERE user_id = ? AND leave_day = ? AND leave_period != ?`,
                ['disabled', updateTime, userId, leaveDay, 'full_day']
            );
            await db.execute(`INSERT INTO leave_requests 
                (user_id, leave_day, leave_period, leave_duration, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, leaveDay, leavePeriod, leaveDuration, receiveTime, updateTime]
            );

            return { type: 'updated' };
        }
        // Nếu đã có bản ghi rồi thì chỉ update nếu duration tăng
        if (existing) {
            if (existing.leave_duration < leaveDuration) {
                await db.execute(`UPDATE leave_requests 
                    SET leave_duration = ?, updated_at = ?
                    WHERE id = ?`,
                    [leaveDuration, updateTime, existing.id]
                );
                return { type: 'updated' };
            }
            return { type: 'existed' };
        }
        await db.execute(`INSERT INTO leave_requests 
            (user_id, leave_day, leave_period, leave_duration, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, leaveDay, leavePeriod, leaveDuration, receiveTime, updateTime]
        );
        autoUpdateDuration(db, userId, leaveDay);
        return { type: 'inserted' };
    } catch (error) {
        console.error("Error checking existing leave request: ", error);
        throw error;
    }
}

module.exports = { checkLeaveRequest }