// 3.7.4: lo que se ve de la vida social en el mundo:
//   · arriba de las cabezas, mientras charlan (vos con un vecino o ellos entre ellos), la burbuja con el ícono del tema
//     y, debajo, un renglón corto; y la emoción (contento, enojado, cansado, enamorado, triste) como un ícono chico.
//     Barato: todas las burbujas, íconos y emociones son UN solo dibujo (una malla instanciada de cuadraditos que miran
//     a la cámara, con el atlas de social-iconos.js de textura), sólo cerca (22 m) y a lo sumo 24 cosas a la vez. El
//     programa se compila en la carga (`paraCompilar`), nunca a mitad del juego. Los renglones son a lo sumo cuatro
//     carteles del DOM (sólo los más cercanos, a 14 m), proyectados debajo de su burbuja;
//   · tus manos en primera persona para las interacciones que las usan (chocar los cinco, el abrazo, de la mano,
//     consolar, las cartas, la foto, bailar lento): la malla de tu mano (la de «Tu personaje») dos veces, colgada de la
//     cámara; sólo mientras dura el gesto (dos dibujos más, un par de segundos).
import * as THREE from 'three';
import { celdaIcono, LADO_ATLAS } from './social-iconos.js';

export const BURBUJAS = { maxCosas: 24, lejos: 22, lejosRenglon: 14, maxRenglones: 4, durBurbuja: 3.6, durEmocion: 5 };

const VERT = /* glsl */`
attribute vec3 aCentro;
attribute vec4 aCelda;   // columna, fila, tamaño (m), alfa
attribute vec2 aDesp;    // corrimiento en la pantalla (m)
uniform float uLado;
varying vec2 vUv;
varying float vAlfa;
void main() {
  vec4 mv = modelViewMatrix * vec4(aCentro, 1.0);
  mv.xy += aDesp + position.xy * aCelda.z;
  gl_Position = projectionMatrix * mv;
  vUv = (vec2(aCelda.x, uLado - 1.0 - aCelda.y) + uv) / uLado;
  vAlfa = aCelda.w;
}`;
const FRAG = /* glsl */`
uniform sampler2D uAtlas;
varying vec2 vUv;
varying float vAlfa;
void main() {
  vec4 c = texture2D(uAtlas, vUv);
  if (c.a * vAlfa < 0.03) discard;
  gl_FragColor = vec4(c.rgb, c.a * vAlfa);
  #include <colorspace_fragment>
}`;

