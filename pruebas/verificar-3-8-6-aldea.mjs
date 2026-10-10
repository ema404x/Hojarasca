// 3.8.6 (aldea): pase de bugs de la aldea, los vecinos, el amor y las tradiciones. Una comprobación por arreglo.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as AM from '../src/amor.js';
import * as AL from '../src/aldea.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const sinCR = (f) => ok(!leer(f).includes('\r'), `${f}: fines de línea LF`);
const aldeaCompleta = () => { const a = AL.aldeaNueva(); a.pobladores = AL.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 })); a.locales = Object.fromEntries(AL.LOTES_ALDEA.map((l) => [l, 1])); return AL.sanearAldea(a); };

// ---------------------------------------------------------------- 1. amor: reconquistar con la vida rehecha
{
  const aldea = aldeaCompleta();
  const progreso = (dia, personas, extra = {}) => ({ dia, horas: 10, aldea, vecindad: {}, amor: AM.sanearAmor({ personas, ...extra }, dia) });
  const sep = { etapa: 'separados', afecto: 80, desde: 20, contacto: 30, reconquista: 2 };
  const k = AM.ORDEN_CANDIDATAS.filter((x) => x !== 'fotografa').find((x) => AM.puedeRomance(x, progreso(1, {})).ok);
  // de novio con otra (pasada la estación), volver con la ex: la novia se entera y corta (antes quedabas casado y de novio)
  const p = progreso(30, { fotografa: { ...sep }, [k]: { etapa: 'novios', afecto: 50, desde: 26, contacto: 30 } }, { conyuge: 'fotografa' });
  let r = null;
  for (let s = 0; s < 40 && !r?.si; s++) { p.amor.personas.fotografa.rechazo = 0; r = AM.reconquistar(p, 'fotografa', { semilla: s, lugar: 'mirador' }); }
  ok(r?.si && p.amor.personas.fotografa.etapa === 'casados', 'amor: con la vida rehecha, la reconquista sigue');
  ok(p.amor.personas[k].etapa === 'conocidos' && r.cortaron.includes(k), 'amor: la novia nueva se entera y corta (como al proponer)');
  ok(p.amor.conyuge === 'fotografa', 'amor: la que vuelve es la cónyuge');
  // comprometido con otra: no se puede volver con la ex
  const q = progreso(30, { fotografa: { ...sep }, [k]: { etapa: 'comprometidos', afecto: 70, desde: 27, contacto: 30 } }, { conyuge: 'fotografa', anillo: { pedido: 22, listo: 25, retirado: true, para: k }, boda: { con: k, dia: 31 } });
  const rq = AM.reconquistar(q, 'fotografa', { semilla: 1, lugar: 'mirador' });
  ok(!rq.ok && rq.motivo === 'tenes-pareja' && q.amor.personas.fotografa.etapa === 'separados', 'amor: comprometido con otra, la ex no vuelve (quedaban dos parejas)');
  // casado de nuevo y separado otra vez (recién): la primera tampoco vuelve; pasada la estación, sí, y es la cónyuge
  const w = progreso(40, { fotografa: { ...sep }, [k]: { etapa: 'separados', afecto: 20, desde: 38, contacto: 38 } }, { conyuge: k });
  ok(AM.reconquistar(w, 'fotografa', { semilla: 1 }).motivo === 'tenes-pareja', 'amor: recién separado de la segunda, la primera no vuelve todavía');
  w.dia = 43;
  let rw = null;
  for (let s = 0; s < 40 && !rw?.si; s++) { w.amor.personas.fotografa.rechazo = 0; rw = AM.reconquistar(w, 'fotografa', { semilla: s, lugar: 'mirador' }); }
  ok(rw?.si && w.amor.conyuge === 'fotografa' && Object.hasOwn(w.amor.habilidades, 'fotografa'), 'amor: la que vuelve pasa a ser la cónyuge (antes seguía la otra: sin habilidades ni hijos)');
  ok(leer('src/amor-juego.js').includes("for (const o of r.cortaron || []) avisar(`${nombre(o)} se enteró`, 'Ya no salen más');   // 3.8.6: como al proponer"), 'amor-juego: avisa a quién cortó');
  sinCR('src/amor.js');
}

