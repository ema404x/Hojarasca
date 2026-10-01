#!/bin/bash
# Corre todos los pasos del gate (npm run verify) sin frenar en el primero que falla.
# Uso (desde Git Bash): bash herramientas/gate-seguir.sh <carpeta-del-proyecto> <carpeta-de-salida>
# Deja <salida>/fallas.txt y escribe "pasos: N · fallan: M".
cd "$1"; mkdir -p "$2"
node -e "console.log(require('./package.json').scripts.verify.split(' && ').join('\n'))" > "$2/pasos.txt"
: > "$2/fallas.txt"
while read -r paso; do
  salida=$(eval "$paso" 2>&1); c=$?
  if [ $c -ne 0 ]; then echo "=== FALLA: $paso" >> "$2/fallas.txt"; echo "$salida" | grep -v "^\s*at \|node:internal\|triggerUncaught\|^\s*\^$\|^Node.js" | head -14 >> "$2/fallas.txt"; fi
done < "$2/pasos.txt"
echo "pasos: $(wc -l < "$2/pasos.txt") · fallan: $(grep -c '^=== FALLA' "$2/fallas.txt")"
