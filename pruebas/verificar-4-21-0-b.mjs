// 4.21.0 (B): la Historia arranca bien. Lo que se arregló, con comprobación de que antes fallaba (cada arreglo tiene su mutación: la misma prueba sobre una copia de
// src/ con el arreglo deshecho tiene que fallar):
//   1. la estación propia de la Historia: una Historia nueva (o por empezar) se cuenta con las estaciones solas aunque el ajuste diga «Verano»; una Historia empezada
//      antes conserva la que se eligió a mano; el selector se apaga con el motivo
//   2. la hora de tu reloj no va con la Historia: el chip se apaga y, al empezar o retomar, el día vuelve a durar lo de fábrica
//   3. la línea de espera del panel («Falta esperar hasta las 17:00 (R te sienta…)») para todo objetivo que sólo espera la hora, y el texto de la guardia (0:30 a 2:30)
//   4. el panel único: sin «Primeros pasos» con la Historia en marcha (ni en una Historia nueva en pausa)
//   5. un indicio antes: la risa de la primera noche, anotada al despertar
//   6. los premios en pesos por capítulo (23.600 en total; las 26 yerbas que ya no se venden pasan a pesos) y el renglón corto del libro de pesos
//   7. las metas con plata (una por acto): el puesto de la feria, el establo del zaino y el cobertizo de heno; optativas que nunca traban y no cruzan de acto
//   8. las puertas dicen «en un par de días» (la estación sí cambia, pero a lo sumo son dos días)
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { H, D, O, imp, nuevaPartida, crearJuego, jugar } from './ayuda-4-18-4-historia.mjs';
import { funcion, expresion, enUnaLinea } from './ayuda-codigo.mjs';

const AJ = await imp('historia-ajustes.js'), EP = await imp('historia-espera.js'), ECO = await imp('economia.js'), TXO = await imp('historia-texto-optativas.js'), TX1 = await imp('historia-texto-acto1.js');

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4184_SRC || join(raiz, 'src');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const HIJO = !!process.env.A4184_SRC;
const SEC = process.env.A4210_SECCIONES ? new Set(process.env.A4210_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4210_CALLADO) console.log('FALLA ' + t); } };

const main = leer('main.js'), historiaJs = leer('historia.js'), historiaUi = leer('historia-ui.js');
const IDS = H.CAPITULOS.map((c) => c.id);
// una partida de mentira en el capítulo `cap` (id), con lo anterior cerrado
function armar(cap, o = {}) {
  const { P, X } = nuevaPartida();
  const h = P.historia, idx = IDS.indexOf(cap);
  IDS.slice(0, idx).forEach((k) => { h.cerrados[k] = 1; });
  Object.assign(h, { activa: true, capitulo: idx, fase: o.fase || 'jugando', empezada: 1 });
  for (const e of o.vistas || []) h.escenas.vistas[e] = 1;
  P.horas = o.horas ?? 12; P.dia = o.dia ?? 5;
  h.base = { dia: o.baseDia ?? 5 };
  Object.assign(X, o.extra || {});
  return { P, X, h, s: () => H.estadoHistoria(P, X) };
}
const aj = (o = {}) => ({ modo: 'relax', relaxTipo: 'historia', estacion: 'verano', duracion: 30, ...o });

