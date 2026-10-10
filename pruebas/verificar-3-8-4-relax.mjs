// 3.8.4 (relax): las decisiones del usuario para el Relax (DECISIONES_3_8_4.md). Una comprobación por decisión.
//  1. El caballo con su nombre (elCaballo: el nombre, «el zaino» o «tu caballo»).
//  2. Al desarmar el último acopio, lo guardado vuelve a tus cosas (con nota).
//  3. El kayak guarda su lugar sólo si quedó amarrado; si no, vuelve al muelle.
//  4. El sulky: mantener S frena hasta parar.
//  6. El caballo no cruza los puentes colgantes: amarrarlo ahí o mandarlo solo al refugio (E y aviso en el mismo orden).
//  7. Una siesta por viaje en la cucheta del tren.
//  9. Truco: irse al mazo con el truco querido da lo querido (2/3/4), no +1.
// 10. Rehacer la vida: pasada una estación de la separación, otra pareja; el anillo deja de figurar como «dado».
// 11. Una clase de baile por día aunque salgas con Escape.
// 12. Un solo nombre de la locomotora (taller y Personalizar): gana el último.
// 15. «El puente cedió»: si el tobillo de Nicanor ya pasó, el seguimiento cuenta otra cosa.
// 16. El panel de la historia (y el aviso) con las teclas configuradas.
// 18. Chinchón como en casa: la del pozo no se tira; al cortar, el otro acomoda sus sueltas.
// 19. La batea nunca usa fruta fina.  20. Tope de 24 frutales.  22. Los frutales siguen la estación fijada en Ajustes.
// 21. Con vagones y ninguno elegido, sale sólo la locomotora (Martín avisa).
// 23. La rueda de la charla: lo de los rincones en «Hacer juntos».
// 24. Varado en la nieve sin quitanieves, te bajás y seguís a pie.
// 25. El visitante que guiás se queda aunque pase la medianoche.
// 26. Con el amor apagado, las habilidades de la pareja siguen subiendo.
// 30. Las fotos del álbum en archivos aparte (carpeta de la partida).
// 31. Los bugs chicos: lo soltado con V, la página del diario de hoy, el techito de la cocina, el clic en las cargas, el
//     cantero más cercano, el concurso sin fallo, la cita con ella ocupada, el nido de hongos a medio quemar.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
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
const { elCaballo } = await import('../src/personal-caballo.js');
const Dsl = await import('../src/aldea-desalojo.js');
const KA = await import('../src/kayak-amarre.js');
const SK = await import('../src/sulky.js');
const CB = await import('../src/caballo.js');
const TV = await import('../src/tren-viaje.js');
const TM = await import('../src/tren-mejoras.js');
const TR = await import('../src/truco.js');
const AM = await import('../src/amor.js');
const FI = await import('../src/fiestas.js');
const EV = await import('../src/eventos-valle.js');
const AC = await import('../src/accesibilidad.js');
const JM = await import('../src/juegos-mesa.js');
const GR = await import('../src/granja.js');
const VS = await import('../src/vecindad-social.js');
const SR = await import('../src/social-rueda.js');
const AV = await import('../src/aldea-vida.js');
const DI = await import('../src/diario.js');
const CO = await import('../src/concursos.js');
const IN = await import('../src/desafio-infestacion.js');
const G = await import('../src/guardado.js');
const AL = await import('../src/aldea.js');

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const requerir = createRequire(import.meta.url);
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };
const main = leer('src/main.js');
const en = (fuente, t) => { const i = fuente.indexOf(t); ok(i >= 0, `falta: ${t}`); return i; };
const trozo = (desde, hasta) => { const i = en(main, desde); const j = main.indexOf(hasta, i); ok(j > i, `falta «${hasta}» después de «${desde}»`); return main.slice(i, j + hasta.length); };
const c = (n, palo) => ({ n, palo });

// ---------------------------------------------------------------- 1. el caballo con su nombre
{
  eq([elCaballo({ nombre: 'Tormenta' }, 'a'), elCaballo({ nombre: 'Tormenta' }, 'de'), elCaballo({ nombre: 'Tormenta' }, '', true)], ['a Tormenta', 'de Tormenta', 'Tormenta'], 'con nombre: el nombre');
  eq([elCaballo({ pelaje: 'zaino' }, 'a'), elCaballo({ pelaje: 'zaino' }, 'de'), elCaballo(null, '', true)], ['al zaino', 'del zaino', 'El zaino'], 'zaino sin nombre: «el zaino»');
  eq([elCaballo({ pelaje: 'bayo' }, 'a'), elCaballo({ pelaje: 'bayo' }, 'de'), elCaballo({ pelaje: 'bayo' }, '', true)], ['a tu caballo', 'de tu caballo', 'Tu caballo'], 'de otro pelaje: «tu caballo»');
  const d = DI.crearDiario(); d.anotar('caballo');
  ok(d.cerrar(3, 'Verano', () => 0.5, 'Tormenta').texto.includes('Anduve a caballo. Tormenta conoce el valle mejor que yo: cuando dudo, lo dejo elegir.'), 'el diario, con su nombre');
  for (const t of ["'Subir al zaino'", "'Bajarte del zaino'", "'Subiste al zaino'", "'Bajaste del zaino'", "'El zaino no entra al agua honda'"]) ok(!main.includes(t), `main.js ya no escribe ${t} a mano`);
  for (const [f, t] of [['src/amor.js', 'Herrar al zaino'], ['src/tren-mejoras.js', 'el zaino viaja con vos'], ['src/rincones-cuaderno.js', 'el zaino ya lo conoce'], ['src/aldea.js', 'las herraduras al zaino'], ['src/rincones-juego.js', "'Falta el zaino'"]]) ok(!leer(f).includes(t), `${f}: sin «${t}»`);
  ok(leer('src/amor.js').includes("N('Herrar al caballo', 'Le revisás las herraduras a tu caballo vos solo: anda más liviano todo el día.'"), 'la habilidad de la veterinaria, con «tu caballo»');
}

