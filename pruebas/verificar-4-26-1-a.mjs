// 4.26.1 (A): los interiores que quedaron afuera en la 4.26.0 (la casilla, el puesto de troncos, el taller anexo, la buhardilla, la planta alta y las
// habitaciones modulares) y la medición limpia.
//
// 1. La luz que se cuela (pruebas/ayuda-fugas.mjs): con la geometría de verdad de cada obra (la malla fusionada, en Baja y en Alta), peines de rayos
//    perpendiculares a cada pared (cada 3 mm), hacia el piso y hacia el techo (cada 4 y 5 mm): ninguno sale del cuarto sin tocar un triángulo salvo
//    por una abertura. Antes de esta versión salían miles (la casilla por los hastiales y el alero, el puesto entre tronco y tronco y bajo el techo, las
//    tres ampliaciones por las juntas de 8 mm de sus paredes de tablas, las habitaciones modulares por todos lados). La cabaña de tablas y piedra (que
//    ya estaba en la regla) sirve de testigo: 0 antes y después.
// 2. Cada obra sigue siendo UNA malla (0 llamadas de dibujo nuevas) y suma pocos vértices; lo de afuera no cambia de silueta, y el techo modular sólo
//    se cierra sobre una habitación cerrada (una galería techada, tres paredes o una pared corrida quedan como en la 4.26.0).
// 3. Los techos modulares se rehacen cuando cambian las paredes de abajo: al terminar una, al sacarla, al empezar a moverla y al cargar la partida.
// 4. interior-visible.js: las cinco casas entran en CASAS_CERRADAS y las habitaciones modulares tienen su caja (cajaDeModulo) con la puerta, la ventana y
//    el lado que da a otro módulo como aberturas; el quincho y la galería cerrada siguen afuera.
// 5. main.js: interiorDelValle (el código de verdad, con un mundo de mentira) encuentra la casilla, el puesto y una habitación modular.
// 6. La medición: la bandera de las herramientas (HOJ_SIN_FRENO) saca el freno de Chromium sólo en las corridas de medición; el juego que se entrega no la
//    conoce y, minimizado, sigue bajando el consumo.
// Cada mutación es una copia con otro nombre (construccion.js, planos-ampliar.js o interior-visible.js) y corre en su propio proceso (la caché de ESM sólo
// mide la primera): tiene que hacer fallar su comprobación.
//
// Uso: node pruebas/verificar-4-26-1-a.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { registrarThree } from './ayuda-three.mjs';
import { fugasDeObra } from './ayuda-fugas.mjs';
import { funcion } from './ayuda-codigo.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const NL = String.fromCharCode(10);
const ALTA = { ocluir: true, contacto: true, halos: true, detalle: true };
// las medidas de los planos (construccion.js y planos-ampliar.js): ancho, fondo, alto
const MEDIDAS = { casilla: [4.4, 3.6, 2.25], puesto: [5.2, 4.2, 2.35], 'taller-anexo': [5.4, 3.8, 2.7], buhardilla: [4.4, 5.2, 3.25], 'planta-alta': [5.4, 4.6, 5.35] };
// las caras que ya caían justo en el plano del medio de las paredes del borde en la 4.26.0 (postes y zócalos: [para adentro, para afuera])
const CARAS_4260 = { Baja: { 'taller-anexo': [4, 40], buhardilla: [0, 40], 'planta-alta': [12, 40] }, Alta: { 'taller-anexo': [12, 40], buhardilla: [0, 40], 'planta-alta': [14, 40] } };

// Los cuartos, en el marco de cada obra (de pared a pared por adentro, del piso al borde de las paredes), y la puerta del frente (−z), la única abertura.
// Las alturas salen de cada plano: la casilla (paredes de 0,60 a 2,50), el puesto (piso a 0,58, troncos hasta 2,36 y el alma hasta el forro), el taller
// (de 2,95 adelante a 3,6 atrás), la buhardilla (los costados hasta 3,5) y la planta alta (las dos plantas, hasta 5,6).
const CUARTOS = {
  casilla: { x0: -2.15, x1: 2.15, z0: -1.75, z1: 1.75, y0: 0.62, y1: 2.5, ojos: [2.27], puerta: [-0.6, 0.6, 2.35], techo: { eje: 'x', incl: Math.atan2(1.0, 2.2) } },
  puesto: { x0: -2.45, x1: 2.45, z0: -1.95, z1: 1.95, y0: 0.58, y1: 2.55, ojos: [2.23], puerta: [-0.6, 0.6, 2.4], techo: { eje: 'x', incl: Math.atan2(1.15, 2.6) } },
  'taller-anexo': { x0: -2.65, x1: 2.65, z0: -1.85, z1: 1.85, y0: 0.62, y1: 2.95, ojos: [2.27], puerta: [-0.6, 0.6, 2.49] },
  buhardilla: { x0: -2.15, x1: 2.15, z0: -2.55, z1: 2.55, y0: 0.62, y1: 3.5, ojos: [2.27], puerta: [-0.6, 0.6, 2.49] },
  'planta-alta': { x0: -2.65, x1: 2.65, z0: -2.25, z1: 2.25, y0: 0.62, y1: 5.6, ojos: [2.27, 4.97], puerta: [-0.6, 0.6, 5.6] },
  'cabana-piedra': { x0: -2.95, x1: 2.95, z0: -2.25, z1: 2.25, y0: 0.62, y1: 2.7, ojos: [2.27], puerta: [-0.6, 0.6, 2.49], techo: { eje: 'x', incl: Math.atan2(1.25, 3.0) } },
};

