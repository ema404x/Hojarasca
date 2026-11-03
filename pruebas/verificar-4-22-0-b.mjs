// 4.22.0 (B): el valle se acuerda. Lo que se arregló, con comprobación de que antes fallaba (cada arreglo tiene su mutación: la misma prueba sobre una copia de
// src/ con el arreglo deshecho tiene que fallar):
//   1. la tarjeta final trae una línea por cada decisión grande (D1 a D5, y la firmeza del trato de la D6) según cómo la tomaste: antes sólo la D4 A y la D5 A
//   2. el tope del lazo por encargos del Relax: a lo sumo +2 por persona y, mientras esté fría o tirante (lazo < 0), +1 en total: una decisión dura pesa
//   3. el valle se acuerda de la primera molienda (D3 A y B) en la mesa de guerra y en el fogón
//   4. la majada (D5) se siente: se avisa antes de decidir, se nota al decidir y, el día de la nevada, se ve quién no está (sin trabar nada)
//   5. la D6 A y B se distinguen: el texto de cada opción dice qué hace y el trato firme se nota en la noche
//   6. la tarjeta final sigue leyéndose cómoda (páginas del mismo tope) y las líneas nuevas cuidan el tono (sin números, sin inglés, nada religioso)
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { H, O, ESC, imp, crear, nuevaPartida, crearJuego, jugar } from './ayuda-4-18-4-historia.mjs';

const FIN = await imp('historia-final.js'), TXL = await imp('historia-texto-lazos.js'), NOCHE = await imp('historia-noche.js');
const TX2 = await imp('historia-texto-acto2.js'), TX3 = await imp('historia-texto-acto3.js');

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4184_SRC || join(raiz, 'src');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const HIJO = !!process.env.A4184_SRC;
const SEC = process.env.A4220_SECCIONES ? new Set(process.env.A4220_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4220_CALLADO) console.log('FALLA ' + t); } };

const DEC = ['bolsa', 'coihue', 'molienda', 'cuaderno', 'majada', 'duendes'];
// una historia terminada de mentira con lo decidido
function hDe(dec = {}, extra = {}) {
  const h = H.historiaNueva();
  h.duendes.trato = extra.trato || 'trato';
  for (const [k, v] of Object.entries(dec)) h.decisiones[k] = v;
  if (extra.ramal !== undefined) h.ramal = extra.ramal;
  for (const [q, v] of Object.entries(extra.lazos || {})) h.lazos[q] = v;
  if (extra.noche) h.duendes.noche = extra.noche;
  return h;
}
const ECOS = FIN.ECOS_FINAL;
const TODOS_ECOS = Object.entries(ECOS).flatMap(([d, o]) => Object.entries(o).map(([v, t]) => ({ d, v, t })));
const sumaPag = (pg) => pg.reduce((s, x) => s + x.length, 0);

