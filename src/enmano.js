// Lo que llevás en la mano: el objeto elegido en la barra se ve abajo a la
// derecha, se balancea al caminar y hace un gesto cuando lo usás.
import * as THREE from 'three';
import { U } from './materiales.js';
import { nivelTexturas, texturaVegetal } from './texturas.js';
import { fusionarPorMaterial } from './fusion.js';
import { armasPorDefecto, firmaArma, forjaVisible } from './personal-armas.js';
import { cartelNombre, tono, desechar } from './personal-mallas.js';

// 2.7: el material de lo que llevás en la mano. Es lo que más se ve en todo el juego:
// madera con veta a lo largo de la pieza, metal satinado con brillo, cuero con poro,
// piedra con grano. Lambert (el runtime no trae otros) con el detalle y un brillo
// especular propios; con calidad mínima queda el Lambert liso de siempre.
const CLASES = {
  //        canal de la textura     escala  contraste brillo potencia
  madera: { canal: [0, 1, 0, 0], esc: 5.5, contraste: 0.62, brillo: 0.07, pot: 14 },
  metal: { canal: [0, 1, 0, 0], esc: 16, contraste: 0.14, brillo: 0.5, pot: 46 },
  oscuro: { canal: [0, 1, 0, 0], esc: 16, contraste: 0.1, brillo: 0.35, pot: 30 },
  cuero: { canal: [0, 0, 0, 1], esc: 26, contraste: 0.35, brillo: 0.12, pot: 16 },
  piedra: { canal: [0, 0, 1, 0], esc: 9, contraste: 0.55, brillo: 0.04, pot: 10 },
  liso: { canal: [0, 0, 0, 0], esc: 1, contraste: 0, brillo: 0.16, pot: 22 },
};
// la clase que corresponde a un color cuando el modelo no la dice
function claseDe(color) {
  const c = new THREE.Color(color);
  const calido = (c.r - c.b) / Math.max(c.r, 0.004);
  if (c.g > c.r * 1.05 || Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) > 0.25) return 'liso';
  if (calido > 0.45) return 'madera';
  return 'metal';
}
function lam(color, clase = null) {
  const m = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) });
  if (!(nivelTexturas() > 0)) return m;
  const k = CLASES[clase || claseDe(color)] || CLASES.liso;
  // eje largo de la pieza (la veta corre a lo largo): lo fijan palo() y caja()
  m.userData.eje = new THREE.Vector3(0, 1, 0);
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, {
      uTexMano: { value: texturaVegetal() }, uEjeMano: { value: m.userData.eje },
      uCanalMano: { value: [...k.canal] }, uClaseMano: { value: [k.esc, k.contraste, k.brillo, k.pot] },   // (el runtime no trae Vector4: van como arreglos)
      uCieloMano: U.uCieloBajo,
    });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vPosMano;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vPosMano = position;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uTexMano; uniform vec3 uEjeMano; uniform vec4 uCanalMano; uniform vec4 uClaseMano; uniform vec3 uCieloMano;
        varying vec3 vPosMano;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float detalleMano = 0.5;
        {
          // a lo largo de la pieza la textura se estira (veta, cepillado); a lo ancho
          // se combinan las otras dos coordenadas
          vec3 e = normalize(uEjeMano);
          float a = dot(vPosMano, e);
          vec3 resto = vPosMano - e * a;
          vec2 uvM = vec2(a * uClaseMano.x * 0.3, (resto.x + resto.y + resto.z) * uClaseMano.x);
          detalleMano = dot(texture2D(uTexMano, uvM), uCanalMano) + 0.5 * (1.0 - dot(uCanalMano, vec4(1.0)));
          diffuseColor.rgb *= mix(1.0, 0.45 + 1.1 * detalleMano, uClaseMano.y);
        }`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        #if NUM_DIR_LIGHTS > 0
        {
          // brillo especular propio (Blinn-Phong) y un reflejo tenue del cielo en el borde
          vec3 nM = normalize(normal);
          vec3 vM = normalize(vViewPosition);
          vec3 hM = normalize(directionalLights[0].direction + vM);
          float espM = pow(max(dot(nM, hM), 0.0), uClaseMano.w) * uClaseMano.z * (0.6 + 0.8 * detalleMano);
          gl_FragColor.rgb += directionalLights[0].color * espM * 0.35;
          float fresM = pow(1.0 - max(dot(nM, vM), 0.0), 3.0);
          gl_FragColor.rgb += uCieloMano * fresM * uClaseMano.z * 0.25;
        }
        #endif`);
  };
  return m;
}
function fijarEje(m, eje) { if (m.material.userData?.eje) m.material.userData.eje.copy(eje); }

