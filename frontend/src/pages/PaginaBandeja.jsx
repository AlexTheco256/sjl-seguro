import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleMarker } from 'react-leaflet';
import { api } from '../api.js';
import { MapaBase } from '../components/Mapa.jsx';
import { Aviso, Campo, Estado } from '../components/Ui.jsx';
import { ESTADOS, TIPOS, accionesDisponibles, formatoFecha } from '../util.js';

const ETIQUETA_ACCION = {
  validado: 'Validar',
  descartado: 'Descartar',
};

function Detalle({ id, onCambio }) {
  const [det, setDet] = useState(null);
  const [accion, setAccion] = useState(null);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    api(`/serenazgo/reportes/${id}`)
      .then(setDet)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    setDet(null);
    setAccion(null);
    setError('');
    cargar();
  }, [cargar]);

  const aplicar = async (estado) => {
    const cuerpo = { estado };
    if (estado === 'descartado') cuerpo.motivo = texto;
    try {
      await api(`/serenazgo/reportes/${id}/estado`, { metodo: 'PATCH', cuerpo });
      setAccion(null);
      setTexto('');
      cargar();
      onCambio();
    } catch (e) {
      setError(e.detalles?.[0]?.mensaje || e.message);
    }
  };

  if (!det) return <div className="detalle">{error ? <Aviso tipo="error">{error}</Aviso> : 'Cargando…'}</div>;
  const r = det.reporte;
  const acciones = accionesDisponibles(r.estado).filter((a) => a === 'validado' || a === 'descartado');
  const pideTexto = { descartado: 'Motivo del descarte' };

  return (
    <div className="detalle">
      <div className="titulo-fila">
        <h2>
          {r.codigo} {r.critico && <span className="critico">CRÍTICO</span>}
        </h2>
        <Estado estado={r.estado} />
      </div>
      <dl className="datos">
        <dt>Tipo</dt>
        <dd>{TIPOS[r.tipo]}</dd>
        <dt>Fecha del hecho</dt>
        <dd>{formatoFecha(r.fechaHora)}</dd>
        <dt>Zona</dt>
        <dd>{r.zona}</dd>
        <dt>Reportado por</dt>
        <dd>{r.autor}</dd>
        <dt>Descripción</dt>
        <dd className="nota">{r.descripcion}</dd>
        {r.unidad && (
          <>
            <dt>Unidad</dt>
            <dd>{r.unidad}</dd>
          </>
        )}
        {(r.motivo || r.nota) && (
          <>
            <dt>{r.motivo ? 'Motivo' : 'Nota de cierre'}</dt>
            <dd>{r.motivo || r.nota}</dd>
          </>
        )}
      </dl>
      <MapaBase centro={[r.lat, r.lng]} zoom={16} alto="200px" key={r.id}>
        <CircleMarker center={[r.lat, r.lng]} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: '#dc2626', fillOpacity: 1 }} />
      </MapaBase>

      <Aviso tipo="error">{error}</Aviso>

      <h3>Historial</h3>
      {det.historial.length === 0 ? (
        <p className="vacio">Sin cambios de estado todavía.</p>
      ) : (
        <ol className="historial">
          {det.historial.map((h) => (
            <li key={h.id}>
              {formatoFecha(h.creadoEn)}: {ESTADOS[h.desde]} → <strong>{ESTADOS[h.hacia]}</strong>
              {h.nota && <em> — {h.nota}</em>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Bandeja de reportes para serenazgo (HU13–HU16). */
export default function PaginaBandeja() {
  const [filtro, setFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [sel, setSel] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    const q = new URLSearchParams({ pagina, porPagina: 20 });
    if (filtro) q.set('estado', filtro);
    api(`/serenazgo/reportes?${q}`)
      .then((r) => {
        setDatos(r);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [filtro, pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <section className="pagina ancha">
      <div className="titulo-fila">
        <h1>Bandeja de reportes</h1>
        <div className="filtros">
          <select
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPagina(1);
            }}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button className="btn secundario chico" onClick={cargar}>
            Actualizar
          </button>
        </div>
      </div>

      <Aviso tipo="error">{error}</Aviso>

      <div className="bandeja">
        <div className="lista">
          {datos?.items.length === 0 && <p className="vacio">No hay reportes con este filtro.</p>}
          {datos?.items.map((r) => (
            <button
              key={r.id}
              className={`item ${sel === r.id ? 'activo' : ''} ${r.critico && r.estado === 'recibido' ? 'item-critico' : ''}`}
              onClick={() => setSel(r.id)}
            >
              <span className="item-fila">
                <strong>{r.codigo}</strong>
                <Estado estado={r.estado} />
              </span>
              <span>{TIPOS[r.tipo]}</span>
              <small>
                {formatoFecha(r.fechaHora)} · {r.zona} · {r.autor}
              </small>
            </button>
          ))}
          {datos && datos.paginas > 1 && (
            <div className="paginacion">
              <button className="btn secundario chico" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
                ← Anterior
              </button>
              <span>
                Página {datos.pagina} de {datos.paginas} ({datos.total})
              </span>
              <button
                className="btn secundario chico"
                disabled={pagina >= datos.paginas}
                onClick={() => setPagina(pagina + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
        {sel ? <Detalle id={sel} onCambio={cargar} /> : <div className="detalle vacio">Selecciona un reporte para ver el detalle.</div>}
      </div>
    </section>
  );
}