// ---------------------------------------------------------------- las habitaciones modulares de prueba
const Y_MOD = 0.285, EJE = 1.42;
const INCL_MOD = { 'techo-modular': Math.atan2(0.94, 1.675), 'techo-una-agua': Math.atan2(0.76, 3.38), 'techo-plano': 0, 'techo-teja': Math.atan2(0.94, 1.675) };
// las aberturas de cada pared: medio vano a lo largo y de qué altura a qué altura (sobre el pie del piso)
const VANOS = { 'pared-puerta': [0.6, -9, Y_MOD + 2.05], 'tabique-puerta': [0.53, -9, Y_MOD + 2.0], 'pared-ventana': [0.72, Y_MOD + 0.86, Y_MOD + 1.70], 'pared-ventana-ancha': [1.0, Y_MOD + 0.68, Y_MOD + 1.82] };
const CARA = { n: '-z', s: '+z', o: '-x', e: '+x' };
// Cada habitación: el piso en (X, Z) con giro R, la pared de cada lado (null: da al módulo de al lado) y el techo. Las paredes que cierran (las de
// construccion.js y la de piedra de planos-ampliar.js), los cuatro techos (con el de teja), el techo al revés, una pared dada vuelta, giros cualquiera y
// una casa de dos módulos unidos.
const R2 = 0.3;
const MODULOS = [
  { nombre: 'dos aguas', X: 0, Z: 0, R: 0, techo: 'techo-modular', lados: { n: 'pared-puerta', e: 'pared-ventana', s: 'pared-modular', o: 'pared-hogar' } },
  { nombre: 'una agua girada', X: 20, Z: 0, R: 0.7, techo: 'techo-una-agua', lados: { n: 'pared-puerta', e: 'pared-ventana-ancha', s: 'tabique-interior', o: 'pared-modular' } },
  { nombre: 'plana, una pared dada vuelta', X: 40, Z: 0, R: -0.4, techo: 'techo-plano', lados: { n: 'tabique-puerta', e: 'pared-modular', s: 'pared-modular', o: 'pared-ventana' }, vuelta: ['s'] },
  { nombre: 'una agua, el techo al revés', X: 60, Z: 0, R: 1.2, techo: 'techo-una-agua', lados: { n: 'pared-modular', e: 'pared-puerta', s: 'pared-ventana', o: 'pared-hogar' }, techoVuelta: true },
  { nombre: 'dos módulos (A)', X: 80, Z: 0, R: R2, techo: 'techo-modular', lados: { n: 'pared-puerta', s: 'pared-modular', o: 'pared-ventana', e: null } },
  { nombre: 'dos módulos (B)', X: 80 + 3 * Math.cos(R2), Z: -3 * Math.sin(R2), R: R2, techo: 'techo-modular', lados: { n: 'pared-modular', s: 'pared-ventana-ancha', e: 'pared-modular', o: null } },
  { nombre: 'teja y piedra', X: 110, Z: 0, R: -1.0, techo: 'techo-teja', lados: { n: 'pared-puerta', e: 'pared-piedra', s: 'pared-piedra', o: 'pared-ventana' } },
];
// Lo que NO es una habitación cerrada: el techo queda como en la 4.26.0 y no hay caja para la regla
const OTROS = [
  { nombre: 'galería (techo sin paredes)', X: 0, Z: 40, R: 0, techo: 'techo-modular', lados: {} },
  { nombre: 'tres paredes', X: 20, Z: 40, R: 0, techo: 'techo-una-agua', lados: { n: 'pared-puerta', e: 'pared-modular', s: 'pared-modular' } },
  { nombre: 'una pared corrida 20 cm', X: 40, Z: 40, R: 0, techo: 'techo-plano', lados: { n: 'pared-puerta', e: 'pared-modular', s: 'pared-modular', o: 'pared-modular' }, corrida: { s: 0.2 } },
  { nombre: 'con media pared', X: 60, Z: 40, R: 0, techo: 'techo-modular', lados: { n: 'pared-puerta', e: 'pared-modular', s: 'pared-media', o: 'pared-modular' } },
  { nombre: 'galería de teja', X: 80, Z: 40, R: 0.2, techo: 'techo-teja', lados: { e: 'pared-piedra' } },
];
// los vértices de cada techo solo en la 4.26.0 (Baja / Alta)
const TECHO_4260 = { Baja: { 'techo-modular': 1044, 'techo-una-agua': 540, 'techo-plano': 576, 'techo-teja': 900 }, Alta: { 'techo-modular': 1572, 'techo-una-agua': 936, 'techo-plano': 840, 'techo-teja': 3012 } };

function piezasDe(m) {
  const { X, Z, R } = m, mundo = (lx, lz) => ({ x: X + lx * Math.cos(R) + lz * Math.sin(R), z: Z - lx * Math.sin(R) + lz * Math.cos(R) });
  const L = [{ plano: 'piso-modular', x: X, z: Z, y: 0, rot: R, etapas: 99 }];
  const pos = { n: [0, -EJE, 0], s: [0, EJE, 0], e: [EJE, 0, Math.PI / 2], o: [-EJE, 0, Math.PI / 2] };
  for (const [lado, id] of Object.entries(m.lados)) {
    if (!id) continue;
    const [lx, lz, giro] = pos[lado], corr = (m.corrida && m.corrida[lado]) || 0, ns = lado === 'n' || lado === 's';
    const p = mundo(lx + (ns ? corr : 0), lz + (ns ? 0 : corr));
    L.push({ plano: id, x: p.x, z: p.z, y: Y_MOD, rot: R + giro + ((m.vuelta || []).includes(lado) ? Math.PI : 0), etapas: 99 });
  }
  if (m.techo) L.push({ plano: m.techo, x: X, z: Z, y: Y_MOD + 2.26, rot: R + (m.techoVuelta ? Math.PI : 0), etapas: 99 });
  return L;
}
// los triángulos de todo lo que hay a menos de 6 m del módulo, en el marco del módulo
function enMarco(S, m) {
  const pos = [], c = Math.cos(m.R), s = Math.sin(m.R);
  for (const o of S.obras) {
    if (!o.malla || Math.hypot(o.datos.x - m.X, o.datos.z - m.Z) > 6) continue;
    o.grupo.updateMatrixWorld(true);
    const a = o.malla.geometry.attributes.position.array, e = o.malla.matrixWorld.elements;
    for (let i = 0; i < a.length; i += 3) {
      const x = e[0] * a[i] + e[4] * a[i + 1] + e[8] * a[i + 2] + e[12], y = e[1] * a[i] + e[5] * a[i + 1] + e[9] * a[i + 2] + e[13], z = e[2] * a[i] + e[6] * a[i + 1] + e[10] * a[i + 2] + e[14];
      const dx = x - m.X, dz = z - m.Z;
      pos.push(dx * c - dz * s, y, dx * s + dz * c);
    }
  }
  return new Float32Array(pos);
}
function cuartoModular(m) {
  const aberturas = [];
  for (const [lado, id] of Object.entries(m.lados)) {
    if (id === null) aberturas.push({ cara: CARA[lado], u0: -9, u1: 9, y0: -9, y1: 9 });
    else if (VANOS[id]) { const [w, y0, y1] = VANOS[id]; aberturas.push({ cara: CARA[lado], u0: -w, u1: w, y0, y1 }); }
  }
  return { x0: -1.35, x1: 1.35, z0: -1.35, z1: 1.35, y0: Y_MOD, y1: Y_MOD + 2.3, ojos: [Y_MOD + 1.6], techo: { eje: 'x', incl: INCL_MOD[m.techo] }, aberturas };
}

async function modulos(archivo) {
  registrarThree();
  const THREE = await import('three');
  const C = await import(pathToFileURL(archivo).href);
  const AS = await import(pathToFileURL(path.join(path.dirname(archivo), 'asentado.js')).href);
  return { THREE, C, AS };
}
const terreno = (THREE) => ({ altura: () => 0, agua: () => false, normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {} });
const sistema = (THREE, C) => C.crearConstruccion(terreno(THREE), new THREE.Scene(), { agregar() {}, agregarPlataforma() {}, plataformaEn: () => null, eliminarPorDuenio() {} }, { arboles: [], despejar() {} }, null, null);
const techoDe = (S, m) => S.obras.find((o) => o.plano.snap?.familia === 'modular-techo' && Math.hypot(o.datos.x - m.X, o.datos.z - m.Z) < 0.01);
const pisoDe = (S, m) => S.obras.find((o) => o.plano.id === 'piso-modular' && Math.hypot(o.datos.x - m.X, o.datos.z - m.Z) < 0.01);
const firmaEsperada = (m) => { const a = { n: '-z', s: '+z', o: '-x', e: '+x' }, b = { n: '+z', s: '-z', o: '+x', e: '-x' }; return Object.entries(m.lados).filter(([, id]) => id).map(([k]) => (m.techoVuelta ? b : a)[k]).sort().join(' '); };

