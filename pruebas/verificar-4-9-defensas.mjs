// 4.9 defensas («La aldea en la noche», tanda de la base): lo roto que se ve, el pasadizo de escape, la trampa de miel, el farol de mano
// y la pala de brasas. Las reglas puras en Node, las piezas y el mundo con el three de verdad en una vm (el arnés de ayuda-4-0-1-mundo),
// y los enganches con el juego (desafio.js, main.js, mochila.js, guardado).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { cargar } from './ayuda-4-0-1-mundo.mjs';
import * as TR from '../src/desafio-trampas.js';
import * as PA from '../src/desafio-pasadizo.js';
import * as RO from '../src/desafio-roto.js';
import { RECETAS, desafioNuevo, sanearDesafio, suministrosDelAlba, sanearContenidoCaja, sumarContenidoCaja } from '../src/desafio-reglas.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8').replace(/\r\n/g, '\n');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };
const cerca = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

// ------------------------------------------------------------------ el mundo de mentira (con el three de verdad)
const M = cargar(['construccion.js', 'colisiones.js', 'desafio-defensas49-juego.js', 'desafio-trampas-mundo.js', 'desafio-pasadizo-mundo.js', 'desafio-roto-mundo.js']);
const { THREE } = M, C = M.construccion;
function mundo(extraT = {}) {
  const col = M.colisiones.crearColisiones();
  const T = { altura: () => 0, agua: () => false, normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {}, ...extraT };
  const despejados = [];
  const veg = { arboles: [], despejar: (x, z, r) => despejados.push({ x, z, r }) };
  const s = C.crearConstruccion(T, new THREE.Scene(), col, veg, { agregar() {}, agregarPostigos() {}, eliminarPorDuenio() {} });
  const mats = { tronco: 999, tabla: 999, piedra: 999, lana: 999, cuero: 999, hierro: 999 };
  const terminar = (id, x, z, yaw = 0, y = null) => {
    s.elegir(C.PLANO[id]);
    const f = s.fundar(x, z, yaw, y);
    if (!f.ok) return f;
    while (f.obra.datos.etapas < f.obra.plano.etapas.length) { const r = s.avanzar(f.obra, mats); if (!r.ok) return r; }
    return { ok: true, o: f.obra };
  };
  return { s, col, T, terminar, mats, despejados };
}
// api de mentira para los módulos del mundo
function apiMentira(extra = {}) {
  const notas = [], gastos = {}, tengo = { miel: 3, tabla: 9, ...(extra.tengo || {}) };
  const aliens = extra.aliens || [];
  return {
    aliens, notas, gastos, tengo,
    nota: (t, s) => notas.push([t, s]),
    cuanto: (k) => tengo[k] || 0,
    gastar: (k, n) => { gastos[k] = (gastos[k] || 0) + n; tengo[k] = (tengo[k] || 0) - n; },
    alGuardarObras() { this.guardadas = (this.guardadas || 0) + 1; }, alFabricar() {},
    herirAlien(a, dano) { a.vida -= dano; }, invulnerable(s) { this.protegido = s; },
    jugador: () => extra.jugador, ...extra.api,
  };
}
const efectosFalsos = () => { const l = []; return { l, fuego: (p, k) => l.push(['fuego', p, k]), chispas: (p, n) => l.push(['chispas', p, n]), polvo() {}, astillas() {}, explosion() {}, destello() {} }; };
const sonidoFalso = () => ({ golpeRuido() {}, juntar() {}, encender() {}, fuente: () => null });
const alien = (x, z, o = {}) => ({ estado: 'avanzar', tipo: 'rastreador', vida: 100, vidaMax: 100, def: { radio: 0.4, altura: 1, ...(o.def || {}) }, m: { g: { position: new THREE.Vector3(x, 0, z), rotation: { x: 0, y: 0, z: 0 } }, esc: 1, viejo: () => !!o.viejo }, fase: 0, ...o });

