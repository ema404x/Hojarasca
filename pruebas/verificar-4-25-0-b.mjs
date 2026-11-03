// 4.25.0 (B): la pulida de la Historia (coherencia, atascos, textos). Cada arreglo tiene su mutación (la misma prueba sobre una copia de src/ con el arreglo deshecho
// tiene que fallar):
//   1. aliados: con la majada decidida (D5), quien «se fue» no está aunque el lazo alcance: Ramón con c; Fermín con b o c (la regla de la noche, `aliadosDe`)
//   2. escenas: la mesa de guerra (capítulo 10) y la noche de la nevada (capítulo 12) sientan a Ramón y a Fermín con la misma regla (la condición `esta`), así una escena
//      no dice «falta la silueta de Fermín» y a la vez «Fermín trepó al techo»
//   3. atascos: el jugador de mentira PACIENTE (va a donde la historia lo espera y espera la hora, sentado si hace falta) termina la Historia en las semillas que el jugador al
//      azar dejaba trabadas en la guardia y las huellas del capítulo 6 (el atasco era del azar del jugador, no del juego: y si el juego se trabara, esto lo ve)
//   4. la E de las botas: lo que se mira se elige de nuevo al apretar E (el caché de 250 ms dejaba la E con lo de antes y te sentaba en el banco del umbral)
//   5. textos: nada de números de lazo, nada religioso, nada en otro idioma, ninguna frase repetida entre escenas, nada demasiado largo para una tarjeta
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { H, D, ESC, crear, jugar, imp } from './ayuda-4-18-4-historia.mjs';
import { funcion, enUnaLinea } from './ayuda-codigo.mjs';

const NOCHE = await imp('historia-noche.js');
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4184_SRC || join(raiz, 'src');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const HIJO = !!process.env.A4184_SRC;
const SEC = process.env.A4250_SECCIONES ? new Set(process.env.A4250_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4250_CALLADO) console.log('FALLA ' + t); } };

// ---------------------------------------------------------------- 1. los aliados y la majada
if (va('aliados')) {
  const al = (lazos, majada) => NOCHE.aliadosDe({ lazos, decisiones: majada === undefined ? {} : { majada }, perro: false });
  const todos = { ramon: 3, ema: 3, fermin: 3 };
  ok(al(todos, 'a').ramon && al(todos, 'a').fermin && al(todos, 'a').josefina, 'D5 a (Fermín se la lleva): Ramón, Josefina y Fermín están');
  ok(al(todos, undefined).ramon && al(todos, undefined).fermin, 'sin decidir la majada, el lazo manda');
  ok(al(todos, 'b').ramon && !al(todos, 'b').fermin && al(todos, 'b').josefina, 'D5 b (cuidarla vos): Fermín «se va dolido» y no está aunque el lazo sea 3; Ramón sí');
  ok(!al(todos, 'c').ramon && !al(todos, 'c').fermin && al(todos, 'c').josefina, 'D5 c (venderla): ni Ramón ni Fermín, aunque los dos lazos sean 3; Josefina sí');
  ok(!al({ ramon: 0, ema: 0, fermin: 1 }, 'a').ramon && !al({ ramon: 0, ema: 0, fermin: 1 }, 'a').fermin, 'el lazo sigue pidiendo +1 para Ramón y +2 para Fermín');
  ok(NOCHE.ausenteDeLaMajada({ majada: 'c' }, 'ramon') && !NOCHE.ausenteDeLaMajada({ majada: 'b' }, 'ramon') && NOCHE.ausenteDeLaMajada({ majada: 'b' }, 'fermin') && NOCHE.ausenteDeLaMajada({ majada: 'c' }, 'fermin')
    && !NOCHE.ausenteDeLaMajada({ majada: 'a' }, 'fermin') && !NOCHE.ausenteDeLaMajada({}, 'fermin') && !NOCHE.ausenteDeLaMajada({ majada: 'c' }, 'josefina') && !NOCHE.ausenteDeLaMajada(null, 'ramon'), 'quién falta con cada majada');
  ok(!NOCHE.ausenteDeLaMajada({ majada: 'c' }, 'constructor') && !NOCHE.ausenteDeLaMajada({ majada: 'c' }, '__proto__'), 'un nombre raro no rompe la regla');
}

