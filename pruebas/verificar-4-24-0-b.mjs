// 4.24.0 (B): la primera hora con indicios. Lo que se hizo, con comprobación de que antes fallaba (cada arreglo tiene su mutación: la misma prueba sobre una copia de
// src/ con el arreglo deshecho tiene que fallar):
//   1. la silueta del anochecer en los capítulos 2 a 4 (la presencia «suave»: sólo la silueta, más espaciada, sin risas ni luces ni regalos; el cuaderno anota el
//      indicio de cada capítulo la primera vez que la ves de verdad, y no cuenta entre los `vistos` de los duendes)
//   2. cinco charlas de vecinos con un indicio (Ramón, Elsa, Fermín, Rosa, Ercilia): la primera línea de su capítulo, que anota el indicio al oírla
//   3. dos objetos movidos (la leña apilada en el capítulo 2, los calafates en las botas en el 3): se miran una vez con la E, anotan el indicio y se quedan
//   4. el primer viaje en trochita sin espera: la escena corta de Elsa en el andén (si faltan más de 45 s), el efecto del mundo, la cuenta de la espera y la
//      locomotora que aparece a 135 m del poste (sólo si nadie va arriba, no está varada ni ya llega)
//   5. nada se traba: los indicios no son objetivos, las optativas no cruzan de acto, la Historia se juega entera
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { H, D, O, ES, E, ESC, TODOS_EF, imp, nuevaPartida, crearJuego, jugar } from './ayuda-4-18-4-historia.mjs';
import { enUnaLinea } from './ayuda-codigo.mjs';
import { contexto } from './ayuda-interacciones.mjs';

const PR = await imp('historia-presencia.js'), TX1 = await imp('historia-texto-acto1.js'), TXO = await imp('historia-texto-optativas.js'), MET = await imp('historia-metas.js');

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4184_SRC || join(raiz, 'src');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const HIJO = !!process.env.A4184_SRC;
const SEC = process.env.A4240_SECCIONES ? new Set(process.env.A4240_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4240_CALLADO) console.log('FALLA ' + t); } };

const main = leer('main.js'), historiaJs = leer('historia.js'), historiaUi = leer('historia-ui.js'), trochita = leer('trochita.js'), presenciaJs = leer('historia-presencia.js');
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
const INDICIOS_NUEVOS = {
  'silueta-bolsa': 2, 'huellas-arroyo': 2, 'silbato-solo': 2, 'lena-apilada': 2,
  'silueta-mesa': 3, 'ovejas-silencio': 3, 'migas-rosa': 3, 'botas-calafate': 3,
  'silueta-ramal': 4, 'almacen-acomodado': 4,
};
const CHARLAS_NUEVAS = [   // [vecino, id de la línea, capítulo (número), indicio]
  ['ramon', 'ramon-c2-huellas', 2, 'huellas-arroyo'], ['elsa', 'elsa-c2-silbato', 2, 'silbato-solo'], ['fermin', 'fermin-c3-silencio', 3, 'ovejas-silencio'],
  ['rosa', 'rosa-c3-migas', 3, 'migas-rosa'], ['ercilia', 'ercilia-c4-latas', 4, 'almacen-acomodado'],
];
const CAP_N = { 2: 'bolsa', 3: 'mesa', 4: 'ramal' };

// ---------------------------------------------------------------- 1. los indicios del cuaderno (datos)
if (va('indicios')) {
  for (const [id, cap] of Object.entries(INDICIOS_NUEVOS)) {
    const r = TX1.TEXTO_ACTO1.raro[id];
    ok(r && r.cap === cap && typeof r.titulo === 'string' && r.titulo.length > 4 && typeof r.donde === 'string' && r.texto.length > 40 && r.texto.length < 260, `${id}: está en el cuaderno de lo raro (capítulo ${cap})`);
    ok(Object.hasOwn(H.RAROS, id) && H.RAROS[id] === r?.texto, `${id}: el juego lo conoce (RAROS)`);
    ok(H.anotarRaro(H.historiaNueva(), id, 3) === true, `${id}: se puede anotar`);
    // el tono: castellano, sin números de lazo ni nada religioso ni lo explícito
    const t = `${r?.titulo} ${r?.texto}`;
    ok(!/\blazos?\b/i.test(t) && !/\b(dios|diosa|santo|santa|virgen|milagro|bendici|ánima|anima|rezar|reza)\b/i.test(t) && !/[A-Za-z]{3,}ing\b/.test(t) && !/\b(sexo|desnud|beso)\b/i.test(t), `${id}: tono del guion (sin lazo, nada religioso, nada explícito, sin inglés)`);
  }
  ok(Object.keys(H.RAROS).length === 118 + Object.keys(INDICIOS_NUEVOS).length, `118 indicios de antes + ${Object.keys(INDICIOS_NUEVOS).length} de la primera hora (hay ${Object.keys(H.RAROS).length})`);
  ok(Object.keys(H.RAROS).length < 160, 'el tope del cuaderno (160) alcanza');
  ok(MET.TOTAL_RAROS === Object.keys(H.RAROS).length, 'la guía cuenta lo raro desde los datos (Lo raro: N de ' + MET.TOTAL_RAROS + ')');
  // el capítulo 1 sigue con sus indicios (la silueta y la ronda no se movieron)
  ok(D.DISPARADORES['algo-cruza'].cap === 'llave' && D.DISPARADORES['ronda-umbral'].cap === 'llave', 'algo-cruza y ronda-umbral siguen en el capítulo 1');
}

