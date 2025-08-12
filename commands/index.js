const attendanceExportCommand = require("./attendanceExportCommand");
const newRequestCommand = require("./newRequestCommand");
const leaveStatisticCommand = require("./leaveStatisticCommand");
const updateRequestCommand = require("./updateRequestCommand");

module.exports = (app, db) => {
    attendanceExportCommand(app);
    leaveStatisticCommand(app);
    newRequestCommand(app);
    updateRequestCommand(app, db);
}