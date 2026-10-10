// 3.7.3 — La trochita mejorada (PLAN_3_7.md): el tren del juego (ya no prototipo) y lo que se usa de él. Las reglas
// puras (tren-viaje.js: el estado del taller con valores por defecto, la composición con su tope, el manejo, el
// agarre, la nieve, los silbatos, el viaje), la cabina con las mejoras (maquinista.js), el furgón en el comercio
// (comercio.js), y los enganches en tren.js, trochita.js, main.js, sonido.js, fotos.js y comercio-mundo.js. La partida
// real es pruebas/humo-3-7-3-tren.cjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import * as V from '../src/tren-viaje.js';
import * as M from '../src/maquinista.js';
import * as C from '../src/comercio.js';
import { SILBATOS } from '../src/personal-trochita.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8').replace(/\r\n/g, '\n');
let n = 0;
const ok = (c, t) => { n++; assert.ok(c, t); };

// ---------------------------------------------------------------- 1. el estado del taller (el contrato), con valores por defecto
{
  const nuevo = V.estadoTrenNuevo();
  ok(nuevo.loco.caldera === 0 && nuevo.loco.freno === 0 && !nuevo.loco.farol && nuevo.loco.silbato === 'comun' && !nuevo.loco.quitanieves && !nuevo.loco.arenero && !nuevo.loco.banderines && nuevo.loco.nombre === '', 'la locomotora sin mejoras');
  ok(V.ID_VAGONES.join() === 'pasajeros,comedor,carga,caballo,mirador,dormitorio' && V.ID_VAGONES.every((id) => nuevo.vagones[id] === false) && nuevo.composicion.length === 0, 'los seis vagones del contrato, ninguno todavía');
  for (const basura of [null, undefined, 7, 'x', [], { loco: 'x' }, { loco: { caldera: 99, freno: -3, silbato: 'sirena', nombre: 42, pintura: { cuerpo: 'rojo', franja: '#ABCDEF' } }, vagones: { carga: 'si', avion: true }, composicion: ['carga', 'carga', 'avion', 'pasajeros'] }]) {
    const s = V.sanearEstadoTren(basura);
    ok(s.loco.caldera >= 0 && s.loco.caldera <= 3 && s.loco.freno >= 0 && s.loco.freno <= 3, `la caldera y el freno, de 0 a 3 (${JSON.stringify(basura)})`);
    ok(V.SILBATOS_DEL_TALLER.includes(s.loco.silbato) && typeof s.loco.nombre === 'string', 'silbato y nombre posibles');
    ok(s.composicion.every((id) => V.ID_VAGONES.includes(id) && s.vagones[id]) && new Set(s.composicion).size === s.composicion.length, 'la composición sólo con vagones que tenés, sin repetir');
    ok(JSON.stringify(V.sanearEstadoTren(JSON.parse(JSON.stringify(s)))) === JSON.stringify(s), 'el saneo es estable');
  }
  const raro = V.sanearEstadoTren({ loco: { pintura: { cuerpo: 'rojo', franja: '#ABCDEF' } }, vagones: { carga: 'si' }, composicion: ['carga', 'carga'], delTaller: { dias: 3 } });
  ok(raro.loco.pintura.cuerpo === null && raro.loco.pintura.franja === '#abcdef' && raro.composicion.join() === 'carga' && raro.delTaller?.dias === 3, 'colores de verdad o nada; lo que el taller guarde de más, se respeta');
}

