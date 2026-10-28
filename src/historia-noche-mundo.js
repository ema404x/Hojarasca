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
import { crearNoche, elegirLado, NOCHE, ARMAS_NOCHE } from './historia-noche.js';
import { instalarDuendes, precalentarDuendes, crearDuende, registrarHalos, soltarHalos } from './desafio-duendes.js';
import { crearBanco } from './desafio-sonidos.js';
import { matBrilloFijo } from './duendes-modelo.js';

const DUENIO_NOCHE = 'historia-noche';   // (el dueño de las colisiones: se retiran todas juntas)
const TIPOS = { rastreador: 8, saltador: 4, tirador: 3, bruto: 1 };   // cuántos se arman de antemano de cada uno (si hacen falta más, se arman al vuelo)
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
  let listo = false;      // los materiales y los duendes armados
  let activa = false;
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
  function armarDuende(tipo) {
    const m = crearDuende(tipo);
    m.g.visible = false;
    m.g.position.set(0, -500, 0);
    escena.add(m.g);
    return m;
  }
  function tomar(tipo) {
    const lista = pozos[tipo] || (pozos[tipo] = []);
    const m = lista.pop() || armarDuende(tipo);
    m.reiniciar();
    m.g.visible = true;
    return m;
  }
  function soltar(tipo, m) {
    m.reiniciar();
    m.g.visible = false;
    m.g.position.set(0, -500, 0);
    (pozos[tipo] || (pozos[tipo] = [])).push(m);
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
    // el portón: dos postes gruesos y un dintel
    for (const s of [-1, 1]) {
      const x = porton.x + px * (mitad + 0.35) * s, z = porton.z + pz * (mitad + 0.35) * s, y = alt(x, z);
      piezas.push(pieza(GEO_PALO, x, y + 1.5, z, 0.24, 3.0, 0.24, 0, 0, 0, COL_PALO));
      piezas.push(pieza(GEO_PUNTA, x, y + 3.15, z, 0.24, 0.35, 0.24, 0, 0, 0, COL_PALO2));
      // y las antorchas, a un costado del poste
      const tx = x - ux * 0.5, tz = z - uz * 0.5, ty = alt(tx, tz);
      piezas.push(pieza(GEO_PALO, tx, ty + 0.95, tz, 0.05, 1.9, 0.05, 0, 0, 0, COL_PALO2));
      llamas.push(pieza(GEO_PUNTA, tx, ty + 2.08, tz, 0.14, 0.34, 0.14, 0, 0, 0, COL_LLAMA));
      llamas.push(pieza(GEO_CAJA, tx, ty + 2.02, tz, 0.07, 0.12, 0.07, 0, 0, 0, COL_BRASA));
    }
    { const y0 = alt(porton.x, porton.z); piezas.push(pieza(GEO_CAJA, porton.x, y0 + 3.0, porton.z, 2 * (mitad + 0.35) + 0.5, 0.2, 0.2, Math.atan2(-ux, -uz), 0, 0, COL_PALO)); }
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
    for (const s of [-1, 1]) col.agregar({ duenio: DUENIO_NOCHE, x: porton.x + px * (mitad + 0.35) * s, z: porton.z + pz * (mitad + 0.35) * s, r: 0.3 });
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
    const prefiere = lago ? (() => { const dx = centro.x - lago.x, dz = centro.z - lago.z, l = Math.hypot(dx, dz) || 1; return { dx: dx / l, dz: dz / l }; })() : null;
    const lado = opciones.lado || elegirLado(centro, libre, alt, prefiere);
    sim = crearNoche({
      modo: opciones.modo, centro, dx: lado.dx, dz: lado.dz, alt, azar: opciones.azar || Math.random,
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
    js.pitch = 0;
    activa = true;
    cuenta.disparos = 0; cuenta.aciertos = 0;
    return true;
  }
  function terminar(fin) {
    if (!activa) return;
    activa = false;
    mano.abajo = false;
    for (const [id, a] of asignados) { soltar(a.tipo, a.m); asignados.delete(id); }
    for (const p of proy) p.m.visible = false;
    desarmarEscenario();
    sonido.relax = relaxAntes;
    const resultado = { ...(fin || { gano: false, motivo: 'abandono' }), modo: sim?.modo, t: sim?.t || 0, bajas: sim?.bajas || 0, travesuras: sim?.travesuras || 0, disparos: cuenta.disparos, aciertos: cuenta.aciertos };
    const alTerminar = opciones?.alTerminar;
    sim = null;
    try { alTerminar?.(resultado); } catch (e) { console.error('noche: alTerminar', e); }
  }
  function abandonar() { terminar({ gano: false, motivo: 'abandono' }); }

  // ---- el arma
  function disparar(arma = mano.arma, tensionSeg = 0) {
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
  const mouseListo = () => activa && sim && !sim.fin && ctx.modo() === 'jugando' && jugador().bloqueado();
  function alApretar(e) {
    if (!mouseListo()) return;
    if (e.button === 0) {
      e.stopImmediatePropagation(); e.preventDefault();
      if (mano.arma === 'arco') { if (sim.flechas > 0 && sim.recarga <= 0) { mano.abajo = true; mano.desde = performance.now(); } else disparar('arco'); }
      else { mano.abajo = true; disparar('honda'); }
    } else if (e.button === 2) { e.stopImmediatePropagation(); e.preventDefault(); elegirArma(mano.arma === 'arco' ? 'honda' : 'arco'); }
  }
  function alSoltar(e) {
    if (!activa || e.button !== 0 || !mano.abajo) return;
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
      if (d.estado === 'fuera') { if (a) { soltar(a.tipo, a.m); asignados.delete(d.id); } continue; }
      if (!a) { a = { m: tomar(d.tipo), tipo: d.tipo }; asignados.set(d.id, a); }
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
    // las llamas parpadean
    if (mallaLlamas) { const t = performance.now() / 1000; mallaLlamas.scale.set(1, 0.94 + Math.sin(t * 13) * 0.05 + Math.sin(t * 7.3) * 0.03, 1); }
    flashHerido = Math.max(0, flashHerido - dt * 2.2);
  }

  return {
    paraCompilar, trasCompilar, preparar, iniciar, terminar, abandonar, actualizar, disparar, elegirArma,
    activa: () => activa,
    armada: () => listo,
    hud: () => (sim ? { ...sim.hud(), arma: mano.arma, herido: flashHerido, tensando: mano.abajo && mano.arma === 'arco' ? Math.min(1, (performance.now() - mano.desde) / 1100) : 0 } : null),
    get sim() { return sim; },
    get estadoMano() { return mano; },
    get dis() { return dis; },
    get cuenta() { return cuenta; },
  };
}
