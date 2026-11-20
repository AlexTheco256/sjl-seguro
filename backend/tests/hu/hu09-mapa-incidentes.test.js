'use strict';

// HU09 – Visualizar incidentes en el mapa de SJL (P2-14)
const request = require('supertest');
const { crearContexto, crearReporte, REPORTE_VALIDO } = require('../helpers');
const { vistaPublica } = require('../../src/domain/reportes');
const { generarIncidentes } = require('../../src/data/semilla');

describe('vistaPublica', () => {
  test('no expone datos del autor y resume la descripción', () => {
    const v = vistaPublica({ id: '1', codigo: 'SJL-1', ...REPORTE_VALIDO, usuarioId: 'u1', anonimo: false, estado: 'validado', zona: 'Zárate', descripcion: 'x'.repeat(200) });
    expect(v).not.toHaveProperty('usuarioId');
    expect(v).not.toHaveProperty('anonimo');
    expect(v.descripcion.length).toBe(140);
  });
});

describe('datos de demostración', () => {
  test('el generador es determinista y produce puntos dentro de SJL', () => {
    const ahora = new Date('2026-11-01T12:00:00Z');
    const a = generarIncidentes({ cantidad: 20, ahora });
    expect(a).toEqual(generarIncidentes({ cantidad: 20, ahora }));
    for (const r of a) {
      expect(r.lat).toBeGreaterThan(-12.04);
      expect(r.lat).toBeLessThan(-11.92);
      expect(new Date(r.fechaHora).getTime()).toBeLessThanOrEqual(ahora.getTime());
    }
  });
});

describe('HU09 – GET /api/incidentes', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await crearContexto();
  });

  test('solo muestra reportes validados y sin datos personales', async () => {
    const a = await crearReporte(ctx);
    const b = await crearReporte(ctx);
    const c = await crearReporte(ctx);
    // El serenazgo valida uno y descarta otro (la bandeja llega en HU13/HU14).
    await ctx.repo.actualizarReporte(a.body.reporte.id, { estado: 'validado' });
    await ctx.repo.actualizarReporte(c.body.reporte.id, { estado: 'descartado' });
    const res = await request(ctx.app).get('/api/incidentes');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.incidentes[0]).toMatchObject({ id: a.body.reporte.id, tipo: 'robo_al_paso', zona: 'Zárate' });
    expect(res.body.incidentes.map((i) => i.id)).not.toContain(b.body.reporte.id);
    expect(JSON.stringify(res.body)).not.toContain(ctx.ids.vecino);
  });

  test('metadatos del mapa (tipos, zonas y límites)', async () => {
    const res = await request(ctx.app).get('/api/incidentes/meta');
    expect(Object.keys(res.body.tipos)).toContain('extorsion');
    expect(res.body.zonas.length).toBeGreaterThan(5);
    expect(res.body.limites).toHaveProperty('latMin');
  });
});
