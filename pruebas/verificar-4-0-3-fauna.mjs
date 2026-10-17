// 4.0.3: F4 de la zona F. Si talás el árbol donde pica un carpintero o donde está el panal, el pájaro se muda a un árbol que siga en pie (y no huye hacia uno talado),
// y el panal se va con sus abejas y su cilindro de colisión. Corre fauna.js y bichos.js de verdad.
import assert from 'node:assert/strict';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const THREE = await import('three');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const { crearFauna } = await import('../src/fauna.js');
const { crearBichos } = await import('../src/bichos.js');
const { crearColisiones } = await import('../src/colisiones.js');

const T = { sendero: Array.from({ length: 50 }, (_, i) => ({ x: i * 10 - 250, z: 0 })), indice: () => 0, bosque: new Float32Array(10).fill(0.8), pendiente: new Float32Array(10), pasto: new Float32Array(10), agua: () => null, altura: () => 0, normal: () => ({ x: 0, y: 1, z: 0 }), lugares: { mirador: { x: 0, y: 30, z: 0 } }, estepa: new Float32Array(10), distRio: new Float32Array(10), anchoRio: new Float32Array(10) };
const arboles = []; for (let i = 0; i < 400; i++) arboles.push({ x: (i % 20) * 50 - 500, z: Math.floor(i / 20) * 50 - 500, y: 0, r: 0.8, esc: 1.2, especie: i % 2 ? 'coihue' : 'lenga', sacado: false });
const veg = { arboles, plantas: [] };
const sonido = new Proxy({}, { get: () => () => {} });
const clima = { escuchando: 0, dia: 1, noche: 0, lluvia: 0, otono: 0 };

// ---------------------------------------------------------------- los carpinteros
{
  const escena = new THREE.Scene();
  const f = crearFauna(T, veg, { resolver() {} }, escena, sonido, () => {}, { entradas: {} });
  const c = f.carpinteros[0];
  const posada = c.posada;
  ok(f.carpinteros.length >= 3, `hay carpinteros (${f.carpinteros.length})`);
  posada.sacado = true;   // lo que hace vegetacion.talar(a)
  const camara = new THREE.PerspectiveCamera(); camara.position.set(posada.x + 100, 2, posada.z);
  const jug = { estado: { pos: new THREE.Vector3(posada.x + 100, 0, posada.z), zoom: false, agachado: false } };
  for (let i = 0; i < 40; i++) f.actualizar(0.05, jug, camara, clima);
  ok(c.posada !== posada && !c.posada.sacado, 'tras talar su árbol, el carpintero se muda a uno que sigue en pie');
  ok(Math.hypot(c.g.position.x - c.posada.x, c.g.position.z - c.posada.z) < 2, 'y está sobre ese árbol (no en el aire sobre el tocón)');
  ok(!f.carpinteros.some((o) => o !== c && o.posada === c.posada), 'sin pisarle la posada a otro');
  // al espantarlos, ninguno vuela a un árbol talado
  for (const a of arboles.slice(0, 120)) a.sacado = a.sacado || ((a.x * 7 + a.z) % 3 === 0);
  let vuelos = 0, aTalado = 0;
  const jug2 = { estado: { pos: new THREE.Vector3(), zoom: false, agachado: false } };
  for (const ci of f.carpinteros) for (let i = 0; i < 40; i++) {
    if (ci.posada.sacado) continue;
    jug2.estado.pos.set(ci.g.position.x + 3, 0, ci.g.position.z); camara.position.copy(jug2.estado.pos);
    ci.volando = null; f.actualizar(0.05, jug2, camara, clima);
    if (ci.volando) { vuelos++; if (ci.volando.arbol.sacado) aTalado++; }
  }
  ok(vuelos > 20 && aTalado === 0, `vuelos de huida: ${vuelos}, hacia un árbol talado: ${aTalado}`);
  // si no queda ninguna posada en pie, el pájaro se esconde (no queda flotando)
  for (const a of arboles) a.sacado = true;
  for (let i = 0; i < 10; i++) f.actualizar(0.05, jug, camara, clima);
  ok(f.carpinteros.every((ci) => ci.volando || ci.g.visible === false), 'sin árboles en pie, los carpinteros se esconden');
  for (const a of arboles) a.sacado = false;
}

