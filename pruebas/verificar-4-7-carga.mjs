// 4.7 carga: el límite de la mochila con casillas (src/carga.js) y los puntos de entrada que lo respetan.
// Parte 1: las reglas puras (capacidad, pilas, sobrecarga, lugarPara, tratoCabe, alforjas, el Desafío intacto).
// Parte 2: los puntos de entrada del juego, con un mundo de mentira (funciones reales de main.js y de los módulos).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { expresion, funcion, enUnaLinea } from './ayuda-codigo.mjs';
import * as C from '../src/carga.js';
import { sacarDePuesto, guardarEnPuesto, PUESTOS_RUTA } from '../src/puestos-ruta.js';
import { troncosAlTalar } from '../src/oficios.js';

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

const relax = (extra = {}) => ({ modo: 'relax', materiales: {}, entradas: {}, cosas: {}, ...extra });
const desafio = (extra = {}) => ({ modo: 'desafio', materiales: {}, entradas: {}, cosas: {}, ...extra });
const ent = (c) => ({ dia: 1, hora: 9, cantidad: c });

// ---------------------------------------------------------------- 1. capacidad y pilas
{
  eq([C.CASILLAS_BASE, C.CASILLAS_ALFORJAS, C.CASILLAS_CARRO], [24, 12, 0], 'la mochila tiene 24 casillas, las alforjas suman 12 y el carro (que no existe) 0');
  eq(C.capacidad(relax()), { base: 24, alforjas: 0, carro: 0, total: 24 }, 'capacidad base');
  eq(C.capacidad(relax({ personal: { caballo: { conAlforjas: true } } }), { montado: true }).total, 36, 'a caballo y con alforjas: 36');
  eq(C.capacidad(relax({ personal: { caballo: { conAlforjas: true } } }), { montado: false }).total, 24, 'a pie, las alforjas no suman');
  eq(C.capacidad(relax({ personal: { caballo: { conAlforjas: false } } }), { montado: true }).total, 24, 'montado sin alforjas: 24');
  eq(C.capacidad(relax(), { montado: true }).alforjas, 0, 'montado sin elegir alforjas en Personalizar: nada');
  eq([C.pilaMax('tronco'), C.pilaMax('piedra'), C.pilaMax('piedra-cantera')], [10, 10, 10], 'troncos y piedras: 10');
  eq([C.pilaMax('tabla'), C.pilaMax('arcilla'), C.pilaMax('cuero')], [20, 20, 20], 'tablas, arcilla y cuero: 20');
  ok(['junco', 'hierbas', 'lana', 'huevo', 'pinon', 'yerba', 'harina'].every((k) => C.pilaMax(k) >= 30 && C.pilaMax(k) <= 50), 'lo liviano y la comida: de 30 a 50');
  eq(C.pilaMax('cosa-que-no-existe'), 30, 'lo desconocido: 30');
  eq(C.pilaMax('constructor'), 30, 'un nombre como «constructor» no rompe (Object.hasOwn)');
  ok(!C.esCargable('ramita') && C.esCargable('tronco') && C.esCargable('miel'), 'las ramitas (tope propio de 12) no ocupan casillas; los materiales y la comida sí');
}

// ---------------------------------------------------------------- 2. ocupación: las pilas y los tres lugares
{
  const p = relax({ materiales: { tronco: 25, tabla: 3 }, entradas: { pinon: ent(51), huevo: ent(0), amancay: ent(0) }, cosas: { hacha: true, pico: 1, yerba: 7, farol: true, poncho: 2 } });
  const o = C.ocupacion(p);
  const pilas = Object.fromEntries(o.casillas.map((x) => [x.k, x.pilas]));
  eq(pilas, { tronco: 3, tabla: 1, pinon: 2, yerba: 1, poncho: 1 }, 'cuenta materiales, entradas con cantidad y contadores de cosas; las herramientas y lo anotado en cero, no');
  eq([o.usadas, o.libres, o.total], [8, 16, 24], 'casillas usadas, libres y total');
  eq(o.sobrecarga, {}, 'sin sobrecarga');
  // la misma clave en dos lugares (la cocina cuenta lo juntado más las cosas) se junta en una sola pila
  const q = relax({ entradas: { harina: ent(20) }, cosas: { harina: 25 } });
  eq(C.ocupacion(q).casillas.find((x) => x.k === 'harina'), { k: 'harina', n: 45, pilas: 1, max: 50 }, 'harina en entradas y en cosas: una sola pila');
}

