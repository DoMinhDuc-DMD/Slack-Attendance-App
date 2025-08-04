const dayjs = require("dayjs");
const { DM_FORMAT } = require("../services/formatDate");
const { getLeaveStatistics } = require("../services/getLeaveStatistic");
const { formatPeriod, formatDuration } = require("../services/formatVariables");
const { addCheckMark } = require("../services/addCheckMark");

module.exports = (app, db) => {
    app.event('app_mention', async ({ event, client }) => {
        try {
            const regex = /thống kê nghỉ\s*(cũ nhất|mới nhất)?\s*(của\s+<@(\w+)>)?\s*(trong\s+)?tháng\s+((0?[1-9]|1[0-2])\/\d{4})/i;
            const match = event.text.match(regex);
            const threadTs = event.ts || event.thread_ts;

            if (!match) return;

            let sortOrder = '';
            if (match[1] === 'mới nhất') sortOrder = 'DESC';
            else if (match[1 === 'cũ nhất']) sortOrder = 'ASC';

            const userId = match[3];
            const [month, year] = match[5].split('/').map(Number);
            if (isNaN(month) || isNaN(year)) return;

            if (userId) {
                const stats = await getLeaveStatistics(db, userId, month, year, sortOrder);
                if (stats.length === 0) {
                    await client.chat.postMessage({
                        channel: event.channel,
                        thread_ts: threadTs,
                        text: (`Chưa có yêu cầu nghỉ của <@${userId}> trong tháng ${month}/${year}.`)
                    });
                    return;
                }

                let totalLeaveTime = 0;
                let totalLeaveDays = 0;

                const details = stats.map(l => {
                    totalLeaveTime += l.leave_duration;
                    if (l.leave_period === 'full_day') totalLeaveDays++;
                    return `\t- ${dayjs(l.leave_day).format(DM_FORMAT)}: ${formatPeriod(l.leave_period)} (${formatDuration(l.leave_duration)})`;
                }).join('\n');

                addCheckMark(client, event.channel, threadTs);

                await client.chat.postMessage({
                    channel: event.channel,
                    thread_ts: threadTs,
                    text: (`Thống kê nghỉ của <@${userId}> trong tháng ${month}/${year}:\n` +
                        `\t- Số ngày nghỉ: *${totalLeaveDays} ngày*\n` +
                        `\t- Tổng thời gian nghỉ: *${formatDuration(totalLeaveTime)}*\n` +
                        `Chi tiết:\n${details}`)
                });
            } else {
                const stats = await getLeaveStatistics(db, null, month, year);
                if (stats.length === 0) {
                    await client.chat.postMessage({
                        channel: event.channel,
                        thread_ts: threadTs,
                        text: (`Chưa có yêu cầu nghỉ trong tháng ${month}/${year}.`)
                    });
                    return;
                }
                const details = stats.map(stat => {
                    return `<@${stat.user_id}>:\n` +
                        `\t * Số ngày nghỉ: ${formatPeriod(stat.total_leaves)} ngày\n` +
                        `\t * Tổng thời gian nghỉ: ${formatDuration(stat.total_times)}`;
                }).join('\n');

                addCheckMark(client, event.channel, threadTs);

                await client.chat.postMessage({
                    channel: event.channel,
                    thread_ts: threadTs,
                    text: details
                });
            }
        } catch (error) {
            console.error("Error handling leave statistic request:", error);
        }
    });
}