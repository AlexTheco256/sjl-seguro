/** Utilidades puras del frontend (probadas con Vitest). */

export const TIPOS = {
  robo_al_paso: 'Robo al paso',
  asalto_transporte: 'Asalto en transporte público',
  extorsion: 'Extorsión',
  venta_drogas: 'Microcomercialización de drogas',
  otro: 'Otro',
};

export const COLORES_TIPO = {
  robo_al_paso: '#dc2626',
  asalto_transporte: '#ea580c',
  extorsion: '#7c3aed',
  venta_drogas: '#0891b2',
  otro: '#64748b',
};

export const FRANJAS = {
  madrugada: 'Madrugada (00:00–05:59)',
  manana: 'Mañana (06:00–11:59)',
  tarde: 'Tarde (12:00–17:59)',
  noche: 'Noche (18:00–23:59)',
};

export const ESTADOS = {
  recibido: 'Recibido',
  validado: 'Validado',
  descartado: 'Descartado',
  en_atencion: 'En atención',
  atendido: 'Atendido',
};

export const LIMITES_SJL = { latMin: -12.04, latMax: -11.92, lngMin: -77.03, lngMax: -76.94 };
export const CENTRO_SJL = [-11.985, -76.995];

export function dentroDeSJL(lat, lng) {
  return lat >= LIMITES_SJL.latMin && lat <= LIMITES_SJL.latMax && lng >= LIMITES_SJL.lngMin && lng <= LIMITES_SJL.lngMax;
}

/** Fecha y hora legible en la zona horaria de Lima. */
export function formatoFecha(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(iso));
}

/** Valor para <input type="datetime-local"> con la hora actual de Lima. */
export function ahoraLocalInput(fecha = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'America/Lima',
    })
      .formatToParts(fecha)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Convierte el valor de datetime-local (hora de Lima, UTC-5) a ISO UTC. */
export function localLimaAIso(valor) {
  if (!valor) return null;
  return new Date(`${valor}:00-05:00`).toISOString();
}

/** Valida en el cliente el formulario de reporte (el servidor vuelve a validar). */
export function validarFormularioReporte({ tipo, descripcion, lat, lng, fechaHora }) {
  const errores = {};
  if (!TIPOS[tipo]) errores.tipo = 'Selecciona el tipo de incidente';
  const d = (descripcion || '').trim();
  if (d.length < 10) errores.descripcion = 'Describe lo ocurrido (mínimo 10 caracteres)';
  if (d.length > 1000) errores.descripcion = 'Máximo 1000 caracteres';
  if (lat == null || lng == null) errores.ubicacion = 'Marca el lugar del incidente en el mapa';
  else if (!dentroDeSJL(lat, lng)) errores.ubicacion = 'La ubicación debe estar dentro de San Juan de Lurigancho';
  if (!fechaHora) errores.fechaHora = 'Indica la fecha y hora';
  else if (new Date(localLimaAIso(fechaHora)).getTime() > Date.now() + 5 * 60 * 1000) {
    errores.fechaHora = 'La fecha no puede ser futura';
  }
  return errores;
}

/** Acciones disponibles para serenazgo según el estado actual (HU14, HU15). */
export function accionesDisponibles(estado) {
  return (
    {
      recibido: ['validado', 'descartado'],
      validado: ['en_atencion'],
      en_atencion: ['atendido'],
    }[estado] || []
  );
}

/** Puntos para la capa de calor: [lat, lng, intensidad]. */
export function puntosCalor(incidentes) {
  return incidentes.map((i) => [i.lat, i.lng, i.tipo === 'asalto_transporte' || i.tipo === 'extorsion' ? 1 : 0.7]);
}

/** Ruta de inicio según el rol del usuario. */
export function inicioPorRol(rol) {
  if (rol === 'serenazgo') return '/serenazgo';
  if (rol === 'administrador') return '/panel';
  return '/';
}