// ---------------------------------------------------------------- 1. la estación propia
if (va('estacion')) {
  const nueva = H.historiaNueva(); H.empezarHistoria(nueva, 1);
  ok(nueva.arranqueNuevo === true, 'empezar una Historia nueva anota que trae su estación');
  const vieja = H.historiaNueva(); Object.assign(vieja, { activa: true, empezada: 3, capitulo: 5, fase: 'jugando' });
  ok(AJ.estacionEfectiva(aj(), nueva) === 'auto', 'Historia nueva con «Verano» de fábrica: las estaciones pasan solas');
  ok(AJ.estacionEfectiva(aj({ estacion: 'invierno' }), nueva) === 'auto', 'aunque el ajuste diga «Invierno»');
  ok(AJ.estacionEfectiva(aj(), H.historiaNueva()) === 'auto', 'por empezar (desde la portada con «Historia» elegida): también');
  ok(AJ.estacionEfectiva(aj(), vieja) === 'verano', 'una Historia empezada antes conserva la estación elegida a mano (verano)');
  ok(AJ.estacionEfectiva(aj({ estacion: 'otono' }), vieja) === 'otono', 'y la otoño');
  ok(AJ.estacionEfectiva(aj({ relaxTipo: 'libre' }), nueva) === 'verano', 'en Libre rige lo elegido');
  const fin = H.historiaNueva(); H.empezarHistoria(fin, 1); fin.fase = 'fin'; fin.terminada = 9;
  ok(AJ.estacionEfectiva(aj(), fin) === 'verano', 'terminada la Historia el valle vuelve a ser libre: rige lo elegido');
  ok(AJ.estacionEfectiva(aj(), nueva, true) === 'verano' && AJ.estacionEfectiva(aj({ modo: 'desafio' }), nueva) === 'verano', 'en La noche de los duendes no rige');
  ok(AJ.estacionEfectiva(aj(), null) === 'auto', 'sin historia guardada y con «Historia» elegida: rige (se va a empezar)');
  // lo guardado
  const ida = H.sanearHistoria(JSON.parse(JSON.stringify(nueva)));
  ok(ida.arranqueNuevo === true, 'la bandera sobrevive al guardado');
  ok(H.sanearHistoria({ activa: true, empezada: 2, capitulo: 3, fase: 'jugando' }).arranqueNuevo === false, 'una Historia guardada sin la bandera no la gana sola');
  ok(H.sanearHistoria({ arranqueNuevo: 'si' }).arranqueNuevo === false && H.historiaNueva().arranqueNuevo === false, 'una bandera retocada o ausente vale falso');
  // main.js: todo el mundo (cielo, ropa, pronóstico, clima de la historia) usa la misma función
  ok(!/ajustes\.estacion/.test(main), 'main.js ya no lee `ajustes.estacion`: todo pasa por estacionAjuste()');
  const entorno = (aju, hist) => ({ ajustes: aju, progreso: { historia: hist, dia: 10, horas: 12 }, esDesafio: false, estacionEfectiva: AJ.estacionEfectiva });
  const mundo = (aju, hist, forzada) => { const e = entorno(aju, hist); e.estacionAjuste = funcion(main, 'estacionAjuste', e); e.desafio = null; e.valle = { estacionForzada: () => forzada }; return e; };
  { const e = mundo(aj(), nueva, 'otono'); const f = funcion(main, 'conClimaDeHistoria', e);
    const r = f({ oto: 0, inv: 0 }); ok(r.oto === 1 && r.inv === 0, 'Historia nueva con el verano de fábrica: el otoño de la historia se aplica'); }
  { const e = mundo(aj(), nueva, 'invierno'); const r = funcion(main, 'conClimaDeHistoria', e)({ oto: 0, inv: 0 }); ok(r.inv === 1 && r.oto === 0, 'y la helada del capítulo 9 en adelante'); }
  { const e = mundo(aj(), vieja, 'otono'); const r = funcion(main, 'conClimaDeHistoria', e)({ oto: 0, inv: 0 }); ok(r.oto === 0 && r.inv === 0, 'Historia vieja con verano fijo: se respeta (no se toca)'); }
  { const e = mundo(aj(), nueva, null);
    const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    e.DIAS_ANIO = 12; e.smoothstep = suave;
    const r = funcion(main, 'estacionObjetivo', e)(); ok(r.inv > 0.9, 'Historia nueva con «Verano» de fábrica: el día 10 del año es invierno (estaciones solas)');
    const e2 = mundo(aj(), vieja, null); e2.DIAS_ANIO = 12; e2.smoothstep = suave; const r2 = funcion(main, 'estacionObjetivo', e2)(); ok(r2.inv === 0 && r2.oto === 0, 'Historia vieja: el verano fijo sigue siendo verano'); }
  // el selector se apaga con el motivo
  const av = AJ.avisosDeAjustes(aj(), nueva);
  ok(av.estacion === AJ.MOTIVO_ESTACION && /pasan solas/.test(av.estacion), 'el aviso del selector de estación dice el motivo');
  ok(AJ.avisosDeAjustes(aj({ relaxTipo: 'libre' }), nueva).estacion === '' && AJ.avisosDeAjustes(aj(), vieja).estacion === '', 'en Libre o en una Historia vieja el selector sigue andando');
  const plantilla = leer('plantilla.html');
  ok((plantilla.match(/data-aviso-ajuste="estacion"/g) || []).length === 2 && (plantilla.match(/data-aviso-ajuste="reloj"/g) || []).length === 1, 'la portada y los ajustes tienen su aviso de estación y de reloj');
  ok(enUnaLinea(main, ['[data-ajuste="estacion"] button', 'b.disabled = !!av.estacion']) && enUnaLinea(main, ['[data-ajuste="duracion"] button[data-valor="reloj"]', 'b.disabled = !!av.reloj']), 'sincronizarAjustes apaga los chips');
  ok(enUnaLinea(main, ["if (!b || b.disabled) return;"]), 'un chip apagado no cambia el ajuste');
  ok(enUnaLinea(main, ["clave === 'estacion' ? estacionAjuste() : ajustes[clave]"]), 'y el chip marcado es la estación que rige (en la Historia, «Que pasen solas»), no la guardada');
}

