import { Schema, model, Document, Types } from 'mongoose';

export type MediaType = 'movie' | 'tv';

export interface ICastMember {
  tmdbPersonId?: number; // id de la persona en TMDB (para ver su perfil/filmografia)
  name: string;
  character?: string;
  photo?: string;
}

export interface IMovie extends Document {
  _id: Types.ObjectId;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle?: string;
  overview: string;
  poster?: string;
  backdrop?: string;
  images: string[];
  genres: string[];
  releaseDate?: string; // ISO date como string (ej. "1999-10-15")
  runtime?: number;
  cast: ICastMember[];
  directors: string[];
  tmdbScore?: number;
  createdAt: Date;
}

const CastSchema = new Schema<ICastMember>(
  {
    tmdbPersonId: { type: Number, default: 0 },
    name: { type: String, required: true },
    character: { type: String, default: '' },
    photo: { type: String, default: '' },
  },
  { _id: false }
);

const MovieSchema = new Schema<IMovie>(
  {
    tmdbId: { type: Number, required: true },
    mediaType: { type: String, enum: ['movie', 'tv'], required: true },
    title: { type: String, required: true, trim: true },
    originalTitle: { type: String, default: '' },
    overview: { type: String, default: '' },
    poster: { type: String, default: '' },
    backdrop: { type: String, default: '' },
    images: { type: [String], default: [] },
    genres: { type: [String], default: [] },
    releaseDate: { type: String, default: '' },
    runtime: { type: Number, default: 0 },
    cast: { type: [CastSchema], default: [] },
    directors: { type: [String], default: [] },
    tmdbScore: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Evita duplicados del mismo titulo importado de TMDB.
MovieSchema.index({ tmdbId: 1, mediaType: 1 }, { unique: true });

export const Movie = model<IMovie>('Movie', MovieSchema);
