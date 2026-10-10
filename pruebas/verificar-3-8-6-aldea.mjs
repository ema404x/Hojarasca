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

// ---------------------------------------------------------------- 11. fiestas: la mesita y el fogón sin el reloj ×40; el rival quieto; la taba
{
  const m = leer('src/main.js'), j = leer('src/fiestas-juego.js');
  ok(m.includes('!mecanicasAldea?.sinApuro() && !fiestasJuego?.sinApuro() ? 40 : 1;') && j.includes('const sinApuro = () => !!panel || oyendoLeyenda;') && j.includes('oyendoLeyenda = visto.leyenda.i < ley.partes.length;'), 'fiestas: sentado jugando o oyendo la leyenda, el reloj no corre ×40 (el partido se cortaba y la leyenda no se oía)');
  ok(j.includes('if (n !== quieto) { soltarRival(); if (n && !n.conVos) { n.conVos = true; quieto = n; } }') && j.includes('    soltarRival();   // 3.8.6\n    panel = null;'), 'fiestas: el rival de la mesita se queda sentado mientras dure el partido (y se suelta al cerrar)');
  ok(j.includes("texto: r ? `Tirar la taba con ${r.nombre}` : 'La taba: no hay con quién tirar', hacer: () => abrirTaba(r)") && j.includes("const mario = sirve('padre');"), 'fiestas: la taba, con Mario si está (o con quien esté en la cancha); el aviso y la E, con el mismo');
}
// ---------------------------------------------------------------- 12. fiestas: la amistad de la mesita y del baile, una vez por día y guardada
{
  const F = await import('../src/fiestas.js');
  const e = F.fiestasNuevas();
  ok(F.amistadDeHoy(e, 'mesa:jefe', 9) && !F.amistadDeHoy(e, 'mesa:jefe', 9) && F.amistadDeHoy(e, 'mesa:padre', 9), 'fiestas: la mesita da amistad una vez por día con cada uno (antes, sin tope: +3 por truco perdido)');
  ok(!F.amistadDeHoy(F.sanearFiestas(JSON.parse(JSON.stringify(e)), 9), 'mesa:jefe', 9), 'fiestas: guardado (recargando no vuelve a dar)');
  ok(F.amistadDeHoy(F.sanearFiestas(JSON.parse(JSON.stringify(e)), 10), 'mesa:jefe', 10), 'fiestas: al otro día, otra vez');
  ok(F.amistadDeHoy(e, 'baile', 9) && !F.amistadDeHoy(F.sanearFiestas(JSON.parse(JSON.stringify(e)), 9), 'baile', 9), 'fiestas: la del baile también se guarda (vivía en memoria)');
  const j = leer('src/fiestas-juego.js');
  ok(j.includes("if (panel?.rival?.clave && amistadDeHoy(estado(), `mesa:${panel.rival.clave}`, dia())) ctx.sumarAmistad?.(panel.rival.clave, gano ? 2 : 3);"), 'fiestas-juego: la mesita usa amistadDeHoy');
  sinCR('src/fiestas-juego.js'); sinCR('src/fiestas.js');
}

// ---------------------------------------------------------------- 13. el diario de hoy sin cortar, «Cortaste» y Nélida a las 16:59
{
  const D = await import('../src/diario.js');
  const largo = 'Nicanor se torció el tobillo en el puente y Josefina te pidió que le hicieras compañía un rato, charlando de truchas para que no pensara en el dolor.';
  const v = D.sanearDiarioHoy({ dia: 5, pagina: { ...D.paginaNueva?.(), eventos: [largo] } }, 5);
  ok(largo.length > 120 && v?.pagina?.eventos?.[0] === largo, 'diario: la página de hoy guardada no corta los textos largos a 120 letras');
  const j = leer('src/fiestas-juego.js');
  ok(j.includes("`${ro.corto === 0 ? 'Cortaste' : `Cortó ${quien}`}: vos sumás") && !j.includes("Cortó ${ro.corto === 0 ? 'vos'"), 'chinchón: «Cortaste» (decía «Cortó vos»)');
  const c = leer('src/concursos-juego.js');
  ok(c.includes('if (!inscribir(estado(), id, entrada, d, h)) { ctx.nota(`No llegaste al ${minus(c.nombre)}`'), 'concursos: te anota con la hora en que le hablaste, y si no se pudo te lo dice');
}

