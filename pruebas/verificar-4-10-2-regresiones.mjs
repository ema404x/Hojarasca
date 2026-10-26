// 4.10.2 — arreglos de las regresiones del pase 4.10.1 (zona R) y de los sistemas del Relax (zona S). Cada bloque EJECUTA la conducta
// (módulos puros, funciones sacadas del código de main.js/desafio.js y corridas con un mundo de mentira); lo que no se puede
// correr en Node (Electron) se comprueba con las líneas del enganche y se dice en cada bloque.
//   R1 el aviso de «versión más nueva» sale al entrar al juego y el guardado no pisa la versión antes  R2 la campana desde las 19:30
//   R3 el perro y el tablón dicen la brecha  R4 tablero o puerta: la más cercana  R5 estudios del Mandamás
//   R6 «no se repite el giro»  R7 invasores al retomar la noche  R8 el aviso de «materiales»
//   S1 cocinar no pierde el resultado  S2 precios de los puestos por la fecha  S3 tapar los canteros
//   S4 el regalo de Elsa  S5/S6 el encargo de las truchas  S7 el paquete de Nicanor  S8 el cuaderno  S9 el tope de la deuda
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { registrarThree } from './ayuda-three.mjs';
import { que } from './ayuda-interacciones.mjs';
import { expresion, funcion, enUnaLinea } from './ayuda-codigo.mjs';
import { generarTerreno } from '../src/terreno.js';
import { BASE_REFUGIO } from '../src/desafio-mapa.js';
import { LIMITE } from '../src/config.js';
import { crearAtaques } from '../src/desafio-ataques.js';
import * as R from '../src/desafio-reglas.js';
import * as G from '../src/guardado.js';
import * as B from '../src/desafio-bestiario-premia.js';
import * as H from '../src/huerta.js';
import * as EV from '../src/eventos-valle.js';
import * as P from '../src/prestamos.js';
import { temporadaDelDia } from '../src/negocios-fx.js';
import { economiaNueva, pesosDe } from '../src/economia.js';
import { negociosDe } from '../src/negocios.js';

registrarThree();
const TR = await import('../src/trucos.js');
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const main = leer('src/main.js'), des = leer('src/desafio.js'), valle = leer('src/eventos-valle.js'), valleUi = leer('src/eventos-valle-ui.js');
// una propiedad de objeto (`nombre: () => …,`) de una línea del código, evaluada con un mundo de mentira; `ademas` distingue líneas parecidas
const propiedad = (fuente, inicio, entorno, ademas = '') => {
  const l = fuente.split('\n').find((x) => x.trimStart().startsWith(inicio) && x.includes(ademas));
  return new Function('env', `with (env) { return (${l.trimStart().slice(inicio.length).replace(/,\s*(\/\/.*)?$/, '')}); }`)(new Proxy(entorno, { has: (t, k) => typeof k === 'string' && (Object.hasOwn(t, k) || !(k in globalThis)), get: (t, k) => (typeof k === 'string' && Object.hasOwn(t, k) ? t[k] : undefined) }));
};
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };

