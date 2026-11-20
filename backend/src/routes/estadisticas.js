'use strict';

const express = require('express');
const { asincrono, listaParametro, fechaParametro } = require('./util');
const { requerirRol } = require('../middleware/auth');
const { TIPOS, ESTADOS_PUBLICOS } = require('../domain/constantes');
const { calcularEstadisticas, filtrarPorRango } = require('../domain/estadisticas');
const { reportesACsv } = require('../domain/csv');

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

  r.get(
    '/exportar.csv',
    asincrono(async (req, res) => {
      const tipos = listaParametro(req.query.tipos, Object.keys(TIPOS));
      const lista = filtrarPorRango(
        await repo.listarReportes({ estados: ESTADOS_PUBLICOS }),
        fechaParametro(req.query.desde),
        fechaParametro(req.query.hasta),
      ).filter((x) => !tipos || tipos.includes(x.tipo));
      const hoy = new Date().toISOString().slice(0, 10);
      res.set('Content-Type', 'text/csv; charset=utf-8');
      res.set('Content-Disposition', `attachment; filename="reportes-sjl-${hoy}.csv"`);
      res.send(reportesACsv(lista));
    }),
  );

  return r;
};
