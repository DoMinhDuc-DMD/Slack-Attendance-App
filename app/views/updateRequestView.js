const dayjs = require("dayjs");
const { periodMapOptions, getLabelFromValue, insertLeaveRequest, responseMessage, getInfoToRequest } = require("../../services/utils");
const { DATETIME_FORMAT, YMD_FORMAT, DMY_FORMAT } = require("../../services/formatDate");

module.exports = (app, db) => {
    app.view('update_request_modal', async ({ ack, view, client }) => {
        await ack();

        try {
            const metadata = JSON.parse(view.private_metadata)

            const userId = metadata.userId;
            const workspaceId = metadata.workspaceId;

            const updateRequest = view.state.values.update_request.update_request_input.selected_option.value;
            const updatePeriod = view.state.values.update_period.update_period_input.selected_option.value;
            const updateDuration = metadata.initialDuration || view.state.values.update_duration.update_duration_input.selected_option.value;
            const updateTime = dayjs().format(DATETIME_FORMAT);

            const [infoToRequest] = await getInfoToRequest(db, view.team_id);
            const adminId = infoToRequest[0].attendance_admin_id;
            const channelId = infoToRequest[0].attendance_channel_id;

            const regex = /(?:(\d+)\s*(?:giờ|h))|(?:(\d+)\s*phút)/gi;
            let matchDuration;
            let matched = false;
            let duration = 0;

            while ((matchDuration = regex.exec(updateDuration)) !== null) {
                matched = true;
                if (matchDuration[1]) {
                    duration += parseFloat(matchDuration[1]);
                } else if (matchDuration[2]) {
                    duration += (parseFloat(matchDuration[2])) / 60;
                } else return;
            }

            if (!matched) {
                return responseMessage(client, userId, `Không đúng định dạng thời gian, hãy nhập lại!`)
            }

            duration = parseFloat(duration.toFixed(2));

            const parts = updateRequest.split(" ");

            const period = parts.slice(0, -1).join(" ");
            const day = parts[parts.length - 1];

            const formattedDate = dayjs(day, DMY_FORMAT).format(YMD_FORMAT);

            const [oldTimestamp] = await db.execute(`
                SELECT timestamp FROM leave_requests WHERE workspace_id = ? AND user_id = ? AND leave_day = ? AND leave_period = ?`,
                [workspaceId, userId, formattedDate, periodMapOptions[period].leavePeriod]
            );

            if (!oldTimestamp.length) {
                return responseMessage(client, userId, `Không tìm thấy tin nhắn cũ để trả lời (có thể đã bị xóa)!`)
            }

            const request = await responseMessage(
                client,
                channelId,
                `<@${adminId}> <@${userId}> cập nhật thời gian nghỉ thành${updatePeriod.includes('full') ? '' : ` ${updateDuration}`} ${getLabelFromValue(updatePeriod).toLowerCase()} ${day}`,
                oldTimestamp[0].timestamp
            );

            await insertLeaveRequest(db, 1, userId, formattedDate, updatePeriod, duration, request.ts, updateTime);
        } catch (error) {
            console.error("Error handling leave request modal submission:", error);
        }
    });
}