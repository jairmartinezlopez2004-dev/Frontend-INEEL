/*
 * vaciar-eventosreg-medicion5m.sql
 * ---------------------------------------------------------------------------
 * Borra TODOS los registros de dbo.EventosReg (eventos registrados) y de
 * dbo.Medicion5M (mediciones 5 minutales) en la base MedicionQP.
 *
 * No toca catálogos ni configuración (ControladorRF, MedidorQP, EventosConfig,
 * Vars5M, Unidades, PuntosIO, Usuario...). Ninguna otra tabla tiene llaves
 * foráneas hacia estas dos, por eso se puede usar TRUNCATE (mucho más rápido
 * que DELETE con más de un millón de filas y reinicia los IDENTITY).
 *
 * ¡NO SE PUEDE DESHACER! Haz un respaldo antes si necesitas los datos.
 *
 * Uso:
 *   sqlcmd -S ".\SQLEXPRESS" -d MedicionQP -C -i scripts\sql\vaciar-eventosreg-medicion5m.sql
 */
SET NOCOUNT ON;
SET XACT_ABORT ON;

PRINT 'Antes:';
SELECT 'EventosReg' AS tabla, COUNT_BIG(*) AS filas FROM dbo.EventosReg
UNION ALL
SELECT 'Medicion5M', COUNT_BIG(*) FROM dbo.Medicion5M;

BEGIN TRANSACTION;
    TRUNCATE TABLE dbo.EventosReg;
    TRUNCATE TABLE dbo.Medicion5M;
COMMIT TRANSACTION;

PRINT 'Después:';
SELECT 'EventosReg' AS tabla, COUNT_BIG(*) AS filas FROM dbo.EventosReg
UNION ALL
SELECT 'Medicion5M', COUNT_BIG(*) FROM dbo.Medicion5M;
