// 4.10 base («Volver a jugar», tanda de la base): las defensas que se curten con las noches, los trofeos del tablero y el perro que
// aprende. Las reglas puras en Node, las piezas y el mundo con el three de verdad en una vm (el arnés de ayuda-4-0-1-mundo), el guardado
// de una partida (nueva, vieja y rota) y los enganches con el juego (desafio.js, main.js, aliados, interacciones).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { cargar } from './ayuda-4-0-1-mundo.mjs';
import * as ME from '../src/desafio-mejoras-base.js';
import * as TR from '../src/desafio-trofeos.js';
import * as PE from '../src/desafio-perro-aprende.js';
import * as BO from '../src/desafio-bonos.js';
import * as CR from '../src/desafio-crece.js';
import * as AS from '../src/desafio-asedio.js';
import { RECETAS, desafioNuevo, sanearDesafio } from '../src/desafio-reglas.js';
import { htmlBase, htmlCrece, resumirBase } from '../src/base-estado.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8').replace(/\r\n/g, '\n');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
// (los objetos que arma la vm tienen otros prototipos: se comparan por su JSON)
const jn = (v) => (v === undefined ? 'sin valor' : JSON.parse(JSON.stringify(v)));
const eq = (a, b, t) => { pasos++; assert.deepEqual(jn(a), jn(b), t); };
const V0 = { jefe: -1, pina: false, corona: false, raiz: false };   // lo que se miró de una partida nueva
const cerca = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

// ------------------------------------------------------------------ el mundo de mentira (con el three de verdad)
const M = cargar(['construccion.js', 'colisiones.js', 'desafio-base-juego.js', 'desafio-aliados.js']);
const { THREE } = M, C = M.construccion;
function mundo(extraT = {}) {
  const col = M.colisiones.crearColisiones();
  const T = { altura: () => 0, agua: () => false, normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {}, ...extraT };
  const veg = { arboles: [], despejar: () => {} };
  const s = C.crearConstruccion(T, new THREE.Scene(), col, veg, { agregar() {}, agregarPostigos() {}, eliminarPorDuenio() {} });
  const mats = { tronco: 999, tabla: 999, piedra: 999, lana: 999, cuero: 999, hierro: 999, cristal: 999 };
  const terminar = (id, x, z, yaw = 0, y = null) => {
    s.elegir(C.PLANO[id]);
    const f = s.fundar(x, z, yaw, y);
    if (!f.ok) return f;
    while (f.obra.datos.etapas < f.obra.plano.etapas.length) { const r = s.avanzar(f.obra, mats); if (!r.ok) return r; }
    return { ok: true, o: f.obra };
  };
  return { s, col, T, terminar, mats };
}
// el estado de la partida y la api de mentira que le pasa desafio.js a la base
function partida(extra = {}) {
  const d = desafioNuevo();
  const notas = [], cola = [];
  const api = {
    D: () => d, notas, cola,
    nota: (t, s, n) => notas.push([t, s, !!n]), esperar: (f, ms) => cola.push([f, ms]),
    alGuardarObras() { api.guardadas = (api.guardadas || 0) + 1; }, guardar() { api.guardado = (api.guardado || 0) + 1; },
    perroPresente: () => extra.perro !== false,
  };
  return { d, api, notas, cola, soltar: () => { while (cola.length) cola.shift()[0](); } };
}
const efectosFalsos = () => { const l = []; return { l, destello: (p, k, c) => l.push(['destello', k, c]) }; };
const vertices = (g) => g.getAttribute('position').count;
const tiposDe = (g) => new Set(g.getAttribute('aTipo').array);
const hijos = (o) => o.grupo.children.length;
const placa = (o) => o.grupo.children.find((x) => x !== o.malla);
// una noche entera de la base: anochece, (golpea si `golpe`), amanece. Devuelve lo que subió.
function noche(base, p, n, golpear = []) {
  p.d.oleadas = n;
  base.alAnochecer(n);
  for (const o of golpear) base.participo(o);
  base.alAmanecer(n);
  p.soltar();
}

