// 4.31.0 (C): lo visual de la naturaleza que se toca (ver naturaleza-toque.js). Todo con el material de los objetos del valle
// (`materialVegetal({ flex: 2 })` en mallas instanciadas sin tinte por instancia: el mismo programa que las frutillas y los cantos;
// 0 programas nuevos) y una malla instanciada por forma. Lo que no se usa queda con `count` 0 y apagado (no dibuja): en la plaza,
// nada; en el bosque, las piedritas, las piñas, la leña y las ranas que haya cerca (hasta cuatro llamadas).
import * as THREE from 'three';
import { rng } from './ruido.js';
import { Constructor, matriz, lamina, troncoCurvo, abollar } from './geometria.js';
import { materialVegetal } from './materiales.js';

function geoHoja() {
  const c = new Constructor();
  // (una hoja que cae se ve contra el verde de la mata: más grande y más amarilla que las de la copa)
  // (4.31.0: con 0,13 m y verde amarillento no se distinguían contra la mata: 0,2 m y del color de la hoja seca, que es la que se suelta)
  c.agregar(lamina(0.26, 0.15, 0.25, 2), { color: '#d0952f', tipo: 4, variar: 0.3 });
  return c.geometria();
}
function geoPetalo() {
  const c = new Constructor();
  c.agregar(lamina(0.07, 0.04, 0.3, 2), { color: '#e3891f', tipo: 3, variar: 0.15 });
  return c.geometria();
}
function geoGota() {
  const c = new Constructor();
  c.agregar(new THREE.IcosahedronGeometry(0.016, 1), { color: '#ffffff', tipo: 4, variar: 0, matriz: matriz([0, 0, 0], [0, 0, 0], [1, 1.8, 1]) });
  return c.geometria();
}
function geoCopo() {
  const c = new Constructor();
  c.agregar(new THREE.IcosahedronGeometry(0.035, 0), { color: '#f3f6f8', tipo: 4, variar: 0.04 });
  return c.geometria();
}
function geoPajaro() {
  // un chincol chico: cuerpo pardo, la cabeza más oscura y dos alas abiertas (vuela, no hace falta que aletee: va rápido y lejos)
  const c = new Constructor();
  c.agregar(new THREE.IcosahedronGeometry(0.05, 1), { color: '#7a6448', tipo: 4, matriz: matriz([0, 0, 0], [0, 0, 0], [0.8, 0.75, 1.5]) });
  c.agregar(new THREE.IcosahedronGeometry(0.032, 0), { color: '#4b3b2c', tipo: 4, matriz: matriz([0, 0.03, 0.07]) });
  c.agregar(lamina(0.13, 0.06, 0.1, 2), { color: '#5d4c38', tipo: 4, matriz: matriz([0.03, 0.01, 0], [0, Math.PI / 2, 0.35]) });
  c.agregar(lamina(0.13, 0.06, 0.1, 2), { color: '#5d4c38', tipo: 4, matriz: matriz([-0.03, 0.01, 0], [0, -Math.PI / 2, -0.35]) });
  return c.geometria();
}
function geoPiedrita() {
  const c = new Constructor();
  c.agregar(abollar(new THREE.IcosahedronGeometry(0.06, 1), 0.012), { color: '#8b877e', tipo: 4, variar: 0.18, matriz: matriz([0, 0.022, 0], [0, 0, 0], [1.2, 0.6, 1]) });
  return c.geometria();
}
function geoPina() {
  // la piña chica del ciprés (de las que hay en el piso del bosque): escamas en anillos
  const c = new Constructor();
  c.agregar(new THREE.IcosahedronGeometry(0.035, 1), { color: '#6b4a2b', tipo: 4, variar: 0.12, matriz: matriz([0, 0.03, 0], [Math.PI / 2, 0, 0], [0.9, 1.6, 0.9]) });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    c.agregar(new THREE.IcosahedronGeometry(0.016, 0), { color: '#7d5532', tipo: 4, matriz: matriz([Math.cos(a) * 0.028, 0.03 + Math.sin(a) * 0.028, (k % 2 ? 0.02 : -0.02)]) });
  }
  return c.geometria();
}
function geoLena() {
  // un atado suelto de ramas secas caídas, cruzadas en el piso del bosque
  const c = new Constructor(), r = rng(4310);
  for (let k = 0; k < 6; k++) {
    const largo = 0.7 + r() * 0.6, ang = r() * Math.PI;
    c.agregar(troncoCurvo(largo, 0.03 + r() * 0.015, 0.014, [r() * 0.1, 0], 5, 3), { color: k % 2 ? '#8a6d4c' : '#9a7d58', tipo: 4, variar: 0.15, matriz: matriz([(r() - 0.5) * 0.3, 0.035 + k * 0.022, (r() - 0.5) * 0.3], [0, ang, Math.PI / 2 + (r() - 0.5) * 0.12]) });
  }
  return c.geometria();
}
function geoRana() {
  // la ranita de Darwin y su pariente del mallín: verde musgo, ojos saltones
  const c = new Constructor();
  c.agregar(new THREE.IcosahedronGeometry(0.045, 1), { color: '#4d6b2b', tipo: 4, variar: 0.12, matriz: matriz([0, 0.03, 0], [0, 0, 0], [1, 0.6, 1.3]) });
  for (const s of [-1, 1]) {
    c.agregar(new THREE.IcosahedronGeometry(0.014, 0), { color: '#2a2a1c', tipo: 4, matriz: matriz([s * 0.022, 0.058, 0.035]) });
    c.agregar(new THREE.IcosahedronGeometry(0.02, 0), { color: '#425c25', tipo: 4, matriz: matriz([s * 0.04, 0.015, -0.035], [0, 0, 0], [0.8, 0.5, 1.6]) });
  }
  return c.geometria();
}
function geoAnillo() {
  const c = new Constructor();
  c.agregar(new THREE.TorusGeometry(1, 0.016, 3, 28), { color: '#e6edf0', tipo: 4, variar: 0, matriz: matriz([0, 0, 0], [Math.PI / 2, 0, 0]) });
  return c.geometria();
}