// ---------------------------------------------------------------- 2. el último acopio
{
  const codigo = trozo('function vaciarUltimoAcopio(a = null) {', '\n}');
  const ctx = { obras: { obras: [] }, progreso: { acopio: { tronco: 3, tabla: 2, piedra: 0 } }, CLAVES_MATERIAL: ['tronco', 'tabla', 'piedra'], MATERIALES: { tronco: { nombre: 'troncos' }, tabla: { nombre: 'tablas' } }, sumados: {} };
  vm.createContext(ctx);
  vm.runInContext(`function acopio() { return progreso.acopio; } function sumarMaterial(k, n) { sumados[k] = (sumados[k] || 0) + n; } ${codigo} this.f = vaciarUltimoAcopio;`, ctx);
  ctx.obras.obras = [{ plano: { funciones: ['acopio'] } }];
  ok(ctx.f() === null && ctx.progreso.acopio.tronco === 3, 'si queda otro acopio, lo guardado sigue ahí');
  ctx.obras.obras = [];
  eq(ctx.f(), '3 troncos · 2 tablas', 'desarmado el último: la nota dice qué volvió');
  ok(ctx.sumados.tronco === 3 && ctx.sumados.tabla === 2 && Object.keys(ctx.progreso.acopio).length === 0, 'y vuelve a tus cosas');
  ctx.progreso.acopio = { tronco: 1 };
  const a = {}; ctx.f(a);
  ok(a.tronco === 1, 'en el desalojo de la aldea, se suma a lo que vuelve');
  eq(Dsl.textoDesalojo({ obras: { desarmadas: 1 }, materiales: { tronco: 4 }, acopio: true }).sub, '1 obra no entraba en ningún lado: tenés en la mochila 4 troncos (con lo que guardabas en el acopio)', 'el desalojo lo dice');
  en(main, "if (delAcopio) nota(`${r.plano.nombre} desmontado`, `${devuelto ? `Recuperaste ${devuelto}. ` : ''}Lo que tenía guardado volvió a tus cosas: ${delAcopio}`, true);");
}

// ---------------------------------------------------------------- 3. el kayak
{
  const emb = (x, z) => ({ datos: { x, z } });
  eq(KA.dondeAmanece(undefined, [emb(1, 1)]), { donde: 'cercano' }, 'partida vieja: al embarcadero más cercano, como siempre');
  eq(KA.dondeAmanece(null, [emb(1, 1)]), { donde: 'muelle' }, 'suelto en una orilla: vuelve al muelle');
  const e2 = emb(40, 12);
  ok(KA.dondeAmanece({ x: 40, z: 12 }, [emb(1, 1), e2]).obra === e2, 'amarrado: amanece en su embarcadero (no en el más cercano)');
  eq(KA.dondeAmanece({ x: 40, z: 12 }, [emb(1, 1)]), { donde: 'muelle' }, 'si su embarcadero ya no está, al muelle');
  eq([KA.sanearAmarre({ x: '3', z: 4 }), KA.sanearAmarre('x'), KA.sanearAmarre(undefined)], [{ x: 3, z: 4 }, null, undefined], 'el guardado, saneado');
  eq(KA.amarreDe(e2), { x: 40, z: 12 }, 'lo que se anota al amarrarlo');
  en(main, "kayak.subir(jugador); progreso.kayakAmarre = null;");
  en(main, "if (!desafio) progreso.kayakAmarre = amarreDe(o);");
  en(main, "{ const a = dondeAmanece(progreso.kayakAmarre, obrasTerminadas('embarcadero')); if (a.donde === 'embarcadero') amarrarKayak(a.obra); else if (a.donde === 'cercano') amarrarKayak(); }");
}

// ---------------------------------------------------------------- 4. el sulky frena
{
  ok(SK.objetivoSulky({ frena: true }) === 0 && SK.objetivoSulky({ frena: true, galope: true }) === 0, 'con S, a cero');
  ok(SK.objetivoSulky({}) === SK.velocidadSulky('trote') && SK.objetivoSulky({ galope: true }, true) === SK.velocidadSulky('galope', true), 'sin S, al trote o al galope');
  const est = { s: 100, v: SK.velocidadSulky('galope'), sentido: 1 };
  for (let t = 0; t < 4; t += 0.1) SK.andarSulky(est, 0.1, SK.objetivoSulky({ frena: true }), 1000);
  ok(est.v === 0, `mantener S frena hasta parar (v = ${est.v})`);
  const rj = leer('src/rincones-juego.js');
  ok(rj.includes("objetivoSulky({ frena: !!tecla?.('KeyS'), galope: !!(tecla?.('ShiftLeft') || tecla?.('ShiftRight')) }, caminoArreglado(r().camino))") && rj.includes('W al trote, Shift al galope, S frena. E para bajarte'), 'el sulky lo usa y la nota lo dice');
}

