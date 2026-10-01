// Terreno: alturas, lago, arroyo tallado, sendero, densidades y consultas rápidas
//
// 2.7.4: el terreno se arma en dos partes. `calcularTerreno` saca los DATOS (las grillas
// y los recorridos del arroyo, el sendero y la vía) y `armarTerreno` les pone encima las
// consultas (altura, normal, agua…). Así los datos pueden venir de la caché de la carga
// (ver `cache-carga.js`) o calcularse de a pedazos sin trabar la pantalla de carga
// (`pasosTerreno`). `generarTerreno()` sigue igual que siempre: los calcula enteros ya.
// El valle es el mismo, número por número (lo exige la huella de `verificar-2-2.mjs`).
import { crearRuido, smoothstep, clamp, lerp, fuenteRuido } from './ruido.js';
import { MITAD, RES, CELDA, N, LAGO, LUGARES, RIO_CONTROL, SENDERO_CONTROL, RIEL_CONTROL, SEMILLA } from './config.js';
import { claveCarga, versionDelBuild, armarRegistro, leerCache, guardarCache } from './cache-carga.js';

function catmullRom(ctrl, cerrado, paso) {
  const pts = [];
  const n = ctrl.length;
  const tramos = cerrado ? n : n - 1;
  const P = (i) => ctrl[cerrado ? ((i % n) + n) % n : clamp(i, 0, n - 1)];
  for (let i = 0; i < tramos; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const largo = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const k = Math.max(2, Math.ceil(largo / paso));
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      pts.push({ x: f(p0[0], p1[0], p2[0], p3[0]), z: f(p0[1], p1[1], p2[1], p3[1]) });
    }
  }
  if (!cerrado) pts.push({ x: ctrl[n - 1][0], z: ctrl[n - 1][1] });
  return pts;
}

function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

// Índice espacial de segmentos para distancias rápidas.
// 2.2: las celdas viven en una grilla de enteros. Antes eran claves de texto 'cx,cz' en
// un Map, y armar ese texto en cada consulta —ochocientas mil consultas al generar el
// valle— era más de la mitad de lo que tardaba el terreno. Se recorren las mismas
// celdas en el mismo orden: el valle sale idéntico. La respuesta es un objeto que se
// reusa: quien la lea tiene que hacerlo antes de la consulta siguiente.
// 2.7.4: los segmentos (inicio, dirección y largo² de cada uno) se copian a arreglos
// planos al armar el índice, y las celdas son una sola lista corrida con su comienzo por
// celda. Cada consulta hace las mismas cuentas con los mismos números, en el mismo
// orden de celdas y de segmentos: el más cercano sale el mismo, aun en los empates.
// (Los puntos no se mueven después de armar el índice.)
function indiceSegmentos(pts, cerrado, tam) {
  const segs = cerrado ? pts.length : pts.length - 1;
  let cx0 = Infinity, cx1 = -Infinity, cz0 = Infinity, cz1 = -Infinity;
  const rangos = [];
  const AX = new Float64Array(segs), AZ = new Float64Array(segs), ABX = new Float64Array(segs), ABZ = new Float64Array(segs), L2 = new Float64Array(segs);
  for (let i = 0; i < segs; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const x0 = Math.floor(Math.min(a.x, b.x) / tam), x1 = Math.floor(Math.max(a.x, b.x) / tam);
    const z0 = Math.floor(Math.min(a.z, b.z) / tam), z1 = Math.floor(Math.max(a.z, b.z) / tam);
    rangos.push(x0, x1, z0, z1);
    if (x0 < cx0) cx0 = x0;
    if (x1 > cx1) cx1 = x1;
    if (z0 < cz0) cz0 = z0;
    if (z1 > cz1) cz1 = z1;
    const abx = b.x - a.x, abz = b.z - a.z;
    AX[i] = a.x; AZ[i] = a.z; ABX[i] = abx; ABZ[i] = abz;
    L2[i] = abx * abx + abz * abz || 1;
  }
  const ancho = Math.max(0, cx1 - cx0 + 1), alto = Math.max(0, cz1 - cz0 + 1);
  // cuántos segmentos por celda, después dónde empieza cada celda, después la lista
  // (los segmentos entran en orden creciente, como antes con push)
  const inicio = new Int32Array(ancho * alto + 1);
  for (let i = 0; i < segs; i++) {
    const x0 = rangos[i * 4], x1 = rangos[i * 4 + 1], z0 = rangos[i * 4 + 2], z1 = rangos[i * 4 + 3];
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) inicio[(cx - cx0) * alto + (cz - cz0) + 1]++;
  }
  for (let k = 0; k < ancho * alto; k++) inicio[k + 1] += inicio[k];
  const lista = new Int32Array(inicio[ancho * alto]);
  const lleno = inicio.slice(0, ancho * alto);
  for (let i = 0; i < segs; i++) {
    const x0 = rangos[i * 4], x1 = rangos[i * 4 + 1], z0 = rangos[i * 4 + 2], z1 = rangos[i * 4 + 3];
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) lista[lleno[(cx - cx0) * alto + (cz - cz0)]++] = i;
  }
  const respuesta = { d: 0, i: -1, t: 0 };
  return {
    cercano(x, z, radioCeldas) {
      const cx = Math.floor(x / tam), cz = Math.floor(z / tam);
      let mejor = Infinity, iMejor = -1, tMejor = 0;
      for (let dx = -radioCeldas; dx <= radioCeldas; dx++) {
        const gx = cx + dx - cx0;
        if (gx < 0 || gx >= ancho) continue;
        for (let dz = -radioCeldas; dz <= radioCeldas; dz++) {
          const gz = cz + dz - cz0;
          if (gz < 0 || gz >= alto) continue;
          const celda = gx * alto + gz;
          for (let n = inicio[celda], fin = inicio[celda + 1]; n < fin; n++) {
            const i = lista[n];
            const ax = AX[i], az = AZ[i], abx = ABX[i], abz = ABZ[i];
            const t = clamp(((x - ax) * abx + (z - az) * abz) / L2[i], 0, 1);
            const px = ax + abx * t - x, pz = az + abz * t - z;
            const d2 = px * px + pz * pz;
            if (d2 < mejor) { mejor = d2; iMejor = i; tMejor = t; }
          }
        }
      }
      respuesta.d = Math.sqrt(mejor); respuesta.i = iMejor; respuesta.t = tMejor;
      return respuesta;
    },
  };
}

