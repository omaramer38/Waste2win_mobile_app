import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from '../controllers/productController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', listProducts);
router.post('/', requireAuth, requireRole('admin'), createProduct);
router.put('/:id', requireAuth, requireRole('admin'), updateProduct);
router.delete('/:id', requireAuth, requireRole('admin'), deleteProduct);

export default router;
