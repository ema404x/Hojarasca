// 3.7.3 «La trochita»: el taller ferroviario y las mejoras del tren (sin Electron).
//  · tren-mejoras.js: el contrato de `progreso.tren` con el equipo del tren, las mejoras (lo que piden, cuánto tardan,
//    lo que requieren), pedir, aportar de a poco, el reloj del taller (durmiendo o en el día), la composición, la
//    pintura y el nombre; el saneador contra basura y el guardado (con la migración desde la 3.7.2);
//  · el plano: el galpón del otro lado de la vía, medido con el terreno real (sin pisar el riel), sus puntos y el
//    camino de la gente (la puerta chica, el cruce de tablones, la salida a la aldea);
//  · la arquitectura (en una VM con el three local): las dos etapas del galpón, el foso, el cuarto de Martín, las
//    colisiones, la puerta, el desvío con su cambio y el presupuesto;
//  · Martín, vecino de la aldea; las poses de trabajo; el panel (taller-tren-juego.js) con un contexto de mentira;
//  · los enganches de main.js (E y el aviso en el mismo orden, las listas del HUD, el reloj) y nada religioso.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const RELIGIOSO = /capilla|\bmisa\b|\bcura\b|\bcuras\b|\brez[aoá]|\bdios|\bsant[oa]s?\b|bendi|iglesia|altar|parroq|milagro|virgen|sagrad|ángel|amén|pecado/i;

// localStorage de mentira (para el guardado), antes de importar
const almacen = new Map();
globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k), key: () => null, length: 0 };

const TM = await import('../src/tren-mejoras.js');
const A = await import('../src/aldea.js');
const G = await import('../src/aldea-gente.js');
const TJ = await import('../src/taller-tren-juego.js');
const GU = await import('../src/guardado.js');
const VE = await import('../src/vecindad.js');
const VZ = await import('../src/vecindad-voces.js');
const AV = await import('../src/aldea-vida.js');
const RO = await import('../src/gente-ropa.js');
const TV = await import('../src/tren-viaje.js');   // el equipo del tren: cómo lee `progreso.tren`

// ============================================================ 0. los módulos
{
  for (const f of ['src/tren-mejoras.js', 'src/taller-tren-juego.js']) {
    const t = leer(f);
    ok(!/from 'three'/.test(t) && !/^\s*(document|window)\./m.test(t), `${f}: sin three ni DOM al cargar`);
    for (const m of t.matchAll(/^import .*$/gm)) ok(/^import \{ [\w, ]+ \} from '\.\/[\w-]+\.js';$/.test(m[0]), `${f}: import en una línea: ${m[0]}`);
    ok(!/^export\s+(async\s+function|function\*|\*|.*\sfrom\s)/m.test(t) && !t.includes('\r'), `${f}: lo que entiende armar.mjs, con LF`);
    ok(/^\/\/ 3\.7\.3/.test(t), `${f}: el encabezado con 3.7.3`);
    ok(!RELIGIOSO.test(t), `${f}: nada religioso`);
  }
  for (const [f, M] of [['tren-mejoras', TM], ['taller-tren-juego', TJ]]) for (const k of Object.keys(M)) ok(!/ñ/.test(k), `${f}: exportado sin ñ: ${k}`);
  for (const f of ['src/aldea.js', 'src/aldea-arquitectura.js', 'src/aldea-mundo.js', 'src/aldea-gente.js', 'src/gente.js', 'src/main.js', 'src/guardado.js']) ok(/3\.7\.3/.test(leer(f)), `${f}: comentarios con 3.7.3`);
  ok(leer('package.json').includes('node pruebas/verificar-3-7-3-taller.mjs'), 'la prueba está en el gate');
  const arq = leer('src/aldea-arquitectura.js');
  ok(!/ShapeGeometry|OctahedronGeometry|THREE\.Shape\b|Vector4|Frustum|Uint32BufferAttribute|Uint16BufferAttribute/.test(arq + leer('src/aldea-mundo.js')), 'nada que el three local no trae');
}