// Arma las habitaciones con el construccion.js de `archivo` (el original o una copia mutada): fugas por habitación, lo de las que no cierran y los
// cambios (terminar una pared, sacarla, moverla y cargar con el techo primero).
async function mirarModulos(archivo, niveles) {
  const { THREE, C, AS } = await modulos(archivo);
  const res = { fugas: {}, otros: {}, cambios: {} };
  for (const [nivel, cfg] of niveles) {
    AS.fijarAsentado(cfg);
    const S = sistema(THREE, C);
    S.sincronizar([...MODULOS, ...OTROS].flatMap(piezasDe));
    for (const m of MODULOS) {
      const f = fugasDeObra(enMarco(S, m), cuartoModular(m));
      const t = techoDe(S, m), piso = pisoDe(S, m);
      let mallas = 0; for (const o of S.obras) if (Math.hypot(o.datos.x - m.X, o.datos.z - m.Z) < 1.6) o.grupo.traverse((q) => { if (q.isMesh) mallas++; });
      res.fugas[nivel + ' ' + m.nombre] = { rayos: f.rayos, fugas: f.fugas.length, ejemplo: f.fugas[0] || null, firma: t.firmaCierres, esperada: firmaEsperada(m), vertices: t.malla.geometry.attributes.position.count, piezas: piezasDe(m).length, mallas, hab: !!S.habitacionModular(piso) };
    }
    for (const m of OTROS) { const t = techoDe(S, m); res.otros[nivel + ' ' + m.nombre] = { firma: t.firmaCierres || '', vertices: t.malla.geometry.attributes.position.count, base: TECHO_4260[nivel][m.techo], hab: !!S.habitacionModular(pisoDe(S, m)) }; }
    if (nivel !== 'Baja') continue;
    // terminar una pared: la media pared se cambia por una entera (rehacer)
    const mm = OTROS[3], tm = techoDe(S, mm), media = S.obras.find((o) => o.plano.id === 'pared-media' && Math.hypot(o.datos.x - mm.X, o.datos.z - mm.Z) < 2);
    S.reemplazarPlano(media, 'pared-modular');
    res.cambios.terminar = tm.firmaCierres === '+x +z -x -z' && tm.malla.geometry.attributes.position.count > TECHO_4260.Baja['techo-modular'];
    // sacarla
    S.destruir(media);
    res.cambios.sacar = tm.firmaCierres === '' && tm.malla.geometry.attributes.position.count === TECHO_4260.Baja['techo-modular'];
    // empezar a moverla (una pared de la de dos aguas) y cancelar
    const m0 = MODULOS[0], t0 = techoDe(S, m0), pared = S.obras.find((o) => o.plano.id === 'pared-modular' && Math.hypot(o.datos.x - m0.X, o.datos.z - m0.Z) < 2);
    const r = S.iniciarEdicionCerca({ x: pared.datos.x, z: pared.datos.z, y: pared.datos.y }, 0.5);
    const enEdicion = r.ok && r.obra === pared && t0.firmaCierres === '';   // (sin esa pared la habitación no está cerrada: el techo queda abierto)
    S.cancelarEdicion();
    res.cambios.mover = enEdicion && t0.firmaCierres === firmaEsperada(m0);
    // cargar con el techo primero (la partida trae las piezas en cualquier orden)
    const S2 = sistema(THREE, C), m1 = MODULOS[1], lista = piezasDe(m1);
    S2.sincronizar([lista[lista.length - 1], ...lista.slice(0, -1)]);
    res.cambios.cargar = techoDe(S2, m1).firmaCierres === firmaEsperada(m1);
  }
  AS.fijarAsentado({});
  return res;
}

// Arma las obras `ids` con el construccion.js de `archivo` y devuelve, por obra, las fugas, los vértices y las mallas.
async function armarYMirar(archivo, ids, configs) {
  const { THREE, C, AS } = await modulos(archivo);
  const res = {};
  for (const [nombre, cfg] of configs) {
    AS.fijarAsentado(cfg);
    const S = sistema(THREE, C);
    for (const id of ids) {
      const p = C.PLANOS.find((q) => q.id === id);
      const datos = { plano: id, x: 0, z: 0, y: 0, rot: 0, etapas: p.etapas.length };
      S.sincronizar([datos]);
      const ob = S.obras.find((q) => q.datos === datos);
      const g = ob.malla.geometry, c = CUARTOS[id];
      let mallas = 0; ob.grupo.traverse((o) => { if (o.isMesh) mallas++; });
      g.computeBoundingBox();
      const f = fugasDeObra(g.attributes.position.array, { ...c, aberturas: [{ cara: '-z', u0: c.puerta[0], u1: c.puerta[1], y0: -9, y1: c.puerta[2] }] });
      // las caras que caen justo en el medio del grueso de una pared del borde (las almas de las juntas): para adentro o para afuera
      const caras = { adentro: 0, afuera: 0 };
      if (MEDIDAS[id] && id !== 'casilla' && id !== 'puesto') {
        const [W, D] = MEDIDAS[id], a = g.attributes.position.array;
        for (let k = 0; k < a.length; k += 9) {
          const ux = (a[k + 3] - a[k]), uy = (a[k + 4] - a[k + 1]), uz = (a[k + 5] - a[k + 2]), vx = (a[k + 6] - a[k]), vy = (a[k + 7] - a[k + 1]), vz = (a[k + 8] - a[k + 2]);
          const nx = uy * vz - uz * vy, nz = ux * vy - uy * vx;
          for (const [eje, fijo] of [['z', -D / 2], ['z', D / 2], ['x', -W / 2], ['x', W / 2]]) {
            const j = eje === 'z' ? 2 : 0;
            if (Math.abs(a[k + j] - fijo) < 1e-4 && Math.abs(a[k + 3 + j] - fijo) < 1e-4 && Math.abs(a[k + 6 + j] - fijo) < 1e-4) { if ((eje === 'z' ? nz : nx) * fijo < 0) caras.adentro++; else caras.afuera++; }
          }
        }
      }
      res[nombre + ' ' + id] = { rayos: f.rayos, fugas: f.fugas.length, ejemplo: f.fugas[0] || null, vertices: g.attributes.position.count, mallas, caras, caja: [g.boundingBox.min.toArray(), g.boundingBox.max.toArray()] };
    }
  }
  AS.fijarAsentado({});
  return res;
}

// ---------------------------------------------------------------- las copias mutadas de la geometría corren en su propio proceso
{
  const i = process.argv.indexOf('--hijo-geo');
  if (i > 0) {
    const r = await armarYMirar(process.argv[i + 1], process.argv[i + 2].split(','), [['Baja', {}]]);
    console.log(JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.fugas + (v.caras.afuera > ((CARAS_4260.Baja[k.slice(5)] || [0, 0])[1]) ? 1e6 : 0)]))));   // (un alma que mira para afuera cuenta como fuga)
    process.exit(0);
  }
  const j = Math.max(process.argv.indexOf('--hijo-mod'), process.argv.indexOf('--hijo-mod-alta'));
  if (j > 0) {
    const r = await mirarModulos(process.argv[j + 1], [process.argv[j] === '--hijo-mod-alta' ? ['Alta', ALTA] : ['Baja', {}]]);
    console.log(JSON.stringify({ fugas: Object.values(r.fugas).reduce((a, v) => a + v.fugas, 0), otros: Object.values(r.otros).filter((v) => v.firma !== '' || v.vertices !== v.base || v.hab).length, cambios: r.cambios }));
    process.exit(0);
  }
}

