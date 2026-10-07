// 3.7.4: los íconos de la vida social, dibujados por código en un solo atlas (un lienzo de 8 × 8 celdas de 64 px): los
// de la rueda de interacciones (el DOM los usa de fondo, con la posición de su celda) y los de arriba de las cabezas (la
// burbuja, el ícono del tema y la emoción: social-mundo.js usa el mismo lienzo como textura). Nada se descarga.
// Estilo del juego: tinta marrón con trazo redondo, como los dibujos del cuaderno, y pocos colores de tierra.
// El orden de NOMBRES_ICONOS es la celda: no cambiarlo sin cambiar las dos cosas a la vez (lo arman juntas).

export const NOMBRES_ICONOS = [
  'burbuja', 'globo', 'charla', 'sonrisa', 'risa', 'enojo', 'cansado', 'triste',
  'corazon', 'abrazo', 'cinco', 'mano', 'beso', 'nota', 'cartas', 'foto',
  'mate', 'pez', 'tren', 'lluvia', 'sol', 'nieve', 'nube', 'rayo',
  'lengua', 'queja', 'ignorar', 'perdon', 'flor', 'susurro', 'estrella', 'pregunta',
  'huellas', 'guino', 'consolar', 'libro', 'regalo', 'herramienta', 'olla', 'vaca',
  'casa', 'chau', 'volver', 'oveja', 'arbol', 'luna', 'radio', 'taza',
  'anillo', 'diario', 'golpe', 'exclamacion', 'canasta', 'montana', 'carta', 'hoja',
  'enamorado', 'contento', 'enojado', 'timido', 'vecinos', 'puerta', 'bebe', 'semilla',
  // 3.7.4 (con las reglas de vecindad-social.js): sus íconos (ICONOS) y sus emociones (EMOCIONES), con estos nombres
  'saludo', 'aplauso', 'consuelo', 'chiste', 'broma', 'morisqueta', 'nada', 'baile', 'pesca', 'pasos',
  'pelota', 'musica', 'oficio', 'granja', 'frutilla', 'miel', 'pan', 'lana', 'madera', 'piedra',
  'pluma', 'baya', 'pinon', 'hongo', 'huevo', 'huerta', 'tranquilo', 'sorpresa', 'verguenza', 'confundido',
];
export const LADO_ATLAS = 10, CELDA = 64;   // (10 × 10 celdas: 640 px)
const INDICE = new Map(NOMBRES_ICONOS.map((n, i) => [n, i]));
// la celda de un ícono (los que no están: la pregunta)
export function celdaIcono(nombre) {
  const i = INDICE.has(nombre) ? INDICE.get(nombre) : INDICE.get('pregunta');
  return { i, col: i % LADO_ATLAS, fila: Math.floor(i / LADO_ATLAS) };
}
export const hayIcono = (nombre) => INDICE.has(nombre);
// para el CSS: la posición de fondo con el atlas a background-size 1000% 1000%
export function posicionCss(nombre) {
  const { col, fila } = celdaIcono(nombre);
  return `${((col / (LADO_ATLAS - 1)) * 100).toFixed(3)}% ${((fila / (LADO_ATLAS - 1)) * 100).toFixed(3)}%`;
}

// ---------------------------------------------------------------- el dibujo
const TINTA = '#4a3520', PAPEL = '#efe4c8', BORDE = '#6b5030';
const C = { rojo: '#b0473a', rosa: '#d07a6a', ocre: '#c9912e', verde: '#5f7a3a', azul: '#4f6f86', celeste: '#8fb0c4', gris: '#8a8378', marron: '#7a5434', crema: '#f4ead2', piel: '#d9a77a' };

