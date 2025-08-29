const dayjs = require("dayjs");
const { DMY_FORMAT, DATETIME_FORMAT } = require("../../services/formatDate");
const { getLabelFromValue, responseMessage, insertLeaveRequest, calculateDuration, checkExistRequest, getInfoToRequest } = require("../../services/utils");

module.exports = (app, db) => {
    app.view('new_request_modal', async ({ ack, view, client }) => {
        await ack();

        try {
            const { userId, workspaceId, fullDurationOption } = JSON.parse(view.private_metadata);

            const newDay = view.state.values.new_datepicker.new_datepicker_input.selected_date;
            const newPeriod = view.state.values.new_period.new_period_input.selected_option.value;
            const newDuration = fullDurationOption || view.state.values.new_duration.new_duration_input.selected_option.value;

            const newSelectReason = view.state.values.new_reason_select.new_reason_select_input.selected_option;
            const newInputReason = newSelectReason.value === "other" ? view.state.values.new_reason_input.new_reason_input_input.value : "";
            const newReason = newInputReason || newSelectReason.text.text;

            const pendingTime = dayjs().format(DATETIME_FORMAT);

            const durationValue = calculateDuration(newDuration);
            const localizedPeriod = getLabelFromValue(newPeriod).toLowerCase();

            const [infoToRequest] = await getInfoToRequest(db, view.team_id);
            const adminId = infoToRequest[0].admin_id;
            const channelId = infoToRequest[0].channel_id;

            const [checkExist] = await checkExistRequest(db, workspaceId, userId, newDay, newPeriod);
            if (checkExist.length > 0) {
                return await responseMessage(
                    client,
                    userId,
                    `Đã có yêu cầu nghỉ ${localizedPeriod.split(" ").slice(-2).join(" ")} ${dayjs(newDay).format(DMY_FORMAT)}. Hãy cập nhật lại yêu cầu!`
                );
            }

            const request = await responseMessage(
                client,
                channelId,
                `<@${adminId}> <@${userId}> xin nghỉ ${!newPeriod.includes('full') ? `${newDuration} ` : ''}${localizedPeriod} ${dayjs(newDay).format(DMY_FORMAT)}. Lý do: ${newReason.trim()}.`
            );

            await insertLeaveRequest(db, workspaceId, userId, newDay, newPeriod, durationValue, newReason, request.ts, pendingTime);
        } catch (error) {
            console.error("Error handling leave request modal submission:", error);
        }
    });
};