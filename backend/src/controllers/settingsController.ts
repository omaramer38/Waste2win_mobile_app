import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../database/pool';

export const getSettings = async (_req: Request, res: Response) => {
  const [settingsRows] = await pool.query<RowDataPacket[]>(
    'SELECT setting_key AS settingKey, setting_value AS settingValue FROM app_settings'
  );
  const [wasteRows] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, points_per_unit AS points FROM waste_types ORDER BY id'
  );

  const settings = settingsRows.reduce<Record<string, string>>((acc, row) => {
    acc[row.settingKey] = row.settingValue;
    return acc;
  }, {});

  return res.json({ settings, wastes: wasteRows });
};

export const updateGeneralSettings = async (req: Request, res: Response) => {
  const settings = req.body as Record<string, string>;

  for (const [key, value] of Object.entries(settings)) {
    await pool.query(
      `INSERT INTO app_settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value]
    );
  }

  return res.json({ message: 'Settings updated' });
};

export const updateWastePoints = async (req: Request, res: Response) => {
  const points = req.body as Record<string, number>;

  for (const [name, value] of Object.entries(points)) {
    await pool.query(
      'UPDATE waste_types SET points_per_unit = ? WHERE name = ?',
      [Number(value), name]
    );
  }

  return res.json({ message: 'Waste points updated' });
};
