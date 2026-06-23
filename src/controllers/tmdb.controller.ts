import { Response } from 'express';
import { Movie, MediaType } from '../models/Movie';
import { AuthRequest } from '../middleware/auth.middleware';
import { serializeMovie } from '../utils/serialize';
import { scoresForMovie } from '../utils/scores';
import { tmdbSearch, tmdbDetails } from '../utils/tmdb';

export async function search(req: AuthRequest, res: Response) {
  const q = req.query.q;
  const type = req.query.type;
  if (typeof q !== 'string' || !q.trim()) {
    return res.status(400).json({ error: 'Falta el parametro de busqueda "q".' });
  }
  const mediaType = type === 'movie' || type === 'tv' ? (type as MediaType) : undefined;

  const results = await tmdbSearch(q.trim(), mediaType);

  // Marca cuales ya estan en nuestra DB.
  const tmdbIds = results.map((r) => r.tmdbId);
  const existing = await Movie.find({ tmdbId: { $in: tmdbIds } }).select('tmdbId mediaType _id');
  const map = new Map<string, string>();
  for (const m of existing) map.set(`${m.tmdbId}-${m.mediaType}`, m._id.toString());

  const out = results.map((r) => {
    const localId = map.get(`${r.tmdbId}-${r.mediaType}`);
    return { ...r, inLibrary: !!localId, localId };
  });

  return res.json({ results: out });
}

export async function importMovie(req: AuthRequest, res: Response) {
  const { tmdbId, mediaType } = req.body || {};
  if (typeof tmdbId !== 'number' || (mediaType !== 'movie' && mediaType !== 'tv')) {
    return res.status(400).json({ error: 'Parametros invalidos (tmdbId numerico y mediaType movie|tv).' });
  }

  let movie = await Movie.findOne({ tmdbId, mediaType });
  if (!movie) {
    const data = await tmdbDetails(tmdbId, mediaType);
    movie = await Movie.create(data);
  }

  const scores = await scoresForMovie(movie._id);
  return res.status(201).json({ movie: serializeMovie(movie, scores) });
}
