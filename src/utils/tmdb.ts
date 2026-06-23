import { env } from '../config/env';
import { MediaType, ICastMember } from '../models/Movie';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export interface TmdbSearchItem {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  poster?: string;
  releaseDate?: string;
  tmdbScore?: number;
}

export interface TmdbMovieData {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  poster: string;
  backdrop: string;
  images: string[];
  genres: string[];
  releaseDate: string;
  runtime: number;
  cast: ICastMember[];
  directors: string[];
  tmdbScore: number;
}

function img(path: string | null | undefined, size: string): string {
  return path ? `${env.tmdbImageBase}/${size}${path}` : '';
}

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!env.tmdbApiKey) {
    throw new Error('TMDB_API_KEY no esta configurada en el backend (.env).');
  }
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', env.tmdbApiKey);
  url.searchParams.set('language', env.tmdbLang);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('No se pudo contactar con TMDB.');
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error('TMDB rechazo la API key (401). Revisa TMDB_API_KEY.');
    if (res.status === 404) throw new Error('Recurso no encontrado en TMDB.');
    throw new Error(`Error de TMDB (${res.status}).`);
  }
  return res.json() as Promise<T>;
}

interface RawSearchResult {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

function mapSearchItem(r: RawSearchResult, forced?: MediaType): TmdbSearchItem | null {
  const mediaType = (forced || (r.media_type as MediaType)) as MediaType;
  if (mediaType !== 'movie' && mediaType !== 'tv') return null;
  return {
    tmdbId: r.id,
    mediaType,
    title: (mediaType === 'tv' ? r.name : r.title) || r.title || r.name || 'Sin titulo',
    overview: r.overview || '',
    poster: img(r.poster_path, 'w342') || undefined,
    releaseDate: (mediaType === 'tv' ? r.first_air_date : r.release_date) || undefined,
    tmdbScore: r.vote_average || undefined,
  };
}

export async function tmdbSearch(query: string, type?: MediaType): Promise<TmdbSearchItem[]> {
  if (type === 'movie' || type === 'tv') {
    const data = await tmdbGet<{ results: RawSearchResult[] }>(`/search/${type}`, {
      query,
      include_adult: 'false',
    });
    return data.results.map((r) => mapSearchItem(r, type)).filter((x): x is TmdbSearchItem => !!x);
  }
  const data = await tmdbGet<{ results: RawSearchResult[] }>('/search/multi', {
    query,
    include_adult: 'false',
  });
  return data.results.map((r) => mapSearchItem(r)).filter((x): x is TmdbSearchItem => !!x);
}

interface RawDetails {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  vote_average?: number;
  genres?: { id: number; name: string }[];
  created_by?: { name: string }[];
  credits?: {
    cast?: { name: string; character?: string; profile_path?: string | null }[];
    crew?: { name: string; job?: string; profile_path?: string | null }[];
  };
  images?: { backdrops?: { file_path: string }[] };
}

export async function tmdbDetails(tmdbId: number, mediaType: MediaType): Promise<TmdbMovieData> {
  const data = await tmdbGet<RawDetails>(`/${mediaType}/${tmdbId}`, {
    append_to_response: 'credits,images',
    include_image_language: 'es,en,null',
  });

  const cast: ICastMember[] = (data.credits?.cast ?? []).slice(0, 15).map((c) => ({
    name: c.name,
    character: c.character || '',
    photo: img(c.profile_path, 'w185'),
  }));

  let directors: string[] = [];
  if (mediaType === 'movie') {
    directors = (data.credits?.crew ?? [])
      .filter((c) => c.job === 'Director')
      .map((c) => c.name);
  } else {
    directors = (data.created_by ?? []).map((c) => c.name);
  }

  const images = (data.images?.backdrops ?? [])
    .slice(0, 8)
    .map((b) => img(b.file_path, 'w780'))
    .filter((u) => !!u);

  return {
    tmdbId: data.id,
    mediaType,
    title: (mediaType === 'tv' ? data.name : data.title) || data.title || data.name || 'Sin titulo',
    originalTitle: (mediaType === 'tv' ? data.original_name : data.original_title) || '',
    overview: data.overview || '',
    poster: img(data.poster_path, 'w500'),
    backdrop: img(data.backdrop_path, 'w780'),
    images,
    genres: (data.genres ?? []).map((g) => g.name),
    releaseDate: (mediaType === 'tv' ? data.first_air_date : data.release_date) || '',
    runtime: data.runtime || data.episode_run_time?.[0] || 0,
    cast,
    directors,
    tmdbScore: data.vote_average || 0,
  };
}
