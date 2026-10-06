// 3.7.1 "Amor en la aldea" (PLAN_3_7.md): el núcleo, sin Electron (src/amor.js, src/amor-voces.js,
// src/amor-juego.js, y lo que se engancha en vecindad-juego.js, guardado.js, main.js y la plantilla).
//  · la elegibilidad, garantizada por reglas: nunca chicos (en ninguna etapa), nunca casados, nunca Pocha, nunca
//    con el ajuste apagado; ni con un guardado retocado;
//  · las etapas (conocidos → coqueteo → saliendo → novios → comprometidos → casados → separados) y que ella
//    puede decir que no;
//  · las citas según los horarios; el chisme y los celos si salís con más de una; el anillo, el casamiento civil,
//    vivir juntos;
//  · el ñiki ñiki (sólo de noche, conviviendo, con los hijos dormidos), hasta dos hijos, que crecen;
//  · las habilidades, una por estación; la separación por descuido y la reconquista;
//  · el guardado: partidas viejas, el Desafío, partidas rotas; el ajuste; el menú de la charla; la API del mundo.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as M from '../src/amor.js';
import * as VZ from '../src/amor-voces.js';
import * as A from '../src/aldea.js';
import * as V from '../src/vecindad.js';
import * as VJ from '../src/vecindad-juego.js';
import * as AJ from '../src/amor-juego.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const copia = (x) => JSON.parse(JSON.stringify(x));
const CAND = M.ORDEN_CANDIDATAS;
// una aldea con todos viviendo y los locales abiertos
const aldeaCompleta = () => {
  const a = A.aldeaNueva();
  a.pobladores = A.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 }));
  a.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
  return A.sanearAldea(a);
};
const partida = (extra = {}) => ({ dia: 1, horas: 10, entradas: { canto: { dia: 1, hora: 9, cantidad: 3 } }, materiales: {}, cosas: {}, aldea: aldeaCompleta(), vecindad: V.vecindadNueva(), amor: M.amorNuevo(), ...extra });
const amigos = (p, k) => { for (let d = 1; d <= 6; d++) V.regalar(k, V.PERFILES_VECINOS[k].gustos.encanta[0], p, d, () => 99); };
// lleva a `k` hasta `etapa` con las reglas (sin tocar el estado a mano)
function llevarHasta(p, k, etapa, d0 = 1) {
  amigos(p, k);
  let d = d0;
  const f = () => p.amor.personas[k];
  for (let g = 0; g < 80 && M.ETAPAS_AMOR.indexOf(f()?.etapa || 'conocidos') < M.ETAPAS_AMOR.indexOf(etapa); g++, d++) {
    p.dia = d; p.horas = 9;
    M.pasarDiaAmor(p, d);
    M.verla(p, k, {});
    M.coquetear(p, k, {});
    const et = f().etapa;
    if (!p.amor.cita && ['coqueteo', 'saliendo', 'novios'].includes(et)) { p.horas = 9.5; M.invitarACita(p, k, 'plaza', { semilla: g }); }
    const c = p.amor.cita;
    if (c && c.dia === d) { p.horas = c.desde; M.empezarCita(p, {}); M.terminarCita(p, {}); }
    p.horas = 20;
    if (f().etapa === 'saliendo' && etapa !== 'saliendo') M.declararse(p, k, { semilla: g, lugar: M.CANDIDATAS[k].favorito });
    if (f().etapa === 'novios' && etapa !== 'novios') {
      if (!p.amor.anillo) M.encargarAnillo(p, {});
      if (M.anilloListo(p, d)) M.retirarAnillo(p, {});
      if (M.tenesAnillo(p)) M.proponer(p, k, { semilla: g, lugar: M.CANDIDATAS[k].favorito });
    }
    if (p.amor.boda && p.amor.boda.dia === d) { p.horas = 11; M.casarse(p, {}); }
  }
  return d;
}

