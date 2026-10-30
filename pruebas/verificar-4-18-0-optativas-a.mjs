// 4.18.0 (agente A): la mecánica de las subtramas optativas de la Historia («El trato del molino», GUION_HISTORIA.md §6). El registro
// (historia-optativas.js): que estén las 28 del guion, sus ventanas, que se ofrezcan con su condición, que se cumplan y se anoten una sola vez,
// que den el premio del guion sin duplicar el lazo de la escena, que nunca traben un capítulo; los disparadores nuevos (frasco, oveja, pan de
// Fermín, la vuelta con Graciela, juntar las ovejas, el cumpleaños, las plumas del gallinero, abrir sin golpear), el arreo de la oveja y de las
// desparramadas, el +1 de lazo de los encargos, el pan de Rosa, las flechas de más, la charla de historia, el tablón y el guardado. Con las
// escenas de B (si están) o con los huecos: la mecánica no depende de que la escena exista. Al final, mutaciones (cada una en un proceso aparte,
// sobre una copia de src/, para que el caché de ESM no mida sólo la primera).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.OPTATIVAS_SRC || join(raiz, 'src');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
const imp = (f) => import(pathToFileURL(join(SRC, f)).href);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.OPTATIVAS_CALLADO) console.log('FALLA ' + t); } };

const H = await imp('historia.js');
const D = await imp('historia-disparadores.js');
const O = await imp('historia-optativas.js');
const DO = await imp('historia-disparadores-optativas.js');
const AR = await imp('historia-arreo.js');
const N = await imp('historia-noche.js');
const EN = await imp('escenas.js');
const T1 = (await imp('historia-texto-acto1.js')).TEXTO_ACTO1;
const T2 = (await imp('historia-texto-acto2.js')).TEXTO_ACTO2;
const T3 = (await imp('historia-texto-acto3.js')).TEXTO_ACTO3;
const TO = (await imp('historia-texto-optativas.js')).TEXTO_OPTATIVAS;
const EO = await imp('historia-escenas-optativas.js');

const IDX = Object.fromEntries(H.CAPITULOS.map((c, i) => [c.id, i]));
const progresoBase = () => ({ dia: 6, horas: 10, entradas: {}, cosas: {}, materiales: {}, acopio: {}, peces: {}, talados: [], renovales: [], encargos: {}, obras: [], huerta: {}, visitas: { cuenta: 0 }, comercio: { entregas: 0 }, aldea: { pobladores: [] }, cocina: { hechas: {} }, economia: { pesos: 1000 }, eventosValle: { hechos: {} }, concursos: { cintas: [] }, historia: H.historiaNueva() });
const armar = (capId, { dec = {}, dia = 6, horas = 10, duendes = {}, pobladores = [] } = {}) => {
  const p = progresoBase(); p.dia = dia; p.horas = horas; p.aldea.pobladores = pobladores.map((clave) => ({ clave }));
  const h = p.historia; H.empezarHistoria(h, 1); h.capitulo = IDX[capId]; h.fase = 'jugando'; h.base = { dia }; h.cerrados = { ramal: dia - 3, cuaderno: dia - 1, nevada: dia - 1 };
  Object.assign(h.decisiones, dec); Object.assign(h.duendes, duendes);
  return { p, h };
};
const E = (p, extra = {}) => H.estadoHistoria(p, { estacionNatural: 'verano', estacion: 'verano', lugares: {}, ...extra });
const vista = (h, id, dia = 6) => EN.marcarVista(h, id, dia);
const quien = (h, p, extra = {}, ctx = {}) => D.escenaPendiente(h, E(p, extra), ctx);
const est = (h, p, id, extra) => O.estadoOptativa(O.OPTATIVA[id], E(p, extra), h);

// ---------------------------------------------------------------- 1. el registro: las 28 del guion, ventanas, textos
{
  const delGuion = new Set();
  for (const T of [T1, T2, T3]) for (const c of Object.values(T.capitulos)) for (const o of c.optativas || []) delGuion.add(o.id);
  ok(delGuion.size === 28, `el guion trae 28 optativas (${delGuion.size})`);
  for (const id of delGuion) ok(Object.hasOwn(O.OPTATIVA, id), `«${id}» está en el registro`);
  ok(O.OPTATIVAS.length === 28 && new Set(O.IDS_OPTATIVAS_REGISTRO).size === 28, 'el registro tiene 28, sin repetidas');
  for (const o of O.OPTATIVAS) {
    ok(Object.hasOwn(IDX, o.desde) && Object.hasOwn(IDX, o.hasta) && IDX[o.desde] <= IDX[o.hasta], `${o.id}: ventana válida`);
    ok(typeof o.ofrece === 'function' && typeof o.hecha === 'function', `${o.id}: ofrece y hecha`);
    for (const k of o.disparadores || []) {
      ok(Object.hasOwn(D.DISPARADORES, k), `${o.id}: el disparador ${k} existe`);
      if (Object.hasOwn(D.DISPARADORES, k)) ok(JSON.stringify([].concat(D.DISPARADORES[k].cap)) === JSON.stringify(O.capsDe(o)), `${o.id}: ${k} vale en toda la ventana`);
    }
    ok(O.textoOptativa(o.id) !== o.id, `${o.id}: tiene texto para el tablón`);
    // la ventana: de su primer capítulo al último (si el guion no dice, el fin del acto)
    const actoDesde = H.CAPITULOS[IDX[o.desde]].acto, actoHasta = H.CAPITULOS[IDX[o.hasta]].acto;
    ok(actoDesde === actoHasta, `${o.id}: no cruza de acto`);
  }
  // si B escribió el tablón, cada optativa tiene su entrada; y cada escena de B tiene disparador de A
  if (Object.keys(TO.tablon || {}).length) for (const id of delGuion) ok(Object.hasOwn(TO.tablon, id), `${id}: entrada del tablón de B`);
  const conDisp = new Set(Object.entries(D.DISPARADORES).map(([k, d]) => d.escena || k));
  for (const id of EO.IDS_OPTATIVAS) ok(conDisp.has(id), `la escena de B «${id}» tiene disparador`);
  for (const id of ['cumple-nevada', 'galpon-sin-golpear', 'plumas-gallinero', 'frasco-repisa', 'frasco-rosa', 'oveja-ramon', 'pan-fermin', 'vuelta-mirador', 'vuelta-faro', 'juntar-ovejas']) ok(conDisp.has(id), `${id}: tiene disparador`);
  // los disparadores de optativas van al final de la tabla (primero lo que es objetivo)
  const ks = Object.keys(D.DISPARADORES), primeraOpt = ks.findIndex((k) => Object.hasOwn(D.OPTATIVA_DE_DISPARADOR, k));
  ok(primeraOpt > 0 && ks.slice(primeraOpt).every((k) => Object.hasOwn(D.OPTATIVA_DE_DISPARADOR, k) || Object.hasOwn(DO.DISPARADORES_OPTATIVAS, k)), 'las optativas van después de los objetivos');
}