// ================================================================== 1. LAS DEFENSAS QUE MEJORAN (reglas)
{
  eq(ME.CURTIDO.noches, [0, 2, 4, 7], 'el nivel 1 a las 2 noches, el 2 a las 4, el 3 a las 7');
  eq([0, 1, 2, 3, 4, 6, 7, 20].map(ME.nivelPorNoches), [0, 0, 1, 1, 2, 2, 3, 3], 'los niveles según las noches contadas');
  ok(ME.CURTIDO.maximo === 3, 'hasta tres niveles');
  ok(ME.nivelPorNoches(-4) === 0 && ME.nivelPorNoches('x') === 0 && ME.nivelPorNoches(null) === 0 && ME.nivelPorNoches(NaN) === 0, 'una cuenta rara es nivel 0');
  eq([0, 1, 2, 3].map(ME.factorDano), [1, 0.9, 0.8, 0.7], 'cada nivel le saca un poco de daño');
  ok(ME.factorDano(9) === 0.7 && ME.factorDano(-1) === 1 && ME.factorDano('a') === 1, 'el factor nunca se pasa del último nivel ni sube el daño');
  ok(ME.CURTIDO.dano.every((v, i, a) => i === 0 || v < a[i - 1]), 'cada nivel recibe menos daño que el anterior');
  ok(ME.CURTIDO.cura > 0 && ME.CURTIDO.cura <= 0.3, 'al subir recupera un poco de resistencia, no la repone entera');
  ok(ME.nochesParaSubir({ n: 0 }) === 2 && ME.nochesParaSubir({ n: 3 }) === 1 && ME.nochesParaSubir({ n: 7 }) === 0, 'cuántas noches faltan para el nivel que viene');

  // el ciclo de la noche: cuenta si estuvo en pie al anochecer y recibió daño o participó
  let c = ME.alAnochecer(undefined, 3);
  eq(c, { n: 0, e: 3, t: 0 }, 'al anochecer queda anotada para esa noche, sin experiencia');
  let r = ME.alAlba(c, 3);
  ok(!r.conto && !r.subio && r.curt === undefined, 'si no recibió daño ni participó, la noche no cuenta');
  c = ME.alAnochecer(undefined, 3); ME.tocar(c, 3);
  r = ME.alAlba(c, 3);
  eq(r.curt, { n: 1, e: -1, t: 0 }, 'recibió daño: la noche cuenta y la marca de esta noche se borra');
  ok(r.conto && !r.subio, 'una noche sola todavía no sube de nivel');
  c = ME.alAnochecer({ n: 1, e: -1, t: 0 }, 4); ME.tocar(c, 4);
  r = ME.alAlba(c, 4);
  ok(r.subio && r.nivel === 1 && r.curt.n === 2, 'la segunda noche con daño sube al nivel 1');
  // tocar otra noche no cuenta (el daño de ayer no vale para hoy)
  c = ME.alAnochecer({ n: 1, e: -1, t: 0 }, 5); ME.tocar(c, 4);
  ok(c.t === 0, 'un golpe anotado para otra noche no vale');
  ok(ME.tocar(undefined, 5) === undefined, 'una obra que no estaba al anochecer no suma nada (no tiene marca)');
  // la defensa que no estaba al anochecer (se construyó de madrugada) no cuenta
  r = ME.alAlba(undefined, 6);
  ok(!r.conto && r.curt === undefined, 'sin marca de la noche, no hay experiencia');
  // alba de otra noche: la marca quedó vieja, no suma
  r = ME.alAlba({ n: 2, e: 3, t: 1 }, 9);
  ok(!r.conto && r.curt.n === 2, 'una marca de otra noche no suma');
  // tope
  let t = { n: 7, e: 10, t: 1 };
  r = ME.alAlba(t, 10);
  ok(r.curt.n === ME.CURTIDO.tope && !r.subio, 'el tope de noches contadas; no sube más del nivel 3');
  ok(ME.sanearCurtido({ n: 99, e: 5, t: 1 }).n === 7, 'el saneo respeta el tope');

  // el saneo de lo guardado
  eq(ME.sanearCurtido({ n: 3, e: 8, t: 1 }), { n: 3, e: 8, t: 1 }, 'lo bueno se queda');
  eq(ME.sanearCurtido({ n: '3', e: '8', t: 'x' }), { n: 3, e: 8, t: 1 }, 'los números de texto se arreglan');
  eq(ME.sanearCurtido({ n: -5, e: 4, t: 0 }), { n: 0, e: 4, t: 0 }, 'sin noches negativas');
  ok(ME.sanearCurtido(null) === undefined && ME.sanearCurtido([]) === undefined && ME.sanearCurtido('hola') === undefined && ME.sanearCurtido(7) === undefined, 'lo que no es un objeto se descarta');
  ok(ME.sanearCurtido({ n: 0, e: -1, t: 0 }) === undefined && ME.sanearCurtido({}) === undefined, 'sin nada que guardar, no queda nada');
  const raro = ME.sanearCurtido({ n: Infinity, e: NaN, t: true });
  ok(raro === undefined || (Number.isInteger(raro.n) && Number.isInteger(raro.e) && raro.n <= 7), 'Infinity y NaN no pasan: o se descarta o quedan enteros dentro de los topes');

  // los nombres («Pirca curtida · nivel 2»)
  eq([ME.nombreCurtido('Pirca', 2), ME.nombreCurtido('Muro de pirca', 1), ME.nombreCurtido('Portón de empalizada', 3), ME.nombreCurtido('Torre de vigía', 1), ME.nombreCurtido('Troncos colgantes', 2)],
    ['Pirca curtida · nivel 2', 'Muro de pirca curtido · nivel 1', 'Portón de empalizada curtido · nivel 3', 'Torre de vigía curtida · nivel 1', 'Troncos colgantes curtidos · nivel 2'], 'el género sale del nombre');
  ok(ME.nombreCurtido('Empalizada de troncos', 0) === 'Empalizada de troncos', 'sin nivel, el nombre de siempre');
  const sub = ME.textoSubida('Empalizada de troncos', 2);
  ok(sub.titulo === 'Empalizada de troncos curtida · nivel 2' && /20% menos daño/.test(sub.texto), 'el aviso de la subida dice el nivel y cuánto cambia');
  ok(/ya no sube más/.test(ME.textoSubida('Pirca', 3).texto), 'en el nivel 3 avisa que es el último');

  // la placa: pocas piezas, sólo madera y piedra / metal, una barrita por nivel
  for (const piedra of [false, true]) {
    for (let n = 1; n <= 3; n++) {
      const pz = ME.piezasDePlaca(n, piedra);
      ok(pz.length > 0 && pz.length <= 8, `placa de nivel ${n}: pocas piezas (${pz.length})`);
      ok(pz.every((q) => q.tipo === 0 || q.tipo === 4), 'placa: sólo tipo 0 y 4');
      ok(pz.filter((q) => q.color === ['#b0793c', '#c89a48', '#e6c25a'][n - 1]).length === n, `placa de nivel ${n}: ${n} barritas`);
    }
  }
  eq(ME.piezasDePlaca(0), [], 'sin nivel, sin placa');
  ok(ME.piezasDePlaca(3).length > ME.piezasDePlaca(1).length, 'cuanto más nivel, más marca');
  // sólo se curten las que se pueden romper a la vista
  const PL = (id) => C.PLANO[id];
  ok(['empalizada', 'muro-piedra', 'porton-empalizada', 'torre-vigia', 'ballesta-fija', 'muro-tronera'].every((id) => ME.curtible(PL(id))), 'las murallas, el portón, la torre y la ballesta se curten');
  ok(['trampa-miel', 'pasadizo', 'estacas', 'abrojos', 'foso-estacas', 'tablero-trofeos'].every((id) => !ME.curtible(PL(id))), 'las trampas que se gastan, lo oculto y el tablero no');
  ok(['antorcha', 'campana', 'armero', 'adarve', 'baliza-sanacion', 'senuelo', 'pasarela-colgante'].every((id) => !ME.curtible(PL(id))), 'lo que no pelea ni recibe los golpes (antorcha, campana, armero…) no se curte');
  ok(ME.CURTIBLES.every((id) => C.PLANO[id]), 'la lista de lo que se curte sólo nombra planos que existen');
  eq(ME.resumenNiveles([0, 1, 1, 3, 2, 0]), [2, 2, 1, 1], 'cuántas defensas hay en cada nivel');
  // dónde se cuelga: sobre lo más saliente a esa altura (las puntas de los troncos), por delante y por detrás
  {
    const sin = ME.sitioDePlaca({ alto: 2.6, fondo: 0.5 });
    ok(cerca(sin.y, 1.45) && cerca(sin.delante, 0.25 + ME.PLACA.grueso / 2) && sin.delante === sin.detras, 'sin geometría: a la mitad del fondo');
    const v = [0, 1.45, -0.27, 0.1, 1.5, 0.18, 1.2, 1.45, -0.9, 0, 0.2, -0.6];   // (los dos últimos no están a esa altura o están lejos de la placa)
    const con = ME.sitioDePlaca({ alto: 2.6, fondo: 0.5 }, v);
    ok(cerca(con.delante, 0.27 + ME.PLACA.grueso / 2) && cerca(con.detras, 0.18 + ME.PLACA.grueso / 2), 'con la geometría: pegada a lo más saliente de cada cara');
    const lejos = ME.sitioDePlaca({ alto: 2.6, fondo: 0.5 }, [0, 1.45, -3, 0, 1.45, 3]);
    ok(cerca(lejos.delante, 0.25 + ME.PLACA.grueso / 2) && cerca(lejos.detras, 0.25 + ME.PLACA.grueso / 2), 'lo que sobresale demasiado (una escalera, un brazo) no cuenta: queda a la mitad del fondo');
    // sin nada a esa altura y a lo ancho de la placa, se apoya en lo que haya en la franja más ancha (un poste de la torre), centrada ahí
    const poste = ME.sitioDePlaca({ alto: 3.6, fondo: 3.4, ancho: 3.4 }, [-1.2, 1.45, -1.2, -1.2, 1.5, -1.3, 1.2, 1.45, 1.1, 1.2, 1.4, 1.3, 0, 0.1, -1.5]);
    ok(cerca(poste.delante, 1.3 + ME.PLACA.grueso / 2) && cerca(poste.xDelante, -1.2) && cerca(poste.xDetras, 1.2) && cerca(poste.detras, 1.3 + ME.PLACA.grueso / 2), 'en una torre abierta se clava en el poste: ahí queda la placa, no flotando en el medio');
    const ancha = ME.sitioDePlaca({ alto: 2.6, fondo: 0.5, ancho: 0.6 }, [0.5, 1.45, -0.2]);
    ok(Math.abs(ancha.xDelante) <= Math.max(0, 0.3 - ME.PLACA.ancho / 2) + 1e-9, 'una obra más angosta que la placa: la placa queda en el centro');
    ok(cerca(ME.sitioDePlaca({ alto: 1.7, fondo: 0.8 }).y, 1.054), 'una pirca baja: la placa más abajo');
  }
}

