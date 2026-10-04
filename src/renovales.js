// Los renovales: piñones y semillas que plantás y que crecen día a día.
import * as THREE from 'three';
import { rng, lerp, clamp } from './ruido.js';
import { Constructor, matriz } from './geometria.js';
import { materialVegetal } from './materiales.js';

const DIAS_CRECER = 14;   // de brote a arbolito

function mallaRenoval(semilla, especie) {
  const r = rng(semilla), c = new Constructor();
  const tronco = especie === 'pehuen' ? '#4e4136' : especie === 'cipres' ? '#5a4636' : '#5b4a3a';
  // 2.3: el ñire (más bajo y claro) y el ciprés (oscuro), que llegan desde el vivero
  const hoja = especie === 'pehuen' ? '#2f5230' : especie === 'lenga' ? '#5d7a33' : especie === 'nire' ? '#6b8438' : especie === 'cipres' ? '#2c4a2c' : '#3f6b32';
  const alto = (especie === 'nire' ? 1.9 : 2.4) + r() * 0.8;
  c.agregar(new THREE.CylinderGeometry(0.035, 0.07, alto, 5), { color: tronco, tipo: 0, matriz: matriz([0, alto / 2, 0]) });
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2 + r();
    const d = 0.22 + r() * 0.3;
    const y = alto * (0.45 + (i / 5) * 0.5);
    c.agregar(new THREE.CylinderGeometry(0.018, 0.03, 0.5, 4), {
      color: tronco, tipo: 0,
      matriz: matriz([Math.cos(ang) * d * 0.5, y, Math.sin(ang) * d * 0.5], [0.6, ang, 0]),
    });
    c.agregar(new THREE.IcosahedronGeometry(0.28 + r() * 0.16, 0), {
      color: hoja, tipo: 2, variar: 0.16,
      matriz: matriz([Math.cos(ang) * d, y + 0.18, Math.sin(ang) * d], [r(), r() * 6, r()]),
    });
  }
  c.agregar(new THREE.IcosahedronGeometry(0.34, 0), { color: hoja, tipo: 2, variar: 0.14, matriz: matriz([0, alto + 0.1, 0]) });
  return c.geometria();
}

export function crearRenovales(T, escena, col) {
  const mat = materialVegetal({ flex: 1.5 });
  const geos = {
    coihue: mallaRenoval(11, 'coihue'),
    lenga: mallaRenoval(22, 'lenga'),
    pehuen: mallaRenoval(33, 'pehuen'),
    nire: mallaRenoval(44, 'nire'),
    cipres: mallaRenoval(55, 'cipres'),
  };
  const grupo = new THREE.Group();
  escena.add(grupo);
  const puestos = new Map();   // clave -> { malla, datos }

  function clave(p) { return `${Math.round(p.x)}:${Math.round(p.z)}`; }

  // ¿se puede plantar acá? hace falta suelo llano, seco y despejado
  function sitioBueno(x, z, veg) {
    if (T.agua(x, z)) return { ok: false, motivo: 'Acá no: está mojado' };
    // 3.6.1: ni en la aldea (en el Relax: ver T.sinObras en main.js): crecería en una calle o una casa
    const reservado = typeof T.sinObras === 'function' ? T.sinObras(x, z, 1) : null;
    if (reservado) return { ok: false, motivo: reservado };
    const n = T.normal(x, z);
    if (Math.acos(clamp(n.y, -1, 1)) > 0.45) return { ok: false, motivo: 'Muy en pendiente para un renoval' };
    if (T.distSendero[T.indice(x, z)] < 2.5) return { ok: false, motivo: 'No en el medio del sendero' };
    if (T.distRiel[T.indice(x, z)] < 6) return { ok: false, motivo: 'Muy cerca de la vía' };
    for (const a of veg.arboles) {
      if (!a.sacado && Math.hypot(a.x - x, a.z - z) < 5) return { ok: false, motivo: 'Hace falta un claro: los grandes no lo dejan crecer' };
    }
    for (const [, v] of puestos) {
      if (Math.hypot(v.datos.x - x, v.datos.z - z) < 6) return { ok: false, motivo: 'Ya hay un renoval al lado' };
    }
    return { ok: true };
  }

  function colocar(datos) {
    const k = clave(datos);
    if (puestos.has(k)) return;
    const geo = geos[datos.especie] || geos.coihue;
    const m = new THREE.Mesh(geo, mat);
    m.position.set(datos.x, T.altura(datos.x, datos.z), datos.z);
    m.rotation.y = (datos.x * 0.7 + datos.z * 0.3) % 6.28;
    m.castShadow = true;
    grupo.add(m);
    puestos.set(k, { malla: m, datos });
    col.agregar({ x: datos.x, z: datos.z, r: 0.28 });
  }

  function plantar(x, z, especie, dia, veg) {
    const prueba = sitioBueno(x, z, veg);
    if (!prueba.ok) return prueba;
    const datos = { x, z, especie, dia };
    colocar(datos);
    return { ok: true, datos };
  }

  function sincronizar(lista) {
    for (const d of lista || []) colocar(d);
  }

  // cada renoval crece con los días: primero un brote, después un arbolito
  function actualizar(diaActual) {
    for (const [, v] of puestos) {
      const edad = clamp((diaActual - v.datos.dia) / DIAS_CRECER, 0, 1);
      const e = lerp(0.12, 1, edad * edad * (3 - 2 * edad));   // arranca lento y acelera
      v.malla.scale.set(e, e, e);
      v.datos.crecido = edad;
    }
  }

  const contar = () => puestos.size;
  const crecidos = (diaActual) => [...puestos.values()].filter((v) => diaActual - v.datos.dia >= DIAS_CRECER).length;

  return { plantar, sincronizar, actualizar, contar, crecidos, sitioBueno, DIAS_CRECER };
}
