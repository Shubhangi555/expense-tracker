import { pool } from './db';
import fs from 'fs';
import path from 'path';

async function migrate() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '../migrations/001_init.sql'),
      'utf8'
    );
    await pool.query(sql);
    console.log('✅ Migration complete');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrate();