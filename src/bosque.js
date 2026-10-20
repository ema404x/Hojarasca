// El bosque vuelve a crecer: cada tocón rebrota solo con el paso de los días, y plantar
// un renoval al lado lo apura. Lógica pura (se prueba en Node); quien dibuja es vegetacion.js.

// Días desde la tala → cuánto del árbol está de vuelta (0 = sólo el tocón, 1 = adulto).
export const ETAPAS_REBROTE = [
  { dias: 2, escala: 0.28, nombre: 'brote' },
  { dias: 4, escala: 0.5, nombre: 'renoval' },
  { dias: 6, escala: 0.74, nombre: 'árbol joven' },
  { dias: 9, escala: 1, nombre: 'árbol' },
];
export const DIAS_REBROTE = ETAPAS_REBROTE[ETAPAS_REBROTE.length - 1].dias;
export const DIAS_QUE_APURA_UN_RENOVAL = 3;

export function escalaRebrote(edad) {
  let esc = 0;
  for (const e of ETAPAS_REBROTE) if (edad >= e.dias) esc = e.escala;
  return esc;
}
export function etapaRebrote(edad) {
  let nombre = 'tocón';
  for (const e of ETAPAS_REBROTE) if (edad >= e.dias) nombre = e.nombre;
  return nombre;
}

// Un registro de tala válido: índice de árbol y día en que cayó.
export function sanearTalados(lista, cantidadArboles = Infinity) {
  if (!Array.isArray(lista)) return [];
  const vistos = new Set();
  const salida = [];
  for (const t of lista) {
    const i = Math.floor(Number(t?.i));
    const dia = Math.floor(Number(t?.dia));
    if (!Number.isFinite(i) || i < 0 || i >= cantidadArboles || vistos.has(i)) continue;
    if (!Number.isFinite(dia)) continue;
    vistos.add(i);
    salida.push({
      i, dia,
      esc: Number.isFinite(Number(t?.esc)) ? Number(t.esc) : -1,
      // Un tocón se apura una sola vez: el dato viaja en la partida.
      apurado: !!t?.apurado,
    });
  }
  return salida;
}

// 4.4.2 (C4): los pedreros y los troncos caídos que picaste o cortaste no vuelven al recargar (antes sólo se recordaban los árboles
// talados: la roca volvía y daba piedra y experiencia otra vez). Se guardan sus posiciones, planas: [x, z, x, z, …] con un decimal. A
// diferencia de los árboles no rebrotan: una roca no vuelve a crecer. Tope: las más viejas se olvidan.
export const PICADOS_MAX = 1500;
export function sanearPicados(lista) {
  if (!Array.isArray(lista)) return [];
  const vistos = new Set(), salida = [];
  for (let k = 0; k + 1 < lista.length; k += 2) {
    const x = Number(lista[k]), z = Number(lista[k + 1]);
    if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 5000 || Math.abs(z) > 5000) continue;
    const rx = Math.round(x * 10) / 10, rz = Math.round(z * 10) / 10, clave = rx + ',' + rz;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(rx, rz);
  }
  return salida.length > PICADOS_MAX * 2 ? salida.slice(salida.length - PICADOS_MAX * 2) : salida;
}
// Anota una posición en la lista (sin repetir); devuelve la lista (la misma, recortada si se pasó del tope)
export function anotarPicadoEn(lista, x, z) {
  if (!Array.isArray(lista) || !Number.isFinite(x) || !Number.isFinite(z)) return lista;
  const rx = Math.round(x * 10) / 10, rz = Math.round(z * 10) / 10;
  for (let k = 0; k + 1 < lista.length; k += 2) if (lista[k] === rx && lista[k + 1] === rz) return lista;
  lista.push(rx, rz);
  if (lista.length > PICADOS_MAX * 2) lista.splice(0, lista.length - PICADOS_MAX * 2);
  return lista;
}

// Devuelve qué árboles cambiaron de etapa y cuáles ya volvieron a ser adultos.
export function avanzarRebrote(talados, dia) {
  const cambios = [], adultos = [], quedan = [];
  for (const t of talados) {
    const esc = escalaRebrote(dia - t.dia);
    if (esc !== t.esc) { t.esc = esc; cambios.push({ i: t.i, esc }); }
    if (esc >= 1) adultos.push(t.i); else quedan.push(t);
  }
  return { cambios, adultos, quedan };
}

// Plantar un renoval junto a un tocón le saca días de encima, pero una sola vez:
// si no, con semillas de sobra se vuelve adulto al instante. Los tocones ya apurados
// quedan afuera de la búsqueda, así que plantar en un rodal ayuda al de al lado.
export function apurarRebrote(talados, posicionDe, x, z, radio = 5, dias = DIAS_QUE_APURA_UN_RENOVAL) {
  let mejor = null, d0 = radio;
  for (const t of talados) {
    if (t.apurado) continue;
    const p = posicionDe(t.i);
    if (!p) continue;
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < d0) { d0 = d; mejor = t; }
  }
  if (mejor) { mejor.dia -= dias; mejor.apurado = true; }
  return mejor;
}

export function resumenBosque(talados, dia) {
  const rebrotando = talados.length;
  const listos = talados.filter((t) => dia - t.dia >= DIAS_REBROTE).length;
  return { rebrotando, listos };
}
