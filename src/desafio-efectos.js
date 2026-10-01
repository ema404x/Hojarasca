// Efectos del Desafío: astillas cuando le pegan a la madera, chispas en la piedra,
// baba verde de los invasores y el barril de resina que revienta.
// Todo sale de pools armados al principio: en plena oleada no se crea nada nuevo,
// sólo se reciclan instancias y mallas que ya están en la escena.
import * as THREE from 'three';

const CALIDAD = { muybaja: 0.5, baja: 0.8, media: 1, alta: 1 };
// pocas mallas sueltas: las inactivas quedan invisibles y no cuestan dibujo
const N_DESTELLOS = 4, N_ANILLOS = 4, N_HUMOS = 6;
const TAU = Math.PI * 2, CUARTO = Math.PI / 2;

// comportamientos de partícula
const ASTILLA = 0, CASCOTE = 1, CHISPA = 2, BABA = 3, LLAMA = 4;

// temporales compartidos: actualizar no pide memoria nunca
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _d = new THREE.Vector3();
const _c = new THREE.Color(), _c2 = new THREE.Color();
const ARRIBA = new THREE.Vector3(0, 1, 0), BLANCO = new THREE.Color(1, 1, 1);
const CERO = new THREE.Matrix4().makeScale(0, 0, 0);

const azar = (a, b) => a + Math.random() * (b - a);
const suave = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const salida = (t) => { const k = 1 - Math.min(1, Math.max(0, t)); return 1 - k * k * k; };

// ---------------------------------------------------------------- pool de partículas (SoA)
function crearPool(n) {
  return {
    n, vivas: 0, alto: -1, nacimientos: 0,
    vivo: new Uint8Array(n), tipo: new Uint8Array(n), rebotes: new Uint8Array(n), quieto: new Uint8Array(n),
    nacido: new Float64Array(n), edad: new Float32Array(n), vida: new Float32Array(n),
    pos: new Float32Array(n * 3), vel: new Float32Array(n * 3),
    rot: new Float32Array(n * 3), giro: new Float32Array(n * 3),
    esc: new Float32Array(n * 3), col: new Float32Array(n * 3),
    grav: new Float32Array(n), roce: new Float32Array(n), suelo: new Float32Array(n), fase: new Float32Array(n),
  };
}

// hueco libre más bajo (mantiene `count` chico); si está lleno, pisa la más vieja
function tomar(P) {
  let i = -1;
  for (let j = 0; j < P.n; j++) if (!P.vivo[j]) { i = j; break; }
  if (i < 0) {
    let min = Infinity;
    for (let j = 0; j < P.n; j++) if (P.nacido[j] < min) { min = P.nacido[j]; i = j; }
  } else P.vivas++;
  P.vivo[i] = 1;
  P.quieto[i] = 0;
  P.nacido[i] = ++P.nacimientos;
  P.edad[i] = 0;
  P.suelo[i] = NaN;
  P.fase[i] = Math.random() * TAU;
  if (i > P.alto) P.alto = i;
  return i;
}

function emitir(P, tipo, x, y, z, vx, vy, vz, vida, sx, sy, sz, r, g, b, grav, roce, rebotes, giroMax) {
  const i = tomar(P), k = i * 3;
  P.tipo[i] = tipo;
  P.vida[i] = vida;
  P.pos[k] = x; P.pos[k + 1] = y; P.pos[k + 2] = z;
  P.vel[k] = vx; P.vel[k + 1] = vy; P.vel[k + 2] = vz;
  P.rot[k] = Math.random() * TAU; P.rot[k + 1] = Math.random() * TAU; P.rot[k + 2] = Math.random() * TAU;
  P.giro[k] = azar(-giroMax, giroMax); P.giro[k + 1] = azar(-giroMax, giroMax); P.giro[k + 2] = azar(-giroMax, giroMax);
  P.esc[k] = sx; P.esc[k + 1] = sy; P.esc[k + 2] = sz;
  P.col[k] = r; P.col[k + 1] = g; P.col[k + 2] = b;
  P.grav[i] = grav;
  P.roce[i] = roce;
  P.rebotes[i] = rebotes;
  return i;
}

