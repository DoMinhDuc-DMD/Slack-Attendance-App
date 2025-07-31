const userStatisticAttendance = require('./userStatisticAttendance');
const memberJoined = require('./memberJoined');

module.exports = (app, db) => {
    userStatisticAttendance(app, db);
    memberJoined(app);
}