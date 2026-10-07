// 3.7.5 «Tradiciones», los rincones y la casa (rincones.js, futbol.js, sulky.js, casa-propia.js, rincones-cuaderno.js y el
// enganche en main.js, guardado.js, jugador.js, cuaderno.js y vecindad-juego.js), sin Electron:
//   0. los módulos (puros, imports en una línea, exportados sin eñe, LF);
//   1. dónde está cada rincón, medido contra el terreno real (fuera de las calles y de los edificios; el potrero y la
//      huerta, parejos; el fuerte, en el bosque);
//   2. los doce duendes (en seco, separados, en el cuaderno; el registro y la talla);
//   3. el taller: lo que enseña cada amigo y lo que se hace;
//   4. las huertas (la de todos y la de los chicos), los títeres, el fuerte y el campamento;
//   5. el fútbol: la pelota rueda, se frena, pega en el palo y el gol entra;
//   6. el camino refugio–aldea con el terreno real, el puentecito, los faroles y el sulky;
//   7. tu casa en la calle de la Loma;
//   8. el guardado (partida nueva, vieja y rota) y el caos;
//   9. el enganche: la E y el aviso en el mismo orden, el sulky en jugador.js, la charla;
//  10. nada religioso, todo en castellano.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as R from '../src/rincones.js';
import * as F from '../src/futbol.js';
import * as S from '../src/sulky.js';
import * as C from '../src/casa-propia.js';
import * as RC from '../src/rincones-cuaderno.js';
import * as A from '../src/aldea.js';
import { ENTRADAS } from '../src/cuaderno.js';
import { esPersonaVecindad } from '../src/vecindad.js';
import { CULTIVOS } from '../src/huerta.js';
import { generarTerreno } from '../src/terreno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const RELIGIOSO = /capilla|\bmisa\b|\bcura\b|\bcuras\b|\brez[aoá]|\bdios|\bsant[oa]s?\b|bendi|iglesia|altar|parroq|milagro|virgen|sagrad[oa]s? |ángel|amén|pecado/i;

// ============================================================ 0. los módulos
{
  const puros = ['src/rincones.js', 'src/futbol.js', 'src/sulky.js', 'src/casa-propia.js', 'src/rincones-cuaderno.js', 'src/rincones-juego.js'];
  for (const [f, M] of [['src/rincones.js', R], ['src/futbol.js', F], ['src/sulky.js', S], ['src/casa-propia.js', C], ['src/rincones-cuaderno.js', RC]]) for (const k of Object.keys(M)) ok(!/ñ/.test(k), `${f}: exportado sin eñe: ${k}`);
  for (const f of [...puros, 'src/rincones-mundo.js']) {
    const t = leer(f);
    if (f !== 'src/rincones-mundo.js') ok(!/from 'three'|document\.|window\./.test(t), `${f} es puro`);
    for (const m of t.matchAll(/^import .*$/gm)) ok(/^import (\* as THREE from 'three'|\{ [\w, ]+ \} from '\.\/[\w-]+\.js');$/.test(m[0]), `${f}: import en una línea: ${m[0]}`);
    ok(!/^export\s+(async\s+function|function\*|\*|.*\sfrom\s)/m.test(t) && !t.includes('\r'), `${f}: lo que entiende armar.mjs, con LF`);
    ok(t.includes('3.7.5'), `${f}: con la versión en los comentarios`);
  }
  // el three local no trae estas
  const mundo = leer('src/rincones-mundo.js');
  for (const k of ['ShapeGeometry', 'new THREE.Shape(', 'OctahedronGeometry', 'Vector4', 'Frustum']) ok(!mundo.includes(k), `rincones-mundo.js no usa ${k}`);
  ok(leer('package.json').includes('node pruebas/verificar-3-7-5-rincones.mjs'), 'la prueba está en el gate');
}

