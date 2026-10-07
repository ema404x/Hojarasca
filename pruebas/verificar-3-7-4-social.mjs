// 3.7.4 "Vida social tipo Sims" (PLAN_3_7.md): las reglas y los textos, sin Electron (src/vecindad-social.js,
// src/vecindad-social-voces.js, y lo que se engancha en vecindad.js, amor.js y guardado.js).
//  · el contrato que usa el equipo de lo visual (INTERACCIONES, CATEGORIAS_RUEDA, opcionesRueda, probarInteraccion,
//    relacionDe, humorDe, deseoDe/cumplirDeseo, iniciativa, entreVecinos), con sus animaciones e íconos;
//  · el éxito según el humor, la relación y la forma de ser; lo amable nunca sale mal con un compadre; lo picante
//    baja la amistad y se arregla pidiendo perdón;
//  · nunca romance con chicos, casados ni Pocha (ni con el ajuste apagado, ni con un guardado retocado);
//  · las barras (amistad y romance de 0 a 100), los deseos, la iniciativa con el ritmo de la aldea, lo que pasa
//    entre vecinos, nada religioso ni de economía, el saneador y el determinismo con semilla.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as S from '../src/vecindad-social.js';
import * as SV from '../src/vecindad-social-voces.js';
import * as V from '../src/vecindad.js';
import * as VZ from '../src/vecindad-voces.js';
import * as A from '../src/aldea.js';
import * as M from '../src/amor.js';
import * as AV from '../src/aldea-vida.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const copia = (x) => JSON.parse(JSON.stringify(x));
const PERSONAS = V.PERSONAS_VECINDAD;
const aldeaCompleta = () => {
  const a = A.aldeaNueva();
  a.pobladores = A.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 }));
  a.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
  return A.sanearAldea(a);
};
const ALDEA = aldeaCompleta();
const partida = (extra = {}) => ({ dia: 3, horas: 11, cosas: { yerba: 5 }, materiales: {}, entradas: {}, aldea: copia(ALDEA), vecindad: V.vecindadNueva(), amor: M.amorNuevo(), ...extra });
// sube la amistad con las reglas de siempre (regalos que le encantan, un día cada uno)
const amistar = (p, k, dias) => { for (let d = 1; d <= dias; d++) V.regalar(k, V.PERFILES_VECINOS[k].gustos.encanta[d % 3], p, d, () => 99); };
const compadre = (p, k) => amistar(p, k, 16);
const amigo = (p, k) => amistar(p, k, 6);
const NO_CANDIDATAS = PERSONAS.filter((k) => !M.esCandidata(k));