// ================================================================== 2. LOS TROFEOS (reglas)
{
  eq(TR.TROFEOS.length, 7, 'siete trofeos');
  eq(new Set(TR.IDS_TROFEOS).size, 7, 'ids únicos');
  eq(TR.IDS_TROFEOS, ['casco', 'hongo', 'ojo', 'piedra', 'pina', 'corona', 'raiz'], 'el orden del tablero');
  ok(TR.TROFEOS.every((t) => t.nombre && t.de && t.texto && t.hito && BO.BONOS_CLAVES.includes(t.bono.clave) && t.bono.valor > 0), 'cada uno tiene nombre, de quién es y un bono del contrato');
  ok(new Set(TR.TROFEOS.map((t) => t.bono.clave)).size === 6, 'entre los siete usan las seis claves de bono');
  ok(TR.TROFEOS.filter((t) => t.bono.clave !== 'saludMax').every((t) => t.bono.valor <= 0.15) && TR.TROFEOS.filter((t) => t.bono.clave === 'saludMax').every((t) => t.bono.valor <= 6), 'efectos chicos: a lo sumo 15 % (y 5 puntos de salud)');
  // cada uno entra en el tope con el que el juego los aplica, también todos juntos
  const todos = Object.fromEntries(TR.IDS_TROFEOS.map((id) => [id, 1]));
  const suma = TR.bonosDeTrofeos(todos);
  ok(Object.entries(suma).every(([k, v]) => v <= BO.TOPES_BONO[k][1] + 1e-9 || k === 'reparar' || k === 'saludMax'), 'juntos no pasan el tope de ninguna clave');
  ok(cerca(suma.saludMax, 10) && cerca(suma.recarga, 0.06) && cerca(suma.reparar, 0.15), 'la suma de los bonos por clave');
  // los jefes: una vez cada cinco noches, y el que se repite no da otro
  eq([5, 10, 15, 20, 25, 30].map(TR.trofeoDeJefe), ['casco', 'hongo', 'ojo', 'piedra', 'casco', 'hongo'], 'cada mandamás da su trofeo');
  ok(TR.trofeoDeJefe(-1) === null && TR.trofeoDeJefe(0) === null && TR.trofeoDeJefe('x') === null, 'sin jefe caído, ninguno');
  eq(TR.trofeosQueCorresponden({}), [], 'una partida nueva no tiene ninguno');
  eq(TR.trofeosQueCorresponden({ jefeCaido: 10 }), ['hongo'], 'el mandamás de la noche 10');
  eq(TR.trofeosQueCorresponden({ puertitaAbierta: true }), ['pina'], 'la puertita del Coihue abierta: la piña');
  eq(TR.trofeosQueCorresponden({ reyCaido: true }), ['pina', 'corona'], 'cae el Rey Duende: la piña y la corona');
  eq(TR.trofeosQueCorresponden({ victoria: true, nidoCaido: true, jefeCaido: 20 }), ['piedra', 'pina', 'corona', 'raiz'], 'la victoria y el nido');
  // lo nuevo: cada cosa se mira una sola vez
  {
    const v = TR.vistosNuevos();
    eq(TR.trofeosNuevos({ jefeCaido: 5 }, v), ['casco'], 'cae el primer mandamás');
    eq(TR.trofeosNuevos({ jefeCaido: 5 }, v), [], 'mirar otra vez no da otro');
    eq(TR.trofeosNuevos({ jefeCaido: 10 }, v), ['hongo'], 'el siguiente sí');
    eq(TR.trofeosNuevos({ jefeCaido: 25 }, v), ['casco'], 'una muerte nueva del clásico vuelve a dar el casco (si lo habías perdido)');
    eq(TR.trofeosNuevos({ jefeCaido: 25, reyCaido: true }, v), ['pina', 'corona'], 'cae el Rey Duende');
    eq(TR.trofeosNuevos({ jefeCaido: 25, reyCaido: true, victoria: true, nidoCaido: true }, v), ['raiz'], 'y después el nido, sin repetir lo anterior');
    eq(TR.trofeosNuevos({ jefeCaido: -1 }, TR.vistosNuevos()), [], 'sin mandamás caído, ninguno');
    eq(TR.sanearVistos(null), V0, 'una partida vieja: nada visto');
    eq(TR.sanearVistos({ jefe: '15', pina: true, corona: 'sí', raiz: 1 }), { jefe: 15, pina: true, corona: false, raiz: false }, 'sólo los verdaderos son verdaderos');
    eq(TR.sanearVistos({ jefe: NaN }).jefe, -1, 'NaN: ninguno');
    eq(TR.sanearVistos({ jefe: 1e12 }).jefe, 1e6, 'con tope');
  }
  // ganar y sanear
  const g = {};
  ok(TR.ganarTrofeo(g, 'casco', 5) && !TR.ganarTrofeo(g, 'casco', 9) && g.casco === 5, 'se gana una vez y queda la noche en que se ganó');
  ok(!TR.ganarTrofeo(g, 'inventado', 1) && !TR.ganarTrofeo(g, '__proto__', 1) && !TR.ganarTrofeo(g, 'constructor', 1) && Object.keys(g).length === 1, 'sólo los siete');
  eq(TR.sanearTrofeos({ casco: '5', hongo: 12.7, ojo: -3, piedra: 'x', pina: null, corona: true, falso: 4, __proto__: { raiz: 1 } }), { casco: 5, hongo: 12, ojo: 0 }, 'el saneo deja sólo los ganados, con noches enteras');
  eq(TR.sanearTrofeos(null), {}, 'una partida vieja: ninguno');
  eq(TR.sanearTrofeos([1, 2]), {}, 'ni una lista');
  eq(TR.ganados({ raiz: 1, casco: 2 }), ['casco', 'raiz'], 'en el orden del tablero');
  ok(/Casco de corteza/.test(TR.textoGanado('casco').titulo) && /\+5 de salud máxima/.test(TR.textoGanado('casco').texto) && /\+6 % velocidad de recarga/.test(TR.textoGanado('hongo').texto), 'el aviso dice el trofeo y su efecto');
  ok(TR.textoGanado('x') === null, 'un trofeo que no existe no tiene texto');
  ok(/2 de 7/.test(TR.textoTablero({ casco: 1, raiz: 2 }).titulo) && /guardados/.test(TR.textoTablero({ casco: 1 }, false).titulo), 'el texto del tablero cuenta y avisa si están guardados');
  ok(/Todavía no/.test(TR.textoTablero({}).texto), 'sin trofeos lo dice');
  // sitios: siete lugares distintos, dentro del tablero
  const sitios = TR.TROFEOS.map((t, i) => TR.sitioDeTrofeo(i));
  ok(new Set(sitios.map((s) => `${s.x.toFixed(2)},${s.y}`)).size === 7, 'siete lugares distintos');
  ok(sitios.every((s) => Math.abs(s.x) < TR.TABLERO.ancho / 2 - 0.25 && s.y > 0.8 && s.y < 2.3), 'todos dentro de la tabla');
  // el asedio de verdad: la puertita abierta es la de `puedeAbordar`
  const asedio = AS.asedioNuevo([{ id: 'base', x: 0, z: 0 }, { id: 'estacion', x: 5, z: 5 }, { id: 'lago', x: 9, z: 9 }, { id: 'bosque', x: 1, z: 9 }], { x: 0, z: 0 });
  ok(!AS.puedeAbordar(asedio), 'con las agujas en pie, la puertita está cerrada');
  for (const z of asedio.zonas.slice(0, 3)) z.estado = 'recuperada';
  ok(AS.puedeAbordar(asedio), 'con tres zonas libres, se abre');
}

// ================================================================== 3. EL PERRO QUE APRENDE (reglas)
{
  eq(PE.PERRO_NIVELES.noches, [0, 3, 6, 10], 'el nivel 1 a las 3 noches, el 2 a las 6 y el 3 a las 10');
  eq([0, 2, 3, 5, 6, 9, 10, 40].map(PE.nivelDelPerro), [0, 0, 1, 1, 2, 2, 3, 3], 'los niveles del perro según las noches con vos');
  eq([0, 1, 2, 3].map(PE.alcanceDelPerro), [1, 1.15, 1.3, 1.5], 'gruñe de más lejos cuanto más curtido');
  eq([0, 1, 2, 3].map(PE.danoDelPerro), [1, 1.15, 1.3, 1.5], 'y muerde más fuerte');
  ok(PE.alcanceDelPerro(99) === 1.5 && PE.alcanceDelPerro(-2) === 1 && PE.danoDelPerro('x') === 1, 'los niveles raros no se pasan ni bajan del 1');
  ok(PE.PERRO_NIVELES.alcance.every((v, i, a) => i === 0 || v > a[i - 1]) && PE.PERRO_NIVELES.dano.every((v, i, a) => i === 0 || v > a[i - 1]), 'cada nivel mejora al anterior');
  const p = { noches: 2 };
  let r = PE.nocheConElPerro(p);
  ok(r.antes === 0 && r.ahora === 1 && p.noches === 3, 'la tercera noche sube el nivel');
  r = PE.nocheConElPerro(p);
  ok(r.antes === 1 && r.ahora === 1 && p.noches === 4, 'la cuarta no');
  for (let i = 0; i < 20; i++) PE.nocheConElPerro(p);
  ok(p.noches === PE.PERRO_NIVELES.tope && PE.nivelDelPerro(p.noches) === 3, 'tope de noches y nivel 3');
  eq(PE.sanearPerro(undefined), { noches: 0 }, 'una partida vieja: el perro sin curtir');
  eq(PE.sanearPerro({ noches: '4' }), { noches: 4 }, 'texto numérico');
  eq(PE.sanearPerro({ noches: -3 }), { noches: 0 }, 'sin negativas');
  eq(PE.sanearPerro({ noches: 1e9 }), { noches: 10 }, 'con tope');
  eq(PE.sanearPerro({ noches: NaN }), { noches: 0 }, 'NaN');
  eq(PE.sanearPerro({ noches: null }), { noches: 0 }, 'null');
  eq(PE.sanearPerro({ noches: true }), { noches: 0 }, 'true');
  eq(PE.sanearPerro('perro'), { noches: 0 }, 'un texto');
  ok(PE.nochesParaSubir({ noches: 4 }) === 2 && PE.nochesParaSubir({ noches: 10 }) === 0, 'cuántas noches faltan');
  ok(/más curtido/.test(PE.textoSubidaPerro(2).titulo), 'el aviso del nivel 2: «El perro está más curtido»');
  ok(/más atento/.test(PE.textoSubidaPerro(1).titulo) && /perro de guerra/.test(PE.textoSubidaPerro(3).titulo), 'los otros dos niveles');
  ok(/30% más lejos/.test(PE.textoPerro(2)) && /30% más fuerte/.test(PE.textoPerro(2)), 'la ficha dice cuánto');
  ok(/todavía está aprendiendo/.test(PE.textoPerro(0)), 'sin nivel, lo dice');
  // el gruñido del perro de verdad: `avisoDelPerro` con el alcance del nivel
  const { avisoDelPerro, PERRO_GRUNE } = await import('../src/desafio-sentidos.js');
  ok(avisoDelPerro({ distancia: PERRO_GRUNE * 1.1, visto: false, alcance: 1 }) === null, 'a 46 m un perro sin curtir no avisa');
  ok(avisoDelPerro({ distancia: PERRO_GRUNE * 1.1, visto: false, alcance: PE.alcanceDelPerro(1) }) === 'grunir', 'a 46 m el del nivel 1 ya gruñe');
  ok(avisoDelPerro({ distancia: PERRO_GRUNE * 1.4, visto: false, alcance: PE.alcanceDelPerro(2) }) === null && avisoDelPerro({ distancia: PERRO_GRUNE * 1.4, visto: false, alcance: PE.alcanceDelPerro(3) }) === 'grunir', 'el del nivel 3 oye de más lejos que el del 2');
}

