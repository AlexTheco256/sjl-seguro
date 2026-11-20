import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { api } from './api.js';
import PaginaMapa from './pages/PaginaMapa.jsx';
import PaginaReportar from './pages/PaginaReportar.jsx';
import { PaginaLogin, PaginaRegistro } from './pages/PaginasAuth.jsx';
import PaginaBandeja from './pages/PaginaBandeja.jsx';

function RutaProtegida({ roles, children }) {
  const { usuario, cargando } = useAuth();
  const ubicacion = useLocation();
  if (cargando) return <p className="cargando">Cargando…</p>;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  if (roles && !roles.includes(usuario.rol)) {
    return (
      <section className="pagina estrecha">
        <h1>Acceso denegado</h1>
        <p>Tu rol no tiene permiso para ver esta sección.</p>
      </section>
    );
  }
  return children;
}

export default function App() {
  const { usuario, cerrarSesion } = useAuth();
  const [menu, setMenu] = useState(false);
  const ubicacion = useLocation();
  const esStaff = usuario && ['serenazgo', 'administrador'].includes(usuario.rol);

  useEffect(() => setMenu(false), [ubicacion.pathname]);

  return (
    <div className="app">
      <header className="cabecera">
        <NavLink to="/" className="marca">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <span>
            SJL <strong>Seguro</strong>
          </span>
        </NavLink>
        <button className="menu-btn" aria-expanded={menu} aria-label="Abrir menú" onClick={() => setMenu(!menu)}>
          ☰
        </button>
        <nav className={`nav ${menu ? 'abierto' : ''}`}>
          <NavLink to="/" end>
            Mapa de riesgo
          </NavLink>
          <NavLink to="/reportar">Reportar</NavLink>
          {esStaff && (
            <NavLink to="/serenazgo">
              Bandeja
            </NavLink>
          )}
          {usuario ? (
            <button className="enlace" onClick={cerrarSesion}>
              Salir ({usuario.nombre.split(' ')[0]})
            </button>
          ) : (
            <NavLink to="/login">Ingresar</NavLink>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<PaginaMapa />} />
          <Route path="/reportar" element={<PaginaReportar />} />
          <Route path="/login" element={<PaginaLogin />} />
          <Route path="/registro" element={<PaginaRegistro />} />
          <Route
            path="/serenazgo"
            element={
              <RutaProtegida roles={['serenazgo', 'administrador']}>
                <PaginaBandeja />
              </RutaProtegida>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
