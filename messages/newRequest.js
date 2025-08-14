const dayjs = require("dayjs");
const { YMD_FORMAT, DATETIME_FORMAT, DMY_FORMAT } = require("../services/formatDate");
const { insertLeaveRequest, capitalizeFirstLetter, calculateDuration, periodMapOptions, checkExistRequest, responseMessage } = require("../services/utils");
const { userToRequest } = require("../services/formatVariables");

module.exports = (app, db) => {
    app.message(async ({ message, client }) => {
        try {
            if (message.subtype && message.subtype !== 'bot_message') return;
            if (!message.text) return;

            const regex = /<@(\w+)>\s*(?:em\s+)?xin phép nghỉ\s*(.+?)?\s*(đầu|cuối|cả)\s*(buổi sáng|buổi chiều|ngày)/i;

            const match = message?.text.toLowerCase().match(regex);
            if (!match) return;

            const leaveDay = dayjs().format(YMD_FORMAT);
            const threadTs = message.ts || message.thread_ts;
            const receiveTime = dayjs(parseFloat(message.ts) * 1000).format(DATETIME_FORMAT);

            const mentionedUser = match[1];
            if (mentionedUser !== userToRequest.toLowerCase()) return;

            const newDuration = match[2] || '';
            const part = match[3]?.toLowerCase() || '';
            const timeOfDay = match[4]?.toLowerCase();

            const period = (part + ' ' + timeOfDay).trim();

            const periodValue = periodMapOptions[capitalizeFirstLetter(period)].leavePeriod;
            let durationValue = 0;

            if (periodMapOptions[capitalizeFirstLetter(period)]?.leaveDuration) {
                durationValue = calculateDuration(periodMapOptions[capitalizeFirstLetter(period)].leaveDuration);
            } else {
                durationValue = calculateDuration(newDuration);
            }

            const [checkExist] = await checkExistRequest(db, message.user, leaveDay, periodValue);
            if (checkExist.length > 0) {
                return await responseMessage(
                    client,
                    message.user,
                    `Đã có yêu cầu nghỉ ${period.split(" ").slice(-2).join(" ")} ${dayjs(leaveDay).format(DMY_FORMAT)} rồi. Hãy cập nhật lại yêu cầu!`
                );
            }

            await insertLeaveRequest(db, message.user, leaveDay, periodValue, durationValue, threadTs, receiveTime);
        } catch (error) {
            console.error("Error handling leave request:", error);
        }
    });
}