import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { api } from './api.js';
import { PaginaRegistro } from './pages/PaginasAuth.jsx';

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
          <NavLink to="/registro">Crear cuenta</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/registro" element={<PaginaRegistro />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