// ---------------------------------------------------------------- 6. el caballo y los puentes colgantes
{
  ok(CB.noPisa({ duenio: { tendido: 'puente' } }) && !CB.noPisa({ duenio: { tendido: 'tirolesa' } }) && !CB.noPisa(null), 'no pisa el tablero de un puente colgante');
  const cab = { x: 10, z: 20, yaw: 1 };
  CB.mandarAlRefugio(cab);
  eq(CB.dondeEspera(cab, { x: 0, z: 0, puerta: { x: 0, z: 0 }, mira: 0 }), CB.palenque({ x: 0, z: 0, puerta: { x: 0, z: 0 }, mira: 0 }), 'mandado al refugio: espera en el palenque');
  ok(leer('src/jugador.js').includes('if (noPisa(col.plataformaEn?.(estado.pos.x, estado.pos.z, estado.pos.y, 0.6))) {'), 'montado, se planta en el estribo');
  ok(leer('src/tirolesa.js').includes('function estriboCerca(pos, radio = 3.5) {'), 'el estribo de un puente tendido');
  // la E y el aviso, en el mismo orden: la jaula, el puente, bajarte
  const e1 = en(main, 'if (js.montado && jaulaCerca()) { subirCaballoAlTren(); break; }'), e2 = en(main, 'if (puenteDelCaballo()) { caballoEnElPuente(); break; }'), e3 = en(main, 'if (js.montado) { desmontar(); break; }');
  ok(e1 < e2 && e2 < e3, 'la E: la jaula, el puente, bajarte');
  en(main, "jaulaCerca() ? { tecla: 'E', texto: 'Subir el caballo a la jaula del tren' } : puenteDelCaballo() ? { tecla: 'E', texto: `${caballoDicho('', true)} no cruza el puente: bajarte` } : { tecla: 'E', texto: `Bajarte ${caballoDicho('de')}` };");
  const pr = trozo('async function caballoEnElPuente() {', '\n}');
  ok(pr.includes("{ si: 'Mandarlo al refugio', no: 'Amarrarlo acá' }") && pr.includes('mandarAlRefugio(c);') && pr.includes('guardar();'), 'pregunta, te baja y se guarda');
  ok(pr.includes("nota(`${caballoDicho('', true)} vuelve solo al refugio`, 'Te espera atado al palenque');") && pr.includes("nota(`Amarraste ${caballoDicho('a')} al estribo`, 'Te espera acá: volvé a subir con E');"), 'las notas');
}

// ---------------------------------------------------------------- 7. una siesta por viaje
{
  const v = TV.sanearViaje({});
  ok(TV.puedeSiesta(v), 'el primer viaje, la siesta está');
  TV.empezarViaje(v, 30.5); TV.anotarSiesta(v);
  ok(!TV.puedeSiesta(v), 'dormida, no hay otra en el mismo viaje');
  ok(!TV.puedeSiesta(TV.sanearViaje(JSON.parse(JSON.stringify(v)))), 'tampoco al recargar');
  TV.empezarViaje(v, 40);
  ok(TV.puedeSiesta(v), 'en el viaje siguiente, otra');
  const u = trozo('function usarLugarDelTren() {', '\n}');
  ok(u.includes("if (!deNoche && !puedeSiesta(viajeTren())) { nota('Ya dormiste la siesta en este viaje', 'Una por viaje: en el próximo, otra'); return true; }") && u.includes('if (!deNoche && durmiendo) anotarSiesta(viajeTren());'), 'la cucheta lo respeta');
  en(main, "puedeSiesta(viajeTren()) ? 'Dormir una siesta en la cucheta' : 'La cucheta (la siesta ya la dormiste en este viaje)'");
  en(main, 'if (subido && !enTrenAntes && !desafio) empezarViaje(viajeTren(), ahoraJuego());');
}

// ---------------------------------------------------------------- 9. el truco: al mazo con el truco querido
{
  const armar = (mias, suyas) => { const p = TR.partidoNuevo({ semilla: 1, empieza: 0 }); p.ronda.cartas = [mias, suyas]; p.ronda.mano = 0; p.ronda.turno = 0; p.mano = 0; return p; };
  const h = (p, j, a) => { const r = TR.actuar(p, j, a); assert.ok(r.ok, a); };
  for (const [cantos, vale] of [[['truco'], 2], [['truco', 'retruco'], 3], [['truco', 'retruco', 'vale4'], 4]]) {
    const p = armar([c(4, 'oro'), c(5, 'basto'), c(6, 'copa')], [c(3, 'oro'), c(2, 'basto'), c(5, 'espada')]);
    cantos.forEach((k, i) => h(p, i % 2, k));
    h(p, cantos.length % 2, 'quiero');
    h(p, 0, 'mazo');
    eq(p.puntos, [0, vale], `al mazo en la primera, sin envido, con ${cantos[cantos.length - 1]} querido: ${vale} (no ${vale + 1})`);
  }
  const p = armar([c(4, 'oro'), c(5, 'basto'), c(6, 'copa')], [c(3, 'oro'), c(2, 'basto'), c(5, 'espada')]);
  h(p, 0, 'mazo');
  eq(p.puntos, [0, 2], 'sin truco, como siempre: uno más por el envido sin cantar');
}

// ---------------------------------------------------------------- 10. rehacer la vida
{
  const aldea = AL.aldeaNueva();
  aldea.pobladores = AL.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 }));
  const progreso = (dia, personas, extra = {}) => ({ dia, horas: 10, aldea, vecindad: {}, amor: AM.sanearAmor({ personas, ...extra }, dia) });
  const sep = { etapa: 'separados', afecto: 30, desde: 20, contacto: 20 };
  const k = AM.ORDEN_CANDIDATAS.filter((x) => x !== 'fotografa').find((x) => AM.puedeRomance(x, progreso(1, {})).ok);
  ok(!!k, 'hay otra candidata en la aldea');
  ok(AM.puedeRomance(k, progreso(22, { fotografa: sep }, { conyuge: 'fotografa' })).motivo === 'tenes-pareja', 'recién separado, todavía no');
  ok(AM.puedeRomance(k, progreso(24, { fotografa: sep }, { conyuge: 'fotografa' })).ok, 'pasada una estación (4 días), sí');
  ok(AM.puedeRomance('fotografa', progreso(24, { fotografa: sep }, { conyuge: 'fotografa' })).ok, 'la reconquista sigue');
  // el día que se cumple, el aviso y el anillo
  const p = progreso(23, { fotografa: { ...sep } }, { conyuge: 'fotografa', anillo: { pedido: 5, listo: 8, retirado: true, para: 'fotografa' } });
  ok(AM.mundoAmor(p).anillo?.estado === 'dado', 'separados hace poco: el anillo, dado');
  p.amor.dia = 23;
  const r = AM.pasarDiaAmor(p, 24);
  const aviso = r.eventos.find((e) => e.tipo === 'rehacer');
  eq(aviso && [aviso.texto, aviso.sub], ['Pasó una estación desde que Sofía y vos se separaron', 'Te podés volver a enamorar. Y si querés reconquistarla, todavía estás a tiempo'], 'el aviso');
  p.dia = 24;
  ok(AM.mundoAmor(p).anillo === null, 'el anillo deja de figurar como «dado»');
  // la partida guardada: la novia nueva queda (antes se volvía «conocidos» al cargar) y la separada sigue separada
  const q = AM.sanearAmor({ personas: { fotografa: { ...sep }, [k]: { etapa: 'novios', afecto: 50, desde: 25, contacto: 25 } }, conyuge: 'fotografa' }, 26);
  ok(q.personas[k].etapa === 'novios' && q.personas.fotografa.etapa === 'separados', 'rehecha la vida, la novia nueva se guarda');
  const q2 = AM.sanearAmor({ personas: { fotografa: { ...sep, desde: 25 }, [k]: { etapa: 'novios', afecto: 50, desde: 25, contacto: 25 } }, conyuge: 'fotografa' }, 26);
  ok(q2.personas[k].etapa === 'conocidos', 'recién separado, una novia nueva no vale (como antes)');
  const q3 = AM.sanearAmor({ personas: { fotografa: { ...sep }, [k]: { etapa: 'comprometidos', afecto: 70, desde: 25, contacto: 25 } }, conyuge: 'fotografa', anillo: { pedido: 22, listo: 25, retirado: true, para: k }, boda: { con: k, dia: 28 } }, 26);
  ok(q3.personas[k].etapa === 'comprometidos' && q3.anillo?.para === k && q3.boda?.con === k, 'y hasta comprometido de nuevo, con su anillo y su boda');
}

