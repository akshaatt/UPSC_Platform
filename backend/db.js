const { Pool } = require("pg");

// Create a pool of connections
const pool = new Pool({
  user: "postgres",           // your DB username
  host: "localhost",          // your DB is on your own computer
  database: "upsc_platform",  // the database you just created
  password: "admin123",       // the password you set during PostgreSQL install
  port: 5432,                 // default PostgreSQL port
});

module.exports = pool;