// ================================================================== 1. LA TRAMPA DE MIEL (reglas)
{
  eq(TR.MIEL.pegado, [3, 4], 'queda pegado entre 3 y 4 segundos');
  ok(cerca(TR.duracionPegado({}, 0), 3) && cerca(TR.duracionPegado({}, 1), 4) && cerca(TR.duracionPegado({}, 0.5), 3.5), 'según el azar');
  ok(cerca(TR.duracionPegado({ pesado: true }, 1), 2), 'los brutos se despegan en la mitad');
  ok(!TR.sePega({ jefe: true }) && !TR.sePega({ vuela: true }) && TR.sePega({ radio: 0.4 }), 'el jefe y los que vuelan no se pegan');
  ok(!TR.sePega({}, { estado: 'morir' }) && !TR.sePega({}, { estado: 'bajoTierra' }) && !TR.sePega({}, { enNave: true }), 'ni el que está muriendo, bajo tierra o en el Coihue');
  // se gasta y se seca
  const d = { usos: TR.MIEL.usos };
  for (let i = 0; i < TR.MIEL.usos; i++) ok(TR.pegarse(d, {}, 0.5) > 0, `pega al duende ${i + 1}`);
  ok(TR.pegarse(d, {}, 0.5) === 0 && TR.estaSeca(d), 'después de los usos, seca: no pega');
  ok(TR.pegarse({ usos: 3 }, { jefe: true }, 0.5) === 0, 'al jefe no le gasta un uso');
  // reponer con miel
  eq(TR.reponerMiel(d, 0), { accion: 'sinMiel' }, 'seca y sin miel: no se puede');
  const r = TR.reponerMiel(d, 2);
  ok(r.accion === 'reponer' && r.gasta === 1 && d.usos === TR.MIEL.usos, 'un frasco la deja llena');
  eq(TR.reponerMiel(d, 2), { accion: 'llena' }, 'llena: no gasta');
  // prenderla
  ok(TR.prender(d) && TR.estaPrendida(d) && !TR.prender(d), 'se prende una vez');
  eq(TR.reponerMiel(d, 2), { accion: 'ardiendo' }, 'ardiendo no se repone');
  ok(TR.arder(d, 3) === 'arde' && TR.estaPrendida(d), 'arde un rato');
  ok(TR.arder(d, 10) === 'termino' && TR.estaSeca(d) && !TR.estaPrendida(d), 'al apagarse, la miel se consumió');
  ok(!TR.prender({ usos: 0 }), 'seca no prende');
  // el aviso
  ok(/Echar miel/.test(TR.avisoMiel({ usos: 0 }, 2)) && /secó/.test(TR.avisoMiel({ usos: 0 }, 0)) && TR.avisoMiel({ usos: TR.MIEL.usos }, 3) === null, 'aviso: echar, falta miel o nada');
  ok(/Reponer/.test(TR.avisoMiel({ usos: 2 }, 1)) && TR.avisoMiel({ usos: 2 }, 0) === null, 'a medio gastar, sólo si tenés miel');
  // saneo de lo que viene de una partida
  const s = TR.sanearDatosMiel({ usos: 'mucho', prendida: -4 });
  ok(s.usos === 0 && s.prendida === 0, 'datos rotos: seca y apagada');
  const t = TR.sanearDatosMiel({ usos: 99, prendida: 99 });
  ok(t.usos === TR.MIEL.usos && t.prendida === TR.MIEL.quema.dura, 'y topes');
  ok(TR.sanearDatosMiel({ usos: 2.7 }).usos === 2, 'enteros');
  // de dónde sale la miel
  ok(TR.mielDelAlba(1) === 1 && TR.mielDelAlba(2) === 0 && TR.mielDelAlba(3) === 1 && TR.mielDelAlba(7) === 2 && TR.mielDelAlba(8) === 0, 'la caja del alba: un frasco las impares, dos desde la séptima');
  ok(suministrosDelAlba(1, false).miel === 1 && suministrosDelAlba(2, false).miel === undefined && suministrosDelAlba(9, true).miel === 2, 'y entra en los suministros');
  ok(sanearContenidoCaja({ miel: '3', tronco: 1 }).miel === 3 && sanearContenidoCaja({ miel: 500 }).miel === 99 && !('miel' in sanearContenidoCaja({ miel: -1 })), 'el cofre guardado trae miel saneada');
  ok(sumarContenidoCaja({ miel: 2 }, { miel: 1 }).miel === 3, 'y un cofre sin abrir la suma al nuevo');
}

