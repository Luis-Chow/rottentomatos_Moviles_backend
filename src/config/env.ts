import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

// El secreto JWT NUNCA debe tener un valor por defecto compartido en produccion
// (cualquiera que lo conozca podria firmar tokens validos).
let jwtSecret = process.env.JWT_SECRET || '';
if (!jwtSecret) {
  if (isProd) {
    throw new Error('JWT_SECRET es obligatorio en produccion. Define la variable de entorno.');
  }
  jwtSecret = 'dev-only-insecure-secret-rottentomatos';
  console.warn('[env] JWT_SECRET no definido: usando un secreto SOLO de desarrollo. No usar en produccion.');
}

export const env = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  tmdbApiKey: process.env.TMDB_API_KEY || '',
  tmdbLang: process.env.TMDB_LANG || 'es-ES',
  tmdbImageBase: process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p',
  // Siembra unos titulos de demo si la coleccion esta vacia (util en local sin TMDB).
  seedDemo: (process.env.SEED_DEMO || 'true') !== 'false',
};
