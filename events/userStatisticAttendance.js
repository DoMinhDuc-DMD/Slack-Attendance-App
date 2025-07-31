const dayjs = require("dayjs");
const { YMD_FORMAT, DM_FORMAT } = require("../services/formatDate");
const { leaveStatistics } = require("../services/leaveStatistic");
const { autoUpdateDuration } = require("../services/autoUpdateDuration");
const { formatPeriod, formatDuration } = require("../services/formatVaribles");

module.exports = (app, db) => {
    // Xử lý yêu cầu thống kê nghỉ khi được nhắc đến
    app.event('app_mention', async ({ event, client }) => {
        try {
            const regex = /thống kê nghỉ\s*(của\s+<@(\w+)>)?\s*(trong\s+)?tháng\s+((0?[1-9]|1[0-2])\/\d{4})/i;
            const match = event.text.match(regex);
            const threadTs = event.ts || event.thread_ts;

            if (!match) return;
            const userId = match[2];
            const [month, year] = match[4].split('/').map(Number);
            if (isNaN(month) || isNaN(year)) return;

            if (userId) {
                autoUpdateDuration(db, userId, dayjs().format(YMD_FORMAT));
                const stats = await leaveStatistics(db, userId, month, year);

                if (stats.length === 0) {
                    await client.chat.postMessage({
                        channel: event.channel,
                        thread_ts: threadTs,
                        text: (`Không có yêu cầu nghỉ của <@${userId}> trong tháng ${month}/${year}.`)
                    });
                    return;
                }

                let totalLeaveDuration = 0;
                let totalLeaveDays = 0;

                const details = stats.map(l => {
                    totalLeaveDuration += l.leave_duration;
                    if (l.leave_period === 'full_day') totalLeaveDays++;
                    return `\t- ${dayjs(l.leave_day).format(DM_FORMAT)}: ${formatPeriod(l.leave_period)} (${formatDuration(l.leave_duration)})`;
                }).join('\n');

                try {
                    await client.reactions.add({
                        name: 'white_check_mark',
                        channel: event.channel,
                        timestamp: threadTs,
                    });
                } catch (error) {
                    if (error.data && error.data.error === 'already_reacted') return;
                    else console.error("Error adding reaction:", error);
                }

                await client.chat.postMessage({
                    channel: event.channel,
                    thread_ts: threadTs,
                    text: (`Thống kê nghỉ của <@${userId}> trong tháng ${month}/${year}:\n` +
                        `\t- Thời gian nghỉ: *${formatDuration(totalLeaveDuration)}*\n` +
                        `\t- Số ngày nghỉ: *${totalLeaveDays} ngày*\n` +
                        `Chi tiết:\n${details}`)
                });
            } else {
                await client.chat.postMessage({
                    channel: event.channel,
                    thread_ts: threadTs,
                    text: `Bạn muốn thống kê nghỉ của tất cả nhân viên?`
                });
            }
        } catch (error) {
            console.error("Error handling leave statistic request:", error);
        }
    });
}