// 3.7.0: el atlas de la gente (estilo P), pintado por código: nada se descarga. Un lienzo de
// 2048 × 2048, una sola vez para todos. Pintarlo entero tarda unos 220 ms: en la carga se arma
// "en blanco" (gris neutro, sin guardas: los programas se compilan igual y nada se ve roto) y se
// pinta después, de a un paso, en la portada (`pintarAtlasDespues`, como el ripio de la aldea). Si
// el juego arranca antes de terminar, `completarAtlas` pinta lo que falte de una vez.
//   · fila de arriba, cuadros de 256: los detalles de las telas en gris (0,5 = sin cambio): 0 lana,
//     1 lienzo, 2 cuero, 3 punto, 4 fieltro, 5 hebras de pelo, 6 plata grabada, 7 paño de fiesta;
//   · guardas de 1024 × 128 que se repiten a lo largo (en color, con alfa = cubre): 1 ribete tejido,
//     2 escalonado de telar, 3 lukutuwe, 4 trarüwe (faja), 5 bordado de amancay, 6 bordado de lupino,
//     7 cuero repujado, 8 salpicado de pintura, 9 barro, 10 ribete del uniforme, 11 greca de telar,
//     12 bordado de rosa mosqueta (de y = 256 a 1024) y 13 estrellas bordadas, 14 brea, 15 rayas
//     marineras (de y = 1536 a 1792); las manchas (8, 9 y 14) son cuadros de 128 que se repiten;
//   · la cara (512 × 512, en canales: R rubor, G sombra de párpados, B pecas), las cejas con pelito
//     (512 × 128), los labios (512 × 256: las líneas en rojo, el brillo en verde), las arrugas (512 ×
//     512, con el mismo mapa de la cara: R las de la risa, G las de los mayores, B la cicatriz) y la
//     pincelada de la piel (256, en gris).
// Sin flipY: (u, v) = (x, y) del lienzo / 2048. Los datos van en lineal (los colores se pasan a
// lineal en el shader).
import * as THREE from 'three';

export const ATLAS = { lado: 2048, tela: 256, guardaAncho: 1024, guardaAlto: 128, guardaY: 256, guardaY2: 1536, cara: [0, 1024, 512, 512], ceja: [512, 1024, 512, 128], labios: [512, 1152, 512, 256], arrugas: [1024, 1024, 512, 512], pincelada: [1536, 1024, 256, 256] };
let TEX = null;
const pasos = [];
const info = { ms: 0, pasos: 0, listo: false };
export function atlasPersonajes() {
  if (TEX) return TEX;
  if (typeof document === 'undefined') {
    // (sin DOM, en las pruebas de Node: un gris)
    TEX = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
    TEX.needsUpdate = true; TEX.userData.info = info; info.listo = true;
    return TEX;
  }
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = ATLAS.lado;
  const ctx = lienzo.getContext('2d');
  // en blanco: gris neutro (las telas y la pincelada sin cambio), sin guardas, la cara sin rubor
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, ATLAS.lado, ATLAS.lado);
  ctx.clearRect(0, ATLAS.guardaY, ATLAS.lado, 768); ctx.clearRect(0, ATLAS.guardaY2, ATLAS.lado, 256);
  ctx.fillStyle = '#000000'; ctx.fillRect(...ATLAS.cara); ctx.fillRect(...ATLAS.arrugas);
  TEX = new THREE.CanvasTexture(lienzo);
  TEX.flipY = false;
  TEX.colorSpace = 'srgb-linear';   // (datos en lineal: los colores se pasan en el shader)
  TEX.generateMipmaps = true;
  TEX.minFilter = 1008;   // (LinearMipmapLinearFilter: el three del juego no exporta el nombre)
  TEX.anisotropy = 4;
  TEX.userData.info = info;
  TEX.userData.bytes = ATLAS.lado * ATLAS.lado * 4 * (4 / 3);   // con los mipmaps
  pasos.push(
    () => pintarTelas(ctx, 0, 4), () => pintarTelas(ctx, 4, 8),
    () => { for (let g = 1; g <= 7; g++) pintarGuarda(ctx, g); },
    () => { for (let g = 8; g <= 15; g++) pintarGuarda(ctx, g); },
    () => { pintarCara(ctx); pintarCeja(ctx); },
    () => pintarLabios(ctx),
    () => { pintarArrugas(ctx); pintarPincelada(ctx); },
  );
  return TEX;
}
// un paso (o todos, con `todo`); al terminar se sube la textura una sola vez
function pintar(todo) {
  while (pasos.length) {
    const t0 = performance.now();
    pasos.shift()();
    info.ms += performance.now() - t0; info.pasos++;
    if (!todo) break;
  }
  if (!pasos.length && TEX && !info.listo) { info.listo = true; TEX.needsUpdate = true; }
}
export function completarAtlas() { if (TEX) pintar(true); return info.listo; }
export function atlasListo() { return info.listo; }
// en la portada, cuando el navegador está libre, de a un paso
export function pintarAtlasDespues() {
  atlasPersonajes();
  if (!pasos.length) { pintar(true); return; }
  const ocio = typeof requestIdleCallback === 'function' ? (fn) => requestIdleCallback(fn, { timeout: 500 }) : (fn) => setTimeout(fn, 0);
  ocio(() => { pintar(false); if (pasos.length) pintarAtlasDespues(); else pintar(true); });
}

