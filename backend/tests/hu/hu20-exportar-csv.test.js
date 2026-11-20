'use strict';

// HU20 – Exportar reportes a CSV (P2-25)
const request = require('supertest');
const { crearContexto, crearReporte, cambiarEstado } = require('../helpers');
const { reportesACsv, celda } = require('../../src/domain/csv');

describe('reportesACsv', () => {
  const r = { id: 'a', codigo: 'SJL-1', tipo: 'robo_al_paso', lat: -12.02, lng: -77.0, zona: 'Zárate', estado: 'validado', fechaHora: '2026-10-10T02:00:00Z', usuarioId: 'secreto' };
  test('cabecera y filas sin datos personales, en hora de Lima', () => {
    const csv = reportesACsv([r]);
    const lineas = csv.replace('﻿', '').trim().split('\r\n');
    expect(lineas[0]).toBe('id,codigo,tipo,fecha,hora,latitud,longitud,zona,estado');
    expect(lineas[1]).toBe('a,SJL-1,Robo al paso,2026-10-09,21:00,-12.020000,-77.000000,Zárate,Validado');
    expect(csv).not.toContain('secreto');
  });
  test('neutraliza inyección de fórmulas y escapa comillas', () => {
    expect(celda('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(celda('+51 999')).toBe("'+51 999");
    expect(celda('-12.5')).toBe('-12.5');
    expect(celda('-1+1')).toBe("'-1+1");
    expect(celda(null)).toBe('');
  });
});

describe('HU20 – GET /api/estadisticas/exportar.csv', () => {
  test('descarga solo validados, filtrados y sin datos del autor', async () => {
    const ctx = await crearContexto();
    const a = await crearReporte(ctx);
    const b = await crearReporte(ctx, { tipo: 'extorsion' });
    await crearReporte(ctx, { tipo: 'extorsion' });
    await cambiarEstado(ctx, a.body.reporte.id, { estado: 'validado' });
    await cambiarEstado(ctx, b.body.reporte.id, { estado: 'validado' });
    const res = await request(ctx.app).get('/api/estadisticas/exportar.csv?tipos=extorsion').set(ctx.auth('serenazgo'));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="reportes-sjl-/);
    const lineas = res.text.trim().split('\r\n');
    expect(lineas).toHaveLength(2);
    expect(lineas[1]).toContain('Extorsión');
    expect(res.text).not.toContain(ctx.ids.vecino);
  });
  test('ciudadanos no pueden exportar', async () => {
    const ctx = await crearContexto();
    expect((await request(ctx.app).get('/api/estadisticas/exportar.csv').set(ctx.auth('vecino'))).status).toBe(403);
  });
});
