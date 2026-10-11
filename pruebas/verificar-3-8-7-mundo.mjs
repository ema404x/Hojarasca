// 3.8.7 (mundo): el pase de bugs del mundo, el movimiento, el HUD jugando, el sonido del mundo y los vehículos.
// Una comprobación (o varias) por arreglo. Lo que necesita el mundo 3D está en pruebas/humo-3-8-7-mundo.cjs.
//  1. Las notas: una igual a otra que se ve no se apila; con más de cuatro se va la más vieja que no es importante; el
//     «✓ Guardado» va en la columna de las notas (se encimaba con la segunda).
//  2. El HUD con la letra grande: los sonidos escritos no se agrandan dos veces; la mochila, el almacén y la charla no se
//     salen; la nota no pisa la brújula; las barras de vida, la rueda y los renglones de los vecinos van en px del #hud.
//  3. Los subtítulos se van solos y suben el aviso de la tecla, el estado y los sonidos escritos (se enciman).
//  4. La chincheta en la brújula se ve aunque esté atrás, con la flecha del lado para el que hay que girar.
//  5. Volver a la portada y entrar otra vez no repite el arranque (en el Desafío, el mapa y el código).
//  6. La portada no suena «adentro»; la música de tensión del Desafío se apaga en la portada; las ranitas no croan con el
//     mallín helado; el alero del arriero suena a roca, no a cueva honda, y sólo abajo de la roca.
//  7. Los pasos según el suelo: la laja y la escalera de piedra suenan a piedra, el césped de la plaza a pasto (o nieve);
//     todos los pasos se preparan de antemano.
//  8. Vehículos: el cuadro del caballo en el puente se maneja con el mando y con Tab+Enter; arriba del sulky el clic derecho
//     no tala ni planta, y desde el tren o el kayak no se prende fuego; los planos no quedan trabados al subir; el mando
//     desenchufado en un menú suelta el stick.
//  9. Nada para juntar más allá de donde se puede caminar; el árbol seco no ofrece «Anotar undefined».
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const src = (f) => import(new URL(`../src/${f}`, import.meta.url));
let pasos = 0;
const ok = (c, t) => { assert.ok(c, t); pasos++; };
const eq = (a, b, t) => { assert.deepEqual(a, b, t); pasos++; };
const main = leer('src/main.js'), html = leer('src/plantilla.html'), css = leer('src/menus/sistema.css');
const funcion = (texto, nombre) => { const i = texto.indexOf(`function ${nombre}(`); assert.ok(i >= 0, `falta ${nombre}`); return texto.slice(i, texto.indexOf('\n}\n', i) + 2); };

