import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { listMovies, getMovie } from '../controllers/movies.controller';
import { listReviews, createReview } from '../controllers/reviews.controller';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res, next) => {
  listMovies(req as AuthRequest, res).catch(next);
});
router.get('/:id', (req, res, next) => {
  getMovie(req as AuthRequest, res).catch(next);
});

// Resenas asociadas a una pelicula (movieId = :id)
router.get('/:id/reviews', (req, res, next) => {
  listReviews(req as AuthRequest, res).catch(next);
});
router.post('/:id/reviews', (req, res, next) => {
  createReview(req as AuthRequest, res).catch(next);
});

export default router;
