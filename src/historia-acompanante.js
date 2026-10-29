// 4.16.0: el acompañante de la Historia, de verdad: la persona que la historia anotó como `acompanante` (Graciela desde el andén del capítulo 4,
// Tobías cuando le llevás las piedras en el capítulo 5) te sigue a pie, un poco atrás y al costado, con el paso de la gente del juego
// (`camino` + `velocidad`: gente.js). Si te alejás mucho o viajás (el tren, el kayak, el velero) se queda esperando y aparece a tu lado al bajar.
// No sube al tren con vos ni al carro: ahí desaparece y vuelve a aparecer (documentado en CAMBIOS_4_16_0_A.md).
//
// Las reglas (adónde ir, qué velocidad, cuándo aparecer a tu lado) son puras y se prueban en Node. El módulo no importa three.

export const DIST_ATRAS = 2.6, DIST_LADO = 0.95;   // dónde se pone respecto de vos
export const DIST_QUIETO = 3.4;                      // más cerca que esto no se mueve
export const DIST_TELETRANSPORTE = 42;               // más lejos que esto aparece a tu lado
export const PERIODO = 0.35;                         // cada cuántos segundos se revisa

// El punto detrás de vos (según hacia dónde mirás) y un poco al costado
export function puntoDeSeguimiento(pos, yaw, atras = DIST_ATRAS, lado = DIST_LADO) {
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw);   // hacia adelante (jugador.js: con yaw 0 mira hacia −z)
  return { x: pos.x - fx * atras + fz * lado, z: pos.z - fz * atras - fx * lado };
}
// Qué hace según la distancia: 'quieto' | 'caminar' | 'apurar' | 'correr' | 'aparecer'. Devuelve también la velocidad (m/s).
export function decidirPaso(distancia) {
  const d = Number(distancia);
  if (!Number.isFinite(d) || d >= DIST_TELETRANSPORTE) return { accion: 'aparecer', velocidad: 0 };
  if (d <= DIST_QUIETO) return { accion: 'quieto', velocidad: 0 };
  if (d <= 7) return { accion: 'caminar', velocidad: 1.7 };
  if (d <= 16) return { accion: 'apurar', velocidad: 3.4 };
  return { accion: 'correr', velocidad: 5.2 };
}
// ¿Quién acompaña ahora? Sólo con la historia en curso y un acompañante anotado
export const acompananteActual = (h) => (h && h.activa && typeof h.acompanante === 'string' ? h.acompanante : null);

// `ctx`: { historia: () => h, jugador: () => ({ pos: {x, y, z}, yaw }), npcDe: (clave) => npc | null, altura: (x, z) => y,
//          tomada: () => ¿una escena lo usa?, enVehiculo: () => ¿vas en el tren, el kayak o el velero? }
export function crearAcompanante(ctx) {
  let clave = null, npc = null, guardado = null, acum = 0, esperando = false;
  function tomar(n) {
    npc = n;
    guardado = { camino: n.camino, velocidad: n.velocidad, conVos: n.conVos, enCita: n.enCita, sinFrenar: n.sinFrenar, dormido: n.dormido };
    n.conVos = true; n.enCita = true; n.sinFrenar = true; n.pose = null; n.asiento = undefined; n.soloCerca = 0; n.charlaVecinos = false;
    if (!Array.isArray(n.camino)) n.camino = [];
  }
  function soltar() {
    if (!npc) return;
    const g = guardado || {};
    npc.conVos = !!g.conVos; npc.enCita = !!g.enCita; npc.sinFrenar = !!g.sinFrenar;
    npc.camino = g.camino === undefined ? [] : g.camino;   // (los de ruta —Tobías— vuelven a su ruta; los de camino —Graciela— quedan quietos)
    if (Number.isFinite(g.velocidad)) npc.velocidad = g.velocidad;
    if (esperando) npc.dormido = !!g.dormido;
    npc = null; guardado = null; esperando = false;
  }
  function ponerA(punto) {
    if (!npc) return;
    const y = ctx.altura ? ctx.altura(punto.x, punto.z) : npc.pos.y;
    npc.pos.set(punto.x, y, punto.z);
    npc.camino = []; npc.vel = 0;
  }
  function actualizar(dt) {
    acum += dt;
    if (acum < PERIODO) return;
    acum = 0;
    const q = acompananteActual(ctx.historia?.());
    if (q !== clave) { soltar(); clave = q; }
    if (!q) return;
    if (!npc) { const n = ctx.npcDe?.(q); if (!n) return; tomar(n); }
    if (ctx.tomada?.()) return;   // una escena lo está usando
    const j = ctx.jugador?.();
    if (!j) return;
    if (ctx.enVehiculo?.()) { if (!esperando) { esperando = true; npc.dormido = true; } return; }   // en el tren no se lo ve: aparece al bajar
    if (esperando) { esperando = false; npc.dormido = false; ponerA(puntoDeSeguimiento(j.pos, j.yaw)); return; }
    npc.dormido = false;
    const d = Math.hypot(npc.pos.x - j.pos.x, npc.pos.z - j.pos.z);
    const p = decidirPaso(d);
    if (p.accion === 'aparecer') { ponerA(puntoDeSeguimiento(j.pos, j.yaw)); return; }
    if (p.accion === 'quieto') { npc.camino = []; npc.rumboObjetivo = Math.atan2(j.pos.x - npc.pos.x, j.pos.z - npc.pos.z); return; }
    const meta = puntoDeSeguimiento(j.pos, j.yaw);
    npc.camino = [{ x: meta.x, z: meta.z, cerca: 0.9 }];
    npc.velocidad = p.velocidad * (Number(ctx.factor?.(q)) || 1);   // (4.17.0: Ramón convaleciente camina despacio)
  }
  return { actualizar, soltar, clave: () => clave, npc: () => npc, esperando: () => esperando };
}