// ---------------------------------------------------------------- 3. la partida vieja: 989 troncos
{
  const p = relax({ materiales: { tronco: 989, tabla: 3, piedra: 12 }, entradas: { pinon: ent(3) } });
  const antes = JSON.stringify(p);
  const o = C.ocupacion(p);
  ok(o.usadas > o.total, 'con 989 troncos hay más casillas usadas que las que tiene la mochila');
  ok(o.sobrecarga.tronco > 0 && Object.keys(o.sobrecarga).every((k) => k === 'tronco'), 'la sobrecarga se la lleva la pila grande (los troncos), no las tres tablas ni los piñones');
  const caben = Math.floor((o.total - 1 - 1 - 2) / 1) * 10;   // 24 casillas menos tablas (1), piedra (2) y piñones (1)
  eq(989 - o.sobrecarga.tronco, caben, 'lo que no es sobrecarga es lo que entra en las casillas que quedan');
  eq(JSON.stringify(p), antes, 'ocupacion no toca la partida: no se recorta ni se borra nada');
  eq(p.materiales.tronco, 989, 'los 989 troncos siguen ahí');
  eq(C.lugarPara(p, 'tronco', 5), 0, 'en sobrecarga no entra nada más');
  eq(C.lugarPara(p, 'pinon', 5), 0, 'ni siquiera en una pila a medias');
  eq(C.tratoCabe(p, { tabla: 1 }, {}).ok, false, 'un trato que suma, rechazado');
  ok(C.tratoCabe(p, { tabla: 1 }, { tronco: 500 }).ok, 'un trato que gasta mucho más de lo que suma, entra (se baja del límite de a poco)');
  // se gasta construyendo: al bajar del límite, vuelve a entrar
  p.materiales.tronco = 120;
  eq(C.ocupacion(p).sobrecarga, {}, 'con 120 troncos (12 casillas) ya no hay sobrecarga');
  ok(C.lugarPara(p, 'tronco', 5) > 0, 'bajando del límite se puede juntar de nuevo');
}

// ---------------------------------------------------------------- 4. lugarPara
{
  const vacia = relax();
  eq(C.lugarPara(vacia, 'tronco', 1000), 240, 'mochila vacía: 24 casillas de 10 troncos');
  eq(C.lugarPara(vacia, 'tabla', 1000), 480, 'tablas: 24 × 20');
  eq(C.lugarPara(vacia, 'tronco', 7), 7, 'nunca más de lo que se pide');
  eq(C.lugarPara(vacia, 'tronco', 0), 0, 'cero pide cero');
  eq(C.lugarPara(vacia, 'tronco', -4), 0, 'negativo no suma');
  const p = relax({ materiales: { tronco: 23 } });   // 3 casillas, la última con 3 (le caben 7)
  eq(C.lugarPara(p, 'tronco', 1000), 7 + 21 * 10, 'el hueco de la pila a medias más las casillas libres');
  const casiLlena = relax({ materiales: { piedra: 230 } });   // 23 casillas llenas
  eq(C.lugarPara(casiLlena, 'tronco', 100), 10, 'queda una casilla libre: una pila de troncos');
  eq(C.lugarPara(casiLlena, 'piedra', 100), 10, 'las pilas de piedra están llenas: sólo entra en la casilla libre');
  eq(C.lugarPara(relax({ materiales: { piedra: 240 } }), 'piedra', 100), 0, 'con las 24 casillas llenas no entra más');
}