// ============================================================ 1. dónde está cada rincón (terreno real)
const T = generarTerreno();
const M = A.marcoAldea();
{
  const en = (lx, lz, margen = 0.3) => A.IDS_EDIFICIOS.filter((id) => A.dentroDePlanta(id, lx, lz, margen));
  const enCalle = (lx, lz) => A.CALLES_ALDEA.filter((c) => A.distanciaACalle(lx, lz, c) < 0.3).map((c) => c.id);
  const L = R.LUGARES_RINCONES;
  for (const [id, l] of Object.entries(L)) {
    const dentro = en(l.lx, l.lz);
    if (id === 'atril') eq(dentro, ['biblioteca'], 'el atril, adentro de la biblioteca');
    else if (id === 'retablo' || id === 'talla') eq(dentro, ['plaza'], `${id}: en la plaza`);
    else eq(dentro, [], `${id}: fuera de los edificios`);
    eq(enCalle(l.lx, l.lz), [], `${id}: fuera de las calles`);
    const w = R.lugarEnMundo(id);
    ok(Number.isFinite(w.x) && Number.isFinite(w.z) && !T.agua(w.x, w.z), `${id}: en seco`);
  }
  // el potrero: la cancha entera fuera de calles y edificios, sin agua y con menos de 1,6 m de desnivel
  const P = L.potrero, c = Math.cos(P.rot), s = Math.sin(P.rot);
  let mn = Infinity, mx = -Infinity, malos = 0;
  for (let u = -P.ancho / 2; u <= P.ancho / 2; u += 1) for (let v = -P.largo / 2; v <= P.largo / 2; v += 1) {
    const lx = P.lx + u * c + v * s, lz = P.lz - u * s + v * c;
    if (en(lx, lz, 1).length || enCalle(lx, lz).length) malos++;
    const w = M.aMundo(lx, lz); if (T.agua(w.x, w.z)) malos++;
    const h = T.altura(w.x, w.z); mn = Math.min(mn, h); mx = Math.max(mx, h);
  }
  ok(malos === 0, `el potrero, libre (${malos} puntos malos)`);
  ok(mx - mn < 1.6, `el potrero, parejo (${(mx - mn).toFixed(2)} m de desnivel)`);
  // la huerta de todos
  const H = L.huerta, ch = Math.cos(H.rot), sh = Math.sin(H.rot);
  mn = Infinity; mx = -Infinity; malos = 0;
  for (let u = -H.ancho / 2; u <= H.ancho / 2; u += 0.5) for (let v = -H.largo / 2; v <= H.largo / 2; v += 0.5) {
    const lx = H.lx + u * ch + v * sh, lz = H.lz - u * sh + v * ch;
    if (en(lx, lz, 0.5).length || enCalle(lx, lz).length) malos++;
    const w = M.aMundo(lx, lz); const h = T.altura(w.x, w.z); mn = Math.min(mn, h); mx = Math.max(mx, h);
  }
  ok(malos === 0 && mx - mn < 1.0, `la huerta de todos, libre y pareja (${(mx - mn).toFixed(2)} m)`);
  // el fuerte, en el bosque; el campamento, al lado
  const fu = R.lugarEnMundo('fuerte'), ca = R.lugarEnMundo('campamento');
  ok(T.bosque[T.indice(fu.x, fu.z)] > 0.5, 'el fuerte, bosque adentro');
  ok(Math.hypot(fu.x - ca.x, fu.z - ca.z) > 6 && Math.hypot(fu.x - ca.x, fu.z - ca.z) < 14, 'el campamento, al lado del fuerte');
  // la huerta de los chicos, detrás de la escuela y cerca
  ok(Math.hypot(L.huertaChicos.lx - 0, L.huertaChicos.lz - 71) < 9, 'la huerta de los chicos, junto a la escuela');
  // tu talla, al lado del duende de la plaza
  const dp = A.puntosDe('plaza').duende;
  ok(Math.hypot(L.talla.lx - dp.x, L.talla.lz - dp.z) < 3.5, 'tu talla, al lado del duende viejo');
}

// ============================================================ 2. los doce duendes
{
  eq(RC.DUENDES.length, 12, 'doce duendes');
  eq(new Set(RC.IDS_DUENDES).size, 12, 'ids únicos');
  const D = R.ubicarDuendes(T);
  eq(D.length, 12, 'los doce, ubicados');
  const valle = D.filter((d) => !RC.DUENDES.find((q) => q.id === d.id).donde.aldea), aldea = D.filter((d) => RC.DUENDES.find((q) => q.id === d.id).donde.aldea);
  ok(valle.length === 7 && aldea.length === 5, 'siete en el valle y cinco en la aldea');
  for (const d of D) {
    ok(Number.isFinite(d.x) && Number.isFinite(d.z) && Number.isFinite(d.y), `${d.id}: con lugar`);
    if (!d.adentro) ok(!T.agua(d.x, d.z), `${d.id}: en seco`);
  }
  for (let i = 0; i < D.length; i++) for (let j = i + 1; j < D.length; j++) ok(Math.hypot(D[i].x - D[j].x, D[i].z - D[j].z) > 25, `${D[i].id} y ${D[j].id}: separados`);
  // los de la aldea: fuera de las calles; adentro de un edificio sólo el de la biblioteca
  for (const q of RC.DUENDES.filter((x) => x.donde.aldea)) {
    const [lx, lz] = q.donde.aldea;
    const dentro = A.IDS_EDIFICIOS.filter((id) => A.dentroDePlanta(id, lx, lz, 0.2));
    eq(dentro, q.donde.piso ? [q.donde.piso] : (dentro.includes('estacion-aldea') ? ['estacion-aldea'] : []), `${q.id}: ${q.donde.piso ? 'adentro de su edificio' : 'afuera'}`);
    ok(!A.CALLES_ALDEA.some((c) => A.distanciaACalle(lx, lz, c) < 0.2), `${q.id}: fuera de la calle`);
  }
  // el del refugio, fuera del refugio (lo despejado por el refugio llega a 9,5 m)
  const dl = D.find((d) => d.id === 'duende-lenera');
  ok(Math.hypot(dl.x - T.lugares.refugio.x, dl.z - T.lugares.refugio.z) > 9.5, 'el de la leñera, fuera del refugio');
  // en el cuaderno, con su pista y su texto
  const ids = new Set(ENTRADAS.map((e) => e.id));
  for (const e of RC.ENTRADAS_RINCONES) ok(ids.has(e.id) && e.pista && e.texto && e.nombre, `cuaderno: ${e.id}`);
  eq(ids.size, ENTRADAS.length, 'el cuaderno sin ids repetidos');
  // el registro
  const r = R.rinconesNuevos();
  ok(R.duendesEncontrados(r) === 0 && !R.encontrado(r, 'duende-muelle'), 'al principio, ninguno');
  ok(R.textoDuende(r, 'duende-muelle') === 'Anotar el duende del muelle', 'el aviso: anotarlo');
  const a = R.encontrarDuende(r, 'duende-muelle', 3);
  ok(a.ok && a.nuevo && a.cuantos === 1 && !a.todos, 'uno');
  ok(R.encontrarDuende(r, 'duende-muelle', 4).nuevo === false, 'el mismo no cuenta dos veces');
  ok(R.textoDuende(r, 'duende-muelle').includes('ya lo anotaste'), 'el aviso: ya anotado');
  ok(!R.encontrarDuende(r, 'duende-x', 3).ok, 'uno que no existe, no');
  ok(R.pistaDuende(r) === RC.DUENDES[0].pista, 'la pista de la abuela: el primero que falta');
  let ultimo = null;
  for (const id of RC.IDS_DUENDES) ultimo = R.encontrarDuende(r, id, 10);
  ok(ultimo.todos && ultimo.talla === 10 + R.RINCONES.tallaDias && r.talla === 12, 'con los doce, Tito te talla (en dos días)');
  ok(!R.tallaEnLaPlaza(r, 11, 12) && !R.tallaEnLaPlaza(r, 12, 7) && R.tallaEnLaPlaza(r, 12, 8) && R.tallaEnLaPlaza(r, 13, 1), 'la talla aparece el día 12 a las 8');
  ok(R.pistaDuende(r) === null, 'sin pistas: están todos');
}

