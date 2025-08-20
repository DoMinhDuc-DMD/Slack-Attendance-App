const dayjs = require("dayjs");
const { leaveStatistic } = require("../../services/leaveStatistic");
const { DM_FORMAT } = require("../../services/formatDate");
const { formatDuration, formatPeriod, responseMessage } = require("../../services/utils");

module.exports = (app, db) => {
    app.view('leave_statistic_modal', async ({ ack, view, client, body }) => {
        await ack();

        const requesterId = body.user.id;

        const userList = view.state.values.user_block.user_select.selected_options;
        const month = parseInt(view.state.values.month_block.month_select.selected_option.value);
        const year = parseInt(view.state.values.year_block.year_select.selected_option.value);

        for (const user of userList) {
            const userId = user.value;
            const stats = await leaveStatistic(db, userId, month, year);

            let message = '';

            if (stats.length === 0) {
                message = `Chưa có dữ liệu nghỉ của <@${userId}> trong tháng ${month}/${year}.`;
            } else {
                let totalLeaveTime = 0;
                let totalLeaveDays = 0;

                const details = stats.map(l => {
                    totalLeaveTime += l.leave_duration;
                    if (l.leave_period === 'full_day') totalLeaveDays++;
                    return `\t- ${dayjs(l.leave_day).format(DM_FORMAT)}: ${formatPeriod(l.leave_period)} (${formatDuration(l.leave_duration)})`;
                }).join('\n');

                message =
                    `* *Thống kê nghỉ* của <@${userId}> tháng ${month}/${year}:\n` +
                    `\t- Số ngày nghỉ: *${totalLeaveDays} ngày*\n` +
                    `\t- Tổng thời gian nghỉ: *${formatDuration(totalLeaveTime)}*\n` +
                    `* *Chi tiết:*\n${details}`;
            }

            await responseMessage(client, requesterId, message)
        }
    });

}