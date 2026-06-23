import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Ruta no encontrada.' });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ error: 'Datos invalidos.', details: err.message });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: 'Identificador invalido.' });
  }
  // Error de clave duplicada (indice unico)
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    return res.status(409).json({ error: 'Registro duplicado.' });
  }
  const message = err instanceof Error ? err.message : 'Error interno.';
  console.error('[error]', err);
  res.status(500).json({ error: message });
}
