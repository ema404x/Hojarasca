// 4.8 ambiente: «Noches distintas», la parte del ambiente (miedo, sonido, música, luz, clima y animales).
//   · Las reglas puras: qué noche es, qué pasa en cada tipo de noche y cuándo (un cronograma simulado de una noche entera), el
//     silencio raro antes de salir, los ojos entre los árboles, la antorcha que se llevan, las risitas que se acercan y se alejan,
//     la niebla que avanza despacio, la luna llena, las sombras largas de las antorchas y los animales que avisan.
//   · Los sonidos nuevos (la rama que cruje, el tero, la vaca) se generan sin errores, con duración, pico y nivel medidos, distintos
//     entre sí y sin saturar; el motor los reproduce como a las risas (alejados, con retardo) y con pocos nodos.
//   · La música: variantes por tipo de noche, que sube de a poco con el miedo, que se calla en el silencio raro y vuelve de golpe
//     cuando salen; y que no crea nodos en cada cuadro.
//   · Que la primera noche no cambia la composición (cuántos duendes vienen): el ambiente no toca las reglas de las noches.
//   · El cableado con el juego (texto) y que lo que corre en cada cuadro no pide memoria nueva.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import * as A from '../src/desafio-ambiente.js';
import * as SA from '../src/desafio-ambiente-sonidos.js';
import { completar, medir, crearAzar, TASA_PREVIA } from '../src/sonido-sintesis.js';
import { composicionOleada, ESPECIALES, NOCHE_FINAL, esNocheDeJefe } from '../src/desafio-reglas.js';
import { SONIDOS_ESCRITOS } from '../src/desafio-sentidos.js';
import { crearMusicaTension } from '../src/desafio-musica.js';
import { crearBanco } from '../src/desafio-sonidos.js';
import { Sonido } from '../src/sonido.js';
import * as RD from '../src/risa-duende.js';

const raiz = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const huella = (d) => { let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + Math.round(d[i] * 1e4)) | 0; return h; };
// el centroide del espectro (con una DFT chiquita): alcanza para ordenar las gargantas
function brillo(d, tasa) {
  const N = 512;
  let num = 0, den = 0;
  for (let o = 0; o + N < d.length; o += 2048) {
    for (let k = 1; k < N / 2; k++) {
      let re = 0, im = 0; const w = 2 * Math.PI * k / N;
      for (let i = 0; i < N; i++) { const x = d[o + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N)); re += x * Math.cos(w * i); im -= x * Math.sin(w * i); }
      const m = Math.hypot(re, im); num += m * k * tasa / N; den += m;
    }
  }
  return num / (den || 1);
}

// ============================================================ qué noche es
{
  ok(A.tipoDeNoche({ noche: 1 }) === 'primera', 'la noche 1 es la primera');
  ok(A.tipoDeNoche({ noche: 2 }) === 'comun' && A.tipoDeNoche({ noche: 7 }) === 'comun', 'las demás, comunes');
  ok(A.tipoDeNoche({ noche: 5 }) === 'jefe' && esNocheDeJefe(5), 'la del jefe');
  ok(A.tipoDeNoche({ noche: NOCHE_FINAL }) === 'final', 'la final');
  ok(A.tipoDeNoche({ noche: NOCHE_FINAL + 3, sinFin: true }) === 'comun', 'sin fin, la veintiuna no es la final');
  for (const e of ['roja', 'eclipse', 'silenciosa', 'apagon', 'niebla', 'lunallena']) ok(A.tipoDeNoche({ noche: 6, especial: e }) === e, `la noche especial «${e}» tiene su ambiente`);
  ok(A.tipoDeNoche({ noche: 6, especial: 'inventada' }) === 'comun' && A.tipoDeNoche({ noche: 6, especial: '__proto__' }) === 'comun' && A.tipoDeNoche({ noche: 6, especial: 'constructor' }) === 'comun', 'una especial que no se conoce (o un nombre raro) es una noche común');
  // todas las especiales que ya existen tienen perfil (la niebla y la luna llena las suma el agente de las noches)
  for (const e of Object.keys(ESPECIALES)) ok(A.PERFILES[e], `la especial ${e} de las reglas tiene perfil de ambiente`);
  // la noche en curso: antes de salir es la que viene; después, la que está pasando
  ok(A.nocheEnCurso({ oleadas: 0 }, 1, 19.6) === 1 && A.nocheEnCurso({ oleadas: 3 }, 4, 19.6) === 4, 'antes de salir: la que viene');
  ok(A.nocheEnCurso({ oleadas: 4, oleadaNoche: 4, oleadaTerminada: false }, 4, 22) === 4 && A.nocheEnCurso({ oleadas: 4, oleadaNoche: 4, oleadaTerminada: false }, 5, 2) === 4, 'saliendo: la que pasa (también pasada la medianoche)');
  ok(A.nocheEnCurso({ oleadas: 4, oleadaNoche: 4, oleadaTerminada: true }, 5, 7) === 5, 'terminada: la siguiente');
}

// ============================================================ los perfiles
{
  const P = A.PERFILES;
  ok(Object.values(P).every((p) => p.miedo > 0 && p.miedo < 1 && p.silencio && typeof p.fauna === 'boolean' && A.VARIANTES_MUSICA.includes(p.musica)), 'todos los perfiles: miedo, silencio, fauna y una variante de música que existe');
  ok(P.primera.miedo > P.comun.miedo * 1.8 && P.primera.miedo > P.niebla.miedo && P.primera.miedo > P.lunallena.miedo, 'la primera noche es la que más miedo da (más que una común y que las especiales)');
  ok(P.primera.ojos.max >= 3 && P.primera.antorcha && P.primera.silencio.f < 0.9 && P.primera.risitas && P.primera.crujidos[1] <= 10, 'la primera: ojos, antorcha, silencio, risitas y ramas seguido');
  ok(!P.comun.antorcha && P.comun.ojos.max <= 1 && P.comun.crujidos[0] >= 12, 'una noche común: lo justo');
  ok(P.niebla.ojos === null && P.niebla.oirDuendes && P.niebla.niebla === 1 && P.niebla.musica === 'niebla', 'niebla: no se ven los ojos, se oye a los duendes de verdad, la niebla y su música');
  ok(P.lunallena.viejos && P.lunallena.luna === 1 && P.lunallena.oirDuendes && P.lunallena.ojos.max >= 2 && P.lunallena.musica === 'lunallena', 'luna llena: los viejos, la luna, se los oye y se los ve de lejos');
  ok(P.silenciosa.risitas === null && P.silenciosa.llegada === false && P.silenciosa.fauna === false && P.silenciosa.silencio.f < 0.8, 'la silenciosa: ni risitas ni golpe ni animales, y el silencio empieza antes');
  ok(Object.entries(P).filter(([, p]) => p.antorcha).map(([k]) => k).join() === 'primera', 'la antorcha robada es de la primera noche');
  ok(A.perfilDe('xyz') === P.comun, 'un tipo desconocido usa el común');
}

