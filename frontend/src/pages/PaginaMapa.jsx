import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleMarker, Popup } from 'react-leaflet';
import { api } from '../api.js';
import { CapaCalor, MapaBase } from '../components/Mapa.jsx';
import { Aviso } from '../components/Ui.jsx';
import { COLORES_TIPO, FRANJAS, TIPOS, formatoFecha, puntosCalor } from '../util.js';

/** Mapa público de zonas de riesgo con filtros (HU09–HU12). */
export default function PaginaMapa() {
  const [verCalor, setVerCalor] = useState(true);
  const [verPuntos, setVerPuntos] = useState(true);
  const [datos, setDatos] = useState({ incidentes: [], total: 0 });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const q = new URLSearchParams();
    setCargando(true);
    api(`/incidentes?${q}`)
      .then((r) => {
        setDatos(r);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  const puntos = useMemo(() => puntosCalor(datos.incidentes), [datos]);
  return (
    <div className="layout-mapa">
      <aside className="panel-lateral">
        <h1>Zonas de riesgo en San Juan de Lurigancho</h1>
        <p className="sub">
          Incidentes reportados por vecinos y <strong>validados por serenazgo</strong>. Las zonas en rojo concentran
          más hechos delictivos.
        </p>

        <fieldset>
          <legend>Capas</legend>
          <label className="check">
            <input type="checkbox" checked={verCalor} onChange={() => setVerCalor(!verCalor)} /> Mapa de calor
          </label>
          <label className="check">
            <input type="checkbox" checked={verPuntos} onChange={() => setVerPuntos(!verPuntos)} /> Incidentes
          </label>
        </fieldset>

        <p className="contador" aria-live="polite">
          {cargando ? 'Cargando…' : `${datos.total} incidentes en el mapa`}
        </p>
        <Aviso tipo="error">{error}</Aviso>

        <div className="leyenda">
          <span>Menor riesgo</span>
          <span className="gradiente" />
          <span>Mayor riesgo</span>
        </div>

        <Link to="/reportar" className="btn primario ancho">
          Reportar un incidente
        </Link>
      </aside>

      <section className="contenedor-mapa">
        <MapaBase>
          {verCalor && puntos.length > 0 && <CapaCalor puntos={puntos} />}
          {verPuntos &&
            datos.incidentes.map((i) => (
              <CircleMarker
                key={i.id}
                center={[i.lat, i.lng]}
                radius={6}
                pathOptions={{ color: '#fff', weight: 1.5, fillColor: COLORES_TIPO[i.tipo], fillOpacity: 0.95 }}
              >
                <Popup>
                  <strong>{TIPOS[i.tipo]}</strong>
                  <br />
                  {formatoFecha(i.fechaHora)} · {i.zona}
                  <p className="popup-desc">{i.descripcion}</p>
                </Popup>
              </CircleMarker>
            ))}
        </MapaBase>
      </section>
    </div>
  );
}
