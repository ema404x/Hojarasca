// Jugador en primera persona: caminar, correr, agacharse, saltar, nadar, descansar y mirar con prismáticos
import * as THREE from 'three';
import { VELOCIDAD, ALTURA_OJOS, ALTURA_AGACHADO, LIMITE } from './config.js';

const LIMITE_PENDIENTE = 50 * Math.PI / 180;   // más empinado que esto, se resbala
import { clamp, lerp, smoothstep } from './ruido.js';

export function crearJugador(camara, T, col, opciones) {
  const estado = {
    pos: new THREE.Vector3(0, 0, 0),   // pies
    vel: new THREE.Vector3(),
    yaw: 0, pitch: 0,
    enSuelo: true, vy: 0,
    agachado: false, corriendo: false, nadando: false, sentado: false, zoom: false,
    alturaOjos: ALTURA_OJOS,
    fasePaso: 0, velocidadActual: 0, quieto: 0,
    superficie: 'hojarasca', profAgua: 0,
    enPlataforma: null, enKayak: false, enTren: false,
    // 1.10: arriba del caballo. null a pie; si no, { trote, galope, alto, aguaMax }.
    montado: null,
    saltoPedido: 0, coyote: 0, golpe: 0, resbalando: 0,
  };
  const teclas = new Set();
  let bloqueado = false, arrastrando = false, modoArrastre = !('requestPointerLock' in HTMLElement.prototype) || window.self !== window.top, fallos = 0;
  const eventos = { paso: [], salto: [], chapuzon: [] };

  const lienzo = opciones.lienzo;

  function mirar(dx, dy) {
    const s = opciones.sensibilidad() * (estado.zoom ? 0.35 : 1) * 0.0022;
    estado.yaw -= dx * s;
    const signoY = opciones.invertirY?.() ? -1 : 1;
    estado.pitch = clamp(estado.pitch - dy * s * signoY, -1.45, 1.45);
  }

  document.addEventListener('mousemove', (e) => {
    if (bloqueado) mirar(e.movementX, e.movementY);
    else if (modoArrastre && arrastrando) mirar(e.movementX, e.movementY);
  });
  document.addEventListener('pointerlockchange', () => {
    bloqueado = document.pointerLockElement === lienzo;
    if (bloqueado) fallos = 0;
    if (!bloqueado && !modoArrastre) opciones.alSoltar?.();
  });
  const fallo = () => { fallos++; if (fallos >= 3) { modoArrastre = true; opciones.alBloquear?.(); } };
  document.addEventListener('pointerlockerror', fallo);
  lienzo.addEventListener('mousedown', (e) => {
    if (e.button === 2 && estado.alUsar) estado.alUsar();
    if (modoArrastre) arrastrando = true;
  });
  document.addEventListener('mouseup', (e) => {

    arrastrando = false;
  });
  lienzo.addEventListener('contextmenu', (e) => e.preventDefault());

  // Si el jugador se armó su propio teclado, cada tecla llega traducida a la de fábrica.
  const traducir = (code) => (opciones.traducirTecla ? opciones.traducirTecla(code) : code);
  document.addEventListener('keydown', (e) => {
    if (!opciones.activo()) return;
    const code = traducir(e.code);
    teclas.add(code);
    if (e.repeat) return;
    if (estado.enKayak || estado.enTren) { if (code === 'KeyZ') estado.zoom = true; return; }
    // 2.9: colgado de la tirolesa sólo se mira (y Z para los prismáticos)
    if (estado.enCable) { if (code === 'KeyZ') estado.zoom = true; return; }
    if (estado.montado && (code === 'KeyC' || code === 'ControlLeft' || code === 'Space')) return;
    if (code === 'KeyC' || code === 'ControlLeft') {
      if (estado.agachado) {
        // No se permite ponerse de pie dentro de un entrepiso, una mesa baja
        // o cualquier plataforma que deje menos altura que el cuerpo completo.
        if (col.espacioVerticalLibre(estado.pos.x, estado.pos.z, estado.pos.y, ALTURA_OJOS)) estado.agachado = false;
      } else estado.agachado = true;
    }
    if (code === 'Space') estado.saltoPedido = 0.16;   // se recuerda un instante
    if (code === 'KeyZ') estado.zoom = true;
  });
  document.addEventListener('keyup', (e) => {
    const code = traducir(e.code);
    teclas.delete(code);
    if (code === 'KeyZ') estado.zoom = false;
  });
  window.addEventListener('blur', () => {
    teclas.clear();
    estado.zoom = false;
    estado.saltoPedido = 0;
    arrastrando = false;
  });

  function pedirBloqueo() {
    if (modoArrastre) { opciones.alBloquear?.(); return; }
    try {
      const r = lienzo.requestPointerLock();
      if (r && r.catch) r.catch(() => {});
    } catch { fallo(); }
  }

  function soltar() { if (document.pointerLockElement) document.exitPointerLock(); }

  function ubicar(x, z, yaw = 0, yGuardada = null) {
    // 2.6.1: un guardado roto (x/z/yaw NaN o texto) no puede dejar al jugador en NaN para siempre
    x = Number.isFinite(Number(x)) ? Number(x) : 0;
    z = Number.isFinite(Number(z)) ? Number(z) : 0;
    yaw = Number.isFinite(Number(yaw)) ? Number(yaw) : 0;
    const suelo = T.altura(x, z);
    // Saves nuevos conservan la cota vertical. Esto es imprescindible para
    // entrepisos/terrazas: antes una partida guardada en el segundo piso
    // reaparecía sobre la plataforma más baja del mismo X/Z.
    let y;
    // 3.0.1: sin cota (null o nada) no es «a la altura 0»: Number(null) da 0, y quien llamaba
    // sin y (la puerta del refugio, la base del Desafío) aparecía sobre el terreno aunque
    // arriba hubiera un piso; adentro de un edificio, las plataformas lo expulsaban afuera.
    if (yGuardada !== null && yGuardada !== undefined && yGuardada !== '' && Number.isFinite(Number(yGuardada))) {
      y = Math.max(suelo, Number(yGuardada));
    } else {
      // Compatibilidad con saves antiguos sin Y: si hay tablones superpuestos,
      // se aparece sobre el más bajo en vez de arriba de una torre.
      const plat = col.plataformaBaja(x, z);
      // (quien llama sin cota, sobre el agua, sigue apareciendo en la superficie, como antes)
      y = Math.max(suelo, plat ? plat.alto : -1e9, yGuardada === null ? 0 : -1e9);
    }
    estado.pos.set(x, y, z);
    estado.yaw = yaw; estado.pitch = 0;
    estado.vel.set(0, 0, 0);
  }

  function sentarse(valor) {
    estado.sentado = valor;
    estado.vel.set(0, 0, 0);
  }

  const adelante = new THREE.Vector3(), derecha = new THREE.Vector3(), deseo = new THREE.Vector3();
  // 2.6.1: consulta de teclas del kayak creada una sola vez (antes, una clausura por cuadro)
  let activoCuadro = false;
  const teclaKayak = (c) => activoCuadro && teclas.has(c);

  function actualizar(dt) {
    const activo = opciones.activo();
    if (estado.enTren) {
      // arriba del tren solo se mira: el vagón lleva al jugador
      estado.alturaOjos = 1.05;
      const t = performance.now() / 1000;
      const movCam = opciones.movimientoCamara?.() === 'reducido' ? 0.18 : 1;
      camara.position.set(estado.pos.x, estado.pos.y + 1.05 + Math.sin(t * 6) * 0.012 * movCam, estado.pos.z);
      camara.rotation.order = 'YXZ';
      camara.rotation.y = estado.yaw; camara.rotation.x = estado.pitch; camara.rotation.z = Math.sin(t * 2.1) * 0.006 * movCam;
      const fovBase = opciones.fov?.() || 70;
      const fovT = estado.zoom ? 22 : fovBase;
      if (Math.abs(camara.fov - fovT) > 0.05) { camara.fov = lerp(camara.fov, fovT, 1 - Math.exp(-7 * dt)); camara.updateProjectionMatrix(); }
      estado.superficie = 'madera'; estado.nadando = false; estado.sentado = false; estado.enSuelo = true;
      return;
    }
    // 2.9: colgado de la tirolesa: el cable lleva al jugador (ver tirolesa.js, `andar`)
    if (estado.enCable) {
      opciones.alCable?.(dt);
      if (estado.enCable) {
        estado.alturaOjos = 1.62;
        const t = performance.now() / 1000;
        const movCam = opciones.movimientoCamara?.() === 'reducido' ? 0.18 : 1;
        const vaiven = Math.min(1, (estado.velocidadActual || 0) / 8);
        camara.position.set(estado.pos.x, estado.pos.y + 1.62, estado.pos.z);
        camara.rotation.order = 'YXZ';
        camara.rotation.y = estado.yaw; camara.rotation.x = estado.pitch; camara.rotation.z = Math.sin(t * 2.3) * 0.02 * vaiven * movCam;
        const fovBase = opciones.fov?.() || 70;
        const fov = estado.zoom ? 22 : fovBase;
        if (Math.abs(camara.fov - fov) > 0.05) { camara.fov = lerp(camara.fov, fov, 1 - Math.exp(-7 * dt)); camara.updateProjectionMatrix(); }
        estado.superficie = 'aire'; estado.nadando = false; estado.sentado = false; estado.enSuelo = false;
        estado.vel.set(0, 0, 0); estado.vy = 0;
        return;
      }
    }
    if (estado.enKayak) {
      activoCuadro = activo;
      // 2.9: arriba del velero (que también es `enKayak`) manda el velero
      if (estado.enVela && opciones.alVela) opciones.alVela(dt, teclaKayak);
      else opciones.alKayak(dt, teclaKayak);
      estado.alturaOjos = 0.95;
      const t = performance.now() / 1000;
      const movCam = opciones.movimientoCamara?.() === 'reducido' ? 0.18 : 1;
      camara.position.set(estado.pos.x, 0.92 + Math.sin(t * 1.4) * 0.03 * movCam, estado.pos.z);
      camara.rotation.order = 'YXZ';
      camara.rotation.y = estado.yaw; camara.rotation.x = estado.pitch; camara.rotation.z = Math.sin(t * 1.1) * 0.012 * movCam;
      const fovBase = opciones.fov?.() || 70;
      const fov = estado.zoom ? 22 : fovBase;
      if (Math.abs(camara.fov - fov) > 0.05) { camara.fov = lerp(camara.fov, fov, 1 - Math.exp(-7 * dt)); camara.updateProjectionMatrix(); }
      estado.superficie = 'agua'; estado.nadando = false; estado.sentado = false; estado.enSuelo = true;
      return;
    }
    let mx = 0, mz = 0;
    if (activo) {
      if (teclas.has('KeyW') || teclas.has('ArrowUp')) mz += 1;
      if (teclas.has('KeyS') || teclas.has('ArrowDown')) mz -= 1;
      if (teclas.has('KeyA') || teclas.has('ArrowLeft')) mx -= 1;
      if (teclas.has('KeyD') || teclas.has('ArrowRight')) mx += 1;
    }
    if (estado.sentado && (mx || mz)) sentarse(false);
    estado.corriendo = teclas.has('ShiftLeft') || teclas.has('ShiftRight');
    if (estado.corriendo && estado.agachado && (mx || mz)
      && col.espacioVerticalLibre(estado.pos.x, estado.pos.z, estado.pos.y, ALTURA_OJOS)) estado.agachado = false;

    adelante.set(-Math.sin(estado.yaw), 0, -Math.cos(estado.yaw));
    derecha.set(Math.cos(estado.yaw), 0, -Math.sin(estado.yaw));

    let vmax = estado.agachado ? VELOCIDAD.agachado : estado.corriendo ? VELOCIDAD.correr : VELOCIDAD.caminar;
    if (estado.nadando) vmax = VELOCIDAD.nadar;
    else if (estado.profAgua > 0.15) vmax *= lerp(1, 0.45, smoothstep(0.15, 1.1, estado.profAgua));
    if (estado.montado) {
      estado.agachado = false;
      vmax = estado.corriendo ? estado.montado.galope : estado.montado.trote;
      if (estado.profAgua > 0.15) vmax *= lerp(1, 0.5, smoothstep(0.15, 0.9, estado.profAgua));
    }
    if (estado.zoom) vmax *= 0.5;
    // 2.3: después de una noche de invierno sin fuego, el cuerpo tarda en arrancar
    if (estado.entumecido > 0 && !estado.montado) vmax *= 1 - 0.25 * Math.min(1, estado.entumecido);
    // 2.4: después de una buena noche en una casa con confort, un poco más liviano
    else if (estado.descansado > 0 && !estado.montado) vmax *= 1.08;
    if (estado.sentado) vmax = 0;

    deseo.set(0, 0, 0).addScaledVector(adelante, mz).addScaledVector(derecha, mx);
    if (deseo.lengthSq() > 1) deseo.normalize();
    deseo.multiplyScalar(vmax);

    // el terreno bajo los pies: cuánto inclina y hacia dónde cae
    const n = T.normal(estado.pos.x, estado.pos.z);
    const inclinacion = Math.acos(clamp(n.y, -1, 1));               // 0 = llano
    // sobre tablones, escalones o andenes no se resbala, por más pendiente que tenga el terreno
    const platAhora = col.plataformaEn(estado.pos.x, estado.pos.z, estado.pos.y + 0.2, 0.03);
    const sueloAhora = T.altura(estado.pos.x, estado.pos.z);   // 2.6.1: una sola consulta al terreno
    const sobreTablas = (!!platAhora && estado.pos.y > platAhora.alto - 0.7)
      || estado.pos.y > sueloAhora + 0.25;   // apoyado en algo, no en la ladera
    const resbala = !estado.nadando && !sobreTablas && inclinacion > LIMITE_PENDIENTE;
    if (deseo.lengthSq() > 0.01) {
      // cuesta arriba cuesta más, y por encima del límite no se sube
      const x2 = estado.pos.x + deseo.x * 0.5, z2 = estado.pos.z + deseo.z * 0.5;
      const pend = (T.altura(x2, z2) - sueloAhora) / (0.5 * Math.hypot(deseo.x, deseo.z) + 1e-4);
      deseo.multiplyScalar(clamp(1 - Math.max(0, pend - 0.15) * 0.9, 0.25, 1));
      if (resbala) {
        // solo se puede avanzar de costado o hacia abajo
        const cuesta = deseo.x * n.x + deseo.z * n.z;   // positivo si va cuesta abajo
        if (cuesta < 0) { deseo.x -= n.x * cuesta * 1.6; deseo.z -= n.z * cuesta * 1.6; }
        deseo.multiplyScalar(0.55);
      }
    }
    // en pendiente fuerte el jugador se desliza hacia abajo
    if (resbala && estado.enSuelo) {
      const fuerza = (inclinacion - LIMITE_PENDIENTE) * 13;
      estado.vel.x += n.x * fuerza * dt;
      estado.vel.z += n.z * fuerza * dt;
      estado.resbalando = Math.min(1, estado.resbalando + dt * 3);
    } else {
      estado.resbalando = Math.max(0, estado.resbalando - dt * 2.5);
    }

    const acel = estado.enSuelo || estado.nadando ? 9 : 2.5;
    estado.vel.x = lerp(estado.vel.x, deseo.x, 1 - Math.exp(-acel * dt));
    estado.vel.z = lerp(estado.vel.z, deseo.z, 1 - Math.exp(-acel * dt));

    const previoX = estado.pos.x, previoZ = estado.pos.z;
    estado.pos.x += estado.vel.x * dt;
    estado.pos.z += estado.vel.z * dt;
    // resolver() ya hace internamente las pasadas necesarias para esquinas y
    // marcos; repetirlo tres veces acá multiplicaba el costo cerca de edificios.
    const antesX = estado.pos.x, antesZ = estado.pos.z;
    const alturaFisica = estado.montado ? ALTURA_OJOS + estado.montado.alto : estado.agachado ? ALTURA_AGACHADO : ALTURA_OJOS;
    const radioFisico = estado.montado ? 0.6 : 0.35;
    col.resolver(estado.pos, radioFisico, alturaFisica);
    // Las plataformas también tienen cantos físicos: un entrepiso demasiado
    // alto para subir no puede atravesarse lateralmente como si no existiera.
    col.resolverPlataformas(estado.pos, radioFisico, alturaFisica, 0.62);
    // 3.0.1: la corrección nunca puede dejarte del otro lado de una pared. El canto de un
    // peldaño empuja hacia su cara más cercana, que puede ser la de afuera: cayendo por el
    // hueco del faro, un peldaño sacaba al jugador a través del muro de la torre y se caía
    // 15 m por fuera. Si entre donde estabas y donde quedaste hay una pared, no te movés.
    // (Las hojas de puerta no cuentan: una que se cierra encima tiene que poder empujarte.)
    if (col.paredEntre && col.paredEntre(previoX, previoZ, estado.pos.x, estado.pos.z, estado.pos.y + 0.2, estado.pos.y + alturaFisica - 0.1, false)) {
      estado.pos.x = previoX; estado.pos.z = previoZ;
    }
    // el caballo no entra al agua honda: se planta en la orilla
    if (estado.montado) {
      const hondo = T.agua(estado.pos.x, estado.pos.z);
      if (hondo && hondo.prof > estado.montado.aguaMax) {
        estado.pos.x = previoX; estado.pos.z = previoZ;
        estado.vel.x = 0; estado.vel.z = 0;
        estado.montado.plantado = 1;
      }
    }
    // si un obstáculo frenó el avance, la velocidad también se frena
    const corregido = Math.hypot(estado.pos.x - antesX, estado.pos.z - antesZ);
    if (corregido > 0.001) {
      const nx = (estado.pos.x - antesX) / corregido, nz = (estado.pos.z - antesZ) / corregido;
      const contra = estado.vel.x * nx + estado.vel.z * nz;
      if (contra < 0) { estado.vel.x -= nx * contra; estado.vel.z -= nz * contra; }
    }
    estado.pos.x = clamp(estado.pos.x, -LIMITE, LIMITE);
    estado.pos.z = clamp(estado.pos.z, -LIMITE, LIMITE);

    // suelo, plataformas y agua
    let suelo = T.altura(estado.pos.x, estado.pos.z);
    // Sólo se permite el step-up automático estando realmente apoyado. En el
    // aire (y sobre todo al saltar) una plataforma por encima de los pies no
    // puede capturar al jugador y teletransportarlo a su cara superior.
    const alturaCuerpo = estado.montado ? ALTURA_OJOS + estado.montado.alto : estado.agachado ? ALTURA_AGACHADO : ALTURA_OJOS;
    // 3.0.1: también un instante después de perder el piso (el mismo `coyote` del salto):
    // si un cuadro deja el centro del cuerpo en la rendija de milímetros entre dos
    // plataformas, `enSuelo` se apaga y con 0,015 el cuerpo ya no se subía a la siguiente
    // y se caía. Con vy ≤ 0 y el tope de 0,62 no se trepan paredes ni se sube saltando.
    const subidaPermitida = (estado.enSuelo || estado.coyote > 0) && estado.vy <= 0 ? 0.62 : 0.015;
    let plat = col.plataformaEn(estado.pos.x, estado.pos.z, estado.pos.y, subidaPermitida);
    if (plat && plat.alto > estado.pos.y + 0.03
      && !col.espacioVerticalLibre(estado.pos.x, estado.pos.z, plat.alto, alturaCuerpo)) {
      // 2.6.1: si el escalón de arriba no deja espacio, se sigue parado en el piso
      // actual. Antes se caía al terreno: un cuadro en el aire, otro en el piso
      // (y sobre un muelle, un chapuzón fantasma).
      plat = col.plataformaEn(estado.pos.x, estado.pos.z, estado.pos.y, 0.015);
    }
    estado.enPlataforma = plat;
    if (plat && plat.alto > suelo) suelo = plat.alto;
    const agua = plat ? null : T.agua(estado.pos.x, estado.pos.z);
    estado.profAgua = agua ? agua.nivel - estado.pos.y : 0;
    const nadabaAntes = estado.nadando;
    estado.nadando = !!agua && agua.prof > 1.4;
    if (estado.nadando && !nadabaAntes) eventos.chapuzon.push(1);

    // salto con algo de tolerancia: sirve justo antes de tocar y justo después de despegar
    estado.saltoPedido = Math.max(0, estado.saltoPedido - dt);
    estado.coyote = estado.enSuelo ? 0.12 : Math.max(0, estado.coyote - dt);
    if (estado.saltoPedido > 0 && estado.coyote > 0 && !estado.sentado && !estado.nadando && estado.resbalando < 0.5) {
      estado.vy = 4.8; estado.enSuelo = false; estado.coyote = 0; estado.saltoPedido = 0;
      eventos.salto.push(1);
    }

    if (estado.nadando) {
      const objetivo = agua.nivel - 1.3;
      estado.pos.y = lerp(estado.pos.y, objetivo, 1 - Math.exp(-3 * dt));
      estado.vy = 0; estado.enSuelo = false;
    } else {
      estado.vy -= 14 * dt;
      const yAntes = estado.pos.y;
      let yDespues = estado.pos.y + estado.vy * dt;
      // Los pisos y peldaños también son sólidos por debajo. Si la cabeza
      // cruza el intradós durante un salto, se detiene ahí en vez de aparecer
      // arriba de la plataforma.
      if (estado.vy > 0) {
        const techo = col.techoEntre(estado.pos.x, estado.pos.z, yAntes + alturaCuerpo, yDespues + alturaCuerpo);
        if (techo) { yDespues = techo.abajo - alturaCuerpo - 0.01; estado.vy = 0; }
      }
      estado.pos.y = yDespues;
      if (estado.pos.y <= suelo) {
        if (!estado.enSuelo && estado.vy < -3) {
          // al caer, las rodillas amortiguan: la cámara se hunde y vuelve
          estado.golpe = Math.min(0.42, (-estado.vy - 3) * 0.055);
          eventos.paso.push(clamp((-estado.vy - 2) * 0.25, 0.4, 1.4));
        }
        estado.pos.y = suelo; estado.vy = 0; estado.enSuelo = true;
      } else if (estado.enSuelo && estado.pos.y - suelo < 0.55 && estado.vy <= 0) {
        // bajar una cuesta sin quedar flotando cuadro por medio
        estado.pos.y = lerp(estado.pos.y, suelo, 1 - Math.exp(-22 * dt));
        if (estado.pos.y - suelo < 0.02) estado.pos.y = suelo;
      } else {
        estado.enSuelo = false;
      }
    }

    // altura de ojos
    const ojos = estado.sentado ? 0.95 : estado.montado ? ALTURA_OJOS + estado.montado.alto : estado.agachado ? ALTURA_AGACHADO : ALTURA_OJOS;
    estado.alturaOjos = lerp(estado.alturaOjos, ojos, 1 - Math.exp(-8 * dt));

    // superficie bajo los pies
    const k = T.indice(estado.pos.x, estado.pos.z);
    if (plat) estado.superficie = 'madera';
    else if (agua && agua.prof > 0.08) estado.superficie = 'agua';
    else if (opciones.invierno() > 0.5) estado.superficie = 'nieve';
    // 2.0: con escarcha, el pasto abierto cruje (bajo el bosque la atajan las copas)
    else if ((estado.escarcha || 0) > 0.35 && T.distSendero[k] >= 1.8 && T.bosque[k] < 0.5) estado.superficie = 'escarcha';
    else if (T.distSendero[k] < 1.8) estado.superficie = 'tierra';
    else if (opciones.otono() > 0.5 && T.bosque[k] > 0.3) estado.superficie = 'hojas';
    else if (T.pasto[k] > 0.5) estado.superficie = 'pasto';
    else estado.superficie = 'hojarasca';

    // balanceo y pasos
    const v = Math.hypot(estado.vel.x, estado.vel.z);
    estado.velocidadActual = v;
    estado.quieto = v < 0.2 ? estado.quieto + dt : 0;
    let bob = 0, balanceo = 0;
    const movCam = opciones.movimientoCamara?.() === 'reducido' ? 0.18 : 1;
    if ((estado.enSuelo || estado.nadando) && v > 0.3) {
      const antes = estado.fasePaso;
      // la zancada depende de cuánto avanzás, así que en pendiente o agachado suena distinto
      estado.fasePaso += estado.nadando ? dt * 2.2 : (v * dt) / (estado.montado ? 1.5 : estado.agachado ? 0.52 : 0.78) * Math.PI;
      if (Math.floor(antes / Math.PI) !== Math.floor(estado.fasePaso / Math.PI)) eventos.paso.push(clamp(v / VELOCIDAD.correr, 0.25, 1));
      const amp = estado.nadando ? 0.05 : estado.montado ? (estado.corriendo ? 0.07 : 0.045) : (estado.corriendo ? 0.055 : 0.032) * (estado.agachado ? 0.6 : 1);
      bob = (Math.abs(Math.sin(estado.fasePaso)) * amp - amp * 0.5) * movCam;
      balanceo = Math.sin(estado.fasePaso) * amp * 0.35 * movCam;
    }

    estado.golpe = Math.max(0, estado.golpe - dt * 1.6);
    const hundido = Math.sin(Math.min(1, estado.golpe / 0.42) * Math.PI) * estado.golpe * (movCam === 1 ? 1 : 0.35);
    camara.position.set(estado.pos.x + derecha.x * balanceo, estado.pos.y + estado.alturaOjos + bob - hundido, estado.pos.z + derecha.z * balanceo);
    camara.rotation.order = 'YXZ';
    camara.rotation.y = estado.yaw;
    camara.rotation.x = estado.pitch;
    camara.rotation.z = -balanceo * 0.15 + estado.resbalando * 0.05 * movCam;
    const fovBase = opciones.fov?.() || 70;
    const fov = estado.zoom ? 22 : estado.corriendo && v > 4 ? Math.min(100, fovBase + 6) : fovBase;
    if (Math.abs(camara.fov - fov) > 0.05) {
      camara.fov = lerp(camara.fov, fov, 1 - Math.exp(-7 * dt));
      camara.updateProjectionMatrix();
    }
  }

  return { estado, actualizar, ubicar, pedirBloqueo, soltar, sentarse, eventos, teclas, bloqueado: () => bloqueado || modoArrastre };
}
