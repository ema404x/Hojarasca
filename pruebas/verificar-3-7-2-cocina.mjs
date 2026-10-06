// 3.7.2 — La cocina (PLAN_3_7.md). Las reglas puras (cocina-pasos.js): estaciones, recetas en pasos con tiempo,
// ingredientes y de dónde salen, la lluvia y el techito, el humo y el olor, los invitados, el perro, la alacena, el
// recetario, el trueque con los vecinos, el guardado y su saneado, la estación móvil (para el vagón comedor de la
// 3.7.3). Los planos (planos-cocina.js, construidos con three de verdad en un vm), lo que se ve (cocina-mundo.js,
// también en el vm) y los enganches en main.js, mochila.js, cuaderno.js, trueque.js, guardado.js, vecindad-juego.js,
// perro.js y plantilla.html.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import * as C from '../src/cocina-pasos.js';
import { ENTRADA, ENTRADAS } from '../src/cuaderno.js';
import { TRUEQUE, TRUEQUES, NOMBRE_COSA } from '../src/trueque.js';
import { RECETAS_FUEGO } from '../src/cocina.js';
import { progresoNuevo, usarModoGuardado } from '../src/guardado.js';
import { armarMochila } from '../src/mochila.js';
import { esPersonaVecindad } from '../src/vecindad.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8').replace(/\r\n/g, '\n');
let n = 0;
const ok = (c, t) => { n++; assert.ok(c, t); };

// ---------------------------------------------------------------- las recetas que pidió el usuario
const R = C.RECETA_PASOS;
const pedidas = { asado: 'parrilla', 'cordero-asador': 'parrilla', 'pan-casero': 'horno', empanadas: 'horno', mermeladas: 'cocina-lena', 'dulce-leche': 'cocina-lena', locro: 'cocina-lena', 'chocolate-caliente': 'cocina-lena', curanto: 'cocina-lena' };
for (const [id, est] of Object.entries(pedidas)) ok(R[id]?.estacion === est, `${id} va en ${est}`);
ok(C.RECETAS_PASOS.length === Object.keys(pedidas).length, 'nueve recetas en pasos');
ok(new Set(C.RECETAS_PASOS.map((r) => r.id)).size === C.RECETAS_PASOS.length, 'sin ids repetidos');
ok(C.TIPOS_ESTACION.join() === 'parrilla,horno,cocina-lena', 'tres estaciones: parrilla con cruz, horno de barro, cocina a leña');
for (const rc of C.RECETAS_PASOS) {
  ok(rc.pasos.length >= 3 && rc.pasos[0].id === 'fuego' && rc.pasos[rc.pasos.length - 1].fin, `${rc.id}: prender el fuego, preparar … sacar`);
  ok(rc.pasos.slice(0, -1).every((p) => p.espera > 0 && p.mientras && p.accion && p.hecho), `${rc.id}: cada paso con su tiempo y sus textos`);
  ok(rc.pide.length >= 1 && rc.pide.every((x) => x.k === 'fruta' || C.esIngrediente(x.k)), `${rc.id}: ingredientes conocidos`);
  ok(rc.texto && rc.efecto && rc.da?.n > 0, `${rc.id}: texto, efecto y rinde`);
  ok(!rc.ensena || (Object.hasOwn(C.AL_ENSENAR, rc.ensena) && Object.hasOwn(C.QUIEN_ENSENA, rc.ensena) && esPersonaVecindad(rc.ensena)), `${rc.id}: quien la enseña es un vecino con qué decir`);
  ok(!!rc.deEntrada !== !!rc.ensena, `${rc.id}: se sabe de entrada o te la enseña alguien`);
}
// las recetas al fuego de antes siguen ahí (cocina.js), y el pan del horno ya no es del fuego
ok(RECETAS_FUEGO.some((r) => r.id === 'guiso-campo') && !RECETAS_FUEGO.some((r) => r.id === 'pan-casero'), 'las recetas al fuego de siempre, intactas');

