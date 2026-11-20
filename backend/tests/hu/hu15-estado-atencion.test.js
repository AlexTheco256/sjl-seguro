'use strict';

// HU15 – Actualizar el estado de atención (P2-20)
const request = require('supertest');
const { crearContexto, crearReporte, cambiarEstado } = require('../helpers');
const { transicionValida } = require('../../src/domain/reportes');

describe('máquina de estados de atención', () => {
  test.each([
    ['validado', 'en_atencion', true],
    ['en_atencion', 'atendido', true],
    ['descartado', 'en_atencion', false],
    ['atendido', 'recibido', false],
  ])('%s → %s = %s', (de, a, esperado) => expect(transicionValida(de, a)).toBe(esperado));
});

describe('HU15 – Estado de atención', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await crearContexto();
  });

  test('Validado → En atención (unidad) → Atendido (nota) con auditoría', async () => {
    const { id } = (await crearReporte(ctx)).body.reporte;
    await cambiarEstado(ctx, id, { estado: 'validado' });
    expect((await cambiarEstado(ctx, id, { estado: 'en_atencion', unidad: 'Unidad 12' })).body.reporte.unidad).toBe('Unidad 12');
    const fin = await cambiarEstado(ctx, id, { estado: 'atendido', nota: 'Se detuvo a un sospechoso.' });
    expect(fin.body.reporte).toMatchObject({ estado: 'atendido', nota: 'Se detuvo a un sospechoso.' });
    expect(fin.body.reporte.atendidoEn).toBeTruthy();
    const det = await request(ctx.app).get(`/api/serenazgo/reportes/${id}`).set(ctx.auth('serenazgo'));
    expect(det.body.historial.map((h) => h.hacia)).toEqual(['validado', 'en_atencion', 'atendido']);
  });

  test('cerrar exige nota de cierre', async () => {
    const { id } = (await crearReporte(ctx)).body.reporte;
    await cambiarEstado(ctx, id, { estado: 'validado' });
    await cambiarEstado(ctx, id, { estado: 'en_atencion' });
    expect((await cambiarEstado(ctx, id, { estado: 'atendido' })).status).toBe(400);
  });

  test('impide pasar un reporte Descartado a En atención (409)', async () => {
    const { id } = (await crearReporte(ctx)).body.reporte;
    await cambiarEstado(ctx, id, { estado: 'descartado', motivo: 'Duplicado' });
    const res = await cambiarEstado(ctx, id, { estado: 'en_atencion' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/No se puede pasar/);
  });
});
