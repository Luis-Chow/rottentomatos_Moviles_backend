import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { listMyReviews, updateReview, deleteReview } from '../controllers/reviews.controller';

const router = Router();

router.use(requireAuth);

router.get('/mine', (req, res, next) => {
  listMyReviews(req as AuthRequest, res).catch(next);
});
router.patch('/:id', (req, res, next) => {
  updateReview(req as AuthRequest, res).catch(next);
});
router.delete('/:id', (req, res, next) => {
  deleteReview(req as AuthRequest, res).catch(next);
});

export default router;
