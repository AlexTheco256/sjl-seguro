import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { api } from './api.js';
import PaginaMapa from './pages/PaginaMapa.jsx';
import PaginaReportar from './pages/PaginaReportar.jsx';
import PaginaMisReportes from './pages/PaginaMisReportes.jsx';
import { PaginaLogin, PaginaRegistro, PaginaRecuperar } from './pages/PaginasAuth.jsx';
import PaginaBandeja from './pages/PaginaBandeja.jsx';
import PaginaPanel from './pages/PaginaPanel.jsx';
import PaginaUsuarios from './pages/PaginaUsuarios.jsx';
import { etiquetaBotonTema, guardarTema, leerTemaGuardado, siguienteTema, temaInicial } from './tema.js';

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

/** Tema claro/oscuro con preferencia guardada (HU21). */
function useTema() {
  const [tema, setTema] = useState(() =>
    temaInicial(leerTemaGuardado(), window.matchMedia?.('(prefers-color-scheme: dark)').matches),
  );
  useEffect(() => {
    document.documentElement.dataset.theme = tema;
  }, [tema]);
  const alternar = () => {
    const nuevo = siguienteTema(tema);
    guardarTema(nuevo);
    setTema(nuevo);
  };
  return [tema, alternar];
}

/** Contador de alertas críticas para el menú de serenazgo (HU16). */
function useAlertas(activo) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    if (!activo) return undefined;
    let vivo = true;
    const consultar = () =>
      api('/serenazgo/alertas')
        .then((r) => vivo && setTotal(r.total))
        .catch(() => {});
    consultar();
    const id = setInterval(consultar, 15000);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [activo]);
  return total;
}

export default function App() {
  const { usuario, cerrarSesion } = useAuth();
  const [menu, setMenu] = useState(false);
  const ubicacion = useLocation();
  const esStaff = usuario && ['serenazgo', 'administrador'].includes(usuario.rol);
  const alertas = useAlertas(esStaff);
  const [tema, alternarTema] = useTema();

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
        <button
          className="tema-btn"
          onClick={alternarTema}
          aria-label={etiquetaBotonTema(tema)}
          title={etiquetaBotonTema(tema)}
        >
          {tema === 'oscuro' ? '☀️' : '🌙'}
        </button>
        <button className="menu-btn" aria-expanded={menu} aria-label="Abrir menú" onClick={() => setMenu(!menu)}>
          ☰
        </button>
        <nav className={`nav ${menu ? 'abierto' : ''}`}>
          <NavLink to="/" end>
            Mapa de riesgo
          </NavLink>
          <NavLink to="/reportar">Reportar</NavLink>
          {usuario && <NavLink to="/mis-reportes">Mis reportes</NavLink>}
          {esStaff && (
            <NavLink to="/serenazgo">
              Bandeja {alertas > 0 && <span className="insignia" title="Reportes críticos sin atender">{alertas}</span>}
            </NavLink>
          )}
          {esStaff && <NavLink to="/panel">Panel</NavLink>}
          {usuario?.rol === 'administrador' && <NavLink to="/usuarios">Usuarios</NavLink>}
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
          <Route path="/recuperar" element={<PaginaRecuperar />} />
          <Route
            path="/mis-reportes"
            element={
              <RutaProtegida>
                <PaginaMisReportes />
              </RutaProtegida>
            }
          />
          <Route
            path="/serenazgo"
            element={
              <RutaProtegida roles={['serenazgo', 'administrador']}>
                <PaginaBandeja />
              </RutaProtegida>
            }
          />
          <Route
            path="/panel"
            element={
              <RutaProtegida roles={['serenazgo', 'administrador']}>
                <PaginaPanel />
              </RutaProtegida>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RutaProtegida roles={['administrador']}>
                <PaginaUsuarios />
              </RutaProtegida>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
