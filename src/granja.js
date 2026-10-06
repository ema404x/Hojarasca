// 3.7.2 (granja): lo que el jugador produce para cocinar (sólo en el Relax):
//   · la vaca lechera: Don Ramón te la cambia (con su ternero al pie) si tenés un tambo con comedero. Leche cada
//     mañana si la ordeñás (E); en invierno no hay pasto y come del comedero (fardos que también cambia Don Ramón).
//     Pare un ternero por año, en primavera; de novillo, si vos decidís, da la carne de vaca;
//   · los corderos: con una paridera junto a tu corral, las dos ovejas de Don Ramón crían en primavera;
//   · los chanchos: Ayelén, la veterinaria, te cambia una chancha preñada si tenés un chiquero. Con la batea llena
//     (sobras: papas, habas, fruta) tiene lechones, que de capones dan carne de cerdo y chorizos;
//   · los frutales: manzano, peral, ciruelo y cerezo (los plantines, de Gladys) y frambuesa y grosella (de Inés) se
//     plantan en un hoyo (O → Trabajo), crecen, florecen en primavera, dan fruta en verano u otoño y en invierno se
//     quedan sin hojas.
// Sin plata: todo por trueque. Nada se echa a perder: la leche, la carne y la fruta se guardan como todo lo juntado
// (la fruta se junta del árbol desde que madura hasta que empieza el invierno; en invierno, pelados y sin fruta).
// Carnear es una decisión tuya y no se muestra nada: Don Ramón pasa a buscar el animal (un fundido) y al otro día,
// a la mañana, te deja la carne.
// El año del juego es de doce días (main.js): la primavera de la granja son los primeros días del año (cuando
// florecen los frutales), después verano, otoño e invierno, como las estaciones que se ven.
// Puro (sin three ni el DOM; los iconos de la mochila reciben el contexto 2D ya hecho): se prueba en Node
// (pruebas/verificar-3-7-2-granja.mjs). Lo que se ve, en granja-mundo.js; el enganche, en granja-juego.js; los
// planos de las obras, en planos-granja.js.

// ---------------------------------------------------------------- números
export const DIAS_ANIO_GRANJA = 12;
export const GRANJA = {
  leche: 4,                 // litros por ordeñe
  ordene: [5, 12],          // se ordeña a la mañana, de 5 a 12
  comedero: 9,              // raciones que entran en el comedero del tambo
  racionesFardo: 3,         // un fardo de pasto, tres días de invierno
  batea: 8,                 // raciones que entran en la batea del chiquero
  diasNovillo: 8,           // de ternero a novillo
  diasCordero: 6,           // de cordero recién nacido a cordero para carnear
  diasCapon: 6,             // días bien comido de lechón a capón
  diasCamada: 6,            // días bien comida la chancha entre camada y camada
  terneros: 2, corderos: 4, lechones: 6, frutales: 16,
  radioParidera: 10,        // la paridera, a esto del bebedero del corral
  horaEntrega: 8,           // a qué hora del otro día te traen la carne
};
// lo que te trae Don Ramón de cada animal
export const RINDE_CARNE = {
  novillo: [{ k: 'carne-vaca', n: 10 }],
  cordero: [{ k: 'carne-cordero', n: 6 }],
  capon: [{ k: 'carne-cerdo', n: 4 }, { k: 'chorizo', n: 8 }],
};
// lo que se les echa a los chanchos (una cosa, una ración), en este orden
export const SOBRAS = ['papa', 'haba', 'manzana', 'pera', 'ciruela', 'calafate', 'frutilla'];

// ---------------------------------------------------------------- los frutales
// `adulto`: días hasta que da fruta; `madura`: desde qué momento del año (0..1) está madura; `da`: cuántas por año.
export const FRUTALES = {
  manzano: { nombre: 'manzano', plantin: 'plantin-manzano', fruta: 'manzana', frutas: 'manzanas', mata: false, adulto: 6, madura: 0.38, da: 10 },
  peral: { nombre: 'peral', plantin: 'plantin-peral', fruta: 'pera', frutas: 'peras', mata: false, adulto: 6, madura: 0.34, da: 8 },
  ciruelo: { nombre: 'ciruelo', plantin: 'plantin-ciruelo', fruta: 'ciruela', frutas: 'ciruelas', mata: false, adulto: 6, madura: 0.27, da: 10 },
  cerezo: { nombre: 'cerezo', plantin: 'plantin-cerezo', fruta: 'cereza', frutas: 'cerezas', mata: false, adulto: 6, madura: 0.16, da: 14 },
  frambuesa: { nombre: 'frambueso', plantin: 'plantin-frambuesa', fruta: 'frambuesa', frutas: 'frambuesas', mata: true, adulto: 3, madura: 0.19, da: 10 },
  grosella: { nombre: 'grosellero', plantin: 'plantin-grosella', fruta: 'grosella', frutas: 'grosellas', mata: true, adulto: 3, madura: 0.22, da: 10 },
};
export const ORDEN_FRUTALES = Object.keys(FRUTALES);
// los ingredientes que salen de la granja (los mismos ids que usa la cocina)
export const PRODUCTOS_GRANJA = ['leche', 'carne-vaca', 'carne-cordero', 'carne-cerdo', 'chorizo', ...ORDEN_FRUTALES.map((k) => FRUTALES[k].fruta)];
// hasta dónde llega cada parte del año (0 es el primer día)
export const FASE = { flor: 0.12, verano: 0.35, invierno: 0.68 };

// ---------------------------------------------------------------- ayudas
const ent = (v, def = 0) => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : def);
const num = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const tope = (v, a, b) => Math.max(a, Math.min(b, v));
// azar fijo de unos enteros (la misma partida da siempre lo mismo)
export function azarGranja(...n) {
  let h = 2166136261 >>> 0;
  for (const x of n) { h ^= ent(x, 0) >>> 0; h = Math.imul(h, 16777619) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15; }
  return (h >>> 0) / 4294967296;
}

