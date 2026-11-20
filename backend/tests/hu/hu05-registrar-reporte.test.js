'use strict';

// HU05 – Registrar reporte de incidente (P2-10)
const request = require('supertest');
const { crearContexto, crearReporte, REPORTE_VALIDO } = require('../helpers');
const { sanitizarTexto, validarReporte } = require('../../src/domain/reportes');

describe('sanitizarTexto (prevención de XSS)', () => {
  test('elimina etiquetas HTML y scripts', () => {
    expect(sanitizarTexto('<script>alert(1)</script>Robo <b>en</b> paradero')).toBe('alert(1)Robo en paradero');
  });
  test('elimina < > sueltos y caracteres de control sin perder texto', () => {
    expect(sanitizarTexto('  a < b > c\u0007 ')).toBe('a  b  c');
    expect(sanitizarTexto('5 < 6 y 7 > 3')).toBe('5  6 y 7  3');
  });
  test('tolera null/undefined', () => {
    expect(sanitizarTexto(undefined)).toBe('');
  });
});

describe('validarReporte', () => {
  test('acepta un reporte válido y sanitiza la descripción', () => {
    const r = validarReporte({ ...REPORTE_VALIDO, descripcion: 'Robo <img src=x onerror=alert(1)> en el paradero' });
    expect(r.success).toBe(true);
    expect(r.data.descripcion).toBe('Robo  en el paradero');
    expect(r.data.anonimo).toBe(false);
  });
  test('rechaza campos obligatorios faltantes', () => {
    const r = validarReporte({});
    expect(r.success).toBe(false);
    const campos = r.error.issues.map((i) => i.path[0]);
    expect(campos).toEqual(expect.arrayContaining(['tipo', 'descripcion', 'fechaHora']));
  });
  test('rechaza fechas futuras', () => {
    const r = validarReporte({ ...REPORTE_VALIDO, fechaHora: new Date(Date.now() + 864e5).toISOString() });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].message).toMatch(/futura/);
  });
  test('rechaza descripciones demasiado largas', () => {
    expect(validarReporte({ ...REPORTE_VALIDO, descripcion: 'a'.repeat(1001) }).success).toBe(false);
  });
});

describe('HU05 – POST /api/reportes', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await crearContexto();
  });

  test('guarda el reporte con estado Recibido y número de reporte', async () => {
    const res = await crearReporte(ctx);
    expect(res.status).toBe(201);
    expect(res.body.reporte).toMatchObject({ estado: 'recibido', usuarioId: ctx.ids.vecino, tipo: 'robo_al_paso' });
    expect(res.body.reporte.codigo).toMatch(/^SJL-\d{6}$/);
    expect(res.body.mensaje).toContain(res.body.reporte.codigo);
  });

  test('sanitiza scripts en la descripción (XSS)', async () => {
    const res = await crearReporte(ctx, { descripcion: 'Robo <script>document.cookie</script> en la esquina del mercado' });
    expect(res.status).toBe(201);
    expect(res.body.reporte.descripcion).not.toMatch(/<|>/);
  });

  test('rechaza campos obligatorios faltantes indicando cuáles', async () => {
    const res = await request(ctx.app).post('/api/reportes').set(ctx.auth('vecino')).send({ tipo: 'robo_al_paso' });
    expect(res.status).toBe(400);
    expect(res.body.detalles.map((d) => d.campo)).toEqual(expect.arrayContaining(['descripcion', 'fechaHora']));
  });
});
