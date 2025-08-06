const memberJoined = require('./memberJoined');
const leaveStatistic = require('./leaveStatistic');

module.exports = (app, db) => {
    memberJoined(app);
    leaveStatistic(app, db);
}