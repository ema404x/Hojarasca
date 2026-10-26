#!/bin/bash
# Arma el instalador, el portable, el depot de Steam y el código fuente, y deja
# Hojarasca-<ver>-completo.zip en Descargas.
# Uso: bash herramientas/empaquetar.sh <carpeta-del-proyecto> <versión> <LEEME.txt> [--forzar] [--en-seco]
# 4.11.3 (M11): si hay un Hojarasca.exe abierto, PREGUNTA antes de cerrarlo; --forzar lo cierra sin preguntar; sin terminal interactiva no cierra nada y
# falla con un aviso. --en-seco decide eso y se detiene (no cierra ni arma nada). Y se verifica el index.html del asar como en empaquetar.ps1.
set -e
FORZAR=0; EN_SECO=0
for ARG in "$@"; do case "$ARG" in --forzar) FORZAR=1 ;; --en-seco) EN_SECO=1 ;; esac; done
PROY="$(cd "$1" && pwd)"; VER="$2"; LEEME="$(cd "$(dirname "$3")" && pwd)/$(basename "$3")"
SRC="$(dirname "$PROY")"; CARPETA="$(basename "$PROY")"
NOMBRE_PROCESO="${NOMBRE_PROCESO:-Hojarasca}"
TMP="${TEMP:-/tmp}/hojarasca-paquete"; mkdir -p "$TMP"
cd "$PROY"
if tasklist //FI "IMAGENAME eq $NOMBRE_PROCESO.exe" 2>/dev/null | grep -qi "$NOMBRE_PROCESO.exe"; then
  if [ "$FORZAR" = 1 ]; then DECISION=cerrar
  elif [ -t 0 ]; then
    read -r -p "Hay un $NOMBRE_PROCESO.exe abierto. Si lo cierro se pierde lo que no se haya guardado. ¿Lo cierro? (s/N) " RESP
    case "$RESP" in s|S|si|SI|sí) DECISION=cerrar ;; *) echo "Cancelado: $NOMBRE_PROCESO.exe sigue abierto. Cerralo vos o corré de nuevo con --forzar." >&2; exit 1 ;; esac
  else
    echo "Hay un $NOMBRE_PROCESO.exe abierto y no hay terminal interactiva para preguntar: no lo cierro. Cerralo vos o corré con --forzar." >&2; exit 1
  fi
else DECISION=nada; fi
if [ "$EN_SECO" = 1 ]; then echo "EN SECO: decisión=$DECISION (no se cerró ni se armó nada)"; exit 0; fi
if [ "$DECISION" = cerrar ]; then taskkill //F //IM "$NOMBRE_PROCESO.exe" > /dev/null 2>&1 || true; fi
rm -rf dist
npm run dist:win > "$TMP/dist-$VER.log" 2>&1
test -f "dist/Hojarasca-$VER-Setup-x64.exe"
test -f "dist/Hojarasca-$VER-Portable-x64.exe"
npx @electron/asar list dist/win-unpacked/resources/app.asar | grep -q sincronia-main.cjs
# 4.11.3 (M11): el index.html del ejecutable tiene que ser el que se probó (igual que empaquetar.ps1)
CHK="const a=require('@electron/asar'),fs=require('fs'),c=require('crypto');const h=x=>c.createHash('sha256').update(x).digest('hex');process.stdout.write(h(a.extractFile(process.argv[1],'index.html'))===h(fs.readFileSync(process.argv[2]))?'ASAR OK':'ASAR DISTINTO')"
ASAR_OK="$(node -e "$CHK" dist/win-unpacked/resources/app.asar "$PROY/index.html")"
if [ "$ASAR_OK" != "ASAR OK" ]; then echo "el index.html del ejecutable no es el que se probó" >&2; exit 1; fi
P="$TMP/paquete-$VER"; O="$P/Hojarasca-$VER"
rm -rf "$P"; mkdir -p "$O"
cd "$SRC"
/c/Windows/System32/tar.exe -a -c -f "$O/Hojarasca-$VER-codigo-fuente.zip" --exclude="$CARPETA/node_modules" --exclude="$CARPETA/.git" --exclude="$CARPETA/dist" --exclude="$CARPETA/pruebas/salidas" "$CARPETA"
cd "$PROY/dist"
/c/Windows/System32/tar.exe -a -c -f "$O/Hojarasca-$VER-Steam-depot-win64.zip" -C win-unpacked .
cp "Hojarasca-$VER-Setup-x64.exe" "Hojarasca-$VER-Portable-x64.exe" "$O/"
cp "$LEEME" "$O/LEEME.txt"
cd "$P"
DESC="$USERPROFILE/Downloads"; DESC="$(cygpath -u "$DESC" 2>/dev/null || echo "$DESC")"
rm -f "$DESC/Hojarasca-$VER-completo.zip"
/c/Windows/System32/tar.exe -a -c -f "$DESC/Hojarasca-$VER-completo.zip" "Hojarasca-$VER"
ls -la "$O"
echo "$ASAR_OK · LISTO $VER"
