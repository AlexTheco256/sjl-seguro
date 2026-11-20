'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { asincrono } = require('./util');
const { requerirSesion } = require('../middleware/auth');
const { sanitizarTexto } = require('../domain/texto');

const esquemaRegistro = z.object({
  nombre: z
    .string({ error: 'El nombre es obligatorio' })
    .transform(sanitizarTexto)
    .pipe(z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(80)),
  email: z.string({ error: 'El correo es obligatorio' }).trim().toLowerCase().pipe(z.email('Correo no válido')),
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede superar los 72 caracteres')
    .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
    .regex(/\d/, 'La contraseña debe incluir al menos un número'),
});

const esquemaLogin = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Correo no válido')),
  password: z.string().min(1, 'La contraseña es obligatoria').max(72),
});

const esquemaRecuperar = z.object({ email: z.string().trim().toLowerCase().pipe(z.email('Correo no válido')) });

module.exports = function rutasAuth(repo, { limites = true } = {}) {
  const r = express.Router();
  // Limita intentos de fuerza bruta sobre credenciales.
  const limiteCredenciales = limites
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 20,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { error: 'Demasiados intentos. Intenta nuevamente en unos minutos.' },
      })
    : (_q, _s, n) => n();

  // HU01 – Registro de ciudadano
  r.post(
    '/registro',
    limiteCredenciales,
    asincrono(async (req, res) => {
      const datos = esquemaRegistro.parse(req.body);
      const usuario = await repo.registrar(datos);
      res.status(201).json({ mensaje: 'Cuenta creada correctamente', usuario });
    }),
  );

  // HU02 – Inicio de sesión
  r.post(
    '/login',
    limiteCredenciales,
    asincrono(async (req, res) => {
      const { email, password } = esquemaLogin.parse(req.body);
      res.json(await repo.iniciarSesion(email, password));
    }),
  );

  r.get('/me', requerirSesion, (req, res) => res.json({ usuario: req.usuario }));

  // HU04 – Recuperar contraseña (respuesta idéntica exista o no la cuenta)
  r.post(
    '/recuperar',
    limiteCredenciales,
    asincrono(async (req, res) => {
      const { email } = esquemaRecuperar.parse(req.body);
      await repo.solicitarRecuperacion(email);
      res.json({
        mensaje: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña (válido por 1 hora).',
      });
    }),
  );

  return r;
};