// ---------------------------------------------------------------- 2. nunca traban: un capítulo se completa sin hacer ninguna
{
  const { h, p } = armar('mesa');
  for (const o of H.capituloActual(h).objetivos) h.hechos[`mesa:${o.id}`] = 6;
  const r = H.revisarHistoria(h, E(p));
  ok(h.fase === 'outro' && Object.keys(h.optativas).length === 0, 'el capítulo 3 se cierra sin optativas');
  ok(H.CAPITULOS.every((c) => c.objetivos.every((x) => !Object.hasOwn(O.OPTATIVA, x.id) || ['encargo', 'mulas', 'concurso'].includes(x.id) === false)), 'ninguna optativa es objetivo de capítulo');
  void r;
}

// ---------------------------------------------------------------- 3. el frasco de masa madre (capítulos 1 a 4)
{
  const { h, p } = armar('llave', { horas: 15 });
  ok(est(h, p, 'frasco-masa-madre') === 'cerrada', 'frasco: cerrada antes de la nota');
  vista(h, 'nota-eusebio');
  ok(est(h, p, 'frasco-masa-madre') === 'ofrecida', 'frasco: ofrecida con la nota de Eusebio');
  ok(D.objetosVisibles(h, E(p)).includes('frasco-repisa'), 'el frasco se ve en la repisa');
  ok(quien(h, p, {}, { modo: 'interaccion', clave: 'frasco-repisa' }) === 'frasco-repisa', 'la E en el frasco dispara frasco-repisa');
  vista(h, 'frasco-repisa'); D.aplicarVistas(h, 6, {});
  ok(O.tieneFrasco(E(p)) && est(h, p, 'frasco-masa-madre') === 'en-curso', 'frasco en la mochila: en curso');
  ok(!D.objetosVisibles(h, E(p)).includes('frasco-repisa'), 'y ya no está en la repisa');
  ok(quien(h, p, {}, { modo: 'hablar', clave: 'panadera' }) === null, 'sin Rosa en la aldea no se le puede dar');
  p.aldea.pobladores = [{ clave: 'panadera' }];
  h.capitulo = IDX.mesa;   // (sigue abierta en el capítulo 3: hasta el fin del acto I)
  ok(quien(h, p, {}, { modo: 'hablar', clave: 'panadera' }) === 'frasco-rosa', 'con Rosa: la E sobre ella dispara frasco-rosa (capítulo 3)');
  vista(h, 'frasco-rosa'); D.aplicarVistas(h, 6, {});
  const r = O.revisarOptativas(h, E(p), 6);
  ok(r.length === 1 && r[0].id === 'frasco-masa-madre' && h.optativas['frasco-masa-madre'] === 6, 'frasco: hecha y anotada');
  ok(O.revisarOptativas(h, E(p), 7).length === 0, 'frasco: una sola vez');
  ok(h.panRosa?.quedan === 3, 'el pan de Rosa: tres mañanas');
  ok(!O.panDeHoy(h, 6, 8), 'el pan no llega el mismo día');
  ok(!O.panDeHoy(h, 7, 14), 'ni a la tarde');
  let panes = 0; for (const d of [7, 7, 8, 9, 10, 11]) if (O.panDeHoy(h, d, 8)) panes++;
  ok(panes === 3, `tres panes en tres mañanas (${panes})`);
  h.capitulo = IDX.rueda;
  ok(est(h, p, 'frasco-masa-madre') === 'hecha', 'hecha queda hecha');
  const { h: h2, p: p2 } = armar('rueda'); vista(h2, 'nota-eusebio');
  ok(est(h2, p2, 'frasco-masa-madre') === 'cerrada', 'en el acto II el frasco ya no se ofrece');
}

