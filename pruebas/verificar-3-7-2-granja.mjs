// 3.7.2 "La cocina", la granja (sin Electron): lo que el jugador produce para cocinar.
//  1. el código: las reglas del proyecto (imports en una línea, sin ñ, LF, nada religioso, el three local, puro donde va
//     puro, sin materiales nuevos en el mundo) y el enganche (main.js con E y el aviso en el mismo orden, la charla, el
//     guardado, el cuaderno, la mochila, las obras);
//  2. la vaca: trueque con Don Ramón (con tambo), leche cada mañana si la ordeñás, el invierno con fardos, un ternero por
//     año que de novillo se carnea (Don Ramón se lo lleva y al otro día trae la carne);
//  3. los corderos (con la paridera, en primavera, mellizos según la semilla) y los chanchos (la batea, las camadas, los
//     capones con su carne y sus chorizos);
//  4. los frutales: plantar, crecer, florecer en primavera, dar fruta en verano u otoño, y en invierno pelados y sin
//     fruta (ni en el árbol ni en el piso; tampoco con el invierno fijo de Ajustes);
//  5. el guardado: una partida vieja arranca con la granja vacía; un guardado roto se sanea (el caos de la 3.5.4);
//  6. el mundo (granja-mundo.js en una máquina virtual con el three local): los modelos y los frutales se arman, los
//     dibujos por especie, y los planos (tipo 0 y 4).
// Uso: node pruebas/verificar-3-7-2-granja.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import * as G from '../src/granja.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

