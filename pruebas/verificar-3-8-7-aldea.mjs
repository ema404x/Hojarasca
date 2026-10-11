// 3.8.7 (aldea): segundo pase de bugs de la aldea (lo que tocó la 3.8.6, muchos días seguidos, cada local). Una
// comprobación (o varias) por arreglo.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as AL from '../src/aldea.js';
import * as AM from '../src/amor.js';
import * as G from '../src/aldea-gente.js';
import * as F from '../src/fiestas.js';
import * as VI from '../src/aldea-vida.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const aldeaCompleta = () => { const a = AL.aldeaNueva(); a.pobladores = AL.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 })); a.locales = Object.fromEntries(AL.LOTES_ALDEA.map((l) => [l, 1])); return AL.sanearAldea(a); };
const cruza = (desde, pasos) => { let p = desde; for (const q of pasos) { if (!q.sinChoque && G.OBSTACULOS_PREDIO.some((o) => G.cortaObstaculo(p, q, o, 0.15))) return true; p = q; } return false; };

// ---------------------------------------------------------------- 1. el predio de la fiesta: por las calles, rodeando la mesa larga y el ruedo
{
  const P = F.puntosPredio();
  // (la simulación de muchos días: en cada fiesta casi todos se trababan contra la mesa larga o el cerco del ruedo y
  // aparecían de golpe en su lugar, unos 40 saltos por día)
  const desdes = [{ x: 13.8, z: 26 }, { x: 0, z: 26 }, { x: 30, z: 26 }, { x: 22, z: 26 }, { x: -6, z: 40 }, { x: 40, z: 30 }];
  let rutas = 0, malas = [];
  for (const d of desdes) for (const [k, q] of Object.entries(P)) {
    if (k === 'palenque') continue;
    rutas += 2;
    if (cruza(d, G.recorridoAldea(d, { x: q.x, z: q.z }))) malas.push(`${k} desde ${d.x},${d.z}`);
    if (cruza(q, G.recorridoAldea({ x: q.x, z: q.z }, d))) malas.push(`${k} hacia ${d.x},${d.z}`);
  }
  ok(rutas > 400 && malas.length === 0, `predio: ningún camino atraviesa la mesa, la mesita, la leñera, el fogón ni el ruedo (${malas.slice(0, 4).join('; ')})`);
  // antes: de la calle derecho al banco del lado de la pista, a través de la mesa
  const viejo = [{ x: P['mesa-s-3'].x, z: P['mesa-s-3'].z }];
  ok(cruza({ x: 13.8, z: 26 }, viejo), 'predio: (el camino de antes cruzaba la mesa larga)');
  const nuevo = G.recorridoAldea({ x: 13.8, z: 26 }, P['mesa-s-3']);
  ok(nuevo.length >= 2 && !cruza({ x: 13.8, z: 26 }, nuevo), `predio: ahora la rodea (${nuevo.map((q) => `${q.x.toFixed(1)},${q.z.toFixed(1)}`).join(' → ')})`);
  // de un asiento a otro del otro lado (de la mesa a mirar el baile), también
  ok(!cruza(P['mesa-n-4'], G.recorridoAldea(P['mesa-n-4'], P['mira-baile-3'])), 'predio: de la mesa (lado norte) a mirar el baile, alrededor');
  ok(!cruza({ x: 25.45, z: 26 }, G.recorridoAldea({ x: 25.45, z: 26 }, P['ruedo-mira-0'])), 'predio: al costado del ruedo de enfrente, por afuera del cerco');
  // lo que no está en el predio queda igual (de una casa a otra)
  const a = AL.puntosFijosDe('almacen'), b = AL.puntosFijosDe('panaderia');
  eq(G.rodearPredio(a.puerta, [b.puerta]), [b.puerta], 'predio: lejos del predio, el camino no cambia');
  const g = leer('src/aldea-gente.js');
  ok(g.includes("for (const q of rodearPredio(p0, caminoAldea(p0, meta, entra || sale ? 4 : 10))) pasos.push({ x: q.x, z: q.z });") && g.includes("import { PREDIO } from './fiestas.js';"), 'aldea-gente: recorridoAldea rodea el predio (lo usan también amor-mundo y fiestas-mundo)');
  // el asiento de afuera: el último medio metro sin choque (la silla de la mesita está a 22 cm de la mesa)
  ok(g.includes('if (d.sentado && !d.adentro && ult && !ult.sinChoque) {') && g.includes('pasos[pasos.length - 1] = { ...ult, sinChoque: true };'), 'aldea-gente: al asiento de afuera llega sin trabarse con la mesa (Ernesto y la silla del truco)');
}

