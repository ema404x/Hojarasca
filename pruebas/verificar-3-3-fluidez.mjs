// 3.3: fluidez. El presupuesto fijo de luces (luces.js), el modo fluido (resolución dinámica,
// rendimiento.js), sus ajustes (guardado.js y plantilla.html), los enganches en main.js y la
// carga que sólo calcula las texturas que se usan (texturas.js).
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { crearEscalaFluida, AJUSTES_FLUIDO, percentil } from '../src/rendimiento.js';
import { TEXTURAS, GENERADORES_EN_USO } from '../src/texturas-datos.js';

const leer = (r) => fs.readFileSync(new URL(r, import.meta.url), 'utf8');
const main = leer('../src/main.js');
const lucesFuente = leer('../src/luces.js');
const plantilla = leer('../src/plantilla.html');
const texturasFuente = leer('../src/texturas.js');

// ---------------------------------------------------------------- 1. luces.js con el three de verdad
// (el mismo runtime que va en el juego, en un contexto aislado; luces.js sin import/export)
const ctx = vm.createContext({ console });
vm.runInContext(`${leer('../three-r186-inline.js')}\n;globalThis.THREE = THREE;`, ctx);
const L = vm.runInContext(`(() => {
${lucesFuente.replace("import * as THREE from 'three';", '').replace(/^export /gm, '')}
return { registrarLuz, olvidarLuz, repartirLuces, puntajeLuz, crearPresupuestoLuces, PRESUPUESTO_LUCES };
})()`, ctx);
const { THREE } = ctx;

// 1a. el reparto: las más importantes, y cada una conserva su lugar mientras siga elegida
{
  const a = { n: 'a' }, b = { n: 'b' }, c = { n: 'c' }, d = { n: 'd' };
  let r = L.repartirLuces([{ fuente: c, puntaje: 3 }, { fuente: a, puntaje: 1 }, { fuente: b, puntaje: 2 }, { fuente: d, puntaje: 9 }], 3);
  assert.deepEqual(Array.from(r, (x) => x?.n), ['a', 'b', 'c'], 'las tres más cercanas, en orden');
  r = L.repartirLuces([{ fuente: d, puntaje: 0.5 }, { fuente: b, puntaje: 2 }, { fuente: c, puntaje: 3 }], 3, r);
  assert.deepEqual(Array.from(r, (x) => x?.n), ['d', 'b', 'c'], 'b y c no se mueven; d ocupa el lugar libre de a');
  r = L.repartirLuces([{ fuente: c, puntaje: 1 }], 3, r);
  assert.deepEqual(Array.from(r, (x) => x?.n ?? null), [null, null, 'c'], 'los lugares sin fuente quedan vacíos');
  assert.deepEqual(Array.from(L.repartirLuces([], 2)), [null, null]);
  assert.ok(L.puntajeLuz(0, 0, 5, 10, { x: 0, y: 0, z: 0 }) < L.puntajeLuz(0, 0, 30, 40, { x: 0, y: 0, z: 0 }) + 1, 'adentro del alcance, por cercanía');
  assert.ok(L.puntajeLuz(0, 0, 25, 10, { x: 0, y: 0, z: 0 }) > L.puntajeLuz(0, 0, 9, 10, { x: 0, y: 0, z: 0 }), 'afuera del alcance pesa mucho más');
}