// ---------------------------------------------------------------- 2. gente: una sola lista de poses sentadas (con «comer»)
{
  const g = leer('src/gente.js'), m = leer('src/main.js');
  ok(g.includes("export const POSES_SENTADAS = new Set(['sentado', 'leyendo', 'tornear', 'coser', 'comer']);") && g.includes("switch (estaSentado(g) ? 'sentado' : g.pose) {"), 'gente: las poses sentadas en una sola lista, y el cuerpo sentado sale de ahí');
  ok(m.includes('est.ocupado = (s) => gente.gente.some((g) => estaSentado(g) && !g.dormido') && m.includes("import { crearGente, saludoDe, alturaDePie, estaSentado } from './gente.js';"), 'main: la silla de alguien sentado (comiendo también) no se ofrece');
  ok(!/g\.pose === 'sentado' \|\| g\.pose === 'leyendo'/.test(m), 'main: sin una segunda lista a mano');
  sinCR('src/gente.js');
}
// ---------------------------------------------------------------- 3. amor: hijos de dos madres, cada uno en el cuarto de la suya
{
  const E = await import('../src/amor-escenas.js');
  const p = { dia: 60, horas: 22, entradas: {}, materiales: {}, cosas: {}, aldea: aldeaCompleta(), vecindad: {}, amor: AM.amorNuevo() };
  const f = (etapa, desde) => ({ etapa, afecto: 70, desde, contacto: 59, charla: 0, piropo: 0, flores: 0, carta: 0, leyo: null, citas: 3, ultimaCita: 0, enojo: 0, motivo: null, rechazo: 0, reconquista: 0, chicos: 0 });
  p.amor.personas.fotografa = f('separados', 20);
  p.amor.personas.veterinaria = f('casados', 40);
  p.amor.conyuge = 'veterinaria';
  p.amor.convivencia = { con: 'veterinaria', donde: 'refugio', desde: 40 };
  p.amor.hijos = [{ id: 'hijo-1', nombre: 'Clara', sexo: 'nena', nacio: 10, madre: 'fotografa', guia: null }, { id: 'hijo-2', nombre: 'Mateo', sexo: 'nene', nacio: 55, madre: 'veterinaria', guia: null }];
  const mu = AM.mundoAmor(p, { dia: 60, hora: 22 });
  const casaF = AM.casaDeElla('fotografa');
  eq(mu.cuartos.map((c) => [c.edificio, c.puntos]), [[casaF, ['cama-hijo-1']], ['refugio', ['cuna']]], 'amor: un cuarto en lo de cada madre (antes uno solo, en lo de la primera)');
  const vis = E.cuartosVisibles(mu);
  eq(vis.map((v) => [v.casa, v.camas, v.cuna]), [[casaF, [0], false], ['refugio', [], true]], 'escenas: la cama de Clara en lo de Sofía y la cuna de Mateo en el refugio');
  ok(E.cuartoVisible(mu)?.casa === casaF, 'escenas: cuartoVisible (el de siempre) sigue dando el primero');
  const mw = leer('src/amor-mundo.js');
  ok(mw.includes('const cuartos = new Map();') && mw.includes('cuarto.bebe.visible = bebesEnCuna.some((b) => b.casa === cuarto.casa);') && mw.includes('duenio: `${DUENIO}-cuarto-${vis.casa}`'), 'amor-mundo: arma un cuarto por casa, con su bebé y sus choques');
}
// ---------------------------------------------------------------- 4. amor: la cita cuando ella está con vos haciendo algo juntos
{
  const aldea = aldeaCompleta();
  const p = { dia: 30, horas: 10, entradas: {}, materiales: {}, cosas: {}, aldea, vecindad: {}, amor: AM.amorNuevo() };
  p.amor.personas.fotografa = { etapa: 'coqueteo', afecto: 40, desde: 20, contacto: 29, charla: 0, piropo: 0, flores: 0, carta: 0, leyo: null, citas: 0, ultimaCita: 0, enojo: 0, motivo: null, rechazo: 0, reconquista: 0, chicos: 0 };
  p.amor.cita = { clave: 'fotografa', lugar: 'plaza', dia: 30, desde: 15, hasta: 16.5, estado: 'acordada' };
  // ella en un picado con vos todo el rato: amor-juego.js anota `juntos` (antes, `ocupada`: «no pudo ir», otro compromiso)
  p.amor.cita.juntos = true;
  const v = AM.vencerCita(p, { dia: 30, hora: 17 });
  ok(v?.tipo === 'juntos' && p.amor.cita === null && p.amor.personas.fotografa.etapa === 'saliendo' && p.amor.personas.fotografa.citas === 1, 'amor: estuvo con vos el rato de la cita: la cita se hizo (y ahora salen)');
  eq([v.texto, v.sub], ['Ahora salís con Sofía', 'Pasaron juntos el rato de la cita'], 'amor: el aviso');
  ok(AM.sanearAmor({ personas: { fotografa: { etapa: 'coqueteo' } }, cita: { clave: 'fotografa', lugar: 'plaza', dia: 30, desde: 15, hasta: 16.5, juntos: true } }, 30).cita?.juntos === true, 'amor: se guarda');
  // con un amor-juego de verdad: ella con vos (conVos) a la hora: el aviso y la E empiezan la cita ahí mismo
  const { crearAmorJuego } = await import('../src/amor-juego.js');
  const q = { dia: 30, horas: 15, entradas: {}, materiales: {}, cosas: {}, aldea, vecindad: {}, amor: AM.amorNuevo() };
  q.amor.personas.fotografa = { ...p.amor.personas.fotografa, etapa: 'coqueteo', citas: 0 };
  q.amor.cita = { clave: 'fotografa', lugar: 'plaza', dia: 30, desde: 15, hasta: 16.5, estado: 'acordada' };
  q.amor.dia = 30;
  const npc = { clave: 'fotografa', claveAldea: 'fotografa', poblador: true, conVos: true, enCita: true, pos: { x: 0, z: 0, y: 0, set() {} } };
  const aj = crearAmorJuego({ progreso: () => q, ajustes: () => ({ romance: true }), npcDe: () => npc, jugador: () => ({ x: 0, z: 0 }), nota: () => {}, guardar: () => {} });
  aj.actualizar(1);
  ok(q.amor.cita?.juntos === true && !q.amor.cita.ocupada, 'amor-juego: con vos no está «ocupada», está con vos');
  const aviso = aj.textoAviso(npc), h = aj.hablar(npc);
  ok(aviso === 'Empezar la cita con Sofía' && h?.id === 'amor-cita' && q.amor.cita?.estado === 'en-curso', `amor-juego: el aviso y la E, la misma cosa: empezar la cita ahí mismo (${aviso})`);
  h.alTerminar();
  ok(q.amor.cita === null && q.amor.personas.fotografa.etapa === 'saliendo', 'amor-juego: y cuenta');
  sinCR('src/amor-juego.js');
}

