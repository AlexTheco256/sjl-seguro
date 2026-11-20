/** Cliente HTTP de la API. El token se guarda en sessionStorage (se borra al cerrar la pestaña). */
const CLAVE = 'sjl_token';

export const sesion = {
  token: () => {
    try {
      return sessionStorage.getItem(CLAVE);
    } catch {
      return null;
    }
  },
  guardar: (t) => {
    try {
      sessionStorage.setItem(CLAVE, t);
    } catch {
      /* almacenamiento no disponible */
    }
  },
  borrar: () => {
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      /* almacenamiento no disponible */
    }
  },
};

export class ErrorApi extends Error {
  constructor(status, cuerpo) {
    super(cuerpo?.error || `Error ${status}`);
    this.status = status;
    this.detalles = cuerpo?.detalles;
  }
}

export async function api(ruta, { metodo = 'GET', cuerpo, crudo = false } = {}) {
  const headers = {};
  const token = sesion.token();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`/api${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
  if (crudo && res.ok) return res;
  const datos = await res.json().catch(() => ({}));
  if (res.status === 401 && token) {
    sesion.borrar();
    window.dispatchEvent(new Event('sesion-expirada'));
  }
  if (!res.ok) throw new ErrorApi(res.status, datos);
  return datos;
}

/** Convierte los detalles de validación del servidor en { campo: mensaje }. */
export function erroresPorCampo(error) {
  const out = {};
  for (const d of error?.detalles || []) {
    const campo = d.campo === 'lat' || d.campo === 'lng' ? 'ubicacion' : d.campo;
    if (campo && !out[campo]) out[campo] = d.mensaje;
  }
  return out;
}
