// 3.6.2 (juego): lo que quedó pendiente de la 3.6.0 y la 3.6.1. Sólo Node. Una sección por punto:
//  1. Lo tuyo que quedó donde ahora está la aldea (obras, renovales, la carpa de una partida de antes de la
//     3.6): se muda al lugar libre más cercano con sus datos, o se desarma devolviendo todo, con una nota.
//     (La partida real fabricada: humo-3-6-2-desalojo.cjs.)
//  2. El clic en las listas del HUD (el almacén, la feria, las cargas, la barra, la mochila, el taller) no
//     llegaba: el #hud no recibe el mouse. Ahora cada lista lo pide, elige con mousedown y no sigue de largo.
//  3. Árboles despejados (junto al galpón, la cueva, las estaciones) que chocaban sin verse.
//  4. Sentado en el refugio con un libro prestado, la visita en tu mesa gana (como antes de la 3.6).
//  5. El reloj de estar sentado: lo frenan los cuentos del domingo, la música del baile y tu charla; no
//     cualquier charla de vecinos que se oye.
//  6. El mapa: las calles y los edificios de la aldea (sólo en el Relax), sin bosque encima, y las marcas
//     automáticas sin encimarse.
//  7. Nadie pasa más del 10 % de su horario caminando (el jefe de estación, casi la mitad).
// (La partida real que acompaña los puntos 2 a 6: humo-3-6-2-juego.cjs.)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, m) => { assert.ok(c, m); pasos++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); pasos++; };
const main = leer('src/main.js');
const tramo = (texto, desde, hasta) => { const i = texto.indexOf(desde); assert.ok(i >= 0, `no está: ${desde}`); const j = texto.indexOf(hasta, i + desde.length); return texto.slice(i, j < 0 ? undefined : j); };

