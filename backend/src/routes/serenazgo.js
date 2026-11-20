'use strict';

const express = require('express');
const { z } = require('zod');
const { asincrono } = require('./util');
const { requerirRol } = require('../middleware/auth');
const { ESTADOS } = require('../domain/constantes');
const { transicionValida, vistaSerenazgo, esCritico, sanitizarTexto } = require('../domain/reportes');
const { ErrorApp } = require('../errores');

const texto = (max) => z.string().transform(sanitizarTexto).pipe(z.string().max(max)).optional();

const esquemaCambio = z
  .object({
    estado: z.enum(Object.keys(ESTADOS), { error: 'Estado no válido' }),
    motivo: texto(300),
    nota: texto(500),
    unidad: texto(60),
  })
  .superRefine((c, ctx) => {
    if (c.estado === 'descartado' && !c.motivo) {
      ctx.addIssue({ code: 'custom', path: ['motivo'], message: 'Indica el motivo del descarte' });
    }
    if (c.estado === 'atendido' && !c.nota) {
      ctx.addIssue({ code: 'custom', path: ['nota'], message: 'Agrega una nota de cierre' });
    }
  });

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

  // HU14, HU15 – validar, descartar, poner en atención y cerrar
  r.patch(
    '/reportes/:id/estado',
    asincrono(async (req, res) => {
      const cambio = esquemaCambio.parse(req.body);
      const reporte = await repo.obtenerReporte(req.params.id);
      if (!reporte) throw new ErrorApp(404, 'Reporte no encontrado');
      if (!transicionValida(reporte.estado, cambio.estado)) {
        throw new ErrorApp(
          409,
          `No se puede pasar de "${ESTADOS[reporte.estado]}" a "${ESTADOS[cambio.estado]}"`,
        );
      }
      const datos = { estado: cambio.estado };
      if (cambio.estado === 'descartado') datos.motivo = cambio.motivo;
      if (cambio.estado === 'en_atencion' && cambio.unidad) datos.unidad = cambio.unidad;
      if (cambio.estado === 'atendido') {
        datos.nota = cambio.nota;
        datos.atendidoEn = new Date().toISOString();
      }
      const actualizado = await repo.actualizarReporte(reporte.id, datos);
      await repo.registrarHistorial({
        reporteId: reporte.id,
        usuarioId: req.usuario.id,
        desde: reporte.estado,
        hacia: cambio.estado,
        nota: cambio.motivo || cambio.nota || cambio.unidad || null,
      });
      res.json({ mensaje: `Reporte ${actualizado.codigo}: ${ESTADOS[cambio.estado]}`, reporte: vistaSerenazgo(actualizado) });
    }),
  );

  return r;
};
