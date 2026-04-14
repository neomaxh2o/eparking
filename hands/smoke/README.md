# Smoke tests — hands/smoke/

Propósito
--------
Carpeta con scripts de smoke no destructivos para validar rápidamente que la aplicación eparking está operativa en un entorno (dev/staging). Sirven para validaciones antes y después de cambios críticos (por ejemplo: rotación de secretos).

Scripts
-------
- check_app_up.sh
  - Verifica que la URL base devuelva HTTP 200.

- check_api_health.sh
  - Llama a `/api/health` (o a HEALTH_ENDPOINT configurado) y valida respuesta 2xx.

- check_db_connection.sh
  - Ejecuta una comprobación indirecta de DB llamando `/api/health/db` (si existe) o fallback a `/api/health`.
  - No conecta directamente a la base de datos; usa la API para evitar exponer credenciales desde el script.

- check_auth_flow.sh
  - Comprueba la disponibilidad del endpoint de auth (`/api/auth/session`). Acepta 200 o 401 como indicio de que el servicio auth responde.

- run_all.sh
  - Ejecuta todos los checks anteriores y devuelve resumen final (ALL OK / SOME FAIL).

Variables de entorno soportadas
------------------------------
- BASE_URL : URL base de la app. (por defecto http://localhost:3000)
- HEALTH_ENDPOINT : ruta para health endpoint si no es /api/health
- DB_CHECK_ENDPOINT : ruta para health DB si existe (/api/health/db)

Ejemplos de ejecución
---------------------
Desde el servidor de staging (ejemplo):

```bash
BASE_URL=https://staging.example.com ./hands/smoke/check_app_up.sh
BASE_URL=https://staging.example.com HEALTH_ENDPOINT=/api/health ./hands/smoke/check_api_health.sh
BASE_URL=https://staging.example.com ./hands/smoke/run_all.sh
```

Interpretación básica de resultados
----------------------------------
- Código de salida 0 → OK para ese check.  
- Código de salida distinto de 0 → FAIL; revisar logs y el endpoint específico.  
- `run_all.sh` devolverá 0 si todos los checks pasaron, 2 si hubo fallos.

Notas importantes
-----------------
- Estos scripts son NO DESTRUCTIVOS: sólo realizan lecturas/health checks.  
- No incluir secretos en los scripts. Usar variables de entorno públicas (BASE_URL, etc.).  
- No ejecutar en producción sin autorización explícita.  
- No toquen CI/branch protections desde aquí.

