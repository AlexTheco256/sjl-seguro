'use strict';

const path = require('node:path');
const { crearApp } = require('./app');
const { crearRepositorio, configuracion } = require('./config');

async function iniciar() {
  const cfg = configuracion();
  const repo = crearRepositorio();
  await repo.listo;
  const app = crearApp({
    repo,
    origenesCors: cfg.origenesCors,
    dirEstatico: cfg.dirEstatico || path.join(__dirname, '..', '..', 'frontend', 'dist'),
    version: cfg.version,
    commit: cfg.commit,
  });
  const servidor = app.listen(cfg.puerto, () => {
    console.log(`SJL Seguro API escuchando en el puerto ${cfg.puerto} (modo ${repo.modo})`);
  });
  const cerrar = () => servidor.close(() => process.exit(0));
  process.on('SIGTERM', cerrar);
  process.on('SIGINT', cerrar);
}

iniciar().catch((e) => {
  console.error('No se pudo iniciar el servidor:', e);
  process.exit(1);
});