// ============================================================ 3. el taller del refugio
{
  const Mn = R.MANUALIDADES;
  eq(Object.keys(Mn).length, 8, 'ocho manualidades');
  eq(new Set(Object.values(Mn).map((m) => m.maestro)).size, 8, 'un maestro distinto para cada una');
  for (const [id, m] of Object.entries(Mn)) {
    ok(esPersonaVecindad(m.maestro), `${id}: la enseña alguien de la vecindad (${m.maestro})`);
    ok(m.titulo && m.pedir && m.ensena.length >= 2 && m.hecho, `${id}: con sus textos`);
    ok(m.da.length >= 1, `${id}: da algo`);
  }
  const r = R.rinconesNuevos();
  ok(R.puedeAprender(r, 'panadera', 'conocido') === null, 'de conocido no te enseña');
  ok(R.puedeAprender(r, 'panadera', 'amigo') === 'pan' && R.puedeAprender(r, 'herrero', 'compadre') === 'filo', 'de amigo o compadre, sí');
  ok(R.puedeAprender(r, 'ramon', 'compadre') === null, 'el que no tiene manualidad, no');
  ok(!R.tallerArmado(r), 'sin taller al principio');
  const a = R.aprender(r, 'pan', 5);
  ok(a.ok && a.primera && R.tallerArmado(r) && a.renglones.length >= 2, 'la primera: se arma el taller');
  ok(!R.aprender(r, 'pan', 6).ok && R.puedeAprender(r, 'panadera', 'amigo') === null, 'lo aprendido, una vez');
  R.aprender(r, 'jarro', 5);
  const inv = { 'cosa:harina': 2 };
  const tengo = (tipo, k) => inv[`${tipo}:${k}`] || 0;
  let hoy = R.manualidadesDeHoy(r, tengo, 6);
  ok(hoy.length === 2 && hoy.every((m) => m.puede), 'las dos se pueden');
  const h = R.hacerManualidad(r, 'pan', tengo, 6);
  eq(h.efectos, [{ tipo: 'cosa', k: 'harina', n: -1 }, { tipo: 'entrada', k: 'pan-casero', n: 2 }], 'el pan: una medida de harina, dos panes');
  ok(!R.hacerManualidad(r, 'pan', tengo, 6).ok, 'una vez por día');
  ok(R.hacerManualidad(r, 'pan', tengo, 7).ok, 'al otro día, otra vez');
  ok(!R.hacerManualidad(r, 'pan', () => 0, 8).ok && R.hacerManualidad(r, 'pan', () => 0, 8).motivo === 'falta', 'sin harina, no');
  ok(!R.hacerManualidad(r, 'poncho', tengo, 8).ok, 'lo que no aprendiste, no');
  R.hacerManualidad(r, 'jarro', tengo, 6); R.hacerManualidad(r, 'jarro', tengo, 7);
  eq(R.adornosDelEstante(r), ['jarro', 'jarro'], 'los jarros, al estante');
  hoy = R.manualidadesDeHoy(r, tengo, 7);
  ok(hoy.every((m) => m.hecha), 'hoy ya hiciste todo');
  ok(Mn.filo.da[0].tipo === 'filo' && Mn.tablas.da[0].k === 'tabla', 'el filo del hacha y las tablas');
}