// ---------------------------------------------------------------- ingredientes: dos fuentes, sin economía nueva
ok(C.DE_LA_GRANJA.slice().sort().join() === ['leche', 'carne-vaca', 'carne-cordero', 'carne-cerdo', 'chorizo', 'manzana', 'pera', 'ciruela', 'cereza', 'frambuesa', 'grosella'].sort().join(), 'los ids que comparte con la granja, tal cual (y la grosella)');
const porVecinos = new Set(Object.values(C.CAMBIOS_VECINOS).flat().map((c) => c.da[0]));
for (const k of C.DE_LA_GRANJA) ok(porVecinos.has(k), `${k}: también por trueque con un vecino (sin la granja se puede cocinar)`);
for (const k of C.DEL_ALMACEN) {
  const t = TRUEQUE[k];
  ok(t && t.repetible && t.da > 0 && ENTRADA[k]?.seccion === 'trueque', `${k}: en el almacén de Ercilia (se gasta: se cambia cada vez), con su entrada`);
  ok(t.pide.every(([q, m]) => Number.isInteger(m) && m > 0 && NOMBRE_COSA[q]), `${k}: se paga con lo de siempre (piñones, cantos, ramitas…)`);
}
ok(TRUEQUES.length <= 18, `el almacén entra en dos páginas (${TRUEQUES.length})`);
for (const k of ['zapallo', 'mariscos']) ok(porVecinos.has(k), `${k}: por trueque con un vecino`);
const conFuente = new Set([...C.DE_LA_GRANJA, ...C.DEL_ALMACEN, ...porVecinos, 'harina', 'huevo', 'papa', 'frutilla']);
for (const rc of C.RECETAS_PASOS) for (const x of rc.pide) ok(x.k === 'fruta' || conFuente.has(x.k), `${rc.id}: ${x.k} se consigue`);
for (const [clave, lista] of Object.entries(C.CAMBIOS_VECINOS)) {
  ok(esPersonaVecindad(clave), `${clave}: un vecino de verdad`);
  for (const c of lista) ok(['material', 'cosa', 'entrada'].includes(c.pide.tipo) && c.pide.n > 0 && Object.hasOwn(C.NOMBRE_PAGO, c.pide.k) && C.esIngrediente(c.da[0]) && c.da[1] > 0, `${clave}: ${c.da[0]} por ${c.pide.k}`);
}
// lo que se cuenta: lo juntado más las cosas; se gasta primero lo juntado
{
  const p = { entradas: { leche: { cantidad: 2 } }, cosas: { leche: 3 } };
  ok(C.cuantoHay(p, 'leche') === 5, 'leche: de lo juntado y de las cosas');
  ok(C.gastar(p, 'leche', 4) === 4 && p.entradas.leche.cantidad === 0 && p.cosas.leche === 1, 'se gasta primero lo juntado');
  ok(C.gastar(p, 'leche', 9) === 1 && !p.cosas.leche, 'no se gasta lo que no hay');
}

