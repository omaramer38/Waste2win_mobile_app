import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../database/pool';
import { saveBase64Image } from '../utils/uploadHelper';

const formatProductImage = (req: Request, imagePath: string | null) => {
  if (typeof imagePath !== 'string') return null;
  const cleanPath = imagePath.trim();
  if (!cleanPath) return null;
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:image/')) {
    return cleanPath;
  }
  if (!cleanPath.startsWith('/')) return null;

  const host = req.get('host');
  const protocol = req.protocol;
  return `${protocol}://${host}${cleanPath}`;
};

type ProductRow = RowDataPacket & {
  id: number;
  title: string;
  description: string | null;
  category: string;
  categoryId: number;
  quantity: number;
  points: number;
  status: string;
  statusCode: string;
  image: string | null;
};

const resolveCategoryId = async (category: string | undefined, categoryId: number | undefined) => {
  if (categoryId) return categoryId;
  const cleanCategory = (category || 'Lifestyle').trim() || 'Lifestyle';
  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM product_categories WHERE name = ? LIMIT 1',
    [cleanCategory]
  );
  if (existing[0]) return Number(existing[0].id);

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO product_categories (name) VALUES (?)',
    [cleanCategory]
  );
  return result.insertId;
};

export const listProducts = async (req: Request, res: Response) => {
  const [rows] = await pool.query<ProductRow[]>(
    `SELECT p.id, p.title, p.description, p.quantity, p.points,
            c.id AS categoryId, c.name AS category,
            ps.code AS statusCode, ps.name AS status,
            pi.image_uri AS image
     FROM products p
     JOIN product_categories c ON c.id = p.category_id
     JOIN product_statuses ps ON ps.id = p.status_id
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
     ORDER BY p.id DESC`
  );

  const formattedRows = rows.map((row) => ({
    ...row,
    image: formatProductImage(req, row.image),
  }));

  return res.json(formattedRows);
};

export const createProduct = async (req: Request, res: Response) => {
  const { title, name, description = '', category, categoryId, quantity, stock, points = 0, image = '' } = req.body;
  const resolvedCategoryId = await resolveCategoryId(category, categoryId);
  const resolvedQuantity = Number(quantity ?? stock ?? 0);
  const statusId = Number(quantity) > 0 ? 1 : 2;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO products (title, description, category_id, quantity, points, status_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title || name, description, resolvedCategoryId, resolvedQuantity, points, resolvedQuantity > 0 ? 1 : statusId]
    );

    if (image) {
      const savedImagePath = saveBase64Image(image);
      await connection.query(
        'INSERT INTO product_images (product_id, image_uri, is_primary) VALUES (?, ?, TRUE)',
        [result.insertId, savedImagePath]
      );
    }

    await connection.commit();
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, name, description = '', category, categoryId, quantity, stock, points = 0, image = '' } = req.body;
  const resolvedCategoryId = await resolveCategoryId(category, categoryId);
  const resolvedQuantity = Number(quantity ?? stock ?? 0);
  const statusId = resolvedQuantity > 0 ? 1 : 2;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE products
       SET title = ?, description = ?, category_id = ?, quantity = ?, points = ?, status_id = ?
       WHERE id = ?`,
      [title || name, description, resolvedCategoryId, resolvedQuantity, points, statusId, id]
    );

    if (image) {
      const savedImagePath = saveBase64Image(image);
      await connection.query('DELETE FROM product_images WHERE product_id = ?', [id]);
      await connection.query(
        'INSERT INTO product_images (product_id, image_uri, is_primary) VALUES (?, ?, TRUE)',
        [id, savedImagePath]
      );
    }

    await connection.commit();
    return res.json({ message: 'Product updated' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  return res.json({ message: 'Product deleted' });
};
