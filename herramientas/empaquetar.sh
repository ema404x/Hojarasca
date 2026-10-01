#!/bin/bash
# Arma el instalador, el portable, el depot de Steam y el código fuente, y deja
# Hojarasca-<ver>-completo.zip en Descargas.
# Uso: bash herramientas/empaquetar.sh <carpeta-del-proyecto> <versión> <LEEME.txt>
set -e
PROY="$(cd "$1" && pwd)"; VER="$2"; LEEME="$(cd "$(dirname "$3")" && pwd)/$(basename "$3")"
SRC="$(dirname "$PROY")"; CARPETA="$(basename "$PROY")"
TMP="${TEMP:-/tmp}/hojarasca-paquete"; mkdir -p "$TMP"
cd "$PROY"
taskkill //F //IM Hojarasca.exe > /dev/null 2>&1 || true
rm -rf dist
npm run dist:win > "$TMP/dist-$VER.log" 2>&1
test -f "dist/Hojarasca-$VER-Setup-x64.exe"
test -f "dist/Hojarasca-$VER-Portable-x64.exe"
npx @electron/asar list dist/win-unpacked/resources/app.asar | grep -q sincronia-main.cjs
P="$TMP/paquete-$VER"; O="$P/Hojarasca-$VER"
rm -rf "$P"; mkdir -p "$O"
cd "$SRC"
/c/Windows/System32/tar.exe -a -c -f "$O/Hojarasca-$VER-codigo-fuente.zip" --exclude="$CARPETA/node_modules" --exclude="$CARPETA/dist" --exclude="$CARPETA/pruebas/salidas" "$CARPETA"
cd "$PROY/dist"
/c/Windows/System32/tar.exe -a -c -f "$O/Hojarasca-$VER-Steam-depot-win64.zip" -C win-unpacked .
cp "Hojarasca-$VER-Setup-x64.exe" "Hojarasca-$VER-Portable-x64.exe" "$O/"
cp "$LEEME" "$O/LEEME.txt"
cd "$P"
DESC="$USERPROFILE/Downloads"; DESC="$(cygpath -u "$DESC" 2>/dev/null || echo "$DESC")"
rm -f "$DESC/Hojarasca-$VER-completo.zip"
/c/Windows/System32/tar.exe -a -c -f "$DESC/Hojarasca-$VER-completo.zip" "Hojarasca-$VER"
ls -la "$O"
echo "LISTO $VER"
