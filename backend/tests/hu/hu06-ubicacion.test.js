'use strict';

// HU06 – Ubicar el incidente en el mapa (P2-11)
const { crearContexto, crearReporte, REPORTE_VALIDO } = require('../helpers');
const { dentroDeSJL, zonaMasCercana, validarReporte } = require('../../src/domain/reportes');

describe('dentroDeSJL', () => {
  test('acepta un punto en Zárate', () => expect(dentroDeSJL(-12.0255, -77.001)).toBe(true));
  test('rechaza un punto en Miraflores', () => expect(dentroDeSJL(-12.1211, -77.0297)).toBe(false));
  test('rechaza valores no numéricos', () => expect(dentroDeSJL(NaN, -77)).toBe(false));
});

describe('zonaMasCercana', () => {
  test('asigna el sector de SJL más cercano', () => {
    expect(zonaMasCercana(-11.9555, -76.9935)).toBe('Bayóvar');
    expect(zonaMasCercana(-12.03, -77.013)).toBe('Caja de Agua');
  });
});

describe('HU06 – Ubicación del reporte', () => {
  test('la validación rechaza ubicaciones fuera de SJL', () => {
    const r = validarReporte({ ...REPORTE_VALIDO, lat: -12.12, lng: -77.03 });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].message).toMatch(/San Juan de Lurigancho/);
  });

  test('guarda latitud, longitud y la zona del punto marcado', async () => {
    const ctx = await crearContexto();
    const res = await crearReporte(ctx, { lat: -11.9555, lng: -76.9935 });
    expect(res.status).toBe(201);
    expect(res.body.reporte).toMatchObject({ lat: -11.9555, lng: -76.9935, zona: 'Bayóvar' });
  });

  test('la API responde 400 si el punto está fuera del distrito', async () => {
    const ctx = await crearContexto();
    const res = await crearReporte(ctx, { lat: -12.12, lng: -77.03 });
    expect(res.status).toBe(400);
    expect(res.body.detalles[0].mensaje).toMatch(/San Juan de Lurigancho/);
  });
});
