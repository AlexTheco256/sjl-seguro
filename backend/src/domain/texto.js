'use strict';

/**
 * Elimina etiquetas HTML y caracteres de control para evitar XSS almacenado (HU05).
 * React escapa al renderizar; esta es una segunda capa (defensa en profundidad).
 */
function sanitizarTexto(texto) {
  return String(texto ?? '')
    .replace(/<\/?[a-zA-Z!][^>]*>/g, '') // etiquetas HTML y comentarios
    .replace(/[<>]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

module.exports = { sanitizarTexto };
