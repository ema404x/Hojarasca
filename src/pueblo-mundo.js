// 3.1: el pueblo en el mundo (las reglas están en pueblo.js). Busca tus casas aptas,
// hace bajar al que llega en la estación cuando para la trochita, lo muda a la casa que
// le das, le arma la rutina del día (adentro de noche, trabajando al lado de la casa, un
// rato en la plaza al mediodía, en la puerta al caer la tarde), pone al lado de cada
// casa lo de su oficio (el yunque, el horno, el caballete, la red, el pizarrón) y planta
// el cartel con el nombre del pueblo. Las figuras son las de gente.js.
import * as THREE from 'three';
import { lam } from './vida.js';
import { alturaDePie } from './gente.js';
import { PLANO } from './construccion.js';
import {
  POBLADORES, puebloNuevo, claveCasa, casasLibres, puedeLlegarPoblador, empezarLlegada, aceptarPoblador,
  nombrarPueblo, lugarDelCartel, rutinaPoblador, servicioDe, aplicarAlPueblo, llamarPoblador, anotacionesDe, anotacionesPedidas, quienLlega,
} from './pueblo.js';

// ---------------------------------------------------------------- el cartel
function texturaCartel(texto) {
  const lienzo = document.createElement('canvas');
  lienzo.width = 512; lienzo.height = 128;
  const x = lienzo.getContext('2d');
  x.fillStyle = '#6b4e33'; x.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 36; i++) {
    x.strokeStyle = `rgba(40,25,12,${0.1 + ((i * 37) % 17) / 90})`; x.lineWidth = 1 + (i % 3);
    const y = (i * 53) % 128;
    x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(170, y + 3, 340, y - 3, 512, y); x.stroke();
  }
  let tam = 58;
  x.font = `600 ${tam}px Spectral, Georgia, serif`;
  while (tam > 26 && x.measureText(texto).width > 470) { tam -= 4; x.font = `600 ${tam}px Spectral, Georgia, serif`; }
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(255,230,190,0.18)'; x.fillText(texto, 258, 68);
  x.fillStyle = '#2a1a0e'; x.fillText(texto, 256, 66);
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ---------------------------------------------------------------- lo de cada oficio
function caja(g, mat, sx, sy, sz, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; }
function cilindro(g, mat, r1, r2, h, x, y, z, seg = 8) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; }
function utilDeOficio(clave) {
  const g = new THREE.Group();
  const madera = lam('#6b5238'), oscura = lam('#4a3b2c'), hierro = lam('#3d3f42');
  if (clave === 'herrero') {
    cilindro(g, oscura, 0.28, 0.32, 0.55, 0, 0.275, 0);                 // tronco de apoyo
    caja(g, hierro, 0.55, 0.16, 0.22, 0, 0.63, 0);                       // yunque
    caja(g, hierro, 0.18, 0.1, 0.14, 0.34, 0.66, 0);                     // pico
    cilindro(g, lam('#7a3a22'), 0.34, 0.4, 0.5, 0.95, 0.25, 0.2, 10);   // fragua
  } else if (clave === 'panadera') {
    const barro = lam('#9a6a48');
    const horno = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), barro);
    horno.position.set(0, 0.45, 0); horno.castShadow = true; g.add(horno);
    caja(g, lam('#7d766c'), 1.4, 0.45, 1.4, 0, 0.225, 0);               // base de piedra
    caja(g, lam('#1e1814'), 0.34, 0.26, 0.05, 0, 0.62, 0.6);            // boca
  } else if (clave === 'carpintero') {
    for (const sx of [-0.55, 0.55]) for (const sz of [-0.18, 0.18]) caja(g, oscura, 0.07, 0.7, 0.07, sx, 0.35, sz);
    caja(g, madera, 1.4, 0.08, 0.5, 0, 0.72, 0);                         // caballete
    caja(g, lam('#9a7a55'), 1.2, 0.05, 0.22, 0.05, 0.8, 0);             // tabla a medio cortar
  } else if (clave === 'pescador') {
    for (const sx of [-0.8, 0.8]) caja(g, oscura, 0.08, 1.6, 0.08, sx, 0.8, 0);
    caja(g, oscura, 1.7, 0.06, 0.06, 0, 1.58, 0);
    const red = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), lam('#8c8a70', { side: THREE.DoubleSide, transparent: true, opacity: 0.75 }));
    red.position.set(0, 1.0, 0); g.add(red);
  } else if (clave === 'maestra') {
    for (const sx of [-0.55, 0.55]) caja(g, oscura, 0.07, 1.5, 0.07, sx, 0.75, 0);
    caja(g, madera, 1.3, 0.85, 0.06, 0, 1.15, 0.02);
    caja(g, lam('#23332b'), 1.18, 0.73, 0.02, 0, 1.15, 0.06);            // pizarrón
  }
  return g;
}

