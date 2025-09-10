const chooseAdminCommands = require('./chooseAdminCommands');
const exportData = require('./exportDataCommand');
const leaveStatisticCommand = require('./leaveStatisticCommand');
const newRequestCommand = require('./newRequestCommand');
const updateRequestCommand = require('./updateRequestCommand');

module.exports = (app, db) => {
    chooseAdminCommands(app, db);
    exportData(app, db);
    leaveStatisticCommand(app, db);
    newRequestCommand(app, db);
    updateRequestCommand(app, db);
}