// ---------------------------------------------------------------- el calendario de la granja
export const anioDe = (dia) => Math.floor((Math.max(1, ent(dia, 1)) - 1) / DIAS_ANIO_GRANJA);
export const primaveraDe = (anio) => 1 + Math.max(0, ent(anio, 0)) * DIAS_ANIO_GRANJA;   // el primer día de ese año
// 0..1 a lo largo del año (la misma cuenta que las estaciones que se ven en main.js)
export function faseGranja(dia, horas = 0) {
  const d = Math.max(1, ent(dia, 1)) - 1 + tope(num(horas, 0), 0, 23.999) / 24;
  return (d % DIAS_ANIO_GRANJA) / DIAS_ANIO_GRANJA;
}
export function estacionGranja(fase) {
  return fase < FASE.flor ? 'primavera' : fase < FASE.verano ? 'verano' : fase < FASE.invierno ? 'otono' : 'invierno';
}
// ¿Es invierno para el pasto? Con las estaciones automáticas, el calendario; con una estación fija (Ajustes),
// la que se ve.
export function inviernoGranja(dia, horas, estacion = 'auto') {
  if (estacion === 'invierno') return true;
  if (estacion === 'verano' || estacion === 'otono') return false;
  return faseGranja(dia, horas) >= FASE.invierno;
}

// ---------------------------------------------------------------- la granja nueva y el guardado
export function granjaNueva(semilla = 1) {
  return {
    v: 1, semilla: (ent(semilla, 1) >>> 0) || 1, sig: 1,
    vaca: null, terneros: [], anioVaca: -1, comedero: 0,
    chancha: null, lechones: [], batea: 0,
    corderos: [], anioOvejas: -1, paridera: 0,
    frutales: {}, encargos: [],
  };
}

const PELAJES = ['negra', 'colorada'];
const QUE_CARNEA = ['novillo', 'cordero', 'capon'];
const sanoLugar = (l) => (objeto(l) && Number.isFinite(Number(l.x)) && Number.isFinite(Number(l.z)) && Math.abs(Number(l.x)) < 1e5 && Math.abs(Number(l.z)) < 1e5
  ? { x: Number(l.x), z: Number(l.z), rot: num(l.rot, 0) } : null);
// Una partida vieja (sin granja) arranca vacía. Un guardado roto se sanea: fechas posibles (nunca del futuro),
// listas con su tope, ids únicos, especies que existen, encargos que vuelven a lo sumo mañana.
export function sanearGranja(v, dia = 1, semilla = 1) {
  const hoy = Math.max(1, ent(dia, 1));
  if (!objeto(v)) return granjaNueva(semilla);
  const g = granjaNueva(ent(v.semilla, semilla));
  const fecha = (x, def = hoy) => tope(ent(x, def), 1, hoy);
  const ids = new Set();
  const id = (x) => { let k = ent(x, 0); if (k < 1 || ids.has(k)) k = 0; if (k) ids.add(k); return k; };
  if (objeto(v.vaca)) {
    g.vaca = { id: id(v.vaca.id), pelaje: PELAJES.includes(v.vaca.pelaje) ? v.vaca.pelaje : 'negra', desde: fecha(v.vaca.desde), ordenada: tope(ent(v.vaca.ordenada, 0), 0, hoy), lugar: sanoLugar(v.vaca.lugar) };
  }
  g.terneros = (Array.isArray(v.terneros) ? v.terneros : []).filter(objeto).slice(0, GRANJA.terneros).map((t) => ({ id: id(t.id), nacio: fecha(t.nacio) }));
  g.anioVaca = tope(ent(v.anioVaca, -1), -1, anioDe(hoy));
  g.comedero = tope(ent(v.comedero, 0), 0, GRANJA.comedero);
  if (objeto(v.chancha)) {
    const desde = fecha(v.chancha.desde);
    g.chancha = { id: id(v.chancha.id), desde, cuenta: tope(ent(v.chancha.cuenta, desde - 1), desde - 1, hoy), comio: tope(ent(v.chancha.comio, 0), 0, hoy), comidos: tope(ent(v.chancha.comidos, 0), 0, GRANJA.diasCamada), lugar: sanoLugar(v.chancha.lugar) };
  }
  g.lechones = (Array.isArray(v.lechones) ? v.lechones : []).filter(objeto).slice(0, GRANJA.lechones).map((l) => ({ id: id(l.id), nacio: fecha(l.nacio), engorde: tope(ent(l.engorde, 0), 0, 999) }));
  g.batea = tope(ent(v.batea, 0), 0, GRANJA.batea);
  g.corderos = (Array.isArray(v.corderos) ? v.corderos : []).filter(objeto).slice(0, GRANJA.corderos).map((c) => ({ id: id(c.id), nacio: fecha(c.nacio), madre: ent(c.madre, 0) === 1 ? 1 : 0 }));
  g.anioOvejas = tope(ent(v.anioOvejas, -1), -1, anioDe(hoy));
  g.paridera = tope(ent(v.paridera, 0), 0, hoy);
  if (objeto(v.frutales)) {
    let n = 0;
    for (const [k, f] of Object.entries(v.frutales)) {
      if (!/^-?\d{1,5}:-?\d{1,5}$/.test(k) || !objeto(f)) continue;
      const especie = Object.hasOwn(FRUTALES, f.especie) ? f.especie : null;
      g.frutales[k] = especie ? { especie, plantado: fecha(f.plantado), cosecha: tope(ent(f.cosecha, -1), -1, anioDe(hoy)) } : frutalNuevo();
      if (++n >= GRANJA.frutales) break;
    }
  }
  g.encargos = (Array.isArray(v.encargos) ? v.encargos : []).filter((e) => objeto(e) && QUE_CARNEA.includes(e.que)).slice(0, 12)
    .map((e) => { const d = fecha(e.dia); return { que: e.que, dia: d, vuelve: tope(ent(e.vuelve, d + 1), d, hoy + 1) }; });
  // los que quedaron sin id (o repetido) reciben uno nuevo
  let sig = Math.max(1, ent(v.sig, 1), ...[...ids].map((k) => k + 1));
  const conId = (a) => { if (a && !a.id) a.id = sig++; };
  conId(g.vaca); conId(g.chancha); g.terneros.forEach(conId); g.lechones.forEach(conId); g.corderos.forEach(conId);
  g.sig = sig;
  return g;
}

