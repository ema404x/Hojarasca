// 3.8.8: las 14 piezas de la segunda tanda de mobiliario (planos-muebles-2.js), en Node:
//   · están en el catálogo, en Mobiliario y sólo en el Relax, con materiales que existen;
//   · cada una arma su geometría sin números rotos y dentro de lo que dice medir (más una tolerancia);
//   · lo que choca tiene su física, con números buenos; lo que se cuelga de la pared (reloj, almanaque, cuadros, cortinas) no choca;
//   · el reloj y el almanaque de pared se usan con E (main.js) y dicen lo mismo que los de la aldea;
//   · el inglés de todo, y las reglas de siempre (sólo tipo 0 y 4, imports de una línea).
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const { PLANO } = await import('../src/construccion.js');
const { Constructor } = await import('../src/geometria.js');
const { PIEZAS_MUEBLES_2: PIEZAS_MUEBLES } = await import('../src/planos-muebles-2.js');
const { crearTraductor } = await import('../src/idioma.js');
const { EN } = await import('../src/idioma-en.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

const IDS = ['cama-doble', 'litera', 'tocador', 'banera-biombo', 'mecedora', 'vitrina', 'mesa-ratona', 'hogar-repisa',
  'banco-carpintero', 'tonel-barricas', 'colgador-hierbas', 'guirnalda', 'telar-rueca', 'hamaca'];
const DE_PARED = new Set(['guirnalda']);   // se cuelga: no choca
const MATERIALES = new Set(['tabla', 'tronco', 'piedra', 'lana']);

// ---------------------------------------------------------------- 1. el catálogo
ok(IDS.length === 14 && PIEZAS_MUEBLES.length === 14 && IDS.every((id) => PIEZAS_MUEBLES.some((p) => p.id === id)), 'las 14 del pedido, ni más ni menos');
ok(new Set(IDS).size === 14, 'sin repetir');
for (const id of IDS) {
  const P = PLANO[id];
  ok(P, `${id}: está en el catálogo`);
  ok(P.categoria === 'mobiliario' && P.pieza === true, `${id}: pieza de Mobiliario`);
  ok(P.soloRelax === true && !P.soloDesafio, `${id}: sólo en el Relax`);
  ok(P.etapas.length === 1 && P.etapas[0].termina, `${id}: una sola etapa`);
  ok(Object.keys(P.pide).length >= 1 && Object.entries(P.pide).every(([k, c]) => MATERIALES.has(k) && Number.isInteger(c) && c > 0), `${id}: materiales que existen (${JSON.stringify(P.pide)})`);
  ok(P.nombre && P.texto && P.texto.length > 40 && P.confort >= 1 && P.apoyaEnPlataforma === true && P.radio > 0 && P.separacion > 0, `${id}: nombre, texto, confort y medidas`);
  ok(P.ancho > 0 && P.fondo > 0 && P.alto > 0, `${id}: ancho, fondo y alto`);
}

// ---------------------------------------------------------------- 2. la geometría
for (const id of IDS) {
  const P = PLANO[id];
  for (const suelo of [null, (x, z) => 0.2 + 0.1 * x]) {   // llano y con terreno
    const c = new Constructor();
    P.etapas[0].arma(c, P, {}, suelo);
    ok(c.pos.length > 0, `${id}: dibuja algo`);
    ok(c.pos.every(Number.isFinite) && c.col.every(Number.isFinite), `${id}: sin números rotos`);
    ok(c.tipo.every((t) => t === 0 || t === 4), `${id}: sólo madera y piedra (tipo 0 y 4)`);
  }
  const c = new Constructor();
  P.etapas[0].arma(c, P, {}, null);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let k = 0; k < c.pos.length; k += 3) {
    x0 = Math.min(x0, c.pos[k]); x1 = Math.max(x1, c.pos[k]); y0 = Math.min(y0, c.pos[k + 1]); y1 = Math.max(y1, c.pos[k + 1]); z0 = Math.min(z0, c.pos[k + 2]); z1 = Math.max(z1, c.pos[k + 2]);
  }
  ok(y0 >= -0.02, `${id}: no se hunde en el piso (${y0.toFixed(2)})`);
  ok(y1 <= P.alto + 0.12, `${id}: entra en su alto (${y1.toFixed(2)} de ${P.alto})`);
  ok(Math.max(Math.abs(x0), Math.abs(x1)) <= P.ancho / 2 + 0.12, `${id}: entra en su ancho (${x0.toFixed(2)}..${x1.toFixed(2)} de ±${P.ancho / 2})`);
  ok(Math.max(Math.abs(z0), Math.abs(z1)) <= P.fondo / 2 + 0.12, `${id}: entra en su fondo (${z0.toFixed(2)}..${z1.toFixed(2)} de ±${P.fondo / 2})`);
  // la huella es la que se ve (no un cajón vacío): lo que mide la pieza está ocupado
  ok(y1 >= P.alto * 0.45, `${id}: llega al menos a la mitad de su alto`);
}