// ---------------------------------------------------------------- el contrato
{
  const cats = ['amistosa', 'graciosa', 'picante', 'romantica', 'juntos', 'charla', 'ayuda'];
  eq(S.CATEGORIAS_RUEDA.map((c) => c.id), ['charla', 'amistosa', 'graciosa', 'juntos', 'ayuda', 'romantica', 'picante'], 'el orden de la rueda');
  eq(S.CATEGORIAS_RUEDA.map((c) => c.nombre), ['Charlar', 'Amistosas', 'Graciosas', 'Juntos', 'Regalar y ayudar', 'Románticas', 'Picantes'], 'los nombres de la rueda');
  const ids = Object.keys(S.INTERACCIONES);
  ok(ids.length === 30, `hay 30 interacciones propias (${ids.length})`);
  for (const [id, x] of Object.entries(S.INTERACCIONES)) {
    ok(cats.includes(x.categoria), `${id}: categoría válida`);
    ok(typeof x.nombre === 'string' && x.nombre.length > 3 && typeof x.icono === 'string', `${id}: nombre e ícono`);
    ok(S.ANIM_JUGADOR.includes(x.anim.yo) && S.ANIM_VECINO.includes(x.anim.el), `${id}: animaciones del contrato`);
    ok(x.mal.every((a) => S.ANIM_VECINO.includes(a)), `${id}: animaciones de cuando sale mal`);
    ok(S.ICONOS.includes(x.icono), `${id}: el ícono está en ICONOS`);
    ok(x.duracion > 0 && x.duracion <= 60 && x.veces >= 1, `${id}: duración y veces`);
    ok(/^[a-z-]+$/.test(id), `${id}: sin ñ ni mayúsculas`);
  }
  // las del plan, cada una en su categoría
  const del = (cat) => ids.filter((id) => S.INTERACCIONES[id].categoria === cat);
  eq(del('amistosa'), ['saludar', 'abrazo', 'chocar', 'felicitar', 'consolar', 'tiempo', 'gustos', 'perdon'], 'las amistosas');
  eq(del('graciosa'), ['chiste', 'broma', 'adivinanza', 'cuento', 'morisqueta'], 'las graciosas');
  eq(del('picante'), ['discutir', 'burlarse', 'quejarse', 'ignorar'], 'las picantes');
  eq(del('romantica'), ['piropo', 'susurrar', 'abrazo-largo', 'mano', 'bailar-lento', 'beso'], 'las románticas');
  eq(del('juntos'), ['mate', 'cartas', 'pescar', 'caminar', 'foto', 'pelota', 'ranchera'], 'las de hacer juntos');
  ok(S.INTERACCIONES.chiste.nombre === 'Contar un chiste' && S.INTERACCIONES.cartas.nombre === 'Jugar un truco' && S.INTERACCIONES.perdon.nombre === 'Pedir perdón', 'los nombres, con texto exacto');
  // la rueda de siempre: lo de la charla (de vecindad-juego.js) va en su categoría con `de: 'charla'`
  const p = partida();
  const menu = [{ id: 'servicio', titulo: '¿Qué tenés para hoy?' }, { id: 'como-andas', titulo: '¿Cómo andás?' }, { id: 'novedades', titulo: 'Novedades' }, { id: 'historia', titulo: 'Tu historia' },
    { id: 'regalar', titulo: 'Regalar…' }, { id: 'invitar', titulo: 'Invitar a tomar algo…' }, { id: 'ayudar', titulo: 'Dar una mano…' }, { id: 'amor', titulo: 'Coquetear…' }, { id: 'cocina', titulo: 'Para la cocina…' }, { id: 'chau', titulo: 'Nada más, chau' }];
  const r = S.opcionesRueda('botera', p, { menu });
  ok(Array.isArray(r) && r.every((g) => typeof g.categoria === 'string' && typeof g.nombre === 'string' && Array.isArray(g.opciones) && g.opciones.length), 'opcionesRueda: grupos con opciones');
  ok(r.every((g) => g.opciones.every((o) => typeof o.id === 'string' && typeof o.nombre === 'string' && typeof o.icono === 'string' && typeof o.disponible === 'boolean' && (o.disponible || typeof o.motivo === 'string' || o.de === 'charla'))), 'cada opción: id, nombre, ícono, disponible y, si no, el motivo');
  const g = Object.fromEntries(r.map((x) => [x.categoria, x.opciones]));
  eq(g.charla.map((o) => o.id), ['como-andas', 'novedades', 'historia'], 'charla: los temas');
  ok(['servicio', 'regalar', 'ayudar', 'cocina'].every((id) => g.ayuda.some((o) => o.id === id && o.de === 'charla')), 'regalar y ayudar: el servicio, regalar, dar una mano y la cocina');
  ok(g.juntos[0].id === 'invitar' && g.juntos[0].de === 'charla' && g.juntos.some((o) => o.id === 'mate' && o.de === 'social'), 'juntos: invitar a tomar algo y lo de ahí mismo');
  ok(g.romantica[0].id === 'amor' && g.romantica.some((o) => o.id === 'piropo'), 'románticas: lo de la 3.7.1 y lo nuevo');
  ok(!r.some((x) => x.opciones.some((o) => o.id === 'chau')), 'la rueda no tiene «chau» (se cierra sola)');
  eq(S.opcionesRueda('botera', p, { desafio: true }), [], 'en el Desafío no hay rueda');
  eq(S.opcionesRueda('nadie', p, {}), [], 'con alguien que no es vecino, nada');
  // los motivos, con texto exacto
  const sinYerba = S.opcionesRueda('jefe', partida({ cosas: {} }), {}).find((x) => x.categoria === 'juntos').opciones.find((o) => o.id === 'mate');
  ok(sinYerba && !sinYerba.disponible && sinYerba.motivo === 'No tenés yerba encima.', 'sin yerba, el mate está gris (texto exacto)');
  const galesa = S.opcionesRueda('galesa', p, {}).find((x) => x.categoria === 'juntos').opciones.find((o) => o.id === 'mate');
  ok(galesa && !galesa.disponible && galesa.motivo === 'No toma mate.', 'Ceinwen no toma mate');
  ok(!S.opcionesRueda('nene', p, {}).some((x) => x.opciones.some((o) => o.id === 'mate')), 'a los chicos ni se les ofrece mate');
  const noche = S.opcionesRueda('jefe', partida({ horas: 23.5 }), {}).find((x) => x.categoria === 'juntos').opciones.find((o) => o.id === 'pescar');
  ok(noche && !noche.disponible && noche.motivo === 'A esta hora, ya no.', 'de noche no se va a pescar');
  ok(!S.opcionesRueda('jefe', p, {}).some((x) => x.opciones.some((o) => o.id === 'perdon' || o.id === 'consolar')), 'pedir perdón y consolar sólo aparecen cuando hacen falta');
  // probarInteraccion: la forma de lo que devuelve
  const x = S.probarInteraccion('jefe', 'chiste', p, { semilla: 3 });
  ok(typeof x.exito === 'boolean' && typeof x.reaccion.renglon === 'string' && x.reaccion.renglon.length > 5 && S.ANIM_VECINO.includes(x.reaccion.animEl)
    && S.EMOCIONES.includes(x.reaccion.emocion) && S.ICONOS.includes(x.reaccion.burbuja), 'probarInteraccion: la reacción completa');
  ok(['amistad', 'romance', 'humor'].every((k) => Number.isFinite(x.efectos[k])) && Array.isArray(x.efectos.otros) && Array.isArray(x.efectos.cosas) && typeof x.relacion.amistad === 'number', 'probarInteraccion: los efectos y la relación');
  const raro = S.probarInteraccion('jefe', 'volar', p, {});
  ok(raro.exito === false && raro.motivo === 'no-se', 'una interacción que no existe, no');
  // el mate gasta yerba (como al regalar: se aplica con aplicarEfectos) y engancha con el mate de siempre
  const pm = partida(); compadre(pm, 'jefe');
  const mt = S.probarInteraccion('jefe', 'mate', pm, { semilla: 1 });
  ok(mt.exito && mt.efectos.cosas.some((c) => c.tipo === 'cosa' && c.k === 'yerba' && c.n === -1) && mt.efectos.otros.some((o) => o.tipo === 'mate' && o.con === 'jefe'), 'el mate gasta una yerba y avisa al juego');
  const cr = S.probarInteraccion('jefe', 'cartas', pm, { semilla: 1 });
  ok(cr.exito && cr.efectos.otros.some((o) => o.tipo === 'cartas' && typeof o.gano === 'boolean'), 'el truco dice quién ganó');
  ok(S.probarInteraccion('jefe', 'cartas', pm, { semilla: 1 }).exito === false, 'el truco, uno por día con cada uno');
  for (const [id, tipo] of [['pescar', 'pesca'], ['caminar', 'caminar'], ['foto', 'foto']]) {
    const y = S.probarInteraccion('jefe', id, pm, { semilla: 1 });
    ok(y.exito && y.efectos.otros.some((o) => o.tipo === tipo && o.con === 'jefe'), `${id}: engancha con ${tipo}`);
  }
  const gu = S.probarInteraccion('jefe', 'gustos', pm, { semilla: 1 });
  ok(gu.exito && gu.efectos.otros.some((o) => o.tipo === 'gusto') && V.gustosConocidos('jefe', pm).length > 0, 'preguntarle qué le gusta lo anota en el cuaderno');
  ok(/me encanta\.$/.test(gu.reaccion.renglon), 'y te lo dice');
}