// ---------------------------------------------------------------- 2. la composición: ténder + hasta 4, siempre dónde viajar
{
  ok(V.TREN.maxVagones === 4, 'el tope: ténder y cuatro vagones');
  ok(V.composicionDe(undefined).join() === 'segunda,segunda2', 'sin nada del taller, los dos coches de segunda de siempre');
  const todos = { vagones: Object.fromEntries(V.ID_VAGONES.map((id) => [id, true])) };
  ok(V.composicionDe(todos).length === 4, 'con los seis vagones sin elegir, van los cuatro primeros');
  ok(V.composicionDe({ ...todos, composicion: ['mirador', 'caballo', 'comedor', 'pasajeros', 'carga', 'dormitorio'] }).join() === 'mirador,caballo,comedor,pasajeros', 'la composición elegida, en su orden y con el tope');
  ok(V.composicionDe({ vagones: { carga: true, caballo: true }, composicion: ['carga', 'caballo'] }).join() === 'segunda,carga,caballo', 'sin coche de pasajeros elegido, adelante va uno de segunda');
  ok(V.composicionDe({ vagones: { carga: true, caballo: true, mirador: true, comedor: true }, composicion: ['carga', 'caballo', 'mirador', 'comedor'] }).join() === 'carga,caballo,mirador,comedor', 'con uno donde viajar, va como se eligió');
  ok(V.composicionDe({ vagones: { mirador: true }, composicion: ['mirador'] }).join() === 'mirador,segunda', 'nunca menos de dos vagones (como el tren de antes)');
  ok(V.composicionDe({ vagones: { comedor: true }, composicion: ['pasajeros'] }).join() === 'comedor,segunda', 'lo que no tenés no va');
  ok(V.viajaEn('pasajeros') && V.viajaEn('segunda2') && !V.viajaEn('carga') && !V.viajaEn('caballo') && !V.viajaEn('locomotora'), 'en el furgón y en la jaula no se viaja');
}

// ---------------------------------------------------------------- 3. el manejo: caldera, freno, arenero (la cabina)
{
  const m0 = V.manejoDe(undefined), m3 = V.manejoDe({ loco: { caldera: 3, freno: 3 } });
  ok(m0.traccion === 1 && m0.vmax === 1 && m0.freno === 1, 'sin mejoras, la cabina de siempre');
  ok(m3.traccion > 1.6 && m3.vmax > 1.3 && m3.freno > 2, `con todo, más tirón, más velocidad y más freno (${JSON.stringify(m3)})`);
  ok(V.agarreDe(undefined, { lluvia: 0 }) === 1 && V.agarreDe(undefined, { lluvia: 1 }) === 0.5 && V.agarreDe(undefined, { helada: 0.4 }) === 0.8 && V.agarreDe({ loco: { arenero: true } }, { lluvia: 1, helada: 1 }) === 1, 'sin arenero, la lluvia o la helada bajan el agarre; con arenero, no');
  // la cabina de siempre, igual que antes (las pruebas de la 2.9 la miden)
  const a = M.cabinaNueva(), b = M.cabinaNueva();
  for (let i = 0; i < 300; i++) { M.pasoCabina(a, 1 / 30, { acelera: true }); M.pasoCabina(b, 1 / 30, { acelera: true, manejo: { traccion: 1, vmax: 1, freno: 1 }, agarre: 1 }); }
  ok(a.vel === b.vel && a.regulador === b.regulador, 'sin mejoras, la cabina anda exactamente igual');
  // tirón y velocidad máxima
  const hasta = (op, v) => { const c = M.cabinaNueva(); let t = 0; while (c.vel < v && t < 120) { M.pasoCabina(c, 1 / 30, { acelera: true, ...op }); t += 1 / 30; } return t; };
  const t0 = hasta({}, 7), t3 = hasta({ manejo: m3 }, 7);
  ok(t3 < t0 * 0.8, `con la caldera al 3, a 25 km/h llega antes (${t3.toFixed(1)} s contra ${t0.toFixed(1)} s)`);
  const tope = (op) => { const c = M.cabinaNueva(); for (let i = 0; i < 6000; i++) M.pasoCabina(c, 1 / 30, { acelera: true, ...op }); return c.vel; };
  ok(tope({ manejo: m3 }) > M.CABINA.vmax + 0.5 && tope({}) <= M.CABINA.vmax, `y va más rápido (${tope({ manejo: m3 }).toFixed(1)} m/s contra ${tope({}).toFixed(1)})`);
  // el freno
  const frenar = (op) => { const c = { regulador: 0, freno: 0, presion: 0.8, vel: 10 }; let d = 0, t = 0; while (c.vel > 0 && t < 60) { M.pasoCabina(c, 1 / 30, { frena: true, ...op }); d += c.vel / 30; t += 1 / 30; } return d; };
  ok(frenar({ manejo: m3 }) < frenar({}) * 0.7, `con el freno al 3, frena en menos metros (${frenar({ manejo: m3 }).toFixed(0)} m contra ${frenar({}).toFixed(0)} m)`);
  // patinar: sin arenero, en la vía mojada, el regulador abierto de golpe hace patinar (tira menos y se avisa)
  const c1 = M.cabinaNueva(); let patino = false;
  for (let i = 0; i < 90; i++) { M.pasoCabina(c1, 1 / 30, { acelera: true, agarre: 0.5 }); patino = patino || c1.patina; }
  const c2 = M.cabinaNueva(); let patino2 = false;
  for (let i = 0; i < 90; i++) { M.pasoCabina(c2, 1 / 30, { acelera: true, agarre: 1 }); patino2 = patino2 || c2.patina; }
  ok(patino && !patino2 && c1.vel < c2.vel && c1.vel > 0, `sin arenero en la vía mojada patina y tira menos (${c1.vel.toFixed(2)} contra ${c2.vel.toFixed(2)} m/s), pero arranca`);
  ok(frenar({ agarre: 0.5 }) > frenar({}), 'y el freno resbala un poco');
  // la nieve: sin quitanieves la cuña de nieve lo planta; con, no pasa del tope
  const c3 = { regulador: 1, freno: 0, presion: 1, vel: 5 };
  for (let i = 0; i < 120; i++) M.pasoCabina(c3, 1 / 30, { acelera: true, nieve: V.TREN.nieve.frena });
  ok(c3.vel < 1, `la nieve frena (${c3.vel.toFixed(2)} m/s)`);
  const c4 = { regulador: 1, freno: 0, presion: 1, vel: 9 };
  for (let i = 0; i < 120; i++) M.pasoCabina(c4, 1 / 30, { acelera: true, tope: V.TREN.nieve.vmax });
  ok(Math.abs(c4.vel - V.TREN.nieve.vmax) < 0.01, `con el quitanieves, a paso de hombre (${c4.vel.toFixed(2)} m/s)`);
}

