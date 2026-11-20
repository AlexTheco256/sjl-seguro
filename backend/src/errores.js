'use strict';

/** Error de aplicación con código HTTP y mensaje seguro para el cliente. */
class ErrorApp extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

module.exports = { ErrorApp };
