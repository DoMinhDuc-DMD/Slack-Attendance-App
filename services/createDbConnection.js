const mysql = require('mysql2/promise');

// Tạo kết nối với database
async function createDbConnection() {
    return await mysql.createConnection({
        host: 'localhost',
        port: 3308,
        user: 'root',
        password: 'password',
        database: 'slackbot'
    });
}

module.exports = { createDbConnection }