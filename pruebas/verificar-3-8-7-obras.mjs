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
// 8. La escalera del adarve y el tablero bajado del puente levadizo tienen huella (huellasExtra): sin paredes encima.
// 9. Los portones (y las puertas de tus obras) guardan si están abiertos, también al reforzarlos y al cargar.
// 10. La red dorada se repara con semillas doradas, nunca por más de lo que costó.
// 11. El cuadro del nombre de una obra que se deshizo se cierra sin guardar.
// 12. Teñir no alcanza a través de un entrepiso.
// 13. La granja y el aviso se rehacen en el momento cuando cambian las obras (el aviso del chiquero desmontado).
// 14. El viento devuelve con la misma regla que desarmar (recuperaDeObra; decisión del usuario).
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

// ---------------------------------------------------------------- 8. la escalera del adarve y el tablero del puente
{
  const { terminar } = mundo();
  ok(terminar('adarve', 0, 0).ok, 'un adarve');
  const encima = terminar('empalizada', 0, -2.2);
  ok(!encima.ok && /superpone/.test(encima.motivo), 'no se arma una pared sobre su escalera');
  ok(terminar('empalizada', 0, -5).ok, 'más allá, sí');
  ok(terminar('puente-levadizo', 30, 0).ok, 'un puente levadizo');
  ok(terminar('foso-estacas', 30, 2.2).ok, 'el foso, bajo el tablero: el puente se tiende sobre el foso');
  const pared = terminar('muro-piedra', 30, 3.5);
  ok(!pared.ok && /superpone/.test(pared.motivo), 'una pirca donde cae el tablero, no');
  ok(terminar('muro-piedra', 60, 0).ok, 'una pirca');
  const puente = terminar('puente-levadizo', 60, -3);
  ok(!puente.ok && /superpone/.test(puente.motivo), 'ni un puente cuyo tablero cae sobre la pirca');
  ok(terminar('casilla', 90, 0).ok && !terminar('adarve', 90, 4.4).ok && terminar('adarve', 90, 7.2).ok, 'ni un adarve con la escalera metida en tu casilla');
}

// ---------------------------------------------------------------- 9. los portones guardan si están abiertos
{
  const M2 = cargar(['construccion.js', 'colisiones.js', 'puertas.js']);
  const col = M2.colisiones.crearColisiones(), escena = new M2.THREE.Scene();
  const T = { altura: () => 0, agua: () => false, normal: () => new M2.THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {} };
  const puertas = M2.puertas.crearPuertas(T, escena, col, null);
  const s = M2.construccion.crearConstruccion(T, escena, col, { arboles: [], despejar() {} }, puertas);
  s.elegir(M2.construccion.PLANO['porton-empalizada']);
  const f = s.fundar(0, 0, 0);
  s.avanzar(f.obra, { tronco: 99, tabla: 99, piedra: 99, cristal: 99 });
  const p = () => puertas.lista.find((q) => q.duenio === f.obra);
  ok(p() && p().objetivo === 0, 'el portón nace cerrado');
  puertas.accionar(p());
  ok(f.obra.datos.abierto === true, 'abierto, queda anotado en la obra');
  ok(s.reemplazarPlano(f.obra, 'porton-reforzado') && p().objetivo === 1 && p().abierta === 1, 'reforzarlo no lo cierra');
  const d = JSON.parse(JSON.stringify(f.obra.datos));
  s.destruir(f.obra);
  ok(!p(), 'derribado, se va su hoja');
  s.sincronizar([d]);
  const o2 = s.obras.find((o) => o.plano.id === 'porton-reforzado');
  ok(o2 && puertas.lista.find((q) => q.duenio === o2)?.abierta === 1, 'al cargar, sigue abierto');
  puertas.accionar(puertas.lista.find((q) => q.duenio === o2));
  ok(!('abierto' in o2.datos), 'cerrado, no se anota nada');
  ok(s.portonAbierto(o2) === false || puertas.lista.find((q) => q.duenio === o2).objetivo === 0, 'y cuenta como cerrado');
}

// ---------------------------------------------------------------- 10. la red dorada se repara con semillas doradas
{
  const DR = await import('../src/desafio-reglas.js');
  const red = C.PLANO['red-cristal'];
  eq(red.reparaCon, 'cristal');
  eq(DR.costoReparacion(red, 0, 140), { material: 'cristal', cantidad: 2 }, 'rota del todo: lo que costó, nunca más');
  eq(DR.costoReparacion(red, 120, 140), { material: 'cristal', cantidad: 1 }, 'gastada un poco: una semilla');
  eq(DR.costoReparacion(C.PLANO.empalizada, 10, 100).material, 'tronco', 'lo demás, como siempre');
  ok(leer('src/desafio.js').includes("${(c.cantidad === 1 ? NOMBRE_UNO[c.material] : NOMBRE[c.material]) || c.material}"), 'y el aviso dice «semillas doradas»');
}

