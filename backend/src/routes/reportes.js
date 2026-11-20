'use strict';

const express = require('express');
const { asincrono } = require('./util');
const { validarReporte, zonaMasCercana, franjaHoraria, esCritico } = require('../domain/reportes');
const { ErrorApp } = require('../errores');
const { erroresZod } = require('../middleware/errores');

/** Reporte ciudadano de incidentes (HU05–HU08). */
module.exports = function rutasReportes(repo, { limites = true } = {}) {
  const r = express.Router();

  // HU05, HU06, HU07 – registrar reporte (identificado o anónimo)
  r.post(
    '/',
    asincrono(async (req, res) => {
      const resultado = validarReporte(req.body);
      if (!resultado.success) {
        throw new ErrorApp(400, 'Datos inválidos', erroresZod(resultado.error));
      }
      const datos = resultado.data;
      if (!req.usuario) throw new ErrorApp(401, 'Debes iniciar sesión para reportar');
      const reporte = await repo.crearReporte({
        tipo: datos.tipo,
        descripcion: datos.descripcion,
        lat: datos.lat,
        lng: datos.lng,
        fechaHora: datos.fechaHora.toISOString(),
        anonimo: datos.anonimo,
        // Si hay sesión se guarda el autor para "Mis reportes"; si es anónimo nunca se muestra.
        usuarioId: req.usuario ? req.usuario.id : null,
        zona: zonaMasCercana(datos.lat, datos.lng),
      });
      res.status(201).json({
        mensaje: `Reporte registrado con el número ${reporte.codigo}`,
        reporte: { ...reporte, franja: franjaHoraria(reporte.fechaHora), critico: esCritico(reporte.tipo) },
      });
    }),
  );

  return r;
};
