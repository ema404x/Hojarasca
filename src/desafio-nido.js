// Modo Desafío, segundo acto: el nido.
//
// La nodriza cae la noche 20 y el Desafío se da por ganado, pero los invasores
// siguen bajando. El juego ya venía diciendo de dónde salen —su jefe se llama
// "jefe de nido"— sin mostrarlo nunca. Acá está: en algún lado del valle hay un
// nido enterrado, y mientras siga entero la noche no se termina.
//
// Dos cosas lo hacen distinto de todo lo demás del modo:
//  - Se busca de día, acotando el cerco con lo que dejan los restos de nave.
//  - Se rompe de día. De noche el caparazón está cerrado y no le entra nada:
//    el jugador pasa de aguantar a atacar, que es lo que le faltaba al modo.
//
// Módulo puro (se prueba en Node, sin three ni DOM).

import { LIMITE } from './config.js';
import { siguenDespues } from './desafio-noche2.js';

export const NIDO = {
  camaras: 3,              // cámaras de cría: se revientan de a una
  vidaCamara: 800,         // lo que aguanta cada una
  pistas: 3,               // cuántas pistas hacen falta para tenerlo en el mapa
  // Cada pista cierra el cerco. La última es el lugar exacto.
  radios: [560, 300, 130, 0],
  distanciaMinima: 260,    // nunca pega a la base: hay que caminar hasta él
  horaAbre: 7.5,           // con el sol arriba el caparazón se abre
  horaCierra: 19.5,        // y al caer la tarde se vuelve a cerrar
  cristales: [30, 44],     // lo que suelta al caer
};

export const VIDA_NIDO = NIDO.camaras * NIDO.vidaCamara;

