// 4.6 recursos (paquete 1a del mapa) · LOS RECURSOS DE ZONA, en Node (sin Electron; la partida real está en humo-4-6-recursos.cjs):
//   · los cinco materiales nuevos (junco, hierbas, arcilla, cuero, piedra de cantera) en todo lo que enumera materiales: construcción,
//     comercio, depósitos, mochila, cuaderno, guía y la consola de códigos;
//   · los ritmos de reposición: la veta 6 cada 2 días, el junco 3 y las hierbas 2 por día, la arcilla 4 cada 2 días, y cada herramienta
//     en su lugar (el pico común no labra la veta);
//   · las herramientas de zona: venderlas (oficio y plata), darlas, y la API que usa la gente del valle;
//   · el pico: el común se llama «Pico» y el «Pico de cantero» es otro, nuevo; una partida vieja con pico sigue igual;
//   · los pehuenes: los 8 del mirador (el bosque de verdad, armado en Node) dan 6 piñones cada otoño, uno por año;
//   · el mundo (recursos-zona-mundo.js) con el terreno de verdad: las mallas, la E y el aviso, y que nada flote;
//   · el guardado: una partida vieja no lo trae y arranca con todo disponible; uno roto se sanea.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { registrarThree } from './ayuda-three.mjs';
import { enOrden, que, revisarModulo } from './ayuda-interacciones.mjs';

registrarThree();
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
const noop = () => {};
const ctx2d = new Proxy({ measureText: (t) => ({ width: String(t).length * 20 }), createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }), getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }, { get: (t, p) => (p in t ? t[p] : noop), set: (t, p, v) => { t[p] = v; return true; } });
const dibujado = [];
const lienzo = () => ({ width: 1, height: 1, getContext: () => new Proxy({}, { get: (t, p) => (p in t ? t[p] : (...a) => dibujado.push(p)), set: (t, p, v) => { t[p] = v; return true; } }), toDataURL: () => 'data:' });
globalThis.document = globalThis.document || { createElement: (tag) => (tag === 'canvas' ? { width: 1, height: 1, getContext: () => ctx2d } : {}) };
globalThis.self = globalThis.self || {}; globalThis.window = globalThis.window || {};

const R = await import('../src/recursos-zona.js');
const THREE = await import('three');
const { MATERIALES } = await import('../src/construccion.js');
const C = await import('../src/comercio.js');
const AL = await import('../src/almacen.js');
const { ENTRADAS, ENTRADA } = await import('../src/cuaderno.js');
const { TRUEQUE } = await import('../src/trueque.js');
const { seccionesGuia, SECCIONES_GUIA } = await import('../src/guia.js');
const G = await import('../src/guardado.js');
const E = await import('../src/trucos.js');
const { economiaNueva, pesosDe } = await import('../src/economia.js');
const O = await import('../src/oficios.js');
const { armarMochila } = await import('../src/mochila.js');
const { generarTerreno } = await import('../src/terreno.js');
const { generarVegetacion } = await import('../src/vegetacion.js');
const { CALIDADES } = await import('../src/config.js');
const { crearRecursosZonaMundo } = await import('../src/recursos-zona-mundo.js');

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const ZONA = ['junco', 'hierbas', 'arcilla', 'cuero', 'piedra-cantera'];
const HERR = ['hoz-junco', 'pala-arcilla', 'cuchillo-cuero', 'pico-cantero'];
const xpParaNivel = (nv) => O.UMBRALES[nv];

