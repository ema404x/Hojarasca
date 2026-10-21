---
name: hojarasca-cerrar-version
description: Pasos para cerrar y entregar una versión de Hojarasca (versión, documentos, traspaso, push con etiqueta y zip completo en Descargas). Usala cuando el usuario pida cerrar, subir, empaquetar o armar el zip de una versión.
---

# Cerrar una versión de Hojarasca

Pedir OK al usuario antes del push si no lo pidió. Distinguir siempre lo verificado de lo que no.

1. **Versión:** `package.json` y sólo la raíz de `package-lock.json` (las dos líneas que siguen a `"name": "hojarasca"`), con Node. Nunca desde PowerShell.
2. **Gate:** `node armar.mjs` y `npm run verify` completo de corrido: anotar el número exacto de pasos. `npm run verify:paralelo` sirve durante el trabajo, no para cerrar.
3. **Partidas reales** relacionadas, de a una (skill `hojarasca-partidas`), y las capturas vistas a tamaño completo.
4. **Documentos:**
   - `CAMBIOS_<ver>.md`: qué trae, decisiones, verificación con números, partidas reales, pendientes.
   - Una línea al principio de la lista de `RELEASE_STATUS.md`.
   - Un bloque nuevo arriba de todo en `SEGUIR-EN-OTRA-PC.md`: rama, cómo seguir (`git fetch`, `git checkout <rama>`, `git pull`, `npm install`, `node armar.mjs`, `npm run verify` → «N pasos OK»), qué trae, decisiones a revisar, sin probar, lo que sigue.
5. **Juntar** en la rama de trabajo vigente si corresponde (`git merge --ff-only` o merge normal) y **push** de la rama: `git push origin <rama>`; etiqueta `git tag v<ver>` y `git push origin v<ver>`. Si `git push` falla con "terminal prompts disabled": `GCM_INTERACTIVE=always GIT_TERMINAL_PROMPT=1 git push ...`.
6. **LEEME del paquete** en `herramientas/LEEME-<ver>.txt` (sin tildes ni eñes): qué hay en la carpeta, qué trae, «lo que me falta que mires vos», estado de QA real.
7. **Zip completo** (PowerShell):
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\empaquetar.ps1 . <ver> herramientas\LEEME-<ver>.txt
   ```
   Deja `Hojarasca-<ver>-completo.zip` en Descargas (instalador, portable, depot de Steam, código fuente) y verifica que el `index.html` del ejecutable es el probado. Los `.ps1` necesitan UTF-8 con BOM.
8. Avisarle al usuario: dónde está el zip, la rama y la etiqueta en GitHub, y qué tiene que mirar él.
