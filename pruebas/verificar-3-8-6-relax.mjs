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
import vm from 'node:vm';

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
    globalThis.hojarasca = { fotos: { leer: (k) => FM.leerFotos(base, k), escribir: (k, f, opciones) => FM.escribirFotos(base, k, f, opciones), borrar: (k) => FM.borrarFotos(base, k) } };
    ok(G.escribirPartida('relax', 2, { ...G.progresoNuevo(), dia: 4, desafios: { lago: { dia: 2 }, faro: { dia: 3 } } }, { lago: jpg, faro: jpg }), 'una partida con dos fotos');
    G.usarModoGuardado('relax', 2);
    // la carga no pudo leer «faro» (el guardado de todos los días recibe sólo «lago» y una nueva)
    ok(G.guardarFotos({ lago: { img: jpg }, nueva: { img: jpg } }), 'el guardado de todos los días');
    eq(fs.readdirSync(dir()).sort(), ['faro.jpg', 'lago.jpg', 'nueva.jpg'], 'agrega la nueva y no borra la que no se leyó');
    // reemplazar la partida entera (importar) sí deja exactamente las suyas
    ok(G.escribirPartida('relax', 2, { ...G.progresoNuevo(), dia: 6 }, { otra: jpg }), 'importar otra partida en la ranura');
    eq(fs.readdirSync(dir()), ['otra.jpg'], 'importar reemplaza las fotos');
    ok(FM.escribirFotos(base, 'hojarasca-p2-fotos-v1', { x: jpg }, { reemplazar: false }) && fs.readdirSync(dir()).length === 2, 'fotos-main: sin reemplazar, sólo agrega (la versión del equipo 5)');
    G.borrarPartida('relax', 2);
  } finally { delete globalThis.hojarasca; G.usarModoGuardado('relax', 1); fs.rmSync(base, { recursive: true, force: true }); }
}