// Una malla instanciada con su cupo: se llena con lo que esté vivo en el cuadro y se sube sólo lo usado
function crearPool(escena, mat, geo, cupo) {
  const im = new THREE.InstancedMesh(geo, mat, cupo);
  im.count = 0;
  im.visible = false;
  im.frustumCulled = false;
  im.receiveShadow = true;
  im.matrixAutoUpdate = false;
  im.updateMatrixWorld(true);
  im.matrixWorldAutoUpdate = false;
  escena.add(im);
  return { im, cupo, n: 0 };
}
function cerrarPool(p) {
  p.im.count = p.n;
  p.im.visible = p.n > 0;
  if (p.n) { p.im.instanceMatrix.clearUpdateRanges(); p.im.instanceMatrix.addUpdateRange(0, p.n * 16); p.im.instanceMatrix.needsUpdate = true; }
  p.n = 0;
}

const _M = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function ponerEn(p, x, y, z, rx, ry, rz, sx, sy = sx, sz = sx) {
  if (p.n >= p.cupo) return;
  _M.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
  p.im.setMatrixAt(p.n++, _M);
}

// ctx: { escena, T }
export function crearNaturalezaMundo({ escena, T }) {
  const mat = materialVegetal({ flex: 2 });
  const pools = {
    hoja: crearPool(escena, mat, geoHoja(), 96),
    petalo: crearPool(escena, mat, geoPetalo(), 24),
    gota: crearPool(escena, mat, geoGota(), 72),
    copo: crearPool(escena, mat, geoCopo(), 48),
    pajaro: crearPool(escena, mat, geoPajaro(), 8),
    piedrita: crearPool(escena, mat, geoPiedrita(), 40),
    pina: crearPool(escena, mat, geoPina(), 24),
    lena: crearPool(escena, mat, geoLena(), 12),
    rana: crearPool(escena, mat, geoRana(), 8),
    anillo: crearPool(escena, mat, geoAnillo(), 20),
  };
  // las partículas sueltas (hojas, pétalos, gotas, nieve, pájaros): una lista, recicladas
  const sueltas = [];
  const MAX_SUELTAS = 220;
  function soltar(forma, x, y, z, vx, vy, vz, vida, esc = 1) {
    if (sueltas.length >= MAX_SUELTAS) return null;
    const s = { forma, x, y, z, vx, vy, vz, vida, t: 0, esc, rx: Math.random() * 6, ry: Math.random() * 6, giro: (Math.random() - 0.5) * 8, quieta: 0, fase: Math.random() * 6 };
    sueltas.push(s);
    return s;
  }
  const anillos = [];
  function anillo(x, z, nivel, { radio = 1, vida = 1.6, demora = 0 } = {}) {
    if (anillos.length >= pools.anillo.cupo) anillos.shift();
    anillos.push({ x, z, y: nivel, radio, vida, t: -demora });
  }

  // ---- las ráfagas
  function hojas(x, y, z, n, { radio = 0.6, alto = 0.6, forma = 'hoja' } = {}) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * 6.28, d = Math.random() * radio;
      soltar(forma, x + Math.cos(a) * d, y + alto * (0.4 + Math.random() * 0.6), z + Math.sin(a) * d, Math.cos(a) * 0.5, 0.3 + Math.random() * 0.6, Math.sin(a) * 0.5, 2.6 + Math.random() * 1.6, 0.8 + Math.random() * 0.5);
    }
  }
  function nieve(x, y, z, n, radio = 0.9) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * 6.28, d = Math.random() * radio;
      soltar('copo', x + Math.cos(a) * d, y + Math.random() * 0.8, z + Math.sin(a) * d, Math.cos(a) * 0.3, Math.random() * 0.5, Math.sin(a) * 0.3, 1.6, 0.6 + Math.random() * 0.8);
    }
  }
  function salpicar(x, y, z, n, fuerza = 1) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * 6.28, v = (0.6 + Math.random() * 1.4) * fuerza;
      soltar('gota', x + Math.cos(a) * 0.15, y + 0.03, z + Math.sin(a) * 0.15, Math.cos(a) * v, (1.6 + Math.random() * 2.2) * fuerza, Math.sin(a) * v, 1.4, 0.7 + Math.random() * 0.7);
    }
  }
  // (4.31.1: `piso`, el piso donde estás parado: adentro de la casa o en un puente la gota atravesaba el piso hasta el terreno)
  function gotear(x, y, z, piso = null) { const s = soltar('gota', x, y, z, (Math.random() - 0.5) * 0.1, -0.2, (Math.random() - 0.5) * 0.1, 1.2, 0.6); if (s && Number.isFinite(piso)) s.piso = piso; }
  function pajaros(x, y, z, n, desdeX, desdeZ) {
    const huye = Math.atan2(x - desdeX, z - desdeZ);
    for (let k = 0; k < n; k++) {
      const a = huye + (Math.random() - 0.5) * 1.6, v = 4 + Math.random() * 2.5;
      const s = soltar('pajaro', x + (Math.random() - 0.5) * 0.4, y + 0.5 + Math.random() * 0.5, z + (Math.random() - 0.5) * 0.4, Math.sin(a) * v, 2.2 + Math.random() * 1.5, Math.cos(a) * v, 2.4, 1);
      if (s) { s.ry = a; s.rx = -0.3; s.giro = 0; }
    }
  }

  // ---- la física de las sueltas: la gota y la nieve caen; la hoja y el pétalo planean; el pájaro sube y se va
  function moverSueltas(dt) {
    for (let i = sueltas.length - 1; i >= 0; i--) {
      const s = sueltas[i];
      s.t += dt;
      if (s.t >= s.vida) { sueltas[i] = sueltas[sueltas.length - 1]; sueltas.pop(); continue; }
      if (s.forma === 'pajaro') {
        s.vy -= 0.8 * dt;
        s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
        s.rz = Math.sin(s.t * 30) * 0.5;
        continue;
      }
      if (s.quieta) continue;
      const planea = s.forma === 'hoja' || s.forma === 'petalo';
      if (planea) {
        s.vy = Math.max(s.vy - 3.5 * dt, -0.55);
        s.fase += dt * 4;
        s.vx *= 1 - dt * 1.4; s.vz *= 1 - dt * 1.4;
        s.x += (s.vx + Math.sin(s.fase) * 0.35) * dt; s.z += (s.vz + Math.cos(s.fase * 0.8) * 0.3) * dt;
        s.rx += s.giro * dt * 0.6; s.ry += s.giro * dt;
      } else {
        s.vy -= 9.8 * dt;
        s.x += s.vx * dt; s.z += s.vz * dt;
      }
      s.y += s.vy * dt;
      const ag = T.agua(s.x, s.z);
      const piso = Math.max(ag ? ag.nivel : T.altura(s.x, s.z), s.piso ?? -Infinity);
      if (s.y <= piso + 0.01) {
        s.y = piso + 0.01;
        if ((ag && !(s.piso > ag.nivel)) || s.forma === 'gota' || s.forma === 'copo') { s.vida = Math.min(s.vida, s.t + (ag ? 0.05 : 0.25)); s.quieta = 1; }
        else { s.quieta = 1; s.rx = Math.PI / 2 * 0.9; s.vida = Math.max(s.t + 1.5, Math.min(s.vida + 3, s.t + 4)); }
      }
    }
  }
  function dibujarSueltas() {
    for (const s of sueltas) {
      const p = pools[s.forma];
      // se achica al final (la hoja en el suelo, la gota que se deshace)
      const fin = Math.min(1, (s.vida - s.t) / 0.6), e = s.esc * (s.forma === 'pajaro' ? 1 : Math.max(0.05, fin));
      ponerEn(p, s.x, s.y, s.z, s.rx || 0, s.ry || 0, s.rz || 0, e);
    }
    for (let i = anillos.length - 1; i >= 0; i--) {
      const a = anillos[i];
      if (a.t >= a.vida) { anillos.splice(i, 1); continue; }
      if (a.t < 0) continue;
      const u = a.t / a.vida, r = a.radio * (0.12 + u * 0.9);
      // se hunde al final: el anillo se borra bajo el agua en vez de cortarse
      ponerEn(pools.anillo, a.x, a.y + 0.01 - u * u * 0.04, a.z, 0, 0, 0, r, 0.45 - u * 0.25, r);
    }
  }

  // ---- lo de siempre del lugar: piedritas, piñas, leña y ranas (las listas las arma naturaleza-juego.js)
  function dibujarFijos(piedras, pilas, ranas) {
    for (const p of piedras) {
      if (p.fuera) continue;
      ponerEn(p.tipo === 'pina' ? pools.pina : pools.piedrita, p.x, p.y, p.z, p.rx || 0, p.giro, p.rz || 0, p.esc);
    }
    for (const l of pilas) ponerEn(pools.lena, l.x, l.y, l.z, 0, l.giro, 0, 1);
    for (const r of ranas) if (r.visible) ponerEn(pools.rana, r.x, r.y, r.z, r.rx || 0, r.giro, 0, r.esc || 1);
  }

  function actualizar(dt, { piedras = [], pilas = [], ranas = [], extra = null } = {}) {
    moverSueltas(dt);
    for (const a of anillos) a.t += dt;
    dibujarSueltas();
    dibujarFijos(piedras, pilas, ranas);
    if (extra) for (const e of extra) ponerEn(pools.piedrita, e.x, e.y, e.z, e.rx || 0, e.ry || 0, 0, e.esc || 1);
    for (const p of Object.values(pools)) cerrarPool(p);
  }

  return {
    actualizar, hojas, nieve, salpicar, gotear, pajaros, anillo, pools,
    activas: () => sueltas.length + anillos.length,
    dibujos: () => Object.values(pools).filter((p) => p.im.visible).length,
  };
}
