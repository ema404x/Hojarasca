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
// 4.17.0 (Historia nueva, acto III): la noche de la nevada (capítulo 12) adapta esta noche al guion nuevo: el lado de ataque va del arroyo al galpón (tu galponcito);
// las defensas son PRESTADAS por los vecinos (estacas de Anselmo, trampas de miel de Guido, la campana de Martín, la empalizada de durmientes de Elsa y,
// con D2 = c, la pirca de Tobías) según `historia.prestado`; hay tres olas y un jefe (el Mandamás) con el lomo débil (daño ×2 si lo pegás por la espalda);
// los aliados (el perro, Ramón, Josefina, Fermín con la honda) ayudan según los lazos; con el trato los duendecitos avisan y traban al grandote, salvo que
// quede una deuda sin pagar. Perder no cuesta nada: «Otra vez» (vuelve a las 22:00) o «Que amanezca» (el final perdido).
//
// El estado que se guarda es chico (`progreso.historia.noche`, ver `sanearNoche`). Lo que viene del
// encuentro con los duendes (la elección trato/pelea y las armas conseguidas) lo define el paso 2 (agente
// A): se lee en UN solo lugar (`eleccionDe` y `armasDe`) para adaptarlo sin tocar nada más.

import { TIPOS_ALIEN, ARMAS } from './desafio-reglas.js';
import { factorTension } from './desafio-arsenal.js';

export const MODOS_NOCHE = ['pelea', 'trato'];
// 4.17.0: los aliados que tiene la noche según los lazos y lo decidido: el perro (si tenés), Ramón (lazo ≥ 1 y no vendiste la majada), Josefina (lazo ≥ 1) y
// Fermín con la honda (lazo ≥ 2). `lazos`: { ramon, ema, fermin }; `decisiones`: { majada }
export function aliadosDe({ lazos = {}, decisiones = {}, perro = false } = {}) {
  return { perro: !!perro, ramon: (lazos.ramon ?? 0) >= 1 && decisiones.majada !== 'c', josefina: (lazos.ema ?? 0) >= 1, fermin: (lazos.fermin ?? 0) >= 2 };
}
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
// 4.17.0: ganar cierra la noche; perder la deja pendiente (se repite con «Otra vez» o se deja con `dejarPerdida`: «Que amanezca»)
export function cerrarIntento(h, gano) {
  const n = h.noche = sanearNoche(h.noche);
  if (gano) { n.estado = 'ganada'; espejarEnDuendes(h, { noche: 'ganada', final: n.modo || modoDeNoche(h) }); }
  const horas = n.horasAntes;
  n.horasAntes = null;
  return horas;
}
export function dejarPerdida(h) {
  const n = h.noche = sanearNoche(h.noche);
  n.estado = 'perdida'; n.horasAntes = null;
  espejarEnDuendes(h, { noche: 'perdida', final: '' });
}

// ---------------------------------------------------------------- los números
export const NOCHE = {
  duracion: 270,            // segundos hasta que para la nevada (4:30: tres olas)
  topeVivos: 10,            // duendes en pie a la vez (el resto espera en la cola)
  vidaJugador: 100,
  vidaPuerta: 100,
  regenera: { espera: 6, porSegundo: 3 },   // la vida vuelve sola si dejan de pegarte
  aggro: 7,                 // a esta distancia del jugador, el duende va por él y no por la puerta
  puertaRadio: 2.2,         // desde acá se golpea la puerta del refugio
  travesurasMax: 7,         // en el trato, las que se aguantan
  jefeVida: 380,            // el Mandamás de la noche (el del Desafío tiene 900)
  espalda: { cos: 0.3, multiplicador: 2 },   // el lomo con hongos: pegado por la espalda, ×2
  empalizada: 0.5, pirca: 0.2,              // cuánto más aguanta el galpón con cada defensa
  miel: { radio: 1.7, traba: 3.5, lento: 0.3 },
  aviso: 2.2,               // segundos antes que avisa la campana (y la lucecita del topo)
  enjambre: { traba: 5 },
  flechas: 30,              // el carcaj prestado (la honda no se acaba)
  danoPelea: 0.4,          // lo que pega cada duende (por sobre el número del Desafío)
  danoPuerta: 0.3,
  vidaTrato: 0.7,           // en el trato aguantan menos: se caen sentados
  distanciaSpawn: [40, 46],
  abanico: 0.9,             // radianes en que salen por el lado de ataque
  portonDistancia: 14,      // del centro (la puerta del refugio) a la puerta de las estacas
  cabeza: { desde: 0.72, multiplicador: 1.5 },
  margen: { arriba: 0.3, abajo: 0.15 },
  caida: { sentado: 0.9, huye: 2.0 },
};

