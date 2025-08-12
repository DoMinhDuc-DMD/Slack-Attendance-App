const dayjs = require("dayjs");
const { DMY_FORMAT, DATETIME_FORMAT } = require("../services/formatDate");
const { getLabelFromValue, replyInThread } = require("../services/utils");
const { newRequest } = require("../services/newRequest");
const { requestChannel, userToRequest } = require("../services/formatVariables");

module.exports = (app, db) => {
    app.view('new_request_modal', async ({ ack, view, client }) => {
        await ack();

        try {
            const metadata = JSON.parse(view.private_metadata);

            const userId = metadata.userId;
            const newDay = view.state.values.new_datepicker.new_datepicker_input.selected_date;
            const newPeriod = view.state.values.new_period.new_period_input.selected_option.value;
            const newDuration = view.state.values.new_duration.new_duration_input.value || metadata.durationValue;
            const pendingTime = dayjs().format(DATETIME_FORMAT);

            const regex = /(?:(\d+)\s*(?:giờ|h))|(?:(\d+)\s*phút)/gi;
            let match;
            let matched = false;
            let duration = 0;

            while ((match = regex.exec(newDuration)) !== null) {
                matched = true;
                if (match[1]) {
                    duration += parseFloat(match[1]);
                } else if (match[2]) {
                    duration += parseFloat(match[2]) / 60;
                } else return;
            }

            if (!matched) {
                console.log("Không đúng định dạng thời gian!");
                return;
            }

            duration = parseFloat(duration.toFixed(2));
            const localizedPeriod = getLabelFromValue(newPeriod).toLowerCase();

            const request = await replyInThread(
                requestChannel,
                `<@${userToRequest}> <@${userId}> xin phép nghỉ ${!newPeriod.includes('full') ? `${newDuration} ` : ''}${localizedPeriod} ${dayjs(newDay).format(DMY_FORMAT)}`
            );

            await newRequest(db, userId, newDay, newPeriod, duration, request.ts, pendingTime);
        } catch (error) {
            console.error("Error handling leave request modal submission:", error);
        }
    });
}