// ---------------------------------------------------------------- 1. los materiales en todo lo que enumera materiales
{
  eq(R.IDS_MATERIALES_ZONA, ZONA, 'los cinco materiales de zona, con los ids que usan los otros dos agentes');
  for (const k of ZONA) {
    ok(Object.hasOwn(MATERIALES, k) && MATERIALES[k].nombre && MATERIALES[k].uno && MATERIALES[k].de, `${k}: en MATERIALES de construccion.js (nombre, uno, de)`);
    ok(C.esBien(k) && C.BIENES[k].donde === 'material' && C.BIENES[k].lote >= 2 && C.BIENES[k].valor > 0, `${k}: es un bien del comercio (material, de a lotes)`);
    ok(AL.ETIQUETA[k] && AL.ALMACENES.barraca.guarda.includes(k), `${k}: la barraca lo guarda y sabe cómo llamarlo`);
    ok(ENTRADA[R.entradaDeMaterial(k)]?.seccion === 'trueque' && ENTRADA[R.entradaDeMaterial(k)].texto && ENTRADA[R.entradaDeMaterial(k)].pista, `${k}: anotación del cuaderno`);
    ok(!/ñ/.test(k), `${k}: sin eñe`);
  }
  const porUnidad = (k) => C.BIENES[k].valor / C.BIENES[k].lote;
  ok(porUnidad('piedra-cantera') >= 2 * porUnidad('piedra'), 'la piedra de cantera vale al menos el doble que la suelta');
  ok(porUnidad('cuero') > porUnidad('lana'), 'el cuero vale más que la lana');
  // lo que da cada zona por día, a precio de plaza (yerba = $100): que no rompa los ~$3.200 diarios
  const porDia = (R.PUNTOS_ZONA.reduce((s, p) => s + Object.entries(p.da).reduce((t, [k, c]) => t + c * porUnidad(k), 0) / p.cada, 0)) * 100;
  ok(porDia > 600 && porDia < 2200, `todo junto, a precio de plaza, da ~$${Math.round(porDia)} por día (yendo a los tres lugares)`);
  // la barraca: el resumen nombra los de zona sólo si hay (el de siempre no cambia)
  const b = { n: 0, g: {} };
  AL.guardar('barraca', b, 'tronco', 3);
  eq(AL.resumen('barraca', b), 'Troncos 3/40 · Tablas 0/40 · Piedra 0/40 · Lana 0/40', 'el resumen de la barraca sin materiales de zona es el de antes');
  eq(AL.guardar('barraca', b, 'junco', 50), 40, 'la barraca guarda junco hasta su tope');
  ok(AL.resumen('barraca', b).endsWith('Junco 40/40'), 'y con junco, lo nombra');
  ok(AL.textoCapacidad('barraca').includes('los de zona'), 'la ficha de la barraca dice que guarda los de zona');
  for (const id of HERR) ok(AL.ALMACENES.herramientero.guarda.includes(id) && AL.ETIQUETA[id], `${id}: se cuelga en el herramientero`);
  // la mochila: casilla e ícono de cada material y herramienta (el ícono se dibuja con recursos-zona.js)
  const p = G.progresoNuevo();
  for (const k of ZONA) p.materiales[k] = 2;
  for (const id of [...HERR, 'pico']) p.cosas[id] = 1;
  const moch = armarMochila(p, {});
  for (const k of ZONA) ok(moch.some((r) => r.id === k && r.cuenta === 2 && Object.hasOwn(R.ICONOS_ZONA, r.icono)), `${k}: casilla de la mochila con su ícono`);
  for (const id of HERR) ok(moch.some((r) => r.id === id && r.nombre === R.HERRAMIENTAS_ZONA[id].nombre && Object.hasOwn(R.ICONOS_ZONA, r.icono)), `${id}: casilla de la mochila`);
  const nombres = moch.map((r) => r.nombre);
  ok(nombres.includes('Pico') && nombres.includes('Pico de cantero'), 'en la mochila: «Pico» (el común) y «Pico de cantero» (el nuevo)');
  ok(moch.findIndex((r) => r.id === 'junco') > moch.findIndex((r) => r.id === 'lana' || r.id === 'piedra'), 'los de zona van después de lo de siempre');
  // cada ícono se dibuja sin romperse
  for (const [k, f] of Object.entries(R.ICONOS_ZONA)) { const antes = dibujado.length; f(lienzo().getContext('2d')); ok(dibujado.length > antes, `ícono ${k}: dibuja algo`); }
  // la guía (F1): la sección de los recursos de zona, sólo en el Relax
  ok(seccionesGuia('relax').some((s) => s.id === 'zona') && !seccionesGuia('desafio').some((s) => s.id === 'zona'), 'la guía tiene «Recursos de zona» en el Relax');
  const zona = SECCIONES_GUIA.find((s) => s.id === 'zona');
  ok(zona.items.every((i) => i[1].length < 260) && /pico de cantero/.test(zona.items.map((i) => i[1]).join(' ')), 'la guía explica la veta con el pico de cantero');
}