// ---------------------------------------------------------------- la vaca
export function recibirVaca(g, dia, lugar = null) {
  if (g.vaca) return { ok: false, motivo: 'yaTenes' };
  const d = Math.max(1, ent(dia, 1));
  g.vaca = { id: g.sig++, pelaje: azarGranja(g.semilla, 11) < 0.6 ? 'negra' : 'colorada', desde: d, ordenada: 0, lugar: sanoLugar(lugar) };
  // viene recién parida, con el ternero al pie: este año ya no pare
  if (g.terneros.length < GRANJA.terneros) g.terneros.push({ id: g.sig++, nacio: Math.max(1, d - 2) });
  g.anioVaca = anioDe(d);
  return { ok: true, vaca: g.vaca };
}
export const horaDeOrdene = (h) => num(h, 0) >= GRANJA.ordene[0] && num(h, 0) < GRANJA.ordene[1];
export function ordenar(g, dia, horas, invierno = false) {
  if (!g?.vaca) return { ok: false, motivo: 'sinVaca' };
  if (g.vaca.ordenada === ent(dia, 1)) return { ok: false, motivo: 'yaHoy' };
  if (!horaDeOrdene(horas)) return { ok: false, motivo: num(horas, 0) < GRANJA.ordene[0] ? 'temprano' : 'tarde' };
  if (invierno && g.comedero < 1) return { ok: false, motivo: 'sinPasto' };
  if (invierno) g.comedero--;
  g.vaca.ordenada = ent(dia, 1);
  return { ok: true, leche: GRANJA.leche, comio: !!invierno };
}
export function echarFardo(g, fardos) {
  if (!g?.vaca) return { ok: false, motivo: 'sinVaca' };
  if (g.comedero > GRANJA.comedero - GRANJA.racionesFardo) return { ok: false, motivo: 'lleno' };
  if (!(ent(fardos, 0) > 0)) return { ok: false, motivo: 'sinFardos' };
  g.comedero = Math.min(GRANJA.comedero, g.comedero + GRANJA.racionesFardo);
  return { ok: true, raciones: g.comedero };
}
export const esNovillo = (t, dia) => ent(dia, 1) - t.nacio >= GRANJA.diasNovillo;

// ---------------------------------------------------------------- los chanchos
export function recibirChancha(g, dia, lugar = null) {
  if (g.chancha) return { ok: false, motivo: 'yaTenes' };
  const d = Math.max(1, ent(dia, 1));
  g.chancha = { id: g.sig++, desde: d, cuenta: d - 1, comio: 0, comidos: 0, lugar: sanoLugar(lugar) };
  return { ok: true, chancha: g.chancha };
}
// Lo primero de las sobras que tengas: `cuanto(k)` → cuántos hay.
export function sobraParaEchar(cuanto) {
  for (const k of SOBRAS) if ((ent(cuanto(k), 0)) > 0) return k;
  return null;
}
export function echarSobras(g, cuanto) {
  if (!g?.chancha) return { ok: false, motivo: 'sinChancha' };
  if (g.batea >= GRANJA.batea) return { ok: false, motivo: 'llena' };
  const k = sobraParaEchar(cuanto);
  if (!k) return { ok: false, motivo: 'sinSobras' };
  g.batea++;
  return { ok: true, k, batea: g.batea };
}
export const esCapon = (l) => l.engorde >= GRANJA.diasCapon;
function comerChanchos(g, d, eventos) {
  const c = g.chancha;
  g.batea--; c.comio = d;
  for (const l of g.lechones) l.engorde++;
  c.comidos = Math.min(GRANJA.diasCamada, c.comidos + 1);
  if (c.comidos >= GRANJA.diasCamada && g.lechones.length < GRANJA.lechones) {
    const n = Math.min(2 + Math.floor(azarGranja(g.semilla, 31, d) * 3), GRANJA.lechones - g.lechones.length);
    for (let i = 0; i < n; i++) g.lechones.push({ id: g.sig++, nacio: d, engorde: 0 });
    c.comidos = 0;
    eventos.push({ tipo: 'lechones', n, dia: d });
  }
}

// ---------------------------------------------------------------- los corderos
export const corderoListo = (c, dia) => ent(dia, 1) - c.nacio >= GRANJA.diasCordero;

// ---------------------------------------------------------------- el paso de los días
// Lo que pasó desde la última vez (se puede llamar cada cuadro: sólo cambia algo cuando corresponde).
// `ctx`: { ovejas: cuántas hay en tu corral (0 sin corral) }. Devuelve [{ tipo, n, dia }].
export function avanzarGranja(g, dia, ctx = {}) {
  const hoy = Math.max(1, ent(dia, 1)), anio = anioDe(hoy), eventos = [];
  // la vaca pare en primavera (si ya estaba antes de que empezara el año)
  if (g.vaca && g.anioVaca < anio) {
    for (let y = Math.max(g.anioVaca + 1, anio - 3); y <= anio; y++) {
      const p = primaveraDe(y);
      if (g.vaca.desde < p && g.terneros.length < GRANJA.terneros) { g.terneros.push({ id: g.sig++, nacio: p }); eventos.push({ tipo: 'ternero', n: 1, dia: p }); }
    }
    g.anioVaca = anio;
  }
  // las ovejas del corral crían en primavera, si la paridera ya estaba
  const ovejas = Math.max(0, Math.min(2, ent(ctx.ovejas, 0)));
  if (g.anioOvejas < anio) {
    for (let y = Math.max(g.anioOvejas + 1, anio - 3); y <= anio; y++) {
      const p = primaveraDe(y);
      if (!ovejas || !g.paridera || g.paridera > p) continue;
      let n = 0;
      for (let i = 0; i < ovejas; i++) {
        const crias = azarGranja(g.semilla, 53, y, i) < 0.35 ? 2 : 1;   // a veces mellizos
        for (let k = 0; k < crias && g.corderos.length < GRANJA.corderos; k++) { g.corderos.push({ id: g.sig++, nacio: p, madre: i }); n++; }
      }
      if (n) eventos.push({ tipo: 'corderos', n, dia: p });
    }
    g.anioOvejas = anio;
  }
  // los chanchos comen de la batea una ración por día; los días sin comida no cuentan (no les pasa nada)
  const c = g.chancha;
  if (c) {
    let vueltas = 0;
    for (let d = c.cuenta + 1; d < hoy && vueltas < 400; d++, vueltas++) if (c.comio !== d && g.batea > 0) comerChanchos(g, d, eventos);
    c.cuenta = Math.max(c.cuenta, hoy - 1);
    if (c.comio !== hoy && g.batea > 0 && hoy >= c.desde) comerChanchos(g, hoy, eventos);
  }
  return eventos;
}

