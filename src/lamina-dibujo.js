// 2.0: pinta la lámina del cuaderno (ver `lamina.js`) sobre un lienzo.
//
// Todo es por código, como el resto del juego: el papel, la tinta, la aguada de color
// y cada boceto. La tinta no es una línea perfecta —tiembla un poco, se corta, a veces
// pasa dos veces— y la aguada se sale del contorno, que es lo que hace que parezca
// hecho a mano y no un diagrama.
import { renglones } from './lamina.js';

export const ANCHO_LAMINA = 2400;
export const ALTO_LAMINA = 1600;
const TINTA = '#3d3024', TINTA_SUAVE = 'rgba(61,48,36,.55)', PAPEL = '#efe4c8';

// azar repetible por nombre: la misma especie sale con el mismo trazo
function semilla(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}

// ---------------------------------------------------------------- papel
function papel(x, r) {
  x.fillStyle = PAPEL; x.fillRect(0, 0, ANCHO_LAMINA, ALTO_LAMINA);
  // manchas de la fibra y del tiempo
  for (let i = 0; i < 1400; i++) {
    x.fillStyle = `rgba(${120 + r() * 60 | 0},${95 + r() * 40 | 0},${60 + r() * 30 | 0},${0.025 + r() * 0.04})`;
    x.beginPath(); x.arc(r() * ANCHO_LAMINA, r() * ALTO_LAMINA, 0.6 + r() * 2.2, 0, 6.3); x.fill();
  }
  for (let i = 0; i < 7; i++) {
    const cx = r() * ANCHO_LAMINA, cy = r() * ALTO_LAMINA, rr = 60 + r() * 160;
    const g = x.createRadialGradient(cx, cy, rr * 0.2, cx, cy, rr);
    g.addColorStop(0, 'rgba(170,130,70,0.05)'); g.addColorStop(0.85, 'rgba(160,120,60,0.07)'); g.addColorStop(1, 'rgba(160,120,60,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rr, 0, 6.3); x.fill();
  }
  // el borde oscurecido de una hoja que anduvo en la mochila
  const v = x.createRadialGradient(ANCHO_LAMINA / 2, ALTO_LAMINA / 2, ALTO_LAMINA * 0.45, ANCHO_LAMINA / 2, ALTO_LAMINA / 2, ANCHO_LAMINA * 0.62);
  v.addColorStop(0, 'rgba(90,60,30,0)'); v.addColorStop(1, 'rgba(90,60,30,0.22)');
  x.fillStyle = v; x.fillRect(0, 0, ANCHO_LAMINA, ALTO_LAMINA);
  // el doble filete de las láminas
  x.strokeStyle = TINTA_SUAVE; x.lineWidth = 3; x.strokeRect(46, 46, ANCHO_LAMINA - 92, ALTO_LAMINA - 92);
  x.lineWidth = 1.2; x.strokeRect(58, 58, ANCHO_LAMINA - 116, ALTO_LAMINA - 116);
}

// ---------------------------------------------------------------- tinta y aguada
// Un trazo a mano: la línea se parte en tramos que tiemblan apenas.
function trazo(x, r, puntos, ancho = 2.4) {
  x.strokeStyle = TINTA; x.lineWidth = ancho; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath();
  puntos.forEach(([px, py], i) => {
    const jx = (r() - 0.5) * 1.6, jy = (r() - 0.5) * 1.6;
    if (i === 0) x.moveTo(px + jx, py + jy); else x.lineTo(px + jx, py + jy);
  });
  x.stroke();
}
function curva(x, r, fn, n = 24, ancho = 2.4) {
  const p = []; for (let i = 0; i <= n; i++) p.push(fn(i / n)); trazo(x, r, p, ancho);
}
// La aguada: tres pasadas de color transparente, cada una corrida un poco.
function aguada(x, r, color, forma) {
  x.save();
  for (let i = 0; i < 3; i++) {
    x.globalAlpha = 0.22;
    x.fillStyle = color;
    x.translate((r() - 0.5) * 5, (r() - 0.5) * 5);
    x.beginPath(); forma(); x.fill();
  }
  x.restore();
}
const elipse = (x, cx, cy, rx, ry, rot = 0) => () => x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);