// ================================================================== R1. el aviso de la versión más nueva
{
  // el guardado conserva la versión de la partida hasta que el aviso se mostró
  eq(G.versionAlGuardar('4.99.0', '4.10.1'), '4.99.0', 'con el aviso pendiente, el guardado no pisa la versión nueva');
  eq(G.versionAlGuardar('', '4.10.1'), '4.10.1', 'ya mostrado (o partida de antes), se guarda la de esta versión');
  eq(G.versionAlGuardar('4.9.0', '4.10.1'), '4.10.1', 'una partida de una versión más vieja se pone al día');
  eq(G.versionAlGuardar('4.10.1', '4.10.1'), '4.10.1', 'la misma queda igual');
  eq(G.versionAlGuardar('<script>', '4.10.1'), '4.10.1', 'una versión rota no se conserva');

  // el aviso: ya no es un setTimeout suelto, va por avisosAlEntrar y, una vez mostrado, deja de frenar el guardado
  ok(!enUnaLinea(main, ["setTimeout(() => { if (versionMasNueva("]), 'el temporizador de 6 s ya no existe');
  const notas = [];
  const avisos = [];
  // 4.11.3: el aviso ahora sale si la partida es de sólo lectura (partidaSoloLectura) y se escribe también en la portada y en la marca fija
  const env = { versionPendiente: '4.99.0', versionDeLaPartida: '4.99.0', partidaSoloLectura: () => true, $: () => null, T_: (x) => x, versionDelJuego: () => '4.10.1', versionMasNueva: G.versionMasNueva, avisosAlEntrar: avisos, nota: (t, s) => notas.push([t, s]) };
  funcion(main, 'avisarVersionMasNueva', env)();
  eq([avisos.length, notas.length], [1, 0], 'al abrir se prepara el aviso pero no se muestra todavía (el HUD de la portada está oculto)');
  ok(env.versionPendiente === '4.99.0', 'y mientras tanto el guardado sigue conservando la versión');
  avisos[0]();
  ok(notas.length === 1 && notas[0][0] === 'Partida de una versión más nueva' && notas[0][1].includes('4.99.0'), 'al entrar al juego la nota sale con la versión de la partida');
  ok(env.versionPendiente === '', 'y recién ahí el guardado vuelve a escribir la versión de esta versión');
  const env2 = { ...env, versionPendiente: '4.10.1', versionDeLaPartida: '4.10.1', partidaSoloLectura: () => false, avisosAlEntrar: [] };
  funcion(main, 'avisarVersionMasNueva', env2)();
  ok(env2.avisosAlEntrar.length === 0, 'una partida de la misma versión (o vieja) no avisa nada');
  // el enganche: `guardar` escribe lo que decide versionAlGuardar, y `volverAlJuego` dispara los avisos pendientes
  ok(expresion(main, 'progreso.versionJuego = ', { versionAlGuardar: (p, a) => `${p}|${a}`, versionPendiente: 'P', versionDelJuego: () => 'A' }, 'versionAlGuardar') === 'P|A', 'guardar() escribe la versión con versionAlGuardar(pendiente, actual)');
  ok(enUnaLinea(main, ['avisarVersionMasNueva();']) && enUnaLinea(main, ['if (avisosAlEntrar.length) for (const f of avisosAlEntrar.splice(0)) setTimeout(f, 1200);']), 'se prepara en la portada y sale al volver al juego');
}

// ================================================================== R2. la campana desde que los vecinos están en la base
{
  const dentro = [19.5, 19.75, 20, 20.25, 20.5, 23, 0, 3, 5.9], fuera = [6, 8, 12, 17, 19.4];
  for (const h of dentro) ok(R.enVentanaDeNoche(h), `a las ${h} la base ya se prepara`);
  for (const h of fuera) ok(!R.enVentanaDeNoche(h), `a las ${h} no`);
  // el mismo cálculo del juego, con horas y duendes
  const posible = (horas, vivos) => expresion(des, 'const alarmaPosible = ', { enVentanaDeNoche: R.enVentanaDeNoche, progreso: () => ({ horas }), vivos: () => vivos })();
  ok(posible(19.75, 0) && posible(20, 0), 'a las 19:45 y a las 20:00, con los vecinos en la base y sin duendes, la campana sí cambia las órdenes');
  ok(!posible(12, 0) && !posible(8, 0), 'de día, no (el arreglo de la 4.10.1 sigue)');
  ok(posible(12, 3), 'y con duendes a la vista siempre');
  ok(enUnaLinea(des, ['alarmaAliados: () => (alarmaPosible()', 'alarmaVecinos: () => (alarmaPosible()']), 'la campana usa esa ventana (la conducta de la campana está en verificar-4-10-1-desafio)');
}

