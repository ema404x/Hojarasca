// 3.6 (mecánicas): lo que se ve, se oye y se hace en la Aldea de los Duendes (PLAN_ALDEA §14). Las
// reglas y los textos están en aldea-mecanicas.js (puro); acá va lo que usa three, el sonido y los
// puntos del mundo. main.js lo arma en el Relax y lo llama en cada cuadro, y para el aviso y la
// tecla E usa `accion(js)`: una sola función, así el aviso y E tienen siempre la misma prioridad.
//
// Del mundo usa la API de aldea-mundo.js: `puntosEdificio(id)` (los puntos con nombre y los
// asientos de cada edificio montado), `animables()` y `animablesEstacion()` (lo que se mueve:
// banderas, fuelle, rueca, campana del andén) y `emisores()` (chispas de la fragua, humo del horno).
//
// Rendimiento (la Radeon integrada): lejos de la aldea no se calcula nada; los gestos de los
// oficios (piezas que se mueven, partículas y sonidos) sólo a menos de CERCA_GESTOS (40 m) y
// apagados lejos. Las partículas son tres nubes chicas de puntos (un dibujo cada una, y sólo la
// que está prendida), redondas y suaves (una textura chica de 32 px): las tres con el mismo
// programa de PointsMaterial, que se arma con la aldea, antes de la compilación de la carga
// (renderer.compile recorre también lo que está apagado): no se compila nada a mitad del juego.
import * as THREE from 'three';
import { IDS_EDIFICIOS, EDIFICIOS_ALDEA, PARADA_ALDEA, marcoAldea } from './aldea.js';
import { empezarMelodia, seguirMelodia, callarMelodia } from './personal-musica.js';
import { LIBRO_ALDEA, PLACA_DUENDE, CUENTOS_DOMINGO } from './aldea-lecturas.js';
import { CERCA_GESTOS, LEJOS_MECANICAS, RADIO_ESTUFA, MECANICAS, AVISOS_MECANICAS, avisoPrestado, elegirMecanica, sanearMecanicas, izadaA, sacarAgua, libroParaLeer, textoPrestamo, pedirPrestado, devolverLibro, cuentoEscuchado, pizarronDelDia, dibujosDeLosChicos, horarioTrenes, descansarEnCamilla, faltanDelValle, hayBaile, melodiaDelBaile, GESTOS_OFICIO, trabajando, asientoValido, nombreAsiento, hayMurmullo, hayPerros, hayAbejas } from './aldea-mecanicas.js';

const azar = (a, b) => a + Math.random() * (b - a);
const IDS = [...IDS_EDIFICIOS.filter((id) => EDIFICIOS_ALDEA[id].rol !== 'estacion' && !EDIFICIOS_ALDEA[id].estructura), 'estacion'];
// las vocales del murmullo (formantes: frecuencia, Q, ganancia)
const VOCALES = [[[800, 5, 1], [1200, 7, 0.5]], [[500, 5, 1], [1900, 7, 0.45]], [[320, 5, 1], [2300, 7, 0.35]], [[500, 5, 1], [900, 7, 0.5]], [[330, 5, 1], [800, 7, 0.4]]];

