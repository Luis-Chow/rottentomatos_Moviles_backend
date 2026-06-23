import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import moviesRoutes from './routes/movies.routes';
import reviewsRoutes from './routes/reviews.routes';
import tmdbRoutes from './routes/tmdb.routes';
import { notFound, errorHandler } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'El payload es demasiado grande (max 10MB).' });
    }
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON invalido.' });
    }
    next(err);
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'rotten-tomatos-backend' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/tmdb', tmdbRoutes);
  app.use('/api/movies', moviesRoutes);
  app.use('/api/reviews', reviewsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
