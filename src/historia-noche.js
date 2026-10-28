// 4.13.0 (agente B): la noche de la Historia. Reglas puras (sin three ni DOM; se prueban en Node).
//
// Es el clímax del modo Historia (que en el código es el Relax con `relaxTipo = 'historia'`): una noche
// GUIONADA propia, corta (unos 3 minutos), con un solo lado de ataque, el arco y la honda prestados y un
// callback que devuelve el resultado a la trama. NO es el Desafío (no toca `progreso.desafio`, ni sus
// noches, giros, jefes ni asedio): sólo reusa los números de los duendes (`TIPOS_ALIEN`), las armas
// (`ARMAS.arco` y `ARMAS.honda`) y la tensión del arco del Desafío.
//
// Dos maneras de jugarla, según lo que se decidió con los duendes antes:
//   · 'pelea': la defensa de verdad. Los duendes pegan (al jugador y a la puerta del refugio); si se te
//     acaba la vida o se cae la puerta, la noche se pierde. Al amanecer, los que quedan se van.
//   · 'trato': la prueba. Los duendes vienen corriendo a tocar la puerta, como un juego viejo: no lastiman a
//     nadie. El que recibe un flechazo o una pedrada se cae sentado, se ríe y se va. Cada uno que llega a
//     la puerta es una travesura; con demasiadas, se ríen de vos y la prueba se pierde.
// En las dos, ganar es parar a todos o aguantar hasta el amanecer; perder no cuesta nada (reintento
// ilimitado, sin castigo, sin tocar la economía ni las obras del Relax).
//
// El estado que se guarda es chico (`progreso.historia.noche`, ver `sanearNoche`). Lo que viene del
// encuentro con los duendes (la elección trato/pelea y las armas conseguidas) lo define el paso 2 (agente
// A): se lee en UN solo lugar (`eleccionDe` y `armasDe`) para adaptarlo sin tocar nada más.

import { TIPOS_ALIEN, ARMAS } from './desafio-reglas.js';
import { factorTension } from './desafio-arsenal.js';

export const MODOS_NOCHE = ['pelea', 'trato'];
export const ESTADOS_NOCHE = ['pendiente', 'ganada', 'perdida'];

// ---------------------------------------------------------------- lo guardado
export function nocheNueva() { return { estado: 'pendiente', intentos: 0, modo: '', horasAntes: null }; }
export function sanearNoche(v) {
  const n = nocheNueva();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return n;
  if (ESTADOS_NOCHE.includes(v.estado)) n.estado = v.estado;
  n.intentos = Math.max(0, Math.min(999, Math.floor(Number(v.intentos) || 0)));
  if (MODOS_NOCHE.includes(v.modo)) n.modo = v.modo;
  // el reloj que había antes de salir a la noche (si se cerró el juego en medio, se devuelve al volver)
  const h = Number(v.horasAntes);
  if (v.horasAntes !== null && v.horasAntes !== undefined && Number.isFinite(h)) n.horasAntes = ((h % 24) + 24) % 24;
  return n;
}

