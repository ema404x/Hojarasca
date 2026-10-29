// 4.13.0 (agente B): la noche de la Historia, en el mundo. Pone las estacas y el portón con sus antorchas,
// hace salir a los duendes por el lado de ataque, deja apuntar y tirar con el arco y la honda prestados (con
// el mouse) y dibuja lo que pasa. Las reglas (oleadas, daño, ganar y perder) están en `historia-noche.js`
// y se prueban en Node; acá sólo hay lo visible.
//
// Qué se reusa del Desafío: los duendes (`crearDuende`: el modelo, los huesos y la animación, dibujados
// instanciados), los halos de los ojos y de las antorchas, el banco de sonidos y los números del arco y la
// honda. Qué NO: la clausura `crearDesafio`, `progreso.desafio`, las noches, los giros, los jefes.
//
// Rendimiento (la plaza anda justa, ~15 ms de 16,7): tope de duendes en pie (10), cada tipo se dibuja en
// una sola llamada (instanciado), las estacas, el portón y las antorchas son UNA malla fundida, los
// proyectiles son un puñado de mallas chicas que sólo se ven mientras vuelan, y nada se compila a mitad de
// juego: los materiales se arman en la carga (`paraCompilar`) o bajo la tarjeta que lo anuncia (`preparar`).
import * as THREE from 'three';
import { crearNoche, elegirLado, NOCHE, ARMAS_NOCHE, crearPractica, blancosDe } from './historia-noche.js';
import { instalarDuendes, precalentarDuendes, crearDuende, registrarHalos, soltarHalos } from './desafio-duendes.js';
import { crearBanco } from './desafio-sonidos.js';
import { matBrilloFijo } from './duendes-modelo.js';
import { crearSonidoCampana } from './desafio-campana-sonido.js';

const DUENIO_NOCHE = 'historia-noche';   // (el dueño de las colisiones: se retiran todas juntas)
const TIPOS = { rastreador: 8, saltador: 4, tirador: 3, bruto: 1, excavador: 3, curandero: 1, jefe: 1 };   // cuántos se arman de antemano de cada uno (si hacen falta más, se arman al vuelo)
const COL_MIEL = [0.78, 0.55, 0.16], COL_BRONCE = [0.62, 0.5, 0.22], COL_DURMIENTE = [0.3, 0.24, 0.17];
const COL_PALO = [0.36, 0.27, 0.18], COL_PALO2 = [0.43, 0.33, 0.22], COL_SOGA = [0.55, 0.45, 0.3], COL_LLAMA = [1.0, 0.62, 0.2], COL_BRASA = [1.0, 0.82, 0.4];

// ---------------------------------------------------------------- una malla fundida de piezas con color
function fundir(piezas) {
  let nv = 0, ni = 0;
  for (const p of piezas) { nv += p.geo.attributes.position.count; ni += p.geo.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
  const idx = new Uint16Array(ni);
  let ov = 0, oi = 0;
  const m = new THREE.Matrix4(), mn = new THREE.Matrix3(), v = new THREE.Vector3();
  for (const p of piezas) {
    const P = p.geo.attributes.position, N = p.geo.attributes.normal;
    m.copy(p.m); mn.getNormalMatrix(m);
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(m);
      pos[(ov + i) * 3] = v.x; pos[(ov + i) * 3 + 1] = v.y; pos[(ov + i) * 3 + 2] = v.z;
      v.fromBufferAttribute(N, i).applyMatrix3(mn).normalize();
      nor[(ov + i) * 3] = v.x; nor[(ov + i) * 3 + 1] = v.y; nor[(ov + i) * 3 + 2] = v.z;
      const k = 0.9 + p.sombra * 0 + ((i * 7919) % 13) / 13 * 0.2;   // un poco de variación por vértice
      col[(ov + i) * 3] = Math.min(1, p.color[0] * k); col[(ov + i) * 3 + 1] = Math.min(1, p.color[1] * k); col[(ov + i) * 3 + 2] = Math.min(1, p.color[2] * k);
    }
    for (let i = 0; i < p.geo.index.count; i++) idx[oi + i] = p.geo.index.getX(i) + ov;
    ov += P.count; oi += p.geo.index.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}
const GEO_CAJA = new THREE.BoxGeometry(1, 1, 1);
const GEO_PALO = new THREE.CylinderGeometry(1, 1, 1, 6, 1);
const GEO_PUNTA = new THREE.CylinderGeometry(0.02, 1, 1, 6, 1);
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function pieza(geo, x, y, z, sx, sy, sz, ry, rx, rz, color) {
  _e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); _q.setFromEuler(_e);
  return { geo, m: new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)), color, sombra: 0 };
}

