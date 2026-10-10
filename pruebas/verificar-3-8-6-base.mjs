// 3.8.6 (base): el pase de bugs de lo transversal (guardado y carga, menús, mando, calidad, rendimiento y Electron),
// sin Electron. Una comprobación (o varias) por arreglo; lo que necesita el juego de verdad está en humo-3-8-6-base.cjs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// un localStorage de mentira, para el guardado en Node
const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => { almacen.set(k, String(v)); },
  removeItem: (k) => { almacen.delete(k); },
  key: (i) => [...almacen.keys()][i] ?? null,
  get length() { return almacen.size; },
};
const G = await import('../src/guardado.js');
const requerir = createRequire(import.meta.url);

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const main = leer('src/main.js');
const tramo = (desde, largo = 3000) => { const i = main.indexOf(desde); assert.ok(i >= 0, `no está: ${desde}`); return main.slice(i, i + largo); };

// 1. El mando se lee una vez por cuadro en cualquier pantalla. Antes: (a) en un cuadro de pregunta, la tarjeta del valle o la
//    victoria no se leía, y el botón con el que se cerraban (A o B) contaba como recién apretado al volver (saltar,
//    agacharse, o cerrar también la pausa); (b) en el tren o el kayak con la pausa abierta se leía dos veces por cuadro y
//    Start y B no sacaban de la pausa; (c) con el mando solo, la tarjeta del valle y la victoria no se podían manejar.
{
  const actual = tramo('function leerMandoActual() {', 200);
  ok(/if \(mandoLeido\) return mando\.estado\(\);\s*mandoLeido = true;\s*return mando\.actualizar\(\);/.test(actual), 'una sola lectura por cuadro');
  ok((main.match(/mando\.actualizar\(\)/g) || []).length === 2 && /alCerrar: \(\) => \{[\s\S]{0,500}try \{ mando\.actualizar\(\); \} catch/.test(main), 'nadie más lee el mando por su lado (salvo al cerrar un cuadro de pregunta, que lo lee entre dos cuadros)');
  ok(/const m = leerMandoActual\(\);/.test(tramo('function leerMando(dt) {', 120)), 'jugando, por la lectura única');
  const menu = tramo('function leerMandoEnMenu() {', 500);
  ok(/const m = leerMandoActual\(\);/.test(menu) && menu.includes('if (dialogos.abierto()) return;'), 'en la pausa, por la lectura única y sin pisar al cuadro de pregunta');
  ok(/leerMandoEnMenu\(\);[^\n]*\n\s*if \(!mandoLeido\) leerMandoQuieto\(\);[^\n]*\n\s*mandoLeido = false;/.test(main), 'el bucle lee el mando en cualquier otra pantalla y se prepara para el cuadro siguiente');
  const quieto = tramo('function leerMandoQuieto() {', 1400);
  ok(quieto.includes("modo === 'valle' ? valle?.tarjetas?.velo : modo === 'victoria' ? $('victoria')"), 'la tarjeta del valle y la victoria, con el mando');
  ok(quieto.includes('moverFocoEn(caja, mover)') && quieto.includes('b.click()'), 'la cruceta pasa de botón y A lo aprieta');
  ok(quieto.includes("if (m.recien.agacharse && modo === 'valle') golpeDeTecla('Escape');"), 'B cierra las tarjetas de un botón (como Esc)');
}

// 2. Las fotos del álbum (en archivos desde la 3.8.4): guardar sólo agrega. Antes cada guardado dejaba en la carpeta
//    exactamente las que tenía en memoria, y una foto que no se pudo leer al abrir (el archivo ocupado un instante por el
//    antivirus, el disco que no respondió) se borraba para siempre en el primer guardado. Y sin releer el disco: empaquetar
//    la partida (la carpeta sincronizada, cada 2 minutos) releía el álbum entero, y cada foto nueva lo escribía dos veces.
{
  const FM = requerir('../fotos-main.cjs');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-fotos-386-'));
  const jpg = (s) => `data:image/jpeg;base64,${Buffer.from(s).toString('base64')}`;
  const png = (s) => `data:image/png;base64,${Buffer.from(s).toString('base64')}`;
  try {
    const K = 'hojarasca-p2-fotos-v1', dir = () => FM.carpetaFotos(base, K);
    // fotos-main: sin reemplazar no borra; reemplazando, sí; otro formato de la misma foto no deja dos
    ok(FM.escribirFotos(base, K, { lago: jpg('a'), faro: jpg('b') }), 'se escriben dos');
    ok(FM.escribirFotos(base, K, { condor: jpg('c') }, { reemplazar: false }) && fs.readdirSync(dir()).length === 3, 'agregar una no borra las otras');
    ok(FM.escribirFotos(base, K, { condor: png('c2') }, { reemplazar: false }) && fs.readdirSync(dir()).sort().join() === 'condor.png,faro.jpg,lago.jpg', 'la misma foto en otro formato reemplaza a la vieja');
    ok(FM.escribirFotos(base, K, { lago: jpg('a') }) && fs.readdirSync(dir()).join() === 'lago.jpg', 'reemplazando (importar), quedan sólo esas');
    // el guardado, con el puente de preload.cjs ({ fotos, sinLeer }) que cuenta las idas al disco y una lectura que pierde una foto
    let lecturas = 0, escrituras = 0, pierde = null;
    globalThis.hojarasca = { fotos: {
      leer: (k) => { lecturas++; const r = FM.leerFotosConInforme(base, k); if (pierde && r && r.fotos[pierde]) { delete r.fotos[pierde]; r.sinLeer++; } return r; },
      escribir: (k, f, o) => { escrituras++; return FM.escribirFotos(base, k, f, o); },
      borrar: (k) => FM.borrarFotos(base, k),
    } };
    const p = { ...G.progresoNuevo(), dia: 4, desafios: { lago: { dia: 2, hora: 9 }, faro: { dia: 3, hora: 21 } } };
    ok(G.escribirPartida('relax', 2, p, { lago: jpg('a'), faro: jpg('b') }), 'una partida con dos fotos');
    // otra vez el juego, recién abierto (otra copia del módulo: nada en memoria)
    const G2 = await import('../src/guardado.js?abierto-de-nuevo');
    G2.usarModoGuardado('relax', 2);
    pierde = 'faro';   // el archivo, ocupado justo al abrir
    const cargada = G2.cargarProgreso();
    pierde = null;
    ok(cargada.desafios.lago.img && !cargada.desafios.faro.img, '(al abrir, la del faro no se pudo leer)');
    cargada.desafios.condor = { dia: 4, hora: 10, img: jpg('c') };
    ok(G2.guardarFotos(cargada.desafios) && G2.guardarProgreso(cargada), 'una foto nueva y a guardar');
    ok(fs.readdirSync(dir()).sort().join() === 'condor.jpg,faro.jpg,lago.jpg', 'la que no se pudo leer sigue en el disco');
    ok(Object.keys(G2.leerPartida('relax', 2).fotos).sort().join() === 'condor,faro,lago', 'y con el álbum a medio leer, empaquetar vuelve al disco (no se pierde al exportar)');
    // abierto otra vez, todo se lee bien: de ahí en más, en memoria
    const G3 = await import('../src/guardado.js?abierto-otra-vez');
    G3.usarModoGuardado('relax', 2);
    const c3 = G3.cargarProgreso();
    ok(c3.desafios.faro.img && c3.desafios.condor.img, 'abierta de nuevo, están las tres');
    const antes = { lecturas, escrituras };
    ok(G3.guardarFotos(c3.desafios) && escrituras === antes.escrituras, 'guardar lo mismo no va al disco');
    c3.desafios.cisne = { dia: 5, hora: 8, img: jpg('d') };
    let mandadas = null;
    const escribirReal = globalThis.hojarasca.fotos.escribir;
    globalThis.hojarasca.fotos.escribir = (k, f, o) => { mandadas = Object.keys(f); return escribirReal(k, f, o); };
    ok(G3.guardarFotos(c3.desafios) && mandadas?.join() === 'cisne' && G3.guardarFotos(c3.desafios), 'una foto nueva: va sólo ésa, y una vez');
    globalThis.hojarasca.fotos.escribir = escribirReal;
    const paquete = G3.leerPartida('relax', 2);
    ok(lecturas === antes.lecturas && Object.keys(paquete.fotos).sort().join() === 'cisne,condor,faro,lago', 'empaquetar (la carpeta sincronizada, cada 2 minutos) no relee el álbum del disco');
    G3.borrarPartida('relax', 2);
    ok(!fs.existsSync(dir()) && G3.leerPartida('relax', 2) === null && Object.keys(G3.cargarFotos()).length === 0, 'borrar la partida borra sus fotos (y lo que había en memoria)');
    for (const g of [G, G2, G3]) g.usarModoGuardado('relax', 1);
  } finally { delete globalThis.hojarasca; fs.rmSync(base, { recursive: true, force: true }); }
  ok(leer('preload.cjs').includes("{ reemplazar: opciones?.reemplazar !== false }") && leer('fotos-main.cjs').includes("escribirFotos(base(), String(clave || ''), fotos, { reemplazar: opciones?.reemplazar !== false })"), 'el puente pasa si se reemplaza');
}

// 3. El sello de cuándo se guardó (guardadoEn) nunca va para atrás en una partida. La carpeta sincronizada compara sellos de
//    dos computadoras: con la de acá atrasada, lo jugado acá quedaba «más viejo» que lo que la otra ya había visto y la otra lo
//    pisaba sin preguntar. Ahora: no menos que el guardado anterior + 1 ni que el de la partida importada.
{
  const otra = Date.now() + 3 * 3600e3;   // la otra computadora va 3 horas adelantada
  const p = { ...G.progresoNuevo(), dia: 7, guardadoEn: otra };
  ok(G.escribirPartida('relax', 3, p), 'llega la partida de la otra computadora');
  const sello = (r) => JSON.parse(almacen.get(r === 1 ? 'hojarasca-v1' : `hojarasca-p${r}-v1`)).guardadoEn;
  ok(sello(3) >= otra, 'al importarla, conserva su sello');
  G.usarModoGuardado('relax', 3);
  const c = G.cargarProgreso();
  c.dia = 8; ok(G.guardarProgreso(c), 'acá se sigue jugando');
  const s1 = sello(3);
  c.dia = 9; ok(G.guardarProgreso(c), 'y se guarda otra vez');
  const s2 = sello(3);
  ok(s1 > otra && s2 > s1, `con el reloj de acá atrasado, cada guardado queda después del anterior (${otra} < ${s1} < ${s2})`);
  G.usarModoGuardado('relax', 3);   // (otra vez, como al recargar: el sello sale de lo guardado)
  ok(G.guardarProgreso(G.cargarProgreso()) && sello(3) > s2, 'también después de recargar');
  const roto = { ...G.progresoNuevo(), dia: 2, guardadoEn: 8e15 };
  ok(G.escribirPartida('relax', 2, roto) && sello(2) < Date.now() + 864e5, 'un sello de un reloj roto (año 255.000) no cuenta');
  G.borrarPartida('relax', 2); G.borrarPartida('relax', 3); G.usarModoGuardado('relax', 1);
}

// 4. Una partida rota que tira al sanearla (un número guardado como `{ "toString": 1 }`: `Number` tira) dejaba el juego sin
//    arrancar y la copia de seguridad nunca se probaba; leerPaquete («nunca tira») también tiraba.
{
  const TR = await import('../src/transferir.js');
  G.usarModoGuardado('relax', 1);
  const buena = { ...G.progresoNuevo(), dia: 20, pos: { x: 0, z: 0 } };
  ok(G.guardarProgreso(buena) && G.guardarProgreso({ ...buena, dia: 21 }), 'dos guardados (la copia, del día 20)');
  const malo = { toString: 1 };
  let rotas = 0;
  for (const k of Object.keys(buena)) for (const v of [malo, { a: malo }, [malo], { a: { b: malo } }]) {
    almacen.set('hojarasca-v1', JSON.stringify({ ...buena, dia: 21, [k]: v }));
    let c = null;
    try { c = G.cargarProgreso(); } catch { c = null; }
    if (!c || !Number.isFinite(c.dia) || !Number.isFinite(c.horas)) rotas++;
  }
  ok(rotas === 0, `ningún campo con un número roto deja la partida sin cargar (${rotas})`);
  const g = leer('src/guardado.js');
  ok(g.includes('try { limpio = sanearProgreso(p); } catch { limpio = null; }') && g.includes("if (limpio) { ultimoOrigenCarga = 'backup'; ultimoPrincipalValidoTexto = null; principalRoto = true; }"), 'si sanear tira igual, se prueba la copia de seguridad');
  ok(g.includes('if (!anteriorTexto && !principalRoto) {'), 'y el principal roto no pisa la copia en el próximo guardado');
  const paquete = JSON.stringify(TR.empaquetar({ progreso: { dia: 3, entradas: {} } })).replace('"dia":3', '"dia":{"toString":1}');
  let r = null;
  try { r = TR.leerPaquete(paquete); } catch { r = 'tiró'; }
  ok(r !== 'tiró', 'leerPaquete contesta siempre');
  let e = null;
  try { e = TR.empaquetar({ progreso: { dia: malo } }); } catch { e = 'tiró'; }
  ok(e !== 'tiró' && TR.nombreArchivoPartida('relax', { dia: malo }).length > 0, 'empaquetar y el nombre del archivo, tampoco tiran');
  G.borrarProgreso();
}

// 5. Mantener F11 apretada prendía y apagaba la pantalla completa sin parar (la repetición de la tecla).
ok(leer('main.cjs').includes("if (!tecla.isAutoRepeat) ventana.setFullScreen(!ventana.isFullScreen());"), 'F11: sólo la primera, no la repetición');

// 6. La pregunta «El juego va lento: ¿bajar la calidad?» (3.8.4):
//    a) un solo tirón (o un congelón de 1 s, que llegaba recortado a 0,2 s) la hacía salir: ahora tirones son muchos cuadros
//       lentos (el 5% de la ventana) y lo que pasa de medio segundo es un freno que no cuenta;
//    b) con el límite de cuadros en 30, 30 parejos estaban siempre «en rojo» y preguntaba aunque anduviera perfecto;
//    c) partía de la calidad elegida para el próximo arranque y no de la que corre (y la bajada por el contexto 3D, igual);
//    d) bajar de Media a Baja apaga las sombras: todos los materiales recompilaban a tirones; ahora se compilan antes, con
//       un cartel (y al recuperar el contexto 3D, la bajada va antes de rehacer los gráficos, no después).
{
  const AC = await import('../src/autocalidad.js');
  // corre segundos de juego a fps parejos, con un tirón opcional a mitad; devuelve cuándo preguntaría (o null)
  const correr = ({ fps = 60, segundos = 30, tiron = 0, objetivo = null }) => {
    const e = AC.crearEstadoAutocalidad('media');
    let t = 0, tironHecho = false;
    while (t < segundos) {
      const dt = !tironHecho && tiron && t > 10 ? (tironHecho = true, tiron) : 1 / fps;
      t += dt;
      AC.anotarCuadro(e, dt, objetivo);
      const c = AC.decidirCalidad(e);
      if (c?.motivo === 'bajar') return Math.round(t * 10) / 10;
    }
    return null;
  };
  ok(correr({ fps: 60 }) === null, 'a 60 parejos no pregunta');
  ok(correr({ fps: 60, tiron: 0.2 }) === null, 'un tirón de 200 ms suelto no pregunta');
  ok(correr({ fps: 60, tiron: 1 }) === null, 'un congelón de 1 s (alt+tab, una carga) tampoco');
  ok(correr({ fps: 25 }) !== null, 'a 25 sostenidos, sí');
  const e = AC.crearEstadoAutocalidad('media');
  for (let i = 0; i < 600; i++) AC.anotarCuadro(e, i % 12 === 0 ? 0.08 : 1 / 60);
  ok(AC.hayTirones(e) && AC.decidirCalidad(e)?.motivo === 'bajar', 'tirones seguidos (uno cada 12 cuadros) sí preguntan, aunque el promedio cierre');
  ok(correr({ fps: 30, objetivo: 30 }) === null, 'con el límite en 30, 30 parejos no preguntan');
  ok(correr({ fps: 18, objetivo: 30 }) !== null, 'con el límite en 30, 18 sostenidos sí');
  ok(main.includes("if (modo === 'jugando' && ajustes.autoCalidad !== false) revisarSiVaLento(cadencia.dtReal);"), 'el bucle le pasa el dt sin recortar');
  ok(main.includes("anotarCuadroCalidad(autoCalidad, dtReal, ajustes.limiteFps === 30 ? 30 : null);"), 'y el límite que eligió el jugador');
  ok(main.includes("if (clave === 'calidad') sincronizarCalidad(autoCalidad, calidadActiva);"), 'tocar la calidad en Ajustes no cambia la que mide (la nueva vale al arrancar)');
  ok(main.includes('const hasta = calidadVecina(calidadActiva, -1);') && main.includes("const cambio = { motivo: 'bajar', desde: calidadActiva, hasta };"), 'el contexto 3D perdido baja desde la que corre');
  const sin = tramo('async function bajarSinTirones(cambio) {', 1200);
  ok(sin.includes('compilandoCalidad = true;') && sin.includes('variantesLuces.compilarCarga(jugador.estado.pos)') && main.includes('if (compilandoCalidad) return;'), 'al prender o apagar las sombras se compila antes de seguir, con el bucle quieto');
  const rest = tramo("lienzo.addEventListener('webglcontextrestored'", 1500);
  ok(rest.indexOf('aplicarCalidadAutomatica(bajada, false);') > 0 && rest.indexOf('aplicarCalidadAutomatica(bajada, false);') < rest.indexOf('await rehacerGraficos();'), 'al recuperar el contexto, la bajada antes de rehacer');
}

// 7. La tarjeta del valle pedía el foco para su primera opción con el velo todavía oculto: no quedaba en ningún lado (con dos
//    opciones o más, Enter no elegía nada).
{
  const hu = leer('src/historia-ui.js');
  const mostrar = hu.slice(hu.indexOf('  function mostrar(def) {'), hu.indexOf('  function cerrar() {'));
  ok(mostrar.indexOf("velo.classList.remove('oculto');") > 0 && mostrar.indexOf("velo.classList.remove('oculto');") < mostrar.indexOf('primero?.focus('), 'el foco, con la tarjeta ya a la vista');
}

// 8. Menús: Controles y Créditos los maneja main.js (F1, F5 y F2 no abren nada encima; Esc cierra el de arriba; desde la
//    portada el botón no dice «Volver a pausa»); con la letra grande, Personalizar, la guía y las teclas entran en la pantalla
//    (un selector de id les ganaba al tope dividido por la escala); el almacén con la letra enorme no sale por arriba; los
//    plurales del almacén («1 plumas») y del taller de los duendes; B del mando cierra la mochila, el taller y los planos.
{
  const pl = leer('src/plantilla.html'), css = leer('src/menus/sistema.css');
  ok(!pl.includes('abrirModal(') && main.includes("$('btn-controles')?.addEventListener('click', () => abrirInfo('controles-completos', 'pausa'));"), 'Controles y Créditos, desde main.js');
  ok(main.includes('if (teclasAbiertas() || infoAbierta()) {') &&main.includes("T_(origen === 'inicio' ? 'Volver' : 'Volver a pausa')"), 'con esos paneles abiertos sólo Esc hace algo; el botón según de dónde vino');
  ok(css.includes(':root[data-menu] :is(#personalizar, #guia, #teclas) .panel-modal { max-height: calc((100vh - 2 * var(--margen-pantalla)) / var(--zoom)); overflow: hidden; }'), 'Personalizar, la guía y las teclas: el tope dividido por la escala');
  ok(css.includes(':root[data-menu] .trueque { max-height: calc((100vh - 12px) / var(--zoom) - 9vh); }'), 'el almacén descuenta su distancia al borde, agrandada');
  const TQ = await import('../src/trueque.js');
  ok(TQ.cantidadCosa('pluma', 1) === '1 pluma' && TQ.cantidadCosa('pluma', 2) === '2 plumas' && TQ.cantidadCosa('hongos-secos', 1) === '1 atado de llao llao seco' && TQ.cantidadCosa('canto', 1) === '1 canto rodado', 'plurales del almacén');
  ok(Object.keys(TQ.NOMBRE_COSA).every((k) => Object.hasOwn(TQ.NOMBRE_COSA_UNO, k)), 'cada cosa tiene su singular');
  ok(leer('src/desafio.js').includes("(n === 1 ? NOMBRE_UNO[k] : NOMBRE[k]) || k"), 'y el taller de los duendes');
  ok(main.includes("else if (mochilaAbierta || desafio?.tallerAbierto) golpeDeTecla('Escape');") && main.includes("else if (modoObra) golpeDeTecla(obras?.editando ? 'Escape' : 'KeyO');"), 'B cierra la mochila, el taller y los planos');
}

console.log(`✓ verificar-3-8-6-base: ${n} comprobaciones`);
