-- Aseguramos que la columna token_version exista en la tabla usuarios.
-- Esto es necesario porque ddl-auto=update a veces falla al alterar tablas existentes en PostgreSQL.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
