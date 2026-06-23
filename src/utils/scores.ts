import { Types } from 'mongoose';
import { Review } from '../models/Review';

export interface Scores {
  userScore: number | null;
  userScoreCount: number;
  criticScore: number | null;
  criticScoreCount: number;
}

export function emptyScores(): Scores {
  return { userScore: null, userScoreCount: 0, criticScore: null, criticScoreCount: 0 };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Calcula promedios separados de usuarios (isCritic=false) y criticos (isCritic=true).
export function aggregateScores(rows: { rating: number; isCritic: boolean }[]): Scores {
  let uSum = 0, uCount = 0, cSum = 0, cCount = 0;
  for (const r of rows) {
    if (r.isCritic) { cSum += r.rating; cCount++; }
    else { uSum += r.rating; uCount++; }
  }
  return {
    userScore: uCount ? round1(uSum / uCount) : null,
    userScoreCount: uCount,
    criticScore: cCount ? round1(cSum / cCount) : null,
    criticScoreCount: cCount,
  };
}

export async function scoresForMovie(movieId: Types.ObjectId | string): Promise<Scores> {
  const rows = await Review.find({ movieId }).select('rating isCritic');
  return aggregateScores(rows);
}

// Puntajes para varias peliculas en una sola consulta (evita N+1 en el listado).
export async function scoresForMovieIds(ids: Types.ObjectId[]): Promise<Map<string, Scores>> {
  const map = new Map<string, Scores>();
  for (const id of ids) map.set(id.toString(), emptyScores());
  if (ids.length === 0) return map;

  const rows = await Review.find({ movieId: { $in: ids } }).select('movieId rating isCritic');
  const grouped = new Map<string, { rating: number; isCritic: boolean }[]>();
  for (const r of rows) {
    const key = r.movieId.toString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push({ rating: r.rating, isCritic: r.isCritic });
  }
  for (const [key, arr] of grouped) map.set(key, aggregateScores(arr));
  return map;
}
