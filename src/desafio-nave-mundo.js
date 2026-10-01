// 3.0: adentro de la nave nodriza (ver `desafio-nave.js` para las reglas de la pelea).
//
// La cámara de adentro se arma por código, como todo: un piso de carne con venas que
// brillan, un domo de costillas, racimos de cristal, vainas en la pared de donde salen
// las crías y, en el medio, la Madre. Queda muy arriba del lugar donde se asentó la nave
// (cientos de metros): al subir por el haz se lleva al jugador hasta ahí, se esconde el
// valle, la niebla se cierra y la luz pasa a ser la de adentro. Al salir, todo vuelve.
//
// Las crías son invasores del mismo pool de siempre, marcados con `enNave`: las armas,
// la muerte y los cristales van por el camino de siempre, pero el andar lo maneja este
// módulo (el de afuera los pegaría al terreno del valle).
import * as THREE from 'three';
import { SALUD_MAX, dificultad } from './desafio-reglas.js';
import { NAVE, AVISO_FASE, naveNueva, puntosActivos, herirPunto, avanzarNave, criasDeFase, fraccionNave, textoNave, tocaOnda, tocaPua, dentroDeArena, fueraDelCuerpo, indiceFase } from './desafio-nave.js';
import { debilidadNave } from './desafio-asedio.js';

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Color();
const ARRIBA = new THREE.Vector3(0, 1, 0);
const R = NAVE.radioArena;