// ---------------------------------------------------------------- el panal (con el terreno de verdad, en la vm del arnés)
{
  const { cargarModulos } = await import('./ayuda-4-0-3-valle.mjs');
  const { THREE: V3, M } = cargarModulos(['terreno.js', 'colisiones.js', 'bichos.js']);
  const TT = M.terreno.generarTerreno();
  const escena = new V3.Scene();
  const col = M.colisiones.crearColisiones();
  const arb = []; for (let i = 0; i < 300; i++) arb.push({ x: (i % 20) * 40 - 400, z: Math.floor(i / 20) * 40 - 300, y: 0, r: 0.8, esc: 1.3, especie: i % 2 ? 'coihue' : 'lenga', sacado: false });
  const vegV = { arboles: arb, plantas: [], colisiones: [] };
  const b = M.bichos.crearBichos(TT, vegV, col, escena, sonido, () => {}, { entradas: {} }, { items: [] });
  const panal = b._debug.panal;
  ok(!!panal, 'bichos arma un panal');
  const a = panal.arbol;
  const camara = new V3.PerspectiveCamera(); camara.position.set(a.x + 10, 2, a.z);
  const jug = { estado: { pos: new V3.Vector3(a.x + 8, 0, a.z), zoom: false, agachado: false, vel: new V3.Vector3() }, pos: new V3.Vector3(a.x + 8, 0, a.z) };
  const q = { x: a.x + a.r * 0.5, y: 0, z: a.z };
  const p0 = { ...q }; col.resolver(p0, 0.35, 1.65);
  ok(Math.hypot(p0.x - q.x, p0.z - q.z) > 0.1, 'con el árbol en pie, el tronco frena (lo del panal)');
  a.sacado = true;   // lo que hace vegetacion.talar(a)
  for (let i = 0; i < 5; i++) b.actualizar(0.05, jug, camara, { ...clima, escuchando: 0 });
  ok(panal.talado === true && panal.g.visible === false && panal.puntos.visible === false, 'talado el árbol, el panal y sus abejas se van');
  const p1 = { ...q }; col.resolver(p1, 0.35, 1.65);
  ok(Math.hypot(p1.x - q.x, p1.z - q.z) < 0.01, 'y el cilindro de colisión del tronco ya no está');
}
// ---------------------------------------------------------------- las gallinas (F5)
{
  const { crearGallinas } = await import('../src/gallinero-mundo.js');
  const g = crearGallinas({ altura: () => 0 }, new THREE.Scene());
  g.sincronizar([{ x: 0, z: 0 }]);
  const a = g.aves[0];
  let max = 0;
  for (let i = 0; i < 1200; i++) {   // 60 s persiguiendo a una gallina a 1 m por detrás
    const dx = a.x - a.cx, dz = a.z - a.cz, l = Math.hypot(dx, dz) || 1;
    g.actualizar(0.05, 12, { x: a.x - (dx / l) * 1.0, z: a.z - (dz / l) * 1.0 });
    max = Math.max(max, Math.hypot(a.x - a.cx, a.z - a.cz));
  }
  ok(max <= 4.3, `F5: la gallina perseguida 60 s no pasa de ${max.toFixed(1)} m del gallinero (antes ~97 m)`);
  // sin perseguirla, anda por el corral como siempre
  const h = crearGallinas({ altura: () => 0 }, new THREE.Scene()); h.sincronizar([{ x: 0, z: 0 }]);
  for (let i = 0; i < 400; i++) h.actualizar(0.05, 12, { x: 500, z: 500 });
  ok(h.aves.every((b) => Math.hypot(b.x - b.cx, b.z - b.cz) <= 4.3), 'sin nadie cerca, todas siguen en el corral');
}
// ---------------------------------------------------------------- los zorros (F10): sólo se prueba el enchufe (el recorrido en el juego no se vio)
{
  const v = (await import('node:fs')).readFileSync(new URL('../src/vida.js', import.meta.url), 'utf8');
  ok(v.includes('if (Math.hypot(p.x - js.pos.x, p.z - js.pos.z) > 190) { z.pos.set(p.x, T.altura(p.x, p.z), p.z);'), 'F10: el zorro reaparece a más de 190 m (se los ve hasta los 180)');
}
console.log(`OK 4.0.3 fauna · ${n} verificaciones · el carpintero y el panal no quedan pegados a un árbol talado`);
