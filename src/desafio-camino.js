// 4.10 coihue: el Coihue Viejo camina hacia tu base durante el asedio (reglas puras: sin three ni DOM).
//
// Una vez plantado, cada noche del asedio el árbol se pone en marcha unas horas y avanza unos metros por una
// ruta que se calcula de antemano (sin agua, sin obras, sin la vía ni los lugares del valle). Cuanto más
// zonas libres, más despacio. Se lo puede frenar:
//   · las raíces: si les pegás con lo que tengas (arco, honda, lanza, hacha...), a los X golpes se le
//     traban y se queda parado un rato (con una pausa antes de que se pueda trabar otra vez);
//   · las trampas: si pisa una (pozo, red, abrojos, miel, lazo, foso, estacas), se enreda un rato y la rompe
//     de a poco;
//   · de día, las raíces heridas le rebajan el paso de la noche que viene.
// Si llega a tu base («llegó»), el cerco cae de golpe y la puertita se abre sola. No cambia la victoria: el
// corazón se sube igual, con el Rey Duende adentro.
//
// El tiempo se cuenta en horas de juego desde que cae la noche (`hn`, 0 a 9,5): así el avance no depende de
// los fps ni de cuántos segundos dura el día, y dormir (que salta la hora) lo hace caminar igual.

export const CAMINO = {
  llegada: 24,          // a cuántos metros del centro de tu base «llega» (el cerco está más adentro)
  noches: 5,            // en cuántas noches llegaría si nadie lo frena y no hubiera zonas libres
  minimoNoche: 4,       // metros por noche, como mínimo, en el ritmo base
  desde: 0.5,           // la caminata arranca a la media hora de caer la noche...
  ventana: 6,           // ...y dura estas horas de juego
  porZonaLibre: 0.08,   // cada zona libre le rebaja el paso
  pisoRitmo: 0.45,      // nunca baja de esta fracción del paso base por zonas libres
  vidaPies: 170,        // daño a las raíces para que se le trabe una (por la vida de la dificultad)
  atascoCorte: 0.7,     // horas de juego quieto por una raíz trabada
  atascoTrampa: 0.5,    // ...y por una trampa
  atascoMax: 1.5,       // lo más que se le acumula quieto
  inmune: 1.2,          // horas después de trabarse en que no se le traba otra por golpes
  rebajaDia: 0.1,       // lo que una raíz cortada de día le rebaja el paso de la noche que viene
  rebajaMax: 0.3,
  celda: 6,             // la grilla de la ruta (metros)
  puntosMax: 120,
};

