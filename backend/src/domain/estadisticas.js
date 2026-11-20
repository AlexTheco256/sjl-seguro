'use strict';

const { TIPOS, FRANJAS, ESTADOS_PUBLICOS } = require('./constantes');
const { franjaHoraria } = require('./reportes');
const { filtrarPorRango } = require('./fechas');

function contarPor(lista, clave) {
  const out = {};
  for (const item of lista) {
    const k = clave(item);
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function mesLima(fecha) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    timeZone: 'America/Lima',
  })
    .format(new Date(fecha))
    .slice(0, 7);
}

/** Indicadores del panel de serenazgo/municipalidad (HU17, HU18). */
function calcularEstadisticas(reportes) {
  const publicos = reportes.filter((r) => ESTADOS_PUBLICOS.includes(r.estado));
  const atendidos = reportes.filter((r) => r.estado === 'atendido' && r.atendidoEn);
  const horas = atendidos.map(
    (r) => (new Date(r.atendidoEn).getTime() - new Date(r.creadoEn).getTime()) / 36e5,
  );
  const promedio = horas.length ? horas.reduce((a, b) => a + b, 0) / horas.length : 0;

  const porTipo = Object.keys(TIPOS).map((tipo) => ({
    tipo,
    etiqueta: TIPOS[tipo],
    total: publicos.filter((r) => r.tipo === tipo).length,
  }));

  const meses = contarPor(publicos, (r) => mesLima(r.fechaHora));
  const porMes = Object.keys(meses)
    .sort()
    .map((mes) => ({ mes, total: meses[mes] }));

  return {
    totales: {
      reportes: reportes.length,
      recibidos: reportes.filter((r) => r.estado === 'recibido').length,
      validados: publicos.length,
      atendidos: reportes.filter((r) => r.estado === 'atendido').length,
      descartados: reportes.filter((r) => r.estado === 'descartado').length,
      tiempoPromedioAtencionHoras: Math.round(promedio * 10) / 10,
    },
    porTipo,
    porMes,
  };
}

module.exports = { calcularEstadisticas, filtrarPorRango, mesLima };