// ---------------------------------------------------------------- bocetos
// Cada uno en un cuadro de 200×160 centrado en (0,0).
const BOCETOS = {
  ave(x, r, e) {
    const color = { cachana: '#5f8a3c', martin: '#4f7fa0', picaflor: '#4f8a64', carpintero: '#8b2f2a', cisne: '#e8e2d4', condor: '#3a3632', patotorrente: '#6d6a64', chucao: '#8a5230', zorzal: '#7a5d3c', bandurria: '#9a8a70', cauquen: '#8a6a4a', concon: '#7a5a3a' }[e.id] || '#8a6a4a';
    aguada(x, r, color, elipse(x, -6, 6, 52, 30, -0.2));
    curva(x, r, (t) => [-58 + t * 100, 10 - Math.sin(t * Math.PI) * 38]);                // lomo
    curva(x, r, (t) => [-58 + t * 96, 12 + Math.sin(t * Math.PI) * 26]);                 // panza
    curva(x, r, (t) => [38 + Math.cos(t * 6.3) * 16, -24 + Math.sin(t * 6.3) * 15]);     // cabeza
    trazo(x, r, [[53, -26], [72, -22], [54, -18]]);                                      // pico
    x.fillStyle = TINTA; x.beginPath(); x.arc(42, -28, 2.6, 0, 6.3); x.fill();
    trazo(x, r, [[-58, 10], [-86, 0], [-84, 18], [-58, 14]]);                             // cola
    curva(x, r, (t) => [-30 + t * 50, -4 + Math.sin(t * Math.PI) * 10], 12, 1.6);        // ala
    trazo(x, r, [[-4, 36], [-8, 60]], 2); trazo(x, r, [[10, 36], [8, 60]], 2);            // patas
  },
  mamifero(x, r, e) {
    const color = { zorro: '#b86a34', guanaco: '#c09060', huemul: '#8a6a44', pudu: '#7a5230', ciervo: '#8a6038', jabali: '#4a3d33', liebre: '#9a8266', coipo: '#6a5038', perro: '#8a6a4a', murcielago: '#4a4038' }[e.id] || '#8a6a44';
    aguada(x, r, color, elipse(x, 0, 0, 62, 28));
    curva(x, r, (t) => [-60 + t * 110, -6 - Math.sin(t * Math.PI) * 24]);                // lomo
    curva(x, r, (t) => [-60 + t * 106, 8 + Math.sin(t * Math.PI) * 18]);                 // panza
    trazo(x, r, [[48, -18], [66, -44], [88, -36], [80, -24], [52, 2]]);                   // cuello y cabeza
    trazo(x, r, [[66, -44], [62, -60], [72, -48]], 1.8);                                  // oreja
    x.fillStyle = TINTA; x.beginPath(); x.arc(76, -38, 2.4, 0, 6.3); x.fill();
    for (const px of [-44, -28, 26, 42]) trazo(x, r, [[px, 16], [px + (r() - 0.5) * 6, 64]], 2.2);
    trazo(x, r, [[-60, -4], [-74, 10 + (e.id === 'zorro' ? 14 : 0)]], 2.4);               // cola
  },
  pez(x, r, e) {
    const color = { arcoiris: '#8a9aa0', marron: '#8a7048', fontinalis: '#6a7a5a', perca: '#8a8a6a', pejerrey: '#b8c0c4' }[e.id] || '#8a9aa0';
    aguada(x, r, color, elipse(x, -4, 0, 70, 22));
    if (e.id === 'arcoiris') aguada(x, r, '#c86a7a', elipse(x, -4, 2, 60, 6));
    curva(x, r, (t) => [-70 + t * 130, -Math.sin(t * Math.PI) * 26]);
    curva(x, r, (t) => [-70 + t * 130, Math.sin(t * Math.PI) * 20]);
    trazo(x, r, [[-70, 0], [-96, -22], [-90, 0], [-96, 22], [-70, 0]]);                   // cola
    trazo(x, r, [[-10, -24], [4, -38], [18, -24]], 1.8);                                  // dorsal
    curva(x, r, (t) => [36 + Math.sin(t * 3) * 3, -16 + t * 30], 8, 1.6);                // opérculo
    x.fillStyle = TINTA; x.beginPath(); x.arc(46, -5, 2.6, 0, 6.3); x.fill();
    for (let i = 0; i < 14; i++) { x.fillStyle = TINTA_SUAVE; x.beginPath(); x.arc(-50 + r() * 80, -14 + r() * 22, 1.3, 0, 6.3); x.fill(); }
  },
  arbol(x, r, e) {
    const otono = e.id === 'lenga' || e.id === 'nire';
    aguada(x, r, otono ? '#c0602c' : '#4f6e3a', elipse(x, 0, -30, 70, 46));
    aguada(x, r, otono ? '#d89a3a' : '#6a8a4a', elipse(x, -24, -40, 40, 28));
    trazo(x, r, [[-6, 70], [-4, -10], [-30, -40]], 3); trazo(x, r, [[-4, 0], [26, -34]], 2.6);
    trazo(x, r, [[6, 70], [4, -4]], 3);
    for (let i = 0; i < 9; i++) { const a = r() * 6.3, d = 30 + r() * 30; curva(x, r, (t) => [Math.cos(a) * d + Math.cos(t * 6.3) * 14, -30 + Math.sin(a) * d * 0.6 + Math.sin(t * 6.3) * 9], 10, 1.4); }
    trazo(x, r, [[-40, 70], [40, 70]], 1.4);
  },
  conifera(x, r, e) {
    aguada(x, r, e.id === 'pehuen' ? '#3f5a34' : '#2f4a2c', () => { x.moveTo(0, -76); x.lineTo(44, 50); x.lineTo(-44, 50); x.closePath(); });
    trazo(x, r, [[0, 70], [0, -76]], 3);
    for (let i = 0; i < 7; i++) {
      const y = -60 + i * 18, a = 10 + i * 5.5;
      trazo(x, r, [[0, y], [-a, y + 10]], 1.8); trazo(x, r, [[0, y], [a, y + 10]], 1.8);
    }
  },
  flor(x, r, e) {
    const color = { amancay: '#e8a030', notro: '#c8302a', chilco: '#b02850' }[e.id] || '#d88a30';
    trazo(x, r, [[0, 76], [-4, 10], [0, -20]], 2.2);
    trazo(x, r, [[-2, 40], [-30, 22], [-8, 30]], 1.8);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.3;
      aguada(x, r, color, elipse(x, Math.cos(a) * 22, -30 + Math.sin(a) * 22, 20, 9, a));
      curva(x, r, (t) => [Math.cos(a) * 22 + Math.cos(t * 6.3) * 20 * Math.cos(a) - Math.sin(t * 6.3) * 9 * Math.sin(a),
        -30 + Math.sin(a) * 22 + Math.cos(t * 6.3) * 20 * Math.sin(a) + Math.sin(t * 6.3) * 9 * Math.cos(a)], 14, 1.5);
    }
    x.fillStyle = '#6a4a20'; x.beginPath(); x.arc(0, -30, 6, 0, 6.3); x.fill();
  },
  fruto(x, r, e) {
    const color = { frutilla: '#c0342c', calafate: '#3b2b57', maqui: '#2a1f3a', pinon: '#8a5a30' }[e.id] || '#6a3a5a';
    trazo(x, r, [[-60, -50], [0, -20], [50, -56]], 2);
    aguada(x, r, '#5a7a3a', elipse(x, -34, -52, 24, 10, 0.5));
    for (const [cx, cy] of [[-14, 10], [16, 4], [2, 34], [30, 30]]) {
      aguada(x, r, color, elipse(x, cx, cy, 15, e.id === 'pinon' ? 24 : 15));
      curva(x, r, (t) => [cx + Math.cos(t * 6.3) * 15, cy + Math.sin(t * 6.3) * (e.id === 'pinon' ? 24 : 15)], 16, 1.6);
      trazo(x, r, [[cx, cy - 15], [0, -20]], 1.2);
    }
  },
  hongo(x, r) {
    aguada(x, r, '#e0a040', elipse(x, 0, -10, 46, 36));
    curva(x, r, (t) => [Math.cos(t * 6.3) * 46, -10 + Math.sin(t * 6.3) * 36], 28);
    for (let i = 0; i < 16; i++) { x.fillStyle = TINTA_SUAVE; x.beginPath(); x.arc((r() - 0.5) * 70, -10 + (r() - 0.5) * 54, 3, 0, 6.3); x.fill(); }
    trazo(x, r, [[-70, 50], [-20, 30], [30, 34], [70, 60]], 3);                            // la rama
  },
  hoja(x, r, e) {
    aguada(x, r, e.id === 'nalca' ? '#4a7a3a' : '#5a7a40', elipse(x, 0, -4, 38, 66, 0.3));
    curva(x, r, (t) => [Math.sin(t * Math.PI) * 38 * Math.cos(0.3) - 10, -70 + t * 136]);
    curva(x, r, (t) => [-Math.sin(t * Math.PI) * 30 - 10, -70 + t * 136]);
    trazo(x, r, [[-10, -70], [-6, 80]], 1.6);
    for (let i = 1; i < 7; i++) { const y = -60 + i * 18; trazo(x, r, [[-8, y], [16, y - 12]], 1.2); trazo(x, r, [[-8, y], [-30, y - 10]], 1.2); }
  },
  insecto(x, r, e) {
    const alas = e.id === 'mariposa';
    if (alas) {
      aguada(x, r, '#d8902a', elipse(x, -30, -16, 30, 22, -0.4)); aguada(x, r, '#d8902a', elipse(x, 30, -16, 30, 22, 0.4));
      curva(x, r, (t) => [-30 + Math.cos(t * 6.3) * 30, -16 + Math.sin(t * 6.3) * 22], 20, 1.8);
      curva(x, r, (t) => [30 + Math.cos(t * 6.3) * 30, -16 + Math.sin(t * 6.3) * 22], 20, 1.8);
    } else {
      aguada(x, r, '#e0c040', elipse(x, 0, 0, 26, 34));
      for (const y of [-10, 4, 18]) trazo(x, r, [[-24, y], [24, y]], 3);
      aguada(x, r, '#c8d8e0', elipse(x, -26, -30, 24, 12, -0.6)); aguada(x, r, '#c8d8e0', elipse(x, 26, -30, 24, 12, 0.6));
    }
    curva(x, r, (t) => [Math.cos(t * 6.3) * 10, Math.sin(t * 6.3) * 30], 16, 2);
    trazo(x, r, [[0, -30], [-12, -56]], 1.4); trazo(x, r, [[0, -30], [12, -56]], 1.4);
    for (const s of [-1, 1]) for (const y of [-6, 6, 18]) trazo(x, r, [[0, y], [s * 30, y + 10]], 1.2);
  },
  lagartija(x, r) {
    aguada(x, r, '#6a7a4a', elipse(x, 0, 0, 60, 12));
    curva(x, r, (t) => [-90 + t * 170, Math.sin(t * 7) * 8 - (t > 0.8 ? 0 : 0)], 30, 2.2);
    curva(x, r, (t) => [60 + Math.cos(t * 6.3) * 18, Math.sin(t * 6.3) * 10], 14, 2);
    for (const [px, s] of [[-10, 1], [30, 1], [-10, -1], [30, -1]]) trazo(x, r, [[px, 0], [px - 10, s * 26], [px - 18, s * 28]], 1.6);
  },
  pluma(x, r) {
    aguada(x, r, '#b8b0a0', elipse(x, 0, 0, 22, 74, 0.5));
    trazo(x, r, [[-40, 70], [40, -70]], 2);
    for (let i = 0; i < 14; i++) { const t = i / 14, px = -34 + t * 70, py = 60 - t * 124; trazo(x, r, [[px, py], [px - 20, py - 6]], 1.1); trazo(x, r, [[px, py], [px + 8, py + 18]], 1.1); }
  },
  piedra(x, r) {
    aguada(x, r, '#8a8478', elipse(x, 0, 10, 60, 40));
    curva(x, r, (t) => [Math.cos(t * 6.3) * (60 + Math.sin(t * 19) * 3), 10 + Math.sin(t * 6.3) * (40 + Math.cos(t * 13) * 3)], 36);
    curva(x, r, (t) => [-30 + t * 50, -4 + Math.sin(t * 3) * 6], 10, 1.2);
  },
  estrellas(x, r) {
    for (let i = 0; i < 6; i++) {
      const px = (r() - 0.5) * 150, py = (r() - 0.5) * 110, s = 4 + r() * 5;
      trazo(x, r, [[px - s, py], [px + s, py]], 1.6); trazo(x, r, [[px, py - s], [px, py + s]], 1.6);
      if (i) trazo(x, r, [[px, py], [px + (r() - 0.5) * 40, py + (r() - 0.5) * 40]], 0.8);
    }
  },
  luna(x, r) {
    aguada(x, r, '#e8dcb0', elipse(x, 0, 0, 58, 58));
    curva(x, r, (t) => [Math.cos(t * 6.3) * 58, Math.sin(t * 6.3) * 58], 40);
    for (let i = 0; i < 6; i++) { const cx = (r() - 0.5) * 70, cy = (r() - 0.5) * 70; curva(x, r, (t) => [cx + Math.cos(t * 6.3) * 8, cy + Math.sin(t * 6.3) * 7], 10, 1); }
  },
  fugaces(x, r) {
    for (let i = 0; i < 4; i++) {
      const px = -60 + i * 34 + r() * 10, py = -50 + i * 22;
      trazo(x, r, [[px, py], [px + 70, py + 30]], 1.8);
      x.fillStyle = TINTA; x.beginPath(); x.arc(px + 70, py + 30, 3.4, 0, 6.3); x.fill();
    }
  },
  cerro(x, r) {
    aguada(x, r, '#7a8a9a', () => { x.moveTo(-90, 60); x.lineTo(-20, -60); x.lineTo(20, -10); x.lineTo(50, -40); x.lineTo(90, 60); x.closePath(); });
    trazo(x, r, [[-90, 60], [-20, -60], [20, -10], [50, -40], [90, 60]]);
    aguada(x, r, '#f4f0e6', () => { x.moveTo(-34, -40); x.lineTo(-20, -60); x.lineTo(-6, -40); x.closePath(); });
  },
};

