// 4.26.1 (A): ¿por dónde se ve afuera desde adentro de una obra? Rayos contra la geometría de verdad (la malla fusionada de la obra, en su marco
// local), sin three ni placa: cada rayo que sale del cuarto sin tocar ningún triángulo y no pasa por una abertura declarada es una fuga (luz que se ve
// desde adentro: con la regla de interiores, ahí se vería el cielo en vez del bosque). Las rendijas de las casas son finas (8 mm entre tabla y tabla,
// 2 a 3 cm entre tronco y tronco, de 5 a 20 cm bajo el alero): los rayos se tiran en peines perpendiculares a cada pared, cada 3 mm a lo largo, y
// hacia el techo cada 5 mm a lo ancho de las tablas.
//
// Uso: const f = fugasDeObra(posiciones, cuarto, { pasoU: 0.003 }) → { rayos, fugas: [{ x, y, z, dx, dy, dz }] }
//   posiciones: Float32Array de triángulos sueltos (x, y, z, ...) en el marco de la obra.
//   cuarto: { x0, x1, z0, z1, y0, y1, ojos: [alturas], aberturas: [{ cara: '-z'|'+z'|'-x'|'+x', u0, u1, y0, y1 }], techo: { eje: 'x'|'z', incl, sube: [+1, -1] } }

// una grilla uniforme de triángulos (celdas de `tam` m, en listas compactas) para no probar cada rayo contra todos. Cada triángulo va en las celdas de su
// caja (agrandada 1 mm: un corte justo en el borde de dos celdas lo encuentra cualquiera de las dos)
function grilla(p, tam = 0.25) {
  let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
  for (let i = 0; i < p.length; i += 3) { mnx = Math.min(mnx, p[i]); mny = Math.min(mny, p[i + 1]); mnz = Math.min(mnz, p[i + 2]); mxx = Math.max(mxx, p[i]); mxy = Math.max(mxy, p[i + 1]); mxz = Math.max(mxz, p[i + 2]); }
  mnx -= 0.01; mny -= 0.01; mnz -= 0.01; mxx += 0.01; mxy += 0.01; mxz += 0.01;
  const nx = Math.max(1, Math.ceil((mxx - mnx) / tam)), ny = Math.max(1, Math.ceil((mxy - mny) / tam)), nz = Math.max(1, Math.ceil((mxz - mnz) / tam));
  const e = 0.001, cel = (v, mn, n) => Math.min(n - 1, Math.max(0, Math.floor((v - mn) / tam)));
  const rango = (t) => {
    const ax = Math.min(p[t], p[t + 3], p[t + 6]) - e, bx = Math.max(p[t], p[t + 3], p[t + 6]) + e;
    const ay = Math.min(p[t + 1], p[t + 4], p[t + 7]) - e, by = Math.max(p[t + 1], p[t + 4], p[t + 7]) + e;
    const az = Math.min(p[t + 2], p[t + 5], p[t + 8]) - e, bz = Math.max(p[t + 2], p[t + 5], p[t + 8]) + e;
    return [cel(ax, mnx, nx), cel(bx, mnx, nx), cel(ay, mny, ny), cel(by, mny, ny), cel(az, mnz, nz), cel(bz, mnz, nz)];
  };
  const cuenta = new Int32Array(nx * ny * nz + 1);
  for (let t = 0; t < p.length; t += 9) { const [i0, i1, j0, j1, k0, k1] = rango(t); for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) cuenta[(i * ny + j) * nz + k + 1]++; }
  for (let c = 1; c < cuenta.length; c++) cuenta[c] += cuenta[c - 1];
  const lista = new Int32Array(cuenta[cuenta.length - 1]), lleno = cuenta.slice(0, -1);
  for (let t = 0; t < p.length; t += 9) { const [i0, i1, j0, j1, k0, k1] = rango(t); for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) lista[lleno[(i * ny + j) * nz + k]++] = t; }
  return { p, tam, mnx, mny, mnz, mxx: mnx + nx * tam, mxy: mny + ny * tam, mxz: mnz + nz * tam, nx, ny, nz, inicio: cuenta, lista, marca: new Int32Array(p.length / 9 + 1), rayo: 0 };
}

// Möller–Trumbore: la distancia al triángulo `t` (o Infinity)
function corte(p, t, ox, oy, oz, dx, dy, dz) {
  const e1x = p[t + 3] - p[t], e1y = p[t + 4] - p[t + 1], e1z = p[t + 5] - p[t + 2];
  const e2x = p[t + 6] - p[t], e2y = p[t + 7] - p[t + 1], e2z = p[t + 8] - p[t + 2];
  const hx = dy * e2z - dz * e2y, hy = dz * e2x - dx * e2z, hz = dx * e2y - dy * e2x;
  const a = e1x * hx + e1y * hy + e1z * hz;
  if (a > -1e-12 && a < 1e-12) return Infinity;
  const f = 1 / a, sx = ox - p[t], sy = oy - p[t + 1], sz = oz - p[t + 2];
  const u = f * (sx * hx + sy * hy + sz * hz);
  if (u < -1e-7 || u > 1 + 1e-7) return Infinity;
  const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
  const v = f * (dx * qx + dy * qy + dz * qz);
  if (v < -1e-7 || u + v > 1 + 1e-7) return Infinity;
  const d = f * (e2x * qx + e2y * qy + e2z * qz);
  return d > 1e-6 ? d : Infinity;
}