// ---------------------------------------------------------------- 2. la hora de tu reloj
if (va('reloj')) {
  const nueva = H.historiaNueva(); H.empezarHistoria(nueva, 1);
  const vieja = H.historiaNueva(); Object.assign(vieja, { activa: true, empezada: 3, capitulo: 5, fase: 'jugando' });
  ok(AJ.relojApagado(aj({ duracion: 'reloj' }), nueva) && AJ.relojApagado(aj({ duracion: 'reloj' }), vieja), 'en cualquier Historia en marcha el chip de la hora de tu reloj se apaga');
  ok(!AJ.relojApagado(aj({ relaxTipo: 'libre' }), nueva) && !AJ.relojApagado(aj(), nueva, true), 'en Libre y en el Desafío no');
  ok(AJ.duracionAlEntrar(aj({ duracion: 'reloj' }), nueva) === 30 && AJ.duracionAlEntrar(aj({ duracion: 'reloj' }), vieja) === 30, 'al empezar o retomar con la hora de tu reloj: el día dura 30 minutos');
  ok(AJ.duracionAlEntrar(aj({ duracion: 45 }), nueva) === null && AJ.duracionAlEntrar(aj({ duracion: 'reloj', relaxTipo: 'libre' }), nueva) === null, 'con otra duración, o en Libre, no se toca nada');
  ok(AJ.avisosDeAjustes(aj(), nueva).reloj === AJ.MOTIVO_RELOJ && /R/.test(AJ.MOTIVO_RELOJ), 'el aviso del chip dice el motivo');
  // lo que hace main.js al entrar
  const ajustes = aj({ duracion: 'reloj' }), llamadas = [];
  const env = { ajustes, progreso: { historia: nueva }, esDesafio: false, duracionAlEntrar: AJ.duracionAlEntrar, guardarAjustes: () => llamadas.push('guardar'), sincronizarAjustes: () => llamadas.push('sincronizar'), nota: (t) => llamadas.push('nota:' + t) };
  funcion(main, 'alEntrarEnLaHistoria', env)();
  ok(ajustes.duracion === 30 && llamadas.includes('guardar') && llamadas.includes('sincronizar') && llamadas.some((x) => x.startsWith('nota:')), 'alEntrarEnLaHistoria: 30 minutos, guardado, chips al día y un aviso');
  llamadas.length = 0; funcion(main, 'alEntrarEnLaHistoria', env)();
  ok(llamadas.length === 0, 'y una segunda vez no hace nada');
  ok(enUnaLinea(main, ['alActivarHistoria: () => { try { alEntrarEnLaHistoria(); }']), 'empezar y retomar la Historia pasan por alEntrarEnLaHistoria');
}