// ================================================================== 4. LO GUARDADO: partida nueva, vieja y rota
{
  const n = desafioNuevo();
  eq(n.crece, { trofeos: {}, vistos: V0, perro: { noches: 0 } }, 'la partida nueva empieza sin trofeos ni perro curtido');
  eq(sanearDesafio(null).crece, { trofeos: {}, vistos: V0, perro: { noches: 0 } }, 'una partida sin nada carga limpia');
  const vieja = JSON.parse(JSON.stringify(sanearDesafio(null))); delete vieja.crece;
  eq(sanearDesafio(vieja).crece, { trofeos: {}, vistos: V0, perro: { noches: 0 } }, 'una partida vieja (sin `crece`) carga limpia');
  const buena = sanearDesafio({ crece: { trofeos: { casco: 5, pina: 21 }, vistos: V0, perro: { noches: 7 } } });
  eq(buena.crece, { trofeos: { casco: 5, pina: 21 }, vistos: V0, perro: { noches: 7 } }, 'lo guardado se conserva');
  for (const feo of [null, 7, 'x', [], [1], { trofeos: 5, perro: 'a' }, { trofeos: [1, 2], perro: [] }, { trofeos: { falso: 3, __proto__: { casco: 1 } } }, { perro: { noches: {} } }]) {
    const s = sanearDesafio({ crece: feo }).crece;
    ok(s.trofeos && typeof s.trofeos === 'object' && !Array.isArray(s.trofeos) && Number.isInteger(s.perro.noches) && Object.keys(s.trofeos).every((k) => TR.IDS_TROFEOS.includes(k)), `una partida rota carga limpia (${JSON.stringify(feo)})`);
  }
  eq(CR.sanearCrece(JSON.parse(JSON.stringify(buena.crece))), buena.crece, 'ida y vuelta por JSON');
  // los bonos de la base viajan con los del guardián (desafio.bonos) y sobreviven al saneo
  const conBonos = sanearDesafio({ bonos: { origen: { trofeo: { saludMax: 5, recarga: 0.06 }, defensa: { reparar: 0.03 } } } });
  ok(BO.bonoDe(conBonos, 'saludMax') === 5 && cerca(BO.bonoDe(conBonos, 'recarga'), 0.06) && cerca(BO.bonoDe(conBonos, 'reparar'), 0.03), 'los bonos con origen «trofeo» y «defensa» se guardan');
  // las obras: la experiencia y los trofeos colgados, por el guardado de verdad
  const almacen = new Map();
  globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k), clear: () => almacen.clear(), key: (i) => [...almacen.keys()][i] ?? null, get length() { return almacen.size; } };
  const G = await import('../src/guardado.js');
  G.usarModoGuardado('desafio', 1);
  const pr = G.progresoNuevo();
  ok(pr.desafio.crece && Object.keys(pr.desafio.crece.trofeos).length === 0, 'el progreso nuevo del Desafío trae `crece`');
  pr.desafio.crece = { trofeos: { casco: 5 }, vistos: V0, perro: { noches: 4 } };
  pr.obras = [
    { plano: 'empalizada', x: 10, z: 10, rot: 0, etapas: 1, curt: { n: 3, e: 7, t: 1 } },
    { plano: 'muro-piedra', x: 20, z: 10, rot: 0, etapas: 1, curt: { n: 'mucho', e: 'x', t: 'sí' } },
    { plano: 'porton-empalizada', x: 30, z: 10, rot: 0, etapas: 1, curt: 'hola' },
    { plano: 'tablero-trofeos', x: 40, z: 10, rot: 0, etapas: 1, colgados: ['casco', 'raiz', 'inventado', 7, null, { a: 1 }] },
    { plano: 'tablero-trofeos', x: 50, z: 10, rot: 0, etapas: 1, colgados: 'todos' },
    { plano: 'empalizada', x: 60, z: 10, rot: 0, etapas: 1 },
  ];
  ok(G.guardarProgreso(pr), 'se guarda');
  const cargada = G.cargarProgreso();
  eq(cargada.desafio.crece, { trofeos: { casco: 5 }, vistos: V0, perro: { noches: 4 } }, 'los trofeos y el perro vuelven');
  const [a, b, cc, tab, tab2, sin] = cargada.obras;
  eq(a.curt, { n: 3, e: 7, t: 1 }, 'la experiencia de la defensa vuelve');
  ok(b.curt === undefined || (Number.isInteger(b.curt.n) && b.curt.n === 0), 'una experiencia rota no pasa');
  ok(cc.curt === undefined, 'un texto no es experiencia');
  eq(tab.colgados, ['casco', 'raiz'], 'sólo los trofeos que existen quedan colgados');
  ok(tab2.colgados === undefined, 'una lista rota se descarta');
  ok(sin.curt === undefined && !('colgados' in sin), 'una obra de antes carga como estaba');
  // una partida del Desafío vieja (sin `crece` ni `curt`) carga igual
  const vp = JSON.parse(almacen.get('hojarasca-desafio-v1'));
  delete vp.desafio.crece; for (const o of vp.obras) delete o.curt;
  almacen.set('hojarasca-desafio-v1', JSON.stringify(vp));
  const vc = G.cargarProgreso();
  eq(vc.desafio.crece, { trofeos: {}, vistos: V0, perro: { noches: 0 } }, 'sin `crece`: carga limpia');
  ok(vc.obras.length === 6 && vc.obras.every((o) => o.curt === undefined), 'sin `curt`: carga limpia');
  // el Relax no se entera
  G.usarModoGuardado('relax', 1);
  ok(G.progresoNuevo().desafio === undefined, 'el Relax no trae nada de esto');
}

// ================================================================== 5. LAS PIEZAS: el tablero de trofeos
{
  const tb = C.PLANO['tablero-trofeos'];
  ok(tb && tb.pieza && tb.soloDesafio && tb.categoria === 'defensa', 'el tablero es una pieza de defensa del Desafío');
  ok(tb.defensa.oculta && tb.defensa.tipo === 'trofeos', 'no cuenta como defensa para los vecinos que se instalan');
  ok(Object.values(tb.pide).reduce((s, v) => s + v, 0) <= 6 && !('cristal' in tb.pide), 'barato: pocas tablas y un tronco');
  ok(Number.isFinite(tb.vida) && tb.vida >= 200, 'se puede tirar pero aguanta un rato');
  ok(/E/.test(tb.texto) && /trofeos/.test(tb.texto), 'el texto dice qué hace');
  const w = mundo();
  const vacio = w.terminar('tablero-trofeos', 10, 10, 0);
  ok(vacio.ok, `se arma (${vacio.motivo || ''})`);
  const g0 = vacio.o.malla.geometry;
  ok([...tiposDe(g0)].every((t) => t === 0 || t === 4), `vacío: material tipo 0 o 4 (${[...tiposDe(g0)]})`);
  ok(vertices(g0) < 1500, `vacío: poca geometría (${vertices(g0)} vértices)`);
  ok(hijos(vacio.o) === 1, 'una sola malla');
  // con los siete colgados
  vacio.o.datos.colgados = [...TR.IDS_TROFEOS];
  w.s.rehacer(vacio.o);
  const g7 = vacio.o.malla.geometry;
  ok([...tiposDe(g7)].every((t) => t === 0 || t === 4), `con los siete: material tipo 0 o 4 (${[...tiposDe(g7)]})`);
  ok(vertices(g7) > vertices(g0), 'con trofeos tiene más piezas');
  ok(vertices(g7) < 9000, `con los siete: poca geometría (${vertices(g7)} vértices, ${vertices(g7) / 3 | 0} triángulos)`);
  ok(hijos(vacio.o) === 1, 'sigue siendo una sola malla');
  // cada trofeo solo: de pie sobre el estante, dentro de la tabla, sin flotar ni atravesar el frente
  g7.computeBoundingBox();
  const caja = g7.boundingBox;
  ok(caja.min.y >= -0.01 && caja.max.y <= 2.8, `el tablero entero va del suelo a ${caja.max.y.toFixed(2)} m`);
  ok(caja.min.z > -0.8 && caja.max.z < 0.4, `nada sale más de ${(-caja.min.z).toFixed(2)} m del frente`);
  for (const t of TR.TROFEOS) {
    const w2 = mundo();
    const r = w2.terminar('tablero-trofeos', 10, 10, 0);
    r.o.datos.colgados = [t.id]; w2.s.rehacer(r.o);
    const g = r.o.malla.geometry;
    ok([...tiposDe(g)].every((x) => x === 0 || x === 4), `${t.id}: tipo 0 o 4`);
    ok(vertices(g) - vertices(g0) > 0 && vertices(g) - vertices(g0) < 1300, `${t.id}: ${vertices(g) - vertices(g0)} vértices de más`);
  }
  // una lista rota no tira la malla
  const rota = mundo().terminar('tablero-trofeos', 10, 10, 0);
  for (const feo of ['todos', 5, null, [null, 3, {}, 'x', 'casco']]) { rota.o.datos.colgados = feo; ok(rota.o.datos.etapas > 0, `colgados raro (${JSON.stringify(feo)}) no rompe`); }
  // choca (como el armero)
  const w3 = mundo();
  const t3 = w3.terminar('tablero-trofeos', 10, 10, 0).o;
  ok(t3.fisica && w3.col.cercanos(10, 10).some((c) => c.duenio === t3), 'el tablero tiene cuerpo');
  // aparece en el menú del Desafío (la lista de piezas)
  ok(C.PLANOS.some((p) => p.id === 'tablero-trofeos') && leer('src/construccion.js').includes('PIEZAS.push(...PIEZAS_TROFEOS)'), 'se suma a las piezas');
}