// ============================================================ 0. los módulos y los enganches
{
  for (const f of ['src/amor.js', 'src/amor-voces.js', 'src/amor-juego.js']) {
    const t = leer(f);
    ok(!/from 'three'|document\.|window\.|localStorage/.test(t), `${f} es puro`);
    ok(!/^export\s+(async\s+function|function\*|\*|.*\sfrom\s)/m.test(t) && !/^import\s+'/m.test(t), `${f}: lo que entiende armar.mjs`);
    for (const m of t.matchAll(/^import .*$/gm)) ok(/^import \{ [\w, ]+ \} from '\.\/[\w-]+\.js';$/.test(m[0]), `import en una línea: ${m[0]}`);
    ok(!t.includes('\r'), `${f}: fines de línea LF`);
    ok(/^\/\/ 3\.7\.1:/.test(t), `${f}: comentario con la versión`);
  }
  for (const k of [...Object.keys(M), ...Object.keys(VZ), ...Object.keys(AJ)]) ok(!/ñ/.test(k), `export sin eñe: ${k}`);
  ok(leer('package.json').includes('node pruebas/verificar-3-7-1-amor.mjs'), 'la prueba está en el gate');
  const g = leer('src/guardado.js');
  ok(g.includes("import { sanearAmor, amorNuevo, sanearAjusteRomance } from './amor.js';") && g.includes('amor: amorNuevo() }),') && g.includes('amor: sanearAmor(p.amor, Math.max(1, Math.floor(finito(p.dia, 1)))),'), 'guardado.js guarda el amor');
  ok(g.includes('aldea: undefined, vidaAldea: undefined, amor: undefined') && g.includes('romance: true,') && g.includes('romance: sanearAjusteRomance(x.romance),'), 'en el Desafío no hay amor; el ajuste, encendido de fábrica');
  const pl = leer('src/plantilla.html');
  ok(pl.includes('<div class="segmentos" data-ajuste="romance"><button data-valor="true">Encendido</button><button data-valor="false">Apagado</button></div>'), 'el ajuste en la plantilla');
  const main = leer('src/main.js');
  for (const t of [
    "import { crearAmorJuego } from './amor-juego.js';", 'amorJuego = crearAmorJuego({', 'amor: amorJuego,', "if (!desafio) amorJuego?.actualizar(dt);",
    "if (clave === 'romance') v = v === 'true';", 'const deAmor = !desafio ? amorJuego?.hablar(npc) : null;', 'amorJuego?.alCerrar();',
    "else if (r.tipo === 'fundido') charla.historia = { id: 'amor-fundido'", 'function fundidoAmor(r) {',
    "else if (vecino) aviso = { tecla: 'E', texto: (!desafio && amorJuego?.textoAviso(vecino)) || (vecindadJuego?.invitado(vecino) === 'esperando'",
  ]) ok(main.includes(t), `main.js: ${t.slice(0, 80)}`);
  // la tecla E y el aviso: lo de la cita va en la rama del vecino en los dos (hablar() lo resuelve primero)
  const iE = main.indexOf('if (vecino) { hablar(vecino); break; }'), iAviso = main.indexOf('amorJuego?.textoAviso(vecino)');
  ok(iE > 0 && iAviso > 0 && main.indexOf('const deAmor = !desafio ? amorJuego?.hablar(npc) : null;') < main.indexOf('const deLaAldea = npc.poblador && aldeaGente ? aldeaGente.charla(npc) : null;'), 'E y el aviso con la misma prioridad');
  const vj = leer('src/vecindad-juego.js');
  ok(vj.includes('for (const o of ctx.amor?.opciones?.(s.clave) || []) lista.push(o);') && vj.includes('const amor = ctx.amor?.alAbrir?.(clave) || null;'), 'vecindad-juego.js: el amor en el menú y al saludar');
}

// ============================================================ 1. la elegibilidad (lo que pidió el usuario: por reglas)
{
  const todos = [...new Set([...A.ORDEN_PERSONAS_ALDEA, ...V.PERSONAS_VECINDAD, 'nadie', '', null, undefined, '__proto__', 'constructor', 'hijo-1'])];
  const si = todos.filter((k) => M.esCandidata(k));
  eq(si.sort(), [...CAND].sort(), 'las candidatas: sólo las de la lista');
  for (const k of CAND) {
    const p = A.personaAldea(k);
    ok(!p.chico && !p.pareja && p.romance !== false && (p.edad ?? M.CANDIDATAS[k].edad) >= M.EDAD_ADULTA && M.CANDIDATAS[k].civil === 'soltera', `${k}: adulta y soltera`);
    ok(A.esPobladora37(k) ? p.edad === M.CANDIDATAS[k].edad : true, `${k}: la edad de aldea.js`);
    ok(V.esPersonaVecindad(k) && !!VZ.VOCES_AMOR[k] && !!M.HABILIDADES[k] && M.esLugarCita(M.CANDIDATAS[k].favorito), `${k}: voces, habilidad y lugar favorito`);
  }
  // nunca chicos, nunca casados, nunca Pocha
  for (const k of ['nene', 'nena', 'padre', 'madre', 'modista', 'herrero', 'abuela', 'ercilia', 'ema', 'guarda']) ok(!M.esCandidata(k), `nunca: ${k}`);
  ok(A.sinRomance('modista') && A.POBLADORES_ALDEA.modista.pareja === 'herrero', 'Pocha tiene pareja (aldea.js)');
  // los chicos de la aldea, en cualquier etapa (también de jóvenes)
  const p = partida({ dia: 200 });
  for (let e = 0; e < A.ETAPAS_CHICOS.length; e++) {
    for (const k of A.CHICOS_ALDEA) p.aldea.chicos[k].etapa = e;
    for (const k of A.CHICOS_ALDEA) ok(!M.puedeRomance(k, p).ok && !M.coquetear(p, k, {}).ok && !M.invitarACita(p, k, 'plaza', {}).ok && !M.declararse(p, k, {}).ok && !M.proponer(p, k, {}).ok, `chico ${k} en la etapa ${A.ETAPAS_CHICOS[e]}: nada`);
  }
  ok(!Object.keys(p.amor.personas).some((k) => !M.esCandidata(k)), 'ni una ficha de alguien que no es candidata');
  // si los datos cambiaran (una edad, una pareja), la regla corta igual
  const vet = A.POBLADORES_ALDEA.veterinaria;
  vet.edad = 16; ok(!M.esCandidata('veterinaria'), 'menor de edad: nunca'); vet.edad = 29;
  vet.pareja = 'carpintero'; ok(!M.esCandidata('veterinaria'), 'con pareja: nunca'); delete vet.pareja;
  ok(M.esCandidata('veterinaria'), 'y vuelve');
  // con el ajuste apagado, nada con nadie
  for (const k of CAND) {
    const q = partida();
    ok(M.puedeRomance(k, q, { romance: false }).motivo === 'apagado' && !M.coquetear(q, k, { romance: false }).ok && !M.invitarACita(q, k, 'plaza', { romance: false }).ok
      && !M.regalarFlores(q, k, { romance: false }).ok && !M.mandarCorreo(q, 'carta', k, { romance: false }).ok && M.verla(q, k, { romance: false }) === null, `apagado: nada con ${k}`);
    ok(Object.keys(q.amor.personas).length === 0, 'apagado: ni una ficha');
  }
  // la que todavía no llegó a la aldea
  const r = partida(); r.aldea = A.aldeaNueva();
  ok(M.puedeRomance('pintora', r).motivo === 'no-llego' && M.puedeRomance('galesa', r).ok, 'la pobladora que no llegó, no; la vecina de siempre, sí');
  // un guardado retocado no mete a nadie más
  const roto = M.sanearAmor({ personas: { nena: { etapa: 'casados', afecto: 100 }, modista: { etapa: 'novios' }, madre: { etapa: 'saliendo' }, nene: { etapa: 'comprometidos' }, padre: { etapa: 'casados' }, veterinaria: { etapa: 'novios', afecto: 50 } }, conyuge: 'nena', convivencia: { con: 'modista', donde: 'refugio' }, hijos: [{ madre: 'nena', nombre: 'X' }, { madre: 'modista' }], boda: { con: 'madre', dia: 3 }, cita: { clave: 'nena', lugar: 'plaza', dia: 1, desde: 18, hasta: 19.5 } }, 10);
  eq(Object.keys(roto.personas), ['veterinaria'], 'saneado: sólo la candidata');
  ok(roto.conyuge === null && roto.convivencia === null && roto.hijos.length === 0 && roto.boda === null && roto.cita === null, 'saneado: ni cónyuge, ni convivencia, ni hijos, ni boda, ni cita con quien no puede');
}

// ============================================================ 2. las etapas, de punta a punta (y que puede decir que no)
{
  const p = partida();
  const k = 'veterinaria';
  ok(!M.invitarACita(p, k, 'plaza', {}).ok, 'de entrada no sale con vos');
  const r1 = M.coquetear(p, k, {});
  ok(r1.ok && ['gusto', 'rie', 'no'].includes(r1.resultado) && r1.renglones[0].length > 10, 'un piropo, con su respuesta');
  ok(M.coquetear(p, k, {}).motivo === 'ya-hoy', 'uno por día');
  let d = llevarHasta(p, k, 'coqueteo');
  ok(p.amor.personas[k].etapa === 'coqueteo' && p.amor.personas[k].afecto >= M.AMOR.piropo.umbral, 'con 15 de afecto, coqueteo');
  d = llevarHasta(p, k, 'saliendo', d);
  ok(p.amor.personas[k].etapa === 'saliendo' && p.amor.personas[k].citas >= 1, 'la primera cita: saliendo');
  d = llevarHasta(p, k, 'novios', d);
  ok(p.amor.personas[k].etapa === 'novios' && p.amor.personas[k].citas >= M.AMOR.declararse.citas, 'declararse (con tres citas y ya amigos): novios');
  ok(p.amor.noticias.some((x) => x.tipo === 'novios'), 'la aldea se entera');
  d = llevarHasta(p, k, 'casados', d);
  ok(p.amor.personas[k].etapa === 'casados' && p.amor.conyuge === k && p.amor.anillo.para === k && p.amor.boda === null, 'el anillo, el casamiento civil: casados');
  ok(d < 40, `en un tiempo de juego razonable (${d} días jugando todos los días)`);
  ok(!M.proponer(p, 'fotografa', {}).ok && M.puedeRomance('fotografa', p).motivo === 'tenes-pareja', 'casado: nada con nadie más');
  // ella puede decir que no (declararse con poco afecto y fuera de su lugar)
  let no = 0, si = 0;
  for (let s = 0; s < 40; s++) {
    const q = partida({ dia: 20 });
    amigos(q, 'pintora');
    q.amor.personas.pintora = { ...copia(M.sanearAmor({ personas: { pintora: { etapa: 'saliendo', afecto: 32, citas: 3 } } }).personas.pintora) };
    const r = M.declararse(q, 'pintora', { semilla: s, dia: 20 });
    if (r.ok && r.si === false) no++; else if (r.si) si++;
  }
  ok(no > 0 && si > 0, `declararse: a veces sí (${si}) y a veces no (${no})`);
  ok(M.chanceDeclararse({ afecto: 60 }, 'pintora', { lugar: 'cueva' }, 5) > M.chanceDeclararse({ afecto: 60 }, 'pintora', {}, 5), 'en su lugar favorito, más chance');
  ok(M.chanceDeclararse({ afecto: 20 }, 'pintora', { lugar: 'cueva' }, 5) === 0, 'sin afecto, no');
  // el no tiene espera
  const q = partida({ dia: 20 });
  amigos(q, 'pintora');
  q.amor = M.sanearAmor({ personas: { pintora: { etapa: 'saliendo', afecto: 31, citas: 3, rechazo: 19 } } }, 20);
  ok(M.declararse(q, 'pintora', { dia: 20 }).motivo === 'espera', 'después de un no, hay que esperar');
}

// ============================================================ 3. las citas, según los horarios
{
  const p = partida({ dia: 3, horas: 9 });
  for (const k of CAND) {
    for (const lugar of M.lugaresDeCita(k, p.aldea)) {
      const h = M.huecoDeCita(p, k, lugar, {});
      if (!h) continue;
      const ds = A.diaSemanaDe(h.dia), L = M.LUGARES_CITA[lugar];
      const [h0, h1] = L.horas;
      ok(h.hasta - h.desde === M.AMOR.cita.duracion && (h.dia === 3 || h.dia === 4) && (!L.dias || L.dias.includes(ds)), `${k} en ${lugar}: el día y las horas`);
      if (!L.rutina && !(k === 'astronoma' && lugar === 'observatorio')) ok(V.estaLibre(k, h.desde, ds, p) && V.estaLibre(k, h.hasta - 0.1, ds, p), `${k} en ${lugar}: está libre (${h.desde})`);
      if (k !== 'galesa') ok(h.desde >= h0 && h.hasta <= h1 + 1e-9, `${k} en ${lugar}: dentro del horario del lugar`);
    }
  }
  ok(M.huecoDeCita(p, 'astronoma', 'observatorio', {})?.desde >= 20.5, 'la astrónoma, en su observatorio de noche');
  const sab = partida({ dia: 6, horas: 9 });   // el día 6 es sábado
  ok(A.diaSemanaDe(6) === 5 && M.huecoDeCita(sab, 'pintora', 'baile', {})?.dia === 6 && M.huecoDeCita(partida({ dia: 2, horas: 9 }), 'pintora', 'baile', {}) === null, 'el baile, sólo el sábado');
  ok(M.huecoDeCita(p, 'galesa', 'casa-te', {})?.desde >= 20, 'Ceinwen, en la casa de té al cerrar');
  // plantada: si no vas, te esperó y se fue
  const q = partida();
  amigos(q, 'botera');
  q.amor = M.sanearAmor({ personas: { botera: { etapa: 'coqueteo', afecto: 40, contacto: 1 } } }, 1);
  let r = null;
  for (let s = 0; s < 20 && !r?.ok; s++) r = M.invitarACita(q, 'botera', 'muelle', { semilla: s });
  ok(r.ok && q.amor.cita?.lugar === 'muelle' && r.renglones.length === 2, 'acepta y dice cuándo');
  ok(M.invitarACita(q, 'botera', 'plaza', {}).motivo === 'ya-hay', 'una cita por vez');
  const antes = q.amor.personas.botera.afecto;
  q.dia = q.amor.cita.dia; q.horas = q.amor.cita.hasta + 0.5;
  const v = M.vencerCita(q, {});
  ok(v?.tipo === 'plantada' && q.amor.cita === null && q.amor.personas.botera.afecto < antes && q.amor.personas.botera.enojo >= q.dia, 'plantada: baja el afecto y se enoja');
}

// ============================================================ 4. el chisme y los celos (salir con más de una)
{
  const p = partida();
  p.amor = M.sanearAmor({ personas: { pintora: { etapa: 'saliendo', afecto: 50, contacto: 10 }, ceramista: { etapa: 'novios', afecto: 60, contacto: 10 } } }, 10);
  let dia = 10, ev = null;
  for (; dia < 40 && !ev; dia++) { p.amor.personas.pintora.contacto = dia; p.amor.personas.ceramista.contacto = dia; ev = M.pasarDiaAmor(p, dia + 1, { ritmo: 'animado' }).eventos.find((e) => e.tipo === 'chisme'); }
  ok(!!ev && ev.claves.length === 2, `el chisme corre (día ${dia})`);
  const d = p.amor.dia;
  ok(['pintora', 'ceramista'].every((k) => p.amor.personas[k].enojo >= d && p.amor.personas[k].motivo === 'celos'), 'las dos se enojan');
  ok(M.coquetear(p, 'pintora', { dia: d }).motivo === 'enojada' && M.invitarACita(p, 'ceramista', 'plaza', { dia: d }).motivo === 'enojada', 'enojadas: no hay piropo ni cita');
  ok(p.amor.noticias.some((x) => x.tipo === 'dos-a-la-vez'), 'y queda como noticia (para los vecinos y la radio)');
  const dicho = M.comentarioDeAmor(p, 'modista', { dia: d, chismoso: true });
  ok(typeof dicho === 'string' && /Abril|Malena/.test(dicho), `Pocha lo comenta: ${dicho}`);
  ok(M.comentarioDeAmor(p, 'modista', { dia: d, chismoso: true }) === null, 'una vez cada novedad');
  ok(M.comentarioDeAmor(p, 'pintora', { dia: d }) === null, 'ella no comenta lo suyo');
  // con una sola, no hay chisme
  const q = partida();
  q.amor = M.sanearAmor({ personas: { pintora: { etapa: 'novios', afecto: 70, contacto: 10 } } }, 10);
  let hubo = false;
  for (let x = 11; x < 60; x++) { q.amor.personas.pintora.contacto = x; hubo ||= M.pasarDiaAmor(q, x, { ritmo: 'animado' }).eventos.some((e) => e.tipo === 'chisme'); }
  ok(!hubo, 'con una sola, no hay chisme');
  // el ritmo tranquilo corre menos que el animado
  ok(M.AMOR.celos.chance.tranquilo < M.AMOR.celos.chance.normal && M.AMOR.celos.chance.normal < M.AMOR.celos.chance.animado, 'el ritmo de la aldea manda en el chisme');
  // al comprometerte con una, las otras cortan
  const r = partida({ dia: 30 });
  r.amor = M.sanearAmor({ personas: { pintora: { etapa: 'novios', afecto: 95, desde: 20, contacto: 30 }, ceramista: { etapa: 'saliendo', afecto: 40, contacto: 30 } }, anillo: { pedido: 22, listo: 25, retirado: true } }, 30);
  let pr = null;
  for (let s = 0; s < 10 && !pr?.si; s++) pr = M.proponer(r, 'pintora', { semilla: s });
  ok(pr.si && pr.cortaron.includes('ceramista') && r.amor.personas.ceramista.etapa === 'conocidos' && r.amor.boda?.dia === 33, 'se compromete: la boda en tres días, y la otra corta');
}

// ============================================================ 5. el ñiki ñiki y los hijos (hasta dos)
{
  const p = partida({ dia: 50, horas: 22 });
  p.amor = M.sanearAmor({ personas: { herbolaria: { etapa: 'casados', afecto: 90, contacto: 50, desde: 40 } }, conyuge: 'herbolaria' }, 50);
  ok(M.nikiNiki(p, 'herbolaria', {}).motivo === 'no', 'sin vivir juntos, no');
  ok(M.convivir(p, 'herbolaria', 'refugio', {}).si && M.dondeViven(p).edificio === 'refugio', 'casados: eligen el refugio');
  p.horas = 14; ok(M.nikiNiki(p, 'herbolaria', {}).motivo === 'dia', 'de día, no');
  p.horas = 22;
  ok(M.nikiNiki(p, 'herbolaria', { enCasa: false }).motivo === 'casa', 'fuera de casa, no');
  const r = M.nikiNiki(p, 'herbolaria', { enCasa: true });
  ok(r.ok && r.fundido && r.efectos.some((e) => e.campo === 'descansado' && e.valor > 0) && r.efectos.some((e) => e.campo === 'entumecido' && e.valor === 0), 'el fundido: descanso y sin entumecido');
  ok(M.deBuenAnimo(p, 50) && M.nikiNiki(p, 'herbolaria', {}).motivo === 'hoy', 'buen ánimo; una vez por noche');
  ok(M.nikiNiki(p, 'herbolaria', { dia: 51, hora: 2 }).motivo === 'hoy', 'la madrugada es la misma noche');
  // sin texto explícito: sólo el fundido
  const textos = JSON.stringify([VZ.FRASES_AMOR.nikiAntes, VZ.FRASES_AMOR.nikiSinChicos, VZ.FRASES_AMOR.nikiDespues, VZ.FRASES_AMOR.nikiNo]);
  ok(!/sexo|desnud|cuerpo|besos? apasion|piel|sensual|er[oó]tic/i.test(textos), 'el ñiki ñiki, sin describir nada');
  // los hijos: se buscan, llegan, crecen; nunca más de dos
  ok(M.hablarDeLosChicos(p, 'herbolaria', {}).ofrece === true && M.buscarHijo(p, 'herbolaria', {}).si, 'hablar de los chicos: deciden buscar uno');
  let nacidos = 0, x = 50;
  for (; x < 200; x++) {
    const ev = M.pasarDiaAmor(p, x).eventos;
    nacidos += ev.filter((e) => e.tipo === 'nacio').length;
    p.amor.personas.herbolaria.contacto = x;
    if (M.puedeBuscarHijo(p, 'herbolaria')) M.buscarHijo(p, 'herbolaria', { dia: x });
    M.nikiNiki(p, 'herbolaria', { dia: x, hora: 23.5, enCasa: true });
    ok(p.amor.hijos.length <= M.AMOR.hijos.max, 'nunca más de dos');
  }
  ok(nacidos === 2 && p.amor.hijos.length === 2 && !p.amor.buscan && !p.amor.embarazo, `nacieron dos (${p.amor.hijos.map((h) => h.nombre).join(' y ')})`);
  ok(p.amor.hijos[0].nombre !== p.amor.hijos[1].nombre && p.amor.hijos.every((h) => !M.esCandidata(h.id) && !M.esCandidata(h.nombre)), 'nombres distintos; los hijos nunca son candidatos');
  ok(M.buscarHijo(p, 'herbolaria', {}).renglones[0] === VZ.FRASES_AMOR.maximoHijos, 'con dos, la casa está llena');
  const h0 = p.amor.hijos[0];
  ok(M.etapaHijo(h0, h0.nacio) === 0 && M.etapaHijo(h0, h0.nacio + 12) === 1 && M.etapaHijo(h0, h0.nacio + 36) === 3 && M.etapaHijo(h0, h0.nacio + 500) === 3, 'crecen una etapa por año, como los chicos de la aldea');
  ok(M.AMOR.hijos.embarazo === 8, 'el embarazo: ocho días (dos estaciones)');
  // los hijos despiertos no dejan
  const q = partida({ dia: 100 });
  q.amor = M.sanearAmor({ personas: { botera: { etapa: 'casados', afecto: 90, contacto: 100 } }, conyuge: 'botera', convivencia: { con: 'botera', donde: 'suya', desde: 60 }, hijos: [{ madre: 'botera', nombre: 'Lihuel', sexo: 'nene', nacio: 76 }] }, 100);
  ok(M.hijosDe(q, 100)[0].etapa === 'adolescente', 'un adolescente en casa');
  ok(M.nikiNiki(q, 'botera', { dia: 100, hora: 21.5 }).motivo === 'chicos', 'despierto en su cuarto a las 21:30: todavía no');
  ok(M.nikiNiki(q, 'botera', { dia: 100, hora: 22.5 }).ok, 'dormido: sí');
  const rh = M.rutinaHijo(q, 0, 23, A.diaSemanaDe(100), 100);
  ok(rh.edificio === 'varadero' && rh.punto === 'cama-hijo-1', 'duerme en su cuarto, en la casa de ella');
  ok(M.hijosDormidos(q, 23, 0, 100) && !M.hijosDormidos(q, 16, 0, 100), 'hijosDormidos');
}

// ============================================================ 6. las habilidades: una por estación (hasta tres)
{
  const p = partida({ dia: 12 });
  p.amor = M.sanearAmor({ personas: { andinista: { etapa: 'comprometidos', afecto: 90, contacto: 12 } }, boda: { con: 'andinista', dia: 12 } }, 12);
  p.horas = 11;
  ok(M.casarse(p, {}).ok, 'se casan el día 12 (último día del invierno)');
  const niveles = [];
  for (let d = 13; d <= 40; d++) {
    p.amor.personas.andinista.contacto = d;
    const r = M.pasarDiaAmor(p, d);
    for (const e of r.eventos.filter((x) => x.tipo === 'habilidad')) niveles.push([d, e.nivel]);
  }
  eq(niveles, [[13, 1], [17, 2], [21, 3]], 'a la mañana siguiente, el primero; después, uno por estación');
  eq(M.habilidadesDe(p)[0].niveles, M.HABILIDADES.andinista.niveles.map((x) => x.nombre), 'los tres niveles de Rocío');
  const ef = M.efectosDeHabilidades(p, 40);
  ok(ef.some((e) => e.k === 'pinon' && e.n === 3) && ef.some((e) => e.k === 'calafate-seco') && ef.some((e) => e.campo === 'descansado'), 'lo que rinde cada mañana');
  const r2 = M.pasarDiaAmor(p, 41);
  ok(r2.efectos.length > 0 && M.pasarDiaAmor(p, 41).efectos.length === 0, 'una vez por día');
  for (const k of CAND) {
    const h = M.HABILIDADES[k];
    ok(h.niveles.length === 3 && h.niveles.every((x) => x.nombre && x.texto && x.efectos.length && x.efectos.every((e) => ['material', 'cosa', 'entrada', 'jugador', 'aldea'].includes(e.tipo))), `${k}: tres niveles con efectos que el juego sabe aplicar`);
    for (const x of h.niveles) for (const e of x.efectos) if (e.tipo === 'aldea') ok(['herrado', 'calafateado'].includes(e.campo), 'aldea: lo que entiende aplicarAlAldea');
  }
}

// ============================================================ 7. el descuido, la separación y la reconquista
{
  const p = partida({ dia: 60 });
  p.amor = M.sanearAmor({ personas: { fotografa: { etapa: 'casados', afecto: 60, contacto: 60 } }, conyuge: 'fotografa', convivencia: { con: 'fotografa', donde: 'refugio', desde: 50 }, hijos: [{ madre: 'fotografa', sexo: 'nena', nombre: 'Clara', nacio: 40 }] }, 60);
  let sep = null, x = 61;
  for (; x < 120 && !sep; x++) sep = M.pasarDiaAmor(p, x).eventos.find((e) => e.tipo === 'separacion');
  ok(!!sep && p.amor.personas.fotografa.etapa === 'separados' && p.amor.convivencia === null, `sin verla, se separan (día ${x - 1})`);
  ok(x - 1 - 60 > M.AMOR.descuido.casados[0], 'no de un día para el otro');
  // los hijos viven con ella y te visitan
  const d = x;
  let visita = null, casa = null;
  for (let k = 0; k < 7; k++) { const ds = A.diaSemanaDe(d + k); const r = M.rutinaHijo(p, 0, 11, ds, d + k); if (r.lugar === 'visita') visita = ds; casa ||= M.rutinaHijo(p, 0, 23, ds, d + k).edificio; }
  ok(casa === 'estudio-fotos' && [2, 6].includes(visita), 'los hijos viven con ella (su casa) y te visitan en el refugio');
  ok(M.puedeRomance('pintora', p).motivo === 'tenes-pareja', 'separados: igual no hay romance con otra');
  // reconquistarla: verla, una cita, afecto
  ok(M.reconquistar(p, 'fotografa', { dia: d + 10 }).si === false, 'de entrada, todavía no');
  p.dia = d + 10;
  p.amor.personas.fotografa.afecto = 70; p.amor.personas.fotografa.enojo = 0;
  let ci = null;
  for (let s = 0; s < 20 && !ci?.ok; s++) ci = M.invitarACita(p, 'fotografa', 'mirador', { semilla: s, hora: 8 });
  p.dia = p.amor.cita.dia; p.horas = p.amor.cita.desde;
  M.empezarCita(p, {}); M.terminarCita(p, {});
  let vuelve = null;
  for (let s = 0; s < 10 && !vuelve?.si; s++) { p.amor.personas.fotografa.rechazo = 0; vuelve = M.reconquistar(p, 'fotografa', { semilla: s, lugar: 'mirador' }); }
  ok(vuelve.si && p.amor.personas.fotografa.etapa === 'casados' && p.amor.noticias.some((y) => y.tipo === 'volvieron'), 'reconquistada: casados de nuevo');
  // novios descuidados cortan (y la boda se cae)
  const q = partida({ dia: 30 });
  q.amor = M.sanearAmor({ personas: { nelida: { etapa: 'comprometidos', afecto: 40, contacto: 30 } }, boda: { con: 'nelida', dia: 33 } }, 30);
  let corto = null;
  for (let y = 31; y < 60 && !corto; y++) { if (q.amor.boda) q.amor.boda.dia = y + 2; corto = M.pasarDiaAmor(q, y).eventos.find((e) => e.tipo === 'corto'); }
  ok(!!corto && q.amor.boda === null && q.amor.personas.nelida.etapa === 'conocidos' && q.amor.anillo?.para === null && q.amor.anillo?.retirado, 'cortó: sin boda, y el anillo vuelve a tu bolsillo');
}

// ============================================================ 8. el correo, el anillo, la boda que se posterga
{
  const p = partida({ dia: 5 });
  p.amor = M.sanearAmor({ personas: { astronoma: { etapa: 'coqueteo', afecto: 20, contacto: 5 } } }, 5);
  ok(!M.mandarCorreo(p, 'carta', 'herbolaria', {}).ok, 'a una que no conocés de ese modo, no');
  ok(M.mandarCorreo(p, 'carta', 'astronoma', {}).ok && M.mandarCorreo(p, 'ramo', 'astronoma', {}).motivo === 'ya-hoy', 'una carta por día');
  ok(M.mandarCorreo(p, 'ramo', 'astronoma', { dia: 6, invierno: true }).motivo === 'invierno', 'en invierno no hay ramos');
  const ev = M.pasarDiaAmor(p, 6).eventos;
  ok(ev.some((e) => e.tipo === 'correo') && p.amor.personas.astronoma.afecto > 20 && p.amor.correo.length === 0, 'llega con el tren de la mañana');
  p.dia = 6;
  ok(M.verla(p, 'astronoma', {}) === VZ.VOCES_AMOR.astronoma.carta && M.verla(p, 'astronoma', {}) === null, 'y ella te lo dice al verte, una vez');
  // el anillo: con novia, un canto rodado y la herrería abierta; tres días
  const q = partida({ dia: 10 });
  ok(M.encargarAnillo(q, {}).motivo === 'sin-novia', 'sin novia, Anselmo no');
  q.amor = M.sanearAmor({ personas: { enfermera: { etapa: 'novios', afecto: 70, contacto: 10, desde: 5 } } }, 10);
  const sinCanto = partida({ dia: 10, entradas: {} }); sinCanto.amor = copia(q.amor);
  ok(M.encargarAnillo(sinCanto, {}).motivo === 'sin-canto', 'sin canto rodado, no');
  const sinHerreria = partida({ dia: 10 }); sinHerreria.amor = copia(q.amor); delete sinHerreria.aldea.locales.herreria;
  ok(M.encargarAnillo(sinHerreria, {}).motivo === 'sin-herrero', 'sin la herrería abierta, no');
  const an = M.encargarAnillo(q, {});
  ok(an.ok && an.efectos[0].k === 'canto' && an.efectos[0].n === -1, 'Anselmo lo hace con un canto rodado');
  ok(!M.retirarAnillo(q, { dia: 12 }).ok && M.pasarDiaAmor(q, 13).eventos.some((e) => e.tipo === 'anillo') && M.retirarAnillo(q, { dia: 13 }).ok && M.tenesAnillo(q), 'listo a los tres días');
  // la boda a la que no fuiste pasa para mañana
  const b = partida({ dia: 20 });
  b.amor = M.sanearAmor({ personas: { galesa: { etapa: 'comprometidos', afecto: 80, contacto: 20 } }, boda: { con: 'galesa', dia: 20 } }, 20);
  b.horas = 9; ok(!M.casarse(b, {}).ok, 'antes de las 10:30, no');
  const pg = M.pasarDiaAmor(b, 21).eventos;
  ok(pg.some((e) => e.tipo === 'boda-postergada') && b.amor.boda.dia === 22 && b.amor.personas.galesa.etapa === 'comprometidos', 'faltaste: pasa para mañana');
  const inv = M.invitadosBoda(b, {});
  ok(inv.invitados.includes('jefe') && inv.invitados.includes('modista') && inv.invitados.includes('herrero') && !inv.invitados.includes('galesa') && inv.familia.length === 1, 'quién viene: los testigos, Anselmo, sus amigos y tu familia');
  b.dia = 22; b.horas = 11;
  const ca = M.casarse(b, {});
  ok(ca.ok && ca.renglones.some((t) => /juez de paz/.test(t)) && !/iglesia|cura\b|misa|altar/i.test(ca.renglones.join(' ')), 'el casamiento civil, con el juez de paz');
}

// ============================================================ 9. el ajuste apagado: nada aparece y todo queda quieto
{
  const p = partida({ dia: 40 });
  p.amor = M.sanearAmor({ personas: { ceramista: { etapa: 'casados', afecto: 70, contacto: 40 } }, conyuge: 'ceramista', convivencia: { con: 'ceramista', donde: 'suya', desde: 30 }, hijos: [{ madre: 'ceramista', nacio: 35 }] }, 40);
  M.pasarDiaAmor(p, 40);
  const antes = copia(p.amor);
  for (let d = 41; d < 100; d++) ok(M.pasarDiaAmor(p, d, { romance: false }).eventos.length === 0, 'apagado: no pasa nada');
  ok(p.amor.personas.ceramista.etapa === 'casados' && p.amor.hijos[0].nacio === antes.hijos[0].nacio + 59 && M.hijosDe(p, 99)[0].etapa === M.hijosDe(antes, 40)[0].etapa, 'quieto: los chicos no crecen');
  const r = M.pasarDiaAmor(p, 100);
  ok(!r.eventos.some((e) => ['separacion', 'descuido'].includes(e.tipo)) && p.amor.personas.ceramista.etapa === 'casados', 'al prenderlo, no hay descuido acumulado');
  eq(M.mundoAmor(p, { romance: false }), { activo: false }, 'el mundo: nada');
  ok(M.mundoAmor(p, { desafio: true }).activo === false, 'en el Desafío: nada');
  ok(M.comentarioDeAmor(p, 'jefe', { romance: false }) === null && M.noticiasDeAmor(p, { romance: false }).length === 0, 'ni comentarios ni radio');
}

// ============================================================ 10. la API del mundo y el gancho de la radio
{
  const p = partida({ dia: 24, horas: 17 });
  p.amor = M.sanearAmor({ personas: { pintora: { etapa: 'novios', afecto: 80, contacto: 24 }, botera: { etapa: 'saliendo', afecto: 30, contacto: 24 } }, cita: { clave: 'pintora', lugar: 'plaza', dia: 24, desde: 17, hasta: 18.5 }, anillo: { pedido: 22, listo: 25 } }, 24);
  const m = M.mundoAmor(p, {});
  ok(m.activo && m.cita.clave === 'pintora' && m.cita.aldea.edificio === 'plaza' && m.cita.ahora && m.cita.publico, 'la cita: dónde, con quién, si ya es la hora');
  ok(Object.hasOwn(A.puntosDe('plaza'), m.cita.aldea.suyo) && Object.hasOwn(A.puntosDe('plaza'), m.cita.aldea.tuyo), 'los puntos existen');
  for (const [id, L] of Object.entries(M.LUGARES_CITA)) if (L.aldea) ok(Object.hasOwn(A.puntosDe(L.aldea.edificio), L.aldea.suyo) && Object.hasOwn(A.puntosDe(L.aldea.edificio), L.aldea.tuyo), `${id}: los puntos de la aldea existen`);
  ok(Object.hasOwn(A.puntosDe('biblioteca'), 'cuentos') && Object.hasOwn(A.puntosDe('biblioteca'), 'cliente'), 'la boda en la biblioteca: los puntos existen');
  eq(m.parejas.map((x) => [x.clave, x.gesto]).sort(), [['botera', 'cerca'], ['pintora', 'mano']], 'en público se nota la pareja');
  ok(m.anillo.estado === 'haciendo' && M.mundoAmor(p, { dia: 25 }).anillo.estado === 'listo', 'el anillo');
  eq(M.rutinaPareja(p, 'pintora', 17.5, A.diaSemanaDe(24), 24), { lugar: 'cita', edificio: 'plaza', punto: 'estar-3' }, 'la rutina de la pareja: en la cita');
  const q = partida({ dia: 30 });
  q.amor = M.sanearAmor({ personas: { pintora: { etapa: 'casados', afecto: 80, contacto: 30 } }, conyuge: 'pintora', convivencia: { con: 'pintora', donde: 'refugio', desde: 28 } }, 30);
  ok(M.rutinaPareja(q, 'pintora', 23, 1, 30).edificio === 'refugio' && M.rutinaPareja(q, 'pintora', 10, 1, 30).edificio === 'taller-arte', 'viven en el refugio: de noche ahí, de día en su taller');
  ok(M.mundoAmor(q, {}).convivencia.edificio === 'refugio', 'la mudanza');
  // la radio y el diario (3.7.4)
  const r = partida({ dia: 15 });
  r.amor = M.sanearAmor({ personas: { nelida: { etapa: 'novios', afecto: 70, contacto: 15 } }, noticias: [{ id: 'novios:15:nelida', tipo: 'novios', dia: 15, con: 'nelida' }] }, 15);
  const nr = M.noticiasDeAmor(r, { desde: 10 });
  ok(nr.length === 1 && /Nélida/.test(nr[0].texto) && !/\{/.test(nr[0].texto), `la radio: ${nr[0]?.texto}`);
}

// ============================================================ 11. el guardado: partidas viejas, el Desafío y partidas rotas
{
  eq(M.sanearAmor(null, 5), M.amorNuevo(), 'nada: amor nuevo');
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const Gd = await import('../src/guardado.js?v371=' + Date.now());
  const nueva = Gd.progresoNuevo();
  eq(nueva.amor, M.amorNuevo(), 'una partida nueva: sin romance');
  const vieja = Gd.progresoNuevo();
  delete vieja.amor;
  vieja.dia = 90;
  datos.set('hojarasca-v1', JSON.stringify(vieja));
  const c = Gd.cargarProgreso();
  eq(c.amor, M.amorNuevo(), 'una partida de antes de la 3.7.1: el amor vacío');
  // una partida con amor: guarda y vuelve igual
  const p = partida({ dia: 50 });
  llevarHasta(p, 'veterinaria', 'casados', 1);
  const conAmor = { ...c, dia: p.dia, amor: copia(p.amor), aldea: p.aldea, vecindad: p.vecindad };
  ok(Gd.guardarProgreso(conAmor), 'se guarda');
  eq(Gd.cargarProgreso().amor, M.sanearAmor(copia(p.amor), p.dia), 'y vuelve igual');
  eq(M.sanearAmor(copia(p.amor), p.dia), p.amor, 'sanear lo bueno no lo cambia');
  ok(Gd.cargarAjustes().romance === true && Gd.guardarAjustes({ ...Gd.cargarAjustes(), romance: false }) && Gd.cargarAjustes().romance === false && Gd.guardarAjustes({ romance: 'x' }) && Gd.cargarAjustes().romance === true, 'el ajuste: encendido de fábrica, se guarda, saneado');
  // partidas rotas: basura de todo tipo
  const basura = [null, 1, 'x', [], { personas: 5 }, { personas: { veterinaria: 'x' } }, { personas: { veterinaria: { etapa: 'casados', afecto: 'mucho', contacto: 1e308 } }, conyuge: 'veterinaria', hijos: 'x' },
    { personas: { veterinaria: { etapa: 'casados' }, pintora: { etapa: 'casados' }, nelida: { etapa: 'comprometidos' } }, conyuge: 'pintora' },
    { hijos: Array.from({ length: 9 }, (_x, i) => ({ madre: 'veterinaria', nombre: `<b>${i}</b>`, nacio: 1e9 })) },
    { embarazo: { madre: 'nena', nace: 2 }, buscan: true, cita: { clave: 'veterinaria', lugar: 'luna', desde: 'a' }, correo: [{ tipo: 'bomba' }], noticias: [{ tipo: 'novios', con: 'nena', id: 'x' }], comentados: { jefe: [1, 2, 'x'.repeat(200)] } },
    { personas: { __proto__: { etapa: 'novios' }, constructor: { etapa: 'casados' } } }];
  for (const b of basura) {
    const s = M.sanearAmor(b, 30);
    const casadas = Object.values(s.personas).filter((f) => M.ETAPAS_AMOR.indexOf(f.etapa) >= M.ETAPAS_AMOR.indexOf('comprometidos'));
    ok(casadas.length <= 1 && s.hijos.length <= 2 && Object.keys(s.personas).every(M.esCandidata) && JSON.stringify(s).length < 20000, `saneado: ${JSON.stringify(b).slice(0, 50)}`);
    ok(Object.values(s.personas).every((f) => f.contacto <= 30 && f.afecto >= 0 && f.afecto <= 100) && s.hijos.every((h) => h.nacio <= 30 && !/[<>]/.test(h.nombre)), 'fechas de hoy para atrás, nombres limpios');
    eq(M.sanearAmor(copia(s), 30), s, 'sanear dos veces da lo mismo');
    ok(!JSON.stringify(s).includes('__proto__'), 'sin __proto__');
  }
  const dos = M.sanearAmor(basura[7], 30);
  ok(dos.conyuge === 'pintora' && dos.personas.veterinaria.etapa === 'conocidos' && dos.personas.nelida.etapa === 'conocidos', 'dos casadas en un guardado roto: queda la cónyuge');
  // las partidas rotas de la 3.5.4 siguen cargando (su prueba sigue en el gate)
  ok(leer('package.json').includes('node pruebas/verificar-3-5-4-caos.mjs'), 'la prueba de partidas rotas de la 3.5.4 sigue');
  const rota = { dia: 'x', amor: { personas: { veterinaria: { etapa: 'novios' } }, cita: { clave: 'veterinaria', lugar: 'plaza', dia: 1e12, desde: 18, hasta: 19.5 } } };
  datos.set('hojarasca-v1', JSON.stringify({ ...rota, entradas: {} }));
  const cr = Gd.cargarProgreso();
  ok(cr && cr.amor.cita?.dia <= 2 && cr.amor.personas.veterinaria.etapa === 'novios', 'una partida rota con amor carga (la cita, a lo sumo mañana)');
}

// ============================================================ 12. las voces: todas, castellano, sin religión ni economía, para todo público
{
  const claves = ['piropo', 'cita', 'favorito', 'declaracion', 'propuesta', 'boda', 'celos', 'carta', 'flores', 'chicos'];
  for (const k of CAND) {
    const v = VZ.VOCES_AMOR[k];
    ok(claves.every((c) => Object.hasOwn(v, c)) && ['gusto', 'rie', 'no'].every((r) => v.piropo[r].length) && v.cita.charla.length === 2 && v.declaracion.si.length && v.propuesta.si.length, `${k}: todas sus voces`);
  }
  const texto = JSON.stringify([VZ.VOCES_AMOR, VZ.FRASES_AMOR, M.HABILIDADES, M.LUGARES_CITA]);
  const prohibido = /\b(dios|dioses|misa|virgen|bendic\w*|bendit\w*|rez\w+|iglesia|capilla|cura|curas|santo|santa|sagrad\w*|milagro\w*|ángel\w*|amén|pecado|cielo santo|plata|pesos|precio\w*|cobr\w+|vend\w+|pag\w+|altar|parroq\w*)\b/i;
  const m = texto.match(prohibido);
  ok(!m, `sin religión ni economía (encontré «${m?.[0]}»)`);
  ok(!/sexo|desnud|sensual|er[oó]tic|cama juntos/i.test(texto), 'para todo público');
  ok(!/[a-z]\{|\{\w+\}\w/.test(texto.replace(/\{(ella|nombre|lugar|hijo|dias|quien|otra|dia|cita|hora|texto)\}/g, '')), 'sólo las marcas conocidas');
  ok(VZ.FRASES_AMOR.hijos.nombres.nene.length >= 4 && VZ.FRASES_AMOR.hijos.nombres.nena.length >= 4 && ![...VZ.FRASES_AMOR.hijos.nombres.nene, ...VZ.FRASES_AMOR.hijos.nombres.nena].some((x) => ['Nahuel', 'Lucía', 'Abril', 'Ayelén'].includes(x)), 'los nombres de los hijos no se repiten con los de la aldea');
}

// ============================================================ 13. en el juego: el menú de la charla (con un mundo de mentira)
{
  const p = partida({ dia: 3, horas: 10 });
  const vec3 = (x, y, z) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
  const figuras = Object.fromEntries([...A.ORDEN_PERSONAS_ALDEA].map((k) => [k, { claveAldea: k, pos: vec3(0, 0, 0), ruta: null }]));
  let romance = true;
  const notas = [];
  const am = AJ.crearAmorJuego({ progreso: () => p, ajustes: () => ({ romance }), desafio: () => false, nota: (t, s) => notas.push(t), guardar: () => {}, jugador: () => ({ x: 0, z: 0 }), npcDe: (k) => figuras[k], lugarValle: (k) => ({ x: 500 + k.length, z: 300 }), invierno: () => false });
  const vj = VJ.crearVecindadJuego({ progreso: () => p, desafio: () => false, amor: am, npcDe: (k) => figuras[k] });
  const s = vj.abrir(figuras.veterinaria);
  let menu = vj.menu(s);
  ok(menu.opciones.some((o) => o.id === 'amor' && o.titulo === 'Coquetear…') && menu.opciones[menu.opciones.length - 1].id === 'chau', 'con Ayelén, «Coquetear…» antes de chau');
  for (const k of ['nene', 'nena', 'madre', 'padre', 'modista', 'abuela']) { const t = vj.abrir(figuras[k]); ok(!vj.menu(t).opciones.some((o) => /^amor/.test(o.id)), `con ${k}, nada de amor`); }
  romance = false;
  ok(!vj.menu(vj.abrir(figuras.veterinaria)).opciones.some((o) => /^amor/.test(o.id)), 'con el ajuste apagado, el menú de siempre');
  romance = true;
  const sin = VJ.crearVecindadJuego({ progreso: () => p, desafio: () => false });
  ok(!sin.menu(sin.abrir(figuras.veterinaria)).opciones.some((o) => /^amor/.test(o.id)), 'sin amor-juego, el menú de siempre');
  let r = vj.elegir(s, 'amor');
  menu = vj.menu(s);
  ok(r.tipo === 'menu' && menu.tipo === 'amor' && menu.opciones.some((o) => o.id === 'amor:piropo') && menu.opciones[menu.opciones.length - 1].id === 'volver', 'el submenú: piropo… y volver');
  r = vj.elegir(s, 'amor:piropo');
  ok(r.tipo === 'renglones' && r.renglones.length === 1 && vj.menu(s).tipo === 'charla', 'el piropo: lo que contesta, y vuelve al menú');
  // con Anselmo, el anillo; con Benigno, el correo
  p.amor = M.sanearAmor({ personas: { veterinaria: { etapa: 'novios', afecto: 80, contacto: 3, desde: 1 } } }, 3);
  const sh = vj.abrir(figuras.herrero);
  ok(vj.menu(sh).opciones.some((o) => o.id === 'amor:anillo'), 'Anselmo: «Encargarle un anillo»');
  r = vj.elegir(sh, 'amor:anillo');
  ok(r.renglones[0] === VZ.FRASES_AMOR.anillo.pide && p.entradas.canto.cantidad === 2, 'te pide el canto rodado');
  const st = vj.abrir(figuras.telegrafista);
  ok(vj.menu(st).opciones.some((o) => o.id === 'amor-correo'), 'Benigno: el correo');
  vj.elegir(st, 'amor-correo');
  ok(vj.menu(st).opciones.some((o) => o.id === 'amor:carta:veterinaria') && vj.elegir(st, 'amor:carta:veterinaria').tipo === 'renglones' && p.amor.correo.length === 1, 'una carta para Ayelén');
  // la cita en el lugar: ella espera, el aviso lo dice, hablarle la empieza
  p.amor.cita = { clave: 'veterinaria', lugar: 'plaza', dia: 3, desde: 10, hasta: 11.5, estado: 'acordada' };
  am.actualizar(1); am.actualizar(1);
  ok(am.puesta()?.clave === 'veterinaria' && figuras.veterinaria.deVisita && figuras.veterinaria.enCita, 'a la hora, ella espera en la plaza');
  ok(am.textoAviso(figuras.veterinaria) === 'Empezar la cita con Ayelén' && am.textoAviso(figuras.pintora) === null, 'el aviso');
  const h = am.hablar(figuras.veterinaria);
  ok(h && h.partes.length >= 3 && p.amor.cita.estado === 'en-curso', 'hablarle empieza la cita');
  h.alTerminar();
  ok(p.amor.cita === null && p.amor.personas.veterinaria.citas === 1, 'terminó la cita');
  p.horas = 13; am.actualizar(1);
  ok(am.puesta() === null && !figuras.veterinaria.deVisita, 'después de la sobremesa, vuelve a lo suyo');
  // el ñiki ñiki desde el menú: devuelve el fundido
  p.amor = M.sanearAmor({ personas: { veterinaria: { etapa: 'casados', afecto: 80, contacto: 3 } }, conyuge: 'veterinaria', convivencia: { con: 'veterinaria', donde: 'suya', desde: 2 } }, 3);
  p.horas = 22;
  const sn = vj.abrir(figuras.veterinaria);
  vj.elegir(sn, 'amor');
  ok(vj.menu(sn).opciones.some((o) => o.id === 'amor:niki'), 'de noche, viviendo juntos: «Ñiki ñiki…»');
  const rn = vj.elegir(sn, 'amor:niki');
  ok(rn.tipo === 'fundido' && rn.efectos.length === 2 && rn.renglones.length === 1, 'el ñiki ñiki: el fundido');
  // la API del mundo, desde el juego
  ok(am.mundo().activo && am.mundo().convivencia.edificio === 'veterinaria', 'am.mundo()');
  romance = false;
  ok(am.mundo().activo === false && am.opciones('veterinaria').length === 0 && am.alAbrir('veterinaria') === null, 'apagado: nada');
}

console.log(`OK 3.7.1 amor · ${n} verificaciones · elegibilidad, etapas, citas, celos, anillo, casamiento, ñiki ñiki, hijos, habilidades, separación, ajuste, guardado y menú`);