// ---------------------------------------------------------------- 4. la oveja de Ramón (capítulo 2): el evento, la oveja que te sigue, el puesto
{
  const { h, p } = armar('bolsa');
  ok(est(h, p, 'oveja') === 'cerrada', 'oveja: cerrada hasta que la historia ofrece el evento');
  H.marcarTema(h, 'optativa', 'oveja', 6);
  ok(est(h, p, 'oveja') === 'ofrecida', 'oveja: ofrecida');
  ok(O.arreoDeOptativa(h, p.eventosValle.hechos) === null, 'sin elegir no hay oveja suelta');
  p.eventosValle.hechos.oveja = { dia: 6, opcion: 'buscar' };
  const a = O.arreoDeOptativa(h, p.eventosValle.hechos);
  ok(a && a.clave === 'oveja' && a.n === 1 && a.destino === 'oveja-ramon', 'con «Arrearla vos», una oveja para arrear');
  ok(est(h, p, 'oveja') === 'en-curso', 'oveja: en curso');
  const puntos = { puesto: { x: 0, z: 0 }, mirador: { x: 100, z: 0 } };
  const pos = O.posicionesArreo(a, (k) => puntos[k] || null);
  ok(pos && pos.ovejas.length === 1 && Math.abs(pos.ovejas[0].x - 55) < 0.01, 'la oveja arranca hacia el cerro, a 55 m del puesto');
  const A = AR.crearArreo({ origen: pos.corral, destino: pos.corral, posiciones: pos.ovejas, min: a.min, azar: () => 0.5 });
  let llego = false;
  const lider = { x: 60, z: 0, yaw: -Math.PI / 2 };
  for (let i = 0; i < 4000 && !llego; i++) { lider.x = Math.max(pos.corral.x, lider.x - 0.05); llego = AR.pasoArreo(A, lider, 0.05); }
  ok(llego, 'la oveja te sigue hasta el corral');
  H.marcarTema(h, 'arreo', 'oveja-ramon', 6);
  ok(O.arreoDeOptativa(h, p.eventosValle.hechos) === null, 'y deja de arrearse');
  ok(quien(h, p, { lugares: { puesto: 20 } }) === 'oveja-ramon', 'al llegar al puesto: oveja-ramon');
  vista(h, 'oveja-ramon');
  const lazo0 = H.lazoDe(h, 'ramon');
  const r = O.revisarOptativas(h, E(p), 6);
  const esc = EO.ESCENAS_OPTATIVAS['oveja-ramon'];
  const escenaDaLazo = !!esc && JSON.stringify(esc).includes('lazo:ramon:');
  ok(r.length === 1 && H.lazoDe(h, 'ramon') === lazo0 + (escenaDaLazo ? 0 : 1), 'oveja: hecha; el lazo con Ramón lo da la escena o el registro, no los dos');
  // la variante del perro: la oveja vuelve sola y la escena sale al pasar por el puesto
  const { h: hp, p: pp } = armar('bolsa'); H.marcarTema(hp, 'optativa', 'oveja', 6); pp.eventosValle.hechos.oveja = { dia: 6, opcion: 'perro' };
  ok(O.arreoDeOptativa(hp, pp.eventosValle.hechos) === null, 'con el perro no hay oveja que arrear');
  ok(quien(hp, pp, { lugares: { puesto: 20 } }) === 'oveja-ramon', 'con el perro la escena sale igual en el puesto');
  // un evento de la oveja de antes del capítulo no cuenta
  const { h: hv, p: pv } = armar('bolsa'); H.marcarTema(hv, 'optativa', 'oveja', 6); pv.eventosValle.hechos.oveja = { dia: 3, opcion: 'buscar' };
  ok(O.arreoDeOptativa(hv, pv.eventosValle.hechos) === null && quien(hv, pv, { lugares: { puesto: 20 } }) !== 'oveja-ramon', 'un evento viejo de la oveja no la ofrece');
}

// ---------------------------------------------------------------- 5. el pan para Fermín (capítulos 3 y 4)
{
  const { h, p } = armar('mesa');
  vista(h, 'fermin-galpon');
  ok(est(h, p, 'fermin-pan') === 'ofrecida', 'pan de Fermín: ofrecida tras conocerlo');
  ok(quien(h, p, {}, { modo: 'hablar', clave: 'fermin' }) === null, 'sin pan ni harina, nada');
  p.cosas['pan-casero'] = 2;
  ok(quien(h, p, {}, { modo: 'hablar', clave: 'fermin' }) === 'pan-fermin', 'con pan: la E sobre Fermín dispara pan-fermin');
  // sin la escena (o si no corrió su quitar), lo gasta la mecánica: el pan primero
  const gastos = [];
  vista(h, 'pan-fermin'); D.aplicarVistas(h, 6, { cuanto: (k) => Number(p.cosas[k]) || 0, gastar: (c, k) => gastos.push([c, k]) });
  ok(JSON.stringify(gastos) === JSON.stringify([['pan-casero', 1]]), 'gasta un pan');
  const g2 = [];
  const { h: hb } = armar('mesa'); vista(hb, 'pan-fermin'); hb.aplicadas['e:pan-fermin:quitar:harina:1'] = 6;
  D.aplicarVistas(hb, 6, { cuanto: () => 0, gastar: (c, k) => g2.push([c, k]) });
  ok(g2.length === 0, 'si la escena ya gastó, la mecánica no gasta otra vez');
  ok(O.revisarOptativas(h, E(p), 6).some((x) => x.id === 'fermin-pan'), 'pan de Fermín: hecha');
  h.capitulo = IDX.ramal; const { h: h4, p: p4 } = armar('ramal'); vista(h4, 'fermin-galpon'); p4.cosas.harina = 1;
  ok(quien(h4, p4, {}, { modo: 'hablar', clave: 'fermin' }) === 'pan-fermin', 'sigue abierta en el capítulo 4 (con harina)');
}

