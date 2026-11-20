import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Aviso, Barras, Tendencia } from '../components/Ui.jsx';
import { FRANJAS } from '../util.js';

/** Panel de indicadores, ranking de zonas y exportación (HU17, HU18, HU20). */
export default function PaginaPanel() {
  const [rango, setRango] = useState({ desde: '', hasta: '' });
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = new URLSearchParams();
    if (rango.desde) q.set('desde', rango.desde);
    if (rango.hasta) q.set('hasta', rango.hasta);
    api(`/estadisticas?${q}`)
      .then(setDatos)
      .catch((e) => setError(e.message));
  }, [rango]);

  const t = datos?.totales;
  return (
    <section className="pagina ancha">
      <div className="titulo-fila">
        <h1>Panel de inseguridad – SJL</h1>
        <div className="filtros">
          <label>
            Desde <input type="date" value={rango.desde} onChange={(e) => setRango({ ...rango, desde: e.target.value })} />
          </label>
          <label>
            Hasta <input type="date" value={rango.hasta} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} />
          </label>
        </div>
      </div>
      <Aviso tipo="error">{error}</Aviso>
      {!datos && !error && <p className="cargando">Cargando…</p>}
      {datos && (
        <>
          <div className="tarjetas">
            <div className="kpi">
              <span>Reportes</span>
              <strong>{t.reportes}</strong>
            </div>
            <div className="kpi">
              <span>Pendientes</span>
              <strong>{t.recibidos}</strong>
            </div>
            <div className="kpi">
              <span>Validados</span>
              <strong>{t.validados}</strong>
            </div>
            <div className="kpi">
              <span>Atendidos</span>
              <strong>{t.atendidos}</strong>
            </div>
            <div className="kpi">
              <span>Tiempo prom. de atención</span>
              <strong>{t.tiempoPromedioAtencionHoras} h</strong>
            </div>
          </div>

          <div className="rejilla">
            <article className="caja">
              <h2>Incidentes por tipo de delito</h2>
              <Barras datos={datos.porTipo.map((x) => ({ clave: x.tipo, etiqueta: x.etiqueta, valor: x.total }))} />
            </article>
            <article className="caja">
              <h2>Tendencia mensual</h2>
              <Tendencia datos={datos.porMes} />
            </article>
            <article className="caja">
              <h2>Zonas críticas (top 5)</h2>
              {datos.topZonas.length === 0 ? (
                <p className="vacio">Sin datos.</p>
              ) : (
                <ol className="ranking">
                  {datos.topZonas.map((z) => (
                    <li key={z.zona}>
                      <Link to={`/?lat=${z.lat.toFixed(5)}&lng=${z.lng.toFixed(5)}`}>{z.zona}</Link>
                      <span>{z.total} incidentes</span>
                    </li>
                  ))}
                </ol>
              )}
            </article>
            <article className="caja">
              <h2>Incidentes por franja horaria</h2>
              <Barras
                datos={datos.porFranja.map((x) => ({ clave: x.franja, etiqueta: x.etiqueta, valor: x.total }))}
                resaltar={datos.franjaMasPeligrosa}
              />
              {datos.franjaMasPeligrosa && (
                <p className="sub">
                  Franja más peligrosa: <strong>{FRANJAS[datos.franjaMasPeligrosa]}</strong>
                </p>
              )}
            </article>
          </div>
        </>
      )}
    </section>
  );
}
