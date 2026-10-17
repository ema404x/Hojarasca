// 4.0.3: navegar las pantallas con el mando (portada, creador de Bruno, prólogo, pausa, ajustes, cuaderno...). Lo puro vive acá y se prueba
// en Node; lo que toca el DOM (enfocar, clic) está en main.js (`navegarMando`). Los rectángulos son { x, y, w, h } en píxeles de pantalla.

const centro = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

// Qué elemento sigue al `actual` yendo hacia `dir` ('arriba' | 'abajo' | 'izq' | 'der'). Devuelve su índice.
//  · sin nada marcado: el primero;
//  · hacia arriba o abajo, si no queda nada más allá se da la vuelta (el último de abajo pasa al primero de arriba);
//  · hacia los costados, si no hay nadie en esa dirección se queda donde está.
export function elegirVecino(rects, actual, dir) {
  const n = rects.length;
  if (!n) return -1;
  if (!(actual >= 0 && actual < n)) return 0;
  const a = rects[actual], ca = centro(a);
  // los candidatos de ese lado, con la distancia a lo largo del movimiento y la desviación al costado
  const cand = [];
  for (let i = 0; i < n; i++) {
    if (i === actual) continue;
    const r = rects[i], c = centro(r);
    const dx = c.x - ca.x, dy = c.y - ca.y;
    let principal, lateral, minimo;
    if (dir === 'abajo') { principal = dy; lateral = Math.abs(dx); minimo = (a.h + r.h) * 0.3; }
    else if (dir === 'arriba') { principal = -dy; lateral = Math.abs(dx); minimo = (a.h + r.h) * 0.3; }
    else if (dir === 'der') { principal = dx; lateral = Math.abs(dy); minimo = (a.w + r.w) * 0.3; }
    else { principal = -dx; lateral = Math.abs(dy); minimo = (a.w + r.w) * 0.3; }
    if (principal > minimo) cand.push({ i, principal, lateral, tam: dir === 'abajo' || dir === 'arriba' ? r.h : r.w });
  }
  // primero la fila (o la columna) más cercana, y adentro de ella el que queda más en línea
  let mejor = -1;
  if (cand.length) {
    const cerca = Math.min(...cand.map((x) => x.principal));
    const tol = Math.max(...cand.map((x) => x.tam)) * 0.6;
    let lat = Infinity;
    for (const x of cand) if (x.principal <= cerca + tol && x.lateral < lat) { lat = x.lateral; mejor = x.i; }
  }
  if (mejor >= 0) return mejor;
  if (dir === 'abajo' || dir === 'arriba') {
    // dar la vuelta: el más alto (o el más bajo) y, entre los de su fila, el más cercano en horizontal
    let extremo = -1, valor = dir === 'abajo' ? Infinity : -Infinity;
    for (let i = 0; i < n; i++) {
      const c = centro(rects[i]);
      if (dir === 'abajo' ? c.y < valor - 1 : c.y > valor + 1) { valor = c.y; extremo = i; }
    }
    if (extremo < 0 || extremo === actual) return actual;
    let elegido = extremo, mejorDx = Infinity;
    for (let i = 0; i < n; i++) {
      const c = centro(rects[i]);
      if (Math.abs(c.y - valor) <= Math.max(2, rects[extremo].h * 0.3) && Math.abs(c.x - ca.x) < mejorDx) { mejorDx = Math.abs(c.x - ca.x); elegido = i; }
    }
    return elegido;
  }
  return actual;
}

// El valor nuevo de una barra al apretar izquierda o derecha: un veinteavo del recorrido (o el paso de la barra, si es mayor).
export function pasoDeBarra(valor, min, max, paso, sentido) {
  const lo = Number.isFinite(min) ? min : 0, hi = Number.isFinite(max) ? max : 100;
  const st = Number.isFinite(paso) && paso > 0 ? paso : 1;
  const salto = Math.max(st, Math.round(((hi - lo) / 20) / st) * st);
  const v = (Number.isFinite(valor) ? valor : lo) + (sentido < 0 ? -salto : salto);
  const acotado = Math.min(hi, Math.max(lo, v));
  // a la grilla del paso
  return Math.min(hi, Math.max(lo, lo + Math.round((acotado - lo) / st) * st));
}

// Qué dirección es cada botón de la cruceta (los nombres de las acciones del mando: ver mando.js)
export function direccionDeCruceta(recien) {
  if (recien.mochila) return 'arriba';
  if (recien.taller) return 'abajo';
  if (recien.planos) return 'izq';
  if (recien.mapa) return 'der';
  return null;
}

export const AYUDA_MANDO_MENU = 'Cruceta: moverse · A: elegir · B: volver · Start: salir';
