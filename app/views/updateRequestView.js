const dayjs = require('dayjs');
const { responseMessage, today, calculateDuration } = require('../../services/utils');
const { getInfoToRequest, insertLeaveRequest } = require('../../services/dbQueries');
const { periodMapOptions, getLabelFromValue } = require('../../services/modalOptions');
const { DATETIME_FORMAT, YMD_FORMAT, DMY_FORMAT } = require('../../services/formatDate');

module.exports = (app, db) => {
    app.view('update_request_modal', async ({ ack, view, client }) => {
        await ack();

        try {
            const { userId, workspaceId, fullDurationOption } = JSON.parse(view.private_metadata);

            const updateRequest = view.state.values.update_request.update_request_input.selected_option.value;
            const updatePeriod = view.state.values.update_period.update_period_input.selected_option.value;
            const updateDuration = fullDurationOption || view.state.values.update_duration.update_duration_input.selected_option.value;
            const updateTime = today.format(DATETIME_FORMAT);

            const durationValue = calculateDuration(updateDuration);

            const [infoToRequest] = await getInfoToRequest(db, view.team_id);
            const adminId = infoToRequest[0].admin_id;
            const channelId = infoToRequest[0].channel_id;

            const parts = updateRequest.split(' ');
            const period = parts.slice(0, -1).join(' ');
            const day = parts[parts.length - 1];

            const formattedDate = dayjs(day, DMY_FORMAT).format(YMD_FORMAT);

            const [oldRequest] = await db.execute(`
                SELECT * FROM leave_requests WHERE workspace_id = ? AND user_id = ? AND leave_day = ? AND leave_period = ?`,
                [workspaceId, userId, formattedDate, periodMapOptions[period].leavePeriod]
            );

            if (!oldRequest.length) {
                return responseMessage(
                    client, userId,
                    `Không tìm thấy tin nhắn cũ để trả lời (có thể đã bị xóa)!`,
                    { autoDelete: true }
                );
            }
            const oldReason = oldRequest[0].leave_reason;
            const oldReasonNote = oldRequest[0].reason_note;

            const request = await responseMessage(
                client,
                channelId,
                `<@${adminId}> <@${userId}> cập nhật thời gian nghỉ thành${updatePeriod.includes('full') ? '' : ` ${updateDuration}`} ${getLabelFromValue(updatePeriod).toLowerCase()} ${day}. Lý do: ${oldReasonNote}`,
                { threadTs: oldRequest[0].timestamp }
            );

            await insertLeaveRequest(db, workspaceId, userId, formattedDate, updatePeriod, durationValue, oldReason, oldReasonNote, request.ts, updateTime);
        } catch (error) {
            console.error('Error handling leave request modal submission: ', error);
        }
    });
}