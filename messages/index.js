const greetings = require('./greetings');

module.exports = (app, db) => {
    greetings(app);
};