// ---------------------------------------------------------------- 6. una vuelta para la ingeniera (capítulo 4)
{
  const { h, p } = armar('ramal', { horas: 12 });
  vista(h, 'anden-graciela');
  ok(est(h, p, 'vuelta-ingeniera') === 'ofrecida', 'vuelta: ofrecida tras recibir a Graciela');
  ok(quien(h, p, { lugares: { mirador: 10 }, acompanante: 'graciela' }) === 'vuelta-mirador', 'con Graciela en el mirador: vuelta-mirador');
  ok(quien(h, p, { lugares: { mirador: 10 } }) !== 'vuelta-mirador', 'sin Graciela, no');
  ok(quien(h, p, { lugares: { faro: 10 } }) !== 'vuelta-faro', 'ni en el faro');
  vista(h, 'vuelta-mirador'); D.aplicarVistas(h, 6, {});
  ok(est(h, p, 'vuelta-ingeniera') === 'en-curso' && O.revisarOptativas(h, E(p), 6).length === 0, 'un lugar: en curso, todavía no');
  ok(quien(h, p, { lugares: { faro: 20 }, acompanante: 'graciela' }) === 'vuelta-faro', 'en el faro: vuelta-faro');
  vista(h, 'vuelta-faro'); D.aplicarVistas(h, 6, {});
  const g0 = H.lazoDe(h, 'graciela'), r0 = h.ramal;
  ok(O.revisarOptativas(h, E(p), 6).some((x) => x.id === 'vuelta-ingeniera'), 'dos lugares: hecha');
  ok(H.lazoDe(h, 'graciela') === g0 + 2 && h.ramal === r0 + 2, 'mirador + faro: el registro da Graciela +2 y ramal +2');
  // con la casa de té (te-graciela ya dio el lazo y el ramal) no se duplica
  const { h: ht, p: pt } = armar('ramal'); vista(ht, 'anden-graciela'); vista(ht, 'te-graciela'); H.cambiarLazo(ht, 'graciela', 2); H.sumarRamal(ht, 2); vista(ht, 'vuelta-faro');
  const gt = H.lazoDe(ht, 'graciela'), rt = ht.ramal;
  ok(O.revisarOptativas(ht, E(pt), 6).some((x) => x.id === 'vuelta-ingeniera') && H.lazoDe(ht, 'graciela') === gt && ht.ramal === rt, 'casa de té + faro: hecha sin duplicar el premio');
}

// ---------------------------------------------------------------- 7. juntar las ovejas (capítulo 9): la tranquera abierta y el arreo de las seis
{
  const { h, p } = armar('frios', { dec: { majada: 'b' } });
  ok(est(h, p, 'juntar-ovejas') === 'cerrada' && O.arreoDeOptativa(h, {}) === null, 'juntar: cerrada sin la tranquera abierta');
  H.marcarTema(h, 'optativa', 'juntar-ovejas', 6);   // (lo deja hojas-canelo cuando no convidaste)
  ok(est(h, p, 'juntar-ovejas') === 'en-curso', 'juntar: en curso');
  const a = O.arreoDeOptativa(h, {});
  ok(a && a.n === 6 && a.min === 6 && a.disperso, 'seis ovejas desparramadas; tienen que volver todas');
  const pos = O.posicionesArreo(a, () => ({ x: 0, z: 0 }));
  const dist = pos.ovejas.map((o) => Math.hypot(o.x - pos.corral.x, o.z - pos.corral.z));
  ok(dist.every((d) => d >= 18 - 0.01 && d <= 42 + 0.01), 'desparramadas entre 18 y 42 m del corral');
  ok(JSON.stringify(pos) === JSON.stringify(O.posicionesArreo(a, () => ({ x: 0, z: 0 }))), 'siempre en el mismo lugar (al cargar la partida)');
  // quedarse en el corral no alcanza: hay que ir a buscarlas
  const A = AR.crearArreo({ origen: pos.corral, destino: pos.corral, posiciones: pos.ovejas, min: a.min, azar: () => 0.5 });
  let llego = false;
  for (let i = 0; i < 400; i++) llego = AR.pasoArreo(A, { x: pos.corral.x, z: pos.corral.z }, 0.05) || llego;
  ok(!llego, 'parado en el corral, no se juntan solas');
  // ir a buscar cada una y volver al corral con todas
  const ir = (x, z) => { const l = { x: A._x ?? pos.corral.x, z: A._z ?? pos.corral.z }; for (let i = 0; i < 3000; i++) { const dx = x - l.x, dz = z - l.z, d = Math.hypot(dx, dz); if (d < 0.5) break; l.x += (dx / d) * 0.25; l.z += (dz / d) * 0.25; l.yaw = Math.atan2(-dx, -dz); if (AR.pasoArreo(A, l, 0.05)) llego = true; } A._x = l.x; A._z = l.z; };
  for (const o of pos.ovejas) { ir(o.x, o.z); ir(pos.corral.x, pos.corral.z); }
  for (let i = 0; i < 200 && !llego; i++) llego = AR.pasoArreo(A, { x: pos.corral.x, z: pos.corral.z }, 0.05);
  ok(llego && AR.cercaDelDestino(A) === 6, `yendo a buscarlas, las seis vuelven al corral (${AR.cercaDelDestino(A)})`);
  H.marcarTema(h, 'arreo', 'corral-ramon', 6);
  ok(quien(h, p, { lugares: { puesto: 25 } }) === 'juntar-ovejas', 'con las ovejas en el corral: juntar-ovejas');
  vista(h, 'juntar-ovejas');
  const r = O.revisarOptativas(h, E(p), 6);
  ok(r.length === 1 && r[0].premio?.materiales?.lana === 2, 'juntar: hecha, dos vellones');
  // con la majada en camino (D5 = a o c), espera a que llegue
  const { h: hm } = armar('frios', { dec: { majada: 'a' } }); H.marcarTema(hm, 'optativa', 'juntar-ovejas', 6);
  ok(O.arreoDeOptativa(hm, {}) === null, 'con la majada arreándose, las desparramadas esperan');
  H.marcarTema(hm, 'arreo', 'galpon-esquila', 6);
  ok(O.arreoDeOptativa(hm, {})?.clave === 'juntar', 'y después salen');
  hm.capitulo = IDX.arco;
  ok(O.arreoDeOptativa(hm, {}) === null, 'en el capítulo 11 ya no');
}