// ---------------------------------------------------------------- 14. aldea: los cumpleaños (sábado de baile, el jefe, los avisos y los textos)
{
  const VI = await import('../src/aldea-vida.js');
  const a = aldeaCompleta();
  a.cercanos = AL.ORDEN_PERSONAS_ALDEA.slice();   // (los cercanos festejan)
  // un sábado con un cumpleaños festejado y el salón abierto
  let d = 1;
  while (d < 400 && !(AL.diaSemanaDe(d) === 5 && AL.fiestaDeCumple(d, a)?.claves.includes('jefe'))) d++;
  ok(d < 400, 'hay un sábado en que festeja Ernesto');
  const f = AL.fiestaDeCumple(d, a);
  const r1 = AL.rutinaAldea('jefe', 18.6, 5, a, d), r2 = AL.rutinaAldea(f.claves.find((k) => k !== 'jefe') || 'jefe', 19.5, 5, a, d);
  ok(r1.lugar === 'fiesta' && r2.lugar === 'fiesta', `aldea: el sábado de baile la fiesta de cumpleaños pasa (antes, el baile y la vuelta a casa; y el jefe arriando la bandera): ${r1.lugar}, ${r2.lugar}`);
  // el aviso del día antes: sólo los que festejan de verdad
  const b = AL.aldeaNueva(); b.pobladores = AL.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 })); const bs = AL.sanearAldea(b); bs.cercanos = AL.ORDEN_PERSONAS_ALDEA.slice();   // (sin locales abiertos)
  let malos = 0;
  for (let x = 1; x <= 48; x++) {
    const av = VI.avisoDiaAntes(x, { aldea: bs, fiestas: VI.FIESTAS_ALDEA });
    if (!av || /Mañana la abuela/.test(av.titulo)) continue;
    const fi = AL.fiestaDeCumple(x + 1, bs);
    for (const k of AL.ORDEN_PERSONAS_ALDEA) if (AL.esCumpleanos(k, x + 1) && av.titulo.includes(V2nombre(k)) && !fi?.claves.includes(k)) malos++;
  }
  function V2nombre(k) { return VI.nombreCortoDe(k) || k; }
  ok(malos === 0, `aldea: el aviso del día antes no anuncia la fiesta de quien no festeja (sin su local abierto, o estudiando afuera): ${malos}`);
  eq(VI.lugarConArticulo('casa-te'), 'la casa de té', 'aldea: «la casa de té» (decía «casa de Té»)');
  ok(VI.lugarConArticulo('casa-familia') === 'la casa de los Jones', 'aldea: y los que ya tienen artículo, igual');
  ok(leer('src/aldea-vida.js').includes("Mañana ${manana.length > 1 ? 'cumplen' : 'cumple'} años"), 'aldea: la carta, «Mañana cumplen años A, B y C»');
  ok(leer('src/aldea-gente.js').includes("Un regalo que ${varios ? 'les' : 'le'} guste vale el doble."), 'aldea: el cuaderno de hoy, «les guste» con varios y «A, B y C»');
}

