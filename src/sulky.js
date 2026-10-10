// 3.7.5 (rincones): el camino del refugio a la aldea y el sulky que lo recorre, tirado por tu caballo. Reglas puras (se
// prueban en Node con el terreno real); lo que se ve, en rincones-mundo.js; subir, bajar y andar, en rincones-juego.js.
//
// El camino: una huella que sale del palenque del refugio, cruza el bosque y la vía y entra a la aldea por la calle de
// la Vía. Se traza sola sobre el terreno (el camino más barato en una grilla de 4 m: lo llano, sin agua, sin cruzar
// casas ni obras, con poco bosque), se suaviza y se muestrea cada 3 m. Antes de la minga es una huella angosta; con la
// minga (la organiza el equipo de las fiestas: `hacerMinga`) se ensancha, se le echa ripio, se plantan faroles y el
// sulky va más rápido.
//
// El sulky: dónde está (en el refugio o en la aldea, en las dos puntas del camino), cómo se consigue (Tito te lo hace
// por material, con caballo propio) y cómo anda (solo por el camino; W al trote, Shift al galope; 3.8.4: S sostenida frena hasta parar).

export const SULKY = {
  pide: { tabla: 10, tronco: 4 },   // lo que pide Tito para hacerlo
  dias: 1,                          // lo tiene listo a la mañana siguiente
  marcha: { paso: 2.2, trote: 4.6, galope: 7.5 },   // m/s antes de la minga
  conMinga: 1.4,                    // lo que rinde con el camino arreglado
  acelera: 1.6, frena: 3.5,         // m/s²
  radioSubir: 2.4,                  // a cuánto del asiento se sube
};
export const CAMINO = {
  paso: 4,             // la grilla para trazarlo (m)
  muestra: 3,          // la distancia entre puntos del camino ya trazado (m)
  margen: 70,          // lo que se aleja de la línea recta, como mucho (m)
  ancho: 1.6,          // la huella antes de la minga
  anchoMinga: 3.2,     // y después
  despejar: 2.6,       // el radio que se despeja de árboles alrededor de cada punto (desde el principio: es una huella)
  faroles: 34,         // un farol cada tantos metros (con la minga)
  pendienteMax: 0.42,  // más empinado que esto no pasa (se rodea)
  honduraMax: 2.5,     // el arroyo más hondo que esto no se cruza
  costoAgua: 14,       // lo que cuesta cruzar agua (por eso busca lo más angosto)
};

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// Traza el camino entre `desde` y `hasta` ({ x, z }). `T`: el terreno (altura, agua, distRiel/indice si los tiene);
// `evitar`: [{ x, z, radio }] (casas, obras, la aldea); `bosque(x, z)`: 0..1 (opcional). Devuelve [{ x, z }] cada
// CAMINO.muestra metros, desde `desde` hasta `hasta` (o null si no hay paso).
export function trazarCamino(T, desde, hasta, { evitar = [], bosque = null, paso = CAMINO.paso } = {}) {
  const dx = hasta.x - desde.x, dz = hasta.z - desde.z, largo = Math.hypot(dx, dz);
  if (!(largo > 1)) return [{ x: desde.x, z: desde.z }, { x: hasta.x, z: hasta.z }];
  // la grilla: a lo largo de la recta (s) y a los costados (t), con margen
  const ux = dx / largo, uz = dz / largo, nx = -uz, nz = ux, M = CAMINO.margen;
  const NS = Math.ceil(largo / paso) + 1, NT = Math.ceil((2 * M) / paso) + 1, t0 = -M;
  const enMundo = (i, j) => ({ x: desde.x + ux * i * paso + nx * (t0 + j * paso), z: desde.z + uz * i * paso + nz * (t0 + j * paso) });
  const idx = (i, j) => i * NT + j;
  const total = NS * NT;
  const alto = new Float32Array(total), libre = new Uint8Array(total), costo = new Float32Array(total), mojado = new Uint8Array(total);
  for (let i = 0; i < NS; i++) for (let j = 0; j < NT; j++) {
    const k = idx(i, j), w = enMundo(i, j);
    alto[k] = T.altura(w.x, w.z);
    // (el agua del arroyo se cruza con un puentecito de troncos, pero cara: así busca lo más angosto; el lago, no)
    const ag = T.agua?.(w.x, w.z);
    let ok = !ag || (!ag.lago && ag.prof < CAMINO.honduraMax);
    if (ok) for (const e of evitar) if (Math.hypot(w.x - e.x, w.z - e.z) < e.radio) { ok = false; break; }
    libre[k] = ok ? 1 : 0; mojado[k] = ag ? 1 : 0;
    costo[k] = ag ? CAMINO.costoAgua : 1 + (bosque ? clamp(bosque(w.x, w.z), 0, 1) * 1.5 : 0);
  }
  // las puntas siempre libres (están en un lugar elegido a mano)
  const j0 = Math.round(-t0 / paso);
  libre[idx(0, j0)] = 1; libre[idx(NS - 1, j0)] = 1;
  // A* de 8 vecinos con costo por distancia, pendiente y bosque
  const g = new Float32Array(total).fill(Infinity), de = new Int32Array(total).fill(-1), cerrado = new Uint8Array(total);
  const inicio = idx(0, j0), fin = idx(NS - 1, j0);
  const h = (k) => { const i = Math.floor(k / NT), j = k % NT; return Math.hypot((NS - 1 - i) * paso, (j - j0) * paso); };
  // una cola de prioridad simple (montículo binario)
  const monton = [], prio = [];
  const meter = (k, f) => { monton.push(k); prio.push(f); let c = monton.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (prio[p] <= prio[c]) break; [monton[p], monton[c]] = [monton[c], monton[p]]; [prio[p], prio[c]] = [prio[c], prio[p]]; c = p; } };
  const sacar = () => {
    const k = monton[0], ultK = monton.pop(), ultP = prio.pop();
    if (monton.length) {
      monton[0] = ultK; prio[0] = ultP;
      let c = 0;
      for (;;) { const a = 2 * c + 1, b = a + 1; let m = c; if (a < monton.length && prio[a] < prio[m]) m = a; if (b < monton.length && prio[b] < prio[m]) m = b; if (m === c) break; [monton[m], monton[c]] = [monton[c], monton[m]]; [prio[m], prio[c]] = [prio[c], prio[m]]; c = m; }
    }
    return k;
  };
  g[inicio] = 0; meter(inicio, h(inicio));
  const vecinos = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  while (monton.length) {
    const k = sacar();
    if (cerrado[k]) continue;
    cerrado[k] = 1;
    if (k === fin) break;
    const i = Math.floor(k / NT), j = k % NT;
    for (const [a, b] of vecinos) {
      const i2 = i + a, j2 = j + b;
      if (i2 < 0 || i2 >= NS || j2 < 0 || j2 >= NT) continue;
      const k2 = idx(i2, j2);
      if (!libre[k2] || cerrado[k2]) continue;
      const d = Math.hypot(a, b) * paso, pend = Math.abs(alto[k2] - alto[k]) / d;
      // (las barrancas del arroyo las salva el puentecito)
      if (pend > CAMINO.pendienteMax && !mojado[k] && !mojado[k2]) continue;
      const c = d * ((costo[k] + costo[k2]) / 2) * (1 + pend * pend * 30);
      if (g[k] + c < g[k2]) { g[k2] = g[k] + c; de[k2] = k; meter(k2, g[k2] + h(k2)); }
    }
  }
  if (!Number.isFinite(g[fin])) return null;
  const crudo = [];
  for (let k = fin; k >= 0; k = de[k]) { const i = Math.floor(k / NT), j = k % NT; crudo.push(enMundo(i, j)); if (k === inicio) break; }
  crudo.reverse();
  crudo[0] = { x: desde.x, z: desde.z }; crudo[crudo.length - 1] = { x: hasta.x, z: hasta.z };
  return remuestrear(suavizar(crudo, 3), CAMINO.muestra);
}
// Los puentecitos: donde el camino cruza agua, uno de orilla a orilla (con medio metro de más de cada lado):
// [{ x, z, ang (el rumbo del camino), largo, alto (la altura del tablero), s0, s1 }]
export function puentesDelCamino(R, T) {
  const salida = [];
  const P = R.puntos;
  let i = 0;
  while (i < P.length) {
    if (!T.agua?.(P[i].x, P[i].z)) { i++; continue; }
    let j = i;
    while (j + 1 < P.length && T.agua?.(P[j + 1].x, P[j + 1].z)) j++;
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, j + 1)];
    const ang = Math.atan2(b.x - a.x, b.z - a.z), largo = Math.hypot(b.x - a.x, b.z - a.z) + 1.2;
    const alto = Math.max(T.altura(a.x, a.z), T.altura(b.x, b.z)) + 0.25;
    salida.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, ang, largo, alto, s0: R.s[Math.max(0, i - 1)], s1: R.s[Math.min(P.length - 1, j + 1)] });
    i = j + 1;
  }
  return salida;
}
// Chaikin: corta las esquinas (las puntas quedan)
export function suavizar(puntos, veces = 2) {
  let p = puntos;
  for (let n = 0; n < veces; n++) {
    if (p.length < 3) return p;
    const q = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      q.push({ x: a.x * 0.75 + b.x * 0.25, z: a.z * 0.75 + b.z * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, z: a.z * 0.25 + b.z * 0.75 });
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}
// Puntos cada `d` metros a lo largo de la línea
export function remuestrear(puntos, d = CAMINO.muestra) {
  if (!Array.isArray(puntos) || puntos.length < 2) return puntos || [];
  const salida = [{ x: puntos[0].x, z: puntos[0].z }];
  let resto = d;
  for (let i = 1; i < puntos.length; i++) {
    let a = { ...puntos[i - 1] };
    const b = puntos[i];
    let l = Math.hypot(b.x - a.x, b.z - a.z);
    while (l >= resto) {
      const t = resto / l;
      a = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
      salida.push({ x: a.x, z: a.z });
      l -= resto; resto = d;
    }
    resto -= l;
  }
  const u = puntos[puntos.length - 1], ul = salida[salida.length - 1];
  if (Math.hypot(u.x - ul.x, u.z - ul.z) > d * 0.3) salida.push({ x: u.x, z: u.z }); else salida[salida.length - 1] = { x: u.x, z: u.z };
  return salida;
}
// El recorrido: las distancias acumuladas para ubicar algo a `s` metros del principio
export function recorrido(puntos) {
  const s = [0];
  for (let i = 1; i < puntos.length; i++) s.push(s[i - 1] + Math.hypot(puntos[i].x - puntos[i - 1].x, puntos[i].z - puntos[i - 1].z));
  return { puntos, s, largo: s[s.length - 1] || 0 };
}
// Dónde está y para dónde mira a `s` metros: { x, z, rumbo (atan2(dx, dz)), i }
export function enCamino(R, s) {
  const P = R.puntos, S = R.s;
  if (!P.length) return { x: 0, z: 0, rumbo: 0, i: 0 };
  const t = clamp(s, 0, R.largo);
  let lo = 0, hi = S.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= t) lo = m; else hi = m; }
  const a = P[lo], b = P[Math.min(P.length - 1, lo + 1)], seg = Math.max(1e-6, S[Math.min(S.length - 1, lo + 1)] - S[lo]), u = clamp((t - S[lo]) / seg, 0, 1);
  return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, rumbo: Math.atan2(b.x - a.x, b.z - a.z), i: lo };
}
// El punto del camino más cercano a (x, z): { s, d }
export function masCercano(R, x, z) {
  let mejor = { s: 0, d: Infinity };
  for (let i = 0; i < R.puntos.length - 1; i++) {
    const a = R.puntos[i], b = R.puntos[i + 1], ex = b.x - a.x, ez = b.z - a.z, l2 = ex * ex + ez * ez || 1e-9;
    const t = clamp(((x - a.x) * ex + (z - a.z) * ez) / l2, 0, 1), px = a.x + ex * t, pz = a.z + ez * t, d = Math.hypot(x - px, z - pz);
    if (d < mejor.d) mejor = { s: R.s[i] + Math.sqrt(l2) * t, d };
  }
  return mejor;
}
// Los faroles (con la minga): uno cada CAMINO.faroles metros, alternando el costado, sin las puntas
export function farolesDelCamino(R, cada = CAMINO.faroles) {
  const salida = [];
  for (let s = cada * 0.6, n = 0; s < R.largo - cada * 0.4; s += cada, n++) {
    const p = enCamino(R, s), lado = n % 2 ? 1 : -1, off = CAMINO.anchoMinga / 2 + 0.7;
    const nx = Math.cos(p.rumbo), nz = -Math.sin(p.rumbo);   // a la derecha del rumbo
    salida.push({ x: p.x + nx * off * lado, z: p.z + nz * off * lado, rumbo: p.rumbo, s });
  }
  return salida;
}

