// 2.8: "Tu bandera". Módulo puro (se prueba en Node): dos o tres colores, cómo se reparten
// (franjas o cuarteles) y un dibujo chico al medio. `dibujarBandera` pinta sobre el
// contexto 2D que le pasen (un <canvas> en el juego, un simulado en las pruebas): no
// crea nada del DOM. La textura para el mástil del refugio, la torre de vigía y la
// pantalla de victoria la arma personal-bandera-mundo.js con esta misma función.
import { registrarSeccion, elegir, color } from './personalizacion.js';
import { fila, segmentos, muestras, parrafo } from './personal-controles.js';

export const COLORES_BANDERA = [
  { id: '#f2ead8', nombre: 'Blanco lana' },
  { id: '#1f1a17', nombre: 'Negro' },
  { id: '#b8432f', nombre: 'Rojo notro' },
  { id: '#e0b12a', nombre: 'Amarillo' },
  { id: '#3f6f9e', nombre: 'Azul lago' },
  { id: '#7cb4dc', nombre: 'Celeste' },
  { id: '#4f6b34', nombre: 'Verde lenga' },
  { id: '#6b4a78', nombre: 'Violeta calafate' },
  { id: '#b0773a', nombre: 'Ocre' },
];
export const DISPOSICIONES = [
  { id: 'horizontal', nombre: 'Franjas acostadas' },
  { id: 'vertical', nombre: 'Franjas paradas' },
  { id: 'cuarteles', nombre: 'Cuarteles' },
  { id: 'diagonal', nombre: 'En diagonal' },
];
export const ICONOS = [
  { id: 'ninguno', nombre: 'Sin dibujo' },
  { id: 'sol', nombre: 'Sol' },
  { id: 'estrella', nombre: 'Estrella' },
  { id: 'cruz', nombre: 'Cruz del Sur' },
  { id: 'hoja', nombre: 'Hoja' },
  { id: 'arbol', nombre: 'Pehuén' },
  { id: 'montana', nombre: 'Cerro' },
  { id: 'pez', nombre: 'Trucha' },
];

export const banderaDefecto = () => ({ colores: ['#3f6f9e', '#f2ead8', '#4f6b34'], cuantos: 3, disposicion: 'horizontal', icono: 'sol', colorIcono: '#e0b12a' });
export function sanearBandera(d) {
  const x = d && typeof d === 'object' ? d : {};
  const b = banderaDefecto();
  const cs = Array.isArray(x.colores) ? x.colores : [];
  return {
    colores: [0, 1, 2].map((i) => color(cs[i], b.colores[i])),
    cuantos: elegir(Number(x.cuantos), [2, 3], b.cuantos),
    disposicion: elegir(x.disposicion, DISPOSICIONES.map((o) => o.id), b.disposicion),
    icono: elegir(x.icono, ICONOS.map((o) => o.id), b.icono),
    colorIcono: color(x.colorIcono, b.colorIcono),
  };
}

// Las zonas de color, en fracciones del paño (0..1). Puro: sirve para probar y dibujar.
export function zonasBandera(d) {
  const x = sanearBandera(d);
  const n = x.cuantos, c = x.colores;
  if (x.disposicion === 'vertical') return c.slice(0, n).map((col, i) => ({ tipo: 'rect', x: i / n, y: 0, w: 1 / n, h: 1, color: col }));
  if (x.disposicion === 'cuarteles') {
    // dos colores: ajedrez; tres: arriba a la izquierda el primero, abajo a la derecha el tercero
    const q = n === 2 ? [c[0], c[1], c[1], c[0]] : [c[0], c[1], c[1], c[2]];
    return [
      { tipo: 'rect', x: 0, y: 0, w: 0.5, h: 0.5, color: q[0] }, { tipo: 'rect', x: 0.5, y: 0, w: 0.5, h: 0.5, color: q[1] },
      { tipo: 'rect', x: 0, y: 0.5, w: 0.5, h: 0.5, color: q[2] }, { tipo: 'rect', x: 0.5, y: 0.5, w: 0.5, h: 0.5, color: q[3] },
    ];
  }
  if (x.disposicion === 'diagonal') {
    const zonas = [{ tipo: 'poli', puntos: [[0, 0], [1, 0], [0, 1]], color: c[0] }, { tipo: 'poli', puntos: [[1, 0], [1, 1], [0, 1]], color: c[1] }];
    if (n === 3) zonas.push({ tipo: 'poli', puntos: [[0.82, 0], [1, 0], [1, 0.18], [0.18, 1], [0, 1], [0, 0.82]], color: c[2] });
    return zonas;
  }
  return c.slice(0, n).map((col, i) => ({ tipo: 'rect', x: 0, y: i / n, w: 1, h: 1 / n, color: col }));
}