// ---------------------------------------------------------------- 2. la consola de códigos
{
  const mundo = (desafio = false) => {
    const p = G.progresoNuevo();
    if (desafio) { p.modo = 'desafio'; delete p.economia; }
    const m = { desafio, progreso: () => p, ajustes: () => ({ estacion: 'verano', clima: 'variable', duracion: 30 }), jugador: () => ({ pos: { x: 0, y: 0, z: 0 } }), reloj: { congelado: false }, limite: 468,
      lugares: () => [], ir: noop, depositos: () => [], rehacerObra: noop, refrescar: noop, guardar: noop, limpiar: noop, salir: noop };
    return { p, m };
  };
  const w = mundo();
  ok(E.ejecutar('materiales 100', w.m).ok, 'materiales 100');
  for (const k of ['tronco', 'tabla', 'piedra', 'lana', ...ZONA]) eq(w.p.materiales[k], 100, `materiales: ${k} en 100`);
  ok(E.ejecutar('materiales 0', w.m).ok && ZONA.every((k) => !(k in w.p.materiales)), 'materiales 0 los borra');
  const h = E.ejecutar('herramientas', w.m);
  ok(h.ok && HERR.every((id) => w.p.cosas[id] === 1), `herramientas da las de zona (${h.texto.slice(0, 120)})`);
  const d = mundo(true);
  E.ejecutar('materiales 50', d.m);
  eq(d.p.materiales, { tronco: 50, tabla: 50, piedra: 50 }, 'en La noche de los duendes, sólo troncos, tablas y piedras');
}

// ---------------------------------------------------------------- 3. los ritmos de reposición
{
  const por = Object.fromEntries(R.PUNTOS_ZONA.map((p) => [p.id, p]));
  eq(Object.keys(por).sort(), ['arcilla', 'cantera', 'hierbas', 'juncal'], 'cuatro puntos');
  eq([por.cantera.da, por.cantera.cada], [{ 'piedra-cantera': 6 }, 2], 'la veta: 6 piedras de cantera cada 2 días');
  eq([por.juncal.da, por.juncal.cada], [{ junco: 3 }, 1], 'el juncal: 3 por día');
  eq([por.hierbas.da, por.hierbas.cada], [{ hierbas: 2 }, 1], 'las hierbas: 2 por día');
  eq([por.arcilla.da, por.arcilla.cada], [{ arcilla: 4 }, 2], 'la arcilla: 4 cada 2 días');
  eq([por.cantera.herramienta, por.juncal.herramienta, por.hierbas.herramienta, por.arcilla.herramienta], ['pico-cantero', 'hoz-junco', 'hoz-junco', 'pala-arcilla'], 'cada uno con su herramienta');
  eq([por.cantera.x, por.cantera.z, por.juncal.x, por.juncal.z, por.arcilla.x, por.arcilla.z], [-405, -305, -265, -239, 52, 45], 'coordenadas fijas (la arcilla en la orilla seca, no en el agua)');
  // treinta días yendo todos los días: cuánto junta cada uno
  const est = R.recursosZonaNuevos();
  const cosas = { 'pico-cantero': 1, 'hoz-junco': 1, 'pala-arcilla': 1 };
  const total = {};
  for (let dia = 1; dia <= 30; dia++) for (const p of R.PUNTOS_ZONA) {
    for (let vez = 0; vez < 2; vez++) {   // (la segunda vez del mismo día no da)
      const u = R.usarPunto(est, p, dia, cosas);
      if (u.ok) for (const [k, c] of Object.entries(u.da)) total[k] = (total[k] || 0) + c;
      else ok(u.motivo === 'falta' && u.falta >= 1, `${p.id}, día ${dia}: la segunda vez espera`);
    }
  }
  eq(total, { 'piedra-cantera': 90, junco: 90, hierbas: 60, arcilla: 60 }, 'en 30 días: 90 piedras de cantera, 90 juncos, 60 hierbas y 60 de arcilla');
  // el aviso cuenta los días
  const e2 = R.recursosZonaNuevos();
  ok(R.usarPunto(e2, 'cantera', 7, cosas).ok, 'la veta da el día 7');
  eq(R.faltaPara(e2, 'cantera', 8), 1, 'el 8 falta un día'); eq(R.faltaPara(e2, 'cantera', 9), 0, 'el 9 vuelve');
  ok(/vuelve a dar piedra en 1 día$/.test(R.avisoPunto(e2, 'cantera', 8, cosas)), `el aviso dice cuánto falta (${R.avisoPunto(e2, 'cantera', 8, cosas)})`);
  eq(R.avisoPunto(e2, 'cantera', 9, cosas), 'Labrar la veta (6 piedras de cantera)', 'y qué da');
  // sin la herramienta no se junta; el pico común NO labra la veta
  const e3 = R.recursosZonaNuevos();
  eq(R.usarPunto(e3, 'cantera', 1, { pico: 1 }).motivo, 'herramienta', 'con el pico común no se labra la veta');
  ok(/pico de cantero/.test(R.avisoPunto(e3, 'cantera', 1, { pico: 1 })), 'y el aviso dice cuál hace falta');
  eq(R.usarPunto(e3, 'juncal', 1, {}).motivo, 'herramienta', 'el junco pide la hoz');
  eq(R.usarPunto(e3, 'arcilla', 1, { 'hoz-junco': 1 }).motivo, 'herramienta', 'la arcilla pide la pala');
  eq(e3.usos, {}, 'sin herramienta no se gasta nada');
  // cerca de qué punto estás
  eq(R.puntoCerca(-402, -305)?.id, 'cantera', 'parado frente a la veta'); eq(R.puntoCerca(-265, -237)?.id, 'juncal', 'en el juncal');
  eq(R.puntoCerca(-256, -244)?.id, 'hierbas', 'en las hierbas'); eq(R.puntoCerca(53, 45)?.id, 'arcilla', 'en la barranca'); eq(R.puntoCerca(0, 0), null, 'en otro lado, nada');
}

