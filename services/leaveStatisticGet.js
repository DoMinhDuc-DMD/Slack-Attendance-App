async function leaveStatisticGet(db, userId, month, year, sortOrder) {
    try {
        if (userId) {
            const [userLeaves] = await db.execute(`SELECT * FROM leave_requests 
            WHERE user_id = ? AND MONTH(leave_day) = ? AND YEAR(leave_day) = ? AND request_status = ? ORDER BY created_at ${sortOrder}`,
                [userId, month, year, 'confirmed']);

            return userLeaves;
        } else {
            const [allLeaves] = await db.execute(
                `SELECT 
                    user_id, 
                    SUM(CASE WHEN leave_period = 'full_day' THEN 1 ELSE 0 END) AS total_leaves, 
                    SUM(leave_duration) AS total_times 
                FROM leave_requests 
                WHERE MONTH(leave_day) = ? AND YEAR(leave_day) = ? AND request_status = ? GROUP BY user_id ORDER BY total_times DESC`,
                [month, year, 'confirmed']
            );

            return allLeaves;
        }

    } catch (error) {
        console.error("Error fetching leave statistics: ", error);
        throw error;
    }
}

module.exports = { leaveStatisticGet }