function trazo(c, w = 3.4, col = TINTA) { c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; }
function circulo(c, x, y, r, relleno = null, borde = TINTA, w = 3.2) {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
  if (relleno) { c.fillStyle = relleno; c.fill(); }
  if (borde) { trazo(c, w, borde); c.stroke(); }
}
function linea(c, pts, w = 3.4, col = TINTA) {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  trazo(c, w, col); c.stroke();
}
function corazon(c, x, y, s, relleno = C.rojo, borde = TINTA) {
  c.beginPath();
  c.moveTo(x, y + s * 0.9);
  c.bezierCurveTo(x - s * 1.3, y + s * 0.05, x - s * 0.95, y - s * 0.95, x, y - s * 0.35);
  c.bezierCurveTo(x + s * 0.95, y - s * 0.95, x + s * 1.3, y + s * 0.05, x, y + s * 0.9);
  c.closePath();
  if (relleno) { c.fillStyle = relleno; c.fill(); }
  if (borde) { trazo(c, 3, borde); c.stroke(); }
}
function cara(c, x, y, r, relleno = C.ocre) { circulo(c, x, y, r, relleno); }
function ojos(c, x, y, sep = 7, r = 2.6) { c.fillStyle = TINTA; for (const s of [-1, 1]) { c.beginPath(); c.arc(x + s * sep, y, r, 0, Math.PI * 2); c.fill(); } }
function arco(c, x, y, r, a0, a1, w = 3.2) { c.beginPath(); c.arc(x, y, r, a0, a1); trazo(c, w); c.stroke(); }
function mano(c, x, y, s = 1, relleno = C.piel, espejo = false) {
  // la palma abierta con cuatro dedos y el pulgar
  c.save(); c.translate(x, y); c.scale(espejo ? -s : s, s);
  c.beginPath();
  c.moveTo(-10, 14); c.lineTo(-11, -2);
  for (let i = 0; i < 4; i++) { const dx = -9 + i * 6; c.lineTo(dx, -14 - (i === 1 || i === 2 ? 4 : 0)); c.arc(dx + 2.6, -14 - (i === 1 || i === 2 ? 4 : 0), 2.6, Math.PI, 0); c.lineTo(dx + 5.2, -3); }
  c.lineTo(14, -6); c.arc(15, -3, 2.8, -Math.PI / 2, Math.PI / 2); c.lineTo(10, 8); c.lineTo(8, 14); c.closePath();
  c.fillStyle = relleno; c.fill(); trazo(c, 2.6); c.stroke();
  c.restore();
}
function rect(c, x, y, w, h, relleno, r = 4, borde = TINTA, lw = 3) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  if (relleno) { c.fillStyle = relleno; c.fill(); }
  if (borde) { trazo(c, lw, borde); c.stroke(); }
}
function texto(c, t, x, y, tam = 34, col = TINTA) { c.fillStyle = col; c.font = `700 ${tam}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, x, y); }
function nube(c, x, y, s, relleno = C.crema) {
  c.beginPath();
  c.arc(x - 10 * s, y + 2 * s, 8 * s, Math.PI * 0.5, Math.PI * 1.5);
  c.arc(x - 2 * s, y - 6 * s, 10 * s, Math.PI, Math.PI * 1.85);
  c.arc(x + 10 * s, y - 1 * s, 8 * s, Math.PI * 1.3, Math.PI * 0.5);
  c.closePath();
  c.fillStyle = relleno; c.fill(); trazo(c, 3); c.stroke();
}

// Cada uno dibuja en una celda de 64 × 64 con el origen en el centro.
const DIBUJOS = {
  burbuja(c) {
    // el globo de diálogo, crema con borde, y la colita abajo (en el atlas ocupa la celda entera)
    c.beginPath();
    c.moveTo(-22, -24); c.lineTo(22, -24); c.quadraticCurveTo(29, -24, 29, -17); c.lineTo(29, 12); c.quadraticCurveTo(29, 19, 22, 19);
    c.lineTo(6, 19); c.lineTo(-4, 29); c.lineTo(-5, 19); c.lineTo(-22, 19); c.quadraticCurveTo(-29, 19, -29, 12); c.lineTo(-29, -17); c.quadraticCurveTo(-29, -24, -22, -24); c.closePath();
    c.fillStyle = PAPEL; c.fill(); trazo(c, 3, BORDE); c.stroke();
  },
  globo(c) { circulo(c, 0, 0, 24, PAPEL, BORDE, 3); },
  charla(c) {
    rect(c, -24, -20, 30, 22, C.crema, 6); linea(c, [-14, 2, -18, 10, -8, 2], 3);
    rect(c, -4, -6, 28, 20, C.celeste, 6); linea(c, [14, 14, 18, 22, 8, 14], 3);
  },
  sonrisa(c) { cara(c, 0, 0, 22); ojos(c, 0, -5); arco(c, 0, 0, 12, 0.2 * Math.PI, 0.8 * Math.PI); },
  contento(c) { DIBUJOS.sonrisa(c); },
  risa(c) {
    cara(c, 0, 0, 22); linea(c, [-11, -8, -6, -5, -11, -2], 2.6); linea(c, [11, -8, 6, -5, 11, -2], 2.6);
    c.beginPath(); c.moveTo(-12, 3); c.quadraticCurveTo(0, 22, 12, 3); c.closePath(); c.fillStyle = '#6a2a22'; c.fill(); trazo(c, 2.6); c.stroke();
  },
  enojo(c) {
    cara(c, 0, 0, 22, C.rojo); linea(c, [-13, -11, -4, -6], 3); linea(c, [13, -11, 4, -6], 3); ojos(c, 0, -2, 7, 2.4);
    arco(c, 0, 16, 9, 1.2 * Math.PI, 1.8 * Math.PI);
  },
  enojado(c) { DIBUJOS.enojo(c); linea(c, [16, -26, 20, -18, 24, -24], 2.6, C.rojo); },
  cansado(c) { texto(c, 'Z', -8, 8, 30); texto(c, 'z', 10, -6, 22); texto(c, 'z', 20, -18, 15); },
  triste(c) {
    cara(c, 0, 0, 22, C.celeste); ojos(c, 0, -5); arco(c, 0, 16, 10, 1.2 * Math.PI, 1.8 * Math.PI);
    c.beginPath(); c.moveTo(9, 0); c.quadraticCurveTo(13, 8, 9, 10); c.quadraticCurveTo(5, 8, 9, 0); c.fillStyle = C.azul; c.fill();
  },
  corazon(c) { corazon(c, 0, 0, 20); },
  enamorado(c) { cara(c, 0, 2, 21, C.rosa); corazon(c, -8, -5, 5.5, C.rojo, null); corazon(c, 8, -5, 5.5, C.rojo, null); arco(c, 0, 2, 11, 0.2 * Math.PI, 0.8 * Math.PI); },
  timido(c) { cara(c, 0, 0, 22, C.rosa); ojos(c, 0, -4, 7, 2); linea(c, [-7, 9, 7, 9], 2.6); circulo(c, -13, 4, 4, C.rojo, null); circulo(c, 13, 4, 4, C.rojo, null); },
  abrazo(c) {
    circulo(c, -9, -12, 8, C.piel); circulo(c, 10, -12, 8, C.piel);
    rect(c, -19, -3, 19, 24, C.verde, 7); rect(c, 0, -3, 19, 24, C.ocre, 7);
    linea(c, [-14, 6, 0, 12, 14, 6], 3.6, C.marron);
  },
  cinco(c) { mano(c, -8, 4, 0.95); mano(c, 10, 2, 0.95, '#c8956a', true); texto(c, '✶', 0, -22, 16, C.ocre); },
  golpe(c) { mano(c, -4, 4, 1); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; linea(c, [16 + Math.cos(a) * 4, -14 + Math.sin(a) * 4, 16 + Math.cos(a) * 10, -14 + Math.sin(a) * 10], 2.4, C.rojo); } },
  mano(c) {
    c.beginPath(); c.ellipse(-8, 4, 13, 9, -0.3, 0, Math.PI * 2); c.fillStyle = C.piel; c.fill(); trazo(c, 2.8); c.stroke();
    c.beginPath(); c.ellipse(8, 2, 13, 9, 0.3, 0, Math.PI * 2); c.fillStyle = '#c8956a'; c.fill(); trazo(c, 2.8); c.stroke();
    linea(c, [-22, 10, -28, 18], 3); linea(c, [22, 8, 28, 16], 3); corazon(c, 0, -20, 6);
  },
  beso(c) {
    c.beginPath(); c.moveTo(-20, 0); c.quadraticCurveTo(-10, -14, 0, -6); c.quadraticCurveTo(10, -14, 20, 0); c.quadraticCurveTo(0, 18, -20, 0); c.closePath();
    c.fillStyle = C.rojo; c.fill(); trazo(c, 3); c.stroke(); linea(c, [-18, 0, 18, 0], 2.2);
  },
  nota(c) { circulo(c, -10, 14, 7, TINTA, null); circulo(c, 12, 8, 7, TINTA, null); linea(c, [-4, 14, -4, -18, 18, -24, 18, 8], 3.6); },
  cartas(c) {
    c.save(); c.rotate(-0.25); rect(c, -20, -18, 22, 32, C.crema, 4); texto(c, '♥', -9, -2, 16, C.rojo); c.restore();
    c.save(); c.rotate(0.2); rect(c, -2, -20, 22, 32, C.crema, 4); texto(c, '♣', 9, -4, 16); c.restore();
  },
  foto(c) { rect(c, -24, -12, 48, 30, C.gris, 6); rect(c, -12, -20, 14, 9, C.gris, 3); circulo(c, 2, 3, 10, C.celeste); circulo(c, 2, 3, 4, TINTA, null); },
  mate(c) {
    c.beginPath(); c.moveTo(-14, -8); c.quadraticCurveTo(-22, 18, 0, 22); c.quadraticCurveTo(22, 18, 14, -8); c.closePath(); c.fillStyle = C.marron; c.fill(); trazo(c, 3); c.stroke();
    rect(c, -15, -12, 30, 6, '#b8b0a0', 2, TINTA, 2.4); c.fillStyle = C.verde; c.fillRect(-11, -10, 22, 3);
    linea(c, [4, -10, 14, -26], 3.4, '#a8a090'); linea(c, [12, -26, 17, -27], 3, '#a8a090');
  },
  pez(c) {
    c.beginPath(); c.moveTo(-18, 0); c.quadraticCurveTo(0, -16, 16, 0); c.quadraticCurveTo(0, 16, -18, 0); c.closePath(); c.fillStyle = C.celeste; c.fill(); trazo(c, 3); c.stroke();
    c.beginPath(); c.moveTo(14, 0); c.lineTo(26, -10); c.lineTo(26, 10); c.closePath(); c.fillStyle = C.azul; c.fill(); trazo(c, 2.6); c.stroke();
    circulo(c, -9, -2, 2, TINTA, null); for (let i = 0; i < 3; i++) circulo(c, -2 + i * 5, 3, 1.4, C.rojo, null);
  },
  tren(c) {
    rect(c, -24, -10, 30, 22, C.verde, 3); rect(c, -20, -6, 10, 8, C.celeste, 2, TINTA, 2.2); rect(c, 6, -2, 18, 14, C.rojo, 3);
    rect(c, 14, -16, 6, 14, TINTA, 1, null); circulo(c, -14, 16, 6, TINTA, null); circulo(c, 2, 16, 6, TINTA, null); circulo(c, 16, 16, 5, TINTA, null);
    circulo(c, 20, -22, 4, '#cfc8bd', null);
  },
  lluvia(c) { nube(c, 0, -6, 1.2, '#cfd6da'); for (const [x, y] of [[-12, 14], [0, 20], [12, 14]]) linea(c, [x, y - 4, x - 3, y + 4], 3, C.azul); },
  sol(c) { circulo(c, 0, 0, 12, C.ocre); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; linea(c, [Math.cos(a) * 17, Math.sin(a) * 17, Math.cos(a) * 25, Math.sin(a) * 25], 3); } },
  nieve(c) { for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; linea(c, [Math.cos(a) * -22, Math.sin(a) * -22, Math.cos(a) * 22, Math.sin(a) * 22], 3.4, C.azul); } circulo(c, 0, 0, 4, C.crema, C.azul, 2.4); },
  nube(c) { circulo(c, 10, -10, 9, C.ocre); nube(c, -2, 6, 1.3, '#dcdcd6'); },
  rayo(c) { c.beginPath(); c.moveTo(4, -26); c.lineTo(-14, 4); c.lineTo(0, 4); c.lineTo(-6, 26); c.lineTo(16, -6); c.lineTo(2, -6); c.closePath(); c.fillStyle = C.ocre; c.fill(); trazo(c, 3); c.stroke(); },
  lengua(c) { cara(c, 0, 0, 22); linea(c, [-11, -8, -5, -5], 2.6); circulo(c, 7, -6, 2.4, TINTA, null); linea(c, [-10, 6, 10, 6], 3); c.beginPath(); c.ellipse(2, 12, 6, 7, 0, 0, Math.PI); c.fillStyle = C.rosa; c.fill(); trazo(c, 2.4); c.stroke(); },
  queja(c) { nube(c, 0, 2, 1.4, '#c8c2b4'); linea(c, [-12, 0, -6, -6, 0, 2, 6, -6, 12, 0], 2.6); },
  ignorar(c) { cara(c, 0, 0, 22, C.gris); linea(c, [-12, -4, -4, -4], 3); linea(c, [4, -4, 12, -4], 3); linea(c, [-6, 10, 6, 10], 3); linea(c, [-26, 22, 26, -22], 3.6, C.rojo); },
  perdon(c) { linea(c, [-14, 26, -14, -22], 3.6, C.marron); c.beginPath(); c.moveTo(-14, -22); c.quadraticCurveTo(4, -28, 22, -18); c.lineTo(22, 2); c.quadraticCurveTo(4, -6, -14, 0); c.closePath(); c.fillStyle = '#fbf7ec'; c.fill(); trazo(c, 3); c.stroke(); },
  flor(c) {
    linea(c, [0, 4, 0, 28], 3.4, C.verde); c.beginPath(); c.ellipse(-8, 18, 7, 3.5, -0.6, 0, Math.PI * 2); c.fillStyle = C.verde; c.fill();
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; circulo(c, Math.cos(a) * 10, -6 + Math.sin(a) * 10, 7.5, C.rosa, TINTA, 2.4); }
    circulo(c, 0, -6, 5.5, C.ocre, TINTA, 2.2);
  },
  susurro(c) { c.beginPath(); c.moveTo(-6, 22); c.bezierCurveTo(-22, 22, -16, -26, 6, -22); c.bezierCurveTo(22, -18, 12, 2, 4, 6); c.quadraticCurveTo(0, 12, 2, 18); c.fillStyle = C.piel; c.fill(); trazo(c, 3); c.stroke(); for (let i = 0; i < 3; i++) arco(c, 6, -2, 14 + i * 6, -0.5, 0.4, 2.4); },
  estrella(c) {
    c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 10 : 24, a = i * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
    c.fillStyle = C.ocre; c.fill(); trazo(c, 3); c.stroke();
  },
  pregunta(c) { texto(c, '?', 0, 3, 46); },
  exclamacion(c) { texto(c, '!', 0, 3, 46, C.rojo); },
  huellas(c) { for (const [x, y, s] of [[-10, 10, 1], [10, -8, -1]]) { c.beginPath(); c.ellipse(x, y, 6, 9, 0.2 * s, 0, Math.PI * 2); c.fillStyle = C.marron; c.fill(); for (let i = 0; i < 3; i++) circulo(c, x - 5 + i * 5, y - 13, 2.2, C.marron, null); } },
  guino(c) { cara(c, 0, 0, 22); linea(c, [-12, -5, -4, -5], 3); circulo(c, 7, -5, 2.6, TINTA, null); arco(c, 0, 0, 12, 0.15 * Math.PI, 0.85 * Math.PI); },
  consolar(c) { corazon(c, 4, 4, 14, C.rosa); mano(c, -10, -4, 0.75); },
  libro(c) { rect(c, -24, -16, 24, 32, C.crema, 2); rect(c, 0, -16, 24, 32, C.crema, 2); for (let i = 0; i < 3; i++) { linea(c, [-19, -8 + i * 8, -5, -8 + i * 8], 2); linea(c, [5, -8 + i * 8, 19, -8 + i * 8], 2); } },
  regalo(c) { rect(c, -20, -6, 40, 28, C.rojo, 3); rect(c, -24, -14, 48, 10, C.rojo, 3); c.fillStyle = C.ocre; c.fillRect(-4, -14, 8, 36); arco(c, -8, -20, 7, 0, Math.PI * 2, 2.6); arco(c, 8, -20, 7, 0, Math.PI * 2, 2.6); },
  herramienta(c) { linea(c, [-16, 22, 8, -2], 6, C.marron); c.save(); c.translate(10, -10); c.rotate(-Math.PI / 4); rect(c, -16, -7, 32, 14, C.gris, 2); c.restore(); },
  olla(c) { c.beginPath(); c.moveTo(-20, -6); c.lineTo(-17, 18); c.quadraticCurveTo(0, 24, 17, 18); c.lineTo(20, -6); c.closePath(); c.fillStyle = C.gris; c.fill(); trazo(c, 3); c.stroke(); linea(c, [-26, -6, 26, -6], 3.4); for (const x of [-8, 0, 8]) linea(c, [x, -12, x + 3, -20, x, -26], 2.4, C.gris); },
  vaca(c) { c.beginPath(); c.ellipse(0, 4, 18, 16, 0, 0, Math.PI * 2); c.fillStyle = C.crema; c.fill(); trazo(c, 3); c.stroke(); circulo(c, -7, 0, 2.4, TINTA, null); circulo(c, 7, 0, 2.4, TINTA, null); c.beginPath(); c.ellipse(0, 13, 10, 6, 0, 0, Math.PI * 2); c.fillStyle = C.rosa; c.fill(); trazo(c, 2.4); c.stroke(); linea(c, [-14, -10, -22, -18], 3); linea(c, [14, -10, 22, -18], 3); circulo(c, 10, -4, 4, C.marron, null); },
  casa(c) { rect(c, -18, -2, 36, 26, C.ocre, 2); c.beginPath(); c.moveTo(-26, 0); c.lineTo(0, -24); c.lineTo(26, 0); c.closePath(); c.fillStyle = C.rojo; c.fill(); trazo(c, 3); c.stroke(); rect(c, -5, 8, 10, 16, C.marron, 1, TINTA, 2.4); },
  puerta(c) { rect(c, -14, -24, 28, 48, C.marron, 3); circulo(c, 8, 2, 2.5, C.ocre, null); },
  chau(c) { mano(c, 2, 4, 1.05); for (const r of [24, 30]) arco(c, 2, 4, r, -2.6, -2.0, 2.4); },
  volver(c) { arco(c, 4, 4, 16, Math.PI * 1.1, Math.PI * 2.4, 4); c.beginPath(); c.moveTo(-20, -6); c.lineTo(-6, -8); c.lineTo(-14, 6); c.closePath(); c.fillStyle = TINTA; c.fill(); },
  oveja(c) { for (const [x, y] of [[-10, -4], [0, -10], [10, -4], [-6, 6], [6, 6], [0, 0]]) circulo(c, x, y, 9, C.crema, TINTA, 2.4); c.beginPath(); c.ellipse(20, -2, 6, 8, 0, 0, Math.PI * 2); c.fillStyle = TINTA; c.fill(); linea(c, [-8, 14, -8, 24], 3); linea(c, [8, 14, 8, 24], 3); },
  arbol(c) { linea(c, [0, 26, 0, 4], 5, C.marron); c.beginPath(); c.moveTo(0, -26); c.lineTo(-18, 8); c.lineTo(18, 8); c.closePath(); c.fillStyle = C.verde; c.fill(); trazo(c, 3); c.stroke(); },
  luna(c) { c.beginPath(); c.arc(0, 0, 20, Math.PI * 0.35, Math.PI * 1.65); c.quadraticCurveTo(-6, 0, 6, 19); c.closePath(); c.fillStyle = '#e8d9a0'; c.fill(); trazo(c, 3); c.stroke(); },
  radio(c) { rect(c, -24, -10, 48, 30, C.marron, 4); circulo(c, -10, 5, 8, C.crema, TINTA, 2.4); rect(c, 4, -2, 14, 4, C.ocre, 1, null); rect(c, 4, 6, 14, 4, C.ocre, 1, null); linea(c, [12, -10, 20, -26], 3); },
  taza(c) { c.beginPath(); c.moveTo(-18, -8); c.lineTo(-14, 18); c.lineTo(10, 18); c.lineTo(14, -8); c.closePath(); c.fillStyle = C.crema; c.fill(); trazo(c, 3); c.stroke(); arco(c, 15, 4, 7, -1.4, 1.4, 3); for (const x of [-8, 2]) linea(c, [x, -14, x + 3, -20, x, -26], 2.4, C.gris); },
  anillo(c) { circulo(c, 0, 6, 16, null, C.ocre, 5); c.beginPath(); c.moveTo(-6, -14); c.lineTo(0, -24); c.lineTo(6, -14); c.lineTo(0, -8); c.closePath(); c.fillStyle = C.celeste; c.fill(); trazo(c, 2.4); c.stroke(); },
  diario(c) { rect(c, -22, -20, 44, 40, '#f4f0e4', 2); rect(c, -16, -14, 14, 12, C.gris, 1, null); for (let i = 0; i < 4; i++) linea(c, [2, -12 + i * 5, 16, -12 + i * 5], 2); for (let i = 0; i < 3; i++) linea(c, [-16, 6 + i * 5, 16, 6 + i * 5], 2); },
  canasta(c) { c.beginPath(); c.moveTo(-22, -2); c.lineTo(-16, 22); c.lineTo(16, 22); c.lineTo(22, -2); c.closePath(); c.fillStyle = C.ocre; c.fill(); trazo(c, 3); c.stroke(); arco(c, 0, -2, 16, Math.PI, 0, 3); for (const x of [-8, 0, 8]) linea(c, [x, 0, x, 20], 2); },
  montana(c) { c.beginPath(); c.moveTo(-28, 22); c.lineTo(-6, -18); c.lineTo(4, -4); c.lineTo(12, -14); c.lineTo(28, 22); c.closePath(); c.fillStyle = C.gris; c.fill(); trazo(c, 3); c.stroke(); c.beginPath(); c.moveTo(-6, -18); c.lineTo(-13, -5); c.lineTo(-1, -9); c.closePath(); c.fillStyle = '#f4f2ec'; c.fill(); },
  carta(c) { rect(c, -24, -14, 48, 30, C.crema, 2); linea(c, [-24, -14, 0, 6, 24, -14], 3); },
  hoja(c) { c.beginPath(); c.moveTo(-20, 20); c.quadraticCurveTo(-22, -18, 20, -20); c.quadraticCurveTo(18, 18, -20, 20); c.closePath(); c.fillStyle = C.ocre; c.fill(); trazo(c, 3); c.stroke(); linea(c, [-16, 16, 14, -14], 2.4); },
  vecinos(c) { for (const [x, col] of [[-11, C.verde], [11, C.ocre]]) { circulo(c, x, -10, 8, C.piel); rect(c, x - 9, 0, 18, 22, col, 7); } },
  bebe(c) { circulo(c, 0, -4, 14, C.piel); ojos(c, 0, -6, 5, 1.8); arco(c, 0, -2, 5, 0.2 * Math.PI, 0.8 * Math.PI, 2.4); c.beginPath(); c.ellipse(0, 16, 18, 9, 0, Math.PI, 0, true); c.fillStyle = C.celeste; c.fill(); trazo(c, 3); c.stroke(); },
  semilla(c) { c.beginPath(); c.ellipse(0, 8, 10, 14, 0.3, 0, Math.PI * 2); c.fillStyle = C.marron; c.fill(); trazo(c, 3); c.stroke(); linea(c, [2, -6, 4, -20], 3, C.verde); c.beginPath(); c.ellipse(10, -20, 8, 4, -0.4, 0, Math.PI * 2); c.fillStyle = C.verde; c.fill(); },
};

// 3.7.4: los de las reglas (vecindad-social.js). Algunos son el mismo dibujo con otro nombre
Object.assign(DIBUJOS, {
  saludo: DIBUJOS.chau, consuelo: DIBUJOS.consolar, chiste: DIBUJOS.risa, broma: DIBUJOS.guino, nada: DIBUJOS.ignorar, musica: DIBUJOS.nota,
  pasos: DIBUJOS.huellas, oficio: DIBUJOS.herramienta, granja: DIBUJOS.vaca, lana: DIBUJOS.oveja, verguenza: DIBUJOS.timido,
  aplauso(c) { mano(c, -9, 2, 0.85); mano(c, 9, 2, 0.85, '#c8956a', true); for (const [x, y] of [[0, -24], [-12, -20], [12, -20]]) linea(c, [x, y, x * 1.3, y - 6], 2.6, C.ocre); },
  morisqueta(c) { cara(c, 0, 0, 22); circulo(c, -7, -6, 5, C.crema, TINTA, 2.2); circulo(c, 7, -6, 5, C.crema, TINTA, 2.2); circulo(c, -5, -6, 2, TINTA, null); circulo(c, 5, -6, 2, TINTA, null); c.beginPath(); c.ellipse(0, 11, 5, 7, 0, 0, Math.PI); c.fillStyle = C.rosa; c.fill(); trazo(c, 2.4); c.stroke(); linea(c, [-10, 8, 10, 8], 2.6); },
  baile(c) { DIBUJOS.nota(c); corazon(c, 14, -18, 6); },
  pesca(c) { linea(c, [-22, 24, 14, -24], 3.4, C.marron); linea(c, [14, -24, 18, 6], 1.6); arco(c, 15, 9, 4, 0, Math.PI, 2.4); c.save(); c.translate(-6, 14); c.scale(0.5, 0.5); DIBUJOS.pez(c); c.restore(); },
  pelota(c) { circulo(c, 0, 0, 20, '#f4f0e4'); c.beginPath(); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; c.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); } c.closePath(); c.fillStyle = TINTA; c.fill(); },
  frutilla(c) { c.beginPath(); c.moveTo(-16, -8); c.quadraticCurveTo(0, -14, 16, -8); c.quadraticCurveTo(12, 16, 0, 22); c.quadraticCurveTo(-12, 16, -16, -8); c.fillStyle = C.rojo; c.fill(); trazo(c, 3); c.stroke(); for (const [x, y] of [[-6, 0], [6, 0], [0, 8], [-4, 14], [4, 14]]) circulo(c, x, y, 1.4, C.ocre, null); c.beginPath(); c.ellipse(0, -12, 12, 4, 0, 0, Math.PI * 2); c.fillStyle = C.verde; c.fill(); },
  miel(c) { rect(c, -14, -8, 28, 30, C.ocre, 5); rect(c, -16, -16, 32, 9, C.marron, 3); rect(c, -8, 2, 16, 12, C.crema, 2, TINTA, 2); },
  pan(c) { c.beginPath(); c.ellipse(0, 4, 24, 15, 0, 0, Math.PI * 2); c.fillStyle = '#c99a5a'; c.fill(); trazo(c, 3); c.stroke(); for (const x of [-10, 0, 10]) linea(c, [x - 4, -4, x + 4, 6], 2.6); },
  madera(c) { for (const [y, l] of [[8, 0], [-8, 4]]) { rect(c, -22 + l, y - 7, 40, 14, C.marron, 6); circulo(c, 18 + l, y, 6.5, '#c99a5a', TINTA, 2.4); circulo(c, 18 + l, y, 2.5, null, TINTA, 1.6); } },
  piedra(c) { c.beginPath(); c.moveTo(-22, 14); c.lineTo(-16, -8); c.lineTo(0, -16); c.lineTo(18, -8); c.lineTo(22, 14); c.closePath(); c.fillStyle = C.gris; c.fill(); trazo(c, 3); c.stroke(); linea(c, [-6, -4, 2, 4], 2); },
  pluma(c) { c.beginPath(); c.moveTo(-18, 22); c.quadraticCurveTo(-16, -10, 18, -24); c.quadraticCurveTo(10, 6, -18, 22); c.fillStyle = C.verde; c.fill(); trazo(c, 3); c.stroke(); linea(c, [-22, 26, 12, -16], 2.4); },
  baya(c) { for (const [x, y] of [[-8, 4], [8, 4], [0, 14], [0, -4]]) circulo(c, x, y, 8, C.azul, TINTA, 2.4); linea(c, [0, -12, 6, -24], 2.6, C.verde); },
  pinon(c) { for (const [x, r] of [[-9, -0.3], [9, 0.3]]) { c.save(); c.translate(x, 2); c.rotate(r); c.beginPath(); c.ellipse(0, 0, 7, 18, 0, 0, Math.PI * 2); c.fillStyle = C.marron; c.fill(); trazo(c, 2.6); c.stroke(); c.restore(); } },
  hongo(c) { rect(c, -6, 0, 12, 22, C.crema, 4); c.beginPath(); c.arc(0, 2, 22, Math.PI, 0); c.closePath(); c.fillStyle = C.rojo; c.fill(); trazo(c, 3); c.stroke(); for (const [x, y] of [[-10, -6], [6, -12], [12, -4]]) circulo(c, x, y, 3, C.crema, null); },
  huevo(c) { c.beginPath(); c.ellipse(0, 3, 16, 21, 0, 0, Math.PI * 2); c.fillStyle = '#f4ead2'; c.fill(); trazo(c, 3); c.stroke(); },
  huerta(c) { c.beginPath(); c.moveTo(-8, -6); c.lineTo(8, -6); c.lineTo(0, 26); c.closePath(); c.fillStyle = '#d07a2e'; c.fill(); trazo(c, 3); c.stroke(); for (const a of [-0.5, 0, 0.5]) linea(c, [0, -6, Math.sin(a) * 14, -24], 3, C.verde); },
  tranquilo(c) { cara(c, 0, 0, 22, C.verde); arco(c, -7, -6, 4, 0.1 * Math.PI, 0.9 * Math.PI, 2.6); arco(c, 7, -6, 4, 0.1 * Math.PI, 0.9 * Math.PI, 2.6); arco(c, 0, 4, 7, 0.25 * Math.PI, 0.75 * Math.PI); },
  sorpresa(c) { cara(c, 0, 0, 22); circulo(c, -7, -6, 3, TINTA, null); circulo(c, 7, -6, 3, TINTA, null); circulo(c, 0, 10, 5.5, '#6a2a22', TINTA, 2.4); linea(c, [-12, -15, -4, -14], 2.4); linea(c, [12, -15, 4, -14], 2.4); },
  confundido(c) { cara(c, 0, 0, 22, C.celeste); ojos(c, 0, -5); linea(c, [-9, 10, -3, 7, 3, 11, 9, 8], 2.6); texto(c, '?', 18, -18, 20); },
});

// Dibuja el atlas entero en `lienzo` (un canvas del DOM). Devuelve el mismo lienzo.
export function dibujarAtlas(lienzo) {
  lienzo.width = LADO_ATLAS * CELDA; lienzo.height = LADO_ATLAS * CELDA;
  const c = lienzo.getContext('2d');
  c.clearRect(0, 0, lienzo.width, lienzo.height);
  NOMBRES_ICONOS.forEach((n, i) => {
    const f = DIBUJOS[n];
    if (!f) return;
    c.save();
    c.translate((i % LADO_ATLAS) * CELDA + CELDA / 2, Math.floor(i / LADO_ATLAS) * CELDA + CELDA / 2);
    try { f(c); } catch {}
    c.restore();
  });
  return lienzo;
}
// (para las pruebas: qué íconos tienen dibujo)
export const iconosConDibujo = () => NOMBRES_ICONOS.filter((n) => typeof DIBUJOS[n] === 'function');
