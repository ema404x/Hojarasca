// 3.0: los puestos de avanzada en el mundo: las mallas, los guardias dormidos, los golpes
// (entran como blancos por el mismo camino que las cámaras del nido), la E y lo que pasa
// al amanecer y al caer la noche. Las reglas están en desafio-puestos.js.
import * as THREE from 'three';
import { PUESTOS, ESTRUCTURAS, puestosNuevos, enPie, activos, tocaPuesto, lugarDelPuesto, puestoNuevo, crecerPuestos, queMandan, sitioDelPuesto, guardiasDe, danarEstructura, premioPuesto, golpeDelPuesto, golpesDeLaNoche, recortarOleada, usarEstructura, avisoEstructura } from './desafio-puestos.js';
import { esHoraDeAtaque } from './desafio-reglas.js';
import { siguenLasNoches } from './desafio-nido.js';
import { azarDe } from './semilla.js';
import { LIMITE } from './config.js';
import { mapaDePartida } from './desafio-mapa.js';
// 3.8.0: los puestos son madrigueras de duendes entre las raíces (duendes-modelo.js)
import { mallaMadriguera } from './duendes-modelo.js';
import { registrarHalos } from './desafio-duendes.js';

const NOMBRES = { cristal: 'semillas doradas', piedra: 'piedras', tabla: 'tablas' };

