// Eventos discretos de progreso no deben depender únicamente del autoguardado de 20 s.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
assert.match(main, /else if \(juntado\) \{[\s\S]*?ya\.cantidad[\s\S]*?guardar\(\);[\s\S]*?\}/, 'juntar unidades repetidas no guarda');
assert.match(main, /function atrapar\(pez\)[\s\S]*?progreso\.peces\[pez\.id\][\s\S]*?guardar\(\);[\s\S]*?\}/, 'pesca posterior al primer registro no guarda');
assert.match(main, /function cocinar\(\)[\s\S]*?setTimeout\([\s\S]*?registrar\(rc\.id\)[\s\S]*?guardar\(\);[\s\S]*?1200\);/, 'cocinar no persiste al completar');
assert.match(main, /progreso\.fotos\+\+;\s*guardar\(\);/, 'sacar foto no persiste el contador inmediatamente');
console.log('OK persistencia RC2 · recolección, pesca, cocina y fotos guardan en el evento');