// ---------------------------------------------------------------- 4. la vía nevada (los tramos de la gran nevada)
{
  const L = 2000;
  const t = V.sanearNevada([{ desde: 1990, hasta: 2030 }, { desde: 'x' }, null, { desde: 50, hasta: 40 }, { desde: 300, hasta: 330 }], L);
  ok(t.length === 2 && t[0].desde === 300 && t[1].desde === 1990 && t[1].hasta === 2030, `se sanean y se ordenan (${JSON.stringify(t)})`);
  ok(V.tramoNevado(10, t, L) === t[1] && V.tramoNevado(1995, t, L) === t[1] && V.tramoNevado(31, t, L) === null && V.tramoNevado(310, t, L) === t[0], 'el tramo que pasa por el fin del anillo también tapa');
  ok(V.distanciaANieve(280, t, L) === 20 && V.distanciaANieve(310, t, L) === 0 && V.distanciaANieve(1980, t, L) === 10, 'cuánto falta para la nieve');
  ok(!V.enLaNieve(undefined).pasa && V.enLaNieve({ loco: { quitanieves: true } }).pasa, 'sólo con quitanieves se pasa');
}

// ---------------------------------------------------------------- 5. los silbatos del taller y lo del viaje
{
  ok(V.silbatoDelTren(undefined, 'acorde') === 'acorde' && V.silbatoDelTren({ loco: { silbato: 'comun' } }, 'largo') === 'largo', "el 'común' es el de Personalizar (2.8)");
  ok(V.silbatoDelTren({ loco: { silbato: 'grave' } }) === 'grave' && Object.hasOwn(SILBATOS, 'grave') && V.silbatoDelTren({ loco: { silbato: 'doble' } }) === 'doble' && Object.hasOwn(SILBATOS, 'doble'), 'el grave y el doble son los de siempre');
  const p = V.silbatoDelTren({ loco: { silbato: 'pajaro' } });
  ok(typeof p === 'object' && p.canos.length >= 2 && p.toques.length >= 3 && p.canos.every(([f, v]) => f > 1000 && v > 0), 'el de pájaro: agudo y de varios toques');
  const v = V.sanearViaje({ caballo: 'si', mate: 'x' });
  ok(v.caballo === true && v.mate < -1e6 && V.puedeMatear(v, 30) && !V.puedeMatear({ mate: 29 }, 30) && V.puedeMatear({ mate: 28 }, 30), 'el mate: uno cada hora y media de juego');
  for (let d = 1; d < 40; d++) { const [a, b] = V.pasajerosDelDia(d); ok(a !== b && V.VIAJEROS.includes(a) && V.VIAJEROS.includes(b), `día ${d}: viajan dos vecinos distintos`); }
  ok(V.charlaDelViaje(0, 'Nélida', 'Mario').startsWith('Nélida:') && V.CHARLAS_DEL_VIAJE.every((f, i) => /:/.test(V.charlaDelViaje(i, 'A', 'B'))), 'las charlas del viaje');
  ok(V.FRASES_MATE.every((f) => f.length > 20) && typeof V.fraseMate(-3) === 'string', 'las frases del mate');
}