// ---------------------------------------------------------------- 5. vecinos: el deseo «una mano» sólo si se la diste
{
  const V = await import('../src/vecindad.js');
  const VJ = await import('../src/vecindad-juego.js');
  const p = { dia: 4, horas: 12, vecindad: V.vecindadNueva(), cosas: {}, materiales: {}, entradas: {}, aldea: aldeaCompleta() };
  const vj = VJ.crearVecindadJuego({ progreso: () => p, desafio: () => false, guardar() {}, nota() {} });
  const anselmo = { clave: 'aldea-herrero', claveAldea: 'herrero', nombre: 'Anselmo', pos: { x: 0, z: 0 } };
  const pide = V.ayudas('herrero', p, 4).find((a) => a.pide);
  ok(!!pide, 'hay una ayuda de Anselmo que pide algo');
  let s = vj.abrir(anselmo);
  vj.elegir(s, 'ayudar', anselmo);
  const r = vj.elegir(s, `ayudar:${pide.id}`, anselmo);
  ok(r.tipo === 'renglones' && r.ayudo === false, 'vecindad-juego: sin lo que pide, no ayudaste (`ayudo`: falso)');
  p.materiales[pide.pide.k] = pide.pide.n; p.cosas[pide.pide.k] = pide.pide.n; p.entradas[pide.pide.k] = { dia: 1, hora: 9, cantidad: pide.pide.n };
  s = vj.abrir(anselmo);
  vj.elegir(s, 'ayudar', anselmo);
  ok(vj.elegir(s, `ayudar:${pide.id}`, anselmo).ayudo === true, 'vecindad-juego: con lo que pide, sí');
  ok(leer('src/main.js').includes("/^ayudar:/.test(elegido) && r.ayudo ? { tipo: 'ayudar' }"), 'main: el deseo «una mano» se cumple sólo si de verdad la diste (antes, con «no tenés» también)');
}

