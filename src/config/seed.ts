import bcrypt from 'bcryptjs';
import { Movie, IMovie, MediaType } from '../models/Movie';
import { User } from '../models/User';
import { Review } from '../models/Review';
import { tmdbDetails } from '../utils/tmdb';
import { env } from './env';

// Titulos de demo. Si hay TMDB_API_KEY se importan con datos reales (poster,
// sinopsis, reparto, imagenes...). Si no, se usa el fallback de abajo (sin poster).
const DEMO_TITLES: { tmdbId: number; mediaType: MediaType }[] = [
  { tmdbId: 550, mediaType: 'movie' }, // Fight Club
  { tmdbId: 603, mediaType: 'movie' }, // The Matrix
  { tmdbId: 27205, mediaType: 'movie' }, // Inception
  { tmdbId: 157336, mediaType: 'movie' }, // Interstellar
  { tmdbId: 155, mediaType: 'movie' }, // The Dark Knight
  { tmdbId: 1396, mediaType: 'tv' }, // Breaking Bad
];

// Datos minimos por si no hay clave de TMDB (el catalogo igual tiene contenido).
const FALLBACK: Record<number, Partial<IMovie>> = {
  550: { title: 'El club de la pelea', originalTitle: 'Fight Club', releaseDate: '1999-10-15', runtime: 139, tmdbScore: 8.4, genres: ['Drama'], overview: 'Un oficinista insomne y un vendedor de jabon forman un club clandestino de peleas.', directors: ['David Fincher'], cast: [{ name: 'Brad Pitt', character: 'Tyler Durden' }, { name: 'Edward Norton', character: 'El Narrador' }] },
  603: { title: 'Matrix', originalTitle: 'The Matrix', releaseDate: '1999-03-31', runtime: 136, tmdbScore: 8.2, genres: ['Accion', 'Ciencia ficcion'], overview: 'Un hacker descubre que la realidad es una simulacion creada por maquinas.', directors: ['Lana Wachowski', 'Lilly Wachowski'], cast: [{ name: 'Keanu Reeves', character: 'Neo' }, { name: 'Laurence Fishburne', character: 'Morfeo' }] },
  27205: { title: 'El origen', originalTitle: 'Inception', releaseDate: '2010-07-16', runtime: 148, tmdbScore: 8.4, genres: ['Accion', 'Ciencia ficcion', 'Aventura'], overview: 'Un ladron capaz de robar secretos del subconsciente debe implantar una idea.', directors: ['Christopher Nolan'], cast: [{ name: 'Leonardo DiCaprio', character: 'Dom Cobb' }] },
  157336: { title: 'Interestelar', originalTitle: 'Interstellar', releaseDate: '2014-11-05', runtime: 169, tmdbScore: 8.4, genres: ['Aventura', 'Drama', 'Ciencia ficcion'], overview: 'Un grupo de exploradores viaja a traves de un agujero de gusano en busca de un nuevo hogar para la humanidad.', directors: ['Christopher Nolan'], cast: [{ name: 'Matthew McConaughey', character: 'Cooper' }] },
  155: { title: 'El caballero de la noche', originalTitle: 'The Dark Knight', releaseDate: '2008-07-16', runtime: 152, tmdbScore: 8.5, genres: ['Drama', 'Accion', 'Crimen'], overview: 'Batman se enfrenta al Joker, un criminal que sume a Gotham en el caos.', directors: ['Christopher Nolan'], cast: [{ name: 'Christian Bale', character: 'Bruce Wayne' }, { name: 'Heath Ledger', character: 'Joker' }] },
  1396: { title: 'Breaking Bad', originalTitle: 'Breaking Bad', releaseDate: '2008-01-20', runtime: 47, tmdbScore: 8.9, genres: ['Drama', 'Crimen'], overview: 'Un profesor de quimica con cancer terminal empieza a fabricar metanfetamina.', directors: ['Vince Gilligan'], cast: [{ name: 'Bryan Cranston', character: 'Walter White' }, { name: 'Aaron Paul', character: 'Jesse Pinkman' }] },
};

