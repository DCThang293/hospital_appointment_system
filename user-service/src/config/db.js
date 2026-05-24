const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const testConnection = async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("Connected to user_db successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

module.exports = {
  pool,
  testConnection,
};