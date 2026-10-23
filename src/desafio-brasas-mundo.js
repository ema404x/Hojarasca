// 4.9 defensas: la pala de brasas en el mundo (las reglas y los números están en desafio-brasas.js).
//
//   · El abanico: nueve brasas que salen de la pala y caen entre la mitad del alcance y el alcance, en un arco de 57 grados. Se ven
//     como chispas y llamitas que viajan en parábola (con `desafio-efectos.js`, que no se toca: sólo se usa) y caen al piso.
//   · Lo que hace: los duendes dentro del abanico se llevan un daño chico de fuego, arden un instante, dudan y retroceden (los
//     grandes dudan la mitad; el mandamás casi nada). Si una brasa cae sobre la miel de una trampa, la prende; si cae junto a un
//     barril de resina, lo hace estallar.
//   · Cargarla: E junto a un fogón o una antorcha prendida con la pala en la mano.
//
// `fuegosDeBase()`: los fuegos prendidos de la base (fogones y antorchas), con { x, y, z, tipo }. Lo usa la pala para cargarse y lo puede
// usar quien quiera saber dónde hay fuego (por ejemplo, el fogón de Herminia, si lo registra en `clima.fogatas`).
import { PALA, desviosDelAbanico, enElAbanico, distanciaDeCaida, efectoSobre, cargarPala, avisoPala, sanearBrasas } from './desafio-brasas.js';
import { crearSonidoBrasas } from './desafio-brasas-sonido.js';

const vivo = (a) => a.estado !== 'morir' && a.estado !== 'irse' && a.estado !== 'bajoTierra' && a.estado !== 'dormido' && !a.enNave;