// ---------------------------------------------------------------- 1. la tarjeta final se acuerda
if (va('final')) {
  ok(TODOS_ECOS.length === 14, `hay 14 líneas de eco (D1 a D3 con tres, D4 y D5 con dos, y la D6 firme): ${TODOS_ECOS.length}`);
  for (const d of ['bolsa', 'coihue', 'molienda']) ok(['a', 'b', 'c'].every((v) => typeof ECOS[d]?.[v] === 'string'), `${d}: tiene sus tres líneas`);
  for (const d of ['cuaderno', 'majada']) ok(Object.keys(ECOS[d] || {}).join() === 'b,c', `${d}: las líneas nuevas son la B y la C (la A ya estaba: la escuela y el puesto)`);
  ok(Object.keys(ECOS.duendes || {}).join() === 'b', 'la D6: sólo el trato firme (la bolsa de Eusebio en el umbral)');
  // cada opción elegida trae su línea, y sólo esa
  for (const { d, v, t } of TODOS_ECOS) {
    const T = FIN.tarjetaFinal(hDe({ [d]: v }, { trato: d === 'duendes' ? 'trato' : 'trato' })).texto;
    ok(T.includes(t), `${d} ${v}: la tarjeta final trae su línea`);
    ok(TODOS_ECOS.filter((x) => x.t !== t && T.includes(x.t)).length === 0, `${d} ${v}: y ninguna otra línea de eco`);
    const sin = FIN.tarjetaFinal(hDe({})).texto;
    ok(!sin.includes(t), `${d} ${v}: sin la decisión, la línea no sale`);
  }
  // la D4 A y la D5 A siguen saliendo (antes eran de `tarjetaFinal` y ahora van en su lugar con las demás)
  { const T = FIN.tarjetaFinal(hDe({ cuaderno: 'a', majada: 'a' })).texto;
    ok(T.includes(FIN.PIEZAS_FINAL.escuela) && T.includes(FIN.PIEZAS_FINAL.majadaA), 'la escuela (D4 A) y el puesto (D5 A) siguen saliendo');
    ok(T.indexOf(FIN.PIEZAS_FINAL.escuela) < T.indexOf(FIN.PIEZAS_FINAL.majadaA), 'en el orden de las decisiones (D4 antes que D5)'); }
  // con todas las decisiones: exactamente una línea por decisión, en el orden D1 a D6, después del ramal y antes de Graciela y los vecinos
  { const h = hDe({ bolsa: 'b', coihue: 'c', molienda: 'a', cuaderno: 'b', majada: 'c', duendes: 'b' }, { ramal: 10, lazos: { graciela: 3, rosa: 3, tito: 3 }, noche: 'perdida' });
    const T = FIN.tarjetaFinal(h).texto;
    const esperadas = [ECOS.bolsa.b, ECOS.coihue.c, ECOS.molienda.a, ECOS.cuaderno.b, ECOS.majada.c, ECOS.duendes.b];
    const pos = esperadas.map((t) => T.indexOf(t));
    ok(pos.every((p) => p >= 0) && pos.every((p, i) => i === 0 || p > pos[i - 1]), 'las seis líneas salen, en el orden de las decisiones');
    ok(pos[0] > T.indexOf(FIN.PIEZAS_FINAL.ramalSalvado), 'van después del ramal');
    ok(pos[5] < T.indexOf(FIN.PIEZAS_FINAL.graciela) && pos[5] < T.indexOf(TXL.TEXTO_LAZOS.final.rosa[0].texto), 'y antes de Graciela y de los vecinos');
    ok(T.indexOf(FIN.PIEZAS_FINAL.nochePerdida) > pos[5] && T.at(-1) === FIN.PIEZAS_FINAL.siempre, 'la noche perdida y el cierre siguen al final'); }
  // todas las combinaciones de decisiones: nunca más de una línea por decisión, el cierre último, sin repetir, y las páginas con el mismo tope de siempre
  { const valores = [null, 'a', 'b', 'c'];
    let combos = 0, malas = 0, maxPag = 0, anchas = 0;
    const esperada = (dec) => { const r = []; for (const k of DEC) { const v = dec[k]; if (k === 'cuaderno' && v === 'a') r.push(FIN.PIEZAS_FINAL.escuela); else if (k === 'majada' && v === 'a') r.push(FIN.PIEZAS_FINAL.majadaA); else if (ECOS[k]?.[v]) r.push(ECOS[k][v]); } return r; };
    for (const b of valores) for (const c of valores) for (const m of valores) for (const q of valores) for (const j of valores) for (const du of [null, 'a', 'b', 'c']) {
      const dec = { bolsa: b, coihue: c, molienda: m, cuaderno: q, majada: j, duendes: du };
      const h = hDe(dec, { trato: du === 'c' ? 'pelea' : 'trato', ramal: 10, lazos: { graciela: 3, rosa: 3, tito: 3, tobias: 3, herminia: 3, nicanor: 3, belisario: 3, sofia: 3 }, noche: 'perdida' });
      const T = FIN.tarjetaFinal(h);
      const eco = T.texto.filter((t) => TODOS_ECOS.some((x) => x.t === t) || t === FIN.PIEZAS_FINAL.escuela || t === FIN.PIEZAS_FINAL.majadaA);
      combos++;
      if (JSON.stringify(eco) !== JSON.stringify(esperada(dec)) || T.texto.at(-1) !== FIN.PIEZAS_FINAL.siempre || new Set(T.texto).size !== T.texto.length) malas++;
      if (T.paginas.flat().join('|') !== T.texto.join('|')) malas++;
      maxPag = Math.max(maxPag, T.paginas.length);
      const tope = Math.max(...T.texto.map((x) => x.length));
      if (!T.paginas.every((pg, i) => sumaPag(pg) <= FIN.TOPE_PAGINA + tope && (i === T.paginas.length - 1 || sumaPag(pg) <= FIN.TOPE_PAGINA))) anchas++;
      const u = T.paginas.at(-1); if (u.length > 1 && sumaPag(u) + FIN.RESERVA_ULTIMA > FIN.TOPE_PAGINA) anchas++;
    }
    ok(combos === 4096 && malas === 0, `en las ${combos} combinaciones de decisiones: una línea por decisión en orden, sin repetidas, el cierre último y las páginas juntan el texto entero (malas: ${malas})`);
    ok(anchas === 0, `ninguna página pasa del tope y la última deja lugar al premio y a los botones (páginas anchas: ${anchas})`);
    ok(maxPag <= 6, `el peor final (todos los vecinos «de la casa», seis decisiones y la noche perdida) cabe en ${maxPag} páginas de lectura (antes de las líneas nuevas eran 5: como mucho una más)`);
  }
  // lo típico (sin vecinos de la casa) no se alarga: una decisión grande suma una línea y como mucho una página más
  { const sin = FIN.tarjetaFinal(hDe({})), con = FIN.tarjetaFinal(hDe({ bolsa: 'b', coihue: 'b', molienda: 'b', cuaderno: 'b', majada: 'b', duendes: 'b' }, { ramal: 10 }));
    ok(con.texto.length === sin.texto.length + 6, 'seis decisiones tomadas suman seis líneas');
    ok(con.paginas.length <= sin.paginas.length + 2, `y no más de dos páginas (${sin.paginas.length} → ${con.paginas.length})`); }
  // el final del guion no se rompe con basura
  for (const raro of [null, undefined, 'x', 7, [], { decisiones: null }, { decisiones: [] }, { decisiones: { bolsa: 'constructor', coihue: '__proto__', molienda: 'z', cuaderno: 7, majada: {}, duendes: [] } }, { decisiones: 'a' }]) {
    let t = null; try { t = FIN.tarjetaFinal(raro); } catch (e) { t = null; }
    ok(t && Array.isArray(t.texto) && t.texto.at(-1) === FIN.PIEZAS_FINAL.siempre && !TODOS_ECOS.some((x) => t.texto.includes(x.t)), `decisiones raras (${JSON.stringify(raro)?.slice(0, 40)}): no rompe ni inventa líneas`);
  }
  ok(FIN.piezasDecisiones(null).length === 0 && FIN.piezasDecisiones({}).length === 0, 'piezasDecisiones sin historia: nada');
  // la tarjeta de la UI trae las líneas (en alguna de sus páginas)
  { const { P, X } = nuevaPartida(); const h = P.historia;
    const IDS = H.CAPITULOS.map((c) => c.id), idx = IDS.indexOf('deshielo');
    IDS.slice(0, idx).forEach((k) => { h.cerrados[k] = 1; });
    Object.assign(h, { activa: true, capitulo: idx, fase: 'outro', empezada: 1 });
    Object.assign(h.decisiones, { bolsa: 'c', coihue: 'b', molienda: 'b', cuaderno: 'c', majada: 'c', duendes: 'b' });
    h.duendes.trato = 'trato'; h.ramal = 10; P.dia = 20; P.horas = 12;
    const J = crearJuego({ P, X }); J.valle.revisarAhora();
    const vistos = [];
    for (let i = 0; i < 12; i++) { const t = J.valle.tarjetas.actual(); if (!t) break; vistos.push(...t.texto); const sigue = t.opciones.find((o) => o.id === 'sigue'); if (!sigue) break; t.alElegir('sigue'); }
    const esp = [ECOS.bolsa.c, ECOS.coihue.b, ECOS.molienda.b, ECOS.cuaderno.c, ECOS.majada.c, ECOS.duendes.b];
    ok(vistos.length > 0 && esp.every((t) => vistos.includes(t)), 'la tarjeta final del juego (leída página por página) trae las seis líneas'); }
}