// ---------------------------------------------------------------- 2. el que te viene a buscar: por las calles, y no vuelve de golpe a los 12 s
{
  const g = leer('src/aldea-gente.js'), s = leer('src/social-juego.js'), m = leer('src/main.js');
  ok(g.includes('if (st.caminoVisto !== n.camino) { st.caminoVisto = n.camino; st.trabado = { d: Infinity, t: 0 }; }'), 'aldea-gente: un camino nuevo (el de la iniciativa) se mide desde cero (antes volvía de golpe a su lugar a los 12 s de salir a buscarte)');
  ok(g.includes('caminoA: (desde, hasta, cerca = 0.6) => {') && m.includes('camino: (desde, hasta, cerca) => aldeaGente?.caminoA?.(desde, hasta, cerca) || null,'), 'aldea-gente y main: el camino por la aldea de un punto del mundo a otro');
  ok(s.includes('mejor.camino = caminoA(origen, {') && s.includes('p.npc.camino = caminoA(p.npc.pos, p.origen, 0.5);') && s.includes('npc.camino = caminoA(npc.pos, vuelve.origen, 0.5);'), 'social-juego: ir a buscarte y volver, por las calles (antes derecho: desde adentro de un local cruzaba la pared)');
  // de verdad: con un `ctx.camino` que da tres pasos, la figura los recibe; sin él, derecho como antes
  const S = await import('../src/vecindad-social.js');
  const V = await import('../src/vecindad.js');
  const { crearSocialJuego } = await import('../src/social-juego.js');
  const { claveVecindad } = await import('../src/vecindad-juego.js');
  const prueba = (camino) => {
    for (let k = 0; k < 30; k++) {
      const p = { dia: 5, horas: 12, cosas: {}, materiales: {}, entradas: {}, vecindad: V.vecindadNueva(), amor: AM.amorNuevo() };
      for (let d = 1; d <= 16; d++) V.regalar('panadera', V.PERFILES_VECINOS.panadera.gustos.encanta[d % 3], p, d, () => 99);
      const fig = { claveAldea: 'panadera', clave: 'poblador-panadera', pos: { x: 12, z: 0, y: 0 }, g: { visible: true } };
      const sj = crearSocialJuego({ social: { ...S }, progreso: () => p, dia: () => 5, hora: () => 12, ritmo: () => 'animado', jugador: () => ({ x: 0, z: 0 }), gente: () => [fig], claveDe: claveVecindad, camino });
      if (sj.forzarIniciativa()) return fig.camino;
    }
    return null;
  };
  const conCalles = prueba(() => [{ x: 10, z: 5 }, { x: 4, z: 5 }, { x: 1.8, z: 0, cerca: 0.6 }]);
  ok(conCalles?.length === 3, 'social-juego: la iniciativa camina por lo que da ctx.camino');
  const derecho = prueba(undefined);
  ok(derecho?.length === 1 && Math.abs(derecho[0].x - 1.8) < 1e-6, 'social-juego: sin ctx.camino, derecho como antes');
}

// ---------------------------------------------------------------- 3. «Hasta acá» sólo en su renglón
{
  const m = leer('src/main.js');
  ok(m.includes('if (!charla.menu && charla.historia?.alEscape && !charla.fin && charla.parte === charla.historia.partes.length - 1) {'), 'main: con «seguimos» elegido, Escape en la despedida ya no lo manda a la estación');
}