function mallaInstanciada(escena, geo, mat, n) {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.frustumCulled = false;
  _c.setRGB(1, 1, 1);
  for (let i = 0; i < n; i++) { m.setMatrixAt(i, CERO); m.setColorAt(i, _c); }
  m.instanceMatrix.needsUpdate = true;
  m.instanceColor.needsUpdate = true;
  m.count = 0;
  m.visible = false;
  escena.add(m);
  return m;
}

// ---------------------------------------------------------------- pools de mallas sueltas
function tomarItem(lista) {
  let libre = null, viejo = null;
  for (let i = 0; i < lista.length; i++) {
    const it = lista[i];
    if (!it.activo) { libre = it; break; }
    if (!viejo || it.nacido < viejo.nacido) viejo = it;
  }
  const it = libre || viejo;
  it.activo = true;
  it.edad = 0;
  it.malla.visible = true;
  return it;
}

export function crearEfectos(escena, opciones = {}) {
  const maxP = Math.max(32, opciones.maxParticulas || 360);
  const factor = CALIDAD[opciones.calidad] ?? 1;
  const cant = (n) => Math.max(1, Math.round(n * factor));
  let reloj = 0, cuadro = 0, nacimientos = 0, ultimoT = null;

  // sólidos (astillas, cascotes) con luz de escena; brillantes aditivos aparte
  const nSol = Math.ceil(maxP * 0.45), nBri = maxP - nSol;
  const solidos = crearPool(nSol), brillos = crearPool(nBri);
  const mallaSol = mallaInstanciada(escena, new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), nSol);
  const mallaBri = mallaInstanciada(escena, new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }), nBri);
  mallaBri.renderOrder = 3;

  // destellos: esferas aditivas que se inflan y se apagan
  const geoEsfera = new THREE.SphereGeometry(1, 18, 12);
  const destellos = [];
  for (let i = 0; i < N_DESTELLOS; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: 0 });
    const malla = new THREE.Mesh(geoEsfera, mat);
    malla.visible = false;
    malla.frustumCulled = false;
    malla.renderOrder = 4;
    escena.add(malla);
    destellos.push({ malla, mat, activo: false, nacido: 0, edad: 0, vida: 1, esc0: 0, esc1: 1, c0: new THREE.Color(), c1: new THREE.Color(), brillo: 1 });
  }

  // anillos en el piso: onda de luz aditiva o mancha de quemado; cada uno trae las dos pieles
  const geoAro = new THREE.RingGeometry(0.8, 1, 48);
  const geoMancha = new THREE.CircleGeometry(1, 32);
  const anillos = [];
  for (let i = 0; i < N_ANILLOS; i++) {
    const matLuz = new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, opacity: 0 });
    const matMancha = new THREE.MeshBasicMaterial({ color: '#150e09', transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const malla = new THREE.Mesh(geoAro, matLuz);
    malla.rotation.x = -Math.PI / 2;
    malla.visible = false;
    malla.frustumCulled = false;
    malla.renderOrder = 2;
    escena.add(malla);
    anillos.push({ malla, matLuz, matMancha, mancha: false, activo: false, nacido: 0, edad: 0, vida: 1, radio: 1, brillo: 1 });
  }

  // humo y polvo: bollos low-poly que suben, crecen y se disuelven
  const geoHumo = new THREE.IcosahedronGeometry(1, 1);
  const humos = [];
  for (let i = 0; i < N_HUMOS; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, depthWrite: false, opacity: 0 });
    const malla = new THREE.Mesh(geoHumo, mat);
    malla.visible = false;
    malla.frustumCulled = false;
    malla.renderOrder = 1;
    escena.add(malla);
    humos.push({ malla, mat, activo: false, nacido: 0, edad: 0, vida: 1, esc0: 0.3, esc1: 1, opac: 0.5, vel: new THREE.Vector3(), giro: 0 });
  }

  const alturaSuelo = (x, z, y) => (ultimoT && ultimoT.altura ? ultimoT.altura(x, z) : y);

  // variación leve de tono: que ninguna tanda salga de un solo color plano
  function variar(base, amp) {
    const f = 1 + azar(-amp, amp);
    _c2.setRGB(base.r * f + azar(-0.02, 0.02), base.g * f + azar(-0.02, 0.02), base.b * f + azar(-0.02, 0.02));
    return _c2;
  }

  // ---------------------------------------------------------------- emisores internos
  function lanzarAstillas(pos, n, color, fuerza) {
    _c.set(color);
    for (let j = 0; j < n; j++) {
      const a = Math.random() * TAU, h = azar(1.2, 4) * fuerza, v = variar(_c, 0.18);
      emitir(solidos, ASTILLA, pos.x + azar(-0.12, 0.12), pos.y + azar(-0.1, 0.1), pos.z + azar(-0.12, 0.12),
        Math.cos(a) * h, azar(1.6, 4.6) * fuerza, Math.sin(a) * h, azar(2.6, 3.6),
        azar(0.022, 0.04), azar(0.018, 0.03), azar(0.1, 0.28), v.r, v.g, v.b, 13, 0.7, 1, 16);
    }
  }
  function lanzarChispas(pos, n, vMin, vMax) {
    for (let j = 0; j < n; j++) {
      // dirección al azar con sesgo hacia arriba
      _d.set(azar(-1, 1), azar(-0.2, 1.2), azar(-1, 1)).normalize().multiplyScalar(azar(vMin, vMax));
      const s = azar(0.02, 0.034);
      emitir(brillos, CHISPA, pos.x, pos.y, pos.z, _d.x, _d.y, _d.z, azar(0.3, 0.6),
        s, s, s, 1, azar(0.8, 0.95), azar(0.38, 0.6), 9.8, 1.1, 1, 0);
    }
  }
  function lanzarLlamas(pos, n, abre, fuerza) {
    for (let j = 0; j < n; j++) {
      const s = azar(0.07, 0.13) * fuerza;
      emitir(brillos, LLAMA, pos.x + azar(-abre, abre), pos.y + azar(0, 0.1), pos.z + azar(-abre, abre),
        azar(-0.35, 0.35) * fuerza, azar(1.1, 2.4) * fuerza, azar(-0.35, 0.35) * fuerza, azar(0.35, 0.7),
        s, s * 1.5, s, 1, azar(0.82, 0.95), azar(0.45, 0.6), -2.6, 2.2, 0, 3);
    }
  }
  function lanzarGotas(pos, n, colorA, colorB, subir) {
    for (let j = 0; j < n; j++) {
      const a = Math.random() * TAU, h = subir ? azar(0.2, 0.8) : azar(1.4, 4.2);
      const v = variar(Math.random() < 0.65 ? colorA : colorB, 0.12), s = azar(0.035, 0.07);
      emitir(brillos, BABA, pos.x + azar(-0.08, 0.08), pos.y + azar(-0.05, 0.1), pos.z + azar(-0.08, 0.08),
        Math.cos(a) * h, subir ? azar(0.8, 2) : azar(1.4, 4), Math.sin(a) * h, subir ? azar(0.5, 0.85) : azar(0.55, 0.95),
        s, s, s, v.r, v.g, v.b, subir ? -1.2 : 11, subir ? 1.6 : 0.6, 0, 2);
    }
  }
  function soltarHumo(x, y, z, color, opac, esc0, esc1, vida, sube, abre) {
    const h = tomarItem(humos);
    h.nacido = ++nacimientos;
    h.vida = vida;
    h.esc0 = esc0; h.esc1 = esc1; h.opac = opac;
    h.vel.set(azar(-abre, abre), sube, azar(-abre, abre));
    h.giro = azar(-0.6, 0.6);
    h.mat.color.set(color);
    h.mat.opacity = 0;
    h.malla.position.set(x, y, z);
    h.malla.rotation.set(Math.random() * TAU, Math.random() * TAU, 0);
    h.malla.scale.setScalar(esc0);
  }
  function soltarDestello(x, y, z, colorIni, colorFin, esc0, esc1, vida, brillo) {
    const d = tomarItem(destellos);
    d.nacido = ++nacimientos;
    d.vida = vida; d.esc0 = esc0; d.esc1 = esc1; d.brillo = brillo;
    d.c0.set(colorIni); d.c1.set(colorFin);
    d.mat.color.copy(d.c0);
    d.mat.opacity = brillo;
    d.malla.position.set(x, y, z);
    d.malla.scale.setScalar(esc0);
  }
  function soltarAnillo(x, z, y, color, radio, vida, mancha, brillo) {
    const a = tomarItem(anillos);
    a.nacido = ++nacimientos;
    a.vida = vida; a.radio = radio; a.brillo = brillo; a.mancha = mancha;
    a.malla.geometry = mancha ? geoMancha : geoAro;
    a.malla.material = mancha ? a.matMancha : a.matLuz;
    if (!mancha) a.matLuz.color.set(color);
    a.malla.material.opacity = mancha ? 0 : brillo;
    a.malla.position.set(x, alturaSuelo(x, z, y) + (mancha ? 0.035 : 0.06), z);
    a.malla.scale.setScalar(0.05);
  }

  // ---------------------------------------------------------------- API pública
  const verde = new THREE.Color('#a6ff6e'), turquesa = new THREE.Color('#7dfff0'), tinte = new THREE.Color();

  function astillas(pos, n = 10, color = '#8a6b4a') { lanzarAstillas(pos, cant(n), color, 1); }

  function chispas(pos, n = 12) { lanzarChispas(pos, cant(n), 3.5, 8.5); }

  function polvo(pos, n = 8, color = '#9a9186') {
    _c.set(color);
    const m = cant(n);
    for (let j = 0; j < m; j++) {
      const a = Math.random() * TAU, h = azar(0.8, 2.6), v = variar(_c, 0.2), s = azar(0.03, 0.075);
      emitir(solidos, CASCOTE, pos.x + azar(-0.1, 0.1), pos.y + azar(-0.08, 0.08), pos.z + azar(-0.1, 0.1),
        Math.cos(a) * h, azar(1, 3.4), Math.sin(a) * h, azar(1.8, 2.6), s, s * azar(0.6, 1), s * azar(0.7, 1.2), v.r, v.g, v.b, 12, 0.9, 1, 10);
    }
    // la nube: clara, baja y lenta
    const puffs = factor < 1 ? 1 : 1 + (n >= 8 ? 1 : 0);
    for (let j = 0; j < puffs; j++) {
      soltarHumo(pos.x + azar(-0.15, 0.15), pos.y + azar(-0.05, 0.1), pos.z + azar(-0.15, 0.15),
        color, 0.3, azar(0.18, 0.3), azar(0.8, 1.2), azar(0.9, 1.3), azar(0.25, 0.5), 0.3);
    }
  }

  function sangre(pos, n = 8) { lanzarGotas(pos, cant(n), verde, turquesa, false); }

  function destello(pos, escala = 1, color = '#a6ff6e') {
    tinte.set(color);
    _c.copy(tinte).lerp(BLANCO, 0.55);
    soltarDestello(pos.x, pos.y, pos.z, _c, tinte, 0.15 * escala, 1.1 * escala, 0.6, 0.95);
    soltarAnillo(pos.x, pos.z, pos.y, tinte, 1.9 * escala, 0.6, false, 0.9);
    // motas que suben como si el cuerpo se evaporara
    lanzarGotas(pos, cant(6), tinte, tinte, true);
  }

  function explosion(pos, radio = 4) {
    const y = pos.y + radio * 0.12;
    soltarDestello(pos.x, y, pos.z, '#fff3c4', '#ff6a14', radio * 0.12, radio * 0.55, 0.7, 1);
    soltarAnillo(pos.x, pos.z, pos.y, '#ffb050', radio * 1.15, 0.55, false, 0.85);
    soltarAnillo(pos.x, pos.z, pos.y, null, radio * 0.55, 7, true, 0.72);
    const humo = cant(5);
    for (let j = 0; j < humo; j++) {
      soltarHumo(pos.x + azar(-0.3, 0.3) * radio * 0.3, y + azar(0, 0.3), pos.z + azar(-0.3, 0.3) * radio * 0.3,
        j & 1 ? '#221d19' : '#2e2721', 0.62, radio * azar(0.08, 0.14), radio * azar(0.38, 0.55), azar(2.4, 3.4), azar(1.1, 2.2), 0.5);
    }
    lanzarChispas(pos, cant(28), 5, 13);
    lanzarAstillas(pos, cant(14), '#6b4a2e', 1.7);
    lanzarLlamas(pos, cant(16), radio * 0.18, 1.6);
  }

  function fuego(pos, intensidad = 1) {
    const k = Math.max(0.2, intensidad);
    lanzarLlamas(pos, cant(Math.round(7 * k)), 0.08 * k, k);
    // alguna brasa que se escapa hacia arriba
    const brasas = cant(Math.round(2 * k));
    for (let j = 0; j < brasas; j++) {
      const s = azar(0.015, 0.025);
      emitir(brillos, CHISPA, pos.x + azar(-0.05, 0.05), pos.y + 0.1, pos.z + azar(-0.05, 0.05),
        azar(-0.5, 0.5), azar(1.5, 3) * k, azar(-0.5, 0.5), azar(0.5, 0.9), s, s, s, 1, azar(0.6, 0.8), 0.25, 1.5, 1.2, 0, 0);
    }
  }

  // ---------------------------------------------------------------- simulación
  function paso(P, malla, dt, T) {
    const mat = malla.instanceMatrix.array, col = malla.instanceColor.array;
    let alto = -1, cambio = false;
    for (let i = 0; i <= P.alto; i++) {
      if (!P.vivo[i]) continue;
      cambio = true;
      const k = i * 3, tipo = P.tipo[i];
      P.edad[i] += dt;
      if (P.edad[i] >= P.vida[i]) {
        P.vivo[i] = 0;
        P.vivas--;
        CERO.toArray(mat, i * 16);
        continue;
      }
      alto = i;
      let x = P.pos[k], y = P.pos[k + 1], z = P.pos[k + 2];
      let vx = P.vel[k], vy = P.vel[k + 1], vz = P.vel[k + 2];
      if (!P.quieto[i]) {
        const roce = Math.exp(-P.roce[i] * dt);
        vx *= roce; vz *= roce;
        vy = vy * roce - P.grav[i] * dt;
        x += vx * dt; y += vy * dt; z += vz * dt;
        P.rot[k] += P.giro[k] * dt; P.rot[k + 1] += P.giro[k + 1] * dt; P.rot[k + 2] += P.giro[k + 2] * dt;
        // el piso se consulta cada tanto: cambia poco entre cuadros
        if (tipo !== LLAMA) {
          if (Number.isNaN(P.suelo[i]) || ((cuadro + i) & 3) === 0) P.suelo[i] = T && T.altura ? T.altura(x, z) : -Infinity;
          const piso = P.suelo[i] + P.esc[k + 1] * 0.5;
          if (y < piso && vy < 0) {
            y = piso;
            if (P.rebotes[i] > 0 && vy < -1.2) {
              P.rebotes[i]--;
              vy = -vy * (tipo === CHISPA ? 0.35 : 0.3);
              vx *= 0.55; vz *= 0.55;
              P.giro[k] *= 0.5; P.giro[k + 1] *= 0.5; P.giro[k + 2] *= 0.5;
            } else {
              // se queda en el piso y se apaga de a poco
              P.quieto[i] = 1;
              vx = vy = vz = 0;
              const resto = tipo === CHISPA ? 0.12 : tipo === BABA ? azar(0.45, 0.7) : azar(0.9, 1.6);
              P.vida[i] = Math.min(P.vida[i], P.edad[i] + resto);
            }
          }
        }
        P.pos[k] = x; P.pos[k + 1] = y; P.pos[k + 2] = z;
        P.vel[k] = vx; P.vel[k + 1] = vy; P.vel[k + 2] = vz;
      } else if (tipo === ASTILLA || tipo === CASCOTE) {
        // se acomoda de plano en vez de quedar parada en una punta
        const f = Math.min(1, dt * 12);
        P.rot[k] += (Math.round(P.rot[k] / CUARTO) * CUARTO - P.rot[k]) * f;
        P.rot[k + 2] += (Math.round(P.rot[k + 2] / CUARTO) * CUARTO - P.rot[k + 2]) * f;
      }

      const u = P.edad[i] / P.vida[i], quedan = P.vida[i] - P.edad[i];
      let sx = P.esc[k], sy = P.esc[k + 1], sz = P.esc[k + 2], luz = 1;
      let r = P.col[k], g = P.col[k + 1], b = P.col[k + 2];
      _p.set(x, y, z);

      if (tipo === ASTILLA || tipo === CASCOTE) {
        const f = suave(quedan / 0.45) * Math.min(1, P.edad[i] / 0.03 + 0.3);
        sx *= f; sy *= f; sz *= f;
        _q.setFromEuler(_e.set(P.rot[k], P.rot[k + 1], P.rot[k + 2]));
      } else if (tipo === CHISPA || (tipo === BABA && !P.quieto[i])) {
        // estiradas en la dirección de vuelo: se leen como trazos, no como puntos
        const rapidez = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (rapidez > 0.05) _q.setFromUnitVectors(ARRIBA, _d.set(vx / rapidez, vy / rapidez, vz / rapidez));
        else _q.identity();
        if (tipo === CHISPA) {
          sy *= 1 + Math.min(rapidez * 0.45, 5);
          const enfria = suave(u * 1.3);
          r = r * (1 - enfria) + 1 * enfria;
          g = g * (1 - enfria) + 0.32 * enfria;
          b = b * (1 - enfria) + 0.05 * enfria;
          luz = (1 - u) * (1 - u * 0.5) * 1.25;
          const f = 1 - u * 0.5;
          sx *= f; sz *= f;
        } else {
          sy *= 1 + Math.min(rapidez * 0.12, 1.3);
          luz = 1 - suave((u - 0.45) / 0.55);
          const f = 1 - u * 0.35;
          sx *= f; sz *= f;
        }
      } else if (tipo === BABA) {
        // salpicón aplastado en el piso
        _q.identity();
        luz = 0.75 * suave(quedan / 0.45);
        sx *= 1.7; sz *= 1.7; sy *= 0.25;
      } else {
        // llama: blanca-amarilla al nacer, naranja, y se muere roja
        _q.setFromEuler(_e.set(0, P.rot[k + 1], P.rot[k + 2] * 0.15));
        const t1 = suave(u / 0.4), t2 = suave((u - 0.4) / 0.6);
        r = r * (1 - t1) + 1 * t1; g = g * (1 - t1) + 0.48 * t1; b = b * (1 - t1) + 0.1 * t1;
        r = r * (1 - t2) + 0.62 * t2; g = g * (1 - t2) + 0.12 * t2; b = b * (1 - t2) + 0.03 * t2;
        const titila = 0.82 + 0.18 * Math.sin(reloj * 34 + P.fase[i]);
        luz = Math.pow(1 - u, 1.25) * titila * 1.15;
        const f = (0.55 + 0.45 * suave(u / 0.15)) * (1 - u * 0.55);
        sx *= f; sy *= f; sz *= f;
      }

      _m.compose(_p, _q, _s.set(sx, sy, sz)).toArray(mat, i * 16);
      col[k] = r * luz; col[k + 1] = g * luz; col[k + 2] = b * luz;
    }
    P.alto = alto;
    malla.count = alto + 1;
    malla.visible = alto >= 0;
    if (cambio) {
      malla.instanceMatrix.needsUpdate = true;
      malla.instanceColor.needsUpdate = true;
    }
  }

  function actualizar(dt, T) {
    dt = Math.min(Math.max(dt || 0, 0), 0.1);
    reloj += dt;
    cuadro++;
    ultimoT = T || null;
    paso(solidos, mallaSol, dt, ultimoT);
    paso(brillos, mallaBri, dt, ultimoT);

    for (let i = 0; i < destellos.length; i++) {
      const d = destellos[i];
      if (!d.activo) continue;
      d.edad += dt;
      const u = d.edad / d.vida;
      if (u >= 1) { d.activo = false; d.malla.visible = false; continue; }
      d.malla.scale.setScalar(d.esc0 + (d.esc1 - d.esc0) * salida(u));
      d.mat.color.copy(d.c0).lerp(d.c1, suave(u * 1.6));
      d.mat.opacity = d.brillo * (1 - u) * (1 - u);
    }
    for (let i = 0; i < anillos.length; i++) {
      const a = anillos[i];
      if (!a.activo) continue;
      a.edad += dt;
      const u = a.edad / a.vida;
      if (u >= 1) { a.activo = false; a.malla.visible = false; continue; }
      if (a.mancha) {
        // aparece rápido con la explosión y tarda en borrarse
        a.malla.scale.setScalar(a.radio * (0.4 + 0.6 * salida(a.edad / 0.18)));
        a.matMancha.opacity = a.brillo * suave(a.edad / 0.12) * (1 - suave((u - 0.55) / 0.45));
      } else {
        a.malla.scale.setScalar(Math.max(0.05, a.radio * salida(u)));
        a.matLuz.opacity = a.brillo * (1 - u) * (1 - u);
      }
    }
    for (let i = 0; i < humos.length; i++) {
      const h = humos[i];
      if (!h.activo) continue;
      h.edad += dt;
      const u = h.edad / h.vida;
      if (u >= 1) { h.activo = false; h.malla.visible = false; continue; }
      const frena = Math.exp(-0.9 * dt);
      h.vel.x *= frena; h.vel.z *= frena; h.vel.y *= Math.exp(-0.45 * dt);
      h.malla.position.addScaledVector(h.vel, dt);
      h.malla.rotation.y += h.giro * dt;
      h.malla.scale.setScalar(h.esc0 + (h.esc1 - h.esc0) * salida(u));
      h.mat.opacity = h.opac * suave(u / 0.12) * (1 - suave((u - 0.3) / 0.7));
    }
  }

  function limpiar() {
    const pools = [[solidos, mallaSol], [brillos, mallaBri]];
    for (let j = 0; j < pools.length; j++) {
      const P = pools[j][0], malla = pools[j][1];
      P.vivo.fill(0);
      P.vivas = 0;
      P.alto = -1;
      for (let i = 0; i < P.n; i++) malla.setMatrixAt(i, CERO);
      malla.instanceMatrix.needsUpdate = true;
      malla.count = 0;
      malla.visible = false;
    }
    const listas = [destellos, anillos, humos];
    for (let j = 0; j < listas.length; j++) {
      for (let i = 0; i < listas[j].length; i++) { listas[j][i].activo = false; listas[j][i].malla.visible = false; }
    }
  }

  function contarItems(lista) {
    let n = 0;
    for (let i = 0; i < lista.length; i++) if (lista[i].activo) n++;
    return n;
  }

  return {
    astillas, chispas, polvo, sangre, destello, explosion, fuego, actualizar, limpiar,
    get activas() { return solidos.vivas + brillos.vivas + contarItems(destellos) + contarItems(anillos) + contarItems(humos); },
  };
}