// ---------------------------------------------------------------- 4 (puro): lo que tiene que cumplir interior-visible.js (devuelve la lista de lo que falla)
const enMundo = (c, a, b, y) => ({ x: c.x + a * Math.cos(c.rot) + b * Math.sin(c.rot), y, z: c.z - a * Math.sin(c.rot) + b * Math.cos(c.rot) });
const mira = (yaw) => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });
const rumbo = (rot, hacia) => rot + ({ '-b': 0, '+b': Math.PI, '+a': -Math.PI / 2, '-a': Math.PI / 2 })[hacia];
function comprobarInterior(M) {
  const mal = [];
  const falla = (c, t) => { if (!c) mal.push(t); };
  const cos = M.cosVistaDe(70, 16 / 9);
  for (const id of ['casilla', 'taller-anexo', 'planta-alta']) falla(M.CASAS_CERRADAS.has(id), `${id} está en CASAS_CERRADAS`);
  for (const id of ['puesto', 'buhardilla']) falla(!M.CASAS_CERRADAS.has(id), `${id} queda afuera de CASAS_CERRADAS (la equivalencia de imagen mostró diferencias)`);
  for (const id of ['cabana-piedra', 'casa-galeria', 'casona', 'dormitorio-anexo', 'despensa-anexa', 'cocina-ampliada', 'bodega-piedra', 'salon-grande', 'torreon-piedra']) falla(M.CASAS_CERRADAS.has(id), `${id} sigue en CASAS_CERRADAS (la 4.26.0)`);
  for (const id of ['quincho', 'galeria-cerrada', 'piso-modular', 'pared-modular', 'pared-puerta', 'pared-ventana', 'techo-modular', 'techo-una-agua', 'techo-plano', 'entrepiso-modular']) falla(!M.CASAS_CERRADAS.has(id), `${id} no es una casa de la lista (frente abierto, sin pared de atrás o pieza modular)`);
  for (const [id, [W, D, H]] of Object.entries(MEDIDAS)) {
    if (id === 'puesto' || id === 'buhardilla') continue;   // afuera de la regla (equivalencia de imagen)
    const o = { id, x: 40, z: -70, y: 6, rot: 0.7, ancho: W, fondo: D, alto: H };
    const k = M.cajaDeCasa(o);
    falla(k && k.id === 'obra-' + id && k.ancho === W && k.fondo === D && Math.abs(k.alto - (H + 0.25)) < 1e-9, `${id}: la caja con las medidas del plano y las paredes hasta alto + 0,25`);
    falla(k && k.frente.every((q) => q[1] === -D / 2) && k.frente.some((q) => q[0] === -0.6) && k.frente.some((q) => q[0] === 0.6), `${id}: la puerta en el centro del frente (−z), de jamba a jamba`);
    if (!k) continue;
    const sal = { id: '', x: 0, z: 0, radio: 0, puertas: null };
    const cam = enMundo(k, 0, 0.3, 6 + 0.62 + 1.6);
    const it = M.interiorDeCaja(cam, k, sal);
    falla(it && M.apagarExteriorAhora(it, cam, mira(rumbo(k.rot, '+b')), cos) === true, `${id}: de espaldas a la puerta, se apaga el exterior`);
    falla(it && M.apagarExteriorAhora(it, cam, mira(rumbo(k.rot, '-b')), cos) === false, `${id}: mirando la puerta se dibuja todo`);
    falla(M.interiorDeCaja(enMundo(k, 0, 0, 6 + H + 0.25 + 0.3), k, sal) === null, `${id}: arriba de las paredes (en el techo) no cuenta como adentro`);
  }
  falla(M.MEDIO_VANO_CASAS >= 0.51 && M.MEDIO_VANO_CASAS <= 0.62, 'el medio vano (0,6) cubre la puerta de la casilla (1,02), del puesto (0,95) y de las ampliaciones (1,04), sin las jambas');
  // las habitaciones modulares
  if (typeof M.cajaDeModulo !== 'function') { mal.push('cajaDeModulo existe'); return mal; }
  const h = (lados, extra = {}) => ({ x: 10, z: 20, y: 3, rot: 0.5, lados, ...extra });
  const p = (id, u = 0) => ({ id, u });
  const k1 = M.cajaDeModulo(h({ n: p('pared-puerta'), e: p('pared-ventana'), s: p('pared-modular'), o: p('pared-hogar') }));
  falla(k1 && k1.ancho === 3 && k1.fondo === 3 && Math.abs(k1.alto - (0.285 + 2.28)) < 1e-9 && k1.y === 3, 'módulo: la caja de 3 × 3, del pie del piso al borde de las paredes');
  const enLado = (k, lado, u) => k && k.frente.some((q) => (lado === 'n' ? Math.abs(q[1] + 1.42) < 1e-6 && Math.abs(q[0] - u) < 1e-6 : lado === 'e' ? Math.abs(q[0] - 1.42) < 1e-6 && Math.abs(q[1] - u) < 1e-6 : lado === 'o' ? Math.abs(q[0] + 1.5) < 1e-6 && Math.abs(q[1] - u) < 1e-6 : false));
  falla(enLado(k1, 'n', -0.6) && enLado(k1, 'n', 0.6), 'módulo: la puerta, de jamba a jamba (±0,6) en el eje de la pared de adelante');
  falla(enLado(k1, 'e', -0.72) && enLado(k1, 'e', 0.72), 'módulo: la ventana (±0,72, con los parantes) cuenta como abertura');
  falla(k1 && k1.frente.every((q) => q[1] < 0 || q[0] > 0), 'módulo: la pared lisa y la del hogar no tienen aberturas');
  const k2 = M.cajaDeModulo(h({ n: p('pared-puerta'), e: p('pared-modular'), s: p('pared-ventana-ancha'), o: null }));
  falla(enLado(k2, 'o', -1.5) && enLado(k2, 'o', 1.5), 'módulo: el lado que da a otro módulo es abertura de punta a punta');
  falla(M.cajaDeModulo(h({ n: p('pared-puerta'), e: p('pared-media'), s: p('pared-modular'), o: p('pared-modular') })) === null, 'módulo: con una pared que no cierra, no hay caja');
  falla(M.cajaDeModulo(h({ n: p('pared-puerta'), e: p('pared-modular'), s: p('pared-modular') })) === null, 'módulo: con un lado sin nada, no hay caja');
  falla(M.cajaDeModulo(null) === null, 'módulo: sin habitación, no hay caja');
  if (k1) {
    const sal = { id: '', x: 0, z: 0, radio: 0, puertas: null }, cam = enMundo(k1, -0.6, 0.6, 3 + 0.285 + 1.6);
    const it = M.interiorDeCaja(cam, k1, sal);
    falla(it && M.apagarExteriorAhora(it, cam, mira(rumbo(k1.rot, '+b')), cos) === true, 'módulo: mirando la pared del fondo (ni la puerta ni la ventana a la vista), se apaga el exterior');
    falla(it && M.apagarExteriorAhora(it, cam, mira(rumbo(k1.rot, '+a')), cos) === false, 'módulo: mirando la ventana se dibuja todo');
    falla(it && M.apagarExteriorAhora(it, cam, mira(rumbo(k1.rot, '-b')), cos) === false, 'módulo: mirando la puerta se dibuja todo');
    falla(M.interiorDeCaja(enMundo(k1, 0, 0, 3 + 0.285 + 2.28 + 0.3), k1, sal) === null, 'módulo: arriba de las paredes no cuenta como adentro');
  }
  if (k2) {
    const sal = { id: '', x: 0, z: 0, radio: 0, puertas: null }, cam = enMundo(k2, 0.6, 0.3, 3 + 0.285 + 1.6);
    const it = M.interiorDeCaja(cam, k2, sal);
    falla(it && M.apagarExteriorAhora(it, cam, mira(rumbo(k2.rot, '-a')), cos) === false, 'módulo: mirando hacia el módulo de al lado se dibuja todo');
  }
  return mal;
}

