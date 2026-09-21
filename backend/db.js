require("dotenv").config();
const mysql = require("mysql2");


const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

module.exports = db;

db.getConnection((error, connection) => {
  if (error) {
    console.error("MySQL connection failed:", error);
    return;
  }

  console.log("MySQL connected successfully!");

  connection.release();
});