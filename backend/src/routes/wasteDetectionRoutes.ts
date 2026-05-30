import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { detectWasteImage } from '../services/wasteDetection';

const router = Router();

router.post('/detect', requireAuth, requireRole('worker', 'admin'), async (req, res) => {
  try {
    const result = await detectWasteImage(req.body.image);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Waste detection failed' });
  }
});

export default router;
