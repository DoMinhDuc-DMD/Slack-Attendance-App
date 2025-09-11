const chooseAdminView = require('./chooseAdminView');
const exportDataView = require('./exportDataView');
const leaveStatisticView = require('./leaveStatisticView');
const newRequestView = require('./newRequestView');
const updateRequestView = require('./updateRequestView');

module.exports = (app, db) => {
    chooseAdminView(app, db);
    exportDataView(app, db);
    leaveStatisticView(app, db);
    newRequestView(app, db);
    updateRequestView(app, db);
}