// ============================================================ 4. huertas, títeres, fuerte y campamento
{
  const r = R.rinconesNuevos();
  ok(R.estadoCantero(r, 'huerta', 0, 1).estado === 'vacio' && R.textoCanteroRincon(r, 'huerta', 0, 1).startsWith('Sembrar papas'), 'el cantero vacío: sembrar');
  let t = R.trabajarCantero(r, 'huerta', 0, 1);
  ok(t.ok && t.que === 'sembrar' && r.huerta.c0.cultivo === 'papas', 'sembrado');
  ok(!R.trabajarCantero(r, 'huerta', 0, 1).ok, 'el mismo día, ya trabajado');
  t = R.trabajarCantero(r, 'huerta', 0, 2);
  ok(t.ok && t.que === 'trabajar' && r.huerta.c0.lluvia === 1, 'carpir y regar: un día más, como la lluvia');
  const listo = 1 + CULTIVOS.papas.dias - 1;
  ok(R.estadoCantero(r, 'huerta', 0, listo).estado === 'listo', 'con el trabajo, lista un día antes');
  t = R.trabajarCantero(r, 'huerta', 0, listo);
  ok(t.ok && t.que === 'cosechar' && t.da[0].k === 'papa' && t.da[0].n === Math.round(CULTIVOS.papas.cosecha * 0.5) && !r.huerta.c0, 'la cosecha: la mitad para vos');
  ok(R.sembrarVecinos(r, 9) === 1 && Object.keys(r.huerta).length === 1 && R.sembrarVecinos(r, 9) === 1, 'los vecinos siembran de a un cantero');
  // la de los chicos
  R.trabajarCantero(r, 'chicos', 0, 1);
  const lista = 1 + CULTIVOS.frutillas.dias;
  t = R.trabajarCantero(r, 'chicos', 0, lista);
  ok(t.ok && t.que === 'cosechar' && t.da[0].k === 'frutilla' && t.da[0].n >= 1, 'los chicos cosechan y te convidan');
  ok(!R.trabajarCantero(r, 'chicos', 2, 1).ok, 'la de los chicos tiene dos canteros');
  ok(R.horaDeHuerta('chicos', 14) && !R.horaDeHuerta('chicos', 10) && R.horaDeHuerta('huerta', 10), 'los chicos, después de la escuela');
  // los títeres
  ok(!R.darFuncion(r, 3, 11).ok, 'a la mañana, no');
  const f = R.darFuncion(r, 3, 17);
  ok(f.ok && f.obra.renglones.length >= 3 && R.funcionHoy(r, 3), 'una función a la tardecita');
  ok(!R.darFuncion(r, 3, 18).ok && R.darFuncion(r, 4, 17).obra.titulo !== f.obra.titulo, 'una por día, y otra obra');
  // el fuerte
  const inv = { 'material:tronco': 10 };
  const tengo = (tipo, k) => inv[`${tipo}:${k}`] || 0;
  ok(R.textoFuerte(r, 1, 10, tengo).startsWith('Empezar el fuerte'), 'el aviso del fuerte');
  ok(R.textoFuerte(r, 1, 22, tengo) === null, 'de noche, nada');
  let e = R.trabajarFuerte(r, 1, 10, tengo);
  ok(e.ok && e.etapa === 1 && e.efectos[0].n === -3, 'la primera etapa: tres troncos');
  ok(!R.trabajarFuerte(r, 1, 11, tengo).ok, 'una etapa por día');
  R.trabajarFuerte(r, 2, 10, tengo); e = R.trabajarFuerte(r, 3, 10, tengo);
  ok(e.terminado && R.fuerteTerminado(r) && R.textoFuerte(r, 4, 10, tengo) === null, 'tres etapas y está');
  ok(!R.trabajarFuerte(r, 5, 10, () => 0).ok, 'terminado, nada más');
  // el campamento: sólo con hijos ya chicos
  ok(!R.puedeAcampar(r, [], 5, 20), 'sin hijos, no');
  ok(!R.puedeAcampar(r, [{ nombre: 'Juan', etapa: 'bebe' }], 5, 20), 'con un bebé, no');
  ok(!R.puedeAcampar(r, [{ nombre: 'Juan', etapa: 'chico' }], 5, 12), 'de día, no');
  const c = R.acampar(r, [{ nombre: 'Juan', etapa: 'chico' }, { nombre: 'Ana', etapa: 'adolescente' }], 5, 20);
  ok(c.ok && c.texto === 'Acampaste con Juan y Ana' && !R.puedeAcampar(r, [{ nombre: 'Juan', etapa: 'chico' }], 5, 21), 'una noche de campamento');
  // el potrero
  ok(R.anotarGol(r, 3) === 1 && r.futbol.goles === 1 && R.anotarGol(r, 3, false) === 1 && r.futbol.encontra === 1, 'los goles');
  eq(R.elegirJugadores(['padre', 'nena', 'abuela', 'nene']), ['nene', 'nena', 'padre'], 'juegan los chicos primero, y la abuela no');
}

