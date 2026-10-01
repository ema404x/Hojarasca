// 3.0: el asedio final en el mundo (ver `desafio-asedio.js` para las reglas).
// La nodriza asentada sobre el valle con su escudo, las agujas que la alimentan con
// la mancha de cada zona tomada, las balizas de las zonas que recuperaste, la guardia de
// cada aguja y el haz por el que se sube a la nave.
import * as THREE from 'three';
import { lam } from './vida.js';
import { LIMITE } from './config.js';
import { NOCHE_FINAL, HORA_ATAQUE, esHoraDeAtaque, dificultad } from './desafio-reglas.js';
import { azarDe } from './semilla.js';
import { ASEDIO, ZONAS_ASEDIO, defZona, asedioNuevo, asedioActivo, zonasLibres, capasEscudo, puedeAbordar, danarAncla, elegirContraataque, desgastarBaliza, cerrarNocheAsedio, tocaGuardia, guardianesDe, ganarAsedio, textoAsedio, marcasAsedio, ubicarZonas, ubicarNave } from './desafio-asedio.js';

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _c = new THREE.Color();
const ARRIBA = new THREE.Vector3(0, 1, 0);
const VERDE = '#a6ff6e', CIAN = '#7dfff0';

export function crearAsedioMundo(T, escena, efectos, sonido, api) {
  const D = () => api.D();
  const A = () => D().asedio;
  const deDia = () => !esHoraDeAtaque(api.horas?.() ?? 12);

  // ---------------------------------------------------------------- dónde va cada cosa
  const cercaDeLugar = (x, z) => Object.values(T.lugares || {}).some((l) => l && Number.isFinite(l.x) && Math.hypot(l.x - x, l.z - z) < 14);
  function esBueno(x, z) {
    if (Math.abs(x) > LIMITE - 30 || Math.abs(z) > LIMITE - 30 || T.agua(x, z)) return false;
    const k = T.indice(x, z);
    if ((T.pendiente?.[k] ?? 0) > 0.3) return false;
    // lejos de la vía (la trochita pasaría por adentro de la aguja) y fuera del sendero
    if ((T.distRiel?.[k] ?? 999) < 22 || (T.distSendero?.[k] ?? 999) < 4) return false;
    if (cercaDeLugar(x, z)) return false;
    return !api.obraEnPunto?.(x, T.altura(x, z) + 0.5, z);
  }
  // Adentro de la nave se camina sobre un piso que está justo arriba de donde se asentó, y
  // el andar del jugador mira la pendiente del terreno de abajo: tiene que ser un llano.
  function llano(x, z) {
    if (Math.abs(x) > LIMITE - 45 || Math.abs(z) > LIMITE - 45 || T.agua(x, z)) return Infinity;
    // al pie del haz se tiene que poder llegar: ni en la vía ni encima de un lugar ni de una obra
    if ((T.distRiel?.[T.indice(x, z)] ?? 999) < 12 || cercaDeLugar(x, z) || api.obraEnPunto?.(x, T.altura(x, z) + 0.5, z)) return Infinity;
    let peor = 0;
    for (const r of [0, 9, 18, 26]) {
      const n = r ? 8 : 1;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
        const gx = (T.altura(px + 1.5, pz) - T.altura(px - 1.5, pz)) / 3;
        const gz = (T.altura(px, pz + 1.5) - T.altura(px, pz - 1.5)) / 3;
        peor = Math.max(peor, Math.hypot(gx, gz));
      }
    }
    return peor > 0.35 ? Infinity : peor;
  }

  // ---------------------------------------------------------------- empezar
  let gracia = 0, llegada = 0;
  function empezar() {
    const d = D();
    if (d.asedio || d.victoria) return false;
    const c = api.centroBase();
    const azar = azarDe(d.semilla, 'asedio');
    const zonas = ubicarZonas(T.lugares, c, esBueno, azar);
    const nave = ubicarNave(c, llano, azar) || { x: Math.max(-LIMITE + 60, Math.min(LIMITE - 60, c.x * 0.4)), z: Math.max(-LIMITE + 60, Math.min(LIMITE - 60, c.z * 0.4)) };
    const vida = ASEDIO.vidaAncla * dificultad(api.claveDificultad?.()).vida;
    const a = asedioNuevo(zonas, nave, vida);
    if (!a) return false;
    d.asedio = a;
    // los núcleos se replegaron adentro: ya no hay nodriza que derribar a flechazos
    d.nodriza = null;
    gracia = ASEDIO.graciaGuardia;
    llegada = 1;
    armar();
    const js = api.jugador().estado;
    setTimeout(() => api.nota('La nodriza no se fue', `Se asentó sobre el valle, ${api.rumboTexto(js.pos, a.nave)}. Clavó ${a.zonas.length} agujas que le dan escudo`, true), 4200);
    setTimeout(() => api.nota('El asedio', 'Rompé las agujas de día (están en el mapa). De noche van a querer recuperar lo que les saques. Con tres zonas libres se abre el haz de la nave', true), 9500);
    api.guardar();
    return true;
  }

  // ---------------------------------------------------------------- mallas
  let armado = null;   // { nave, escudo, haz, zonas: [...] }
  const matChitina = lam('#2a2230'), matChitinaClara = lam('#4a3c52');
  const matCristal = new THREE.MeshBasicMaterial({ color: VERDE });
  const matMadera = lam('#6b5238'), matTela = lam('#c9523a', { side: THREE.DoubleSide });
  const geoHaz = new THREE.CylinderGeometry(0.18, 0.18, 1, 6, 1, true).translate(0, 0.5, 0);
  function mancha(radio) {
    // un disco que sigue el terreno, con el borde que se desvanece (alfa por vértice)
    const g = new THREE.RingGeometry(0.2, radio, 36, 6);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z) / radio;
      const vena = Math.abs(Math.sin(x * 0.9 + Math.sin(z * 0.5) * 2) * Math.sin(z * 0.8 + Math.sin(x * 0.4) * 1.7));
      const brillo = vena < 0.09 ? 0.7 : 0;
      _c.setRGB(0.12 + brillo * 0.3, 0.06 + brillo * 0.9, 0.16 + brillo * 0.35, THREE.SRGBColorSpace);   // pensado en sRGB, guardado lineal
      col[i * 4] = _c.r; col[i * 4 + 1] = _c.g; col[i * 4 + 2] = _c.b;
      col[i * 4 + 3] = Math.max(0, 1 - r * r) * 0.85;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 4));
    return g;
  }
  function armarZona(z) {
    const g = new THREE.Group();
    const y = T.altura(z.x, z.z);
    g.position.set(z.x, y, z.z);
    // la aguja: un espolón de quitina con cristales y un corazón que late
    const aguja = new THREE.Group();
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 1.5, 10, 7), matChitina);
    cuerpo.position.y = 5; cuerpo.castShadow = true;
    aguja.add(cuerpo);
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26;
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), matCristal);
      c.scale.set(0.5, 2.6, 0.5);
      c.position.set(Math.cos(a) * 1.2, 1.4 + (i % 2) * 0.8, Math.sin(a) * 1.2);
      c.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      aguja.add(c);
    }
    const nucleo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), new THREE.MeshBasicMaterial({ color: VERDE }));
    nucleo.position.y = 3.2;
    aguja.add(nucleo);
    // el caparazón que la cierra de noche
    const capa = new THREE.Mesh(new THREE.SphereGeometry(1.35, 12, 8), matChitinaClara);
    capa.position.y = 3.2; capa.scale.setScalar(0.01);
    aguja.add(capa);
    g.add(aguja);
    // la mancha (sigue el terreno: se arma con la altura de cada vértice)
    const geo = mancha(ASEDIO.radioZona);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, T.altura(z.x + p.getX(i), z.z + p.getZ(i)) - y + 0.09);
    geo.computeBoundingSphere();
    const suelo = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    suelo.renderOrder = 1;
    g.add(suelo);
    // esquirlas alrededor
    const esquirlas = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const a = i * 2.1 + 0.4, r = 4 + (i * 1.7) % 9;
      const x = Math.cos(a) * r, zz = Math.sin(a) * r;
      const e = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), i % 3 ? matChitina : matCristal);
      e.scale.set(0.6, 2 + (i % 3), 0.6);
      e.position.set(x, T.altura(z.x + x, z.z + zz) - y + 0.4, zz);
      e.rotation.set((i % 2 ? 1 : -1) * 0.3, a, 0.2);
      esquirlas.add(e);
    }
    g.add(esquirlas);
    // la baliza: un palo con bandera y un farol
    const baliza = new THREE.Group();
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.4, 6), matMadera);
    palo.position.y = 1.7; palo.castShadow = true;
    baliza.add(palo);
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), matTela);
    tela.position.set(0.58, 2.95, 0);
    baliza.add(tela);
    const farol = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
    farol.position.set(0, 2.3, 0.18);
    baliza.add(farol);
    baliza.visible = false;
    baliza.position.set(2.4, T.altura(z.x + 2.4, z.z) - y, 0);
    g.add(baliza);
    // el hilo de luz que sube de la aguja a la nave
    const hilo = new THREE.Mesh(geoHaz, new THREE.MeshBasicMaterial({ color: VERDE, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    hilo.frustumCulled = false;
    escena.add(hilo);
    escena.add(g);
    return { g, aguja, nucleo, capa, suelo, esquirlas, baliza, tela, farol, hilo, y, flash: 0, rota: 0,
      blanco: { asedio: true, ancla: true, i: 0, pos: new THREE.Vector3(z.x, y + 3.2, z.z), radio: 1.7 } };
  }
  function armarNave(a) {
    const m = api.crearMallaNave();
    m.g.scale.setScalar(4.2);
    // los tres núcleos quedaron adentro: se ven apagados detrás del escudo
    for (let i = 0; i < 3; i++) {
      const an = (i / 3) * Math.PI * 2;
      const n = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), new THREE.MeshBasicMaterial({ color: '#7a2a18' }));
      n.position.set(Math.cos(an) * 4.2, -1.55, Math.sin(an) * 4.2);
      m.g.add(n);
    }
    const escudo = new THREE.Mesh(new THREE.SphereGeometry(10.5, 32, 16),
      new THREE.MeshBasicMaterial({ color: CIAN, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    escudo.scale.set(1, 0.42, 1);
    m.g.add(escudo);
    m.g.position.set(a.nave.x, T.altura(a.nave.x, a.nave.z) + ASEDIO.alturaNave, a.nave.z);
    escena.add(m.g);
    return { ...m, escudo, t: 0, caida: 0, cayendo: 0, alCaer: null };
  }
  function armar() {
    const a = A();
    if (!a || armado) return;
    armado = { nave: a.ganado ? null : armarNave(a), zonas: a.zonas.map((z, i) => { const r = armarZona(z); r.blanco.i = i; return r; }) };
  }
  function desarmar() {
    if (!armado) return;
    if (armado.nave) escena.remove(armado.nave.g);
    for (const r of armado.zonas) { escena.remove(r.g); escena.remove(r.hilo); }
    armado = null;
  }

  // ---------------------------------------------------------------- blancos (mismo camino que los núcleos)
  const activos = [], mezcla = [];
  function blancos(base) {
    if (!activos.length) return base;
    mezcla.length = 0;
    for (let i = 0; i < base.length; i++) mezcla.push(base[i]);
    for (let i = 0; i < activos.length; i++) mezcla.push(activos[i]);
    return mezcla;
  }
  function herir(n, dano) {
    const a = A();
    if (!a || !armado || !n?.ancla) return;
    const r = danarAncla(a, n.i, dano, deDia());
    if (!r.ok) return;
    const vis = armado.zonas[n.i];
    vis.flash = 1;
    api.S?.golpe?.(n.pos, 'bruto', dano > 30);
    if (!r.rota) return;
    const def = defZona(r.zona);
    efectos?.explosion(n.pos, 7);
    efectos?.chispas(n.pos, 16);
    sonido.golpeRuido?.({ dur: 1.4, frec: 140, tipo: 'lowpass', vol: 0.8, destino: sonido.fuente?.(n.pos, 1.4) });
    api.sumarMaterial?.('cristal', ASEDIO.cristalesAncla);
    const capas = capasEscudo(a);
    api.nota(`Recuperaste ${def?.corto || r.zona}`, capas
      ? `La aguja cayó y el escudo de la nave perdió una capa (le quedan ${capas}). Plantaste una baliza: esta noche van a venir por ella · +${ASEDIO.cristalesAncla} cristales`
      : `Cayó la última aguja: la nave se quedó sin escudo · +${ASEDIO.cristalesAncla} cristales`, true);
    if (r.abrePaso) setTimeout(() => api.nota('¡Se abrió el haz de la nave!', 'Con tres zonas libres el escudo no alcanza a cerrar. Andá abajo de la nave de día y subí por el haz (E)', true), 3500);
    api.guardar();
  }

  // ---------------------------------------------------------------- la noche
  function alEmpezarNoche() {
    const a = A();
    if (!asedioActivo(a)) return null;
    const i = elegirContraataque(a);
    if (i === null) return null;
    const def = defZona(a.zonas[i].id);
    const js = api.jugador().estado;
    setTimeout(() => api.nota(`¡Contraatacan ${def?.corto || 'la zona'}!`, `Vienen por tu baliza, ${api.rumboTexto(js.pos, a.zonas[i])}. Si aguanta hasta el alba, la zona queda tuya`, true), 2600);
    return i;
  }
  const blancoCache = { x: 0, z: 0, radio: 2.2 };
  function blancoNoche() {
    const a = A();
    if (!asedioActivo(a) || a.contra === null || a.contra === undefined) return null;
    const z = a.zonas[a.contra];
    if (!z || z.estado !== 'recuperada' || !(z.baliza > 0)) return null;
    blancoCache.x = z.x + 2.4; blancoCache.z = z.z;
    return blancoCache;
  }
  function desgastar(n, dt, mult) {
    const a = A();
    if (!blancoNoche()) return false;
    const i = a.contra;
    const r = desgastarBaliza(a, n, dt, mult);
    if (r.cayo) {
      const def = defZona(r.zona), z = a.zonas[i];
      _v.set(z.x + 2.4, T.altura(z.x + 2.4, z.z) + 1.4, z.z);
      efectos?.polvo(_v, 18);
      api.S?.derrumbe?.(_v);
      api.nota(`Rompieron la baliza de ${def?.corto || 'la zona'}`, 'La aguja volvió a crecer. De día se puede volver a romper', true);
      api.guardar();
    }
    return true;
  }
  // Al terminar la noche (terminarOleada). Si fue la noche final y la nodriza sigue en el
  // aire, en vez de irse se asienta: empieza el asedio.
  function alTerminarNoche(sobrevivida) {
    const d = D();
    if (!d.asedio) {
      if (!d.victoria && d.nodriza && d.oleadas >= NOCHE_FINAL) return empezar();
      return false;
    }
    const a = d.asedio;
    if (!asedioActivo(a)) return false;
    const r = cerrarNocheAsedio(a, sobrevivida);
    if (r.asegurada) {
      const def = defZona(r.asegurada);
      setTimeout(() => api.nota(`${def?.nombre || 'La zona'}: asegurada`, 'La baliza aguantó toda la noche. Esa zona ya no la recuperan', true), 5200);
    }
    return false;
  }

  // ---------------------------------------------------------------- abordar (E)
  const sitioHaz = () => { const a = A(); return a ? { x: a.nave.x, z: a.nave.z, y: T.altura(a.nave.x, a.nave.z) } : null; };
  // 3.0: por qué no se puede subir ahora (null: se puede). La tecla E y el aviso usan esto
  // mismo, en el mismo orden: al pie del haz, el aviso siempre dice qué pasa.
  function motivoHaz(pos = null) {
    const a = A();
    if (!asedioActivo(a) || armado?.nave?.cayendo > 0) return { cerrado: true, aviso: null };
    if (!puedeAbordar(a)) {
      const faltan = ASEDIO.zonasParaAbordar - zonasLibres(a);
      return { aviso: `El escudo no deja subir: ${faltan === 1 ? 'falta liberar una zona' : `faltan liberar ${faltan} zonas`}`,
        titulo: 'El escudo de la nave está cerrado', texto: `Rompé ${faltan === 1 ? 'una aguja más' : `${faltan} agujas más`} de día (el mapa las marca) y se abre el haz` };
    }
    if (!deDia()) return { aviso: 'De noche el haz está apagado', titulo: 'El haz está apagado', texto: 'Se prende de nuevo con la luz del día' };
    // adentro el reloj queda quieto: en la hora antes del ataque el haz ya se apaga, así la
    // noche nunca arranca con vos arriba
    if ((api.horas?.() ?? 12) >= HORA_ATAQUE - 1) return { aviso: 'Está por caer la noche: el haz se apagó hasta mañana', titulo: 'El haz se apagó', texto: 'En la hora antes del ataque no se puede subir. Preparate para la noche' };
    if (api.hayAtaque?.()) {
      const js = pos || api.jugador().estado.pos;
      let n = 0, cerca = null, d0 = Infinity;
      for (const al of api.aliens) {
        if (al.enNave || al.estado === 'morir' || al.estado === 'irse' || al.estado === 'dormido') continue;
        n++;
        const d = Math.hypot(al.m.g.position.x - js.x, al.m.g.position.z - js.z);
        if (d < d0) { d0 = d; cerca = al.m.g.position; }
      }
      const donde = cerca ? `, el más cerca ${api.rumboTexto(js, cerca)}` : '';
      return { aviso: `Hay invasores cerca: despejá la zona para subir (${n || 'alguno'}${donde})`,
        titulo: 'Hay invasores cerca', texto: `El haz no sube con ${n > 1 ? `${n} invasores` : n === 1 ? 'un invasor' : 'invasores'} dando vueltas${donde}. Despejá la zona` };
    }
    return null;
  }
  function hazAbierto() { return !motivoHaz(); }
  function enElHaz(pos) {
    const s = sitioHaz();
    return !!s && Math.hypot(pos.x - s.x, pos.z - s.z) < 5 && Math.abs(pos.y - s.y) < 3;
  }
  // E al pie del haz: sube, o dice por qué no (lo mismo que el aviso)
  let avisoDicho = 0;
  function usarCerca(pos) {
    if (!enElHaz(pos)) return false;
    const m = motivoHaz(pos);
    if (!m) { api.abordar?.(); return true; }
    if (!m.aviso) return false;
    if (performance.now() - avisoDicho > 1500) { avisoDicho = performance.now(); api.nota(m.titulo, m.texto); }
    return true;
  }
  function avisoCerca(pos) {
    if (!enElHaz(pos)) return null;
    const m = motivoHaz(pos);
    return m ? m.aviso : 'Subir a la nave por el haz';
  }

  // ---------------------------------------------------------------- el final: la nave cae
  function derribar(alCaer) {
    const a = A();
    if (!a) { alCaer?.(); return; }
    armar();
    ganarAsedio(a);
    for (const al of api.aliens) if (al.guardiaAsedio && al.estado !== 'morir') { al.estado = 'irse'; al.t = 0; }
    if (!armado?.nave) { alCaer?.(); return; }
    armado.nave.cayendo = 0.001; armado.nave.caida = 0; armado.nave.alCaer = alCaer;
    armado.nave.escudo.visible = false;
    for (const r of armado.zonas) {
      if (r.aguja.visible) { _v.set(r.g.position.x, r.y + 3, r.g.position.z); efectos?.explosion(_v, 5); }
      r.aguja.visible = false; r.hilo.visible = false;
    }
    api.guardar();
  }
  function actualizarCaida(n, dt) {
    n.cayendo += dt;
    const t = n.cayendo, a = A();
    const y0 = T.altura(a.nave.x, a.nave.z) + ASEDIO.alturaNave;
    const y = y0 - t * t * 2.4;
    n.g.position.y = y;
    n.g.rotation.z = Math.min(0.9, t * 0.2);
    n.g.rotation.x = Math.min(0.4, t * 0.09);
    n.caida -= dt;
    if (n.caida <= 0) { n.caida = 0.3; _v.set(a.nave.x + (Math.random() - 0.5) * 30, y, a.nave.z + (Math.random() - 0.5) * 30); efectos?.explosion(_v, 5); }
    if (y > T.altura(a.nave.x, a.nave.z) + 2) return;
    _v.set(a.nave.x, T.altura(a.nave.x, a.nave.z) + 2, a.nave.z);
    efectos?.explosion(_v, 16);
    sonido.golpeRuido?.({ dur: 3.2, frec: 70, tipo: 'lowpass', vol: 1, destino: sonido.bus?.efectos });
    api.vibrar?.('derrumbe', 1);
    n.g.visible = false;
    n.cayendo = 0;
    const cb = n.alCaer; n.alCaer = null;
    cb?.();
  }

  // ---------------------------------------------------------------- por cuadro
  let tHud = 0;
  function actualizar(dt, js) {
    const a = A();
    if (!a) { if (armado) desarmar(); activos.length = 0; return; }
    armar();
    const t = performance.now() / 1000;
    const dia = deDia(), vivo = asedioActivo(a);
    gracia = Math.max(0, gracia - dt);
    // la nave
    const n = armado.nave;
    if (n) {
      if (n.cayendo > 0) actualizarCaida(n, dt);
      else if (!vivo) n.g.visible = false;
      else {
        n.t += dt;
        llegada = Math.max(0, llegada - dt / 12);
        const suelo = T.altura(a.nave.x, a.nave.z);
        n.g.visible = true;
        n.g.position.set(a.nave.x, suelo + ASEDIO.alturaNave + llegada * llegada * 300 + Math.sin(n.t * 0.5) * 0.9, a.nave.z);
        n.g.rotation.y += dt * 0.05;
        const capas = capasEscudo(a);
        n.escudo.visible = capas > 0;
        n.escudo.material.opacity = (0.06 + capas * 0.05) * (0.85 + Math.sin(t * 1.7) * 0.15) * (capas === 1 ? (Math.sin(t * 13) > 0 ? 1 : 0.4) : 1);
        // el haz para subir
        const abierto = hazAbierto();
        n.haz.visible = abierto;
        if (abierto) {
          const largo = Math.max(1, n.g.position.y - suelo) / n.g.scale.y;
          n.haz.scale.set(0.55, largo, 0.55);
          n.haz.position.y = -largo / 2;
          n.haz.material.opacity = 0.14 + Math.sin(t * 5) * 0.04;
        }
        for (let i = 0; i < n.luces.length; i++) n.luces[i].material.color.setHex(((i + Math.floor(t * 3)) % 4) ? 0x3f7a2c : 0xa6ff6e);
      }
    }
    // las zonas
    activos.length = 0;
    const cerca = Math.hypot(js.pos.x - a.nave.x, js.pos.z - a.nave.z) < 600;
    a.zonas.forEach((z, i) => {
      const r = armado.zonas[i];
      const tomada = z.estado === 'tomada' && vivo;
      const dz = Math.hypot(js.pos.x - z.x, js.pos.z - z.z);
      // la aguja rota se va hundiendo; la que vuelve a crecer sube
      r.rota = tomada ? Math.max(0, r.rota - dt * 0.25) : Math.min(1, r.rota + dt * 0.6);
      r.aguja.visible = r.rota < 0.999;
      r.aguja.position.y = -r.rota * 11;
      r.suelo.visible = r.aguja.visible && dz < 240;
      r.suelo.material.opacity = 1 - r.rota;
      r.esquirlas.visible = r.aguja.visible && dz < 160;
      r.baliza.visible = z.estado !== 'tomada';
      if (r.baliza.visible) {
        r.tela.rotation.y = Math.sin(t * 2.2 + i) * 0.35;
        const enPeligro = a.contra === i && z.estado === 'recuperada';
        r.farol.material.color.set(enPeligro && Math.sin(t * 8) > 0 ? '#ff5a3a' : '#ffd27a');
      }
      // de noche la aguja se cierra
      const quiere = dia ? 0.01 : 1;
      const s = r.capa.scale.x + (quiere - r.capa.scale.x) * Math.min(1, dt * 1.5);
      r.capa.scale.setScalar(Math.max(0.01, s));
      r.flash = Math.max(0, r.flash - dt * 4);
      const pulso = 0.85 + Math.sin(t * 2.4 + i) * 0.15 + r.flash;
      r.nucleo.scale.setScalar(pulso);
      r.nucleo.material.color.setRGB(0.55 + r.flash * 0.45, 1, 0.43 + r.flash * 0.5);
      // el hilo hasta la nave
      r.hilo.visible = tomada && !!n && n.g.visible && cerca;
      if (r.hilo.visible) {
        _v.set(z.x, r.y + 9.5 - r.rota * 11, z.z);
        _w.set(n.g.position.x, n.g.position.y - 6, n.g.position.z).sub(_v);
        const largo = _w.length();
        r.hilo.position.copy(_v);
        _q.setFromUnitVectors(ARRIBA, _w.normalize());
        r.hilo.quaternion.copy(_q);
        r.hilo.scale.set(1, largo, 1);
        r.hilo.material.opacity = 0.22 + Math.sin(t * 3 + i * 1.3) * 0.08;
      }
      if (!tomada) return;
      if (dia && r.rota < 0.05) { r.blanco.i = i; activos.push(r.blanco); }
      // la guardia de la aguja: sale una vez por día, cuando te acercás
      if (dia && gracia <= 0 && tocaGuardia(a, i, api.dia?.() ?? 0, dz)) {
        z.guardia = api.dia?.() ?? 0;
        let n2 = 0;
        for (const tipo of guardianesDe(z.id, zonasLibres(a))) {
          const an = Math.random() * Math.PI * 2, rr = 4 + Math.random() * 5;
          const al = api.invocar?.(tipo, z.x + Math.cos(an) * rr, z.z + Math.sin(an) * rr);
          if (al) { al.guardiaAsedio = true; n2++; }
        }
        if (n2) {
          api.S?.chillido?.({ x: z.x, y: r.y + 2, z: z.z }, 'bruto');
          api.nota('Te salen al cruce', `${n2} ${n2 === 1 ? 'invasor cuida' : 'invasores cuidan'} la aguja de ${defZona(z.id)?.corto || 'la zona'}`);
        }
      }
    });
    tHud += dt;
  }

  function limpiar() { /* las mallas quedan: la partida sigue */ }

  return {
    empezar, alTerminarNoche, alEmpezarNoche, blancoNoche, desgastar, blancos, herir, actualizar, derribar,
    usarCerca, avisoCerca, sitioHaz, hazAbierto, motivoHaz, limpiar,
    get activo() { return asedioActivo(A()); },
    get estado() { return A() || null; },
    textoHud: () => textoAsedio(A()),
    marcas: () => marcasAsedio(A()),
    // para las pruebas
    get armado() { return armado; },
    zonasIds: () => ZONAS_ASEDIO.map((z) => z.id),
  };
}