// ================================================================== 6. LAS DEFENSAS QUE SE CURTEN, EN EL MUNDO
{
  const w = mundo();
  const p = partida();
  const base = M.desafio_base_juego.crearBaseCrece(w.s, efectosFalsos(), { pulsar() {}, bus: {} }, p.api);
  const emp = w.terminar('empalizada', 10, 10, 0).o, mur = w.terminar('muro-piedra', 20, 10, 0).o, lazo = w.terminar('trampa-lazo', 30, 10, 0).o, pasa = w.terminar('pasadizo', 40, 10, 0).o;
  ok(emp.datos.curt === undefined && base.nivelDe(emp) === 0 && base.factorDano(emp) === 1, 'una defensa nueva no tiene experiencia');
  // noche 1: la empalizada recibe daño; el muro no
  noche(base, p, 1, [emp]);
  eq(emp.datos.curt, { n: 1, e: -1, t: 0 }, 'aguantó una noche con daño: una noche contada');
  ok(mur.datos.curt === undefined, 'el muro que no recibió nada no suma');
  ok(base.nivelDe(emp) === 0 && p.notas.length === 0, 'una noche sola no cambia nada ni avisa');
  // noche 2: sube al nivel 1
  p.d.oleadas = 2;
  const vida0 = emp.datos.vida = 100;
  noche(base, p, 2, [emp, mur]);
  ok(base.nivelDe(emp) === 1 && cerca(base.factorDano(emp), 0.9), 'la segunda noche: nivel 1, recibe un 10 % menos');
  ok(p.notas.some(([t]) => t === 'Empalizada de troncos curtida · nivel 1'), `avisa con el nombre y el nivel (${JSON.stringify(p.notas)})`);
  ok(emp.datos.vida > vida0 && emp.datos.vida <= 100 + (emp.plano.vida || 0), 'al subir de nivel se repara un poco');
  ok(base.nombreDe(emp) === 'Empalizada de troncos curtida · nivel 1' && base.nombreDe(lazo) === lazo.plano.nombre, 'el nombre con el nivel para la pantalla de la base');
  ok(mur.datos.curt.n === 1, 'el muro suma su primera noche');
  // la placa
  base.actualizar(1);
  ok(hijos(emp) === 2 && placa(emp), 'la defensa curtida lleva una placa (una sola malla más)');
  ok(hijos(mur) === 1, 'el muro todavía no');
  const pl = placa(emp);
  ok(pl.material === emp.malla.material, 'usa el material de la propia obra (no hay shaders nuevos)');
  ok(pl.castShadow === false && pl.receiveShadow === true && pl.matrixAutoUpdate === false, 'no suma a la pasada de sombras ni se recalcula');
  ok([...tiposDe(pl.geometry)].every((t) => t === 0 || t === 4), `placa: material tipo 0 o 4 (${[...tiposDe(pl.geometry)]})`);
  ok(vertices(pl.geometry) < 700, `placa: poca geometría (${vertices(pl.geometry)} vértices)`);
  pl.geometry.computeBoundingBox();
  const bb = pl.geometry.boundingBox, P = emp.plano;
  ok(bb.min.y > 0.4 && bb.max.y < P.alto + 0.05, `la placa queda sobre la empalizada (de ${bb.min.y.toFixed(2)} a ${bb.max.y.toFixed(2)} m; la pared mide ${P.alto})`);
  ok(bb.min.z < -0.1 && bb.min.z > -(P.fondo / 2 + 0.2) && bb.max.z > 0.05 && bb.max.z < P.fondo / 2 + 0.2, `pegada a las dos caras, cada una donde está la madera (z de ${bb.min.z.toFixed(2)} a ${bb.max.z.toFixed(2)}, la pared tiene ${P.fondo} de fondo)`);
  // en TODAS las que se curten, la placa de cada cara toca la malla de la obra (nada flotando) y cuelga a la altura prevista
  for (const id of ME.CURTIBLES) {
    const ww = mundo();
    const r = ww.terminar(id, 10, 10, 0);
    if (!r.ok) { ok(/reforzando/.test(r.motivo || ''), `${id}: sólo se hace reforzando otra (${r.motivo})`); continue; }
    const pos = r.o.malla.geometry.getAttribute('position').array, sitio = ME.sitioDePlaca(r.o.plano, pos);
    const toca = (x, zPlano, signo) => { for (let i = 0; i < pos.length; i += 3) if (Math.abs(pos[i] - x) <= ME.PLACA.ancho / 2 + 0.03 && Math.abs(pos[i + 1] - sitio.y) <= ME.PLACA.alto / 2 + 1.0 && Math.abs(pos[i + 2] - signo * (zPlano - ME.PLACA.grueso / 2)) < 0.035) return true; return false; };
    ok(toca(sitio.xDelante, sitio.delante, -1), `${id}: la placa de adelante toca la malla (z ${(-sitio.delante + ME.PLACA.grueso / 2).toFixed(2)}, x ${sitio.xDelante.toFixed(2)})`);
    ok(toca(sitio.xDetras, sitio.detras, 1), `${id}: la placa de atrás toca la malla (z ${(sitio.detras - ME.PLACA.grueso / 2).toFixed(2)}, x ${sitio.xDetras.toFixed(2)})`);
    ok(Math.abs(sitio.xDelante) <= Math.max(0, r.o.plano.ancho / 2 - ME.PLACA.ancho / 2) + 1e-9 && sitio.y >= 0.4 && sitio.y <= r.o.plano.alto, `${id}: dentro del ancho y a una altura de la obra`);
  }
  // la placa se apoya en lo más saliente de la malla de la obra (la cara de la pirca, las puntas de los troncos), por delante y por detrás
  {
    const mur2 = w.terminar('muro-piedra', 130, 10, 0).o;
    mur2.datos.curt = { n: 4, e: -1, t: 0 };
    base.actualizar(1);
    const plp = placa(mur2);
    ok(plp, 'el muro de pirca también lleva su placa');
    plp.geometry.computeBoundingBox();
    const bm = plp.geometry.boundingBox;
    const sitio = ME.sitioDePlaca(mur2.plano, mur2.malla.geometry.getAttribute('position').array);
    const sinGeo = ME.sitioDePlaca(mur2.plano);
    ok(Math.abs(sitio.delante - sinGeo.delante) > 0.005 || Math.abs(sitio.detras - sinGeo.detras) > 0.005, `la pirca real no es una caja pareja: la placa lo sabe (${sitio.delante.toFixed(3)} / ${sitio.detras.toFixed(3)} y no ${sinGeo.delante.toFixed(3)})`);
    ok(cerca(-bm.min.z, sitio.delante + ME.PLACA.grueso / 2 + 0.024, 2e-3) && cerca(bm.max.z, sitio.detras + ME.PLACA.grueso / 2 + 0.024, 2e-3), 'la placa de la pirca va pegada a su cara, por delante y por detrás');
  }
  // mirar de nuevo no arma nada
  base.actualizar(1);
  ok(placa(emp) === pl && hijos(emp) === 2, 'mirar de nuevo no arma nada otra vez');
  // noches 3 y 4: nivel 2 (la placa cambia); 5, 6 y 7: nivel 3
  noche(base, p, 3, [emp]); noche(base, p, 4, [emp]);
  ok(base.nivelDe(emp) === 2 && cerca(base.factorDano(emp), 0.8), 'a las cuatro noches: nivel 2');
  base.actualizar(1);
  ok(placa(emp) !== pl && hijos(emp) === 2, 'del 1 al 2, otra placa (no se acumulan)');
  const geos = base.mejoras.geometrias;
  noche(base, p, 5, [emp]); noche(base, p, 6, [emp]); noche(base, p, 7, [emp]);
  ok(base.nivelDe(emp) === 3 && cerca(base.factorDano(emp), 0.7), 'a las siete noches: nivel 3');
  noche(base, p, 8, [emp]); noche(base, p, 9, [emp]);
  ok(base.nivelDe(emp) === 3 && emp.datos.curt.n === ME.CURTIDO.tope, 'no pasa del nivel 3');
  ok(p.notas.filter(([t]) => /Empalizada de troncos curtida/.test(t)).length === 3, 'avisó tres veces (los tres niveles)');
  base.actualizar(1);
  eq([...tiposDe(placa(emp).geometry)].sort(), [0, 4], 'la placa de nivel 3: madera y metal');
  ok(vertices(placa(emp).geometry) < 700, `placa de nivel 3: poca geometría (${vertices(placa(emp).geometry)} vértices)`);
  // las geometrías se comparten entre obras iguales
  for (let i = 0; i < 6; i++) { const x = w.terminar('empalizada', 50 + i * 4, 30, 0).o; x.datos.curt = { n: 4, e: -1, t: 0 }; }
  base.actualizar(1);
  ok(base.mejoras.geometrias <= geos + 1, `las geometrías se comparten entre obras (${base.mejoras.geometrias})`);
  // los bonos de la defensa: el nivel suma «reparar» con tope
  const suma = base.mejoras.niveles().reduce((s, n) => s + n, 0);
  ok(cerca(BO.bonoDe(p.d, 'reparar'), Math.min(0.1, suma * 0.01)) && BO.bonoDe(p.d, 'reparar') > 0, `el bono de reparar sale de los niveles (${suma} niveles → ${BO.bonoDe(p.d, 'reparar')})`);
  ok(p.d.bonos.origen.defensa && Object.keys(p.d.bonos.origen.defensa).join() === 'reparar', 'con el origen «defensa»');

  // una noche en que no pasó nada no cuenta, aunque haya aguantado
  const antes = mur.datos.curt.n;
  noche(base, p, 10, []);
  ok(mur.datos.curt.n === antes && emp.datos.curt.n === 7, 'sin daño ni participación, la noche no suma');
  // la que se construyó de madrugada no estaba al anochecer
  p.d.oleadas = 11; base.alAnochecer(11);
  const tarde = w.terminar('empalizada', 90, 10, 0).o;
  base.participo(tarde); base.participo(mur);
  base.alAmanecer(11);
  ok(tarde.datos.curt === undefined, 'la defensa que no estaba al anochecer no suma');
  ok(mur.datos.curt.n === antes + 1, 'la que sí estaba y recibió daño, sí');
  // golpe fuera de noche (de día) no cuenta: no hay marca
  const nm = mur.datos.curt.n;
  base.participo(mur);
  p.d.oleadas = 12;
  base.alAmanecer(12);
  ok(mur.datos.curt.n === nm, 'un golpe de día no cuenta para la noche que viene');
  // no se curten las trampas ni lo oculto
  noche(base, p, 13, [lazo, pasa]);
  ok(lazo.datos.curt === undefined && pasa.datos.curt === undefined && hijos(lazo) === 1, 'las trampas y el pasadizo no se curten');
  // la defensa que cae se pierde (y el aviso no la nombra)
  noche(base, p, 14, [emp]);
  w.s.destruir(emp);
  ok(!w.s.obras.includes(emp), 'la defensa cayó');
  base.alCaer([emp]);
  const nueva = w.terminar('empalizada', 10, 10, 0).o;
  ok(nueva.datos.curt === undefined && base.nivelDe(nueva) === 0, 'la que se levanta en su lugar empieza de cero');
  // y la que se desarma también
  const des = w.terminar('muro-piedra', 70, 10, 0).o;
  noche(base, p, 15, [des]); noche(base, p, 16, [des]);
  ok(base.nivelDe(des) === 1, 'otro muro llega al nivel 1');
  const r = w.s.desmontarCerca({ x: 70, z: 10 }, 3);
  ok(r.ok && !w.s.obras.includes(des), 'desarmada');
  const otra = w.terminar('muro-piedra', 70, 10, 0).o;
  ok(base.nivelDe(otra) === 0, 'el nuevo muro del mismo lugar empieza de cero');
  // la que estás moviendo (Shift+Y) no suma ni lleva placa: queda como estaba
  base.limpiar();
  ok(hijos(mur) === 1 && !mur.userCurtido, 'al limpiar se sacan las placas');
  // el saneo se aplica a lo cargado: una obra con experiencia rota no tira la actualización
  const loca = w.terminar('empalizada', 100, 10, 0).o;
  loca.datos.curt = { n: 2, e: 5, t: 1 };
  base.actualizar(1);
  ok(hijos(loca) === 2, 'una defensa cargada con experiencia viene con su placa al primer segundo');
}

