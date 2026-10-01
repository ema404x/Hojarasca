// Pesca con mosca y devolución: lanzar, esperar el pique, clavar y traer al pez sin cortar la línea
import * as THREE from 'three';
import { clamp, lerp } from './ruido.js';

const PECES = {
  arcoiris: { nombre: 'trucha arcoíris', cm: [25, 58], fuerza: 1.0, color: '#9aa39b', franja: '#d27a86' },
  marron: { nombre: 'trucha marrón', cm: [30, 72], fuerza: 1.25, color: '#8a7a52', franja: '#6a4a2a' },
  fontinalis: { nombre: 'trucha de arroyo', cm: [20, 40], fuerza: 0.85, color: '#5e6a4a', franja: '#d0652a' },
  perca: { nombre: 'perca criolla', cm: [20, 44], fuerza: 0.9, color: '#7d7a5a', franja: '#4e4a32' },
  pejerrey: { nombre: 'pejerrey patagónico', cm: [20, 38], fuerza: 0.6, color: '#b9c3c6', franja: '#8aa0aa' },
};

function mallaPez(def) {
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshLambertMaterial({ color: def.color }));
  cuerpo.scale.set(0.05, 0.075, 0.24);
  g.add(cuerpo);
  const franja = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshLambertMaterial({ color: def.franja }));
  franja.scale.set(0.052, 0.022, 0.2);
  g.add(franja);
  const vientre = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshLambertMaterial({ color: '#e6e2d6' }));
  vientre.scale.set(0.04, 0.04, 0.17); vientre.position.y = -0.035;
  g.add(vientre);
  const cola = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 4), new THREE.MeshLambertMaterial({ color: def.color }));
  cola.rotation.x = -Math.PI / 2; cola.position.z = -0.27; cola.scale.set(0.3, 1, 1);
  g.add(cola);
  const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), new THREE.MeshBasicMaterial({ color: '#111' }));
  ojo.position.set(0.04, 0.02, 0.17);
  g.add(ojo);
  return g;
}

