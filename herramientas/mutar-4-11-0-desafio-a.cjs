// 4.11.0 (desafío A): rompe a propósito cada regla y confirma que verificar-4-11-0-desafio-a.mjs falla.
// Cada mutación cambia una línea de un archivo, corre la prueba y deja el archivo como estaba.
// Uso: node herramientas/mutar-4-11-0-desafio-a.cjs   (SOLO=<parte del nombre> para correr unas pocas)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const prueba = path.join(raiz, 'pruebas', 'verificar-4-11-0-desafio-a.mjs');

const R = 'src/desafio-reglas.js', D = 'src/desafio.js', P = 'src/desafio-bestiario-premia.js', M = 'src/desafio-meta.js';
const MJ = 'src/desafio-meta-juego.js', PA = 'src/desafio-meta-pantalla.js', MA = 'src/main.js';
const MUTACIONES = [
  // ---- la pesadilla con tope propio
  ['el tope de la pesadilla es 31', R, 'export const TOPE_OLEADA_PESADILLA = 31;', 'export const TOPE_OLEADA_PESADILLA = 24;'],
  ['el tope de siempre es 24', R, 'export const TOPE_OLEADA = 24;', 'export const TOPE_OLEADA = 25;'],
  ['sólo la pesadilla sube el tope', R, "partidaEfectos?.modo === 'pesadilla' ? TOPE_OLEADA_PESADILLA : TOPE_OLEADA", 'partidaEfectos ? TOPE_OLEADA_PESADILLA : TOPE_OLEADA'],
  ['la pesadilla sube el tope (no al revés)', R, "partidaEfectos?.modo === 'pesadilla' ? TOPE_OLEADA_PESADILLA : TOPE_OLEADA", "partidaEfectos?.modo === 'pesadilla' ? TOPE_OLEADA : TOPE_OLEADA"],
  ['la oleada topa en el tope del modo', R, 'Math.min(topeOleada(), Math.round(', 'Math.min(24, Math.round('],
  ['la base admite el tope del modo', D, 'ataques.lleno(def, topeOleada())', 'ataques.lleno(def, 24)'],
  ['la cadena de noches usa el tope del modo', D, 'efectoCadena(cadenaD(), n), topeOleada())', 'efectoCadena(cadenaD(), n), 24)'],
  // ---- el Mandamás
  ['el Mandamás se estudia con 1, 2 y 4', P, 'export const UMBRALES_PROPIOS = { jefe: [1, 2, 4] };', 'export const UMBRALES_PROPIOS = { jefe: [5, 15, 40] };'],
  ['el tercer estudio del Mandamás es a las 4 caídas', P, 'jefe: [1, 2, 4]', 'jefe: [1, 2, 3]'],
  ['el premio del tercero es +5 %', P, 'export const DANO_ESTUDIADO = 0.05;', 'export const DANO_ESTUDIADO = 0.1;'],
  // ---- noches más largas con la hora de tu reloj
  ['con el reloj, la regla no vale', M, "if (entorno?.relojReal && todas.some((k) => ALARGAN_LA_NOCHE.includes(k)))", 'if (false)'],
  ['«Manos llenas» también se apaga', M, "export const ALARGAN_LA_NOCHE = ['nochesLargas', 'avaro'];", "export const ALARGAN_LA_NOCHE = ['nochesLargas'];"],
  ['«Noches más largas» también se apaga', M, "export const ALARGAN_LA_NOCHE = ['nochesLargas', 'avaro'];", "export const ALARGAN_LA_NOCHE = ['avaro'];"],
  ['el motivo dice lo del reloj', M, "export const MOTIVO_RELOJ = 'Con la hora de tu reloj no se pueden alargar las noches';", "export const MOTIVO_RELOJ = 'No se puede';"],
  ['empezar con reloj no vale', MJ, '{ relojReal: !!ctx.relojReal?.() }', '{}'],
  ['la pantalla sabe del reloj', PA, 'const entorno = { relojReal: !!api.relojReal?.() };', 'const entorno = {};'],
  ['el motivo se escribe debajo del chip de las ventajas', PA, 'caja.appendChild(celda(b, bloq));', 'caja.appendChild(b);'],
  ['el motivo se escribe debajo del chip de las reglas', PA, 'cajaR.appendChild(celda(b, bloq));', 'cajaR.appendChild(b);'],
  ['la celda lleva el motivo', PA, "if (motivo) c.appendChild(nodo('p', 'np-motivo', motivo));", ''],
  ['el motivo del modo bloqueado está a la vista', PA, "if (!sinFin && !meta.desbloqueos.pesadilla) cont.appendChild(nodo('p', 'np-motivo',", "if (false) cont.appendChild(nodo('p', 'np-motivo',"],
  ['el juego dice si va con el reloj (meta)', MA, "relojReal: () => ajustes.duracion === 'reloj',   // 4.11.0", "relojReal: () => false,   // 4.11.0"],
  ['el juego dice si va con el reloj (pantalla)', MA, "esSinFin: () => esSinFin, relojReal: () => ajustes.duracion === 'reloj',", 'esSinFin: () => esSinFin, relojReal: () => false,'],
];

const solo = process.env.SOLO;
let fallo = 0, corridas = 0;
for (const [nombre, archivo, de, a] of MUTACIONES) {
  if (solo && !nombre.includes(solo)) continue;
  const ruta = path.join(raiz, archivo);
  const original = fs.readFileSync(ruta, 'utf8');
  if (!original.includes(de)) { console.log(`NO ENCONTRADA   ${nombre}`); fallo++; continue; }
  corridas++;
  fs.writeFileSync(ruta, original.replace(de, () => a), 'utf8');
  let r;
  try { r = spawnSync(process.execPath, [prueba], { cwd: raiz, encoding: 'utf8', timeout: 120000 }); }
  finally { fs.writeFileSync(ruta, original, 'utf8'); }
  const cae = r.status !== 0;
  console.log(`${cae ? 'detectada      ' : 'SE ESCAPO      '} ${nombre}`);
  if (!cae) fallo++;
}
console.log(fallo ? `\n${fallo} mutaciones sin detectar` : `\ntodas las mutaciones (${corridas}) se detectan`);
process.exit(fallo ? 1 : 0);
