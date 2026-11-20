import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Aviso } from '../components/Ui.jsx';
import { formatoFecha } from '../util.js';

const ROLES = { ciudadano: 'Ciudadano', serenazgo: 'Serenazgo', administrador: 'Administrador' };

/** Gestión de usuarios y roles (HU19). */
export default function PaginaUsuarios() {
  const { usuario: yo } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = () =>
    api('/admin/usuarios')
      .then((r) => setUsuarios(r.usuarios))
      .catch((e) => setError(e.message));

  useEffect(() => {
    cargar();
  }, []);

  const actualizar = async (id, cambios) => {
    setError('');
    try {
      const r = await api(`/admin/usuarios/${id}`, { metodo: 'PATCH', cuerpo: cambios });
      setMensaje(`${r.usuario.nombre}: ${r.mensaje.toLowerCase()}`);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section className="pagina">
      <h1>Usuarios</h1>
      <Aviso tipo="exito">{mensaje}</Aviso>
      <Aviso tipo="error">{error}</Aviso>
      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const propio = u.id === yo?.id;
              return (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.rol}
                      disabled={propio}
                      onChange={(e) => actualizar(u.id, { rol: e.target.value })}
                      aria-label={`Rol de ${u.nombre}`}
                    >
                      {Object.entries(ROLES).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className={`btn chico ${u.activo ? 'secundario' : 'peligro'}`}
                      disabled={propio}
                      onClick={() => actualizar(u.id, { activo: !u.activo })}
                    >
                      {u.activo ? 'Activo · desactivar' : 'Inactivo · activar'}
                    </button>
                  </td>
                  <td>{formatoFecha(u.creadoEn)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