// ---------------------------------------------------------------- carnear
// Lo decidís vos: el animal se va con Don Ramón y al otro día a la mañana te deja la carne. Sólo los que ya
// están para eso (el novillo, el cordero grande, el capón).
export function carnear(g, que, id, dia) {
  const lista = que === 'novillo' ? g.terneros : que === 'cordero' ? g.corderos : que === 'capon' ? g.lechones : null;
  if (!lista) return { ok: false, motivo: 'que' };
  const i = lista.findIndex((a) => a.id === id);
  if (i < 0) return { ok: false, motivo: 'noEsta' };
  const a = lista[i], d = Math.max(1, ent(dia, 1));
  const listo = que === 'novillo' ? esNovillo(a, d) : que === 'cordero' ? corderoListo(a, d) : esCapon(a);
  if (!listo) return { ok: false, motivo: 'chico', faltan: faltanDias(que, a, d) };
  lista.splice(i, 1);
  g.encargos.push({ que, dia: d, vuelve: d + 1 });
  return { ok: true, vuelve: d + 1 };
}
export function faltanDias(que, a, dia) {
  if (que === 'novillo') return Math.max(0, GRANJA.diasNovillo - (dia - a.nacio));
  if (que === 'cordero') return Math.max(0, GRANJA.diasCordero - (dia - a.nacio));
  return Math.max(0, GRANJA.diasCapon - a.engorde);
}
// Lo que ya te trajeron (y se saca de la lista): [{ que, da: [{ k, n }] }].
export function entregas(g, dia, horas) {
  const d = ent(dia, 1), h = num(horas, 0);
  const listas = [], quedan = [];
  for (const e of g.encargos) (d > e.vuelve || (d === e.vuelve && h >= GRANJA.horaEntrega) ? listas : quedan).push(e);
  g.encargos = quedan;
  return listas.map((e) => ({ que: e.que, da: RINDE_CARNE[e.que].map((x) => ({ ...x })) }));
}

// ---------------------------------------------------------------- los frutales
export const claveFrutal = (x, z) => `${Math.round(Number(x) || 0)}:${Math.round(Number(z) || 0)}`;
export function frutalNuevo() { return { especie: null, plantado: 0, cosecha: -1 }; }
export function plantar(f, especie, dia) {
  if (!f || f.especie) return { ok: false, motivo: 'ocupado' };
  if (!Object.hasOwn(FRUTALES, especie)) return { ok: false, motivo: 'especie' };
  f.especie = especie; f.plantado = Math.max(1, ent(dia, 1)); f.cosecha = -1;
  return { ok: true };
}
// Qué plantín se planta: de los que tenés, la especie que menos plantaste (así sale variado).
export function elegirPlantin(cuanto, frutales = {}) {
  const plantados = {};
  for (const f of Object.values(frutales || {})) if (f?.especie) plantados[f.especie] = (plantados[f.especie] || 0) + 1;
  let mejor = null;
  for (const k of ORDEN_FRUTALES) {
    if (!(ent(cuanto(FRUTALES[k].plantin), 0) > 0)) continue;
    if (!mejor || (plantados[k] || 0) < (plantados[mejor] || 0)) mejor = k;
  }
  return mejor;
}
// ¿Da fruta este año? Tiene que haber estado plantado antes de que terminara la flor y llegar a grande antes de que
// termine el año.
function daEsteAnio(f, E, anio) {
  const p = primaveraDe(anio);
  return f.plantado <= p + 1 && f.plantado + E.adulto <= p + DIAS_ANIO_GRANJA;
}
// Cuántas cosechas hay para juntar (0 o 1): la de este año, madura, desde que madura hasta que empieza el invierno. En
// invierno no hay fruta (ni en el árbol ni en el piso); `invierno` (opcional) dice que es invierno aunque el calendario
// no (la estación fija de Ajustes). Lo que ya juntaste no se echa a perder.
export function cosechasPendientes(f, dia, horas, invierno = false) {
  if (!f?.especie) return 0;
  const E = FRUTALES[f.especie], d = Math.max(1, ent(dia, 1)), anio = anioDe(d), fase = faseGranja(d, horas);
  if (invierno || fase >= FASE.invierno || f.cosecha >= anio || !daEsteAnio(f, E, anio)) return 0;
  return fase >= E.madura && d - f.plantado >= E.adulto ? 1 : 0;
}
// Cómo está un frutal: { etapa: 'hoyo' | 'plantin' | 'joven' | 'adulto', crece (0..1), flor, fruta: 'no' | 'madura',
// cosechas }.
export function estadoFrutal(f, dia, horas = 0, invierno = false) {
  if (!f?.especie) return { etapa: 'hoyo', crece: 0, flor: false, fruta: 'no', cosechas: 0 };
  const E = FRUTALES[f.especie], d = Math.max(1, ent(dia, 1)), anio = anioDe(d), fase = faseGranja(d, horas);
  const edad = d - f.plantado + tope(num(horas, 0), 0, 24) / 24;
  const crece = tope(edad / E.adulto, 0, 1);
  const etapa = d - f.plantado >= E.adulto ? 'adulto' : crece < 0.34 ? 'plantin' : 'joven';
  const flor = !invierno && fase < FASE.flor && daEsteAnio(f, E, anio);
  const cosechas = cosechasPendientes(f, d, horas, invierno);
  return { etapa, crece, flor, fruta: cosechas ? 'madura' : 'no', cosechas, especie: f.especie };
}
export function cosecharFrutal(f, dia, horas, invierno = false) {
  if (!f?.especie) return { ok: false, motivo: 'hoyo' };
  const n = cosechasPendientes(f, dia, horas, invierno);
  if (!n) return { ok: false, motivo: 'nada' };
  f.cosecha = anioDe(dia);
  return { ok: true, k: FRUTALES[f.especie].fruta, n: n * FRUTALES[f.especie].da };
}
// Cuándo da fruta por primera vez un frutal recién plantado (el día), para el aviso.
export function primeraFruta(f) {
  if (!f?.especie) return null;
  const E = FRUTALES[f.especie];
  for (let y = anioDe(f.plantado); y < anioDe(f.plantado) + 3; y++) {
    const p = primaveraDe(y);
    if (f.plantado > p + 1 || f.plantado + E.adulto > p + DIAS_ANIO_GRANJA) continue;
    return Math.max(f.plantado + E.adulto, Math.ceil(p + E.madura * DIAS_ANIO_GRANJA));
  }
  return null;
}

