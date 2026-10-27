// 4.12.2 (bugs): arreglos de la revisión de la «gran mejora visual» (4.12.0/4.12.1) y de los animales con huesos. Esta prueba CORRE el comportamiento en Node
// (el three local, sin placa de video; para el programa de sombras, un GL de mentira que deja a three armar sus programas de verdad):
//   · W1: tras `precalentarPiel` ningún objeto que proyecte sombra (rígido, con huesos, instanciado) arma un programa de profundidad nuevo en el juego;
//   · W2: la perilla `sombraSesgo` existe, vale 1 por defecto (nada cambia) y las cuentas del informe;
//   · W3: la sombra de contacto se dibuja antes de lo transparente y se apaga con la distancia;
//   · K1: a 40 m la cabeza (ciervo, caballo, huemul, perro) está donde la deja el animal rígido, y la curva del cuello entra con la cercanía;
//   · K2/K3: los animales que nunca usan la piel no la arman ni reservan huesos; K4: la piel sigue la calidad que CORRE; K5: tras recuperar el contexto
//     se vuelven a precalentar los programas de sombra con huesos.
// Lo puramente visual o de rendimiento real queda para mirar/medir en Electron (ver CAMBIOS_4_12_2_VISUAL_ANIMALES.md).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { registrarThree } from './ayuda-three.mjs';
import { cargarVM } from './ayuda-vm.mjs';
import { funcion } from './ayuda-codigo.mjs';

registrarThree();
const THREE = await import('three');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1').replace(/\/$/, '');
const P = await import('../src/animales-piel.js');
const { mallaCaballo } = await import('../src/caballo-mundo.js');
const { mallaPerro } = await import('../src/perro.js');
const { mallaCiervo } = await import('../src/bichos.js');
const V = await import('../src/vida.js');

