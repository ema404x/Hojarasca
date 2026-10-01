# 1.0.0 — Versión final

Cierre de la línea de release candidates (RC1–RC31.2). Sin cambios de jugabilidad
respecto de RC31.2; sólo terminación para el jugador y robustez del gate.

## Para el jugador

- **Brújula sin etiquetas superpuestas.** Cuando varios lugares quedaban en el mismo
  rumbo (típico desde el refugio o el faro) sus nombres se dibujaban uno encima del otro
  ("MPuCueArBcl…"). Ahora se ubican del más cercano al más lejano y se omite el que
  pisaría a uno ya puesto. Sin asignaciones por cuadro (candidatos reutilizados).
- **Créditos finales.** Se quitó el texto interno de desarrollo ("Premium Construction
  Evolution RC9", "Antes de publicar…", "Rama maestra de terminación") y la versión de
  respaldo desactualizada (`1.0.0-rc.8`). La versión se inyecta desde `package.json`
  al armar (`__HOJARASCA_VERSION__` en `src/plantilla.html`).
- Versión `1.0.0` en ejecutables, instalador y metadatos.

## Gate y pruebas

- `npm run verify` arma el bundle **antes** de las pruebas (antes sólo lo hacía al
  final, así que las pruebas sobre `index.html` podían validar un bundle viejo).
- `pruebas/version.mjs` (`nivelRc`): las regresiones por RC aceptan la versión final
  `1.0.0` como posterior a cualquier RC (antes exigían literalmente `1.0.0-rc.N`).
- `verificar-release.mjs`: exige que no quede el marcador de versión sin reemplazar ni
  texto interno de desarrollo visible.
- Nueva prueba de humo de partida real `npm run verify:smoke`
  (`pruebas/humo-partida.cjs`): 4 combinaciones calidad × estación × clima, los 16
  lugares, caminata, giros de cámara, cuaderno y guardado. Falla ante cualquier error
  JS, cartel de error, guardado fallido o etiquetas de brújula superpuestas.

## Nota para correr las auditorías de Electron

En entornos donde el sandbox del renderer de Chromium no puede iniciar (algunas
cuentas/VM restringidas de Windows) `loadFile` falla con `ERR_FAILED (-2)` incluso con un
HTML trivial. No es un error del juego: correr las auditorías con
`npx electron --no-sandbox pruebas/<auditoría>.cjs`.