const num = (v, def = 0) => (v !== null && v !== '' && typeof v !== 'boolean' && Number.isFinite(Number(v)) ? Number(v) : def);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const r1 = (v) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------- la ruta
export function largoRuta(ruta) {
  let l = 0;
  for (let i = 1; i < ruta.length; i++) l += Math.hypot(ruta[i][0] - ruta[i - 1][0], ruta[i][1] - ruta[i - 1][1]);
  return l;
}
// El punto a `d` metros del principio y hacia dónde va ahí (vector unitario).
export function puntoEnRuta(ruta, d) {
  if (!ruta?.length) return null;
  let resto = Math.max(0, d);
  for (let i = 1; i < ruta.length; i++) {
    const dx = ruta[i][0] - ruta[i - 1][0], dz = ruta[i][1] - ruta[i - 1][1], l = Math.hypot(dx, dz);
    if (l < 1e-6) continue;
    if (resto <= l) return { x: ruta[i - 1][0] + dx * resto / l, z: ruta[i - 1][1] + dz * resto / l, dx: dx / l, dz: dz / l };
    resto -= l;
  }
  const n = ruta.length - 1;
  let dx = 0, dz = 1;
  if (n > 0) { dx = ruta[n][0] - ruta[n - 1][0]; dz = ruta[n][1] - ruta[n - 1][1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; }
  return { x: ruta[n][0], z: ruta[n][1], dx, dz };
}

// La ruta de `desde` hasta quedar a `llegada` de `base`, por la grilla (A*), esquivando lo que `libre(x, z)` marque
// como ocupado. `costo(x, z)` (opcional) suma esfuerzo (ladera, monte cerrado): devuelve 0 o más. Devuelve
// [[x, z], ...] o null si no hay camino.
// 4.11.3 (H2-3 c): la búsqueda es un generador que cede el paso cada tanto (`medida.gastado` llegó a `medida.tope`): `rutaDelCoihue` la corre entera de una vez
// (como siempre) y `crearBusquedaRuta` la reparte en cuadros. Es el MISMO código: la ruta sale idéntica. Una unidad es una celda mirada con `libre` o un nodo abierto.
function* buscarRuta(desde, base, libre, { llegada = CAMINO.llegada, celda = CAMINO.celda, costo = null, margen = 70, limite = 1e9 }, medida) {
  const x0 = Math.max(-limite, Math.min(desde.x, base.x) - margen), x1 = Math.min(limite, Math.max(desde.x, base.x) + margen);
  const z0 = Math.max(-limite, Math.min(desde.z, base.z) - margen), z1 = Math.min(limite, Math.max(desde.z, base.z) + margen);
  const nx = Math.max(2, Math.ceil((x1 - x0) / celda)), nz = Math.max(2, Math.ceil((z1 - z0) / celda));
  const N = nx * nz;
  if (N > 40000) return null;
  const cx = (i) => x0 + (i % nx + 0.5) * celda, cz = (i) => z0 + (Math.floor(i / nx) + 0.5) * celda;
  const celdaDe = (x, z) => clamp(Math.floor((z - z0) / celda), 0, nz - 1) * nx + clamp(Math.floor((x - x0) / celda), 0, nx - 1);
  const estado = new Int8Array(N);   // 0 sin mirar, 1 libre, 2 ocupada
  const abierto = (i) => {
    if (estado[i] === 0) { medida.gastado++; estado[i] = libre(cx(i), cz(i)) ? 1 : 2; }
    return estado[i] === 1;
  };
  const inicio = celdaDe(desde.x, desde.z);
  estado[inicio] = 1;
  const g = new Float64Array(N).fill(Infinity), padre = new Int32Array(N).fill(-1), cerrado = new Uint8Array(N);
  const heur = (i) => Math.max(0, Math.hypot(cx(i) - base.x, cz(i) - base.z) - llegada);
  const esMeta = (i) => Math.hypot(cx(i) - base.x, cz(i) - base.z) <= llegada + celda * 0.7;
  // montículo binario (f, índice)
  const hf = [], hi = [];
  const subir = (k) => { while (k > 0) { const p = (k - 1) >> 1; if (hf[p] <= hf[k]) break; [hf[p], hf[k]] = [hf[k], hf[p]]; [hi[p], hi[k]] = [hi[k], hi[p]]; k = p; } };
  const bajar = (k) => { for (;;) { let m = k; const a = 2 * k + 1, b = a + 1; if (a < hf.length && hf[a] < hf[m]) m = a; if (b < hf.length && hf[b] < hf[m]) m = b; if (m === k) break; [hf[m], hf[k]] = [hf[k], hf[m]]; [hi[m], hi[k]] = [hi[k], hi[m]]; k = m; } };
  const meter = (f, i) => { hf.push(f); hi.push(i); subir(hf.length - 1); };
  g[inicio] = 0; meter(heur(inicio), inicio);
  let meta = -1;
  while (hf.length) {
    const i = hi[0];
    const ult = hf.pop(), uli = hi.pop();
    if (hf.length) { hf[0] = ult; hi[0] = uli; bajar(0); }
    if (cerrado[i]) continue;
    cerrado[i] = 1;
    medida.gastado++;
    if (medida.gastado >= medida.tope) yield;
    if (esMeta(i)) { meta = i; break; }
    const ix = i % nx, iz = Math.floor(i / nx);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const jx = ix + dx, jz = iz + dz;
      if (jx < 0 || jz < 0 || jx >= nx || jz >= nz) continue;
      const j = jz * nx + jx;
      if (cerrado[j] || !abierto(j)) continue;
      // en diagonal tampoco se corta una esquina ocupada
      if (dx && dz && (!abierto(iz * nx + jx) || !abierto(jz * nx + ix))) continue;
      const paso = (dx && dz ? 1.4142 : 1) * celda * (1 + (costo ? Math.max(0, costo(cx(j), cz(j))) : 0));
      const gj = g[i] + paso;
      if (gj < g[j]) { g[j] = gj; padre[j] = i; meter(gj + heur(j), j); }
    }
  }
  if (meta < 0) return null;
  const celdas = [];
  for (let i = meta; i >= 0; i = padre[i]) celdas.push(i);
  celdas.reverse();
  let puntos = [[desde.x, desde.z], ...celdas.slice(1).map((i) => [cx(i), cz(i)])];
  // se estira: se saltea cada punto desde el que el siguiente se ve en línea recta sin tocar nada
  const recta = (a, b) => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(l / (celda * 0.5)));
    for (let k = 1; k <= n; k++) { const t = k / n; medida.gastado++; if (!libre(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false; }
    return true;
  };
  const lisa = [puntos[0]];
  let i = 0;
  while (i < puntos.length - 1) {
    let j = puntos.length - 1;
    while (j > i + 1 && !recta(puntos[i], puntos[j])) { j--; if (medida.gastado >= medida.tope) yield; }
    lisa.push(puntos[j]);
    i = j;
  }
  return lisa.slice(0, CAMINO.puntosMax).map(([x, z]) => [r1(x), r1(z)]);
}
export function rutaDelCoihue(desde, base, libre, opciones = {}) {
  return buscarRuta(desde, base, libre, opciones, { gastado: 0, tope: Infinity }).next().value;
}
// 4.11.3 (H2-3 c): la misma búsqueda, repartida. `avanzar(unidades)` trabaja hasta gastar ese presupuesto y devuelve si terminó; el resultado queda en
// `resultado` (la ruta o null, igual que `rutaDelCoihue`) y `gastado` cuenta lo trabajado hasta ahora.
export function crearBusquedaRuta(desde, base, libre, opciones = {}) {
  const medida = { gastado: 0, tope: 0 };
  const it = buscarRuta(desde, base, libre, opciones, medida);
  const b = {
    listo: false, resultado: null,
    get gastado() { return medida.gastado; },
    avanzar(unidades) {
      if (b.listo) return true;
      medida.tope = medida.gastado + Math.max(1, Number(unidades) || 1);
      const r = it.next();
      if (r.done) { b.listo = true; b.resultado = r.value; }
      return b.listo;
    },
  };
  return b;
}
// Si no hay camino (una isla, un cerco cerrado del todo): la recta, y se anota como tal.
export function rutaRecta(desde, base, llegada = CAMINO.llegada) {
  const dx = base.x - desde.x, dz = base.z - desde.z, l = Math.hypot(dx, dz) || 1;
  const k = Math.max(0, l - llegada) / l;
  return [[r1(desde.x), r1(desde.z)], [r1(desde.x + dx * k), r1(desde.z + dz * k)]];
}

