// Kayak: se sube en el muelle, se rema por el lago y se baja en cualquier orilla
import * as THREE from 'three';
import { clamp, lerp } from './ruido.js';
import { LAGO } from './config.js';
import { sanearBotes } from './personal-botes.js';
import { cartelNombre, letraSobre, desechar } from './personal-mallas.js';

function mallaKayak() {
  const g = new THREE.Group();
  const perfil = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    perfil.push(new THREE.Vector2(Math.sin(t * Math.PI) * 0.34 + 0.001, (t - 0.5) * 3.6));
  }
  const casco = new THREE.Mesh(new THREE.LatheGeometry(perfil, 14), new THREE.MeshLambertMaterial({ color: '#d4552a' }));
  casco.rotation.x = Math.PI / 2;
  casco.scale.set(1, 1, 0.45);
  casco.position.y = 0.05;
  g.add(casco);
  const cabina = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 16), new THREE.MeshLambertMaterial({ color: '#1e1e1e' }));
  cabina.scale.set(1, 1, 1.9); cabina.position.set(0, 0.18, -0.1);
  g.add(cabina);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.casco = casco;   // 2.8: para pintarlo
  return g;
}

// 2.8: el banderín de popa: un mástil fino y el paño, triangular o en cola de golondrina.
// El paño cuelga hacia atrás y flamea (ver `colocarBarco`).
function mallaBanderin(forma, color) {
  const g = new THREE.Group();
  g.position.set(0, 0, -1.25);
  const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.66, 6), new THREE.MeshLambertMaterial({ color: '#c9a36a' }));
  mastil.position.y = 0.44;
  g.add(mastil);
  const pano = new THREE.Group();
  pano.position.y = 0.76;
  const v = forma === 'golondrina'
    ? [0, 0, 0, 0, -0.14, 0, 0, -0.07, -0.2, 0, 0, 0, 0, -0.07, -0.2, 0, 0, -0.32, 0, -0.14, 0, 0, -0.14, -0.32, 0, -0.07, -0.2]
    : [0, 0, 0, 0, -0.14, 0, 0, -0.07, -0.34];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geo.computeVertexNormals();
  pano.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })));
  g.add(pano);
  g.userData.pano = pano;
  return g;
}

function mallaRemo() {
  const g = new THREE.Group();
  const madera = new THREE.MeshLambertMaterial({ color: '#c9a36a' });
  const pala = new THREE.MeshLambertMaterial({ color: '#2f5a74', side: THREE.DoubleSide });
  g.userData.pala = pala;   // 2.8: para pintarla
  const vara = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 2.1, 8), madera);
  vara.rotation.z = Math.PI / 2;
  g.add(vara);
  for (const l of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.17), pala);
    p.position.x = l * 1.15; p.rotation.y = Math.PI / 2 * 0.2 * l;
    g.add(p);
  }
  return g;
}

