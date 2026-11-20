'use strict';

const express = require('express');
const { asincrono, listaParametro, fechaParametro } = require('./util');
const { TIPOS, FRANJAS, ESTADOS, ESTADOS_PUBLICOS, CENTRO_SJL, LIMITES_SJL, ZONAS } = require('../domain/constantes');
const { vistaPublica } = require('../domain/reportes');
const { filtrarPorRango } = require('../domain/fechas');

/** Endpoints públicos del mapa de zonas de riesgo (HU09–HU12). */
module.exports = function rutasIncidentes(repo) {
  const r = express.Router();

  r.get('/meta', (_req, res) => {
    res.json({
      tipos: TIPOS,
      franjas: Object.fromEntries(Object.entries(FRANJAS).map(([k, v]) => [k, v.etiqueta])),
      estados: ESTADOS,
      centro: CENTRO_SJL,
      limites: LIMITES_SJL,
      zonas: ZONAS,
    });
  });

  r.get(
    '/',
    asincrono(async (req, res) => {
      const lista = await repo.listarReportes({ estados: ESTADOS_PUBLICOS });
      const incidentes = filtrarPorRango(lista, fechaParametro(req.query.desde), fechaParametro(req.query.hasta))
        .map(vistaPublica);
      res.set('Cache-Control', 'public, max-age=30');
      res.json({ total: incidentes.length, incidentes });
    }),
  );

  return r;
};
