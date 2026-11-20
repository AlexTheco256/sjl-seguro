'use strict';

// HU12 – Filtrar el mapa por franja horaria (P2-17)
const request = require('supertest');
const { crearContexto, crearReporte, cambiarEstado } = require('../helpers');
const { franjaHoraria, horaLima } = require('../../src/domain/reportes');

describe('franjaHoraria en hora de Lima', () => {
  test.each([
    ['2026-11-10T08:00:00Z', 3, 'madrugada'],
    ['2026-11-10T14:00:00Z', 9, 'manana'],
    ['2026-11-10T20:00:00Z', 15, 'tarde'],
    ['2026-11-11T02:30:00Z', 21, 'noche'],
  ])('%s → %i h → %s', (iso, hora, franja) => {
    expect(horaLima(iso)).toBe(hora);
    expect(franjaHoraria(iso)).toBe(franja);
  });
});

describe('HU12 – Filtro por franja horaria', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await crearContexto();
    const datos = [
      { tipo: 'robo_al_paso', fechaHora: '2026-11-10T02:30:00Z' }, // 21:30 noche
      { tipo: 'asalto_transporte', fechaHora: '2026-11-10T13:00:00Z' }, // 08:00 mañana
    ];
    for (const d of datos) {
      const { id } = (await crearReporte(ctx, d)).body.reporte;
      await cambiarEstado(ctx, id, { estado: 'validado' });
    }
  });

  test('solo incidentes de la franja elegida', async () => {
    const res = await request(ctx.app).get('/api/incidentes?franjas=noche');
    expect(res.body.total).toBe(1);
    expect(res.body.incidentes[0].franja).toBe('noche');
  });
  test('se combina con el filtro por tipo', async () => {
    expect((await request(ctx.app).get('/api/incidentes?franjas=noche&tipos=asalto_transporte')).body.total).toBe(0);
    expect((await request(ctx.app).get('/api/incidentes?franjas=manana&tipos=asalto_transporte')).body.total).toBe(1);
  });
  test('franja sin incidentes devuelve lista vacía', async () => {
    expect((await request(ctx.app).get('/api/incidentes?franjas=madrugada')).body).toEqual({ total: 0, incidentes: [] });
  });
});