// ---------------------------------------------------------------- 11. una clase de baile por día
{
  const e = FI.fiestasNuevas();
  ok(FI.puedeTomarClase(e, 9), 'a la mañana, la clase está');
  FI.empezarClase(e, 9);
  ok(!FI.puedeTomarClase(e, 9) && FI.puedeTomarClase(e, 10), 'empezada (aunque salgas con Escape), hasta mañana no hay otra');
  ok(leer('src/fiestas-juego.js').includes('    empezarClase(estado(), dia());   // 3.8.4: una por día, aunque salgas a la mitad'), 'abrir la clase la cuenta');
}

// ---------------------------------------------------------------- 12. un solo nombre de la locomotora
{
  const p = { tren: TM.trenNuevo(), personal: { trochita: { nombre: '', coches: '#6b4a2e' } } };
  TM.nombrarLocomotora(p, 'La Patagonia');
  ok(p.tren.loco.nombre === 'La Patagonia' && p.personal.trochita.nombre === 'La Patagonia' && p.personal.trochita.coches === '#6b4a2e', 'el del taller pasa a Personalizar');
  TM.nombrarLocomotora(p, 'Rayo');
  ok(p.tren.loco.nombre === 'Rayo' && p.personal.trochita.nombre === 'Rayo', 'gana el último');
  const vieja = { tren: { ...TM.trenNuevo(), loco: { ...TM.trenNuevo().loco, nombre: 'Del taller' } }, personal: { trochita: { nombre: 'De personalizar' } } };
  ok(TM.unificarNombreLoco(vieja) === 'Del taller' && vieja.personal.trochita.nombre === 'Del taller', 'una partida vieja con dos: queda el que se veía (el del taller)');
  const sinTaller = { tren: TM.trenNuevo(), personal: { trochita: { nombre: 'Lucero' } } };
  ok(TM.unificarNombreLoco(sinTaller) === 'Lucero' && sinTaller.tren.loco.nombre === 'Lucero', 'sin nombre del taller, el de Personalizar');
  ok(TM.unificarNombreLoco({ personal: {} }) === null, 'sin tren mejorado (el Desafío), nada');
  en(main, "if (s.id === 'trochita' && parcial && Object.hasOwn(parcial, 'nombre') && progreso.tren) nuevo.nombre = nombrarLocomotora(progreso, nuevo.nombre);");
  ok(leer('src/taller-tren-juego.js').includes('if (ctx.progreso?.()) nombrarLocomotora(ctx.progreso(), t.loco.nombre);'), 'y el taller, el de Personalizar');
  ok(leer('src/guardado.js').includes('  unificarNombreLoco(limpio);'), 'al cargar, uno solo');
}

// ---------------------------------------------------------------- 15. «El puente cedió»
{
  const ev = EV.sanearEventosValle(null, () => 0.5);
  eq(EV.seguimientoDe(ev, 's-puente-caida').texto, EV.SEGUIMIENTOS['s-puente-caida'].texto, 'sin el tobillo todavía: Nicanor al agua (y sigue el evento)');
  ev.hechos.tobillo = { dia: 3, opcion: 'llevar' };
  EV.agendar(ev, 's-puente-caida', 5);
  const r = EV.cerrarSeguimiento(ev, 's-puente-caida', 6);
  eq([r.seguimiento.titulo, r.seguimiento.texto], ['El puente cedió', 'Ercilia te lo contó en el almacén: el puente del arroyo terminó de ceder con la última crecida. Por suerte no pasaba nadie; ahora los de la otra orilla cruzan por el vado, con el agua a las rodillas.'], 'con el tobillo ya pasado, cuenta otra cosa');
  ok(r.cadena === null && !ev.activo, 'y no encadena el tobillo');
  ok(EV.seguimientoDe(EV.sanearEventosValle(null, () => 0.5), 's-puente-caida', { vecinos: false }).texto.includes('Por suerte no pasaba nadie'), 'sin vecinos, tampoco cuenta lo de Nicanor');
  ok(leer('src/eventos-valle-ui.js').includes('seguimiento: seguimientoDe(e, listo.id, { vecinos: ctx.extra().vecinos !== false }) || SEGUIMIENTOS[listo.id]'), 'la tarjeta muestra lo que se cuenta');
}