// ---------------------------------------------------------------- el éxito según el humor y la relación
{
  const tasa = (prep, k, id, extra = {}) => {
    let si = 0;
    for (let s = 0; s < 200; s++) { const p = partida(); prep(p); if (S.probarInteraccion(k, id, p, { semilla: s, ...extra }).exito) si++; }
    return si / 200;
  };
  const conocido = tasa(() => {}, 'carpintero', 'broma');
  const deAmigo = tasa((p) => amigo(p, 'carpintero'), 'carpintero', 'broma');
  ok(deAmigo > conocido + 0.05, `con un amigo sale mejor (${conocido} → ${deAmigo})`);
  eq(tasa((p) => compadre(p, 'carpintero'), 'carpintero', 'broma'), 1, 'lo amable nunca sale mal con un compadre');
  eq(tasa((p) => compadre(p, 'herrero'), 'herrero', 'abrazo'), 1, 'ni un abrazo con el compadre más solitario');
  // el humor: enojado (le hiciste pasar un mal rato hoy) baja la chance; contento la sube
  let dt = 1; while (S.humorDe('maestra', partida({ dia: dt }), dt, {}).humor !== 'tranquilo') dt++;
  const p0 = partida({ dia: dt });
  const base = S.chanceInteraccion('maestra', 'chiste', p0, {}).chance;
  const pe = partida({ dia: dt }); S.probarInteraccion('maestra', 'quejarse', pe, { semilla: 0 }); S.probarInteraccion('maestra', 'ignorar', pe, { semilla: 0 });
  ok(S.humorDe('maestra', pe, dt, {}).humor === 'enojado', 'después de lo picante, anda enojado');
  ok(S.chanceInteraccion('maestra', 'chiste', pe, {}).chance < base - 0.2, 'enojado, un chiste sale peor');
  const pc = partida({ dia: A.CUMPLES_ALDEA.maestra });
  ok(S.humorDe('maestra', pc, pc.dia, {}).humor === 'contento' && S.chanceInteraccion('maestra', 'chiste', pc, {}).chance > base, 'el día de su cumpleaños anda contento y responde mejor');
  // la forma de ser: a los chicos, una morisqueta; a la abuela, la pelota no
  ok(S.chanceInteraccion('nene', 'morisqueta', p0, {}).chance > S.chanceInteraccion('jefe', 'morisqueta', p0, {}).chance + 0.2, 'una morisqueta le cae mejor a Nahuel que a Ernesto');
  ok(S.chanceInteraccion('abuela', 'pelota', p0, {}).chance < S.chanceInteraccion('nene', 'pelota', p0, {}).chance - 0.4, 'la pelota, a Herminia no tanto');
  ok(S.chanceInteraccion('pescador', 'pescar', p0, {}).chance > S.chanceInteraccion('tejedora', 'pescar', p0, {}).chance, 'a pescar, mejor con Aurelio');
  // si ya lo hiciste hoy, baja la chance (y suma menos)
  const pr = partida(); amigo(pr, 'panadera');
  const c1 = S.chanceInteraccion('panadera', 'chiste', pr, {}).chance;
  S.probarInteraccion('panadera', 'chiste', pr, { semilla: 0 });
  ok(S.chanceInteraccion('panadera', 'chiste', pr, {}).chance < c1, 'el mismo chiste dos veces el mismo día, peor');
  // cuando sale mal: reacción graciosa y baja un poco
  let malo = null;
  for (let s = 0; s < 80 && !malo; s++) { const p = partida(); amigo(p, 'carpintero'); const antes = S.relacionDe('carpintero', p).amistad; const r = S.probarInteraccion('carpintero', 'broma', p, { semilla: s }); if (!r.exito) malo = { r, antes, despues: S.relacionDe('carpintero', p).amistad }; }
  ok(malo && malo.despues < malo.antes && malo.r.efectos.amistad < 0 && ['mirar-raro', 'cruzarse-brazos'].includes(malo.r.reaccion.animEl), 'una broma que sale mal: te mira raro y baja un poco');
  // la cachetada suave de mentira (un beso a destiempo)
  let cachetada = false;
  for (let s = 0; s < 60 && !cachetada; s++) {
    const p = partida(); amigo(p, 'pintora');
    p.amor.personas.pintora = { ...M.sanearAmor({ personas: { pintora: { etapa: 'saliendo', afecto: 20 } } }, 3).personas.pintora };
    const r = S.probarInteraccion('pintora', 'beso', p, { semilla: s });
    if (!r.exito && r.reaccion.animEl === 'cachetada-suave') cachetada = r.efectos.romance < 0;
  }
  ok(cachetada, 'un beso a destiempo: cachetada suave y baja el romance');
  // lo picante: baja la amistad, se ofende, y se arregla pidiendo perdón
  const pp = partida(); amigo(pp, 'telegrafista');
  const antes = S.relacionDe('telegrafista', pp).amistad;
  let r = null;
  for (let s = 0; s < 40; s++) { const q = copia(pp); const x = S.probarInteraccion('telegrafista', 'discutir', q, { semilla: s }); if (!x.exito) { r = x; Object.assign(pp, q); break; } }
  ok(r && r.efectos.amistad < 0 && S.relacionDe('telegrafista', pp).amistad < antes && r.reaccion.emocion === 'enojado', 'discutir baja la amistad');
  ok(S.humorDe('telegrafista', pp, 3, {}).causa === 'ofendido' && S.humorDe('telegrafista', pp, 3, {}).motivo === 'Le cayó mal lo que le hiciste.', 'queda ofendido (texto exacto)');
  const ruedaOf = S.opcionesRueda('telegrafista', pp, {});
  ok(ruedaOf.find((x) => x.categoria === 'amistosa').opciones.some((o) => o.id === 'perdon' && o.disponible), 'ahora sí aparece «Pedir perdón»');
  let perdono = false;
  for (let s = 0; s < 30 && !perdono; s++) { const q = copia(pp); if (S.probarInteraccion('telegrafista', 'perdon', q, { semilla: s }).exito) { perdono = S.humorDe('telegrafista', q, 3, {}).causa !== 'ofendido' && S.relacionDe('telegrafista', q).amistad > S.relacionDe('telegrafista', pp).amistad; } }
  ok(perdono, 'pedir perdón lo arregla (y devuelve amistad)');
  // se le pasa solo a los tres días
  ok(S.humorDe('telegrafista', { ...pp, dia: 6 }, 6, {}).causa !== 'ofendido', 'si no, se le pasa solo a los tres días');
  // el compadre puede tomárselo en broma
  let enBroma = 0;
  for (let s = 0; s < 100; s++) { const q = partida(); compadre(q, 'nicanor'); if (S.probarInteraccion('nicanor', 'burlarse', q, { semilla: s }).exito) enBroma++; }
  ok(enBroma > 20 && enBroma < 100, `el compadre a veces se lo toma en broma (${enBroma}/100)`);
  // tope de amistad por día con la rueda (los deseos y el perdón van aparte)
  const pt = partida(); amigo(pt, 'musico');
  const a0 = V.puntosAmistad('musico', pt);
  for (const id of ['saludar', 'abrazo', 'chocar', 'chiste', 'tiempo', 'cuento', 'caminar', 'foto', 'cartas']) S.probarInteraccion('musico', id, pt, { semilla: 0 });
  ok(V.puntosAmistad('musico', pt) - a0 <= S.SOCIAL.topeGanaDia, 'la rueda no regala amistad sin límite en un día');
}

