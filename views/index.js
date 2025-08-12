const attendanceExportView = require("./attendanceExportView");
const newRequestView = require("./newRequestView");
const leaveStatisticView = require("./leaveStatisticView");
const updateRequestView = require("./updateRequestView");

module.exports = (app, db) => {
    attendanceExportView(app, db);
    leaveStatisticView(app, db);
    newRequestView(app, db);
    updateRequestView(app, db);
}