// ---------------------------------------------------------------- los trueques con los vecinos
const m = (k, n) => ({ tipo: 'material', k, n });
const e = (k, n) => ({ tipo: 'entrada', k, n });
// `quien`: la clave de la vecindad ('ramon' del puesto; 'veterinaria', 'madre' (Gladys) y 'herbolaria' de la aldea).
// `da`: 'vaca' | 'chancha' | [{ tipo, k, n }]. `requiere`: la obra que tiene que estar terminada.
export const TRUEQUES_GRANJA = [
  { id: 'vaca', quien: 'ramon', titulo: 'Una vaca lechera con su ternero', pide: [m('tronco', 10), m('tabla', 6)], da: 'vaca', requiere: 'tambo' },
  { id: 'fardos', quien: 'ramon', titulo: 'Cuatro fardos de pasto', pide: [m('tronco', 2)], da: [e('fardo', 4)], repetible: true },
  { id: 'chancha', quien: 'veterinaria', titulo: 'Una chancha preñada', pide: [m('lana', 2), e('huevo', 4)], da: 'chancha', requiere: 'chiquero' },
  { id: 'plantin-manzano', quien: 'madre', titulo: 'Un plantín de manzano', pide: [e('frutilla', 3)], da: [e('plantin-manzano', 1)], repetible: true },
  { id: 'plantin-peral', quien: 'madre', titulo: 'Un plantín de peral', pide: [e('frutilla', 3)], da: [e('plantin-peral', 1)], repetible: true },
  { id: 'plantin-ciruelo', quien: 'madre', titulo: 'Un plantín de ciruelo', pide: [e('huevo', 2)], da: [e('plantin-ciruelo', 1)], repetible: true },
  { id: 'plantin-cerezo', quien: 'madre', titulo: 'Un plantín de cerezo', pide: [e('huevo', 2)], da: [e('plantin-cerezo', 1)], repetible: true },
  { id: 'plantin-frambuesa', quien: 'herbolaria', titulo: 'Una mata de frambuesa', pide: [e('calafate', 4)], da: [e('plantin-frambuesa', 1)], repetible: true },
  { id: 'plantin-grosella', quien: 'herbolaria', titulo: 'Una mata de grosella', pide: [e('calafate', 4)], da: [e('plantin-grosella', 1)], repetible: true },
];
export const TRUEQUE_GRANJA = Object.fromEntries(TRUEQUES_GRANJA.map((t) => [t.id, t]));
export const QUIENES_GRANJA = [...new Set(TRUEQUES_GRANJA.map((t) => t.quien))];
const NOMBRE_PIDE = {
  tronco: ['un tronco', 'troncos'], tabla: ['una tabla', 'tablas'], lana: ['un vellón de lana', 'vellones de lana'], huevo: ['un huevo', 'huevos'],
  frutilla: ['una frutilla', 'frutillas'], calafate: ['un calafate', 'calafates'], piedra: ['una piedra', 'piedras'],
};
export function textoPideGranja(pide) {
  const partes = pide.map((p) => (p.n === 1 ? NOMBRE_PIDE[p.k]?.[0] || `1 ${p.k}` : `${p.n} ${NOMBRE_PIDE[p.k]?.[1] || p.k}`));
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes[0] || '';
}
const cantidad = (p, x) => {
  const v = x.tipo === 'material' ? p?.materiales?.[x.k] : x.tipo === 'cosa' ? p?.cosas?.[x.k] : p?.entradas?.[x.k]?.cantidad;
  return Math.max(0, Math.floor(Number(v) || 0));
};
// Lo que dice cada uno (sin nada religioso; rioplatense de campo).
export const DICE_GRANJA = {
  ramon: {
    vaca: 'Es la overa más mansa que tengo, y viene con el ternero al pie. Ordeñala temprano, que a la tarde se pone mañera. Y en invierno, que no le falte pasto en el comedero.',
    fardos: 'Ahí tenés, del galpón. Un fardo le dura tres días de invierno a una vaca.',
    tambo: 'Primero hacele un tambo con su comedero (O → Trabajo). Una vaca no duerme al sereno, m\'hijo.',
    ya: 'Ya tenés la overa. Una vaca alcanza y sobra para una casa.',
  },
  veterinaria: {
    chancha: 'Me la dejó un puestero a cambio de atenderle las ovejas, y yo no tengo dónde tenerla. Está preñada: con la batea llena, en unos días tenés lechones.',
    chiquero: 'Primero un chiquero (O → Trabajo), con su batea. Suelta se te va a meter en la huerta.',
    ya: 'Ya tenés una chancha. Cuidámela, que es buena madre.',
  },
  madre: {
    plantin: 'Son hijos de los frutales del patio de mi abuela. Plantalo en un hoyo (O → Trabajo) y en primavera vas a ver la flor.',
  },
  herbolaria: {
    plantin: 'Una mata con raíz, envuelta en arpillera. Plantala en un hoyo al sol (O → Trabajo): da fruta en verano, el primer año ya.',
  },
  falta: 'Para eso me haría falta {pide}. Volvé cuando lo tengas, que no se va a ningún lado.',
};
// ¿Se puede hacer ese trueque? `ctx`: { tambo, chiquero } (las obras terminadas). Devuelve { ok, motivo }.
export function puedeTrueque(t, p, g, ctx = {}) {
  if (!t) return { ok: false, motivo: 'trueque' };
  if (t.da === 'vaca' && g?.vaca) return { ok: false, motivo: 'ya' };
  if (t.da === 'chancha' && g?.chancha) return { ok: false, motivo: 'ya' };
  if (t.requiere && !ctx[t.requiere]) return { ok: false, motivo: t.requiere };
  if (t.pide.some((x) => cantidad(p, x) < x.n)) return { ok: false, motivo: 'falta' };
  return { ok: true };
}
// Hace el trueque: devuelve { ok, motivo, renglones, efectos: [{ tipo, k, n }] (lo que se descuenta y lo que se
// suma: los aplica quien llama), animal: 'vaca' | 'chancha' | null }. El animal ya queda en `g`.
export function hacerTrueque(t, p, g, dia, ctx = {}) {
  const dice = DICE_GRANJA[t?.quien] || {};
  const r = puedeTrueque(t, p, g, ctx);
  if (!r.ok) {
    const renglon = r.motivo === 'ya' ? dice.ya : r.motivo === 'falta' ? DICE_GRANJA.falta.replace('{pide}', textoPideGranja(t.pide)) : dice[r.motivo] || DICE_GRANJA.falta.replace('{pide}', textoPideGranja(t.pide));
    return { ok: false, motivo: r.motivo, renglones: [renglon], efectos: [], animal: null };
  }
  const efectos = t.pide.map((x) => ({ tipo: x.tipo, k: x.k, n: -x.n }));
  let animal = null;
  if (t.da === 'vaca') { recibirVaca(g, dia, ctx.lugarTambo || null); animal = 'vaca'; }
  else if (t.da === 'chancha') { recibirChancha(g, dia, ctx.lugarChiquero || null); animal = 'chancha'; }
  else for (const x of t.da) efectos.push({ ...x });
  const renglon = t.da === 'vaca' ? dice.vaca : t.da === 'chancha' ? dice.chancha : t.id === 'fardos' ? dice.fardos : dice.plantin;
  return { ok: true, motivo: null, renglones: [renglon], efectos, animal };
}
// Las opciones del menú de un vecino: [{ id: 'granja:<trueque>', titulo }].
export function opcionesTrueque(quien, p, g, ctx = {}) {
  return TRUEQUES_GRANJA.filter((t) => t.quien === quien && !(t.da === 'vaca' && g?.vaca) && !(t.da === 'chancha' && g?.chancha))
    .map((t) => {
      const ok = puedeTrueque(t, p, g, ctx).ok;
      return { id: `granja:${t.id}`, titulo: `${t.titulo} (pide ${textoPideGranja(t.pide)})${ok ? '' : ' · te falta'}` };
    });
}

