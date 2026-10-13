// 3.9.1 · La peña de los sábados (y el pulido de la cantina).
//   1. el núcleo: cuándo hay peña, la tanda (tango y después chamamé), los parroquianos de cada noche (ocho sillas, dos al truco, los dos músicos), Dalia en la aldea;
//   2. los chistes de doble sentido: cuántos hay por personaje, la rotación con memoria (no repite los últimos), más con confianza o amor, lo atrevido de Lucrecia sólo con confianza;
//   3. la borrachera: sube con los tragos fuertes, tope de tres, baja con el tiempo y con el mate, y el ajuste (normal, suave, apagado);
//   4. el romance con Lucrecia y con Dalia (amor.js): las dos candidatas, sólo en su casa, la rivalidad;
//   5. el cuerpo y la pose de Dalia (tacos, curvas, tajo), la bandeja parada, las poses de baile, sin luces nuevas;
//   6. el juego de la peña: aislado con `fallaSistema`, lejos no calcula nada, el panel de la invitación y el baile de Pocha;
//   7. el guardado (partidas de antes sin nada de esto) y los enganches;
//   8. todos los textos con su inglés, sin nada religioso ni explícito, y la versión.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const A = await import('../src/aldea.js');
const P = await import('../src/pena.js');
const PV = await import('../src/pena-voces.js');
const AM = await import('../src/amor.js');
const AV = await import('../src/amor-voces.js');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- 1. el núcleo
{
  // el día 13 es sábado (dia % 7 === 5 → día de la semana 5); el 14, domingo
  const SAB = 13, DOM = 14, VIE = 12, LUN = 15;
  eq([A.diaSemanaDe(SAB), A.diaSemanaDe(DOM)], [5, 6], 'el 13 es sábado y el 14 domingo');
  ok(A.penaActiva(SAB, 22) && A.penaActiva(SAB, 21.5) && A.penaActiva(DOM, 1) && !A.penaActiva(DOM, 1.6), 'la peña: sábado de 21:30 a 1:30 (la madrugada del domingo)');
  ok(!A.penaActiva(SAB, 20) && !A.penaActiva(VIE, 22) && !A.penaActiva(DOM, 22) && !A.penaActiva(LUN, 1) && !A.penaActiva(SAB, 12), 'ni de día, ni entre semana, ni el domingo a la noche');
  eq([A.tandaDePena(SAB, 22), A.tandaDePena(SAB, 23.4), A.tandaDePena(SAB, 23.6), A.tandaDePena(DOM, 0.5), A.tandaDePena(VIE, 22)], ['tango', 'tango', 'chamame', 'chamame', null], 'tango la primera parte, chamamé después');
  eq([A.nocheDeCantina(DOM, 1), A.nocheDeCantina(SAB, 22), A.nocheDeCantina(SAB, 5.9)], [SAB, SAB, SAB - 1], 'la madrugada es de la noche de ayer');

  // la vecina nueva
  ok(A.VECINOS_391.includes('bailarina') && A.ORDEN_VECINOS_ALDEA.includes('bailarina') && A.esVecinoAldea('bailarina') && A.esPersonaAldea('bailarina'), 'Dalia es una vecina nueva de la aldea');
  const d = A.VECINOS_ALDEA.bailarina;
  ok(d && /Dalia/.test(d.nombre) && d.charla.length >= 3 && d.casa && d.saludo && d.despedida, 'Dalia: nombre, casa, saludo, despedida y charla');
  ok(A.cumpleDe('bailarina') >= 1 && A.cumpleDe('bailarina') <= 12, 'su cumpleaños');
  // los de antes no se mueven de su lugar en el orden
  ok(A.ORDEN_PERSONAS_ALDEA.at(-1) === 'bailarina' && A.ORDEN_PERSONAS_ALDEA.at(-2) === 'moza' && A.ORDEN_PERSONAS_ALDEA.indexOf('ercilia') === 8, 'al final del orden: los índices de los demás no se mueven');
  // la rutina de Dalia: el sábado a la noche baila en la pista (tango y chamamé); entre semana duerme de noche
  const ax = A.aldeaNueva();
  const r1 = A.rutinaAldea('bailarina', 22, 5, ax, SAB), r2 = A.rutinaAldea('bailarina', 0.5, 6, ax, DOM), r3 = A.rutinaAldea('bailarina', 2, 1, ax, 9);
  ok(r1.edificio === 'cantina' && r1.punto === 'pista' && r1.pose === 'tango', 'el sábado a las 22 baila tango en la pista de la cantina');
  ok(r2.edificio === 'cantina' && r2.pose === 'chamame-solo' || r2.pose === 'chamame', 'después, chamamé');
  ok(/^cama/.test(r3.punto || ''), 'el martes de madrugada duerme');

  // los parroquianos de cada noche
  const poblados = { ...A.aldeaNueva(), pobladores: ['musico', 'herrero', 'carpintero', 'pescador', 'modista', 'telegrafista', 'panadera', 'maestra'].map((clave) => ({ clave, dia: 1 })) };
  let peor = 0, maxTruco = 0, dobles = 0;
  for (let noche = 1; noche <= 56; noche++) {
    const l = A.parroquianosDeLaNoche(poblados, noche);
    const sillas = l.filter((x) => /^silla-/.test(x.punto)), truco = l.filter((x) => /^truco-/.test(x.punto));
    peor = Math.max(peor, sillas.length); maxTruco = Math.max(maxTruco, truco.length);
    if (new Set(l.map((x) => x.punto)).size !== l.length || new Set(l.map((x) => x.clave)).size !== l.length) dobles++;
    ok(l.every((x) => x.llega >= 20.5 && x.sale <= 25.51 && x.sale > x.llega), `noche ${noche}: horas de llegada y salida con sentido`);
  }
  ok(peor <= 4, `nunca más de cuatro en las sillas de las mesas (de ocho): te queda dónde sentarte (máximo ${peor})`);
  ok(maxTruco <= 2 && dobles === 0, 'dos al truco como mucho, y nadie repetido ni en el mismo lugar');
  const sab = A.parroquianosDeLaNoche(poblados, SAB);
  ok(sab.length >= 3 && sab.some((x) => x.clave === 'musico' && x.pose === 'tocar') && sab.some((x) => x.clave === 'herrero' && x.pose === 'bombo'), 'el sábado: la guitarra (el Cholo) y el bombo (Anselmo) en el rincón');
  eq(A.parroquianosDeLaNoche(poblados, SAB), sab, 'determinista: la misma noche, la misma gente');
  ok(!A.parroquianosDeLaNoche(poblados, 2).some((x) => x.pose), 'entre semana, sin músicos');
  ok(A.enLaCantinaDe(poblados, sab[0].clave, SAB, sab[0].llega + 0.1) && !A.enLaCantinaDe(poblados, sab[0].clave, SAB, 12), 'enLaCantinaDe: sólo entre la llegada y la salida');
  ok(A.PUNTOS_PENA.pista && A.PUNTOS_PENA['truco-1'] && A.PUNTOS_PENA['truco-2'] && A.PUNTOS_PENA['musico-1'] && A.PUNTOS_PENA['musico-2'] && A.PUNTOS_PENA['cama-2'], 'los puntos de la peña (pista, truco, músicos y la cama de Dalia)');
}

