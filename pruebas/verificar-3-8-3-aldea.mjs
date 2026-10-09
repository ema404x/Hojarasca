// 3.8.3 (aldea): pase de bugs de la aldea y la gente antes de Steam. Una comprobación por arreglo.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as M from '../src/amor.js';
import * as A from '../src/aldea.js';
import * as V from '../src/vecindad.js';
import { FRASES_AMOR } from '../src/amor-voces.js';
import { ENTRADAS } from '../src/cuaderno.js';
import { ENTRADAS_RINCONES } from '../src/rincones-cuaderno.js';
import * as R from '../src/rincones.js';
import { IDS_DUENDES } from '../src/rincones-cuaderno.js';
import { PALABRA_EMOCION } from '../src/social-rueda.js';
import * as F from '../src/fiestas.js';
import { novedadesDelValle } from '../src/noticias-juego.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const aldeaCompleta = () => { const a = A.aldeaNueva(); a.pobladores = A.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 })); a.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1])); return A.sanearAldea(a); };
const partida = (extra = {}) => ({ dia: 20, horas: 10, entradas: { canto: { dia: 1, hora: 9, cantidad: 3 } }, materiales: {}, cosas: {}, aldea: aldeaCompleta(), vecindad: V.vecindadNueva(), amor: M.amorNuevo(), ...extra });
const ficha = (o) => ({ etapa: 'conocidos', afecto: 0, desde: 0, contacto: 0, charla: 0, piropo: 0, flores: 0, carta: 0, leyo: null, citas: 0, ultimaCita: 0, enojo: 0, motivo: null, rechazo: 0, reconquista: 0, chicos: 0, ...o });
const sinCR = (f) => ok(!leer(f).includes('\r'), `${f}: fines de línea LF`);

// ---------------------------------------------------------------- 1. amor: proponerle a otra corta la convivencia
{
  const p = partida();
  p.amor.dia = 20;
  p.amor.personas.veterinaria = ficha({ etapa: 'novios', afecto: 90, desde: 10, contacto: 20 });
  p.amor.personas.fotografa = ficha({ etapa: 'novios', afecto: 99, desde: 10, contacto: 20 });
  const c = M.convivir(p, 'veterinaria', 'refugio', { semilla: 1 });
  ok(c.si && p.amor.convivencia?.con === 'veterinaria', 'amor: vive con la veterinaria');
  p.amor.anillo = { pedido: 1, listo: 4, retirado: true, para: null };
  let r; for (let s = 0; s < 80; s++) { r = M.proponer(p, 'fotografa', { semilla: s, lugar: 'mirador' }); if (r.si) break; p.amor.personas.fotografa.rechazo = 0; }
  ok(r.si && r.cortaron.includes('veterinaria'), 'amor: la fotógrafa dice que sí y la veterinaria corta');
  ok(p.amor.convivencia === null, 'amor: la que cortó ya no vive en tu casa (antes seguía durmiendo en tu cama hasta recargar)');
}
// ---------------------------------------------------------------- 2. amor: el chisme con tres
{
  const t = leer('src/amor.js');
  ok(t.includes(".join(', ').replace(/, ([^,]*)$/, ' y $1')} se enteraron de que salís con ${ellas.length > 2 ? 'varias' : 'las dos'}."), 'amor: el chisme con tres o más dice «A, B y C … con varias»');
  sinCR('src/amor.js');
}
// ---------------------------------------------------------------- 3. amor: no hay cita el día del casamiento
{
  const p = partida({ dia: 22, horas: 9 });
  p.amor.dia = 22;
  p.amor.personas.veterinaria = ficha({ etapa: 'comprometidos', afecto: 80, desde: 20, contacto: 22 });
  p.amor.anillo = { pedido: 1, listo: 4, retirado: true, para: 'veterinaria' };
  p.amor.boda = { con: 'veterinaria', dia: 23, hora: 11 };
  let acordo = null;
  for (let s = 0; s < 40; s++) { const r = M.invitarACita(p, 'veterinaria', 'plaza', { semilla: s }); if (r.ok) { acordo = r.cita; break; } }
  ok(!acordo || acordo.dia !== 23, 'amor: una cita nunca cae el día del casamiento (vencía como plantada)');
}
// ---------------------------------------------------------------- 4. amor: la cita en curso al recargar, el aviso y el ñiki ñiki
{
  const j = leer('src/amor-juego.js'), m = leer('src/main.js');
  ok(j.includes("if (!puesta && p.amor?.cita?.estado === 'en-curso') alCerrar();"), 'amor-juego: la cita en curso de una partida recargada se da por hecha');
  ok(j.includes("return puesta.por === 'cita' && c && c.clave === puesta.clave && c.estado === 'acordada' ?"), 'amor-juego: el aviso «Empezar la cita» sólo con ella puesta para la cita');
  ok(m.includes("&& !amorJuego?.textoAviso(vecino) && vecindadJuego?.invitado(vecino) !== 'esperando' && socialJuego?.quiereDecir(vecino)) aviso"), 'main: «te quiere decir algo» no tapa el aviso de la cita (la E la empieza primero)');
  ok(/const fundir = charla\.historia\?\.id === 'amor-fundido' && charla\.parte < charla\.historia\.partes\.length \? charla\.historia\.alTerminar : null;\n  if \(fundir\) charla\.historia = null;/.test(m) && /\n  fundir\?\.\(\);\n\}/.test(m), 'main: el ñiki ñiki cortado con Escape igual hace el fundido y el descanso');
  sinCR('src/amor-juego.js'); sinCR('src/main.js');
}