// ---------------------------------------------------------------- 3. la línea de espera y el texto de la guardia
if (va('espera')) {
  // el texto de la guardia dice lo que la escena espera
  const g = H.CAPITULOS.find((c) => c.id === 'perdido').objetivos.find((o) => o.id === 'guardia');
  const win = D.DISPARADORES['guardia-molino'].hora;
  ok(win[0] === 0.5 && win[1] === 2.5, 'la guardia sigue siendo de 0:30 a 2:30');
  ok(g.texto.includes('0:30') && g.texto.includes('2:30') && !/22/.test(g.texto), 'el panel dice «entre las 0:30 y las 2:30», no «entre las 22 y las 2»');
  // formato de la hora
  ok(EP.horaEnTexto(17) === '17:00' && EP.horaEnTexto(0.5) === '0:30' && EP.horaEnTexto(21.5) === '21:30' && EP.horaEnTexto(5.75) === '5:45', 'la hora se escribe 17:00, 0:30, 21:30');
  // la guardia: de día, de noche antes de la ventana y adentro de la ventana
  { const a = armar('perdido', { horas: 12 }); const e = EP.esperasDelCapitulo(a.h, a.s());
    ok(typeof e.guardia === 'string' && e.guardia.startsWith('Falta esperar hasta las 0:30 (de madrugada)') && e.guardia.includes('R te sienta'), 'a mediodía: «Falta esperar hasta las 0:30 (de madrugada) (R te sienta y el reloj corre más rápido)»');
    a.P.horas = 22.5; ok(EP.esperasDelCapitulo(a.h, a.s()).guardia.includes('las 0:30'), 'a las 22:30 también');
    a.P.horas = 1; ok(EP.esperasDelCapitulo(a.h, a.s()).guardia === undefined, 'adentro de la ventana ya no hay nada que esperar (falta sentarse o estar en el lugar)');
    a.P.horas = 12; a.h.escenas.vistas['guardia-molino'] = 1; ok(EP.esperasDelCapitulo(a.h, a.s()).guardia === undefined, 'con la escena vista tampoco'); }
  // «a la tarde»: una ventana que todavía no empezó, hoy
  { const a = armar('arco', { horas: 12, vistas: [] }); const e = EP.esperasDelCapitulo(a.h, a.s()); ok(/^Falta esperar hasta las 16:30 /.test(e.lado || ''), 'recorrer el lado del arroyo a mediodía: «hasta las 16:30»');
    a.P.horas = 18; ok(EP.esperasDelCapitulo(a.h, a.s()).lado === undefined, 'a las 18 ya es la hora'); a.P.horas = 22; ok(/mañana a las 16:30/.test(EP.esperasDelCapitulo(a.h, a.s()).lado || ''), 'a las 22: «mañana a las 16:30»'); }
  // «después del día»: la ronda del galpón de la cosecha pide pasar la noche
  { const a = armar('cosecha', { horas: 15, dia: 5, baseDia: 5, vistas: ['minga-aldea'] });
    const e = EP.esperasDelCapitulo(a.h, a.s()); ok(/mañana a las 5:30/.test(e.ronda || ''), 'la ronda del galpón: «mañana a las 5:30» (hay que pasar la noche)');
    a.P.dia = 6; a.P.horas = 3; ok(/las 5:30/.test(EP.esperasDelCapitulo(a.h, a.s()).ronda || '') && !/mañana/.test(EP.esperasDelCapitulo(a.h, a.s()).ronda), 'pasada la medianoche: «las 5:30»'); }
  // no es sólo la hora: falta una escena previa (el fogón pide haber visto las dos del cuaderno)
  { const a = armar('cuaderno', { horas: 12, vistas: [] }); ok(EP.esperasDelCapitulo(a.h, a.s()).fogon === undefined, 'si falta otra cosa (las escenas previas) no se anuncia la espera');
    const b = armar('cuaderno', { horas: 12, vistas: ['libreta-fiado', 'cuaderno-abuelo'] }); ok(/^Falta esperar hasta las 20:30/.test(EP.esperasDelCapitulo(b.h, b.s()).fogon || ''), 'con las previas hechas, el fogón dice «hasta las 20:30»'); }
  // una escena sin ventana (se puede a cualquier hora) no espera nada
  { const a = armar('mesa', { horas: 22 }); ok(EP.esperasDelCapitulo(a.h, a.s()).hablar === undefined, 'un objetivo sin ventana no anuncia espera'); }
  // cobertura: todo objetivo cuya escena sólo vale en una ventana puede armar su línea (menos los de varias vías)
  const EXCEPCIONES = new Set(['arco:plumas', 'arco:deuda']);   // (se cumplen por varias escenas, algunas de día y otras sin ventana: no hay una sola hora que esperar)
  const ventana = new Set(); for (const [k, d] of Object.entries(D.DISPARADORES)) if (d.hora) ventana.add(d.escena || k);
  let conLinea = 0, sinLinea = [];
  for (const c of H.CAPITULOS) for (const o of c.objetivos) {
    const escenas = [...new Set([EP.escenaDeObjetivo(o), ...[...ventana].filter((e) => String(o.hecho).includes(`'${e}'`))].filter((e) => e && ventana.has(e)))];
    if (!escenas.length || EXCEPCIONES.has(`${c.id}:${o.id}`)) continue;
    const id = EP.escenaDeObjetivo(o);
    if (!id) { sinLinea.push(`${c.id}:${o.id} (sin escena anotada)`); continue; }
    const ds = EP.disparadoresDe(id, c.id);
    if (!ds.length || !ds.every((d) => d.hora)) continue;   // (en este capítulo se puede a cualquier hora: no hay nada que esperar)
    // armar: lo estructural a favor y una hora afuera de todas las ventanas
    let hora = null; for (let x = 0; x < 24; x += 0.5) if (ds.every((d) => !H.horaEntre(x, d.hora[0], d.hora[1]))) { hora = x; break; }
    const vistas = [...new Set(ds.flatMap((d) => d.requiere || []))];
    if (hora === null) { sinLinea.push(`${c.id}:${o.id} (sin hora libre)`); continue; }
    const a = armar(c.id, { horas: hora, vistas, dia: 20, baseDia: 20 });
    const e = EP.esperasDelCapitulo(a.h, a.s());
    if (typeof e[o.id] === 'string' && e[o.id].startsWith('Falta esperar hasta ')) conLinea++; else sinLinea.push(`${c.id}:${o.id}`);
  }
  ok(sinLinea.length === 0 && conLinea >= 20, `cada objetivo con ventana arma su línea de espera (${conLinea} objetivos${sinLinea.length ? '; sin línea: ' + sinLinea.join(', ') : ''})`);
  // el panel de la UI la dibuja debajo del objetivo
  { const a = armar('perdido', { horas: 12 }); const J = crearJuego({ P: a.P, X: a.X }); J.valle.revisarAhora();
    const panel = J.ctx.documento.body.children.find((c) => c.id === 'historia-hud');
    ok(panel && /<p class="espera">Falta esperar hasta las 0:30/.test(panel.innerHTML), 'el panel dibuja la línea gris debajo del objetivo de la guardia');
    ok(panel && !/class="hecho"><kbd>✓<\/kbd>[^<]*<\/p><p class="espera"/.test(panel.innerHTML), 'y no debajo de uno ya cumplido'); }
}

// ---------------------------------------------------------------- 4. el panel único
if (va('panel')) {
  const nueva = H.historiaNueva(); H.empezarHistoria(nueva, 1); nueva.fase = 'jugando';
  ok(AJ.sinPrimerosPasos(nueva), 'con la Historia en marcha no se muestra «Primeros pasos»');
  const pausa = H.historiaNueva(); H.empezarHistoria(pausa, 1); pausa.activa = false;
  ok(AJ.sinPrimerosPasos(pausa), 'una Historia nueva en pausa tampoco (el capítulo 1 enseña lo mismo y el premio sería doble)');
  const vieja = H.historiaNueva(); Object.assign(vieja, { activa: false, empezada: 3, capitulo: 4, fase: 'jugando' });
  ok(!AJ.sinPrimerosPasos(vieja) && !AJ.sinPrimerosPasos(null) && !AJ.sinPrimerosPasos(H.historiaNueva()), 'sin Historia (o una vieja en pausa) la guía de siempre sigue');
  const vivaVieja = H.historiaNueva(); Object.assign(vivaVieja, { activa: true, empezada: 3, capitulo: 4, fase: 'jugando' });
  ok(AJ.sinPrimerosPasos(vivaVieja), 'una Historia vieja en marcha también deja el panel único');
  // main.js: la caja del tutorial se esconde
  const PASOS = (await imp('relax-tutorial.js')).PASOS_RELAX;
  const caja = { _o: null, classList: { toggle: (c, v) => { caja._o = v; } } };
  const correr = (hist) => { caja._o = null; funcion(main, 'revisarGuiaRelax', { $: () => caja, esDesafio: false, ajustes: { guiaPrimerDia: true }, progreso: { guiaDia: 0, historia: hist }, PASOS_RELAX: PASOS, modo: 'jugando', acumuladoGuiaDia: 0, sinPrimerosPasos: AJ.sinPrimerosPasos })(0.1); return caja._o; };
  ok(correr(nueva) === true, 'revisarGuiaRelax esconde «Primeros pasos» con la Historia en marcha');
  ok(correr(undefined) === false && correr(H.historiaNueva()) === false, 'y lo deja a la vista en el Relax libre');
  // el panel de la Historia sube a su lugar (sin la guía de arriba)
  const a = armar('llave', { horas: 18.25, dia: 1, baseDia: 1 }); const J = crearJuego({ P: a.P, X: a.X }); J.valle.revisarAhora();
  const panel = J.ctx.documento.body.children.find((c) => c.id === 'historia-hud');
  ok(panel && /Capítulo 1 · La llave del molinero/.test(panel.innerHTML) && panel.style.top === '92px', 'el panel del capítulo ocupa el lugar de arriba (92 px) cuando no hay guía');
}

