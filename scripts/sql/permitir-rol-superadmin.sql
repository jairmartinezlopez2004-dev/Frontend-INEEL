/*
 * permitir-rol-superadmin.sql
 * ---------------------------------------------------------------------------
 * La restricción CK_Usuario_Rol de dbo.Usuario solo acepta rol 1
 * (Administrador) y 2 (Usuario). El backend (commit a76f7ef) agregó el rol
 * 5 = SuperAdministrador, y el BootstrapAdminSeeder falla al insertarlo.
 *
 * Este script vuelve a crear la restricción aceptando 1, 2 y 5. No modifica
 * ni borra ningún usuario.
 *
 * Uso:
 *   sqlcmd -S ".\SQLEXPRESS" -d MedicionQP -C -i scripts\sql\permitir-rol-superadmin.sql
 */
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;
    ALTER TABLE dbo.Usuario DROP CONSTRAINT CK_Usuario_Rol;
    ALTER TABLE dbo.Usuario ADD CONSTRAINT CK_Usuario_Rol CHECK ([rol] IN (1, 2, 5));
COMMIT TRANSACTION;

SELECT name, definition FROM sys.check_constraints WHERE name = 'CK_Usuario_Rol';
