// 4.2 (huevos de pascua): las reglas puras de los easter eggs del Relax (src/huevos.js), su guardado (src/guardado.js) y el
// enganche en main.js. Sin Electron. Se prueba que:
//  · la estrella fugaz con deseo: una por noche, separadas varias noches, probabilidad baja y determinista, tres deseos, se cumple
//    a los 2 a 4 días con un regalo chico y una nota, y no hay dos deseos a la vez;
//  · lo que se guarda se sanea (partida vieja sin el campo, datos rotos, caos) y el Desafío no lo tiene.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { enOrden, revisarModulo, que } from './ayuda-interacciones.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };
const H = await imp('huevos.js');

// ---------------------------------------------------------------- 0. el azar determinista
ok(H.azarDe(1, 2, 3) === H.azarDe(1, 2, 3) && H.azarDe(1, 2, 3) !== H.azarDe(3, 2, 1), 'el azar es siempre el mismo con los mismos números');
{ let min = 1, max = 0, suma = 0; for (let i = 0; i < 5000; i++) { const a = H.azarDe(99, i); min = Math.min(min, a); max = Math.max(max, a); suma += a; } ok(min >= 0 && max < 1 && Math.abs(suma / 5000 - 0.5) < 0.03, 'y reparte parejo en [0, 1)'); }

// ---------------------------------------------------------------- 1. la estrella fugaz con deseo
ok(H.DESEOS.length === 3 && new Set(H.IDS_DESEOS).size === 3 && H.DESEOS.every((d) => d.texto.length > 0 && d.texto.length <= 28), 'tres deseos, cortos');
ok(H.ESTRELLA.demoraMin === 2 && H.ESTRELLA.demoraMax === 4, 'el deseo se cumple a los 2 a 4 días');
{
  const h = H.huevosNuevos();
  // probabilidad: baja (alrededor de la declarada) y la misma cada vez
  let si = 0; const N = 4000;
  for (let n = 0; n < N; n++) if (H.trajoDeseo({ estrella: H.estrellaNueva() }, 10 + n, 1)) si++;
  ok(si / N > 0.12 && si / N < 0.3, `trae deseo una de cada ~5 fugaces vistas (${si}/${N})`);
  ok(H.trajoDeseo(h, 40, 2) === H.trajoDeseo(h, 40, 2), 'el sorteo es determinista');
  // una vez por noche
  let noche = 0, n0 = 0;
  for (let n = 1; n < 400; n++) if (H.trajoDeseo(h, 50, n)) { noche = 50; n0 = n; break; }
  ok(noche === 50, 'alguna fugaz de una noche trae deseo');
  H.ofrecerEstrella(h, 50);
  let otra = false; for (let n = 1; n < 400; n++) if (H.trajoDeseo(h, 50, n)) otra = true;
  ok(!otra, 'una vez por noche: ya no hay otra esa noche');
  let seguido = false; for (let d = 51; d < 50 + H.ESTRELLA.separacion; d++) for (let n = 1; n < 120; n++) if (H.trajoDeseo(h, d, n)) seguido = true;
  ok(!seguido, `y no más de una cada ${H.ESTRELLA.separacion} noches`);
  let despues = false; for (let n = 1; n < 400; n++) if (H.trajoDeseo(h, 50 + H.ESTRELLA.separacion, n)) despues = true;
  ok(despues, 'pasadas las noches de separación, vuelve a ser posible');
  // pedir
  ok(H.pedirDeseo(h, 7, 50) === null && H.pedirDeseo(h, -1, 50) === null && h.estrella.deseo === null, 'un deseo que no existe no se pide');
  const d = H.pedirDeseo(h, 1, 50);
  ok(d && d.id === 'vecino' && d.pedido === 50 && d.cumple >= 52 && d.cumple <= 54, 'pedido el 50, se cumple entre el 52 y el 54');
  ok(H.pedirDeseo(h, 0, 50) === null, 'no hay dos deseos a la vez');
  let con = false; for (let n = 1; n < 400; n++) if (H.trajoDeseo(h, 200, n)) con = true;
  ok(!con, 'con un deseo esperando, no viene otra estrella con deseo');
  ok(!H.deseoListo(h, d.cumple - 1, 12) && !H.deseoListo(h, d.cumple, 3) && !H.deseoListo(h, d.cumple, 21) && H.deseoListo(h, d.cumple, 9) && H.deseoListo(h, d.cumple + 5, 9), 'se cumple a la mañana o la tarde del día señalado o después, nunca de noche');
  const r = H.cumplirDeseo(h, d.cumple);
  ok(r && r.id === 'vecino' && VECINOS().includes(r.vecino) && r.amistad === 1 && r.texto.includes('__NOMBRE__') && !r.material, 'la visita: un vecino del valle y un punto de amistad');
  ok(h.estrella.deseo === null && h.estrella.cumplidos === 1 && H.cumplirDeseo(h, d.cumple) === null, 'queda cumplido una sola vez');
  // los regalos son chicos
  for (const [i, k, max] of [[0, 'tronco', 4], [2, 'calafate', 5]]) {
    const x = H.huevosNuevos(); H.pedirDeseo(x, i, 10);
    const g = H.cumplirDeseo(x, 13);
    ok(g.material.k === k && g.material.n >= 1 && g.material.n <= max && g.texto.length > 20 && g.titulo.length > 3, `el regalo del deseo ${i} es chico (${g.material.n} ${k})`);
  }
}
function VECINOS() { return H.VECINOS_DESEO; }
{
  const V = await imp('vecindad.js');
  ok(H.VECINOS_DESEO.every((k) => V.VALLE_VECINDAD.includes(k)), 'los vecinos de la visita son del valle (vecindad.js)');
}

