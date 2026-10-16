// 4.1 (F3): el efecto de los rasgos de Bruno sobre el ABRIGO (src/creador-efectos.js, templarNoche en src/personal-personaje.js, dormir en src/main.js).
//  · sin Bruno creado, o en el Desafío, el abrigo extra es 0 (las partidas viejas y las pruebas viejas no cambian);
//  · en las 56 250 combinaciones el abrigo extra es -1, 0 o +1 punto y coincide con el efecto aplicado del catálogo (tope ±1 punto);
//  · cada rasgo de abrigo del catálogo pesa lo que dice (Resistente +1, Friolero -1, ...);
//  · `templarNoche` con el extra: el umbral de 4 puntos se mueve ±1, y sin extra es EXACTAMENTE igual que antes;
//  · main.js lo usa al dormir, con el import en una línea.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const E = await imp('creador-efectos.js'), K = await imp('creador-catalogo.js'), C = await imp('creador-personaje.js'), P = await imp('personal-personaje.js');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const bruno = (parcial = {}) => ({ ...C.genomaDefecto(), creado: true, ...parcial });

// ---------------------------------------------------------------- 1. cuándo valen
ok(E.abrigoExtra(null) === 0 && E.abrigoExtra(undefined) === 0 && E.abrigoExtra('roto') === 0, 'sin Bruno (o roto), el abrigo extra es 0');
ok(E.abrigoExtra({ ...C.genomaDefecto(), defecto: 'friolero', creado: false }) === 0, 'Bruno sin crear: sus rasgos no valen todavía');
ok(E.abrigoExtra(bruno({ defecto: 'friolero' }), true) === 0, 'en el Desafío los efectos están apagados');
ok(E.abrigoExtra(bruno({ defecto: 'friolero' }), false) === -1, 'en el Relax, con Bruno creado, el Friolero resta un punto');

// ---------------------------------------------------------------- 2. cada rasgo de abrigo del catálogo
const neutro = { personalidad: 'tranquilo', oficio: 'contador', gustos: ['mate', 'libros'], hobby: 'fotografia', virtud: 'ahorrativo', defecto: 'dormilon' };   // abrigo: +2 pasos de Ahorrativo, sin contra de abrigo
const conAbrigo = (parcial) => E.abrigoExtra(bruno({ ...neutro, virtud: 'paciente', defecto: 'impaciente', ...parcial }));
ok(conAbrigo({}) === 0, 'la base de comparación no toca el abrigo');
ok(conAbrigo({ virtud: 'resistente' }) === 1 && conAbrigo({ virtud: 'ahorrativo' }) === 1, 'Resistente y Ahorrativo suman un punto');
ok(conAbrigo({ defecto: 'friolero' }) === -1, 'Friolero resta un punto');
ok(conAbrigo({ personalidad: 'metodico' }) === 1 && conAbrigo({ personalidad: 'reservado' }) === 1 && conAbrigo({ personalidad: 'curioso' }) === -1, 'Metódico y Reservado suman, Curioso resta');
ok(conAbrigo({ oficio: 'mensajero' }) === 1 && conAbrigo({ oficio: 'programador' }) === -1, 'Mensajero suma, Programador resta');
ok(conAbrigo({ gustos: ['lluvia', 'mate'] }) === -1 && conAbrigo({ hobby: 'aves' }) === -1, 'el gusto por la lluvia y observar aves restan');
ok(conAbrigo({ virtud: 'resistente', personalidad: 'metodico' }) === 1, 'dos pros de abrigo no pasan del tope de +1 punto');
ok(conAbrigo({ defecto: 'friolero', personalidad: 'curioso', hobby: 'aves' }) === -1, 'tres contras de abrigo no pasan del tope de -1 punto');
ok(conAbrigo({ virtud: 'resistente', defecto: 'friolero' }) === 0, 'un pro y un contra se compensan');

