// 3.8.3 (aldea): pase de bugs de la aldea y la gente antes de Steam. Una comprobación por arreglo.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as M from '../src/amor.js';
import * as A from '../src/aldea.js';
import * as V from '../src/vecindad.js';

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

console.log(`verificar-3-8-3-aldea: ${n} comprobaciones en verde`);
