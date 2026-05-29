import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../database/pool';

export const listUsers = async (_req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.username, u.email, u.phone, u.points, u.salary, u.rank_score AS rankScore,
            u.created_at AS joinedAt, r.name AS role, s.name AS status, c.name AS city
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN account_statuses s ON s.id = u.status_id
     LEFT JOIN cities c ON c.id = u.city_id
     ORDER BY u.id DESC`
  );

  return res.json(rows);
};

const resolveCityId = async (city: string | undefined, cityId: number | undefined) => {
  if (cityId) return cityId;
  const cleanCity = (city || 'Mansoura').trim() || 'Mansoura';
  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM cities WHERE name = ? LIMIT 1',
    [cleanCity]
  );
  if (existing[0]) return Number(existing[0].id);

  const [result] = await pool.query<ResultSetHeader>('INSERT INTO cities (name) VALUES (?)', [cleanCity]);
  return result.insertId;
};

export const updateUserStatus = async (req: Request, res: Response) => {
  const statusId = req.body.status === 'blocked' ? 2 : 1;
  await pool.query('UPDATE users SET status_id = ? WHERE id = ?', [statusId, req.params.id]);
  return res.json({ message: 'User status updated' });
};

export const listWorkers = async (_req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.username AS name, u.email, u.phone, c.name AS area,
            u.salary, s.name AS status, u.rank_score AS rankScore
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN account_statuses s ON s.id = u.status_id
     LEFT JOIN cities c ON c.id = u.city_id
     WHERE r.name = 'worker'
     ORDER BY u.id DESC`
  );

  return res.json(rows);
};

export const createWorker = async (req: Request, res: Response) => {
  const { name, email, password = '123456', phone, cityId, area, salary = 0 } = req.body;
  const resolvedCityId = await resolveCityId(area, cityId);
  const resolvedEmail = email || `${Date.now()}@worker.local`;
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users
      (username, email, password_hash, phone, role_id, status_id, city_id, salary)
     VALUES (?, ?, ?, ?, 2, 1, ?, ?)`,
    [name, resolvedEmail, passwordHash, phone, resolvedCityId, salary]
  );

  return res.status(201).json({ id: result.insertId });
};

export const updateWorker = async (req: Request, res: Response) => {
  const { name, phone, cityId, area, salary = 0, status = 'active' } = req.body;
  const resolvedCityId = await resolveCityId(area, cityId);
  const statusId = status === 'leave' ? 3 : status === 'blocked' ? 2 : 1;
  await pool.query(
    `UPDATE users
     SET username = ?, phone = ?, city_id = ?, salary = ?, status_id = ?
     WHERE id = ? AND role_id = 2`,
    [name, phone, resolvedCityId, salary, statusId, req.params.id]
  );

  return res.json({ message: 'Worker updated' });
};

export const deleteWorker = async (req: Request, res: Response) => {
  await pool.query('DELETE FROM users WHERE id = ? AND role_id = 2', [req.params.id]);
  return res.json({ message: 'Worker deleted' });
};
