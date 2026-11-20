'use strict';

// HU16 – Alerta de reportes críticos (P2-21)
const request = require('supertest');
const { crearContexto, crearReporte, cambiarEstado } = require('../helpers');
const { esCritico } = require('../../src/domain/reportes');

describe('esCritico', () => {
  test('asalto en transporte y extorsión son críticos', () => {
    expect(esCritico('asalto_transporte')).toBe(true);
    expect(esCritico('extorsion')).toBe(true);
    expect(esCritico('robo_al_paso')).toBe(false);
  });
});

describe('HU16 – Alertas de reportes críticos', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await crearContexto();
  });

  test('los críticos pendientes aparecen primero en la bandeja', async () => {
    await crearReporte(ctx);
    const critico = await crearReporte(ctx, { tipo: 'asalto_transporte' });
    await crearReporte(ctx);
    const res = await request(ctx.app).get('/api/serenazgo/reportes').set(ctx.auth('serenazgo'));
    expect(res.body.pendientesCriticos).toBe(1);
    expect(res.body.items[0]).toMatchObject({ id: critico.body.reporte.id, critico: true });
  });

  test('la alerta desaparece cuando el reporte cambia de estado', async () => {
    const { id } = (await crearReporte(ctx, { tipo: 'extorsion', anonimo: true })).body.reporte;
    await crearReporte(ctx);
    let alertas = await request(ctx.app).get('/api/serenazgo/alertas').set(ctx.auth('serenazgo'));
    expect(alertas.body.total).toBe(1);
    expect(alertas.body.alertas[0].critico).toBe(true);
    await cambiarEstado(ctx, id, { estado: 'validado' });
    alertas = await request(ctx.app).get('/api/serenazgo/alertas').set(ctx.auth('serenazgo'));
    expect(alertas.body.total).toBe(0);
  });
});
