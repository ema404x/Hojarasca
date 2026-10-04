// Mapa en papel: relieve en tinta, curvas de nivel, agua, sendero y todos los lugares importantes
import { N, RES, MITAD, LAGO } from './config.js';
import { smoothstep } from './ruido.js';

export const GRILLA_EXPLORADA = 64;

// 3.0: los lugares del mapa de la semilla, a lápiz: la base (una casita), la cantera
// (piedras), los cristales (un rombo), la leña (troncos) y el alijo (un cajón).
const DIBUJOS_SEMILLA = {
  base(c, x, y, s) {
    c.fillStyle = '#b8432f'; c.strokeStyle = '#2a1a0e'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x - s, y + s * 0.8); c.lineTo(x - s, y - s * 0.2); c.lineTo(x, y - s * 1.1); c.lineTo(x + s, y - s * 0.2); c.lineTo(x + s, y + s * 0.8); c.closePath();
    c.fill(); c.stroke();
  },
  cantera(c, x, y, s) {
    c.fillStyle = '#7d766c'; c.strokeStyle = '#2a1a0e'; c.lineWidth = 1.1;
    for (const [dx, dy, r] of [[-0.5, 0.2, 0.55], [0.45, 0.25, 0.5], [0, -0.35, 0.5]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fill(); c.stroke(); }
  },
  cristal(c, x, y, s) {
    c.fillStyle = '#5fd6c8'; c.strokeStyle = '#1d4a44'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(x, y - s * 1.2); c.lineTo(x + s * 0.6, y); c.lineTo(x, y + s * 1.2); c.lineTo(x - s * 0.6, y); c.closePath(); c.fill(); c.stroke();
  },
  madera(c, x, y, s) {
    c.strokeStyle = '#5c3a1c'; c.lineWidth = s * 0.45; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - s, y + s * 0.4); c.lineTo(x + s, y - s * 0.1); c.moveTo(x - s * 0.8, y - s * 0.4); c.lineTo(x + s * 0.9, y + s * 0.5); c.stroke();
  },
  alijo(c, x, y, s) {
    c.fillStyle = '#a07a4c'; c.strokeStyle = '#2a1a0e'; c.lineWidth = 1.3;
    c.fillRect(x - s * 0.8, y - s * 0.6, s * 1.6, s * 1.2); c.strokeRect(x - s * 0.8, y - s * 0.6, s * 1.6, s * 1.2);
    c.beginPath(); c.moveTo(x - s * 0.8, y - s * 0.1); c.lineTo(x + s * 0.8, y - s * 0.1); c.stroke();
  },
};