// Lo que viene del paso 2 (agente A, rama v4130-a): `progreso.historia.duendes` = { trato: null | 'trato' | 'pelea', armas: { arco, honda },
// noche: 'ninguna' | 'pendiente' | 'ganada' | 'perdida', final, intentos, ... }. Sólo estas funciones saben cómo se llama cada cosa: si el
// encuentro la guarda con otro nombre, se cambia acá. Lo que la noche escribe del lado de A (`noche`, `final`, `intentos`) se anota en
// `espejarEnDuendes`, para que el hito de la trama quede igual lo mire quien lo mire.
export function eleccionDe(h) {
  const e = h?.duendes?.trato ?? h?.duendes?.eleccion ?? null;
  return e === 'trato' || e === 'pelea' ? e : null;
}
export function armasDe(h) {
  const a = h?.duendes?.armas ?? h?.armas ?? {};
  return { arco: !!a.arco, honda: !!a.honda };
}
// La noche se juega de una forma o de la otra; sin elección (una partida retocada), la del trato.
export const modoDeNoche = (h) => eleccionDe(h) || 'trato';
// El arsenal prestado: con las armas que conseguiste, y lo que falte te lo presta un vecino (la noche nunca
// se traba por una misión sin hacer). `prestadas` dice cuáles no eran tuyas.
export function arsenalDeNoche(h) {
  const a = armasDe(h);
  const prestadas = [];
  if (!a.arco) prestadas.push('arco');
  if (!a.honda) prestadas.push('honda');
  return { arco: true, honda: true, prestadas };
}
// pendiente es todo menos ganada (la noche 'ninguna' de A, sin encuentro, también se juega: la trama nunca se traba)
export const nochePendiente = (h) => (h?.noche?.estado || 'pendiente') !== 'ganada' && h?.duendes?.noche !== 'ganada';
// el hito de la trama, del lado de A (si el encuentro lo guardó)
function espejarEnDuendes(h, campos) {
  const d = h?.duendes;
  if (!d || typeof d !== 'object' || Array.isArray(d)) return;
  if (campos.intento) d.intentos = Math.max(0, Math.min(99, Math.floor(Number(d.intentos) || 0) + 1));
  if (campos.noche) d.noche = campos.noche;
  if (campos.final) d.final = campos.final;
}

// Empieza un intento: anota el reloj de antes (para devolverlo) y cuenta el intento.
export function empezarIntento(h, horas) {
  const n = h.noche = sanearNoche(h.noche);
  n.intentos = Math.min(999, n.intentos + 1);
  n.modo = modoDeNoche(h);
  n.horasAntes = ((Number(horas) || 0) % 24 + 24) % 24;
  espejarEnDuendes(h, { intento: true });
  return n;
}
// Termina el intento: ganó o perdió. Devuelve el reloj que había que devolver (o null).
export function cerrarIntento(h, gano) {
  const n = h.noche = sanearNoche(h.noche);
  n.estado = gano ? 'ganada' : 'perdida';
  const horas = n.horasAntes;
  n.horasAntes = null;
  espejarEnDuendes(h, { noche: gano ? 'ganada' : 'perdida', final: gano ? (n.modo || modoDeNoche(h)) : '' });
  return horas;
}

// ---------------------------------------------------------------- los números
export const NOCHE = {
  duracion: 190,            // segundos hasta el amanecer
  topeVivos: 10,            // duendes en pie a la vez (el resto espera en la cola)
  vidaJugador: 100,
  vidaPuerta: 100,
  regenera: { espera: 6, porSegundo: 3 },   // la vida vuelve sola si dejan de pegarte
  aggro: 7,                 // a esta distancia del jugador, el duende va por él y no por la puerta
  puertaRadio: 2.2,         // desde acá se golpea la puerta del refugio
  travesurasMax: 7,         // en el trato, las que se aguantan
  flechas: 30,              // el carcaj prestado (la honda no se acaba)
  danoPelea: 0.55,          // lo que pega cada duende (por sobre el número del Desafío)
  danoPuerta: 0.3,
  vidaTrato: 0.7,           // en el trato aguantan menos: se caen sentados
  distanciaSpawn: [40, 46],
  abanico: 0.9,             // radianes en que salen por el lado de ataque
  portonDistancia: 14,      // del centro (la puerta del refugio) a la puerta de las estacas
  cabeza: { desde: 0.72, multiplicador: 1.5 },
  margen: { arriba: 0.3, abajo: 0.15 },
  caida: { sentado: 0.9, huye: 2.0 },
};