// 1b. el presupuesto en una escena: three ve siempre la misma cantidad de luces
{
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(70, 16 / 9, 0.15, 8000);
  escena.add(camara);
  const P = L.crearPresupuestoLuces(escena, camara, { puntuales: 3, focos: 1 });
  const casa = new THREE.Group();
  escena.add(casa);
  const luces = [];
  for (let i = 0; i < 5; i++) {
    const l = new THREE.PointLight(0xffaa66, 0, 12, 1.6);
    l.position.set(0, 1, -5 - i * 4);
    casa.add(l); L.registrarLuz(l); luces.push(l);
  }
  const foco = new THREE.SpotLight(0xfff0d8, 0, 42, 0.42, 0.5, 1.2);
  foco.target.position.set(0, -0.6, -6);
  camara.add(foco, foco.target); L.registrarLuz(foco);
  P.activar();
  const ver = () => {   // lo que three juntaría: luces visibles y en una capa de la cámara
    let p = 0, s = 0;
    escena.traverseVisible((o) => { if (o.isLight && o.layers.test(camara.layers)) { if (o.isSpotLight) s++; else if (o.isPointLight) p++; } });
    return p + ',' + s;
  };
  const cuadro = () => { escena.updateMatrixWorld(); camara.updateMatrixWorld(); escena.onBeforeRender(null, escena, camara, null); };
  assert.equal(ver(), '3,1', 'three ve las fijas y ninguna del juego');
  cuadro();
  assert.equal(P.stats.vivas, 0, 'apagadas (intensidad 0) no ocupan lugar');
  assert.ok(P.fijasP.every((f) => f.intensity === 0) && P.fijasS[0].intensity === 0);
  // de noche se prenden: entran las tres más cercanas, con su color, alcance y caída
  luces.forEach((l) => { l.intensity = 2; });
  foco.intensity = 5;
  cuadro();
  assert.equal(ver(), '3,1', 'la cantidad no cambia al prenderse');
  assert.equal(P.stats.vivas, 6);
  const usadas = Array.from(P.fijasP, (f) => Math.round(new THREE.Vector3().setFromMatrixPosition(f.matrixWorld).z)).sort((a, b) => b - a);
  assert.deepEqual(usadas, [-5, -9, -13], 'las tres más cercanas a la cámara');
  assert.ok(P.fijasP.every((f) => f.intensity === 2 && f.distance === 12 && f.decay === 1.6 && f.color.getHex() === 0xffaa66));
  const s = P.fijasS[0];
  assert.ok(s.intensity === 5 && s.distance === 42 && s.angle === 0.42 && s.penumbra === 0.5, 'el foco copia sus datos');
  assert.ok(new THREE.Vector3().setFromMatrixPosition(s.target.matrixWorld).distanceTo(new THREE.Vector3(0, -0.6, -6)) < 1e-6, 'y apunta adonde apunta el de verdad');
  // el juego oculta la casa: las fijas se apagan, la cantidad sigue igual
  casa.visible = false;
  cuadro();
  assert.equal(ver(), '3,1');
  assert.ok(P.fijasP.every((f) => f.intensity === 0), 'una casa oculta no ilumina');
  casa.visible = true;
  // una fuente fuera de lo que ve la cámara (con su alcance entero atrás) no ocupa lugar
  luces[0].position.set(0, 1, 200);
  cuadro();
  assert.equal(P.stats.fuera, 1, 'la de atrás no cuenta');
  // una luz registrada después también queda escondida para three
  const tarde = L.registrarLuz(new THREE.PointLight(0xffffff, 1, 5, 2));
  escena.add(tarde);
  assert.equal(ver(), '3,1', 'la luz nueva no cambia la cantidad');
  L.olvidarLuz(tarde);
  // las luces del juego siguen siendo del juego: no se tocan intensidades ni posiciones
  assert.ok(luces.every((l) => l.intensity === 2) && foco.intensity === 5);
}
assert.deepEqual({ ...L.PRESUPUESTO_LUCES }, { puntuales: 4, focos: 1 }, 'el cupo medido (ver CAMBIOS_3_3_0)');

// 1c. main.js: el presupuesto se prende al armar la escena y la carga lo compila todo
assert.ok(main.includes("import { crearPresupuestoLuces } from './luces.js';"));
assert.ok(main.includes('const presupuestoLuces = crearPresupuestoLuces(escena, camara);') && main.includes('presupuestoLuces.activar();'));
assert.ok(main.includes('await variantesLuces.compilarCarga(jugador.estado.pos);'), 'la carga espera los programas');
assert.ok(lucesFuente.includes('if (presupuestoActivo) return presupuestoActivo.compilarTodo(renderer, objetivo());'), 'con el presupuesto, todo de una vez');
assert.ok(lucesFuente.includes('renderer.compileAsync(escena, camara)'), 'en paralelo si la placa puede');
assert.ok(lucesFuente.includes('if (presupuestoActivo) return;   // 3.3'), 'las variantes no trabajan con el presupuesto prendido');

