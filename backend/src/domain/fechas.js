'use strict';

/**
 * Filtra reportes por rango de fechas del incidente (HU17).
 * `desde` y `hasta` son fechas ISO (YYYY-MM-DD) inclusivas.
 */
function filtrarPorRango(reportes, desde, hasta) {
  const ini = desde ? new Date(`${desde}T00:00:00-05:00`).getTime() : -Infinity;
  const fin = hasta ? new Date(`${hasta}T23:59:59-05:00`).getTime() : Infinity;
  return reportes.filter((r) => {
    const t = new Date(r.fechaHora).getTime();
    return t >= ini && t <= fin;
  });
}

module.exports = { filtrarPorRango };
