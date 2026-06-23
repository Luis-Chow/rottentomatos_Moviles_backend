import { Response } from 'express';
import { Types } from 'mongoose';
import { Movie } from '../models/Movie';
import { AuthRequest } from '../middleware/auth.middleware';
import { serializeMovie } from '../utils/serialize';
import { scoresForMovie, scoresForMovieIds, emptyScores } from '../utils/scores';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type SerializedMovie = ReturnType<typeof serializeMovie>;

function overall(m: SerializedMovie): number | null {
  const total = m.userScoreCount + m.criticScoreCount;
  if (total === 0) return null;
  return ((m.userScore ?? 0) * m.userScoreCount + (m.criticScore ?? 0) * m.criticScoreCount) / total;
}

export async function listMovies(req: AuthRequest, res: Response) {
  const { search, genre, type, year, minScore, sort } = req.query;
  const filter: Record<string, unknown> = {};

  if (type === 'movie' || type === 'tv') filter.mediaType = type;
  if (typeof search === 'string' && search.trim()) {
    filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }
  if (typeof genre === 'string' && genre.trim()) {
    filter.genres = { $regex: `^${escapeRegex(genre.trim())}$`, $options: 'i' };
  }
  if (typeof year === 'string' && /^\d{4}$/.test(year)) {
    filter.releaseDate = { $regex: `^${year}` };
  }

  const movies = await Movie.find(filter);
  const scoresMap = await scoresForMovieIds(movies.map((m) => m._id));
  let serialized = movies.map((m) => serializeMovie(m, scoresMap.get(m._id.toString()) || emptyScores()));

  if (typeof minScore === 'string' && Number(minScore) > 0) {
    const min = Number(minScore);
    serialized = serialized.filter((m) => {
      const s = overall(m);
      return s != null && s >= min;
    });
  }

  serialized.sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    if (sort === 'date') return (b.releaseDate || '').localeCompare(a.releaseDate || '');
    // por defecto: por puntuacion
    const sa = overall(a);
    const sb = overall(b);
    if (sa == null && sb == null) return a.title.localeCompare(b.title);
    if (sa == null) return 1;
    if (sb == null) return -1;
    return sb - sa;
  });

  return res.json({ movies: serialized });
}

export async function getMovie(req: AuthRequest, res: Response) {
  if (!Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Identificador invalido.' });
  }
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ error: 'Titulo no encontrado.' });
  const scores = await scoresForMovie(movie._id);
  return res.json({ movie: serializeMovie(movie, scores) });
}
