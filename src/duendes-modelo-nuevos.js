// 4.8: los modelos de los duendes nuevos (el curandero y el enjambre), aparte de duendes-modelo.js.
// Se arman con el mismo estilo y el mismo esqueleto de los demás (`armarDuende`), y se anotan en el registro
// `DUENDES`; el dibujo (instanciado, con su LOD) es el de siempre, en desafio-duendes.js.
//
//   · el curandero: flaco y pálido, de gorro de hongo claro con muchos hongos chiquitos, capa de hojas
//     verde hierba, bufanda y una calabaza de hierbas colgada adelante, con la boca que brilla verde
//     (desde lejos es lo que lo delata). Mide ~70 cm, como los demás.
//   · el enjambre: duendecitos de 30 cm, cabezones, de gorro de bellota, sin barba ni nada en las manos y
//     los ojos de ámbar (así se distinguen en la noche de los de ojos verdes). Un solo modelo, simple.
import { DUENDES } from './duendes-modelo.js';

// (lo mismo que `mezclar` de duendes-modelo.js: pisa campo a campo, un nivel de profundidad)
const mezclar = (a, b) => {
  const o = { ...a };
  for (const [k, v] of Object.entries(b || {})) o[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? { ...a[k], ...v } : v;
  return o;
};

// El curandero. Parte del pillo (esqueleto y proporciones de la casa) y se viste distinto.
function curandero() {
  const pillo = DUENDES.rastreador(0);
  const propio = {
    cab: 0.25, nariz: { largo: 0.95, punta: 0.95, forma: 'papa' }, orejas: { largo: 1.3, ancho: 1, abre: 1.15 },
    piel: { col: '#b3a67f' }, boca: 'sonrisa',
    ojos: { brillo: '#9cff7a', fuerza: 2 },
    cejas: { col: '#d8dcc0', grosor: 1, angulo: 0.35 },
    gorro: { col: '#d8cfa4', puno: '#8a9a5a', alto: 2.9, caida: 0.95, hongos: 9, musgo: 0.8, tela: 5 },
    cuerpo: { torso: 0.44, panza: 0.08, ancho: 0.9, cadera: 0.5 },
    ropa: { saco: '#7a8f5a', bufanda: '#c8b878', pantalon: '#5a5a3a', remiendos: ['#d8cfa4', '#a48a4a'] },
    capa: { tipo: 'hojas', col: '#6f9a4a', corta: 1 },
    barba: { tipo: 'corta', col: '#d6dcba', largo: 1.0, liquen: 1, musgo: 0.5 },
    objeto: 'calabaza', botin: 0,
  };
  return {
    travieso: mezclar(pillo.travieso, propio),
    // de viejo (las noches grandes): más oscuro, pero con la misma calabaza y los hongos claros
    viejo: mezclar(pillo.viejo, { ...propio, piel: { col: '#8e8566' }, gorro: { col: '#b8b08a', puno: '#5e6e3e', alto: 2.9, caida: 1.1, hongos: 10 },
      ropa: { saco: '#4e5e3a', bufanda: '#9a8c58', pantalon: '#3a3a28', remiendos: ['#b8b08a'] }, capa: { tipo: 'musgo', col: '#3e5a2a', musgo: 1, corta: 1 } }),
  };
}

// El enjambre: tres cosas lo hacen chiquito de verdad: la cabeza grande, el cuerpo corto y el gorro de bellota
// (sin hongos, sin barba, sin nada que sume triángulos). El tamaño final lo da la altura del tipo (30 cm).
function enjambre() {
  const pillo = DUENDES.rastreador(0);
  const e = mezclar(pillo.travieso, {
    cab: 0.34, cabEsc: [1, 1, 1], nariz: { largo: 0.8, punta: 0.8, forma: 'papa' }, orejas: { largo: 1.1, ancho: 1, abre: 1.1 },
    piel: { col: '#a89870' }, boca: 'sonrisa',
    ojos: { tam: 1.25, brillo: '#ffd84a', fuerza: 2.2 },
    gorro: { col: '#7a5a32', puno: '#4e3a22', alto: 1.8, caida: 0.5, hongos: 0, musgo: 0, tela: 5 },
    cuerpo: { torso: 0.34, panza: 0.1, ancho: 0.95, cadera: 0.42 },
    ropa: { saco: '#6b5a36', pantalon: '#4a3a28', remiendos: [], bufanda: null },
    capa: null, barba: null, bigote: null, objeto: null, botin: 0, hojas: 0,
  });
  return { travieso: e, viejo: e };
}

let hecho = false;
export function registrarDuendesNuevos() {
  if (hecho) return;
  hecho = true;
  DUENDES.curandero = () => curandero();
  DUENDES.enjambre = () => enjambre();
}
registrarDuendesNuevos();