export function crearPuebloMundo(T, escena, col, ctx) {
  const grupo = new THREE.Group();
  grupo.name = 'pueblo';
  escena.add(grupo);
  const npcs = new Map();         // clave → figura de gente.js
  const utiles = new Map();       // clave → lo de su oficio
  const seguimiento = new Map();  // clave → { destino, d, t } (para destrabar)
  let cartel = null, reloj = 0, aptasCache = null, aptasT = -1;

  const progreso = () => ctx.progreso();
  function pueblo() {
    const p = progreso();
    if (!p.pueblo) p.pueblo = puebloNuevo();
    return p.pueblo;
  }
  const dia = () => Math.max(1, Math.floor(progreso().dia || 1));

  // ---------------------------------------------------------------- las casas
  function obraTerminada(o) { return o && o.datos.etapas >= o.plano.etapas.length; }
  function catreEn(o) {
    const O = ctx.obras();
    return O.obrasCerca(o.datos, 4, []).some((c) => c.plano.id === 'catre-campo' && obraTerminada(c) &&
      Math.hypot(c.datos.x - o.datos.x, c.datos.z - o.datos.z) < Math.max(o.plano.ancho, o.plano.fondo) / 2);
  }
  function datosCasa(o) {
    const d = o.datos;
    return { id: claveCasa(o.plano.id, d.x, d.z), plano: o.plano.id, nombre: d.nombre || o.plano.nombre, x: d.x, z: d.z, rot: d.rot || 0, y: d.y };
  }
  // Las casas terminadas con puerta y cama: un puesto (trae catre y puerta), una casilla
  // con un catre adentro, o una casa de módulos habitable (con puerta) y con cama.
  function casasAptas() {
    const O = ctx.obras();
    if (!O) return [];
    const aptas = [];
    for (const casa of O.casas()) {
      let apta = null;
      for (const o of casa.piezas) {
        if (!obraTerminada(o)) continue;
        if (o.plano.id === 'puesto' || (o.plano.id === 'casilla' && catreEn(o))) { apta = datosCasa(o); break; }
      }
      if (!apta) {
        const pisos = casa.piezas.filter((o) => o.plano.snap?.tipo === 'piso' && obraTerminada(o));
        const conPuerta = pisos.some((p) => (O.estadoModulo(p)?.accesos || 0) > 0);
        if (conPuerta) {
          for (const p of pisos) {
            const y = (p.datos.y ?? T.altura(p.datos.x, p.datos.z)) + 0.35;
            const h = O.estadoHabitat({ x: p.datos.x, y, z: p.datos.z });
            if (h?.habitable && h.cama) { apta = datosCasa(p); break; }
          }
        }
      }
      if (apta) aptas.push(apta);
    }
    return aptas;
  }
  function aptas(forzar = false) {
    if (forzar || !aptasCache || reloj - aptasT > 4) { aptasCache = casasAptas(); aptasT = reloj; }
    return aptasCache;
  }

  // ---------------------------------------------------------------- lugares
  const estacion = () => {
    const t = ctx.tren?.();
    const e = t?.estacion;
    if (e?.espera) return { x: e.espera.x, z: e.espera.z };
    if (e) return { x: e.x, z: e.z };
    const l = T.lugares.estacion || T.lugares.refugio;
    return { x: l.x, z: l.z };
  };
  const aMundo = (c, lx, lz) => { const r = c.rot || 0; return { x: c.x + lx * Math.cos(r) + lz * Math.sin(r), z: c.z - lx * Math.sin(r) + lz * Math.cos(r) }; };
  const seco = (p, respaldo) => (T.agua(p.x, p.z) ? respaldo : p);
  function puntosDeCasa(casa, i = 0) {
    const P = Object.hasOwn(PLANO, casa.plano) ? PLANO[casa.plano] : null;
    if (P && !P.snap) {
      const W = P.ancho || 4, D = P.fondo || 4;
      const frente = aMundo(casa, 0, -(D / 2 + 1.5));
      return {
        frente,
        trabajo: seco(aMundo(casa, (i % 2 ? -1 : 1) * (W / 2 + 1.5), -(D / 2 + 0.9)), frente),
        util: seco(aMundo(casa, (i % 2 ? -1 : 1) * (W / 2 + 1.6), -(D / 2) + 0.5), frente),
        adentro: aMundo(casa, 0.4, 0.2),
        mira: { x: casa.x, z: casa.z },
      };
    }
    // casa de módulos: la puerta no se sabe de qué lado está; se sale hacia la estación
    const e = estacion();
    let dx = e.x - casa.x, dz = e.z - casa.z;
    const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
    const frente = seco({ x: casa.x + dx * 3.6, z: casa.z + dz * 3.6 }, { x: casa.x, z: casa.z });
    return {
      frente,
      trabajo: seco({ x: frente.x - dz * 1.8, z: frente.z + dx * 1.8 }, frente),
      util: seco({ x: frente.x - dz * 2.8 + dx * 0.6, z: frente.z + dx * 2.8 + dz * 0.6 }, frente),
      adentro: { x: casa.x, z: casa.z },
      mira: { x: casa.x, z: casa.z },
    };
  }
  function plazaPara(i) {
    const pb = pueblo();
    const a = (i / 5) * Math.PI * 2;
    const c = pb.cartel || (pb.pobladores[0] ? puntosDeCasa(pb.pobladores[0].casa, 0).frente : estacion());
    return seco({ x: c.x + Math.cos(a) * 2.2, z: c.z + Math.sin(a) * 2.2 }, c);
  }
  function destinoDe(poblador, i, fase) {
    const pts = puntosDeCasa(poblador.casa, i);
    if (fase === 'plaza') return { ...plazaPara(i), mirar: pueblo().cartel || pts.mira };
    if (fase === 'trabajo') return { ...pts.trabajo, mirar: pts.util };
    if (fase === 'adentro') return { ...pts.frente, adentro: pts.adentro, mirar: pts.mira };
    return { ...pts.frente, mirar: { x: pts.frente.x + (pts.frente.x - pts.mira.x), z: pts.frente.z + (pts.frente.z - pts.mira.z) } };
  }

  // ---------------------------------------------------------------- las figuras
  function crearFigura(clave, pos, extra = {}) {
    const def = POBLADORES[clave];
    const g = ctx.gente();
    if (!g?.agregarPoblador) return null;
    const npc = g.agregarPoblador({
      clave: `poblador-${clave}`, colores: def.colores, pos, mira: extra.mira, nombre: def.nombre, oficio: def.oficio,
      saludo: extra.saludo || def.saludo, despedida: extra.despedida || def.despedida, mano: def.mano, velocidad: 0.85,
      ruta: [{ x: pos.x, z: pos.z, quieto: 99999, mirar: extra.mira }],
    });
    npc.claveOficio = clave;
    npcs.set(clave, npc);
    return npc;
  }
  function ubicar(npc, p) { npc.pos.set(p.x, alturaDePie(T, col, p.x, p.z, npc.pos.y), p.z); }
  function irA(npc, destino) {
    npc.ruta = [{ x: destino.x, z: destino.z, quieto: 99999, mirar: destino.mirar }];
    npc.etapa = 0; npc.espera = 0;
  }
  function ponerUtil(poblador, i) {
    const viejo = utiles.get(poblador.clave);
    if (viejo) { grupo.remove(viejo); }
    const u = utilDeOficio(poblador.clave);
    const pts = puntosDeCasa(poblador.casa, i);
    u.position.set(pts.util.x, T.altura(pts.util.x, pts.util.z), pts.util.z);
    u.rotation.y = (poblador.casa.rot || 0) + (Object.hasOwn(PLANO, poblador.casa.plano) && PLANO[poblador.casa.plano].snap ? 0 : Math.PI);
    grupo.add(u);
    utiles.set(poblador.clave, u);
  }
  function mudar(poblador, i) {
    let npc = npcs.get(poblador.clave);
    const fase = rutinaPoblador(progreso().horas);
    const dest = destinoDe(poblador, i, fase);
    if (!npc) npc = crearFigura(poblador.clave, fase === 'adentro' ? dest.adentro : dest, { mira: dest.mirar });
    if (!npc) return;
    npc.llegando = false;
    // de noche (una partida cargada a esa hora) ya está adentro: no sale a dar la vuelta
    npc.faseDia = fase === 'adentro' ? fase : null;
    npc.adentro = fase === 'adentro';
    ponerUtil(poblador, i);
  }
  function sincronizar() {
    const pb = pueblo();
    pb.pobladores.forEach((p, i) => mudar(p, i));
    if (pb.llegando && !npcs.has(pb.llegando.clave)) bajarDelTren(pb.llegando.clave, false);
    armarCartel();
  }

  // ---------------------------------------------------------------- la llegada
  function trenEnEstacion() {
    const e = ctx.estadoTren?.(), t = ctx.tren?.();
    return !!(e && e.parado && t?.estacion && e.proxima === t.estacion);
  }
  function bajarDelTren(clave, avisar = true) {
    const e = estacion();
    const t = ctx.tren?.();
    const mira = t?.estacion ? { x: t.estacion.x, z: t.estacion.z } : { x: e.x + 1, z: e.z };
    const npc = crearFigura(clave, e, { mira, saludo: 'Buenas. ¿Usted es el de las casas?', despedida: 'Lo espero acá, entonces.' });
    if (npc) npc.llegando = true;
    if (avisar) {
      ctx.nota('Bajó alguien de la trochita', `${POBLADORES[clave].nombre}, ${POBLADORES[clave].oficio}, espera en la estación con una valija`, true);
      ctx.sonido?.anotar?.();
    }
    return npc;
  }
  function revisarLlegada(forzarTren = false) {
    const pb = pueblo();
    // sólo se mira cuando la trochita está parada en la estación (buscar casas cuesta)
    if (pb.llegando || !(forzarTren || trenEnEstacion())) return null;
    const libres = casasLibres(aptas(), pb);
    const r = puedeLlegarPoblador(progreso(), libres.length);
    if (!r.ok) return null;
    empezarLlegada(pb, r.quien, dia());
    bajarDelTren(r.quien);
    ctx.guardar();
    return r.quien;
  }
  // La casa que le toca: la libre más cerca de donde estás (la que le estás mostrando).
  function casaParaElQueLlega() {
    const js = ctx.jugador()?.estado;
    const libres = casasLibres(aptas(true), pueblo());
    if (!libres.length) return null;
    if (js) libres.sort((a, b) => Math.hypot(a.x - js.pos.x, a.z - js.pos.z) - Math.hypot(b.x - js.pos.x, b.z - js.pos.z));
    return libres[0];
  }
  function aceptar(npc, casa) {
    const pb = pueblo();
    const libre = casasLibres(aptas(true), pb).find((c) => c.id === casa.id) || casaParaElQueLlega();
    if (!libre) { ctx.nota('Ya no hay casa libre', 'Terminá una casa con puerta y cama, y volvé a hablarle'); return null; }
    const nuevo = aceptarPoblador(pb, libre, dia());
    if (!nuevo) return null;
    const def = POBLADORES[nuevo.clave];
    npc.llegando = false; npc.saludo = def.saludo; npc.despedida = def.despedida; npc.faseDia = null;
    ponerUtil(nuevo, pb.pobladores.length - 1);
    ctx.nota(`${def.nombre} se queda en tu pueblo`, `Vive en ${libre.nombre.toLowerCase()}. ${def.resumen}`, true);
    ctx.sonido?.anotar?.();
    if (!pb.nombre) setTimeout(() => ctx.nota('Tu pueblo necesita un nombre', 'Ponéselo en el cuaderno (J), en «Oficios y pueblo»', true), 2400);
    ctx.guardar();
    return nuevo;
  }

  // ---------------------------------------------------------------- la charla
  // Lo que dice el poblador (o el que llegó) cuando le hablás, con lo que pasa al final.
  function charla(npc) {
    const clave = npc?.claveOficio;
    if (!clave || !POBLADORES[clave]) return null;
    const def = POBLADORES[clave];
    if (npc.llegando) {
      const casa = casaParaElQueLlega();
      if (!casa) return { id: `pueblo-${clave}`, partes: [...def.llegada, 'Me dijeron que había una casa vacía, pero no la veo. Espero acá hasta que tengas una terminada, con puerta y cama.'] };
      const js = ctx.jugador()?.estado;
      const lejos = js ? Math.round(Math.hypot(casa.x - js.pos.x, casa.z - js.pos.z)) : 0;
      return {
        id: `pueblo-${clave}`,
        partes: [...def.llegada, `Me dijeron que tenés una casa vacía: ${casa.nombre.toLowerCase()}${lejos > 20 ? `, a unos ${lejos} metros` : ''}. ¿Me puedo quedar a vivir ahí?`],
        seguir: 'E: que se quede · Escape: todavía no',
        alTerminar: () => aceptar(npc, casa),
      };
    }
    const s = servicioDe(clave, progreso(), dia());
    return {
      id: `pueblo-${clave}`,
      partes: s.partes.length ? s.partes : [def.resumen],
      seguir: s.seguir,
      alTerminar: s.efectos ? () => usarServicio(clave, s) : null,
    };
  }
  function usarServicio(clave, s) {
    const p = progreso();
    // lo ofrecido se vuelve a mirar al aceptar: en el medio pudiste gastar lo que ibas a dar
    const ahora = servicioDe(clave, p, dia());
    if (!ahora.efectos || JSON.stringify(ahora.efectos) !== JSON.stringify(s.efectos)) {
      ctx.nota('Ya no alcanza', `${POBLADORES[clave].nombre}: «Mirá bien lo que traés y volvé»`);
      return false;
    }
    for (const f of s.efectos || []) {
      if (f.tipo === 'material') ctx.sumarMaterial(f.k, f.n);
      else if (f.tipo === 'cosa') { p.cosas = p.cosas || {}; p.cosas[f.k] = f.fijar !== undefined ? f.fijar : Math.max(0, (p.cosas[f.k] || 0) + f.n); }
      else if (f.tipo === 'entrada') ctx.sumarEntrada(f.k, f.n);
    }
    aplicarAlPueblo(pueblo(), s.efectos, dia());
    ctx.refrescarBarra?.();
    ctx.nota(s.titulo || POBLADORES[clave].nombre, POBLADORES[clave].nombre, true);
    ctx.guardar();
    return true;
  }

  // ---------------------------------------------------------------- el cartel
  function armarCartel() {
    const pb = pueblo();
    if (cartel) { grupo.remove(cartel); cartel.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); if (m.material.map) m.material.map.dispose(); } }); cartel = null; }
    if (!pb.nombre || !pb.cartel) return;
    const g = new THREE.Group();
    const madera = lam('#4a3b2c');
    for (const sx of [-0.95, 0.95]) caja(g, madera, 0.12, 2.1, 0.12, sx, 1.05, 0);
    caja(g, lam('#5d4630'), 2.2, 0.62, 0.08, 0, 1.75, 0);
    const tex = texturaCartel(pb.nombre);
    const matTex = new THREE.MeshLambertMaterial({ map: tex });
    for (const lado of [1, -1]) {
      const cara = new THREE.Mesh(new THREE.PlaneGeometry(2.08, 0.52), matTex);
      cara.position.set(0, 1.75, lado * 0.045);
      if (lado < 0) cara.rotation.y = Math.PI;
      g.add(cara);
    }
    g.position.set(pb.cartel.x, T.altura(pb.cartel.x, pb.cartel.z), pb.cartel.z);
    g.rotation.y = pb.cartel.rot || 0;
    g.name = 'cartel-pueblo';
    grupo.add(g);
    cartel = g;
    // queda en el mapa y en la brújula, como las obras con nombre
    T.lugares['pueblo-propio'] = { x: pb.cartel.x, z: pb.cartel.z, y: T.altura(pb.cartel.x, pb.cartel.z), nombre: pb.nombre, propia: true };
  }
  function nombrar(texto) {
    const pb = pueblo();
    if (!pb.pobladores.length) return false;
    let lugar = pb.cartel;
    if (!lugar) {
      lugar = lugarDelCartel(pb.pobladores.map((p) => p.casa), estacion());
      // si cae en el agua, se acerca a las casas hasta pisar tierra
      for (let k = 0; k < 10 && lugar && T.agua(lugar.x, lugar.z); k++) {
        const c = pb.pobladores[0].casa;
        lugar = { ...lugar, x: (lugar.x + c.x) / 2, z: (lugar.z + c.z) / 2 };
      }
    }
    if (!nombrarPueblo(pb, texto, lugar)) return false;
    armarCartel();
    ctx.nota(pb.nombre, 'El pueblo ya tiene nombre: el cartel está a la entrada', true);
    ctx.guardar();
    return true;
  }

  // ---------------------------------------------------------------- cada cuadro
  function actualizar(dt) {
    reloj += dt;
    if ((actualizar.acum = (actualizar.acum || 0) + dt) < 1) return;
    const paso = actualizar.acum;
    actualizar.acum = 0;
    const pb = pueblo();
    revisarLlegada();
    const js = ctx.jugador()?.estado;
    if (!js) return;
    const fase = rutinaPoblador(progreso().horas);
    pb.pobladores.forEach((p, i) => {
      const npc = npcs.get(p.clave);
      if (!npc) { mudar(p, i); return; }
      if (ctx.hablandoCon?.() === npc) return;
      const dest = destinoDe(p, i, fase);
      // gente.js no mueve a los que no se ven (a más de 130 m): esos llegan de una, sin que nadie lo vea
      const lejosJugador = Math.hypot(npc.pos.x - js.pos.x, npc.pos.z - js.pos.z) > 120;
      if (npc.faseDia !== fase) {
        // a la mañana sale por la puerta (no atraviesa paredes)
        if (npc.adentro) ubicar(npc, puntosDeCasa(p.casa, i).frente);
        npc.faseDia = fase; npc.adentro = false;
        irA(npc, dest);
        seguimiento.set(p.clave, { d: Infinity, t: 0 });
      }
      const d = Math.hypot(npc.pos.x - dest.x, npc.pos.z - dest.z);
      // de noche entra por la puerta y se queda adentro
      if (fase === 'adentro' && !npc.adentro && (d < 1 || lejosJugador)) { npc.adentro = true; ubicar(npc, dest.adentro); npc.ruta = [{ x: dest.adentro.x, z: dest.adentro.z, quieto: 99999 }]; npc.espera = 99999; return; }
      if (npc.adentro) return;
      // lejos, nadie lo ve caminar: llega de una. Y si se trabó contra algo, también.
      const s = seguimiento.get(p.clave) || { d: Infinity, t: 0 };
      if (d > 1 && lejosJugador) { ubicar(npc, dest); npc.espera = 99999; return; }
      // con vos al lado se queda quieto a charlar (gente.js): eso no es estar trabado
      const alLado = Math.hypot(npc.pos.x - js.pos.x, npc.pos.z - js.pos.z) < 7.5;
      if (d > 1 && !alLado && d > s.d - 0.2) s.t += paso; else s.t = 0;
      s.d = Math.min(s.d, d);
      if (s.t > 12) { ubicar(npc, dest); s.t = 0; }
      seguimiento.set(p.clave, s);
    });
  }

  // ---------------------------------------------------------------- en el cuaderno
  function dibujarCuaderno(ficha, el) {
    const pb = pueblo();
    const p = progreso();
    ficha.appendChild(el('h2', '', pb.nombre || 'Tu pueblo'));
    if (!pb.pobladores.length) {
      ficha.appendChild(el('p', 'texto', 'Si levantás una casa con puerta y cama y cuidás el valle, un día alguien baja de la trochita y te pregunta si se puede quedar.'));
    } else {
      const lista = el('ul', 'lista');
      for (const x of pb.pobladores) {
        const def = POBLADORES[x.clave];
        const li = el('li');
        li.appendChild(el('p', 'texto', `${def.nombre}, ${def.oficio}. Vive en ${x.casa.nombre.toLowerCase()} desde el día ${x.dia}. ${def.resumen}`));
        lista.appendChild(li);
      }
      ficha.appendChild(lista);
    }
    if (pb.llegando) ficha.appendChild(el('p', 'pista', `${POBLADORES[pb.llegando.clave].nombre} espera en la estación: andá a hablarle.`));
    else {
      const libres = casasLibres(aptas(true), pb).length;
      const r = puedeLlegarPoblador(p, libres);
      if (quienLlega(pb)) ficha.appendChild(el('p', 'pista', r.ok ? 'Ya puede llegar alguien: esperá la trochita en la estación.' : `Para el próximo: ${r.motivo.toLowerCase()}. (Casas libres: ${libres}; anotaciones: ${anotacionesDe(p)} de ${anotacionesPedidas(pb)})`));
    }
    if (pb.pobladores.length) {
      const fila = el('div', 'nombre-pueblo');
      fila.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap';
      const campo = document.createElement('input');
      campo.type = 'text'; campo.maxLength = 28; campo.value = pb.nombre || ''; campo.placeholder = 'Nombre del pueblo';
      campo.id = 'pueblo-nombre';
      campo.style.cssText = 'flex:1;min-width:10em;padding:4px 8px;font:inherit';
      // que escribir una J o un Escape no cierre el cuaderno
      campo.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') boton.click(); });
      const boton = document.createElement('button');
      boton.id = 'pueblo-nombrar';
      boton.textContent = pb.nombre ? 'Cambiar el nombre' : 'Ponerle nombre';
      boton.addEventListener('click', () => { if (nombrar(campo.value)) ctx.redibujar?.(); });
      fila.append(campo, boton);
      ficha.appendChild(fila);
    }
  }

  function llamar() { llamarPoblador(pueblo()); ctx.guardar(); return true; }

  sincronizar();
  return {
    grupo, actualizar, charla, nombrar, llamar, casasAptas: () => aptas(true), revisarLlegada, dibujarCuaderno, sincronizar,
    npcs, cartel: () => cartel, utiles,
    // para las pruebas: cómo está todo
    estado: () => ({
      pueblo: pueblo(), libres: casasLibres(aptas(true), pueblo()).map((c) => c.id), aptas: aptas(true).map((c) => c.id),
      npcs: [...npcs.entries()].map(([k, n]) => ({ clave: k, x: n.pos.x, z: n.pos.z, fase: n.faseDia, adentro: !!n.adentro, llegando: !!n.llegando })),
      cartel: cartel ? { x: cartel.position.x, z: cartel.position.z } : null, enEstacion: trenEnEstacion(),
    }),
    puntosDeCasa,
  };
}