// ================================================================== 2. EL CONTADOR DE MIEL EN LA PARTIDA
{
  ok(desafioNuevo().miel === 0 && desafioNuevo().brasas === 0, 'se empieza sin miel ni brasas');
  const s = sanearDesafio({ miel: '7', brasas: 4.9 });
  ok(s.miel === 7 && s.brasas === 4, 'se guarda entero');
  ok(sanearDesafio({ miel: 1e9 }).miel === 99 && sanearDesafio({ miel: -5 }).miel === 0 && sanearDesafio({ miel: 'x' }).miel === 0 && sanearDesafio(null).miel === 0, 'tope y piso, y una partida vieja sin el campo carga en cero');
  const receta = RECETAS.find((r) => r.id === 'miel-trampa');
  ok(receta && receta.cat === 'base' && receta.mielTrampa && receta.pide.miel === 1 && receta.texto, 'receta en el taller (Base) que gasta miel');
  const cm = leer('src/main.js');
  ok(/if \(k === 'miel' && desafio\) return progreso\.desafio\?\.miel \|\| 0;/.test(cm) && /function gastarRecurso\(k, n\) \{\n  if \(k === 'miel' && desafio\)/.test(cm) && /function sumarMaterial\(k, n\) \{\n  if \(k === 'miel' && desafio\)/.test(cm), 'main.js: cuanto, gastar y sumar entienden la miel del Desafío');
}

// ================================================================== 3. LAS PIEZAS: trampa de miel y pasadizo
{
  const tm = C.PLANO['trampa-miel'], pa = C.PLANO.pasadizo;
  ok(tm && pa, 'los dos planos existen');
  for (const p of [tm, pa]) ok(p.pieza && p.soloDesafio && p.categoria === 'defensa' && p.defensa?.sinCuerpo, `${p.id}: pieza de defensa del Desafío, sin cuerpo para los duendes`);
  ok(pa.defensa.oculta && pa.defensa.tipo === 'pasadizo', 'el pasadizo no cuenta como defensa');
  ok(tm.pide.tabla === 2 && !('miel' in tm.pide), 'la trampa se arma con tablas (la miel se echa con E)');
  // geometría sólo de tipo 0 y 4, y fusionada en una malla
  for (const id of ['trampa-miel', 'pasadizo']) {
    const w = mundo();
    const r = w.terminar(id, 10, 10, 0);
    ok(r.ok, `${id}: se arma (${r.motivo || ''})`);
    const g = r.o.malla.geometry, tipos = new Set(g.getAttribute('aTipo').array);
    ok([...tipos].every((t) => t === 0 || t === 4), `${id}: material tipo 0 o 4 (${[...tipos]})`);
    ok(g.getAttribute('position').count < 4000, `${id}: poca geometría (${g.getAttribute('position').count} vértices)`);
    ok(r.o.grupo.children.filter((x) => x.isMesh).length === 1, `${id}: una sola malla`);
  }
  // la trampa de miel no frena a nadie; el pasadizo tiene las dos bocas con colisión
  {
    const w = mundo();
    const r = w.terminar('trampa-miel', 10, 10, 0);
    const q = { x: 10.2, y: 0, z: 10.1 };
    w.col.resolver(q, 0.4, 1.7);
    ok(cerca(q.x, 10.2, 1e-9) && cerca(q.z, 10.1, 1e-9), 'la trampa de miel se pisa (sin colisión)');
    ok(r.o.plano.defensa.sinCuerpo, 'y las flechas y los duendes la ignoran como cuerpo');
  }
  {
    const w = mundo();
    const r = w.terminar('pasadizo', 10, 10, 0);
    ok(r.ok, 'el pasadizo se arma');
    const boca = PA.bocaDe(r.o.datos, 'afuera');
    ok(cerca(boca.x, 10) && cerca(boca.z, 10 + PA.PASADIZO.largo), 'la boca de afuera queda a 9 m, hacia adelante de la pieza');
    for (const [nombre, p] of [['adentro', { x: 10, z: 10 }], ['afuera', boca]]) {
      const q = { x: p.x + 0.05, y: 0, z: p.z + 0.05 };
      w.col.resolver(q, 0.35, 1.7);
      ok(Math.hypot(q.x - p.x, q.z - p.z) > 0.7, `la boca de ${nombre} no se atraviesa (queda a ${Math.hypot(q.x - p.x, q.z - p.z).toFixed(2)} m)`);
    }
    // el túnel por abajo no estorba: entre las dos bocas se camina
    const m = { x: 10, y: 0, z: 14.5 };
    w.col.resolver(m, 0.35, 1.7);
    ok(cerca(m.z, 14.5, 1e-9), 'entre las dos bocas hay paso libre (el túnel va por abajo)');
    ok(w.despejados.some((d) => Math.abs(d.z - (10 + PA.PASADIZO.largo)) < 0.01 && d.r >= 1.2), 'la boca de afuera despeja las matas como el centro de cualquier pieza');
  }
  // dónde puede ir: la boca de afuera no cae al agua, ni en una pendiente, ni 2,4 m arriba o abajo
  {
    const agua = mundo({ agua: (x, z) => z > 14 });
    const r = agua.terminar('pasadizo', 10, 10, 0);
    ok(!r.ok && /agua/.test(r.motivo), `no se arma si la boca de afuera cae al agua (${r.motivo})`);
    const alto = mundo({ altura: (x, z) => (z > 14 ? 3.4 : 0) });
    ok(!alto.terminar('pasadizo', 10, 10, 0).ok, 'ni con la boca de afuera 3,4 m más arriba');
    const emp = mundo({ normal: (x, z) => (z > 14 ? new THREE.Vector3(0.8, 0.6, 0).normalize() : new THREE.Vector3(0, 1, 0)) });
    ok(!emp.terminar('pasadizo', 10, 10, 0).ok, 'ni en una pendiente brava');
    // girado: la otra boca cambia de lugar con la pieza (R)
    const g = mundo();
    const r2 = g.terminar('pasadizo', 10, 10, Math.PI / 2);
    ok(r2.ok && cerca(PA.bocaDe(r2.o.datos, 'afuera').x, 10 + PA.PASADIZO.largo * Math.sin(r2.o.datos.rot), 1e-6), 'girada, la boca de afuera gira con ella');
    // no cae encima de una pared tuya
    const p = mundo();
    p.terminar('empalizada', 10, 19, 0);
    ok(!p.terminar('pasadizo', 10, 10, 0).ok, 'la boca de afuera no se arma encima de una pared');
  }
}

// ================================================================== 4. LA TRAMPA DE MIEL EN EL MUNDO
{
  const w = mundo();
  const ef = efectosFalsos(), api = apiMentira({ tengo: { miel: 2, tabla: 5 } });
  api.aliens.push();
  const tm = M.desafio_trampas_mundo.crearTrampasMundo(w.T, w.s.escena || new THREE.Scene(), w.s, ef, sonidoFalso(), api);
  // colocarTrampaMiel: la contrata «días» (preparar la noche)
  const r = tm.colocar(20, 20);
  ok(r.ok && r.obra.plano.id === 'trampa-miel' && r.obra.datos.usos === TR.MIEL.usos, `colocarTrampaMiel arma la trampa llena (${r.motivo || ''})`);
  ok(api.gastos.miel === 1 && api.gastos.tabla === 2, 'y gasta un frasco de miel y dos tablas');
  ok(api.guardadas >= 1 && w.s.obras.includes(r.obra), 'queda entre las obras que se guardan');
  const sinMiel = apiMentira({ tengo: { miel: 0, tabla: 5 } });
  const tm2 = M.desafio_trampas_mundo.crearTrampasMundo(w.T, new THREE.Scene(), w.s, ef, sonidoFalso(), sinMiel);
  const r2 = tm2.colocar(30, 30);
  ok(!r2.ok && /miel/.test(r2.motivo), `sin miel no la coloca (${r2.motivo})`);
  ok(tm2.colocar(30, 30, { gratis: true }).ok, '`gratis` la coloca sin gastar');
  ok(sinMiel.gastos.miel === undefined, 'y no gastó');
  ok(!tm2.colocar(Number.NaN, 4).ok && !tm2.colocar(30.5, 30.5, { gratis: true }).ok, 'ni en un lugar inválido ni encima de otra trampa');
  // el duende que la pisa queda pegado
  const a = alien(20.3, 20.2), b = alien(40, 40);
  api.aliens.push(a, b);
  tm.refrescar();
  let e = tm.estadoAlien(a, 0.016);
  ok(e.quieto && e.sinAtaque && a.pegadoT >= 3 && a.pegadoT <= 4, `pegado ${a.pegadoT.toFixed(2)} s, frenado y sin atacar`);
  ok(r.obra.datos.usos === TR.MIEL.usos - 1, 'gastó un uso');
  eq([tm.estadoAlien(b, 0.016).quieto], [false], 'el que no la pisa, sigue');
  let t = 0;
  while (a.pegadoT > 0 && t < 10) { e = tm.estadoAlien(a, 0.1); t += 0.1; }
  ok(t >= 2.9 && t <= 4.2, `se despega a los ${t.toFixed(1)} s`);
  e = tm.estadoAlien(a, 0.016);
  ok(!e.quieto && a.pegadoT === 0, 'después sigue, y la misma trampa no lo vuelve a pegar enseguida');
  ok(r.obra.datos.usos === TR.MIEL.usos - 1, 'no gastó otro uso');
  // se acaba: cinco duendes y se seca
  for (let i = 0; i < TR.MIEL.usos; i++) { const x = alien(20.1, 20.1); api.aliens.push(x); tm.estadoAlien(x, 0.016); }
  ok(TR.estaSeca(r.obra.datos), 'a los cinco usos se seca');
  const z = alien(20.1, 20.1); tm.estadoAlien(z, 0.016);
  ok(!z.pegadoT, 'seca, ya no pega');
  // reponerla con E
  const pos = { x: 21.5, y: 0, z: 20 };
  ok(/Echar miel/.test(tm.avisoCerca(pos)), `el aviso junto a la trampa seca: ${tm.avisoCerca(pos)}`);
  ok(tm.usarCerca(pos) && r.obra.datos.usos === TR.MIEL.usos, 'E la deja llena');
  ok(tm.avisoCerca(pos) === null && !tm.usarCerca(pos), 'llena, la E no hace nada');
  // un jefe y uno que vuela no se pegan; el bruto se despega antes
  const j = alien(20, 20, { def: { jefe: true } }), v = alien(20, 20, { def: { vuela: true } });
  ok(!tm.estadoAlien(j, 0.016).quieto && !tm.estadoAlien(v, 0.016).quieto, 'el jefe y los que vuelan la cruzan');
  const bruto = alien(19.9, 20, { def: { pesado: true } }); api.aliens.push(bruto); tm.estadoAlien(bruto, 0.016);
  ok(bruto.pegadoT >= 1.5 && bruto.pegadoT <= 2, 'el bruto queda pegado la mitad');
  // limpiar al reciclar
  tm.limpiarAlien(bruto);
  ok(bruto.pegadoT === 0 && bruto.pegadoEn === null && bruto.mielCd === 0, 'al reciclar un duende se borra lo pegado');
  // la trampa que se derriba suelta al pegado
  const c = alien(20.2, 20.2, { viejo: false }); r.obra.datos.usos = TR.MIEL.usos; c.mielCd = 0; c.mielDe = null; api.aliens.push(c);
  tm.estadoAlien(c, 0.016);
  ok(c.pegadoT > 0, 'otra vez pegado');
  w.s.destruir(r.obra);
  e = tm.estadoAlien(c, 0.016);
  ok(!e.quieto && c.pegadoT === 0, 'si la trampa cae, se suelta');
}

// ================================================================== 5. LO ROTO QUEDA A LA VISTA
{
  // los tres estados según la vida
  const E = RO.estadoRotura;
  eq([E(100, 100), E(71, 100), E(69, 100), E(36, 100), E(34, 100), E(0, 100), E(-5, 100)], [0, 0, 1, 1, 2, 2, 2], 'sana, dañada (menos del 70 %) y rota (menos del 35 %)');
  eq([E(NaN, 100), E(50, 0), E(undefined, 10), E('x', 10)], [0, 0, 0, 0], 'datos raros: sana');
  ok(RO.ROTO.danada > RO.ROTO.rota && RO.ROTO.rota > 0, 'los umbrales van de mayor a menor');
  // qué se rompe y qué no
  const P = C.PLANO;
  for (const id of ['empalizada', 'porton-empalizada', 'muro-piedra', 'torre-vigia', 'ballesta-fija', 'muro-tronera']) ok(RO.seRompe(P[id]), `${id} se ve rota`);
  for (const id of ['trampa-lazo', 'abrojos', 'foso-estacas', 'trampa-miel', 'pasadizo', 'zanja-fuego', 'losa-piedra', 'estacas', 'red-cristal', 'barril-resina']) ok(!RO.seRompe(P[id]), `${id} no (baja, se gasta, sin cuerpo u oculta)`);
  eq([RO.formaDe(P['porton-empalizada']), RO.formaDe(P['torre-vigia']), RO.formaDe(P.empalizada), RO.formaDe(P['muro-piedra'])], ['porton', 'torre', 'pared', 'pared'], 'cada una se rompe a su manera');
  ok(RO.esDePiedra(P['muro-piedra']) && !RO.esDePiedra(P.empalizada), 'la pirca se rompe en piedras; la empalizada, en tablas');
  // las piezas de cada estado: pocas, dentro de la obra, siempre las mismas y sólo de madera (tipo 0) o piedra (tipo 4)
  for (const p of C.PLANOS.filter((x) => RO.seRompe(x))) {
    const a = RO.piezasDe(p, 1, 123), b = RO.piezasDe(p, 2, 123);
    ok(a.length >= 3 && a.length <= 14, `${p.id}: estado 1, ${a.length} piezas`);
    ok(b.length > a.length && b.length <= RO.ROTO.tope, `${p.id}: estado 2, ${b.length} piezas (más que el 1)`);
    eq(JSON.stringify(RO.piezasDe(p, 2, 123)), JSON.stringify(b), `${p.id}: misma lista para la misma obra`);
    for (const q of [...a, ...b]) {
      ok(q.tipo === 0 || q.tipo === 4, `${p.id}: sólo tipo 0 o 4`);
      ok(Math.abs(q.p[0]) <= (p.ancho || 1) / 2 + 0.7 && q.p[1] >= -0.05 && q.p[1] <= (p.alto || 1) + 0.4 && Math.abs(q.p[2]) <= (p.fondo || 0.3) / 2 + 1.0, `${p.id}: la marca ${q.t} cae dentro de la obra (${q.p.map((n) => n.toFixed(2))})`);
    }
    if (RO.esDePiedra(p)) ok([...a, ...b].every((q) => q.tipo === 4), `${p.id}: todo de piedra`);
    else ok(a.every((q) => q.tipo === 0), `${p.id}: la madera, tipo 0`);
  }
  ok(RO.piezasDe(P.empalizada, 0, 1).length === 0, 'sana: no se dibuja nada');
  ok(JSON.stringify(RO.piezasDe(P.empalizada, 2, 1)) !== JSON.stringify(RO.piezasDe(P.empalizada, 2, 2)), 'otra obra, otras marcas');
  // la inclinación: poca, y el portón se sale más de eje
  const incl = (id, e) => RO.inclinacion(P[id], e, 5);
  ok(['x', 'y', 'z'].every((k) => incl('empalizada', 0)[k] === 0), 'sana: derecha');
  const grande = (t) => Math.max(Math.abs(t.x), Math.abs(t.y), Math.abs(t.z));
  ok(grande(incl('porton-empalizada', 2)) > grande(incl('porton-empalizada', 1)) && grande(incl('porton-empalizada', 2)) > grande(incl('empalizada', 2)), 'más rota, más torcida; el portón, la que más');
  ok(C.PLANOS.filter((x) => RO.seRompe(x)).every((p) => grande(RO.inclinacion(p, 2, 9)) < 0.15), 'nunca más de ocho grados: la colisión no se mueve');

  // en el mundo
  const w = mundo();
  const roto = M.desafio_roto_mundo.crearRotoMundo(w.s);
  const a = w.terminar('empalizada', 10, 10, 0).o, b = w.terminar('porton-empalizada', 20, 10, 0).o, c = w.terminar('muro-piedra', 30, 10, 0).o;
  const lazo = w.terminar('trampa-lazo', 40, 10, 0).o;
  const vidaMax = (o) => (Number.isFinite(o.plano.vida) ? o.plano.vida : 100);
  const hijos = (o) => o.grupo.children.length;
  const identidad = (o) => o.malla.matrix.equals(new THREE.Matrix4());
  roto.actualizar(1);
  ok(hijos(a) === 1 && identidad(a) && !a.userRoto, 'entera: sólo su malla, derecha');
  a.datos.vida = vidaMax(a) * 0.6; b.datos.vida = vidaMax(b) * 0.2; c.datos.vida = vidaMax(c) * 0.5; lazo.datos.vida = 0;
  roto.actualizar(1);
  ok(roto.estadoDe(a) === 1 && roto.estadoDe(b) === 2 && roto.estadoDe(c) === 1, 'estados 1, 2 y 1 según la vida');
  ok(hijos(a) === 2 && hijos(b) === 2 && hijos(c) === 2, 'una sola malla de marcas por obra rota');
  ok(!lazo.userRoto && hijos(lazo) === 1, 'la trampa de lazo no se muestra rota ni con la vida en cero');
  const marcas = (o) => o.grupo.children.find((x) => x !== o.malla);
  ok(marcas(a).material === a.malla.material, 'usa el material de la propia obra (no hay shaders nuevos)');
  ok(marcas(a).castShadow === false && marcas(a).receiveShadow === true, 'las marcas no suman a la pasada de sombras');
  for (const o of [a, b, c]) {
    const tipos = new Set(marcas(o).geometry.getAttribute('aTipo').array);
    ok([...tipos].every((t) => t === 0 || t === 4), 'material tipo 0 o 4');
    ok(marcas(o).geometry.getAttribute('position').count < 1800, `poca geometría (${marcas(o).geometry.getAttribute('position').count} vértices)`);
  }
  ok(!identidad(a) && !identidad(b) && marcas(b).matrix.equals(b.malla.matrix), 'la obra y sus marcas se inclinan juntas');
  ok(Math.abs(b.malla.matrix.elements[1]) + Math.abs(b.malla.matrix.elements[2]) + Math.abs(b.malla.matrix.elements[8]) > 0.05, 'el portón roto queda fuera de eje');
  const ver = marcas(a);
  roto.actualizar(1);
  ok(marcas(a) === ver && hijos(a) === 2, 'mirar de nuevo no arma nada otra vez');
  const geos = roto.geometrias;
  for (let i = 0; i < 6; i++) { const x = w.terminar('empalizada', 50 + i * 4, 30, 0).o; x.datos.vida = vidaMax(x) * 0.3; }
  roto.actualizar(1);
  ok(roto.geometrias <= geos + 4, `las geometrías se comparten entre obras (${roto.geometrias} en total)`);
  // más daño: del estado 1 al 2 cambia la malla de marcas
  a.datos.vida = vidaMax(a) * 0.1;
  roto.actualizar(1);
  ok(roto.estadoDe(a) === 2 && marcas(a) !== ver && hijos(a) === 2, 'del 1 al 2, otras marcas');
  // la obra se rehace (cambia de malla): las marcas y la inclinación pasan a la nueva
  const vieja = a.malla;
  w.s.rehacer(a);
  ok(a.malla !== vieja && identidad(a), 'rehecha, la malla nueva viene derecha');
  roto.actualizar(1);
  ok(!identidad(a) && marcas(a).matrix.equals(a.malla.matrix) && hijos(a) === 2, 'y a la próxima se la vuelve a vestir');
  // reparada: vuelve a lo normal
  for (const o of [a, b, c]) o.datos.vida = vidaMax(o);
  roto.actualizar(1);
  ok(hijos(a) === 1 && hijos(b) === 1 && hijos(c) === 1 && identidad(a) && identidad(b) && !a.userRoto, 'reparadas: sin marcas y derechas');
  // la colisión no se movió
  const q = { x: 10, y: 0, z: 10 };
  w.col.resolver(q, 0.4, 1.7);
  ok(Math.hypot(q.x - 10, q.z - 10) > 0.05, 'la empalizada sigue frenando donde estaba');
  // en el juego
  const dj = leer('src/desafio-defensas49-juego.js');
  ok(/roto\.actualizar\(dt\)/.test(dj) && /crearRotoMundo\(obras\)/.test(dj), 'el enganche actualiza lo roto en cada cuadro');
}

console.log(`4.9 defensas: ${pasos} comprobaciones en verde`);