// ============================================================ 1. lo tuyo que quedó en la aldea
{
  const D = await import('../src/aldea-desalojo.js');
  // los grupos: una casa de piezas que toca la aldea va entera (aunque una pieza quede afuera); lo suelto, solo
  const lista = [
    { id: 'piso', x: 0, z: 0 }, { id: 'pared', x: 1.5, z: 0 }, { id: 'techo', x: 3.2, z: 0 },   // se tocan en cadena
    { id: 'cantero', x: 30, z: 0 },                                                              // suelto, adentro
    { id: 'lejos', x: 200, z: 0 },                                                               // afuera, solo
    { id: 'pegado', x: 202, z: 0 },                                                              // afuera, pegado a otro de afuera
  ];
  const radio = () => 1;
  const adentro = (d) => d.x < 2 || d.id === 'cantero';
  const grupos = D.gruposDeObras(lista, radio, adentro);
  eq(grupos, [[0, 1, 2], [3]], 'la casa entera (también el techo, que estaba afuera) y el cantero solo; lo de afuera no');
  // el lugar: el más cercano que esté libre, probando primero hacia afuera
  const l = D.buscarLugar((dx, dz) => Math.hypot(dx - 20, dz) < 4);
  ok(l && Math.hypot(l.dx - 20, l.dz) < 4 && l.r <= 18, `el más cercano (${l?.r} m)`);
  const afuera = D.buscarLugar((dx, dz) => dx > 0, { haciaAfuera: Math.PI / 2 });
  ok(afuera.r === D.DESALOJO.paso && afuera.dx > 2.9, 'a igual distancia, primero hacia afuera');
  ok(D.buscarLugar(() => false) === null, 'si no hay lugar, null (y se desarma)');
  // lo que se devuelve: todo lo que costó hasta donde llegó (no la mitad de desmontar)
  const plano = { etapas: [{ pide: { tronco: 4, tabla: 2 } }, { pide: { tabla: 6, piedra: 1 } }, { pide: { piedra: 3 } }] };
  eq(D.materialesDeObra({ etapas: 2 }, plano), { tronco: 4, tabla: 8, piedra: 1 }, 'las etapas hechas, enteras');
  eq(D.materialesDeObra({ etapas: 'x' }, plano), {}, 'un dato roto no devuelve nada raro');
  eq(D.materialesDeObra({ etapas: 99 }, plano), { tronco: 4, tabla: 8, piedra: 4 }, 'ni más de lo que tiene');
  eq(D.sumarMateriales({ tabla: 1 }, { tabla: 2, piedra: 3 }), { tabla: 3, piedra: 3 });
  ok(D.devolucionDeRenoval('pehuen') === 'plantin-pehuen' && D.devolucionDeRenoval('coihue') === 'plantin-coihue' && D.devolucionDeRenoval('raro') === 'plantin-coihue', 'el renoval vuelve como plantín');
  // la nota (una sola), con el texto exacto
  eq(D.textoDesalojo({ obras: { mudadas: 0, desarmadas: 0 }, renovales: { mudados: 0, devueltos: 0 }, carpa: null, materiales: {} }), null, 'sin nada que mudar, sin nota');
  eq(D.textoDesalojo({ obras: { mudadas: 1 } }), { titulo: 'La Aldea de los Duendes ocupó tu lugar', sub: '1 obra se mudó afuera del pueblo, a lo más cerca que había' });
  eq(D.textoDesalojo({ obras: { mudadas: 6, desarmadas: 1 }, renovales: { mudados: 1 }, carpa: 'mudada', materiales: { tabla: 8, tronco: 4 } }).sub,
    '6 obras, 1 renoval y la carpa se mudaron afuera del pueblo, a lo más cerca que había. 1 obra no entraba en ningún lado: tenés en la mochila 8 tablas y 4 troncos');
  eq(D.textoDesalojo({ renovales: { devueltos: 2 }, carpa: 'levantada', materiales: {} }).sub, '2 renovales y la carpa no entraban en ningún lado: tenés en la mochila 2 plantines');
  eq(D.textoDesalojo({ carpa: 'levantada' }).sub, 'La carpa no entraba en ningún lado: la levantaste');
  // main.js: al cargar, en el lugar de los sincronizar de siempre (sólo en el Relax: T.sinObras)
  const carga = tramo(main, '  renovales = crearRenovales(T, escena, col);', '  matasHuerta = crearMatasHuerta(escena);');
  ok(carga.includes('progreso.renovales = desalojarRenovales(progreso.renovales);') && !carga.includes('renovales.sincronizar(progreso.renovales);'), 'los renovales pasan por el desalojo');
  ok(carga.includes('desalojarObras(progreso.obras || []);') && !carga.includes('obras.sincronizar(progreso.obras);'), 'las obras también');
  ok(carga.includes('desalojarCarpa();') && carga.includes('avisoDesalojo = textoDesalojo(desalojo);'), 'y la carpa; una nota');
  ok(carga.indexOf('desalojarCarpa();') < main.indexOf('  ponerCarpa();\n  if (progreso.pos)'), 'la carpa se muda antes de armarla');
  const fn = tramo(main, 'function desalojarObras(lista) {', 'function desalojarCarpa() {');
  ok(fn.includes("if (typeof T.sinObras !== 'function') { obras.sincronizar(lista); return; }"), 'en el Desafío (sin aldea), como siempre');
  ok(fn.includes('obras.revisarSitio(') && fn.includes('T.sinObras(d.x + dx, d.z + dz, radio(d))'), 'el lugar se revisa como si lo pusieras vos, y afuera de la aldea');
  ok(fn.includes('mudarDatosDeObra(o, a.x, a.z)'), 'con sus datos (lo sembrado, los huevos)');
  ok(fn.includes('sumarMateriales(desalojo.materiales, materialesDeObra(d, PLANO[d.plano])); devolverContenido(d);'), 'si no entra: todo lo que costó y lo que tenía adentro');
  ok(main.includes('if (desalojo.materiales) for (const [k, n] of Object.entries(desalojo.materiales)) if (n > 0) sumarMaterial(k, n);'), 'a la mochila');
  ok(main.includes("if (avisoDesalojo) { const a = avisoDesalojo; avisoDesalojo = null; setTimeout(() => nota(a.titulo, a.sub, true), 2600); }"), 'la nota sale al entrar, una vez');
  ok(fs.existsSync(path.join(raiz, 'pruebas/humo-3-6-2-desalojo.cjs')), 'la partida real fabricada');
}

