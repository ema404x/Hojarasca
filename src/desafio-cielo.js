// 2.3: el volador. Con el saltador que pasa por arriba de los muros y el excavador que
// pasa por abajo, faltaba el que viene por el aire. Vuela alto, busca las antorchas
// prendidas y baja en picada a apagarlas; si no queda ninguna, pasa rasante sobre vos.
// Arriba sólo lo alcanzan las flechas, la pistola y la ballesta que apunta al cielo;
// cuando baja, también la lanza. Puro, sin THREE.
export const VOLADOR = {
  // danoObra casi nada: vuela por encima de las obras; lo que rompe son las antorchas
  nombre: 'volador', vida: 48, vel: 6.2, dano: 9, cadencia: 1.3, alcance: 1.8, danoObra: 3,
  radio: 0.45, altura: 1.1, cristales: [1, 2], retroceso: 0.6, vuela: true,
};
export const VUELO = {
  alto: 7.5,          // metros sobre el suelo cuando va de un lado a otro
  bajo: 1.6,          // en la picada, sobre la llama o sobre tu cabeza
  picada: 9,          // a esta distancia horizontal empieza a bajar
  subir: 2.2,         // segundos que tarda en volver a subir después de un golpe
  buscaAntorchas: 70, // hasta dónde ve una antorcha prendida
  alcanceMano: 3.0,   // por debajo de esta altura sobre el suelo, la lanza le llega
};
export const BALLESTA_CIELO = { tipo: 'torreta', cielo: true, alcance: 34, dano: 26, cadencia: 1.4, altura: 3.4 };

// Cuántos voladores por noche: desde la 8, uno cada seis comunes, hasta tres.
export function voladoresEnLaNoche(noche, comunes) {
  return noche >= 8 ? Math.min(3, Math.floor(comunes / 6)) : 0;
}

// Qué busca: la antorcha prendida más cercana a él; si no hay, a vos.
export function blancoVolador(pos, antorchas, jugador) {
  let mejor = null, d0 = VUELO.buscaAntorchas;
  for (const a of antorchas || []) {
    const d = Math.hypot(a.x - pos.x, a.z - pos.z);
    if (d < d0) { d0 = d; mejor = a; }
  }
  return mejor ? { tipo: 'antorcha', x: mejor.x, z: mejor.z, y: mejor.y ?? 0, o: mejor.o ?? mejor } : { tipo: 'jugador', x: jugador.x, z: jugador.z, y: jugador.y ?? 0 };
}

// A qué altura sobre el suelo quiere ir según lo lejos que está del blanco, y si viene
// de pegar (entonces sube). Suave: la picada es una curva, no un escalón.
export function alturaDeseada(distHorizontal, subiendo) {
  if (subiendo > 0) return VUELO.alto;
  if (distHorizontal >= VUELO.picada) return VUELO.alto;
  const k = Math.max(0, distHorizontal / VUELO.picada);
  return VUELO.bajo + (VUELO.alto - VUELO.bajo) * k * k;
}

// ¿Lo alcanza un arma de mano? Sólo si bajó.
export const alAlcanceDeLaMano = (alturaSobreSuelo) => alturaSobreSuelo <= VUELO.alcanceMano;
// ¿La ballesta común lo ve? Sólo si pasa bajo; la del cielo, siempre.
export const loApuntaLaBallesta = (torreta, alturaSobreSuelo) => !!torreta?.cielo || alturaSobreSuelo <= 3.5;
// La ballesta del cielo prefiere voladores: sólo apunta a los de tierra si no hay ninguno.
export function elegirParaTorreta(torreta, candidatos) {
  const vivos = candidatos.filter((c) => c.d < torreta.alcance && loApuntaLaBallesta(torreta, c.alto));
  if (!vivos.length) return null;
  const pool = torreta.cielo && vivos.some((c) => c.vuela) ? vivos.filter((c) => c.vuela) : vivos;
  return pool.reduce((a, b) => (b.d < a.d ? b : a));
}