// ---------------------------------------------------------------- 8. las tarjetas del valle con el mando
// (lo hizo también el equipo 5 con la lectura única del mando: leerMandoQuieto; queda el suyo. La partida real:
// humo-3-8-6-relax, sección 1)
{
  ok(trozoFn('function leerMandoQuieto(').includes("modo === 'valle' ? valle?.tarjetas?.velo"), 'en el modo valle el mando maneja la tarjeta');
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

// ---------------------------------------------------------------- 11. obras grandes y piezas no se enciman
{
  const c = leer('src/construccion.js');
  ok(c.includes("if (!o.plano.pieza && !sobrePlataforma && !plano.cubreOtras && solapanHuellas(plano, x, z, rot, o.plano, o.datos.x, o.datos.z, o.datos.rot || 0, 0.1))"), 'una pieza en el suelo no entra en la huella de una obra grande');
  ok(/if \(o\.plano\.pieza\) \{\n\s+if \(o\.datos\.etapas <= 0 \|\| o\.plano\.cubreOtras\) continue;[\s\S]{0,300}solapanHuellas\(plano, x, z, rot, o\.plano/.test(c), 'una obra grande no se levanta encima de tus piezas en el suelo');
}

// ---------------------------------------------------------------- 12. la mano: los frenos de las teclas y el fuego prendido
{
  const u = trozoFn('function usarRanura(');
  ok(u.indexOf('if (js.enCable || durmiendo) return;') > 0 && u.indexOf('if (js.enCable || durmiendo) return;') < u.indexOf('switch (r.accion)'), 'colgado del cable o durmiendo, el clic derecho no usa nada');
  ok(/if \(js\.montado && \['carpa', 'hacha', 'aserrar', 'fuego', 'plantar-pehuen', 'plantar-coihue', 'plantar', 'cocinar'\]\.includes\(r\.accion\)\)/.test(u), 'a caballo, lo mismo que las teclas');
  const f = trozoFn('function encenderFuego(');
  ok(f.indexOf("nota('El fuego ya está prendido'") > 0 && f.indexOf("nota('El fuego ya está prendido'") < f.indexOf('lenaDelInvierno()'), 'F con el fuego ya prendido no gasta otra vez');
  ok(trozoFn('function puedeArmarCarpaAca(').includes('!js.enPlataforma') && trozoFn('function enLaCarpa(').includes('Math.abs(js.pos.y - T.altura(progreso.carpa.x, progreso.carpa.z)) < 1.6'), 'la carpa, en la tierra y a su altura');
}

// ---------------------------------------------------------------- 13. los logros ganados sin Steam llegan a Steam
{
  const { crearSteam, apiSteam } = await import('../src/steam.js');
  const { LOGROS_RELAX } = await import('../src/logros-relax.js');
  const { LOGROS } = await import('../src/desafio-logros.js');
  const pedidos = [];
  const st = crearSteam({ activar: async (api) => { pedidos.push(api); return true; } });
  const alm = new Map([['hojarasca-logros-relax-v1', JSON.stringify({ logros: { [LOGROS_RELAX[0].id]: '2026-01-01T00:00:00Z', inventado: '2026-01-01T00:00:00Z' } })], ['hojarasca-logros-v1', JSON.stringify({ logros: { [LOGROS[0].id]: '2026-01-02T00:00:00Z' } })]]);
  const almacenFalso = { getItem: (k) => alm.get(k) ?? null };
  eq(await st.sincronizar(almacenFalso), 2, 'pide los ganados de los dos modos');
  eq(pedidos.sort(), [apiSteam('desafio', LOGROS[0].id), apiSteam('relax', LOGROS_RELAX[0].id)].sort(), 'con sus nombres de API');
  await st.sincronizar(almacenFalso);
  eq(pedidos.length, 2, 'lo ya mandado no se repite');
  eq(await crearSteam(null).sincronizar(almacenFalso), 0, 'sin Steam, nada');
  ok(main.includes('steamPuente.sincronizar().catch(() => {});'), 'se sincroniza al arrancar');
}

// ---------------------------------------------------------------- 14. fotos, pesca, textos, carreras, torneo y el kayak en el Desafío
{
  const sf = trozoFn('async function sacarFoto(');
  ok(sf.includes("const hudEscondido = $('hud').classList.contains('oculto');") && sf.includes("if (!hudEscondido) $('hud').classList.remove('oculto');"), 'P en el modo foto no vuelve a mostrar el HUD');
  ok(sf.includes('const nombre = nombreArchivoFoto();'), 'la foto, con la hora de acá');
  const mc = leer('main.cjs');
  ok(mc.includes('for (let n = 2; (fs.existsSync(ruta) || fotosEscribiendo.has(ruta)) && n < 1000; n++)'), 'dos fotos en el mismo segundo no se pisan');
  ok(/const mallasPez = new Map\(\);\nfunction mallaPez\(def\) \{\n  if \(mallasPez\.has\(def\)\) return mallasPez\.get\(def\);/.test(leer('src/pesca.js')), 'una malla por especie de pez (no una por pez atrapado)');
  ok(leer('src/pesca.js').includes("Se soltó ${/^pejerrey/.test(est.pez.def.nombre) ? 'el' : 'la'}"), 'se soltó el pejerrey');
  const DI = await import('../src/diario.js');
  const t1 = JSON.stringify((() => { const d = DI.crearDiario(); d.anotar('pez', { especie: 'pejerrey patagónico', cm: 30 }); return d.cerrar(4, 'otoño', () => 0.1); })());
  ok(/Saqué un pejerrey patagónico de 30 centímetros y lo devolví al agua\./.test(t1), `el pejerrey en el diario (${t1.slice(0, 120)})`);
  const t2 = JSON.stringify((() => { const d = DI.crearDiario(); d.anotar('pez', { especie: 'trucha marrón', cm: 41, quedo: true }); return d.cerrar(4, 'otoño', () => 0.1); })());
  ok(/Saqué una trucha marrón de 41 centímetros y me la quedé para el ahumadero\./.test(t2), 'la que te quedaste no se devolvió');
  const CS = await import('../src/conservas.js');
  ok(/falta más o menos una hora/.test(CS.avisoTendal({ colgado: Object.keys(CS.CONSERVAS)[0], horas: CS.HORAS_SECADO - 0.5 }, {})), 'tendal: «falta más o menos una hora»');
  ok(main.includes("nota('Todavía se está secando', faltanHoras(q.faltan));") && main.includes("nota('Se están ahumando', faltanHoras(r.faltan));") && main.includes("r.lenera.secos === 1 ? 'Queda uno en la leñera'") && main.includes("datos.fotos.length === 1 ? 'foto' : 'fotos'"), 'los plurales con 1');
  const ou = leer('src/oficios-ui.js');
  ok(ou.includes('`Falta 1 para el nivel ${e.nivel + 1}.`') && ou.includes('${e.de.charAt(0).toLowerCase()}${e.de.slice(1)}'), 'oficios: «Falta 1» y «La noche de los duendes» con mayúscula');
  const mj = leer('src/modos-juego.js');
  ok(mj.includes('ultimoResultado = null;   // 3.8.6') && mj.includes(': con el kayak, en el muelle o en tu embarcadero'), 'carreras: largar limpia la llegada vieja; el kayak no siempre está en el muelle');
  ok(leer('src/eventos-valle-ui.js').includes("if (ctx.ajustes?.()?.duracion === 'reloj') return;"), 'con la hora de tu reloj, las horas de un evento no saltan');
  ok(main.includes("kayak.subir(jugador); if (!desafio) progreso.kayakAmarre = null;"), 'en el Desafío, subirte al kayak no lo manda al muelle para siempre');
  const TO = await import('../src/torneo.js');
  const f = TO.fundirEntradas([{ semana: '2026-S40', nombre: 'José', pesca: 40, carreraMs: 0, noches: 0, abatidos: 0, t: 5 }], [{ semana: '2026-S40', nombre: 'Jose', pesca: 52, carreraMs: 0, noches: 0, abatidos: 0, t: 0 }]);
  ok(f.length === 1 && f[0].pesca === 52, `torneo: «José» y «Jose» (del código) son el mismo (${JSON.stringify(f.map((e) => e.nombre))})`);
}

// ---------------------------------------------------------------- 15. construcción: nombres, plurales y géneros; las ramitas llenas
{
  ok(!main.includes('T.lugares[`obra-'), 'el nombre de una obra no va a T.lugares (el mapa lo dibuja desde la obra)');
  eq(limpio({ obras: [{ plano: 'cantero', x: 3, z: 4, etapas: 1, nombre: 5 }, { plano: 'cantero', x: 9, z: 4, etapas: 1, nombre: '  La huerta  ' }] }).obras.map((o) => o.nombre), [undefined, 'La huerta'], 'el nombre de una obra, saneado');
  const c = leer('src/construccion.js');
  ok(c.includes("tabla: { nombre: 'tablas', uno: 'tabla',") && c.includes('if (hay < n) falta.push(cantidadMaterial(n - hay, k));') && c.includes('motivo: textoFaltan(falta)'), 'construcción: «1 tabla», «Falta 1 tabla»');
  ok(!/`\$\{n\} \$\{MATERIALES\[k\]/.test(main), 'main.js arma las cantidades con cantidadMaterial');
  ok(main.includes("${participioObra(r.plano.nombre, 'desmontad')}") && main.includes("${participioObra(r.obra.plano.nombre, 'recolocad')}"), '«Mesa de campo desmontada»');
  ok(leer('src/objetos.js').includes("it.tipo === 'ramita' && progreso.ramitas >= 12 ? 'Ya llevás doce ramitas'"), 'con doce ramitas, el aviso lo dice');
}

// ---------------------------------------------------------------- 16. lo que se mueve no funciona en el lugar viejo; el álbum; lo soltado
{
  ok(leer('src/construccion.js').includes('if (o === edicion?.obra) continue;   // 3.8.6') && trozoFn('function tendalCerca(').includes('if (o === obras.editando) continue;') && trozoFn('function obraQueTrabajaCerca(').includes('if (o === obras?.editando) continue;'), 'la obra que estás moviendo no sirve en el lugar viejo (catre, acopio, tendal, colmena)');
  ok(main.includes('const todas = [...DESAFIOS, ...fotosFiestas];') && main.includes("fiestasJuego.fotosAlbum?.()"), 'el álbum del cuaderno muestra las fotos de las fiestas');
  ok(main.includes("else ficha.appendChild(el('p', 'pista', 'Sin la foto: no se pudo leer del disco'));"), 'una foto sin imagen no se ve rota');
  const ob = leer('src/objetos.js');
  ok(ob.includes('const hayLugar = !!guardado || progreso.soltados.length < SOLTADOS_TOPE;') && ob.includes('let candidato = hayLugar ?'), 'con la lista de lo soltado llena, lo más viejo no se pierde');
}

// ---------------------------------------------------------------- 17. al dormir, la lluvia de cada tramo
{
  const f = trozoFn('function lluviaPorTramos(');
  const ctx = { TRAMO: 3, programaTramos: null, programaDelTiempo: () => ({ tipo: (k) => (k % 2 ? 'lluvia' : 'despejado') }) };
  vm.createContext(ctx);
  vm.runInContext(`let programaTramos = null; ${f}
this.f = lluviaPorTramos;`, ctx);
  eq(JSON.parse(JSON.stringify(ctx.f(22, 31))), [{ horas: 2, lluvia: 1 }, { horas: 3, lluvia: 0 }, { horas: 3, lluvia: 1 }, { horas: 1, lluvia: 0 }], 'una noche de 22 a 7: la lluvia de cada tramo');
  ok(trozoFn('function revisarTormenta(').includes('for (const s of lluviaPorTramos(fin - Math.min(dh, 12), fin)) st.crecida = avanzarCrecida(st.crecida, nieva ? 0 : s.lluvia, s.horas);'), 'la crecida, tramo por tramo');
  const t = trozoFn('function actualizarTendales(');
  ok(t.includes('const tramos = horas > 0.5 ? lluviaPorTramos(ahora - horas, ahora)') && t.includes('for (const s of tramos) h = humedecer(h, s.horas,') && t.includes('for (const s of tramos) avanzarSecado(datosTendal(o), s.horas,'), 'el tendal y la leña, tramo por tramo');
}

// ---------------------------------------------------------------- 18. lo que decidió el usuario y lo del perro, el clima y el kayak
{
  // 1a: la noche del temporal del capítulo 8 llueve con viento fuerte
  const f = trozoFn('function temporalDeLaHistoria(');
  const ctx = { TRAMO: 3, desafio: null, CAPITULOS: [{ id: 'llegada' }, { id: 'temporal' }], horaAbsoluta: (d, h) => d * 24 + h, progreso: null };
  vm.createContext(ctx);
  vm.runInContext(`${f}\nthis.f = temporalDeLaHistoria;`, ctx);
  ctx.progreso = { historia: { activa: true, capitulo: 1, momentos: { temporal: 'lanzado' }, base: { dia: 9 } }, eventosValle: { hechos: { temporal: { dia: 10 } } } };
  const k = (dia, h) => Math.floor((dia * 24 + h) / 3);
  ok(!ctx.f(k(10, 15)) && ctx.f(k(10, 19)) && ctx.f(k(11, 2)) && ctx.f(k(11, 6)) && !ctx.f(k(11, 9.5)), 'el temporal del capítulo 8: de las 18 a las 7');
  ctx.progreso.historia.momentos = {};
  ok(!ctx.f(k(10, 19)), 'sin el momento lanzado, nada');
  ok(main.includes("p.tipo = (k) => (fijo() ? null : (temporalDeLaHistoria(k) ? 'lluvia' : null) ||") && main.includes('p.viento = (k) => (!fijo() && temporalDeLaHistoria(k) ? Math.max(viento(k), VIENTO_TEMPORAL) : viento(k));'), 'el programa del tiempo lo usa (lluvia y viento)');
  // 2a: lo elegido en la barra se sigue por lo que es; si se terminó, su casilla queda vacía
  const rb = trozoFn('function refrescarBarra(');
  ok(rb.includes('if (idElegido && ranuras[elegida]?.id !== idElegido) {') && rb.includes('else ranuras.splice(Math.min(elegida, ranuras.length), 0, null);') && trozoFn('function elegirRanura(').includes('idElegido = null;'), 'la casilla de lo que se terminó queda vacía');
  // 3a: la cama del refugio, casa cerrada
  const r = trozoFn('function dentroDelRefugio(');
  const c2 = { T: { lugares: { refugio: { x: 100, z: 50, y: 10, rot: 0.6, dimensiones: { W: 7, D: 5, H: 3 } } } } };
  vm.createContext(c2);
  vm.runInContext(`${r}\nthis.f = dentroDelRefugio;`, c2);
  const R = c2.T.lugares.refugio, cama = { x: R.x + 2.2 * Math.cos(R.rot) + (-2.5 + 0.75) * Math.sin(R.rot), z: R.z - 2.2 * Math.sin(R.rot) + (-2.5 + 0.75) * Math.cos(R.rot), y: 10.5 };
  ok(c2.f(cama) && !c2.f({ x: R.x + 6, z: R.z, y: 10 }) && !c2.f({ ...cama, y: 30 }), 'la cama del refugio está adentro (y afuera o arriba, no)');
  const AB = await import('../src/abrigo.js');
  ok(main.includes('const CASA_REFUGIO = { cubierta: true, habitable: true, calorFactor: 0, confortCasa: 0, cama: true };'), 'el refugio, casa cerrada sin fuego');
  eq([AB.comoDormiste({ invierno: 1, casa: { cubierta: true, habitable: true, calorFactor: 0 } }), AB.comoDormiste({ invierno: 1, manta: true, casa: { cubierta: true, habitable: true, calorFactor: 0 } })], ['fresco', 'normal'], 'sin fuego: fresco, con la manta bien (no a la intemperie)');
  // 4a: adentro de un edificio fijo no se arman piezas en el suelo
  ok(leer('src/construccion.js').includes("if (typeof T.interiorFijo === 'function' && muestras.some((q) => T.interiorFijo(q.x, q.z)) && !pisoPropioEn(x, z, soporteReal, ignorarObra))") && main.includes('T.interiorFijo = (x, z) => interiores.some('), 'adentro del refugio, el almacén o la estación no se construye en el suelo');
  // el perro: su nombre, y alcanzarte corriendo
  ok(!/'El perro (olfatea|tomó|lo encontró|encontró|marca)/.test(main) && main.includes('function elPerro(mayuscula = false)'), 'el perro con su nombre en las notas');
  const pe = leer('src/perro.js');
  ok(pe.includes('if (d > 110 || (d > 45 && fueraDeVista(camara)) || js.enKayak || js.enTren) {') && pe.includes('dd > 12 ? Math.min(13, 4.2 + (dd - 12) * 0.35)'), 'el perro te alcanza corriendo y sólo aparece de golpe lejísimos o fuera de la vista');
  // el clima no corre en la pausa
  ok(leer('src/clima.js').includes('const dtTiempo = mundo?.quieto ? 0 : dt;') && main.includes("ctxClima.quieto = modo !== 'jugando';") && main.includes("if (modo === 'jugando') diario.clima(dt, clima.estado, U.uInvierno.value);"), 'el tiempo no corre en la pausa ni va al diario');
  // bajarte del kayak en tu embarcadero lo amarra
  ok(main.includes('else amarrarAlBajar();') && trozoFn('function amarrarAlBajar(').includes('amarrarKayak(o)'), 'bajarte del kayak en tu embarcadero lo amarra');
}

console.log(`verificar-3-8-6-relax: ${pasos} comprobaciones OK`);
