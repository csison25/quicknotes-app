require("dotenv").config();
const mysql = require("mysql2/promise");

// Create connection (promise-based)
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "quicknotes_db"
});

// Test connection (skip during Jest tests)
if (process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      const connection = await db.getConnection();
      console.log("✅ Connected to MySQL!");
      connection.release();
    } catch (err) {
      console.error("❌ DB connection failed:", err);
    }
  })();
}

module.exports = db;