// ---------------------------------------------------------------- 16. las teclas configuradas
{
  const mapa = { ...AC.mapaPorDefecto(), interactuar: 'KeyR', planos: 'KeyU', saltar: 'KeyB' };
  eq(['E', 'O', 'Espacio', 'Q', 'T', '·', 'F'].map((t) => AC.teclaVisible(t, mapa)), ['R', 'U', 'B', 'Q', 'T', '·', 'F'], 'la del jugador; lo que no es de una acción, igual');
  eq(AC.teclaVisible('E', AC.mapaPorDefecto()), 'E', 'con las de fábrica, las de siempre');
  ok(leer('src/historia-ui.js').includes("escP(ctx.teclaVisible ? ctx.teclaVisible(o.tecla) : o.tecla)"), 'el panel de la historia');
  en(main, 'teclaVisible: (t) => teclaVisible(t, teclasPropias),');
  en(main, "k.textContent = teclaVisible(t.tecla, teclasPropias);");
}

// ---------------------------------------------------------------- 18. el chinchón como en casa
{
  const p = JM.chinchonNuevo({ semilla: 5 });
  const r = p.ronda;
  r.cartas[0] = [c(1, 'oro'), c(2, 'oro'), c(3, 'oro'), c(5, 'copa'), c(5, 'oro'), c(5, 'basto'), c(4, 'espada')];
  r.turno = 0; r.fase = 'robar'; r.pozo.push(c(9, 'copa'));
  JM.actuarChinchon(p, 0, 'pozo');
  const i9 = r.cartas[0].findIndex((x) => x.n === 9 && x.palo === 'copa');
  const acc = JM.accionesChinchon(p, 0);
  ok(!acc.includes(`tirar:${i9}`) && !acc.includes(`cortar:${i9}`) && acc.filter((a) => a.startsWith('tirar:')).length === r.cartas[0].length - 1, 'la que levantaste del pozo no se tira');
  ok(!JM.actuarChinchon(p, 0, `tirar:${i9}`).ok, 'ni a la fuerza');
  // el rival tampoco: levantó un rey que no le sirve y lo mejor sería tirarlo (cortaría), pero no puede
  const p2 = JM.chinchonNuevo({ semilla: 7 });
  p2.ronda.cartas[1] = [c(1, 'oro'), c(2, 'oro'), c(3, 'oro'), c(5, 'copa'), c(5, 'oro'), c(5, 'basto'), c(4, 'espada')];
  p2.ronda.turno = 1; p2.ronda.fase = 'robar'; p2.ronda.pozo.push(c(12, 'copa'));
  JM.actuarChinchon(p2, 1, 'pozo');
  const d2 = JM.decidirChinchon(p2, 1), i2 = Number(d2.split(':')[1]);
  ok(!JM.esLaDelPozo(p2.ronda, p2.ronda.cartas[1][i2]) && d2.startsWith('tirar:'), `el rival no tira la que levantó del pozo (${d2})`);
  // al cortar, el otro acomoda sus sueltas
  const a = JM.acomodarSueltas([[c(1, 'oro'), c(2, 'oro'), c(3, 'oro')], [c(7, 'copa'), c(7, 'oro'), c(7, 'basto')]], [c(4, 'oro'), c(5, 'oro'), c(7, 'espada'), c(12, 'copa')], [0, 1, 2, 3]);
  ok(a.puestas.length === 3 && a.resto === 12, `el 4 y el 5 de oro en la escalera, el 7 en la pierna: queda el 12 (${a.resto})`);
  const q = JM.chinchonNuevo({ semilla: 4 });
  q.ronda.cartas[0] = [c(1, 'oro'), c(2, 'oro'), c(3, 'oro'), c(7, 'copa'), c(7, 'oro'), c(7, 'basto'), c(12, 'copa')];
  q.ronda.cartas[1] = [c(12, 'espada'), c(11, 'oro'), c(10, 'basto'), c(4, 'copa'), c(5, 'oro'), c(1, 'basto'), c(2, 'copa')];
  q.ronda.turno = 0; q.ronda.fase = 'robar'; q.ronda.mazo.push(c(4, 'oro'));
  JM.actuarChinchon(q, 0, 'mazo');
  const ev = JM.actuarChinchon(q, 0, `cortar:${q.ronda.cartas[0].findIndex((x) => x.n === 12)}`).eventos;
  ok(q.puntos[1] === 40 && ev.some((e) => e.tipo === 'acomoda' && e.quien === 1 && e.n === 1), 'cortó: el otro acomoda el 5 de oro y se anota 40 (no 45)');
  ok(leer('src/fiestas-juego.js').includes("`${quien} acomoda ${e.n === 1 ? 'una carta' : `${e.n} cartas`} en tus juegos`"), 'y se cuenta en la mesa');
}

// ---------------------------------------------------------------- 19, 20 y 22. la batea, los frutales y la estación fijada
{
  eq(GR.SOBRAS, ['papa', 'haba', 'manzana', 'pera', 'ciruela'], 'las sobras, sin fruta fina');
  ok(GR.sobraParaEchar((k) => (['calafate', 'frutilla', 'cereza', 'frambuesa', 'grosella'].includes(k) ? 5 : 0)) === null, 'con sólo fruta fina, no hay sobras');
  ok(GR.sobraParaEchar((k) => (k === 'calafate' || k === 'pera' ? 3 : 0)) === 'pera', 'teniendo de las dos, va la pera');
  ok(GR.textoChiquero({ chancha: {}, batea: 0 }, null) === 'Batea: 0 · hacen falta sobras (papas, habas, manzanas, peras o ciruelas)', 'el aviso lo dice');
  ok(GR.GRANJA.frutales === 24, 'hasta 24 frutales');
  ok(leer('src/granja-mundo.js').includes('GRANJA.frutales') && leer('src/granja-juego.js').includes('Object.keys(g.frutales).length >= GRANJA.frutales'), 'el mundo y el juego usan el tope');
  const f = { especie: 'cerezo', plantado: 1, cosecha: -1 };
  // el día 11 es invierno en el calendario
  ok(GR.estadoFrutal(f, 11, 10, 'auto').fruta === 'no' && GR.textoFrutal(f, 11, 10, null, 'auto') === 'Cerezo · descansa en invierno; en primavera, flor', 'auto: en el invierno del calendario, descansa');
  ok(GR.estadoFrutal(f, 11, 10, 'verano').fruta === 'madura' && GR.textoFrutal(f, 11, 10, null, 'verano') === 'Juntar las cerezas (14)', 'con el verano fijado, cerezas maduras');
  ok(GR.textoFrutal(f, 8, 10, null, 'invierno') === 'Cerezo · descansa en invierno; en primavera, flor' && GR.textoFrutal(f, 8, 10, null, 'auto') !== GR.textoFrutal(f, 8, 10, null, 'invierno'), 'con el invierno fijado, descansa (aunque el calendario diga otoño)');
  ok(GR.estadoFrutal(f, 1, 0.5, 'auto').flor && !GR.estadoFrutal(f, 1, 0.5, 'invierno').flor && !GR.estadoFrutal(f, 1, 0.5, 'verano').flor, 'la flor de la primavera, sólo con las estaciones de verdad');
  ok(GR.estadoFrutal({ especie: 'manzano', plantado: 1, cosecha: -1 }, 11, 10, 'otono').fruta === 'madura', 'con el otoño fijado, las manzanas');
  ok(GR.estadoFrutal(f, 11, 10, true).fruta === 'no' && GR.estadoFrutal(f, 7, 10, false).fruta === 'madura', 'los booleanos de antes siguen valiendo');
  ok(leer('src/granja-juego.js').includes("const estacionFrutal = () => ctx.ajustes?.()?.estacion || 'auto';"), 'el juego le pasa la estación de Ajustes');
}