// ================================================================== R3. el perro y el pronóstico dicen la brecha
{
  const T = generarTerreno();
  const base = { ...BASE_REFUGIO };
  const D = { oleadas: 2, semilla: 'COIHUE-4821', ladoNoche: null, especial: null, rescate: null };
  const api = {
    T, D: () => D, aliens: [], limite: LIMITE, base: () => base, libre: () => true, blancoNoche: () => null, esFinal: () => false,
    nota() {}, jugador: () => ({ estado: { pos: { x: base.x, y: 0, z: base.z } } }), defensas: () => [], obraViva: () => true, porBajar: () => 0,
    polvo() {}, risa() {}, destelloCura() {}, efectoCurandero() {},
  };
  const A = crearAtaques(api);
  const l = A.decidir(3);
  const t0 = A.alertaDeLaTarde(20.0, 20.5, 5000);
  ok(t0 && t0.x === l.x && t0.z === l.z, 'sin brecha, el perro mira el lado de la noche (como siempre)');
  const brecha = { x: l.x + 80, z: l.z - 60, noche: 3, nombre: 'el muro' };
  api.brechaProxima = () => brecha;
  const t1 = A.alertaDeLaTarde(20.0, 20.5, 5000);
  ok(t1 && t1.x === brecha.x && t1.z === brecha.z, 'con un muro sin arreglar, el perro mira hacia el muro y no hacia el lado viejo');
  ok(A.alertaDeLaTarde(20.0, 20.5, 5000 + 20000) === null && A.alertaDeLaTarde(20.0, 20.5, 5000 + 45000) !== null, 'sigue mirando un rato sí y un rato no');
  ok(A.alertaDeLaTarde(18.0, 20.5, 5000) === null && A.alertaDeLaTarde(20.6, 20.5, 5000) === null, 'y sólo en la última hora de la tarde');
  api.brechaProxima = () => null;
  ok(A.alertaDeLaTarde(20.0, 20.5, 5000) !== null, 'sin brecha esa noche, vuelve el lado');

  // la brecha de la noche que viene (decidida a las 19:30) y no la de la que ya pasó
  const cad = { brecha: { noche: 3 } };
  const env = (oleadas) => ({ cadenaD: () => cad, D: () => ({ oleadas }) });
  ok(expresion(des, 'const brechaProxima = ', env(2))() === cad.brecha, 'a la tarde de la noche 3 (oleadas = 2) la brecha cuenta');
  ok(expresion(des, 'const brechaProxima = ', env(3))() === null, 'ya empezada la noche, la cuenta `brechaDeLaNoche`, no ésta');
  ok(expresion(des, 'const brechaProxima = ', env(4))() === null, 'ni la de una noche que ya pasó');
  // el tablón: «hay algo que los llama a otra parte» también con la brecha
  const hayBlanco = (brechaOn) => propiedad(des, 'hayBlanco: () =>', { D: () => ({ rescate: null }), blancoVarada: () => null, asedioMundo: { blancoNoche: () => null }, brechaProxima: () => (brechaOn ? { x: 1, z: 1 } : null) });
  ok(hayBlanco(true) === true && hayBlanco(false) === false, 'el pronóstico del tablón cuenta la brecha como blanco (y sin ella, nada cambia)');
  ok(enUnaLinea(des, ['brechaProxima: () => brechaProxima(),']), 'el perro recibe la brecha de la tarde del juego');
}

// ================================================================== R4. el tablero de trofeos junto a una puerta
{
  const tablero = { desafio: true, trofeosCerca: true, avisoTrofeos: 'Ver los trofeos del tablero (2 de 7)', usarTrofeos: true, avisoDesafioCerca: null, usarDesafioCerca: () => false };
  const puerta = { objetivo: 0, nombre: 'la puerta' };
  eq(que({ ...tablero, puertaCerca: puerta, accionarPuerta: true }).e, 'puerta', 'sin distancias, gana la puerta (como en la 4.10.1)');
  const r1 = que({ ...tablero, puertaCerca: puerta, distanciaTrofeos: 1.0, distanciaPuerta: 2.5 });
  ok(r1.e === 'trofeos' && r1.avisoId === 'trofeos', 'pegado al tablero y a 2,5 m de la puerta, la E y el aviso son del tablero');
  const r2 = que({ ...tablero, puertaCerca: puerta, distanciaTrofeos: 3.0, distanciaPuerta: 1.2, accionarPuerta: true });
  ok(r2.e === 'puerta' && r2.avisoId === 'puerta', 'más cerca de la puerta que del tablero, la puerta');
  eq(que({ ...tablero, puertaCerca: puerta, distanciaTrofeos: 2, distanciaPuerta: 2, accionarPuerta: true }).e, 'puerta', 'a igual distancia, la puerta');
  eq(que({ ...tablero, puertaCerca: puerta, distanciaTrofeos: Infinity, distanciaPuerta: 2 }).e, 'puerta', 'con un dato roto, la puerta como antes');
  // el nido o dormir en la cabaña siguen ganándole al tablero aunque esté más cerca
  eq(que({ ...tablero, dentroDeTuObra: true, puedeDormirJuntoAlFuego: true, catreCerca: true, distanciaTrofeos: 0.5, distanciaPuerta: 2 }).e, 'obra-dormir', 'dormir en la cabaña sigue ganando');
  const nido = que({ ...tablero, avisoDesafioCerca: 'Quemar el nido', usarDesafioCerca: true, distanciaTrofeos: 0.5, puertaCerca: puerta, distanciaPuerta: 2 });
  ok(nido.e === 'desafio-cerca', 'y el nido de al lado también');
  ok(enUnaLinea(main, ['distanciaTrofeos:', 'distanciaPuerta:']), 'el juego le da las dos distancias a la tabla');
}