// ---------------------------------------------------------------- empezar, los pasos, la lluvia
const P = (entradas = {}, cosas = {}, cocina = C.cocinaNueva()) => ({ entradas: Object.fromEntries(Object.entries(entradas).map(([k, v]) => [k, { dia: 1, hora: 9, cantidad: v }])), cosas: { ...cosas }, cocina });
const parrilla = C.estacionDeObra('parrilla', false), techada = C.estacionDeObra('parrilla', true);
const horno = C.estacionDeObra('horno'), cocinaL = C.estacionDeObra('cocina-lena');
{
  const p = P({ 'carne-vaca': 2, chorizo: 2 }, { sal: 1 });
  ok(!C.empezar('asado', parrilla, p, 1).ok && C.empezar('asado', parrilla, p, 1).falta.some((f) => /tronco/.test(f)), 'sin leña no se prende');
  ok(C.empezar('asado', parrilla, p, 2, { lluvia: 0.8 }).motivo === 'lluvia', 'con lluvia y sin techito, no');
  ok(C.empezar('asado', techada, p, 2, { lluvia: 0.8 }).ok, 'con techito, sí');
  ok(C.empezar('pan-casero', horno, P({}, { harina: 2 }), 1, { lluvia: 0.9 }).ok, 'el horno de barro, cerrado, hornea con lluvia');
  ok(!C.empezar('locro', parrilla, p, 9).ok, 'cada receta en su estación');
  ok(C.avisoEstacion(parrilla, null, C.opcionesEstacion(parrilla, p, 2), 0.8).includes('techito'), 'el aviso con lluvia pide techito');
  const r = C.empezar('asado', parrilla, p, 2, { dia: 3 });
  ok(r.ok && r.gasta.lena === 2 && r.coccion.paso === 1 && r.coccion.falta === 0.75 && !r.coccion.aOjo, 'prende: dos troncos, y espera las brasas');
  C.gastarIngredientes(p, r.gasta.ingredientes);
  ok(C.cuantoHay(p, 'carne-vaca') === 0 && C.cuantoHay(p, 'chorizo') === 0 && C.cuantoHay(p, 'sal') === 0, 'los ingredientes se gastan al empezar (nada falta a mitad)');
  const c = r.coccion;
  ok(C.avisoEstacion(parrilla, c).includes('brasas'), 'mientras, el aviso dice qué pasa');
  ok(C.hacerPaso(c).accion === 'espera' && c.paso === 1, 'E antes de tiempo no adelanta');
  ok(C.humoDe(c).humo > 0 && !C.humoDe(c).olor, 'humo sin olor a carne todavía');
  ok(C.avanzarCoccion(c, 0.8, parrilla, 0) && C.pasoActual(c).listo, 'con el tiempo, el paso queda listo');
  ok(C.avisoEstacion(parrilla, c) === 'Poner la carne en la cruz', 'el aviso es el paso que sigue');
  ok(C.hacerPaso(c).accion === 'paso' && c.paso === 2 && c.falta === 1.5, 'la carne a la cruz');
  const h = C.humoDe(c);
  ok(h.olor === 'asado' && h.carne && h.chorizos && h.humo === 1, 'ahora huele a asado (y hay chorizos para el perro)');
  ok(C.traeVecinos(c, 12) && !C.traeVecinos(c, 23) && !C.traeVecinos(c, 8), 'el olor trae vecinos de día');
  ok(!C.avanzarCoccion(c, 1, parrilla, 0.9) && c.pausa && c.falta === 1.5, 'se larga a llover sin techito: las brasas se ahogan y no corre');
  ok(C.hacerPaso(c).accion === 'lluvia' && /lluvia/.test(C.avisoEstacion(parrilla, c)), 'lo dice el aviso y E no hace nada');
  ok(!C.humoDe(c).olor, 'con las brasas ahogadas no hay olor');
  C.avanzarCoccion(c, 2, techada, 0.9);
  ok(!c.pausa && c.falta === 0, 'bajo techo sigue aunque llueva');
  c.robado = true;
  ok(!C.humoDe(c).chorizos, 'después del robo ya no hay chorizo que tiente');
  ok(C.hacerPaso(c).accion === 'paso' && c.paso === 3, 'dar vuelta');
  C.avanzarCoccion(c, 5, parrilla, 0);
  const fin = C.hacerPaso(c);
  ok(fin.accion === 'fin' && fin.da.id === 'asado' && fin.da.n === 5 && c.terminada, 'sacar: seis porciones, menos el chorizo del perro');
}
// la mermelada: de la fruta que más hay; la de frutilla es el frasco de siempre
{
  const rc = R.mermeladas;
  ok(C.varianteDe(rc, P({ frambuesa: 4, cereza: 6 })) === 'cereza', 'la fruta que más hay');
  ok(C.varianteDe(rc, P({ frambuesa: 3 })) === null, 'con tres no alcanza');
  ok(C.daDe(rc, 'frutilla').id === 'frasco-frutilla' && C.daDe(rc, 'pera').id === 'mermelada-pera', 'de frutilla, el frasco de dulce de siempre');
  ok(C.nombreCon(rc, 'ciruela') === 'Mermelada de ciruela', 'se nombra por la fruta');
  const p = P({ ciruela: 5 }, { azucar: 1 });
  const r = C.empezar(rc, cocinaL, p, 1);
  ok(r.ok && r.coccion.variante === 'ciruela' && r.coccion.aOjo && r.gasta.ingredientes.some((x) => x.k === 'ciruela' && x.n === 4), 'a ojo (no la sabés), con cuatro ciruelas');
  for (let i = 0; i < 6 && !r.coccion.terminada; i++) { C.avanzarCoccion(r.coccion, 3, cocinaL, 0); C.hacerPaso(r.coccion); }
  ok(r.coccion.terminada, 'en pasos, hasta envasar');
}
// los minutos que faltan
ok(C.textoFaltan(0.75) === 'unos 50 minutos' && C.textoFaltan(1.5) === 'una hora y 30 minutos' && C.textoFaltan(2) === '2 horas' && C.minutos(0.01) === 10, 'los minutos, de a diez');

