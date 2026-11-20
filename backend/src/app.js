'use strict';

const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { autenticacionOpcional } = require('./middleware/auth');
const { noEncontrado, manejadorErrores } = require('./middleware/errores');

/**
 * Crea la aplicación Express.
 * @param {object} opciones
 * @param {object} opciones.repo           Repositorio (memoria o Supabase)
 * @param {string[]} [opciones.origenesCors] Orígenes permitidos para CORS
 * @param {string} [opciones.dirEstatico]  Carpeta del frontend compilado (SPA)
 * @param {boolean} [opciones.limites]     Activa el rate limiting (se desactiva en pruebas)
 */
function crearApp({ repo, origenesCors = [], dirEstatico, limites = true, version = '1.0.0', commit = 'local' }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // detrás del proxy de Render

  // Cabeceras de seguridad (OWASP): CSP, HSTS, X-Frame-Options, etc.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'img-src': ["'self'", 'data:', 'blob:', 'https://tile.openstreetmap.org', 'https://*.tile.openstreetmap.org'],
          'connect-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'frame-ancestors': ["'none'"],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use((_req, res, next) => {
    res.set('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
    next();
  });

  if (origenesCors.length) {
    app.use('/api', cors({ origin: origenesCors, methods: ['GET', 'POST', 'PATCH'] }));
  }
  if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));
  app.use(express.json({ limit: '20kb' }));

  if (limites) {
    app.use(
      '/api',
      rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }),
    );
  }

  // Health check para Render, el pipeline (smoke test) y el monitoreo.
  app.get('/api/health', (_req, res) => {
    res.json({ estado: 'ok', servicio: 'sjl-seguro-api', version, commit, modo: repo.modo, hora: new Date().toISOString() });
  });

  app.use('/api', autenticacionOpcional(repo));
  app.use('/api/auth', require('./routes/auth')(repo, { limites }));
  app.use('/api/incidentes', require('./routes/incidentes')(repo));
  app.use('/api/reportes', require('./routes/reportes')(repo, { limites }));
  app.use('/api', noEncontrado);

  // Frontend compilado (React) servido por el mismo servicio.
  if (dirEstatico && fs.existsSync(path.join(dirEstatico, 'index.html'))) {
    app.use(express.static(dirEstatico, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(path.join(dirEstatico, 'index.html')));
  }

  app.use(noEncontrado);
  app.use(manejadorErrores);
  return app;
}

module.exports = { crearApp };
