const dayjs = require("dayjs");
const ExcelJS = require("exceljs");
const { YMD_FORMAT } = require("../../services/formatDate");
const { attendanceExport } = require("../../services/utils");

module.exports = (app, db) => {
    app.view('export_attendance_modal', async ({ ack, view, client, body }) => {
        await ack();
        try {
            const requesterId = body.user.id;
            const workspaceId = body.team.id;

            const im = await client.conversations.open({ users: requesterId });
            const dmChannelId = im.channel.id;

            const userList = view.state.values.user_block.user_select.selected_options;
            const month = parseInt(view.state.values.month_block.month_select.selected_option.value);
            const year = parseInt(view.state.values.year_block.year_select.selected_option.value);

            for (const user of userList) {
                const userId = user.value;
                const username = user.text.text;

                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet(`Tháng ${month}-${year}`);

                worksheet.mergeCells('A1', 'B1');
                worksheet.getCell('A1').value = `Tháng ${month}/${year}`;
                worksheet.getCell('A1').font = { size: 14 };

                worksheet.mergeCells('A2', 'B2');
                worksheet.getCell('A2').value = `Thời gian làm việc:`;
                worksheet.getCell('A2').font = { size: 14 };

                let weekDaysRow = [null, null, 'SUM'];
                let datesRow = ['ID', 'Họ và tên', null];

                const today = dayjs();
                const totalDays = dayjs(`${year}-${month}-01`).daysInMonth();
                const workDays = [];

                for (let day = 1; day <= totalDays; day++) {
                    const date = dayjs(`${year}-${month}-${String(day).padStart(2, '0')}`);
                    const dayOfWeek = date.day();

                    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                        workDays.push(day);
                    }

                    weekDaysRow.push(date.format('ddd'));
                    datesRow.push(day);
                }

                weekDaysRow.push('Ngày phép dùng trong tháng', 'Tổng ngày nghỉ trong tháng', 'Tổng ngày công tính lương', 'Ngày phép còn dư đầu tháng', 'Tổng ngày phép còn lại');

                worksheet.addRow([]);
                worksheet.addRow(weekDaysRow).font = { bold: true };
                worksheet.addRow(datesRow).font = { bold: true };

                let detailRow = [userId, username, null];
                let totalWorkHours = 0;
                let totalLeaveHours = 0;
                let totalWorkDays = 0;

                const attendanceData = await attendanceExport(db, workspaceId, userId, month, year);

                for (let day = 1; day <= totalDays; day++) {
                    const current = dayjs(`${year}-${month}-${String(day).padStart(2, '0')}`);
                    const [leaveRecord] = attendanceData.filter(data => dayjs(data.leave_day).format(YMD_FORMAT) === current.format(YMD_FORMAT));

                    if (leaveRecord) {
                        const totalLeaveHoursInDay = leaveRecord.reduce((sum, record) => sum + record.leave_duration, 0);
                        const workHoursInDay = Math.max(0, 8 - totalLeaveHoursInDay);

                        totalWorkHours += workHoursInDay;
                        totalLeaveHours += totalLeaveHoursInDay / 8;

                        const duration = (8 - totalLeaveHoursInDay) / 8;
                        if (duration > 0) totalWorkDays += 1;

                        detailRow.push(duration);
                    }
                    else if (!workDays.includes(day) || current.isAfter(today, 'day')) {
                        detailRow.push(null);
                    } else {
                        totalWorkHours += 8;
                        totalWorkDays += 1;
                        detailRow.push(1);
                    }
                }

                detailRow[2] = totalWorkHours;
                detailRow.push(totalLeaveHours, totalLeaveHours, totalWorkDays);
                const row = worksheet.addRow(detailRow);
                row.eachCell((cell) => {
                    if (typeof cell.value === 'number') {
                        cell.alignment = { horizontal: 'right' };
                    }
                });

                worksheet.getCell('C2').value = totalWorkDays;
                worksheet.getCell('C2').font = { size: 14 };

                worksheet.eachRow((row) => {
                    row.eachCell((cell) => {
                        cell.font = { name: 'Times New Roman', size: 10 };
                    })
                });
                // Xuất file dữ liệu
                const buffer = await workbook.xlsx.writeBuffer();

                await client.files.uploadV2({
                    channel_id: dmChannelId,
                    file: buffer,
                    filename: `${username}-${userId}'s attendance.xlsx`,
                    title: `Thống kê của ${username}`,
                });
                worksheet.spliceRows(3, worksheet.rowCount - 1);
            }
        } catch (error) {
            console.error("Error handling export attendance:", error);
        }
    });
};
