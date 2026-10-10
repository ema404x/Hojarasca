// 3.8.3 (relax): el pase de bugs del Relax base antes de Steam. Una comprobación por arreglo.
// 1. La barra de la mochila: lo que elegís para la casilla N va en la casilla N (antes se corría al principio).
// 2. La historia, capítulo 8 («La noche del temporal»): con los cuatro cuentos ya oídos no se trababa para siempre, y un
//    temporal al azar de antes no tilda el final (ni se saltea la noche del temporal).
// 3. La tecla E y el aviso: en la carpa o en tu casa, de noche, mirando algo (una ramita), E hace eso y no te duerme.
// 4. Con doce ramitas, la que mirás se queda en el suelo (antes se borraba del valle sin sumar).
// 5. Desarmar una obra devuelve lo que tenía adentro: lo colgado en el tendal, las macetas del vivero, los huevos del
//    nidal y la cosecha lista del cantero (antes se perdían; también en el desalojo de la aldea).
// 6. Con los planos, Y sigue la obra a medio hacer más cercana: una terminada al lado ya no traba fundar otra igual.
// 7. «Recibí una visita» (capítulo 8) se tilda con una visita de verdad, no con el turno del que no pudo venir.
// 8. El acopio de la obra cuenta parado en un piso de arriba (el entrepiso, el mirador).
// 9. «Tu casilla de tablas está terminada» (decía «terminado»), y los textos nuevos en inglés.
// 10. Mover un cantero o un gallinero mueve también sus matas y sus gallinas (quedaban en el lugar viejo).
// 11. El nombre que le ponés a una obra (T.lugares, propia) no cuenta como edificio del mundo al construir: trababa
//     mover esa obra cerca de donde estaba y volver a fundar donde la desarmaste (hasta recargar la partida).
// 12. Los fletes tomados hoy se recuerdan todos al cargar (con 40, uno ya entregado se podía volver a tomar y cobrar).
// 13. El tobillo de Nicanor no vuelve encadenado al puente que cedió si ya pasó (recompensa doble).
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
import * as Visitas from '../src/visitas.js';
import * as Comercio from '../src/comercio.js';
import * as EV from '../src/eventos-valle.js';
import { crearTraductor } from '../src/idioma.js';
import { EN } from '../src/idioma-en.js';

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
  ok(main.includes('devolverContenido(r.datos);') && main.includes('devolverContenido(d); '), 'se llama al desmontar y en el desalojo');
}

// ---------------------------------------------------------------- 6. Y sigue la obra a medio hacer, no la terminada
{
  const codigo = trozo('function obraAMedias(plano, pos, radio) {', '\n  return mejor;\n}');
  const mirador = { id: 'mirador', etapas: [{}, {}, {}] }, casilla = { id: 'casilla', etapas: [{}, {}] };
  const lista = [
    { plano: mirador, datos: { x: 2, z: 0, etapas: 3 } },   // terminada, la más cerca
    { plano: mirador, datos: { x: 6, z: 0, etapas: 1 } },   // a medias, más lejos
    { plano: casilla, datos: { x: 1, z: 0, etapas: 0 } },   // otro plano
  ];
  const ctx = { obras: { obrasCerca: (pos, r) => lista.filter((o) => Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z) < r) } };
  vm.createContext(ctx);
  vm.runInContext(`${codigo}\nthis.obraAMedias = obraAMedias;`, ctx);
  ok(ctx.obraAMedias(mirador, { x: 0, z: 0 }, 10) === lista[1], 'Y sigue el mirador a medias aunque haya uno terminado más cerca');
  ok(ctx.obraAMedias(mirador, { x: 0, z: 0 }, 4) === null, 'con sólo uno terminado al lado, Y funda otro (no «Ya está terminada»)');
  ok(ctx.obraAMedias(null, { x: 0, z: 0 }, 10) === null, 'sin plano elegido, nada');
  ok(main.includes('const obra = obras.plano?.pieza ? piezaAMedias(obras.plano, js.pos, 10) : obraAMedias(obras.plano, js.pos, 10);'), 'accionObra (Y) usa la obra a medias');
  ok(main.includes('const obra = p.pieza ? piezaAMedias(p, jugador.estado.pos, 12) : obraAMedias(p, jugador.estado.pos, 12);'), 'y el panel muestra las etapas de esa misma');
}

