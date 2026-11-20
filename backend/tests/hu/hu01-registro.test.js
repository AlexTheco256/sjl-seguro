'use strict';

// HU01 – Registro de ciudadano (P2-6)
const request = require('supertest');
const { crearContexto, USUARIOS } = require('../helpers');

let ctx;
beforeEach(async () => {
  ctx = await crearContexto();
});

describe('GET /api/health', () => {
  test('responde ok con cabeceras de seguridad', async () => {
    const res = await request(ctx.app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado: 'ok', modo: 'memoria' });
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('404 JSON en rutas inexistentes de la API', async () => {
    const res = await request(ctx.app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Ruta no encontrada/);
  });
});

describe('HU01 – Registro de ciudadano', () => {
  test('crea la cuenta con rol ciudadano', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/registro')
      .send({ nombre: 'María Pérez', email: 'Maria@Correo.pe', password: 'Segura123' });
    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({ email: 'maria@correo.pe', rol: 'ciudadano', activo: true });
    expect(res.body.usuario).not.toHaveProperty('hash');
  });

  test('rechaza un correo ya registrado', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/registro')
      .send({ nombre: 'Otro', email: USUARIOS.vecino.email, password: 'Segura123' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('El correo ya está en uso');
  });

  test('rechaza contraseñas débiles indicando los requisitos', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/registro')
      .send({ nombre: 'Ana', email: 'ana@correo.pe', password: 'abc' });
    expect(res.status).toBe(400);
    const mensajes = res.body.detalles.map((d) => d.mensaje).join(' ');
    expect(mensajes).toMatch(/8 caracteres/);
    expect(mensajes).toMatch(/número/);
  });

  test('rechaza JSON mal formado', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/registro')
      .set('Content-Type', 'application/json')
      .send('{"nombre":');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('JSON inválido');
  });
});