// ---------------------------------------------------------------- vecinos: quiénes vienen y dónde se paran
{
  const cand = [{ clave: 'jefe', libre: false, amistad: 3 }, { clave: 'nelida', libre: true, amistad: 1 }, { clave: 'nene', libre: true, amistad: 3, chico: true },
    { clave: 'abuela', libre: true, amistad: 2 }, { clave: 'padre', libre: true, amistad: 0 }, { clave: 'madre', libre: true, amistad: 0 }];
  ok(C.elegirInvitados(cand).join() === 'abuela,nelida,padre', 'los libres y grandes, primero los amigos, hasta tres');
  ok(C.elegirInvitados([]).length === 0 && C.elegirInvitados(null).length === 0, 'sin nadie, nadie');
  const ls = C.lugaresAlrededor(10, 20, 0, 4);
  ok(ls.every((q) => Math.abs(Math.hypot(q.x - 10, q.z - 20) - 2.8) < 1e-9), 'a 2,8 m del fuego');
  ok(ls.every((q) => q.z - 20 < 0), 'de costado y atrás: nunca adelante (donde te parás vos)');
  ok(ls.every((q) => Math.hypot(q.x - 10, q.z - 21.8) > 3.6), 'parado adelante (a 1,8 m), ninguno queda a tiro de charla: E es para el asado');
  ok(ls.every((q) => Math.abs(Math.atan2(10 - q.x, 20 - q.z) - q.mira) < 1e-9), 'mirando al fuego');
  const girado = C.lugaresAlrededor(0, 0, Math.PI / 2, 1)[0];
  ok(Math.abs(Math.hypot(girado.x, girado.z) - 2.8) < 1e-9 && girado.x < 0, 'con la obra girada, gira la ronda');
}

// ---------------------------------------------------------------- el recetario y el trueque
{
  const coc = C.cocinaNueva();
  ok(C.sabe(coc, 'asado') && C.sabe(coc, 'pan-casero') && C.sabe(coc, 'empanadas') && !C.sabe(coc, 'locro'), 'de entrada: el asado, el pan y las empanadas');
  ok(C.aprender(coc, 'locro', 'abuela', 4) && !C.aprender(coc, 'locro', 'madre', 5) && coc.sabe.locro.de === 'abuela', 'la abuela enseña el locro (una vez)');
  ok(!C.aprender(coc, 'inventada', 'x', 1), 'no se aprende lo que no existe');
  ok(/abuela Herminia/.test(C.pistaReceta(R.locro)) && /haciéndola/.test(C.pistaReceta(R.locro)), 'la pista dice quién enseña y que se aprende haciéndola');
  const cuanto = (tipo, k) => ({ material: { tronco: 5 }, entrada: {}, cosa: {} })[tipo][k] || 0;
  const lista = C.cambiosDe('padre', coc, 3, cuanto);
  ok(lista.length === 2 && lista[0].alcanza && /2 kilos de carne de vaca por 3 troncos \(tenés 5\)/.test(lista[0].titulo), 'Mario: carne por troncos');
  const r = C.cambiar('padre', 0, coc, 3, cuanto);
  ok(r.ok && r.efectos[0].k === 'tronco' && r.efectos[0].n === -3 && r.efectos[1].k === 'carne-vaca' && r.efectos[1].n === 2, 'el cambio: tres troncos menos, dos kilos de carne');
  ok(!C.cambiar('padre', 1, coc, 3, cuanto).ok && C.cambioHoy(coc, 'padre', 3) && !C.cambioHoy(coc, 'padre', 4), 'una vez por día');
  ok(!C.cambiar('madre', 0, coc, 3, cuanto).ok, 'sin papas, Gladys no cambia el zapallo');
  ok(C.cambiosDe('nadie', coc, 3, cuanto).length === 0, 'los que no tienen nada para cambiar');
}

// ---------------------------------------------------------------- la alacena, comer, la mochila
{
  const p = P({ asado: 2, 'mermelada-cereza': 1, 'pan-casero': 3 }, { azucar: 2, harina: 1 });
  const a = C.alacenaDe(p);
  ok(a.map((x) => x.forma).join() === 'frasco,paquete,paquete,pan,fuente', `la alacena, acomodada: frascos, paquetes, panes, fuentes (${a.map((x) => x.id)})`);
  ok(C.alacenaDe(P()).length === 0, 'vacía');
  const e = C.efectoDeComer('chocolate-caliente', true), e2 = C.efectoDeComer('chocolate-caliente', false), e3 = C.efectoDeComer('asado');
  ok(e.calor && e.descanso === 2 && e2.descanso === 1 && e3.descanso === 3 && e3.calor, 'comer: calor y buen paso (más en invierno el chocolate)');
  ok(C.efectoDeComer('pan-casero') === null, 'el pan y las empanadas se comen como siempre (main.js)');
  for (const id of Object.keys(C.COMIDAS)) ok(ENTRADA[id]?.seccion === 'recetas', `${id}: en el cuaderno, en «Al fuego»`);
  const ranuras = C.ranurasCocina(P({ asado: 1, leche: 2 }, { azucar: 1 }), new Set(['leche']));
  ok(ranuras.some((r) => r.id === 'asado' && r.accion === 'comer') && ranuras.some((r) => r.id === 'azucar') && !ranuras.some((r) => r.id === 'leche'), 'la mochila: lo de la cocina, sin repetir lo que ya tiene casilla (la de la granja)');
  usarModoGuardado('relax', 1);
  const pr = progresoNuevo();
  pr.entradas.asado = { dia: 1, hora: 9, cantidad: 2 }; pr.cosas.cacao = 1;
  const m = armarMochila(pr, {});
  ok(m.filter((r) => r.id === 'asado').length === 1 && m.some((r) => r.id === 'cacao'), 'en la mochila de verdad, una vez cada cosa');
  pr.modo = 'desafio';
  ok(!armarMochila(pr, {}).some((r) => r.id === 'asado'), 'en el Desafío no hay cocina');
}

