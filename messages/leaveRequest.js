const dayjs = require("dayjs");
const { YMD_FORMAT, DMY_FORMAT, DATETIME_FORMAT } = require("../services/formatDate");
const { formatPeriod } = require("../services/formatVariables");
const { leaveRequestGet } = require("../services/leaveRequestGet");
const { addIcon, responseInThread, periodMap } = require("../services/utils");

function parseLeaveDuration(timeValue1, timeValue2, timeUnit) {
    let duration = 0;
    if (timeValue1 && timeUnit) {
        if ((timeUnit === 'giờ' || timeUnit === 'h') && (timeValue1 >= 1 && timeValue1 <= 24)) {
            duration += parseFloat(timeValue1);
        } else if (timeUnit === 'phút' && (timeValue1 >= 1 && timeValue1 <= 60)) {
            duration += parseFloat(timeValue1) / 60;
        }
    }
    if (timeValue2 >= 1 && timeValue2 <= 60) {
        duration += parseFloat(timeValue2) / 60;
    }
    return parseFloat(duration.toFixed(2));
}

module.exports = (app, db) => {
    // Xử lý yêu cầu nghỉ khi được nhắc đến
    app.message(async ({ message, client }) => {
        try {
            const regex = /<@(\w+)>\s*(?:em\s+)?xin phép nghỉ\s*(?:(\d+)\s*(h|giờ|phút))?\s*(?:(\d+)\s*phút)?\s*(đầu|cuối|cả)\s*(buổi sáng|buổi chiều|ngày)/i;

            const match = message.text.toLowerCase().match(regex);
            if (!match) return;

            const threadTs = message.ts || message.thread_ts;
            const receiveTime = dayjs(parseFloat(message.ts) * 1000).format(DATETIME_FORMAT);

            const mentionedUser = match[1];
            if (mentionedUser !== process.env.USER_TO_REQUEST.toLowerCase()) return;

            const timeValue1 = match[2]?.toLowerCase();
            const timeUnit = match[3]?.toLowerCase();
            const timeValue2 = match[4]?.toLowerCase();
            const part = match[5]?.toLowerCase() || '';
            const timeOfDay = match[6]?.toLowerCase();

            const period = (part + ' ' + timeOfDay).trim();

            const durationValue = parseLeaveDuration(timeValue1, timeValue2, timeUnit);

            if ((period.includes('sáng') || period === 'đầu ngày') && durationValue > 3.5) {
                return await responseInThread(client, message.channel, threadTs, `Thời gian nghỉ không hợp lệ!`);
            } else if ((period.includes('chiều') || period === 'cuối ngày') && durationValue > 4.5) {
                return await responseInThread(client, message.channel, threadTs, `Thời gian nghỉ không hợp lệ!`);
            }

            const map = periodMap(durationValue);
            if (!(period in map)) return;

            const leaveDay = dayjs().format(YMD_FORMAT);
            const { leavePeriod, leaveDuration } = map[period];
            const result = await leaveRequestGet(db, message.user, leaveDay, leavePeriod, leaveDuration, receiveTime);

            switch (result.type) {
                case 'inserted':
                    await addIcon(client, message.channel, threadTs, 'white_check_mark');
                    break;
                case 'updated':
                    await addIcon(client, message.channel, threadTs, 'white_check_mark');
                    await responseInThread(client, message.channel, threadTs, `Đã cập nhật thời gian nghỉ ${formatPeriod(leavePeriod).toLowerCase()} ${dayjs().format(DMY_FORMAT)}.`);
                    break;
                case 'existed':
                    await responseInThread(client, message.channel, threadTs, `Đã có yêu cầu nghỉ ${formatPeriod(leavePeriod).toLowerCase()} ${dayjs().format(DMY_FORMAT)}.`);
                    break;
            }
        } catch (error) {
            console.error("Error handling leave request:", error);
        }
    });
}