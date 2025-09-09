const { confirmLeaveRequest, disableLeaveRequest, getInfoToRequest } = require('../../services/dbCommands');
const { DATETIME_FORMAT } = require('../../services/formatDate');
const { today } = require('../../services/utils');

module.exports = (app, db) => {
    app.event('reaction_added', async ({ event, body }) => {
        try {
            const confirmTime = today.format(DATETIME_FORMAT);
            const workspaceId = body.team_id;

            const [matchedRequest] = await db.execute(`SELECT * FROM leave_requests WHERE workspace_id = ? AND timestamp = ?`, [workspaceId, event.item.ts]);

            const [infoToRequest] = await getInfoToRequest(db, workspaceId);
            const adminId = infoToRequest[0].admin_id;

            if (
                matchedRequest.length > 0
                && event.user === adminId
                && event.reaction === 'white_check_mark'
            ) {
                const req = matchedRequest[0];
                const period = req.leave_period.split('_')[1];

                await confirmLeaveRequest(db, workspaceId, confirmTime, req.user_id, req.timestamp);
                await disableLeaveRequest(db, workspaceId, confirmTime, req.user_id, req.leave_day, period, req.timestamp);
            }
        } catch (error) {
            console.error('Error handling confirm request: ', error);
        }
    });
}