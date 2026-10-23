// 4.9 aliados: los vecinos que ayudan en las noches grandes, en el mundo (las reglas y los números están en desafio-vecinos.js).
//
// Anselmo, la abuela Herminia y los chicos tienen cuerpo: son los mismos vecinos de la aldea (las fichas de aldea.js), armados con
// gente.js la primera vez que hace falta (de a poco, unos ms por cuadro) y guardados escondidos entre noche y noche. Vienen al caer la
// tarde de una noche grande, cada uno con el nivel de ayuda que tenga (0 no viene) y se van al amanecer. Martín no tiene cuerpo:
// va en la trochita, que ya da la vuelta por el valle; cuando la locomotora pasa por el punto de la vía más cercano a la base, toca el silbato.
// Todo se mueve con el sistema de rutinas de gente.js (`ruta`) y con las órdenes de desafio-ordenes.js (puesto, vení conmigo).
//
// Rendimiento: sin luces nuevas (los fuegos son llamas aditivas y un brillo en el suelo, no PointLight), cuatro fuegos como mucho,
// armados en la carga y escondidos; nada por cuadro cuando no es una noche grande o no hay vecinos; los vecinos lejos de la vista
// los esconde gente.js (a más de 130 m) y acá se mueven a pasos de un cuarto de segundo.
import { VECINOS_ALDEA, POBLADORES_ALDEA } from './aldea.js';
import { HORA_ATAQUE, HORA_AMANECER, claveNoche, efectosPartida } from './desafio-reglas.js';
import { esNocheGrande } from './desafio-duendes-reglas.js';
import { nocheEnCurso } from './desafio-ambiente.js';
import { CUERPOS, CLAVES_CUERPOS, ANSELMO, HERMINIA, MARTIN, HONDA, VELOCIDAD_PIEDRA, TIPOS_FUEGO, radioDeFuego, nivelDeAyuda, puntosDeFuegos, ajusteDeViejo, puntoDeViaMasCercano, silbatoServiria, pasoDeLaTrochita, silbatoDispersa, esBlancoDeHonda, puestoDe } from './desafio-vecinos.js';
import { ordenDe, siguienteOrden, respuestaDe, marcaPuesto, puntoDeOrden, velocidadSiguiendo, LEJOS_ALCANZA } from './desafio-ordenes.js';

const ADELANTE_HONDA = 1.8;
const _s = { x: 0, z: 0, tocado: false }, desde = { x: 0, y: 0, z: 0 }, vel = { x: 0, y: 0, z: 0 };

