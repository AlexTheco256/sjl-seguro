'use strict';

const request = require('supertest');
const { crearApp } = require('../src/app');
const { RepositorioMemoria } = require('../src/data/memoria');

const USUARIOS = {
  admin: { nombre: 'Admin Test', email: 'admin@test.pe', password: 'Admin12345', rol: 'administrador' },
  serenazgo: { nombre: 'Sereno Test', email: 'sereno@test.pe', password: 'Sereno12345', rol: 'serenazgo' },
  vecino: { nombre: 'Vecino Test', email: 'vecino@test.pe', password: 'Vecino12345', rol: 'ciudadano' },
};

const REPORTE_VALIDO = {
  tipo: 'robo_al_paso',
  descripcion: 'Me arrebataron el celular en el paradero de la avenida.',
  lat: -12.0255,
  lng: -77.001,
  fechaHora: '2026-11-10T02:30:00.000Z', // 21:30 hora de Lima
};

/** Crea una app aislada con repositorio en memoria y usuarios de prueba. */
async function crearContexto({ limites = false } = {}) {
  const repo = new RepositorioMemoria({ jwtSecret: 'secreto-de-pruebas', semilla: false });
  const ids = {};
  for (const [clave, u] of Object.entries(USUARIOS)) {
    const perfil = await repo.registrar(u);
    await repo.actualizarUsuario(perfil.id, { rol: u.rol });
    ids[clave] = perfil.id;
  }
  const app = crearApp({ repo, limites });
  const tokens = {};
  for (const [clave, u] of Object.entries(USUARIOS)) {
    const res = await request(app).post('/api/auth/login').send({ email: u.email, password: u.password });
    tokens[clave] = res.body.token;
  }
  const auth = (rol) => ({ Authorization: `Bearer ${tokens[rol]}` });
  return { app, repo, ids, tokens, auth };
}

/** Envía un reporte (con el token del rol indicado, o sin sesión si rol es null). */
function crearReporte(ctx, datos = {}, rol = 'vecino') {
  const req = request(ctx.app).post('/api/reportes');
  if (rol) req.set(ctx.auth(rol));
  return req.send({ ...REPORTE_VALIDO, ...datos });
}

/** Cambia el estado de un reporte desde la bandeja de serenazgo. */
function cambiarEstado(ctx, id, cuerpo, rol = 'serenazgo') {
  return request(ctx.app).patch(`/api/serenazgo/reportes/${id}/estado`).set(ctx.auth(rol)).send(cuerpo);
}

module.exports = { crearContexto, crearReporte, cambiarEstado, USUARIOS, REPORTE_VALIDO };
