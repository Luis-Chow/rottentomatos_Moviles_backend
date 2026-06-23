import { IUser } from '../models/User';
import { IMovie } from '../models/Movie';
import { IReview } from '../models/Review';
import { Scores } from './scores';

export function serializeUser(u: IUser) {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    avatar: u.avatar ?? '',
    isCritic: !!u.isCritic,
    createdAt: u.createdAt.toISOString(),
  };
}

export function serializeMovie(m: IMovie, scores: Scores) {
  return {
    id: m._id.toString(),
    tmdbId: m.tmdbId,
    mediaType: m.mediaType,
    title: m.title,
    originalTitle: m.originalTitle ?? '',
    overview: m.overview ?? '',
    poster: m.poster ?? '',
    backdrop: m.backdrop ?? '',
    images: m.images ?? [],
    genres: m.genres ?? [],
    releaseDate: m.releaseDate ?? '',
    runtime: m.runtime ?? 0,
    cast: (m.cast ?? []).map((c) => ({
      name: c.name,
      character: c.character ?? '',
      photo: c.photo ?? '',
    })),
    directors: m.directors ?? [],
    tmdbScore: m.tmdbScore ?? 0,
    userScore: scores.userScore,
    userScoreCount: scores.userScoreCount,
    criticScore: scores.criticScore,
    criticScoreCount: scores.criticScoreCount,
    createdAt: m.createdAt.toISOString(),
  };
}

type MaybePopulated = {
  _id?: { toString(): string };
  toString(): string;
  name?: string;
  avatar?: string;
  isCritic?: boolean;
};

function idFrom(ref: unknown): string {
  if (ref == null) return ''; // resena huerfana (usuario/pelicula borrada): no crashear
  const r = ref as MaybePopulated;
  if (typeof r === 'object' && r._id) return r._id.toString();
  return (r as { toString(): string }).toString();
}

export function serializeReview(r: IReview) {
  const populated = r.userId as unknown as MaybePopulated;
  const isPopulated = populated && typeof populated === 'object' && 'name' in populated;
  const userId = idFrom(r.userId);
  const author = isPopulated
    ? { id: userId, name: populated.name || '', avatar: populated.avatar || '', isCritic: !!populated.isCritic }
    : { id: userId, name: '', avatar: '', isCritic: false };
  return {
    id: r._id.toString(),
    movieId: idFrom(r.movieId),
    userId,
    author,
    rating: r.rating,
    text: r.text ?? '',
    isCritic: !!r.isCritic,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
  };
}
