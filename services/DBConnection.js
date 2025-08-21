const mysql = require('mysql2/promise');

// Local
// async function DBConnection() {
//     return await mysql.createConnection({
//         host: 'localhost',
//         port: 3308,
//         user: 'root',
//         password: 'password',
//         database: 'leavebot'
//     });
// }

// Server
// async function DBConnection() {
//     return await mysql.createConnection({
//         host: process.env.DB_HOST || 'db',
//         port: process.env.DB_PORT || 3306,
//         user: process.env.DB_USER || 'slack',
//         password: process.env.DB_PASSWORD || 'password',
//         database: process.env.DB_NAME || 'leavebot'
//     });
// }

// Pool
let pool;

async function DBConnection() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'db',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'slack',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_NAME || 'leavebot',
            waitForConnections: true,
            connectionLimit: 10,
        });
    }
    return pool;
}

module.exports = { DBConnection };