// ---------------------------------------------------------------- W1. el programa de profundidad que se compilaba tarde
{
  const noop = () => {};
  const ctx2d = new Proxy({ measureText(t) { return { width: String(t).length * 20 }; }, createLinearGradient() { return { addColorStop: noop }; }, createRadialGradient() { return { addColorStop: noop }; } }, { get(t, p) { if (p in t) return t[p]; return noop; }, set(t, p, v) { t[p] = v; return true; } });
  const extra = { document: { createElement(tag) { if (tag === 'canvas') return { width: 1, height: 1, getContext: () => ctx2d, style: {} }; return { style: {} }; } }, Float32Array, Uint16Array, Uint32Array, Uint8Array, Int32Array, Map, Set, WeakMap, Error, JSON, Date, structuredClone, Promise, setTimeout, clearTimeout, Object, Array, Number, String, Symbol, Reflect };
  const { ctx } = cargarVM(RAIZ, ['animales-piel.js', 'vida.js', 'bichos.js', 'cielo.js'], extra);
  // un GL de mentira: three arma sus programas (claves incluidas) sin compilar nada
  vm.runInContext(`
  (() => {
    class FakeGL2 {}
    const target = Object.create(FakeGL2.prototype);
    const consts = {}; let nc = 1;
    const C = (p) => (consts[p] ??= nc++);
    const gl = new Proxy(target, { get(t, p) {
      if (p === 'canvas') return canvasFake;
      if (p === 'drawingBufferWidth' || p === 'drawingBufferHeight') return 100;
      if (typeof p === 'string' && /^[A-Z][A-Z0-9_]+$/.test(p)) return C(p);
      switch (p) {
        case 'getContextAttributes': return () => ({ alpha: false, antialias: false, depth: true, stencil: false, premultipliedAlpha: true });
        case 'getShaderPrecisionFormat': return () => ({ rangeMin: 127, rangeMax: 127, precision: 23 });
        case 'getParameter': return (q) => (q === C('VERSION') ? 'WebGL 2.0' : q === C('SHADING_LANGUAGE_VERSION') ? 'WebGL GLSL ES 3.00' : 16);
        case 'getExtension': return () => ({});
        case 'getSupportedExtensions': return () => [];
        case 'getShaderParameter': return () => true;
        case 'getProgramParameter': return (pr, q) => (q === C('ACTIVE_UNIFORMS') || q === C('ACTIVE_ATTRIBUTES') ? 0 : true);
        case 'getShaderInfoLog': case 'getProgramInfoLog': return () => '';
        case 'getShaderSource': return () => '';
        case 'checkFramebufferStatus': return () => C('FRAMEBUFFER_COMPLETE');
        case 'isContextLost': return () => false;
        case 'getUniformLocation': case 'getAttribLocation': return () => 1;
        case 'getError': return () => 0;
      }
      if (typeof p === 'string') return (...a) => ({});
      return t[p];
    } });
    const canvasFake = { width: 100, height: 100, style: {}, addEventListener(){}, removeEventListener(){}, getContext(){ return gl; } };
    globalThis.__gl = gl; globalThis.WebGL2RenderingContext = FakeGL2; globalThis.self = globalThis; globalThis.window = globalThis;
  })()`, ctx);
  const run = (s) => vm.runInContext(s, ctx);
  run(`
    globalThis.renderer = new THREE.WebGLRenderer({ canvas: __gl.canvas, context: __gl });
    renderer.shadowMap.enabled = true; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
    __M.cielo.permitirSiluetasEnSombra(renderer);
    globalThis.escena = new THREE.Scene(); escena.fog = new THREE.FogExp2(0xaaaaaa, 0.002);
    globalThis.camara = new THREE.PerspectiveCamera(60, 1.5, 0.1, 500); camara.position.set(0, 1.7, 5); camara.lookAt(0, 1, 0); camara.updateMatrixWorld(true);
    const sol = new THREE.DirectionalLight(0xffffff, 2); sol.castShadow = true; sol.position.set(50, 80, 30); escena.add(sol); escena.add(sol.target);
    Object.assign(sol.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40 }); sol.shadow.camera.updateProjectionMatrix();
    escena.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshLambertMaterial({ color: 0x336633 })); suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; escena.add(suelo);
    globalThis.dibujar = () => { renderer.shadowMap.needsUpdate = true; renderer.render(escena, camara); };
    globalThis.AP = __M['animales-piel']; AP.fijarPielFauna(true); AP.observar({ x: 0, y: 0, z: 12 });
    // lo que aparece DESPUÉS de la carga, detrás de la cámara (la cámara no lo dibuja; la luz sí): un ciervo con piel, uno rígido y una silueta de árbol (capa 1, con color)
    globalThis.cA = __M.bichos.mallaCiervo(true); cA.g.position.set(0, 0, 12); cA.g.updateMatrixWorld(true);
    globalThis.cB = __M.bichos.mallaCiervo(true); cB.g.position.set(4, 0, 12); cB.g.updateMatrixWorld(true);
  `);
  const profundidad = () => run('renderer.info.programs.map((p) => p.cacheKey)').filter((k) => k.startsWith('depth'));
  // (a) Sin el arreglo, la carga dejaba programas de profundidad sin hacer; con él, la carga los hace todos
  let dibujos = 0;
  run('globalThis.__cuenta = 0; globalThis.dibujarContado = () => { __cuenta++; dibujar(); };');
  const hijosAntes = run('escena.children.length');
  ok(run('AP.precalentarPiel(escena, camara, dibujarContado)') === true, 'precalentarPiel corre en Media y Alta');
  dibujos = run('__cuenta');
  ok(dibujos === 2, `precalentarPiel dibuja DOS veces (la primera pasada de sombras ve las luces sin contar): ${dibujos}`);
  ok(run('escena.children.length') === hijosAntes, 'no deja ninguna de las figuras en la escena');
  const enCarga = new Set(profundidad());
  ok(enCarga.size >= 3, `la carga armó los programas de profundidad de las tres figuras (rígida, con huesos e instanciada): ${enCarga.size}`);
  run('dibujar();');
  run(`escena.add(cA.g); cA.piel.lod(cA.g); dibujar(); dibujar();`);
  ok(profundidad().filter((k) => !enCarga.has(k)).length === 0, 'al aparecer un ciervo con piel NO se arma un programa de profundidad nuevo');
  run(`cB.piel.mostrar(false); escena.add(cB.g); dibujar(); dibujar();`);
  ok(profundidad().filter((k) => !enCarga.has(k)).length === 0, 'al aparecer un ciervo rígido NO se arma un programa de profundidad nuevo');
  run(`globalThis.sil = new THREE.InstancedMesh(cB.piel.malla.geometry, cB.piel.malla.material, 2); sil.setColorAt(0, new THREE.Color(1, 1, 1)); sil.layers.set(1); sil.castShadow = true; sil.position.set(-4, 0, 12); escena.add(sil); dibujar(); dibujar();`);
  ok(profundidad().filter((k) => !enCarga.has(k)).length === 0, 'al aparecer una silueta instanciada de árbol (capa 1) NO se arma un programa de profundidad nuevo');
  // (b) la prueba de control: con la versión de antes (un dibujo, una sola figura) sí aparecían programas nuevos
  const antes = leer('src/animales-piel.js');
  ok(/dibujar\(\); dibujar\(\);/.test(antes) && /new THREE\.InstancedMesh\(/.test(antes.slice(antes.indexOf('export function precalentarPiel'))), 'precalentarPiel: dos dibujos y la figura instanciada están en el código');
  // (c) las tres figuras salen de la escena y no se pierden tramos de huesos
  const tramos = P.esqueletosEnUso();
  const cam = new THREE.PerspectiveCamera(); const ecena = new THREE.Scene(); let vistas = [];
  P.fijarPielFauna(true);
  P.precalentarPiel(ecena, cam, () => { vistas.push(ecena.children.map((o) => (o.isInstancedMesh ? 'instancia' : o.isSkinnedMesh ? 'huesos' : 'rigida'))); });
  ok(vistas.length === 2 && vistas.every((v) => v.join() === 'rigida,huesos,instancia'), 'durante cada dibujo están las tres figuras, en el orden en que se alternan en el juego');
  ok(ecena.children.length === 0 && P.esqueletosEnUso() === tramos, 'después no queda ninguna figura ni tramo de huesos');
  P.fijarPielFauna(false);
  vistas = [];
  ok(P.precalentarPiel(ecena, cam, () => vistas.push(1)) === false && vistas.length === 0, 'en Baja y Mínima no dibuja nada de más');
  P.fijarPielFauna(null);
}

// ---------------------------------------------------------------- W2. el corrimiento por normal tiene una perilla (nada cambia por defecto)
{
  const S = await import('../src/sombras-alcance.js');
  const { CALIDADES } = await import('../src/config.js');
  const { crearCielo } = await import('../src/cielo.js');
  const bias = (q, extra = {}) => crearCielo(new THREE.Scene(), { ...CALIDADES[q], ...extra }).sol.shadow.normalBias;
  for (const q of ['media', 'alta']) {
    const base = bias(q);
    ok(Math.abs(base - S.sesgoNormal(CALIDADES[q].sombraSuave, CALIDADES[q].sombras, CALIDADES[q].sombraCaja)) < 1e-12, `${q}: sin la perilla el corrimiento es el de siempre (${base.toFixed(3)} m)`);
    ok(Math.abs(bias(q, { sombraSesgo: 0.5 }) - base * 0.5) < 1e-12, `${q}: sombraSesgo 0,5 lo reduce a la mitad`);
    ok(bias(q, { sombraSesgo: -3 }) === base && bias(q, { sombraSesgo: NaN }) === base, `${q}: un valor inválido se ignora`);
  }
  // las cuentas del informe: el téxel crece 75 % (Media) y 100 % (Alta) con las cajas de la 4.12.3
  const texel = (q, caja) => (2 * caja) / CALIDADES[q].sombras;
  ok(Math.abs(texel('media', 70) / texel('media', 40) - 1.75) < 1e-9 && Math.abs(texel('alta', 110) / texel('alta', 55) - 2) < 1e-9, 'el téxel crece 75 % en Media y 100 % en Alta con las cajas de la 4.12.3 (queda como pregunta; ver el documento)');
}

// ---------------------------------------------------------------- W3. la sombra de contacto: antes de lo transparente, y de lejos se apaga
{
  const A = await import('../src/asentado-mundo.js');
  const escena = new THREE.Scene();
  const as = A.crearAsiento(escena, { altura: () => 0, lejos: () => 230 });
  ok(as.malla.renderOrder < 0, 'la malla se dibuja antes de toda transparente de orden 0 o más (humo, lluvia, agua: 5 a 7)');
  ok(as.mat.transparent === true && as.mat.depthWrite === false, 'sigue siendo transparente y sin escribir profundidad');
  ok(A.fuerzaPorDistancia(0, 230) === 1 && A.fuerzaPorDistancia(115, 230) === 1 && A.fuerzaPorDistancia(230, 230) === 0, 'plena hasta la mitad del corte y cero en el corte');
  let prev = 1; for (let d = 115; d <= 230; d += 5) { const f = A.fuerzaPorDistancia(d, 230); ok(f <= prev + 1e-12, `la fuerza no sube con la distancia (${d} m)`); prev = f; }
  const maxColor = (g) => { const c = g.attributes.color; let m = 0; for (let i = 0; i < c.count; i++) m = Math.max(m, c.getZ(i)); return m; };
  const casa = (x) => ({ x, z: 0, rot: 0, w: 6, d: 5, fuerza: 0.3 });
  as.poner('cerca', casa(20)); as.rehacer({ x: 0, z: 0 });
  const plena = maxColor(as.malla.geometry);
  ok(Math.abs(plena - 0.3) < 1e-6, `una casa cerca (20 m) lleva la fuerza de siempre (${plena})`);
  as.limpiar(); as.poner('media', casa(190)); as.rehacer({ x: 0, z: 0 });
  const media = maxColor(as.malla.geometry);
  ok(media > 0 && media < plena * 0.6, `a 190 m (con el corte en 230) queda apenas (${media.toFixed(3)} contra ${plena})`);
  as.limpiar(); as.poner('lejos', casa(229)); as.rehacer({ x: 0, z: 0 });
  ok(as.estado().activos === 0, 'a punto del corte ya no se arma (sin halo oscuro de lejos)');
  as.limpiar(); as.poner('sinFuerza', { x: 20, z: 0, rot: 0, w: 6, d: 5 }); as.rehacer({ x: 0, z: 0 });
  ok(Math.abs(maxColor(as.malla.geometry) - 0.3) < 1e-6, 'sin `fuerza` propia vale 0,3 como antes');
}

// ---------------------------------------------------------------- K1. la cabeza no salta al cambiar de versión (40 m)
{
  P.fijarPielFauna(true);
  const LUG = P.HUESOS_ANIMAL;
  function posicionesPiel(piel) {
    const sk = piel.malla.skeleton; sk.update();
    const geo = piel.malla.geometry, Pp = geo.attributes.position, sw = geo.attributes.skinWeight, si = geo.attributes.skinIndex, Mx = sk.boneMatrices;
    const out = new Float32Array(Pp.count * 3);
    for (let i = 0; i < Pp.count; i++) {
      const x = Pp.getX(i), y = Pp.getY(i), z = Pp.getZ(i); let ox = 0, oy = 0, oz = 0;
      for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (!w) continue; const o = si.getComponent(i, k) * 16; ox += w * (Mx[o] * x + Mx[o + 4] * y + Mx[o + 8] * z + Mx[o + 12]); oy += w * (Mx[o + 1] * x + Mx[o + 5] * y + Mx[o + 9] * z + Mx[o + 13]); oz += w * (Mx[o + 2] * x + Mx[o + 6] * y + Mx[o + 10] * z + Mx[o + 14]); }
      out[i * 3] = ox; out[i * 3 + 1] = oy; out[i * 3 + 2] = oz;
    }
    return out;
  }
  // cuánto se corren los vértices de la cabeza (dominados por el hueso de la cabeza) de la piel respecto del rígido con el mismo ángulo: gira sobre `piv`
  function saltoCabeza(m, piv, ang, pose, mezcla) {
    const pc = m.piel; pc.mostrar(true); pc.mezcla = mezcla;
    for (let i = 0; i < 80; i++) pc.posar(0.016, m, pose);
    const p = posicionesPiel(pc), g = pc.malla.geometry, Pp = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    let max = 0, cuenta = 0, suma = 0;
    for (let i = 0; i < Pp.count; i++) {
      if (si.getComponent(i, 0) % LUG !== P.HUESO.CABEZA || sw.getComponent(i, 0) < 0.99) continue;
      const y = Pp.getY(i) - piv.y, z = Pp.getZ(i) - piv.z;
      const ry = piv.y + y * Math.cos(ang) - z * Math.sin(ang), rz = piv.z + y * Math.sin(ang) + z * Math.cos(ang);
      const d = Math.hypot(p[i * 3 + 1] - ry, p[i * 3 + 2] - rz); max = Math.max(max, d); suma += d; cuenta++;
    }
    ok(cuenta > 20, 'hay vértices de cabeza para comparar (' + cuenta + ')');
    return { max, medio: suma / cuenta };
  }
  const ci = mallaCiervo(true), pCi = { fase: 0, amplitud: 0, posterior: 0.35, estado: 'pastar', galope: false };
  ci.cabeza.rotation.x = 0.9;
  const c1 = saltoCabeza(ci, ci.cabeza.position, 0.9, pCi, 1), c0 = saltoCabeza(ci, ci.cabeza.position, 0.9, pCi, 0);
  ok(c1.medio > 0.3, `el ciervo con la curva entera sí se corre (${c1.medio.toFixed(2)} m): es la pose cercana de siempre`);
  ok(c0.max < 0.03, `el ciervo a 40 m: la cabeza queda donde la deja el rígido (salto máximo ${c0.max.toFixed(4)} m, antes ${c1.max.toFixed(2)} m)`);
  const ca = mallaCaballo(), pCa = { fase: 0, modo: 'quieto', amplitud: 0, galope: false, montado: false };
  ca.cuello.rotation.x = 0.55;
  const a1 = saltoCabeza(ca, ca.cuello.position, 0.55, pCa, 1), a0 = saltoCabeza(ca, ca.cuello.position, 0.55, pCa, 0);
  ok(a1.medio > 0.08, `el caballo con la curva entera se corre (${a1.medio.toFixed(2)} m)`);
  ok(a0.max < 0.03, `el caballo a 40 m: la cabeza queda donde la deja el rígido (${a0.max.toFixed(4)} m, antes ${a1.max.toFixed(2)} m)`);
  const hu = V.mallaHuemul(true); hu.piel = V.pielDeHuemul(hu);
  hu.cabeza.rotation.x = 0.9;
  const h0 = saltoCabeza(hu, hu.cabeza.position, 0.9, pCi, 0);
  ok(h0.max < 0.03, `el huemul a 40 m: la cabeza queda donde la deja el rígido (${h0.max.toFixed(4)} m)`);
  const pe = mallaPerro(), pPe = { paso: 0, anda: false, vel: 0, sentado: 0, marcando: false };
  pe.cabeza.rotation.x = 0.75;
  const e0 = saltoCabeza(pe, pe.cabeza.position, 0.75, pPe, 0);
  ok(e0.max < 0.03, `el perro a 40 m: la cabeza queda donde la deja el rígido (${e0.max.toFixed(4)} m)`);
  // el giro (yaw) del cuello también: la cabeza rígida del ciervo gira sobre su pivote
  ci.cabeza.rotation.x = 0; ci.cabeza.rotation.y = 0.4;
  ci.piel.mezcla = 0; for (let i = 0; i < 40; i++) ci.piel.posar(0.016, ci, pCi);
  ok(Math.abs(ci.piel.huesos.rot[P.HUESO.CABEZA * 3 + 1] - 0.4) < 1e-6 && ci.piel.huesos.rot[P.HUESO.CUELLO1 * 3 + 1] === 0, 'el giro de la cabeza (mirar de costado) también entra entero en la cabeza a 40 m');

  // la mezcla sale de la distancia: 0 donde se cambia de versión (a la ida a 40 m y a la vuelta a 46 m), 1 desde 28 m, continua entre medio
  const ciervo = mallaCiervo(true);
  const mezclaA = (d) => { P.observar({ x: d, y: 0, z: 0 }); ciervo.g.position.set(0, 0, 0); ciervo.piel.lod(ciervo.g); return ciervo.piel.mezcla; };
  ok(mezclaA(40) === 0 && mezclaA(39.99) < 0.001, 'a 40 m (donde aparece la piel) la mezcla es 0');
  ok(mezclaA(27.9) === 1 && mezclaA(10) === 1, 'de 28 m para adentro, la curva entera');
  ok(mezclaA(46) === 0 && mezclaA(60) === 0, 'a 46 m (donde vuelve el rígido) también 0');
  let previo = 0, crece = true; for (let d = 40; d >= 28; d -= 0.5) { const m = mezclaA(d); if (m < previo - 1e-12) crece = false; previo = m; }
  ok(crece, 'sube sin saltos mientras te acercás');
  // con el cambio de versión en medio: al llegar a 40 m la piel nace en la pose rígida
  P.observar({ x: 100, y: 0, z: 0 }); ciervo.g.position.set(0, 0, 0); ciervo.piel.lod(ciervo.g);
  ok(ciervo.piel.activa === false, 'lejos: rígido');
  mezclaA(39.9); ok(ciervo.piel.activa === true && ciervo.piel.mezcla < 0.001, 'al cruzar los 40 m se muestra la piel con la mezcla en 0');
  P.observar({ x: 0, y: 0, z: 0 });   // (deja el observador como estaba para lo que sigue)
}