// ---------------------------------------------------------------- 4. las herramientas de zona (la API para la gente del valle)
{
  eq(R.IDS_HERRAMIENTAS_ZONA, HERR, 'las cuatro herramientas de zona');
  for (const id of HERR) {
    const h = R.HERRAMIENTAS_ZONA[id];
    ok(h.id === id && h.nombre && h.precio > 0 && h.texto && h.efecto && h.icono, `${id}: nombre, precio, textos e ícono`);
    ok(ENTRADA[id]?.seccion === 'trueque', `${id}: anotación del cuaderno`);
  }
  eq(R.HERRAMIENTAS_ZONA['pico-cantero'].requisito, { oficio: 'picapedrero', nivel: 3 }, 'el pico de cantero pide picapedrero 3 («Picapedrero de cantera»)');
  eq(O.tituloDe('picapedrero', 3), 'Picapedrero de cantera', 'el nivel 3 se llama «Picapedrero de cantera»');
  ok(R.HERRAMIENTAS_ZONA['pico-cantero'].precio > 1200, 'cuesta más que el pico común comprado ($1.200)');
  const p = { ...G.progresoNuevo(), dia: 4 };
  p.economia = { ...economiaNueva(), pesos: 3000 };
  p.oficios.xp.picapedrero = xpParaNivel(2);
  let v = R.puedeComprarHerramienta(p, 'pico-cantero');
  ok(!v.ok && v.motivo === 'oficio' && /picapedrero de cantera/.test(v.texto), `sin el nivel no te lo venden (${v.texto})`);
  p.oficios.xp.picapedrero = xpParaNivel(3);
  v = R.venderHerramienta(p, 'pico-cantero', { quien: 'el cantero' });
  ok(!v.ok && v.motivo === 'plata' && v.falta === 1000, `con el nivel pero sin plata, dice cuánto falta (${v.texto})`);
  ok(!p.cosas['pico-cantero'] && pesosDe(p) === 3000, 'y no cobra ni da nada');
  ok(R.puedeComprarHerramienta(p, 'pico-cantero', { nivel: 3, precio: 2500 }).ok, 'con una rebaja (precio) y el nivel que pasa main.js, sí');
  p.economia.pesos = 6000;
  v = R.venderHerramienta(p, 'pico-cantero', { quien: 'el cantero' });
  ok(v.ok && p.cosas['pico-cantero'] === 1 && pesosDe(p) === 2000, `te lo vende y cobra $4.000 (${v.texto})`);
  const mov = p.economia.libro[p.economia.libro.length - 1];
  ok(mov.monto === -4000 && /pico de cantero/.test(mov.motivo) && mov.con === 'el cantero', 'queda en el libro de pesos');
  eq(R.venderHerramienta(p, 'pico-cantero').motivo, 'ya-la-tenes', 'no se vende dos veces');
  ok(R.darHerramienta(p, 'hoz-junco').nueva && p.cosas['hoz-junco'] === 1, 'dar: de regalo, sin oficio ni plata');
  ok(!R.darHerramienta(p, 'hoz-junco').nueva, 'dar otra vez no suma otra');
  ok(!R.darHerramienta(p, 'no-existe').ok && R.puedeComprarHerramienta(p, '__proto__').motivo === 'no-existe', 'lo que no existe, no');
  const d = { modo: 'desafio', cosas: {} };
  ok(!R.darHerramienta(d, 'hoz-junco').ok && R.puedeComprarHerramienta(d, 'hoz-junco').motivo === 'desafio', 'en La noche de los duendes, nada');
  ok(R.tieneHerramienta(p, 'pico-cantero') && !R.tieneHerramienta(p, 'pala-arcilla'), 'tieneHerramienta');
}