// ---------------------------------------------------------------- 4. la cita: invitada a tu mesa cuenta cuando está sentada con vos
{
  const { crearAmorJuego } = await import('../src/amor-juego.js');
  const armar = (fase) => {
    const q = { dia: 30, horas: 15, entradas: {}, materiales: {}, cosas: {}, aldea: aldeaCompleta(), vecindad: {}, amor: AM.amorNuevo() };
    q.amor.personas.fotografa = { etapa: 'saliendo', afecto: 40, desde: 20, contacto: 29, charla: 0, piropo: 0, flores: 0, carta: 0, leyo: null, citas: 1, ultimaCita: 0, enojo: 0, motivo: null, rechazo: 0, reconquista: 0, chicos: 0 };
    q.amor.cita = { clave: 'fotografa', lugar: 'plaza', dia: 30, desde: 15, hasta: 16.5, estado: 'acordada' };
    q.amor.dia = 30;
    const npc = { clave: 'fotografa', claveAldea: 'fotografa', enCita: true, pos: { x: 0, z: 0, y: 0, set() {} } };
    const estado = { fase };
    const aj = crearAmorJuego({ progreso: () => q, ajustes: () => ({ romance: true }), npcDe: () => npc, tomandoAlgo: (x) => (x === npc ? estado.fase : null), jugador: () => ({ x: 0, z: 0 }), nota: () => {}, guardar: () => {} });
    return { q, npc, aj, estado };
  };
  const y = armar('yendo');
  y.aj.actualizar(1);
  ok(!y.q.amor.cita.juntos && !y.q.amor.cita.ocupada && !y.aj.puesta(), 'cita: invitada y todavía yendo a tu mesa, todavía no está «con vos» (ni ocupada)');
  // nunca llegaste a la mesa: la invitación se cae y ella va a esperarte a la cita (antes, la cita se daba por hecha)
  y.estado.fase = null; y.npc.enCita = false;
  y.aj.actualizar(1);
  ok(!y.q.amor.cita.juntos && y.q.amor.cita.espero, 'cita: la invitación se cayó: va a esperarte al lugar de la cita');
  const c = armar('charlando');
  c.aj.actualizar(1);
  ok(c.q.amor.cita.juntos === true && !c.aj.puesta(), 'cita: sentada con vos, charlando: la cita es «con vos» (como en la 3.8.6)');
  ok(leer('src/main.js').includes('tomandoAlgo: (npc) => vecindadJuego?.invitado(npc) || null,'), 'main: tomandoAlgo da la fase');
}

// ---------------------------------------------------------------- 5. «te quiere decir algo» con Ernesto y el cachorro; pedir y agradecer
{
  const m = leer('src/main.js');
  ok(m.includes("const iniLlegada = deLaAldea.tipo === 'llegada' && !desafio ? socialJuego?.tomarIniciativa(npc) : null;"), 'main: Ernesto con el cachorro dice primero lo que te venía a decir (antes el aviso seguía «te quiere decir algo»)');
  ok(m.includes("const partes = gracias ? (ini.tipo === 'pedir' ? [gracias] : [...ini.renglones, gracias]) : ini.renglones;"), 'main: si te venía a pedir lo que ya hiciste, sólo las gracias (no te lo pide y te agradece de un tirón)');
}