// ============================================================ 1. el contrato de progreso.tren
const nuevo = TM.trenNuevo();
{
  eq(Object.keys(nuevo).sort(), ['composicion', 'loco', 'taller', 'vagones'], 'el tren: loco, vagones, composición (y el taller)');
  eq(Object.keys(nuevo.loco).sort(), ['arenero', 'banderines', 'caldera', 'farol', 'freno', 'nombre', 'pintura', 'quitanieves', 'silbato'], 'la loco: lo del contrato');
  eq(Object.keys(nuevo.loco.pintura).sort(), ['cuerpo', 'franja', 'ruedas'], 'la pintura: cuerpo, franja y ruedas');
  eq(Object.keys(nuevo.vagones).sort(), ['caballo', 'carga', 'comedor', 'dormitorio', 'mirador', 'pasajeros'], 'los seis vagones');
  ok(nuevo.loco.caldera === 0 && nuevo.loco.freno === 0 && nuevo.loco.farol === false && nuevo.loco.silbato === 'comun' && !nuevo.loco.quitanieves && !nuevo.loco.arenero && !nuevo.loco.banderines, 'la loco de siempre');
  ok(nuevo.loco.nombre === '' && Object.values(nuevo.loco.pintura).every((v) => v === null), 'sin nombre ni pintura del taller: los de siempre (o los de «Personalizar»)');
  ok(Object.values(nuevo.vagones).every((v) => v === false) && nuevo.composicion.length === 0, 'ningún vagón nuevo: van los dos coches de segunda de siempre');
  // como lo lee el equipo del tren (tren-viaje.js): lo mismo que el suyo de fábrica, y la composición de siempre
  eq(TV.sanearEstadoTren(nuevo).loco, TV.estadoTrenNuevo().loco, 'tren-viaje.js lo lee igual que su tren nuevo');
  ok(TV.composicionDe(nuevo).join() === 'segunda,segunda2', 'y salen los dos de segunda');
  ok(TM.VAGONES_MAX === 4, 'ténder + 4 vagones (los andenes no dan para más)');
  eq([...TM.IDS_SILBATOS].sort(), ['comun', 'doble', 'grave', 'pajaro'], 'los silbatos del contrato');
  ok(TM.IDS_PALETA.length >= 8 && TM.IDS_PALETA.every((k) => /^#[0-9a-f]{6}$/.test(TM.PALETA_TREN[k].hex)) && TM.colorTren('rojo') === '#9a3324' && TM.colorTren('#9A3324') === '#9a3324' && TM.colorTren('nada') === null && TM.colorTren('#123456') === null, 'la paleta: el color de cada uno; lo que no es de la paleta, la de siempre');
}

// ============================================================ 2. las mejoras
{
  const M = TM.MEJORAS_TREN;
  for (const [id, m] of Object.entries(M)) {
    ok(typeof m.nombre === 'string' && m.nombre && typeof m.dice === 'string' && m.dice.length > 20, `${id}: nombre y qué es`);
    ok(Object.keys(m.pide).every((k) => ['tabla', 'tronco', 'piedra'].includes(k) && Number.isInteger(m.pide[k]) && m.pide[k] > 0), `${id}: pide sólo tablas, troncos y piedras`);
    ok(Number.isInteger(m.hierro) && m.hierro >= 0 && m.hierro <= 10 && Number.isInteger(m.dias) && m.dias >= 0 && m.dias <= 6, `${id}: piezas de hierro y días`);
    ok(m.dias > 0 || (m.horas > 0 && m.horas <= 8), `${id}: las del día, en horas de taller`);
    ok(m.requiere.every((r) => TM.esMejora(r) && TM.IDS_MEJORAS.indexOf(r) < TM.IDS_MEJORAS.indexOf(id)), `${id}: lo que requiere existe y va antes (sin ciclos)`);
    ok(['loco', 'vagon', 'adorno'].includes(m.grupo) && (m.efecto.vagon ? Object.hasOwn(nuevo.vagones, m.efecto.vagon) : Object.hasOwn(nuevo.loco, m.efecto.campo)), `${id}: lo que cambia es del contrato`);
    ok(!RELIGIOSO.test(m.nombre + m.dice), `${id}: nada religioso`);
  }
  for (const c of ['caldera', 'freno']) eq([1, 2, 3].map((k) => M[`${c}-${k}`]?.efecto.valor), [1, 2, 3], `${c}: tres niveles`);
  ok(M['caldera-3'].requiere.includes('caldera-2') && M['freno-2'].requiere.includes('freno-1'), 'cada nivel pide el anterior');
  for (const k of ['farol', 'quitanieves', 'arenero', 'banderines']) ok(TM.IDS_MEJORAS.some((id) => M[id].efecto.campo === k && M[id].efecto.valor === true), `la mejora: ${k}`);
  for (const k of ['grave', 'doble', 'pajaro']) ok(TM.IDS_MEJORAS.some((id) => M[id].efecto.campo === 'silbato' && M[id].efecto.valor === k), `el silbato ${k}`);
  for (const v of ['pasajeros', 'comedor', 'carga', 'caballo', 'mirador', 'dormitorio']) ok(TM.IDS_MEJORAS.some((id) => M[id].efecto.vagon === v), `el vagón ${v}`);
  ok(TM.textoPide('caldera-1') === '2 tablas y 6 piedras, más 4 piezas de hierro · 2 días' && TM.textoPide('banderines') === '2 tablas · 3 horas de taller', 'lo que pide, dicho');
  ok(TM.textoPide('caldera-1', true) === '10 tablas y 12 piedras, más 4 piezas de hierro · 2 días', 'la primera, con el arreglo del galpón');
}

// ============================================================ 3. pedir, aportar, el reloj
{
  const t = TM.trenNuevo();
  ok(TM.puedePedir(t, 'caldera-2').motivo === 'requiere' && TM.puedePedir(t, 'caldera-2').falta === 'caldera-1', 'la caldera 2 pide la 1');
  ok(TM.puedePedir(t, 'nada').motivo === 'desconocida' && !TM.pedirMejora(t, 'nada', 1, 9).ok, 'una que no existe');
  const r = TM.pedirMejora(t, 'freno-1', 3, 9);
  ok(r.ok && r.pedido.arreglo && TM.estadoTaller(t) === 'juntando', 'la primera: con el arreglo del galpón, esperando material');
  ok(!TM.pedirMejora(t, 'farol', 3, 9).ok && TM.puedePedir(t, 'farol').motivo === 'ocupado', 'una por vez: el foso es uno solo');
  // aportes parciales (como las obras del pueblo)
  const mios = { tabla: 5, tronco: 2, piedra: 1 };
  let a = TM.aportarMejora(t, mios, 3, 10);
  ok(a.ok && a.dado.tabla === 5 && a.dado.piedra === 1 && !a.dado.tronco && !a.completo, `de a poco: ${JSON.stringify(a.dado)}`);
  eq(a.faltan, { tabla: 7, piedra: 5 }, 'lo que falta');
  ok(!TM.aportarMejora(t, { tronco: 9 }, 3, 10).ok, 'lo que no pide, no se lleva');
  a = TM.aportarMejora(t, { tabla: 20, piedra: 20 }, 3, 11);
  ok(a.completo && !a.empezo && a.hierroFalta === 3 && TM.faltaDelPedido(t).hierro === 3, 'el material está; faltan las piezas de hierro');
  // el hierro: sin herrería, una por día con el tren de las 11
  let s = TM.avanzarTaller(t, 3, 10.5);
  ok(s.piezas === 0 && t.taller.pedido.hierro === 0, 'antes del tren de las 11, nada');
  s = TM.avanzarTaller(t, 4, 12);
  ok(s.piezas === 2 && t.taller.pedido.hierro === 2, 'sin herrería: una pieza de El Maitén por día, con el tren de las 11');
  // con la herrería de Anselmo: dos por día (9 y 15)
  s = TM.avanzarTaller(t, 4, 16, { herreria: true });
  ok(s.piezas === 1 && s.empezo && TM.estadoTaller(t) === 'armando', 'abrió la herrería: la pieza de las 15 completa las tres y Ernesto y Martín la arman');
  ok(t.taller.pedido.empezo === 4 * 24 + 15 && t.taller.pedido.listo === 5 * 24 + 7, `lista a la mañana siguiente (un día): ${TM.textoListo(t.taller.pedido.listo)}`);
  ok(TJ.textoAvisoTaller(t) === 'Taller: freno: zapatas nuevas, lista el día 5 a las 7', 'el aviso, armando');
  ok(!TM.aportarMejora(t, { tabla: 3 }, 4, 17).ok, 'armando, no pide más');
  s = TM.avanzarTaller(t, 5, 6.9, { herreria: true });
  ok(!s.lista && TM.estadoTaller(t) === 'armando', 'todavía no');
  s = TM.avanzarTaller(t, 5, 7, { herreria: true });
  ok(s.lista === 'freno-1' && t.loco.freno === 1 && t.taller.arreglado && TM.hecha(t, 'freno-1') && !t.taller.pedido, 'lista: el freno nuevo y el galpón arreglado');
  eq(TM.tomarAvisos(t), ['freno-1'], 'el aviso para el juego');
  eq(TM.tomarAvisos(t), [], 'una sola vez');
  ok(!TM.pedirMejora(t, 'freno-1', 6, 8).ok && TM.puedePedir(t, 'freno-1').motivo === 'hecha', 'lo hecho, hecho');
  // ya arreglado: la siguiente no pide el arreglo; una de horas, en el día
  const b = TM.pedirMejora(t, 'banderines', 6, 10);
  ok(b.ok && !b.pedido.arreglo, 'la segunda, sin el arreglo');
  a = TM.aportarMejora(t, { tabla: 2 }, 6, 10);
  ok(a.empezo && t.taller.pedido.listo === 6 * 24 + 13, 'los banderines: tres horas de taller, el mismo día');
  s = TM.avanzarTaller(t, 6, 13.5);
  ok(s.lista === 'banderines' && t.loco.banderines, 'hecho todo en el día');
  // a la tardecita, la de horas pasa a la mañana
  TM.pedirMejora(t, 'silbato-grave', 6, 18);
  ok(TM.cuandoLista('silbato-grave', 6 * 24 + 18) === 7 * 24 + 12, 'la de horas pedida a las 18: al otro día, de 8 a 12');
  ok(TM.cancelarPedido(t).ok && !t.taller.pedido, 'se puede dejar mientras junta');
  // dejar devuelve lo aportado
  TM.pedirMejora(t, 'farol', 7, 9); TM.aportarMejora(t, { tabla: 1 }, 7, 9);
  eq(TM.cancelarPedido(t).devuelto, { tabla: 1 }, 'Martín devuelve el material');
}
// durmiendo: varios días de una dan lo mismo que de a una hora
{
  const paso = (saltos) => {
    const t = TM.trenNuevo();
    TM.pedirMejora(t, 'caldera-1', 2, 8); TM.aportarMejora(t, { tabla: 99, piedra: 99 }, 2, 8);
    let ult = null;
    for (const [d, h] of saltos) { const s = TM.avanzarTaller(t, d, h, { herreria: true }); if (s.lista) ult = [d, h]; }
    return { tren: JSON.stringify({ ...t, taller: { ...t.taller, ultimo: 0, avisar: [] } }), ult };
  };
  const horas = [];
  for (let d = 2; d <= 7; d++) for (let h = 0; h < 24; h += 0.5) horas.push([d, h]);
  const deAPoco = paso(horas.filter(([d, h]) => d > 2 || h > 8));
  const durmiendo = paso([[2, 22], [6, 8]]);
  ok(deAPoco.tren === durmiendo.tren, 'durmiendo de una o de a media hora: lo mismo');
  ok(deAPoco.ult[0] === 5 && deAPoco.ult[1] === 7, `la caldera: piezas el 2 (15 h) y el 3 (9 y 15 h), armada del 3 a las 15 al 5 a las 7 (${deAPoco.ult})`);
}

// ============================================================ 4. pintura, nombre, silbato, composición
{
  const t = TM.trenNuevo();
  ok(TM.pintar(t, 'cuerpo', 'verde') && t.loco.pintura.cuerpo === '#3d5a42' && !TM.pintar(t, 'techo', 'rojo') && !TM.pintar(t, 'franja', '#fff') && TM.pintar(t, 'ruedas', null) && t.loco.pintura.ruedas === null, 'la pintura, de la paleta (en #rrggbb, como la lee el tren); null, la de siempre');
  ok(TM.colorSiguiente(null) === '#2e3133' && TM.colorSiguiente('#2e3133') === '#9a3324' && TM.colorSiguiente('#dcd5c4') === null && TM.colorSiguiente('???') === '#2e3133', 'el color que sigue (y vuelve a la de siempre)');
  eq(TV.sanearEstadoTren(t).loco.pintura, { cuerpo: '#3d5a42', franja: null, ruedas: null }, 'tren-viaje.js lee la pintura del taller');
  ok(TM.ponerNombre(t, '  La   Patagónica  ') && t.loco.nombre === 'La Patagónica', 'el nombre, sin espacios de más');
  ok(TM.ponerNombre(t, '<script>alert(1)</script>Ñandú Express de la Meseta Grande') && t.loco.nombre.length <= TM.LARGO_NOMBRE && !/[<>()]/.test(t.loco.nombre), `el nombre, saneado: ${t.loco.nombre}`);
  ok(!TM.ponerNombre(t, '   ') && !TM.ponerNombre(t, 42) && !TM.ponerNombre(t, '<<>>'), 'un nombre vacío no cambia nada');
  ok(TV.sanearEstadoTren(t).loco.nombre === t.loco.nombre && TM.LARGO_NOMBRE === 18, 'el nombre, como lo pinta el tren (hasta 18 letras)');
  ok(!TM.elegirSilbato(t, 'grave') && TM.elegirSilbato(t, 'comun'), 'sólo los silbatos hechos');
  t.taller.hechas.push('silbato-grave');
  ok(TM.elegirSilbato(t, 'grave') && t.loco.silbato === 'grave', 'el silbato hecho, elegido');
  // la composición
  for (const v of ['comedor', 'carga', 'caballo', 'mirador', 'dormitorio']) t.vagones[v] = true;
  t.vagones.pasajeros = true;
  for (const v of ['pasajeros', 'carga', 'mirador', 'comedor']) ok(TM.alternarVagon(t, v).ok, `enganchar ${v}`);
  ok(TM.alternarVagon(t, 'caballo').motivo === 'largo' && t.composicion.length === 4, 'no entra un quinto');
  ok(TM.alternarVagon(t, 'mirador').ok && TM.alternarVagon(t, 'caballo').ok, 'se deja uno en el desvío y entra otro');
  eq(t.composicion, ['pasajeros', 'carga', 'comedor', 'caballo'], 'el orden de enganche');
  ok(TM.adelantarVagon(t, 'caballo').ok && t.composicion[2] === 'caballo' && !TM.adelantarVagon(t, 'pasajeros').ok, 'pasar uno adelante');
  ok(TM.elegirComposicion(t, ['mirador', 'carga']).ok && t.composicion.join() === 'mirador,carga', 'la que se elige, en su orden');
  ok(TV.composicionDe(t).join() === 'mirador,carga', 'y el tren la saca así a la vía');
  ok(!TM.elegirComposicion(t, ['carga', 'mirador', 'comedor', 'caballo', 'dormitorio']).ok && TM.elegirComposicion(t, ['carga', 'mirador', 'comedor', 'caballo']).ok, 'hasta cuatro detrás del ténder');
  ok(TV.composicionDe(t).join() === 'carga,mirador,comedor,caballo', 'cuatro, como la lee el tren');
  ok(TM.elegirComposicion(t, ['pasajeros', 'pasajeros', 'nada', 'carga']).composicion.join() === 'pasajeros,carga', 'sin repetidos ni inventados');
  ok(TM.elegirComposicion(t, []).ok && TV.composicionDe(t).length === 4, 'vacía: van los que tengas (cuatro)');
  const v = TM.trenNuevo();
  ok(!TM.alternarVagon(v, 'carga').ok, 'un vagón que no está hecho no se engancha');
}

// ============================================================ 5. el saneador (basura) y el guardado
{
  eq(TM.sanearTren(undefined), TM.trenNuevo(), 'nada: el tren nuevo');
  for (const x of [null, 3, 'tren', [], [1, 2], { loco: 'x' }, { taller: [] }, { composicion: 'pasajeros' }]) eq(TM.sanearTren(x), TM.trenNuevo(), `basura: ${JSON.stringify(x)}`);
  // lo hecho manda: no hay caldera 3 sin la 1 y la 2; los vagones, sólo los hechos
  const r = TM.sanearTren({ loco: { caldera: 3, freno: 2, farol: true, silbato: 'pajaro', nombre: 42, pintura: { cuerpo: 'violeta', ruedas: 'verde' } }, vagones: { carga: true, comedor: true }, composicion: ['carga', 'comedor', 'x'],
    taller: { hechas: ['caldera-3', 'caldera-1', 'carga', 'carga', 'nada'], pedido: { id: 'farol', aportado: { tabla: 99 }, hierro: 99, empezo: 50, listo: 1e12, desde: -5 }, arreglado: 'si', ultimo: 1e15, avisar: ['carga', 'x'] } }, 9);
  ok(r.loco.caldera === 1 && r.loco.freno === 0 && !r.loco.farol && r.loco.silbato === 'comun', 'sólo vale lo hecho de verdad');
  ok(r.vagones.carga && !r.vagones.comedor && r.composicion.join() === 'carga', 'los vagones y la composición: los hechos');
  ok(r.loco.nombre === '' && r.loco.pintura.cuerpo === null && r.loco.pintura.ruedas === '#3d5a42', 'el nombre y la pintura, saneados');
  ok(r.taller.hechas.join() === 'caldera-1,carga' && r.taller.arreglado, 'lo hecho, sin repetir ni inventar');
  ok(r.taller.pedido && r.taller.pedido.aportado.tabla === 1 && r.taller.pedido.hierro === 2 && r.taller.pedido.listo === r.taller.pedido.empezo + 0 || r.taller.pedido.listo <= 10 * 24 + 24 * 31, 'el pedido acotado');
  ok(r.taller.ultimo <= 9 * 24 + 24 && r.taller.avisar.join() === 'carga', 'el reloj y los avisos, posibles');
  // un pedido retocado como "armándose" sin material no se regala
  const regalo = TM.sanearTren({ taller: { arreglado: true, hechas: ['freno-1'], pedido: { id: 'freno-2', aportado: {}, hierro: 0, desde: 30, empezo: 31, listo: 40 } } }, 5);
  ok(regalo.taller.pedido && regalo.taller.pedido.empezo === null && regalo.taller.pedido.listo === null, 'armándose sin material: vuelve a juntar');
  // fuzz: nunca tira, siempre devuelve el contrato y sanear dos veces da lo mismo
  let sem = 7;
  const az = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  const basura = (d = 0) => {
    const k = Math.floor(az() * 9);
    if (d > 3 || k === 0) return [null, undefined, NaN, -1, 1e300, '', 'x', true, '__proto__'][Math.floor(az() * 9)];
    if (k < 4) { const o = {}; for (const c of ['loco', 'vagones', 'composicion', 'taller', 'caldera', 'freno', 'pintura', 'nombre', 'hechas', 'pedido', 'id', 'aportado', 'hierro', 'empezo', 'listo', 'silbato', 'tabla', 'desde', 'ultimo', 'avisar', 'constructor']) if (az() < 0.35) o[c] = basura(d + 1); return o; }
    if (k < 6) return Array.from({ length: Math.floor(az() * 5) }, () => (az() < 0.5 ? TM.IDS_MEJORAS[Math.floor(az() * TM.IDS_MEJORAS.length)] : basura(d + 1)));
    return [TM.IDS_MEJORAS[Math.floor(az() * TM.IDS_MEJORAS.length)], 'pasajeros', 'carga', 'verde', 3, 0.5][Math.floor(az() * 6)];
  };
  for (let i = 0; i < 3000; i++) {
    const x = { loco: basura(), vagones: basura(), composicion: basura(), taller: { hechas: basura(), pedido: { id: TM.IDS_MEJORAS[i % TM.IDS_MEJORAS.length], ...(basura() || {}) }, ...(basura() || {}) } };
    let s;
    try { s = TM.sanearTren(x, 1 + (i % 40)); } catch (err) { assert.fail(`sanearTren tiró con ${JSON.stringify(x)}: ${err}`); }
    assert.ok(s.composicion.length <= 4 && s.composicion.every((k) => s.vagones[k]) && [0, 1, 2, 3].includes(s.loco.caldera) && TM.IDS_SILBATOS.includes(s.loco.silbato) && typeof s.loco.nombre === 'string' && s.loco.nombre.length <= 18 && Object.values(s.loco.pintura).every((c) => c === null || /^#[0-9a-f]{6}$/.test(c)), 'fuzz: el contrato');
    assert.deepEqual(TV.sanearEstadoTren(s).composicion, s.composicion, 'fuzz: el tren lee la misma composición');
    assert.deepEqual(TM.sanearTren(JSON.parse(JSON.stringify(s)), 1 + (i % 40)), s, 'fuzz: sanear dos veces, lo mismo');
    // y el reloj no tira con lo saneado
    TM.avanzarTaller(s, 1 + (i % 40) + 3, 12, { herreria: i % 2 === 0 });
  }
  n++;
  // el guardado
  GU.usarModoGuardado('relax', 1);
  const p = GU.progresoNuevo();
  eq(p.tren, TM.trenNuevo(), 'partida nueva: el tren de siempre');
  GU.usarModoGuardado('desafio', 1);
  ok(GU.progresoNuevo().tren === undefined, 'en el Desafío, ninguno');
  GU.usarModoGuardado('relax', 1);
  // una partida de la 3.7.2 (sin tren) se carga con el tren de siempre; una con basura, saneada
  const vieja = GU.progresoNuevo(); delete vieja.tren; vieja.dia = 12;
  almacen.set('hojarasca-v1', JSON.stringify(vieja));
  const cargada = GU.cargarProgreso();
  eq(cargada?.tren, TM.trenNuevo(), 'desde la 3.7.2: la trochita de siempre y el galpón viejo');
  vieja.tren = { loco: { caldera: 'mucha' }, taller: { hechas: ['farol'], pedido: { id: 'caldera-1' } } };
  almacen.set('hojarasca-v1', JSON.stringify(vieja));
  const c2 = GU.cargarProgreso();
  ok(c2.tren.loco.farol && c2.tren.loco.caldera === 0 && c2.tren.taller.pedido?.id === 'caldera-1' && c2.tren.taller.arreglado, 'un tren guardado, saneado al cargar');
  const g = leer('src/guardado.js');
  ok(g.includes('tren: sanearTren(p.tren, Math.max(1, Math.floor(finito(p.dia, 1)))),') && g.includes('...(desafio ? {} : { tren: trenNuevo() }),') && g.includes('cocina: undefined, tren: undefined'), 'guardado.js: el tren (y en el Desafío, no)');
}

// ============================================================ 6. el plano: el galpón, medido con el terreno real
const { generarTerreno } = await import('../src/terreno.js');
const T = generarTerreno();
const marco = A.marcoAldea();
const E = A.EDIFICIOS_ALDEA['taller-tren'];
const segRiel = T.riel.filter((q) => Math.hypot(q.x - A.PARADA_ALDEA.x, q.z - A.PARADA_ALDEA.z) < 200);
function distRiel(x, z) {
  let d = Infinity;
  for (let i = 0; i < segRiel.length - 1; i++) {
    const a = segRiel[i], b = segRiel[i + 1], vx = b.x - a.x, vz = b.z - a.z, l2 = vx * vx + vz * vz;
    const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / l2));
    d = Math.min(d, Math.hypot(x - a.x - vx * t, z - a.z - vz * t));
  }
  return d;
}
{
  ok(E && E.fija && E.rol === 'taller-tren' && E.ancho === 17 && E.fondo === 7.2 && E.rot === 0 && !E.inicial && !E.poblador && !E.calle, 'el taller: fijo, 17 × 7,2 m, sin lote ni calle');
  ok(Math.abs(E.y + 0.32 - (A.PARADA_ALDEA.y + 0.3)) < 0.01, 'el piso, 30 cm arriba de la vía en la estación');
  let min = Infinity, max = -Infinity, riel = Infinity, agua = false;
  for (const q of A.muestrasPlanta('taller-tren')) {
    const w = marco.aMundo(q.lx, q.lz), h = T.altura(w.x, w.z);
    min = Math.min(min, h); max = Math.max(max, h); riel = Math.min(riel, distRiel(w.x, w.z));
    if (T.agua(w.x, w.z)) agua = true;
  }
  ok(!agua, 'fuera del agua');
  ok(riel >= 4.2, `sin pisar el riel: la pared del frente a ${riel.toFixed(2)} m del eje de la vía`);
  const piso = E.y + 0.32;
  ok(piso - max >= 0.2 && piso - min <= 2.6, `el terreno, abajo del piso (entre ${(piso - max).toFixed(2)} y ${(piso - min).toFixed(2)} m): lo cubre el zócalo`);
  // del otro lado de la vía, frente a la estación
  const l = { x: E.x, z: E.z };
  ok(l.z < 0 && Math.abs(l.x) < 30, 'del otro lado de la vía, frente a la estación');
  // 3 m o más de los demás
  const pl = A.plantaDe('taller-tren');
  for (const id of A.IDS_EDIFICIOS) {
    if (id === 'taller-tren') continue;
    const b = A.plantaDe(id);
    ok(Math.hypot(Math.max(0, pl.x0 - b.x1, b.x0 - pl.x1), Math.max(0, pl.z0 - b.z1, b.z0 - pl.z1)) >= 3, `lejos de ${id}`);
  }
  for (const c of A.CALLES_ALDEA) ok(Math.min(...A.muestrasPlanta('taller-tren').map((q) => A.distanciaACalle(q.lx, q.lz, c))) > 2, `no pisa ${c.id}`);
  // los puntos
  const P = A.puntosDe('taller-tren');
  eq(Object.keys(P).sort(), ['adentro', 'banco', 'cama', 'cruce', 'fragua', 'pie', 'puerta', 'ruedas', 'salida', 'trabajo', 'zaguan'], 'los puntos del taller');
  for (const k of ['adentro', 'banco', 'cama', 'fragua', 'ruedas', 'zaguan']) ok(A.dentroDePlanta('taller-tren', P[k].x, P[k].z, 0.3), `taller.${k}: adentro`);
  for (const k of ['puerta', 'trabajo', 'pie', 'cruce', 'salida']) ok(!A.dentroDePlanta('taller-tren', P[k].x, P[k].z, -0.3), `taller.${k}: afuera`);
  const wc = marco.aMundo(P.cruce.x, P.cruce.z);
  ok(distRiel(wc.x, wc.z) < 0.3, 'el cruce de tablones, sobre la vía principal');
  ok(!A.dentroDePlanta('estacion-aldea', P.salida.x, P.salida.z) && Math.hypot(P.salida.x - 6, P.salida.z - 9) < 4, 'la salida, al lado de la de la estación (la calle de la Estación)');
  ok(A.PUERTA_X['taller-tren'] === 3 && Math.abs(P.puerta.x - 23.5) < 1e-9 && Math.abs(P.puerta.z - (E.z + E.fondo / 2 + 0.9)) < 1e-9, 'la puerta chica, en el frente');
  // el camino de la gente: por la puerta chica, el pie de la escalera, el cruce y la salida (y no por el andén)
  const E2 = A.puntosDe('estacion-aldea');
  const ida = G.recorridoAldea(E2.adentro, P.ruedas);
  const pasa = (q) => ida.some((r) => Math.hypot(r.x - q.x, r.z - q.z) < 0.05);
  ok(pasa(P.salida) && pasa(P.cruce) && pasa(P.pie) && pasa(P.puerta) && pasa(P.zaguan), 'de la estación al taller: salida, cruce, escalerita, puerta y zaguán');
  ok(G.largoRecorrido(E2.adentro, P.ruedas) < 60, `y corto (${G.largoRecorrido(E2.adentro, P.ruedas).toFixed(1)} m)`);
  ok(G.edificioEn(P.banco.x, P.banco.z) === 'taller-tren' && G.edificioEn(P.trabajo.x, P.trabajo.z) === null, 'el taller es un edificio cerrado de la aldea');
  ok(G.distanciaAldea(marco.aMundo(E.x, E.z - 3.6).x, marco.aMundo(E.x, E.z - 3.6).z) < 1, 'el taller entra en la aldea (el mapa, la gente)');
  const mapa = A.planoAldeaMapa().edificios.find((e) => e.id === 'taller-tren');
  ok(mapa && mapa.tipo === 'edificio', 'en el mapa de la aldea');
  ok(!A.zonasAldea().some((z) => z.id === 'taller-tren'), 'no se empareja (se apoya en su zócalo)');
}

// ============================================================ 7. la arquitectura (VM con el three local)
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
function cargarVM(mods) {
  const info = new Map(), orden = [], visto = new Set();
  const visitar = (f) => {
    f = path.resolve(f); if (visto.has(f)) return; visto.add(f);
    const texto = fs.readFileSync(f, 'utf8');
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
    info.set(f, texto); orden.push(f);
  };
  for (const m of mods) visitar(path.join(src, m));
  const transformar = (f, t) => {
    const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, nn, spec) =>
      `const { ${nn.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); }).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
    t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
    return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += '\n;globalThis.M = {' + orden.map((f) => `'${path.basename(f)}': ${idModulo(f)}`).join(',') + '};\n';
  const noop = () => {};
  const fake = new Proxy({ measureText(t) { return { width: String(t).length * 20 }; }, createLinearGradient() { return { addColorStop: noop }; }, createRadialGradient() { return { addColorStop: noop }; } }, { get(t, p) { if (p in t) return t[p]; return noop; }, set(t, p, v) { t[p] = v; return true; } });
  const ctx = { console, Math, Date, JSON, Float32Array, Float64Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Error, Promise, structuredClone, setTimeout, clearTimeout,
    performance: { now: () => performance.now() }, document: { createElement(tag) { if (tag === 'canvas') return { width: 1, height: 1, getContext: () => fake, style: {} }; return { style: {} }; } } };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { timeout: 240000 });
  return ctx.M;
}
{
  const MM = cargarVM(['aldea-mundo.js', 'terreno.js', 'colisiones.js']);
  const AR = MM['aldea-arquitectura.js'], AM = MM['aldea-mundo.js'], COL = MM['colisiones.js'];
  const Tv = MM['terreno.js'].generarTerreno();
  const op = AM.opcionesTaller(Tv);
  ok(op.suelo && op.suelo.h.length === op.suelo.nx * op.suelo.nz && op.suelo.h.every(Number.isFinite), 'el terreno para el Worker: una grilla de alturas');
  // el desvío: arranca sobre la vía principal y termina en el portón, a la altura del piso
  const d0 = op.desvio[0], d1 = op.desvio[op.desvio.length - 1];
  const w0 = marco.aMundo(E.x + d0[0], E.z + d0[2]);
  ok(distRiel(w0.x, w0.z) < 0.3 && Math.abs(d0[1] + E.y - T.riel[A.PARADA_ALDEA.indice].h) < 0.6, 'el desvío sale de la vía principal');
  ok(Math.abs(d1[0] + 8.5) < 1e-6 && Math.abs(d1[2]) < 1e-6 && Math.abs(d1[1] - 0.3) < 0.02, 'y entra por el portón, a la altura del piso');
  let maxPend = 0;
  for (let i = 1; i < op.desvio.length; i++) { const a = op.desvio[i - 1], b = op.desvio[i]; maxPend = Math.max(maxPend, Math.abs(b[1] - a[1]) / Math.hypot(b[0] - a[0], b[2] - a[2])); }
  ok(maxPend < 0.04, `el desvío, casi a nivel (pendiente máxima ${(maxPend * 100).toFixed(1)} %)`);
  for (const p of op.desvio.filter((q) => q[0] > -20)) { const w = marco.aMundo(E.x + p[0], E.z + p[2]); ok(distRiel(w.x, w.z) > 1.4 || Math.abs(p[2] - d0[2]) < 1, 'el desvío no se encima con la principal una vez que se separa'); }
  ok(Math.abs(op.cruce.y + E.y - (T.riel[A.PARADA_ALDEA.indice].h)) < 2, 'el cruce, a la altura de los rieles');
  const PT = A.PUNTOS_TALLER;
  const cpos = PT.cruce, wcr = marco.aMundo(E.x + cpos[0], E.z + op.cruce.z);
  ok(distRiel(wcr.x, wcr.z) < 0.3, 'los tablones del cruce, sobre la vía');
  ok(Math.abs(op.cruce.z - cpos[1]) < 0.3, 'donde lo dice el plano');
  const validos = new Set(Object.values(AR.SUPERFICIES_ALDEA).flatMap((v) => [v, v + AR.SUPERFICIES_ALDEA.adentro]));
  for (const etapa of [3, 4]) {
    const ed = AR.armarEdificio('taller-tren', etapa, op);
    const que = etapa === 4 ? 'arreglado' : 'viejo';
    ok(ed.extra.taller.arreglado === (etapa === 4), `${que}: la etapa`);
    ok(ed.medidas.dibujos.exterior <= 3 && ed.medidas.dibujos.interior <= 2, `${que}: dibujos ${ed.medidas.dibujos.exterior}+${ed.medidas.dibujos.interior}`);
    ok(ed.medidas.triangulos.exterior <= 9000 && ed.medidas.triangulos.interior <= 7000, `${que}: triángulos ${ed.medidas.triangulos.exterior}+${ed.medidas.triangulos.interior}`);
    for (const [capa, k] of [['exterior', 'estructura'], ['interior', 'muebles']]) {
      const g = ed[capa][k];
      ok(g && g.attributes.aSuperficie && g.attributes.aLocal && g.attributes.aSuperficie.count === g.attributes.position.count, `${que}: ${k} con aSuperficie y aLocal`);
      ok([...new Set(g.attributes.aSuperficie.array)].every((v) => validos.has(v)), `${que}: ${k}: superficies conocidas`);
      ok([...new Set(g.attributes.aTipo.array)].every((v) => v === 0 || v === 4), `${que}: ${k}: tipo 0 o 4`);
    }
    ok(new Set(ed.exterior.estructura.attributes.aSuperficie.array).size >= 5, `${que}: piedra, chapa, tablas, cemento, laja`);
    ok(ed.puertas.length === 1 && ed.puertas[0].nombre === 'la puerta del taller' && Math.abs(ed.puertas[0].lx - 3) < 1e-9, `${que}: la puerta chica para puertas.js`);
    ok(ed.colisiones.obstaculos.length > 30 && ed.colisiones.plataformas.length > 20, `${que}: colisiones (${ed.colisiones.obstaculos.length} y ${ed.colisiones.plataformas.length} pisos)`);
    ok(etapa === 4 ? ed.carteles.some((c) => c.texto === 'Taller Ferroviario') : !ed.carteles.length, `${que}: el cartel, sólo arreglado`);
    ok(ed.luces.some((l) => l.cuarto === 'local' && l.clase === 'interior') && ed.luces.some((l) => l.cuarto === 'vivienda'), `${que}: la luz del galpón y la del cuarto`);
    ok(ed.extra.taller.hondoFoso >= 0.6 && ed.extra.taller.hondoFoso <= 1.1, `${que}: el foso de ${ed.extra.taller.hondoFoso} m`);
    ok(ed.techo && ed.techo.cubiertas?.length === 1, `${que}: bajo techo (sin lluvia adentro)`);
    // los puntos de la arquitectura, donde los dice el plano
    for (const k of ['banco', 'fragua', 'ruedas', 'adentro', 'cama', 'trabajo', 'puerta']) {
      const q = ed.puntos.nombrados[k];
      ok(q && Math.hypot(q.lx - PT[k][0], q.lz - PT[k][1]) < 0.05, `${que}: el punto ${k} (${q?.lx}, ${q?.lz}) es el del plano`);
    }
    // colisiones de verdad: en el sitio, con el mundo de colisiones.js
    {
      const col = COL.crearColisiones();
      AR.registrarEnMundo({ col }, ed, { x: 0, y: 0, z: 0, rot: 0 }, { duenio: 'prueba' });
      const pie = (x, z, y) => col.plataformaEn(x, z, y)?.alto ?? null;
      ok(Math.abs(pie(-3, 2, 0.4) - 0.32) < 0.02, `${que}: el piso de cemento se pisa`);
      ok(pie(-1, 0, -0.3) < -0.2, `${que}: el foso es hondo`);
      ok(Math.abs(pie(1.35, 0, 0.4) - 0.37) < 0.03, `${que}: la pasarela cruza el foso`);
      ok(Math.abs(pie(7, 0, 0.4) - 0.35) < 0.02, `${que}: el piso de tablas del cuarto`);
      ok(Math.abs(pie(3, 4.0, 0.4) - 0.32) < 0.02, `${que}: el descanso de la puerta`);
      // las paredes: segmentos de choque (con la puerta, el paso del tabique y el portón abiertos)
      const pared = (x, z, y = 1.2) => ed.colisiones.obstaculos.some((o) => {
        if (!o.seg || y < o.alturaMin || y > o.alturaMax) return false;
        const vx = o.bx - o.ax, vz = o.bz - o.az, l2 = vx * vx + vz * vz, k = Math.max(0, Math.min(1, ((x - o.ax) * vx + (z - o.az) * vz) / l2));
        return Math.hypot(x - o.ax - vx * k, z - o.az - vz * k) < o.r + 0.02;
      });
      ok(pared(-3, 3.6) && pared(6, -3.6) && pared(8.5, 1) && !pared(3, 3.6), `${que}: las paredes frenan; por la puerta chica se pasa`);
      ok(pared(5.4, -1) && !pared(5.4, 2.05), `${que}: el tabique, con su paso`);
      ok(!pared(-8.5, 0) && pared(-8.5, 2.5), `${que}: el portón, abierto`);
    }
  }
  // las líneas de la gente adentro: la del zaguán al banco cruza el foso por la pasarela; las del zaguán a la mesa y a
  // la cama pasan por la puerta del tabique
  const TT = AR.TALLER_TREN, zg = PT.zaguan;
  const cruzaZ = (a, b, x) => a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
  const xFoso = zg[0] + (PT.banco[0] - zg[0]) * (zg[1] - 0) / (zg[1] - PT.banco[1]);
  ok(xFoso > TT.pasarela.x0 + 0.15 && xFoso < TT.pasarela.x1 - 0.15, `del zaguán al banco, por la pasarela (x ${xFoso.toFixed(2)})`);
  for (const k of ['adentro', 'cama']) { const z = cruzaZ(zg, PT[k], TT.tabique); ok(z > TT.paso.z0 + 0.1 && z < TT.paso.z1 - 0.1, `del zaguán a ${k}, por la puerta del tabique (z ${z.toFixed(2)})`); }
  const xFr = zg[0] + (PT.fragua[0] - zg[0]) * (zg[1] - 0) / (zg[1] - PT.fragua[1]);
  ok(xFr > TT.foso.x1, 'del zaguán a la fragua, pasando la punta del foso');
  ok(PT.ruedas[1] > TT.foso.medio + 0.5, 'a las ruedas, sin cruzar el foso');
  ok(AM.manzanaDe('taller-tren') === 'taller' && AM.IDS_MUNDO_ALDEA.includes('taller-tren'), 'aldea-mundo: su propio complejo');
  ok(AM.etapaTaller(null).etapa === 3 && AM.etapaTaller({ taller: { arreglado: true } }).etapa === 4, 'aldea-mundo: viejo hasta la primera mejora');
  ok(!AM.planDesniveles().some((d) => d.a === 'taller-tren' || d.b === 'taller-tren'), 'sin muretes con el taller');
  ok(!AM.planAccesorios().some((a) => A.dentroDePlanta('taller-tren', a.lx, a.lz, -0.5)), 'ningún accesorio adentro del taller');
  ok(AR.CARTELES_ALDEA.length <= (AR.ATLAS_CARTELES.alto / AR.ATLAS_CARTELES.celdaAlto) * AR.ATLAS_CARTELES.columnas, 'el atlas de carteles alcanza');
}

// ============================================================ 8. Martín y Ernesto
{
  const m = A.VECINOS_ALDEA.martin;
  ok(m && m.casa === 'taller-tren' && m.trabajo === 'taller-tren' && /maquinista/.test(m.oficio) && m.charla.length >= 3, 'Martín: el maquinista retirado, vive y trabaja en el taller');
  ok(A.ORDEN_VECINOS_ALDEA.includes('martin') && A.ORDEN_PERSONAS_ALDEA[A.ORDEN_PERSONAS_ALDEA.length - 1] === 'martin' && A.ORDEN_PERSONAS_ALDEA.indexOf('ercilia') === 8, 'Martín, al final (los índices de los demás no se mueven)');
  ok(A.cumpleDe('martin') >= 1 && A.cumpleDe('martin') <= 12, 'su cumpleaños');
  const r = (h, ds = 1) => { const x = A.rutinaAldea('martin', h, ds, A.aldeaNueva()); return `${x.edificio}/${x.punto}`; };
  eq([7, 9, 10.6, 13, 14.6, 17.5, 23].map((h) => r(h)), ['taller-tren/adentro', 'taller-tren/banco', 'taller-tren/fragua', 'taller-tren/adentro', 'taller-tren/fragua', 'taller-tren/trabajo', 'taller-tren/cama'], 'el día de Martín');
  const conObra = A.aldeaNueva(); Object.defineProperty(conObra, 'tallerArmando', { value: true, enumerable: false });
  ok(A.rutinaAldea('jefe', 15, 1, conObra).punto === 'ruedas' && A.rutinaAldea('jefe', 15, 1, A.aldeaNueva()).edificio === 'estacion-aldea', 'Ernesto va al taller a la tarde mientras se arma una mejora');
  ok(!JSON.stringify(A.aldeaNueva()).includes('tallerArmando'), 'eso no se guarda');
  ok(G.poseDe({ lugar: 'trabajo', edificio: 'taller-tren', punto: 'banco' }) === 'limar' && G.poseDe({ lugar: 'trabajo', edificio: 'taller-tren', punto: 'fragua' }) === 'martillar' && G.poseDe({ lugar: 'trabajo', edificio: 'taller-tren', punto: 'ruedas' }) === 'llave', 'las poses de trabajo: limar, martillar y la llave');
  const gente = leer('src/gente.js');
  ok(/case 'limar': \{/.test(gente) && /case 'llave': \{/.test(gente) && /'limar', 'llave'\]\);/.test(gente), 'gente.js: las dos poses, con las manos ocupadas');
  // el aspecto (estilo P): mameluco azul, gorra, bigote blanco
  const as = RO.ASPECTO['aldea-martin'];
  ok(as && as.R?.pechera && /^#3/.test(as.R.pechera) && as.colores?.gorro && as.R?.bigote && as.edad >= 65, 'Martín: mameluco azul, gorra y bigote blanco');
  ok(VE.esPersonaVecindad('martin') && VE.PERFILES_VECINOS.martin.amigos.includes('jefe'), 'Martín en la vecindad, amigo de Ernesto');
  const voces = JSON.stringify([VZ.VOCES.martin, VZ.AYUDAS.martin, A.VECINOS_ALDEA.martin, A.CHARLAS_ALDEA.filter((c) => c.lineas.some(([k]) => k === 'martin'))]);
  ok(voces.length > 4000 && /Trochita/.test(voces) && /El Maitén/.test(voces) && /Esquel/.test(voces) && /setenta y cinco|75 cm/.test(voces) && /Baldwin/.test(voces), 'mucho texto sobre La Trochita real');
  ok(!RELIGIOSO.test(voces), 'nada religioso en lo de Martín');
  ok(A.CHARLAS_ALDEA.filter((c) => c.lineas.some(([k]) => k === 'martin')).length >= 3, 'charlas de Martín con los vecinos');
}

// ============================================================ 9. el panel (con un contexto de mentira) y el calendario
{
  const P = { dia: 4, horas: 10, materiales: { tabla: 30, tronco: 10, piedra: 30 }, aldea: A.aldeaNueva() };
  const notas = [], aplicados = [];
  let guardado = 0;
  const J = TJ.crearTallerJuego({
    progreso: () => P, desafio: () => false, materiales: () => ({ ...P.materiales }), conMateriales: (fn) => fn(P.materiales),
    nota: (t, s) => notas.push(`${t} · ${s}`), guardar: () => { guardado++; }, refrescarBarra() {}, sonido: () => null,
    pedirTexto: async () => 'La Andina', aplicarMejoras: (t) => aplicados.push(JSON.stringify(t.loco)),
  });
  const adentro = (x, z) => { const w = marco.aMundo(E.x + x, E.z + z); return { pos: { x: w.x, y: E.y + 0.32, z: w.z } }; };
  ok(J.accion(adentro(-2, 0.8))?.texto === 'Ver las mejoras del tren', 'en el galpón, E: las mejoras');
  ok(J.accion(adentro(7, 0)) === null && J.accion(adentro(3, 3)) === null && J.accion({ pos: { ...adentro(-2, 0.8).pos, y: E.y + 6 } }) === null, 'en el cuarto de Martín, junto a la puerta o en el techo, no');
  ok(J.accion({ pos: marco.aMundo(0, 30) }) === null, 'afuera, no');
  J.actualizar(2);
  ok(aplicados.length === 1, 'al arrancar, el tren se entera de cómo está (aplicarMejoras)');
  J.accion(adentro(-2, 0.8)).hacer();
  let e = J.estado();
  ok(e.vista === 'principal' && e.opciones.some((o) => o.texto === 'Caldera: tubos nuevos' && o.puede) && !e.opciones.some((o) => o.texto === 'Caldera: recalentador'), 'se ofrecen las que se pueden pedir');
  ok(e.opciones.some((o) => o.texto === 'La pintura') && e.opciones.some((o) => o.texto === 'El nombre') && e.opciones.some((o) => o.texto === 'La composición') && /galpón/.test(e.dicho), 'pintura, nombre y composición; Martín habla del galpón viejo');
  const i = e.opciones.findIndex((o) => o.texto === 'Caldera: tubos nuevos');
  J.elegirPanel(i);
  e = J.estado();
  ok(e.tren.taller.pedido?.id === 'caldera-1' && e.opciones[0].texto === 'Llevar lo que tengo' && /Aportado: 0 de 10 tablas, 0 de 12 piedras/.test(e.dicho), `pedida: el panel dice lo que pide y lo aportado (${e.dicho})`);
  J.elegirPanel(0);
  e = J.estado();
  ok(e.tren.taller.pedido.aportado.tabla === 10 && P.materiales.tabla === 20 && P.materiales.piedra === 18 && /Piezas de hierro: 0 de 4/.test(e.dicho), 'llevar lo que tengo: se descuenta de tus materiales');
  ok(TJ.textoAvisoTaller(e.tren) === 'Taller: caldera: tubos nuevos (esperando el hierro)' && J.accion(adentro(-2, 0.8)).texto === TJ.textoAvisoTaller(e.tren), 'el aviso y E dicen lo mismo');
  // duerme hasta que esté lista (sin herrería: una pieza por día con el tren)
  P.dia = 9; P.horas = 8; J.actualizar(2);
  ok(J.tren().loco.caldera === 1 && J.tren().taller.arreglado && notas.some((x) => /Caldera: tubos nuevos, lista/.test(x)) && aplicados.length >= 2, 'dormido: lista, anunciada y aplicada al tren');
  ok(P.aldea.tallerArmando === false, 'y Ernesto ya no va');
  // la pintura y la composición, dentro del panel
  const ip = J.estado().opciones.findIndex((o) => o.texto === 'La pintura');
  J.elegirPanel(ip);
  ok(J.estado().vista === 'pintura' && J.estado().opciones.length === 4, 'la pintura: tres partes y volver');
  J.elegirPanel(0);
  ok(J.tren().loco.pintura.cuerpo === '#2e3133', 'el cuerpo, al color que sigue (de la de siempre al negro humo)');
  ok(J.atras() && J.estado().vista === 'principal', 'Escape vuelve al panel');
  await J.estado().opciones.find((o) => o.texto === 'El nombre') && J.elegirPanel(J.estado().opciones.findIndex((o) => o.texto === 'El nombre'));
  await new Promise((ok2) => setTimeout(ok2, 10));
  ok(J.tren().loco.nombre === 'La Andina', 'el nombre, con el cuadro de texto');
  J.elegirPanel(J.estado().opciones.findIndex((o) => o.texto === 'La composición'));
  ok(J.estado().vista === 'composicion' && J.estado().opciones.length === 1 && J.estado().opciones[0].texto === 'Volver', 'la composición: sin vagones nuevos, nada que enganchar');
  ok(J.atras() && J.atras() && !J.panelAbierto(), 'Escape: al panel y afuera');
  // el calendario
  TM.pedirMejora(P.tren, 'farol', 9, 9); TM.aportarMejora(P.tren, { tabla: 5 }, 9, 9);
  TM.avanzarTaller(P.tren, 10, 12);
  const ev = TM.eventosTaller(P.tren);
  ok(ev.length === 1 && ev[0].dia === Math.floor(P.tren.taller.pedido.listo / 24) && ev[0].dia === 11 && ev[0].tipo === 'taller', 'el calendario: el día que queda lista');
  const dEv = Math.floor(P.tren.taller.pedido.listo / 24);
  ok(AV.eventosDelDia(dEv, { aldea: P.aldea, extras: ev }).some((x) => x.tipo === 'taller' && /farol/i.test(x.texto)), 'en el calendario del cuaderno');
  ok(leer('src/aldea-gente.js').includes('extras: eventosTaller(tren)'), 'aldea-gente.js: el calendario con lo del taller');
}

// ============================================================ 10. los enganches de main.js y la plantilla
{
  const m = leer('src/main.js');
  const iE = m.indexOf("case 'KeyE': {"), tecla = m.slice(iE, m.indexOf('case \'KeyI\':', iE));
  ok(tecla.indexOf('granjaJuego.accion(js)') < tecla.indexOf('tallerTren.accion(js)') && tecla.indexOf('tallerTren.accion(js)') < tecla.indexOf('ovejaCercana) { esquilarOveja'), 'la tecla E: el taller después de la granja y antes que la oveja');
  const iA = m.indexOf('let aviso = objetivo ?'), av = m.slice(iA, iA + 12000);
  ok(av.indexOf('cacheGranja.texto') < av.indexOf('cacheTaller.texto') && av.indexOf('cacheTaller.texto') < av.indexOf('textoOveja('), 'el aviso: en el mismo orden');
  ok(m.includes("cacheTaller = tallerTren ? tallerTren.accion(js) : null;") && m.includes("if (tallerTren?.panelAbierto()) return { id: 'taller-tren', ...tallerTren.lista() };"), 'la misma función y la lista del HUD (teclado, mouse y mando)');
  ok(m.includes('alClic: (el, fn) => alClicHud(el, fn)') && m.includes("alAbrirPanel: () => { marcarEn('taller-tren', 0); marcarHud(0, true); }"), 'el clic y la marca, como en las listas del HUD');
  ok((m.match(/tallerTren\.elegirPanel\(Number\(codigo\.slice\(5\)\) - 1\)/g) || []).length === 2 && m.includes('else if (tallerTren?.panelAbierto()) tallerTren.atras();'), 'los números y Escape');
  ok(m.includes("aplicarMejoras: (estado) => aplicarMejoras(estado),") && m.includes("import { armarTren, aplicarMejoras } from './tren.js';") && m.includes('dialogos.pedirTexto(texto, inicial, extra)'), 'el enganche con el tren y el cuadro de texto');
  ok(m.includes("tallerTren?.actualizar(dt); } catch (e) { fallaSistema('taller', e); }"), 'el reloj del taller, aislado');
  ok(leer('src/plantilla.html').includes('<div class="trueque oculto" id="taller-tren-panel">'), 'el panel en la plantilla');
}

console.log(`OK 3.7.3 taller · ${n} verificaciones`);