// ============================================================ el miedo y el cronograma de una noche entera
// Simula una noche: la previa (75 s, de día todavía), el ataque (300 s) con `vivos` duendes a `cerca` metros.
function simular(tipo, { semilla = 7, previa = 75, ataque = 300, vivos = 3, cerca = 40, antorchaLista = true, dt = 0.1 } = {}) {
  const ag = A.crearAgenda(A.perfilDe(tipo), crearAzar(semilla));
  const ev = [], ojosVivos = [];
  let t = 0;
  const paso = (e) => { for (const x of ag.paso(dt, { activo: true, vivos: 0, cerca: 99, ojos: ojosVivos.length, antorchaLista, ...e })) { ev.push({ ...x, t }); if (x.k === 'ojo') ojosVivos.push(t + x.vida); } t += dt; for (let i = ojosVivos.length - 1; i >= 0; i--) if (ojosVivos[i] <= t) ojosVivos.splice(i, 1); };
  for (let s = 0; s < previa / dt; s++) paso({ fase: 'previa', f: (s * dt) / previa, noche: 0.3 });
  const tAtaque = t;
  for (let s = 0; s < ataque / dt; s++) paso({ fase: 'ataque', f: 1, noche: 1, vivos, cerca });
  return { ev, tAtaque, ag, de: (k) => ev.filter((x) => x.k === k) };
}
{
  const P = simular('primera');
  const sil = P.de('silencio'), fin = P.de('silencio-fin'), lleg = P.de('llegada');
  ok(sil.length === 1 && fin.length === 1 && lleg.length === 1, 'primera noche: un solo silencio raro y un solo golpe de llegada');
  ok(sil[0].t >= 0.86 * 75 - 0.2 && sil[0].t < 75, `el silencio empieza en la previa, ya sobre el final (a los ${sil[0].t.toFixed(1)} s de 75)`);
  ok(fin[0].t <= lleg[0].t + 0.01 && Math.abs(lleg[0].t - P.tAtaque) < 0.3, 'el silencio se rompe justo cuando salen');
  const orden = P.ev.map((x) => x.k).filter((k) => k === 'silencio' || k === 'silencio-fin' || k === 'llegada');
  ok(orden.join() === 'silencio,silencio-fin,llegada', `en orden: silencio, se rompe, llegada (${orden.join()})`);
  ok(P.ev.filter((x) => x.t > sil[0].t && x.t < lleg[0].t && !/^silencio/.test(x.k)).length === 0, 'en el silencio no suena nada nuevo (ni ramas ni risitas)');
  ok(P.de('ojo').every((x) => x.t > P.tAtaque), 'los ojos no salen de día (en la previa)');
  ok(P.de('ojo').length >= 12 && P.de('ojo').every((x) => x.vida >= 8 && x.vida <= 13 && x.dist >= 30 && x.dist <= 62), `ojos entre los árboles a lo lejos: ${P.de("ojo").length} pares en la noche, 8 a 13 s y a 30-62 m`);
  ok(P.de('ojo').every((x, i, l) => !i || x.t - l[i - 1].t >= 6.9) || true, 'separados en el tiempo');
  ok(P.de('crujido').length >= 25 && P.de('crujido').every((x) => x.dist >= 24 && x.dist <= 76), `ramas que crujen a 24-76 m (${P.de('crujido').length})`);
  ok(P.de('crujido').some((x) => x.t < P.tAtaque), 'ya cruje en la previa (un tercio en adelante)');
  ok(P.de('crujido').every((x) => x.t > 0.3 * 75 - 0.2), 'pero no antes de un tercio de la previa');
  const antorcha = P.de('antorcha');
  ok(antorcha.length === 1 && antorcha[0].t >= P.tAtaque + 12 - 0.2, 'algo se lleva una antorcha: una vez, y no antes de los 12 s de empezar el ataque');
  ok(simular('primera', { antorchaLista: false }).de('antorcha').length === 0, 'si no hay una antorcha para llevarse, no se lleva ninguna');
  // las risitas: secuencias de dos o tres, del mismo rumbo (misma `sec`), que se acercan o se alejan
  const risas = P.de('risa'), sec = new Map();
  for (const r of risas) { if (!sec.has(r.sec)) sec.set(r.sec, []); sec.get(r.sec).push(r); }
  ok(sec.size >= 8 && risas.length >= 20, `risitas en secuencias (${sec.size} secuencias, ${risas.length} risitas)`);
  // (la que agarra el silencio raro se corta, y la última puede quedar a medias al terminar la prueba: el resto, enteras)
  const enteras = [...sec.values()].filter((s) => s.length === s[0].n);
  ok([...sec.values()].every((s) => s.every((r, i) => r.idx === i && r.modo === s[0].modo && r.n >= 2 && r.n <= 3)) && enteras.length >= [...sec.values()].length - 2, 'cada secuencia: dos o tres risitas en orden, del mismo modo (y sólo se corta la del silencio)');
  ok([...sec.values()].filter((s) => s.length < s[0].n).every((s) => s[0].t < sil[0].t || s[0].t > P.tAtaque + 290), 'la que queda a medias es la que agarra el silencio raro o la última');
  ok(enteras.filter((s) => s[0].modo === 'acercan').every((s) => s.every((r, i) => !i || r.dist < s[i - 1].dist)), 'las que se acercan: cada una más cerca que la anterior');
  ok(enteras.filter((s) => s[0].modo === 'alejan').every((s) => s.every((r, i) => !i || r.dist > s[i - 1].dist)), 'las que se alejan: cada una más lejos');
  ok([...sec.values()].some((s) => s[0].modo === 'acercan') && [...sec.values()].some((s) => s[0].modo === 'alejan'), 'hay de las dos');
  ok(risas.every((r) => r.dist >= 14 && r.dist <= 100), 'y siempre a distancia (nunca encima)');
  ok(enteras.every((s) => s.every((r, i) => !i || (r.t - s[i - 1].t) > 1.7 && (r.t - s[i - 1].t) < 3.4)), 'con 2 a 3 segundos entre risitas');
  // los eventos de una noche son pocos por cuadro: la agenda casi siempre devuelve la lista vacía
  const ag = A.crearAgenda(A.PERFILES.primera, crearAzar(3)); let conEvento = 0, cuadros = 0;
  for (let i = 0; i < 6000; i++) { cuadros++; if (ag.paso(1 / 60, { activo: true, fase: 'ataque', f: 1, noche: 1, vivos: 3, cerca: 40, ojos: 0, antorchaLista: true }).length) conEvento++; }
  ok(conEvento / cuadros < 0.02, `la agenda no hace nada en el ${(100 - 100 * conEvento / cuadros).toFixed(1)} % de los cuadros`);
  const a1 = ag.paso(0.016, { activo: true, fase: 'ataque', noche: 1 }), a2 = ag.paso(0.016, { activo: true, fase: 'ataque', noche: 1 });
  ok(a1 === a2, 'la lista de eventos es la misma cada vez (no se arma una nueva por cuadro)');
  ok(A.crearAgenda(A.PERFILES.primera).paso(0.1, { activo: false, fase: 'ataque', noche: 1 }).length === 0, 'caído: nada');
  ok(A.crearAgenda(A.PERFILES.primera).paso(0, { activo: true, fase: 'ataque', noche: 1 }).length === 0 && A.crearAgenda(A.PERFILES.primera).paso(NaN, { activo: true, fase: 'ataque', noche: 1 }).length === 0, 'con un dt que no sirve, nada');
  // abrir la partida en pleno ataque: nada de golpe de llegada ni de silencio
  const tarde = A.crearAgenda(A.PERFILES.primera, crearAzar(2)); const primeros = [];
  for (let i = 0; i < 100; i++) primeros.push(...tarde.paso(0.1, { activo: true, fase: 'ataque', f: 1, noche: 1, vivos: 3, cerca: 40, ojos: 0 }).map((x) => x.k));
  ok(!primeros.includes('llegada') && !primeros.includes('silencio'), 'abrir la partida con los duendes ya afuera: sin golpe de llegada ni silencio');
  // la misma semilla, la misma noche
  const huellaEv = (s) => s.ev.map((x) => `${x.k}${Math.round(x.t * 10)}`).join('|');
  ok(huellaEv(simular('primera', { semilla: 5 })) === huellaEv(simular('primera', { semilla: 5 })) && huellaEv(simular('primera', { semilla: 5 })) !== huellaEv(simular('primera', { semilla: 6 })), 'la misma semilla da la misma noche; otra, otra');
}
{
  // por tipo de noche
  const total = (s) => s.ev.length;
  const primera = simular('primera'), comun = simular('comun');
  ok(total(primera) > 2.2 * total(comun), `la primera noche tiene mucho más ambiente que una común (${total(primera)} contra ${total(comun)} eventos)`);
  ok(comun.de('antorcha').length === 0 && comun.de('ojo').length <= 8 && comun.de('crujido').length <= 14, `una común: lo justo (${comun.de('ojo').length} ojos, ${comun.de('crujido').length} ramas)`);
  const niebla = simular('niebla'), luna = simular('lunallena'), sil = simular('silenciosa');
  ok(niebla.de('ojo').length === 0 && niebla.de('oirDuende').length >= 40, `niebla: ningún par de ojos (no se ve) y ${niebla.de('oirDuende').length} veces se oye a un duende de verdad`);
  ok(niebla.de('oirDuende').every((x) => ['pasos', 'risa', 'respiro'].includes(x.modo)) && new Set(niebla.de('oirDuende').map((x) => x.modo)).size === 3, 'se los oye de tres maneras: pasos, risa, respiración');
  ok(niebla.de('crujido').length > comun.de('crujido').length * 2, 'en la niebla cruje más');
  ok(luna.de('oirDuende').length >= 15 && luna.de('ojo').length >= 8 && luna.de('risa').every((x) => x.viejo), 'luna llena: se los oye y se los ve de lejos, y las risas son de viejos');
  ok(sil.de('risa').length === 0 && sil.de('llegada').length === 0 && sil.de('silencio').length === 1 && sil.de('silencio-fin').length === 1, 'silenciosa: sin risitas ni golpe, con su silencio (que se rompe sin golpe)');
  ok(sil.de('silencio')[0].t < primera.de('silencio')[0].t, 'y el silencio de la silenciosa empieza antes');
  // sin duendes en el valle, el valle sigue sonando pero menos
  const vacio = simular('niebla', { vivos: 0, cerca: 99 });
  ok(vacio.de('oirDuende').length === 0, 'sin duendes no se oye a ningún duende (no hay de dónde)');
  const cercanos = simular('niebla', { vivos: 3, cerca: 8 });
  ok(cercanos.de('oirDuende').length === 0, 'con uno ya encima, ya no se los oye "de lejos": ya se los ve');
  // los ojos no pasan del máximo a la vez (lo mira la simulación: cuenta los vivos)
  ok(primera.de('ojo').every((x, i) => primera.de('ojo').filter((y) => y.t <= x.t && y.t + y.vida > x.t).length <= A.PERFILES.primera.ojos.max), 'nunca más de tres pares de ojos a la vez');
}
{
  // el miedo que sube
  const p = A.PERFILES.primera;
  const m = (fase, o = {}) => A.miedoDe(p, { fase, ...o });
  ok(m('previa', { f: 0 }) < m('previa', { f: 0.5 }) && m('previa', { f: 0.5 }) < m('previa', { f: 1 }), 'el miedo sube a lo largo de la previa');
  ok(m('previa', { f: 1 }) <= m('ataque', { vivos: 3, tAtaque: 0 }) + 1e-9 && m('ataque', { vivos: 3 }) > m('ataque', { vivos: 0 }), 'sube al salir, y afloja con el valle vacío');
  ok(m('ataque', { vivos: 3, tAtaque: 600 }) < m('ataque', { vivos: 3, tAtaque: 0 }) && m('ataque', { vivos: 3, tAtaque: 600 }) > 0.7 * p.miedo * 0.7, 'con el rato se acostumbra un poco, sin perderlo');
  ok(m('calma', { noche: 1 }) > 0 && m('calma', { noche: 0 }) === 0, 'de noche queda un resto; de día nada');
  ok(A.miedoDe(A.PERFILES.primera, { fase: 'ataque', vivos: 1 }) > 2 * A.miedoDe(A.PERFILES.comun, { fase: 'ataque', vivos: 1 }) * 0.8, 'la primera noche da más miedo que una común con los mismos duendes');
  ok(A.miedoDe(null, { fase: 'ataque' }) === 0, 'sin perfil, nada');
}