// ---------------------------------------------------------------- 8. el acto III: cumpleaños, plumas del gallinero, abrir sin golpear, flechas de más
{
  const cumple = { donde: 'casa', edificio: 'casa-ercilia', claves: ['ercilia'], punto: { x: 0, z: 0 } };
  const { h, p } = armar('arco', { horas: 16 });
  ok(quien(h, p, { cumple, lugares: { cumple: 10 } }) === 'cumple-nevada', 'un cumpleaños hoy, de tarde, en la fiesta: cumple-nevada');
  ok(quien(h, p, { lugares: { cumple: 10 } }) !== 'cumple-nevada', 'sin cumpleaños, no');
  p.horas = 22; ok(quien(h, p, { cumple, lugares: { cumple: 10 } }) !== 'cumple-nevada', 'de noche, no');
  p.horas = 16; h.capitulo = IDX.nevada; ok(quien(h, p, { cumple, lugares: { cumple: 10 } }) === 'cumple-nevada', 'sigue abierta el día de la nevada');
  vista(h, 'noche-espera'); ok(quien(h, p, { cumple, lugares: { cumple: 10 } }) !== 'cumple-nevada', 'pero no después de la espera');
  // las plumas del gallinero
  const { h: hg, p: pg } = armar('arco'); pg.entradas.pluma = { cantidad: 6 };
  const terminadas = [{ id: 'gallinero', x: 0, z: 0 }];
  ok(quien(hg, pg, { terminadas, lugares: { gallinero: 5, refugio: 20 } }) === 'plumas-gallinero', 'seis plumas junto a tu gallinero: plumas-gallinero');
  ok(quien(hg, pg, { lugares: { refugio: 20 } }) === 'plumas-bosque', 'sin gallinero: las del bosque');
  // abrir el galpón sin golpear: de noche, antes de golpear, repetible
  const { h: hs, p: ps } = armar('golpea', { horas: 22 });
  ok(D.objetosVisibles(hs, E(ps)).includes('puerta-galpon-abrir'), 'de noche, la puerta del galpón se puede abrir sin golpear');
  ok(quien(hs, ps, {}, { modo: 'interaccion', clave: 'puerta-galpon-abrir' }) === 'galpon-sin-golpear', 'abrir sin golpear: galpon-sin-golpear');
  vista(hs, 'galpon-sin-golpear');
  ok(quien(hs, ps, {}, { modo: 'interaccion', clave: 'puerta-galpon-abrir' }) === 'galpon-sin-golpear', 'se repite');
  vista(hs, 'galpon-golpe');
  ok(quien(hs, ps, {}, { modo: 'interaccion', clave: 'puerta-galpon-abrir' }) === null && !D.objetosVisibles(hs, E(ps)).includes('puerta-galpon-abrir'), 'después de golpear, ya no');
  // flechas de más: el segundo atado suma flechas a la noche
  const { h: hf, p: pf } = armar('arco'); vista(hf, 'tito-arco'); vista(hf, 'blancos-paso');
  ok(quien(hf, pf, {}, { modo: 'hablar', clave: 'carpintero' }) === 'flechas-de-mas', 'flechas de más con Tito');
  vista(hf, 'flechas-de-mas');
  O.revisarOptativas(hf, E(pf), 6);
  ok(hf.flechasExtra === O.FLECHAS_DE_MAS, 'quedan anotadas las flechas de más');
  const noche = N.crearNoche({ modo: 'trato', centro: { x: 0, z: 0 }, dx: 1, dz: 0, alt: () => 0, azar: () => 0.5, flechas: N.NOCHE.flechas + hf.flechasExtra });
  ok(noche.flechas === N.NOCHE.flechas + O.FLECHAS_DE_MAS, `la noche arranca con ${N.NOCHE.flechas + O.FLECHAS_DE_MAS} flechas`);
  const noche0 = N.crearNoche({ modo: 'trato', centro: { x: 0, z: 0 }, dx: 1, dz: 0, alt: () => 0, azar: () => 0.5 });
  ok(noche0.flechas === N.NOCHE.flechas, 'sin el atado, las de siempre');
}