// ---------------------------------------------------------------- 6. el tono de las líneas nuevas
if (va('tono')) {
  const LIMITE = 160;
  const ids5 = (t) => { const p = t.toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean); const r = new Set(); for (let i = 0; i + 5 <= p.length; i++) r.add(p.slice(i, i + 5).join(' ')); return r; };
  for (const { d, v, t } of TODOS_ECOS) {
    const id = `${d} ${v}`;
    ok(typeof t === 'string' && t.length >= 60 && t.length <= LIMITE, `${id}: largo cómodo (60 a ${LIMITE} caracteres): ${t.length}`);
    ok(!/\d/.test(t), `${id}: sin números (ni de lazo ni de nada)`);
    ok(!/[ÃÂ�]/.test(t) && !/\b(the|and|you|your|with)\b/i.test(t), `${id}: sin mojibake ni inglés`);
    ok(!/\b(lazo|confianza de|de la casa|de confianza)\b/i.test(t), `${id}: no nombra el lazo`);
    ok(!/(^|[^a-záéíóúñ])(dios|diosa|santo|santa|virgen|ángel|angel|bendic[a-záéíóúñ]*|rez[aáoó][a-záéíóúñ]*|milagro|iglesia|cruz|demonio|diablo|gauchito|difunta)(?![a-záéíóúñ])/i.test(t), `${id}: nada religioso ni figuras sagradas`);
    ok(!/\b(desnud|sexo|beso|cama\b|piel|labios)\b/i.test(t), `${id}: nada sensual explícito`);
    ok(/[.]$/.test(t) && /^[A-ZÁÉÍÓÚ]/.test(t), `${id}: empieza con mayúscula y termina con punto`);
    ok(!/^\s|\s$|\s\s/.test(t), `${id}: sin espacios sobrantes`);
  }
  ok(new Set(TODOS_ECOS.map((x) => x.t)).size === TODOS_ECOS.length, 'ninguna línea de eco repetida');
  // nada repetido (frases de cinco palabras) con las piezas del final, las líneas de los vecinos, las charlas y los finales de siempre
  const otros = [
    ...FIN.FINAL_A, ...FIN.FINAL_B, ...Object.values(FIN.PIEZAS_FINAL),
    ...Object.values(TXL.TEXTO_LAZOS.final).flat().map((x) => x.texto), ...Object.values(TXL.TEXTO_LAZOS.charlas).flat().map((x) => x.texto),
  ].map((t, i) => ({ id: 'otro' + i, t }));
  for (const e of TODOS_ECOS) for (const o of otros) { const a = ids5(e.t), b = ids5(o.t); const c = [...a].filter((x) => b.has(x)); ok(c.length === 0, `repetido: «${e.d} ${e.v}» y «${o.id}» comparten «${c[0]}»`); }
  for (let i = 0; i < TODOS_ECOS.length; i++) for (let j = i + 1; j < TODOS_ECOS.length; j++) { const a = ids5(TODOS_ECOS[i].t), b = ids5(TODOS_ECOS[j].t); const c = [...a].filter((x) => b.has(x)); ok(c.length === 0, `repetido entre ecos: «${TODOS_ECOS[i].d} ${TODOS_ECOS[i].v}» y «${TODOS_ECOS[j].d} ${TODOS_ECOS[j].v}» comparten «${c[0]}»`); }
  // los textos de las escenas nuevas
  const SC = [['historia-escenas-acto3-c10.js', ['Los sacos que salieron por la trochita', 'El almacén está lleno de fiado', 'Hay una silla vacía junto a la ventana', 'Hay dos sillas vacías en la mesa']],
    ['historia-escenas-acto3-c12.js', ['Del techo del galpón falta la silueta de Fermín', 'No están Ramón ni Fermín', 'Una de las lucecitas se adelanta']],
    ['historia-escenas-acto2-c8.js', ['Graciela anota algo del flete del día', 'Cada tanto alguien se acerca a Ercilia']],
    ['historia-escenas-acto3-c9.js', ['Lo que elijas se va a notar el día de la nevada', 'Se lo ve alejarse por la ladera', 'ninguno de los dos te acompaña hasta la tranquera']]];
  for (const [f, partes] of SC) for (const p of partes) {
    const m = leer(f).split('\n').find((l) => l.includes(p)) || '';
    ok(!!m && !/\d{2,}/.test(p) && !/[ÃÂ�]/.test(m) && !/\b(dios|santo|virgen|ángel|bendic|milagro|iglesia)\b/i.test(m), `${f}: la línea «${p.slice(0, 36)}…» está y cuida el tono`);
  }
}