// ---------------------------------------------------------------- 2. los chistes
{
  const cuenta = (x) => { let k = 0; const rec = (y) => { if (typeof y === 'string') k++; else if (Array.isArray(y)) y.forEach(rec); else if (y && typeof y === 'object') Object.values(y).forEach(rec); }; rec(x); return k; };
  for (const clave of ['moza', 'bailarina']) {
    ok(PV.CHISTES[clave] && cuenta(PV.CHISTES[clave]) >= 18, `${clave}: al menos 18 chistes (hay ${cuenta(PV.CHISTES[clave])})`);
    ok(Array.isArray(PV.CHISTES[clave].confianza) && PV.CHISTES[clave].confianza.length >= 2 && Array.isArray(PV.CHISTES[clave].amor) && PV.CHISTES[clave].amor.length >= 2, `${clave}: con más confianza y con amor, más atrevidos`);
  }
  // la rotación con memoria: nunca repite los últimos que salieron de ese banco
  for (const [clave, sit, sub] of [['moza', 'sentarse', null], ['moza', 'pedir', 'ginebra'], ['bailarina', 'bailando', null], ['bailarina', 'pies', null], ['moza', 'despedida', null]]) {
    const mem = {}; const vistos = []; let seguidos = 0, hubo = 0;
    for (let i = 0; i < 80; i++) {
      const t = P.elegirChiste(clave, sit, sub, mem, { confianza: 0, semilla: i, siempre: true });
      if (!t) continue;
      hubo++;
      if (vistos.length && vistos[vistos.length - 1] === t) seguidos++;
      const reciente = vistos.slice(-2);
      if (reciente.includes(t) && PV.CHISTES[clave][sit].length > 3) seguidos++;
      vistos.push(t);
    }
    ok(hubo === 80 && seguidos === 0, `${clave}/${sit}${sub ? '/' + sub : ''}: la rotación no repite los últimos (${hubo} chistes, ${seguidos} repetidos)`);
  }
  // todos los chistes de un banco salen antes de repetir
  { const mem = {}, sal = new Set(), b = PV.CHISTES.bailarina.pies; for (let i = 0; i < b.length; i++) sal.add(P.elegirChiste('bailarina', 'pies', null, mem, { semilla: 100 + i, siempre: true })); ok(sal.size >= b.length - 2, 'rota por todo el banco antes de repetir'); }
  // la memoria se guarda saneada
  eq(P.sanearMemoriaChistes({ 'moza.sentarse': [1, 2, 3, 4, 5], 'x y': [1], malo: 'z' }), { 'moza.sentarse': [3, 4, 5] }, 'la memoria de chistes: sólo claves y números chicos, los últimos tres');
  eq(P.sanearMemoriaChistes('basura'), {}, 'y la basura se descarta');
  // la confianza: sin ella, ni lo atrevido ni los guiños con la mesa
  const sin0 = P.bancosDe('moza', 'sentarse', null, 0).map((b) => b.banco), con2 = P.bancosDe('moza', 'sentarse', null, 2).map((b) => b.banco), con3 = P.bancosDe('moza', 'sentarse', null, 3).map((b) => b.banco);
  ok(!sin0.some((b) => /confianza|amor|mesa/.test(b)), 'recién conocidos: sólo los chistes de la situación');
  ok(con2.includes('moza.confianza') && con2.includes('moza.mesa') && !con2.includes('moza.amor'), 'con confianza: los de confianza y los guiños con la mesa, no los de amor');
  ok(con3.includes('moza.amor') && con3.includes('moza.mesa'), 'con amor: también los de amor');
  ok(!P.bancosDe('bailarina', 'invitar', null, 1).some((b) => /amor/.test(b.banco)) && P.bancosDe('bailarina', 'invitar', null, 3).some((b) => /amor/.test(b.banco)), 'Dalia: lo del amor, sólo con amor');
  // la línea atrevida de Lucrecia pasó a ser un guiño con las patas de la mesa (sin nombrar actos), y los dos descartes no están
  const todos = JSON.stringify(PV.CHISTES);
  ok(!/Pisame si querés/i.test(todos) && !/Me dejaste sin aliento/i.test(todos), 'los dos chistes descartados no están');
  ok(PV.CHISTES.moza.mesa.length >= 3 && PV.CHISTES.moza.mesa.some((t) => /pata/i.test(t)), 'los guiños de Lucrecia con las patas de la mesa');
  // la probabilidad: con confianza salen más
  let a0 = 0, a3 = 0; for (let i = 0; i < 400; i++) { if (P.elegirChiste('moza', 'tomar', null, {}, { confianza: 0, semilla: i })) a0++; if (P.elegirChiste('moza', 'tomar', null, {}, { confianza: 3, semilla: i })) a3++; }
  ok(a3 > a0 && a0 > 40 && a0 < 220, `con confianza salen más chistes (${a0} contra ${a3} de 400)`);
  // sin explícito: nada que nombre actos ni cuerpos de más (sugerido, nunca explícito)
  const explicito = /\b(sexo|sexual\w*|desnud\w*|desnuda|teta\w*|pecho\w*|culo|cola|concha|pija|verga|coger|garch\w*|acost\w+ con vos|orgasm\w*|erecci\w*|cogid\w*|follar|polvo|chupar)\b/i;
  for (const t of PV.textosPenaTodos?.() || P.textosPena()) assert.ok(!explicito.test(t), `nada explícito: «${t}»`);
  n++;
}

