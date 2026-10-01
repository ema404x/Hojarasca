// 3.5: la distancia de dibujo (en bloques, como los chunks de Minecraft) y la de plantas.
// Puro Node: los valores de cada calidad (que no cambian nada a quien no toca el ajuste), el
// guardado viejo, el rango, que lo cercano del sotobosque no depende del cono de la vista (ni
// con la cámara alta mirando abajo), que cada mata se funde por distancia, que el pasto estira
// el anillo con la misma densidad, y que una tarea pesada no queda postergada para siempre.
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import assert from 'node:assert/strict';
import { CALIDADES, TAM_BLOQUE, BLOQUES_MIN, BLOQUES_MAX, PLANTAS, ALCANCE_SOTO, distanciasDe, sanearDistancia, sanearPlantas, textoDistanciaDibujo } from '../src/config.js';
import { crearPlanificadorAntitirones, ESPERA_MAXIMA_S } from '../src/rendimiento.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');

// ---------------------------------------------------------------- 1. config: valores y rango
assert.equal(TAM_BLOQUE, 40);
assert.deepEqual([BLOQUES_MIN, BLOQUES_MAX], [2, 10], 'de 2 a 10 bloques (80 a 400 m)');
for (const [clave, c] of Object.entries(CALIDADES)) {
  const d = distanciasDe(clave, 'calidad', 'normal');
  assert.equal(d.lejos, c.lejos, `${clave}: según la calidad es el alcance de siempre`);
  assert.equal(d.niebla, 1, `${clave}: la niebla de siempre`);
  assert.equal(d.plantas, 1);
  assert.equal(d.sotobosque, c.sotobosque);
  assert.equal(d.radioPasto, c.radioPasto);
  assert.ok(d.porCalidad);
}
assert.deepEqual(['muybaja', 'baja', 'media', 'alta'].map((k) => distanciasDe(k).lejos), [160, 185, 230, 310]);
assert.equal(distanciasDe('rara').lejos, CALIDADES.media.lejos, 'una calidad rara es media');
// en bloques: la niebla se estira o se acorta con el borde del bosque (acotada)
const seis = distanciasDe('media', 6);
assert.equal(seis.lejos, 240); assert.equal(seis.bloques, 6); assert.ok(!seis.porCalidad);
assert.ok(Math.abs(seis.niebla - 230 / 240) < 1e-9);
assert.ok(distanciasDe('media', 2).niebla > 2 && distanciasDe('media', 10).niebla < 0.6, 'más cerca, más niebla; más lejos, menos');
assert.equal(distanciasDe('alta', 2).niebla, 2.5, 'con tope');
// el rango
assert.equal(sanearDistancia(1), 2); assert.equal(sanearDistancia(0), 2); assert.equal(sanearDistancia(-4), 2);
assert.equal(sanearDistancia(11), 10); assert.equal(sanearDistancia(99), 10);
assert.equal(sanearDistancia(6.4), 6); assert.equal(sanearDistancia('7'), 7);
for (const raro of [undefined, null, '', 'mucho', NaN, {}, [], true]) assert.equal(sanearDistancia(raro), 'calidad', `«${String(raro)}» es según la calidad`);
assert.equal(sanearDistancia('calidad'), 'calidad');
assert.equal(distanciasDe('media', 99).lejos, 400);
assert.equal(distanciasDe('media', 1).lejos, 80);
// las plantas
assert.deepEqual(Object.keys(PLANTAS), ['cerca', 'normal', 'lejos', 'muylejos']);
assert.equal(PLANTAS.normal, 1);
assert.ok(PLANTAS.cerca < 1 && PLANTAS.lejos > 1 && PLANTAS.muylejos > PLANTAS.lejos);
assert.equal(sanearPlantas('muylejos'), 'muylejos'); assert.equal(sanearPlantas('otra'), 'normal'); assert.equal(sanearPlantas(undefined), 'normal');
assert.equal(distanciasDe('alta', 'calidad', 'lejos').radioPasto, CALIDADES.alta.radioPasto * PLANTAS.lejos);
assert.equal(distanciasDe('alta', 'calidad', 'lejos').lejos, 310, 'las plantas no tocan la distancia de dibujo');
// el texto del ajuste
assert.equal(textoDistanciaDibujo(distanciasDe('media', 6)), '6 bloques · 240 m');
assert.equal(textoDistanciaDibujo(distanciasDe('media')), 'Según la calidad · 230 m (≈5,8 bloques)');

