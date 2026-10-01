#!/bin/bash
# Corre las pruebas de humo (Electron) de a UNA; deja un resumen y la salida de cada una.
# Uso: bash herramientas/suite.sh <carpeta-del-proyecto> <carpeta-de-salida> ["lista de humo opcional"]
# Sin lista corre todas menos humo-partida.cjs (tarda 11 min).
# OJO: comparten el localStorage del perfil por defecto de Electron: nunca correr dos a la vez.
cd "$1"; OUT="$2/humo"; mkdir -p "$OUT"; : > "$OUT/resumen.txt"
LISTA="${3:-$(ls pruebas/humo-*.cjs | grep -v 'humo-partida.cjs' | tr '\n' ' ')}"
for f in $LISTA; do
  n=$(basename "$f" .cjs); t0=$(date +%s)
  timeout 900 npx electron "$f" > "$OUT/$n.log" 2>&1; c=$?
  mal=$(grep -c "^ERRORES:" "$OUT/$n.log"); pasos=$(grep -c "^✓" "$OUT/$n.log"); fallas=$(grep -c "^✗" "$OUT/$n.log")
  estado=OK; [ $c -ne 0 ] || [ "$mal" -ne 0 ] && estado=FALLA
  echo "$estado $n · salida $c · ✓$pasos ✗$fallas · $(( $(date +%s) - t0 ))s" >> "$OUT/resumen.txt"
done
echo FIN >> "$OUT/resumen.txt"
grep -v "^OK" "$OUT/resumen.txt"; echo "OK: $(grep -c '^OK' "$OUT/resumen.txt")"