// ---------------------------------------------------------------- 1b. los duendes del Coihue
{
  const D = H.DUENDES;
  const arboles = [
    { x: 0, z: 100, especie: 'coihue', esc: 1.2 }, { x: 10, z: 120, especie: 'coihue', esc: 1.38 }, { x: 20, z: 60, especie: 'lenga', esc: 1.9 },
    { x: 5, z: 10, especie: 'coihue', esc: 2.0 }, { x: 900, z: 900, especie: 'coihue', esc: 2.5 }, { x: 30, z: 130, especie: 'coihue', esc: 1.38 }, null, { especie: 'coihue' },
  ];
  eq(H.elegirCoihue(arboles, { x: 0, z: 0 }), { x: 10, z: 120, esc: 1.38 }, 'el coihue elegido: el más grande a una caminata (ni lenga, ni encima, ni perdido); en un empate, el de x menor');
  ok(H.elegirCoihue([], { x: 0, z: 0 }) === null && H.elegirCoihue(null, { x: 0, z: 0 }) === null && H.elegirCoihue([{ x: 1, z: 1, especie: 'lenga', esc: 1 }], { x: 0, z: 0 }) === null, 'sin coihue a mano, ninguno');
  ok(H.elegirCoihue(arboles, { x: 0, z: 0 })?.x === H.elegirCoihue([...arboles].reverse(), { x: 0, z: 0 })?.x, 'no depende del orden de la lista');
  const h = H.huevosNuevos();
  ok(H.puedeConvidar(h, 5) && H.convidar(h, 5) && h.duendes.ofrenda === 5, 'se deja el convite el día 5');
  ok(!H.puedeConvidar(h, 6) && !H.convidar(h, 6), 'con un convite esperando no se deja otro');
  ok(!H.bultoListo(h, 5, 12) && !H.bultoListo(h, 6, 5) && H.bultoListo(h, 6, 8) && H.bultoListo(h, 9, 18) && !H.bultoListo(h, 6, 22), 'el bulto está a la mañana siguiente (de 6 a 21 h), no el mismo día ni de noche');
  const r = H.levantarBulto(h, 6);
  ok(r && H.NOTAS_DUENDE.includes(r.nota) && (r.material === null || (r.material.n >= 1 && r.material.n <= D.matMax)), 'siempre una nota; el regalo, si hay, es chico');
  ok(h.duendes.ofrenda === 0 && h.duendes.recibidos === 1 && H.levantarBulto(h, 6) === null, 'se levanta una sola vez');
  ok(!H.puedeConvidar(h, 5 + D.separacion - 1) && H.puedeConvidar(h, 5 + D.separacion), `no se puede otro convite hasta ${D.separacion} días después`);
  // de cuántos convites sale regalo
  let con = 0; const N = 2000;
  for (let i = 1; i <= N; i++) { const x = H.huevosNuevos(); H.convidar(x, i * 10); if (H.levantarBulto(x, i * 10 + 1).material) con++; }
  ok(con / N > 0.3 && con / N < 0.6, `un regalito en poco menos de la mitad de los convites (${con}/${N})`);
  ok(H.NOTAS_DUENDE.length >= 5 && H.NOTAS_DUENDE.every((t) => t.length > 20 && t.length < 100 && !/[A-Za-z]{3,} (the|and) /.test(t)), 'las notas, en castellano y cortas');
}
// ---------------------------------------------------------------- 1d. el huemul blanco
{
  const U = H.HUEMUL;
  ok(!H.ventanaHuemul(5.4) && H.ventanaHuemul(5.5) && H.ventanaHuemul(7.4) && !H.ventanaHuemul(8.8) && !H.ventanaHuemul(15) && !H.ventanaHuemul(2), 'sólo al amanecer (de 5:30 a 8:48)');
  // los días en que el sorteo da que sí: pocos
  const dias = []; for (let d = 10; d < 4010; d++) if (H.azarDe(7201, d) < U.prob) dias.push(d);
  ok(dias.length / 4000 > 0.04 && dias.length / 4000 < 0.11, `el sorteo da que sí en una de cada ~14 mañanas con niebla (${dias.length}/4000)`);
  const h = H.huevosNuevos(), d0 = dias[0];
  ok(!H.huemulAfuera(h, d0, 7.4, 0.1) && !H.huemulAfuera(h, d0, 10, 0.6) && !H.huemulAfuera(h, d0 + 1, 7.4, 0.6) === !(dias.includes(d0 + 1)), 'sin niebla de valle o fuera del amanecer, no sale');
  ok(H.huemulAfuera(h, d0, 7.4, 0.5) === true, 'una mañana sorteada, con niebla, sale');
  ok(H.huemulAfuera(h, d0, 7.4, 0.5) === H.huemulAfuera(H.huevosNuevos(), d0, 7.4, 0.5), 'el sorteo es el mismo cada vez (recargar no lo cambia)');
  H.salioHuemul(h, d0);
  ok(h.huemul.ultimo === d0 && H.huemulAfuera(h, d0, 6.5, 0), 'una vez afuera, se queda toda la mañana aunque la niebla baje');
  H.seFueHuemul(h);
  ok(!H.huemulAfuera(h, d0, 7.4, 0.6) && h.huemul.ido, 'si se fue, no vuelve esa mañana (ni al recargar)');
  // separación: el siguiente día sorteado a menos de 5 días no sale
  const cerca = dias.find((d) => d > d0 && d - d0 < U.separacion);
  const lejos = dias.find((d) => d - d0 >= U.separacion);
  ok(cerca === undefined || !H.huemulAfuera(h, cerca, 7.4, 0.6), `no sale otra vez antes de ${U.separacion} días`);
  ok(lejos !== undefined && H.huemulAfuera(h, lejos, 7.4, 0.6), 'pasados los días de separación, sí');
  ok(H.seAsusta(U.cerca - 0.1) && !H.seAsusta(U.cerca + 0.1) && U.cerca >= 15, 'se asusta cuando te acercás demasiado');
  H.avistoHuemul(h); ok(h.huemul.avistajes === 1, 'el avistaje se cuenta');
  const E = H.ENTRADAS_HUEVOS[0], C = await imp('cuaderno.js');
  ok(E.id === 'avistaje-huemul' && E.seccion === 'fauna' && E.cientifico === 'avistaje raro' && E.modo === 'observar' && C.ENTRADA['avistaje-huemul'] === E, 'se anota en el cuaderno como «avistaje raro» (fauna)');
  ok(C.ENTRADAS.filter((e) => e.id === 'avistaje-huemul').length === 1, 'una sola entrada');
}

