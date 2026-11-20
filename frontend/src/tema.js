/** Preferencia de tema claro/oscuro (HU21). */
export const CLAVE_TEMA = 'sjl_tema';
export const TEMAS = ['claro', 'oscuro'];

/**
 * Tema inicial: la preferencia guardada por el usuario o, si no eligió,
 * el tema del sistema operativo.
 */
export function temaInicial(guardado, prefiereOscuro) {
  if (TEMAS.includes(guardado)) return guardado;
  return prefiereOscuro ? 'oscuro' : 'claro';
}

export function siguienteTema(actual) {
  return actual === 'oscuro' ? 'claro' : 'oscuro';
}

export function leerTemaGuardado(almacen = globalThis.localStorage) {
  try {
    return almacen?.getItem(CLAVE_TEMA) ?? null;
  } catch {
    return null;
  }
}

export function guardarTema(tema, almacen = globalThis.localStorage) {
  try {
    almacen?.setItem(CLAVE_TEMA, tema);
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Texto accesible del botón que cambia de tema. */
export function etiquetaBotonTema(actual) {
  return actual === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
}