// 2.7: caja con aristas biseladas y normales suaves: de cerca no es un ladrillo.
// Caja de tres tramos por lado: los vértices intermedios se llevan a la línea del
// bisel, las esquinas se meten sobre su esfera y la normal sale del núcleo interior.
function cajaBiselada(ax, ay, az, bisel) {
  const g = new THREE.BoxGeometry(ax, ay, az, 3, 3, 3);
  const p = g.attributes.position, n = g.attributes.normal;
  const med = [ax / 2, ay / 2, az / 2], b = Math.min(bisel, ax * 0.3, ay * 0.3, az * 0.3);
  const v = [0, 0, 0], nu = [0, 0, 0], dentro = [0, 0, 0];
  for (let i = 0; i < p.count; i++) {
    v[0] = p.getX(i); v[1] = p.getY(i); v[2] = p.getZ(i);
    let l = 0;
    for (let k = 0; k < 3; k++) {
      // un vértice intermedio queda a un bisel del borde
      if (Math.abs(Math.abs(v[k]) - med[k]) > 1e-6) v[k] = Math.sign(v[k]) * (med[k] - b);
      dentro[k] = Math.max(-(med[k] - b), Math.min(med[k] - b, v[k]));
      nu[k] = v[k] - dentro[k]; l += nu[k] * nu[k];
    }
    l = Math.sqrt(l) || 1;
    for (let k = 0; k < 3; k++) v[k] = dentro[k] + (nu[k] / l) * b;
    p.setXYZ(i, v[0], v[1], v[2]);
    n.setXYZ(i, nu[0] / l, nu[1] / l, nu[2] / l);
  }
  return g;
}

const EJES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
function palo(material, radio, largo, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio * 1.1, largo, nivelTexturas() > 0 ? 14 : 6), material);
  m.position.set(...pos); m.rotation.set(...rot);
  fijarEje(m, EJES[1]);
  return m;
}
function caja(material, tam, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const geo = nivelTexturas() > 0 ? cajaBiselada(tam[0], tam[1], tam[2], Math.min(...tam) * 0.22) : new THREE.BoxGeometry(...tam);
  const m = new THREE.Mesh(geo, material);
  m.position.set(...pos); m.rotation.set(...rot);
  fijarEje(m, EJES[tam.indexOf(Math.max(...tam))]);
  return m;
}
function bola(material, r, pos = [0, 0, 0], escala = [1, 1, 1]) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, nivelTexturas() > 0 ? 2 : 0), material);
  m.position.set(...pos); m.scale.set(...escala);
  return m;
}

// 2.8: lo personal (ver `personal-armas.js`). `o.armas` es lo elegido en el panel y
// `o.forja` lo forjado que se ve; sin nada, cada modelo queda como siempre.
const OPCIONES_BASE = { armas: armasPorDefecto(), forja: {} };

// 2.8: un mango de madera a lo largo de su eje (Y), con el grabado elegido quemado en la
// madera: aros, una guarda en zigzag o una espiral. Devuelve el grupo del mango.
function mangoGrabado(color, radio, largo, grabado) {
  const m = new THREE.Group();
  m.add(palo(lam(color, 'madera'), radio, largo));
  if (!grabado || grabado === 'ninguno') return m;
  const quemado = lam(tono(color, 0.42), 'madera');
  const r = radio * 1.06;
  if (grabado === 'aros') {
    // tres aros juntos en la empuñadura y uno más arriba
    for (const y of [-0.38, -0.3, -0.22, 0.12]) m.add(palo(quemado, r, 0.006, [0, y * largo, 0]));
    return m;
  }
  if (grabado === 'guarda') {
    // dos bandas en zigzag alrededor del mango, como las de un poncho
    for (const y0 of [-0.3, 0.05]) {
      const banda = [];
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; banda.push(new THREE.Vector3(Math.cos(a) * r, (y0 + (i % 2 ? 0.035 : -0.035)) * largo, Math.sin(a) * r)); }
      m.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(banda, true), 48, radio * 0.13, 3, true), quemado));
    }
    return m;
  }
  // espiral: cuatro vueltas por la mitad de abajo del mango
  const puntos = [];
  for (let i = 0; i <= 64; i++) { const t = i / 64, a = t * Math.PI * 8; puntos.push(new THREE.Vector3(Math.cos(a) * r, (-0.42 + t * 0.5) * largo, Math.sin(a) * r)); }
  m.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos), 96, radio * 0.12, 3, false), quemado));
  return m;
}