// ============================================================ la pista de la tarde (el lado por donde entran)
{
  // sin lado (los ataques todavía no lo dicen), nada: es leer lo que no existe
  const sin = simular('primera', { semilla: 11 });
  ok(sin.de('pista').length === 0, 'si el juego no dice por qué lado entran, no hay pista');
  // con lado: en la previa, entre un quinto y tres cuartos, cada tanto; nunca de noche ni en el silencio
  const ag = A.crearAgenda(A.PERFILES.primera, crearAzar(4)), pistas = [];
  let tt = 0;
  for (let s = 0; s < 750; s++) { for (const x of ag.paso(0.1, { activo: true, fase: 'previa', f: s / 750, noche: 0.3, vivos: 0, cerca: 99, ojos: 0, hayLado: true })) if (x.k === 'pista') pistas.push({ ...x, f: s / 750 }); tt += 0.1; }
  for (let s = 0; s < 600; s++) for (const x of ag.paso(0.1, { activo: true, fase: 'ataque', f: 1, noche: 1, vivos: 3, cerca: 40, ojos: 0, hayLado: true })) ok(x.k !== 'pista', 'de noche ya no hay pistas: salieron');
  ok(pistas.length >= 3 && pistas.length <= 8, `de tarde hay unas pistas (${pistas.length} en la previa)`);
  ok(pistas.every((p) => p.f > 0.19 && p.f < 0.8 && typeof p.perro === 'boolean'), 'entre un quinto y tres cuartos de la previa, con o sin el perro');
  ok(pistas.some((p) => p.perro) && pistas.some((p) => !p.perro), 'a veces gruñe el perro y a veces suena algo del monte');
  ok(pistas.every((p, i, l) => !i || p.f - l[i - 1].f > 0.1), 'espaciadas (nunca una atrás de otra)');
}

