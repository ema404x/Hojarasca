// 4.1 (F3): el efecto de los rasgos de Bruno sobre el CUADERNO (src/creador-efectos.js, la mirada al cielo en src/main.js).
//  · lo único del cuaderno que tiene un tiempo de observación es el cielo (constelaciones y luna llena, 2,2 s de mirada): ahí actúa el factor;
//  · sin Bruno creado, o en el Desafío, el factor es exactamente 1;
//  · cada rasgo de cuaderno del catálogo mueve el factor en el sentido que dice; en las 56 250 combinaciones queda entre 0,8 y 1,2;
//  · simulado: con +20 % una constelación se anota en menos cuadros de mirada que con 0 y con -20 % en más (y siempre se puede anotar: nunca se bloquea);
//  · main.js lo multiplica en las DOS cuentas de mirada del cielo, junto al multiplicador de la pareja, y nada más (las entradas de un golpe no cambian).
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
const neutro = { personalidad: 'tranquilo', oficio: 'contador', gustos: ['mate', 'libros'], hobby: 'fotografia', virtud: 'resistente', defecto: 'friolero' };   // nada de cuaderno
const f = (parcial) => E.factorCuadernoBruno(bruno({ ...neutro, ...parcial }));

// ---------------------------------------------------------------- 1. cuándo valen
ok(E.factorCuadernoBruno(null) === 1 && E.factorCuadernoBruno('x') === 1, 'sin Bruno (o roto), el cuaderno no cambia');
ok(E.factorCuadernoBruno({ ...bruno({ hobby: 'aves' }), creado: false }) === 1, 'Bruno sin crear: no cambia');
ok(E.factorCuadernoBruno(bruno({ hobby: 'aves' }), true) === 1, 'en el Desafío los efectos están apagados');
ok(f({}) === 1, 'la base de comparación no toca el cuaderno');

// ---------------------------------------------------------------- 2. cada rasgo de cuaderno
ok(cerca(f({ personalidad: 'curioso' }), 1.1) && cerca(f({ oficio: 'programador' }), 1.1) && cerca(f({ oficio: 'tecnico-sonido' }), 1.1) && cerca(f({ hobby: 'aves' }), 1.1), 'Curioso, Programador, Técnico de sonido y Observar aves: anota un 10 % más rápido');
ok(cerca(f({ personalidad: 'sociable' }), 0.9) && cerca(f({ oficio: 'cocinero' }), 0.9) && cerca(f({ hobby: 'pesca' }), 0.9) && cerca(f({ defecto: 'distraido' }), 0.9) && cerca(f({ defecto: 'dormilon' }), 0.9), 'Sociable, Cocinero, el hobby de pesca, Distraído y Dormilón: un 10 % más lento');
ok(cerca(f({ personalidad: 'curioso', hobby: 'aves' }), 1.2) && cerca(f({ personalidad: 'curioso', hobby: 'aves', oficio: 'programador' }), 1.2), 'dos o tres pros llegan al tope de +20 % y no lo pasan');
ok(cerca(f({ defecto: 'distraido', personalidad: 'sociable', hobby: 'pesca' }), 0.8), 'tres contras no pasan del tope de -20 %');
ok(cerca(f({ personalidad: 'curioso', defecto: 'distraido' }), 1), 'un pro y un contra se compensan');

// ---------------------------------------------------------------- 3. las 56 250 combinaciones
let n = 0, minimo = 9, maximo = 0;
const gustos2 = []; for (let i = 0; i < K.GUSTOS.length; i++) for (let j = i + 1; j < K.GUSTOS.length; j++) gustos2.push([K.GUSTOS[i].id, K.GUSTOS[j].id]);
for (const personalidad of K.PERSONALIDADES) for (const oficio of K.OFICIOS) for (const gustos of gustos2) for (const hobby of K.HOBBIES) for (const virtud of K.VIRTUDES) for (const defecto of K.DEFECTOS) {
  const b = bruno({ personalidad: personalidad.id, oficio: oficio.id, gustos, hobby: hobby.id, virtud: virtud.id, defecto: defecto.id });
  const x = E.factorCuadernoBruno(b);
  n++; minimo = Math.min(minimo, x); maximo = Math.max(maximo, x);
  if (!cerca(x, 1 + C.efectosAplicados(b).cuaderno * 0.05) || x < 0.8 - 1e-9 || x > 1.2 + 1e-9) assert.fail(`combinación fuera de regla: ${JSON.stringify(b)} → ${x}`);
  if (E.factorCuadernoBruno(b, true) !== 1) assert.fail('el Desafío debería dar 1');
}
ok(n === 56250, `recorrió las 56 250 combinaciones (${n})`);
ok(cerca(minimo, 0.8) && cerca(maximo, 1.2), 'el factor llega a 0,8 y a 1,2 y nunca los pasa');

// ---------------------------------------------------------------- 4. simulación de la mirada (la misma cuenta que actualizarCielo)
const cuantasMiradas = (factor, zoom = false, pareja = 1) => {
  let t = 0, k = 0;
  while (t <= 2.2) { t += 0.2 * (zoom ? 2 : 1) * pareja * factor; k++; if (k > 1000) return Infinity; }
  return k;
};
const rapido = cuantasMiradas(1.2), normal = cuantasMiradas(1), lento = cuantasMiradas(0.8);
ok(normal === 12 && rapido < normal && lento > normal, `anotar una constelación: ${rapido} miradas con +20 %, ${normal} normal, ${lento} con -20 %`);
ok(Number.isFinite(lento) && lento <= 15, 'con -20 % sigue siendo posible y cuesta a lo sumo 3 miradas más (unas décimas de segundo)');
ok(cuantasMiradas(1.2, true) < cuantasMiradas(1, true) && cuantasMiradas(1.2, false, 1.5) < cuantasMiradas(1, false, 1.5), 'se combina con el zoom y con los ojos de noche de la pareja');

// ---------------------------------------------------------------- 5. el enchufe
const main = leer('src/main.js');
ok(main.includes('factorCuadernoBruno } from \'./creador-efectos.js\';'), 'main.js importa el factor en una línea');
const usos = main.split('\n').filter((l) => l.includes('factorCuadernoBruno(progreso.personal?.bruno, esDesafio)'));
ok(usos.length === 2 && usos.every((l) => l.includes('amorJuego?.bonos().cielo')), 'se usa en las dos cuentas de mirada del cielo, junto al multiplicador de la pareja');
ok(usos.some((l) => l.includes('mirandoLuna')) && usos.some((l) => l.includes('tiempoMirando')), 'una es la luna llena y la otra las constelaciones');
ok(main.split('\n').filter((l) => l.includes('factorCuadernoBruno(')).length === 2, 'no se usa en ningún otro lado (las entradas de un golpe no cambian)');

console.log(`verificar-4-1-efectos-cuaderno: ${pasos} verificaciones OK`);