// ---------------------------------------------------------------- el guardado
{
  usarModoGuardado('relax', 1);
  ok(JSON.stringify(progresoNuevo().cocina) === JSON.stringify(C.cocinaNueva()), 'partida nueva: la cocina vacía');
  usarModoGuardado('desafio', 1);
  ok(progresoNuevo().cocina === undefined, 'en el Desafío, ninguna');
  usarModoGuardado('relax', 1);
  ok(JSON.stringify(C.sanearCocina(undefined, 5)) === JSON.stringify(C.cocinaNueva()), 'partida vieja (sin cocina): vacía');
  const roto = C.sanearCocina({ sabe: { locro: { dia: 1e12, de: '<script>' }, x: 1, asado: 'si' }, cambios: { padre: -4, nadie: 3, jefe: 1e9 }, hechas: { asado: 1e20, nope: 3 },
    moviles: { 'vagon-comedor': { receta: 'chocolate-caliente', paso: 99, falta: -3 }, '../x': {}, 'mal': { receta: 'nada' } }, perro: 'x', sobremesa: { x: 1e9, z: 0, hasta: 5, claves: ['jefe'] } }, 7);
  ok(roto.sabe.locro.dia === 7 && roto.sabe.locro.de === 'hecha' && roto.sabe.asado && !roto.sabe.x, 'lo aprendido: fechas posibles, quién enseñó saneado, recetas que existen');
  ok(roto.cambios.padre === 1 && roto.cambios.jefe === 7 && !roto.cambios.nadie, 'los trueques del día: fechas posibles, sólo vecinos que cambian');
  ok(roto.hechas.asado === 1e6 && !roto.hechas.nope && roto.perro === 0 && roto.sobremesa === null, 'números acotados, sobremesa imposible fuera');
  ok(Object.keys(roto.moviles).join() === 'vagon-comedor' && roto.moviles['vagon-comedor'].paso === 2 && roto.moviles['vagon-comedor'].falta === 0, 'las estaciones móviles, saneadas (la cocción dentro de sus pasos)');
  ok(C.sanearCoccion(null) === null && C.sanearCoccion({ receta: 'x' }) === null && C.sanearCoccion('asado') === null, 'una cocción rota se olvida');
  const cc = C.sanearCoccion({ receta: 'mermeladas', paso: 1, falta: 9, variante: 'kiwi', invitados: ['jefe', '<b>', 'a', 'b', 'c'], desde: 1e10 }, 4);
  ok(cc.variante === 'frambuesa' && cc.falta === 0.5 && cc.invitados.length === 3 && !cc.invitados.includes('<b>') && cc.desde === 4, 'una cocción a medias, saneada');
  const g = leer('src/guardado.js');
  ok(g.includes("cocina: sanearCocina(p.cocina, Math.max(1, Math.floor(finito(p.dia, 1)))),") && g.includes('...(desafio ? {} : { cocina: cocinaNueva() }),') && g.includes('amor: undefined, cocina: undefined'), 'guardado.js: la cocina (y en el Desafío, no)');
  ok(g.includes('if (d.coccion !== undefined) { const c = sanearCoccion(d.coccion); if (c) d.coccion = c; else delete d.coccion; }'), 'guardado.js: lo que se cocina en una obra, saneado');
}

