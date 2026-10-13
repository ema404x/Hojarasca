// 3.9.2 · LA CANTINA MÁS VIVA, el ambiente de adentro: los cuadros y la herradura de la suerte en las paredes, el cartel del «hoy no se fía», el reloj de pared (con su péndulo y las
// agujas en la hora del juego), los vasos y platos usados de la noche en las mesas y la música de fondo (una guitarra sencilla, sintetizada por código, bajita; no suena en
// la peña: ahí toca el Cholo). Todo se arma una sola vez con geometrías y materiales compartidos, sólo se ve cerca (a menos de 45 m) y no usa luces ni sombras.
// (El humo de la salamandra sale por la chimenea de afuera: lo dibuja el humo de la aldea; ver aldea-mundo.js.) Lo de adentro está pegado a las paredes (marco del
// edificio: la puerta en +z) y se mira desde las mesas: las medidas son las de `cantina()` de aldea-arquitectura.js.
import * as THREE from 'three';
import { CANTINA } from './aldea.js';

const PI = Math.PI;
const HORA_USADOS = { desde: 20.5, hasta: 10 };   // desde que se llena la noche hasta que la moza limpia, a la mañana
const azar = (n) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

// Las notas de la guitarra de fondo: un arpegio lento (cuatro acordes, La menor, Sol, Fa, Mi: «a la española», de boliche) en corcheas; nada de melodía que se pegue
const ACORDES = [[45, 52, 57, 60, 64], [43, 50, 55, 59, 62], [41, 48, 53, 57, 60], [40, 47, 52, 56, 59]];
const PATRON = [0, 2, 3, 1, 3, 2, 4, 2];   // qué cuerda (del acorde) suena en cada corchea
const CORCHEA = 0.46;

