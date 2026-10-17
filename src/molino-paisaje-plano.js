// 4.0 (molino y puente): el plano PURO del paisaje del molino de viento: el campo de tulipanes en franjas de colores, los cercos de
// madera, el arroyo del molino con su cascadita y la casa con galería. Sin THREE ni DOM: se prueba en Node (pruebas/verificar-4-0-molino.mjs)
// y lo dibuja `molino-paisaje.js`. Todo en el marco local del molino (el de estructuras.js): +z hacia la puerta (el sendero), +x a la derecha
// mirando desde la puerta; el sitio del molino lo sortea el valle y NO cambia: lo nuevo se apoya en el terreno que haya.
//
// Importante: esto no usa el azar del sorteo del valle (nada de `r()` de estructuras.js): todo sale de `azarFijo`, así que agregar el paisaje
// no mueve ninguna otra obra.

export const IDS_MOLINO_PAISAJE = Object.freeze(['campo-tulipanes', 'cercos-molino', 'arroyo-molino', 'casa-molino']);

// el azar fijo: el mismo para todos, siempre
export function azarFijo(a, b = 0, c = 0) {
  const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

// ---------------------------------------------------------------- el campo de tulipanes
export const CAMPO = Object.freeze({
  lx0: -2.5, lx1: 9.5, lz0: 9.4, lz1: 22.6,
  surco: 0.5,          // la tierra pelada entre franja y franja
  pasoX: 0.22, pasoZ: 0.27,   // separación de las plantas (en x dentro de la hilera; entre hileras)
  alto: 0.42,
});
// las franjas, de adelante (hacia el sendero) hacia el arroyo: cada una con la mezcla de colores que lleva
export const COLORES_TULIPAN = Object.freeze({
  rojo: '#d3202a', naranja: '#ee7d1a', amarillo: '#f4c21a', rosa: '#e04b93', blanco: '#f1ecdf',
});
export const FRANJAS = Object.freeze([
  { id: 'f1', mezcla: { rojo: 0.8, naranja: 0.2 } },
  { id: 'f2', mezcla: { naranja: 0.75, amarillo: 0.25 } },
  { id: 'f3', mezcla: { amarillo: 0.9, blanco: 0.1 } },
  { id: 'f4', mezcla: { rosa: 0.85, rojo: 0.15 } },
  { id: 'f5', mezcla: { rojo: 0.65, naranja: 0.3, blanco: 0.05 } },
  { id: 'f6', mezcla: { amarillo: 0.6, naranja: 0.4 } },
]);
// 4.2 (huevos de pascua): un corazón escondido en el campo. Visto desde arriba (la loma, el techo del molino) las seis franjas son las
// seis filas de un corazón de siete columnas, en tulipanes blancos; de cerca son parches blancos entre los de siempre. Sólo cambia el
// COLOR de algunas plantas: las mismas, en el mismo lugar, en las mismas mallas (cinco, una por color). Fila 0 = la franja del fondo
// (hacia el arroyo): los lóbulos miran al arroyo y la punta, al sendero.
export const DIBUJO_CAMPO = Object.freeze({
  id: 'corazon', color: 'blanco', pureza: 0.96,   // el 4 % del parche conserva el color de la franja (no se ve «pintado»)
  filas: Object.freeze(['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']),
  suave: 0.3,     // m: en el borde de cada parche, las plantas se mezclan con las de al lado (el límite no es una raya)
});
// ¿La planta de la franja `fi` (0 = la de adelante, hacia el sendero) en `x` (marco local del molino) cae en un parche del corazón?
// `u`: un azar fijo de la planta, para el borde.
export function enDibujo(fi, x, u = 0.5, dibujo = DIBUJO_CAMPO) {
  const filas = dibujo.filas, fila = filas[filas.length - 1 - fi];
  if (!fila) return false;
  const cols = fila.length, ancho = (CAMPO.lx1 - CAMPO.lx0) / cols, t = (x - CAMPO.lx0) / ancho;
  const c = Math.max(0, Math.min(cols - 1, Math.floor(t))), mio = fila[c] === '#';
  const aIzq = (t - c) * ancho, aDer = (1 - (t - c)) * ancho, lado = aIzq < aDer ? -1 : 1, d = Math.min(aIzq, aDer);
  const otro = fila[c + lado] === '#';
  // pegada al vecino distinto, una de cada dos (menos, a medida que se aleja del borde) cambia de parche
  const cambia = otro !== mio && u < 0.5 * (1 - Math.min(1, d / dibujo.suave));
  return cambia ? otro : mio;
}
export function limitesFranjas() {
  const n = FRANJAS.length, total = CAMPO.lz1 - CAMPO.lz0, ancho = (total - CAMPO.surco * (n - 1)) / n;
  return FRANJAS.map((f, i) => ({ ...f, z0: CAMPO.lz0 + i * (ancho + CAMPO.surco), z1: CAMPO.lz0 + i * (ancho + CAMPO.surco) + ancho }));
}
function elegirColor(mezcla, u) {
  let acc = 0, ultimo = 'rojo';
  for (const [k, p] of Object.entries(mezcla)) { acc += p; ultimo = k; if (u < acc) return k; }
  return ultimo;
}
// Todas las plantas del campo, ya mezcladas con un orden fijo: `muestra(densidad)` toma un prefijo, así que bajar la calidad saca
// plantas parejo por todo el campo (no un trozo). Devuelve { color: [{ x, z, giro, esc }] } por color.
export function sembrarTulipanes() {
  const todas = [];
  for (const [fi, f] of limitesFranjas().entries()) {
    let fila = 0;
    for (let z = f.z0 + 0.15; z <= f.z1 - 0.1; z += CAMPO.pasoZ, fila++) {
      for (let x = CAMPO.lx0 + 0.15 + (fila % 2) * CAMPO.pasoX * 0.5; x <= CAMPO.lx1 - 0.1; x += CAMPO.pasoX) {
        const k = fi * 1000 + fila;
        todas.push({
          x: x + (azarFijo(x, z, 1) - 0.5) * 0.09, z: z + (azarFijo(x, z, 2) - 0.5) * 0.09,
          giro: azarFijo(x, z, 3) * Math.PI * 2, esc: 0.85 + azarFijo(x, z, 4) * 0.35,
          color: enDibujo(fi, x, azarFijo(x, z, 9)) && azarFijo(x, z, 10) < DIBUJO_CAMPO.pureza ? DIBUJO_CAMPO.color : elegirColor(f.mezcla, azarFijo(x, z, 5 + k * 0)), orden: azarFijo(x, z, 6),
        });
      }
    }
  }
  todas.sort((a, b) => a.orden - b.orden);
  const porColor = {};
  for (const t of todas) (porColor[t.color] ??= []).push(t);
  return { porColor, total: todas.length };
}
export function cantidadConDensidad(total, densidad) {
  return Math.max(0, Math.min(total, Math.round(total * Math.min(1, Math.max(0, densidad)))));
}

// ---------------------------------------------------------------- los cercos de madera
// Tramos rectos [[x0, z0], [x1, z1]] con poste cada ~2 m y dos travesaños; `portones`: huecos sin travesaños (por donde se entra al campo).
export const CERCOS = Object.freeze({
  poste: 2.1,
  tramos: Object.freeze([
    // el campo: adelante (hacia el sendero, con portón), a los dos lados y atrás (hacia el arroyo)
    { id: 'campo-frente', a: [-3.4, 8.2], b: [10.4, 8.2], porton: [3.1, 5.5] },
    { id: 'campo-izq', a: [-3.4, 8.2], b: [-3.4, 23.8] },
    { id: 'campo-der', a: [10.4, 8.2], b: [10.4, 23.8] },
    { id: 'campo-fondo', a: [-3.4, 23.8], b: [10.4, 23.8] },
  ]),
});

// ---------------------------------------------------------------- el arroyo del molino y su cascadita
// El arroyo nace de un manantial entre rocas, corre al costado del campo por el borde de la terraza y baja la loma hacia el este.
export const ARROYO = Object.freeze({
  puntos: Object.freeze([[-23, 25.4], [-17, 24.8], [-11, 25.2], [-5, 24.8], [1, 25.3], [6, 25.2], [10.5, 25.6], [16, 26.8], [22, 28.8], [28, 31.2], [34, 33.8]]),
  ancho: 2.2,            // ancho del agua en lo llano
  anchoBajada: 1.5,
  lazoDique: 9.0,        // lx donde termina lo llano: acá está la caída
  desfase: 0.16,         // el agua de lo llano queda tantos metros sobre lo más alto del terreno (la sostienen las rocas de las orillas)
});
// Chaikin: suaviza una poligonal sin mover los extremos
export function suavizar(pts, vueltas = 2) {
  let p = pts.map((q) => [q[0], q[1]]);
  for (let v = 0; v < vueltas; v++) {
    const n = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      n.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    n.push(p[p.length - 1]);
    p = n;
  }
  return p;
}
// Puntos del arroyo cada `paso` metros: { x, z, s, nx, nz, ancho } (n = normal a la derecha del sentido de la corriente)
export function muestrearArroyo(paso = 0.8, a = ARROYO) {
  const p = suavizar(a.puntos, 3), out = [];
  let acum = 0, sig = 0;
  for (let i = 0; i < p.length - 1; i++) {
    const dx = p[i + 1][0] - p[i][0], dz = p[i + 1][1] - p[i][1], l = Math.hypot(dx, dz);
    if (l < 1e-6) continue;
    while (sig <= acum + l + 1e-9) {
      const t = (sig - acum) / l;
      out.push({ x: p[i][0] + dx * t, z: p[i][1] + dz * t, s: sig, nx: -dz / l, nz: dx / l });
      sig += paso;
    }
    acum += l;
  }
  const ult = p[p.length - 1], pen = out[out.length - 1];
  if (!pen || Math.hypot(pen.x - ult[0], pen.z - ult[1]) > paso * 0.4) out.push({ x: ult[0], z: ult[1], s: acum, nx: out.length ? out[out.length - 1].nx : 0, nz: out.length ? out[out.length - 1].nz : 1 });
  const hasta = a.lazoDique;
  for (const m of out) {
    // el ancho se angosta de golpe pasada la caída y se abre al final con la poza
    const k = Math.min(1, Math.max(0, (m.x - hasta) / 3));
    m.ancho = a.ancho + (a.anchoBajada - a.ancho) * k;
  }
  return out;
}

// ---------------------------------------------------------------- la casa con galería
export const CASA = Object.freeze({
  cx: -10.2, cz: 7.6,         // centro de la planta (marco del molino)
  ancho: 8.4, fondo: 5.4,     // x y z
  alto: 2.55,                 // paredes
  galeria: 2.3,               // fondo de la galería, hacia +z
  cumbrera: 1.75,             // altura de la cumbrera sobre las paredes
  voladizo: 0.55,
});

// Las zonas que el mundo tiene que despejar (árboles, matas, pasto) para que el paisaje entre: círculos { x, z, r, pasto } locales.
export function zonasDespeje() {
  const z = [];
  for (let lx = CAMPO.lx0 - 1.5; lx <= CAMPO.lx1 + 1.5; lx += 3.5) for (let lz = CAMPO.lz0 - 1.2; lz <= CAMPO.lz1 + 1.8; lz += 3.5) z.push({ x: lx, z: lz, r: 3.2, pasto: 3.2 });
  for (const m of muestrearArroyo(5)) z.push({ x: m.x, z: m.z, r: 3.0, pasto: 2.2 });
  for (let lx = CASA.cx - CASA.ancho / 2; lx <= CASA.cx + CASA.ancho / 2 + 0.1; lx += 3.2) z.push({ x: lx, z: CASA.cz + 1.2, r: 4.6, pasto: 4.4 });
  return z;
}
