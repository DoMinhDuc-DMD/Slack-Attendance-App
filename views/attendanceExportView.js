const dayjs = require("dayjs");
const { attendanceExport } = require("../services/attendanceExport");
const ExcelJS = require("exceljs");
const { responseMessage } = require("../services/utils");
const { statisticChannel } = require("../services/formatVariables");

module.exports = (app, db) => {
    app.view('export_attendance_modal', async ({ ack, view, client }) => {
        await ack();

        const userList = view.state.values.user_block.user_select.selected_options;
        const month = parseInt(view.state.values.month_block.month_select.selected_option.value);
        const year = parseInt(view.state.values.year_block.year_select.selected_option.value);

        const daysOfMonth = dayjs(`${year}-${month}-01`).daysInMonth();
        const daysInMonth = Array.from({ length: daysOfMonth }).map((_, index) => index + 1);

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Thống kê nghỉ`);
        worksheet.addRow([`Tháng ${month}/${year}`]);
        worksheet.addRow([`Thời gian làm việc: 23`])
        worksheet.addRow(['']);
        worksheet.addRow([''])

        for (const user of userList) {
            const userId = user.value;
            const stats = await attendanceExport(db, userId, month, year);

            let enableDate = [];
            let enableDay = [];

            stats.map(stat => {
                enableDate.push(dayjs(stat.leave_day).date());
                enableDay.push(dayjs(stat.leave_day).day());
            });

            await responseMessage(client, statisticChannel, `Đã cuất dữ liệu của <@${userId}> tháng ${month}/${year}.`)
        }
    });
}