const main = leer('src/main.js');
function armarMundo(progreso, extra = {}) {
  const avisos = [];
  const base = {
    progreso, avisos, MATERIALES: { tronco: { nombre: 'troncos' }, tabla: { nombre: 'tablas' }, piedra: { nombre: 'piedras' } }, INGREDIENTES: {}, ENTRADA: {},
    lugarPara: C.lugarPara, tratoCabe: C.tratoCabe, textoLugares: C.textoLugares,
    jugador: { estado: { montado: extra.montado ? {} : null } },
    nota: (t, s) => avisos.push([t, s]),
  };
  const env = { ...base, ...extra };
  env.ctxCarga = expresion(main, 'const ctxCarga = ', env);
  env.lugarEn = expresion(main, 'const lugarEn = ', env);
  env.nombreCarga = funcion(main, 'nombreCarga', env);
  env.cabeJuntar = funcion(main, 'cabeJuntar', env);
  env.cabeTrato = funcion(main, 'cabeTrato', env);
  return env;
}

// ---------------------------------------------------------------- 5. un trato entero (tratoCabe) y tratoDeEfectos
{
  const p = relax({ materiales: { tronco: 230 } });   // 23 casillas
  eq(C.tratoCabe(p, { tabla: 20 }, {}), { ok: true, faltan: 0 }, 'entra: queda una casilla');
  eq(C.tratoCabe(p, { tabla: 21 }, {}), { ok: false, faltan: 1 }, 'no entra: falta 1 casilla');
  eq(C.tratoCabe(p, { tabla: 61 }, {}), { ok: false, faltan: 3 }, 'faltan 3 casillas (61 tablas son 4 pilas y queda 1)');
  ok(C.tratoCabe(p, { tabla: 21 }, { tronco: 10 }).ok, 'descontando lo que sale (un tronco menos libera casilla) entra');
  ok(C.tratoCabe(p, { yerba: 1, pinon: 1 }, { tronco: 20 }).ok, 'dos cosas nuevas, dos casillas libradas');
  eq(C.tratoCabe(p, { tabla: 20, pinon: 1 }, {}).ok, false, 'dos casillas nuevas con una libre: no');
  ok(C.tratoCabe(p, { cosa_rara_no_contable: 30 }, {}).ok && !C.tratoCabe(p, { cosa_rara_no_contable: 31 }, {}).ok, 'lo desconocido ocupa una casilla de 30');
  const x = C.tratoDeEfectos([
    { tipo: 'material', k: 'tabla', n: 4 }, { tipo: 'entrada', k: 'huevo', n: -2 }, { tipo: 'cosa', k: 'yerba', n: 3 },
    { tipo: 'cosa', k: 'hacha', n: 1 }, { tipo: 'pesos', k: 'x', n: 10 }, { tipo: 'jugador', k: 'y', n: 1 }, null, { tipo: 'material', k: 'tronco', n: 0 },
  ]);
  eq(x, { da: { tabla: 4, yerba: 3 }, quita: { huevo: 2 } }, 'efectos → lo que entra y lo que sale (una herramienta en cosas, los pesos y lo demás no cuentan)');
}

// ---------------------------------------------------------------- 6. el Desafío no cambia
{
  const d = desafio({ materiales: { tronco: 999, tabla: 400, piedra: 100 }, entradas: { pinon: ent(70) } });
  eq(C.capacidad(d).total, Infinity, 'el Desafío no tiene límite');
  eq(C.lugarPara(d, 'tronco', 5000), 5000, 'lugarPara: siempre n');
  eq(C.lugarPara(d, 'tabla', 1), 1, 'también con la mochila cargada de más');
  ok(C.tratoCabe(d, { tronco: 99999 }, {}).ok, 'tratoCabe: siempre entra');
  eq(C.ocupacion(d).sobrecarga, {}, 'sin sobrecarga');
  // los puntos del juego que miran el límite van por estas mismas funciones: en el Desafío no frenan nada
  const mundo = armarMundo(desafio({ materiales: { tronco: 999 } }));
  ok(mundo.cabeJuntar('tronco', 500) && mundo.cabeTrato({ tabla: 5000 }), 'cabeJuntar y cabeTrato del juego: en el Desafío, siempre');
  eq(mundo.avisos.length, 0, '…y sin avisos');
}

