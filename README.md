# Prode Mundial 2026 — Angular + Spring Boot

## Arquitectura

```
┌─────────────────┐   HTTP/JSON   ┌──────────────────┐   JPA   ┌──────────────┐
│  Angular 17     │ ────────────> │  Spring Boot 3   │ ──────> │  PostgreSQL  │
│  puerto: 4200   │ <──────────── │  puerto: 8080    │         │  puerto: 5432│
└─────────────────┘               └──────────────────┘         └──────────────┘
```

---

## Requisitos

| Herramienta  | Versión mínima | Descarga                        |
|--------------|----------------|---------------------------------|
| Java JDK     | 21             | https://adoptium.net            |
| Maven        | 3.9+           | https://maven.apache.org        |
| Node.js      | 20+            | https://nodejs.org              |
| Angular CLI  | 17+            | `npm install -g @angular/cli`   |
| PostgreSQL   | 16+            | https://www.postgresql.org      |

---

## Setup inicial

### 1. Base de datos

```sql
-- Ejecutar en psql o pgAdmin
CREATE DATABASE prode_mundial_2026;

-- Crear el admin inicial (ejecutar en la app o directamente en la DB)
-- La password elegida debe estar encriptada con BCrypt:
INSERT INTO usuarios (nombre, apellido, afiliado, es_admin, password, token_version)
VALUES ('Admin', 'Santiago', 9999,  true,
  '<TU_HASH_BCRYPT_AQUI>', 0);
```

### 2. Backend

```bash
cd backend

# 1. Copiar el archivo de ejemplo de variables de entorno
cp .env.example .env

# 2. Editar .env con tus credenciales reales:
# DB_PASSWORD=TU_PASSWORD
# JWT_SECRET=UN_SECRETO_SEGURO

# 3. Ejecutar la aplicación
mvn spring-boot:run
```

# El backend corre en http://localhost:8080
# Probá: curl http://localhost:8080/api/partidos

### 3. Frontend

```bash
cd frontend

npm install
ng serve

# El frontend corre en http://localhost:4200
```

---

## Flujo de uso

### Participante (público):
1. Entra a `http://localhost:4200/planilla`
2. Completa las predicciones para los 72 partidos de fase de grupos
3. Ingresa nombre, apellido y N° de afiliado
4. Hace click en "Guardar" → recibe su código de planilla
5. Presenta el código al admin para confirmar

### Admin:
1. Entra a `http://localhost:4200/admin/login`
2. Ingresa con el número de afiliado configurado (ej: `9999`) y su contraseña.
3. Puede:
   - Confirmar planillas: `/admin/planillas`
   - Cargar resultados: `/admin/resultados`

---

## Endpoints disponibles

```
# Públicos
GET  /api/partidos          → 104 partidos del Mundial 2026
GET  /api/partidos/{id}     → detalle de un partido
POST /api/planillas         → guardar planilla
GET  /api/planillas         → planillas confirmadas
GET  /api/planillas/{code}  → ver planilla por código
GET  /api/resultados        → resultados cargados
GET  /api/posiciones        → tabla de posiciones
GET  /api/estadisticas      → estadísticas de apuestas

# Admin (requieren Bearer token en el header Authorization)
POST /api/auth/login               → obtener token JWT
PUT  /api/planillas/{id}/confirmar → confirmar planilla
PUT  /api/resultados/{partidoId}   → cargar resultado
```

---

## Diferencias con el proyecto PHP original

| Aspecto            | Proyecto PHP                  | Proyecto nuevo                    |
|--------------------|-------------------------------|-----------------------------------|
| DB estructura      | 48 columnas `grupos1..grupos48` | Tabla relacional `predicciones`  |
| Autenticación      | Session + array de usuarios   | JWT stateless                     |
| Escalabilidad      | Solo fase de grupos (48 partidos) | 104 partidos + todas las fases  |
| Separación         | Lógica mezclada con HTML      | Frontend y backend completamente separados |
| Tipado             | PHP dinámico                  | Java + TypeScript (tipado fuerte) |
| Grupos             | 8 grupos (A-H)                | 12 grupos (A-L) para 48 equipos  |

---

## Estructura de archivos generados

```
backend/
├── pom.xml
└── src/main/java/com/upj/prode/
    ├── ProdeApplication.java
    ├── config/   (SecurityConfig, GlobalExceptionHandler)
    ├── controller/ (Auth, Partido, Planilla, Resultado, Posicion)
    ├── dto/        (7 DTOs)
    ├── model/      (Equipo, Partido, Usuario, Planilla, Prediccion, Resultado)
    ├── repository/ (4 repositorios JPA)
    ├── security/   (JwtUtil, JwtFilter)
    └── service/    (Auth, Planilla, Posicion)

frontend/
└── src/app/
    ├── core/
    │   ├── guards/      (auth.guard.ts)
    │   ├── interceptors/ (jwt.interceptor.ts)
    │   └── services/    (auth, partido, planilla, resultado, posicion)
    ├── shared/
    │   ├── components/  (header)
    │   └── models/      (6 interfaces TypeScript)
    └── features/
        ├── home/
        ├── fixture/
        ├── planilla/    ← formulario principal
        ├── posiciones/
        ├── estadisticas/
        ├── participantes/
        └── admin/       (login, dashboard, cargar-resultados, confirmar-planillas)
```