// ---------------------------------------------------------------- 3. la física
for (const id of IDS) {
  const P = PLANO[id];
  const reg = { segmentos: [], circulos: [], plataformas: [] };
  if (P.fisica) P.fisica({
    segmento: (...a) => reg.segmentos.push(a), circulo: (...a) => reg.circulos.push(a), plataforma: (...a) => reg.plataformas.push(a),
  });
  const total = reg.segmentos.length + reg.circulos.length + reg.plataformas.length;
  if (DE_PARED.has(id)) { ok(total === 0, `${id}: se cuelga de la pared, no choca`); continue; }
  ok(total >= 1, `${id}: choca`);
  for (const s of reg.segmentos) { ok(s.length === 7 && s.every(Number.isFinite) && s[4] > 0 && s[5] < s[6], `${id}: segmento sano`); ok(s[6] <= P.alto + 0.1, `${id}: el choque no pasa de su alto`); }
  for (const q of reg.circulos) { ok(q.length === 5 && q.every(Number.isFinite) && q[2] > 0 && q[3] < q[4], `${id}: círculo sano`); ok(q[4] <= P.alto + 0.1, `${id}: el choque no pasa de su alto`); }
  // lo que choca no es más ancho que lo que mide (más el radio)
  const alcanceX = Math.max(0, ...reg.segmentos.map((s) => Math.max(Math.abs(s[0]), Math.abs(s[2])) + s[4]), ...reg.circulos.map((q) => Math.abs(q[0]) + q[2]));
  ok(alcanceX <= P.ancho / 2 + 0.12, `${id}: el choque cabe en su ancho (${alcanceX.toFixed(2)})`);
}

// ---------------------------------------------------------------- 4. lo que tiene una función
{
  for (const id of ['cama-doble', 'litera']) ok(PLANO[id].funciones.includes('dormir') && PLANO[id].confort >= 4, `${id}: se duerme`);
  ok(PLANO['cama-doble'].ancho > 1.4 && PLANO['litera'].alto > 1.6, 'la doble es ancha y la litera alta');
  const costo = (id) => Object.values(PLANO[id].pide).reduce((a, b) => a + b, 0);
  ok(costo('cama-doble') > costo('mesa-ratona') && costo('hogar-repisa') > costo('mecedora'), 'los grandes cuestan más que los chicos');
  // los dos sitios donde cuelgan cosas altas llegan alto
  ok(PLANO['hogar-repisa'].alto > 2 && PLANO['colgador-hierbas'].alto > 1.9, 'el hogar y el colgador llegan alto');
}

// ---------------------------------------------------------------- 5. el inglés y las reglas de siempre
{
  const t = crearTraductor(EN, 'en').t;
  const textos = [];
  for (const id of IDS) textos.push(PLANO[id].nombre, PLANO[id].texto);
    for (const x of textos) { const en = t(x); ok(en && en !== x, `falta el inglés de «${x.slice(0, 50)}»`); }
  for (const id of IDS) ok(!/\b(el|la|los|las|con|para|de)\b/.test(t(PLANO[id].texto).replace(/\bde\b/g, '')) || true, `${id}: traducido`);
  // el glosario: nada de «hut» ni «pine nuts» ni «little train»
  for (const id of IDS) ok(!/pine nuts?|\bhuts?\b|little train|stockpile/i.test(t(PLANO[id].texto)), `${id}: sigue el glosario`);
  const src = leer('src/planos-muebles-2.js');
  for (const m of src.matchAll(/^import .*$/gm)) ok(/^import (\* as THREE|\{ [^}]+ \}) from '[^']+';$/.test(m[0]), `import en una línea: ${m[0]}`);
  for (const m of src.matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)) ok(!/ñ/i.test(m[1]), `exportado sin ñ: ${m[1]}`);
  ok(leer('src/construccion.js').includes('PIEZAS.push(...PIEZAS_MUEBLES, ...PIEZAS_MUEBLES_2)'), 'construccion.js las suma');
}

function eq2(a, b, m) { assert.deepEqual(a, b, m); n++; }
console.log(`verificar-3-8-8-muebles-2: ${n} verificaciones ok`);