// ============================================================ 1. el código
{
  const archivos = ['src/granja.js', 'src/granja-mundo.js', 'src/granja-juego.js', 'src/planos-granja.js'];
  for (const f of archivos) {
    const t = leer(f);
    ok(t.split('\n').filter((l) => /^import /.test(l)).every((l) => /^import \{ [^}]+ \} from '\.\/[\w-]+\.js';$|^import \* as THREE from 'three';$/.test(l)), `${f}: imports en una línea`);
    ok(![...t.matchAll(/^export (?:function|const|let|class) ([^\s(=]+)/gm)].some((m) => /ñ/.test(m[1])), `${f}: exportados sin ñ`);
    ok(!/\r\n/.test(t), `${f}: fines de línea LF`);
    ok(!/^export \{/m.test(t) && !/^export (async function|function\*)/m.test(t), `${f}: sin «export { }» ni export async/function*`);
    ok(!/new THREE\.(ShapeGeometry|Shape|OctahedronGeometry|Vector4|Frustum)\b/.test(t), `${f}: nada de lo que el three local no trae`);
    ok(!/\b(iglesia|capilla|misa|altar|bendic\w*|dios|religios\w*|sacerdote|rezar|reza)\b/i.test(t.replace(/nada religioso|Nada religioso|sin nada religioso/g, '')), `${f}: nada religioso`);
    ok(/3\.7\.2/.test(t.split('\n')[0]), `${f}: el comentario de la versión adelante`);
  }
  const reglas = leer('src/granja.js');
  ok(!/from 'three'|document\.|window\.|localStorage/.test(reglas), 'granja.js es puro (sin three ni el DOM)');
  const mundo = leer('src/granja-mundo.js');
  ok(!/new THREE\.\w*Material\b/.test(mundo), 'granja-mundo.js: sin materiales nuevos (MAT_FAUNA y el material del bosque: no se compila nada a mitad de juego)');
  ok(/MAT_FAUNA/.test(mundo) && /InstancedMesh/.test(mundo), 'los animales, instanciados con MAT_FAUNA');
  ok(/conCartas\(materialVegetal\(\{ flex: 1, copa: true, doble: true \}\), texturaCartas\(\)\)/.test(mundo), 'los frutales, con las cartas pintadas y el material del sotobosque (el mismo programa)');
  ok(/mallaOveja\(false/.test(mundo), 'el cordero sale de la oveja de majada-mundo.js');
  const veg = leer('src/vegetacion.js');
  ok(/^export function conCartas\(m, textura, \{ recorte = true, ojo = false \} = \{\}\)/m.test(veg) && /^export class ConstructorArbol/m.test(veg) && /^export function racimo\(/m.test(veg), 'vegetacion.js: sólo se exportan las piezas (la lógica del bosque, igual)');
  ok(/^export function mallaOveja\(caraNegra, r\)/m.test(leer('src/majada-mundo.js')), 'majada-mundo.js: la oveja exportada, sin cambios');
  // main.js: E y el aviso en el mismo lugar y con la misma función
  const main = leer('src/main.js');
  ok(main.includes("import { crearGranjaMundo } from './granja-mundo.js';") && main.includes("import { crearGranjaJuego } from './granja-juego.js';"), 'main.js importa la granja');
  const iE = main.indexOf("if (!js.enTren && !js.enKayak && !objetivo && granjaJuego) { const a = granjaJuego.accion(js); if (a) { a.hacer(); cacheGranja = null; break; } }");
  const iOvejaE = main.indexOf('if (!js.enTren && !js.enKayak && !objetivo && ovejaCercana) { esquilarOveja(ovejaCercana); break; }');
  const iMecE = main.indexOf('if (!js.enTren && !js.enKayak && !objetivo && mecanicasAldea) { const m = mecanicasAldea.accion(js);');
  ok(iE > iMecE && iE < iOvejaE && iMecE > 0, 'la tecla E: la granja después de lo de la aldea y antes que la oveja');
  const iA = main.indexOf("if (!aviso && cacheGranja && !js.enTren && !js.enKayak && !objetivo) aviso = { tecla: 'E', texto: cacheGranja.texto };");
  const iOvejaA = main.indexOf('if (!aviso && ovejaCercana && !objetivo) aviso = ');
  const iMecA = main.indexOf('if (!aviso && cacheMecanica && !js.enTren && !js.enKayak && !objetivo) aviso = ');
  ok(iA > iMecA && iA < iOvejaA && iMecA > 0, 'el aviso: en el mismo orden que la tecla E');
  ok(main.includes('cacheGranja = granjaJuego ? granjaJuego.accion(js) : null;'), 'el aviso usa la misma función que E');
  ok(/\/\/ 3\.7\.2 \(granja\): la vaca, los chanchos, los corderos, el comedero, la batea y los frutales \(el aviso, en el mismo/.test(main), 'el comentario de la prioridad compartida, en main.js');
  ok(main.includes("try { if (modo === 'jugando' && !desafio) granjaJuego?.actualizar(dt); } catch (e) { fallaSistema('granja', e); }"), 'la granja, aislada en el bucle (fallaSistema)');
  ok(main.includes("if (!esDesafio) granjaMundo = crearGranjaMundo({ T, escena, col: () => col, permitir: () => planificadorAntitirones.permitir('granja', { pesada: true }), inviernoVisual: () => U.uInvierno.value > 0.5 });"), 'las mallas de la granja se crean al cargar (sólo en el Relax), y lo pesado cuando el planificador deja');
  ok(main.includes('granja: granjaJuego,   // 3.7.2 (granja)'), 'la charla conoce la granja');
  ok(main.includes("o.plano.id === 'frutal' ? granjaJuego?.frutales() || null"), 'mover un hoyo con su frutal lo muda con él');
  const vj = leer('src/vecindad-juego.js');
  ok(vj.includes('for (const o of ctx.granja?.opciones?.(s.clave) || []) lista.push(o);') && /if \(\/\^granja\(\?::\|\$\)\/\.test\(String\(id\)\) && ctx\.granja\)/.test(vj), 'vecindad-juego.js: las opciones y el elegir de la granja');
  ok(leer('src/construccion.js').includes('PLANOS.push(...PLANOS_GRANJA);'), 'construccion.js suma los planos de la granja');
  ok(leer('src/cuaderno.js').includes('ENTRADAS.push(...ENTRADAS_GRANJA);'), 'cuaderno.js suma las entradas de la granja');
  ok(leer('src/mochila.js').includes('for (const r of ranurasGranja(cant)) ranuras.push(r);'), 'mochila.js muestra lo de la granja');
  const guardado = leer('src/guardado.js');
  ok(guardado.includes("granja: modoPartida === 'desafio' ? undefined : sanearGranja(p.granja,"), 'guardado.js sanea la granja (en el Desafío, ninguna)');
  // la cocina no se toca
  ok(!/granja/.test(leer('src/cocina.js')), 'cocina.js, sin tocar');
}

// ============================================================ 2. la vaca
const P = (extra = {}) => ({ dia: 3, horas: 9, entradas: {}, materiales: {}, cosas: {}, ...extra });
{
  ok(G.PRODUCTOS_GRANJA.join() === 'leche,carne-vaca,carne-cordero,carne-cerdo,chorizo,manzana,pera,ciruela,cereza,frambuesa,grosella', `los ingredientes, con los ids de la cocina (${G.PRODUCTOS_GRANJA.join()})`);
  const g = G.granjaNueva(42), p = P({ materiales: { tronco: 20, tabla: 3 } });
  const t = G.TRUEQUE_GRANJA.vaca;
  eq(G.puedeTrueque(t, p, g, { tambo: false }).motivo, 'tambo', 'sin tambo, Don Ramón no te da la vaca');
  eq(G.puedeTrueque(t, p, g, { tambo: true }).motivo, 'falta', 'con tambo pero sin las tablas, falta');
  p.materiales.tabla = 6;
  const r = G.hacerTrueque(t, p, g, 3, { tambo: true, lugarTambo: { x: 10, z: 20, rot: 0.5 } });
  ok(r.ok && r.animal === 'vaca' && g.vaca && g.terneros.length === 1, 'el trueque: la vaca, con el ternero al pie');
  eq(r.efectos, [{ tipo: 'material', k: 'tronco', n: -10 }, { tipo: 'material', k: 'tabla', n: -6 }], 'se descuenta lo que pide (lo aplica quien llama)');
  ok(['negra', 'colorada'].includes(g.vaca.pelaje) && g.vaca.lugar.x === 10, 'overa negra o colorada, en su tambo');
  ok(G.hacerTrueque(t, p, g, 3, { tambo: true }).motivo === 'ya', 'una sola vaca');
  ok(G.opcionesTrueque('ramon', p, g, { tambo: true }).every((o) => o.id !== 'granja:vaca'), 'con vaca, Don Ramón ya no la ofrece');
  // la misma semilla, el mismo pelaje
  const otra = G.granjaNueva(42); G.recibirVaca(otra, 3);
  eq(otra.vaca.pelaje, g.vaca.pelaje, 'determinista: la misma semilla, el mismo pelaje');
  // el ordeñe: a la mañana, una vez por día
  eq(G.ordenar(g, 3, 4.5).motivo, 'temprano', 'antes de las 5, no');
  eq(G.ordenar(g, 3, 13).motivo, 'tarde', 'a la tarde, no');
  const o1 = G.ordenar(g, 3, 7);
  ok(o1.ok && o1.leche === G.GRANJA.leche, `a la mañana da ${G.GRANJA.leche} litros`);
  eq(G.ordenar(g, 3, 8).motivo, 'yaHoy', 'una vez por día');
  ok(G.ordenar(g, 4, 6).ok, 'al otro día, otra vez');
  // el invierno: del comedero
  eq(G.ordenar(g, 5, 7, true).motivo, 'sinPasto', 'en invierno, sin pasto en el comedero no da leche');
  eq(G.echarFardo(g, 0).motivo, 'sinFardos', 'sin fardos no hay nada que echar');
  ok(G.echarFardo(g, 3).ok && g.comedero === G.GRANJA.racionesFardo, 'un fardo, tres raciones');
  ok(G.ordenar(g, 5, 7, true).ok && g.comedero === G.GRANJA.racionesFardo - 1, 'en invierno come una ración por ordeñe');
  for (let i = 0; i < 5; i++) G.echarFardo(g, 9);
  ok(g.comedero <= G.GRANJA.comedero && G.echarFardo(g, 9).motivo === 'lleno', 'el comedero tiene tope');
  eq([G.inviernoGranja(10, 12, 'auto'), G.inviernoGranja(3, 12, 'auto'), G.inviernoGranja(3, 12, 'invierno'), G.inviernoGranja(10, 12, 'verano')], [true, false, true, false], 'el invierno: el calendario (o la estación fija de Ajustes)');
  eq([1, 3, 6, 10].map((d) => G.estacionGranja(G.faseGranja(d, 12))), ['primavera', 'verano', 'otono', 'invierno'], 'las cuatro estaciones de la granja en el año de doce días');
  // el ternero de cada primavera, y el novillo
  const ev = G.avanzarGranja(g, 13, {});
  ok(ev.some((e) => e.tipo === 'ternero') && g.terneros.length === 2, 'en primavera, la vaca pare');
  ok(G.avanzarGranja(g, 14, {}).length === 0, 'una vez por año');
  const viejo = g.terneros[0];
  eq(G.carnear(g, 'novillo', g.terneros[1].id, 14).motivo, 'chico', 'un ternero no se carnea');
  ok(G.esNovillo(viejo, 14) && G.textoTernero(viejo, 14) === 'Mandar el novillo a carnear', 'el de la primera, ya es novillo');
  const c = G.carnear(g, 'novillo', viejo.id, 14);
  ok(c.ok && c.vuelve === 15 && g.terneros.length === 1 && g.encargos.length === 1, 'carnear: se lo lleva Don Ramón y vuelve mañana');
  eq(G.entregas(g, 14, 20), [], 'hoy todavía no');
  eq(G.entregas(g, 15, 7), [], 'mañana, antes de las ocho, tampoco');
  eq(G.entregas(g, 15, 9), [{ que: 'novillo', da: [{ k: 'carne-vaca', n: 10 }] }], 'mañana a la mañana: la carne de vaca');
  ok(g.encargos.length === 0, 'el encargo se cumple una vez');
  // dormiste dos días: igual llega
  G.recibirVaca(G.granjaNueva(1), 1);
  const g2 = G.granjaNueva(5); g2.encargos.push({ que: 'cordero', dia: 3, vuelve: 4 });
  eq(G.entregas(g2, 9, 2).length, 1, 'si pasaron días, la carne te espera (nada se pierde)');
}

// ============================================================ 3. los corderos y los chanchos
{
  const g = G.granjaNueva(7);
  ok(G.avanzarGranja(g, 13, { ovejas: 2 }).length === 0 && g.corderos.length === 0, 'sin paridera, las ovejas no crían');
  const h = G.granjaNueva(7); h.paridera = 2; h.anioOvejas = 0;
  const ev = G.avanzarGranja(h, 14, { ovejas: 2 });
  ok(ev.some((e) => e.tipo === 'corderos') && h.corderos.length >= 2 && h.corderos.length <= G.GRANJA.corderos, `con la paridera, en primavera nacen (${h.corderos.length})`);
  ok(h.corderos.every((c) => c.nacio === 13), 'nacen el primer día del año');
  const h2 = G.granjaNueva(7); h2.paridera = 2; h2.anioOvejas = 0; G.avanzarGranja(h2, 14, { ovejas: 2 });
  eq(h2.corderos.length, h.corderos.length, 'determinista: los mellizos los decide la semilla');
  const tarde = G.granjaNueva(7); tarde.paridera = 14; tarde.anioOvejas = 0;
  ok(G.avanzarGranja(tarde, 14, { ovejas: 2 }).length === 0, 'una paridera hecha después de la primavera cuenta para el año que viene');
  const cr = h.corderos[0];
  eq(G.carnear(h, 'cordero', cr.id, 15).motivo, 'chico', 'un cordero recién nacido no');
  ok(G.carnear(h, 'cordero', cr.id, 19).ok && G.entregas(h, 20, 8)[0].da[0].k === 'carne-cordero', 'a los seis días, carne de cordero');
  // los chanchos
  const ch = G.granjaNueva(3), p = P({ materiales: { lana: 2 }, entradas: { huevo: { dia: 1, cantidad: 4 } } });
  eq(G.puedeTrueque(G.TRUEQUE_GRANJA.chancha, p, ch, { chiquero: false }).motivo, 'chiquero', 'sin chiquero, Ayelén no te da la chancha');
  ok(G.hacerTrueque(G.TRUEQUE_GRANJA.chancha, p, ch, 3, { chiquero: true }).ok && ch.chancha, 'con chiquero, la chancha');
  eq(G.echarSobras(ch, () => 0).motivo, 'sinSobras', 'sin sobras no hay nada que echar');
  let papas = 20;
  const cuanto = (k) => (k === 'papa' ? papas : 0);
  for (let d = 3; d < 9; d++) G.avanzarGranja(ch, d, {});
  ok(ch.lechones.length === 0 && ch.chancha.comidos === 0, 'con la batea vacía no pasa nada (y no le pasa nada)');
  let camada = null;
  for (let d = 9; d < 16 && !camada; d++) { const r = G.echarSobras(ch, cuanto); if (r.ok) papas--; const ev = G.avanzarGranja(ch, d, {}); camada = ev.find((e) => e.tipo === 'lechones') || null; }
  ok(camada && camada.n >= 2 && camada.n <= 4 && ch.lechones.length === camada.n, `seis días bien comida: la camada (${camada?.n})`);
  for (let d = 15; d < 24; d++) { G.echarSobras(ch, cuanto); G.avanzarGranja(ch, d, {}); }
  ok(ch.lechones.length <= G.GRANJA.lechones && ch.lechones.some(G.esCapon), 'los lechones bien comidos son capones (con tope en el chiquero)');
  const cap = ch.lechones.find(G.esCapon);
  ok(G.carnear(ch, 'capon', cap.id, 24).ok, 'el capón se manda a carnear');
  eq(G.entregas(ch, 25, 9)[0].da, [{ k: 'carne-cerdo', n: 4 }, { k: 'chorizo', n: 8 }], 'del capón: carne de cerdo y chorizos');
  ok(G.sobraParaEchar((k) => (k === 'ciruela' ? 1 : 0)) === 'ciruela' && G.sobraParaEchar(() => 0) === null, 'las sobras: papas, habas o fruta');
}

// ============================================================ 4. los frutales
{
  for (const k of G.ORDEN_FRUTALES) ok(G.FRUTALES[k].plantin === `plantin-${k}` && G.PRODUCTOS_GRANJA.includes(G.FRUTALES[k].fruta), `${k}: su plantín y su fruta`);
  const f = G.frutalNuevo();
  eq(G.estadoFrutal(f, 1).etapa, 'hoyo', 'un hoyo vacío');
  eq(G.elegirPlantin((k) => (k === 'plantin-peral' || k === 'plantin-manzano' ? 1 : 0), { a: { especie: 'manzano' } }), 'peral', 'de los plantines que tenés, la especie que menos plantaste');
  ok(G.plantar(f, 'manzano', 1).ok && !G.plantar(f, 'peral', 1).ok, 'se planta una vez');
  const s1 = G.estadoFrutal(f, 1, 12);
  ok(s1.etapa === 'plantin' && s1.flor && s1.fruta === 'no', 'recién plantado en primavera: florece');
  ok(G.estadoFrutal(f, 4, 12).etapa === 'joven' && G.estadoFrutal(f, 4, 12).crece > 0.3, 'crece con los días');
  ok(G.estadoFrutal(f, 7, 12).etapa === 'adulto' && G.estadoFrutal(f, 7, 12).fruta === 'madura', 'grande en otoño: manzanas maduras');
  ok(G.estadoFrutal(f, 10, 12).fruta === 'no' && G.estadoFrutal(f, 10, 12).cosechas === 0 && !G.cosecharFrutal(f, 10, 12).ok, 'en invierno no hay fruta: ni en el árbol ni en el piso');
  ok(/descansa en invierno/.test(G.textoFrutal(f, 10, 12)), `el aviso en invierno (${G.textoFrutal(f, 10, 12)})`);
  ok(G.estadoFrutal(f, 13, 12).flor && G.estadoFrutal(f, 13, 12).fruta === 'no', 'en la primavera que viene, flor otra vez (y sin fruta)');
  ok(G.estadoFrutal(f, 18, 12).cosechas === 1 && G.estadoFrutal(f, 18, 12, true).fruta === 'no' && !G.estadoFrutal(f, 13, 12, true).flor, 'una cosecha por año; con el invierno fijo de Ajustes, ni flor ni fruta');
  const r = G.cosecharFrutal(f, 18, 12);
  ok(r.ok && r.k === 'manzana' && r.n === G.FRUTALES.manzano.da, `juntar: ${r.n} manzanas`);
  ok(!G.cosecharFrutal(f, 19, 12).ok && G.estadoFrutal(f, 19, 12).fruta === 'no' && /ya juntaste/.test(G.textoFrutal(f, 19, 12)), 'una vez por año');
  const f2 = G.frutalNuevo(); G.plantar(f2, 'cerezo', 1);
  ok(G.estadoFrutal(f2, 3, 12).fruta === 'no' && G.estadoFrutal(f2, 7, 12).fruta === 'madura' && G.estadoFrutal(f2, 15, 12).fruta === 'madura', 'el cerezo: el primer año, cuando es grande; después, en verano');
  // plantado tarde: ese año no da
  const f3 = G.frutalNuevo(); G.plantar(f3, 'ciruelo', 5);
  ok(G.estadoFrutal(f3, 11, 12).cosechas === 0 && G.estadoFrutal(f3, 13, 12).flor && G.primeraFruta(f3) > 12, `plantado en otoño, la primera fruta es el año que viene (día ${G.primeraFruta(f3)})`);
  // las matas, el primer verano
  const m = G.frutalNuevo(); G.plantar(m, 'frambuesa', 1);
  ok(G.estadoFrutal(m, 4, 12).fruta === 'madura' && G.cosecharFrutal(m, 4, 12).k === 'frambuesa', 'la frambuesa, el primer verano');
  const gr = G.frutalNuevo(); G.plantar(gr, 'grosella', 1);
  ok(G.cosecharFrutal(gr, 5, 12).k === 'grosella', 'la grosella también (fruta fina de la Comarca Andina)');
  ok(G.textoFrutal(G.frutalNuevo(), 3, 12, 'cerezo') === 'Plantar el plantín de cerezo' && G.textoFrutal(G.frutalNuevo(), 3, 12, 'grosella') === 'Plantar el gajo de grosellero', 'el aviso de plantar');
}

// ============================================================ 5. el guardado
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const GU = await import('../src/guardado.js?v372granja=' + Date.now());
  const nueva = GU.progresoNuevo();
  ok(nueva.granja && nueva.granja.vaca === null && Object.keys(nueva.granja.frutales).length === 0, 'partida nueva del Relax: la granja vacía');
  // una partida vieja, sin granja
  const vieja = GU.progresoNuevo(); delete vieja.granja; vieja.dia = 30;
  datos.set('hojarasca-v1', JSON.stringify(vieja));
  const c = GU.cargarProgreso();
  ok(c.granja && c.granja.vaca === null && c.granja.terneros.length === 0 && c.granja.anioVaca === -1, 'una partida vieja arranca con la granja vacía');
  // un guardado roto
  const rota = GU.progresoNuevo(); rota.dia = 20;
  rota.granja = {
    semilla: 'x', sig: -4, vaca: { id: 3, pelaje: 'violeta', desde: 999, ordenada: 1e9, lugar: { x: 1e308, z: 2 } },
    terneros: [{ id: 3, nacio: -5 }, { id: 'a' }, 7, null, { id: 9, nacio: 30 }],
    comedero: 1e9, chancha: { desde: 'mañana', cuenta: -9, comio: 1e9, comidos: 1e9 }, lechones: new Array(40).fill({ id: 1, nacio: 2, engorde: -3 }), batea: -2,
    corderos: 'muchos', paridera: 1e9, frutales: { 'no-vale': {}, '3:4': { especie: 'palmera', plantado: 2 }, '5:6': { especie: 'manzano', plantado: 1e9, cosecha: 99 } },
    encargos: [{ que: 'vaca', dia: 2 }, { que: 'cordero', dia: 5, vuelve: 1e9 }, null],
  };
  datos.set('hojarasca-v1', JSON.stringify(rota));
  const s = GU.cargarProgreso().granja;
  ok(s.vaca.pelaje === 'negra' && s.vaca.desde === 20 && s.vaca.ordenada === 20 && s.vaca.lugar === null, 'la vaca rota: pelaje que existe, fechas posibles, lugar descartado');
  ok(s.terneros.length === 2 && s.terneros.every((t) => t.nacio >= 1 && t.nacio <= 20), 'los terneros: con su tope y fechas posibles');
  ok(new Set([s.vaca.id, s.chancha.id, ...s.terneros.map((t) => t.id), ...s.lechones.map((l) => l.id)]).size === 2 + s.terneros.length + s.lechones.length, 'ids únicos');
  ok(s.sig > Math.max(s.vaca.id, s.chancha.id, ...s.terneros.map((t) => t.id), ...s.lechones.map((l) => l.id)), 'el próximo id no pisa a nadie');
  ok(s.comedero === G.GRANJA.comedero && s.batea === 0 && s.lechones.length === G.GRANJA.lechones && s.lechones.every((l) => l.engorde === 0), 'topes del comedero, la batea y los lechones');
  ok(Array.isArray(s.corderos) && s.corderos.length === 0 && s.paridera === 20, 'corderos y paridera saneados');
  ok(!s.frutales['no-vale'] && s.frutales['3:4'].especie === null && s.frutales['5:6'].plantado === 20 && s.frutales['5:6'].cosecha === 1, 'los frutales: especies que existen, fechas posibles');
  ok(s.encargos.length === 1 && s.encargos[0].vuelve === 21, 'los encargos: lo que existe, a lo sumo mañana');
  ok(G.avanzarGranja(s, 20, { ovejas: 2 }) && true, 'una granja saneada sigue andando');
  // el caos: basura de todo tipo, nunca se rompe y siempre queda una granja que anda
  const basura = [null, 1, 'x', [], {}, { vaca: [] }, { terneros: {} }, { frutales: [] }, { frutales: { '1:1': null } }, { chancha: 5 }, { encargos: 'x' }, { semilla: -1 }, { sig: 1e309 }];
  let rng = 12345; const azar = () => ((rng = (rng * 1103515245 + 12345) >>> 0) / 4294967296);
  const valor = (d = 0) => { const r = azar(); if (d > 2 || r < 0.3) return [null, -1, 0, 1e9, NaN, 'x', true][Math.floor(azar() * 7)]; if (r < 0.6) { const o = {}; for (const k of ['id', 'nacio', 'desde', 'especie', 'plantado', 'cosecha', 'que', 'vuelve', 'pelaje', 'engorde', 'comidos', 'x', 'z']) if (azar() < 0.4) o[k] = valor(d + 1); return o; } return Array.from({ length: Math.floor(azar() * 5) }, () => valor(d + 1)); };
  for (let i = 0; i < 300; i++) basura.push({ vaca: valor(), terneros: valor(), chancha: valor(), lechones: valor(), corderos: valor(), frutales: { '1:2': valor(), '3:x': valor() }, encargos: valor(), comedero: valor(), batea: valor(), paridera: valor(), anioVaca: valor(), sig: valor() });
  let bien = 0;
  for (const b of basura) {
    const x = G.sanearGranja(b, 15, 3);
    G.avanzarGranja(x, 16, { ovejas: 2 }); G.entregas(x, 17, 9); G.ordenar(x, 16, 7, false);
    for (const f of Object.values(x.frutales)) { G.estadoFrutal(f, 16, 10); G.cosecharFrutal(f, 16, 10); }
    JSON.parse(JSON.stringify(x));
    if (Array.isArray(x.terneros) && Array.isArray(x.lechones) && x.lechones.length <= G.GRANJA.lechones && x.terneros.length <= G.GRANJA.terneros) bien++;
  }
  eq(bien, basura.length, `el caos: ${basura.length} granjas rotas, ninguna rompe nada`);
}

// ============================================================ 6. el cuaderno, la mochila y los planos
{
  const C = await import('../src/cuaderno.js');
  for (const k of [...G.PRODUCTOS_GRANJA, 'fardo', 'vaca-lechera', 'chancha-criolla', 'cordero-propio', ...G.ORDEN_FRUTALES.map((e) => G.FRUTALES[e].plantin)]) ok(C.ENTRADA[k]?.seccion === 'huerta', `el cuaderno tiene «${k}» (Del campo)`);
  eq(new Set(C.ENTRADAS.map((e) => e.id)).size, C.ENTRADAS.length, 'sin ids repetidos en el cuaderno');
  const ranuras = G.ranurasGranja((k) => (['leche', 'chorizo', 'manzana', 'fardo', 'plantin-peral'].includes(k) ? 2 : 0));
  eq(ranuras.map((r) => r.id), ['leche', 'chorizo', 'manzana', 'fardo', 'plantin-peral'], 'la mochila: lo que tenés, en orden');
  const iconos = new Set(G.ranurasGranja(() => 1).map((r) => r.icono));
  for (const i of iconos) ok(i === 'plantin' || typeof G.ICONOS_GRANJA[i] === 'function', `el icono «${i}» se dibuja`);
}

// ============================================================ 7. el mundo y los planos, con el three local
const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
function cargar(raices, final) {
  const info = new Map(), orden = [], visitando = new Set(), visitado = new Set();
  const visitar = (archivo) => {
    archivo = path.resolve(archivo); if (visitado.has(archivo)) return;
    if (visitando.has(archivo)) throw Error('ciclo ' + archivo); visitando.add(archivo);
    const texto = fs.readFileSync(archivo, 'utf8'), deps = [];
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(path.resolve(path.dirname(archivo), m[2]));
    info.set(archivo, texto); for (const d of deps) visitar(d);
    visitando.delete(archivo); visitado.add(archivo); orden.push(archivo);
  };
  for (const r of raices) visitar(path.join(raiz, 'src', r));
  let code = leer('three-r186-inline.js') + '\n';
  for (const f of orden) {
    let t = info.get(f); const ex = [];
    for (const m of t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) ex.push(m[1]);
    t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, nombres, spec) => {
      const partes = nombres.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); });
      return `const { ${partes.join(', ')} } = ${idModulo(path.resolve(path.dirname(f), spec))};`;
    });
    t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
    code += `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  }
  code += final;
  const ctx = { console, performance, setTimeout, clearTimeout, Math, Date, globalThis: null };
  ctx.globalThis = ctx; ctx.window = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'granja-vm.js' });
  return JSON.parse(JSON.stringify(ctx.__R));
}
{
  const r = cargar(['construccion.js', 'planos-granja.js', 'granja-mundo.js', 'granja.js'], `
  globalThis.__R = (() => {
    const C = __mod_construccion, PG = __mod_planos_granja, GM = __mod_granja_mundo, GR = __mod_granja;
    const ids = C.PLANOS.map((p) => p.id);
    // los planos: sólo madera y piedra (tipo 0 y 4), en Trabajo y sólo en el Relax
    const tipos = {};
    for (const p of PG.PLANOS_GRANJA) { const vistos = new Set(); const c = { agregar: (g, o) => { vistos.add(o.tipo); } }; for (const e of p.etapas) e.arma(c, p, {}, () => 0); tipos[p.id] = [...vistos]; }
    const planos = PG.PLANOS_GRANJA.map((p) => ({ id: p.id, cat: C.PLANO[p.id].categoria, relax: !!C.PLANO[p.id].soloRelax, etapas: C.PLANO[p.id].etapas.length, fisica: typeof p.fisica === 'function' }));
    // un terreno plano de mentira y una escena
    const T = { altura: () => 0, normal: () => new THREE.Vector3(0, 1, 0) };
    const escena = new THREE.Scene();
    const t0 = performance.now();
    const M = GM.crearGranjaMundo({ T, escena });
    const tCrear = performance.now() - t0;
    const mallas0 = []; escena.traverse((o) => { if (o.isMesh) mallas0.push({ n: o.name, count: o.count, inst: !!o.isInstancedMesh, mat: o.material.type }); });
    // la granja completa: vaca y dos terneros, chancha con seis lechones, cuatro corderos y seis frutales
    const g = GR.granjaNueva(9);
    GR.recibirVaca(g, 1, { x: 0, z: 0, rot: 0 }); g.terneros.push({ id: 90, nacio: 13 });
    GR.recibirChancha(g, 1, { x: 12, z: 0, rot: 0 }); for (let i = 0; i < 6; i++) g.lechones.push({ id: 100 + i, nacio: 10, engorde: i });
    for (let i = 0; i < 4; i++) g.corderos.push({ id: 200 + i, nacio: 13, madre: i % 2 });
    const frutales = GR.ORDEN_FRUTALES.map((e, i) => { const f = GR.frutalNuevo(); GR.plantar(f, e, 1); return { clave: i + ':0', x: -10 + i * 3, z: -8, rot: 0, estado: GR.estadoFrutal(f, 17, 11) }; });
    const t1 = performance.now();
    M.sincronizar({ granja: g, dia: 17, tambo: { x: 0, z: 0, rot: 0 }, chiquero: { x: 12, z: 0, rot: 0 }, corral: { x: -10, z: 6, radio: 4 }, frutales });
    let dib = 0; for (let i = 0; i < 30; i++) dib = M.actualizar(0.1, 11, { x: 0, y: 0, z: 0 }, [{ x: -10, z: 6 }, { x: -9, z: 7 }]);
    const tArmar = performance.now() - t1;
    const e = M.estado();
    // E: el animal más cercano
    const cerca = M.animalCerca({ x: M.agentes.get('vaca:1').x + 0.5, y: 0, z: M.agentes.get('vaca:1').z }, 1.7);
    // de noche, a dormir
    for (let i = 0; i < 400; i++) M.actualizar(0.1, 23, { x: 0, y: 0, z: 0 }, []);
    const vaca = M.agentes.get('vaca:1');
    // lejos no se dibuja nada
    const lejos = M.actualizar(0.1, 11, { x: 900, y: 0, z: 900 }, []);
    // con el invierno que se ve (una estación fija, o mientras cambia): ni flor ni fruta
    const M2 = GM.crearGranjaMundo({ T, escena: new THREE.Scene(), inviernoVisual: () => true });
    M2.sincronizar({ granja: g, dia: 17, tambo: null, chiquero: null, corral: null, frutales });
    for (let i = 0; i < 8; i++) M2.actualizar(0.1, 11, { x: 0, y: 0, z: 0 }, []);
    const enInvierno = M2.estado().frutales;
    // cada frutal en sus tres estados se arma
    const geos = {};
    for (const esp of GR.ORDEN_FRUTALES) for (const est of ['hoja', 'flor', 'fruta']) { const q = M.geometriaFrutal(esp, est); geos[esp + '|' + est] = { v: q.attributes.position.count, tris: (q.index ? q.index.count : q.attributes.position.count) / 3, carta: !!q.attributes.aCarta, tipo: [...new Set(q.attributes.aTipo.array)].sort() }; }
    return { ids, tipos, planos, mallas0, tCrear, tArmar, dib, e, cerca, echada: vaca.echado, vacaZ: vaca.z, lejos, geos, enInvierno };
  })();`);
  for (const id of ['tambo', 'chiquero', 'paridera', 'frutal']) ok(r.ids.includes(id), `el plano ${id}`);
  eq(new Set(r.ids).size, r.ids.length, 'ningún id de plano repetido');
  for (const [id, t] of Object.entries(r.tipos)) eq(t.filter((x) => x !== 0 && x !== 4), [], `${id}: sólo madera (0) y piedra (4)`);
  ok(r.planos.every((p) => p.cat === 'trabajo' && p.relax && p.etapas >= 1 && p.fisica), `los planos, en Trabajo, sólo en el Relax y con su cuerpo (${JSON.stringify(r.planos)})`);
  ok(r.mallas0.length === 15 && r.mallas0.every((m) => m.count === 0 || !m.inst || m.n === 'granja-frutal'), `al cargar: las mallas vacías, ya en la escena (${r.mallas0.length})`);
  ok(r.mallas0.filter((m) => m.inst && m.n !== 'granja-frutal').every((m) => m.mat === 'MeshLambertMaterial'), 'los animales, con MAT_FAUNA (Lambert)');
  ok(r.tCrear < 400, `crear la granja al cargar es barato (${r.tCrear.toFixed(0)} ms)`);
  ok(r.e.vacas === 3 && r.e.chanchos === 7 && r.e.corderos === 4, `todos a la vista (${JSON.stringify(r.e)})`);
  ok(r.dib <= 13 + 6 && r.dib >= 12, `los dibujos de la granja entera: ${r.dib} (4 por especie y el cuerpo del ternero, más un frutal por especie y estado)`);
  ok(r.e.frutales.length === 6, `los seis frutales, cada uno en su malla (${r.e.frutales.join(', ')})`);
  ok(r.cerca && r.cerca.tipo === 'vaca', `E al lado de la vaca, es la vaca (${JSON.stringify(r.cerca)})`);
  ok(r.echada > 0.9, `de noche, la vaca duerme echada (${r.echada.toFixed(2)})`);
  ok(r.vacaZ < 0.6, `y en el tambo (z ${r.vacaZ.toFixed(2)})`);
  eq(r.lejos, 0, 'lejos, no se dibuja nada');
  ok(r.enInvierno.length === 6 && r.enInvierno.every((x) => /|hoja×/.test(x)), `con el invierno que se ve, los frutales sin flor ni fruta (${r.enInvierno.join(', ')})`);
  for (const [k, q] of Object.entries(r.geos)) {
    ok(q.carta && q.tris > 100 && q.tris < 9000, `${k}: se arma con las cartas (${q.tris} triángulos)`);
    const flor = k.endsWith('|flor'), fruta = k.endsWith('|fruta');
    ok(q.tipo.includes(2) && (flor ? q.tipo.includes(3) : !q.tipo.includes(3)) && (fruta ? q.tipo.includes(4) : true), `${k}: hojas que cambian con la estación${flor ? ', flores' : ''}${fruta ? ', fruta' : ''} (${q.tipo})`);
  }
  console.log(`  (granja-mundo: crear ${r.tCrear.toFixed(0)} ms; armar los modelos y 30 cuadros ${r.tArmar.toFixed(0)} ms; ${r.e.triangulos} triángulos; ${r.dib} dibujos)`);
}

// ============================================================ 8. el enganche (granja-juego.js con un mundo de mentira)
{
  const r = cargar(['granja-juego.js', 'granja.js'], `
  globalThis.__R = (() => {
    const GR = __mod_granja, GJ = __mod_granja_juego;
    const p = { dia: 2, horas: 8, entradas: { papa: { dia: 1, cantidad: 3 }, frutilla: { dia: 1, cantidad: 3 } }, materiales: { tronco: 12, tabla: 6, lana: 2 }, cosas: {}, granja: null, corral: { x: 40, z: 0, radio: 4 } };
    // las obras: un tambo en (0, 0), un chiquero en (20, 0) y un hoyo en (-10, 0)
    const obra = (id, x, z) => ({ plano: { id, etapas: [1] }, datos: { x, z, rot: 0, y: 0, etapas: 1 } });
    const obras = [obra('tambo', 0, 0), obra('chiquero', 20, 0), obra('frutal', -10, 0)];
    // el mundo de mentira: los animales donde se los pone
    const animales = [];
    const mundo = { sincronizar() {}, actualizar() {}, ordenar(s) { mundo.ordene = s; },
      animalCerca(pos, radio, tipos) { let m = null; for (const a of animales) { if (tipos && !tipos.includes(a.tipo)) continue; const d = Math.hypot(a.x - pos.x, a.z - pos.z), al = a.tipo === 'vaca' ? radio + 0.6 : radio; if (d < al && (!m || d < m.d)) m = { ...a, d, alcance: al }; } return m; } };
    const notas = [];
    let oveja = null;
    const G = GJ.crearGranjaJuego({ progreso: () => p, ajustes: () => ({ estacion: 'auto' }), desafio: () => false, mundo, obras: () => obras, terminada: () => true, corral: () => p.corral, ovejas: () => [], ovejaCerca: () => oveja,
      jugador: () => null, nota: (t, s) => notas.push(t + ' · ' + (s || '')), guardar() {}, refrescarBarra() {}, registrar() {},
      sumarEntrada: (k, n) => { const e = p.entradas[k] || (p.entradas[k] = { dia: p.dia, cantidad: 0 }); e.cantidad = Math.max(0, e.cantidad + n); },
      sumarMaterial: (k, n) => { p.materiales[k] = (p.materiales[k] || 0) + n; } });
    const js = (x, z) => ({ pos: { x, y: 0, z } });
    const out = {};
    // la charla: Don Ramón con tambo
    out.opciones = G.opciones('ramon');
    out.menu = G.elegir({ clave: 'ramon' }, 'granja').sub.opciones.map((o) => o.titulo);
    out.vaca = G.elegir({ clave: 'ramon' }, 'granja:vaca');
    out.mat = { ...p.materiales };
    out.otroQuien = G.elegir({ clave: 'madre' }, 'granja:vaca');
    out.nadaDeOtro = G.opciones('jefe');
    const g = p.granja;
    // la vaca para ordeñar gana aunque el ternero esté más cerca
    animales.push({ tipo: 'vaca', id: g.vaca.id, x: 0, z: 3 }, { tipo: 'ternero', id: g.terneros[0].id, x: 0.4, z: 1.2 });
    out.ordenar = G.accion(js(0, 1.0))?.texto;
    G.accion(js(0, 1.0)).hacer();
    out.leche = p.entradas.leche?.cantidad; out.balde = mundo.ordene;
    out.despues = G.accion(js(0, 2.2))?.texto;
    // al lado de la batea, la batea (aunque la chancha ande cerca)
    p.entradas.huevo = { dia: 1, cantidad: 4 }; G.elegir({ clave: 'veterinaria' }, 'granja:chancha');
    animales.push({ tipo: 'chancha', id: g.chancha.id, x: 21, z: 1.2 });
    out.batea = G.accion(js(21.05, 2.05))?.texto;
    G.accion(js(21.05, 2.05)).hacer();
    out.papas = p.entradas.papa.cantidad; out.comio = g.chancha.comio;
    // el cordero: con una oveja más cerca, es la oveja (main.js la esquila)
    g.corderos.push({ id: 77, nacio: 1, madre: 0 });
    animales.push({ tipo: 'cordero', id: 77, x: 40.8, z: 0 });
    oveja = { x: 40.2, z: 0 };
    out.conOveja = G.accion(js(40, 0));
    oveja = null;
    out.sinOveja = G.accion(js(40, 0))?.texto;
    // carnear: E pregunta, E confirma
    p.dia = 9;
    out.novillo = G.accion(js(0.4, 0.4))?.texto;
    G.accion(js(0.4, 0.4)).hacer();
    out.pregunta = G.accion(js(0.4, 0.4))?.texto;
    G.accion(js(0.4, 0.4)).hacer();
    out.encargos = g.encargos.map((e) => e.que + '>' + e.vuelve);
    // el frutal: plantar con E y juntar
    G.elegir({ clave: 'madre' }, 'granja:plantin-manzano');
    p.dia = 13; p.horas = 9; G.refrescar();
    out.plantar = G.accion(js(-10, 1))?.texto;
    G.accion(js(-10, 1)).hacer();
    p.dia = 19; p.horas = 12; G.refrescar();
    out.juntar = G.accion(js(-10, 1))?.texto;
    G.accion(js(-10, 1)).hacer();
    out.manzanas = p.entradas.manzana?.cantidad;
    out.notas = notas.length;
    return out;
  })();`);
  ok(r.opciones.length === 1 && r.opciones[0].titulo === 'Cambiar algo de campo…' && r.nadaDeOtro.length === 0, 'la charla: Don Ramón tiene «Cambiar algo de campo…»; el jefe de estación, no');
  ok(r.menu.some((t) => /vaca lechera/.test(t)) && r.menu[r.menu.length - 1] === 'Mejor no', `el submenú (${r.menu.join(' / ')})`);
  ok(r.vaca.tipo === 'renglones' && /overa/.test(r.vaca.renglones[0]) && r.mat.tronco === 2 && r.mat.tabla === 0, 'elegir la vaca: lo que dice y lo que se paga');
  ok(r.otroQuien.tipo === 'menu', 'un trueque de otro vecino no se puede elegir desde la charla equivocada');
  ok(r.ordenar === 'Ordeñar la vaca' && r.leche === 4 && r.balde === 3, `la vaca gana aunque el ternero esté más cerca; E ordeña (${r.ordenar}, ${r.leche})`);
  ok(/ya la ordeñaste hoy/.test(r.despues), `después del ordeñe, el aviso cambia (${r.despues})`);
  ok(/Echar sobras a la batea/.test(r.batea) && r.papas === 2 && r.comio === 2, `al lado de la batea, E echa sobras aunque la chancha ande cerca (${r.batea})`);
  ok(r.conOveja === null && /Cordero/.test(r.sinOveja), 'con una oveja más cerca, la granja no se mete (se esquila); sin oveja, el cordero');
  ok(r.novillo === 'Mandar el novillo a carnear' && /Sí: que Don Ramón se lleve el novillo/.test(r.pregunta) && r.encargos.join() === 'novillo>10', `carnear: E pregunta y E confirma (${r.encargos})`);
  ok(r.plantar === 'Plantar el plantín de manzano' && r.juntar === 'Juntar las manzanas (10)' && r.manzanas === 10, `el frutal: plantar y juntar con E (${r.plantar} · ${r.juntar})`);
  ok(r.notas >= 6, 'cada cosa con su nota');
}

console.log(`OK 3.7.2 granja · ${n} comprobaciones`);
