// 4.31.0 (B): los gestos de la gente con el tiempo que hace (ver pueblo-detalles.js): taparse la cabeza con la mano caminando bajo
// la lluvia o la nieve, frotarse las manos parado al frío y sacudirse la nieve al entrar. Como social-anim.js: sólo giran las
// piezas que ya tiene la figura (brazos con su codo, torso, cabeza), sin piezas, dibujos ni programas nuevos. gente.js llama a
// `posarDetalle` en cada pose, al final (después de posar, la quietud y las animaciones sociales). Entra y sale suave.
// `g.__detalle`: el gesto que le toca ahora ('taparse' | 'frotarse' | null; lo pone pueblo-detalles-juego.js) y `g.__sacude`: hasta
// cuándo (en `g.fase`) se sacude la nieve. Sin three (se prueba en Node con figuras de mentira).

const suave = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const mezcla = (a, b, w) => a + (b - a) * w;
// un brazo (como en social-anim.js): x adelante (negativo), z abrirlo, codo doblar (negativo), yl girarlo sobre su eje
function brazo(g, s, d, w) {
  const b = g.brazos?.[s];
  if (!b || !d) return;
  const l = s ? 1 : -1;
  b.rotation.order = 'XZY';
  b.rotation.x = mezcla(b.rotation.x, d.x, w);
  b.rotation.z = mezcla(b.rotation.z, l * (d.z || 0), w);
  if (!b.userData?.muneca) b.rotation.y = l * (d.yl || 0) * w;   // (se pone, no se mezcla: gente.js no repone el giro del hombro)
  const cd = b.userData?.codo;
  if (cd && Number.isFinite(d.codo)) cd.rotation.x = mezcla(cd.rotation.x, d.codo, w);
}
export const DUR_SACUDIR = 1.6;
// La pose de un gesto a los `t` segundos (la fase de la figura)
export function poseDetalle(id, t) {
  const sin = Math.sin;
  switch (id) {
    // la mano derecha arriba de la cabeza, como visera; la cabeza gacha y el paso apurado (el torso adelante)
    case 'taparse': return { der: { x: -2.75, z: 0.42, codo: -1.75, yl: -0.35 }, tx: 0.12, cx: 0.16 };
    // las dos manos juntas adelante, frotándose; los hombros encogidos
    case 'frotarse': { const k = sin(t * 9) * 0.12; return { izq: { x: -0.95 + k, z: -0.32, codo: -1.45, yl: -0.7 }, der: { x: -0.95 - k, z: -0.32, codo: -1.45, yl: -0.7 }, cx: 0.1, sube: 0.012 }; }
    // sacudirse: el torso se mueve de lado a lado y las manos barren los hombros
    case 'sacudir': { const k = sin(t * 16); return { izq: { x: -1.2 + k * 0.3, z: -0.55, codo: -1.9 }, der: { x: -1.2 - k * 0.3, z: -0.55, codo: -1.9 }, tz: k * 0.1, cz: -k * 0.08 }; }
    default: return null;
  }
}
// El gesto de este cuadro (o null): sacudirse le gana a lo demás; con una animación social o una pose propia, nada
export function gestoActual(g) {
  if (!g || g.animSocial) return null;
  const f = Number(g.fase) || 0;
  if (Number.isFinite(g.__sacude) && f < g.__sacude) return 'sacudir';
  return g.__detalle || null;
}
// En cada pose (gente.js). `andando`: si camina en este cuadro
export function posarDetalle(g, andando = false) {
  if (!g || !g.brazos || !g.torso) return;
  let id = gestoActual(g);
  if (id === 'frotarse' && (andando || g.pose)) id = null;
  if (id === 'taparse' && !andando) id = null;
  // entra y sale suave (un cuarto de segundo)
  const dt = Math.max(0, Math.min(0.1, (Number(g.fase) || 0) - (g.__faseDetalle ?? (Number(g.fase) || 0))));
  g.__faseDetalle = Number(g.fase) || 0;
  if (id) g.__ultimoDetalle = id;
  const w = g.__pesoDetalle = Math.max(0, Math.min(1, (g.__pesoDetalle || 0) + (id ? dt : -dt) * 4));
  const usar = id || g.__ultimoDetalle;
  if (!usar) return;
  if (w <= 0) { for (const b of g.brazos) if (b && !b.userData?.muneca) b.rotation.y = 0; g.__ultimoDetalle = null; return; }
  const P = poseDetalle(usar, Number(g.fase) || 0);
  if (!P) return;
  // 4.31.1 (A): lo que lleva en la mano se guarda mientras dura el gesto (el brazo del mate subía por arriba de la cabeza, la planilla quedaba delante de la cara);
  // gente.js lo vuelve a sacar al terminar (`__mateDejado`, `__enManoDejado`)
  if (g.mate && g.mate.visible !== false) { g.mate.visible = false; g.__mateDejado = true; }
  { const cosa = g.planilla || g.caña; if (cosa && cosa.visible !== false) { cosa.visible = false; g.__enManoDejado = true; } }
  const ws = suave(w);
  if (P.izq) brazo(g, 0, P.izq, ws);
  if (P.der) brazo(g, 1, P.der, ws);
  if (P.tx) g.torso.rotation.x += P.tx * ws;
  if (P.tz) g.torso.rotation.z += P.tz * ws;
  if (g.cabeza) {
    if (P.cx) g.cabeza.rotation.x += P.cx * ws;
    if (P.cz) g.cabeza.rotation.z += P.cz * ws;
  }
  if (P.sube) { g.torso.position.y += P.sube * ws; for (const b of g.brazos) if (b) b.position.y += P.sube * ws; }
}