// ================================================================== 7. LOS TROFEOS, EN EL MUNDO
{
  const w = mundo();
  const p = partida();
  const base = M.desafio_base_juego.crearBaseCrece(w.s, efectosFalsos(), { pulsar() {}, bus: {} }, p.api);
  const bonosDe = () => Object.fromEntries(BO.BONOS_CLAVES.map((k) => [k, BO.bonoDe(p.d, k)]).filter(([, v]) => v));
  // sin tablero: el trofeo se gana y queda guardado, sin bono
  p.d.jefeCaido = 5;
  base.actualizar(1);
  eq(p.d.crece.trofeos, { casco: 0 }, 'cae el mandamás de la noche 5: el casco');
  p.d.oleadas = 5;
  eq(bonosDe(), {}, 'sin tablero, sin bono');
  p.soltar();
  ok(p.notas.some(([t, s]) => /Casco de corteza/.test(t) && /armá un tablero/.test(s)), `avisa que hace falta un tablero (${JSON.stringify(p.notas.slice(-1))})`);
  ok(!base.cerca({ x: 10, z: 10 }) && base.avisoCerca({ x: 10, z: 10 }) === null, 'sin tablero, la E no ve nada');
  // se arma el tablero: se cuelga y da el bono
  const tab = w.terminar('tablero-trofeos', 10, 10, 0).o;
  const v0 = vertices(tab.malla.geometry);
  base.actualizar(1);
  eq(tab.datos.colgados, ['casco'], 'el tablero cuelga el casco');
  ok(vertices(tab.malla.geometry) > v0, 'la malla del tablero se rehízo con el trofeo');
  eq(bonosDe(), { saludMax: 5 }, 'el casco da +5 de salud máxima');
  ok(p.d.bonos.origen.trofeo && Object.keys(p.d.bonos.origen).includes('trofeo'), 'con el origen «trofeo»');
  ok((p.api.guardadas || 0) >= 1, 'las obras se guardan al colgar');
  const mallaVieja = tab.malla;
  base.actualizar(1); base.actualizar(1);
  ok(tab.malla === mallaVieja, 'mirar de nuevo no rehace la malla');
  eq(bonosDe(), { saludMax: 5 }, 'ni duplica el bono');
  // la E
  ok(base.cerca({ x: 10, z: 11 }) && !base.cerca({ x: 10, z: 40 }), 'la E ve el tablero de cerca y no de lejos');
  ok(/1 de 7/.test(base.avisoCerca({ x: 10, z: 11 })), 'el aviso cuenta los trofeos');
  p.notas.length = 0;
  ok(base.usarCerca({ x: 10, z: 11 }) === true && /Tablero de trofeos · 1 de 7/.test(p.notas[0][0]) && /Casco de corteza \(\+5 de salud máxima\)/.test(p.notas[0][1]), 'la E muestra cuáles son y qué da cada uno');
  ok(base.usarCerca({ x: 10, z: 40 }) === false, 'lejos no hace nada');
  // el resto de los hitos
  p.d.jefeCaido = 10; base.actualizar(1);
  p.d.jefeCaido = 15; base.actualizar(1);
  p.d.jefeCaido = 20; base.actualizar(1);
  eq(Object.keys(p.d.crece.trofeos).sort(), ['casco', 'hongo', 'ojo', 'piedra'].sort(), 'los cuatro mandamases');
  eq(bonosDe(), { saludMax: 5, recarga: 0.06, alcance: 0.06, dano: 0.05 }, 'cada uno suma lo suyo');
  const ya = Object.keys(p.d.crece.trofeos).length;
  p.d.jefeCaido = 25; base.actualizar(1);
  ok(Object.keys(p.d.crece.trofeos).length === ya, 'el mandamás de la noche 25 es el clásico: no da otro casco');
  p.d.asedio = AS.asedioNuevo([{ id: 'base', x: 0, z: 0 }, { id: 'estacion', x: 5, z: 5 }, { id: 'lago', x: 9, z: 9 }, { id: 'bosque', x: 1, z: 9 }], { x: 0, z: 0 });
  base.actualizar(1);
  ok(!('pina' in p.d.crece.trofeos), 'con la puertita cerrada, no hay piña');
  for (const z of p.d.asedio.zonas.slice(0, 3)) z.estado = 'recuperada';
  base.actualizar(1);
  ok('pina' in p.d.crece.trofeos && cerca(BO.bonoDe(p.d, 'reparar'), 0.15), 'se abre la puertita del Coihue: la piña (+15 % al reparar)');
  p.d.asedio.reyCaido = true; base.actualizar(1);
  ok('corona' in p.d.crece.trofeos && cerca(BO.bonoDe(p.d, 'correr'), 0.04), 'cae el Rey Duende: la corona');
  p.d.nido = { caido: true }; base.actualizar(1);
  ok('raiz' in p.d.crece.trofeos && BO.bonoDe(p.d, 'saludMax') === 10, 'se derrumba la cueva: la raíz (otros 5 de salud)');
  eq(tab.datos.colgados, TR.IDS_TROFEOS, 'los siete colgados en el orden del tablero');
  ok(vertices(tab.malla.geometry) < 9000, `el tablero lleno: poca geometría (${vertices(tab.malla.geometry)} vértices)`);
  // los bonos son los del contrato y entran en el tope del juego
  for (const k of BO.BONOS_CLAVES) { const v = BO.bonoAplicado(p.d, k); ok(Number.isFinite(v), `${k}: ${v}`); }
  ok(BO.saludMaximaConBonos(100, p.d) === 110, 'la salud máxima con los trofeos');

  // desarmás el tablero: los trofeos quedan guardados, el bono se va
  const r = w.s.desmontarCerca({ x: 10, z: 10 }, 3);
  ok(r.ok, 'se desarma el tablero');
  base.actualizar(1);
  eq(bonosDe().saludMax, undefined, 'sin tablero, los bonos se van');
  ok(!('trofeo' in (p.d.bonos.origen || {})), 'y el origen también');
  ok(Object.keys(p.d.crece.trofeos).length === 7, 'pero los trofeos quedan guardados');
  // se arma otro: vuelve todo
  const tab2 = w.terminar('tablero-trofeos', 30, 10, 0).o;
  base.actualizar(1);
  eq(tab2.datos.colgados, TR.IDS_TROFEOS, 'el tablero nuevo cuelga los siete');
  ok(BO.bonoDe(p.d, 'saludMax') === 10 && cerca(BO.bonoDe(p.d, 'dano'), 0.05), 'y los bonos vuelven');
  // dos tableros no duplican el bono
  const tab3 = w.terminar('tablero-trofeos', 50, 10, 0).o;
  base.actualizar(1);
  ok(BO.bonoDe(p.d, 'saludMax') === 10 && tab3.datos.colgados.length === 7, 'con dos tableros, los bonos valen una vez');
  // los duendes tiran el tablero: los trofeos se pierden con él
  p.notas.length = 0;
  const caidas = w.s.destruir(tab2);
  base.alCaer(caidas);
  eq(p.d.crece.trofeos, {}, 'si los duendes lo tiran, los trofeos se pierden');
  eq(bonosDe().saludMax, undefined, 'y los bonos');
  ok(p.notas.some(([t]) => /Se cayó el tablero/.test(t)), 'avisa');
  base.actualizar(1); base.actualizar(1);
  ok(tab3.datos.colgados.length === 0 && Object.keys(p.d.crece.trofeos).length === 0, 'el otro tablero queda vacío, y lo perdido no vuelve solo al segundo siguiente');
  ok(p.d.crece.vistos.pina && p.d.crece.vistos.corona && p.d.crece.vistos.raiz && p.d.crece.vistos.jefe === 25, 'lo que ya se miró queda anotado');
  // tirar otra cosa no toca nada
  p.d.jefeCaido = 5; p.d.asedio = null; p.d.nido = null; base.actualizar(1);
  const cae = w.terminar('empalizada', 70, 10, 0).o;
  base.alCaer(w.s.destruir(cae));
  ok(Object.keys(p.d.crece.trofeos).join() === 'casco', 'tirar una empalizada no pierde trofeos');
  // el que se pierde se puede volver a ganar: es otra partida de los mismos jefes
  p.d.jefeCaido = -1;
  base.limpiar();
}

