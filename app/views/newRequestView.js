const dayjs = require('dayjs');
const { DMY_FORMAT, DATETIME_FORMAT, YMD_FORMAT } = require('../../services/formatDate');
const { responseMessage, calculateDuration, today } = require('../../services/utils');
const { getLabelFromValue } = require('../../services/modalOptions');
const { checkExistRequest, insertLeaveRequest, getInfoToRequest } = require('../../services/dbQueries');

module.exports = (app, db) => {
    app.view('new_request_modal', async ({ ack, view, client }) => {
        await ack();

        try {
            const { userId, workspaceId, fullDurationOption } = JSON.parse(view.private_metadata);

            const newDay = view.state.values.new_datepicker.new_datepicker_input.selected_date;
            if (dayjs(newDay).isBefore(today.format(YMD_FORMAT))) {
                return await responseMessage(
                    client, userId,
                    `Không thể chọn ngày trong quá khứ, hãy chọn lại ngày.`,
                    { autoDelete: true }
                );
            }

            const newPeriod = view.state.values.new_period.new_period_input.selected_option.value;
            const newDuration = fullDurationOption || view.state.values.new_duration.new_duration_input.selected_option.value;

            const newSelectReason = view.state.values.new_reason_select.new_reason_select_input.selected_option;
            const newInputReason = newSelectReason.value === 'other' ? view.state.values.new_reason_input.new_reason_input_input.value : '';

            const newReason = newSelectReason.value;
            const newReasonNote = newInputReason || newSelectReason.text.text;

            const pendingTime = today.format(DATETIME_FORMAT);

            const durationValue = calculateDuration(newDuration);
            const localizedPeriod = getLabelFromValue(newPeriod).toLowerCase();

            const [infoToRequest] = await getInfoToRequest(db, view.team_id);
            const adminId = infoToRequest[0].admin_id;
            const channelId = infoToRequest[0].channel_id;

            const [checkExist] = await checkExistRequest(db, workspaceId, userId, newDay, newPeriod);
            if (checkExist.length > 0) {
                await responseMessage(
                    client, userId,
                    `Đã có yêu cầu nghỉ ${localizedPeriod.split(' ').slice(-2).join(' ')} ${dayjs(newDay).format(DMY_FORMAT)}. Hãy cập nhật lại yêu cầu!`,
                    { autoDelete: true }
                );
                return;
            }

            const request = await responseMessage(
                client, channelId,
                `<@${adminId}> <@${userId}> xin nghỉ ${!newPeriod.includes('full') ? `${newDuration} ` : ''}${localizedPeriod} ${dayjs(newDay).format(DMY_FORMAT)}. Lý do: ${newReasonNote.trim()}.`
            );

            await insertLeaveRequest(db, workspaceId, userId, newDay, newPeriod, durationValue, newReason, newReasonNote, request.ts, pendingTime);
        } catch (error) {
            console.error('Error handling leave request modal submission: ', error);
        }
    });
};