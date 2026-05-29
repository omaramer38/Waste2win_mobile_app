import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../database/pool';
import generateToken from '../utils/generateToken';

type DbUser = RowDataPacket & {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  phone: string | null;
  role: 'admin' | 'worker' | 'user';
  status: string;
  city_id: number | null;
  points: number;
};

const publicUser = (user: DbUser) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  phone: user.phone,
  role: user.role,
  cityId: user.city_id,
  points: user.points,
  status: user.status,
});

const findUserByEmail = async (email: string) => {
  const [rows] = await pool.query<DbUser[]>(
    `SELECT u.id, u.username, u.email, u.password_hash, u.phone, r.name AS role,
            s.name AS status, u.city_id, u.points
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN account_statuses s ON s.id = u.status_id
     WHERE u.email = ?`,
    [email.trim().toLowerCase()]
  );

  return rows[0];
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password, phone = '', cityId = 3 } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Please provide username, email and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users
        (username, email, password_hash, phone, role_id, status_id, city_id, points)
       VALUES (?, ?, ?, ?, 3, 1, ?, 500)`,
      [username.trim(), email.trim().toLowerCase(), hashedPassword, phone, cityId]
    );

    const user = await findUserByEmail(email);
    const token = generateToken(result.insertId, 'user');

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: user ? publicUser(user) : undefined,
    });
  } catch (error) {
    console.error('Signup error full:', error);

    return res.status(500).json({
      message: 'Server error during signup',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password',
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(400).json({
        message: 'Invalid email or password',
      });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({
        message: 'Account is blocked',
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user.id, user.role);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Login error full:', error);

    return res.status(500).json({
      message: 'Server error during login',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
