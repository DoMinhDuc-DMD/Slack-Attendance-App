const greetings = require('./greetings');
const newRequest = require('./newRequest');

module.exports = (app, db) => {
    greetings(app);
    newRequest(app, db);
};