// La oleada guionada: cuándo y qué. Tres olas (la campana avisa cada una): 0:00, 1:15 y 2:45; la tercera trae al grandote y al Mandamás.
const R = (n) => Array(n).fill('rastreador'), S = (n) => Array(n).fill('saltador'), X = (n) => Array(n).fill('excavador'), D = (n) => Array(n).fill('tirador');
export const GUION = {
  pelea: [
    { t: 3, ola: 1, tipos: [...R(8), ...S(4)] },
    { t: 78, ola: 2, tipos: [...X(3), ...D(4), 'curandero'] },
    { t: 168, ola: 3, tipos: ['bruto', 'jefe'] },
  ],
  trato: [
    { t: 3, ola: 1, tipos: [...R(6), ...S(3)] },
    { t: 78, ola: 2, tipos: [...X(2), ...D(3)] },
    { t: 168, ola: 3, tipos: ['bruto', 'jefe'] },
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
export function disenoNoche(centro, dx, dz, defensas = null) {
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
  // 4.17.0: las trampas de miel de Guido (en el camino, afuera del portón) y la empalizada de durmientes de Elsa (a un costado, del lado del arroyo)
  const miel = defensas?.miel ? [{ x: porton.x + ux * 7 + px * 2.4, z: porton.z + uz * 7 + pz * 2.4, r: NOCHE.miel.radio }, { x: porton.x + ux * 12 - px * 2.0, z: porton.z + uz * 12 - pz * 2.0, r: NOCHE.miel.radio }] : [];
  const empalizada = defensas?.empalizada ? { a: { x: porton.x - ux * 2.2 + px * 7, z: porton.z - uz * 2.2 + pz * 7 }, b: { x: porton.x - ux * 2.2 + px * 13, z: porton.z - uz * 2.2 + pz * 13 } } : null;
  return { centro: { x: centro.x, z: centro.z }, ux, uz, px, pz, porton, afuera: { x: porton.x + ux * 5, z: porton.z + uz * 5 }, tramos: defensas && !defensas.estacas ? [] : tramos, mitad, miel, empalizada, defensas: defensas || null };
}

// ---------------------------------------------------------------- la simulación
// `op`: { modo, centro: {x, z}, dx, dz, alt(x, z), azar(), resolver?(p {x, z}, radio),
//          defensas?: { estacas, miel, campana, empalizada, pirca }, aliados?: { perro, ramon, josefina, fermin }, ayudas?: boolean (los duendecitos del trato) }
export function crearNoche(op) {
  const modo = MODOS_NOCHE.includes(op.modo) ? op.modo : 'trato';
  const azar = op.azar || Math.random;
  const alt = op.alt || (() => 0);
  const pelea = modo === 'pelea';
  const DEF = op.defensas || { estacas: true, miel: false, campana: false, empalizada: false, pirca: false };
  const ALI = op.aliados || {};
  const ayudas = !pelea && op.ayudas !== false && op.ayudas !== undefined ? !!op.ayudas : false;
  const dis = disenoNoche(op.centro, op.dx, op.dz, DEF);
  const guion = GUION[modo].map((o) => ({ ...o, salio: false, avisado: false }));
  const aguante = NOCHE.vidaPuerta * (1 + (DEF.empalizada ? NOCHE.empalizada : 0) + (DEF.pirca ? NOCHE.pirca : 0));
  const total = totalGuion(modo);
  const S = {
    modo, dis, t: 0, fin: null,
    jugador: { x: op.centro.x, y: 0, z: op.centro.z, vida: NOCHE.vidaJugador, sinGolpe: 99 },
    puerta: aguante, puertaMax: aguante, ola: 0, defensas: DEF, aliados: ALI, ayudas,
    jefe: null, jefeCaido: 0, enjambreUsado: false, preaviso: null, acumAliados: { perro: 0, josefina: 0, fermin: 0, ramon: 0, cura: 0 },
    travesuras: 0, detenidos: 0, bajas: 0, golpesRecibidos: 0,
    flechas: NOCHE.flechas, recarga: 0,
    duendes: [], proyectiles: [], cola: [], eventos: [],
    total, nacidos: 0, siguiente: 1,
  };
  const evento = (tipo, d = {}) => S.eventos.push({ tipo, ...d });
  const vidasDe = (tipo) => Math.max(1, Math.round((tipo === 'jefe' ? NOCHE.jefeVida : TIPOS_ALIEN[tipo].vida) * (pelea ? 1 : NOCHE.vidaTrato)));

  function nacer(tipo, pre = null) {
    const def = TIPOS_ALIEN[tipo] || TIPOS_ALIEN.rastreador;
    const ang = pre ? pre.ang : Math.atan2(dis.uz, dis.ux) + (azar() - 0.5) * NOCHE.abanico;
    const [r0, r1] = NOCHE.distanciaSpawn;
    const r = pre ? pre.r : r0 + azar() * (r1 - r0);
    const x = op.centro.x + Math.cos(ang) * r, z = op.centro.z + Math.sin(ang) * r;
    const d = {
      id: S.siguiente++, tipo, def, x, z, y: alt(x, z), rumbo: Math.atan2(dis.centro.x - x, dis.centro.z - z),
      vida: vidasDe(tipo), vidaMax: vidasDe(tipo), estado: 'avanza', t: 0, cd: 0.4 + azar() * 0.8, wp: DEF.estacas ? 0 : 2, pegado: 0, trampas: [],
      velocidad: 0, ataca: false, golpe: 0, sale: 0, objetivo: 'puerta', disparoT: 1 + azar() * 1.5,
    };
    S.duendes.push(d);
    S.nacidos++;
    if (tipo === 'jefe') S.jefe = d;
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
  // 4.17.0: el Mandamás tiene el lomo con hongos: pegado por la espalda (la flecha viaja hacia donde él mira) recibe el doble
  const porLaEspalda = (d, p) => {
    if (!p || d.tipo !== 'jefe') return false;
    const l = Math.hypot(p.vx, p.vz) || 1;
    return (p.vx / l) * Math.sin(d.rumbo) + (p.vz / l) * Math.cos(d.rumbo) > NOCHE.espalda.cos;
  };
  function herir(d, dano, cabeza, p = null) {
    if (d.estado !== 'avanza' && d.estado !== 'ataca') return;
    const espalda = porLaEspalda(d, p);
    d.vida -= dano * (cabeza ? NOCHE.cabeza.multiplicador : 1) * (espalda ? NOCHE.espalda.multiplicador : 1);
    d.golpe = 1;
    evento('golpe', { d, cabeza, espalda, muere: d.vida <= 0 });
    if (d.vida <= 0) {
      d.estado = 'cae'; d.t = 0; d.ataca = false; d.velocidad = 0;
      S.detenidos++; S.bajas++;
      if (d.tipo === 'jefe') { S.jefeCaido = S.t; evento('jefe-cae', { d }); }
      evento('cae', { d });
    }
  }

  // ---- mover un duende hacia (tx, tz); devuelve la distancia que le queda
  function ir(d, tx, tz, dt, escala = 1) {
    if (d.pegado > 0) escala *= NOCHE.miel.lento;
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
    if (d.pegado > 0) d.pegado = Math.max(0, d.pegado - dt);
    // las trampas de miel de Guido: traban un rato a los chicos (no al grandote ni al Mandamás)
    if (dis.miel.length && !d.def.pesado && (d.estado === 'avanza' || d.estado === 'ataca')) {
      for (let i = 0; i < dis.miel.length; i++) {
        if (d.trampas.includes(i)) continue;
        const m = dis.miel[i];
        if (Math.hypot(d.x - m.x, d.z - m.z) < m.r) { d.trampas.push(i); d.pegado = NOCHE.miel.traba; evento('miel', { d, i }); break; }
      }
    }
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
      S.travesuras += d.tipo === 'jefe' ? 3 : 1; d.estado = 'huye'; d.t = 0;
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
            herir(d, p.dano, (p.y - d.y) > d.def.altura * NOCHE.cabeza.desde, p);
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

  // ---- los aliados (el perro, Josefina, Fermín desde el techo del galpón, Ramón con el martillo) y los duendecitos del trato
  const enPie = (d) => d.estado === 'avanza' || d.estado === 'ataca';
  function masCerca(x, z, rango) {
    let mejor = null, md = rango;
    for (const d of S.duendes) { if (!enPie(d)) continue; const q = Math.hypot(d.x - x, d.z - z); if (q < md) { md = q; mejor = d; } }
    return mejor;
  }
  function aliadosTick(dt) {
    const A = S.acumAliados, c = dis.centro;
    if (ALI.josefina && (A.josefina += dt) >= 2.4) { A.josefina = 0; const b = masCerca(dis.porton.x, dis.porton.z, 34); if (b && azar() < 0.8) { herir(b, 28, false, null); evento('aliado', { quien: 'josefina', d: b }); } }
    if (ALI.fermin && (A.fermin += dt) >= 1.7) { A.fermin = 0; const b = masCerca(c.x, c.z, 26); if (b && azar() < 0.75) { herir(b, 14, false, null); evento('aliado', { quien: 'fermin', d: b }); } }
    if (ALI.perro && (A.perro += dt) >= 1.3) { A.perro = 0; const b = masCerca(c.x, c.z, 8); if (b) { herir(b, 12, false, null); evento('aliado', { quien: 'perro', d: b }); } }
    if (ALI.ramon && (A.ramon += dt) >= 6) { A.ramon = 0; if (S.puerta < S.puertaMax) { S.puerta = Math.min(S.puertaMax, S.puerta + 4); evento('repara'); } }
    // el yuyero de la pelea cura al más herido de sus compañeros
    for (const q of S.duendes) {
      if (q.tipo !== 'curandero' || !enPie(q)) continue;
      q.cura = (q.cura || 0) + dt;
      if (q.cura >= 1.4) { q.cura = 0; let mejor = null; for (const d of S.duendes) if (d !== q && enPie(d) && d.vida < d.vidaMax && Math.hypot(d.x - q.x, d.z - q.z) < 5 && (!mejor || d.vida < mejor.vida)) mejor = d; if (mejor) { mejor.vida = Math.min(mejor.vidaMax, mejor.vida + 9); evento('cura', { d: mejor }); } }
    }
    // el enjambre de los duendecitos se le tira encima al grandote (una vez por noche, con el trato fuerte y sin deuda)
    if (ayudas && op.fuerte && op.deuda !== true && !S.enjambreUsado) {
      const g = S.duendes.find((d) => d.tipo === 'bruto' && enPie(d) && Math.hypot(d.x - c.x, d.z - c.z) < 30);
      if (g) { S.enjambreUsado = true; g.pegado = NOCHE.enjambre.traba; evento('enjambre', { d: g }); }
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
    // las oleadas (la campana de Martín avisa cada una un poco antes)
    for (const o of guion) {
      if (DEF.campana && !o.avisado && S.t >= o.t - NOCHE.aviso) { o.avisado = true; evento('campana', { ola: o.ola }); }
      if (!o.salio && S.t >= o.t) { o.salio = true; S.ola = o.ola; for (const t of o.tipos) S.cola.push(t); evento('oleada', { t: o.t, ola: o.ola }); }
    }
    // salen de a uno si hay lugar (con el trato, una lucecita avisa 2 s antes dónde va a salir un topo)
    S.salida = (S.salida || 0) - dt;
    if (S.preaviso) {
      S.preaviso.t -= dt;
      if (S.preaviso.t <= 0) { nacer(S.cola.shift(), S.preaviso); S.preaviso = null; S.salida = 0.45; }
    } else if (S.cola.length && S.salida <= 0 && activos() < NOCHE.topeVivos) {
      if (S.cola[0] === 'excavador' && ayudas && op.deuda !== true) {
        const ang = Math.atan2(dis.uz, dis.ux) + (azar() - 0.5) * NOCHE.abanico, r = NOCHE.distanciaSpawn[0] + azar() * (NOCHE.distanciaSpawn[1] - NOCHE.distanciaSpawn[0]);
        S.preaviso = { ang, r, t: NOCHE.aviso };
        evento('aviso-topo', { x: op.centro.x + Math.cos(ang) * r, z: op.centro.z + Math.sin(ang) * r });
      } else { nacer(S.cola.shift()); S.salida = 0.45; }
    }
    for (const d of S.duendes) actualizarDuende(d, dt);
    aliadosTick(dt);
    actualizarProyectiles(dt);
    // los que ya se fueron, afuera (el mundo los devuelve al pozo al verlos 'fuera')
    // el final
    const ya = vivosTotal() === 0;
    if (pelea && S.jugador.vida <= 0) S.fin = { gano: false, motivo: 'vida' };
    else if (pelea && S.puerta <= 0) S.fin = { gano: false, motivo: 'puerta' };
    else if (!pelea && S.travesuras >= NOCHE.travesurasMax) S.fin = { gano: false, motivo: 'travesuras' };
    else if (S.jefeCaido && S.t - S.jefeCaido > 1.6) S.fin = { gano: true, motivo: 'jefe' };   // 4.17.0: el Mandamás se va
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
    modo, restante: Math.max(0, NOCHE.duracion - S.t), vida: Math.max(0, S.jugador.vida) / NOCHE.vidaJugador, puerta: Math.max(0, S.puerta) / S.puertaMax,
    duendes: vivosTotal(), travesuras: S.travesuras, travesurasMax: NOCHE.travesurasMax, flechas: S.flechas, ola: S.ola,
    jefe: S.jefe && enPie(S.jefe) ? { vida: Math.max(0, S.jefe.vida) / S.jefe.vidaMax, deEspaldas: jefeDeEspaldas() } : null,
  });
  // ¿el Mandamás está de espaldas a vos? (los hongos del lomo brillan más: la ayuda de los duendecitos del trato)
  function jefeDeEspaldas() {
    const j = S.jefe;
    if (!j || !enPie(j)) return false;
    const dx = S.jugador.x - j.x, dz = S.jugador.z - j.z, l = Math.hypot(dx, dz) || 1;
    return (dx / l) * Math.sin(j.rumbo) + (dz / l) * Math.cos(j.rumbo) < -0.2;
  }
  S.jefeDeEspaldas = jefeDeEspaldas;
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

// ---------------------------------------------------------------- 4.17.0: los blancos de práctica (capítulo 11)
// Cinco blancos de paja en el Puesto del Paso (arco) o cinco latas en los postes del galpón de esquila (honda). Sin límite de flechas ni piedras; el blanco que
// pegás se cae unos segundos y vuelve a pararse, así se puede seguir hasta cinco aciertos. Las armas son las mismas de la noche (ARMAS_NOCHE).
export const PRACTICA = { vuelve: 3.0, vida: 4 };
// `op`: { blancos: [{ x, y, z, r, h }], alt(x, z) }
export function crearPractica(op) {
  const alt = op.alt || (() => 0);
  const S = { blancos: (op.blancos || []).map((b) => ({ ...b, caido: 0 })), proyectiles: [], eventos: [], aciertos: 0, recarga: 0, disparos: 0 };
  S.disparar = (arma, origen, dir, tensionSeg = 0) => {
    const a = ARMAS_NOCHE[arma];
    if (!a) return { ok: false, motivo: 'arma' };
    if (S.recarga > 0) return { ok: false, motivo: 'recarga' };
    const ten = arma === 'arco' ? factorTension(tensionSeg) : { dano: 1, vel: 1 };
    const l = Math.hypot(dir.x, dir.y, dir.z) || 1, v = a.vel * ten.vel;
    S.recarga = a.cadencia; S.disparos++;
    const p = { tipo: arma, x: origen.x, y: origen.y, z: origen.z, vx: (dir.x / l) * v, vy: (dir.y / l) * v + a.sube, vz: (dir.z / l) * v, vida: PRACTICA.vida, g: a.gravedad };
    S.proyectiles.push(p);
    S.eventos.push({ tipo: 'dispara', arma, p });
    return { ok: true, p };
  };
  S.actualizar = (dt) => {
    S.eventos.length = 0;
    dt = Math.min(0.1, Math.max(0, dt));
    S.recarga = Math.max(0, S.recarga - dt);
    for (const b of S.blancos) b.caido = Math.max(0, b.caido - dt);
    for (let i = S.proyectiles.length - 1; i >= 0; i--) {
      const p = S.proyectiles[i];
      p.vida -= dt;
      let quitar = p.vida <= 0;
      const n = Math.max(1, Math.ceil((Math.hypot(p.vx, p.vy, p.vz) * dt) / 0.25)), h = dt / n;
      for (let k = 0; k < n && !quitar; k++) {
        p.vy -= p.g * h; p.x += p.vx * h; p.y += p.vy * h; p.z += p.vz * h;
        if (p.y < alt(p.x, p.z)) { quitar = true; S.eventos.push({ tipo: 'suelo', p }); break; }
        for (let j = 0; j < S.blancos.length; j++) {
          const b = S.blancos[j];
          if (b.caido > 0) continue;
          if (Math.hypot(p.x - b.x, p.z - b.z) > b.r + 0.06 || p.y < b.y || p.y > b.y + b.h) continue;
          b.caido = PRACTICA.vuelve; S.aciertos++;
          S.eventos.push({ tipo: 'blanco', i: j, b });
          quitar = true; break;
        }
      }
      if (quitar) S.proyectiles.splice(i, 1);
    }
    return S;
  };
  return S;
}
// Los blancos de un puesto: `centro` {x, z}, `hacia` {x, z} (de dónde llegás), 5 en abanico a 13–20 m, de paja (altura 1.1) o latas (0.25) sobre un poste (1.3)
export function blancosDe(tipo, centro, hacia, alt) {
  const base = Math.atan2(hacia.z - centro.z, hacia.x - centro.x);
  const salida = [];
  for (let i = 0; i < 5; i++) {
    const a = base + (i - 2) * 0.32, r = 14 + (i % 2) * 5 + i * 0.4;
    const x = centro.x + Math.cos(a) * r, z = centro.z + Math.sin(a) * r, y = alt(x, z);
    salida.push(tipo === 'paja' ? { x, y, z, r: 0.55, h: 1.1 } : { x, y: y + 1.3, z, r: 0.22, h: 0.28, poste: y });
  }
  return salida;
}