// ---------------------------------------------------------------- 6. el furgón: más fletes (comercio.js)
{
  const est = ['A', 'B', 'C', 'D'];
  const sin = C.fletesDelDia(5, est, 'A'), con = C.fletesDelDia(5, est, 'A', V.FURGON.fletesExtra);
  ok(sin.length === C.COMERCIO.fletesPorDia && con.length === sin.length + 2 && JSON.stringify(con.slice(0, sin.length)) === JSON.stringify(sin), 'con el furgón, dos fletes de carga más (y los de siempre, iguales)');
  ok(con.slice(sin.length).every((f) => f.tipo === 'carga') && new Set(con.map((f) => f.id)).size === con.length, 'los de más son de carga, con su id');
  const c = C.comercioNuevo();
  const otros = C.fletesDelDia(6, est, 'B', 2);
  for (const f of con) C.tomarFlete(c, f, V.FURGON.aLaVez);
  ok(c.fletes.length === 4 && C.tomarFlete(c, otros[0], V.FURGON.aLaVez).ok && C.tomarFlete(c, otros[1], V.FURGON.aLaVez).motivo === 'lleno', 'con el furgón, hasta cinco a la vez');
  ok(C.sanearComercio(JSON.parse(JSON.stringify(c))).fletes.length === 5 && V.FURGON.aLaVez === C.COMERCIO.fletesConFurgon, 'y se guardan los cinco');
  ok(C.tomarFlete(C.comercioNuevo(), con[0]).ok, 'sin el furgón, tomar sigue igual');
}

