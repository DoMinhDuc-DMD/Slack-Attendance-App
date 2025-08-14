const mysql = require('mysql2/promise');

// Local
async function createDbConnection() {
    return await mysql.createConnection({
        host: 'localhost',
        port: 3308,
        user: 'root',
        password: 'password',
        database: 'slackbot'
    });
}

// Server
// async function createDbConnection() {
//     return await mysql.createConnection({
//         host: process.env.DB_HOST || 'db',
//         port: process.env.DB_PORT || 3306,
//         user: process.env.DB_USER || 'slack',
//         password: process.env.DB_PASSWORD || 'password',
//         database: process.env.DB_NAME || 'slackbot'
//     });
// }

module.exports = { createDbConnection };
