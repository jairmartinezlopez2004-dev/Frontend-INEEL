---
name: estilo-simecaps
description: Guía de estilo visual de SIMECAPS (visor de calidad de la potencia, INEEL). Úsala SIEMPRE antes de crear o modificar cualquier pantalla, componente, tabla, formulario, tarjeta, ícono o color del frontend, para que todo se vea consistente con lo ya aprobado.
---

# Guía de estilo de SIMECAPS

Sistema institucional de medición (INEEL / SECIHTI). La prioridad es que sea **sobrio, claro y consistente**: todas las pantallas deben parecer parte del mismo sistema. No se inventan estilos nuevos por pantalla.

## Tecnología
- React + Tailwind CSS **v3** (no usar clases que solo existen en v4, como `blur-xs` o `bg-linear-*`).
- Íconos: **solo `lucide-react`** (`import { Database } from 'lucide-react'`). No dibujar SVG a mano ni mezclar otras librerías. Siempre con `aria-hidden="true"` si son decorativos.
- Tipografía: **Inter** (`@fontsource-variable/inter`, ya configurada como `font-sans`). No cargar fuentes externas.
- Textos de marca (logos, título, siglas, leyendas, pie, fondo del login) se leen de `public/config.json` mediante `obtenerConfiguracion()`; nunca se escriben fijos en el código.

