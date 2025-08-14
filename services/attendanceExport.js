async function attendanceExport(db, userId, month, year) {
    try {
        const [userLeaves] = await db.execute(`SELECT * FROM leave_requests 
            WHERE user_id = ? AND MONTH(leave_day) = ? AND YEAR(leave_day) = ? AND request_status = ? ORDER BY leave_day`,
            [userId, month, year, 'confirmed']);

        return userLeaves;

    } catch (error) {
        console.error("Error fetching leave statistics: ", error);
        throw error;
    }
}

module.exports = { attendanceExport }