// ---------------------------------------------------------------- 8. los puntos de entrada del juego (funciones reales de main.js)
{
  // el aviso de mochila llena y el de «no te entra»
  const lleno = relax({ materiales: { tronco: 240 } });
  const m = armarMundo(lleno);
  eq(m.cabeJuntar('tronco', 6), false, 'cabeJuntar: lleno, no entra');
  eq(m.avisos[0][0], 'Mochila llena: no te entra más troncos', 'el aviso del mundo: una línea clara');
  eq(m.cabeTrato({ tabla: 3 }), false, 'cabeTrato: no entra');
  eq(m.avisos[1][0], 'No te entra: te falta 1 lugar', 'el aviso de un trato: te faltan N lugares (en singular con uno)');
  const m2 = armarMundo(relax({ materiales: { tronco: 230 }, entradas: { pinon: ent(1) } }));
  eq(m2.cabeTrato({ lana: 31, miel: 1 }), false, 'dos casillas más con ninguna libre');
  ok(/^No te entra: te faltan 3 lugares$/.test(m2.avisos[0][0]), 'en plural con varios: «te faltan 3 lugares»');
  const vacio = armarMundo(relax());
  ok(vacio.cabeJuntar('tronco', 240) && !vacio.cabeJuntar('tronco', 241), 'cabeJuntar: justo el límite entra, uno más no');
  // las alforjas: a caballo y con alforjas, hay lugar
  const conAlforjas = relax({ materiales: { tronco: 240 }, personal: { caballo: { conAlforjas: true } } });
  ok(!armarMundo(conAlforjas).cabeJuntar('tabla', 1), 'a pie con alforjas puestas en el caballo: sigue lleno');
  ok(armarMundo(conAlforjas, { montado: true }).cabeJuntar('tabla', 240), 'montado con alforjas: 12 casillas más (240 tablas)');
}

// aserrar: el tronco que se asierra libera su lugar (cuenta neta)
function correrAserrar(progreso, banco = false) {
  const m = armarMundo(progreso, {
    puedeAserrar: () => true, enBancoAserrar: () => banco, tablasAMano: () => 2, TABLAS_A_MANO: 2, TABLAS_BANCO: 4, nivelDe: () => 0,
    sumarMaterial: (k, v) => { progreso.materiales[k] = (progreso.materiales[k] || 0) + v; },
    sonido: { paso() {} }, cuantas: (a, b, c) => `${a} ${c}`, material: (k) => progreso.materiales[k] || 0, registrar() {}, ganarOficio() {}, XP: { aserrar: 1 }, guardar() {},
  });
  funcion(main, 'aserrar', m)();
  return m;
}
{
  // 23 casillas de piedra + 1 tronco: queda lleno; aserrar libera la casilla del tronco y entran las tablas
  const p = relax({ materiales: { piedra: 230, tronco: 1 } });
  const m = correrAserrar(p);
  eq([p.materiales.tronco, p.materiales.tabla], [0, 2], 'lleno, con un solo tronco: aserrar entra (el tronco libera su lugar)');
  ok(!m.avisos.some((a) => /No te entra|Mochila llena/.test(a[0])), '…sin avisos de mochila llena');
  // sin ningún lugar que liberar: 23 casillas de piedra, una de tablas llena y una de troncos = 25 (sobrecarga)
  const r = relax({ materiales: { piedra: 230, tabla: 20, tronco: 10 } });   // 23 + 1 + ...
  const antesR = JSON.stringify(r);
  const mr = correrAserrar(r);
  eq(JSON.stringify(r), antesR, 'en sobrecarga y sin casilla que se libere, el aserrado no hace nada');
  ok(mr.avisos.length === 1 && /^No te entra/.test(mr.avisos[0][0]), 'y avisa');
}