// ---------------------------------------------------------------- 2. el guardado
const datos = new Map();
globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
const G = await import('../src/guardado.js?distancia35=' + Date.now());
assert.equal(G.AJUSTES_BASE.distancia, 'calidad', 'de fábrica: según la calidad');
assert.equal(G.AJUSTES_BASE.distanciaPlantas, 'normal');
assert.equal(G.cargarAjustes().distancia, 'calidad', 'jugador nuevo: según la calidad');
// un guardado de la 3.4 (sin los campos) usa lo de su calidad
datos.set('hojarasca-ajustes-v1', JSON.stringify({ versionAjustes: 2, calidad: 'baja', limiteFps: 'auto', modoFluido: true }));
let a = G.cargarAjustes();
assert.equal(a.distancia, 'calidad'); assert.equal(a.distanciaPlantas, 'normal');
assert.equal(distanciasDe(a.calidad, a.distancia, a.distanciaPlantas).lejos, 185, 'el de baja: 185 m, como siempre');
assert.equal(a.modoFluido, true, 'lo demás no se toca');
G.guardarAjustes({ ...a, distancia: 7, distanciaPlantas: 'muylejos' });
a = G.cargarAjustes();
assert.equal(a.distancia, 7); assert.equal(a.distanciaPlantas, 'muylejos');
G.guardarAjustes({ ...a, distancia: 40, distanciaPlantas: 'infinito' });
a = G.cargarAjustes();
assert.equal(a.distancia, 10, 'se acota'); assert.equal(a.distanciaPlantas, 'normal');
G.guardarAjustes({ ...a, distancia: 'calidad' });
assert.equal(G.cargarAjustes().distancia, 'calidad', 'se puede volver a según la calidad');

// ---------------------------------------------------------------- 3. ninguna tarea pesada espera para siempre
{
  // la placa no llega nunca: 33 ms por cuadro con objetivo 16,7 → todos los cuadros son lentos
  const plan = crearPlanificadorAntitirones({ objetivoMs: 16.7, maxPesadas: 1, maxSecundarias: 3 });
  let corridas = 0, sombras = 0, desde = 0, peor = 0, t = 0;
  plan.comenzarCuadro(0.033, 3, 16.7);
  assert.equal(plan.permitir('vegetacion', { pesada: true }), false, 'tras un cuadro lento, lo pesado espera (como antes)');
  for (let i = 0; i < 400; i++) {
    plan.comenzarCuadro(0.033, 3, 16.7); t += 0.033;
    assert.ok(plan.frameLento, 'todos los cuadros son lentos');
    if (plan.permitir('vegetacion', { pesada: true })) { corridas++; peor = Math.max(peor, t - desde); desde = t; }
    if (plan.permitir('sombras', { pesada: true })) sombras++;
  }
  assert.ok(corridas >= 25, `la vegetación corre igual (${corridas} veces en 400 cuadros; antes 0)`);
  assert.ok(sombras >= 20, `y las sombras también (${sombras})`);
  assert.ok(peor <= ESPERA_MAXIMA_S + 0.1, `nunca espera más de ${ESPERA_MAXIMA_S} s (${peor.toFixed(2)})`);
  // y nunca dos pesadas en el mismo cuadro
  const p2 = crearPlanificadorAntitirones({ objetivoMs: 16.7 });
  for (let i = 0; i < 40; i++) {
    p2.comenzarCuadro(0.05, 3, 16.7);
    const a1 = p2.permitir('a', { pesada: true }), b1 = p2.permitir('b', { pesada: true });
    assert.ok(!(a1 && b1), 'una pesada por cuadro');
  }
}

