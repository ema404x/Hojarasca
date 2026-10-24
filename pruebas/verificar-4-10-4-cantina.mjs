// 4.10.4 — cantina (zona S2): EJECUTA la cantina real con una moza de mentira.
//   S2-4 el plato de la mesa que dejaste no queda servido para siempre si te sentás en otra   S2-5 el pedido pagado sobrevive a guardar y salir
//   S2-8 el mate de la casa es uno por noche
import assert from 'node:assert/strict';
import { registrarThree } from './ayuda-three.mjs';
registrarThree();
const U = (f) => import(new URL(`../${f}`, import.meta.url).href);
const A = await U('src/aldea.js'), E = await U('src/economia.js'), C = await U('src/cantina.js'), CJ = await U('src/cantina-juego.js');

let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };
const mk = (tag) => { const el = { tag, className: '', children: [], disabled: false, _t: '', listeners: {}, _clases: new Set(),
  get textContent() { return this._t + this.children.map((c) => c.textContent).join(''); }, set textContent(v) { this._t = String(v); },
  set innerHTML(v) { this.children = []; this._t = ''; }, get innerHTML() { return this.textContent; },
  append(...xs) { this.children.push(...xs); }, appendChild(x) { this.children.push(x); }, addEventListener(ev, fn) { this.listeners[ev] = fn; }, querySelector() { return null; },
  classList: { add(c) { el._clases.add(c); }, remove(c) { el._clases.delete(c); }, contains: (c) => el._clases.has(c), toggle() {} } }; return el; };
globalThis.document = { createElement: mk };
const L = CJ.lugarDeCantina();
const e = A.EDIFICIOS_ALDEA.cantina, marco = A.marcoAldea();
const mundo = (bx, bz) => { const c = Math.cos(e.rot), s2 = Math.sin(e.rot); return marco.aMundo(e.x + bx * c + bz * s2, e.z - bx * s2 + bz * c); };

// un mundo nuevo (o uno que continúa sobre una partida guardada)
function armar(p) {
  const pb = mundo(L.plano.barra.x, L.plano.barra.z);
  const js = { pos: { x: 0, z: 0, y: 0 }, sentado: false, entumecido: 0, descansado: 0 };
  const moza = { pos: { x: pb.x, y: 0, z: pb.z }, camino: [], dormido: false, deVisita: false, conVos: false, llegando: false, pose: null, velocidad: 0.85, bandeja: {} };
  const panel = mk('section'), contenido = mk('div'), notas = [], quitadas = [];
  const visual = { ponerEnMesa() {}, quitarDeMesa: (m) => quitadas.push(m.id), nivel() {}, empezarSorbo() {}, cancelarSorbo() {}, actualizar() {}, bandeja() {}, limpiarTodo() {} };
  const ctx = { progreso: () => p, jugador: () => ({ estado: js }), moza: () => moza, camara: () => null, ambiente: () => ({ invierno: 1, lluvia: 0.1, viento: 0.2, nublado: 0.1 }),
    nota: (t, s) => notas.push([t, s]), guardar() {}, refrescar() {}, sonido: null, alJugador() {}, hablandoCon: () => null, hablo() {}, levantar: () => { js.sentado = false; }, panel, contenido, visual, T_: (t) => t };
  const J = CJ.crearCantinaJuego(ctx);
  const caminar = (dt) => { const q = moza.camino && moza.camino[0]; if (!q) return; const dx = q.x - moza.pos.x, dz = q.z - moza.pos.z, d = Math.hypot(dx, dz), cerca = q.cerca ?? 0.5; if (d < cerca) { moza.camino.shift(); return; } const paso = Math.min((moza.velocidad || 0.8) * dt, d); moza.pos.x += (dx / d) * paso; moza.pos.z += (dz / d) * paso; };
  const tick = (s) => { for (let i = 0; i < s * 10; i++) { caminar(0.1); J.actualizar(0.1); } };
  const sentarEn = (mi, si) => { const m = L.plano.mesas[mi], s = m.sillas[si], w = mundo(s.x, s.z); js.pos.x = w.x; js.pos.z = w.z; js.sentado = true; };
  const hasta = (f, max = 120) => { let t = 0; while (!f(J.estado()) && t < max) { tick(0.5); t += 0.5; } return J.estado(); };
  return { J, js, moza, tick, sentarEn, hasta, notas, quitadas };
}
const partida = () => ({ modo: 'relax', dia: 10, horas: 21, cosas: {}, materiales: { tronco: 6 }, entradas: {}, economia: { ...E.economiaNueva(), pesos: 5000 }, aldea: A.aldeaNueva(), vecindad: { hechos: [] } });
const sentadoConCarta = (W) => { W.sentarEn(2, 0); W.tick(0.5); W.hasta((x) => x.ses && x.ses.fase === 'carta'); };
const pedirYServir = (W, id = 'ginebra') => {
  const item = C.CARTA.find((x) => x.id === id);
  ok(W.J.pedirItem(item, { medio: 'pesos' }), `se pide ${id}`);
  W.hasta((x) => x.servidos.length > 0 && x.ses && x.ses.fase === 'libre');
};

