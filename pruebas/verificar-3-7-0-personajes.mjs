// 3.7.0 (personajes): el estilo P (elegido por el usuario en el prototipo de la 3.6.2) es el de toda la
// gente del juego, sin `?personajes=`.
//  · gente-cuerpo.js arma a todos (una malla con piel por huesos y la cara con gestos de cerca), con
//    el atlas pintado de gente-atlas.js (que se pinta en la portada) y la ropa de gente-ropa.js;
//  · ropa propia para cada uno (los del valle, los de la aldea, los once pobladores y las nueve
//    pobladoras nuevas), con guardas, marcas del oficio, mayores con canas y arrugas, los chicos, y la
//    ropa de abrigo del invierno (poncho, gorro de lana y bufanda), que se cambia sola con la estación;
//  · los pulidos de la P: colgantes del trarilonko, trenzas finas trenzadas, la expresión de Inés, la
//    pincelada en la piel, guardas en cuellos y mangas, la talla de Lucía en aldea.js, los huesos
//    compartidos que se liberan; y los de la M y la S: el pañuelo de Rosa, cuellos finos, "acomodar
//    el gorro" que no parezca un saludo;
//  · el juego: la gente con su ropa de la estación, el precalentado de la sombra, el atlas en la
//    portada, nadie compila programas al cruzarse con alguien.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- 1. el prototipo pasó a lo normal
const cuerpo = leer('src/gente-cuerpo.js'), atlas = leer('src/gente-atlas.js'), ropa = leer('src/gente-ropa.js'), gente = leer('src/gente.js'), main = leer('src/main.js');
ok(!fs.existsSync(path.join(src, 'gente-proto.js')) && !fs.existsSync(path.join(src, 'gente-proto-atlas.js')), 'el prototipo ya no está (gente-proto.js pasó a gente-cuerpo.js)');
for (const [n, t] of [['gente-cuerpo.js', cuerpo], ['gente-atlas.js', atlas], ['gente-ropa.js', ropa], ['gente.js', gente]]) {
  ok(!/personajes=|VARIANTE_PERSONAJES|PROTOTIPO/.test(t), `${n}: sin el ajuste ?personajes= ni restos del prototipo`);
  ok(!t.includes('\r'), `${n}: fines de línea LF`);
  ok(!/^export\s+(?:const|let|function|class)\s+\S*ñ/m.test(t), `${n}: lo exportado, sin ñ`);
}
for (const t of [cuerpo, atlas, ropa]) ok(t.includes('3.7.0:'), 'los comentarios llevan la versión');
ok(gente.includes("import { crearPersona, soltarPersona } from './gente-cuerpo.js';") && gente.includes('if (!ESTILO_VIEJO) return crearPersona(colores || {}, clave, conMate, R, opciones);'), 'gente.js arma a todos al estilo P');
ok(!/^import\s+'/m.test(cuerpo + atlas + ropa) && !/^export\s+(?:async\s+function|function\*|\{)/m.test(cuerpo + atlas + ropa), 'armar.mjs entiende los imports y exports');
ok(!/from 'three'|document\.|window\./.test(ropa), 'gente-ropa.js es datos puros (sin three ni el DOM)');
ok(!/new THREE\.(ShapeGeometry|Shape|OctahedronGeometry|Vector4|Frustum)\b/.test(cuerpo + atlas), 'nada de lo que el three local no trae');

// ---------------------------------------------------------------- 2. la ropa de cada uno (puro)
const R = await import(pathToFileURL(path.join(src, 'gente-ropa.js')).href);
const A = await import(pathToFileURL(path.join(src, 'aldea.js')).href);
const valle = ['ramon', 'nicanor', 'ema', 'ercilia', 'guarda'];
const vecinos = A.ORDEN_VECINOS_ALDEA.map((k) => `aldea-${k}`);
const pobladores = A.ORDEN_POBLADORES_ALDEA.map((k) => `poblador-${k}`);
const nuevas = R.NUEVAS_3_7_0.map((k) => `poblador-${k}`);
ok(R.NUEVAS_3_7_0.join() === 'veterinaria,fotografa,andinista,herbolaria,pintora,ceramista,botera,astronoma,modista', 'las nueve pobladoras de la 3.7.0, con las claves del núcleo');
const todos = [...new Set([...valle, ...vecinos, ...pobladores, ...nuevas])];
ok(todos.length >= 33, `todos los personajes (${todos.length})`);
const firmas = new Set();
for (const k of todos) {
  ok(Object.hasOwn(R.ASPECTO, k), `${k}: tiene ropa y aspecto propios`);
  const d = R.ASPECTO[k];
  ok(Number.isFinite(d.edad) && d.cuerpo && d.cara && d.colores && d.R && d.poses?.length, `${k}: edad, contextura, cara, colores, ropa y poses`);
  ok(Object.keys(d.guardas || {}).length >= 1, `${k}: con alguna guarda (ya no la genérica)`);
  ok(d.abrigo && d.abrigo.colores, `${k}: con su ropa de abrigo`);
  firmas.add(JSON.stringify([d.cara, d.colores.piel, d.colores.pelo, d.colores.ropa, d.colores.abrigo]));
  const inv = R.aspectoGente(k, {}, {}, { invierno: true });
  ok(inv.invierno && inv.colores.bufanda && inv.colores.gorro, `${k}: en invierno, gorro y bufanda`);
  if (!d.chico) ok(!!inv.colores.poncho && inv.guardas.poncho, `${k}: en invierno, poncho con su guarda`);
  if (d.edad >= 55) ok(d.cara.arrugas === 'mayor' || d.R.canas > 0 || /^#[bcde]/.test(d.colores.pelo), `${k}: los mayores, con canas o arrugas`);
}
ok(firmas.size === todos.length, 'cada uno con su cara y sus colores (no hay dos iguales)');
ok(new Set(todos.map((k) => JSON.stringify(R.ASPECTO[k].cuerpo))).size >= 20, 'contexturas distintas');
for (const k of nuevas) ok(new Set(nuevas.filter((j) => JSON.stringify(R.ASPECTO[j].cuerpo) === JSON.stringify(R.ASPECTO[k].cuerpo))).size === 1, `${k}: una contextura propia`);
// las nueve, con lo suyo
const N = (k) => R.ASPECTO[`poblador-${k}`];
ok(N('ceramista').R.barroDelantal && N('ceramista').guardas.delantal[0] === 9 && N('ceramista').cara.sonrisa < 0.15, 'Malena: callada, con el delantal de barro');
ok(N('botera').R.brea && N('botera').cara.sonrisa > 0.6, 'Martina: ruidosa, con brea en las manos');
ok(N('astronoma').cara.parpado >= 0.25 && N('astronoma').cara.ojeras, 'Valentina: dormilona');
ok(N('pintora').R.pintura && N('pintora').guardas.campera[0] === 8, 'Abril: con manchas de pintura');
ok(N('andinista').cara.cicatriz && N('andinista').cuerpo.brazos > 1.05, 'Rocío: fuerte, con cicatriz');
ok(N('veterinaria').R.coleta && N('veterinaria').R.barroBotas && N('veterinaria').guardas.bota[0] === 9, 'Ayelén: el pelo atado y las botas embarradas');
ok(N('modista').edad === 58 && N('modista').R.centimetro, 'Pocha: modista de 58, con el centímetro');
ok(N('fotografa').R.camara, 'Sofía: con la cámara');
const ines = R.aspectoGente('poblador-herbolaria', {}, {}, { fiesta: true });
ok(ines.fiesta && ines.colores.trarilonko && ines.R.chamal && !R.aspectoGente('poblador-herbolaria').colores.trarilonko, 'Inés: de diario, de trabajo; de fiesta, la ropa del prototipo');
ok(R.ASPECTO['aldea-nene'].chico && R.ASPECTO['aldea-nena'].chico && !R.aspectoGente('aldea-nena', {}, {}, { invierno: true }).colores.poncho, 'los chicos: en invierno, sin poncho');
ok(!R.aspectoGente('desconocido').conocido, 'alguien sin ropa propia queda con los colores que trae');
ok(R.ASPECTO['poblador-panadera'].colores.gorro === 'panuelo', 'Rosa, con su pañuelo');

// ---------------------------------------------------------------- 3. los pulidos (el código)
ok(cuerpo.includes('los colgantes cuelgan de la cinta') && cuerpo.includes('argolla'), 'los colgantes del trarilonko cuelgan de la cinta');
ok(cuerpo.includes('function trenzaFina(') && !/bola\(matiz\(colPelo, i % 2/.test(cuerpo), 'las trenzas, finas y trenzadas (no bolas)');
ok(/'poblador-herbolaria': \{[\s\S]*?parpado: 0\.12/.test(ropa), 'Inés: la expresión neutral, amable (el párpado en reposo)');
ok(cuerpo.includes('la pincelada de la piel') && atlas.includes('function pintarPincelada('), 'más pincelada en la piel');
ok(/guardas: \{[^}]*cuello:/.test(ropa) && /guardas: \{[^}]*puno:/.test(ropa) && cuerpo.includes("'cuello', 4, 16") && cuerpo.includes("rol(puno, 'puno', 4, 12)"), 'guardas en cuellos y mangas');
ok(cuerpo.includes('function soltarHuesos(') && cuerpo.includes('p.libres.length') && gente.includes('function quitar(npc)'), 'los huesos compartidos se liberan cuando alguien se va');
ok(!cuerpo.includes('TALLA_CHICO_S') && /nena: \{[\s\S]*?talla: 0\.76,/.test(leer('src/aldea.js')), 'la talla de Lucía en aldea.js (sin el arreglo del prototipo)');
ok(cuerpo.includes("colores.gorro === 'panuelo'") && cuerpo.includes("'panueloC'") && cuerpo.includes('lunares'), 'el pañuelo de Rosa se lee como pañuelo (pegado a la cabeza, estampado, con el nudo atrás)');
ok(cuerpo.includes('el cuello, más fino'), 'cuellos más finos');
ok(cuerpo.includes("gorro: { uno: true, der: { x: -0.15, yl: 1.5, zl: 2.5, codo: -1.8 }"), '"acomodar el gorro": el codo afuera y la mano arriba de la cabeza (no un saludo)');
ok(cuerpo.includes('LEJOS_FINO') && cuerpo.includes('sin pedirle'), 'lo caro, sólo de cerca; lejos, sin las piezas finas');

// ---------------------------------------------------------------- 4. el juego
ok(main.includes("crearGente(T, escena, col, sonido, { invierno: inviernoDeAjustes(), estiloViejo: GENTE_VIEJA })"), 'main.js: la gente arranca con la ropa de la estación');
ok(main.includes('gente?.abrigar?.(U.uInvierno.value > 0.5);'), 'main.js: la ropa de abrigo, con el invierno');
ok(main.includes('gente?.precalentar?.(camara,') && main.includes('gente?.trasCompilar?.();'), 'main.js: la sombra de la gente se compila en la carga y el atlas se pinta en la portada');
ok(atlas.includes('export function pintarAtlasDespues()') && atlas.includes('requestIdleCallback') && gente.includes('if (!atlasListo()) completarAtlas();'), 'el atlas se pinta de a pasos en la portada (y si no llegó, de una al jugar)');
ok(gente.includes('function cambiarRopa(dt, js)') && gente.includes("g.dormido || !g.g.visible || d > 40"), 'la ropa se cambia sin que nadie lo vea');
for (const p of ['sentado', 'leyendo', 'palear', 'hachar', 'regar', 'mirar', 'jugar', 'bailar', 'tocar', 'izar', 'martillar', 'amasar', 'serruchar']) ok(gente.includes(`case '${p}':`), `gente.js: la pose ${p}, igual que antes`);

// ---------------------------------------------------------------- 5. armar a todos (en una VM, sin DOM)
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const info = new Map(), orden = [], visto = new Set();
const visitar = (f) => {
  f = path.resolve(f);
  if (visto.has(f)) return;
  visto.add(f);
  const texto = fs.readFileSync(f, 'utf8');
  for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
  info.set(f, texto); orden.push(f);
};
visitar(path.join(src, 'gente-cuerpo.js'));
const transformar = (f, t) => {
  const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) =>
    `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).map((x) => x.replace(/\s+as\s+/, ': ')).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
  t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
};
let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
for (const f of orden) code += transformar(f, info.get(f)) + '\n';
code += '\n;globalThis.__C = __mod_gente_cuerpo; globalThis.__THREE = THREE;';
const ctx = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Uint16Array, Uint32Array, Int32Array, Uint8Array, Uint8ClampedArray, Error, Symbol, globalThis: null };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'gente-cuerpo-vm.js' });
const C = ctx.__C;
const base = C.huesosEnUso();
const armadas = [];
for (const k of todos) {
  const def = k.startsWith('aldea-') ? A.VECINOS_ALDEA[k.slice(6)] : k.startsWith('poblador-') ? A.POBLADORES_ALDEA[k.slice(9)] : null;
  for (const invierno of [false, true]) {
    const p = C.crearPersona(def?.colores || {}, k, def?.mano === 'mate' || k === 'ramon', {}, { talla: def?.talla, invierno });
    const mallas = []; p.g.traverse((o) => { if (o.isMesh) mallas.push(o); });
    const piel = mallas.filter((o) => o.isSkinnedMesh);
    const tri = piel[0].geometry.index.count / 3;
    ok(piel.length === 1 && mallas.length === 2 && p.cara && !p.cara.visible, `${k}${invierno ? ' (invierno)' : ''}: una malla con piel por huesos y la cara con gestos aparte`);
    ok(tri > 6000 && tri < 19000, `${k}${invierno ? ' (invierno)' : ''}: ${Math.round(tri)} triángulos`);
    const u = piel[0].userData;
    ok(u.indicesSinFino > 0 && u.indicesSinFino < u.indices, `${k}: lejos se dibuja sin lo fino`);
    ok(p.cara.morphTargetInfluences.length === 2 && typeof p.alPosar === 'function', `${k}: sonrisa y risa, y el paso de cada cuadro`);
    ok(p.brazos.length === 2 && p.patas.length === 2 && p.mano && p.torso && p.cabeza, `${k}: los huesos de siempre (para las poses de gente.js)`);
    if (invierno && !R.ASPECTO[k].chico) ok(p.conPoncho, `${k}: de poncho en invierno`);
    armadas.push(p);
  }
}
ok(C.huesosEnUso() - base === armadas.length, 'cada uno con su tramo de huesos');
for (const p of armadas) C.soltarPersona(p);
ok(C.huesosEnUso() === base, 'al irse, los tramos quedan libres');
const otra = C.crearPersona({}, 'poblador-panadera', true, {}, {});
ok(C.huesosEnUso() === base + 1, 'el que llega usa un tramo libre');
// el mate se guarda y lejos se dibuja sin lo fino, con el mismo rango de dibujo
const malla = (() => { let m = null; otra.g.traverse((o) => { if (o.isSkinnedMesh) m = o; }); return m; })();
otra.mateVisible.visible = false;
ok(malla.geometry.drawRange.count === malla.userData.indicesSinMate, 'el mate guardado no se dibuja');
otra.mateVisible.visible = true;
ok(malla.geometry.drawRange.count === Infinity, 'con el mate a la vista, todo');
const camLejos = { position: new ctx.__THREE.Vector3(30, 1.6, 0) };
const npc = { ...otra, pos: otra.g.position, fase: 0 };
npc.alPosar(npc, 1 / 60, camLejos, false, false);
ok(malla.geometry.drawRange.count === Infinity, 'lejos y con el mate en la mano: el mate se sigue viendo');
npc.mate = otra.mateVisible; otra.mateVisible.visible = false;
npc.alPosar(npc, 1 / 60, camLejos, false, false);
ok(malla.geometry.drawRange.count === malla.userData.indicesSinFino, 'lejos y sin el mate: sin lo fino');
C.soltarPersona(otra);
// el jugador: el cuerpo (el modo foto) y la mano en primera persona, al mismo estilo
const yo = C.crearPersona({}, 'jugador', false, {}, { aspecto: { colores: { piel: '#c49a70', pelo: '#3a2a1e', ropa: '#6b4a3a', abrigo: '#6b4a3a', gorro: 'gorroPunto', gorroColor: '#b0773a', bufanda: '#e2d6bd' }, R: { mujer: false, guantes: '#8d8a82' }, guardas: { puno: [1, 0, 'todo'] } } });
ok(yo.patas.length === 2 && yo.brazos.length === 2 && C.huesosEnUso() === base + 1, 'tu cuerpo, armado como la gente');
C.soltarPersona(yo);
const mano = C.manoPrimeraPersona({ piel: '#c49a70', manga: '#6b4a3a', guarda: 1 });
ok(mano.isMesh && !mano.isSkinnedMesh && mano.geometry.attributes.aTela && mano.geometry.attributes.aGuarda && mano.material === C.materialGente(), 'tu mano: una malla fija con el material de la gente');
const pm = leer('src/personal-personaje-mundo.js');
ok(pm.includes("import { crearPersona, soltarPersona, manoPrimeraPersona } from './gente-cuerpo.js';") && pm.includes("crearPersona({}, 'jugador', false, {}, { aspecto: aspectoJugador(aspecto(datos)) })"), 'personal-personaje-mundo.js: tu cuerpo y tu mano, al estilo de la gente');

console.log(`OK 3.7.0 personajes · ${pasos} verificaciones · el estilo P para todos, la ropa de cada uno y la de abrigo, los pulidos y el juego`);
