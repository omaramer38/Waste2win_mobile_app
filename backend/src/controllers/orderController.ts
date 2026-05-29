import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../database/pool';
import { saveBase64Image } from '../utils/uploadHelper';

const formatOrderImage = (req: Request, imagePath: string | null) => {
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

const statusIdByLabel = (status: string) => {
  if (status === 'accepted') return 2;
  if (status === 'rejected') return 3;
  if (status === 'received') return 4;
  return 1;
};

const statusCodeFromMobile = (status: string) => {
  if (status.includes('قبول') || status.includes('‚ط¨')) return 'accepted';
  if (status.includes('رفض') || status.includes('±ظپ')) return 'rejected';
  if (status.includes('استلام') || status.includes('§ط³طھ')) return 'received';
  return status;
};

type RecycleRow = RowDataPacket & {
  id: number;
  customerId: number;
  customerName: string;
  cityId: number;
  city: string;
  phone: string;
  address: string;
  statusCode: string;
  totalPoints: number;
  createdAt: Date;
  workerId: number | null;
  workerName: string | null;
  wasteTypes: string | null;
  wasteItems: string | null;
  images: string | null;
  isStoreOrder: number | boolean;
  storeProductTitle: string | null;
};

type WasteInput = {
  name: string;
  quantity?: number | string;
};

const wasteFallbackPoints = (name: string) => {
  const cleanName = String(name || '').toLowerCase();
  if (cleanName.includes('plastic') || cleanName.includes('بلاستيك')) return 50;
  if (cleanName.includes('paper') || cleanName.includes('ورق')) return 60;
  if (cleanName.includes('metal') || cleanName.includes('معدن')) return 150;
  if (cleanName.includes('glass') || cleanName.includes('زجاج')) return 80;
  if (cleanName.includes('batter') || cleanName.includes('بطاريات')) return 80;
  if (cleanName.includes('electronic') || cleanName.includes('الكتروني') || cleanName.includes('إلكتروني')) return 200;
  return 50;
};

const getWasteName = (item: string | WasteInput) => {
  if (typeof item === 'string') return item;
  return item.name;
};

const getWasteQuantity = (item: string | WasteInput) => {
  if (typeof item === 'string') return 1;
  const quantity = Number(item.quantity || 0);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
};

const resolveWaste = async (name: string) => {
  const [wasteRows] = await pool.query<RowDataPacket[]>(
    'SELECT id, points_per_unit FROM waste_types WHERE name = ? OR LOWER(name) = LOWER(?) LIMIT 1',
    [name, name]
  );
  return wasteRows[0] || { id: 1, points_per_unit: wasteFallbackPoints(name) };
};

const shapeOrder = (req: Request, row: RecycleRow) => ({
  id: String(row.id),
  customerId: row.customerId,
  customerName: row.customerName,
  cityId: row.cityId,
  city: row.city,
  phone: row.phone,
  address: row.address,
  statusCode: row.statusCode,
  status: row.statusCode,
  totalPoints: row.totalPoints,
  workerId: row.workerId || undefined,
  workerName: row.workerName || undefined,
  isStoreOrder: !!row.isStoreOrder,
  storeProductTitle: row.storeProductTitle || '',
  wasteTypes: row.isStoreOrder 
    ? [row.storeProductTitle || 'طلب متجر'] 
    : (row.wasteTypes ? row.wasteTypes.split('|') : []),
  wasteItems: row.isStoreOrder
    ? []
    : (row.wasteItems
      ? row.wasteItems.split('|').filter(Boolean).map((item) => {
        const [name, quantity, points] = item.split('::');
        return {
          name,
          quantity: Number(quantity || 0),
          points: Number(points || 0),
        };
      })
      : []),
  images: row.images ? row.images.split('|').map(img => formatOrderImage(req, img)).filter(Boolean) : [],
  createdAt: new Date(row.createdAt).toLocaleString('ar-EG'),
});

export const listRecycleOrders = async (req: Request, res: Response) => {
  const role = req.auth?.role;
  const params: unknown[] = [];
  let where = '';

  if (role === 'user') {
    where = 'WHERE ro.customer_id = ?';
    params.push(req.auth?.id);
  } else if (role === 'worker') {
    where = "WHERE ros.code IN ('accepted', 'received') AND ro.worker_id = ?";
    params.push(req.auth?.id);
  }

  const [rows] = await pool.query<RecycleRow[]>(
    `SELECT ro.id, ro.customer_id AS customerId, u.username AS customerName,
            ro.city_id AS cityId, c.name AS city, ro.phone, ro.address,
            ros.code AS statusCode, ro.total_points AS totalPoints, ro.created_at AS createdAt,
            ro.worker_id AS workerId, w.username AS workerName,
            ro.is_store_order AS isStoreOrder, ro.store_product_title AS storeProductTitle,
            GROUP_CONCAT(DISTINCT wt.name SEPARATOR '|') AS wasteTypes,
            GROUP_CONCAT(DISTINCT CONCAT(wt.name, '::', roi2.quantity, '::', roi2.points) SEPARATOR '|') AS wasteItems,
            GROUP_CONCAT(DISTINCT roi.image_uri SEPARATOR '|') AS images
     FROM recycle_orders ro
     JOIN users u ON u.id = ro.customer_id
     JOIN cities c ON c.id = ro.city_id
     JOIN recycle_order_statuses ros ON ros.id = ro.status_id
     LEFT JOIN users w ON w.id = ro.worker_id
     LEFT JOIN recycle_order_items roi2 ON roi2.order_id = ro.id
     LEFT JOIN waste_types wt ON wt.id = roi2.waste_type_id
     LEFT JOIN recycle_order_images roi ON roi.order_id = ro.id
     ${where}
     GROUP BY ro.id
     ORDER BY ro.id DESC`,
    params
  );

  return res.json(rows.map(row => shapeOrder(req, row)));
};

export const createRecycleOrder = async (req: Request, res: Response) => {
  const { wasteTypes = [], wasteItems, cityId = 3, city, phone, address, images = [] } = req.body;
  const customerId = req.auth?.id;
  const requestedWastes = (Array.isArray(wasteItems) && wasteItems.length > 0 ? wasteItems : wasteTypes) as Array<string | WasteInput>;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let resolvedCityId = Number(cityId);
    if (city && !cityId) {
      const [cityRows] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM cities WHERE name = ? LIMIT 1',
        [city]
      );
      resolvedCityId = Number(cityRows[0]?.id || 3);
    }

    const [orderResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO recycle_orders (customer_id, city_id, phone, address, status_id, total_points)
       VALUES (?, ?, ?, ?, 1, 0)`,
      [customerId, resolvedCityId, phone, address]
    );

    let totalPoints = 0;

    for (const item of requestedWastes) {
      const wasteName = getWasteName(item);
      const quantity = getWasteQuantity(item);
      const [wasteRows] = await connection.query<RowDataPacket[]>(
        'SELECT id, points_per_unit FROM waste_types WHERE name = ? OR LOWER(name) = LOWER(?) LIMIT 1',
        [wasteName, wasteName]
      );
      const waste = wasteRows[0] || { id: 1, points_per_unit: wasteFallbackPoints(wasteName) };
      const itemPoints = Math.round(quantity * Number(waste.points_per_unit || 0));
      totalPoints += itemPoints;

      await connection.query(
        `INSERT INTO recycle_order_items (order_id, waste_type_id, quantity, points)
         VALUES (?, ?, ?, ?)`,
        [orderResult.insertId, waste.id, quantity, itemPoints]
      );
    }

    await connection.query('UPDATE recycle_orders SET total_points = ? WHERE id = ?', [
      totalPoints,
      orderResult.insertId,
    ]);

    for (const image of images as string[]) {
      const savedImagePath = saveBase64Image(image);
      await connection.query(
        'INSERT INTO recycle_order_images (order_id, image_uri) VALUES (?, ?)',
        [orderResult.insertId, savedImagePath]
      );
    }

    await connection.commit();
    return res.status(201).json({ id: orderResult.insertId });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateRecycleOrderStatus = async (req: Request, res: Response) => {
  const statusCode = statusCodeFromMobile(req.body.status || 'pending');
  const workerId = req.body.workerId !== undefined ? req.body.workerId : req.body.worker_id;
  const manualWasteItems = Array.isArray(req.body.wasteItems) ? req.body.wasteItems as WasteInput[] : [];
  const [existingRows] = await pool.query<RowDataPacket[]>(
    'SELECT status_id, total_points, is_store_order FROM recycle_orders WHERE id = ?',
    [req.params.id]
  );

  if (existingRows.length === 0) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const existingOrder = existingRows[0];
  let pointsToAward = Number(existingOrder.total_points || 0);

  if (statusCode === 'received' && manualWasteItems.length > 0 && !existingOrder.is_store_order) {
    let manualTotalPoints = 0;

    await pool.query('DELETE FROM recycle_order_items WHERE order_id = ?', [req.params.id]);

    for (const item of manualWasteItems) {
      const wasteName = getWasteName(item);
      const quantity = getWasteQuantity(item);
      const waste = await resolveWaste(wasteName);
      const itemPoints = Math.round(quantity * Number(waste.points_per_unit || 0));
      manualTotalPoints += itemPoints;

      await pool.query(
        `INSERT INTO recycle_order_items (order_id, waste_type_id, quantity, points)
         VALUES (?, ?, ?, ?)`,
        [req.params.id, waste.id, quantity, itemPoints]
      );
    }

    pointsToAward = manualTotalPoints;
    await pool.query('UPDATE recycle_orders SET total_points = ? WHERE id = ?', [
      manualTotalPoints,
      req.params.id,
    ]);
  }

  if (workerId !== undefined) {
    await pool.query('UPDATE recycle_orders SET status_id = ?, worker_id = ? WHERE id = ?', [
      statusIdByLabel(statusCode),
      workerId,
      req.params.id,
    ]);
  } else {
    await pool.query('UPDATE recycle_orders SET status_id = ? WHERE id = ?', [
      statusIdByLabel(statusCode),
      req.params.id,
    ]);
  }

  if (statusCode === 'received' && existingOrder.status_id !== 4 && !existingOrder.is_store_order) {
    await pool.query(
      `UPDATE users u
       JOIN recycle_orders ro ON ro.customer_id = u.id
       SET u.points = u.points + ?
       WHERE ro.id = ?`,
      [pointsToAward, req.params.id]
    );
  }

  return res.json({ message: 'Order status updated' });
};

export const deleteRecycleOrder = async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const userId = req.auth?.id;
  const userRole = req.auth?.role;

  // Retrieve order details to check status and ownership
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT customer_id, status_id, worker_id FROM recycle_orders WHERE id = ?',
    [orderId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const order = rows[0];

  if (userRole === 'user') {
    // Check ownership
    if (order.customer_id !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this order' });
    }
    // Block deletion if order status is accepted (2), received (4), or a worker is assigned
    if (order.status_id === 2 || order.status_id === 4 || order.worker_id !== null) {
      return res.status(400).json({
        message: 'Cannot delete order after it is approved or assigned to a worker',
      });
    }
  }

  await pool.query('DELETE FROM recycle_orders WHERE id = ?', [orderId]);
  return res.json({ message: 'Order deleted' });
};
