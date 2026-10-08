// 3.8.0 «La noche de los duendes», el jefe y el recurso (desafio-coihue-formas.js y el enganche en
// desafio-eventos.js, desafio-asedio-mundo.js, desafio-nave-mundo.js, desafio.js, desafio-mapa-mundo.js,
// mochila.js, mapa.js y enmano.js), sin Electron:
//   0. el módulo nuevo (imports en una línea, sin `export ... from`, exportados sin eñe, LF, three local);
//   1. la nave nodriza es el Coihue Viejo: la noche final (camina, tres nudos de ámbar), el asedio (plantado,
//      raíces en las zonas, la puerta grande) y la caída;
//   2. adentro: el corazón con el Rey Duende (huesos y poses), la subida por la escalera de raíces (entra en
//      el tiempo de siempre) y los nombres de siempre (ojos, pilares, corazón) para las pruebas y el guardado;
//   3. sin programas nuevos a mitad del juego (testigos en la carga, clave propia, luces registradas);
//   4. las semillas doradas en lugar del cristal (lo que se junta, la mochila, el mapa, el lugar del mapa);
//   5. las reglas de la pelea no cambiaron, y nada religioso.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { NAVE, FASES_NAVE, naveNueva } from '../src/desafio-nave.js';
import { ASEDIO } from '../src/desafio-asedio.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const tiene = (t, s, m) => ok(t.includes(s), m || `falta: ${s}`);
const RELIGIOSO = /capilla|\bmisa\b|\bcura\b|\bcuras\b|\brez[aoá]|\bdios|\bsant[oa]s?\b|bendi|iglesia|altar|parroq|milagro|virgen|sagrad[oa]s? |ángel|amén|pecado/i;

const formas = leer('src/desafio-coihue-formas.js');
const nave = leer('src/desafio-nave-mundo.js');
const asedio = leer('src/desafio-asedio-mundo.js');
const eventos = leer('src/desafio-eventos.js');
const desafio = leer('src/desafio.js');
const mapaMundo = leer('src/desafio-mapa-mundo.js');
const mochila = leer('src/mochila.js');
const mapa = leer('src/mapa.js');
const enmano = leer('src/enmano.js');

// ============================================================ 0. el módulo
{
  const t = formas;
  ok(!t.includes('\r'), 'desafio-coihue-formas.js: fines de línea LF');
  for (const l of t.split('\n').filter((x) => x.startsWith('import '))) ok(/^import (\{ [^}]+ \}|\* as \w+) from '[^']+';$/.test(l), `import raro: ${l}`);
  ok(!/export \{[^}]*\} from|export async function|export function\*/.test(t), 'export que armar.mjs no entiende');
  ok(!/OctahedronGeometry|ShapeGeometry|new THREE\.Shape\(|Vector4|Frustum|DodecahedronGeometry/.test(t), 'geometría que el three local no trae');
  for (const m of t.matchAll(/^export (?:const|function|let) ([^\s(=]+)/gm)) ok(/^[\w$]+$/.test(m[1]), `exportado con eñe: ${m[1]}`);
  for (const nombre of ['armarCoihueViejo', 'animarCoihue', 'armarRey', 'armarSubida', 'geoSemilla', 'geoAmbar', 'halosDe', 'testigosCoihue', 'herramientasCoihue', 'COIHUE']) ok(new RegExp(`^export (?:const|function) ${nombre}\\b`, 'm').test(t), `exporta ${nombre}`);
  ok(/^\/\/ 3\.8\.0: /.test(t), 'el comentario de arriba lleva la versión');
  // el módulo no pinta nada en el DOM más que la textura del halo
  ok((t.match(/document\./g) || []).length === 1 && t.includes("document.createElement('canvas')"), 'sólo el lienzo del halo');
  // el prototipo no se cuela: lo que no se eligió (Coihue 1-2, Rey 1 y 3, las piedras de luz) no está
  ok(!/armarLechuza|armarNido|armarMadriguera|ESTILOS|crearDuendesProto/.test(t), 'sólo el Coihue 3, el Rey 2 y las semillas (los duendes comunes son de otro equipo)');
  for (const f of ['src/desafio-coihue-formas.js', 'src/desafio-nave-mundo.js', 'src/desafio-asedio-mundo.js', 'src/desafio-eventos.js']) {
    for (const l of leer(f).split('\n').filter((x) => x.startsWith('import '))) ok(/^import (\{ [^}]+ \}|\* as \w+) from '[^']+';$/.test(l), `${f}: import raro: ${l}`);
  }
}

