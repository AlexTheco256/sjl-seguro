'use strict';

// HU08 – Seguimiento de mis reportes (P2-13)
const request = require('supertest');
const { crearContexto, crearReporte, cambiarEstado } = require('../helpers');

let ctx;
beforeEach(async () => {
  ctx = await crearContexto();
});

describe('HU08 – Seguimiento de mis reportes', () => {
  test('lista solo los reportes del usuario, el más reciente primero', async () => {
    await crearReporte(ctx, { descripcion: 'Primer reporte de robo en el paradero.' });
    await new Promise((r) => setTimeout(r, 5));
    await crearReporte(ctx, { descripcion: 'Segundo reporte de robo en el paradero.' });
    await crearReporte(ctx, {}, 'serenazgo');
    const res = await request(ctx.app).get('/api/reportes/mios').set(ctx.auth('vecino'));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.reportes[0].descripcion).toMatch(/Segundo/);
  });

  test('refleja el nuevo estado cuando serenazgo lo cambia', async () => {
    const { id } = (await crearReporte(ctx)).body.reporte;
    await cambiarEstado(ctx, id, { estado: 'validado' });
    const res = await request(ctx.app).get('/api/reportes/mios').set(ctx.auth('vecino'));
    expect(res.body.reportes[0].estado).toBe('validado');
    expect(res.body.reportes[0].actualizadoEn).toBeTruthy();
  });

  test('sin reportes devuelve lista vacía', async () => {
    const res = await request(ctx.app).get('/api/reportes/mios').set(ctx.auth('admin'));
    expect(res.body).toEqual({ total: 0, reportes: [] });
  });

  test('requiere sesión', async () => {
    expect((await request(ctx.app).get('/api/reportes/mios')).status).toBe(401);
  });
});