const X = (i) => i * CELDA - MITAD;
const crearRadioLago = (simplex) => (ang) => 104 + 20 * simplex(Math.cos(ang) * 0.9 + 3.1, Math.sin(ang) * 0.9 - 1.7) + 8 * simplex(Math.cos(ang) * 2.4, Math.sin(ang) * 2.4);
const crearAlturaGrilla = (alturas) => (x, z) => {
  const fx = clamp((x + MITAD) / CELDA, 0, RES - 0.001), fz = clamp((z + MITAD) / CELDA, 0, RES - 0.001);
  const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j;
  const k = j * N + i;
  return lerp(lerp(alturas[k], alturas[k + 1], tx), lerp(alturas[k + N], alturas[k + N + 1], tx), tz);
};

// 2.7.4: cada cuántas filas de la grilla se puede ceder el paso (ver `pasosTerreno`)
const FILAS_POR_PASO = 24;

// Los datos del valle. Es un generador: cede (`yield`) cada tantas filas para que quien
// lo corre pueda soltar la pantalla un momento; si se lo corre de un tirón, es la misma
// cuenta de siempre.
function* calcularTerreno() {
  const { simplex, fbm } = crearRuido(SEMILLA);
  const total = N * N;
  const alturas = new Float32Array(total);
  const distRio = new Float32Array(total).fill(999);
  const nivelRio = new Float32Array(total).fill(-99);
  const anchoRio = new Float32Array(total);
  const distSendero = new Float32Array(total).fill(999);
  const distRiel = new Float32Array(total).fill(999);
  const bosque = new Float32Array(total);
  const estepa = new Float32Array(total);
  const pasto = new Float32Array(total);

  const radioLago = crearRadioLago(simplex);

  function alturaBase(x, z) {
    let h = 17 + fbm(x * 0.0019, z * 0.0019, 5) * 22 + fbm(x * 0.011 + 40, z * 0.011, 3) * 2.5;
    h += (-x - z) * 0.011;
    const dx = x - LAGO.x, dz = z - LAGO.z;
    const d = Math.hypot(dx, dz);
    const orilla = radioLago(Math.atan2(dz, dx));
    const cuenca = 1 - smoothstep(-40, 55, d - orilla);
    h = lerp(h, -8, cuenca * cuenca * (3 - 2 * cuenca) * 0.95 + cuenca * 0.05);
    const m = LUGARES.mirador;
    h += 38 * Math.exp(-((x - m.x) ** 2 + (z - m.z) ** 2) / (2 * 66 * 66));
    const e = Math.max(Math.abs(x), Math.abs(z));
    h += Math.pow(smoothstep(395, 510, e), 2) * 95;
    return h;
  }

  // 2.7.4: cada pasada por la grilla es una función por fila que el generador llama fila
  // por fila. (El trabajo pesado no puede quedar suelto adentro del generador: V8 no
  // optimiza a mitad de camino un bucle largo de un generador, y tardaba más.)
  // ---------- alturas base ----------
  const filaAlturas = (j) => { for (let i = 0; i < N; i++) alturas[j * N + i] = alturaBase(X(i), X(j)); };
  for (let j = 0; j < N; j++) {
    filaAlturas(j);
    if (j % FILAS_POR_PASO === FILAS_POR_PASO - 1) yield;
  }

  // ---------- arroyo ----------
  const rio = catmullRom(RIO_CONTROL, false, 2.5);
  for (let i = 0; i < rio.length; i++) {
    const a = rio[Math.max(0, i - 1)], b = rio[Math.min(rio.length - 1, i + 1)];
    const tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1;
    const off = simplex(i * 0.018, 5.3) * 7;
    rio[i].x += (-tz / l) * off; rio[i].z += (tx / l) * off;
  }
  let s = Infinity;
  for (let i = 0; i < rio.length; i++) {
    const p = rio[i];
    s = Math.max(0, Math.min(s - 0.01, alturaBase(p.x, p.z) - 1.0));
    p.s = s;
    p.w = 3.0 + 1.4 * (simplex(i * 0.03, 1.7) * 0.5 + 0.5) + (i / rio.length) * 2.8;
  }
  // Un salto de agua: se busca el tramo más empinado dentro del valle y se
  // acentúa, dejando un escalón limpio en el perfil del arroyo.
  let saltoAgua = null;
  {
    let mejor = -1, pend = 0;
    for (let i = 14; i < rio.length - 14; i++) {
      const p = rio[i];
      if (Math.max(Math.abs(p.x), Math.abs(p.z)) > 330) continue;
      if (Math.hypot(p.x - LAGO.x, p.z - LAGO.z) < 150) continue;
      const caida = rio[i - 3].s - rio[i + 3].s;
      const largo = Math.hypot(rio[i + 3].x - rio[i - 3].x, rio[i + 3].z - rio[i - 3].z) || 1;
      if (caida / largo > pend) { pend = caida / largo; mejor = i; }
    }
    if (mejor > 0) {
      const ALTURA = 5.6;
      // el escalón: aguas abajo del punto todo baja de golpe
      for (let i = mejor + 1; i < rio.length; i++) rio[i].s -= ALTURA;
      // el borde se aplana un poco arriba y abajo, como una poza
      for (let d = 1; d <= 5; d++) {
        rio[mejor - d].s = rio[mejor].s + d * 0.05;
        const j = mejor + d;
        if (j < rio.length) rio[j].s = rio[mejor + 1].s - d * 0.06;
      }
      for (let i = 0; i < rio.length; i++) rio[i].s = Math.max(0, rio[i].s);
      const a2 = rio[mejor - 2], b2 = rio[mejor + 2];
      saltoAgua = {
        x: rio[mejor].x, z: rio[mejor].z, i: mejor, alto: ALTURA,
        arriba: rio[mejor].s, abajo: rio[mejor + 1].s, ancho: rio[mejor].w,
        ang: Math.atan2(b2.x - a2.x, b2.z - a2.z),
      };
    }
  }

  const idxRio = indiceSegmentos(rio, false, 20);
  const filaRio = (j) => {
    for (let i = 0; i < N; i++) {
      const x = X(i), z = X(j), k = j * N + i;
      const c = idxRio.cercano(x, z, 2);
      if (c.i < 0) continue;
      const a = rio[c.i], b = rio[c.i + 1];
      const sN = lerp(a.s, b.s, c.t), w = lerp(a.w, b.w, c.t);
      distRio[k] = c.d; nivelRio[k] = sN; anchoRio[k] = w;
      const target = c.d < w ? sN - 1.15 * (1 - (c.d / w) ** 2) : sN + 0.1 + (c.d - w) * 0.55;
      alturas[k] = smin(alturas[k], target, 2.2);
      // en el salto el terreno cae a pico: no se redondea el escalón
      if (saltoAgua && Math.hypot(x - saltoAgua.x, z - saltoAgua.z) < 9) {
        const haciaAbajo = (x - saltoAgua.x) * Math.sin(saltoAgua.ang) + (z - saltoAgua.z) * Math.cos(saltoAgua.ang);
        const nivel = haciaAbajo > 0.5 ? saltoAgua.abajo : saltoAgua.arriba;
        const dentro = c.d < w + 3 ? 1 : Math.max(0, 1 - (c.d - w - 3) / 4);
        alturas[k] = lerp(alturas[k], nivel - (c.d < w ? 1.1 : -0.4), dentro * 0.92);
      }
    }
  };
  for (let j = 0; j < N; j++) {
    filaRio(j);
    if (j % FILAS_POR_PASO === FILAS_POR_PASO - 1) yield;
  }

  // ---------- sendero ----------
  const sendero = catmullRom(SENDERO_CONTROL, true, 2);
  for (let i = 0; i < sendero.length; i++) {
    const p = sendero[i];
    p.x += simplex(i * 0.05, 9.1) * 3; p.z += simplex(i * 0.05, -4.4) * 3;
  }

  // Puentes: donde el sendero cruza el arroyo
  const puentes = [];
  // 2.7.4: en una función aparte por lo mismo que las filas (se cruzan miles de tramos)
  const buscarPuentes = () => { for (let i = 0; i < sendero.length; i++) {
    const a = sendero[i], b = sendero[(i + 1) % sendero.length];
    for (let r = 0; r < rio.length - 1; r++) {
      const c = rio[r], d = rio[r + 1];
      const den = (b.x - a.x) * (d.z - c.z) - (b.z - a.z) * (d.x - c.x);
      if (Math.abs(den) < 1e-9) continue;
      const t = ((c.x - a.x) * (d.z - c.z) - (c.z - a.z) * (d.x - c.x)) / den;
      const u = ((c.x - a.x) * (b.z - a.z) - (c.z - a.z) * (b.x - a.x)) / den;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t);
        if (puentes.some((p) => Math.hypot(p.x - x, p.z - z) < 30)) continue;
        const nivel = lerp(c.s, d.s, u), w = lerp(c.w, d.w, u);
        puentes.push({ x, z, nivel, w, ang: Math.atan2(b.z - a.z, b.x - a.x), largo: 2 * w + 9, alto: nivel + 1.7, iSendero: i });
      }
    }
  } };
  buscarPuentes();

  const alturaGrilla = crearAlturaGrilla(alturas);

  const perfil = sendero.map((p) => alturaGrilla(p.x, p.z));
  for (let i = 0; i < sendero.length; i++) {
    let suma = 0;
    for (let d = -9; d <= 9; d++) suma += perfil[(i + d + sendero.length) % sendero.length];
    sendero[i].h = suma / 19;
  }
  const idxSendero = indiceSegmentos(sendero, true, 16);
  const filaSendero = (j) => {
    for (let i = 0; i < N; i++) {
      const x = X(i), z = X(j), k = j * N + i;
      const c = idxSendero.cercano(x, z, 1);
      if (c.i < 0) continue;
      distSendero[k] = c.d;
      if (c.d > 7) continue;
      if (puentes.some((p) => Math.hypot(p.x - x, p.z - z) < p.largo * 0.5 + 4)) continue;
      const hp = lerp(sendero[c.i].h, sendero[(c.i + 1) % sendero.length].h, c.t);
      if (alturas[k] < 0.4) continue;
      alturas[k] = lerp(alturas[k], Math.max(hp, 0.5), smoothstep(7, 1.6, c.d) * 0.8);
    }
  };
  for (let j = 0; j < N; j++) {
    filaSendero(j);
    if (j % FILAS_POR_PASO === FILAS_POR_PASO - 1) yield;
  }

  // ---------- vía de la trochita ----------
  // Anillo cerrado alrededor del valle. El terraplén se allana a lo largo del
  // recorrido y, donde cruza el arroyo, se deja la quebrada libre para el puente.
  const riel = catmullRom(RIEL_CONTROL, true, 3);
  const puentesRiel = [];
  {
    // cruces con el arroyo
    const buscarCruces = () => { for (let i = 0; i < riel.length; i++) {
      const a = riel[i], b = riel[(i + 1) % riel.length];
      for (let r2 = 0; r2 < rio.length - 1; r2++) {
        const c = rio[r2], d = rio[r2 + 1];
        const den = (b.x - a.x) * (d.z - c.z) - (b.z - a.z) * (d.x - c.x);
        if (Math.abs(den) < 1e-9) continue;
        const t = ((c.x - a.x) * (d.z - c.z) - (c.z - a.z) * (d.x - c.x)) / den;
        const u = ((c.x - a.x) * (b.z - a.z) - (c.z - a.z) * (b.x - a.x)) / den;
        if (t < 0 || t > 1 || u < 0 || u > 1) continue;
        const x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t);
        if (puentesRiel.some((p) => Math.hypot(p.x - x, p.z - z) < 40)) continue;
        puentesRiel.push({ x, z, i, nivel: lerp(c.s, d.s, u), ancho: lerp(c.w, d.w, u) });
      }
    } };
    buscarCruces();

    const perfilR = riel.map((p) => alturaGrilla(p.x, p.z));
    for (let i = 0; i < riel.length; i++) {
      let suma = 0;
      for (let d = -18; d <= 18; d++) suma += perfilR[(i + d + riel.length * 2) % riel.length];
      riel[i].h = suma / 37;
    }
    // en el cruce del arroyo la vía pasa derecha y por encima de la quebrada
    for (const p of puentesRiel) {
      p.luz = p.ancho * 2 + 16;
      for (let d = -42; d <= 42; d++) {
        const j = (p.i + d + riel.length) % riel.length;
        if (Math.abs(d) <= 7) { riel[j].sobrePuente = true; riel[j].h = p.nivel + 5.5; }
        // los accesos al puente pueden despegarse más del terreno: son terraplenes
        riel[j].cercaPuente = Math.max(riel[j].cercaPuente || 0, 1 - Math.abs(d) / 43);
      }
    }
    const pasos = riel.map((p, i) => Math.hypot(p.x - riel[(i - 1 + riel.length) % riel.length].x, p.z - riel[(i - 1 + riel.length) % riel.length].z));
    // si el terreno no deja cumplir el 3%, se cede de a poco y se permiten
    // terraplenes y trincheras más profundos hasta que el perfil cierre
    let holguraExtra = 0;
    const vueltaRiel = (vuelta) => {
      if (vuelta > 0 && vuelta % 150 === 0) {
        let exceso = 0;
        for (let k = 0; k < riel.length; k++) {
          const j = (k + 1) % riel.length;
          exceso = Math.max(exceso, Math.abs(riel[j].h - riel[k].h) / pasos[j] - 0.03);
        }
        if (exceso > 0.002 && holguraExtra < 16) holguraExtra += 2.5;
      }
      for (let k = 0; k < riel.length; k++) {
        const i = k, j = (k + 1) % riel.length;
        const max = pasos[j] * 0.03;
        const d = riel[j].h - riel[i].h;
        if (Math.abs(d) > max) {
          const aj = (Math.abs(d) - max) * 0.5 * Math.sign(d);
          if (!riel[j].sobrePuente) riel[j].h -= aj;
          if (!riel[i].sobrePuente) riel[i].h += aj;
        }
      }
      if (vuelta % 3 === 2) for (let i = 0; i < riel.length; i++) {
        if (riel[i].sobrePuente) continue;
        const holgura = 6.5 + holguraExtra + (riel[i].cercaPuente || 0) * 16;
        riel[i].h = clamp(riel[i].h, perfilR[i] - holgura, perfilR[i] + holgura);
      }
    };
    for (let vuelta = 0; vuelta < 1500; vuelta++) {
      vueltaRiel(vuelta);
      if (vuelta % 150 === 149) yield;
    }
    for (let i = 0; i < riel.length; i++) riel[i].h = Math.max(1.2, riel[i].h);
    for (let i = 0; i < riel.length; i++) riel[i].s = i === 0 ? 0 : riel[i - 1].s + Math.hypot(riel[i].x - riel[i - 1].x, riel[i].z - riel[i - 1].z);
    riel.largo = riel[riel.length - 1].s + Math.hypot(riel[0].x - riel[riel.length - 1].x, riel[0].z - riel[riel.length - 1].z);

    const idxRiel = indiceSegmentos(riel, true, 20);
    const filaRiel = (j) => {
      for (let i = 0; i < N; i++) {
        const x = X(i), z = X(j), k = j * N + i;
        const c = idxRiel.cercano(x, z, 1);
        if (c.i < 0) continue;
        distRiel[k] = c.d;
        if (c.d > 29) continue;
        // donde hay puente no se toca el terreno
        if (puentesRiel.some((p) => Math.hypot(p.x - x, p.z - z) < p.luz * 0.5 + 6)) continue;
        const h = lerp(riel[c.i].h, riel[(c.i + 1) % riel.length].h, c.t);
        const dentro = smoothstep(28, 3.4, c.d);
        alturas[k] = lerp(alturas[k], h, dentro * 0.96);
        // en la franja de los durmientes el terreno nunca puede quedar por encima
        if (c.d < 4.5) alturas[k] = Math.min(alturas[k], h - 0.2 + (c.d / 4.5) * 0.12);
      }
    };
    for (let j = 0; j < N; j++) {
      filaRiel(j);
      if (j % FILAS_POR_PASO === FILAS_POR_PASO - 1) yield;
    }
  }

  // ---------- lugares ----------
  const aplanar = (lx, lz, radio, borde) => {
    const h0 = alturaGrilla(lx, lz);
    const i0 = Math.floor((lx - radio - borde + MITAD) / CELDA), i1 = Math.ceil((lx + radio + borde + MITAD) / CELDA);
    const j0 = Math.floor((lz - radio - borde + MITAD) / CELDA), j1 = Math.ceil((lz + radio + borde + MITAD) / CELDA);
    for (let j = Math.max(0, j0); j <= Math.min(RES, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(RES, i1); i++) {
      const d = Math.hypot(X(i) - lx, X(j) - lz);
      const k = j * N + i;
      alturas[k] = lerp(alturas[k], h0, smoothstep(radio + borde, radio, d));
    }
    return h0;
  };
  const lugares = {};
  for (const [clave, l] of Object.entries(LUGARES)) lugares[clave] = { ...l };
  lugares.refugio.y = aplanar(lugares.refugio.x, lugares.refugio.z, 12, 10);
  lugares.mirador.y = aplanar(lugares.mirador.x, lugares.mirador.z, 7, 10);
  lugares.mallin.y = alturaGrilla(lugares.mallin.x, lugares.mallin.z);
  lugares.arrayanes.y = alturaGrilla(lugares.arrayanes.x, lugares.arrayanes.z);

  // Muelle: desde la orilla más cercana al refugio, hacia el centro del lago
  {
    const r = lugares.refugio;
    const dx = LAGO.x - r.x, dz = LAGO.z - r.z, l = Math.hypot(dx, dz);
    const ux = dx / l, uz = dz / l;
    let orilla = null;
    for (let t = 0; t < l; t += 1) {
      const x = r.x + ux * t, z = r.z + uz * t;
      if (alturaGrilla(x, z) < 0.25) { orilla = { x: x - ux * 6, z: z - uz * 6 }; break; }
    }
    if (!orilla) orilla = { x: LAGO.x - ux * 100, z: LAGO.z - uz * 100 };
    lugares.muelle = { x: orilla.x, z: orilla.z, ang: Math.atan2(uz, ux), largo: 30, alto: 0.95, nombre: 'Muelle del Lago' };
    lugares.muelle.y = alturaGrilla(orilla.x, orilla.z);
  }
  if (puentes.length) {
    const p = puentes[0];
    lugares.puente = { x: p.x, z: p.z, y: p.alto, nombre: 'Puente de Troncos' };
  }

  // ---------- densidades ----------
  const pendiente = new Float32Array(total);
  const filaPendiente = (j) => {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;
      const hx = alturas[j * N + Math.min(RES, i + 1)] - alturas[j * N + Math.max(0, i - 1)];
      const hz = alturas[Math.min(RES, j + 1) * N + i] - alturas[Math.max(0, j - 1) * N + i];
      pendiente[k] = Math.hypot(hx, hz) / (2 * CELDA);
    }
  };
  for (let j = 0; j < N; j++) filaPendiente(j);
  yield;
  // 2.7.4: lo que no depende del punto se busca una vez, antes de recorrer la grilla (los
  // mismos lugares, radios y el mismo corredor del mirador, calculado igual); antes se
  // armaba una lista de tres pares nueva en cada uno de los 263 mil puntos.
  const lRefugio = lugares.refugio, lMirador = lugares.mirador, lMallin = lugares.mallin;
  const vx = LAGO.x - lMirador.x, vz = LAGO.z - lMirador.z, vl = Math.hypot(vx, vz);
  const muelle = lugares.muelle;
  const filaDensidades = (j) => {
    for (let i = 0; i < N; i++) {
      const x = X(i), z = X(j), k = j * N + i, h = alturas[k];
      let b = smoothstep(-0.48, 0.16, fbm(x * 0.0042 + 11, z * 0.0042 - 7, 3));
      b = Math.max(b, 0.25 * smoothstep(0.1, 0.5, fbm(x * 0.02, z * 0.02, 2)));
      b *= smoothstep(26, 26 * 1.9, Math.hypot(x - lRefugio.x, z - lRefugio.z));
      b *= smoothstep(34, 34 * 1.9, Math.hypot(x - lMirador.x, z - lMirador.z));
      b *= smoothstep(42, 42 * 1.9, Math.hypot(x - lMallin.x, z - lMallin.z));
      {
        // corredor de vista desde el mirador hacia el lago
        const px = x - lMirador.x, pz = z - lMirador.z;
        const a = (px * vx + pz * vz) / vl;
        if (a > 0 && a < 190) {
          const lateral = Math.abs(px * vz - pz * vx) / vl;
          b *= smoothstep(a * 0.32, a * 0.32 + 25, lateral) * 0.85 + 0.15 * smoothstep(40, 190, a);
        }
      }
      // La estepa: hacia el este y el sudeste el bosque se abre y termina.
      // El límite no es recto: lo dibuja el ruido, con manchones de ñires sueltos.
      const bordeEstepa = 120 + simplex(z * 0.0035, 71.3) * 55 + simplex(z * 0.011, 12.7) * 22;
      const estepaAqui = smoothstep(bordeEstepa, bordeEstepa + 120, x) * smoothstep(58, 26, h);
      estepa[k] = estepaAqui;
      b *= 1 - estepaAqui * 0.97;
      b *= smoothstep(2.5, 6, distSendero[k]);
      b *= smoothstep(5.5, 12, distRiel[k]);
      b *= smoothstep(anchoRio[k] + 0.5, anchoRio[k] + 5, distRio[k]);
      b *= smoothstep(0.4, 2.2, h);
      b *= 1 - smoothstep(0.9, 1.6, pendiente[k]) * 0.8;
      b *= smoothstep(14, 26, Math.hypot(x - muelle.x, z - muelle.z));
      bosque[k] = b;

      let p = (1 - b) * 0.85 + 0.1;
      p *= 1 - estepaAqui * 0.82;   // en la estepa el pasto verde deja lugar al coirón
      p *= smoothstep(1.0, 2.6, distSendero[k]);
      p *= smoothstep(2.6, 5.5, distRiel[k]);
      p *= smoothstep(0.15, 0.7, h - Math.max(0, nivelRio[k] > -50 && distRio[k] < anchoRio[k] + 1 ? nivelRio[k] : 0));
      if (distRio[k] < anchoRio[k] + 0.6) p = 0;
      p *= 1 - smoothstep(1.1, 1.8, pendiente[k]);
      pasto[k] = clamp(p, 0, 1);
    }
  };
  for (let j = 0; j < N; j++) {
    filaDensidades(j);
    if (j % FILAS_POR_PASO === FILAS_POR_PASO - 1) yield;
  }

  return {
    alturas, distRio, nivelRio, anchoRio, distSendero, distRiel, bosque, estepa, pasto, pendiente,
    rio, sendero, riel, rielLargo: riel.largo, puentes, puentesRiel, saltoAgua, lugares,
  };
}