// ---------------------------------------------------------------- 5. un indicio antes
if (va('indicio')) {
  ok(typeof H.textoRaro('risa-primera-noche') === 'string' && H.textoRaro('risa-primera-noche').length > 30 && Object.hasOwn(TX1.TEXTO_ACTO1.raro, 'risa-primera-noche'), 'el indicio de la primera noche está escrito y anotable');
  const a = armar('llave', { horas: 8, dia: 2, baseDia: 1 });
  ok(H.alCumplirObjetivo(a.h, 'llave', 'noche', a.s()) === 'risa-primera-noche' && a.h.raro.some((x) => x.id === 'risa-primera-noche' && x.dia === 2), 'al cumplirse «pasá tu primera noche» el cuaderno anota la risa');
  ok(H.alCumplirObjetivo(a.h, 'llave', 'noche', a.s()) === null && a.h.raro.filter((x) => x.id === 'risa-primera-noche').length === 1, 'una sola vez');
  const b = armar('llave', { horas: 8, dia: 2, baseDia: 1 });
  ok(H.alCumplirObjetivo(b.h, 'llave', 'fuego', b.s()) === null && H.alCumplirObjetivo(b.h, 'bolsa', 'noche', b.s()) === null && b.h.raro.length === 0, 'otros objetivos no mueven nada');
  ok(H.sanearHistoria(JSON.parse(JSON.stringify(a.h))).raro.some((x) => x.id === 'risa-primera-noche'), 'y sobrevive al guardado');
  // en el juego: al despertar (el día pasó) el capítulo tilda «noche» y avisa
  const c = armar('llave', { horas: 7, dia: 2, baseDia: 1 }); const J = crearJuego({ P: c.P, X: c.X }); J.valle.revisarAhora();
  ok(J.notas.some((x) => x[0] === 'El cuaderno anota algo raro' && /risa/.test(x[1])), 'en el juego, al despertar la primera mañana: «El cuaderno anota algo raro»');
  ok(J.P.historia.raro.some((x) => x.id === 'risa-primera-noche'), 'queda en el cuaderno de lo raro');
}

