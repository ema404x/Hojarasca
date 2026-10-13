// 3.8.8: three para las pruebas de Node que arman geometría. El juego no depende del paquete `three` (lo trae en
// three-r186-inline.js): se lo presenta a Node como módulo y se registra un resolvedor que contesta a `import 'three'`.
// Uso: `registrarThree()` antes de importar (con `await import(...)`) lo que use three.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

let hecho = false;
export function registrarThree() {
  if (hecho) return;
  hecho = true;
  const codigo = fs.readFileSync(new URL('../three-r186-inline.js', import.meta.url), 'utf8');
  const caja = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, ArrayBuffer, DataView, Error, TypeError, Symbol, Promise, Reflect, Proxy };
  vm.runInNewContext(codigo + '\n;this.__claves = Object.keys(THREE);', caja);
  const archivo = path.join(os.tmpdir(), `hojarasca-three-ayuda-${process.pid}.mjs`);
  fs.writeFileSync(archivo, codigo + '\nexport const { ' + caja.__claves.join(', ') + ' } = THREE;\n');
  register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) { if (s === 'three') return { url: ${JSON.stringify(pathToFileURL(archivo).href)}, shortCircuit: true }; return n(s, c); }`));
}
