// 3.7.0: los animales de la Aldea de los Duendes en el mundo (las reglas y los datos, en aldea-vida.js):
//   · los perros con nombre (la Chola del jefe, el Tango de los Jones, la Pampa de Julia y el Tizón de
//     Anselmo): dan vueltas por el patio de su casa y, si pasás cerca, te siguen un rato y se vuelven;
//   · dos caballos atados al palenque de la plaza, de día, cabeceando y pastando;
//   · las gallinas en los patios de atrás de las casas (una sola malla instanciada, como las tuyas);
//   · el cachorro de la Chola que adoptaste: vive en tu refugio, juega alrededor de la puerta, sale a
//     recibirte y crece (aldea-vida.js dice cuánto).
// Se arman la primera vez que te acercás (a la aldea o al refugio) con las mallas de siempre (perro.js,
// caballo-mundo.js, gallinero-mundo.js) y lejos no se dibujan ni se mueven. Sólo en el Relax.
import * as THREE from 'three';
import { mallaPerro } from './perro.js';
import { mallaCaballo } from './caballo-mundo.js';
import { geometriaGallina } from './gallinero-mundo.js';
import { sanearPerro } from './personal-perro.js';
import { sanearCaballoPersonal } from './personal-caballo.js';
import { ANIMALES_ALDEA, SEGUIR_PERRO, perrosPresentes, tallaMascota, MASCOTA } from './aldea-vida.js';
import { PARADA_ALDEA, marcoAldea, puntosFijosDe } from './aldea.js';

const VER = 120;            // a cuántos metros se los ve
const ARMAR = 220;          // a cuántos metros se arman las mallas
const RADIO_PATIO = 3;      // cuánto se alejan de su lugar los que andan sueltos

