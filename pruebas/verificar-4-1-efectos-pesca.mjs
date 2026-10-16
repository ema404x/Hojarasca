// 4.1 (F3): el efecto de los rasgos de Bruno sobre la PESCA (src/creador-efectos.js, mundoPesca en src/main.js, la espera del pique en src/pesca.js).
//  · sin Bruno creado, o en el Desafío, el factor del pique es exactamente 1;
//  · cada rasgo de pesca del catálogo mueve el pique en el sentido que dice (más pesca = espera más corta);
//  · en las 56 250 combinaciones el factor queda entre 0,8 y 1,2 (±20 %, el tope) y coincide con el efecto aplicado del catálogo;
//  · el resultado no depende de cuántas veces se pregunte (se memoiza por objeto de Bruno y se recalcula cuando Bruno cambia);
//  · main.js lo multiplica en la cadena de factores del pique SIN comentar el resto de la línea (clavar y línea siguen), y pesca.js sigue usando `mundo.pique`.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const E = await imp('creador-efectos.js'), K = await imp('creador-catalogo.js'), C = await imp('creador-personaje.js');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const cerca = (a, b) => Math.abs(a - b) < 1e-9;
const bruno = (parcial = {}) => ({ ...C.genomaDefecto(), creado: true, ...parcial });
const neutro = { personalidad: 'curioso', oficio: 'contador', gustos: ['mate', 'libros'], hobby: 'fotografia', virtud: 'resistente', defecto: 'distraido' };   // nada de pesca
const f = (parcial) => E.factorPiqueBruno(bruno({ ...neutro, ...parcial }));

// ---------------------------------------------------------------- 1. cuándo valen
ok(E.factorPiqueBruno(null) === 1 && E.factorPiqueBruno(undefined) === 1 && E.factorPiqueBruno(7) === 1, 'sin Bruno (o roto), el pique no cambia');
ok(E.factorPiqueBruno({ ...bruno({ virtud: 'paciente' }), creado: false }) === 1, 'Bruno sin crear: el pique no cambia');
ok(E.factorPiqueBruno(bruno({ virtud: 'paciente' }), true) === 1, 'en el Desafío los efectos están apagados');
ok(f({}) === 1, 'la base de comparación no toca la pesca');

// ---------------------------------------------------------------- 2. cada rasgo de pesca
ok(cerca(f({ virtud: 'paciente' }), 0.9) && cerca(f({ virtud: 'madrugador' }), 0.9), 'Paciente y Madrugador: el pique llega un 10 % antes');
ok(cerca(f({ personalidad: 'tranquilo' }), 0.9) && cerca(f({ hobby: 'pesca' }), 0.9), 'Tranquilo y el hobby de pesca: un 10 % antes');
ok(cerca(f({ defecto: 'impaciente' }), 1.1) && cerca(f({ personalidad: 'metodico' }), 1.1), 'Impaciente y Metódico: un 10 % más de espera');
ok(cerca(f({ oficio: 'mensajero' }), 1.1) && cerca(f({ oficio: 'docente' }), 1.1), 'Mensajero y Docente: un 10 % más de espera');
ok(cerca(f({ virtud: 'paciente', personalidad: 'tranquilo' }), 0.8), 'dos pros de pesca: 20 % antes');
ok(cerca(f({ virtud: 'paciente', personalidad: 'tranquilo', hobby: 'pesca' }), 0.8), 'tres pros no pasan del tope: 20 % antes');
ok(cerca(f({ defecto: 'impaciente', personalidad: 'metodico', oficio: 'mensajero' }), 1.2), 'tres contras no pasan del tope: 20 % más de espera');
ok(cerca(f({ virtud: 'paciente', defecto: 'impaciente' }), 1), 'un pro y un contra se compensan');

// ---------------------------------------------------------------- 3. las 56 250 combinaciones
let n = 0, minimo = 9, maximo = 0;
const gustos2 = []; for (let i = 0; i < K.GUSTOS.length; i++) for (let j = i + 1; j < K.GUSTOS.length; j++) gustos2.push([K.GUSTOS[i].id, K.GUSTOS[j].id]);
for (const personalidad of K.PERSONALIDADES) for (const oficio of K.OFICIOS) for (const gustos of gustos2) for (const hobby of K.HOBBIES) for (const virtud of K.VIRTUDES) for (const defecto of K.DEFECTOS) {
  const b = bruno({ personalidad: personalidad.id, oficio: oficio.id, gustos, hobby: hobby.id, virtud: virtud.id, defecto: defecto.id });
  const x = E.factorPiqueBruno(b);
  n++; minimo = Math.min(minimo, x); maximo = Math.max(maximo, x);
  if (!cerca(x, 1 - C.efectosAplicados(b).pesca * 0.05) || x < 0.8 - 1e-9 || x > 1.2 + 1e-9) assert.fail(`combinación fuera de regla: ${JSON.stringify(b)} → ${x}`);
  if (E.factorPiqueBruno(b, true) !== 1) assert.fail('el Desafío debería dar 1');
}
ok(n === 56250, `recorrió las 56 250 combinaciones (${n})`);
ok(cerca(minimo, 0.8) && cerca(maximo, 1.2), 'el factor llega a 0,8 y a 1,2 y nunca los pasa');

// ---------------------------------------------------------------- 4. memoria
const b1 = bruno({ ...neutro, virtud: 'paciente' }), b2 = { ...b1, virtud: 'resistente', defecto: 'impaciente' };
ok(cerca(E.factorPiqueBruno(b1), 0.9) && cerca(E.factorPiqueBruno(b1), 0.9), 'preguntar dos veces da lo mismo');
ok(cerca(E.factorPiqueBruno(b2), 1.1) && cerca(E.factorPiqueBruno(b1), 0.9), 'si Bruno cambia (objeto nuevo), se recalcula; al volver al anterior, también');
ok(cerca(E.factorPiqueBruno(b1, true), 1) && cerca(E.factorPiqueBruno(b1, false), 0.9), 'cambiar el modo recalcula (Desafío y Relax no se pisan)');

// ---------------------------------------------------------------- 5. el enchufe
const main = leer('src/main.js');
const linea = main.split('\n').find((l) => l.includes('ctxPesca.pique ='));
ok(!!linea && /^\s*ctxPesca\.pique = factorPique\(nPesca\) \* factorPiqueBruno\(progreso\.personal\?\.bruno, esDesafio\);/.test(linea), 'mundoPesca multiplica el factor de Bruno en el pique');
ok(/;\s+ctxPesca\.clavar = segundosParaClavar\(nPesca\); ctxPesca\.linea = factorLinea\(nPesca\);/.test(linea.split('//')[0]), 'clavar y línea siguen en la línea, fuera del comentario');
ok(main.includes('factorPiqueBruno } from \'./creador-efectos.js\';'), 'main.js importa el factor en una línea');
const pesca = leer('src/pesca.js');
ok(/if \(mundo\.pique\) espera \*= mundo\.pique;/.test(pesca), 'pesca.js sigue multiplicando la espera por mundo.pique');
ok(!/creador-efectos/.test(pesca), 'pesca.js no sabe nada de Bruno (el contexto es lo único que cruza)');

console.log(`verificar-4-1-efectos-pesca: ${pasos} verificaciones OK`);
