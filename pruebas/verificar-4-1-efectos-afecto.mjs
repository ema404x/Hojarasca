// 4.1 (F3): el efecto de los rasgos y los gustos de Bruno sobre el AFECTO con los vecinos (src/creador-efectos.js + el enganche de src/vecindad.js).
//  · sin el enganche (las pruebas viejas, el Desafío) la amistad suma exactamente lo de siempre;
//  · sólo se escalan las GANANCIAS: lo que resta una discusión no cambia, y una ganancia nunca se vuelve pérdida;
//  · el redondeo es determinista y en promedio da justo el porcentaje (±20 % de tope);
//  · los gustos compartidos suman SÓLO con los vecinos que los tienen (la tabla de GUSTOS_VECINOS_BRUNO.md está completa y alineada con la vecindad);
//  · lo que se guarda sigue entero y saneado (los puntos de amistad son enteros);
//  · main.js lo fija una vez, en una línea, y lo apaga en el Desafío.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const E = await imp('creador-efectos.js'), K = await imp('creador-catalogo.js'), C = await imp('creador-personaje.js'), V = await imp('vecindad.js');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const casi = (a, b, tol) => Math.abs(a - b) <= tol;
const bruno = (parcial = {}) => ({ ...C.genomaDefecto(), creado: true, ...parcial });
// neutro en afecto: ningún rasgo de afecto (tranquilo -2 se compensa con simpático +2), gustos sin coincidencias salvo que se pidan
const base = { personalidad: 'metodico', oficio: 'contador', hobby: 'fotografia', virtud: 'paciente', defecto: 'impaciente', gustos: ['trenes', 'asado'] };

// ---------------------------------------------------------------- 1. la tabla de vecinos
ok(V.PERSONAS_VECINDAD.every((k) => Array.isArray(K.GUSTOS_DE_VECINOS[k]) && K.GUSTOS_DE_VECINOS[k].length >= 1), 'todo vecino de la vecindad tiene gustos en la tabla');
ok(Object.keys(K.GUSTOS_DE_VECINOS).every((k) => V.esPersonaVecindad(k)), 'la tabla no tiene claves que la vecindad no conozca');
ok(Object.values(K.GUSTOS_DE_VECINOS).every((l) => l.every((g) => K.GUSTOS.some((x) => x.id === g))), 'los gustos de la tabla existen en el catálogo');

// ---------------------------------------------------------------- 2. el porcentaje por vecino
// jefe: trenes y asado · maestra: libros y mate
ok(E.porcentajeAfecto(bruno(base), 'jefe') === 0.10, 'trenes y asado con el jefe: dos gustos compartidos = 2 pasos = 10 %');
ok(E.porcentajeAfecto(bruno(base), 'maestra') === 0, 'sin gustos en común, sin afinidad');
ok(E.porcentajeAfecto(bruno({ ...base, gustos: ['mate', 'libros'] }), 'maestra') === 0.075, 'mate (medio paso) + libros (un paso) con la maestra = 1,5 pasos = 7,5 %');
ok(E.porcentajeAfecto(bruno({ ...base, personalidad: 'sociable', virtud: 'simpatico' }), 'maestra') === 0.2, 'sociable + simpático = +4 pasos = +20 % con cualquiera (el tope)');
ok(E.porcentajeAfecto(bruno({ ...base, personalidad: 'sociable', virtud: 'simpatico', oficio: 'cocinero' }), 'jefe') === 0.2, 'aun con un tercer pro y dos gustos compartidos no pasa del +20 %');
ok(E.porcentajeAfecto(bruno({ ...base, defecto: 'grunon', personalidad: 'reservado' }), 'maestra') === -0.2, 'gruñón + reservado = -4 pasos = -20 %');
ok(E.porcentajeAfecto(bruno({ ...base, defecto: 'grunon', gustos: ['trenes', 'asado'] }), 'jefe') === 0, 'gruñón (-2) compensado por dos gustos compartidos (+2): 0');
ok(E.porcentajeAfecto(bruno({ ...base, defecto: 'grunon' }), 'maestra') === -0.1, 'gruñón solo: -10 %');
ok(E.porcentajeAfecto({ ...bruno({ ...base, defecto: 'grunon' }), creado: false }, 'jefe') === 0, 'Bruno sin crear: 0');
ok(E.porcentajeAfecto(bruno({ ...base, defecto: 'grunon' }), 'jefe', true) === 0, 'en el Desafío: 0');
ok(E.porcentajeAfecto(bruno(base), 'nadie-conocido') === 0 && E.porcentajeAfecto(null, 'jefe') === 0, 'un vecino desconocido o sin Bruno: 0');