// 2.8: las plumas de una flecha o de un virote: `n` aletas alrededor del astil (eje Z)
function plumas(color, n = 3, largo = 0.045, radio = 0.006) {
  const g = new THREE.Group();
  const mat = lam(color, 'liso');
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (n === 2 ? Math.PI / 4 : 0);
    g.add(caja(mat, [0.0016, 0.013, largo], [Math.sin(a) * (radio + 0.0065), Math.cos(a) * (radio + 0.0065), 0], [0, 0, -a]));
  }
  return g;
}

// 2.8: una punta de flecha que mira hacia -Z; encendida si la flecha es de rayo
function puntaFlecha(rayo, r = 0.011, h = 0.04) {
  const p = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), rayo ? new THREE.MeshBasicMaterial({ color: 0x9fe4ff }) : lam('#8a8378', 'metal'));
  p.rotation.x = -Math.PI / 2;
  return p;
}

// Un modelo simple por cada cosa que se puede llevar
const MODELOS = {
  camara() {
    const g = new THREE.Group();
    if (!(nivelTexturas() > 0)) {
      g.add(caja(lam('#4a443c'), [0.2, 0.13, 0.09]));
      g.add(caja(lam('#6b6158'), [0.08, 0.04, 0.02], [0, 0.085, 0]));
      g.add(palo(lam('#2a2620'), 0.045, 0.07, [0, 0, 0.06], [Math.PI / 2, 0, 0]));
      g.add(palo(lam('#6b7a86'), 0.03, 0.02, [0, 0, 0.1], [Math.PI / 2, 0, 0]));
      return g;
    }
    // 2.7: una telemétrica de viaje: cuerpo forrado en cuero, tapas de metal satinado y
    // el objetivo hacia adelante (se ve la espalda con el visor y el costado del lente)
    const cuerpo = lam('#4d463d', 'cuero'), chapa = lam('#8f8d88', 'metal'), negro = lam('#1d1c1a', 'oscuro');
    g.add(caja(cuerpo, [0.15, 0.078, 0.052], [0, 0, 0]));
    g.add(caja(chapa, [0.152, 0.02, 0.054], [0, 0.047, 0]));
    g.add(caja(chapa, [0.152, 0.012, 0.054], [0, -0.043, 0]));
    // visor atrás, arriba a la izquierda, y la ventanita del telémetro adelante
    g.add(caja(lam('#26343c', 'metal'), [0.022, 0.014, 0.006], [-0.048, 0.024, 0.027]));
    g.add(caja(chapa, [0.03, 0.02, 0.006], [0.045, 0.024, -0.027]));
    // objetivo: tubo, anillo de enfoque y vidrio
    const lente = new THREE.Group();
    lente.position.set(0.012, -0.004, -0.026);
    lente.add(palo(negro, 0.026, 0.05, [0, 0, -0.025], [Math.PI / 2, 0, 0]));
    lente.add(palo(chapa, 0.0265, 0.008, [0, 0, -0.012], [Math.PI / 2, 0, 0]));
    lente.add(palo(chapa, 0.0275, 0.006, [0, 0, -0.034], [Math.PI / 2, 0, 0]));
    lente.add(palo(negro, 0.023, 0.01, [0, 0, -0.054], [Math.PI / 2, 0, 0]));
    const vidrio = new THREE.Mesh(new THREE.CircleGeometry(0.016, 20), lam('#1c2a33', 'metal'));
    vidrio.position.z = -0.0595; vidrio.rotation.y = Math.PI;
    lente.add(vidrio);
    g.add(lente);
    // disparador, perilla de avance y ojales de la correa
    g.add(palo(chapa, 0.006, 0.007, [0.052, 0.06, 0.004]));
    g.add(palo(chapa, 0.011, 0.006, [-0.036, 0.059, 0.004]));
    for (const sx of [-1, 1]) g.add(palo(chapa, 0.003, 0.012, [sx * 0.078, 0.03, 0], [0, 0, Math.PI / 2]));
    // se lleva girada con el objetivo hacia el centro de la pantalla: se ve el lente de
    // perfil, la tapa con las perillas y el costado forrado
    g.rotation.set(0.12, 0.62, -0.04);
    g.position.set(-0.035, 0.012, 0.03);
    return g;
  },
  farol() {
    const g = new THREE.Group();
    g.add(palo(lam('#3f3830'), 0.006, 0.09, [0, 0.13, 0]));
    g.add(caja(lam('#3f3830'), [0.11, 0.02, 0.11], [0, 0.085, 0]));
    g.add(caja(lam('#3f3830'), [0.11, 0.02, 0.11], [0, -0.06, 0]));
    const vidrio = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.08), new THREE.MeshBasicMaterial({ color: 0x2a2620 }));
    g.add(vidrio);
    g.userData.vidrio = vidrio;
    return g;
  },
  linterna() {
    const g = new THREE.Group();
    g.add(palo(lam('#3b3a36'), 0.028, 0.18, [0, 0, 0], [Math.PI / 2, 0, 0]));
    const vidrio = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 10), new THREE.MeshBasicMaterial({ color: 0x3a3730 }));
    vidrio.rotation.x = Math.PI / 2;
    vidrio.position.z = 0.1;
    g.add(vidrio);
    g.userData.vidrio = vidrio;
    return g;
  },
  carpa() {
    const g = new THREE.Group();
    g.add(caja(lam('#8a6a3c'), [0.19, 0.1, 0.1]));
    g.add(caja(lam('#6b6152'), [0.2, 0.02, 0.11], [0, 0.03, 0]));
    g.add(palo(lam('#4a3b2c'), 0.012, 0.22, [0, -0.04, 0], [0, 0, Math.PI / 2]));
    return g;
  },
  ramita() {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      g.add(palo(lam(i % 2 ? '#7a5f43' : '#6b5238'), 0.012, 0.26, [i * 0.02 - 0.02, i * 0.015, 0], [0.1 * i, 0, Math.PI / 2 + 0.08 * i]));
    }
    return g;
  },
  pinon() {
    const g = new THREE.Group();
    g.add(bola(lam('#8a6a3c'), 0.05, [0, 0, 0], [0.7, 1.15, 0.7]));
    g.add(palo(lam('#6b5238'), 0.008, 0.04, [0, 0.06, 0]));
    return g;
  },
  calafate() {
    const g = new THREE.Group();
    for (const [x, y, z] of [[0, 0, 0], [0.045, 0.02, 0.01], [0.02, -0.04, -0.02]]) g.add(bola(lam('#3b2a55'), 0.032, [x, y, z]));
    return g;
  },
  frutilla() {
    const g = new THREE.Group();
    g.add(bola(lam('#b8342f'), 0.045, [0, 0, 0], [1, 1.25, 1]));
    g.add(bola(lam('#3f6a2a'), 0.03, [0, 0.05, 0], [1, 0.4, 1]));
    return g;
  },
  pluma() {
    const g = new THREE.Group();
    g.add(palo(lam('#c9bfa6'), 0.005, 0.2, [0, 0, 0], [0, 0, 0.5]));
    g.add(bola(lam('#9aa7b5'), 0.045, [0.03, 0.03, 0], [1.6, 0.5, 0.35]));
    return g;
  },
  canto() {
    const g = new THREE.Group();
    g.add(bola(lam('#8a8378', 'piedra'), 0.055, [0, 0, 0], [1.2, 0.8, 1]));
    return g;
  },
  yerba() {
    const g = new THREE.Group();
    g.add(caja(lam('#8a7a58'), [0.13, 0.17, 0.06]));
    g.add(caja(lam('#6b5f44'), [0.13, 0.04, 0.062], [0, 0.07, 0]));
    return g;
  },
  hacha(o = OPCIONES_BASE) {
    const g = new THREE.Group();
    // 2.8: el mango con la madera y el grabado elegidos
    const mango = mangoGrabado(o.armas.mango, 0.016, 0.32, o.armas.grabado);
    mango.rotation.z = 0.3;
    g.add(mango);
    const cabeza = new THREE.Group();
    cabeza.position.set(0.048, 0.155, 0);
    cabeza.rotation.z = 0.3;
    cabeza.add(caja(lam('#8e8d86', 'metal'), [0.045, 0.075, 0.032], [0, 0, 0]));
    cabeza.add(caja(lam('#b8b6ac', 'metal'), [0.022, 0.085, 0.028], [0.03, 0, 0]));
    cabeza.add(caja(lam('#6f6e68', 'metal'), [0.032, 0.03, 0.04], [-0.018, -0.02, 0]));
    g.add(cabeza);
    return g;
  },
  tronco() {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.26, 8), lam('#6b5238'));
    m.rotation.z = Math.PI / 2;
    g.add(m);
    for (const sx of [-1, 1]) {
      const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.008, 8), lam('#8a6b4a'));
      tapa.rotation.z = Math.PI / 2;
      tapa.position.x = sx * 0.132;
      g.add(tapa);
    }
    return g;
  },
  tabla() {
    const g = new THREE.Group();
    g.add(caja(lam('#8a6b4a'), [0.32, 0.018, 0.09], [0, 0, 0], [0, 0, 0.06]));
    g.add(caja(lam('#9a7a55'), [0.32, 0.018, 0.09], [0, 0.026, 0], [0, 0, 0.02]));
    return g;
  },
  piedra() {
    const g = new THREE.Group();
    g.add(bola(lam('#7d766c', 'piedra'), 0.06, [0, 0, 0], [1.2, 0.85, 1]));
    g.add(bola(lam('#8f887d', 'piedra'), 0.04, [0.04, 0.03, 0.01]));
    return g;
  },
  mosca() {
    const g = new THREE.Group();
    g.add(bola(lam('#b8342f'), 0.02, [0, 0, 0], [1.6, 1, 1]));
    g.add(palo(lam('#9a8f7c'), 0.004, 0.09, [0.03, 0.02, 0], [0, 0, -0.9]));
    return g;
  },
  // ---- modo Desafío
  lanza(o = OPCIONES_BASE) {
    const g = new THREE.Group();
    g.add(palo(lam('#6b5238'), 0.014, 0.9, [0, 0, -0.18], [Math.PI / 2 - 0.12, 0, 0]));
    // 2.8: forjada con hielo, la punta queda escarchada y con cristales de escarcha
    const hielo = !!o.forja.lanza;
    const punta = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 5), hielo ? lam('#bfe6f5', 'metal') : lam('#8a8378'));
    punta.position.set(0, 0.07, -0.63);
    punta.rotation.x = -Math.PI / 2 - 0.12;
    g.add(punta);
    if (hielo) {
      const escarcha = new THREE.MeshBasicMaterial({ color: 0xd8f4ff });
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26;
        g.add(bola(escarcha, 0.009 + (i % 2) * 0.004, [Math.cos(a) * 0.022, 0.066 + Math.sin(a) * 0.022, -0.6 + (i % 3) * 0.02], [1, 1.8, 1]));
      }
    }
    g.add(caja(lam('#c9bfa6'), [0.035, 0.035, 0.05], [0, 0.055, -0.54], [-0.12, 0, 0]));
    // 2.8: las cintas atadas debajo de la punta; se mecen al caminar (ver `actualizar`)
    if (o.armas.conCintas) {
      const cintas = new THREE.Group();
      cintas.position.set(0, 0.04, -0.54);
      const tela = lam(o.armas.cinta, 'liso');
      cintas.add(caja(tela, [0.014, 0.17, 0.003], [0.008, -0.085, 0], [0, 0.2, 0.12]));
      cintas.add(caja(tela, [0.012, 0.13, 0.003], [-0.008, -0.065, 0.006], [0, -0.3, -0.1]));
      g.add(cintas);
      g.userData.cintas = cintas;
    }
    return g;
  },
  arco(o = OPCIONES_BASE) {
    const g = new THREE.Group();
    const curva = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 5, 16, Math.PI * 0.75), lam('#7a5f43'));
    curva.rotation.set(0, Math.PI / 2, Math.PI / 2 + Math.PI * 0.375);
    curva.position.set(0, 0, -0.08);
    g.add(curva);
    g.add(palo(lam('#d8cfbe'), 0.002, 0.5, [0, 0, 0.03]));
    g.add(palo(lam('#6b5238'), 0.006, 0.55, [0, 0, -0.12], [Math.PI / 2, 0, 0]));
    // 2.8: la flecha lleva sus plumas del color elegido y la punta; si es de rayo, encendida
    const pl = plumas(o.armas.plumas, 3);
    pl.position.z = 0.118;
    g.add(pl);
    const punta = puntaFlecha(!!o.forja.arco);
    punta.position.z = -0.412;
    g.add(punta);
    g.rotation.z = -0.35;
    return g;
  },
  pistola() {
    const g = new THREE.Group();
    g.add(caja(lam('#9aa0a6'), [0.06, 0.07, 0.26], [0, 0, -0.05]));
    g.add(caja(lam('#6d7278'), [0.05, 0.13, 0.06], [0, -0.08, 0.05], [0.25, 0, 0]));
    const boca = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0x7dfff0 }));
    boca.position.set(0, 0.01, -0.19);
    g.add(boca);
    g.add(caja(new THREE.MeshBasicMaterial({ color: 0x7dfff0 }), [0.062, 0.012, 0.14], [0, 0.03, -0.05]));
    return g;
  },
  honda(o = OPCIONES_BASE) {
    const g = new THREE.Group();
    g.add(palo(lam('#6b5238'), 0.004, 0.34, [-0.05, 0.02, -0.02], [0.2, 0, 0.5]));
    g.add(palo(lam('#6b5238'), 0.004, 0.34, [0.05, 0.02, -0.02], [0.2, 0, -0.5]));
    g.add(bola(lam('#8a6a3c'), 0.04, [0, -0.1, 0], [1.2, 0.5, 1]));
    if (o.forja.honda) {
      // 2.8: la honda de empuje carga un cristal en la badana
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.028, 4, 2), new THREE.MeshBasicMaterial({ color: 0x7dfff0 }));
      c.position.set(0, -0.078, 0); c.scale.set(0.9, 1.3, 0.9);
      g.add(c);
    } else g.add(bola(lam('#8a8378'), 0.03, [0, -0.08, 0]));
    return g;
  },
  boleadoras() {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1;
      g.add(bola(lam('#7d766c'), 0.04, [Math.cos(a) * 0.09, -0.08 - i * 0.03, Math.sin(a) * 0.05]));
      g.add(palo(lam('#8a6a3c'), 0.003, 0.12, [Math.cos(a) * 0.045, -0.03 - i * 0.015, Math.sin(a) * 0.025], [0, 0, a]));
    }
    return g;
  },
  martillo(o = OPCIONES_BASE) {
    const g = new THREE.Group();
    const mango = mangoGrabado(o.armas.mango, 0.014, 0.3, o.armas.grabado);   // 2.8
    mango.rotation.z = 0.25;
    g.add(mango);
    g.add(caja(lam('#6f6e68'), [0.12, 0.045, 0.045], [0.04, 0.15, 0], [0, 0, 0.25]));
    return g;
  },
  // ---- 2.5: el arsenal
  ballesta(o = OPCIONES_BASE) {
    const g = new THREE.Group();
    g.add(caja(lam('#6b5238'), [0.05, 0.05, 0.42], [0, 0, -0.1]));
    const arco = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 5, 14, Math.PI * 0.8), lam('#7a5f43'));
    arco.rotation.set(Math.PI / 2, 0, Math.PI * 1.1);
    arco.position.set(0, 0.02, -0.27);
    g.add(arco);
    g.add(caja(lam('#5a4630'), [0.03, 0.08, 0.05], [0, -0.06, 0.06], [0.3, 0, 0]));
    // 2.8: el virote cargado, con sus plumas; y, si es de repetición, el cargador arriba
    g.add(palo(lam('#7a5f43'), 0.0045, 0.28, [0, 0.03, -0.17], [Math.PI / 2, 0, 0]));
    const pl = plumas(o.armas.plumas, 2, 0.035, 0.0045);
    pl.position.set(0, 0.03, -0.05);
    g.add(pl);
    const punta = puntaFlecha(false, 0.008, 0.03);
    punta.position.set(0, 0.03, -0.325);
    g.add(punta);
    if (o.forja.ballesta) g.add(caja(lam('#4a3b2c', 'madera'), [0.036, 0.05, 0.1], [0, 0.058, -0.1]));
    // 2.8: el nombre, en una chapita de bronce a cada lado de la caja
    if (o.armas.nombreBallesta) {
      for (const lado of [-1, 1]) {
        const chapa = cartelNombre(o.armas.nombreBallesta, 0.15, 0.028, { fondo: '#b89a5c', tinta: '#2e2414', borde: '#7a6436', cursiva: true });
        chapa.position.set(lado * 0.0262, -0.002, -0.06);
        chapa.rotation.y = lado * Math.PI / 2;
        g.add(chapa);
      }
    }
    return g;
  },
  facon() {
    const g = new THREE.Group();
    g.add(caja(lam('#6b5238'), [0.03, 0.03, 0.11], [0, 0, 0.02]));
    g.add(caja(lam('#b89a5c'), [0.06, 0.015, 0.015], [0, 0, -0.04]));
    g.add(caja(lam('#c9ccd0'), [0.028, 0.006, 0.2], [0, 0, -0.15]));
    return g;
  },
  maza() {
    const g = new THREE.Group();
    g.add(palo(lam('#6b5238'), 0.016, 0.42, [0, 0.05, 0], [0, 0, 0.25]));
    g.add(bola(lam('#5a4630'), 0.075, [0.05, 0.25, 0]));
    for (let i = 0; i < 6; i++) { const a = i * 1.05; g.add(caja(lam('#b4b0a8'), [0.02, 0.02, 0.02], [0.05 + Math.cos(a) * 0.075, 0.25 + Math.sin(a) * 0.075, 0])); }
    return g;
  },
  arpon() {
    const g = new THREE.Group();
    g.add(palo(lam('#6b5238'), 0.012, 0.7, [0, 0, -0.1], [Math.PI / 2 - 0.1, 0, 0]));
    const punta = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 6), new THREE.MeshBasicMaterial({ color: 0x7dfff0 }));
    punta.position.set(0, 0.04, -0.5); punta.rotation.x = -Math.PI / 2 - 0.1;
    g.add(punta);
    return g;
  },
  hachuela(o = OPCIONES_BASE) {
    const g = new THREE.Group();
    const mango = mangoGrabado(o.armas.mango, 0.012, 0.26, o.armas.grabado);   // 2.8
    mango.rotation.z = 0.2;
    g.add(mango);
    g.add(caja(lam('#8f8b84'), [0.09, 0.06, 0.012], [0.035, 0.12, 0], [0, 0, 0.2]));
    return g;
  },
  jabalina() {
    const g = new THREE.Group();
    g.add(palo(lam('#6b5238'), 0.011, 1.0, [0, 0.02, -0.2], [Math.PI / 2 - 0.08, 0, 0]));
    const punta = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.1, 5), lam('#8a8378'));
    punta.position.set(0, 0.06, -0.72); punta.rotation.x = -Math.PI / 2 - 0.08;
    g.add(punta);
    return g;
  },
  granada() {
    const g = new THREE.Group();
    g.add(bola(new THREE.MeshBasicMaterial({ color: 0x7dfff0 }), 0.05));
    g.add(caja(lam('#6b5238'), [0.02, 0.03, 0.02], [0, 0.055, 0]));
    return g;
  },
  humo() {
    const g = new THREE.Group();
    g.add(bola(lam('#3c3a36'), 0.055));
    g.add(palo(lam('#8a6a3c'), 0.004, 0.06, [0, 0.06, 0]));
    return g;
  },
  bengala() {
    const g = new THREE.Group();
    g.add(palo(lam('#a8322b'), 0.014, 0.18, [0, 0, 0]));
    g.add(bola(new THREE.MeshBasicMaterial({ color: 0xffd2a0 }), 0.018, [0, 0.1, 0]));
    return g;
  },
  cuerno() {
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 6, 12, Math.PI * 0.9), lam('#d9c9a6'));
    c.rotation.set(0, Math.PI / 2, 0.4);
    g.add(c);
    return g;
  },
  emplasto() {
    const g = new THREE.Group();
    g.add(caja(lam('#c9bfa6'), [0.13, 0.03, 0.09]));
    g.add(caja(lam('#4b7a4b'), [0.03, 0.032, 0.07], [0, 0.002, 0]));
    return g;
  },
  cristal() {
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 2), new THREE.MeshBasicMaterial({ color: 0x7dfff0 }));
    c.scale.set(0.8, 1.4, 0.8);
    g.add(c);
    return g;
  },
};