// ---------------------------------------------------------------- geometría
// Junta piezas en una sola geometría no indexada (posición, normal y color por vértice):
// un solo dibujo por material.
function unir(partes) {
  let total = 0;
  const listas = partes.map(({ geo, color }) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (!g.attributes.normal) g.computeVertexNormals();
    total += g.attributes.position.count;
    return { g, color };
  });
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  let o = 0;
  for (const { g, color } of listas) {
    const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
    for (let i = 0; i < p.count; i++, o++) {
      pos[o * 3] = p.getX(i); pos[o * 3 + 1] = p.getY(i); pos[o * 3 + 2] = p.getZ(i);
      nor[o * 3] = n.getX(i); nor[o * 3 + 1] = n.getY(i); nor[o * 3 + 2] = n.getZ(i);
      if (c) { col[o * 3] = c.getX(i); col[o * 3 + 1] = c.getY(i); col[o * 3 + 2] = c.getZ(i); }
      else if (typeof color === 'function') { const k = color(p.getX(i), p.getY(i), p.getZ(i)); col[o * 3] = k.r; col[o * 3 + 1] = k.g; col[o * 3 + 2] = k.b; }
      else { col[o * 3] = color.r; col[o * 3 + 1] = color.g; col[o * 3 + 2] = color.b; }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeBoundingSphere();
  return g;
}
const ruido = (x, y, z) => Math.sin(x * 1.7 + Math.sin(z * 1.3) * 1.4) * Math.sin(y * 2.1 + x * 0.7) * 0.5 + Math.sin(z * 2.9 + y * 1.1) * 0.25;
const vena = (x, z) => Math.abs(Math.sin(x * 0.55 + Math.sin(z * 0.31) * 2.2) * Math.sin(z * 0.62 + Math.sin(x * 0.27) * 1.9));
function colorear(geo, fn) {
  const p = geo.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const k = fn(p.getX(i), p.getY(i), p.getZ(i)); col[i * 3] = k.r; col[i * 3 + 1] = k.g; col[i * 3 + 2] = k.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}
// los tonos se piensan como se ven (sRGB): el color por vértice se guarda lineal
const C = (r, g, b) => _c.setRGB(r, g, b, THREE.SRGBColorSpace);

export function crearNaveMundo(T, escena, col, camara, efectos, sonido, api, opciones = {}) {
  const delValle = opciones.delValle || (() => false);
  let arena = null;             // la cámara armada (se arma la primera vez que se sube)
  let adentro = false, pelea = null, seq = null, hora = null;
  const crias = new Set();
  const ocultos = [];
  const DUENIO = { naveInterior: true };
  const S = () => api.S || {};

  // ---------------------------------------------------------------- DOM: barra y fundido
  const hud = document.createElement('div');
  hud.id = 'nave-hud';
  hud.style.cssText = 'position:fixed;top:58px;left:50%;transform:translateX(-50%);width:min(460px,72vw);text-align:center;color:#e6ffd8;font:600 14px system-ui,sans-serif;text-shadow:0 1px 3px #000;pointer-events:none;z-index:6;display:none';
  const hudTitulo = document.createElement('div');
  const hudBarra = document.createElement('div');
  hudBarra.style.cssText = 'margin-top:5px;height:10px;border-radius:5px;background:rgba(20,8,26,.7);box-shadow:0 0 0 2px rgba(166,255,110,.55),0 0 14px rgba(166,255,110,.35);overflow:hidden';
  const hudRelleno = document.createElement('i');
  hudRelleno.style.cssText = 'display:block;height:100%;width:100%;background:linear-gradient(90deg,#ff5a3a,#ffcb52)';
  hudBarra.appendChild(hudRelleno);
  hud.append(hudTitulo, hudBarra);
  // 3.5.1: dentro del HUD del juego: al volver a la portada desde adentro, la barra de la Madre quedaba encima
  (document.getElementById('hud') || document.body).appendChild(hud);
  const velo = document.createElement('div');
  velo.id = 'nave-velo';
  velo.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40;opacity:0;background:#fff';
  document.body.appendChild(velo);
  let opVelo = 0;
  function ponerVelo(v, color) {
    if (color && velo.style.background !== color) velo.style.background = color;
    const k = Math.max(0, Math.min(1, v));
    if (Math.abs(k - opVelo) < 0.004) return;
    opVelo = k; velo.style.opacity = String(k);
  }

  // ---------------------------------------------------------------- la cámara
  function construir(sitio) {
    const y = sitio.y + NAVE.alturaInterior;
    const grupo = new THREE.Group();
    grupo.position.set(sitio.x, y, sitio.z);
    grupo.visible = false;
    grupo.name = 'nave-interior';
    const basico = (extra = {}) => new THREE.MeshBasicMaterial({ vertexColors: true, ...extra });

    // el piso: carne oscura con venas que brillan y un anillo de runas alrededor de la Madre
    const piso = new THREE.RingGeometry(0.01, R + 1.2, 128, 64).rotateX(-Math.PI / 2);
    colorear(piso, (x, _, z) => {
      const r = Math.hypot(x, z), v = vena(x, z);
      const brillo = v < 0.07 ? 0.85 : v < 0.14 ? 0.3 : 0;
      const runa = Math.abs(r - 8.5) < 0.18 || Math.abs(r - 10.2) < 0.1 ? 0.7 : 0;
      const borde = Math.min(1, Math.max(0, (r - R + 5) / 5));
      const base = 0.11 + ruido(x * 0.4, 0, z * 0.4) * 0.03;
      return C(base + brillo * 0.15 + runa * 0.25 - borde * 0.04, base * 0.55 + brillo * 0.75 + runa * 0.7, base * 1.35 + brillo * 0.35 + runa * 0.4);
    });
    grupo.add(new THREE.Mesh(piso, basico()));

    // el domo: una lata vuelta sobre sí misma, con nervaduras y una banda que late
    const perfil = [[R + 0.8, -0.4], [R + 1.1, 2], [R + 0.4, 6], [R - 2.6, 11], [R - 8, 15.5], [R - 15, 18.2], [5, 19.6], [0.01, 20.2]]
      .map(([a, b]) => new THREE.Vector2(a, b));
    const domo = new THREE.LatheGeometry(perfil, 64);
    colorear(domo, (x, yy, z) => {
      const ang = Math.atan2(z, x);
      const costilla = Math.pow(Math.abs(Math.cos(ang * 8)), 14);
      const banda = yy > 1 && yy < 2.6 ? 0.55 + Math.sin(ang * 23) * 0.2 : 0;
      const alto = Math.min(1, yy / 20);
      const b = 0.08 + alto * 0.07 + costilla * 0.12 + ruido(x * 0.3, yy * 0.3, z * 0.3) * 0.025;
      return C(b * 1.3 + banda * 0.1, b * 0.8 + banda * 0.8 + alto * 0.05, b * 1.6 + banda * 0.3 + alto * 0.12);
    });
    grupo.add(new THREE.Mesh(domo, basico({ side: THREE.BackSide })));

    // las costillas del domo
    const costillas = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.2;
      const puntos = perfil.slice(1, 7).map((p) => new THREE.Vector3(Math.cos(a) * (p.x - 0.5), p.y, Math.sin(a) * (p.x - 0.5)));
      costillas.push({ geo: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos), 22, 0.34, 5), color: (x, yy) => C(0.24 + yy * 0.006, 0.19, 0.24 + yy * 0.008) });
    }
    grupo.add(new THREE.Mesh(unir(costillas), new THREE.MeshLambertMaterial({ vertexColors: true })));

    // racimos de cristal al pie de la pared
    const cristales = [];
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * Math.PI * 2 + 0.55;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.3) continue;   // donde está la salida, no
      const cx = Math.cos(a) * (R - 1.6), cz = Math.sin(a) * (R - 1.6);
      for (let k = 0; k < 5; k++) {
        const t = 0.6 + ((i * 7 + k * 3) % 5) * 0.28;
        const g = new THREE.IcosahedronGeometry(1, 0).scale(0.32 * t, 1.9 * t, 0.32 * t);
        g.rotateZ((k - 2) * 0.28).rotateY(a + k * 0.9).translate(cx + Math.cos(a + k) * 0.8, 1.2 * t, cz + Math.sin(a + k) * 0.8);
        const verde = (i + k) % 3 === 0;
        cristales.push({ geo: g, color: verde ? new THREE.Color(0.45, 1, 0.55) : new THREE.Color(0.35, 0.9, 0.95) });
      }
    }
    grupo.add(new THREE.Mesh(unir(cristales), basico()));

    // las vainas: de acá salen las crías
    const vainas = [], rajas = [];
    const lugaresVaina = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(a) * (R - 0.6), z = Math.sin(a) * (R - 0.6);
      vainas.push({ geo: new THREE.SphereGeometry(1.2, 12, 10).scale(0.85, 1.8, 0.75).rotateY(-a).translate(x, 2.1, z),
        color: (px, py) => C(0.2 + py * 0.02, 0.12, 0.2 + py * 0.015) });
      rajas.push({ geo: new THREE.BoxGeometry(0.12, 2.6, 0.12).rotateY(-a).translate(Math.cos(a) * (R - 1.45), 2.1, Math.sin(a) * (R - 1.45)), color: new THREE.Color(0.6, 1, 0.45) });
      lugaresVaina.push({ x: Math.cos(a) * (R - 3.4), z: Math.sin(a) * (R - 3.4) });
    }
    grupo.add(new THREE.Mesh(unir(vainas), new THREE.MeshLambertMaterial({ vertexColors: true })));
    const matRajas = basico();
    grupo.add(new THREE.Mesh(unir(rajas), matRajas));

    // la salida: un aro de luz contra la pared (E vuelve al valle)
    const salida = { x: R - 3.2, z: 0 };
    const aro = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.12, 8, 32), new THREE.MeshBasicMaterial({ color: '#7dfff0' }));
    aro.position.set(R - 1.4, 1.7, 0); aro.rotation.y = Math.PI / 2;
    grupo.add(aro);
    const charco = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#7dfff0', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    charco.position.set(salida.x, 0.03, 0);
    grupo.add(charco);

    // ---------------- la Madre
    const madre = new THREE.Group();
    grupo.add(madre);
    const cuerpo = new THREE.Group();   // gira para mirarte
    madre.add(cuerpo);
    const bulbo = new THREE.SphereGeometry(4.3, 40, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    {
      const p = bulbo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), yy = p.getY(i), z = p.getZ(i);
        const k = 1 + ruido(x * 0.6, yy * 0.6, z * 0.6) * 0.07;
        p.setXYZ(i, x * k, yy * k, z * k);
      }
      bulbo.computeVertexNormals();
      colorear(bulbo, (x, yy, z) => { const v = vena(x * 3, z * 3 + yy * 2); const b = v < 0.08 ? 0.5 : 0; return C(0.27 + b * 0.2, 0.2 + b * 0.8, 0.3 + b * 0.25); });
    }
    const matCarne = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#12061a' });
    const mBulbo = new THREE.Mesh(bulbo, matCarne);
    mBulbo.position.y = 4;
    cuerpo.add(mBulbo);
    // el caparazón de arriba: cinco gajos que se abren en la última fase
    const gajos = [];
    for (let i = 0; i < 5; i++) {
      const phi0 = (i / 5) * Math.PI * 2, largo = (Math.PI * 2) / 5 * 0.97;
      const g = new THREE.SphereGeometry(4.4, 10, 9, phi0, largo, 0, Math.PI / 2);
      colorear(g, (x, yy) => C(0.33 + yy * 0.02, 0.26 + yy * 0.01, 0.36 + yy * 0.025));
      const piv = new THREE.Group();
      piv.position.y = 4;
      piv.add(new THREE.Mesh(g, matCarne));
      // cuernos sobre cada gajo
      const pc = phi0 + largo / 2;
      const cuerno = new THREE.Mesh(new THREE.ConeGeometry(0.32, 2.4, 6), matCarne);
      cuerno.position.set(-Math.cos(pc) * 2.6, 3.8, Math.sin(pc) * 2.6);
      cuerno.rotation.set(Math.sin(pc) * 0.5, 0, Math.cos(pc) * 0.5);
      piv.add(cuerno);
      cuerpo.add(piv);
      gajos.push({ piv, eje: new THREE.Vector3(Math.sin(pc), 0, Math.cos(pc)) });
    }
    // los ojos, alrededor del bulbo
    const ojos = [];
    for (let i = 0; i < NAVE.ojos; i++) {
      const a = (i / NAVE.ojos) * Math.PI * 2;
      const g = new THREE.Group();
      g.position.set(Math.sin(a) * 4.15, 3.0, Math.cos(a) * 4.15);
      g.rotation.y = a;
      const globo = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), new THREE.MeshBasicMaterial({ color: '#e8ffcf' }));
      const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), new THREE.MeshBasicMaterial({ color: '#10200a' }));
      pupila.position.z = 0.62;
      const parpado = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.2, 6, 18), matCarne);
      parpado.position.z = 0.15;
      const herida = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), new THREE.MeshBasicMaterial({ color: '#1a0508' }));
      herida.visible = false;
      g.add(globo, pupila, parpado, herida);
      cuerpo.add(g);
      ojos.push({ g, globo, pupila, herida, flash: 0, blanco: { asedio: true, nave: true, tipo: 'ojo', i, pos: new THREE.Vector3(), radio: 1.35 } });
    }
    // el corazón (adentro del caparazón)
    const corazon = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), new THREE.MeshBasicMaterial({ color: '#ff5a3a' }));
    corazon.position.y = 4.6;
    cuerpo.add(corazon);
    const blancoCorazon = { asedio: true, nave: true, tipo: 'corazon', i: 0, pos: new THREE.Vector3(), radio: 2.4 };
    // los tentáculos, hasta el piso
    const tent = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      const pts = [[3.3, 1.9], [4.6, 1.0], [6.2, 0.45], [7.8, 0.25], [8.8, 0.2]].map(([r, h], k) =>
        new THREE.Vector3(Math.cos(a + k * 0.12) * r, h, Math.sin(a + k * 0.12) * r));
      tent.push({ geo: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.42, 6), color: (x, yy) => C(0.23 + yy * 0.03, 0.16, 0.26) });
    }
    const tentaculos = new THREE.Mesh(unir(tent), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#0c0412' }));
    madre.add(tentaculos);
    // el escudo de la segunda fase
    const escudo = new THREE.Mesh(new THREE.SphereGeometry(6.6, 32, 16),
      new THREE.MeshBasicMaterial({ color: '#7dfff0', transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    escudo.position.y = 3.6; escudo.visible = false;
    madre.add(escudo);
    // los pilares del borde
    const pilares = [];
    for (let i = 0; i < NAVE.pilares; i++) {
      const a = Math.PI / 4 + (i / NAVE.pilares) * Math.PI * 2;
      const x = Math.cos(a) * NAVE.radioPilares, z = Math.sin(a) * NAVE.radioPilares;
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      const columna = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.1, 8, 7), new THREE.MeshLambertMaterial({ color: '#3a3044', emissive: '#0a0410' }));
      columna.position.y = 4;
      const nucleo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), new THREE.MeshBasicMaterial({ color: '#a6ff6e' }));
      // el núcleo flota del lado de la Madre, a la vista (no enterrado en la columna)
      nucleo.position.set(-Math.cos(a) * 1.5, 2.9, -Math.sin(a) * 1.5);
      g.add(columna, nucleo);
      const hilo = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 5, 1, true).translate(0, 0.5, 0),
        new THREE.MeshBasicMaterial({ color: '#a6ff6e', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
      hilo.visible = false;
      grupo.add(g, hilo);
      pilares.push({ g, columna, nucleo, hilo, flash: 0, blanco: { asedio: true, nave: true, tipo: 'pilar', i, pos: new THREE.Vector3(), radio: 1.6 } });
    }
    // peligros: ondas por el piso y púas debajo tuyo
    const ondas = [];
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 72).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: '#b6ff7a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.position.y = 0.08; m.visible = false;
      grupo.add(m);
      ondas.push({ m, activa: false, r: 0, golpeo: false });
    }
    const geoEspinas = unir(Array.from({ length: 6 }, (_, k) => ({
      geo: new THREE.ConeGeometry(0.22, 1.9, 5).translate(Math.cos(k * 1.05) * 0.7 * (k % 2 ? 1 : 0.4), 0.95, Math.sin(k * 1.05) * 0.7 * (k % 2 ? 1 : 0.4)),
      color: new THREE.Color(0.5, 1, 0.75),
    })));
    const puas = [];
    for (let i = 0; i < 4; i++) {
      const aviso = new THREE.Mesh(new THREE.CircleGeometry(NAVE.pua.radio, 24).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: '#ff5a3a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      aviso.position.y = 0.06;
      const espinas = new THREE.Mesh(geoEspinas, basico());
      aviso.visible = espinas.visible = false;
      grupo.add(aviso, espinas);
      puas.push({ aviso, espinas, activa: false, t: 0, x: 0, z: 0, golpeo: false });
    }
    escena.add(grupo);
    return {
      grupo, x: sitio.x, y, z: sitio.z, sitio, madre, cuerpo, gajos, ojos, corazon, blancoCorazon, tentaculos, escudo,
      pilares, ondas, puas, lugaresVaina, salida, aro, charco, matRajas, apertura: 0,
    };
  }

  // ---------------------------------------------------------------- esconder el valle
  const conLuz = new WeakMap();
  function tieneLuz(o) {
    if (conLuz.has(o)) return conLuz.get(o);
    let si = false;
    o.traverse((q) => { if (q.isLight) si = true; });
    conLuz.set(o, si);
    return si;
  }
  // Se esconde lo que era del valle antes del Desafío (terreno, bosque, cielo, agua...).
  // Lo que tiene luces adentro se deja: cambiar la cantidad de luces recompila todo, y la
  // cámara es cerrada, así que desde adentro no se ve.
  function ocultarValle() {
    ocultos.length = 0;
    for (const o of escena.children) {
      if (!o.visible || o === arena.grupo || o.isLight || !delValle(o) || tieneLuz(o)) continue;
      o.visible = false;
      ocultos.push(o);
    }
  }
  function mostrarValle() {
    for (const o of ocultos) o.visible = true;
    ocultos.length = 0;
  }
  let hemi = null, sol = null;
  function lucesDeAdentro() {
    if (!hemi) hemi = escena.children.find((o) => o.isHemisphereLight) || null;
    if (!sol) sol = escena.children.find((o) => o.isDirectionalLight) || null;
    if (hemi) { hemi.color.set('#b69ad8'); hemi.groundColor.set('#2f6a3a'); hemi.intensity = 1.55; }
    if (sol) { sol.color.set('#c8ffb0'); sol.intensity = 0.55; }
    if (escena.fog) { escena.fog.color.set('#1a0f24'); if ('density' in escena.fog) escena.fog.density = 0.028; }
  }

  // ---------------------------------------------------------------- física de adentro
  function ponerFisica() {
    col.agregarPlataforma({ x: arena.x, z: arena.z, radio: R + 0.6, alto: arena.y, espesor: 0.5, duenio: DUENIO, sinTecho: true, sinLaterales: true });
    // la pared: segmentos alrededor, para no caerse al vacío
    const n = 40;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, r = R - 0.3;
      col.agregar({ seg: true, ax: arena.x + Math.cos(a0) * r, az: arena.z + Math.sin(a0) * r, bx: arena.x + Math.cos(a1) * r, bz: arena.z + Math.sin(a1) * r,
        r: 0.3, alturaMin: arena.y - 1, alturaMax: arena.y + 12, duenio: DUENIO });
    }
    // la Madre
    col.agregar({ x: arena.x, z: arena.z, r: NAVE.radioCuerpo, alturaMin: arena.y - 1, alturaMax: arena.y + 9, duenio: DUENIO });
    // los pilares
    for (const p of arena.pilares) col.agregar({ x: arena.x + p.g.position.x, z: arena.z + p.g.position.z, r: 1.05, alturaMin: arena.y - 1, alturaMax: arena.y + 8, duenio: DUENIO });
  }
  const sacarFisica = () => col.eliminarPorDuenio(DUENIO);

  // ---------------------------------------------------------------- entrar y salir
  const salidaMundo = () => ({ x: arena.x + arena.salida.x, z: arena.z + arena.salida.z });
  function entrar() {
    if (adentro || seq) return false;
    const s = api.sitioHaz?.();
    if (!s) return false;
    if (!arena || Math.hypot(arena.sitio.x - s.x, arena.sitio.z - s.z) > 1) {
      if (arena) escena.remove(arena.grupo);
      arena = construir(s);
    }
    seq = { tipo: 'entrar', t: 0, hecho: false };
    sonido.tono?.({ frec: 90, fin: 420, dur: 1.2, tipo: 'sawtooth', vol: 0.12, destino: sonido.bus?.efectos });
    return true;
  }
  function hacerEntrada() {
    const d = api.D();
    // lo que quedaba afuera se va: adentro no se ve y no tiene que seguir persiguiéndote
    for (const a of api.aliens) if (!a.enNave && a.estado !== 'morir' && a.estado !== 'irse') { a.estado = 'irse'; a.t = 0; }
    hora = api.horaActual?.() || null;
    const asedio = d.asedio;
    if (asedio) asedio.abordajes = (asedio.abordajes || 0) + 1;
    pelea = naveNueva({ vida: dificultad(api.claveDificultad?.()).vida, debilidad: debilidadNave(asedio) });
    pelea.bruto = false;
    crias.clear();
    for (const o of arena.ondas) { o.activa = false; o.m.visible = false; }
    for (const p of arena.puas) { p.activa = false; p.aviso.visible = p.espinas.visible = false; }
    arena.apertura = 0;
    // 3.5.1: la arena se reusa al volver a subir: los ojos y pilares rotos la vez anterior
    // seguían reventados (sin globo ni núcleo) aunque la Madre se recompone y les entran los
    // golpes; no se veía a qué tirarle, y el plasma no salía de esos ojos
    for (const o of arena.ojos) { o.globo.visible = o.pupila.visible = true; o.herida.visible = false; o.flash = 0; }
    for (const p of arena.pilares) { p.nucleo.visible = true; p.hilo.visible = false; p.columna.scale.y = 1; p.columna.position.y = 4; p.flash = 0; }
    arena.corazonFlash = 0;
    ponerFisica();
    arena.grupo.visible = true;
    ocultarValle();
    adentro = true;
    const sal = salidaMundo();
    api.jugador().ubicar(sal.x, sal.z, Math.PI / 2, arena.y);
    lucesDeAdentro();
    hud.style.display = 'block';
    _v.set(arena.x, arena.y + 5, arena.z);
    S().jefe?.(_v);
    api.nota(AVISO_FASE.ojos[0], AVISO_FASE.ojos[1] + (debilidadNave(asedio) ? '. Con las cuatro zonas libres, llegó más débil: le falta un ojo' : ''), true);
    api.guardar();
  }
  function salir() {
    if (!adentro || seq) return false;
    seq = { tipo: 'salir', t: 0, hecho: false };
    return true;
  }
  function alCaerAdentro() {
    if (!adentro) return false;
    if (seq) { api.D().salud = Math.max(1, api.D().salud); return true; }
    api.D().salud = 1;
    seq = { tipo: 'derrota', t: 0, hecho: false };
    return true;
  }
  function hacerSalida(motivo) {
    for (const a of crias) if (a.estado !== 'morir') { a.estado = 'irse'; a.t = 10; }
    crias.clear();
    sacarFisica();
    arena.grupo.visible = false;
    mostrarValle();
    adentro = false;
    hud.style.display = 'none';
    try { sonido.agaches?.ambiente?.gain?.setTargetAtTime(1, sonido.ctx.currentTime, 0.4); } catch { /* sin audio */ }
    const s = api.sitioHaz?.() || { x: arena.x, z: arena.z, y: T.altura(arena.x, arena.z) };
    const d = api.D();
    if (motivo === 'final') {
      // se sale lejos de donde va a caer la nave, mirándola
      const c = api.centroBase?.() || { x: s.x + 60, z: s.z };
      const dx = c.x - s.x, dz = c.z - s.z, l = Math.hypot(dx, dz) || 1;
      const x = s.x + (dx / l) * 55, z = s.z + (dz / l) * 55;
      api.jugador().ubicar(x, z, Math.atan2(-(s.x - x), -(s.z - z)), T.altura(x, z));
      pelea = null;
      return;
    }
    const x = s.x + 4, z = s.z + 4;
    api.jugador().ubicar(x, z, Math.atan2(-(s.x - x), -(s.z - z)), T.altura(x, z));
    pelea = null;
    if (motivo === 'derrota') {
      d.salud = Math.round(SALUD_MAX * 0.6);
      if (d.asedio) d.asedio.derrotasNave = (d.asedio.derrotasNave || 0) + 1;
      api.nota('La nave te escupió', 'Caíste adentro y el haz te bajó al valle. Sigue abierto: cuando estés listo, volvé a subir (la Madre se recompone)', true);
    } else api.nota('Volviste al valle', 'El haz sigue abierto. Adentro, la Madre se recompone');
    api.guardar();
  }

  // ---------------------------------------------------------------- blancos y golpes
  const activos = [];
  const blancos = () => activos;
  function herir(n, dano) {
    if (!adentro || !pelea || !n?.nave || seq) return;
    const r = herirPunto(pelea, n.tipo, n.i, dano);
    if (!r.ok) {
      // el escudo o el caparazón frenan el golpe
      efectos?.chispas(n.pos, 5);
      return;
    }
    const vis = n.tipo === 'ojo' ? arena.ojos[n.i] : n.tipo === 'pilar' ? arena.pilares[n.i] : null;
    if (vis) vis.flash = 1; else arena.corazonFlash = 1;
    if (!r.roto) return;
    efectos?.explosion(n.pos, n.tipo === 'corazon' ? 12 : 6);
    efectos?.sangre?.(n.pos, 12);
    sonido.golpeRuido?.({ dur: 1.3, frec: 120, tipo: 'lowpass', vol: 0.85, destino: sonido.fuente?.(n.pos, 1.3) });
    api.vibrar?.('jefe', 0.8);
    if (n.tipo === 'ojo') { vis.globo.visible = vis.pupila.visible = false; vis.herida.visible = true; }
    if (n.tipo === 'pilar') { vis.nucleo.visible = false; vis.hilo.visible = false; vis.columna.scale.y = 0.55; vis.columna.position.y = 2.2; }
    if (r.ganada) { empezarFinal(); return; }
    if (r.fase) {
      _v.set(arena.x, arena.y + 6, arena.z);
      S().jefe?.(_v);
      api.nota(AVISO_FASE[r.fase][0], AVISO_FASE[r.fase][1], true);
      if (r.fase === 'corazon') efectos?.explosion(_v, 9);
    } else {
      const quedan = puntosActivos(pelea).length;
      api.nota(n.tipo === 'ojo' ? 'Le reventaste un ojo' : 'Cayó un pilar', `Quedan ${quedan}`);
    }
  }
  function empezarFinal() {
    seq = { tipo: 'final', t: 0, hecho: false, boom: 0 };
    api.camaraLenta?.(2.4);
    for (const a of crias) if (a.estado !== 'morir') { a.estado = 'irse'; a.t = 0; }
    api.nota('¡La Madre cayó!', 'La nave se viene abajo. ¡Afuera, rápido!', true);
    api.guardar();
  }

  // ---------------------------------------------------------------- las crías
  const pose = { dt: 0, jugador: null, velocidad: 0, golpe: 0, ataca: false, carrera: false, apuntando: false, agazapado: false, enredado: false, saltando: 0, noche: 1, reflejo: 0 };
  function llamarCrias() {
    const f = indiceFase(pelea);
    const lista = [...criasDeFase(pelea)];
    if (f === 2 && !pelea.bruto) { lista.push('bruto'); pelea.bruto = true; }
    let n = 0;
    for (const tipo of lista) {
      if (crias.size >= NAVE.maxCrias[f] + (tipo === 'bruto' ? 1 : 0)) break;
      const v = arena.lugaresVaina[Math.floor(Math.random() * arena.lugaresVaina.length)];
      const x = arena.x + v.x + (Math.random() - 0.5) * 1.5, z = arena.z + v.z + (Math.random() - 0.5) * 1.5;
      const a = api.invocar?.(tipo, x, z);
      if (!a) continue;
      a.enNave = true;
      a.m.g.position.y = arena.y;
      a.cd = 0.8 + Math.random();
      crias.add(a);
      n++;
      _v.set(x, arena.y + 1.6, z);
      efectos?.sangre?.(_v, 8);
    }
    if (n) { _v.set(arena.x, arena.y + 6, arena.z); S().llamado?.(_v, 'jefe'); }
  }
  function actualizarAlien(a, dt, js) {
    const g = a.m.g, p = g.position, def = a.def;
    if (a.estado === 'morir') {
      a.t += dt; a.m.caer(a.t);
      if (a.t > 0.9) a.m.disolver(Math.min(1, (a.t - 0.9) / 1.4));
      return a.t > 2.4 ? 'fuera' : undefined;
    }
    if (a.estado === 'irse' || !adentro) {
      if (a.estado !== 'irse') { a.estado = 'irse'; a.t = 0; }
      a.t += dt; p.y += dt * (3 + a.t * 4); g.rotation.y += dt * 4;
      g.scale.setScalar(Math.max(0.05, 1 - a.t * 0.35)); a.m.disolver(Math.min(1, a.t / 2.6));
      return a.t > 2.6 ? 'fuera' : undefined;
    }
    if (a.estado !== 'avanzar') a.estado = 'avanzar';
    a.flash = Math.max(0, (a.flash || 0) - dt * 6); a.m.flash(a.flash);
    a.cd -= dt;
    const dx = js.pos.x - p.x, dz = js.pos.z - p.z, dist = Math.hypot(dx, dz);
    let vel = def.vel * (a.velMult || 1);
    if (a.congeladoT > 0) { a.congeladoT -= dt; vel *= 0.33; }
    if (a.frenoT > 0) { a.frenoT -= dt; vel *= 0.45; }
    let ataca = false, apunta = false, quieto = false;
    if (a.enredadoT > 0 || a.atrapadoT > 0) { a.enredadoT = Math.max(0, a.enredadoT - dt); a.atrapadoT = Math.max(0, (a.atrapadoT || 0) - dt); vel = 0; quieto = true; }
    const alcance = (def.cuerpo || def.alcance) + def.radio * (a.m.esc - 1) + 0.35;
    if (!quieto && def.aDistancia && dist < def.alcance && dist > 4) {
      vel = dist < def.distancia ? -vel * 0.5 : dist < def.distancia + 3 ? 0 : vel;
      apunta = true;
      if (a.cd <= 0) {
        a.cd = def.cadencia * (0.8 + Math.random() * 0.4);
        _v.set(p.x, p.y + def.altura * 0.8, p.z);
        _d.set(js.pos.x - _v.x, js.pos.y + 1.2 - _v.y, js.pos.z - _v.z).normalize();
        _d.x += (Math.random() - 0.5) * 0.06; _d.y += (Math.random() - 0.5) * 0.04;
        api.lanzarProyectil('plasma', _v, _d.multiplyScalar(19), def.dano * a.danoMult, false);
        S().plasma?.(p);
        a.golpeT = 0.3;
      }
    } else if (!quieto && dist < alcance && Math.abs(js.pos.y - p.y) < 2.2) {
      vel = 0; ataca = true;
      if (a.cd <= 0) { a.cd = def.cadencia; a.golpeT = 0.35; api.herirJugador(def.dano * a.danoMult, p); }
    }
    let dif = Math.atan2(dx, dz) - (a.rumbo || 0);
    dif = Math.atan2(Math.sin(dif), Math.cos(dif));
    a.rumbo = (a.rumbo || 0) + dif * Math.min(1, dt * (def.giro || 6));
    g.rotation.y = a.rumbo;
    if (vel) { p.x += Math.sin(a.rumbo) * vel * dt; p.z += Math.cos(a.rumbo) * vel * dt; }
    // adentro de la arena y afuera del cuerpo de la Madre
    let lx = p.x - arena.x, lz = p.z - arena.z;
    const r1 = dentroDeArena(lx, lz, def.radio); lx = r1.dx; lz = r1.dz;
    const r2 = fueraDelCuerpo(lx, lz, def.radio); lx = r2.dx; lz = r2.dz;
    p.x = arena.x + lx; p.z = arena.z + lz; p.y = arena.y;
    a.px = p.x; a.pz = p.z;
    a.golpeT = Math.max(0, (a.golpeT || 0) - dt);
    pose.dt = dt; pose.jugador = js.pos; pose.velocidad = Math.abs(vel); pose.golpe = a.golpeT > 0 ? Math.sin((1 - a.golpeT / 0.35) * Math.PI) : 0;
    pose.ataca = ataca; pose.carrera = a.tipo === 'rastreador' && vel > 0 && dist > 7; pose.apuntando = apunta && !vel;
    pose.agazapado = false; pose.enredado = quieto; pose.saltando = 0; pose.noche = 1; pose.reflejo = 0;
    a.m.animar(pose);
    return undefined;
  }

  // ---------------------------------------------------------------- lo que hace la Madre
  const hechos = [];
  function disparar(js) {
    // desde el ojo que mejor te ve, o desde arriba cuando ya no tiene ojos
    let desde = null, mejor = -2;
    if (pelea.fase === 'ojos') {
      for (const o of arena.ojos) {
        if (!o.globo.visible) continue;
        _w.subVectors(js.pos, o.blanco.pos).normalize();
        o.g.getWorldDirection(_d);
        const k = _d.dot(_w);
        if (k > mejor) { mejor = k; desde = o.blanco.pos; }
      }
    }
    if (!desde) desde = _v.set(arena.x, arena.y + 8.2, arena.z);
    const origen = _w.copy(desde);
    for (let i = -1; i <= 1; i++) {
      _d.set(js.pos.x - origen.x, js.pos.y + 1.1 - origen.y, js.pos.z - origen.z).normalize();
      _d.applyAxisAngle(ARRIBA, i * 0.09);
      api.lanzarProyectil('plasma', origen, _d.multiplyScalar(18), NAVE.dano.disparo, false);
    }
    S().plasma?.(origen);
  }
  function lanzarOnda() {
    const o = arena.ondas.find((q) => !q.activa);
    if (!o) return;
    o.activa = true; o.r = NAVE.radioCuerpo + 0.5; o.golpeo = false; o.m.visible = true;
    sonido.tono?.({ frec: 70, fin: 40, dur: 0.9, tipo: 'sine', vol: 0.35, destino: sonido.bus?.efectos });
    sonido.golpeRuido?.({ dur: 0.6, frec: 180, tipo: 'lowpass', vol: 0.5, destino: sonido.bus?.efectos });
  }
  function lanzarPua(js) {
    const p = arena.puas.find((q) => !q.activa);
    if (!p) return;
    p.activa = true; p.t = 0; p.golpeo = false;
    p.x = js.pos.x - arena.x; p.z = js.pos.z - arena.z;
    p.aviso.position.set(p.x, 0.06, p.z); p.espinas.position.set(p.x, -2, p.z);
    p.aviso.visible = true; p.espinas.visible = false;
    sonido.tono?.({ frec: 900, fin: 1400, dur: 0.5, tipo: 'triangle', vol: 0.06, destino: sonido.bus?.efectos });
  }
  function actualizarPeligros(dt, js) {
    const alto = js.pos.y - arena.y;
    const lx = js.pos.x - arena.x, lz = js.pos.z - arena.z, dist = Math.hypot(lx, lz);
    for (const o of arena.ondas) {
      if (!o.activa) continue;
      o.r += NAVE.onda.vel * dt;
      o.m.scale.set(o.r, 1, o.r);
      o.m.material.opacity = Math.max(0, 0.85 * (1 - o.r / (R + 1)));
      if (!o.golpeo && !seq && tocaOnda(o.r, dist, alto)) {
        o.golpeo = true;
        api.herirJugador(NAVE.dano.onda, _v.set(arena.x, arena.y, arena.z));
      }
      if (o.r > R + 1) { o.activa = false; o.m.visible = false; }
    }
    for (const p of arena.puas) {
      if (!p.activa) continue;
      p.t += dt;
      if (p.t < NAVE.pua.aviso) {
        p.aviso.material.opacity = 0.25 + (p.t / NAVE.pua.aviso) * 0.5 + Math.sin(p.t * 30) * 0.08;
        continue;
      }
      const k = Math.min(1, (p.t - NAVE.pua.aviso) / 0.15);
      p.espinas.visible = true;
      p.espinas.position.y = -1.9 + k * 1.9;
      p.aviso.material.opacity = Math.max(0, 0.6 - (p.t - NAVE.pua.aviso) * 0.8);
      if (!p.golpeo && k >= 1) {
        p.golpeo = true;
        _v.set(arena.x + p.x, arena.y + 0.5, arena.z + p.z);
        efectos?.chispas(_v, 10);
        sonido.golpeRuido?.({ dur: 0.35, frec: 2600, q: 2, vol: 0.35, destino: sonido.fuente?.(_v, 0.8) });
        if (!seq && alto < 1.2 && tocaPua({ x: p.x, z: p.z }, lx, lz)) api.herirJugador(NAVE.dano.pua, _v);
      }
      if (p.t > NAVE.pua.aviso + 1.6) { p.activa = false; p.aviso.visible = p.espinas.visible = false; }
    }
  }

  // ---------------------------------------------------------------- por cuadro
  let tHud = 0, tAgache = 0;
  const pisoT = { altura: () => (arena ? arena.y : 0) };
  function actualizar(dt, js) {
    // una partida guardada adentro de la nave (o cualquier caída al vacío): de vuelta al valle
    // 3.5.1: el guardado acota la altura a 320 m: con el sitio del haz alto, la partida guardada
    // adentro volvía en el aire sobre el haz (y caía cientos de metros); se la reconoce igual
    const sh = !adentro && !seq ? api.sitioHaz?.() : null;
    const sobreElHaz = !!sh && Math.hypot(js.pos.x - sh.x, js.pos.z - sh.z) < NAVE.radioArena + 2 && js.pos.y > sh.y + 20;
    if (!adentro && !seq && (js.pos.y > T.altura(js.pos.x, js.pos.z) + 250 || sobreElHaz)) {
      const s = api.sitioHaz?.();
      const x = s ? s.x + 4 : js.pos.x, z = s ? s.z + 4 : js.pos.z;
      api.jugador().ubicar(x, z, js.yaw, T.altura(x, z));
      return;
    }
    if (seq) actualizarSecuencia(dt, js);
    if (!adentro || !arena) return;
    if (hora) api.fijarHora?.(hora.h, hora.dia);
    lucesDeAdentro();
    for (const o of ocultos) o.visible = false;   // lo que el valle vuelve a prender, se apaga
    tAgache -= dt;
    if (tAgache <= 0) { tAgache = 0.5; try { sonido.agaches?.ambiente?.gain?.setTargetAtTime(0.18, sonido.ctx.currentTime, 0.3); } catch { /* sin audio */ } }
    // se cayó del piso (no debería): vuelve a la salida
    if (js.pos.y < arena.y - 4) { const s = salidaMundo(); api.jugador().ubicar(s.x, s.z, Math.PI / 2, arena.y); }
    for (const a of crias) if (!api.aliens.includes(a) || !a.enNave) crias.delete(a);
    const t = performance.now() / 1000;
    // la Madre te busca con la mirada, despacio
    if (pelea && !pelea.ganada) {
      const quiere = Math.atan2(js.pos.x - arena.x, js.pos.z - arena.z);
      let dif = quiere - arena.cuerpo.rotation.y;
      dif = Math.atan2(Math.sin(dif), Math.cos(dif));
      arena.cuerpo.rotation.y += Math.max(-dt * 0.45, Math.min(dt * 0.45, dif));
      if (!seq) {
        avanzarNave(pelea, dt, { crias: crias.size }, hechos);
        for (const h of hechos) {
          if (h === 'disparo') disparar(js);
          else if (h === 'llamar') llamarCrias();
          else if (h === 'onda') lanzarOnda();
          else if (h === 'pua') lanzarPua(js);
        }
      }
    }
    actualizarPeligros(dt, js);
    // la forma de la Madre según la fase
    const fase = pelea?.fase || 'corazon';
    arena.apertura += ((fase === 'corazon' ? 1 : 0) - arena.apertura) * Math.min(1, dt * 1.2);
    for (const g of arena.gajos) g.piv.quaternion.setFromAxisAngle(g.eje, arena.apertura * 1.05);
    arena.escudo.visible = fase === 'pilares';
    if (arena.escudo.visible) arena.escudo.material.opacity = 0.16 + Math.sin(t * 3) * 0.05;
    arena.madre.scale.setScalar(1 + Math.sin(t * 1.3) * 0.015);
    arena.tentaculos.rotation.y = Math.sin(t * 0.4) * 0.05;
    arena.matRajas.color.setRGB(0.7 + Math.sin(t * 2) * 0.3, 1, 0.7 + Math.sin(t * 2) * 0.3);
    arena.charco.material.opacity = 0.25 + Math.sin(t * 3) * 0.1;
    arena.aro.rotation.z += dt * 0.8;
    arena.grupo.updateMatrixWorld(true);
    // los blancos, en el mundo
    activos.length = 0;
    const puedenPegar = pelea && !pelea.ganada && !seq;
    for (const o of arena.ojos) {
      o.globo.getWorldPosition(o.blanco.pos);
      o.flash = Math.max(0, o.flash - dt * 4);
      o.globo.material.color.setRGB(0.9 + o.flash * 0.1, 1, 0.8 - o.flash * 0.5);
      o.pupila.scale.setScalar(1 + Math.sin(t * 5 + o.blanco.i) * 0.15);
      if (puedenPegar && fase === 'ojos' && pelea.ojos[o.blanco.i] > 0) activos.push(o.blanco);
      else if (pelea && pelea.ojos[o.blanco.i] <= 0 && o.globo.visible) { o.globo.visible = o.pupila.visible = false; o.herida.visible = true; }
    }
    for (const p of arena.pilares) {
      p.nucleo.getWorldPosition(p.blanco.pos);
      p.flash = Math.max(0, p.flash - dt * 4);
      const vivo = pelea && pelea.pilares[p.blanco.i] > 0;
      p.nucleo.material.color.setRGB(0.65 + p.flash * 0.35, 1, 0.43 + p.flash * 0.5);
      p.nucleo.scale.setScalar(0.9 + Math.sin(t * 2.6 + p.blanco.i) * 0.1 + p.flash * 0.3);
      p.hilo.visible = vivo && fase === 'pilares';
      if (p.hilo.visible) {
        _v.set(p.g.position.x + p.nucleo.position.x, p.nucleo.position.y, p.g.position.z + p.nucleo.position.z);
        _w.set(0, 3.6, 0).sub(_v);
        const largo = _w.length() - 6.4;
        p.hilo.position.copy(_v);
        p.hilo.quaternion.setFromUnitVectors(ARRIBA, _w.normalize());
        p.hilo.scale.set(1, Math.max(0.1, largo), 1);
      }
      if (puedenPegar && fase === 'pilares' && vivo) activos.push(p.blanco);
    }
    arena.corazon.visible = arena.apertura > 0.25;
    arena.corazon.getWorldPosition(arena.blancoCorazon.pos);
    arena.corazonFlash = Math.max(0, (arena.corazonFlash || 0) - dt * 4);
    arena.corazon.scale.setScalar((0.9 + Math.sin(t * 5.5) * 0.12) * (1 + arena.corazonFlash * 0.3));
    arena.corazon.material.color.setRGB(1, 0.35 + arena.corazonFlash * 0.6, 0.2 + arena.corazonFlash * 0.7);
    if (puedenPegar && fase === 'corazon' && arena.apertura > 0.4) activos.push(arena.blancoCorazon);
    // la barra
    tHud -= dt;
    if (tHud <= 0 && pelea) {
      tHud = 0.12;
      const texto = `La Madre · ${textoNave(pelea)}`;
      if (hudTitulo.textContent !== texto) hudTitulo.textContent = texto;
      hudRelleno.style.width = `${Math.round(fraccionNave(pelea) * 100)}%`;
    }
  }
  function actualizarSecuencia(dt, js) {
    const s = seq;
    s.t += dt;
    if (s.tipo === 'entrar') {
      ponerVelo(s.t / 0.6, '#eaffe0');
      if (!s.hecho && s.t >= 0.6) { s.hecho = true; hacerEntrada(); }
      if (s.t > 0.6) ponerVelo(1 - (s.t - 0.6) / 1.1);
      if (s.t > 1.7) { ponerVelo(0); seq = null; }
    } else if (s.tipo === 'salir' || s.tipo === 'derrota') {
      ponerVelo(s.t / 0.6, s.tipo === 'derrota' ? '#200808' : '#eaffe0');
      if (!s.hecho && s.t >= 0.6) { s.hecho = true; hacerSalida(s.tipo === 'derrota' ? 'derrota' : 'voluntario'); }
      if (s.t > 0.6) ponerVelo(1 - (s.t - 0.6) / 1.1);
      if (s.t > 1.7) { ponerVelo(0); seq = null; }
    } else if (s.tipo === 'final') {
      // la Madre revienta de a pedazos, la cámara tiembla y se va todo a blanco
      if (adentro && arena) {
        s.boom -= dt;
        if (s.boom <= 0) {
          s.boom = 0.18;
          const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6;
          _v.set(arena.x + Math.cos(a) * r, arena.y + 1 + Math.random() * 7, arena.z + Math.sin(a) * r);
          efectos?.explosion(_v, 5);
          sonido.golpeRuido?.({ dur: 0.9, frec: 90 + Math.random() * 80, tipo: 'lowpass', vol: 0.6, destino: sonido.bus?.efectos });
        }
        const k = Math.min(1, s.t / 3);
        arena.madre.scale.setScalar(Math.max(0.05, 1 - k * 0.8));
        arena.madre.position.y = -k * 2;
        camara.position.x += (Math.random() - 0.5) * 0.12 * (1 - k * 0.5);
        camara.position.y += (Math.random() - 0.5) * 0.08;
        api.vibrar?.('derrumbe', 0.5);
      }
      if (s.t > 2.4) ponerVelo((s.t - 2.4) / 0.8, '#ffffff');
      if (!s.hecho && s.t >= 3.2) {
        s.hecho = true;
        hacerSalida('final');
        arena.madre.scale.setScalar(1); arena.madre.position.y = 0;
        api.alGanarNave?.();
      }
      if (s.t > 3.2) ponerVelo(1 - (s.t - 3.2) / 1.6, '#ffffff');
      if (s.t > 4.8) { ponerVelo(0); seq = null; }
    }
  }

  // ---------------------------------------------------------------- E: la salida
  function enLaSalida(pos) {
    if (!adentro || !arena || seq) return false;
    const s = salidaMundo();
    return Math.hypot(pos.x - s.x, pos.z - s.z) < 2.4 && Math.abs(pos.y - arena.y) < 2;
  }
  const usarCerca = (pos) => (enLaSalida(pos) ? salir() : false);
  const avisoCerca = (pos) => (enLaSalida(pos) ? 'Bajar por el haz al valle' : null);

  function limpiar() {
    if (adentro) {
      sacarFisica(); if (arena) arena.grupo.visible = false; mostrarValle(); adentro = false;
      // 3.5.1: como al salir por el haz: el ambiente del valle quedaba apagado (al caer o volver a la portada adentro)
      try { sonido.agaches?.ambiente?.gain?.setTargetAtTime(1, sonido.ctx.currentTime, 0.4); } catch { /* sin audio */ }
    }
    crias.clear();
    seq = null; pelea = null;
    hud.style.display = 'none';
    ponerVelo(0);
  }

  return {
    entrar, salir, alCaerAdentro, actualizar, actualizarAlien, blancos, herir, usarCerca, avisoCerca, limpiar,
    get adentro() { return adentro; },
    get enTransicion() { return !!seq; },
    get pelea() { return pelea; },
    get arena() { return arena; },
    get crias() { return crias.size; },
    get ocultos() { return ocultos.length; },
    // el piso de adentro, para lo que cae (proyectiles, cristales, partículas)
    alturaPiso: (x, z) => (arena && Math.hypot(x - arena.x, z - arena.z) < R + 1 ? arena.y : -1e9),
    pisoT,
    textoHud: () => (adentro && pelea ? `Adentro de la nave · ${textoNave(pelea)}` : ''),
  };
}