// ---------------------------------------------------------------- 2. modo fluido
{
  assert.equal(AJUSTES_FLUIDO.min, 0.7);
  assert.equal(AJUSTES_FLUIDO.max, 1);
  assert.equal(percentil([5, 1, 3, 2, 4], 5, 0.5), 3);
  const f = crearEscalaFluida();
  let t = 0;
  const correr = (costo, ms, objetivo = 16.7) => { const cambios = []; for (let fin = t + ms; t < fin; t += objetivo) { const e = f.anotar(costo, objetivo, t); if (e !== null) cambios.push([Math.round(t), e]); } return cambios; };
  assert.deepEqual(correr(10, 5000), [], 'con margen no cambia nada');
  assert.equal(f.escala, 1);
  // la placa no llega: baja de a 10%, nunca más seguido que cada 2 s, y no baja de 70%
  const bajadas = correr(16, 12000);
  assert.deepEqual(bajadas.map((c) => c[1]), [0.9, 0.8, 0.7], 'escalones de 10% hasta 70%');
  for (let i = 1; i < bajadas.length; i++) assert.ok(bajadas[i][0] - bajadas[i - 1][0] >= 2000, 'a lo sumo un cambio cada 2 s');
  assert.deepEqual(correr(16, 6000), [], 'no baja de 70%');
  // tirones sueltos no bajan la resolución
  const g = crearEscalaFluida();
  let cambio = null;
  for (let i = 0, tt = 0; i < 600; i++, tt += 16.7) { const e = g.anotar(i % 20 === 0 ? 60 : 9, 16.7, tt); if (e !== null) cambio = e; }
  assert.equal(cambio, null, 'un tirón cada 20 cuadros no mueve la escala');
  // sobra: sube, pero sólo si con el escalón de más igual queda margen (histéresis), cada 4 s
  const subidas = correr(7, 30000);
  assert.ok(subidas.length >= 1 && subidas.every((c, i) => i === 0 || c[0] - subidas[i - 1][0] >= 4000), 'sube despacio');
  assert.equal(f.escala, 1, 'vuelve a 100%');
  // en el borde (justo lo que da la placa a 70%) no oscila: ni baja ni sube
  const h = crearEscalaFluida({});
  correr.call(null, 0, 0);
  let tt = 0; const cambiosH = [];
  for (let i = 0; i < 200; i++, tt += 16.7) { const e = h.anotar(16, 16.7, tt); if (e !== null) cambiosH.push(e); }
  const costoA = (e) => 16.7 * 0.8 * (e * e) / (0.7 * 0.7);   // la placa cuesta según el área
  for (let i = 0; i < 2000; i++, tt += 16.7) { const e = h.anotar(costoA(h.escala), 16.7, tt); if (e !== null) cambiosH.push(e); }
  const ultimos = cambiosH.slice(-4);
  assert.ok(new Set(ultimos.slice(-2)).size <= 1 || cambiosH.length <= 4, `sin oscilar: ${cambiosH.join(' ')}`);
  f.reiniciar();
  assert.equal(f.escala, 1);
}
// los enganches: el lienzo y las salidas del postproceso cambian juntos, y sólo con el modo prendido
assert.ok(main.includes('renderer.setPixelRatio(relacionPixelBase * e);') && main.includes('if (post) post.redimensionar(window.innerWidth, window.innerHeight);'));
assert.ok(main.includes("if (!ajustes.modoFluido || modo !== 'jugando') {"), 'apagado o fuera del juego, no hace nada');
assert.ok(main.includes('revisarModoFluido(msGpu >= 0 ? msGpu : costo, cadencia.pasoMs > 0 ? cadencia.pasoMs : 1000 / 60);'), 'mira la placa contra el ritmo');
assert.ok(main.includes("fluido ${ajustes.modoFluido ? Math.round(escalaFluida * 100) + '%' : 'apagado'}"), 'F3 lo muestra');

// ---------------------------------------------------------------- 3. ajustes
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const G = await import('../src/guardado.js');
  assert.equal(G.AJUSTES_BASE.modoFluido, false, 'apagado de fábrica');
  assert.equal(G.cargarAjustes().modoFluido, false, 'jugador nuevo: apagado');
  datos.set('hojarasca-ajustes-v1', JSON.stringify({ modoFluido: 'si' }));
  assert.equal(G.cargarAjustes().modoFluido, false, 'sólo verdadero o falso');
  G.guardarAjustes({ ...G.cargarAjustes(), modoFluido: true });
  assert.equal(G.cargarAjustes().modoFluido, true, 'prendido queda prendido');
}
assert.ok(plantilla.includes('<div class="segmentos" data-ajuste="modoFluido"><button data-valor="true">Sí</button><button data-valor="false">No</button></div>'));
assert.ok(main.includes("if (clave === 'modoFluido') v = v === 'true';"));

// ---------------------------------------------------------------- 4. texturas: sólo las que se usan
assert.deepEqual(GENERADORES_EN_USO, ['manchas', 'vegetal']);
for (const n of ['manchas', 'vegetal', 'vegetalRelieve']) assert.ok(GENERADORES_EN_USO.includes(TEXTURAS[n].gen), `${n} se calcula al cargar`);
assert.ok(texturasFuente.includes('w.postMessage({ generadores: GENERADORES_EN_USO });'), 'el Worker calcula sólo ésas');
assert.ok(texturasFuente.includes('.filter((g) => GENERADORES_EN_USO.includes(g))'), 'nadie espera una que no se calcula');
for (const f of fs.readdirSync(new URL('../src/', import.meta.url)).filter((x) => x.endsWith('.js') && x !== 'texturas.js')) {
  const t = leer(`../src/${f}`);
  for (const fn of ['texturaMontana(', 'texturaSuelo(', 'texturaHojas(']) assert.ok(!t.includes(fn), `${f} pide ${fn}): sumala a GENERADORES_EN_USO`);
}

console.log('OK 3.3 fluidez · presupuesto fijo de luces (3D con three: cantidad constante, las más cercanas, lugares estables) · modo fluido 70–100% con histéresis · ajuste y F3 · carga con 2 de 5 generadores de texturas');
