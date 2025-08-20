const memberJoined = require('./memberJoined');
const confirmRequestEvent = require('./confirmRequestEvent');

module.exports = (app, db) => {
    memberJoined(app);
    confirmRequestEvent(app, db);
}