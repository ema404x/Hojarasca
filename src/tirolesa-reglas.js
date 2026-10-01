// 2.9: las reglas de la tirolesa y del puente colgante, sin three ni DOM (se prueban en
// Node). Los dos se arman con dos puntas: dos postes de tirolesa o dos estribos de puente.
// Cada punta terminada se empareja con la más cercana de su tipo que esté a una
// distancia posible y con la línea libre (ver `emparejar`). El dibujo, la física y el
// viaje por el cable están en `tirolesa.js`.

export const TIROLESA = {
  plano: 'poste-tirolesa',
  altoCable: 3.6,       // el cable se ata a 3,6 m del pie del poste
  colgado: 2.05,        // de los pies al cable, colgado de la roldana
  largoMin: 8, largoMax: 80,
  pendienteMax: 0.5,    // más empinada que esto no se tiende (se llega volando)
  comba: 0.02,          // cuánto baja el cable en el medio, por metro de largo
  llano: 0.35,          // hasta esta subida (m) se considera pareja: se va tirando a mano
  velMax: 15, velMano: 1.1, arranque: 1.6,
};

export const PUENTE = {
  plano: 'estribo-puente',
  altoPiso: 0.45,       // el piso del estribo y la punta del puente
  radioEstribo: 0.7,    // el puente arranca en el borde del estribo
  largoMin: 3, largoMax: 30,
  pendienteMax: 0.3,
  comba: 0.025, combaMax: 0.6,
  ancho: 1.0,
};

const acotar = (v, a, b) => (v < a ? a : v > b ? b : v);

// La altura del cable (o del piso del puente) en t ∈ [0, 1] entre dos puntas a la altura
// ya y yb, con la comba (m) en el medio.
export function alturaCurva(ya, yb, t, comba) {
  return ya + (yb - ya) * t - 4 * comba * t * (1 - t);
}
export function combaTirolesa(largo) { return TIROLESA.comba * largo; }
export function combaPuente(largo) { return Math.min(PUENTE.combaMax, PUENTE.comba * largo); }

// Desde qué lado se puede largar: sólo bajando o parejo. Subiendo, no (sin motor ni
// alguien que tire, no hay cómo).
export function sentidoTirolesa(yDesde, yHasta) {
  const d = yHasta - yDesde;
  if (d > TIROLESA.llano) return 'sube';
  if (d < -TIROLESA.llano) return 'baja';
  return 'llano';
}

// Un paso del viaje: `s` recorrido (m), `v` velocidad (m/s), `pendiente` = dy/ds en el
// sentido del viaje (negativa bajando). La gravedad empuja, el roce frena. Si se queda sin
// envión (en el llano o en la comba del final), se sigue tirando a mano, despacio.
// `resta` (m hasta el final): el freno de resorte del último tramo, para no llegar volando.
export function avanzarCable(s, v, dt, pendiente, resta = Infinity) {
  dt = acotar(Number(dt) || 0, 0, 0.1);
  const g = 9.8;
  const sen = pendiente / Math.sqrt(1 + pendiente * pendiente);
  let a = -g * sen - 0.05 * v - 0.012 * v * v - 0.15;
  let nv = v + a * dt;
  let aMano = false;
  if (nv < TIROLESA.velMano) { nv = TIROLESA.velMano; aMano = true; }
  nv = Math.min(TIROLESA.velMax, nv, Math.max(TIROLESA.velMano, 1.2 + Math.max(0, resta) * 0.8));
  return { s: s + nv * dt, v: nv, aMano };
}

// Empareja las puntas. `puntas`: [{ id, x, y, z }]. `revisar(a, b)` → { ok, motivo }.
// Se prueban los pares del más corto al más largo; cada punta va con una sola.
// Devuelve { pares: [{ a, b, largo }], sueltas: Map(id → motivo) }.
export function emparejar(puntas, largoMin, largoMax, revisar) {
  const candidatos = [];
  for (let i = 0; i < puntas.length; i++) for (let j = i + 1; j < puntas.length; j++) {
    const a = puntas[i], b = puntas[j];
    const largo = Math.hypot(b.x - a.x, b.z - a.z);
    if (largo < largoMin || largo > largoMax) continue;
    candidatos.push({ a, b, largo });
  }
  candidatos.sort((p, q) => p.largo - q.largo || String(p.a.id).localeCompare(String(q.a.id)));
  const usadas = new Set(), pares = [], motivos = new Map();
  for (const c of candidatos) {
    if (usadas.has(c.a.id) || usadas.has(c.b.id)) continue;
    const r = revisar ? revisar(c.a, c.b) : { ok: true };
    if (r && r.ok) { pares.push(c); usadas.add(c.a.id); usadas.add(c.b.id); continue; }
    // lo que falló con la más cercana es lo que se le cuenta al jugador
    for (const p of [c.a, c.b]) if (!motivos.has(p.id)) motivos.set(p.id, (r && r.motivo) || 'La línea no está libre');
  }
  const sueltas = new Map();
  for (const p of puntas) {
    if (usadas.has(p.id)) continue;
    sueltas.set(p.id, motivos.get(p.id) || `Falta la otra punta (entre ${largoMin} y ${largoMax} m)`);
  }
  return { pares, sueltas };
}

// ¿Se puede tender la línea? `suelo(x, z)` = el suelo o el agua, lo que esté más alto;
// `arbolEn(ax, az, bx, bz, margen)` → true si un tronco se cruza. `a`, `b`: { x, y, z }
// con la altura del cable (tirolesa) o del piso (puente) en cada punta.
export function revisarLinea(tipo, a, b, suelo, arbolEn = null) {
  const largo = Math.hypot(b.x - a.x, b.z - a.z);
  const esTirolesa = tipo === 'tirolesa';
  const R = esTirolesa ? TIROLESA : PUENTE;
  if (largo < R.largoMin) return { ok: false, motivo: 'Las dos puntas están muy juntas' };
  if (largo > R.largoMax) return { ok: false, motivo: `Muy lejos: hasta ${R.largoMax} m` };
  if (Math.abs(b.y - a.y) / largo > R.pendienteMax) return { ok: false, motivo: esTirolesa ? 'Demasiado empinada' : 'Una punta está muy alta: el puente quedaría en rampa' };
  const comba = esTirolesa ? combaTirolesa(largo) : combaPuente(largo);
  const n = Math.max(8, Math.ceil(largo / 1.5));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
    const y = alturaCurva(a.y, b.y, t, comba);
    const piso = suelo(x, z);
    if (esTirolesa) {
      // colgado, los pies van a 2 m del cable; cerca de los postes se tolera un poco
      const margen = t < 0.1 || t > 0.9 ? -0.3 : 0.25;
      if (y - TIROLESA.colgado < piso + margen) return { ok: false, motivo: 'El cable pasa muy bajo: los pies tocarían el suelo' };
    } else if (t > 0.06 && t < 0.94 && y - 0.12 < piso) return { ok: false, motivo: 'El puente toca el suelo en el medio' };
  }
  if (arbolEn && arbolEn(a.x, a.z, b.x, b.z, esTirolesa ? 0.8 : 0.9)) return { ok: false, motivo: 'Hay un árbol en el medio' };
  return { ok: true, largo, comba };
}