// ---------------------------------------------------------------- 6. fiestas: la taba, una vez por día; el reloj sentado; el concurso entre fases
{
  const j = leer('src/fiestas-juego.js'), m = leer('src/main.js');
  ok(j.includes("amistadDeHoy(estado(), `taba:${panel.rival.clave}`, dia())) ctx.sumarAmistad?.(panel.rival.clave, 1);"), 'fiestas: la taba da amistad una vez por día con cada rival (antes, sin tope)');
  const st = F.fiestasNuevas();
  ok(F.amistadDeHoy(st, 'taba:jefe', 9) && !F.amistadDeHoy(st, 'taba:jefe', 9) && F.amistadDeHoy(st, 'taba:padre', 9) && F.amistadDeHoy(st, 'taba:jefe', 10), 'fiestas: taba:jefe una vez por día (y se guarda con la clave saneable)');
  ok(F.sanearFiestas(JSON.parse(JSON.stringify(st)), 10).amistadHoy.ya.includes('taba:jefe'), 'fiestas: el saneo la deja');
  ok(j.includes("sentadoEnFiesta = !!js?.sentado && fase !== 'palear' && (fase === 'acto' || f.lugar === 'plaza' ? enLaPlazaAhora : enPredio);"), 'fiestas: el reloj se frena sentado donde está la fiesta (no en cualquier banco de la plaza todo el día, ni paleando la nevada)');
  ok(j.includes('const enCursoHoy = () => activo() && fechasDeHoy().some((f) => {') && m.includes('fiestaEnCurso: () => !!fiestasJuego?.enCursoHoy?.(),'), 'fiestas y main: el concurso sabe que la fiesta sigue entre una fase y otra (Nélida iba y volvía de la plaza)');
  // (el Día de la Aldea: del acto a la mesa hay media hora sin fase)
  const aldea = F.FECHAS.find((f) => f.programa === 'aldea'), pr = F.programaDe(aldea);
  ok(!F.faseDe(aldea, 11.75) && 11.75 >= pr[0].desde && 11.75 < pr[pr.length - 1].hasta, 'fiestas: (entre el acto y la mesa del Día de la Aldea no hay fase, pero la fiesta sigue)');
}

// ---------------------------------------------------------------- 7. el visitante que ya llevaste
{
  const vis = { id: 'lena', lugar: Object.keys(VI.LUGARES_VISITA)[0], dia: 7, estado: 'llego' };
  ok(VI.sanearVidaAldea({ visitante: { ...vis } }, 7).visitante === null, 'visitante: al recargar ya se fue (volvía al andén con las gracias de recién llegado)');
  let nuevo = null, v = null;
  for (let d = 8; d < 80 && !nuevo; d++) { v = VI.vidaNueva(1); v.visitante = { ...vis, dia: d - 1 }; v.visitantesDia = d - 1; nuevo = VI.visitanteDelDia(v, d, { ritmo: 'animado', semilla: 3 }); }
  ok(nuevo && v.visitante?.estado === 'anden' && v.visitante !== null, 'visitante: el de ayer que se quedó mirando el lugar no tapa al de hoy');
  const tx = VI.textosVisitante({ id: 'lena', lugar: vis.lugar, dia: 7, estado: 'guiando' });
  ok(tx && (tx.chau.match(/[Gg]racias/g) || []).length <= 1 && !tx.chau.includes('Gracias por la compañía'), `visitante: «Hasta acá» agradece una vez (${tx?.chau})`);
}

// ---------------------------------------------------------------- 8. hablar de los chicos con la ex, casado con otra: sin afecto de más
{
  const f = (etapa, desde) => ({ etapa, afecto: 60, desde, contacto: 59, charla: 0, piropo: 0, flores: 0, carta: 0, leyo: null, citas: 3, ultimaCita: 0, enojo: 0, motivo: null, rechazo: 0, reconquista: 0, chicos: 0 });
  const p = { dia: 60, horas: 12, entradas: {}, materiales: {}, cosas: {}, aldea: aldeaCompleta(), vecindad: {}, amor: AM.amorNuevo() };
  p.amor.personas.fotografa = f('separados', 20);
  p.amor.personas.veterinaria = f('casados', 40);
  p.amor.conyuge = 'veterinaria';
  p.amor.hijos = [{ id: 'hijo-1', nombre: 'Clara', sexo: 'nena', nacio: 10, madre: 'fotografa', guia: null }];
  const antes = p.amor.personas.fotografa.afecto;
  const r = AM.hablarDeLosChicos(p, 'fotografa', { romance: true });
  ok(r.ok && p.amor.personas.fotografa.afecto === antes, `amor: con la ex (casado con otra) se habla de Clara sin que le suba el afecto (${antes} → ${p.amor.personas.fotografa.afecto})`);
  // con la que es tu pareja, sigue subiendo
  p.amor.hijos.push({ id: 'hijo-2', nombre: 'Mateo', sexo: 'nene', nacio: 50, madre: 'veterinaria', guia: null });
  const a2 = p.amor.personas.veterinaria.afecto;
  AM.hablarDeLosChicos(p, 'veterinaria', { romance: true });
  ok(p.amor.personas.veterinaria.afecto === Math.min(100, a2 + 1), 'amor: con tu pareja, sí');
}

