import { Router } from 'express';
import {
  createWorker,
  deleteWorker,
  listUsers,
  listWorkers,
  updateUserStatus,
  updateWorker,
} from '../controllers/userController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), listUsers);
router.patch('/:id/status', requireAuth, requireRole('admin'), updateUserStatus);
router.get('/workers', requireAuth, requireRole('admin'), listWorkers);
router.post('/workers', requireAuth, requireRole('admin'), createWorker);
router.put('/workers/:id', requireAuth, requireRole('admin'), updateWorker);
router.delete('/workers/:id', requireAuth, requireRole('admin'), deleteWorker);

export default router;
