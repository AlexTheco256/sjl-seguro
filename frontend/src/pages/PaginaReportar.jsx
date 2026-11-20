import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleMarker, useMapEvents } from 'react-leaflet';
import { api, erroresPorCampo } from '../api.js';
import { useAuth } from '../auth.jsx';
import { MapaBase } from '../components/Mapa.jsx';
import { Aviso, Campo } from '../components/Ui.jsx';
import { TIPOS, ahoraLocalInput, dentroDeSJL, localLimaAIso, validarFormularioReporte } from '../util.js';

function SelectorPunto({ onSeleccion }) {
  useMapEvents({ click: (e) => onSeleccion([e.latlng.lat, e.latlng.lng]) });
  return null;
}

/** Formulario de reporte ciudadano (HU05–HU07). */
export default function PaginaReportar() {
  const { usuario } = useAuth();
  const [form, setForm] = useState({ tipo: '', descripcion: '', fechaHora: ahoraLocalInput(), anonimo: false });
  const [punto, setPunto] = useState(null);
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState({ enviando: false, exito: null, error: '' });
  const anonimo = false;

  const cambiar = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    const datos = { ...form, lat: punto?.[0], lng: punto?.[1] };
    const errs = validarFormularioReporte(datos);
    setErrores(errs);
    if (Object.keys(errs).length) return;
    setEstado({ enviando: true, exito: null, error: '' });
    try {
      const r = await api('/reportes', {
        metodo: 'POST',
        cuerpo: {
          tipo: form.tipo,
          descripcion: form.descripcion,
          lat: punto[0],
          lng: punto[1],
          fechaHora: localLimaAIso(form.fechaHora),
          anonimo,
        },
      });
      setEstado({ enviando: false, exito: r.reporte, error: '' });
      setForm({ tipo: '', descripcion: '', fechaHora: ahoraLocalInput(), anonimo: false });
      setPunto(null);
    } catch (err) {
      setErrores(erroresPorCampo(err));
      setEstado({ enviando: false, exito: null, error: err.message });
    }
  };

  if (estado.exito) {
    return (
      <section className="pagina estrecha">
        <Aviso tipo="exito">
          <h2>¡Reporte enviado!</h2>
          <p>
            Tu número de reporte es <strong>{estado.exito.codigo}</strong>. Serenazgo lo revisará y, si se valida,
            aparecerá en el mapa de riesgo.
          </p>
        </Aviso>
        <div className="acciones">
          <button className="btn primario" onClick={() => setEstado({ enviando: false, exito: null, error: '' })}>
            Registrar otro reporte
          </button>
          {usuario && (
            <Link to="/mis-reportes" className="btn secundario">
              Ver mis reportes
            </Link>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="pagina">
      <h1>Reportar un incidente</h1>
      <p className="sub">Tu reporte llega directamente a serenazgo. En caso de emergencia llama al 105 (PNP).</p>
      <form className="form-reporte" onSubmit={enviar} noValidate>
        <div className="col">
          <Campo etiqueta="Tipo de incidente" error={errores.tipo}>
            <select value={form.tipo} onChange={cambiar('tipo')} required>
              <option value="">Selecciona…</option>
              {Object.entries(TIPOS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Fecha y hora del hecho" error={errores.fechaHora}>
            <input type="datetime-local" value={form.fechaHora} max={ahoraLocalInput()} onChange={cambiar('fechaHora')} />
          </Campo>
          <Campo
            etiqueta="¿Qué ocurrió?"
            error={errores.descripcion}
            ayuda={`${form.descripcion.length}/1000 caracteres`}
          >
            <textarea
              rows={5}
              maxLength={1000}
              value={form.descripcion}
              onChange={cambiar('descripcion')}
              placeholder="Ej.: Dos sujetos en moto robaron un celular en el paradero de la av. Próceres."
            />
          </Campo>
          {!usuario && (
            <Aviso tipo="error">
              Debes <Link to="/login">iniciar sesión</Link> para enviar un reporte.
            </Aviso>
          )}
          <Aviso tipo="error">{estado.error}</Aviso>
          <button className="btn primario" disabled={estado.enviando}>
            {estado.enviando ? 'Enviando…' : 'Enviar reporte'}
          </button>
        </div>

        <div className="col">
          <div className="fila-mapa">
            <span className="campo-etiqueta">Ubicación: haz clic en el mapa</span>
          </div>
          <div className={`mapa-selector ${errores.ubicacion ? 'campo-error' : ''}`}>
            <MapaBase zoom={13} alto="380px">
              <SelectorPunto onSeleccion={(p) => { setPunto(p); setErrores({ ...errores, ubicacion: undefined }); }} />
              {punto && (
                <CircleMarker center={punto} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: '#dc2626', fillOpacity: 1 }} />
              )}
            </MapaBase>
          </div>
          {errores.ubicacion && <small className="campo-msg">{errores.ubicacion}</small>}
          {punto && (
            <small className="campo-ayuda">
              Lat {punto[0].toFixed(5)}, Lng {punto[1].toFixed(5)}
            </small>
          )}
        </div>
      </form>
    </section>
  );
}
