'use strict';

// HU18 – Ranking de zonas y horarios más peligrosos (P2-23)
const request = require('supertest');
const { crearContexto, crearReporte, cambiarEstado } = require('../helpers');
const { calcularEstadisticas } = require('../../src/domain/estadisticas');

const R = (o) => ({ tipo: 'robo_al_paso', lat: -12.02, lng: -77.0, zona: 'Zárate', estado: 'validado', fechaHora: '2026-10-10T02:00:00Z', creadoEn: '2026-10-10T02:00:00Z', ...o });

describe('ranking en calcularEstadisticas', () => {
  test('top de zonas ordenado y franja más peligrosa', () => {
    const e = calcularEstadisticas([R({}), R({}), R({ zona: 'Bayóvar', lat: -11.95, lng: -76.99, fechaHora: '2026-10-10T15:00:00Z' })]);
    expect(e.topZonas[0]).toMatchObject({ zona: 'Zárate', total: 2 });
    expect(e.topZonas[1]).toMatchObject({ zona: 'Bayóvar', total: 1, lat: -11.95 });
    expect(e.franjaMasPeligrosa).toBe('noche');
    expect(e.porFranja.find((f) => f.franja === 'manana').total).toBe(1);
  });
  test('máximo 5 zonas y sin datos no hay franja peligrosa', () => {
    const zonas = ['A', 'B', 'C', 'D', 'E', 'F'].map((zona) => R({ zona }));
    expect(calcularEstadisticas(zonas).topZonas).toHaveLength(5);
    expect(calcularEstadisticas([]).franjaMasPeligrosa).toBeNull();
  });
});

describe('HU18 – Zonas críticas en la API', () => {
  test('devuelve el ranking con coordenadas para centrar el mapa', async () => {
    const ctx = await crearContexto();
    for (const datos of [{ lat: -11.9555, lng: -76.9935 }, { lat: -11.9556, lng: -76.9936 }, {}]) {
      const { id } = (await crearReporte(ctx, datos)).body.reporte;
      await cambiarEstado(ctx, id, { estado: 'validado' });
    }
    const res = await request(ctx.app).get('/api/estadisticas').set(ctx.auth('serenazgo'));
    expect(res.body.topZonas.map((z) => z.zona)).toEqual(['Bayóvar', 'Zárate']);
    expect(res.body.topZonas[0].lat).toBeCloseTo(-11.95555, 4);
    expect(res.body.porFranja).toHaveLength(4);
    expect(res.body.franjaMasPeligrosa).toBe('noche');
  });
});
