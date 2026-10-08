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
import { armarCoihueViejo, animarCoihue, piesCoihue, COIHUE } from './desafio-coihue-formas.js';
import { registrarLuz } from './luces.js';

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
        // 3.8.0: el hongo del piso que larga las esporas (antes, la descarga de la placa)
        sonido.golpeRuido?.({ dur: 0.6, frec: 1100, q: 0.6, vol: 0.3, destino: sonido.bus?.efectos });
        sonido.tono?.({ frec: 120, fin: 60, dur: 0.3, tipo: 'sine', vol: 0.08, destino: sonido.bus?.efectos });
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
  // 3.8.0: la nodriza es el Coihue Viejo: despierta en el bosque y camina con sus raíces hasta tu base. Los
  // tres núcleos son nudos de ámbar en el tronco (con su aro de luz); los duendes saltan de sus ramas. Si
  // se los rompés se viene abajo; si amanece, se queda plantado donde está y es el mismo del asedio (ver
  // desafio-asedio-mundo.js: `api.coihueComun`). Se arma una sola vez, escondido, al cargar el Desafío.
  let nodriza = null;
  const luzNodriza = registrarLuz(new THREE.PointLight(0xffb060, 0, 26, 1.6));   // la de su puerta (al cargar: ver luces.js)
  // de dónde sale, dónde se para (m de tu base) y cuánto tarda
  const COIHUE_NOCHE = { desde: 130, hasta: 52, llegar: 7, irse: 6 };
  // las raíces chocan mientras está parado (cuando camina o se cae, no)
  const DUENIO_COIHUE = { coihueNoche: true };
  let raicesPuestas = false;
  function raices(poner) {
    if (poner === raicesPuestas || !api.col || !nodriza) return;
    raicesPuestas = poner;
    if (!poner) { api.col.eliminarPorDuenio(DUENIO_COIHUE); return; }
    for (const p of piesCoihue(nodriza, nodriza.x, nodriza.z, nodriza.giro)) api.col.agregar({ x: p.x, z: p.z, r: p.r, alturaMin: nodriza.y - 3, alturaMax: nodriza.y + 5, duenio: DUENIO_COIHUE });
  }
  function crearNodriza() {
    const t0 = performance.now();
    const co = armarCoihueViejo();
    co.g.scale.setScalar(COIHUE.escala);
    co.g.rotation.order = 'YXZ';
    co.cuerpo.add(luzNodriza);
    luzNodriza.position.copy(co.farol);
    const nucleos = [];
    for (let i = 0; i < 3; i++) {
      const n = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1).scale(1, 1.25, 0.8), new THREE.MeshBasicMaterial({ color: '#ffa830' }));
      n.position.copy(co.brasas[i]);
      n.lookAt(n.position.x * 2, n.position.y, n.position.z * 2);
      co.cuerpo.add(n);
      const aro = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 5, 18), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
      aro.position.copy(n.position); aro.quaternion.copy(n.quaternion);
      co.cuerpo.add(aro);
      nucleos.push({ mesh: n, aro, pos: new THREE.Vector3(), radio: 2.9, vida: NUCLEO_VIDA, flash: 0 });
    }
    co.g.visible = false;
    escena.add(co.g);
    return { ...co, nucleos, fase: 'fuera', t: 0, x: 0, z: 0, y: 0, largar: 0, caida: 0, giro: 0, ax: 0, az: 0, ms: performance.now() - t0 };
  }
  // 3.8.0: armado al cargar (no a mitad de la partida), y compartido con el asedio
  nodriza = crearNodriza();
  api.coihueComun = nodriza;
  // Dónde se para: cerca de tu base (50-80 m), en un llano sin agua ni obras alrededor y lejos de la vía (adentro
  // se camina sobre el terreno de abajo: tiene que ser parejo). Si no hay, como antes: a 52 m.
  function sitioCoihue(c) {
    let mejor = null, nota = Infinity;
    const a0 = Math.random() * Math.PI * 2;
    for (const r of [56, 64, 50, 72, 80]) for (let i = 0; i < 24; i++) {
      const a = a0 + (i / 24) * Math.PI * 2, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
      if (Math.abs(x) > LIMITE - 60 || Math.abs(z) > LIMITE - 60 || T.agua(x, z)) continue;
      if ((T.distRiel?.[T.indice(x, z)] ?? 999) < 14) continue;
      let peor = 0, malo = false;
      for (const rr of [0, 9, 18, 26]) {
        const n = rr ? 8 : 1;
        for (let k = 0; k < n && !malo; k++) {
          const b = (k / n) * Math.PI * 2, px = x + Math.cos(b) * rr, pz = z + Math.sin(b) * rr;
          if (T.agua(px, pz) || (rr <= 18 && api.obraEnPunto?.(px, T.altura(px, pz) + 0.5, pz))) malo = true;
          const gx = (T.altura(px + 1.5, pz) - T.altura(px - 1.5, pz)) / 3, gz = (T.altura(px, pz + 1.5) - T.altura(px, pz - 1.5)) / 3;
          peor = Math.max(peor, Math.hypot(gx, gz));
        }
      }
      if (malo) continue;
      const q = peor + Math.abs(r - 60) * 0.002;
      if (q < nota) { nota = q; mejor = { x, z, a }; }
    }
    if (mejor) return mejor;
    const a = Math.random() * Math.PI * 2;
    return { x: c.x + Math.cos(a) * COIHUE_NOCHE.hasta, z: c.z + Math.sin(a) * COIHUE_NOCHE.hasta, a };
  }
  const hudNodriza = api.hudNodriza;   // contenedor DOM (puede faltar en pruebas)
  let barrasNodriza = null;
  function iniciarNodriza() {
    const d = api.D();
    if (!d.nodriza) d.nodriza = { nucleos: [NUCLEO_VIDA, NUCLEO_VIDA, NUCLEO_VIDA] };
    nodriza.nucleos.forEach((n, i) => { n.vida = d.nodriza.nucleos[i]; n.mesh.visible = n.aro.visible = n.vida > 0; });
    const c = api.centroBase();
    const s = sitioCoihue(c);
    nodriza.x = s.x; nodriza.z = s.z;
    nodriza.y = T.altura(nodriza.x, nodriza.z);
    // de dónde viene (del bosque, de más afuera) y adónde mira (a tu base)
    const l = Math.hypot(s.x - c.x, s.z - c.z) || 1;
    nodriza.ax = (s.x - c.x) / l; nodriza.az = (s.z - c.z) / l;
    nodriza.giro = Math.atan2(-nodriza.ax, -nodriza.az);
    nodriza.fase = 'llegando'; nodriza.t = 0; nodriza.largar = 6; nodriza.caida = 0;
    nodriza.g.rotation.set(0, nodriza.giro, 0);
    nodriza.g.visible = true;
    hudNodriza?.classList.remove('oculto');
    api.nota('EL COIHUE VIEJO', 'Reventá sus tres nudos de ámbar: arco, honda, pistola o ballestas', true);
  }
  function retirarNodriza() {
    raices(false);   // 3.8.0: (también si el Desafío se cierra con el Coihue parado)
    if (!nodriza || nodriza.fase === 'fuera' || nodriza.fase === 'cayendo' || nodriza.fase === 'plantado') return;
    // 3.8.0: al alba ya no se va al bosque: se queda plantado donde está (el asedio lo toma desde ahí)
    nodriza.fase = 'plantado'; nodriza.t = 0; luzNodriza.intensity = 0;
    for (const q of nodriza.nucleos) q.mesh.visible = q.aro.visible = false;
    hudNodriza?.classList.add('oculto');
  }
  function blancos() {
    // La nodriza y el nido nunca están los dos: el nido aparece cuando ella cae.
    if (!nodriza || !nodriza.g.visible || nodriza.fase === 'cayendo' || nodriza.fase === 'plantado' || nodriza.fase === 'fuera') return blancosNido();
    return nodriza.nucleos.filter((n) => n.vida > 0);
  }
  function herirNucleo(n, dano) {
    if (n?.nido) { herirCamara(n, dano); return; }
    // 2.7.3: sin núcleo no hay a quién herir (antes rompía al leer `n.vida`)
    if (!n || !nodriza || n.vida <= 0 || nodriza.fase === 'cayendo' || nodriza.fase === 'plantado') return;
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
    if (!nodriza || !nodriza.g.visible || nodriza.fase === 'plantado') return;   // (plantado: lo maneja el asedio)
    const n = nodriza;
    n.t += dt;
    n.reloj = (n.reloj || 0) + dt;
    // 3.8.0: el Coihue no vuela: camina desde el bosque (de más afuera) hasta su lugar, mirando a tu base
    let atras = 0, paso = 0;
    if (n.fase === 'llegando') {
      const k = Math.max(0, 1 - n.t / COIHUE_NOCHE.llegar);
      atras = (COIHUE_NOCHE.desde - COIHUE_NOCHE.hasta) * k * (0.35 + 0.65 * k); paso = Math.min(1, k * 4);
      if (n.t > COIHUE_NOCHE.llegar) { n.fase = 'combate'; n.t = 0; }
    } else if (n.fase === 'combate') {
      n.largar -= dt;
      if (n.largar <= 0) { n.largar = 38; api.largarDesde(n.x, n.z); }
      raices(true);
      // de vez en cuando se sacude (los duendes saltan de las ramas: ver largarDesde)
      paso = n.largar > 35 ? 0.5 : 0;
    } else if (n.fase === 'yendo') {
      // al alba vuelve al bosque, de espaldas a tu base
      raices(false);
      atras = (n.t / COIHUE_NOCHE.irse) ** 1.5 * 120; paso = 1;
      n.g.rotation.y = n.giro + Math.PI * Math.min(1, n.t / 1.5);
      if (n.t > COIHUE_NOCHE.irse) { n.g.visible = false; n.fase = 'fuera'; luzNodriza.intensity = 0; }
    } else if (n.fase === 'cayendo') {
      // cruje y se viene abajo para atrás (lejos de tu base), y golpea el suelo con la copa
      raices(false);
      const ang = Math.min(Math.PI / 2 * 0.96, 0.03 * n.t + 0.11 * n.t * n.t);
      n.g.rotation.set(-ang, n.giro, Math.sin(n.t * 2.3) * 0.02);
      paso = 0.6;
      const largo = (n.alto - 6) * COIHUE.escala;
      n.caida -= dt;
      if (n.caida <= 0) { n.caida = 0.35; const k = 0.3 + Math.random() * 0.7; _v.set(n.x + n.ax * Math.sin(ang) * largo * k, n.y + Math.cos(ang) * largo * k, n.z + n.az * Math.sin(ang) * largo * k); efectos?.polvo?.(_v, 10); }
      if (ang >= Math.PI / 2 * 0.96) {
        _v.set(n.x + n.ax * largo * 0.8, T.altura(n.x + n.ax * largo * 0.8, n.z + n.az * largo * 0.8) + 2, n.z + n.az * largo * 0.8);
        efectos?.explosion(_v, 14);
        efectos?.polvo?.(_v, 30);
        sonido.golpeRuido?.({ dur: 3, frec: 80, tipo: 'lowpass', vol: 1, destino: sonido.bus?.efectos });
        n.g.visible = false; n.fase = 'fuera'; luzNodriza.intensity = 0;
        api.D().nodriza = null;
        return;
      }
    }
    const px = n.x + n.ax * atras, pz = n.z + n.az * atras;
    n.g.position.set(px, T.altura(px, pz), pz);
    animarCoihue(n, n.reloj, paso);
    luzNodriza.intensity = 2.4;
    n.g.updateMatrixWorld(true);
    const ahora = performance.now();
    for (const q of n.nucleos) {
      q.mesh.getWorldPosition(q.pos);
      q.flash = Math.max(0, q.flash - dt * 4);
      const pulso = 0.5 + Math.sin(ahora / 180) * 0.5;
      q.mesh.material.color.setRGB(1, 0.38 + q.flash * 0.55 + pulso * 0.12, 0.04 + q.flash * 0.7);   // 3.8.0: ámbar que late
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
    get nodrizaActiva() { return !!nodriza && nodriza.g.visible && nodriza.fase !== 'fuera' && nodriza.fase !== 'plantado'; },
    get coihue() { return nodriza; },   // 3.8.0: el Coihue de la noche final (para las pruebas y las capturas)
    get restos() { return api.D().restos; },
  };
}
