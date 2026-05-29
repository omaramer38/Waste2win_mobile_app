import dotenv from 'dotenv';
import app from './app';
import { pool } from './database/pool';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Add columns dynamically if they do not exist
    await pool.query(`ALTER TABLE recycle_orders ADD COLUMN is_store_order BOOLEAN NOT NULL DEFAULT FALSE`).catch(() => {});
    await pool.query(`ALTER TABLE recycle_orders ADD COLUMN store_product_title VARCHAR(255) NULL`).catch(() => {});
    await pool.query(`ALTER TABLE store_orders ADD COLUMN recycle_order_id INT NULL`).catch(() => {});
    console.log('Database columns verified/added.');
  } catch (err) {
    console.error('Error verifying database columns:', err);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