// ---------------------------------------------------------------- las partes de la hoja
function encabezado(x, datos) {
  const t = datos.t || ((s) => s);
  x.fillStyle = TINTA; x.textBaseline = 'alphabetic';
  x.font = '600 104px Caveat, cursive'; x.fillText(t(datos.titulo), 100, 186);
  x.font = 'italic 34px Spectral, Georgia, serif'; x.fillStyle = '#5a4630';
  x.fillText(t(datos.subtitulo), 104, 242);
  x.textAlign = 'right'; x.font = '600 50px Caveat, cursive'; x.fillStyle = TINTA;
  x.fillText(t(datos.cuenta), ANCHO_LAMINA - 100, 186);
  x.textAlign = 'left';
  x.strokeStyle = TINTA_SUAVE; x.lineWidth = 2;
  x.beginPath(); x.moveTo(100, 272); x.lineTo(ANCHO_LAMINA - 100, 272); x.stroke();
}

async function fotos(x, r, lista, cargar, t) {
  const X0 = 100, Y0 = 310, W = 420, H = 236;
  x.fillStyle = TINTA; x.font = '600 44px Caveat, cursive'; x.fillText(t('Del álbum'), X0, Y0 + 10);
  if (!lista.length) {
    x.font = 'italic 28px Spectral, Georgia, serif'; x.fillStyle = '#6b5838';
    for (const [i, l] of ['Todavía no hay fotos en el álbum.', 'Los desafíos de fotos se pegan acá.'].entries()) x.fillText(t(l), X0, Y0 + 70 + i * 40);
    x.save(); x.translate(X0 + 400, Y0 + 520); x.scale(2.2, 2.2); BOCETOS.hoja(x, r, { id: 'lenga' }); x.restore();
    return;
  }
  for (let i = 0; i < lista.length; i++) {
    const f = lista[i], col = i % 2, fila = Math.floor(i / 2);
    const cx = X0 + col * (W + 50) + W / 2 + 10, cy = Y0 + 60 + fila * (H + 96) + H / 2;
    x.save(); x.translate(cx, cy); x.rotate((r() - 0.5) * 0.08);
    // el marco de papel de foto, con su sombra
    x.fillStyle = 'rgba(40,28,16,.25)'; x.fillRect(-W / 2 - 12 + 6, -H / 2 - 12 + 8, W + 24, H + 76);
    x.fillStyle = '#f8f4ea'; x.fillRect(-W / 2 - 12, -H / 2 - 12, W + 24, H + 76);
    try {
      const img = await cargar(f.img);
      if (img) x.drawImage(img, -W / 2, -H / 2, W, H);
    } catch { /* una imagen rota no arruina la lámina */ }
    x.fillStyle = TINTA; x.font = '500 34px Caveat, cursive';
    x.fillText(renglones(t(f.nombre), W, (t) => x.measureText(t).width, 1)[0] || '', -W / 2, H / 2 + 44);
    // la cinta que la sostiene
    x.fillStyle = 'rgba(220,205,160,.7)'; x.rotate(-0.12); x.fillRect(-60, -H / 2 - 30, 120, 34);
    x.restore();
  }
}