// ---------------------------------------------------------------- nunca romance con chicos, casados ni Pocha
{
  const ROM = Object.keys(S.INTERACCIONES).filter((id) => S.INTERACCIONES[id].categoria === 'romantica');
  for (const k of NO_CANDIDATAS) {
    const p = partida(); compadre(p, k);
    const rueda = S.opcionesRueda(k, p, { menu: [{ id: 'amor', titulo: 'Coquetear…' }] });
    ok(!rueda.some((g) => g.categoria === 'romantica'), `${k}: la rueda no tiene nada romántico`);
    for (const id of ROM) {
      const r = S.probarInteraccion(k, id, p, { semilla: 1 });
      ok(r.exito === false && r.motivo === 'no-se-puede' && r.efectos.romance === 0 && !Object.keys(p.amor.personas).length, `${k}: ${id} no se puede`);
    }
    ok(S.relacionDe(k, p).nivelRomance === null && S.relacionDe(k, p).romance === 0, `${k}: sin barra de romance`);
  }
  for (const k of ['nene', 'nena', 'padre', 'madre', 'modista', 'herrero']) ok(NO_CANDIDATAS.includes(k), `${k} nunca es candidata`);
  // ni con un guardado retocado a mano
  const p = partida(); p.amor.personas.nene = { etapa: 'novios', afecto: 90 }; p.amor.personas.madre = { etapa: 'casados', afecto: 90 };
  ok(S.probarInteraccion('nene', 'beso', p, {}).motivo === 'no-se-puede' && S.probarInteraccion('madre', 'mano', p, {}).motivo === 'no-se-puede', 'ni con el guardado retocado');
  // ni con el ajuste apagado
  const pa = partida(); compadre(pa, 'astronoma');
  ok(!S.opcionesRueda('astronoma', pa, { romance: false }).some((g) => g.categoria === 'romantica') && S.probarInteraccion('astronoma', 'piropo', pa, { romance: false }).motivo === 'no-se-puede', 'con el romance apagado, nada');
  // con una candidata, según la etapa: al principio sólo el piropo
  const pb = partida();
  const rom = S.opcionesRueda('astronoma', pb, {}).find((g) => g.categoria === 'romantica').opciones;
  ok(rom.find((o) => o.id === 'piropo').disponible && rom.filter((o) => o.id !== 'piropo' && o.de === 'social').every((o) => !o.disponible), 'al principio, sólo el piropo');
  eq(rom.find((o) => o.id === 'beso').motivo, 'Para eso, primero tienen que estar saliendo.', 'el motivo del beso (texto exacto)');
  // comprometido con otra: nada con nadie más
  const pc = partida(); pc.amor = M.sanearAmor({ personas: { botera: { etapa: 'comprometidos', afecto: 80 } } }, 3);
  ok(!S.opcionesRueda('pintora', pc, {}).some((g) => g.categoria === 'romantica'), 'comprometido con Martina, nada romántico con Abril');
  ok(S.opcionesRueda('botera', pc, {}).find((g) => g.categoria === 'romantica').opciones.every((o) => o.disponible || o.id === 'piropo' || o.de === 'charla'), 'con tu pareja, todo lo romántico');
  // con tu pareja, lo romántico nunca sale mal
  let siempre = true;
  for (let s = 0; s < 50; s++) { const q = copia(pc); if (!S.probarInteraccion('botera', 'beso', q, { semilla: s }).exito) siempre = false; }
  ok(siempre, 'con tu pareja, el beso sale siempre');
  // el piropo es el de la 3.7.1 (uno por día)
  const pd = partida();
  const r1 = S.probarInteraccion('veterinaria', 'piropo', pd, { semilla: 1 });
  ok(pd.amor.personas.veterinaria?.piropo === 3 && typeof r1.reaccion.renglon === 'string', 'el piropo usa coquetear de amor.js');
  ok(S.probarInteraccion('veterinaria', 'piropo', pd, { semilla: 2 }).exito === false, 'un piropo por día');
  // lo romántico suma afecto y puede abrir el coqueteo
  const pf = partida(); pf.amor = M.sanearAmor({ personas: { andinista: { etapa: 'coqueteo', afecto: 20 } } }, 3); compadre(pf, 'andinista');
  let subio = false;
  for (let s = 0; s < 10 && !subio; s++) { const q = copia(pf); const r = S.probarInteraccion('andinista', 'abrazo-largo', q, { semilla: s }); if (r.exito) subio = r.efectos.romance > 0 && S.relacionDe('andinista', q).romance > 20; }
  ok(subio, 'un abrazo largo que sale bien sube el romance');
  ok(typeof M.sumarAfectoDe === 'function' && M.sumarAfectoDe(partida(), 'nene', 5, {}) === null && M.sumarAfectoDe(partida(), 'modista', 5, {}) === null, 'amor.sumarAfectoDe no le suma a quien no puede');
}

// ---------------------------------------------------------------- la barra de relación
{
  const p = partida();
  eq(S.relacionDe('jefe', p), { amistad: 0, romance: 0, nivel: 'conocido', nivelRomance: null, marcas: { amigo: 25, compadre: 70 }, romanceVisible: false }, 'de entrada, la barra vacía');
  amigo(p, 'jefe');
  const r = S.relacionDe('jefe', p);
  ok(r.amistad === Math.round(V.puntosAmistad('jefe', p) / 2) && r.nivel === 'amigo' && r.amistad >= r.marcas.amigo, 'la barra es la amistad de siempre, de 0 a 100, con la marca de amigo');
  compadre(p, 'jefe');
  ok(S.relacionDe('jefe', p).amistad >= 70 && S.relacionDe('jefe', p).nivel === 'compadre', 'y la de compadre');
  for (let d = 1; d <= 30; d++) V.regalar('jefe', 'yerba', p, 100 + d, () => 99);
  ok(S.relacionDe('jefe', p).amistad === 100, 'el tope es 100');
  const q = partida(); q.amor = M.sanearAmor({ personas: { fotografa: { etapa: 'saliendo', afecto: 42 } } }, 3);
  const rf = S.relacionDe('fotografa', q);
  ok(rf.romance === 42 && rf.nivelRomance === 'saliendo' && rf.romanceVisible, 'el romance es el afecto de la 3.7.1');
  ok(S.relacionDe('fotografa', q, { romance: false }).romance === 0 && S.relacionDe('fotografa', q, { romance: false }).nivelRomance === null, 'con el ajuste apagado no se ve');
  ok(S.relacionDe('nadie', q).amistad === 0, 'alguien que no existe: vacío');
  ok(typeof V.cambiarAmistad === 'function' && typeof V.puntosAmistad === 'function', 'vecindad.js: cambiarAmistad y puntosAmistad');
  const pa = partida(); amigo(pa, 'ercilia');
  for (let i = 0; i < 30; i++) V.cambiarAmistad(pa, 'ercilia', -10, 7);
  ok(V.nivelDe('ercilia', pa) === 'amigo' && V.puntosAmistad('ercilia', pa) === V.AMISTAD.umbral.amigo, 'el que llegó a amigo no vuelve a conocido');
}

