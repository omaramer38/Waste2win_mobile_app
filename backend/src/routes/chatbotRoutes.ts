import { Router } from 'express';
import { sendChatbotMessage } from '../controllers/chatbotController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.post('/message', requireAuth, requireRole('user'), sendChatbotMessage);

export default router;