// ---------------------------------------------------------------- el sistema
export function crearNocheMundo(ctx) {
  const { T, escena, camara, col, sonido } = ctx;
  const jugador = () => ctx.jugador();
  const alt = (x, z) => T.altura(x, z);
  let S = null;           // el banco de sonidos del Desafío
  let campana = null;     // la campana vieja de Martín (el sonido de la aldea del Desafío)
  const lucecitas = [];   // 4.17.0: las lucecitas que avisan dónde va a salir un topo (con el trato): { m, t }
  let listo = false;      // los materiales y los duendes armados
  let activa = false, pausada = false;   // (4.17.0: `pausada`: una escena de la noche está en pantalla)
  let sim = null, dis = null;
  let opciones = null;
  let relaxAntes = false;
  // lo visible
  const grupo = new THREE.Group();
  grupo.name = 'historia-noche';
  grupo.visible = false;
  let mallaMadera = null, mallaLlamas = null, geoMadera = null, geoLlamas = null;
  let matMadera = null, matLlamas = null;
  const pozos = {};       // duendes libres por tipo
  const asignados = new Map();   // id de la simulación -> { m (duende), tipo }
  const proy = [];        // mallas de proyectiles (pool)
  let matFlecha = null, matPiedra = null, matBellota = null, geoFlecha = null, geoPiedra = null, geoBellota = null;
  let antorchas = [];     // { grupo, llama }
  let precompilar = null, raizDuendes = null;
  // el arma en la mano y el mouse
  const mano = { arma: 'arco', abajo: false, desde: 0, aviso: 0 };
  const pose = { dt: 0, jugador: null, velocidad: 0, golpe: 0, ataca: false, carrera: false, apuntando: false, enredado: false, agazapado: false, saltando: 0, noche: 1, reflejo: 0 };
  const _dir = new THREE.Vector3(), _org = new THREE.Vector3();
  const cuenta = { disparos: 0, aciertos: 0 };
  let flashHerido = 0;

  // ---- armar lo que se comparte (una vez)
  function construir() {
    if (listo) return;
    raizDuendes = instalarDuendes(escena);
    precalentarDuendes();
    S = crearBanco(sonido);
    campana = crearSonidoCampana(sonido);
    try { campana.preparar(); } catch { /* sin audio */ }
    matMadera = new THREE.MeshLambertMaterial({ vertexColors: true });
    matLlamas = matBrilloFijo();
    matFlecha = new THREE.MeshLambertMaterial({ color: '#6b5238' });
    matPiedra = new THREE.MeshLambertMaterial({ color: '#7d766c' });
    matBellota = new THREE.MeshBasicMaterial({ color: '#c99a52' });
    geoFlecha = new THREE.CylinderGeometry(0.02, 0.02, 0.85, 5).rotateX(Math.PI / 2);
    geoPiedra = new THREE.IcosahedronGeometry(0.07, 0);
    geoBellota = new THREE.IcosahedronGeometry(0.06, 0);
    for (const [tipo, n] of Object.entries(TIPOS)) {
      pozos[tipo] = [];
      for (let i = 0; i < n; i++) pozos[tipo].push(armarDuende(tipo));
    }
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(geoFlecha, matFlecha);
      m.visible = false; m.frustumCulled = false; escena.add(m);
      proy.push({ m, tipo: 'arco' });
    }
    escena.add(grupo);
    listo = true;
  }
  function armarDuende(tipo, viejo = false) {
    const m = crearDuende(tipo, { viejo });
    m.g.visible = false;
    m.g.position.set(0, -500, 0);
    escena.add(m.g);
    return m;
  }
  const claveP = (tipo, viejo) => (viejo ? `${tipo}:v` : tipo);
  function tomar(tipo, viejo = false) {
    const k = claveP(tipo, viejo);
    const lista = pozos[k] || (pozos[k] = []);
    const m = lista.pop() || armarDuende(tipo, viejo);
    m.reiniciar();
    m.g.visible = true;
    return m;
  }
  function soltar(tipo, m, viejo = false) {
    m.reiniciar();
    m.g.visible = false;
    m.g.position.set(0, -500, 0);
    (pozos[claveP(tipo, viejo)] || (pozos[claveP(tipo, viejo)] = [])).push(m);
  }
  // 4.17.0: los del cerro (el trato) son la variante Viejo: se arman la primera vez que hacen falta, al empezar la noche (los modelos ya los armó precalentarDuendes)
  function armarPozoViejo() {
    for (const [tipo, n] of Object.entries(TIPOS)) {
      const k = claveP(tipo, true);
      const lista = pozos[k] || (pozos[k] = []);
      while (lista.length < n) lista.push(armarDuende(tipo, true));
    }
  }

  // ---- para compilar en la carga (o bajo la tarjeta): los mismos materiales sobre piezas mínimas, bajo tierra
  function paraCompilar() {
    construir();
    if (precompilar) return;
    precompilar = new THREE.Group();
    precompilar.position.set(0, -600, 0);
    const chico = fundir([pieza(GEO_CAJA, 0, 0, 0, 0.1, 0.1, 0.1, 0, 0, 0, COL_PALO)]);
    const a = new THREE.Mesh(chico, matMadera), b = new THREE.Mesh(chico, matLlamas);
    const c = new THREE.Mesh(geoFlecha, matFlecha), d = new THREE.Mesh(geoPiedra, matPiedra), e = new THREE.Mesh(geoBellota, matBellota);
    for (const o of [a, b, c, d, e]) { o.frustumCulled = false; precompilar.add(o); }
    escena.add(precompilar);
  }
  function trasCompilar() {
    if (!precompilar) return;
    escena.remove(precompilar);
    precompilar.traverse((o) => { if (o.geometry && o.geometry !== geoFlecha && o.geometry !== geoPiedra && o.geometry !== geoBellota) o.geometry.dispose(); });
    precompilar = null;
  }
  // bajo la tarjeta: arma todo y compila lo que falte (un tirón que nadie ve)
  function preparar() {
    const nuevo = !listo;
    paraCompilar();
    // (sólo lo nuestro: los duendes instanciados y las piezas de la noche; no se compila de nuevo todo el valle)
    try { if (precompilar) ctx.compilar?.(precompilar); if (raizDuendes) ctx.compilar?.(raizDuendes); } catch (e) { console.warn('noche: compilar', e && e.message); }
    trasCompilar();
    return nuevo;
  }

  // ---- las estacas, el portón y las antorchas (una malla de madera y una de llamas)
  function armarEscenario() {
    desarmarEscenario();
    const piezas = [], llamas = [];
    const { porton, ux, uz, px, pz, mitad, tramos, centro } = dis;
        // las dos alas de estacas, con un travesaño de soga
    let azarK = 3;
    const az = () => { azarK = (azarK * 16807) % 2147483647; return azarK / 2147483647; };
    for (const { a, b } of tramos) {
      const largo = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(2, Math.round(largo / 0.5));
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, y = alt(x, z);
        const h = 1.45 + az() * 0.6;
        piezas.push(pieza(GEO_PALO, x, y + h / 2 - 0.1, z, 0.12 + az() * 0.03, h, 0.12, 0, (az() - 0.5) * 0.12, (az() - 0.5) * 0.12, az() < 0.5 ? COL_PALO : COL_PALO2));
        piezas.push(pieza(GEO_PUNTA, x, y + h - 0.1 + 0.16, z, 0.12, 0.34, 0.12, 0, 0, 0, COL_PALO2));
      }
      const ang = Math.atan2(b.x - a.x, b.z - a.z);
      for (const yy of [0.5, 1.05]) {
        const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
        piezas.push(pieza(GEO_CAJA, mx, alt(mx, mz) + yy, mz, 0.06, 0.06, largo, ang, 0, 0, COL_SOGA));
      }
    }
    // 4.17.0: las trampas de miel de Guido, la campana de Martín y la empalizada de durmientes de Elsa
    for (const m of dis.miel) piezas.push(pieza(GEO_PALO, m.x, alt(m.x, m.z) + 0.04, m.z, m.r * 0.8, 0.07, m.r * 0.8, 0, 0, 0, COL_MIEL));
    if (dis.defensas?.campana) {
      const cx = centro.x + ux * 2.0 - px * 2.6, cz = centro.z + uz * 2.0 - pz * 2.6, cy = alt(cx, cz);
      piezas.push(pieza(GEO_PALO, cx, cy + 1.3, cz, 0.07, 2.6, 0.07, 0, 0, 0, COL_PALO));
      piezas.push(pieza(GEO_CAJA, cx, cy + 2.55, cz, 0.7, 0.07, 0.07, 0, 0, 0, COL_PALO));
      piezas.push(pieza(GEO_PUNTA, cx, cy + 2.2, cz, 0.36, 0.5, 0.36, 0, Math.PI, 0, COL_BRONCE));
      dis.campanaPos = { x: cx, y: cy + 2.2, z: cz };
    }
    if (dis.empalizada) {
      const { a, b } = dis.empalizada, largo = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(2, Math.round(largo / 1.1)), ang = Math.atan2(b.x - a.x, b.z - a.z);
      for (let i = 0; i <= n; i++) {
        const k = i / n, x = a.x + (b.x - a.x) * k, z = a.z + (b.z - a.z) * k;
        piezas.push(pieza(GEO_CAJA, x, alt(x, z) + 0.7, z, 0.28, 1.4, 1.5, ang + Math.PI / 2, 0, (az() - 0.5) * 0.06, COL_DURMIENTE));
      }
    }
    // el portón: dos postes gruesos y un dintel
    for (const s of dis.defensas && !dis.defensas.estacas ? [] : [-1, 1]) {
      const x = porton.x + px * (mitad + 0.35) * s, z = porton.z + pz * (mitad + 0.35) * s, y = alt(x, z);
      piezas.push(pieza(GEO_PALO, x, y + 1.5, z, 0.24, 3.0, 0.24, 0, 0, 0, COL_PALO));
      piezas.push(pieza(GEO_PUNTA, x, y + 3.15, z, 0.24, 0.35, 0.24, 0, 0, 0, COL_PALO2));
      // y las antorchas, a un costado del poste
      const tx = x - ux * 0.5, tz = z - uz * 0.5, ty = alt(tx, tz);
      piezas.push(pieza(GEO_PALO, tx, ty + 0.95, tz, 0.05, 1.9, 0.05, 0, 0, 0, COL_PALO2));
      llamas.push(pieza(GEO_PUNTA, tx, ty + 2.08, tz, 0.14, 0.34, 0.14, 0, 0, 0, COL_LLAMA));
      llamas.push(pieza(GEO_CAJA, tx, ty + 2.02, tz, 0.07, 0.12, 0.07, 0, 0, 0, COL_BRASA));
    }
    if (!dis.defensas || dis.defensas.estacas) { const y0 = alt(porton.x, porton.z); piezas.push(pieza(GEO_CAJA, porton.x, y0 + 3.0, porton.z, 2 * (mitad + 0.35) + 0.5, 0.2, 0.2, Math.atan2(-ux, -uz), 0, 0, COL_PALO)); }
    // una antorcha más en la puerta del refugio
    { const tx = centro.x + ux * 2.4 + px * 1.2, tz = centro.z + uz * 2.4 + pz * 1.2, ty = alt(tx, tz);
      piezas.push(pieza(GEO_PALO, tx, ty + 0.95, tz, 0.05, 1.9, 0.05, 0, 0, 0, COL_PALO2));
      llamas.push(pieza(GEO_PUNTA, tx, ty + 2.08, tz, 0.14, 0.34, 0.14, 0, 0, 0, COL_LLAMA));
      llamas.push(pieza(GEO_CAJA, tx, ty + 2.02, tz, 0.07, 0.12, 0.07, 0, 0, 0, COL_BRASA)); }
    geoMadera = fundir(piezas); geoLlamas = fundir(llamas);
    mallaMadera = new THREE.Mesh(geoMadera, matMadera); mallaMadera.frustumCulled = false;
    mallaLlamas = new THREE.Mesh(geoLlamas, matLlamas); mallaLlamas.frustumCulled = false;
    grupo.add(mallaMadera, mallaLlamas);
    // los halos de las llamas (los dibuja el sistema de los duendes)
    const halos = [];
    for (const p of llamas) { if (p.geo === GEO_PUNTA) { const e = p.m.elements; halos.push({ p: new THREE.Vector3(e[12], e[13] + 0.1, e[14]), col: '#ffb050', tam: 2.2 }); } }
    grupo.userData.halos = halos;
    registrarHalos(grupo);
    // las colisiones: las dos alas (los duendes y vos no las atraviesan)
    for (const { a, b } of tramos) col.agregar({ duenio: DUENIO_NOCHE, seg: true, ax: a.x, az: a.z, bx: b.x, bz: b.z, r: 0.3 });
    if (!dis.defensas || dis.defensas.estacas) for (const s of [-1, 1]) col.agregar({ duenio: DUENIO_NOCHE, x: porton.x + px * (mitad + 0.35) * s, z: porton.z + pz * (mitad + 0.35) * s, r: 0.3 });
    if (dis.empalizada) col.agregar({ duenio: DUENIO_NOCHE, seg: true, ax: dis.empalizada.a.x, az: dis.empalizada.a.z, bx: dis.empalizada.b.x, bz: dis.empalizada.b.z, r: 0.5 });
    grupo.visible = true;
  }
  function desarmarEscenario() {
    soltarHalos(grupo);
    try { col.eliminarPorDuenio(DUENIO_NOCHE); } catch { /* sin colisiones */ }
    if (mallaMadera) { grupo.remove(mallaMadera); geoMadera.dispose(); mallaMadera = null; }
    if (mallaLlamas) { grupo.remove(mallaLlamas); geoLlamas.dispose(); mallaLlamas = null; }
    grupo.visible = false;
  }

  // ---- dónde: la puerta del refugio, y el lado más limpio para que vengan
  function centroDeLaNoche() {
    const r = ctx.T.lugares?.refugio;
    const p = r?.puerta || r;
    return { x: p?.x ?? 0, z: p?.z ?? 0 };
  }
  // 4.17.0: hacia dónde queda el arroyo desde el galpón (el primer rumbo, de 16, con agua a menos de 60 m): el lado de ataque
  function ladoDelArroyo(centro) {
    try {
      let mejor = null;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
        for (let r = 10; r <= 60; r += 4) {
          const x = centro.x + dx * r, z = centro.z + dz * r, k = ctx.T.indice(x, z);
          if (ctx.T.distRio[k] - ctx.T.anchoRio[k] <= 2.5) { if (!mejor || r < mejor.r) mejor = { dx, dz, r }; break; }
        }
      }
      return mejor ? { dx: mejor.dx, dz: mejor.dz } : null;
    } catch { return null; }
  }
  function libre(x, z) {
    if (alt(x, z) < 0.45) return false;                       // el agua
    const p = _p.set(x, alt(x, z), z);
    const x0 = p.x, z0 = p.z;
    try { col.resolver(p, 0.35, 1.0); } catch { return true; }
    return Math.hypot(p.x - x0, p.z - z0) < 0.05;             // un tronco, una pared
  }

  // ---- empezar y terminar
  function iniciar(op) {
    if (activa) return false;
    construir();
    opciones = op || {};
    const centro = opciones.centro || centroDeLaNoche();
    // 4.13.0: el lado que se prefiere es el que mira lejos del lago (el lago queda a la espalda del refugio)
    const lago = ctx.T.lugares?.muelle || null;
    // 4.17.0: el lado de ataque es el del arroyo (si se lo encuentra cerca); si no, el que mira lejos del lago
    const arroyo = opciones.prefiere || ladoDelArroyo(centro);
    const prefiere = arroyo || (lago ? (() => { const dx = centro.x - lago.x, dz = centro.z - lago.z, l = Math.hypot(dx, dz) || 1; return { dx: dx / l, dz: dz / l }; })() : null);
    const lado = opciones.lado || elegirLado(centro, libre, alt, prefiere);
    if (opciones.modo === 'trato') armarPozoViejo();
    sim = crearNoche({
      modo: opciones.modo, centro, dx: lado.dx, dz: lado.dz, alt, azar: opciones.azar || Math.random,
      defensas: opciones.defensas, aliados: opciones.aliados, ayudas: opciones.ayudas, fuerte: opciones.fuerte, deuda: opciones.deuda,
      resolver: (p, r) => { _p.set(p.x, alt(p.x, p.z), p.z); col.resolver(_p, r, 1.0); p.x = _p.x; p.z = _p.z; },
    });
    dis = sim.dis;
    armarEscenario();
    // el arsenal prestado, la mano y el reloj
    mano.arma = 'arco'; mano.abajo = false; mano.aviso = 0;
    relaxAntes = !!sonido.relax; sonido.relax = false;   // en las escenas de la Historia, los duendes se ríen
    const js = jugador().estado;
    const ex = centro.x + dis.ux * 6, ez = centro.z + dis.uz * 6;
    jugador().ubicar(ex, ez, Math.atan2(-dis.ux, -dis.uz));
    try { ctx.alAliados?.(opciones.aliados, dis); } catch (e) { console.warn('noche: aliados', e && e.message); }   // 4.17.0: los aliados, visibles
    js.pitch = 0;
    activa = true;
    cuenta.disparos = 0; cuenta.aciertos = 0;
    return true;
  }
  function terminar(fin) {
    if (!activa) return;
    activa = false; pausada = false;
    mano.abajo = false;
    for (const [id, a] of asignados) { soltar(a.tipo, a.m, a.viejo); asignados.delete(id); }
    for (const p of proy) p.m.visible = false;
    desarmarEscenario();
    try { ctx.sinAliados?.(); } catch { /* ya */ }
    sonido.relax = relaxAntes;
    const resultado = { ...(fin || { gano: false, motivo: 'abandono' }), modo: sim?.modo, t: sim?.t || 0, bajas: sim?.bajas || 0, travesuras: sim?.travesuras || 0, disparos: cuenta.disparos, aciertos: cuenta.aciertos };
    const alTerminar = opciones?.alTerminar;
    sim = null;
    try { alTerminar?.(resultado); } catch (e) { console.error('noche: alTerminar', e); }
  }
  function abandonar() { terminar({ gano: false, motivo: 'abandono' }); }

  // ---- 4.17.0: los blancos de práctica del capítulo 11: cinco de paja en el Puesto del Paso (arco) o cinco latas en los postes del galpón de esquila (honda)
  let prac = null;   // { donde, sim, mallas: [{ cuerpo, poste }] }
  const _alPie = (x, z) => alt(x, z);
  function abrirPractica(donde) {
    const p = ctx.puntoDe?.(donde === 'paso' ? 'puesto-paso' : 'galpon'), de = ctx.puntoDe?.('refugio');
    if (!p || !de || !listo) return false;
    const blancos = blancosDe(donde === 'paso' ? 'paja' : 'lata', p, de, _alPie);
    const sim2 = crearPractica({ blancos, alt: _alPie });
    const mallas = blancos.map((b) => {
      const cuerpo = new THREE.Mesh(GEO_PALO, donde === 'paso' ? matFlecha : matPiedra);
      const poste = donde === 'paso' ? null : new THREE.Mesh(GEO_PALO, matFlecha);
      cuerpo.scale.set(b.r, b.h, b.r); cuerpo.position.set(b.x, b.y + b.h / 2, b.z); cuerpo.frustumCulled = false; escena.add(cuerpo);
      if (poste) { poste.scale.set(0.07, b.poste === undefined ? 1.3 : (b.y - b.poste), 0.07); poste.position.set(b.x, b.poste + (b.y - b.poste) / 2, b.z); poste.frustumCulled = false; escena.add(poste); }
      return { cuerpo, poste, b };
    });
    prac = { donde, sim: sim2, mallas, aciertos: 0 };
    mano.arma = donde === 'paso' ? 'arco' : 'honda'; mano.abajo = false;
    ctx.nota?.(donde === 'paso' ? 'Los blancos de paja de Belisario' : 'Las latas de los postes del galpón', donde === 'paso' ? 'Clic: tirar · mantené el clic para tensar el arco' : 'Clic: tirar piedras · mantené para seguir');
    return true;
  }
  function cerrarPractica() {
    if (!prac) return;
    for (const m of prac.mallas) { escena.remove(m.cuerpo); if (m.poste) escena.remove(m.poste); }
    for (const q of proy) q.m.visible = false;
    prac = null; mano.abajo = false;
  }
  // cada cuadro: `donde` es 'paso' | 'esquila' | null (lo calcula la historia). Devuelve los aciertos nuevos.
  function practicar(dt, donde) {
    if (activa) { cerrarPractica(); return 0; }
    if (!donde || ctx.modo() !== 'jugando') { cerrarPractica(); return 0; }
    if (!prac || prac.donde !== donde) { cerrarPractica(); if (!abrirPractica(donde)) return 0; }
    if (mano.abajo && mano.arma === 'honda' && jugador().bloqueado()) disparar('honda');
    prac.sim.actualizar(dt);
    let nuevos = 0;
    for (const ev of prac.sim.eventos) {
      if (ev.tipo === 'blanco') { nuevos++; sonido.impacto?.(donde === 'paso' ? 'hueco' : 'metal', { pos: { x: ev.b.x, y: ev.b.y + ev.b.h / 2, z: ev.b.z }, tamaño: 0.7, dureza: 0.7, fuerza: 0.8, vol: 0.7 }); }
      else if (ev.tipo === 'suelo') sonido.impacto?.('tierra', { pos: { x: ev.p.x, y: ev.p.y, z: ev.p.z }, tamaño: 0.5, dureza: 0.5, fuerza: 0.5, vol: 0.35 });
    }
    // los blancos caídos se acuestan; vuelven a pararse
    for (const m of prac.mallas) { const c = m.b.caido; m.cuerpo.visible = c <= 0; }
    let k = 0;
    for (const p of prac.sim.proyectiles) {
      let q = proy[k++];
      if (!q) { const m = new THREE.Mesh(geoFlecha, matFlecha); m.frustumCulled = false; escena.add(m); q = { m, tipo: 'arco' }; proy.push(q); }
      if (q.tipo !== p.tipo) { q.tipo = p.tipo; q.m.geometry = p.tipo === 'arco' ? geoFlecha : geoPiedra; q.m.material = p.tipo === 'arco' ? matFlecha : matPiedra; }
      q.m.visible = true; q.m.position.set(p.x, p.y, p.z);
      if (p.tipo === 'arco') { _mira.set(p.x + p.vx, p.y + p.vy, p.z + p.vz); q.m.lookAt(_mira); }
    }
    for (; k < proy.length; k++) proy[k].m.visible = false;
    prac.aciertos += nuevos;
    return nuevos;
  }
  // ---- 4.17.0: la lucecita ámbar que avisa 2 s antes dónde sale un topo (con el trato): una bolita del material de las bellotas, que ya está compilado
  function avisoTopo(x, z) {
    let q = lucecitas.find((l) => !l.m.visible);
    if (!q) { const m = new THREE.Mesh(geoBellota, matBellota); m.frustumCulled = false; escena.add(m); q = { m, t: 0 }; lucecitas.push(q); }
    q.m.visible = true; q.t = 2.4; q.m.position.set(x, alt(x, z) + 0.3, z); q.m.scale.setScalar(2.2);
  }
  // ---- el arma
  function disparar(arma = mano.arma, tensionSeg = 0) {
    // 4.17.0: sin la noche, los blancos de práctica usan las mismas armas
    if (!activa && prac) {
      camara.getWorldDirection(_dir);
      _org.copy(camara.position).addScaledVector(_dir, 0.6);
      const r = prac.sim.disparar(arma, { x: _org.x, y: _org.y, z: _org.z }, { x: _dir.x, y: _dir.y, z: _dir.z }, tensionSeg);
      if (r.ok) { if (arma === 'arco') S?.arco?.(); else S?.honda?.(); ctx.gesto?.(); }
      return r;
    }
    if (!activa || !sim || sim.fin) return { ok: false, motivo: 'fin' };
    camara.getWorldDirection(_dir);
    _org.copy(camara.position).addScaledVector(_dir, 0.6);
    const r = sim.disparar(arma, { x: _org.x, y: _org.y, z: _org.z }, { x: _dir.x, y: _dir.y, z: _dir.z }, tensionSeg);
    if (r.ok) {
      cuenta.disparos++;
      if (arma === 'arco') S.arco(); else S.honda();
      ctx.gesto?.();
    } else if (r.motivo === 'sin-flechas' && performance.now() - mano.aviso > 2500) {
      mano.aviso = performance.now();
      ctx.nota?.('Sin flechas', 'Seguí con la honda: las piedras no se acaban (2)');
      mano.arma = 'honda';
    }
    return r;
  }
  function elegirArma(a) {
    if (!ARMAS_NOCHE[a] || mano.arma === a) return false;
    mano.arma = a; mano.abajo = false;
    ctx.nota?.(ARMAS_NOCHE[a].nombre, a === 'arco' ? 'Clic: tirar · mantené para tensar más' : 'Clic: tirar piedras · mantené para seguir');
    return true;
  }
  const mouseListo = () => ((activa && sim && !sim.fin) || (!activa && !!prac)) && ctx.modo() === 'jugando' && jugador().bloqueado();
  const arcoListo = () => (activa ? sim.flechas > 0 && sim.recarga <= 0 : !!prac && prac.sim.recarga <= 0);
  function alApretar(e) {
    if (!mouseListo()) return;
    if (e.button === 0) {
      e.stopImmediatePropagation(); e.preventDefault();
      if (mano.arma === 'arco') { if (arcoListo()) { mano.abajo = true; mano.desde = performance.now(); } else disparar('arco'); }
      else { mano.abajo = true; disparar('honda'); }
    } else if (e.button === 2 && activa) { e.stopImmediatePropagation(); e.preventDefault(); elegirArma(mano.arma === 'arco' ? 'honda' : 'arco'); }
  }
  function alSoltar(e) {
    if ((!activa && !prac) || e.button !== 0 || !mano.abajo) return;
    mano.abajo = false;
    if (mano.arma === 'arco' && ctx.modo() === 'jugando') { e.stopImmediatePropagation(); disparar('arco', (performance.now() - mano.desde) / 1000); }
  }
  function alTeclear(e) {
    if (!activa || ctx.modo() !== 'jugando') return;
    if (e.code === 'Digit1' || e.code === 'Numpad1') { e.stopImmediatePropagation(); elegirArma('arco'); }
    else if (e.code === 'Digit2' || e.code === 'Numpad2') { e.stopImmediatePropagation(); elegirArma('honda'); }
    else if (e.code === 'KeyE') e.stopImmediatePropagation();   // de noche no se duerme ni se toca nada: se defiende
  }
  function alRueda(e) { if (activa && ctx.modo() === 'jugando' && sim && !sim.fin) { e.stopImmediatePropagation(); elegirArma(mano.arma === 'arco' ? 'honda' : 'arco'); } }
  window.addEventListener('mousedown', alApretar, true);
  window.addEventListener('mouseup', alSoltar, true);
  window.addEventListener('keydown', alTeclear, true);
  window.addEventListener('wheel', alRueda, { capture: true, passive: true });
  window.addEventListener('blur', () => { mano.abajo = false; });

  // ---- cada cuadro
  const HORA_INICIO = 22.0, HORA_FIN = 23.7;
  function actualizar(dt) {
    if (!activa || !sim) return;
    if (ctx.modo() !== 'jugando') return;
    if (pausada) return;   // 4.17.0: una escena de entre olas la detiene
    const js = jugador().estado;
    // el reloj de la noche: oscuro y sin cruzar la medianoche (la hora de antes se devuelve al terminar)
    ctx.progreso().horas = HORA_INICIO + (HORA_FIN - HORA_INICIO) * Math.min(1, sim.t / NOCHE.duracion);
    if (mano.abajo && mano.arma === 'honda') disparar('honda');
    sim.actualizar(dt, { x: js.pos.x, y: js.pos.y, z: js.pos.z });
    for (const ev of sim.eventos) eventoDe(ev);
    dibujar(dt);
    if (sim.fin) terminar(sim.fin);
  }
  function eventoDe(ev) {
    switch (ev.tipo) {
      case 'oleada': ctx.nota?.(sim.modo === 'pelea' ? 'Vienen' : 'Se oyen risas en el monte', sim.modo === 'pelea' ? 'Por el lado del bosque: aguantá el portón' : 'Luces chicas entre los coihues…'); break;
      case 'nace': { const d = ev.d; S.chillido({ x: d.x, y: d.y + 0.5, z: d.z }, d.tipo, d.tipo === 'bruto'); break; }
      case 'golpe': {
        cuenta.aciertos++;
        const d = ev.d, pos = { x: d.x, y: d.y + d.def.altura * 0.5, z: d.z };
        if (sim.modo === 'pelea') S.golpe(pos, d.tipo, !!ev.muere || !!ev.cabeza);
        else sonido.impacto?.('hueco', { pos, tamaño: 0.85, dureza: 0.8, fuerza: 0.9, vol: 0.9 });
        const a = asignados.get(d.id); if (a) a.m.flash?.(1);
        break;
      }
      case 'cae': {
        const d = ev.d, pos = { x: d.x, y: d.y + 0.3, z: d.z };
        if (sim.modo === 'pelea') S.muerte(pos, d.tipo); else S.chillido(pos, d.tipo, d.tipo === 'bruto');
        const a = asignados.get(d.id); if (a && sim.modo !== 'pelea') a.m.chillar();
        break;
      }
      case 'travesura': { const d = ev.d; S.chillido({ x: d.x, y: d.y + 0.5, z: d.z }, d.tipo, false); sonido.impacto?.('tabla', { pos: { x: d.x, y: d.y + 1, z: d.z }, tamaño: 1.6, dureza: 0.7, fuerza: 0.8, vol: 0.8 }); ctx.nota?.(`Travesura ${sim.travesuras}/${NOCHE.travesurasMax}`, 'Tocaron la puerta y se rieron'); break; }
      case 'pega': {
        if (ev.a === 'jugador') { S.herido(); flashHerido = 1; js2().golpe = 0.3; }
        else if (ev.d) sonido.impacto?.('tabla', { pos: { x: ev.d.x, y: ev.d.y + 1, z: ev.d.z }, tamaño: 2.2, dureza: 0.7, fuerza: 1, vol: 0.9 });
        break;
      }
      case 'tira': S.plasma?.({ x: ev.d.x, y: ev.d.y + 1, z: ev.d.z }); break;
      case 'campana': { campana.sonar(dis.campanaPos || { x: dis.centro.x, y: 2, z: dis.centro.z }); ctx.nota?.(`Ola ${ev.ola} de 3`, 'Ya vienen: la campana avisa'); break; }
      case 'aviso-topo': avisoTopo(ev.x, ev.z); break;
      case 'ola-limpia': try { opciones?.alOlaLimpia?.(ev.ola); } catch (e) { console.error('noche: alOlaLimpia', e); } break;
      case 'miel': sonido.impacto?.('tierra', { pos: { x: ev.d.x, y: ev.d.y + 0.2, z: ev.d.z }, tamaño: 0.6, dureza: 0.2, fuerza: 0.4, vol: 0.5 }); break;
      case 'enjambre': ctx.nota?.('Los duendecitos de luz', 'Se le tiraron encima al grandote: lo traban unos segundos'); break;
      case 'jefe-cae': ctx.nota?.(sim.modo === 'pelea' ? 'El Mandamás se retira' : 'El Mandamás se sienta en la nieve', sim.modo === 'pelea' ? 'Te mira un rato largo y se va' : 'Asiente una sola vez'); break;
      case 'repara': sonido.impacto?.('tabla', { pos: { x: dis.centro.x, y: 1, z: dis.centro.z }, tamaño: 1.2, dureza: 0.6, fuerza: 0.5, vol: 0.45 }); break;
      case 'aliado': if (ev.quien === 'josefina') S.arco?.(); else if (ev.quien === 'fermin') S.honda?.(); break;
      case 'suelo': sonido.impacto?.('tierra', { pos: { x: ev.p.x, y: ev.p.y, z: ev.p.z }, tamaño: 0.5, dureza: 0.5, fuerza: 0.5, vol: 0.4 }); break;
      default: break;
    }
  }
  const js2 = () => jugador().estado;

  const _mira = new THREE.Vector3();
  function dibujar(dt) {
    const js = jugador().estado;
    // los duendes
    for (const d of sim.duendes) {
      let a = asignados.get(d.id);
      if (d.estado === 'fuera') { if (a) { soltar(a.tipo, a.m, a.viejo); asignados.delete(d.id); } continue; }
      const viejo = sim.modo === 'trato';
      if (!a) { a = { m: tomar(d.tipo, viejo), tipo: d.tipo, viejo }; asignados.set(d.id, a); }
      const m = a.m, g = m.g;
      g.position.set(d.x, d.y, d.z);
      g.rotation.y = d.rumbo;
      if (d.estado === 'cae') {
        m.caer(d.t);
        if (sim.modo === 'pelea') { if (d.t > 0.9) m.disolver(Math.min(1, (d.t - 0.9) / 1.4)); }
      } else {
        const fin = d.estado === 'huye' || d.estado === 'amanece';
        pose.dt = dt; pose.jugador = js.pos; pose.velocidad = d.velocidad; pose.golpe = d.golpe; pose.ataca = d.ataca; pose.carrera = d.velocidad > 3.2;
        pose.apuntando = d.ataca && !!d.def.aDistancia && sim.modo === 'pelea'; pose.noche = 1;
        m.animar(pose);
        if (fin) m.disolver(Math.min(1, Math.max(0, (d.t - (d.estado === 'amanece' ? 0.8 : 1.0)) / 1.0)));
      }
      if (d.golpe > 0) m.flash?.(d.golpe * 0.6); else m.flash?.(0);
      // los hongos del lomo del Mandamás brillan más cuando está de espaldas a vos (la ayuda de los duendecitos del trato)
      if (d.tipo === 'jefe' && sim.ayudas && m.u?.uDebil && d.estado !== 'cae') m.u.uDebil.value = 1 + (sim.jefeDeEspaldas() ? 1.6 : 0) + (d.golpe > 0 ? d.golpe * 1.2 : 0);
    }
    // los proyectiles
    let k = 0;
    for (const p of sim.proyectiles) {
      let q = proy[k++];
      if (!q) { const m = new THREE.Mesh(geoFlecha, matFlecha); m.frustumCulled = false; escena.add(m); q = { m, tipo: 'arco' }; proy.push(q); }
      if (q.tipo !== p.tipo) {
        q.tipo = p.tipo;
        q.m.geometry = p.tipo === 'arco' ? geoFlecha : p.tipo === 'honda' ? geoPiedra : geoBellota;
        q.m.material = p.tipo === 'arco' ? matFlecha : p.tipo === 'honda' ? matPiedra : matBellota;
      }
      q.m.visible = true;
      q.m.position.set(p.x, p.y, p.z);
      if (p.tipo === 'arco') { _mira.set(p.x + p.vx, p.y + p.vy, p.z + p.vz); q.m.lookAt(_mira); }
    }
    for (; k < proy.length; k++) proy[k].m.visible = false;
    for (const q of lucecitas) { if (!q.m.visible) continue; q.t -= dt; q.m.position.y += Math.sin(q.t * 9) * 0.004; q.m.scale.setScalar(2.2 + Math.sin(q.t * 12) * 0.5); if (q.t <= 0) q.m.visible = false; }
    // las llamas parpadean
    if (mallaLlamas) { const t = performance.now() / 1000; mallaLlamas.scale.set(1, 0.94 + Math.sin(t * 13) * 0.05 + Math.sin(t * 7.3) * 0.03, 1); }
    flashHerido = Math.max(0, flashHerido - dt * 2.2);
  }

  return {
    paraCompilar, trasCompilar, preparar, iniciar, terminar, abandonar, actualizar, disparar, elegirArma, practicar, cerrarPractica,
    practicaActiva: () => !!prac, get practica() { return prac; },
    activa: () => activa, pausar: (si) => { pausada = !!si; if (si) mano.abajo = false; }, pausada: () => pausada,
    armada: () => listo,
    hud: () => (sim ? { ...sim.hud(), arma: mano.arma, herido: flashHerido, tensando: mano.abajo && mano.arma === 'arco' ? Math.min(1, (performance.now() - mano.desde) / 1100) : 0 } : null),
    get sim() { return sim; },
    get estadoMano() { return mano; },
    get dis() { return dis; },
    get cuenta() { return cuenta; },
  };
}