// ---------------------------------------------------------------- el humor del día
{
  const p = partida();
  for (const k of PERSONAS) for (let d = 1; d <= 24; d++) for (const clima of V.CLIMAS) {
    const h = S.humorDe(k, p, d, { clima, hora: 12 });
    if (!(S.HUMORES.includes(h.humor) && S.EMOCIONES.includes(h.emocion) && typeof h.motivo === 'string' && h.motivo.length)) assert.fail(`${k}: humor raro`);
  }
  ok(true, 'el humor de todos, todos los días y con todo clima, es uno de los seis');
  const cumple = A.CUMPLES_ALDEA.abuela;
  eq(S.humorDe('abuela', p, cumple, {}), { humor: 'contento', emocion: 'contento', motivo: 'Hoy cumple años.', causa: 'cumple' }, 'el cumpleaños (texto exacto)');
  ok(S.humorDe('apicultor', p, 2, { clima: 'lluvia', hora: 12 }).motivo === 'La lluvia le riega las plantas.', 'al jardinero la lluvia lo pone contento');
  ok(S.humorDe('guardaparque', p, 2, { clima: 'lluvia', hora: 12 }).humor === 'triste', 'a la andariega la lluvia la encierra');
  ok(['trabajo', 'durmio-mal'].includes(S.humorDe('carpintero', p, 4, { hora: 20 }).causa), 'a la tardecita, el trabajador viene cansado');
  const dias = Array.from({ length: 48 }, (_x, d) => S.humorDe('pintora', p, d + 1, { clima: 'nublado', hora: 12 }).humor);
  ok(new Set(dias).size >= 2, 'el humor cambia de un día a otro');
  const pq = partida(); pq.amor = M.sanearAmor({ personas: { ceramista: { etapa: 'novios', afecto: 70, contacto: 3 } } }, 3);
  ok(S.humorDe('ceramista', pq, 3, {}).humor === 'enamorado', 'la novia que te vio ayer anda enamorada');
  const pj = partida(); compadre(pj, 'nelida');
  for (const id of ['abrazo', 'chiste']) S.probarInteraccion('nelida', id, pj, { semilla: 0 });
  ok(['contento', 'enamorado'].includes(S.humorDe('nelida', pj, 3, {}).humor), 'lo que le hiciste hoy le alegra el día');
  ok(Object.keys(SV.FRASES_SOCIAL.motivoHumor).length >= 20 && Object.values(SV.FRASES_SOCIAL.motivoHumor).every((t) => /\.$/.test(t)), 'los motivos del humor');
}

// ---------------------------------------------------------------- los deseos
{
  const p = partida();
  const tipos = S.TIPOS_DE_DESEO;
  for (const k of PERSONAS) {
    const ds = SV.VOCES_SOCIAL[k]?.deseos || [];
    ok(ds.length >= 3 && new Set(ds.map((x) => x.id)).size === ds.length, `${k}: tres o más deseos distintos`);
    for (const x of ds) {
      const c = x.cumplir;
      ok(tipos.includes(c.tipo) && typeof x.texto === 'string' && x.texto.length < 46 && x.texto.startsWith(V.nombreCorto(k)) && / quiere /.test(x.texto) && x.pide && x.gracias, `${k}/${x.id}: texto, pide y gracias`);
      if (c.tipo === 'regalo') ok(V.esRegalable(c.k), `${k}/${x.id}: se puede regalar`);
      if (c.tipo === 'interaccion') ok(S.esInteraccion(c.id) && S.INTERACCIONES[c.id].categoria !== 'romantica' && S.INTERACCIONES[c.id].categoria !== 'picante', `${k}/${x.id}: una interacción amable`);
      if (c.tipo === 'interaccion' && c.id === 'mate') ok(!A.CHICOS_ALDEA.includes(k) && !VZ.VOCES[k].noToma?.mate, `${k}/${x.id}: toma mate`);
      if (c.tipo === 'invitar') ok(['mate', 'te'].includes(c.que) && !VZ.VOCES[k].noToma?.[c.que] && !(k === 'galesa' && c.que === 'te'), `${k}/${x.id}: lo que sí toma`);
      if (c.tipo === 'hecho') ok(Object.hasOwn(V.HECHOS, c.id), `${k}/${x.id}: un hecho que se anota`);
    }
  }
  // los dos del plan, con texto exacto
  ok(SV.VOCES_SOCIAL.panadera.deseos.some((x) => x.id === 'frutillas' && x.texto === 'Rosa quiere frutillas' && x.cumplir.tipo === 'regalo' && x.cumplir.k === 'frutilla'), '«Rosa quiere frutillas»');
  ok(SV.VOCES_SOCIAL.nene.deseos.some((x) => x.id === 'futbol' && x.texto === 'Nahuel quiere jugar al fútbol' && x.cumplir.tipo === 'interaccion' && x.cumplir.id === 'pelota'), '«Nahuel quiere jugar al fútbol»');
  // rotan cada pocos días (no todos el mismo día) y no repiten el anterior
  for (const k of PERSONAS) {
    const ids = Array.from({ length: 30 }, (_x, d) => S.deseoDe(k, p, d + 1).id);
    let cambios = 0;
    for (let d = 1; d < 30; d++) if (ids[d] !== ids[d - 1]) cambios++;
    if (cambios < 7 || cambios > 10) assert.fail(`${k}: el deseo tiene que cambiar cada tres días (${cambios})`);
    const dd = S.deseoDe(k, p, 5);
    if (dd.hasta < 5 || dd.hasta > 7 || S.deseoDe(k, p, dd.hasta).id !== dd.id || S.deseoDe(k, p, dd.hasta + 1).id === dd.id) assert.fail(`${k}: «hasta» mal`);
  }
  ok(true, 'cada deseo dura tres días y cambia al siguiente');
  const vuelta = new Set(PERSONAS.map((k) => S.deseoDe(k, p, 2).hasta));
  ok(vuelta.size >= 2, 'no cambian todos el mismo día');
  // cumplirlo suma mucho (y después, hasta el próximo, no hay deseo)
  const q = partida(); amigo(q, 'panadera');
  let d = 1; while (S.deseoDe('panadera', q, d).id !== 'frutillas') d++;
  q.dia = d;
  const antes = V.puntosAmistad('panadera', q);
  ok(S.cumplirDeseo('panadera', q, { tipo: 'regalo', k: 'miel' }, d) === null, 'otra cosa no cumple el deseo');
  const c = S.cumplirDeseo('panadera', q, { tipo: 'regalo', k: 'frutilla' }, d);
  ok(c?.ok && c.id === 'frutillas' && V.puntosAmistad('panadera', q) - antes === S.SOCIAL.premioDeseo.amistad && c.efectos.amistad === 6, 'cumplir el deseo suma mucho (seis puntos de la barra)');
  ok(c.renglon === SV.VOCES_SOCIAL.panadera.deseos.find((x) => x.id === 'frutillas').gracias, 'y te da las gracias con su voz');
  ok(S.deseoDe('panadera', q, d) === null && S.cumplirDeseo('panadera', q, { tipo: 'regalo', k: 'frutilla' }, d) === null, 'ya cumplido, no hay otro hasta que cambie');
  ok(S.humorDe('panadera', q, d, {}).humor === 'contento', 'y queda contenta');
  // el deseo de una interacción se cumple solo al hacerla bien
  const r = partida(); compadre(r, 'nene');
  let dn = 1; while (S.deseoDe('nene', r, dn).id !== 'futbol') dn++;
  r.dia = dn;
  const pel = S.probarInteraccion('nene', 'pelota', r, { semilla: 0, hora: 11 });
  ok(pel.exito && pel.efectos.otros.some((o) => o.tipo === 'deseo' && o.id === 'futbol') && S.deseoDe('nene', r, dn) === null, 'jugar a la pelota con Nahuel cumple su deseo');
  // un hecho del valle (lo que anota vecindad.js)
  const k = PERSONAS.find((x) => SV.VOCES_SOCIAL[x].deseos.some((y) => y.cumplir.tipo === 'hecho'));
  const dh = SV.VOCES_SOCIAL[k].deseos.find((y) => y.cumplir.tipo === 'hecho');
  const t = partida(); let dt = 1; while (S.deseoDe(k, t, dt).id !== dh.id) dt++;
  t.dia = dt;
  ok(S.cumplirDeseo(k, t, null, dt) === null, 'sin haberlo hecho, no');
  V.anotarHecho(t, dh.cumplir.id, dt, { cm: 60, especie: 'trucha', persona: 'jefe', lote: 'panaderia' });
  ok(S.cumplirDeseo(k, t, null, dt)?.ok, `hecho en el valle, se cumple (${k}: ${dh.id})`);
}

