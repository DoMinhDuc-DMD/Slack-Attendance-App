const dayjs = require("dayjs");
const { confirmLeaveRequest, disableLeaveRequest, getInfoToRequest } = require("../../services/utils");
const { DATETIME_FORMAT } = require("../../services/formatDate");

module.exports = (app, db) => {
    app.event('reaction_added', async ({ event, body }) => {
        try {
            const confirmTime = dayjs().format(DATETIME_FORMAT);
            const [matchedRequest] = await db.execute(`SELECT * FROM leave_requests WHERE workspace_id = ? AND timestamp = ?`, [1, event.item.ts]);

            const [infoToRequest] = await getInfoToRequest(db, body.team_id);
            const adminId = infoToRequest[0].attendance_admin_id;

            if (matchedRequest.length > 0
                && event.user === adminId
                && event.reaction === 'white_check_mark'
            ) {
                const req = matchedRequest[0];
                const period = req.leave_period.split("_")[1];

                await confirmLeaveRequest(db, 1, confirmTime, req.user_id, req.timestamp);
                await disableLeaveRequest(db, 1, confirmTime, req.user_id, req.leave_day, period, req.timestamp)
            }
        } catch (error) {
            console.error("Error handling confirm request:", error);
        }
    });
}