// ---------------------------------------------------------------- 1e. el hueso del perro
{
  const U = H.HUESO;
  const dias = []; for (let d = 10; d < 4010; d++) if (H.azarDe(7301, d) < U.prob) dias.push(d);
  ok(dias.length / 4000 > 0.1 && dias.length / 4000 < 0.22, `el sorteo da que sí en uno de cada ~6 días (${dias.length}/4000)`);
  const h = H.huevosNuevos(), d0 = dias[0];
  ok(!H.enterroHueso(h, d0, 3) && !H.enterroHueso(h, d0, 22) && !H.hayHueso(h), 'de noche no lo entierra');
  const sin = dias.find((d) => !(H.azarDe(7301, d) < U.prob));
  ok(!H.enterroHueso(H.huevosNuevos(), 5, 12) === !(H.azarDe(7301, 5) < U.prob), 'sólo los días sorteados');
  ok(H.enterroHueso(h, d0, 12) === true && H.hayHueso(h) && h.hueso.dia === d0 && h.hueso.ultimo === d0, 'un día sorteado, de día, entierra uno');
  ok(!H.enterroHueso(h, dias.find((d) => d > d0), 12), 'con uno enterrado no entierra otro (un hueso por vez)');
  const lug = H.lugarDelHueso(d0);
  ok(lug.r >= U.minR && lug.r <= U.maxR && lug.ang >= 0 && lug.ang < Math.PI * 2 && JSON.stringify(lug) === JSON.stringify(H.lugarDelHueso(d0)), 'el lugar: a una distancia razonable del refugio y siempre el mismo');
  { let distintos = new Set(); for (let d = 0; d < 50; d++) distintos.add(H.lugarDelHueso(d).ang.toFixed(3)); ok(distintos.size > 40, 'y cada hueso, en otro lado'); }
  const r = H.desenterrarHueso(h);
  ok(r && H.HALLAZGOS.some((x) => x.id === r.id) && r.pesos <= 150 && !H.hayHueso(h) && h.hueso.cavados === 1, 'se excava: sale algo viejo y chico, y el montículo se va');
  ok(H.desenterrarHueso(h) === null, 'se excava una sola vez');
  // el siguiente, no antes de la separación (contada desde que se enterró)
  const cerca = dias.find((d) => d > d0 && d - d0 < U.separacion), lejos = dias.find((d) => d - d0 >= U.separacion);
  ok(cerca === undefined || !H.enterroHueso(h, cerca, 12), `no se entierra otro antes de ${U.separacion} días`);
  ok(lejos !== undefined && H.enterroHueso(h, lejos, 12), 'pasados los días, sí');
  const cuenta = { moneda: 0, cobre: 0, cuenta: 0 };
  for (let d = 1; d <= 3000; d++) { const x = H.huevosNuevos(); x.hueso.dia = d; x.hueso.ultimo = d; cuenta[H.desenterrarHueso(x).id]++; }
  ok(cuenta.moneda > 1000 && cuenta.cobre > 1000 && cuenta.cuenta > 400 && cuenta.cuenta < 800, `los hallazgos salen en las proporciones (${JSON.stringify(cuenta)})`);
  ok(H.HALLAZGOS.reduce((a, c) => a + c.peso, 0) === 1 && H.HALLAZGOS.every((c) => c.texto.length > 15 && c.pesos >= 0 && c.pesos <= 150), 'los pesos suman 1 y los premios son de verdad chicos (hasta $150)');
}

