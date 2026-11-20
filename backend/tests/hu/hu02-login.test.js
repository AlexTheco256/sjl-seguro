'use strict';

// HU02 – Inicio de sesión seguro (P2-7)
const request = require('supertest');
const { crearContexto, USUARIOS } = require('../helpers');

let ctx;
beforeEach(async () => {
  ctx = await crearContexto();
});

describe('HU02 – Inicio de sesión', () => {
  test('devuelve token JWT y perfil con credenciales correctas', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: USUARIOS.vecino.email, password: USUARIOS.vecino.password });
    expect(res.status).toBe(200);
    expect(res.body.token.split('.')).toHaveLength(3);
    expect(res.body.usuario.rol).toBe('ciudadano');
  });

  test('mensaje genérico con contraseña incorrecta o correo inexistente', async () => {
    const a = await request(ctx.app).post('/api/auth/login').send({ email: USUARIOS.vecino.email, password: 'mala1234' });
    const b = await request(ctx.app).post('/api/auth/login').send({ email: 'nadie@x.pe', password: 'mala1234' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error).toBe('Credenciales inválidas');
    expect(b.body.error).toBe(a.body.error);
  });

  test('GET /me con token válido devuelve el usuario', async () => {
    const res = await request(ctx.app).get('/api/auth/me').set(ctx.auth('serenazgo'));
    expect(res.status).toBe(200);
    expect(res.body.usuario.rol).toBe('serenazgo');
  });

  test('token inválido o expirado obliga a iniciar sesión', async () => {
    const res = await request(ctx.app).get('/api/auth/me').set('Authorization', 'Bearer token.falso.xyz');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Debes iniciar sesión');
  });
});
