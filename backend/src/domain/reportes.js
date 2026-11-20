'use strict';

const { z } = require('zod');
const { sanitizarTexto } = require('./texto');
const {
  TIPOS,
  TIPOS_CRITICOS,
  TRANSICIONES,
  FRANJAS,
  LIMITES_SJL,
  ZONAS,
} = require('./constantes');

/** Indica si un punto está dentro del distrito de San Juan de Lurigancho (HU06). */
function dentroDeSJL(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= LIMITES_SJL.latMin &&
    lat <= LIMITES_SJL.latMax &&
    lng >= LIMITES_SJL.lngMin &&
    lng <= LIMITES_SJL.lngMax
  );
}

/** Devuelve el sector de SJL más cercano a un punto (HU18). */
function zonaMasCercana(lat, lng) {
  let mejor = ZONAS[0];
  let mejorDist = Infinity;
  for (const zona of ZONAS) {
    const d = (zona.lat - lat) ** 2 + (zona.lng - lng) ** 2;
    if (d < mejorDist) {
      mejorDist = d;
      mejor = zona;
    }
  }
  return mejor.nombre;
}

/** Hora (0–23) de una fecha en la zona horaria de Lima. */
function horaLima(fecha) {
  const h = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone: 'America/Lima',
  }).format(new Date(fecha));
  return Number(h);
}

/** Franja horaria (madrugada, manana, tarde, noche) de una fecha (HU12). */
function franjaHoraria(fecha) {
  const h = horaLima(fecha);
  return Object.keys(FRANJAS).find((k) => h >= FRANJAS[k].desde && h <= FRANJAS[k].hasta);
}

function esCritico(tipo) {
  return TIPOS_CRITICOS.includes(tipo);
}

/** Valida si un reporte puede pasar de un estado a otro (HU14, HU15). */
function transicionValida(desde, hacia) {
  return (TRANSICIONES[desde] || []).includes(hacia);
}

const esquemaReporte = z
  .object({
    tipo: z.enum(Object.keys(TIPOS), { error: 'Tipo de incidente no válido' }),
    descripcion: z
      .string({ error: 'La descripción es obligatoria' })
      .transform(sanitizarTexto)
      .pipe(
        z
          .string()
          .min(10, 'La descripción debe tener al menos 10 caracteres')
          .max(1000, 'La descripción no puede superar los 1000 caracteres'),
      ),
    lat: z.coerce.number({ error: 'Latitud inválida' }),
    lng: z.coerce.number({ error: 'Longitud inválida' }),
    fechaHora: z.coerce.date({ error: 'Fecha y hora inválidas' }),
    anonimo: z.boolean({ error: 'El campo anónimo debe ser verdadero o falso' }).default(false),
  })
  .superRefine((r, ctx) => {
    if (r.fechaHora.getTime() > Date.now() + 5 * 60 * 1000) {
      ctx.addIssue({
        code: 'custom',
        path: ['fechaHora'],
        message: 'La fecha del incidente no puede ser futura',
      });
    }
  });

/** Valida y normaliza los datos de un nuevo reporte. */
function validarReporte(datos) {
  return esquemaReporte.safeParse(datos);
}

/** Vista pública de un reporte: sin datos personales del autor (HU09, HU07). */
function vistaPublica(r) {
  return {
    id: r.id,
    codigo: r.codigo,
    tipo: r.tipo,
    descripcion: r.descripcion.length > 140 ? `${r.descripcion.slice(0, 137)}...` : r.descripcion,
    lat: r.lat,
    lng: r.lng,
    fechaHora: r.fechaHora,
    franja: franjaHoraria(r.fechaHora),
    zona: r.zona,
    estado: r.estado,
  };
}

/** Vista para serenazgo: oculta la identidad si el reporte es anónimo (HU07). */
function vistaSerenazgo(r, autor) {
  return {
    ...r,
    franja: franjaHoraria(r.fechaHora),
    critico: esCritico(r.tipo),
    usuarioId: r.anonimo ? null : r.usuarioId,
    autor: r.anonimo ? 'Anónimo' : autor?.nombre || 'Ciudadano',
  };
}

module.exports = {
  sanitizarTexto,
  dentroDeSJL,
  zonaMasCercana,
  horaLima,
  franjaHoraria,
  esCritico,
  transicionValida,
  validarReporte,
  vistaPublica,
  vistaSerenazgo,
};
