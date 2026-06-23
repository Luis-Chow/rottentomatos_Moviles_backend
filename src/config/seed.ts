import { Movie } from '../models/Movie';

// Titulos de demo para tener contenido en local sin necesidad de TMDB.
// Sin poster (se muestra el placeholder); si luego los importas de TMDB con el
// mismo tmdbId+mediaType obtendras las imagenes reales.
const DEMO = [
  {
    tmdbId: 550, mediaType: 'movie' as const, title: 'El club de la pelea',
    originalTitle: 'Fight Club', releaseDate: '1999-10-15', runtime: 139, tmdbScore: 8.4,
    genres: ['Drama'],
    overview:
      'Un oficinista insomne y un carismatico vendedor de jabon forman un club clandestino de peleas que evoluciona hacia algo mucho mayor.',
    directors: ['David Fincher'],
    cast: [
      { name: 'Brad Pitt', character: 'Tyler Durden' },
      { name: 'Edward Norton', character: 'El Narrador' },
      { name: 'Helena Bonham Carter', character: 'Marla Singer' },
    ],
  },
  {
    tmdbId: 603, mediaType: 'movie' as const, title: 'Matrix',
    originalTitle: 'The Matrix', releaseDate: '1999-03-31', runtime: 136, tmdbScore: 8.2,
    genres: ['Accion', 'Ciencia ficcion'],
    overview:
      'Un hacker descubre que la realidad es una simulacion creada por maquinas y se une a la rebelion para liberar a la humanidad.',
    directors: ['Lana Wachowski', 'Lilly Wachowski'],
    cast: [
      { name: 'Keanu Reeves', character: 'Neo' },
      { name: 'Laurence Fishburne', character: 'Morfeo' },
      { name: 'Carrie-Anne Moss', character: 'Trinity' },
    ],
  },
  {
    tmdbId: 27205, mediaType: 'movie' as const, title: 'El origen',
    originalTitle: 'Inception', releaseDate: '2010-07-16', runtime: 148, tmdbScore: 8.4,
    genres: ['Accion', 'Ciencia ficcion', 'Aventura'],
    overview:
      'Un ladron capaz de robar secretos del subconsciente recibe el encargo inverso: implantar una idea en la mente de un objetivo.',
    directors: ['Christopher Nolan'],
    cast: [
      { name: 'Leonardo DiCaprio', character: 'Dom Cobb' },
      { name: 'Joseph Gordon-Levitt', character: 'Arthur' },
      { name: 'Elliot Page', character: 'Ariadne' },
    ],
  },
  {
    tmdbId: 1396, mediaType: 'tv' as const, title: 'Breaking Bad',
    originalTitle: 'Breaking Bad', releaseDate: '2008-01-20', runtime: 47, tmdbScore: 8.9,
    genres: ['Drama', 'Crimen'],
    overview:
      'Un profesor de quimica con cancer terminal se asocia con un antiguo alumno para fabricar metanfetamina y asegurar el futuro de su familia.',
    directors: ['Vince Gilligan'],
    cast: [
      { name: 'Bryan Cranston', character: 'Walter White' },
      { name: 'Aaron Paul', character: 'Jesse Pinkman' },
      { name: 'Anna Gunn', character: 'Skyler White' },
    ],
  },
];

export async function seedDemoMovies(): Promise<void> {
  const count = await Movie.countDocuments();
  if (count > 0) return;
  await Movie.insertMany(DEMO);
  console.log(`[seed] ${DEMO.length} titulos de demo insertados (catalogo vacio).`);
}
