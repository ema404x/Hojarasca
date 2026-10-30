// 4.17.0: el arreo de la majada de Ramón (capítulo 9, D5 = a o c). Reglas PURAS (se prueban en Node): las ovejas siguen al que va adelante (vos, a caballo o a pie) si no se
// alejó mucho; no hay física: cada oveja camina derecho hacia un punto detrás tuyo, con una separación mínima entre ellas. La majada llega cuando vos y la mayoría están
// cerca del destino (el galpón de esquila con D5 = a; el Puesto del Paso con D5 = c). Sin corral que se rompa, sin ovejas que se pierdan: si te alejás, esperan.
export const ARREO = { ovejas: 7, radioLlegada: 16, cerca: 22, sigue: 26, vel: 4.6, velCaballo: 6.5, separacion: 1.5, detras: 3.2, minimas: 5 };
export const DESTINOS_ARREO = { a: { destino: 'galpon-esquila', punto: 'galpon' }, c: { destino: 'puesto-paso', punto: 'puesto-paso' } };

// 4.18.0: `posiciones` (opcional): dónde arranca cada oveja (la oveja escapada, las desparramadas); `min`: cuántas tienen que llegar (por defecto,
// ARREO.minimas: con las desparramadas, todas)
export function crearArreo({ origen, destino, n = ARREO.ovejas, azar = Math.random, posiciones = null, min = null }) {
  const ovejas = [];
  if (Array.isArray(posiciones) && posiciones.length) for (const p of posiciones) ovejas.push({ x: p.x, z: p.z, rumbo: azar() * 6.28, vel: 0 });
  else for (let i = 0; i < n; i++) ovejas.push({ x: origen.x + (azar() - 0.5) * 6, z: origen.z + (azar() - 0.5) * 6, rumbo: azar() * 6.28, vel: 0 });
  return { destino: { x: destino.x, z: destino.z }, ovejas, llegado: false, sigueA: 0, min: Number.isFinite(min) && min > 0 ? Math.floor(min) : ARREO.minimas };
}
// Cuántas ovejas ya están cerca del destino (para el avance de las desparramadas)
export const cercaDelDestino = (A) => (A ? A.ovejas.filter((o) => Math.hypot(o.x - A.destino.x, o.z - A.destino.z) <= ARREO.cerca).length : 0);
// `lider`: { x, z, yaw?, aCaballo? }. Devuelve true la primera vez que llega.
export function pasoArreo(A, lider, dt, alt = null) {
  if (A.llegado) return false;
  dt = Math.min(0.1, Math.max(0, dt));
  const dx = lider.x - A.destino.x, dz = lider.z - A.destino.z;
  // dónde se ponen: detrás de vos, en abanico (si te movés; si no, alrededor tuyo)
  const fx = lider.yaw !== undefined ? -Math.sin(lider.yaw) : 0, fz = lider.yaw !== undefined ? -Math.cos(lider.yaw) : 0;
  let sigue = 0;
  A.ovejas.forEach((o, i) => {
    const dl = Math.hypot(lider.x - o.x, lider.z - o.z);
    const ang = (i / A.ovejas.length) * 6.28 + 0.5;
    const tx = lider.x - fx * ARREO.detras + Math.cos(ang) * (2 + (i % 3)), tz = lider.z - fz * ARREO.detras + Math.sin(ang) * (2 + (i % 3));
    o.vel = 0;
    if (dl > ARREO.sigue) return;   // te fuiste muy lejos: esperan
    sigue++;
    const d = Math.hypot(tx - o.x, tz - o.z);
    if (d > 1.0) {
      const v = Math.min(lider.aCaballo ? ARREO.velCaballo : ARREO.vel, d * 1.6);
      o.x += ((tx - o.x) / d) * v * dt; o.z += ((tz - o.z) / d) * v * dt; o.rumbo = Math.atan2(tx - o.x, tz - o.z); o.vel = v;
    }
  });
  // separación entre ellas
  for (let i = 0; i < A.ovejas.length; i++) for (let j = i + 1; j < A.ovejas.length; j++) {
    const a = A.ovejas[i], b = A.ovejas[j], d = Math.hypot(a.x - b.x, a.z - b.z);
    if (d < ARREO.separacion && d > 0.001) { const e = (ARREO.separacion - d) / 2, ux = (a.x - b.x) / d, uz = (a.z - b.z) / d; a.x += ux * e; a.z += uz * e; b.x -= ux * e; b.z -= uz * e; }
  }
  A.sigueA = sigue;
  const cerca = A.ovejas.filter((o) => Math.hypot(o.x - A.destino.x, o.z - A.destino.z) <= ARREO.cerca).length;
  if (Math.hypot(dx, dz) <= ARREO.radioLlegada && cerca >= Math.min(A.min ?? ARREO.minimas, A.ovejas.length)) { A.llegado = true; return true; }
  return false;
}
