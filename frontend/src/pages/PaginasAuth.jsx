import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, erroresPorCampo } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Aviso, Campo } from '../components/Ui.jsx';
import { inicioPorRol } from '../util.js';

/** HU02 – Inicio de sesión. */
export function PaginaLogin() {
  const { iniciarSesion, modo } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const u = await iniciarSesion(form.email, form.password);
      navegar(ubicacion.state?.desde || inicioPorRol(u.rol), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="pagina estrecha tarjeta">
      <h1>Ingresar</h1>
      <form onSubmit={enviar}>
        <Campo etiqueta="Correo electrónico">
          <input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Campo>
        <Campo etiqueta="Contraseña">
          <input
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Campo>
        <Aviso tipo="error">{error}</Aviso>
        <button className="btn primario ancho" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <p className="enlaces">
        <Link to="/recuperar">¿Olvidaste tu contraseña?</Link> · <Link to="/registro">Crear cuenta</Link>
      </p>
      {modo === 'memoria' && (
        <Aviso>
          <strong>Modo demostración</strong> (datos ficticios). Cuentas de prueba:
          <br />
          admin@sjlseguro.pe / Admin2026! · serenazgo@sjlseguro.pe / Serenazgo2026! · vecino@sjlseguro.pe / Vecino2026!
        </Aviso>
      )}
    </section>
  );
}

/** HU01 – Registro de ciudadano. */
export function PaginaRegistro() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError('');
    setErrores({});
    try {
      await api('/auth/registro', { metodo: 'POST', cuerpo: form });
      await iniciarSesion(form.email, form.password);
      navegar('/', { replace: true });
    } catch (err) {
      setErrores(erroresPorCampo(err));
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };
  const cambiar = (c) => (e) => setForm({ ...form, [c]: e.target.value });

  return (
    <section className="pagina estrecha tarjeta">
      <h1>Crear cuenta</h1>
      <p className="sub">Regístrate para reportar incidentes y hacer seguimiento a tus reportes.</p>
      <form onSubmit={enviar}>
        <Campo etiqueta="Nombre" error={errores.nombre}>
          <input autoComplete="name" required value={form.nombre} onChange={cambiar('nombre')} />
        </Campo>
        <Campo etiqueta="Correo electrónico" error={errores.email}>
          <input type="email" autoComplete="email" required value={form.email} onChange={cambiar('email')} />
        </Campo>
        <Campo etiqueta="Contraseña" error={errores.password} ayuda="Mínimo 8 caracteres, con letras y números">
          <input type="password" autoComplete="new-password" required value={form.password} onChange={cambiar('password')} />
        </Campo>
        <Aviso tipo="error">{error}</Aviso>
        <button className="btn primario ancho" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="enlaces">
        ¿Ya tienes cuenta? <Link to="/login">Ingresar</Link>
      </p>
    </section>
  );
}

/** HU04 – Recuperar contraseña. */
export function PaginaRecuperar() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const r = await api('/auth/recuperar', { metodo: 'POST', cuerpo: { email } });
      setMensaje(r.mensaje);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="pagina estrecha tarjeta">
      <h1>Recuperar contraseña</h1>
      {mensaje ? (
        <Aviso tipo="exito">{mensaje}</Aviso>
      ) : (
        <form onSubmit={enviar}>
          <Campo etiqueta="Correo electrónico">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Campo>
          <Aviso tipo="error">{error}</Aviso>
          <button className="btn primario ancho">Enviar enlace</button>
        </form>
      )}
      <p className="enlaces">
        <Link to="/login">Volver a ingresar</Link>
      </p>
    </section>
  );
}