// ---------------------------------------------------------------- 7. «Recibí una visita»: sólo con una visita de verdad
{
  const v = Visitas.visitasNuevas();
  Visitas.empezarVisita(v, 3); Visitas.terminarVisita(v, 3);
  ok(v.cuenta === 1 && Visitas.recibidas(v) === 1, 'una visita: pasa el turno y cuenta');
  Visitas.saltearTurno(v);
  ok(v.cuenta === 2 && Visitas.recibidas(v) === 1, 'al que le tocaba no pudo venir: pasa el turno, sin contarse');
  ok(Visitas.sanearVisitas(JSON.parse(JSON.stringify(v))).recibidas === 1, 'se guarda y se carga');
  const vieja = Visitas.sanearVisitas({ ultima: 4, cuenta: 5, activa: null });
  ok(!('recibidas' in vieja) && Visitas.recibidas(vieja) === 5, 'una partida vieja arranca de la cuenta (lo contado desde un capítulo no salta)');
  Visitas.saltearTurno(vieja);
  ok(vieja.cuenta === 6 && Visitas.recibidas(vieja) === 5, 'y desde ahí, el turno salteado no cuenta');
  // en la historia: capítulo 8, al que le tocaba no pudo venir
  const prog = { dia: 20, entradas: {}, visitas: Visitas.sanearVisitas({ ultima: 17, cuenta: 9 }) };
  const h = H.historiaNueva(); H.empezarHistoria(h, 1); h.capitulo = 7; h.fase = 'intro';
  H.arrancarCapitulo(h, H.estadoHistoria(prog));
  Visitas.saltearTurno(prog.visitas);
  let r = H.revisarHistoria(h, H.estadoHistoria(prog));
  ok(!r.nuevos.some((o) => o.id === 'visita'), 'capítulo 8: un turno salteado no tilda «Recibí una visita»');
  Visitas.empezarVisita(prog.visitas, 20);
  r = H.revisarHistoria(h, H.estadoHistoria(prog));
  ok(r.nuevos.some((o) => o.id === 'visita'), 'y una visita de verdad, sí');
  ok(main.includes('if (!traerVisita(quienViene(v.cuenta), puesta, true)) { saltearTurno(v); return; }'), 'main.js saltea el turno con saltearTurno');
}

// ---------------------------------------------------------------- 8. el acopio, desde un piso de arriba
{
  const codigo = trozo('const planoAcopio = { x: 0, z: 0 };', "funcionAlAlcance('acopio', radio));\n}");
  const cons = leer('src/construccion.js');
  ok(cons.includes('const py = Number.isFinite(pos?.y) ? pos.y : null;') && cons.includes('if (dy > 1.55) continue;'), 'construccion.js: tieneFuncionCerca descarta lo que está a otra altura (si se le pasa la altura)');
  let visto = null;
  const ctx = { RADIO_ACOPIO_MANO: 3, jugador: { estado: { pos: { x: 4, y: 7.3, z: -2 } } }, obras: { tieneFuncionCerca: (f, pos, r) => { visto = { ...pos }; return f === 'acopio' && r === 18; } }, funcionAlAlcance: () => 'mano' };
  vm.createContext(ctx);
  vm.runInContext(`${codigo}\nthis.hayAcopioCerca = hayAcopioCerca;`, ctx);
  ok(ctx.hayAcopioCerca(18) === true && visto && visto.x === 4 && visto.z === -2 && !('y' in visto), 'el acopio de la obra se busca sin la altura (cuenta desde el entrepiso)');
  ok(ctx.hayAcopioCerca(2) === true, 'el de la mano sigue igual (funcionAlAlcance)');
}

