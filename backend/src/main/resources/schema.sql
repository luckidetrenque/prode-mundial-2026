-- FIX #19: Este archivo se ejecuta en CADA arranque (spring.sql.init.mode=always).
-- Para que sea seguro, TODAS las sentencias deben ser idempotentes (IF NOT EXISTS).
--
-- RECOMENDACIÓN PARA PRODUCCIÓN:
--   Reemplazar este approach por Flyway:
--   1. Agregar al pom.xml: spring-boot-starter-flyway
--   2. Mover scripts a: src/main/resources/db/migration/V1__init.sql
--   3. Cambiar en application.properties:
--        spring.sql.init.mode=never
--        spring.jpa.hibernate.ddl-auto=validate
--   Flyway garantiza que cada script se ejecuta exactamente una vez
--   y lleva un historial de versiones aplicadas.

-- Columna token_version: necesaria para la invalidación de JWT en logout.
-- Hibernate a veces falla al agregar columnas nuevas con ddl-auto=update en PostgreSQL.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

-- Columna multiplicador para partidos destacados (Puntos x2)
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS multiplicador INTEGER NOT NULL DEFAULT 1;

-- Actualización de partidos destacados según requerimiento del usuario
UPDATE partidos SET multiplicador = 2 WHERE numero IN (1, 26, 30, 4, 11, 57, 65, 64, 43, 44, 70, 22);
UPDATE partidos SET multiplicador = 1 WHERE numero NOT IN (1, 26, 30, 4, 11, 57, 65, 64, 43, 44, 70, 22);