// ---------------------------------------------------------------- 21. la locomotora sola
{
  eq(TV.composicionDe({ vagones: { mirador: true, carga: true }, composicion: [] }), [], 'con vagones hechos y ninguno enganchado: sólo la locomotora');
  eq(TV.composicionDe(undefined), ['segunda', 'segunda2'], 'sin vagones nuevos, los dos de segunda de siempre');
  eq(TV.composicionDe({ vagones: { carga: true }, composicion: ['carga'] }), ['segunda', 'carga'], 'con alguno, siempre hay dónde viajar');
  const tro = leer('src/trochita.js');
  ok(tro.includes('const hayCoches = () => !tren.offCoches || tren.offCoches.length > 0;') && tro.includes('const guarda = pg ? {') && tro.includes('(!puerta || dCab + 1 < Math.hypot(puerta.x - js.pos.x, puerta.z - js.pos.z))'), 'sin coches: sin guarda ni puerta, y la cabina se puede tomar');
  ok(leer('src/taller-tren-juego.js').includes("ctx.nota('Martín: «Así sale la locomotora sola»', 'Sin vagones vas sin carga y sin pasajeros: se viaja en la cabina', true)"), 'Martín avisa que vas sin carga');
}

// ---------------------------------------------------------------- 23. «Hacer juntos»
{
  ok(SR.categoriaDeOpcion('rincones:sulky') === 'hacer' && SR.categoriaDeOpcion('rincones:aprender:telar') === 'hacer' && SR.categoriaDeOpcion('regalar') === 'ayuda', 'lo de los rincones, en su sección');
  const menu = { tipo: 'charla', opciones: [{ id: 'como-andas', titulo: '¿Cómo andás?' }, { id: 'regalar', titulo: 'Regalar…' }, { id: 'rincones:sulky', titulo: 'Pedirle un sulky' }, { id: 'chau', titulo: 'Nada más, chau' }] };
  const rueda = SR.armarRueda(menu, null, VS.CATEGORIAS_RUEDA);
  const h = rueda.categorias.find((x) => x.id === 'hacer');
  ok(h && h.nombre === 'Hacer juntos' && h.opciones.length === 1 && h.opciones[0].titulo === 'Pedirle un sulky', 'la rueda: «Hacer juntos» con lo de Tito');
  ok(!rueda.categorias.find((x) => x.id === 'ayuda').opciones.some((o) => String(o.id).startsWith('rincones:')), 'y no entre los regalos');
}

// ---------------------------------------------------------------- 24. varado en la nieve
{
  const tro = leer('src/trochita.js');
  ok(tro.includes('const varadoEnNieve = () => est.subido && !est.varado && est.esperaNieve > 0 && est.vel < 0.05;') && tro.includes('varadoEnNieve, bajarEnLaNieve,'), 'la trochita sabe cuándo se puede bajar');
  const e1 = en(main, 'if (js.enTren && usarLugarDelTren()) break;'), e2 = en(main, 'if (js.enTren && tren.varadoEnNieve?.()) { bajarEnLaNieve(); break; }'), e3 = en(main, 'if (js.enTren && tren.conduciendo()) { bajarDeLaCabina(); break; }');
  ok(e1 < e2 && e2 < e3, 'la E: lo del vagón, bajarte en la nieve, la cabina');
  en(main, "else aviso = avisoLugarDelTren() || (tren.parado() ? { tecla: 'E', texto: 'Bajar del tren' } : tren.varadoEnNieve?.() ? { tecla: 'E', texto: 'Bajarte y seguir a pie' } : null);");
  en(main, "if (!vecino && tren.conduciendo()) aviso = tren.parado() && !enLasCargas() ? { tecla: 'E', texto: 'Bajar de la cabina' } : tren.varadoEnNieve?.() ? { tecla: 'E', texto: 'Bajarte y seguir a pie' } : null;");
  ok(trozo('function bajarEnLaNieve() {', '\n}').includes("nota('Te bajaste en la nieve', 'El tren espera a la cuadrilla con las palas: vos seguí a pie', true);"), 'la nota');
}