// ---------------------------------------------------------------- 5. el pico: el común es «Pico», el de cantero es otro
{
  eq(TRUEQUE.pico.nombre, 'Pico', 'el almacén lo llama «Pico»'); eq(TRUEQUE['pico-comprado'].nombre, 'Pico, ya hecho', 'y el comprado');
  eq(TRUEQUE.pico.cosa, 'pico', 'la misma cosa de siempre (las partidas viejas siguen igual)');
  eq(ENTRADA.pico.nombre, 'Pico', 'el cuaderno también'); eq(ENTRADA['pico-cantero'].nombre, 'Pico de cantero', 'y el de cantero tiene su anotación');
  const moch = leer('src/mochila.js');
  ok(!/nombre: 'Pico de cantero'/.test(moch), 'la mochila no llama «Pico de cantero» al común');
  for (const f of ['src/trueque.js', 'src/cuaderno.js', 'src/mochila.js']) ok(!leer(f).includes("id: 'pico', cosa: 'pico', nombre: 'Pico de cantero'"), `${f}: sin el nombre viejo en el común`);
}

// ---------------------------------------------------------------- 6. los pehuenes: el bosque de verdad y el otoño
const T = generarTerreno();
const veg = generarVegetacion(T, CALIDADES.media, new THREE.Scene());
const pehuenes = veg.arboles.filter((a) => a.especie === 'pehuen');
{
  eq(pehuenes.length, 8, 'los 8 pehuenes del mirador (no se suman árboles)');
  ok(pehuenes.every((a) => Math.hypot(a.x + 292, a.z - 36) < 85), 'todos a menos de 85 m del mirador');
  eq([1, 4, 5, 8, 9, 12, 13, 17, 20, 21].map((d) => R.esOtono(d, 12, 'auto')), [false, false, true, true, false, false, false, true, true, false], 'en «auto», el otoño son los días 5 a 8 de cada doce');
  ok(R.esOtono(2, 12, 'otono') && !R.esOtono(6, 12, 'verano') && !R.esOtono(6, 12, 'invierno'), 'con la estación fija: otoño siempre, las otras nunca');
  eq([R.anioDe(1), R.anioDe(12), R.anioDe(13), R.anioDe(25)], [1, 1, 2, 3], 'el año dura doce días');
  const est = R.recursosZonaNuevos();
  let pinones = 0;
  for (let dia = 1; dia <= 36; dia++) for (const a of pehuenes) for (let vez = 0; vez < 2; vez++) { const r = R.juntarPehuen(est, a, dia, 12, 'auto'); if (r.ok) pinones += r.pinones; }
  eq(pinones, 3 * 8 * 6, 'en tres años: 6 piñones por pehuén, una vez por otoño (144)');
  ok(Object.keys(est.pehuenes).length === 8, 'cada pehuén con su año');
  const e2 = R.recursosZonaNuevos(), a0 = pehuenes[0];
  eq(R.juntarPehuen(e2, a0, 2, 12, 'auto').motivo, 'estacion', 'en verano no da');
  ok(/en otoño/.test(R.avisoPehuen(e2, a0, 2, 12, 'auto')), 'y el aviso lo dice');
  ok(R.juntarPehuen(e2, a0, 6, 12, 'auto').ok && R.juntarPehuen(e2, a0, 7, 12, 'auto').motivo === 'ya', 'en otoño, una vez');
  ok(/ya dio sus piñones/.test(R.avisoPehuen(e2, a0, 7, 12, 'auto')), 'el aviso dice que ya dio');
  ok(R.juntarPehuen(e2, a0, 18, 12, 'auto').ok, 'y el otoño que viene, otra vez');
  eq(R.pehuenCerca(pehuenes, a0.x + a0.r + 1, a0.z), a0, 'al pie del tronco se encuentra'); eq(R.pehuenCerca(pehuenes, a0.x + 12, a0.z + 12), null, 'a 17 m, no');
}

