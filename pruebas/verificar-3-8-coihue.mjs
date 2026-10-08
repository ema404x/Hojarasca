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
  ok(!/api\.crearMallaNave\(\)/.test(eventos) && !/api\.crearMallaNave\(\)/.test(asedio), 'ni la noche final ni el asedio usan la malla de la nave');
  tiene(eventos, 'n.position.copy(co.brasas[i]);', 'los tres núcleos van en el tronco (nudos de ámbar)');
  tiene(eventos, 'animarCoihue(n, n.reloj, paso);', 'camina con sus raíces');
  ok(/const COIHUE_NOCHE = \{ desde: \d+, hasta: \d+, llegar: 7, irse: 6 \};/.test(eventos), 'llega y se va en el tiempo de siempre (7 s y 6 s: las tandas de las pruebas)');
  tiene(eventos, "if (n.largar <= 0) { n.largar = 38; api.largarDesde(n.x, n.z); }", 'larga duendes cada 38 s, como la nave');
  tiene(eventos, 'api.D().nodriza = null;', 'al caer se borra la nodriza (como siempre)');
  tiene(eventos, 'get coihue() { return nodriza; },', 'las pruebas ven el Coihue de la noche final');
  // el asedio: plantado, mira a tu base, la puerta grande es el «haz», raíces en las zonas
  tiene(asedio, 'const co = armarCoihueViejo();', 'el asedio planta el Coihue');
  tiene(asedio, 'return { ...co, haz: co.puerta, luces: [], escudo, luz, giro, t: 0, caida: 0, cayendo: 0, alCaer: null };', 'el haz es la puerta grande (y las pruebas siguen viendo armado.nave.haz)');
  tiene(asedio, 'n.haz.visible = abierto;', 'la puerta se enciende cuando se puede subir');
  tiene(asedio, 'aguja.add(mallaRaizAguja());', 'las agujas son raíces que brotaron');
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
  tiene(nave, 'const subida = armarSubida();', 'la escalera de raíces del tronco hueco');
  tiene(formas, "for (const h of ['torso', 'cabeza', 'brazo0', 'brazo1'])", 'el Rey tiene huesos (torso, cabeza, brazos)');
  for (const p of ['lanzar', 'llamar', 'golpe', 'senalar', 'herido']) ok(nave.includes(`poseRey.nombre === '${p}'`), `pose del Rey: ${p}`);
  tiene(nave, "if (h === 'disparo') { disparar(js); posar('lanzar', 0.7); }", 'las poses acompañan lo que hace');
  // la subida entra en los 2,5 s que las pruebas esperan después de E
  const s = nave.match(/const SUBIDA = \{ fundido: ([\d.]+), dura: ([\d.]+) \};/);
  ok(s && Number(s[1]) + Number(s[2]) <= 2.3, `la subida dura menos de 2,3 s (${s && (Number(s[1]) + Number(s[2]))} s)`);
  tiene(nave, 'if (u < 1) camaraSubida(u, js);', 'la cámara sube por la escalera');
  tiene(nave, 'js.pos.x = sal.x; js.pos.z = sal.z; js.pos.y = arena.y;', 'mientras sube, quedás quieto en la puerta de arriba');
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

console.log(`verificar-3-8-coihue: ${n} comprobaciones ✓`);