export function crearAmbienteCantina(ctx) {
  const escena = ctx.escena;
  const raiz = new THREE.Group();
  raiz.visible = false;
  escena.add(raiz);
  const mats = new Map(), geos = new Map();
  const mat = (color, op = 1) => { const k = `${color}|${op}`; let m = mats.get(k); if (!m) { m = new THREE.MeshLambertMaterial({ color, ...(op < 1 ? { transparent: true, opacity: op } : {}) }); mats.set(k, m); } return m; };
  const geo = (k, f) => { let g = geos.get(k); if (!g) { g = f(); geos.set(k, g); } return g; };
  const caja = (x, y, z) => geo(`c${x}|${y}|${z}`, () => new THREE.BoxGeometry(x, y, z));
  const cil = (r0, r1, h, l = 10) => geo(`y${r0}|${r1}|${h}|${l}`, () => new THREE.CylinderGeometry(r1, r0, h, l));
  const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = false; o.receiveShadow = false; return o; };
  const info = { vistos: 0, usados: 0, notas: 0 };
  // (se acomoda en el mundo con el marco del edificio: el origen en el piso de adentro, la puerta mirando a +z)
  if (ctx.lugar) { const c = ctx.lugar.aMundo(0, 0); raiz.position.set(c.x, ctx.lugar.pisoY(), c.z); raiz.rotation.y = ctx.lugar.rotMundo(0); }

  // ---------------------------------------------------------------- las paredes
  // `pared(x, y, z, giro)`: un grupo pegado a la pared, mirando para adentro del cuarto (giro 0: mira a +z; PI: a -z; PI/2: a +x; -PI/2: a -x)
  const pared = (x, y, z, giro) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = giro; raiz.add(g); return g; };
  // un cuadro pintado por código (un lienzo chico: no hay archivos): el paisaje del valle, el atardecer en la meseta, un retrato
  const lienzos = [];
  function pintar(tipo) {
    if (typeof document === 'undefined') return null;
    try {
      const c = document.createElement('canvas'); c.width = 96; c.height = 72;
      const g = c.getContext('2d');
      if (tipo === 0) {   // el lago con la cordillera
        let q = g.createLinearGradient(0, 0, 0, 40); q.addColorStop(0, '#9ab8d0'); q.addColorStop(1, '#e8dcc0'); g.fillStyle = q; g.fillRect(0, 0, 96, 72);
        g.fillStyle = '#5a6a7a'; g.beginPath(); g.moveTo(0, 40); g.lineTo(20, 16); g.lineTo(34, 30); g.lineTo(54, 10); g.lineTo(74, 32); g.lineTo(96, 20); g.lineTo(96, 42); g.lineTo(0, 42); g.fill();
        g.fillStyle = '#f2f0ea'; g.beginPath(); g.moveTo(54, 10); g.lineTo(46, 21); g.lineTo(62, 21); g.fill(); g.beginPath(); g.moveTo(20, 16); g.lineTo(14, 24); g.lineTo(27, 24); g.fill();
        q = g.createLinearGradient(0, 42, 0, 72); q.addColorStop(0, '#5d8aa0'); q.addColorStop(1, '#2e5a72'); g.fillStyle = q; g.fillRect(0, 42, 96, 30);
        g.fillStyle = '#3d5a34'; g.fillRect(0, 40, 96, 4);
      } else if (tipo === 1) {   // el atardecer en la meseta, con un ranchito
        const q = g.createLinearGradient(0, 0, 0, 72); q.addColorStop(0, '#c85a38'); q.addColorStop(0.5, '#f0a050'); q.addColorStop(0.7, '#e8c878'); q.addColorStop(1, '#8a6a3a'); g.fillStyle = q; g.fillRect(0, 0, 96, 72);
        g.fillStyle = '#6a4a2a'; g.fillRect(0, 50, 96, 22); g.fillStyle = '#2a1e16'; g.fillRect(58, 40, 18, 12); g.beginPath(); g.moveTo(55, 41); g.lineTo(67, 31); g.lineTo(79, 41); g.fill();
        g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(24, 46, 8, 0, 6.3); g.fill();
      } else {   // un retrato, de bigote y sombrero
        g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, 96, 72);
        g.fillStyle = '#c8966a'; g.beginPath(); g.ellipse(48, 38, 15, 19, 0, 0, 6.3); g.fill();
        g.fillStyle = '#2a1a10'; g.fillRect(28, 16, 40, 8); g.fillRect(36, 6, 24, 12); g.fillRect(40, 45, 16, 4);
        g.fillStyle = '#7a1e2a'; g.fillRect(26, 58, 44, 14);
      }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; lienzos.push(t);
      return t;
    } catch { return null; }
  }
  function cuadro(p, x, y, ancho, alto, tipo, marco = '#5a3a22') {
    p.add(mesh(caja(ancho + 0.08, alto + 0.08, 0.04), mat(marco), x, y, 0.02));
    const t = pintar(tipo);
    const l = new THREE.Mesh(geo(`pl${ancho}|${alto}`, () => new THREE.PlaneGeometry(ancho, alto)), t ? new THREE.MeshLambertMaterial({ map: t }) : mat(['#7a9ab0', '#e0a050', '#5a3a28'][tipo % 3]));
    l.position.set(x, y, 0.045); p.add(l);
  }
  // la herradura de la suerte (con la abertura para arriba, como se cuelga para que no se escape la suerte): un arco de hierro con sus clavos
  const geoHerradura = () => geo('herradura', () => new THREE.TorusGeometry(0.085, 0.017, 5, 14, PI * 1.62));
  function herradura(p, x, y, giro = 0) {
    const h = mesh(geoHerradura(), mat('#3a3834'), x, y, 0.03);
    h.rotation.z = PI / 2 + PI * 0.19 + giro;
    p.add(h);
    for (let i = 0; i < 3; i++) { const a = h.rotation.z + 0.4 + i * 0.5; p.add(mesh(caja(0.012, 0.012, 0.012), mat('#c8b890'), x + Math.cos(a) * 0.085, y + Math.sin(a) * 0.085, 0.048)); }
  }
  // el cartel de «hoy no se fía»: un tablón con letras pintadas
  function cartel(p, x, y) {
    p.add(mesh(caja(0.7, 0.3, 0.03), mat('#7a5a34'), x, y, 0.015));
    if (typeof document === 'undefined') return;
    try {
      const c = document.createElement('canvas'); c.width = 224; c.height = 96;
      const g = c.getContext('2d');
      g.fillStyle = '#d8c490'; g.fillRect(0, 0, 224, 96);
      g.fillStyle = '#4a2218'; g.textAlign = 'center'; g.font = 'bold 30px Georgia, serif';
      g.fillText('HOY NO SE FÍA', 112, 40); g.font = 'italic 24px Georgia, serif'; g.fillText('mañana sí', 112, 78);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; lienzos.push(t);
      const l = new THREE.Mesh(geo('pl-cartel', () => new THREE.PlaneGeometry(0.64, 0.26)), new THREE.MeshLambertMaterial({ map: t }));
      l.position.set(x, y, 0.034); p.add(l);
    } catch { /* sin letras */ }
  }
  // el reloj de pared con péndulo: la esfera, el aro de madera, las marcas, las dos agujas y el péndulo
  let agujaH = null, agujaM = null, pendulo = null;
  function reloj(p, x, y) {
    p.add(mesh(caja(0.34, 0.5, 0.07), mat('#5a3a22'), x, y - 0.08, 0.035));
    const cara = mesh(cil(0.14, 0.14, 0.012, 20), mat('#efe8d4'), x, y + 0.05, 0.075); cara.rotation.x = PI / 2; p.add(cara);
    const aro = mesh(cil(0.15, 0.15, 0.01, 20), mat('#3a2418'), x, y + 0.05, 0.07); aro.rotation.x = PI / 2; p.add(aro);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; const marca = mesh(caja(i % 3 ? 0.008 : 0.014, i % 3 ? 0.022 : 0.034, 0.004), mat('#2a1e16'), x + Math.sin(a) * 0.116, y + 0.05 + Math.cos(a) * 0.116, 0.083); marca.rotation.z = -a; p.add(marca); }
    const pivote = (largo, ancho, z) => { const g = new THREE.Group(); g.position.set(x, y + 0.05, z); const b = mesh(caja(ancho, largo, 0.004), mat('#1a1410'), 0, largo / 2, 0); g.add(b); p.add(g); return g; };
    agujaH = pivote(0.07, 0.013, 0.086); agujaM = pivote(0.105, 0.009, 0.09);
    pendulo = new THREE.Group(); pendulo.position.set(x, y - 0.12, 0.08);
    pendulo.add(mesh(caja(0.008, 0.2, 0.004), mat('#b8a060'), 0, -0.1, 0)); { const peso = mesh(cil(0.04, 0.04, 0.01, 12), mat('#c8aa50'), 0, -0.21, 0); peso.rotation.x = PI / 2; pendulo.add(peso); }
    p.add(pendulo);
  }

  // la pared del frente (de la puerta para adentro: mira a -z), la del fondo del salón (el tabique del cuarto de atrás: mira a +z) y las laterales
  const frente = pared(0, 0, 3.86, PI);
  cuadro(frente, -1.75, 1.62, 0.5, 0.38, 0); cuadro(frente, 1.75, 1.6, 0.46, 0.46, 2, '#6a4a2a');
  herradura(frente, 0, 2.5); herradura(frente, -2.25, 2.12, 0.1); herradura(frente, 2.3, 2.1, -0.1);
  const fondo = pared(0, 0, -1.31, 0);
  reloj(fondo, -1.5, 1.85);
  cuadro(fondo, 0.6, 1.75, 0.6, 0.42, 1, '#4a2e1c');
  cartel(fondo, -3.45, 1.7);
  const derecha = pared(5.05, 0, 0, -PI / 2);
  herradura(derecha, -2.2, 2.0, 0.05); herradura(derecha, 0.9, 2.15); herradura(derecha, -3.0, 2.0, -0.08);
  const izquierda = pared(-5.05, 0, 0, PI / 2);
  herradura(izquierda, 3.4, 2.05, 0.12);

  // ---------------------------------------------------------------- los vasos y los platos usados
  // Cada mesa tiene sus lugares de lo usado; de noche, según el día, algunas lo tienen. Quedan hasta que ella limpia, a la mañana. Se esconden en la mesa donde te están sirviendo.
  const usados = [];
  const ALTO_MESA = 0.78;
  const MESAS = CANTINA.mesas;
  function lugarUsado(mx, mz, k) {
    const g = new THREE.Group();
    const sx = k % 2 ? 1 : -1;
    g.position.set(mx + sx * 0.36, ALTO_MESA, mz + (k > 1 ? 0.2 : -0.16));
    if (k === 0 || k === 3) {
      g.add(mesh(cil(0.026, 0.032, 0.09, 8), mat('#b8d4cc', 0.7), 0, 0.045, 0));
      g.add(mesh(cil(0.026, 0.026, 0.012, 8), mat(k === 0 ? '#6a1426' : '#d8a030'), 0, 0.012, 0));
    } else if (k === 1) {
      g.add(mesh(cil(0.07, 0.085, 0.014, 10), mat('#ece4d2'), 0, 0.007, 0));
      g.add(mesh(caja(0.012, 0.004, 0.11), mat('#b8b8b0'), 0.02, 0.016, 0.02)); g.rotation.y = 0.6;
      g.add(mesh(cil(0.016, 0.016, 0.005, 6), mat('#8a5a2a'), -0.03, 0.017, -0.02));
    } else {
      g.add(mesh(cil(0.038, 0.044, 0.12, 8), mat('#b8d4cc', 0.7), 0, 0.06, 0));
      g.add(mesh(cil(0.03, 0.03, 0.014, 8), mat('#d8c070'), 0, 0.012, 0));
      g.add(mesh(caja(0.012, 0.07, 0.02), mat('#b8d4cc', 0.7), 0.05, 0.06, 0));
    }
    g.visible = false;
    raiz.add(g);
    return g;
  }
  MESAS.forEach((m, i) => { for (let k = 0; k < 4; k++) usados.push({ mesa: m.id, i, k, g: lugarUsado(m.x, m.z, k) }); });
  // en la barra, la pila de vasos sucios a la izquierda de la pileta (siempre en el horario de atención)
  const pila = new THREE.Group(); pila.position.set(-3.1, 0.98, 1.0);
  for (let i = 0; i < 4; i++) pila.add(mesh(cil(0.03, 0.036, 0.09, 8), mat('#b8d4cc', 0.7), (i % 2) * 0.05 - 0.02, 0.045 + (i > 1 ? 0.08 : 0), (i % 3) * 0.04 - 0.04));
  pila.visible = false; raiz.add(pila);
  const usadoAhora = (hora) => { const h = ((Number(hora) % 24) + 24) % 24; return h >= HORA_USADOS.desde || h < HORA_USADOS.hasta; };
  function actualizarUsados(dia, hora, ocupada) {
    const hay = usadoAhora(hora);
    const noche = (Number(hora) % 24) < HORA_USADOS.hasta ? dia - 1 : dia;
    let n = 0;
    for (const u of usados) {
      const ok = hay && !ocupada(u.mesa) && azar(noche * 31 + u.i * 7 + u.k * 3) < (u.k === 0 || u.k === 1 ? 0.62 : 0.36);
      u.g.visible = ok; if (ok) n++;
    }
    pila.visible = hay;
    info.usados = n;
  }

  // ---------------------------------------------------------------- la música de fondo
  const musica = { destino: null, t0: 0, paso: 0, hasta: 0, pausa: 0 };
  function callar(s) {
    if (!musica.destino) return;
    const d = musica.destino; musica.destino = null;
    try { if (s?.ctx) d.gain.setTargetAtTime(0, s.ctx.currentTime, 0.4); } catch { /* ya */ }
    setTimeout(() => { try { d.disconnect(); } catch { /* ya */ } }, 2500);
  }
  function sonar(s, vol) {
    const ahora = s.ctx.currentTime;
    if (!musica.destino) {
      if (ahora < musica.pausa) return;
      const d = s.ctx.createGain(); d.gain.value = vol; d.connect(s.bus.musica);
      if (s.envioReverb) { const rv = s.ctx.createGain(); rv.gain.value = 0.35; d.connect(rv); rv.connect(s.envioReverb); }
      musica.destino = d; musica.t0 = ahora + 0.2; musica.paso = 0; musica.hasta = 32 + Math.floor(Math.random() * 3) * 8;   // una frase de 4 a 5 vueltas de los acordes
    }
    try { musica.destino.gain.setTargetAtTime(vol, ahora, 0.35); } catch { /* ya */ }
    const limite = ahora + 1.2;
    while (musica.t0 + musica.paso * CORCHEA <= limite && musica.paso < musica.hasta) {
      const k = musica.paso, acorde = ACORDES[Math.floor(k / 8) % 4], cuerda = PATRON[k % 8];
      const cuando = Math.max(0, musica.t0 + k * CORCHEA - ahora);
      s.pulsar?.(acorde[cuerda] + (cuerda === 0 ? 0 : 0), { cuando, dur: 1.6, vol: cuerda === 0 ? 0.075 : 0.05, destino: musica.destino });
      info.notas++;
      musica.paso++;
    }
    if (musica.paso >= musica.hasta && ahora > musica.t0 + musica.hasta * CORCHEA + 1) { callar(s); musica.pausa = ahora + 8 + Math.random() * 14; }
  }

  // ---------------------------------------------------------------- cada cuadro
  // `i`: { distancia, adentro, hora, dia, ocupada(mesaId), peña (hay música de peña), baja (0 a 1: está hablando con alguien), abierta }
  let ultimo = 0, reloj0 = 0;
  function actualizar(dt, i) {
    reloj0 += dt;
    const cerca = i.distancia < 45;
    if (raiz.visible !== cerca) raiz.visible = cerca;
    if (!cerca) { if (musica.destino) callar(ctx.sonido?.()); return; }
    ultimo += dt;
    if (ultimo > 1.5) { ultimo = 0; actualizarUsados(i.dia, i.hora, i.ocupada || (() => false)); }
    if (i.distancia < 14 && agujaH) {
      const h = ((Number(i.hora) % 12) + 12) % 12;
      agujaH.rotation.z = -(h / 12) * PI * 2; agujaM.rotation.z = -((Number(i.hora) % 1) * PI * 2);
      pendulo.rotation.z = Math.sin(reloj0 * 2.6) * 0.2;
    }
    const s = ctx.sonido?.();
    const quiere = i.abierta && !i.pena && i.distancia < 16 && s?.ctx && s.bus?.musica && s.musicaActiva !== false;
    if (!quiere) { if (musica.destino) callar(s); return; }
    const vol = (i.adentro ? 1 : Math.max(0, 1 - (i.distancia - 6) / 10) * 0.45) * (1 - 0.65 * (i.baja || 0)) * 0.9;
    sonar(s, vol);
  }
  function soltar() { for (const t of lienzos) t.dispose?.(); }
  return { actualizar, callar: () => callar(ctx.sonido?.()), raiz, estado: () => ({ ...info, visible: raiz.visible, sonando: !!musica.destino }), soltar };
}