// ---------------------------------------------------------------- 2. las escenas usan la misma regla
// Todos los pasos de una escena (también los de adentro de un apagón) con su condición
const pasosDe = (e) => { const r = []; const rec = (v) => { if (Array.isArray(v)) v.forEach(rec); else if (v && typeof v === 'object') { if (v.tipo) r.push(v); for (const x of Object.values(v)) if (x && typeof x === 'object') rec(x); } }; rec(e.pasos); return r; };
if (va('escenas')) {
  const CAPS_DE_LA_NOCHE = [10, 11, 12];
  const escenasDe = (cap) => Object.values(ESC).filter((e) => e.capitulo === cap);
  // 2.1 en los capítulos 10 a 12, Ramón y Fermín se piden con `esta` (nunca con `lazo` a secas)
  let sueltos = [];
  for (const cap of CAPS_DE_LA_NOCHE) for (const e of escenasDe(cap)) for (const p of pasosDe(e)) if (p.si?.cond === 'lazo' && ['ramon', 'fermin'].includes(p.si.args?.quien)) sueltos.push(`${e.id}:${p.tipo}`);
  ok(sueltos.length === 0, `en los capítulos 10 a 12 Ramón y Fermín se piden con «esta» y no con «lazo» (sueltos: ${sueltos.slice(0, 4).join(', ') || 'ninguno'})`);
  const conEsta = []; for (const cap of CAPS_DE_LA_NOCHE) for (const e of escenasDe(cap)) for (const p of pasosDe(e)) if (p.si?.cond === 'esta') conEsta.push(p);
  ok(conEsta.length >= 20, `hay ${conEsta.length} pasos con «esta» en la mesa de guerra y la noche (esperados: al menos 20)`);
  // 2.2 la condición con el director de verdad: quién está con cada majada
  const quien = (S, q, min) => S.dir.cumple({ cond: 'esta', args: { quien: q, min } });
  const mundo = (majada, lazos) => { const S = crear({ semilla: 1 }); const h = S.hist(); h.decisiones.majada = majada; Object.assign(h.lazos, lazos); return S; };
  for (const [maj, ramon, fermin] of [['a', true, true], ['b', true, false], ['c', false, false], [null, true, true]]) {
    const S = mundo(maj, { ramon: 3, fermin: 3 });
    ok(quien(S, 'ramon', 1) === ramon && quien(S, 'fermin', 2) === fermin, `con la majada ${maj ?? 'sin decidir'} y los dos lazos en 3: Ramón ${ramon ? 'está' : 'no está'} y Fermín ${fermin ? 'está' : 'no está'} en las escenas`);
  }
  { const S = mundo('a', { ramon: 0, fermin: 1 }); ok(!quien(S, 'ramon', 1) && !quien(S, 'fermin', 2), 'con lazos bajos no están aunque la majada sea a'); }
  { const S = mundo('c', { ramon: 3 }); ok(S.dir.cumple({ cond: 'lazo', args: { quien: 'ramon', min: 1 } }) && !quien(S, 'ramon', 1), 'la condición «lazo» a secas sigue mirando sólo el lazo; «esta» no'); }
  // 2.3 y la contradicción que había: con la majada c y el lazo de Ramón en 3, la espera de la noche decía a la vez «Ramón está sentado en un cajón» y «No están Ramón ni Fermín»
  const contar = (id, S) => { const e = ESC[id]; const dichas = []; for (const p of pasosDe(e)) { if (p.si && !S.dir.cumple(p.si)) continue; if (p.tipo === 'narracion' || p.tipo === 'dialogo') dichas.push(JSON.stringify(p).toLowerCase()); } return dichas.join('\n'); };
  for (const [maj, lazos, aparece, falta] of [['c', { ramon: 3, fermin: 3, ema: 3 }, /ramón está sentado en un cajón/, /no están ramón ni fermín/], ['b', { ramon: 3, fermin: 3, ema: 3 }, /fermín trepó al techo/, /falta la silueta de fermín/]]) {
    const S = mundo(maj, lazos); const t = contar('noche-espera', S);
    ok(falta.test(t) && !aparece.test(t), `la espera de la noche con la majada ${maj}: dice quién falta y no lo sienta a la vez (${falta.test(t) ? 'dice que falta' : 'NO dice que falta'}; ${aparece.test(t) ? 'lo muestra' : 'no lo muestra'})`);
  }
  { const S = mundo('c', { ramon: 3, fermin: 3, ema: 3 }); const t = contar('mesa-guerra', S);
    ok(/silla/.test(t) && !/yo en la cama no me quedo/.test(t) && !/con honda le pego a una lata/.test(t), 'la mesa de guerra con la majada c: las sillas vacías y nadie habla por Ramón ni por Fermín'); }
  { const S = mundo('a', { ramon: 3, fermin: 3, ema: 3 }); const t = contar('mesa-guerra', S);
    ok(/yo en la cama no me quedo/.test(t) && /con honda le pego a una lata/.test(t) && !/silla vac/.test(t), 'la mesa de guerra con la majada a: hablan Ramón y Fermín y no hay sillas vacías'); }
}