// El dibujo del medio, como trazos en coordenadas del paño (centro 0,0; radio 1).
function trazarIcono(ctx, id, cx, cy, r) {
  const P = (px, py) => [cx + px * r, cy + py * r];
  const poli = (pts) => { ctx.beginPath(); pts.forEach(([a, b], i) => { const [x, y] = P(a, b); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill(); };
  const circulo = (a, b, rr) => { const [x, y] = P(a, b); ctx.beginPath(); ctx.arc(x, y, rr * r, 0, Math.PI * 2); ctx.fill(); };
  const estrella = (a, b, rr, puntas = 5) => {
    const pts = [];
    for (let i = 0; i < puntas * 2; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / puntas, q = i % 2 ? rr * 0.45 : rr;
      pts.push([a + Math.cos(ang) * q, b + Math.sin(ang) * q]);
    }
    poli(pts);
  };
  switch (id) {
    case 'sol':
      circulo(0, 0, 0.42);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        poli([[Math.cos(a - 0.12) * 0.5, Math.sin(a - 0.12) * 0.5], [Math.cos(a) * 0.95, Math.sin(a) * 0.95], [Math.cos(a + 0.12) * 0.5, Math.sin(a + 0.12) * 0.5]]);
      }
      break;
    case 'estrella': estrella(0, 0.05, 0.95); break;
    case 'cruz': estrella(0, -0.7, 0.26); estrella(0, 0.72, 0.3); estrella(-0.55, 0.05, 0.24); estrella(0.5, -0.1, 0.2); estrella(0.22, 0.28, 0.11); break;
    case 'hoja':
      poli([[0, -0.95], [0.45, -0.45], [0.55, 0.1], [0.3, 0.6], [0, 0.8], [-0.3, 0.6], [-0.55, 0.1], [-0.45, -0.45]]);
      poli([[-0.05, 0.75], [0.05, 0.75], [0.07, 1], [-0.07, 1]]);
      break;
    case 'arbol':
      // la araucaria: tronco recto y ramas en paraguas
      poli([[-0.08, 1], [0.08, 1], [0.06, -0.5], [-0.06, -0.5]]);
      poli([[-0.95, -0.35], [0, -0.95], [0.95, -0.35], [0.7, -0.3], [0, -0.7], [-0.7, -0.3]]);
      poli([[-0.75, 0.05], [0, -0.45], [0.75, 0.05], [0.55, 0.1], [0, -0.22], [-0.55, 0.1]]);
      break;
    case 'montana':
      poli([[-1, 0.75], [-0.3, -0.55], [0.05, 0.05], [0.4, -0.3], [1, 0.75]]);
      break;
    case 'pez':
      poli([[-0.75, 0], [-0.3, -0.38], [0.3, -0.34], [0.65, 0], [0.3, 0.34], [-0.3, 0.38]]);
      poli([[0.55, 0], [1, -0.4], [0.9, 0], [1, 0.4]]);
      break;
    default: break;
  }
}

// Pinta la bandera en `ctx` (ancho × alto en píxeles). Devuelve las zonas pintadas.
export function dibujarBandera(ctx, d, ancho, alto) {
  const x = sanearBandera(d);
  const zonas = zonasBandera(x);
  for (const z of zonas) {
    ctx.fillStyle = z.color;
    if (z.tipo === 'rect') ctx.fillRect(Math.floor(z.x * ancho), Math.floor(z.y * alto), Math.ceil(z.w * ancho), Math.ceil(z.h * alto));
    else {
      ctx.beginPath();
      z.puntos.forEach(([a, b], i) => (i ? ctx.lineTo(a * ancho, b * alto) : ctx.moveTo(a * ancho, b * alto)));
      ctx.closePath();
      ctx.fill();
    }
  }
  if (x.icono !== 'ninguno') {
    ctx.fillStyle = x.colorIcono;
    trazarIcono(ctx, x.icono, ancho / 2, alto / 2, Math.min(ancho, alto) * 0.3);
  }
  return zonas;
}

function construir(cont, api) {
  const d = api.datos;
  const redibujar = () => { cont.innerHTML = ''; construir(cont, api); };
  const cambiar = (parcial) => { api.cambiar(parcial); redibujar(); };
  const vista = document.createElement('canvas');
  vista.width = 240; vista.height = 160;
  vista.className = 'personal-bandera-vista';
  vista.setAttribute('role', 'img');
  vista.setAttribute('aria-label', 'Cómo queda tu bandera');
  const ctx = vista.getContext('2d');
  if (ctx) dibujarBandera(ctx, d, vista.width, vista.height);
  cont.appendChild(vista);
  cont.appendChild(parrafo('Flamea en el mástil de tu refugio, arriba de cada torre de vigía de La noche de los duendes y en la pantalla de la victoria.'));
  const opciones = COLORES_BANDERA.map((c) => ({ valor: c.id, color: c.id, texto: c.nombre }));
  fila(cont, 'Colores', segmentos([{ valor: 2, texto: 'Dos' }, { valor: 3, texto: 'Tres' }], d.cuantos, (v) => cambiar({ cuantos: v })));
  for (let i = 0; i < d.cuantos; i++) {
    fila(cont, ['Primer color', 'Segundo color', 'Tercer color'][i], muestras(opciones, d.colores[i], (v) => {
      const colores = [...d.colores]; colores[i] = v; cambiar({ colores });
    }, `Color ${i + 1}`));
  }
  fila(cont, 'Cómo se reparten', segmentos(DISPOSICIONES.map((o) => ({ valor: o.id, texto: o.nombre })), d.disposicion, (v) => cambiar({ disposicion: v })));
  fila(cont, 'Dibujo', segmentos(ICONOS.map((o) => ({ valor: o.id, texto: o.nombre })), d.icono, (v) => cambiar({ icono: v })));
  if (d.icono !== 'ninguno') fila(cont, 'Color del dibujo', muestras(opciones, d.colorIcono, (v) => cambiar({ colorIcono: v }), 'Color del dibujo'));
}

export const SECCION_BANDERA = registrarSeccion({
  id: 'bandera',
  titulo: 'Tu bandera',
  orden: 30,
  porDefecto: banderaDefecto,
  sanear: sanearBandera,
  construir,
  aplicar: (datos, api) => { api?.mundo?.bandera?.aplicar?.(datos); },
});
