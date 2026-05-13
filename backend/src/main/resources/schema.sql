-- =============================================================================
-- schema.sql — Datos iniciales idempotentes para Prode Mundial 2026
-- Se ejecuta en cada arranque. ON CONFLICT DO NOTHING garantiza idempotencia.
-- =============================================================================

-- Columnas extra (idempotentes)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS multiplicador INTEGER NOT NULL DEFAULT 1;

-- ─── EQUIPOS ─────────────────────────────────────────────────────────────────
INSERT INTO equipos (id, bandera_url, grupo, nombre, nombre_show) VALUES
(1,  'assets/images/flags/mx.svg',     'A', 'mexico',        'México'),
(2,  'assets/images/flags/za.svg',     'A', 'sudafrica',     'Sudáfrica'),
(3,  'assets/images/flags/kr.svg',     'A', 'corea_sur',     'Corea del Sur'),
(4,  'assets/images/flags/cz.svg',     'A', 'rep_checa',     'República Checa'),
(5,  'assets/images/flags/ca.svg',     'B', 'canada',        'Canadá'),
(6,  'assets/images/flags/ba.svg',     'B', 'bosnia',        'Bosnia y Herzegovina'),
(7,  'assets/images/flags/qa.svg',     'B', 'catar',         'Catar'),
(8,  'assets/images/flags/ch.svg',     'B', 'suiza',         'Suiza'),
(9,  'assets/images/flags/br.svg',     'C', 'brasil',        'Brasil'),
(10, 'assets/images/flags/ma.svg',     'C', 'marruecos',     'Marruecos'),
(11, 'assets/images/flags/ht.svg',     'C', 'haiti',         'Haití'),
(12, 'assets/images/flags/gb-sct.svg', 'C', 'escocia',       'Escocia'),
(13, 'assets/images/flags/us.svg',     'D', 'usa',           'Estados Unidos'),
(14, 'assets/images/flags/py.svg',     'D', 'paraguay',      'Paraguay'),
(15, 'assets/images/flags/au.svg',     'D', 'australia',     'Australia'),
(16, 'assets/images/flags/tr.svg',     'D', 'turquia',       'Turquía'),
(17, 'assets/images/flags/de.svg',     'E', 'alemania',      'Alemania'),
(18, 'assets/images/flags/cw.svg',     'E', 'curazao',       'Curazao'),
(19, 'assets/images/flags/ci.svg',     'E', 'costa_marfil',  'Costa de Marfil'),
(20, 'assets/images/flags/ec.svg',     'E', 'ecuador',       'Ecuador'),
(21, 'assets/images/flags/nl.svg',     'F', 'paises_bajos',  'Países Bajos'),
(22, 'assets/images/flags/jp.svg',     'F', 'japon',         'Japón'),
(23, 'assets/images/flags/se.svg',     'F', 'suecia',        'Suecia'),
(24, 'assets/images/flags/tn.svg',     'F', 'tunez',         'Túnez'),
(25, 'assets/images/flags/be.svg',     'G', 'belgica',       'Bélgica'),
(26, 'assets/images/flags/eg.svg',     'G', 'egipto',        'Egipto'),
(27, 'assets/images/flags/ir.svg',     'G', 'iran',          'Irán'),
(28, 'assets/images/flags/nz.svg',     'G', 'nueva_zelanda', 'Nueva Zelanda'),
(29, 'assets/images/flags/es.svg',     'H', 'espana',        'España'),
(30, 'assets/images/flags/cv.svg',     'H', 'cabo_verde',    'Cabo Verde'),
(31, 'assets/images/flags/sa.svg',     'H', 'arabia_saudi',  'Arabia Saudí'),
(32, 'assets/images/flags/uy.svg',     'H', 'uruguay',       'Uruguay'),
(33, 'assets/images/flags/fr.svg',     'I', 'francia',       'Francia'),
(34, 'assets/images/flags/sn.svg',     'I', 'senegal',       'Senegal'),
(35, 'assets/images/flags/iq.svg',     'I', 'irak',          'Irak'),
(36, 'assets/images/flags/no.svg',     'I', 'noruega',       'Noruega'),
(37, 'assets/images/flags/ar.svg',     'J', 'argentina',     'Argentina'),
(38, 'assets/images/flags/dz.svg',     'J', 'argelia',       'Argelia'),
(39, 'assets/images/flags/at.svg',     'J', 'austria',       'Austria'),
(40, 'assets/images/flags/jo.svg',     'J', 'jordania',      'Jordania'),
(41, 'assets/images/flags/pt.svg',     'K', 'portugal',      'Portugal'),
(42, 'assets/images/flags/cd.svg',     'K', 'rd_congo',      'RD Congo'),
(43, 'assets/images/flags/uz.svg',     'K', 'uzbekistan',    'Uzbekistán'),
(44, 'assets/images/flags/co.svg',     'K', 'colombia',      'Colombia'),
(45, 'assets/images/flags/gb-eng.svg', 'L', 'inglaterra',    'Inglaterra'),
(46, 'assets/images/flags/hr.svg',     'L', 'croacia',       'Croacia'),
(47, 'assets/images/flags/gh.svg',     'L', 'ghana',         'Ghana'),
(48, 'assets/images/flags/pa.svg',     'L', 'panama',        'Panamá')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia de equipos
SELECT setval('equipos_id_seq', (SELECT MAX(id) FROM equipos));

