import { createApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';
import { seedDemoMovies } from './config/seed';

async function main() {
  await connectDB();

  if (env.seedDemo) {
    try {
      await seedDemoMovies();
    } catch (e) {
      console.warn('[seed] no se pudo sembrar demo:', e);
    }
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] escuchando en http://localhost:${env.port}`);
    if (!env.tmdbApiKey) {
      console.log('[server] AVISO: TMDB_API_KEY vacia -> la busqueda/importacion de TMDB no funcionara.');
    }
  });

  const shutdown = async (signal: string) => {
    console.log(`[server] recibido ${signal}, cerrando...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[server] error al arrancar:', err);
  process.exit(1);
});