// ---------------------------------------------------------------- K2/K3. sólo arma la piel quien la usa
{
  P.fijarPielFauna(true);
  const antes = P.esqueletosEnUso();
  const sinP = mallaPerro(undefined, { piel: false }), sinC = mallaCaballo(undefined, { piel: false });
  ok(sinP.piel === null && sinC.piel === null, 'con { piel: false } no se arma la piel del perro ni la del caballo');
  ok(P.esqueletosEnUso() === antes, 'ni se reserva un tramo de huesos');
  let hay = false; sinP.g.traverse((o) => { if (o.isSkinnedMesh) hay = true; }); sinC.g.traverse((o) => { if (o.isSkinnedMesh) hay = true; });
  ok(!hay, 'ni queda una malla con huesos escondida (0,3 MB de más por animal)');
  ok(sinC.g.children.length > 0 && sinC.patas.length === 4 && sinP.patas.length === 4, 'el animal rígido queda entero (cuerpo y cuatro patas)');
  const conP = mallaPerro(), conC = mallaCaballo();
  ok(!!conP.piel && !!conC.piel && P.esqueletosEnUso() === antes + 2, 'por defecto (el perro y el caballo del jugador) siguen armando su piel');
  for (let i = 0; i < 6; i++) { mallaPerro(undefined, { piel: false }); mallaCaballo(undefined, { piel: false }); }
  ok(P.esqueletosEnUso() === antes + 2, 'seis perros y seis caballos más de la aldea no gastan huesos');
  // los que llaman
  const ald = leer('src/aldea-animales-mundo.js'), fie = leer('src/fiestas-mundo.js'), tren = leer('src/tren.js');
  ok((ald.match(/mallaPerro\([^\n]*\{ piel: false \}\)/g) || []).length === 2 && (ald.match(/mallaCaballo\([^\n]*\{ piel: false \}\)/g) || []).length === 1, 'la aldea (4 o más perros, el palenque y el cachorro) pide animales rígidos');
  ok(/mallaCaballo\([^\n]*\{ piel: false \}\)/.test(fie), 'la fiesta (el redomón) pide un caballo rígido');
  ok((tren.match(/\{ piel: false \}/g) || []).length === 2, 'el tren (el caballo de la jaula) pide un caballo rígido: no hay tramo que soltar al rearmarlo');
  const per = leer('src/perro.js'), cab = leer('src/caballo-mundo.js');
  ok(/mallaPerro\(apariencia\)/.test(per) && /mallaPerro\(nuevo\)/.test(per) && /mallaCaballo\(apariencia\)/.test(cab) && /mallaCaballo\(nuevo\)/.test(cab), 'crearPerro, crearCaballo y "Personalizar" siguen con piel');
  P.fijarPielFauna(null);
}

