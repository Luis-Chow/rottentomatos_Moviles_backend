import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'cambia-este-secreto-en-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  tmdbApiKey: process.env.TMDB_API_KEY || '',
  tmdbLang: process.env.TMDB_LANG || 'es-ES',
  tmdbImageBase: process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p',
  // Siembra unos titulos de demo si la coleccion esta vacia (util en local sin TMDB).
  seedDemo: (process.env.SEED_DEMO || 'true') !== 'false',
};
