# Política de seguridad

## Controles implementados

| Capa | Control |
|---|---|
| Código | SAST con CodeQL (`security-extended`) en cada push y PR |
| Dependencias | `npm audit --audit-level=high`, Dependency Review en PR y Dependabot semanal |
| Secretos | Gitleaks sobre todo el historial; credenciales solo en GitHub Secrets y en Render |
| Contenedor | Imagen Alpine actualizada, sin npm/yarn, usuario no root, escaneo Trivy HIGH/CRITICAL |
| API | Helmet (CSP, HSTS, X-Frame-Options), rate limiting, validación con zod, sanitización XSS, CSV injection |
| Autenticación | Supabase Auth (JWT), roles ciudadano/serenazgo/administrador, mensajes de error genéricos |
| Datos | RLS activado en Supabase, sin políticas públicas; reportes anónimos sin datos del autor |
| Ejecución | DAST con OWASP ZAP baseline tras cada despliegue |

## Reportar una vulnerabilidad

Abre un *issue* privado (Security advisory) en este repositorio. No publiques detalles hasta que se corrija.
