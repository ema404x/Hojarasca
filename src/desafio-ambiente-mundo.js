// 4.8 ambiente: el ambiente de la noche en el mundo (ojos, niebla, luna llena, sombras de antorcha, animales). Las reglas están en
// `desafio-ambiente.js` (puras, con pruebas); acá se las lleva al valle. Sin luces nuevas, sin shaders nuevos a mitad de juego y sin
// crear nada por cuadro:
//   · los ojos que brillan entre los árboles y la brasa de la antorcha robada son puntos de un solo dibujo (13 puntos: seis pares y la
//     brasa) de tamaño fijo en pantalla, así se leen igual a 35 que a 80 metros; el dibujo sólo existe mientras haya algo que mostrar,
//     y se prepara en la carga junto con el resto (como las sombras) para que su programa no se compile en plena noche;
//   · las sombras largas de las antorchas son una sola malla instanciada (como mucho 8 sombras, una llamada), preparada en la
//     carga junto con el resto para que su programa se compile ahí;
//   · la niebla y la luna llena no son objetos: son números (`clima`) que `main.js` le pasa al cielo.
import * as THREE from 'three';
import { LIMITE } from './config.js';
import { rng } from './ruido.js';
import { estaMirando } from './desafio-sentidos.js';
import { HORA_PREVIA, tipoDeNoche, perfilDe, crearAgenda, miedoDe, puntoA, rumboA, seguirMirada, ojosSeApagan, enElCentro, brilloOjos, acercar, objetivoNiebla, objetivoLuna, nieblaExtra, VELOCIDAD_NIEBLA, VELOCIDAD_LUNA, sombraDeAntorcha, FAUNA, avisaElPuesto, avesCallan } from './desafio-ambiente.js';

const N_OJOS = 6, N_SOMBRAS = 8, COLOR_OJO = '#ff5a1c', BRASA = '#ffcf6a', PX_OJO = 18, PX_BRASA = 24, SEP_PX = 28;
const limitar = (v, a, b) => (v < a ? a : v > b ? b : v);

