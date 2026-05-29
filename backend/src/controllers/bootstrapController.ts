import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../database/pool';

export const getBootstrap = async (_req: Request, res: Response) => {
  const [cities] = await pool.query<RowDataPacket[]>('SELECT id, name FROM cities ORDER BY name');
  const [wastes] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, points_per_unit AS points FROM waste_types WHERE is_active = TRUE ORDER BY id'
  );
  const [categories] = await pool.query<RowDataPacket[]>(
    'SELECT id, name FROM product_categories ORDER BY name'
  );

  return res.json({ cities, wastes, categories });
};