// ---------------------------------------------------------------- 2. las charlas con indicio
if (va('charlas')) {
  for (const [quien, id, cap, raro] of CHARLAS_NUEVAS) {
    const lista = TX1.TEXTO_ACTO1.charla[quien] || [];
    const l = lista.find((x) => x.id === id);
    ok(l && l.cap === cap && l.raro === raro && !l.cuando && l.texto.length > 50 && l.texto.length < 230, `${id}: línea de charla de ${quien} con el indicio ${raro}`);
    ok(Object.hasOwn(TX1.TEXTO_ACTO1.raro, raro) && TX1.TEXTO_ACTO1.raro[raro].cap === cap, `${id}: el indicio es del mismo capítulo`);
    ok(!/\b(lazo|dios|santo|virgen|milagro)\b/i.test(l?.texto || ''), `${id}: tono`);
    // es la primera que oís de ese vecino en su capítulo (sin condiciones de por medio)
    const a = armar(CAP_N[cap]);
    const clave = ({ elsa: 'guarda', rosa: 'panadera' })[quien] || quien;
    const linea = O.lineaDeHistoria(a.h, a.s(), clave);
    ok(linea && linea.id === id, `${id}: es la primera línea de ${quien} en el capítulo ${cap} (${linea?.id})`);
    // y en otro capítulo no se ofrece
    const b = armar(cap === 2 ? 'mesa' : 'bolsa');
    ok(!(O.lineaDeHistoria(b.h, b.s(), clave)?.id === id), `${id}: en otro capítulo no`);
  }
  // por la UI: al oírla se anota el indicio y se avisa; la segunda vez ya no
  for (const [quien, id, cap, raro] of CHARLAS_NUEVAS) {
    const a = armar(CAP_N[cap]);
    const J = crearJuego({ P: a.P, X: a.X });
    const clave = ({ elsa: 'guarda', rosa: 'panadera' })[quien] || quien;
    const t = J.valle.lineaDeHistoria(clave);
    ok(t === TX1.TEXTO_ACTO1.charla[quien].find((x) => x.id === id).texto, `${id}: la UI da el texto`);
    ok(a.P.historia.raro.some((x) => x.id === raro) && J.notas.some((x) => x[0] === 'El cuaderno anota algo raro' && x[1] === H.RAROS[raro]), `${id}: el cuaderno lo anota y lo avisa en pantalla`);
    const t2 = J.valle.lineaDeHistoria(clave);
    ok(t2 !== t, `${id}: la siguiente vez es otra línea (o ninguna)`);
    ok(a.P.historia.raro.filter((x) => x.id === raro).length === 1, `${id}: se anota una sola vez`);
  }
  { const a = armar('mesa'); const J = crearJuego({ P: a.P, X: a.X }); J.valle.lineaDeHistoria('ramon');
    ok(!a.P.historia.raro.some((x) => x.id === 'huellas-arroyo'), 'una línea de otro capítulo no anota nada'); }
  ok(enUnaLinea(historiaUi, ["typeof l.raro === 'string'", 'anotarIndicio(l.raro)']), 'historia-ui.js: la charla con indicio lo anota');
}