// ---------------------------------------------------------------- estado
export function nidoNuevo(pos) {
  const x = Number(pos?.x), z = Number(pos?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  return {
    x, z,
    pistas: 0,
    // Centro del cerco que se dibuja en el mapa: arranca corrido del nido y se
    // va acomodando con cada pista, así el primer círculo no lo regala.
    cercoX: x, cercoZ: z,
    camaras: new Array(NIDO.camaras).fill(NIDO.vidaCamara),
    caido: false,
  };
}

const acotar = (v, min, max) => (v < min ? min : v > max ? max : v);
const num = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

export function sanearNido(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const x = Number(v.x), z = Number(v.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  const camaras = Array.isArray(v.camaras) ? v.camaras : [];
  return {
    x: acotar(x, -LIMITE, LIMITE),
    z: acotar(z, -LIMITE, LIMITE),
    pistas: acotar(Math.floor(num(v.pistas, 0)), 0, NIDO.pistas),
    cercoX: acotar(num(v.cercoX, x), -LIMITE, LIMITE),
    cercoZ: acotar(num(v.cercoZ, z), -LIMITE, LIMITE),
    camaras: new Array(NIDO.camaras).fill(0).map((_, i) => acotar(Math.round(num(camaras[i], NIDO.vidaCamara)), 0, NIDO.vidaCamara)),
    caido: !!v.caido,
  };
}

// ---------------------------------------------------------------- la búsqueda
// Cada resto de nave que explorás después de la victoria acota el cerco. El
// círculo siempre contiene al nido: se achica alrededor, nunca lo deja afuera.
export function radioCerco(nido) {
  if (!nido) return 0;
  return NIDO.radios[Math.min(NIDO.radios.length - 1, nido.pistas)] ?? 0;
}
export function estaRevelado(nido) {
  return !!nido && nido.pistas >= NIDO.pistas;
}
// El círculo que se dibuja en el mapa mientras no esté ubicado del todo.
export function cercoDeBusqueda(nido) {
  if (!nido || estaRevelado(nido)) return null;
  return { x: nido.cercoX, z: nido.cercoZ, radio: radioCerco(nido) };
}

// Suma una pista y vuelve a centrar el cerco. `azar` entra por parámetro para
// que la prueba pueda fijarlo.
export function sumarPista(nido, azar = Math.random()) {
  if (!nido || estaRevelado(nido)) return { nido, nueva: false };
  nido.pistas = Math.min(NIDO.pistas, nido.pistas + 1);
  const r = radioCerco(nido);
  if (r <= 0) { nido.cercoX = nido.x; nido.cercoZ = nido.z; }
  else {
    // el centro se corre al azar dentro del nuevo radio, pero sin sacar al nido
    const a = azar * Math.PI * 2, d = r * 0.35;
    nido.cercoX = acotar(nido.x + Math.cos(a) * d, -LIMITE, LIMITE);
    nido.cercoZ = acotar(nido.z + Math.sin(a) * d, -LIMITE, LIMITE);
  }
  return { nido, nueva: true, pistas: nido.pistas, revelado: estaRevelado(nido) };
}

// Lo que se le dice al jugador cuando suma una pista.
export function textoPista(nido) {
  if (!nido) return '';
  if (estaRevelado(nido)) return 'La cueva quedó marcada en el mapa. Buscala de día: de noche no le entra nada.';
  const faltan = NIDO.pistas - nido.pistas;
  return `El cerco se achica a ${Math.round(radioCerco(nido))} metros. ${faltan === 1 ? 'Falta una pista más' : `Faltan ${faltan} pistas`}.`;
}

// ---------------------------------------------------------------- romperlo
// De noche el caparazón está cerrado: no le entra nada y conviene estar en la base.
export function estaAbierto(horas) {
  const h = ((num(horas, 0) % 24) + 24) % 24;
  return h >= NIDO.horaAbre && h < NIDO.horaCierra;
}
export function vidaNido(nido) {
  return nido ? nido.camaras.reduce((s, v) => s + v, 0) : 0;
}
export function camarasEnteras(nido) {
  return nido ? nido.camaras.filter((v) => v > 0).length : 0;
}

// Reparte el daño en la primera cámara que siga entera: se revientan de a una,
// y cada una que cae se nota.
export function danarNido(nido, dano, horas) {
  if (!nido || nido.caido) return { ok: false, motivo: 'caido' };
  if (!estaAbierto(horas)) return { ok: false, motivo: 'cerrado' };
  const d = Math.max(0, num(dano, 0));
  if (!d) return { ok: false, motivo: 'sindano' };
  const i = nido.camaras.findIndex((v) => v > 0);
  if (i < 0) return { ok: false, motivo: 'caido' };
  const antes = nido.camaras[i];
  nido.camaras[i] = Math.max(0, antes - d);
  const rota = antes > 0 && nido.camaras[i] === 0;
  const caido = nido.camaras.every((v) => v <= 0);
  if (caido) nido.caido = true;
  return { ok: true, camara: i, rota, caido, vida: vidaNido(nido) };
}

// ---------------------------------------------------------------- lo que se muestra
export function resumenNido(nido, horas) {
  if (!nido) return null;
  if (nido.caido) return { texto: 'Se derrumbó la cueva', caido: true, fraccion: 0 };
  const fraccion = vidaNido(nido) / VIDA_NIDO;
  if (!estaRevelado(nido)) {
    return { texto: `Cueva sin ubicar · cerco de ${Math.round(radioCerco(nido))} m`, fraccion, buscando: true };
  }
  const enteras = camarasEnteras(nido);
  const abierto = estaAbierto(horas);
  return {
    fraccion, abierto, enteras,
    texto: abierto
      ? `Cueva abierta · ${enteras} ${enteras === 1 ? 'cuna' : 'cunas'} en pie`
      : 'Cueva cerrada · esperá a que salga el sol',
  };
}

// Mientras el nido esté entero las noches siguen; cuando cae, se terminan.
export function siguenLasNoches(d) {
  if (!d?.victoria) return true;
  // 2.0: con el nido caído, las noches siguen sólo si elegiste las noches después
  if (siguenDespues(d.despues)) return true;
  return !d.nido || !d.nido.caido;
}

// El Desafío terminado del todo: la nodriza abajo y el nido reventado.
export function desafioTerminado(d) {
  return !!d?.victoria && !!d?.nido?.caido;
}

// Dónde ponerlo: lejos de la base, en tierra firme y dentro del mapa.
// `sitio(x, z)` dice si ese punto sirve (tierra, pendiente suave); `azar` se inyecta.
export function lugarDelNido(centro, sitio, azar = Math.random) {
  const cx = num(centro?.x, 0), cz = num(centro?.z, 0);
  for (let i = 0; i < 80; i++) {
    const a = azar() * Math.PI * 2;
    const r = NIDO.distanciaMinima + azar() * 220;
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    if (Math.abs(x) > LIMITE - 60 || Math.abs(z) > LIMITE - 60) continue;
    if (typeof sitio === 'function' && !sitio(x, z)) continue;
    return { x, z };
  }
  return null;
}
