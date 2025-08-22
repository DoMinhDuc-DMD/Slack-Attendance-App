const mysql = require('mysql2/promise');

let pool;

async function DBConnection() {
    if (!pool) {
        pool = mysql.createPool({
            // Local
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3308,
            user: process.env.DB_USER || 'root',
            // Server
            // host: process.env.DB_HOST || 'db',
            // port: process.env.DB_PORT || 3306,
            // user: process.env.DB_USER || 'slack',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_NAME || 'leavebot',
            waitForConnections: true,
            connectionLimit: 10,
        });
    }
    return pool;
}

module.exports = { DBConnection };