// ---------------------------------------------------------------- 9. los premios del acto II, las tablas de Tito y los encargos
{
  // la veta que vuelve: diez cantos
  const { h, p } = armar('cuaderno', { dec: { coihue: 'c' } });
  ok(est(h, p, 'veta-vuelve') === 'ofrecida', 'la veta, con la pirca');
  vista(h, 'veta-vuelve');
  const r = O.revisarOptativas(h, E(p), 6);
  ok(r.find((x) => x.id === 'veta-vuelve')?.premio?.entradas?.canto === 10, 'la veta: diez cantos blancos');
  // trigo del abuelo: el lazo lo da la escena (no se duplica)
  const { h: ht, p: pt } = armar('rueda', { dec: { bolsa: 'c' } }); vista(ht, 'piedras-molino'); vista(ht, 'trigo-abuelo');
  ok(Object.keys(O.revisarOptativas(ht, E(pt), 6).find((x) => x.id === 'trigo-abuelo')?.premio?.lazos || {}).length === 0, 'trigo del abuelo: la escena ya da el lazo de Josefina');
  // ventana del acto: el trigo del abuelo sigue en el capítulo 8 y se cierra en el 9
  const { h: h8, p: p8 } = armar('cuaderno', { dec: { bolsa: 'c' } }); vista(h8, 'piedras-molino');
  ok(quien(h8, p8, {}, { modo: 'hablar', clave: 'ema' }) !== null, 'en el 8, Josefina tiene algo (objetivo u optativa)');
  vista(h8, 'cuaderno-abuelo');
  ok(quien(h8, p8, {}, { modo: 'hablar', clave: 'ema' }) === 'trigo-abuelo', 'con el objetivo hecho, el trigo del abuelo sigue abierto en el capítulo 8');
  h8.capitulo = IDX.frios; ok(quien(h8, p8, {}, { modo: 'hablar', clave: 'ema' }) !== 'trigo-abuelo', 'en el 9 ya no');
  // el objetivo antes que la optativa: Nicanor en el capítulo 6
  const { h: h6, p: p6 } = armar('perdido'); vista(h6, 'piedras-molino');
  ok(quien(h6, p6, {}, { modo: 'hablar', clave: 'nicanor' }) === 'luces-lago-nicanor', 'en el 6, la E sobre Nicanor da primero el objetivo');
  // las tablas de Tito: con seis tablas, la escena las vende y cobra
  const { h: hx, p: px } = armar('rueda', { dec: { coihue: 'b' } }); vista(hx, 'piedras-molino');
  ok(quien(hx, px, {}, { modo: 'hablar', clave: 'carpintero' }) === null, 'sin tablas, Tito no compra');
  ok(quien(hx, px, { lugares: { carpinteria: 8 } }) !== 'tablas-tito', 'ni al pasar por la carpintería');
  px.cosas['tabla-coihue'] = 12;
  ok(quien(hx, px, {}, { modo: 'hablar', clave: 'carpintero' }) === 'tablas-tito', 'con las tablas del coihue, sí');
  const gx = [], cx = [];
  vista(hx, 'tablas-tito'); D.aplicarVistas(hx, 6, { cuanto: (k) => Number(px.cosas[k]) || 0, gastar: (c, k) => gx.push([c, k]), cobrar: (pr) => cx.push(pr.pesos) });
  ok(JSON.stringify(gx) === JSON.stringify([['tabla-coihue', 6]]) && cx[0] === O.PRECIO_TABLAS_TITO, `las seis tablas, $${O.PRECIO_TABLAS_TITO}`);
  // los encargos de los vecinos con arco: +1 al lazo de quien lo pidió; la primera vez, lo ya hecho es base
  const lista = [{ id: 'e-banco', quien: 'ramon' }, { id: 'e-pesca', quien: 'nicanor' }, { id: 'e-vuelta', quien: 'guarda' }, { id: 't-trochita-nieve', quien: 'guarda' }];
  const { h: he, p: pe } = armar('bolsa'); pe.encargos = { 'e-vuelta': 'hecho' };
  ok(O.revisarEncargos(he, pe, lista, 6).length === 0 && he.encargosLazo['e-vuelta'] === 0, 'lo ya hecho queda de base, sin lazo');
  pe.encargos['e-banco'] = 'hecho'; pe.encargos['e-pesca'] = 'hecho';
  const d = O.revisarEncargos(he, pe, lista, 7);
  ok(d.length === 1 && d[0].quien === 'ramon' && H.lazoDe(he, 'ramon') === 1, 'el banco de Ramón: +1 con Ramón (Nicanor no tiene lazo)');
  ok(O.revisarEncargos(he, pe, lista, 8).length === 0 && H.lazoDe(he, 'ramon') === 1, 'una sola vez');
  ok(O.revisarOptativas(he, E(pe), 7).some((x) => x.id === 'banco-primero'), 'y el banco primero queda hecho');
  // la trochita en la nieve: ramal +1, sólo en su ventana
  const { h: hn, p: pn } = armar('frios'); pn.encargos['t-trochita-nieve'] = 'hecho'; const r1 = hn.ramal;
  O.revisarOptativas(hn, E(pn), 6);
  ok(hn.optativas['trochita-nieve'] && hn.ramal === r1 + 1, 'la trochita en la nieve: ramal +1');
  const { h: hn2, p: pn2 } = armar('deshielo'); pn2.encargos['t-trochita-nieve'] = 'hecho';
  O.revisarOptativas(hn2, E(pn2), 6);
  ok(!hn2.optativas['trochita-nieve'], 'fuera de su ventana no cuenta');
  // el concurso del dulce: con cinta, Ercilia +1
  const { h: hc, p: pc } = armar('cosecha'); pc.concursos.cintas = [{ id: 'dulce', dia: 5, puesto: 2, cinta: 'roja' }];
  O.revisarOptativas(hc, E(pc), 6);
  ok(hc.optativas.concurso && H.lazoDe(hc, 'ercilia') === 1, 'cinta en el concurso del dulce: Ercilia +1');
  const { h: hc2, p: pc2 } = armar('cosecha'); pc2.concursos.cintas = [{ id: 'dulce', dia: 5, puesto: 0, cinta: 'verde' }];
  O.revisarOptativas(hc2, E(pc2), 6);
  ok(!hc2.optativas.concurso, 'con la mención, no');
}