export function crearEnMano(camara) {
  const pivote = new THREE.Group();
  pivote.position.set(0.34, -0.28, -0.5);
  camara.add(pivote);
  const soporte = new THREE.Group();
  pivote.add(soporte);

  const hechos = new Map();
  let actual = null, idActual = null;
  let paso = 0, gesto = 0, entrada = 0;
  // 2.8: lo personal. `firmas` dice con qué se armó cada modelo: si cambió lo elegido o lo
  // forjado, se vuelve a armar la próxima vez que lo saques.
  let personal = armasPorDefecto(), cosas = () => ({});
  const firmas = new Map();
  const opcionesDe = () => ({ armas: personal, forja: forjaVisible(personal, cosas()) });
  function soltarModelo(id) {
    const g = hechos.get(id);
    if (!g) return;
    soporte.remove(g);
    desechar(g);
    hechos.delete(id);
    firmas.delete(id);
  }

  function mostrar(id) {
    if (id === idActual) return;
    idActual = id;
    if (actual) actual.visible = false;
    actual = null;
    if (!id || !Object.hasOwn(MODELOS, id)) return;   // 2.6.1: sólo modelos propios
    const op = opcionesDe();
    const firma = firmaArma(id, op.armas, op.forja);
    if (hechos.has(id) && firmas.get(id) !== firma) soltarModelo(id);
    if (!hechos.has(id)) {
      const g = MODELOS[id](op);
      firmas.set(id, firma);
      // 2.7.1: las piezas que comparten material se dibujan juntas (la cámara nueva son
      // quince piezas: serían quince llamadas de dibujo por cuadro)
      if (nivelTexturas() > 0) { fusionarPorMaterial(g); g.traverse((o) => { if (o.isGroup && o !== g) fusionarPorMaterial(o); }); }
      g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } });
      soporte.add(g);
      hechos.set(id, g);
    }
    actual = hechos.get(id);
    actual.visible = true;
    entrada = 1;          // aparece desde abajo
  }

  // 2.5: el escudo de tablas, en la otra mano, sólo mientras bloqueás con él
  const rodela = (() => {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) g.add(caja(lam(i % 2 ? '#8a6b4a' : '#7a5f43'), [0.075, 0.34, 0.02], [-0.11 + i * 0.075, 0, 0]));
    g.add(caja(lam('#5a4630'), [0.32, 0.03, 0.025], [0, 0.1, -0.01]));
    g.add(caja(lam('#5a4630'), [0.32, 0.03, 0.025], [0, -0.1, -0.01]));
    g.position.set(-0.52, -0.02, -0.2);
    g.rotation.set(0, 0.35, 0);
    g.visible = false;
    pivote.add(g);
    return g;
  })();
  let tensado = 0;
  function usar() { gesto = 1; }

  // 2.8: lo elegido en "Personalizar" (ver `personal-armas.js`). `leerCosas` devuelve lo
  // que tenés (progreso.cosas) para saber qué está forjado.
  function personalizar(datos, leerCosas) {
    if (datos && typeof datos === 'object') personal = { ...armasPorDefecto(), ...datos };
    if (typeof leerCosas === 'function') cosas = leerCosas;
    // lo que está en la mano cambia ya; lo demás, al sacarlo
    const id = idActual;
    if (id && hechos.has(id) && firmas.get(id) !== firmaArma(id, personal, forjaVisible(personal, cosas()))) {
      const e = entrada;
      idActual = null;
      mostrar(id);
      entrada = e;
    }
  }

  function actualizar(dt, estado) {
    // 2.6.1: sin nada en la mano (la caña, el grabador) el escudo quedaba a la vista
    // si se cambiaba de casillero mientras se bloqueaba
    if (!actual) { rodela.visible = false; return; }
    // el balanceo del caminar
    paso += dt * (2 + (estado.velocidad || 0) * 2.6);
    const anda = (estado.velocidad || 0) > 0.4 && estado.enSuelo;
    const bal = anda ? Math.sin(paso * 2) * 0.035 : Math.sin(paso * 0.6) * 0.008;
    const vert = anda ? Math.abs(Math.cos(paso * 2)) * 0.028 : Math.sin(paso * 0.45) * 0.006;
    gesto = Math.max(0, gesto - dt * 3.4);
    entrada = Math.max(0, entrada - dt * 4);
    const amplio = idActual === 'hacha' || idActual === 'martillo' || idActual === 'maza' ? 1.7 : 1;
    rodela.visible = !!estado.bloqueo && idActual !== 'lanza' && !estado.oculto;
    // 2.5: el arco se tensa mientras está el clic apretado
    tensado = estado.tension ? Math.min(1, tensado + dt * 1.1) : Math.max(0, tensado - dt * 6);
    if (idActual === 'arco' && tensado > 0) {
      soporte.position.set(bal * 0.3, -vert * 0.3 - entrada * 0.35, 0.06 * tensado);
      soporte.rotation.set(entrada * 0.6, 0, -0.1 - tensado * 0.25);
      actual.visible = !estado.oculto;
      return;
    }
    // lanza cruzada al bloquear
    if (idActual === 'lanza' && estado.bloqueo) {
      soporte.position.set(-0.18, 0.08 - entrada * 0.35, -0.05);
      soporte.rotation.set(0.2, 0, 1.25);
      actual.visible = !estado.oculto;
      return;
    }
    const golpe = Math.sin(Math.min(1, gesto) * Math.PI) * amplio;
    // 2.8: las cintas de la lanza se mecen con el paso y vuelan con el golpe
    const cintas = actual.userData.cintas;
    if (cintas) { cintas.rotation.x = Math.sin(paso * 2.2) * 0.22 + golpe * 0.7; cintas.rotation.z = Math.sin(paso * 1.3 + 1) * 0.15; }
    if (idActual === 'lanza') {
      // la lanza se clava hacia adelante en lugar de balancearse
      soporte.position.set(bal, -vert - entrada * 0.35, -golpe * 0.45);
      soporte.rotation.set(entrada * 0.6, bal * 2.4, -0.1);
    } else if (idActual === 'arco' || idActual === 'pistola') {
      // retroceso corto al disparar
      soporte.position.set(bal, -vert - entrada * 0.35 + golpe * 0.02, golpe * 0.08);
      soporte.rotation.set(golpe * 0.25 + entrada * 0.6, bal * 2.4, -0.1);
    } else {
      soporte.position.set(bal, -vert - entrada * 0.35 - golpe * 0.06, golpe * 0.12);
      soporte.rotation.set(-golpe * 0.9 + entrada * 0.6, bal * 2.4, -0.15 - golpe * 0.25);
    }
    // el vidrio del farol se enciende cuando está prendido
    const vidrio = actual.userData.vidrio;
    if (vidrio) vidrio.material.color.setHex(estado.luz ? 0xffd79a : 0x2a2620);
    actual.visible = !estado.oculto;
  }

  const api = { mostrar, usar, actualizar, pivote, personalizar, personal: () => personal, modelo: (id) => hechos.get(id) || null };
  // 2.8: para encontrarlo desde la cámara (las pruebas de humo)
  pivote.userData.enMano = api;
  return api;
}