## Colores (paleta institucional del INEEL, definida en tailwind.config.js)
- **azul** (marino del logo, `azul-700` = #2B4A80) y **verde** (hoja del logo, `verde-500` = #63A74A), escalas 50–950. **No usar** `blue-*`, `green-*`, `emerald-*` ni `indigo-*` de Tailwind (salvo los colores de fase A/B/C, que deben coincidir con las gráficas).

| Uso | Clases |
| --- | --- |
| Fondo del área de trabajo | **la foto de `config.json → fondoAcceso` con velo azul marino** (`rgba(19,33,58,.72)`, `fixed`), igual que "Datos a Consultar"; sin foto, `bg-azul-900`. Todo el contenido en tarjetas blancas; lo que quede directo sobre el fondo lleva **texto blanco** (menús de Coms y Puntos de ajuste). Se probaron azul claro, azul marino y negro |
| Superficies (tarjetas, formularios) | `bg-white` + `border border-gray-200` |
| Texto principal / títulos | `text-slate-800` |
| Etiquetas de campos | `text-gray-700` (`text-sm font-medium`) |
| Acción principal / acento | `bg-azul-700 hover:bg-azul-800`, foco `ring-azul-600` |
| Ícono de los títulos, opción activa del menú, subrayado de pestaña activa | verde: `bg-verde-500`, `bg-verde-600`, `border-verde-400` |
| Menú lateral | **el original** (sin cambios): `bg-slate-900`, texto `text-slate-400`, activa `bg-slate-800 text-white`, sin íconos. Se probaron muchas variantes (blanco, verde, azul, botones) y el usuario prefiere el original: no tocarlo |
| Barra de pestañas del medidor | **verde** `bg-verde-600`, texto blanco; activa en negritas con subrayado blanco |
| Encabezados de tabla | **tinte claro + línea de color**: medidores y demás `bg-verde-50 border-b-2 border-verde-500` con texto `text-verde-900`; controladores `bg-azul-50 border-b-2 border-azul-600` con texto `text-azul-900` (el color sólido se probó: había demasiado verde sólido compitiendo) |
| Barra superior | blanca (por los logos), borde inferior gris fino (la franja verde se probó y no gustó) |
| Pies y barra de estado | `bg-azul-950`, texto `text-azul-200` |
| Error | `text-red-600`, `bg-red-50`, `border-red-500` |
| Éxito | `text-verde-700`, `bg-verde-50`, `border-verde-200` |

## Componentes
- **Código de color por entidad**: todo lo de **controladores** va en **azul** (`TituloSeccion color="azul"`, encabezado de tabla con tinte azul, encabezado del detalle en tarjeta blanca igual que la lista) y todo lo de **medidores** en **verde** (`TituloSeccion` verde, encabezado de tabla con tinte verde), para identificarlos de un vistazo.
- **Componentes comunes (úsalos siempre en vez de repetir clases)**:
  - `components/common/TituloSeccion.jsx`: título de tarjeta con ícono Lucide en círculo azul claro (`Icono`, `titulo`, `subtitulo`, `etiqueta`, `mayusculas={false}` para nombres propios).
  - `components/common/Botones.jsx`: `BotonPrimario` (azul, ícono "+" por defecto), `BotonSecundario`, `BotonEditar` (lápiz), `BotonVer` (flecha).
- **Tarjetas de contenido**: `rounded-xl border border-gray-200 bg-white shadow-sm` (nunca `shadow-lg ring-1`, ni fondos de color azul/verde en la tarjeta). Ocupan todo el ancho del área (sin `mx-auto max-w-7xl`).
- **Encabezado del detalle** (controlador y medidor): tarjeta blanca igual que las listas, con `TituloSeccion` (ícono azul para controlador, verde para medidor). Los encabezados de color sólido se probaron y no gustaron.
- **Pestañas del medidor**: barra blanca con borde; cada pestaña con su ícono; activa con subrayado `border-blue-600 text-blue-600`. El encabezado de cada pestaña de lectura usa `EncabezadoLectura` con el mismo ícono de la pestaña.
- **Valores de medición**: texto `font-mono tabular-nums` en verde (`text-green-500`), estilo monitor; se mantiene.
- **Barra superior**: blanca, `h-16 border-b border-gray-200 shadow-sm`, logos con `LogosInstitucionales`, título del sistema en mayúsculas `text-sm font-bold tracking-wide`.
- **Fondo de "Datos a Consultar"**: la foto de `config.json → fondoAcceso` con velo azul marino (`rgba(19,33,58,.72)`), título en blanco; sin foto, `bg-azul-900`.
- **Tarjetas de opción** (pantalla "Datos a Consultar"): fondo blanco **sin borde** `rounded-2xl bg-white shadow-md`; círculo del ícono `bg-verde-500 text-white`; texto oscuro (la ficha completa en verde se probó y no gustó). Los colores son **fijos**; al pasar el cursor **solo se elevan** (`transition-transform hover:-translate-y-1`), sin cambio de color.
- **Menú lateral**: se queda el diseño original (gris oscuro, sin íconos). No proponer más cambios salvo que el usuario lo pida.
- **Inputs**: usar `claseControl()` de `components/common/clasesFormulario.js` (o `clasesAuth.js` en las pantallas de acceso). No repetir clases a mano.
- **Botón primario**: `bg-blue-600 text-white hover:bg-blue-700 rounded-md px-4 py-2 text-sm font-medium`. Secundario: borde `border-gray-300 text-slate-700 hover:bg-slate-50`. Peligro: rojo solo al confirmar.
- **Tablas**: encabezado `bg-slate-50 text-xs font-semibold uppercase text-slate-600`, filas con `divide-y divide-gray-100` y `hover:bg-slate-50`; números alineados a la derecha con `tabular-nums`.
- **Botón de regreso** («Volver a …»): `BotonVolver` de `common/Botones.jsx` (letra azul con flecha), debajo del nombre en el encabezado del detalle.
- **Confirmaciones**: `ConfirmDialog`, nunca `alert`/`confirm` del navegador.
- **Enlaces de texto** (p. ej. «Regístrate», «¿Olvidaste tu contraseña?»): azul estándar de enlace `text-blue-600 hover:text-blue-800 hover:underline` (única excepción a la regla de no usar `blue-*`).
- **Pantallas de acceso**: botón principal (Iniciar sesión, Crear cuenta, Restablecer) en **verde** `bg-verde-500 hover:bg-verde-600`; tarjeta blanca centrada sobre la imagen de fondo de `config.json`; logos INEEL arriba y SECIHTI abajo; siglas SIMECAPS al final en `text-gray-700`.

## Reglas de trabajo
- Cambios pequeños y visibles, uno a la vez; el usuario los revisa en el navegador antes de seguir.
- Mantener los comentarios en español que explican el rol de cada componente.
- Respetar el lint (`npx eslint`) y comprobar que `npm run build` compila.
- Imágenes: solo libres de derechos (dominio público, CC0 o CC BY/BY-SA con crédito en `config.json`).
