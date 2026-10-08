// Modo Desafío: el primer día guiado. Una lista corta de pasos que se tildan
// solos al hacerlos; se puede ignorar y desaparece después de la primera noche.
// Lógica pura (se prueba en Node) + un dibujo simple sobre un contenedor del HUD.

export const PASOS_TUTORIAL = [
  // Se arranca con 6 troncos y 6 tablas: talar un árbol (+4) y aserrar dos (+4) llegan a 10
  { id: 'troncos', texto: 'Talá un árbol: H tres veces junto a un coihue o una lenga', tecla: 'H', hecho: (s) => s.tronco >= 10 || s.lanza || s.defensas > 0 },
  { id: 'tablas', texto: 'Aserrá tablas: Y convierte un tronco en dos (juntá 10)', tecla: 'Y', hecho: (s) => (s.tabla || 0) >= 10 || s.lanza || s.defensas > 0 },
  { id: 'lanza', texto: 'Fabricá una lanza: K → Armas', tecla: 'K', hecho: (s) => s.lanza },
  { id: 'empalizada', texto: 'Levantá dos tramos de empalizada: O → Defensa', tecla: 'O', hecho: (s) => (s.cuenta.empalizada || 0) >= 2 },
  { id: 'porton', texto: 'Sumá un portón para entrar y salir de tu fuerte', tecla: 'O', hecho: (s) => (s.cuenta['porton-empalizada'] || 0) >= 1 },
  { id: 'antorcha', texto: 'Poné una antorcha de guardia: de noche vas a necesitar luz', tecla: 'O', hecho: (s) => (s.cuenta.antorcha || 0) >= 1 },
  { id: 'noche', texto: 'Esperá a los duendes con la lanza en la mano (clic izquierdo ataca)', tecla: '1', hecho: (s) => s.oleadas >= 1 },
];
export const PREMIO_TUTORIAL = { emplastos: 1, tabla: 4, piedra: 4 };

// Avanza tantos pasos como estén cumplidos. Devuelve los ids recién completados.
export function avanzarTutorial(indice, estado) {
  const hechos = [];
  let i = Math.max(0, Math.floor(indice) || 0);
  while (i < PASOS_TUTORIAL.length && PASOS_TUTORIAL[i].hecho(estado)) { hechos.push(PASOS_TUTORIAL[i].id); i++; }
  return { indice: i, hechos, terminado: i >= PASOS_TUTORIAL.length };
}

export function dibujarTutorial(contenedor, indice) {
  if (!contenedor) return;
  const doc = contenedor.ownerDocument || document;
  contenedor.innerHTML = '';
  const titulo = doc.createElement('b');
  titulo.textContent = 'Primer día · preparate';
  contenedor.appendChild(titulo);
  PASOS_TUTORIAL.forEach((p, i) => {
    const fila = doc.createElement('p');
    fila.className = i < indice ? 'hecho' : i === indice ? 'actual' : '';
    const k = doc.createElement('kbd');
    k.textContent = i < indice ? '✓' : p.tecla;
    fila.append(k, doc.createTextNode(p.texto));
    contenedor.appendChild(fila);
  });
}
