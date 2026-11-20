import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Aviso, Estado } from '../components/Ui.jsx';
import { TIPOS, formatoFecha } from '../util.js';

/** Seguimiento de mis reportes (HU08). */
export default function PaginaMisReportes() {
  const [reportes, setReportes] = useState(null);
  const [error, setError] = useState('');

  const cargar = () =>
    api('/reportes/mios')
      .then((r) => setReportes(r.reportes))
      .catch((e) => setError(e.message));

  useEffect(() => {
    cargar();
  }, []);

  return (
    <section className="pagina">
      <div className="titulo-fila">
        <h1>Mis reportes</h1>
        <button className="btn secundario chico" onClick={cargar}>
          Actualizar
        </button>
      </div>
      <Aviso tipo="error">{error}</Aviso>
      {reportes === null && !error && <p className="cargando">Cargando…</p>}
      {reportes?.length === 0 && (
        <p className="vacio">
          Aún no has registrado reportes. <Link to="/reportar">Reportar un incidente</Link>
        </p>
      )}
      {reportes?.length > 0 && (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>N.°</th>
                <th>Tipo</th>
                <th>Fecha del hecho</th>
                <th>Zona</th>
                <th>Estado</th>
                <th>Última actualización</th>
                <th>Respuesta</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((r) => (
                <tr key={r.id}>
                  <td>{r.codigo}</td>
                  <td>
                    {TIPOS[r.tipo]}
                    {r.anonimo && <span className="etiqueta">anónimo</span>}
                  </td>
                  <td>{formatoFecha(r.fechaHora)}</td>
                  <td>{r.zona}</td>
                  <td>
                    <Estado estado={r.estado} />
                  </td>
                  <td>{formatoFecha(r.actualizadoEn)}</td>
                  <td className="nota">{r.nota || r.motivo || (r.unidad ? `Unidad asignada: ${r.unidad}` : '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