export function crearPuestosMundo(T, escena, efectos, sonido, api) {
  const D = () => {
    const d = api.D();
    if (!d.puestos || typeof d.puestos !== 'object' || !Array.isArray(d.puestos.lista)) d.puestos = puestosNuevos();
    return d.puestos;
  };
  const lado = (p) => api.rumboTexto(api.centroBase(), p).replace(/^al /, 'del ');

  // ---------------- mallas (una por puesto, se arman la primera vez que hacen falta)
  // 3.8.0: las piezas son las de la madriguera (duendes-modelo.js); acá queda la luz que sube de la aguja
  const matHaz = new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const geoHaz = new THREE.CylinderGeometry(0.3, 0.6, 70, 8, 1, true);
  const mallas = new Map();   // id → { g, partes: [Object3D por estructura], haz }

  // 3.8.0: la aguja es el tocón hueco de la madriguera (con el farol de hongo en la punta y la luz que
  // sube, para verlo de lejos), la vaina un nido de hongos y el generador el cesto de semillas doradas
  function mallaEstructura(tipo) {
    const g = new THREE.Group();
    const m = mallaMadriguera(tipo);
    m.rotation.y = tipo === 'aguja' ? 0 : (mallas.size * 1.7) % 6.28;
    g.add(m);
    registrarHalos(m);
    if (tipo === 'aguja') {
      const h = new THREE.Mesh(geoHaz, matHaz); h.position.y = ESTRUCTURAS.aguja.alto + 35; h.frustumCulled = false; g.add(h);
      g.userData.haz = h;
    }
    return g;
  }
  function mallaDe(p) {
    let m = mallas.get(p.id);
    if (!m) {
      const g = new THREE.Group();
      g.name = 'puesto-invasor';
      const suelo = mallaMadriguera('suelo'); suelo.position.y = 0.02; g.add(suelo);   // 3.8.0: tierra removida y raíces
      m = { g, partes: [] };
      escena.add(g);
      mallas.set(p.id, m);
    }
    // las estructuras que se sumaron al crecer
    while (m.partes.length < p.estructuras.length) {
      const e = p.estructuras[m.partes.length];
      const parte = mallaEstructura(e.tipo);
      m.g.add(parte);
      m.partes.push(parte);
    }
    return m;
  }
  function ubicar(p) {
    const m = mallaDe(p);
    const y0 = T.altura(p.x, p.z);
    m.g.position.set(p.x, y0 - 0.05, p.z);
    p.estructuras.forEach((e, i) => {
      const parte = m.partes[i];
      parte.position.set(e.dx, T.altura(p.x + e.dx, p.z + e.dz) - y0, e.dz);
      parte.visible = e.vida > 0;
    });
    m.g.visible = enPie(p);
  }
  function sincronizar() {
    const est = D();
    const vivos = new Set();
    for (const p of est.lista) {
      if (!enPie(p)) continue;
      vivos.add(p.id);
      ubicar(p);
    }
    for (const [id, m] of mallas) if (!vivos.has(id)) m.g.visible = false;
    // 3.5.1: los puestos que ya salieron de la lista (quedan sólo los 4 rotos más nuevos y cada
    // puesto nuevo trae otro id) se sacan de la escena: antes quedaban colgados, ocultos, uno
    // más por puesto para siempre. Geometrías y materiales son compartidos: no se tocan.
    const enLista = new Set(est.lista.map((p) => p.id));
    for (const [id, m] of mallas) if (!enLista.has(id)) { escena.remove(m.g); mallas.delete(id); }
    sucio = true;
  }

  // ---------------- blancos (lo que les pega a las estructuras)
  // Se arman de a ratos y sólo para los puestos que tenés cerca: blancos() se pide por
  // cada tramo de cada flecha en vuelo.
  let blancos = [], sucio = true, tBlancos = 0;
  const combinados = [];
  function armarBlancos(js) {
    blancos = [];
    for (const p of activos(D())) {
      if (Math.hypot(p.x - js.pos.x, p.z - js.pos.z) > 170) continue;
      const y0 = T.altura(p.x, p.z);
      p.estructuras.forEach((e, i) => {
        if (e.vida <= 0) return;
        const E = ESTRUCTURAS[e.tipo];
        const y = T.altura(p.x + e.dx, p.z + e.dz);
        blancos.push({ puesto: true, p, i, radio: E.radio, pos: new THREE.Vector3(p.x + e.dx, (Number.isFinite(y) ? y : y0) + E.alto * 0.5, p.z + e.dz) });
      });
    }
    sucio = false;
  }
  function conBlancos(base) {
    if (!blancos.length) return base;
    combinados.length = 0;
    for (const b of base) combinados.push(b);
    for (const b of blancos) combinados.push(b);
    return combinados;
  }

  // ---------------- golpes
  const flash = new Map();   // parte (Object3D) → t
  function herir(b, dano) {
    const p = b?.p;
    if (!p || !enPie(p)) return;
    const r = danarEstructura(p, b.i, dano);
    if (!r.ok) return;
    const parte = mallas.get(p.id)?.partes[b.i];
    if (parte) flash.set(parte, 1);
    if (r.blindado && Math.random() < 0.5) efectos.chispas?.(b.pos, 5);
    else efectos.sangre?.(b.pos, 4);
    sonido.golpeRuido?.({ dur: 0.18, frec: r.blindado ? 2600 : 700, q: 2, vol: 0.22, destino: sonido.fuente?.(b.pos, 1) || sonido.bus?.efectos });
    if (r.rota) romperEstructura(p, b.i, b.pos);
    if (r.destruido) destruirPuesto(p);
    else if (r.rota) api.guardar();
  }
  function romperEstructura(p, i, pos) {
    const e = p.estructuras[i];
    const parte = mallas.get(p.id)?.partes[i];
    if (parte) parte.visible = false;
    efectos.explosion?.(pos, e.tipo === 'aguja' ? 4 : 2.5);
    efectos.polvo?.(pos, 10, '#3a2f44');
    sonido.golpeRuido?.({ dur: 0.9, frec: 140, tipo: 'lowpass', vol: 0.7, destino: sonido.fuente?.(pos, 1.3) || sonido.bus?.efectos });
    sucio = true;
    if (e.tipo === 'generador' && p.estructuras.some((q) => q.vida > 0)) api.nota('Le sacaste la semilla dorada', 'Lo que queda de la madriguera ya no tiene corteza');
  }
  function destruirPuesto(p) {
    const d = api.D(), est = D();
    const premio = premioPuesto(p.nivel);
    for (const [k, n] of Object.entries(premio)) api.sumarMaterial?.(k, n);
    const g = golpeDelPuesto(p, d.oleadas, api.centroBase());
    est.golpes.push(g);
    est.rotos = (est.rotos || 0) + 1;
    p.visto = true;
    // los guardias dormidos se despiertan con el ruido
    for (const a of guardiasDe_(p.id)) if (a.estado === 'dormido') a.estado = 'avanzar';
    const partes = Object.entries(premio).map(([k, n]) => `+${n} ${NOMBRES[k] || k}`).join(', ');
    api.nota(`Rompiste la madriguera ${lado(p)}`, `${partes} · la noche que viene llegan ${g.menos} menos y más flojos`, true);
    // 3.0: el puesto era del nido; con el nido en el valle, cada uno que cae lo delata un poco
    if (d.nido && !d.nido.caido) setTimeout(() => api.pistaDeNido?.(), 2500);
    const m = mallas.get(p.id);
    if (m) m.g.visible = false;
    sucio = true;
    api.alFabricar?.();
    api.guardar();
  }

  // Un golpe con la mano (hacha, lanza, facón...): la estructura que tenés adelante.
  function golpear(js, alcance, dano) {
    if (!blancos.length) return false;
    const fx = -Math.sin(js.yaw), fz = -Math.cos(js.yaw);
    let mejor = null, d0 = 1e9;
    for (const b of blancos) {
      const dx = b.pos.x - js.pos.x, dz = b.pos.z - js.pos.z, l = Math.hypot(dx, dz) || 1;
      const dist = l - b.radio;
      if (dist > alcance || dist >= d0 || (dx * fx + dz * fz) / l < 0.45) continue;
      mejor = b; d0 = dist;
    }
    if (!mejor) return false;
    herir(mejor, dano);
    return true;
  }

  // ---------------- la E: quemar una vaina, arrancar el cristal del generador
  const quemando = new Map();   // `${id}:${i}` → segundos que faltan
  function estructuraCerca(pos) {
    let mejor = null, d0 = PUESTOS.radioUsar;
    for (const p of activos(D())) {
      if (Math.hypot(p.x - pos.x, p.z - pos.z) > 12) continue;
      p.estructuras.forEach((e, i) => {
        if (e.vida <= 0 || (e.tipo !== 'vaina' && e.tipo !== 'generador') || quemando.has(`${p.id}:${i}`)) return;
        const d = Math.hypot(p.x + e.dx - pos.x, p.z + e.dz - pos.z) - ESTRUCTURAS[e.tipo].radio * 0.5;
        if (d < d0) { d0 = d; mejor = { p, i, e }; }
      });
    }
    return mejor;
  }
  const condiciones = () => ({ ramitas: api.cuanto('ramita'), lluvia: api.clima().lluvia || 0 });
  function avisoCerca(pos) {
    const c = estructuraCerca(pos);
    return c ? avisoEstructura(c.e.tipo, condiciones()) : null;
  }
  function usarCerca(pos) {
    const c = estructuraCerca(pos);
    if (!c) return false;
    const r = usarEstructura(c.e.tipo, condiciones());
    const pos3 = { x: c.p.x + c.e.dx, y: T.altura(c.p.x + c.e.dx, c.p.z + c.e.dz) + 1, z: c.p.z + c.e.dz };
    if (r.accion === 'quemar') {
      api.gastar('ramita', 1);
      quemando.set(`${c.p.id}:${c.i}`, PUESTOS.quemar);
      efectos.fuego?.(pos3, 1.3);
    } else if (r.accion === 'arrancar') {
      api.sumarMaterial?.('cristal', 1);
      sonido.juntar?.();
      api.nota('Le arrancaste la semilla dorada', '+1 semilla dorada · la madriguera se apaga');
      herirIndice(c.p, c.i, 1e6);
    } else if (r.accion === 'mojado') api.nota('Mojada no prende', 'Rompela a golpes o con flechas');
    else if (r.accion === 'sinRamitas') api.nota('Te falta una ramita', 'Juntá ramitas bajo los árboles, o rompela a golpes');
    return true;
  }
  function herirIndice(p, i, dano) {
    const E = ESTRUCTURAS[p.estructuras[i].tipo];
    const y = T.altura(p.x + p.estructuras[i].dx, p.z + p.estructuras[i].dz);
    herir({ puesto: true, p, i, radio: E.radio, pos: new THREE.Vector3(p.x + p.estructuras[i].dx, y + E.alto * 0.5, p.z + p.estructuras[i].dz) }, dano);
  }

  // ---------------- los guardias de día
  const guardias = new Map();   // id del puesto → [{ a, contado }]
  const guardiasDe_ = (id) => (guardias.get(id) || []).map((g) => g.a).filter((a) => a.puesto === id);
  function ponerGuardias(p) {
    const lista = [];
    const tipos = guardiasDe(p);
    tipos.forEach((tipo, k) => {
      const ang = (k / Math.max(1, tipos.length)) * Math.PI * 2 + 0.7;
      const x = p.x + Math.cos(ang) * 5.5, z = p.z + Math.sin(ang) * 5.5;
      const a = api.aparecer?.(tipo, x, z);
      if (!a) return;
      a.estado = 'dormido'; a.puesto = p.id;
      a.rumbo = ang; a.m.g.rotation.y = ang;
      lista.push({ a, contado: false });
    });
    guardias.set(p.id, lista);
  }
  function revisarGuardias(p, noche, dist) {
    const lista = guardias.get(p.id);
    if (!lista) {
      if (!noche && dist < PUESTOS.radioGuardias && p.guardias > 0 && enPie(p)) ponerGuardias(p);
      return;
    }
    for (const g of lista) {
      if (g.a.puesto !== p.id) { g.contado = true; continue; }   // se recicló
      if (g.a.estado === 'morir' && !g.contado) { g.contado = true; p.guardias = Math.max(0, p.guardias - 1); }
    }
    // lejos, o de noche: los que siguen durmiendo se van (vuelven cuando vuelvas)
    if (noche || dist > 160 || !enPie(p)) {
      // 3.5.1: los que ya despertaron dejaron su puesto: se descuentan ahora. Antes, si te
      // seguían lejos y caían ahí, nadie los contaba y al volver salía la guardia entera otra
      // vez (cristales y abatidos sin fin)
      for (const g of lista) if (!g.contado && g.a.puesto === p.id && g.a.estado !== 'dormido') { g.contado = true; p.guardias = Math.max(0, p.guardias - 1); }
      for (const g of lista) if (g.a.puesto === p.id && g.a.estado === 'dormido') { g.a.estado = 'irse'; g.a.t = 0; g.a.puesto = null; }
      guardias.delete(p.id);
    }
  }

  // ---------------- el ciclo: al amanecer crecen y aparecen; al caer la noche mandan
  function alAmanecer() {
    const d = api.D(), est = D();
    if (!siguenLasNoches(d)) return;
    const noche = d.oleadas;
    const azar = azarDe(d.semilla, noche, 'puesto');
    const crecieron = crecerPuestos(est, noche, azar);
    const vistos = crecieron.filter((p) => p.visto);
    if (vistos.length) setTimeout(() => api.nota(vistos.length === 1 ? `La madriguera ${lado(vistos[0])} creció` : 'Las madrigueras crecieron', 'Nadie las tocó: ahora mandan más, y tienen más guardia'), 9000);
    est.golpes = est.golpes.filter((g) => g.noche > noche);
    if (tocaPuesto(noche, activos(est).length)) {
      const nido = d.nido && !d.nido.caido ? d.nido : null;
      const c = api.centroBase();
      const lugares = Object.values(T.lugares || {}).filter((l) => l && Number.isFinite(l.x));
      const esBueno = (x, z) => !T.agua(x, z) && (T.pendiente?.[T.indice(x, z)] ?? 0) <= 0.34
        && !lugares.some((l) => Math.hypot(l.x - x, l.z - z) < 35) && !api.obraEnPunto?.(x, T.altura(x, z) + 0.5, z);
      const hacia = nido ? Math.atan2(nido.z - c.z, nido.x - c.x) : null;
      // 3.0: con el mapa de la semilla, de sus lugares (mismo código, mismos puestos); una
      // partida sin mapa (de antes) sigue como siempre
      let sitios = null;
      try { if (d.mapa && !d.mapa.deAntes) sitios = mapaDePartida(d).puestos; } catch { sitios = null; }
      const pos = (sitios && sitioDelPuesto(sitios, { esBueno, otros: activos(est), usados: est.lista, nido, hacia, centro: c }))
        || lugarDelPuesto(c, { esBueno, azar, otros: activos(est), nido, hacia });
      if (pos) {
        const p = puestoNuevo(est.proximoId++, pos, noche, azar);
        est.lista.push(p);
        setTimeout(() => api.nota('Se ve humo verde en el bosque', `Cavaron una madriguera entre las raíces, ${api.rumboTexto(api.centroBase(), p)}. Si la rompés de día, de ese lado vienen menos (queda en el mapa cuando la veas)`, true), 6000);
      }
    }
    sincronizar();
  }
  function alEmpezarNoche() {
    const d = api.D(), est = D();
    // los guardias que duermen se van: de noche el puesto manda lo suyo
    for (const [id] of guardias) {
      const p = est.lista.find((q) => q.id === id);
      if (p) revisarGuardias(p, true, 0);
    }
    const menos = golpesDeLaNoche(est, d.oleadas);
    if (menos.length) {
      const total = menos.reduce((s, g) => s + g.menos, 0);
      setTimeout(() => api.nota('Vienen menos', `Las madrigueras que rompiste ya no mandan a nadie: ${total} menos, y más flojos`), 4000);
    }
    const azar = azarDe(d.semilla, d.oleadas, 'puesto-manda');
    let n = 0;
    const lados = [];
    for (const m of queMandan(est, azar)) {
      let k = 0;
      for (const tipo of m.tipos) {
        const x = Math.max(-LIMITE + 5, Math.min(LIMITE - 5, m.x + (azar() - 0.5) * 6)), z = Math.max(-LIMITE + 5, Math.min(LIMITE - 5, m.z + (azar() - 0.5) * 6));
        const a = api.aparecer?.(tipo, x, z);
        if (a) { n++; k++; }
      }
      if (k) lados.push(lado(m));
    }
    if (n) {
      api.sumarInvasores?.(n);
      setTimeout(() => api.nota(n === 1 ? 'Uno más, desde una madriguera' : `${n} más, desde las madrigueras`, `Salen de la madriguera ${lados.join(' y de la madriguera ')}. Rompelas de día y no vienen`, true), 2000);
    }
  }
  // Con el nido reventado no hay más noches: los puestos se secan.
  function secar() {
    const est = D();
    let n = 0;
    for (const p of activos(est)) { p.roto = true; n++; }
    if (n) { sincronizar(); api.nota('Las madrigueras se secaron', 'Sin la cueva, lo que quedaba en el bosque se deshizo'); api.guardar(); }
  }

  // ---------------- cada cuadro
  let t = 0, tVaina = 0, primero = true;
  function actualizar(dt, js) {
    if (primero) { primero = false; sincronizar(); }
    const d = api.D(), est = D();
    tVaina += dt;
    matHaz.opacity = 0.08 + Math.sin(tVaina * 1.3) * 0.03;
    for (const [parte, f] of flash) {
      const r = f - dt * 4;
      if (r <= 0) { parte.scale.setScalar(1); flash.delete(parte); continue; }
      flash.set(parte, r);
      parte.scale.setScalar(1 + r * 0.08);
    }
    // las vainas que se queman
    for (const [clave, q] of quemando) {
      const [id, i] = clave.split(':').map(Number);
      const p = est.lista.find((x) => x.id === id);
      if (!p || !enPie(p) || !(p.estructuras[i]?.vida > 0)) { quemando.delete(clave); continue; }
      const r = q - dt;
      const e = p.estructuras[i];
      if (Math.random() < dt * 8) efectos.fuego?.({ x: p.x + e.dx, y: T.altura(p.x + e.dx, p.z + e.dz) + 0.9, z: p.z + e.dz }, 0.8);
      if (r > 0) { quemando.set(clave, r); continue; }
      quemando.delete(clave);
      herirIndice(p, i, 1e6);
    }
    t -= dt;
    tBlancos -= dt;
    if (sucio || tBlancos <= 0) { tBlancos = 0.5; armarBlancos(js); }
    if (t > 0) return;
    t = 0.5;
    if (!siguenLasNoches(d)) { secar(); return; }
    const noche = esHoraDeAtaque(api.horas?.() ?? 12);
    for (const p of est.lista) {
      const dist = Math.hypot(p.x - js.pos.x, p.z - js.pos.z);
      if (enPie(p) && !p.visto && dist < PUESTOS.radioVisto) {
        p.visto = true;
        api.nota('Encontraste una madriguera de duendes', 'Rompé el hongo alto, las bolsas de esporas y la semilla dorada (que abriga lo demás). Quedó en el mapa', true);
        api.guardar();
      }
      revisarGuardias(p, noche, dist);
    }
  }

  function limpiar() { quemando.clear(); flash.clear(); }

  return {
    actualizar, alAmanecer, alEmpezarNoche, conBlancos, herir, golpear, usarCerca, avisoCerca, sincronizar, limpiar,
    // la oleada de la noche que viene, con lo que ya no mandan los rotos
    // (la noche que empieza es la siguiente a la última)
    recortar: (tipos) => recortarOleada(tipos, D(), api.D().oleadas + 1),
    // los que bajan la noche después de romper un puesto, con menos vida
    factorVida: () => (golpesDeLaNoche(D(), api.D().oleadas).length ? PUESTOS.debilitados : 1),
    // para el mapa: los que ya viste y siguen en pie
    get vistos() { return activos(D()).filter((p) => p.visto).map((p) => ({ x: p.x, z: p.z, nivel: p.nivel })); },
    get lista() { return D().lista; },
    get blancos() { return blancos; },
    guardias: (id) => guardiasDe_(id),
  };
}