// ============================================================ 5. el fútbol
{
  const piso = () => 0;
  const L2 = F.CANCHA.largo / 2;
  // un tiro del punto penal al medio del arco 1: gol
  const p = F.pelotaNueva(0, L2 - 6);
  F.patear(p, { u: 0, v: 1 }, F.PATADA.fuerte, 0.05);
  let gol = null;
  for (let i = 0; i < 300 && gol === null; i++) gol = F.pasoPelota(p, 1 / 60, piso).gol;
  ok(gol === 1, 'el tiro al medio entra en el arco 1');
  ok(!p.enJuego, 'después del gol, se saca del medio');
  F.saqueDespues(p, 'gol');
  ok(p.u === 0 && p.v === 0 && p.enJuego && p.quieta, 'el saque del medio');
  // rodando, se frena sola
  F.patear(p, { u: 1, v: 0.2 }, 3, 0);
  for (let i = 0; i < 600; i++) F.pasoPelota(p, 1 / 60, piso);
  ok(p.quieta && Math.abs(p.u) < F.CANCHA.ancho / 2, 'una patada suave: rueda y se para');
  // al palo
  const q = F.pelotaNueva(F.CANCHA.arco.ancho / 2, L2 - 3);
  F.patear(q, { u: 0, v: 1 }, 9, 0);
  let palo = false, entro = null;
  for (let i = 0; i < 200; i++) { const s = F.pasoPelota(q, 1 / 60, piso); palo = palo || s.palo; if (s.gol !== null) entro = s.gol; }
  ok(palo && entro === null, 'al palo: rebota y no es gol');
  // por arriba del travesaño
  const t = F.pelotaNueva(0, L2 - 4);
  F.patear(t, { u: 0, v: 1 }, 12, 0.9);
  let g2 = null, fuera = null;
  for (let i = 0; i < 300; i++) { const s = F.pasoPelota(t, 1 / 60, piso); if (s.gol !== null) g2 = s.gol; if (s.afuera) fuera = s.afuera; }
  ok(g2 === null && fuera === 'fondo', 'por arriba del travesaño: afuera, sin gol');
  // la pendiente la lleva
  const baja = F.pelotaNueva(0, 0), sube = F.pelotaNueva(0, 0);
  F.patear(baja, { u: 1, v: 0 }, 3); F.patear(sube, { u: -1, v: 0 }, 3);
  for (let i = 0; i < 400; i++) { F.pasoPelota(baja, 1 / 60, (u) => -u * 0.15); F.pasoPelota(sube, 1 / 60, (u) => -u * 0.15); }
  ok(baja.u > -sube.u + 0.3, 'en la pendiente, para abajo llega más lejos (' + baja.u.toFixed(2) + ' contra ' + (-sube.u).toFixed(2) + ')');
  const quieta = F.pelotaNueva(0, 0);
  for (let i = 0; i < 120; i++) F.pasoPelota(quieta, 1 / 60, (u) => -u * 0.15);
  ok(quieta.u === 0, 'quieta en una pendiente suave, se queda (el pasto la frena)');
  // los que juegan: corren a la pelota y la patean hacia el arco de enfrente
  const j = { u: 0, v: -1, equipo: 0, rol: 'campo', chico: true };
  const bola = F.pelotaNueva(0, -0.6);
  const plan = F.pensarJugador(j, bola, () => 0.5);
  ok(plan.patear && plan.velocidad === F.CORRER.chico, 'al lado de la pelota, patea');
  const k = F.patadaDe(j, bola, () => 0.5);
  ok(k.dir.v > 0, 'patea hacia el arco de enfrente');
  const arq = F.pensarJugador({ u: 0, v: L2 - 1, equipo: 1, rol: 'arquero' }, F.pelotaNueva(4, 0), () => 0.5);
  ok(Math.abs(arq.v - L2) < 1.5 && !arq.patear, 'el arquero se queda en su arco');
  ok(!F.patear(F.pelotaNueva(), { u: 0, v: 0 }, 5), 'sin dirección no se patea');
}

