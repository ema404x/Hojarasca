// Microconductas RC19: pequeños gestos que rompen el patrón "esperar/caminar/huir".
// No es una simulación metabólica: son estados breves, baratos y compartidos por especie.
import { clamp } from './ruido.js';

const CATALOGOS = {
  huemul: [
    ['forrajear', 0.40, 2.6, 5.8], ['rumiar', 0.26, 2.2, 4.6], ['acicalar', 0.13, 1.4, 2.6], ['vigilar', 0.21, 1.4, 3.2],
  ],
  guanaco: [
    ['forrajear', 0.38, 2.4, 5.2], ['rumiar', 0.22, 2.0, 4.2], ['acicalar', 0.10, 1.3, 2.4], ['vigilar', 0.30, 1.4, 3.0],
  ],
  zorro: [
    ['olfatear', 0.36, 1.5, 3.4], ['acicalar', 0.16, 1.2, 2.3], ['rascar', 0.10, 1.0, 1.8], ['vigilar', 0.38, 1.2, 2.8],
  ],
  liebre: [
    ['olfatear', 0.30, 1.0, 2.4], ['acicalar', 0.14, 1.0, 1.9], ['vigilar', 0.56, 1.1, 2.8],
  ],
  zorzal: [
    ['picotear', 0.50, 1.0, 2.2], ['observar', 0.28, 0.8, 1.8], ['rascarHojarasca', 0.22, 0.8, 1.6],
  ],
  bandurria: [
    ['sondear', 0.48, 1.4, 3.2], ['caminar', 0.24, 1.3, 2.8], ['vigilar', 0.28, 1.1, 2.4],
  ],
};

export function catalogoMicroconductas(tipo) {
  return CATALOGOS[tipo] || CATALOGOS.huemul;
}

export function elegirMicroconducta(tipo, u = 0.5, contexto = {}) {
  if ((contexto.riesgo || 0) > 0.26) return 'vigilar';
  if ((contexto.velocidad || 0) > 0.16) return tipo === 'bandurria' ? 'caminar' : 'vigilar';
  if (contexto.estado === 'descansar') return tipo === 'zorro' ? 'acicalar' : 'rumiar';
  const actividad = clamp(contexto.actividad ?? 0.65, 0, 1);
  let x = clamp(u, 0, 0.999999);
  const cat = catalogoMicroconductas(tipo);
  // Con actividad baja se favorecen rumia/acicalado; con actividad alta, forrajeo/olfateo.
  const pesos = cat.map(([modo, p]) => {
    if (modo === 'forrajear' || modo === 'olfatear' || modo === 'picotear' || modo === 'sondear') return p * (0.7 + actividad * 0.55);
    if (modo === 'rumiar' || modo === 'acicalar') return p * (1.2 - actividad * 0.35);
    return p;
  });
  const total = pesos.reduce((a, b) => a + b, 0) || 1;
  x *= total;
  for (let i = 0; i < cat.length; i++) {
    x -= pesos[i];
    if (x <= 0) return cat[i][0];
  }
  return cat[cat.length - 1][0];
}

export function actualizarMicroconducta(animal, tipo, dt, contexto = {}, azar = Math.random) {
  animal.microFase = (animal.microFase || azar() * Math.PI * 2) + dt;
  animal.microT = (animal.microT || 0) - dt;
  const forzada = (contexto.riesgo || 0) > 0.26 || (contexto.velocidad || 0) > 0.16;
  if (!animal.micro || animal.microT <= 0 || forzada) {
    const modo = elegirMicroconducta(tipo, azar(), contexto);
    const fila = catalogoMicroconductas(tipo).find((x) => x[0] === modo) || [modo, 1, 1.2, 2.2];
    animal.micro = modo;
    animal.microT = fila[2] + azar() * Math.max(0.05, fila[3] - fila[2]);
  }
  return animal.micro;
}

export function gestoMicroconducta(tipo, modo, fase = 0) {
  const s = Math.sin(fase * 3.1), s2 = Math.sin(fase * 5.7 + 1.3);
  const g = { cabezaX: 0, cabezaY: 0, orejaY: 0, colaY: 0, cuerpoZ: 0, pico: 0 };
  if (modo === 'forrajear' || modo === 'picotear' || modo === 'sondear') {
    g.cabezaX = 0.12 + Math.max(0, s) * 0.18; g.cabezaY = s2 * 0.05; g.pico = 1;
  } else if (modo === 'rumiar') {
    g.cabezaX = -0.04 + s * 0.035; g.cabezaY = s2 * 0.08; g.orejaY = s * 0.08;
  } else if (modo === 'acicalar') {
    g.cabezaX = 0.16; g.cabezaY = 0.42 + s * 0.10; g.orejaY = -s2 * 0.10; g.colaY = s * 0.08;
  } else if (modo === 'rascar') {
    g.cabezaX = 0.08; g.cabezaY = -0.30 + s * 0.06; g.cuerpoZ = s2 * 0.025;
  } else if (modo === 'rascarHojarasca') {
    g.cabezaX = 0.34 + s * 0.08; g.cabezaY = s2 * 0.04; g.pico = 0.7;
  } else if (modo === 'olfatear') {
    g.cabezaX = 0.14 + s * 0.05; g.cabezaY = s2 * 0.16; g.orejaY = -s * 0.12;
  } else if (modo === 'vigilar' || modo === 'observar') {
    g.cabezaX = -0.12; g.cabezaY = s * 0.24; g.orejaY = s2 * 0.16; g.colaY = s * 0.05;
  } else if (modo === 'caminar') {
    g.cabezaX = 0.04; g.cabezaY = s * 0.04;
  }
  if (tipo === 'liebre') g.orejaY *= 1.35;
  if (tipo === 'zorro') g.colaY *= 1.6;
  return g;
}
