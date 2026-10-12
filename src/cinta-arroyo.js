// 3.8.8: la cinta del agua del arroyo, sin THREE (para probarla en Node). Antes era una sola tira con un par de vértices por punto
// del cauce, abierta `w + 1,2` m a cada lado: donde el cauce da una vuelta cerrada (radio de giro menor que el ancho: pasa en 16
// puntos, con vueltas en zigzag de 2 a 5 m de radio y 5,5 a 7,5 m de semiancho) el lado de adentro se cruzaba, los triángulos
// quedaban de espaldas y se descartaban: el agua se veía a trozos. Además, en el salto de agua se salteaban DOS tramos (el
// escalón y el primero de la poza de abajo), y quedaba un agujero seco a los pies de la cascada.
// Ahora cada tramo es su propio rectángulo (con su propia normal, sin tocar al vecino) y en las vueltas se tapa el hueco de
// afuera con un abanico redondo: el agua cubre lo mismo que el cauce del terreno (la distancia a la poligonal).
const SEMI_EXTRA = 1.2;   // lo que la cinta se abre más allá del ancho del cauce (el terreno la recorta)
const PIE_SALTO = 0.6;   // el agua de la poza empieza a esta distancia del labio: justo después del corte del terreno (la cortina cae sobre ella)
const PASO_ABANICO = 0.35;   // radianes por triángulo del abanico de una vuelta

// `rio`: [{ x, z, s, w }]. `saltoI`: el índice del salto de agua (el tramo del escalón no se dibuja: lo hace la cortina) o -1.
// Devuelve { pos, flujo, cauce, ind } (arreglos planos).
export function construirCintaArroyo(rio, saltoI = -1) {
  const pos = [], flujo = [], cauce = [], ind = [];
  const n = rio.length;
  const velDe = (i) => 0.6 + Math.min(2.5, (i > 0 ? Math.max(0, rio[i - 1].s - rio[i].s) : 0) * 3);
  const largoA = new Float64Array(n);
  for (let i = 1; i < n; i++) largoA[i] = largoA[i - 1] + Math.hypot(rio[i].x - rio[i - 1].x, rio[i].z - rio[i - 1].z);
  const semi = (i) => rio[i].w + SEMI_EXTRA;
  const alto = (i) => rio[i].s - 0.08;
  const dirDe = (i) => {   // el tramo i → i+1
    const dx = rio[i + 1].x - rio[i].x, dz = rio[i + 1].z - rio[i].z, l = Math.hypot(dx, dz);
    return l > 1e-6 ? [dx / l, dz / l] : null;
  };
  const vert = (x, y, z, fx, fz, largo, lado) => { const k = pos.length / 3; pos.push(x, y, z); flujo.push(fx, fz); cauce.push(largo, lado); return k; };
  // un triángulo siempre mirando para arriba
  const tri = (a, b, c) => {
    const ax = pos[b * 3] - pos[a * 3], az = pos[b * 3 + 2] - pos[a * 3 + 2], bx = pos[c * 3] - pos[a * 3], bz = pos[c * 3 + 2] - pos[a * 3 + 2];
    if (az * bx - ax * bz >= 0) ind.push(a, b, c); else ind.push(a, c, b);
  };
  const dirs = new Array(n).fill(null);
  for (let i = 0; i < n - 1; i++) if (i !== saltoI) dirs[i] = dirDe(i);
  for (let i = 0; i < n - 1; i++) {
    const d = dirs[i];
    if (!d) continue;
    const nx = -d[1], nz = d[0];
    const wa = semi(i), wb = semi(i + 1), va = velDe(i), vb = velDe(i + 1);
    const a1 = vert(rio[i].x + nx * wa, alto(i), rio[i].z + nz * wa, d[0] * va, d[1] * va, largoA[i], wa);
    const a2 = vert(rio[i].x - nx * wa, alto(i), rio[i].z - nz * wa, d[0] * va, d[1] * va, largoA[i], -wa);
    const b1 = vert(rio[i + 1].x + nx * wb, alto(i + 1), rio[i + 1].z + nz * wb, d[0] * vb, d[1] * vb, largoA[i + 1], wb);
    const b2 = vert(rio[i + 1].x - nx * wb, alto(i + 1), rio[i + 1].z - nz * wb, d[0] * vb, d[1] * vb, largoA[i + 1], -wb);
    tri(a1, b1, a2); tri(a2, b1, b2);
  }
  // la poza al pie del salto: desde la base de la cortina (a `PIE_SALTO` m aguas abajo del labio) hasta el primer punto de abajo, a su
  // nivel (antes quedaba un tramo de lecho seco entre la caída y el agua)
  if (saltoI >= 0 && saltoI < n - 1) {
    const d = dirDe(saltoI);
    if (d) {
      const nx = -d[1], nz = d[0], i = saltoI, j = saltoI + 1;
      const largoPoza = Math.hypot(rio[j].x - rio[i].x, rio[j].z - rio[i].z);
      const k0 = Math.min(PIE_SALTO, largoPoza * 0.9), x0 = rio[i].x + d[0] * k0, z0 = rio[i].z + d[1] * k0;
      const wa = semi(i), wb = semi(j), vb = velDe(j), y = alto(j);
      const a1 = vert(x0 + nx * wa, y, z0 + nz * wa, d[0] * vb, d[1] * vb, largoA[i] + k0, wa);
      const a2 = vert(x0 - nx * wa, y, z0 - nz * wa, d[0] * vb, d[1] * vb, largoA[i] + k0, -wa);
      const b1 = vert(rio[j].x + nx * wb, y, rio[j].z + nz * wb, d[0] * vb, d[1] * vb, largoA[j], wb);
      const b2 = vert(rio[j].x - nx * wb, y, rio[j].z - nz * wb, d[0] * vb, d[1] * vb, largoA[j], -wb);
      tri(a1, b1, a2); tri(a2, b1, b2);
    }
  }
  // las vueltas: en el punto i, entre el tramo i-1 y el i, el abanico del lado de afuera
  for (let i = 1; i < n - 1; i++) {
    const d0 = dirs[i - 1], d1 = dirs[i];
    if (!d0 || !d1) continue;
    const giro = Math.atan2(d0[0] * d1[1] - d0[1] * d1[0], d0[0] * d1[0] + d0[1] * d1[1]);   // + = el cauce gira hacia el lado de la normal (-dz, dx)
    if (Math.abs(giro) < 0.02) continue;
    const lado = giro > 0 ? -1 : 1;   // el lado de afuera: el contrario al que gira
    const w = semi(i), v = velDe(i);
    const a0 = Math.atan2(lado * d0[0], -lado * d0[1]);   // el ángulo (en x, z) de la normal de afuera del tramo anterior
    const centro = vert(rio[i].x, alto(i), rio[i].z, (d0[0] + d1[0]) * 0.5 * v, (d0[1] + d1[1]) * 0.5 * v, largoA[i], 0);
    const pasos = Math.max(1, Math.ceil(Math.abs(giro) / PASO_ABANICO));
    let previo = -1;
    for (let k = 0; k <= pasos; k++) {
      const ang = a0 + giro * (k / pasos);
      const px = Math.cos(ang), pz = Math.sin(ang);
      const q = vert(rio[i].x + px * w, alto(i), rio[i].z + pz * w, (d0[0] + d1[0]) * 0.5 * v, (d0[1] + d1[1]) * 0.5 * v, largoA[i], lado * w);
      if (previo >= 0) tri(centro, previo, q);
      previo = q;
    }
  }
  return { pos, flujo, cauce, ind };
}