// ---------------------------------------------------------------- 2. el tope del lazo por encargos
if (va('encargos')) {
  const ids = (q, k) => Array.from({ length: k }, (_, i) => ({ id: `${q}-${i + 1}`, quien: q }));
  const lista = [...ids('ramon', 9), ...ids('ema', 7), ...ids('nicanor', 6), ...ids('ercilia', 3), ...ids('guarda', 3), { id: 'x-nadie', quien: 'nadie' }];
  // arma una historia activa con la base ya tomada; `hechos(k)` marca encargos hechos
  const partida = (lazos = {}) => { const h = H.historiaNueva(); Object.assign(h, { activa: true, fase: 'jugando', empezada: 1 }); for (const [q, v] of Object.entries(lazos)) h.lazos[q] = v; const p = { encargos: {} }; O.revisarEncargos(h, p, lista, 1); return { h, p }; };
  const hacer = (S, q, desde, hasta, dia = 5) => { for (let i = desde; i <= hasta; i++) S.p.encargos[`${q}-${i}`] = 'hecho'; return O.revisarEncargos(S.h, S.p, lista, dia); };
  ok(O.TOPE_ENCARGOS_LAZO === 2 && O.TOPE_ENCARGOS_FRIO === 1, 'los topes son +2 (normal) y +1 (frío o tirante)');
  // un vecino normal: dos encargos suman y el resto no
  { const S = partida(); const d = hacer(S, 'ramon', 1, 9); ok(d.length === 2 && H.lazoDe(S.h, 'ramon') === 2, `Ramón con nueve encargos: sólo dos suman (lazo ${H.lazoDe(S.h, 'ramon')}, no 3)`);
    ok(Object.values(S.h.encargosLazo).filter((v) => v >= 1).length === 2 && Object.keys(S.h.encargosLazo).length === 9, 'quedan anotados los nueve (dos con el día, siete con 0): no se vuelven a mirar');
    ok(O.revisarEncargos(S.h, S.p, lista, 9).length === 0 && H.lazoDe(S.h, 'ramon') === 2, 'una sola vez cada uno'); }
  // el primero y el segundo, de a uno
  { const S = partida(); ok(hacer(S, 'ramon', 1, 1).length === 1 && hacer(S, 'ramon', 2, 2).length === 1 && hacer(S, 'ramon', 3, 3).length === 0, 'el primero y el segundo suman; el tercero no'); }
  // frío: una decisión dura (D5 C deja a Ramón en −2) no se borra con encargos
  { const S = partida({ ramon: -2 }); const d = hacer(S, 'ramon', 1, 9); ok(d.length === 1 && H.lazoDe(S.h, 'ramon') === -1, `Ramón en −2 con nueve encargos: sólo uno suma (queda ${H.lazoDe(S.h, 'ramon')}, todavía frío o tirante)`); }
  { const S = partida({ ema: -2 }); hacer(S, 'ema', 1, 7); ok(H.lazoDe(S.h, 'ema') < 0, 'Josefina en −2 (D2 B) con siete encargos: sigue tirante o fría'); }
  { const S = partida({ ramon: -1 }); const d = hacer(S, 'ramon', 1, 4); ok(d.length === 2 && H.lazoDe(S.h, 'ramon') === 1, `tirante (−1): el primer encargo lo lleva a conocido (y recién ahí rige el tope normal): dos suman, lazo ${H.lazoDe(S.h, 'ramon')}`); }
  // si la historia lo levanta después, los encargos de más adelante vuelven a sumar (hasta el tope de siempre)
  { const S = partida({ ramon: -2 }); hacer(S, 'ramon', 1, 3);
    ok(H.lazoDe(S.h, 'ramon') === -1, 'frío: sólo el primero sumó');
    H.cambiarLazo(S.h, 'ramon', 1);   // una escena de la historia lo levanta
    const d = hacer(S, 'ramon', 4, 6); ok(d.length === 1 && H.lazoDe(S.h, 'ramon') === 1, `ya no frío, suma uno más (hasta los dos del tope): lazo ${H.lazoDe(S.h, 'ramon')}`); }
  // un encargo que no sumó (porque estaba frío) no cobra después: el tope es de lo que ya se anotó
  { const S = partida({ ramon: -2 }); hacer(S, 'ramon', 1, 2); H.cambiarLazo(S.h, 'ramon', 3); ok(O.revisarEncargos(S.h, S.p, lista, 9).length === 0, 'lo hecho mientras estaba frío no se cobra después de golpe'); }
  // cada persona tiene su tope
  { const S = partida(); hacer(S, 'ramon', 1, 5); hacer(S, 'ema', 1, 5); hacer(S, 'nicanor', 1, 5);
    ok(H.lazoDe(S.h, 'ramon') === 2 && H.lazoDe(S.h, 'ema') === 2 && H.lazoDe(S.h, 'nicanor') === 2, 'Ramón, Josefina y Nicanor: dos cada uno (los topes no se mezclan)');
    ok(hacer(S, 'ercilia', 1, 3).length === 2 && hacer(S, 'guarda', 1, 3).length === 2, 'Ercilia y Elsa también'); }
  // la historia sola puede dar más: un lazo que sube por la historia + los encargos no pasa de 3
  { const S = partida({ nicanor: 1 }); hacer(S, 'nicanor', 1, 6); ok(H.lazoDe(S.h, 'nicanor') === 3, 'Nicanor llega a «de la casa» con un lazo de la historia y dos encargos (como decía el guion)'); }
  { const S = partida({ ramon: 2 }); hacer(S, 'ramon', 1, 9); ok(H.lazoDe(S.h, 'ramon') === 3, 'y nunca pasa del lazo máximo'); }
  // partidas viejas: lo ya anotado cuenta y no se retrocede nada
  { const h = H.historiaNueva(); Object.assign(h, { activa: true, fase: 'jugando', empezada: 1 }); h.lazos.ramon = 3; h.encargosLazo = Object.fromEntries(ids('ramon', 6).map((e) => [e.id, 4]));
    const p = { encargos: Object.fromEntries(ids('ramon', 9).map((e) => [e.id, 'hecho'])) };
    const d = O.revisarEncargos(h, p, lista, 9); ok(d.length === 0 && h.lazos.ramon === 3 && Object.keys(h.encargosLazo).length === 9, 'una partida vieja con seis encargos pagados: no se le quita nada y los nuevos no suman'); }
  // sin Historia en marcha, nada; quien no tiene lazo, nada; la primera pasada es la base
  { const h = H.historiaNueva(); ok(O.revisarEncargos(h, { encargos: { 'ramon-1': 'hecho' } }, lista, 1).length === 0, 'sin la Historia en marcha no suma'); }
  { const S = partida(); S.p.encargos['x-nadie'] = 'hecho'; ok(O.revisarEncargos(S.h, S.p, lista, 3).length === 0 && S.h.encargosLazo['x-nadie'] === 0, 'quien no tiene lazo: nada'); }
  { const h = H.historiaNueva(); Object.assign(h, { activa: true, fase: 'jugando', empezada: 1 }); const p = { encargos: { 'ramon-1': 'hecho', 'ramon-2': 'hecho' } };
    ok(O.revisarEncargos(h, p, lista, 1).length === 0 && h.encargosLazo['ramon-1'] === 0 && H.lazoDe(h, 'ramon') === 0, 'lo ya hecho al empezar queda de base, sin lazo (como antes)'); }
  // el tope no agrega claves al guardado
  { const S = partida(); hacer(S, 'ramon', 1, 9); const g = H.sanearHistoria(JSON.parse(JSON.stringify(S.h)));
    ok(JSON.stringify(Object.keys(g).sort()) === JSON.stringify(Object.keys(H.historiaNueva()).sort()), 'el guardado no gana claves nuevas'); }
}

