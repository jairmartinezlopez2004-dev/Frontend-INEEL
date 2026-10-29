/*
 * agregar-columna-fases-vars5m.sql
 * ---------------------------------------------------------------------------
 * Agrega a dbo.Vars5M la columna fases (tinyint, 1 por defecto) que lee el
 * backend (Modelos/Vars5M.cs). Con ella la tabla queda igual al modelo del
 * backend. No modifica ni borra ningún dato: las filas existentes quedan con
 * fases = 1 hasta que se actualicen.
 * Se puede ejecutar más de una vez.
 *
 * Uso:
 *   sqlcmd -S ".\SQLEXPRESS" -d MedicionQP -C -i scripts\sql\agregar-columna-fases-vars5m.sql
 */
SET NOCOUNT ON;

IF COL_LENGTH('dbo.Vars5M', 'fases') IS NULL
    ALTER TABLE dbo.Vars5M ADD fases tinyint NOT NULL
        CONSTRAINT DF_Vars5M_fases DEFAULT (1);