// ---------------------------------------------------------------- las copias mutadas de interior-visible.js corren sólo su comprobación
{
  const i = process.argv.indexOf('--hijo-interior');
  if (i > 0) {
    const M = await import(pathToFileURL(process.argv[i + 1]).href);
    console.log(String(comprobarInterior(M).length));
    process.exit(0);
  }
}

let fallas = 0, total = 0;
const ok = (c, t) => { total++; if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };

// ---------------------------------------------------------------- 1 y 2: las cinco casas, en Baja y en Alta
const IDS = ['casilla', 'puesto', 'taller-anexo', 'buhardilla', 'planta-alta', 'cabana-piedra'];
const geo = await armarYMirar(path.join(raiz, 'src/construccion.js'), IDS, [['Baja', {}], ['Alta', ALTA]]);
for (const [k, v] of Object.entries(geo)) {
  ok(v.rayos > 300000 && v.fugas === 0, `${k}: ninguna luz se cuela al cuarto (${v.rayos} rayos, ${v.fugas} fugas${v.ejemplo ? ': ' + JSON.stringify(v.ejemplo) : ''})`);
  ok(v.mallas === 1, `${k}: sigue siendo UNA malla (0 llamadas de dibujo nuevas)`);
  const [nivel, id] = k.split(' '), base = CARAS_4260[nivel][id];
  if (base) ok(v.caras.adentro >= base[0] + 20 && v.caras.afuera === base[1], `${k}: las almas de las juntas son una cara sola mirando para adentro (${v.caras.adentro - base[0]} nuevas para adentro; para afuera ${v.caras.afuera}, como en la 4.26.0): de afuera la junta se ve como siempre`);
}
{
  // lo que suma cada una en Baja (contra la 4.26.0) y la silueta de afuera, la misma caja que en la 4.26.0 (lo nuevo queda adentro de las paredes y bajo el techo)
  const antes = { casilla: 2940, puesto: 4380, 'taller-anexo': 6960, buhardilla: 11124, 'planta-alta': 13248, 'cabana-piedra': 6372 };
  const CAJAS = {
    casilla: [[-2.38, -0.16, -2.46], [2.38, 3.662, 2.1]], puesto: [[-2.824, -0.16, -3.151], [2.824, 3.808, 2.385]], 'taller-anexo': [[-2.987, -0.16, -2.56], [3.188, 3.9, 2.258]],
    buhardilla: [[-2.585, -0.16, -3.26], [2.585, 6.06, 2.977]], 'planta-alta': [[-3.088, -0.2, -3.482], [3.675, 8.15, 2.658]],
  };
  for (const id of IDS) {
    const d = geo['Baja ' + id].vertices - antes[id];
    ok(id === 'cabana-piedra' ? d === 0 : d > 0 && d <= 2000, `${id}: ${d >= 0 ? '+' : ''}${d} vértices en Baja (tope +2000; la cabaña de testigo sin cambios)`);
    if (!CAJAS[id]) continue;
    const [a, b] = geo['Baja ' + id].caja, [mn, mx] = CAJAS[id];
    ok(a.every((v, j) => Math.abs(v - mn[j]) < 0.002) && b.every((v, j) => Math.abs(v - mx[j]) < 0.002), `${id}: la silueta de afuera es la de la 4.26.0 (${a.map((v) => v.toFixed(3)).join(' ')} … ${b.map((v) => v.toFixed(3)).join(' ')})`);
  }
}

// ---------------------------------------------------------------- 1, 2 y 3: las habitaciones modulares
{
  const r = await mirarModulos(path.join(raiz, 'src/construccion.js'), [['Baja', {}], ['Alta', ALTA]]);
  for (const [k, v] of Object.entries(r.fugas)) {
    ok(v.rayos > 300000 && v.fugas === 0, `${k}: ninguna luz se cuela (${v.rayos} rayos, ${v.fugas} fugas${v.ejemplo ? ': ' + JSON.stringify(v.ejemplo) : ''})`);
    ok(v.firma === v.esperada && v.hab, `${k}: es una habitación cerrada y el techo cierra los lados con pared («${v.firma}»)`);
    ok(v.mallas === v.piezas, `${k}: una malla por pieza, como siempre (${v.mallas})`);
  }
  for (const [k, v] of Object.entries(r.otros)) ok(v.firma === '' && v.vertices === v.base && !v.hab, `${k}: el techo queda como en la 4.26.0 (${v.vertices} vértices) y no hay habitación`);
  ok(r.cambios.terminar, 'al terminar la cuarta pared (la media se cambia por una entera), el techo se rehace y cierra');
  ok(r.cambios.sacar, 'al sacarla, el techo vuelve a quedar abierto (como en la 4.26.0)');
  ok(r.cambios.mover, 'mientras se mueve una pared (Shift+Y) la habitación no está cerrada y el techo queda abierto; al cancelar, vuelve a cerrar');
  ok(r.cambios.cargar, 'al cargar con el techo antes que las paredes, el techo cierra igual');
}
{
  // las paredes que cierran (cierraHabitacion) son las ocho de la regla, y todas pasaron por la prueba de luz; los techos, los cuatro
  registrarThree();
  const C = await import('../src/construccion.js'), I = await import('../src/interior-visible.js');
  const cierran = C.PLANOS.filter((p) => p.cierraHabitacion && p.snap?.familia === 'modular-muro').map((p) => p.id).sort();
  const probadas = new Set(MODULOS.flatMap((m) => Object.values(m.lados).filter(Boolean)));
  ok(JSON.stringify(cierran) === JSON.stringify([...I.MUROS_MODULARES].sort()) && cierran.every((id) => probadas.has(id)), `las paredes que cierran son las ocho de la regla y todas tienen su prueba de luz (${cierran.join(', ')})`);
  const techos = C.PLANOS.filter((p) => p.snap?.familia === 'modular-techo').map((p) => p.id).sort();
  ok(techos.every((id) => MODULOS.some((m) => m.techo === id) && TECHO_4260.Baja[id]), `los techos modulares (${techos.join(', ')}) tienen todos su prueba de luz y su testigo de la 4.26.0`);
}