// ---------------------------------------------------------------- la iniciativa, con el ritmo de la aldea
{
  const simular = (ritmo, dias = 12) => {
    const p = partida();
    for (const k of PERSONAS) compadre(p, k);
    let total = 0, maxDia = 0, ultima = -1e9, gapMin = Infinity, repetidos = 0, noche = 0;
    const tipos = new Set();
    for (let d = 20; d < 20 + dias; d++) {
      let hoy = 0; const vinieron = new Set();
      for (let h = 0; h < 24; h += 0.5) for (const k of PERSONAS) {
        const r = S.iniciativa(k, p, { dia: d, hora: h, ritmo, semilla: 7 });
        if (!r) continue;
        if (h < 8 || h >= 21) noche++;
        if (vinieron.has(k)) repetidos++;
        vinieron.add(k); hoy++; total++; tipos.add(r.tipo);
        const ahora = d * 24 + h; gapMin = Math.min(gapMin, ahora - ultima); ultima = ahora;
        if (!r.renglones.length || r.renglones.some((x) => typeof x !== 'string' || !x)) assert.fail('renglones vacíos');
        if (!S.ICONOS.includes(r.burbuja) || !S.ANIM_VECINO.includes(r.animEl)) assert.fail(`ícono o animación: ${r.burbuja} ${r.animEl}`);
        if (r.tipo === 'invitar' && !S.esInteraccion(r.id)) assert.fail('invita a algo que no existe');
      }
      maxDia = Math.max(maxDia, hoy);
    }
    return { total, maxDia, gapMin, repetidos, noche, tipos };
  };
  const tr = simular('tranquilo'), no = simular('normal'), an = simular('animado');
  ok(tr.maxDia <= 1 && no.maxDia <= 2 && an.maxDia <= 3, `como mucho 1, 2 y 3 por día (${tr.maxDia}, ${no.maxDia}, ${an.maxDia})`);
  ok(tr.gapMin >= AV.RITMOS.tranquilo.esperaCharla && no.gapMin >= AV.RITMOS.normal.esperaCharla && an.gapMin >= AV.RITMOS.animado.esperaCharla, 'entre uno y otro, la espera del ritmo');
  ok(tr.total < no.total && no.total < an.total && tr.total > 0, `tranquilo < normal < animado (${tr.total}, ${no.total}, ${an.total})`);
  ok(!tr.repetidos && !no.repetidos && !an.repetidos && !an.noche, 'nadie viene dos veces el mismo día, ni de noche');
  ok(['saludar', 'invitar', 'chisme'].every((t) => an.tipos.has(t)), `te saludan, te invitan y te cuentan chismes (${[...an.tipos].join(', ')})`);
  // los que no te conocen casi no vienen; el ofendido, nunca; en el Desafío, nada
  const p = partida();
  S.probarInteraccion('jefe', 'ignorar', p, { semilla: 0 });
  const ofendido = S.humorDe('jefe', p, 3, {}).causa === 'ofendido';
  let vino = false;
  for (let h = 8; h < 21; h += 0.5) if (S.iniciativa('jefe', p, { hora: h, ritmo: 'animado', semilla: h })) vino = true;
  ok(!ofendido || !vino, 'el que está ofendido no se te acerca');
  ok(S.iniciativa('jefe', partida(), { hora: 12, desafio: true }) === null && S.iniciativa('jefe', partida(), { hora: 12, libre: false }) === null, 'ni en el Desafío ni cuando está trabajando');
  // el que viene a pedir, pide su deseo
  const pd = partida(); for (const k of PERSONAS) compadre(pd, k);
  let pide = null;
  for (let d = 20; d < 60 && !pide; d++) for (const k of PERSONAS) { const r = S.iniciativa(k, pd, { dia: d, hora: 12, ritmo: 'animado', ahora: d * 100 }); if (r?.tipo === 'pedir') { pide = { r, k, d }; break; } }
  ok(pide && pide.r.renglones[0] === S.deseoDe(pide.k, pd, pide.d).pide, 'el que viene a pedir, pide su deseo');
}

// ---------------------------------------------------------------- entre vecinos
{
  const p = partida();
  const ids = new Set();
  for (let i = 0; i < 400; i++) {
    const a = PERSONAS[i % PERSONAS.length], b = PERSONAS[(i * 7 + 3) % PERSONAS.length];
    if (a === b) continue;
    const r = S.entreVecinos(a, b, p, { hora: 9 + (i % 13), semilla: i, lugar: i % 5 === 0 ? 'salon' : 'plaza', clima: V.CLIMAS[i % 5] });
    ids.add(r.id);
    if (!Object.hasOwn(S.ENTRE, r.id) || !S.ANIM_VECINO.includes(r.animA) || !S.ANIM_VECINO.includes(r.animB)) assert.fail(`entre: ${r.id}`);
    if (!r.burbujas.length || r.burbujas.some((x) => !S.ICONOS.includes(x))) assert.fail(`burbujas: ${r.burbujas}`);
    if (r.renglon !== undefined && (typeof r.renglon !== 'string' || ![a, b].includes(r.quien) || !r.renglon.includes(V.nombreCorto(r.quien === a ? b : a)))) assert.fail(`renglón: ${r.renglon}`);
  }
  ok(ids.size >= 8, `hacen de todo (${[...ids].join(', ')})`);
  eq(S.entreVecinos('jefe', 'abuela', p, { hora: 10, semilla: 4 }), S.entreVecinos('jefe', 'abuela', p, { hora: 10, semilla: 4 }), 'con la misma semilla, lo mismo');
  const cuenta = (a, b, ctx, id) => { let c = 0; for (let s = 0; s < 200; s++) if (S.entreVecinos(a, b, p, { ...ctx, semilla: s }).id === id) c++; return c; };
  ok(cuenta('padre', 'madre', { hora: 18, lugar: 'salon' }, 'bailar') > 40, 'los Jones bailan en el salón');
  ok(cuenta('nene', 'nena', { hora: 11, clima: 'sol' }, 'pelota') > 50, 'los chicos juegan a la pelota');
  ok(cuenta('nene', 'jefe', { hora: 20 }, 'cartas') === 0 && cuenta('nene', 'nena', { hora: 20 }, 'mate') === 0, 'los chicos no juegan al truco ni toman mate');
  ok(cuenta('jefe', 'telegrafista', { hora: 11 }, 'reirse') > cuenta('jefe', 'pintora', { hora: 11 }, 'reirse'), 'los amigos se ríen más');
  ok(cuenta('jefe', 'pintora', { hora: 11 }, 'discutir') > cuenta('jefe', 'telegrafista', { hora: 11 }, 'discutir'), 'los que no son amigos discuten más');
  ok(cuenta('jefe', 'abuela', { hora: 23 }, 'reirse') === 0 && cuenta('jefe', 'abuela', { hora: 23 }, 'bailar') === 0, 'de noche, sólo se saludan o charlan');
  const tres = S.entreVecinos('jefe', ['abuela', 'telegrafista'], p, { hora: 12, semilla: 1 });
  ok(tres.quienes.length === 3 && S.ANIM_VECINO.includes(tres.animC), 'entre tres');
  ok(S.entreVecinos('jefe', 'jefe', p, {}) === null && S.entreVecinos('jefe', 'nadie', p, {}) === null, 'con uno solo, nada');
  ok(!Object.keys(S.ENTRE).some((id) => /beso|mano|lento/.test(id)), 'entre vecinos no hay nada romántico');
  const antes = JSON.stringify(p);
  S.entreVecinos('jefe', 'abuela', p, { hora: 12 });
  ok(JSON.stringify(p) === antes, 'mirar lo que hacen entre ellos no cambia la partida');
}