// talar y picar: con la mochila llena el recurso del mundo no se toca
function correrHacha(progreso, objetivo, extra = {}) {
  const golpes = new Map();
  const llamadas = { talar: 0, despejar: 0, hachazo: 0, picazo: 0, registrar: 0 };
  const m = armarMundo(progreso, {
    objetivoHacha: () => objetivo, tieneHacha: () => true, tienePico: () => true, desafio: null,
    golpesTala: golpes, golpesPico: golpes, golpesParaTalarAhora: () => 1, golpesParaPicarAhora: () => 1,
    nivelDe: () => 0, troncosAlTalar, TRONCOS_TALA: 4, TRONCOS_MATA: 2, PIEDRA_MATA: 3, extraDePiedra: () => 0, extraDeMata: () => 0, RAYO: { troncos: 6 },
    jugador: { estado: { pos: { x: 0, y: 0, z: 0 }, montado: null } },
    sonido: { hachazo() { llamadas.hachazo++; }, picazo() { llamadas.picazo++; }, arbolCae() {}, paso() {} },
    veg: { arboles: [], sacudir() {}, talar() { llamadas.talar++; }, despejar() { llamadas.despejar++; } },
    T: { altura: () => 0 }, anotarTalado() {}, anotarPicadoEn() {}, picados: () => [], gastarFilo() {}, registrar() { llamadas.registrar++; }, ganarOficio() {}, XP: { tala: 1, roca: 1, mata: 1, golpe: 1 },
    sumarMaterial: (k, v) => { progreso.materiales[k] = (progreso.materiales[k] || 0) + v; }, material: (k) => progreso.materiales[k] || 0,
    guardar() {}, ...extra,
  });
  funcion(main, 'usarHacha', m)();
  return { m, llamadas };
}
{
  const arbol = { x: 1, z: 1, especie: 'coihue' };
  // lleno: la tala no empieza (ni un hachazo) y el árbol sigue en pie
  const llena = relax({ materiales: { tronco: 240 } });
  const a = correrHacha(llena, { tipo: 'tronco', arbol, talar: true, protegido: false, golpes: 0 });
  eq([a.llamadas.hachazo, a.llamadas.talar, llena.materiales.tronco], [0, 0, 240], 'lleno: no hay ni un hachazo y el árbol no cae');
  eq(a.m.avisos[0][0], 'Mochila llena: no te entra más troncos', 'avisa');
  // con lugar: tala y suma
  const libre = relax({ materiales: { tronco: 10 } });
  const b = correrHacha(libre, { tipo: 'tronco', arbol, talar: true, protegido: false, golpes: 0 });
  eq([b.llamadas.talar, libre.materiales.tronco], [1, 14], 'con lugar: se tala y suma los 4 troncos');
  // sin lugar para el rendimiento completo (3 libres, rinde 4): no se tala
  const casi = relax({ materiales: { tronco: 237 } });
  const c = correrHacha(casi, { tipo: 'tronco', arbol, talar: true, protegido: false, golpes: 0 });
  eq([c.llamadas.talar, casi.materiales.tronco], [0, 237], 'si no entra todo lo que rinde, no se tala a medias');
  // el pedrero
  const mata = { x: 2, z: 2 };
  const llenaP = relax({ materiales: { piedra: 240 } });
  const d = correrHacha(llenaP, { tipo: 'piedra', mata });
  eq([d.llamadas.picazo, d.llamadas.despejar, llenaP.materiales.piedra], [0, 0, 240], 'lleno: la roca no se pica (ni un golpe) y no se despeja');
  const libreP = relax({ materiales: { piedra: 5 } });
  const e = correrHacha(libreP, { tipo: 'piedra', mata });
  eq([e.llamadas.despejar, libreP.materiales.piedra], [1, 8], 'con lugar: se pica y suma');
  // un tronco caído
  const llenaC = relax({ materiales: { tronco: 240 } });
  const f = correrHacha(llenaC, { tipo: 'tronco', arbol, caido: true });
  eq([f.llamadas.talar, llenaC.materiales.tronco], [0, 240], 'lleno: el tronco caído se queda');
  // el Desafío: igual que antes
  const dd = desafio({ materiales: { tronco: 999 } });
  const g = correrHacha(dd, { tipo: 'tronco', arbol, talar: true, protegido: false, golpes: 0 });
  eq([g.llamadas.talar, dd.materiales.tronco], [1, 1003], 'Desafío: se tala sin límite');
}