// ---------------------------------------------------------------- S2-4: el plato fantasma
{
  const p = partida(), W = armar(p);
  sentadoConCarta(W);
  pedirYServir(W);
  eq(W.J.estado().servidos.length, 1, 'hay un plato servido en la mesa 3');
  W.js.sentado = false; W.tick(0.5);
  eq(W.J.estado().limpieza, 'espera', 'me levanto: la moza va a levantar');
  W.sentarEn(0, 0); W.tick(0.5);
  eq(W.J.estado().servidos.length, 0, 'me siento en otra mesa antes de que venga: el plato de la anterior se levantó de una vez');
  eq(W.quitadas.length, 1, 'y se quitó de la vista');
  W.tick(60);
  eq(W.J.estado().servidos.length, 0, 'un minuto después sigue sin quedar nada servido');
  // si me siento de vuelta en la MISMA mesa, el plato sigue ahí
  const p2 = partida(), W2 = armar(p2);
  sentadoConCarta(W2);
  pedirYServir(W2);
  W2.js.sentado = false; W2.tick(0.5);
  W2.sentarEn(2, 0); W2.tick(0.5);
  eq(W2.J.estado().servidos.length, 1, 'si vuelvo a la misma mesa, mi plato sigue ahí');
}

// ---------------------------------------------------------------- S2-5: el pedido pagado sobrevive a guardar y salir
{
  const p = partida(), W = armar(p);
  sentadoConCarta(W);
  const antes = E.pesosDe(p);
  const item = C.CARTA.find((x) => !x.fuerte && x.tipo !== 'bebida');
  ok(W.J.pedirItem(item, { medio: 'pesos' }), 'se pide y se paga');
  ok(E.pesosDe(p) === antes - item.precio, 'la billetera bajó lo que cuesta');
  eq(p.cantina.pendiente, item.id, 'queda anotado como pedido pendiente');
  // guardar y salir antes de que llegue: se vuelve a cargar la partida
  const guardada = JSON.parse(JSON.stringify(p));
  const cargada = { ...guardada, cantina: C.sanearCantina(guardada.cantina, guardada.dia) };
  eq(cargada.cantina.pendiente, item.id, 'el pendiente sobrevive al guardado');
  const W2 = armar(cargada);
  W2.sentarEn(1, 0); W2.tick(1);
  eq(W2.J.estado().servidos.length, 1, 'al sentarte de nuevo te dejaron el plato pagado en la mesa');
  eq(cargada.cantina.pendiente, null, 'y el pendiente se limpió');
  ok(W2.notas.some(([, t]) => /ya estaba pago/.test(String(t))), 'con un aviso');
  // el camino normal también lo limpia
  const p3 = partida(), W3 = armar(p3);
  sentadoConCarta(W3);
  pedirYServir(W3);
  eq(p3.cantina.pendiente, null, 'servido en la mesa: ya no queda pendiente');
  // un guardado de antes (sin el campo) carga bien
  eq(C.sanearCantina({ visitas: 2 }, 5).pendiente, null, 'una libreta vieja no tiene pendiente');
  eq(C.sanearCantina({ pendiente: '<raro>' }, 5).pendiente, null, 'un id raro se descarta');
}

// ---------------------------------------------------------------- S2-8: un solo mate por la casa por noche
{
  const p = partida(), W = armar(p);
  sentadoConCarta(W);
  const gin = C.CARTA.find((x) => x.id === 'ginebra');
  const antes = E.pesosDe(p);
  // la noche en que estamos: la que usa pedir()
  W.J.pedirItem(gin, { medio: 'pesos' });   // (un fuerte pagado, para saber la noche)
  W.hasta((x) => x.ses && x.ses.fase === 'libre');
  p.cantina.fuertes.n = 3;
  const plata = E.pesosDe(p);
  ok(plata < antes, 'el primer fuerte se cobró');
  ok(W.J.pedirItem(gin, { medio: 'pesos' }) === true, 'el cuarto fuerte: ella te trae un mate por la casa');
  eq(E.pesosDe(p), plata, 'sin cobrar nada');
  eq(p.cantina.fuertes.mate, 1, 'y queda anotado');
  W.hasta((x) => x.ses && x.ses.fase === 'libre');
  ok(W.J.pedirItem(gin, { medio: 'pesos' }) === false, 'el siguiente fuerte de la noche ya no da otro mate gratis');
  eq(E.pesosDe(p), plata, 'ni cobra');
  eq(C.sanearCantina(JSON.parse(JSON.stringify(p.cantina)), p.dia).fuertes.mate, 1, 'el mate de la noche se guarda');
}
console.log(`verificar-4-10-4-cantina: ${pasos} pasos ok`);
