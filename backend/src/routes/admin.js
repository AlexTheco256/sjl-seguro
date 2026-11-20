'use strict';

const express = require('express');
const { z } = require('zod');
const { asincrono } = require('./util');
const { requerirRol } = require('../middleware/auth');
const { ROLES } = require('../domain/constantes');
const { ErrorApp } = require('../errores');

const esquemaUsuario = z
  .object({
    rol: z.enum(ROLES, { error: 'Rol no válido' }).optional(),
    activo: z.boolean().optional(),
  })
  .strict()
  .refine((c) => c.rol !== undefined || c.activo !== undefined, 'No hay cambios que aplicar');

/** Gestión de usuarios y roles (HU19). */
module.exports = function rutasAdmin(repo) {
  const r = express.Router();
  r.use(requerirRol('administrador'));

  r.get(
    '/usuarios',
    asincrono(async (_req, res) => {
      const usuarios = await repo.listarUsuarios();
      res.json({ total: usuarios.length, usuarios });
    }),
  );

  r.patch(
    '/usuarios/:id',
    asincrono(async (req, res) => {
      const cambios = esquemaUsuario.parse(req.body);
      if (req.params.id === req.usuario.id) {
        throw new ErrorApp(400, 'No puedes cambiar tu propio rol ni desactivar tu cuenta');
      }
      const usuario = await repo.actualizarUsuario(req.params.id, cambios);
      if (!usuario) throw new ErrorApp(404, 'Usuario no encontrado');
      res.json({ mensaje: 'Usuario actualizado', usuario });
    }),
  );

  return r;
};
