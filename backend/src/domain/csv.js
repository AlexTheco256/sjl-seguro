'use strict';

const { TIPOS, ESTADOS } = require('./constantes');

/**
 * Escapa un valor para CSV y neutraliza la inyección de fórmulas
 * (CSV injection: celdas que empiezan con = + - @ se prefijan con ').
 */
function celda(valor) {
  let s = valor === null || valor === undefined ? '' : String(valor);
  // Los números (p. ej. coordenadas negativas) no son fórmulas y se dejan tal cual.
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  if (/[",\n\r;]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fechaHoraLima(iso) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Lima',
  }).formatToParts(new Date(iso));
  const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

/** Exporta reportes a CSV sin datos personales del autor (HU20). */
function reportesACsv(reportes) {
  const cabecera = ['id', 'codigo', 'tipo', 'fecha', 'hora', 'latitud', 'longitud', 'zona', 'estado'];
  const filas = reportes.map((r) => {
    const { fecha, hora } = fechaHoraLima(r.fechaHora);
    return [
      r.id,
      r.codigo,
      TIPOS[r.tipo] || r.tipo,
      fecha,
      hora,
      r.lat.toFixed(6),
      r.lng.toFixed(6),
      r.zona,
      ESTADOS[r.estado] || r.estado,
    ]
      .map(celda)
      .join(',');
  });
  return `﻿${[cabecera.join(','), ...filas].join('\r\n')}\r\n`;
}

module.exports = { reportesACsv, celda, fechaHoraLima };
