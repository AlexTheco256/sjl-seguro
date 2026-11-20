import { describe, expect, test } from 'vitest';
import {
  accionesDisponibles,
  ahoraLocalInput,
  dentroDeSJL,
  formatoFecha,
  inicioPorRol,
  localLimaAIso,
  puntosCalor,
  validarFormularioReporte,
} from './util.js';

describe('validarFormularioReporte', () => {
  const base = {
    tipo: 'robo_al_paso',
    descripcion: 'Robo de celular en el paradero',
    lat: -12.02,
    lng: -77.0,
    fechaHora: '2026-11-01T20:00',
  };
  test('formulario válido no tiene errores', () => {
    expect(validarFormularioReporte(base)).toEqual({});
  });
  test('detecta campos faltantes', () => {
    const e = validarFormularioReporte({});
    expect(Object.keys(e).sort()).toEqual(['descripcion', 'fechaHora', 'tipo', 'ubicacion']);
  });
  test('detecta ubicación fuera de SJL', () => {
    expect(validarFormularioReporte({ ...base, lat: -12.12, lng: -77.03 }).ubicacion).toMatch(/San Juan/);
  });
  test('detecta fecha futura', () => {
    expect(validarFormularioReporte({ ...base, fechaHora: '2099-01-01T00:00' }).fechaHora).toMatch(/futura/);
  });
});

describe('fechas en hora de Lima', () => {
  test('datetime-local de Lima se convierte a UTC (+5 h)', () => {
    expect(localLimaAIso('2026-11-01T20:00')).toBe('2026-11-02T01:00:00.000Z');
    expect(localLimaAIso('')).toBeNull();
  });
  test('ahoraLocalInput usa la hora de Lima', () => {
    expect(ahoraLocalInput(new Date('2026-11-02T01:00:00Z'))).toBe('2026-11-01T20:00');
  });
  test('formatoFecha', () => {
    expect(formatoFecha(null)).toBe('—');
    expect(formatoFecha('2026-11-02T01:00:00Z')).toMatch(/2026/);
  });
});

describe('reglas de negocio en la interfaz', () => {
  test('acciones por estado', () => {
    expect(accionesDisponibles('recibido')).toEqual(['validado', 'descartado']);
    expect(accionesDisponibles('descartado')).toEqual([]);
  });
  test('límites de SJL', () => {
    expect(dentroDeSJL(-11.9555, -76.9935)).toBe(true);
    expect(dentroDeSJL(-12.1, -77.03)).toBe(false);
  });
  test('intensidad del mapa de calor mayor en delitos críticos', () => {
    expect(puntosCalor([{ lat: 1, lng: 2, tipo: 'extorsion' }, { lat: 3, lng: 4, tipo: 'otro' }])).toEqual([
      [1, 2, 1],
      [3, 4, 0.7],
    ]);
  });
  test('redirección según rol', () => {
    expect(inicioPorRol('serenazgo')).toBe('/serenazgo');
    expect(inicioPorRol('administrador')).toBe('/panel');
    expect(inicioPorRol('ciudadano')).toBe('/');
  });
});
