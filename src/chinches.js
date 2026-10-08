// Chinches del mapa: las marcas que pone el jugador donde quiere volver, y el rumbo
// que la brújula sigue hasta la que esté elegida. Lógica pura (se prueba en Node).

import { LIMITE } from './config.js';

export const MAX_CHINCHES = 12;
export const RADIO_CHINCHE = 22;      // metros: qué tan cerca hay que tocar para agarrarla

export function sanearChinches(lista) {
  if (!Array.isArray(lista)) return [];
  const salida = [];
  for (const c of lista) {
    const x = Number(c?.x), z = Number(c?.z);
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
    if (Math.abs(x) > LIMITE || Math.abs(z) > LIMITE) continue;
    const nombre = String(c?.nombre ?? '').trim().slice(0, 24) || 'Chinche';
    salida.push({ x, z, nombre });
    if (salida.length >= MAX_CHINCHES) break;
  }
  return salida;
}

export function nombreLibre(lista, base = 'Chinche') {
  const usados = new Set(lista.map((c) => c.nombre));
  for (let i = 1; i <= MAX_CHINCHES + 1; i++) {
    const n = `${base} ${i}`;
    if (!usados.has(n)) return n;
  }
  return base;
}

// Devuelve la lista nueva y qué pasó: 'puesta' o 'llena'.
export function ponerChinche(lista, x, z, nombre) {
  if (lista.length >= MAX_CHINCHES) return { lista, estado: 'llena' };
  const c = { x, z, nombre: String(nombre ?? '').trim().slice(0, 24) || nombreLibre(lista) };
  return { lista: [...lista, c], estado: 'puesta', chinche: c };
}

export function chincheCerca(lista, x, z, radio = RADIO_CHINCHE) {
  let mejor = null, d0 = radio;
  for (const c of lista) {
    const d = Math.hypot(c.x - x, c.z - z);
    if (d < d0) { d0 = d; mejor = c; }
  }
  return mejor;
}

export function sacarChinche(lista, chinche) {
  return lista.filter((c) => c !== chinche);
}

// Rumbo y distancia hasta un punto: lo que necesita la brújula.
export function rumboHacia(pos, objetivo, yaw) {
  if (!objetivo) return null;
  const dx = objetivo.x - pos.x, dz = objetivo.z - pos.z;
  const dist = Math.hypot(dx, dz);
  let ang = Math.atan2(-dx, -dz) - yaw;
  ang = Math.atan2(Math.sin(ang), Math.cos(ang));
  return { dist, ang, atras: Math.abs(ang) > Math.PI / 2 };
}

export function textoDistancia(m) {
  if (!Number.isFinite(m)) return '';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

// Las marcas que el juego pone solo (la caja del alba, la cápsula, los restos).
export function marcasAutomaticas({ desafio, lugares } = {}) {
  const marcas = [];
  const sumar = (p, nombre, clase) => {
    if (!p || !Number.isFinite(Number(p.x)) || !Number.isFinite(Number(p.z))) return;
    marcas.push({ x: Number(p.x), z: Number(p.z), nombre, clase });
  };
  if (desafio) {
    sumar(desafio.caja, 'cofre del alba', 'caja');
    sumar(desafio.capsula, 'cofre de los duendes', 'capsula');
    sumar(desafio.restos, 'tronco hueco', 'restos');
    // 3.0: el asedio: las agujas, las balizas y la nave asentada
    for (const m of desafio.asedio?.marcas?.() || []) sumar(m, m.nombre, 'asedio');
    // El nido, una vez ubicado. Mientras se lo busca va el cerco, que lleva radio.
    const n = desafio.nido;
    if (n && !n.caido) {
      if (n.revelado) sumar(n, 'la cueva', 'nido');
      else if (Number.isFinite(Number(n.radio)) && Number(n.radio) > 0) {
        marcas.push({ x: Number(n.x), z: Number(n.z), nombre: 'la cueva anda por acá', clase: 'cerco', radio: Number(n.radio) });
      }
    }
    // 3.0: los puestos de avanzada que ya viste y siguen en pie
    if (Array.isArray(desafio.puestos)) for (const p of desafio.puestos) sumar(p, 'madriguera de duendes', 'puesto');
    // 3.0: el mapa de la semilla: tu base, la cantera, los cristales, la leña y los alijos
    if (Array.isArray(desafio.sitiosMapa)) for (const s of desafio.sitiosMapa) sumar(s, s.nombre, s.clase);
  }
  if (lugares?.galpon) sumar(lugares.galpon, 'galpón de esquila', 'lugar');
  return marcas;
}
