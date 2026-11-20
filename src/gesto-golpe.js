// 4.31.1 (A): el golpe de un brazo (el martillo de Anselmo y de Ramón, la honda de los chicos en el Desafío). Antes el brazo se ponía arriba un solo
// cuadro (desafio-vecinos-mundo.js y desafio-aliados.js corren después de gente.js) y en el cuadro siguiente gente.js lo pisaba: Anselmo «arreglaba» sin
// mover el brazo. Ahora se anota el golpe y gente.js lo pone en cada cuadro mientras dura: arriba de golpe y baja hasta donde estaba.
// Módulo PURO (sin three ni DOM).

// Anota un golpe: el brazo derecho (brazos[1]) a `x` rad y de vuelta en `dur` s
export function golpear(g, x, dur = 0.3) {
  if (!g || !Number.isFinite(x)) return;
  g.__golpe = { x, t: Math.max(0.05, Number(dur) || 0.3), dur: Math.max(0.05, Number(dur) || 0.3) };
}
// En cada cuadro (después de la pose de gente.js): mezcla el brazo con el golpe y lo descuenta; al terminar, lo borra
export function brazoDeGolpe(g, dt) {
  const q = g?.__golpe;
  if (!q) return;
  const b = g.brazos?.[1];
  q.t -= Math.max(0, Number(dt) || 0);
  if (!b || q.t <= 0) { g.__golpe = null; return; }
  const k = q.t / q.dur;   // 1 al empezar (arriba), 0 al terminar (donde lo dejó la pose)
  b.rotation.x += (q.x - b.rotation.x) * k;
}
