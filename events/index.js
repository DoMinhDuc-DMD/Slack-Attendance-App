const userStatisticAttendance = require('./leaveStatistic');
const memberJoined = require('./memberJoined');

module.exports = (app, db) => {
    userStatisticAttendance(app, db);
    memberJoined(app);
}