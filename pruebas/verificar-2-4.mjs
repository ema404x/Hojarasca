// 2.4: las estructuras, en Node. Primero la lógica pura de cada una; después las obras de
// verdad (construccion.js con Three, en una vm, como las pruebas de construcción); al
// final, que el juego las tenga enganchadas (se lee el código como texto).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import * as AB from '../src/abrigo.js';
import * as TI from '../src/tintes.js';
import * as CV from '../src/casa-viva.js';
import * as CO from '../src/corral.js';
import * as HU from '../src/huerta.js';
import * as CC from '../src/cocina.js';
import * as FE from '../src/feria.js';
import * as MA from '../src/majada.js';
import { crearDiario } from '../src/diario.js';
import { ENTRADA } from '../src/cuaderno.js';
import { armarMochila } from '../src/mochila.js';
import { LENA } from '../src/lena.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const casi = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

// ---------------------------------------------------------------- 1. la casa abriga
{
  const casa = (o = {}) => ({ cubierta: true, habitable: true, confortCasa: 4, calorFactor: 0, cama: false, ...o });
  assert.equal(AB.comoDormiste({ invierno: 0 }), 'normal', 'fuera del invierno, nada cambia');
  assert.equal(AB.comoDormiste({ invierno: 1, distanciaAlFuego: 3 }), 'calentito', 'al lado del fuego, como en la 2.3');
  assert.equal(AB.comoDormiste({ invierno: 1, casa: casa({ calorFactor: 0.5 }) }), 'calentito', 'el calor de la estufa llega por la casa');
  assert.equal(AB.comoDormiste({ invierno: 1, casa: casa({ calorFactor: 0.05 }) }), 'fresco', 'un calor que casi no llega no alcanza');
  assert.equal(AB.comoDormiste({ invierno: 1, casa: casa(), manta: true }), 'normal', 'casa y manta alcanzan');
  assert.equal(AB.comoDormiste({ invierno: 1, casa: casa() }), 'fresco', 'casa sin fuego ni manta: fresco, no helado');
  assert.equal(AB.comoDormiste({ invierno: 1, casa: casa({ cubierta: false }) }), 'frio', 'sin techo es la intemperie');
  assert.equal(AB.comoDormiste({ invierno: 1, carpa: true }), 'fresco', 'la carpa queda en el medio');
  assert.equal(AB.comoDormiste({ invierno: 1, distanciaAlFuego: LENA.calorFuego + 1 }), 'frio', 'afuera y lejos del fuego, como en la 2.3');
  assert.equal(AB.horasDescansado({ como: 'normal', casa: casa({ confortCasa: 5 }) }), 0, 'con poco confort no alcanza');
  assert.equal(AB.horasDescansado({ como: 'normal', casa: casa({ confortCasa: 6 }) }), AB.ABRIGO.horasDescanso);
  assert.equal(AB.horasDescansado({ como: 'calentito', casa: casa({ confortCasa: 9, cama: true }) }), AB.ABRIGO.horasDescansoPleno, 'con catre y mucho confort, más');
  assert.equal(AB.horasDescansado({ como: 'fresco', casa: casa({ confortCasa: 10 }) }), 0, 'una noche fresca no descansa');
  assert.equal(AB.horasDescansado({ como: 'normal', casa: null }), 0, 'afuera no hay descanso');
  assert.equal(AB.gastarDescanso(3, 1), 2); assert.equal(AB.gastarDescanso(1, 5), 0); assert.equal(AB.gastarDescanso(undefined, 1), 0);
  assert.equal(AB.factorDescanso(2), 1 + AB.ABRIGO.velocidadDescanso); assert.equal(AB.factorDescanso(0), 1);
}