// `ctx`: { T, escena, sonido, S, col, defensas, aliens() → lista viva, D() → estado de la partida, progreso() → { dia, horas }, nota(t, s),
//          musica, centroBase() → { x, z } }
export function crearAmbienteMundo(ctx) {
  const { T, escena, S, col, defensas, musica } = ctx;
  const sonido = ctx.sonido;

  // ---------------------------------------------------------------- los ojos y la brasa
  // Un solo dibujo de puntos de tamaño fijo en pantalla (`sizeAttenuation: false`): dos puntos por par de ojos y uno para la brasa. El
  // espacio entre los dos ojos se calcula para que se vea siempre igual de separado (a 70 m, un par de ojos de verdad no se ve).
  const ojos = [];
  for (let i = 0; i < N_OJOS; i++) ojos.push({ activo: false, edad: 0, vida: 1, mirada: 0, apagando: 0, x: 0, y: 0, z: 0, brillo: 0 });
  const N_PUNTOS = N_OJOS * 2 + 1;
  const posPuntos = new Float32Array(N_PUNTOS * 3), colPuntos = new Float32Array(N_PUNTOS * 3);
  const geoPuntos = new THREE.BufferGeometry();
  geoPuntos.setAttribute('position', new THREE.BufferAttribute(posPuntos, 3));
  geoPuntos.setAttribute('color', new THREE.BufferAttribute(colPuntos, 3));
  const texPunto = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.22, 'rgba(255,255,255,0.8)'); g.addColorStop(0.5, 'rgba(255,255,255,0.2)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const matPuntos = new THREE.PointsMaterial({ size: PX_OJO, map: texPunto, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: false, fog: false });
  const puntos = new THREE.Points(geoPuntos, matPuntos);
  puntos.name = 'ojos-y-brasa';
  puntos.frustumCulled = false; puntos.renderOrder = 5;
  escena.add(puntos);
  // durante la carga queda a la vista, bajo el suelo, para que su programa se compile ahí y no en la primera noche
  posPuntos[1] = -600; colPuntos[0] = colPuntos[1] = colPuntos[2] = 0.01;
  geoPuntos.setDrawRange(0, 1);
  const cOjo = new THREE.Color(COLOR_OJO), cBrasa = new THREE.Color(BRASA), _c = new THREE.Color();
  const brasa = { x: 0, y: 0, z: 0, brillo: 0, visible: false };
  const robo = { activo: false, pendiente: null, t: 0, dx: 0, dz: 0, x: 0, z: 0, risas: 0 };

  // ---------------------------------------------------------------- las sombras largas de las antorchas
  // una malla plana que arranca en los pies y se estira hacia el lado contrario a la antorcha; el degradado está en la textura
  const textura = (() => {
    const c = document.createElement('canvas'); c.width = 32; c.height = 64;
    const x = c.getContext('2d'), im = x.createImageData(32, 64);
    for (let j = 0; j < 64; j++) for (let i = 0; i < 32; i++) {
      const u = Math.abs((i + 0.5) / 16 - 1), v = j / 63;   // u: 0 al medio, 1 en el borde; v: 0 en los pies, 1 en la punta
      const a = Math.pow(1 - v, 1.35) * (1 - u * u) * Math.min(1, v * 14 + 0.4);
      const k = (j * 32 + i) * 4;
      im.data[k] = im.data[k + 1] = im.data[k + 2] = 255; im.data[k + 3] = Math.round(255 * limitar(a, 0, 1));
    }
    x.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c);
    return t;
  })();
  const geoSombra = new THREE.PlaneGeometry(1, 1);
  geoSombra.rotateX(-Math.PI / 2);   // acostada: ancho en x, largo en z
  geoSombra.translate(0, 0, 0.5);    // el origen en los pies, el largo hacia +z
  const matSombra = new THREE.MeshBasicMaterial({ color: 0x020308, map: textura, transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const sombras = new THREE.InstancedMesh(geoSombra, matSombra, N_SOMBRAS);
  sombras.name = 'sombras-antorcha';
  sombras.frustumCulled = false; sombras.renderOrder = 1;
  escena.add(sombras);
  // durante la carga queda a la vista, bajo el suelo, para que su programa se compile ahí y no en la primera noche
  const _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _p = new THREE.Vector3();
  _m.makeScale(1, 1, 1).setPosition(0, -600, 0);
  sombras.setMatrixAt(0, _m); sombras.count = 1; sombras.instanceMatrix.needsUpdate = true;
  let preparada = false;

  // ---------------------------------------------------------------- los animales: lugares fijos del valle
  let puestos = null;
  function armarPuestos() {
    const r = rng(4801), ref = T.lugares?.refugio || { x: 0, z: 0 };
    const lista = [];
    const seco = (x, z) => Math.abs(x) < LIMITE - 60 && Math.abs(z) < LIMITE - 60 && !T.agua(x, z) && T.altura(x, z) > 0.4;
    const llano = (x, z) => { const y = T.altura(x, z); let m = 0; for (const [dx, dz] of [[6, 0], [-6, 0], [0, 6], [0, -6]]) m = Math.max(m, Math.abs(T.altura(x + dx, z + dz) - y)); return m < 1.4; };
    // los teros viven en los bajos mojados: junto al arroyo y el mallín
    const orillas = (T.rio || []).filter((_, i) => i % 2 === 0);
    for (let n = 0, k = 0; n < 3 && k < 80; k++) {
      const p = orillas.length ? orillas[Math.floor(r() * orillas.length)] : T.lugares?.mallin;
      if (!p) break;
      const x = p.x + (r() - 0.5) * 36, z = p.z + (r() - 0.5) * 36;
      if (seco(x, z) && llano(x, z) && Math.hypot(x - ref.x, z - ref.z) > 70) { lista.push({ tipo: 'tero', x, z, ultimo: -999 }); n++; }
    }
    // las vacas, en el pastizal: llano, seco y lejos de la base
    for (let n = 0, k = 0; n < 2 && k < 200; k++) {
      const a = r() * Math.PI * 2, d = 110 + r() * 170, x = ref.x + Math.cos(a) * d, z = ref.z + Math.sin(a) * d;
      if (seco(x, z) && llano(x, z)) { lista.push({ tipo: 'vaca', x, z, ultimo: -999 }); n++; }
    }
    for (const q of lista) q.y = T.altura(q.x, q.z) + 0.6;
    return lista;
  }

  // ---------------------------------------------------------------- estado
  let agenda = null, claveAgenda = '', tipo = 'comun', perfil = perfilDe('comun');
  let reloj = 0, acum2 = 0, acum1 = 0, primero = true, avisoRobo = false, sonidosPedidos = false;
  const clima = { niebla: 0, luna: 0, extra: 0 };
  const salida = { miedo: 0, avance: 0, silencio: false, tipo: 'comun', ojos: 0, antorchaLista: false };
  const secuencias = new Map();    // sec → rumbo de esa secuencia de risitas
  let cerca = 99, nVivos = 0, antorchaCand = null, especialDePrueba = null;
  const antorchas = [];            // las prendidas (se vuelven a mirar una vez por segundo)
  let ultimoAviso = -99;           // el último aviso de un animal (no varios juntos)

  const vivo = (a) => a.estado !== 'morir' && a.estado !== 'irse' && !a.enNave;
  const posDe = (x, z, dy = 1.1) => ({ x, y: T.altura(x, z) + dy, z });

  function reiniciar(nuevoTipo, nocheN) {
    tipo = nuevoTipo; perfil = perfilDe(nuevoTipo);
    agenda = crearAgenda(perfil, Math.random);
    secuencias.clear();
    if (salida.silencio) { salida.silencio = false; sonido?.romperSilencio?.(); }
    robo.activo = false; robo.pendiente = null; brasa.visible = false; brasa.brillo = 0;
    for (const o of ojos) apagarOjos(o, true);
  }
  function apagarOjos(o, ya) {
    if (ya) { o.activo = false; o.brillo = 0; o.apagando = 0; return; }
    o.apagando = 0.0001;
  }

  // ---------------------------------------------------------------- elegir dónde
  const yawDe = (m) => Math.atan2(m.x, m.z);
  function elegirRumbo(js, mira, preferirDuende) {
    if (preferirDuende) {
      const lejos = [];
      for (const a of ctx.aliens()) { if (!vivo(a)) continue; const p = a.m.g.position, d = Math.hypot(p.x - js.pos.x, p.z - js.pos.z); if (d > 22 && d < 110) lejos.push(p); }
      if (lejos.length) return rumboA(js.pos, lejos[Math.floor(Math.random() * lejos.length)]) + (Math.random() - 0.5) * 0.5;
    }
    return Math.random() < 0.65 ? yawDe(mira) + (Math.random() - 0.5) * 1.8 : Math.random() * Math.PI * 2;
  }
  // ¿el terreno tapa la vista entre el jugador y ese punto?
  function tapado(js, x, z, y) {
    const oy = js.pos.y + 1.6;
    for (let k = 1; k <= 5; k++) {
      const t = k / 6, px = js.pos.x + (x - js.pos.x) * t, pz = js.pos.z + (z - js.pos.z) * t, py = oy + (y - oy) * t;
      if (T.altura(px, pz) > py + 0.3) return true;
    }
    return false;
  }
  // ¿un tronco entre vos y los ojos? Se mira cada 2,5 m de la línea, menos los últimos metros (ahí está el árbol del que se asoman)
  function troncoEnMedio(js, x, z, propio) {
    const dx = x - js.pos.x, dz = z - js.pos.z, l = Math.hypot(dx, dz) || 1;
    for (let s = 2.5; s < l - 3; s += 2.5) {
      const px = js.pos.x + dx * s / l, pz = js.pos.z + dz * s / l;
      for (const c of col.cercanos(px, pz)) {
        if (c === propio || c.despejado || c.seg || !(c.r >= 0.2)) continue;
        if (Math.hypot(c.x - px, c.z - pz) < c.r + 0.35) return true;
      }
    }
    return false;
  }
  // un árbol a la distancia y el rumbo pedidos; los ojos asoman de un costado del tronco
  function lugarDeOjos(js, mira, dist, fijo = null) {
    for (let intento = 0; intento < 14; intento++) {
      const rumbo = fijo !== null ? fijo + (Math.random() - 0.5) * 0.12 : elegirRumbo(js, mira, intento < 5), d = dist * (0.85 + Math.random() * 0.3);
      const P = puntoA(js.pos, rumbo, d);
      if (Math.abs(P.x) > LIMITE - 20 || Math.abs(P.z) > LIMITE - 20 || T.agua(P.x, P.z)) continue;
      let mejor = null, dm = 6;
      for (const c of col.cercanos(P.x, P.z)) {
        if (c.despejado || c.seg || !(c.r >= 0.22 && c.r <= 2.6)) continue;
        const dd = Math.hypot(c.x - P.x, c.z - P.z);
        if (dd < dm) { dm = dd; mejor = c; }
      }
      if (!mejor) continue;
      const dx = mejor.x - js.pos.x, dz = mejor.z - js.pos.z, dd = Math.hypot(dx, dz) || 1, lado = Math.random() < 0.5 ? -1 : 1;
      const x = mejor.x + (-dz / dd) * lado * (mejor.r + 0.14), z = mejor.z + (dx / dd) * lado * (mejor.r + 0.14);
      const y = T.altura(x, z) + 1.7 + Math.random() * 0.9;   // a la altura de la cabeza de uno que se asoma: más arriba que el pasto y los arbustos
      if (tapado(js, x, z, y) || troncoEnMedio(js, x, z, mejor)) continue;
      if (ojos.some((o) => o.activo && Math.hypot(o.x - x, o.z - z) < 14)) continue;
      return { x, y, z };
    }
    return null;
  }
  function ponerOjos(js, mira, vida, dist, fijo = null) {
    const o = ojos.find((q) => !q.activo);
    if (!o) return false;
    const lugar = lugarDeOjos(js, mira, dist, fijo);
    if (!lugar) return false;
    o.activo = true; o.edad = 0; o.vida = vida; o.mirada = 0; o.apagando = 0; o.x = lugar.x; o.y = lugar.y; o.z = lugar.z; o.brillo = 0;
    return true;
  }

  // ---------------------------------------------------------------- la antorcha que se llevan
  // una prendida a buen trecho y que no estés mirando: a más de 16 m y fuera de tu campo de visión, o a más de 42
  function buscarAntorcha(js, mira) {
    let mejor = null, dm = 0;
    for (const o of antorchas) {
      if (o.userTitileo > 0) continue;
      const d = Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z);
      if (d < 16 || d > 75) continue;
      if (d < 42 && estaMirando(mira, js.pos, o.datos)) continue;
      if (d > dm) { dm = d; mejor = o; }
    }
    return mejor;
  }
  function llevarseAntorcha(js, mira) {
    const o = buscarAntorcha(js, mira);
    if (!o || !defensas.titilarYApagar?.(o)) return false;
    robo.pendiente = o; robo.t = 0; robo.risas = 0;
    // se va hacia afuera: desde el medio de la base, pasando por la antorcha
    const b = ctx.centroBase?.() || { x: js.pos.x, z: js.pos.z };
    let dx = o.datos.x - b.x, dz = o.datos.z - b.z;
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    robo.dx = dx; robo.dz = dz; robo.x = o.datos.x; robo.z = o.datos.z;
    return true;
  }
  function actualizarRobo(dt, js) {
    if (robo.pendiente && !robo.activo) {
      if (robo.pendiente.datos.apagada) {
        // se apagó (o la apagó la lluvia): la brasa sale con el que se la lleva
        robo.activo = true; robo.t = 0; robo.pendiente = null;
        brasa.visible = true; brasa.brillo = 0; brasa.x = robo.x; brasa.z = robo.z; brasa.y = T.altura(robo.x, robo.z) + 1.05;
        if (!avisoRobo) { avisoRobo = true; ctx.nota?.('Una antorcha se apagó sola', 'Algo anduvo por ahí, y no se vio quién. Acercate y prendela de nuevo con F'); }
        S.risa?.(posDe(robo.x, robo.z, 1.2), 'saltador');
      } else if ((robo.t += dt) > 8) robo.pendiente = null;   // no llegó a apagarse: nada
    }
    if (!robo.activo) return;
    robo.t += dt;
    // corre por el monte, se mece, se achica con la distancia y se apaga
    const v = 5.4;
    robo.x += robo.dx * v * dt; robo.z += robo.dz * v * dt;
    brasa.x = robo.x + Math.sin(robo.t * 2.1) * 0.5 * robo.dz; brasa.z = robo.z - Math.sin(robo.t * 2.1) * 0.5 * robo.dx;
    brasa.y = T.altura(robo.x, robo.z) + 1.05 + Math.abs(Math.sin(robo.t * 5.2)) * 0.22;
    brasa.brillo = (0.8 + 0.2 * Math.sin(robo.t * 31)) * limitar(1 - (robo.t - 5.5) / 2.5, 0, 1) * limitar(robo.t / 0.25, 0, 1);
    if (robo.risas === 0 && robo.t > 2.2) { robo.risas = 1; S.risa?.(posDe(robo.x, robo.z, 1.2), 'saltador'); }
    if (robo.risas === 1 && robo.t > 4.6) { robo.risas = 2; S.crujidoRama?.(posDe(robo.x, robo.z, 0.5), true); }
    if (robo.t > 8) { robo.activo = false; brasa.visible = false; brasa.brillo = 0; }
  }

  // ---------------------------------------------------------------- lo que pide el cronograma
  function elegirDuende(js, desde, hasta) {
    let n = 0, elegido = null;
    for (const a of ctx.aliens()) {
      if (!vivo(a)) continue;
      const p = a.m.g.position, d = Math.hypot(p.x - js.pos.x, p.z - js.pos.z);
      if (d >= desde && d <= hasta && Math.random() * ++n < 1) elegido = a;
    }
    return elegido;
  }
  function atender(ev, js, mira) {
    switch (ev.k) {
      case 'crujido': {
        const P = puntoA(js.pos, elegirRumbo(js, mira, Math.random() < 0.5), ev.dist);
        S.crujidoRama?.(posDe(P.x, P.z, 0.6), ev.doble);
        break;
      }
      case 'risa': {
        // todas las de una secuencia vienen del mismo rumbo; la primera elige hacia dónde (a veces hacia un duende de verdad)
        if (ev.idx === 0 || !secuencias.has(ev.sec)) { if (secuencias.size > 6) secuencias.clear(); secuencias.set(ev.sec, elegirRumbo(js, mira, Math.random() < 0.6)); }
        const P = puntoA(js.pos, secuencias.get(ev.sec), ev.dist);
        const pos = posDe(P.x, P.z, 1.1);
        if (ev.viejo) S.chillido?.(pos, 'rastreador', true); else S.risa?.(pos, 'saltador');
        break;
      }
      case 'silencio': S.silencioRaro?.(16); salida.silencio = true; break;
      case 'silencio-fin': sonido.romperSilencio?.(); salida.silencio = false; break;
      case 'llegada': S.salen?.(); musica?.llegaron?.(1); salida.silencio = false; break;
      case 'ojo': ponerOjos(js, mira, ev.vida, ev.dist); break;
      case 'oirDuende': {
        const h = perfil.oirDuendes, a = elegirDuende(js, h.desde, h.hasta);
        if (!a) break;
        const p = a.m.g.position, pos = { x: p.x, y: p.y + 0.8, z: p.z };
        if (ev.modo === 'pasos') S.pasos?.(pos);
        else if (ev.modo === 'risa') S.chillido?.(pos, a.tipo, !!perfil.viejos);
        else S.respiro?.(pos, a.tipo);
        break;
      }
      case 'antorcha':
        // si en el momento no hay una que se pueda llevar, el cronograma lo vuelve a intentar con la próxima que se vea
        if (!llevarseAntorcha(js, mira)) { if (agenda) agenda.antorcha = false; antorchaCand = null; }
        break;
      default: break;
    }
  }

  // ---------------------------------------------------------------- los ojos y la brasa, cuadro a cuadro
  function actualizarOjos(dt, js, mira) {
    let vivos = 0, n = 0;
    // metros por píxel a esa distancia (la separación entre los dos ojos se calcula para que se vea siempre igual)
    const cam = ctx.camara?.(), tanMitad = cam ? Math.tan(cam.fov * Math.PI / 360) : 0.7, alto = (typeof window !== 'undefined' && window.innerHeight) || 800;
    for (const o of ojos) {
      if (!o.activo) continue;
      o.edad += dt;
      const dist = Math.hypot(o.x - js.pos.x, o.z - js.pos.z);
      // si los mirás un rato, se apagan: no se dejan ver
      _p.set(o.x, o.y, o.z);
      o.mirada = seguirMirada(o.mirada, dist > 8 && enElCentro(mira, js.pos, _p), dt);
      if (!o.apagando && (ojosSeApagan(o.mirada, dist) || o.edad >= o.vida || dist < 9)) {
        o.apagando = 0.0001;
        if (o.edad < o.vida && dist >= 9 && Math.random() < 0.4) S.crujidoRama?.({ x: o.x, y: o.y, z: o.z });   // ya se fue: una ramita
      }
      if (o.apagando) {
        o.apagando += dt / 0.35;
        if (o.apagando >= 1) { apagarOjos(o, true); continue; }
      }
      o.brillo = brilloOjos(o.edad, o.vida, o.apagando) * (0.88 + 0.12 * Math.sin(o.edad * 3.1 + o.x));
      vivos++;
      if (o.brillo < 0.01) continue;
      // los dos ojos, perpendiculares a la línea hacia vos
      const dx = js.pos.x - o.x, dz = js.pos.z - o.z, l = Math.hypot(dx, dz) || 1, sep = (SEP_PX * 2 * l * tanMitad / alto) / 2;
      for (const lado of [-1, 1]) {
        const k = n * 3;
        posPuntos[k] = o.x + (dz / l) * sep * lado; posPuntos[k + 1] = o.y; posPuntos[k + 2] = o.z - (dx / l) * sep * lado;
        _c.copy(cOjo).multiplyScalar(o.brillo * 1.7);
        colPuntos[k] = _c.r; colPuntos[k + 1] = _c.g; colPuntos[k + 2] = _c.b;
        n++;
      }
    }
    salida.ojos = vivos;
    // la brasa, al final (un punto más grande y anaranjado)
    let hayBrasa = false;
    if (brasa.visible && brasa.brillo > 0.01) {
      const k = n * 3;
      posPuntos[k] = brasa.x; posPuntos[k + 1] = brasa.y; posPuntos[k + 2] = brasa.z;
      _c.copy(cBrasa).multiplyScalar(brasa.brillo * 1.7);
      colPuntos[k] = _c.r; colPuntos[k + 1] = _c.g; colPuntos[k + 2] = _c.b;
      n++; hayBrasa = true;
    }
    puntos.visible = n > 0;
    if (n) {
      geoPuntos.setDrawRange(0, n);
      geoPuntos.attributes.position.needsUpdate = true; geoPuntos.attributes.color.needsUpdate = true;
      // (el material es uno solo: la brasa, más grande, pesa lo que su color; el tamaño es el de los ojos)
      matPuntos.size = (hayBrasa && n === 1 ? PX_BRASA : PX_OJO) * limitar(alto / 800, 0.8, 1.8);   // (en pantallas más altas, un poco más grandes)
    }
  }

  // ---------------------------------------------------------------- sombras de antorcha, cuadro a cuadro
  let nSombras = 0;
  function sombraDe(x, z, y, alto, noche) {
    if (nSombras >= N_SOMBRAS || !antorchas.length) return;
    let t = null, dm = 1e9;
    for (const o of antorchas) { const d = Math.hypot(o.datos.x - x, o.datos.z - z); if (d < dm) { dm = d; t = o; } }
    const s = sombraDeAntorcha(dm, alto, noche);
    if (!(s.largo > 0.2)) return;
    // la dirección: desde la antorcha hacia el cuerpo, siguiendo la pendiente del suelo
    const dx = (x - t.datos.x) / dm, dz = (z - t.datos.z) / dm;
    const ex = x + dx * s.largo, ez = z + dz * s.largo;
    const dy = limitar(T.altura(ex, ez) - y, -s.largo * 0.6, s.largo * 0.6);
    _z.set(dx * s.largo, dy, dz * s.largo);                       // largo: de los pies a la punta
    _x.set(dz * s.ancho, 0, -dx * s.ancho);                       // ancho: perpendicular, horizontal
    _y.crossVectors(_z, _x).normalize();
    _m.makeBasis(_x, _y, _z.set(dx * s.largo, dy, dz * s.largo));
    _m.setPosition(x, y + 0.07, z);
    sombras.setMatrixAt(nSombras++, _m);
    matSombra.opacity = Math.max(matSombra.opacity, 0.62 + s.alfa * 0.5);
  }
  function actualizarSombras(js, noche) {
    nSombras = 0;
    matSombra.opacity = 0.45;
    if (noche > 0.3 && antorchas.length) {
      sombraDe(js.pos.x, js.pos.z, T.altura(js.pos.x, js.pos.z), 1.75, noche);
      for (const a of ctx.aliens()) {
        if (nSombras >= N_SOMBRAS) break;
        if (!vivo(a) || a.def?.vuela) continue;
        const p = a.m.g.position;
        if (Math.abs(p.x - js.pos.x) > 45 || Math.abs(p.z - js.pos.z) > 45) continue;
        sombraDe(p.x, p.z, T.altura(p.x, p.z), (a.def?.altura || 1) * (a.m.esc || 1), noche);
      }
    }
    sombras.count = nSombras;
    sombras.visible = nSombras > 0;
    if (nSombras) sombras.instanceMatrix.needsUpdate = true;
  }

  // ---------------------------------------------------------------- los animales que avisan (dos veces por segundo)
  function actualizarFauna(js, noche) {
    if (!puestos) puestos = armarPuestos();
    if (noche < 0.3) return;
    // los pájaros (y los grillos) de alrededor tuyo callan mientras haya duendes cerca; en la noche silenciosa, toda la noche
    if (tipo === 'silenciosa' || (perfil.fauna && nVivos && avesCallan(cerca))) S.callarAves?.(FAUNA.aves.calla);
    if (!perfil.fauna || !nVivos || reloj - ultimoAviso < 6) return;
    for (const q of puestos) {
      const dj = Math.hypot(q.x - js.pos.x, q.z - js.pos.z);
      if (dj > 150 || dj < 18) continue;   // más lejos no se oye; más cerca estaría a la vista
      let m = 1e9;
      for (const a of ctx.aliens()) { if (!vivo(a)) continue; const p = a.m.g.position; const d = Math.hypot(p.x - q.x, p.z - q.z); if (d < m) m = d; }
      if (avisaElPuesto(q.tipo, m, reloj - q.ultimo, noche)) {
        q.ultimo = reloj; ultimoAviso = reloj;
        const pos = { x: q.x, y: q.y, z: q.z };
        if (q.tipo === 'tero') S.teroGrita?.(pos); else S.vacaMuge?.(pos);
        break;
      }
    }
  }

  // ---------------------------------------------------------------- cuadro a cuadro
  // `e`: { activo, fase, horas, noche, vivos, js, mira, especial, nocheN, sinFin, vista, dibujando }
  function actualizar(dt, e) {
    if (!preparada) {
      // el primer cuadro: la sombra de la carga se va, y se encargan los sonidos nuevos a la cola del motor
      preparada = true; sombras.count = 0; sombras.visible = false; puntos.visible = false;
    }
    if (!(dt > 0)) return salida;
    dt = Math.min(dt, 0.25);
    reloj += dt;
    const js = e.js, mira = e.mira;
    if (sonido?.ctx && !sonidosPedidos) { sonidosPedidos = true; S.prepararAmbiente?.(); }

    // el tipo de noche: si cambia (otra noche, o se decidió que es especial), cronograma nuevo
    const nuevo = tipoDeNoche({ noche: e.nocheN, especial: e.especial, sinFin: e.sinFin });
    const clave = `${e.nocheN}|${nuevo}`;
    if (clave !== claveAgenda) { claveAgenda = clave; reiniciar(nuevo, e.nocheN); }

    // niebla y luna: suben despacio con la noche y bajan al alba
    const objN = objetivoNiebla(e.especial), objL = objetivoLuna(e.especial);
    if (primero) {
      primero = false;
      // abrir la partida a media noche: ya está la niebla (o la luna), sin esperar a que suba
      const avanzada = e.noche > 0.6 && (e.fase === 'ataque' || e.fase === 'calma');
      clima.niebla = avanzada ? objN : 0; clima.luna = avanzada ? objL : 0;
    }
    clima.niebla = acercar(clima.niebla, objN, dt, VELOCIDAD_NIEBLA);
    clima.luna = acercar(clima.luna, objL, dt, VELOCIDAD_LUNA);
    clima.extra = nieblaExtra(clima.niebla, e.vista ?? 1);

    // lo que depende de los duendes y de las antorchas se mira unas veces por segundo
    acum1 += dt; acum2 += dt;
    if (acum1 >= 0.5 && e.activo) {
      acum1 = 0;
      let c = 99, n = 0;
      for (const a of ctx.aliens()) {
        if (!vivo(a)) continue;
        n++;
        const p = a.m.g.position, d = Math.hypot(p.x - js.pos.x, p.z - js.pos.z);
        if (d < c) c = d;
      }
      cerca = c; nVivos = n;
      actualizarFauna(js, e.noche);
    }
    if (acum2 >= 1) {
      acum2 = 0;
      antorchas.length = 0;
      if (e.noche > 0.25 || e.fase !== 'calma') for (const o of defensas.prendidas) antorchas.push(o);
      antorchaCand = perfil.antorcha && e.fase === 'ataque' ? buscarAntorcha(js, mira) : null;
    }

    // el cronograma
    const f = e.fase === 'previa' ? limitar(e.horas - HORA_PREVIA, 0, 1) : (e.fase === 'ataque' ? 1 : 0);
    const eventos = agenda.paso(dt, {
      activo: e.activo, fase: e.fase, f, noche: e.noche, vivos: nVivos, cerca, ojos: salida.ojos, antorchaLista: !!antorchaCand,
    });
    for (let i = 0; i < eventos.length; i++) atender(eventos[i], js, mira);

    actualizarOjos(dt, js, mira);
    actualizarRobo(dt, js);
    actualizarSombras(js, e.noche);

    salida.tipo = tipo;
    salida.avance = e.fase === 'previa' ? f : (e.fase === 'ataque' ? 1 : 0);
    salida.miedo = e.activo ? miedoDe(perfil, { fase: e.fase, f, vivos: nVivos, tAtaque: agenda.tAtaque, noche: e.noche }) : 0;
    if (e.fase === 'calma' && e.noche < 0.3) salida.silencio = false;
    return salida;
  }

  function limpiar() {
    for (const o of ojos) apagarOjos(o, true);
    robo.activo = false; robo.pendiente = null; brasa.visible = false; brasa.brillo = 0;
    sombras.count = 0; sombras.visible = false; puntos.visible = false;
    claveAgenda = ''; salida.silencio = false; salida.ojos = 0;
    sonido?.romperSilencio?.();
  }

  return {
    actualizar, limpiar, clima, salida,
    get tipo() { return tipo; },
    get perfil() { return perfil; },
    get ojosVivos() { return salida.ojos; },
    get robo() { return { activo: robo.activo, pendiente: !!robo.pendiente }; },
    get sombrasVivas() { return nSombras; },
    get puestos() { return puestos ? puestos.map((q) => ({ tipo: q.tipo, x: q.x, z: q.z })) : []; },
    agenda: () => agenda,
    // sólo para las pruebas: una noche especial que las reglas todavía no conocen (o forzar una) sin tocar la partida
    get especialDePrueba() { return especialDePrueba; },
    set especialDePrueba(v) { especialDePrueba = typeof v === 'string' ? v : null; },
    // sólo para las pruebas y el diagnóstico: poner a mano un par de ojos / llevarse una antorcha
    _ponerOjos: (js, mira, vida = 10, dist = 50, rumbo = null) => ponerOjos(js, mira, vida, dist, rumbo),
    _llevarseAntorcha: (js, mira) => llevarseAntorcha(js, mira),
    _ojos: () => ojos.filter((o) => o.activo).map((o) => ({ x: o.x, y: o.y, z: o.z, brillo: o.brillo })),
    _brasa: brasa,
    _sombras: sombras,
    _puntos: puntos,
  };
}
