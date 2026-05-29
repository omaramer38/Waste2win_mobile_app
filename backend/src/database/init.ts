import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createPool } from './pool';

dotenv.config();

const run = async () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const rootPool = createPool(false);

  try {
    await rootPool.query(sql);
    console.log('Database schema created and seeded successfully.');
  } finally {
    await rootPool.end();
  }
};

run().catch((error) => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});