// ---------------------------------------------------------------- 1f. la radio de la madrugada y el código de la portada
{
  const U = H.RADIO_MAD, R = await imp('radio-madrugada.js'), S = await imp('sonido-sintesis.js');
  ok(!H.ventanaMadrugada(1.9) && H.ventanaMadrugada(2) && H.ventanaMadrugada(3.9) && !H.ventanaMadrugada(4) && !H.ventanaMadrugada(12) && !H.ventanaMadrugada(23), 'sólo entre las 2 y las 4 de la mañana');
  const noches = []; for (let d = 10; d < 4010; d++) if (H.hayEmisoraMadrugada(d)) noches.push(d);
  ok(noches.length / 4000 > 0.33 && noches.length / 4000 < 0.47, `hay señal alrededor de dos noches de cada cinco (${noches.length}/4000)`);
  const h = H.huevosNuevos(), n0 = noches[0];
  ok(H.escucharMadrugada(h, n0, 12) === null && H.escucharMadrugada(h, n0, 1) === null, 'de día o antes de las 2, sólo estática');
  const sin = [...Array(60).keys()].map((i) => 10 + i).find((d) => !H.hayEmisoraMadrugada(d));
  ok(H.escucharMadrugada(h, sin, 3) === null && h.radio.ultima === 0, 'una noche sin señal no cuenta ni se anota');
  const r = H.escucharMadrugada(h, n0, 3);
  ok(r && (r.tipo === 'tango' || (r.tipo === 'morse' && H.MENSAJES_MORSE.includes(r.mensaje))) && h.radio.ultima === n0 && h.radio.oidos === 1, 'una noche con señal, a las 3: tango o Morse, y queda anotada');
  ok(H.escucharMadrugada(h, n0, 3.5) === null, 'una vez por noche');
  const tipos = { tango: 0, morse: 0 }; for (const n of noches) { const x = H.huevosNuevos(); tipos[H.escucharMadrugada(x, n, 3).tipo]++; }
  ok(tipos.tango / noches.length > 0.45 && tipos.tango / noches.length < 0.65 && tipos.morse > 100, `las dos cosas salen, un poco más de tango (${JSON.stringify(tipos)})`);
  { const a = H.escucharMadrugada(H.huevosNuevos(), n0, 3), b = H.escucharMadrugada(H.huevosNuevos(), n0, 3); ok(JSON.stringify(a) === JSON.stringify(b), 'es el mismo sonido para la misma noche'); }
  // los sonidos: síntesis propia (sin audios), finitos, con nivel y duraciones razonables
  const stats = (d) => { let p = 0, q = 0, nan = 0; for (const v of d) { if (!Number.isFinite(v)) nan++; p = Math.max(p, Math.abs(v)); q += v * v; } return { pico: p, rms: Math.sqrt(q / d.length), nan }; };
  const tango = S.completar(R.sintetizarTango()), st = stats(tango);
  ok(st.nan === 0 && st.pico > 0.2 && st.pico <= 1 && st.rms > 0.03 && Math.abs(tango.length / R.TASA_RADIO - R.duracionTango()) < 0.01, `el tango suena (pico ${st.pico.toFixed(2)}, rms ${st.rms.toFixed(3)}, ${(tango.length / R.TASA_RADIO).toFixed(1)} s)`);
  ok(R.duracionTango() > 9 && R.duracionTango() < 18, 'y es corto (menos de 18 s)');
  { const a = S.completar(R.sintetizarTango(R.TASA_RADIO, 7)), b = S.completar(R.sintetizarTango(R.TASA_RADIO, 7)); let igual = true; for (let i = 0; i < a.length; i += 97) if (a[i] !== b[i]) igual = false; ok(igual, 'con la misma semilla suena igual'); }
  { const fin = tango.slice(tango.length - 4000); ok(stats(fin).rms < st.rms * 0.5, 'se pierde al final, como una emisora lejana'); }
  ok(R.TANGO.melodia.reduce((a, x) => a + x[1], 0) === 16 && R.TANGO.melodia.every(([m]) => [69, 71, 72, 74, 76, 77, 68].includes(m)), 'la frase: cuatro compases en la menor (escala armónica de la)');
  ok(R.TANGO.bajo.every(([m, t]) => m >= 40 && m <= 55 && t >= 0 && t < 16) && R.TANGO.acordes.every(([c, t]) => c.length >= 3 && t >= 0 && t < 16), 'el bajo y los acordes entran en los cuatro compases');
  ok(R.aMorse('SOS') === '... --- ...' && R.aMorse('hola  valle') === '.... --- .-.. .- / ...- .- .-.. .-.. .' && R.aMorse('') === '', 'el código Morse (ITU)');
  ok(Object.keys(R.MORSE).length === 36 && H.MENSAJES_MORSE.every((m) => [...m.replace(/ /g, '')].every((c) => Object.hasOwn(R.MORSE, c))), 'los mensajes se pueden transmitir (letras sin ñ ni tildes)');
  { const t = R.tramosMorse('SOS'); ok(t.filter((x) => x.suena).length === 9 && t.filter((x) => x.suena && x.u === 3).length === 3 && t.filter((x) => !x.suena && x.u === 3).length === 2, 'los tramos de SOS: tres puntos, tres rayas, tres puntos, con sus pausas'); }
  const mo = S.completar(R.sintetizarMorse('SOS')), sm = stats(mo);
  ok(sm.nan === 0 && sm.pico > 0.2 && sm.pico <= 1 && Math.abs(mo.length / R.TASA_RADIO - R.duracionMorse('SOS')) < 0.01, `el Morse suena (pico ${sm.pico.toFixed(2)}, ${(mo.length / R.TASA_RADIO).toFixed(1)} s)`);
  for (const m of H.MENSAJES_MORSE) ok(R.duracionMorse(m) < 20, `«${m}» dura menos de 20 s`);
  const src = leer('src/radio-madrugada.js');
  ok(!/from 'three'/.test(src) && !/AudioContext|createBuffer|Math\.random|\.wav|\.mp3|\.ogg|fetch\(/.test(src.replace(/\/\/.*$/gm, '')), 'radio-madrugada.js: puro, sin WebAudio, sin azar suelto y sin audios');
  ok(!/^export function\*/m.test(src) && /^export \{ sintetizarTango, sintetizarMorse \};/m.test(src), 'radio-madrugada.js: sin export function* (armar.mjs no lo entiende) y los generadores se exportan aparte');
  const K = H.CODIGO_PORTADA;
  ok(K.length === 10 && K.join(',') === 'ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,KeyB,KeyA', 'el código: ↑ ↑ ↓ ↓ ← → ← → B A');
  { const mem = []; let cierra = 0; for (const c of K) if (H.teclaDelCodigo(mem, c)) cierra++; ok(cierra === 1, 'la secuencia entera lo cierra, una sola vez, y en la última tecla'); }
  { const mem = []; let cierra = 0; for (const c of [...K.slice(0, 9), 'KeyX', ...K]) if (H.teclaDelCodigo(mem, c)) cierra++; ok(cierra === 1, 'una tecla de más antes no lo estropea (cuenta la última tanda)'); }
  { const mem = []; let cierra = 0; for (const c of [...K.slice(0, 9), 'KeyX']) if (H.teclaDelCodigo(mem, c)) cierra++; ok(cierra === 0, 'con una tecla equivocada al final no cierra'); }
  { const mem = []; let c1 = false; for (const c of [...K, ...K]) c1 = H.teclaDelCodigo(mem, c); ok(c1 === true && mem.length === 10, 'se puede repetir, y la memoria no crece'); }
  ok(H.teclaDelCodigo(null, 'KeyA') === false, 'sin memoria no se rompe');
  const hojas = H.planHojas(44, 1);
  ok(hojas.length === 44 && JSON.stringify(hojas) === JSON.stringify(H.planHojas(44, 1)) && JSON.stringify(hojas) !== JSON.stringify(H.planHojas(44, 2)), 'las hojas: 44, siempre las mismas con la misma semilla');
  ok(hojas.every((x) => x.x >= 0 && x.x <= 100 && x.tam >= 14 && x.tam <= 28 && x.dur >= 4.5 && x.dur <= 7.5 && x.espera >= 0 && x.espera <= 2.5 && H.COLORES_HOJAS.includes(x.color)), 'dentro de la pantalla, de tamaño y tiempos razonables');
  ok(Math.max(...hojas.map((x) => x.espera + x.dur)) <= H.SEGUNDOS_HOJAS, 'la última hoja llega al suelo antes de que se saque la capa');
  ok(new Set(hojas.map((x) => x.color)).size >= 5, 'de varios colores');
  ok(H.planHojas(44, 1, true).length <= 14 && H.planHojas(1000, 1).length <= 80 && H.planHojas(0, 1).length >= 1, 'con «reducir movimiento», pocas; con tope');
  const pt = leer('src/huevos-portada.js');
  ok(/\.huevo-hojas/.test(leer('src/plantilla.html')) && /prefers-reduced-motion/.test(leer('src/plantilla.html')) && !/requestAnimationFrame|setInterval/.test(pt), 'las hojas caen con CSS (sin cuadros ni intervalos) y respetan «reducir movimiento»');
  ok(!/\.iniciar\(/.test(pt), 'en la portada no se arranca el audio: suena sólo si ya está andando');
}

// ---------------------------------------------------------------- 2. lo que se guarda
eq(H.sanearHuevos(undefined, 10), H.huevosNuevos(), 'una partida vieja (sin el campo) arranca de cero');
eq(H.sanearHuevos(null, 10), H.huevosNuevos(), 'null: de cero');
eq(H.sanearHuevos({ estrella: { ultimaNoche: 9999, deseo: { id: 'lena', pedido: 5, cumple: 7 }, cumplidos: -4 } }, 20).estrella, { ultimaNoche: 20, deseo: { id: 'lena', pedido: 5, cumple: 7 }, cumplidos: 0 }, 'las fechas no pasan de hoy');
eq(H.sanearHuevos({ duendes: { ofrenda: 9999, ultima: -3, recibidos: 1e9 } }, 20).duendes, { ofrenda: 20, ultima: 20, recibidos: 999 }, 'los duendes: las fechas no pasan de hoy y el convite no queda sin fecha');
eq(H.sanearHuevos({ duendes: 'x' }, 20).duendes, H.duendesNuevos(), 'duendes roto: de cero');
eq(H.sanearHuevos({ huemul: { ultimo: 5000, ido: true, avistajes: -2 } }, 20).huemul, { ultimo: 20, ido: true, avistajes: 0 }, 'el huemul: la fecha no pasa de hoy');
eq(H.sanearHuevos({ huemul: { ultimo: 0, ido: true } }, 20).huemul, H.huemulNuevo(), 'sin aparición no puede haberse ido');
eq(H.sanearHuevos({ huemul: 7 }, 20).huemul, H.huemulNuevo(), 'huemul roto: de cero');
eq(H.sanearHuevos({ hueso: { dia: 9999, ultimo: -1, cavados: 5000 } }, 20).hueso, { dia: 20, ultimo: 20, cavados: 999 }, 'el hueso: las fechas no pasan de hoy y el último no es anterior al enterrado');
eq(H.sanearHuevos({ hueso: 'x' }, 20).hueso, H.huesoNuevo(), 'hueso roto: de cero');
eq(H.sanearHuevos({ radio: { ultima: 9999, oidos: -4 } }, 20).radio, { ultima: 20, oidos: 0 }, 'la radio: la noche no pasa de hoy');
eq(H.sanearHuevos({ radio: [] }, 20).radio, H.radioNueva(), 'radio rota: de cero');
for (const malo of [{ id: 'magia', pedido: 5, cumple: 7 }, { id: 'lena', pedido: 30, cumple: 32 }, { id: 'lena', pedido: 5, cumple: 5 }, { id: 'lena', pedido: 5, cumple: 90 }, 'x', 7, [], { id: 'lena' }]) {
  ok(H.sanearHuevos({ estrella: { deseo: malo } }, 20).estrella.deseo === null, `un deseo imposible se descarta: ${JSON.stringify(malo)}`);
}
{
  let rng = 11; const azar = () => ((rng = (rng * 1103515245 + 12345) >>> 0) / 4294967296);
  const valor = (d = 0) => { const r = azar(); if (d > 2 || r < 0.3) return [null, -1, 0, 1e9, NaN, 'x', true, 'lena', 'tierra'][Math.floor(azar() * 9)]; if (r < 0.65) { const o = {}; for (const k of ['estrella', 'deseo', 'id', 'pedido', 'cumple', 'cumplidos', 'ultimaNoche', 'v', 'duendes', 'ofrenda', 'ultima', 'recibidos', 'huemul', 'ido', 'avistajes', 'hueso', 'cavados', 'radio', 'oidos']) if (azar() < 0.6) o[k] = valor(d + 1); return o; } return [valor(d + 1), valor(d + 1)]; };
  let bien = 0;
  for (let i = 0; i < 500; i++) {
    const x = H.sanearHuevos(valor(), 1 + Math.floor(azar() * 60));
    const y = H.sanearHuevos(JSON.parse(JSON.stringify(x)), 100);
    if (JSON.stringify(y) === JSON.stringify(x) && Number.isFinite(x.estrella.ultimaNoche) && x.estrella.cumplidos >= 0 && x.duendes.ofrenda <= x.duendes.ultima && x.huemul.avistajes >= 0 && (!x.huemul.ido || x.huemul.ultimo > 0) && x.hueso.ultimo >= x.hueso.dia && x.hueso.cavados >= 0 && x.radio.oidos >= 0 && Number.isFinite(x.radio.ultima)) bien++;
  }
  eq(bien, 500, 'el caos: nunca se rompe y lo saneado queda igual');
}
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const GU = await import('../src/guardado.js?v42huevos=' + Date.now());
  eq(GU.progresoNuevo().huevos, H.huevosNuevos(), 'partida nueva del Relax: los huevos de cero');
  const vieja = GU.progresoNuevo(); delete vieja.huevos; vieja.dia = 40;
  datos.set('hojarasca-v1', JSON.stringify(vieja));
  eq(GU.cargarProgreso().huevos, H.huevosNuevos(), 'una partida vieja carga bien y arranca de cero');
  const con = GU.progresoNuevo(); con.dia = 40; con.huevos = { estrella: { ultimaNoche: 30, deseo: { id: 'tierra', pedido: 38, cumple: 41 }, cumplidos: 2 } };
  datos.set('hojarasca-v1', JSON.stringify(con));
  eq(GU.cargarProgreso().huevos.estrella, { ultimaNoche: 30, deseo: { id: 'tierra', pedido: 38, cumple: 41 }, cumplidos: 2 }, 'un deseo esperando se conserva al recargar');
}
{
  const g = leer('src/guardado.js');
  ok(g.includes("huevos: modoPartida === 'desafio' ? undefined : sanearHuevos(p.huevos,") && g.includes('...(desafio ? {} : { huevos: huevosNuevos() })'), 'en el Desafío, sin huevos');
  const m = leer('src/main.js');
  ok(m.includes('huevosJuego?.fugazVista(diaNoche, nocheCielo.vistas)') && m.includes("!desafio) huevosJuego?.actualizar(dt)"), 'main.js: la fugaz vista y el reloj de 2 segundos, sólo en el Relax');
  const j = leer('src/huevos-juego.js');
  ok(!/requestAnimationFrame/.test(j) && !/from 'three'/.test(j) && /acum < 2/.test(j), 'huevos-juego.js: por evento, sin cuadros ni three');
  // (4.6.1: la E y el aviso salen de la misma tabla, src/interacciones.js)
  ok(m.includes('cacheHuevos = huevosJuego ? huevosJuego.accion(js) : null') && /case 'huevos': return cacheHuevos;/.test(m), 'main.js: la E y el aviso de los huevos, con la misma función (lo buscado)');
  enOrden(['rincones', 'huevos', 'jaula'], 'la E y el aviso de los huevos, en el mismo lugar (después de los rincones)');
  revisarModulo('huevos', 'huevos');
  { const r = que({ acciones: { huevos: true } }); ok(r.hechos[0] === 'limpiar(huevos)' && r.hechos[1] === 'huevos.hacer', 'la E lo saca de lo buscado antes de hacerlo (no se repite)'); }
  ok(m.includes('if (huevosJuego?.radioMadrugada()) { guardar(); return; }') && m.indexOf('huevosJuego?.radioMadrugada()') < m.indexOf('const oido = escucharRadio(r,') && m.indexOf('cumplirPedido(r, progreso.materiales') < m.indexOf('huevosJuego?.radioMadrugada()'), 'main.js: la radio de madrugada va después de mandar un pedido y antes de lo de siempre');
  ok(m.includes("huevosPortada = crearHuevosPortada({ enPortada: () => modo === 'inicio'") && m.includes("prefers-reduced-motion: reduce"), "main.js: el código de la portada sólo en la portada y con reducir movimiento");
  const vi = leer('src/vida.js');
  ok(vi.includes('export function mallaHuemulBlanco()') && vi.includes('function mallaHuemul(macho, blanco = false)'), 'vida.js: el huemul blanco es el mismo modelo con otro pelaje');
  ok(!/huemulEstado|mallaHuemulBlanco|huevos/.test(leer('src/fauna.js')) && !/mallaHuemulBlanco/.test(vi.slice(vi.indexOf('export function crearVida'))), 'el huemul blanco no está en la fauna del juego: no se caza, no se cuenta, no lo rastrea el perro');
  const mu = leer('src/huevos-mundo.js');
  ok(/MAT_FAUNA/.test(mu) && !/new THREE.(MeshStandardMaterial|MeshBasicMaterial|ShaderMaterial|MeshPhongMaterial)/.test(mu) && !/OctahedronGeometry|Vector4|Frustum|ShapeGeometry/.test(mu), 'huevos-mundo.js: sólo MAT_FAUNA (no compila nada nuevo) y sin clases que el three recortado no trae');
  const p = leer('src/huevos.js');
  ok(!/from 'three'/.test(p) && !/document\./.test(p) && !/Date\.now|Math\.random/.test(p.replace(/\/\/.*$/gm, '')), 'huevos.js es puro: ni three ni DOM ni reloj ni Math.random');
}

console.log(`OK 4.2 huevos de pascua · ${pasos} verificaciones · estrella con deseo, duendes del Coihue, huemul blanco, hueso del perro, radio de la madrugada, código de la portada, guardado saneado y enganche`);