// ---------------------------------------------------------------- 2. los tintes
{
  assert.deepEqual(TI.ORDEN_TINTES, [null, 'calafate', 'ocre', 'cal']);
  assert.equal(TI.siguienteTinte(null), 'calafate'); assert.equal(TI.siguienteTinte('cal'), null); assert.equal(TI.siguienteTinte('inventado'), 'calafate');
  assert.equal(TI.costoTinte('calafate', { calafates: 2 }).ok, false); assert.equal(TI.costoTinte('calafate', { calafates: 3 }).ok, true);
  assert.equal(TI.costoTinte('cal', { piedra: 2 }).ok, true); assert.equal(TI.costoTinte(null, {}).ok, true, 'volver a la madera es gratis');
  assert.equal(TI.tenible({ pieza: true, categoria: 'refugios' }), true); assert.equal(TI.tenible({ pieza: true, categoria: 'exterior' }), false);
  const lin = TI.hexALineal('#ffffff'); casi(lin[0], 1); casi(TI.hexALineal('#000000')[2], 0);
  // la cal aclara, el calafate corre hacia el violeta, y las vetas se conservan
  const madera = () => ({ array: new Float32Array([0.12, 0.07, 0.04, 0.06, 0.035, 0.02]), needsUpdate: false });
  const a = madera(); TI.tenirColores(a, TI.TINTES.cal.color);
  assert.ok(a.array[0] > 0.12 && a.needsUpdate, 'la cal aclara');
  assert.ok(a.array[0] > a.array[3], 'lo claro sigue más claro que lo oscuro');
  const v = madera(); TI.tenirColores(v, TI.TINTES.calafate.color);
  assert.ok(v.array[2] / v.array[0] > 0.04 / 0.12, 'el calafate tira al violeta');
}

// ---------------------------------------------------------------- 3. la casa viva
{
  const ch = CV.chimeneaDe({ plano: 'pared-hogar', x: 10, y: 2, z: 5, rot: 0 });
  assert.deepEqual([ch.x, ch.y, ch.z], [10, 2 + 3.75, 5], 'el humo sale arriba de la chimenea');
  const est = CV.chimeneaDe({ plano: 'estufa-hierro', x: 0, y: 0, z: 0, rot: Math.PI / 2 });
  casi(est.x, 0.08); casi(est.z, -0.18);
  assert.equal(CV.chimeneaDe({ plano: 'fogon', x: 0, y: 0, z: 0 }), null, 'el fogón no tiene chimenea');
  assert.equal(CV.brilloVentanas(0), 0); assert.equal(CV.brilloVentanas(1), 1);
  const paredes = [{ plano: 'pared-ventana', x: 0, y: 0, z: 0, rot: 0 }, { plano: 'pared-ventana-ancha', x: 20, y: 0, z: 0, rot: 0 }, { plano: 'pared-modular', x: 1, y: 0, z: 0, rot: 0 }];
  const prendidas = CV.ventanasEncendidas(paredes, [{ x: 0, y: 1, z: 2 }]);
  assert.equal(prendidas.length, 1, 'sólo la ventana con una luz cerca');
  casi(prendidas[0].y, 1.28); assert.equal(prendidas[0].ancho, 1.2);
  assert.equal(CV.ventanasEncendidas(paredes, []).length, 0, 'sin luces, nada');
  assert.equal(CV.ventanasEncendidas(paredes, [{ x: 0, y: 8, z: 0 }]).length, 0, 'una luz en otro piso no cuenta');
}

