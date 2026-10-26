// 3.0: el asedio final en el mundo (ver `desafio-asedio.js` para las reglas).
// 3.8.0: la nodriza asentada es el Coihue Viejo plantado sobre el valle; las agujas, raíces suyas que brotaron
// en cada zona; el haz, la puerta grande de su pie (ver desafio-coihue-formas.js). Las reglas no cambian.
// La nodriza asentada sobre el valle con su escudo, las agujas que la alimentan con
// la mancha de cada zona tomada, las balizas de las zonas que recuperaste, la guardia de
// cada aguja y el haz por el que se sube a la nave.
import * as THREE from 'three';
import { lam } from './vida.js';
import { LIMITE } from './config.js';
import { NOCHE_FINAL, HORA_ATAQUE, esHoraDeAtaque, dificultad } from './desafio-reglas.js';
import { azarDe } from './semilla.js';
import { armarCoihueViejo, animarCoihue, calzarPatasCoihue, piesCoihue, geoAmbar, herramientasCoihue, COIHUE } from './desafio-coihue-formas.js';
import { registrarLuz } from './luces.js';
import { ASEDIO, ZONAS_ASEDIO, defZona, asedioNuevo, asedioActivo, zonasLibres, capasEscudo, puedeAbordar, danarAncla, elegirContraataque, desgastarBaliza, cerrarNocheAsedio, tocaGuardia, guardianesDe, ganarAsedio, textoAsedio, marcasAsedio, ubicarZonas, ubicarNave } from './desafio-asedio.js';