export function crearMapa(T) {
  const TAM = 640;
  let base = null;
  function hornear() {
  base = document.createElement('canvas');
  base.width = base.height = TAM;
  const x = base.getContext('2d');
  const img = x.createImageData(TAM, TAM);
  const papel = [216, 199, 163];
  for (let py = 0; py < TAM; py++) {
    for (let px = 0; px < TAM; px++) {
      const wx = (px / TAM) * 1024 - MITAD, wz = (py / TAM) * 1024 - MITAD;
      const hx = T.altura(wx + 2, wz) - T.altura(wx - 2, wz), hz = T.altura(wx, wz + 2) - T.altura(wx, wz - 2);
      const luz = Math.max(-1, Math.min(1, (-hx * 0.7 - hz * 0.7) * 0.18));
      const k = T.indice(wx, wz);
      const agua = T.agua(wx, wz);
      const grano = (Math.sin(px * 12.9898 + py * 78.233) * 43758.5453) % 1;
      let r = papel[0], g = papel[1], b = papel[2];
      const bosque = T.bosque[k];
      r -= bosque * 38; g -= bosque * 24; b -= bosque * 40;
      r += luz * 26; g += luz * 24; b += luz * 20;
      if (agua) { const p = smoothstep(0, 4, agua.prof); r = 150 - p * 45; g = 170 - p * 35; b = 168 - p * 20; }
      const e = Math.max(Math.abs(wx), Math.abs(wz));
      const borde = smoothstep(460, 512, e);
      r = r * (1 - borde * 0.25); g = g * (1 - borde * 0.25); b = b * (1 - borde * 0.25);
      const j = (py * TAM + px) * 4;
      const ruido = grano * 8;
      img.data[j] = r - ruido; img.data[j + 1] = g - ruido; img.data[j + 2] = b - ruido; img.data[j + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);

  // curvas de nivel cada 8 m
  x.strokeStyle = 'rgba(70, 52, 32, 0.28)'; x.lineWidth = 1;
  const esc = TAM / RES;
  x.beginPath();
  for (let j = 0; j < RES; j += 1) for (let i = 0; i < RES; i += 1) {
    const a = T.alturas[j * N + i], b = T.alturas[j * N + i + 1], c = T.alturas[(j + 1) * N + i];
    for (const nivel of [8, 16, 24, 32, 40, 48, 56, 64, 80, 100]) {
      if ((a - nivel) * (b - nivel) < 0) { const t = (nivel - a) / (b - a); x.moveTo((i + t) * esc, j * esc); x.lineTo((i + t) * esc, j * esc + 1.2); }
      if ((a - nivel) * (c - nivel) < 0) { const t = (nivel - a) / (c - a); x.moveTo(i * esc, (j + t) * esc); x.lineTo(i * esc + 1.2, (j + t) * esc); }
    }
  }
  x.stroke();

  // arroyo y orilla
  const aMapa = (wx, wz) => [((wx + MITAD) / 1024) * TAM, ((wz + MITAD) / 1024) * TAM];
  x.strokeStyle = 'rgba(52, 78, 92, 0.75)'; x.lineCap = 'round';
  for (let i = 0; i < T.rio.length - 1; i++) {
    x.lineWidth = T.rio[i].w * 0.55;
    x.beginPath(); x.moveTo(...aMapa(T.rio[i].x, T.rio[i].z)); x.lineTo(...aMapa(T.rio[i + 1].x, T.rio[i + 1].z)); x.stroke();
  }
  x.lineWidth = 1.6; x.beginPath();
  for (let a = 0; a <= 360; a += 2) {
    const ang = (a * Math.PI) / 180;
    let rr = 60;
    while (rr < 220 && T.altura(LAGO.x + Math.cos(ang) * rr, LAGO.z + Math.sin(ang) * rr) < 0) rr += 1;
    const p = aMapa(LAGO.x + Math.cos(ang) * rr, LAGO.z + Math.sin(ang) * rr);
    if (a === 0) x.moveTo(...p); else x.lineTo(...p);
  }
  x.stroke();

  // la vía de la trochita, con sus travesaños
  x.strokeStyle = 'rgba(48, 40, 34, 0.85)'; x.lineWidth = 2;
  x.beginPath();
  T.riel.forEach((p, i) => { const q = aMapa(p.x, p.z); if (i === 0) x.moveTo(...q); else x.lineTo(...q); });
  x.stroke();
  x.lineWidth = 1.2;
  for (let i = 0; i < T.riel.length; i += 6) {
    const a2 = T.riel[i], b2 = T.riel[Math.min(T.riel.length - 1, i + 1)];
    const tx = b2.x - a2.x, tz = b2.z - a2.z, l = Math.hypot(tx, tz) || 1;
    const p1 = aMapa(a2.x - (tz / l) * 3, a2.z + (tx / l) * 3), p2 = aMapa(a2.x + (tz / l) * 3, a2.z - (tx / l) * 3);
    x.beginPath(); x.moveTo(...p1); x.lineTo(...p2); x.stroke();
  }

  // sendero punteado
  x.strokeStyle = 'rgba(92, 46, 22, 0.8)'; x.lineWidth = 2.2; x.setLineDash([7, 6]);
  x.beginPath();
  T.sendero.forEach((p, i) => { const q = aMapa(p.x, p.z); if (i === 0) x.moveTo(...q); else x.lineTo(...q); });
  x.closePath(); x.stroke(); x.setLineDash([]);

  // Árboles sugeridos con pequeños trazos en zonas de bosque.
  // Semilla fija: el papel del mapa no cambia de dibujo en cada arranque.
  let semillaMapa = 0x484f4a41;
  const azarMapa = () => {
    semillaMapa = (Math.imul(semillaMapa ^ (semillaMapa >>> 15), 2246822519) + 3266489917) | 0;
    semillaMapa ^= semillaMapa >>> 13;
    return (semillaMapa >>> 0) / 4294967296;
  };
  x.fillStyle = 'rgba(40, 52, 30, 0.35)';
  for (let i = 0; i < 5000; i++) {
    const px = azarMapa() * TAM, py = azarMapa() * TAM;
    const wx = (px / TAM) * 1024 - MITAD, wz = (py / TAM) * 1024 - MITAD;
    if (T.val(T.bosque, wx, wz) > 0.55 && !T.agua(wx, wz)) { x.beginPath(); x.arc(px, py, 1.6, 0, Math.PI * 2); x.fill(); }
  }

  }
  // De un clic en el papel a coordenadas del valle, y al revés.
  const aMundo = (px, py, W, H) => ({ x: (px / W) * 1024 - MITAD, z: (py / H) * 1024 - MITAD });

  function dibujar(destino, _explorado, jug, _lugaresVistos, lugares, marcas = [], chinches = [], activa = null, automaticas = []) {
    if (!base) hornear();
    const ctx = destino.getContext('2d');
    const W = destino.width, H = destino.height;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(base, 0, 0, W, H);

    const aP = (wx, wz) => [((wx + MITAD) / 1024) * W, ((wz + MITAD) / 1024) * H];
    ctx.font = `600 ${Math.round(W / 38)}px Caveat, cursive`;
    ctx.textAlign = 'center';
    // 3.6.1 (mundo): un nombre no se escribe encima de otro (el almacén y la casa de té, ahora en la aldea,
    // quedaban uno arriba del otro; pasaba también con otros vecinos): si no entra arriba del punto va
    // abajo, y si tampoco, queda el punto solo
    const ocupados = [];
    const rotular = (texto, px, py, arriba, alto) => {
      if (!texto) return;
      // (el mismo nombre ya escrito al lado, como la Estación del Valle y su parada: una vez)
      if (ocupados.some((o) => o[4] === texto && Math.abs((o[0] + o[1]) / 2 - px) < alto * 3 && Math.abs(o[3] - py) < alto * 3)) return;
      const a = ctx.measureText(texto).width / 2 + 2, m = arriba * 0.8;
      // arriba, abajo, a los costados (a la altura del punto o un poco más abajo) y más arriba; si no
      // entra en ninguno, arriba igual (un nombre perdido es peor que uno encimado)
      const lugaresTexto = [[px, py - arriba, 'center'], [px, py + arriba + alto * 0.7, 'center'], [px + m, py + alto * 0.28, 'left'], [px - m, py + alto * 0.28, 'right'],
        [px + m, py + alto * 1.0, 'left'], [px - m, py + alto * 1.0, 'right'], [px, py - arriba - alto * 0.9, 'center']];
      for (let i = 0; i <= lugaresTexto.length; i++) {
        const [x, y, alinear] = lugaresTexto[i % lugaresTexto.length];
        const x0 = alinear === 'center' ? x - a : alinear === 'left' ? x : x - 2 * a;
        const r = [x0, x0 + 2 * a, y - alto * 0.78, y + alto * 0.22, texto];
        if (i < lugaresTexto.length && ocupados.some((o) => r[0] < o[1] && r[1] > o[0] && r[2] < o[3] && r[3] > o[2])) continue;
        ocupados.push(r);
        ctx.textAlign = alinear;
        ctx.fillText(texto, x, y);
        ctx.textAlign = 'center';
        return;
      }
    };
    for (const [id, l] of Object.entries(lugares)) {
      const [px, py] = aP(l.x, l.z);
      ctx.fillStyle = 'rgba(92, 46, 22, 0.9)';
      ctx.beginPath(); ctx.arc(px, py, W / 170, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2614';
      rotular(l.nombre, px, py, W / 60, W / 38);
    }
    // tren, estaciones y apeaderos: el mapa los muestra desde el inicio
    for (const m of marcas) {
      if (m.tipo === 'parada') {
        const [px, py] = aP(m.x, m.z);
        ctx.fillStyle = '#5c3a1c';
        ctx.fillRect(px - W / 220, py - W / 220, W / 110, W / 110);
        ctx.fillStyle = '#3a2614';
        ctx.font = `600 ${Math.round(W / 50)}px Caveat, cursive`;
        rotular(m.nombre, px, py, W / 90, W / 50);
        continue;
      }
      const [mx, my] = aP(m.x, m.z);
      ctx.fillStyle = '#2f2620';
      ctx.beginPath(); ctx.arc(mx, my, W / 150, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2614';
      ctx.font = `600 ${Math.round(W / 46)}px Caveat, cursive`;
      ctx.fillText('el tren', mx, my - W / 80);
    }
    // lo que el juego marca solo: la caja del alba, la cápsula, los restos
    for (const a of automaticas) {
      const [px, py] = aP(a.x, a.z);
      // El cerco del nido no es un punto sino un redondel a lápiz: "anda por acá".
      if (a.clase === 'cerco' && a.radio > 0) {
        const [bx] = aP(a.x + a.radio, a.z);
        const rr = Math.abs(bx - px);
        ctx.save();
        ctx.strokeStyle = 'rgba(122, 48, 26, 0.75)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([W / 90, W / 130]);
        ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#7a301a';
        ctx.font = `600 ${Math.round(W / 50)}px Caveat, cursive`;
        // El primer cerco es enorme y su borde de arriba se va del papel: el rótulo
        // se queda adentro en vez de escribirse donde no se ve.
        ctx.fillText(a.nombre, px, Math.max(py - rr - W / 90, W / 24));
        continue;
      }
      // 3.0: el puesto invasor, una aguja en tinta verde oscura
      if (a.clase === 'puesto') {
        const s = W / 90;
        ctx.fillStyle = '#2f4a26'; ctx.strokeStyle = '#1a2414'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(px, py - s * 1.6); ctx.lineTo(px + s * 0.7, py + s * 0.6); ctx.lineTo(px - s * 0.7, py + s * 0.6); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2f4a26';
        ctx.font = `600 ${Math.round(W / 50)}px Caveat, cursive`;
        ctx.fillText(a.nombre, px, py - s * 2.1);
        continue;
      }
      // 3.0: el mapa de la semilla, cada lugar con su dibujito (ver desafio-mapa.js)
      if (Object.hasOwn(DIBUJOS_SEMILLA, a.clase)) {
        const s = W / 110;
        DIBUJOS_SEMILLA[a.clase](ctx, px, py, s);
        ctx.fillStyle = '#3a2614';
        ctx.font = `600 ${Math.round(W / 52)}px Caveat, cursive`;
        ctx.fillText(a.nombre, px, py - s * 2);
        continue;
      }
      const r = W / 130;
      ctx.strokeStyle = 'rgba(70, 48, 26, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px - r * 1.5, py); ctx.lineTo(px + r * 1.5, py);
      ctx.moveTo(px, py - r * 1.5); ctx.lineTo(px, py + r * 1.5); ctx.stroke();
      ctx.fillStyle = '#3a2614';
      ctx.font = `600 ${Math.round(W / 50)}px Caveat, cursive`;
      ctx.fillText(a.nombre, px, py - W / 75);
    }
    // chinches: las marcas que puso el jugador
    for (const c of chinches) {
      const [px, py] = aP(c.x, c.z);
      const r = W / 120;
      const elegida = c === activa;
      ctx.fillStyle = elegida ? '#c4402a' : '#8a4a2a';
      ctx.strokeStyle = '#2a1a0e';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(px, py - r, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px, py - r * 0.2); ctx.lineTo(px, py + r * 1.6); ctx.stroke();
      if (elegida) { ctx.beginPath(); ctx.arc(px, py - r, r * 2.1, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#3a2614';
      ctx.font = `600 ${Math.round(W / 46)}px Caveat, cursive`;
      ctx.fillText(c.nombre, px, py - r * 2.6);
    }
    // jugador
    const [jx, jy] = aP(jug.pos.x, jug.pos.z);
    ctx.save();
    ctx.translate(jx, jy);
    ctx.rotate(-jug.yaw);
    ctx.fillStyle = '#b8432f'; ctx.strokeStyle = '#2a1a0e'; ctx.lineWidth = 1.5;
    const s = W / 70;
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.6, s * 0.7); ctx.lineTo(0, s * 0.35); ctx.lineTo(-s * 0.6, s * 0.7); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    // rosa de los vientos
    ctx.fillStyle = '#3a2614';
    ctx.font = `600 ${Math.round(W / 30)}px Caveat, cursive`;
    ctx.fillText('N', W - W * 0.06, W * 0.07);
    ctx.strokeStyle = '#3a2614'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W - W * 0.06, W * 0.085); ctx.lineTo(W - W * 0.06, W * 0.15); ctx.stroke();
  }

  return { dibujar, aMundo };
}
