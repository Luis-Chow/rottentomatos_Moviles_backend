# 🍅 RottenTomatos — Backend (Express + MongoDB + JWT + TMDB)

Backend REST para la app `rotten-tomatos-app`. Arquitectura por capas:
controllers / routes / models / middleware / utils.

## Puesta en marcha

```bash
npm install
cp .env.example .env     # definir TMDB_API_KEY y, opcionalmente, MONGODB_URI
npm run dev              # http://localhost:4000  (DB en RAM si no hay MONGODB_URI)
```

La integración con la API externa requiere una API Key de TMDB (v3 auth): https://developer.themoviedb.org

## Modelos (Mongoose)

**User**
```
name, email (unique, lowercase), password (hash bcrypt),
avatar (data URI, opcional), isCritic (boolean, default false), createdAt
```

**Movie** (catálogo cacheado desde TMDB)
```
tmdbId (number) + mediaType ('movie'|'tv')  -> índice único compuesto
title, originalTitle, overview, poster (URL), backdrop (URL), images [URL],
genres [string], releaseDate (Date), runtime (number),
cast [{ name, character, photo }], directors [string],
tmdbScore (number), createdAt
```
Los promedios `userScore / userScoreCount / criticScore / criticScoreCount`
NO se guardan: se calculan al serializar agregando las reseñas.

**Review** (comentario + puntaje)
```
movieId (ref Movie), userId (ref User), rating (number 0.5–5),
text (string <=2000), isCritic (snapshot del rol del autor), createdAt, updatedAt
```
Índice único `{ movieId, userId }` (una reseña por usuario y título).

## Serialización esperada por el frontend

`serializeMovie(movie, reviews)` debe devolver, además de los campos del modelo:
```jsonc
{
  "id": "...", "tmdbId": 603, "mediaType": "movie", "title": "...",
  "overview": "...", "poster": "https://...", "backdrop": "https://...",
  "images": ["https://..."], "genres": ["Acción"], "releaseDate": "1999-03-30",
  "runtime": 136, "cast": [{ "tmdbPersonId": 6384, "name": "...", "character": "...", "photo": "https://..." }],
  "directors": ["..."], "tmdbScore": 8.2,
  "userScore": 4.3, "userScoreCount": 12,     // promedio de reviews con isCritic=false
  "criticScore": 4.8, "criticScoreCount": 3,  // promedio de reviews con isCritic=true
  "createdAt": "..."
}
```
`userScore`/`criticScore` = `null` cuando el count es 0.

`serializeReview` incluye `author: { id, name, avatar, isCritic }` (populate del User).

## Endpoints (todos bajo `/api`, JWT Bearer salvo auth)

### Auth
- `POST /auth/register` `{ name, email, password, isCritic }` → `{ user, token }`
- `POST /auth/login` `{ email, password }` → `{ user, token }`

### Usuarios (CRUD) — requieren token
- `GET /users/me` → `{ user }`
- `PATCH /users/me` `{ name?, email?, avatar?, isCritic?, password?, currentPassword? }` → `{ user }`
- `DELETE /users/me` → `{ ok: true }`  (borra también sus reseñas)
- `GET /users/:id` → `{ user }`  (perfil público, sin email: `{ id, name, avatar, isCritic, createdAt, reviewsCount }`)
- `GET /users/:id/reviews` → `{ reviews }`  (mismo formato que `/reviews/mine`)

### TMDB (API externa)
- `GET /tmdb/search?q=...&type=movie|tv` → `{ results: TmdbResult[] }`
  - cada result: `{ tmdbId, mediaType, title, overview, poster, releaseDate, tmdbScore, inLibrary, localId }`
  - `inLibrary/localId` se rellenan consultando la colección Movie.
- `POST /tmdb/import` `{ tmdbId, mediaType }` → `{ movie }`
  - Busca el detalle en TMDB (con créditos e imágenes), lo guarda en Movie si no
    existe (o devuelve el existente) y responde con la Movie serializada.
- `GET /tmdb/person?id=<tmdbPersonId>` (o `?name=<nombre>` como respaldo) → `{ person }`
  - `person: { tmdbId, name, biography, photo, birthday, deathday, placeOfBirth, knownFor, credits }`
  - `credits`: filmografía (máx. 40, por popularidad), cada una
    `{ tmdbId, mediaType, title, poster, releaseDate, character, tmdbScore, inLibrary, localId }`.
  - Con `name`, resuelve el id vía `/search/person` (para títulos cacheados sin `tmdbPersonId`).
  - La filmografía no se persiste; un título se guarda solo al importarlo con `/tmdb/import`.

### Catálogo (Movie)
- `GET /movies?search=&genre=&type=&year=&minScore=&sort=score|date|title` → `{ movies }`
  - El frontend también filtra/ordena en cliente; soportar los params es opcional.
- `GET /movies/:id` → `{ movie }`

### Reseñas / Comentarios (CRUD)
- `GET /movies/:movieId/reviews` → `{ reviews }`
- `GET /reviews/mine` → `{ reviews }`  (cada una con `movie: { id, title, poster, mediaType, releaseDate }`)
- `POST /movies/:movieId/reviews` `{ rating, text }` → `{ review, movie }`
  - setea `isCritic` desde el usuario autenticado; recalcula y devuelve la Movie.
- `PATCH /reviews/:id` `{ rating?, text? }` → `{ review, movie }`  (solo el autor)
- `DELETE /reviews/:id` → `{ ok: true, movie }`  (solo el autor)

### Salud
- `GET /api/health` → `{ ok: true, service: "rotten-tomatos-backend" }`

## Estructura
```
src/
  app.ts, server.ts
  config/        env.ts, db.ts
  middleware/    auth.middleware.ts, error.middleware.ts
  utils/         jwt.ts, serialize.ts, tmdb.ts   (cliente TMDB)
  models/        User.ts, Movie.ts, Review.ts
  controllers/   auth.controller.ts, users.controller.ts,
                 tmdb.controller.ts, movies.controller.ts, reviews.controller.ts
  routes/        auth.routes.ts, users.routes.ts,
                 tmdb.routes.ts, movies.routes.ts, reviews.routes.ts
```
