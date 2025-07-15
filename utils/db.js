const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", (client) => {
  client.query("SET search_path TO public, pg_catalog");
});

module.exports = pool;
