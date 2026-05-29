import { Router } from 'express';
import {
  getSettings,
  updateGeneralSettings,
  updateWastePoints,
} from '../controllers/settingsController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), getSettings);
router.put('/general', requireAuth, requireRole('admin'), updateGeneralSettings);
router.put('/waste-points', requireAuth, requireRole('admin'), updateWastePoints);

export default router;