// La oleada guionada: cuándo y qué. Una sola serie por modo.
export const GUION = {
  pelea: [
    { t: 6, tipos: ['rastreador', 'rastreador', 'rastreador'] },
    { t: 28, tipos: ['rastreador', 'rastreador', 'rastreador', 'rastreador'] },
    { t: 52, tipos: ['rastreador', 'rastreador', 'tirador'] },
    { t: 78, tipos: ['saltador', 'rastreador', 'rastreador', 'tirador'] },
    { t: 105, tipos: ['bruto', 'rastreador', 'rastreador'] },
    { t: 140, tipos: ['rastreador', 'rastreador', 'rastreador', 'tirador', 'tirador'] },
  ],
  trato: [
    { t: 6, tipos: ['rastreador', 'rastreador', 'rastreador'] },
    { t: 26, tipos: ['saltador', 'rastreador', 'rastreador'] },
    { t: 48, tipos: ['rastreador', 'saltador', 'rastreador', 'saltador'] },
    { t: 72, tipos: ['rastreador', 'rastreador', 'rastreador', 'saltador', 'saltador'] },
    { t: 100, tipos: ['bruto', 'rastreador', 'rastreador'] },
    { t: 130, tipos: ['saltador', 'saltador', 'rastreador', 'rastreador', 'rastreador'] },
  ],
};
export const totalGuion = (modo) => GUION[modo].reduce((s, o) => s + o.tipos.length, 0);

// El arsenal prestado: los números salen del Desafío (arco de lenga y honda de cuero).
export const ARMAS_NOCHE = {
  arco: { nombre: 'Arco de lenga', dano: ARMAS.arco.dano, vel: ARMAS.arco.vel, cadencia: ARMAS.arco.cadencia, gravedad: 9.8, sube: 1.2 },
  honda: { nombre: 'Honda de cuero', dano: ARMAS.honda.dano, vel: ARMAS.honda.vel, cadencia: ARMAS.honda.cadencia, gravedad: 9.8, sube: 1.2 },
};

// El diseño del lugar (en el plano): el centro es la puerta del refugio, (dx, dz) el lado de ataque
// (vector unitario). Las estacas hacen un arco con un hueco (el portón) en el medio.
export function disenoNoche(centro, dx, dz) {
  const l = Math.hypot(dx, dz) || 1;
  const ux = dx / l, uz = dz / l;
  const px = -uz, pz = ux;   // el costado
  const D = NOCHE.portonDistancia;
  const porton = { x: centro.x + ux * D, z: centro.z + uz * D };
  const mitad = 1.6;   // medio ancho del hueco
  const largo = 9;     // de cada lado
  const tramos = [];
  for (const s of [-1, 1]) {
    const a = { x: porton.x + px * mitad * s, z: porton.z + pz * mitad * s };
    // cada ala se curva un poco hacia el refugio
    const b = { x: porton.x + px * (mitad + largo) * s - ux * 3.2, z: porton.z + pz * (mitad + largo) * s - uz * 3.2 };
    tramos.push({ a, b });
  }
  return { centro: { x: centro.x, z: centro.z }, ux, uz, px, pz, porton, afuera: { x: porton.x + ux * 5, z: porton.z + uz * 5 }, tramos, mitad };
}

