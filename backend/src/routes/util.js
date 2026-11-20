'use strict';

/** Envuelve un handler async para que Express 4 capture sus errores. */
const asincrono = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Convierte "a,b,c" en ['a','b','c'] filtrando por una lista permitida. */
function listaParametro(valor, permitidos) {
  if (!valor) return null;
  const lista = String(valor)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => permitidos.includes(s));
  return lista.length ? lista : null;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const fechaParametro = (v) => (v && FECHA.test(String(v)) ? String(v) : undefined);

module.exports = { asincrono, listaParametro, fechaParametro };
