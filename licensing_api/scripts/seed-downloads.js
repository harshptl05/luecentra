require('dotenv').config();
const { query } = require('../db');

async function run() {
  await query(
    `INSERT INTO downloads (version, dmg_storage_key) VALUES ($1, $2)`,
    ['1.0.0', 'releases/Pulse-1.0.0.dmg']
  );
  console.log('Seed: added placeholder download 1.0.0');
  const { pool } = require('../db');
  await pool.end();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