// ---------------------------------------------------------------- 25. el visitante que guiás
{
  const vis = { id: AV.VISITANTES[0].id, lugar: Object.keys(AV.LUGARES_VISITA)[0], dia: 7, estado: 'guiando' };
  ok(AV.visitanteSigue(vis, 8, 1) && !AV.visitanteSigue(vis, 9, 1), 'guiándolo, sigue pasada la medianoche (hasta el día siguiente)');
  ok(!AV.visitanteSigue({ ...vis, estado: 'anden' }, 8, 1) && !AV.visitanteSigue({ ...vis, estado: 'anden' }, 7, 20) && AV.visitanteSigue({ ...vis, estado: 'anden' }, 7, 19), 'el que nadie llevó, como siempre');
  ok(AV.sanearVidaAldea({ visitante: vis }, 8).visitante?.estado === 'guiando', 'y se guarda con la partida');
  ok(AV.sanearVidaAldea({ visitante: { ...vis, estado: 'anden' } }, 8).visitante === null, 'el de ayer en el andén, ya se fue');
  ok(leer('src/aldea-gente.js').includes('if (!visitanteSigue(vis, d, h)) { visitanteSeVa(v); ocultarVisitantes(); ctx.guardar(); return; }'), 'la aldea lo usa');
}

// ---------------------------------------------------------------- 26. el amor apagado
{
  const k = 'fotografa';
  const p = { dia: 10, horas: 9, amor: AM.sanearAmor({ personas: { [k]: { etapa: 'casados', afecto: 90, contacto: 10, desde: 4 } }, conyuge: k, habilidades: { [k]: { nivel: 1, estacion: 2 } }, dia: 10 }, 10) };
  p.amor.dia = 10;
  for (let d = 11; d <= 22; d++) AM.pasarDiaAmor(p, d, { romance: false });
  ok(p.amor.habilidades[k].nivel === 3, `apagado, siguen subiendo una por estación (nivel ${p.amor.habilidades[k].nivel})`);
  const antes = p.amor.habilidades[k].estacion;
  const r = AM.pasarDiaAmor(p, 23, { romance: true });
  ok(!r.eventos.some((e) => e.tipo === 'habilidad') && p.amor.habilidades[k].estacion === antes, 'al prenderlo, sin saltos');
  ok(!leer('src/amor.js').includes('hb.estacion += Math.floor(n / 4)'), 'congelar ya no corre las estaciones');
}

// ---------------------------------------------------------------- 30. las fotos del álbum en archivos
{
  const FM = requerir(path.join(raiz, 'fotos-main.cjs'));
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-fotos-'));
  try {
    ok(FM.carpetaFotos(base, 'hojarasca-desafio-p2-fotos-v1') === path.join(base, 'partidas', 'hojarasca-desafio-p2', 'fotos') && FM.carpetaFotos(base, '../malo') === null, 'la carpeta de cada partida');
    const jpg = `data:image/jpeg;base64,${Buffer.from('foto de prueba').toString('base64')}`;
    ok(FM.escribirFotos(base, 'hojarasca-fotos-v1', { 'f-cisnes': jpg, 'raro/ñ': jpg, basura: 'no es imagen' }), 'se escriben');
    const dir = FM.carpetaFotos(base, 'hojarasca-fotos-v1');
    eq(fs.readdirSync(dir).sort(), ['_7261726f2fc3b1.jpg', 'f-cisnes.jpg'], 'un archivo por foto (lo raro, en hexadecimal)');
    eq(FM.leerFotos(base, 'hojarasca-fotos-v1'), { 'f-cisnes': jpg, 'raro/ñ': jpg }, 'y se leen iguales');
    FM.escribirFotos(base, 'hojarasca-fotos-v1', { 'f-cisnes': jpg });
    eq(fs.readdirSync(dir), ['f-cisnes.jpg'], 'la que ya no está, se borra');
    // el guardado las usa cuando está Electron (preload.cjs: hojarasca.fotos)
    globalThis.hojarasca = { fotos: { leer: (k) => FM.leerFotos(base, k), escribir: (k, f) => FM.escribirFotos(base, k, f), borrar: (k) => FM.borrarFotos(base, k) } };
    almacen.set('hojarasca-p2-fotos-v1', JSON.stringify({ lago: jpg }));
    eq(G.leerPartida('relax', 2), null, '(sin partida en la ranura 2)');
    const p = { ...G.progresoNuevo(), dia: 4, desafios: { lago: { dia: 2, hora: 9 }, faro: { dia: 3, hora: 21 } } };
    ok(G.escribirPartida('relax', 2, p, { lago: jpg, faro: jpg }), 'una partida con fotos');
    ok(!almacen.has('hojarasca-p2-fotos-v1') && fs.readdirSync(FM.carpetaFotos(base, 'hojarasca-p2-fotos-v1')).length === 2, 'las fotos van a archivos, no al localStorage');
    G.usarModoGuardado('relax', 2);
    const cargada = G.cargarProgreso();
    ok(cargada.desafios.lago.img === jpg && cargada.desafios.faro.img === jpg, 'y al cargar vuelven a pegarse');
    // las de antes (en el localStorage) pasan a los archivos la primera vez
    almacen.set('hojarasca-p3-fotos-v1', JSON.stringify({ vieja: jpg }));
    G.usarModoGuardado('relax', 3);
    eq(G.cargarFotos(), { vieja: jpg }, 'la vieja se lee');
    ok(!almacen.has('hojarasca-p3-fotos-v1') && FM.leerFotos(base, 'hojarasca-p3-fotos-v1').vieja === jpg, 'y quedó en su archivo');
    G.borrarPartida('relax', 2);
    ok(!fs.existsSync(FM.carpetaFotos(base, 'hojarasca-p2-fotos-v1')), 'borrar la partida borra sus fotos');
    G.usarModoGuardado('relax', 1);
  } finally { delete globalThis.hojarasca; fs.rmSync(base, { recursive: true, force: true }); }
  ok(JSON.parse(leer('package.json')).build.files.includes('fotos-main.cjs') && leer('main.cjs').includes("require('./fotos-main.cjs').registrarFotos({ ipcMain, app, alError: (m) => escribirCrash('fotos', m) });"), 'viaja en el instalador y se engancha');
  ok(leer('preload.cjs').includes("leer: (clave) => ipcRenderer.sendSync('fotos-leer', String(clave || ''))"), 'el puente de preload');
}

