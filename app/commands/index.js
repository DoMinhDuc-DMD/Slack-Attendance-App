const attendanceExportCommand = require("./attendanceExportCommand");
const newRequestCommand = require("./newRequestCommand");
const leaveStatisticCommand = require("./leaveStatisticCommand");
const updateRequestCommand = require("./updateRequestCommand");
const chooseAdministratorCommands = require("./chooseAdministratorCommands");

module.exports = (app, db) => {
    attendanceExportCommand(app);
    chooseAdministratorCommands(app);
    leaveStatisticCommand(app);
    newRequestCommand(app);
    updateRequestCommand(app, db);
}