// ---------------------------------------------------------------- 9. el taller: géneros y plurales
{
  const TJ = await import('../src/taller-tren-juego.js');
  const TM = await import('../src/tren-mejoras.js');
  const L = Object.values(TM.MEJORAS_TREN);
  const de = (nombre) => L.find((m) => m.nombre === nombre);
  eq([de('Farol de proa'), de('Caldera: tubos nuevos'), de('Jaula para el caballo'), de('Guardas y banderines'), de('Coche comedor')].map((m) => TJ.generoMejora(m).o), ['o', 'a', 'a', 'os', 'o'], 'taller: «Farol de proa, listo», «Caldera…, lista», «Jaula…, lista», «Guardas y banderines, listos», «Coche comedor, listo»');
  const t = leer('src/taller-tren-juego.js');
  ok(t.includes('${(MAT_NOMBRE[k] || [k, k])[pide[k] === 1 ? 0 : 1]}') && !t.includes("${k === 'tabla' ? 'tablas' : k === 'tronco' ? 'troncos' : 'piedras'}"), 'taller: «0 de 1 tabla» (salía «0 de 1 tablas»)');
  ok(t.includes("El material está. Falta${r.hierroFalta === 1 ? '' : 'n'} ${textoPiezas(r.hierroFalta)}"), 'taller: «Falta una pieza de hierro» (salía «Faltan una»)');
  ok(!/'listo' : 'lista'|, lista \$\{|queda lista \$\{|Queda lista \$\{/.test(t), 'taller: sin «lista» fijo');
}

// ---------------------------------------------------------------- 10. el caballo herrado, el telescopio, el libro en tu casa
{
  const m = leer('src/main.js'), mm = leer('src/aldea-mecanicas-mundo.js'), rj = leer('src/rincones-juego.js');
  ok(m.includes('mo.trote = MARCHA_CABALLO.trote * f; mo.galope = MARCHA_CABALLO.galope * f;'), 'main: el caballo herrado hoy anda más liviano cada cuadro (no sólo al montar; y a la medianoche se le pasa)');
  ok(mm.includes('noche = h >= 20 || h < 5;'), 'observatorio: el telescopio de noche desde las 20, como su horario y su charla');
  ok(rj.includes('enTuCasa: (p) => !!p && casaTerminada(r().casa, dia(), horas()) && adentroDeCasa(p.x, p.z),') && m.includes('|| (!desafio && !!rinconesJuego?.enTuCasa?.(p)); },'), 'biblioteca: el libro prestado se lee también en tu casa de la aldea');
  ok(leer('src/aldea-mecanicas.js').includes("Se lee sentado, en el refugio o en tu casa'"), 'biblioteca: el préstamo lo dice');
}

// ---------------------------------------------------------------- 11. la plaza: sentados en los bancos de verdad (no en el aire)
{
  const P = AL.puntosDe('plaza'), e = AL.EDIFICIOS_ALDEA.plaza;
  // los asientos de los bancos, en el plano, como los arma aldea-arquitectura.js (banco(), marcoLocal)
  const asientos = [];
  for (const am of [0, Math.PI, Math.PI / 2 - 0.33, Math.PI / 2 + 0.33, -Math.PI / 2 - 0.33, -Math.PI / 2 + 0.33]) {
    const x = Math.cos(am) * (3.9 - 0.62), z = Math.sin(am) * (3.9 - 0.62), g = Math.atan2(-x, -z);
    for (const sx of [-0.4, 0.4]) { const lx = sx * 1.7 / 2, lz = 0.02, bx = x + lx * Math.cos(g) + lz * Math.sin(g), bz = z - lx * Math.sin(g) + lz * Math.cos(g); const c = Math.cos(e.rot), s = Math.sin(e.rot); asientos.push({ x: e.x + bx * c + bz * s, z: e.z - bx * s + bz * c }); }
  }
  const lejos = [];
  for (let k = 1; k <= 12; k++) { const q = P[`estar-${k}`]; const d = Math.min(...asientos.map((a) => Math.hypot(a.x - q.x, a.z - q.z))); if (d > 0.05) lejos.push(`estar-${k}: ${d.toFixed(2)}`); }
  ok(lejos.length === 0, `plaza: estar-1 a 12 son los asientos de los seis bancos (antes, una grilla sin bancos: se sentaban en el aire) ${lejos.join(', ')}`);
  ok([13, 14, 15, 16, 17, 18, 19, 20].every((k) => P[`estar-${k}`].pie && !P[`estar-${k}`].frente), 'plaza: estar-13 a 20, de pie alrededor del duende');
  const a = aldeaCompleta();
  const sent = G.destinosAldea(a, 16, 3, ['abuela'], undefined, new Map([['abuela', { lugar: 'plaza', edificio: 'plaza', punto: 'estar-3' }]])).get('abuela');
  ok(sent.sentado && Math.hypot(sent.lx - P['estar-3'].x, sent.lz - P['estar-3'].z) < 1e-6, 'plaza: en un banco, sentada');
  const pie = G.destinosAldea(a, 16, 3, ['abuela'], undefined, new Map([['abuela', { lugar: 'plaza', edificio: 'plaza', punto: 'estar-15' }]])).get('abuela');
  ok(!pie.sentado, 'plaza: alrededor del duende, de pie');
  const acto = G.destinosAldea(a, 10.5, 4, ['abuela'], undefined, new Map([['abuela', { lugar: 'fiesta', edificio: 'plaza', punto: 'estar-3', sentado: false }]])).get('abuela');
  ok(!acto.sentado && Math.hypot(acto.lx - P['estar-3'].frente.x, acto.lz - P['estar-3'].frente.z) < 1e-6, 'plaza: de pie en el acto, delante del banco (no arriba)');
}

// ---------------------------------------------------------------- 12. chinchón: el comodín suelto del que no cortó cuenta 25 (decisión del usuario)
{
  const J = await import('../src/juegos-mesa.js');
  const c = (n, palo) => ({ n, palo }), C = { n: 0, palo: 'comodin' };
  const juegos = [[c(3, 'oro'), c(4, 'oro'), c(5, 'oro')], [c(9, 'copa'), c(9, 'oro'), c(9, 'basto')]];
  const mano = [C, c(6, 'oro'), c(2, 'espada')];
  const r = J.acomodarSueltas(juegos, mano, [0, 1, 2]);
  ok(!r.puestas.includes(0) && r.puestas.includes(1) && r.resto === 25 + 2, `chinchón: el 6 de oro se acomoda en la escalera, el comodín no: 25 en contra (${JSON.stringify(r)})`);
  ok(J.acomodarSueltas(juegos, [C], [0]).resto === J.CHINCHON.comodinSuelto, 'chinchón: solo, también (antes entraba en cualquier juego y nunca contaba)');
  ok(leer('src/juegos-mesa.js').includes('      if (esComodin(mano[i])) { siguen.push(i); continue; }'), 'juegos-mesa: el comodín no se acomoda');
}

for (const f of ['src/juegos-mesa.js', 'src/aldea.js', 'src/aldea-gente.js', 'src/social-juego.js', 'src/amor-juego.js', 'src/amor.js', 'src/fiestas-juego.js', 'src/aldea-vida.js', 'src/taller-tren-juego.js', 'src/aldea-mecanicas-mundo.js', 'src/aldea-mecanicas.js', 'src/rincones-juego.js', 'src/main.js', 'pruebas/verificar-3-8-7-aldea.mjs']) ok(!leer(f).includes('\r'), `${f}: fines de línea LF`);
console.log(`verificar-3-8-7-aldea: ${n} comprobaciones OK`);