// ---------------------------------------------------------------- 31. los bugs chicos
{
  // lo soltado con V
  const obj = leer('src/objetos.js');
  ok(obj.includes('for (const s of soltadosGuardados) soltar(s.tipo, s.x, s.z, s);') && obj.includes('if (it.suelto) { const i = progreso.soltados.indexOf(it.suelto); if (i >= 0) progreso.soltados.splice(i, 1); it.suelto = null; return true; }'), 'lo soltado se guarda, vuelve al cargar y sale de la lista al levantarlo');
  const g = G.progresoNuevo();
  const limpio = (x) => { G.usarModoGuardado('relax', 3); G.guardarProgreso({ ...g, dia: 5, ...x }); return G.cargarProgreso(); };
  eq(limpio({ soltados: [{ tipo: 'ramita', x: 3, z: 4 }, { tipo: 'hacha', x: 1, z: 1 }, { tipo: 'canto', x: 'a', z: 1 }] }).soltados, [{ tipo: 'ramita', x: 3, z: 4 }], 'saneado al cargar');
  // la página del diario de hoy
  const d = DI.crearDiario(); d.anotar('kayak'); d.anotar('lugar', 'el mirador');
  const pg = limpio({ diarioHoy: d.paraGuardar(5) }).diarioHoy;
  const d2 = DI.crearDiario();
  ok(d2.cargarHoy(pg, 5) && d2.hoy.kayak === true && d2.hoy.lugares[0] === 'el mirador', 'la página de hoy vuelve al cargar');
  ok(limpio({ diarioHoy: d.paraGuardar(4) }).diarioHoy === null, 'la de otro día, no (ya se escribió)');
  en(main, 'progreso.diarioHoy = diario.paraGuardar(progreso.dia);');
  en(main, 'diario.cargarHoy(progreso.diarioHoy, progreso.dia);');
  // el techito de la cocina
  const coc = leer('src/cocina-juego.js');
  ok(coc.includes('if (panel?.de?.o && (ctx.obras?.()?.obras || []).includes(panel.de.o)) panel.est = estDe(panel.de.o);') && (coc.match(/refrescarEstacion\(\);/g) || []).length === 2, 'el panel de cocina vuelve a mirar el techito');
  // el clic en el puesto de cargas
  ok(trozo('function marcarClicHud(el) {', '\n}').includes('if (marcaHud.panel !== l.id) marcarEn(l.id, i); else marcaHud.i = i;') && main.includes('ev.stopPropagation(); marcarClicHud(el); fn(); });') && main.includes('alClic: (el, fn) => alClicHud(el, fn),   // 3.8.4: el clic mueve la marca del mando'), 'el clic mueve la marca del mando');
  ok(leer('src/comercio-mundo.js').includes('if (ctx.alClic) ctx.alClic(li, () => elegir(i));'), 'también en las cargas');
  // el cantero más cercano
  ok(leer('src/rincones-juego.js').includes('cantero = { tipo, i: k.i }; dc = dk;'), 'el cantero de la huerta: el más cercano');
  // el concurso sin fallo
  const e = CO.concursosNuevo();
  const id = Object.keys(CO.CONCURSOS)[0];
  e.inscripto = { id, dia: 4, k: 'x', que: 'algo', calidad: 50 };
  eq(CO.sinFallo(e, 5, () => null), [{ id, dia: 4 }], 'la inscripción de ayer, sin fallo');
  eq(CO.sinFallo(CO.concursosNuevo(), 5, (dd) => (dd === 4 ? id : null)), [{ id, dia: 4 }], 'el concurso de ayer, sin fallo');
  CO.fallar(e, id, 4);
  eq(CO.sinFallo(e, 5, () => id), [], 'fallado, nada pendiente');
  ok(CO.sanearConcursos({ inscripto: { id, dia: 4, k: 'x', que: 'algo', calidad: 50 } }, 5).inscripto?.dia === 4, 'la inscripción de otro día se guarda hasta el fallo');
  // la cita con ella ocupada
  const cand = 'fotografa';
  const pc = { dia: 8, horas: 21, amor: AM.sanearAmor({ personas: { [cand]: { etapa: 'saliendo', afecto: 40, contacto: 8 } }, cita: { clave: cand, lugar: 'mirador', dia: 8, desde: 18, hasta: 19.5, ocupada: true } }, 8) };
  const af = pc.amor.personas[cand].afecto;
  const v = AM.vencerCita(pc);
  ok(v?.tipo === 'no-pudo' && v.texto === 'Sofía no pudo ir a la cita' && pc.amor.personas[cand].afecto === af && !pc.amor.personas[cand].motivo, 'ella ocupada: se cae sin «plantada»');
  const pc2 = { dia: 8, horas: 21, amor: AM.sanearAmor({ personas: { [cand]: { etapa: 'saliendo', afecto: 40, contacto: 8 } }, cita: { clave: cand, lugar: 'mirador', dia: 8, desde: 18, hasta: 19.5, ocupada: true, espero: true } }, 8) };
  ok(AM.vencerCita(pc2)?.tipo === 'plantada', 'si llegó a esperarte, sí te plantaste vos');
  ok(leer('src/amor-juego.js').includes('if (quiere.por === \'cita\' && cita) { const n = ctx.npcDe?.(quiere.clave); if (n?.enCita) cita.ocupada = true; }'), 'el juego anota que estaba ocupada');
  // el nido de hongos a medio quemar
  eq(IN.sanearCapullos([{ x: 1, z: 2, golpes: 1, quema: 1.2 }, { x: 3, z: 4, quema: 99 }, { x: 5, z: 6 }]), [{ x: 1, z: 2, golpes: 1, quema: 1.2 }, { x: 3, z: 4, golpes: 0, quema: IN.CAPULLOS.quemar }, { x: 5, z: 6, golpes: 0 }], 'el que se quemaba sigue quemándose al cargar');
  ok(leer('src/desafio.js').includes('const quemandoCapullo = { has: (c) => c?.quema > 0,'), 'la quema va en el nido mismo');
  G.usarModoGuardado('relax', 1);
}

console.log(`verificar-3-8-4-relax: ${pasos} comprobaciones OK`);
