'use strict';

// HU19 – Gestión de usuarios y asignación de roles (P2-24)
const request = require('supertest');
const { crearContexto, USUARIOS } = require('../helpers');

let ctx;
beforeEach(async () => {
  ctx = await crearContexto();
});

describe('HU19 – Gestión de usuarios y roles', () => {
  test('el administrador lista usuarios sin hashes de contraseña', async () => {
    const res = await request(ctx.app).get('/api/admin/usuarios').set(ctx.auth('admin'));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(JSON.stringify(res.body)).not.toMatch(/hash|\$2[aby]\$/);
  });

  test('asignar rol serenazgo da acceso a la bandeja en el siguiente login', async () => {
    const res = await request(ctx.app).patch(`/api/admin/usuarios/${ctx.ids.vecino}`).set(ctx.auth('admin')).send({ rol: 'serenazgo' });
    expect(res.status).toBe(200);
    const login = await request(ctx.app).post('/api/auth/login').send({ email: USUARIOS.vecino.email, password: USUARIOS.vecino.password });
    const bandeja = await request(ctx.app).get('/api/serenazgo/reportes').set('Authorization', `Bearer ${login.body.token}`);
    expect(bandeja.status).toBe(200);
  });

  test('un usuario desactivado no puede iniciar sesión ni usar su token', async () => {
    await request(ctx.app).patch(`/api/admin/usuarios/${ctx.ids.vecino}`).set(ctx.auth('admin')).send({ activo: false });
    const login = await request(ctx.app).post('/api/auth/login').send({ email: USUARIOS.vecino.email, password: USUARIOS.vecino.password });
    expect(login.status).toBe(403);
    expect((await request(ctx.app).get('/api/auth/me').set(ctx.auth('vecino'))).status).toBe(401);
  });

  test('valida datos y evita la auto-modificación', async () => {
    const patch = (id, cuerpo) => request(ctx.app).patch(`/api/admin/usuarios/${id}`).set(ctx.auth('admin')).send(cuerpo);
    expect((await patch(ctx.ids.vecino, { rol: 'root' })).status).toBe(400);
    expect((await patch(ctx.ids.vecino, {})).status).toBe(400);
    expect((await patch(ctx.ids.admin, { activo: false })).status).toBe(400);
    expect((await patch('no-existe', { activo: false })).status).toBe(404);
  });

  test('solo el administrador accede', async () => {
    expect((await request(ctx.app).get('/api/admin/usuarios').set(ctx.auth('serenazgo'))).status).toBe(403);
  });
});