// ---------------------------------------------------------------- 4. el corral
{
  const beb = { plano: 'bebedero', x: 0, z: 0, terminada: true };
  const cerco = (x, z, terminada = true) => ({ plano: 'cerco', x, z, terminada });
  assert.equal(CO.buscarCorral([beb, cerco(4, 0), cerco(-4, 0), cerco(0, 4)]), null, 'con tres cercos no es corral');
  assert.equal(CO.buscarCorral([beb, cerco(4, 0), cerco(-4, 0), cerco(0, 4), cerco(0, -4, false)]), null, 'el cerco tiene que estar terminado');
  assert.equal(CO.buscarCorral([{ ...beb, terminada: false }, cerco(4, 0), cerco(-4, 0), cerco(0, 4), cerco(0, -4)]), null);
  assert.equal(CO.buscarCorral([beb, cerco(4, 0), cerco(-4, 0), cerco(0, 4), cerco(0, 9)]), null, 'lejos no cuenta');
  const c = CO.buscarCorral([beb, cerco(4, 0), cerco(-4, 0), cerco(0, 4), cerco(0, -4)]);
  assert.ok(c && c.cercos === 4); casi(c.radio, 3.4);
  const n = CO.corralNuevo(c, 12);
  assert.equal(n.esquilada.length, CO.CORRAL.ovejas); assert.equal(n.dia, 12);
  assert.deepEqual(CO.sanearCorral(n), n); assert.equal(CO.sanearCorral(null), null); assert.equal(CO.sanearCorral([1]), null);
  assert.deepEqual(CO.sanearCorral({ x: 'a', radio: 99, esquilada: [3, 'x', 9] }).esquilada, [3, null], 'dos ovejas, siempre');
  assert.equal(CO.mudarCorral(n, { x: 0, z: 0, radio: 3.4 }), false); assert.equal(CO.mudarCorral(n, { x: 10, z: 0, radio: 3 }), true); assert.equal(n.x, 10);
  // la majada propia usa las mismas reglas del galpón, con dos
  assert.deepEqual(MA.resumenMajada(n, 20), { total: 2, conLana: 2 });
  assert.equal(MA.esquilar(n, 1, 20, true).ok, true); assert.equal(MA.esquilar(n, 2, 20, true).motivo, 'oveja');
  assert.deepEqual(MA.resumenMajada(n, 20), { total: 2, conLana: 1 });
  assert.deepEqual(MA.resumenMajada(MA.majadaNueva(), 1), { total: MA.OVEJAS, conLana: MA.OVEJAS }, 'la del galpón sigue igual');
}

// ---------------------------------------------------------------- 5. la helada y el invernadero
{
  const h = {};
  HU.sembrar(h, '0:0', 'habas', 10); HU.sembrar(h, '5:0', 'papas', 10); HU.sembrar(h, '9:0', 'calafates', 10); HU.sembrar(h, '20:0', 'frutillas', 5);
  const protegido = (k) => k === '5:0';
  assert.equal(HU.helarHuerta(h, 12, protegido), 1, 'se hiela lo de afuera; el invernadero y el calafate aguantan; lo cosechable no');
  assert.equal(h['0:0'].dia, 11); assert.equal(h['5:0'].dia, 10); assert.equal(h['9:0'].dia, 10); assert.equal(h['20:0'].dia, 5);
  assert.equal(HU.helarHuerta(h, 12, protegido), 0, 'una vez por día');
  assert.equal(HU.diasQueFaltan(h['0:0'], 12), HU.CULTIVOS.habas.dias - 1, 'la helada atrasa un día');
  assert.equal(HU.sanearHuerta(h)['0:0'].ultimaHelada, 12, 'se guarda');
  assert.equal(HU.sanearHuerta({ '1:1': { cultivo: 'habas', dia: 3 } })['1:1'].ultimaHelada, undefined, 'las partidas viejas no cambian');
}

// ---------------------------------------------------------------- 6. el horno y la feria
{
  const hay = (m) => (k) => m[k] || 0;
  assert.equal(CC.elegirHorneada(hay({})), null);
  assert.equal(CC.elegirHorneada(hay({ harina: 2 })).id, 'pan-casero');
  assert.equal(CC.elegirHorneada(hay({ harina: 1, huevo: 1, papa: 1 })).id, 'empanadas');
  assert.equal(CC.elegirHorneada(hay({ harina: 3, huevo: 1, papa: 1 }), hay({ 'pan-casero': 5 })).id, 'empanadas', 'lo que tenés menos');
  assert.equal(CC.elegirHorneada(hay({ harina: 3, huevo: 1, papa: 1 }), hay({ empanadas: 8 })).id, 'pan-casero');
  for (const rc of CC.RECETAS_HORNO) {
    assert.ok(rc.da > 0, `${rc.id} da algo`);
    assert.equal(ENTRADA[rc.id]?.seccion, 'recetas', `${rc.id} está en el cuaderno`);
  }
  assert.ok(!CC.RECETAS_FUEGO.some((r) => r.id === 'pan-casero'), 'el pan es del horno, no del fuego');
  const vendo = FE.OFERTAS.filter((o) => o.pide['pan-casero'] || o.pide.empanadas);
  assert.ok(vendo.length >= 2, 'la feria compra lo horneado');
  const cant = (n) => ({ dia: 1, hora: 8, cantidad: n });
  const mochila = armarMochila({ entradas: { 'pan-casero': cant(3), empanadas: cant(4) }, cosas: {}, materiales: {}, ramitas: 0 }, {});
  assert.equal(mochila.find((r) => r.id === 'pan-casero')?.cuenta, 3); assert.equal(mochila.find((r) => r.id === 'empanadas')?.cuenta, 4);
}