// ---------------------------------------------------------------- 5. la gente: nada de fantasmas
{
  const g = leer('src/gente.js');
  ok(g.includes('if (!gente.includes(vistiendo.npc)) { if (vistiendo.tarea.hecho && vistiendo.tarea.resultado) soltarPersona(vistiendo.tarea.resultado); vistiendo = null; return; }'), 'gente: la ropa nueva de una visita que se fue se suelta');
  ok(g.includes('      if (g.dormido || (g.aBordo && !g.enViaje)) continue;'), 'gente: no se le habla al que no se ve (el visitante que se fue, la familia, el chico que se fue a estudiar)');
  sinCR('src/gente.js');
}
// ---------------------------------------------------------------- 6. la vecindad: la invitación aceptada y cortada con Escape
{
  const m = leer('src/main.js');
  ok(m.includes('if (charla.historia?.cita && charla.parte < charla.historia.partes.length) { const c = charla.historia.cita; vecindadJuego?.empezarCita(charla.vec?.clave, c.npc || charla.npc, c.que, c.charla, c.lugares); charla.historia = null; }'), 'main: aceptó la invitación y cortaste la charla: igual va para la mesa');
  ok(m.indexOf('vecindadJuego?.empezarCita(charla.vec?.clave, c.npc || charla.npc, c.que, c.charla, c.lugares); charla.historia = null; }') < m.indexOf('charla.menu = null; charla.vec = null;   // 3.6 (vida)'), 'main: antes de olvidar a quién le hablabas');
}
// ---------------------------------------------------------------- 7. rincones: la talla, el campamento, tu casa, el taller
{
  const r = R.rinconesNuevos();
  let u = null;
  for (const id of IDS_DUENDES) u = R.encontrarDuende(r, id, 10);
  ok(u.todos && r.talla === 12, 'rincones: con los doce, la talla para el día 12');
  const s = R.sanearRincones(JSON.parse(JSON.stringify(r)), 10);
  ok(s.talla === 12 && !R.tallaEnLaPlaza(s, 10, 9), 'rincones: guardada y cargada, la talla sigue para el día 12 (salía el mismo día)');
  ok(R.sanearRincones({ ...JSON.parse(JSON.stringify(r)), talla: 500 }, 10).talla === 12, 'rincones: una talla rota no pasa de hoy + los días de Tito');
  const hijos = [{ nombre: 'Juan', etapa: 'chico' }];
  ok(!R.puedeAcampar(R.rinconesNuevos(), hijos, 5, 18.5) && R.puedeAcampar(R.rinconesNuevos(), hijos, 5, 19.5), 'rincones: se acampa desde que es de noche para dormir (antes, a las 18, era una siesta)');
  const m = leer('src/main.js'), j = leer('src/rincones-juego.js');
  ok(j.includes("hacer: () => ctx.dormir?.({ casaAldea: true }) };") && m.includes('dormir: (o) => dormir(o), refrescarHuerta:'), 'rincones: «Dormir en tu casa» le avisa a dormir() que es tu casa de la aldea');
  ok(m.includes('const bajoTechoPropio = enCasaAldea || obras?.dentro?.(jp) ||') && m.includes(": enCasaAldea ? 'calentito' : comoDormiste({"), 'main: en tu casa de la aldea, bajo techo y calentito (no la intemperie)');
  ok(j.includes("(falta.falta.n === 1 ? MATERIAL_UNO : MATERIAL)[falta.falta.k]") && j.includes("(n === 1 ? MATERIAL_UNO : MATERIAL)[k]") && j.includes("frutilla: 'frutillas', calafate: 'calafates'"), 'rincones: «falta 1 piedra», «faltan 3 frutillas»');
  sinCR('src/rincones.js'); sinCR('src/rincones-juego.js');
}
// ---------------------------------------------------------------- 8. la rueda: el que se va ofendido y el humor
{
  const m = leer('src/main.js');
  ok(m.includes('  if (r.cierra) charla.historia.volver = false;'), 'main: el que se fue ofendido no te vuelve a abrir la rueda con Escape');
  for (const e of ['tranquilo', 'contento', 'cansado', 'enojado', 'triste', 'enamorado', 'risa', 'sorpresa', 'verguenza', 'confundido']) ok(/^[A-ZÁÉÍÓÚ]/.test(PALABRA_EMOCION[e] || ''), 'la rueda: el humor ' + e + ' con su palabra');
  sinCR('src/social-rueda.js');
}