// ---------------------------------------------------------------- 3. la borrachera
{
  const fuerte = { id: 'ginebra', fuerte: true }, cerveza = { id: 'cerveza' }, mate = { id: 'mate-cocido' };
  let e = P.ebrioNuevo();
  ok(P.nivelEbrio(e, 100) === 0 && P.faseEbrio(0) === 'sobrio' && P.efectoEbrio(0, 5) === null, 'sobrio: sin efecto');
  e = P.sorberConAlcohol(P.sorberConAlcohol(e, fuerte, 100), fuerte, 100);
  ok(P.nivelEbrio(e, 100) > 0.5 && P.faseEbrio(P.nivelEbrio(e, 100)) === 'achispado', 'un par de sorbos de lo fuerte: achispado');
  for (let i = 0; i < 30; i++) e = P.sorberConAlcohol(e, fuerte, 100);
  ok(P.nivelEbrio(e, 100) === P.EBRIO.tope && P.EBRIO.tope === 3, 'el tope: tres tragos fuertes (nivel 3), por más que pidas');
  ok(P.faseEbrio(3) === 'torcido' && P.efectoEbrio(3, 5) && P.efectoEbrio(3, 5).deriva !== undefined, 'torcido: camina torcido');
  ok(P.nivelEbrio(e, 102) < P.nivelEbrio(e, 101) && P.nivelEbrio(e, 110) === 0, 'se pasa con el tiempo');
  const antes = P.nivelEbrio(e, 100), conMate = P.sorberConAlcohol(e, mate, 100);
  ok(P.nivelEbrio(conMate, 100) < antes, 'un mate cocido lo baja de golpe');
  ok(P.nivelEbrio(P.sorberConAlcohol(P.ebrioNuevo(), cerveza, 5), 5) < P.nivelEbrio(P.sorberConAlcohol(P.ebrioNuevo(), fuerte, 5), 5), 'la cerveza pega mucho menos que lo fuerte');
  const pleno = P.efectoEbrio(2.5, 3, 1), suave = P.efectoEbrio(2.5, 3, 0.5);
  ok(pleno && suave && Math.abs(suave.roll) <= Math.abs(pleno.roll) * 0.51 && Math.abs(pleno.roll) < 0.04, 'ajuste suave: la mitad; y el efecto pleno es leve (menos de 2,3 grados)');
  ok(P.efectoEbrio(3, 3, 0) === null, 'ajuste apagado: nada');
  eq([P.sanearAjusteBorrachera('suave'), P.sanearAjusteBorrachera('x'), P.sanearAjusteBorrachera(undefined)], ['suave', 'normal', 'normal'], 'el ajuste, saneado (por defecto normal)');
  ok(JSON.stringify(P.sanearEbrio({ n: 99, t: -5 }, 10)) === JSON.stringify({ n: 3, t: 0 }) && JSON.stringify(P.sanearEbrio('x')) === JSON.stringify(P.ebrioNuevo()), 'el estado, saneado para guardar');
  ok(PV.BORRACHERA_MOZA && cuenta2(PV.BORRACHERA_MOZA) >= 8, 'Lucrecia lo comenta con humor y frena al que no debe más');
  function cuenta2(x) { let k = 0; const rec = (y) => { if (typeof y === 'string') k++; else if (Array.isArray(y)) y.forEach(rec); else if (y && typeof y === 'object') Object.values(y).forEach(rec); }; rec(x); return k; }
  // enganches: el ajuste en la plantilla y en main, y el tope de los tragos
  const pl = leer('src/plantilla.html'), main = leer('src/main.js'), cj = leer('src/cantina-juego.js');
  ok(pl.includes('data-ajuste="borrachera"') && pl.includes('data-valor="suave"') && pl.includes('data-valor="apagado"'), 'la plantilla: normal, suave o apagado');
  ok(main.includes('movimientoCamara') && /efectoEbrio/.test(cj) && /ajusteBorrachera/.test(cj) && /movimientoCamara/.test(cj), 'con la cámara en «Reducido», casi nada');
  ok(main.includes("if (modo === 'jugando' && cantinaJuego && !desafio)") || /cantinaJuego\.efectoEbrio/.test(main), 'main: la deriva al caminar, sólo jugando y sin el Desafío');
}