// ---------------------------------------------------------------- K4. la piel sigue la calidad que CORRE, no la guardada
{
  const guardada = { v: 'baja' };
  globalThis.localStorage = { getItem: () => JSON.stringify({ calidad: guardada.v }), setItem() {} };
  P.fijarPielFauna(null); P.fijarCalidadPiel(null);
  ok(P.pielPermitida() === false, 'sin calidad del mundo fijada, se lee lo guardado (como antes): Baja → sin piel');
  P.fijarCalidadPiel('media');
  ok(P.pielPermitida() === true, 'con el mundo corriendo en Media, elegir Baja en Ajustes (sin reiniciar) NO apaga la piel');
  guardada.v = 'alta'; P.fijarCalidadPiel('baja');
  ok(P.pielPermitida() === false && P.armarPielPerro(mallaPerro(undefined, { piel: false })) === null, 'con el mundo en Baja, elegir Alta en Ajustes no arma una piel (ni compila programas con huesos a mitad de juego)');
  P.fijarCalidadPiel('muybaja'); ok(P.pielPermitida() === false, 'Mínima: sin piel');
  P.fijarCalidadPiel('alta'); ok(P.pielPermitida() === true, 'Alta: con piel');
  P.fijarPielFauna(false); ok(P.pielPermitida() === false, 'lo forzado (?piel=0 / las pruebas) sigue mandando');
  P.fijarPielFauna(null); P.fijarCalidadPiel(null);
  delete globalThis.localStorage;
  // main.js: la calidad se le avisa a la piel al arrancar y cada vez que la automática la baja
  const main = leer('src/main.js');
  ok(/import \{ fijarCalidadPiel \} from '\.\/animales-piel\.js';/.test(main), 'main.js importa fijarCalidadPiel');
  ok(/let calidadActiva = [^\n]*\nfijarCalidadPiel\(calidadActiva\);/.test(main), 'main.js: al arrancar, la piel toma la calidad con la que corre el mundo');
  const llamadas = []; const entorno = {
    CALIDADES: { baja: { sombras: 0 }, media: { sombras: 1024 } }, calidad: { sombras: 1024 }, CLAVES_CALIDAD_EN_VIVO: [], fijarCalidadPiel: (c) => llamadas.push(c),
    aplicarDistancias() {}, acomodarEscalaPantalla() {}, est: null, cielo: null, renderer: { shadowMap: {} }, ajustes: {}, guardarAjustes() {}, sincronizarAjustes() {},
    $: () => null, calidadPideReinicio: () => false, nota() {}, calidadActiva: 'media',
  };
  funcion(main, 'aplicarCalidadAutomatica', entorno)({ hasta: 'baja', aviso: { texto: 'x' } }, false);
  ok(llamadas.length === 1 && llamadas[0] === 'baja', 'al bajar la calidad en vivo, la piel se entera (los animales vuelven a rígido)');
}

