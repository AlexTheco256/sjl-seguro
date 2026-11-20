'use strict';

// HU07 – Reporte anónimo (P2-12)
const request = require('supertest');
const { crearContexto, crearReporte, REPORTE_VALIDO } = require('../helpers');
const { vistaSerenazgo } = require('../../src/domain/reportes');

describe('vistaSerenazgo', () => {
  const base = { id: '1', codigo: 'SJL-1', ...REPORTE_VALIDO, usuarioId: 'u1', anonimo: true, estado: 'recibido', zona: 'Zárate' };
  test('muestra "Anónimo" y oculta el usuario en reportes anónimos', () => {
    const v = vistaSerenazgo(base, { nombre: 'Juan' });
    expect(v.autor).toBe('Anónimo');
    expect(v.usuarioId).toBeNull();
  });
  test('muestra el nombre en reportes identificados', () => {
    expect(vistaSerenazgo({ ...base, anonimo: false }, { nombre: 'Juan' }).autor).toBe('Juan');
  });
});

describe('HU07 – Reporte anónimo', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await crearContexto();
  });

  test('sin sesión y sin marcar anónimo → 401', async () => {
    expect((await crearReporte(ctx, {}, null)).status).toBe(401);
  });

  test('se acepta sin sesión y serenazgo ve "Anónimo"', async () => {
    const res = await crearReporte(ctx, { anonimo: true }, null);
    expect(res.status).toBe(201);
    const det = await request(ctx.app).get(`/api/serenazgo/reportes/${res.body.reporte.id}`).set(ctx.auth('serenazgo'));
    expect(det.body.reporte.autor).toBe('Anónimo');
    expect(det.body.reporte.usuarioId).toBeNull();
  });

  test('un vecino logueado que reporta anónimo no queda expuesto', async () => {
    const res = await crearReporte(ctx, { anonimo: true });
    const bandeja = await request(ctx.app).get('/api/serenazgo/reportes').set(ctx.auth('serenazgo'));
    const item = bandeja.body.items.find((x) => x.id === res.body.reporte.id);
    expect(item.autor).toBe('Anónimo');
    expect(JSON.stringify(item)).not.toContain(ctx.ids.vecino);
  });

  test('bloquea más de 5 reportes por minuto desde la misma IP (rate limiting)', async () => {
    const c = await crearContexto({ limites: true });
    const enviar = () =>
      request(c.app)
        .post('/api/reportes')
        .send({ ...REPORTE_VALIDO, tipo: 'extorsion', descripcion: 'Cobro de cupos a la bodega del pasaje.', anonimo: true });
    for (let i = 0; i < 5; i += 1) expect((await enviar()).status).toBe(201);
    const sexto = await enviar();
    expect(sexto.status).toBe(429);
    expect(sexto.body.error).toMatch(/demasiados reportes/);
  });
});