// ---------------------------------------------------------------- la simulación
// `op`: { modo, centro: {x, z}, dx, dz, alt(x, z), azar(), resolver?(p {x, z}, radio) }
export function crearNoche(op) {
  const modo = MODOS_NOCHE.includes(op.modo) ? op.modo : 'trato';
  const azar = op.azar || Math.random;
  const alt = op.alt || (() => 0);
  const pelea = modo === 'pelea';
  const dis = disenoNoche(op.centro, op.dx, op.dz);
  const guion = GUION[modo].map((o) => ({ ...o, salio: false }));
  const total = totalGuion(modo);
  const S = {
    modo, dis, t: 0, fin: null,
    jugador: { x: op.centro.x, y: 0, z: op.centro.z, vida: NOCHE.vidaJugador, sinGolpe: 99 },
    puerta: NOCHE.vidaPuerta,
    travesuras: 0, detenidos: 0, bajas: 0, golpesRecibidos: 0,
    flechas: NOCHE.flechas, recarga: 0,
    duendes: [], proyectiles: [], cola: [], eventos: [],
    total, nacidos: 0, siguiente: 1,
  };
  const evento = (tipo, d = {}) => S.eventos.push({ tipo, ...d });
  const vidasDe = (tipo) => Math.max(1, Math.round(TIPOS_ALIEN[tipo].vida * (pelea ? 1 : NOCHE.vidaTrato)));

  function nacer(tipo) {
    const def = TIPOS_ALIEN[tipo] || TIPOS_ALIEN.rastreador;
    const ang = Math.atan2(dis.uz, dis.ux) + (azar() - 0.5) * NOCHE.abanico;
    const [r0, r1] = NOCHE.distanciaSpawn;
    const r = r0 + azar() * (r1 - r0);
    const x = op.centro.x + Math.cos(ang) * r, z = op.centro.z + Math.sin(ang) * r;
    const d = {
      id: S.siguiente++, tipo, def, x, z, y: alt(x, z), rumbo: Math.atan2(dis.centro.x - x, dis.centro.z - z),
      vida: vidasDe(tipo), vidaMax: vidasDe(tipo), estado: 'avanza', t: 0, cd: 0.4 + azar() * 0.8, wp: 0,
      velocidad: 0, ataca: false, golpe: 0, sale: 0, objetivo: 'puerta', disparoT: 1 + azar() * 1.5,
    };
    S.duendes.push(d);
    S.nacidos++;
    evento('nace', { d });
    return d;
  }
  const activos = () => S.duendes.filter((d) => d.estado === 'avanza' || d.estado === 'ataca').length;
  const vivosTotal = () => S.cola.length + guion.reduce((s, o) => s + (o.salio ? 0 : o.tipos.length), 0) + activos();

  // ---- el jugador dispara
  S.disparar = (arma, origen, dir, tensionSeg = 0) => {
    const a = ARMAS_NOCHE[arma];
    if (!a || S.fin) return { ok: false, motivo: 'fin' };
    if (S.recarga > 0) return { ok: false, motivo: 'recarga' };
    if (arma === 'arco' && S.flechas <= 0) return { ok: false, motivo: 'sin-flechas' };
    const ten = arma === 'arco' ? factorTension(tensionSeg) : { dano: 1, vel: 1 };
    const l = Math.hypot(dir.x, dir.y, dir.z) || 1;
    const v = a.vel * ten.vel;
    if (arma === 'arco') S.flechas--;
    S.recarga = a.cadencia;
    const p = {
      tipo: arma, de: 'jugador', x: origen.x, y: origen.y, z: origen.z,
      vx: (dir.x / l) * v, vy: (dir.y / l) * v + a.sube, vz: (dir.z / l) * v,
      dano: a.dano * ten.dano, vida: 4, g: a.gravedad,
    };
    S.proyectiles.push(p);
    evento('dispara', { arma, p });
    return { ok: true, p };
  };

  // ---- golpe a un duende (la flecha, la piedra)
  function herir(d, dano, cabeza) {
    if (d.estado !== 'avanza' && d.estado !== 'ataca') return;
    d.vida -= dano * (cabeza ? NOCHE.cabeza.multiplicador : 1);
    d.golpe = 1;
    evento('golpe', { d, cabeza, muere: d.vida <= 0 });
    if (d.vida <= 0) {
      d.estado = 'cae'; d.t = 0; d.ataca = false; d.velocidad = 0;
      S.detenidos++; S.bajas++;
      evento('cae', { d });
    }
  }

  // ---- mover un duende hacia (tx, tz); devuelve la distancia que le queda
  function ir(d, tx, tz, dt, escala = 1) {
    const dx = tx - d.x, dz = tz - d.z, dist = Math.hypot(dx, dz);
    if (dist > 0.001) {
      const paso = Math.min(dist, d.def.vel * escala * dt);
      d.x += (dx / dist) * paso; d.z += (dz / dist) * paso;
      d.rumbo = Math.atan2(dx, dz);
      d.velocidad = paso / Math.max(dt, 1e-6);
    }
    if (op.resolver) { const p = { x: d.x, z: d.z }; op.resolver(p, d.def.radio * 0.8); d.x = p.x; d.z = p.z; }
    d.y = alt(d.x, d.z);
    return dist;
  }

  function actualizarDuende(d, dt) {
    const J = S.jugador;
    d.golpe = Math.max(0, d.golpe - dt * 3);
    if (d.estado === 'cae') {
      d.t += dt; d.velocidad = 0;
      if (d.t >= NOCHE.caida.sentado) {
        if (pelea) { if (d.t >= 2.4) d.estado = 'fuera'; }
        else { d.estado = 'huye'; d.t = 0; evento('huye', { d }); }
      }
      return;
    }
    if (d.estado === 'huye') {
      d.t += dt;
      const lx = d.x - dis.centro.x, lz = d.z - dis.centro.z, l = Math.hypot(lx, lz) || 1;
      ir(d, d.x + (lx / l) * 6, d.z + (lz / l) * 6, dt, 1.15);
      if (d.t >= NOCHE.caida.huye) d.estado = 'fuera';
      return;
    }
    if (d.estado === 'amanece') {   // el que queda al amanecer se va
      d.t += dt;
      const lx = d.x - dis.centro.x, lz = d.z - dis.centro.z, l = Math.hypot(lx, lz) || 1;
      ir(d, d.x + (lx / l) * 6, d.z + (lz / l) * 6, dt, 1.2);
      if (d.t >= 1.8) d.estado = 'fuera';
      return;
    }
    if (d.estado === 'fuera') return;
    // avanza o ataca
    const dJ = Math.hypot(J.x - d.x, J.z - d.z);
    const aDistancia = !!d.def.aDistancia && pelea;
    const alcance = aDistancia ? d.def.distancia : d.def.alcance;
    d.ataca = false;
    // a quién va: el tirador siempre al jugador (si está a tiro); los demás al jugador si está cerca, o a la puerta
    const persigue = pelea && (aDistancia ? dJ < d.def.alcance : dJ < NOCHE.aggro);
    d.objetivo = persigue ? 'jugador' : 'puerta';
    if (d.objetivo === 'jugador') {
      if (aDistancia) {
        // se planta a distancia y tira; se acerca si está lejos y se aleja un poco si lo apretás
        if (dJ > d.def.distancia + 2) ir(d, J.x, J.z, dt);
        else if (dJ < d.def.distancia - 4) ir(d, d.x - (J.x - d.x), d.z - (J.z - d.z), dt, 0.6);
        else { d.velocidad = 0; d.rumbo = Math.atan2(J.x - d.x, J.z - d.z); }
        d.disparoT -= dt;
        if (d.disparoT <= 0 && dJ < d.def.alcance) {
          d.disparoT = d.def.cadencia;
          d.ataca = true;
          const ox = d.x, oy = d.y + d.def.altura * 0.75, oz = d.z;
          const tx = J.x + (azar() - 0.5) * 1.6, ty = J.y + 1.1, tz = J.z + (azar() - 0.5) * 1.6;
          const L = Math.hypot(tx - ox, ty - oy, tz - oz) || 1, v = 19;
          S.proyectiles.push({ tipo: 'bellota', de: 'duende', x: ox, y: oy, z: oz, vx: (tx - ox) / L * v, vy: (ty - oy) / L * v, vz: (tz - oz) / L * v, dano: d.def.dano * NOCHE.danoPelea, vida: 3, g: 0 });
          evento('tira', { d });
        }
      } else if (dJ > alcance) {
        d.estado = 'avanza'; ir(d, J.x, J.z, dt);
      } else {
        d.estado = 'ataca'; d.velocidad = 0; d.rumbo = Math.atan2(J.x - d.x, J.z - d.z); d.ataca = true;
        d.cd -= dt;
        if (d.cd <= 0) {
          d.cd = d.def.cadencia;
          J.vida -= d.def.dano * NOCHE.danoPelea; J.sinGolpe = 0; S.golpesRecibidos++;
          evento('pega', { d, a: 'jugador' });
        }
      }
      return;
    }
    // a la puerta: primero al portón (por afuera), después derecho a la puerta del refugio
    if (d.wp === 0) {
      const r = ir(d, dis.afuera.x, dis.afuera.z, dt);
      if (r < 1.6) d.wp = 1;
      d.estado = 'avanza';
      return;
    }
    if (d.wp === 1) {
      const r = ir(d, dis.porton.x, dis.porton.z, dt);
      if (r < 1.0) d.wp = 2;
      d.estado = 'avanza';
      return;
    }
    const rd = Math.hypot(dis.centro.x - d.x, dis.centro.z - d.z);
    if (rd > NOCHE.puertaRadio) { d.estado = 'avanza'; ir(d, dis.centro.x, dis.centro.z, dt); return; }
    // llegó a la puerta
    d.velocidad = 0; d.rumbo = Math.atan2(dis.centro.x - d.x, dis.centro.z - d.z);
    if (!pelea) {
      // la travesura: toca, se ríe y sale corriendo
      S.travesuras++; d.estado = 'huye'; d.t = 0;
      evento('travesura', { d });
      return;
    }
    d.estado = 'ataca'; d.ataca = true;
    d.cd -= dt;
    if (d.cd <= 0) {
      d.cd = d.def.cadencia;
      S.puerta -= d.def.danoObra * NOCHE.danoPuerta;
      evento('pega', { d, a: 'puerta' });
    }
  }

  function actualizarProyectiles(dt) {
    const J = S.jugador;
    for (let i = S.proyectiles.length - 1; i >= 0; i--) {
      const p = S.proyectiles[i];
      p.vida -= dt;
      let quitar = p.vida <= 0;
      // en tramos cortos: una flecha a 48 m/s hace casi un metro por cuadro y un duende mide 70 cm
      const paso = Math.hypot(p.vx, p.vy, p.vz) * dt;
      const n = Math.max(1, Math.ceil(paso / 0.25));
      const h = dt / n;
      for (let k = 0; k < n && !quitar; k++) {
        p.vy -= p.g * h;
        p.x += p.vx * h; p.y += p.vy * h; p.z += p.vz * h;
        if (p.y < alt(p.x, p.z)) { quitar = true; evento('suelo', { p }); break; }
        if (p.de === 'jugador') {
          for (const d of S.duendes) {
            if (d.estado !== 'avanza' && d.estado !== 'ataca') continue;
            const r = d.def.radio + 0.06;
            if (Math.hypot(p.x - d.x, p.z - d.z) > r) continue;
            if (p.y < d.y - NOCHE.margen.abajo || p.y > d.y + d.def.altura + NOCHE.margen.arriba) continue;
            herir(d, p.dano, (p.y - d.y) > d.def.altura * NOCHE.cabeza.desde);
            quitar = true; break;
          }
        } else if (pelea) {
          if (Math.hypot(p.x - J.x, p.z - J.z) < 0.45 && p.y > J.y && p.y < J.y + 1.9) {
            J.vida -= p.dano; J.sinGolpe = 0; S.golpesRecibidos++;
            evento('pega', { d: null, a: 'jugador', proyectil: true });
            quitar = true;
          }
        }
      }
      if (quitar) S.proyectiles.splice(i, 1);
    }
  }

  // ---- un paso
  S.actualizar = (dt, jug) => {
    S.eventos.length = 0;
    if (S.fin) return S;
    dt = Math.min(0.1, Math.max(0, dt));
    S.t += dt;
    if (jug) { S.jugador.x = jug.x; S.jugador.y = jug.y; S.jugador.z = jug.z; }
    S.recarga = Math.max(0, S.recarga - dt);
    S.jugador.sinGolpe += dt;
    if (pelea && S.jugador.sinGolpe > NOCHE.regenera.espera) S.jugador.vida = Math.min(NOCHE.vidaJugador, S.jugador.vida + NOCHE.regenera.porSegundo * dt);
    // las oleadas
    for (const o of guion) if (!o.salio && S.t >= o.t) { o.salio = true; for (const t of o.tipos) S.cola.push(t); evento('oleada', { t: o.t }); }
    // salen de a uno si hay lugar
    S.salida = (S.salida || 0) - dt;
    if (S.cola.length && S.salida <= 0 && activos() < NOCHE.topeVivos) { nacer(S.cola.shift()); S.salida = 0.45; }
    for (const d of S.duendes) actualizarDuende(d, dt);
    actualizarProyectiles(dt);
    // los que ya se fueron, afuera (el mundo los devuelve al pozo al verlos 'fuera')
    // el final
    const ya = vivosTotal() === 0;
    if (pelea && S.jugador.vida <= 0) S.fin = { gano: false, motivo: 'vida' };
    else if (pelea && S.puerta <= 0) S.fin = { gano: false, motivo: 'puerta' };
    else if (!pelea && S.travesuras >= NOCHE.travesurasMax) S.fin = { gano: false, motivo: 'travesuras' };
    else if (ya) { S.limpio = (S.limpio || 0) + dt; if (S.limpio > 1.8) S.fin = { gano: true, motivo: 'todos' }; }
    else if (S.t >= NOCHE.duracion) {
      for (const d of S.duendes) if (d.estado === 'avanza' || d.estado === 'ataca') { d.estado = 'amanece'; d.t = 0; d.ataca = false; }
      S.cola.length = 0;
      S.fin = { gano: true, motivo: 'amanecer' };
    }
    if (S.fin) evento('fin', { fin: S.fin });
    return S;
  };

  S.restantes = () => vivosTotal();
  S.hud = () => ({
    modo, restante: Math.max(0, NOCHE.duracion - S.t), vida: Math.max(0, S.jugador.vida) / NOCHE.vidaJugador, puerta: Math.max(0, S.puerta) / NOCHE.vidaPuerta,
    duendes: vivosTotal(), travesuras: S.travesuras, travesurasMax: NOCHE.travesurasMax, flechas: S.flechas,
  });
  return S;
}