// `opciones`: { escena, camara, atlas (el lienzo de dibujarAtlas), capa (el elemento del HUD para los renglones) }
export function crearSocialMundo({ escena, camara, atlas, capa = null }) {
  const N = BURBUJAS.maxCosas;
  const geo = new THREE.InstancedBufferGeometry();
  const base = new THREE.PlaneGeometry(1, 1);
  geo.index = base.index;
  geo.setAttribute('position', base.getAttribute('position'));
  geo.setAttribute('uv', base.getAttribute('uv'));
  const aCentro = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  const aCelda = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4);
  const aDesp = new THREE.InstancedBufferAttribute(new Float32Array(N * 2), 2);
  for (const a of [aCentro, aCelda, aDesp]) a.setUsage?.(35048 /* DynamicDrawUsage */);
  geo.setAttribute('aCentro', aCentro); geo.setAttribute('aCelda', aCelda); geo.setAttribute('aDesp', aDesp);
  geo.instanceCount = 0;
  const tex = new THREE.CanvasTexture(atlas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.anisotropy = 2;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uAtlas: { value: tex }, uLado: { value: LADO_ATLAS } },
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: true, toneMapped: false, fog: false,
  });
  const malla = new THREE.Mesh(geo, mat);
  malla.frustumCulled = false;
  malla.renderOrder = 20;
  malla.visible = false;
  malla.name = 'social-burbujas';
  escena.add(malla);

  // npc → { b: { icono, renglon, hasta, t }, e: { icono, hasta, t } }
  const cosas = new Map();
  let reloj = 0;
  function burbuja(npc, icono, { renglon = '', dur = BURBUJAS.durBurbuja } = {}) {
    if (!npc?.pos || !icono) return;
    const c = cosas.get(npc) || {};
    c.b = { icono, renglon: String(renglon || ''), hasta: reloj + dur, t: reloj };
    cosas.set(npc, c);
  }
  function emocion(npc, icono, { dur = BURBUJAS.durEmocion } = {}) {
    if (!npc?.pos || !icono) return;
    const c = cosas.get(npc) || {};
    c.e = { icono, hasta: reloj + dur, t: reloj };
    cosas.set(npc, c);
  }
  function quitar(npc, que = null) {
    const c = cosas.get(npc);
    if (!c) return;
    if (!que || que === 'burbuja') c.b = null;
    if (!que || que === 'emocion') c.e = null;
    if (!c.b && !c.e) cosas.delete(npc);
  }

  // los renglones (DOM): unos pocos carteles que se reusan
  const carteles = [];
  function cartel(i) {
    if (!capa) return null;
    while (carteles.length <= i) {
      const d = document.createElement('div');
      d.className = 'renglon-social oculto';
      capa.appendChild(d);
      carteles.push({ el: d, texto: '', visto: false });
    }
    return carteles[i];
  }

  const v = new THREE.Vector3(), adelante = new THREE.Vector3();
  const cercanos = [];
  let usados = 0, ultimoConteo = -1;
  function poner(x, y, z, icono, tam, alfa, dx = 0, dy = 0) {
    if (usados >= N) return;
    const { col, fila } = celdaIcono(icono);
    aCentro.setXYZ(usados, x, y, z);
    aCelda.setXYZW(usados, col, fila, tam, alfa);
    aDesp.setXY(usados, dx, dy);
    usados++;
  }
  const entra = (c, ahora) => Math.min(1, (ahora - c.t) / 0.18);
  const sale = (c, ahora) => Math.min(1, Math.max(0, (c.hasta - ahora) / 0.35));
  // Cada cuadro: `pos`, la tuya (para lo de cerca)
  let tapado = null;   // (el de la rueda abierta: su burbuja la taparía la barra de arriba)
  function actualizar(dt, pos, sinBurbuja = null) {
    tapado = sinBurbuja;
    reloj += Math.max(0, Math.min(0.25, dt || 0));
    usados = 0;
    cercanos.length = 0;
    if (camara) camara.getWorldDirection(adelante);
    for (const [npc, c] of cosas) {
      if (c.b && c.b.hasta <= reloj) c.b = null;
      if (c.e && c.e.hasta <= reloj) c.e = null;
      if (!c.b && !c.e) { cosas.delete(npc); continue; }
      if (!npc.pos || npc.dormido || npc.g?.visible === false || npc === tapado) continue;
      const d = pos ? Math.hypot(npc.pos.x - pos.x, npc.pos.z - pos.z) : 0;
      if (d > BURBUJAS.lejos) continue;
      // detrás de la cámara no se manda nada
      if (camara && (npc.pos.x - camara.position.x) * adelante.x + (npc.pos.z - camara.position.z) * adelante.z < -0.5) continue;
      cercanos.push({ npc, c, d });
    }
    cercanos.sort((a, b) => a.d - b.d);
    let renglones = 0;
    for (const { npc, c, d } of cercanos) {
      const s = npc.g?.scale?.y || 1;
      const k = Math.min(2.1, Math.max(1, d / 7));   // de lejos, un poco más grandes (se leen igual)
      const y = npc.pos.y + (npc.animSocial?.id === 'cartas' ? 1.3 : 2.02) * s + 0.1 * k;
      if (c.b) {
        const a = entra(c.b, reloj) * sale(c.b, reloj);
        const pop = 0.75 + 0.25 * entra(c.b, reloj);
        poner(npc.pos.x, y, npc.pos.z, 'burbuja', 0.5 * k * pop, a);
        poner(npc.pos.x, y, npc.pos.z, c.b.icono, 0.3 * k * pop, a, 0, 0.03 * k);
        if (c.b.renglon && d < BURBUJAS.lejosRenglon && renglones < BURBUJAS.maxRenglones) {
          const r = cartel(renglones);
          if (r && camara) {
            v.set(npc.pos.x, y - 0.3 * k, npc.pos.z).project(camara);
            if (v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1) {
              const w = window.innerWidth, h = window.innerHeight;
              const px = Math.round((v.x * 0.5 + 0.5) * w), py = Math.round((-v.y * 0.5 + 0.5) * h);
              if (r.texto !== c.b.renglon) { r.el.textContent = c.b.renglon; r.texto = c.b.renglon; }
              r.el.style.transform = `translate(${px}px, ${py}px) translate(-50%, 0)`;
              r.el.style.opacity = a.toFixed(2);
              if (!r.visto) { r.el.classList.remove('oculto'); r.visto = true; }
              renglones++;
            }
          }
        }
      }
      if (c.e) {
        const a = entra(c.e, reloj) * sale(c.e, reloj);
        // con burbuja, la emoción va al costado; sola, arriba de la cabeza
        const dx = c.b ? 0.33 * k : 0, dy = c.b ? 0.12 * k : -0.1 * k;
        poner(npc.pos.x, y, npc.pos.z, 'globo', 0.26 * k, a, dx, dy);
        poner(npc.pos.x, y, npc.pos.z, c.e.icono, 0.2 * k, a, dx, dy);
      }
    }
    for (let i = renglones; i < carteles.length; i++) if (carteles[i].visto) { carteles[i].el.classList.add('oculto'); carteles[i].visto = false; }
    geo.instanceCount = usados;
    malla.visible = usados > 0;
    if (usados) { aCentro.needsUpdate = true; aCelda.needsUpdate = true; aDesp.needsUpdate = true; }
    ultimoConteo = usados;
  }
  // En la carga: la malla a la vista (con una cosa invisible) para que se compile con lo demás; después, `listo()`.
  function paraCompilar() {
    poner(0, -500, 0, 'burbuja', 0.01, 0);
    geo.instanceCount = 1; usados = 0;
    malla.visible = true;
  }
  function listo() { if (!usados) { geo.instanceCount = 0; malla.visible = false; } }
  return {
    burbuja, emocion, quitar, actualizar, paraCompilar, listo, malla,
    // (para las pruebas y el diagnóstico)
    estado: () => ({ cosas: cosas.size, dibujadas: ultimoConteo, renglones: carteles.filter((c) => c.visto).map((c) => c.texto) }),
    de: (npc) => { const c = cosas.get(npc); return c ? { burbuja: c.b ? { icono: c.b.icono, renglon: c.b.renglon } : null, emocion: c.e ? c.e.icono : null } : null; },
  };
}