function especimenes(x, lista, t) {
  const X0 = 1080, Y0 = 310, CW = 305, CH = 245, COLS = 4;
  x.fillStyle = TINTA; x.font = '600 44px Caveat, cursive'; x.fillText(t('Lo que anoté'), X0, Y0 + 10);
  if (!lista.length) {
    x.font = 'italic 28px Spectral, Georgia, serif'; x.fillStyle = '#6b5838';
    x.fillText(t('Todavía no anotaste plantas ni bichos. Acercate a algo y apretá E.'), X0, Y0 + 70);
    return;
  }
  lista.forEach((e, i) => {
    const col = i % COLS, fila = Math.floor(i / COLS);
    const cx = X0 + col * CW + CW / 2, cy = Y0 + 50 + fila * CH;
    const r = semilla(e.id);
    x.save(); x.translate(cx, cy + 92); x.scale(0.72, 0.72);
    (BOCETOS[e.boceto] || BOCETOS.hoja)(x, r, e);
    x.restore();
    x.textAlign = 'center'; x.fillStyle = TINTA;
    x.font = '600 36px Caveat, cursive';
    x.fillText(renglones(t(e.nombre), CW - 16, (t) => x.measureText(t).width, 1)[0], cx, cy + 178);
    if (e.cientifico) {
      x.font = 'italic 20px Spectral, Georgia, serif'; x.fillStyle = '#5a4630';
      x.fillText(renglones(e.cientifico, CW - 16, (t) => x.measureText(t).width, 1)[0], cx, cy + 204);
    }
    x.font = '22px Spectral, Georgia, serif'; x.fillStyle = '#7a6848';
    x.fillText(t(`día ${e.dia}`), cx, cy + 228);
    x.textAlign = 'left';
  });
}