// ---------------------------------------------------------------- la estación móvil (3.7.3: el vagón comedor)
{
  const v = C.estacionMovil({ id: 'vagon-comedor', tipo: 'cocina-lena', techo: true, nombre: 'La cocina del vagón comedor' });
  ok(v && v.movil && v.tipo === 'cocina-lena' && v.clave === 'movil:vagon-comedor' && v.nombre === 'La cocina del vagón comedor', 'se arma una estación móvil');
  ok(C.estacionMovil({ id: '', tipo: 'cocina-lena' }) === null && C.estacionMovil({ id: 'x', tipo: 'nave' }) === null, 'con id y un tipo que exista');
  const p = P({ leche: 2 }, { cacao: 1, azucar: 1 });
  const r = C.empezar('chocolate-caliente', v, p, 1, { lluvia: 1 });
  ok(r.ok, 'en el vagón (con techo) se cocina aunque llueva');
  const parrillaMovil = C.estacionMovil({ id: 'p', tipo: 'parrilla', techo: false });
  ok(!C.empezar('asado', parrillaMovil, P({ 'carne-vaca': 2, chorizo: 2 }, { sal: 1 }), 2, { lluvia: 1 }).ok, 'una parrilla móvil sin techo, con lluvia, no');
}

// ---------------------------------------------------------------- el cuaderno y el almacén
ok(new Set(ENTRADAS.map((e) => e.id)).size === ENTRADAS.length, 'el cuaderno sin ids repetidos');
for (const e of C.ENTRADAS_COCINA) ok(ENTRADA[e.id] === e && e.pista && e.texto, `${e.id}: en el cuaderno, con pista y texto`);
ok(!C.ENTRADAS_COCINA.some((e) => C.DE_LA_GRANJA.includes(e.id)), 'las entradas de lo de la granja son de la granja (no se pisan)');

