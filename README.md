# Frontend INEEL — Visor de medición

Interfaz web del sistema de medición y calidad de la energía del INEEL. Consume la API REST de .NET
[MedicionPQ](https://github.com/JosFus29/MedicionPQ), que desarrolla el equipo de backend.

Construido con **React 19**, **Vite** y **Tailwind CSS**.

## Módulos

| Módulo | Descripción |
|---|---|
| Login | Inicio de sesión con JWT; la sesión se conserva al recargar la página. |
| Medidores | Lista de medidores y detalle por medidor con las pestañas Coms, Instantáneos, Valores 5M, Calidad y Consumos. |
| Controladores RF | Lista de controladores de radiofrecuencia; alta y edición solo para el rol Administrador. |
| Usuarios | Alta y edición de usuarios (solo rol Administrador). |

## Requisitos

- Node.js 20.19+ o 22.12+ (requerido por Vite)
- Backend MedicionPQ corriendo en `https://localhost:7090`

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicación queda en http://localhost:5173.

### Conexión con el backend

En desarrollo, las peticiones a `/api` pasan por el proxy de Vite (`vite.config.js`) hacia
`https://localhost:7090`, así que no hay problemas de CORS ni hace falta configurar nada más.
El backend debe arrancarse con el perfil **https**.

Para apuntar a otra URL (por ejemplo, en producción), define `VITE_API_URL` en un archivo `.env`:

```bash
VITE_API_URL=https://servidor/api
```

Los usuarios para iniciar sesión se dan de alta en la base de datos del backend; pídelos al equipo de backend.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila para producción en `dist/` |
| `npm run preview` | Sirve localmente la compilación de `dist/` |
| `npm run lint` | Revisa el código con ESLint |

## Estructura

```
src/
├── App.jsx              # Flujo de sesión y navegación principal
├── components/
│   ├── Login.jsx
│   ├── Header.jsx, Sidebar.jsx, StatusBar.jsx
│   ├── MainForm.jsx     # Pestañas del detalle de un medidor
│   ├── medidores/  coms/  instantaneos/
│   ├── valores5m/  calidad/  consumos/
│   └── usuarios/        # Gestión de usuarios
└── services/            # Comunicación con la API
    ├── api.js           # Cliente HTTP: URL base, token JWT y manejo de errores
    ├── authService.js   # Login, restaurar y cerrar sesión
    ├── usuariosService.js
    └── medidoresService.js
```

Los componentes no llaman a `fetch` directamente: todo pasa por `src/services/`, que adjunta el
token y convierte los errores de la API en mensajes para el usuario.