// ---------------------------------------------------------------- K5. tras recuperar el contexto 3D se precalientan los programas de sombra con huesos
{
  const main = leer('src/main.js');
  const orden = [];
  const entorno = {
    renderer: { getContext: () => ({ isContextLost: () => false }), shadowMap: { needsUpdate: false } }, veg: null, cronometroGpu: 0, modo: 'jugando',
    jugador: { estado: { pos: {} } }, variantesLuces: { compilarCarga: async () => { orden.push('compilar'); } }, esperarMs: () => new Promise(() => {}),
    gente: { precalentar: (cam, dibujo) => { orden.push('precalentar'); dibujo(); } }, camara: { cam: 1 }, dibujar: () => orden.push('dibujo'),
  };
  await funcion(main, 'rehacerGraficos', entorno)();
  ok(orden.join() === 'compilar,precalentar,dibujo', `rehacerGraficos: primero los programas de color, después los de sombra con huesos (${orden.join()})`);
  ok(entorno.renderer.shadowMap.needsUpdate === true, 'y el mapa de sombras se pide de nuevo');
  orden.length = 0; entorno.gente = null;
  await funcion(main, 'rehacerGraficos', entorno)();
  ok(orden.join() === 'compilar', 'sin gente (Desafío o Baja) no rompe');
  orden.length = 0; entorno.modo = 'carga';
  entorno.gente = { precalentar: () => orden.push('precalentar') };
  await funcion(main, 'rehacerGraficos', entorno)();
  ok(orden.length === 0, 'durante la carga no se hace nada de más (la carga ya precalienta)');
  orden.length = 0; entorno.modo = 'jugando'; entorno.gente = { precalentar: () => { throw new Error('boom'); } };
  const avisar = console.warn; console.warn = () => {};
  try { await funcion(main, 'rehacerGraficos', entorno)(); } finally { console.warn = avisar; }
  ok(orden.join() === 'compilar', 'si el precalentado falla, la recuperación sigue igual');
}

console.log(`verificar-4-12-2-visual-animales: ${n} comprobaciones OK`);
