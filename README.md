# Frontend INEEL — Visor de medición

Interfaz web del sistema de medición y calidad de la energía del INEEL. Consume la API REST de .NET
[MedicionPQ](https://github.com/JosFus29/MedicionPQ), que desarrolla el equipo de backend.

Construido con **React 19**, **Vite** y **Tailwind CSS**.

## Módulos

| Módulo | Descripción |
|---|---|
| Login | Inicio de sesión con JWT; la sesión se conserva al recargar la página. |
| Controladores RF | Lista de controladores de radiofrecuencia; al entrar a uno se ven los medidores agrupados en él y, desde ahí, el detalle de cada medidor. Alta y edición de controladores y medidores solo para el rol Administrador. |
| Eventos configurados | Catálogo de eventos que reconoce el sistema, con su unidad y estado. Alta y edición solo para el rol Administrador. |
| Eventos registrados | Historial de solo consulta de los eventos configurados que han ocurrido en los medidores. |
| Unidades | Catálogo de unidades de medida (V, A, kWh…). Alta y edición solo para el rol Administrador. |
| Puntos IO | Puntos de entrada/salida con su grupo funcional, grupo eléctrico, unidad, direcciones y límites. Edición solo para el rol Administrador, confirmando cada cambio con su contraseña. |
| Usuarios | Alta y edición de usuarios (solo rol Administrador). |

Además, un minuto antes de que expire la sesión aparece un aviso para renovarla.

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
├── App.jsx                    # Flujo de sesión y navegación principal
├── components/
│   ├── Login.jsx
│   ├── Header.jsx, Sidebar.jsx, StatusBar.jsx
│   ├── AvisoExpiracionSesion.jsx  # Aviso para renovar la sesión
│   ├── MainForm.jsx           # Pestañas del detalle de un medidor
│   ├── common/                # Piezas compartidas (modal, campos, etiquetas)
│   ├── controladoresRF/       # Controladores RF y sus medidores
│   ├── medidores/  coms/  instantaneos/
│   ├── valores5m/  calidad/  consumos/
│   ├── eventos/               # Eventos configurados
│   ├── eventosReg/            # Eventos registrados (historial)
│   ├── unidades/              # Unidades de medida
│   ├── puntosIO/              # Puntos de entrada/salida
│   └── usuarios/              # Gestión de usuarios
├── hooks/useValidacion.js     # Validación de formularios
├── utils/validaciones.js      # Reglas de validación
└── services/                  # Comunicación con la API
    ├── api.js                 # Cliente HTTP: URL base, token JWT y manejo de errores
    ├── authService.js         # Login, renovar, restaurar y cerrar sesión
    ├── usuariosService.js
    ├── controladoresRFService.js
    ├── medidoresService.js
    ├── eventosConfigService.js
    ├── eventosRegService.js
    ├── unidadesService.js
    └── puntosIOService.js     # Puntos IO y catálogos de grupos IO
```

Los componentes no llaman a `fetch` directamente: todo pasa por `src/services/`, que adjunta el
token y convierte los errores de la API en mensajes para el usuario.