-- ─── PARTIDOS ────────────────────────────────────────────────────────────────
INSERT INTO partidos (id, fase, fecha_hora, grupo, jornada, numero, sede, equipo_local_id, equipo_visitante_id, multiplicador) VALUES
(1,  'GRUPOS', '2026-06-11 16:00:00', 'A', 1,  1,  'Ciudad de México',       1,  2,  2),
(2,  'GRUPOS', '2026-06-11 23:00:00', 'A', 1,  2,  'Guadalajara',            3,  4,  1),
(3,  'GRUPOS', '2026-06-12 16:00:00', 'B', 1,  3,  'Toronto',                5,  6,  1),
(4,  'GRUPOS', '2026-06-12 22:00:00', 'D', 1,  4,  'Los Angeles',            13, 14, 2),
(5,  'GRUPOS', '2026-06-13 16:00:00', 'B', 1,  5,  'Bahía de San Francisco', 7,  8,  1),
(6,  'GRUPOS', '2026-06-13 19:00:00', 'C', 1,  6,  'Nueva York/Nueva Jersey',9,  10, 1),
(7,  'GRUPOS', '2026-06-13 22:00:00', 'C', 1,  7,  'Boston',                 11, 12, 1),
(8,  'GRUPOS', '2026-06-14 01:00:00', 'D', 1,  8,  'BC Place Vancouver',     15, 16, 1),
(9,  'GRUPOS', '2026-06-14 14:00:00', 'E', 1,  9,  'Houston',                18, 17, 1),
(10, 'GRUPOS', '2026-06-14 17:00:00', 'F', 1,  10, 'Dallas',                 21, 22, 1),
(11, 'GRUPOS', '2026-06-14 20:00:00', 'E', 1,  11, 'Filadelfia',             19, 20, 2),
(12, 'GRUPOS', '2026-06-14 23:00:00', 'F', 1,  12, 'Monterrey',              23, 24, 1),
(13, 'GRUPOS', '2026-06-15 13:00:00', 'H', 1,  13, 'Atlanta',                29, 30, 1),
(14, 'GRUPOS', '2026-06-15 16:00:00', 'G', 1,  14, 'Seattle',                25, 26, 1),
(15, 'GRUPOS', '2026-06-15 19:00:00', 'H', 1,  15, 'Miami',                  31, 32, 1),
(16, 'GRUPOS', '2026-06-15 22:00:00', 'G', 1,  16, 'Los Angeles',            27, 28, 1),
(17, 'GRUPOS', '2026-06-16 16:00:00', 'I', 1,  17, 'Nueva York/Nueva Jersey',33, 34, 1),
(18, 'GRUPOS', '2026-06-16 19:00:00', 'I', 1,  18, 'Boston',                 35, 36, 1),
(19, 'GRUPOS', '2026-06-16 22:00:00', 'J', 1,  19, 'Kansas City',            37, 38, 1),
(20, 'GRUPOS', '2026-06-17 01:00:00', 'J', 1,  20, 'Bahía de San Francisco', 39, 40, 1),
(21, 'GRUPOS', '2026-06-17 14:00:00', 'K', 1,  21, 'Houston',                41, 42, 1),
(22, 'GRUPOS', '2026-06-17 17:00:00', 'L', 1,  22, 'Dallas',                 45, 46, 2),
(23, 'GRUPOS', '2026-06-17 20:00:00', 'L', 1,  23, 'Toronto',                47, 48, 1),
(24, 'GRUPOS', '2026-06-17 23:00:00', 'K', 1,  24, 'Ciudad de México',       43, 44, 1),
(25, 'GRUPOS', '2026-06-18 13:00:00', 'A', 2,  25, 'Atlanta',                4,  2,  1),
(26, 'GRUPOS', '2026-06-18 16:00:00', 'B', 2,  26, 'Los Angeles',            8,  6,  2),
(27, 'GRUPOS', '2026-06-18 19:00:00', 'B', 2,  27, 'BC Place Vancouver',     5,  7,  1),
(28, 'GRUPOS', '2026-06-18 22:00:00', 'A', 2,  28, 'Guadalajara',            1,  3,  1),
(29, 'GRUPOS', '2026-06-19 16:00:00', 'D', 2,  29, 'Seattle',                13, 15, 1),
(30, 'GRUPOS', '2026-06-19 19:00:00', 'C', 2,  30, 'Boston',                 12, 10, 2),
(31, 'GRUPOS', '2026-06-19 21:30:00', 'C', 2,  31, 'Filadelfia',             9,  11, 1),
(32, 'GRUPOS', '2026-06-20 00:00:00', 'D', 2,  32, 'Bahía de San Francisco', 16, 14, 1),
(33, 'GRUPOS', '2026-06-20 14:00:00', 'F', 2,  33, 'Houston',                21, 23, 1),
(34, 'GRUPOS', '2026-06-20 17:00:00', 'E', 2,  34, 'Toronto',                17, 19, 1),
(35, 'GRUPOS', '2026-06-20 21:00:00', 'E', 2,  35, 'Kansas City',            20, 18, 1),
(36, 'GRUPOS', '2026-06-21 01:00:00', 'F', 2,  36, 'Monterrey',              24, 22, 1),
(37, 'GRUPOS', '2026-06-21 13:00:00', 'H', 2,  37, 'Atlanta',                29, 31, 1),
(38, 'GRUPOS', '2026-06-21 16:00:00', 'G', 2,  38, 'Los Angeles',            25, 27, 1),
(39, 'GRUPOS', '2026-06-21 19:00:00', 'H', 2,  39, 'Miami',                  32, 30, 1),
(40, 'GRUPOS', '2026-06-21 22:00:00', 'G', 2,  40, 'BC Place Vancouver',     28, 26, 1),
(41, 'GRUPOS', '2026-06-22 14:00:00', 'J', 2,  41, 'Dallas',                 37, 39, 1),
(42, 'GRUPOS', '2026-06-22 18:00:00', 'I', 2,  42, 'Filadelfia',             33, 35, 1),
(43, 'GRUPOS', '2026-06-22 21:00:00', 'I', 2,  43, 'Nueva York/Nueva Jersey',36, 34, 2),
(44, 'GRUPOS', '2026-06-23 00:00:00', 'J', 2,  44, 'Bahía de San Francisco', 40, 38, 2),
(45, 'GRUPOS', '2026-06-23 14:00:00', 'K', 2,  45, 'Houston',                41, 43, 1),
(46, 'GRUPOS', '2026-06-23 17:00:00', 'L', 2,  46, 'Boston',                 45, 47, 1),
(47, 'GRUPOS', '2026-06-23 20:00:00', 'L', 2,  47, 'Toronto',                48, 46, 1),
(48, 'GRUPOS', '2026-06-23 23:00:00', 'K', 2,  48, 'Guadalajara',            44, 42, 1),
(49, 'GRUPOS', '2026-06-24 16:00:00', 'B', 3,  49, 'BC Place Vancouver',     8,  5,  1),
(50, 'GRUPOS', '2026-06-24 16:00:00', 'B', 3,  50, 'Seattle',                6,  7,  1),
(51, 'GRUPOS', '2026-06-24 19:00:00', 'C', 3,  51, 'Miami',                  12, 9,  1),
(52, 'GRUPOS', '2026-06-24 19:00:00', 'C', 3,  52, 'Atlanta',                10, 11, 1),
(53, 'GRUPOS', '2026-06-24 22:00:00', 'A', 3,  53, 'Ciudad de México',       4,  1,  1),
(54, 'GRUPOS', '2026-06-24 22:00:00', 'A', 3,  54, 'Monterrey',              2,  3,  1),
(55, 'GRUPOS', '2026-06-25 17:00:00', 'E', 3,  55, 'Filadelfia',             18, 19, 1),
(56, 'GRUPOS', '2026-06-25 17:00:00', 'E', 3,  56, 'Nueva York/Nueva Jersey',20, 17, 1),
(57, 'GRUPOS', '2026-06-25 20:00:00', 'F', 3,  57, 'Dallas',                 22, 23, 2),
(58, 'GRUPOS', '2026-06-25 20:00:00', 'F', 3,  58, 'Kansas City',            24, 21, 1),
(59, 'GRUPOS', '2026-06-25 23:00:00', 'D', 3,  59, 'Los Angeles',            16, 13, 1),
(60, 'GRUPOS', '2026-06-25 23:00:00', 'D', 3,  60, 'Bahía de San Francisco', 14, 15, 1),
(61, 'GRUPOS', '2026-06-26 16:00:00', 'I', 3,  61, 'Boston',                 36, 33, 1),
(62, 'GRUPOS', '2026-06-26 16:00:00', 'I', 3,  62, 'Toronto',                34, 35, 1),
(63, 'GRUPOS', '2026-06-26 21:00:00', 'H', 3,  63, 'Houston',                30, 31, 1),
(64, 'GRUPOS', '2026-06-26 21:00:00', 'H', 3,  64, 'Guadalajara',            32, 29, 2),
(65, 'GRUPOS', '2026-06-27 00:00:00', 'G', 3,  65, 'Seattle',                26, 27, 2),
(66, 'GRUPOS', '2026-06-27 00:00:00', 'G', 3,  66, 'BC Place Vancouver',     28, 25, 1),
(67, 'GRUPOS', '2026-06-27 18:00:00', 'L', 3,  67, 'Nueva York/Nueva Jersey',48, 45, 1),
(68, 'GRUPOS', '2026-06-27 18:00:00', 'L', 3,  68, 'Filadelfia',             46, 47, 1),
(69, 'GRUPOS', '2026-06-27 20:30:00', 'K', 3,  69, 'Miami',                  44, 41, 1),
(70, 'GRUPOS', '2026-06-27 20:30:00', 'K', 3,  70, 'Atlanta',                42, 43, 2),
(71, 'GRUPOS', '2026-06-27 23:00:00', 'J', 3,  71, 'Kansas City',            38, 39, 1),
(72, 'GRUPOS', '2026-06-27 23:00:00', 'J', 3,  72, 'Dallas',                 40, 37, 1)
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia de partidos
SELECT setval('partidos_id_seq', (SELECT MAX(id) FROM partidos));

-- ─── USUARIO ADMIN ───────────────────────────────────────────────────────────
INSERT INTO usuarios (id, apellido, email, es_admin, nombre, password, token_version) VALUES
(5, 'Santiago', 'santi@gmail.com', true, 'Admin', '$2a$12$Obf0oWbAWCrG.l5mpZxgPOXuaH9z9F3.epKtcA8ZOx1JvfzyFZTXm', 0)
ON CONFLICT (id) DO NOTHING;

SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

-- ─── Resetear base de datos ───────────────────────────────────────────────────────────
DELETE FROM predicciones;

DELETE FROM planillas;

DELETE FROM resultados;

DELETE FROM usuarios
	WHERE usuarios.es_admin = false;