// ================================================================== R5. los estudios del Mandamás
{
  eq(B.umbralesDe('jefe'), [1, 2, 4], 'el Mandamás se estudia con 1, 2 y 4 caídas (en la campaña caen cuatro: noches 5, 10, 15 y 20)');
  eq(B.umbralesDe('bruto'), [5, 15, 40], 'el resto de los duendes, igual que antes');
  eq(B.umbralesDe('enjambre'), [20, 60, 160], 'el enjambre también');
  const mejor = (n) => ({ jefe: { abatidos: n } });
  eq([1, 2, 3, 4].map((n) => B.nivelEstudio(mejor(n), 'jefe')), [1, 2, 2, 3], 'con las cuatro caídas de la campaña se llega al tercer estudio');
  eq(B.nivelEstudio(mejor(0), 'jefe'), 0, 'sin caídas, nada');
  eq([B.subioEstudio('jefe', 0, 1), B.subioEstudio('jefe', 1, 2), B.subioEstudio('jefe', 3, 4), B.subioEstudio('jefe', 4, 5)], [1, 2, 3, 0], 'sube de nivel al pasar cada umbral');
  const a = B.umbralesDe('jefe'); a.push(99);
  eq(B.umbralesDe('jefe'), [1, 2, 4], 'y quien pida los umbrales no puede cambiarlos');
}

// ================================================================== R6. «no se repite el giro»
{
  const anterior = (d) => {
    const m = /anterior: (Number\.isFinite\(d\.giroAnteriorNoche\)[^\n]*?), hayDefensas/.exec(des);
    ok(m, 'revisarGiro pasa `anterior` calculado con la noche anotada');
    return new Function('d', `return (${m[1]});`)(d);
  };
  eq(anterior({ oleadas: 7, giroAnterior: 'niebla', giroAnteriorNoche: 6, giro: null }), 'niebla', 'el giro de anoche cuenta aunque d.giro ya sea null de madrugada');
  eq(anterior({ oleadas: 7, giroAnterior: 'niebla', giroAnteriorNoche: 4, giro: null }), null, 'uno de hace tres noches ya no impide repetir');
  eq(anterior({ oleadas: 7, giroAnterior: 'niebla', giro: null }), 'niebla', 'una partida sin la noche anotada se comporta como antes');
  eq(anterior({ oleadas: 7, giroAnterior: null, giroAnteriorNoche: null, giro: null }), null, 'sin giro anterior, nada');
  ok(enUnaLinea(des, ['d.giroAnterior = id;', 'd.giroAnteriorNoche = d.oleadas;']), 'al elegir un giro se anota en qué noche fue');
  // lo que se guarda
  const nuevo = R.sanearDesafio(null);
  ok(nuevo.giroAnteriorNoche === null, 'una partida nueva no trae noche de giro');
  for (const [v, esp] of [[6, 6], [6.9, 6], [null, null], ['x', null], [NaN, null], [undefined, null], [{}, null]]) eq(R.sanearDesafio({ giroAnteriorNoche: v }).giroAnteriorNoche, esp, `saneado (${String(v)})`);
}

// ================================================================== R7. guardar y abrir a mitad de noche
{
  ok(enUnaLinea(des, ['if (!retomada) nocheActual.invasores += tipos.length;']), 'al retomar la noche los que vuelven no se suman otra vez (ya estaban en la partida)');
  ok(/function empezarOleada\([^)]*retomada/.test(des), 'y `retomada` sigue siendo parámetro de empezarOleada');
}