// Las consultas sobre los datos del valle (vengan de calcularlos o de la caché).
export function armarTerreno(datos) {
  const { simplex, fbm } = crearRuido(SEMILLA);
  const radioLago = crearRadioLago(simplex);
  const { alturas, distRio, nivelRio, anchoRio, distSendero, distRiel, bosque, estepa, pasto, pendiente,
    rio, sendero, riel, puentes, puentesRiel, saltoAgua, lugares } = datos;
  // el largo de la vía viaja aparte: un arreglo guardado no siempre conserva sus propiedades
  riel.largo = datos.rielLargo;

  // ---------- consultas ----------
  const altura = crearAlturaGrilla(alturas);
  const indice = (x, z) => {
    const i = clamp(Math.round((x + MITAD) / CELDA), 0, RES), j = clamp(Math.round((z + MITAD) / CELDA), 0, RES);
    return j * N + i;
  };
  function normal(x, z) {
    const e = 1.0;
    const hx = altura(x + e, z) - altura(x - e, z), hz = altura(x, z + e) - altura(x, z - e);
    const nx = -hx, ny = 2 * e, nz = -hz, l = Math.hypot(nx, ny, nz);
    return { x: nx / l, y: ny / l, z: nz / l };
  }
  function agua(x, z) {
    const h = altura(x, z);
    if (h < 0 && Math.hypot(x - LAGO.x, z - LAGO.z) < 220) return { nivel: 0, prof: -h, lago: true };
    const k = indice(x, z);
    if (distRio[k] < anchoRio[k] + 0.4 && h < nivelRio[k]) return { nivel: nivelRio[k], prof: nivelRio[k] - h, lago: false };
    return null;
  }

  return {
    alturas, distRio, nivelRio, anchoRio, distSendero, distRiel, bosque, estepa, pasto, pendiente,
    rio, sendero, riel, puentes, puentesRiel, saltoAgua, lugares, radioLago,
    altura, normal, agua, indice,
    ruido: { simplex, fbm },
    val: (arr, x, z) => arr[indice(x, z)],
  };
}