// ============================================================ 6. el camino y el sulky (terreno real)
{
  const ref = T.lugares.refugio;
  // (la puerta del refugio la pone estructuras.js; acá, unos metros al frente)
  const desde = { x: ref.x + 9, z: ref.z - 12 }, hasta = M.aMundo(37, 12);
  const evitar = [{ x: ref.x, z: ref.z, radio: 11 }];
  for (const e of Object.values(A.EDIFICIOS_ALDEA)) { const w = M.aMundo(e.x, e.z); evitar.push({ x: w.x, z: w.z, radio: Math.hypot(e.ancho, e.fondo) / 2 + 1.5 }); }
  const t0 = performance.now();
  const pts = S.trazarCamino(T, desde, hasta, { evitar, bosque: (x, z) => T.bosque[T.indice(x, z)] });
  const ms = performance.now() - t0;
  ok(Array.isArray(pts) && pts.length > 50, `hay camino (${pts?.length} puntos, ${ms.toFixed(0)} ms)`);
  ok(ms < 400, 'se traza rápido (en la carga)');
  const Rc = S.recorrido(pts);
  ok(Rc.largo > 560 && Rc.largo < 1100, `el largo es razonable (${Rc.largo.toFixed(0)} m)`);
  ok(Math.hypot(pts[0].x - desde.x, pts[0].z - desde.z) < 0.01 && Math.hypot(pts.at(-1).x - hasta.x, pts.at(-1).z - hasta.z) < 0.01, 'empieza y termina donde se pidió');
  let pend = 0, adentro = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    ok(Math.hypot(b.x - a.x, b.z - a.z) <= S.CAMINO.muestra + 0.01, 'puntos cada 3 m');
    if (!T.agua(a.x, a.z) && !T.agua(b.x, b.z)) pend = Math.max(pend, Math.abs(T.altura(b.x, b.z) - T.altura(a.x, a.z)) / Math.hypot(b.x - a.x, b.z - a.z));
    for (const e of evitar) if (Math.hypot(b.x - e.x, b.z - e.z) < e.radio - 3) adentro++;
  }
  ok(pend < 0.6, `sin cuestas imposibles (${pend.toFixed(2)})`);
  ok(adentro === 0, 'no atraviesa el refugio ni las casas de la aldea');
  const puentes = S.puentesDelCamino(Rc, T);
  ok(puentes.length >= 1 && puentes.every((b) => b.largo < 40 && Number.isFinite(b.alto)), `cruza el arroyo por un puentecito (${puentes.map((b) => b.largo.toFixed(1)).join(', ')} m)`);
  const far = S.farolesDelCamino(Rc);
  ok(far.length >= 12 && far.length <= 40, `los faroles (${far.length})`);
  for (let s = 0; s < Rc.largo; s += 37) { const p = S.enCamino(Rc, s); const c = S.masCercano(Rc, p.x, p.z); ok(c.d < 0.05 && Math.abs(c.s - s) < 0.5, 'enCamino y masCercano se entienden'); }
  // el sulky: pedirlo, andar de punta a punta, la minga
  const sk = S.sulkyNuevo();
  ok(!S.pedirSulky(sk, () => 99, 3, false).ok, 'sin caballo, no');
  ok(S.pedirSulky(sk, () => 0, 3, true).motivo === 'falta', 'sin material, no');
  const pe = S.pedirSulky(sk, () => 99, 3, true);
  ok(pe.ok && sk.listo === 4 && !S.tieneSulky(sk, 3, 20) && !S.tieneSulky(sk, 4, 6) && S.tieneSulky(sk, 4, 7), 'Tito lo trae a la mañana siguiente');
  eq(pe.efectos, [{ tipo: 'material', k: 'tabla', n: -10 }, { tipo: 'material', k: 'tronco', n: -4 }], 'diez tablas y cuatro troncos');
  const est = { s: 0, v: 0, sentido: 1 };
  let llego = false, tiempo = 0;
  for (; tiempo < 600 && !llego; tiempo += 0.1) llego = S.andarSulky(est, 0.1, S.velocidadSulky('trote'), Rc.largo).llego;
  ok(llego && est.v === 0, `al trote llega a la aldea (${tiempo.toFixed(0)} s)`);
  const vuelta = { s: Rc.largo, v: 0, sentido: -1 };
  let t2 = 0, llego2 = false;
  for (; t2 < 600 && !llego2; t2 += 0.1) llego2 = S.andarSulky(vuelta, 0.1, S.velocidadSulky('galope', true), Rc.largo).llego;
  ok(llego2 && t2 < tiempo, 'al galope y con la minga, la vuelta es más corta');
  const cam = S.caminoNuevo();
  ok(!S.caminoArreglado(cam) && S.hacerMinga(cam, 9).nueva && S.caminoArreglado(cam) && !S.hacerMinga(cam, 10).nueva && cam.minga === 9, 'la minga, una vez');
  ok(S.velocidadSulky('trote', true) > S.velocidadSulky('trote'), 'con el camino arreglado, más rápido');
  eq(S.sanearSulky({ pedido: 3, listo: 1, donde: 'camino', s: 120, atado: true }, 10), { pedido: 3, listo: 4, donde: 'camino', s: 120, atado: true }, 'el sulky saneado (listo, al día siguiente del pedido)');
  eq(S.sanearSulky({ donde: 'luna', pedido: 'x' }), S.sulkyNuevo(), 'basura: sin sulky');
}

// ============================================================ 7. tu casa en la calle de la Loma
{
  const L = C.CASA_PROPIA.lote;
  ok(A.CALLES_ALDEA.find((c) => c.id === 'calle-loma') && A.distanciaACalle(L.lx, L.lz, A.CALLES_ALDEA.find((c) => c.id === 'calle-loma')) < 8, 'el lote da a la calle de la Loma');
  // la planta (6 × 5 con margen) no pisa ningún edificio ni calle
  let malos = 0;
  for (let u = -C.CASA_PROPIA.ancho / 2 - 0.5; u <= C.CASA_PROPIA.ancho / 2 + 0.5; u += 0.5) for (let v = -C.CASA_PROPIA.fondo / 2 - 0.5; v <= C.CASA_PROPIA.fondo / 2 + 0.5; v += 0.5) {
    const c = Math.cos(L.rot), s = Math.sin(L.rot), lx = L.lx + u * c + v * s, lz = L.lz - u * s + v * c;
    if (A.IDS_EDIFICIOS.some((id) => A.dentroDePlanta(id, lx, lz, 1.5)) || A.CALLES_ALDEA.some((k) => A.distanciaACalle(lx, lz, k) < 0)) malos++;
  }
  ok(malos === 0, 'la planta de tu casa, libre');
  const W = C.loteEnMundo();
  ok(C.adentroDeCasa(W.x, W.z) && !C.adentroDeCasa(W.x + 6, W.z + 6), 'adentro y afuera');
  const c = C.casaNueva();
  ok(C.textoCasa(c, 1, 12, 0).startsWith('Lote libre') && C.textoCasa(c, 1, 12, 2) === 'Pedir este lote para tu casa', 'el aviso del lote');
  ok(!C.pedirLote(c, 1, 3).ok && C.pedirLote(c, 1, 3).motivo === 'amigos', 'con un amigo solo, no');
  ok(C.pedirLote(c, 2, 3).ok && c.estado === 'obra' && C.etapaCasa(c, 3) === 1, 'con dos, el lote es tuyo y empieza la obra');
  let inv = { tabla: 8, tronco: 12, piedra: 0 };
  let a = C.aportarCasa(c, (k) => inv[k], 4);
  ok(a.ok && !a.completa && c.aportes.tabla === 8 && c.aportes.tronco === 12 && a.efectos.length === 2, 'lo que tengas, de a poco');
  ok(C.textoCasa(c, 4, 12, 2) === 'Traer material para tu casa (faltan 12 tablas, 16 piedras)', 'el aviso dice lo que falta');
  ok(C.etapaCasa(c, 4) >= 2, 'la obra avanza con lo que traés');
  inv = { tabla: 50, tronco: 50, piedra: 50 };
  a = C.aportarCasa(c, (k) => inv[k], 5);
  ok(a.completa && c.estado === 'lista' && c.lista === 6 && a.efectos.every((e) => e.n < 0), 'completo: mañana está');
  eq(a.puso, { tabla: 12, piedra: 16 }, 'sólo lo que faltaba');
  ok(!C.casaTerminada(c, 5, 22) && !C.casaTerminada(c, 6, 6) && C.casaTerminada(c, 6, 7) && C.etapaCasa(c, 6, 8) === 4, 'terminada a las 7 del día siguiente');
  ok(C.textoCasa(c, 6, 9, 2) === null, 'terminada, el lote no dice nada');
  eq(C.sanearCasa({ estado: 'lista', aportes: { tabla: 999 }, desde: 4 }, 10).aportes.tabla, 20, 'los aportes, con tope');
  eq(C.sanearCasa({ estado: 'castillo' }), C.casaNueva(), 'un estado que no existe: libre');
  ok(C.CASA_PROPIA.modelo === 'casa-nelida' && A.EDIFICIOS_ALDEA['casa-nelida'].ancho === C.CASA_PROPIA.ancho && A.EDIFICIOS_ALDEA.costureria.ancho === C.CASA_PROPIA.ancho && A.EDIFICIOS_ALDEA.costureria.fondo === C.CASA_PROPIA.fondo, 'los edificios que se usan tienen el tamaño de tu lote');
}