export function crearPesca(T, escena, camara, sonido, avisar, alAtrapar) {
  // ---------------------------------------------------------------- caña en la mano
  const cana = new THREE.Group();
  const matCana = new THREE.MeshLambertMaterial({ color: '#3a2a1c' });
  const mango = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.28, 8), new THREE.MeshLambertMaterial({ color: '#b08a5a' }));
  mango.position.y = 0.14;
  const vara = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.012, 2.2, 6), matCana);
  vara.position.y = 1.38;
  const carrete = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 14), new THREE.MeshLambertMaterial({ color: '#555' }));
  carrete.rotation.z = Math.PI / 2; carrete.position.set(0.03, 0.05, 0);
  const punta = new THREE.Object3D(); punta.position.y = 2.48;
  cana.add(mango, vara, carrete, punta);
  const pivote = new THREE.Group();
  pivote.position.set(0.28, -0.34, -0.45);
  pivote.add(cana);
  cana.rotation.set(-0.95, 0, -0.12);
  pivote.visible = false;
  camara.add(pivote);

  // línea y mosca
  const PUNTOS = 26;
  const geoLinea = new THREE.BufferGeometry();
  geoLinea.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PUNTOS * 3), 3));
  const linea = new THREE.Line(geoLinea, new THREE.LineBasicMaterial({ color: '#e8e2c8', transparent: true, opacity: 0.8 }));
  linea.frustumCulled = false; linea.visible = false;
  escena.add(linea);
  const mosca = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshLambertMaterial({ color: '#ff9a2a', emissive: '#4a2000' }));
  mosca.visible = false;
  escena.add(mosca);
  const onda = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 28), new THREE.MeshBasicMaterial({ color: '#e5edef', transparent: true, opacity: 0, depthWrite: false }));
  onda.rotation.x = -Math.PI / 2;
  escena.add(onda);
  let ondaT = 9;

  // pez que se muestra al atraparlo
  const mano = new THREE.Group();
  mano.position.set(0.05, -0.2, -1.0);
  mano.visible = false;
  camara.add(mano);

  const est = {
    equipada: false, fase: 'nada', t: 0, recogiendo: false,
    destino: new THREE.Vector3(), desde: new THREE.Vector3(), agua: null,
    pez: null, tension: 0, distancia: 0, flojo: 0, tiron: 0, corriendo: false, carreteT: 0, tensionT: 0,
  };
  const tmp = new THREE.Vector3(), dir = new THREE.Vector3(), tip = new THREE.Vector3();

  function equipar(v) {
    if (est.fase !== 'nada' && !v) recoger(true);
    if (!v) mano.visible = false;
    est.equipada = v;
    pivote.visible = v;
  }

  function recoger(silencio) {
    est.fase = 'nada';
    est.pez = null;
    linea.visible = false; mosca.visible = false;
    if (!silencio) sonido.carrete();
  }

  function elegirPez(agua, mundo) {
    const h = mundo.horas;
    const penumbra = (h > 5.5 && h < 9.5) || (h > 18.5 && h < 22);
    const tabla = agua.lago
      ? [['arcoiris', 34], ['marron', penumbra ? 30 : 14], ['perca', 30], ['pejerrey', 18]]
      : [['fontinalis', 44], ['arcoiris', 34], ['marron', penumbra ? 28 : 12]];
    const total = tabla.reduce((s, [, p]) => s + p, 0);
    let x = Math.random() * total;
    for (const [id, p] of tabla) { x -= p; if (x <= 0) return id; }
    return tabla[0][0];
  }

  function lanzar(mundo) {
    camara.getWorldDirection(dir);
    const ojo = camara.position;
    // la distancia del lance depende de cuánto levantás la vista
    const horiz = Math.hypot(dir.x, dir.z) || 1;
    const alcance = clamp(12 + Math.asin(clamp(dir.y, -1, 1)) * 22, 5, 21);
    let objetivo = null, aguaHit = null;
    for (let d = alcance; d >= 4; d -= 1) {
      tmp.set(ojo.x + (dir.x / horiz) * d, 0, ojo.z + (dir.z / horiz) * d);
      const agua = T.agua(tmp.x, tmp.z);
      if (agua && agua.prof > 0.35) { objetivo = new THREE.Vector3(tmp.x, agua.nivel, tmp.z); aguaHit = agua; break; }
    }
    if (!objetivo) { avisar('Apuntá hacia el agua para lanzar', 'Mejor donde sea más hondo'); return; }
    punta.getWorldPosition(est.desde);
    est.destino.copy(objetivo);
    est.agua = aguaHit;
    est.fase = 'lanzando'; est.t = 0;
    let espera = 5 + Math.random() * 16;
    const h = mundo.horas;
    if ((h > 5.5 && h < 9.5) || (h > 18.5 && h < 22)) espera *= 0.55;
    if (mundo.nublado > 0.5) espera *= 0.8;
    if (!aguaHit.lago) espera *= 0.85;
    if (mundo.mosca) espera *= 0.55;   // la mosca atada a mano del almacén
    if (mundo.pique) espera *= mundo.pique;   // 3.1: el oficio de pescador
    // 1.10: con el arroyo crecido y turbio no pica nada ahí; en el lago comen mejor
    if ((mundo.crecida || 0) >= 0.4) espera *= aguaHit.lago ? 0.8 : 3;
    // con lluvia y presión baja los peces comen mejor; con sol pleno se aquietan
    if (mundo.tormenta) espera *= 0.6;
    else if (mundo.lluvia > 0.25) espera *= 0.75;
    else if (mundo.nublado < 0.2 && mundo.horas > 11 && mundo.horas < 16) espera *= 1.35;
    est.espera = espera;
    est.pezElegido = elegirPez(aguaHit, mundo);
    linea.visible = true; mosca.visible = true;
    sonido.lanzar();
  }

  function clic(abajo, mundo) {
    if (!est.equipada) return false;
    if (abajo) {
      if (est.fase === 'nada') lanzar(mundo);
      else if (est.fase === 'esperando') { recoger(); }
      else if (est.fase === 'pica') {
        const def = PECES[est.pezElegido];
        const cm = Math.round(def.cm[0] + Math.pow(Math.random(), 1.6) * (def.cm[1] - def.cm[0]));
        est.pez = { id: est.pezElegido, cm, def };
        est.fase = 'enganchado'; est.tension = 0.35; est.flojo = 0; est.tiron = 1 + Math.random(); est.lucha = 0;
        est.distancia = Math.hypot(est.destino.x - camara.position.x, est.destino.z - camara.position.z);
        sonido.chapoteo(est.destino, 0.8);
      }
      est.recogiendo = true;
    } else {
      est.recogiendo = false;
    }
    return true;
  }

  function actualizarLinea(dt) {
    punta.getWorldPosition(tip);
    const p = geoLinea.attributes.position.array;
    const caida = Math.min(1.5, tip.distanceTo(mosca.position) * 0.06) * (est.fase === 'enganchado' ? 1 - est.tension : 1);
    for (let i = 0; i < PUNTOS; i++) {
      const k = i / (PUNTOS - 1);
      p[i * 3] = lerp(tip.x, mosca.position.x, k);
      p[i * 3 + 1] = lerp(tip.y, mosca.position.y, k) - Math.sin(k * Math.PI) * caida;
      p[i * 3 + 2] = lerp(tip.z, mosca.position.z, k);
    }
    geoLinea.attributes.position.needsUpdate = true;
  }

  function ondear(pos, fuerza) {
    onda.position.set(pos.x, pos.y + 0.02, pos.z);
    ondaT = 0; onda.userData.fuerza = fuerza;
  }

  function actualizar(dt, jugador, mundo) {
    const js = jugador.estado;
    // la caña se guarda sola si te metés al agua o te subís al tren
    if (est.equipada && (js.nadando || js.enTren)) { equipar(false); estadoTexto = ''; return; }
    // la caña se mueve un poco con el paso
    cana.rotation.x = lerp(cana.rotation.x, est.fase === 'enganchado' ? -0.55 - est.tension * 0.35 : est.fase === 'lanzando' ? -0.4 : -0.95, 1 - Math.exp(-8 * dt));
    cana.rotation.z = -0.12 + Math.sin(js.fasePaso) * 0.02;
    if (est.fase === 'enganchado' && est.corriendo) cana.rotation.z += Math.sin(performance.now() * 0.03) * 0.03;

    ondaT += dt;
    const ko = Math.min(1, ondaT / 1.6);
    onda.scale.setScalar(0.1 + ko * (onda.userData.fuerza || 1));
    onda.material.opacity = (1 - ko) * 0.55;

    if (est.fase === 'nada') { estadoTexto = est.equipada ? 'Clic para lanzar' : ''; return; }

    // alejarse demasiado recoge la línea
    const distJugador = Math.hypot(mosca.position.x - js.pos.x, mosca.position.z - js.pos.z);
    if (est.fase !== 'lanzando' && distJugador > 30) { recoger(); avisar('Recogiste la línea', 'Te alejaste demasiado'); return; }

    if (est.fase === 'lanzando') {
      est.t += dt / 0.7;
      const k = Math.min(1, est.t);
      mosca.position.lerpVectors(est.desde, est.destino, k);
      mosca.position.y += Math.sin(k * Math.PI) * 3;
      if (k >= 1) { est.fase = 'esperando'; est.t = 0; ondear(est.destino, 0.8); sonido.chapoteo(est.destino, 0.15); }
      estadoTexto = '';
    } else if (est.fase === 'esperando') {
      est.t += dt;
      const tt = performance.now() / 1000;
      mosca.position.set(est.destino.x, est.destino.y + Math.sin(tt * 2) * 0.015, est.destino.z);
      if (est.agua && !est.agua.lago) { est.destino.x += Math.sin(tt * 0.3) * dt * 0.2; }
      if (Math.random() < dt * 0.25) ondear(est.destino, 0.4);
      if (est.t > est.espera) { est.fase = 'pica'; est.t = 0; sonido.chapoteo(est.destino, 0.9); ondear(est.destino, 1.6); }
      estadoTexto = 'Esperando el pique. Clic para recoger.';
    } else if (est.fase === 'pica') {
      est.t += dt;
      mosca.position.y = est.destino.y - 0.08 + Math.sin(est.t * 40) * 0.05;
      estadoTexto = '¡Pica! Clic ahora';
      // 3.1: con el oficio de pescador hay más tiempo para clavar
      if (est.t > (mundo.clavar || 1.1)) { est.fase = 'esperando'; est.t = 0; est.espera = 4 + Math.random() * 10; avisar('Se escapó', 'Hay que clavar apenas pica'); }
    } else if (est.fase === 'enganchado') {
      const f = est.pez.def.fuerza * (0.7 + est.pez.cm / 90);
      est.lucha += dt;
      est.tiron -= dt;
      if (est.tiron <= 0) { est.corriendo = !est.corriendo; est.tiron = est.corriendo ? 0.6 + Math.random() * 1.3 : 0.8 + Math.random() * 1.8; if (est.corriendo) { sonido.chapoteo(mosca.position, 0.5 * f); ondear(mosca.position, 1); } }
      if (est.recogiendo) {
        est.tension += dt * (est.corriendo ? 0.62 * f : 0.1) * (mundo.linea || 1);   // 3.1: la línea del pescador de oficio
        est.distancia -= dt * (est.corriendo ? 0.5 : 2.3);
        est.carreteT -= dt;
        if (est.carreteT <= 0) { sonido.carrete(); est.carreteT = 0.06; }
      } else {
        est.tension -= dt * 0.55;
        if (est.corriendo) est.distancia += dt * 1.6 * f;
      }
      est.tension = clamp(est.tension, 0, 1.05);
      est.tensionT -= dt;
      if (est.tension > 0.7 && est.tensionT <= 0) { sonido.tension(est.tension); est.tensionT = 0.25; }
      est.flojo = est.tension < 0.06 ? est.flojo + dt : 0;
      if (est.tension >= 1) { sonido.corte(); avisar('Se cortó la línea', 'Soltá el clic cuando el pez tira'); recoger(true); estadoTexto = ''; return; }
      if (est.flojo > 2.6) { avisar(`Se soltó la ${est.pez.def.nombre}`, 'Si la línea queda floja, el anzuelo se suelta'); recoger(true); estadoTexto = ''; return; }
      // la mosca se acerca y zigzaguea
      dir.set(mosca.position.x - js.pos.x, 0, mosca.position.z - js.pos.z).normalize();
      const lateral = Math.sin(performance.now() * 0.002) * (est.corriendo ? 1.2 : 0.3);
      const nx = js.pos.x + dir.x * est.distancia - dir.z * lateral * dt * 2;
      const nz = js.pos.z + dir.z * est.distancia + dir.x * lateral * dt * 2;
      const agua = T.agua(nx, nz);
      if (agua) { mosca.position.set(nx, agua.nivel - 0.02, nz); }
      else est.distancia = Math.max(1.5, est.distancia - dt * 2);
      est.distancia = Math.max(est.distancia, 2.2);
      if (est.distancia < 2.4 && est.lucha > 2 + est.pez.cm / 18) {
        // atrapado: se muestra y vuelve al agua
        const pez = est.pez;
        est.fase = 'mostrando'; est.t = 0;
        linea.visible = false; mosca.visible = false;
        mano.clear();
        const m = mallaPez(pez.def);
        m.scale.setScalar(pez.cm / 62);
        m.rotation.set(0.25, Math.PI / 2 + 0.35, 0.15);
        mano.add(m); mano.visible = true;
        sonido.chapoteo(null, 0.6);
        alAtrapar(pez);
      }
      estadoTexto = est.corriendo ? 'El pez tira: aflojá' : 'Mantené el clic para recoger';
    } else if (est.fase === 'mostrando') {
      est.t += dt;
      mano.children[0].rotation.z = 0.1 + Math.sin(est.t * 9) * 0.12 * Math.max(0, 1 - est.t / 2);
      estadoTexto = '';
      if (est.t > 2.8) { mano.visible = false; est.fase = 'nada'; sonido.chapoteo(null, 0.4); }
    }
    if (linea.visible) actualizarLinea(dt);
  }

  let estadoTexto = '';
  return {
    est, equipar, clic, actualizar, recoger, PECES,
    texto: () => estadoTexto,
    tension: () => (est.fase === 'enganchado' ? est.tension : -1),
    mostrandoPez: () => est.fase === 'mostrando',
  };
}
