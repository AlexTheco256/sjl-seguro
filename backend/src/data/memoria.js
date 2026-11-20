'use strict';

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ErrorApp } = require('../errores');

const BCRYPT_ROUNDS = 10;

/**
 * Repositorio en memoria. Se usa en las pruebas automatizadas y como modo
 * demostración cuando no hay credenciales de Supabase configuradas.
 * Implementa la misma interfaz que el repositorio de Supabase.
 */
class RepositorioMemoria {
  constructor({ jwtSecret, semilla = false, env = process.env } = {}) {
    this.modo = 'memoria';
    this.jwtSecret = jwtSecret || crypto.randomBytes(32).toString('hex');
    this.usuarios = new Map();
    this.reportes = new Map();
    this.historial = [];
    this.secuencia = 0;
    this.listo = semilla ? this.sembrar(env) : Promise.resolve();
  }

  async sembrar(env) {
    // Carga diferida: los datos de demostración solo se usan en modo demo.
    const { generarIncidentes, usuariosDemo } = require('./semilla');
    for (const u of usuariosDemo(env)) {
      const perfil = await this.registrar(u);
      this.usuarios.get(perfil.id).rol = u.rol;
    }
    const vecino = [...this.usuarios.values()].find((u) => u.rol === 'ciudadano');
    for (const inc of generarIncidentes()) {
      await this.crearReporte({ ...inc, usuarioId: inc.anonimo ? null : vecino.id });
    }
  }

  // ------------------------------------------------------------- usuarios
  static perfil(u) {
    if (!u) return null;
    const { hash, ...perfil } = u; // nunca exponer el hash
    return perfil;
  }

  async registrar({ nombre, email, password }) {
    const correo = email.toLowerCase();
    if ([...this.usuarios.values()].some((u) => u.email === correo)) {
      throw new ErrorApp(409, 'El correo ya está en uso');
    }
    const u = {
      id: crypto.randomUUID(),
      nombre,
      email: correo,
      rol: 'ciudadano',
      activo: true,
      creadoEn: new Date().toISOString(),
      hash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    };
    this.usuarios.set(u.id, u);
    return RepositorioMemoria.perfil(u);
  }

  async iniciarSesion(email, password) {
    const u = [...this.usuarios.values()].find((x) => x.email === String(email).toLowerCase());
    const ok = u && (await bcrypt.compare(password, u.hash));
    if (!ok) throw new ErrorApp(401, 'Credenciales inválidas');
    if (!u.activo) throw new ErrorApp(403, 'Tu cuenta está desactivada');
    const token = jwt.sign({ sub: u.id, rol: u.rol }, this.jwtSecret, {
      expiresIn: '8h',
      algorithm: 'HS256',
    });
    return { token, usuario: RepositorioMemoria.perfil(u) };
  }

  async verificarToken(token) {
    try {
      const { sub } = jwt.verify(token, this.jwtSecret, { algorithms: ['HS256'] });
      return RepositorioMemoria.perfil(this.usuarios.get(sub));
    } catch {
      return null;
    }
  }

  async solicitarRecuperacion() {
    // En modo memoria no se envían correos; la respuesta es la misma exista o no la cuenta.
  }

  async listarUsuarios() {
    return [...this.usuarios.values()]
      .map(RepositorioMemoria.perfil)
      .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
  }

  async obtenerUsuario(id) {
    return RepositorioMemoria.perfil(this.usuarios.get(id));
  }

  async actualizarUsuario(id, cambios) {
    const u = this.usuarios.get(id);
    if (!u) return null;
    Object.assign(u, cambios);
    return RepositorioMemoria.perfil(u);
  }

  // ------------------------------------------------------------- reportes
  async crearReporte(datos) {
    this.secuencia += 1;
    const ahora = new Date().toISOString();
    const r = {
      id: crypto.randomUUID(),
      codigo: `SJL-${String(this.secuencia).padStart(6, '0')}`,
      estado: 'recibido',
      motivo: null,
      nota: null,
      unidad: null,
      atendidoEn: null,
      creadoEn: ahora,
      ...datos,
      actualizadoEn: datos.creadoEn || ahora,
    };
    this.reportes.set(r.id, r);
    return { ...r };
  }

  async listarReportes({ estados, usuarioId } = {}) {
    return [...this.reportes.values()]
      .filter((r) => !estados || estados.includes(r.estado))
      .filter((r) => !usuarioId || r.usuarioId === usuarioId)
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
      .map((r) => ({ ...r }));
  }

  async obtenerReporte(id) {
    const r = this.reportes.get(id);
    return r ? { ...r } : null;
  }

  async actualizarReporte(id, cambios) {
    const r = this.reportes.get(id);
    if (!r) return null;
    Object.assign(r, cambios, { actualizadoEn: new Date().toISOString() });
    return { ...r };
  }

  async registrarHistorial(entrada) {
    this.historial.push({ id: this.historial.length + 1, creadoEn: new Date().toISOString(), ...entrada });
  }

  async listarHistorial(reporteId) {
    return this.historial.filter((h) => h.reporteId === reporteId);
  }
}

module.exports = { RepositorioMemoria };