// ---------------------------------------------------------------- 15. aldea: el visitante, el club, el músico, el cachorro y el desalojo
{
  const VI = await import('../src/aldea-vida.js');
  const C = await import('../src/calendario.js');
  // el que llegó con vos pasada la medianoche sigue (dando las gracias) y se guarda
  const vis = { id: 'lena', lugar: Object.keys(VI.LUGARES_VISITA)[0], dia: 7, estado: 'llego' };
  ok(VI.visitanteSigue(vis, 8, 0.5) && !VI.visitanteSigue(vis, 9, 10), 'aldea: el visitante que llegó con vos pasada la medianoche no se desvanece (hasta el día siguiente)');
  const s = VI.sanearVidaAldea({ visitante: { ...vis } }, 8);
  ok(s.visitante?.estado === 'llego', 'aldea: y al cargar, tampoco');
  ok(leer('src/aldea-vida.js').includes("((visitante.estado === 'guiando' || visitante.estado === 'llego') && visitante.dia === tope - 1)"), 'aldea: el saneo deja al que llegó ayer');
  ok(leer('src/aldea-gente.js').includes('if (js.enKayak || js.enVela || js.enTren) { n.camino = []; return; }'), 'aldea: en el kayak, el velero o el tren, el que guiás te espera (caminaba por el fondo del lago)');
  // el chico que estudia afuera no va al club ni a la noche de estrellas
  const a = aldeaCompleta();
  const chico = AL.CHICOS_ALDEA.find((k) => k !== 'nene' && k !== 'nena') || AL.CHICOS_ALDEA[0];
  a.chicos = { ...(a.chicos || {}), [chico]: { ...(a.chicos?.[chico] || {}), afuera: true } };
  let vino = 0;
  for (let d = 1; d <= 200; d += 7) for (const cual of ['club', 'estrellas']) if (C.asistentes(cual, d, a).includes(chico)) vino++;
  ok(AL.chicoAfuera(a, chico) && vino === 0, `aldea: el chico que estudia afuera no aparece en el club ni en la noche de estrellas (${chico}: ${vino})`);
  // el músico, en el salón
  const mu = AL.POBLADORES_ALDEA.musico;
  ok(!/en la plaza/.test(mu.despedida + mu.resumen) && /salón/.test(mu.despedida), 'aldea: el músico manda al salón (decía «en la plaza»)');
  ok(leer('src/aldea-gente.js').includes("if (k === 'jefe' && !npc.deVisita) {"), 'aldea: Ernesto de visita en tu mesa no gasta la oferta del cachorro');
  ok(leer('src/main.js').includes('if (desalojo.acopio) desalojo.acopio = !!vaciarUltimoAcopio(desalojo.materiales || (desalojo.materiales = {}));'), 'desalojo: «con lo que guardabas en el acopio» sólo si volvió algo');
  sinCR('src/aldea.js'); sinCR('src/aldea-vida.js'); sinCR('src/aldea-gente.js'); sinCR('src/calendario.js');
}

// ---------------------------------------------------------------- 16. fiestas: la monta cuenta desde que salís
{
  const F = await import('../src/fiestas.js');
  const e = F.fiestasNuevas();
  F.empezarMonta(e, 12);
  ok(!F.puedeMontar(F.sanearFiestas(JSON.parse(JSON.stringify(e)), 12), 12), 'fiestas: cerrando a mitad de la monta, ese día no se vuelve a montar (se repetía la tirada)');
  ok(leer('src/fiestas-juego.js').includes('    empezarMonta(estado(), dia());   // 3.8.6: una por fiesta, aunque cierres a la mitad\n    ctx.guardar?.();'), 'fiestas-juego: la anota al salir y guarda');
}