// ---------------------------------------------------------------- el mundo
// `piezas` (desafio-vecinos-piezas.js) arma lo que se ve: `fuego(tipo)` y `martillo()`. Se pasa de afuera para probar esto en Node (sin three).
export function crearVecinosMundo(T, escena, api, piezas) {
  const est = {
    key: null, grande: false, dentro: false, niveles: { anselmo: 0, herminia: 0, martin: 0, chicos: 0 },
    cuerpos: new Map(),            // clave del cuerpo -> { clave, npc, presente, t, obra, ... }
    armando: null,                 // { c, tarea }: el cuerpo que se está armando de a poco
    spots: null,                   // los puntos de los fuegos de esta noche
    lit: [],                       // los fuegos prendidos: { x, z, radio, tipo }
    pasada: { armada: true }, pasadasEfecto: 0, via: null,
    reloj: 0, avisado: false, ocultos: false, dispersados: 0, silbatos: 0,
  };
  // los cuatro fuegos se arman ahora (en la carga) y quedan a la vista fuera del mapa hasta el primer cuadro: así el motor ya compiló todo
  const pool = TIPOS_FUEGO.map((tipo) => {
    const f = piezas.fuego(tipo);
    f.g.position.set(0, -500, 0);
    escena.add(f.g);
    return f;
  });
  let martillo = null;   // el de Anselmo: se arma la primera vez que viene

  // lo que cambia poco y se pide seguido
  let cacheParedes = null, tParedes = -9;
  const paredes = () => {
    const ahora = performance.now();
    if (!cacheParedes || ahora - tParedes > 3000) { cacheParedes = api.paredes?.() || []; tParedes = ahora; }
    return cacheParedes;
  };
  const rumboLado = () => { const l = api.D().ladoNoche; return l && Number.isFinite(l.rumbo) ? l.rumbo : null; };
  const ctxPuestos = () => ({ base: api.centroBase(), paredes: paredes(), lado: rumboLado(), fuegos: est.spots });
  // el puesto de alguien (el marcado por el jugador, o el que le toca por su oficio)
  const puestoDeAliado = (clave) => puestoDe(api.D().puestosAliados, clave, ctxPuestos());

  const libre = (x, z) => !api.agua?.(x, z);
  const sobre = (p) => ({ x: p.x, z: p.z });

  // ---------------------------------------------------------------- los cuerpos
  function cuerpo(clave) {
    let c = est.cuerpos.get(clave);
    if (!c) { c = { clave, npc: null, presente: false, t: 0, tBuscar: 0, obra: null, golpe: 0, corre: false, prende: 0, encendidos: 0, tiro: 1 + Math.random() }; est.cuerpos.set(clave, c); }
    return c;
  }
  function defDe(clave) {
    const k = CUERPOS[clave];
    const ficha = k.tabla === 'poblador' ? POBLADORES_ALDEA[k.ficha] : VECINOS_ALDEA[k.ficha];
    const b = api.centroBase();
    return {
      clave: k.clave, colores: ficha.colores, pos: { x: b.x, z: b.z }, mira: { x: b.x, z: b.z + 1 },
      nombre: ficha.nombre, oficio: ficha.oficio, saludo: ficha.saludo, despedida: ficha.despedida,
      mano: ficha.mano, velocidad: 1.35, talla: ficha.talla,
    };
  }
  function prepararNpc(c, npc) {
    c.npc = npc;
    npc.claveAliado = c.clave;
    npc.enBase = true;
    npc.dormido = true;
    npc.conMartillo = c.clave === 'anselmo';
    if (c.clave === 'anselmo' && npc.mano) { martillo ||= piezas.martillo(); npc.mano.add(martillo); }
    if (npc.mate) npc.mate.visible = false;
  }
  // arma, de a poco, el cuerpo que falta (uno por vez)
  function armar(ms) {
    const g = api.gente?.();
    if (!g) return;
    if (!est.armando) {
      for (const clave of CLAVES_CUERPOS.filter((x) => est.niveles[CUERPOS[x].vecino] > 0)) {
        const c = cuerpo(clave);
        if (c.npc) continue;
        const tarea = g.armarPobladorDeAPoco?.(defDe(clave));
        if (tarea) { est.armando = { c, tarea }; break; }
      }
    }
    if (est.armando) {
      const { c, tarea } = est.armando;
      if (tarea.avanzar(ms) && tarea.npc) { prepararNpc(c, tarea.npc); est.armando = null; }
    }
  }

  // ---------------------------------------------------------------- las noches
  function nuevaNoche(key, horas, dia) {
    const d = api.D();
    est.key = key;
    est.grande = esNocheGrande({ noche: nocheEnCurso(d, dia, horas), especial: d.especial, sinFin: !!d.sinFin });
    est.dentro = false; est.avisado = false;
    est.spots = null; est.lit.length = 0;
    est.pasada = { armada: true }; est.pasadasEfecto = 0; est.via = null; est.dispersados = 0; est.silbatos = 0;
    for (const c of est.cuerpos.values()) { c.encendidos = 0; c.prende = 0; c.obra = null; c.corre = false; }
    apagarFuegos();
    // el nivel de cada uno queda fijo toda la noche
    for (const v of Object.keys(est.niveles)) est.niveles[v] = est.grande ? nivelDeAyuda(d, v) : 0;
  }
  function apagarFuegos() { for (const f of pool) { f.g.visible = false; f.g.position.y = -500; } est.lit.length = 0; }
  function presentar(c) {
    const npc = c.npc;
    if (c.clave === 'herminia') puntosFuegos();   // su puesto depende del primer fuego
    const p = puestoDeAliado(c.clave);
    const b = api.centroBase();
    npc.pos.set(p.x, api.alturaEn(p.x, p.z), p.z);
    const lado = rumboLado() ?? 0;
    const mira = c.clave === 'nene' || c.clave === 'nena' ? { x: p.x + Math.sin(lado) * 20, z: p.z + Math.cos(lado) * 20 } : { x: b.x, z: b.z };
    npc.ruta = [{ x: p.x, z: p.z, quieto: 9999, mirar: mira }];
    npc.etapa = 0; npc.espera = 0; npc.velocidad = 1.35; npc.camino = null;
    npc.dormido = false; npc.enBase = true;
    npc.saludo = c.clave === 'herminia' ? 'Acá estoy, hijo. Los fogones los prendo yo; vos ocupate de los bichos.' : c.clave === 'anselmo' ? 'Traje el martillo. Lo que se rompa, lo arreglo.' : '¡Nosotros también ayudamos! Con la honda.';
    npc.despedida = 'Acá me quedo.';
    c.presente = true; c.obra = null; c.corre = false;
    if (!est.avisado) {
      est.avisado = true;
      const quienes = [est.niveles.anselmo && 'Anselmo', est.niveles.herminia && 'la abuela Herminia', est.niveles.chicos && 'los chicos', est.niveles.martin && 'Martín (en la trochita)'].filter(Boolean);
      if (quienes.length) api.nota('Los vecinos se suman a la noche', quienes.join(', '), true);
    }
  }
  function irse() {
    let hubo = false;
    for (const c of est.cuerpos.values()) if (c.presente) { c.presente = false; hubo = true; if (c.npc) { c.npc.dormido = true; c.npc.enBase = false; } }
    apagarFuegos();
    est.spots = null;
    if (hubo) api.nota('Los vecinos vuelven a la aldea', 'Con la primera luz, cada uno a su casa', true);
    est.dentro = false;
  }

  // ---------------------------------------------------------------- moverse
  function irA(c, p, corre = false) {
    const npc = c.npc, r = npc.ruta[0];
    const d = Math.hypot(npc.pos.x - p.x, npc.pos.z - p.z);
    npc.velocidad = corre ? 4.2 : 1.35;
    if (Math.hypot(r.x - p.x, r.z - p.z) > 0.6 || d > 1.2) { r.x = p.x; r.z = p.z; npc.espera = 0; r.quieto = 0.5; }
    return d;
  }
  // «vení conmigo»: detrás tuyo, apurando el paso si quedó lejos (y si te fuiste muy lejos, te alcanza)
  function seguir(c, js) {
    const npc = c.npc;
    const i = CLAVES_CUERPOS.indexOf(c.clave);
    const p = puntoDeOrden('seguime', { base: api.centroBase(), porton: null, i, puntoBase: api.centroBase(), jugador: { pos: js.pos, yaw: js.yaw || 0 } });
    const q = { x: p.x + (i - 1.5) * 0.9, z: p.z + (i % 2 ? 0.8 : -0.8) };
    const d = Math.hypot(npc.pos.x - q.x, npc.pos.z - q.z);
    if (d > LEJOS_ALCANZA) npc.pos.set(q.x, api.alturaEn(q.x, q.z), q.z);
    npc.velocidad = velocidadSiguiendo(d);
    const r = npc.ruta[0];
    r.mirar = js.pos;
    if (Math.hypot(r.x - q.x, r.z - q.z) > 0.8 || d > 1.2) { r.x = q.x; r.z = q.z; npc.espera = 0; r.quieto = 0.5; }
  }

  // ---------------------------------------------------------------- Anselmo
  function actualizarAnselmo(c, dt, js, orden) {
    const npc = c.npc, num = ANSELMO[est.niveles.anselmo];
    if (!num) return;
    c.tBuscar -= dt;
    if (c.tBuscar <= 0) {
      c.tBuscar = orden === 'seguime' ? 0.5 : 1;
      const centro = orden === 'seguime' ? js.pos : puestoDeAliado('anselmo');
      // sigue con la que empezó hasta dejarla entera; después va a la más rota que quede (si no, con dos igual de rotas iba y venía)
      const obra = c.obra || api.obraMasDanada(centro, orden === 'seguime' ? 8 : num.radio, api.obraDeRamon?.() || null);
      if (obra !== c.obra) { npc.espera = 0; npc.ruta[0].quieto = 1; }
      c.obra = obra;
      if (obra) {
        c.corre = false;
        npc.velocidad = 1.9;
        npc.ruta[0].x = obra.datos.x - 1.1; npc.ruta[0].z = obra.datos.z - 0.4;
        npc.ruta[0].mirar = { x: obra.datos.x, z: obra.datos.z };
      } else if (orden === 'seguime') seguir(c, js);
      else { const d = irA(c, puestoDeAliado('anselmo'), c.corre); if (d < 1.5) c.corre = false; }
    }
    if (c.obra && Math.hypot(npc.pos.x - c.obra.datos.x, npc.pos.z - c.obra.datos.z) < 2.6) {
      const lleno = api.reparar(c.obra, num.repara * dt);
      c.golpe -= dt;
      if (c.golpe <= 0) {
        c.golpe = num.pausa * (efectosPartida()?.anselmoPausa ?? 1) + 0.35;   // 4.10 partidas: «manos livianas»
        npc.brazos[1].rotation.x = -1.7;
        api.efectos?.astillas?.({ x: c.obra.datos.x, y: c.obra.datos.y + 1, z: c.obra.datos.z }, 3);
        api.sonido.golpeRuido?.({ dur: 0.07, frec: 1400, q: 3, vol: 0.2, destino: api.sonido.fuente?.(npc.pos, 0.8) });   // martillo sobre el hierro y la madera
      }
      if (lleno) c.obra = null;
    }
  }

  // ---------------------------------------------------------------- Herminia
  function puntosFuegos() {
    if (est.spots) return est.spots;
    const num = HERMINIA[est.niveles.herminia];
    const b = api.centroBase();
    const ps = num ? puntosDeFuegos(b, num.fuegos, rumboLado() ?? 0, paredes()) : [];
    // que ninguno caiga al agua: si cae, se corre hacia el centro de la base
    for (const p of ps) for (let k = 0; k < 6 && !libre(p.x, p.z); k++) { p.x += (b.x - p.x) * 0.3; p.z += (b.z - p.z) * 0.3; }
    est.spots = ps;
    return ps;
  }
  function encender(i) {
    const p = est.spots[i], f = pool[i];
    if (!p || !f) return;
    const y = api.alturaEn(p.x, p.z);
    f.g.position.set(p.x, y, p.z);
    f.ajustar?.((x, z) => api.alturaEn(x, z), p.x, p.z);   // el brillo del suelo se acomoda a las lomas
    f.g.visible = true;
    est.lit.push({ x: p.x, z: p.z, radio: radioDeFuego(p.tipo, est.niveles.herminia), tipo: p.tipo });
    api.efectos?.chispas?.({ x: p.x, y: y + 0.4, z: p.z }, 8);
    api.sonido.golpeRuido?.({ dur: 0.35, frec: 2200, q: 0.8, vol: 0.14, destino: api.sonido.fuente?.({ x: p.x, y, z: p.z }, 0.8) });
    if (est.lit.length === 1) api.nota('Herminia prende el primer fuego', 'Los viejos oscuros no se acercan a su luz; a los traviesos no les importa', true);
  }
  function actualizarHerminia(c, dt, js, orden) {
    const npc = c.npc, num = HERMINIA[est.niveles.herminia];
    if (!num) return;
    const spots = puntosFuegos();
    c.tBuscar -= dt;
    const trabajando = orden !== 'seguime' && c.encendidos < spots.length;
    if (c.tBuscar <= 0) {
      c.tBuscar = orden === 'seguime' ? 0.4 : 0.6;
      if (orden === 'seguime') seguir(c, js);
      else if (trabajando) {
        const p = spots[c.encendidos];
        npc.velocidad = 1.5;
        irA(c, { x: p.x - 0.9, z: p.z + 0.3 });
        npc.ruta[0].mirar = { x: p.x, z: p.z };
      } else { const d = irA(c, puestoDeAliado('herminia'), c.corre); if (d < 1.5) c.corre = false; }
    }
    if (trabajando) {
      const p = spots[c.encendidos];
      if (Math.hypot(npc.pos.x - p.x, npc.pos.z - p.z) < 1.9) {
        c.prende += dt;
        npc.brazos[1].rotation.x = -1.1 + Math.sin(c.prende * 9) * 0.25;
        if (c.prende >= num.tarda) { c.prende = 0; encender(c.encendidos); c.encendidos++; }
      } else c.prende = 0;
    }
  }

  // ---------------------------------------------------------------- los chicos
  function actualizarChico(c, dt, js, orden, hayDuendes) {
    const npc = c.npc, num = HONDA[est.niveles.chicos];
    if (!num) return;
    c.tBuscar -= dt;
    if (c.tBuscar <= 0) {
      c.tBuscar = 0.4;
      if (orden === 'seguime') seguir(c, js);
      else { const d = irA(c, puestoDeAliado(c.clave), c.corre); if (d < 1.5) c.corre = false; }
    }
    c.tiro -= dt;
    if (!hayDuendes || c.tiro > 0) return;
    let mejor = null, d0 = num.alcance;
    for (const a of api.aliens) {
      if (!esBlancoDeHonda(a, npc.pos.y)) continue;
      const p = a.m.g.position, d = Math.hypot(p.x - npc.pos.x, p.z - npc.pos.z);
      if (d < d0) { d0 = d; mejor = a; }
    }
    if (!mejor) { c.tiro = 0.5; return; }
    c.tiro = num.cadencia * (efectosPartida()?.chicos.cadencia ?? 1) * (0.85 + Math.random() * 0.3);   // 4.10 partidas: «buena puntería»
    const ap = mejor.m.g.position;
    npc.ruta[0].mirar = { x: ap.x, z: ap.z };   // una copia: el invasor se recicla
    npc.rumboObjetivo = Math.atan2(ap.x - npc.pos.x, ap.z - npc.pos.z);
    // la piedra sale de la honda por encima de la empalizada: el chico se para un metro y medio detrás, y la piedra nace 1,8 m más
    // adelante, adentro de la pared (el proyectil ignora la obra donde nace: así sale por la empalizada y no se queda pegada a ella)
    const hx = ap.x - npc.pos.x, hz = ap.z - npc.pos.z, hl = Math.hypot(hx, hz) || 1;
    desde.x = npc.pos.x + (hx / hl) * ADELANTE_HONDA; desde.y = npc.pos.y + 1.5; desde.z = npc.pos.z + (hz / hl) * ADELANTE_HONDA;
    let vx = ap.x - desde.x, vy = ap.y + mejor.def.altura * mejor.m.esc * 0.55 - desde.y, vz = ap.z - desde.z;
    const tiempo = Math.hypot(vx, vy, vz) / VELOCIDAD_PIEDRA;
    vy += 0.5 * 9.8 * tiempo * tiempo;
    const largo = Math.hypot(vx, vy, vz) || 1, k = VELOCIDAD_PIEDRA / largo;
    vel.x = vx * k + (Math.random() - 0.5) * 1.6; vel.y = vy * k; vel.z = vz * k + (Math.random() - 0.5) * 1.6;
    api.lanzarProyectil('piedra', desde, vel, num.dano * (efectosPartida()?.chicos.dano ?? 1), true, 'aliado');
    npc.brazos[1].rotation.x = -2.5;
    api.sonido.tono?.({ frec: 620, fin: 300, dur: 0.07, tipo: 'triangle', vol: 0.06, destino: api.sonido.fuente?.(npc.pos, 0.7) });
  }

  // ---------------------------------------------------------------- Martín y la trochita
  function actualizarMartin(dt) {
    const num = MARTIN[est.niveles.martin];
    if (!num) return;
    const tren = api.tren?.();
    if (!tren?.est || !Number.isFinite(tren.largo)) return;
    if (!est.via) {
      est.via = puntoDeViaMasCercano(T.riel, api.centroBase()) || { d: Infinity, x: 0, z: 0, s: 0 };
    }
    if (tren.est.varado) return;
    if (!pasoDeLaTrochita(est.pasada, tren.est.s, est.via.s, tren.largo, tren.est.vel > 1)) return;
    silbar(tren, num);
  }
  function silbar(tren, num) {
    const pos = tren.enVia(tren.est.s);
    est.silbatos++;
    api.sonido.silbato?.({ x: pos.x, y: pos.y + 3, z: pos.z });
    if (!silbatoServiria(est.via.d)) {
      api.nota('Martín pasa con la trochita', 'El silbato se oye por el valle, pero la vía queda lejos de tu base', true);
      return 0;
    }
    if (est.pasadasEfecto >= num.pasadas) return 0;
    est.pasadasEfecto++;
    let n = 0;
    for (const a of api.aliens) {
      if (a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajoTierra' || a.estado === 'dormido' || a.enNave) continue;
      if (!silbatoDispersa(a.m.g.position, est.via, num.alcance, !!a.m.viejo)) continue;
      a.huyeT = num.dispersa; a.huyeX = est.via.x; a.huyeZ = est.via.z;
      n++;
    }
    est.dispersados += n;
    api.nota('Martín toca el silbato', n ? `${n} ${n === 1 ? 'travieso sale' : 'traviesos salen'} corriendo de la vía` : 'No había traviesos cerca de la vía', true);
    return n;
  }

  // ---------------------------------------------------------------- por cuadro
  function actualizar(dt, js, hayDuendes, noche = 1) {
    if (!est.ocultos) { for (const f of pool) { f.g.visible = false; } est.ocultos = true; }   // las que se dejaron a la vista para compilar
    if (!api.gente?.()) return;   // sin vecinos en la partida (Tu partida), nadie ayuda
    const horas = api.horas(), dia = api.dia();
    const enVentana = horas >= HORA_ATAQUE - 1 || horas < HORA_AMANECER;
    if (!enVentana) { if (est.key !== null) { irse(); est.key = null; } return; }
    const key = claveNoche(dia, horas);
    if (est.key !== key) nuevaNoche(key, horas, dia);
    if (!est.grande) return;
    est.dentro = true;
    armar(2);
    est.reloj += dt;
    actualizarMartin(dt);
    const d = api.D();
    for (const c of est.cuerpos.values()) {
      if (!c.npc || est.niveles[CUERPOS[c.clave].vecino] <= 0) continue;
      if (!c.presente) { presentar(c); continue; }
      const orden = ordenDe(d.ordenes, c.clave);
      if (c.clave === 'anselmo') actualizarAnselmo(c, dt, js, orden);
      else if (c.clave === 'herminia') actualizarHerminia(c, dt, js, orden);
      else actualizarChico(c, dt, js, orden, hayDuendes);
    }
    // las llamas titilan (sólo los fuegos cerca de la vista)
    for (let i = 0; i < pool.length; i++) {
      const f = pool[i];
      if (!f.g.visible) continue;
      if (Math.hypot(f.g.position.x - js.pos.x, f.g.position.z - js.pos.z) > 160) continue;
      const t = est.reloj * 7 + i * 1.9;
      f.llama.scale.set(1 + Math.sin(t) * 0.07, 1 + Math.sin(t * 1.7 + 1) * 0.18, 1 + Math.cos(t * 1.3) * 0.07);
      f.fina.scale.y = 1 + Math.sin(t * 2.3) * 0.22;
      f.brillo.visible = noche > 0.2;   // de día, el brillo del suelo sería una mancha
      f.brillo.material.opacity = (0.38 + Math.sin(t * 0.9) * 0.05) * Math.min(1, noche);
    }
  }

  // ---------------------------------------------------------------- las órdenes (la E mirando al vecino)
  function ordenar(clave) {
    const c = est.cuerpos.get(clave);
    if (!c || !c.presente) return null;
    const d = api.D();
    if (!d.ordenes) d.ordenes = {};
    const anterior = ordenDe(d.ordenes, clave);
    const orden = siguienteOrden(clave, anterior);
    d.ordenes[clave] = orden;
    if (marcaPuesto(anterior, orden)) {
      if (!d.puestosAliados) d.puestosAliados = {};
      d.puestosAliados[clave] = { x: c.npc.pos.x, z: c.npc.pos.z };
    }
    c.t = 0; c.tBuscar = 0; c.obra = null; c.corre = false;
    return { orden, respuesta: respuestaDe(clave, orden) };
  }
  // la campana: todos los que están corren a su puesto. Devuelve cuántos.
  function alarma() {
    const d = api.D();
    if (!d.ordenes) d.ordenes = {};
    let n = 0;
    for (const c of est.cuerpos.values()) {
      if (!c.presente) continue;
      d.ordenes[c.clave] = 'puesto';
      c.tBuscar = 0; c.obra = null; c.corre = true;
      n++;
    }
    return n;
  }

  // ---------------------------------------------------------------- lo que usa el resto del Desafío
  // El rumbo con que un duende viejo avanza, sin entrar al círculo de un fuego prendido. `rumbo`: hacia dónde iba (atan2(dx, dz)).
  function rumboDeViejo(a, rumbo) {
    if (!est.lit.length || !a.m.viejo) return rumbo;
    const p = a.m.g.position;
    ajusteDeViejo(Math.sin(rumbo), Math.cos(rumbo), p.x, p.z, est.lit, true, _s);
    return _s.tocado ? Math.atan2(_s.x, _s.z) : rumbo;
  }
  // El silbato de Martín: el que está huyendo corre para el otro lado (devuelve el rumbo nuevo o null si no huye).
  function rumboDeHuida(a, dt) {
    if (!(a.huyeT > 0)) return null;
    a.huyeT -= dt;
    const p = a.m.g.position;
    return Math.atan2(p.x - a.huyeX, p.z - a.huyeZ);
  }
  function limpiar() {
    for (const c of est.cuerpos.values()) if (c.presente) { c.presente = false; if (c.npc) { c.npc.dormido = true; c.npc.enBase = false; } }
    apagarFuegos();
    est.key = null; est.dentro = false; est.spots = null;
  }

  return {
    actualizar, ordenar, alarma, rumboDeViejo, rumboDeHuida, limpiar, puestoDe: puestoDeAliado,
    fuegosPrendidos: () => est.lit.map((f) => ({ ...f })),
    presentes: () => [...est.cuerpos.values()].filter((c) => c.presente).map((c) => c.clave),
    esta: (clave) => !!est.cuerpos.get(clave)?.presente,
    get estado() { return est; },
    get silbatos() { return est.silbatos; },
    // para las pruebas: lo que haría el silbato / la noche sin esperar a la locomotora
    __silbar: (tren) => silbar(tren, MARTIN[est.niveles.martin] || MARTIN[1]),
    __nuevaNoche: nuevaNoche, __encender: encender, __puntosFuegos: puntosFuegos,
  };
}
