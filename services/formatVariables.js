const userToRequest = process.env.USER_TO_REQUEST;
const requestChannel = process.env.REQUEST_CHANNEL;
const statisticChannel = process.env.STATISTIC_CHANNEL;
const exportChannel = process.env.EXPORT_CHANNEL;

function formatPeriod(period) {
    const map = {
        start_morning: "Đầu buổi sáng",
        end_morning: "Cuối buổi sáng",
        full_morning: "Cả buổi sáng",
        start_afternoon: "Đầu buổi chiều",
        end_afternoon: "Cuối buổi chiều",
        full_afternoon: "Cả buổi chiều",
        full_day: "Cả ngày",
    };
    return map[period] || period;
}

function formatDuration(duration) {
    if (duration < 1) {
        return `${Math.round(duration * 60)} phút`;
    }

    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);

    let result = '';
    if (hours > 0) result += `${hours} giờ`;
    if (minutes > 0) result += ` ${minutes} phút`;

    return result.trim();
}

module.exports = {
    userToRequest,
    requestChannel,
    statisticChannel,
    exportChannel,
    formatPeriod,
    formatDuration,
};