// ---------------------------------------------------------------- lo que dice el aviso (E)
const dias = (n) => (n === 1 ? 'un día' : `${n} días`);
export function textoVaca(g, dia, horas, invierno) {
  if (!g?.vaca) return null;
  if (g.vaca.ordenada === ent(dia, 1)) return 'Tu vaca · ya la ordeñaste hoy, mañana temprano otra vez';
  if (!horaDeOrdene(horas)) return `Tu vaca · se ordeña a la mañana (de ${GRANJA.ordene[0]} a ${GRANJA.ordene[1]})`;
  if (invierno && g.comedero < 1) return 'Tu vaca · sin pasto no da leche: echale un fardo al comedero';
  return 'Ordeñar la vaca';
}
export function textoTernero(t, dia) {
  if (esNovillo(t, dia)) return 'Mandar el novillo a carnear';
  const f = faltanDias('novillo', t, ent(dia, 1));
  return `Ternero · en ${dias(f)} es novillo`;
}
export function textoCordero(c, dia) {
  if (corderoListo(c, dia)) return 'Mandar el cordero a carnear';
  return `Cordero · en ${dias(faltanDias('cordero', c, ent(dia, 1)))} está grande`;
}
export function textoLechon(l) {
  if (esCapon(l)) return 'Mandar el capón a carnear';
  const f = faltanDias('capon', l, 0);
  return `Lechón · ${dias(f)} más bien comido y es capón`;
}
export function textoChancha(g) {
  if (!g?.chancha) return null;
  if (g.lechones.length >= GRANJA.lechones) return 'Tu chancha · el chiquero está lleno de lechones';
  const f = GRANJA.diasCamada - g.chancha.comidos;
  return g.batea > 0 ? `Tu chancha · con ${dias(f)} más bien comida, tiene lechones` : 'Tu chancha · con la batea vacía no cría: echale sobras';
}
export function textoTambo(g, fardos) {
  if (!g?.vaca) return 'Tambo · sin vaca todavía (Don Ramón te cambia una)';
  if (g.comedero > GRANJA.comedero - GRANJA.racionesFardo) return `Comedero lleno (${g.comedero} raciones)`;
  if (fardos > 0) return `Echar un fardo al comedero (tenés ${fardos})`;
  return g.comedero ? `Comedero: ${g.comedero} ${g.comedero === 1 ? 'ración' : 'raciones'} · Don Ramón cambia fardos` : 'Comedero vacío · Don Ramón cambia fardos de pasto';
}
export function textoChiquero(g, sobra) {
  if (!g?.chancha) return 'Chiquero · sin chancha todavía (Ayelén, la veterinaria, te cambia una)';
  if (g.batea >= GRANJA.batea) return `Batea llena (${g.batea} raciones)`;
  if (sobra) return `Echar sobras a la batea (${NOMBRE_SOBRA[sobra] || sobra})`;
  return `Batea: ${g.batea} · hacen falta sobras (papas, habas o fruta)`;
}
const NOMBRE_SOBRA = { papa: 'una papa', haba: 'unas habas', manzana: 'una manzana', pera: 'una pera', ciruela: 'unas ciruelas', calafate: 'unos calafates', frutilla: 'unas frutillas' };
export function textoParidera(g, ovejas) {
  if (!ovejas) return 'Paridera · hace falta tu corral con las ovejas al lado';
  const n = g?.corderos?.length || 0;
  return n ? `Paridera · ${n === 1 ? 'un cordero' : `${n} corderos`} en el corral` : 'Paridera · las ovejas crían en primavera';
}
export function textoFrutal(f, dia, horas, plantin = null, invierno = false) {
  if (!f?.especie) return plantin ? `Plantar el ${plantin === 'frambuesa' || plantin === 'grosella' ? 'gajo' : 'plantín'} de ${FRUTALES[plantin].nombre}` : 'Hoyo para frutal · Gladys e Inés cambian plantines';
  const E = FRUTALES[f.especie], s = estadoFrutal(f, dia, horas, invierno);
  const nombre = E.nombre.charAt(0).toUpperCase() + E.nombre.slice(1);
  const cuando = E.madura < FASE.verano ? 'verano' : 'otoño';
  if (s.cosechas > 0) return `Juntar las ${E.frutas} (${s.cosechas * E.da})`;
  if (s.flor) return `${nombre} en flor · ${E.frutas} en ${cuando}`;
  if (s.etapa !== 'adulto') return `${nombre} ${s.etapa === 'plantin' ? 'recién plantado' : 'joven'} · da fruta el día ${primeraFruta(f) ?? '…'}`;
  if (invierno || faseGranja(dia, horas) >= FASE.invierno) return `${nombre} · descansa en invierno; en primavera, flor`;
  if (f.cosecha >= anioDe(dia)) return `${nombre} · ya juntaste las ${E.frutas} de este año`;
  return `${nombre} · ${E.frutas} en ${cuando}`;
}

