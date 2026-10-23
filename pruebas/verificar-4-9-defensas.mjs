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
const alien = (x, z, o = {}) => ({ estado: 'avanzar', tipo: 'rastreador', vida: 100, vidaMax: 100, def: { radio: 0.4, altura: 1, ...(o.def || {}) }, m: { g: { position: new THREE.Vector3(x, 0, z), rotation: { x: 0, y: 0, z: 0 } }, esc: 1, viejo: !!o.viejo }, fase: 0, ...o });

// ================================================================== 1. LA TRAMPA DE MIEL (reglas)
{
  eq(TR.MIEL.pegado, [3, 4], 'queda pegado entre 3 y 4 segundos');
  ok(TR.MIEL.usos === 5 && TR.MIEL.porFrasco === TR.MIEL.usos, 'aguanta cinco duendes y un frasco la deja llena');
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
    {
    const s = PA.salidasDe(r.o.datos, 'afuera');
    ok(s.length === 8 && s.every((q) => cerca(Math.hypot(q.x - boca.x, q.z - boca.z), PA.PASADIZO.llega, 1e-9)) && PA.PASADIZO.llega >= 1.5, `los ocho lugares de salida están a ${PA.PASADIZO.llega} m de la boca (más que lo que ocupa la colisión)`);
    const adentro = PA.salidasDe(r.o.datos, 'adentro');
    ok(adentro[0].z < r.o.datos.z && s[0].z > boca.z, 'el primero se aleja de la otra boca (hacia afuera del túnel)');
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
  ok(api.gastos.miel === 2 && api.tengo.miel === 0, `y gasta un frasco (gastó ${api.gastos.miel} en total, quedan ${api.tengo.miel})`);
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

// ================================================================== 6. EL PASADIZO EN EL MUNDO
{
  const w = mundo();
  const r = w.terminar('pasadizo', 10, 10, 0);
  ok(r.ok, 'el pasadizo se arma');
  const boca = PA.bocaDe(r.o.datos, 'afuera');
  const js = { pos: new THREE.Vector3(10, 0, 8.6), vel: new THREE.Vector3(3, 0, 0), yaw: 0 };
  const llamadas = [];
  const jugador = { estado: js, ubicar(x, z, yaw) { llamadas.push(['ubicar', x, z, yaw]); js.pos.set(x, 0, z); js.yaw = yaw; }, desencajar() { llamadas.push(['desencajar']); } };
  const api = apiMentira({ jugador });
  const pm = M.desafio_pasadizo_mundo.crearPasadizoMundo(w.T, w.col, w.s, sonidoFalso(), api);
  pm.refrescar();
  // el aviso y la E junto a cada boca
  ok(/Bajar al pasadizo/.test(pm.avisoCerca(js.pos)), `el aviso junto a la boca de adentro: ${pm.avisoCerca(js.pos)}`);
  ok(pm.avisoCerca({ x: 10, y: 0, z: 14.5 }) === null && !pm.usarCerca({ x: 10, y: 0, z: 14.5 }), 'en el medio del túnel no hay nada que usar');
  ok(/Meterte en el pasadizo/.test(pm.avisoCerca({ x: boca.x, y: 0, z: boca.z + 1.5 })), 'y junto a la de afuera, el otro aviso');
  ok(pm.usarCerca(js.pos) && pm.usando, 'E empieza a bajar');
  ok(api.protegido >= PA.PASADIZO.baja + PA.PASADIZO.sube, `unos segundos sin que te peguen (${api.protegido?.toFixed(2)})`);
  // mientras baja, quieto en la boca
  pm.actualizar(0.2); js.pos.set(11, 0, 8); pm.actualizar(0.1);
  ok(cerca(js.pos.x, 10) && cerca(js.pos.z, 8.6) && js.vel.length() === 0 && llamadas.length === 0, 'baja quieto, en la boca');
  ok(pm.usarCerca(js.pos) && llamadas.length === 0, 'una segunda E mientras baja no hace nada ni se pasa a otra cosa');
  // a la mitad se cambia de lugar, con la pantalla negra
  pm.actualizar(0.4);
  ok(llamadas[0]?.[0] === 'ubicar' && llamadas[1]?.[0] === 'desencajar', 'cambia de lugar una vez, y se desencaja');
  const llegada = { x: llamadas[0][1], z: llamadas[0][2], yaw: llamadas[0][3] };
  const dL = Math.hypot(llegada.x - boca.x, llegada.z - boca.z);
  ok(dL > 1.7 && dL < 3.6, `sale a ${dL.toFixed(2)} m de la boca de afuera`);
  ok(llegada.z > boca.z - 0.3, 'del lado de afuera (alejándose del túnel)');
  {
    const mira = { x: -Math.sin(llegada.yaw), z: -Math.cos(llegada.yaw) }, radial = { x: (llegada.x - boca.x) / dL, z: (llegada.z - boca.z) / dL };
    ok(mira.x * radial.x + mira.z * radial.z > 0.99, 'mirando hacia afuera de la boca (alejándose de ella)');
  }
  // en un lugar libre: ni adentro de las bocas ni de ninguna colisión
  const q = { x: llegada.x, y: 0, z: llegada.z };
  w.col.resolver(q, 0.35, 1.65);
  ok(Math.hypot(q.x - llegada.x, q.z - llegada.z) < 0.005, 'el lugar de salida está libre (la colisión no lo empuja)');
  { const ancho = { x: llegada.x, y: 0, z: llegada.z }; w.col.resolver(ancho, 0.9, 1.65); ok(Math.hypot(ancho.x - llegada.x, ancho.z - llegada.z) < 0.005, 'y con aire alrededor (sale a casi un metro de lo que haya, no abrazado a un tronco)'); }
  for (let i = 0; i < 30; i++) pm.actualizar(0.05);
  ok(!pm.usando && cerca(js.pos.x, llegada.x, 1e-9), 'termina y queda donde salió');
  ok(pm.usarCerca({ x: boca.x, y: 0, z: boca.z + 1.5 }) && !pm.usando, 'enseguida de salir no se puede volver a bajar (se enfría un momento)');
  for (let i = 0; i < 40; i++) pm.actualizar(0.05);
  // volver a entrar: de la boca de afuera a la de adentro
  js.pos.set(boca.x, 0, boca.z + 1.6);
  llamadas.length = 0;
  ok(pm.usarCerca(js.pos) && pm.usando, 'otra vez, por la boca de afuera');
  for (let i = 0; i < 30; i++) pm.actualizar(0.05);
  const entra = { x: llamadas[0][1], z: llamadas[0][2] };
  ok(Math.hypot(entra.x - 10, entra.z - 10) > 1.7 && Math.hypot(entra.x - 10, entra.z - 10) < 3.6 && entra.z < 10.5, `vuelve a entrar a la base (${entra.x.toFixed(1)}, ${entra.z.toFixed(1)})`);
  // si el primer lugar está tapado (una obra en la salida), elige otro
  {
    const w2 = mundo();
    const r2 = w2.terminar('pasadizo', 10, 10, 0).o;
    const b2 = PA.bocaDe(r2.datos, 'afuera'), salidas = PA.salidasDe(r2.datos, 'afuera');
    w2.col.agregar({ x: salidas[0].x, z: salidas[0].z, r: 0.9, alturaMin: -1, alturaMax: 3 });
    const j2 = { pos: new THREE.Vector3(10, 0, 8.6), vel: new THREE.Vector3(), yaw: 0 };
    const pm2 = M.desafio_pasadizo_mundo.crearPasadizoMundo(w2.T, w2.col, w2.s, sonidoFalso(), apiMentira({ jugador: { estado: j2, ubicar() {}, desencajar() {} } }));
    pm2.refrescar();
    const l = pm2.lugarDeSalida(r2, 'afuera');
    ok(l && Math.hypot(l.x - salidas[0].x, l.z - salidas[0].z) > 0.3, 'con la primera salida tapada, sale por otra');
    // del todo cercada: avisa y no te mueve
    const w3 = mundo();
    const r3 = w3.terminar('pasadizo', 10, 10, 0).o;
    const b3 = PA.bocaDe(r3.datos, 'afuera');
    w3.col.agregar({ x: b3.x, z: b3.z, r: 6, alturaMin: -1, alturaMax: 3 });
    const j3 = { pos: new THREE.Vector3(10, 0, 8.6), vel: new THREE.Vector3(), yaw: 0 };
    const a3 = apiMentira({ jugador: { estado: j3, ubicar() { throw new Error('no debe moverte'); }, desencajar() {} } });
    const pm3 = M.desafio_pasadizo_mundo.crearPasadizoMundo(w3.T, w3.col, w3.s, sonidoFalso(), a3);
    pm3.refrescar();
    ok(pm3.usarCerca(j3.pos) && !pm3.usando && /tapada/.test(a3.notas.at(-1)?.[0]), 'si la otra boca está tapada, lo dice y no te mueve');
    // el agua no es un lugar
    const w4 = mundo({ agua: (x, z) => z > 18 && z < 22 });
    const r4 = w4.terminar('pasadizo', 10, 10, 0);
    ok(!r4.ok, 'y no se arma con la boca de afuera en el agua');
  }
  // los duendes no lo usan ni lo ven
  ok(r.o.plano.defensa.sinCuerpo && r.o.plano.defensa.oculta, 'los duendes y los tiros pasan de largo (sin cuerpo) y no cuenta como defensa');
  const des = leer('src/desafio.js'), fortin = leer('src/desafio-fortin-mundo.js');
  ok(/if \(fortin\?\.sinCuerpo\(o\) \|\| fortin\?\.debajo\(o, y - base\)\) continue;/.test(des) && /fortin\?\.obraAbierta\(o\) \|\| fortin\?\.sinCuerpo\(o\)\) continue;/.test(des), 'los tiros y las paredes de los duendes saltean lo que no tiene cuerpo');
  ok(/const sinCuerpo = \(o\) => !!o\.plano\.defensa\?\.sinCuerpo;/.test(fortin), 'y esa lista la lee del plano');
  ok(/filter\(\(o\) => o\.datos\.etapas > 0 && o\.plano\.categoria === 'defensa' && !o\.plano\.defensa\?\.oculta\)/.test(des), 'el pasadizo no suma a las defensas que piden los compañeros');
  // la pantalla se cierra y se abre
  const f = PA.faseDeBajada;
  ok(f(0).negro === 0 && f(PA.PASADIZO.baja).negro > 0.99 && f(PA.PASADIZO.baja + PA.PASADIZO.sube).parte === 'fin', 'la animación va del claro al negro y vuelve');
  ok(f(0.2).negro > 0 && f(0.2).negro < f(0.4).negro && f(0.8).negro > f(1.0).negro, 'cierra y abre de a poco');
}

// ================================================================== 7. EL FAROL DE MANO
{
  const F = await import('../src/desafio-farol.js');
  // reglas
  const viejo = { radio: 0.4 }, jefe = { jefe: true };
  ok(F.efectoFarol({ dist: 3, viejo: true, def: viejo }).alejarse && F.efectoFarol({ dist: 3, viejo: true, def: viejo }).vel === F.FAROL.velRetroceso, 'un viejo oscuro cerca del farol se aleja');
  ok(F.efectoFarol({ dist: F.FAROL.radio + 0.1, viejo: true, def: viejo }) === null && F.efectoFarol({ dist: 99, viejo: true, def: viejo }) === null, 'a más del radio, nada');
  ok(F.efectoFarol({ dist: 2, viejo: false, def: viejo }) === null, 'los traviesos no se asustan');
  ok(F.efectoFarol({ dist: 2, viejo: true, def: jefe }) === null, 'el mandamás tampoco');
  ok(F.efectoFarol({ dist: 2, viejo: true, def: viejo, romper: true }) === null, 'ni el que está rompiendo una pared');
  ok(F.alcanceDelata(40, true) === 40 * F.FAROL.delata && F.alcanceDelata(40, false) === 40 && F.FAROL.delata > 1, 'el farol te delata: los tiradores te ven de más lejos');
  ok(cerca(F.rumboAlejarse({ x: 5, z: 0 }, { x: 0, z: 0 }), Math.PI / 2) && cerca(F.rumboAlejarse({ x: 0, z: -3 }, { x: 0, z: 0 }), Math.PI), 'el rumbo para alejarse es el contrario a vos');
  eq(F.sePuedePrender({ lluvia: 0.8, tiene: true }).ok, false, 'con lluvia fuerte no prende');
  eq(F.sePuedePrender({ lluvia: 0, tiene: false }).ok, false, 'sin el farol, no');
  eq(F.sePuedePrender({ lluvia: 0.3, tiene: true }).ok, true, 'con llovizna, sí');
  const receta = RECETAS.find((x) => x.id === 'farol-mano');
  ok(receta && receta.cat === 'equipo' && receta.unica && receta.da.cosa === 'farolMano' && /izquierda/.test(receta.texto), 'receta en el taller (Equipo)');

  // en el mundo: la luz de la linterna, prestada
  const M2 = cargar(['desafio-farol-mundo.js']);
  const camara = new M2.THREE.PerspectiveCamera();
  const luz = new M2.THREE.SpotLight(0xfff0d8, 0, 42, 0.42, 0.5, 1.2);
  luz.position.set(0.12, -0.08, 0); luz.target.position.set(0, -0.6, -6);
  const d = { farolOn: false }, cosas = { farolMano: 1 }, clima = { lluvia: 0 }, notas = [];
  const api = { D: () => d, cosas: () => cosas, clima: () => clima, nota: (t, s) => notas.push(t), luzLinterna: () => luz, sonido: { encender() {}, carrete() {} } };
  const farol = M2.desafio_farol_mundo.crearFarolMundo(camara, api);
  const js = { pos: new M2.THREE.Vector3(), vel: new M2.THREE.Vector3() };
  farol.actualizar(0.1, js);
  ok(!farol.prendido && !farol.mano.visible && luz.intensity === 0 && luz.distance === 42, 'apagado: la linterna es la de siempre y el farol no se ve');
  ok(camara.children.includes(farol.mano), 'el farol cuelga de la cámara (la mano izquierda)');
  ok(farol.mano.position.x < 0 && farol.mano.position.x > -0.5, 'a la izquierda');
  ok(farol.alternar() === true && d.farolOn, 'se prende');
  farol.actualizar(0.1, js);
  ok(farol.prendido && farol.mano.visible, 'el farol se ve en la mano');
  ok(luz.color.getHex() === F.FAROL.luz.color && luz.distance === F.FAROL.luz.alcance && luz.angle === F.FAROL.luz.angulo && luz.intensity > 20 && luz.position.x < 0, 'la linterna toma color ámbar, ángulo ancho, poco alcance y se corre a la izquierda');
  ok(luz.distance < 42 && luz.angle > 0.42, 'menos alcance y más abierta que la linterna');
  // la L mientras el farol está prendido no lo apaga
  luz.intensity = 0; farol.actualizar(0.05, js);
  ok(luz.intensity > 20, 'la L (linterna) no apaga el farol prendido');
  // no hay luces nuevas
  let luces = 0; camara.traverse((o) => { if (o.isLight) luces++; });
  ok(luces === 0, 'el farol no suma luces a la escena');
  // los duendes
  const alien = (dist, o = {}) => ({ estado: 'avanzar', def: o.def || { radio: 0.4 }, m: { g: { position: new M2.THREE.Vector3(dist, 0, 0) }, viejo: !!o.viejo } });
  js.pos.set(0, 0, 0);
  const v1 = farol.estadoAlien(alien(3, { viejo: true }), js);
  ok(v1 && v1.sinAtaque && cerca(v1.rumbo, Math.PI / 2) && v1.vel === F.FAROL.velRetroceso, 'el viejo oscuro a 3 m se aleja y no ataca');
  ok(farol.estadoAlien(alien(8, { viejo: true }), js) === null && farol.estadoAlien(alien(3, { viejo: false }), js) === null, 'a 8 m o travieso: nada');
  ok(farol.alcance(40) === 40 * F.FAROL.delata, 'prendido, te ven más lejos');
  // la lluvia lo apaga
  clima.lluvia = 0.9; farol.actualizar(0.1, js);
  ok(!farol.prendido && !d.farolOn && notas.at(-1) === 'La lluvia apagó el farol' && luz.intensity === 0 && luz.distance === 42 && luz.color.getHex() === 0xfff0d8, 'la lluvia fuerte lo apaga y la linterna vuelve a la de siempre');
  ok(farol.estadoAlien(alien(3, { viejo: true }), js) === null && farol.alcance(40) === 40, 'apagado: ni se asustan ni te ven más lejos');
  ok(farol.alternar() === null && /lluvia/.test(notas.at(-1)), 'con lluvia no se prende');
  clima.lluvia = 0;
  // sin el farol
  cosas.farolMano = 0;
  ok(farol.alternar() === null && /No tenés el farol/.test(notas.at(-1)), 'sin el farol fabricado, no se prende');
  cosas.farolMano = 1;
  // apagar a mano: la linterna queda apagada y como estaba
  farol.alternar(); farol.actualizar(0.1, js);
  ok(farol.alternar() === false, 'se apaga');
  farol.actualizar(0.1, js);
  ok(!farol.mano.visible && luz.intensity === 0 && luz.angle === 0.42 && luz.penumbra === 0.5 && luz.position.x === 0.12, 'la linterna vuelve a sus valores de siempre');
  // los enganches
  const dj = leer('src/desafio.js'), main = leer('src/main.js'), moch = leer('src/mochila.js');
  ok(dj.includes('defensas49.alcanceDelata(def.alcance * clima.vista)'), 'desafio.js: los tiradores ven más lejos con el farol');
  ok(/case 'farolMano': if \(desafio && !desafio\.caido\) desafio\.alternarFarol\(\); break;/.test(main), 'main.js: U y el clic derecho prenden y apagan el farol');
  ok(/luzLinterna: \(\) => linterna,/.test(main) && /armaEnMano: \(\) => ranuras\[elegida\]\?\.id \|\| null,/.test(main), 'main.js: le pasa la luz de la linterna y lo que hay elegido');
  ok(/icono: 'farolMano', accion: 'farolMano'/.test(moch) && /^    farolMano\(\) \{/m.test(moch), 'mochila: la casilla y su icono');
}

// ================================================================== 8. LA PALA DE BRASAS
{
  const B = await import('../src/desafio-brasas.js');
  const P = B.PALA;
  // reglas
  const des = B.desviosDelAbanico();
  ok(des.length === P.brasas && cerca(des[0], -P.abanico / 2) && cerca(des.at(-1), P.abanico / 2) && cerca(des[4], 0), 'el abanico: nueve brasas repartidas de punta a punta');
  const o = { x: 0, z: 0 };
  ok(B.enElAbanico(o, 0, { x: 0, z: 6 }) && B.enElAbanico(o, 0, { x: 2, z: 6 }) && !B.enElAbanico(o, 0, { x: 0, z: -6 }) && !B.enElAbanico(o, 0, { x: 7, z: 3 }) && !B.enElAbanico(o, 0, { x: 0, z: P.alcance + 1 }), 'dentro del abanico: adelante y a lo ancho; no atrás, de costado ni más lejos del alcance');
  ok(B.enElAbanico(o, Math.PI / 2, { x: 6, z: 0 }) && !B.enElAbanico(o, Math.PI / 2, { x: 0, z: 6 }), 'y gira con el rumbo');
  ok(B.distanciaDeCaida(0) === P.alcance * 0.5 && B.distanciaDeCaida(1) === P.alcance, 'las brasas caen de la mitad del alcance al alcance');
  const eN = B.efectoSobre({}), eP = B.efectoSobre({ pesado: true }), eJ = B.efectoSobre({ jefe: true });
  ok(eN.dano === P.dano && eN.duda === P.duda && eP.duda < eN.duda && eJ.duda < eP.duda && eJ.dano === P.dano, 'daño chico; los grandes dudan la mitad y el mandamás casi nada');
  ok(P.dano < 10, 'el daño de fuego es chico');
  const d = { brasas: 0 };
  eq(B.cargarPala(d, false).accion, 'sinFuego', 'sin fuego cerca, no carga');
  eq(B.cargarPala(d, true).accion, 'cargar', 'junto a un fuego, sí');
  ok(d.brasas === P.cargas, `queda con ${P.cargas} cargas`);
  eq(B.cargarPala(d, true).accion, 'llena', 'llena, no hace nada');
  ok(B.avisoPala({ brasas: 0 }, true) !== null && B.avisoPala({ brasas: P.cargas }, true) === null && B.avisoPala({ brasas: 0 }, false) === null, 'el aviso sólo junto a un fuego y si falta cargar');
  ok(B.sanearBrasas({ brasas: 99 }).brasas === P.cargas && B.sanearBrasas({ brasas: 'x' }).brasas === 0 && B.sanearBrasas({ brasas: -3 }).brasas === 0, 'las brasas se sanean');
  const receta = RECETAS.find((x) => x.id === 'pala');
  ok(receta && receta.cat === 'armas' && receta.unica && receta.da.cosa === 'pala', 'receta en el taller (Armas)');
  const ARSENAL = (await import('../src/desafio-arsenal.js')).ARSENAL;
  ok(ARSENAL.pala?.tipo === 'brasas' && ARSENAL.pala.municion === 'brasas', 'la pala es un arma del arsenal que gasta brasas');
  // el sonido: recetas que devuelven audio de verdad
  const S = await import('../src/desafio-brasas-sonido.js');
  const { completar, crearAzar } = await import('../src/sonido-sintesis.js');
  for (const [nombre, receta] of [['abanico', S.abanicoBrasas], ['cargar', S.cargarBrasas], ['prender', S.prenderMiel]]) {
    const buf = completar(receta(16000, crearAzar(7)));
    let max = 0, suma = 0; for (const v of buf) { max = Math.max(max, Math.abs(v)); suma += v * v; }
    ok(buf.length > 16000 * 0.4 && buf.length < 16000 * 1.2 && max > 0.8 && max <= 0.91 && Math.sqrt(suma / buf.length) > 0.01 && buf.every(Number.isFinite), `el sonido «${nombre}» existe: ${(buf.length / 16000).toFixed(2)} s, pico ${max.toFixed(2)}`);
  }
  ok(JSON.stringify([...completar(S.abanicoBrasas(8000, crearAzar(1))).slice(0, 50)]) !== JSON.stringify([...completar(S.abanicoBrasas(8000, crearAzar(2))).slice(0, 50)]), 'y cada vez suena un poco distinto');

  // en el mundo
  const M3 = cargar(['construccion.js', 'colisiones.js', 'desafio-trampas-mundo.js', 'desafio-brasas-mundo.js']);
  const w = { T: { altura: () => 0, agua: () => false, normal: () => new M3.THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {} } };
  const col3 = M3.colisiones.crearColisiones();
  const s = M3.construccion.crearConstruccion(w.T, new M3.THREE.Scene(), col3, { arboles: [], despejar() {} }, { agregar() {}, agregarPostigos() {}, eliminarPorDuenio() {} });
  const dd = { brasas: 3, miel: 0 }, cosas = { pala: 1 }, ardiendo = [];
  const aliens = [];
  const api = apiMentira({ aliens, tengo: { miel: 0, tabla: 9 } });
  Object.assign(api, { D: () => dd, cosas: () => cosas, armaEnMano: () => 'pala', fuegos: () => [{ x: 2, y: 0, z: 2 }], obraEnPunto: () => null, herirAlien(a, dano, desde, fuente, clase) { a.vida -= dano; a.ultimoGolpe = [fuente, clase]; }, sonido: sonidoFalso() });
  const ef = efectosFalsos();
  const trampas = M3.desafio_trampas_mundo.crearTrampasMundo(w.T, new M3.THREE.Scene(), s, ef, sonidoFalso(), api);
  const barriles = [];
  const brasas = M3.desafio_brasas_mundo.crearBrasasMundo(w.T, ef, sonidoFalso(), api, trampas, { prendidas: [], estallarCerca: (p, r) => barriles.push([p.x, p.z, r]) });
  const mk = (x, z, o = {}) => ({ estado: 'avanzar', tipo: 'rastreador', vida: 100, vidaMax: 100, def: { radio: 0.4, altura: 1, ...(o.def || {}) }, m: { g: { position: new M3.THREE.Vector3(x, 0, z), rotation: { x: 0, y: 0, z: 0 } }, esc: 1, viejo: false }, fase: 0, ...o });
  // cargar la pala con E junto a un fuego
  const pos = { x: 0, y: 0, z: 0 };
  ok(/Cargar la pala/.test(brasas.avisoCerca(pos)) && !brasas.usarCerca({ x: 30, y: 0, z: 30 }), 'junto al fuego, la E ofrece cargar la pala; lejos no');
  ok(brasas.usarCerca(pos) && dd.brasas === P.cargas && /Cargaste la pala/.test(api.notas.at(-1)[0]), 'E la carga');
  ok(brasas.avisoCerca(pos) === null && !brasas.usarCerca(pos), 'llena, la E sigue de largo');
  dd.brasas = 0;
  api.armaEnMano = () => 'hacha';
  ok(brasas.avisoCerca(pos) === null && !brasas.usarCerca(pos) && dd.brasas === 0, 'con otra cosa en la mano, la E no es de la pala');
  api.armaEnMano = () => 'pala';
  cosas.pala = 0;
  ok(brasas.avisoCerca(pos) === null && !brasas.usarCerca(pos) && dd.brasas === 0, 'sin la pala fabricada, tampoco');
  cosas.pala = 1;
  dd.brasas = P.cargas;
  eq(JSON.stringify(brasas.fuegosDeBase().map((f) => f.tipo)), '["fogon"]', '`fuegosDeBase` lista los fogones prendidos (y las antorchas)');
  const brasas2 = M3.desafio_brasas_mundo.crearBrasasMundo(w.T, ef, sonidoFalso(), api, trampas, { prendidas: [{ datos: { x: 5, y: 0, z: 5 } }] });
  eq(JSON.stringify(brasas2.fuegosDeBase().map((f) => f.tipo)), '["fogon","antorcha"]', 'con una antorcha prendida, también');
  // el abanico
  const miel = trampas.colocar(0, 8.25, { gratis: true });
  ok(miel.ok, 'una trampa de miel adelante, a 8 m');
  const delante = mk(0, 6), dos = mk(2.5, 7), atras = mk(0, -5), lejos = mk(0, 14), costado = mk(8, 2), grande = mk(0.5, 8, { def: { pesado: true } }), jefe = mk(-1, 5, { def: { jefe: true } });
  aliens.push(delante, dos, atras, lejos, costado, grande, jefe);
  const random = Math.random; Math.random = () => 0.5;
  const js = { pos: new M3.THREE.Vector3(0, 0, 0) };
  try {
    brasas.abanico(js, new M3.THREE.Vector3(0, 0, 1));
    ok(brasas.enElAire === P.brasas, `salen ${P.brasas} brasas`);
    for (const a of [delante, dos, grande, jefe]) {
      ok(a.vida === 100 - P.dano && a.ultimoGolpe[0] === 'jugador' && a.ultimoGolpe[1] === 'fuego', 'los del abanico se llevan un daño chico de fuego');
      ok(a.fuegoT >= P.fuego, 'y arden un instante');
    }
    ok(delante.ahuyentadoT === P.duda && grande.ahuyentadoT === P.dudaPesado && jefe.ahuyentadoT === P.dudaJefe, 'dudan: los grandes la mitad, el mandamás casi nada');
    for (const a of [atras, lejos, costado]) ok(a.vida === 100 && !a.ahuyentadoT, 'los de atrás, de costado o más lejos del alcance, ni se enteran');
    // dudan un instante quietos y después retroceden
    const e0 = brasas.estadoAlien(delante, 0.1, js);
    ok(e0.vel === 0 && e0.sinAtaque && e0.rumbo === null, 'primero se quedan agazapados un instante');
    for (let i = 0; i < 8; i++) brasas.estadoAlien(delante, 0.1, js);
    const e1 = brasas.estadoAlien(delante, 0.1, js);
    ok(e1.sinAtaque && e1.vel > 0 && cerca(e1.rumbo, Math.atan2(0, 6)) && Math.abs(e1.rumbo) < 0.01, 'y retroceden: el rumbo se aleja de vos');
    for (let i = 0; i < 40; i++) brasas.estadoAlien(delante, 0.1, js);
    ok(brasas.estadoAlien(delante, 0.1, js) === null, 'pasado un rato, vuelven a lo suyo');
    // el que rompía una pared la suelta
    const rompe = mk(0, 5, { estado: 'romper', obra: { x: 1 } });
    aliens.push(rompe);
    brasas.abanico(js, new M3.THREE.Vector3(0, 0, 1));
    ok(rompe.estado === 'avanzar' && rompe.obra === null, 'el que rompía una pared la suelta');
    // tapado por una pared: no le llega
    const pared = mk(0, 6); aliens.push(pared);
    api.obraEnPunto = (x, y, z) => (Math.abs(z - 3) < 1.7 ? { pared: true } : null);
    brasas.abanico(js, new M3.THREE.Vector3(0, 0, 1));
    ok(pared.vida === 100 && !pared.ahuyentadoT, 'si hay una pared en el medio, no le llega');
    api.obraEnPunto = () => null;
    // las brasas caen y prenden la miel
    ok(!TR.estaPrendida(miel.obra.datos), 'la miel todavía no ardía');
    for (let i = 0; i < 20; i++) brasas.actualizar(0.05);
    ok(brasas.enElAire === 0, 'todas cayeron en un segundo');
    ok(TR.estaPrendida(miel.obra.datos), 'una brasa cayó sobre la miel y la prendió');
    ok(miel.obra.userMiel.m.material.isMeshBasicMaterial, 'la miel prendida brilla (naranja que late)');
    ok(ef.l.some((x) => x[0] === 'fuego') && ef.l.some((x) => x[0] === 'chispas'), 'se ven chispas y llamitas (desafio-efectos.js, sin tocarlo)');
    ok(barriles.length > 0 && barriles.every((b) => b[2] === P.radioPrende), 'y se avisa a los barriles de resina donde cae cada brasa');
    // la miel encendida quema a los pegados
    const pegado = mk(0.2, 8.1);
    miel.obra.datos.prendida = 0; miel.obra.datos.usos = TR.MIEL.usos; aliens.push(pegado);
    trampas.estadoAlien(pegado, 0.016);
    ok(pegado.pegadoT > 0, 'un duende pegado en la miel');
    TR.prender(miel.obra.datos);
    trampas.estadoAlien(pegado, 0.016);
    ok(pegado.fuegoT >= 1.2, 'con la miel prendida, se quema');
    for (let i = 0; i < 160; i++) trampas.actualizar(0.05);
    ok(TR.estaSeca(miel.obra.datos) && !pegado.pegadoT && pegado.fuegoT >= 3, 'cuando la miel se consume, queda seca y lo suelta ardiendo');
    ok(/La miel se quemó/.test(api.notas.at(-1)[0]), 'y avisa');
    ok(miel.obra.userMiel.m.material.isMeshLambertMaterial && !miel.obra.userMiel.m.material.isMeshBasicMaterial, 'y el charco queda seco, sin brillo');
  } finally { Math.random = random; }
  // reciclar un duende borra lo suyo
  const reciclado = mk(0, 0, { ahuyentadoT: 2, dudaInicial: 1 });
  brasas.limpiarAlien(reciclado);
  ok(reciclado.ahuyentadoT === 0 && reciclado.dudaInicial === 0, 'al reciclar un duende se borra lo ahuyentado');
  // los enganches con el juego
  const dj = leer('src/desafio.js'), glue = leer('src/desafio-defensas49-juego.js'), moch = leer('src/mochila.js'), cm = leer('src/main.js'), enm = leer('src/enmano.js');
  ok(/case 'brasas':[^\n]*\n\s+d\.brasas--;\n\s+defensas49\.abanico\(js, _dir\);/.test(dj), 'desafio.js: el clic izquierdo con la pala gasta una brasa y tira el abanico');
  ok(dj.includes("pala: ['La pala no tiene brasas'"), 'y sin brasas lo dice');
  ok(/icono: 'palaBrasas'/.test(moch) && /^    palaBrasas\(\) \{/m.test(moch) && /^  pala\(\) \{/m.test(enm), 'mochila y mano: la casilla, su icono y la pala en la mano');
  ok(/fuegos: \(\) => \(clima\?\.fogatas \|\| \[\]\)\.filter/.test(cm), 'main.js le dice dónde hay fogones prendidos');
  ok(/limpiarAlien = \(a\) => \{ trampas\.limpiarAlien\(a\); brasas\.limpiarAlien\(a\); \}/.test(glue) && dj.includes('defensas49.limpiarAlien(a);'), 'bajarAlien limpia los campos nuevos');
  ok(/trampas\.estadoAlien\(a, dt, js\)[\s\S]*brasas\.estadoAlien\(a, dt, js\)[\s\S]*farol\.estadoAlien\(a, js\)/.test(glue), 'el pegado manda sobre las brasas y éstas sobre el farol');
}

// ================================================================== 9. LAS PARTIDAS, LA MOCHILA Y EL TALLER
{
  // una partida de antes carga sin nada de esto
  const vieja = sanearDesafio({ salud: 80, noches: 3, oleadas: 3, flechas: 5, cosas: { x: 1 } });
  ok(vieja.miel === 0 && vieja.brasas === 0 && vieja.farolOn === false, 'una partida vieja: sin miel, sin brasas y con el farol apagado');
  const { SE_LLEVA } = await import('../src/desafio-vuelta.js');
  ok(SE_LLEVA.includes('farolMano') && SE_LLEVA.includes('pala'), 'el farol y la pala pasan a la otra vuelta con las demás armas fabricadas');
  const rota = sanearDesafio({ miel: {}, brasas: [], farolOn: 'si' });
  ok(rota.miel === 0 && rota.brasas === 0 && rota.farolOn === true, 'datos raros no rompen (el farol se queda en booleano)');
  ok(JSON.stringify(sanearDesafio(JSON.parse(JSON.stringify(sanearDesafio({ miel: 4, brasas: 2, farolOn: true }))))) === JSON.stringify(sanearDesafio({ miel: 4, brasas: 2, farolOn: true })), 'guardar y volver a abrir deja lo mismo');
  // las obras guardadas con miel
  const w = mundo();
  const colocadas = [{ plano: 'trampa-miel', x: 12, z: 12, y: 0, rot: 0, etapas: 1, usos: 'mucho', prendida: -3 }, { plano: 'trampa-miel', x: 30, z: 30, y: 0, rot: 0, etapas: 1, usos: 3, prendida: 99 }, { plano: 'pasadizo', x: 50, z: 10, y: 0, rot: 0, etapas: 1 }];
  w.s.sincronizar(colocadas);
  ok(w.s.obras.length === 3, 'las obras de una partida guardada se arman (las dos trampas y el pasadizo)');
  const tm = M.desafio_trampas_mundo.crearTrampasMundo(w.T, new THREE.Scene(), w.s, efectosFalsos(), sonidoFalso(), apiMentira());
  tm.refrescar();
  const [a, b] = tm.trampas;
  ok(a.datos.usos === 0 && a.datos.prendida === 0 && b.datos.usos === 3 && b.datos.prendida === TR.MIEL.quema.dura, 'el estado de las trampas se sanea al abrir (seca, o con lo que le queda; la que ardía sigue ardiendo)');
  // la mochila
  const { armarMochila } = await import('../src/mochila.js');
  const prog = { modo: 'desafio', entradas: {}, materiales: {}, cosas: { arco: 1, farolMano: 1, pala: 1, hacha: 1 }, desafio: { ...desafioNuevo(), miel: 3, brasas: 4, farolOn: true, flechas: 4 } };
  const ranuras = armarMochila(prog, {});
  const ids = ranuras.map((r) => r.id);
  for (const id of ['farolMano', 'pala', 'miel-frasco']) ok(ids.includes(id), `la mochila trae ${id}`);
  const rp = ranuras.find((r) => r.id === 'pala'), rf = ranuras.find((r) => r.id === 'farolMano'), rm = ranuras.find((r) => r.id === 'miel-frasco');
  ok(rp.cuenta === 4 && rp.accion === 'arma' && rf.accion === 'farolMano' && /prendido/.test(rf.nombre) && rm.cuenta === 3, 'con sus cuentas: 4 brasas, farol prendido y 3 frascos');
  ok(ids.indexOf('farolMano') < 9 && ids.indexOf('pala') < 9, `el farol y la pala caen en las nueve casillas de la barra (lugares ${ids.indexOf('pala') + 1} y ${ids.indexOf('farolMano') + 1})`);
  ok(ids.indexOf('farolMano') === ids.indexOf('linterna') + 1, 'el farol va justo después de la linterna');
  prog.desafio.miel = 0;
  ok(!armarMochila(prog, {}).some((r) => r.id === 'miel-frasco'), 'sin miel no hay casilla');
  prog.cosas = {}; prog.desafio.farolOn = false;
  ok(!armarMochila(prog, {}).some((r) => r.id === 'farolMano' || r.id === 'pala'), 'sin fabricarlas, tampoco');
  // los textos, en castellano, sin inglés ni nada religioso
  const textos = [TR.RECETAS_TRAMPAS, RECETAS.filter((r) => ['farol-mano', 'pala', 'miel-trampa'].includes(r.id))].flat().map((r) => `${r.nombre} ${r.texto}`).join(' ') + C.PLANO['trampa-miel'].texto + C.PLANO.pasadizo.texto;
  ok(!/\b(the|and|with|trap|honey|lantern|shovel|tunnel|escape)\b/i.test(textos), 'los textos nuevos, en castellano');
  ok(!/\b(dios|santo|santa|cruz|bendito|rez[oó]|milagro)\b/i.test(textos), 'y sin nada religioso');
  // la guía (F1)
  const { seccionesGuia } = await import('../src/guia.js');
  const textoGuia = JSON.stringify(seccionesGuia('desafio'));
  for (const titulo of ['Lo roto se ve', 'La trampa de miel', 'El pasadizo de escape', 'El farol de mano', 'La pala de brasas']) ok(textoGuia.includes(titulo), `la guía explica «${titulo}»`);
}

console.log(`4.9 defensas: ${pasos} comprobaciones en verde`);