// ---------------------------------------------------------------- escenas: el valle se acuerda (3, 4 y 5)
// corre una escena con el director de verdad y devuelve las líneas que se mostraron; `elige`: índice de cada elección (por orden)
function correr(id, { dec = {}, lazos = {}, trato = 'trato', elige = [], hora } = {}) {
  const S = crear({ semilla: 7 });
  const h = S.hist();
  Object.assign(h, { activa: true, fase: 'jugando' });
  for (const [k, v] of Object.entries(dec)) h.decisiones[k] = v;
  for (const [q, v] of Object.entries(lazos)) h.lazos[q] = v;
  h.duendes.trato = trato;
  if (hora !== undefined) S.P.horas = hora;
  const lineas = [];
  let k = 0, ultima = '';
  if (!S.dir.disparar(id)) return { disparo: false, lineas };
  for (let i = 0; i < 40000 && S.dir.activa(); i++) {
    S.dir.actualizar(0.05);
    const d = S.dir.datos();
    if (d?.eleccion) { S.dir.elegir(elige[k] ?? 0); k++; continue; }
    if (d?.dialogo && d.fase === 'corriendo' && d.dialogo.completo) {
      const clave = `${d.dialogo.nombre}|${d.dialogo.texto}`;
      if (clave !== ultima) { lineas.push(d.dialogo.texto); ultima = clave; }
      S.dir.avanzar();
    }
  }
  return { disparo: true, termino: !S.dir.activa(), lineas, S, errores: S.errores };
}
const tiene = (r, parte) => r.lineas.some((l) => l.includes(parte));

