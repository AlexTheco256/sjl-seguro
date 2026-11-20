'use strict';

const express = require('express');
const { asincrono, listaParametro, fechaParametro } = require('./util');
const { requerirRol } = require('../middleware/auth');
const { TIPOS, ESTADOS_PUBLICOS } = require('../domain/constantes');
const { calcularEstadisticas, filtrarPorRango } = require('../domain/estadisticas');

/** Panel de indicadores, ranking y exportación (HU17, HU18, HU20). */
module.exports = function rutasEstadisticas(repo) {
  const r = express.Router();
  r.use(requerirRol('serenazgo', 'administrador'));

  r.get(
    '/',
    asincrono(async (req, res) => {
      const desde = fechaParametro(req.query.desde);
      const hasta = fechaParametro(req.query.hasta);
      const lista = filtrarPorRango(await repo.listarReportes(), desde, hasta);
      res.json({ desde: desde || null, hasta: hasta || null, ...calcularEstadisticas(lista) });
    }),
  );

  return r;
};