// ---------------------------------------------------------------- el estado
// `ruta` ya calculada; `interior`: el sitio del llano donde se arma el corazón (no cambia aunque camine).
export function caminoNuevo({ ruta, base, interior, recta = false, llegada = CAMINO.llegada }) {
  if (!Array.isArray(ruta) || ruta.length < 2) return null;
  const largo = largoRuta(ruta);
  return {
    ruta, largo, d: 0, base: { x: base.x, z: base.z }, interior: { x: interior.x, z: interior.z },
    llegada, recta: !!recta, rastro: [[ruta[0][0], ruta[0][1]]], cerco: false,
    porNoche: r1(Math.max(CAMINO.minimoNoche, Math.max(0, largo) / CAMINO.noches)),
    heridas: 0, atasco: 0, inmune: 0, rebaja: 0, cortes: 0, noche: -1, ultima: -1,
    llego: largo <= 0.5, caminadas: 0, avisoNoche: -1,
  };
}
export function sanearCamino(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  if (!Array.isArray(c.ruta)) return null;
  const ruta = [];
  for (const p of c.ruta.slice(0, CAMINO.puntosMax)) {
    if (!Array.isArray(p) || p.length < 2 || p[0] === null || p[1] === null || typeof p[0] === 'boolean' || typeof p[1] === 'boolean') continue;
    const x = Number(p[0]), z = Number(p[1]);
    if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 1e5 || Math.abs(z) > 1e5) continue;
    ruta.push([r1(x), r1(z)]);
  }
  if (ruta.length < 2) return null;
  const punto = (p) => (p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.z)) && p.x !== null && p.z !== null ? { x: Number(p.x), z: Number(p.z) } : null);
  const base = punto(c.base), interior = punto(c.interior);
  if (!base || !interior) return null;
  const largo = largoRuta(ruta);
  const llegada = clamp(num(c.llegada, CAMINO.llegada), 8, 80);
  const d = clamp(num(c.d, 0), 0, largo);
  return {
    ruta, largo, d, base, interior, llegada, recta: !!c.recta,
    porNoche: clamp(num(c.porNoche, CAMINO.minimoNoche), 1, 80),
    heridas: clamp(num(c.heridas, 0), 0, 1e5), atasco: clamp(num(c.atasco, 0), 0, CAMINO.atascoMax),
    inmune: clamp(num(c.inmune, 0), 0, CAMINO.inmune), rebaja: clamp(num(c.rebaja, 0), 0, CAMINO.rebajaMax),
    cortes: Math.floor(clamp(num(c.cortes, 0), 0, 99)),
    noche: Math.floor(clamp(num(c.noche, -1), -1, 1e6)), ultima: clamp(num(c.ultima, -1), -1, 12),
    llego: !!c.llego || largo - d <= 0.5, cerco: !!c.cerco, rastro: sanearRastro(c.rastro, ruta[0]), caminadas: Math.floor(clamp(num(c.caminadas, 0), 0, 1e4)), avisoNoche: Math.floor(clamp(num(c.avisoNoche, -1), -1, 1e6)),
  };
}

