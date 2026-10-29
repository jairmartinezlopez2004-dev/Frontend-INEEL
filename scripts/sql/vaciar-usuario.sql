/*
 * vaciar-usuario.sql
 * ---------------------------------------------------------------------------
 * Borra TODOS los registros de dbo.Usuario en la base MedicionQP.
 *
 * Sirve para que, al volver a arrancar la API, el BootstrapAdminSeeder del
 * backend cree la cuenta inicial (BootstrapAdmin:Email / BootstrapAdmin:Password
 * de los user secrets) con el rol SuperAdministrador.
 *
 * Ninguna tabla tiene llaves foráneas hacia Usuario, por eso se puede usar
 * TRUNCATE (también reinicia el IDENTITY de idUsuario).
 *
 * ¡NO SE PUEDE DESHACER! Mientras la API no se reinicie nadie podrá iniciar sesión.
 *
 * Uso:
 *   sqlcmd -S ".\SQLEXPRESS" -d MedicionQP -C -i scripts\sql\vaciar-usuario.sql
 */
SET NOCOUNT ON;
SET XACT_ABORT ON;

PRINT 'Antes:';
SELECT idUsuario, correo, rol FROM dbo.Usuario;

BEGIN TRANSACTION;
    TRUNCATE TABLE dbo.Usuario;
COMMIT TRANSACTION;

PRINT 'Después:';
SELECT COUNT(*) AS filas FROM dbo.Usuario;
