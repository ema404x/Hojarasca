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
  ok((main.match(/mando\.actualizar\(\)/g) || []).length === 1, 'nadie más lee el mando por su lado');
  ok(/const m = leerMandoActual\(\);/.test(tramo('function leerMando(dt) {', 120)), 'jugando, por la lectura única');
  const menu = tramo('function leerMandoEnMenu() {', 500);
  ok(/const m = leerMandoActual\(\);/.test(menu) && menu.includes('if (dialogos.abierto()) return;'), 'en la pausa, por la lectura única y sin pisar al cuadro de pregunta');
  ok(/leerMandoEnMenu\(\);[^\n]*\n\s*if \(!mandoLeido\) leerMandoQuieto\(\);[^\n]*\n\s*mandoLeido = false;/.test(main), 'el bucle lee el mando en cualquier otra pantalla y se prepara para el cuadro siguiente');
  const quieto = tramo('function leerMandoQuieto() {', 1400);
  ok(quieto.includes("modo === 'valle' ? $('valle-tarjeta') : modo === 'victoria' ? $('victoria')"), 'la tarjeta del valle y la victoria, con el mando');
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

console.log(`✓ verificar-3-8-6-base: ${n} comprobaciones`);