// ---------------------------------------------------------------- 10. el tablón, la guía y la charla de historia
{
  const { h, p } = armar('mesa', { pobladores: ['panadera'] });
  vista(h, 'nota-eusebio'); vista(h, 'fermin-galpon');
  const pan = O.optativasDelPanel(h, E(p));
  ok(pan.some((x) => x.id === 'frasco-masa-madre' && !x.hecho) && pan.some((x) => x.id === 'fermin-pan' && !x.hecho), 'el tablón muestra las ofrecidas del capítulo');
  ok(!pan.some((x) => x.id === 'vuelta-ingeniera'), 'y no las de otro capítulo');
  vista(h, 'pan-fermin'); O.revisarOptativas(h, E(p), 6);
  ok(O.optativasDelPanel(h, E(p)).find((x) => x.id === 'fermin-pan')?.hecho === true, 'la hecha, con la tilde');
  const g = O.optativasHechas(h);
  ok(g.length === 1 && g[0].id === 'fermin-pan' && g[0].dia === 6 && g[0].titulo && g[0].texto, 'la guía tiene la lista de las hechas');
  ok(O.optativasDelPanel(h, E(p)).every((x) => typeof x.texto === 'string' && x.texto.length > 3), 'cada entrada con su texto');
  // la charla: una línea de historia por vecino, una vez cada una
  const l = O.lineaDeHistoria(h, E(p), 'fermin');
  ok(!l || typeof l.texto === 'string', 'la línea de Fermín es un texto (o no hay)');
  if (l) { O.oirLinea(h, l.id, 6); const l2 = O.lineaDeHistoria(h, E(p), 'fermin'); ok(!l2 || l2.id !== l.id, 'la misma línea no se repite'); }
  ok(O.CLAVE_DE.josefina === 'ema' && O.CLAVE_DE.rosa === 'panadera' && O.CLAVE_DE.elsa === 'guarda', 'los nombres de los textos van a las claves del juego');
  // una línea de optativa de B, con su condición, aparece después de hecha (aunque el capítulo haya pasado)
  const lineasOpt = Object.entries(TO.charla || {}).flatMap(([q, ls]) => (ls || []).map((x) => ({ q, ...x })));
  if (lineasOpt.length) {
    const x = lineasOpt.find((y) => y.cuando?.escena);
    const { h: hl, p: pl } = armar(H.CAPITULOS[Math.min(12, Math.max(0, Number(x.cap) - 1))].id);
    const clave = O.CLAVE_DE[x.q] || x.q;
    ok(O.charlasDe(clave).some((y) => y.id === x.id), `la línea de B «${x.id}» llega al vecino`);
    ok(!O.lineaDeHistoria(hl, E(pl), clave) || O.lineaDeHistoria(hl, E(pl), clave).id !== x.id, 'antes de la escena, no');
    vista(hl, x.cuando.escena);
    hl.capitulo = Math.min(12, hl.capitulo + 1);
    // (primero puede ir la del capítulo en curso; cada E dice una y no se repite: en pocas aparece la de la optativa)
    const oidas = [];
    for (let i = 0; i < 6; i++) { const y = O.lineaDeHistoria(hl, E(pl), clave); if (!y) break; oidas.push(y.id); O.oirLinea(hl, y.id, 6); }
    ok(oidas.includes(x.id) && new Set(oidas).size === oidas.length, `después de la escena, sí, una vez (aunque haya pasado el capítulo): ${oidas.join(', ')}`);
  }
  // la línea de antes del frasco («¡traelo!») vale mientras está ofrecida; después, no
  {
    const { h: hr, p: pr } = armar('bolsa', { pobladores: ['panadera'] }); vista(hr, 'nota-eusebio');
    const antes = []; for (let i = 0; i < 6; i++) { const y = O.lineaDeHistoria(hr, E(pr), 'panadera'); if (!y) break; antes.push(y.id); O.oirLinea(hr, y.id, 6); }
    ok(antes.includes('rosa-c2-frasco'), 'con el frasco ofrecido, Rosa lo pide');
    const { h: hd, p: pd } = armar('bolsa', { pobladores: ['panadera'] }); vista(hd, 'nota-eusebio'); vista(hd, 'frasco-rosa'); O.revisarOptativas(hd, E(pd), 6);
    const desp = []; for (let i = 0; i < 6; i++) { const y = O.lineaDeHistoria(hd, E(pd), 'panadera'); if (!y) break; desp.push(y.id); O.oirLinea(hd, y.id, 6); }
    ok(!desp.includes('rosa-c2-frasco'), 'ya entregado, no lo pide más');
  }
}

// ---------------------------------------------------------------- 11. el guardado
{
  const { h } = armar('frios');
  h.optativas = { 'fermin-pan': 4, 'nada-que-ver': 3, 'constructor': 2 }; h.oidas = { 'rosa-c2-frasco': 3 }; h.panRosa = { quedan: 2, ultimo: 7 }; h.flechasExtra = 15; h.encargosLazo = { 'e-banco': 5, 'e-vuelta': 0 };
  const s = H.sanearHistoria(JSON.parse(JSON.stringify(h)));
  ok(s.optativas['fermin-pan'] === 4 && s.oidas['rosa-c2-frasco'] === 3, 'se guardan las hechas y las oídas');
  ok(!Object.hasOwn(s.optativas, 'constructor') || s.optativas.constructor === 2, 'sin claves peligrosas');
  ok(s.panRosa?.quedan === 2 && s.panRosa.ultimo === 7 && s.flechasExtra === 15, 'el pan de Rosa y las flechas');
  ok(s.encargosLazo['e-banco'] === 5 && s.encargosLazo['e-vuelta'] === 0, 'los encargos con lazo (y la base en 0)');
  const v = H.sanearHistoria({ activa: true, version: 2, optativas: 'x', oidas: [1], panRosa: 7, flechasExtra: -5, encargosLazo: [] });
  ok(JSON.stringify(v.optativas) === '{}' && JSON.stringify(v.oidas) === '{}' && v.panRosa === null && v.flechasExtra === 0 && v.encargosLazo === null, 'basura: valores por defecto');
  const vieja = H.sanearHistoria({ activa: true, version: 2, capitulo: 9 });
  ok(vieja.encargosLazo === null && JSON.stringify(vieja.optativas) === '{}', 'una partida de la 4.17 arranca sin optativas ni base de encargos');
  ok(H.historiaNueva().encargosLazo === null && H.historiaNueva().flechasExtra === 0, 'la historia nueva');
}

// ---------------------------------------------------------------- 12. el enganche con el juego (por texto)
{
  const ui = leer('src/historia-ui.js'), main = leer('src/main.js'), am = leer('src/historia-arreo-mundo.js');
  ok(/if \(jugando && h\.activa\) revisarLoOptativo\(h\);/.test(ui), 'la UI revisa las optativas cada medio segundo');
  ok(/datos\.optativas = optativasDelPanel\(h, s\)/.test(ui) && /De paso \(si querés\)/.test(ui), 'el panel muestra las optativas');
  ok(/Lo que hiciste de paso/.test(ui), 'la guía muestra las hechas');
  ok(/ofrecerOveja\(h, s\)/.test(ui) && /eventos\.forzar\('oveja'\)/.test(ui), 'la historia ofrece la oveja de Ramón en el capítulo 2');
  ok(/flechas: NOCHE\.flechas \+/.test(ui), 'la noche recibe las flechas de más');
  ok(/escenaCostumbre\(h2?, 'costumbre-dejar'\)/.test(ui) && /escenaCostumbre\(h, 'costumbre-regalito'\)/.test(ui), 'las escenas de la costumbre del trato');
  ok(/valle\?\.lineaDeHistoria\?\.\(npc\.clave\)/.test(main), 'main.js muestra la línea de historia al hablar');
  ok(/ESCENAS_OPTATIVAS/.test(main) && /EFECTOS_OPTATIVAS/.test(main), 'main.js registra las escenas y efectos de las optativas');
  ok(/encargosLista: \(\) => TODOS_LOS_ENCARGOS/.test(main), 'main.js pasa quién pidió cada encargo');
  ok(/cumple: cumpleDeHoyHistoria\(\)/.test(main) && /ponr\('cumple', c\.punto\)/.test(main) && /obraPunto\('gallinero', 'gallinero'\)/.test(main), 'main.js arma el cumpleaños y el gallinero');
  ok(/arreoDeOptativa\(h, ctx\.eventos\?\.\(\) \|\| \{\}\)/.test(am), 'el arreo del mundo arma el de las optativas');
  ok(/flechas: opciones\.flechas/.test(leer('src/historia-noche-mundo.js')), 'el mundo de la noche pasa las flechas');
}