// ---------------------------------------------------------------- 2b. las horas que dicen los objetivos son las de las escenas
// Un objetivo que dice «(de 9 a 17)», «entre las 17 y las 20» o «a partir de las 16» tiene que coincidir con la ventana de hora de la escena que lo cumple
// (antes la ingeniera decía «llegá antes de las 11» y la escena salía de 9 a 23: una prisa que no existía)
if (va('horas')) {
  const E = await imp('historia-espera.js');
  const aHora = (h, m) => Number(h) + (m ? Number(m) / 60 : 0);
  const mod = (x) => ((x % 24) + 24) % 24;
  let miradas = 0;
  for (const c of H.CAPITULOS) for (const o of c.objetivos) {
    const t = typeof o.texto === 'function' ? o.texto({ decisiones: {}, lazos: {}, escenas: new Set(), temas: new Set(), objetos: new Set(), terminadas: new Set(), lugares: {} }) : o.texto;
    const e = E.escenaDeObjetivo(o);
    if (!e || typeof t !== 'string') continue;
    const ds = E.disparadoresDe(e, c.id).filter((d) => d.hora);
    if (!ds.length) continue;
    const rango = /\bde (\d{1,2})(?::(\d\d))? a (\d{1,2})(?::(\d\d))?\b|entre las (\d{1,2})(?::(\d\d))? y las? (\d{1,2})(?::(\d\d))?/.exec(t);
    const desde = /a partir de las (\d{1,2})(?::(\d\d))?/.exec(t);
    let a = null, b = null;
    if (rango) { a = rango[1] !== undefined ? aHora(rango[1], rango[2]) : aHora(rango[5], rango[6]); b = rango[3] !== undefined ? aHora(rango[3], rango[4]) : aHora(rango[7], rango[8]); }
    else if (desde) a = aHora(desde[1], desde[2]);
    if (a === null) continue;
    miradas++;
    const coincide = ds.some((d) => Math.abs(mod(d.hora[0]) - mod(a)) < 0.02 && (b === null || Math.abs(mod(d.hora[1]) - mod(b)) < 0.02));
    ok(coincide, c.id + ':' + o.id + ' dice «' + t.slice(t.search(/\(|entre las|a partir/)).slice(0, 50) + '» y la escena ' + e + ' sale en ' + ds.map((d) => d.hora.join(' a ')).join(' o '));
  }
  ok(miradas >= 8, 'se miraron ' + miradas + ' objetivos con hora en el texto (esperados: al menos 8)');
}

// ---------------------------------------------------------------- 2c. las optativas no cruzan de acto
if (va('optativas')) {
  const O = await imp('historia-optativas.js');
  const idx = Object.fromEntries(H.CAPITULOS.map((c, i) => [c.id, i]));
  const acto = (id) => H.CAPITULOS[idx[id]]?.acto;
  ok(O.OPTATIVAS.length >= 30, 'hay ' + O.OPTATIVAS.length + ' optativas');
  for (const o of O.OPTATIVAS) {
    ok(Object.hasOwn(idx, o.desde) && Object.hasOwn(idx, o.hasta) && idx[o.desde] <= idx[o.hasta], 'optativa ' + o.id + ': desde ' + o.desde + ' hasta ' + o.hasta + ' en orden');
    ok(acto(o.desde) === acto(o.hasta), 'optativa ' + o.id + ': no cruza de acto (' + o.desde + ' a ' + o.hasta + ')');
    const caps = new Set();
    for (const d of o.disparadores || []) for (const [k, v] of Object.entries(D.DISPARADORES)) if ((v.escena || k) === d) for (const c of [].concat(v.cap)) caps.add(c);
    const fuera = [...caps].filter((c) => idx[c] < idx[o.desde] || idx[c] > idx[o.hasta]);
    ok(fuera.length === 0, 'optativa ' + o.id + ': sus escenas salen sólo dentro de su ventana' + (fuera.length ? ' (fuera: ' + fuera.join() + ')' : ''));
  }
}

// ---------------------------------------------------------------- 2d. las tarjetas largas y las pantallas bajas
// (lo que se vio con Electron en 1366x768 y 1024x600, ver el humo: la entrada de «El arco y la honda» traía 12 renglones y se salía hasta en 1366x768)
if (va('tarjetas')) {
  const UI = await imp('historia-ui.js');
  const { crearJuego } = await import('./ayuda-4-18-4-historia.mjs');
  const J = crearJuego({ semilla: 1 });
  const velo = J.ctx.documento.body.children.find((x) => x.id === 'valle-tarjeta');
  const html = (def) => { J.valle.tarjetas.mostrar({ opciones: [{ id: 'x', texto: 'Seguir' }], ...def }); const t = velo.innerHTML; J.valle.tarjetas.cerrar(); return t; };
  const largaDe = (n) => Array.from({ length: n }, (_, i) => 'objetivo ' + (i + 1));
  const a = html({ titulo: 'Corta', lista: largaDe(UI.LISTA_LARGA) }), b = html({ titulo: 'Larga', lista: largaDe(UI.LISTA_LARGA + 1) });
  ok(!/ancha|larga/.test(a), 'una lista de ' + UI.LISTA_LARGA + ' renglones o menos queda como siempre');
  ok(/valle-carta [^"]*ancha/.test(b) && /<ul class="larga">/.test(b), 'una lista de más de ' + UI.LISTA_LARGA + ' renglones va en dos columnas en una tarjeta ancha');
  ok(!/ancha|larga/.test(html({ titulo: 'Sin lista', texto: ['hola'] })), 'una tarjeta sin lista no cambia');
  const arco = H.CAPITULOS.find((c) => c.id === 'arco');
  ok(arco.objetivos.filter((o) => !o.visible).length > UI.LISTA_LARGA, 'la entrada de «El arco y la honda» es la lista larga que había que acomodar (' + arco.objetivos.filter((o) => !o.visible).length + ' renglones)');
  ok(UI.LISTA_LARGA >= 6 && UI.LISTA_LARGA <= 10, 'la lista se parte en columnas entre los 6 y los 10 renglones');
  // lo que de verdad manda en el juego es el sistema de menús (src/menus/sistema.css): con «data-menu» el ancho de la carta es el suyo (la 560 de siempre)
  const sis = leer('menus/sistema.css');
  ok(/:root\[data-menu\] #valle-tarjeta \.valle-carta\.ancha \{ width: min\(var\(--ancho-medio\), calc\(100vw - 2 \* var\(--margen-pantalla\)\)\); \}/.test(sis), 'el sistema de menús ensancha la tarjeta con lista larga (ancho medio)');
  const ms = /@media \(max-height: 700px\) \{([\s\S]*?)\n\}/.exec(sis.slice(sis.indexOf('4.25.0: las tarjetas largas')));
  ok(!!ms && /#valle-tarjeta \.valle-carta \{ width: min\(var\(--ancho-medio\)/.test(ms[1]) && /max-height: calc\(100vh - var\(--e-4\)\)/.test(ms[1]) && /h2 \{ font-size: 27px/.test(ms[1]), 'el sistema de menús usa el ancho medio, casi toda la altura y un título de 27 px en las pantallas bajas');
  ok(sis.indexOf('.valle-carta.ancha') > sis.indexOf('#valle-tarjeta .valle-carta { width: min(var(--ancho-angosto)'), 'la regla de la tarjeta ancha viene después de la angosta (si no, no gana)');
  const css = UI.CSS_VALLE;
  ok(/\.valle-carta\.ancha \{ max-width: 760px; \}/.test(css) && /ul\.larga \{ columns: 2;/.test(css), 'el CSS tiene la tarjeta ancha y las dos columnas');
  const m = /@media \(max-height: 700px\) \{([\s\S]*?)\n\}/.exec(css);
  ok(!!m, 'el CSS tiene las reglas para las pantallas de hasta 700 px de alto');
  if (m) {
    const reglas = m[1];
    ok(/\.valle-carta \{[^}]*max-width: 760px/.test(reglas) && /\.valle-carta \{[^}]*max-height: calc\(100vh - 16px\)/.test(reglas), 'la tarjeta de una pantalla baja es ancha y alta como la pantalla');
    ok(/\.historia-hud \{[^}]*top: 74px/.test(reglas) && /\.historia-hud p \{[^}]*margin: 1\.5px 0/.test(reglas), 'el panel de objetivos de una pantalla baja sube y aprieta los renglones');
    const letras = [...reglas.matchAll(/font-size: ([\d.]+)px/g)].map((x) => Number(x[1]));
    ok(letras.length >= 8 && letras.every((x) => x >= 12), 'ninguna letra de las pantallas bajas baja de 12 px (' + Math.min(...letras) + ')');
  }
}

// ---------------------------------------------------------------- 3. el jugador paciente termina la historia
if (va('paciente')) {
  const semillas = process.env.A4250_SEMILLAS ? process.env.A4250_SEMILLAS.split(',').map(Number) : [5, 47, 184, 268];
  for (const s of semillas) {
    const r = jugar(s, { paciente: {} });
    ok(r.fin === true && !r.atascado && r.errores.length === 0, `semilla ${s}: el jugador paciente termina la historia (${r.fin ? 'fin' : 'atascado en ' + JSON.stringify(r.atascado)}; errores ${r.errores.length})`);
  }
}

// ---------------------------------------------------------------- 4. la E de las botas
if (va('botas')) {
  const main = leer('main.js');
  const mundoE = () => {
    const ahora = { t: 1000 };
    const botas = { x: 0, z: 0 };
    const jugador = { estado: { pos: { x: 50, z: 50 } } };
    const llamadas = [];
    const entorno = {
      desafio: null, valle: { historia: () => ({ activa: true, fase: 'jugando' }), accionObjeto: (k) => (k === 'botas-calafate' ? { aviso: 'Mirar las botas de la puerta', hacer: () => llamadas.push('mirar-botas') } : null) },
      objetosHist: { posiciones: { 'botas-calafate': botas }, cercano: (pos) => (Math.hypot(pos.x - botas.x, pos.z - botas.z) < 3 ? 'botas-calafate' : null) }, jugador,
      performance: { now: () => ahora.t }, cacheObjetoHist: { t: -1, v: null }, cachePuertaHist: { t: -1, v: null },
      objetoMirado: () => null, cedeALaPuerta: () => false, puertas: null, hayEDespuesDelFinal: () => false,
    };
    return { ahora, jugador, llamadas, entorno };
  };
  const m = mundoE();
  const historiaObjetoCerca = funcion(main, 'historiaObjetoCerca', m.entorno);
  // lejos: «nada»; a los 100 ms ya estás frente a las botas: el caché (250 ms) todavía dice «nada»
  ok(historiaObjetoCerca() === null, 'lejos de las botas no hay nada que mirar');
  m.ahora.t = 1100; m.jugador.estado.pos = { x: 0.4, z: 1.2 };
  ok(historiaObjetoCerca() === null, 'a los 100 ms de haber llegado, el caché todavía dice «nada» (así fallaba la E)');
  // lo que hace la tecla E del juego (el bloque `case 'KeyE'` de main.js): tiene que volver a elegir lo que se mira
  const i0 = main.indexOf("    case 'KeyE': {"), i1 = main.indexOf("    case 'Tab':", i0);
  ok(i0 > 0 && i1 > i0, 'el código tiene el bloque de la tecla E');
  const bloque = main.slice(i0, i1);
  let vio = 'sin llamar';
  const envE = { ...m.entorno, charla: { npc: null }, armarMantenerE: () => {}, ctxInteraccion: { historiaObjeto: () => historiaObjetoCerca() }, hacerConE: (c) => { vio = c.historiaObjeto(); } };
  new Function('env', `with (new Proxy(env, { has: (t, k) => typeof k === 'string' && (Object.hasOwn(t, k) || !(k in globalThis)), get: (t, k) => (typeof k === 'string' && Object.hasOwn(t, k) ? t[k] : undefined) })) { switch ('KeyE') {\n${bloque}\n} }`)(envE);
  ok(vio && vio.id === 'botas-calafate', `al apretar E se vuelve a elegir lo que se mira: ${vio && vio.id ? 'las botas' : JSON.stringify(vio)}`);
  ok(enUnaLinea(main, ['cacheObjetoHist.t = -1', 'cachePuertaHist.t = -1']), 'la E invalida los dos cachés (el objeto y la puerta de la Historia)');
}

// ---------------------------------------------------------------- 5. los textos
if (va('textos')) {
  const mods = {};
  for (const f of ['historia.js', 'historia-final.js', 'historia-optativas.js', 'historia-texto-acto1.js', 'historia-texto-acto2.js', 'historia-texto-acto3.js', 'historia-texto-optativas.js', 'historia-texto-lazos.js', 'historia-escenas-acto1.js', 'historia-escenas-acto2.js', 'historia-escenas-acto3.js', 'historia-escenas-optativas.js', 'historia-escenas-lazos.js']) {
    try { mods[f] = await imp(f); } catch { /* no existe en esta copia */ }
  }
  const lineas = [];
  const visto = new WeakSet();
  const CLAVES_NO = /^(id|quien|plano|clave|cond|requiere|tecla|forma|cap|modo|lugar|hora|efecto|condicion|siDecision|si|salto|ir|cuando|jugadorEn|objetivo|disparador|pose|gesto|sonido|args|a|desde|hasta|tipo|nombre)$/;
  const caminar = (o, donde, prof = 0) => {
    if (o == null || prof > 14) return;
    if (typeof o === 'string') { lineas.push({ donde, t: o }); return; }
    if (typeof o !== 'object' || visto.has(o)) return;
    visto.add(o);
    for (const [k, v] of Object.entries(o)) { if (CLAVES_NO.test(k) && typeof v !== 'object') continue; if (k === 'cuando' || k === 'jugadorEn' || k === 'disparador') continue; caminar(v, donde + '.' + k, prof + 1); }
  };
  for (const [f, mod] of Object.entries(mods)) for (const [nom, v] of Object.entries(mod)) if (v && typeof v === 'object' && !/^(DISPARO_|CONDICIONES|EFECTOS_|IDS|PERSONAJES|COLOCACION|POR_DEFECTO)/.test(nom)) caminar(v, `${f}:${nom}`);
  const textos = lineas.filter((x) => x.t.length > 3 && /\s/.test(x.t) && /[a-záéíóúñ]{3}/i.test(x.t));
  ok(textos.length > 3000, `se revisaron ${textos.length} textos de la Historia (esperados: más de 3000)`);
  const L = '(?![a-záéíóúñ])';
  const MALAS = [
    [/lazo[^.]{0,14}[+−-]?\d|[+−]\d+\s*(de )?lazo|\(\s*[+−]\d\s*\)|lazo\s*[:=]\s*[−-]?\d/i, 'un número de lazo en pantalla'],
    [new RegExp('\\b(dios|diosa|santo|santa|santos|virgen|iglesia|rezar|rezo|reza|rezan|rezaba|rezaban|rezara|rezaran|rezamos|bendici|bendec|bendig|ángel|angel|milagro|gauchito|difunta correa|pachamama|crucifij|rosario|misa|parroquia|capilla|amén|oración|plegaria|sagrad|divino|demonio|diablo|infierno)' + L, 'i'), 'algo religioso'],
    [/\b(desnud|sexual|erótic|orgasm|gemid|hicimos el amor|hacer el amor|amantes|besó en la boca|beso en la boca)/i, 'algo sensual explícito'],
    [/\b(the|you|your|okay|thanks|hello|please|and the|with the)\b/i, 'otro idioma'],
    [/ {2,}|\.\.\.\.|\s,|[¿¡]\s/, 'tipografía'],
  ];
  for (const [re, que] of MALAS) {
    const malos = textos.filter((x) => re.test(x.t));
    ok(malos.length === 0, `ningún texto con ${que}${malos.length ? ' (' + malos.slice(0, 3).map((x) => x.donde.split(':')[1].slice(0, 40) + ' «' + x.t.slice(0, 60) + '»').join('; ') + ')' : ''}`);
  }
  // frases largas repetidas en dos escenas distintas (sin contar lo que se cita a propósito: la nota de Eusebio y los cuadernos)
  const solo = [];
  for (const [id, e] of Object.entries(ESC)) { const r = []; const rec = (v) => { if (typeof v === 'string') r.push(v); else if (Array.isArray(v)) v.forEach(rec); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!CLAVES_NO.test(k) || typeof x === 'object') rec(x); }; rec(e.pasos); for (const t of r) for (const f of t.split(/(?<=[.!?…])\s+/)) { const k = f.trim().toLowerCase().replace(/[«»"¿¡]/g, ''); if (k.split(/\s+/).length >= 7) solo.push([id, k]); } }
  const por = new Map(); for (const [id, k] of solo) { if (!por.has(k)) por.set(k, new Set()); por.get(k).add(id); }
  const CITAS = new Set(['galpon-ronda', 'fogon-leyenda']);   // la nota de Eusebio («no les tengas miedo…») la leen las dos
  const repetidas = [...por].filter(([, s]) => s.size > 1 && ![...s].every((x) => CITAS.has(x)));
  ok(repetidas.length === 0, `ninguna frase de siete palabras o más se repite entre escenas (repetidas: ${repetidas.slice(0, 3).map(([k, s]) => [...s].join('+') + ' «' + k.slice(0, 50) + '»').join('; ') || 'ninguna'})`);
  // lo que cabe en una tarjeta: ninguna línea de diálogo o narración pasa de 330 letras (en 1024x600 se parte en tres renglones por tarjeta)
  const largas = []; for (const [id, e] of Object.entries(ESC)) for (const p of pasosDe(e)) { const ts = []; if (p.tipo === 'narracion' && typeof p.texto === 'string') ts.push(p.texto); if (p.tipo === 'dialogo') for (const l of p.lineas || []) ts.push(typeof l === 'string' ? l : l.texto || ''); for (const t of ts) if (t.length > 330) largas.push(`${id} (${t.length})`); }
  ok(largas.length === 0, `ninguna línea de escena pasa de 330 letras (${largas.slice(0, 4).join(', ') || 'ninguna'})`);
}

// ---------------------------------------------------------------- mutaciones (cada una en su proceso, sobre una copia de src/)
const MUT = [
  ['historia-disparadores-acto2.js', "hora: [17, 20], cond: (s) => s.lazos.ramon >= 0 },", "hora: [17, 19], cond: (s) => s.lazos.ramon >= 0 },", 'la escena de Ramón al atardecer sale una hora antes de lo que dice el objetivo', 'horas'],
  ['historia.js', "(de 9 a 23)", "(llegá antes de las 11)", 'la ingeniera vuelve a pedir llegar antes de las 11', 'horas'],
  ['historia-optativas.js', "{ id: 'oveja', desde: 'bolsa', hasta: 'ramal',", "{ id: 'oveja', desde: 'bolsa', hasta: 'rueda',", 'una optativa del acto I que llega al acto II', 'optativas'],
  ['historia-optativas.js', "IDX[o.hasta] + 1).map((c) => c.id);", "IDX[o.hasta] + 2).map((c) => c.id);", 'las escenas de una optativa salen un capítulo después de su ventana', 'optativas'],
  ['menus/sistema.css', ":root[data-menu] #valle-tarjeta .valle-carta.ancha { width: min(var(--ancho-medio),", ":root[data-menu] #valle-tarjeta .valle-carta.ancha { width: min(var(--ancho-angosto),", 'la tarjeta con lista larga sigue angosta en el sistema de menús', 'tarjetas'],
  ['menus/sistema.css', "  :root[data-menu] #valle-tarjeta .valle-carta h2 { font-size: 27px; margin: 0 0 var(--e-1); }\n", "", 'las pantallas bajas no achican el título de la tarjeta', 'tarjetas'],
  ['historia-ui.js', "export const LISTA_LARGA = 8;", "export const LISTA_LARGA = 99;", 'la lista larga nunca se parte', 'tarjetas'],
  ['historia-ui.js', "${larga ? ' ancha' : ''}", "", 'la tarjeta con lista larga no se ensancha', 'tarjetas'],
  ['historia-ui.js', "  .valle-carta p { font-size: 14.5px; line-height: 1.36; margin: 0 0 6px; }\n", "", 'las pantallas bajas no aprietan los párrafos', 'tarjetas'],
  ['historia-ui.js', ".valle-carta ul.larga { columns: 2;", ".valle-carta ul.larga { columns: 1;", 'la lista larga queda en una columna', 'tarjetas'],
  ['historia-ui.js', "  .historia-hud { top: 74px; padding: 8px 12px 6px; }\n", "", 'el panel de objetivos no sube en las pantallas bajas', 'tarjetas'],
  ['historia-noche.js', "&& !ausenteDeLaMajada(decisiones, 'fermin') };", "};", 'Fermín sube al techo con la majada b o c si el lazo alcanza', 'aliados'],
  ['historia-noche.js', "export const AUSENTES_POR_LA_MAJADA = { ramon: ['c'], fermin: ['b', 'c'] };", "export const AUSENTES_POR_LA_MAJADA = { ramon: ['c'], fermin: ['c'] };", 'Fermín sólo falta con la majada c', 'aliados'],
  ['historia-noche.js', "export const AUSENTES_POR_LA_MAJADA = { ramon: ['c'], fermin: ['b', 'c'] };", "export const AUSENTES_POR_LA_MAJADA = { ramon: [], fermin: ['b', 'c'] };", 'Ramón sube con la majada vendida', 'aliados'],
  ['historia-noche.js', "export const ausenteDeLaMajada = (decisiones, quien) => Object.hasOwn(AUSENTES_POR_LA_MAJADA, quien) &&", "export const ausenteDeLaMajada = (decisiones, quien) => (quien in AUSENTES_POR_LA_MAJADA) &&", 'la regla lee de la cadena de prototipos', 'aliados'],
  ['historia-escenas-efectos.js', "if (!h || ausenteDeLaMajada(h.decisiones, a.quien)) return false; const l = lazoDe(h, a.quien); return l >= (a.min === undefined || a.min === null ? -9 : Number(a.min)) && l <= (a.max === undefined || a.max === null ? 9 : Number(a.max)); });\n  reg.registrarCondicion('ramal',", "if (!h) return false; const l = lazoDe(h, a.quien); return l >= (a.min === undefined || a.min === null ? -9 : Number(a.min)) && l <= (a.max === undefined || a.max === null ? 9 : Number(a.max)); });\n  reg.registrarCondicion('ramal',", 'la condición «esta» ignora la majada', 'escenas'],
  ['historia-escenas-acto3-c12.js', "  con(aparece('ramon', FRENTE(3, -2.6)), estaAl('ramon', 1)),", "  con(aparece('ramon', FRENTE(3, -2.6)), lazoAl('ramon', 1)),", 'la espera de la noche sienta a Ramón por el lazo', 'escenas'],
  ['historia-escenas-acto3-c12.js', "con(narra('Ramón está sentado en un cajón, con la manta de capa y un martillo sobre las rodillas. Jura que no le duele nada. Tiene los labios apretados.'), estaAl('ramon', 1)),", "con(narra('Ramón está sentado en un cajón, con la manta de capa y un martillo sobre las rodillas. Jura que no le duele nada. Tiene los labios apretados.'), lazoAl('ramon', 1)),", 'la narración de Ramón sentado vuelve al lazo a secas', 'escenas'],
  ['historia-escenas-acto3-c12.js', "con(narra('Fermín trepó al techo del galpón con la honda enrollada en el brazo. Desde ahí es una silueta chiquita contra el cielo blanco, y se agacha cada vez que la nieve le cae en la cara.'), estaAl('fermin', 2)),", "con(narra('Fermín trepó al techo del galpón con la honda enrollada en el brazo. Desde ahí es una silueta chiquita contra el cielo blanco, y se agacha cada vez que la nieve le cae en la cara.'), lazoAl('fermin', 2)),", 'Fermín trepa al techo por el lazo con la majada b', 'escenas'],
  ['historia-escenas-acto3-c10.js', "      con(aparece('ramon', FRENTE(2.8, -1.8)), estaAl('ramon', 0)),", "      con(aparece('ramon', FRENTE(2.8, -1.8)), lazoAl('ramon', 0)),", 'la mesa de guerra sienta a Ramón por el lazo (con la majada c)', 'escenas'],
  ['historia-escenas-acto3-c10.js', "      con(aparece('fermin', FRENTE(3.6, 3)), estaAl('fermin', 1)),", "      con(aparece('fermin', FRENTE(3.6, 3)), lazoAl('fermin', 1)),", 'la mesa de guerra sienta a Fermín por el lazo (con la majada b o c)', 'escenas'],
  ['historia-disparadores-acto2.js', "hora: [0.5, 2.5], cond: (s) => s.sentado },", "hora: [0.5, 2.5], cond: (s) => s.sentado && false },", 'la guardia del molino no sale nunca', 'paciente'],
  ['historia-disparadores-acto2.js', "'ramon-raiz': { cap: 'perdido', modo: 'auto', requiere: ['guardia-molino'], lugar: en('raiz-ramon', 10), hora: [5.5, 10] },", "'ramon-raiz': { cap: 'perdido', modo: 'auto', requiere: ['guardia-molino'], lugar: en('raiz-ramon', 10), hora: [5.5, 10], cond: () => false },", 'Ramón en su raíz no sale nunca', 'paciente'],
  ['main.js', "      cacheObjetoHist.t = -1; cachePuertaHist.t = -1;\n      hacerConE(ctxInteraccion);", "      hacerConE(ctxInteraccion);", 'la E usa lo que se miraba hace un cuarto de segundo', 'botas'],
  ['main.js', "      cacheObjetoHist.t = -1; cachePuertaHist.t = -1;\n      hacerConE(ctxInteraccion);", "      cachePuertaHist.t = -1;\n      hacerConE(ctxInteraccion);", 'la E no vuelve a elegir el objeto', 'botas'],
  ['historia-optativas.js', "texto: 'Ramón te mira distinto'", "texto: 'Ramón te mira distinto (lazo +1)'", 'un número de lazo en pantalla', 'textos'],
  ['historia-escenas-acto3-c12.js', "La estufa tira bien", "La estufa tira bien, como si rezara", 'una frase religiosa en una escena', 'textos'],
  ['historia-escenas-acto3-c12.js', "Nadie pelea con la panza vacía. Ni ellos.", "Nadie pelea con la panza vacía. Ni ellos. Thanks, please.", 'una frase en otro idioma', 'textos'],
  ['historia-escenas-acto3-c12.js', "Nadie pelea con la panza vacía. Ni ellos.", "Mi trabajo es que Ramón se cure, y con esto se cura un día antes.", 'una frase repetida con otra escena', 'textos'],
];
let atrapadas = 0, aplicables = 0;
if (!HIJO) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4250b-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = leer(arch);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      aplicables++;
      const dir = join(tmp, `m${aplicables}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const extra = secc === 'paciente' ? { A4250_SEMILLAS: '5,184' } : {};
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4184_SRC: dir, A4250_CALLADO: '1', A4250_SECCIONES: secc, ...extra }, encoding: 'utf8', timeout: 400000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (HIJO) { if (process.env.A4250_VER) console.log(n + ' comprobaciones, ' + fallas + ' fallas'); process.exit(fallas ? 1 : 0); }
console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.25.0 (B) la pulida de la Historia · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
