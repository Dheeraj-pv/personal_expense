const mysql = require('mysql2');

// Create a pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',         // your MySQL password
  database: 'personal_expense',
  waitForConnections: true,
  connectionLimit: 10,  // number of max concurrent connections
  queueLimit: 0
});

module.exports = pool.promise();