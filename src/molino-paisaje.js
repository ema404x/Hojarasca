// 4.0 (molino y puente): lo que rodea al molino de viento, como la referencia: el campo de tulipanes en franjas de colores, los cercos de
// madera, el arroyo del molino con su cascadita de rocas y la casa con galería (faroles, tonel). El plano (lugares, medidas, colores) es de
// `molino-paisaje-plano.js` (puro, con su prueba); esto lo dibuja, todo por código, en el marco local del molino.
//
//  · tulipanes: 5 mallas instanciadas (una por color, ~30 triángulos cada planta), con `materialVegetal` (la hoja es tipo 2 y la flor tipo 3:
//    se tiñen en otoño y se cierran con el invierno como el resto). La calidad saca plantas parejo por todo el campo (`aplicarCalidad`).
//  · casa, cercos y rocas: una sola malla estática con el material de las obras (una sola llamada de dibujo).
//  · agua: dos cintas (el agua y la espuma de la caída) que siguen el terreno, con textura pintada que corre; sin excavar el valle.
// Nada de esto usa el azar del sorteo del valle (ver el plano) ni toca las sombras (sólo la casa tira sombra).
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { materialVegetal } from './materiales.js';
import { ferreteriaFarolColgado } from './casa-te-luz.js';
import { CAMPO, COLORES_TULIPAN, CERCOS, ARROYO, CASA, azarFijo, sembrarTulipanes, cantidadConDensidad, muestrearArroyo, zonasDespeje, } from './molino-paisaje-plano.js';

const MADERA = '#6e5238', OSCURA = '#4e3a28', TABLA = '#8a6b4a', TABLA_CLARA = '#9a7a55', HIERRO = '#2d2926';
const PIEDRAS = ['#8a8277', '#7a7268', '#948b7e', '#6f675d', '#a09686'];

