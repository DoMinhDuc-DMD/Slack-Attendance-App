const dayjs = require("dayjs");
const { confirmLeaveRequest, disableLeaveRequest } = require("../services/utils");
const { DATETIME_FORMAT } = require("../services/formatDate");
const { userToRequest } = require("../services/formatVariables");

module.exports = (app, db) => {
    app.event('reaction_added', async ({ event }) => {
        try {
            const confirmTime = dayjs().format(DATETIME_FORMAT);

            const [matchedRequest] = await db.execute(`SELECT * FROM leave_requests WHERE timestamp = ?`, [event.item.ts]);

            if (matchedRequest.length > 0
                && event.user == userToRequest
                && event.reaction === 'white_check_mark'
                // && event.user !== event.item_user
            ) {
                const req = matchedRequest[0];
                const period = req.leave_period.split("_")[1];

                await confirmLeaveRequest(db, confirmTime, req.user_id, req.timestamp);
                await disableLeaveRequest(db, confirmTime, req.user_id, req.leave_day, period, req.timestamp)
            }
        } catch (error) {
            console.error("Error handling confirm request:", error);
        }
    });
}