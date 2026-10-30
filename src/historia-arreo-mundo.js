// 4.17.0: la majada del arreo, en el mundo: siete ovejas (un cuerpo y una cabeza cada una, con los materiales de siempre: ningún programa de shader nuevo) que
// siguen al jugador desde el corral del Puesto Alto hasta el destino. Las reglas están en historia-arreo.js. Sólo existen mientras el arreo está en marcha.
import * as THREE from 'three';
import { crearArreo, pasoArreo, DESTINOS_ARREO, ARREO, cercaDelDestino } from './historia-arreo.js';
// 4.18.0: los arreos de las optativas
import { arreoDeOptativa, posicionesArreo } from './historia-optativas.js';

// ctx: { T, escena, jugador: () => jugador, puntoDe(nombre) → {x, z} | null, historia: () => h, llego(destino) }
export function crearArreoMundo(ctx) {
  const { escena, T } = ctx;
  let A = null, clave = '', mallas = [], mats = null, geoCuerpo = null, geoCabeza = null;
  function armar() {
    if (mats) return;
    mats = { lana: new THREE.MeshLambertMaterial({ color: '#e6dfcf' }), cara: new THREE.MeshLambertMaterial({ color: '#3d332b' }) };
    geoCuerpo = new THREE.SphereGeometry(0.5, 10, 8); geoCuerpo.scale(0.85, 0.7, 1.15); geoCuerpo.translate(0, 0.62, 0);
    geoCabeza = new THREE.SphereGeometry(0.2, 8, 6); geoCabeza.translate(0, 0.78, 0.62);
  }
  function soltar() {
    for (const m of mallas) escena.remove(m);
    mallas = []; A = null; clave = '';
  }
  function abrir(opcion, origen, destino, extra = {}) {
    armar();
    A = crearArreo({ origen, destino, ...extra });
    clave = opcion;
    mallas = A.ovejas.map(() => { const g = new THREE.Group(); g.add(new THREE.Mesh(geoCuerpo, mats.lana), new THREE.Mesh(geoCabeza, mats.cara)); g.frustumCulled = false; escena.add(g); return g; });
  }
  // cada cuadro. Sólo si el capítulo 9 está en marcha con D5 = a o c y todavía no llegó.
  // 4.18.0: y el de las optativas (la oveja escapada del capítulo 2, las ovejas desparramadas del 9): ver arreoDeOptativa en historia-optativas.js
  function configuracion(h) {
    const op = h?.activa && h.fase === 'jugando' && h.capitulo === 8 ? h.decisiones?.majada : null;
    const d = op && Object.hasOwn(DESTINOS_ARREO, op) ? DESTINOS_ARREO[op] : null;
    if (d && h.escenas?.vistas?.['ramon-cama'] && !(h.temas && Object.hasOwn(h.temas, `arreo:${d.destino}`))) return { clave: `majada-${op}`, destino: d.destino, majada: d };
    const o = arreoDeOptativa(h, ctx.eventos?.() || {});
    return o ? { clave: `opt-${o.clave}`, destino: o.destino, optativa: o } : null;
  }
  let destinoActual = null;
  function actualizar(dt) {
    const h = ctx.historia();
    const cf = configuracion(h);
    if (!cf) { if (A) soltar(); return; }
    if (clave !== cf.clave) {
      soltar();
      if (cf.majada) {
        const pu = ctx.puntoDe('puesto'), dest = ctx.puntoDe(cf.majada.punto);
        if (!pu || !dest) return;
        abrir(cf.clave, { x: pu.x + 5, z: pu.z + 3 }, dest);
      } else {
        const pos = posicionesArreo(cf.optativa, (k) => ctx.puntoDe(k));
        if (!pos) return;
        abrir(cf.clave, pos.corral, pos.corral, { posiciones: pos.ovejas, min: cf.optativa.min });
      }
      destinoActual = cf.destino;
    }
    const j = ctx.jugador().estado;
    const lleg = pasoArreo(A, { x: j.pos.x, z: j.pos.z, yaw: j.yaw, aCaballo: !!j.montado }, dt);
    A.ovejas.forEach((o, i) => { const g = mallas[i]; g.position.set(o.x, T.altura(o.x, o.z), o.z); g.rotation.y = o.rumbo; g.position.y += Math.abs(Math.sin(performance.now() / 160 + i)) * (o.vel > 0.2 ? 0.05 : 0); });
    if (lleg) ctx.llego(destinoActual);
  }
  return { actualizar, soltar, activo: () => !!A, get estado() { return A; }, ARREO, juntadas: () => cercaDelDestino(A), get clave() { return clave; } };
}