async function insertDemoMovies(): Promise<IMovie[]> {
  const docs: IMovie[] = [];
  for (const t of DEMO_TITLES) {
    try {
      let data: Partial<IMovie>;
      if (env.tmdbApiKey) {
        data = (await tmdbDetails(t.tmdbId, t.mediaType)) as unknown as Partial<IMovie>;
      } else {
        data = { tmdbId: t.tmdbId, mediaType: t.mediaType, ...FALLBACK[t.tmdbId] };
      }
      docs.push(await Movie.create(data));
    } catch (e) {
      // Si TMDB falla para un titulo, cae al fallback sin romper el arranque.
      try {
        docs.push(await Movie.create({ tmdbId: t.tmdbId, mediaType: t.mediaType, ...FALLBACK[t.tmdbId] }));
      } catch {
        /* ignora duplicados */
      }
    }
  }
  return docs;
}

// Usuarios demo + reseñas para mostrar la diferencia Usuarios vs Criticos.
async function seedDemoUsersAndReviews(movies: IMovie[]): Promise<void> {
  const hash = await bcrypt.hash('123456', 10);
  const [ana, roger] = await Promise.all([
    User.findOneAndUpdate(
      { email: 'ana@demo.com' },
      { $setOnInsert: { name: 'Ana López', email: 'ana@demo.com', password: hash, isCritic: false } },
      { new: true, upsert: true }
    ),
    User.findOneAndUpdate(
      { email: 'critico@demo.com' },
      { $setOnInsert: { name: 'Roger (Crítico)', email: 'critico@demo.com', password: hash, isCritic: true } },
      { new: true, upsert: true }
    ),
  ]);

  // [indice de pelicula, rating de Ana (usuario), rating de Roger (critico), texto usuario, texto critico]
  const plan: [number, number, number, string, string][] = [
    [0, 5, 4, '¡Un clásico, me voló la cabeza!', 'Provocadora, aunque su mensaje envejeció regular.'],
    [1, 4.5, 5, 'Efectos increíbles para su época.', 'Redefinió el cine de ciencia ficción.'],
    [2, 5, 4.5, 'Me perdí pero me encantó.', 'Un rompecabezas brillante y ambicioso.'],
    [3, 4, 3.5, 'Preciosa y emotiva.', 'Espectacular en lo visual, irregular en el guion.'],
    [4, 5, 5, 'La mejor serie que he visto.', 'Narrativa impecable de principio a fin.'],
  ];

  for (const [idx, uRating, cRating, uText, cText] of plan) {
    const movie = movies[idx];
    if (!movie) continue;
    await Review.findOneAndUpdate(
      { movieId: movie._id, userId: ana._id },
      { $setOnInsert: { movieId: movie._id, userId: ana._id, rating: uRating, text: uText, isCritic: false } },
      { upsert: true }
    );
    await Review.findOneAndUpdate(
      { movieId: movie._id, userId: roger._id },
      { $setOnInsert: { movieId: movie._id, userId: roger._id, rating: cRating, text: cText, isCritic: true } },
      { upsert: true }
    );
  }
}

export async function seedDemo(): Promise<void> {
  const count = await Movie.countDocuments();
  let movies: IMovie[];
  if (count === 0) {
    movies = await insertDemoMovies();
    console.log(`[seed] ${movies.length} titulos de demo insertados${env.tmdbApiKey ? ' (con datos de TMDB)' : ' (fallback sin poster)'}.`);
  } else {
    movies = await Movie.find().sort({ createdAt: 1 }).limit(DEMO_TITLES.length);
  }

  const users = await User.countDocuments();
  if (users === 0 && movies.length) {
    await seedDemoUsersAndReviews(movies);
    console.log('[seed] usuarios demo: ana@demo.com (usuario) y critico@demo.com (critico) / pass 123456, con reseñas.');
  }
}

// Compatibilidad con el nombre anterior.
export const seedDemoMovies = seedDemo;