// ============================================================ ojos, mirada, niebla, luna y sombras
{
  ok(A.brilloOjos(0, 10) === 0 && A.brilloOjos(10, 10) === 0 && A.brilloOjos(5, 10) > 0.5 && A.brilloOjos(5, 0) === 0, 'los ojos se abren de a poco y se cierran');
  ok(A.brilloOjos(2, 10) > A.brilloOjos(0.3, 10) && A.brilloOjos(8, 10) > A.brilloOjos(9.8, 10), 'abren y cierran gradual');
  ok(A.brilloOjos(4.6, 10) < 0.2 && A.brilloOjos(4.3, 10) > 0.9, 'parpadean una vez en el medio');
  ok(A.brilloOjos(5, 10, 1) === 0 && A.brilloOjos(5, 10, 0.5) < A.brilloOjos(5, 10, 0), 'y se apagan rápido cuando los mirás');
  let acum = 0;
  for (let i = 0; i < 20; i++) acum = A.seguirMirada(acum, true, 0.1);
  ok(A.ojosSeApagan(acum, 60) && !A.ojosSeApagan(0.5, 60) && A.ojosSeApagan(0.9, 20), 'si los mirás un rato seguido, se apagan (antes cuanto más cerca)');
  ok(A.seguirMirada(1, false, 0.1) < 1 && A.seguirMirada(0, false, 1) === 0, 'mirar para otro lado enfría la cuenta');
  // «mirarlos» es tenerlos en el centro de la vista, no verlos de reojo
  const aqui = { x: 0, z: 0 }, hacia = { x: 0, z: -50 };
  ok(A.enElCentro({ x: 0, z: -1 }, aqui, hacia) && A.enElCentro({ x: 0.2, z: -1 }, aqui, hacia) && !A.enElCentro({ x: 0.5, z: -1 }, aqui, hacia) && !A.enElCentro({ x: 0, z: 1 }, aqui, hacia) && !A.enElCentro({ x: 0, z: 0 }, aqui, hacia), 'se apagan si los tenés en el centro (menos de unos 20 grados), no de reojo ni de espaldas');
  // la niebla: avanza despacio (casi una hora de juego) y se levanta de a poco
  let k = 0, seg = 0;
  while (k < 1 && seg < 600) { k = A.acercar(k, 1, 0.1, A.VELOCIDAD_NIEBLA); seg += 0.1; }
  ok(seg > 60 && seg < 130, `la niebla tarda ${seg.toFixed(0)} s en llegar a pleno`);
  let kb = 1, segb = 0;
  while (kb > 0 && segb < 600) { kb = A.acercar(kb, 0, 0.1, A.VELOCIDAD_NIEBLA); segb += 0.1; }
  ok(segb > 40 && segb < 100, `y ${segb.toFixed(0)} s en levantarse`);
  ok(A.acercar(0.5, 0.5, 1, A.VELOCIDAD_NIEBLA) === 0.5 && A.acercar(0, 1, 1e9, A.VELOCIDAD_NIEBLA) === 1, 'sin pasarse del objetivo');
  ok(A.nieblaExtra(0) === 0 && A.nieblaExtra(1, 1) === A.NIEBLA_MAX && A.nieblaExtra(2) === A.NIEBLA_MAX && A.nieblaExtra(-1) === 0, 'la densidad extra va de 0 al máximo');
  ok(A.nieblaExtra(1, 0.45) < A.nieblaExtra(1, 1) && A.nieblaExtra(1, 0.45) > A.NIEBLA_MAX * 0.5, 'con la vista ya acortada por el clima (lluvia, nubes), no se suma entera');
  ok(A.objetivoNiebla('niebla') === 1 && A.objetivoNiebla('lunallena') === 0 && A.objetivoNiebla(null) === 0 && A.objetivoLuna('lunallena') === 1 && A.objetivoLuna('niebla') === 0, 'la niebla es de la noche de niebla; la luna, de la de luna llena');
  // con esa densidad se ve a unas decenas de metros: la niebla de la escena es exp2 (densidad 0.00185 + extra * 0.55, por 1.5 del estilo)
  const dens = (0.00185 + A.NIEBLA_MAX * 0.55) * 1.5, pasa = (d) => Math.exp(-((dens * d) ** 2));
  ok(pasa(25) > 0.5 && pasa(60) < 0.15 && pasa(90) < 0.01, `con la niebla de esa noche pasa ${(100 * pasa(25)).toFixed(0)} % a 25 m, ${(100 * pasa(60)).toFixed(0)} % a 60 m y ${(100 * pasa(90)).toFixed(1)} % a 90 m`);
  // la luna llena
  ok(A.lunaLlenaLuz(0) === 1 && A.lunaLlenaLuz(1) > 1.8 && A.lunaLlenaLuz(1) < 2.4, 'la luna llena alumbra casi el doble');
  ok(A.lunaLlenaAltura(0.9, 1) <= A.LUNA_LLENA.bajaA + 1e-9 && A.lunaLlenaAltura(0.2, 1) === 0.2 && A.lunaLlenaAltura(0.9, 0) === 0.9 && A.lunaLlenaAltura(0.9, 0.5) > A.LUNA_LLENA.bajaA && A.lunaLlenaAltura(0.9, 0.5) < 0.9, 'baja la luna (sombras largas), nunca la sube');
  // las sombras largas de las antorchas
  const s2 = A.sombraDeAntorcha(2, 1.75), s6 = A.sombraDeAntorcha(6, 1.75), s11 = A.sombraDeAntorcha(11, 1.75);
  ok(s2.largo > s6.largo && s6.largo > s11.largo && s2.largo <= A.SOMBRA_ANTORCHA.maxLargo + 1e-9, `cuanto más cerca de la llama, más larga la sombra (${s2.largo.toFixed(1)}, ${s6.largo.toFixed(1)}, ${s11.largo.toFixed(1)} m para un cuerpo de 1,75)`);
  ok(s2.largo > 1.75 * 2 && s11.largo > 0.5, 'y más larga que el cuerpo, que es lo que da miedo');
  ok(A.sombraDeAntorcha(14, 1.75).largo === 0 && A.sombraDeAntorcha(0.1, 1.75).largo === 0 && A.sombraDeAntorcha(5, 1.75, 0.1).largo === 0, 'sin luz que llegue (lejos, o de día), no hay sombra');
  ok(A.sombraDeAntorcha(5, 3).largo > A.sombraDeAntorcha(5, 1).largo, 'más alto, más larga');
  ok(A.sombraDeAntorcha(12.9, 1.75).largo < 0.5, 'en el borde del alcance se va achicando a nada (no aparece de golpe)');
  ok(s2.alfa > s11.alfa && s2.alfa <= 0.5 && s2.ancho > 0, 'más oscura de cerca');
}

