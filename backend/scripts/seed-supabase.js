'use strict';

/**
 * Carga datos de demostración en Supabase:
 *   - 3 cuentas (administrador, serenazgo, vecino) con contraseñas tomadas de variables de entorno
 *   - incidentes ficticios en zonas de riesgo de SJL (solo si la tabla está vacía)
 *
 * Uso: SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *      DEMO_ADMIN_PASSWORD=... DEMO_SERENAZGO_PASSWORD=... DEMO_VECINO_PASSWORD=... \
 *      npm run seed:supabase
 */
require('dotenv').config();
const { crearRepositorio } = require('../src/config');
const { generarIncidentes, usuariosDemo } = require('../src/data/semilla');

async function main() {
  const repo = crearRepositorio();
  if (repo.modo !== 'supabase') {
    throw new Error('Configura SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY');
  }
  for (const v of ['DEMO_ADMIN_PASSWORD', 'DEMO_SERENAZGO_PASSWORD', 'DEMO_VECINO_PASSWORD']) {
    if (!process.env[v]) throw new Error(`Falta la variable ${v}`);
  }

  const existentes = await repo.listarUsuarios();
  let vecino = null;
  for (const u of usuariosDemo()) {
    let perfil = existentes.find((x) => x.email === u.email);
    if (!perfil) {
      perfil = await repo.registrar(u);
      console.log(`Usuario creado: ${u.email}`);
    }
    if (perfil.rol !== u.rol) await repo.actualizarUsuario(perfil.id, { rol: u.rol });
    if (u.rol === 'ciudadano') vecino = perfil;
  }

  const reportes = await repo.listarReportes();
  if (reportes.length > 0) {
    console.log(`La tabla reportes ya tiene ${reportes.length} registros; no se insertan incidentes.`);
    return;
  }
  const incidentes = generarIncidentes();
  for (const inc of incidentes) {
    await repo.crearReporte({ ...inc, usuarioId: inc.anonimo ? null : vecino.id });
  }
  console.log(`Insertados ${incidentes.length} incidentes de demostración.`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
