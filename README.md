# SJL Seguro

Plataforma web de **reportes ciudadanos y mapa de zonas de riesgo** para San Juan de Lurigancho (Lima, Perú).
Los vecinos reportan robos, asaltos en transporte, extorsiones y venta de drogas; el serenazgo valida y atiende
los reportes, y la municipalidad ve en un panel qué zonas y horarios concentran la delincuencia.

| Recurso | Enlace |
|---|---|
| Aplicación desplegada | _se completa al desplegar en Render_ |
| Proyecto Jira (backlog y sprints) | https://axel27136.atlassian.net/jira/software/projects/P2/boards/34/backlog |
| Pipeline CI/CD | pestaña **Actions** de este repositorio |

**Autor:** Axel Hassan Cordova Gonzales (2210489)

## Funcionalidades (historias de usuario)

| Épica | Historias |
|---|---|
| EP1 Gestión de usuarios y seguridad | HU01 registro · HU02 login JWT · HU03 roles · HU04 recuperar contraseña |
| EP2 Reporte ciudadano | HU05 registrar reporte · HU06 ubicación en mapa/GPS · HU07 reporte anónimo · HU08 mis reportes |
| EP3 Mapa de zonas de riesgo | HU09 mapa de incidentes · HU10 mapa de calor · HU11 filtro por tipo · HU12 filtro por horario |
| EP4 Atención por serenazgo | HU13 bandeja · HU14 validar/descartar · HU15 estado de atención · HU16 alertas críticas |
| EP5 Estadísticas y administración | HU17 panel de indicadores · HU18 ranking de zonas · HU19 usuarios y roles · HU20 exportar CSV |

## Arquitectura

```
Navegador (React + Leaflet)  ──HTTPS──▶  API REST Express (Node 22)  ──▶  Supabase
   mapa, reportes, bandeja,              helmet, rate limit, zod,          PostgreSQL (RLS)
   panel, usuarios                       roles, auditoría                  Supabase Auth (JWT)
                                                │
                     OpenStreetMap (teselas) ◀──┘  Render (contenedor Docker)
```

- `frontend/`: React 18, Vite, React Router y Leaflet con `leaflet.heat` (mapa de calor).
- `backend/`: API Express con dos repositorios intercambiables: **Supabase** en producción o
  **memoria** (modo demostración y pruebas) cuando no hay credenciales.
- `supabase/migrations/`: esquema SQL con RLS activado y sin acceso directo desde el navegador.
- `Dockerfile`: imagen única (frontend compilado + API) que corre sin privilegios de root.

## Ramas y flujo de trabajo

- `main`: producción. Solo recibe cambios por **Pull Request** desde `test`, y cada push dispara el despliegue.
- `test`: integración y pruebas. Cada historia de usuario es un commit con su clave de Jira (`P2-n`).

## Pipeline CI/CD (GitHub Actions)

| Etapa | Herramienta | Bloquea si… |
|---|---|---|
| Build y pruebas | Jest + Supertest (API), Vitest (web), Vite build | falla una prueba o la cobertura baja de 80 % |
| SAST | CodeQL `security-extended` | hay alertas de seguridad en el código |
| SCA | `npm audit`, Dependency Review, Dependabot | hay dependencias con vulnerabilidad alta o crítica |
| Secretos | Gitleaks (todo el historial) | se detecta una credencial |
| Contenedor | Docker build, Trivy (imagen y Dockerfile), smoke test | hay vulnerabilidades HIGH/CRITICAL o la app no responde |
| Deploy | Render Deploy Hook (solo `main`) | `/api/health` no responde con el commit nuevo |
| DAST | OWASP ZAP baseline sobre la URL pública | informativo |

## Ejecutar en local

```bash
cd backend && npm install && npm start          # API en http://localhost:3000 (modo demo)
cd frontend && npm install && npm run dev       # Web en http://localhost:5173
```

Cuentas del modo demostración: `admin@sjlseguro.pe / Admin2026!`, `serenazgo@sjlseguro.pe / Serenazgo2026!`,
`vecino@sjlseguro.pe / Vecino2026!` (solo en memoria, con datos ficticios).

Pruebas: `npm test` dentro de `backend/` y de `frontend/`.

## Configurar Supabase y Render

1. Crear un proyecto en Supabase y ejecutar `supabase/migrations/20261001000000_esquema_inicial.sql` en el SQL Editor.
2. En Render: **New → Blueprint** con este repositorio (lee `render.yaml`) y cargar `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `PUBLIC_URL` en *Environment*.
3. Copiar el **Deploy Hook** de Render en el secreto `RENDER_DEPLOY_HOOK_URL` de GitHub y la URL pública en
   la variable `RENDER_URL` (Settings → Secrets and variables → Actions).
4. (Opcional) Cargar datos de demostración: `npm run seed:supabase` en `backend/` (ver `.env.example`).
