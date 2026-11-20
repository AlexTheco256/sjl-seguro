'use strict';

// HU10 – Mapa de calor de zonas de riesgo (P2-15)
const request = require('supertest');
const { crearContexto, crearReporte } = require('../helpers');

describe('HU10 – Datos para el mapa de calor', () => {
  test('cada incidente incluye coordenadas numéricas para la capa de calor', async () => {
    const ctx = await crearContexto();
    const { id } = (await crearReporte(ctx, { lat: -11.9555, lng: -76.9935 })).body.reporte;
    await ctx.repo.actualizarReporte(id, { estado: 'validado' });
    const res = await request(ctx.app).get('/api/incidentes');
    const [i] = res.body.incidentes;
    expect(typeof i.lat).toBe('number');
    expect(typeof i.lng).toBe('number');
  });

  test('un reporte recién validado se agrega al mapa de calor', async () => {
    const ctx = await crearContexto();
    const { id } = (await crearReporte(ctx)).body.reporte;
    expect((await request(ctx.app).get('/api/incidentes')).body.total).toBe(0);
    await ctx.repo.actualizarReporte(id, { estado: 'validado' });
    expect((await request(ctx.app).get('/api/incidentes')).body.total).toBe(1);
  });

  test('la respuesta es cacheable por poco tiempo', async () => {
    const ctx = await crearContexto();
    const res = await request(ctx.app).get('/api/incidentes');
    expect(res.headers['cache-control']).toBe('public, max-age=30');
  });
});
