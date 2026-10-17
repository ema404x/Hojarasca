// 4.0.1 · La cantina y la casa de té no pierden un pedido cobrado (zona A, hallazgos 1 y 2):
//   1. si la carta se abre hablando con la moza (no la tenías «tomada»), el pedido se sirve igual;
//   2. fuera de horario la charla no abre la carta y nada se cobra sin moza;
//   3. alejarte más de 40 m con un pedido en camino y volver no tira excepciones: el pedido se sirve.
// Arnés con figuras y un DOM de mentira (el estilo de verificar-3-9-0-cantina.mjs).
import assert from 'node:assert/strict';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const A = await import('../src/aldea.js');
const E = await import('../src/economia.js');
const CJ = await import('../src/cantina-juego.js');
const mk = (tag) => {
  const el = { tag, className: '', children: [], disabled: false, _t: '', listeners: {}, _clases: new Set(),
    get textContent() { return this._t + this.children.map((c) => c.textContent).join(''); }, set textContent(v) { this._t = String(v); },
    set innerHTML(v) { this.children = []; this._t = ''; }, get innerHTML() { return this.textContent; },
    append(...xs) { this.children.push(...xs); }, appendChild(x) { this.children.push(x); }, addEventListener(ev, fn) { this.listeners[ev] = fn; },
    classList: { add(c) { el._clases.add(c); }, remove(c) { el._clases.delete(c); }, contains: (c) => el._clases.has(c) } };
  return el;
};
globalThis.document = { createElement: mk };
function montar(lugar = null, hora = 21) {
  const todos = (el, f = []) => { f.push(el); for (const c of el.children) todos(c, f); return f; };
  const p = { modo: 'relax', dia: 10, horas: hora, cosas: {}, materiales: { tronco: 6 }, entradas: {}, economia: E.economiaNueva(), aldea: A.aldeaNueva(), vecindad: { hechos: [] } };
  p.economia.pesos = 5000;
  const seat = A.CANTINA.mesas[2].sillas[1];
  const e = A.EDIFICIOS_ALDEA.cantina, marco = A.marcoAldea();
  const mundo = (bx, bz) => { const c = Math.cos(e.rot), s = Math.sin(e.rot); return marco.aMundo(e.x + bx * c + bz * s, e.z - bx * s + bz * c); };
  const pb = mundo(A.CANTINA.barra.x, A.CANTINA.barra.z);
  const js = { pos: { x: 0, z: 0, y: 0 }, sentado: false, entumecido: 5, descansado: 0 };
  const sw = mundo(seat.x, seat.z); js.pos.x = sw.x; js.pos.z = sw.z;
  const moza = { pos: { x: pb.x, y: 0, z: pb.z }, camino: [], dormido: false, deVisita: false, conVos: false, llegando: false, pose: null, velocidad: 0.85 };
  const panel = mk('section'); panel.classList.add('oculto'); const contenido = mk('div');
  const notas = [], dichos = [];
  const visual = { ponerEnMesa() {}, quitarDeMesa() {}, nivel() {}, empezarSorbo() {}, cancelarSorbo() {}, actualizar() {}, bandeja() {}, limpiarTodo() {} };
  const ctx = { progreso: () => p, jugador: () => ({ estado: js }), moza: () => moza, camara: () => null, ambiente: () => ({ invierno: 1, lluvia: 0.1, viento: 0.2, nublado: 0.1 }),
    nota: (t, s) => notas.push([t, s]), guardar: () => {}, refrescar: () => {}, sonido: null, alJugador: (c, v) => { if (c === 'entumecido') js.entumecido = v; },
    hablandoCon: () => null, ajusteBorrachera: () => globalThis.__AJ || 'normal', hablo: (t) => dichos.push(t), levantar: () => { js.sentado = false; }, panel, contenido, visual, T_: (t) => t };
  const J = CJ.crearCantinaJuego(ctx);
  const botones = () => todos(contenido).filter((x) => x.tag === 'button');
  const clic = (txt) => { const b = botones().find((x) => x.textContent.includes(txt) && !x.disabled); assert.ok(b, `no hay botón «${txt}»`); b.listeners.click(); };
  const caminar = (dt) => { const q = moza.camino[0]; if (!q) return; const dx = q.x - moza.pos.x, dz = q.z - moza.pos.z, d = Math.hypot(dx, dz), cerca = q.cerca ?? 0.5; if (d < cerca) { moza.camino.shift(); return; } const paso = Math.min((moza.velocidad || 0.8) * dt, d); moza.pos.x += (dx / d) * paso; moza.pos.z += (dz / d) * paso; };
  const tick = (dt = 0.05, veces = 1) => { for (let i = 0; i < veces; i++) { caminar(dt); J.actualizar(dt); } };
  const hasta = (cond, max = 200) => { let t = 0; while (!cond(J.estado()) && t < max) { tick(0.05); t += 0.05; } return J.estado(); };
  return { p, js, moza, J, clic, tick, hasta, notas, panel, contenido, botones, sw };
}

