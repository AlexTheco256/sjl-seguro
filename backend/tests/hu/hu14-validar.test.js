'use strict';

// HU14 – Validar o descartar un reporte (P2-19)
const request = require('supertest');
const { crearContexto, crearReporte, cambiarEstado } = require('../helpers');
const { transicionValida } = require('../../src/domain/reportes');

describe('transiciones desde Recibido', () => {
  test.each([
    ['recibido', 'validado', true],
    ['recibido', 'descartado', true],
    ['recibido', 'atendido', false],
    ['inexistente', 'validado', false],
  ])('%s → %s = %s', (de, a, esperado) => expect(transicionValida(de, a)).toBe(esperado));
});

describe('HU14 – Validar o descartar', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await crearContexto();
  });

  test('validar publica el reporte y deja auditoría', async () => {
    const { id } = (await crearReporte(ctx)).body.reporte;
    const res = await cambiarEstado(ctx, id, { estado: 'validado' });
    expect(res.status).toBe(200);
    expect(res.body.reporte.estado).toBe('validado');
    expect((await request(ctx.app).get('/api/incidentes')).body.total).toBe(1);
    const det = await request(ctx.app).get(`/api/serenazgo/reportes/${id}`).set(ctx.auth('serenazgo'));
    expect(det.body.historial[0]).toMatchObject({ desde: 'recibido', hacia: 'validado', usuarioId: ctx.ids.serenazgo });
  });

  test('descartar exige motivo y no se publica', async () => {
    const { id } = (await crearReporte(ctx)).body.reporte;
    expect((await cambiarEstado(ctx, id, { estado: 'descartado' })).status).toBe(400);
    const res = await cambiarEstado(ctx, id, { estado: 'descartado', motivo: 'Reporte falso' });
    expect(res.body.reporte).toMatchObject({ estado: 'descartado', motivo: 'Reporte falso' });
    expect((await request(ctx.app).get('/api/incidentes')).body.total).toBe(0);
  });

  test('un ciudadano no puede validar y los reportes inexistentes dan 404', async () => {
    const { id } = (await crearReporte(ctx)).body.reporte;
    expect((await cambiarEstado(ctx, id, { estado: 'validado' }, 'vecino')).status).toBe(403);
    expect((await cambiarEstado(ctx, 'no-existe', { estado: 'validado' })).status).toBe(404);
  });

  test('rechaza estados desconocidos', async () => {
    const { id } = (await crearReporte(ctx)).body.reporte;
    expect((await cambiarEstado(ctx, id, { estado: 'borrado' })).status).toBe(400);
  });
});
