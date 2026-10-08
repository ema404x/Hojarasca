// 2.6: el fortín en el mundo (las reglas y los números están en desafio-fortin.js).
//
// desafio.js lo arma con la misma `api` que las defensas y el arsenal, y lo llama en
// pocos lugares: al pedir si una obra deja pasar un tiro o está abierta, al calcular el
// daño a una pared, en cada invasor (lazo, abrojos, cerco, espejo, señuelo, embudo), en
// cada cuadro (catapulta, troncos, puente, rampa, hielo) y con la tecla E.
import * as THREE from 'three';
import {
  FORTIN, PAREDES, HELABLES, CON_RESINA, pasaPorTronera, factorPared, heladaActiva, usarResina, avisoResina,
  blancoCatapulta, tiroParabolico, enElHaz, rumboEspejo, destinoEmbudo, recargaArmero, usarRampa, avisoRampa, sanearDatosFortin,
} from './desafio-fortin.js';
import { QUEMA } from './desafio-arsenal.js';
import { ESTILO, LLAMAS } from './estilo-casa.js';

const _v = new THREE.Vector3();
const vivo = (a) => a.estado !== 'morir' && a.estado !== 'irse' && a.estado !== 'bajoTierra' && a.estado !== 'dormido';
const enTierra = (a, T) => a.estado !== 'bajar' && (!a.def.vuela || a.m.g.position.y - T.altura(a.m.g.position.x, a.m.g.position.z) < 2.5);

