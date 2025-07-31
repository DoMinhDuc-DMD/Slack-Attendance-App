const dayjs = require("dayjs");
const { DATETIME_FORMAT } = require("./formatDate");

async function autoUpdateDuration(db, userId, leaveDay) {
    try {
        const updateTime = dayjs().format(DATETIME_FORMAT);
        const [allRequests] = await db.execute(
            `SELECT * FROM leave_requests WHERE user_id = ? AND leave_day = ? AND request_status = 'enabled'`,
            [userId, leaveDay]
        );

        const findByPeriod = (period) => allRequests.find(req => req.leave_period === period);
        const mergeConfigs = [
            {
                periods: ['start_morning', 'end_morning'],
                expectedDuration: 3.5,
                mergedPeriod: 'full_morning'
            },
            {
                periods: ['start_afternoon', 'end_afternoon'],
                expectedDuration: 4.5,
                mergedPeriod: 'full_afternoon'
            },
            {
                periods: ['full_morning', 'full_afternoon'],
                expectedDuration: 8,
                mergedPeriod: 'full_day'
            }
        ];

        for (const { periods, expectedDuration, mergedPeriod } of mergeConfigs) {
            const [res1, res2] = periods.map(findByPeriod);
            if (res1 && res2) {
                const total = Number((parseFloat(res1.leave_duration) + parseFloat(res2.leave_duration)).toFixed(2));
                if (total === expectedDuration) {
                    await db.execute(
                        `UPDATE leave_requests
                         SET request_status = ?, updated_at = ?
                         WHERE user_id = ? AND leave_day = ? AND leave_period IN (?, ?)`,
                        ['disabled', updateTime, userId, leaveDay, ...periods]
                    );
                    await db.execute(
                        `INSERT INTO leave_requests 
                         (user_id, leave_day, leave_period, leave_duration, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [userId, leaveDay, mergedPeriod, expectedDuration, updateTime, updateTime]
                    );
                    return await autoUpdateDuration(db, userId, leaveDay);
                }
            }
        }
    } catch (error) {
        console.error('Error when auto updating duration time: ', error)
    }
}

module.exports = { autoUpdateDuration }