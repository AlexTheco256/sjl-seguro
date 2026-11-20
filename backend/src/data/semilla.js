'use strict';

/**
 * Datos de demostración: incidentes simulados concentrados en zonas y horarios
 * de mayor riesgo de SJL. Son ficticios y solo sirven para probar el sistema.
 */
const { zonaMasCercana } = require('../domain/reportes');

/** Generador pseudoaleatorio determinista (mulberry32). */
function prng(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Puntos calientes: [lat, lng, peso, tipos predominantes]
const FOCOS = [
  [-12.0285, -77.0125, 5, ['robo_al_paso', 'asalto_transporte', 'extorsion']], // Caja de Agua / Próceres
  [-12.0245, -77.0005, 4, ['robo_al_paso', 'venta_drogas']], // Zárate
  [-11.9555, -76.9935, 4, ['asalto_transporte', 'robo_al_paso']], // Bayóvar (estación)
  [-11.9805, -76.9965, 3, ['extorsion', 'extorsion', 'robo_al_paso']], // Canto Rey
  [-11.988, -77.0105, 3, ['robo_al_paso', 'venta_drogas']], // Canto Grande
  [-12.0075, -76.9875, 2, ['extorsion', 'asalto_transporte']], // Mangomarca
  [-11.9615, -76.9805, 2, ['venta_drogas', 'robo_al_paso']], // Montenegro
  [-12.0145, -76.998, 1, ['robo_al_paso', 'otro']], // Las Flores
];

const DESCRIPCIONES = {
  robo_al_paso: [
    'Dos sujetos en moto arrebataron el celular a una vecina en el paradero.',
    'Robo de cartera a una señora cuando salía del mercado.',
    'Le quitaron la mochila a un estudiante al salir del colegio.',
  ],
  asalto_transporte: [
    'Asaltaron a los pasajeros de una combi en la avenida principal.',
    'Delincuentes subieron al bus y robaron celulares a varios pasajeros.',
    'Asalto a mototaxista cerca de la estación del Metro.',
  ],
  extorsion: [
    'Bodega del barrio recibió amenazas y cobro de cupos.',
    'Transportistas de la empresa de la zona denuncian cobro de cupos.',
    'Dejaron una nota extorsiva en la puerta de un negocio.',
  ],
  venta_drogas: [
    'Venta de droga frecuente en el parque por las noches.',
    'Se observa microcomercialización en la esquina del pasaje.',
  ],
  otro: ['Grupo de personas consumiendo alcohol y generando disturbios en la vía pública.'],
};

const HORAS = [0, 1, 2, 5, 6, 7, 8, 12, 13, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23];

/**
 * Genera `cantidad` incidentes distribuidos en los últimos `dias` días.
 * @returns {Array<object>} reportes sin id (los asigna el repositorio)
 */
function generarIncidentes({ cantidad = 90, dias = 120, ahora = new Date(), semilla = 2210489 } = {}) {
  const rnd = prng(semilla);
  const pesoTotal = FOCOS.reduce((a, f) => a + f[2], 0);
  const out = [];
  for (let i = 0; i < cantidad; i += 1) {
    let x = rnd() * pesoTotal;
    const foco = FOCOS.find((f) => (x -= f[2]) <= 0) || FOCOS[0];
    const tipo = foco[3][Math.floor(rnd() * foco[3].length)];
    const lat = foco[0] + (rnd() - 0.5) * 0.009;
    const lng = foco[1] + (rnd() - 0.5) * 0.009;
    const diasAtras = Math.floor(rnd() * dias);
    const hora = HORAS[Math.floor(rnd() * HORAS.length)];
    const f = new Date(ahora.getTime() - diasAtras * 864e5);
    // hora local de Lima (UTC-5)
    f.setUTCHours(hora + 5, Math.floor(rnd() * 60), 0, 0);
    if (f > ahora) f.setTime(f.getTime() - 864e5);

    const r = rnd();
    let estado = 'atendido';
    if (diasAtras < 7 && r < 0.7) estado = 'recibido';
    else if (r < 0.08) estado = 'descartado';
    else if (r < 0.35) estado = 'validado';
    else if (r < 0.45) estado = 'en_atencion';

    const creadoEn = new Date(f.getTime() + Math.floor(rnd() * 40) * 60e3);
    const descs = DESCRIPCIONES[tipo];
    out.push({
      tipo,
      descripcion: descs[Math.floor(rnd() * descs.length)],
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
      fechaHora: f.toISOString(),
      anonimo: tipo === 'extorsion' || rnd() < 0.3,
      estado,
      zona: zonaMasCercana(lat, lng),
      creadoEn: creadoEn.toISOString(),
      atendidoEn:
        estado === 'atendido'
          ? new Date(creadoEn.getTime() + (1 + Math.floor(rnd() * 30)) * 36e5).toISOString()
          : null,
      motivo: estado === 'descartado' ? 'Reporte duplicado' : null,
      nota: estado === 'atendido' ? 'Patrullaje de serenazgo acudió a la zona.' : null,
    });
  }
  return out;
}

/** Usuarios de demostración (solo modo memoria / seed). Las contraseñas se pueden sobrescribir por variables de entorno. */
function usuariosDemo(env = process.env) {
  return [
    {
      nombre: 'Administrador SJL',
      email: 'admin@sjlseguro.pe',
      password: env.DEMO_ADMIN_PASSWORD || 'Admin2026!',
      rol: 'administrador',
    },
    {
      nombre: 'Operador Serenazgo',
      email: 'serenazgo@sjlseguro.pe',
      password: env.DEMO_SERENAZGO_PASSWORD || 'Serenazgo2026!',
      rol: 'serenazgo',
    },
    {
      nombre: 'Vecino Demo',
      email: 'vecino@sjlseguro.pe',
      password: env.DEMO_VECINO_PASSWORD || 'Vecino2026!',
      rol: 'ciudadano',
    },
  ];
}

module.exports = { generarIncidentes, usuariosDemo, prng };