// ¿el rayo toca algo? Se recorren sólo las celdas que cruza (Amanatides y Woo), desde que entra a la caja de la obra hasta que sale
function toca(G, ox, oy, oz, dx, dy, dz) {
  const { p, tam, mnx, mny, mnz, mxx, mxy, mxz, nx, ny, nz, inicio, lista, marca } = G;
  let t0 = 0, t1 = Infinity;
  for (const [o, d, mn, mx] of [[ox, dx, mnx, mxx], [oy, dy, mny, mxy], [oz, dz, mnz, mxz]]) {
    if (Math.abs(d) < 1e-12) { if (o < mn || o > mx) return false; continue; }
    const a = (mn - o) / d, b = (mx - o) / d;
    t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b));
  }
  if (t0 > t1) return false;
  const r = ++G.rayo;
  const px = ox + dx * t0, py = oy + dy * t0, pz = oz + dz * t0;
  let i = Math.min(nx - 1, Math.max(0, Math.floor((px - mnx) / tam))), j = Math.min(ny - 1, Math.max(0, Math.floor((py - mny) / tam))), k = Math.min(nz - 1, Math.max(0, Math.floor((pz - mnz) / tam)));
  const si = dx > 0 ? 1 : -1, sj = dy > 0 ? 1 : -1, sk = dz > 0 ? 1 : -1;
  const sig = (c, s, mn, o, d) => (Math.abs(d) < 1e-12 ? Infinity : (mn + (c + (s > 0 ? 1 : 0)) * tam - o) / d);
  let tx = sig(i, si, mnx, ox, dx), ty = sig(j, sj, mny, oy, dy), tz = sig(k, sk, mnz, oz, dz);
  const ddx = Math.abs(dx) < 1e-12 ? Infinity : tam / Math.abs(dx), ddy = Math.abs(dy) < 1e-12 ? Infinity : tam / Math.abs(dy), ddz = Math.abs(dz) < 1e-12 ? Infinity : tam / Math.abs(dz);
  for (;;) {
    const c = (i * ny + j) * nz + k;
    for (let q = inicio[c]; q < inicio[c + 1]; q++) { const t = lista[q], m = t / 9; if (marca[m] === r) continue; marca[m] = r; if (corte(p, t, ox, oy, oz, dx, dy, dz) < Infinity) return true; }
    if (tx < ty && tx < tz) { if (tx > t1) return false; i += si; tx += ddx; if (i < 0 || i >= nx) return false; }
    else if (ty < tz) { if (ty > t1) return false; j += sj; ty += ddy; if (j < 0 || j >= ny) return false; }
    else { if (tz > t1) return false; k += sk; tz += ddz; if (k < 0 || k >= nz) return false; }
  }
}

