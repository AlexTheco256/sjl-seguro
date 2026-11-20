import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleMarker, Popup } from 'react-leaflet';
import { api } from '../api.js';
import { CapaCalor, MapaBase } from '../components/Mapa.jsx';
import { Aviso } from '../components/Ui.jsx';
import { COLORES_TIPO, FRANJAS, TIPOS, formatoFecha, puntosCalor } from '../util.js';

/** Mapa público de zonas de riesgo con filtros (HU09–HU12). */
export default function PaginaMapa() {
  const [tipos, setTipos] = useState([]);
  const [franjas, setFranjas] = useState([]);
  const [verCalor, setVerCalor] = useState(true);
  const [verPuntos, setVerPuntos] = useState(true);
  const [datos, setDatos] = useState({ incidentes: [], total: 0 });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const q = new URLSearchParams();
    if (tipos.length) q.set('tipos', tipos.join(','));
    if (franjas.length) q.set('franjas', franjas.join(','));
    setCargando(true);
    api(`/incidentes?${q}`)
      .then((r) => {
        setDatos(r);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [tipos, franjas]);

  const puntos = useMemo(() => puntosCalor(datos.incidentes), [datos]);
  const alternar = (lista, setLista, valor) =>
    setLista(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);

  return (
    <div className="layout-mapa">
      <aside className="panel-lateral">
        <h1>Zonas de riesgo en San Juan de Lurigancho</h1>
        <p className="sub">
          Incidentes reportados por vecinos y <strong>validados por serenazgo</strong>. Las zonas en rojo concentran
          más hechos delictivos.
        </p>

        <fieldset>
          <legend>Tipo de delito</legend>
          {Object.entries(TIPOS).map(([k, v]) => (
            <label key={k} className="check">
              <input type="checkbox" checked={tipos.includes(k)} onChange={() => alternar(tipos, setTipos, k)} />
              <span className="punto-color" style={{ background: COLORES_TIPO[k] }} />
              {v}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Franja horaria</legend>
          {Object.entries(FRANJAS).map(([k, v]) => (
            <label key={k} className="check">
              <input type="checkbox" checked={franjas.includes(k)} onChange={() => alternar(franjas, setFranjas, k)} />
              {v}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Capas</legend>
          <label className="check">
            <input type="checkbox" checked={verCalor} onChange={() => setVerCalor(!verCalor)} /> Mapa de calor
          </label>
          <label className="check">
            <input type="checkbox" checked={verPuntos} onChange={() => setVerPuntos(!verPuntos)} /> Incidentes
          </label>
        </fieldset>

        {(tipos.length > 0 || franjas.length > 0) && (
          <button
            className="btn secundario"
            onClick={() => {
              setTipos([]);
              setFranjas([]);
            }}
          >
            Limpiar filtros
          </button>
        )}

        <p className="contador" aria-live="polite">
          {cargando ? 'Cargando…' : `${datos.total} incidentes en el mapa`}
        </p>
        {!cargando && datos.total === 0 && franjas.length > 0 && (
          <Aviso>Sin incidentes registrados en este horario.</Aviso>
        )}
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
