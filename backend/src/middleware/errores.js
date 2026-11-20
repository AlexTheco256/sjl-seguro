'use strict';

const { ZodError } = require('zod');
const { ErrorApp } = require('../errores');

function erroresZod(error) {
  return error.issues.map((i) => ({ campo: i.path.join('.') || null, mensaje: i.message }));
}

function noEncontrado(req, _res, next) {
  next(new ErrorApp(404, `Ruta no encontrada: ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: erroresZod(err) });
  }
  if (err instanceof ErrorApp) {
    return res.status(err.status).json({ error: err.message, detalles: err.detalles });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Solicitud demasiado grande' });
  }
  // No se filtran trazas ni detalles internos al cliente (OWASP A05).
  console.error('[error]', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { noEncontrado, manejadorErrores, erroresZod };
