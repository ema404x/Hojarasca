// 4.25.1 (C): cosas pegadas al cuerpo en las cinemáticas. Reproducido en el juego (capturas en Electron): con la pose de escena «señalar» o «saludar», Ramón (el del mate)
// levantaba el brazo derecho CON la calabaza fundida en la mano: el mate quedaba pegado a la cara o al costado de la cabeza (boca abajo), y con «encoger» la muñeca que
// pone derecha la calabaza quedaba con el giro viejo. Arreglo (src/escenas-mundo.js): quien lleva el mate gesticula con el otro brazo (`brazoLibre`, como las poses de
// quietud) y las poses que mueven los dos brazos rehacen la contra-rotación de la muñeca (`rectificarMate`).
//
// Se prueba la lógica de las poses con personajes de mentira (sin three) y, además, que el código real las use. Mutaciones: copias del módulo en memoria (data:), una por proceso
// de import, cada una tiene que hacer fallar su comprobación.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archivo = path.join(raiz, 'src', 'escenas-mundo.js');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

async function cargar(reemplazos = []) {
  let t = fs.readFileSync(archivo, 'utf8');
  for (const [a, b] of reemplazos) { assert.ok(t.includes(a), `la mutación apunta a algo que existe: ${a.slice(0, 60)}`); t = t.replace(a, b); }
  t = t.replace(/from '\.\/([\w-]+\.js)'/g, (_m, f) => `from '${pathToFileURL(path.join(raiz, 'src', f)).href}'`);
  return import('data:text/javascript;base64,' + Buffer.from(t + `\n// ${Math.random()}`).toString('base64'));
}

// personajes de mentira
const euler = () => ({ x: 0, y: 0, z: 0 });
const cuat = (nombre) => ({ nombre, copiado: null, invertido: false, copy(o) { this.copiado = o; this.invertido = false; return this; }, invert() { this.invertido = true; return this; } });
const persona = (conMate) => {
  const muneca = conMate ? { quaternion: cuat('muneca') } : null;
  const b0 = { rotation: euler(), quaternion: cuat('b0'), userData: { codo: { rotation: { x: 0 } } } };
  const b1 = { rotation: euler(), quaternion: cuat('b1'), userData: conMate ? { muneca } : { codo: { rotation: { x: 0 } } } };
  return { brazos: [b0, b1], muneca, cabeza: { rotation: euler(), position: { x: 0, y: 1.46, z: 0 } } };
};

async function comprobar(M, nombre) {
  const P = M.POSES_PROPIAS;
  // quien lleva el mate: saludar y señalar con el brazo izquierdo; el del mate no se toca
  for (const pose of ['saludo', 'senalar']) {
    const g = persona(true);
    for (let i = 0; i < 30; i++) P[pose](g, i * 0.1, 1);
    ok(g.brazos[1].rotation.x === 0 && g.brazos[1].rotation.z === 0, `${nombre}: ${pose}: el brazo del mate queda quieto (la calabaza no sube con el brazo)`);
    ok(g.brazos[0].rotation.x < -1.2, `${nombre}: ${pose}: el otro brazo se levanta`);
    ok(g.brazos[0].rotation.z <= 0, `${nombre}: ${pose}: el brazo izquierdo se abre hacia afuera (z negativa)`);
    ok(g.brazos[0].userData.codo.rotation.x < 0, `${nombre}: ${pose}: dobla el codo del brazo libre`);
  }
  { const g = persona(false); g.planilla = { visible: true };
    P.saludo(g, 1, 1);
    ok(g.brazos[1].rotation.x === 0 && g.brazos[0].rotation.x < 0, `${nombre}: con la planilla, saluda con el otro brazo`);
    const h = persona(false); h.caña = { visible: true }; P.senalar(h, 1, 1);
    ok(h.brazos[1].rotation.x === 0 && h.brazos[0].rotation.x < 0, `${nombre}: con la caña, señala con el otro brazo`); }
  // quien no lleva nada: igual que antes (brazo derecho, z positiva)
  for (const pose of ['saludo', 'senalar']) {
    const g = persona(false);
    for (let i = 0; i < 30; i++) P[pose](g, i * 0.1, 1);
    ok(g.brazos[1].rotation.x < -1.2 && g.brazos[1].rotation.z > 0, `${nombre}: ${pose}: sin mate, el brazo derecho como siempre`);
    ok(g.brazos[0].rotation.x === 0, `${nombre}: ${pose}: sin mate, el izquierdo quieto`);
  }
  // encoger: los dos brazos; la muñeca del mate se pone derecha con el giro nuevo del brazo
  { const g = persona(true); P.encoger(g, 1, 1);
    ok(g.muneca.quaternion.copiado === g.brazos[1].quaternion && g.muneca.quaternion.invertido === true, `${nombre}: encoger rehace la contra-rotación de la muñeca del mate`);
    const h = persona(false); P.encoger(h, 1, 1); ok(h.muneca === null, `${nombre}: encoger sin mate no falla`); }
  ok(typeof M.brazoLibre === 'function' && typeof M.rectificarMate === 'function', `${nombre}: exporta los ayudantes`);
}

