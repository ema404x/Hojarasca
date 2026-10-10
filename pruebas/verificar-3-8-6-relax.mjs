// 3.8.6 (relax): el pase de bugs del Relax base. Una comprobación por arreglo.
// 1. El alero del arriero: lo del abuelo de Martín va en «Charlar» (caía en «Regalar y ayudar») y la amistad de la
//    historia suma los 12 de AMISTAD_ALERO (sumarAmistadDe topea en 10). La partida real: humo-3-8-6-alero.cjs.
//    Y lo de arriba de la rueda (el nombre en dos renglones) entra en la pantalla: se mide su alto de verdad.
// 2. El kayak amarrado se muda con su embarcadero (quedaba flotando en el lugar viejo y amanecía en el muelle).
// 3. Dormir: la página del diario pasada la medianoche es la del día de antes; con la hora de tu reloj no hay siesta;
//    durante el fundido no se juega ni corre el reloj acelerado; «Dormí en la carpa» sólo si dormiste.
// 4. El aviso junto al fuego: el «·» del perro no tapa el dormir/cocinar de la E; la G va después del tendal, las
//    huellas y la semilla (como la E). La bitácora del faro, mirando algo, no (como el aviso).
// 5. La carpa: el aviso T y la T con la misma cuenta (ni en el tren, el kayak, el velero, el sulky ni el cable) y al
//    levantarla se liberan su geometría y sus materiales.
// 6. El entumecido y el descansado se guardan con la partida.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

// un localStorage de mentira, para el guardado en Node
const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => { almacen.set(k, String(v)); },
  removeItem: (k) => { almacen.delete(k); },
  key: (i) => [...almacen.keys()][i] ?? null,
  get length() { return almacen.size; },
};
const SR = await import('../src/social-rueda.js');
const VS = await import('../src/vecindad-social.js');
const V = await import('../src/vecindad.js');
const AL = await import('../src/alero-arriero.js');
const KA = await import('../src/kayak-amarre.js');
const G = await import('../src/guardado.js');

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };
const main = leer('src/main.js');
// el cuerpo de una función de main.js (hasta la próxima que empieza en la columna 0)
const trozoFn = (inicio) => { const i = main.indexOf(inicio); ok(i >= 0, `falta ${inicio}`); const j = main.indexOf('\nfunction ', i + 10); return main.slice(i, j > i ? j : undefined); };
const limpio = (x) => { G.usarModoGuardado('relax', 3); G.guardarProgreso({ ...G.progresoNuevo(), dia: 5, ...x }); return G.cargarProgreso(); };