// ================================================================ las decisiones del usuario sobre este pase
// ---------------------------------------------------------------- 17. el visitante que guiás: «Hasta acá»
{
  const VI = await import('../src/aldea-vida.js');
  const vida = { visitante: { id: 'lena', lugar: 'mirador', dia: 7, estado: 'anden' } };
  ok(!VI.despedirVisitante(vida), 'visitante: en el andén no hay «Hasta acá»');
  VI.empezarGuia(vida);
  const tx = VI.textosVisitante(vida.visitante);
  ok(tx.seguirGuia === 'E: seguimos · Escape: hasta acá' && /Me vuelvo a la estación/.test(tx.chau) && !/\{|undefined/.test(tx.chau), 'visitante: dice lo que hace Escape y se despide lindo');
  ok(VI.despedirVisitante(vida) && vida.visitante.estado === 'vuelve' && VI.visitanteSigue(vida.visitante, 7, 15), 'visitante: «Hasta acá»: vuelve a la estación (sigue en el valle mientras camina)');
  ok(!(vida.guiados || []).length, 'visitante: despedido, no cuenta como guiado');
  ok(VI.sanearVidaAldea({ visitante: { ...vida.visitante } }, 7).visitante === null, 'visitante: el que volvía a la estación, al cargar, ya se fue');
  const g = leer('src/aldea-gente.js'), m = leer('src/main.js');
  ok(g.includes("if (v.estado === 'guiando') return { id: 'visitante', partes: [tx.yendo], seguir: tx.seguirGuia, tipo: 'llegada', alEscape: () => despedir(npc) };") && g.includes("if (vis.estado === 'vuelve') {"), 'aldea-gente: la charla del que te sigue ofrece «Hasta acá» y después camina a la estación');
  ok(m.includes('if (!charla.menu && charla.historia?.alEscape && charla.parte >= charla.historia.partes.length - 1) { const f = charla.historia.alEscape; charla.historia = null; cerrarCharla(); f(); return; }'), 'main: Escape en el último renglón elige «Hasta acá» (alejarse no lo despide)');
}
// ---------------------------------------------------------------- 18. la cita: tomando algo con vos, cuenta como «con vos»
{
  const { crearAmorJuego } = await import('../src/amor-juego.js');
  const q = { dia: 30, horas: 15, entradas: {}, materiales: {}, cosas: {}, aldea: aldeaCompleta(), vecindad: {}, amor: AM.amorNuevo() };
  q.amor.personas.fotografa = { etapa: 'saliendo', afecto: 40, desde: 20, contacto: 29, charla: 0, piropo: 0, flores: 0, carta: 0, leyo: null, citas: 1, ultimaCita: 0, enojo: 0, motivo: null, rechazo: 0, reconquista: 0, chicos: 0 };
  q.amor.cita = { clave: 'fotografa', lugar: 'plaza', dia: 30, desde: 15, hasta: 16.5, estado: 'acordada' };
  q.amor.dia = 30;
  const npc = { clave: 'fotografa', claveAldea: 'fotografa', enCita: true, pos: { x: 0, z: 0, y: 0, set() {} } };
  const aj = crearAmorJuego({ progreso: () => q, ajustes: () => ({ romance: true }), npcDe: () => npc, tomandoAlgo: (n) => n === npc, jugador: () => ({ x: 0, z: 0 }), nota: () => {}, guardar: () => {} });
  aj.actualizar(1);
  ok(q.amor.cita?.juntos === true && !q.amor.cita.ocupada && !aj.puesta(), 'cita: invitada a tomar algo con vos, está con vos (no «ocupada») y no se va a esperarte a la plaza');
  npc.enCita = false;   // (terminó el mate)
  aj.actualizar(1);
  ok(!aj.puesta() && !q.amor.cita.espero, 'cita: ya pasaron el rato juntos: no sale después a esperarte');
  q.horas = 17;
  aj.actualizar(1);
  ok(q.amor.cita === null && q.amor.personas.fotografa.citas === 2 && !q.amor.personas.fotografa.motivo, 'cita: al terminar la hora cuenta como hecha (antes «no pudo ir»)');
}

// ---------------------------------------------------------------- 19. fiestas: sentado en la fiesta no se apura el reloj; el concurso no se lleva a nadie
{
  const j = leer('src/fiestas-juego.js');
  ok(j.includes('const sinApuro = () => !!panel || oyendoLeyenda || sentadoEnFiesta;') && j.includes('sentadoEnFiesta = !!js?.sentado && (enPredio || !!ctx.enLaPlaza?.(js.pos));') && j.includes('    sentadoEnFiesta = false;\n'), 'fiestas: sentado en la mesa larga o en un banco del baile, con la fiesta en curso, el reloj no corre ×40 (la sobremesa duraba 5 s)');
  const { crearConcursosJuego } = await import('../src/concursos-juego.js');
  let enFiesta = false;
  const prog = { dia: 6, horas: 16.5, aldea: { descubierta: 1, pobladores: [] }, entradas: {}, cosas: {}, cocina: { hechas: {} }, desafios: {} };
  const J = crearConcursosJuego({ progreso: () => prog, desafio: () => false, nota: () => {}, guardar: () => {}, cobrar: () => {}, fiestaEnCurso: () => enFiesta });
  ok(J.deHoy() && J.destinos().size > 1, 'concurso: sin fiesta, a las 16:30 el jurado y los que compiten van a la plaza (como siempre)');
  enFiesta = true;
  ok(J.destinos().size === 0, 'concurso: con la fiesta en curso nadie se va de la fiesta (el predio quedaba vacío y el rival de la mesita se levantaba)');
  ok(leer('src/main.js').includes('fiestaEnCurso: () => !!fiestasJuego?.ahora?.(),'), 'main: el concurso sabe si hay fiesta');
}

console.log(`verificar-3-8-6-aldea: ${n} comprobaciones OK`);