// Por dónde pasó, cada 5 m (las huellas de raíces en el suelo).
export const RASTRO_CADA = 5, RASTRO_MAX = 80;
function sanearRastro(v, inicio) {
  const l = [];
  if (Array.isArray(v)) for (const p of v.slice(0, RASTRO_MAX)) {
    if (!Array.isArray(p) || p.length < 2 || p[0] === null || p[1] === null || typeof p[0] === 'boolean' || typeof p[1] === 'boolean') continue;
    const x = Number(p[0]), z = Number(p[1]);
    if (Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) < 1e5 && Math.abs(z) < 1e5) l.push([r1(x), r1(z)]);
  }
  return l.length ? l : [[inicio[0], inicio[1]]];
}
// Anota el punto de ahora si se alejó lo suficiente del último. Devuelve si sumó uno.
export function anotarRastro(c, x, z) {
  const u = c.rastro[c.rastro.length - 1];
  if (Math.hypot(x - u[0], z - u[1]) < RASTRO_CADA) return false;
  c.rastro.push([r1(x), r1(z)]);
  if (c.rastro.length > RASTRO_MAX) c.rastro.shift();
  return true;
}
export const posicionCamino = (c) => puntoEnRuta(c.ruta, c.d);
// Metros que le faltan a la base en línea recta (lo que dice el HUD y el mapa).
export function metrosABase(c, pos = null) {
  const p = pos || posicionCamino(c);
  return p ? Math.max(0, Math.hypot(p.x - c.base.x, p.z - c.base.z) - c.llegada) : 0;
}
export const faltaCamino = (c) => Math.max(0, c.largo - c.d);

// Cuánto avanza por hora de juego, con las zonas libres de ahora.
export function ritmoCamino(c, libres = 0) {
  const zonas = Math.max(CAMINO.pisoRitmo, 1 - CAMINO.porZonaLibre * Math.max(0, libres));
  return (c.porNoche / CAMINO.ventana) * zonas * (1 - clamp(c.rebaja, 0, CAMINO.rebajaMax));
}
// ¿Esta hora (desde que cayó la noche) está dentro de la caminata?
export const enVentana = (hn) => hn >= CAMINO.desde && hn < CAMINO.desde + CAMINO.ventana;
// Horas desde que cae la noche (HORA_ATAQUE = 20,5): 0 a 9,5.
export function horasDeNoche(horas, horaAtaque = 20.5) {
  const h = ((Number(horas) % 24) + 24) % 24;
  return h >= horaAtaque ? h - horaAtaque : h + (24 - horaAtaque);
}

