'use strict';

// HU11 – Filtrar el mapa por tipo de delito (P2-16)
const request = require('supertest');
const { crearContexto, crearReporte, cambiarEstado } = require('../helpers');

describe('HU11 – Filtro por tipo de delito', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await crearContexto();
    for (const tipo of ['robo_al_paso', 'asalto_transporte', 'extorsion']) {
      const { id } = (await crearReporte(ctx, { tipo })).body.reporte;
      await cambiarEstado(ctx, id, { estado: 'validado' });
    }
  });

  test('un tipo', async () => {
    const res = await request(ctx.app).get('/api/incidentes?tipos=asalto_transporte');
    expect(res.body.incidentes.map((i) => i.tipo)).toEqual(['asalto_transporte']);
  });
  test('varios tipos a la vez e ignora valores no válidos', async () => {
    const res = await request(ctx.app).get('/api/incidentes?tipos=extorsion,robo_al_paso,inventado');
    expect(res.body.incidentes.map((i) => i.tipo).sort()).toEqual(['extorsion', 'robo_al_paso']);
  });
  test('sin filtro (limpiar filtros) devuelve todos', async () => {
    expect((await request(ctx.app).get('/api/incidentes')).body.total).toBe(3);
  });
});