// ---------------------------------------------------------------- 7. el mundo: mallas, E, aviso y nada flotando
{
  const escena = new THREE.Scene();
  const col = { lista: [], agregar(o) { this.lista.push(o); } };
  const progreso = { ...G.progresoNuevo(), dia: 6, horas: 10 };
  const notas = [], registrados = [], xp = [];
  let barra = 0, guardadas = 0, entradaPinon = 0;
  const W = crearRecursosZonaMundo({
    T, escena, col, progreso: () => progreso, estacion: () => 'auto', pehuenes: () => veg.arboles,
    nota: (a, b) => notas.push(`${a} · ${b}`), guardar: () => guardadas++, registrar: (id) => { registrados.push(id); progreso.entradas[id] = { cantidad: 0 }; },
    sumarMaterial: (k, c) => { progreso.materiales[k] = (progreso.materiales[k] || 0) + c; }, sumarEntrada: (id, c) => { entradaPinon += c; return entradaPinon; },
    ganarOficio: (id, c) => xp.push([id, c]), refrescarBarra: () => barra++,
  });
  const grupo = escena.children.find((o) => o.name === 'recursos-zona');
  ok(grupo && grupo.children.length === 8, `un grupo con 8 mallas: lo fijo, lo que hay y lo cortado (${grupo?.children.length})`);
  let tris = 0;
  for (const m of grupo.children) {
    tris += m.geometry.attributes.position.count / 3;
    ok(m.material.vertexColors && !m.castShadow && m.visible, `${m.name}: color por vértice, sin sombra, visible al nacer (se compila en la carga)`);
  }
  ok(new Set(grupo.children.map((m) => m.material)).size === 1, 'un solo material para todo (el de la gente y los animales: ningún programa nuevo)');
  ok(tris < 3500, `poca geometría: ${tris} triángulos en total`);
  // nada flota: cada malla tiene vértices a ras del suelo (o enterrados) y la pila y los tallos se apoyan
  const v = new THREE.Vector3();
  for (const m of grupo.children) {
    m.updateMatrixWorld(true);
    const p = m.geometry.attributes.position;
    let bajo = Infinity;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); bajo = Math.min(bajo, v.y - T.altura(v.x, v.z)); }
    ok(bajo <= 0.02 && bajo > -1.6, `${m.name}: apoyada en el suelo (lo más bajo, a ${bajo.toFixed(2)} m)`);
  }
  // pieza por pieza (cada tallo de junco, cada mata, cada bloque de abajo, cada pan de arcilla): ninguna arranca en el aire
  for (const m of grupo.children) {
    const p = m.geometry.attributes.position;
    let peor = -Infinity, piezas = 0;
    for (const [desde, cuantos] of m.geometry.userData.apoyos || []) {
      let bajo = Infinity;
      for (let i = desde; i < desde + cuantos; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); bajo = Math.min(bajo, v.y - T.altura(v.x, v.z)); }
      peor = Math.max(peor, bajo); piezas++;
    }
    ok(piezas > 0 && peor < 0.06, `${m.name}: ninguna de sus ${piezas} piezas flota (la peor arranca a ${peor.toFixed(2)} m del suelo)`);
  }
  eq(col.lista.length, 1, 'el frente de roca no se atraviesa (un segmento de choque)');
  // lejos, no se dibuja nada
  W.actualizar(1, { x: 400, y: 0, z: 400 });
  ok(grupo.children.every((m) => !m.visible), 'desde la punta del noreste (a más de 170 m de todo) no se dibuja nada');
  W.actualizar(1, { x: -260, y: 0, z: -240 });
  ok(grupo.children.filter((m) => m.visible && /juncal|hierbas/.test(m.name)).map((m) => m.name).sort().join() === 'zona-hierbas-hay,zona-juncal-hay', 'en el mallín: el juncal y las hierbas, crecidos');
  ok(!grupo.children.find((m) => m.name === 'zona-arcilla').visible, 'y la barranca de arcilla (a más de 170 m), no');
  // la E y el aviso: la misma función
  const js = (x, z) => ({ pos: { x, y: T.altura(x, z), z } });
  let a = W.accion(js(-265, -237));
  ok(a && a.texto === 'El junco se corta con una hoz de junco', `sin hoz, el aviso lo dice (${a?.texto})`);
  ok(a.gana === false, '4.6.0: sin hoz, «Anotar» una planta que mires le gana al juncal');
  a.hacer();
  ok(!progreso.materiales.junco && /hoz de junco/.test(notas.at(-1)), 'y la E no junta nada');
  progreso.cosas['hoz-junco'] = 1;
  a = W.accion(js(-265, -237));
  eq(a.texto, 'Cortar junco (3 juncos)', 'con la hoz: «Cortar junco (3 juncos)»');
  ok(a.gana === true, '4.6.0: con la hoz, el juncal le gana a «Anotar» (el helecho de al lado se comía la E)');
  a.hacer();
  ok(progreso.materiales.junco === 3 && registrados.includes('junco-mat') && registrados.includes('hoz-junco') && guardadas > 0, 'E: +3 juncos, al cuaderno el junco y la hoz, y se guarda');
  W.actualizar(1, { x: -260, y: 0, z: -240 });
  ok(grupo.children.find((m) => m.name === 'zona-juncal-ras').visible && !grupo.children.find((m) => m.name === 'zona-juncal-hay').visible, 'el juncal queda al ras');
  ok(/vuelve a crecer en 1 día/.test(W.accion(js(-265, -237)).texto), 'y el aviso dice cuándo vuelve');
  ok(W.accion(js(-265, -237)).gana === true, '4.6.0: cortado y con la hoz, sigue ganando (el aviso dice cuándo vuelve)');
  W.accion(js(-265, -237)).hacer();
  eq(progreso.materiales.junco, 3, 'el mismo día no da otra vez');
  W.accion(js(-256, -244)).hacer();
  eq(progreso.materiales.hierbas, 2, 'las hierbas, con la misma hoz: +2');
  progreso.dia = 7;
  W.actualizar(1, { x: -260, y: 0, z: -240 });
  ok(grupo.children.find((m) => m.name === 'zona-juncal-hay').visible, 'al otro día, el junco creció');
  W.accion(js(-265, -237)).hacer();
  eq(progreso.materiales.junco, 6, 'y da otros 3');
  // la veta: el pico común no; el de cantero, en tres golpes
  progreso.cosas.pico = 1;
  const frente = js(-402, -305);
  ok(/pico de cantero/.test(W.accion(frente).texto), 'con el pico común, el aviso pide el de cantero');
  progreso.cosas['pico-cantero'] = 1;
  eq(W.accion(frente).texto, 'Labrar la veta (6 piedras de cantera)', 'con el de cantero: labrar');
  W.accion(frente).hacer();
  ok(/Seguir labrando la veta \(golpe 2 de 3\)/.test(W.accion(frente).texto) && !progreso.materiales['piedra-cantera'], 'primer golpe: sigue');
  W.accion(frente).hacer(); W.accion(frente).hacer();
  ok(progreso.materiales['piedra-cantera'] === 6 && registrados.includes('piedra-cantera-mat') && registrados.includes('pico-cantero'), 'tercer golpe: +6 piedras de cantera');
  ok(xp.filter(([id]) => id === 'picapedrero').reduce((s, [, c]) => s + c, 0) === 10, 'y suma al picapedrero (1 por golpe y 8 al terminar)');
  ok(/vuelve a dar piedra en 2 días/.test(W.accion(frente).texto), 'la veta vuelve en dos días');
  // la arcilla
  progreso.cosas['pala-arcilla'] = 1;
  W.accion(js(53, 45)).hacer();
  eq(progreso.materiales.arcilla, 4, 'la barranca: +4 de arcilla');
  // el pehuén (día 7: otoño)
  const a0 = pehuenes[0];
  const alPie = js(a0.x + a0.r + 0.8, a0.z);
  eq(W.accion(alPie)?.texto, 'Juntar los piñones del pehuén (6)', 'al pie de un pehuén, en otoño');
  ok(W.accion(alPie).gana === true, '4.6.0: con piñones para dar, el pehuén le gana a «Anotar pehuén»');
  W.accion(alPie).hacer();
  ok(entradaPinon === 6 && /ya dio sus piñones/.test(W.accion(alPie).texto), '+6 piñones, y ese pehuén ya dio este otoño');
  ok(registrados.includes('pehuen') && W.accion(alPie).gana === false, '4.6.0: juntando, el pehuén queda anotado en el cuaderno; ya dado, no gana');
  // el cuero del pastor (lo da la gente): una vez por segundo se anota en el cuaderno y se refresca la barra
  progreso.materiales.cuero = 2;
  const barraAntes = barra;
  W.actualizar(1, { x: -260, y: 0, z: -240 });
  ok(registrados.includes('cuero-mat') && barra > barraAntes, 'el cuero que llega de afuera se anota y refresca la barra');
  W.reponer();
  ok(R.faltaPara(progreso.recursosZona, 'cantera', progreso.dia) === 0 && Object.keys(progreso.recursosZona.pehuenes).length === 0, 'reponer (para probar): todo vuelve a dar');
}