// ---------------------------------------------------------------- 3. ajustar una ganancia
ok(E.ajustarGananciaAmistad(2, 0) === 2 && E.ajustarGananciaAmistad(2, NaN) === 2, 'sin porcentaje (o roto), la ganancia no cambia');
ok(E.ajustarGananciaAmistad(0, 0.2, 'x') === 0 && E.ajustarGananciaAmistad(-4, 0.2, 'x') === -4 && E.ajustarGananciaAmistad(-4, -0.2, 'x') === -4, 'lo que resta (o cero) no se toca, para ningún lado');
ok(E.ajustarGananciaAmistad(2, 0.2, 'a') === E.ajustarGananciaAmistad(2, 0.2, 'a'), 'el redondeo es determinista');
for (const p of [-0.2, -0.1, -0.05, 0.05, 0.1, 0.2, 5, -5]) for (const n of [1, 2, 3, 5, 6, 10]) for (let i = 0; i < 20; i++) {
  const r = E.ajustarGananciaAmistad(n, p, `s${i}`);
  if (!Number.isInteger(r) || r < 0) assert.fail(`resultado no entero o negativo: ${n} ${p} → ${r}`);
  const pc = Math.max(-0.2, Math.min(0.2, p));
  if (r < Math.floor(n * (1 + pc)) || r > Math.ceil(n * (1 + pc))) assert.fail(`fuera del redondeo: ${n} ${p} → ${r}`);
}
ok(true, 'enteros, nunca negativos y siempre entre el piso y el techo del valor exacto (incluso con porcentajes absurdos, que se recortan a ±20 %)');
for (const [n, p] of [[2, 0.2], [2, -0.2], [6, 0.1], [10, 0.075], [1, 0.2], [5, -0.15]]) {
  let suma = 0; const veces = 4000;
  for (let i = 0; i < veces; i++) suma += E.ajustarGananciaAmistad(n, p, `semilla${i}`);
  ok(casi(suma / veces, n * (1 + p), 0.04 * n), `en promedio ${n} con ${Math.round(p * 1000) / 10} % da ${(n * (1 + p)).toFixed(2)} (dio ${(suma / veces).toFixed(2)})`);
}

