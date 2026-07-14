import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { search, importMovie, person } from '../controllers/tmdb.controller';

const router = Router();

router.use(requireAuth);

router.get('/search', (req, res, next) => {
  search(req as AuthRequest, res).catch(next);
});
router.get('/person', (req, res, next) => {
  person(req as AuthRequest, res).catch(next);
});
router.post('/import', (req, res, next) => {
  importMovie(req as AuthRequest, res).catch(next);
});

export default router;