// ================================================================== 8. EL PERRO, EN EL MUNDO
{
  const w = mundo();
  const p = partida();
  const base = M.desafio_base_juego.crearBaseCrece(w.s, efectosFalsos(), { pulsar() {}, bus: {} }, p.api);
  ok(base.nivelPerro() === 0 && base.alcancePerro() === 1 && base.danoPerro() === 1, 'el perro empieza sin curtir');
  noche(base, p, 1); noche(base, p, 2);
  ok(base.nivelPerro() === 0 && !p.notas.length, 'dos noches no alcanzan');
  noche(base, p, 3);
  ok(base.nivelPerro() === 1 && cerca(base.alcancePerro(), 1.15) && cerca(base.danoPerro(), 1.15), 'la tercera noche: nivel 1');
  ok(p.notas.some(([t]) => /El perro está más atento/.test(t)), 'avisa');
  for (let n = 4; n <= 6; n++) noche(base, p, n);
  ok(base.nivelPerro() === 2 && p.notas.some(([t]) => /El perro está más curtido/.test(t)), 'a las seis: «El perro está más curtido»');
  for (let n = 7; n <= 10; n++) noche(base, p, n);
  ok(base.nivelPerro() === 3 && cerca(base.alcancePerro(), 1.5) && cerca(base.danoPerro(), 1.5), 'a las diez: nivel 3');
  for (let n = 11; n <= 14; n++) noche(base, p, n);
  ok(base.nivelPerro() === 3 && p.d.crece.perro.noches === 10, 'no pasa del nivel 3');
  ok(/nivel 3/.test(base.resumen().perro.texto) && base.resumen().perro.nivel === 3, 'la ficha de la base lo dice');
  // sin perro a tu lado, la noche no cuenta
  const p2 = partida({ perro: false });
  const b2 = M.desafio_base_juego.crearBaseCrece(w.s, efectosFalsos(), { pulsar() {}, bus: {} }, p2.api);
  for (let n = 1; n <= 5; n++) noche(b2, p2, n);
  ok(b2.nivelPerro() === 0 && p2.d.crece.perro.noches === 0, 'sin perro, no aprende');
  // una partida vieja (sin `crece`) no rompe
  const p3 = partida(); delete p3.d.crece;
  const b3 = M.desafio_base_juego.crearBaseCrece(w.s, efectosFalsos(), { pulsar() {}, bus: {} }, p3.api);
  noche(b3, p3, 1);
  ok(p3.d.crece.perro.noches === 1, 'sin `crece`, lo arma');
  const r = base.resumen();
  ok(r.trofeos === 0 && r.curtidas === 0 && r.hayTablero === false, 'el resumen de la base');
}

// ================================================================== 8b. EL PERRO DE VERDAD: la mordida y el gruñido con desafio-aliados.js
{
  const w = mundo();
  const filas = [];
  for (const noches of [0, 3, 6, 10]) {
    const p = partida();
    p.d.crece.perro.noches = noches;
    const base = M.desafio_base_juego.crearBaseCrece(w.s, efectosFalsos(), { pulsar() {}, bus: {} }, p.api);
    const duende = (z, vida = 1e6) => ({ estado: 'avanzar', tipo: 'bruto', vida, def: { radio: 0.9, altura: 2.5 }, m: { g: { position: new THREE.Vector3(0, 0, z) }, esc: 1 } });
    const bruto = duende(3), lejano = duende(46);
    lejano.tipo = 'rastreador';
    // el perro del juego: el alcance sale de la niebla (1 acá) por el nivel, y la mordida se multiplica por el nivel (como en desafio.js)
    const api = { aliens: [bruto], D: () => p.d, mira: () => ({ x: 0, z: -1 }), alcancePerro: () => 1 * base.alcancePerro(), danoPerro: () => base.danoPerro(),
      S: { grunirPerro() {} }, oir() {}, sonido: { ladrido() {} }, efectos: null, herirAlien(a, n) { a.vida -= n; } };
    const A = M.desafio_aliados.crearAliados(api);
    const js = { pos: new THREE.Vector3(0, 0, 0), yaw: 0 };
    const perroPos = { x: 0.6, y: 0, z: 3 };
    A.objetivoPerro(js, perroPos, 1);
    const v0 = bruto.vida; A.actualizarPerro(1.0, js, perroPos);
    const mordida = v0 - bruto.vida;
    api.aliens.length = 0; api.aliens.push(lejano);
    A.actualizarPerro(0.5, js, { x: 1, y: 0, z: 0 });
    filas.push({ nivel: base.nivelPerro(), mordida: Math.round(mordida * 1000) / 1000, aviso: A.avisoPerro });
  }
  eq(filas.map((f) => f.nivel), [0, 1, 2, 3], 'los cuatro niveles');
  eq(filas.map((f) => f.mordida), [9, 10.35, 11.7, 13.5], 'la mordida de verdad: 9, 10,35, 11,7 y 13,5 por segundo');
  eq(filas.map((f) => f.aviso), [null, 'grunir', 'grunir', 'grunir'], 'a 46 m el perro sin curtir no avisa y el curtido gruñe');
  // más lejos todavía: el nivel 3 oye lo que el 2 no
  const lejos = (noches, d) => {
    const p = partida(); p.d.crece.perro.noches = noches;
    const base = M.desafio_base_juego.crearBaseCrece(w.s, efectosFalsos(), { pulsar() {}, bus: {} }, p.api);
    const a = { estado: 'avanzar', tipo: 'rastreador', vida: 10, def: { radio: 0.4, altura: 1 }, m: { g: { position: new THREE.Vector3(0, 0, d) }, esc: 1 } };
    const api = { aliens: [a], D: () => p.d, mira: () => ({ x: 0, z: -1 }), alcancePerro: () => base.alcancePerro(), danoPerro: () => base.danoPerro(), S: { grunirPerro() {} }, oir() {}, sonido: { ladrido() {} }, herirAlien() {} };
    const A = M.desafio_aliados.crearAliados(api);
    A.actualizarPerro(0.5, { pos: new THREE.Vector3(0, 0, 0), yaw: 0 }, { x: 1, y: 0, z: 0 });
    return A.avisoPerro;
  };
  ok(lejos(6, 58) === null && lejos(10, 58) === 'grunir', 'a 58 m sólo el del nivel 3 lo oye');
}

// ================================================================== 9. LA PANTALLA DE LA BASE
{
  const resumen = resumirBase([{ id: 'empalizada', nombre: 'Empalizada de troncos curtida · nivel 2', vida: 100, max: 100, dist: 4 }]);
  const html = htmlBase(resumen, { crece: { defensas: [3, 1, 1, 0], curtidas: 2, perro: { nivel: 2, texto: 'El perro está más curtido · nivel 2: …' }, trofeos: 3, hayTablero: true } });
  ok(/La base crece/.test(html) && /Defensas curtidas: 2 \(nivel 1: 1 · nivel 2: 1 · nivel 3: 0\)/.test(html) && /El perro está más curtido/.test(html) && /Trofeos: 3 de 7/.test(html), 'la pantalla de la base cuenta lo que creció');
  ok(/Empalizada de troncos curtida · nivel 2/.test(html), 'y muestra el nivel en el nombre');
  ok(/guardados: armá un tablero/.test(htmlCrece({ defensas: [0, 0, 0, 0], curtidas: 0, perro: null, trofeos: 2, hayTablero: false })), 'sin tablero, avisa que están guardados');
  ok(htmlCrece(undefined) === '' && !/La base crece/.test(htmlBase(resumen, {})), 'sin datos (el Relax), nada');
  ok(/La base crece/.test(htmlBase(resumirBase([]), { crece: { defensas: [0, 0, 0, 0], curtidas: 0, perro: null, trofeos: 0, hayTablero: false } })), 'aun sin defensas');
  ok(!/<script/i.test(htmlCrece({ defensas: [0, 0, 0, 0], curtidas: 0, perro: { texto: '<script>x</script>' }, trofeos: 0 })), 'el texto se escapa');
}