const LIENZO_OK = () => typeof document !== 'undefined';
function lienzo(ancho, alto, dibujar) {
  const l = document.createElement('canvas'); l.width = ancho; l.height = alto;
  dibujar(l.getContext('2d'), ancho, alto);
  const t = new THREE.CanvasTexture(l);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = 1000; t.wrapT = 1001;   /* RepeatWrapping y ClampToEdgeWrapping: el three local no trae los nombres */ t.anisotropy = 4;
  return t;
}
function texturaAgua() {
  return lienzo(256, 128, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#3f8ea0'); g.addColorStop(0.5, '#5aa6b8'); g.addColorStop(1, '#3a8496');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    // cintas claras largas en el sentido de la corriente (se repiten en los bordes para que la textura empalme) y chispas de sol
    for (let i = 0; i < 46; i++) {
      const y = azarFijo(i, 1) * h, l = 30 + azarFijo(i, 2) * 70, px = azarFijo(i, 3) * w;
      x.strokeStyle = `rgba(${220 + azarFijo(i, 7) * 30},248,250,${0.18 + azarFijo(i, 4) * 0.32})`; x.lineWidth = 1.5 + azarFijo(i, 5) * 2.5; x.lineCap = 'round';
      for (const o of [-w, 0, w]) { x.beginPath(); x.moveTo(px + o, y); x.lineTo(px + o + l, y + (azarFijo(i, 6) - 0.5) * 6); x.stroke(); }
    }
    for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,255,255,${0.25 + azarFijo(i, 8) * 0.4})`; x.beginPath(); x.arc(azarFijo(i, 9) * w, azarFijo(i, 10) * h, 1 + azarFijo(i, 11) * 1.6, 0, 7); x.fill(); }
    // los bordes se deshacen: la cinta se funde con la orilla
    x.globalCompositeOperation = 'destination-in';
    const a = x.createLinearGradient(0, 0, 0, h);
    a.addColorStop(0, 'rgba(0,0,0,0)'); a.addColorStop(0.2, 'rgba(0,0,0,0.9)'); a.addColorStop(0.5, 'rgba(0,0,0,1)'); a.addColorStop(0.8, 'rgba(0,0,0,0.9)'); a.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = a; x.fillRect(0, 0, w, h);
  });
}
function texturaEspuma() {
  return lienzo(128, 128, (x, w, h) => {
    x.fillStyle = 'rgba(235,245,248,0.55)'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const y = azarFijo(i, 21) * h, l = 14 + azarFijo(i, 22) * 40, px = azarFijo(i, 23) * w;
      x.strokeStyle = `rgba(255,255,255,${0.35 + azarFijo(i, 24) * 0.55})`; x.lineWidth = 2 + azarFijo(i, 25) * 4; x.lineCap = 'round';
      for (const o of [-w, 0, w]) { x.beginPath(); x.moveTo(px + o, y); x.lineTo(px + o + l, y); x.stroke(); }
    }
    x.globalCompositeOperation = 'destination-in';
    const a = x.createLinearGradient(0, 0, 0, h);
    a.addColorStop(0, 'rgba(0,0,0,0)'); a.addColorStop(0.25, 'rgba(0,0,0,1)'); a.addColorStop(0.75, 'rgba(0,0,0,1)'); a.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = a; x.fillRect(0, 0, w, h);
  });
}

// ---------------------------------------------------------------- piezas sueltas
function tulipan(color) {
  const c = new Constructor();
  c.agregar(new THREE.CylinderGeometry(0.009, 0.012, CAMPO.alto, 3), { color: '#4d8a2e', tipo: 2, variar: 0.08, matriz: matriz([0, CAMPO.alto / 2, 0]) });
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1 + 0.4;
    c.agregar(new THREE.ConeGeometry(0.03, 0.3, 3, 1, true), { color: i % 2 ? '#5c9c36' : '#3f7a28', tipo: 2, variar: 0.1,
      matriz: matriz([Math.cos(a) * 0.02, 0.15, Math.sin(a) * 0.02], [0.28, Math.PI / 2 - a, 0], [1.7, 1, 0.45]) });
  }
  c.agregar(new THREE.IcosahedronGeometry(0.058, 0), { color, tipo: 3, variar: 0.1, matriz: matriz([0, CAMPO.alto + 0.03, 0], [0, 0.4, 0], [1, 1.5, 1]) });
  c.agregar(new THREE.IcosahedronGeometry(0.036, 0), { color, tipo: 3, variar: 0.05, matriz: matriz([0, CAMPO.alto + 0.115, 0], [0, 1.1, 0], [1, 1.2, 1]) });
  return c.geometria();
}
function roca(c, pos, r, color, giro = 0, esc = [1.25, 0.8, 1]) {
  c.agregar(new THREE.IcosahedronGeometry(r, 0), { color, tipo: 4, variar: 0.14, matriz: matriz(pos, [giro * 0.3, giro, giro * 0.2], esc) });
}
// una tabla o un listón entre dos puntos (para los cercos que siguen el terreno)
function tablaEntre(c, a, b, grueso, alto, color) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz);
  c.agregar(new THREE.BoxGeometry(l, alto, grueso), { color, tipo: 0, variar: 0.08,
    matriz: matriz([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [0, Math.atan2(-dz, dx), Math.atan2(dy, Math.hypot(dx, dz))]) });
}

// 4.30.0 (B): `puertas` (puertas.js): la casa del molino se entra (pedido del usuario): su puerta es una de verdad, que se abre con E
export function crearMolinoPaisaje({ T, escena, col, molino, densidad = 1, puertas = null }) {
  if (!molino) return null;
  const rot = molino.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot);
  const mundo = (lx, lz) => ({ x: molino.x + lx * cr + lz * sr, z: molino.z - lx * sr + lz * cr });
  const th = (lx, lz) => { const p = mundo(lx, lz); return T.altura(p.x, p.z); };
  const rel = (lx, lz) => th(lx, lz) - molino.y;   // altura del terreno en el marco del molino
  const grupo = new THREE.Group(); grupo.name = 'molino-paisaje';
  escena.add(grupo);
  const mat = materialVegetal({ flex: 0 });
  // 4.0.1: el sendero real (que NO se mueve) cruza el campo y sale por la esquina sudeste del cerco; lo nuevo le deja paso: sin flores sobre el camino y con un hueco en el cerco
  const alSendero = (lx, lz) => { const p = mundo(lx, lz); return typeof T.val === 'function' && T.distSendero ? T.val(T.distSendero, p.x, p.z) : 999; };
  const LIBRE_FLORES = 1.6, LIBRE_CERCO = 1.0;

  // ============================================================ el campo de tulipanes (instanciado)
  const siembra = sembrarTulipanes();
  for (const color of Object.keys(siembra.porColor)) siembra.porColor[color] = siembra.porColor[color].filter((t) => alSendero(t.x, t.z) >= LIBRE_FLORES);
  const tul = [];   // { malla, todos, color }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  for (const [color, lista] of Object.entries(siembra.porColor)) {
    const malla = new THREE.InstancedMesh(tulipan(COLORES_TULIPAN[color] || '#d3202a'), materialVegetal({ flex: 0.5 }), lista.length);
    malla.name = `tulipanes-${color}`;
    lista.forEach((t, i) => {
      const p = mundo(t.x, t.z);
      e.set(0, t.giro, 0); q.setFromEuler(e); v.set(p.x, T.altura(p.x, p.z) - 0.02, p.z); s.set(t.esc, t.esc * (0.9 + azarFijo(t.x, t.z, 8) * 0.25), t.esc);
      m4.compose(v, q, s); malla.setMatrixAt(i, m4);
    });
    malla.instanceMatrix.needsUpdate = true;
    malla.castShadow = false; malla.receiveShadow = false;
    malla.frustumCulled = false;   // el campo es chico y siempre cerca de su propio centro: se oculta entero por distancia
    grupo.add(malla);
    tul.push({ malla, total: lista.length });
  }
  const centroCampo = mundo((CAMPO.lx0 + CAMPO.lx1) / 2, (CAMPO.lz0 + CAMPO.lz1) / 2);
  function aplicarCalidad(d) {
    for (const t of tul) t.malla.count = cantidadConDensidad(t.total, d);
  }
  aplicarCalidad(densidad);

  // ============================================================ la malla estática: cercos, rocas, casa
  const c = new Constructor();
  const colisiones = [];   // { seg o círculo } en mundo
  const plataformas = [];   // 4.30.0 (B): los pisos que se pisan (la casa, la galería y los escalones), en mundo
  const seg = (a, b, r, y0, y1) => {
    const A = mundo(a[0], a[1]), B = mundo(b[0], b[1]);
    colisiones.push({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r, alturaMin: y0, alturaMax: y1 });
  };

  // ---- los cercos: postes cada ~2 m, dos travesaños, siguiendo el terreno; el portón queda abierto (sin postes ni travesaños)
  for (const t of CERCOS.tramos) {
    const largo = Math.hypot(t.b[0] - t.a[0], t.b[1] - t.a[1]), n = Math.max(1, Math.round(largo / CERCOS.poste));
    const pt = (i) => [t.a[0] + (t.b[0] - t.a[0]) * i / n, t.a[1] + (t.b[1] - t.a[1]) * i / n];
    const enPorton = (x) => t.porton && x > t.porton[0] - 0.4 && x < t.porton[1] + 0.4;
    const porElSendero = (x, z) => alSendero(x, z) < LIBRE_CERCO;   // (4.0.1: donde cruza el camino, el cerco se abre como un portón)
    for (let i = 0; i <= n; i++) {
      const [x, z] = pt(i), y = rel(x, z), alto = 1.05 + (azarFijo(x, z, 31) - 0.5) * 0.08;
      if (!(i > 0 && i < n && enPorton(x)) && !porElSendero(x, z)) {
        c.agregar(new THREE.BoxGeometry(0.14, alto + 0.35, 0.14), { color: i % 2 ? MADERA : OSCURA, tipo: 0, variar: 0.1, matriz: matriz([x, y + alto / 2 - 0.17, z], [0, azarFijo(x, z, 32) * 0.4, 0]) });
        c.agregar(new THREE.BoxGeometry(0.17, 0.04, 0.17), { color: OSCURA, tipo: 0, matriz: matriz([x, y + alto + 0.02, z]) });
      }
      if (i < n) {
        const [x2, z2] = pt(i + 1), y2 = rel(x2, z2);
        if (!enPorton((x + x2) / 2) && !porElSendero((x + x2) / 2, (z + z2) / 2) && !porElSendero(x, z) && !porElSendero(x2, z2)) {
          for (const h of [0.86, 0.46]) tablaEntre(c, [x, y + h, z], [x2, y2 + h, z2], 0.06, 0.12, h > 0.7 ? TABLA_CLARA : TABLA);
          seg([x, z], [x2, z2], 0.1, molino.y + Math.min(y, y2) - 0.5, molino.y + Math.max(y, y2) + 1.0);
        }
      }
    }
  }

  // ---- el arroyo: muestras, alturas (sin excavar: el agua queda sobre el terreno) y rocas en las orillas
  const mu = muestrearArroyo(0.8);
  const nivel = new Array(mu.length);
  {
    // en lo llano el agua está a nivel (la sostienen las rocas de las orillas); pasada la caída sigue la loma
    // 4.0.1: ...pero "a nivel" lo ponía en el punto más alto de todo el tramo y la loma cae unos 3,7 m en esos 32 m: el agua quedaba hasta 3,9 m en el aire, con muros de
    // piedra de 4 m y el sendero pasando por debajo. Ahora el agua sigue la loma (con el mismo desfase sobre lo más alto del ancho de cada muestra) y baja a pasos de
    // hasta 0,35 m: sin paredón, sin agua colgada. Lo de después de la caída no cambia.
    let ant = -1e9;
    mu.forEach((m, i) => {
      if (m.x <= ARROYO.lazoDique) {
        let raw = -1e9;
        for (const o of [-1, 0, 1]) raw = Math.max(raw, rel(m.x + m.nx * o * m.ancho * 0.45, m.z + m.nz * o * m.ancho * 0.45));
        ant = ant < -1e8 ? raw + ARROYO.desfase : Math.max(raw + ARROYO.desfase, ant - 0.35);
        nivel[i] = ant;
        return;
      }
      let raw = -1e9;
      for (const o of [-1, 0, 1]) raw = Math.max(raw, rel(m.x + m.nx * o * m.ancho * 0.45, m.z + m.nz * o * m.ancho * 0.45));
      ant = Math.max(raw + 0.07, ant - 0.55);   // la caída: baja de golpe (hasta 0,55 m por muestra), después hugs la loma
      nivel[i] = ant;
    });
  }
  const pasoMu = mu.length > 1 ? mu[1].s - mu[0].s : 0.8;
  // rocas de las orillas (dos hileras, grandes en la caída) y un manantial de piedras al comienzo
  mu.forEach((m, i) => {
    const caida = m.x > ARROYO.lazoDique - 1.5 && m.x < ARROYO.lazoDique + 6;
    for (const lado of [-1, 1]) {
      const k = i * 2 + (lado > 0 ? 1 : 0);
      {
        const hay = azarFijo(i, lado, 41) < (caida ? 0.95 : 0.75);
        const r = (caida ? 0.27 : 0.26) + azarFijo(i, lado, 42) * (caida ? 0.2 : 0.26);
        const off = m.ancho * 0.5 + r * 0.45 + azarFijo(i, lado, 43) * 0.25;
        const x = m.x + m.nx * lado * off, z = m.z + m.nz * lado * off;
        const g = rel(x, z);
        if (nivel[i] - g > 0.35 && m.x <= ARROYO.lazoDique + 2) {
          // donde la orilla queda más baja que el agua (el borde de la terraza), un muro de piedra seca la sostiene (sillares en hiladas)
          const tx = m.nz, tz = -m.nx, ox = m.x + m.nx * lado * (m.ancho / 2 + 0.12), oz = m.z + m.nz * lado * (m.ancho / 2 + 0.12), gw = Math.min(g, rel(ox, oz));
          const filas = Math.ceil((nivel[i] + 0.12 - gw) / 0.3);
          for (let f = 0; f < filas; f++) c.agregar(new THREE.BoxGeometry(pasoMu * 1.1, (nivel[i] + 0.12 - gw) / filas * 0.95, 0.46 + azarFijo(i, f, lado) * 0.08), { color: PIEDRAS[Math.floor(azarFijo(i, f, 40 + lado) * PIEDRAS.length)], tipo: 4, variar: 0.1,
            matriz: matriz([ox + (azarFijo(i, f, 7) - 0.5) * 0.06, gw + (f + 0.5) * (nivel[i] + 0.12 - gw) / filas, oz], [0, Math.atan2(-tz, tx), 0]) });
          if (azarFijo(i, lado, 50) < 0.6) roca(c, [x, nivel[i] + 0.05 + r * 0.3, z], r * 0.8, PIEDRAS[k % PIEDRAS.length], azarFijo(i, lado, 44) * 6.28);
        } else if (hay) {
          roca(c, [x, g + r * 0.3, z], r, PIEDRAS[k % PIEDRAS.length], azarFijo(i, lado, 44) * 6.28, [1.2 + azarFijo(i, lado, 45) * 0.3, 0.7 + azarFijo(i, lado, 46) * 0.2, 1]);
        }
        if (hay && !(nivel[i] - g > 0.35 && m.x <= ARROYO.lazoDique + 2) && azarFijo(i, lado, 47) < 0.45) roca(c, [x + m.nx * lado * 0.3, rel(x, z) + 0.14, z + m.nz * lado * 0.3 + 0.2], r * 0.55, PIEDRAS[(k + 2) % PIEDRAS.length], azarFijo(i, lado, 48) * 6.28);
      }
    }
    // piedras redondas dentro del agua en la bajada, con espuma alrededor (la espuma es la cinta de la caída)
    if (m.x > ARROYO.lazoDique + 1 && i % 3 === 0) {
      const o = (azarFijo(i, 51) - 0.5) * m.ancho * 0.5, x = m.x + m.nx * o, z = m.z + m.nz * o, r = 0.18 + azarFijo(i, 52) * 0.2;
      roca(c, [x, nivel[i] + r * 0.1, z], r, PIEDRAS[i % PIEDRAS.length], azarFijo(i, 53) * 6, [1.1, 0.75, 1]);
    }
  });
  {   // el manantial: un montón de rocas donde nace
    const m = mu[0], mx = m.x - 1.1, mz = m.z;
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2, r = 0.45 + azarFijo(i, 61) * 0.5;
      const x = mx + Math.cos(a) * 1.0, z = mz + Math.sin(a) * 1.0 * 0.8;
      roca(c, [x, rel(x, z) + r * 0.45, z], r, PIEDRAS[i % PIEDRAS.length], i * 1.1, [1.2, 0.95, 1.05]);
    }
    roca(c, [mx - 0.4, nivel[0] + 0.55, mz], 0.8, PIEDRAS[2], 0.7, [1.2, 0.9, 1]);
  }
  // juncos al final del arroyo, donde se pierde en la loma
  {
    const m = mu[mu.length - 1];
    for (let i = 0; i < 26; i++) {
      const a = azarFijo(i, 71) * 6.28, d = azarFijo(i, 72) * 1.8, x = m.x + Math.cos(a) * d, z = m.z + Math.sin(a) * d * 0.7, h = 0.7 + azarFijo(i, 73) * 0.55;
      c.agregar(new THREE.ConeGeometry(0.03, h, 3, 1, true), { color: i % 2 ? '#5c8a3a' : '#7a9a44', tipo: 2, variar: 0.12, matriz: matriz([x, rel(x, z) + h / 2 - 0.04, z], [(azarFijo(i, 74) - 0.5) * 0.4, a, (azarFijo(i, 75) - 0.5) * 0.4], [1.6, 1, 0.5]) });
    }
  }

  // ---- la casa con galería (al oeste del molino, de cara al campo)
  const casa = (() => {
    const { cx, cz, ancho: W, fondo: D, alto: H, galeria: G, cumbrera: Q, voladizo: V } = CASA;
    const x0 = cx - W / 2, x1 = cx + W / 2, z0 = cz - D / 2, z1 = cz + D / 2;
    const esq = [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [cx, cz], [cx, z1 + G], [x0, z1 + G], [x1, z1 + G]];
    const F = Math.max(...esq.map(([x, z]) => rel(x, z))) + 0.3;   // el piso, 30 cm sobre la parte más alta del terreno
    const bajo = Math.min(...esq.map(([x, z]) => rel(x, z))) - 0.35;
    // zócalo de piedra apilada (de abajo del terreno hasta el piso), con la galería adelante
    const zocalo = (xa, xb, za, zb, alto) => {
      const ancho = xb - xa, fondo = zb - za, cxm = (xa + xb) / 2, czm = (za + zb) / 2;
      c.agregar(new THREE.BoxGeometry(ancho, alto, fondo), { color: '#756e63', tipo: 4, variar: 0.08, matriz: matriz([cxm, F - alto / 2 - 0.05, czm]) });
      const filas = Math.max(2, Math.ceil(alto / 0.32));
      for (const [lado, nx, nz] of [[0, 0, 1], [1, 0, -1], [2, 1, 0], [3, -1, 0]]) {
        const largo = lado < 2 ? ancho : fondo, n = Math.round(largo / 0.7);
        for (let f = 0; f < filas; f++) for (let i = 0; i < n; i++) {
          const t = (i + 0.5 + (f % 2) * 0.5) / n; if (t > 1) continue;
          const px = lado < 2 ? xa + t * ancho : (lado === 2 ? xb : xa), pz = lado < 2 ? (lado === 0 ? zb : za) : za + t * fondo;
          const y = F - 0.05 - (f + 0.5) * (alto / filas);
          c.agregar(new THREE.BoxGeometry(lado < 2 ? largo / n * 0.94 : 0.2, alto / filas * 0.92, lado < 2 ? 0.2 : largo / n * 0.94), { color: PIEDRAS[Math.floor(azarFijo(i, f, lado) * PIEDRAS.length)], tipo: 4, variar: 0.1,
            matriz: matriz([px + nx * 0.06, y, pz + nz * 0.06]) });
        }
      }
    };
    zocalo(x0 - 0.05, x1 + 0.05, z0 - 0.05, z1 + 0.05, F - bajo + 0.05);
    zocalo(x0 + 0.25, x1 - 0.25, z1, z1 + G, F - bajo + 0.05);   // y el de la galería
    // paredes de tablas horizontales (hiladas que alternan el tono); el frente lleva puerta y dos ventanas
    const hiladas = Math.round(H / 0.34), hh = H / hiladas;
    const VANO_MEDIO = 0.5, VANO_ALTO = 2.0;   // 4.30.0 (B): el vano de la puerta (1 m por 2 m, como la tabla que había)
    const pared = (xa, xb, za, zb, ang) => {
      const largo = Math.hypot(xb - xa, zb - za);
      for (let f = 0; f < hiladas; f++) c.agregar(new THREE.BoxGeometry(largo, hh * 0.97, 0.2), { color: f % 2 ? '#9a7752' : '#8c6a47', tipo: 0, variar: 0.08, matriz: matriz([(xa + xb) / 2, F + (f + 0.5) * hh, (za + zb) / 2], [0, ang, 0]) });
    };
    pared(x0, x1, z0, z0, 0); pared(x0, x0, z0, z1, Math.PI / 2); pared(x1, x1, z0, z1, Math.PI / 2);
    // 4.30.0 (B): el frente, con el vano de la puerta de verdad (antes era una tabla oscura pegada sobre la pared entera: la casa no se entraba)
    for (let f = 0; f < hiladas; f++) {
      const ya = F + f * hh, yc = F + (f + 0.5) * hh, color = f % 2 ? '#9a7752' : '#8c6a47';
      if (ya < F + VANO_ALTO) {
        for (const [xa, xb] of [[x0, cx - VANO_MEDIO], [cx + VANO_MEDIO, x1]]) c.agregar(new THREE.BoxGeometry(xb - xa, hh * 0.97, 0.2), { color, tipo: 0, variar: 0.08, matriz: matriz([(xa + xb) / 2, yc, z1]) });
      } else c.agregar(new THREE.BoxGeometry(x1 - x0, hh * 0.97, 0.2), { color, tipo: 0, variar: 0.08, matriz: matriz([(x0 + x1) / 2, yc, z1]) });
    }
    { const arriba = F + Math.ceil(VANO_ALTO / hh) * hh; if (arriba > F + VANO_ALTO + 0.01) c.agregar(new THREE.BoxGeometry(VANO_MEDIO * 2 + 0.1, arriba - F - VANO_ALTO, 0.2), { color: OSCURA, tipo: 0, matriz: matriz([cx, (F + VANO_ALTO + arriba) / 2, z1]) }); }
    // postes de esquina
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) c.agregar(new THREE.BoxGeometry(0.26, H + 0.05, 0.26), { color: OSCURA, tipo: 0, variar: 0.06, matriz: matriz([x, F + H / 2, z]) });
    // frente: puerta al centro y dos ventanas con postigos y alféizar
    const fz = z1 + 0.11;
    // (4.30.0 (B): la hoja de la puerta es de puertas.js; sin ellas, el vano queda abierto)
    c.agregar(new THREE.BoxGeometry(1.2, 0.12, 0.12), { color: OSCURA, tipo: 0, matriz: matriz([cx, F + 2.05, fz + 0.02]) });
    for (const l of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.12, 2.0, 0.12), { color: OSCURA, tipo: 0, matriz: matriz([cx + l * 0.56, F + 1.0, fz + 0.02]) });
    for (const sx of [-1, 1]) {
      const vx = cx + sx * 2.6;
      c.agregar(new THREE.BoxGeometry(0.9, 0.9, 0.05), { color: '#2a2f33', tipo: 4, matriz: matriz([vx, F + 1.45, fz]) });
      c.agregar(new THREE.BoxGeometry(1.1, 0.1, 0.14), { color: OSCURA, tipo: 0, matriz: matriz([vx, F + 0.95, fz + 0.03]) });
      c.agregar(new THREE.BoxGeometry(0.06, 0.9, 0.06), { color: OSCURA, tipo: 0, matriz: matriz([vx, F + 1.45, fz + 0.04]) });
      for (const l of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.42, 0.95, 0.05), { color: '#4d6b52', tipo: 0, variar: 0.08, matriz: matriz([vx + l * 0.68, F + 1.45, fz + 0.04]) });
    }
    // ventanita del costado y del fondo
    for (const [x, z, ang] of [[x1 + 0.11, cz, Math.PI / 2], [x0 - 0.11, cz + 0.6, Math.PI / 2], [cx, z0 - 0.11, 0]]) {
      c.agregar(new THREE.BoxGeometry(0.8, 0.8, 0.05), { color: '#2a2f33', tipo: 4, matriz: matriz([x, F + 1.5, z], [0, ang, 0]) });
      c.agregar(new THREE.BoxGeometry(1.0, 0.09, 0.12), { color: OSCURA, tipo: 0, matriz: matriz([x, F + 1.05, z], [0, ang, 0]) });
    }
    // techo a dos aguas de tejuelas: placa de base y hiladas que se montan, con voladizo adelante y atrás
    const TEJA = ['#614835', '#6a513b', '#593f2f', '#6e5441'];
    const semiD = D / 2 + V, ang = Math.atan2(Q, D / 2), Qs = Q * semiD / (D / 2), largoPend = Math.hypot(semiD, Qs), yR = F + H + Q;
    for (const sz of [-1, 1]) {
      const w = W + V * 2, filas = 9, nx = 0, nyv = Math.cos(ang), nzv = sz * Math.sin(ang);
      c.agregar(new THREE.BoxGeometry(w, 0.1, largoPend), { color: '#3f2f24', tipo: 4, matriz: matriz([cx, yR - Qs / 2, cz + sz * semiD / 2], [sz * ang, 0, 0]) });
      for (let f = 0; f < filas; f++) {
        const u = (f + 0.5) / filas, zz = cz + sz * semiD * (1 - u), yy = yR - Qs * (1 - u), n = Math.round(w / 0.62);
        for (let i = 0; i < n; i++) c.agregar(new THREE.BoxGeometry(w / n * 0.97, 0.05, largoPend / filas * 1.35), { color: TEJA[Math.floor(azarFijo(i, f, sz + 5) * TEJA.length)], tipo: 4, variar: 0.06,
          matriz: matriz([x0 - V + (i + 0.5) * w / n + nx, yy + 0.05 * nyv, zz + 0.05 * nzv], [sz * ang, 0, 0]) });
      }
    }
    c.agregar(new THREE.BoxGeometry(W + V * 2 + 0.1, 0.12, 0.22), { color: OSCURA, tipo: 0, matriz: matriz([cx, yR + 0.07, cz]) });
    // hastiales (tablas verticales en rebanadas, cada una hasta la altura del techo ahí) a los dos lados
    for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) {
      const zc = z0 + D / 12 + i * D / 6, alto = Math.max(0.15, Q * (1 - Math.abs(zc - cz) / (D / 2)) - 0.04);
      c.agregar(new THREE.BoxGeometry(0.2, alto, D / 6 * 0.98), { color: i % 2 ? '#8c6a47' : '#9a7752', tipo: 0, variar: 0.06, matriz: matriz([cx + sx * (W / 2), F + H + alto / 2 - 0.02, zc]) });
    }
    // chimenea de piedra en el costado oeste, con su tapa
    {
      const chx = x0 - 0.45, chz = cz - 0.2;
      const base = rel(chx, chz) - 0.3, top = F + H + Q + 0.8;
      for (let y = base; y < top; y += 0.3) for (const [ox, oz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
        c.agregar(new THREE.BoxGeometry(0.46, 0.29, 0.46), { color: PIEDRAS[Math.floor(azarFijo(y, ox, oz) * PIEDRAS.length)], tipo: 4, variar: 0.1, matriz: matriz([chx + ox * 0.5, y + 0.15, chz + oz * 0.5], [0, azarFijo(y, ox, oz) * 0.2, 0]) });
      }
      c.agregar(new THREE.BoxGeometry(1.15, 0.12, 1.15), { color: '#4a443d', tipo: 4, matriz: matriz([chx, top + 0.06, chz]) });
    }
    // ---- la galería: piso de tablas un poco más alto, postes, travesaño, techo de tejuelas más bajo, baranda de listones
    const gz0 = z1, gz1 = z1 + G, gx0 = x0 + 0.3, gx1 = x1 - 0.3, gF = F + 0.02;
    for (let i = 0; i < Math.round((gx1 - gx0) / 0.3); i++) {
      c.agregar(new THREE.BoxGeometry(0.28, 0.12, G), { color: i % 3 ? '#8a6b4a' : '#7a5e42', tipo: 0, variar: 0.1, matriz: matriz([gx0 + 0.15 + i * 0.3, gF - 0.06, (gz0 + gz1) / 2]) });
    }
    c.agregar(new THREE.BoxGeometry(gx1 - gx0, 0.2, 0.18), { color: OSCURA, tipo: 0, matriz: matriz([(gx0 + gx1) / 2, gF - 0.2, gz1 - 0.05]) });
    const postesX = [gx0, gx0 + (gx1 - gx0) / 3, gx0 + 2 * (gx1 - gx0) / 3, gx1];
    const hP = 2.0;
    for (const px of postesX) {
      c.agregar(new THREE.BoxGeometry(0.17, hP + 0.2, 0.17), { color: OSCURA, tipo: 0, variar: 0.08, matriz: matriz([px, gF + hP / 2 - 0.1, gz1 - 0.15]) });
      for (const s2 of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.1, 0.1, 0.62), { color: OSCURA, tipo: 0, matriz: matriz([px, gF + hP - 0.28, gz1 - 0.15 - 0.2], [-0.7, 0, 0]) });   // las ménsulas
      colisiones.push({ x: mundo(px, gz1 - 0.15).x, z: mundo(px, gz1 - 0.15).z, r: 0.14, alturaMin: molino.y + F - 0.1, alturaMax: molino.y + F + hP });
    }
    c.agregar(new THREE.BoxGeometry(gx1 - gx0 + 0.4, 0.2, 0.2), { color: MADERA, tipo: 0, variar: 0.06, matriz: matriz([(gx0 + gx1) / 2, gF + hP, gz1 - 0.15]) });
    // el techo de la galería: una agua, desde la pared del frente hacia el borde (con un poco de voladizo)
    {
      const dz = G + 0.3, dy = 0.58, pend = Math.atan2(dy, dz), l = Math.hypot(dz, dy), yTop = F + H + 0.15, w = gx1 - gx0 + 0.9, n = Math.round(w / 0.62), filas = 6;
      c.agregar(new THREE.BoxGeometry(w, 0.09, l), { color: '#3f2f24', tipo: 4, matriz: matriz([(gx0 + gx1) / 2, yTop - dy / 2, z1 + dz / 2], [pend, 0, 0]) });
      for (let f = 0; f < filas; f++) for (let i = 0; i < n; i++) {
        const u = (f + 0.5) / filas;
        c.agregar(new THREE.BoxGeometry(w / n * 0.97, 0.05, l / filas * 1.35), { color: TEJA[Math.floor(azarFijo(i, f, 11) * TEJA.length)], tipo: 4, variar: 0.1,
          matriz: matriz([gx0 - 0.45 + (i + 0.5) * w / n, yTop - dy * u + 0.05 * Math.cos(pend), z1 + dz * u + 0.05 * Math.sin(pend)], [pend, 0, 0]) });
      }
    }
    // baranda de listones entre los postes (con el hueco de la escalerita al medio)
    for (let k = 0; k < 3; k++) {
      const a = postesX[k], b = postesX[k + 1];
      for (const [yy, hh2] of [[0.95, 0.08], [0.62, 0.07], [0.3, 0.07]]) {
        if (k === 1) { c.agregar(new THREE.BoxGeometry((b - a) / 2 - 0.6, hh2, 0.06), { color: TABLA, tipo: 0, matriz: matriz([a + ((b - a) / 2 - 0.6) / 2, gF + yy, gz1 - 0.1]) });
          c.agregar(new THREE.BoxGeometry((b - a) / 2 - 0.6, hh2, 0.06), { color: TABLA, tipo: 0, matriz: matriz([b - ((b - a) / 2 - 0.6) / 2, gF + yy, gz1 - 0.1]) }); }
        else c.agregar(new THREE.BoxGeometry(b - a, hh2, 0.06), { color: TABLA, tipo: 0, matriz: matriz([(a + b) / 2, gF + yy, gz1 - 0.1]) });
      }
    }
    // escalerita al medio, dos escalones hasta el suelo
    // 4.30.0 (B): parejos (de 0,32 m como mucho), macizos hasta el suelo y que se pisan (antes eran dos tablas sueltas de adorno, y la segunda podía quedar colgando)
    const sFrente = rel(cx, gz1 + 0.5);
    // (el suelo se mide al pie del último escalón, no al del primero: en la loma baja y el último quedaba a 0,4 m del pasto)
    let nEsc = 1, dEsc = (gF - sFrente) / 2;
    for (let n = 1; n <= 6; n++) { const pie = rel(cx, gz1 + n * 0.38 + 0.25); nEsc = n; dEsc = (gF - pie) / (n + 1); if (dEsc <= 0.28) break; }
    for (let k = 0; k < nEsc; k++) {
      const tope = gF - (k + 1) * dEsc, zc = gz1 + 0.19 + k * 0.38, pie = Math.min(rel(cx - 0.7, zc), rel(cx + 0.7, zc), rel(cx, zc)) - 0.12;
      if (tope - pie > 0.02) c.agregar(new THREE.BoxGeometry(1.5, tope - pie, 0.38), { color: k % 2 ? '#7a5e42' : '#86684a', tipo: 0, variar: 0.08, matriz: matriz([cx, (tope + pie) / 2, zc]) });
      const q = mundo(cx, zc);
      plataformas.push({ x: q.x, z: q.z, ang: -rot, largo: 1.5, ancho: 0.38, alto: molino.y + tope, espesor: 0.12 });
    }
    // faroles colgados de la viga (dos), tonel con zunchos, macetero con flores y un banco
    const cilF = (r, h, pos, color) => c.agregar(new THREE.CylinderGeometry(r, r, h, 8), { color, tipo: 4, matriz: matriz(pos), variar: 0.04 });
    for (const px of [postesX[1] - 0.9, postesX[2] + 0.9]) {
      ferreteriaFarolColgado(c, cilF, px, gz1 - 0.15, gF + hP - 0.1);
      c.agregar(new THREE.BoxGeometry(0.17, 0.23, 0.17), { color: '#f3cf86', tipo: 4, matriz: matriz([px, gF + hP - 0.1 - 0.425, gz1 - 0.15]) });
    }
    {   // tonel
      const tx = gx0 + 0.55, tz = gz1 - 0.55, ty = gF;
      c.agregar(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 12), { color: '#7a5a3a', tipo: 0, variar: 0.08, matriz: matriz([tx, ty + 0.45, tz]) });
      c.agregar(new THREE.CylinderGeometry(0.44, 0.44, 0.5, 12), { color: '#7a5a3a', tipo: 0, variar: 0.08, matriz: matriz([tx, ty + 0.45, tz]) });
      for (const yy of [0.12, 0.34, 0.58, 0.8]) c.agregar(new THREE.TorusGeometry(0.43 - Math.abs(yy - 0.45) * 0.1, 0.017, 4, 16), { color: HIERRO, tipo: 4, matriz: matriz([tx, ty + yy, tz], [Math.PI / 2, 0, 0]) });
      colisiones.push({ x: mundo(tx, tz).x, z: mundo(tx, tz).z, r: 0.44, alturaMin: molino.y + F, alturaMax: molino.y + F + 1.0 });
    }
    {   // macetero de tablas con flores
      const mx = gx1 - 0.9, mz = gz1 - 0.55;
      c.agregar(new THREE.BoxGeometry(1.2, 0.34, 0.4), { color: '#7a5f43', tipo: 0, variar: 0.08, matriz: matriz([mx, gF + 0.17, mz]) });
      c.agregar(new THREE.BoxGeometry(1.1, 0.04, 0.32), { color: '#3a2c20', tipo: 4, matriz: matriz([mx, gF + 0.34, mz]) });
      for (let i = 0; i < 12; i++) {
        const fx = mx - 0.5 + i * 0.09, hf = 0.22 + azarFijo(i, 81) * 0.2;
        c.agregar(new THREE.CylinderGeometry(0.008, 0.008, hf, 3), { color: '#4d8a2e', tipo: 2, matriz: matriz([fx, gF + 0.34 + hf / 2, mz + (azarFijo(i, 82) - 0.5) * 0.18]) });
        c.agregar(new THREE.IcosahedronGeometry(0.05, 0), { color: ['#d3202a', '#f4c21a', '#d23a82', '#ee7d1a'][i % 4], tipo: 3, variar: 0.1, matriz: matriz([fx, gF + 0.34 + hf + 0.03, mz + (azarFijo(i, 82) - 0.5) * 0.18]) });
      }
      colisiones.push({ seg: true, ax: mundo(mx - 0.6, mz).x, az: mundo(mx - 0.6, mz).z, bx: mundo(mx + 0.6, mz).x, bz: mundo(mx + 0.6, mz).z, r: 0.22, alturaMin: molino.y + F, alturaMax: molino.y + F + 0.5 });
    }
    // física: las cuatro paredes (la casa es de adorno por dentro: no se entra) y el zócalo
    const yA = molino.y + bajo, yB = molino.y + F + H + 0.5;
    // 4.30.0 (B): ya se entra: el frente deja el vano de la puerta (la hoja choca mientras está cerrada: puertas.js)
    seg([x0, z0], [x1, z0], 0.2, yA, yB); seg([x0, z0], [x0, z1], 0.2, yA, yB); seg([x1, z0], [x1, z1], 0.2, yA, yB); seg([x0, z1], [cx - VANO_MEDIO - 0.2, z1], 0.2, yA, yB); seg([cx + VANO_MEDIO + 0.2, z1], [x1, z1], 0.2, yA, yB);
    // 4.0.1: la galería también es de adorno (el zócalo de piedra sube hasta 1,7 m): su frente y sus dos lados son sólidos; antes se la atravesaba hasta la pared de la casa con la cámara adentro del bloque
    // 4.30.0 (B): y la galería se abre en la escalerita (el hueco de la baranda)
    seg([gx0 - 0.3, gz1], [cx - 0.75, gz1], 0.2, yA, yB); seg([cx + 0.75, gz1], [gx1 + 0.3, gz1], 0.2, yA, yB); seg([x0, z1], [x0, gz1], 0.2, yA, yB); seg([x1, z1], [x1, gz1], 0.2, yA, yB);
    colisiones.push({ x: mundo(x0 - 0.45, cz - 0.2).x, z: mundo(x0 - 0.45, cz - 0.2).z, r: 0.5, alturaMin: yA, alturaMax: yB + 1 });
    // ---- 4.30.0 (B): adentro (la casa se entra): piso de tablas, forro en las paredes, cielorraso, las ventanas por dentro y los muebles
    {
      const xi0 = x0 + 0.1, xi1 = x1 - 0.1, zi0 = z0 + 0.1, zi1 = z1 - 0.1, cara = 0.115;
      for (let i = 0, n = Math.round((xi1 - xi0) / 0.3); i < n; i++) {
        const w = (xi1 - xi0) / n;
        c.agregar(new THREE.BoxGeometry(w * 0.97, 0.06, zi1 - zi0), { color: i % 3 ? '#8a6b4a' : '#7a5e42', tipo: 0, variar: 0.1, matriz: matriz([xi0 + (i + 0.5) * w, F - 0.03, (zi0 + zi1) / 2]) });
      }
      const FORRO = '#a5875f';
      c.agregar(new THREE.BoxGeometry(x1 - x0 - 2 * cara, H, 0.03), { color: FORRO, tipo: 0, variar: 0.05, matriz: matriz([cx, F + H / 2, z0 + cara]) });
      for (const xx of [x0 + cara, x1 - cara]) c.agregar(new THREE.BoxGeometry(0.03, H, z1 - z0 - 2 * cara), { color: FORRO, tipo: 0, variar: 0.05, matriz: matriz([xx, F + H / 2, cz]) });
      for (const [xa, xb] of [[x0 + cara, cx - VANO_MEDIO], [cx + VANO_MEDIO, x1 - cara]]) c.agregar(new THREE.BoxGeometry(xb - xa, H, 0.03), { color: FORRO, tipo: 0, variar: 0.05, matriz: matriz([(xa + xb) / 2, F + H / 2, z1 - cara]) });
      c.agregar(new THREE.BoxGeometry(VANO_MEDIO * 2, H - VANO_ALTO, 0.03), { color: FORRO, tipo: 0, variar: 0.05, matriz: matriz([cx, F + (VANO_ALTO + H) / 2, z1 - cara]) });
      for (const l of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.1, VANO_ALTO, 0.24), { color: OSCURA, tipo: 0, matriz: matriz([cx + l * (VANO_MEDIO + 0.05), F + VANO_ALTO / 2, z1]) });   // las jambas, en el canto del vano
      c.agregar(new THREE.BoxGeometry(x1 - x0 - 0.2, 0.05, z1 - z0 - 0.2), { color: '#7d6246', tipo: 0, variar: 0.06, matriz: matriz([cx, F + H - 0.02, cz]) });   // el cielorraso
      for (let i = 1; i < 6; i++) c.agregar(new THREE.BoxGeometry(0.12, 0.1, z1 - z0 - 0.25), { color: OSCURA, tipo: 0, matriz: matriz([x0 + i * (x1 - x0) / 6, F + H - 0.09, cz]) });   // las vigas
      // las ventanas, por dentro (los vidrios y los alféizares, donde están las de afuera)
      for (const [x, z, ang, a] of [[cx - 2.6, z1 - cara - 0.02, 0, 0.9], [cx + 2.6, z1 - cara - 0.02, 0, 0.9], [x1 - cara - 0.02, cz, Math.PI / 2, 0.8], [x0 + cara + 0.02, cz + 0.6, Math.PI / 2, 0.8], [cx, z0 + cara + 0.02, 0, 0.8]]) {
        c.agregar(new THREE.BoxGeometry(a, a, 0.02), { color: '#2a2f33', tipo: 4, matriz: matriz([x, F + 1.48, z], [0, ang, 0]) });
        c.agregar(new THREE.BoxGeometry(a + 0.1, 0.05, 0.14), { color: OSCURA, tipo: 0, matriz: matriz([x, F + 1.48 - a / 2 - 0.02, z], [0, ang, 0]) });
        c.agregar(new THREE.BoxGeometry(0.05, a, 0.03), { color: OSCURA, tipo: 0, matriz: matriz([x, F + 1.48, z], [0, ang, 0]) });
      }
      const caja = (dx, dy, dz, x, y, z, color, tipo = 0) => c.agregar(new THREE.BoxGeometry(dx, dy, dz), { color, tipo, variar: 0.08, matriz: matriz([x, y, z]) });
      const yP = molino.y + F;
      const segL = (a, b, r, alto) => seg(a, b, r, yP - 0.1, yP + alto);
      // el hogar de piedra contra la pared del oeste, donde afuera sube la chimenea
      { const hx = x0 + cara + 0.32, hz = cz - 0.2;
        for (let y = 0; y < 1.1; y += 0.28) for (const oz of [-0.48, -0.16, 0.16, 0.48]) caja(0.62, 0.27, 0.31, hx, F + y + 0.14, hz + oz, PIEDRAS[Math.floor(azarFijo(y, oz, 7) * PIEDRAS.length)], 4);
        caja(0.3, 0.55, 0.7, hx + 0.2, F + 0.38, hz, '#241d18', 4);
        caja(0.8, 0.1, 1.45, hx + 0.08, F + 1.16, hz, OSCURA);
        for (let i = 0; i < 3; i++) c.agregar(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6), { color: '#6b5238', tipo: 0, matriz: matriz([hx + 0.22, F + 0.16 + i * 0.05, hz - 0.15 + i * 0.15], [0, 0, Math.PI / 2]) });
        segL([hx, hz - 0.6], [hx, hz + 0.6], 0.38, 1.25); }
      // la cama, en el rincón del fondo al este
      { const bx = x1 - cara - 1.05, bz = z0 + cara + 0.52;
        caja(2.0, 0.3, 0.95, bx, F + 0.25, bz, OSCURA); caja(1.9, 0.14, 0.88, bx, F + 0.47, bz, '#c9bca4', 4); caja(1.3, 0.07, 0.92, bx + 0.3, F + 0.56, bz, '#3f5a7a', 0);
        caja(0.36, 0.12, 0.6, bx - 0.72, F + 0.58, bz, '#e3d9c4', 4); caja(0.08, 0.95, 1.0, bx - 1.0, F + 0.47, bz, MADERA);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(0.08, 0.12, 0.08, bx + sx * 0.92, F + 0.06, bz + sz * 0.42, OSCURA);
        segL([bx - 0.85, bz], [bx + 0.85, bz], 0.5, 0.62); }
      // la mesa con sus dos bancos, al medio
      { const mx = cx + 0.4, mz = cz - 0.4;
        caja(1.5, 0.07, 0.85, mx, F + 0.76, mz, TABLA);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(0.07, 0.72, 0.07, mx + sx * 0.66, F + 0.36, mz + sz * 0.34, OSCURA);
        for (const sz of [-1, 1]) { caja(1.3, 0.05, 0.28, mx, F + 0.45, mz + sz * 0.68, TABLA_CLARA); for (const sx of [-1, 1]) caja(0.06, 0.43, 0.22, mx + sx * 0.55, F + 0.21, mz + sz * 0.68, OSCURA); segL([mx - 0.55, mz + sz * 0.68], [mx + 0.55, mz + sz * 0.68], 0.16, 0.47); }
        c.agregar(new THREE.CylinderGeometry(0.07, 0.09, 0.2, 8), { color: '#9a5a3e', tipo: 4, matriz: matriz([mx - 0.3, F + 0.9, mz]) });   // un jarro
        segL([mx - 0.62, mz], [mx + 0.62, mz], 0.42, 0.8); }
      // el estante con frascos contra la pared del fondo, del lado del hogar
      { const ex = cx - 1.9, ez = z0 + cara + 0.19;
        for (const sx of [-1, 1]) caja(0.05, 1.7, 0.34, ex + sx * 0.78, F + 0.85, ez, OSCURA);
        for (const y of [0.3, 0.8, 1.3, 1.68]) caja(1.6, 0.04, 0.34, ex, F + y, ez, TABLA);
        for (let i = 0; i < 9; i++) c.agregar(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 7), { color: ['#b88a4a', '#8a3a2a', '#c9a94a', '#5a7a4a'][i % 4], tipo: 4, matriz: matriz([ex - 0.6 + (i % 5) * 0.3, F + (i < 5 ? 0.4 : 0.9), ez]) });
        segL([ex - 0.8, ez], [ex + 0.8, ez], 0.2, 1.75); }
      // un arcón junto a la puerta y la alfombra de la entrada
      { const ax = x0 + cara + 0.75, az = z1 - cara - 0.35;
        caja(1.0, 0.5, 0.5, ax, F + 0.25, az, '#6b4e33'); caja(1.04, 0.06, 0.54, ax, F + 0.52, az, OSCURA);
        segL([ax - 0.4, az], [ax + 0.4, az], 0.28, 0.56); }
      caja(1.6, 0.02, 1.0, cx + 0.3, F + 0.01, cz + 1.3, '#8a2f2a', 4);
      // los pisos que se pisan: la casa y la galería (los escalones, arriba)
      const pc = mundo(cx, cz), pg = mundo((gx0 + gx1) / 2, (z1 + gz1) / 2);
      plataformas.push({ x: pc.x, z: pc.z, ang: -rot, largo: W, ancho: D, alto: molino.y + F, espesor: 0.1 });
      plataformas.push({ x: pg.x, z: pg.z, ang: -rot, largo: gx1 - gx0, ancho: G, alto: molino.y + gF, espesor: 0.12 });
      // la puerta de verdad (se abre hacia adentro: hacia afuera barría la galería)
      if (puertas?.agregar) puertas.agregar({ sitio: { x: molino.x, z: molino.z, y: molino.y, piso: F }, rot, lx: cx, lz: z1, ancho: VANO_MEDIO * 2 - 0.02, alto: VANO_ALTO - 0.02, lado: 1, adentro: true, nombre: 'la puerta de la casa del molino' });
    }
    return { F: molino.y + F, x0, x1, z0, z1, gz1, ancho: W, fondo: D, alto: H, cx, cz };
  })();

  const geo = c.geometria();
  const malla = new THREE.Mesh(geo, mat);
  malla.name = 'molino-paisaje-obras';
  malla.castShadow = true; malla.receiveShadow = true;
  grupo.add(malla);
  // la malla está en coordenadas del marco local del molino: se pone en su pose (los tulipanes y el agua ya van en mundo)
  malla.position.set(molino.x, molino.y, molino.z); malla.rotation.y = rot;
  for (const o of colisiones) col.agregar?.({ ...o, duenio: 'molino-paisaje' });
  for (const p of plataformas) col.agregarPlataforma?.({ ...p, duenio: 'molino-paisaje' });   // 4.30.0 (B)

  // ============================================================ el agua: dos cintas que siguen el terreno
  const cinta = (lista, mapaV) => {
    const pos = [], uv = [], idx = [];
    lista.forEach((it, i) => {
      for (const lado of [-1, 1]) {
        const p = mundo(it.x + it.nx * lado * it.ancho / 2, it.z + it.nz * lado * it.ancho / 2);
        pos.push(p.x, molino.y + it.y, p.z); uv.push(it.s / (mapaV || 2.2), lado < 0 ? 0 : 1);
      }
      if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, k) => (k % 3 === 1 ? 1 : 0)), 3));
    g.setIndex(idx);
    return g;
  };
  // normales y marco de la corriente en coordenadas locales: `mu` ya tiene (nx, nz) en el marco local
  const agua = mu.map((m, i) => ({ x: m.x, z: m.z, nx: m.nx, nz: m.nz, ancho: m.ancho * (i === mu.length - 1 ? 0.6 : 1), s: m.s, y: nivel[i] }));
  // la espuma va donde la corriente baja fuerte (la caída)
  const espuma = [];
  agua.forEach((a, i) => { const dy = i > 0 ? agua[i - 1].y - a.y : 0; a.pend = dy; });
  for (let i = 1; i < agua.length; i++) if (agua[i].pend > 0.09) espuma.push({ ...agua[i], y: agua[i].y + 0.03, ancho: agua[i].ancho * 1.12 });
  const matAgua = new THREE.MeshLambertMaterial({ map: LIENZO_OK() ? texturaAgua() : null, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const matEspuma = new THREE.MeshLambertMaterial({ map: LIENZO_OK() ? texturaEspuma() : null, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const mAgua = new THREE.Mesh(cinta(agua), matAgua); mAgua.name = 'arroyo-molino'; mAgua.renderOrder = 2; mAgua.frustumCulled = false;
  grupo.add(mAgua);
  let mEspuma = null;
  // la espuma son tramos sueltos: se arma cada trozo continuo como su propia cinta, todos en una sola malla
  if (espuma.length > 1) {
    const trozos = []; let act = [espuma[0]];
    for (let i = 1; i < espuma.length; i++) { if (espuma[i].s - espuma[i - 1].s < 1.0) act.push(espuma[i]); else { trozos.push(act); act = [espuma[i]]; } }
    trozos.push(act);
    const pos = [], uv = [], idx = [];
    for (const tr of trozos) {
      if (tr.length < 2) continue;
      const base = pos.length / 3;
      tr.forEach((it, i) => {
        for (const lado of [-1, 1]) { const p = mundo(it.x + it.nx * lado * it.ancho / 2, it.z + it.nz * lado * it.ancho / 2); pos.push(p.x, molino.y + it.y, p.z); uv.push(it.s / 1.6, lado < 0 ? 0 : 1); }
        if (i > 0) { const a = base + (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, k) => (k % 3 === 1 ? 1 : 0)), 3)); g.setIndex(idx);
    mEspuma = new THREE.Mesh(g, matEspuma); mEspuma.name = 'espuma-molino'; mEspuma.renderOrder = 3; mEspuma.frustumCulled = false;
    grupo.add(mEspuma);
  }

  // ============================================================ por cuadro
  let t = 0;
  function actualizar(dt, camX, camZ) {
    t += dt;
    if (matAgua.map) matAgua.map.offset.x = -(t * 0.35) % 1;
    if (matEspuma.map) matEspuma.map.offset.x = -(t * 0.9) % 1;
    if (camX != null) {
      const d = Math.hypot(camX - centroCampo.x, camZ - centroCampo.z);
      const ver = d < 170;
      for (const u of tul) u.malla.visible = ver && u.malla.count > 0;
    }
  }
  function liberar() {
    escena.remove(grupo);
    grupo.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    matAgua.map?.dispose(); matEspuma.map?.dispose(); matAgua.dispose(); matEspuma.dispose(); mat.dispose();
  }
  // las zonas a despejar de árboles, matas y pasto, en coordenadas del mundo
  const zonas = zonasDespeje().map((z) => ({ ...mundo(z.x, z.z), r: z.r, pasto: z.pasto }));
  // 4.0.3 (I-1): lo que no se puede fundar encima: la casa de la galería (de adorno, no se entra), el campo de tulipanes con su cerco y el cauce del arroyo.
  // `reservado(x, z, radio)` dice con qué choca una obra tuya de ese radio (o null). Marco local del molino; la casa, con su galería y el voladizo.
  const rectas = [
    { nombre: 'la casa del molino', x0: casa.x0 - 0.6, x1: casa.x1 + 0.6, z0: casa.z0 - 0.6, z1: casa.gz1 + 0.6 },
    { nombre: 'el campo de tulipanes', x0: -3.4 - 0.6, x1: 10.4 + 0.6, z0: 8.2 - 0.6, z1: 23.8 + 0.6 },
  ];
  const cauce = ARROYO.puntos;
  const distCauce = (lx, lz) => {
    let mejor = Infinity;
    for (let i = 1; i < cauce.length; i++) {
      const [ax, az] = cauce[i - 1], [bx, bz] = cauce[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((lx - ax) * dx + (lz - az) * dz) / l2));
      mejor = Math.min(mejor, Math.hypot(lx - (ax + dx * t), lz - (az + dz * t)));
    }
    return mejor;
  };
  const reservado = (x, z, radio = 1) => {
    const dx = x - molino.x, dz = z - molino.z, lx = dx * cr - dz * sr, lz = dx * sr + dz * cr;
    for (const r of rectas) if (lx > r.x0 - radio && lx < r.x1 + radio && lz > r.z0 - radio && lz < r.z1 + radio) return `Ahí están ${r.nombre}: buscá otro lugar`;
    if (distCauce(lx, lz) < ARROYO.ancho / 2 + 1.2 + radio) return 'Ahí corre el arroyo del molino: buscá otro lugar';
    return null;
  };
  return {
    grupo, actualizar, aplicarCalidad, liberar, zonas, casa, reservado,
    // 4.30.0 (B): el cuarto de la casa, para no dibujar el exterior desde adentro (la regla de los interiores del valle de la 4.26.0: interior-visible.js,
    // interiorDeCaja). Sólo la puerta deja ver para afuera: las ventanas son cajas opacas (como las casas prefabricadas). Marco de la caja: +b es el frente.
    interior: { id: 'casa-molino', ...mundo(casa.cx, casa.cz), y: casa.F, rot, ancho: casa.ancho, fondo: casa.fondo, alto: casa.alto + 0.2, frente: [[-0.6, casa.fondo / 2], [0, casa.fondo / 2], [0.6, casa.fondo / 2]] },
    huella: [[CASA.cx, CASA.cz + 1.2, 8], [(CAMPO.lx0 + CAMPO.lx1) / 2, (CAMPO.lz0 + CAMPO.lz1) / 2, 11], [8, 26.5, 15]].map(([lx, lz, radio]) => ({ ...mundo(lx, lz), radio, nombre: 'Molino (paisaje)' })),
    info: { tulipanes: siembra.total, instancias: () => tul.reduce((n, u) => n + u.malla.count, 0), triangulos: () => (geo.attributes.position.count / 3) | 0 },
    mallas: { obras: malla, agua: mAgua, espuma: mEspuma, tulipanes: tul.map((u) => u.malla) },
  };
}