// ---------------------------------------------------------------- 8. el guardado
{
  ok(G.progresoNuevo().recursosZona && G.progresoNuevo().recursosZona.usos && G.progresoNuevo().recursosZona.pehuenes, 'una partida nueva arranca con todo para juntar');
  // una partida vieja (sin recursosZona, con el pico de antes): todo disponible y el pico sigue igual
  ok(G.escribirPartida('relax', 1, { modo: 'relax', dia: 9, horas: 10, cosas: { pico: 1, hacha: 1 }, materiales: { piedra: 12 }, economia: economiaNueva() }), 'se guarda una partida vieja');
  const vieja = G.leerPartida('relax', 1).progreso;
  eq(vieja.recursosZona, { usos: {}, pehuenes: {} }, 'una partida vieja arranca con todo disponible');
  ok(vieja.cosas.pico === 1 && !vieja.cosas['pico-cantero'], 'el pico de antes sigue siendo el pico común (no se vuelve de cantero)');
  // lo usado vuelve igual; lo roto se sanea
  ok(G.escribirPartida('relax', 2, { modo: 'relax', dia: 9, horas: 10, recursosZona: { usos: { cantera: 8, juncal: 9.7, raro: 3, hierbas: 'x' }, pehuenes: { '-304,27': 1, 'x,y': 2, '__proto__': 1 } } }), 'se guarda con lo usado');
  eq(G.leerPartida('relax', 2).progreso.recursosZona, { usos: { cantera: 8, juncal: 9 }, pehuenes: { '-304,27': 1 } }, 'sólo puntos que existen, días enteros y pehuenes «x,z»');
  ok(G.escribirPartida('relax', 3, { modo: 'relax', dia: 2, recursosZona: 'roto' }), 'uno roto');
  eq(G.leerPartida('relax', 3).progreso.recursosZona, { usos: {}, pehuenes: {} }, 'se vuelve nuevo');
  eq(R.sanearRecursosZona(null), { usos: {}, pehuenes: {} }, 'null: nuevo');
  ok(G.escribirPartida('desafio', 1, { modo: 'desafio', dia: 2, recursosZona: { usos: { cantera: 1 } } }), 'en el Desafío');
  ok(G.leerPartida('desafio', 1).progreso.recursosZona === undefined, 'en el Desafío no se guarda');
}