function pie(x, r, datos) {
  const t = datos.t || ((s) => s);
  const Y = 1390;
  x.strokeStyle = TINTA_SUAVE; x.lineWidth = 2;
  x.beginPath(); x.moveTo(100, Y - 40); x.lineTo(ANCHO_LAMINA - 100, Y - 40); x.stroke();
  if (datos.pagina) {
    x.fillStyle = '#4a3a28'; x.font = '500 36px Caveat, cursive';
    const lineas = renglones(`${t(`Día ${datos.pagina.dia}`)}. ${t(datos.pagina.texto)}`, 1820, (t) => x.measureText(t).width, 3);
    lineas.forEach((l, i) => x.fillText(l, 100, Y + 10 + i * 44));
  }
  // el sello, en tinta roja y torcido, como todo sello
  x.save(); x.translate(ANCHO_LAMINA - 220, Y + 50); x.rotate(-0.16);
  x.strokeStyle = 'rgba(150,50,40,.72)'; x.fillStyle = 'rgba(150,50,40,.72)';
  x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 92, 0, 6.3); x.stroke();
  x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 80, 0, 6.3); x.stroke();
  x.textAlign = 'center'; x.font = '700 34px Caveat, cursive'; x.fillText('HOJARASCA', 0, -4);
  x.font = '600 16px Spectral, Georgia, serif'; x.fillText(t('CUADERNO DE CAMPO'), 0, 24);
  x.textAlign = 'left';
  x.restore();
}

// Pinta la lámina entera. `cargar(url)` devuelve una imagen lista para dibujar (el
// juego le pasa una que usa `Image`); si no hay, las fotos quedan sin imagen.
async function dibujarLamina(lienzo, datos, cargar = async () => null) {
  lienzo.width = ANCHO_LAMINA; lienzo.height = ALTO_LAMINA;
  const x = lienzo.getContext('2d');
  const r = semilla(datos.subtitulo || 'hojarasca');
  papel(x, r);
  encabezado(x, datos);
  const t = datos.t || ((s) => s);
  await fotos(x, r, datos.fotos || [], cargar, t);
  especimenes(x, datos.especimenes || [], t);
  pie(x, r, datos);
  return lienzo;
}

export function cargarImagen(url) {
  return new Promise((res) => {
    if (!url) { res(null); return; }
    const img = new Image();
    img.onload = () => res(img); img.onerror = () => res(null);
    img.src = url;
  });
}

export const TIPOS_DE_BOCETO = Object.keys(BOCETOS);
// (el empaquetador no entiende `export async`: se exporta aparte)
export { dibujarLamina };