// ---------------------------------------------------------------- ayudas
function azar(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const TAU = Math.PI * 2;
// un cuadro de 256 en gris, que se repite sin costura (las ondas tienen períodos enteros)
function cuadroGris(ctx, k, fn) {
  const N = ATLAS.tela, img = ctx.createImageData(N, N), r = azar(97 + k * 31);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = Math.max(0, Math.min(1, fn(x, y, r)));
    const i = (y * N + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v * 255; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, k * N, 0);
}
// ruido periódico suave (suma de ondas de período entero)
function ondas(seed, n, amp, P = 256) {
  const r = azar(seed), lista = [];
  for (let i = 0; i < n; i++) lista.push([1 + Math.floor(r() * 4), 1 + Math.floor(r() * 4), r() * TAU, r() * TAU, amp * (0.5 + r())]);
  return (x, y) => lista.reduce((s, [a, b, p, q, m]) => s + m * Math.sin(TAU * a * x / P + p) * Math.sin(TAU * b * y / P + q), 0);
}
function pintarTelas(ctx, desde, hasta) {
  const o1 = ondas(1, 5, 0.03), o2 = ondas(2, 6, 0.05), o3 = ondas(3, 6, 0.04);
  const quiere = (k) => k >= desde && k < hasta;
  // 0 lana tejida: hilos gruesos (8 px), arriba y abajo, con mota
  if (quiere(0)) cuadroGris(ctx, 0, (x, y, r) => {
    const cel = (Math.floor(x / 8) + Math.floor(y / 8)) % 2, a = Math.sin(TAU * x / 8) ** 2, b = Math.sin(TAU * y / 8) ** 2;
    return 0.42 + 0.16 * (cel ? a : b) + o1(x, y) + (r() - 0.5) * 0.08;
  });
  // 1 lienzo: trama fina (4 px) y algún hilo más grueso a lo largo
  if (quiere(1)) {
    const filas = Array.from({ length: 256 }, (_, i) => azar(i + 7)() < 0.12 ? 0.07 : 0);
    cuadroGris(ctx, 1, (x, y, r) => {
      const cel = (Math.floor(x / 4) + Math.floor(y / 4)) % 2, a = Math.sin(TAU * x / 4) ** 2, b = Math.sin(TAU * y / 4) ** 2;
      return 0.46 + 0.09 * (cel ? a : b) + filas[y] + o2(x, y) * 0.5 + (r() - 0.5) * 0.05;
    });
  }
  // 2 cuero: grano, arrugas y raspones
  if (quiere(2)) cuadroGris(ctx, 2, (x, y, r) => 0.5 + o2(x, y) * 1.6 + 0.05 * Math.sin(TAU * (3 * x + 2 * y) / 256 + Math.sin(TAU * y / 64) * 2) + (r() - 0.5) * 0.12);
  // 3 punto: filas de "V" (16 × 12 px)
  if (quiere(3)) cuadroGris(ctx, 3, (x, y, r) => {
    const u = (x % 16) / 16, v = Math.abs(u - 0.5) * 2, f = Math.sin(TAU * (y / 12 + v * 0.55));
    return 0.38 + 0.2 * (f > -0.3 ? 1 : 0) * (1 - 0.6 * Math.max(0, v - 0.85) / 0.15) + o1(x, y) + (r() - 0.5) * 0.06;
  });
  // 4 fieltro: manchado suave y pelusa
  if (quiere(4)) cuadroGris(ctx, 4, (x, y, r) => 0.5 + o3(x, y) * 1.6 + (r() - 0.5) * 0.14);
  // 5 hebras de pelo: a lo largo (y), con ondas, mechones más claros y más oscuros
  if (quiere(5)) {
    const col = Array.from({ length: 256 }, (_, i) => azar(i * 3 + 11)());
    cuadroGris(ctx, 5, (x, y) => {
      const xx = (x + 3 * Math.sin(TAU * y / 256) + 2 * Math.sin(TAU * 3 * y / 256 + x * 0.05) + 256) % 256, i = Math.floor(xx);
      const v = col[i] * 0.6 + col[(i + 1) % 256] * 0.4;
      return 0.3 + 0.4 * v + 0.12 * Math.sin(TAU * 2 * x / 256);
    });
  }
  // 6 plata grabada: arcos y puntitos, con luz de metal
  if (quiere(6)) cuadroGris(ctx, 6, (x, y, r) => {
    const cx = x % 64 - 32, cy = y % 64 - 32, d = Math.hypot(cx, cy);
    const arco = Math.abs(d - 22) < 1.4 || Math.abs(d - 12) < 1.1 ? -0.25 : 0, punto = d < 3 ? -0.2 : 0;
    return 0.58 + arco + punto + o1(x, y) * 2 + (r() - 0.5) * 0.04;
  });
  // 7 paño de fiesta (lana fina, en sarga)
  if (quiere(7)) cuadroGris(ctx, 7, (x, y, r) => 0.47 + 0.08 * Math.sin(TAU * (x + y) / 6) + o2(x, y) * 0.6 + (r() - 0.5) * 0.05);
}

// las guardas: 1024 × 128, se repiten a lo largo (los motivos, de período que divide a 1024)
function origenGuarda(g) {
  if (g >= 13) return [((g - 13) % 2) * ATLAS.guardaAncho, ATLAS.guardaY2 + Math.floor((g - 13) / 2) * ATLAS.guardaAlto];
  return [((g - 1) % 2) * ATLAS.guardaAncho, ATLAS.guardaY + Math.floor((g - 1) / 2) * ATLAS.guardaAlto];
}
// una mancha en un cuadro de 128 que se repite: se dibuja también del otro lado de cada borde
function enCuadro(x, y, r, fn) {
  for (const dx of [-128, 0, 128]) for (const dy of [-128, 0, 128]) {
    if (x + dx + r < 0 || x + dx - r > 128 || y + dy + r < 0 || y + dy - r > 128) continue;
    fn(x + dx, y + dy);
  }
}
function pintarGuarda(ctx, g) {
  const [ox, oy] = origenGuarda(g), W = ATLAS.guardaAncho, H = ATLAS.guardaAlto, r = azar(g * 101);
  ctx.save(); ctx.translate(ox, oy);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  ctx.clearRect(0, 0, W, H);
  const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  // la pincelada: manchas tenues encima (pintado, no impreso)
  const pincel = (alfa) => { for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '255,240,210' : '40,20,10'},${alfa * r()})`; ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 6 + r() * 26, 2 + r() * 6, r() * 0.6 - 0.3, 0, TAU); ctx.fill(); } };
  const ROJO = '#9a2c24', NEGRO = '#221c1a', BLANCO = '#e8dcc2', OCRE = '#c89a48', VERDE = '#4e6a34';
  if (g === 1) {
    // ribete tejido: ocre con zigzag rojo y filetes oscuros
    rect(OCRE, 0, 0, W, H); rect(NEGRO, 0, 10, W, 8); rect(NEGRO, 0, H - 18, W, 8);
    ctx.strokeStyle = ROJO; ctx.lineWidth = 12; ctx.beginPath();
    for (let x = -32; x <= W + 32; x += 32) ctx.lineTo(x, (x / 32) % 2 ? 40 : 88);
    ctx.stroke(); pincel(0.06);
  } else if (g === 2) {
    // escalonado de telar: rombos de escalones negros con borde blanco, sobre rojo
    rect(ROJO, 0, 0, W, H); rect(BLANCO, 0, 6, W, 6); rect(BLANCO, 0, H - 12, W, 6);
    for (let c = 0; c < W; c += 128) for (const [col, k] of [[BLANCO, 0], [NEGRO, 8]]) {
      ctx.fillStyle = col;
      for (let s = 0; s < 6; s++) { const w = 104 - s * 16 - k * 2, h = 12; ctx.fillRect(c + 64 - w / 2, 64 - (s + 1) * h + k / 2, w, h); ctx.fillRect(c + 64 - w / 2, 64 + s * h - k / 2, w, h); }
    }
    for (let c = 0; c < W; c += 128) rect(ROJO, c + 56, 56, 16, 16);
    pincel(0.06);
  } else if (g === 3) {
    // lukutuwe: la figura escalonada, roja sobre crudo, entre filetes negros
    rect(BLANCO, 0, 0, W, H); rect(NEGRO, 0, 0, W, 10); rect(NEGRO, 0, H - 10, W, 10);
    for (let c = 0; c < W; c += 128) {
      const m = c + 64;
      rect(ROJO, m - 8, 22, 16, 84);
      rect(ROJO, m - 28, 30, 56, 12);
      rect(ROJO, m - 40, 18, 12, 24); rect(ROJO, m + 28, 18, 12, 24);
      rect(ROJO, m - 26, 92, 52, 12);
      rect(ROJO, m - 38, 92, 12, 24); rect(ROJO, m + 26, 92, 12, 24);
      rect(NEGRO, m - 4, 50, 8, 30);
      ctx.fillStyle = NEGRO; for (const dx of [-56, 56]) { ctx.beginPath(); ctx.moveTo(c + 64 + dx, 50); ctx.lineTo(c + 64 + dx + 10, 64); ctx.lineTo(c + 64 + dx, 78); ctx.lineTo(c + 64 + dx - 10, 64); ctx.fill(); }
    }
    pincel(0.05);
  } else if (g === 4) {
    // trarüwe: la faja; rojo, una cadena de rombos blancos y negros al medio, listas a los lados
    rect(ROJO, 0, 0, W, H);
    for (const [y, h, c] of [[4, 6, VERDE], [12, 4, OCRE], [18, 6, NEGRO], [H - 24, 6, NEGRO], [H - 16, 4, OCRE], [H - 10, 6, VERDE]]) rect(c, 0, y, W, h);
    for (let c = 0; c < W; c += 64) {
      ctx.fillStyle = BLANCO; ctx.beginPath(); ctx.moveTo(c, 64); ctx.lineTo(c + 32, 30); ctx.lineTo(c + 64, 64); ctx.lineTo(c + 32, 98); ctx.fill();
      ctx.fillStyle = NEGRO; ctx.beginPath(); ctx.moveTo(c + 10, 64); ctx.lineTo(c + 32, 41); ctx.lineTo(c + 54, 64); ctx.lineTo(c + 32, 87); ctx.fill();
      ctx.fillStyle = ROJO; ctx.fillRect(c + 26, 58, 12, 12);
      ctx.fillStyle = OCRE; ctx.fillRect(c - 3, 61, 6, 6);
    }
    pincel(0.07);
  } else if (g === 5) {
    // bordado de amancay: una enredadera verde con flores naranjas (seis pétalos, pintas rojas)
    ctx.strokeStyle = VERDE; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, 66 + 14 * Math.sin(TAU * x / 256)); ctx.stroke();
    for (let c = 0; c < W; c += 128) {
      for (const s of [-1, 1]) { ctx.fillStyle = '#5e7a3c'; ctx.beginPath(); ctx.ellipse(c + 64 + s * 30, 66 + 14 * Math.sin(TAU * (c + 64 + s * 30) / 256) + s * 10, 18, 7, s * 0.6, 0, TAU); ctx.fill(); }
      const fx = c + 64, fy = 64;
      for (let p = 0; p < 6; p++) {
        const a = p / 6 * TAU;
        ctx.fillStyle = p % 2 ? '#e8902c' : '#f0a838';
        ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 17, fy + Math.sin(a) * 17, 17, 8, a, 0, TAU); ctx.fill();
        ctx.fillStyle = '#b8401e'; for (let d = 0; d < 3; d++) { ctx.beginPath(); ctx.arc(fx + Math.cos(a) * (10 + d * 5), fy + Math.sin(a) * (10 + d * 5), 1.8, 0, TAU); ctx.fill(); }
      }
      ctx.fillStyle = '#f4d070'; ctx.beginPath(); ctx.arc(fx, fy, 7, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,230,180,0.5)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 18; i++) { const a = r() * TAU, d = 8 + r() * 22; ctx.beginPath(); ctx.moveTo(fx + Math.cos(a) * d, fy + Math.sin(a) * d); ctx.lineTo(fx + Math.cos(a) * (d - 6), fy + Math.sin(a) * (d - 6)); ctx.stroke(); }
    }
    ctx.fillStyle = '#c03a28'; ctx.fillRect(0, 4, W, 5); ctx.fillRect(0, H - 9, W, 5);
  } else if (g === 6) {
    // bordado de lupino: espigas violetas y lilas, con hojas de dedos
    ctx.fillStyle = '#c8a050'; ctx.fillRect(0, 2, W, 4); ctx.fillRect(0, H - 6, W, 4);
    for (let c = 0; c < W; c += 64) {
      const x0 = c + 32, alto = 70 + ((c / 64) % 3) * 10;
      ctx.strokeStyle = '#4e6a34'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, 120); ctx.lineTo(x0, 120 - alto); ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const y = 112 - alto + i * 8, k = i / 9;
        ctx.fillStyle = k < 0.3 ? '#d8b8e8' : k < 0.6 ? '#9c6cc8' : '#6a3e9c';
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x0 + s * (4 + k * 6), y, 5 + k * 2, 3.5, 0, 0, TAU); ctx.fill(); }
      }
      ctx.fillStyle = '#5e7a3c';
      for (let i = 0; i < 5; i++) { const a = Math.PI + 0.3 + i * 0.6; ctx.beginPath(); ctx.ellipse(x0 + Math.cos(a) * 12, 116 + Math.sin(a) * 5, 11, 3, a, 0, TAU); ctx.fill(); }
    }
  } else if (g === 7) {
    // cuero repujado: el borde con medialunas y puntos estampados (alfa: lo que oscurece)
    ctx.fillStyle = 'rgba(30,16,8,0.75)'; ctx.fillRect(0, 10, W, 4); ctx.fillRect(0, H - 14, W, 4);
    ctx.strokeStyle = 'rgba(30,16,8,0.7)'; ctx.lineWidth = 4;
    for (let c = 0; c < W; c += 64) { ctx.beginPath(); ctx.arc(c + 32, 64, 18, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); ctx.beginPath(); ctx.arc(c + 32, 40, 4, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(240,200,150,0.5)'; ctx.setLineDash([10, 8]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 24); ctx.lineTo(W, 24); ctx.moveTo(0, H - 24); ctx.lineTo(W, H - 24); ctx.stroke(); ctx.setLineDash([]);
  } else if (g === 8) {
    // salpicado de pintura (la pintora): gotas y chorreones de colores, en un cuadro de 128
    const cols = ['#3b5a8a', '#c89a38', '#a83a2a', '#5e7a3c', '#e8dcc2', '#6a3e7a'];
    for (let i = 0; i < 26; i++) {
      const x = r() * 128, y = r() * 128, rr = 1.5 + r() * 5, c = cols[Math.floor(r() * cols.length)], a = 0.75 + r() * 0.25;
      const gotas = [0, 1, 2].map(() => [r() * TAU, rr * (1.5 + r() * 2)]), chorro = r() < 0.3;
      enCuadro(x, y, rr * 4, (px, py) => {
        ctx.fillStyle = c; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fill();
        for (const [ang, d] of gotas) { ctx.beginPath(); ctx.arc(px + Math.cos(ang) * d, py + Math.sin(ang) * d, rr * 0.3, 0, TAU); ctx.fill(); }
        if (chorro) ctx.fillRect(px - rr * 0.3, py, rr * 0.6, rr * 3);
      });
    }
    ctx.globalAlpha = 1;
  } else if (g === 9 || g === 14) {
    // el barro (la ceramista, las botas de la veterinaria) y la brea (la botera): manchas irregulares
    const P = 128, img = ctx.createImageData(P, P), o1 = ondas(g * 7, 7, 0.5, P), o2 = ondas(g * 13, 9, 0.25, P);
    const [cr, cg, cb] = g === 9 ? [118, 98, 76] : [34, 28, 22];
    for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
      const n = o1(x * 2, y * 2) + o2(x * 4, y * 4) * 0.6;
      const a = Math.max(0, Math.min(1, (n - (g === 9 ? 0.3 : 0.42)) * 2.2));   // (manchas sueltas, no un estampado)
      const i = (y * P + x) * 4, k = 0.85 + 0.3 * (o2(x * 8, y * 8) + 0.5);
      img.data[i] = Math.min(255, cr * k); img.data[i + 1] = Math.min(255, cg * k); img.data[i + 2] = Math.min(255, cb * k); img.data[i + 3] = a * (g === 9 ? 225 : 240);
    }
    ctx.putImageData(img, ox, oy);
  } else if (g === 10) {
    // el ribete del uniforme (la guarda del tren, el jefe de estación, la enfermera): dos filetes
    rect('#c9a64a', 0, 28, W, 9); rect('#c9a64a', 0, H - 37, W, 9); rect('rgba(20,20,30,0.5)', 0, 37, W, 3); rect('rgba(20,20,30,0.5)', 0, H - 28, W, 3);
  } else if (g === 11) {
    // greca de telar: un meandro crudo sobre ocre, entre filetes negros
    rect(OCRE, 0, 0, W, H); rect(NEGRO, 0, 4, W, 8); rect(NEGRO, 0, H - 12, W, 8);
    ctx.strokeStyle = BLANCO; ctx.lineWidth = 10; ctx.lineJoin = 'miter';
    for (let c = 0; c < W; c += 64) { ctx.beginPath(); ctx.moveTo(c, 96); ctx.lineTo(c, 32); ctx.lineTo(c + 44, 32); ctx.lineTo(c + 44, 76); ctx.lineTo(c + 20, 76); ctx.lineTo(c + 20, 54); ctx.stroke(); }
    ctx.strokeStyle = NEGRO; ctx.lineWidth = 4;
    for (let c = 0; c < W; c += 64) { ctx.beginPath(); ctx.moveTo(c + 52, 96); ctx.lineTo(c + 64, 96); ctx.stroke(); }
    pincel(0.06);
  } else if (g === 12) {
    // bordado de rosa mosqueta: florcitas rosadas de cinco pétalos, hojitas y los frutos colorados
    ctx.fillStyle = '#9a3c2a'; ctx.fillRect(0, 4, W, 4); ctx.fillRect(0, H - 8, W, 4);
    ctx.strokeStyle = VERDE; ctx.lineWidth = 4; ctx.beginPath(); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, 70 + 10 * Math.sin(TAU * x / 128)); ctx.stroke();
    for (let c = 0; c < W; c += 128) {
      const fx = c + 40, fy = 58;
      for (let p = 0; p < 5; p++) { const a = p / 5 * TAU - 0.3; ctx.fillStyle = p % 2 ? '#e89aa8' : '#f0b4bc'; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 11, fy + Math.sin(a) * 11, 11, 9, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#f4d070'; ctx.beginPath(); ctx.arc(fx, fy, 5, 0, TAU); ctx.fill();
      for (const s of [0, 1]) { ctx.fillStyle = '#5e7a3c'; ctx.beginPath(); ctx.ellipse(c + 74 + s * 18, 76 - s * 10, 9, 4, 0.5 - s, 0, TAU); ctx.fill(); }
      for (let k = 0; k < 3; k++) { ctx.fillStyle = '#c0301e'; ctx.beginPath(); ctx.ellipse(c + 98 + k * 9, 86 + (k % 2) * 6, 4, 6, 0.2, 0, TAU); ctx.fill(); }
    }
  } else if (g === 13) {
    // estrellas bordadas (la astrónoma): estrellitas de cinco puntas, claras, desparramadas
    for (let i = 0; i < 110; i++) {
      const x = r() * W, y = 10 + r() * (H - 20), R0 = 2 + r() * 3.2;
      ctx.fillStyle = r() < 0.7 ? '#e8dcc2' : '#e0b850';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? R0 * 0.42 : R0; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      ctx.fill();
    }
    ctx.fillStyle = '#b8963e'; ctx.fillRect(0, 2, W, 3); ctx.fillRect(0, H - 5, W, 3);
  } else if (g === 15) {
    // rayas marineras: dieciséis rayas, una sí y una no, azules
    for (let k = 1; k < 16; k += 2) rect('#2c3446', 0, k * 8, W, 8);
  }
  ctx.restore();
}

// la cara (en el espacio de la cabeza: x de −0,085 a 0,085, y de −0,115 a 0,085; arriba en el lienzo = y alto)
const CX = (x, o = ATLAS.cara) => o[0] + (x + 0.085) / 0.17 * o[2];
const CY = (y, o = ATLAS.cara) => o[1] + (0.085 - y) / 0.2 * o[3];
const CS = ATLAS.cara[2] / 0.17;
function manchaCara(ctx, canal, x, y, rx, ry, a) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  const c = canal === 0 ? '255,0,0' : canal === 1 ? '0,255,0' : '0,0,255';
  g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
  ctx.save(); ctx.translate(CX(x), CY(y)); ctx.scale(rx * CS, ry * CS); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
}
function pintarCara(ctx) {
  const [x0, y0, w, h] = ATLAS.cara;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  ctx.fillStyle = '#000000'; ctx.fillRect(x0, y0, w, h);
  ctx.globalCompositeOperation = 'lighter';
  for (const s of [-1, 1]) {
    manchaCara(ctx, 0, s * 0.041, -0.022, 0.024, 0.018, 0.9);      // el rubor, en la manzana del cachete
    manchaCara(ctx, 0, s * 0.05, -0.012, 0.016, 0.014, 0.35);      // y hacia la sien
    manchaCara(ctx, 1, s * 0.034, 0.007, 0.019, 0.009, 0.85);      // la sombra del párpado
    manchaCara(ctx, 1, s * 0.047, 0.004, 0.012, 0.008, 0.5);       // hacia el rabillo
    manchaCara(ctx, 1, s * 0.046, -0.035, 0.012, 0.012, 0.25);     // bajo el pómulo
  }
  manchaCara(ctx, 0, 0, -0.034, 0.009, 0.008, 0.45);               // la punta de la nariz
  manchaCara(ctx, 0, 0, -0.098, 0.016, 0.01, 0.25);                // el mentón
  // las pecas: puntos chicos en la nariz y los cachetes
  const r = azar(4242);
  for (let i = 0; i < 260; i++) {
    const x = (r() - 0.5) * 0.11, y = -0.012 - r() * 0.026;
    const zona = Math.exp(-(((Math.abs(x) - 0.024) / 0.026) ** 2) - (((y + 0.02) / 0.013) ** 2)) + Math.exp(-((x / 0.01) ** 2) - (((y + 0.017) / 0.012) ** 2));
    if (r() > zona) continue;
    ctx.fillStyle = `rgba(0,0,255,${0.5 + r() * 0.5})`; ctx.beginPath(); ctx.arc(CX(x), CY(y), 0.0008 * CS * (0.7 + r() * 0.8), 0, TAU); ctx.fill();
  }
  ctx.restore();
}
// 3.7.0: las arrugas, finas y suaves, con el mismo mapa de la cara: R las de la risa (patas de gallo,
// el surco de la nariz a la boca), G las de los mayores (la frente, el entrecejo, las bolsas bajo los
// ojos, el surco más hondo, las de la comisura), B la cicatriz de la andinista (cruza la ceja)
function pintarArrugas(ctx) {
  const o = ATLAS.arrugas, [x0, y0, w, h] = o;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  ctx.fillStyle = '#000000'; ctx.fillRect(x0, y0, w, h);
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  const linea = (canal, pts, ancho, a) => {
    ctx.strokeStyle = `rgba(${canal === 0 ? '255,0,0' : canal === 1 ? '0,255,0' : '0,0,255'},${a})`; ctx.lineWidth = ancho * CS;
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(CX(x, o), CY(y, o)) : ctx.moveTo(CX(x, o), CY(y, o)))); ctx.stroke();
  };
  ctx.filter = 'blur(2px)';
  for (const s of [-1, 1]) {
    // las patas de gallo
    for (const [dy, a] of [[0.006, 0.5], [0, 0.6], [-0.006, 0.5]]) linea(0, [[s * 0.05, 0.001], [s * 0.058, 0.001 + dy * 1.4]], 0.0014, a);
    // el surco de la nariz a la boca, y bajo el ojo
    linea(0, [[s * 0.017, -0.039], [s * 0.022, -0.05], [s * 0.026, -0.06], [s * 0.027, -0.066]], 0.0018, 0.55);
    linea(0, [[s * 0.022, -0.013], [s * 0.034, -0.016], [s * 0.046, -0.012]], 0.0012, 0.3);
    // los mayores
    linea(1, [[s * 0.016, -0.038], [s * 0.023, -0.052], [s * 0.028, -0.066], [s * 0.03, -0.075]], 0.0024, 0.6);
    linea(1, [[s * 0.024, -0.066], [s * 0.026, -0.078], [s * 0.029, -0.088]], 0.0016, 0.45);       // la comisura hacia abajo
    linea(1, [[s * 0.02, -0.016], [s * 0.034, -0.021], [s * 0.048, -0.016]], 0.0016, 0.5);         // la bolsa bajo el ojo
    linea(1, [[s * 0.006, 0.019], [s * 0.005, 0.031]], 0.0012, 0.45);                              // el entrecejo
    for (const [dy, a] of [[0.008, 0.5], [0, 0.55], [-0.008, 0.45], [0.013, 0.35]]) linea(1, [[s * 0.051, 0.0], [s * 0.061, dy * 1.6]], 0.0013, a);
  }
  for (const [y, a] of [[0.046, 0.5], [0.056, 0.45], [0.066, 0.35]]) {
    const pts = []; for (let x = -0.036; x <= 0.0361; x += 0.006) pts.push([x, y + 0.0015 * Math.sin(x * 160 + y * 90) - 0.004 * (x / 0.036) ** 2]);
    linea(1, pts, 0.0013, a);
  }
  // la cicatriz: una raya clara que cruza la ceja izquierda (la de ella) y baja hacia el pómulo
  ctx.filter = 'blur(1px)';
  linea(2, [[0.047, 0.042], [0.042, 0.029], [0.038, 0.017], [0.035, 0.009]], 0.0032, 1);
  linea(2, [[0.05, -0.022], [0.056, -0.03]], 0.0013, 0.6);
  ctx.filter = 'none';
  ctx.restore();
}
// 3.7.0: la pincelada de la piel: trazos cortos, más claros y más oscuros, en diagonal (se repite)
function pintarPincelada(ctx) {
  const [x0, y0, w, h] = ATLAS.pincelada, r = azar(909);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip(); ctx.translate(x0, y0);
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h);
  ctx.lineCap = 'round';
  for (let i = 0; i < 520; i++) {
    const x = r() * w, y = r() * h, L = 10 + r() * 26, a = 0.55 + (r() - 0.5) * 0.6, v = Math.round(255 * (0.32 + r() * 0.36));
    ctx.strokeStyle = `rgba(${v},${v},${v},${0.18 + r() * 0.22})`; ctx.lineWidth = 3 + r() * 6;
    for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
      const px = x + dx, py = y + dy;
      if (px + L < -10 || px - L > w + 10 || py + L < -10 || py - L > h + 10) continue;
      ctx.beginPath(); ctx.moveTo(px - Math.cos(a) * L / 2, py - Math.sin(a) * L / 2); ctx.lineTo(px + Math.cos(a) * L / 2, py + Math.sin(a) * L / 2); ctx.stroke();
    }
  }
  ctx.restore();
}
// las cejas: pelitos en diagonal sobre claro (u: de adentro hacia la cola; v: de abajo hacia arriba)
function pintarCeja(ctx) {
  const [x0, y0, w, h] = ATLAS.ceja, r = azar(77);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  ctx.fillStyle = '#b0b0b0'; ctx.fillRect(x0, y0, w, h);
  ctx.lineCap = 'round';
  for (let i = 0; i < 700; i++) {
    const u = r(), v = r(), adentro = u < 0.2;
    const x = x0 + u * w, y = y0 + h - v * h, L = 18 + r() * 22;
    const a = adentro ? -1.25 + r() * 0.3 : -0.45 - r() * 0.25;   // adentro, para arriba; después, hacia la cola
    ctx.strokeStyle = `rgba(${20 + r() * 40},${15 + r() * 25},${10 + r() * 20},${0.55 + r() * 0.4})`;
    ctx.lineWidth = 2 + r() * 2.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
  }
  ctx.restore();
}
// los labios: la mitad de arriba es el labio de arriba (v crece hacia el borde), la de abajo el de
// abajo; rayitas verticales y el brillo (en el verde) en el centro del de abajo
function pintarLabios(ctx) {
  const [x0, y0, w, h] = ATLAS.labios, r = azar(55);
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = (y * w + x) * 4;
    const raya = 0.12 * Math.max(0, Math.sin(u * 180 + Math.sin(v * 9) * 2)) ** 8;
    const linea = Math.exp(-(((v - 0.5) / 0.03) ** 2)) * 0.25;            // la línea de la boca, más oscura
    const g = 0.52 - raya - linea + (r() - 0.5) * 0.03;
    const br = Math.exp(-(((u - 0.5) / 0.16) ** 2) - (((v - 0.72) / 0.07) ** 2)) + 0.5 * Math.exp(-(((u - 0.38) / 0.06) ** 2) - (((v - 0.28) / 0.04) ** 2));
    // (todo opaco: con alfa el lienzo premultiplica y se pierde el gris; el brillo va en el verde)
    img.data[i] = img.data[i + 2] = Math.max(0, Math.min(1, g)) * 255;
    img.data[i + 1] = Math.min(1, br) * 255; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, x0, y0);
}