// 2.7.4: los datos de a pasos. Devuelve el iterador de `calcularTerreno`: cada `next()`
// avanza unas filas; el último trae los datos en `value` (para `armarTerreno`).
export function pasosTerreno() { return calcularTerreno(); }

// 2.7.4: los datos de un tirón
export function datosTerreno() {
  const it = calcularTerreno();
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}

export function generarTerreno() {
  return armarTerreno(datosTerreno());
}

// 2.7.4: los arreglos grandes del terreno (lo que se guarda en la caché de la carga), en
// orden, con su tipo. Todos miden N·N.
export const GRILLAS_TERRENO = ['alturas', 'distRio', 'nivelRio', 'anchoRio', 'distSendero', 'distRiel', 'bosque', 'estepa', 'pasto', 'pendiente'];

// 2.7.4: el texto de todo lo que decide los datos del valle: si cambia una coma, la
// huella cambia y la caché vieja no se usa.
export function fuenteTerreno() {
  return [calcularTerreno, catmullRom, smin, indiceSegmentos, X, crearRadioLago, crearAlturaGrilla].map(String).join('\n')
    + fuenteRuido()
    + JSON.stringify({ MITAD, RES, CELDA, N, LAGO, LUGARES, RIO_CONTROL, SENDERO_CONTROL, RIEL_CONTROL, SEMILLA, FILAS_POR_PASO });
}