if (va('escenas')) {
  // D3 en la mesa de guerra
  const MESA = { A: 'Los sacos que salieron por la trochita', B: 'El almacén está lleno de fiado', F3: 'Hay una silla vacía junto a la ventana', F4: 'Hay dos sillas vacías en la mesa' };
  for (const [m, esperaA, esperaB] of [['a', true, false], ['b', false, true], ['c', false, false], [null, false, false]]) {
    const r = correr('mesa-guerra', { dec: { molienda: m } });
    ok(r.disparo && r.termino && !r.errores.length, `mesa de guerra con D3 ${m}: corre hasta el final sin errores`);
    ok(tiene(r, MESA.A) === esperaA && tiene(r, MESA.B) === esperaB, `mesa de guerra con D3 ${m}: ${esperaA ? 'Ercilia habla de los fletes' : esperaB ? 'Ercilia habla del fiado' : 'ninguna de las dos variantes'}`);
  }
  // D5 en la mesa: las sillas que faltan
  for (const [j, f1, f2] of [['a', false, false], ['b', true, false], ['c', false, true], [null, false, false]]) {
    const r = correr('mesa-guerra', { dec: { majada: j } });
    ok(tiene(r, MESA.F3) === f1 && tiene(r, MESA.F4) === f2, `mesa de guerra con D5 ${j}: ${f1 ? 'una silla vacía (Fermín)' : f2 ? 'dos sillas vacías (Ramón y Fermín)' : 'sin sillas vacías'}`);
  }
  // el fogón (D3 A y B)
  for (const [m, a, b] of [['a', true, false], ['b', false, true], ['c', false, false]]) {
    const r = correr('fogon-leyenda', { dec: { molienda: m }, hora: 21 });
    ok(r.disparo && r.termino && !r.errores.length, `fogón con D3 ${m}: corre hasta el final`);
    ok(tiene(r, 'Graciela anota algo del flete del día') === a && tiene(r, 'Cada tanto alguien se acerca a Ercilia') === b, `fogón con D3 ${m}: ${a ? 'los fletes en la libreta' : b ? 'el fiado devuelto en especias' : 'sin variante (la C ya tiene sus ecos)'}`);
  }
  // la espera de la noche (D5 B y C, D6 firme)
  const ESP = { b: 'Del techo del galpón falta la silueta de Fermín', c: 'No están Ramón ni Fermín', f: 'Una de las lucecitas se adelanta' };
  for (const [j, lb, lc] of [['a', false, false], ['b', true, false], ['c', false, true]]) {
    const r = correr('noche-espera', { dec: { majada: j }, hora: 22, lazos: { ramon: 3, ema: 3, fermin: 3 } });
    ok(r.disparo && r.termino && !r.errores.length, `la espera con D5 ${j}: corre hasta el final`);
    ok(tiene(r, ESP.b) === lb && tiene(r, ESP.c) === lc, `la espera con D5 ${j}: ${lb ? 'falta Fermín en el techo' : lc ? 'faltan Ramón y Fermín' : 'sin avisos de ausencia'}`);
  }
  for (const [du, esperada] of [['b', true], ['a', false], ['c', false]]) {
    const r = correr('noche-espera', { dec: { duendes: du }, trato: du === 'c' ? 'pelea' : 'trato', hora: 22 });
    ok(tiene(r, ESP.f) === esperada, `la espera con D6 ${du}: ${esperada ? 'una lucecita reconoce la bolsa con el piolín' : 'sin la lucecita de la bolsa'}`);
  }
  // lo que se dice es lo que pasa: con esas decisiones, esos aliados no están (se prueba con las reglas de la noche y los lazos que dejan las decisiones y las escenas)
  { const dejar = (dec) => { const h = H.historiaNueva(); Object.assign(h, { activa: true, fase: 'jugando' }); H.tomarDecision(h, 'majada', dec, null, 5); return h; };
    // B: Fermín queda en −1; con las paces (+1) y el secreto de la honda (+1) llega a 1 como mucho: nunca a los 2 que pide la noche
    { const h = dejar('b'); for (let i = 0; i < 2; i++) H.cambiarLazo(h, 'fermin', 1); const al = NOCHE.aliadosDe({ lazos: { ramon: h.lazos.ramon, ema: 3, fermin: h.lazos.fermin }, decisiones: h.decisiones });
      ok(al.fermin === false && al.ramon === true, 'D5 B: aunque hagas las paces y aprendas la honda, Fermín no sube al techo; Ramón sí (lo que dicen las escenas es verdad)'); }
    { const h = dejar('c'); for (let i = 0; i < 2; i++) H.cambiarLazo(h, 'fermin', 1); for (let i = 0; i < 3; i++) H.cambiarLazo(h, 'ramon', 1); const al = NOCHE.aliadosDe({ lazos: { ramon: h.lazos.ramon, ema: 3, fermin: h.lazos.fermin }, decisiones: h.decisiones });
      ok(al.fermin === false && al.ramon === false, 'D5 C: ni Ramón (aunque el lazo suba) ni Fermín están en la noche'); }
    { const h = dejar('a'); H.cambiarLazo(h, 'fermin', 3); H.cambiarLazo(h, 'ramon', 2); const al = NOCHE.aliadosDe({ lazos: { ramon: h.lazos.ramon, ema: 3, fermin: h.lazos.fermin }, decisiones: h.decisiones });
      ok(al.fermin === true, 'D5 A: Fermín sube al techo con la honda (y no se avisa ninguna ausencia)'); }
  }
  // antes de decidir y al decidir la majada
  { const r = correr('fermin-tranquera', { elige: [0] }); ok(r.disparo && r.termino && tiene(r, 'Lo que elijas se va a notar el día de la nevada'), 'D5: antes de elegir, la escena avisa que se va a notar el día de la nevada');
    const b = correr('fermin-tranquera', { elige: [1] }); ok(tiene(b, 'Se lo ve alejarse por la ladera') && !tiene(b, 'ninguno de los dos te acompaña'), 'D5 B: Fermín se aleja y queda la silla que va a hacer falta');
    const c = correr('fermin-tranquera', { elige: [2] }); ok(tiene(c, 'ninguno de los dos te acompaña hasta la tranquera') && !tiene(c, 'Se lo ve alejarse por la ladera'), 'D5 C: ninguno te acompaña hasta la tranquera');
    const a = correr('fermin-tranquera', { elige: [0] }); ok(!tiene(a, 'Se lo ve alejarse') && !tiene(a, 'ninguno de los dos te acompaña'), 'D5 A: sin esas líneas'); }
  // la D6: las dos opciones se distinguen
  { const e = ESC['galpon-encuentro']; const opts = (e.pasos.filter((p) => p.tipo === 'eleccion').find((p) => p.id === 'duendes')?.opciones) || [];
    const t = opts.find((o) => o.id === 'trato')?.texto || '', f = opts.find((o) => o.id === 'fuerte')?.texto || '';
    ok(/manos vac[ií]as/.test(t) && !/bolsa/.test(t), 'D6 A: dice que te sentás con las manos vacías');
    ok(/bolsa de Eusebio/.test(f) && /firme/.test(f) && f !== t, 'D6 B: dice que ponés la bolsa de Eusebio y que es el trato más firme');
    const sin = (e.pasos.filter((p) => p.tipo === 'eleccion').find((p) => p.id === 'duendes-sin')?.opciones) || [];
    ok(/manos vac[ií]as/.test(sin.find((o) => o.id === 'trato')?.texto || ''), 'y sin la bolsa (sólo dos opciones) el trato dice lo mismo');
    const det = H.DEFINICION_DECISIONES.duendes.opciones; ok(/sin palabras/.test(det[0].detalle) && /duendecitos/.test(det[1].detalle), 'las tarjetas de respaldo de la D6 dicen la diferencia');
    const dm = H.DEFINICION_DECISIONES.majada.opciones; ok(/nevada/.test(dm[1].detalle) && /nevada/.test(dm[2].detalle), 'las tarjetas de respaldo de la D5 B y C dicen que se nota el día de la nevada'); }
  // sin trabar: la Historia sigue andando entera con cualquier decisión
  { for (const dec of [{ majada: 'b' }, { majada: 'c' }]) { const r = correr('mesa-guerra', { dec }); ok(r.termino, `la mesa de guerra termina con ${JSON.stringify(dec)}`); } }
}