// ---------------------------------------------------------------- 3. los objetos movidos
if (va('objetos')) {
  for (const [id, cap, forma] of [['lena-apilada', 'bolsa', 'lena-apilada'], ['botas-calafate', 'mesa', 'botas-calafate']]) {
    const o = D.OBJETOS[id];
    ok(o && o.forma === forma && Number.isFinite(o.lx) && Number.isFinite(o.lz) && o.unaVez === true && o.raro === id && o.marca === id && Array.isArray(o.nota) && o.nota.length === 2, `${id}: definido junto al refugio, una vez, con su indicio`);
    for (const c of IDS.slice(0, 13)) {
      const a = armar(c);
      ok(D.objetosVisibles(a.h, a.s()).includes(id) === (c === cap), `${id}: se ve sólo en el capítulo «${cap}» (no en «${c}»)`);
    }
    const a = armar(cap);
    const ac = D.accionDeObjeto(id, a.h, a.s());
    ok(ac && ac.tipo === 'marca' && ac.raro === id, `${id}: la E lo mira y anota el indicio`);
    const J = crearJuego({ P: a.P, X: a.X });
    const q = J.valle.accionObjeto(id);
    ok(q && typeof q.hacer === 'function' && /Mirar/.test(q.aviso), `${id}: aviso «${q?.aviso}»`);
    q.hacer();
    ok(a.P.historia.raro.some((x) => x.id === id) && J.notas.some((x) => x[0] === 'El cuaderno anota algo raro'), `${id}: el cuaderno lo anota y lo avisa`);
    ok(J.valle.accionObjeto(id) === null, `${id}: ya lo miraste: la E no vuelve a avisar`);
    ok(D.objetosVisibles(a.h, a.s()).includes(id), `${id}: el objeto se queda donde está`);
  }
  // las formas existen (si no, el objeto sería una nota sin malla)
  const obj = leer('historia-objetos.js');
  ok(/\n  'lena-apilada': \(c\) => \{/.test(obj) && /\n  'botas-calafate': \(c\) => \{/.test(obj), 'historia-objetos.js tiene las dos formas');
  ok(!/ShapeGeometry|OctahedronGeometry|Vector4|Frustum/.test(obj.slice(obj.indexOf("'lena-apilada': (c)"), obj.indexOf("'botas-calafate': (c)") + 600)), 'las formas sólo usan geometrías que trae el three local');
}

// ---------------------------------------------------------------- 4. la silueta del anochecer (presencia suave)
function presencia(capId, o = {}) {
  const a = armar(capId, { fase: o.fase });
  if (o.activa === false) a.h.activa = false;
  const llamadas = { aparecer: 0, reir: 0, indicios: [], guardar: 0 };
  const duendes = [];
  const dh = {
    listo: () => true,
    aparecer: (tipo, p) => { llamadas.aparecer++; const d = { estado: 'mirando', posicion: { x: p.x, z: p.z }, huir() { this.estado = 'fuera'; }, reir() {}, saludar() {}, quitar() { this.estado = 'fuera'; } }; duendes.push(d); return d; },
    reir: () => { llamadas.reir++; },
  };
  const escena = { add() {}, remove() {} };
  const ctx = {
    dh, escena, historia: () => a.h, jugador: () => ({ x: 0, z: 0 }), rumbo: () => 0, altura: () => 0, hora: () => o.hora ?? 19, dia: () => 5, libre: () => o.libre !== false,
    enTierra: () => true, cercaDeArbol: () => true, refugio: () => ({ x: 0, z: 0 }), galpon: () => null, cobrar() {}, nota() {}, guardar() { llamadas.guardar++; }, azar: () => 0.5,
    indicio: (id) => { llamadas.indicios.push(id); },
  };
  const p = PR.crearPresencia(ctx);
  return { a, p, llamadas, duendes };
}
if (va('silueta')) {
  ok(H.hayIndicios(armar('bolsa').h) && H.hayIndicios(armar('mesa').h) && H.hayIndicios(armar('ramal').h), 'hay indicios en los capítulos 2, 3 y 4');
  ok(!H.hayIndicios(armar('llave').h) && !H.hayIndicios(armar('rueda').h) && !H.hayIndicios(armar('perdido').h), 'y no en el 1, el 5 ni el 6 (ahí está la presencia de siempre)');
  ok(!H.hayIndicios(armar('bolsa', { fase: 'fin' }).h) && !H.hayIndicios(armar('bolsa', { fase: 'jugando' }).h === null ? null : (() => { const q = armar('bolsa'); q.h.activa = false; return q.h; })()), 'ni con la Historia terminada o en pausa');
  ok(JSON.stringify(H.CAPITULOS_CON_INDICIOS) === JSON.stringify(['bolsa', 'mesa', 'ramal']), 'los capítulos con indicios son tres');
  ok(IDS.indexOf('bolsa') === 1 && IDS.indexOf('ramal') === 3, 'son el 2, el 3 y el 4');
  ok(H.INDICIO_SILUETA.bolsa === 'silueta-bolsa' && H.INDICIO_SILUETA.mesa === 'silueta-mesa' && H.INDICIO_SILUETA.ramal === 'silueta-ramal', 'cada capítulo tiene su silueta en el cuaderno');
  for (const c of H.CAPITULOS_CON_INDICIOS) ok(Object.hasOwn(H.RAROS, H.INDICIO_SILUETA[c]), `${c}: el indicio de la silueta existe`);
  ok(H.CAPITULOS_CON_INDICIOS.every((c) => !H.CAPITULOS_CON_PRESENCIA.includes(c)), 'la presencia de siempre (capítulos 6 a 8) no cambió');
  ok(PR.TIEMPOS_SUAVES.entreSiluetas[0] > PR.TIEMPOS.entreSiluetas[1], 'en la primera hora las siluetas son más espaciadas que en el acto II');

  for (const capId of H.CAPITULOS_CON_INDICIOS) {
    const t = presencia(capId);
    for (let i = 0; i < 220; i++) t.p.actualizar(0.2);   // 44 s: pasa la espera de la primera
    ok(t.llamadas.aparecer >= 1, `${capId}: al anochecer aparece una silueta`);
    ok(t.llamadas.indicios.length === 1 && t.llamadas.indicios[0] === H.INDICIO_SILUETA[capId], `${capId}: la ves de verdad (a la vista y a 31 m) y el cuaderno anota «${H.INDICIO_SILUETA[capId]}» (${t.llamadas.indicios.join()})`);
    for (let i = 0; i < 400; i++) t.p.actualizar(0.2);
    ok(t.llamadas.indicios.length === 1, `${capId}: la misma silueta no anota dos veces (${t.llamadas.indicios.length})`);
    ok(t.a.h.duendes.vistos === 0, `${capId}: no cuenta entre los «vistos» de los duendes (${t.a.h.duendes.vistos})`);
    ok(t.llamadas.reir === 0 && t.p.luces() === 0 && t.p.regalo() === null && !t.p.hayGalpon(), `${capId}: ni risas ni luces ni regalos ni galpón`);
  }
  { const t = presencia('bolsa');   // espaciadas: tras la primera (a los ~38 s) y los 40 s que dura, la siguiente tarda lo de TIEMPOS_SUAVES (más de 160 s)
    for (let i = 0; i < 1250; i++) t.p.actualizar(0.2);   // 250 s
    ok(t.llamadas.aparecer === 1, `en 250 s aparece una sola silueta (${t.llamadas.aparecer})`);
    for (let i = 0; i < 1000; i++) t.p.actualizar(0.2);   // 450 s en total
    ok(t.llamadas.aparecer === 2, `y a los 450 s la segunda (${t.llamadas.aparecer})`); }
  { const t = presencia('bolsa', { hora: 23 });   // de noche cerrada: la risa sería de las 21 a las 4
    for (let i = 0; i < 1500; i++) t.p.actualizar(0.2);
    ok(t.llamadas.reir === 0 && t.llamadas.aparecer === 0, 'a las 23 no hay silueta (es del anochecer) ni risa en la primera hora'); }
  { const t = presencia('bolsa', { hora: 12 });
    for (let i = 0; i < 600; i++) t.p.actualizar(0.2);
    ok(t.llamadas.aparecer === 0, 'de día no aparece nada'); }
  { const t = presencia('bolsa', { libre: false });
    for (let i = 0; i < 400; i++) t.p.actualizar(0.2);
    ok(t.llamadas.aparecer === 0, 'con una tarjeta, un vehículo o una escena no aparece nada'); }
  { const t = presencia('rueda');
    for (let i = 0; i < 400; i++) t.p.actualizar(0.2);
    ok(t.llamadas.aparecer === 0 && t.llamadas.indicios.length === 0, 'en el capítulo 5 no hay presencia ni indicios (antes del encuentro del galpón)'); }
  { const t = presencia('llave');
    for (let i = 0; i < 400; i++) t.p.actualizar(0.2);
    ok(t.llamadas.aparecer === 0, 'en el capítulo 1 tampoco'); }
  { // la presencia de siempre sigue igual: cuenta los vistos y no usa el indicio de la primera hora
    const t = presencia('perdido');
    for (let i = 0; i < 400; i++) t.p.actualizar(0.2);
    ok(t.llamadas.indicios.length === 0 && t.a.h.duendes.vistos >= 1, 'en el capítulo 6 la silueta cuenta como «vista» y no anota indicios de la primera hora'); }
  { // al salir del capítulo se va la silueta
    const t = presencia('bolsa');
    for (let i = 0; i < 220; i++) t.p.actualizar(0.2);
    const sil = t.p.silueta();
    ok(!!sil, 'hay una silueta');
    t.a.h.capitulo = IDS.indexOf('rueda');
    t.p.actualizar(0.2);
    ok(t.p.silueta() === null && sil.estado === 'fuera', 'al pasar al capítulo 5 la silueta se quita'); }
  ok(enUnaLinea(main, ["indicio: (id) => valle?.anotarIndicio?.(id)"]), 'main.js le da a la presencia el aviso del indicio');
  ok(enUnaLinea(historiaUi, ['anotarIndicio,']), 'la UI de la Historia lo ofrece');
  { const a = armar('bolsa'); const J = crearJuego({ P: a.P, X: a.X });
    ok(J.valle.anotarIndicio('silueta-bolsa') === true && a.P.historia.raro.some((x) => x.id === 'silueta-bolsa'), 'anotarIndicio anota');
    ok(J.notas.some((x) => x[0] === 'El cuaderno anota algo raro' && x[1] === H.RAROS['silueta-bolsa']), 'y avisa en pantalla');
    ok(J.valle.anotarIndicio('silueta-bolsa') === false, 'no lo repite');
    ok(J.valle.anotarIndicio('no-existe') === false, 'ni anota un indicio que no existe');
    a.P.historia.activa = false; ok(J.valle.anotarIndicio('silueta-mesa') === false, 'ni con la Historia en pausa'); }
}

// ---------------------------------------------------------------- 5. el primer viaje sin espera
function anidada(fuente, nombre) {
  const i0 = fuente.indexOf(`\n  function ${nombre}(`);
  if (i0 < 0) throw new Error('no está ' + nombre);
  const i1 = fuente.indexOf('\n  }\n', i0);
  return fuente.slice(i0 + 1, i1 + 5);
}
function trenDeMentira(est, o = {}) {
  const total = o.total ?? 2303, paradas = { estacion: { s: o.sEstacion ?? 600 } };
  const env = { est, total, poste: (p) => p.s + (o.adelanto ?? 4) };
  const codigo = `const delta = (a, b) => { let d = b - a; while (d < 0) d += total; while (d > total) d -= total; return d; };\n${anidada(trochita, 'proximoTrenA')}\n${anidada(trochita, 'esperaEnAnden')}\n${anidada(trochita, 'traerAlAnden')}\nreturn { proximoTrenA, esperaEnAnden, traerAlAnden };`;
  const f = new Function('est', 'total', 'poste', codigo)(env.est, env.total, env.poste);
  return { ...f, parada: paradas.estacion, total, poste: env.poste };
}
const estTren = (o = {}) => ({ s: 0, vel: 7, objetivo: 7, parado: 0, proxima: null, subido: false, conduce: false, varado: false, avisoSilbato: true, frenos: 3, ...o });
if (va('tren')) {
  // --- la trochita: la espera y traer el tren
  { const e = estTren({ s: 100 }); const t = trenDeMentira(e);   // 504 m del poste: ~72 s
    ok(t.esperaEnAnden(t.parada) === Math.round((t.poste(t.parada) - 100) / 7), `esperaEnAnden: 504 m a 7 m/s son ${t.esperaEnAnden(t.parada)} s`); }
  { const e = estTren({ s: 604, vel: 0, parado: 40 }); const t = trenDeMentira(e);
    ok(t.esperaEnAnden(t.parada) === 0, 'parado en el andén: la espera es 0 (no hay que apurar nada)');
    ok(t.traerAlAnden(t.parada) === false && e.s === 604, 'y no se lo mueve'); }
  { const e = estTren({ s: 700, vel: 0, parado: 40 }); const t = trenDeMentira(e);
    ok(t.esperaEnAnden(t.parada) > 300, 'parado en otra parada (recién pasó): faltan más de 300 s');
    ok(t.traerAlAnden(t.parada) === true, 'se lo trae'); }
  { // el poste de la última parada pasa de la vuelta: el tren parado ahí tiene `s` envuelto
    const e = estTren({ s: 5, vel: 0, parado: 40 }); const t = trenDeMentira(e, { sEstacion: 2303 - 1 + 0, adelanto: 7 });   // poste = 2310; s envuelto = 7
    e.s = 2310 % 2303;
    ok(t.esperaEnAnden(t.parada) === 0, 'parado en la parada que cae al final de la vuelta: la espera es 0 (no una vuelta entera)'); }
  { const e = estTren({ s: 500 }); const t = trenDeMentira(e);   // faltan ~104 m: ~15 s
    ok(t.esperaEnAnden(t.parada) <= 25 && t.traerAlAnden(t.parada) === false && e.s === 500, 'si ya llega (menos de 25 s) no se lo toca'); }
  { const e = estTren({ s: 1500, proxima: null }); const t = trenDeMentira(e);
    const antes = t.esperaEnAnden(t.parada);
    ok(antes > 120, 'lejos: más de 2 minutos');
    ok(t.traerAlAnden(t.parada) === true, 'se lo trae');
    ok(Math.abs(t.poste(t.parada) - e.s - 135) < 1e-9, 'queda a 135 m del poste');
    ok(e.proxima === t.parada && e.parado === 0 && e.avisoSilbato === false && e.frenos === 0 && e.vel > 0 && e.vel <= 7, 'en marcha, con la parada por delante y el silbato por dar');
    ok(t.esperaEnAnden(t.parada) <= 25 && t.esperaEnAnden(t.parada) >= 15, `y llega en ${t.esperaEnAnden(t.parada)} s`);
    ok(t.poste(t.parada) - e.s < 140 && t.poste(t.parada) - e.s > 120, 'dentro de la ventana del silbato de aviso (120 a 140 m)'); }
  { const e = estTren({ s: 1500, subido: true }); const t = trenDeMentira(e); ok(t.traerAlAnden(t.parada) === false && e.s === 1500, 'con alguien arriba no se lo toca'); }
  { const e = estTren({ s: 1500, conduce: true }); const t = trenDeMentira(e); ok(t.traerAlAnden(t.parada) === false && e.s === 1500, 'ni si el jugador lo maneja'); }
  { const e = estTren({ s: 1500, varado: true }); const t = trenDeMentira(e); ok(t.traerAlAnden(t.parada) === false && e.s === 1500, 'ni si está varado'); }
  { const e = estTren({ s: 1500 }); const t = trenDeMentira(e); ok(t.traerAlAnden(null) === false && t.esperaEnAnden(null) === 0, 'sin parada no hace nada'); }
  { const e = estTren({ s: 100 }); const t = trenDeMentira(e, { sEstacion: 90 });   // el poste queda delante en el borde de la vuelta
    t.traerAlAnden(t.parada); ok(e.s >= 0 && e.s < t.total, 'el lugar queda dentro de la vuelta'); }
  ok(enUnaLinea(trochita, ['proximoTrenA, esperaEnAnden, traerAlAnden,']), 'trochita.js ofrece las dos');

  // --- el estado y el disparador
  { const a = armar('bolsa'); ok(a.s().esperaTren === 0, 'sin dato del tren la espera es 0');
    a.X.esperaTren = 90.4; ok(a.s().esperaTren === 90, 'la espera se redondea');
    a.X.esperaTren = -5; ok(a.s().esperaTren === 0, 'una espera negativa vale 0');
    a.X.esperaTren = 'x'; ok(a.s().esperaTren === 0, 'y una que no es número');
    a.X.esperaTren = 1e9; ok(a.s().esperaTren === 9999, 'y tiene tope'); }
  const quien = (a, extra = {}) => D.escenaPendiente(a.h, a.s(), {});
  const base = (o = {}) => armar('bolsa', { horas: 10, extra: { lugares: { estacion: 10 }, esperaTren: 120, ...(o.extra || {}) }, vistas: o.vistas, fase: o.fase });
  { const a = base();
    ok(quien(a) === 'elsa-anden', 'en el andén, en el capítulo 2, con 120 s por delante: sale la escena de Elsa'); }
  { const a = base({ extra: { esperaTren: D.ESPERA_MAXIMA_TREN } }); ok(quien(a) !== 'elsa-anden', 'con 45 s justos todavía no'); }
  { const a = base({ extra: { esperaTren: D.ESPERA_MAXIMA_TREN + 1 } }); ok(quien(a) === 'elsa-anden', 'con 46 s sí'); }
  ok(D.ESPERA_MAXIMA_TREN === 45, 'el umbral son 45 segundos');
  { const a = base({ extra: { esperaTren: 0 } }); ok(quien(a) !== 'elsa-anden', 'si el tren ya está en el andén no hace falta'); }
  { const a = base({ extra: { esperaTren: 30 } }); ok(quien(a) !== 'elsa-anden', 'ni si llega en 30 s'); }
  { const a = base({ extra: { lugares: { estacion: 40 } } }); ok(quien(a) !== 'elsa-anden', 'lejos del andén (40 m) no'); }
  { const a = base({ extra: { lugares: { estacion: 22 } } }); ok(quien(a) === 'elsa-anden', 'a 22 m sí'); }
  { const a = base(); a.P.entradas.viaje = { cantidad: 1 }; ok(quien(a) !== 'elsa-anden', 'ya hiciste un viaje: la escena es del primero'); }
  { const a = base({ vistas: ['elsa-anden'] }); ok(quien(a) !== 'elsa-anden', 'una sola vez'); }
  { const a = base(); a.P.horas = 5.5; ok(quien(a) !== 'elsa-anden', 'de madrugada Elsa no está'); a.P.horas = 21.2; ok(quien(a) !== 'elsa-anden', 'ni a la noche'); a.P.horas = 6.1; ok(quien(a) === 'elsa-anden', 'a la mañana sí'); }
  for (const c of IDS) { if (c === 'bolsa') continue; const a = armar(c, { horas: 10, extra: { lugares: { estacion: 10 }, esperaTren: 120 } }); ok(quien(a) !== 'elsa-anden', `en el capítulo «${c}» no sale`); }
  { const a = base({ fase: 'intro' }); ok(quien(a) === null, 'con la tarjeta de entrada todavía no'); }
  ok(D.ESCENAS_ACTO1_IDS.includes('elsa-anden') && Object.hasOwn(ESC, 'elsa-anden'), 'la escena está en el acto I y en el director');
  ok(!Object.values(H.CAPITULO.bolsa.objetivos).some((o) => String(o.hecho || '').includes('elsa-anden')), 'no es un objetivo: nada se traba si no sale');

  // --- la escena corre y trae el tren una sola vez (también si se la saltea)
  const e = ESC['elsa-anden'];
  ok(e && e.capitulo === 2 && e.acto === 1 && e.resumen.length > 60 && !/lazo/i.test(e.resumen), 'la escena es del capítulo 2 y tiene reseña');
  ok(e.pasos.filter((p) => p.tipo === 'dialogo' && p.quien !== 'narra').reduce((s, p) => s + p.lineas.length, 0) <= 3, 'es corta: tres líneas de Elsa o menos');
  ok(!e.pasos.some((p) => p.tipo === 'eleccion'), 'sin elecciones: no hace perder tiempo');
  ok(e.pasos.some((p) => p.tipo === 'efecto' && p.nombre === 'mundo:tren-al-anden'), 'trae el tren con un efecto del mundo');
  { // el tren aparece con la pantalla en negro
    const i = e.pasos.findIndex((p) => p.tipo === 'efecto' && p.nombre === 'mundo:tren-al-anden');
    const antes = e.pasos.slice(0, i), despues = e.pasos.slice(i + 1);
    ok([...antes].reverse().find((p) => p.tipo === 'fundido')?.a === 'negro', 'el efecto va después de un fundido a negro');
    ok(despues.find((p) => p.tipo === 'fundido')?.a === 'claro', 'y antes de que vuelva la luz'); }
  for (const saltar of [false, true]) {
    const llamadas = [];
    const P = nuevaPartida().P;
    const mundo = { posicion: () => ({ x: 0, z: 0, y: 0 }), suelo: () => 0, camaraJugador: () => ({ x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0, fov: 60 }), horaActual: () => P.horas, puedeEmpezar: () => true, hora() {} };
    const errores = [];
    const dir = ES.crearDirector({ mundo, estado: () => ES.escenasDe(P.historia), dia: () => P.dia, alError: (t) => errores.push(t) });
    dir.registrar(e);
    const ctxEf = { historia: () => P.historia, dia: () => P.dia, estado: () => H.estadoHistoria(P, {}) };
    E.registrarEfectosHistoria(dir, ctxEf);
    E.registrarEfectosActo1(dir, { ...ctxEf, dar() {}, mundo: (id) => llamadas.push(id), duende() {}, quitar() {} }, TODOS_EF);
    ok(dir.disparar('elsa-anden') === true, `${saltar ? 'salteada' : 'entera'}: arranca`);
    let t = 0;
    for (let i = 0; i < 4000 && dir.activa(); i++) { dir.actualizar(0.1); const d = dir.datos(); if (d?.dialogo) { dir.acelerar(true); dir.avanzar(); } if (saltar && ++t === 3) { dir.pedirSaltar(); dir.pedirSaltar(); } }
    ok(!dir.activa() && errores.length === 0, `${saltar ? 'salteada' : 'entera'}: termina sin errores (${errores.join()})`);
    ok(llamadas.filter((x) => x === 'tren-al-anden').length === 1, `${saltar ? 'salteada' : 'entera'}: el tren se trae una sola vez (${llamadas.join()})`);
    ok(Object.hasOwn(P.historia.escenas.vistas, 'elsa-anden'), `${saltar ? 'salteada' : 'entera'}: queda vista`);
  }
  ok(Object.hasOwn(leer('historia-colocacion.js') && (await imp('historia-colocacion.js')).COLOCACION_PULIDO, 'elsa-anden'), 'el jugador se pone a 8 m del andén, mirando hacia la estación');

  // --- main.js: el enganche
  ok(enUnaLinea(main, ['esperaTren: !js.enTren && tren?.estacion ? tren.esperaEnAnden(tren.estacion) : 0']), 'main.js le pasa a la Historia la espera del tren (0 si vas arriba)');
  ok(enUnaLinea(main, ["if (id === 'tren-al-anden')", 'tren.traerAlAnden(tren.estacion)']), 'main.js trae el tren con el efecto del mundo');
  ok(enUnaLinea(main, ["id === 'tren-al-anden'", '!jugador.estado.enTren']), 'y no lo toca si vas arriba');
}

// ---------------------------------------------------------------- 5b. la E: el objeto de historia le gana a sentarte en el banco de al lado
// (la tabla de interacciones de la copia que se prueba: A4184_SRC; la de verdad si no)
if (va('interaccion')) {
  const { INTERACCIONES } = await import(pathToFileURL(join(SRC, 'interacciones.js')).href);
  const { hacerConE: hacerE, avisoDe: avisoE } = await import(pathToFileURL(join(SRC, 'interacciones.js')).href);
  const objeto = (hechos) => ({ id: 'lena-apilada', aviso: 'Mirar la leña apilada', hacer: () => hechos.push('objeto') });
  const decide = (estado) => { const hechos = []; const c = contexto({ historiaObjeto: objeto(hechos), ...estado }); const id = hacerE(c); const aviso = avisoE(contexto({ historiaObjeto: objeto([]), ...estado }), {}); return { id, aviso: aviso?.texto }; };
  const banco = { tipo: 'sentarse', s: { nombre: 'el banco de la puerta' }, texto: 'Sentarte en el banco de la puerta' };
  ok(decide({}).id === 'historia-objeto', 'sin nada en la mira, la E mira el objeto');
  ok(decide({ objetivo: banco }).id === 'historia-objeto' && decide({ objetivo: banco }).aviso === 'Mirar la leña apilada', 'con el banco de al lado en la mira, la E mira el objeto y el aviso lo dice (antes te sentaba)');
  ok(decide({ objetivo: { tipo: 'sentarse', s: { cama: true, nombre: 'la cama' }, texto: 'Acostarte a dormir' } }).id === 'objetivo', 'con la cama en la mira, la E sigue siendo dormir');
  ok(decide({ objetivo: { tipo: 'planta', texto: 'Anotar lupino' } }).id === 'objetivo', 'con algo para juntar o anotar en la mira, la E sigue siendo eso');
  ok(decide({ js: { sentado: true }, objetivo: banco }).id !== 'historia-objeto', 'sentado, no');
  ok(decide({ js: { enTren: true } }).id !== 'historia-objeto' && decide({ js: { enKayak: true } }).id !== 'historia-objeto', 'ni en el tren ni en el kayak');
  ok(decide({ desafio: {} }).id !== 'historia-objeto', 'ni en el Desafío');
  { const c = contexto({ objetivo: banco }); const id = hacerE(c); ok(id === 'objetivo', 'sin objeto de historia cerca, el banco en la mira sigue sentándote (' + id + ')'); }
  ok(INTERACCIONES.findIndex((e) => e.id === 'historia-objeto') < INTERACCIONES.findIndex((e) => e.id === 'objetivo'), 'el objeto de historia va antes que lo que mirás');
}

// ---------------------------------------------------------------- 6. nada se traba
if (va('juego')) {
  for (const semilla of [21, 22]) {
    const r = jugar(semilla);
    ok(r.fin === true && !r.atascado && !(r.errores || []).length, `jugador de mentira (semilla ${semilla}): los trece capítulos terminan sin atascos ni errores${r.atascado ? ' · atascado en ' + JSON.stringify(r.atascado) : ''}`);
  }
  // los indicios nuevos no son objetivos de nadie ni cuentan para ninguna optativa, y las optativas siguen sin cruzar de acto
  const objetivos = H.CAPITULOS.flatMap((c) => c.objetivos.map((o) => String(o.hecho || '') + String(o.cuenta || '') + String(o.texto?.toString?.() || '')));
  for (const id of Object.keys(INDICIOS_NUEVOS)) ok(!objetivos.some((t) => t.includes(`'${id}'`)), `${id}: no es objetivo de ningún capítulo`);
  const cruzan = O.OPTATIVAS.filter((o) => { const caps = O.capsDe(o); const actos = new Set(caps.map((c) => H.CAPITULO[c].acto)); return actos.size > 1; });
  ok(cruzan.length === 0, `las optativas no cruzan de acto (${cruzan.map((o) => o.id).join()})`);
  void TXO;
}

// ---------------------------------------------------------------- mutaciones (cada una en su proceso, sobre una copia de src/)
const MUT = [
  ['historia.js', "export const CAPITULOS_CON_INDICIOS = ['bolsa', 'mesa', 'ramal'];", "export const CAPITULOS_CON_INDICIOS = ['bolsa', 'mesa'];", 'el capítulo 4 se queda sin silueta', 'silueta'],
  ['historia.js', "export const INDICIO_SILUETA = { bolsa: 'silueta-bolsa', mesa: 'silueta-mesa', ramal: 'silueta-ramal' };", "export const INDICIO_SILUETA = { bolsa: 'silueta-bolsa', mesa: 'silueta-bolsa', ramal: 'silueta-ramal' };", 'el capítulo 3 anota el indicio del 2', 'silueta'],
  ['historia-presencia.js', "const suave = !hay && hayIndicios(hist);   // 4.24.0: la primera hora", "const suave = false;   // 4.24.0: la primera hora", 'la primera hora no tiene presencia', 'silueta'],
  ['historia-presencia.js', "        if (suave) { const id = INDICIO_SILUETA[capituloActual(h()).id]; if (id) ctx.indicio?.(id); }", "        if (suave) { /* nada */ }", 'la silueta no anota su indicio', 'silueta'],
  ['historia-presencia.js', "        else { d.vistos = Math.min(999, d.vistos + 1); ctx.guardar?.(); }", "        if (true) { d.vistos = Math.min(999, d.vistos + 1); ctx.guardar?.(); }", 'la primera hora cuenta entre los vistos de los duendes', 'silueta'],
  ['historia-presencia.js', "      actualizarLuces(dt, false);\n      actualizarGalpon(dt, false);\n      quitarRegalo();\n      return;\n    }\n    if (!hay) {", "      actualizarRisa(dt);\n      actualizarLuces(dt, enVentana(ctx.hora(), VENTANAS.luz) && dh.listo());\n      return;\n    }\n    if (!hay) {", 'la primera hora también trae risas y luces', 'silueta'],
  ['historia-presencia.js', "export const TIEMPOS_SUAVES = { entreSiluetas: [160, 280] };", "export const TIEMPOS_SUAVES = { entreSiluetas: [70, 130] };", 'las siluetas de la primera hora no se espacian', 'silueta'],
  ['historia-presencia.js', "      espera = aparecerSilueta() ? entre(azar, suave ? TIEMPOS_SUAVES.entreSiluetas : TIEMPOS.entreSiluetas) : 8;", "      espera = aparecerSilueta() ? entre(azar, TIEMPOS.entreSiluetas) : 8;", 'la espera suave no se usa', 'silueta'],
  ['historia-presencia.js', "    if (suave) {\n      if (!libre) return;", "    if (suave) {", 'la primera hora aparece con una tarjeta abierta', 'silueta'],
  ['historia-ui.js', "    if (typeof l.raro === 'string') anotarIndicio(l.raro);", "    if (false) anotarIndicio(l.raro);", 'la charla no anota el indicio', 'charlas'],
  ['historia-ui.js', "    ctx.nota('El cuaderno anota algo raro', textoRaro(id)); ctx.sonido?.()?.anotar?.(); ctx.diario?.('evento', textoRaro(id));\n    ctx.guardar();\n    return true;", "    ctx.guardar();\n    return true;", 'el indicio se anota y no se avisa', 'silueta'],
  ['historia-texto-acto1.js', "      { id: 'ramon-c2-huellas', cap: 2,", "      { id: 'ramon-c2-huellas', cap: 3,", 'la charla de Ramón es de otro capítulo', 'charlas'],
  ['historia-texto-acto1.js', "raro: 'migas-rosa' },", "raro: 'migas-de-rosa' },", 'la charla de Rosa apunta a un indicio que no existe', 'charlas'],
  ['historia-texto-acto1.js', "    ercilia: [\n      { id: 'ercilia-c4-latas',", "    ercilia: [\n      { id: 'ercilia-c4-ingeniera-0', cap: 4, texto: 'La ingeniera cuenta bolsas.' },\n      { id: 'ercilia-c4-latas',", 'otra línea le gana a la del indicio', 'charlas'],
  ['historia-texto-acto1.js', "    'silueta-ramal': { titulo: 'La silueta, más cerca',", "    'silueta-ramal-x': { titulo: 'La silueta, más cerca',", 'falta el indicio de la silueta del capítulo 4', 'indicios'],
  ['historia-texto-acto1.js', "texto: 'Alguien llenó de calafates las botas que dejé en la puerta, un puñadito en cada una. Y no pisó el barro de la entrada.', cap: 3,", "texto: 'Alguien llenó de calafates las botas que dejé en la puerta, un puñadito en cada una. Y no pisó el barro de la entrada.', cap: 4,", 'el indicio de las botas es de otro capítulo', 'indicios'],
  ['historia-disparadores.js', "visible: (s, h) => capituloActual(h).id === 'bolsa', unaVez: true,", "visible: (s, h) => capituloActual(h).id !== 'llave', unaVez: true,", 'la leña apilada se ve en todos los capítulos', 'objetos'],
  ['historia-disparadores.js', "  if (o.unaVez && o.marca && s.objetos.has(o.marca)) return null;", "", 'el objeto se puede mirar cien veces', 'objetos'],
  ['historia-disparadores.js', "marca: 'botas-calafate', raro: 'botas-calafate',", "marca: 'botas-calafate',", 'las botas no anotan el indicio', 'objetos'],
  ['historia-objetos.js', "  'lena-apilada': (c) => {", "  'lena-apilada-x': (c) => {", 'la leña apilada no tiene malla', 'objetos'],
  ['historia-disparadores.js', "cond: (s) => !s.viaje && s.esperaTren > ESPERA_MAXIMA_TREN },", "cond: (s) => s.esperaTren > ESPERA_MAXIMA_TREN },", 'Elsa apura al tren aunque ya hayas viajado', 'tren'],
  ['historia-disparadores.js', "cond: (s) => !s.viaje && s.esperaTren > ESPERA_MAXIMA_TREN },", "cond: (s) => !s.viaje },", 'Elsa apura al tren aunque ya esté en el andén', 'tren'],
  ['historia-disparadores.js', "lugar: en('estacion', 22), hora: [6, 21],", "hora: [6, 21],", 'Elsa apura al tren desde cualquier parte', 'tren'],
  ['historia-disparadores.js', "export const ESPERA_MAXIMA_TREN = 45;", "export const ESPERA_MAXIMA_TREN = 245;", 'Elsa sólo apura al tren si faltan cuatro minutos', 'tren'],
  ['historia-disparadores.js', "'elsa-anden': { cap: 'bolsa', modo: 'auto',", "'elsa-anden': { cap: ['bolsa', 'mesa'], modo: 'auto',", 'la escena de Elsa también sale en el capítulo 3', 'tren'],
  ['historia.js', "    esperaTren: Number.isFinite(Number(extra.esperaTren)) ? Math.max(0, Math.min(9999, Math.round(Number(extra.esperaTren)))) : 0,", "    esperaTren: 0,", 'la Historia no sabe cuánto falta el tren', 'tren'],
  ['historia-escenas-acto1.js', "    ...apagon([efecto('mundo:tren-al-anden'), desaparece('elsa'), espera(0.6)]),", "    efecto('mundo:tren-al-anden'), desaparece('elsa'),", 'el tren aparece sin fundido a la vista de todos', 'tren'],
  ['historia-escenas-acto1.js', "    ...apagon([efecto('mundo:tren-al-anden'), desaparece('elsa'), espera(0.6)]),", "    ...apagon([desaparece('elsa'), espera(0.6)]),", 'la escena de Elsa no trae el tren', 'tren'],
  ['trochita.js', "    if (esperaEnAnden(parada) <= ya) return false;", "", 'se trae el tren aunque ya llegue', 'tren'],
  ['trochita.js', "    if (!parada || est.subido || est.conduce || est.varado) return false;\n    if (esperaEnAnden", "    if (!parada) return false;\n    if (esperaEnAnden", 'se mueve el tren con el jugador adentro', 'tren'],
  ['trochita.js', "    est.s = (((poste(parada) - metros) % total) + total) % total;", "    est.s = poste(parada) + metros;", 'el tren aparece pasado el andén', 'tren'],
  ['trochita.js', "    if (est.parado > 0 && (d < 3 || d > total - 3)) return 0;", "    if (est.parado > 0 && d < 3) return 0;", 'el tren parado en la última parada parece lejano', 'tren'],
  ['main.js', "esperaTren: !js.enTren && tren?.estacion ? tren.esperaEnAnden(tren.estacion) : 0 }", "esperaTren: 0 }", 'main.js no pasa la espera', 'tren'],
  ['main.js', "if (id === 'tren-al-anden') { try { if (!jugador.estado.enTren && tren?.estacion) tren.traerAlAnden(tren.estacion); }", "if (id === 'tren-al-anden') { try { if (false) tren.traerAlAnden(tren.estacion); }", 'main.js no trae el tren', 'tren'],
  ['interacciones.js', "(!c.objetivo || soloSentarse(c)) && !c.js.sentado && c.historiaObjeto()", "aMano(c) && !c.js.sentado && c.historiaObjeto()", 'el banco de al lado le gana al objeto de historia', 'interaccion'],
  ['interacciones.js', "const soloSentarse = (c) => c.objetivo?.tipo === 'sentarse' && !c.objetivo.s?.cama;", "const soloSentarse = (c) => c.objetivo?.tipo === 'sentarse';", 'el objeto de historia le gana también a dormir en la cama', 'interaccion'],
  ['interacciones.js', "(!c.objetivo || soloSentarse(c)) && !c.js.sentado", "(!c.objetivo || c.objetivo.tipo) && !c.js.sentado", 'el objeto de historia le gana a lo que mirás (juntar, anotar)', 'interaccion'],
  ['historia-colocacion.js', "  'elsa-anden': { punto: 'estacion', dist: 8, desde: 'refugio', alto: -0.05 },", "", 'la escena de Elsa no pone al jugador en el andén', 'tren'],
];
let atrapadas = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4240b-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = leer(`${arch}`);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4184_SRC: dir, A4240_CALLADO: '1', A4240_SECCIONES: secc }, encoding: 'utf8', timeout: 240000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (!HIJO) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.24.0 (B) la primera hora con indicios: siluetas, charlas, objetos movidos y el primer viaje en trochita sin espera · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