// ---------------------------------------------------------------- 9. la obra del pueblo completada de madrugada
{
  const g = leer('src/aldea-gente.js');
  ok(g.includes("const cuandoLista = (l) => (l && l.dia <= dia() ? 'a las 7 está lista' : 'mañana a la mañana está lista');"), 'aldea-gente: completada de madrugada dice «a las 7», no «mañana a la mañana»');
  ok(g.split('cuandoLista(').length - 1 === 3 && !/: mañana a la mañana está lista/.test(g), 'aldea-gente: los tres textos de la obra lo usan');
  sinCR('src/aldea-gente.js');
}

// ---------------------------------------------------------------- 10. las fiestas: la minga, el baile, las damas, la taba y el diario
{
  const st = F.fiestasNuevas(), m1 = F.mingaDelAnio(1);
  let r = null;
  for (let i = 0; i < m1.cargas; i++) r = F.cargarMinga(st, 7);
  ok(r.faltan === 0 && !r.tuParte, 'minga: la última carga completa tu parte');
  const r2 = F.cargarMinga(st, 7), r3 = F.cargarMinga(st, 7);
  ok(r2.tuParte && r3.tuParte && r3.cargas === m1.cargas, 'minga: con tu parte hecha no se carga más (cada E sumaba amistad sin fin)');
  const j = leer('src/fiestas-juego.js');
  ok(j.includes("if (r.tuParte) { ctx.nota?.('Tu parte ya está hecha', 'A la una se come en la mesa larga'); return; }"), 'minga: E dice que tu parte ya está, sin sumar');
  ok(j.includes('    if (diaAmistadBaile === dia()) return;\n    diaAmistadBaile = dia();\n    for (const k of presentes())'),'baile: la amistad del baile, una vez por día');
  ok(j.includes("decirRival(tablas ? 'Tablas. La próxima no te la dejo.' :") && j.includes("e.terminado === 'tablas' ? 'Tablas' : ''"), 'damas: en tablas el rival no dice «Te gané»');
  ok(j.includes('panel.finQuien = j;') && j.includes('panel.finQuien === 1 ?'), 'taba: el texto final según quién la definió');
  const a = A.aldeaNueva(); a.descubierta = 1;
  ok(novedadesDelValle({ aldea: a, dia: 2 }, 2)[0] === 'Hoy es fiesta de la Fruta Fina: todos al predio de la fiesta.', 'diario: la fiesta es en el predio, no en la plaza');
  sinCR('src/fiestas.js'); sinCR('src/fiestas-juego.js'); sinCR('src/noticias-juego.js');
}

// ---------------------------------------------------------------- 11. amor: los días del embarazo, un hijo solo y una hija
{
  const v = leer('src/amor-voces.js'), a = leer('src/amor.js');
  ok(M.llenarAmor(FRASES_AMOR.embarazo, { ella: 'Sofía', dias: 'un día' }) === 'Sofía te dice al oído que va a tener un bebé. Llega en un día.', 'amor: «Llega en un día» (decía «Faltan unos 1 días»)');
  ok(a.includes("return { dias: k === 1 ? 'un día' : `unos ${k} días` };") && !/unos {dias} días/.test(v), 'amor: los días, con su número');
  ok(FRASES_AMOR.separacion.includes('con {chicos}.') && a.includes('chicos: chicosDe(amor, c)'), 'amor: con un hijo solo se va «con Malén», no «con los chicos»');
  ok(!/lo dejemos ir solo|A veces lo miro|el vecino más chico/.test(v), 'amor: lo de {hijo} sirve para una hija');
  sinCR('src/amor-voces.js');
}