// ---------------------------------------------------------------- 11. el cuadro del nombre de una obra que se deshizo
{
  const { crearColaDialogos } = await import('../src/dialogo.js');
  const vistas = [];
  const cola = crearColaDialogos({ mostrar: (d) => vistas.push(d.texto), ocultar() {}, valor: () => 'La Querencia' });
  let terminada = true;
  const otra = cola.confirmar('¿Algo antes?');
  const nombre = cola.pedirTexto('¿Cómo le vas a poner?', 'Casilla', { vigente: () => terminada });
  terminada = false;   // (deshecha mientras esperaba detrás de otra pregunta)
  cola.aceptar();
  ok(await otra === true && await nombre === null && vistas.length === 1, 'esperando, se cierra sola sin mostrarse');
  terminada = true;
  const n2 = cola.pedirTexto('¿Cómo le vas a poner?', 'Casilla', { vigente: () => terminada });
  ok(cola.abierto() && cola.revisar() === false, 'abierta y vigente, sigue');
  terminada = false;
  ok(cola.revisar() === true && await n2 === null && !cola.abierto(), 'abierta y deshecha, se cierra sin guardar');
  const main = leer('src/main.js');
  ok(main.includes("{ max: 28, vigente });\n  if (puesto === null || !vigente()) return;"), 'pedirNombre lo usa');
  ok(main.includes('dialogos.revisar?.();   // 3.8.7'), 'y deshacer una etapa lo revisa');
}

// ---------------------------------------------------------------- 12. teñir, no a través de un entrepiso
{
  const { s, terminar } = mundo();
  terminar('piso-modular', 0, 0);
  const pared = terminar('pared-modular', 0, -1.42, 0, 0.285);
  for (const [x, z, r] of [[0, 1.42, 0], [1.42, 0, Math.PI / 2], [-1.42, 0, Math.PI / 2]]) terminar('pared-modular', x, z, r, 0.285);
  const entre = terminar('entrepiso-modular', 0, 0, 0, 0.285);
  ok(pared.ok && entre.ok, 'una planta baja con entrepiso');
  const abajo = s.tenibleCerca({ x: 0, y: 0.285, z: -0.6 }, 4);
  ok(abajo && abajo !== entre.o, 'desde abajo se tiñe la pared de abajo');
  const arriba = s.tenibleCerca({ x: 0, y: entre.o.datos.y + 0.285, z: -0.6 }, 4);
  ok(arriba !== pared.o && !(arriba && arriba.datos.y < entre.o.datos.y - 0.5), `desde el entrepiso, no la de abajo (${arriba?.plano.id})`);
}

// ---------------------------------------------------------------- 13. la granja se rehace al cambiar sus obras
{
  const g = leer('src/granja-juego.js');
  ok(g.includes('const vigente = () => (cache && cache.firma === firmaGranja() ? cache : refrescar());'), 'la granja mira la firma de sus obras');
  ok(!/cache \|\| refrescar\(\)/.test(g), 'y no usa lo de hace medio segundo');
  ok(g.includes("if (reloj <= 0 || !cache || cache.firma !== firmaGranja())"), 'también en el cuadro');
  // y el aviso de main.js (que se recalcula cada tanto) se rehace en cuanto cambia una obra
  const { s, terminar } = mundo();
  const v0 = s.version, c = terminar('cantero', 0, 0);
  ok(s.version > v0, 'armar sube la versión de las obras');
  const v1 = s.version; s.desmontarCerca({ x: 0, y: 0, z: 0 }, 2);
  ok(s.version > v1, 'desmontar también');
  ok(leer('src/main.js').includes('const cambioObras = !!obras && obras.version !== versionObrasInteraccion;'), 'main.js rehace el aviso al cambiar las obras');
}

// ---------------------------------------------------------------- 14. el viento devuelve como desarmar (decisión del usuario)
{
  const { s, terminar } = mundo();
  const seto = terminar('seto', 0, 0);
  const plano = (x) => JSON.parse(JSON.stringify(x));   // (lo de la vm tiene otro Object)
  eq(plano(s.recuperaDeObra(seto.o)), Object.fromEntries(Object.entries(C.PLANO.seto.etapas[0].pide).filter(([, n]) => n > 1).map(([k, n]) => [k, Math.floor(n / 2)])), 'lo que costaba 1 no vuelve');
  const { crearEventosValleUi } = await import('../src/eventos-valle-ui.js');
  const tendal = terminar('tendal', 20, 0);
  const lista = [tendal.o], sumado = {};
  const ui = crearEventosValleUi({
    progreso: () => ({ dia: 3, horas: 10, materiales: {}, cosas: {}, eventosValle: null }), extra: () => ({}),
    obras: () => ({ obras: lista, bajoCubierta: () => null, destruir: (o) => [o], recuperaDeObra: s.recuperaDeObra }),
    sumarMaterial: (k, n) => { sumado[k] = (sumado[k] || 0) + n; }, sincronizarObras: () => {}, devolverContenido: () => null,
  }, { mostrar() {}, cerrar() {}, abierta: () => false });
  ok(ui.voltear()?.nombre, 'el viento voltea el tendal');
  eq(sumado, plano(s.recuperaDeObra(tendal.o)), 'y devuelve lo mismo que desarmarlo');
  ok(Object.keys(sumado).length > 0, `(el tendal devuelve algo: ${JSON.stringify(sumado)})`);
  ok(leer('src/eventos-valle-ui.js').includes('for (const c of caidas) obras.recuperaDeObra(c, recupera);'), 'con la misma función');
}

console.log(`verificar-3-8-7-obras: ${pasos} comprobaciones OK`);
