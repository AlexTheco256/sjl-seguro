'use strict';

const { createClient } = require('@supabase/supabase-js');
const { ErrorApp } = require('../errores');

const OPCIONES = { auth: { persistSession: false, autoRefreshToken: false } };

const aPerfil = (p) =>
  p && {
    id: p.id,
    nombre: p.nombre,
    email: p.email,
    rol: p.rol,
    activo: p.activo,
    creadoEn: p.creado_en,
  };

const aReporte = (r) =>
  r && {
    id: r.id,
    codigo: r.codigo,
    tipo: r.tipo,
    descripcion: r.descripcion,
    lat: Number(r.lat),
    lng: Number(r.lng),
    fechaHora: r.fecha_hora,
    anonimo: r.anonimo,
    usuarioId: r.usuario_id,
    estado: r.estado,
    zona: r.zona,
    motivo: r.motivo,
    nota: r.nota,
    unidad: r.unidad,
    atendidoEn: r.atendido_en,
    creadoEn: r.creado_en,
    actualizadoEn: r.actualizado_en,
  };

const COLUMNAS = {
  tipo: 'tipo',
  descripcion: 'descripcion',
  lat: 'lat',
  lng: 'lng',
  fechaHora: 'fecha_hora',
  anonimo: 'anonimo',
  usuarioId: 'usuario_id',
  estado: 'estado',
  zona: 'zona',
  motivo: 'motivo',
  nota: 'nota',
  unidad: 'unidad',
  atendidoEn: 'atendido_en',
  creadoEn: 'creado_en',
};

function aFila(obj) {
  const fila = {};
  for (const [k, v] of Object.entries(obj)) {
    if (COLUMNAS[k] && v !== undefined) fila[COLUMNAS[k]] = v;
  }
  return fila;
}

function verificar({ data, error }, mensaje = 'Error de base de datos') {
  if (error) {
    // El detalle va al log del servidor; el cliente recibe un mensaje genérico.
    console.error(`[supabase] ${mensaje}:`, error.message);
    throw new ErrorApp(500, mensaje);
  }
  return data;
}

/**
 * Repositorio sobre Supabase (PostgreSQL + Supabase Auth).
 * La API usa la service role key en el servidor; la base tiene RLS activado
 * y sin políticas públicas, de modo que nadie accede directamente desde el navegador.
 */
class RepositorioSupabase {
  constructor({ url, anonKey, serviceRoleKey, redirectRecuperacion }) {
    this.modo = 'supabase';
    this.url = url;
    this.anonKey = anonKey;
    this.redirectRecuperacion = redirectRecuperacion;
    this.db = createClient(url, serviceRoleKey, OPCIONES);
    this.listo = Promise.resolve();
  }

  async registrar({ nombre, email, password }) {
    const { data, error } = await this.db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre },
    });
    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        throw new ErrorApp(409, 'El correo ya está en uso');
      }
      if (/password/i.test(error.message)) throw new ErrorApp(400, 'La contraseña no cumple los requisitos');
      verificar({ error }, 'No se pudo registrar el usuario');
    }
    const perfil = verificar(
      await this.db
        .from('perfiles')
        .upsert({ id: data.user.id, nombre, email: email.toLowerCase(), rol: 'ciudadano' })
        .select()
        .single(),
      'No se pudo crear el perfil',
    );
    return aPerfil(perfil);
  }

  async iniciarSesion(email, password) {
    const cliente = createClient(this.url, this.anonKey, OPCIONES);
    const { data, error } = await cliente.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new ErrorApp(401, 'Credenciales inválidas');
    const usuario = await this.obtenerUsuario(data.user.id);
    if (!usuario) throw new ErrorApp(401, 'Credenciales inválidas');
    if (!usuario.activo) throw new ErrorApp(403, 'Tu cuenta está desactivada');
    return { token: data.session.access_token, usuario };
  }

  async verificarToken(token) {
    const { data, error } = await this.db.auth.getUser(token);
    if (error || !data?.user) return null;
    return this.obtenerUsuario(data.user.id);
  }

  async solicitarRecuperacion(email) {
    const cliente = createClient(this.url, this.anonKey, OPCIONES);
    await cliente.auth.resetPasswordForEmail(email, { redirectTo: this.redirectRecuperacion });
  }

  async listarUsuarios() {
    const data = verificar(await this.db.from('perfiles').select('*').order('creado_en'));
    return data.map(aPerfil);
  }

  async obtenerUsuario(id) {
    const data = verificar(await this.db.from('perfiles').select('*').eq('id', id).maybeSingle());
    return aPerfil(data);
  }

  async actualizarUsuario(id, cambios) {
    const data = verificar(
      await this.db.from('perfiles').update(cambios).eq('id', id).select().maybeSingle(),
    );
    if (data && cambios.activo === false) {
      // Revoca las sesiones abiertas del usuario desactivado.
      await this.db.auth.admin.updateUserById(id, { ban_duration: '876000h' });
    } else if (data && cambios.activo === true) {
      await this.db.auth.admin.updateUserById(id, { ban_duration: 'none' });
    }
    return aPerfil(data);
  }

  async crearReporte(datos) {
    const data = verificar(await this.db.from('reportes').insert(aFila(datos)).select().single());
    return aReporte(data);
  }

  async listarReportes({ estados, usuarioId } = {}) {
    let q = this.db.from('reportes').select('*').order('creado_en', { ascending: false }).limit(5000);
    if (estados) q = q.in('estado', estados);
    if (usuarioId) q = q.eq('usuario_id', usuarioId);
    return verificar(await q).map(aReporte);
  }

  async obtenerReporte(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    return aReporte(verificar(await this.db.from('reportes').select('*').eq('id', id).maybeSingle()));
  }

  async actualizarReporte(id, cambios) {
    const fila = { ...aFila(cambios), actualizado_en: new Date().toISOString() };
    return aReporte(
      verificar(await this.db.from('reportes').update(fila).eq('id', id).select().maybeSingle()),
    );
  }

  async registrarHistorial({ reporteId, usuarioId, desde, hacia, nota }) {
    verificar(
      await this.db
        .from('historial_reportes')
        .insert({ reporte_id: reporteId, usuario_id: usuarioId, desde, hacia, nota }),
    );
  }

  async listarHistorial(reporteId) {
    const data = verificar(
      await this.db.from('historial_reportes').select('*').eq('reporte_id', reporteId).order('creado_en'),
    );
    return data.map((h) => ({
      id: h.id,
      reporteId: h.reporte_id,
      usuarioId: h.usuario_id,
      desde: h.desde,
      hacia: h.hacia,
      nota: h.nota,
      creadoEn: h.creado_en,
    }));
  }
}

module.exports = { RepositorioSupabase, aFila, aReporte, aPerfil };
