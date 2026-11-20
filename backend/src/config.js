'use strict';

require('dotenv').config();
const { RepositorioMemoria } = require('./data/memoria');
const { RepositorioSupabase } = require('./data/supabase');

/**
 * Elige el repositorio según las variables de entorno:
 * - Con SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY → Supabase.
 * - Sin ellas → modo demostración en memoria con datos de ejemplo.
 */
function crearRepositorio(env = process.env) {
  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY) {
    return new RepositorioSupabase({
      url: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      redirectRecuperacion: env.PUBLIC_URL ? `${env.PUBLIC_URL}/restablecer` : undefined,
    });
  }
  return new RepositorioMemoria({ jwtSecret: env.JWT_SECRET, semilla: env.DEMO_SEED !== 'false', env });
}

function configuracion(env = process.env) {
  return {
    puerto: Number(env.PORT) || 3000,
    origenesCors: (env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
    dirEstatico: env.STATIC_DIR,
    version: env.APP_VERSION || require('../package.json').version,
    commit: env.RENDER_GIT_COMMIT || env.GIT_COMMIT || 'local',
  };
}

module.exports = { crearRepositorio, configuracion };
