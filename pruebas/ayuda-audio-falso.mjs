// Un AudioContext de mentira que se comporta como Chrome en lo que importa para encontrar bugs:
//   - lanza RangeError/TypeError donde Chrome lo hace (exponentialRamp a 0, tiempos negativos, no finitos),
//   - registra cada nodo (creado / conectado / arrancado / parado / terminado),
//   - `avanzar(seg)` mueve el reloj y dispara 'ended'/onended de las fuentes cuya parada ya pasó.
export const nodos = [];
export const errores = [];
let ID = 0;

const EPS = 1.1754944e-38;
function fin(v, que) { if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`${que}: no finito (${v})`); }

export class Param {
  constructor(nodo, nombre, valor = 0) { this.nodo = nodo; this.nombre = nombre; this._v = valor; this.eventos = []; }
  get value() { return this._v; }
  set value(v) { fin(v, `${this.nodo.tipo}.${this.nombre}.value`); this._v = v; this.seteado = true; }
  _t(t, q) { fin(t, `${this.nodo.tipo}.${this.nombre}.${q} tiempo`); if (t < 0) throw new RangeError(`${this.nodo.tipo}.${this.nombre}.${q}: tiempo negativo ${t}`); }
  setValueAtTime(v, t) { fin(v, `${this.nodo.tipo}.${this.nombre}.setValueAtTime valor`); this._t(t, 'setValueAtTime'); this.eventos.push(['set', v, t]); return this; }
  linearRampToValueAtTime(v, t) { fin(v, `${this.nodo.tipo}.${this.nombre}.linearRamp valor`); this._t(t, 'linearRamp'); this.eventos.push(['lin', v, t]); return this; }
  exponentialRampToValueAtTime(v, t) {
    fin(v, `${this.nodo.tipo}.${this.nombre}.expRamp valor`); this._t(t, 'expRamp');
    if (Math.abs(v) < EPS) throw new RangeError(`${this.nodo.tipo}.${this.nombre}.exponentialRampToValueAtTime: valor ${v} no permitido`);
    this.eventos.push(['exp', v, t]); return this;
  }
  setTargetAtTime(v, t, tc) {
    fin(v, `${this.nodo.tipo}.${this.nombre}.setTarget valor`); this._t(t, 'setTarget'); fin(tc, `${this.nodo.tipo}.${this.nombre}.setTarget tc`);
    if (tc < 0) throw new RangeError(`${this.nodo.tipo}.${this.nombre}.setTargetAtTime: tc negativo ${tc}`);
    this.eventos.push(['tgt', v, t, tc]); return this;
  }
  cancelScheduledValues(t) { this._t(t, 'cancel'); this.eventos = this.eventos.filter((e) => e[2] < t); return this; }
}

export class Nodo {
  constructor(ctx, tipo, params = {}) {
    this.ctx = ctx; this.tipo = tipo; this.id = ++ID; this.sal = new Set(); this.ent = new Set();
    this.creadoEn = ctx.currentTime; this.escuchas = {};
    for (const [k, v] of Object.entries(params)) this[k] = new Param(this, k, v);
    nodos.push(this);
  }
  connect(destino) {
    if (!destino) throw new TypeError('connect a nada');
    const d = destino.nodo || destino;   // AudioParam o nodo
    this.sal.add(d); if (d.ent) d.ent.add(this);
    return destino;
  }
  disconnect() { for (const d of this.sal) d.ent?.delete(this); this.sal.clear(); this.desconectado = true; }
  addEventListener(ev, f) { (this.escuchas[ev] ||= []).push(f); }
  _fin() {
    if (this.terminado) return; this.terminado = true;
    for (const f of this.escuchas.ended || []) f();
    if (typeof this.onended === 'function') this.onended();
  }
}

class Fuente extends Nodo {
  constructor(ctx, tipo, params) { super(ctx, tipo, params); this.esFuente = true; }
  start(cuando = 0, offset = 0, dur) {
    if (this.arrancado) throw new Error('InvalidStateError: start dos veces');
    fin(cuando, `${this.tipo}.start`); if (cuando < 0) throw new RangeError(`${this.tipo}.start: negativo ${cuando}`);
    if (offset !== undefined) { fin(offset, `${this.tipo}.start offset`); if (offset < 0) throw new RangeError(`${this.tipo}.start offset negativo`); }
    if (dur !== undefined) { fin(dur, `${this.tipo}.start dur`); if (dur < 0) throw new RangeError(`${this.tipo}.start dur negativa`); }
    this.arrancado = true; this.t0 = Math.max(cuando, this.ctx.currentTime);
    if (dur !== undefined) this.parada = this.t0 + dur;
  }
  stop(cuando = 0) {
    if (!this.arrancado) throw new Error('InvalidStateError: stop antes de start');
    fin(cuando, `${this.tipo}.stop`); if (cuando < 0) throw new RangeError(`${this.tipo}.stop: negativo ${cuando}`);
    this.parada = Math.min(this.parada ?? Infinity, Math.max(cuando, this.ctx.currentTime));
  }
  // cuándo termina solo
  finEstimado() {
    if (!this.arrancado) return Infinity;
    let f = this.parada ?? Infinity;
    if (this.tipo === 'bufsrc' && !this.loop && this.buffer) {
      const vel = Math.abs(this.playbackRate?.value || 1) || 1;
      const off = 0;
      f = Math.min(f, this.t0 + (this.buffer.duration - off) / vel);
    }
    return f;
  }
}

