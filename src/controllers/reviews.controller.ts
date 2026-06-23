import { Response } from 'express';
import { Types } from 'mongoose';
import { Review } from '../models/Review';
import { Movie } from '../models/Movie';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { serializeReview, serializeMovie } from '../utils/serialize';
import { scoresForMovie } from '../utils/scores';

function validateRating(v: unknown): { ok: true; value: number } | { ok: false; error: string } {
  const n = Number(v);
  if (!Number.isFinite(n)) return { ok: false, error: 'Puntaje invalido.' };
  if (n < 0.5 || n > 5) return { ok: false, error: 'El puntaje debe estar entre 0.5 y 5.' };
  return { ok: true, value: Math.round(n * 2) / 2 };
}

function sanitizeText(v: unknown): string {
  return typeof v === 'string' ? v.slice(0, 2000) : '';
}

// Devuelve la pelicula serializada con sus puntajes recalculados.
async function movieWithScores(movieId: Types.ObjectId) {
  const movie = await Movie.findById(movieId);
  const scores = await scoresForMovie(movieId);
  return movie ? serializeMovie(movie, scores) : null;
}

export async function listReviews(req: AuthRequest, res: Response) {
  const movieId = req.params.id;
  if (!Types.ObjectId.isValid(movieId)) {
    return res.status(400).json({ error: 'Identificador invalido.' });
  }
  const reviews = await Review.find({ movieId })
    .populate('userId', 'name avatar isCritic')
    .sort({ createdAt: -1 });
  return res.json({ reviews: reviews.map(serializeReview) });
}

export async function listMyReviews(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const reviews = await Review.find({ userId })
    .populate('userId', 'name avatar isCritic')
    .populate('movieId', 'title poster mediaType releaseDate')
    .sort({ createdAt: -1 });

  const out = reviews.map((r) => {
    const base = serializeReview(r);
    const mv = r.movieId as unknown as {
      _id: { toString(): string };
      title?: string;
      poster?: string;
      mediaType?: string;
      releaseDate?: string;
    };
    const movie =
      mv && typeof mv === 'object' && 'title' in mv
        ? {
            id: mv._id.toString(),
            title: mv.title || '',
            poster: mv.poster || '',
            mediaType: mv.mediaType,
            releaseDate: mv.releaseDate || '',
          }
        : undefined;
    return { ...base, movie };
  });

  return res.json({ reviews: out });
}

export async function createReview(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const movieId = req.params.id;
  if (!Types.ObjectId.isValid(movieId)) {
    return res.status(400).json({ error: 'Identificador invalido.' });
  }
  const movie = await Movie.findById(movieId);
  if (!movie) return res.status(404).json({ error: 'Titulo no encontrado.' });

  const ratingCheck = validateRating(req.body?.rating);
  if (!ratingCheck.ok) return res.status(400).json({ error: ratingCheck.error });

  const already = await Review.findOne({ movieId, userId });
  if (already) {
    return res.status(409).json({ error: 'Ya has resenado este titulo. Editala en su lugar.' });
  }

  const user = await User.findById(userId);
  const review = await Review.create({
    movieId,
    userId,
    rating: ratingCheck.value,
    text: sanitizeText(req.body?.text),
    isCritic: !!user?.isCritic,
  });
  await review.populate('userId', 'name avatar isCritic');

  return res.status(201).json({
    review: serializeReview(review),
    movie: await movieWithScores(movie._id),
  });
}

export async function updateReview(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const id = req.params.id;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Identificador invalido.' });
  }
  const review = await Review.findById(id);
  if (!review) return res.status(404).json({ error: 'Resena no encontrada.' });
  if (review.userId.toString() !== userId) {
    return res.status(403).json({ error: 'No puedes editar una resena que no es tuya.' });
  }

  if (req.body?.rating !== undefined) {
    const ratingCheck = validateRating(req.body.rating);
    if (!ratingCheck.ok) return res.status(400).json({ error: ratingCheck.error });
    review.rating = ratingCheck.value;
  }
  if (req.body?.text !== undefined) {
    review.text = sanitizeText(req.body.text);
  }
  // Mantiene el rol de critico sincronizado con el del usuario.
  const user = await User.findById(userId);
  review.isCritic = !!user?.isCritic;

  await review.save();
  await review.populate('userId', 'name avatar isCritic');

  return res.json({
    review: serializeReview(review),
    movie: await movieWithScores(review.movieId),
  });
}

export async function deleteReview(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const id = req.params.id;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Identificador invalido.' });
  }
  const review = await Review.findById(id);
  if (!review) return res.status(404).json({ error: 'Resena no encontrada.' });
  if (review.userId.toString() !== userId) {
    return res.status(403).json({ error: 'No puedes borrar una resena que no es tuya.' });
  }
  const movieId = review.movieId;
  await review.deleteOne();

  return res.json({ ok: true, movie: await movieWithScores(movieId) });
}
