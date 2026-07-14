import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { getMe, updateMe, deleteMe, getUserById } from '../controllers/users.controller';
import { listUserReviews } from '../controllers/reviews.controller';

const router = Router();

router.use(requireAuth);

router.get('/me', (req, res, next) => {
  getMe(req as AuthRequest, res).catch(next);
});
router.patch('/me', (req, res, next) => {
  updateMe(req as AuthRequest, res).catch(next);
});
router.delete('/me', (req, res, next) => {
  deleteMe(req as AuthRequest, res).catch(next);
});

// Perfil publico (debe ir despues de /me para no capturarlo como :id).
router.get('/:id', (req, res, next) => {
  getUserById(req as AuthRequest, res).catch(next);
});
router.get('/:id/reviews', (req, res, next) => {
  listUserReviews(req as AuthRequest, res).catch(next);
});

export default router;
