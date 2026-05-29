import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../database/pool';

type StoreOrderRow = RowDataPacket & {
  id: number;
  status: string;
  statusCode: string;
  deliveryStatusCode: string | null;
  workerId: number | null;
  totalPoints: number;
  createdAt: Date;
  items: string | null;
};

const formatStoreImage = (req: Request, imagePath: string | null) => {
  if (typeof imagePath !== 'string') return '';
  const cleanPath = imagePath.trim();
  if (!cleanPath) return '';
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:image/')) {
    return cleanPath;
  }
  if (!cleanPath.startsWith('/')) return '';

  const host = req.get('host');
  const protocol = req.protocol;
  return `${protocol}://${host}${cleanPath}`;
};

const normalizeStoreImage = (image: unknown) => {
  if (typeof image !== 'string') return null;
  const cleanImage = image.trim();
  if (!cleanImage) return null;
  if (
    cleanImage.startsWith('http://') ||
    cleanImage.startsWith('https://') ||
    cleanImage.startsWith('/uploads/') ||
    cleanImage.startsWith('data:image/')
  ) {
    return cleanImage;
  }

  return null;
};

export const listStoreOrders = async (req: Request, res: Response) => {
  const params: unknown[] = [];
  const where = req.auth?.role === 'user' ? 'WHERE so.customer_id = ?' : '';
  if (req.auth?.role === 'user') params.push(req.auth.id);

  const [rows] = await pool.query<StoreOrderRow[]>(
    `SELECT so.id, sos.name AS status, sos.code AS statusCode,
            ros.code AS deliveryStatusCode, ro.worker_id AS workerId,
            so.total_points AS totalPoints, so.created_at AS createdAt,
            GROUP_CONCAT(
              CONCAT(soi.product_title, '::', soi.points_each, '::', COALESCE(soi.image_uri, ''))
              SEPARATOR '||'
            ) AS items
     FROM store_orders so
     JOIN store_order_statuses sos ON sos.id = so.status_id
     LEFT JOIN store_order_items soi ON soi.store_order_id = so.id
     LEFT JOIN recycle_orders ro ON ro.id = so.recycle_order_id
     LEFT JOIN recycle_order_statuses ros ON ros.id = ro.status_id
     ${where}
     GROUP BY so.id
     ORDER BY so.id DESC`,
    params
  );

  return res.json(
    rows.flatMap((row) =>
      (row.items || '').split('||').filter(Boolean).map((item, index) => {
        const [name, points, image] = item.split('::');
        return {
          id: `${row.id}-${index}`,
          orderId: row.id,
          name,
          points: Number(points || 0),
          image: formatStoreImage(req, image),
          status: row.statusCode,
          deliveryStatus: row.deliveryStatusCode,
          workerId: row.workerId || undefined,
          canCancel: row.statusCode === 'preparing' && (!row.deliveryStatusCode || row.deliveryStatusCode === 'pending') && !row.workerId,
          createdAt: new Date(row.createdAt).toLocaleString('ar-EG'),
        };
      })
    )
  );
};

export const createStoreOrder = async (req: Request, res: Response) => {
  const { items = [], city, cityId, phone, address } = req.body;
  const customerId = req.auth?.id;
  const total = (items as any[]).reduce((sum, item) => sum + Number(item.points || 0), 0);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.query<RowDataPacket[]>('SELECT points FROM users WHERE id = ?', [customerId]);
    if (Number(users[0]?.points || 0) < total) {
      await connection.rollback();
      return res.status(400).json({ message: 'Not enough points' });
    }

    const [orderResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO store_orders (customer_id, status_id, total_points) VALUES (?, 1, ?)',
      [customerId, total]
    );

    const productTitles: string[] = [];
    for (const item of items as any[]) {
      const productId = item.id || 1;
      productTitles.push(item.name);
      await connection.query(
        `INSERT INTO store_order_items
          (store_order_id, product_id, product_title, quantity, points_each, image_uri)
         VALUES (?, ?, ?, 1, ?, ?)`,
        [orderResult.insertId, productId, item.name, item.points, normalizeStoreImage(item.image)]
      );
      await connection.query('UPDATE products SET quantity = GREATEST(quantity - 1, 0) WHERE id = ?', [productId]);
    }

    await connection.query('UPDATE users SET points = points - ? WHERE id = ?', [total, customerId]);

    // Resolve city ID
    let resolvedCityId = Number(cityId);
    if (city && !cityId) {
      const [cityRows] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM cities WHERE name = ? LIMIT 1',
        [city]
      );
      resolvedCityId = Number(cityRows[0]?.id || 3); // Default to Mansoura (3) if not found
    } else if (!resolvedCityId) {
      resolvedCityId = 3; // Default to Mansoura
    }

    // Create a corresponding entry in recycle_orders
    const storeProductTitle = productTitles.join(' - ');
    const [recycleOrderResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO recycle_orders (customer_id, city_id, phone, address, status_id, total_points, is_store_order, store_product_title)
       VALUES (?, ?, ?, ?, 1, ?, TRUE, ?)`,
      [customerId, resolvedCityId, phone || '01000000000', address || 'Store Pick-up', total, storeProductTitle]
    );

    await connection.query('UPDATE store_orders SET recycle_order_id = ? WHERE id = ?', [
      recycleOrderResult.insertId,
      orderResult.insertId,
    ]);

    await connection.commit();
    return res.status(201).json({ id: orderResult.insertId });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteStoreOrder = async (req: Request, res: Response) => {
  const orderId = String(req.params.id).split('-')[0];
  const userId = req.auth?.id;
  const userRole = req.auth?.role;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT so.customer_id, so.recycle_order_id, ro.status_id AS deliveryStatusId, ro.worker_id AS workerId
     FROM store_orders so
     LEFT JOIN recycle_orders ro ON ro.id = so.recycle_order_id
     WHERE so.id = ?`,
    [orderId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: 'Store order not found' });
  }

  const order = rows[0];

  if (userRole === 'user') {
    if (order.customer_id !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this order' });
    }

    if (order.deliveryStatusId === 2 || order.deliveryStatusId === 4 || order.workerId !== null) {
      return res.status(400).json({
        message: 'Cannot delete order after it is approved or assigned to a worker',
      });
    }
  }

  if (order.recycle_order_id) {
    await pool.query('DELETE FROM recycle_orders WHERE id = ?', [order.recycle_order_id]);
  }

  await pool.query('DELETE FROM store_orders WHERE id = ?', [orderId]);
  return res.json({ message: 'Store order deleted' });
};
