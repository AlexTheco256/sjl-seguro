import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, erroresPorCampo } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Aviso, Campo } from '../components/Ui.jsx';
import { inicioPorRol } from '../util.js';

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