// ---------------------------------------------------------------- los textos: muchos, con voz propia y sin nada religioso
{
  const todos = [];
  const juntar = (x, donde) => {
    if (typeof x === 'string') todos.push([x, donde]);
    else if (Array.isArray(x)) x.forEach((y, i) => juntar(y, `${donde}[${i}]`));
    else if (x && typeof x === 'object') for (const [k, y] of Object.entries(x)) if (k !== 'cumplir' && k !== 'id') juntar(y, `${donde}.${k}`);
  };
  juntar(SV.VOCES_SOCIAL, 'VOCES_SOCIAL'); juntar(SV.VOCES_SOCIAL_AMOR, 'VOCES_SOCIAL_AMOR'); juntar(SV.FRASES_SOCIAL, 'FRASES_SOCIAL');
  ok(todos.length > 1200, `mucho texto (${todos.length} renglones)`);
  const prohibido = /\b(dios|dioses|misa|virgen|bendic\w*|bendit\w*|rez\w+|iglesia|capilla|cura|curas|santo|santa|sagrad\w*|milagro\w*|ángel\w*|amén|pecado|cielo santo|altar|parroq\w*|plata|pesos|precio\w*|cobr\w+|vend\w+|pag\w+|compr\w+|fiado)\b/i;
  for (const [t, donde] of todos) {
    const m = t.match(prohibido);
    if (m) assert.fail(`nada religioso ni de economía: «${m[0]}» en ${donde}`);
    if (/\{(?!nombre\}|quien\}|cosa\}|a\}|b\}|otro\})/.test(t)) assert.fail(`marca desconocida en ${donde}: ${t}`);
    if (t.length > 160) assert.fail(`renglón largo en ${donde}`);
  }
  ok(true, 'ningún texto religioso ni de economía, ni marcas raras, ni renglones largos');
  for (const k of PERSONAS) {
    const v = SV.VOCES_SOCIAL[k];
    ok(v && v.bien.length >= 2 && v.mal.length >= 2 && v.enojo.length >= 2 && v.abrazo && v.chiste.bien && v.chiste.mal && v.perdon.bien && v.perdon.mal && v.tiempo && v.consuelo && v.cartas
      && v.viene.saludar && v.viene.invitar && v.viene.pedir && v.viene.chisme, `${k}: voz propia completa`);
    ok(!!v.mate === !(A.CHICOS_ALDEA.includes(k) || VZ.VOCES[k].noToma?.mate), `${k}: mate sólo si toma`);
  }
  eq(Object.keys(SV.VOCES_SOCIAL_AMOR).sort(), [...M.ORDEN_CANDIDATAS].sort(), 'lo romántico, sólo de las candidatas');
  for (const [k, v] of Object.entries(SV.VOCES_SOCIAL_AMOR)) ok(['mano', 'abrazoLargo', 'susurrar', 'beso', 'bailarLento'].every((x) => v[x]?.bien && v[x]?.mal), `${k}: las cinco románticas`);
  // la voz propia llega a la reacción
  const p = partida(); compadre(p, 'martin');
  const r = S.probarInteraccion('martin', 'abrazo', p, { semilla: 0 });
  ok(r.exito && r.reaccion.renglon === SV.VOCES_SOCIAL.martin.abrazo, 'el abrazo de Martín, con su voz (texto exacto)');
  ok(SV.FRASES_SOCIAL.motivos.ofendido === 'Está ofendido con vos: primero, pedile perdón.', 'los motivos, con texto exacto');
}

