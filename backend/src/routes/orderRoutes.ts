import { Router } from 'express';
import {
  createRecycleOrder,
  deleteRecycleOrder,
  listRecycleOrders,
  updateRecycleOrderStatus,
} from '../controllers/orderController';
import { getWorkerOrders, runOptimization } from '../services/routeOptimization';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Existing order routes
router.get('/', requireAuth, listRecycleOrders);
router.post('/', requireAuth, requireRole('user'), createRecycleOrder);
router.patch('/:id/status', requireAuth, requireRole('admin', 'worker'), updateRecycleOrderStatus);
router.delete('/:id', requireAuth, requireRole('admin', 'user'), deleteRecycleOrder);

// New route: fetch worker orders
router.get('/worker/:workerId/orders', requireAuth, requireRole('worker'), async (req, res) => {
  try {
    const workerId = Number(req.params.workerId);
    const orders = await getWorkerOrders(workerId);
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch worker orders' });
  }
});

// New route: compute optimal route for a worker's orders
router.post('/worker/:workerId/optimal-route', requireAuth, requireRole('worker'), async (req, res) => {
  try {
    const workerId = Number(req.params.workerId);
    const orders = await getWorkerOrders(workerId);
    const mapPath = await runOptimization(orders);
    // Return URL relative to server root; frontend can embed via <iframe>
    res.json({ mapUrl: `/smart_waste_ai/${mapPath}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Route optimization failed' });
  }
});

export default router;