export function empezarNocheCamino(c, noche) {
  if (!c) return;
  c.noche = Math.floor(noche); c.ultima = -1; c.atasco = 0; c.cortes = 0;
}
// Cada cuadro de noche con la hora de ahora. Devuelve { avance (m), camina (bool), llego (bool, recién) }.
// `libres`: zonas libres del asedio.
export function tickCamino(c, hn, libres = 0) {
  const r = { avance: 0, camina: false, llego: false };
  if (!c) return r;
  // (el primer cuadro de la noche cuenta desde que cayó la noche; si no hay referencia y ya es tarde, no se regala nada)
  const desde = c.ultima >= 0 ? c.ultima : hn <= 2.5 ? 0 : hn;
  const dh = hn >= desde && hn - desde < 10 ? hn - desde : 0;
  const antes = desde;
  c.ultima = hn;
  const quieto = Math.min(dh, c.atasco);
  c.atasco = Math.max(0, c.atasco - dh);
  c.inmune = Math.max(0, c.inmune - dh);
  if (c.llego) return r;
  // el pedazo de este paso que cae dentro de la ventana, sin lo que estuvo trabado
  const horas = Math.max(0, Math.min(hn, CAMINO.desde + CAMINO.ventana) - Math.max(antes, CAMINO.desde));
  const util = Math.max(0, horas - quieto);
  if (util > 0) {
    const m = Math.min(faltaCamino(c), ritmoCamino(c, libres) * util);
    c.d += m; r.avance = m;
    if (faltaCamino(c) <= 0.5) { c.d = c.largo; c.llego = true; r.llego = true; }
  }
  r.camina = !c.llego && enVentana(hn) && c.atasco <= 0;
  return r;
}
// Al amanecer (o si dormiste de corrido): lo que faltaba caminar de la ventana, caminado. Devuelve { avance, llego }.
export function cerrarNocheCamino(c, libres = 0) {
  if (!c) return { avance: 0, llego: false };
  let avance = 0, llego = false;
  if (!c.llego && c.noche >= 0) {
    const resto = c.ultima < 0 ? CAMINO.ventana : Math.max(0, CAMINO.desde + CAMINO.ventana - Math.max(c.ultima, CAMINO.desde));
    const util = Math.max(0, resto - c.atasco);
    if (util > 0) {
      const m = Math.min(faltaCamino(c), ritmoCamino(c, libres) * util);
      c.d += m; avance = m;
      if (faltaCamino(c) <= 0.5) { c.d = c.largo; c.llego = true; llego = true; }
    }
  }
  c.caminadas = (c.caminadas || 0) + 1;
  c.ultima = -1; c.atasco = 0; c.inmune = 0; c.rebaja = 0; c.cortes = 0; c.noche = -1;
  return { avance, llego };
}

// ---------------------------------------------------------------- frenarlo
// Un golpe a las raíces. `vida`: el multiplicador de la dificultad. Devuelve { corte } si se trabó una.
export function herirPies(c, dano, { deNoche = true, vida = 1 } = {}) {
  if (!c || c.llego || !(dano > 0)) return { ok: false, corte: false };
  const umbral = CAMINO.vidaPies * clamp(num(vida, 1), 0.5, 2);
  if (deNoche && c.inmune > 0) return { ok: true, corte: false, inmune: true };
  c.heridas += dano;
  if (c.heridas < umbral) return { ok: true, corte: false };
  c.heridas = 0;
  c.cortes++;
  if (deNoche) {
    c.atasco = Math.min(CAMINO.atascoMax, c.atasco + CAMINO.atascoCorte);
    c.inmune = CAMINO.inmune;
  } else c.rebaja = Math.min(CAMINO.rebajaMax, c.rebaja + CAMINO.rebajaDia);
  return { ok: true, corte: true, deNoche };
}
export function pisarTrampa(c) {
  if (!c || c.llego) return false;
  c.atasco = Math.min(CAMINO.atascoMax, c.atasco + CAMINO.atascoTrampa);
  return true;
}
// Qué tan trabado está (para la animación): 0 camina, 1 clavado.
export const trabado = (c) => !!c && !c.llego && c.atasco > 0;

// ---------------------------------------------------------------- lo que se dice
export function textoCamino(c) {
  if (!c) return '';
  const m = Math.round(metrosABase(c));
  if (c.llego) return 'el Coihue está sobre tu base';
  return `el Coihue está a ${m} m de tu base`;
}
export function avisoNocheCamino(c, libres = 0) {
  const m = Math.round(ritmoCamino(c, libres) * CAMINO.ventana);
  return `Avanza unos ${Math.max(1, m)} m esta noche. Quedan ${Math.round(metrosABase(c))} m hasta tu base`;
}
// Para el mapa de papel: la ruta que le queda y lo que ya pisó.
export function rutaRestante(c) {
  if (!c?.ruta?.length) return [];
  const p = posicionCamino(c);
  let resto = c.d;
  let i = 1;
  for (; i < c.ruta.length; i++) {
    const l = Math.hypot(c.ruta[i][0] - c.ruta[i - 1][0], c.ruta[i][1] - c.ruta[i - 1][1]);
    if (resto <= l) break;
    resto -= l;
  }
  return [[p.x, p.z], ...c.ruta.slice(Math.min(i, c.ruta.length))];
}
export function marcasCamino(c) {
  if (!c) return [];
  const m = [];
  const falta = rutaRestante(c);
  if (!c.llego && falta.length >= 2) m.push({ x: falta[0][0], z: falta[0][1], nombre: '', clase: 'ruta', puntos: falta });
  return m;
}