// ---------------------------------------------------------------- 12. la maestra no te manda a anotar lo de los rincones
{
  const rinc = new Set(ENTRADAS_RINCONES.map((e) => e.id));
  ok(!A.pendientesDelCuaderno({}).some((e) => rinc.has(e.id)), 'aldea: los pendientes del cuaderno no traen lo de los rincones (el campamento, tu casa, el sulky…)');
  // todo anotado menos el campamento: no hay mandado trabado
  const entradas = Object.fromEntries(ENTRADAS.filter((e) => e.id !== 'campamento').map((e) => [e.id, { dia: 1, hora: 9, cantidad: 1 }]));
  const p = partida({ entradas });
  let s = A.servicioDe('maestra', p, 20);
  ok(!JSON.stringify(s.efectos || []).includes('campamento') && /No te falta nada/.test(s.partes[0] || ''), 'aldea: con todo anotado menos el campamento, la maestra no te lo pide');
  // una partida guardada con un mandado de los rincones: se cambia
  p.aldea.mandado = { id: 'campamento', dia: 10 };
  delete p.entradas['cruz-del-sur'];
  s = A.servicioDe('maestra', p, 20);
  ok(JSON.stringify(s.efectos || []).includes('cruz-del-sur'), 'aldea: un mandado guardado de los rincones se cambia por uno que se puede hacer');
}

// ---------------------------------------------------------------- 13. el concurso: Nélida dijo «Anotado»
{
  const m = leer('src/main.js'), c = leer('src/concursos-juego.js');
  ok(m.includes("if (charla.historia?.id === 'concurso-anotar' && charla.parte === charla.historia.partes.length - 1) { const anotar = charla.historia.alTerminar; charla.historia = null; anotar?.(); }"), 'main: con «Anotado» en pantalla, cortar la charla igual te anota');
  const bloque = c.slice(c.indexOf("id: 'concurso-anotar'"), c.indexOf('alTerminar', c.indexOf("id: 'concurso-anotar'")));
  ok(bloque.includes('¿Te anoto?') && bloque.indexOf('`Anotado, con') > bloque.indexOf('¿Te anoto?'),'concursos: el último renglón es el de «Anotado»');
}

// ---------------------------------------------------------------- 14. el chinchón: las sueltas con 8 cartas
{
  const j = leer('src/fiestas-juego.js');
  ok(j.includes('mano.length > 7 ? { resto: Math.min(...mano.map((_c, i) => mejorLigado(mano.filter((_x, k) => k !== i)).resto)) } : mejorLigado(mano)') && !j.includes('mano.slice(0, 7)'), 'chinchón: con 8 cartas, las sueltas cuentan la recién levantada');
  ok(j.includes('if (panel.ligMano !== claveMano)'), 'chinchón: se calcula una vez por mano, no en cada redibujo');
}

// ---------------------------------------------------------------- 15. la visita, la mesa a caballo, R a caballo y el sulky
{
  const vj = leer('src/vecindad-juego.js'), m = leer('src/main.js'), j = leer('src/rincones-juego.js');
  ok(vj.includes('if (npc?.deVisita) return no(FRASES_JUEGO.deVisita);') && vj.indexOf('if (npc?.deVisita) return no(FRASES_JUEGO.deVisita);') < vj.indexOf('const r = invitar(s.clave, que, p, horas()'), 'vecindad: el que está de visita en tu casa no sale a tomar el té (quedaba parado en tu mesa para siempre)');
  ok(m.includes('function sentarseALaCita() {\n  if (jugador.estado.montado || jugador.estado.enTren) return false;'), 'main: a caballo no te sienta a la mesa de la invitación');
  ok(m.includes("if (js.montado && !charla.npc) aviso = vecino ? { tecla: 'E', texto: (!desafio && amorJuego?.textoAviso(vecino)) || `Hablar con ${vecino.nombre}` } :"), 'main: a caballo, el aviso de la cita es el mismo que hace la E');
  ok(m.includes('else if (!js.nadando && !js.enKayak && !js.enTren && !js.montado && !js.enSulky) jugador.sentarse(true);'), 'main: R no te sienta arriba del zaino');
  ok(j.includes('const lado = puente ? 0.55 : 1.25;') && j.includes('if (puente) js.pos.y = Math.max(js.pos.y, puente.alto + 0.04);'), 'sulky: en el puentecito te bajás sobre el tablero, no al arroyo');
  ok(j.includes("paraGuardar: () => {") && m.includes('if (jugador.estado.enSulky) rinconesJuego?.paraGuardar?.();'), 'sulky: guardando arriba, el sulky queda donde ibas');
  sinCR('src/vecindad-juego.js');
}

console.log(`verificar-3-8-3-aldea: ${n} comprobaciones en verde`);
