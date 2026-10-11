// 3.8.7 (obras): el pase de bugs de la construcción, las estructuras y las máquinas. Una comprobación por arreglo.
// construccion.js se carga de verdad (con el three local, en una vm, como verificar-construccion-ultra-rc10) sobre un
// terreno plano de mentira y las colisiones reales; lo que depende del mundo 3D lo prueba humo-3-8-7-obras.cjs.
// 1. Lo que pisa una plataforma de otra obra (la mesa en el piso de la casilla, la silla en el techo plano) cuenta como
//    apoyado: deshacer el piso de la casilla, desmontar o mover el techo lo dejaba flotando.
// 2. Mover una pieza con Shift+Y despeja el lugar nuevo, como al armarla (el árbol le quedaba atravesado).
// 3. La obra que se mueve con Shift+Y no está: no tapa la lluvia ni da fuego, no muele ni cocina, el cable de la
//    tirolesa no va hacia ella y en el Desafío no tira, ni frena ni se dispara. Y el fuego de una obra que ya no está
//    (desmontada, movida, volteada) se apaga. La firma de los techos mira el giro y la altura.
// 4. Lo reforzado (portón con tranca, empalizada reforzada, muro almenado) no se funda de cero; X repite la de antes.
// 5. Desarmar una pieza del fortín devuelve lo cargado; los abrojos no se reparan; el cimiento sigue al giro.
// 6. Máquinas: «Echaste una haba», la radio sin «Estática: «Estática…»» y el pronóstico con la nevada y el temporal.
// 7. El acopio: una marca sin hacer no retiene lo guardado, y al cargar sin acopio armado lo guardado vuelve.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };

