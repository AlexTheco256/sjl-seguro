import { ESTADOS } from '../util.js';

export function Estado({ estado }) {
  return <span className={`estado estado-${estado}`}>{ESTADOS[estado] || estado}</span>;
}

export function Aviso({ tipo = 'info', children }) {
  if (!children) return null;
  return (
    <div className={`aviso aviso-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Campo({ etiqueta, error, children, ayuda }) {
  return (
    <label className={`campo ${error ? 'campo-error' : ''}`}>
      <span className="campo-etiqueta">{etiqueta}</span>
      {children}
      {ayuda && !error && <small className="campo-ayuda">{ayuda}</small>}
      {error && <small className="campo-msg">{error}</small>}
    </label>
  );
}

/** Gráfico de barras horizontales simple y accesible. */
export function Barras({ datos, resaltar }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <ul className="barras">
      {datos.map((d) => (
        <li key={d.clave} className={d.clave === resaltar ? 'resaltada' : ''}>
          <span className="barras-etiqueta">{d.etiqueta}</span>
          <span className="barras-pista">
            <span className="barras-relleno" style={{ width: `${(d.valor / max) * 100}%` }} />
          </span>
          <span className="barras-valor">{d.valor}</span>
        </li>
      ))}
    </ul>
  );
}

/** Línea de tendencia mensual en SVG. */
export function Tendencia({ datos }) {
  if (!datos.length) return <p className="vacio">Sin datos en el periodo.</p>;
  const w = 520;
  const h = 160;
  const pad = 28;
  const max = Math.max(1, ...datos.map((d) => d.total));
  const x = (i) => pad + (datos.length === 1 ? (w - 2 * pad) / 2 : (i * (w - 2 * pad)) / (datos.length - 1));
  const y = (v) => h - pad - (v / max) * (h - 2 * pad);
  const puntos = datos.map((d, i) => `${x(i)},${y(d.total)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="tendencia" role="img" aria-label="Tendencia mensual de reportes">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} className="eje" />
      <polyline points={puntos} className="linea" />
      {datos.map((d, i) => (
        <g key={d.mes}>
          <circle cx={x(i)} cy={y(d.total)} r="4" className="punto" />
          <text x={x(i)} y={y(d.total) - 9} textAnchor="middle" className="valor">
            {d.total}
          </text>
          <text x={x(i)} y={h - 8} textAnchor="middle" className="mes">
            {d.mes}
          </text>
        </g>
      ))}
    </svg>
  );
}
