// 4.0.3: un caminante que replica la física de `jugador.js` (radio 0,35, alto 1,65, escalón 0,62, coyote, cuesta abajo, `paredEntre`) sobre el mundo de
// construcción de `ayuda-4-0-1-mundo.mjs`. Adaptado de los arneses de la zona I de la 2.ª ronda de bugs. Lo usan las verificar-4-0-3-*.
import { mundo as mundoBase, M, C, THREE } from './ayuda-4-0-1-mundo.mjs';
export { M, C, THREE };

// terreno inclinado: altura k·z
export function terreno(k = 0, extra = {}) {
  const n = new THREE.Vector3(0, 1, -k).normalize();
  return { altura: (x, z) => k * z, normal: () => n, ...extra };
}
export const mundo = (T = {}) => mundoBase(T);

export const R = 0.35, H = 1.65, ESC = 0.62;
export function paso(w, q, dx, dz) {
  const { col, T } = w; const dt = 1 / 60;
  if (q.vy === undefined) { q.vy = 0; q.enSuelo = true; q.coyote = 0; }
  const px = q.x, pz = q.z;
  q.x += dx; q.z += dz;
  col.resolver(q, R, H);
  col.resolverPlataformas(q, R, H, ESC);
  if (col.paredEntre(px, pz, q.x, q.z, q.y + 0.2, q.y + H - 0.1, false)) { q.x = px; q.z = pz; }
  let suelo = T.altura(q.x, q.z);
  const sub = (q.enSuelo || q.coyote > 0) && q.vy <= 0 ? 0.62 : 0.015;
  let plat = col.plataformaEn(q.x, q.z, q.y, sub);
  if (plat && plat.alto > q.y + 0.03 && !col.espacioVerticalLibre(q.x, q.z, plat.alto, H)) plat = col.plataformaEn(q.x, q.z, q.y, 0.015);
  if (plat && plat.alto > suelo) suelo = plat.alto;
  const ag = plat ? null : T.agua(q.x, q.z);
  q.agua = !!ag && ag.prof > 1.4;
  q.coyote = q.enSuelo ? 0.12 : Math.max(0, q.coyote - dt);
  q.vy -= 14 * dt;
  let yd = q.y + q.vy * dt;
  if (q.vy > 0) { const t = col.techoEntre(q.x, q.z, q.y + H, yd + H); if (t) { yd = t.abajo - H - 0.01; q.vy = 0; } }
  q.y = yd;
  if (q.y <= suelo) { q.y = suelo; q.vy = 0; q.enSuelo = true; }
  else if (q.enSuelo && q.y - suelo < 0.55 && q.vy <= 0) { q.y = q.y + (suelo - q.y) * (1 - Math.exp(-22 * dt)); if (q.y - suelo < 0.02) q.y = suelo; }
  else { q.enSuelo = false; if (q.y - suelo > 1.2) q.caeAlto = true; }
  return q;
}
export function caminarA(w, q, tx, tz, maxPasos = 400, v = 0.05) {
  for (let i = 0; i < maxPasos; i++) {
    const dx = tx - q.x, dz = tz - q.z; const d = Math.hypot(dx, dz);
    if (d < 0.06) break;
    const px = q.x, pz = q.z;
    paso(w, q, dx / d * Math.min(v, d), dz / d * Math.min(v, d));
    if (i > 20 && Math.hypot(q.x - px, q.z - pz) < 0.002 && Math.hypot(tx - q.x, tz - q.z) > 0.1) { q.trabado = true; break; }
  }
  return q;
}
// recorre puntos en coordenadas locales de la obra `o` (x, z); empieza en el primero
export function rutaLocal(w, o, pts) {
  const rot = o.datos.rot, c = Math.cos(rot), s = Math.sin(rot);
  const mundoDe = ([lx, lz]) => ({ x: o.datos.x + lx * c + lz * s, z: o.datos.z - lx * s + lz * c });
  const p0 = mundoDe(pts[0]);
  const q = { x: p0.x, z: p0.z, y: w.T.altura(p0.x, p0.z) };
  for (const p of pts.slice(1)) { const m = mundoDe(p); caminarA(w, q, m.x, m.z, 400); }
  return q;
}