// ---------------------------------------------------------------- 6. el picado: amistad una vez por día y sólo si se jugó
{
  const R = await import('../src/rincones.js');
  const r = R.sanearRincones({}, 10);
  ok(!R.amistadDelPicado(r, 10, false, 3), 'picado: armarlo y alejarte enseguida no da amistad');
  ok(R.amistadDelPicado(r, 10, true, 20) && !R.amistadDelPicado(r, 10, true, 90), 'picado: a los goles, sí; el segundo del día, no (antes +3 sin fin)');
  ok(R.amistadDelPicado(r, 11, false, R.PICADO.jugado) && R.sanearRincones(r, 11).futbol.amistad === 11, 'picado: al otro día, después de jugar un rato, sí; y se guarda');
  const j = leer('src/rincones-juego.js');
  ok(j.includes('const cuenta = amistadDelPicado(r(), dia(), !motivo, partido.t);') && j.includes('if (cuenta) amistad(j.clave, 3);') && j.includes('if (!jugado) continue;'), 'rincones-juego: la amistad y el deseo de la pelota, sólo así');
}

// ---------------------------------------------------------------- 7. vecinos: las gracias de un deseo, sin «{nombre}» suelto
{
  const S = await import('../src/vecindad-social.js');
  const V = await import('../src/vecindad.js');
  const nueva = (d) => ({ dia: d, horas: 11, cosas: {}, materiales: {}, entradas: {}, aldea: aldeaCompleta(), vecindad: V.vecindadNueva(), amor: AM.amorNuevo() });
  let d = 1;
  while (d < 200 && S.deseoDe('jefe', nueva(d), d)?.id !== 'trucha-ahumada') d++;
  ok(d < 200, 'Ernesto quiere trucha ahumada algún día');
  const con = S.cumplirDeseo('jefe', nueva(d), { tipo: 'regalo', k: 'trucha-ahumada' }, d, { nombre: 'Pancho' });
  const sin = S.cumplirDeseo('jefe', nueva(d), { tipo: 'regalo', k: 'trucha-ahumada' }, d, {});
  ok(con?.renglon.endsWith('Gracias, Pancho.') && sin?.renglon.endsWith('Gracias.') && !/\{/.test(con.renglon + sin.renglon), `vecinos: «Gracias, Pancho.» o «Gracias.» (salía «Gracias, {nombre}.»): ${sin?.renglon}`);
}

// ---------------------------------------------------------------- 8. vecinos: los chismes, de los que viven en la aldea y sin género
{
  const S = await import('../src/vecindad-social.js');
  const V = await import('../src/vecindad.js');
  const SV = await import('../src/vecindad-social-voces.js');
  const vacia = AL.sanearAldea(AL.aldeaNueva());
  const presentes = new Set(AL.ORDEN_PERSONAS_ALDEA.filter((k) => AL.esVecinoAldea(k)).map((k) => AL.personaAldea(k)?.nombreCorto || k));
  let chismes = 0, ajenos = 0;
  for (let d = 1; d <= 60; d++) for (const quien of ['abuela', 'nelida', 'ercilia', 'madre', 'telegrafista']) {
    const p = { dia: d, horas: 11, cosas: {}, materiales: {}, entradas: {}, aldea: JSON.parse(JSON.stringify(vacia)), vecindad: V.vecindadNueva(), amor: AM.amorNuevo() };
    p.vecindad.personas[quien] = { ...(p.vecindad.personas[quien] || {}), p: 80 };
    for (let s = 0; s < 6; s++) {
      const r = S.iniciativa(quien, p, { dia: d, hora: 9 + s, ritmo: 'animado', semilla: s, ahora: d * 24 + 9 + s * 30 });
      if (r?.tipo !== 'chisme') continue;
      chismes++;
      for (const k of AL.ORDEN_POBLADORES_ALDEA) { const nom = V.nombreCorto(k); if (nom && !presentes.has(nom) && r.renglones[0]?.includes(nom)) ajenos++; }
    }
  }
  ok(chismes > 0 && ajenos === 0, `vecinos: con la aldea vacía, los chismes no nombran pobladores que no llegaron (${chismes} chismes, ${ajenos} con alguien que no está)`);
  ok(!SV.FRASES_SOCIAL.chismes.some((t) => /dormido|ranchera solo|Ninguno de los dos/.test(t)), 'vecinos: los chismes sin «dormido», «solo», «ninguno» (salía «Julia se quedó dormido»)');
  sinCR('src/vecindad-social.js');
}

// ---------------------------------------------------------------- 9. vecinos: la iniciativa no se traba con el más cercano
{
  const S = await import('../src/vecindad-social.js');
  const V = await import('../src/vecindad.js');
  const { crearSocialJuego } = await import('../src/social-juego.js');
  const { claveVecindad } = await import('../src/vecindad-juego.js');
  const npc = (claveAldea, clave, x) => ({ claveAldea, clave, pos: { x, z: 0, y: 0 }, g: { visible: true } });
  const prog = (vino = null) => {
    const p = { dia: 5, horas: 12, cosas: {}, materiales: {}, entradas: {}, vecindad: V.vecindadNueva(), amor: AM.amorNuevo() };
    for (let d = 1; d <= 16; d++) V.regalar('panadera', V.PERFILES_VECINOS.panadera.gustos.encanta[d % 3], p, d, () => 99);
    if (vino) { p.vecindad.social = S.socialNuevo(); p.vecindad.social.dia = 5; p.vecindad.social.vino = vino; }
    return p;
  };
  const vienen = (gente, p) => { let n = 0; for (let s = 0; s < 30; s++) { const sj = crearSocialJuego({ social: { ...S }, progreso: () => p(), dia: () => 5, hora: () => 12, ritmo: () => 'animado', jugador: () => ({ x: 0, z: 0 }), gente: () => gente.map((g) => ({ ...g, pos: { ...g.pos } })), claveDe: claveVecindad }); if (sj.forzarIniciativa()) n++; } return n; };
  ok(vienen([npc('panadera', 'poblador-panadera', 6), npc('familia', 'familia-madre', 4)], () => prog()) === 30, 'vecinos: con tu familia de visita más cerca, Rosa igual te viene a buscar (antes, nunca)');
  ok(vienen([npc('panadera', 'poblador-panadera', 6), npc('carpintero', 'poblador-carpintero', 4)], () => prog({ carpintero: 5 })) === 30, 'vecinos: con el que ya vino hoy más cerca, también');
  ok(S.podriaVenir('panadera', prog(), { dia: 5 }) && !S.podriaVenir('carpintero', prog({ carpintero: 5 }), { dia: 5 }), 'vecinos: podriaVenir');
}

// ---------------------------------------------------------------- 10. vecinos: «te quiere decir algo» con el concurso o la carta; las gracias
{
  const m = leer('src/main.js');
  ok(m.includes('const ini = deNoticias && !desafio ? socialJuego?.tomarIniciativa(npc) : null;') && m.includes('partes: ini ? [...ini.renglones, ...h.partes] : h.partes'), 'main: el que te vino a buscar y tiene concurso, carta o club: la E dice primero lo que te quería decir (como el aviso)');
  ok(m.includes("const gracias = socialJuego?.cumplir(npc, null);\n  charla.historia = { id: 'social-iniciativa', partes: gracias ? [...ini.renglones, gracias] : ini.renglones"), 'main: el que te vino a buscar también te agradece el deseo cumplido');
}

console.log(`verificar-3-8-6-aldea: ${n} comprobaciones OK`);
