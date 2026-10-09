// 3.8.3 (relax): el pase de bugs del Relax base antes de Steam. Una comprobación por arreglo.
// 1. La barra de la mochila: lo que elegís para la casilla N va en la casilla N (antes se corría al principio).
// 2. La historia, capítulo 8 («La noche del temporal»): con los cuatro cuentos ya oídos no se trababa para siempre, y un
//    temporal al azar de antes no tilda el final (ni se saltea la noche del temporal).
// 3. La tecla E y el aviso: en la carpa o en tu casa, de noche, mirando algo (una ramita), E hace eso y no te duerme.
// 4. Con doce ramitas, la que mirás se queda en el suelo (antes se borraba del valle sin sumar).
// 5. Desarmar una obra devuelve lo que tenía adentro: lo colgado en el tendal, las macetas del vivero, los huevos del
//    nidal y la cosecha lista del cantero (antes se perdían; también en el desalojo de la aldea).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import * as H from '../src/historia.js';
import { CUENTOS } from '../src/cuentos.js';
import * as Conservas from '../src/conservas.js';
import * as Vivero from '../src/vivero.js';
import * as Gallinero from '../src/gallinero.js';
import * as Huerta from '../src/huerta.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const main = leer('src/main.js');
ok(!main.includes('\r'), 'main.js: fines de línea LF');
// Saca un trozo de main.js entre dos marcas (incluidas)
const trozo = (desde, hasta) => {
  const i = main.indexOf(desde);
  ok(i >= 0, `main.js tiene «${desde}»`);
  const j = main.indexOf(hasta, i);
  ok(j > i, `main.js tiene «${hasta}» después`);
  return main.slice(i, j + hasta.length);
};

// ---------------------------------------------------------------- 1. la barra de la mochila
{
  const codigo = trozo('const tomadas = new Set();', '\n  return salida;\n}');
  const asignar = trozo('function asignarRanura(id) {', '\n}');
  const ctx = { progreso: { barra: [] }, elegida: 0, guardar() {}, refrescarBarra() {}, nota() {} };
  vm.createContext(ctx);
  vm.runInContext(`${codigo}\n${asignar.replace(/function asignarRanura/, 'function asignarRanuraEn')}\nthis.ordenarBarra = ordenarBarra; this.asignarRanuraEn = asignarRanuraEn;`, ctx);
  const cosas = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({ id }));
  const ids = () => ctx.ordenarBarra(cosas).map((r) => r.id).join('');
  ok(ids() === 'abcdefg', 'sin nada elegido, la mochila en su orden');
  ctx.elegida = 4; ctx.asignarRanuraEn('f');
  ok(ids() === 'abcdfeg', `la «f» puesta en la casilla 5 queda en la 5 (${ids()})`);
  ctx.elegida = 0; ctx.asignarRanuraEn('g');
  ok(ids().indexOf('g') === 0 && ids().indexOf('f') === 4, `la «g» en la 1 y la «f» sigue en la 5 (${ids()})`);
  ctx.elegida = 2; ctx.asignarRanuraEn('f');
  ok(ids().indexOf('f') === 2 && ids().indexOf('g') === 0, `mover la «f» a la 3 (${ids()})`);
  ok(ids().length === cosas.length && new Set(ids()).size === cosas.length, 'no se pierde ni se repite nada');
  // lo elegido que ya no está en la mochila deja su casilla al resto; con ids repetidos va el último, como antes
  ctx.progreso.barra = [null, 'zz', 'c'];
  ok(ids() === 'abcdefg', `una casilla de algo que ya no tenés la ocupa el siguiente (${ids()})`);
  const repetidas = [{ id: 'x', n: 1 }, { id: 'y' }, { id: 'x', n: 2 }];
  ctx.progreso.barra = ['x'];
  const r = ctx.ordenarBarra(repetidas);
  ok(r.length === 2 && r[0].n === 2 && r[1].id === 'y', 'con ids repetidos, de cada id elegido va el último (como en la 2.7.3)');
}