// ---------------------------------------------------------------- 7. el diario
{
  const d = crearDiario();
  d.anotar('noche', 'casa'); d.anotar('descanso'); d.anotar('horno', 'pan casero'); d.anotar('buzon'); d.anotar('corral');
  d.anotar('helada', { helados: 2, protegidos: 1 }); d.anotar('tinte', 'cal');
  const p = d.cerrar(4, 'invierno', () => 0).texto;
  for (const s of ['Dormí en casa sin fuego', 'Me desperté descansado', 'Horneé pan casero', 'Había carta en el buzón', 'Don Ramón subió con dos ovejas', 'lo del invernadero ni se enteró', 'Teñí una pared de cal'])
    assert.ok(p.includes(s), `el diario dice «${s}»`);
  // un caso por tipo: el segundo nunca corre (lección de la 2.2)
  const casos = [...leer('src/diario.js').matchAll(/case '([^']+)':/g)].map((m) => m[1]);
  assert.deepEqual(casos.filter((c, i) => casos.indexOf(c) !== i), [], 'casos repetidos en el diario');
}

// ---------------------------------------------------------------- 8. las obras de verdad (Three en una vm)
{
  const src = path.join(raiz, 'src');
  const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
  const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
  const info = new Map(), orden = [], visto = new Set();
  const visitar = (archivo) => {
    archivo = path.resolve(archivo); if (visto.has(archivo)) return; visto.add(archivo);
    const texto = fs.readFileSync(archivo, 'utf8'), deps = [];
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(normalizar(archivo, m[2]));
    info.set(archivo, texto); for (const d of deps) visitar(d); orden.push(archivo);
  };
  visitar(path.join(src, 'construccion.js'));
  const transformar = (archivo, texto) => {
    const ex = [...texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    texto = texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    texto = texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_t, nombres, spec) => {
      const partes = nombres.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); });
      return `const { ${partes.join(', ')} } = ${idModulo(normalizar(archivo, spec))};`;
    });
    texto = texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '').replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm, '');
    return `const ${idModulo(archivo)}=(()=>{\n${texto}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += ';globalThis.__C = __mod_construccion; globalThis.__THREE = THREE;';
  const ctx = vm.createContext({ console, Math, Date, JSON, Array, Object, Set, Map, Number, String, Boolean, Symbol, Error, TypeError, RangeError, Float32Array, Uint16Array, Uint32Array, Int32Array, Uint8Array, Int8Array, Int16Array, Float64Array, Uint8ClampedArray, ArrayBuffer, DataView, WeakMap, WeakSet, Promise, parseFloat, parseInt, isFinite, isNaN, Infinity, NaN, performance: { now: () => 0 } });
  vm.runInContext(code, ctx, { filename: 'construccion-2-4.vm.js' });
  const C = ctx.__C, THREE = ctx.__THREE;

  // un lago al este de x = 150 (la orilla), hondo, dentro de los 220 m de LAGO
  const T = { altura: (x) => (x > 150 ? -1.2 : 0.4), agua: (x) => x > 150, normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {} };
  const obs = [], plats = [];
  const col = {
    agregar: (o) => obs.push(o), agregarPlataforma: (p) => plats.push(p), plataformaEn: () => null,
    eliminarPorDuenio(d) { for (const l of [obs, plats]) for (let i = l.length - 1; i >= 0; i--) if (l[i].duenio === d) l.splice(i, 1); },
  };
  const s = C.crearConstruccion(T, new THREE.Scene(), col, { arboles: [], despejar() {} });
  const P = C.PLANO;
  for (const id of ['alero', 'pared-hogar', 'horno', 'invernadero', 'embarcadero', 'buzon', 'bebedero', 'adarve']) {
    const p = P[id];
    assert.ok(p && p.etapas.length === 1 && p.fisica, `plano ${id}`);
  }
  assert.equal(P.bebedero.soloRelax, true); assert.equal(P.buzon.soloRelax, true); assert.equal(P.adarve.soloDesafio, true);
  assert.equal(P['pared-hogar'].categoria, 'refugios'); assert.ok(P['pared-hogar'].fuegoContenido && P['pared-hogar'].snap?.familia === 'modular-muro');

  // el embarcadero: arranca en la orilla, la punta en lo hondo
  const E = Math.PI / 2;   // la punta (z local) mira al este
  const bien = s.revisarSitio(150, 110, P.embarcadero, E);
  assert.equal(bien.ok, true, 'orilla y agua honda: ' + bien.motivo); casi(bien.base, 0.4);
  assert.match(s.revisarSitio(150, 110, P.embarcadero, -E).motivo, /Girala/, 'al revés, avisa que lo gires');
  assert.match(s.revisarSitio(100, 110, P.embarcadero, E).motivo, /agua honda/, 'en seco, no');
  assert.match(s.revisarSitio(170, 110, P.embarcadero, E).motivo, /orilla/, 'en el medio del lago, no');
  assert.match(s.revisarSitio(150, 400, P.embarcadero, E).motivo, /agua honda/, 'lejos del lago (donde el kayak no anda), no');

  // 2.4.1: la punta honda pero los costados (donde se amarra el kayak) en lo playo: no
  const Torig = T.altura;
  T.altura = (x, z) => (x > 150 ? (Math.abs(z - 110) < 0.5 ? -1.2 : -0.2) : 0.4);
  assert.match(s.revisarSitio(150, 110, P.embarcadero, E).motivo || '', /agua honda/, 'sin lugar hondo para amarrar, no');
  T.altura = Torig;
  // 2.4.1: ni encima de lo que ya está en la orilla
  s.sincronizar([{ plano: 'cerco', x: 148.6, z: 110, y: 0.4, rot: 0, etapas: P.cerco.etapas.length }]);
  assert.match(s.revisarSitio(150, 110, P.embarcadero, E).motivo || '', /superpone/, 'no atraviesa un cerco de la orilla');

  // el adarve: con el pie de la escalera colgando, no
  const Tfalda = T.altura;
  T.altura = (x, z) => (z < -1 ? 0.4 - (-1 - z) * 0.3 : Tfalda(x, z));
  assert.match(s.revisarSitio(0, 0, P.adarve, 0).motivo || '', /colgando/, 'en una falda la escalera quedaría colgando');
  T.altura = Tfalda;
  assert.equal(s.revisarSitio(0, 0, P.adarve, 0).ok, true, 'en lo parejo, sí');

  // las obras, terminadas, como las carga una partida
  s.sincronizar([
    { plano: 'embarcadero', x: 150, z: 110, y: 0.4, rot: E, etapas: 1 },
    { plano: 'adarve', x: 0, z: 0, y: 0.4, rot: 0, etapas: 1 },
    { plano: 'alero', x: 20, z: 0, y: 0.4, rot: 0, etapas: 1 },
    { plano: 'cantero', x: 40, z: 0, y: 0.4, rot: 0, etapas: P.cantero.etapas.length },
    { plano: 'invernadero', x: 40, z: 0.5, y: 0.4, rot: 0, etapas: 1 },
    { plano: 'pared-modular', x: 60, z: 0, y: 0.4, rot: 0, etapas: P['pared-modular'].etapas.length },
    { plano: 'pared-modular', x: 70, z: 0, y: 0.4, rot: 0, etapas: P['pared-modular'].etapas.length, tinte: 'cal' },
  ]);
  const obra = (id, x) => s.obras.find((o) => o.plano.id === id && (x === undefined || o.datos.x === x));
  const deObra = (o) => plats.filter((p) => p.duenio === o);
  const muelle = deObra(obra('embarcadero'));
  assert.equal(muelle.length, 1, 'el embarcadero se camina'); casi(muelle[0].alto, 0.4 + 0.46);
  const adarve = deObra(obra('adarve'));
  assert.equal(adarve.length, 10, 'el adarve: la pasarela, ocho escalones y el descanso al pie');
  assert.ok(adarve.some((p) => Math.abs(p.alto - (0.4 + 2.06)) < 1e-6), 'la pasarela, a dos metros');
  assert.ok(obs.some((o) => o.duenio === obra('adarve') && o.seg), 'y la baranda del lado del muro');

  // abajo de la galería no llueve; al lado, sí
  assert.equal(s.cubiertaDePieza({ x: 20.8, y: 0.5, z: 0.9 })?.plano.id, 'alero');
  assert.equal(s.cubiertaDePieza({ x: 22.5, y: 0.5, z: 0 }), null, 'afuera del alero');
  assert.equal(s.cubiertaDePieza({ x: 20.8, y: 6, z: 0.9 }), null, 'arriba del techo, no');
  assert.equal(s.bajoCubierta({ x: 20.8, y: 0.5, z: 0.9 })?.cubierta.id, 'alero', 'bajoCubierta también lo sabe (la lluvia y la leña)');
  assert.equal(s.bajoCubierta({ x: 40, y: 0.5, z: 0 })?.cubierta.id, 'techo-una-agua', 'el invernadero suena a chapa');
  assert.equal(s.cubiertaDePieza({ x: 40, y: 0.4, z: 0 })?.plano.id, 'invernadero', 'el cantero queda adentro del invernadero');

  // la galería y el invernadero pueden ir encima de otras piezas
  assert.equal(s.revisarSitio(20, 0.2, P.tendal, 0).motivo !== 'Se superpone con otra pieza', true, 'el tendal entra abajo de la galería');

  // el tinte
  const lisa = obra('pared-modular', 60), cal = obra('pared-modular', 70);
  const col0 = lisa.malla.geometry.getAttribute('color').array, col1 = cal.malla.geometry.getAttribute('color').array;
  assert.equal(col0.length, col1.length);
  assert.ok(col1[0] > col0[0] * 1.5, 'la pared con cal es más clara');
  assert.equal(s.tenibleCerca({ x: 60.5, y: 1.5, z: 0 })?.datos.x, 60);
  assert.equal(s.tenibleCerca({ x: 20, y: 1.5, z: 0 }), null, 'la galería es del exterior: no se tiñe');
  assert.equal(s.tenir(lisa, 'calafate'), true); assert.equal(lisa.datos.tinte, 'calafate');
  const col2 = lisa.malla.geometry.getAttribute('color').array;
  assert.ok(col2[2] / col2[0] > col0[2] / col0[0], 'el calafate tira al violeta');
  s.tenir(lisa, null); assert.equal(lisa.datos.tinte, undefined, 'natural no deja marca en la partida');
  casi(lisa.malla.geometry.getAttribute('color').array[0], col0[0], 1e-5);
  s.tenir(lisa, 'inventado'); assert.equal(lisa.datos.tinte, undefined, 'un tinte que no existe no se guarda');
  s.tenir(lisa, 'constructor'); assert.equal(lisa.datos.tinte, undefined, 'ni uno heredado del objeto (2.4.1)');
  assert.equal(TI.siguienteTinte('toString'), 'calafate'); assert.equal(TI.costoTinte('constructor', {}).ok, true);
}

// ---------------------------------------------------------------- 9. enganchado en el juego
{
  const main = leer('src/main.js');
  const jug = leer('src/jugador.js');
  assert.match(jug, /else if \(estado\.descansado > 0 && !estado\.montado\) vmax \*= 1\.08;/, 'descansado se camina más liviano');
  assert.match(main, /const casa = bajoTechoPropio \? obras\?\.estadoHabitat\?\.\(jp, \{ fuego: fuegoVivo \? fg\.pos : null \}\) \|\| null : null;/, 'dormir mira la casa, si estás adentro');
  assert.match(main, /jugador\.estado\.descansado = descanso;/);
  assert.match(main, /if \(js\.descansado > 0\) js\.descansado = gastarDescanso\(js\.descansado, horas\);/, 'el descanso se gasta con las horas');
  assert.match(main, /ctxClima\.chimeneas = chimeneasTodas \|\| chimeneas;/, 'tu chimenea echa humo');
  assert.match(main, /if \(modo === 'jugando'\) \{ actualizarMajada\(dt\); actualizarCasaViva\(dt\); \}/);
  assert.match(main, /case 'KeyT': if \(modoObra && obras\) \{ tenirPieza\(\); break; \} armarCarpa\(\); break;/, 'T tiñe con los planos abiertos');
  assert.match(main, /lluvia: obras\.cubiertaDePieza\?\.\(o\.datos\) \? 0 : clima\.estado\.lluvia/, 'el tendal bajo la galería seca');
  assert.match(main, /if \(paso && !desafio && U\.uInvierno\.value > 0\.5\) helarLaHuerta\(h\);/, 'la helada, sólo cuando el día cambia jugando');
  assert.match(main, /const OBRAS_QUE_TRABAJAN = \['colmena', 'ahumadero', 'vivero', 'lenera', 'horno', 'buzon', 'embarcadero', 'bebedero'\];/);
  assert.match(main, /default: return avisoObra24\(o\);/, 'el aviso de las obras nuevas');
  assert.match(main, /if \(usarObra24\(o\)\) \{ refrescarBarra\(true\); guardar\(\); return; \}/, 'y la tecla E, por el mismo camino');
  // el embarcadero no le gana a «Subir al kayak»: con el kayak al alcance, la obra no cuenta y E sube
  assert.match(main, /if \(o\.plano\.id === 'embarcadero' && \(js\.enKayak \|\| kayak\?\.cerca\(js\) \|\| !sobreEmbarcadero\(o, js\.pos\)\)\) continue;/);
  assert.match(main, /ovejaCercana = js\.enTren \|\| js\.enKayak \? null : corralMundo\?\.ovejaCerca\(js\.pos\) \|\| majadaMundo\.ovejaCerca\(js\.pos\);/, 'tus ovejas se esquilan');
  assert.match(main, /textoOveja\(majadaDe\(ovejaCercana\), ovejaCercana\.i/, 'y el aviso dice de cuál');
  assert.match(main, /const correoAca = npc\.clave === 'ercilia' \|\| npc\.clave === 'buzon';/, 'el buzón da las cartas');
  assert.match(main, /Te la dejaron en el buzón/);
  assert.match(main, /fuegoPropio\.plano\.id === 'pared-hogar' \? 'Encender el hogar'/);
  assert.match(main, /diario\.anotar\('noche', como === 'fresco' && inviernoEnCasa \? 'casa' : como\);/);
  // el corral es del Relax
  assert.match(main, /function refrescarCorral\(\) \{\n  if \(desafio \|\| !obras\) return;/);
  assert.match(leer('src/guardado.js'), /corral: sanearCorral\(p\.corral\),/, 'el corral se guarda saneado');
  assert.match(leer('src/idioma-en.js'), /Object\.assign\(EN, EN_Q\);/, 'la tanda Q está volcada');
  assert.match(leer('src/plantilla.html'), /<dt><kbd>T<\/kbd><\/dt><dd>con los planos abiertos: teñir/);
}

console.log('2.4: la casa abriga, descanso, casa viva, tintes, galería, hogar, horno, invernadero, embarcadero, buzón, corral y adarve');
