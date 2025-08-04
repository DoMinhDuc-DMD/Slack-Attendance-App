const dayjs = require("dayjs");
const { YMD_FORMAT, DMY_FORMAT, DATETIME_FORMAT } = require("../services/formatDate");
const { checkLeaveRequest } = require("../services/checkLeaveRequest");
const { formatPeriod } = require("../services/formatVariables");
const { addIcon } = require("../services/addIcon");
const { responseInThread } = require("../services/responseInThread");

module.exports = (app, db) => {
    // Xử lý yêu cầu nghỉ khi được nhắc đến
    app.message(async ({ message, client }) => {
        try {
            const regex = /<@(\w+)>\s*(em\s+)?xin phép nghỉ\s*(?:\s+(\d+)(?:\s*(h|giờ|phút)))?\s*(?:\s+(\d+)(?:\s*(phút)))?\s*(đầu|cuối|cả)\s*(buổi sáng|buổi chiều|ngày)/i;

            const match = message.text.toLowerCase().match(regex);
            if (!match) return;

            const threadTs = message.ts || message.thread_ts;
            const receiveTime = dayjs(parseFloat(message.ts) * 1000).format(DATETIME_FORMAT);

            const mentionedUser = match[1];
            // test local
            if (mentionedUser !== process.env.USER_TO_REQUEST.toLowerCase()) return;
            // chạy trên server
            // const usersToRequest = process.env.USERS_TO_REQUEST.split(', ').map(user => user.trim().toLowerCase());
            // if (!usersToRequest.includes(mentionedUser.toLowerCase())) return;

            const timeValue1 = match[3]?.toLowerCase();
            const timeUnit1 = match[4]?.toLowerCase();
            const timeValue2 = match[5]?.toLowerCase();
            const timeUnit2 = match[6]?.toLowerCase();
            const part = match[7]?.toLowerCase() || '';
            const timeOfDay = match[8]?.toLowerCase();

            const period = (part + ' ' + timeOfDay).trim();

            let durationValue = 0;

            if (timeValue1 && timeUnit1) {
                if (timeUnit1 === 'giờ' || timeUnit1 === 'h') {
                    durationValue += parseFloat(timeValue1);
                } else if (timeUnit1 === 'phút') {
                    durationValue += parseFloat(timeValue1) / 60;
                }
            }
            if (timeValue2 && timeUnit2 === 'phút') {
                durationValue += parseFloat(timeValue2) / 60;
            }

            const parsedDuration = parseFloat(durationValue);
            if ((period.includes('sáng') || period === 'đầu ngày') && parsedDuration > 3.5) {
                return responseInThread(client, message.channel, threadTs, `Thời gian nghỉ không hợp lệ!`);
            } else if ((period.includes('chiều') || period === 'cuối ngày') && parsedDuration > 4.5) {
                return responseInThread(client, message.channel, threadTs, `Thời gian nghỉ không hợp lệ!`);
            }

            durationValue = durationValue.toFixed(2);

            const periodMap = {
                'đầu buổi sáng': { leavePeriod: 'start_morning', leaveDuration: durationValue },
                'cuối buổi sáng': { leavePeriod: 'end_morning', leaveDuration: durationValue },
                'cả buổi sáng': { leavePeriod: 'full_morning', leaveDuration: 3.5 },

                'đầu buổi chiều': { leavePeriod: 'start_afternoon', leaveDuration: durationValue },
                'cuối buổi chiều': { leavePeriod: 'end_afternoon', leaveDuration: durationValue },
                'cả buổi chiều': { leavePeriod: 'full_afternoon', leaveDuration: 4.5 },

                'đầu ngày': { leavePeriod: 'start_morning', leaveDuration: durationValue },
                'cuối ngày': { leavePeriod: 'end_afternoon', leaveDuration: durationValue },
                'cả ngày': { leavePeriod: 'full_day', leaveDuration: 8 },
            };

            if (!(period in periodMap)) return;

            const { leavePeriod, leaveDuration } = periodMap[period];
            const result = await checkLeaveRequest(db, message.user, dayjs().format(YMD_FORMAT), leavePeriod, leaveDuration, receiveTime);

            // Thả icon
            if (result.type === 'inserted' || result.type === 'updated') addIcon(client, message.channel, threadTs, 'white_check_mark');

            // Trả lời trong thread
            if (result.type === 'existed') {
                responseInThread(client, message.channel, threadTs, `Đã có yêu cầu nghỉ ${formatPeriod(leavePeriod).toLowerCase()} ${dayjs().format(DMY_FORMAT)}.`);
            } else if (result.type === 'updated') {
                responseInThread(client, message.channel, threadTs, `Đã cập nhật thời gian nghỉ ${formatPeriod(leavePeriod).toLowerCase()} ${dayjs().format(DMY_FORMAT)}.`);
            }
        } catch (error) {
            console.error("Error handling leave request (mention):", error);
        }
    });
}