// ---------------------------------------------------------------- 6. los premios en pesos
if (va('premios')) {
  const premios = H.CAPITULOS.map((c) => c.premio);
  ok(premios.every((p) => (p.pesos || 0) > 0), 'los trece capítulos dan pesos');
  ok(premios.reduce((t, p) => t + p.pesos, 0) === 23600, 'en total $23.600 (4 a 6 días de ingreso tranquilo)');
  ok(H.CAPITULOS.every((c) => !('yerba' in (c.premio.cuenta || {})) && !Object.values(c.premioVar?.opciones || {}).some((x) => 'yerba' in (x.cuenta || {}))), 'ningún premio paga en yerba (ya no se vende)');
  const porActo = [1, 2, 3].map((k) => H.CAPITULOS.filter((c) => c.acto === k).map((c) => c.premio.pesos));
  ok(Math.max(...porActo[0]) <= 1800 && Math.min(...porActo[1]) >= 1500 && Math.min(...porActo[2]) >= 2000 && Math.max(...porActo[2]) <= 2500, 'el premio crece con el acto: $1.000 a 1.800, $1.500 a 1.900 y $2.000 a 2.500');
  ok(H.CAPITULOS.every((c) => c.premio.texto.includes(ECO.formatoPesos(c.premio.pesos)) || c.premioVar?.noche), 'el texto del premio dice la plata que da (sin mentir)');
  // las 26 yerbas pasan a pesos (×100): 4 + 8 + 4 + 2 + 4 + 4
  const conv = { mesa: 400, ramal: 800, perdido: 400, cosecha: 200, cuaderno: 400, frios: 400 };
  ok(Object.entries(conv).every(([k, v]) => H.CAPITULO[k].premio.pesos >= v) && Object.values(conv).reduce((t, v) => t + v, 0) === 2600, 'las 26 yerbas ($2.600) quedan dentro de esos premios');
  // las variantes siguen sumando
  { const h = H.historiaNueva(); h.decisiones.majada = 'c'; ok(H.premioDeCapitulo(H.CAPITULO.frios, h).pesos === 5400, 'con la majada vendida: $2.400 + $3.000'); h.decisiones.majada = 'a'; ok(H.premioDeCapitulo(H.CAPITULO.frios, h).pesos === 2400, 'con las otras: $2.400'); }
  for (const t of ['trato', 'pelea']) for (const r of ['ganada', 'perdida']) {
    const h = H.historiaNueva(); h.duendes.trato = t; h.duendes.noche = r; const p = H.premioDeCapitulo(H.CAPITULO.nevada, h);
    ok(p.pesos === 2500 && p.texto.includes('$2.500'), `la noche (${t}, ${r}) paga $2.500 y lo dice`);
  }
  // el libro de pesos: un renglón corto (el texto del premio es largo)
  const progreso = { economia: { pesos: 0, libro: [] }, materiales: {}, cosas: {}, entradas: {}, dia: 3, horas: 10, ramitas: 0 };
  const entorno = { progreso, cobrarPesos: ECO.cobrar, sumarMaterial() {}, refrescarBarra() {}, setTimeout: () => 0, nota() {}, guardar() {}, ENTRADA: {} };
  const premio = { ...H.CAPITULO.mesa.premio, motivo: 'La historia del valle · La mesa larga', con: 'Los vecinos del valle' };
  funcion(main, 'cobrarPremio', entorno)({ premio });
  const renglon = progreso.economia.libro[progreso.economia.libro.length - 1];
  ok(progreso.economia.pesos === 1400 && renglon && renglon.motivo === 'La historia del valle · La mesa larga' && renglon.con === 'Los vecinos del valle', 'cobrarPremio cobra los pesos y el libro dice el capítulo, no el texto largo');
  const progreso2 = { economia: { pesos: 0, libro: [] }, materiales: {}, cosas: {}, entradas: {}, dia: 3, horas: 10, ramitas: 0 };
  funcion(main, 'cobrarPremio', { ...entorno, progreso: progreso2 })({ premio: { pesos: 500, texto: 'Un premio de prueba' } });
  ok(progreso2.economia.libro[0]?.motivo === 'Un premio de prueba' && progreso2.economia.libro[0]?.con === 'Premio', 'los premios de siempre (sin motivo) siguen igual');
  ok((historiaUi.match(/ctx\.cobrar\(premioConLibro\(r\.premio, c\)\)/g) || []).length === 2, 'las dos tarjetas (cierre y final) cobran con el renglón corto');
  const pcl = expresion(historiaUi, 'const premioConLibro = ', {});
  ok(pcl({ pesos: 5 }, { titulo: 'La mesa larga' }).motivo === 'La historia del valle · La mesa larga', 'premioConLibro arma el renglón con el título');
  // se cobra en la UI al cerrar el capítulo
  { const a = armar('mesa', { fase: 'outro' }); const J = crearJuego({ P: a.P, X: a.X }); J.valle.revisarAhora();
    const t = J.valle.tarjetas.actual(); ok(t && /\$1\.400/.test(t.premio || ''), 'la tarjeta de cierre del capítulo 3 dice «Te queda: … $1.400 …»');
    t.alElegir('seguir'); const c = J.notas.find((x) => x[0] === 'cobrar'); const cp = c && JSON.parse(c[1]);
    ok(cp && cp.pesos === 1400 && cp.motivo === 'La historia del valle · La mesa larga', 'al cerrar el capítulo se cobra con el motivo corto'); }
}

