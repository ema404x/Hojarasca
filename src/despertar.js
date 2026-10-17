// 4.0.3 (II-3): el lugar donde despertás después de caer en el Desafío. Antes era siempre 1,1 m «adelante» del catre, sin mirar si ahí había lugar: en un cuarto
// de 3 × 3 con paredes finas, si ese lado del catre quedaba a menos de ~1,5 m de una pared el punto caía en la pared o del otro lado (cerca del 30 % de las
// colocaciones). Ahora se prueban varios lados (el de siempre primero) y se queda el primero con lugar y sin paredes en el medio.
// Puro: recibe las colisiones (`col`) ya hechas, así se prueba en Node con las de verdad.

const RADIO = 0.35, ALTO = 1.65;

// ¿hay lugar de pie en (x, z)? Las colisiones lo empujan si pisa algo.
export function hayLugar(col, x, z, y, radio = RADIO) {
  const q = { x, y, z };
  col.resolver(q, radio, ALTO);
  col.resolverPlataformas?.(q, radio, ALTO, 0.62);
  return Math.hypot(q.x - x, q.z - z) < 0.005;   // (ni un empujoncito: una pared fina empuja de a poco)
}
// ¿se llega de (x0, z0) a (x1, z1) sin cruzar nada? Las paredes finas no las ve `paredEntre`: se camina el tramo de a 4 cm con un cuerpo finito (una pared
// modular mide 17 cm de grueso), que la empuja aunque no cuente para frenar a un cuerpo entero.
function tramoLibre(col, x0, z0, x1, z1, y) {
  const d = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.ceil(d / 0.04));
  // el arranque está pegado al mueble (ahí no hay lugar): sólo cuenta lo que pasa desde que se sale de él
  let salio = false;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const libre = hayLugar(col, x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, y, 0.03);
    if (libre) salio = true;
    else if (salio) return false;
  }
  return !col.paredEntre?.(x0, z0, x1, z1, y + 0.2, y + ALTO - 0.1, false);
}
// Los lugares a probar alrededor del catre, en orden: adelante (como siempre), los costados y atrás, y lo mismo más cerca y más lejos (con las diagonales).
export function candidatosAlrededor(x, z, yaw) {
  const lista = [];
  for (const dist of [1.1, 0.85, 1.5, 1.9, 2.3]) {
    for (const giro of [0, Math.PI / 2, -Math.PI / 2, Math.PI, Math.PI / 4, -Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4]) {
      const a = yaw + giro;
      lista.push({ x: x + Math.sin(a) * dist, z: z + Math.cos(a) * dist, yaw: a });
    }
  }
  return lista;
}
// La huella (piso o refugio terminado) que contiene el punto, como una función «¿este punto está dentro de la misma huella?» (con un margen de 25 cm
// del borde), o null si el punto no está en ninguna. Las paredes finas de un cuarto armado con piezas no frenan una línea recta, y si el catre está pegado
// a una pared el otro lado también «tiene lugar»: la huella dice de qué lado de la pared está el cuarto.
export function huellaQueContiene(obras, x, z) {
  for (const o of obras || []) {
    const P = o.plano, tipo = P?.snap?.tipo;
    if (!P || !(tipo === 'piso' || P.habitable) || o.datos.etapas < P.etapas.length) continue;
    const rot = o.datos.rot || 0, c = Math.cos(rot), s = Math.sin(rot);
    const medio = (px, pz) => { const dx = px - o.datos.x, dz = pz - o.datos.z; return { lx: dx * c - dz * s, lz: dx * s + dz * c }; };
    const a = (P.ancho || 3) / 2, f = (P.fondo || 3) / 2;
    const { lx, lz } = medio(x, z);
    if (Math.abs(lx) < a && Math.abs(lz) < f) return (px, pz) => { const m = medio(px, pz); return Math.abs(m.lx) < a - 0.25 && Math.abs(m.lz) < f - 0.25; };
  }
  return null;
}
// Devuelve { x, z, yaw, y } con lugar junto al catre (x, z, yaw, y); `dentroDe` (opcional, ver huellaQueContiene) pide quedar en el mismo cuarto. Si no hay
// ninguno, primero sin esa exigencia y, si tampoco, el de siempre.
export function puntoLibreJuntoA(col, x, z, yaw, y, dentroDe = null) {
  const lista = candidatosAlrededor(x, z, yaw || 0);
  for (const exigir of dentroDe ? [true, false] : [false]) {
    for (const c of lista) {
      if (exigir && !dentroDe(c.x, c.z)) continue;
      if (hayLugar(col, c.x, c.z, y) && tramoLibre(col, x, z, c.x, c.z, y)) return { x: c.x, z: c.z, yaw: c.yaw, y };
    }
    // un cuarto chico con la cama grande: cualquier lugar libre de ese cuarto, el más cercano a la cama
    if (exigir) {
      let mejor = null, d0 = Infinity;
      for (let dx = -3; dx <= 3; dx += 0.15) for (let dz = -3; dz <= 3; dz += 0.15) {
        const px = x + dx, pz = z + dz, d = Math.hypot(dx, dz);
        if (d >= d0 || d < 0.5 || !dentroDe(px, pz) || !hayLugar(col, px, pz, y)) continue;
        d0 = d; mejor = { x: px, z: pz, yaw: Math.atan2(x - px, z - pz), y };
      }
      if (mejor) return mejor;
    }
  }
  const c = lista[0];
  return { x: c.x, z: c.z, yaw: yaw || 0, y };
}