// ---------------------------------------------------------------- 13. mutaciones (cada una en un proceso aparte, sobre una copia de src/)
const MUT = [
  ['historia-optativas.js', "if (Object.hasOwn(h.optativas, o.id)) continue;", "", 'una optativa se cuenta dos veces'],
  ['historia-optativas.js', "if (PERSONAS_LAZO.includes(q) && !ya.lazos.has(q)) r.lazos[q] = n;", "if (PERSONAS_LAZO.includes(q)) r.lazos[q] = n;", 'el lazo de la escena se duplica'],
  ['historia-optativas.js', "if (p.ramal && !ya.ramal) r.ramal = p.ramal;", "if (p.ramal) r.ramal = p.ramal;", 'el ramal de la casa de té se duplica'],
  ['historia-optativas.js', "if (ent(dia) <= ent(p.ultimo) ||", "if (", 'el pan de Rosa llega dos veces el mismo día'],
  ['historia-optativas.js', "    for (const k of hechos) h.encargosLazo[k] = 0;\n    return dados;", "    return dados;", 'los encargos viejos dan lazo de golpe'],
  ['historia-optativas.js', "return i >= IDX[o.desde] && i <= IDX[o.hasta];", "return true;", 'las optativas no se cierran'],
  ['historia-optativas.js', "if (o.ventana && !enVentana(o, h)) continue;", "", 'un encargo fuera de la ventana cuenta'],
  ['historia-optativas.js', "min: OVEJAS_DESPARRAMADAS, disperso", "min: 1, disperso", 'juntar una sola oveja alcanza'],
  ['historia-optativas.js', "&& ent(ev.oveja.dia) >= ent(temas['optativa:oveja'])", "", 'un evento viejo suelta la oveja'],
  ['historia-disparadores.js', "for (const k of Object.keys(OPTATIVA_DE_DISPARADOR)) { const d = DISPARADORES[k]; delete DISPARADORES[k]; DISPARADORES[k] = d; }", "", 'la optativa le gana al objetivo'],
  ['historia-disparadores.js', "if (s.escenas.has(id) && !d.repetible) continue;", "if (s.escenas.has(id)) continue;", 'abrir sin golpear no se repite'],
  ['historia-disparadores-optativas.js', "cond: (s) => tieneFrasco(s) && s.pobladores.has('panadera') },", "cond: (s) => tieneFrasco(s) },", 'el frasco se le da a una Rosa que no está'],
  ['historia-disparadores-optativas.js', "cond: (s) => s.pan >= 1 || s.harina >= 1 },", "cond: () => true },", 'Fermín recibe pan sin pan'],
  ['historia-disparadores-optativas.js', "'vuelta-faro': { cap: 'ramal', modo: 'auto', requiere: ['anden-graciela'], lugar: en('faro', 30), cond: (s) => s.acompanante === 'graciela' },", "'vuelta-faro': { cap: 'ramal', modo: 'auto', requiere: ['anden-graciela'], lugar: en('faro', 30) },", 'la vuelta sin Graciela'],
  ['historia-disparadores-optativas.js', "    if (Object.hasOwn(ap, 'e:pan-fermin:quitar:pan-casero:1') || Object.hasOwn(ap, 'e:pan-fermin:quitar:harina:1')) return;\n", "", 'el pan de Fermín se cobra dos veces'],
  ['historia-disparadores-optativas.js', "cond: (s) => s.plumas >= 6 && s.terminadas.has('gallinero')", "cond: (s) => false && s.plumas >= 6 && s.terminadas.has('gallinero')", 'las plumas del gallinero nunca salen'],
  ['historia-disparadores-acto2.js', "cond: (s) => s.decisiones.coihue === 'b' && tablasParaTito(s) },\n  'tablas-tito:hablar'", "cond: (s) => s.decisiones.coihue === 'b' },\n  'tablas-tito:hablar'", 'Tito compra tablas que no tenés'],
  ['historia-arreo.js', "cerca >= Math.min(A.min ?? ARREO.minimas, A.ovejas.length)", "cerca >= Math.min(ARREO.minimas, A.ovejas.length)", 'el mínimo de cada arreo no cuenta'],
  ['historia-noche.js', "flechas: Number.isFinite(op.flechas) && op.flechas > 0 ? Math.min(99, Math.floor(op.flechas)) : NOCHE.flechas,", "flechas: NOCHE.flechas,", 'las flechas de más no llegan a la noche'],
  ['historia.js', "for (const [g, tope] of [['optativas', 64], ['oidas', 400]]) {", "for (const [g, tope] of [['oidas', 400]]) {", 'las optativas hechas no se guardan'],
];
let atrapadas = 0;
if (!process.env.OPTATIVAS_SRC) {
  const tmp = mkdtempSync(join(tmpdir(), 'opt418-'));
  try {
    for (const [arch, de, a, que] of MUT) {
      const orig = leer(`src/${arch}`);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, OPTATIVAS_SRC: dir, OPTATIVAS_CALLADO: '1' }, encoding: 'utf8' });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (!process.env.OPTATIVAS_SRC) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.18.0 (A) optativas de la Historia · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