// ---------------------------------------------------------------- 7. las metas con plata
if (va('metas')) {
  const ids = ['puesto-feria', 'establo-zaino', 'heno-majada'];
  ok(ids.every((k) => O.OPTATIVA[k]) && O.OPTATIVAS.length === 34 && new Set(O.IDS_OPTATIVAS_REGISTRO).size === 34, 'el registro tiene 34 optativas sin repetir (las 31 y las tres metas con plata)');
  const capsDe = (o) => O.capsDe(o);
  for (const k of ids) {
    const o = O.OPTATIVA[k];
    const actos = new Set(capsDe(o).map((c) => H.CAPITULO[c].acto));
    ok(actos.size === 1, `${k}: no cruza de acto`);
    ok(o.premio === null && !o.ventana, `${k}: nunca traba y no da lazo (lo que se gana es la obra)`);
    const t = TXO.TEXTO_OPTATIVAS.tablon[k];
    ok(t && t.titulo && t.ofrecida && t.hecha && JSON.stringify(t.caps) === JSON.stringify(capsDe(o).map((c) => H.CAPITULOS.findIndex((x) => x.id === c) + 1)), `${k}: tiene su entrada en el tablón con los capítulos de su ventana`);
  }
  // el puesto de la feria (capítulos 3 y 4)
  { const a = armar('mesa'); ok(O.estadoOptativa(O.OPTATIVA['puesto-feria'], a.s(), a.h) === 'ofrecida', 'el puesto se ofrece en el capítulo 3');
    ok(/\$6\.000/.test(O.optativasDelPanel(a.h, a.s()).find((x) => x.id === 'puesto-feria')?.texto || ''), 'el panel dice cuánto cuesta ($6.000)');
    a.P.negocios = { casas: { puesto: { caja: 0, stock: {} } } }; ok(a.s().puestoFeria === true && O.OPTATIVA['puesto-feria'].hecha(a.s(), a.h), 'con el puesto comprado, se cumple');
    const b = armar('rueda'); ok(O.estadoOptativa(O.OPTATIVA['puesto-feria'], b.s(), b.h) === 'cerrada', 'en el acto II ya no se ofrece (no cruza de acto)'); }
  // el establo del zaino (acto II): se ofrece con el zaino prestado
  { const a = armar('rueda'); ok(O.estadoOptativa(O.OPTATIVA['establo-zaino'], a.s(), a.h) === 'cerrada', 'sin el zaino todavía no se ofrece');
    a.h.escenas.vistas['zaino-ramon'] = 1; ok(O.estadoOptativa(O.OPTATIVA['establo-zaino'], a.s(), a.h) === 'ofrecida', 'con el zaino prestado se ofrece');
    a.X.terminadas.push({ id: 'establo-caballo', x: 0, z: 0 }); ok(O.OPTATIVA['establo-zaino'].hecha(a.s(), a.h), 'con el establo terminado se cumple');
    const r = O.revisarOptativas(a.h, a.s(), 7); ok(r.some((x) => x.id === 'establo-zaino') && a.h.optativas['establo-zaino'] === 7, 'se anota hecha una sola vez'); }
  // el cobertizo de heno (acto III)
  { const a = armar('frios'); ok(O.estadoOptativa(O.OPTATIVA['heno-majada'], a.s(), a.h) === 'cerrada', 'antes de ver a Ramón en cama no se ofrece');
    a.h.escenas.vistas['ramon-cama'] = 1; ok(O.estadoOptativa(O.OPTATIVA['heno-majada'], a.s(), a.h) === 'ofrecida', 'después, sí');
    a.X.terminadas.push({ id: 'cobertizo-heno', x: 0, z: 0 }); ok(O.OPTATIVA['heno-majada'].hecha(a.s(), a.h), 'con el cobertizo terminado se cumple');
    const b = armar('nevada', { vistas: ['ramon-cama'] }); ok(O.estadoOptativa(O.OPTATIVA['heno-majada'], b.s(), b.h) === 'cerrada', 'en la noche de la nevada ya no'); }
  // los planos existen (si no, la meta no se podría cumplir nunca)
  const planos = readFileSync(join(SRC, 'planos-exteriores.js'), 'utf8');
  ok(planos.includes("id: 'establo-caballo'") && planos.includes("id: 'cobertizo-heno'"), 'el establo y el cobertizo de heno son planos del juego');
  ok(enUnaLinea(historiaJs, ['puestoFeria: !!p?.negocios?.casas?.puesto']), 'el estado de la historia sabe si hay puesto en la feria');
}

// ---------------------------------------------------------------- 8. las puertas
if (va('puertas')) {
  const cap = (id) => H.CAPITULO[id];
  for (const id of ['rueda', 'frios', 'deshielo']) {
    const l = cap(id).puerta.lineas.join(' ');
    ok(/en un par de días/.test(l) && /dormir \(E\) o esperar sentado \(R\)/i.test(l) && !/cuando cambie la estación\.?$/.test(l.trim()), `la puerta de «${id}» dice «en un par de días» y cómo adelantarlo`);
  }
  ok(!/La historia sigue sola cuando cambie la estación/.test(historiaJs), 'ya no dice «la historia sigue sola cuando cambie la estación»');
  ok(enUnaLinea(historiaUi, ["detalle: pu.dias ? 'El capítulo empieza solo en un par de días'", 'o antes si cambia la estación']), 'el botón de la tarjeta de la puerta dice lo mismo');
}

// ---------------------------------------------------------------- lo que ya andaba sigue andando: la Historia se puede jugar entera
if (va('juego')) {
  for (const semilla of [11, 12]) {
    const r = jugar(semilla);
    ok(r.fin === true && !r.atascado && !(r.errores || []).length, `jugador de mentira (semilla ${semilla}): los trece capítulos terminan sin atascos ni errores${r.atascado ? ' · atascado en ' + JSON.stringify(r.atascado) : ''}`);
  }
}

