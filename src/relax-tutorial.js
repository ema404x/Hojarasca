// Relax: el primer día con rumbo. Una lista corta y suave que se tilda sola y se
// puede apagar desde los ajustes; no obliga a nada, sólo muestra por dónde empezar.
// Lógica pura (se prueba en Node) + un dibujo simple sobre un contenedor del HUD.

export const PASOS_RELAX = [
  { id: 'ramitas', texto: 'Juntá tres ramitas del suelo (E)', tecla: 'E', hecho: (s) => s.ramitas >= 3 || s.fuego },
  { id: 'fuego', texto: 'Encendé una fogata en un claro (F)', tecla: 'F', hecho: (s) => s.fuego },
  { id: 'anotar', texto: 'Anotá dos cosas en el cuaderno: plantas, aves, lugares (E)', tecla: 'E', hecho: (s) => s.anotaciones >= 2 },
  // 3.6: el hacha está en el almacén de la Aldea de los Duendes: el primer viaje en la trochita
  { id: 'madera', texto: 'Con el hacha del almacén de la aldea (en la trochita), talá un árbol: tres golpes (H)', tecla: 'H', hecho: (s) => s.troncos >= 4 || s.tablas >= 2 },
  { id: 'tablas', texto: 'Aserrá un tronco en tablas (Y)', tecla: 'Y', hecho: (s) => s.tablas >= 2 },
  { id: 'techo', texto: 'Abrí los planos y marcá dónde va tu refugio (O)', tecla: 'O', hecho: (s) => s.obras >= 1 },
];

export const PREMIO_RELAX = { ramitas: 4, materiales: { tabla: 4 } };

// Avanza tantos pasos como estén cumplidos. Devuelve los ids recién completados.
export function avanzarRelax(indice, estado) {
  const hechos = [];
  let i = Math.max(0, Math.floor(Number(indice)) || 0);
  while (i < PASOS_RELAX.length && PASOS_RELAX[i].hecho(estado)) { hechos.push(PASOS_RELAX[i].id); i++; }
  return { indice: i, hechos, terminado: i >= PASOS_RELAX.length };
}

export function dibujarPasos(contenedor, pasos, indice, titulo) {
  if (!contenedor) return;
  const doc = contenedor.ownerDocument || document;
  contenedor.innerHTML = '';
  const t = doc.createElement('b');
  t.textContent = titulo;
  contenedor.appendChild(t);
  pasos.forEach((p, i) => {
    const fila = doc.createElement('p');
    fila.className = i < indice ? 'hecho' : i === indice ? 'actual' : '';
    const k = doc.createElement('kbd');
    k.textContent = i < indice ? '✓' : p.tecla;
    fila.append(k, doc.createTextNode(p.texto));
    contenedor.appendChild(fila);
  });
}