// `ctx`: { T, escena, progreso(), jugador() → estado, refugio() → { x, z } | null, distanciaAldea(x, z), col(), alturaDePie(x, z, y) }
// 3.7.0 (integración): los perros, el cachorro y las gallinas chocan con las paredes, los cercos y los muebles (antes
// atravesaban todo y, siguiéndote, se metían en las casas) y pisan los pisos y las galerías (no se hunden bajo el
// piso de una casa). El que se traba contra algo deja de seguirte y se vuelve; si tampoco puede volver, aparece en
// su casa cuando no lo ves.
export function crearAnimalesAldea(ctx) {
  const { T, escena } = ctx;
  const M = marcoAldea(PARADA_ALDEA);
  const perros = new Map();     // id → { m, def, casa, x, z, rumbo, vel, fase, estado, t, hasta, cuando }
  const caballos = [];          // { m, def, x, z, rot }
  let gallinas = null, aves = [];
  let cachorro = null;          // { m, x, z, rumbo, vel, fase, t, talla }
  let armada = false;
  const _M = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _e = new THREE.Euler();
  const _pos = new THREE.Vector3();
  // la altura de los pies (el piso de una galería o de una casa, si está encima)
  const pie = (x, z, y) => (ctx.alturaDePie ? ctx.alturaDePie(x, z, Number.isFinite(y) ? y : T.altura(x, z)) : T.altura(x, z));
  // un paso a (nx, nz), sin atravesar paredes (radio chico: un perro, una gallina)
  function mover(a, nx, nz, radio = 0.22) {
    const col = ctx.col?.();
    if (col) { _pos.set(nx, Number.isFinite(a.y) ? a.y : T.altura(nx, nz), nz); col.resolver(_pos, radio, 0.55); nx = _pos.x; nz = _pos.z; }
    a.x = nx; a.z = nz;
    a.y = pie(nx, nz, a.y);
  }
  const enMundo = (lx, lz) => M.aMundo(lx, lz);
  const patioDe = (casa) => { const q = puntosFijosDe(casa).trabajo || puntosFijosDe(casa).puerta; return q ? enMundo(q.x, q.z) : null; };

  function armarAldea() {
    armada = true;
    for (const def of ANIMALES_ALDEA.perros) {
      const casa = patioDe(def.casa);
      if (!casa) continue;
      const m = mallaPerro(sanearPerro({ pelo: def.pelo, dibujo: def.dibujo, collar: def.collar, conCollar: true }));
      m.g.rotation.order = 'YXZ';
      m.g.visible = false;
      escena.add(m.g);
      perros.set(def.id, { m, def, casa, x: casa.x, z: casa.z, rumbo: 0, vel: 0, fase: Math.random() * 6, estado: 'casa', t: 0, hasta: 0, cuando: -999, objetivo: { x: casa.x, z: casa.z } });
    }
    for (const def of ANIMALES_ALDEA.caballos) {
      const m = mallaCaballo(sanearCaballoPersonal({ pelaje: def.pelaje }));
      const w = enMundo(def.x, def.z);
      m.g.position.set(w.x, T.altura(w.x, w.z), w.z);
      m.g.rotation.y = M.rotMundo(def.rot);
      m.g.visible = false;
      escena.add(m.g);
      caballos.push({ m, def, x: w.x, z: w.z, fase: Math.random() * 6 });
    }
    const total = ANIMALES_ALDEA.gallinas.reduce((s, g) => s + g.n, 0);
    gallinas = new THREE.InstancedMesh(geometriaGallina(), new THREE.MeshLambertMaterial({ vertexColors: true }), total);
    gallinas.count = 0; gallinas.frustumCulled = false; gallinas.castShadow = true; gallinas.name = 'gallinas-aldea';
    escena.add(gallinas);
    for (const g of ANIMALES_ALDEA.gallinas) {
      const c = patioDe(g.casa);
      if (!c) continue;
      for (let i = 0; i < g.n; i++) { const a = (i / g.n) * Math.PI * 2; aves.push({ cx: c.x, cz: c.z, x: c.x + Math.cos(a), z: c.z + Math.sin(a), rumbo: a, t: Math.random() * 2, picotea: 0 }); }
    }
  }

  // un paso hacia (x, z) a `vel` m/s; devuelve lo que falta
  // (3.7.0 (integración): `a.trabado`: cuántos segundos lleva queriendo avanzar sin poder)
  function caminar(a, x, z, vel, dt) {
    const dx = x - a.x, dz = z - a.z, d = Math.hypot(dx, dz);
    if (d < 0.05 || !(vel > 0)) { a.vel = 0; a.trabado = 0; return d; }
    const paso = Math.min(d, vel * dt);
    const x0 = a.x, z0 = a.z;
    mover(a, a.x + (dx / d) * paso, a.z + (dz / d) * paso);
    const avanzo = Math.hypot(a.x - x0, a.z - z0);
    a.trabado = avanzo < paso * 0.3 ? (a.trabado || 0) + dt : 0;
    const r = Math.atan2(dx, dz);
    a.rumbo += Math.atan2(Math.sin(r - a.rumbo), Math.cos(r - a.rumbo)) * Math.min(1, dt * 6);
    a.vel = avanzo > paso * 0.3 ? vel : 0;
    return Math.hypot(x - a.x, z - a.z);
  }
  function dibujarPerro(a, talla = 1) {
    const g = a.m.g;
    g.position.set(a.x, Number.isFinite(a.y) ? a.y : T.altura(a.x, a.z), a.z);
    g.rotation.y = a.rumbo;
    g.scale.setScalar(talla);
    a.fase += 0.016 * (2 + a.vel * 6);
    const andando = a.vel > 0.1;
    a.m.patas?.forEach((p, k) => { p.rotation.x = andando ? Math.sin(a.fase + (k % 2 ? Math.PI : 0) + (k > 1 ? Math.PI / 2 : 0)) * 0.5 : 0; });
    if (a.m.cola) a.m.cola.rotation.z = Math.sin(a.fase * 2.2) * (andando ? 0.4 : 0.15);
  }

  // ---------------------------------------------------------------- cada cuadro
  function actualizar(dt, horas) {
    const js = ctx.jugador?.();
    if (!js) return;
    const p = ctx.progreso();
    const dAldea = ctx.distanciaAldea ? ctx.distanciaAldea(js.pos.x, js.pos.z) : Infinity;
    const deDia = horas >= 7 && horas < 20.5;
    if (!armada && dAldea < ARMAR) armarAldea();
    if (armada) {
      // los perros (los que todavía no tienen dueño en la aldea no están)
      const presentes = new Set(perrosPresentes(p.aldea).map((d) => d.id));
      for (const [id, a] of perros) {
        const dj = Math.hypot(a.x - js.pos.x, a.z - js.pos.z);
        const visible = presentes.has(id) && dj < VER && !js.enTren;
        a.m.g.visible = visible;
        if (!visible) { if (!presentes.has(id) || dj > VER) { a.x = a.casa.x; a.z = a.casa.z; a.y = undefined; a.estado = 'casa'; } continue; }
        a.t -= dt;
        const ahora = performance.now() / 1000;
        if (a.estado === 'casa') {
          // si pasás cerca, te sigue un rato (no enseguida de nuevo)
          if (dj < SEGUIR_PERRO.radio && ahora - a.cuando > SEGUIR_PERRO.cada && deDia) { a.estado = 'sigue'; a.hasta = ahora + SEGUIR_PERRO.segundos; a.cuando = ahora; }
          else {
            // (trabado contra algo, elige otro lugar del patio)
            if (a.t <= 0 || a.trabado > 1) { a.t = 2 + Math.random() * 4; a.trabado = 0; const r = Math.random() * Math.PI * 2, d = Math.random() * RADIO_PATIO; a.objetivo = { x: a.casa.x + Math.cos(r) * d, z: a.casa.z + Math.sin(r) * d }; }
            caminar(a, a.objetivo.x, a.objetivo.z, 0.8, dt);
          }
        }
        if (a.estado === 'sigue') {
          const lejosDeCasa = Math.hypot(a.x - a.casa.x, a.z - a.casa.z);
          // (3.7.0 (integración): y si se traba contra algo, o entrás a una casa, deja de seguirte)
          if (ahora > a.hasta || lejosDeCasa > SEGUIR_PERRO.lejos || js.montado || a.trabado > 1.5) { a.estado = 'vuelve'; a.trabado = 0; }
          else {
            // detrás tuyo, a un par de metros
            const ax = js.pos.x + Math.sin(js.yaw || 0) * 1.8, az = js.pos.z + Math.cos(js.yaw || 0) * 1.8;
            const falta = Math.hypot(ax - a.x, az - a.z);
            caminar(a, ax, az, falta > 6 ? 4.2 : falta > 1.2 ? 2.2 : 0, dt);
          }
        }
        if (a.estado === 'vuelve' && caminar(a, a.casa.x, a.casa.z, 1.6, dt) < 0.3) a.estado = 'casa';
        // (si no puede volver, aparece en su casa: de lejos, o después de un rato)
        if (a.estado === 'vuelve' && a.trabado > (dj > 25 ? 1.5 : 6)) { a.x = a.casa.x; a.z = a.casa.z; a.y = undefined; a.estado = 'casa'; a.trabado = 0; }
        dibujarPerro(a);
      }
      // los caballos atados, de día
      for (const c of caballos) {
        const visible = deDia && Math.hypot(c.x - js.pos.x, c.z - js.pos.z) < VER;
        c.m.g.visible = visible;
        if (!visible) continue;
        c.fase += dt;
        if (c.m.cuello) c.m.cuello.rotation.x = 0.35 + Math.sin(c.fase / 2.4) * 0.25;
      }
      // las gallinas, de día y de cerca
      let n = 0;
      if (deDia && dAldea < VER) for (const a of aves) {
        if (Math.hypot(a.cx - js.pos.x, a.cz - js.pos.z) > VER) continue;
        a.t -= dt;
        if (a.t <= 0) { a.t = 0.8 + Math.random() * 2.5; a.picotea = Math.random() < 0.55 ? 0.6 + Math.random() * 0.8 : 0; a.rumbo += (Math.random() - 0.5) * 2.4; if (Math.hypot(a.x - a.cx, a.z - a.cz) > 2.4) a.rumbo = Math.atan2(a.cx - a.x, a.cz - a.z); }
        const dj = Math.hypot(a.x - js.pos.x, a.z - js.pos.z);
        if (dj < 1.4) a.rumbo = Math.atan2(a.x - js.pos.x, a.z - js.pos.z);
        const vel = dj < 1.4 ? 1.6 : a.picotea > 0 ? 0 : 0.35;
        a.picotea = Math.max(0, a.picotea - dt);
        if (vel > 0) { const x0 = a.x, z0 = a.z; mover(a, a.x + Math.sin(a.rumbo) * vel * dt, a.z + Math.cos(a.rumbo) * vel * dt, 0.15); if (Math.hypot(a.x - x0, a.z - z0) < vel * dt * 0.3) a.rumbo += 1.2; }
        _e.set(a.picotea > 0 ? Math.max(0, Math.sin(a.picotea * 18)) * 0.5 : 0, a.rumbo, 0, 'YXZ');
        gallinas.setMatrixAt(n++, _M.compose(_p.set(a.x, Number.isFinite(a.y) ? a.y : T.altura(a.x, a.z), a.z), _q.setFromEuler(_e), _s));
      }
      gallinas.count = n;
      if (n) gallinas.instanceMatrix.needsUpdate = true;
    }
    actualizarCachorro(dt, js, p, deDia);
  }

  // ---------------------------------------------------------------- el cachorro adoptado
  function actualizarCachorro(dt, js, p, deDia) {
    const m = p.vidaAldea?.mascota;
    const casa = ctx.refugio?.();
    if (!m || m.estado !== 'adoptado' || !casa) { if (cachorro) cachorro.m.g.visible = false; return; }
    const centro = { x: casa.x + 2.2, z: casa.z + 2.2 };
    const dj = Math.hypot(centro.x - js.pos.x, centro.z - js.pos.z);
    if (!cachorro) {
      if (dj > ARMAR) return;
      const mm = mallaPerro(sanearPerro({ pelo: MASCOTA.pelo, dibujo: MASCOTA.dibujo, conCollar: true, collar: '#2f5a74' }));
      mm.g.rotation.order = 'YXZ';
      escena.add(mm.g);
      cachorro = { m: mm, x: centro.x, z: centro.z, rumbo: 0, vel: 0, fase: 0, t: 0, objetivo: { ...centro } };
    }
    const visible = dj < VER && !js.enTren;
    cachorro.m.g.visible = visible;
    if (!visible) { cachorro.x = centro.x; cachorro.z = centro.z; cachorro.y = undefined; cachorro.descansa = 0; return; }
    const a = cachorro;
    a.t -= dt;
    a.descansa = Math.max(0, (a.descansa || 0) - dt);
    const cerca = Math.hypot(a.x - js.pos.x, a.z - js.pos.z);
    // (3.7.0 (integración): si se traba (entraste a la casa y el cachorro quedó contra la pared), juega un rato
    // afuera antes de volver a seguirte)
    if (a.trabado > 1.2) { a.descansa = 6; a.trabado = 0; a.t = 0; }
    if (dj < 18 && cerca > 1.5 && deDia && !a.descansa) {
      // sale a recibirte y te sigue mientras andes por el refugio
      const ax = js.pos.x + Math.sin(js.yaw || 0) * 1.2, az = js.pos.z + Math.cos(js.yaw || 0) * 1.2;
      caminar(a, ax, az, cerca > 5 ? 3.6 : 1.8, dt);
    } else {
      if (a.t <= 0) { a.t = 1.5 + Math.random() * 3; const r = Math.random() * Math.PI * 2, d = Math.random() * 4; a.objetivo = { x: centro.x + Math.cos(r) * d, z: centro.z + Math.sin(r) * d }; }
      caminar(a, a.objetivo.x, a.objetivo.z, deDia ? 1.4 : 0.4, dt);
    }
    dibujarPerro(a, tallaMascota(m, p.dia));
  }

  return {
    actualizar,
    // para las pruebas
    estado: () => ({
      armada, perros: [...perros.entries()].map(([id, a]) => ({ id, x: a.x, z: a.z, visible: a.m.g.visible, estado: a.estado })),
      caballos: caballos.map((c) => ({ id: c.def.id, visible: c.m.g.visible })), gallinas: gallinas?.count || 0,
      cachorro: cachorro ? { x: cachorro.x, z: cachorro.z, visible: cachorro.m.g.visible, talla: cachorro.m.g.scale.x } : null,
    }),
  };
}