// ============================================================ 1. el Coihue Viejo, afuera
{
  // la noche final: camina desde el bosque, tres nudos de ámbar en el tronco, se cae para atrás
  tiene(eventos, 'const co = armarCoihueViejo();', 'la nodriza de la noche final es el Coihue Viejo');
  // un solo Coihue (decisión del usuario): armado al cargar, al alba se queda plantado y es el del asedio
  tiene(eventos, '  nodriza = crearNodriza();\n  api.coihueComun = nodriza;', 'se arma al cargar el Desafío y se comparte con el asedio');
  ok(!/if \(!nodriza\) nodriza = crearNodriza\(\);/.test(eventos), 'no se arma a mitad de la partida');
  tiene(eventos, "nodriza.fase = 'plantado';", 'al alba se queda plantado (ya no se va al bosque)');
  tiene(asedio, 'const co = api.coihueComun || armarCoihueViejo();', 'el asedio usa el mismo Coihue');
  tiene(asedio, "const co = api.coihueComun, plantado = co && co.fase === 'plantado' && co.g.visible;", 'el asedio es donde quedó plantado');
  tiene(asedio, 'if (armado.nave) armado.nave.g.visible = false;', 'al desarmar se esconde (no se saca: es compartido)');
  tiene(eventos, "nodriza.fase !== 'fuera' && nodriza.fase !== 'plantado'", 'plantado ya no es la nodriza activa');
  tiene(formas, 'smoothstep(40.0, 150.0, length(vViewPosition))', 'de lejos la corteza se levanta un poco (la silueta de noche)');
  ok(!/api\.crearMallaNave\(\)/.test(eventos) && !/api\.crearMallaNave\(\)/.test(asedio), 'ni la noche final ni el asedio usan la malla de la nave');
  tiene(eventos, 'n.position.copy(co.brasas[i]);', 'los tres núcleos van en el tronco (nudos de ámbar)');
  tiene(eventos, 'animarCoihue(n, n.reloj, paso);', 'camina con sus raíces');
  ok(/const COIHUE_NOCHE = \{ desde: \d+, hasta: \d+, llegar: 7, irse: 6 \};/.test(eventos), 'llega y se va en el tiempo de siempre (7 s y 6 s: las tandas de las pruebas)');
  tiene(eventos, "if (n.largar <= 0) { n.largar = 38; api.largarDesde(n.x, n.z); }", 'larga duendes cada 38 s, como la nave');
  tiene(eventos, 'api.D().nodriza = null;', 'al caer se borra la nodriza (como siempre)');
  tiene(eventos, 'get coihue() { return nodriza; },', 'las pruebas ven el Coihue de la noche final');
  // el asedio: plantado, mira a tu base, la puerta grande es el «haz», raíces en las zonas
  tiene(asedio, 'co.g.position.set(a.nave.x, T.altura(a.nave.x, a.nave.z), a.nave.z);', 'el asedio planta el Coihue');
  tiene(asedio, 'return { ...co, haz: co.puerta, luces: [], escudo, luz, giro, t: 0, caida: 0, cayendo: 0, alCaer: null', 'el haz es la puerta grande (y las pruebas siguen viendo armado.nave.haz)');
  tiene(asedio, 'n.haz.visible = abierto;', 'la puerta se enciende cuando se puede subir');
  ok(/const PIE_COIHUE = (\d+);/.test(asedio) && Number(asedio.match(/const PIE_COIHUE = (\d+);/)[1]) >= 12, 'E entra desde el pie del Coihue (debajo del tronco o la escalera de la puerta)');
  tiene(asedio, 'for (const p of piesCoihue(n, a.nave.x, a.nave.z, n.giro)) api.col.agregar(', 'sus raíces chocan');
  tiene(eventos, 'for (const p of piesCoihue(nodriza, nodriza.x, nodriza.z, nodriza.giro)) api.col.agregar(', 'las del de la noche final también');
  tiene(asedio, 'aguja.add(mallaRaizAguja());', 'las agujas son raíces que brotaron');
  // los nombres que eligió el usuario (los pone el equipo de textos): baliza → fogón, escudo → corteza
  tiene(asedio, "// 3.8.0: la baliza es un fogón", 'la baliza se ve como un fogón');
  tiene(asedio, 'const escudo = new THREE.Mesh(geoCorteza(co.radio),', 'el escudo es una corteza dura alrededor del tronco');
  tiene(nave, 'new THREE.BoxGeometry(1.05, 1.55, 0.14)', 'las puertitas de adentro, a la medida de los duendes chicos');
  ok(/const CAIDA = \{ lento: [\d.]+, rapido: [\d.]+, tope: Math\.PI \/ 2 \* 0\.96 \};/.test(asedio), 'se cae de costado, para el lado contrario a la base');
  // el tiempo de la caída: con lo de las pruebas (unos 4 s, como la nave)
  const m = asedio.match(/const CAIDA = \{ lento: ([\d.]+), rapido: ([\d.]+)/);
  const lento = Number(m[1]), rapido = Number(m[2]), tope = Math.PI / 2 * 0.96;
  const t = (-lento + Math.sqrt(lento * lento + 4 * rapido * tope)) / (2 * rapido);
  ok(t > 3 && t < 6, `la caída tarda entre 3 y 6 s (${t.toFixed(1)} s)`);
  // la escala: imponente sobre el bosque (los coihues del bosque llegan a 30 m)
  const esc = Number(formas.match(/export const COIHUE = \{ alto: (\d+), alza: (\d+), escala: ([\d.]+) \};/)[3]);
  ok((24 + 3 + 3) * esc > 45, `el Coihue Viejo pasa los 45 m (${((24 + 3 + 3) * esc).toFixed(0)} m)`);
  // la copa con las cartas de hojas del bosque y el material de los frutales (el mismo programa)
  tiene(formas, 'conCartas(materialVegetal({ flex: 1, copa: true, doble: true }), texturaCartas())', 'la copa usa el follaje del juego');
  tiene(formas, "racimo(cc, 4511 + i * 13,", 'racimos de cartas en las ramas');
}

// ============================================================ 2. adentro
{
  tiene(nave, 'const rey = armarRey(ESC_REY);', 'el Rey Duende en el lugar de la Madre');
  tiene(nave, 'const s = armarSubida();', 'la escalera de raíces del tronco hueco');
  tiene(formas, "for (const h of ['torso', 'cabeza', 'brazo0', 'brazo1'])", 'el Rey tiene huesos (torso, cabeza, brazos)');
  for (const p of ['lanzar', 'llamar', 'golpe', 'senalar', 'herido']) ok(nave.includes(`poseRey.nombre === '${p}'`), `pose del Rey: ${p}`);
  tiene(nave, "if (h === 'disparo') { disparar(js); posar('lanzar', 0.7); }", 'las poses acompañan lo que hace');
  // la subida se camina (decisión del usuario): unos 30-60 s caminando, con descansos, sin caídas al vacío
  const sb = formas.match(/export const SUBIDA = \{ radio: ([\d.]+), columna: ([\d.]+), vueltas: (\d+), altoVuelta: ([\d.]+), paso: ([\d.]+), descansos: \[([\d, ]+)\], llano: (\d+) \};/);
  ok(!!sb, 'las medidas de la subida');
  {
    const radio = Number(sb[1]), columna = Number(sb[2]), vueltas = Number(sb[3]), altoVuelta = Number(sb[4]);
    const rMed = (columna + 0.1 + radio - 0.25) / 2, largo = vueltas * 2 * Math.PI * rMed;
    const caminando = Math.hypot(largo, vueltas * altoVuelta) / 3.2;   // VELOCIDAD.caminar
    ok(caminando > 30 && caminando < 60, `se tarda entre 30 y 60 s caminando (${caminando.toFixed(0)} s)`);
    ok(altoVuelta - 0.25 > 1.65 + 1, 'entre una vuelta y la de arriba se pasa de pie (y saltando)');
    ok(altoVuelta / (2 * Math.PI) * Number(sb[5]) < 0.62, 'cada tramo sube menos que un escalón (se sube caminando)');
    ok(sb[6].split(',').length >= 3, 'hay descansos en el camino');
  }
  tiene(nave, 'function ponerFisicaSubida() {', 'la escalera tiene su física: tramos, la pared y la columna del medio');
  tiene(nave, 'col.agregar({ x: o.x, z: o.z, r: s.columna + 0.12,', 'el tronco del medio es el borde (no hay vacío)');
  tiene(nave, 'ponerEnDescanso(ultimoDescanso);', 'si te caés, volvés al último descanso (nada de morir por caída)');
  tiene(nave, "return p === 'corazon' ? 'Entrar al corazón del Coihue' : p === 'valle' ? 'Salir al valle por la puertita' : null;", 'arriba la puerta del corazón, abajo la puertita al valle');
  tiene(nave, "if (enLaSalida(pos)) return 'Bajar por la escalera de raíces';", 'desde la sala se baja por la escalera');
  tiene(nave, 'subida = construirSubida(s);   // (detrás del fundido: la pantalla está a oscuras)', 'la subida se arma detrás del fundido de entrada');
  tiene(nave, 'if (enSubida) { activos.length = 0; actualizarSubida(dt, js); return; }', 'en la escalera no hay pelea');
  tiene(nave, 'entrarCorazon, bajarEscalera, atajoCorazon,', 'el atajo de las pruebas a la puerta del corazón');
  for (const f of ['pruebas/humo-3-0-asedio.cjs', 'pruebas/humo-3-5-1-desafio.cjs']) ok(leer(f).includes('naveAdentro.atajoCorazon()'), `${f}: usa el atajo a la puerta del corazón`);
  // los duendes que asoman en la subida (tercera tanda): los de siempre, sin pelea ni choques
  tiene(nave, "import { crearDuende } from './desafio-duendes.js';", 'los duendes de la subida son los del Desafío (instanciados: no compilan nada)');
  tiene(nave, 'if (subida.vecinos) animarVecinos(dt, js);', 'asoman, se ríen y se esconden');
  tiene(nave, 'if (d < 3.5) { v.quiere = 0;', 'cerca se meten en su casita');
  tiene(nave, 'S().risa?.(', 'se ríen al asomarse');
  { const cuerpoV = nave.slice(nave.indexOf('function animarVecinos('), nave.indexOf('function animarVecinos(') + 2500); ok(!/col.agregar|herirJugador|lanzarProyectil|api.aliens/.test(cuerpoV), 'no chocan, no pelean y no son de la oleada'); }
  // los nombres de siempre (pruebas y guardado): ojos, pilares, corazón, gajos, escudo, matRajas, aro, charco
  tiene(nave, 'grupo, x: sitio.x, y, z: sitio.z, sitio, madre, cuerpo, gajos, ojos, corazon, blancoCorazon, tentaculos, escudo,', 'la arena devuelve lo de siempre');
  tiene(nave, 'ojos.push({ g, globo, pupila, herida, flash: 0, blanco:', 'cada piedra del trono es un «ojo» (globo, pupila, herida)');
  tiene(nave, 'pilares.push({ g, columna, nucleo, hilo, flash: 0, blanco:', 'cada raíz con su semilla es un «pilar»');
  tiene(nave, 'columna.position.y = 4;', 'la columna arranca entera (las pruebas miran scale.y y position.y)');
  tiene(nave, 'lugaresVaina.push({ x: Math.cos(a) * (R - 3.4), z: Math.sin(a) * (R - 3.4) });', 'las crías salen de las puertitas, donde estaban las vainas');
  tiene(nave, 'const PUERTA_SALA = { medio: 0.065, alto: 3.6 };', 'la puerta de la escalera en la pared (donde estaba el aro)');
  // la puerta de la sala está donde siempre estuvo la salida (ángulo 0): ni vainas, ni pilares, ni hongos ahí
  ok(Math.abs(Math.PI / 6 % (Math.PI / 3)) > 0.3 && NAVE.radioPilares > 10, 'las vainas y los pilares quedan lejos de la puerta');
}

// ============================================================ 3. sin compilar a mitad del juego
{
  tiene(nave, 'escena.add(testigosCoihue());', 'los programas del Coihue y del Rey se compilan en la carga');
  tiene(formas, "m.customProgramCacheKey = () => 'coihue-corteza-38';", 'la corteza tiene su propia clave de programa');
  for (const [f, t] of [['desafio-nave-mundo.js', nave], ['desafio-asedio-mundo.js', asedio], ['desafio-eventos.js', eventos]]) {
    const luces = (t.match(/new THREE\.PointLight\(/g) || []).length, registradas = (t.match(/registrarLuz\(/g) || []).length;
    ok(registradas >= luces, `${f}: toda luz nueva va al presupuesto fijo (${luces} luces, ${registradas} registradas)`);
  }
  // la testigo de la copa es una malla instanciada, como los frutales (mismo programa)
  tiene(formas, 'const copa = new THREE.InstancedMesh(cc.geometria(), matCopa(), 1);', 'testigo de la copa instanciada');
}

// ============================================================ 4. las semillas doradas
{
  tiene(desafio, 'const geoCristal = geoSemilla(0.3);', 'lo que sueltan los duendes son semillas doradas');
  tiene(desafio, "import { geoSemilla } from './desafio-coihue-formas.js';");
  tiene(mapaMundo, 'const g = geoSemilla(s);', 'el lugar de las semillas del mapa');
  ok(!/'#5fd6c8'|'#7dfff0'/.test(mapaMundo), 'sin el celeste del cristal en el lugar del mapa');
  const icono = mochila.slice(mochila.indexOf('    cristal() {'), mochila.indexOf('    hongo() {'));
  ok(/semilla dorada/.test(icono) && !/#7dfff0/.test(icono), 'el ícono de la mochila es una semilla dorada');
  const icMapa = mapa.slice(mapa.indexOf('  cristal(c, x, y, s) {'), mapa.indexOf('  madera(c, x, y, s) {'));
  ok(/semillas doradas/.test(icMapa) && !/#5fd6c8/.test(icMapa), 'el mapa marca semillas');
  const enM = enmano.slice(enmano.indexOf('  cristal() {'), enmano.indexOf('export function crearEnMano'));
  ok(/semilla dorada/.test(enM) && !/0x7dfff0/.test(enM), 'en la mano, una semilla');
  // el material interno se sigue llamando 'cristal' (el guardado y las recetas no cambian)
  ok(/sumarMaterial\?\.\('cristal', ASEDIO\.cristalesAncla\)/.test(asedio) && ASEDIO.cristalesAncla === 4, 'el recurso se guarda como siempre (cristal)');
}

// ============================================================ 5. las reglas y lo que no se toca
{
  ok(NAVE.ojos === 3 && NAVE.pilares === 4 && NAVE.radioArena === 27 && NAVE.radioCuerpo === 4.6 && NAVE.vidaCorazon === 800, 'la pelea de adentro es la de siempre');
  ok(FASES_NAVE.join() === 'ojos,pilares,corazon', 'las tres fases, en orden');
  const p = naveNueva({ vida: 1, debilidad: 1 });
  ok(p.ojos.filter((v) => v > 0).length === 2, 'con las cuatro zonas libres, una piedra menos');
  for (const [f, t] of [['desafio-coihue-formas.js', formas], ['desafio-nave-mundo.js', nave], ['desafio-asedio-mundo.js', asedio]]) {
    const comentarios = t.split('\n').filter((l) => /^\s*\/\//.test(l) && /3\.8\.0/.test(l)).join('\n');
    ok(!RELIGIOSO.test(comentarios), `${f}: nada religioso`);
  }
  ok(!RELIGIOSO.test(formas), 'el módulo del Coihue: nada religioso');
}

// ============================================================ 6. 3.8.1: arreglos del Coihue
{
  // sin claro, el lugar de siempre (52 m) tampoco cae sobre el agua, la vía ni una obra
  const sc = eventos.slice(eventos.indexOf('function sitioCoihue('), eventos.indexOf('const hudNodriza'));
  const resto = sc.slice(sc.indexOf('if (mejor) return mejor;'));
  ok(/T\.agua\(x, z\)/.test(resto) && /distRiel/.test(resto) && /obraEnPunto/.test(resto), 'sin claro: ni agua, ni vía, ni obras');
  // adentro, en una VM: entrar y salir varias veces sin sumar física ni escena; morir en la subida o en el corazón
  // te deja en el valle; guardada adentro (cota acotada a 320 m) vuelve al valle; y la púa que venía al bajar
  // por la escalera no te pincha al volver por la misma puerta
  const path = await import('node:path'), vm = await import('node:vm');
  const raiz = path.resolve(new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
  const STUB = { 'gente-cuerpo.js': 'export const materialGente = () => new THREE.MeshLambertMaterial({ vertexColors: true });' };
  const info = new Map(), orden = [], visto = new Set();
  const visitar = (f) => {
    f = path.resolve(f);
    if (visto.has(f)) return;
    visto.add(f);
    const texto = STUB[path.basename(f)] ?? fs.readFileSync(f, 'utf8');
    info.set(f, texto);
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(path.resolve(path.dirname(f), m[2]));
    orden.push(f);
  };
  visitar(path.join(raiz, 'src', 'desafio-nave-mundo.js'));
  const transformar = (f, t) => {
    const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) => `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).map((x) => x.replace(/\s+as\s+/, ': ')).join(', ')} } = ${idModulo(path.resolve(path.dirname(f), spec))};`);
    t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
    return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += ';globalThis.__N = __mod_desafio_nave_mundo; globalThis.__THREE = THREE;';
  const lienzo = () => new Proxy({}, { get: (_o, k) => (k === 'createImageData' || k === 'getImageData' ? (w, h) => ({ data: new Uint8ClampedArray(Math.max(4, (w?.width ?? w ?? 1) * (h ?? 1) * 4)) }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 1 }) : () => {}), set: () => true });
  const elem = () => ({ style: {}, classList: { add() {}, remove() {} }, append() {}, appendChild(c) { return c; }, getContext: lienzo, width: 1, height: 1, textContent: '' });
  const ctx = { console, Math, performance, document: { createElement: elem, getElementById: () => null, body: elem() }, window: {}, setTimeout, clearTimeout, localStorage: { getItem: () => null, setItem() {} } };
  ctx.globalThis = ctx; ctx.self = ctx;
  vm.runInNewContext(code, ctx);
  const THREE = ctx.__THREE, escena = new THREE.Scene(), cuerpos = [];
  const col = { agregar: (o) => cuerpos.push(o), agregarPlataforma: (o) => cuerpos.push(o), eliminarPorDuenio: (d) => { for (let i = cuerpos.length - 1; i >= 0; i--) if (cuerpos[i].duenio === d) cuerpos.splice(i, 1); } };
  const js = { pos: new THREE.Vector3(100, 10, 100), yaw: 0 }, D = { salud: 100, asedio: { nave: { x: 100, z: 100 } } };
  let heridas = 0;
  const api = { S: {}, D: () => D, aliens: [], jugador: () => ({ ubicar: (x, z, yaw, y) => { js.pos.set(x, y ?? 10, z); js.yaw = yaw; } }), guardar() {}, nota() {},
    sitioHaz: () => ({ x: 100, z: 100, y: 10 }), horaActual: () => null, claveDificultad: () => 'normal', invocar: () => null, herirJugador: () => heridas++, lanzarProyectil() {} };
  const nm = ctx.__N.crearNaveMundo({ altura: () => 10 }, escena, col, new THREE.PerspectiveCamera(), null, { ctx: { currentTime: 0 } }, api, {});
  const paso = (k) => { for (let i = 0; i < k; i++) nm.actualizar(1 / 30, { pos: js.pos, yaw: js.yaw }); };
  const luces = () => { let k = 0; escena.traverse((o) => { if (o.isLight) k++; }); return k; };
  const enValle = () => !nm.adentro && cuerpos.length === 0 && Math.abs(js.pos.y - 10) < 0.01 && Math.hypot(js.pos.x - 100, js.pos.z - 100) < 15;
  let antes = null;
  for (let v = 0; v < 3; v++) {
    nm.entrar(); paso(40);
    ok(nm.adentro && nm.enSubida && js.pos.y > 500, 'E en el pie: adentro, al pie de la escalera');
    nm.atajoCorazon(); paso(40);
    ok(nm.adentro && !nm.enSubida && nm.pelea, 'en el corazón, con la pelea');
    const ahora = `${cuerpos.length}|${escena.children.length}|${luces()}`;
    if (antes) ok(ahora === antes, `entrar varias veces no suma física, mallas ni luces (${antes} → ${ahora})`);
    antes = ahora;
    nm.bajarEscalera(); paso(30);
    const pa = nm.subida.puertaAbajo, o = nm.subida.origen;
    js.pos.set(o.x + pa.x, o.y + 0.1, o.z + pa.z);
    ok(nm.avisoCerca(js.pos) === 'Salir al valle por la puertita', 'abajo, la puertita al valle (el aviso)');
    ok(nm.usarCerca(js.pos), 'abajo, la puertita al valle (la E)');
    paso(80);
    ok(enValle(), 'de vuelta en el valle, sin la física de adentro');
  }
  nm.entrar(); paso(40); nm.alCaerAdentro(); paso(80);
  ok(enValle() && D.salud > 0, 'caído en la subida: al valle, con salud');
  nm.entrar(); paso(40); nm.atajoCorazon(); paso(40); nm.alCaerAdentro(); paso(80);
  ok(enValle(), 'caído en el corazón: al valle');
  nm.entrar(); paso(40); nm.atajoCorazon(); paso(40);
  const y = Math.min(320, js.pos.y);   // (guardado.js acota la cota)
  nm.limpiar(); js.pos.y = y; paso(1);
  ok(enValle(), 'guardada adentro: al cargar, en el valle al pie del Coihue (ni en el aire ni bajo tierra)');
  // la púa
  nm.entrar(); paso(40); nm.atajoCorazon(); paso(40);
  const a = nm.arena, p = a.puas[0];
  p.activa = true; p.t = 0.2; p.golpeo = false; p.x = js.pos.x - a.x; p.z = js.pos.z - a.z;
  nm.bajarEscalera(); paso(30);
  const pa = nm.subida.puertaArriba, o = nm.subida.origen;
  js.pos.set(o.x + pa.x, o.y + pa.y, o.z + pa.z);
  nm.entrarCorazon(); paso(90);
  ok(heridas === 0, 'la púa que venía al bajar no te pincha al volver al corazón');
  let nan = 0;
  escena.traverse((q) => { for (const k of [...q.position.toArray(), ...q.rotation.toArray().slice(0, 3), ...q.scale.toArray()]) if (!Number.isFinite(k)) nan++; });
  ok(nan === 0, 'sin NaN en el corazón, el Rey ni la subida');
}

console.log(`verificar-3-8-coihue: ${n} comprobaciones ✓`);