export function crearBrasasMundo(T, efectos, sonido, api, trampas, defensas) {
  const S = crearSonidoBrasas(sonido);
  const vuelos = [];

  // ---------------------------------------------------------------- los fuegos de la base
  function fuegosDeBase() {
    const lista = [];
    for (const f of api.fuegos?.() || []) if (f && Number.isFinite(f.x) && Number.isFinite(f.z)) lista.push({ x: f.x, y: Number.isFinite(f.y) ? f.y : T.altura(f.x, f.z), z: f.z, tipo: 'fogon' });
    for (const o of defensas?.prendidas || []) lista.push({ x: o.datos.x, y: o.datos.y, z: o.datos.z, tipo: 'antorcha' });
    return lista;
  }
  const fuegoCerca = (pos) => fuegosDeBase().some((f) => Math.hypot(f.x - pos.x, f.z - pos.z) < PALA.cerca && Math.abs(f.y - pos.y) < 2.5);

  // ---------------------------------------------------------------- cargarla (E)
  const conLaPala = () => !!api.cosas().pala && api.armaEnMano?.() === 'pala';
  function avisoCerca(pos) {
    if (!conLaPala()) return null;
    return avisoPala(api.D(), fuegoCerca(pos));
  }
  function usarCerca(pos) {
    if (!conLaPala()) return false;
    const hay = fuegoCerca(pos);
    if (!avisoPala(api.D(), hay)) return false;
    const r = cargarPala(api.D(), hay);
    if (r.accion !== 'cargar') return false;
    S.cargar({ x: pos.x, y: pos.y + 1, z: pos.z });
    efectos.chispas({ x: pos.x, y: pos.y + 0.9, z: pos.z }, 8);
    api.nota('Cargaste la pala con brasas', `${r.cargas} abanicos: clic izquierdo tira las brasas`);
    api.alFabricar?.();
    return true;
  }

  // ---------------------------------------------------------------- el abanico
  const _o = { x: 0, y: 0, z: 0 };
  function tapado(x0, z0, x1, z1, y) {
    const n = 4;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      if (api.obraEnPunto?.(x0 + (x1 - x0) * t, y + 0.9, z0 + (z1 - z0) * t)) return t;
    }
    return 0;
  }
  // `js`: el estado del jugador; `dir`: hacia dónde mira la cámara. Gasta la carga en quien llama.
  function abanico(js, dir) {
    const rumbo = Math.atan2(dir.x, dir.z);
    const yBase = js.pos.y;
    _o.x = js.pos.x + dir.x * 0.5; _o.y = yBase + 1.15; _o.z = js.pos.z + dir.z * 0.5;
    S.abanico({ x: _o.x, y: _o.y, z: _o.z });
    efectos.chispas(_o, 7);
    // las brasas
    for (const des of desviosDelAbanico()) {
      const ang = rumbo + des + (Math.random() - 0.5) * 0.08;
      let dist = distanciaDeCaida(Math.random());
      const t = tapado(js.pos.x, js.pos.z, js.pos.x + Math.sin(ang) * dist, js.pos.z + Math.cos(ang) * dist, yBase);
      if (t > 0) dist = Math.max(0.8, dist * (t - 0.25));   // cae antes de la pared
      const x = js.pos.x + Math.sin(ang) * dist, z = js.pos.z + Math.cos(ang) * dist;
      vuelos.push({ x0: _o.x, y0: _o.y, z0: _o.z, x1: x, y1: T.altura(x, z) + 0.05, z1: z, t: 0, dur: PALA.vuelo * (0.55 + 0.45 * dist / PALA.alcance), sig: 0 });
    }
    // los duendes dentro del abanico
    for (const a of api.aliens) {
      if (!vivo(a) || a.def.vuela && a.estado === 'avanzar' && a.m.g.position.y - T.altura(a.m.g.position.x, a.m.g.position.z) > 2.5) continue;
      const p = a.m.g.position;
      if (!enElAbanico(js.pos, rumbo, p)) continue;
      if (tapado(js.pos.x, js.pos.z, p.x, p.z, yBase)) continue;
      const e = efectoSobre(a.def);
      api.herirAlien(a, e.dano, js.pos, 'jugador', 'fuego');
      if (!vivo(a)) continue;
      a.fuegoT = Math.max(a.fuegoT || 0, e.fuegoT);
      a.ahuyentadoT = Math.max(a.ahuyentadoT || 0, e.duda);
      a.dudaInicial = a.def.jefe ? 0 : 0.6;   // un instante quietos, y después para atrás
      if (a.estado === 'romper') { a.estado = 'avanzar'; a.obra = null; }   // suelta la pared que estaba rompiendo
    }
  }
  // Las brasas en el aire
  const _p = { x: 0, y: 0, z: 0 };
  function actualizar(dt) {
    for (let i = vuelos.length - 1; i >= 0; i--) {
      const v = vuelos[i];
      v.t += dt;
      const k = Math.min(1, v.t / v.dur);
      _p.x = v.x0 + (v.x1 - v.x0) * k; _p.z = v.z0 + (v.z1 - v.z0) * k;
      _p.y = v.y0 + (v.y1 - v.y0) * k + Math.sin(Math.PI * k) * 0.9;
      v.sig -= dt;
      if (v.sig <= 0) {
        v.sig = 0.05;
        efectos.chispas(_p, 1);
        if (Math.random() < 0.4) efectos.fuego(_p, 0.2);
      }
      if (k < 1) continue;
      // cayó: una llamita en el piso, y si hay miel o un barril de resina, se prenden
      _p.y = v.y1;
      efectos.fuego(_p, 0.5);
      efectos.chispas(_p, 3);
      const prendio = trampas?.prenderCerca?.(v.x1, v.z1, PALA.radioPrende) || 0;
      if (prendio) S.prender(_p);
      defensas?.estallarCerca?.(_p, PALA.radioPrende);
      vuelos.splice(i, 1);
    }
  }

  // ---------------------------------------------------------------- el duende que dudó
  const SAL = { rumbo: null, vel: 1, sinAtaque: false };
  function estadoAlien(a, dt, js) {
    if (!(a.ahuyentadoT > 0)) return null;
    a.ahuyentadoT -= dt;
    if (a.dudaInicial > 0) a.dudaInicial -= dt;
    const p = a.m.g.position;
    SAL.sinAtaque = true;
    // un instante quieto (agazapado) y después, para atrás
    if (a.dudaInicial > 0) { SAL.rumbo = null; SAL.vel = 0; return SAL; }
    SAL.rumbo = Math.atan2(p.x - js.pos.x, p.z - js.pos.z);
    SAL.vel = a.def.jefe ? 0.4 : 0.9;
    return SAL;
  }
  function limpiarAlien(a) { a.ahuyentadoT = 0; a.dudaInicial = 0; }
  function limpiar() { vuelos.length = 0; }
  return {
    actualizar, abanico, avisoCerca, usarCerca, estadoAlien, limpiarAlien, limpiar, fuegosDeBase, preparar: () => S.preparar(),
    get enElAire() { return vuelos.length; },
    get vuelos() { return vuelos; },   // (para las pruebas y el diagnóstico)
  };
}