// 2.7.4: los datos del valle se parten en lo grande (las grillas, que se guardan como
// arreglos) y lo chico (recorridos, puentes y lugares, que se guardan como objetos).
export function partirDatosTerreno(datos) {
  const grillas = {};
  for (const n of GRILLAS_TERRENO) grillas[n] = datos[n];
  const { rio, sendero, riel, rielLargo, puentes, puentesRiel, saltoAgua, lugares } = datos;
  return { grillas, meta: { rio, sendero, riel, rielLargo, puentes, puentesRiel, saltoAgua, lugares } };
}
export function unirDatosTerreno(grillas, meta) { return { ...grillas, ...meta }; }
export function claveTerreno(version) {
  return claveCarga({ que: 'terreno', version, semilla: SEMILLA, fuente: fuenteTerreno() });
}
const esperadoTerreno = () => Object.fromEntries(GRILLAS_TERRENO.map((n) => [n, { tipo: 'Float32Array', bytes: N * N * 4 }]));

// Cede el paso un instante (la pantalla de carga se redibuja) sin la espera mínima de
// los setTimeout encadenados.
const ceder = () => new Promise((listo) => {
  if (globalThis.scheduler?.yield) { globalThis.scheduler.yield().then(listo, listo); return; }
  try { const c = new MessageChannel(); c.port1.onmessage = () => { c.port1.close(); listo(); }; c.port2.postMessage(0); } catch { setTimeout(listo, 0); }
});