// ---------------------------------------------------------------- 2. la historia: el capítulo 8
{
  // una partida que ya escuchó los cuatro cuentos y pasó un temporal al azar el día 5
  const p = (dia, visitas, temporal = 5) => ({ dia, entradas: Object.fromEntries(CUENTOS.map((c) => [c.id, { dia: 3, hora: 21, cantidad: 0 }])), visitas: { cuenta: visitas }, eventosValle: { hechos: { temporal: { dia: temporal, opcion: 'lena' } } } });
  const h = H.historiaNueva(); H.empezarHistoria(h, 1); h.capitulo = 7; h.fase = 'intro';
  ok(H.capituloActual(h).id === 'temporal', 'el capítulo 8 es el del temporal');
  H.arrancarCapitulo(h, H.estadoHistoria(p(20, 9)));
  let r = H.revisarHistoria(h, H.estadoHistoria(p(20, 9)));
  ok(!r.nuevos.some((o) => o.id === 'temporal'), 'el temporal al azar del día 5 no tilda el del capítulo');
  ok(H.momentoPendiente(h, H.estadoHistoria(p(20, 9))) === null, 'el temporal espera a la visita');
  r = H.revisarHistoria(h, H.estadoHistoria(p(21, 10)));
  ok(r.nuevos.some((o) => o.id === 'visita') && r.nuevos.some((o) => o.id === 'cuento'), `con los cuatro cuentos ya oídos, la visita alcanza (${r.nuevos.map((o) => o.id)})`);
  ok(H.momentoPendiente(h, H.estadoHistoria(p(21, 10))) === 'temporal', 'y llega la noche del temporal (antes no llegaba: ya había pasado uno)');
  H.momentoLanzado(h);
  r = H.revisarHistoria(h, H.estadoHistoria(p(21, 10, 21)));
  ok(r.completo, 'pasar el temporal del capítulo termina la historia');
  // con un cuento por contar todavía, hace falta el cuento (como siempre)
  const g = H.historiaNueva(); H.empezarHistoria(g, 1); g.capitulo = 7; g.fase = 'intro';
  const q = (dia, visitas) => { const x = p(dia, visitas); delete x.entradas[CUENTOS[0].id]; return x; };
  H.arrancarCapitulo(g, H.estadoHistoria(q(20, 9)));
  r = H.revisarHistoria(g, H.estadoHistoria(q(21, 10)));
  ok(r.nuevos.some((o) => o.id === 'visita') && !r.nuevos.some((o) => o.id === 'cuento'), 'con un cuento por contar, la visita sola no alcanza');
  // el momento lanzado y perdido se vuelve a pedir mirando su objetivo (no si pasó alguna vez)
  const ui = leer('src/historia-ui.js');
  ok(!ui.includes('!s.eventos.has(def.evento)') && ui.includes("o.delMomento && h.hechos[`${capituloActual(h).id}:${o.id}`] !== undefined"), 'historia-ui.js: el momento perdido se repide según su objetivo');
}

// ---------------------------------------------------------------- 3. E y el aviso: dormir en la carpa o en la casa
{
  const e = trozo("case 'KeyE': {", "    case 'Tab':");
  ok(e.includes("if (!objetivo && enLaCarpa() && puedeDormirJuntoAlFuego()) { diario.anotar('carpa'); dormir(); break; }"), 'tecla E: la carpa duerme sólo sin nada mirado');
  ok(e.includes('if (!objetivo && obras && obras.dentro(js.pos) && puedeDormirJuntoAlFuego()) { dormir(); break; }'), 'tecla E: tu casa duerme sólo sin nada mirado');
  // el aviso: lo mirado (objetivo) gana y la carpa y la casa van con !aviso
  ok(main.includes("let aviso = objetivo ? { tecla: 'E', texto: objetivo.texto } : null;") && main.includes("if (!aviso && enLaCarpa() && puedeDormirJuntoAlFuego()) aviso = { tecla: 'E', texto: 'Dormir en la carpa' };") && main.includes('if (!aviso && obras && obras.dentro(js.pos) && puedeDormirJuntoAlFuego()) {'), 'el aviso: lo mirado antes que dormir (como la tecla E)');
}

