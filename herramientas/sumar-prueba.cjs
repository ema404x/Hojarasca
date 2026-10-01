// Engancha una prueba nueva al `verify` de package.json, antes del build reproducible.
// Uso: node herramientas/sumar-prueba.cjs <carpeta-del-proyecto> <archivo.mjs>
// OJO: pasar SÓLO el nombre (verificar-x.mjs), sin "pruebas/": la función ya lo antepone.
const fs = require('fs');
const [raiz, prueba] = process.argv.slice(2);
const p = raiz + '/package.json';
let t = fs.readFileSync(p, 'utf8');
if (t.includes(`pruebas/${prueba}`)) { console.log('ya estaba:', prueba); process.exit(0); }
const marca = 'node pruebas/verificar-build-reproducible.mjs';
if (!t.includes(marca)) throw new Error('no encontré el build reproducible en verify');
t = t.replace(marca, `node pruebas/${prueba} && ${marca}`);
fs.writeFileSync(p, t, 'utf8');
console.log('sumada al gate:', prueba);
