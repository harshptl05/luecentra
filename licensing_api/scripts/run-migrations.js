require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

async function run() {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);
  console.log('Schema applied.');
  await pool.end();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