// ============================================================ 2. el clic en las listas del HUD
{
  const plantilla = leer('src/plantilla.html'), comercio = leer('src/comercio-mundo.js'), desafio = leer('src/desafio.js');
  ok(/#hud \{ position: fixed; inset: 0; pointer-events: none; \}/.test(plantilla), 'el #hud sigue sin recibir el mouse (no tapa el juego)');
  ok(plantilla.includes('#hud .barra .ranura, #hud .trueque li, #hud .trueque button, #hud .mochila .cosa, #hud .mochila button { pointer-events: auto; }'), 'las listas sí: la barra, el almacén, la feria, las cargas, el taller y la mochila');
  ok(/\.obra \{[^}]*pointer-events: auto;/.test(plantilla) && /\.charla-opciones li \{[^}]*pointer-events: auto;/.test(plantilla), 'el panel de obra y el menú de la charla ya lo tenían');
  // con mousedown (como el menú de la charla en la 3.6.1): el click no llegaba, y el clic seguía al juego
  ok(main.includes("function alClicHud(el, fn) {\n  el.addEventListener('mousedown', (ev) => { if (ev.button !== 0) return; ev.preventDefault(); ev.stopPropagation(); fn(); });"), 'alClicHud: mousedown, sin seguir de largo');
  ok(main.includes('alClicHud(li, () => cambiar(i));') && main.includes('alClicHud(li, () => cambiarFeria(i));') && main.includes('alClicHud(d, asignar);'), 'el almacén, la feria y la mochila');
  ok(comercio.includes("li.addEventListener('mousedown', (ev) => { if (ev.button !== 0) return; ev.preventDefault(); ev.stopPropagation(); elegir(i); });"), 'las cargas');
  ok(main.includes("d.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); elegirRanura(i); });") && desafio.includes("li.addEventListener('mousedown', (ev) => { ev.preventDefault(); ev.stopPropagation(); fabricar(i); });"), 'la barra y el taller ya usaban mousedown');
  ok(!/addEventListener\('click', \(\) => (cambiar|cambiarFeria|elegir)\(i\)\)/.test(main + comercio), 'ya no queda ninguna lista con click');
  // con el mouse bloqueado (sin flecha), el clic con un panel abierto no tira la línea ni ataca
  ok(main.includes('const panelDelHudAbierto = () => enElAlmacen || enLaFeria || enLasCargas() || mochilaAbierta || !!desafio?.tallerAbierto;'), 'qué paneles cuentan');
  const pesca = tramo(main, "document.addEventListener('mousedown', (e) => {\n  if (e.button !== 0 || modo !== 'jugando' || !jugador", 'pesca.clic(true, mundoPesca());');
  ok(pesca.includes('if (panelDelHudAbierto()) return;   // 3.6.2'), 'la línea de pesca');
  const arma = tramo(main, "window.addEventListener('mousedown', (e) => {\n  if (e.button !== 0 || !desafio", 'desafio.atacar(id);');
  ok(arma.includes('if (panelDelHudAbierto()) return;'), 'el arma del Desafío');
  ok(main.includes("$('btn-personalizar-mochila').addEventListener('mousedown', (ev) => ev.stopPropagation());"), 'el botón de la mochila');
}

// ============================================================ 3. lo despejado no choca
// (el bosque armado en Node, como verificar-3-3-bosque y verificar-3-6-1-juego)
{
  const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
  const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
  const info = new Map(), orden = [], visitados = new Set();
  const visitar = (archivo) => {
    archivo = path.resolve(archivo);
    if (visitados.has(archivo)) return;
    visitados.add(archivo);
    const texto = fs.readFileSync(archivo, 'utf8');
    const deps = [];
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(normalizar(archivo, m[2]));
    info.set(archivo, texto);
    for (const d of deps) visitar(d);
    orden.push(archivo);
  };
  const transformar = (archivo, texto) => {
    const ex = [];
    for (const m of texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) ex.push(m[1]);
    texto = texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    texto = texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_t, nombres, spec) => {
      const partes = nombres.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); });
      return `const { ${partes.join(', ')} } = ${idModulo(normalizar(archivo, spec))};`;
    });
    texto = texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
    return `const ${idModulo(archivo)}=(()=>{\n${texto}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  for (const f of ['terreno.js', 'vegetacion.js', 'config.js', 'colisiones.js']) visitar(path.join(src, f));
  let codigo = leer('three-r186-inline.js') + '\n';
  for (const f of orden) codigo += transformar(f, info.get(f)) + '\n';
  codigo += `