// ---------------------------------------------------------------- 1. el alero del arriero
{
  for (const id of ['alero:pedir', 'alero:recordar', 'alero:contar']) eq(SR.categoriaDeOpcion(id), 'charla', `${id} en «Charlar»`);
  eq(SR.iconoDeOpcion('alero:pedir', AL.TITULOS_ALERO.pedir), 'libro', 'con el ícono del libro');
  // la rueda de verdad (vecindad-social: las de siempre, con la categoría que les pone menuParaRueda)
  const p = { dia: 3, vecindad: V.vecindadNueva(), aleroArriero: AL.aleroNuevo() };
  const menu = SR.menuParaRueda({ opciones: [{ id: 'como-andas', titulo: '¿Cómo andás?' }, ...AL.opcionesAlero(p, 'martin'), { id: 'chau', titulo: 'Chau' }] });
  const grupos = VS.opcionesRueda('martin', p, { menu, dia: 3 });
  const g = grupos.find((x) => x.opciones?.some((o) => o.id === 'alero:pedir'));
  eq(g?.categoria, 'charla', 'en la rueda, lo del abuelo está en «Charlar»');
  const rueda = SR.armarRueda({ tipo: 'charla', opciones: menu.map(({ id, titulo }) => ({ id, titulo })) }, null, VS.CATEGORIAS_RUEDA);
  ok(rueda.categorias.find((c) => c.id === 'charla')?.opciones.some((o) => o.id === 'alero:pedir'), 'armarRueda lo pone en «Charlar»');
  // la amistad: 12 de una vez (con sumarAmistadDe llegaban 10)
  const e = { vecindad: V.vecindadNueva() };
  const antes = V.puntosAmistad('martin', e);
  V.cambiarAmistad(e, 'martin', AL.AMISTAD_ALERO, 5);
  eq(V.puntosAmistad('martin', e) - antes, AL.AMISTAD_ALERO, 'cambiarAmistad suma los 12 del alero');
  ok(/aleroJuego = crearAleroJuego\(\{[\s\S]{0,700}sumarAmistad: \(k, n\) => \{ const am = cambiarAmistad\(progreso, k, Math\.max\(0, n\)/.test(main), 'main.js suma la amistad del alero con cambiarAmistad');
  ok(/arriba = \(info \? 62 \+ Math\.max\(70, info\.offsetHeight/.test(trozoFn('function ubicarRueda(')), 'la rueda mide lo de arriba');
}

// ---------------------------------------------------------------- 2. el kayak se muda con su embarcadero
{
  const f = trozoFn('function mudarDatosDeObra(');
  ok(f.includes("o.plano.id === 'embarcadero' && dondeAmanece(progreso.kayakAmarre, [{ datos: { x: x0, z: z0 } }]).donde === 'embarcadero'") && f.includes('amarrarKayak(o)'), 'mover el embarcadero re-amarra el kayak');
  eq(KA.dondeAmanece({ x: 10, z: 10 }, [{ datos: { x: 10.4, z: 9.8 } }]).donde, 'embarcadero', 'el amarre se reconoce en el lugar viejo');
  eq(KA.dondeAmanece({ x: 10, z: 10 }, [{ datos: { x: 30, z: 9.8 } }]).donde, 'muelle', 'y otro embarcadero lejos, no');
}

// ---------------------------------------------------------------- 3. dormir
{
  const f = trozoFn('function dormir(');
  ok(f.includes('diario.cerrar(progreso.horas < 12 ? Math.max(1, progreso.dia - 1) : progreso.dia,'), 'pasada la medianoche, la página es del día de antes');
  const siesta = f.indexOf("if (!deNoche && ajustes.duracion === 'reloj')");
  ok(siesta > 0 && siesta < f.indexOf('desafio.curar(') && siesta < f.indexOf('setTimeout('), 'con la hora de tu reloj no hay siesta (antes de curar o apagar el fuego)');
  ok(f.indexOf("if (enCarpa) diario.anotar('carpa');") > f.indexOf('Ya dormiste esta noche'), 'la carpa se anota después de las guardas');
  ok(main.includes("if (durmiendo && codigo !== 'Escape') return;") && main.includes("activo: () => modo === 'jugando' && !durmiendo,") && main.includes('js.sentado && !durmiendo &&'), 'en el fundido no se juega ni corre el reloj acelerado');
}

// ---------------------------------------------------------------- 4. el aviso junto al fuego
{
  ok(main.includes("if (juntoAlFuego && !casaDeTe && (!aviso || aviso.tecla === '·' || objetivo?.tipo === 'sentarse')) {"), 'el fuego le gana al «·» del perro');
  const g = main.indexOf("if (!aviso && juntoAlFuego) aviso = { tecla: 'G', texto: 'Cocinar algo en el fuego' };");
  ok(g > main.indexOf('const te = tendalCerca();') && g > main.indexOf('aviso = { tecla: \'E\', texto: `Juntar semilla de'), 'la G, después del tendal, las huellas y la semilla');
  ok(main.includes("if (!objetivo && enLaSalaDelFaro() && !progreso.entradas.bitacora) { registrar('bitacora'); break; }"), 'la bitácora, sin nada mirado');
}

// ---------------------------------------------------------------- 5. la carpa
{
  const p = trozoFn('function puedeArmarCarpaAca(');
  for (const k of ['enTren', 'enKayak', 'enVela', 'enSulky', 'enCable', 'montado', 'nadando']) ok(p.includes(`!js.${k}`), `la carpa no se arma con ${k}`);
  ok(main.includes("progreso.carpa && puedeArmarCarpaAca(js)) aviso = { tecla: 'T', texto: 'Armar la carpa' }") && trozoFn('function armarCarpa(').includes('if (!puedeArmarCarpaAca(js)) return;'), 'el aviso y la T, con la misma cuenta');
  ok(/g\.dispose\(\)[\s\S]{0,40}m\.dispose\(\)/.test(trozoFn('function quitarCarpa(')) && trozoFn('function armarCarpa(').includes('quitarCarpa();'), 'levantarla libera la malla');
}

// ---------------------------------------------------------------- 6. el cuerpo se guarda
{
  eq(limpio({ cuerpo: { entumecido: 1.5, descansado: 'x' } }).cuerpo, { entumecido: 1.5, descansado: 0 }, 'se sanea');
  eq(limpio({ cuerpo: { entumecido: 1e9, descansado: -3 } }).cuerpo, { entumecido: 12, descansado: 0 }, 'con tope');
  eq(limpio({}).cuerpo, undefined, 'una partida vieja no lo trae');
  ok(main.includes('progreso.cuerpo = jc.entumecido > 0 || jc.descansado > 0') && main.includes('jugador.estado.entumecido = progreso.cuerpo.entumecido || 0;'), 'se guarda y se carga');
}

// ---------------------------------------------------------------- 7. las fotos del álbum: el guardado no borra del disco
{
  const os = await import('node:os');
  const { createRequire } = await import('node:module');
  const FM = createRequire(import.meta.url)(path.join(raiz, 'fotos-main.cjs'));
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-fotos-386-'));
  try {
    const jpg = `data:image/jpeg;base64,${Buffer.from('foto').toString('base64')}`;
    const dir = () => FM.carpetaFotos(base, 'hojarasca-p2-fotos-v1');
    globalThis.hojarasca = { fotos: { leer: (k) => FM.leerFotos(base, k), escribir: (k, f, podar) => FM.escribirFotos(base, k, f, podar), borrar: (k) => FM.borrarFotos(base, k) } };
    ok(G.escribirPartida('relax', 2, { ...G.progresoNuevo(), dia: 4, desafios: { lago: { dia: 2 }, faro: { dia: 3 } } }, { lago: jpg, faro: jpg }), 'una partida con dos fotos');
    G.usarModoGuardado('relax', 2);
    // la carga no pudo leer «faro» (el guardado de todos los días recibe sólo «lago» y una nueva)
    ok(G.guardarFotos({ lago: { img: jpg }, nueva: { img: jpg } }), 'el guardado de todos los días');
    eq(fs.readdirSync(dir()).sort(), ['faro.jpg', 'lago.jpg', 'nueva.jpg'], 'agrega la nueva y no borra la que no se leyó');
    // reemplazar la partida entera (importar) sí deja exactamente las suyas
    ok(G.escribirPartida('relax', 2, { ...G.progresoNuevo(), dia: 6 }, { otra: jpg }), 'importar otra partida en la ranura');
    eq(fs.readdirSync(dir()), ['otra.jpg'], 'importar reemplaza las fotos');
    ok(FM.escribirFotos(base, 'hojarasca-p2-fotos-v1', { x: jpg }, false) && fs.readdirSync(dir()).length === 2, 'fotos-main: sin podar, sólo agrega');
    ok(leer('preload.cjs').includes("ipcRenderer.sendSync('fotos-escribir', String(clave || ''), fotos && typeof fotos === 'object' ? fotos : {}, podar !== false)") && leer('fotos-main.cjs').includes('escribirFotos(base(), String(clave || \'\'), fotos, podar !== false)'), 'el puente pasa `podar`');
    G.borrarPartida('relax', 2);
  } finally { delete globalThis.hojarasca; G.usarModoGuardado('relax', 1); fs.rmSync(base, { recursive: true, force: true }); }
}

// ---------------------------------------------------------------- 8. las tarjetas del valle con el mando
{
  const ui = leer('src/historia-ui.js');
  ok(/return \{ mostrar, cerrar, elegir, abierta: \(\) => !!actual, actual: \(\) => actual, velo, moverFoco, elegirEnfocada, atras \};/.test(ui), 'las tarjetas saben moverse y elegir con el mando');
  const f = trozoFn('function leerMandoEnMenu(');
  ok(f.includes("if (modo === 'valle') {") && f.includes('t.elegirEnfocada()') && f.includes('t.moverFoco(-1)') && f.includes('t.atras()'), 'en el modo valle, A elige, la cruceta mueve y B cierra');
  ok(main.includes("if (modo === 'pausa' || modo === 'cuaderno' || modo === 'mapa' || modo === 'valle') leerMandoEnMenu();") && main.includes("else { if (modo === 'jugando') leerMando(dt); jugador.actualizar(dt); }"), 'el mando se lee en el modo valle (y en el tren no se gasta antes)');
}

// ---------------------------------------------------------------- 9. el temporal del capítulo 8: pasada la noche
{
  const H = await import('../src/historia.js');
  const { CUENTOS } = await import('../src/cuentos.js');
  const p = (dia, temporal) => ({ dia, entradas: Object.fromEntries(CUENTOS.map((c) => [c.id, { dia: 3, hora: 21, cantidad: 0 }])), visitas: { cuenta: 3 }, eventosValle: { hechos: { temporal: { dia: temporal, opcion: 'lena' } } } });
  const h = H.historiaNueva(); H.empezarHistoria(h, 1); h.capitulo = 7; h.fase = 'intro';
  H.arrancarCapitulo(h, H.estadoHistoria({ ...p(20, 0), eventosValle: { hechos: {} } }));
  H.revisarHistoria(h, H.estadoHistoria({ ...p(20, 0), visitas: { cuenta: 4 }, eventosValle: { hechos: {} } }));
  H.momentoLanzado(h);
  ok(!H.revisarHistoria(h, H.estadoHistoria({ ...p(20, 20), visitas: { cuenta: 4 } })).completo, 'elegir en la tarjeta (a la tarde) no termina la historia');
  ok(H.revisarHistoria(h, H.estadoHistoria({ ...p(21, 20), visitas: { cuenta: 4 } })).completo, 'a la mañana siguiente, sí');
}

// ---------------------------------------------------------------- 10. el viento voltea el tendal: lo colgado vuelve
{
  const { crearEventosValleUi } = await import('../src/eventos-valle-ui.js');
  const tendal = { plano: { id: 'tendal', nombre: 'Tendal', etapas: [{ pide: { tabla: 2 } }] }, datos: { x: 1, z: 1, y: 0, etapas: 1, tendal: { colgado: 'charqui', horas: 3 } } };
  const lista = [tendal];
  const devueltos = [];
  const ui = crearEventosValleUi({
    progreso: () => ({ dia: 3, horas: 10, materiales: {}, cosas: {}, eventosValle: null }), extra: () => ({}),
    obras: () => ({ obras: lista, bajoCubierta: () => null, destruir: (o) => { lista.splice(lista.indexOf(o), 1); return [o]; } }),
    sumarMaterial: () => {}, sincronizarObras: () => {}, devolverContenido: (caidas) => { devueltos.push(...caidas.map((c) => c.datos)); return null; },
  }, { mostrar() {}, cerrar() {}, abierta: () => false });
  const r = ui.voltear();
  ok(r?.nombre === 'Tendal' && devueltos.length === 1 && devueltos[0].tendal.colgado === 'charqui', 'lo que tenía el tendal volteado vuelve por devolverContenido');
  ok(/devolverContenido: \(caidas\) => \{ for \(const c of caidas \|\| \[\]\) devolverContenido\(c\.datos\);/.test(main), 'main.js devuelve el contenido (y el último acopio)');
}

console.log(`verificar-3-8-6-relax: ${pasos} comprobaciones OK`);
