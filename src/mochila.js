// La mochila: lo que llevás encima, en una barra de acceso rápido y una
// pantalla de inventario. Cada casillero se dibuja con su icono y su cuenta.


// 2.5: la flecha elegida en el carcaj (ver desafio-arsenal.js)
import { tipoFlecha, flechasDe, FLECHAS } from './desafio-arsenal.js';
import { nombreDeBallesta } from './personal-armas.js';
// 3.7.2: lo de la cocina (cocina-pasos.js)
import { ranurasCocina } from './cocina-pasos.js';
import { ranurasGranja, ICONOS_GRANJA } from './granja.js';
// ---------------------------------------------------------------- iconos
// Cada icono se dibuja por código sobre un lienzo chico, y se guarda en caché.
const cache = new Map();

function icono(tipo) {
  if (cache.has(tipo)) return cache.get(tipo);
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.lineCap = 'round';
  x.lineJoin = 'round';
  const dibujos = {
    hacha() {
      x.strokeStyle = '#6b5238'; x.lineWidth = 6;
      x.beginPath(); x.moveTo(20, 54); x.lineTo(42, 16); x.stroke();
      x.fillStyle = '#9aa3aa';
      x.beginPath(); x.moveTo(34, 12); x.lineTo(54, 20); x.lineTo(44, 34); x.lineTo(30, 24); x.fill();
      x.fillStyle = '#c9d0d6';
      x.beginPath(); x.moveTo(50, 18); x.lineTo(54, 20); x.lineTo(46, 32); x.fill();
    },
    tronco() {
      x.fillStyle = '#6b5238';
      x.beginPath(); x.roundRect(8, 24, 48, 18, 8); x.fill();
      x.fillStyle = '#8a6b4a';
      x.beginPath(); x.ellipse(52, 33, 5, 9, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#5f4526'; x.lineWidth = 1.5;
      x.beginPath(); x.ellipse(52, 33, 2.5, 4.5, 0, 0, Math.PI * 2); x.stroke();
    },
    tabla() {
      x.fillStyle = '#8a6b4a'; x.fillRect(8, 22, 48, 9);
      x.fillStyle = '#9a7a55'; x.fillRect(8, 34, 48, 9);
      x.strokeStyle = '#6b5238'; x.lineWidth = 1.2;
      x.strokeRect(8, 22, 48, 9); x.strokeRect(8, 34, 48, 9);
    },
    piedra() {
      x.fillStyle = '#7d766c';
      x.beginPath(); x.ellipse(26, 40, 16, 11, -0.2, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#8f887d';
      x.beginPath(); x.ellipse(42, 30, 11, 8, 0.3, 0, Math.PI * 2); x.fill();
    },
    ramita() {
      x.strokeStyle = '#7a5f43'; x.lineWidth = 5;
      x.beginPath(); x.moveTo(14, 52); x.lineTo(50, 14); x.stroke();
      x.lineWidth = 3.5;
      x.beginPath(); x.moveTo(30, 36); x.lineTo(22, 22); x.stroke();
      x.beginPath(); x.moveTo(38, 28); x.lineTo(48, 32); x.stroke();
    },
    pinon() {
      x.fillStyle = '#7a5231';
      x.beginPath(); x.ellipse(32, 34, 13, 20, 0, 0, 6.3); x.fill();
      x.fillStyle = '#5c3d24';
      for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(32, 20 + i * 9, 12 - i, 4, 0, 0, 6.3); x.fill(); }
      x.strokeStyle = '#4a3b2c'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(32, 14); x.lineTo(32, 8); x.stroke();
    },
    calafate() {
      x.fillStyle = '#3b2b57';
      for (const [cx, cy] of [[24, 36], [40, 30], [33, 46]]) { x.beginPath(); x.arc(cx, cy, 9, 0, 6.3); x.fill(); }
      x.strokeStyle = '#4d6b3a'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(33, 28); x.lineTo(40, 14); x.stroke();
    },
    frutilla() {
      x.fillStyle = '#b8342f';
      x.beginPath(); x.moveTo(32, 54); x.bezierCurveTo(14, 40, 16, 20, 32, 20); x.bezierCurveTo(48, 20, 50, 40, 32, 54); x.fill();
      x.fillStyle = '#4d7a35';
      x.beginPath(); x.moveTo(32, 22); x.lineTo(20, 14); x.lineTo(32, 16); x.lineTo(44, 14); x.closePath(); x.fill();
    },
    pluma() {
      x.strokeStyle = '#6b5238'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(20, 54); x.lineTo(46, 12); x.stroke();
      x.fillStyle = '#d8cfbe';
      x.beginPath(); x.moveTo(44, 14); x.quadraticCurveTo(22, 20, 22, 48); x.quadraticCurveTo(38, 38, 44, 14); x.fill();
    },
    canto() {
      x.fillStyle = '#8d8579';
      x.beginPath(); x.ellipse(32, 38, 20, 14, 0.2, 0, 6.3); x.fill();
      x.fillStyle = '#a49b8d';
      x.beginPath(); x.ellipse(26, 32, 9, 6, 0.3, 0, 6.3); x.fill();
    },
    cana() {
      x.strokeStyle = '#6b5238'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(12, 54); x.lineTo(50, 12); x.stroke();
      x.strokeStyle = '#3f3830'; x.lineWidth = 2;
      x.beginPath(); x.arc(24, 42, 6, 0, 6.3); x.stroke();
      x.strokeStyle = '#cfc9bb'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(50, 12); x.quadraticCurveTo(44, 34, 52, 50); x.stroke();
    },
    farol() {
      x.fillStyle = '#3f3830';
      x.fillRect(22, 14, 20, 5); x.fillRect(22, 46, 20, 6);
      x.strokeStyle = '#3f3830'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(24, 19); x.lineTo(24, 46); x.moveTo(40, 19); x.lineTo(40, 46); x.stroke();
      x.fillStyle = '#f0d08a';
      x.beginPath(); x.ellipse(32, 33, 8, 12, 0, 0, 6.3); x.fill();
      x.strokeStyle = '#3f3830'; x.lineWidth = 2;
      x.beginPath(); x.arc(32, 12, 6, Math.PI, 0); x.stroke();
    },
    linterna() {
      x.fillStyle = '#4a4a4a';
      x.fillRect(18, 26, 26, 14);
      x.fillStyle = '#d8d2c2';
      x.beginPath(); x.moveTo(44, 22); x.lineTo(54, 16); x.lineTo(54, 50); x.lineTo(44, 44); x.closePath(); x.fill();
      x.fillStyle = '#f0d08a';
      x.beginPath(); x.arc(50, 33, 5, 0, 6.3); x.fill();
    },
    carpa() {
      x.fillStyle = '#8a6a3c';
      x.beginPath(); x.moveTo(32, 14); x.lineTo(54, 50); x.lineTo(10, 50); x.closePath(); x.fill();
      x.fillStyle = '#4a3b2c';
      x.beginPath(); x.moveTo(32, 20); x.lineTo(42, 50); x.lineTo(22, 50); x.closePath(); x.fill();
    },
    manta() {
      x.fillStyle = '#9a8f7c';
      x.fillRect(12, 22, 40, 24);
      x.fillStyle = '#6b6152';
      for (let i = 0; i < 3; i++) x.fillRect(12, 26 + i * 8, 40, 3);
    },
    yerba() {
      x.fillStyle = '#cfc2a4';
      x.fillRect(18, 16, 28, 36);
      x.fillStyle = '#4d6b3a';
      x.fillRect(18, 28, 28, 12);
      x.fillStyle = '#8a7f68';
      x.fillRect(18, 16, 28, 5);
    },
    mate() {
      x.fillStyle = '#5b3f28';
      x.beginPath(); x.arc(30, 38, 15, 0, 6.3); x.fill();
      x.strokeStyle = '#9aa0a6'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(38, 28); x.lineTo(48, 12); x.stroke();
    },
    frasco() {
      x.fillStyle = '#8a5a3c';
      x.fillRect(20, 22, 24, 28);
      x.fillStyle = '#c9bfa6';
      x.fillRect(18, 16, 28, 7);
    },
    camara() {
      x.fillStyle = '#4a4a4a';
      x.fillRect(12, 22, 40, 26);
      x.fillStyle = '#2a2620';
      x.beginPath(); x.arc(32, 35, 11, 0, 6.3); x.fill();
      x.fillStyle = '#7fb0c8';
      x.beginPath(); x.arc(32, 35, 7, 0, 6.3); x.fill();
      x.fillStyle = '#8a8378';
      x.fillRect(38, 16, 10, 7);
    },
    // 2.5: el arsenal
    ballesta() {
      x.strokeStyle = '#6b5238'; x.lineWidth = 6;
      x.beginPath(); x.moveTo(32, 58); x.lineTo(32, 18); x.stroke();
      x.strokeStyle = '#7a5f43'; x.lineWidth = 4;
      x.beginPath(); x.arc(32, 40, 22, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
      x.strokeStyle = '#d8cfbe'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(13, 30); x.lineTo(32, 36); x.lineTo(51, 30); x.stroke();
    },
    facon() {
      x.fillStyle = '#c9ccd0';
      x.beginPath(); x.moveTo(16, 50); x.lineTo(50, 12); x.lineTo(44, 26); x.lineTo(22, 52); x.fill();
      x.fillStyle = '#6b5238'; x.fillRect(10, 48, 14, 8);
      x.fillStyle = '#b89a5c'; x.fillRect(20, 44, 4, 14);
    },
    maza() {
      x.strokeStyle = '#6b5238'; x.lineWidth = 6;
      x.beginPath(); x.moveTo(14, 56); x.lineTo(38, 26); x.stroke();
      x.fillStyle = '#5a4630'; x.beginPath(); x.arc(42, 20, 12, 0, 6.3); x.fill();
      x.fillStyle = '#b4b0a8';
      for (let i = 0; i < 6; i++) { const a = i * 1.05; x.fillRect(42 + Math.cos(a) * 12 - 2, 20 + Math.sin(a) * 12 - 2, 4, 4); }
    },
    arpon() {
      x.strokeStyle = '#6b5238'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(10, 54); x.lineTo(44, 20); x.stroke();
      x.fillStyle = '#7dfff0';
      x.beginPath(); x.moveTo(42, 22); x.lineTo(56, 8); x.lineTo(50, 28); x.fill();
      x.strokeStyle = '#d8cfbe'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(10, 54); x.quadraticCurveTo(4, 40, 16, 34); x.stroke();
    },
    hachuela() {
      x.strokeStyle = '#6b5238'; x.lineWidth = 5;
      x.beginPath(); x.moveTo(20, 56); x.lineTo(36, 18); x.stroke();
      x.fillStyle = '#8f8b84';
      x.beginPath(); x.moveTo(32, 14); x.lineTo(50, 16); x.lineTo(46, 32); x.lineTo(34, 26); x.fill();
    },
    jabalina() {
      x.strokeStyle = '#6b5238'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(6, 58); x.lineTo(50, 14); x.stroke();
      x.fillStyle = '#8a8378';
      x.beginPath(); x.moveTo(48, 16); x.lineTo(58, 6); x.lineTo(52, 20); x.fill();
    },
    granada() {
      x.fillStyle = '#4d7f86'; x.beginPath(); x.arc(32, 36, 16, 0, 6.3); x.fill();
      x.fillStyle = '#7dfff0'; x.beginPath(); x.arc(27, 31, 6, 0, 6.3); x.fill();
      x.fillStyle = '#6b5238'; x.fillRect(29, 14, 6, 8);
    },
    humo() {
      x.fillStyle = '#3c3a36'; x.beginPath(); x.arc(30, 42, 12, 0, 6.3); x.fill();
      x.fillStyle = 'rgba(160,156,148,0.8)';
      for (const [cx, cy, rr] of [[36, 22, 9], [46, 16, 7], [26, 18, 6]]) { x.beginPath(); x.arc(cx, cy, rr, 0, 6.3); x.fill(); }
    },
    bengala() {
      x.fillStyle = '#a8322b'; x.fillRect(26, 26, 12, 30);
      x.fillStyle = '#ffd2a0'; x.beginPath(); x.arc(32, 20, 8, 0, 6.3); x.fill();
      x.fillStyle = 'rgba(255,138,74,0.5)'; x.beginPath(); x.arc(32, 20, 14, 0, 6.3); x.fill();
    },
    cuerno() {
      x.strokeStyle = '#d9c9a6'; x.lineWidth = 9; x.lineCap = 'round';
      x.beginPath(); x.moveTo(12, 44); x.quadraticCurveTo(30, 56, 50, 22); x.stroke();
      x.strokeStyle = '#6b5238'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(20, 50); x.lineTo(24, 42); x.stroke();
      x.lineCap = 'butt';
    },
    lanza() {
      x.strokeStyle = '#6b5238'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(12, 56); x.lineTo(44, 20); x.stroke();
      x.fillStyle = '#8a8378';
      x.beginPath(); x.moveTo(42, 22); x.lineTo(56, 6); x.lineTo(48, 26); x.fill();
      x.strokeStyle = '#c9bfa6'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(38, 24); x.lineTo(44, 30); x.moveTo(40, 22); x.lineTo(46, 28); x.stroke();
    },
    arco() {
      x.strokeStyle = '#7a5f43'; x.lineWidth = 5;
      x.beginPath(); x.arc(20, 32, 26, -1.15, 1.15); x.stroke();
      x.strokeStyle = '#d8cfbe'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(30, 8); x.lineTo(30, 56); x.stroke();
      x.strokeStyle = '#6b5238'; x.lineWidth = 2.5;
      x.beginPath(); x.moveTo(14, 32); x.lineTo(56, 32); x.stroke();
      x.fillStyle = '#8a8378';
      x.beginPath(); x.moveTo(56, 32); x.lineTo(49, 28); x.lineTo(49, 36); x.fill();
    },
    pistola() {
      x.fillStyle = '#9aa0a6';
      x.beginPath(); x.roundRect(10, 22, 40, 13, 6); x.fill();
      x.fillStyle = '#6d7278';
      x.beginPath(); x.roundRect(14, 32, 11, 20, 3); x.fill();
      x.fillStyle = '#7dfff0';
      x.beginPath(); x.arc(50, 28, 5, 0, 6.3); x.fill();
      x.fillRect(20, 25, 20, 3);
    },
    lanzaCristal() {
      dibujos.lanza();
      x.fillStyle = '#7dfff0';
      x.beginPath(); x.moveTo(42, 22); x.lineTo(56, 6); x.lineTo(48, 26); x.fill();
    },
    honda() {
      x.strokeStyle = '#6b5238'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(10, 52); x.quadraticCurveTo(20, 20, 32, 30); x.quadraticCurveTo(44, 20, 54, 52); x.stroke();
      x.fillStyle = '#8a6a3c';
      x.beginPath(); x.ellipse(32, 32, 7, 5, 0, 0, 6.3); x.fill();
      x.fillStyle = '#8a8378';
      x.beginPath(); x.arc(32, 30, 4, 0, 6.3); x.fill();
    },
    boleadoras() {
      x.strokeStyle = '#8a6a3c'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(32, 32); x.lineTo(14, 16); x.moveTo(32, 32); x.lineTo(52, 20); x.moveTo(32, 32); x.lineTo(30, 54); x.stroke();
      x.fillStyle = '#7d766c';
      for (const [a, b] of [[14, 16], [52, 20], [30, 54]]) { x.beginPath(); x.arc(a, b, 7, 0, 6.3); x.fill(); }
    },
    martillo() {
      x.strokeStyle = '#6b5238'; x.lineWidth = 6;
      x.beginPath(); x.moveTo(18, 56); x.lineTo(40, 24); x.stroke();
      x.fillStyle = '#6f6e68';
      x.save(); x.translate(42, 20); x.rotate(0.6); x.fillRect(-14, -6, 28, 12); x.restore();
    },
    emplasto() {
      x.fillStyle = '#c9bfa6';
      x.beginPath(); x.roundRect(12, 18, 40, 28, 6); x.fill();
      x.fillStyle = '#4b7a4b';
      x.fillRect(28, 22, 8, 20); x.fillRect(22, 28, 20, 8);
    },
    cristal() {
      // 3.8.0: una semilla dorada (gota con estrías, la punta más clara)
      const gota = () => { x.beginPath(); x.moveTo(32, 6); x.bezierCurveTo(44, 20, 50, 38, 42, 50); x.bezierCurveTo(37, 58, 27, 58, 22, 50); x.bezierCurveTo(14, 38, 20, 20, 32, 6); };
      x.fillStyle = '#e8a22a'; gota(); x.fill();
      x.fillStyle = '#ffd77a'; x.beginPath(); x.ellipse(29, 26, 5, 11, -0.25, 0, 6.3); x.fill();
      x.strokeStyle = '#8a5212'; x.lineWidth = 2;
      for (const dx of [-7, 0, 7]) { x.beginPath(); x.moveTo(32 + dx * 0.3, 10); x.quadraticCurveTo(32 + dx * 1.5, 34, 32 + dx, 55); x.stroke(); }
    },
    hongo() {
      // llao llao: bolitas anaranjadas llenas de hoyitos
      for (const [cx, cy, rr] of [[24, 34, 11], [40, 30, 9], [34, 46, 8]]) {
        x.fillStyle = '#e0913a'; x.beginPath(); x.arc(cx, cy, rr, 0, 6.3); x.fill();
        x.fillStyle = '#a8581e';
        for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(cx + Math.cos(i * 1.3) * rr * 0.5, cy + Math.sin(i * 1.3) * rr * 0.5, 1.3, 0, 6.3); x.fill(); }
      }
    },
    grabador() {
      // un grabador de periodista: caja, parlante, casete a la vista
      x.fillStyle = '#3f3a33';
      x.beginPath(); x.roundRect(12, 18, 40, 30, 5); x.fill();
      x.fillStyle = '#8a8378';
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { x.beginPath(); x.arc(20 + i * 4, 26 + j * 4, 1.1, 0, 6.3); x.fill(); }
      x.fillStyle = '#c9bfa6'; x.fillRect(36, 24, 12, 8);
      x.fillStyle = '#3f3a33';
      x.beginPath(); x.arc(39, 28, 2, 0, 6.3); x.arc(45, 28, 2, 0, 6.3); x.fill();
      x.fillStyle = '#b8342f'; x.beginPath(); x.arc(44, 41, 3, 0, 6.3); x.fill();
      x.strokeStyle = '#3f3a33'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(20, 18); x.lineTo(24, 10); x.lineTo(40, 10); x.lineTo(44, 18); x.stroke();
    },
    // 1.10: la huerta y la majada
    haba() {
      x.fillStyle = '#6f9a45';
      x.beginPath(); x.ellipse(32, 34, 22, 9, -0.5, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#a9cc72';
      for (const [cx, cy] of [[20, 42], [30, 36], [40, 30]]) { x.beginPath(); x.ellipse(cx, cy, 5, 4, -0.5, 0, Math.PI * 2); x.fill(); }
    },
    papa() {
      x.fillStyle = '#b58f5c';
      x.beginPath(); x.ellipse(30, 36, 18, 13, 0.3, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#7d6040';
      for (const [cx, cy] of [[22, 32], [36, 40], [30, 28]]) { x.beginPath(); x.arc(cx, cy, 1.8, 0, Math.PI * 2); x.fill(); }
    },
    poncho() {
      x.fillStyle = '#8f877a';
      x.beginPath(); x.moveTo(10, 22); x.lineTo(54, 22); x.lineTo(48, 52); x.lineTo(16, 52); x.closePath(); x.fill();
      x.fillStyle = '#6b4a3a'; x.fillRect(12, 40, 40, 5);
      x.fillStyle = '#2a241c'; x.beginPath(); x.ellipse(32, 24, 6, 3, 0, 0, Math.PI * 2); x.fill();
    },
    harina() {
      x.fillStyle = '#e8dcc0';
      x.beginPath(); x.moveTo(18, 20); x.lineTo(46, 20); x.lineTo(50, 54); x.lineTo(14, 54); x.closePath(); x.fill();
      x.fillStyle = '#b89b6a'; x.fillRect(18, 16, 28, 6);
      x.fillStyle = '#9a7d52'; x.font = 'bold 10px sans-serif'; x.fillText('HARINA', 16, 42);
    },
    huevo() {
      x.fillStyle = '#efe4cc';
      x.beginPath(); x.ellipse(32, 36, 14, 18, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#c9b894'; x.lineWidth = 1.5; x.stroke();
      x.fillStyle = 'rgba(255,255,255,0.55)';
      x.beginPath(); x.ellipse(27, 28, 3.5, 6, -0.3, 0, Math.PI * 2); x.fill();
    },
    semillas() {
      x.fillStyle = '#d8cfbe';
      x.beginPath(); x.moveTo(20, 16); x.lineTo(44, 16); x.lineTo(48, 52); x.lineTo(16, 52); x.closePath(); x.fill();
      x.strokeStyle = '#8a7a60'; x.lineWidth = 1.5; x.stroke();
      x.fillStyle = '#6f9a45';
      for (const [cx, cy] of [[26, 38], [34, 42], [38, 34]]) { x.beginPath(); x.ellipse(cx, cy, 3.5, 2.5, 0.4, 0, Math.PI * 2); x.fill(); }
    },
    lana() {
      x.fillStyle = '#e9e2d2';
      for (const [cx, cy, r] of [[24, 34, 12], [38, 32, 13], [31, 24, 10], [32, 42, 11]]) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); }
      x.strokeStyle = '#b9ad93'; x.lineWidth = 1.2;
      for (const [cx, cy] of [[24, 34], [38, 32]]) { x.beginPath(); x.arc(cx, cy, 5, 0.5, 4); x.stroke(); }
    },
    tijera() {
      x.strokeStyle = '#aeb6bc'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(16, 52); x.lineTo(40, 12); x.moveTo(26, 54); x.lineTo(48, 14); x.stroke();
      x.strokeStyle = '#7d6146'; x.lineWidth = 3;
      x.beginPath(); x.arc(20, 50, 7, 0, Math.PI * 2); x.stroke();
    },
    mosca() {
      x.strokeStyle = '#3f3830'; x.lineWidth = 3;
      x.beginPath(); x.arc(32, 38, 9, 0.4, 5.6); x.stroke();
      x.fillStyle = '#b8342f';
      x.beginPath(); x.ellipse(32, 34, 7, 5, 0, 0, 6.3); x.fill();
      x.strokeStyle = '#d8cfbe'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(30, 30); x.lineTo(20, 18); x.moveTo(34, 30); x.lineTo(46, 20); x.stroke();
    },
    // 2.3
    miel() {
      x.fillStyle = '#d9d2c2';
      x.fillRect(22, 14, 20, 6);
      x.fillStyle = '#d98f1e';
      x.beginPath(); x.moveTo(18, 22); x.lineTo(46, 22); x.lineTo(44, 52); x.lineTo(20, 52); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,230,150,0.55)';
      x.fillRect(23, 26, 4, 20);
    },
    // 2.4: lo del horno de barro
    pan() {
      x.fillStyle = '#b9854a';
      x.beginPath(); x.ellipse(32, 38, 20, 13, 0, 0, 6.3); x.fill();
      x.strokeStyle = '#8a5a2c'; x.lineWidth = 2.5;
      x.beginPath(); x.moveTo(22, 34); x.lineTo(28, 42); x.moveTo(30, 32); x.lineTo(36, 42); x.moveTo(38, 32); x.lineTo(44, 40); x.stroke();
    },
    // 3.7.2: lo de la cocina (cocina-pasos.js): la fuente del asado, la olla, la taza y la fruta (la leche, las carnes
    // crudas, los chorizos y cada fruta de la granja los dibuja granja.js)
    asado() {
      x.fillStyle = '#9a4a32';
      x.beginPath(); x.ellipse(32, 36, 21, 13, -0.25, 0, 6.3); x.fill();
      x.fillStyle = '#e8d2b0'; x.beginPath(); x.ellipse(26, 33, 9, 4, -0.25, 0, 6.3); x.fill();
      x.strokeStyle = '#6a2e1e'; x.lineWidth = 2;
      for (const dx of [-8, 0, 8]) { x.beginPath(); x.moveTo(30 + dx, 26); x.lineTo(34 + dx, 46); x.stroke(); }
    },
    olla() {
      x.fillStyle = '#4a4642'; x.fillRect(14, 26, 36, 24);
      x.fillStyle = '#5e5a55'; x.fillRect(11, 22, 42, 6);
      x.fillStyle = '#2e2b28'; x.fillRect(28, 15, 8, 7);
      x.strokeStyle = '#c8c0b0'; x.lineWidth = 2; x.globalAlpha = 0.6;
      x.beginPath(); x.moveTo(24, 14); x.quadraticCurveTo(20, 8, 26, 4); x.moveTo(40, 14); x.quadraticCurveTo(44, 8, 38, 4); x.stroke(); x.globalAlpha = 1;
    },
    taza() {
      x.fillStyle = '#e8e2d4'; x.fillRect(16, 24, 26, 26);
      x.strokeStyle = '#e8e2d4'; x.lineWidth = 5; x.beginPath(); x.arc(44, 36, 7, -1.3, 1.3); x.stroke();
      x.fillStyle = '#5a3424'; x.fillRect(19, 24, 20, 5);
    },
    fruta() {
      x.fillStyle = '#b8323a'; x.beginPath(); x.arc(26, 38, 11, 0, 6.3); x.fill();
      x.fillStyle = '#c8a03a'; x.beginPath(); x.arc(40, 36, 11, 0, 6.3); x.fill();
      x.strokeStyle = '#5a4a2a'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(26, 27); x.lineTo(30, 18); x.moveTo(40, 25); x.lineTo(38, 16); x.stroke();
      x.fillStyle = '#5a7a3a'; x.beginPath(); x.ellipse(34, 18, 6, 3, 0.4, 0, 6.3); x.fill();
    },
    empanada() {
      x.fillStyle = '#d4a15c';
      x.beginPath(); x.arc(32, 44, 20, Math.PI, 0); x.closePath(); x.fill();
      x.strokeStyle = '#a8742f'; x.lineWidth = 2.5;
      for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 7; x.beginPath(); x.moveTo(32 + Math.cos(a) * 16, 44 + Math.sin(a) * 16); x.lineTo(32 + Math.cos(a) * 21, 44 + Math.sin(a) * 21); x.stroke(); }
    },
    trucha() {
      x.fillStyle = '#8a8f7a';
      x.beginPath(); x.ellipse(30, 32, 17, 7, 0, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.moveTo(45, 32); x.lineTo(56, 24); x.lineTo(56, 40); x.closePath(); x.fill();
      x.fillStyle = '#c96a6a';
      x.fillRect(16, 31, 26, 2.5);
      x.fillStyle = '#2b2b2b';
      for (const [cx, cy] of [[22, 28], [30, 27], [36, 29], [26, 36]]) { x.beginPath(); x.arc(cx, cy, 1.2, 0, 6.3); x.fill(); }
    },
    truchaAhumada() {
      x.fillStyle = '#9b6a3a';
      x.beginPath(); x.ellipse(30, 32, 17, 7, 0, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.moveTo(45, 32); x.lineTo(56, 24); x.lineTo(56, 40); x.closePath(); x.fill();
      x.fillStyle = '#6b4424';
      x.fillRect(16, 31, 26, 2.5);
    },
    plantin() {
      x.fillStyle = '#7a4a32';
      x.beginPath(); x.moveTo(20, 40); x.lineTo(44, 40); x.lineTo(41, 54); x.lineTo(23, 54); x.closePath(); x.fill();
      x.strokeStyle = '#4e6a2e'; x.lineWidth = 2.5;
      x.beginPath(); x.moveTo(32, 40); x.lineTo(32, 16); x.stroke();
      x.fillStyle = '#6f9a45';
      for (const [cx, cy, a] of [[26, 26, -0.5], [38, 22, 0.5], [27, 16, -0.3], [36, 32, 0.4]]) { x.beginPath(); x.ellipse(cx, cy, 6, 3, a, 0, Math.PI * 2); x.fill(); }
    },
  };
  // 3.7.2 (granja): la leche, las carnes, los chorizos, las frutas y los fardos (los dibuja granja.js)
  if (!Object.hasOwn(dibujos, tipo) && Object.hasOwn(ICONOS_GRANJA, tipo)) ICONOS_GRANJA[tipo](x);
  else (dibujos[tipo] || dibujos.canto)();
  const url = c.toDataURL();
  cache.set(tipo, url);
  return url;
}

// ---------------------------------------------------------------- contenido
// 2.7.3: las semillas y los plantines del vivero, con su id y su nombre armados una sola
// vez (la barra rearma la mochila en cada cuadro y antes rehacía estos textos cada vez)
const SEMILLAS_VIVERO = [['coihue', 'coihue'], ['lenga', 'lenga'], ['nire', 'ñire'], ['cipres', 'ciprés']]
  .map(([esp, nombre]) => ({ id: `semilla-${esp}`, nombre: `Semillas de ${nombre}` }));
const PLANTINES_VIVERO = [['coihue', 'coihue'], ['lenga', 'lenga'], ['nire', 'ñire'], ['cipres', 'ciprés'], ['pehuen', 'pehuén']]
  .map(([esp, nombre]) => ({ id: `plantin-${esp}`, nombre: `Plantines de ${nombre}` }));

// Qué hay en la mochila, en orden: primero las herramientas, después lo juntado.
export function armarMochila(progreso, estado) {
  const cant = (k) => progreso.entradas[k]?.cantidad || 0;
  const ranuras = [];

  ranuras.push({ id: 'camara', nombre: 'Cámara', icono: 'camara', accion: 'foto', texto: 'Sacá una foto de lo que estés mirando.' });
  ranuras.push({ id: 'cana', nombre: 'Caña de pescar', icono: 'cana', accion: 'cana', activo: estado.canaEquipada, texto: 'Lanzá a la orilla del lago o del arroyo.' });
  if (progreso.cosas?.farol) {
    ranuras.push({ id: 'farol', nombre: 'Farol de kerosene', icono: 'farol', accion: 'luz', activo: estado.luzEncendida, texto: 'Alumbra mucho más lejos que la linterna.' });
  } else {
    ranuras.push({ id: 'linterna', nombre: 'Linterna', icono: 'linterna', accion: 'luz', activo: estado.luzEncendida, texto: 'Para no andar a tientas de noche.' });
  }
  if (progreso.cosas?.manta) {
    ranuras.push({ id: 'carpa', nombre: progreso.carpa ? 'Carpa armada' : 'Carpa de lona', icono: 'carpa', accion: 'carpa', activo: !!progreso.carpa, texto: 'Se arma en un lugar llano y seco. De noche se duerme adentro.' });
  }
  if (progreso.ramitas > 0) ranuras.push({ id: 'ramita', nombre: 'Ramitas', icono: 'ramita', cuenta: progreso.ramitas, accion: 'fuego', texto: 'Con tres alcanza para encender un fogón.' });
  if (cant('pinon')) ranuras.push({ id: 'pinon', nombre: 'Piñones', icono: 'pinon', cuenta: cant('pinon'), accion: 'plantar-pehuen', texto: 'Se comen tostados al fuego o se plantan en un claro.' });
  if (cant('calafate')) ranuras.push({ id: 'calafate', nombre: 'Calafate', icono: 'calafate', cuenta: cant('calafate'), accion: 'plantar-coihue', texto: 'Para hacer dulce, o para plantar un renoval de coihue.' });
  if (cant('frutilla')) ranuras.push({ id: 'frutilla', nombre: 'Frutillas', icono: 'frutilla', cuenta: cant('frutilla'), accion: 'cocinar', texto: 'Al rescoldo quedan dulcísimas.' });
  if (progreso.cosas?.yerba) ranuras.push({ id: 'yerba', nombre: 'Yerba', icono: 'yerba', cuenta: progreso.cosas.yerba, accion: 'cocinar', texto: 'Alcanza para cebar unos cuantos mates en cualquier fuego.' });
  if (cant('pluma')) ranuras.push({ id: 'pluma', nombre: 'Plumas', icono: 'pluma', cuenta: cant('pluma'), texto: 'En el almacén se cambian por cosas útiles.' });
  // 2.1: lo que se seca en el tendal y las conservas (ver `conservas.js`)
  if (cant('llaollao')) ranuras.push({ id: 'llaollao', nombre: 'Llao llao', icono: 'hongo', cuenta: cant('llaollao'), texto: 'Tres, colgados en un tendal, se secan en medio día de sol.' });
  if (cant('frasco-frutilla')) ranuras.push({ id: 'frasco-frutilla', nombre: 'Dulce de frutilla', icono: 'frasco', cuenta: cant('frasco-frutilla'), texto: 'Para el invierno, o para cambiar en el almacén.' });
  if (cant('calafate-seco')) ranuras.push({ id: 'calafate-seco', nombre: 'Calafates secos', icono: 'calafate', cuenta: cant('calafate-seco'), texto: 'Para el invierno, o para cambiar en el almacén.' });
  if (cant('hongos-secos')) ranuras.push({ id: 'hongos-secos', nombre: 'Llao llao seco', icono: 'hongo', cuenta: cant('hongos-secos'), texto: 'Para el invierno, o para cambiar en el almacén.' });
  if (cant('canto')) ranuras.push({ id: 'canto', nombre: 'Cantos rodados', icono: 'canto', cuenta: cant('canto'), texto: 'En el almacén se cambian por cosas útiles.' });
  if (progreso.cosas?.hacha) ranuras.push({ id: 'hacha', nombre: 'Hacha de mano', icono: 'hacha', accion: 'hacha', texto: 'Para hacer troncos de lo caído y juntar piedra.' });
  const M = progreso.materiales || {};
  if (M.tronco) ranuras.push({ id: 'tronco', nombre: 'Troncos', icono: 'tronco', cuenta: M.tronco, accion: 'aserrar', texto: 'Y: aserrar. A mano rinde dos tablas; en un banco de carpintero, cuatro.' });
  if (M.tabla) ranuras.push({ id: 'tabla', nombre: 'Tablas', icono: 'tabla', cuenta: M.tabla, texto: 'Para el piso y el techo de lo que levantes.' });
  if (M.piedra) ranuras.push({ id: 'piedra', nombre: 'Piedra', icono: 'piedra', cuenta: M.piedra, texto: 'Para los cimientos.' });
  // 2.1: el grabador de cantos (ver `grabador.js`)
  if (progreso.cosas?.grabador) {
    const n = Object.keys(progreso.grabaciones || {}).length;
    ranuras.push({ id: 'grabador', nombre: 'Grabador de mano', icono: 'grabador', cuenta: n || undefined, accion: 'grabador', texto: 'Clic justo después de que cante un ave anotada: la graba. Si no cantó nada, hace sonar lo grabado y contesta la más cercana.' });
  }
  if (M.lana) ranuras.push({ id: 'lana', nombre: 'Vellones de lana', icono: 'lana', cuenta: M.lana, texto: 'De la majada del galpón. Con dos se teje una alfombra.' });
  if (cant('haba')) ranuras.push({ id: 'haba', nombre: 'Habas', icono: 'haba', cuenta: cant('haba'), accion: 'cocinar', texto: 'De tu cantero. Salteadas al fuego.' });
  if (progreso.cosas?.poncho) ranuras.push({ id: 'poncho', nombre: 'Ponchos', icono: 'poncho', cuenta: progreso.cosas.poncho, texto: 'Del telar. En la feria de la estación se cambian bien.' });
  if (progreso.cosas?.harina) ranuras.push({ id: 'harina', nombre: 'Harina', icono: 'harina', cuenta: progreso.cosas.harina, accion: 'cocinar', texto: 'Del almacén. Con un huevo, una torta frita.' });
  if (cant('huevo')) ranuras.push({ id: 'huevo', nombre: 'Huevos', icono: 'huevo', cuenta: cant('huevo'), accion: 'cocinar', texto: 'Del gallinero. Para la tortilla y la torta frita.' });
  if (cant('papa')) ranuras.push({ id: 'papa', nombre: 'Papas', icono: 'papa', cuenta: cant('papa'), accion: 'cocinar', texto: 'De tu cantero. Al rescoldo, enterradas en la ceniza.' });
  if (progreso.cosas?.['semillas-habas']) ranuras.push({ id: 'semillas-habas', nombre: 'Semillas de habas', icono: 'semillas', cuenta: progreso.cosas['semillas-habas'], texto: 'Para el cantero de la huerta (E).' });
  if (progreso.cosas?.['semillas-papa']) ranuras.push({ id: 'semillas-papa', nombre: 'Papa para semilla', icono: 'papa', cuenta: progreso.cosas['semillas-papa'], texto: 'Para el cantero de la huerta (E).' });
  if (progreso.cosas?.tijera) ranuras.push({ id: 'tijera', nombre: 'Tijera de esquilar', icono: 'tijera', texto: 'Con ella se esquilan las ovejas del corral del galpón (E).' });
  if (progreso.cosas?.mosca) ranuras.push({ id: 'mosca', nombre: 'Mosca de pescar', icono: 'mosca', texto: 'Atada a mano. Con ella los peces pican mucho antes.' });
  // 2.3: la colmena, el ahumadero y el vivero
  if (cant('miel')) ranuras.push({ id: 'miel', nombre: 'Miel', icono: 'miel', cuenta: cant('miel'), accion: 'cocinar', texto: 'De tu colmena. Para las sopaipillas, la feria o el invierno.' });
  if (cant('trucha-fresca')) ranuras.push({ id: 'trucha-fresca', nombre: 'Truchas frescas', icono: 'trucha', cuenta: cant('trucha-fresca'), texto: 'Para el ahumadero (E), con un tronco de leña.' });
  if (cant('pan-casero')) ranuras.push({ id: 'pan-casero', nombre: 'Pan casero', icono: 'pan', cuenta: cant('pan-casero'), accion: 'comer', texto: 'Del horno de barro. Se cambia en la feria o se come en el camino.' });
  if (cant('empanadas')) ranuras.push({ id: 'empanadas', nombre: 'Empanadas', icono: 'empanada', cuenta: cant('empanadas'), accion: 'comer', texto: 'De papa y huevo, del horno de barro. A la cuadrilla de la vía le encantan.' });
  if (cant('trucha-ahumada')) ranuras.push({ id: 'trucha-ahumada', nombre: 'Truchas ahumadas', icono: 'truchaAhumada', cuenta: cant('trucha-ahumada'), accion: 'cocinar', texto: 'Aguantan hasta el invierno. Con papas, al fuego.' });
  for (const s of SEMILLAS_VIVERO) {
    if (cant(s.id)) ranuras.push({ id: s.id, nombre: s.nombre, icono: 'semillas', cuenta: cant(s.id), texto: 'Para el vivero (E): en tres días salen plantines.' });
  }
  for (const s of PLANTINES_VIVERO) {
    if (cant(s.id)) ranuras.push({ id: s.id, nombre: s.nombre, icono: 'plantin', cuenta: cant(s.id), accion: 'plantar', texto: 'Con B, en un claro: ya vienen crecidos a la mitad.' });
  }
  // 3.7.2 (granja): lo de tu granja (ver granja.js)
  for (const r of ranurasGranja(cant)) ranuras.push(r);

  // 3.7.2: lo de la cocina (lo cocinado, lo del almacén, lo de los vecinos y lo de la granja), sin repetir casilla
  if (progreso.modo !== 'desafio') { const ya = new Set(ranuras.map((r) => r.id)); for (const r of ranurasCocina(progreso, ya)) ranuras.push(r); }
  // Modo Desafío: armas y curas van adelante, para tenerlas en 1–4 al empezar la noche
  const D = progreso.modo === 'desafio' ? progreso.desafio : null;
  if (D) {
    if (M.cristal) ranuras.push({ id: 'cristal', nombre: 'Semillas doradas', icono: 'cristal', cuenta: M.cristal, texto: 'Con la pistola de luz, cada una da seis cargas (K).' });
    const armas = [];
    if (progreso.cosas?.pistola) armas.push({ id: 'pistola', nombre: 'Pistola de luz', icono: 'pistola', cuenta: D.cargas || '0', accion: 'arma', texto: 'Clic izquierdo dispara. Gasta una carga por tiro.' });
    if (progreso.cosas?.arco) {
      // 2.5: con el carcaj, la cuenta es la de la flecha elegida
      const tipo = tipoFlecha(D);
      armas.push({ id: 'arco', nombre: progreso.cosas.carcaj && tipo !== 'comun' ? `Arco · flechas ${FLECHAS[tipo].nombre}` : 'Arco de lenga', icono: 'arco', cuenta: flechasDe(D) || '0', accion: 'arma',
        texto: progreso.cosas.carcaj ? 'Clic sostenido tensa (más fuerte); clic derecho cambia de flecha.' : 'Clic sostenido tensa: cuanto más, más fuerte y más lejos.' });
    }
    if (progreso.cosas?.lanza) armas.push({ id: 'lanza', nombre: progreso.cosas.lanzaCristal ? 'Lanza con punta dorada' : 'Lanza de coihue', icono: progreso.cosas.lanzaCristal ? 'lanzaCristal' : 'lanza', accion: 'arma', texto: 'Clic izquierdo golpea; clic derecho sostenido bloquea.' });
    if (progreso.cosas?.honda) armas.push({ id: 'honda', nombre: 'Honda de cuero', icono: 'honda', cuenta: M.piedra || '0', accion: 'arma', texto: 'Tira las piedras que juntaste. Rápida y barata.' });
    if (progreso.cosas?.boleadoras) armas.push({ id: 'boleadoras', nombre: 'Boleadoras', icono: 'boleadoras', cuenta: D.boleadoras || '0', accion: 'arma', texto: 'Enredan al duende y lo dejan quieto unos segundos.' });
    if (D.emplastos) armas.push({ id: 'emplasto', nombre: 'Emplasto de hierbas', icono: 'emplasto', cuenta: D.emplastos, accion: 'curar', texto: 'Clic derecho para curarte 45 puntos.' });
    if (progreso.cosas?.martillo) armas.push({ id: 'martillo', nombre: 'Martillo de carpintero', icono: 'martillo', accion: 'arma', texto: 'Tocá una defensa dañada para repararla.' });
    const adelante = [progreso.cosas?.farol ? 'farol' : 'linterna', 'hacha'];
    // 2.5: el arsenal va después de la linterna y el hacha, para no sacarlas de la barra
    const C = progreso.cosas || {};
    const nuevas = [];
    // 2.8: con el nombre que le pusiste en "Personalizar", si le pusiste
    if (C.ballesta) nuevas.push({ id: 'ballesta', nombre: nombreDeBallesta(progreso, C.ballestaRepeticion ? 'Ballesta de repetición' : 'Ballesta de mano'), icono: 'ballesta', cuenta: D.virotes || '0', accion: 'arma', texto: C.ballestaRepeticion ? 'Tres virotes seguidos; atraviesan al primero.' : 'El virote atraviesa al primero y sigue. Recarga lenta.' });
    if (C.facon) nuevas.push({ id: 'facon', nombre: 'Facón', icono: 'facon', accion: 'arma', texto: C.rodela ? 'Rápido; por la espalda, el doble. Clic derecho: escudo.' : 'Rápido; por la espalda, el doble.' });
    if (C.maza) nuevas.push({ id: 'maza', nombre: 'Maza con clavos', icono: 'maza', accion: 'arma', texto: 'Lenta: aturde, y contra los grandes pega más.' });
    if (C.arpon) nuevas.push({ id: 'arpon', nombre: 'Arpón dorado', icono: 'arpon', accion: 'arma', texto: 'Engancha y arrastra al duende hacia vos.' });
    if (C.hachuela) nuevas.push({ id: 'hachuela', nombre: 'Hachas arrojadizas', icono: 'hachuela', cuenta: D.hachuelas || '0', accion: 'arma', texto: 'Derriban al que corre. Se levantan del suelo.' });
    if (C.jabalina) nuevas.push({ id: 'jabalina', nombre: 'Jabalinas', icono: 'jabalina', cuenta: D.jabalinas || '0', accion: 'arma', texto: 'Llegan lejos. Se levantan del suelo.' });
    if (C.granada) nuevas.push({ id: 'granada', nombre: 'Granadas doradas', icono: 'granada', cuenta: D.granadas || '0', accion: 'arma', texto: 'Estallan al tocar algo. No la tires cerca tuyo.' });
    if (C.humo) nuevas.push({ id: 'humo', nombre: 'Bombas de humo', icono: 'humo', cuenta: D.humos || '0', accion: 'arma', texto: 'Adentro del humo te pierden el rastro.' });
    if (C.bengala) nuevas.push({ id: 'bengala', nombre: 'Bengalas', icono: 'bengala', cuenta: D.bengalas || '0', accion: 'arma', texto: 'Iluminan medio minuto y dejan a la vista a los que haya cerca.' });
    if (C.cuerno) nuevas.push({ id: 'cuerno', nombre: 'Cuerno de guardia', icono: 'cuerno', accion: 'arma', texto: 'Llama a los compañeros; los de cerca dudan.' });
    const primero = [...armas, ...adelante.map((id) => ranuras.find((r) => r.id === id)).filter(Boolean), ...nuevas];
    return [...primero, ...ranuras.filter((r) => !primero.includes(r))];
  }
  return ranuras;
}

// Lo cocinado y anotado, que no se lleva en la mano pero está en la mochila
export function armarGuardado(progreso, ENTRADA) {
  const cocinado = ['pinones-tostados', 'dulce-calafate', 'frutillas-brasas', 'papas-rescoldo', 'habas-salteadas', 'guiso-campo', 'tortilla-papas', 'torta-frita', 'sopaipillas-miel', 'trucha-papas', 'mate', 'te-galesa', 'chocolate'];
  return cocinado.filter((k) => progreso.entradas[k]).map((k) => ({
    id: k, nombre: ENTRADA[k]?.nombre || k, icono: k === 'mate' ? 'mate' : 'frasco',
    texto: ENTRADA[k]?.texto || '',
  }));
}

export { icono };
