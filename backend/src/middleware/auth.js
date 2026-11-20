'use strict';

const { ErrorApp } = require('../errores');

function extraerToken(req) {
  const h = req.headers.authorization || '';
  const [tipo, token] = h.split(' ');
  return tipo === 'Bearer' && token ? token : null;
}

/** Carga el usuario si hay token válido; no exige autenticación. */
function autenticacionOpcional(repo) {
  return async (req, _res, next) => {
    try {
      const token = extraerToken(req);
      req.usuario = token ? await repo.verificarToken(token) : null;
      if (req.usuario && !req.usuario.activo) req.usuario = null;
      next();
    } catch (e) {
      next(e);
    }
  };
}

/** Exige un usuario autenticado y activo (HU02, HU03 – 401). */
function requerirSesion(req, _res, next) {
  if (!req.usuario) return next(new ErrorApp(401, 'Debes iniciar sesión'));
  return next();
}

module.exports = { autenticacionOpcional, requerirSesion, extraerToken };