// ---------------------------------------------------------------- 9. los enganches de los demás puntos de entrada (el texto, para los que no se pueden correr en Node)
{
  const dentro = (archivo, partes, que) => ok(enUnaLinea(leer(archivo), partes), que);
  dentro('src/main.js', ["{ const c0 = datosDe(o, 'colmena', sanearColmena); if (c0?.miel > 0 && !cabeJuntar('miel', c0.miel)) return; }"], 'colmena: la miel sale sólo si entra');
  dentro('src/main.js', ["if (a?.listas > 0 && !cabeJuntar('trucha-ahumada', a.listas)) return;"], 'ahumadero: las truchas salen sólo si entran');
  dentro('src/main.js', ['seco?.accion === \'sacar\'', 'cabeTrato(da)'], 'vivero: los plantines salen juntos y sólo si entran');
  dentro('src/main.js', ["seco.accion === 'sacar' && !cabeJuntar('harina', seco.harina)"], 'molino: la harina');
  dentro('src/main.js', ["seco.accion === 'sacar' && !cabeJuntar('tabla', seco.tablas)"], 'aserradero: las tablas');
  dentro('src/main.js', ['seco.retiro && !seco.retiro.pesos && !cabeJuntar(seco.retiro.k, seco.retiro.n)'], 'talleres de oficio');
  dentro('src/main.js', ['cabeTrato({ [rc.id]: rc.da }, quita)'], 'horno de barro (con lo que se gasta)');
  dentro('src/main.js', ['if (!cabeJuntar(seco.ingrediente, total)) return;'], 'cantero: la cosecha');
  dentro('src/main.js', ["{ const seco = juntarHuevos(structuredClone(g), progreso.dia); if (seco.ok && !cabeJuntar('huevo', seco.huevos)) return; }"], 'gallinero');
  dentro('src/main.js', ["if (!cabeJuntar(s.semilla, 1)) return;"], 'semilla de árbol');
  dentro('src/main.js', ["&& cabeJuntar('trucha-fresca', 1)) {"], 'pesca: sin lugar, la trucha vuelve al agua');
  dentro('src/main.js', ["!cabeJuntar('lana', seco.vellones)"], 'esquila');
  dentro('src/main.js', ["!cabeTrato({ poncho: 1 }, { lana: t.lana })"], 'telar');
  dentro('src/main.js', ["t.colgado && t.horas >= HORAS_SECADO && !cabeJuntar(t.colgado, 1)"], 'tendal');
  dentro('src/main.js', ['const x = tratoDeEfectos([{ tipo: \'cosa\', k: t.cosa || t.id, n: t.da || 1 }'], 'almacén de Ercilia (trueque)');
  dentro('src/main.js', ['o.da.materiales && !feria().tomadas.includes(o.id) && !cabeTrato(o.da.materiales, o.pide)'], 'feria');
  dentro('src/main.js', ["!cabeTrato(premioEnCosas(e.premio))"], 'encargos con premio');
  dentro('src/main.js', ['const n = Math.min(n0, lugarEn(k, n0));'], 'acopio: sale lo que entra');
  dentro('src/main.js', ["objetos.ponerCabe((k) => lugarEn(k, 1) >= 1);"], 'lo que se junta del suelo');
  dentro('src/objetos.js', ['if (cabe && def.entrada && !cabe(def.entrada)) return { llenaMochila: def.etiqueta };'], 'objetos: se queda en el suelo');
  dentro('src/objetos.js', ['Mochila llena: no te entra más ${def.etiqueta}'], 'objetos: el aviso de la E lo dice');
  dentro('src/recursos-zona-mundo.js', ['ctx.cabeJuntar && !ctx.cabeJuntar(k, n)) return;'], 'recursos de zona (antes del primer golpe a la veta)');
  dentro('src/recursos-zona-mundo.js', ["ctx.cabeJuntar('pinon', PINONES_PEHUEN)"], 'pehuén');
  dentro('src/granja-juego.js', ["ctx.cabeJuntar('leche', seco.leche)"], 'ordeñe');
  dentro('src/granja-juego.js', ['ctx.cabeJuntar(seco.k, seco.n)'], 'frutales');
  dentro('src/granja-juego.js', ['ctx.entraTrato(da)'], 'la carne que trae Don Ramón queda esperando');
  dentro('src/granja-juego.js', ['ctx.cabeTrato(da, quita)'], 'trueques de la granja');
  dentro('src/aldea-gente.js', ['if (ctx.cabeTrato) { const { da, quita } = tratoDeEfectos(s.efectos); if (!ctx.cabeTrato(da, quita)) return false; }'], 'servicios de la aldea');
  dentro('src/vecindad-juego.js', ['ctx.cabeTrato(t.da, t.quita)'], 'ayudar a un vecino');
  dentro('src/gente-campo-juego.js', ["ctx.cabeTrato({ [c.k]: c.n })"], 'tienda de la gente del campo (antes de cobrar)');
  dentro('src/cocina-juego.js', ['ctx.cabeJuntar(seco.da.id, seco.da.n)'], 'lo cocinado');
  dentro('src/cocina-juego.js', ['ctx.cabeTrato(t.da, t.quita)'], 'cambios de la cocina');
  dentro('src/comercio-mundo.js', ['ctx.cabeTrato({ [bien]: lote })'], 'comercio: comprar (antes de cobrar)');
  dentro('src/banco-mundo.js', ['ctx.cabeJuntar && !ctx.cabeJuntar(b, 1)'], 'consigna del banco');
  dentro('src/almacen-juego.js', ['sacarDe(id, a, k, d.lugarEn ? d.lugarEn(k, guardadoDe(a, k)) : Infinity)'], 'depósitos');
  dentro('src/puestos-ruta-juego.js', ['sacarDePuesto(p, id, m, ctx.lugarEn || null)'], 'depósito del puesto de ruta');
  dentro('src/negocio-propio-juego.js', ['ctx.lugarEn ? ctx.lugarEn(f.k, 1e5) : 1e5'], 'estantes del negocio');
}

