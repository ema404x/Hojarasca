// 4.6.0 (arreglo pedido por el usuario): el mate en las invitaciones (src/vecindad-social.js, INVITA_TEXTO). La expresión del
// mate tenía un carácter de retroceso (código 8) en lugar de \b, así que nunca encontraba «mate» en lo que dice el vecino.
// Qué cambia en el juego: cuando un vecino viene a invitarte (iniciativa, tipo «invitar»), si su frase propia de invitación
// (VOCES_SOCIAL[k].viene.invitar) nombra algo que se puede hacer ahora, la usa 6 de cada 10 veces y te invita a ESO. Casi todas
// las frases propias son de mate («¿Un mate?»): antes no se reconocían y el vecino nunca decía la suya (siempre una genérica).
//   · la expresión: \b de verdad, ningún carácter de control en src/ ni en pruebas/;
//   · reconoce «mate», «mates», «¿Un mate?», y no «tomate»;
//   · los vecinos con frase de mate ahora la dicen (y la invitación es al mate); el resto de las invitaciones, como antes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import * as S from '../src/vecindad-social.js';
import { VOCES_SOCIAL } from '../src/vecindad-social-voces.js';
import * as V from '../src/vecindad.js';
import * as A from '../src/aldea.js';
import * as M from '../src/amor.js';

const raiz = new URL('../', import.meta.url);
const leer = (f) => fs.readFileSync(new URL(f, raiz), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

// ---------------------------------------------------------------- la expresión
const fuente = leer('src/vecindad-social.js');
const linea = fuente.split('\n').find((l) => l.startsWith('const INVITA_TEXTO = {'));
ok(linea && linea.includes('mate: /' + String.fromCharCode(92) + 'bmate/i'), 'INVITA_TEXTO.mate es /\\bmate/i (con la barra de verdad)');
const conControl = [];
for (const dir of ['src', 'pruebas']) {
  for (const f of fs.readdirSync(new URL(dir + '/', raiz))) {
    if (!/\.(m?js|cjs)$/.test(f)) continue;
    if (fs.readFileSync(new URL(dir + '/' + f, raiz)).includes(8)) conControl.push(path.join(dir, f));
  }
}
ok(!conControl.length, `ningún archivo de src/ ni de pruebas/ con un carácter de retroceso (${conControl.join(', ') || 'ninguno'})`);
const re = /\bmate/i;
ok(re.test('¿Un mate?') && re.test('¿Tomamos unos mates en el mostrador?') && re.test('Mate y tortas fritas') && !re.test('una ensalada de tomate'),
  'reconoce «mate», «mates» y «Mate», y no «tomate»');

// ---------------------------------------------------------------- en el juego: el vecino dice su frase de mate
const copia = (x) => JSON.parse(JSON.stringify(x));
const a = A.aldeaNueva();
a.pobladores = A.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 }));
a.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
const ALDEA = A.sanearAldea(a);
const partida = () => ({ dia: 3, horas: 11, cosas: { yerba: 5 }, materiales: {}, entradas: {}, aldea: copia(ALDEA), vecindad: V.vecindadNueva(), amor: M.amorNuevo() });
const PERSONAS = V.PERSONAS_VECINDAD;
const conMate = PERSONAS.filter((k) => typeof VOCES_SOCIAL[k]?.viene?.invitar === 'string' && re.test(VOCES_SOCIAL[k].viene.invitar));
ok(conMate.length >= 15, `muchos vecinos invitan con una frase de mate propia (${conMate.length})`);
const p = partida();
for (const k of PERSONAS) for (let d = 1; d <= 16; d++) V.regalar(k, V.PERFILES_VECINOS[k].gustos.encanta[d % 3], p, d, () => 99);
const dichas = new Set(), alMate = { propia: 0, total: 0 };
let invitaciones = 0, rotas = 0;
for (let d = 20; d < 80; d++) {
  for (const k of PERSONAS) {
    for (let h = 9; h < 20; h += 1) {
      const r = S.iniciativa(k, p, { dia: d, hora: h, ritmo: 'animado', semilla: d * 31 + h, marcar: false });
      if (!r || r.tipo !== 'invitar') continue;
      invitaciones++;
      if (!S.esInteraccion(r.id) || !r.renglones.length) rotas++;
      const propia = VOCES_SOCIAL[k]?.viene?.invitar;
      if (r.renglones[0] === propia) {
        dichas.add(k);
        if (conMate.includes(k) && r.id !== 'mate') rotas++;   // si dice la suya de mate, la invitación es al mate
      }
      if (conMate.includes(k) && r.id === 'mate') { alMate.total++; if (r.renglones[0] === propia) alMate.propia++; }
    }
  }
}
ok(invitaciones > 200 && !rotas, `las invitaciones salen enteras y a algo que existe (${invitaciones})`);
const dichasMate = conMate.filter((k) => dichas.has(k));
ok(dichasMate.length >= conMate.length - 3, `los vecinos con frase de mate ahora la dicen (${dichasMate.length} de ${conMate.length}; antes, ninguno)`);
ok(alMate.total > 0 && alMate.propia / alMate.total > 0.4, `cuando te invitan a un mate, muchas veces es con su frase (${alMate.propia} de ${alMate.total})`);

console.log(`  (con frase de mate: ${dichasMate.length} de ${conMate.length}; invitaciones al mate con su frase: ${alMate.propia} de ${alMate.total})`);
console.log(`OK 4.6.0 el mate en las invitaciones (${n} comprobaciones)`);