// ============================================================ 8. el guardado
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const GU = await import('../src/guardado.js?v375rincones=' + Date.now());
  const nueva = GU.progresoNuevo();
  eq(nueva.rincones, R.rinconesNuevos(), 'partida nueva del Relax: los rincones de cero');
  const vieja = GU.progresoNuevo(); delete vieja.rincones; vieja.dia = 40;
  datos.set('hojarasca-v1', JSON.stringify(vieja));
  eq(GU.cargarProgreso().rincones, R.rinconesNuevos(), 'una partida vieja arranca de cero');
  const rota = GU.progresoNuevo(); rota.dia = 20;
  rota.rincones = { duendes: { 'duende-muelle': 99, 'duende-x': 3, 'duende-anden': -2 }, talla: 50, cuaderno: 1e9, lecturas: -5, oficios: { pan: 4, magia: 2 }, hechos: { pan: { n: -3, ultimo: 30 }, poncho: { n: 2 } },
    huerta: { c0: { cultivo: 'papas', dia: 50 }, c1: { cultivo: 'tomates', dia: 3 }, c9: { cultivo: 'papas', dia: 1 } }, chicos: { c0: { cultivo: 'calafates', dia: 3 } },
    futbol: { goles: 'tres' }, titeres: null, fuerte: { etapa: 9, dia: 99 }, campamento: [], casa: { estado: 'obra', aportes: { tabla: -4, piedra: 1e9 } }, sulky: { pedido: 2, listo: 99, donde: 'aldea' }, camino: { minga: 1e9 } };
  datos.set('hojarasca-v1', JSON.stringify(rota));
  const s = GU.cargarProgreso().rincones;
  eq(s.duendes, { 'duende-muelle': 20 }, 'los duendes: los que existen, con fechas posibles');
  ok(s.talla === 0, 'la talla sin los doce, no');
  ok(s.cuaderno === 20 && s.lecturas === 0, 'el cuaderno, a lo sumo hoy');
  eq(s.oficios, { pan: 4 }, 'los oficios que existen');
  eq(s.hechos, { pan: { n: 0, ultimo: 20 } }, 'lo hecho, de lo aprendido');
  eq(Object.keys(s.huerta), ['c0'], 'la huerta: los canteros y cultivos que van');
  ok(s.huerta.c0.dia === 20 && Object.keys(s.chicos).length === 0, 'fechas posibles; en el cantero de Lucía no van calafates');
  ok(s.futbol.goles === 0 && s.fuerte.etapa === 3 && s.fuerte.dia === 20, 'los números, acotados');
  ok(s.casa.estado === 'obra' && s.casa.aportes.tabla === 0 && s.casa.aportes.piedra === 16, 'la casa, saneada');
  ok(s.sulky.listo === 20 && s.sulky.donde === 'aldea' && s.camino.minga === 20, 'el sulky y la minga, a lo sumo hoy');
  // el caos
  let rng = 7;
  const azar = () => ((rng = (rng * 1103515245 + 12345) >>> 0) / 4294967296);
  const valor = (d = 0) => { const r = azar(); if (d > 2 || r < 0.3) return [null, -1, 0, 1e9, NaN, 'x', true, 'duende-muelle', 'papas'][Math.floor(azar() * 9)]; if (r < 0.65) { const o = {}; for (const k of ['duendes', 'talla', 'c0', 'c1', 'cultivo', 'dia', 'n', 'ultimo', 'pan', 'estado', 'aportes', 'tabla', 'pedido', 'listo', 'donde', 's', 'minga', 'etapa', 'duende-muelle', 'oficios']) if (azar() < 0.35) o[k] = valor(d + 1); return o; } return Array.from({ length: Math.floor(azar() * 4) }, () => valor(d + 1)); };
  let bien = 0;
  for (let i = 0; i < 400; i++) {
    const v = valor(); const x = R.sanearRincones(v, 1 + Math.floor(azar() * 50));
    const y = R.sanearRincones(JSON.parse(JSON.stringify(x)), 60);
    if (JSON.stringify(y) === JSON.stringify(x) && R.duendesEncontrados(x) >= 0 && Number.isFinite(x.fuerte.etapa)) bien++;
  }
  eq(bien, 400, 'el caos: nunca se rompe y lo saneado queda igual');
  // el Desafío no tiene rincones
  const g = leer('src/guardado.js');
  ok(g.includes("rincones: modoPartida === 'desafio' ? undefined : sanearRincones(p.rincones,") && g.includes('...(desafio ? {} : { rincones: rinconesNuevos() }),'), 'en el Desafío, sin rincones');
}