// ---------------------------------------------------------------- el lado de ataque
// De 16 rumbos alrededor de la puerta del refugio, el que tenga el camino más limpio: sin agua, sin
// pendiente fuerte, sin obstáculos. `libre(x, z)` dice si un punto es transitable (el mundo lo arma con el
// terreno y las colisiones). Devuelve un vector unitario.
export function elegirLado(centro, libre, alt, prefiere = null) {
  let mejor = null;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const dx = Math.cos(a), dz = Math.sin(a);
    let malos = 0;
    for (let r = 8; r <= 46; r += 2) {
      const x = centro.x + dx * r, z = centro.z + dz * r;
      if (!libre(x, z)) malos += 1;
      const y0 = alt(x, z), y1 = alt(x + dx * 2, z + dz * 2);
      if (Math.abs(y1 - y0) > 1.1) malos += 1.5;
    }
    // y los costados del abanico también
    for (const da of [-0.35, 0.35]) {
      for (let r = 20; r <= 44; r += 6) { if (!libre(centro.x + Math.cos(a + da) * r, centro.z + Math.sin(a + da) * r)) malos += 0.5; }
    }
    // preferencia leve por el rumbo pedido (por ejemplo, el opuesto al lago)
    const sesgo = prefiere ? (1 - (dx * prefiere.dx + dz * prefiere.dz)) * 0.8 : 0;
    const puntaje = malos + sesgo;
    if (!mejor || puntaje < mejor.puntaje) mejor = { dx, dz, puntaje };
  }
  return mejor;
}

// Un texto corto con el tiempo que queda (m:ss)
export function relojNoche(seg) {
  const s = Math.max(0, Math.ceil(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