// ---------------------------------------------------------------- los planos y lo que se ve (three de verdad, en un vm)
const src = path.join(raiz, 'src');
const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const info = new Map(), orden = [], visitando = new Set(), visto = new Set();
function visitar(archivo) {
  archivo = path.resolve(archivo);
  if (visto.has(archivo)) return;
  if (visitando.has(archivo)) throw Error('ciclo ' + archivo);
  visitando.add(archivo);
  const texto = fs.readFileSync(archivo, 'utf8'), deps = [];
  for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) { if (m[2] === 'three') continue; deps.push(normalizar(archivo, m[2])); }
  info.set(archivo, texto);
  for (const d of deps) visitar(d);
  visitando.delete(archivo); visto.add(archivo); orden.push(archivo);
}
visitar(path.join(src, 'construccion.js'));
visitar(path.join(src, 'cocina-mundo.js'));
function transformar(archivo, texto) {
  const ex = [];
  for (const m of texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) ex.push(m[1]);
  texto = texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  texto = texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_t, nombres, spec) => {
    const partes = nombres.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); });
    return `const { ${partes.join(', ')} } = ${idModulo(normalizar(archivo, spec))};`;
  });
  texto = texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  texto = texto.replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm, '');
  return `const ${idModulo(archivo)}=(()=>{\n${texto}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
}
let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
for (const f of orden) code += transformar(f, info.get(f)) + '\n';
code += `
;globalThis.__R372=(()=>{
  const PC = __mod_planos_cocina, CO = __mod_construccion, G = __mod_geometria, CM = __mod_cocina_mundo;
  const out = { planos: [], mundo: null };
  const tiposDe = (g) => [...new Set(Array.from(g.getAttribute('aTipo')?.array || []))];
  for (const p of PC.PIEZAS_COCINA) {
    const P = CO.PLANO[p.id];
    const c = new G.Constructor(); for (const e of P.etapas) e.arma(c, P, {}, null); const g = c.geometria();
    out.planos.push({ id: p.id, verts: g.attributes.position.count, tipos: tiposDe(g), categoria: P.categoria, soloRelax: !!P.soloRelax, etapas: P.etapas.length, cubre: !!P.cubreArea, apoya: !!P.apoyaEnPlataforma, fisica: typeof P.fisica === 'function' });
  }
  { const P = CO.PLANO.horno; const c = new G.Constructor(); for (const e of P.etapas) e.arma(c, P, {}, null); out.horno = { tipos: tiposDe(c.geometria()) }; }
  // lo que se ve: una estación de cada una con algo al fuego, y una alacena
  const escena = new THREE.Scene(), mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const obra = (id, x, coccion) => ({ plano: { id, etapas: [1] }, datos: { x, y: 0, z: 0, rot: 0, etapas: 1, coccion }, grupo: { position: new THREE.Vector3(x, 0, 0), rotation: { y: 0 } } });
  const c1 = { receta: 'asado', paso: 2, falta: 1, invitados: [], robado: false }, c2 = { receta: 'pan-casero', paso: 1, falta: 1 }, c3 = { receta: 'locro', paso: 3, falta: 1 };
  const est = [obra('parrilla', 0, c1), obra('horno', 6, c2), obra('cocina-lena', 12, c3)];
  const alacena = obra('alacena', 18, null);
  const humoDe = (c) => __mod_cocina_pasos.humoDe(c);
  const progreso = { entradas: { 'mermelada-cereza': { cantidad: 3 }, asado: { cantidad: 2 }, 'pan-casero': { cantidad: 2 }, locro: { cantidad: 1 } }, cosas: { harina: 2, azucar: 1 } };
  const M = CM.crearCocinaMundo({ escena, mat, progreso: () => progreso, obras: () => ({ obras: [...est, alacena] }), camara: () => ({ x: 6, z: 4 }), noche: () => 0.7, viento: () => 0.3,
    cocina: () => ({ estadoMundo: () => est.map((o) => ({ o, tipo: o.plano.id, coccion: o.datos.coccion, humo: humoDe(o.datos.coccion) })) }) });
  const enSemillas = []; escena.traverse((o) => { if (o.isMesh && o.material !== mat) enSemillas.push(o.material.type); });
  M.trasCompilar();
  M.actualizar(0.1); M.actualizar(0.6);
  const tipos = new Set(); let conMat = 0, propios = 0;
  M.raiz.traverse((o) => { if (o.isMesh && o.visible) { if (o.material === mat) { conMat++; for (const t of tiposDe(o.geometry)) tipos.add(t); } else propios++; } });
  out.mundo = { medir: M.medir(), tipos: [...tipos], conMat, propios, semillas: enSemillas, materiales: Object.keys(M.materiales) };
  // el robo: con un chorizo menos
  c1.robado = true; M.refrescar(); M.actualizar(0.6);
  out.mundo.robado = M.medir();
  // sin nada al fuego: nada (sólo la alacena)
  for (const o of est) o.datos.coccion = null; M.refrescar(); M.actualizar(0.6);
  out.mundo.apagado = M.medir();
  return out;
})();`;
const ctx = { console, Math, Date, JSON, Array, Object, Number, String, Boolean, Map, Set, WeakMap, WeakSet, Symbol, Error, TypeError, RangeError, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, ArrayBuffer, DataView, Promise, Proxy, Reflect, parseInt, parseFloat, isFinite, isNaN, performance, setTimeout, clearTimeout };
ctx.globalThis = ctx; ctx.self = ctx; ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'v372.js', timeout: 30000 });
const V = JSON.parse(JSON.stringify(ctx.__R372));
const plano = Object.fromEntries(V.planos.map((p) => [p.id, p]));
ok(['parrilla', 'techito-parrilla', 'cocina-lena', 'alacena'].every((id) => plano[id]), 'cuatro planos nuevos: la parrilla con cruz, su techito, la cocina a leña y la alacena');
for (const p of V.planos) {
  ok(p.tipos.length && p.tipos.every((t) => t === 0 || t === 4), `${p.id}: sólo material tipo 0 o 4 (${p.tipos})`);
  ok(p.soloRelax && p.etapas === 1 && p.fisica && p.verts > 100, `${p.id}: pieza del Relax, con física`);
}
ok(V.horno.tipos.every((t) => t === 0 || t === 4), 'el horno de barro rehecho, tipo 0 o 4');
ok(plano['techito-parrilla'].cubre && plano['cocina-lena'].apoya && plano.alacena.apoya && plano.parrilla.categoria === 'exterior', 'el techito cubre (abajo no llueve); la cocina y la alacena van adentro');
const MU = V.mundo;
ok(MU.tipos.every((t) => t === 0 || t === 4) && MU.conMat >= 5, `lo que se ve con el material de las estructuras: tipo 0 o 4 (${MU.tipos}, ${MU.conMat} mallas)`);
ok(MU.semillas.length === 2 && MU.semillas.every((t) => t === 'MeshBasicMaterial'), 'el fuego y las brasas tienen semilla para compilarse en la carga');
ok(MU.medir.humo >= 30 && MU.medir.luz > 0 && MU.medir.alacenas === 1, `humo de las tres, la luz del fuego y la alacena (${JSON.stringify(MU.medir)})`);
ok(MU.medir.mallas <= 16, `pocas mallas para tres estaciones encendidas y la alacena (${MU.medir.mallas})`);
ok(MU.robado.tris < MU.medir.tris, 'robado el chorizo, hay uno menos en la parrilla');
ok(MU.apagado.humo === 0 && MU.apagado.luz === 0 && MU.apagado.alacenas === 1, 'sin nada al fuego: ni humo ni luz (la alacena sigue)');

// ---------------------------------------------------------------- los enganches
const main = leer('src/main.js');
ok(main.includes("import { crearCocinaJuego } from './cocina-juego.js';") && main.includes("import { crearCocinaMundo } from './cocina-mundo.js';") && main.includes('OBRAS_QUE_TRABAJAN.push(...PLANOS_COCINA_E);'), 'main.js: la cocina, con las obras que trabajan');
ok(main.includes('if (cocinaJuego?.esDeCocina(o) && cocinaJuego.activo()) return cocinaJuego.aviso(o);') && main.includes('if (cocinaJuego?.esDeCocina(o) && cocinaJuego.activo() && cocinaJuego.usar(o)) { refrescarBarra(true); return; }'), 'main.js: el aviso y la tecla E, con la misma función y el mismo orden');
ok(main.includes('// 3.7.2: la cocina en pasos: la parrilla con cruz, la cocina a leña y la alacena van por el mismo camino (aviso y'), 'main.js: el comentario de la prioridad compartida');
ok(main.includes("if (cocinaJuego?.panelAbierto()) { cocinaJuego.cerrarPanel(); break; }") && main.includes("else if (cocinaJuego?.panelAbierto()) cocinaJuego.cerrarPanel();") && main.split("cocinaJuego.elegirPanel(Number(codigo.slice(5)) - 1); break; }").length === 3, 'main.js: el panel de recetas con E, Escape y los números');
ok(main.includes('amorDestino: (k) => amorMundo?.destino(k) || cocinaJuego?.destino(k) || null,') && main.includes("mundoPerro.antojo = !desafio && modo === 'jugando' ? cocinaJuego?.antojoPerro() || null : null;"), 'main.js: los vecinos por el olor (después del amor) y el perro');
ok(main.includes("if (cocinaJuego?.comer(r.id)) break;") && main.includes("pestanas.push(['recetario', 'Recetario'])") && main.includes('cocinaMundo?.trasCompilar();'), 'main.js: comer, el recetario y las semillas');
ok(main.includes("try { if (modo === 'jugando' && !desafio) { cocinaJuego?.actualizar(dt); cocinaMundo?.actualizar(dt); } } catch (e) { fallaSistema('cocina', e); }"), 'main.js: la cocina corre aislada (fallaSistema), sólo en el Relax');
ok(leer('src/vecindad-juego.js').includes('for (const o of ctx.cocina?.opciones?.(s.clave) || []) lista.push(o);'), 'vecindad-juego.js: la receta y el trueque en el menú de la charla');
const perro = leer('src/perro.js');
ok(perro.includes("} else if (mundo?.antojo) {") && /mundo\?\.rastro\) \{[\s\S]*mundo\?\.antojo\) \{/.test(perro), 'perro.js: el antojo del asado, después de rastrear');
ok(leer('src/plantilla.html').includes('<div class="trueque oculto" id="cocina-panel">'), 'el panel de recetas en la plantilla');
ok(leer('src/mochila.js').includes('for (const r of ranurasCocina(progreso, ya)) ranuras.push(r);'), 'mochila.js: lo de la cocina en la barra');
ok(leer('src/construccion.js').includes('PIEZAS.push(...PIEZAS_COCINA);'), 'construccion.js: los planos de la cocina');
for (const f of ['src/cocina-pasos.js', 'src/cocina-juego.js', 'src/cocina-mundo.js', 'src/planos-cocina.js']) {
  const t = leer(f);
  ok(/^\/\/ 3\.7\.2:/.test(t), `${f}: comentario con la versión`);
  ok(!/^export\s+(async\s+function|function\*)|^export\s+\{[^}]*\}\s+from|^export\s+\*/m.test(t), `${f}: exports que armar.mjs entiende`);
  ok([...t.matchAll(/^import .*$/gm)].every((m) => /^import (\{ [^}]+ \}|\* as THREE) from '[^']+';$/.test(m[0])), `${f}: imports de una línea`);
  ok(!/\r/.test(fs.readFileSync(path.join(raiz, f), 'utf8')), `${f}: fines de línea LF`);
}
for (const k of Object.keys(C)) ok(!/ñ/.test(k), `export sin eñe: ${k}`);
ok(leer('package.json').includes('node pruebas/verificar-3-7-2-cocina.mjs'), 'la prueba está en el gate');
console.log(`OK 3.7.2 cocina · ${n} comprobaciones · ${C.RECETAS_PASOS.length} recetas en pasos, 3 estaciones, lluvia y techito, humo, vecinos, perro, alacena, recetario, trueque, guardado y estación móvil`);