// ---------------------------------------------------------------- 9. los textos nuevos, bien dichos y en inglés
{
  ok(main.includes("está ${/a$/i.test(obra.plano.nombre.split(' ')[0]) ? 'terminada' : 'terminado'}"), 'la obra terminada concuerda: «Tu casilla de tablas está terminada»');
  const traductor = crearTraductor(EN, 'en'), tr = (x) => traductor.t(x);
  ok(tr('Tu casilla de tablas está terminada') === 'Your casilla de tablas is finished' || /^Your .* is finished$/.test(tr('Tu casilla de tablas está terminada')), `en inglés, la casilla también (${tr('Tu casilla de tablas está terminada')})`);
  ok(tr('No te entran más ramitas') === 'No room for more twigs' && /^You already carry 12/.test(tr('Ya llevás 12: la dejaste en el suelo')), 'la nota de las ramitas llenas, en inglés');
}

// ---------------------------------------------------------------- 10. mover el cantero o el gallinero
{
  const a = trozo('function accionObra() {', '    dibujarPanelObra();\n    return;\n  }');
  const i = a.indexOf('if (movida) mudarDatosDeObra(movida, x0, z0);'), j = a.indexOf("if (movida?.plano.id === 'cantero') refrescarHuerta();"), k = a.indexOf("else if (movida?.plano.id === 'gallinero') refrescarGallineros();");
  ok(i > 0 && j > i && k > j, 'al confirmar el movimiento, la huerta y las gallinas se rehacen después de mudar sus datos');
}

// ---------------------------------------------------------------- 11. el nombre de una obra no traba construir
{
  const cons = leer('src/construccion.js');
  ok(!cons.includes("if (!l || typeof l.x !== 'number') continue;") && cons.split("if (!l || typeof l.x !== 'number' || l.propia) continue;").length === 3, 'construccion.js: los dos recorridos de T.lugares saltean el nombre de una obra tuya');
  ok(main.includes('nombre: obra.datos.nombre, propia: true,'), 'main.js: el nombre de la obra va marcado como propio');
}

// ---------------------------------------------------------------- 12. los fletes tomados hoy sobreviven a guardar y cargar
{
  const tomados = Array.from({ length: 66 }, (_, i) => `7|Parada ${i % 11}|${Math.floor(i / 11)}`);
  const c = Comercio.sanearComercio(JSON.parse(JSON.stringify({ hoy: { dia: 7, vendidos: {}, comprados: {}, tomados }, fletes: [] })));
  ok(c.hoy.tomados.length === 66 && c.hoy.tomados.includes(tomados[65]), `los 66 fletes de un día (6 por parada) se recuerdan al cargar (${c.hoy.tomados.length})`);
}

// ---------------------------------------------------------------- 13. el tobillo de Nicanor, una sola vez
{
  const ev = EV.eventosValleNuevos(() => 0.5);
  ev.hechos.tobillo = { dia: 6, opcion: 'llevar' };
  ev.pendientes.push({ id: 's-puente-caida', dia: 20 });
  const r = EV.cerrarSeguimiento(ev, 's-puente-caida', 20);
  ok(r && !r.cadena && !ev.activo, 'con el tobillo ya curado, el puente que cedió no lo vuelve a traer');
  const ev2 = EV.eventosValleNuevos(() => 0.5); ev2.pendientes.push({ id: 's-puente-caida', dia: 20 });
  ok(EV.cerrarSeguimiento(ev2, 's-puente-caida', 20).cadena?.id === 'tobillo', 'sin tobillo antes, sigue encadenado como siempre');
}

console.log(`verificar-3-8-3-relax: ${pasos} comprobaciones OK`);