// 1. las notas
{
  const A = await src('accesibilidad.js');
  const v = [{ titulo: 'No hay orilla cerca', texto: 'Acercate a la costa' }, { titulo: 'Día 3', texto: 'Amanece', importante: true }];
  eq(A.notaRepetida(v, 'No hay orilla cerca', 'Acercate a la costa'), 0, 'la misma nota, todavía a la vista: se refresca ésa');
  eq(A.notaRepetida(v, 'No hay orilla cerca', 'otra cosa'), -1, 'con otro texto es otra nota');
  eq(A.notaRepetida(null, 'x', ''), -1, 'sin notas, ninguna');
  const cinco = [{ importante: true }, { importante: false }, { importante: true }, {}, {}];
  eq(A.notaASacar(cinco), 1, 'con cinco, se va la más vieja que no es importante (la carta del tren se quedaba sin leer)');
  eq(A.notaASacar([{ importante: true }, { importante: true }, { importante: true }, { importante: true }, { importante: true }]), 0, 'si todas son importantes, la más vieja');
  eq(A.notaASacar([{}, {}, {}, {}]), -1, 'con cuatro no se saca ninguna');
  eq(A.notaASacar([{ importante: true }, { importante: true }, { importante: true }, { importante: true }, {}]), 0, 'con cuatro importantes, la nota nueva (no importante) no se va al instante: se va la más vieja');
  const nota = funcion(main, 'nota');
  ok(nota.includes('notaRepetida(') && nota.includes('notaASacar(') && nota.includes("querySelectorAll('.nota')"), 'nota() usa las dos y cuenta sólo las notas');
  ok(!/children\.length > 4/.test(nota), 'ya no saca el primer hijo a ciegas (podía ser el «✓ Guardado»)');
  ok(/<div class="notas" id="notas"><div class="guardado-hud" id="guardado-hud">/.test(html), 'el «✓ Guardado» va adentro de la columna de las notas');
  ok(/\.guardado-hud \{ order: 99;/.test(html) && !/\.guardado-hud \{ position: absolute; right: 28px; top: 74px/.test(html), 'debajo de la última nota, no fijo a 74 px');
}

// 2. el HUD con la letra grande
{
  ok(/\.sonidos-escritos p \{[^}]*font-size: 17px;/.test(html) && !/17px \* var\(--escala-letra/.test(html), 'los sonidos escritos no se agrandan dos veces (#hud ya tiene el zoom)');
  ok(css.includes(':root[data-menu] .mochila { width: min(var(--ancho-medio), calc(92vw / var(--zoom)));'), 'la mochila descuenta el zoom en el ancho');
  ok(css.includes(':root[data-menu] :is(.trueque, .charla) { width: min(var(--ancho-medio), calc(86vw / var(--zoom)));'), 'el almacén y la charla también');
  ok(/\.nota \{[^}]*max-width: max\(180px, min\(340px, calc\(50vw \/ var\(--escala-letra, 1\) - 226px\)\)\)/.test(html), 'la nota no llega a la brújula');
  ok(main.includes("raiz.dataset.escalaLetra = String(escalaFinal("), 'la escala del #hud queda a mano');
  ok(/innerWidth \/ z\}px/.test(leer('src/desafio.js')) && /innerHeight \/ z\}px/.test(leer('src/desafio.js')), 'las barras de vida de los duendes, en px del #hud');
  ok(/const w = window\.innerWidth \/ z, h = window\.innerHeight \/ z;/.test(leer('src/social-mundo.js')), 'los renglones de los vecinos, igual');
  const rueda = funcion(main, 'ubicarRueda');
  ok(rueda.includes('dataset.escalaLetra') && rueda.includes('translate(${Math.round(x / z)}px, ${Math.round(y / z)}px)'), 'la rueda de la charla, igual');
}

// 3. los subtítulos
{
  const d = funcion(main, 'dibujarSubtitulos');
  ok(/const SUBTITULO_VIVE = 12000;/.test(main) && d.includes('SUBTITULO_VIVE') && d.includes('setTimeout(dibujarSubtitulos'), 'los subtítulos se van solos');
  ok(d.includes("'--alto-subtitulos'"), 'y dicen cuánto miden');
  ok(main.includes('importante: nueva, t: performance.now() }'), 'cada aviso anota cuándo se dijo');
  for (const sel of ['.aviso { position: absolute; left: 50%; bottom: calc(max(13vh, 124px) + var(--alto-subtitulos, 0px));',
    '.estado { position: absolute; left: 50%; bottom: calc(94px + var(--alto-subtitulos, 0px));',
    '.sonidos-escritos { position: absolute; left: 50%; bottom: calc(max(13vh, 124px) + 56px + var(--alto-subtitulos, 0px));']) ok(html.includes(sel), `sube: ${sel.slice(0, 16)}`);
}

// 4. la chincheta
{
  const b = funcion(main, 'actualizarBrujula');
  ok(b.includes('Math.max(-0.6, Math.min(0.6, r.ang))') && !b.includes('Math.max(-1.25, Math.min(1.25, r.ang))'), 'el rumbo no cae en los bordes que la brújula funde');
  ok(b.includes("girar && r.ang > 0 ? '← ' : ''") && b.includes("girar && r.ang <= 0 ? ' →' : ''"), 'la flecha, del lado para el que hay que girar');
}

// 5. volver a entrar
{
  ok(/function partidaEmpezada\(\) \{ return !!\(habiaGuardado && progreso\.pos\) \|\| entroAlJuego \|\|/.test(main), 'ya entrado, la partida está empezada (no se rehace el mapa ni se cambia el código)');
  ok(main.includes("else if (esDesafio && (!habiaGuardado || !progreso.pos) && !entroAlJuego) {") && main.includes("else if ((!habiaGuardado || !progreso.pos) && !entroAlJuego) setTimeout(() => nota('Salí a caminar."), 'las notas del primer día, una vez');
}

// 6. el sonido del mundo
{
  ok(main.includes("espacioAudioActual = enPortada ? 'bosque' : espacioDeAudio();") && main.includes('techoAudioActual = enPortada ? null : techoDeAudio();'), 'en la portada no se suena «adentro»');
  ok(/musicaQuieta: \(dtReal\) => musica\.actualizar\(dtReal, \{ activo: false \}\)/.test(leer('src/desafio.js')) && main.includes("if (desafio && modo === 'inicio') desafio.musicaQuieta?."), 'la música de tensión se apaga en la portada');
  // la música de verdad: sin `activo`, el nivel baja a cero y se desmonta sola
  const { crearMusicaTension } = await src('desafio-musica.js');
  ok(typeof crearMusicaTension === 'function', 'la música de tensión se puede crear');
  ok(/e\.noche > 0\.6 && e\.cercaMallin && e\.invierno < 0\.5/.test(leer('src/sonido.js')), 'con el mallín helado no croan las ranitas');
  const L = await src('techo-lluvia.js');
  ok(L.ESPACIOS.roca && L.ESPACIOS.roca.reverb === 'adentro' && L.ESPACIOS.roca.lluvia > L.ESPACIOS.cueva.lluvia, 'bajo la roca del alero: eco corto, y algo de afuera');
  const roca = funcion(main, 'bajoLaRoca');
  ok(roca.includes('c.pared') && roca.includes('Math.abs(pos.y - '), 'y sólo abajo de la roca, a su altura (no en el cerro de arriba)');
  ok(funcion(main, 'espacioDeAudio').includes("if (bajoLaRoca(js.pos)) return 'roca';") && !funcion(main, 'espacioDeAudio').includes("return 'cueva'"), 'el alero ya no es «cueva»');
}

// 7. los pasos
{
  const jug = leer('src/jugador.js');
  ok(jug.includes("if (plat) estado.superficie = plat.suelo === 'pasto' && opciones.invierno() > 0.5 ? 'nieve' : plat.suelo || 'madera';"), 'la plataforma dice de qué es');
  const ar = leer('src/aldea-arquitectura.js');
  ok(ar.includes("K.plataforma(0, 0, W, D, 0.02, 0.1, 0, { suelo: 'pasto' });") && ar.includes("{ radio: RC + 0.1, suelo: 'piedra' }") && ar.includes("K.plataforma(s.u[0] * m, s.u[1] * m, L, A, 0.07, 0.12, giro, { suelo: 'piedra' });"), 'la plaza: césped, la laja del centro y las sendas');
  ok(ar.includes("K.plataforma(xP, zc, ancho, pisada + 0.02, y1, 0.3, 0, { suelo: 'piedra' });"), 'la escalinata de laja');
  const es = leer('src/estructuras.js');
  ok((es.match(/suelo: 'piedra'/g) || []).length >= 2 && es.includes("espesor: 0.40, suelo: 'tierra'"), 'el alero: arena y roca');
  ok(leer('src/trochita.js').includes("espesor: alto, suelo: 'piedra'"), 'los escalones de piedra del andén');
  const { SUELOS } = await src('sonido-sintesis.js');
  for (const s of ['piedra', 'tierra', 'pasto', 'nieve']) ok(!!SUELOS[s], `hay pisada de ${s}`);
  const son = leer('src/sonido.js');
  ok(son.includes("for (const sup of ['piedra', 'nieve', 'escarcha', 'hojas', 'agua']) this.variantes(`paso-${sup}-p`") && son.includes("this.variantes(`paso-${sup}-c`, 3,"), 'todos los pasos se preparan en la cola (el primero no se sintetiza en medio del cuadro)');
  // el registro de la aldea conserva el `suelo` de cada plataforma
  ok(/const n = \{ \.\.\.p, x: q\.x, z: q\.z/.test(ar), 'registrarEnMundo copia la plataforma entera');
}

// 8. vehículos
{
  const { crearColaDialogos, bordesMando } = await src('dialogo.js');
  const c = crearColaDialogos({ mostrar() {}, ocultar() {}, valor: () => '' });
  const p = c.confirmar('¿Lo mandás o lo amarrás?', { si: 'Mandarlo al refugio', no: 'Amarrarlo acá', cancelado: null });
  ok(c.tecla('Enter', true), 'Enter con el foco en el segundo botón');
  eq(await p, false, 'es ese botón («Amarrarlo acá»), no el primero');
  const p2 = c.confirmar('¿Y ahora?', { cancelado: null });
  c.tecla('Enter'); eq(await p2, true, 'Enter sin foco en el segundo, el primero');
  const pad = (b) => [{ connected: true, buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: b.includes(i) })) }];
  ok(bordesMando(pad([14]), null).cambiar && bordesMando(pad([5]), null).cambiar, 'la cruceta o RB pasan de botón');
  ok(!bordesMando(pad([14]), { cambiar: true }).cambiar, 'sólo al apretar');
  const dlg = leer('src/dialogo.js');
  ok(dlg.includes('if (b.aceptar) apretarElegido();') && dlg.includes("documento.activeElement === $('dialogo-no') ? cola.rechazar() : cola.aceptar()"), 'A aprieta el botón que tiene el foco');
  const usar = funcion(main, 'usarRanura');
  ok(/if \(js\.enSulky && \['carpa', 'hacha', 'aserrar', 'fuego', 'plantar-pehuen', 'plantar-coihue', 'plantar', 'cocinar'\]\.includes\(r\.accion\)\)/.test(usar), 'arriba del sulky el clic derecho no tala, no planta ni prende fuego');
  ok(usar.includes("if ((js.enKayak || js.enTren) && (r.accion === 'fuego' || r.accion === 'cocinar')) return;"), 'en el kayak o el tren, ni fuego ni cocinar');
  ok(main.includes('if (!js.enKayak && !js.enTren) encenderFuego();'), 'la F tampoco desde el tren');
  ok(main.includes("&& !(codigo === 'KeyO' && modoObra)) { nota('Con las riendas en la mano, no', `Bajate ${caballoDicho('de')} con E`)") && main.includes("&& !(codigo === 'KeyO' && modoObra)) { nota('Con las riendas en la mano, no', 'Bajate del sulky con E')"), 'subido, la O que cierra los planos pasa');
  ok(funcion(main, 'montar').includes('if (modoObra) abrirObra(false);') && main.includes('if (js.enSulky && modoObra) abrirObra(false);'), 'y subir cierra los planos');
  const cambio = funcion(main, 'cambioDeMando');
  ok(cambio.includes('pisadasMando.clear()') && cambio.includes("'Se desconectó el mando'"), 'desenchufar suelta el stick y avisa');
  for (const f of ['leerMando', 'leerMandoQuieto', 'leerMandoEnMenu']) ok(funcion(main, f).includes('cambioDeMando(m);'), `en cualquier pantalla (${f})`);
}

// 9. nada para juntar fuera de alcance
{
  const o = leer('src/objetos.js');
  ok(o.includes('const fueraDeAlcance = (x, z) => Math.abs(x) > LIMITE + 1.5 || Math.abs(z) > LIMITE + 1.5;') && o.includes('if (fueraDeAlcance(x, z)) return;'), 'poner() no deja nada más allá del borde');
  ok(o.includes('if (fueraDeAlcance(a.x, a.z)) { r(); return; }'), 'ni llao llao en los árboles del borde (con el mismo azar para los demás)');
  const { LIMITE } = await src('config.js');
  ok(LIMITE + 1.5 + 2.7 < 476, 'lo que queda se alcanza estirando el brazo desde el borde');
}

// 9b. el árbol seco
{
  const o = leer('src/objetos.js');
  ok(o.includes('if (!Object.hasOwn(NOMBRE_ESPECIE, a.especie)) continue;'), 'el árbol seco no ofrece «Anotar undefined» (ni anota una entrada que no existe)');
  ok(main.includes("'Pasó la medianoche'") && !main.includes("'Amanece otra vez'"), 'a las 00:00 no «amanece»');
}


console.log(`OK 3.8.7 mundo · ${pasos} verificaciones`);