// `ctx`: { mundo, gente(), escena, sonido, col, progreso(), jugador(), tren(), sentaderos, registrar(id),
// nota(t, sub, nueva), guardar(), leer({ quien, que, partes, id, despedida }), sentarEn({ x, y, z, mira }),
// alJugador(campo, valor), abrirCasilla(pos), enCasa(pos), duracionDia(), ambiente() → { invierno, lluvia, viento } }
export function crearMecanicasAldea(ctx) {
  const M = marcoAldea(PARADA_ALDEA);
  const centro = M.aMundo(22, 50);
  const S = () => (ctx.sonido?.ctx ? ctx.sonido : null);
  const prog = () => ctx.progreso() || {};
  const mec = () => { const p = prog(); if (!p.mecanicas || typeof p.mecanicas !== 'object') p.mecanicas = sanearMecanicas(p.mecanicas); return p.mecanicas; };
  const aldea = () => prog().aldea;
  const hora = () => prog().horas ?? 12;
  const dia = () => prog().dia ?? 1;
  const info = { ms: 0, msMax: 0, cuadros: 0, revisiones: 0, sentaderos: 0, candidatos: 0, campanadas: 0, golpes: 0, sierras: 0, zumbidos: 0, murmullos: 0, ladridos: 0, cuentos: 0 };

  // ------------------------------------------------ los puntos del mundo (se rehacen al rearmarse un edificio)
  const versiones = new Map(), puntos = new Map(), propios = new Map();
  let cands = [], lectura = [], estufas = [], camilla = null;
  const anim = { banderas: [], fuelle: null, rueca: null, campana: null };
  const lugar = { fragua: null, sierra: null, colmenas: null, plaza: null, salon: null, escenario: null, campana: null, biblioteca: null, horno: null, chispas: null, abejas: null };
  let listo = false;
  function sentaderosDe(id, p) {
    const lista = ctx.sentaderos;
    if (!Array.isArray(lista)) return;
    for (const s of propios.get(id) || []) { const i = lista.indexOf(s); if (i >= 0) lista.splice(i, 1); }
    const nuevos = [];
    for (const q of p?.asientos || []) {
      if (!q || !asientoValido(q.nombre, id)) continue;
      // `mira` del asiento es hacia dónde mira un muñeco sentado; el jugador mira con el yaw (al revés)
      nuevos.push({ x: q.x, z: q.z, y: q.y + 0.02, nombre: nombreAsiento(q.nombre, id), mira: q.mira + Math.PI, aldea: id });
    }
    lista.push(...nuevos);
    propios.set(id, nuevos);
  }
  function revisar() {
    info.revisiones++;
    let cambio = false;
    for (const id of IDS) {
      const p = ctx.mundo?.puntosEdificio?.(id) || null;
      const v = p ? p.version : null;
      if (versiones.get(id) === v) continue;
      versiones.set(id, v); puntos.set(id, p); cambio = true;
      sentaderosDe(id, p);
    }
    if (cambio) rehacer();
  }
  function rehacer() {
    cands = []; lectura = []; estufas = []; camilla = null;
    for (const k of Object.keys(lugar)) lugar[k] = null;
    for (const [id, p] of puntos) {
      if (!p) continue;
      for (const [k, q] of Object.entries(p.nombrados || {})) {
        if (!q) continue;
        for (const [tipo, def] of Object.entries(MECANICAS)) {
          if (!def.punto) continue;
          const sirve = def.edificio === '*' || def.edificio === id;
          const nombre = def.punto instanceof RegExp ? def.punto.test(k) : def.punto === k;
          if (sirve && nombre) cands.push({ tipo, x: q.x, y: q.y, z: q.z, radio: def.radio, edificio: id, mira: q.mira });
        }
      }
      if (id === 'biblioteca') { lectura = (p.asientos || []).filter((a) => a.nombre === 'una silla de lectura'); lugar.biblioteca = p.nombrados.cuentos || p.nombrados.adentro || null; }
      const N = p.nombrados || {};
      if (id === 'herreria') lugar.fragua = N.fragua || null;
      if (id === 'carpinteria') lugar.sierra = N.sierra || null;
      if (id === 'sala-miel') { lugar.colmenas = N.colmenas || null; lugar.abejas = p.extra?.abejas || null; }
      if (id === 'plaza') lugar.plaza = N.duende || null;
      if (id === 'salon') { lugar.salon = N['pista-baile'] || null; lugar.escenario = N.escenario || null; }
      if (id === 'estacion') lugar.campana = N['campana-anden'] || null;
      if (id === 'puesto-sanitario' && N.camilla) camilla = N.camilla;
    }
    estufas = cands.filter((c) => c.tipo === 'estufa');
    for (const e of ctx.mundo?.emisores?.() || []) {
      if (e.tipo === 'chispas' && e.edificio === 'herreria') lugar.chispas = e;
      if (e.tipo === 'humo' && e.edificio === 'panaderia') lugar.horno = e;
    }
    // lo que se mueve (cada rearmado trae piezas nuevas: se vuelven a buscar)
    const todas = [...(ctx.mundo?.animables?.() || []), ...(ctx.mundo?.animablesEstacion?.() || [])];
    const preparar = (a) => { if (!a) return null; a.base ??= a.objeto.position.clone(); a.ejeV ??= new THREE.Vector3(...(a.eje || [1, 0, 0])).normalize(); return a; };
    anim.banderas = todas.filter((a) => a.id === 'bandera').map(preparar);
    anim.fuelle = preparar(todas.find((a) => a.id === 'fuelle'));
    anim.rueca = preparar(todas.find((a) => a.id === 'rueda-rueca'));
    anim.campana = preparar(todas.find((a) => a.id === 'campana'));
    anim.fase = { rueca: 0, banderaF: -1 };
    info.candidatos = cands.length;
    info.sentaderos = [...propios.values()].reduce((s, l) => s + l.length, 0);
    listo = puntos.size > 0 && [...puntos.values()].some(Boolean);
  }

  // ------------------------------------------------ partículas (tres nubes chicas, un dibujo cada una)
  // una mancha redonda y suave (sin ella, cada punto es un cuadrado)
  const textura = (() => {
    if (typeof document === 'undefined') return null;
    try {
      const lienzo = document.createElement('canvas');
      lienzo.width = lienzo.height = 32;
      const g = lienzo.getContext('2d');
      const grad = g.createRadialGradient(16, 16, 1, 16, 16, 15);
      grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.45, 'rgba(255,255,255,0.5)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad; g.fillRect(0, 0, 32, 32);
      return new THREE.CanvasTexture(lienzo);
    } catch { return null; }
  })();
  function nube(nombre, n, { color, tam, opacidad }) {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    // las tres con los mismos parámetros (transparente, con tamaño en el mundo y la mancha): un solo
    // programa, compilado en la carga
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color, size: tam, sizeAttenuation: true, transparent: true, opacity: opacidad, depthWrite: false, map: textura }));
    p.name = nombre; p.frustumCulled = false; p.visible = false; p.matrixAutoUpdate = false;
    ctx.escena?.add(p);
    // (cada chispa sale con su velocidad desde el principio: si no, las primeras suben en fila)
    const v = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { v[i * 3] = azar(-0.35, 0.35); v[i * 3 + 1] = azar(0.7, 1.6); v[i * 3 + 2] = azar(-0.35, 0.35); }
    pos.fill(-1000);
    return { p, pos, n, vida: Float32Array.from({ length: n }, () => Math.random()), v };
  }
  const chispas = nube('aldea-chispas', 22, { color: '#ffa040', tam: 0.09, opacidad: 1 });
  const abejas = nube('aldea-abejas', 16, { color: '#2a200c', tam: 0.08, opacidad: 1 });
  const humo = nube('aldea-humo-horno', 16, { color: '#c4bfb6', tam: 1.9, opacidad: 0.3 });
  const nubes = [chispas, abejas, humo];
  function moverChispas(dt, e) {
    const { pos, vida, v, n } = chispas;
    for (let i = 0; i < n; i++) {
      vida[i] += dt * (1.3 + (i % 4) * 0.25);
      if (vida[i] > 1) { vida[i] -= 1; v[i * 3] = azar(-0.35, 0.35); v[i * 3 + 1] = azar(0.7, 1.6); v[i * 3 + 2] = azar(-0.35, 0.35); }
      const t = vida[i] * 0.75;
      // salen de a ratos (el herrero aviva el fuego con el fuelle)
      const fuera = (i & 1) && Math.sin(reloj * 1.7 + i) < -0.2;
      pos[i * 3] = e.x + v[i * 3] * t; pos[i * 3 + 1] = fuera ? e.y - 2 : e.y + v[i * 3 + 1] * t - 2.4 * t * t; pos[i * 3 + 2] = e.z + v[i * 3 + 2] * t;
    }
    chispas.p.geometry.attributes.position.needsUpdate = true;
  }
  function moverAbejas(c) {
    const { pos, n } = abejas, r = (c.radio || 2.5) * 0.55;
    for (let i = 0; i < n; i++) {
      const f = i * 2.39996, w = 0.9 + (i % 5) * 0.23, rr = r * (0.35 + ((i * 7) % 10) / 15);
      pos[i * 3] = c.x + Math.sin(reloj * w + f) * rr + Math.sin(reloj * 5.3 + f) * 0.06;
      pos[i * 3 + 1] = c.y + Math.sin(reloj * 1.7 * w + f * 2) * 0.35;
      pos[i * 3 + 2] = c.z + Math.cos(reloj * w * 1.27 + f) * rr + Math.cos(reloj * 4.1 + f) * 0.06;
    }
    abejas.p.geometry.attributes.position.needsUpdate = true;
  }
  function moverHumo(dt, e) {
    const { pos, vida, n } = humo;
    const viento = ctx.ambiente?.()?.viento ?? 0.4;
    for (let i = 0; i < n; i++) {
      vida[i] += dt * 0.16;
      if (vida[i] > 1) vida[i] -= 1;
      const t = vida[i], abre = 0.15 + t * t * 1.6;
      pos[i * 3] = e.x + (t * 1.2 + t * t * 4) * viento + Math.sin(t * 8 + i) * abre;
      pos[i * 3 + 1] = e.y + 5.5 * t * (1 - 0.35 * t);
      pos[i * 3 + 2] = e.z + Math.cos(t * 6 + i * 1.7) * abre;
    }
    humo.p.geometry.attributes.position.needsUpdate = true;
  }

  // ------------------------------------------------ sonidos (por código, con el motor de siempre)
  function golpeFragua(p) {
    const s = S(); if (!s) return;
    const d = s.fuente(p, 0.9, 0.35); if (!d) return;
    s.impacto('metal', { tamaño: 0.85, dureza: 1, fuerza: 0.75, vol: 0.09, destino: d, capasMax: 3 });
    if (Math.random() < 0.35) s.chisporrotear(d, 3, 0.035, 0.4);
    info.golpes++;
  }
  function sierra(p) {
    const s = S(); if (!s) return;
    const d = s.fuente(p, 0.8, 0.3); if (!d) return;
    for (let i = 0; i < 7; i++) s.golpeRuido({ dur: 0.2, frec: i % 2 ? 2300 : 1700, fin: i % 2 ? 1800 : 2300, q: 2.4, vol: 0.03, destino: d, cuando: i * 0.27 });
    info.sierras++;
  }
  function zumbido(c) {
    const s = S(); if (!s) return;
    s.zumbido({ x: c.x + azar(-1, 1), y: c.y, z: c.z + azar(-1, 1) }, azar(1, 1.8));
    info.zumbidos++;
  }
  function murmullo(p) {
    const s = S(); if (!s) return;
    const d = s.fuente({ x: p.x + azar(-4, 4), y: p.y + 1.4, z: p.z + azar(-4, 4) }, 1, 0.5); if (!d) return;
    const n = 2 + Math.floor(Math.random() * 3), voz = azar(120, 230);
    for (let i = 0; i < n; i++) {
      const f = voz * azar(0.9, 1.15);
      s.garganta({ destino: d, frec: f, fin: f * azar(0.85, 1.05), dur: azar(0.12, 0.26), vol: 0.0045, ataque: 0.03, formantes: VOCALES[Math.floor(Math.random() * VOCALES.length)], aspereza: 0.12, aliento: 0.4, cuando: i * azar(0.18, 0.3) });
    }
    info.murmullos++;
  }
  function ladridoLejos(cam) {
    const s = S(); if (!s) return;
    const a = Math.random() * Math.PI * 2, r = azar(45, 80);
    s.ladrido({ x: centro.x + Math.cos(a) * r * 0.6 + (cam.x - centro.x) * 0.2, y: (lugar.plaza?.y ?? 22) + 0.5, z: centro.z + Math.sin(a) * r * 0.6 + (cam.z - centro.z) * 0.2 });
    info.ladridos++;
  }
  // la campana del andén: más chica y más aguda que la de la locomotora, cuatro golpes
  function campanaAnden(p) {
    const s = S(); if (!s) return;
    const d = s.fuente(p, 1.3, 0.8); if (!d) return;
    const PARCIALES = [[0.5, 0.006, 1.2], [1, 0.022, 1.0], [1.2, 0.01, 0.8], [1.5, 0.006, 0.6], [2, 0.012, 0.5], [2.6, 0.004, 0.3]];
    for (let i = 0; i < 4; i++) for (const [r, v, dur] of PARCIALES) s.tono({ frec: 1480 * r * azar(0.998, 1.002), dur, tipo: 'sine', vol: v, destino: d, cuando: i * 0.55, ataque: 0.003 });
    info.campanadas++;
  }

  // ------------------------------------------------ cada cuadro
  let reloj = 0, acumRevisar = 99, acumLento = 0, cerca = false;
  const prox = { golpe: 0, sierra: 0, zumbido: 0, murmullo: 0, ladrido: azar(8, 20) };
  const estado = { banderaF: -1, campana: 0, trenAqui: false, gestos: {}, enPlaza: 0 };
  const musica = { s: null, tanda: 0, proxima: 0, activa: false, acum: 0 };
  function apagar() {
    for (const q of nubes) q.p.visible = false;
    if (musica.s) { callarMelodia(S(), musica.s); musica.s = null; }
    musica.activa = false;
  }
  function actualizar(dt, cam) {
    const t0 = performance.now();
    try { paso(dt, cam); } finally {
      const ms = performance.now() - t0;
      info.ms = info.ms * 0.95 + ms * 0.05; info.msMax = Math.max(info.msMax * 0.999, ms); info.cuadros++;
    }
  }
  // 3.6 (optimizar): lo que paso() usa en cada cuadro, armado una vez: la distancia a la cámara (antes
  // una función nueva por cuadro) y la parada de la aldea (antes se buscaba en cada cuadro)
  let camX = 0, camZ = 0;
  const dist = (p) => (p ? Math.hypot(camX - p.x, camZ - p.z) : Infinity);
  const paradaAldea = { tren: null, parada: null };
  function paso(dt, cam) {
    reloj += dt;
    camX = cam.x; camZ = cam.z;
    const dAldea = Math.hypot(cam.x - centro.x, cam.z - centro.z);
    acumRevisar += dt;
    if (dAldea > LEJOS_MECANICAS + 180) { if (cerca) { apagar(); cerca = false; } return; }
    if (acumRevisar > 1.5) { acumRevisar = 0; revisar(); }
    cerca = true;
    if (!listo) return;
    const h = hora(), a = aldea();
    // la bandera (las de la plaza, la escuela y la seccional): se mira cuatro veces por segundo
    acumLento += dt;
    if (acumLento > 0.25) {
      acumLento = 0;
      const f = izadaA(h);
      if (Math.abs(f - estado.banderaF) > 0.002) {
        estado.banderaF = f;
        for (const b of anim.banderas) b.objeto.position.y = b.base.y + (b.dato.desde ?? 0) * (1 - f) + (b.dato.hasta ?? 0) * f;
      }
      // qué gestos están andando ahora (rutina del dueño), y cuánta gente hay en la plaza
      for (const ed of Object.keys(GESTOS_OFICIO)) estado.gestos[ed] = trabajando(a, ed, dia(), h);
      const amb = estado.gestos['sala-miel'] ? ctx.ambiente?.() : null;
      estado.gestos.abejas = estado.gestos['sala-miel'] && hayAbejas(h, amb?.invierno, amb?.lluvia);
      let n = 0;
      for (const st of ctx.gente?.()?.personas?.values?.() || []) if (st.destino?.edificio === 'plaza' && st.npc && !st.npc.dormido) n++;
      estado.enPlaza = n;
    }
    // la campana del andén: cuando la trochita para en la aldea
    const tren = ctx.tren?.();
    if (paradaAldea.tren !== tren) { paradaAldea.tren = tren; paradaAldea.parada = tren?.paradas?.find?.((p) => p.aldea); }
    const parada = paradaAldea.parada;
    if (parada && lugar.campana) {
      const q = tren.proximoTrenA(parada);
      const aqui = !!tren.parado?.() && !!q && (q.metros < 14 || q.metros > tren.largo - 14);
      if (aqui && !estado.trenAqui && Math.hypot(cam.x - lugar.campana.x, cam.z - lugar.campana.z) < 250) { estado.campana = 3.2; campanaAnden({ x: lugar.campana.x, y: lugar.campana.y + 2.4, z: lugar.campana.z }); }
      estado.trenAqui = aqui;
    }
    if (anim.campana) {
      if (estado.campana > 0) {
        estado.campana = Math.max(0, estado.campana - dt);
        anim.campana.objeto.quaternion.setFromAxisAngle(anim.campana.ejeV, 0.5 * Math.sin(reloj * 7.5) * Math.min(1, estado.campana / 1.5));
      } else if (anim.campana.objeto.quaternion.w < 0.99999) anim.campana.objeto.quaternion.identity();
    }
    // los gestos de los oficios: sólo cerca
    const g = estado.gestos;
    if (anim.fuelle) {
      if (g.herreria && dist(lugar.fragua) < CERCA_GESTOS) anim.fuelle.objeto.quaternion.setFromAxisAngle(anim.fuelle.ejeV, (anim.fuelle.dato.abierta ?? 0.25) * (0.5 + 0.5 * Math.sin(reloj * 2.4)));
    }
    if (anim.rueca && g.hilanderia && dist(anim.rueca.contenedor.position) < CERCA_GESTOS) {
      anim.fase.rueca += dt * Math.PI * 2 * (anim.rueca.dato.vueltasPorSegundo ?? 1.2);
      anim.rueca.objeto.quaternion.setFromAxisAngle(anim.rueca.ejeV, anim.fase.rueca % (Math.PI * 2));
    }
    chispas.p.visible = !!(g.herreria && lugar.chispas && dist(lugar.chispas) < CERCA_GESTOS);
    if (chispas.p.visible) moverChispas(dt, lugar.chispas);
    abejas.p.visible = !!(g.abejas && lugar.abejas && dist(lugar.abejas) < CERCA_GESTOS);
    if (abejas.p.visible) moverAbejas(lugar.abejas);
    humo.p.visible = !!(g.panaderia && lugar.horno && dist(lugar.horno) < CERCA_GESTOS);
    if (humo.p.visible) moverHumo(dt, lugar.horno);
    // los sonidos de cada cosa (con su ritmo y sin saturar)
    if (S()) {
      if (g.herreria && dist(lugar.fragua) < CERCA_GESTOS && reloj > prox.golpe) { golpeFragua({ x: lugar.fragua.x, y: lugar.fragua.y + 0.9, z: lugar.fragua.z }); prox.golpe = reloj + (Math.random() < 0.3 ? azar(1.6, 3) : azar(0.45, 0.65)); }
      if (g.carpinteria && dist(lugar.sierra) < CERCA_GESTOS && reloj > prox.sierra) { sierra({ x: lugar.sierra.x, y: lugar.sierra.y + 0.9, z: lugar.sierra.z }); prox.sierra = reloj + azar(3.5, 7); }
      if (g.abejas && dist(lugar.colmenas) < 25 && reloj > prox.zumbido) { zumbido(lugar.abejas || lugar.colmenas); prox.zumbido = reloj + azar(1.4, 3); }
      if (lugar.plaza && hayMurmullo(h, estado.enPlaza) && dist(lugar.plaza) < 35 && reloj > prox.murmullo) { murmullo(lugar.plaza); prox.murmullo = reloj + azar(2.2, 4.5); }
      if (hayPerros(h) && dAldea < 140 && reloj > prox.ladrido) { ladridoLejos(cam); prox.ladrido = reloj + azar(30, 70); }
    }
    actualizarMusica(dt, cam);
  }
  // El baile del sábado: el músico en el escenario toca las melodías de siempre (personal-musica.js)
  function actualizarMusica(dt, cam) {
    musica.acum += dt;
    if (musica.acum < 0.4) return;
    musica.acum = 0;
    const s = S();
    const d = lugar.salon ? Math.hypot(cam.x - lugar.salon.x, cam.z - lugar.salon.z) : Infinity;
    const musico = ctx.gente?.()?.personas?.get?.('musico')?.npc;
    const toca = !!(musico && !musico.dormido && lugar.escenario && Math.hypot(musico.pos.x - lugar.escenario.x, musico.pos.z - lugar.escenario.z) < 2.5);
    const puede = !!s && hayBaile(aldea(), dia(), hora()) && toca && d < 22 && s.musicaActiva !== false;
    if (!puede) { if (musica.s) { callarMelodia(s, musica.s); musica.s = null; } musica.activa = false; return; }
    musica.activa = true;
    s.proxMusica = Math.max(s.proxMusica || 0, 20);   // que no se le encime una frase de la música del valle
    const vol = d < 9 ? 1 : Math.max(0, 1 - (d - 9) / 13);
    if (musica.s) {
      try { musica.s.destino.gain.setTargetAtTime(0.85 * vol, s.ctx.currentTime, 0.3); } catch { /* ya */ }
      if (!seguirMelodia(s, musica.s)) { musica.s = null; musica.proxima = s.ctx.currentTime + 4; musica.tanda++; }
      return;
    }
    if (s.ctx.currentTime >= musica.proxima) { musica.s = empezarMelodia(s, melodiaDelBaile(dia(), musica.tanda), vol); if (musica.s) seguirMelodia(s, musica.s); }
  }

  // ------------------------------------------------ el aviso y la tecla E (la misma función)
  const paredEntre = (a, b) => !!ctx.col?.paredEntre?.(a.x, a.z, b.x, b.z, (b.y ?? a.y) + 1);
  function accion(js) {
    if (!listo || !js?.pos) return null;
    if (js.enTren || js.enKayak || js.montado) return null;
    const p = js.pos, m = mec();
    const lista = [];
    if (js.sentado) {
      for (const s of lectura) { const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < MECANICAS.libro.radio && Math.abs(s.y - 0.45 - p.y) < 1.1) { lista.push({ tipo: 'libro', d }); break; } }
      if (m.prestado && ctx.enCasa?.(p)) lista.push({ tipo: 'libro-prestado', d: 0 });
    }
    if (Math.hypot(p.x - centro.x, p.z - centro.z) < 160) {
      const fx = -Math.sin(js.yaw || 0), fz = -Math.cos(js.yaw || 0);
      for (const c of cands) {
        const def = MECANICAS[c.tipo];
        if (def.sentado === true && !js.sentado) continue;
        if (def.sentado === false && js.sentado) continue;
        const dx = c.x - p.x, dz = c.z - p.z, d = Math.hypot(dx, dz);
        if (d > c.radio || Math.abs(c.y - p.y) > 1.7) continue;
        if (c.tipo === 'estufa' && !(js.entumecido > 0)) continue;
        if (c.tipo === 'prestamo' && !textoPrestamo(m, dia())) continue;
        // parado, hay que estar más o menos de frente (con la estufa, no hace falta)
        if (!js.sentado && c.tipo !== 'estufa' && d > 0.7 && (dx * fx + dz * fz) / d < 0.25) continue;
        if (paredEntre(p, c)) continue;
        lista.push({ tipo: c.tipo, d, c });
      }
    }
    const e = elegirMecanica(lista);
    if (!e) return null;
    return { tipo: e.tipo, texto: textoDe(e, m), hacer: () => hacer(e) };
  }
  function textoDe(e, m) {
    if (e.tipo === 'libro-prestado') return avisoPrestado(LIBRO_ALDEA[m.prestado.id]);
    if (e.tipo === 'prestamo') return textoPrestamo(m, dia());
    return AVISOS_MECANICAS[e.tipo];
  }
  function hacer(e) {
    const m = mec(), p = prog();
    const entradas = p.entradas || {};
    switch (e.tipo) {
      case 'libro': {
        const l = libroParaLeer(entradas, dia());
        ctx.leer({ quien: 'Biblioteca Popular', que: l.titulo, partes: l.partes, id: l.id, despedida: 'Cerrás el libro y lo dejás sobre la mesa, para el que venga.' });
        break;
      }
      case 'libro-prestado': {
        const l = LIBRO_ALDEA[m.prestado.id];
        ctx.leer({ quien: 'Libro prestado', que: l.titulo, partes: l.partes, id: l.id, despedida: 'Le ponés el señalador. Cuando vuelvas a la aldea, lo devolvés en la biblioteca.' });
        break;
      }
      case 'estufa':
        ctx.alJugador('entumecido', 0);
        ctx.nota('Te calentaste junto a la estufa', 'Se te fue el frío de las manos');
        break;
      case 'camilla': {
        const r = descansarEnCamilla(p.aldea, dia());
        for (const f of r.efectos) ctx.alJugador(f.campo, f.valor);
        if (camilla) ctx.sentarEn({ x: camilla.x, y: camilla.y + 0.72, z: camilla.z, mira: camilla.mira + Math.PI });
        ctx.nota(r.titulo, r.sub, r.ok);
        ctx.guardar();
        break;
      }
      case 'prestamo': {
        const r = m.prestado ? devolverLibro(m) : pedirPrestado(m, entradas, dia());
        ctx.nota(r.titulo, r.sub, !!r.ok && !!r.libro && !!m.prestado);
        S()?.juntar?.();
        ctx.guardar();
        break;
      }
      case 'aljibe': {
        const r = sacarAgua(m, dia());
        for (const f of r.efectos) ctx.alJugador(f.campo, f.valor);
        ctx.nota(r.titulo, r.sub);
        S()?.chapoteo?.({ x: e.c.x, y: e.c.y + 0.5, z: e.c.z }, 0.35);
        ctx.guardar();
        break;
      }
      case 'duende':
        ctx.leer({ quien: 'El duende de la plaza', que: 'la plaquita de bronce', partes: PLACA_DUENDE.partes, id: PLACA_DUENDE.id, despedida: 'El duende sigue mirando a la estación.' });
        break;
      case 'pizarron':
        ctx.leer({ quien: 'El pizarrón', que: 'la escuela', partes: pizarronDelDia(entradas, dia()), despedida: 'Alguien dejó la tiza en el borde, gastada de un lado.' });
        break;
      case 'dibujos':
        ctx.leer({ quien: 'Los dibujos de los chicos', que: 'la escuela', partes: dibujosDeLosChicos(entradas, dia()), despedida: 'Uno de los dibujos tiene un duende escondido en una esquina.' });
        break;
      case 'horario': {
        const tren = ctx.tren?.();
        const parada = tren?.paradas?.find?.((x) => x.aldea);
        const q = parada ? tren.proximoTrenA(parada) : null;
        const enAnden = !!tren?.parado?.() && !!q && (q.metros < 14 || q.metros > tren.largo - 14);
        const vuelta = tren?.largo ? tren.largo / Math.max(2.5, tren.est?.objetivo || 7) + (tren.paradas?.length || 4) * 57 : null;
        ctx.leer({ quien: 'Horario de trenes', que: 'en el andén', partes: horarioTrenes({ segundos: q?.segundos, metros: q?.metros, enAnden, hora: hora(), duracionDia: ctx.duracionDia?.() ?? 30, vuelta }), despedida: 'El jefe de estación lo corrige con tiza cuando el tren se atrasa.' });
        break;
      }
      case 'casillas':
        ctx.abrirCasilla(e.c);
        break;
      case 'mapa':
        ctx.leer({ quien: 'El mapa del valle', que: 'la seccional de guardaparques', partes: faltanDelValle(entradas, dia()), despedida: '«Andá con cuidado y mirá sin molestar», te dice la guardaparque.' });
        break;
      default: break;
    }
  }

  // ------------------------------------------------ lo demás que pregunta main.js
  // ¿Al lado de una estufa encendida? (el entumecido se va como junto al fuego)
  function juntoAEstufa(pos) {
    if (!listo || !pos || !estufas.length || Math.hypot(pos.x - centro.x, pos.z - centro.z) > 160) return false;
    for (const c of estufas) if (Math.hypot(c.x - pos.x, c.z - pos.z) < RADIO_ESTUFA && Math.abs(c.y - pos.y) < 1.6 && !paredEntre(pos, c)) return true;
    return false;
  }
  // Una charla de vecinos que terminó (aldea-gente.js): el cuento del domingo, escuchado entero y sentado
  function alTerminarCharla(c) {
    const js = ctx.jugador?.()?.estado;
    if (!js || !c || !lugar.biblioteca) return;
    const enBiblioteca = Math.hypot(js.pos.x - lugar.biblioteca.x, js.pos.z - lugar.biblioteca.z) < 8 && ctx.mundo?.adentro?.(js.pos)?.id === 'biblioteca';
    const ds = ((dia() - 1) % 7 + 7) % 7;
    if (!cuentoEscuchado({ diaSemana: ds, hora: hora(), sentado: js.sentado, enBiblioteca, completa: c.completa, personas: c.personas })) return;
    info.cuentos++;
    if (!prog().entradas?.[CUENTOS_DOMINGO.id]) ctx.registrar(CUENTOS_DOMINGO.id);
    else ctx.nota('Otro cuento de la abuela', 'Los chicos piden otro, y otro más');
  }
  // Sentado escuchando los cuentos o con la música del salón, el reloj no se apura
  const sinApuro = () => musica.activa || (!!ctx.gente?.()?.oyendo?.() && cerca);
  function medir() {
    return {
      ms: +info.ms.toFixed(4), msMax: +info.msMax.toFixed(3), dibujos: nubes.filter((q) => q.p.visible).length, ...info,
      chispas: chispas.p.visible, abejas: abejas.p.visible, humo: humo.p.visible, musica: musica.activa, banderaF: estado.banderaF, campana: estado.campana,
      gestos: { ...estado.gestos }, enPlaza: estado.enPlaza, listo, lectura: lectura.length, estufas: estufas.length,
    };
  }
  return {
    actualizar, accion, juntoAEstufa, alTerminarCharla, sinApuro, medir, revisar: () => { acumRevisar = 0; revisar(); },
    reiniciarMedidas: () => { info.ms = 0; info.msMax = 0; },
    candidatos: () => cands.map((c) => ({ tipo: c.tipo, x: c.x, y: c.y, z: c.z, edificio: c.edificio, mira: c.mira })),
    lugares: () => ({ ...lugar, camilla, lectura: lectura.map((s) => ({ ...s })) }), animables: () => anim, nubes: () => nubes.map((q) => q.p),
    sentaderos: () => [...propios.values()].flat(), centro,
  };
}