// ---------------------------------------------------------------- 10. el depósito de un puesto de ruta, de verdad
{
  const mod = await import('../src/puestos-ruta.js');
  const id = mod.IDS_PUESTOS[0];
  const p = relax({ dia: 5 });
  p.puestosRuta = mod.sanearPuestosRuta({ [id]: { etapa: mod.ETAPAS_TOTAL, deposito: { n: 0, g: { tronco: 40, tabla: 30 } } } });
  const hay = mod.enDeposito(p, id, 'tronco');
  eq([hay, mod.enDeposito(p, id, 'tabla')], [40, 30], 'el puesto reparado guarda lo que se le dejó');
  const mat = {};
  const sacado = mod.sacarDePuesto(p, id, mat, (k, n) => Math.min(n, k === 'tronco' ? 25 : 0));
  eq(sacado, { tronco: 25 }, 'sale sólo lo que entra (25 de 40 troncos, ninguna tabla)');
  eq([mod.enDeposito(p, id, 'tronco'), mod.enDeposito(p, id, 'tabla')], [15, 30], 'y el resto queda guardado en el depósito');
  const todo = mod.sacarDePuesto(p, id, mat);
  eq([todo.tronco, todo.tabla], [15, 30], 'sin función de lugar saca todo, como antes');
}

// ---------------------------------------------------------------- 11. nada por cuadro: la ocupación se calcula al juntar, no en el bucle
{
  const bucle = main.slice(main.indexOf('function actualizar('), main.indexOf('function actualizar(') + 6000);
  ok(!/ocupacion\(|lugarEn\(|lugarPara\(|tratoCabe\(/.test(bucle), 'el cuadro (actualizar) no calcula la ocupación de la mochila');
  ok(!leer('src/mochila.js').includes('ocupacion('), 'la barra (armarMochila, que corre seguido) no la calcula tampoco');
}

console.log(`verificar-4-7-carga: ${n} comprobaciones OK`);
