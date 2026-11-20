import { describe, expect, test } from 'vitest';
import { etiquetaBotonTema, guardarTema, leerTemaGuardado, siguienteTema, temaInicial } from './tema.js';

/** Almacén en memoria con la misma interfaz que localStorage. */
const almacen = () => {
  const datos = new Map();
  return { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, String(v)) };
};

describe('HU21 – tema claro/oscuro', () => {
  test('sin preferencia guardada se usa el tema del sistema', () => {
    expect(temaInicial(null, true)).toBe('oscuro');
    expect(temaInicial(null, false)).toBe('claro');
  });

  test('la preferencia guardada tiene prioridad sobre el sistema', () => {
    expect(temaInicial('claro', true)).toBe('claro');
    expect(temaInicial('oscuro', false)).toBe('oscuro');
  });

  test('valores guardados inválidos se ignoran', () => {
    expect(temaInicial('azul', false)).toBe('claro');
  });

  test('el selector alterna entre claro y oscuro', () => {
    expect(siguienteTema('claro')).toBe('oscuro');
    expect(siguienteTema('oscuro')).toBe('claro');
  });

  test('la preferencia se recuerda al volver', () => {
    const a = almacen();
    expect(leerTemaGuardado(a)).toBeNull();
    guardarTema('oscuro', a);
    expect(leerTemaGuardado(a)).toBe('oscuro');
    expect(temaInicial(leerTemaGuardado(a), false)).toBe('oscuro');
  });

  test('si el almacenamiento falla no se rompe la app', () => {
    const roto = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    expect(leerTemaGuardado(roto)).toBeNull();
    expect(() => guardarTema('claro', roto)).not.toThrow();
  });

  test('etiqueta accesible del botón', () => {
    expect(etiquetaBotonTema('claro')).toBe('Cambiar a modo oscuro');
    expect(etiquetaBotonTema('oscuro')).toBe('Cambiar a modo claro');
  });
});