// ================================================================== R8. el aviso de «materiales N»
{
  const mundo = () => {
    const p = { modo: 'relax', dia: 5, horas: 12, materiales: {}, entradas: {}, cosas: {}, ramitas: 0 };
    return { p, m: { desafio: false, progreso: () => p, ajustes: () => ({ duracion: 30 }), jugador: () => ({}), reloj: {}, refrescar() {}, depositos: () => [], rehacerObra() {} } };
  };
  const w = mundo();
  const r = TR.ejecutar('materiales 100', w.m);
  ok(r.ok && /hasta donde entra la mochila/.test(r.texto), 'con la mochila vacía, materiales 100 avisa que no entró todo');
  const lista = r.texto.split('quedaron en: ')[1] || '';
  ok(lista.length > 0 && !/(^|, )0 /.test(lista), `el aviso no lista lo que quedó en cero (dice «${lista}»)`);
  const w2 = mundo(); w2.p.materiales = { tronco: 100, tabla: 100, piedra: 90 };
  const r2 = TR.ejecutar('materiales 100', w2.m);
  ok(r2.ok && !/tronco|tabla/.test(r2.texto.split('quedaron en: ')[1] || ''), 'ni lo que quedó como estaba');
}

// ================================================================== S1. cocinar al fuego
{
  // se corre la `cocinar` y la `registrar` reales: el frasco o el plato llegan aunque se abra la pausa en el 1,2 s
  const armar = (modoEnElMedio) => {
    const pendientes = [];
    const rc = { id: 'frasco-frutilla', conserva: true, nombre: 'dulce de frutilla', pide: [{ k: 'frutilla', n: 4 }] };
    const progreso = { dia: 3, horas: 12, cosas: {}, entradas: { frutilla: { cantidad: 5 }, 'frasco-frutilla': { cantidad: 1, dia: 1, hora: 1 } } };
    const e = { modo: 'jugando' };
    const notas = [];
    const entorno = {
      get modo() { return e.modo; }, progreso, ENTRADA: { 'frasco-frutilla': { id: 'frasco-frutilla', nombre: 'Frasco de dulce', seccion: 'recetas' } },
      cercaDelFuego: () => true, cuantoCocina: () => 0, elegirReceta: () => rc, RECETAS_FUEGO: [], nota: (t, s) => notas.push([t, s]), guardar() {},
      sonido: { encender() {}, juntar() {}, anotar() {} }, diario: { anotar() {} }, setTimeout: (f) => pendientes.push(f),
    };
    entorno.registrar = funcion(main, 'registrar', entorno);
    const cocinar = funcion(main, 'cocinar', entorno);
    return { cocinar, pendientes, progreso, e, notas, abrir: () => { e.modo = modoEnElMedio; } };
  };
  const a = armar('pausa');
  a.cocinar();
  eq(a.progreso.entradas.frutilla.cantidad, 1, 'al apretar E se gastan las frutillas');
  a.abrir();
  a.pendientes.forEach((f) => f());
  eq(a.progreso.entradas['frasco-frutilla'].cantidad, 2, 'aunque se abrió la pausa en el medio, el frasco llega');
  ok(a.notas.some(([t]) => /frasco de dulce/i.test(t)), 'y la nota avisa');
  const b = armar('jugando');
  b.cocinar(); b.pendientes.forEach((f) => f());
  eq(b.progreso.entradas['frasco-frutilla'].cantidad, 2, 'sin interrupciones, igual que antes');
  // registrar sigue sin anotar nada cuando no se está jugando y nadie pagó (el cuaderno, el mapa…)
  const e2 = { modo: 'pausa' };
  const pr = { dia: 1, horas: 1, entradas: {}, cosas: {} };
  const reg = funcion(main, 'registrar', { get modo() { return e2.modo; }, progreso: pr, ENTRADA: { x: { id: 'x', nombre: 'X', seccion: 'especies' } }, diario: { anotar() {} }, sonido: { anotar() {} }, nota() {}, guardar() {} });
  reg('x', false); ok(!pr.entradas.x, 'en pausa, juntar algo suelto no anota (como siempre)');
  reg('x', false, true); ok(!!pr.entradas.x, 'pero lo ya pagado sí');
}