// ---------------------------------------------------------------- 4. el romance
{
  ok(AM.ORDEN_CANDIDATAS.includes('moza') && AM.ORDEN_CANDIDATAS.includes('bailarina'), 'Lucrecia y Dalia, candidatas del romance');
  ok(AM.SOLO_SUYA.includes('moza') && AM.SOLO_SUYA.includes('bailarina'), 'las dos sólo viven en su casa, no en el refugio');
  for (const k of ['moza', 'bailarina']) {
    const c = AM.CANDIDATAS[k];
    ok(c && Number.isFinite(c.edad) && c.edad >= AM.EDAD_ADULTA && c.civil === 'soltera' && A.VECINOS_ALDEA[k].nombre, `${k}: adulta, soltera y con nombre`);
    const v = AV.VOCES_AMOR[k];
    ok(v && v.piropo && v.celos && v.celosRival, `${k}: las voces del romance (piropo, celos, rivalidad, por qué no al refugio)`);
  }
  ok(AM.CANDIDATAS.bailarina.edad >= 25 && AM.AMOR.rivales.baja === 10 && AM.AMOR.rivales.dias === 2, 'Dalia es una mujer hecha y derecha; y salir con las dos a la vez cuesta más (rivales)');
  const lj = leer('src/amor-juego.js'), me = leer('src/amor-escenas.js');
  ok(lj.includes('SOLO_SUYA') && me.includes('cantina: { pose'), 'amor-juego: nada de refugio para ellas; amor-escenas: la cita en la cantina');
  ok(leer('src/amor.js').includes("const rivales = ellas.includes('moza') && ellas.includes('bailarina')"), 'amor.js: la rivalidad (salir con las dos cuesta caro)');
}

