import { Router } from 'express';
import { getBootstrap } from '../controllers/bootstrapController';

const router = Router();

router.get('/', getBootstrap);

export default router;