// ---------------------------------------------------------------- 4. el bosque y el pasto armados en Node
const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const info = new Map(), orden = [], visitados = new Set();
function visitar(archivo) {
  archivo = path.resolve(archivo);
  if (visitados.has(archivo)) return;
  visitados.add(archivo);
  const texto = fs.readFileSync(archivo, 'utf8');
  const deps = [];
  for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(normalizar(archivo, m[2]));
  info.set(archivo, texto);
  for (const d of deps) visitar(d);
  orden.push(archivo);
}
function transformar(archivo, texto) {
  const ex = [];
  for (const m of texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) ex.push(m[1]);
  texto = texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  texto = texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_t, nombres, spec) => {
    const partes = nombres.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [p, q] = x.split(/\s+as\s+/); return q ? `${p.trim()}: ${q.trim()}` : p.trim(); });
    return `const { ${partes.join(', ')} } = ${idModulo(normalizar(archivo, spec))};`;
  });
  texto = texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  return `const ${idModulo(archivo)}=(()=>{\n${texto}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
}
visitar(path.join(src, 'terreno.js'));
visitar(path.join(src, 'vegetacion.js'));
visitar(path.join(src, 'pasto.js'));
visitar(path.join(src, 'config.js'));
let codigo = leer('three-r186-inline.js') + '\n';
for (const f of orden) codigo += transformar(f, info.get(f)) + '\n';
codigo += `
globalThis.__R = (() => {
  const T = __mod_terreno.generarTerreno();
  const calidad = { ...__mod_config.CALIDADES.media };
  const escena = new THREE.Scene();
  const veg = __mod_vegetacion.generarVegetacion(T, calidad, escena);
  return { T, veg, escena, calidad, THREE, pasto: __mod_pasto, medioAnguloVista: __mod_vegetacion.medioAnguloVista };
})();`;
const noop = () => {};
const ctx2d = new Proxy({ measureText: (t) => ({ width: String(t).length * 20 }), createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }), getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }, { get: (t, p) => (p in t ? t[p] : noop), set: (t, p, v) => { t[p] = v; return true; } });
const contexto = { console, Math, Float32Array, Float64Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Date, Symbol, Proxy, Reflect, JSON, Number, String, Array, Object, Error, TypeError, RangeError, Promise, Infinity, NaN, isFinite, isNaN, parseInt, parseFloat,
  performance: { now: () => 0 }, document: { createElement: (tag) => (tag === 'canvas' ? { width: 1, height: 1, getContext: () => ctx2d } : {}) }, self: {}, window: {} };
contexto.globalThis = contexto;
vm.createContext(contexto);
vm.runInContext(codigo, contexto, { filename: 'distancia-3-5.js' });
const { veg, escena, calidad, THREE, pasto: P, medioAnguloVista } = contexto.__R;

// --- el medio ángulo de la vista con la inclinación
{
  const cam = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 1000);
  cam.position.set(0, 2, 0); cam.rotation.set(0, 0.7, 0, 'YXZ'); cam.updateMatrixWorld();
  const horizontal = Math.atan(Math.tan(35 * Math.PI / 180) * 16 / 9);
  assert.ok(Math.abs(medioAnguloVista(cam.matrixWorld.elements, 70, 16 / 9) - horizontal) < 1e-6, 'derecho: el medio campo horizontal de siempre');
  cam.rotation.set(-40 * Math.PI / 180, 0.7, 0, 'YXZ'); cam.updateMatrixWorld();
  assert.ok(medioAnguloVista(cam.matrixWorld.elements, 70, 16 / 9) > horizontal + 0.3, 'mirando 40° abajo las esquinas de abajo se abren mucho más');
  cam.rotation.set(-70 * Math.PI / 180, 0.7, 0, 'YXZ'); cam.updateMatrixWorld();
  assert.equal(medioAnguloVista(cam.matrixWorld.elements, 70, 16 / 9), -1, 'casi derecho abajo: sin cono');
}

// --- valores por defecto y en vivo
const grupoSoto = escena.children.find((o) => o.name === 'sotobosque');
const d0 = veg.distancias();
assert.equal(d0.lejos, 230, 'media: el borde del bosque de siempre');
assert.ok(Math.abs(d0.soto - CALIDADES.media.sotobosque * ALCANCE_SOTO) < 1e-9, 'el sotobosque se funde hasta su alcance');
assert.ok(Math.abs(d0.suelo - 52 * ALCANCE_SOTO) < 1e-9 && Math.abs(d0.contacto - 46 * ALCANCE_SOTO) < 1e-9, 'la hojarasca y las sombras de contacto con sus topes de siempre');
assert.equal(veg.fundidoSoto('helecho', 5), 1, 'cerca, entera');
assert.equal(veg.fundidoSoto('helecho', d0.soto + 1), 0, 'en el alcance, nada');
const medio = veg.fundidoSoto('helecho', d0.soto - 0.15 * d0.soto);
assert.ok(medio > 0.05 && medio < 0.95, `en la banda, a medias (${medio.toFixed(2)})`);
// los materiales del sotobosque llevan el fundido (uniformes compartidos, sin shaders nuevos)
const matsSoto = ['arbusto', 'hierba', 'roca', 'suelo'].map((k) => veg.mats[k].userData.lod.uSotoFin.value);
assert.ok(matsSoto.every((v) => v > 0), 'matas, piedras y hojarasca con fundido');
assert.ok(veg.mats.arbol.alta.userData.lod.uSotoFin.value === 0, 'los árboles no');
const imp = veg.prepararImpostores({ getRenderTarget: () => null, setRenderTarget: noop, getClearColor: noop, getClearAlpha: () => 1, setClearColor: noop, render: noop, autoClear: true, shadowMap: { autoUpdate: true } });
assert.equal(imp.estado.uLejos.value, 230);
const inicioImp = imp.estado.uInicio.value;
veg.ajustarDistancias({ lejos: 360, plantas: 1.4 }, true);
assert.equal(imp.estado.uLejos.value, 360, 'los carteles llegan a la distancia elegida');
assert.equal(veg.mats.arbol.baja.userData.lod.uLodLejos.value, 360, 'y el 3D simplificado también');
assert.equal(veg.alcanceArboles(), 360);
assert.equal(imp.estado.uInicio.value, inicioImp, 'el relevo al cartel no se mueve');
assert.ok(Math.abs(veg.distancias().soto - CALIDADES.media.sotobosque * ALCANCE_SOTO * 1.4) < 1e-9, 'las plantas estiran el sotobosque');
veg.ajustarDistancias({ lejos: 80, plantas: 1.8 }, true);
assert.ok(veg.distancias().soto <= 80, 'el sotobosque no pasa el borde del bosque');
// sin `inmediato`, el borde se acerca de a poco (suavizar, antes de cada dibujo)
veg.ajustarDistancias({ lejos: 230, plantas: 1 }, true);
veg.ajustarDistancias({ lejos: 300, plantas: 1 });
assert.equal(veg.alcanceArboles(), 230, 'no salta: se acerca de a poco');
assert.equal(veg.distancias().objetivoLejos, 300);
veg.ajustarDistancias({ lejos: 230, plantas: 1 }, true);

// --- lo cercano no depende del cono; nada más allá del alcance
const a0 = veg.arboles[Math.floor(veg.arboles.length / 2)];
const pos = new THREE.Vector3(a0.x + 3, a0.y + 1.7, a0.z + 3);
veg.actualizar(pos);
const camSoto = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 1000);
const enBloques = () => {
  const s = new Map();
  for (const m of grupoSoto.children) {
    if (!m.visible) continue;
    const arr = m.instanceMatrix.array;
    for (let i = 0; i < m.count; i++) s.set(m.name + ':' + arr[i * 16 + 12].toFixed(2) + ',' + arr[i * 16 + 14].toFixed(2), [arr[i * 16 + 12], arr[i * 16 + 13], arr[i * 16 + 14], m.name]);
  }
  return s;
};
const cercaDe = (s, r) => [...s.entries()].filter(([, e]) => Math.hypot(e[0] - pos.x, e[2] - pos.z) < r).map(([k]) => k).sort();
let referencia = null, total = 0;
for (let k = 0; k < 4; k++) {
  camSoto.position.copy(pos); camSoto.rotation.set(0, k * Math.PI / 2, 0, 'YXZ'); camSoto.updateMatrixWorld();
  veg.revisarSoto(camSoto);
  const s = enBloques();
  total = Math.max(total, s.size);
  const cerca = cercaDe(s, 22);
  if (!referencia) referencia = cerca;
  else assert.deepEqual(cerca, referencia, 'a menos de 22 m, lo mismo mire para donde mire');
  for (const [, e] of s) {
    const d = Math.hypot(e[0] - pos.x, e[2] - pos.z);
    assert.ok(d <= veg.distancias().soto + 7.01, `nada más allá del alcance de su grupo (${d.toFixed(1)} m)`);
  }
}
assert.ok(referencia.length > 0, `hay sotobosque cerca para probar (${referencia.length})`);
// todo lo que hay a menos de 22 m (no despejado) está en los bloques
let esperadas = 0;
for (const ch of veg.chunks.values()) for (const [nombre, mallas] of Object.entries(ch.porTipo || {})) {
  const f = mallas[0];
  if (!f || f.parent === null && nombre.startsWith('coihue')) continue;
  if (!grupoSoto.children.some((m) => m.name === 'soto-' + nombre)) continue;
  const arr = f.instanceMatrix.array;
  for (let i = 0; i < f.count; i++) {
    if (arr[i * 16] === 0 && arr[i * 16 + 5] === 0 && arr[i * 16 + 10] === 0) continue;
    if (Math.hypot(arr[i * 16 + 12] - pos.x, arr[i * 16 + 14] - pos.z) < 22) esperadas++;
  }
}
assert.equal(referencia.length, esperadas, 'todo el sotobosque cercano está, mire para donde mire');

// --- con la cámara alta mirando abajo: lo que se ve está en los bloques
{
  const v = new THREE.Vector3();
  const cam = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 1000);
  var altasVistas = 0;
  for (let k = 0; k < 8; k++) {
    cam.position.set(pos.x, pos.y + 22, pos.z); cam.rotation.set(-40 * Math.PI / 180, k * Math.PI / 4, 0, 'YXZ'); cam.updateMatrixWorld();
    cam.updateProjectionMatrix(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    veg.revisarSoto(cam);
    const s = enBloques();
    let faltan = 0, vistas = 0;
    for (const ch of veg.chunks.values()) for (const [nombre, mallas] of Object.entries(ch.porTipo || {})) {
      if (!grupoSoto.children.some((m) => m.name === 'soto-' + nombre)) continue;
      const f = mallas[0], arr = f.instanceMatrix.array;
      for (let i = 0; i < f.count; i++) {
        if (arr[i * 16] === 0 && arr[i * 16 + 5] === 0 && arr[i * 16 + 10] === 0) continue;
        const x = arr[i * 16 + 12], y = arr[i * 16 + 13], z = arr[i * 16 + 14];
        if (veg.fundidoSoto(nombre, Math.hypot(x - cam.position.x, z - cam.position.z)) < 0.02) continue;
        v.set(x, y + 0.3, z).project(cam);
        if (!(v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1)) continue;
        vistas++;
        if (!s.has('soto-' + nombre + ':' + x.toFixed(2) + ',' + z.toFixed(2))) faltan++;
      }
    }
    altasVistas += vistas;
    assert.equal(faltan, 0, `desde 22 m de alto, mirando 40° abajo (rumbo ${k * 45}°): faltaban ${faltan} de ${vistas} a la vista`);
  }
  assert.ok(altasVistas > 50, `desde arriba se ve sotobosque para probar (${altasVistas})`);
}

// --- el pasto: el anillo se estira con la misma densidad; con Normal, las mismas matas de siempre
{
  const calP = { ...CALIDADES.media };
  const pasto = P.crearPasto(calP);
  const n0 = Math.round(calP.pasto * 0.36);
  assert.equal(pasto.matas, n0, 'normal: la misma cantidad de matas de antes');
  assert.equal(pasto.radio, calP.radioPasto);
  const geo = pasto.malla.geometry;
  const copia = Array.from(geo.attributes.aOffset.array.subarray(0, n0 * 2));
  const afuera = Array.from(geo.attributes.aRadio.array.subarray(0, n0)).filter((r) => r === 1).length;
  pasto.ajustar(1.4);
  assert.ok(Math.abs(pasto.radio - calP.radioPasto * 1.4) < 1e-9);
  const esperado = n0 + Math.round(afuera * (1.4 * 1.4 - 1));
  assert.equal(pasto.matas, esperado, 'lejos: más matas en el anillo de afuera (la misma densidad)');
  const rAfuera = Array.from(geo.attributes.aRadio.array.subarray(0, pasto.matas)).filter((r) => r === 1).length;
  assert.ok(Math.abs(rAfuera / (2 * 1.4) ** 2 - afuera / 2 ** 2) / (afuera / 4) < 0.02, 'densidad del anillo de afuera igual');
  pasto.ajustar(0.7);
  assert.equal(pasto.matas, Math.round(n0 * 0.49), 'cerca: menos matas');
  pasto.ajustar(1);
  assert.deepEqual(Array.from(geo.attributes.aOffset.array.subarray(0, n0 * 2)), copia, 'de vuelta a normal: las mismas matas');
  assert.equal(pasto.matas, n0);
  pasto.ajustar(1.8);
  assert.ok(pasto.matas <= geo.attributes.aOffset.count, 'el máximo entra en los búferes');
  // el presupuesto acorta con el fundido, no con el radio del anillo (que corría todo el pasto)
  const uR = pasto.malla.material.uniforms.uR.value;
  for (let i = 0; i < 50; i++) pasto.actualizar(new THREE.Vector3(), null, 0.73);
  assert.equal(pasto.malla.material.uniforms.uR.value, uR, 'el anillo no se mueve con el presupuesto');
  assert.ok(pasto.malla.material.uniforms.uCorte.value < 1, 'se acorta el fundido, de a poco');
}

// ---------------------------------------------------------------- 5. enganches
const main = leer('src/main.js'), plantilla = leer('src/plantilla.html'), pastoFuente = leer('src/pasto.js'), mat = leer('src/materiales.js'), pkg = JSON.parse(leer('package.json'));
assert.ok(plantilla.includes('id="ajuste-distancia"') && plantilla.includes('min="2" max="10"'), 'la barra de bloques');
assert.ok(plantilla.includes('data-ajuste="distancia"><button data-valor="calidad">Según la calidad</button>'));
assert.ok(plantilla.includes('data-ajuste="distanciaPlantas"><button data-valor="cerca">Cerca</button><button data-valor="normal">Normal</button><button data-valor="lejos">Lejos</button><button data-valor="muylejos">Muy lejos</button>'));
assert.ok(plantilla.includes('le piden más a la placa'), 'avisa que el pasto lejos pide más');
assert.match(main, /calidadActiva = cambio\.hasta;\s*aplicarDistancias\(\);/, 'la calidad automática no pisa la distancia elegida');
assert.match(main, /if \(clave === 'distancia' \|\| clave === 'distanciaPlantas'\) \{ aplicarDistancias\(\);/, 'se aplica en vivo');
assert.match(main, /aplicarDistancias\(true\);/, 'y al cargar');
assert.ok(main.includes('`dibujo ${'), 'F3 muestra la distancia de dibujo y la de plantas');
assert.match(main, /calidad\.nieblaDistancia = distActual\.niebla;/);
assert.ok(leer('src/cielo.js').includes('(calidad.nieblaDistancia || 1)'), 'la niebla sigue a la distancia');
assert.ok(pastoFuente.includes('alto *= desvanecer * vivo;'), 'las flores crecen desde cero en el borde');
assert.ok(pastoFuente.includes('(1.0 - step(0.4, estT.b))'), 'el pasto no atraviesa los pisos');
assert.ok(main.includes('function marcarPisos()') && main.includes("estep[i * 4 + 2] = 0;"), 'el canal de los pisos');
assert.ok(mat.includes('if (uSotoFin > 0.5)'), 'el fundido del sotobosque en el material');
assert.ok(pkg.scripts.verify.includes('node pruebas/verificar-3-5-distancia.mjs'), 'la prueba corre en verify');
console.log(`verificar-3-5-distancia: ok · ${referencia.length} matas a menos de 22 m en las cuatro direcciones, hasta ${total} en bloques`);
