// 4.1 (F2): la sección «Bruno» de Personalizar (src/personal-bruno.js) y cómo se conecta al juego.
//  · está registrada, ordenada, saneada, idempotente y sin eñe, como las demás secciones;
//  · `creado` sólo es verdadero si vino verdadero; el genoma que guarda es siempre válido;
//  · una partida nueva NO se lleva al Bruno de la vieja (cada partida, el suyo), y todo lo demás de lo personal sí;
//  · el aspecto del jugador con Bruno: el de su genoma más la ropa de abrigo de «Tu personaje» (campera, poncho, gorro, bufanda, guantes, botas);
//  · la guarda del cuello sólo va con bufanda o poncho; los anteojos son de Bruno;
//  · main.js y personal-personaje-mundo.js lo conectan (se lee el texto, como en las otras pruebas de Personalizar).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const TODO = await imp('personal-todo.js'), B = await imp('personal-bruno.js'), PJ = await imp('personal-personaje.js'), PA = await imp('personal-partida.js'), C = await imp('creador-personaje.js');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- 1. el registro
const ids = TODO.secciones().map((s) => s.id);
ok(ids.includes('bruno'), 'la sección bruno está registrada');
const s = TODO.secciones().find((x) => x.id === 'bruno');
ok(s.titulo === 'Bruno' && s.orden === 5 && s.orden < TODO.secciones().find((x) => x.id === 'personaje').orden, 'se llama Bruno y sale antes que «Tu personaje»');
ok(JSON.stringify(TODO.secciones().map((x) => x.orden)) === JSON.stringify(TODO.secciones().map((x) => x.orden).sort((a, b) => a - b)), 'las secciones siguen ordenadas');
ok(!/ñ/.test(s.id), 'sin eñe');
assert.deepEqual(s.sanear(s.porDefecto()), s.porDefecto()); ok(true, 'lo de fábrica ya está saneado');
assert.deepEqual(s.sanear(null), s.porDefecto()); ok(true, 'basura da lo de fábrica');
assert.deepEqual(s.sanear(s.sanear({ x: 1 })), s.sanear({ x: 1 })); ok(true, 'sanear es idempotente');
ok(typeof s.construir === 'function' && typeof s.aplicar === 'function', 'tiene panel y aplica al mundo');
ok(B.brunoDefecto().creado === false, 'de fábrica, Bruno todavía no fue creado');
ok(B.sanearBruno({ creado: 'sí' }).creado === false && B.sanearBruno({ creado: 1 }).creado === false && B.sanearBruno({ creado: true }).creado === true, '`creado` sólo es verdadero si vino verdadero');
ok(B.sanearBruno({ piel: 'verde', gustos: 'x' }).piel === C.genomaDefecto().piel && B.sanearBruno({ gustos: ['asado'] }).gustos.length === 2, 'el genoma que guarda es siempre válido');
const per = TODO.sanearPersonal({ bruno: { piel: 'morena', creado: true } });
ok(per.bruno.piel === 'morena' && per.bruno.creado === true, 'lo guardado de Bruno se conserva al sanear lo personal');
assert.deepEqual(TODO.sanearPersonal(null).bruno, B.brunoDefecto()); ok(true, 'una partida sin Bruno trae el de fábrica');
assert.deepEqual(TODO.sanearPersonal(null).personaje, PJ.personajeDefecto()); ok(true, 'y «Tu personaje» no cambió');

// ---------------------------------------------------------------- 2. cada partida, su Bruno
const antes = { partida: PA.partidaDefecto(), personaje: { piel: 'clara' }, bruno: { ...B.brunoDefecto(), piel: 'morena', creado: true }, bandera: { x: 1 } };
const nueva = PA.empezarConReceta(antes, {}).personal;
ok(!('bruno' in nueva), 'la partida nueva no se lleva al Bruno de la vieja');
ok(nueva.personaje.piel === 'clara' && nueva.bandera.x === 1, 'lo demás de lo personal sí pasa');
assert.deepEqual(TODO.sanearPersonal(nueva).bruno, B.brunoDefecto()); ok(true, 'y la nueva arranca con el Bruno de fábrica (sin crear)');
ok('bruno' in antes, 'lo de la partida vieja no se tocó');

