const dayjs = require("dayjs");
const { YMD_FORMAT, DATETIME_FORMAT, DMY_FORMAT } = require("../../services/formatDate");
const { insertLeaveRequest, capitalizeFirstLetter, calculateDuration, periodMapOptions, checkExistRequest, responseMessage, getInfoToRequest } = require("../../services/utils");

module.exports = (app, db) => {
    app.message(async ({ message, client }) => {
        try {
            if (message.subtype && message.subtype !== 'bot_message') return;
            if (!message.text) return;

            const regex = /<@(\w+)>\s*(?:em\s+)?xin phép nghỉ\s*(.+?)?\s*(đầu|cuối|cả)\s*((?:buổi)?\s*sáng|(?:buổi)?\s*chiều|ngày)/i;

            const match = message?.text.toLowerCase().match(regex);
            if (!match) return;

            const workspaceId = message.team;
            const leaveDay = dayjs().format(YMD_FORMAT);
            const threadTs = message.ts || message.thread_ts;
            const receiveTime = dayjs(parseFloat(message.ts) * 1000).format(DATETIME_FORMAT);

            const mentionedUser = match[1];
            const [infoToRequest] = await getInfoToRequest(db, message.team);
            const adminId = infoToRequest[0].admin_id;
            if (mentionedUser !== adminId.toLowerCase()) return;

            const newDuration = match[2] || '';
            const part = match[3].toLowerCase() || '';
            let timeOfDay = match[4].trim().toLowerCase();

            if (!timeOfDay.includes('buổi') && (timeOfDay === 'sáng' || timeOfDay === 'chiều')) timeOfDay = `buổi ${timeOfDay}`;

            const period = (part + ' ' + timeOfDay).trim();

            const periodValue = periodMapOptions[capitalizeFirstLetter(period)].leavePeriod;
            let durationValue = 0;

            if (periodMapOptions[capitalizeFirstLetter(period)]?.leaveDuration) {
                durationValue = calculateDuration(periodMapOptions[capitalizeFirstLetter(period)].leaveDuration);
            } else {
                durationValue = calculateDuration(newDuration);
            }

            const [checkExist] = await checkExistRequest(db, workspaceId, message.user, leaveDay, periodValue);
            if (checkExist.length > 0) {
                return await responseMessage(
                    client,
                    message.user,
                    `Đã có yêu cầu nghỉ ${period.split(" ").slice(-2).join(" ")} ${dayjs(leaveDay).format(DMY_FORMAT)} rồi. Hãy cập nhật lại yêu cầu!`
                );
            }

            await insertLeaveRequest(db, workspaceId, message.user, leaveDay, periodValue, durationValue, threadTs, receiveTime);
        } catch (error) {
            console.error("Error handling leave request:", error);
        }
    });
}