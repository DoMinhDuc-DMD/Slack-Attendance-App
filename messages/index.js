const greetings = require('./greetings');
const leaveRequest = require('./leaveRequest');

module.exports = (app, db) => {
    greetings(app);
    leaveRequest(app, db);
};