// 2.7.4: el terreno para la carga del juego: de la caché si está y sirve; si no, se
// calcula de a pedazos de ~`tajada` ms (soltando la pantalla entre uno y otro) y se
// guarda para la próxima. `info.origen` cuenta cuál fue.
// (armar.mjs no reconoce `export async function`: va como constante)
export const cargarTerreno = async ({ version = versionDelBuild(), tajada = 24, info = {} } = {}) => {
  let clave = null;
  try {
    clave = claveTerreno(version);
    const leido = await leerCache('terreno', clave, esperadoTerreno());
    if (leido && leido.meta) {
      const T = armarTerreno(unirDatosTerreno(leido.partes, leido.meta));
      info.origen = 'caché';
      return T;
    }
  } catch { /* se calcula */ }
  const it = calcularTerreno();
  let r = it.next(), t0 = performance.now();
  while (!r.done) {
    if (performance.now() - t0 > tajada) { await ceder(); t0 = performance.now(); }
    r = it.next();
  }
  const datos = r.value;
  if (clave) {
    // se copia ya, antes de que el juego toque nada (las obras cambian las alturas)
    try { const { grillas, meta } = partirDatosTerreno(datos); guardarCache('terreno', armarRegistro(clave, grillas, meta)); } catch { /* la próxima vez */ }
  }
  info.origen = 'calculado';
  return armarTerreno(datos);
};
