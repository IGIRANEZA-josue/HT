const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'htracker'
});

db.getConnection()
    .then((conn) => {
        console.log('Successfully Connected to the database');
        conn.release();
    })
    .catch((err) => {
        console.error('Error connecting to the database:', err.message);
    });

module.exports = db;