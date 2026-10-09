// 3.8.3 (aldea): pase de bugs de la aldea y la gente antes de Steam. Una comprobación por arreglo.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as M from '../src/amor.js';
import * as A from '../src/aldea.js';
import * as V from '../src/vecindad.js';
import * as R from '../src/rincones.js';
import { IDS_DUENDES } from '../src/rincones-cuaderno.js';
import { PALABRA_EMOCION } from '../src/social-rueda.js';

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
  ok(m.includes("&& !amorJuego?.textoAviso(vecino) && socialJuego?.quiereDecir(vecino)) aviso"), 'main: «te quiere decir algo» no tapa el aviso de la cita (la E la empieza primero)');
  ok(/const fundir = charla\.historia\?\.id === 'amor-fundido' && charla\.parte < charla\.historia\.partes\.length \? charla\.historia\.alTerminar : null;\n  if \(fundir\) charla\.historia = null;/.test(m) && /\n  fundir\?\.\(\);\n\}/.test(m), 'main: el ñiki ñiki cortado con Escape igual hace el fundido y el descanso');
  sinCR('src/amor-juego.js'); sinCR('src/main.js');
}

// ---------------------------------------------------------------- 5. la gente: nada de fantasmas
{
  const g = leer('src/gente.js');
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

console.log(`verificar-3-8-3-aldea: ${n} comprobaciones en verde`);