// ============================================================ 9. el enganche
{
  const main = leer('src/main.js'), jug = leer('src/jugador.js'), vec = leer('src/vecindad-juego.js');
  // la E: lo urgente (bajar del sulky, patear) antes de hablar; lo demás después de la carrera
  const tecla = main.slice(main.indexOf("case 'KeyE': {"), main.indexOf("case 'KeyE': {") + 9000);
  const iu = tecla.indexOf('rinconesJuego.urgente(js)'), iv = tecla.indexOf('if (vecino) { hablar(vecino); break; }'), ic = tecla.indexOf('modos?.accion(jugador.estado)'), ia = tecla.indexOf('rinconesJuego.accion(js)'), im = tecla.indexOf('cercaDelMostrador()) { abrirAlmacen(); break; }');
  ok(iu > 0 && iu < iv, 'E: lo urgente de los rincones, antes de hablar');
  ok(ic > 0 && ia > ic && ia < im, 'E: los rincones, después de la carrera y antes del almacén');
  // el aviso, en el mismo orden
  const aviso = main.slice(main.indexOf('let aviso = objetivo ?'), main.indexOf('mostrarAviso(aviso);'));
  const au = aviso.indexOf('rinconesJuego.urgente(js)'), ac = aviso.indexOf('avisoCarrera.texto'), aa = aviso.indexOf('cacheRincones.texto'), am = aviso.indexOf("'Ver qué hay en el almacén'");
  ok(au > 0 && aa > au && aa > ac && aa < am, 'el aviso: lo urgente pisa a hablar; lo demás, después de la carrera y antes del almacén');
  ok(main.includes('cacheRincones = rinconesJuego ? rinconesJuego.accion(js) : null;'), 'el aviso usa la misma función');
  ok(main.includes('if (js.enKayak || js.enSulky) vecino = null;') && main.includes('js.enTren || js.enSulky || js.montado || vecino) objetivo = null;'), 'arriba del sulky no se habla ni se junta');
  ok(main.includes("try { if (modo === 'jugando' && !desafio) rinconesJuego?.actualizar(dt); } catch (e) { fallaSistema('rincones', e); }"), 'cada cuadro, aislado');
  ok(main.includes('rinconesMundo?.paraCompilar();') && main.includes('rinconesMundo?.trasCompilar();'), 'se compila en la carga');
  ok(main.includes('alSulky: (dt, tecla) => rinconesJuego?.alSulky(dt, tecla),'), 'el jugador en el sulky');
  ok(main.includes('const atado = !js.montado ? rinconesJuego?.caballoAtado?.() : null;') && main.includes('rinconesJuego?.desatar?.();'), 'el zaino atado al sulky, y desatado para montarlo');
  ok(main.includes('.concat(rinconesJuego?.canterosParaMatas?.() || [])'), 'las matas de las huertas de la aldea, en la malla de siempre');
  ok(main.includes('    rincones: rinconesJuego,'), 'en la charla de los vecinos');
  ok(jug.includes('if (estado.enSulky) {') && jug.includes('opciones.alSulky?.(dt, teclaKayak);') && jug.includes('enSulky: false,'), 'jugador.js: arriba del sulky lo lleva el sulky');
  ok(vec.includes("for (const o of ctx.rincones?.opciones?.(s.clave) || []) lista.push(o);") && vec.includes("if (/^rincones:/.test(String(id)) && ctx.rincones) {"), 'vecindad-juego.js: lo que te enseñan y el sulky');
  ok(leer('src/aldea-mundo.js').includes('materiales: () => materiales,'), 'aldea-mundo.js presta sus materiales para tu casa');
}

// ============================================================ 10. nada religioso, en castellano
{
  const textos = JSON.stringify([RC.DUENDES, RC.ENTRADAS_RINCONES, R.MANUALIDADES, R.OBRAS_TITERES]) + leer('src/rincones-juego.js');
  ok(!RELIGIOSO.test(textos), 'nada religioso');
  for (const e of RC.ENTRADAS_RINCONES) ok(!/(?<!\p{L})(the|and|with|you)(?!\p{L})/iu.test(e.texto + e.pista + e.nombre), `${e.id}: en castellano`);
}

console.log(`verificar-3-7-5-rincones: ${n} pruebas OK`);