// 4.10 coihue: el Coihue camina hacia tu base (las reglas, en desafio-camino.js)
import { caminoNuevo, rutaDelCoihue, crearBusquedaRuta, rutaRecta, largoRuta, puntoEnRuta, posicionCamino, empezarNocheCamino, tickCamino, cerrarNocheCamino, herirPies, pisarTrampa, anotarRastro, horasDeNoche, avisoNocheCamino, metrosABase } from './desafio-camino.js';

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _c = new THREE.Color();
const ARRIBA = new THREE.Vector3(0, 1, 0);
const AMBAR = '#ffb030';   // 3.8.0: el ámbar del Coihue (antes el verde y el cian de la nave)

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
  // 3.8.4: `sitio` es dónde quedó plantado el Coihue cuando el asedio esperó al alba (ver `revisarAlba`)
  function empezar(sitio = null) {
    const d = D();
    if (d.asedio || d.victoria) return false;
    const c = api.centroBase();
    const azar = azarDe(d.semilla, 'asedio');
    const zonas = ubicarZonas(T.lugares, c, esBueno, azar);
    // 3.8.0: el Coihue de la noche final se quedó plantado: el asedio es ahí (un solo Coihue)
    const co = api.coihueComun, plantado = co && co.fase === 'plantado' && co.g.visible;
    const guardado = !plantado && sitio && Number.isFinite(sitio.x) && Number.isFinite(sitio.z) ? { x: Math.round(sitio.x * 10) / 10, z: Math.round(sitio.z * 10) / 10 } : null;
    const nave = (plantado ? { x: Math.round(co.x * 10) / 10, z: Math.round(co.z * 10) / 10 } : null) || guardado || ubicarNave(c, llano, azar) || { x: Math.max(-LIMITE + 60, Math.min(LIMITE - 60, c.x * 0.4)), z: Math.max(-LIMITE + 60, Math.min(LIMITE - 60, c.z * 0.4)) };
    const vida = ASEDIO.vidaAncla * dificultad(api.claveDificultad?.()).vida;
    const a = asedioNuevo(zonas, nave, vida);
    if (!a) return false;
    d.asedio = a;
    crearCamino(a);   // 4.10 coihue: la ruta hasta tu base
    api.alEmpezarAsedio?.();   // 4.10 coihue: los lugares tomados del valle dejan su lugar a las raíces
    // los núcleos se replegaron adentro: ya no hay nodriza que derribar a flechazos
    d.nodriza = null;
    gracia = ASEDIO.graciaGuardia;
    llegada = plantado || guardado ? 0 : 1;
    armar();
    const js = api.jugador().estado;
    setTimeout(() => api.nota('El Coihue Viejo no se cayó', `Se plantó en el valle, ${api.rumboTexto(js.pos, a.nave)}. Hundió ${a.zonas.length} raíces que le dan corteza`, true), 4200);
    setTimeout(() => api.nota('El asedio', 'Cortá las raíces de día (están en el mapa). De noche van a querer recuperar lo que les saques. Con tres zonas libres se abre la puertita del Coihue', true), 9500);
    api.guardar();
    return true;
  }

  // ---------------------------------------------------------------- mallas
  // 3.8.0: la nodriza asentada pasó a ser el Coihue Viejo plantado sobre el valle (camina hasta su lugar y
  // hunde las raíces), y las agujas son raíces suyas que brotan en cada zona con un nudo de ámbar que late.
  // La mancha es musgo oscuro con vetas de ámbar; el hilo, una hebra de savia que va de cada raíz al tronco.
  let armado = null;   // { nave, zonas: [...] }
  const matCorteza = lam('#4a3426'), matCortezaClara = lam('#6a4c34');
  const matCristal = new THREE.MeshBasicMaterial({ color: AMBAR });
  const matMadera = lam('#6b5238'), matPiedra = lam('#7d766c');
  const geoHaz = new THREE.CylinderGeometry(0.18, 0.18, 1, 6, 1, true).translate(0, 0.5, 0);
  const { raiz, fundirCorteza, musgoEn } = herramientasCoihue;
  function mancha(radio) {
    // un disco que sigue el terreno, con el borde que se desvanece (alfa por vértice)
    const g = new THREE.RingGeometry(0.2, radio, 36, 6);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z) / radio;
      const vena = Math.abs(Math.sin(x * 0.9 + Math.sin(z * 0.5) * 2) * Math.sin(z * 0.8 + Math.sin(x * 0.4) * 1.7));
      const brillo = vena < 0.09 ? 0.7 : 0;
      const musgo = Math.max(0, Math.sin(x * 0.37 + z * 0.21) * Math.sin(z * 0.43 - x * 0.17));
      _c.setRGB(0.12 + brillo * 0.5 - musgo * 0.03, 0.1 + brillo * 0.28 + musgo * 0.08, 0.05 + brillo * 0.04, THREE.SRGBColorSpace);   // pensado en sRGB, guardado lineal
      col[i * 4] = _c.r; col[i * 4 + 1] = _c.g; col[i * 4 + 2] = _c.b;
      col[i * 4 + 3] = Math.max(0, 1 - r * r) * 0.85;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 4));
    return g;
  }
  // la raíz que brota (en metros, el pie en 0): una raíz gruesa que sube torcida hasta 10 m, con otras más
  // chicas que la abrazan. La misma malla para las cuatro zonas.
  let geoRaizAguja = null;
  function mallaRaizAguja() {
    if (!geoRaizAguja) {
      const pz = [raiz([[0.4, -0.6, 0.2], [0.2, 2.5, 0.1], [-0.3, 5.5, 0.2], [0.1, 8.2, -0.2], [0.35, 10.2, 0]], [1.45, 1.1, 0.75, 0.42, 0.06], '#4a3426', { nudos: 0.16, tramos: 26, lados: 10, pintar: (c, p, n) => musgoEn(c, p, n, 0.8) })];
      for (let i = 0; i < 4; i++) {
        const a = i * 1.57 + 0.4;
        pz.push(raiz([[Math.cos(a) * 2.6, -0.4, Math.sin(a) * 2.6], [Math.cos(a) * 1.5, 1.6, Math.sin(a) * 1.5], [Math.cos(a + 0.6) * 0.9, 3.4 + i * 0.4, Math.sin(a + 0.6) * 0.9], [Math.cos(a + 1.2) * 0.6, 4.6 + i * 0.5, Math.sin(a + 1.2) * 0.6]], [0.42, 0.34, 0.24, 0.08], '#5a3c28', { nudos: 0.08, tramos: 16, pintar: (c, p, n) => musgoEn(c, p, n, 0.9) }));
      }
      geoRaizAguja = fundirCorteza(pz).geometry;
    }
    const m = new THREE.Mesh(geoRaizAguja, herramientasCoihue.matCorteza());
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  // la corteza del escudo: un tubo apenas más ancho que el tronco, de las raíces a la copa, en placas con
  // grietas que brillan (color por vértice; la transparencia la da la cantidad de capas)
  function geoCorteza(radio) {
    const perfil = [];
    for (let j = 0; j <= 24; j++) { const y = 0.2 + (j / 24) * (COIHUE.alto * 0.8); perfil.push(new THREE.Vector2(radio(y) * 1.16 + 0.15, y + COIHUE.alza)); }
    const g = new THREE.LatheGeometry(perfil, 40);
    const P = g.attributes.position, col = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) {
      const a = Math.atan2(P.getX(i), P.getZ(i)), y = P.getY(i);
      const placa = Math.abs(Math.sin(a * 9 + Math.sin(y * 0.7) * 0.8)) * Math.abs(Math.sin(y * 1.3 + a * 2));
      const grieta = placa < 0.12 ? 1 : 0;
      _c.setRGB(0.32 + grieta * 0.5, 0.22 + grieta * 0.34, 0.14 + grieta * 0.03, THREE.SRGBColorSpace);
      col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }
  function armarZona(z) {
    const g = new THREE.Group();
    const y = T.altura(z.x, z.z);
    g.position.set(z.x, y, z.z);
    // la aguja: la raíz que brotó, con gotas de resina y el nudo de ámbar que late
    const aguja = new THREE.Group();
    aguja.add(mallaRaizAguja());
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26;
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), matCristal);
      c.scale.set(0.8, 1.2, 0.8);
      c.position.set(Math.cos(a) * 1.05, 1.6 + (i % 3) * 1.4, Math.sin(a) * 1.05);
      aguja.add(c);
    }
    const nucleo = new THREE.Mesh(geoAmbar([1.0, 1.25, 1.0], 21), new THREE.MeshBasicMaterial({ vertexColors: true }));
    nucleo.position.set(0.5, 3.2, 0.45);   // asoma de la raíz (no queda tapado)
    aguja.add(nucleo);
    // la corteza que lo cierra de noche
    const capa = new THREE.Mesh(new THREE.SphereGeometry(1.35, 12, 8), matCortezaClara);
    capa.position.copy(nucleo.position); capa.scale.setScalar(0.01);
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
    // raicitas que asoman alrededor (y alguna gota de resina)
    const esquirlas = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const a = i * 2.1 + 0.4, r = 4 + (i * 1.7) % 9;
      const x = Math.cos(a) * r, zz = Math.sin(a) * r;
      const e = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1, 5), i % 3 ? matCorteza : matCristal);
      e.scale.set(1, 1.4 + (i % 3) * 0.6, 1);
      e.position.set(x, T.altura(z.x + x, z.z + zz) - y + 0.4, zz);
      e.rotation.set((i % 2 ? 1 : -1) * 0.5, a, 0.35);
      esquirlas.add(e);
    }
    g.add(esquirlas);
    // 3.8.0: la baliza es un fogón (un ruedo de piedras, leños cruzados y el fuego): `tela` son las llamas
    // (se mecen) y `farol` las brasas (se ponen rojas cuando lo atacan)
    const baliza = new THREE.Group();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const piedra = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0).scale(1, 0.7, 1), matPiedra);
      piedra.position.set(Math.cos(a) * 0.75, 0.1, Math.sin(a) * 0.75);
      baliza.add(piedra);
    }
    for (let k = 0; k < 4; k++) {
      const leno = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.2, 6), matMadera);
      leno.rotation.set(0.9, k * Math.PI / 2 + 0.4, 0);
      leno.position.set(Math.cos(k * Math.PI / 2 + 0.4) * 0.22, 0.32, Math.sin(k * Math.PI / 2 + 0.4) * 0.22);
      leno.castShadow = true;
      baliza.add(leno);
    }
    const tela = new THREE.Group();
    for (const [s, h, c] of [[0.36, 0.95, '#ff8a2a'], [0.2, 0.75, '#ffd060'], [0.14, 0.55, '#fff0a0']]) {
      const llama = new THREE.Mesh(new THREE.ConeGeometry(s, h, 7, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      llama.position.y = 0.45 + h / 2;
      tela.add(llama);
    }
    baliza.add(tela);
    const farol = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.45, 1), new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
    farol.position.y = 0.22;
    baliza.add(farol);
    baliza.visible = false;
    baliza.position.set(2.4, T.altura(z.x + 2.4, z.z) - y, 0);
    g.add(baliza);
    // la hebra de savia que sube de la raíz al tronco del Coihue
    const hilo = new THREE.Mesh(geoHaz, new THREE.MeshBasicMaterial({ color: AMBAR, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    hilo.frustumCulled = false;
    escena.add(hilo);
    escena.add(g);
    return { g, aguja, nucleo, capa, suelo, esquirlas, baliza, tela, farol, hilo, y, flash: 0, rota: 0,
      blanco: { asedio: true, ancla: true, i: 0, pos: new THREE.Vector3(z.x, y + 3.2, z.z), radio: 1.7 } };
  }
  // el Coihue plantado: mira a tu base. Su puerta grande (el «haz») se enciende cuando se puede entrar.
  // 3.8.0: es el mismo de la noche final (armado al cargar, ver desafio-eventos.js): nunca hay dos.
  function armarNave(a) {
    const t0 = performance.now();
    const co = api.coihueComun || armarCoihueViejo();
    const c = api.centroBase?.() || { x: 0, z: 0 };
    const giro = co.fase === 'plantado' && Math.hypot(co.x - a.nave.x, co.z - a.nave.z) < 3 ? co.giro : Math.atan2(c.x - a.nave.x, c.z - a.nave.z);
    co.fase = 'plantado';
    for (const q of co.nucleos || []) q.mesh.visible = q.aro.visible = false;
    co.g.scale.setScalar(COIHUE.escala);
    co.g.rotation.order = 'YXZ';
    co.g.rotation.set(0, giro, 0);
    co.g.visible = true;
    co.g.position.set(a.nave.x, T.altura(a.nave.x, a.nave.z), a.nave.z);
    if (co.escudoAsedio) return { ...co, haz: co.puerta, luces: [], escudo: co.escudoAsedio, luz: co.luzAsedio, giro, t: 0, caida: 0, cayendo: 0, alCaer: null, ms: performance.now() - t0 };
    // el escudo es «la corteza»: una corteza dura que lo envuelve (una capa por raíz que brotó), con grietas
    // de ámbar; se va aclarando a medida que caen las raíces
    const escudo = new THREE.Mesh(geoCorteza(co.radio), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false }));
    escudo.renderOrder = 2;
    co.cuerpo.add(escudo);
    co.g.position.set(a.nave.x, T.altura(a.nave.x, a.nave.z), a.nave.z);
    if (!co.g.parent) escena.add(co.g);
    co.escudoAsedio = escudo;
    // la luz de la puerta (el presupuesto fijo de luces la reparte: no cambia ningún programa)
    const luz = new THREE.PointLight(0xffb060, 0, 22, 1.6);
    luz.position.copy(co.farol);
    co.cuerpo.add(luz);
    registrarLuz(luz);
    co.luzAsedio = luz;
    return { ...co, haz: co.puerta, luces: [], escudo, luz, giro, t: 0, caida: 0, cayendo: 0, alCaer: null, ms: performance.now() - t0 };
  }
  function armar() {
    const a = A();
    if (!a || armado) return;
    armado = { nave: a.ganado ? null : armarNave(a), zonas: a.zonas.map((z, i) => { const r = armarZona(z); r.blanco.i = i; return r; }) };
  }
  function desarmar() {
    if (!armado) return;
    sacarRaices();
    esconderCamino();
    if (huellas) { escena.remove(huellas); for (const q of huellas.children) q.geometry.dispose(); huellas = null; }   // 4.10 coihue
    if (sombra) { escena.remove(sombra); sombra.geometry.dispose(); sombra = null; }
    pies = [];
    if (armado.nave) armado.nave.g.visible = false;   // 3.8.0: el Coihue es compartido: se esconde, no se saca
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
    if (n?.pies) { herirPatas(n, dano); return; }   // 4.10 coihue: las raíces con que camina
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
      ? `Cortaste la raíz y el Coihue perdió una capa de corteza (le quedan ${capas}). Prendiste un fogón: esta noche van a venir por él · +${ASEDIO.cristalesAncla} semillas doradas`
      : `Cortaste la última raíz: el Coihue se quedó sin corteza · +${ASEDIO.cristalesAncla} semillas doradas`, true);
    if (r.abrePaso) setTimeout(() => api.nota('¡Se abrió la puertita del Coihue!', 'Con tres zonas libres la corteza no alcanza a cerrar. Andá al pie del Coihue de día y entrá por la puertita (E)', true), 3500);
    api.guardar();
  }

  // ---------------------------------------------------------------- la noche
  function alEmpezarNoche() {
    const a = A();
    if (!asedioActivo(a)) return null;
    nocheCamino(a);   // 4.10 coihue: esta noche camina
    const i = elegirContraataque(a);
    if (i === null) return null;
    const def = defZona(a.zonas[i].id);
    const js = api.jugador().estado;
    setTimeout(() => api.nota(`¡Contraatacan ${def?.corto || 'la zona'}!`, `Vienen por tu fogón, ${api.rumboTexto(js.pos, a.zonas[i])}. Si aguanta hasta el alba, la zona queda tuya`, true), 2600);
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
      api.nota(`Apagaron el fogón de ${def?.corto || 'la zona'}`, 'La raíz volvió a crecer. De día se puede volver a cortar', true);
      api.guardar();
    }
    return true;
  }
  // Al terminar la noche (terminarOleada). Si fue la noche final y la nodriza sigue en el
  // aire, en vez de irse se asienta: empieza el asedio.
  function alTerminarNoche(sobrevivida) {
    const d = D();
    if (!d.asedio) {
      // 3.8.4: si caíste en la noche final con el Coihue en pie, el asedio no arranca en el momento (con vos en el
      // suelo y la noche por la mitad): queda anotado y arranca al alba, cuando despertás (`revisarAlba`)
      if (!sobrevivida && !d.victoria && d.nodriza && d.oleadas >= NOCHE_FINAL) {
        const co = api.coihueComun, plantado = co && co.fase === 'plantado' && co.g.visible;
        d.asedioAlAlba = plantado ? { x: co.x, z: co.z } : {};
        return false;
      }
      if (!d.victoria && d.nodriza && d.oleadas >= NOCHE_FINAL) return empezar();
      return false;
    }
    const a = d.asedio;
    if (!asedioActivo(a)) return false;
    albaCamino(a);   // 4.10 coihue: lo que caminó, caminado
    const r = cerrarNocheAsedio(a, sobrevivida);
    if (r.asegurada) {
      const def = defZona(r.asegurada);
      setTimeout(() => api.nota(`${def?.nombre || 'La zona'}: asegurada`, 'El fogón aguantó toda la noche. Esa zona ya no la recuperan', true), 5200);
    }
    return false;
  }

  // 3.8.4: el asedio que quedó esperando arranca con la primera luz (`deNoche`: todavía es hora de ataque).
  // Se mira en revisarHorario, que no corre con vos caído: arranca cuando despertás.
  function revisarAlba(deNoche) {
    const d = D();
    if (!d.asedioAlAlba || deNoche) return false;
    const sitio = d.asedioAlAlba;
    d.asedioAlAlba = null;
    if (d.asedio || d.victoria || !d.nodriza) return false;
    return empezar(sitio);
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
      return { aviso: `La corteza no deja entrar: ${faltan === 1 ? 'falta liberar una zona' : `faltan liberar ${faltan} zonas`}`,
        titulo: 'La puertita del Coihue está cerrada', texto: `Cortá ${faltan === 1 ? 'una raíz más' : `${faltan} raíces más`} de día (el mapa las marca) y se abre la puertita` };
    }
    if (!deDia()) return { aviso: 'De noche la puertita está cerrada', titulo: 'La puertita está cerrada', texto: 'Se abre de nuevo con la luz del día' };
    // adentro el reloj queda quieto: en la hora antes del ataque el haz ya se apaga, así la
    // noche nunca arranca con vos arriba
    if ((api.horas?.() ?? 12) >= HORA_ATAQUE - 1) return { aviso: 'Está por caer la noche: la puertita se cerró hasta mañana', titulo: 'La puertita se cerró', texto: 'En la hora antes del ataque no se puede entrar. Preparate para la noche' };
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
      return { aviso: `Hay duendes cerca: despejá la zona para entrar (${n || 'alguno'}${donde})`,
        titulo: 'Hay duendes cerca', texto: `La puertita no se abre con ${n > 1 ? `${n} duendes` : n === 1 ? 'un duende' : 'duendes'} dando vueltas${donde}. Despejá la zona` };
    }
    return null;
  }
  function hazAbierto() { return !motivoHaz(); }
  // 3.8.0: al pie del Coihue (debajo del tronco o en la escalera de su puerta grande): ahí E entra
  const PIE_COIHUE = 15;
  function enElHaz(pos) {
    const s = sitioHaz();
    return !!s && Math.hypot(pos.x - s.x, pos.z - s.z) < PIE_COIHUE && Math.abs(pos.y - s.y) < 4;
  }
  // las raíces del Coihue plantado chocan (el tronco va alto: por debajo se pasa)
  const DUENIO_COIHUE = { coihueAsedio: true };
  let raicesPuestas = false;
  function ponerRaices(n, a) {
    if (raicesPuestas || !api.col) return;
    raicesPuestas = true;
    // 4.10 coihue: donde está parado ahora (camina: ya no es siempre donde se plantó)
    const px = n.g.position.x, pz = n.g.position.z;
    const y = T.altura(px, pz);
    for (const p of piesCoihue(n, px, pz, n.giro)) api.col.agregar({ x: p.x, z: p.z, r: p.r, alturaMin: y - 3, alturaMax: y + 5, duenio: DUENIO_COIHUE });
  }
  function sacarRaices() { if (raicesPuestas) api.col?.eliminarPorDuenio(DUENIO_COIHUE); raicesPuestas = false; }
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
    return m ? m.aviso : 'Entrar al Coihue por la puertita';
  }

  // ---------------------------------------------------------------- el final: la nave cae
  function derribar(alCaer) {
    const a = A();
    if (!a) { alCaer?.(); return; }
    armar();
    sincronizarVisual(a);   // 4.10 coihue: cae donde está parado, no donde dice la cuenta
    ganarAsedio(a);
    for (const al of api.aliens) if (al.guardiaAsedio && al.estado !== 'morir') { al.estado = 'irse'; al.t = 0; }
    if (!armado?.nave) { alCaer?.(); return; }
    armado.nave.cayendo = 0.001; armado.nave.caida = 0; armado.nave.alCaer = alCaer;
    sacarRaices();
    armado.nave.escudo.visible = false;
    for (const r of armado.zonas) {
      if (r.aguja.visible) { _v.set(r.g.position.x, r.y + 3, r.g.position.z); efectos?.explosion(_v, 5); }
      r.aguja.visible = false; r.hilo.visible = false;
    }
    api.guardar();
  }
  // 3.8.0: el Coihue se viene abajo: cruje, se inclina cada vez más rápido para el lado contrario a tu base
  // (saliste por ahí) y golpea el suelo con la copa. Tarda lo mismo que tardaba en caer la nave (unos 4 s).
  const CAIDA = { lento: 0.02, rapido: 0.09, tope: Math.PI / 2 * 0.96 };
  function actualizarCaida(n, dt) {
    n.cayendo += dt;
    const t = n.cayendo, a = A();
    const ang = Math.min(CAIDA.tope, CAIDA.lento * t + CAIDA.rapido * t * t);
    const suelo = T.altura(a.nave.x, a.nave.z);
    n.g.position.set(a.nave.x, suelo, a.nave.z);
    n.g.rotation.y = n.giro; n.g.rotation.x = -ang; n.g.rotation.z = Math.sin(t * 2.3) * 0.02;
    animarCoihue(n, t * 3, 0.6);
    // por dónde va la copa (de la base para afuera)
    const largo = (n.alto - 6) * COIHUE.escala, ax = -Math.sin(n.giro), az = -Math.cos(n.giro);
    n.caida -= dt;
    if (n.caida <= 0) {
      n.caida = 0.3;
      const k = 0.3 + Math.random() * 0.7;
      _v.set(a.nave.x + ax * Math.sin(ang) * largo * k + (Math.random() - 0.5) * 6, suelo + Math.cos(ang) * largo * k, a.nave.z + az * Math.sin(ang) * largo * k + (Math.random() - 0.5) * 6);
      efectos?.polvo?.(_v, 10);
      if (Math.random() < 0.4) sonido.golpeRuido?.({ dur: 0.6, frec: 160 + Math.random() * 120, tipo: 'lowpass', vol: 0.45, destino: sonido.bus?.efectos });
    }
    if (ang < CAIDA.tope) return;
    _v.set(a.nave.x + ax * largo * 0.8, suelo + 2, a.nave.z + az * largo * 0.8);
    efectos?.explosion(_v, 16);
    efectos?.polvo?.(_v, 30);
    sonido.golpeRuido?.({ dur: 3.2, frec: 70, tipo: 'lowpass', vol: 1, destino: sonido.bus?.efectos });
    api.vibrar?.('derrumbe', 1);
    n.g.visible = false;
    n.cayendo = 0;
    const cb = n.alCaer; n.alCaer = null;
    cb?.();
  }

  // ---------------------------------------------------------------- 4.10 coihue: el Coihue camina hacia tu base
  // La ruta se calcula una vez (y de nuevo cada noche, con lo que hayas construido) por una grilla que esquiva el
  // agua, la vía, los lugares del valle y las obras (`rutaDelCoihue`). El avance de la cuenta (`camino.d`) corre con
  // la hora de juego; lo que se ve va a zancadas: espera a sacarle 2 m a la cuenta, da el paso (tiembla, levanta
  // polvo, las raíces se arrastran) y se queda quieto. Mientras camina las raíces no chocan; parado, sí.
  const ZANCADA = { gap: 2, vel: 0.9 };
  const vis = { d: 0, listo: null, zancada: false, tCruje: 0, tTrampa: 0, temblor: 0, nHuellas: -1, huellaX: 0, huellaZ: 0, sombraT: 0 };
  let pies = [], huellas = null, sombra = null, pisadas = new WeakSet();
  // translúcido de un solo color (las capas se apilan para dar el degradé: sin alfa por vértice)
  const matCapa = (color, opacidad) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacidad, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const r1 = (v) => Math.round(v * 10) / 10;
  function libreCoihue(x, z, hAgua, hObra) {
    if (Math.abs(x) > LIMITE - 30 || Math.abs(z) > LIMITE - 30 || T.agua(x, z)) return false;
    for (let i = 0; i < 4; i++) if (T.agua(x + Math.cos(i * 1.5708) * hAgua, z + Math.sin(i * 1.5708) * hAgua)) return false;
    const k = T.indice(x, z);
    if ((T.pendiente?.[k] ?? 0) > 0.55 || (T.distRiel?.[k] ?? 999) < 9 || cercaDeLugar(x, z)) return false;
    return !api.obraCerca?.(x, z, hObra);
  }
  // Primero con holgura (el árbol es ancho); si el cerco no deja, cada vez menos; y si no hay camino, la recta.
  const costoRuta = (x, z) => { const k = T.indice(x, z); return (T.bosque?.[k] ?? 0) * 1.2 + (T.pendiente?.[k] ?? 0) * 1.5; };
  const HOLGURAS_RUTA = [[9, 8], [4, 5], [2, 2.5]];
  function rutaPara(desde, base) {
    for (const [ha, ho] of HOLGURAS_RUTA) {
      const r = rutaDelCoihue(desde, base, (x, z) => libreCoihue(x, z, ha, ho), { costo: costoRuta, limite: LIMITE - 30 });
      if (r && r.length >= 2) return { ruta: r, recta: false };
    }
    return { ruta: rutaRecta(desde, base), recta: true };
  }
  // 4.11.3 (H2-3 b y c): la ruta de cada noche se calcula repartida en cuadros (el A* entero hacía un tirón de 1 a 7 ms al caer la noche, y de 30 a 60 con
  // la base cercada). Es el mismo cálculo con los mismos tres intentos: la ruta sale igual, pero se aplica unos cuadros después. Mientras tanto el Coihue
  // se queda donde está (no camina hasta que la ruta nueva esté puesta: ver actualizarCamino).
  const PRESUPUESTO_RUTA = 1000;   // unidades por cuadro (celdas miradas y nodos abiertos): ~1 ms en la 4600G
  let replan = null;
  function empezarReplan(a) {
    const c = a.camino;
    replan = null;
    if (!c || c.llego) return;
    const centro = api.centroBase();
    c.base = { x: centro.x, z: centro.z };   // (el centro de tu base se mueve con lo que construís)
    const desde = posicionCamino(c);
    replan = { a, c, desde: { x: desde.x, z: desde.z }, base: c.base, intento: 0, busqueda: null };
  }
  function aplicarReplan(r, ruta, recta) {
    const c = r.c;
    c.ruta = ruta; c.recta = recta; c.largo = largoRuta(ruta); c.d = 0; vis.d = 0;
    if (c.largo <= 0.5) c.llego = true;
    replan = null;
  }
  // Trabaja hasta `unidades`; sin tope (Infinity) la termina de una vez. Devuelve si todavía quedan cuentas pendientes.
  function avanzarReplan(unidades = PRESUPUESTO_RUTA) {
    const r = replan;
    if (!r) return false;
    if (A() !== r.a || r.a.camino !== r.c) { replan = null; return false; }   // (se terminó el asedio o se cambió el camino)
    let sobra = unidades;
    while (replan === r) {
      if (r.intento >= HOLGURAS_RUTA.length) { const rr = rutaRecta(r.desde, r.base); aplicarReplan(r, rr, true); break; }
      if (!r.busqueda) {
        const [ha, ho] = HOLGURAS_RUTA[r.intento];
        r.busqueda = crearBusquedaRuta(r.desde, r.base, (x, z) => libreCoihue(x, z, ha, ho), { costo: costoRuta, limite: LIMITE - 30 });
      }
      const antes = r.busqueda.gastado;
      const fin = r.busqueda.avanzar(sobra);
      sobra -= r.busqueda.gastado - antes;
      if (!fin) break;
      const ruta = r.busqueda.resultado;
      if (ruta && ruta.length >= 2) { aplicarReplan(r, ruta, false); break; }
      r.busqueda = null; r.intento++;
      if (sobra <= 0) break;
    }
    return replan !== null;
  }
  function crearCamino(a) {
    const base = api.centroBase();
    const { ruta, recta } = rutaPara(a.nave, base);
    a.camino = caminoNuevo({ ruta, recta, base, interior: a.nave });
    vis.d = 0; vis.listo = null; vis.nHuellas = -1;
    return a.camino;
  }
  function replanear(a) { empezarReplan(a); }   // 4.11.3: ahora se reparte en cuadros (ver empezarReplan)
  // Dónde se ve el Coihue (donde va la zancada) y dónde dice la cuenta que está.
  function posVisual(a) {
    const c = a.camino;
    return (c && puntoEnRuta(c.ruta, vis.d)) || a.nave;
  }
  function sincronizarVisual(a) {
    const c = a?.camino;
    if (!c) return;
    c.d = Math.min(c.largo, Math.max(c.d, vis.d));
    vis.d = c.d;
    const p = posicionCamino(c);
    a.nave.x = r1(p.x); a.nave.z = r1(p.z);
  }
  function nocheCamino(a) {
    // 4.10.4 (H2-3): si el camino se acaba de crear (partida de antes de la 4.10) ya es la ruta de hoy: replanear daba la misma ruta calculada dos veces
    let c = a.camino;
    if (!c) c = crearCamino(a); else replanear(a);
    empezarNocheCamino(c, D().oleadas + 1);
    pisadas = new WeakSet();
  }
  function albaCamino(a) {
    const c = a.camino;
    if (!c) return;
    if (replan) avanzarReplan(Infinity);   // 4.11.3: si la noche terminó (o se durmió) con la ruta a medio calcular, se termina ya: el alba camina por la ruta nueva
    cerrarNocheCamino(c, zonasLibres(a));
    // (cada noche la ruta se vuelve a calcular desde donde quedó: `d` es lo que caminó esta noche)
    if (c.d > 0.5 && !c.llego) {
      setTimeout(() => {
        if (c.llego) return;   // (la llegada tiene su propio aviso)
        api.nota('El Coihue avanzó', `Caminó ${Math.round(c.d)} m en la noche y está a ${Math.round(metrosABase(c))} m de tu base. Pegale a sus raíces o ponele trampas en el camino`, true);
      }, 7600);
    }
  }
  // Llegó: el cerco cae de golpe y la puertita se abre sola. El corazón se sube igual.
  function alLlegar(c, n) {
    if (c.cerco) return;
    c.cerco = true;
    const x = n.g.position.x, z = n.g.position.z;
    const tocadas = api.caerCerco?.(x, z, 32, 0.65) || 0;
    _v.set(x, n.g.position.y + 2, z);
    efectos?.explosion(_v, 14);
    efectos?.polvo?.(_v, 30);
    sonido.golpeRuido?.({ dur: 3, frec: 70, tipo: 'lowpass', vol: 1, destino: sonido.bus?.efectos });
    api.vibrar?.('derrumbe', 1);
    api.nota('¡El Coihue llegó a tu base!', `${tocadas ? 'Sus raíces aplastaron el cerco. ' : ''}La puertita se abrió sola: ya no hay zonas que valgan. Entrá de día a pelear con el Rey Duende`, true);
    api.guardar();
  }
  function herirPatas(b, dano) {
    const a = A(), c = a?.camino;
    if (!c || !armado?.nave) return;
    const dia = deDia();
    const r = herirPies(c, dano, { deNoche: !dia, vida: dificultad(api.claveDificultad?.()).vida });
    if (!r.ok) return;
    efectos?.astillas?.(b.pos, 6);
    api.S?.golpe?.(b.pos, 'bruto', false);
    if (!r.corte) return;
    efectos?.polvo?.(b.pos, 16);
    efectos?.explosion?.(b.pos, 5);
    sonido.golpeRuido?.({ dur: 1.2, frec: 120, tipo: 'lowpass', vol: 0.8, destino: sonido.fuente?.(b.pos, 1.2) });
    if (dia) api.nota('Raíces heridas', 'Esta noche el Coihue camina más despacio', true);
    else api.nota('¡Se le trabaron las raíces!', 'El Coihue se queda clavado un rato. Seguí pegándole y va a tardar más en llegar', true);
    api.guardar();
  }
  const piesVivos = () => { const a = A(); return !!(a && a.camino && armado?.nave && armado.nave.g.visible && !(armado.nave.cayendo > 0) && asedioActivo(a)); };
  function actualizarPies(n) {
    for (let i = 0; i < n.patas.length; i++) {
      // (sin `ancla`: no son agujas; `i` fuera del rango de las zonas, por si algo busca una aguja por su número)
      const b = pies[i] || (pies[i] = { asedio: true, pies: true, i: 100 + i, pos: new THREE.Vector3(), radio: 1.7 });
      const p = n.patas[i], ang = p.a + n.giro, alc = p.alcance * COIHUE.escala;
      b.pos.set(n.g.position.x + Math.sin(ang) * alc, n.g.position.y + 0.9, n.g.position.z + Math.cos(ang) * alc);
    }
  }
  function pushPies() {
    if (!piesVivos() || llegada > 0.05) return;
    for (let i = 0; i < pies.length; i++) activos.push(pies[i]);
  }
  // las huellas: por cada punto por donde pasó, seis marcas de tierra removida (un tinte oscuro que sigue el suelo y un
  // montículo de tierra con raíz) y, de una huella a la siguiente, el surco de la raíz que arrastró. Dos mallas, para toda la ruta.
  function geoHuellas(c, n) {
    const pos = [], idx = [];
    const mpos = [], mcol = [], midx = [];
    const LADOS = 10;
    // la mancha de tierra removida: tres discos apilados (el de más abajo, el más ancho)
    const blot = (cx, cz, rad, sem) => {
      for (const f of [1, 0.72, 0.45]) {
        const base = pos.length / 3, rf = rad * f;
        pos.push(cx, T.altura(cx, cz) + 0.12, cz);
        for (let j = 0; j < LADOS; j++) {
          const a = (j / LADOS) * Math.PI * 2, rr = rf * (0.8 + 0.35 * Math.abs(Math.sin(sem * 1.7 + j * 2.1)));
          const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
          pos.push(x, T.altura(x, z) + 0.12, z);
        }
        // (mirando para arriba: los ángulos crecen en sentido horario visto desde arriba, así que se pasan al revés)
        for (let j = 0; j < LADOS; j++) idx.push(base, base + 1 + ((j + 1) % LADOS), base + 1 + j);
      }
      // el montículo: tierra levantada con una raíz asomada (opaco, de un color que no brilla)
      const mb = mpos.length / 3, alto = 0.75 + 0.4 * Math.abs(Math.sin(sem * 3.1)), ra = rad * 0.8;
      const aros = [[1, 0], [0.8, 0.55], [0.42, 0.92], [0, 1]];
      for (let r = 0; r < aros.length; r++) for (let j = 0; j < 8; j++) {
        const a = (j / 8) * Math.PI * 2, rr = ra * aros[r][0] * (0.85 + 0.3 * Math.abs(Math.sin(sem + j * 1.9)));
        mpos.push(cx + Math.cos(a) * rr, T.altura(cx, cz) - 0.1 + aros[r][1] * alto, cz + Math.sin(a) * rr);
        const luz = 0.55 + aros[r][1] * 0.45;
        _c.setRGB(0.26 * luz, 0.18 * luz, 0.11 * luz, THREE.SRGBColorSpace); mcol.push(_c.r, _c.g, _c.b);
      }
      for (let r = 0; r < aros.length - 1; r++) for (let j = 0; j < 8; j++) { const j2 = (j + 1) % 8, p0 = mb + r * 8; midx.push(p0 + j, p0 + j2, p0 + 8 + j, p0 + j2, p0 + 8 + j2, p0 + 8 + j); }
    };
    const surco = (ax, az, bx, bz) => {
      const L = Math.hypot(bx - ax, bz - az);
      if (L < 0.5) return;
      const nx = -(bz - az) / L, nz = (bx - ax) / L, TR = 5;
      for (const ancho of [0.7, 0.32]) {
        const base = pos.length / 3;
        for (let t = 0; t <= TR; t++) {
          const u = t / TR, px = ax + (bx - ax) * u, pz = az + (bz - az) * u;
          for (const l of [-1, 1]) { const x = px + nx * l * ancho, z = pz + nz * l * ancho; pos.push(x, T.altura(x, z) + 0.13, z); }
        }
        for (let t = 0; t < TR; t++) { const p0 = base + t * 2, p1 = p0 + 2; idx.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1); }
      }
    };
    const R = c.rastro;
    const pies = (i) => {
      const sig = R[Math.min(i + 1, R.length - 1)], ant = R[Math.max(i - 1, 0)];
      const hx = sig[0] - ant[0], hz = sig[1] - ant[1], giro = hx || hz ? Math.atan2(hx, hz) : n.giro;
      return n.patas.map((p) => { const ang = p.a + giro, alc = p.alcance * COIHUE.escala; return [R[i][0] + Math.sin(ang) * alc, R[i][1] + Math.cos(ang) * alc]; });
    };
    let previos = null;
    for (let i = 0; i < R.length; i++) {
      const ahora = pies(i);
      ahora.forEach((q, k) => { blot(q[0], q[1], 1.9, i * 7 + k); if (previos) surco(previos[k][0], previos[k][1], q[0], q[1]); });
      previos = ahora;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeBoundingSphere();
    const m = new THREE.BufferGeometry();
    m.setAttribute('position', new THREE.Float32BufferAttribute(mpos, 3));
    m.setAttribute('color', new THREE.Float32BufferAttribute(mcol, 3));
    m.setIndex(midx);
    m.computeBoundingSphere();
    return { g, m };
  }
  // la sombra: una franja oscura del Coihue hacia tu base, que se alarga a medida que se acerca
  const SOMBRA = { tramos: 12 };
  function armarSombra() {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), matCapa('#050805', 0.3));
    m.renderOrder = 1; m.frustumCulled = false; m.visible = false;
    escena.add(m);
    return m;
  }
  // una cuña oscura del Coihue hacia tu base: tres capas, cada una más angosta (el medio queda más oscuro y los bordes más claros).
  // Se arma una geometría nueva cada vez (son pocos vértices).
  function ponerSombra(c, n, k) {
    const x0 = n.g.position.x, z0 = n.g.position.z;
    const dx = c.base.x - x0, dz = c.base.z - z0, dist = Math.hypot(dx, dz);
    if (dist < 3) { sombra.visible = false; return; }
    const ux = dx / dist, uz = dz / dist, largo = Math.min(dist, 16 + 46 * k), ancho = 13 + 6 * k;
    const pos = [], idx = [];
    for (const f of [1, 0.72, 0.46]) {
      const base = pos.length / 3;
      for (let i = 0; i <= SOMBRA.tramos; i++) {
        const t = i / SOMBRA.tramos, px = x0 + ux * largo * t * (f === 1 ? 1 : 0.97 - 0.1 * (1 - f)), pz = z0 + uz * largo * t * (f === 1 ? 1 : 0.97 - 0.1 * (1 - f)), w = ancho * f * (1 - 0.65 * t) / 2;
        for (const lado of [-1, 1]) { const x = px - uz * w * lado, z = pz + ux * w * lado; pos.push(x, T.altura(x, z) + 0.13, z); }
      }
      for (let i = 0; i < SOMBRA.tramos; i++) { const p0 = base + i * 2, p1 = p0 + 2; idx.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeBoundingSphere();
    sombra.geometry.dispose();
    sombra.geometry = g;
    sombra.visible = true;
  }
  const angDif = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  // Por cuadro (con el Coihue en pie y plantado). Devuelve cuánto camina (0 a 1) para la animación de las patas.
  function actualizarCamino(dt, js, n, a, dia) {
    const c = a.camino || crearCamino(a);
    if (vis.listo !== armado) { vis.listo = armado; vis.d = c.d; vis.nHuellas = -1; }
    let r = { camina: false, llego: false };
    if (!dia && !replan) {   // (4.11.3: con la ruta nueva a medio calcular el Coihue espera: no camina por la vieja)
      if (c.noche < 0) empezarNocheCamino(c, D().oleadas + 1);   // (se cargó la partida a media noche)
      r = tickCamino(c, horasDeNoche(api.horas?.() ?? 12, HORA_ATAQUE), zonasLibres(a));
      if (r.camina && c.avisoNoche !== c.noche) {
        c.avisoNoche = c.noche;
        api.nota('El suelo tiembla', `El Coihue echó a andar hacia tu base. ${avisoNocheCamino(c, zonasLibres(a))}`, true);
      }
    }
    // lo que se ve: zancadas
    const gap = c.d - vis.d;
    if (vis.zancada && gap <= 0.04) vis.zancada = false;
    else if (!vis.zancada && (gap >= ZANCADA.gap || (gap > 0.04 && !r.camina))) vis.zancada = true;
    if (vis.zancada) vis.d = Math.min(c.d, vis.d + ZANCADA.vel * dt);
    const pv = puntoEnRuta(c.ruta, vis.d);
    // la cuenta (lo que ven el resto de las cosas)
    const pc = posicionCamino(c);
    if (Math.abs(a.nave.x - pc.x) > 0.05 || Math.abs(a.nave.z - pc.z) > 0.05) { a.nave.x = r1(pc.x); a.nave.z = r1(pc.z); }
    // hacia dónde mira: hacia donde va
    if (vis.zancada && pv) n.giro += angDif(Math.atan2(pv.dx, pv.dz), n.giro) * Math.min(1, dt * 1.4);
    if (pv) anotarRastro(c, pv.x, pv.z);
    actualizarPies(n);
    // temblor, polvo y crujidos mientras da la zancada
    const dist = Math.hypot(js.pos.x - n.g.position.x, js.pos.z - n.g.position.z);
    const quiereTemblor = vis.zancada ? Math.max(0, 1 - dist / 95) * 0.8 : 0;
    vis.temblor += (quiereTemblor - vis.temblor) * Math.min(1, dt * 3);
    if (vis.zancada) {
      vis.tCruje -= dt;
      if (vis.tCruje <= 0) {
        vis.tCruje = 1.1 + Math.random() * 0.8;
        const k = Math.floor(Math.random() * n.patas.length), b = pies[k];
        if (b) { _v.set(b.pos.x, n.g.position.y + 0.3, b.pos.z); efectos?.polvo?.(_v, 7); }
        sonido.golpeRuido?.({ dur: 0.9, frec: 75 + Math.random() * 50, tipo: 'lowpass', vol: 0.5, destino: sonido.fuente?.(n.g.position, 1.4) });
        if (dist < 70) api.vibrar?.('derrumbe', 0.2);
      }
      // las trampas que pisa (las rompe de a poco y lo enredan)
      vis.tTrampa -= dt;
      if (vis.tTrampa <= 0 && pv) {
        vis.tTrampa = 0.6;
        for (const o of api.trampasEn?.(n.g.position.x + pv.dx * 5, n.g.position.z + pv.dz * 5, 8) || []) {
          if (pisadas.has(o)) continue;
          pisadas.add(o);
          if (!pisarTrampa(c)) continue;
          api.pisarTrampa?.(o);
          api.nota('¡Pisó una trampa!', 'El Coihue se enreda un rato y la rompe de a poco', true);
        }
      }
    }
    // el rastro y la sombra
    // 4.10.4 (H2-5): se compara el último punto y no sólo el largo: con el rastro lleno (80 puntos) el largo no cambia más y las huellas se congelaban
    const uRastro = c.rastro[c.rastro.length - 1] || [0, 0];
    if (c.rastro.length !== vis.nHuellas || uRastro[0] !== vis.huellaX || uRastro[1] !== vis.huellaZ) {
      vis.nHuellas = c.rastro.length; vis.huellaX = uRastro[0]; vis.huellaZ = uRastro[1];
      if (!huellas) {
        huellas = new THREE.Group();
        const decal = new THREE.Mesh(new THREE.BufferGeometry(), matCapa('#0d0906', 0.3)), monton = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ vertexColors: true }));
        decal.renderOrder = 1; decal.frustumCulled = false; monton.frustumCulled = false;
        huellas.add(decal, monton); escena.add(huellas);
      }
      const hg = geoHuellas(c, n), [decal, monton] = huellas.children;
      decal.geometry.dispose(); monton.geometry.dispose();
      decal.geometry = hg.g; monton.geometry = hg.m;
    }
    const dentro = !!api.adentroDelCoihue?.();   // (adentro del tronco hueco no se ve el valle: ni las huellas ni la sombra se dibujan)
    huellas.visible = !dentro && dist < 260;
    vis.sombraT -= dt;
    if (vis.sombraT <= 0) {
      vis.sombraT = vis.zancada ? 0.25 : 1.5;
      if (!sombra) sombra = armarSombra();
      if (dist < 320 && !dentro) ponerSombra(c, n, c.largo > 0.5 ? Math.max(0, Math.min(1, vis.d / c.largo)) : 1);
      else sombra.visible = false;
    }
    // el cerco cae cuando termina de dar el último paso
    if (c.llego && !c.cerco && vis.d >= c.d - 0.15) alLlegar(c, n);
    return vis.zancada ? 1 : (c.atasco > 0 && !c.llego ? 0.3 + Math.sin(performance.now() / 150) * 0.1 : 0);
  }
  function esconderCamino() {
    if (huellas) huellas.visible = false;
    if (sombra) sombra.visible = false;
    vis.temblor = 0; vis.zancada = false;
  }
  const sitioInterior = () => { const a = A(), i = a?.camino?.interior || a?.nave; return i ? { x: i.x, z: i.z, y: T.altura(i.x, i.z) } : null; };

  // ---------------------------------------------------------------- por cuadro
  let tHud = 0;
  function actualizar(dt, js) {
    const a = A();
    if (!a) { replan = null; if (armado) desarmar(); activos.length = 0; return; }
    if (replan) avanzarReplan();   // 4.11.3: un pedazo de la ruta de esta noche por cuadro
    armar();
    const t = performance.now() / 1000;
    const dia = deDia(), vivo = asedioActivo(a);
    gracia = Math.max(0, gracia - dt);
    // la nave
    const n = armado.nave;
    if (n) {
      if (n.cayendo > 0) actualizarCaida(n, dt);
      else if (!vivo) { n.g.visible = false; sacarRaices(); esconderCamino(); }
      else {
        n.t += dt;
        llegada = Math.max(0, llegada - dt / 12);
        n.g.visible = true;
        // 3.8.0: llega caminando desde el bosque (de atrás, mirando a tu base) y hunde las raíces
        // 4.10 coihue: y después camina (ver actualizarCamino): se para donde está ahora
        const va = posVisual(a), atras = llegada * llegada * 160, px = va.x - Math.sin(n.giro) * atras, pz = va.z - Math.cos(n.giro) * atras;
        n.g.position.set(px, T.altura(px, pz), pz);
        n.g.rotation.y = n.giro;
        const pasoC = actualizarCamino(dt, js, n, a, dia);
        animarCoihue(n, n.t, Math.max(Math.min(1, llegada * 5), pasoC));
        calzarPatasCoihue(n, T.altura, px, pz, n.giro);   // 4.10.3 (V6): las patas apoyan en el terreno
        if (llegada <= 0 && !vis.zancada && !raicesPuestas) ponerRaices(n, a);
        else if (vis.zancada && raicesPuestas) sacarRaices();
        const capas = capasEscudo(a);
        n.escudo.visible = capas > 0;
        n.escudo.material.opacity = (0.12 + capas * 0.14) * (0.9 + Math.sin(t * 1.7) * 0.1) * (capas === 1 ? (Math.sin(t * 13) > 0 ? 1 : 0.5) : 1);
        // la puerta grande para entrar (el «haz»): se enciende cuando se puede subir
        const abierto = hazAbierto();
        n.haz.visible = abierto;
        if (abierto) n.haz.material.opacity = 0.6 + Math.sin(t * 4) * 0.2;
        n.luz.intensity = abierto ? 3.2 + Math.sin(t * 6) * 0.3 : 1.2;
      }
    }
    // las zonas
    activos.length = 0;
    pushPies();   // 4.10 coihue
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
        r.tela.rotation.y = t * 1.7 + i; r.tela.scale.set(1, 0.85 + Math.sin(t * 9 + i) * 0.12 + Math.sin(t * 5.3) * 0.08, 1);
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
      r.nucleo.material.color.setRGB(1 + r.flash * 0.5, 1 + r.flash * 0.7, 1 + r.flash * 0.9);   // 3.8.0: el ámbar (el color va en la gema)
      // el hilo hasta la nave
      r.hilo.visible = tomada && !!n && n.g.visible && cerca;
      if (r.hilo.visible) {
        _v.set(z.x, r.y + 9.5 - r.rota * 11, z.z);
        _w.set(n.g.position.x, n.g.position.y + 14 * COIHUE.escala, n.g.position.z).sub(_v);   // 3.8.0: al tronco del Coihue
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
          api.nota('Te salen al cruce', `${n2} ${n2 === 1 ? 'duende cuida' : 'duendes cuidan'} la raíz de ${defZona(z.id)?.corto || 'la zona'}`);
        }
      }
    });
    tHud += dt;
  }

  function limpiar() { sacarRaices(); /* las mallas quedan: la partida sigue (3.8.0: las raíces vuelven a chocar al seguir) */ }

  return {
    empezar, alTerminarNoche, alEmpezarNoche, revisarAlba, blancoNoche, desgastar, blancos, herir, actualizar, derribar,
    usarCerca, avisoCerca, sitioHaz, sitioInterior, hazAbierto, motivoHaz, limpiar,
    get activo() { return asedioActivo(A()); },
    get estado() { return A() || null; },
    textoHud: () => textoAsedio(A()),
    marcas: () => marcasAsedio(A()),
    // para las pruebas
    get armado() { return armado; },
    get rutaPendiente() { return !!replan; },   // 4.11.3
    terminarRuta: () => avanzarReplan(Infinity),
    // 4.10 coihue: el camino (el temblor, para la cámara; lo visual, para las pruebas)
    get temblor() { return vis.temblor; },
    get camino() { return A()?.camino || null; },
    get visual() { return vis; },
    get pies() { return pies; },
    get huellas() { return huellas; },
    get sombra() { return sombra; },
    zonasIds: () => ZONAS_ASEDIO.map((z) => z.id),
  };
}