// ================================================================== 10. LOS ENGANCHES CON EL JUEGO
{
  const des = leer('src/desafio.js'), main = leer('src/main.js'), ali = leer('src/desafio-aliados.js'), reg = leer('src/desafio-reglas.js'), gua = leer('src/guardado.js');
  const { enUnaLinea } = await import('./ayuda-codigo.mjs');
  const linea = (partes, t) => ok(enUnaLinea(des, partes), t);
  linea(["import { crearBaseCrece } from './desafio-base-juego.js';"], 'desafio.js importa la base');
  linea(['const baseCrece = crearBaseCrece(obras, efectos, sonido, api);'], 'y la arma una vez');
  linea(['n *= baseCrece.factorDano(o);', 'baseCrece.participo(o);'], 'danarObra: la defensa curtida recibe menos daño y la noche cuenta');
  ok(des.indexOf('baseCrece.factorDano(o)') < des.indexOf('o.datos.vida -= n;', des.indexOf('baseCrece.factorDano(o)')), 'el factor se aplica antes de descontar la vida');
  linea(['baseCrece.alCaer(caidas);'], 'las obras caídas llegan a la base (el tablero se lleva los trofeos)');
  ok(des.indexOf('baseCrece.alCaer(caidas)') > des.indexOf('const caidas = obras.destruir(o);'), 'después de destruir');
  ok((des.match(/baseCrece\.participo\(/g) || []).length === 2, 'participa el golpeado y la ballesta que tira');
  const iTorreta = des.indexOf('recargaTorreta.set(o, f.cadencia);');
  ok(iTorreta > 0 && des.indexOf('baseCrece.participo(o);', iTorreta) - iTorreta < 120, 'la ballesta participa cuando dispara');
  linea(['if (nuevaNoche) baseCrece.alAnochecer(d.oleadas);'], 'al caer la noche (nueva) se anotan las defensas en pie');
  ok(des.indexOf('baseCrece.alAnochecer(d.oleadas)') > des.indexOf('if (nuevaNoche) d.oleadas++;'), 'después de contar la noche');
  linea(['baseCrece.alAmanecer(d.oleadas);'], 'al amanecer suman las defensas y el perro');
  const iAlba = des.indexOf('baseCrece.alAmanecer(d.oleadas)');
  ok(iAlba > des.indexOf('if (sobrevivida) {', des.indexOf('function terminarOleada')) && des.lastIndexOf('d.noches++;', iAlba) > iAlba - 300, 'sólo si se sobrevivió la noche');
  linea(['baseCrece.actualizar(dt);'], 'cada cuadro (adentro, una vez por segundo)');
  linea(['baseCrece.limpiar();'], 'se limpia al salir');
  linea(['api.alcancePerro', 'baseCrece.alcancePerro()', 'NIEBLA.perro'], 'el alcance del perro: la niebla y el nivel');
  linea(['api.danoPerro', 'baseCrece.danoPerro()'], 'el daño del perro');
  linea(['api.perroPresente', 'ctx.perroPos'], 'el perro cuenta si está con vos');
  linea(['get baseCrece()', 'return baseCrece'], 'main.js la ve (E y pantalla de la base)');
  ok(enUnaLinea(ali, ['api.herirAlien(a, 9 * (api.danoPerro?.() ?? 1) * dt', "'perro'"]), 'la mordida del perro multiplica por su nivel');
  ok(enUnaLinea(ali, ['avisoDelPerro({ distancia: d0, visto, alcance: api.alcancePerro?.() ?? 1 })']), 'el gruñido del perro sigue usando el alcance');
  ok(enUnaLinea(reg, ['crece: creceNuevo()']) && enUnaLinea(reg, ['crece: sanearCrece(x.crece)']), 'desafioNuevo y sanearDesafio llevan `crece`');
  ok(enUnaLinea(gua, ['sanearCurtido(d.curt)']) && enUnaLinea(gua, ['d.colgados.filter((id) => IDS_TROFEOS.includes(id))']), 'el guardado sanea la experiencia y los trofeos colgados');
  ok(enUnaLinea(main, ['desafio.baseCrece?.nombreDe(o)']) && enUnaLinea(main, ['crece: desafio?.baseCrece?.resumen()']), 'la pantalla de la base muestra el nivel y lo que creció');
  linea(['ctx.nota(`Reparando ${(baseCrece.nivelDe(obra) ?'], 'el martillo avisa con el nivel si la defensa está curtida');
  linea(['baseCrece.nivelDe(e.obra)', '· reparada`', '${e.obra.plano.nombre} reparada`'], 'el taller también (y sin nivel, el texto de siempre)');
  // los invasores se reciclan: la base no deja nada en ellos
  const bajar = des.slice(des.indexOf('function bajarAlien'), des.indexOf('function soltarRobo'));
  ok(!/baseCrece/.test(bajar) && !/curt|trofe/i.test(bajar), 'la base no agrega campos a los invasores (nada que limpiar en bajarAlien)');
  // un solo módulo de bonos
  ok(!fs.existsSync(path.join(raiz, 'src/desafio-bonos-base.js')), 'se fue el respaldo de los bonos');
  ok(enUnaLinea(leer('src/desafio-base-juego.js'), ["from './desafio-bonos.js'"]), 'la base usa los bonos del guardián');
  // la E y el aviso: una sola entrada de la tabla
  const { INTERACCIONES } = await import('../src/interacciones.js');
  const ids = INTERACCIONES.map((e) => e.id);
  ok(ids.filter((i) => i === 'trofeos').length === 1 && ids.indexOf('trofeos') > ids.indexOf('aldea-tablon') && ids.indexOf('trofeos') < ids.indexOf('objetivo') && ids.indexOf('trofeos') < ids.indexOf('desafio-cerca'), 'la E y el aviso: una entrada «trofeos» en la tabla, antes de lo que mirás');
  const { que, enganche } = await import('./ayuda-interacciones.mjs');
  const r = que({ desafio: true, trofeosCerca: true, avisoTrofeos: 'Ver los trofeos del tablero (2 de 7)', usarTrofeos: true });
  ok(r.e === 'trofeos' && r.avisoId === 'trofeos' && r.texto === 'Ver los trofeos del tablero (2 de 7)' && r.hechos.includes('usarTrofeos'), 'junto al tablero del Desafío, la E lo usa y el aviso habla de él');
  ok(que({ desafio: false, trofeosCerca: true }).e !== 'trofeos', 'en el Relax no existe');
  ok(que({ desafio: true, trofeosCerca: true, js: { enTren: true } }).e !== 'trofeos' && que({ desafio: true, trofeosCerca: true, js: { montado: true } }).e !== 'trofeos', 'ni arriba del tren ni a caballo');
  ok(que({ desafio: true, trofeosCerca: true, objetivo: { tipo: 'planta', texto: 'Anotar' } }).e === 'trofeos', 'pegado al tablero, lo que mirás de fondo no le saca la E');
  ok(que({ desafio: true, trofeosCerca: false }).e !== 'trofeos', 'lejos del tablero, no');
  for (const n of ['trofeosCerca', 'avisoTrofeos', 'usarTrofeos']) ok(enganche(main, n).length > 10, `ctxInteraccion le da a la tabla «${n}»`);
  // los archivos nuevos: reglas puras sin three ni DOM
  for (const f of ['desafio-mejoras-base.js', 'desafio-trofeos.js', 'desafio-perro-aprende.js', 'desafio-crece.js']) {
    const t = leer(`src/${f}`);
    ok(!/from 'three'|document\.|window\./.test(t), `${f}: reglas puras (sin three ni DOM)`);
    ok(!/[ñÑ]/.test((t.match(/export (?:const|function|class) [^\s(=]+/g) || []).join(' ')), `${f}: identificadores exportados sin ñ`);
  }
  for (const f of ['desafio-mejoras-base', 'desafio-mejoras-base-mundo', 'desafio-trofeos', 'desafio-trofeos-mundo', 'desafio-trofeos-formas', 'desafio-perro-aprende', 'desafio-crece', 'desafio-base-juego', 'planos-trofeos']) {
    const t = leer(`src/${f}.js`);
    ok(!t.includes('\r') && /4\.10/.test(t), `${f}: LF y comentarios con la versión`);
    ok(!/^import\s*['"]|^export\s+(async\s+)?function\*|^export .* from /m.test(t), `${f}: imports que armar.mjs entiende`);
  }
  // ninguna palabra en inglés en lo que se ve
  const visibles = [...TR.TROFEOS.flatMap((t) => [t.nombre, t.de, t.texto]), ...Object.values(C.PLANO['tablero-trofeos']).filter((v) => typeof v === 'string')].join(' ');
  ok(!/\b(trophy|board|level|dog|the|and)\b/i.test(visibles), 'sin inglés en los textos');
  // nada religioso ni figuras sagradas
  ok(!/(santo|santa|virgen|dios|cruz|angel|ángel|demonio|diablo|gauchito|difunta|pachamama)/i.test(visibles), 'nada religioso ni figuras sagradas del folclore real');
}

console.log(`verificar-4-10-base: ${pasos} comprobaciones, todo en verde`);
