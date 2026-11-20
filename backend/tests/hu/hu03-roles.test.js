'use strict';

// HU03 – Control de acceso por roles (P2-8)
const express = require('express');
const request = require('supertest');
const { crearContexto } = require('../helpers');
const { autenticacionOpcional, requerirRol } = require('../../src/middleware/auth');

/** App mínima con una ruta exclusiva para serenazgo y administradores. */
function appProtegida(repo) {
  const app = express();
  app.use(autenticacionOpcional(repo));
  app.get('/bandeja', requerirRol('serenazgo', 'administrador'), (_req, res) => res.json({ ok: true }));
  app.get('/usuarios', requerirRol('administrador'), (_req, res) => res.json({ ok: true }));
  app.use((err, _req, res, _next) => res.status(err.status).json({ error: err.message }));
  return app;
}

describe('HU03 – Control de acceso por roles', () => {
  let ctx;
  let app;
  beforeEach(async () => {
    ctx = await crearContexto();
    app = appProtegida(ctx.repo);
  });

  test('sin token → 401', async () => {
    const res = await request(app).get('/bandeja');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Debes iniciar sesión');
  });
  test('ciudadano en la bandeja de serenazgo → 403 "Acceso denegado"', async () => {
    const res = await request(app).get('/bandeja').set(ctx.auth('vecino'));
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Acceso denegado');
  });
  test('serenazgo accede a la bandeja pero no a la gestión de usuarios', async () => {
    expect((await request(app).get('/bandeja').set(ctx.auth('serenazgo'))).status).toBe(200);
    expect((await request(app).get('/usuarios').set(ctx.auth('serenazgo'))).status).toBe(403);
  });
  test('el administrador accede a todo', async () => {
    expect((await request(app).get('/bandeja').set(ctx.auth('admin'))).status).toBe(200);
    expect((await request(app).get('/usuarios').set(ctx.auth('admin'))).status).toBe(200);
  });
});