// ---------------------------------------------------------------- cargar src/ con el three local en una vm
function cargar(raices) {
  const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
  const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
  const info = new Map(), orden = [], visitando = new Set(), vistos = new Set();
  const visitar = (archivo) => {
    archivo = path.resolve(archivo);
    if (vistos.has(archivo) || visitando.has(archivo)) return;
    visitando.add(archivo);
    const texto = fs.readFileSync(archivo, 'utf8'), deps = [];
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(normalizar(archivo, m[2]));
    info.set(archivo, texto);
    for (const d of deps) visitar(d);
    visitando.delete(archivo); vistos.add(archivo); orden.push(archivo);
  };
  for (const r of raices) visitar(path.join(raiz, 'src', r));
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
  let code = leer('three-r186-inline.js') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += `\n;globalThis.__M={THREE,${orden.map((f) => `${path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_')}:${idModulo(f)}`).join(',')}};\n`;
  const ctx = { console, Math, Float32Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Date, performance: { now: () => 0 } };
  ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(code, ctx, { timeout: 30000 });
  return ctx.__M;
}
const M = cargar(['construccion.js', 'colisiones.js']);
const { THREE } = M, C = M.construccion;
function mundo(extraT = {}, veg = { arboles: [], despejar() {} }) {
  const col = M.colisiones.crearColisiones();
  const T = { altura: () => 0, agua: () => false, normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {}, ...extraT };
  const s = C.crearConstruccion(T, new THREE.Scene(), col, veg, { agregar() {}, agregarPostigos() {}, eliminarPorDuenio() {} });
  const mats = { tronco: 999, tabla: 999, piedra: 999, lana: 999, cuero: 999, hierro: 999 };
  const terminar = (id, x, z, yaw = 0, y = null) => {
    s.elegir(C.PLANO[id]);
    const f = s.fundar(x, z, yaw, y);
    if (!f.ok) return f;
    while (f.obra.datos.etapas < f.obra.plano.etapas.length) { const r = s.avanzar(f.obra, mats); if (!r.ok) return r; }
    return { ok: true, o: f.obra };
  };
  return { s, col, T, terminar, mats };
}

// ---------------------------------------------------------------- 1. lo apoyado en una plataforma de otra obra
{
  const { s, col, terminar } = mundo();
  const casilla = terminar('casilla', 0, 0);
  const mesa = terminar('mesa-campo', 0.3, 0.3, 0, 0.62);
  ok(casilla.ok && mesa.ok && mesa.o.datos.y > 0.5, 'la mesa va sobre el piso de la casilla');
  ok(s.deshacerEtapa({ x: 0, y: 0, z: 0 }, 6).ok, 'el techo se deshace con la mesa adentro');
  ok(s.deshacerEtapa({ x: 0, y: 0, z: 0 }, 6).ok, 'las paredes también');
  const piso = s.deshacerEtapa({ x: 0, y: 0, z: 0 }, 6);
  ok(!piso.ok && /apoyada/.test(piso.motivo), 'el piso no: la mesa queda en el aire');
  eq(casilla.o.datos.etapas, 2, 'y la casilla queda como estaba');
  ok(col.plataformaEn(0.3, 0.3, 1, 0.5)?.duenio === casilla.o, 'con su piso');
  ok(s.desmontarCerca({ x: 0.3, y: 0.62, z: 0.3 }, 1).ok, 'sacada la mesa');
  ok(s.deshacerEtapa({ x: 0, y: 0, z: 0 }, 6).ok, 'el piso se deshace');

  terminar('piso-modular', 20, 0);
  const techo = terminar('techo-plano', 20, 0);
  const silla = terminar('silla-campo', 20.5, 0.5, 0, 2.6);
  ok(techo.ok && silla.ok && silla.o.datos.y > 2.5, 'una silla sobre el techo plano');
  const sacar = s.desmontarCerca({ x: 20, y: 2.5, z: 0 }, 0.3);
  ok(!sacar.ok && /apoyada/.test(sacar.motivo), 'el techo con la silla encima no se desmonta');
  s.elegir(C.PLANO['techo-plano']);
  const mover = s.iniciarEdicionCerca({ x: 20, y: 2.5, z: 0 }, 0.3);
  ok(!mover.ok && /apoyada/.test(mover.motivo), 'ni se mueve');
  const caidas = s.destruir(techo.o);
  ok(caidas.includes(silla.o), 'y si se cae (el viento, los duendes), la silla cae con él');
}

// ---------------------------------------------------------------- 2. Shift+Y despeja el lugar nuevo
{
  const despejados = [];
  const { s, terminar } = mundo({}, { arboles: [], despejar: (x, z, r) => { despejados.push({ x, z, r }); return 0; } });
  const cantero = terminar('cantero', 0, 0);
  ok(cantero.ok && despejados.length === 1, 'armar el cantero despeja su lugar');
  s.elegir(C.PLANO.cantero);
  ok(s.iniciarEdicionCerca({ x: 0, y: 0, z: 0 }, 2).ok, 'se agarra con Shift+Y');
  const r = s.confirmarEdicion(10, 4, 0);
  ok(r.ok, 'y se deja en otro lado');
  ok(despejados.some((d) => Math.hypot(d.x - cantero.o.datos.x, d.z - cantero.o.datos.z) < 0.01 && d.x > 5), 'el lugar nuevo queda despejado');
}

// ---------------------------------------------------------------- 3. la que se mueve no está
{
  const { s, terminar } = mundo();
  const alero = terminar('alero', 0, 0);
  ok(alero.ok && s.cubiertasLluvia({ x: 0, z: 0 }).length === 1, 'el alero tapa la lluvia');
  ok(!!s.bajoCubierta({ x: 0, y: 0.2, z: 0 }), 'y abajo se está bajo techo');
  const f0 = s.firmaCubiertas();
  s.elegir(C.PLANO.alero);
  ok(s.iniciarEdicionCerca({ x: 0, y: 0, z: 0 }, 3).ok, 'agarrado con Shift+Y');
  ok(s.cubiertasLluvia({ x: 0, z: 0 }).length === 0 && !s.bajoCubierta({ x: 0, y: 0.2, z: 0 }), 'mientras se mueve no tapa');
  ok(s.firmaCubiertas().toFixed(3) !== f0.toFixed(3), 'y el mapa de la lluvia se rehace');
  s.cancelarEdicion();
  ok(s.firmaCubiertas().toFixed(3) === f0.toFixed(3) && s.cubiertasLluvia({ x: 0, z: 0 }).length === 1, 'cancelado, vuelve a tapar');
  alero.o.datos.rot = Math.PI / 4;
  ok(s.firmaCubiertas().toFixed(3) !== f0.toFixed(3), 'girado en el mismo lugar, la firma cambia');
  const main = leer('src/main.js'), clima = leer('src/clima.js');
  ok(/const obrasTerminadas = \(id\) => .*o !== obras\.editando\);/.test(main), 'las máquinas, sin la que se mueve');
  ok(/if \(!o\.plano\.fuego \|\| o\.datos\.etapas < o\.plano\.etapas\.length \|\| o === obras\.editando\) continue;/.test(main), 'F no prende la estufa que se mueve');
  ok(main.includes('clima.encenderFogata(propio.datos.x, y, propio.datos.z, 900, { contenida, duenio: propio });'), 'el fuego sabe de qué obra es');
  ok(main.includes('if (clima.fogata.duenio && obras && (clima.fogata.duenio === obras.editando || !obras.obras.includes(clima.fogata.duenio))) clima.apagarFogata();'), 'y se apaga sin ella');
  ok(/function apagarFogata\(\) \{\n    fogata\.activa = false;/.test(clima), 'apagarFogata');
  ok(leer('src/tirolesa.js').includes('o.datos.etapas >= o.plano.etapas.length && o !== O.editando); };'), 'la tirolesa y el puente, sin la punta que se mueve');
  ok(leer('src/cocina-juego.js').includes('obraTerminada(o) && o !== ctx.obras?.()?.editando;'), 'la cocina, sin la estación que se mueve');
  ok(leer('src/cocina-mundo.js').includes("o.plano.id === 'alacena' && o.datos.etapas >= o.plano.etapas.length && o !== O.editando"), 'ni la alacena');
  ok(leer('src/desafio.js').includes('function completa(o) { return o.datos.etapas > 0 && o !== obras.editando; }'), 'el Desafío, sin la defensa que se mueve');
  ok(leer('src/desafio-defensas.js').includes('const completa = (o) => o.datos.etapas > 0 && o !== obras.editando;'), 'ídem las defensas activas');
  ok(leer('src/desafio-fortin-mundo.js').includes('const completa = (o) => o.datos.etapas >= o.plano.etapas.length && o !== obras.editando;'), 'ídem el fortín');
}

// ---------------------------------------------------------------- 4. lo reforzado no se funda
{
  const { s, terminar } = mundo();
  for (const id of ['porton-reforzado', 'empalizada-reforzada', 'muro-almenado']) {
    const p = C.PLANO[id];
    ok(p.soloMejora && Object.hasOwn(C.PLANO, p.mejoraDe), id + ' sabe de qué sale');
    s.elegir(p);
    const r = s.fundar(30, 0, 0);
    ok(!r.ok && /reforzando/.test(r.motivo), id + ' no se funda de cero');
  }
  const emp = terminar('empalizada', 0, 0);
  ok(emp.ok && s.reemplazarPlano(emp.o, 'empalizada-reforzada'), 'se refuerza');
  const x = s.copiarCerca({ x: 0, y: 0, z: 0 }, 3);
  ok(x.ok && x.plano.id === 'empalizada' && s.plano.id === 'empalizada', 'X repite la empalizada de antes');
  s.elegir(C.PLANO['empalizada-reforzada']);
  ok(s.iniciarEdicionCerca({ x: 0, y: 0, z: 0 }, 3).ok, 'la reforzada se mueve con Shift+Y');
  ok(s.confirmarEdicion(6, 0, 0).ok, 'y se deja en otro lado');
}

// ---------------------------------------------------------------- 5. el fortín
{
  const F = await import('../src/desafio-fortin.js');
  eq(F.contenidoFortin({ troncos: 2 }), { tronco: 2, piedra: 0 }, 'la rampa devuelve sus troncos');
  eq(F.contenidoFortin({ zanja: { lena: 2 } }), { tronco: 2, piedra: 0 }, 'la zanja, su leña');
  eq(F.contenidoFortin({ resina: 2 }), { tronco: 1, piedra: 0 }, 'la resina entera, su tronco');
  eq(F.contenidoFortin({ resina: 1 }), { tronco: 0, piedra: 0 }, 'empezada, nada');
  eq(F.contenidoFortin({ piedras: 10 }), { tronco: 0, piedra: 6 }, 'la catapulta, lo que pasa de las 4 de regalo');
  eq(F.contenidoFortin({ piedras: 3 }), { tronco: 0, piedra: 0 }, 'las de regalo no');
  eq(F.contenidoFortin({ troncos: 'x', piedras: NaN, resina: -4 }), { tronco: 0, piedra: 0 }, 'lo roto no da nada');
  eq(F.contenidoFortin(null), { tronco: 0, piedra: 0 });
  ok(leer('src/main.js').includes("{ const f = contenidoFortin(d); if (f.tronco) sumarMaterial('tronco', f.tronco); if (f.piedra) sumarMaterial('piedra', f.piedra); }"), 'devolverContenido lo usa');
  ok(leer('src/desafio.js').includes("if (o.plano.defensa?.tipo === 'abrojos') continue;"), 'los abrojos no se reparan');
  ok(leer('src/desafio-cimiento.js').includes('(o.datos.rot || 0).toFixed(2)},${o.plano?.id}'), 'el cimiento mira el giro y el plano');
}

// ---------------------------------------------------------------- 6. las máquinas
{
  const R = await import('../src/radio.js');
  const r = R.sanearRadio({});
  const a = R.escucharRadio(r, { dia: 5, horas: 12, pronostico: [], noches: [] });
  const b = R.escucharRadio(r, { dia: 5, horas: 13, pronostico: [], noches: [] });
  ok(b.repetido && b.de === a.de && b.texto === a.texto, 'la radio repite lo mismo');
  eq(R.sanearRadio({ ultimo: { de: 'Estática', texto: 'Estática.' } }).ultimo, { de: null, texto: 'Estática.' }, 'la de una partida vieja, sin «Estática:»');
  eq(R.sanearRadio({ ultimo: { de: null, texto: 'x' } }).ultimo, { de: null, texto: 'x' }, 'null se guarda');
  ok(leer('src/main.js').includes("nota(`Echaste ${r.habas === 1 ? 'una haba' : `${r.habas} habas`} a la muela`,"), '«Echaste una haba»');
  const Me = await import('../src/meteo.js');
  const d = Me.pronosticoDia(4242, 9, { estacion: 'verano', modo: 'despejado', tipo: () => 'lluvia', viento: () => 0.5 });
  ok(d.lluvia && /viento fuerte/.test(d.texto), `el pronóstico usa el programa de la partida («${d.texto}»)`);
  ok(leer('src/main.js').includes('tipo: programaTramos.tipo, viento: programaTramos.viento });'), 'y main.js se lo pasa');
}

// ---------------------------------------------------------------- 7. el acopio
{
  const main = leer('src/main.js');
  const i = main.indexOf('function vaciarUltimoAcopio(a = null) {'), codigo = main.slice(i, main.indexOf('\n}', i) + 2);
  const ctx = { obras: { obras: [] }, progreso: { acopio: { tronco: 3 } }, CLAVES_MATERIAL: ['tronco'], sumados: {}, cantidadMaterial: (n) => `${n} troncos` };
  vm.createContext(ctx);
  vm.runInContext(`function acopio() { return progreso.acopio; } function sumarMaterial(k, n) { sumados[k] = (sumados[k] || 0) + n; } ${codigo} this.f = vaciarUltimoAcopio;`, ctx);
  ctx.obras.obras = [{ plano: { funciones: ['acopio'], etapas: [{}] }, datos: { etapas: 0 } }];
  eq(ctx.f(), '3 troncos', 'una marca de acopio sin hacer no retiene lo guardado');
  ok(main.includes("else { const v = vaciarUltimoAcopio(); if (v) setTimeout(() => nota('Lo del acopio volvió a tus cosas'"), 'y al cargar sin acopio armado, vuelve');
}

console.log(`verificar-3-8-7-obras: ${pasos} comprobaciones OK`);