const servido = (t) => t.J.estado().servidos.length > 0;

// 1) la carta que viene de la charla (Lucrecia no estaba tomada) se sirve
{
  const t = montar(null, 21);
  const { p, js, J, tick, hasta, clic } = t;
  js.sentado = true; tick(); hasta((x) => x.ses && x.ses.fase === 'carta', 80);
  clic('Después pido');
  hasta((x) => x.ses.fase === 'libre', 120);
  assert.equal(J.estado().controla, false, 'ella ya está suelta');
  assert.equal(J.abrirCarta(), true, 'la charla abre la carta');
  clic('Cerveza'); clic('Pagar $350');
  assert.equal(E.pesosDe(p), 4650, 'se cobró una vez');
  hasta((x) => x.servidos.length > 0, 120);
  assert.ok(servido(t), 'el pedido pagado se sirvió');
  assert.equal(J.estado().servidos[0].item, 'cerveza');
  hasta((x) => x.ses.fase === 'libre' && !x.ses.orden && !x.controla, 60);
  assert.equal(J.estado().ses.orden, null, 'la visita no queda con la orden colgada');
  assert.equal(J.abrirCarta(), true);
}

// 2) cerrado: la charla no abre la carta y no se cobra nada
{
  const t = montar(null, 13);
  const { p, js, J, tick } = t;
  js.sentado = true; tick();
  assert.equal(J.abrirCarta(), false, 'de día la carta no se abre');
  assert.equal(J.pedirItem(J.cartaHoy()[0], { medio: 'pesos', ok: true }), false, 'y pedir con la fuerza no cobra');
  assert.equal(E.pesosDe(p), 5000);
}

// 3) alejarte con un pedido en camino y volver: sin excepción y servido
for (const fase of ['a-barra', 'prepara', 'trae', 'deja', 'apoya']) {
  const t = montar(null, 21);
  const { p, js, J, tick, hasta, clic } = t;
  js.sentado = true; tick(); hasta((x) => x.ses && x.ses.fase === 'carta', 80);
  clic('Cerveza'); clic('Pagar $350');
  hasta((x) => x.ses.fase === fase, 80);
  js.sentado = false; tick(0.05, 3);
  const x0 = js.pos.x; js.pos.x += 500; tick(0.05, 3);
  js.pos.x = x0;
  assert.doesNotThrow(() => { for (let i = 0; i < 2400; i++) tick(0.05); }, `volver con el pedido en «${fase}» no revienta`);
  assert.equal(E.pesosDe(p), 4650, `«${fase}»: se cobró una sola vez`);
  assert.equal(J.estado().ses?.orden ?? null, null, `«${fase}»: el pedido no queda colgado`);
}
console.log('4.0.1 cantina: pedido servido desde la charla, cerrada sin cobrar, y lejos-y-vuelta sin excepción (5 fases)');
