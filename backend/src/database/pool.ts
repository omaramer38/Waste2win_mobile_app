import mysql from 'mysql2/promise';

export const DB_NAME = process.env.DB_NAME || 'recypoints_mobile';

export const createPool = (withDatabase = true) =>
  mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: withDatabase ? DB_NAME : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

export const pool = createPool(true);