// Los peines: perpendiculares a cada pared (a la altura de los ojos y de piso a techo) y hacia el techo (de pie, mirando para arriba en abanico).
export function fugasDeObra(posiciones, cuarto, o = {}) {
  const G = grilla(posiciones, o.tam || 0.25);
  const pasoU = o.pasoU || 0.003, pasoV = o.pasoV || 0.05;
  const { x0, x1, z0, z1, y0, y1 } = cuarto;
    const aberturas = cuarto.aberturas || [];
  const enAbertura = (cara, u, y) => aberturas.some((a) => a.cara === cara && u >= a.u0 && u <= a.u1 && y >= a.y0 && y <= a.y1);
  const fugas = []; let rayos = 0;
  // el suelo (y = 0, el pie de la obra): el terreno se sigue dibujando con la regla. Un rayo que baja entre las tablas del piso y llega al suelo debajo de la
  // casa no es fuga; si llega al suelo afuera de la casa (o sale de costado por debajo del piso), sí: ahí hay pasto y plantas, que la regla apaga
  const pie = cuarto.pie || { x0: x0 - 0.1, x1: x1 + 0.1, z0: z0 - 0.1, z1: z1 + 0.1 };
  const alSuelo = (ox, oy, oz, dx, dy, dz) => { if (!(dy < -1e-6)) return false; const t = -oy / dy, x = ox + dx * t, z = oz + dz * t; return x > pie.x0 && x < pie.x1 && z > pie.z0 && z < pie.z1; };
  // ¿el rayo cruza la cara del cuarto por una abertura declarada? (sale por la puerta: eso se ve siempre, la regla dibuja todo si la mirás)
  const porAbertura = (ox, oy, oz, dx, dy, dz) => aberturas.some((a) => {
    const eje = a.cara[1], signo = a.cara[0] === '-' ? -1 : 1, plano = eje === 'z' ? (signo < 0 ? z0 : z1) : (signo < 0 ? x0 : x1);
    const d = eje === 'z' ? dz : dx, o0 = eje === 'z' ? oz : ox;
    if (!(d * signo > 1e-9)) return false;
    const t = (plano - o0) / d, u = eje === 'z' ? ox + dx * t : oz + dz * t, y = oy + dy * t;
    return u >= a.u0 && u <= a.u1 && y >= a.y0 && y <= a.y1;
  });
  const tirar = (ox, oy, oz, dx, dy, dz) => { rayos++; if (!toca(G, ox, oy, oz, dx, dy, dz) && !alSuelo(ox, oy, oz, dx, dy, dz) && !porAbertura(ox, oy, oz, dx, dy, dz)) fugas.push({ x: +ox.toFixed(3), y: +oy.toFixed(3), z: +oz.toFixed(3), dx: +dx.toFixed(2), dy: +dy.toFixed(2), dz: +dz.toFixed(2) }); };
  const m = 0.25;   // (los peines arrancan a 25 cm de cada pared, adentro)
  // paredes: cada 3 mm a lo largo, cada 5 cm de alto, de frente (y con un poco de subida, para las franjas de arriba de la pared)
  for (const subida of o.subidas || [0, 0.35]) {
    const n = Math.hypot(1, subida), s = subida / n, h = 1 / n;
    for (let y = y0 + 0.05; y <= y1 - 0.02; y += pasoV) {
      for (let u = x0 + 0.02; u <= x1 - 0.02; u += pasoU) {
        if (!enAbertura('-z', u, y)) tirar(u, y, z0 + m, 0, s, -h);
        if (!enAbertura('+z', u, y)) tirar(u, y, z1 - m, 0, s, h);
      }
      for (let u = z0 + 0.02; u <= z1 - 0.02; u += pasoU) {
        if (!enAbertura('-x', u, y)) tirar(x0 + m, y, u, -h, s, 0);
        if (!enAbertura('+x', u, y)) tirar(x1 - m, y, u, h, s, 0);
      }
    }
  }
  // el piso: desde la altura de los ojos, para abajo y en diagonal hacia cada pared (45° y 70°), en dos peines (cada 4 mm a lo largo de x y a lo largo de z)
  {
    const yo = cuarto.ojos ? cuarto.ojos[0] : (y0 + y1) / 2;
    const dirs = [[0, -1, 0]];
    for (const ang of [Math.PI / 4, Math.PI * 7 / 18]) for (const [hx, hz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) dirs.push([hx * Math.sin(ang), -Math.cos(ang), hz * Math.sin(ang)]);
    const pf = o.pasoPiso || 0.004;
    for (const [dx, dy, dz] of dirs) {
      for (let x = x0 + 0.05; x <= x1 - 0.05; x += 0.15) for (let z = z0 + 0.02; z <= z1 - 0.02; z += pf) tirar(x, yo, z, dx, dy, dz);
      for (let z = z0 + 0.05; z <= z1 - 0.05; z += 0.15) for (let x = x0 + 0.02; x <= x1 - 0.02; x += pf) tirar(x, yo, z, dx, dy, dz);
    }
  }
  // el techo: desde la altura de los ojos, en un abanico (de frente al techo de cada agua y derecho para arriba), cada 5 mm a lo ancho de las tablas
  if (cuarto.techo) {
    const { eje, incl } = cuarto.techo;
    const dirs = [[0, 1]];
    for (const lado of [-1, 1]) dirs.push([lado * Math.sin(incl), Math.cos(incl)], [lado * Math.sin(incl * 0.5), Math.cos(incl * 0.5)]);
    const yo = cuarto.ojos ? cuarto.ojos[0] : (y0 + y1) / 2;
    for (const [a, b] of dirs) {
      for (let w = (eje === 'x' ? z0 : x0) + 0.02; w <= (eje === 'x' ? z1 : x1) - 0.02; w += o.pasoTecho || 0.005) {
        for (let v = (eje === 'x' ? x0 : z0) + 0.1; v <= (eje === 'x' ? x1 : z1) - 0.1; v += 0.2) {
          if (eje === 'x') tirar(v, yo, w, a, b, 0);   // el agua corre a lo largo de x (las tablas del techo van en x; sus juntas, a lo largo de z)
          else tirar(w, yo, v, 0, b, a);
        }
      }
    }
  }
  return { rayos, fugas };
}
