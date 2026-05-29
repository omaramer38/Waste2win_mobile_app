import { Router } from 'express';
import {
  createStoreOrder,
  deleteStoreOrder,
  listStoreOrders,
} from '../controllers/storeOrderController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listStoreOrders);
router.post('/', requireAuth, requireRole('user'), createStoreOrder);
router.delete('/:id', requireAuth, requireRole('admin', 'user'), deleteStoreOrder);

export default router;