// ---------------------------------------------------------------- el cuaderno (sección «Del campo»)
export const ENTRADAS_GRANJA = [
  { id: 'leche', seccion: 'huerta', nombre: 'Leche', cientifico: 'de tu vaca', modo: 'cosechar', pista: 'Ordeñá tu vaca a la mañana (E). Don Ramón te cambia una si tenés un tambo.',
    texto: 'Tibia y espumosa, recién ordeñada en el balde. La vaca se ordeña siempre a la misma hora, temprano: se acostumbra y espera. Con leche se hace dulce de leche, chocolate y todo lo que lleva la cocina de campo.' },
  { id: 'carne-vaca', seccion: 'huerta', nombre: 'Carne de vaca', cientifico: 'del novillo', modo: 'cosechar', pista: 'Cuando el ternero de tu vaca es novillo, se lo podés mandar a Don Ramón.',
    texto: 'Don Ramón se lleva el novillo a su puesto y al otro día te deja los cortes envueltos en un lienzo: costillar, vacío y lo de la olla. En el campo se carnea poco y se aprovecha todo.' },
  { id: 'carne-cordero', seccion: 'huerta', nombre: 'Carne de cordero', cientifico: 'de tu corral', modo: 'cosechar', pista: 'Con una paridera junto al corral, tus ovejas crían en primavera.',
    texto: 'El cordero patagónico come pasto de coirón y hierbas de la estepa: por eso tiene ese gusto. Se hace al asador, abierto en cruz junto al fuego, despacio.' },
  { id: 'carne-cerdo', seccion: 'huerta', nombre: 'Carne de cerdo', cientifico: 'del capón', modo: 'cosechar', pista: 'Los lechones de tu chancha, de capones, se los podés mandar a Don Ramón.',
    texto: 'Bondiola, matambrito y costillas. Lo que no se come fresco se hace chorizo, que aguanta todo el invierno colgado en la despensa.' },
  { id: 'chorizo', seccion: 'huerta', nombre: 'Chorizo casero', cientifico: 'del capón', modo: 'cosechar', pista: 'Vienen con la carne del capón: Don Ramón los hace con su receta.',
    texto: 'Carne de cerdo picada a cuchillo, un poco de grasa, sal, pimentón y ajo, embutido en la tripa y atado de a pares. Al asado no le puede faltar.' },
  { id: 'manzana', seccion: 'huerta', nombre: 'Manzana', cientifico: 'Malus domestica', modo: 'cosechar', pista: 'De un manzano tuyo, en otoño. Gladys cambia plantines.',
    texto: 'Las manzanas de los valles cordilleranos son chicas, rayadas de colorado y bien ácidas. Aguantan meses en un cajón con papel de diario, en lugar fresco.' },
  { id: 'pera', seccion: 'huerta', nombre: 'Pera', cientifico: 'Pyrus communis', modo: 'cosechar', pista: 'De un peral tuyo, a fines del verano. Gladys cambia plantines.',
    texto: 'El peral de patio crece alto y derecho, más que el manzano. Las peras se juntan todavía firmes y terminan de madurar adentro, en la alacena.' },
  { id: 'ciruela', seccion: 'huerta', nombre: 'Ciruela', cientifico: 'Prunus domestica', modo: 'cosechar', pista: 'De un ciruelo tuyo, en pleno verano. Gladys cambia plantines.',
    texto: 'Moradas, con esa capa blanquecina que se va con los dedos. El ciruelo es el primero en florecer del patio, todo blanco, antes de sacar las hojas.' },
  { id: 'cereza', seccion: 'huerta', nombre: 'Cereza', cientifico: 'Prunus avium', modo: 'cosechar', pista: 'De un cerezo tuyo, a principios del verano. Gladys cambia plantines.',
    texto: 'Las cerezas de la cordillera maduran tarde, con los días largos, y vienen de a pares colgadas del mismo cabito. Los zorzales las encuentran antes que uno.' },
  { id: 'frambuesa', seccion: 'huerta', nombre: 'Frambuesa', cientifico: 'Rubus idaeus', modo: 'cosechar', pista: 'De una mata tuya, en verano. Inés, la herbolaria, cambia gajos.',
    texto: 'La fruta fina de la Comarca Andina: la frambuesa se suelta del cabito y queda hueca, como un dedal. Hay que juntarla con cuidado, que se aplasta.' },
  { id: 'grosella', seccion: 'huerta', nombre: 'Grosella', cientifico: 'Ribes rubrum', modo: 'cosechar', pista: 'De una mata tuya, en verano. Inés, la herbolaria, cambia gajos.',
    texto: 'Racimitos de bolitas coloradas y transparentes, ácidas como pocas. Solas no se comen mucho, pero en dulce o con la carne son otra cosa.' },
  { id: 'fardo', seccion: 'huerta', nombre: 'Fardo de pasto', cientifico: 'del galpón de Don Ramón', modo: 'cosechar', pista: 'Don Ramón lo cambia por troncos. Para el comedero del tambo en invierno.',
    texto: 'Pasto de mallín cortado en verano y atado con alambre. En invierno, con el campo nevado, es lo único verde que come la vaca.' },
  { id: 'vaca-lechera', seccion: 'huerta', nombre: 'Vaca lechera', cientifico: 'Bos taurus', modo: 'cosechar', pista: 'Hacé un tambo (O → Trabajo) y hablá con Don Ramón.',
    texto: 'Overa, mansa y de buena ubre: en el campo una vaca así es la que da de comer a la casa. Lleva el cencerro para que se la oiga entre los ñires.' },
  { id: 'chancha-criolla', seccion: 'huerta', nombre: 'Chancha', cientifico: 'Sus scrofa domesticus', modo: 'cosechar', pista: 'Hacé un chiquero (O → Trabajo) y hablá con Ayelén, la veterinaria.',
    texto: 'Rosada con manchas negras, orejas caídas sobre los ojos y el hocico siempre en la tierra. Come de todo lo que sobra y cuida a los lechones como nadie.' },
  { id: 'cordero-propio', seccion: 'huerta', nombre: 'Corderos', cientifico: 'Ovis aries', modo: 'cosechar', pista: 'Hacé una paridera (O → Trabajo) junto a tu corral: las ovejas crían en primavera.',
    texto: 'Nacen en primavera, a veces mellizos, y al rato ya están parados. Siguen a la madre a todos lados y balan cuando la pierden de vista.' },
];
for (const k of ORDEN_FRUTALES) {
  const E = FRUTALES[k];
  ENTRADAS_GRANJA.push({ id: E.plantin, seccion: 'huerta', nombre: E.mata ? `Mata de ${k}` : `Plantín de ${E.nombre}`, cientifico: E.mata ? 'de Inés, la herbolaria' : 'de Gladys', modo: 'cosechar',
    pista: 'Se planta en un hoyo para frutal (O → Trabajo), con E.',
    texto: E.mata ? 'Una mata con raíz, envuelta en arpillera húmeda. Prende fácil al sol y da fruta el primer verano.' : 'Un arbolito de un año, a raíz desnuda, con la tierra del patio todavía pegada. Hay que esperarlo: los frutales no tienen apuro.' });
}