// ---------------------------------------------------------------- 4. con la vecindad de verdad
const promedioCharla = (modificador, persona, gesto) => {
  V.fijarModificadorAmistad(modificador);
  try {
    const partida = {}; let suma = 0; const veces = 600;
    for (let d = 1; d <= veces; d++) { partida.vecindad = V.vecindadNueva(); suma += gesto(partida, persona, d).cambio; }   // (una vecindad nueva por día: los puntos no llegan al tope)
    return suma / veces;
  } finally { V.fijarModificadorAmistad(null); }
};
const charla = (p, k, d) => V.charlar(k, p, d);
const regalo = (p, k, d) => V.sumarAmistadDe(p, k, 6, d);
ok(promedioCharla(null, 'jefe', charla) === V.AMISTAD.charla, 'sin enganche, charlar suma lo de siempre');
const buena = bruno({ ...base, personalidad: 'sociable', virtud: 'simpatico' });          // +20 %
const mala = bruno({ ...base, personalidad: 'reservado', defecto: 'grunon' });              // -20 %
const mod = (b, desafio = false) => E.modificadorDeAmistad(() => b, desafio);
ok(casi(promedioCharla(mod(buena), 'maestra', charla), V.AMISTAD.charla * 1.2, 0.1), `charlar con un Bruno simpático suma ~20 % más (${promedioCharla(mod(buena), 'maestra', charla).toFixed(2)})`);
ok(casi(promedioCharla(mod(mala), 'maestra', charla), V.AMISTAD.charla * 0.8, 0.1), `charlar con un Bruno gruñón suma ~20 % menos (${promedioCharla(mod(mala), 'maestra', charla).toFixed(2)})`);
ok(casi(promedioCharla(mod(buena), 'maestra', regalo), 6 * 1.2, 0.3), 'lo mismo con lo que llega de parte tuya (6 puntos)');
ok(promedioCharla(mod(buena, true), 'maestra', charla) === 2 && promedioCharla(mod({ ...buena, creado: false }), 'maestra', charla) === 2, 'en el Desafío, o sin crear, la amistad suma lo de siempre');
const soloGustos = bruno({ ...base, gustos: ['trenes', 'asado'] });
ok(promedioCharla(mod(soloGustos), 'maestra', regalo) === 6, 'un gusto que el vecino no comparte no suma nada');
ok(casi(promedioCharla(mod(soloGustos), 'jefe', regalo), 6.6, 0.3), 'con el jefe (comparten trenes y asado) suma ~10 % más');
// restar no se toca
V.fijarModificadorAmistad(mod(buena));
{
  const p = { vecindad: V.vecindadNueva() };
  V.sumarAmistadDe(p, 'jefe', 10, 1);
  const antes = V.puntosAmistad('jefe', p);
  const r = V.cambiarAmistad(p, 'jefe', -4, 2);
  ok(r.cambio === -4 && V.puntosAmistad('jefe', p) === antes - 4, 'una discusión resta exactamente lo que restaba');
  const g = V.cambiarAmistad(p, 'jefe', 5, 3);
  ok(Number.isInteger(g.cambio) && g.cambio >= 5 && g.cambio <= 6, 'un chiste que sale bien (la rueda social) suma con el bonus');
  ok(Number.isInteger(V.puntosAmistad('jefe', p)), 'los puntos guardados siguen siendo enteros');
  const sano = V.sanearVecindad(JSON.parse(JSON.stringify(p.vecindad)));
  ok(Number.isInteger(sano.personas.jefe.p) && sano.personas.jefe.p === V.puntosAmistad('jefe', p), 'lo guardado se sanea sin cambiar los puntos');
}
V.fijarModificadorAmistad(null);
V.fijarModificadorAmistad(() => NaN);
{ const p = {}; ok(V.sumarAmistadDe(p, 'jefe', 6, 1).cambio === 6, 'un modificador que devuelve basura se ignora'); }
V.fijarModificadorAmistad('no es una función');
{ const p = {}; ok(V.sumarAmistadDe(p, 'jefe', 6, 1).cambio === 6, 'fijar algo que no es una función lo apaga'); }
V.fijarModificadorAmistad(null);

// ---------------------------------------------------------------- 5. el enchufe en main.js
const main = leer('src/main.js');
ok(main.split(String.fromCharCode(10)).some((l) => l.startsWith('import {') && l.includes(' modificadorDeAmistad') && l.endsWith("} from './creador-efectos.js';")), 'main.js importa el modificador en una línea');
ok(main.includes("amistades, fijarModificadorAmistad, fijarGustosDeBruno } from './vecindad.js';"), 'main.js importa fijarModificadorAmistad');
ok(/fijarModificadorAmistad\(modificadorDeAmistad\(\(\) => progreso\?\.personal\?\.bruno, esDesafio\)\);/.test(main), 'main.js lo fija una vez, leyendo a Bruno en el momento y apagado en el Desafío');
const vec = leer('src/vecindad.js');
ok(!/from 'three'/.test(vec) && !/from 'three'/.test(leer('src/creador-efectos.js')), 'los dos módulos siguen puros (sin three)');

console.log(`verificar-4-1-efectos-afecto: ${pasos} verificaciones OK`);