const M0 = await cargar();
await comprobar(M0, 'real');
{ const g = persona(true); ok(M0.brazoLibre(g).b === g.brazos[0] && M0.brazoLibre(g).s === -1, 'brazoLibre: con mate, el izquierdo con signo -1'); const h = persona(false); ok(M0.brazoLibre(h).b === h.brazos[1] && M0.brazoLibre(h).s === 1, 'brazoLibre: sin mate, el derecho'); }
// la planilla y la caña no acompañan a los gestos que ocupan las manos, y se devuelven al terminar la pose o al soltar al personaje
async function comprobarObjetos(M, nombre) {
  const mk = () => ({ clave: 'graciela', pos: { set() {}, x: 0, y: 0, z: 0 }, g: { visible: true, rotation: { y: 0 } }, planilla: { visible: true }, caña: { visible: true }, brazos: [], camino: [] });
  const n = mk();
  const E = M.crearEscenasMundo({ doc: {}, gente: () => ({ gente: [n] }), jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 0 } } }), camara: {}, T: { altura: () => 0 }, col: null, progreso: () => ({}), modo: () => 'jugando' });
  const w = E.mundo;
  w.capturar('graciela');
  w.posar('graciela', 'cruzados', 5);
  ok(n.planilla.visible === false && n.caña.visible === false, `${nombre}: con los brazos cruzados la planilla y la caña se guardan`);
  w.posar('graciela', 'saludo', 5);
  ok(n.planilla.visible === true && n.caña.visible === true, `${nombre}: al cambiar a un gesto que no ocupa la mano se devuelven`);
  w.posar('graciela', 'cintura', 5);
  ok(n.planilla.visible === false, `${nombre}: a la cintura, guardada`);
  w.soltar('graciela');
  ok(n.planilla.visible === true && n.caña.visible === true, `${nombre}: al soltar al personaje (aunque la escena se corte) se devuelven`);
  w.capturar('graciela'); w.posar('graciela', 'asentir', 5);
  ok(n.planilla.visible === true, `${nombre}: asentir no toca lo que lleva`);
  w.soltar('graciela');
}
await comprobarObjetos(M0, 'real');

// las reglas del archivo
const fuente = fs.readFileSync(archivo, 'utf8');
ok(!fuente.includes('\r'), 'LF');
ok(!/ShaderMaterial|WebGLRenderTarget|\.render\(/.test(fuente), 'sin shaders, destinos de dibujo ni pasadas nuevas');

// mutaciones: cada una tiene que fallar
const MUT = [
  ['saludar con el brazo del mate', [["const brazoLibre = ", "const brazoLibre = "], ["g.brazos[1].userData.muneca || g.planilla || g.caña ? { b: g.brazos[0], s: -1 }", "false ? { b: g.brazos[0], s: -1 }"]]],
  ['señalar sin el signo del lado', [["mezclar(b.rotation, 'z', s * 0.1, w)", "mezclar(b.rotation, 'z', 0.1, w)"]]],
  ['saludar sin el signo del lado', [["mezclar(b.rotation, 'z', s * (0.42 + o * 0.22), w)", "mezclar(b.rotation, 'z', (0.42 + o * 0.22), w)"]]],
  ['encoger sin poner derecho la muñeca', [["    rectificarMate(g);   // (encoger mueve los dos brazos, también el del mate)", ""]]],
  ['poner derecho sin invertir', [["m.quaternion.copy(b.quaternion).invert();", "m.quaternion.copy(b.quaternion);"]]],
  ['el brazo libre siempre el derecho', [["? { b: g.brazos[0], s: -1 } : { b: g.brazos[1], s: 1 }", "? { b: g.brazos[1], s: 1 } : { b: g.brazos[1], s: 1 }"]]],
  ['el brazo libre sin mate es el izquierdo', [[": { b: g.brazos[1], s: 1 });", ": { b: g.brazos[0], s: -1 });"]]],
];
MUT.push(['la planilla sube con el brazo', [['userData.muneca || g.planilla || g.caña ?', 'userData.muneca ?']]]);
MUT.push(['la planilla no se guarda', [["if (OCUPAN_LA_MANO.has(pose)) guardarObjetos(c);", ""]]]);
MUT.push(['la planilla no se devuelve al soltar', [['    devolverObjetos(c);', '    void c;']]]);
MUT.push(['la planilla no se devuelve al limpiar la pose', [['    if (c) devolverObjetos(c);', '    void c;']]]);
let falladas = 0;
for (const [nombre, rep] of MUT) {
  let cayo = false;
  try { const M = await cargar(rep); await comprobar(M, 'mutada'); await comprobarObjetos(M, 'mutada'); } catch (e) { cayo = true; if (/la mutación apunta/.test(String(e.message))) throw e; }
  ok(cayo, `la mutación «${nombre}» tiene que hacer fallar una comprobación`);
  falladas++;
}
console.log(`verificar-4-25-1-c: ${pasos} comprobaciones, ${falladas} mutaciones: todas hacen fallar su comprobación`);