// ================================================================== S2. precios de los puestos de la trochita
{
  const temp = (dia, inv) => propiedad(main, 'temporada: () =>', { temporadaDelDia, progreso: { dia }, U: { uInvierno: { value: inv }, uOtono: { value: 0 } } }, 'temporadaDelDia');
  eq(temp(5, 1), 'otono', 'la estación de los precios sale de la fecha (día 5 = otoño), aunque el cielo esté en invierno fijo');
  eq(temp(9, 0), 'invierno', 'y cambia con los días (día 9 = invierno)');
  ok(!/crearPuestoDeCargas\(\{[^}]*?estacionDe/s.test(main.slice(main.indexOf('crearPuestoDeCargas({'), main.indexOf('crearPuestoDeCargas({') + 600)), 'el puesto de cargas ya no usa el cielo');
}

// ================================================================== S3. tapar los canteros
{
  const huerta = () => ({ a: { cultivo: 'habas', dia: 9 }, b: { cultivo: 'papas', dia: 9 }, c: { cultivo: 'calafates', dia: 9 }, d: { cultivo: 'habas', dia: 9 } });
  const dia = 10;
  const h = huerta();
  const tapados = H.taparHuerta(h, dia);
  ok(tapados === 3, 'tapa los sembrados que la helada afecta (el calafate no la necesita)');
  const heladosTapados = H.helarHuerta(h, dia + 1);
  eq(heladosTapados, 0, 'la helada de la noche (al cambiar al día siguiente) no toca lo tapado');
  const sinTapar = huerta();
  ok(H.helarHuerta(sinTapar, dia + 1) === 3, 'sin tapar, la misma helada atrasa los tres');
  const p = h.a; const antes = p.dia;
  ok(p.dia === antes && H.helarHuerta(h, dia + 2) >= 3 - 0, 'al día siguiente, la próxima helada vuelve a pegar (se tapa una noche)');
  eq(H.taparHuerta({}, 3), 0, 'sin canteros, nada');
  eq(H.taparHuerta(null, 3), 0, 'ni con una huerta rota');
  // lo listo para cosechar no se marca
  const lista = { z: { cultivo: 'habas', dia: -20 } };
  eq(H.taparHuerta(lista, 10), 0, 'lo que ya está listo no necesita tapa');
  // el evento
  const op = EV.EVENTO_VALLE.helada.opciones.find((o) => o.id === 'tapar');
  ok(op.efectos.some((f) => f.tipo === 'tapar') && op.pide.materiales.tabla === 2, '«Tapar los canteros» cuesta dos tablas y ahora tapa de verdad');
  ok(enUnaLinea(valleUi, ["case 'tapar':", 'ctx.taparHuerta']), 'la tarjeta del valle aplica el efecto');
  ok(enUnaLinea(main, ['taparHuerta: () =>', 'taparHuerta(huerta(), progreso.dia)']), 'y el juego lo hace sobre la huerta de la partida');
  ok(EV.SEGUIMIENTOS['s-helada-salvada'].texto.includes('debajo de las tablas'), 'el «después» ya no miente');
}

// ================================================================== S4. el regalo de Elsa (la guarda)
{
  const ev = EV.eventosValleNuevos(() => 0.5);
  const ayudar = EV.EVENTO_VALLE.derrumbe.opciones.find((o) => o.id === 'ayudar');
  let regalo = false;
  for (const f of ayudar.efectos) if (f.tipo === 'gratitud') regalo = EV.sumarGratitud(ev, f.quien, f.n, 10) || regalo;
  ok(!regalo, 'ayudar en el derrumbe todavía no alcanza para el regalo');
  for (const f of EV.SEGUIMIENTOS['s-derrumbe-ramal'].efectos) if (f.tipo === 'gratitud') regalo = EV.sumarGratitud(ev, f.quien, f.n, 12) || regalo;
  ok(regalo && ev.regalos.guarda, 'con la carta del ramal, Elsa llega a la gratitud del regalo');
  ok(ev.pendientes.some((x) => x.id === 'regalo-guarda'), 'y el regalo se agenda');
  ok(EV.SEGUIMIENTOS['regalo-guarda'], 'el regalo existe');
}

// ================================================================== S5/S6. el encargo de las truchas
{
  const llamar = (pezId, horas) => {
    const progreso = { peces: {}, horas, dia: 2, pescaTarde: 0, truchasHoy: null, cosas: {}, entradas: {} };
    const entorno = {
      progreso, TRUCHAS: ['arcoiris', 'marron', 'fontinalis'], registrar() {}, ganarOficio() {}, XP: {}, desafio: false, diario: { anotar() {} }, teLaQuedas: () => false,
      obrasTerminadas: () => [], lugarEn: () => 0, nota() {}, guardar() {}, AHUMADERO: { porDia: 2 }, cabeJuntar: () => false,
    };
    funcion(main, 'atrapar', entorno)({ id: pezId, cm: 30, def: { nombre: 'trucha' } });
    return progreso.pescaTarde;
  };
  eq(llamar('arcoiris', 20), 1, 'una trucha a las 20 cuenta para «dos truchas después de las siete»');
  eq(llamar('marron', 21), 1, 'la marrón también');
  eq(llamar('perca', 20), 0, 'una perca (nativa) no cuenta');
  eq(llamar('pejerrey', 20), 0, 'un pejerrey tampoco');
  eq(llamar('arcoiris', 15), 0, 'ni una trucha de la tarde temprano');
}

// ================================================================== S7. el paquete de Nicanor
{
  const s = EV.SEGUIMIENTOS['s-tobillo-truchas'];
  ok(!/trucha/i.test(s.titulo + ' ' + s.texto), 'el texto ya no promete truchas');
  ok(/yerba/.test(s.texto) && /ramitas/.test(s.texto), 'y dice lo que de verdad da');
  const premio = s.efectos[0].premio;
  ok(premio.cuenta.yerba === 4 && premio.ramitas === 4, 'el premio es el de siempre');
}

// ================================================================== S8. lo que llega de regalo queda en el cuaderno
{
  const arma = (premio) => {
    const progreso = { dia: 4, horas: 9, entradas: {}, cosas: {}, ramitas: 0, materiales: {} };
    const entorno = {
      progreso, ENTRADA: { mosca: { seccion: 'trueque' }, yerba: { seccion: 'especies' } }, sumarMaterial() {}, cobrarPesos() {}, refrescarBarra() {}, setTimeout() {}, nota() {}, guardar() {},
    };
    funcion(main, 'cobrarPremio', entorno)({ premio });
    return progreso;
  };
  const a = arma({ cosa: 'mosca' });
  ok(a.cosas.mosca === 1 && a.entradas.mosca && a.entradas.mosca.dia === 4, 'la mosca que te regalan queda anotada en «Del almacén»');
  const b = arma({ cosas: ['mosca'], cuenta: { yerba: 4 } });
  ok(b.entradas.mosca && !b.entradas.yerba, 'también en una lista de cosas, y no se anota lo que no es del almacén');
  const c = arma({ cuenta: { yerba: 4 } });
  ok(!Object.keys(c.entradas).length, 'un premio sin cosas del almacén no toca el cuaderno');
}

// ================================================================== S9. el préstamo vencido
{
  const nuevoP = () => { const p = { modo: 'relax', dia: 1, economia: { ...economiaNueva(), pesos: 0 } }; return p; };
  const p = nuevoP();
  const r = P.pedirPrestamo(p, 1, 3000, 12);
  ok(r.ok, 'se pide el préstamo');
  const pr = negociosDe(p).banco.prestamo;
  for (let d = 2; d <= 300; d++) P.pasarDiaBanco(p, d);
  ok(pr.debe <= 3000 * P.BANCO.topeDeuda, `a los 300 días sin pagar la deuda (${pr.debe}) quedó en el tope del doble de lo pedido`);
  ok(pr.debe > 3000, 'pero el interés corrió');
  const q = nuevoP(); P.pedirPrestamo(q, 1, 3000, 12);
  const pq = negociosDe(q).banco.prestamo;
  for (let d = 2; d <= 14; d++) P.pasarDiaBanco(q, d);
  let esperado = 3000;   // la cuenta de siempre: 2 % hasta el plazo (día 13), 3 % después
  for (let d = 2; d <= 14; d++) esperado = Math.ceil(esperado * (d > 13 ? 1.03 : 1.02));
  eq(pq.debe, esperado, `los primeros días el interés es el de siempre (${esperado} al día 14)`);
  const pg = negociosDe(q).banco.prestamo; pg.debe = 9000;
  P.pasarDiaBanco(q, 15);
  eq(pg.debe, 9000, 'una deuda que ya pasó el tope (partida vieja) no crece, pero tampoco se achica sola');
  // se puede pagar y saldar
  q.economia.pesos = 100000;
  const pago = P.pagarPrestamo(q, 16, 9000);
  ok(pago.ok && pago.saldado, 'y se paga');
  ok(pesosDe(q) === 91000, 'por la puerta de siempre');
}

console.log(`verificar-4-10-2-regresiones: ${pasos} comprobaciones, todo en verde`);