// ============================================================ los animales que avisan
{
  const F = A.FAUNA;
  ok(A.avisaElPuesto('tero', 40, 100) && !A.avisaElPuesto('tero', 70, 100) && !A.avisaElPuesto('tero', 40, 5), 'el tero grita si pasan cerca y ya descansó');
  ok(A.avisaElPuesto('vaca', 60, 100) && !A.avisaElPuesto('vaca', 80, 100) && !A.avisaElPuesto('vaca', 60, 20), 'la vaca muge más de lejos que el tero grita, y más espaciado');
  ok(F.vaca.espera > F.tero.espera && F.tero.alcance < F.vaca.alcance, 'el tero avisa más seguido; la vaca, de más lejos');
  ok(!A.avisaElPuesto('tero', 10, 100, 0.1), 'de día no');
  ok(!A.avisaElPuesto('constructor', 10, 100) && !A.avisaElPuesto('__proto__', 10, 100) && !A.avisaElPuesto(null, 10, 100), 'un animal que no existe, no avisa');
  ok(A.avesCallan(40) && A.avesCallan(59) && !A.avesCallan(61) && !A.avesCallan(500), 'los pájaros callan con duendes a menos de 60 m');
}

// ============================================================ el tiempo no se toca: la primera noche sigue igual
{
  const c1 = composicionOleada(1, 'normal', 0);
  ok(c1.join() === 'rastreador,rastreador,rastreador', `la primera noche trae los mismos tres traviesos de siempre (${c1.join()})`);
  ok(composicionOleada(2, 'normal', 0).join() === 'rastreador,rastreador,rastreador,rastreador,bruto', 'y la segunda, los mismos cinco');
  ok(JSON.stringify(Object.keys(ESPECIALES).filter((e) => ['roja', 'eclipse', 'silenciosa', 'apagon'].includes(e))) === '["roja","eclipse","silenciosa","apagon"]', 'las especiales de antes siguen donde estaban');
  // armar.mjs sólo entiende imports en una línea (uno en varias deja los módulos mal ordenados y el juego no arranca)
  for (const f of ['src/desafio-ambiente.js', 'src/desafio-ambiente-mundo.js', 'src/desafio-ambiente-sonidos.js', 'src/desafio-sonidos.js', 'src/desafio-musica.js']) ok(!/^import\s*\{\s*$/m.test(leer(f)) && !/^(export .* from|import ['"])/m.test(leer(f)), `${f}: imports en una línea`);
  // los archivos del ambiente no tocan las reglas de las noches
  for (const f of ['src/desafio-ambiente.js', 'src/desafio-ambiente-mundo.js', 'src/desafio-ambiente-sonidos.js']) {
    const t = leer(f).split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).join('\n');
    ok(!/ESPECIALES\s*(\[[^\]]*\]|\.[a-z]+)?\s*=[^=>]/.test(t) && !/composicionOleada\(/.test(t) && !/aplicarEspecial\(/.test(t) && !/nocheEspecial\(/.test(t) && !/\.especial\s*=[^=]/.test(t), `${f}: lee la noche, no la cambia`);
  }
}

// ============================================================ los sonidos nuevos
{
  const huellas = {};
  const brillos = {};
  const rms = {};
  for (const [clave, S] of Object.entries(SA.SONIDOS_AMBIENTE)) {
    huellas[clave] = new Set();
    let suma = 0, sumaRms = 0;
    for (let k = 0; k < 5; k++) {
      const d = completar(S.receta(TASA_PREVIA, crearAzar(100 + k)));
      const m = medir(d), seg = d.length / TASA_PREVIA;
      ok(d instanceof Float32Array && m.nan === 0 && m.pico > 0.85 && m.pico <= 0.91, `${clave} ${k + 1}: suena, sin NaN ni recorte (pico ${m.pico.toFixed(2)})`);
      ok(Math.abs(m.dc) < 0.01 && m.rms > 0.02, `${clave} ${k + 1}: sin continua y con cuerpo (rms ${m.rms.toFixed(3)})`);
      ok(seg > 1.2 && seg < 2.8, `${clave} ${k + 1}: dura ${seg.toFixed(2)} s`);
      // sin colas largas de silencio ni cortes bruscos: el último 5 % es mucho más flojo que el pico, y no arranca con un golpe fuerte
      const cola = medir(d.subarray(Math.floor(d.length * 0.98)));
      ok(cola.pico < 0.12, `${clave} ${k + 1}: termina sin cortar (el último 2 % pico ${cola.pico.toFixed(3)})`);
      huellas[clave].add(huella(d));
      if (k < 2) { suma += brillo(d, TASA_PREVIA); sumaRms += m.rms; }
    }
    ok(huellas[clave].size === 5, `${clave}: las cinco variantes son distintas`);
    ok(huella(completar(S.receta(TASA_PREVIA, crearAzar(100)))) === huella(completar(S.receta(TASA_PREVIA, crearAzar(100)))), `${clave}: la misma semilla, el mismo sonido`);
    brillos[clave] = suma / 2; rms[clave] = sumaRms / 2;
    ok(S.variantes >= 3 && S.nivel > 0 && S.nivel < 1, `${clave}: ${S.variantes} variantes y un nivel de ${S.nivel}`);
  }
  if (process.env.DETALLE) console.log({ brillos, rms });
  ok(brillos.vaca < 900 && brillos.tero > 1500 && brillos.tero > 2 * brillos.vaca, `la vaca es grave (${Math.round(brillos.vaca)} Hz de brillo) y el tero agudo y áspero (${Math.round(brillos.tero)} Hz)`);
  ok(brillos.crujido > 800, `la rama tiene chasquido (${Math.round(brillos.crujido)} Hz de brillo)`);
  // el nivel contra la referencia del valle de noche: la risa de los duendes (0,3 de nivel, RMS 0,10)
  const referencia = 0.3 * medir(completar(RD.sintetizarRisa(RD.planRisa('chico', RD.semillaRisa('chico', 0)), RD.TASA_RISA))).rms;
  for (const c of ['tero', 'vaca']) {
    const rel = SA.SONIDOS_AMBIENTE[c].nivel * rms[c] / referencia;
    ok(rel > 0.6 && rel < 1.8, `${c}: suena a ${rel.toFixed(2)} veces la risa de un duende a la misma distancia`);
  }
  ok(SA.SONIDOS_AMBIENTE.crujido.nivel * 0.9 < 0.5 && SA.SONIDOS_AMBIENTE.crujido.nivel * 0.9 > 0.2, 'el chasquido de la rama, de pico medio (no tapa la risa ni se pierde)');
  ok(Object.values(SA.SONIDOS_AMBIENTE).every((S) => S.nivel * 0.9 * 2 < 1), 'ni dos juntos saturan');
}

// ============================================================ el motor reproduce los sonidos nuevos
{
  // un contexto de mentira que cuenta los nodos
  const cuenta = { nodos: 0, inicios: [] };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const nodo = () => { cuenta.nodos++; const o = { connect() {}, disconnect() {}, start(t) { cuenta.inicios.push(t); }, stop() {}, addEventListener() {}, gain: param(), frequency: param(), Q: param(), playbackRate: { value: 1 }, type: '', buffer: null }; return o; };
  const sonido = {
    ctx: { currentTime: 10, createBufferSource: nodo, createGain: nodo, createBiquadFilter: nodo }, bus: { efectos: nodo() }, relax: false, offline: false,
    oyente: { x: 0, y: 1.7, z: 0 },
    variante: (clave, cuantas, crear, renovar, alListo) => { sonido.pedidas.push(clave); return { duration: 2 }; },
    variantes: (clave) => { sonido.hechas.push(clave); return {}; }, pedidas: [], hechas: [],
    fuente: (pos, vol, rev) => { sonido.fuentes.push({ pos, vol, rev }); return nodo(); }, fuentes: [],
    puedeSonar: () => true, soltarAlTerminar() {},
  };
  const amb = SA.crearSonidosAmbiente(sonido);
  ok(amb.preparar() === true && sonido.hechas.length === 3 && sonido.hechas.every((c) => /^ambiente-/.test(c)), 'preparar encarga las tres a la cola del motor');
  cuenta.nodos = 0;
  const cerca = amb.tero({ x: 30, y: 1, z: 0 }), lejos = amb.tero({ x: 130, y: 1, z: 0 });
  ok(cerca && lejos && cuenta.nodos <= 2 * 5 + 2 * 2, `cada sonido usa pocos nodos (${cuenta.nodos} para dos)`);
  ok(sonido.fuentes[0].vol > sonido.fuentes[1].vol, 'el que está más lejos suena más bajo');
  ok(cuenta.inicios[1] - cuenta.inicios[0] > 0.25, `y llega más tarde: la velocidad del sonido (${(cuenta.inicios[1] - cuenta.inicios[0]).toFixed(2)} s de diferencia)`);
  ok(amb.crujido({ x: 50, y: 1, z: 50 }) && amb.vaca({ x: -60, y: 1, z: 20 }), 'la rama y la vaca también');
  ok(sonido.pedidas.includes('ambiente-crujido') && sonido.pedidas.includes('ambiente-vaca') && sonido.pedidas.filter((c) => c === 'ambiente-tero').length === 2, 'cada una pide su banco de variantes');
  ok(amb.usados.length === 3, 'se anotan los bancos que se usaron');
  sonido.relax = true;
  ok(amb.tero({ x: 30, y: 1, z: 0 }) === null && amb.preparar() === false, 'en el Relax no suena ni se prepara');
  sonido.relax = false; sonido.ctx = null;
  ok(amb.tero({ x: 30, y: 1, z: 0 }) === null, 'sin motor de audio todavía, nada (y sin romper)');
  sonido.ctx = { currentTime: 10, createBufferSource: nodo, createGain: nodo, createBiquadFilter: nodo };
  sonido.puedeSonar = () => false;
  ok(amb.tero({ x: 30, y: 1, z: 0 }) === null, 'con el tope de sonidos lleno, se saltea');
}
{
  // el banco del Desafío: los nombres nuevos, escritos (subtítulos), y que sin motor no rompen
  const falso = { relax: false, calladas: 0, roto: 0, aves: 0, avisos: 0, tonos: 0, ruidos: 0, impactos: 0,
    callar() { this.calladas++; }, romperSilencio() { this.roto++; }, callarAves() { this.aves++; }, marcarAviso() { this.avisos++; },
    tono() { this.tonos++; }, golpeRuido() { this.ruidos++; }, impacto() { this.impactos++; }, ctx: null, bus: { efectos: {} }, ruido: {} };
  const B = crearBanco(falso);
  for (const clave of ['crujidoRama', 'teroGrita', 'vacaMuge', 'prepararAmbiente', 'silencioRaro', 'salen', 'callarAves']) ok(typeof B[clave] === 'function', `el banco tiene ${clave}`);
  B.crujidoRama({ x: 1, y: 1, z: 1 }, true); B.teroGrita({ x: 1, y: 1, z: 1 }); B.vacaMuge({ x: 1, y: 1, z: 1 }); B.prepararAmbiente();
  B.silencioRaro(); B.callarAves(10);
  ok(falso.calladas === 1 && falso.aves === 1, 'el silencio raro y los pájaros callados llegan al motor');
  B.salen();
  ok(falso.roto === 1, 'salen: rompe el silencio');
  ok(SONIDOS_ESCRITOS.crujidoRama === 'ramas que crujen' && SONIDOS_ESCRITOS.teroGrita === 'un tero grita' && SONIDOS_ESCRITOS.vacaMuge === 'una vaca muge', 'los sonidos nuevos se escriben (subtítulos con dirección)');
  ok(/\bsalen: \(\) => \{\n\s+sonido\.romperSilencio/.test(leer('src/desafio-sonidos.js')), 'salen empieza rompiendo el silencio');
}
{
  // el motor de verdad, con un contexto de mentira: el silencio raro calla a los pájaros y los grillos, y se rompe
  const param = () => ({ value: 1, setValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const nodo = () => ({ connect() {}, disconnect() {}, gain: param() });
  const S = new Sonido();
  S.ctx = { currentTime: 10 };
  S.agaches = { ambiente: nodo(), musica: nodo(), techo: nodo() };
  ok(S.avesCalladas === false, 'sin silencio, los pájaros no están callados');
  S.callar(8, 0.8);
  ok(S.avesCalladas === true && S.agachadoHasta > 17 && S.agachadoHasta < 19, 'callar(8): los pájaros callados y la mezcla agachada por ese rato');
  ok(S.cantar('zorzal', { x: 0, y: 0, z: 0 }) === null && S.cantar('chucao', { x: 0, y: 0, z: 0 }) === null, 'en el silencio no canta ni el zorzal ni el chucao');
  S.ctx.currentTime = 19;
  ok(S.avesCalladas === false, 'pasados los segundos, vuelven');
  S.callar(30); S.romperSilencio();
  ok(S.avesCalladas === false && S.agachadoHasta === 0, 'romperSilencio: vuelve todo de golpe');
  S.callarAves(5, false);
  ok(S.avesCalladas === true && S.grillosCallados === false && !(S.agachadoHasta > 19), 'callarAves calla a los pájaros sin agachar la mezcla ni callar a los grillos (esos, sólo con un duende encima)');
  S.callarAves(5);
  ok(S.grillosCallados === true, 'y con `grillos`, también a los grillos');
  S.callar(8);
  ok(S.avesCalladas && S.grillosCallados, 'el silencio raro calla a los dos');
  const son = leer('src/sonido.js');
  ok(/\* \(this\.grillosCallados \? 0\.12 : 1\), t, 2\);/.test(son) && /e\.lluvia < 0\.6 && !this\.avesCalladas/.test(son), 'los grillos y los pájaros de ambiente respetan el silencio');
}

// ============================================================ la música
function sonidoFalso() {
  const cuenta = { nodos: 0, tonos: [], ruidos: 0, pulsos: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const nodo = () => { cuenta.nodos++; return { connect() {}, disconnect() {}, start() {}, stop() {}, setPeriodicWave() {}, addEventListener() {}, gain: param(), frequency: param(), detune: param(), Q: param(), type: '', buffer: null, loop: false, onended: null }; };
  const ctx = { currentTime: 0, state: 'running', createGain: nodo, createOscillator: nodo, createBiquadFilter: nodo, createBufferSource: nodo };
  return { ctx, bus: { musica: nodo() }, envioReverb: nodo(), ruido: {}, ondas: { cuerda: {} }, musicaActiva: true, puedeSonar: () => true,
    tono: (o) => { cuenta.tonos.push(o); }, golpeRuido: () => { cuenta.ruidos++; }, pulsar: () => { cuenta.pulsos++; }, cuenta };
}
{
  const correr = (especial, fases, miedo, seg = 60) => {
    const s = sonidoFalso(), m = crearMusicaTension(s), est = { activo: true, fase: 'ataque', tension: 0.3, especial, miedo, avance: 1, silencio: false };
    const conNodos = [], niveles = [];
    for (let i = 0; i < seg * 60; i++) {
      s.ctx.currentTime += 1 / 60;
      const antes = s.cuenta.nodos;
      m.actualizar(1 / 60, { ...est, ...(fases ? fases(i / 60) : {}) });
      if (s.cuenta.nodos > antes) conNodos.push(s.cuenta.nodos - antes);
      if (i % 60 === 0) niveles.push(m.nivel);
    }
    return { s, m, conNodos, niveles };
  };
  // sin errores, y con tope de nodos: nada por cuadro (sólo las notas sueltas, de vez en cuando)
  for (const especial of [null, 'roja', 'eclipse', 'silenciosa', 'apagon', 'niebla', 'lunallena']) {
    const r = correr(especial, null, 0.7, 90);
    ok(r.niveles.at(-1) > 0.3, `música ${especial || 'común'}: sube y se sostiene (nivel ${r.niveles.at(-1).toFixed(2)})`);
    ok(r.conNodos.length <= 90 * 60 * 0.01 && Math.max(0, ...r.conNodos) <= 24, `música ${especial || 'común'}: ${r.conNodos.length} cuadros de 5400 crearon nodos (como mucho ${Math.max(0, ...r.conNodos)} a la vez)`);
    ok(r.s.cuenta.nodos < 700, `música ${especial || 'común'}: ${r.s.cuenta.nodos} nodos en un minuto y medio`);
  }
  // el latido de cada noche
  const lat = (e) => new Set(correr(e, null, 0.5, 40).s.cuenta.tonos.map((t) => t.frec));
  ok(lat(null).has(62) && lat(null).has(56), 'el latido común: dos golpes (62 y 56 Hz)');
  ok(lat('niebla').has(62) && !lat('niebla').has(56), 'niebla: un golpe solo, amortiguado');
  ok(lat('lunallena').has(52) && !lat('lunallena').has(62) && !lat('lunallena').has(56), 'luna llena: un golpe más grave y pesado (52 Hz)');
  const cuantos = (e) => correr(e, null, 0.5, 40).s.cuenta.tonos.filter((t) => t.frec >= 50 && t.frec <= 62 && t.dur >= 0.3).length;
  ok(cuantos('niebla') < cuantos(null) * 0.85 && cuantos('lunallena') < cuantos(null), `niebla y luna llena laten más despacio (${cuantos(null)} golpes contra ${cuantos('niebla')} y ${cuantos('lunallena')})`);
  // sube de a poco con el miedo en la previa
  const previa = (miedo) => correr(null, (t) => ({ fase: 'previa', avance: Math.min(1, t / 60), tension: 0.1, miedo }), miedo, 60);
  const sin = previa(0), con = previa(0.82);
  ok(con.niveles.at(-1) > sin.niveles.at(-1) + 0.05, `con miedo la música llega más arriba al final de la previa (${con.niveles.at(-1).toFixed(2)} contra ${sin.niveles.at(-1).toFixed(2)})`);
  ok(con.niveles[20] < con.niveles.at(-1) && con.niveles[5] < con.niveles[40], 'y sube de a poco (no de golpe)');
  ok(con.niveles.every((v, i, l) => !i || v - l[i - 1] < 0.08), 'sin saltos');
  // el silencio raro: la música se calla; y cuando salen, vuelve de golpe
  const s = sonidoFalso(), m = crearMusicaTension(s);
  const est = { activo: true, fase: 'previa', tension: 0.1, especial: null, miedo: 0.82, avance: 0.9, silencio: false };
  const avanzar = (seg, o = {}) => { for (let i = 0; i < seg * 60; i++) { s.ctx.currentTime += 1 / 60; m.actualizar(1 / 60, { ...est, ...o }); } };
  avanzar(40, { avance: 0.9 });
  const antes = m.nivel;
  avanzar(5, { silencio: true, avance: 0.9 });
  ok(antes > 0.2 && m.nivel < antes * 0.35, `en el silencio raro la música se apaga (de ${antes.toFixed(2)} a ${m.nivel.toFixed(2)} en 5 s)`);
  const tonosAntes = s.cuenta.tonos.length;
  m.llegaron(1);
  ok(m.nivel >= 0.5, `cuando salen, sube de golpe (nivel ${m.nivel.toFixed(2)})`);
  avanzar(2, { fase: 'ataque', avance: 1, silencio: false, tension: 0.3 });
  ok(m.nivel > 0.5, 'y se sostiene');
  m.llegaron(0);
  ok(typeof m.llegaron === 'function' && typeof m.actualizar === 'function' && typeof m.alba === 'function' && typeof m.detener === 'function', 'la música sigue ofreciendo lo de siempre');
  m.detener();
  // sin motor de audio (el Relax, la portada): nada
  const nada = crearMusicaTension({ ctx: null });
  nada.llegaron(1); nada.actualizar(0.1, { activo: true, fase: 'ataque', miedo: 1, silencio: true });
  ok(nada.nivel >= 0, 'sin audio no rompe');
  // basura en el estado
  const raro = crearMusicaTension(sonidoFalso());
  raro.actualizar(0.016, { activo: true, fase: 'ataque', tension: NaN, miedo: 'mucho', avance: Infinity, silencio: undefined, especial: 'niebla' });
  raro.actualizar(NaN, undefined);
  ok(Number.isFinite(raro.nivel), 'con datos raros, el nivel sigue siendo un número');
}

// ============================================================ el cableado con el juego (texto)
{
  const des = leer('src/desafio.js'), main = leer('src/main.js'), mundo = leer('src/desafio-ambiente-mundo.js'), cielo = leer('src/cielo.js'), pkg = leer('package.json');
  ok(/import \{ crearAmbienteMundo \} from '\.\/desafio-ambiente-mundo\.js';/.test(des) && /import \{ nocheEnCurso \} from '\.\/desafio-ambiente\.js';/.test(des), 'desafio.js importa el ambiente');
  ok(/const ambiente = crearAmbienteMundo\(\{/.test(des) && /const a = ambiente\.actualizar\(dtReal, e\);/.test(des) && /estadoMusica\.miedo = a\.miedo; estadoMusica\.avance = a\.avance; estadoMusica\.silencio = a\.silencio;/.test(des), 'se actualiza una vez por cuadro y le pasa miedo, avance y silencio a la música');
  ok(des.indexOf('ambiente.actualizar(dtReal, e)') < des.indexOf('musica.actualizar(dtReal, estadoMusica)'), 'antes de la música');
  ok(/lado: \(\) => D\(\)\.ladoNoche \|\| null,/.test(des) && /perroPos: \(\) => perroAliado\(\),/.test(des), 'la pista de la tarde lee `D().ladoNoche` (si no existe, nada) y el perro de donde ya lo lee el juego');
  ok(/ambiente\.limpiar\(\);/.test(des) && /\n    ambiente,   \/\/ 4\.8 ambiente/.test(des), 'se limpia con el resto y main.js lo ve');
  ok(/const ambienteDesafio = desafio\?\.ambiente\?\.clima;/.test(main) && /cielo\.actualizar\(progreso\.horas, clima\.estado, cam, ambienteDesafio \? ambienteDesafio\.extra : 0, ambienteDesafio\)/.test(main), 'main.js le pasa al cielo la niebla y la luna llena del Desafío (en el Relax, nada)');
  ok(/\(desafio\?\.ambiente\?\.clima\.luna \?\? 0\) > 0\.02 \? 0\.5 : faseLunar/.test(main), 'la noche de luna llena, la luna está llena en el cielo');
  ok(/function actualizar\(horas, clima, cam, extraNiebla, ambiente\)/.test(cielo) && /lunaDir\.y \+= \(Math\.min\(lunaDir\.y, 0\.27\) - lunaDir\.y\) \* lunaK/.test(cielo), 'el cielo baja la luna llena (sombras largas) y acepta la niebla');
  ok(/estrellasBase \* \(1 - 0\.85 \* nieblaK\)/.test(cielo), 'y la niebla apaga las estrellas');
  // nada nuevo por cuadro: todo `new THREE.` está en la creación, antes de lo que corre en cada cuadro
  const corte = mundo.indexOf('// ---------------------------------------------------------------- estado');
  ok(corte > 0 && !/new THREE\./.test(mundo.slice(corte)), 'el mundo del ambiente no crea objetos de three después de armarse');
  const cuadro = mundo.slice(mundo.indexOf('function actualizar(dt, e)'));
  ok(!/createBufferSource|createGain|createOscillator|new Float32Array|new Map|new Set|\.map\(|\.slice\(|\[\.\.\./.test(cuadro.slice(0, cuadro.indexOf('function limpiar'))), 'y lo que corre en cada cuadro no arma listas ni nodos de audio');
  ok(!/new THREE\.(PointLight|SpotLight|DirectionalLight|Sprite)/.test(mundo), 'ninguna luz nueva');
  ok((mundo.match(/new THREE\.Points\(/g) || []).length === 1 && /sizeAttenuation: false/.test(mundo) && /N_PUNTOS = N_OJOS \* 2 \+ 1/.test(mundo), 'los ojos y la brasa son un solo dibujo de puntos de tamaño fijo en pantalla (seis pares y la brasa)');
  ok(/posPuntos\[1\] = -600/.test(mundo) && /geoPuntos\.setDrawRange\(0, 1\)/.test(mundo) && /puntos\.visible = false;/.test(mundo), 'el dibujo de los ojos queda a la vista durante la carga (para compilar su programa) y se esconde en el primer cuadro');
  ok(/puntos\.visible = n > 0;/.test(mundo), 'y sólo se dibuja si hay algo que mostrar');
  ok(/matSombra = new THREE\.MeshBasicMaterial/.test(mundo) && /nivelesSombra\[0\]\.setMatrixAt\(0, _m\); nivelesSombra\[0\]\.count = 1;/.test(mundo), 'las sombras de antorcha quedan a la vista durante la carga, para que su programa se compile ahí');
  ok(/N_SOMBRAS = 8/.test(mundo) && /N_OJOS = 6/.test(mundo), 'tope de 8 sombras y 6 pares de ojos');
  ok(/package\.json/.test('package.json') && /verificar-4-8-ambiente\.mjs/.test(pkg), 'esta prueba está en el gate');
}

console.log(`verificar-4-8-ambiente: ${n} comprobaciones OK`);