// ---------------------------------------------------------------- lo que ya andaba sigue andando: la Historia se puede jugar entera
if (va('juego')) {
  for (const semilla of [21, 22, 23]) {
    const r = jugar(semilla);
    ok(r.fin === true && !r.atascado && !(r.errores || []).length, `jugador de mentira (semilla ${semilla}): los trece capítulos terminan sin atascos ni errores${r.atascado ? ' · atascado en ' + JSON.stringify(r.atascado) : ''}`);
    ok(FIN.tarjetaFinal(r.S.hist()).texto.length >= 3, `semilla ${semilla}: y la tarjeta final se arma`);
  }
}

// ---------------------------------------------------------------- mutaciones (cada una en su proceso, sobre una copia de src/)
const MUT = [
  ['historia-optativas.js', 'export const TOPE_ENCARGOS_LAZO = 2;', 'export const TOPE_ENCARGOS_LAZO = 99;', 'el tope de encargos desaparece (vuelve a lavar las decisiones)', 'encargos'],
  ['historia-optativas.js', 'export const TOPE_ENCARGOS_FRIO = 1;', 'export const TOPE_ENCARGOS_FRIO = 2;', 'un vecino frío se arregla con dos encargos', 'encargos'],
  ['historia-optativas.js', 'const tope = lazoDe(h, q) < 0 ? TOPE_ENCARGOS_FRIO : TOPE_ENCARGOS_LAZO;', 'const tope = TOPE_ENCARGOS_LAZO;', 'el frío no tiene su tope más bajo', 'encargos'],
  ['historia-optativas.js', 'ent(v) >= 1 && quien[k] === q', 'ent(v) >= 1', 'el tope se cuenta entre todos los vecinos juntos', 'encargos'],
  ['historia-optativas.js', 'ent(v) >= 1 && quien[k] === q', 'ent(v) >= 0 && quien[k] === q', 'lo que no sumó también cuenta para el tope', 'encargos'],
  ['historia-optativas.js', "      if (pagados(q) < tope) { cambiarLazo(h, q, 1); h.encargosLazo[k] = Math.max(1, ent(dia)); dados.push({ id: k, quien: q }); }\n      else h.encargosLazo[k] = 0;", "      { cambiarLazo(h, q, 1); h.encargosLazo[k] = Math.max(1, ent(dia)); dados.push({ id: k, quien: q }); }", 'los encargos de más suman igual', 'encargos'],
  ['historia-final.js', "  texto.push(...piezasDecisiones(h));", "", 'la tarjeta final no trae las líneas de las decisiones', 'final'],
  ['historia-final.js', "  for (const k of ['bolsa', 'coihue', 'molienda', 'cuaderno', 'majada', 'duendes']) {", "  for (const k of ['duendes', 'majada', 'cuaderno', 'molienda', 'coihue', 'bolsa']) {", 'las líneas salen en el orden contrario', 'final'],
  ['historia-final.js', "    if (k === 'majada' && v === 'a') { r.push(PIEZAS_FINAL.majadaA); continue; }\n", "", 'la D5 A pierde su línea', 'final'],
  ['historia-final.js', "    if (k === 'cuaderno' && v === 'a') { r.push(PIEZAS_FINAL.escuela); continue; }\n", "", 'la D4 A pierde su línea', 'final'],
  ['historia-final.js', "    if (t) r.push(t);", "    r.push(t);", 'una opción sin línea mete un hueco en la tarjeta', 'final'],
  ['historia-final.js', "const d = h?.decisiones && typeof h.decisiones === 'object' && !Array.isArray(h.decisiones) ? h.decisiones : {};", "const d = h.decisiones;", 'un guardado raro rompe la tarjeta', 'final'],
  ['historia-final.js', "    b: 'El fiado largo llenó el almacén de gente cada invierno. En la mesa larga hay un lugar más por año, y siempre alguien lo ocupa.',", "    b: 'El fiado largo llenó el almacén de gente cada invierno. En la mesa larga hay un lugar más por año, y siempre alguien lo ocupa. Son 3 los que vuelven.',", 'una línea con un número a la vista', 'tono'],
  ['historia-final.js', "    a: 'Cada otoño, sobre el tocón de la raíz aparece un puñado de piñones bien juntos. Vos hacés como que no ves quién los deja.',", "    a: 'Cada otoño, sobre el tocón de la raíz aparece un puñado de piñones bien juntos. Rezá para que sigan viniendo, que no ves quién los deja.',", 'una línea con tono religioso', 'tono'],
  ['historia-escenas-acto3-c10.js', "siDecision('molienda', 'a')),\n    con(dlg('ercilia', ['El almacén está lleno", "siDecision('molienda', 'z')),\n    con(dlg('ercilia', ['El almacén está lleno", 'la mesa de guerra no se acuerda de los fletes', 'escenas'],
  ['historia-escenas-acto3-c10.js', "siDecision('molienda', 'b')),\n    con(narra('Hay una silla vacía", "siDecision('molienda', 'z')),\n    con(narra('Hay una silla vacía", 'la mesa de guerra no se acuerda del fiado', 'escenas'],
  ['historia-escenas-acto3-c10.js', "siDecision('majada', 'b')),\n    con(narra('Hay dos sillas", "siDecision('majada', 'z')),\n    con(narra('Hay dos sillas", 'la mesa no tiene la silla de Fermín', 'escenas'],
  ['historia-escenas-acto3-c10.js', "siDecision('majada', 'c')),\n    con(narra('Nadie dice lo que todos piensan: que si el trato", "siDecision('majada', 'z')),\n    con(narra('Nadie dice lo que todos piensan: que si el trato", 'la mesa no tiene las dos sillas vacías', 'escenas'],
  ['historia-escenas-acto3-c10.js', "'Dejar la puerta abierta y sentarte en el umbral, con las manos vacías.', { efecto: 'duendes:trato' }),\n      opcion('fuerte'", "'Dejar la puerta abierta y sentarte en el umbral.', { efecto: 'duendes:trato' }),\n      opcion('fuerte'", 'la D6 A vuelve a no decir que va con las manos vacías', 'escenas'],
  ['historia-escenas-acto3-c10.js', "Dejar la puerta abierta y poner la bolsa de Eusebio en el umbral: el trato más firme.", "Poner la bolsa de Eusebio en el umbral.", 'la D6 B vuelve a no decir que es más firme', 'escenas'],
  ['historia-escenas-acto3-c12.js', "siDecision('majada', 'b')),\n    con(narra('No están Ramón", "siDecision('majada', 'z')),\n    con(narra('No están Ramón", 'la espera no avisa que falta Fermín', 'escenas'],
  ['historia-escenas-acto3-c12.js', "como quien reconoce una bolsa con su piolín colorado.'), siTrato('fuerte')),", "como quien reconoce una bolsa con su piolín colorado.'), siTrato('trato')),", 'la lucecita de la bolsa sale con cualquier trato', 'escenas'],
  ['historia-escenas-acto2-c8.js', "siDecision('molienda', 'a')),\n    con(narra('Cada tanto alguien", "siDecision('molienda', 'z')),\n    con(narra('Cada tanto alguien", 'el fogón no se acuerda de los fletes', 'escenas'],
  ['historia-escenas-acto2-c8.js', "que disimula mal.'), siDecision('molienda', 'b')),", "que disimula mal.'), siDecision('molienda', 'z')),", 'el fogón no se acuerda del fiado', 'escenas'],
  ['historia-escenas-acto3-c9.js', "narra('Lo que elijas se va a notar el día de la nevada: quién está a tu lado y quién no.'),", "", 'la escena no avisa antes de elegir la majada', 'escenas'],
  ['historia-escenas-acto3-c9.js', "Y una silla que de golpe va a hacer falta en otra parte.'), siEleg('majada', 'b')),", "Y una silla que de golpe va a hacer falta en otra parte.'), siEleg('majada', 'z')),", 'D5 B no se nota al decidir', 'escenas'],
  ['historia-escenas-acto3-c9.js', "El camino de vuelta se hace largo.'), siEleg('majada', 'c')),", "El camino de vuelta se hace largo.'), siEleg('majada', 'z')),", 'D5 C no se nota al decidir', 'escenas'],
  ['historia.js', "Fermín se va dolido: el día de la nevada no va a estar a tu lado.", "Fermín se va dolido.", 'la tarjeta de respaldo de la D5 B no avisa', 'escenas'],
  ['historia.js', "'Un trato, sin palabras: les dejás el lugar y nada más.'", "'Un trato.'", 'la tarjeta de respaldo de la D6 A no dice qué es', 'escenas'],
];
let atrapadas = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4220b-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = leer(`${arch}`);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4184_SRC: dir, A4220_CALLADO: '1', A4220_SECCIONES: secc }, encoding: 'utf8', timeout: 280000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  const corridas = MUT.length;
  ok(atrapadas === corridas, `las mutaciones se atrapan (${atrapadas} de ${corridas})`);
}

if (!HIJO) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.22.0 (B) el valle se acuerda: finales por decisión, tope del lazo por encargos, ecos de la molienda y la majada, D6 clara · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
