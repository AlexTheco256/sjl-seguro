'use strict';

const express = require('express');
const { z } = require('zod');
const { asincrono } = require('./util');
const { requerirRol } = require('../middleware/auth');
const { ESTADOS } = require('../domain/constantes');
const { transicionValida, vistaSerenazgo, esCritico, sanitizarTexto } = require('../domain/reportes');
const { ErrorApp } = require('../errores');

/** Orden de la bandeja: críticos pendientes, luego pendientes, luego el resto; más recientes primero (HU13, HU16). */
function prioridad(r) {
  if (r.estado === 'recibido') return 1;
  if (r.estado === 'validado' || r.estado === 'en_atencion') return 2;
  return 3;
}

/** Bandeja y gestión de reportes para serenazgo (HU13–HU16). */
module.exports = function rutasSerenazgo(repo) {
  const r = express.Router();
  r.use(requerirRol('serenazgo', 'administrador'));

  async function autores(lista) {
    const ids = [...new Set(lista.map((x) => x.usuarioId).filter(Boolean))];
    const usuarios = await Promise.all(ids.map((id) => repo.obtenerUsuario(id)));
    return new Map(usuarios.filter(Boolean).map((u) => [u.id, u]));
  }

  // HU13 – bandeja paginada
  r.get(
    '/reportes',
    asincrono(async (req, res) => {
      const estado = Object.keys(ESTADOS).includes(req.query.estado) ? req.query.estado : null;
      const porPagina = Math.min(Math.max(Number(req.query.porPagina) || 20, 1), 100);
      const todos = await repo.listarReportes(estado ? { estados: [estado] } : {});
      todos.sort((a, b) => prioridad(a) - prioridad(b) || b.creadoEn.localeCompare(a.creadoEn));
      const paginas = Math.max(Math.ceil(todos.length / porPagina), 1);
      const pagina = Math.min(Math.max(Number(req.query.pagina) || 1, 1), paginas);
      const items = todos.slice((pagina - 1) * porPagina, pagina * porPagina);
      const mapa = await autores(items);
      res.json({
        total: todos.length,
        pagina,
        paginas,
        items: items.map((x) => vistaSerenazgo(x, mapa.get(x.usuarioId))),
      });
    }),
  );

  // HU13 – detalle con historial (auditoría)
  r.get(
    '/reportes/:id',
    asincrono(async (req, res) => {
      const reporte = await repo.obtenerReporte(req.params.id);
      if (!reporte) throw new ErrorApp(404, 'Reporte no encontrado');
      const autor = reporte.usuarioId ? await repo.obtenerUsuario(reporte.usuarioId) : null;
      res.json({ reporte: vistaSerenazgo(reporte, autor), historial: await repo.listarHistorial(reporte.id) });
    }),
  );

  return r;
};