class OscilFalso extends Fuente {
  constructor(ctx) { super(ctx, 'osc', { frequency: 440, detune: 0 }); this._tipo = 'sine'; }
  set type(v) { this._tipo = v; } get type() { return this._tipo; }
  setPeriodicWave(w) { if (!w) throw new TypeError('wave null'); this.onda = w; }
}

export class FakeCtx {
  constructor() {
    this.currentTime = 0; this.sampleRate = 48000; this.state = 'running';
    this.destination = new Nodo(this, 'destination');
    const L = new Nodo(this, 'listener');
    this.listener = { positionX: new Param(L, 'positionX'), positionY: new Param(L, 'positionY'), positionZ: new Param(L, 'positionZ'),
      forwardX: new Param(L, 'forwardX'), forwardY: new Param(L, 'forwardY'), forwardZ: new Param(L, 'forwardZ'),
      upX: new Param(L, 'upX'), upY: new Param(L, 'upY'), upZ: new Param(L, 'upZ') };
    this.buffers = []; this.muestras = 0;
  }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createGain() { return new Nodo(this, 'gain', { gain: 1 }); }
  createBiquadFilter() { const n = new Nodo(this, 'biquad', { frequency: 350, Q: 1, gain: 0, detune: 0 }); n.type = 'lowpass'; return n; }
  createDynamicsCompressor() { return new Nodo(this, 'comp', { threshold: -24, knee: 30, ratio: 12, attack: 0.003, release: 0.25 }); }
  createConvolver() { const n = new Nodo(this, 'conv'); return n; }
  createStereoPanner() { return new Nodo(this, 'pan', { pan: 0 }); }
  createPanner() { return new Nodo(this, 'panner', { positionX: 0, positionY: 0, positionZ: 0 }); }
  createWaveShaper() { return new Nodo(this, 'shaper'); }
  createDelay(max = 1) { const n = new Nodo(this, 'delay', { delayTime: 0 }); n.max = max; return n; }
  createOscillator() { return new OscilFalso(this); }
  createPeriodicWave(re, im) { return { re, im }; }
  createBufferSource() { const n = new Fuente(this, 'bufsrc', { playbackRate: 1, detune: 0 }); n.loop = false; return n; }
  createBuffer(canales, largo, tasa) {
    if (!(largo >= 1) || !Number.isFinite(largo)) throw new Error(`NotSupportedError: createBuffer largo ${largo}`);
    if (!(tasa >= 3000 && tasa <= 768000)) throw new Error(`NotSupportedError: tasa ${tasa}`);
    const datos = Array.from({ length: canales }, () => new Float32Array(largo));
    const b = { numberOfChannels: canales, length: largo, sampleRate: tasa, duration: largo / tasa, getChannelData: (c) => datos[c],
      copyToChannel: (a, c) => { datos[c].set(a); } };
    this.buffers.push(b); this.muestras += largo * canales;
    return b;
  }
  // mueve el reloj; las fuentes cuyo fin pasó disparan 'ended'
  avanzar(seg, paso = 0.05) {
    const meta = this.currentTime + seg;
    while (this.currentTime < meta) {
      this.currentTime = Math.min(meta, this.currentTime + paso);
      for (const n of nodos) if (n.esFuente && !n.terminado && n.finEstimado() <= this.currentTime) n._fin();
    }
  }
}

// Qué nodos creados después de `desde` (índice en `nodos`) siguen vivos en el sentido que importa:
//  - fuentes que arrancaron pero nunca van a terminar (loop o oscilador sin stop)
//  - nodos intermedios no desconectados cuyo origen terminó y siguen enchufados a un nodo persistente
export function fugas(desde, persistentes) {
  const res = { fuentesInfinitas: [], colgados: [] };
  for (let i = desde; i < nodos.length; i++) {
    const n = nodos[i];
    if (n.esFuente && n.arrancado && n.finEstimado() === Infinity) res.fuentesInfinitas.push(n);
  }
  for (const p of persistentes) {
    for (const e of p.ent) if (nodos.indexOf(e) >= desde && !persistentes.has(e)) res.colgados.push(e);
  }
  return res;
}

// busca NaN/Inf/>1 en los .value que quedaron (para ganancias y frecuencias)
export function auditarParams(desde) {
  const malos = [];
  for (let i = desde; i < nodos.length; i++) {
    const n = nodos[i];
    for (const k of Object.keys(n)) {
      const p = n[k];
      if (p instanceof Param) {
        if (!Number.isFinite(p._v)) malos.push([n.tipo, k, 'valor no finito']);
        for (const e of p.eventos) if (!Number.isFinite(e[1]) || !Number.isFinite(e[2])) malos.push([n.tipo, k, 'evento no finito']);
      }
    }
  }
  return malos;
}
