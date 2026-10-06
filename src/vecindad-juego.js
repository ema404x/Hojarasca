// 3.6: la vecindad en el juego (las reglas están en vecindad.js y las voces en vecindad-voces.js).
// Pedido del usuario: "que los NPC se manejen con un poco más de autonomía y se pueda interactuar
// un poco más con ellos, tipo Sims, pero tampoco tan exagerado, ya que cada uno cumple una
// función" (PLAN_ALDEA.md, sección 13). Sólo en el Relax.
//
// Lo que hace:
//   · la charla con temas: al hablarle a un vecino (los de la aldea, los pobladores, Ramón,
//     Nicanor, Josefina, Ercilia y Elsa) saluda según la amistad, comenta lo que hiciste y ofrece un
//     menú corto: lo de su oficio (el servicio del día del poblador, o una historia de las de
//     siempre si tiene una sin contar), «¿Cómo andás?», «Novedades», «Tu historia», «Regalar…»,
//     «Invitar a tomar algo…», «Dar una mano…» y «Nada más, chau». Se elige con los números,
//     o moviéndose con la ruedita (LB/RB en el mando) y E (X en el mando). Lo de siempre que no se
//     elige (la carta, la visita, el cuento del fogón, un encargo, el que bajó del tren) va
//     primero, como antes, y después el menú;
//   · regalar (lo que llevás encima y se puede regalar), dar una mano (lo que pide sale de la
//     mochila, y a veces te da algo) e invitar a tomar algo: un mate en tu mesa o un té en la
//     casa de té de la aldea. Si acepta, va (caminando si está cerca; si la mesa queda lejos, te
//     espera ahí), se sienta en su lugar, vos te sentás con E en el tuyo y charlan un rato;
//   · lo que se abre con la amistad: el compadre que viene a tu mesa (`visitaDeCompadre`, desde
//     las visitas de main.js), el regalo que te dejan en la puerta al empezar el día y la ficha
//     «Tus vecinos» del cuaderno (cómo te llevás, con palabras, y lo que ya sabés que le gusta);
//   · la memoria: lo que hacés (por el diario, los peces, la tala, las fotos y los aportes) queda
//     anotado para que los vecinos lo comenten (`anotarHecho`).
//
// Sin three ni DOM (se prueba en Node): lo de la pantalla lo dibuja main.js con lo que devuelve
// esto, y las figuras llegan por `ctx`.
import { esPersonaVecindad, REGALABLES, nombreCorto, abrirCharla, elegirTema, regalar, invitar, ayudas, ayudar, anotarHecho, visitaDeAmistad, regaloDeAmistad, pasarDiaVecindad, estaLibre, nivelDe, amistades, gustosConocidos, PERFILES_VECINOS, PERSONAS_VECINDAD } from './vecindad.js';
import { VOCES } from './vecindad-voces.js';
import { esPersonaAldea, personaAldea, diaSemanaDe, puntosMundo } from './aldea.js';

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const cap = (s) => (typeof s === 'string' && s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const minus = (s) => (typeof s === 'string' && s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const distancia = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// ---------------------------------------------------------------- quién es quién
// La clave de la vecindad de una figura de gente.js: la de la aldea ('jefe', 'carpintero'…) o
// la de siempre ('ramon', 'ercilia', 'guarda'…). null si no es un vecino.
export function claveVecindad(npc) {
  const k = npc?.claveAldea || npc?.clave;
  return esPersonaVecindad(k) ? k : null;
}
const OFICIO_VALLE = { ramon: 'puestero', nicanor: 'pescador', ema: 'guardaparque', guarda: 'guarda de la trochita', ercilia: 'almacenera' };
const NOMBRE_VALLE = { ramon: 'Don Ramón', nicanor: 'Nicanor', ema: 'Josefina', guarda: 'Elsa', ercilia: 'Ercilia' };
export function nombreDeVecino(k) { return Object.hasOwn(NOMBRE_VALLE, k) ? NOMBRE_VALLE[k] : personaAldea(k)?.nombre || nombreCorto(k) || k; }
export function oficioDeVecino(k) { return Object.hasOwn(OFICIO_VALLE, k) ? OFICIO_VALLE[k] : personaAldea(k)?.oficio || ''; }

// ---------------------------------------------------------------- lo que llevás encima
// Cuánto tenés de algo, como lo cuenta comercio.js: 'material' → progreso.materiales,
// 'cosa' → progreso.cosas, 'entrada' → progreso.entradas[id].cantidad.
export function cantidadDe(p, tipo, k) {
  const n = tipo === 'material' ? p?.materiales?.[k] : tipo === 'cosa' ? p?.cosas?.[k] : p?.entradas?.[k]?.cantidad;
  return Math.max(0, Math.floor(Number(n) || 0));
}
// Lo que se puede regalar y te alcanza: [{ k, nombre, n, tenes }].
export function regalablesQueTenes(p) {
  const lista = [];
  for (const [k, r] of Object.entries(REGALABLES)) {
    const tenes = cantidadDe(p, r.tipo, k);
    if (tenes >= r.n) lista.push({ k, nombre: r.nombre, n: r.n, tenes });
  }
  return lista;
}
// Aplica [{ tipo, k, n }] (n < 0: se descuenta). `ctx.sumarMaterial` / `ctx.sumarEntrada`, si
// están, hacen lo suyo (main.js anota la entrada nueva en el cuaderno).
export function aplicarEfectos(p, efectos, ctx = {}) {
  for (const f of Array.isArray(efectos) ? efectos : []) {
    if (!objeto(f) || typeof f.k !== 'string' || !Number.isFinite(Number(f.n)) || !Number(f.n)) continue;
    const n = Math.trunc(Number(f.n));
    if (f.tipo === 'material') {
      if (ctx.sumarMaterial) ctx.sumarMaterial(f.k, n);
      else { p.materiales = p.materiales || {}; p.materiales[f.k] = Math.max(0, (Number(p.materiales[f.k]) || 0) + n); }
    } else if (f.tipo === 'cosa') {
      p.cosas = p.cosas || {};
      p.cosas[f.k] = Math.max(0, (Number(p.cosas[f.k]) || 0) + n);
    } else if (f.tipo === 'entrada') {
      if (ctx.sumarEntrada) ctx.sumarEntrada(f.k, n);
      else {
        p.entradas = p.entradas || {};
        const e = p.entradas[f.k] || (p.entradas[f.k] = { dia: p.dia || 1, hora: p.horas || 0, cantidad: 0 });
        e.cantidad = Math.max(0, (Number(e.cantidad) || 0) + n);
      }
    }
  }
}
// "un frasco de miel y dos troncos": lo que se suma (para el aviso)
const NOMBRES = {
  tronco: ['un tronco', 'troncos'], tabla: ['una tabla', 'tablas'], piedra: ['una piedra', 'piedras'], lana: ['un vellón de lana', 'vellones de lana'],
  yerba: ['una medida de yerba', 'medidas de yerba'], harina: ['una medida de harina', 'medidas de harina'], 'semillas-habas': ['una semilla de habas', 'semillas de habas'],
  'pan-casero': ['un pan casero', 'panes caseros'], 'frasco-frutilla': ['un frasco de dulce de frutilla', 'frascos de dulce de frutilla'], miel: ['un frasco de miel', 'frascos de miel'],
  'calafate-seco': ['unos calafates secos', 'puñados de calafates secos'], 'trucha-fresca': ['una trucha fresca', 'truchas frescas'], empanadas: ['una empanada', 'empanadas'],
  canto: ['un canto rodado', 'cantos rodados'], pluma: ['una pluma de cachaña', 'plumas de cachaña'], pinon: ['un piñón', 'piñones'],
};
const NUMEROS = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis'];
export function textoEfectos(efectos) {
  const partes = [];
  for (const f of Array.isArray(efectos) ? efectos : []) {
    const n = Math.trunc(Number(f?.n) || 0);
    if (n <= 0) continue;
    const nom = NOMBRES[f.k];
    if (!nom) partes.push(`${n} ${f.k}`);
    else partes.push(n === 1 ? nom[0] : `${NUMEROS[n] || n} ${nom[1]}`);
  }
  if (partes.length < 2) return partes[0] || '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

// ---------------------------------------------------------------- el menú de la charla
export const TITULOS = {
  servicio: '¿Qué tenés para hoy?', 'como-andas': '¿Cómo andás?', novedades: 'Novedades', historia: 'Tu historia',
  regalar: 'Regalar…', invitar: 'Invitar a tomar algo…', ayudar: 'Dar una mano…', chau: 'Nada más, chau', volver: 'Mejor no',
};
// Cómo se elige (lo dice el pie del cuadro de la charla)
export const PIE_MENU = '1 a {n}, o la ruedita y E, para elegir · Escape para despedirte';
export const PIE_SUBMENU = '1 a {n}, o la ruedita y E, para elegir · Escape para volver';
const FRASES_JUEGO = {
  abre: '¿Qué contás?',
  sigue: '¿Algo más?',
  regalar: '¿Qué le regalás?',
  invitar: '¿A tomar qué?',
  ayudar: '¿En qué le das una mano?',
  sinMesa: 'Me encantaría, pero ¿en qué mesa? Armate una mesa de campo con dos sillas o bancos y ahí sí.',
  conVisita: 'Ya tenés visita en tu mesa. Otro día, así charlamos tranquilos.',
  yaQuedaste: 'Ya quedaste con {quien} para tomar algo. Otro día, ¿dale?',
  yaQuedamos: '¡Si ya quedamos! Andá yendo, que te alcanzo.',
  sinCasaTe: 'La casa de té está en la aldea, y hoy no la encuentro abierta. Otro día.',
};
export const MATE = 'Un mate en tu mesa';
export const TE = 'Un té en la casa de té';

// ---------------------------------------------------------------- la memoria por el diario
// Lo que main.js anota en el diario y los vecinos comentan (ver HECHOS en vecindad.js).
const DEL_DIARIO = { renoval: 'renoval', carpa: 'durmio-afuera', cosecha: 'cosecha', horno: 'horneada', miel: 'miel', esquila: 'esquila', tren: 'tren', obra: 'obra-propia', capitulo: 'capitulo', tejido: 'poncho' };
export function hechoDelDiario(tipo, dato) {
  const id = Object.hasOwn(DEL_DIARIO, tipo) ? DEL_DIARIO[tipo] : null;
  if (!id) return null;
  if (id === 'poncho') return /poncho/i.test(String(dato || '')) ? { id, dato: null } : null;
  if (id === 'obra-propia') return { id, dato: typeof dato === 'string' ? { obra: dato } : null };
  if (id === 'capitulo') {
    const m = /«([^»]+)»/.exec(String(dato || ''));
    return { id, dato: m ? { capitulo: m[1] } : null };
  }
  return { id, dato: null };
}
const TRUCHAS = new Set(['arcoiris', 'marron', 'fontinalis']);
const NATIVOS = new Set(['perca', 'pejerrey']);
// El pez que sacaste: la trucha grande o el nativo (o null si no es de comentar).
export function hechoDelPez(pez) {
  const id = pez?.id, cm = Number(pez?.cm) || 0, especie = String(pez?.def?.nombre || pez?.nombre || '').toLowerCase();
  if (TRUCHAS.has(id) && cm >= 50) return { id: 'trucha-grande', dato: { cm, especie } };
  if (NATIVOS.has(id)) return { id: 'pez-nativo', dato: { especie } };
  return null;
}
// Las fotos de animales (los desafíos del álbum), con cómo se dice el animal.
export const FOTO_FAUNA = {
  'f-pudu': 'pudú', 'f-huemul': 'huemul', 'f-zorro': 'zorro colorado', 'f-carpintero': 'carpintero gigante', 'f-cisnes': 'cisnes de cuello negro',
  'f-condor': 'cóndor', 'f-picaflor': 'picaflor rubí', 'f-pato': 'pato de los torrentes', 'f-bandurrias': 'bandurrias',
};

// ---------------------------------------------------------------- la ficha del cuaderno
// «Tus vecinos»: cómo te llevás con cada uno (con palabras: conocido, amigo, compadre) y lo que
// ya sabés que le gusta (sólo lo que le regalaste). `el(tag, clase, texto)`: el de main.js.
const PALABRA_GUSTO = { encanta: 'Le encanta', gusta: 'Le gusta', neutro: 'Le da lo mismo', noGusta: 'No le gusta' };
export function lineasVecinos(p) {
  const am = amistades(p);
  return PERSONAS_VECINDAD.filter((k) => Object.hasOwn(am, k)).map((k) => {
    const gustos = gustosConocidos(k, p);
    const grupos = [];
    for (const g of ['encanta', 'gusta', 'neutro', 'noGusta']) {
      const cosas = gustos.filter((x) => x.gusto === g).map((x) => REGALABLES[x.cosa].el);
      if (cosas.length) grupos.push(`${PALABRA_GUSTO[g]}: ${cosas.length > 1 ? `${cosas.slice(0, -1).join(', ')} y ${cosas[cosas.length - 1]}` : cosas[0]}`);
    }
    return { clave: k, nombre: nombreDeVecino(k), oficio: oficioDeVecino(k), nivel: am[k], gustos: grupos };
  });
}
export function fichaVecinos(p, ficha, el) {
  ficha.appendChild(el('h2', '', 'Tus vecinos'));
  ficha.appendChild(el('p', 'texto', 'Cómo te llevás con cada uno. La confianza se gana de a poco: charlando, con un regalo que le guste, invitándolo a tomar algo o dándole una mano en lo suyo.'));
  const lineas = lineasVecinos(p);
  if (!lineas.length) { ficha.appendChild(el('p', 'pista', 'Todavía no charlaste con nadie. Acercate a un vecino y apretá E.')); return; }
  const ul = el('ul', 'lista');
  for (const x of lineas) {
    const quien = `${x.nombre}${x.oficio ? `, ${x.oficio}` : ''}: ${x.nivel === 'compadre' ? 'tu compadre' : x.nivel === 'amigo' ? 'tu amigo' : 'un conocido'}.`;
    ul.appendChild(el('li', '', x.gustos.length ? `${quien} ${x.gustos.join('. ')}.` : quien));
  }
  ficha.appendChild(ul);
}

// ---------------------------------------------------------------- la cita (invitar a tomar algo)
export const CITA = {
  espera: 3,          // horas que espera sentado a que llegues (después se va)
  sobremesa: 1,       // horas que se queda después de la charla, si no te vas antes
  caminar: 60,        // más lejos que esto no camina: te espera en la mesa
  jugadorLejos: 40,   // si estás más lejos que esto de la mesa, aparece directo sentado
  cerca: 2.2,         // a esta distancia de tu asiento, E te sienta
  tarde: 21.5,        // a esta hora se vuelve a su casa
};
// Los dos lugares de tu mesa: el del invitado y el tuyo (mirando a la mesa).
export function lugaresDeLaMesa(puesta) {
  if (!puesta?.asientos?.length || puesta.asientos.length < 2) return null;
  const m = puesta.mesa;
  const lugar = (a) => ({ x: a.x, z: a.z, mira: Math.atan2(m.x - a.x, m.z - a.z) });
  return { suyo: lugar(puesta.asientos[0]), tuyo: lugar(puesta.asientos[1]), mesa: { x: m.x, z: m.z } };
}
// Los de la casa de té: mesa-2 (el invitado) y mesa-1 (vos), en el mundo.
export function lugaresDeLaCasaTe() {
  const p = puntosMundo('casa-te');
  if (!p['mesa-1'] || !p['mesa-2']) return null;
  const lugar = (q) => ({ x: q.x, z: q.z, mira: q.rot });
  return { suyo: lugar(p['mesa-2']), tuyo: lugar(p['mesa-1']), mesa: { x: (p['mesa-1'].x + p['mesa-2'].x) / 2, z: (p['mesa-1'].z + p['mesa-2'].z) / 2 } };
}

// ---------------------------------------------------------------- en el juego
// `ctx`: progreso(), desafio() (true en el Desafío), pronostico(), clima() (para la vecindad:
// { lluvia, invierno, viento, nublado }), sumarMaterial(k, n), sumarEntrada(k, n), nota(t, sub,
// nueva), guardar(), refrescarBarra(), mesa() (la mesa puesta: { mesa, asientos } o null),
// hayVisita() (alguien de visita en tu mesa), jugador() (su posición), alturaDePie(x, z, y),
// aldea() (aldea-gente: `citar`, `figura`), npcDe(clave).
// 3.7.1: amor (amor-juego.js, opcional): lo del romance en el menú (`opciones`, `submenu`, `elegir`) y lo que dice
// ella o el chisme de un vecino al saludarte (`alAbrir`). Sin `amor` (o con el ajuste apagado), el menú es el de siempre.
export function crearVecindadJuego(ctx) {
  const progreso = () => ctx.progreso();
  const dia = () => Math.max(1, Math.floor(Number(progreso().dia) || 1));
  const horas = () => Number(progreso().horas) || 0;
  const ahora = () => dia() * 24 + horas();
  // (3.7.0: `nombre`: tu apodo en la aldea, si ya te lo ganaste: con confianza, te saludan así)
  const contexto = () => ({ dia: dia(), hora: horas(), clima: ctx.clima?.() || null, pronostico: ctx.pronostico?.() || '', nombre: ctx.apodo?.() || null });
  const avisarAmistad = (clave, am) => {
    if (!am?.subio) return;
    ctx.nota?.(`${nombreDeVecino(clave)} te tiene confianza`, am.nivel === 'compadre' ? 'Ya son compadres' : 'Ya son amigos', true);
  };

  // ---------------------------------------------------------------- la charla
  // Una sesión por charla: lo que se puede elegir y lo que ya se eligió. `extra.historia`: la
  // historia de siempre que tiene sin contar (gente.js); `extra.servicio`: lo del día del
  // poblador (aldea-gente.js); `extra.linea`: lo que dice el vecino de la aldea de entrada.
  function abrir(npc, extra = {}) {
    if (ctx.desafio?.()) return null;
    const clave = claveVecindad(npc);
    if (!clave) return null;
    const a = abrirCharla(clave, progreso(), contexto());
    if (!a) return null;
    avisarAmistad(clave, a.amistad);
    const amor = ctx.amor?.alAbrir?.(clave) || null;   // 3.7.1: lo que dice ella primero, o el chisme de un vecino
    return {
      clave, saludo: a.saludo || null, comentario: amor?.primero || a.comentario || amor?.despues || null, nivel: a.nivel,
      historia: extra.historia || null, servicio: extra.servicio || null, linea: extra.linea || null,
      regalo: !a.puede.regalar, invito: !a.puede.invitar, vueltas: 0, sub: null, i: 0,
    };
  }
  function opcionesPrincipales(s) {
    const p = progreso();
    const lista = [];
    if (s.servicio) lista.push({ id: 'servicio', titulo: TITULOS.servicio });
    if (s.historia) lista.push({ id: 'contame', titulo: `Contame algo · ${s.historia.titulo}` });
    for (const t of temasTitulos(s)) lista.push(t);
    if (!s.regalo && regalablesQueTenes(p).length) lista.push({ id: 'regalar', titulo: TITULOS.regalar });
    if (!s.invito) lista.push({ id: 'invitar', titulo: TITULOS.invitar });
    if (ayudas(s.clave, p, dia()).length) lista.push({ id: 'ayudar', titulo: TITULOS.ayudar });
    for (const o of ctx.amor?.opciones?.(s.clave) || []) lista.push(o);   // 3.7.1: el romance, el anillo y el correo
    lista.push({ id: 'chau', titulo: TITULOS.chau });
    return lista;
  }
  function temasTitulos(s) {
    // los títulos de los temas (el de la historia lleva su nombre)
    const voz = VOCES[s.clave];
    const f = progreso().vecindad?.personas?.[s.clave];
    const termino = f && voz && f.hist >= voz.historia.partes.length;
    return [
      { id: 'como-andas', titulo: TITULOS['como-andas'] },
      { id: 'novedades', titulo: TITULOS.novedades },
      { id: 'historia', titulo: termino || !voz ? TITULOS.historia : `${TITULOS.historia} · ${voz.historia.titulo}` },
    ];
  }
  // El menú que se ve: { tipo, texto, opciones: [{ id, titulo }], i }. `alFinal`: con el cursor
  // en «Nada más, chau» (después de un tema: así E de seguido termina la charla, como antes).
  function menu(s, alFinal = false) {
    if (s.sub) return s.sub;
    const opciones = opcionesPrincipales(s);
    const texto = s.vueltas === 0 ? (s.comentario || s.linea || FRASES_JUEGO.abre) : FRASES_JUEGO.sigue;
    s.i = alFinal ? opciones.length - 1 : 0;
    return { tipo: 'charla', texto, opciones, i: s.i };
  }
  function submenu(s, tipo) {
    const p = progreso();
    let opciones = [];
    if (tipo === 'regalar') opciones = regalablesQueTenes(p).slice(0, 8).map((r) => ({ id: `regalar:${r.k}`, titulo: `${cap(r.nombre)} (tenés ${r.tenes})` }));
    else if (tipo === 'invitar') opciones = [{ id: 'invitar:mate', titulo: MATE }, { id: 'invitar:te', titulo: TE }];
    else if (tipo === 'ayudar') {
      opciones = ayudas(s.clave, p, dia()).map((a) => {
        if (!a.pide) return { id: `ayudar:${a.id}`, titulo: a.titulo };
        const r = REGALABLES[a.pide.k];
        return { id: `ayudar:${a.id}`, titulo: `${a.titulo} (pide ${r ? r.nombre : a.pide.k}; tenés ${cantidadDe(p, a.pide.tipo, a.pide.k)})` };
      });
    }
    opciones.push({ id: 'volver', titulo: TITULOS.volver });
    s.sub = { tipo, texto: FRASES_JUEGO[tipo], opciones, i: 0 };
    return s.sub;
  }
  // Elegir una opción. Devuelve lo que tiene que hacer la charla:
  //   { tipo: 'menu' } (mostrar el menú o el submenú), { tipo: 'renglones', renglones },
  //   { tipo: 'historia', historia } (una de gente.js o el servicio del poblador),
  //   { tipo: 'cita', renglones, que } (aceptó: al terminar, `empezarCita`) o { tipo: 'chau' }.
  function elegir(s, id, npc = null) {
    const p = progreso();
    if (id === 'volver') { s.sub = null; return { tipo: 'menu' }; }
    if (id === 'chau') return { tipo: 'chau' };
    if (id === 'servicio' && s.servicio) { const h = s.servicio; s.servicio = null; s.vueltas++; return { tipo: 'historia', historia: h }; }
    if (id === 'contame' && s.historia) { const h = s.historia; s.historia = null; s.vueltas++; return { tipo: 'historia', historia: h }; }
    if (id === 'como-andas' || id === 'novedades' || id === 'historia') {
      const r = elegirTema(s.clave, id, p, contexto());
      s.vueltas++;
      avisarAmistad(s.clave, r.amistad);
      return { tipo: 'renglones', renglones: r.renglones.length ? r.renglones : [FRASES_JUEGO.sigue] };
    }
    if (id === 'regalar' || id === 'invitar' || id === 'ayudar') { submenu(s, id); return { tipo: 'menu' }; }
    // 3.7.1: lo del amor (amor-juego.js): un submenú propio o lo que contesta ella
    if (/^amor(?:-|:|$)/.test(String(id)) && ctx.amor) {
      const r = ctx.amor.elegir(s, id, npc);
      if (r.tipo === 'menu' && r.sub) { s.sub = r.sub; return { tipo: 'menu' }; }
      s.sub = null;
      if (r.tipo !== 'menu') s.vueltas++;
      return r;
    }
    const [tipo, k] = String(id).split(':');
    s.sub = null;
    s.vueltas++;
    if (tipo === 'regalar') {
      const r = regalar(s.clave, k, p, dia());
      if (r.ok) {
        aplicarEfectos(p, r.efectos, ctx);
        s.regalo = true;
        ctx.amor?.alRegalar?.(s.clave, r.reaccion);   // 3.7.1: el dibujito de regalo (lo que te enseñó Abril o Nélida)
        ctx.refrescarBarra?.();
        ctx.guardar?.();
        avisarAmistad(s.clave, r.amistad);
      }
      return { tipo: 'renglones', renglones: r.renglones, reaccion: r.reaccion };
    }
    if (tipo === 'ayudar') {
      const r = ayudar(s.clave, k, p, null, dia());
      if (r.ok) {
        aplicarEfectos(p, r.efectos, ctx);
        const da = textoEfectos(r.efectos);
        if (da) ctx.nota?.(`${nombreDeVecino(s.clave)} te dio ${da}`, 'Por la mano que le diste', true);
        ctx.refrescarBarra?.();
        ctx.guardar?.();
        avisarAmistad(s.clave, r.amistad);
      }
      return { tipo: 'renglones', renglones: r.renglones };
    }
    if (tipo === 'invitar') {
      const que = k === 'te' ? 'te' : 'mate';
      const no = (texto) => ({ tipo: 'renglones', renglones: [texto] });
      if (cita) return no(cita.clave === s.clave ? FRASES_JUEGO.yaQuedamos : FRASES_JUEGO.yaQuedaste.replace('{quien}', nombreCorto(cita.clave)));
      let lugares = null;
      if (que === 'mate') {
        if (ctx.hayVisita?.()) return no(FRASES_JUEGO.conVisita);
        lugares = lugaresDeLaMesa(ctx.mesa?.());
        // (los que no toman mate lo dicen primero: `invitar` contesta con su motivo)
        if (!lugares && !VOCES[s.clave]?.noToma?.mate) return no(FRASES_JUEGO.sinMesa);
      } else {
        lugares = lugaresDeLaCasaTe();
        if (!lugares) return no(FRASES_JUEGO.sinCasaTe);
      }
      const r = invitar(s.clave, que, p, horas(), { dia: dia(), diaSemana: diaSemanaDe(dia()) });
      if (!r.ok) return { tipo: 'renglones', renglones: r.renglones, motivo: r.motivo };
      s.invito = true;
      avisarAmistad(s.clave, r.amistad);
      ctx.guardar?.();
      const charlaDeMesa = r.secuencia.find((x) => x.paso === 'charla')?.renglones || r.renglones;
      return { tipo: 'cita', renglones: [r.acepta], que, charla: charlaDeMesa, lugares, npc };
    }
    return { tipo: 'menu' };
  }

  // ---------------------------------------------------------------- la cita
  let cita = null;
  const npcDe = (clave) => ctx.npcDe?.(clave) || null;
  function llevar(npc, lugar) {
    const antes = { ruta: npc.ruta, etapa: npc.etapa, espera: npc.espera, velocidad: npc.velocidad, x: npc.pos.x, z: npc.pos.z, camino: npc.camino, soloCerca: npc.soloCerca };
    npc.deVisita = true; npc.camino = null; npc.soloCerca = 0; npc.pose = null; npc.dormido = false; npc.asiento = undefined;   // 3.6.1: el asiento de antes no es el de tu mesa
    if (distancia(npc.pos, lugar) > CITA.caminar) {
      // la mesa queda lejos: te espera ahí (o llega caminando los últimos metros, si estás cerca)
      const j = ctx.jugador?.() || null;
      let desde = lugar;
      if (j && distancia(j, lugar) <= CITA.jugadorLejos) {
        let dx = lugar.x - j.x, dz = lugar.z - j.z;
        const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
        desde = { x: lugar.x + dx * 30, z: lugar.z + dz * 30 };
      }
      npc.pos.set(desde.x, ctx.alturaDePie ? ctx.alturaDePie(desde.x, desde.z, npc.pos.y) : npc.pos.y, desde.z);
    }
    npc.ruta = [{ x: lugar.x, z: lugar.z, quieto: 99999, mirar: { x: lugar.x + Math.sin(lugar.mira) * 3, z: lugar.z + Math.cos(lugar.mira) * 3 } }];
    npc.etapa = 0; npc.espera = 0; npc.velocidad = 1.1;
    return antes;
  }
  function devolver(c) {
    const npc = c.npc;
    if (!npc) return;
    if (c.porAldea) { ctx.aldea?.()?.citar?.(c.clave, null); npc.pose = null; return; }
    const a = c.antes;
    if (!a) return;
    Object.assign(npc, { ruta: a.ruta, etapa: a.etapa, espera: a.espera, velocidad: a.velocidad, camino: a.camino, soloCerca: a.soloCerca, deVisita: false, pose: null });
    npc.pos.set(a.x, ctx.alturaDePie ? ctx.alturaDePie(a.x, a.z, npc.pos.y) : npc.pos.y, a.z);
  }
  // Empieza la cita que aceptó (lo que devolvió `elegir` con tipo 'cita').
  // 3.6.1: la cita queda en la partida (`progreso.vecindad.cita`) mientras no se tomó: si recargás a la
  // mitad, el invitado vuelve a la mesa (antes se perdía, y como ya lo habías invitado ese día, no
  // se lo podía volver a invitar)
  const anotarCita = (c) => { const p = progreso(); if (objeto(p.vecindad)) p.vecindad.cita = c ? { clave: c.clave, que: c.que, desde: c.desde } : null; };
  function empezarCita(clave, npc, que, charla, lugares, desde = null) {
    if (cita || !npc || !lugares) return false;
    const c = { clave, npc, que, fase: 'yendo', lugar: lugares.suyo, tuyo: lugares.tuyo, mesa: lugares.mesa, charla: charla || [], desde: Number.isFinite(desde) ? desde : ahora(), hasta: 0, porAldea: false, antes: null };
    // a la casa de té, la gente de la aldea va por las calles (aldea-gente.js); el resto, derecho
    const ag = ctx.aldea?.();
    if (que === 'te' && esPersonaAldea(clave) && npc.claveAldea && ag?.citar) { ag.citar(clave, { edificio: 'casa-te', punto: 'mesa-2' }); c.porAldea = true; }
    else c.antes = llevar(npc, c.lugar);
    cita = c;
    npc.enCita = true;   // 3.6.1: va con vos (gente.js no lo frena porque estés cerca)
    anotarCita(c);
    const nombre = nombreDeVecino(clave);
    ctx.nota?.(que === 'mate' ? `${nombre} va para tu mesa` : `${nombre} va a la casa de té`, 'Sentate con E en el otro lugar de la mesa', true);
    ctx.guardar?.();
    return true;
  }
  // La cita de una partida recargada: el invitado vuelve a ir (o ya se cansó de esperar).
  function retomarCita() {
    const p = progreso(), g = p.vecindad?.cita;
    if (cita || !g) return;
    const lugares = g.que === 'mate' ? lugaresDeLaMesa(ctx.mesa?.()) : lugaresDeLaCasaTe();
    const h = horas();
    if (!lugares || ahora() - g.desde > CITA.espera || ahora() < g.desde || h >= CITA.tarde || (esPersonaAldea(g.clave) && !estaLibre(g.clave, h, diaSemanaDe(dia()), p))) { anotarCita(null); return; }
    const npc = npcDe(g.clave);
    if (!npc) return;   // (la figura todavía no está: se reintenta)
    const charla = invitacionCharla(g.clave, g.que);
    if (!empezarCita(g.clave, npc, g.que, charla, lugares, g.desde)) anotarCita(null);
  }
  // la charla de la mesa de una cita retomada (la de la invitación no se guarda: la sobremesa de siempre)
  const invitacionCharla = (clave, que) => [(que === 'mate' ? 'Bueno, acá estoy. ¿Lo cebás vos o lo cebo yo?' : 'Acá estoy. Qué lindo lugar para un té, ¿no?'), ...(VOCES[clave]?.sobremesa || []).slice(0, 1)];
  function terminarCita(motivo = 'fin') {
    const c = cita;
    if (!c) return;
    cita = null;
    anotarCita(null);
    if (c.npc) c.npc.enCita = false;
    devolver(c);
    const nombre = nombreDeVecino(c.clave);
    if (motivo === 'cansado') ctx.nota?.(`${nombre} se cansó de esperarte`, 'Se volvió a lo suyo. Otro día será');
    else if (motivo === 'ocupado') ctx.nota?.(`${nombre} se tuvo que ir`, 'Tenía que volver a lo suyo');
  }
  function actualizarCita() {
    const c = cita;
    if (!c) return;
    const p = progreso(), h = horas();
    const npc = c.npc;
    if (!npc || !npc.pos) { cita = null; anotarCita(null); return; }   // (3.6.1: y no queda guardada)
    if (c.fase === 'yendo') {
      const llego = distancia(npc.pos, c.lugar) < 0.6 && !(npc.camino && npc.camino.length);
      if (llego) {
        c.fase = 'esperando';
        npc.pose = 'sentado';
        if (!c.porAldea) { npc.rumbo = npc.rumboObjetivo = c.lugar.mira; if (npc.g?.rotation) npc.g.rotation.y = c.lugar.mira; }
      }
    }
    if (c.fase === 'charlando') return;
    const ocupado = esPersonaAldea(c.clave) && !estaLibre(c.clave, h, diaSemanaDe(dia()), p);
    if (c.fase === 'sobremesa') {
      const j = ctx.jugador?.();
      if (ahora() > c.hasta || h >= CITA.tarde || ocupado || (j && distancia(j, c.lugar) > 20)) terminarCita('fin');
      return;
    }
    if (h >= CITA.tarde || ahora() - c.desde > CITA.espera) terminarCita('cansado');
    else if (ocupado) terminarCita('ocupado');
  }
  // ¿E te sienta a la mesa de la cita? (el invitado ya está sentado y vos, al lado de tu lugar)
  function puedeSentarse(pos) {
    return !!cita && cita.fase === 'esperando' && !!pos && distancia(pos, cita.tuyo) < CITA.cerca;
  }
  // Te sentás: devuelve { npc, tuyo, charla } para que main.js te ubique y abra la charla.
  function sentarse() {
    if (!cita || cita.fase !== 'esperando') return null;
    cita.fase = 'charlando';
    cita.npc.pose = 'sentado';
    return { npc: cita.npc, tuyo: cita.tuyo, charla: cita.charla, que: cita.que, clave: cita.clave };
  }
  // Terminó la charla de la mesa: se queda un rato más, como en toda sobremesa.
  function citaCharlada() {
    if (!cita || cita.fase !== 'charlando') return;
    cita.fase = 'sobremesa';
    anotarCita(null);   // 3.6.1: ya se tomó: al recargar no vuelve
    cita.hasta = ahora() + CITA.sobremesa;
    const nombre = nombreDeVecino(cita.clave);
    ctx.nota?.(cita.que === 'mate' ? `Tomaste mate con ${nombre}` : `Tomaste el té con ${nombre}`, 'Esas charlas hacen amigos', true);
    ctx.guardar?.();
  }
  const textoSentarse = () => (cita ? `Sentarte a tomar ${cita.que === 'mate' ? 'mate' : 'el té'} con ${nombreDeVecino(cita.clave)}` : '');

  // ---------------------------------------------------------------- la visita del compadre
  // Cuando toca una visita a tu mesa (main.js): si hay un compadre que no vino hace días, viene él.
  function visitaDeCompadre(puede = ctx.puedeVenir || null) {
    if (ctx.desafio?.()) return null;
    return visitaDeAmistad(progreso(), dia(), puede);   // 3.6.1: sólo uno que pueda venir
  }
  const charlaDeCompadre = (clave) => [...(VOCES[clave]?.visita || [])];
  function regaloDeCompadre(clave) {
    const r = PERFILES_VECINOS[clave]?.regala;
    if (!r) return null;
    aplicarEfectos(progreso(), [{ tipo: r.tipo, k: r.k, n: r.n }], ctx);
    ctx.refrescarBarra?.();
    return VOCES[clave]?.regalo || `${nombreDeVecino(clave)} te dejó un regalo`;
  }

  // ---------------------------------------------------------------- la memoria
  function hecho(id, dato = null) {
    if (ctx.desafio?.()) return false;
    try { return anotarHecho(progreso(), id, dia(), dato); } catch { return false; }
  }
  function delDiario(tipo, dato) {
    const h = hechoDelDiario(tipo, dato);
    return h ? hecho(h.id, h.dato) : false;
  }
  function delPez(pez) {
    const h = hechoDelPez(pez);
    return h ? hecho(h.id, h.dato) : false;
  }
  function deFotos(ids) {
    for (const id of Array.isArray(ids) ? ids : []) if (Object.hasOwn(FOTO_FAUNA, id)) return hecho('foto-fauna', { especie: FOTO_FAUNA[id] });
    return false;
  }

  // ---------------------------------------------------------------- cada cuadro
  let acum = 0;
  // Al empezar cada día (al despertar, o pasada la medianoche): la vecindad pasa el día y algún
  // compadre te deja algo en la puerta.
  function revisarDia() {
    const p = progreso();
    if (objeto(p.vecindad) && Number(p.vecindad.dia) >= dia()) return null;
    pasarDiaVecindad(p, dia());
    const r = regaloDeAmistad(p, dia());
    if (r) {
      aplicarEfectos(p, r.efectos, ctx);
      ctx.refrescarBarra?.();
      ctx.nota?.('Te dejaron algo en la puerta', `${r.texto}, con una nota: «Para vos, de tu compadre»`, true);
    }
    ctx.guardar?.();
    return r;
  }
  function actualizar(dt) {
    if (ctx.desafio?.()) return;
    acum += dt;
    if (acum < 0.5) return;
    acum = 0;
    revisarDia();
    retomarCita();   // 3.6.1
    actualizarCita();
  }

  return {
    abrir, menu, elegir, submenu,
    empezarCita, terminarCita, actualizarCita, puedeSentarse, sentarse, citaCharlada, textoSentarse,
    invitado: (npc) => (cita && cita.npc === npc ? cita.fase : null),
    cita: () => (cita ? { clave: cita.clave, que: cita.que, fase: cita.fase, lugar: cita.lugar, tuyo: cita.tuyo, porAldea: cita.porAldea } : null),
    visitaDeCompadre, charlaDeCompadre, regaloDeCompadre,
    hecho, delDiario, delPez, deFotos, revisarDia, actualizar, npcDe,
    nivel: (clave) => nivelDe(clave, progreso()),
  };
}
