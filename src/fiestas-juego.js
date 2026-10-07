// 3.7.5 (fiestas): las tradiciones en el juego (sólo en el Relax). Las reglas son de fiestas.js, truco.js y
// juegos-mesa.js; lo que se ve y se oye, de fiestas-mundo.js. Acá:
//   · el día: qué fecha es y qué fase (`fiestaDeAhora`), el aviso de cada fase, quién va a dónde (`destino`, que
//     aldea-gente.js usa por encima del horario, como el amor y el asado), los invitados que llegan en el tren de fiesta;
//   · E y el aviso (la misma función, `accion`: main.js los pone en el mismo lugar): sentarse a la mesa larga (te
//     sirven solo), anotarse en la jineteada, la mesita de los juegos (truco, chinchón, damas), tirar la taba, bailar
//     (o la clase de Pocha), escuchar la leyenda, dar una mano en la minga, palear la nieve y llevar leña en la nevada,
//     colgar los recuerdos en el refugio;
//   · el panel de los juegos (el mismo estilo que el del taller: los números, el clic, Enter, la ruedita y el mando):
//     el truco de verdad (también desde la rueda: «Jugar un truco»), el chinchón, las damas, la taba, la clase de baile y
//     la jineteada (A y D, las flechas o el palito para no caerte);
//   · los recuerdos, las fotos de la fiesta para el álbum, la gran nevada (la vía tapada y el tiempo de nieve) y tu
//     cumpleaños con fiesta sorpresa.
// Sin three (lo visual lo pide a fiestas-mundo.js por `ctx.mundo()`); el DOM, sólo en el panel.
import { fiestaDeAhora, fechasDelDia, faseDe, programaDe, textoHora, FECHAS, anioDe, repartoFiesta, puntosPredio, PREDIO, enElPredio, sanearFiestas, fiestasNuevas, marcarVista, darRecuerdo, porColgar, colgarRecuerdos, comerEnLaMesa, yaComio, fotoDeFiesta, fotosParaAlbum, cargarMinga, terminarMinga, mingaDelAnio, ayudasteEnLaMinga, ayudarEnLaNevada, nevadaHecha, NEVADA, anotarPartido, anotarMonta, puedeMontar, aprobarClase, puedeTomarClase, claseNueva, responderPaso, BAILES, NIVEL_BAILE_MAX, invitadosDe, leyendaDelAnio, menuDe, RECUERDOS, jineteadaNueva, pasoJineteada, JINETEADA, montaDeJinete, cargarFiestasEnCalendario, diaNevada, musicaDe, poseDeBaile, CHICOS, cumpleDelJugador } from './fiestas.js';
import { partidoNuevo, accionesDe, actuar, turnoDe, decidirIA, nombreCarta, NOMBRES_CANTO, perfilTruco, envidoDe } from './truco.js';
import { chinchonNuevo, accionesChinchon, actuarChinchon, decidirChinchon, turnoChinchon, nombreCartaChinchon, mejorLigado, esComodin, damasNuevas, jugadasDamas, moverDamas, decidirDamas, textoJugada, tirarTaba, TEXTO_TABA } from './juegos-mesa.js';
import { FIESTAS_ALDEA, nombreCortoDe } from './aldea-vida.js';
import { noventaDeLaAbuela } from './aldea.js';

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const minus = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const FASES = { llegada: 'la llegada', acto: 'el acto', mesa: 'la mesa larga', juegos: 'los juegos y la jineteada', baile: 'el baile', fogon: 'el fogón', trabajo: 'la minga', palear: 'la nevada solidaria', sorpresa: 'la sorpresa' };
const DONDE = (f) => (f.lugar === 'plaza' ? 'en la plaza' : 'en el predio de la fiesta, del otro lado de la calle de la vía');
const PALO_COLOR = { espada: '#3a6a9a', basto: '#4a7a3a', oro: '#c8a030', copa: '#b83a3a', comodin: '#7a4aa0' };
const PALO_SIGNO = { espada: '⚔', basto: '♣', oro: '●', copa: '♥', comodin: '★' };

