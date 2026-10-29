/*
 * agregar-fases-vars5m.sql
 * ---------------------------------------------------------------------------
 * El backend lee la columna Vars5M.fases (en cuántas fases se mide cada
 * variable: 1 o 3), que la base de datos no tiene, y GET /api/Vars5M falla.
 * Basado en el script del equipo de backend, adaptado a esta base de datos:
 *   - la tabla se llama dbo.Vars5M (no dbo.Variables5M);
 *   - las variables 1 a 13 ya existen y Medicion5M apunta a ellas, así que se
 *     ACTUALIZAN (no se borran ni se vuelven a insertar);
 *   - solo se inserta la variable 14 (Frecuencia), que es nueva.
 *
 * Además corrige las unidades de las energías: 1-2 pasan de 6 (Hz) a
 * 7 (kWh) y 3-6 de 7 (kWh) a 8 (kVARh). No borra ninguna medición.
 * Se puede ejecutar más de una vez.
 *
 * Uso:
 *   sqlcmd -S ".\SQLEXPRESS" -d MedicionQP -C -i scripts\sql\agregar-fases-vars5m.sql
 */
SET NOCOUNT ON;
SET XACT_ABORT ON;

-- 1. Columna fases (las filas existentes quedan en 1 hasta el paso 2).
IF COL_LENGTH('dbo.Vars5M', 'fases') IS NULL
    ALTER TABLE dbo.Vars5M ADD fases tinyint NOT NULL
        CONSTRAINT DF_Vars5M_fases DEFAULT (1);
GO

BEGIN TRANSACTION;

-- 2. Unidad y fases de las variables existentes.
UPDATE v
SET v.idUnidad = d.idUnidad,
    v.fases = d.fases
FROM dbo.Vars5M AS v
JOIN (VALUES
    (1,  7,  1),   -- Energia entregada     kWh
    (2,  7,  1),   -- Energia recibida      kWh
    (3,  8,  1),   -- Energia reactiva I    kVARh
    (4,  8,  1),   -- Energia reactiva II   kVARh
    (5,  8,  1),   -- Energia reactiva III  kVARh
    (6,  8,  1),   -- Energia reactiva IV   kVARh
    (7,  3,  3),   -- Potencia activa       kW
    (8,  5,  3),   -- Potencia reactiva     kVAR
    (9,  1,  3),   -- Voltaje               V
    (10, 2,  3),   -- Corriente             A
    (11, 10, 3),   -- Factor de Potencia    (sin unidad)
    (12, 9,  3),   -- THD voltaje           %
    (13, 9,  3)    -- THD Corriente         %
) AS d (idVar5M, idUnidad, fases) ON d.idVar5M = v.idVar5M;

-- 3. Variable nueva: Frecuencia (Hz, una fase). idVar5M es IDENTITY.
IF NOT EXISTS (SELECT 1 FROM dbo.Vars5M WHERE idVar5M = 14)
BEGIN
    SET IDENTITY_INSERT dbo.Vars5M ON;
    INSERT INTO dbo.Vars5M (idVar5M, idUnidad, nombre, simbolo, codigoIHM, edo, fases)
    VALUES (14, 6, 'Frecuencia', 'P5M_F', 63, 1, 1);
    SET IDENTITY_INSERT dbo.Vars5M OFF;
END

COMMIT TRANSACTION;

SELECT idVar5M, idUnidad, nombre, simbolo, codigoIHM, edo, fases
FROM dbo.Vars5M
ORDER BY idVar5M;
