'use strict';

// HU04 – Recuperar contraseña (P2-9)
const request = require('supertest');
const { crearContexto, USUARIOS } = require('../helpers');

let ctx;
beforeEach(async () => {
  ctx = await crearContexto();
});

describe('HU04 – Recuperar contraseña', () => {
  test('responde igual exista o no la cuenta (no revela usuarios)', async () => {
    const a = await request(ctx.app).post('/api/auth/recuperar').send({ email: USUARIOS.vecino.email });
    const b = await request(ctx.app).post('/api/auth/recuperar').send({ email: 'nadie@x.pe' });
    expect(a.status).toBe(200);
    expect(a.body).toEqual(b.body);
    expect(a.body.mensaje).toMatch(/1 hora/);
  });
  test('valida el formato del correo', async () => {
    const res = await request(ctx.app).post('/api/auth/recuperar').send({ email: 'no-es-correo' });
    expect(res.status).toBe(400);
  });
});
