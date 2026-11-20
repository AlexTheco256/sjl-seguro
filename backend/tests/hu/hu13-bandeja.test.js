'use strict';

// HU13 – Bandeja de reportes para serenazgo (P2-18)
const request = require('supertest');
const { crearContexto, crearReporte } = require('../helpers');

let ctx;
beforeEach(async () => {
  ctx = await crearContexto();
});

describe('HU13 – Bandeja de reportes', () => {
  test('pendientes primero, del más reciente al más antiguo, y paginada', async () => {
    const ids = [];
    for (let i = 0; i < 3; i += 1) {
      ids.push((await crearReporte(ctx)).body.reporte.id);
      await new Promise((r) => setTimeout(r, 3));
    }
    const res = await request(ctx.app).get('/api/serenazgo/reportes?porPagina=2').set(ctx.auth('serenazgo'));
    expect(res.body).toMatchObject({ total: 3, paginas: 2, pagina: 1 });
    expect(res.body.items[0].id).toBe(ids[2]);
    const p2 = await request(ctx.app).get('/api/serenazgo/reportes?porPagina=2&pagina=2').set(ctx.auth('serenazgo'));
    expect(p2.body.items).toHaveLength(1);
  });

  test('filtra por estado', async () => {
    await crearReporte(ctx);
    const res = await request(ctx.app).get('/api/serenazgo/reportes?estado=validado').set(ctx.auth('serenazgo'));
    expect(res.body.total).toBe(0);
  });

  test('detalle con tipo, descripción, ubicación e historial', async () => {
    const { id } = (await crearReporte(ctx)).body.reporte;
    const res = await request(ctx.app).get(`/api/serenazgo/reportes/${id}`).set(ctx.auth('serenazgo'));
    expect(res.status).toBe(200);
    expect(res.body.reporte).toMatchObject({ id, autor: 'Vecino Test', zona: 'Zárate' });
    expect(res.body.historial).toEqual([]);
  });

  test('404 para reportes inexistentes', async () => {
    expect((await request(ctx.app).get('/api/serenazgo/reportes/no-existe').set(ctx.auth('serenazgo'))).status).toBe(404);
  });
});