// ---------------------------------------------------------------- 4. las ramitas llenas
{
  const obj = leer('src/objetos.js');
  const i = obj.indexOf("if (obj.it.tipo === 'ramita' && progreso.ramitas >= 12) return { ramita: true, llena: true };"), j = obj.indexOf('if (!quitar(obj.it)) return null;', i);
  ok(i > 0 && j > i && j - i < 120, 'objetos.js: con doce ramitas no se quita la del suelo (se mira antes de quitar)');
  ok(obj.includes('progreso.ramitas = Math.min(12, progreso.ramitas + 1)'), 'y el tope sigue en doce');
  const e = trozo("case 'KeyE': {", "    case 'Tab':");
  ok(e.includes("if (r?.llena) nota('No te entran más ramitas'") && e.includes('if (r && !r.llena) destellarRanura('), 'tecla E: con las ramitas llenas lo dice y no destella la casilla');
}

// ---------------------------------------------------------------- 5. desarmar devuelve lo de adentro
{
  const codigo = trozo('function devolverContenido(d) {', '\n  refrescarBarra(true);\n}');
  const entradas = {};
  const progreso = { dia: 20, entradas, cosas: {}, huerta: {}, gallineros: {}, cosechasTotal: 3 };
  const ctx = {
    progreso, ...Conservas, ...Vivero, ...Gallinero, ...Huerta,
    sumarEntrada: (id, n) => { entradas[id] = { cantidad: (entradas[id]?.cantidad || 0) + n }; },
    sumarMaterial() {}, refrescarBarra() {}, huerta: () => progreso.huerta, gallineros: () => progreso.gallineros,
    sanearLenera: (x) => x, sanearAserradero: (x) => x, sanearMuela: (x) => x, sanearColmena: (x) => x, sanearAhumadero: (x) => x,
  };
  vm.createContext(ctx);
  vm.runInContext(`${codigo}\nthis.devolver = devolverContenido;`, ctx);
  const cuanto = (id) => entradas[id]?.cantidad || 0;
  ctx.devolver({ plano: 'tendal', x: 0, z: 0, tendal: { colgado: 'calafate-seco', horas: 3 } });
  ok(cuanto('calafate') === 5, `el tendal a medio secar devuelve los cinco calafates (${cuanto('calafate')})`);
  ctx.devolver({ plano: 'tendal', x: 0, z: 0, tendal: { colgado: 'hongos-secos', horas: Conservas.HORAS_SECADO } });
  ok(cuanto('hongos-secos') === 1, 'el tendal con lo seco devuelve el atado seco');
  ctx.devolver({ plano: 'vivero', x: 0, z: 0, vivero: { macetas: [{ especie: 'coihue', dia: 19 }, { especie: 'lenga', dia: 20 - Vivero.VIVERO.diasPlantin }] } });
  ok(cuanto('semilla-coihue') === 1 && cuanto('plantin-lenga') === 1, 'el vivero devuelve la semilla (o el plantín, si ya estaba)');
  progreso.gallineros['10:10'] = Gallinero.gallineroNuevo(18);
  const huevos = Gallinero.huevosEnNidal(progreso.gallineros['10:10'], 20);
  ctx.devolver({ plano: 'gallinero', x: 10, z: 10 });
  ok(huevos > 0 && cuanto('huevo') === huevos, `el gallinero devuelve los huevos del nidal (${cuanto('huevo')} de ${huevos})`);
  Huerta.sembrar(progreso.huerta, '5:5', 'habas', 1);
  ctx.devolver({ plano: 'cantero', x: 5, z: 5 });
  ok(cuanto('haba') === Huerta.CULTIVOS.habas.cosecha && !progreso.huerta['5:5'] && progreso.cosechasTotal === 3 + Huerta.CULTIVOS.habas.cosecha, 'el cantero con la cosecha lista la devuelve (y cuenta como cosechada)');
  Huerta.sembrar(progreso.huerta, '6:6', 'habas', 20);
  ctx.devolver({ plano: 'cantero', x: 6, z: 6 });
  ok(cuanto('haba') === Huerta.CULTIVOS.habas.cosecha, 'lo sembrado que no está listo se lo lleva el cantero, como siempre');
  ok(main.includes('devolverContenido(r.datos);') && main.includes('devolverContenido(d); }'), 'se llama al desmontar y en el desalojo');
}

console.log(`verificar-3-8-3-relax: ${pasos} comprobaciones OK`);
