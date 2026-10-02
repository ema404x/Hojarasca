# Hojarasca 3.5.3 — El juego ya no se cierra al agacharse

## El arreglo
- **"Se crashea cuando me agacho"**: no era una caída. Agacharse también va con **Ctrl** (además
  de la C) y Electron le pone a la ventana un **menú oculto** con atajos: **Ctrl+W cierra la
  ventana**, Ctrl+R recarga la página y Ctrl+M minimiza. Agachado con Ctrl y caminando para
  adelante con W, el juego se cerraba de golpe; por eso no quedaba nada en
  `logs/hojarasca-crash.log` (para Electron era un "cerrar ventana" normal).
- `main.cjs` saca ese menú (`Menu.setApplicationMenu(null)`) antes de abrir la ventana. F11
  (pantalla completa) sigue andando: lo maneja la ventana, no el menú.
- Verificado arrancando el juego por `main.cjs` como el instalador: la 3.4/3.5.2 abre con menú
  (File, Edit, View, Window), la 3.5.3 sin ninguno. Prueba nueva en el gate:
  `pruebas/verificar-3-5-3-teclas.mjs`.

## QA
- `npm run verify`: 130 de 130.
- Partidas reales del arranque y la recuperación (`humo-3-5-1-caidas`, `humo-3-5-1-relax`,
  `humo-partidas`): en verde. El resto del juego no cambió desde la 3.5.2 (46 de 46).