// ---------------------------------------------------------------- 5. el cuerpo, la ropa y las poses
{
  const gc = leer('src/gente-cuerpo.js'), g = leer('src/gente.js'), gr = leer('src/gente-ropa.js');
  ok(/tacos/.test(gc) && /tajo/.test(gc) && /busto/.test(gc) && /cadera/.test(gc), 'gente-cuerpo: tacos, tajo, curvas');
  ok(/aldea-bailarina/.test(gr) && /#d?[0-9a-f]{6}/i.test(gr.slice(gr.indexOf('aldea-bailarina'), gr.indexOf('aldea-bailarina') + 900)), 'la ropa de Dalia: vestido negro, flor roja y tacos rojos (aspecto propio)');
  const poses = Object.keys((await import('../src/gente-cuerpo.js')).POSES_BAILE);
  ok(['tango', 'chamame-solo', 'bombo'].every((p) => poses.includes(p)), `las poses de baile y del bombo (${poses.join(', ')})`);
  ok(g.includes("'tango', 'chamame-solo', 'bombo'") && g.includes("'cartas'"), 'gente.js: sus ids y la pose de las cartas');
  ok(/bandeja/.test(gc) && /alzado/.test(gc), 'la bandeja parada, también quieta, en alto');
  // la fluidez: ni una luz dinámica nueva ni sombras
  for (const f of ['src/pena-mundo.js', 'src/pena-juego.js', 'src/pena.js']) ok(!/new THREE\.(Point|Spot|Directional)Light/.test(leer(f)) && !/castShadow = true/.test(leer(f)), `${f}: ni luces ni sombras propias`);
  const arq = leer('src/aldea-arquitectura.js');
  ok(!/new THREE\.PointLight/.test(arq.slice(0, 0)) && arq.includes('cama-2'), 'la cantina: la cama de Dalia (sin luces de más)');
}

// ---------------------------------------------------------------- 6. el juego de la peña
{
  const pj = leer('src/pena-juego.js'), pm = leer('src/pena-mundo.js'), main = leer('src/main.js');
  ok(pj.includes('export function crearPenaJuego') && pj.includes('RADIO_PENA'), 'pena-juego.js: crearPenaJuego');
  ok(main.includes("fallaSistema('pena'") && /crearPenaJuego\(/.test(main) && /crearPenaMundo\(/.test(main), 'main: la peña, aislada con fallaSistema');
  ok(/RADIO_PENA/.test(pj) && /distancia/.test(pm), 'lejos no calcula nada');
  ok(/abrirPanelLibre/.test(pj) && /manos\??\./.test(pj) || /bailar-lento/.test(pj) || /manosSociales/.test(pj), 'el baile con Dalia reusa el sistema de baile (Pocha) y el panel libre de la cantina');
  ok(/guitarra/.test(pm) && /bombo/.test(pm) && /pulsar|tono|golpeRuido/.test(pm) && /musica/.test(pm), 'la música, sintetizada por código en el bus de la música (baja cuando hablás con Lucrecia)');
  ok(/murmullo/.test(pj), 'el murmullo de los parroquianos');
  ok(/jugarTruco/.test(pj) && /truco/.test(pj), 'el truco de la cantina reusa src/truco.js');
  const te = leer('src/truco.js');
  ok(/bailarina: \{/.test(te), 'truco.js: el carácter de Dalia');
}

// ---------------------------------------------------------------- 7. el guardado y los enganches
{
  const gd = leer('src/guardado.js'), v = leer('src/vecindad.js');
  ok(gd.includes('sanearAjusteBorrachera') && gd.includes("borrachera: 'normal'"), 'guardado.js: el ajuste, con normal por defecto (las partidas de antes no lo traen)');
  ok(/chistes|ebrio|memoria/i.test(leer('src/cantina-juego.js')), 'cantina-juego.js: la memoria de chistes y el estado de ebriedad en la partida');
  ok(v.includes('bailarina:') && v.includes("'cantina'") && v.includes('/^cama/'), 'vecindad.js: Dalia con su perfil, la cantina como trabajo');
  ok(A.rutinaAldea('bailarina', 12, 2, A.aldeaNueva(), 9).lugar !== undefined, 'una partida vieja (sin nada guardado de Dalia) tiene rutina de Dalia');
}

// ---------------------------------------------------------------- 8. los textos
{
  const { EN } = await import('../src/idioma-en.js');
  const { crearTraductor } = await import('../src/idioma.js');
  const V = await import('../src/vecindad-voces.js');
  const S = await import('../src/vecindad-social-voces.js');
  const t = crearTraductor(EN, 'en').t;
  const textos = new Set(P.textosPena());
  const rec = (x) => { if (typeof x === 'string') textos.add(x); else if (Array.isArray(x)) x.forEach(rec); else if (x && typeof x === 'object') for (const [k, y] of Object.entries(x)) if (k !== 'cumplir' && k !== 'id') rec(y); };
  rec(PV.VECINDAD_BAILARINA); rec(PV.AYUDAS_BAILARINA); rec(PV.SOCIAL_BAILARINA); rec(PV.EXTRANA_BAILARINA); rec(PV.AMOR_MOZA); rec(PV.AMOR_BAILARINA);
  { const d = A.VECINOS_ALDEA.bailarina; rec([d.oficio, d.saludo, d.despedida, d.charla]); }
  for (const M of [V, S]) for (const x of Object.values(M)) if (x && typeof x === 'object' && !Array.isArray(x) && x.bailarina) rec(x.bailarina);
  rec(S.VOCES_SOCIAL_AMOR.moza); rec(S.VOCES_SOCIAL_AMOR.bailarina);
  // las charlas entre vecinos que nombran a Dalia
  for (const c of A.CHARLAS_ALDEA) if (c.lineas.some(([k]) => k === 'bailarina')) rec(c.lineas.map(([, l]) => l));
  const IDS = /^(material|cosa|tabla|yerba|tronco|miel|lana|hecho|regalo|interaccion|tren|ranchera|[a-z]+-dalia|baul-vestuario|lana-roja|pan-casero|frasco-frutilla|empanadas|calafate-seco)$/;
  const lista = [...textos].filter((x) => typeof x === 'string' && x.trim() && !IDS.test(x));
  const sin = lista.filter((x) => {
    // el traductor trabaja con el texto ya armado: se prueba con la marca puesta como hueco (en orden)
    const molde = x.replace(/\{[a-zñ]+\}/gi, '{#}');
    const con = (() => { let i = 0; return x.replace(/\{[a-zñ]+\}/gi, () => `{${i++}}`); })();
    const armado = x.replace(/\{[a-zñ]+\}/gi, 'Tincho');
    return !(Object.hasOwn(EN, x) || Object.hasOwn(EN, con)) && molde !== '' && armado !== '';
  });
  ok(lista.length >= 200 && sin.length === 0, `todo lo de la peña, Dalia y los chistes tiene su inglés (${lista.length} textos; faltan ${sin.length}: ${sin.slice(0, 30).join(' | ')})`);
  const prohibido = /\b(dios|dioses|misa|virgen|bendic\w*|bendit\w*|rez\w+|iglesia|capilla|cura|curas|santo|santa|sagrad\w*|milagro\w*|ángel\w*|amén|pecado|cielo santo|altar)\b/i;
  for (const x of lista) assert.ok(!prohibido.test(x), `nada religioso: «${x}»`);
  n++;
  // los chistes en inglés mantienen la gracia: ninguno quedó igual que en castellano ni vacío
  const chistes = []; const r2 = (x) => { if (typeof x === 'string') chistes.push(x); else if (Array.isArray(x)) x.forEach(r2); else if (x && typeof x === 'object') Object.values(x).forEach(r2); }; r2(PV.CHISTES);
  ok(chistes.every((x) => { const en = EN[x]; return en && en !== x && en.length > 12; }), 'cada chiste tiene su versión en inglés (no una copia)');
  const pk = JSON.parse(leer('package.json'));
  ok(pk.version === '3.9.1', 'la versión: 3.9.1');
  const lis = fs.existsSync(new URL('../CAMBIOS_3_9_1.md', import.meta.url)) ? leer('CAMBIOS_3_9_1.md') : '';
  ok(lis.length > 2000 && /chistes/i.test(lis), 'CAMBIOS_3_9_1.md: lo que hay, lo que no, cómo verlo y la lista de chistes');
  const enLista = chistes.filter((x) => !lis.includes(x.slice(0, 24)));
  ok(enLista.length === 0, `CAMBIOS_3_9_1.md lista todos los chistes (faltan ${enLista.length})`);
}

console.log(`OK 3.9.1 peña · ${n} verificaciones · el núcleo, los chistes, la borrachera, el romance, el cuerpo, el juego, el guardado y los textos`);