// ---------------------------------------------------------------- 3. el aspecto del jugador con Bruno
const bruno = { ...B.brunoDefecto(), creado: true, piel: 'morena', pelo: 'negro', barba: 'barba', cara: 'fuerte', ojos: 'verdes', contextura: 'robusta', estatura: 'alta', accesorio: 'anteojos' };
const ropa = { ...PJ.personajeDefecto(), campera: 'musgo', gorro: false, bufanda: false, poncho: false, guantes: false, botas: 'cuero' };
const a = B.aspectoJugadorBruno(bruno, ropa);
ok(a.R.mujer === false && a.edad === 27 && a.conocido === true, 'masculino, 27 años');
ok(a.colores.piel === C.aspectoDeGenoma(bruno).colores.piel && a.colores.barba === C.aspectoDeGenoma(bruno).colores.barba && a.cara.iris === C.aspectoDeGenoma(bruno).cara.iris, 'la piel, la barba y los ojos son los de su genoma');
ok(a.cuerpo.alto > 1 && a.cuerpo.ancho > 1, 'su físico (alto y robusto) viene del genoma');
ok(a.colores.anteojos === true, 'los anteojos son suyos');
ok(a.colores.ropa === PJ.aspecto(ropa).campera && a.colores.abrigo === a.colores.ropa, 'la campera es la de «Tu personaje», no la del genoma');
ok(a.colores.bufanda === null && a.colores.gorro === null && a.colores.poncho === null && a.R.guantes === null, 'sin gorro, bufanda, poncho ni guantes en «Tu personaje», no los lleva');
ok(!a.guardas.cuello && !a.guardas.poncho && !!a.guardas.puno, 'sin bufanda ni poncho no hay guarda en el cuello');
ok(a.R.botas === 'altas' && a.R.botaCol === PJ.aspecto(ropa).botas, 'botas de cuero, con su color');
const b = B.aspectoJugadorBruno(bruno, { ...ropa, gorro: true, colorGorro: 'ocre', bufanda: true, colorBufanda: 'crudo', poncho: true, colorPoncho: 'gris', guantes: true, botas: 'goma' });
ok(b.colores.gorro === 'gorroPunto' && b.colores.gorroColor === PJ.aspecto({ ...ropa, gorro: true, colorGorro: 'ocre' }).gorro, 'el gorro de lana, con su color');
ok(!!b.colores.bufanda && !!b.colores.poncho && !!b.R.guantes, 'con bufanda, poncho y guantes puestos, los lleva');
ok(!!b.guardas.cuello && !!b.guardas.poncho, 'con bufanda y poncho, sí hay guarda en el cuello y en el poncho');
ok(b.R.botas === 'goma', 'las botas de goma');
ok(B.aspectoJugadorBruno(bruno, undefined).colores.ropa === PJ.aspecto(undefined).campera, 'sin lo de «Tu personaje», la ropa de fábrica');
for (const raro of [undefined, null, 5, 'x', []]) ok(!!B.aspectoJugadorBruno(raro, raro).colores.piel, `con ${JSON.stringify(raro)} sigue armando un aspecto`);
ok(B.pielDeBruno(bruno) === C.aspectoDeGenoma(bruno).colores.piel && /^#[0-9a-f]{6}$/i.test(B.pielDeBruno(undefined)), 'el color de piel para la mano');
ok(B.aspectoJugadorBruno(bruno, ropa).R.pantalon === PJ.aspecto(ropa).pantalon, 'el pantalón es el de siempre');

// ---------------------------------------------------------------- 4. la conexión con el juego (se lee el texto)
const main = leer('src/main.js'), mundo = leer('src/personal-personaje-mundo.js'), todo = leer('src/personal-todo.js'), partida = leer('src/personal-partida.js'), bruSrc = leer('src/personal-bruno.js');
ok(/import \{ SECCION_BRUNO \} from '\.\/personal-bruno\.js';/.test(todo), 'personal-todo.js importa la sección con nombre, en una línea (armar.mjs sólo entiende eso)');
ok(/bruno: \{ aplicar: \(b\) => \{[^}]*cuerpoJugador\?\.aplicar\(d, b\); manoPropia\?\.aplicar\(d, b\);/.test(main), 'main.js rearma el cuerpo y la mano cuando cambia Bruno');
ok(/personaje: \{ aplicar: \(d\) => \{ const b = progreso\.personal\?\.bruno; cuerpoJugador\?\.aplicar\(d, b\); manoPropia\?\.aplicar\(d, b\);/.test(main), 'y también cuando cambia «Tu personaje», pasándole a Bruno');
ok(/aspectoJugadorBruno/.test(mundo) && /bruno && bruno\.creado/.test(mundo) && /pielDeBruno/.test(mundo), 'el cuerpo y la mano usan a Bruno sólo cuando ya fue creado');
ok(/aspectoJugador\(aspecto\(datos\)\)/.test(mundo), 'sin Bruno creado, el cuerpo sigue como siempre');
ok(/const firma = JSON\.stringify\(\[d, b\]\)/.test(mundo), 'no se rearma el cuerpo si no cambió nada (dos secciones lo piden)');
ok(/const \{ bruno: _brunoViejo, \.\.\.resto \} = p;/.test(partida), 'la partida nueva deja afuera al Bruno de la vieja');
for (const [n, t] of [['personal-bruno.js', bruSrc], ['personal-personaje-mundo.js', mundo], ['personal-partida.js', partida]]) {
  ok(!t.includes('\r'), `${n}: fines de línea LF`);
  ok(!/^export\s+(?:const|let|function|class)\s+\S*ñ/m.test(t), `${n}: lo exportado, sin ñ`);
}
ok(bruSrc.split(String.fromCharCode(10)).filter((l) => l.startsWith('import ')).every((l) => l.endsWith(';') && !l.includes('//') && l.includes(' from ')), 'los imports de personal-bruno.js entran en una línea y sin comentario (armar.mjs)');

// ---------------------------------------------------------------- 5. la pantalla de creación, enganchada al juego (se lee el texto; lo dinámico lo prueba humo-4-1-creador.cjs)
const pantalla = leer('src/creador-pantalla.js'), pp = leer('src/personal-personaje.js');
const tiene = (t, x) => t.includes(x);
ok(tiene(pantalla, 'export function abrirCreador(') && tiene(pantalla, 'renderer.dispose()'), 'la pantalla exporta abrirCreador y libera su dibujante al cerrar');
ok(tiene(pantalla, "window.removeEventListener('keydown', alTeclear, true)") && tiene(pantalla, "window.removeEventListener('keyup', alSoltarTecla, true)"), 'al cerrar quita las dos escuchas de teclas (si no, el juego queda sin teclado)');
ok(tiene(pantalla, "modo === 'rehacer'") && tiene(pantalla, 'bloquesDe'), 'rehacer muestra sólo el aspecto y no la ropa de abrigo');
ok(tiene(main, "import { abrirCreador } from './creador-pantalla.js';") && tiene(main, "import { genomaDesdePersonajeViejo } from './creador-personaje.js';"), 'main.js importa la pantalla y la precarga, cada uno en una línea');
ok(tiene(main, "if (!sinCreadorDeBruno() && !progreso.personal?.bruno?.creado) { crearABruno('crear', () => $('btn-entrar').click()); return; }"), '«Entrar al bosque» pide crear a Bruno si todavía no está creado, y entra solo al terminar');
ok(tiene(main, "const sinCreadorDeBruno = () => HOJARASCA_DEBUG && new URLSearchParams(location.search).get('creador') !== '1';"), 'sólo en depuración se puede saltar la creación (las pruebas de humo viejas), y con &creador=1 se prueba');
ok(tiene(main, "cambiarPersonal(sPersonaje, { campera: g.campera, gorro: g.accesorio === 'gorro' || !!personaje.gorro, bufanda: g.accesorio === 'bufanda' || !!personaje.bufanda })"), 'al crear, la campera y el accesorio pasan a «Tu personaje»');
ok(tiene(main, "if (modo === 'crear') cambiarPersonal"), 'al rehacer no se toca la ropa');
ok(tiene(main, 'genomaDesdePersonajeViejo(personaje)'), 'al crear se parte de lo que el jugador ya había elegido en «Tu personaje»');
ok(tiene(main, 'if (creadorAbierto) return;'), 'sólo una pantalla de creación a la vez');
ok(tiene(main, 'abrirCreador: () => crearABruno('), 'el botón temporal del panel de Bruno abre crear o rehacer');
ok(tiene(pp, 'api.progreso?.personal?.bruno?.creado') && tiene(pp, 'se rehacen en el espejo del refugio'), '«Tu personaje» oculta piel, pelo, peinado y contextura cuando Bruno ya fue creado');
ok(tiene(pp, "fila(cont, 'Campera'") && tiene(pp, "fila(cont, 'Botas'"), 'y conserva la ropa de abrigo');
ok(!pantalla.includes('\r'), 'creador-pantalla.js: fines de línea LF');
ok(!/^export\s+(?:const|let|function|class)\s+\S*ñ/m.test(pantalla), 'creador-pantalla.js: lo exportado, sin ñ');
ok(pantalla.split('\n').filter((l) => l.startsWith('import ')).every((l) => /^import (\{[^}]+\}|\* as THREE) from '[^']+';$/.test(l)), 'creador-pantalla.js: los imports entran en una línea y sin comentario (armar.mjs)');

console.log(`OK 4.1 Bruno en Personalizar · ${pasos} verificaciones · registro, saneo, cada partida su Bruno, aspecto del jugador con la ropa de «Tu personaje» y la conexión con el juego`);