export function crearKayak(T, escena, camara, col, sonido) {
  const m = T.lugares.muelle;
  const dx = Math.cos(m.ang), dz = Math.sin(m.ang);
  // amarrado al costado del muelle
  const base = { x: m.x + dx * 12 - dz * 2.1, z: m.z + dz * 12 + dx * 2.1, rumbo: Math.atan2(dx, dz) };
  const barco = mallaKayak();
  escena.add(barco);
  const remo = mallaRemo();
  remo.position.set(0, -0.35, -0.55);
  remo.visible = false;
  camara.add(remo);

  const est = { activo: false, x: base.x, z: base.z, rumbo: base.rumbo, vel: 0, giro: 0, fase: 0, golpe: 0, lado: 1, remando: 0 };

  // 2.8: lo personal: el nombre a los costados y el banderín (ver `personalizar`)
  let personal = sanearBotes(null), nombres = [], banderin = null;
  function colocarBarco(t) {
    barco.position.set(est.x, Math.sin(t * 1.4) * 0.03 - 0.02, est.z);
    barco.rotation.set(Math.sin(t * 0.9) * 0.015, est.rumbo, Math.sin(t * 1.1) * 0.03 + est.giro * 0.08, 'YXZ');
    // el banderín flamea, más cuando se rema
    if (banderin) banderin.userData.pano.rotation.y = Math.sin(t * 5.3) * (0.2 + Math.min(0.25, Math.abs(est.vel) * 0.08)) + Math.sin(t * 11.7) * 0.05;
  }
  colocarBarco(0);

  const hondo = (x, z) => T.altura(x, z) < -0.35 && Math.hypot(x - LAGO.x, z - LAGO.z) < 220;

  // 2.9: arriba del velero (que también cuenta como `enKayak`) el kayak no se ofrece
  function cerca(js) { return !est.activo && !js.enKayak && Math.hypot(js.pos.x - est.x, js.pos.z - est.z) < 3.2; }

  function subir(jugador) {
    est.activo = true;
    est.vel = 0; est.giro = 0;
    jugador.estado.enKayak = true;
    jugador.estado.yaw = est.rumbo + Math.PI;
    jugador.estado.agachado = false;
    remo.visible = true;
    sonido.golpeKayak();
  }

  // busca tierra firme cerca para bajar
  function lugarParaBajar() {
    // 2.9: sin nadie a bordo no hay de dónde bajar (el aviso del velero va por su lado)
    if (!est.activo) return null;
    const plat = col.plataformas.find((p) => {
      const ddx = est.x - p.x, ddz = est.z - p.z;
      const lx = ddx * p.cos + ddz * p.sin, lz = -ddx * p.sin + ddz * p.cos;
      return Math.abs(lx) < p.largo / 2 + 2.5 && Math.abs(lz) < p.ancho / 2 + 2.5 && p.alto < 3;
    });
    if (plat) {
      const ddx = est.x - plat.x, ddz = est.z - plat.z;
      const lx = clamp(ddx * plat.cos + ddz * plat.sin, -plat.largo / 2 + 0.5, plat.largo / 2 - 0.5);
      return { x: plat.x + lx * plat.cos, z: plat.z + lx * plat.sin };
    }
    for (let r = 1.5; r < 7; r += 0.5) {
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2;
        const x = est.x + Math.cos(ang) * r, z = est.z + Math.sin(ang) * r;
        if (!T.agua(x, z) && T.altura(x, z) > 0.15) return { x, z };
      }
    }
    return null;
  }

  function bajar(jugador) {
    const p = lugarParaBajar();
    if (!p) return false;
    est.activo = false;
    remo.visible = false;
    jugador.estado.enKayak = false;
    jugador.ubicar(p.x, p.z, jugador.estado.yaw);
    sonido.golpeKayak();
    return true;
  }

  function actualizar(dt, tecla, jugador, tiempo) {
    if (!est.activo) { colocarBarco(tiempo); return; }
    const adelante = tecla('KeyW') || tecla('ArrowUp');
    const atras = tecla('KeyS') || tecla('ArrowDown');
    const izq = tecla('KeyA') || tecla('ArrowLeft');
    const der = tecla('KeyD') || tecla('ArrowRight');
    const empuje = (adelante ? 1 : 0) - (atras ? 0.6 : 0);
    if (empuje !== 0 || izq || der) {
      est.fase += dt * 3.2;
      const lado = Math.sin(est.fase) > 0 ? 1 : -1;
      if (lado !== est.lado) { est.lado = lado; sonido.remada(adelante ? 1 : 0.6); }
    }
    // 3.1: `est.brazo` es el oficio de navegante (main.js): rema más fuerte y llega más rápido
    est.vel += empuje * dt * 1.6 * (est.brazo || 1);
    est.vel *= Math.exp(-dt * 0.45);
    est.vel = clamp(est.vel, -1.5, 3.4 * (est.brazo || 1));
    est.giro += ((izq ? 1 : 0) - (der ? 1 : 0)) * dt * 1.2;
    est.giro *= Math.exp(-dt * 1.8);
    est.rumbo += est.giro * dt;
    const nx = est.x + Math.sin(est.rumbo) * est.vel * dt, nz = est.z + Math.cos(est.rumbo) * est.vel * dt;
    const proa = { x: nx + Math.sin(est.rumbo) * 1.6 * Math.sign(est.vel || 1), z: nz + Math.cos(est.rumbo) * 1.6 * Math.sign(est.vel || 1) };
    const choqueMuelle = col.plataformaEn(proa.x, proa.z, 0.2);
    if (!hondo(proa.x, proa.z) || (choqueMuelle && choqueMuelle.alto < 3)) {
      if (Math.abs(est.vel) > 0.6) sonido.golpeKayak();
      est.vel *= -0.25;
    } else { est.x = nx; est.z = nz; }
    colocarBarco(tiempo);

    const js = jugador.estado;
    js.pos.set(est.x, 0.25, est.z);
    js.velocidadActual = Math.abs(est.vel);
    // remo: gira de un lado al otro al remar
    const s = Math.sin(est.fase);
    remo.rotation.set(0.1, 0, s * 0.45);
    remo.position.set(s * 0.12, -0.38 + Math.abs(s) * 0.04, -0.55);
  }

  // 2.8: lo elegido en "Personalizar" (ver `personal-botes.js`): el color del casco y de
  // las palas, el nombre pintado a los dos lados de la proa y el banderín de popa.
  function personalizar(datos) {
    const d = sanearBotes(datos);
    barco.userData.casco.material.color.set(d.casco);
    remo.userData.pala.color.set(d.pala);
    const nombreCambio = d.nombre !== personal.nombre || (d.nombre && letraSobre(d.casco) !== letraSobre(personal.casco));
    if (nombreCambio || (!nombres.length && d.nombre)) {
      for (const n of nombres) { barco.remove(n); desechar(n); }
      nombres = [];
      if (d.nombre) {
        // un plano a cada lado, apenas afuera del casco y girado como se angosta la proa
        const conicidad = 0.135;
        for (const lado of [-1, 1]) {
          const n = cartelNombre(d.nombre, 0.36, 0.07, { ancho: 512, alto: 100, tinta: letraSobre(d.casco), fuente: 'Caveat', peso: 700 });
          n.position.set(lado * 0.296, 0.09, 0.56);
          n.rotation.y = lado * (Math.PI / 2 - conicidad);
          barco.add(n);
          nombres.push(n);
        }
      }
    }
    if (d.banderin !== personal.banderin || d.colorBanderin !== personal.colorBanderin || (!banderin && d.banderin !== 'ninguno')) {
      if (banderin) { barco.remove(banderin); desechar(banderin); banderin = null; }
      if (d.banderin !== 'ninguno') { banderin = mallaBanderin(d.banderin, d.colorBanderin); barco.add(banderin); }
    }
    personal = d;
    // 2.9: lo mismo para los otros botes (el velero)
    for (const bote of botes) bote.personalizar?.(d);
    return true;
  }

  // 2.9: los otros botes del valle se suman acá y reciben lo de «Tu kayak y tus botes»
  const botes = [];
  function sumarBote(bote) {
    if (!bote || botes.includes(bote)) return;
    botes.push(bote);
    bote.personalizar?.(personal);
  }

  return { est, cerca, subir, bajar, actualizar, lugarParaBajar, remo, personalizar, barco, personal: () => personal, sumarBote };
}