globalThis.__R = (() => {
  const T = __mod_terreno.generarTerreno();
  const veg = __mod_vegetacion.generarVegetacion(T, __mod_config.CALIDADES.muybaja, new THREE.Scene());
  const col = __mod_colisiones.crearColisiones();
  veg.colisiones.forEach((c) => col.agregar(c));
  return { T, veg, col };
})();`;
  const noop = () => {};
  const ctx2d = new Proxy({ measureText: (t) => ({ width: String(t).length * 20 }), createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }), getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }, { get: (t, p) => (p in t ? t[p] : noop), set: (t, p, v) => { t[p] = v; return true; } });
  const contexto = { console, Math, Float32Array, Float64Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Date, Symbol, Proxy, Reflect, JSON, Number, String, Array, Object, Error, TypeError, RangeError, Promise, Infinity, NaN, isFinite, isNaN, parseInt, parseFloat,
    performance: { now: () => 0 }, document: { createElement: (tag) => (tag === 'canvas' ? { width: 1, height: 1, getContext: () => ctx2d } : {}) }, self: {}, window: {} };
  contexto.globalThis = contexto;
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto, { filename: 'bosque-3-6-2.js' });
  const { T, veg, col } = contexto.__R;
  const empuja = (x, z) => { const p = { x: x + 0.05, y: T.altura(x, z), z }; col.resolver(p, 0.35, 1.65); return Math.hypot(p.x - x - 0.05, p.z - z) > 0.01; };
  const libres = veg.arboles.filter((a) => !a.sacado && a.choque && !empuja(a.x + a.choque.r + 2, a.z));   // (sin nada más al lado)
  const arboles = veg.arboles.length;
  // en pie, frena
  const a = libres[25];
  ok(empuja(a.x, a.z), 'un árbol en pie frena');
  // despejado por una construcción (el galpón, la cueva, una estación): se va, y su choque también
  veg.despejar(a.x, a.z, 0.2, false);
  ok(a.sacado && a.choque.apagado && a.choque.despejado, 'despejar lo marca');
  ok(!empuja(a.x, a.z), 'y ya no frena (antes: un árbol invisible)');
  // talado: queda el tocón, que frena
  const b = libres[60];
  ok(veg.talar(b, { x: 1, z: 0 }) && b.choque.apagado && !b.choque.despejado && empuja(b.x, b.z), 'un talado deja su tocón, que sí frena');
  // talado y después despejado (una obra encima del tocón): el tocón sigue (no se borra lo que se ve)
  veg.despejar(b.x, b.z, 0.2, false);
  ok(!b.choque.despejado && empuja(b.x, b.z), 'un tocón con una obra encima sigue ahí');
  ok(veg.arboles.length === arboles, 'la lista de árboles no cambia (los talados guardados usan índices)');
  // el código: colisiones.js mira `despejado` (en general, no sólo en la aldea), y lo de los invasores también
  const colisiones = leer('src/colisiones.js'), vegetacion = leer('src/vegetacion.js');
  ok(/o\.__pasada = marca;\n(?:\s*\/\/[^\n]*\n)*\s*if \(o\.despejado\) continue;/.test(colisiones), 'colisiones.js');
  ok(vegetacion.includes('if (e.choque) { e.choque.apagado = true; e.choque.despejado = true; }'), 'vegetacion.js');
  ok(leer('src/desafio.js').includes('o.seg || o.duenio || o.dinamico || o.despejado ||') && leer('src/desafio-fortin-mundo.js').includes('if (c.duenio || c.despejado ||'), 'ni para esconderse ni para los troncos colgantes');
}

// ============================================================ 4. la visita en tu mesa gana
{
  const MC = await import('../src/aldea-mecanicas.js');
  ok(!MC.lugarTapaVecino('libro-prestado'), 'el libro prestado no tapa a la visita');
  ok(['libro', 'prestamo', 'estufa', 'casillas', 'horario', 'mapa', 'camilla'].every((t) => MC.lugarTapaVecino(t)), 'lo demás del lugar, sí (hay que mirarlo de frente)');
  ok(!MC.lugarTapaVecino(undefined) && !MC.lugarTapaVecino('cualquiera'), 'sin mecánica, nada');
  ok(MC.MECANICAS_EN_LA_CHARLA.includes('libro-prestado') && ['prestamo', 'casillas', 'horario', 'mapa', 'camilla'].every((t) => MC.MECANICAS_EN_LA_CHARLA.includes(t)), 'leer queda en el menú de la charla');
  ok(main.includes('lugarTapaVecino(mecanicasAldea?.accion(js)?.tipo))) vecino = gente.cerca(js, camara, true);'), 'main.js: el vecino de frente sólo si lo del lugar tapa');
  ok(main.includes('if (m && MECANICAS_EN_LA_CHARLA.includes(m.tipo)) return { texto: m.texto, hacer: m.hacer };'), 'main.js: lo del lugar en el menú');
  // la tecla E y el aviso miran el mismo `vecino` (el mismo orden)
  const e = tramo(main, "    case 'KeyE': {", "      // 3.6 (vida): al lado de tu lugar en la mesa");
  ok(e.includes('if (vecino) { hablar(vecino); break; }'), 'E habla con el mismo vecino que dice el aviso');
}

// ============================================================ 5. el reloj de estar sentado
{
  const mm = leer('src/aldea-mecanicas-mundo.js');
  ok(mm.includes('const sinApuro = () => musica.activa || (!!ctx.gente?.()?.oyendoCuento?.() && cerca);'), 'lo frenan la música del baile y los cuentos del domingo');
  ok(main.includes("const escala = js.sentado && !desafio?.hayAtaque() && !charla.npc && !mecanicasAldea?.sinApuro() ? 40 : 1;"), 'y tu propia charla');
  // una semana en la aldea, con vos al lado de alguien a cada rato: se oyen charlas de vecinos todos los días
  // (no frenan) y los cuentos de la abuela sólo el domingo a la mañana, en la biblioteca (frenan)
  const A = await import('../src/aldea.js');
  const G = await import('../src/aldea-gente.js');
  const M = A.marcoAldea(A.PARADA_ALDEA);
  const P = { dia: 1, horas: 0, aldea: A.aldeaNueva(), entradas: {}, materiales: {}, cosas: {} };
  const vec = (x, y, z) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
  const npcs = [];
  const gente = { gente: npcs, agregarPoblador(def) { const n = { ...def, pos: vec(def.pos.x, 0, def.pos.z), camino: [], g: { rotation: {} } }; npcs.push(n); return n; } };
  const c0 = M.aMundo(6, 40);
  const jug = { estado: { pos: vec(c0.x, 0, c0.z) } };
  const AG = G.crearAldeaGente({ progreso: () => P, gente: () => gente, jugador: () => jug, tren: () => null, alturaDePie: () => 0, nota() {}, guardar() {}, registrar() {}, climaVecindad: () => 'sol', ambiente: () => ({ clima: 'sol', estacion: 'verano' }), hablandoCon: () => null, segundosPorHora: () => 75 });
  let charlas = 0, cuentos = 0, cuentoFuera = 0;
  for (let d = 1; d <= 7; d++) for (let m = 6 * 60; m < 21 * 60; m++) {
    P.dia = d; P.horas = m / 60;
    for (const n of npcs) { let q = 1.06; while (q > 0 && n.camino?.length) { const p = n.camino[0], dx = p.x - n.pos.x, dz = p.z - n.pos.z, dd = Math.hypot(dx, dz); if (dd <= q) { n.pos.x = p.x; n.pos.z = p.z; n.camino.shift(); q -= dd; } else { n.pos.x += (dx / dd) * q; n.pos.z += (dz / dd) * q; q = 0; } } }
    // vos: el domingo a la mañana, al lado de la abuela; si no, al lado de alguien quieto (cambiando cada media hora)
    const quietos = [...AG.personas.entries()].filter(([, st]) => st.npc && !st.npc.camino?.length);
    const domingoCuentos = A.diaSemanaDe(d) === 6 && P.horas >= 9.5 && P.horas < 12;
    const junto = domingoCuentos ? AG.personas.get('abuela')?.npc : quietos[Math.floor(m / 30) % Math.max(1, quietos.length)]?.[1].npc;
    if (junto) { jug.estado.pos.x = junto.pos.x + 1.5; jug.estado.pos.z = junto.pos.z; }
    AG.actualizar(1.25);
    if (AG.oyendo() && !AG.oyendoCuento()) charlas++;
    if (AG.oyendoCuento()) { cuentos++; if (!domingoCuentos) cuentoFuera++; }
  }
  ok(charlas > 20, `se oyen charlas de vecinos (${charlas} minutos): ésas no frenan el reloj`);
  ok(cuentos > 5 && cuentoFuera === 0, `los cuentos del domingo sí (${cuentos} minutos, ${cuentoFuera} fuera del domingo)`);
}

// ============================================================ 6. el mapa
{
  const A = await import('../src/aldea.js');
  const { distanciaAldea } = await import('../src/aldea-gente.js');
  const mapa = leer('src/mapa.js');
  const p = A.planoAldeaMapa();
  ok(p.calles.length === A.CALLES_ALDEA.length && p.calles.every((c) => c.ancho > 0 && c.puntos.length >= 2), 'las calles de la aldea, con su ancho');
  ok(p.edificios.length === A.IDS_EDIFICIOS.length && p.edificios.every((e) => e.esquinas.length === 4), 'cada edificio, con su planta');
  ok(p.edificios.filter((e) => e.tipo === 'plaza').length === 1 && p.edificios.some((e) => e.tipo === 'lote') && p.edificios.some((e) => e.tipo === 'edificio'), 'la plaza, los lotes y los edificios');
  ok([...p.calles.flatMap((c) => c.puntos), ...p.edificios.flatMap((e) => e.esquinas)].every((q) => distanciaAldea(q.x, q.z) < 7), 'todo adentro de lo que el mapa deja sin bosque');
  ok(main.includes('mapa = crearMapa(T, aldeaMundo ? { aldea: { ...planoAldeaMapa(), dentro: (x, z) => distanciaAldea(x, z) < 7 } } : null);'), 'sólo en el Relax (en el Desafío no hay aldea)');
  ok(mapa.includes("if (T.val(T.bosque, wx, wz) > 0.55 && !T.agua(wx, wz) && !aldea?.dentro?.(wx, wz))"), 'sin los puntitos de bosque en la aldea');
  ok(mapa.includes('for (const c of aldea.calles || [])') && mapa.includes('for (const e of aldea.edificios || [])'), 'calles y manchitas');
  // las marcas automáticas, con el mismo criterio que los nombres (arriba, abajo, a los costados)
  ok(mapa.includes('rotular(a.nombre, px, py, W / 75, W / 50);   // 3.6.2') && mapa.includes('rotular(a.nombre, px, py, s * 2, W / 52);') && mapa.includes('rotular(a.nombre, px, py, s * 2.1, W / 50);'), 'las automáticas pasan por rotular');
  ok(!/ctx\.fillText\(a\.nombre, px, py - (W \/ 75|s \* 2|s \* 2\.1)\);/.test(mapa), 'ninguna escribe a ciegas');
  ok(mapa.includes('const reservar = (wx, wz, r) =>') && mapa.includes("o[4] && o[4].toLowerCase() === igual"), 'los nombres no tapan los puntos, y el galpón no se escribe dos veces');
}

// ============================================================ 7. nadie camina más del 10 % de su horario
// Una semana de la aldea (completa y recién empezada), minuto a minuto, con la gente caminando de verdad por las
// calles (a su paso, con el día de 30 minutos: 75 s por hora), con sol, lluvia y nieve, y el tiempo que cambia a
// la tarde (como en verificar-3-6-1-vecinos). Para cada uno: del rato que el horario le manda algo (sin la
// cama), cuánto se lo pasa caminando. Con la 3.6.1: el jefe de estación, 44,9 %; Ercilia, 22,9 %; la madre de
// los Jones, 22,1 %; Nélida, 18,7 %; la abuela, 17,6 %; los chicos, 15 %; el músico, 13,4 %; la galesa, 11 %.
{
  const A = await import('../src/aldea.js');
  const G = await import('../src/aldea-gente.js');
  const V = await import('../src/vecindad.js');
  const M = A.marcoAldea(A.PARADA_ALDEA);
  const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
  const CLIMAS = ['sol', 'nieve', 'lluvia', 'nublado', 'nieve', 'viento', 'lluvia'];
  const tiempo = (d, h) => (h < 15 ? CLIMAS[d % 7] : CLIMAS[(d + 3) % 7]);
  for (const completa of [true, false]) {
    const P = { dia: 1, horas: 0, aldea: A.aldeaNueva(), entradas: {}, materiales: {}, cosas: {} };
    if (completa) { P.aldea.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); P.aldea.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); }
    const vec = (x, y, z) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
    const npcs = [{ clave: 'ercilia', nombre: 'Ercilia', pos: vec(0, 0, 0), ruta: [{ ...M.aMundo(-20, 50), quieto: 9 }], historias: [] }];
    const gente = { gente: npcs, agregarPoblador(def) { const n = { ...def, pos: vec(def.pos.x, 0, def.pos.z), camino: [], g: { rotation: {} } }; npcs.push(n); return n; } };
    const c0 = M.aMundo(22, 40);
    const jug = { estado: { pos: vec(c0.x, 0, c0.z) } };
    let clima = 'sol';
    const AG = G.crearAldeaGente({ progreso: () => P, gente: () => gente, jugador: () => jug, tren: () => null, alturaDePie: () => 0, nota() {}, guardar() {}, registrar() {}, climaVecindad: () => clima, ambiente: () => ({ clima, estacion: 'invierno' }), hablandoCon: () => null, segundosPorHora: () => 75 });
    const por = {};
    for (let d = 1; d <= 7; d++) for (let m = 0; m < 24 * 60; m++) {
      P.dia = d; P.horas = m / 60; clima = tiempo(d, P.horas);
      for (const n of npcs) {
        let quedan = (n.velocidad || 0.85) * 1.25;
        while (quedan > 0 && n.camino?.length) { const q = n.camino[0], dx = q.x - n.pos.x, dz = q.z - n.pos.z, dd = Math.hypot(dx, dz); if (dd <= quedan) { n.pos.x = q.x; n.pos.z = q.z; n.camino.shift(); quedan -= dd; } else { n.pos.x += (dx / dd) * quedan; n.pos.z += (dz / dd) * quedan; quedan = 0; } }
      }
      AG.actualizar(1.25);
      if (m % 5) continue;
      const ds = A.diaSemanaDe(d);
      for (const [k, st] of AG.personas) {
        const de = st.destino, n = st.npc;
        if (!de || !n || V.estaLibre(k, P.horas, ds, P) || ['cama', 'cama-chicos'].includes(de.punto)) continue;
        const r = por[k] || (por[k] = { horario: 0, caminando: 0 });
        r.horario++;
        if (n.camino?.length) r.caminando++;
      }
    }
    const pct = Object.fromEntries(Object.entries(por).map(([k, r]) => [k, (100 * r.caminando) / r.horario]));
    const peor = Object.entries(pct).sort((a, b) => b[1] - a[1]);
    ok(peor.length >= (completa ? 20 : 9), `aldea ${completa ? 'completa' : 'recién empezada'}: ${peor.length} con horario`);
    ok(peor[0][1] <= 10, `aldea ${completa ? 'completa' : 'recién empezada'}: nadie pasa del 10 % caminando (${peor.slice(0, 4).map(([k, v]) => `${k} ${v.toFixed(1)} %`).join(', ')})`);
    ok(pct.jefe <= 10, `el jefe de estación: ${pct.jefe.toFixed(1)} %`);
  }
  // el jefe: de su casa derecho a izar, unos mates en la plaza, la estación de 8:45 a 18 (andén y adentro cada dos
  // horas), almuerza ahí con la vianda, y a las 19:15 ya arrió y está libre
  const llena = (() => { const a = A.aldeaNueva(); a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); return a; })();
  const j = (h) => { const r = A.rutinaAldea('jefe', h, 1, llena); return `${r.edificio}/${r.punto}`; };
  eq([7.8, 8.5, 9.5, 11.5, 13, 16, 18.2, 18.8, 19.5].map(j), ['plaza/soga', 'plaza/estar-1', 'estacion-aldea/adentro', 'estacion-aldea/anden', 'estacion-aldea/adentro', 'estacion-aldea/anden', 'plaza/estar-1', 'plaza/soga', 'plaza/estar-1'], 'el día del jefe');
  ok(V.estaLibre('jefe', 8.5, 1, { aldea: llena }) && V.estaLibre('jefe', 18.2, 1, { aldea: llena }) && !V.estaLibre('jefe', 13, 1, { aldea: llena }), 'los mates en la plaza son libres; el almuerzo en la estación, no');
  // salir con tiempo: lo que tarda de verdad por las calles (antes la línea recta por 1,35)
  const gente = leer('src/aldea-gente.js');
  ok(gente.includes('const adelanto = largoRecorrido({ x: l0.lx, z: l0.lz }, q) / vel + 0.15;'), 'conTiempo mide el recorrido de verdad');
  const casa = A.puntosDe('casa-ercilia').cama, alm = A.puntosDe('almacen').adentro;
  ok(G.largoRecorrido(casa, alm) > 4 * Math.hypot(casa.x - alm.x, casa.z - alm.z), 'de la casa de Ercilia al almacén, más de cuatro veces la línea recta');
}

const pkg = JSON.parse(leer('package.json'));
ok(pkg.scripts.verify.includes('node pruebas/verificar-3-6-2-juego.mjs'), 'la prueba corre en verify');
console.log(`verificar-3-6-2-juego: ok (${pasos} pasos)`);
