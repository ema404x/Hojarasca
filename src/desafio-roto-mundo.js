// 4.9 defensas: lo roto queda a la vista, en el mundo (las reglas y la lista de piezas están en desafio-roto.js).
//
// Cada defensa dañada se mira cada 0,6 s (no cada cuadro): según la vida que le queda tiene 0, 1 o 2 «estados de rotura». Para los
// estados 1 y 2 se cuelga de su grupo UNA malla con las marcas (garras, tablas torcidas o caídas, el hueco, astillas, piedras al pie) y
// se inclina un poco la malla de la obra (la colisión no se mueve: son unos centímetros). Las mallas de marcas salen de una caché por
// (plano, estado, variante): cuatro variantes por plano y estado, así que no se arma geometría nueva cada vez que algo se daña. Se usa
// el material de la propia obra (tipo 0 o 4 por vértice): no hay shaders ni materiales nuevos. Al repararla, vuelve a lo normal.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { vidaMaxObra } from './desafio-reglas.js';
import { ROTO, estadoRotura, seRompe, piezasDe, inclinacion, semillaDe } from './desafio-roto.js';

const VARIANTES = 4;
const _m = new THREE.Matrix4(), _e = new THREE.Euler(), _q = new THREE.Quaternion();

export function crearRotoMundo(obras) {
  const completa = (o) => o.datos.etapas >= o.plano.etapas.length && o !== obras.editando;
  const cache = new Map();
  // la geometría fusionada de las marcas (una sola, con color por vértice y tipo 0 o 4)
  function geometriaDe(plano, estado, variante) {
    const clave = `${plano.id}|${estado}|${variante}`;
    if (cache.has(clave)) return cache.get(clave);
    const c = new Constructor();
    for (const p of piezasDe(plano, estado, variante * 7919 + 13)) {
      const geo = p.t === 'cono' ? new THREE.ConeGeometry(p.e[0], p.e[1], 5)
        : p.t === 'piedra' ? new THREE.IcosahedronGeometry(p.e[0], 0)
          : new THREE.BoxGeometry(p.e[0], p.e[1], p.e[2]);
      const esc = p.t === 'piedra' ? [1, p.e[1], p.e[2]] : [1, 1, 1];
      c.agregar(geo, { color: p.color, tipo: p.tipo, variar: 0.1, matriz: matriz(p.p, p.r, esc) });
      geo.dispose();
    }
    const g = c.geometria();
    cache.set(clave, g);
    return g;
  }

  function quitar(o) {
    const R = o.userRoto;
    if (!R) return;
    if (R.mesh) { o.grupo.remove(R.mesh); R.mesh = null; }
    if (R.malla && R.malla === o.malla) { o.malla.matrix.identity(); o.malla.matrixWorldNeedsUpdate = true; }
    o.userRoto = null;
  }
  // La inclinación del conjunto: sobre la malla de la obra y sobre las marcas, la misma (se ven como una sola cosa).
  function inclinar(o, estado, semilla) {
    const t = inclinacion(o.plano, estado, semilla);
    _e.set(t.x, t.y, t.z, 'YXZ');
    _m.makeRotationFromQuaternion(_q.setFromEuler(_e));
    o.malla.matrix.copy(_m); o.malla.matrixWorldNeedsUpdate = true;
    if (o.userRoto.mesh) { o.userRoto.mesh.matrix.copy(_m); o.userRoto.mesh.matrixWorldNeedsUpdate = true; }
  }
  function vestir(o) {
    if (!o.malla) return;
    const vida = Number.isFinite(o.datos.vida) ? o.datos.vida : Infinity;
    const estado = estadoRotura(vida, vidaMaxObra(o.plano, o.datos.etapas));
    const R = o.userRoto;
    if (estado === 0) { if (R) quitar(o); return; }
    // ya está vestida con este estado y esta malla (la obra se rehace al repintarla o al cambiar de etapa: ahí se vuelve a vestir)
    if (R && R.estado === estado && R.malla === o.malla) return;
    if (R?.mesh) { o.grupo.remove(R.mesh); R.mesh = null; }
    const semilla = semillaDe(o.datos), variante = Math.abs(semilla) % VARIANTES;
    const mesh = new THREE.Mesh(geometriaDe(o.plano, estado, variante), o.malla.material);
    mesh.castShadow = false; mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    o.grupo.add(mesh);
    o.userRoto = { estado, malla: o.malla, mesh };
    inclinar(o, estado, semilla);
  }

  let acum = 9;
  function actualizar(dt) {
    acum += dt;
    if (acum < ROTO.cada) return;
    acum = 0;
    for (const o of obras.obras) {
      if (!seRompe(o.plano) || !completa(o)) { if (o.userRoto) quitar(o); continue; }
      vestir(o);
    }
  }
  // El estado de rotura de una obra (0, 1, 2), para las pruebas y el diagnóstico.
  const estadoDe = (o) => o.userRoto?.estado || 0;
  function limpiar() { for (const o of obras.obras) if (o.userRoto) quitar(o); }
  return { actualizar, vestir, estadoDe, limpiar, get geometrias() { return cache.size; } };
}