// ---------------------------------------------------------------- tus manos
// `mallaMano()`: la malla de tu mano de ahora (personal-personaje-mundo.js la rearma al cambiar la ropa).
// Los gestos: dónde va cada mano (en la cámara: x a la derecha, y arriba, z hacia atrás) a los `s` segundos.
const GESTOS_MANO = {
  cinco: { dur: 1.6, der: (s) => { const sube = Math.min(1, s / 0.45), baja = s > 1.1 ? Math.min(1, (s - 1.1) / 0.4) : 0, golpe = Math.max(0, 1 - Math.abs(s - 0.6) / 0.1); return [0.16, -0.42 + 0.48 * sube * (1 - baja), -0.52 - golpe * 0.08, -0.9 * sube * (1 - baja), 0, 0.2]; } },
  saludar: { dur: 2, der: (s) => [0.28, 0.02, -0.62, -0.7, 0, 0.35 + Math.sin(s * 10) * 0.35] },
  abrazar: { dur: 2.6, izq: (s) => { const c = Math.min(1, s / 0.6); return [-0.38 + c * 0.14, -0.16, -0.46, -0.5, 0.5 - c * 0.3, 0.6]; }, der: (s) => { const c = Math.min(1, s / 0.6); return [0.38 - c * 0.14, -0.16, -0.46, -0.5, -0.5 + c * 0.3, -0.6]; } },
  mano: { dur: 3.4, der: () => [0.2, -0.44, -0.46, 0.2, 0, -0.3] },
  consolar: { dur: 3.4, der: (s) => [0.12, -0.08 + Math.sin(s * 4) * 0.015, -0.62, -0.5, 0, 0.2] },
  cartas: { dur: 6, izq: () => [-0.13, -0.36, -0.42, -0.4, 0.2, 0.4], der: (s) => [0.13, -0.36 + Math.max(0, Math.sin(s * 1.7)) ** 6 * 0.06, -0.42 - Math.max(0, Math.sin(s * 1.7)) ** 6 * 0.08, -0.4, -0.2, -0.4] },
  foto: { dur: 3, izq: () => [-0.17, -0.2, -0.52, -0.3, 0.25, 0.5], der: () => [0.17, -0.2, -0.52, -0.3, -0.25, -0.5] },
  'bailar-lento': { dur: 6, izq: (s) => [-0.24 + Math.sin(s * 1.9) * 0.02, -0.14, -0.46, -0.6, 0.4, 0.5], der: (s) => [0.24 + Math.sin(s * 1.9) * 0.02, -0.2, -0.46, -0.4, -0.4, -0.5] },
  beso: { dur: 2.6, izq: () => [-0.3, -0.3, -0.44, -0.3, 0.3, 0.5], der: () => [0.3, -0.3, -0.44, -0.3, -0.3, -0.5] },
  discutir: { dur: 3.4, der: (s) => [0.22, -0.26 + Math.sin(s * 7.5) * 0.08, -0.55, -0.5, 0, 0.3] },
  chiste: { dur: 3.2, izq: (s) => [-0.24, -0.3 + Math.sin(s * 5) * 0.05, -0.55, -0.3, 0, 0.4], der: (s) => [0.24, -0.28 + Math.sin(s * 5 + 2) * 0.06, -0.55, -0.3, 0, -0.4] },
};
GESTOS_MANO['abrazo-largo'] = { ...GESTOS_MANO.abrazar, dur: 4.4 };
// los ids de vecindad-social.js (ANIM_JUGADOR) que usan tus manos; los demás (hablar, ignorar, pescar...) no las muestran
export const MANOS_DE = {
  saludar: 'saludar', abrazar: 'abrazar', 'abrazo-largo': 'abrazo-largo', 'chocar-cinco': 'cinco', 'tomar-mano': 'mano', 'palmada-hombro': 'consolar',
  'jugar-cartas': 'cartas', posar: 'foto', besar: 'beso', 'bailar-lento': 'bailar-lento', bailar: 'bailar-lento', discutir: 'discutir', quejarse: 'discutir',
  contar: 'chiste', 'hacer-broma': 'chiste', aplaudir: 'chiste', 'pedir-perdon': 'consolar',
};
export const GESTOS_CON_MANOS = Object.keys(MANOS_DE);
export function crearManosSociales(camara, mallaMano) {
  const grupo = new THREE.Group();
  grupo.name = 'manos-sociales';
  grupo.visible = false;
  camara.add(grupo);
  const manos = [new THREE.Mesh(), new THREE.Mesh()];
  manos[0].scale.x = -1;   // la izquierda, espejada
  for (const m of manos) { m.frustumCulled = false; m.renderOrder = 5; grupo.add(m); }
  let gesto = null, t = 0;
  function empezar(id) {
    const g = GESTOS_MANO[MANOS_DE[id] || id];
    const fuente = mallaMano?.();
    if (!g || !fuente?.geometry) { gesto = null; grupo.visible = false; return false; }
    for (const m of manos) { m.geometry = fuente.geometry; m.material = fuente.material; }
    gesto = { id, ...g }; t = 0;
    return true;
  }
  function actualizar(dt) {
    if (!gesto) return;
    t += dt;
    if (t > gesto.dur) { gesto = null; grupo.visible = false; return; }
    grupo.visible = true;
    const entra = Math.min(1, t / 0.25), sale = Math.min(1, (gesto.dur - t) / 0.3), w = Math.min(entra, sale);
    for (const [i, lado] of [[0, 'izq'], [1, 'der']]) {
      const f = gesto[lado], m = manos[i];
      m.visible = !!f;
      if (!f) continue;
      const [x, y, z, rx, ry, rz] = f(t);
      // entra desde abajo de la pantalla
      m.position.set(x, y - (1 - w) * 0.35, z);
      m.rotation.set(rx, ry, rz);
    }
  }
  return { empezar, actualizar, grupo, activo: () => !!gesto, gesto: () => gesto?.id || null };
}