// ---------------------------------------------------------------- el sulky
// progreso.rincones.sulky: { pedido (día en que se lo pediste a Tito, 0 si no), listo (día desde el que es tuyo), donde:
// 'refugio'|'aldea'|'camino' (con `s`: los metros desde el refugio), atado (el zaino, a las varas), avisado }.
// progreso.rincones.camino: { minga (día de la minga, 0 si todavía no) }
export const sulkyNuevo = () => ({ pedido: 0, listo: 0, donde: 'refugio' });
export function sanearSulky(v, hoy = Infinity) {
  const b = sulkyNuevo();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return b;
  const n = (x) => { const k = Math.floor(Number(x)); return Number.isFinite(k) && k > 0 ? Math.min(hoy, k) : 0; };
  b.pedido = n(v.pedido); b.listo = b.pedido ? Math.max(b.pedido, n(v.listo)) : 0;
  if (b.listo && b.listo < b.pedido + SULKY.dias) b.listo = b.pedido + SULKY.dias;
  b.donde = v.donde === 'aldea' ? 'aldea' : v.donde === 'camino' && Number.isFinite(Number(v.s)) && Number(v.s) >= 0 ? 'camino' : 'refugio';
  // (dónde quedó, si lo dejaste a mitad de camino; si el zaino quedó atado a las varas; si ya te avisó Tito)
  if (b.donde === 'camino') b.s = Math.min(5000, Number(v.s));
  if (b.listo && v.atado === true) b.atado = true;
  if (b.listo && v.avisado === true) b.avisado = true;
  return b;
}
export const caminoNuevo = () => ({ minga: 0 });
export function sanearCaminoAldea(v, hoy = Infinity) {
  const n = Math.floor(Number(v?.minga));
  return { minga: Number.isFinite(n) && n > 0 ? Math.min(hoy, n) : 0 };
}
export const tieneSulky = (sk, dia, hora = 12) => !!sk?.listo && (dia > sk.listo || (dia === sk.listo && hora >= 7));
export function pedirSulky(sk, tengo, dia, conCaballo) {
  if (!sk) return { ok: false };
  if (sk.pedido) return { ok: false, motivo: 'ya' };
  if (!conCaballo) return { ok: false, motivo: 'caballo' };
  const falta = Object.entries(SULKY.pide).find(([k, n]) => (Number(tengo('material', k)) || 0) < n);
  if (falta) return { ok: false, motivo: 'falta', falta: { k: falta[0], n: falta[1] } };
  const d = Math.max(1, Math.floor(Number(dia) || 1));
  sk.pedido = d; sk.listo = d + SULKY.dias; sk.donde = 'refugio';
  return { ok: true, efectos: Object.entries(SULKY.pide).map(([k, n]) => ({ tipo: 'material', k, n: -n })) };
}
export const caminoArreglado = (cam) => !!cam?.minga;
// La minga del camino (la llama el equipo de las fiestas el día de la minga): { ok, nueva }
export function hacerMinga(cam, dia) {
  if (!cam) return { ok: false };
  if (cam.minga) return { ok: true, nueva: false };
  cam.minga = Math.max(1, Math.floor(Number(dia) || 1));
  return { ok: true, nueva: true };
}
// La velocidad que busca el sulky según lo que apretás: 'paso' (S), 'trote' (nada o W), 'galope' (Shift)
export function velocidadSulky(marcha, minga = false) {
  const v = SULKY.marcha[marcha] ?? SULKY.marcha.trote;
  return minga ? v * SULKY.conMinga : v;
}
// 3.8.4: la velocidad a la que va con lo que apretás (`frena`: S sostenida; `galope`: Shift). Mantener S frena hasta
// parar (antes S era «al paso» y sólo paraba ya casi quieto: sostenida, nunca frenaba del todo); sin nada, al trote.
export function objetivoSulky({ frena = false, galope = false } = {}, minga = false) {
  if (frena) return 0;
  return velocidadSulky(galope ? 'galope' : 'trote', minga);
}
// Un paso del sulky andando: { s, v, sentido (+1 hacia la aldea, −1 hacia el refugio) } → { s, v, llego }
export function andarSulky(est, dt, objetivo, largo) {
  const dv = objetivo - est.v;
  est.v += clamp(dv, -SULKY.frena * dt, SULKY.acelera * dt);
  est.v = Math.max(0, est.v);
  // se frena solo al llegar (los últimos 8 m)
  const queda = est.sentido > 0 ? largo - est.s : est.s;
  if (queda < 8) est.v = Math.min(est.v, Math.max(0.6, queda * 0.6));
  est.s = clamp(est.s + est.v * est.sentido * dt, 0, largo);
  const llego = est.sentido > 0 ? est.s >= largo - 0.05 : est.s <= 0.05;
  if (llego) est.v = 0;
  return { s: est.s, v: est.v, llego };
}