export function crearFiestasJuego(ctx) {
  const progreso = () => ctx.progreso();
  const T_ = (s) => (ctx.traducir ? ctx.traducir(s) : s);
  const activo = () => !ctx.desafio?.() && !!progreso();
  const dia = () => Math.max(1, Math.floor(Number(progreso().dia) || 1));
  const horas = () => Number(progreso().horas) || 0;
  const mundo = () => ctx.mundo?.() || null;
  // lo guardado (progreso.fiestas): si no estaba (o alguien lo rompió), saneado
  let saneado = null;
  function estado() {
    const p = progreso();
    if (!objeto(p.fiestas) || saneado !== p.fiestas) { p.fiestas = sanearFiestas(p.fiestas, p.dia); saneado = p.fiestas; }
    return p.fiestas;
  }
  // el calendario del cuaderno (y el aviso del día antes) con las fiestas
  cargarFiestasEnCalendario(FIESTAS_ALDEA, objeto(ctx.progreso?.()?.fiestas) ? ctx.progreso().fiestas : null);

  // ---------------------------------------------------------------- la fecha y la fase de ahora
  const opciones = (d = dia()) => {
    const p = progreso();
    let noventa = false;
    try { noventa = noventaDeLaAbuela(p.aldea, d); } catch { noventa = false; }
    return { estado: estado(), semilla: ctx.semilla?.() || 1, invierno: !!ctx.invierno?.(d), amigos: ctx.amigos?.() || 0, noventa };
  };
  let cache = { t: -1, ahora: null, dia: 0, fechas: [] };
  function ahora() {
    const t = dia() * 24 + horas();
    if (Math.abs(t - cache.t) < 0.02) return cache.ahora;
    if (cache.dia !== dia()) cache.fechas = fechasDelDia(dia(), opciones());
    cache.t = t; cache.dia = dia();
    cache.ahora = fiestaDeAhora(dia(), horas(), opciones());
    return cache.ahora;
  }
  const fechasDeHoy = () => { ahora(); return cache.fechas; };
  const anio = () => anioDe(dia());

  // ---------------------------------------------------------------- quién va a dónde (para aldea-gente.js)
  let reparto = { clave: '', mapa: new Map() };
  const presentes = () => [...(ctx.aldeaGente?.()?.personas?.keys?.() || [])];
  function destino(k) {
    if (!activo()) return null;
    const a = ahora();
    if (!a || a.fecha.tipo === 'noventa') return null;
    if (a.fase.fase === 'llegada' && a.fecha.tipo !== 'estacion' && a.fecha.tipo !== 'aldea') return null;
    const lista = presentes();
    const clave = `${a.fecha.id}|${a.fase.fase}|${lista.join(',')}|${!!clase}`;
    if (clave !== reparto.clave) reparto = { clave, mapa: repartoFiesta(a.fecha, a.fase, lista, { leyenda: leyendaDelAnio(a.fecha.anio), musica: musicaDe(a.fecha), clase: !!clase }) };
    return reparto.mapa.get(k) || null;
  }

  // ---------------------------------------------------------------- lo que ve el mundo
  const invitadosHoy = () => {
    const a = ahora();
    const f = fechasDeHoy().find((x) => x.invitados);
    if (!f) return [];
    const prog = programaDe(f), h = horas();
    const desde = prog[0].desde - 0.3, hasta = prog[prog.length - 1].hasta;
    if (h < desde || h >= hasta + 0.5) return [];
    const lista = invitadosDe(f, ctx.ritmo?.() || 'normal', f.anio);
    const fase = a && a.fecha.id === f.id ? a.fase.fase : null;
    let ruedo = 11;
    return lista.map((inv, i) => {
      let destino = `invitado-${i % 6}`, pose = 'mirar';
      if (h >= hasta || h < prog[0].desde) { destino = 'anden'; pose = null; }
      else if (fase === 'mesa') pose = 'brindar';
      else if (fase === 'juegos') { if (inv.jinete) destino = 'tranquera'; else { destino = `ruedo-mira-${ruedo--}`; pose = 'aplaudir'; } }
      else if (fase === 'baile') { if (inv.clave === 'inv-cantora') { destino = 'tarima-2'; pose = 'tocar'; } else pose = 'aplaudir'; }
      return { ...inv, destino, pose };
    });
  };
  function paraElMundo() {
    if (!activo()) return null;
    const a = ahora();
    const hoy = fechasDeHoy();
    const grande = hoy.find((f) => f.tipo !== 'nevada' && f.tipo !== 'noventa' && !(f.tipo === 'cumple-jugador' && !f.sorpresa)) || null;
    const nevada = hoy.find((f) => f.tipo === 'nevada') || null;
    const h = horas();
    const prog = grande ? programaDe(grande) : [];
    const dentro = grande && prog.length && h >= Math.min(8, prog[0].desde - 2) && h < prog[prog.length - 1].hasta + 1;
    const fase = a && grande && a.fecha.id === grande.id ? a.fase.fase : null;
    const musica = grande ? musicaDe(grande) : null;
    const tocando = fase === 'baile' || fase === 'sorpresa' || fase === 'mesa';
    const st = estado();
    const nieve = nevada && h >= 6 ? NEVADA.casas.filter((c) => !nevadaHecha(st, anio(), c.clave, 'pala')) : [];
    return {
      fecha: grande || nevada, fase, adornos: !!dentro || nieve.length > 0, soloNieve: !dentro, menu: grande ? menuDe(grande) : null,
      asado: !!grande && ['estacion', 'aldea', 'cumple-jugador'].includes(grande.tipo) && grande.id !== 'nieve',
      musica: tocando ? musica : null, musico: tocando && !!musica, suave: fase === 'mesa',
      fuego: !!fase && ['llegada', 'mesa', 'juegos', 'baile', 'fogon', 'trabajo', 'sorpresa'].includes(fase),
      nieve, invitados: invitadosHoy(), jineteada: fase === 'juegos' && (grande?.actividades || []).includes('jineteada') ? { monta: jineteada.monta } : null,
    };
  }

  // ---------------------------------------------------------------- el reloj
  let acum = 1;
  const visto = { dia: 0, fases: new Set(), enFiesta: 0, sorpresa: 0, leyenda: { i: -1, t: 0, dicho: 0 }, mesa: 0, nevada: 0, cumpleCarta: 0, terminoMinga: 0 };
  function actualizar(dt) {
    if (!activo()) return;
    actualizarPanel(dt);
    actualizarJineteada(dt);
    acum += dt;
    if (acum < 0.5) return;
    const paso = acum;
    acum = 0;
    const d = dia(), h = horas();
    if (visto.dia !== d) { visto.dia = d; visto.fases = new Set(); visto.enFiesta = 0; visto.sorpresa = 0; visto.leyenda = { i: -1, t: 0, dicho: 0 }; visto.mesa = 0; avisarElDia(); }
    const js = ctx.jugador?.()?.estado;
    const a = ahora();
    const m = mundo();
    const enPredio = !!(js && m && dist(js.pos, m.centro()) < PREDIO.radio + 6);
    // la minga: al terminar la fase de trabajo, la obra queda hecha (con tu ayuda o sin)
    for (const f of fechasDeHoy()) if (f.tipo === 'minga' && h >= programaDe(f)[0].hasta && visto.terminoMinga !== d) {
      visto.terminoMinga = d;
      const obra = terminarMinga(estado(), d);
      if (obra) { ctx.nota?.(`La minga terminó: ${minus(obra.nombre)}`, ayudasteEnLaMinga(estado(), d) ? 'Y vos diste una mano: quedó también lo tuyo' : obra.texto, true); ctx.guardar?.(); }
    }
    // la gran nevada: la vía tapada y nieve todo el día
    const nevada = fechasDeHoy().find((f) => f.tipo === 'nevada');
    if (nevada && visto.nevada !== d && h >= 6) {
      visto.nevada = d;
      ctx.taparVia?.(true);
      ctx.nota?.('La gran nevada', 'Hace años que no nevaba así. La aldea sale a palear las puertas de los que viven solos y a llevarles leña', true);
    } else if (!nevada && visto.nevada && visto.nevada !== d) { visto.nevada = 0; ctx.taparVia?.(false); }
    // tu cumpleaños sin amigos todavía: la carta de tu mamá
    const cumple = fechasDeHoy().find((f) => f.tipo === 'cumple-jugador');
    if (cumple && !cumple.sorpresa && visto.cumpleCarta !== d && h >= 9) { visto.cumpleCarta = d; ctx.nota?.('Hoy es tu cumpleaños', 'Te llegó una carta de tu mamá: «¡Feliz cumpleaños! ¿Ya tenés amigos en la aldea? Invitalos a algo»', true); }
    // el tren de fiesta: los días con invitados, la trochita sale con banderines (de 8 al final de la fiesta)
    const conTren = fechasDeHoy().find((x) => x.invitados);
    const trenFiesta = !!conTren && h >= 8 && h < programaDe(conTren)[programaDe(conTren).length - 1].hasta + 1;
    if (trenFiesta !== visto.trenFiesta) { visto.trenFiesta = trenFiesta; (ctx.trenDeFiesta || api.trenDeFiesta)?.(trenFiesta); }
    if (!a) return;
    const f = a.fecha, fase = a.fase.fase;
    // el aviso de cada fase (si andás cerca de la aldea)
    const k = `${f.id}|${fase}`;
    if (!visto.fases.has(k)) {
      visto.fases.add(k);
      const cerca = js && m && dist(js.pos, m.centro()) < 420;
      if (cerca && fase !== 'llegada') ctx.nota?.(`${f.nombre}: ${FASES[fase] || fase}`, textoFase(f, fase), false);
    }
    // estuviste: el recuerdo (un rato en el predio, o en la plaza en el acto y los 90)
    const enPlaza = js && fase === 'acto' && ctx.enLaPlaza?.(js.pos);
    if (enPredio || enPlaza || (f.tipo === 'noventa' && js && ctx.enLaPlaza?.(js.pos))) visto.enFiesta += paso; else visto.enFiesta = Math.max(0, visto.enFiesta - paso);
    if (visto.enFiesta > 12 && f.tipo !== 'nevada' && f.tipo !== 'leyenda' && f.tipo !== 'minga') {
      const nueva = marcarVista(estado(), f.id, f.anio);
      const r = darRecuerdo(estado(), f.id, d);
      if (r) { ctx.nota?.(`Recuerdo: ${minus(r.nombre)}`, `${r.texto} Colgalo en el tablero del refugio`, true); ctx.sonido?.()?.juntar?.(); }
      if (nueva || r) ctx.guardar?.();
    }
    // la sorpresa
    if (fase === 'sorpresa' && enPredio && !visto.sorpresa) {
      visto.sorpresa = d;
      ctx.nota?.('¡Sorpresa! ¡Feliz cumpleaños!', 'Tus amigos te prepararon una mesa en el predio: torta, empanadas y música', true);
      if (!estado().cumples.includes(f.anio)) estado().cumples.push(f.anio);
      const r = darRecuerdo(estado(), 'cumple-jugador', d);
      if (r) setTimeout(() => ctx.nota?.(`Recuerdo: ${minus(r.nombre)}`, r.texto, true), 1800);
      for (const kk of presentes()) { const n = ctx.aldeaGente?.()?.personas?.get(kk)?.npc; if (n && !n.dormido && dist(n.pos, js.pos) < 25) ctx.decirNpc?.(n, kk === 'nene' || kk === 'nena' ? '¡Feliz cumple! ¡Hay torta!' : '¡Que los cumplas feliz!'); }
      ctx.guardar?.();
    }
    // la mesa larga: sentado en un banco de la mesa, te sirven
    if ((fase === 'mesa' || fase === 'sorpresa') && js?.sentado && m && cercaDeLaMesa(js.pos)) {
      visto.mesa += paso;
      if (visto.mesa > 2 && !yaComio(estado(), f, f.anio)) {
        const menu = comerEnLaMesa(estado(), f, f.anio);
        if (menu) {
          const jst = ctx.jugador?.()?.estado;
          if (jst) { jst.entumecido = 0; jst.descansado = Math.max(jst.descansado || 0, menu.buenPaso); }
          ctx.nota?.(`Te sirven ${menu.platos[0]}`, `${cap(menu.platos.slice(1).join(' y '))}${menu.platos.length > 1 ? ' también. ' : ''}Comés con la aldea: ${menu.buenPaso} horas de buen paso`, true);
          // los de al lado, contentos (un poco más amigos)
          for (const kk of presentes()) { const n = ctx.aldeaGente?.()?.personas?.get(kk)?.npc; if (n && dist(n.pos, js.pos) < 2.2) ctx.sumarAmistad?.(kk, 2); }
          ctx.guardar?.();
        }
      }
    } else visto.mesa = 0;
    // la leyenda: el que cuenta, de a una parte, si estás cerca del fogón
    if (fase === 'fogon' && js && m) {
      const ley = leyendaDelAnio(f.anio);
      const fogon = m.punto('narrador');
      if (fogon && dist(js.pos, fogon) < 11) {
        visto.leyenda.t -= paso;
        if (visto.leyenda.t <= 0) {
          visto.leyenda.i++;
          visto.leyenda.t = 9;
          if (visto.leyenda.i < ley.partes.length) { const quien = nombreCortoDe(ley.quien) || 'La abuela'; ctx.decir?.(`${quien}: ${ley.partes[visto.leyenda.i]}`); const n = ctx.aldeaGente?.()?.personas?.get(ley.quien)?.npc; if (n) ctx.decirNpc?.(n, ley.partes[visto.leyenda.i], { renglon: false }); }
          else if (visto.leyenda.i === ley.partes.length) { ctx.decir?.(''); escuchoLeyenda(ley, d); }
        }
      } else if (visto.leyenda.i >= 0 && visto.leyenda.i < ley.partes.length) ctx.decir?.('');
    }
    // los vecinos y el domador montan solos (cada tanto, si estás mirando)
    if (fase === 'juegos' && (f.actividades || []).includes('jineteada') && !jineteada.monta && js && m && dist(js.pos, m.punto('palenque')) < 45) {
      jineteada.espera -= paso;
      if (jineteada.espera <= 0) {
        const inv = invitadosHoy().find((x) => x.jinete);
        const quien = inv && mundo()?.figura(inv.clave) ? inv.clave : null;
        if (quien) { jineteada.monta = { quien, t: 0, eq: 0, dura: montaDeJinete(quien, d * 7 + jineteada.n++), fin: false }; ctx.nota?.(`¡Sale ${nombreInvitado(quien)}!`, 'Ocho segundos arriba del redomón, con los apadrinadores al lado', false); }
        jineteada.espera = 30;
      }
    }
  }
  const nombreInvitado = (k) => invitadosDe(FECHAS[0], 'animado').concat(invitadosDe(FECHAS[2], 'animado')).find((x) => x.clave === k)?.nombre?.split(' ')[0] || 'el domador';
  function escuchoLeyenda(ley, d) {
    const st = estado();
    if (!st.leyendas.includes(ley.id)) st.leyendas.push(ley.id);
    marcarVista(st, 'leyenda', anioDe(d));
    const r = darRecuerdo(st, 'leyenda', d);
    ctx.registrarLeyenda?.(ley);
    if (r) ctx.nota?.(`Recuerdo: ${minus(r.nombre)}`, `${r.texto} La leyenda queda en el diario`, true);
    ctx.diario?.('historia', minus(ley.titulo));
    ctx.guardar?.();
  }
  function textoFase(f, fase) {
    if (fase === 'acto') return 'Ernesto iza la bandera en la plaza. Después, la mesa larga en el predio';
    if (fase === 'mesa') return `La mesa larga ${DONDE(f)}: sentate en un banco y te sirven`;
    if (fase === 'juegos') return (f.actividades || []).includes('jineteada') ? 'La jineteada en el ruedo, la taba y la mesita del truco' : 'La taba y la mesita del truco, en el predio';
    if (fase === 'baile') return `Música en la tarima: ${musicaDe(f) ? `${(MUSICA_NOMBRE[musicaDe(f)] || 'música')}` : 'música'} y baile en la pista`;
    if (fase === 'fogon') return 'El fogón del predio: esta noche se cuenta una leyenda';
    if (fase === 'trabajo') return `${mingaDelAnio(f.anio).nombre}: dá una mano en la leñera del predio`;
    if (fase === 'palear') return 'Las puertas de la abuela, Nélida, Ercilia y Ernesto están tapadas de nieve';
    if (fase === 'sorpresa') return 'Te esperan en el predio';
    return '';
  }
  const MUSICA_NOMBRE = { chamame: 'chamamé', loncomeo: 'loncomeo', chacarera: 'chacarera', sur: 'folklore del sur' };
  function avisarElDia() {
    const hoy = fechasDeHoy().filter((f) => f.tipo !== 'nevada' && !(f.tipo === 'cumple-jugador' && !f.sorpresa) && f.tipo !== 'noventa');
    if (!hoy.length) return;
    const f = hoy[0], p = programaDe(f);
    if (horas() > p[p.length - 1].hasta) return;
    const partes = p.filter((x) => x.fase !== 'llegada').map((x) => `${FASES[x.fase]} a las ${textoHora(x.desde)}`);
    setTimeout(() => ctx.nota?.(`Hoy: ${f.nombre}`, f.tipo === 'cumple-jugador' ? 'Hoy cumplís años. Andá al predio a la tardecita (no preguntes por qué)' : `${cap(partes.join(', '))}, ${DONDE(f)}`, true), 2500);
  }
  function cercaDeLaMesa(pos) {
    const m = mundo();
    if (!m) return false;
    for (let i = 0; i < PREDIO.mesa.sitios; i++) for (const lado of ['n', 's']) { const q = m.punto(`mesa-${lado}-${i}`); if (q && dist(q, pos) < 0.7) return true; }
    return false;
  }

  // ---------------------------------------------------------------- E y el aviso
  function accion(js) {
    if (!activo() || !js?.pos || panel) return null;
    if (js.enTren || js.enKayak || js.montado) return null;
    const m = mundo();
    if (!m) return null;
    const p = js.pos, d = dia();
    // los recuerdos, en el tablero del refugio
    const tab = m.tablero?.();
    if (tab && Math.hypot(tab.x - p.x, tab.z - p.z) < 2 && Math.abs(tab.y - (p.y + 1.6)) < 1.6 && porColgar(estado()).length) {
      const n = porColgar(estado()).length;
      return { tipo: 'fiesta-colgar', texto: n === 1 ? 'Colgar el recuerdo de la fiesta' : `Colgar los ${n} recuerdos de las fiestas`, hacer: colgar };
    }
    if (js.sentado) return null;
    const a = ahora();
    // la nevada solidaria: las puertas de los que viven solos
    const nevada = fechasDeHoy().find((f) => f.tipo === 'nevada');
    if (nevada && horas() >= 6 && horas() < 20) {
      for (const c of NEVADA.casas) {
        const q = ctx.puertaDe?.(c.edificio);
        if (!q || Math.hypot(q.x - p.x, q.z - p.z) > 2.6) continue;
        const nombre = nombreCortoDe(c.clave) || c.clave;
        if (!nevadaHecha(estado(), anio(), c.clave, 'pala')) return { tipo: 'fiesta-palear', texto: `Palear la nieve de la puerta de ${nombre}`, hacer: () => palear(c) };
        if (!nevadaHecha(estado(), anio(), c.clave, 'lena')) return { tipo: 'fiesta-lena', texto: `Llevarle leña a ${nombre}`, hacer: () => llevarLena(c) };
      }
    }
    if (!enElPredioMundo(p)) return null;
    const cerca = (nombre, r) => { const q = m.punto(nombre); return q && Math.hypot(q.x - p.x, q.z - p.z) < r ? q : null; };
    const fase = a?.fase.fase || null, f = a?.fecha || null;
    if (fase === 'juegos' && (f.actividades || []).includes('jineteada') && (cerca('tranquera', 2.4) || cerca('palenque', 2.4))) {
      if (jineteada.monta) return { tipo: 'fiesta-jineteada', texto: 'Esperar: está montando otro', hacer: () => ctx.nota?.('Está montando otro', 'Cuando termine, te toca') };
      if (!puedeMontar(estado(), d)) return { tipo: 'fiesta-jineteada', texto: 'Ya montaste hoy (una por fiesta)', hacer: () => ctx.nota?.('Una monta por fiesta', 'El redomón también tiene que descansar') };
      return { tipo: 'fiesta-jineteada', texto: 'Anotarte en la jineteada', hacer: montar };
    }
    if (cerca('mesita', 1.6) || cerca('juegos-0', 1.0)) {
      const rival = rivalEnLaMesita();
      return { tipo: 'fiesta-juegos', texto: rival ? `Jugar con ${rival.nombre} (truco, chinchón o damas)` : 'La mesita de los juegos: no hay nadie para jugar', hacer: () => abrirMenuJuegos(rival) };
    }
    if (fase === 'juegos' && cerca('taba-tira', 1.4)) return { tipo: 'fiesta-taba', texto: 'Tirar la taba', hacer: () => abrirTaba() };
    if ((fase === 'baile' || fase === 'sorpresa') && enLaPista(p)) {
      const st = estado();
      const pocha = ctx.aldeaGente?.()?.personas?.get('modista')?.npc;
      const baile = poseDeBaile(musicaDe(f)) === 'chacarera' ? 'chacarera' : 'chamame';
      if (pocha && !pocha.dormido && puedeTomarClase(st, d) && st.baile[baile] < NIVEL_BAILE_MAX) return { tipo: 'fiesta-baile', texto: `Tomar una clase de ${BAILES[baile].nombre} con Pocha`, hacer: () => abrirClase(baile) };
      return { tipo: 'fiesta-baile', texto: `Bailar ${baile === 'chacarera' ? 'una chacarera' : 'un chamamé'}`, hacer: () => bailar(baile) };
    }
    if (fase === 'fogon' && cerca('narrador', 3.2)) return { tipo: 'fiesta-leyenda', texto: `Escuchar ${minus(leyendaDelAnio(f.anio).titulo)}`, hacer: () => leerLeyenda(f) };
    if (fase === 'trabajo' && cerca('lenera', 3.4)) {
      const mi = mingaDelAnio(f.anio);
      return { tipo: 'fiesta-minga', texto: `Dar una mano en la minga (${minus(mi.nombre)})`, hacer: ayudarMinga };
    }
    return null;
  }
  function enElPredioMundo(p) { const m = mundo(); if (!m) return false; const l = m.aLocal(p.x, p.z); return enElPredio(l.x, l.z, PREDIO.radio); }
  function enLaPista(p) { const m = mundo(); if (!m) return false; const l = m.aLocal(p.x, p.z), q = PREDIO.pista; return Math.abs(l.x - q.x) < q.largo / 2 + 0.2 && Math.abs(l.z - q.z) < q.ancho / 2 + 0.2; }
  function rivalEnLaMesita() {
    const m = mundo();
    const silla = m?.punto('juegos-1');
    if (!silla) return null;
    for (const [k, st] of ctx.aldeaGente?.()?.personas || []) {
      const n = st.npc;
      if (n && !n.dormido && dist(n.pos, silla) < 1.2 && !CHICOS.includes(k)) return { clave: k, nombre: nombreCortoDe(k) || n.nombre, npc: n };
    }
    // (si no hay nadie sentado, juega el que esté más cerca en el predio)
    let mejor = null, dm = 6;
    for (const [k, st] of ctx.aldeaGente?.()?.personas || []) { const n = st.npc; if (!n || n.dormido || CHICOS.includes(k)) continue; const dd = dist(n.pos, silla); if (dd < dm) { dm = dd; mejor = { clave: k, nombre: nombreCortoDe(k) || n.nombre, npc: n }; } }
    return mejor;
  }
  function colgar() {
    const nuevos = colgarRecuerdos(estado());
    if (!nuevos.length) return;
    ctx.nota?.(nuevos.length === 1 ? `Colgaste ${minus(RECUERDOS[nuevos[0]].nombre)}` : `Colgaste ${nuevos.length} recuerdos`, 'Quedan en el tablero del refugio', true);
    ctx.sonido?.()?.juntar?.();
    ctx.guardar?.();
  }
  function palear(c) {
    const r = ayudarEnLaNevada(estado(), anio(), c.clave, 'pala');
    if (!r.ok) return;
    ctx.sonido?.()?.paso?.('nieve', 0.8);
    ctx.sumarAmistad?.(c.clave, NEVADA.amistad);
    ctx.nota?.(`Paleaste la puerta de ${nombreCortoDe(c.clave)}`, '«¡Gracias, m\'hijo! Ya no podía abrir»', false);
    terminoNevada(r);
    ctx.guardar?.();
  }
  function llevarLena(c) {
    const st = estado();
    const lenera = st.minga.some((m) => m.obra === 'lenera');
    if (!lenera) {
      const hay = ctx.troncos?.() || 0;
      if (hay < NEVADA.lena) { ctx.nota?.(`Te faltan troncos (${NEVADA.lena})`, 'Sin la leñera de la minga, la leña sale de tus troncos'); return; }
      ctx.gastarTroncos?.(NEVADA.lena);
    }
    const r = ayudarEnLaNevada(st, anio(), c.clave, 'lena');
    if (!r.ok) return;
    ctx.sumarAmistad?.(c.clave, NEVADA.amistad);
    ctx.nota?.(`Le llevaste leña a ${nombreCortoDe(c.clave)}`, lenera ? 'De la leñera de la minga: para eso se hizo' : `${NEVADA.lena} troncos tuyos. Va a pasar la noche calentito`, false);
    ctx.refrescarBarra?.();
    terminoNevada(r);
    ctx.guardar?.();
  }
  function terminoNevada(r) {
    if (!r.todas) return;
    const rr = darRecuerdo(estado(), 'nevada', dia());
    ctx.nota?.('La aldea quedó abrigada', 'Todas las puertas paleadas y con leña. Esta noche hay locro en el salón', true);
    if (rr) setTimeout(() => ctx.nota?.(`Recuerdo: ${minus(rr.nombre)}`, rr.texto, true), 2000);
  }
  function ayudarMinga() {
    const r = cargarMinga(estado(), dia());
    if (r.hecha) { ctx.nota?.('La obra ya está hecha', 'Lo de este año ya quedó'); return; }
    ctx.sonido?.()?.juntar?.();
    if (r.faltan > 0) ctx.nota?.(`Llevaste una carga (${r.cargas} de ${r.obra.cargas})`, r.cargas === 1 ? 'Los vecinos te hacen lugar. «¡Así me gusta!»' : 'Una más y otra más', false);
    else {
      ctx.nota?.(`${r.obra.nombre}: tu parte, hecha`, 'A la una se come en la mesa larga', true);
      const rr = darRecuerdo(estado(), 'minga', dia());
      if (rr) setTimeout(() => ctx.nota?.(`Recuerdo: ${minus(rr.nombre)}`, rr.texto, true), 1800);
      for (const k of presentes()) { const n = ctx.aldeaGente?.()?.personas?.get(k)?.npc; const js = ctx.jugador?.()?.estado; if (n && js && dist(n.pos, js.pos) < 8) ctx.sumarAmistad?.(k, 2); }
    }
    marcarVista(estado(), 'minga', anio());
    ctx.guardar?.();
  }
  function leerLeyenda(f) {
    const ley = leyendaDelAnio(f.anio);
    ctx.leer?.({ id: `leyenda-${ley.id}`, quien: nombreCortoDe(ley.quien) || 'La abuela', que: ley.titulo, partes: ley.partes, despedida: 'Y colorín colorado, el fuego se apagó.' });
    visto.leyenda.i = ley.partes.length + 1;
    escuchoLeyenda(ley, dia());
  }
  function bailar(baile) {
    const st = estado();
    const nivel = st.baile[baile] || 0;
    const js = ctx.jugador?.()?.estado;
    if (js) js.descansado = Math.max(js.descansado || 0, 1 + nivel * 0.5);
    ctx.nota?.(nivel ? `Bailaste ${baile === 'chacarera' ? 'una chacarera' : 'un chamamé'} (nivel ${nivel})` : `Bailaste ${baile === 'chacarera' ? 'una chacarera' : 'un chamamé'}, a tu manera`, nivel >= 2 ? 'La pista te aplaude' : nivel ? 'Ya no pisás a nadie' : 'Pocha da clases en la pista: pedile una', false);
    for (const k of presentes()) { const n = ctx.aldeaGente?.()?.personas?.get(k)?.npc; if (n && js && dist(n.pos, js.pos) < 4) ctx.sumarAmistad?.(k, 1 + nivel); }
  }

  // ---------------------------------------------------------------- la jineteada
  const jineteada = { monta: null, jugador: null, espera: 6, n: 0, cam: false };
  function montar() {
    if (jineteada.monta) return;
    jineteada.jugador = jineteadaNueva(dia() * 13 + horas() * 7, 1);
    jineteada.monta = { quien: 'jugador', t: 0, eq: 0, fin: false };
    abrirPanel('jineteada');
    ctx.nota?.('¡Sale el redomón!', 'A y D (o las flechas, o el palito) para no caerte: adelantate a los corcovos', true);
  }
  function actualizarJineteada(dt) {
    const mo = jineteada.monta;
    if (!mo) return;
    if (mo.quien === 'jugador') {
      const j = jineteada.jugador;
      if (!j || mo.fin) return;   // (ya terminó: espera que lo bajen)
      const t = ctx.jugador?.()?.teclas;
      let e = 0;
      if (t) { if (t.has('KeyA') || t.has('ArrowLeft')) e -= 1; if (t.has('KeyD') || t.has('ArrowRight')) e += 1; }
      // (la izquierda empuja el cuerpo para la izquierda: compensa la caída para la derecha)
      pasoJineteada(j, dt, -e);
      mo.t = j.t; mo.eq = j.eq;
      // el jugador, sobre el suelo abajo de la montura (la cámara, la de fiestas-mundo.js)
      const js = ctx.jugador?.()?.estado, s = mundo()?.sueloJineteada?.();
      if (js && s) { js.pos.x = s.x; js.pos.z = s.z; js.vel?.set?.(0, 0, 0); }
      if (j.cayo || j.aguanto) {
        mo.fin = true;
        const primera = anotarMonta(estado(), j.t, dia());
        if (j.aguanto) {
          ctx.nota?.('¡Aguantaste el tiempo!', 'Suena la campana y los apadrinadores te bajan. El predio aplaude', true);
          if (primera) { const r = darRecuerdo(estado(), 'jineteada', dia()); if (r) setTimeout(() => ctx.nota?.(`Recuerdo: ${minus(r.nombre)}`, r.texto, true), 2000); }
          for (const k of presentes()) ctx.sumarAmistad?.(k, 1);
        } else ctx.nota?.(`Te caíste a los ${j.t.toFixed(1)} segundos`, 'Los apadrinadores te agarran. El redomón: 1, vos: 0', true);
        ctx.guardar?.();
        terminarMonta(2.5);
      }
      return;
    }
    // un invitado: lo que aguanta ya está decidido (montaDeJinete)
    mo.t += dt;
    mo.eq = Math.sin(mo.t * 2.2) * 0.6 * Math.min(1, mo.t / 2);
    if (mo.dura < 50 && mo.t >= Math.min(mo.dura, JINETEADA.tiempo) && !mo.fin) {   // (dura 99: las capturas, sigue montando)
      mo.fin = true;
      const js = ctx.jugador?.()?.estado, m = mundo();
      if (js && m && dist(js.pos, m.punto('palenque')) < 40) ctx.nota?.(mo.dura >= JINETEADA.tiempo ? `¡${nombreInvitado(mo.quien)} aguantó el tiempo!` : `${nombreInvitado(mo.quien)} se cayó a los ${mo.dura.toFixed(1)} segundos`, mo.dura >= JINETEADA.tiempo ? 'El predio aplaude' : 'Se levanta y saluda con el sombrero', false);
      terminarMonta(3);
    }
  }
  function terminarMonta(seg) {
    setTimeout(() => { jineteada.monta = null; jineteada.jugador = null; jineteada.espera = 30; if (panel?.vista === 'jineteada') cerrarPanel(); }, seg * 1000);
  }
  // (main.js: la cámara va arriba del redomón mientras montás)
  function camara(cam) {
    if (jineteada.monta?.quien !== 'jugador') return false;
    return !!mundo()?.camaraJineteada?.(cam, jineteada.monta.eq || 0);
  }

  // ---------------------------------------------------------------- el panel
  let panel = null;   // { vista, opciones, firma, ... }
  let clase = null;   // la clase de baile en curso
  const $ = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);
  function estilos() {
    if (typeof document === 'undefined' || document.getElementById('fiesta-estilos')) return;
    const s = document.createElement('style');
    s.id = 'fiesta-estilos';
    s.textContent = `#fiesta-panel .dicho { display: block; }
#fiesta-panel .mesa-juego { display: flex; flex-direction: column; gap: 6px; margin: 4px 0 2px; }
#fiesta-panel .fila-cartas { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; min-height: 54px; }
#fiesta-panel .carta { width: 38px; height: 54px; border-radius: 5px; background: #f4ecd8; box-shadow: 0 1px 3px rgba(0,0,0,.45); display: flex; flex-direction: column; align-items: center; justify-content: center; font: 600 15px/1 Spectral, Georgia, serif; color: #2a2016; }
#fiesta-panel .carta i { font-style: normal; font-size: 17px; }
#fiesta-panel .carta.dorso { background: repeating-linear-gradient(45deg, #7a2a2a 0 4px, #8a3a32 4px 8px); }
#fiesta-panel .carta.chica { width: 30px; height: 42px; font-size: 12px; }
#fiesta-panel .rotulo { font: 13px/1.2 Spectral, Georgia, serif; opacity: .8; min-width: 60px; }
#fiesta-panel .tablero { display: grid; grid-template-columns: repeat(8, 24px); grid-template-rows: repeat(8, 24px); border: 2px solid #4a3626; width: max-content; }
#fiesta-panel .tablero span { display: flex; align-items: center; justify-content: center; font-size: 17px; }
#fiesta-panel .tablero .os { background: #6a4c34; } #fiesta-panel .tablero .cl { background: #d8c8a8; }
#fiesta-panel .tablero .ult { box-shadow: inset 0 0 0 2px #e8c048; }
#fiesta-panel .barra { position: relative; height: 18px; width: 100%; max-width: 360px; background: linear-gradient(90deg, #b83a3a 0 12%, #d8b048 12% 30%, #5a9a5a 30% 70%, #d8b048 70% 88%, #b83a3a 88%); border-radius: 9px; margin: 6px 0; }
#fiesta-panel .barra b { position: absolute; top: -4px; width: 6px; height: 26px; background: #f4ecd8; border-radius: 3px; box-shadow: 0 0 3px #000; }
#fiesta-panel .log { font: 13px/1.3 Spectral, Georgia, serif; opacity: .85; }`;
    document.head.appendChild(s);
  }
  function abrirPanel(vista, extra = {}) {
    estilos();
    panel = { vista, opciones: [], firma: null, ...extra };
    $('fiesta-panel')?.classList.remove('oculto');
    dibujarPanel(true);
    ctx.alAbrirPanel?.();
  }
  function cerrarPanel() {
    if (!panel) return;
    panel = null; clase = null;
    $('fiesta-panel')?.classList.add('oculto');
  }
  const panelAbierto = () => !!panel;
  // E con el panel abierto: cierra lo que no está en juego (el menú, un partido terminado); en un partido, nada (Escape)
  function alApretarE() {
    if (!panel) return false;
    const v = panel.vista, j0 = panel.juego;
    const enJuego = (v === 'truco' || v === 'chinchon' || v === 'damas') && j0 && j0.terminado === null;
    if (v === 'jineteada' || enJuego || (v === 'baile' && clase && !clase.fin) || (v === 'taba' && !panel.fin)) return true;
    cerrarPanel();
    return true;
  }
  // Escape: dejar el partido (o salir)
  function atras() {
    if (!panel) return false;
    const v = panel.vista;
    if (v === 'truco' || v === 'chinchon' || v === 'damas') { if (!panel.juego.terminado && panel.juego.terminado !== 0 && panel.juego.terminado !== 'tablas') ctx.nota?.('Dejaste el partido', `${panel.rival?.nombre || 'Tu rival'}: «Otro día lo terminamos»`); }
    if (v === 'jineteada') { if (jineteada.jugador && !jineteada.monta?.fin) { jineteada.jugador.cayo = true; } return true; }
    cerrarPanel();
    return true;
  }
  function abrirMenuJuegos(rival) {
    if (!rival) { ctx.nota?.('No hay nadie en la mesita', 'En las fiestas, alguien siempre se sienta a jugar'); return; }
    abrirPanel('menu', { rival });
  }
  // desde la rueda («Jugar un truco»): el partido con ese vecino, ahí mismo
  function jugarTruco(npc, clave) {
    if (!activo() || !npc) return false;
    const k = clave || npc.claveAldea || npc.clave;
    empezarTruco({ clave: k, nombre: nombreCortoDe(k) || npc.nombre || 'tu vecino', npc });
    return true;
  }
  function empezarTruco(rival) {
    const semilla = dia() * 101 + Math.floor(horas() * 60);
    abrirPanel('truco', { rival, juego: partidoNuevo({ semilla, empieza: semilla % 2 }), espera: 0.9, log: [] });
  }
  function empezarChinchon(rival) { const semilla = dia() * 37 + Math.floor(horas() * 60); abrirPanel('chinchon', { rival, juego: chinchonNuevo({ semilla, empieza: semilla % 2 }), espera: 0.9, log: [] }); }
  function empezarDamas(rival) { abrirPanel('damas', { rival, juego: damasNuevas({ empieza: 0 }), espera: 0.9, log: [] }); }
  function abrirTaba() {
    const rival = (() => { const n = ctx.aldeaGente?.()?.personas?.get('padre')?.npc; return n && !n.dormido ? { clave: 'padre', nombre: 'Mario', npc: n } : { clave: 'padre', nombre: 'Mario', npc: null }; })();
    abrirPanel('taba', { rival, barra: 0, dir: 1, turno: 0, log: [], fin: null, semilla: dia() * 17 + Math.floor(horas() * 100), n: 0 });
  }
  function abrirClase(baile) {
    clase = claseNueva(baile, estado().baile[baile] || 0, dia() * 29 + Math.floor(horas() * 10));
    reparto.clave = '';
    abrirPanel('baile', { baile, muestra: 0, t: 0 });
  }
  const signo = (c) => `<span class="carta" style="color:${PALO_COLOR[c.palo] || '#222'}">${c.palo === 'comodin' ? '' : c.n}<i>${PALO_SIGNO[c.palo] || ''}</i></span>`;
  const dorso = (chica = false) => `<span class="carta dorso${chica ? ' chica' : ''}"></span>`;
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // lo que dice el panel arriba (HTML) y las opciones
  function vistaPanel() {
    const v = panel.vista, r = panel.rival;
    const quien = r?.nombre || 'Tu rival';
    if (v === 'menu') {
      const st = estado().juegos;
      return { titulo: `La mesita de los juegos, con ${quien}`, html: `<p>${esc(`${quien} baraja el mazo: «¿A qué le damos?»`)}</p><p class="log">${esc(`Truco: ${st.truco.g} ganados, ${st.truco.p} perdidos · Chinchón: ${st.chinchon.g} y ${st.chinchon.p} · Damas: ${st.damas.g} y ${st.damas.p}`)}</p>`,
        opciones: [
          { texto: 'Un truco (a 15)', detalle: '— mano a mano, sin flor', marca: 'jugar', puede: true, hacer: () => empezarTruco(r) },
          { texto: 'Un chinchón (a 50)', detalle: '— siete cartas, con comodines', marca: 'jugar', puede: true, hacer: () => empezarChinchon(r) },
          { texto: 'Unas damas', detalle: '— comer es obligatorio', marca: 'jugar', puede: true, hacer: () => empezarDamas(r) },
          { texto: 'Mejor no', detalle: '', marca: '', puede: true, hacer: cerrarPanel },
        ] };
    }
    if (v === 'truco') {
      const p = panel.juego, ro = p.ronda;
      const bazas = [0, 1, 2].map((b) => `<span class="rotulo">${b + 1}ª</span>${ro.mesa[1][b] ? signo(ro.mesa[1][b]) : '<span class="carta dorso chica" style="opacity:.15"></span>'}${ro.mesa[0][b] ? signo(ro.mesa[0][b]) : '<span class="carta dorso chica" style="opacity:.15"></span>'}`).join('');
      const suyas = ro.cartas[1].filter(Boolean).map(() => dorso(true)).join('');
      const mias = ro.cartas[0].filter(Boolean).map(signo).join('');
      const tanto = envidoDe(ro.cartas[0].concat(ro.mesa[0]).filter(Boolean));
      const html = `<div class="mesa-juego"><div class="fila-cartas"><span class="rotulo">${esc(quien)}</span>${suyas}</div><div class="fila-cartas">${bazas}</div><div class="fila-cartas"><span class="rotulo">Vos</span>${mias}<span class="rotulo">· tenés ${tanto} de envido</span></div></div>
        <p class="log">${esc(`Vos ${p.puntos[0]} · ${quien} ${p.puntos[1]} (a ${p.aPuntos}) · ${ro.mano === 0 ? 'sos mano' : `es mano ${quien}`}`)}</p><p class="log">${panel.log.slice(-3).map(esc).join('<br>')}</p>`;
      const acc = accionesDe(p, 0);
      const opciones = acc.map((a) => {
        if (a.startsWith('carta:')) { const c = ro.cartas[0][Number(a.slice(6))]; return { texto: `Tirar el ${nombreCarta(c)}`, detalle: '', marca: '', puede: true, hacer: () => truco(a) }; }
        if (a === 'seguir') return { texto: p.terminado !== null ? 'Listo' : 'Repartir otra mano', detalle: '', marca: '', puede: true, hacer: () => (p.terminado !== null ? cerrarPanel() : truco(a)) };
        return { texto: cap(NOMBRES_CANTO[a] || a), detalle: '', marca: a === 'mazo' ? '' : 'cantar', puede: true, hacer: () => truco(a) };
      });
      if (p.terminado !== null) opciones.splice(0, opciones.length, { texto: 'Listo', detalle: '', marca: '', puede: true, hacer: cerrarPanel });
      else if (!acc.length) opciones.push({ texto: `Le toca a ${quien}…`, detalle: '', marca: '', puede: false, hacer: () => {} });
      return { titulo: `Truco con ${quien}`, html, opciones };
    }
    if (v === 'chinchon') {
      const p = panel.juego, ro = p.ronda;
      const mano = ro.cartas[0];
      const lig = mejorLigado(mano.length > 7 ? mano.slice(0, 7) : mano);
      const arriba = ro.pozo[ro.pozo.length - 1];
      const html = `<div class="mesa-juego"><div class="fila-cartas"><span class="rotulo">${esc(quien)}</span>${ro.cartas[1].map(() => dorso(true)).join('')}</div>
        <div class="fila-cartas"><span class="rotulo">Mazo</span>${dorso(true)}<span class="rotulo">Pozo</span>${arriba ? signo(arriba) : ''}</div>
        <div class="fila-cartas"><span class="rotulo">Vos</span>${mano.map(signo).join('')}</div></div>
        <p class="log">${esc(`Vos ${p.puntos[0]} · ${quien} ${p.puntos[1]} (pierde el que pasa de ${p.aPuntos}) · sueltas: ${lig.resto}`)}</p>${ro.terminada && ro.resultado ? `<p class="log">${esc(`Cortó ${ro.corto === 0 ? 'vos' : quien}: vos sumás ${ro.resultado.pts[0]}, ${quien} ${ro.resultado.pts[1]}`)}</p>` : ''}<p class="log">${panel.log.slice(-2).map(esc).join('<br>')}</p>`;
      const acc = accionesChinchon(p, 0);
      const opciones = acc.map((a) => {
        if (a === 'mazo') return { texto: 'Levantar del mazo', detalle: '', marca: '', puede: true, hacer: () => chinchon(a) };
        if (a === 'pozo') return { texto: `Levantar el ${nombreCartaChinchon(arriba)} del pozo`, detalle: '', marca: '', puede: true, hacer: () => chinchon(a) };
        if (a === 'seguir') return { texto: p.terminado !== null ? 'Listo' : 'Otra mano', detalle: '', marca: '', puede: true, hacer: () => (p.terminado !== null ? cerrarPanel() : chinchon(a)) };
        const [q, i] = a.split(':');
        const c = mano[Number(i)];
        return { texto: `${q === 'cortar' ? 'Cortar tirando' : 'Tirar'} el ${nombreCartaChinchon(c)}`, detalle: '', marca: q === 'cortar' ? 'cortar' : '', puede: true, hacer: () => chinchon(a) };
      });
      if (p.terminado !== null) opciones.splice(0, opciones.length, { texto: 'Listo', detalle: '', marca: '', puede: true, hacer: cerrarPanel });
      else if (!acc.length) opciones.push({ texto: `Le toca a ${quien}…`, detalle: '', marca: '', puede: false, hacer: () => {} });
      return { titulo: `Chinchón con ${quien}`, html, opciones };
    }
    if (v === 'damas') {
      const e = panel.juego;
      const ult = new Set((e.ultimo?.camino || []).map(([f, c]) => `${f},${c}`));
      let celdas = '';
      for (let f = 0; f < 8; f++) for (let c = 0; c < 8; c++) {
        const x = e.tablero[f][c];
        const pieza = x ? `<b style="color:${x.de === 0 ? '#f4ecd8' : '#1e1612'};text-shadow:0 0 2px ${x.de === 0 ? '#000' : '#c8b090'}">${x.dama ? '♛' : '●'}</b>` : '';
        celdas += `<span class="${(f + c) % 2 ? 'os' : 'cl'}${ult.has(`${f},${c}`) ? ' ult' : ''}">${pieza}</span>`;
      }
      const html = `<div class="mesa-juego"><div class="tablero">${celdas}</div></div><p class="log">${esc(e.terminado === null ? (e.turno === 0 ? 'Te toca (las claras)' : `Piensa ${quien}…`) : e.terminado === 'tablas' ? 'Tablas' : e.terminado === 0 ? '¡Ganaste!' : `Ganó ${quien}`)}</p><p class="log">${panel.log.slice(-2).map(esc).join('<br>')}</p>`;
      const opciones = e.terminado === null && e.turno === 0 ? jugadasDamas(e).map((j) => ({ texto: textoJugada(j), detalle: j.comidas.length ? `— come ${j.comidas.length}` : '', marca: '', puede: true, hacer: () => damas(j) })) : [];
      if (e.terminado !== null) opciones.push({ texto: 'Listo', detalle: '', marca: '', puede: true, hacer: cerrarPanel });
      else if (!opciones.length) opciones.push({ texto: `Le toca a ${quien}…`, detalle: '', marca: '', puede: false, hacer: () => {} });
      return { titulo: `Damas con ${quien}`, html, opciones };
    }
    if (v === 'taba') {
      const pct = Math.round(panel.barra * 100);
      const html = `<p>${esc(panel.fin ? (panel.fin === 'gano' ? '¡Suerte! Ganaste la tirada.' : `Culo. Ganó ${quien}.`) : panel.turno === 0 ? 'Apretá «Tirar» cuando la marca esté en lo verde: con fuerza justa, pasa la raya y no se va lejos.' : `Tira ${quien}…`)}</p>
        <div class="barra"><b style="left:calc(${pct}% - 3px)"></b></div><p class="log">${panel.log.slice(-3).map(esc).join('<br>')}</p>`;
      const opciones = panel.fin ? [{ texto: 'Otra vez', detalle: '', marca: '', puede: true, hacer: () => { Object.assign(panel, { fin: null, turno: 0, log: [] }); } }, { texto: 'Listo', detalle: '', marca: '', puede: true, hacer: cerrarPanel }]
        : panel.turno === 0 ? [{ texto: 'Tirar', detalle: '', marca: '', puede: true, hacer: tirar }] : [{ texto: `Tira ${quien}…`, detalle: '', marca: '', puede: false, hacer: () => {} }];
      return { titulo: 'La taba', html, opciones, vivo: true };
    }
    if (v === 'baile') {
      const b = BAILES[panel.baile];
      if (!clase) return { titulo: 'La clase de baile', html: '', opciones: [{ texto: 'Listo', detalle: '', marca: '', puede: true, hacer: cerrarPanel }] };
      const mostrando = panel.muestra < clase.secuencia.length;
      const html = mostrando
        ? `<p>${esc(`Pocha: «Mirá bien: ${clase.secuencia.slice(0, panel.muestra + 1).map((i) => b.pasos[i]).join(', ')}…»`)}</p>`
        : clase.fin ? `<p>${esc(clase.aprobada ? `Pocha: «¡Eso es ${b.nombre}! Subiste un nivel.»` : 'Pocha: «Casi. Mañana probamos de nuevo, que la pista no se va.»')}</p>`
          : `<p>${esc(`Pocha: «Ahora vos.» (${clase.i} de ${clase.secuencia.length}${clase.errores ? `, ${clase.errores} ${clase.errores === 1 ? 'pisotón' : 'pisotones'}` : ''})`)}</p>`;
      const opciones = clase.fin ? [{ texto: 'Listo', detalle: '', marca: '', puede: true, hacer: cerrarPanel }]
        : mostrando ? [{ texto: 'Ya vi (empezar)', detalle: '', marca: '', puede: true, hacer: () => { panel.muestra = clase.secuencia.length; } }]
          : b.pasos.map((nombre, i) => ({ texto: cap(nombre), detalle: '', marca: '', puede: true, hacer: () => paso(i) }));
      return { titulo: `Clase de ${b.nombre} con Pocha (nivel ${estado().baile[panel.baile] || 0} de ${NIVEL_BAILE_MAX})`, html, opciones, vivo: mostrando };
    }
    if (v === 'jineteada') {
      const mo = jineteada.monta, eq = mo?.eq || 0, t = mo?.t || 0;
      const pct = Math.round((eq + 1) * 50);
      const html = `<p>${esc(mo?.fin ? (jineteada.jugador?.aguanto ? '¡Aguantaste!' : '¡Al suelo!') : `${t.toFixed(1)} de ${JINETEADA.tiempo} segundos`)}</p><div class="barra"><b style="left:calc(${pct}% - 3px)"></b></div><p class="log">A y D, las flechas o el palito: mantené la marca en el medio.</p>`;
      return { titulo: 'La jineteada', html, opciones: [{ texto: 'Soltarse', detalle: '— Escape', marca: '', puede: !mo?.fin, hacer: () => { if (jineteada.jugador) jineteada.jugador.cayo = true; } }], vivo: true };
    }
    return { titulo: '', html: '', opciones: [] };
  }
  function dibujarPanel(forzar = false) {
    if (!panel) return;
    const v = vistaPanel();
    panel.opciones = v.opciones;
    const firma = `${panel.vista}|${v.titulo}|${v.html}|${v.opciones.map((o) => `${o.texto}${o.puede}`).join(';')}`;
    if (!forzar && firma === panel.firma) return;
    panel.firma = firma;
    const div = $('fiesta-panel');
    if (!div) return;
    div.querySelector('.quien').textContent = T_(v.titulo);
    div.querySelector('.dicho').innerHTML = v.html;
    const ul = div.querySelector('ul');
    ul.innerHTML = '';
    v.opciones.forEach((op, i) => {
      const li = document.createElement('li');
      li.className = op.puede ? '' : 'falta';
      const b = document.createElement('b');
      b.textContent = `${i < 9 ? `${i + 1}. ` : ''}${T_(op.texto)}`;
      const span = document.createElement('span'); span.textContent = T_(op.detalle || '');
      const marca = document.createElement('i'); marca.textContent = T_(op.marca || '');
      li.append(b, span, marca);
      ctx.alClic?.(li, () => elegirPanel(i));
      ul.appendChild(li);
    });
    div.querySelector('.seguir').textContent = T_(panel.vista === 'jineteada' ? 'A y D para no caerte · Escape para soltarte' : 'Elegí con el número o con un clic · Escape para salir');
  }
  function elegirPanel(i) {
    if (!panel) return;
    const op = panel.opciones[i];
    if (!op || !op.puede) return;
    op.hacer();
    if (panel) dibujarPanel(true);
  }
  // el rival piensa (un ratito) y juega; la barra de la taba va y viene; la jineteada se redibuja
  function actualizarPanel(dt) {
    if (!panel) return;
    const v = panel.vista;
    const js = ctx.jugador?.()?.estado;
    // (si te vas, el partido queda)
    if ((v === 'truco' || v === 'chinchon' || v === 'damas' || v === 'menu') && js && panel.rival?.npc && dist(js.pos, panel.rival.npc.pos) > 6) { ctx.nota?.('Te fuiste de la mesa', 'El partido queda para otro día'); cerrarPanel(); return; }
    if (v === 'truco' && panel.juego.terminado === null) {
      const p = panel.juego, t = turnoDe(p);
      if (t === 1) { panel.espera -= dt; if (panel.espera <= 0) { panel.espera = 0.9; const a = decidirIA(p, 1, perfilTruco(panel.rival?.clave), dia() * 7 + p.manos * 13 + p.ronda.mesa[0].length * 3 + p.ronda.mesa[1].length); if (a) truco(a, 1); } }
    } else if (v === 'chinchon' && panel.juego.terminado === null) {
      const p = panel.juego;
      if (turnoChinchon(p) === 1 && !p.ronda.terminada) { panel.espera -= dt; if (panel.espera <= 0) { panel.espera = 0.8; const a = decidirChinchon(p, 1); if (a) chinchon(a, 1); } }
    } else if (v === 'damas' && panel.juego.terminado === null && panel.juego.turno === 1) {
      panel.espera -= dt;
      if (panel.espera <= 0) { panel.espera = 0.9; const j = decidirDamas(panel.juego, dia() * 3 + panel.juego.movidas); if (j) damas(j, 1); }
    } else if (v === 'taba') {
      if (!panel.fin) { panel.barra += panel.dir * dt * 0.9; if (panel.barra > 1) { panel.barra = 1; panel.dir = -1; } if (panel.barra < 0) { panel.barra = 0; panel.dir = 1; } }
      if (!panel.fin && panel.turno === 1) { panel.espera = (panel.espera ?? 1) - dt; if (panel.espera <= 0) { panel.espera = 1; tirar(1); } }
    } else if (v === 'baile' && clase && panel.muestra < clase.secuencia.length) {
      panel.t += dt;
      if (panel.t > 1.1) { panel.t = 0; panel.muestra++; }
    }
    dibujarPanel(false);
  }
  const decirRival = (texto) => { const n = panel?.rival?.npc; if (n) ctx.decirNpc?.(n, texto); };
  function truco(a, j = 0) {
    const p = panel.juego, quien = panel.rival?.nombre || 'Tu rival';
    const r = actuar(p, j, a);
    if (!r.ok) return;
    for (const e of r.eventos) {
      const q = e.quien === 0 ? 'Vos' : quien;
      if (e.tipo === 'canta') { panel.log.push(`${q}: «¡${cap(NOMBRES_CANTO[e.que])}!»`); if (e.quien === 1) decirRival(`¡${cap(NOMBRES_CANTO[e.que])}!`); }
      else if (e.tipo === 'responde') { panel.log.push(`${q}: «${cap(NOMBRES_CANTO[e.que])}»`); if (e.quien === 1) decirRival(cap(NOMBRES_CANTO[e.que])); }
      else if (e.tipo === 'envido') panel.log.push(e.tantos ? `Envido: vos ${e.tantos[0]}, ${quien} ${e.tantos[1]} → ${e.gana === 0 ? 'vos' : quien} (+${e.puntos})` : `Envido no querido: +${e.puntos} para ${e.gana === 0 ? 'vos' : quien}`);
      else if (e.tipo === 'carta' && e.quien === 1) panel.log.push(`${quien} tira el ${nombreCarta(e.carta)}`);
      else if (e.tipo === 'baza') panel.log.push(`${e.n}ª baza: ${e.gana === 'parda' ? 'parda' : e.gana === 0 ? 'tuya' : `de ${quien}`}`);
      else if (e.tipo === 'mazo') panel.log.push(`${q} se va al mazo`);
      else if (e.tipo === 'mano') panel.log.push(`La mano es ${e.gana === 0 ? 'tuya' : `de ${quien}`} (+${e.puntos})`);
      else if (e.tipo === 'partido') terminarPartido('truco', e.gana === 0, `${p.puntos[0]} a ${p.puntos[1]}`);
    }
    if (panel.log.length > 30) panel.log.splice(0, panel.log.length - 30);
    if (j === 0) panel.espera = 0.9;
  }
  function chinchon(a, j = 0) {
    const p = panel.juego, quien = panel.rival?.nombre || 'Tu rival';
    const r = actuarChinchon(p, j, a);
    if (!r.ok) return;
    for (const e of r.eventos) {
      if (e.tipo === 'roba' && e.quien === 1) panel.log.push(`${quien} levanta del ${e.de}`);
      else if (e.tipo === 'tira' && e.quien === 1) panel.log.push(`${quien} tira el ${nombreCartaChinchon(e.carta)}`);
      else if (e.tipo === 'corta') { panel.log.push(`${e.quien === 0 ? 'Cortaste' : `${quien} corta`} con el ${nombreCartaChinchon(e.carta)}`); if (e.quien === 1) decirRival('¡Corto!'); }
      else if (e.tipo === 'chinchon') { panel.log.push(`¡${e.quien === 0 ? 'Chinchón tuyo' : `Chinchón de ${quien}`}!`); if (e.quien === 1) decirRival('¡Chinchón!'); }
      else if (e.tipo === 'partido') terminarPartido('chinchon', e.gana === 0, `${p.puntos[0]} a ${p.puntos[1]}`);
    }
    if (j === 0) panel.espera = 0.8;
  }
  function damas(jugada, j = 0) {
    const e = panel.juego, quien = panel.rival?.nombre || 'Tu rival';
    const r = moverDamas(e, jugada);
    if (!r.ok) return;
    panel.log.push(`${j === 0 ? 'Vos' : quien}: ${textoJugada(r.jugada)}`);
    if (e.terminado !== null) terminarPartido('damas', e.terminado === 0, e.terminado === 'tablas' ? 'tablas' : '', e.terminado === 'tablas');
    if (j === 0) panel.espera = 0.9;
  }
  function tirar(j = 0) {
    if (!panel || panel.vista !== 'taba' || panel.fin) return;
    const fuerza = j === 0 ? panel.barra : 0.5 + Math.sin(panel.semilla + panel.n * 1.7) * 0.25;
    const r = tirarTaba(panel.semilla * 3 + panel.n++, fuerza);
    const q = j === 0 ? 'Vos' : panel.rival?.nombre || 'Mario';
    panel.log.push(`${q}: ${TEXTO_TABA[r.resultado]}`);
    if (r.gana === true) { panel.fin = j === 0 ? 'gano' : 'perdio'; }
    else if (r.gana === false) { panel.fin = j === 0 ? 'perdio' : 'gano'; }
    else panel.turno = 1 - j;
    if (panel.fin) { anotarPartido(estado(), 'taba', panel.fin === 'gano'); if (panel.fin === 'gano') ctx.sumarAmistad?.(panel.rival?.clave, 1); ctx.guardar?.(); }
    if (r.gana === null) panel.turno = 1 - j;
  }
  function paso(i) {
    if (!clase || clase.fin) return;
    const r = responderPaso(clase, i);
    if (r.fin) {
      if (r.aprobada) {
        const nivel = aprobarClase(estado(), clase.baile, dia());
        ctx.sumarAmistad?.('modista', 4);
        ctx.nota?.(`Pocha: «¡Nivel ${nivel} de ${BAILES[clase.baile].nombre}!»`, nivel >= NIVEL_BAILE_MAX ? 'Ya bailás como los de antes' : 'Mañana, otra clase', true);
      } else { estado().clase = dia(); ctx.nota?.('Pocha: «Mañana otra vez»', 'Una clase por día'); }
      reparto.clave = '';
      ctx.guardar?.();
    }
  }
  function terminarPartido(juego, gano, texto, tablas = false) {
    const quien = panel?.rival?.nombre || 'tu rival';
    if (!tablas) anotarPartido(estado(), juego, gano);
    const nombre = { truco: 'un truco', chinchon: 'un chinchón', damas: 'unas damas' }[juego];
    ctx.nota?.(tablas ? `Tablas con ${quien}` : gano ? `Le ganaste ${nombre} a ${quien}` : `${cap(quien)} te ganó ${nombre}`, texto ? `${texto}. Otro día la revancha` : 'Otro día la revancha', true);
    if (panel?.rival?.clave) ctx.sumarAmistad?.(panel.rival.clave, gano ? 2 : 3);
    decirRival(gano ? 'Me ganaste bien. La revancha es mía.' : 'Te gané, pero jugaste lindo.');
    ctx.guardar?.();
  }
  // para marcarHud de main.js (las listas del HUD: teclado, mouse y mando)
  const lista = () => ({ ul: $('fiesta-panel')?.querySelector('ul') || null, pie: $('fiesta-panel')?.querySelector('.seguir') || null, elegir: (i) => elegirPanel(i) });

  // ---------------------------------------------------------------- la foto de la fiesta, el tiempo de la nevada
  // Una foto sacada en la fiesta (en el predio, o en la plaza en los 90 de la abuela): queda en el álbum. Devuelve el id
  // del álbum (o null).
  function fotoDeLaFiesta(pos) {
    if (!activo() || !pos) return null;
    const a = ahora();
    if (!a) return null;
    const m = mundo();
    const enFiesta = (m && enElPredioMundo(pos)) || ((a.fecha.tipo === 'noventa' || a.fase.fase === 'acto') && ctx.enLaPlaza?.(pos));
    if (!enFiesta) return null;
    const id = fotoDeFiesta(estado(), a.fecha, a.fecha.anio);
    if (id) ctx.guardar?.();
    return id ? { id, nombre: `${a.fecha.nombre}, año ${a.fecha.anio}`, texto: a.fecha.texto } : null;
  }
  // El tiempo de la gran nevada: los tramos (de tres horas) de ese día nievan (main.js lo cruza con el programa del tiempo)
  function climaForzado(tramo) {
    if (!activo()) return null;
    const d = Math.floor((tramo * 3) / 24);
    const anioN = anioDe(d);
    const dda = ((d - 1) % 12 + 12) % 12 + 1;
    if (diaNevada(anioN, ctx.semilla?.() || 1) !== dda || !ctx.invierno?.(d)) return null;
    const h = (tramo * 3) % 24;
    return h >= 3 && h < 18 ? 'lluvia' : null;
  }

  const api = {
    activo, actualizar, destino, accion, paraElMundo, estado, ahora, fechasDeHoy,
    panelAbierto, cerrarPanel, elegirPanel, atras, alApretarE, lista, redibujar: () => dibujarPanel(false),
    jugarTruco, camara, montando: () => jineteada.monta?.quien === 'jugador', fotoDeLaFiesta, climaForzado,
    fotosAlbum: () => fotosParaAlbum(estado()),
    cumple: () => cumpleDelJugador(estado()),
    // para las pruebas (y las capturas)
    estadoPanel: () => (panel ? { vista: panel.vista, opciones: panel.opciones.map((o) => ({ texto: o.texto, puede: o.puede })), juego: panel.juego ? JSON.parse(JSON.stringify({ puntos: panel.juego.puntos, terminado: panel.juego.terminado, turno: panel.juego.turno })) : null, log: (panel.log || []).slice(-6), clase: clase ? { ...clase } : null } : null),
    jineteada: () => ({ monta: jineteada.monta ? { ...jineteada.monta } : null, jugador: jineteada.jugador ? { ...jineteada.jugador } : null }),
    forzarMonta: (quien, dura = JINETEADA.tiempo) => { jineteada.monta = { quien, t: 0, eq: 0, dura, fin: false }; },
    reiniciarDia: () => { visto.dia = 0; cache.t = -1; cache.dia = 0; reparto.clave = ''; },
    // (las capturas: la jineteada con el domador arriba, el truco con Ernesto, los recuerdos colgados)
    probar: (t = {}) => {
      cache.t = -1; cache.dia = 0; reparto.clave = '';
      mundo()?.deUna?.(true);
      if (t.jinete || /jineteada/.test(t.nombre || '')) jineteada.monta = { quien: 'inv-domador', t: 0, eq: 0, dura: 99, fin: false };
      if (t.refugio) { const st = estado(); for (const id of ['fruta-fina', 'dia-aldea', 'cosecha', 'minga', '25-mayo', 'leyenda', '9-julio', 'nieve', 'jineteada']) darRecuerdo(st, id, dia()); colgarRecuerdos(st); }
    },
    probarTruco: (clave = 'jefe') => { const n = ctx.aldeaGente?.()?.personas?.get(clave)?.npc || null; empezarTruco({ clave, nombre: nombreCortoDe(clave) || clave, npc: null }); return !!n; },
  };
  return api;
}
