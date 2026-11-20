import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, sesion } from './api.js';

const ContextoAuth = createContext(null);

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(Boolean(sesion.token()));
  const [modo, setModo] = useState(null);

  useEffect(() => {
    api('/health')
      .then((h) => setModo(h.modo))
      .catch(() => setModo(null));
    if (!sesion.token()) return;
    api('/auth/me')
      .then((r) => setUsuario(r.usuario))
      .catch(() => sesion.borrar())
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const expirar = () => setUsuario(null);
    window.addEventListener('sesion-expirada', expirar);
    return () => window.removeEventListener('sesion-expirada', expirar);
  }, []);

  const iniciarSesion = useCallback(async (email, password) => {
    const r = await api('/auth/login', { metodo: 'POST', cuerpo: { email, password } });
    sesion.guardar(r.token);
    setUsuario(r.usuario);
    return r.usuario;
  }, []);

  const cerrarSesion = useCallback(() => {
    sesion.borrar();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, modo, iniciarSesion, cerrarSesion }),
    [usuario, cargando, modo, iniciarSesion, cerrarSesion],
  );
  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

export const useAuth = () => useContext(ContextoAuth);
