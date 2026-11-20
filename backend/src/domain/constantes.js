'use strict';

/** Tipos de incidente que puede reportar un ciudadano (HU05). */
const TIPOS = {
  robo_al_paso: 'Robo al paso',
  asalto_transporte: 'Asalto en transporte público',
  extorsion: 'Extorsión',
  venta_drogas: 'Microcomercialización de drogas',
  otro: 'Otro',
};

/** Tipos que generan alerta inmediata para serenazgo (HU16). */
const TIPOS_CRITICOS = ['asalto_transporte', 'extorsion'];

/** Estados del ciclo de vida de un reporte (HU13–HU15). */
const ESTADOS = {
  recibido: 'Recibido',
  validado: 'Validado',
  descartado: 'Descartado',
  en_atencion: 'En atención',
  atendido: 'Atendido',
};

/** Transiciones de estado permitidas (HU14, HU15). */
const TRANSICIONES = {
  recibido: ['validado', 'descartado'],
  validado: ['en_atencion'],
  en_atencion: ['atendido'],
  descartado: [],
  atendido: [],
};

/** Estados visibles en el mapa público (HU09): solo información verificada. */
const ESTADOS_PUBLICOS = ['validado', 'en_atencion', 'atendido'];

/** Franjas horarias en hora de Lima (HU12). */
const FRANJAS = {
  madrugada: { etiqueta: 'Madrugada (00:00–05:59)', desde: 0, hasta: 5 },
  manana: { etiqueta: 'Mañana (06:00–11:59)', desde: 6, hasta: 11 },
  tarde: { etiqueta: 'Tarde (12:00–17:59)', desde: 12, hasta: 17 },
  noche: { etiqueta: 'Noche (18:00–23:59)', desde: 18, hasta: 23 },
};

const ROLES = ['ciudadano', 'serenazgo', 'administrador'];

/** Rectángulo que contiene al distrito de San Juan de Lurigancho (HU06). */
const LIMITES_SJL = {
  latMin: -12.04,
  latMax: -11.92,
  lngMin: -77.03,
  lngMax: -76.94,
};

const CENTRO_SJL = { lat: -11.985, lng: -76.995 };

/** Sectores de referencia de SJL (centroides aproximados) para agrupar incidentes (HU18). */
const ZONAS = [
  { nombre: 'Zárate', lat: -12.0255, lng: -77.001 },
  { nombre: 'Caja de Agua', lat: -12.0305, lng: -77.0135 },
  { nombre: 'Las Flores', lat: -12.0145, lng: -76.998 },
  { nombre: 'Campoy', lat: -12.0175, lng: -76.972 },
  { nombre: 'Mangomarca', lat: -12.007, lng: -76.987 },
  { nombre: 'San Carlos', lat: -11.996, lng: -77.006 },
  { nombre: 'Canto Grande', lat: -11.988, lng: -77.011 },
  { nombre: 'Canto Rey', lat: -11.98, lng: -76.995 },
  { nombre: 'Santa María', lat: -11.97, lng: -77.003 },
  { nombre: 'Montenegro', lat: -11.961, lng: -76.98 },
  { nombre: 'Bayóvar', lat: -11.955, lng: -76.992 },
  { nombre: 'Huáscar', lat: -11.957, lng: -77.005 },
  { nombre: 'Motupe', lat: -11.944, lng: -76.998 },
];

module.exports = {
  TIPOS,
  TIPOS_CRITICOS,
  ESTADOS,
  TRANSICIONES,
  ESTADOS_PUBLICOS,
  FRANJAS,
  ROLES,
  LIMITES_SJL,
  CENTRO_SJL,
  ZONAS,
};