// ---------------------------------------------------------------- 9. lo enganchado en main.js (la E y el aviso, en el mismo orden)
{
  const main = leer('src/main.js');
  // (4.6.1: la E y el aviso salen de la misma tabla, src/interacciones.js)
  enOrden(['oveja', 'recursos', 'acopio'], 'la E y el aviso: después de la oveja y antes del acopio');
  { const r = que({ acciones: { recursos: true }, cerca: { acopio: true } }); ok(r.e === 'recursos' && r.avisoId === 'recursos', 'el recurso le gana al acopio, en la E y en el aviso'); }
  { const r = que({ acciones: { recursos: true }, ovejaCercana: { i: 0 } }); ok(r.e === 'oveja' && r.avisoId === 'oveja', 'y la oveja, al recurso'); }
  revisarModulo('recursos', 'recursos');
  ok(que({ acciones: { recursos: true }, js: { montado: true } }).e === 'desmontar', 'a caballo, no: bajarte');
  ok(main.includes('cacheRecursosZona = recursosZona ? recursosZona.accion(js) : null;') && /case 'recursos': return enE \? recursosZona\?\.accion\(js\) : cacheRecursosZona;/.test(main), 'el aviso usa la misma función que la E');
  ok(main.includes("if ((objetivo?.tipo === 'planta' || objetivo?.tipo === 'arbol') && recursosZona?.accion(js)?.gana) objetivo = null;"), '4.6.0: el recurso que gana anula «Anotar» en `objetivo` (lo miran la E y el aviso)');
  ok(/if \(!esDesafio\) recursosZona = crearRecursosZonaMundo\(/.test(main), 'sólo en el Relax');
  ok(/recursosZona\?\.actualizar\(dt, jugador\.estado\.pos\)/.test(main), 'se actualiza en el bucle (una vez por segundo adentro)');
  ok(/window\.__hojarasca\.__recursosZona = /.test(main), 'en ?debug=1, para probar: __recursosZona (dar, vender, reponer)');
  ok(main.includes("CLAVES_MATERIAL.push('junco', 'hierbas', 'arcilla', 'cuero', 'piedra-cantera');"), 'el acopio guarda los materiales de zona');
  ok(leer('src/prestamos.js').includes("for (const k of ['junco', 'hierbas', 'arcilla', 'cuero', 'piedra-cantera']) SIN_ABASTO.add(k);"), 'el banco no pide materiales de zona para su abastecimiento');
  const bloques = main.split('\n').filter((l) => /recursosZona|RecursosZona/.test(l));
  ok(bloques.length >= 8, `los enganches de main.js (${bloques.length} líneas)`);
  ok(!/\bthree\b|document\.|window\./.test(leer('src/recursos-zona.js').replace(/^\/\/.*$/gm, '')), 'recursos-zona.js es puro (sin three ni DOM)');
  for (const f of ['src/recursos-zona.js', 'src/recursos-zona-mundo.js']) ok(!/\r\n/.test(leer(f)), `${f}: fines de línea LF`);
}

console.log(`4.6 recursos de zona: ${n} comprobaciones OK`);
