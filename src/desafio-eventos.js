// Modo Desafío: lo que pasa más allá de cada oleada.
// - Restos de naves que caen cada tres noches: al explorarlos se recupera un plano
//   de tecnología de los invasores.
// - La nave nodriza de la noche final: tres núcleos que hay que destruir mientras
//   sigue largando invasores. Si amanece antes, se retira y vuelve la noche siguiente.
import * as THREE from 'three';
import { lam } from './vida.js';
import { NUCLEO_VIDA, PLANOS_ALIEN } from './desafio-reglas.js';
import { NIDO, danarNido, estaAbierto, estaRevelado, sumarPista, textoPista, camarasEnteras } from './desafio-nido.js';
import { LIMITE } from './config.js';
import { RUINA, disposicionRuina, paredesRuina, placaActiva, PLACA, aMundo } from './desafio-valle.js';

const _v = new THREE.Vector3();

export function crearEventos(T, escena, sonido, efectos, api) {
  // ---------------- restos de naves
  // 2.1: ya no son un casco con un premio al lado: son una ruina que se recorre (ver
  // `desafio-valle.js`). Un pasillo de tres cámaras, las placas del piso que todavía
  // descargan, invasores dormidos en la del medio y el premio al fondo, bajo la columna
  // de luz que se ve desde lejos.
  const restos = new THREE.Group();
  const matCasco = lam('#6f757a'), matCascoOscuro = lam('#4a4f53'), matPiso = lam('#3a3d40');
  const placasMalla = [];
  {
    const { ancho, largo, alto } = RUINA, m = ancho / 2;
    const piso = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.6, 0.12, largo + 0.4), matPiso);
    piso.position.set(0, 0.04, largo / 2);
    restos.add(piso);
    // las paredes: paneles de un metro, cada uno roto a su altura
    const r = (i) => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };
    let n = 0;
    const panel = (x0, z0, x1, z1) => {
      const L = Math.hypot(x1 - x0, z1 - z0), pasos = Math.max(1, Math.round(L));
      for (let i = 0; i < pasos; i++) {
        const t0 = i / pasos, t1 = (i + 1) / pasos;
        if (r(n++) < 0.12) continue;                                   // un agujero
        const h = alto * (0.5 + r(n++) * 0.55);
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, h, L / pasos + 0.02), r(n++) < 0.5 ? matCasco : matCascoOscuro);
        const cx = x0 + (x1 - x0) * (t0 + t1) / 2, cz = z0 + (z1 - z0) * (t0 + t1) / 2;
        b.position.set(cx, h / 2, cz);
        b.rotation.y = Math.atan2(x1 - x0, z1 - z0);
        b.rotation.z = (r(n++) - 0.5) * 0.12;
        restos.add(b);
      }
    };
    for (const [ax, az, bx, bz] of paredesRuina()) panel(ax, az, bx, bz);
    // las costillas del casco, de a una cada tres metros, algunas partidas
    for (let z = 1.5; z < largo; z += 3) {
      const arco = new THREE.Mesh(new THREE.TorusGeometry(m + 0.2, 0.12, 5, 14, Math.PI * (r(n++) < 0.3 ? 0.55 : 1)), matCascoOscuro);
      arco.position.set(0, 0.2, z); arco.rotation.z = r(n++) * 0.3;
      restos.add(arco);
    }
    // las placas del piso: se prenden y se apagan
    for (let i = 0; i < 3; i++) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.35), new THREE.MeshBasicMaterial({ color: '#7dfff0', transparent: true, opacity: 0.15, depthWrite: false }));
      pl.rotation.x = -Math.PI / 2; pl.position.y = 0.12;
      restos.add(pl);
      placasMalla.push(pl);
    }
    // el premio, al fondo
    const chispa = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), new THREE.MeshBasicMaterial({ color: '#a6ff6e' }));
    chispa.position.set(0, 0.9, largo - 1.2);
    restos.add(chispa);
    restos.userData.chispa = chispa;
    const columna = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.4, 80, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: '#7dfff0', transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    columna.position.set(0, 40, largo - 1.2);
    restos.add(columna);
    restos.userData.columna = columna;
    restos.traverse((o) => { if (o.isMesh && o !== columna && !placasMalla.includes(o)) o.castShadow = true; });
    restos.visible = false;
    escena.add(restos);
  }
  // Las paredes de la ruina chocan (jugador e invasores). Se agregan al aparecer y se
  // sacan al terminarla, todas juntas por su dueño.
  const DUENIO_RUINA = { ruina: true };
  let ruinaArmada = null;   // { x, z, rot, y, disp, dormidosPuestos, tocado }
  function armarRuina(d) {
    if (ruinaArmada && ruinaArmada.x === d.restos.x && ruinaArmada.z === d.restos.z) return;
    desarmarRuina();
    const y = T.altura(d.restos.x, d.restos.z);
    const rot = Number.isFinite(d.restos.rot) ? d.restos.rot : Math.atan2(api.centroBase().x - d.restos.x, api.centroBase().z - d.restos.z) + Math.PI;
    d.restos.rot = rot;
    const disp = d.restos.disp || (d.restos.disp = disposicionRuina());
    ruinaArmada = { x: d.restos.x, z: d.restos.z, rot, y, disp, dormidosPuestos: !!d.restos.dormidos, tocado: 0 };
    for (const [ax, az, bx, bz] of paredesRuina()) {
      const a = aMundo({ x: ax, z: az }, d.restos.x, d.restos.z, rot), b = aMundo({ x: bx, z: bz }, d.restos.x, d.restos.z, rot);
      api.col?.agregar({ seg: true, ax: a.x, az: a.z, bx: b.x, bz: b.z, r: 0.12, alturaMin: y - 0.5, alturaMax: y + RUINA.alto, duenio: DUENIO_RUINA });
    }
    restos.position.set(d.restos.x, y, d.restos.z);
    restos.rotation.set(0, rot, 0);
    disp.placas.forEach((p, i) => placasMalla[i].position.set(p.x, 0.12, p.z));
  }
  function desarmarRuina() {
    if (!ruinaArmada) return;
    api.col?.eliminarPorDuenio(DUENIO_RUINA);
    ruinaArmada = null;
  }
  function lugarDeRestos() {
    const c = api.centroBase();
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 130;
      const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
      if (Math.abs(x) > LIMITE - 40 || Math.abs(z) > LIMITE - 40 || T.agua(x, z)) continue;
      if ((T.pendiente?.[T.indice(x, z)] ?? 0) > 0.35) continue;
      return { x, z };
    }
    return null;
  }
  function soltarRestos() {
    const d = api.D();
    if (d.restos) return false;
    // Antes de la victoria los restos traen planos; después, señales del nido.
    const faltanPlanos = d.planos.length < PLANOS_ALIEN.length;
    const faltaPista = !!d.nido && !d.nido.caido && !estaRevelado(d.nido);
    if (!faltanPlanos && !faltaPista) return false;
    const p = lugarDeRestos();
    if (!p) return false;
    d.restos = p;
    api.nota('Algo se vino abajo en el bosque', `Un tronco hueco de los duendes ${api.rumboTexto(api.centroBase(), p)}. ${faltanPlanos ? 'Puede haber cosas de duende que sirvan' : 'Puede decirte dónde está la cueva'}, al fondo del tronco: cuidado con los hongos del piso y con lo que duerme adentro (está en el mapa)`, true);
    return true;
  }
  function actualizarRestos(dt, js) {
    const d = api.D();
    restos.visible = !!d.restos;
    if (!d.restos) { desarmarRuina(); return; }
    armarRuina(d);
    const R = ruinaArmada;
    const t = performance.now() / 1000;
    restos.userData.chispa.visible = Math.sin(t * 9) > 0.2;
    restos.userData.columna.material.opacity = 0.07 + Math.sin(t * 1.3) * 0.03;
    const dRuina = Math.hypot(js.pos.x - d.restos.x, js.pos.z - d.restos.z);
    // los dormidos se ponen recién cuando te acercás: si no vas, no hay nadie
    if (!R.dormidosPuestos && dRuina < 40) {
      R.dormidosPuestos = true; d.restos.dormidos = true;
      for (const q of R.disp.dormidos) {
        const w = aMundo(q, R.x, R.z, R.rot);
        const a = api.invocar?.(q.tipo, w.x, w.z);
        if (a) { a.estado = 'dormido'; a.rumbo = R.rot + Math.PI; a.m.g.rotation.y = a.rumbo; }
      }
    }
    // las placas del piso
    R.tocado = Math.max(0, R.tocado - dt);
    R.disp.placas.forEach((p, i) => {
      const activa = placaActiva(t, i * 0.83);
      placasMalla[i].material.opacity = activa ? 0.78 + Math.sin(t * 40) * 0.12 : 0.1;
      if (!activa || R.tocado > 0) return;
      const w = aMundo(p, R.x, R.z, R.rot);
      if (Math.hypot(js.pos.x - w.x, js.pos.z - w.z) < PLACA.radio && Math.abs(js.pos.y - R.y) < 1.2) {
        R.tocado = 1.2;
        api.herirJugador?.(PLACA.dano, { x: w.x, y: R.y, z: w.z });
        efectos?.chispas({ x: js.pos.x, y: R.y + 0.3, z: js.pos.z }, 12);
        sonido.golpeRuido?.({ dur: 0.35, frec: 5200, q: 0.8, vol: 0.3, destino: sonido.bus?.efectos });
        sonido.tono?.({ frec: 120, fin: 60, dur: 0.3, tipo: 'sawtooth', vol: 0.08, destino: sonido.bus?.efectos });
        api.oir?.('descarga', { x: w.x, y: R.y, z: w.z });
      }
    });
    // el premio está al fondo: hay que llegar hasta ahí
    const premio = aMundo(R.disp.premio, R.x, R.z, R.rot);
    if (Math.hypot(js.pos.x - premio.x, js.pos.z - premio.z) > 1.8) return;
    const plano = PLANOS_ALIEN.find((p) => !d.planos.includes(p.id));
    d.restos = null;
    restos.visible = false;
    desarmarRuina();
    if (!plano) {
      // Ya están los tres planos: lo que queda en el casco es una señal del nido.
      if (pistaDeNido()) {
        api.sumarMaterial('cristal', 3);
        efectos?.destello({ x: js.pos.x, y: js.pos.y + 1, z: js.pos.z }, 1.2, '#a6ff6e');
        sonido.juntar?.();
        api.guardar();
      }
      return;
    }
    d.planos.push(plano.id);
    api.sumarMaterial('cristal', 3);
    efectos?.destello({ x: js.pos.x, y: js.pos.y + 1, z: js.pos.z }, 1.2, '#7dfff0');
    sonido.juntar?.();
    api.nota(`Plano recuperado: ${plano.nombre}`, `${plano.texto} Ya se puede construir (O → Defensa). +3 semillas doradas`, true);
    api.guardar();
  }

  // ---------------- la nave nodriza
  let nodriza = null;
  function crearNodriza() {
    const m = api.crearMallaNave();
    m.g.scale.setScalar(4.2);
    const nucleos = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const n = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), new THREE.MeshBasicMaterial({ color: '#ff6a3d' }));
      n.position.set(Math.cos(a) * 4.2, -1.55, Math.sin(a) * 4.2);
      m.g.add(n);
      const aro = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 5, 18), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
      aro.position.copy(n.position); aro.rotation.x = Math.PI / 2;
      m.g.add(aro);
      nucleos.push({ mesh: n, aro, pos: new THREE.Vector3(), radio: 2.9, vida: NUCLEO_VIDA, flash: 0 });
    }
    m.g.visible = false;
    escena.add(m.g);
    return { ...m, nucleos, fase: 'fuera', t: 0, x: 0, z: 0, y: 0, largar: 0, caida: 0 };
  }
  const hudNodriza = api.hudNodriza;   // contenedor DOM (puede faltar en pruebas)
  let barrasNodriza = null;
  function iniciarNodriza() {
    const d = api.D();
    if (!nodriza) nodriza = crearNodriza();
    if (!d.nodriza) d.nodriza = { nucleos: [NUCLEO_VIDA, NUCLEO_VIDA, NUCLEO_VIDA] };
    nodriza.nucleos.forEach((n, i) => { n.vida = d.nodriza.nucleos[i]; n.mesh.visible = n.aro.visible = n.vida > 0; });
    const c = api.centroBase();
    const a = Math.random() * Math.PI * 2;
    nodriza.x = c.x + Math.cos(a) * 42; nodriza.z = c.z + Math.sin(a) * 42;
    nodriza.y = T.altura(nodriza.x, nodriza.z) + 34;
    nodriza.fase = 'llegando'; nodriza.t = 0; nodriza.largar = 6; nodriza.caida = 0;
    nodriza.g.rotation.set(0, 0, 0);
    nodriza.g.visible = true;
    hudNodriza?.classList.remove('oculto');
    api.nota('EL COIHUE VIEJO', 'Reventá sus tres nudos de ámbar: arco, honda, pistola o ballestas', true);
  }
  function retirarNodriza() {
    if (!nodriza || nodriza.fase === 'fuera' || nodriza.fase === 'cayendo') return;
    nodriza.fase = 'yendo'; nodriza.t = 0;
    hudNodriza?.classList.add('oculto');
  }
  function blancos() {
    // La nodriza y el nido nunca están los dos: el nido aparece cuando ella cae.
    if (!nodriza || !nodriza.g.visible || nodriza.fase === 'cayendo') return blancosNido();
    return nodriza.nucleos.filter((n) => n.vida > 0);
  }
  function herirNucleo(n, dano) {
    if (n?.nido) { herirCamara(n, dano); return; }
    // 2.7.3: sin núcleo no hay a quién herir (antes rompía al leer `n.vida`)
    if (!n || !nodriza || n.vida <= 0 || nodriza.fase === 'cayendo') return;
    n.vida = Math.max(0, n.vida - dano);
    n.flash = 1;
    const d = api.D();
    // 2.7.3: si la partida ya no guarda la nodriza (se borró al caer), no se rompe al anotar
    if (d.nodriza) d.nodriza.nucleos = nodriza.nucleos.map((q) => q.vida);
    if (n.vida > 0) return;
    n.mesh.visible = false; n.aro.visible = false;
    efectos?.explosion(n.pos, 6);
    sonido.golpeRuido?.({ dur: 1.5, frec: 120, tipo: 'lowpass', vol: 0.9, destino: sonido.fuente?.(n.pos, 1.5) });
    const quedan = nodriza.nucleos.filter((q) => q.vida > 0).length;
    if (quedan) { api.nota(`Nudo reventado`, `Quedan ${quedan}`, true); return; }
    nodriza.fase = 'cayendo'; nodriza.t = 0;
    hudNodriza?.classList.add('oculto');
    api.alDerrotarNodriza();
  }
  function actualizarNodriza(dt) {
    if (!nodriza || !nodriza.g.visible) return;
    const n = nodriza;
    n.t += dt;
    let y = n.y;
    if (n.fase === 'llegando') {
      y = n.y + Math.max(0, 1 - n.t / 7) ** 2 * 320;
      if (n.t > 7) { n.fase = 'combate'; n.t = 0; }
    } else if (n.fase === 'combate') {
      n.largar -= dt;
      if (n.largar <= 0) { n.largar = 38; api.largarDesde(n.x, n.z); }
    } else if (n.fase === 'yendo') {
      y = n.y + (n.t / 6) ** 2 * 400;
      if (n.t > 6) { n.g.visible = false; n.fase = 'fuera'; }
    } else if (n.fase === 'cayendo') {
      // se escora, pierde altura echando humo y se estrella lejos de la base
      y = n.y - n.t * n.t * 2.2;
      n.g.rotation.z = Math.min(0.9, n.t * 0.18);
      n.g.rotation.x = Math.min(0.4, n.t * 0.08);
      n.caida -= dt;
      if (n.caida <= 0) { n.caida = 0.35; _v.set(n.x + (Math.random() - 0.5) * 20, y, n.z + (Math.random() - 0.5) * 20); efectos?.explosion(_v, 5); }
      if (y < T.altura(n.x, n.z) + 2) {
        efectos?.explosion({ x: n.x, y: T.altura(n.x, n.z) + 2, z: n.z }, 14);
        sonido.golpeRuido?.({ dur: 3, frec: 80, tipo: 'lowpass', vol: 1, destino: sonido.bus?.efectos });
        n.g.visible = false; n.fase = 'fuera';
        api.D().nodriza = null;
        return;
      }
    }
    n.g.position.set(n.x, y + Math.sin(n.t * 0.6) * 0.8, n.z);
    if (n.fase !== 'cayendo') n.g.rotation.y += dt * 0.12;
    n.g.updateMatrixWorld(true);
    const ahora = performance.now();
    for (const q of n.nucleos) {
      q.mesh.getWorldPosition(q.pos);
      q.flash = Math.max(0, q.flash - dt * 4);
      const pulso = 0.5 + Math.sin(ahora / 180) * 0.5;
      q.mesh.material.color.setRGB(1, 0.35 + q.flash * 0.65 + pulso * 0.15, 0.2 + q.flash * 0.8);
      q.aro.rotation.z += dt * 2;
    }
    if (hudNodriza && n.fase === 'combate') {
      const barras = barrasNodriza || (barrasNodriza = hudNodriza.querySelectorAll('i'));   // 2.6.1: se buscan una vez
      n.nucleos.forEach((q, i) => { if (barras[i]) barras[i].style.width = `${q.vida / NUCLEO_VIDA * 100}%`; });
    }
  }

  // ---------------- el nido
  // Segundo acto: una cúpula de quitina medio enterrada, con tres cámaras de cría.
  // De día el caparazón se abre y las cámaras quedan a tiro; de noche se cierra y
  // no le entra nada. Las cámaras entran como blancos por el mismo camino que los
  // núcleos de la nodriza, así que todas las armas y las ballestas ya le pegan.
  let nido = null;
  function crearNido() {
    const g = new THREE.Group();
    const cupula = new THREE.Mesh(new THREE.SphereGeometry(6.4, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), lam('#4b4236'));
    cupula.scale.set(1, 0.62, 1);
    cupula.castShadow = cupula.receiveShadow = true;
    g.add(cupula);
    // los gajos del caparazón: se abren de día
    const gajos = [];
    for (let i = 0; i < 5; i++) {
      const gajo = new THREE.Mesh(new THREE.SphereGeometry(6.1, 10, 8, (i / 5) * Math.PI * 2, Math.PI * 2 / 5.6, 0, Math.PI / 2.1), lam('#5b5044'));
      gajo.scale.set(1, 0.66, 1);
      gajo.castShadow = true;
      g.add(gajo);
      gajos.push({ m: gajo, a: (i / 5) * Math.PI * 2 });
    }
    const camaras = [];
    for (let i = 0; i < NIDO.camaras; i++) {
      const a = (i / NIDO.camaras) * Math.PI * 2 + 0.5;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 1), new THREE.MeshBasicMaterial({ color: '#a6ff6e' }));
      // La altura importa y no es decorativa: el rayo de las armas se corta en cuanto
      // toca el suelo (`y < T.altura`), así que una cámara a ras de tierra queda
      // enterrada y no le pega nadie. Van a la altura del pecho, en el hueco de la cúpula.
      m.position.set(Math.cos(a) * 2.6, 3, Math.sin(a) * 2.6);
      g.add(m);
      const aro = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.11, 5, 18),
        new THREE.MeshBasicMaterial({ color: '#7dfff0', transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }));
      aro.position.copy(m.position); aro.rotation.x = Math.PI / 2;
      g.add(aro);
      camaras.push({ nido: true, i, mesh: m, aro, pos: new THREE.Vector3(), radio: 2.2, flash: 0 });
    }
    g.visible = false;
    escena.add(g);
    return { g, camaras, gajos, apertura: 0 };
  }
  // 2.6.1: `blancos()` se pide por tramo de cada flecha en vuelo: sin blancos, la misma
  // lista vacía (congelada) en vez de un arreglo nuevo cada vez
  const SIN_BLANCOS = Object.freeze([]);
  function blancosNido() {
    const d = api.D();
    if (!nido || !d.nido || d.nido.caido) return SIN_BLANCOS;
    if (!estaAbierto(api.horas?.() ?? 12)) return [];       // de noche está cerrado
    return nido.camaras.filter((c) => d.nido.camaras[c.i] > 0);
  }
  function herirCamara(c, dano) {
    const d = api.D();
    const r = danarNido(d.nido, dano, api.horas?.() ?? 12);
    if (!r.ok) return;
    c.flash = 1;
    if (!r.rota) return;
    c.mesh.visible = false; c.aro.visible = false;
    efectos?.explosion(c.pos, 7);
    sonido.golpeRuido?.({ dur: 1.6, frec: 110, tipo: 'lowpass', vol: 0.9, destino: sonido.fuente?.(c.pos, 1.6) });
    if (!r.caido) {
      const quedan = camarasEnteras(d.nido);
      api.nota('Cuna reventada', `Quedan ${quedan}`, true);
      api.guardar?.();
      return;
    }
    api.alCaerNido?.();
  }
  function actualizarNido(dt, js) {
    const d = api.D();
    if (!d.nido || d.nido.caido) { if (nido) nido.g.visible = false; return; }
    if (!estaRevelado(d.nido)) { if (nido) nido.g.visible = false; return; }
    if (!nido) nido = crearNido();
    const lejos = Math.hypot(js.pos.x - d.nido.x, js.pos.z - d.nido.z) > 220;
    nido.g.visible = !lejos;
    if (lejos) return;
    nido.g.position.set(d.nido.x, T.altura(d.nido.x, d.nido.z) - 1, d.nido.z);
    // el caparazón se abre de día y se cierra de noche, con transición
    const abierto = estaAbierto(api.horas?.() ?? 12);
    nido.apertura += ((abierto ? 1 : 0) - nido.apertura) * Math.min(1, dt * 0.7);
    for (const g of nido.gajos) {
      g.m.rotation.z = Math.cos(g.a) * nido.apertura * 0.85;
      g.m.rotation.x = Math.sin(g.a) * nido.apertura * 0.85;
    }
    const t = performance.now() / 1000;
    for (const c of nido.camaras) {
      const viva = d.nido.camaras[c.i] > 0;
      c.mesh.visible = c.aro.visible = viva && nido.apertura > 0.12;
      if (!viva) continue;
      c.mesh.getWorldPosition(c.pos);
      const late = 0.9 + Math.sin(t * 2.2 + c.i) * 0.1;
      c.mesh.scale.setScalar(late * (1 + c.flash * 0.5));
      c.aro.material.opacity = (0.35 + nido.apertura * 0.4) * late;
      if (c.flash > 0) c.flash = Math.max(0, c.flash - dt * 3);
    }
  }
  // Cada resto de nave explorado después de la victoria acota el cerco del nido.
  function pistaDeNido() {
    const d = api.D();
    if (!d.nido || d.nido.caido || estaRevelado(d.nido)) return false;
    sumarPista(d.nido);
    api.nota('Pista de la cueva', textoPista(d.nido), true);
    return true;
  }

  function actualizar(dt, js) {
    actualizarRestos(dt, js);
    actualizarNodriza(dt);
    actualizarNido(dt, js);
  }

  return {
    actualizar, soltarRestos, iniciarNodriza, retirarNodriza, blancos, herirNucleo, pistaDeNido,
    get nodrizaActiva() { return !!nodriza && nodriza.g.visible && nodriza.fase !== 'fuera'; },
    get restos() { return api.D().restos; },
  };
}