export function crearFortinMundo(T, escena, col, obras, efectos, sonido, api, defensas) {
  const tipoDe = (o) => o.plano.defensa?.tipo;
  const completa = (o) => o.datos.etapas >= o.plano.etapas.length;
  // de local (de la pieza) a mundo, con la convención de construccion.js
  const aMundo = (o, lx, lz) => {
    const r = o.datos.rot || 0, c = Math.cos(r), s = Math.sin(r);
    return { x: o.datos.x + lx * c + lz * s, z: o.datos.z - lx * s + lz * c };
  };
  const aLocal = (o, x, z) => {
    const r = o.datos.rot || 0, dx = x - o.datos.x, dz = z - o.datos.z;
    return { lx: dx * Math.cos(r) - dz * Math.sin(r), lz: dx * Math.sin(r) + dz * Math.cos(r) };
  };
  const base = (o) => o.datos.y ?? T.altura(o.datos.x, o.datos.z);

  // ---------------------------------------------------------------- listas
  const L = { catapulta: [], troncos: [], 'cerco-cristal': [], puente: [], espejo: [], senuelo: [], lazo: [], abrojos: [], embudo: [], tejado: [], puesto: [], rampa: [], armero: [], contrafuerte: [] };
  let paredes = [], conResina = [];
  function refrescar() {
    for (const k of Object.keys(L)) L[k].length = 0;
    paredes = []; conResina = [];
    for (const o of obras.obras) {
      if (!completa(o)) continue;
      sanearDatosFortin(o.datos);
      const t = tipoDe(o);
      if (L[t]) L[t].push(o);
      if (PAREDES.includes(o.plano.id)) paredes.push(o);
      if (CON_RESINA.includes(o.plano.id)) conResina.push(o);
    }
    for (const o of L.troncos) if (o.datos.armada === undefined) o.datos.armada = true;
    for (const o of L.lazo) if (o.datos.armada === undefined) o.datos.armada = true;
    for (const o of L.catapulta) if (o.datos.piedras === undefined) o.datos.piedras = 4;
    // lo que se rompió, se desarmó o se está moviendo: fuera la física del puente, el hielo y los mapas
    for (const o of conPuente) if (!L.puente.includes(o)) { col.eliminarPorDuenio?.(o.userPuente.duenio); o.userPuente.estado = null; conPuente.delete(o); }
    for (const o of conHielo) if (!paredes.includes(o)) quitarHielo(o);
    for (const m of [recargaCat, avisoPiedras]) for (const o of m.keys()) if (!L.catapulta.includes(o)) m.delete(o);
    pintarLlamas();
  }

  // 2.8: el color del fuego de las antorchas (Personalizar → Tu fortín). Sólo se ve: la luz
  // espanta igual. Los materiales de la llama son compartidos (desafio-defensas.js): se
  // pintan una vez, cuando ya hay una antorcha, y las que se hagan después salen iguales.
  // Las luces reales de las antorchas son las PointLight de alcance 16 y caída 1,6.
  let llamaPuesta = 'fuego', lucesAntorcha = null;
  function pintarLlamas() {
    const clave = Object.hasOwn(LLAMAS, ESTILO.fortin?.llama) ? ESTILO.fortin.llama : 'fuego';
    if (clave === llamaPuesta) return;
    const L0 = (defensas?.antorchas || []).find((o) => o.userLlama)?.userLlama;
    if (!L0) return;
    const c = LLAMAS[clave];
    L0.llama.material.color.set(c.llama);
    L0.halo.material.color.set(c.halo);
    L0.charco.material.color.set(c.charco);
    if (!lucesAntorcha) { lucesAntorcha = []; escena.traverse((o) => { if (o.isPointLight && o.distance === 16 && o.decay === 1.6) lucesAntorcha.push(o); }); }
    for (const l of lucesAntorcha) l.color.set(c.luz);
    llamaPuesta = clave;
  }
  const conPuente = new Set(), conHielo = new Set();
  let acum = 9;

  // ---------------------------------------------------------------- paredes: contrafuerte y hielo
  const apuntalada = (o) => PAREDES.includes(o.plano.id) &&
    L.contrafuerte.some((c) => Math.hypot(c.datos.x - o.datos.x, c.datos.z - o.datos.z) < FORTIN.contrafuerte.radio);
  const invierno = () => api.clima().invierno || 0;
  const helada = (o) => heladaActiva(o.datos, invierno());
  const factorDanoObra = (o) => factorPared({ apuntalada: apuntalada(o), helada: helada(o) });
  const impideSalto = (o) => helada(o);
  const frenaExcavador = (o) => !!o && apuntalada(o);
  // la capa de hielo que se ve sobre la pirca
  const matHielo = new THREE.MeshLambertMaterial({ color: '#cfe8f2', transparent: true, opacity: 0.38, depthWrite: false });
  function quitarHielo(o) {
    if (o.userHielo) { o.grupo.remove(o.userHielo); o.userHielo.geometry.dispose(); o.userHielo = null; }
    conHielo.delete(o);
  }
  function actualizarHielo() {
    for (const o of paredes) {
      // 3.5.1: pasado el invierno el hielo se derrite: antes la marca quedaba para siempre y
      // la pirca volvía a helarse sola cada invierno siguiente, sin la E
      if (o.datos.helada && invierno() <= 0.5) o.datos.helada = false;
      const quiere = HELABLES.includes(o.plano.id) && helada(o);
      if (o.userHielo && o.userHielo.userData.plano !== o.plano.id) quitarHielo(o);
      if (quiere && !o.userHielo) {
        const P = o.plano;
        const m = new THREE.Mesh(new THREE.BoxGeometry((P.ancho || 3) + 0.08, (P.alto || 1.7) + 0.06, (P.fondo || 0.8) + 0.1), matHielo);
        m.position.y = (P.alto || 1.7) / 2;
        m.userData.plano = P.id;
        o.grupo.add(m);
        o.userHielo = m;
        conHielo.add(o);
      } else if (!quiere && o.userHielo) quitarHielo(o);
    }
  }

  // ---------------------------------------------------------------- lo que deja pasar tiros o está abierto
  // Tus tiros cruzan la tronera por la franja de las aspilleras, y pasan por debajo de lo
  // que está en alto (la pasarela, el tejado, el adarve).
  function pasaTiro(o, alturaRel) {
    return (tipoDe(o) === 'tronera' && pasaPorTronera(alturaRel)) || debajo(o, alturaRel);
  }
  // Por debajo de lo que está en alto se pasa, se camina y se tira (vos y ellos).
  function debajo(o, alturaRel) {
    const arriba = o.plano.soloArriba ?? o.plano.defensa?.soloArriba;
    return arriba !== undefined && alturaRel < arriba;
  }
  // El lazo y los troncos colgantes son marcos abiertos: no frenan ni tiros ni pasos.
  const sinCuerpo = (o) => !!o.plano.defensa?.sinCuerpo;
  // El puente bajado no es pared: por arriba se camina.
  const obraAbierta = (o) => tipoDe(o) === 'puente' && !!o.datos.bajado;
  // El embudo no es una caja: son dos alas. ¿El punto (local) está sobre alguna?
  function distanciaASegmentos(o, lx, lz) {
    let d0 = Infinity;
    for (const [ax, az, bx, bz] of o.plano.defensa.segmentos) {
      const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1;
      const t = Math.max(0, Math.min(1, ((lx - ax) * vx + (lz - az) * vz) / l2));
      d0 = Math.min(d0, Math.hypot(lx - (ax + vx * t), lz - (az + vz * t)));
    }
    return d0;
  }

  // ---------------------------------------------------------------- catapulta
  const recargaCat = new Map();
  function actualizarCatapultas(dt) {
    for (const o of L.catapulta) {
      const t = (recargaCat.get(o) ?? 1) - dt;
      if (t > 0) { recargaCat.set(o, t); continue; }
      if ((o.datos.piedras || 0) <= 0) { recargaCat.set(o, 1); continue; }
      const candidatos = [];
      for (const a of api.aliens) if (vivo(a) && enTierra(a, T)) candidatos.push({ x: a.m.g.position.x, z: a.m.g.position.z, y: a.m.g.position.y });
      const b = blancoCatapulta(o.datos, candidatos);
      if (!b) { recargaCat.set(o, 0.8); continue; }
      recargaCat.set(o, FORTIN.catapulta.cadencia);
      o.datos.piedras--;
      const y0 = base(o) + 2.5;
      const d = Math.hypot(b.x - o.datos.x, b.z - o.datos.z);
      const tiro = tiroParabolico(d, b.y - y0);
      const ux = (b.x - o.datos.x) / d, uz = (b.z - o.datos.z) / d;
      _v.set(o.datos.x, y0, o.datos.z);
      const p = api.lanzarProyectil('pedrusco', _v, new THREE.Vector3(ux * tiro.horizontal, tiro.vertical, uz * tiro.horizontal), 0, true, 'torreta');
      p.arma = { dano: FORTIN.catapulta.dano, radio: FORTIN.catapulta.radio };
      p.vida = tiro.tiempo + 1.5;
      sonido.golpeRuido?.({ dur: 0.5, frec: 180, tipo: 'lowpass', vol: 0.45, destino: sonido.fuente?.(o.datos, 1) });
      efectos.polvo({ x: o.datos.x, y: y0 - 1, z: o.datos.z }, 6);
      if (o.datos.piedras === 0 && (performance.now() - (avisoPiedras.get(o) || -1e9)) > 30000) {
        avisoPiedras.set(o, performance.now());
        api.nota('La catapulta se quedó sin piedras', 'Cargala con E (hasta diez)');
      }
    }
  }
  const avisoPiedras = new Map();

  // ---------------------------------------------------------------- troncos colgantes
  const geoTronco = new THREE.CylinderGeometry(0.28, 0.3, 2.2, 8).rotateZ(Math.PI / 2);
  const matTronco = new THREE.MeshLambertMaterial({ color: '#6b5238' });
  function mallaTronco(o) {
    if (o.userTronco) return o.userTronco;
    const piv = new THREE.Group();
    piv.position.set(0, 3.25, 0);
    const m = new THREE.Mesh(geoTronco, matTronco);
    m.position.y = -1.9;
    m.castShadow = true;
    piv.add(m);
    o.grupo.add(piv);
    o.userTronco = { piv, ang: o.datos.armada ? 1.15 : 0, vel: 0 };
    return o.userTronco;
  }
  function actualizarTroncos(dt) {
    for (const o of L.troncos) {
      const m = mallaTronco(o);
      if (o.datos.armada) {
        m.ang += (1.15 - m.ang) * Math.min(1, dt * 3); m.vel = 0;
        // ¿pasa alguno por abajo?
        for (const a of api.aliens) {
          if (!vivo(a) || !enTierra(a, T)) continue;
          const q = a.m.g.position;
          if (Math.hypot(q.x - o.datos.x, q.z - o.datos.z) > FORTIN.troncos.radio) continue;
          soltarTronco(o, m);
          break;
        }
      } else {
        // péndulo amortiguado
        m.vel += -m.ang * 18 * dt;
        m.vel *= Math.exp(-dt * 1.4);
        m.ang += m.vel * dt;
      }
      m.piv.rotation.x = m.ang;
    }
  }
  function soltarTronco(o, m) {
    o.datos.armada = false;
    m.vel = -9;
    sonido.golpeRuido?.({ dur: 0.6, frec: 140, tipo: 'lowpass', vol: 0.7, destino: sonido.fuente?.(o.datos, 1.2) });
    for (const a of api.aliens) {
      if (!vivo(a) || !enTierra(a, T)) continue;
      const q = a.m.g.position;
      const d = Math.hypot(q.x - o.datos.x, q.z - o.datos.z);
      if (d > FORTIN.troncos.golpe) continue;
      api.herirAlien(a, FORTIN.troncos.dano * (a.def.jefe ? 0.4 : 1), o.datos, 'trampa');
      if (!a.def.pesado) {
        const { lz } = aLocal(o, q.x, q.z);
        const dir = lz >= 0 ? 1 : -1, p = aMundo(o, 0, dir * 1.6);
        _v.set(p.x - o.datos.x, 0, p.z - o.datos.z).normalize().multiplyScalar(1.4);
        q.x += _v.x; q.z += _v.z;
        a.enredadoT = Math.max(a.enredadoT || 0, FORTIN.troncos.derriba);
      }
      efectos.astillas({ x: q.x, y: q.y + 1, z: q.z }, 6);
    }
  }

  // ---------------------------------------------------------------- cerco de cristal
  function alEmpezarNoche() {
    let sinCristal = 0;
    for (const o of L['cerco-cristal']) {
      if (api.cuanto('cristal') >= 1) { api.gastar('cristal', 1); o.datos.cargado = true; }
      else { o.datos.cargado = false; sinCristal++; }
    }
    if (sinCristal) api.nota('Un cerco dorado quedó sin carga', 'Cada tramo gasta una semilla dorada por noche');
    for (const o of L.lazo) o.datos.armada = o.datos.armada !== false;
  }
  function alAmanecer() { for (const o of L['cerco-cristal']) o.datos.cargado = false; }
  function cercoTocando(p) {
    for (const o of L['cerco-cristal']) {
      if (!o.datos.cargado) continue;
      const { lx, lz } = aLocal(o, p.x, p.z);
      if (Math.abs(lx) <= 1.55 && Math.abs(lz) <= FORTIN.cercoCristal.radio) return o;
    }
    return null;
  }

  // ---------------------------------------------------------------- puente levadizo
  const geoTablero = new THREE.BoxGeometry(2.0, 0.12, 3.5).translate(0, 0, 1.75);
  const matTablero = new THREE.MeshLambertMaterial({ color: '#8a6b4a' });
  function actualizarPuentes(dt) {
    for (const o of L.puente) {
      if (!o.userPuente) {
        const piv = new THREE.Group();
        piv.position.set(0, 0.3, 0.3);
        const m = new THREE.Mesh(geoTablero, matTablero);
        m.castShadow = true; m.receiveShadow = true;
        piv.add(m);
        o.grupo.add(piv);
        o.userPuente = { piv, ang: o.datos.bajado ? 0 : -Math.PI / 2, estado: null, duenio: { puente: o } };
      }
      const u = o.userPuente;
      conPuente.add(o);
      // 3.0.1: mientras se lo mueve (modo obra) la obra no se ve ni tiene física: el tablero
      // tampoco (antes dejaba una pared o un piso invisibles donde estaba)
      if (obras.editando === o || !o.grupo.visible) {
        if (u.estado) { col.eliminarPorDuenio?.(u.duenio); u.estado = null; }
        continue;
      }
      const donde = `${o.datos.x},${o.datos.z},${o.datos.rot || 0},${o.datos.y ?? ''}`;
      if (u.donde !== donde) { u.donde = donde; u.estado = null; }
      const objetivo = o.datos.bajado ? 0 : -Math.PI / 2;
      u.ang += (objetivo - u.ang) * Math.min(1, dt * 2.5);
      u.piv.rotation.x = u.ang;
      // la física sigue al estado (no a la animación): bajado se camina, subido es pared
      const estado = o.datos.bajado ? 'bajado' : 'subido';
      if (u.estado !== estado) {
        u.estado = estado;
        col.eliminarPorDuenio?.(u.duenio);
        const y = base(o);
        if (estado === 'bajado') {
          const c = aMundo(o, 0, 0.3 + 1.75);
          col.agregarPlataforma({ duenio: u.duenio, x: c.x, z: c.z, ang: -(o.datos.rot || 0), largo: 2.0, ancho: 3.5, alto: y + 0.36, espesor: 0.14, escalonMax: 0.6 });
        } else {
          const A = aMundo(o, -1.0, 0.3), B = aMundo(o, 1.0, 0.3);
          col.agregar({ duenio: u.duenio, seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.12, alturaMin: y - 0.1, alturaMax: y + 3.7 });
        }
      }
    }
  }

  // ---------------------------------------------------------------- espejo del faro
  const matHaz = new THREE.MeshBasicMaterial({ color: '#ffe0a8', transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const geoHaz = new THREE.ConeGeometry(Math.tan(FORTIN.espejo.angulo) * FORTIN.espejo.largo, FORTIN.espejo.largo, 18, 1, true).rotateX(-Math.PI / 2).translate(0, 0, FORTIN.espejo.largo / 2);
  let tEspejo = 0;
  const hazActivo = new Map();   // obra → rumbo del haz de este cuadro
  function actualizarEspejos(dt, noche) {
    tEspejo += dt;
    hazActivo.clear();
    if (!L.espejo.length) return;
    const prendidas = defensas.prendidas || [];
    for (const o of L.espejo) {
      const con = noche > 0.3 && prendidas.some((t) => Math.hypot(t.datos.x - o.datos.x, t.datos.z - o.datos.z) < FORTIN.espejo.luz);
      if (!o.userHaz) {
        const m = new THREE.Mesh(geoHaz, matHaz);
        m.position.y = 1.95;
        o.grupo.add(m);
        o.userHaz = m;
      }
      o.userHaz.visible = con;
      if (!con) continue;
      const rumbo = rumboEspejo(o.datos.rot || 0, tEspejo + o.datos.x * 0.1);
      o.userHaz.rotation.y = rumbo - (o.datos.rot || 0);
      hazActivo.set(o, rumbo);
    }
  }

  // ---------------------------------------------------------------- rampa de troncos
  const rodando = [];
  const geoRueda = new THREE.CylinderGeometry(0.25, 0.25, 2.2, 8).rotateZ(Math.PI / 2);
  function soltarRampa(o, n) {
    const r = o.datos.rot || 0, dx = Math.sin(r), dz = Math.cos(r);
    for (let i = 0; i < n; i++) {
      let t = rodando.find((x) => !x.activo);
      if (!t) {
        if (rodando.length >= 9) break;
        t = { malla: new THREE.Mesh(geoRueda, matTronco), activo: false };
        t.malla.castShadow = true;
        escena.add(t.malla);
        rodando.push(t);
      }
      const lado = (i - (n - 1) / 2) * 0.7;
      const p = aMundo(o, lado, 1.2 + i * 0.4);
      Object.assign(t, { activo: true, x: p.x, z: p.z, dx, dz, recorrido: 0, t: 0, golpeados: new Set(), rot: r });
      t.malla.visible = true;
    }
    sonido.golpeRuido?.({ dur: 1.2, frec: 120, tipo: 'lowpass', vol: 0.6, destino: sonido.fuente?.(o.datos, 1.2) });
  }
  // El tronco va de costado: se prueba el centro y las dos puntas, contra obras y contra
  // lo del mundo (árboles, piedras).
  function chocaTronco(t, x, z, y) {
    for (const s of [0, -1.1, 1.1]) {
      const px = x + t.dz * s, pz = z - t.dx * s;
      if (api.obraEnPunto?.(px, T.altura(px, pz) + 0.3, pz)) return true;
      for (const c of col.cercanos(px, pz)) {
        if (c.duenio || c.despejado || c.alturaMin > y + 0.6 || (c.alturaMax !== undefined && c.alturaMax < y + 0.1)) continue;   // (3.6.2: lo despejado no está)
        const d = c.seg ? distSeg(px, pz, c) : Math.hypot(px - c.x, pz - c.z);
        if (d < (c.r || 0) + 0.25) return true;
      }
    }
    return false;
  }
  function distSeg(x, z, c) {
    const vx = c.bx - c.ax, vz = c.bz - c.az, l2 = vx * vx + vz * vz || 1;
    const k = Math.max(0, Math.min(1, ((x - c.ax) * vx + (z - c.az) * vz) / l2));
    return Math.hypot(x - (c.ax + vx * k), z - (c.az + vz * k));
  }
  function actualizarRodando(dt) {
    for (const t of rodando) {
      if (!t.activo) continue;
      const paso = FORTIN.rampa.vel * dt;
      const nx = t.x + t.dx * paso, nz = t.z + t.dz * paso;
      const y = T.altura(nx, nz);
      if (chocaTronco(t, nx, nz, y) || T.agua(nx, nz) || t.recorrido > FORTIN.rampa.largo) {
        efectos.astillas({ x: t.x, y: T.altura(t.x, t.z) + 0.3, z: t.z }, 5);
        t.activo = false; t.malla.visible = false; continue;
      }
      t.x = nx; t.z = nz; t.recorrido += paso;
      t.malla.position.set(t.x, y + 0.25, t.z);
      t.malla.rotation.set(t.recorrido / 0.25, t.rot, 0, 'YXZ');
      for (const a of api.aliens) {
        if (!vivo(a) || !enTierra(a, T) || t.golpeados.has(a)) continue;
        const q = a.m.g.position;
        // el tronco es largo: se mide contra la línea del tronco, no contra el centro
        const lx = (q.x - t.x) * t.dz - (q.z - t.z) * t.dx, lz = (q.x - t.x) * t.dx + (q.z - t.z) * t.dz;
        if (Math.abs(lx) > 1.1 + a.def.radio || Math.abs(lz) > FORTIN.rampa.radio) continue;
        t.golpeados.add(a);
        api.herirAlien(a, FORTIN.rampa.dano * (a.def.jefe ? 0.4 : 1), { x: t.x - t.dx, z: t.z - t.dz }, 'trampa');
        if (!a.def.pesado) { a.enredadoT = Math.max(a.enredadoT || 0, FORTIN.rampa.derriba); q.x += t.dx * 1.2; q.z += t.dz * 1.2; }
      }
    }
  }
  function actualizarRampas() {
    for (const o of L.rampa) {
      // los troncos cargados se ven arriba de la rampa
      const n = Math.max(0, Math.min(FORTIN.rampa.troncos, o.datos.troncos || 0));
      if (!o.userCarga) {
        o.userCarga = [];
        for (let i = 0; i < FORTIN.rampa.troncos; i++) {
          const m = new THREE.Mesh(geoRueda, matTronco);
          m.position.set(0, 0.62 + i * 0.05, 0.55 - i * 0.5);
          o.grupo.add(m);
          o.userCarga.push(m);
        }
      }
      o.userCarga.forEach((m, i) => { m.visible = i < n; });
    }
  }

  // ---------------------------------------------------------------- cada invasor
  const salida = { vel: 1, quieto: false, sinAtaque: false, rumbo: null };
  function estadoAlien(a, dt, js) {
    salida.vel = 1; salida.quieto = false; salida.sinAtaque = false; salida.rumbo = null;
    const p = a.m.g.position;
    // colgado del lazo: indefenso
    if (a.colgadoT > 0) {
      a.colgadoT -= dt;
      p.y = T.altura(p.x, p.z) + 1.3 * Math.min(1, (5 - a.colgadoT) * 4);
      a.m.g.rotation.z = Math.sin(a.fase * 3) * 0.3;
      if (a.colgadoT <= 0) { p.y = T.altura(p.x, p.z); a.m.g.rotation.z = 0; }
      salida.quieto = true;
      return salida;
    }
    for (const o of L.lazo) {
      if (!o.datos.armada || Math.hypot(o.datos.x - p.x, o.datos.z - p.z) > FORTIN.lazo.radio) continue;
      o.datos.armada = false;
      if (a.def.pesado || a.def.jefe) {
        // el grande lo arranca
        efectos.astillas({ x: o.datos.x, y: base(o) + 1, z: o.datos.z }, 6);
        break;
      }
      a.colgadoT = FORTIN.lazo.colgado;
      sonido.golpeRuido?.({ dur: 0.3, frec: 900, q: 2, vol: 0.3, destino: sonido.fuente?.(p, 1) });
      salida.quieto = true;
      return salida;
    }
    for (const o of L.abrojos) {
      if (Math.hypot(o.datos.x - p.x, o.datos.z - p.z) > FORTIN.abrojos.radio) continue;
      salida.vel *= FORTIN.abrojos.freno;
      api.herirAlien(a, FORTIN.abrojos.dps * dt, null, 'trampa');
      o.datos.vida = (o.datos.vida ?? o.plano.vida) - FORTIN.abrojos.desgaste * dt;
      if (o.datos.vida <= 0 && !gastados.includes(o)) gastados.push(o);
      break;
    }
    const cerco = cercoTocando(p);
    if (cerco) {
      a.tCerco = (a.tCerco || 0) - dt;
      if (a.tCerco <= 0) {
        a.tCerco = FORTIN.cercoCristal.cada;
        api.herirAlien(a, FORTIN.cercoCristal.dano, cerco.datos, 'trampa');
        efectos.chispas({ x: p.x, y: p.y + 0.8, z: p.z }, 6);
        sonido.golpeRuido?.({ dur: 0.12, frec: 3200, q: 3, vol: 0.12, destino: sonido.fuente?.(p, 1) });
      }
      salida.vel *= FORTIN.cercoCristal.freno;
    }
    // el espejo encandila: van más lento y los que tiran no pueden apuntar
    for (const [o, rumbo] of hazActivo) {
      if (!enElHaz(o.datos, rumbo, p)) continue;
      salida.vel *= FORTIN.espejo.lento;
      if (a.def.aDistancia) salida.sinAtaque = true;
      a.encandilado = 0.3;
      break;
    }
    a.encandilado = Math.max(0, (a.encandilado || 0) - dt);
    if (a.def.jefe) return salida;
    const dj = Math.hypot(js.pos.x - p.x, js.pos.z - p.z);
    // el señuelo: si estás lejos, van por él
    if (dj > FORTIN.senuelo.jugadorCerca && a.estado === 'avanzar') {
      let s = null, d0 = FORTIN.senuelo.atrae;
      for (const o of L.senuelo) { const d = Math.hypot(o.datos.x - p.x, o.datos.z - p.z); if (d < d0) { d0 = d; s = o; } }
      if (s) {
        if (d0 < FORTIN.senuelo.llega) { a.estado = 'romper'; a.obra = s; a.cd = Math.min(a.cd, 0.4); }
        else { salida.rumbo = Math.atan2(s.datos.x - p.x, s.datos.z - p.z); return salida; }
      }
    }
    // el embudo: los que llegan por delante van a la garganta
    if (dj > 6) {
      for (const o of L.embudo) {
        const { lx, lz } = aLocal(o, p.x, p.z);
        const d = destinoEmbudo(lx, lz);
        if (!d || lz < -0.3) continue;
        const w = aMundo(o, d.lx, d.lz);
        salida.rumbo = Math.atan2(w.x - p.x, w.z - p.z);
        break;
      }
    }
    return salida;
  }
  // Colgado del lazo recibe más.
  const multiplicadorDano = (a) => (a.colgadoT > 0 ? FORTIN.lazo.danoExtra : 1);
  const revelado = (a) => (a.encandilado || 0) > 0;

  // ---------------------------------------------------------------- tejado de lajas
  const bajoTejado = (pos) => L.tejado.some((o) => {
    const { lx, lz } = aLocal(o, pos.x, pos.z);
    return Math.abs(lx) <= 1.6 && Math.abs(lz) <= 1.6 && (pos.y ?? base(o)) < base(o) + 2.6;
  });
  const antorchaProtegida = (o) => bajoTejado({ x: o.datos.x, z: o.datos.z, y: o.datos.y });

  // ---------------------------------------------------------------- puesto, armero
  function puestoTirador() {
    if (!L.puesto.length) return null;
    const c = api.centroBase();
    let mejor = null, d0 = Infinity;
    for (const o of L.puesto) { const d = Math.hypot(o.datos.x - c.x, o.datos.z - c.z); if (d < d0) { d0 = d; mejor = o; } }
    const p = aMundo(mejor, 0, 0.1);
    return { x: p.x, z: p.z, rot: mejor.datos.rot || 0 };
  }
  const cercaDeArmero = (pos, radio = 5.2) => L.armero.some((o) => Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z) < radio);

  // ---------------------------------------------------------------- la tecla E
  // Lo más cercano con algo para hacer. Devuelve { o, tipo } o null.
  function interaccionCerca(pos, noche, dPuerta = Infinity) {
    let mejor = null, d0 = Math.min(2.8, dPuerta);
    const probar = (o, tipo, radio = 2.8) => {
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z) - (o.plano.radio || 1) * 0.35;
      if (d < d0 && d < radio && Math.abs((pos.y ?? 0) - base(o)) < 3.2) { d0 = d; mejor = { o, tipo }; }
    };
    for (const o of conResina) if (avisoResina(o.datos, { noche })) probar(o, 'resina');
    for (const o of L.catapulta) if ((o.datos.piedras || 0) < FORTIN.catapulta.piedras) probar(o, 'catapulta');
    for (const o of L.troncos) if (!o.datos.armada) probar(o, 'troncos');
    for (const o of L.puente) probar(o, 'puente');
    for (const o of L.lazo) if (!o.datos.armada) probar(o, 'lazo');
    if (!noche) for (const o of L.abrojos) probar(o, 'abrojos', 3);
    if (!noche && invierno() > 0.5) for (const o of paredes) if (HELABLES.includes(o.plano.id) && !o.datos.helada) probar(o, 'hielo');
    for (const o of L.rampa) probar(o, 'rampa');
    if (L.armero.length && recargaArmero(api.D(), api.cosas(), (k) => api.cuanto(k)).algo) for (const o of L.armero) probar(o, 'armero');
    return mejor;
  }
  function avisoCerca(pos, noche, dPuerta) {
    const i = interaccionCerca(pos, noche, dPuerta);
    if (!i) return null;
    const o = i.o;
    switch (i.tipo) {
      case 'resina': return avisoResina(o.datos, { noche });
      case 'catapulta': return `Cargar piedras en la catapulta (${o.datos.piedras || 0}/${FORTIN.catapulta.piedras})`;
      case 'troncos': return 'Volver a colgar el tronco';
      case 'puente': return o.datos.bajado ? 'Subir el puente' : 'Bajar el puente';
      case 'lazo': return 'Volver a armar el lazo';
      case 'abrojos': return 'Juntar los abrojos';
      case 'hielo': return 'Echar agua sobre la pirca (se hiela)';
      case 'rampa': return avisoRampa(o.datos);
      case 'armero': return 'Rehacer la munición en el armero';
      default: return null;
    }
  }
  function usarCerca(pos, noche, dPuerta) {
    const i = interaccionCerca(pos, noche, dPuerta);
    if (!i) return false;
    const o = i.o, cuanto = (k) => api.cuanto(k);
    switch (i.tipo) {
      case 'resina': {
        const r = usarResina(o.datos, { noche, troncos: cuanto('tronco') });
        if (r.accion === 'cargar') { api.gastar('tronco', r.troncos); api.nota('Resina cargada', `Dos calderos para esta noche en ${o.plano.nombre.toLowerCase()}`); }
        else if (r.accion === 'sinLena') api.nota('Falta un tronco', 'Para calentar la resina');
        else if (r.accion === 'volcar') volcarResina(o, r.quedan);
        break;
      }
      case 'catapulta': {
        const falta = FORTIN.catapulta.piedras - (o.datos.piedras || 0), hay = cuanto('piedra');
        if (hay <= 0) { api.nota('No tenés piedras', 'Picá un pedrero con el hacha (H)'); break; }
        const pone = Math.min(falta, hay);
        api.gastar('piedra', pone);
        o.datos.piedras = (o.datos.piedras || 0) + pone;
        api.nota('Cargaste la catapulta', `${o.datos.piedras} piedras`);
        break;
      }
      case 'troncos': o.datos.armada = true; api.nota('El tronco quedó colgado', 'Se suelta cuando pasa uno por abajo'); break;
      case 'lazo': o.datos.armada = true; api.nota('El lazo quedó armado', 'El primero que lo pise queda colgado'); break;
      case 'puente':
        o.datos.bajado = !o.datos.bajado;
        sonido.golpeRuido?.({ dur: 1.4, frec: 300, q: 0.8, tipo: 'lowpass', vol: 0.35, destino: sonido.fuente?.(o.datos, 1), buffer: sonido.ruido });
        api.nota(o.datos.bajado ? 'Bajaste el puente' : 'Subiste el puente', o.datos.bajado ? 'Se puede cruzar por arriba' : 'Ahora es una pared: tienen que romperlo');
        break;
      case 'abrojos': {
        // 3.5.1: se devuelve lo que queda de ellos: gastados casi enteros se juntaban y
        // devolvían todo, y se volvían a regar gratis cada noche
        const max = o.plano.vida || 1, vida = Number.isFinite(o.datos.vida) ? o.datos.vida : max;
        const k = Math.max(0, Math.min(1, vida / max));
        for (const [m, n] of Object.entries(o.plano.etapas[0]?.pide || o.plano.pide || {})) { const q = Math.round(n * k); if (q > 0) api.sumarMaterial(m, q); }
        api.destruirObra(o, true);
        api.nota('Juntaste los abrojos', k > 0.75 ? 'Te devolvieron lo que costaron' : 'Estaban gastados: te devolvieron lo que quedaba');
        break;
      }
      case 'hielo':
        o.datos.helada = true;
        api.nota('La pirca quedó helada', 'Aguanta más y no se puede trepar mientras siga el invierno');
        break;
      case 'rampa': {
        const r = usarRampa(o.datos, { troncos: cuanto('tronco') });
        if (r.accion === 'cargar') { api.gastar('tronco', r.pone); api.nota(r.lista ? 'La rampa está cargada' : 'Cargaste troncos', r.lista ? 'E otra vez tira de la palanca' : avisoRampa(o.datos)); }
        else if (r.accion === 'sinTroncos') api.nota('No tenés troncos', `Faltan ${r.faltan}`);
        else if (r.accion === 'soltar') { soltarRampa(o, r.troncos); api.nota('¡Soltaste los troncos!', 'Van cuesta abajo'); }
        break;
      }
      case 'armero': {
        const d = api.D(), cosas = api.cosas();
        const r = recargaArmero(d, cosas, cuanto);
        if (!r.algo) { api.nota('El armero no puede rehacer nada', 'Todo lleno, o falta tabla y piedra'); break; }
        for (const [k, n] of Object.entries(r.gasto)) api.gastar(k, n);
        for (const [k, n] of Object.entries(r.hecho)) d[k] = (d[k] || 0) + n;
        api.nota('Rehiciste la munición', Object.entries(r.hecho).map(([k, n]) => `+${n} ${k}`).join(' · '));
        api.alFabricar?.();
        break;
      }
      default: return false;
    }
    api.alGuardarObras?.();
    return true;
  }
  function volcarResina(o, quedan) {
    const js = api.jugador().estado;
    const c = { x: o.datos.x, y: base(o) + 1, z: o.datos.z };
    efectos.fuego(c, 1.5); efectos.polvo(c, 8, '#3a2a1a');
    sonido.golpeRuido?.({ dur: 1.0, frec: 500, q: 0.6, vol: 0.35, destino: sonido.fuente?.(c, 1), buffer: sonido.ruido });
    let n = 0;
    for (const a of api.aliens) {
      if (!vivo(a) || !enTierra(a, T)) continue;
      const q = a.m.g.position;
      if (Math.hypot(q.x - c.x, q.z - c.z) > FORTIN.resina.radio) continue;
      if (Math.hypot(q.x - js.pos.x, q.z - js.pos.z) < 1) continue;
      api.herirAlien(a, FORTIN.resina.dano, c, 'jugador', 'fuego');   // 3.0: la resina hirviendo cuenta como fuego
      a.fuegoT = QUEMA.dura;
      n++;
    }
    api.nota('¡Resina hirviendo!', n ? `Le cayó a ${n} ${n === 1 ? 'duende' : 'duendes'} · quedan ${quedan}` : `No había nadie abajo · quedan ${quedan}`);
  }

  // ---------------------------------------------------------------- por cuadro
  let gastados = [];
  function actualizar(dt, js, noche) {
    acum += dt;
    if (acum > 1) { acum = 0; refrescar(); actualizarHielo(); actualizarRampas(); }
    actualizarCatapultas(dt);
    actualizarTroncos(dt);
    actualizarPuentes(dt);
    actualizarEspejos(dt, noche);
    actualizarRodando(dt);
    if (gastados.length) {
      for (const o of gastados) {
        api.destruirObra(o, true);
        api.nota('Los abrojos se gastaron', 'Hay que volver a regarlos (O → Defensa)');
      }
      gastados = [];
      refrescar();
    }
  }
  function limpiar() { for (const t of rodando) { t.activo = false; t.malla.visible = false; } }

  return {
    refrescar, actualizar, limpiar, estadoAlien, multiplicadorDano, revelado,
    factorDanoObra, impideSalto, frenaExcavador, pasaTiro, debajo, sinCuerpo, obraAbierta, distanciaASegmentos,
    bajoTejado, antorchaProtegida, puestoTirador, cercaDeArmero, alEmpezarNoche, alAmanecer,
    usarCerca, avisoCerca,
    get listas() { return L; },
    get rodando() { return rodando.filter((t) => t.activo).length; },
  };
}