// ---------------------------------------------------------------- 3. las 56 250 combinaciones
let n = 0, minimo = 9, maximo = -9, distintas = 0;
const gustos2 = []; for (let i = 0; i < K.GUSTOS.length; i++) for (let j = i + 1; j < K.GUSTOS.length; j++) gustos2.push([K.GUSTOS[i].id, K.GUSTOS[j].id]);
for (const personalidad of K.PERSONALIDADES) for (const oficio of K.OFICIOS) for (const gustos of gustos2) for (const hobby of K.HOBBIES) for (const virtud of K.VIRTUDES) for (const defecto of K.DEFECTOS) {
  const b = bruno({ personalidad: personalidad.id, oficio: oficio.id, gustos, hobby: hobby.id, virtud: virtud.id, defecto: defecto.id });
  const x = E.abrigoExtra(b);
  n++; if (x < minimo) minimo = x; if (x > maximo) maximo = x;
  if (!Number.isInteger(x) || Math.abs(x) > 1 || x * 2 !== C.efectosAplicados(b).abrigo) { assert.fail(`combinación fuera de regla: ${JSON.stringify(b)} → ${x}`); }
  if (E.abrigoExtra(b, true) !== 0) assert.fail('el Desafío debería dar 0');
}
ok(n === 56250, `recorrió las 56 250 combinaciones (${n})`);
ok(minimo === -1 && maximo === 1, 'el abrigo extra llega a -1 y a +1 y nunca los pasa');

// ---------------------------------------------------------------- 4. templarNoche con el extra
const ropa = (o) => ({ ...P.personajeDefecto(), poncho: false, gorro: false, bufanda: false, guantes: false, ...o });
const r3 = ropa({ poncho: true, gorro: true }), r4 = ropa({ poncho: true, gorro: true, bufanda: true }), r2 = ropa({ gorro: true, bufanda: true });
ok(P.abrigoDeRopa(r3) === 3 && P.abrigoDeRopa(r4) === 4 && P.abrigoDeRopa(r2) === 2, 'la ropa de prueba abriga 3, 4 y 2 puntos');
for (const como of ['frio', 'fresco', 'normal', 'calentito']) {
  for (const r of [r2, r3, r4]) ok(P.templarNoche(como, r) === P.templarNoche(como, r, 0), `sin extra, templarNoche es igual que antes (${como}, ${P.abrigoDeRopa(r)} puntos)`);
}
ok(P.templarNoche('frio', r4) === 'fresco' && P.templarNoche('fresco', r4) === 'normal', 'con 4 puntos, mejora un escalón (como siempre)');
ok(P.templarNoche('frio', r3, 1) === 'fresco' && P.templarNoche('fresco', r3, 1) === 'normal', 'con 3 puntos y un rasgo de +1, ahora también mejora');
ok(P.templarNoche('frio', r4, -1) === 'frio' && P.templarNoche('fresco', r4, -1) === 'fresco', 'con 4 puntos y un rasgo de -1, ya no alcanza');
ok(P.templarNoche('frio', r2, 1) === 'frio', 'con 2 puntos, aun con +1, no alcanza (el gorro y la bufanda solos siguen sin templar)');
ok(P.templarNoche('frio', r4, 1) === 'fresco', 'con 5 puntos sigue siendo un solo escalón, no dos');
ok(P.templarNoche('normal', r3, 1) === 'normal' && P.templarNoche('calentito', r3, 1) === 'calentito', 'lo que ya era bueno queda igual');
ok(P.templarNoche('frio', r4, 'basura') === 'fresco' && P.templarNoche('frio', r3, NaN) === 'frio', 'un extra roto cuenta como 0');

// ---------------------------------------------------------------- 5. el enchufe en main.js
const main = leer('src/main.js');
ok(main.includes("import { abrigoExtra } from './creador-efectos.js';"), 'main.js importa abrigoExtra en una línea');
ok(/templarNoche\(comoSinRopa, progreso\.personal\?\.personaje, abrigoExtra\(progreso\.personal\?\.bruno, esDesafio\)\)/.test(main), 'dormir usa el abrigo extra de Bruno (apagado en el Desafío)');
ok(!/^import .*\/\/.*$/m.test(fs.readFileSync(path.join(raiz, 'src/creador-efectos.js'), 'utf8')), 'el módulo no tiene imports con comentario (armar.mjs sólo entiende una línea)');

console.log(`verificar-4-1-efectos-abrigo: ${pasos} verificaciones OK`);