// ---------------------------------------------------------------- 7. el prototipo dejó de serlo
{
  ok(!fs.existsSync(path.join(raiz, 'src/tren-proto.js')) && !fs.existsSync(path.join(raiz, 'pruebas/visor-tren-proto.cjs')), 'ya no está el prototipo (tren-proto.js) ni su visor');
  const main = leer('src/main.js'), tren = leer('src/tren.js'), troch = leer('src/trochita.js'), viaje = leer('src/tren-viaje.js');
  ok(!/tren=proto|TREN_PROTO|tren-proto|armarTrenProto|crearTallerProto/.test(main), 'main.js no tiene más `?tren=proto`');
  ok(/^import \{ armarTren, aplicarMejoras \} from '\.\/tren\.js';$/m.test(main), 'main.js arma el tren de tren.js');
  ok(main.includes('armarTren: esDesafio ? null : (o) => armarTren({ ...o, T, estado: progreso?.tren,'), 'sólo en el Relax (en el Desafío, el tren de siempre)');
  ok(/^export function aplicarMejoras\(estado\) \{$/m.test(tren) && /^export function armarTren\(o = \{\}\) \{$/m.test(tren) && !/^export function crearTaller\(/m.test(tren), 'tren.js: armarTren y aplicarMejoras (para el taller; 3.7.3 (taller): el taller del prototipo se sacó, el del juego es el de la aldea)');
  // armar.mjs: imports en una línea, sin `export ... from`, sin export async/function*; sin ñ en lo exportado
  for (const [f, t] of [['tren.js', tren], ['tren-viaje.js', viaje]]) {
    ok(!/^export (async function|function\*)|^export .* from |^import '/m.test(t), `${f}: exports e imports que entiende armar.mjs`);
    const exp = [...t.matchAll(/^export (?:const|let|function|class) ([\wñÑ]+)/gm)].map((m) => m[1]);
    ok(exp.every((x) => !/[ñÑ]/.test(x)), `${f}: lo exportado sin ñ`);
  }
  ok(!/from 'three'|document\.|window\./.test(viaje), 'tren-viaje.js es puro');
  // el three del juego está recortado: todo lo que usa tren.js tiene que estar
  const three = leer('three-r186-inline.js');
  const exportado = new Set([...three.slice(three.lastIndexOf('return {')).matchAll(/^\s+(\w+): /gm)].map((m) => m[1]));
  const usados = [...new Set([...tren.matchAll(/THREE\.(\w+)/g)].map((m) => m[1]))];
  ok(usados.length > 10 && usados.every((u) => exportado.has(u)), `three del juego: ${usados.filter((u) => !exportado.has(u)).join(', ') || 'todo lo que usa tren.js está'}`);
  ok(!/DynamicDrawUsage|Uint32BufferAttribute|Uint16BufferAttribute|ShapeGeometry|Vector4|Frustum/.test(tren.replace(/\/\/.*$/gm, '')), 'nada de lo que el three del juego no trae');
  // lo que tiene que estar en trochita.js
  for (const k of ['const poste = (p) => p.s + (tren.adelanto || 0);', 'function taparVia(tramos) {', 'if (tren.puertas) return !!puertaCerca(js);', 'asientoActual: () =>', 'tren.alActualizar?.({ dt, s: est.s, vel: est.vel, noche, lejos, subido: est.subido, camara, enVia, enNieve: nieve.adentro });', "import { TREN, sanearNevada, tramoNevado, distanciaANieve } from './tren-viaje.js';"]) ok(troch.includes(k), `trochita.js: ${k.slice(0, 60)}`);
  ok(leer('src/sonido.js').includes("const S = tipo && typeof tipo === 'object' && Array.isArray(tipo.canos) ? tipo : silbatoDe(tipo);"), 'sonido.js: el silbato del taller (con sus caños)');
  ok(leer('src/fotos.js').includes('* (c.lente ? 1.5 : 1) * (c.mirador ? 1.4 : 1)') && main.includes('mirador: !!lugarDelTren()?.mirador,'), 'fotos.js: desde el coche mirador, los animales salen desde más lejos');
  ok(leer('src/comercio-mundo.js').includes('fletesDelDia(dia, estaciones(), nombre, extraFletes())') && main.includes("furgon: () => (conVagon('carga') ? { extra: FURGON.fletesExtra, aLaVez: FURGON.aLaVez } : null),"), 'comercio-mundo.js: el furgón');
  ok(main.includes("cocinaComedor = cocinaJuego.registrarMovil({") && main.includes("id: 'tren-comedor', tipo: 'cocina-lena', techo: true,") && main.includes('tren.tren.cocina(c, c ? RECETA_PASOS[c.receta] : null);'), 'main.js: la cocina del comedor es la cocina móvil de la 3.7.2, y tren.js dibuja su fuego y su olla');
  ok(tren.includes("ctx.conPieza('comedor.fuego'") && tren.includes("ctx.conPieza('comedor.olla-grande'") && tren.includes("ctx.conPieza('comedor.olla-dulce'") && tren.includes("ctx.conPieza('comedor.olla-jarro'"), 'tren.js: el fuego y las tres ollas del comedor');
  // la tecla E y el aviso, en el mismo orden
  const iE = main.indexOf("case 'KeyE': {"), e = main.slice(iE, main.indexOf("case 'KeyJ':", iE));
  ok(e.indexOf('if (js.enTren && usarLugarDelTren()) break;') >= 0 && e.indexOf('if (js.enTren && usarLugarDelTren()) break;') < e.indexOf('if (js.enTren && tren.conduciendo()) { bajarDeLaCabina(); break; }'), 'E: lo de cada lugar del tren antes que bajar');
  ok(e.indexOf('if (js.montado && jaulaCerca()) { subirCaballoAlTren(); break; }') >= 0 && e.indexOf('if (js.montado && jaulaCerca())') < e.indexOf('if (js.montado) { desmontar(); break; }'), 'E: montado al lado de la jaula, sube el caballo (antes que bajarte)');
  ok(main.includes("else aviso = avisoLugarDelTren() || (tren.parado() ? { tecla: 'E', texto: 'Bajar del tren' } : ")   /* 3.8.4: (y varado en la nieve, bajarte) */ && main.includes("jaulaCerca() ? { tecla: 'E', texto: 'Subir el caballo a la jaula del tren' }"), 'el aviso dice lo mismo');
  ok(main.includes('|| alCalorDelTren());') && main.includes("op?.enTren ? (conVagon('pasajeros') ? 'calentito' : 'normal')"), 'la salamandra saca el frío; en la cucheta se duerme (con la salamandra, calentito)');
  ok(main.includes('prepararTren(dt);') && main.includes('ctxTren.manejo = cacheManejo.manejo;') && main.includes('ctxTren.agarre = cacheManejo.agarre;'), 'la caldera, el freno y el arenero llegan a la cabina');
  // los pulidos del prototipo
  ok(tren.includes("caballoJaula = apariencia ? mallaCaballo(apariencia) : mallaCaballo();") && main.includes("tren.tren.ponerCaballo(caballoMundo?.apariencia?.() || null);"), 'el caballo de la jaula es el tuyo');
  ok(tren.includes("else if (dentro.tipo === 'dormitorio') { luzFuego.position.set(0.3, 2.4, 0).applyMatrix4(dentro.o.matrixWorld); luzFuego.intensity = 2.2 + noche * 4.2;"), 'el dormitorio de noche, con más luz');
  ok(tren.includes('const pf = enVia(s + 14);') && tren.includes('function curvarHaz(geo, haz)') && tren.includes('new THREE.SpotLight(0xffe2ab, 0, 32, 0.26, 0.75, 1.5)'), 'el farol: el haz sigue la vía y el foco apunta a la vía, bajo y angosto (sin brillo en las copas)');
  ok(tren.includes('const LEJOS_ADENTRO = 45;') && tren.includes('nombres.push(`${id}.adentro`);'), 'los interiores se apagan de lejos');
  ok(!/escena\.add\(|new THREE\.(MeshStandardMaterial|MeshPhongMaterial)/.test(tren.slice(tren.indexOf('export function armarTren'), tren.indexOf('// La nieve de la gran nevada'))), 'el tren no agrega nada suelto a la escena ni materiales nuevos');
}

// ---------------------------------------------------------------- 8. la prueba está en verify
ok(JSON.parse(leer('package.json')).scripts.verify.includes('node pruebas/verificar-3-7-3-tren.mjs'), 'la prueba está en verify');
console.log(`OK 3.7.3 tren: la trochita mejorada, sus vagones y su manejo (${n} comprobaciones)`);