// ---------------------------------------------------------------- la mochila
// Las ranuras de lo de la granja: `cant(k)` → cuánto hay. Sin acción propia (la cocina decide qué hacer con cada cosa).
const NOMBRE_RANURA = {
  leche: ['Leche', 'Litros de tu vaca. Para el dulce de leche y la cocina.'], 'carne-vaca': ['Carne de vaca', 'Del novillo, envuelta en un lienzo.'],
  'carne-cordero': ['Carne de cordero', 'Para el asador, abierto en cruz.'], 'carne-cerdo': ['Carne de cerdo', 'Del capón: bondiola, matambrito y costillas.'],
  chorizo: ['Chorizos', 'Caseros, atados de a pares. Al asado no le pueden faltar.'], fardo: ['Fardos de pasto', 'Para el comedero del tambo, en invierno (E).'],
};
const ICONO_RANURA = { leche: 'leche', 'carne-vaca': 'carne', 'carne-cordero': 'carne', 'carne-cerdo': 'carne', chorizo: 'chorizo', fardo: 'fardo' };
export function ranurasGranja(cant) {
  const lista = [];
  for (const k of ['leche', 'carne-vaca', 'carne-cordero', 'carne-cerdo', 'chorizo']) if (cant(k)) lista.push({ id: k, nombre: NOMBRE_RANURA[k][0], icono: ICONO_RANURA[k], cuenta: cant(k), texto: NOMBRE_RANURA[k][1] });
  for (const k of ORDEN_FRUTALES) {
    const E = FRUTALES[k];
    if (cant(E.fruta)) lista.push({ id: E.fruta, nombre: E.frutas.charAt(0).toUpperCase() + E.frutas.slice(1), icono: `fruta-${E.fruta}`, cuenta: cant(E.fruta), texto: 'De tus frutales. No se echan a perder.' });
  }
  if (cant('fardo')) lista.push({ id: 'fardo', nombre: NOMBRE_RANURA.fardo[0], icono: 'fardo', cuenta: cant('fardo'), texto: NOMBRE_RANURA.fardo[1] });
  for (const k of ORDEN_FRUTALES) {
    const E = FRUTALES[k];
    if (cant(E.plantin)) lista.push({ id: E.plantin, nombre: E.mata ? `Matas de ${k}` : `Plantines de ${E.nombre}`, icono: 'plantin', cuenta: cant(E.plantin), texto: 'En un hoyo para frutal (O → Trabajo), con E.' });
  }
  return lista;
}
// Los dibujos de esos iconos (64 × 64): reciben el contexto 2D del lienzo.
const COLOR_FRUTA = { manzana: ['#b8342f', '#e0a33a'], pera: ['#c9b24a', '#9aa83a'], ciruela: ['#5a2a52', '#8a5a8a'], cereza: ['#8e1420', '#c4323a'], frambuesa: ['#c2304a', '#e0607a'], grosella: ['#d02a2a', '#f07a6a'] };
function bolita(x, cx, cy, r, c, brillo = true) {
  x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  if (brillo) { x.fillStyle = 'rgba(255,255,255,0.4)'; x.beginPath(); x.arc(cx - r * 0.35, cy - r * 0.35, r * 0.3, 0, Math.PI * 2); x.fill(); }
}
export const ICONOS_GRANJA = {
  leche(x) {
    x.fillStyle = '#8a8f94'; x.beginPath(); x.moveTo(18, 20); x.lineTo(46, 20); x.lineTo(42, 54); x.lineTo(22, 54); x.closePath(); x.fill();
    x.fillStyle = '#f4efe2'; x.beginPath(); x.ellipse(32, 21, 14, 4, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#5d6266'; x.lineWidth = 2; x.beginPath(); x.arc(32, 22, 16, Math.PI * 1.1, Math.PI * 1.9); x.stroke();
  },
  carne(x) {
    x.fillStyle = '#e8dcc0'; x.beginPath(); x.ellipse(32, 36, 20, 13, -0.2, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#b4463a'; x.beginPath(); x.ellipse(32, 36, 16, 10, -0.2, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#e9d3c4'; x.lineWidth = 2; x.beginPath(); x.moveTo(22, 33); x.quadraticCurveTo(32, 30, 40, 38); x.stroke();
  },
  chorizo(x) {
    x.strokeStyle = '#8a3a26'; x.lineWidth = 11;
    x.beginPath(); x.arc(32, 22, 18, Math.PI * 0.2, Math.PI * 0.8); x.stroke();
    x.beginPath(); x.arc(32, 34, 18, Math.PI * 0.2, Math.PI * 0.8); x.stroke();
    x.strokeStyle = '#d9c7a8'; x.lineWidth = 2; x.beginPath(); x.moveTo(17, 38); x.lineTo(13, 46); x.stroke();
  },
  fardo(x) {
    x.fillStyle = '#c9b06a'; x.fillRect(12, 24, 40, 26);
    x.strokeStyle = '#9a8248'; x.lineWidth = 1.5; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(14 + i * 7, 26); x.lineTo(12 + i * 7, 48); x.stroke(); }
    x.strokeStyle = '#6b6b6b'; x.lineWidth = 2; for (const xx of [22, 42]) { x.beginPath(); x.moveTo(xx, 23); x.lineTo(xx, 51); x.stroke(); }
  },
};
for (const [fruta, [a, b]] of Object.entries(COLOR_FRUTA)) {
  ICONOS_GRANJA[`fruta-${fruta}`] = (x) => {
    if (fruta === 'grosella' || fruta === 'frambuesa' || fruta === 'cereza') {
      x.strokeStyle = '#4e6a2e'; x.lineWidth = 2; x.beginPath(); x.moveTo(32, 10); x.lineTo(24, 34); x.moveTo(32, 10); x.lineTo(40, 34); x.stroke();
      const pts = fruta === 'cereza' ? [[24, 40, 10], [40, 40, 10]] : [[22, 36, 7], [32, 40, 7], [42, 36, 7], [27, 48, 7], [37, 48, 7]];
      for (const [cx, cy, r] of pts) bolita(x, cx, cy, r, fruta === 'frambuesa' ? b : a);
      return;
    }
    if (fruta === 'pera') { x.fillStyle = a; x.beginPath(); x.ellipse(32, 42, 14, 13, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(32, 26, 8, 11, 0, 0, Math.PI * 2); x.fill(); }
    else bolita(x, 32, 38, fruta === 'ciruela' ? 13 : 16, a);
    x.fillStyle = b; x.beginPath(); x.ellipse(38, 40, 5, 7, 0.4, 0, Math.PI * 2); x.globalAlpha = 0.35; x.fill(); x.globalAlpha = 1;
    x.strokeStyle = '#5a4131'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(32, 24); x.lineTo(34, 12); x.stroke();
    x.fillStyle = '#6f9a45'; x.beginPath(); x.ellipse(40, 14, 7, 3.5, -0.4, 0, Math.PI * 2); x.fill();
  };
}
