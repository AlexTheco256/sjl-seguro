'use strict';

// HU17 – Panel de indicadores de inseguridad (P2-22)
const request = require('supertest');
const { crearContexto, crearReporte, cambiarEstado } = require('../helpers');
const { calcularEstadisticas, filtrarPorRango, mesLima } = require('../../src/domain/estadisticas');

const R = (o) => ({
  id: 'x',
  codigo: 'SJL-1',
  tipo: 'robo_al_paso',
  lat: -12.02,
  lng: -77.0,
  zona: 'Zárate',
  estado: 'validado',
  fechaHora: '2026-10-10T02:00:00Z',
  creadoEn: '2026-10-10T02:00:00Z',
  atendidoEn: null,
  ...o,
});

describe('calcularEstadisticas', () => {
  const e = calcularEstadisticas([
    R({ id: 'a' }),
    R({ id: 'b', tipo: 'extorsion', estado: 'atendido', atendidoEn: '2026-10-10T06:00:00Z' }),
    R({ id: 'c', estado: 'en_atencion', fechaHora: '2026-11-05T15:00:00Z' }),
    R({ id: 'd', estado: 'recibido' }),
    R({ id: 'e', estado: 'descartado' }),
  ]);
  test('totales por estado y tiempo promedio de atención', () => {
    expect(e.totales).toEqual({ reportes: 5, recibidos: 1, validados: 3, atendidos: 1, descartados: 1, tiempoPromedioAtencionHoras: 4 });
  });
  test('por tipo solo cuenta reportes publicados', () => {
    expect(e.porTipo.find((t) => t.tipo === 'robo_al_paso').total).toBe(2);
    expect(e.porTipo.find((t) => t.tipo === 'extorsion').total).toBe(1);
  });
  test('tendencia mensual en hora de Lima', () => {
    expect(e.porMes).toEqual([
      { mes: '2026-10', total: 2 },
      { mes: '2026-11', total: 1 },
    ]);
    expect(mesLima('2026-11-01T03:00:00Z')).toBe('2026-10');
  });
  test('sin datos no falla', () => {
    expect(calcularEstadisticas([]).totales.tiempoPromedioAtencionHoras).toBe(0);
  });
  test('filtro por rango de fechas', () => {
    const datos = [R({ id: '1', fechaHora: '2026-09-01T15:00:00Z' }), R({ id: '2', fechaHora: '2026-10-15T15:00:00Z' })];
    expect(filtrarPorRango(datos, '2026-10-01', '2026-10-31').map((r) => r.id)).toEqual(['2']);
    expect(filtrarPorRango(datos, undefined, '2026-09-30').map((r) => r.id)).toEqual(['1']);
    expect(filtrarPorRango(datos)).toHaveLength(2);
  });
});

describe('HU17 – GET /api/estadisticas', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await crearContexto();
    const a = await crearReporte(ctx);
    const b = await crearReporte(ctx, { tipo: 'extorsion', fechaHora: '2026-10-01T15:00:00Z' });
    await crearReporte(ctx, { anonimo: true });
    await cambiarEstado(ctx, a.body.reporte.id, { estado: 'validado' });
    await cambiarEstado(ctx, b.body.reporte.id, { estado: 'validado' });
  });

  test('indicadores para administrador y serenazgo', async () => {
    const res = await request(ctx.app).get('/api/estadisticas').set(ctx.auth('admin'));
    expect(res.status).toBe(200);
    expect(res.body.totales).toMatchObject({ reportes: 3, validados: 2, recibidos: 1 });
    expect(res.body.porTipo).toHaveLength(5);
  });
  test('el rango de fechas recalcula los indicadores e ignora fechas inválidas', async () => {
    const res = await request(ctx.app).get('/api/estadisticas?desde=2026-11-01&hasta=2026-11-30').set(ctx.auth('serenazgo'));
    expect(res.body.totales.reportes).toBe(2);
    expect(res.body.desde).toBe('2026-11-01');
    const ignorado = await request(ctx.app).get('/api/estadisticas?desde=no-fecha').set(ctx.auth('serenazgo'));
    expect(ignorado.body.desde).toBeNull();
  });
  test('ciudadanos no acceden', async () => {
    expect((await request(ctx.app).get('/api/estadisticas').set(ctx.auth('vecino'))).status).toBe(403);
  });
});
