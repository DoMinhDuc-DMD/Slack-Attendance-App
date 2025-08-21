async function leaveStatistic(db, workspaceId, userId, month, year) {
    try {
        const [userLeaves] = db.execute(`SELECT * FROM leave_requests 
            WHERE workspace_id = ? AND user_id = ? AND MONTH(leave_day) = ? AND YEAR(leave_day) = ? AND request_status = ?`,
            [workspaceId, userId, month, year, 'confirmed']);

        return userLeaves;
    } catch (error) {
        console.error("Error fetching leave statistics: ", error);
        throw error;
    }
}

module.exports = { leaveStatistic }