// ---------------------------------------------------------------- mutaciones de la geometría (una copia del árbol de src por corrida; un proceso por mutación)
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-4261a-'));
  fs.cpSync(path.join(raiz, 'src'), dir, { recursive: true });
  const construccion = leer('src/construccion.js'), ampliar = leer('src/planos-ampliar.js');
  const cierres = leer('src/cierres-modulares.js');
  // `texto`: construccion.js; `ampliarMutado` y `cierresMutado`: las copias de planos-ampliar.js y cierres-modulares.js (con otro nombre, y los que las importan, también)
  const correr = (n, texto, ids, ampliarMutado = null, modo = '--hijo-geo', cierresMutado = null) => {
    let cons = texto, amp = ampliarMutado;
    const conCierres = (t) => (cierresMutado === null ? t : t.replace("from './cierres-modulares.js';", `from './cierres-modulares-mut-${n}.js';`));
    if (cierresMutado !== null) { fs.writeFileSync(path.join(dir, `cierres-modulares-mut-${n}.js`), cierresMutado); if (amp === null) amp = ampliar; }
    if (amp !== null) { fs.writeFileSync(path.join(dir, `planos-ampliar-mut-${n}.js`), conCierres(amp)); cons = cons.replace("from './planos-ampliar.js';", `from './planos-ampliar-mut-${n}.js';`); }
    const f = path.join(dir, `construccion-mut-${n}.js`);
    fs.writeFileSync(f, conCierres(cons));
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), modo, f, ids.join(',')], { encoding: 'utf8' });
    try { return JSON.parse((r.stdout || '').trim().split(NL).pop()); } catch { return { error: (r.stderr || r.stdout || '').slice(0, 160) }; }
  };
  const suma = (r) => Object.values(r).reduce((a, b) => a + (Number.isFinite(b) ? b : 1e9), 0);
  const cero = correr('original', construccion, ['casilla', 'puesto', 'taller-anexo'], ampliar);
  ok(!cero.error && suma(cero) === 0, `mutación 0: las copias sin tocar (construccion.js y planos-ampliar.js) no dejan pasar luz (${JSON.stringify(cero)})`);
  const muts = [
    // el puesto de troncos
    ['puesto-sin-alma', 'for (const sx of [-1, 1]) alma(e, yL - yA, D, sx * (W / 2 - 0.03), (yA + yL) / 2, 0);', '', ['puesto']],
    ['puesto-sin-alma-del-fondo', 'alma(W, yF - yA, e, 0, (yA + yF) / 2, D / 2 - 0.03);', '', ['puesto']],
    ['puesto-alma-hasta-los-troncos', "const ALMA = '#2f241a', yA = 0.48, yF = 2.6,", "const ALMA = '#2f241a', yA = 0.48, yF = 2.36,", ['puesto']],
    ['puesto-costados-bajo-el-forro', 'const yL = techoDelPuesto(P).forro(W / 2 - 0.03);', 'const yL = techoDelPuesto(P).forro(W / 2 - 0.03) - 0.06;', ['puesto']],
    ['puesto-sin-forro', "c.agregar(new THREE.BoxGeometry((a1 - a0) / Math.cos(tp.incl), 0.02, D + 0.1),", "if (0) c.agregar(new THREE.BoxGeometry((a1 - a0) / Math.cos(tp.incl), 0.02, D + 0.1),", ['puesto']],
    ['puesto-sin-contrapiso', "c.agregar(new THREE.BoxGeometry(W, 0.02, Math.round(D / 0.3) * 0.3 - 0.03),", "if (0) c.agregar(new THREE.BoxGeometry(W, 0.02, Math.round(D / 0.3) * 0.3 - 0.03),", ['puesto']],
    // la casilla
    ['casilla-sin-hastiales', "c.agregar(g, { color: HASTIAL, tipo: 4, variar: 0.06, matriz: matriz([0, 0, 0]) });", '', ['casilla']],
    ['casilla-sin-tiras-del-alero', "c.agregar(new THREE.BoxGeometry(0.03, yt - yH, D), { color: HASTIAL,", "if (0) c.agregar(new THREE.BoxGeometry(0.03, yt - yH, D), { color: HASTIAL,", ['casilla']],
    ['casilla-sin-forro', "c.agregar(new THREE.BoxGeometry((a1 - a0) / Math.cos(incl), 0.02, D + 0.1), { color: TABLA,", "if (0) c.agregar(new THREE.BoxGeometry((a1 - a0) / Math.cos(incl), 0.02, D + 0.1), { color: TABLA,", ['casilla']],
    ['casilla-hastial-bajo', ', E = [0, yF(0), zh],', ', E = [0, yF(W / 2), zh],', ['casilla']],
    ['casilla-sin-contrapiso', "c.agregar(new THREE.BoxGeometry(W, 0.02, D), { color: '#3a2c20',", "if (0) c.agregar(new THREE.BoxGeometry(W, 0.02, D), { color: '#3a2c20',", ['casilla']],
  ];
  for (const [n, de, a, ids] of muts) {
    if (!construccion.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    const r = correr(n, construccion.replace(de, a), ids, ampliar);
    ok(!r.error && suma(r) > 0, `mutación «${n}» (construccion.js) deja pasar luz (${JSON.stringify(r).slice(0, 90)})`);
  }
  const mutsA = [
    ['juntas-sin-alma', 'if (antes) for (const [a0, b0] of antes) for (const [a1, b1] of tramos) alma(', 'if (0) for (const [a0, b0] of antes) for (const [a1, b1] of tramos) alma('],
    ['alma-angosta', 'alma(u0 - 0.02, u0 + 0.012, Math.max(a0, a1)', 'alma(u0 - 0.002, u0 + 0.03, Math.max(a0, a1)'],
    ['alma-mirando-afuera', 'const adentro = fijo > 0 ? -1 : 1;', 'const adentro = fijo > 0 ? 1 : -1;'],
    ['alma-una-si-una-no', 'if (antes) for (const [a0, b0] of antes)', 'if (antes && i % 2) for (const [a0, b0] of antes)'],
  ];
  for (const [n, de, a] of mutsA) {
    if (!ampliar.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    const r = correr(n, construccion, ['taller-anexo', 'buhardilla', 'planta-alta'], ampliar.replace(de, a));
    ok(!r.error && Object.values(r).every((v) => v > 0), `mutación «${n}» (planos-ampliar.js) deja pasar luz (o mira para afuera) en las tres (${JSON.stringify(r).slice(0, 90)})`);
  }
  // las habitaciones modulares: cada mutación tiene que dejar pasar luz, cerrar lo que no es una habitación o romper un cambio
  const ceroM = correr('mod-original', construccion, [], null, '--hijo-mod');
  const sano = (r) => !r.error && r.fugas === 0 && r.otros === 0 && Object.values(r.cambios || {}).every(Boolean) && Object.keys(r.cambios || {}).length === 4;
  ok(sano(ceroM), `mutación 0 (habitaciones modulares): la copia sin tocar no deja pasar luz, no cierra lo que no es una habitación y sigue los cambios (${JSON.stringify(ceroM)})`);
  const mutsM = [
    ['mod-pared-sin-alma', 'c', 'almaModular(c, [[-1.44, 1.44, -0.01, 2.14]]);   // 4.26.1 (A): entre tabla y tabla quedan 1,5 cm', '// (mutada)', 'fugas'],
    ['mod-hogar-sin-alma', 'c', 'almaModular(c, [[-1.44, 1.44, -0.01, 2.14]]);' + NL + '      // el cuerpo de piedra', '// (mutada)' + NL + '      // el cuerpo de piedra', 'fugas'],
    ['mod-ventana-sin-almas-de-los-costados', 'c', ', [-1.44, -0.66, 0.84, 1.72], [0.66, 1.44, 0.84, 1.72]]);', ']);', 'fugas'],
    ['mod-ventanal-sin-almas-de-los-costados', 'c', ', [-1.44, -0.94, 0.66, 1.84], [0.94, 1.44, 0.66, 1.84]]);', ']);', 'fugas'],
    ['mod-almas-de-la-ventana-a-tope', 'c', '[-1.44, 1.44, -0.01, 0.88], [-1.44, 1.44, 1.68, 2.22], [-1.44, -0.66, 0.84, 1.72], [0.66, 1.44, 0.84, 1.72]', '[-1.44, 1.44, -0.01, 0.86], [-1.44, 1.44, 1.70, 2.22], [-1.44, -0.66, 0.86, 1.70], [0.66, 1.44, 0.86, 1.70]', 'fugas', '--hijo-mod-alta'],
    ['mod-sin-contrapiso', 'c', 'c.agregar(new THREE.BoxGeometry(2.89, 0.01, 2.92), {', 'if (0) c.agregar(new THREE.BoxGeometry(2.89, 0.01, 2.92), {', 'fugas'],
    ['mod-piedra-sin-alma', 'a', 'almaModular(c, [[-1.48, 1.48, -0.01, 2.22]]);', '', 'fugas'],
    ['mod-teja-sin-cierres', 'a', 'cierresDeTecho(c, datos, (x) => 0.45 +', 'if (0) cierresDeTecho(c, datos, (x) => 0.45 +', 'fugas'],
    ['mod-sin-forro', 'm', 'c.agregar(new THREE.BoxGeometry((x1 - x0) / Math.cos(a) + 0.02, 0.02, 2 * L)', 'if (0) c.agregar(new THREE.BoxGeometry((x1 - x0) / Math.cos(a) + 0.02, 0.02, 2 * L)', 'fugas'],
    ['mod-sin-aleros', 'm', 'c.agregar(new THREE.BoxGeometry(0.03, y1 - PIE_CIERRE, 2 * L)', 'if (0) c.agregar(new THREE.BoxGeometry(0.03, y1 - PIE_CIERRE, 2 * L)', 'fugas'],
    ['mod-sin-hastiales', 'm', 'c.agregar(g, { color: CIERRE_TECHO, tipo: 4, variar: 0.06, matriz: matriz([0, 0, 0]) });', '', 'fugas'],
    ['mod-cierres-altos', 'm', 'export const PIE_CIERRE = -0.19;', 'export const PIE_CIERRE = -0.10;', 'fugas'],
    ['mod-cierra-siempre', 'm', "const lados = CIERRES_TECHO.get(datos) || '';", "const lados = CIERRES_TECHO.get(datos) || '+x +z -x -z';", 'otros'],
    ['mod-acepta-paredes-corridas', 'c', 'const CENTRADO_MODULAR = 0.05;', 'const CENTRADO_MODULAR = 0.3;', 'otros'],
    ['mod-sin-revisar-al-terminar', 'c', '    if (esModular(obra)) revisarTechos(obra.datos);   // 4.26.1 (A)', '', 'terminar'],
    ['mod-sin-revisar-al-sacar', 'c', '    if (i >= 0 && esModular(obra)) revisarTechos(obra.datos);   // 4.26.1 (A)', '', 'sacar'],
    ['mod-sin-revisar-al-mover', 'c', '    if (esModular(mejor)) revisarTechos(mejor.datos);', '', 'mover'],
    ['mod-sin-pasada-al-cargar', 'c', '    } finally { techosEnPausa = false; }' + NL + '    revisarTechos(null);', '    } finally { techosEnPausa = false; }', 'cargar'],
  ];
  const fuentes = { c: construccion, a: ampliar, m: cierres }, nombres = { c: 'construccion.js', a: 'planos-ampliar.js', m: 'cierres-modulares.js' };
  for (const [n, cual, de, a, que, modo = '--hijo-mod'] of mutsM) {
    if (!fuentes[cual].includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe en ${nombres[cual]}`); continue; }
    const mut = fuentes[cual].replace(de, a);
    const r = correr(n, cual === 'c' ? mut : construccion, [], cual === 'a' ? mut : null, modo, cual === 'm' ? mut : null);
    const cae = !r.error && (que === 'fugas' ? r.fugas > 0 : que === 'otros' ? r.otros > 0 : r.cambios && r.cambios[que] === false);
    ok(cae, `mutación «${n}» (${nombres[cual]}) ${que === 'fugas' ? 'deja pasar luz' : que === 'otros' ? 'cierra un techo que no cubre una habitación' : 'rompe «' + que + '»'} (${JSON.stringify(r).slice(0, 110)})`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------- 4: interior-visible.js
const I = await import('../src/interior-visible.js');
{
  const mal = comprobarInterior(I);
  ok(mal.length === 0, `interior-visible.js: las cinco casas nuevas y las habitaciones modulares en la regla, con sus aberturas (${mal.join(' | ') || 'sin fallas'})`);
}
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-4261a-i-'));
  const interior = leer('src/interior-visible.js');
  const correr = (n, texto) => {
    const f = path.join(dir, n + '.mjs');
    fs.writeFileSync(f, texto);
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--hijo-interior', f], { encoding: 'utf8' });
    return (r.stdout || '').trim().split(NL).pop() || (r.stderr || '').slice(0, 200);
  };
  ok(correr('interior-original', interior) === '0', 'mutación 0 (interior-visible.js): la copia sin tocar cumple todo');
  for (const [n, de, a] of [
    ['sin-casilla', "'casilla', ", ''],
    ['con-puesto', "'planta-alta']);", "'planta-alta', 'puesto']);"],
    ['sin-taller', "'taller-anexo', ", ''],
    ['con-buhardilla', "'planta-alta']);", "'planta-alta', 'buhardilla']);"],
    ['sin-planta-alta', ", 'planta-alta']);", ']);'],
    ['con-techo-modular', "'planta-alta']);", "'planta-alta', 'techo-modular']);"],
    ['vano-angosto', 'export const MEDIO_VANO_CASAS = 0.6;', 'export const MEDIO_VANO_CASAS = 0.4;'],
    ['modulo-sin-la-union', 'if (p === null) { frente.push(...puntosDeAbertura(tramo(lado, -M, M, M))); continue; }', 'if (p === null) continue;'],
    ['modulo-ventana-angosta', "'pared-ventana': 0.72,", "'pared-ventana': 0.3,"],
    ['modulo-puerta-sin-vano', "{ 'pared-puerta': 0.6, ", '{ '],
    ['modulo-sin-el-hogar', "'pared-ventana-ancha', 'pared-hogar', ", "'pared-ventana-ancha', "],
    ['modulo-cualquier-pared', 'if (!p || !MUROS_MODULARES.has(p.id)) return null;', 'if (!p) return null;'],
  ]) {
    if (!interior.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    const r = correr(n, interior.replace(de, a));
    ok(r !== '0', `mutación «${n}» (interior-visible.js) hace fallar la comprobación (${r.slice(0, 40)} fallas)`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------- 5: main.js, interiorDelValle (el código de verdad) con la casilla, el puesto y un módulo
{
  const fuente = leer('src/main.js');
  const obra = (id, x, z, W, D, H, etapas = 4) => ({ plano: { id, ancho: W, fondo: D, alto: H, etapas: [1, 2, 3, 4] }, datos: { x, z, y: 3, rot: 0.4, etapas } });
  const casilla = obra('casilla', 300, 300, 4.4, 3.6, 2.25), puesto = obra('puesto', 330, 300, 5.2, 4.2, 2.35), enObra = obra('taller-anexo', 360, 300, 5.4, 3.8, 2.7, 3);
  const piso = { plano: { id: 'piso-modular', ancho: 3, fondo: 3, alto: 0.32, etapas: [1] }, datos: { x: 400, z: 300, y: 3, rot: 0.4, etapas: 1 } };
  const piso2 = { plano: piso.plano, datos: { x: 430, z: 300, y: 3, rot: 0.4, etapas: 1 } };
  const lista = [casilla, puesto, enObra, piso, piso2];
  let version = 1, consultas = 0;
  const hab = (b) => { consultas++; return b === piso ? { x: 400, z: 300, y: 3, rot: 0.4, lados: { n: { id: 'pared-puerta', u: 0 }, e: { id: 'pared-modular', u: 0 }, s: { id: 'pared-modular', u: 0 }, o: { id: 'pared-ventana', u: 0 } } } : null; };
  const env = {
    desafio: null, T: { lugares: {}, altura: () => 3 },
    obras: { obrasCerca: (pos, r, salida) => { salida.length = 0; for (const o of lista) if (Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z) < r) salida.push(o); return salida; }, editando: null, get version() { return version; }, habitacionModular: hab },
    salidaValle: { id: '', x: 0, z: 0, radio: 0, puertas: null, conTerreno: true }, cajasInterior: new WeakMap(), obrasInterior: [],
    LUGARES_CERRADOS: I.LUGARES_CERRADOS, CASAS_CERRADAS: I.CASAS_CERRADAS, cajaDeLugar: I.cajaDeLugar, cajaDeCasa: I.cajaDeCasa, cajaDeModulo: I.cajaDeModulo, interiorDeCaja: I.interiorDeCaja,
  };
  env.cajaCacheada = funcion(fuente, 'cajaCacheada', env);
  env.cajaDeModuloCacheada = funcion(fuente, 'cajaDeModuloCacheada', env);
  const f = funcion(fuente, 'interiorDelValle', env);
  ok(f({ x: 300, y: 3 + 0.62 + 1.65, z: 300 })?.id === 'obra-casilla', 'interiorDelValle: adentro de la casilla terminada');
  ok(f({ x: 330, y: 3 + 0.58 + 1.65, z: 300 }) === null, 'interiorDelValle: el puesto de troncos queda afuera de la regla');
  ok(f({ x: 360, y: 3 + 0.62 + 1.65, z: 300 }) === null, 'interiorDelValle: el taller a medio hacer (sin techo) no');
  ok(f({ x: 300, y: 3 + 2.25 + 0.5, z: 300 }) === null, 'interiorDelValle: arriba de las paredes de la casilla (un salto), no: se dibuja todo');
  const r1 = f({ x: 400.3, y: 3 + 0.285 + 1.6, z: 300.2 });
  ok(r1?.id === 'modulo' && r1.puertas.length > 4, 'interiorDelValle: adentro de una habitación modular cerrada (con la puerta y la ventana como aberturas)');
  ok(f({ x: 430, y: 3 + 0.285 + 1.6, z: 300 }) === null, 'interiorDelValle: en un módulo que no es una habitación cerrada, no');
  const n0 = consultas; for (let i = 0; i < 50; i++) f({ x: 400.3, y: 3 + 0.285 + 1.6, z: 300.2 });
  ok(consultas === n0, 'interiorDelValle: la habitación se analiza una vez (no en cada cuadro) mientras no cambie ninguna obra');
  version++; f({ x: 400.3, y: 3 + 0.285 + 1.6, z: 300.2 });
  ok(consultas === n0 + 1, 'interiorDelValle: si cambia alguna obra (obras.version), se vuelve a analizar');
}

// ---------------------------------------------------------------- 6: la medición (sólo herramientas) y el juego que se entrega
{
  const mon = leer('herramientas/al-monitor.cjs'), aud = leer('herramientas/correr-auditoria-4-23-0.ps1'), juego = leer('main.cjs');
  const bloque = mon.slice(mon.indexOf("if (app && process.env.HOJ_SIN_FRENO === '1') {"), mon.indexOf('// 4.3.1: modo OCULTO'));
  ok(bloque.length > 40 && /disable-backgrounding-occluded-windows/.test(bloque) && /disable-renderer-backgrounding/.test(bloque) && /CalculateNativeWinOcclusion/.test(bloque) && /setBackgroundThrottling\(false\)/.test(bloque), 'al-monitor.cjs: con HOJ_SIN_FRENO=1, sin el freno de Chromium a la ventana tapada (la medición de la 4.26.0 quedó a 1 cuadro por segundo)');
  const fuera = mon.replace(bloque, '');
  ok((fuera.match(/disable-backgrounding-occluded-windows/g) || []).length === 1 && /process\.env\.HUMO_OCULTO === '1'/.test(fuera), 'al-monitor.cjs: fuera de esa bandera, sólo el modo oculto de siempre lo apaga');
  ok(/\[switch\]\$SinFreno/.test(aud) && /if \(\$SinFreno\) \{ \$env:HOJ_SIN_FRENO = '1' \} else \{ Remove-Item Env:\\HOJ_SIN_FRENO/.test(aud), 'correr-auditoria-4-23-0.ps1: -SinFreno prende la bandera y, sin el interruptor, la saca');
  ok(!/HOJ_SIN_FRENO/.test(juego) && !/disable-backgrounding-occluded-windows|CalculateNativeWinOcclusion/.test(juego) && /backgroundThrottling: !\(process\.env\.HOJ_SIN_ESTRANGULAR === '1' \|\| process\.env\.HUMO_OCULTO === '1'\)/.test(juego), 'main.cjs (el juego que se entrega): no conoce la bandera; minimizado o tapado sigue bajando el consumo (el freno de Electron por defecto)');
  const pkg = JSON.parse(leer('package.json'));
  const archivos = JSON.stringify((pkg.build && pkg.build.files) || []);
  ok(!/herramientas/.test(archivos) || /!herramientas/.test(archivos), 'el paquete del juego no lleva las herramientas de medición');
}

// ---------------------------------------------------------------- reglas de presupuesto y de armado
{
  const cons = leer('src/construccion.js'), amp = leer('src/planos-ampliar.js');
  const nuevo = (t) => t.split(NL).filter((l) => /4\.26\.1 \(A\)/.test(l) || /alma\(|almaModular|cierresDeTecho|HASTIAL|CIERRE_TECHO|techoDelPuesto|ALMA_JUNTA/.test(l)).join(NL);
  ok(!/ShaderMaterial|onBeforeCompile|Material\(|new THREE\.Mesh\(|InstancedMesh|PointLight|SpotLight/.test(nuevo(cons) + nuevo(amp)), 'lo nuevo es sólo geometría en la malla de cada obra: sin materiales, mallas, luces ni shaders (0 programas nuevos)');
  const cierres = leer('src/cierres-modulares.js');
  ok(/^function techoDelPuesto\(P\) \{$/m.test(cons) && !/^export (function|const) (techoDelPuesto|habitacionModular|firmaCierres|revisarTechos)/m.test(cons) && (cierres.match(/^export /gm) || []).length === 6 && !/^export const \w+ = [^;\n]*, \w+ =/m.test(cierres), 'construccion.js no cambia lo que exporta; cierres-modulares.js exporta un nombre por línea (armar.mjs)');
  ok(!/firmaCierres|CIERRES_TECHO/.test(leer('src/guardado.js')) && !/datos\.(firmaCierres|cierres)\s*=/.test(cons), 'lo que cierra cada techo no se guarda en la partida (se calcula al armar): sin claves de guardado nuevas');
  const pkg = JSON.parse(leer('package.json'));
  ok(pkg.scripts['verify:pasos'].includes('node pruebas/verificar-4-26-1-a.mjs'), 'la prueba está en verify:pasos');
}

console.log(`\n${total - fallas}/${total} comprobaciones`);
process.exit(fallas ? 1 : 0);