// ---------------------------------------------------------------- mutaciones (cada una en su proceso, sobre una copia de src/)
const MUT = [
  ['historia-ajustes.js', "if (h && n(h.empezada) > 0) return h.arranqueNuevo === true;", "if (h && n(h.empezada) > 0) return true;", 'una Historia vieja también pierde su estación elegida', 'estacion'],
  ['historia.js', "h.version = VERSION_HISTORIA; h.arranqueNuevo = true; }", "h.version = VERSION_HISTORIA; }", 'empezar no anota la estación propia', 'estacion'],
  ['historia.js', "  h.arranqueNuevo = v.arranqueNuevo === true;", "  h.arranqueNuevo = false;", 'el guardado pierde la bandera', 'estacion'],
  ['main.js', 'return estacionEfectiva(ajustes, progreso?.historia, esDesafio);', 'return ajustes.estacion;', 'main.js usa el ajuste a secas (verano fijo en la Historia)', 'estacion'],
  ['historia-ajustes.js', "export const relojApagado = (ajustes, h, esDesafio = false) => enLaHistoria(ajustes, h, esDesafio);", "export const relojApagado = () => false;", 'el reloj no se apaga', 'reloj'],
  ['main.js', "alActivarHistoria: () => { try { alEntrarEnLaHistoria(); } catch (e) { console.warn('ajustes de la historia', e); } try {", "alActivarHistoria: () => { try {", 'al empezar la Historia no se toca la hora de tu reloj', 'reloj'],
  ['historia.js', "f.escena = id; return f; };", "return f; };", 'las funciones `escena()` no anotan su escena', 'espera'],
  ['historia-espera.js', "const listos = ds.filter((d) => (!d.requiere || d.requiere.every((x) => s.escenas.has(x))) && (!d.no || !d.no.some((x) => s.escenas.has(x))));", "const listos = ds;", 'la espera se anuncia aunque falten escenas previas', 'espera'],
  ['historia-ui.js', "${!o.hecho && esperas[o.id] ? `<p class=\"espera\">", "${false ? `<p class=\"espera\">", 'el panel no dibuja la línea de espera', 'espera'],
  ['historia.js', "pasada la medianoche: sentate cerca del coihue (con un banco, O) y esperá; la guardia es entre las 0:30 y las 2:30", "de noche: sentate cerca del coihue (con un banco, O) entre las 22 y las 2", 'el panel vuelve a decir «entre las 22 y las 2»', 'espera'],
  ['main.js', " && !sinPrimerosPasos(progreso.historia);", ";", '«Primeros pasos» sigue con la Historia', 'panel'],
  ['historia-ajustes.js', "  if (h.activa === true && h.fase !== 'fin') return true;\n", "", 'una Historia en marcha no esconde «Primeros pasos»', 'panel'],
  ['historia.js', "return anotarRaro(h, 'risa-primera-noche', s?.dia) ? 'risa-primera-noche' : null;", "return null;", 'no hay indicio en la primera noche', 'indicio'],
  ['historia-ui.js', "else if (mov === 'risa-primera-noche') {", "else if (false) {", 'el indicio no avisa en pantalla', 'indicio'],
  ['historia.js', "premio: { pesos: 1400, texto:", "premio: { cuenta: { yerba: 4 }, texto:", 'el capítulo 3 vuelve a pagar en yerba', 'premios'],
  ['historia.js', "pesos: 2000, texto: 'El plan de la noche:", "pesos: 0, texto: 'El plan de la noche:", 'el capítulo 10 no paga', 'premios'],
  ['main.js', "premio.motivo || premio.texto || 'Un premio', premio.con || e?.quien", "premio.texto || 'Un premio', e?.quien", 'el libro de pesos vuelve a llevar el texto largo', 'premios'],
  ['historia-ui.js', "if (r?.premio) ctx.cobrar(premioConLibro(r.premio, c));\n        ctx.diario('capitulo', `terminé «${c.titulo}»`);", "if (r?.premio) ctx.cobrar(r.premio);\n        ctx.diario('capitulo', `terminé «${c.titulo}»`);", 'el cierre cobra sin renglón corto', 'premios'],
  ['historia-optativas.js', "hecha: (s) => s.terminadas.has('cobertizo-heno'), premio: null },", "hecha: (s) => s.terminadas.has('cobertizo-heo'), premio: null },", 'el cobertizo de heno nunca se da por hecho', 'metas'],
  ['historia.js', "puestoFeria: !!p?.negocios?.casas?.puesto,", "puestoFeria: false,", 'el puesto de la feria nunca se da por hecho', 'metas'],
  ['historia-optativas.js', "{ id: 'establo-zaino', desde: 'rueda', hasta: 'cuaderno',", "{ id: 'establo-zaino', desde: 'rueda', hasta: 'frios',", 'el establo cruza de acto', 'metas'],
  ['historia-texto-optativas.js', "    'heno-majada': {", "    'heno-majada-x': {", 'el cobertizo de heno no tiene tablón', 'metas'],
  ['historia.js', "El capítulo empieza solo en un par de días, o antes si cambia la estación: dormir (E) o esperar sentado (R) lo adelanta.'] },\n    intro: [\n      'El balde", "La historia sigue sola cuando cambie la estación (o, a lo sumo, en un par de días).'] },\n    intro: [\n      'El balde", 'la puerta del capítulo 9 vuelve al texto viejo', 'puertas'],
  ['historia-ui.js', "detalle: pu.dias ? 'El capítulo empieza solo en un par de días' : 'El capítulo empieza solo en un par de días, o antes si cambia la estación' }],", "detalle: 'El capítulo empieza solo cuando cambie la estación' }],", 'el botón de la puerta vuelve al texto viejo', 'puertas'],
];
let atrapadas = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4210b-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = leer(`${arch}`);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4184_SRC: dir, A4210_CALLADO: '1', A4210_SECCIONES: secc }, encoding: 'utf8', timeout: 240000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (!HIJO) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.21.0 (B) estación propia, reloj, espera, panel único, indicio, premios en pesos, metas con plata y puertas · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