// ---------------------------------------------------------------- el saneador (y el guardado)
{
  eq(S.sanearSocial(null), S.socialNuevo(), 'sin nada, lo nuevo');
  let semilla = 12345;
  const rnd = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
  const basura = () => {
    const opciones = [null, undefined, NaN, Infinity, -1e12, 1e12, -3, 0, 7, 2.5, '', 'x', '9', true, [], [1, 2], {}, { a: 1 }, '__proto__', 'constructor', 'jefe', 'abrazo', 'deseo:frutillas'];
    return opciones[Math.floor(rnd() * opciones.length)];
  };
  const objetoBasura = (prof = 0) => {
    const o = {};
    const claves = ['jefe', 'panadera', 'nene', 'nadie', '__proto__', 'constructor', 'abrazo', 'beso', 'volar', 'v', 'c', 'id', 'dia', 'bien', 'ultima', 'n', ...PERSONAS.slice(0, 5)];
    for (let i = 0; i < 12; i++) o[claves[Math.floor(rnd() * claves.length)]] = prof < 2 && rnd() < 0.5 ? objetoBasura(prof + 1) : basura();
    return o;
  };
  for (let i = 0; i < 400; i++) {
    const x = { dia: basura(), hecho: objetoBasura(), puntos: objetoBasura(), ganado: objetoBasura(), ofendido: objetoBasura(), deseos: objetoBasura(), recuerdo: objetoBasura(), vino: objetoBasura(), iniciativa: rnd() < 0.5 ? objetoBasura() : basura() };
    const s = S.sanearSocial(x, 30);
    const ss = S.sanearSocial(copia(s), 30);
    if (JSON.stringify(s) !== JSON.stringify(ss)) assert.fail('sanear dos veces da lo mismo');
    for (const campo of ['hecho', 'puntos', 'ganado', 'ofendido', 'deseos', 'recuerdo', 'vino']) {
      if (Object.keys(s[campo]).some((k) => !PERSONAS.includes(k))) assert.fail(`${campo}: sólo vecinos`);
      if (Object.getPrototypeOf(s[campo]) !== Object.prototype) assert.fail('sin prototipos raros');
    }
    for (const [k, o] of Object.entries(s.hecho)) for (const [id, v] of Object.entries(o)) if (!S.esInteraccion(id) || v < 1 || v > 9) assert.fail(`hecho ${k}.${id}`);
    for (const v of Object.values(s.puntos)) if (!(Math.abs(v) <= S.SOCIAL.topeHumor)) assert.fail('puntos');
    for (const v of [...Object.values(s.ofendido), ...Object.values(s.vino), s.dia, s.iniciativa.dia]) if (!(v >= 0 && v <= 30)) assert.fail('fechas del futuro');
    if (!Number.isFinite(s.iniciativa.ultima) || s.iniciativa.ultima > 30 * 24 + 24 || !(s.iniciativa.n >= 0 && s.iniciativa.n <= 9)) assert.fail('iniciativa');
    for (const r of Object.values(s.recuerdo)) if (!(S.esInteraccion(r.id) || r.id.startsWith('deseo:')) || typeof r.bien !== 'boolean') assert.fail('recuerdo');
    // y con eso las funciones no se rompen
    const p = partida({ dia: 30 }); p.vecindad.social = s;
    S.opcionesRueda('jefe', p, {}); S.probarInteraccion('jefe', 'chiste', p, { semilla: i }); S.humorDe('jefe', p, 30, {}); S.deseoDe('jefe', p, 30); S.iniciativa('jefe', p, { hora: 12 }); S.recuerdoDe('jefe', p, 30);
  }
  ok(true, 'el saneador aguanta 400 guardados rotos (y las funciones también)');
  // no crece sin límite: un mes jugando con todos todo
  const p = partida();
  for (let d = 1; d <= 40; d++) {
    p.dia = d; p.cosas.yerba = 99;
    for (const k of PERSONAS) for (const id of Object.keys(S.INTERACCIONES)) S.probarInteraccion(k, id, p, { semilla: d, hora: 12 });
    for (const k of PERSONAS) S.iniciativa(k, p, { hora: 12, ritmo: 'animado' });
  }
  const tam = JSON.stringify(p.vecindad.social).length;
  ok(tam < 40000, `lo social guardado no crece sin límite (${tam} caracteres)`);
  const s2 = S.sanearSocial(copia(p.vecindad.social), 40);
  ok(JSON.stringify(s2) === JSON.stringify(S.sanearSocial(s2, 40)), 'lo de una partida real se sanea igual');
  // las fechas del futuro (un guardado de otro día) no quedan
  const fut = S.sanearSocial({ dia: 99, ofendido: { jefe: 80 }, vino: { jefe: 99 }, recuerdo: { jefe: { id: 'beso', dia: 90, bien: true } } }, 10);
  ok(fut.dia === 10 && fut.ofendido.jefe === 10 && fut.vino.jefe === 10 && fut.recuerdo.jefe.dia === 10, 'nada del futuro');
  // guardado.js lo engancha (una partida vieja sin `social` queda igual)
  const g = leer('src/guardado.js');
  ok(g.includes("import { conSocial } from './vecindad-social.js';") && g.includes('conSocial(limpio.vecindad, p.vecindad, limpio.dia);') && g.includes('vecindad: sanearVecindad(p.vecindad),'), 'guardado.js guarda lo social');
  const vieja = V.sanearVecindad({ personas: {}, hechos: [] });
  eq(S.conSocial(vieja, { personas: {}, hechos: [] }, 5), V.sanearVecindad({ personas: {}, hechos: [] }), 'una partida vieja, igual que antes');
  const nueva = S.conSocial(V.sanearVecindad(p.vecindad), p.vecindad, 40);
  ok(Object.hasOwn(nueva, 'social') && JSON.stringify(nueva.social) === JSON.stringify(s2), 'una partida nueva, con lo social');
}

// ---------------------------------------------------------------- el determinismo con semilla
{
  const p = partida(); amigo(p, 'apicultor'); amigo(p, 'fotografa');
  const ids = Object.keys(S.INTERACCIONES);
  for (const k of ['apicultor', 'fotografa', 'nena']) for (const id of ids) for (const s of [0, 1, 2]) {
    const a = copia(p), b = copia(p);
    eq(S.probarInteraccion(k, id, a, { semilla: s }), S.probarInteraccion(k, id, b, { semilla: s }), `${k}/${id}/${s}: igual`);
    if (JSON.stringify(a) !== JSON.stringify(b)) assert.fail('la partida queda igual');
  }
  let distintos = 0;
  for (let s = 0; s < 40; s++) if (S.probarInteraccion('fotografa', 'broma', copia(p), { semilla: s }).exito !== S.probarInteraccion('fotografa', 'broma', copia(p), { semilla: s + 100 }).exito) distintos++;
  ok(distintos > 3, 'con otra semilla, otra cosa');
  eq(S.humorDe('pintora', p, 9, { clima: 'sol' }), S.humorDe('pintora', copia(p), 9, { clima: 'sol' }), 'el humor, determinista');
  eq(S.deseoDe('pintora', p, 9), S.deseoDe('pintora', copia(p), 9), 'el deseo, determinista');
  const a = copia(p), b = copia(p);
  eq(S.iniciativa('apicultor', a, { hora: 10, ritmo: 'animado', semilla: 3 }), S.iniciativa('apicultor', b, { hora: 10, ritmo: 'animado', semilla: 3 }), 'la iniciativa, determinista');
}

// ---------------------------------------------------------------- reglas del código
{
  const src = leer('src/vecindad-social.js'), voz = leer('src/vecindad-social-voces.js');
  ok(!/three|document|window|Math\.random|Date\.now/.test(src.replace(/\/\/.*$/gm, '')), 'módulo puro: sin three, sin DOM y sin azar suelto');
  ok(src.split('\n').filter((l) => l.startsWith('import ')).every((l) => /^import \{ [^}]+ \} from '\.\/[a-z-]+\.js';$/.test(l)), 'imports en una línea (armar.mjs)');
  ok(!/export (const|function) \S*ñ/.test(src + voz), 'exportados sin ñ');
  ok(!src.includes('\r') && !voz.includes('\r'), 'fines de línea LF');
  ok(src.includes('Object.hasOwn') && (src.match(/3\.7\.4/g) || []).length >= 1, 'Object.hasOwn y comentarios 3.7.4');
  ok(leer('index.html').includes('function probarInteraccion(') || !fs.existsSync(new URL('../index.html', import.meta.url)), 'armar.mjs lo mete en index.html');
}

console.log(`verificar-3-7-4-social: ${n} comprobaciones OK`);
