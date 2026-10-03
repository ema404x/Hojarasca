// 3.6 (vida): la vecindad conectada al juego (src/vecindad-juego.js, aldea-gente.js y main.js),
// sin Electron. Pedido del usuario: "que los NPC se manejen con un poco más de autonomía y se pueda
// interactuar un poco más con ellos, tipo Sims, pero tampoco tan exagerado".
//  · el menú de la charla: lo de su oficio primero, los tres temas, regalar, invitar, dar una mano
//    y chau; cada opción hace lo suyo (descuenta de la mochila, suma amistad, avisa al subir);
//  · invitar: los rechazos con su motivo y la cita entera (va, se sienta, te sentás, charlan, se
//    queda un rato y se vuelve); a la casa de té, la gente de la aldea va por las calles;
//  · la amistad: el compadre que viene a tu mesa, el regalo en la puerta, la ficha del cuaderno;
//  · la memoria: el diario, los peces, la tala, las fotos;
//  · la autonomía en aldea-gente.js: lo libre se elige y dura, lo obligado manda, las poses;
//  · el primer viaje (el hacha en la aldea) y los enganches en main.js, gente.js y la plantilla.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as VJ from '../src/vecindad-juego.js';
import * as V from '../src/vecindad.js';
import * as A from '../src/aldea.js';
import * as G from '../src/aldea-gente.js';
import { VOCES, AYUDAS } from '../src/vecindad-voces.js';
import { sanearVisitas } from '../src/visitas.js';
import { CAPITULO } from '../src/historia.js';
import { PASOS_RELAX } from '../src/relax-tutorial.js';
import { sanearCorreo } from '../src/correo.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const vec = (x, y, z) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
const partida = (extra = {}) => ({ modo: 'relax', dia: 1, horas: 12, entradas: {}, materiales: {}, cosas: {}, personal: {}, aldea: A.aldeaNueva(), vecindad: V.vecindadNueva(), correo: sanearCorreo({}), ...extra });

// ============================================================ 1. lo puro
{
  eq(VJ.claveVecindad({ clave: 'aldea-jefe', claveAldea: 'jefe' }), 'jefe', 'la gente de la aldea, por su clave de la aldea');
  eq(VJ.claveVecindad({ clave: 'ramon' }), 'ramon');
  eq(VJ.claveVecindad({ clave: 'guarda' }), 'guarda', 'Elsa, la guarda, también');
  eq(VJ.claveVecindad({ clave: 'buzon' }), null, 'el buzón no es un vecino');
  eq(VJ.claveVecindad(null), null);
  const p = partida({ materiales: { tronco: 3, tabla: 1 }, cosas: { yerba: 2 }, entradas: { miel: { cantidad: 1 }, calafate: { cantidad: 2 }, huevo: { cantidad: 5 } } });
  const tengo = VJ.regalablesQueTenes(p).map((r) => r.k);
  eq(tengo, ['tronco', 'yerba', 'miel', 'huevo'], 'sólo lo que alcanza (dos tablas, tres calafates: no)');
  VJ.aplicarEfectos(p, [{ tipo: 'material', k: 'tronco', n: -1 }, { tipo: 'cosa', k: 'yerba', n: -5 }, { tipo: 'entrada', k: 'pan-casero', n: 2 }, { tipo: 'x', k: 'y', n: 1 }, null]);
  ok(p.materiales.tronco === 2 && p.cosas.yerba === 0 && p.entradas['pan-casero'].cantidad === 2, 'los efectos: se descuenta (sin bajar de cero) y se suma');
  eq(VJ.textoEfectos([{ tipo: 'material', k: 'tronco', n: 2 }, { tipo: 'cosa', k: 'yerba', n: 1 }, { tipo: 'material', k: 'tabla', n: -2 }]), 'dos troncos y una medida de yerba');
  // la memoria desde el diario
  eq(VJ.hechoDelDiario('cosecha', 'habas'), { id: 'cosecha', dato: null });
  eq(VJ.hechoDelDiario('carpa'), { id: 'durmio-afuera', dato: null });
  eq(VJ.hechoDelDiario('obra', 'banco de carpintero'), { id: 'obra-propia', dato: { obra: 'banco de carpintero' } });
  eq(VJ.hechoDelDiario('capitulo', 'terminé «La llegada»'), { id: 'capitulo', dato: { capitulo: 'La llegada' } });
  eq(VJ.hechoDelDiario('tejido', 'un poncho'), { id: 'poncho', dato: null });
  eq(VJ.hechoDelDiario('tejido', 'una manta'), null, 'la manta no es el poncho');
  eq(VJ.hechoDelDiario('foto'), null);
  for (const t of ['renoval', 'horno', 'miel', 'esquila', 'tren']) ok(VJ.hechoDelDiario(t), `el diario «${t}» se recuerda`);
  eq(VJ.hechoDelPez({ id: 'marron', cm: 52, def: { nombre: 'Trucha marrón' } }), { id: 'trucha-grande', dato: { cm: 52, especie: 'trucha marrón' } });
  eq(VJ.hechoDelPez({ id: 'marron', cm: 40, def: { nombre: 'Trucha marrón' } }), null, 'una trucha chica no se comenta');
  eq(VJ.hechoDelPez({ id: 'perca', cm: 30, def: { nombre: 'Perca criolla' } }).id, 'pez-nativo');
  for (const id of Object.values(VJ.FOTO_FAUNA)) ok(typeof id === 'string' && id.length > 2, 'cada foto con su animal');
  // los lugares de la mesa y de la casa de té
  const l = VJ.lugaresDeLaMesa({ mesa: { x: 0, z: 0 }, asientos: [{ x: 1, z: 0 }, { x: -1, z: 0 }] });
  ok(Math.abs(l.suyo.mira - Math.atan2(-1, 0)) < 1e-9 && l.tuyo.x === -1, 'en la mesa: uno en cada asiento, mirando la mesa');
  eq(VJ.lugaresDeLaMesa({ mesa: { x: 0, z: 0 }, asientos: [{ x: 1, z: 0 }] }), null, 'con un asiento solo, no');
  const te = VJ.lugaresDeLaCasaTe();
  ok(te && Math.hypot(te.suyo.x - te.tuyo.x, te.suyo.z - te.tuyo.z) < 2, 'en la casa de té, las dos sillas de la misma mesa');
  // la ficha del cuaderno
  const pf = partida();
  V.abrirCharla('ramon', pf, { dia: 1 });
  V.regalar('ramon', 'yerba', pf, 1, { materiales: {}, cosas: { yerba: 9 }, entradas: {} });
  V.regalar('ramon', 'haba', pf, 2, { materiales: {}, cosas: {}, entradas: { haba: { cantidad: 9 } } });
  const lineas = VJ.lineasVecinos(pf);
  eq(lineas.map((x) => x.clave), ['ramon'], 'sólo los que conociste');
  eq(lineas[0].gustos, ['Le encanta: la yerba', 'No le gusta: las habas'], 'lo que ya le regalaste, con palabras');
  const el = (tag, clase, texto) => ({ tag, clase, texto, hijos: [], appendChild(h) { this.hijos.push(h); return h; } });
  const ficha = el('div');
  VJ.fichaVecinos(pf, ficha, el);
  const todo = JSON.stringify(ficha);
  ok(/Tus vecinos/.test(todo) && /Don Ramón, puestero: un conocido\. Le encanta: la yerba\. No le gusta: las habas\./.test(todo), 'la ficha: el nivel con palabras y los gustos descubiertos');
  ok(!/\d/.test(JSON.stringify(ficha.hijos.slice(2))), 'sin números');
}

// ============================================================ 2. la charla con temas
function juego(p, extra = {}) {
  const notas = [];
  const jugadorPos = vec(500, 0, 500);
  const ctx = {
    progreso: () => p, desafio: () => false, pronostico: () => 'para mañana: lluvia', clima: () => 'sol',
    nota: (t, s) => notas.push(`${t} · ${s}`), guardar: () => {}, refrescarBarra: () => {},
    mesa: () => extra.mesa || null, hayVisita: () => false, jugador: () => jugadorPos, alturaDePie: () => 0,
    aldea: () => extra.ag || null,
  };
  return { vj: VJ.crearVecindadJuego(ctx), notas, jugadorPos };
}
const npcDe = (clave, x = 0, z = 0) => ({ clave, pos: vec(x, 0, z), g: { rotation: { y: 0 } }, ruta: [{ x, z, quieto: 5 }], etapa: 0, espera: 0, velocidad: 0.8 });
{
  const p = partida({ dia: 3, horas: 13, cosas: { yerba: 4 }, entradas: { haba: { cantidad: 6 }, miel: { cantidad: 2 } }, materiales: { tronco: 5 } });
  const { vj, notas } = juego(p);
  const ramon = npcDe('ramon');
  const nueva = { id: 'h-calafate', titulo: 'El que come calafate, vuelve', partes: ['a', 'b'] };
  const s = vj.abrir(ramon, { historia: nueva });
  ok(s && s.clave === 'ramon' && s.saludo === null, 'conocido: el saludo de siempre');
  let m = vj.menu(s);
  eq(m.opciones.map((o) => o.id), ['contame', 'como-andas', 'novedades', 'historia', 'regalar', 'invitar', 'ayudar', 'chau'], 'el menú: la historia de siempre primero, los temas, regalar, invitar, dar una mano y chau');
  ok(m.i === 0 && m.tipo === 'charla' && m.opciones[0].titulo === 'Contame algo · El que come calafate, vuelve', 'con el cursor en lo de siempre (E de seguido cuenta la historia, como antes)');
  ok(m.opciones[3].titulo === `Tu historia · ${VOCES.ramon.historia.titulo}`, 'la historia propia con su título');
  eq(vj.elegir(s, 'contame'), { tipo: 'historia', historia: nueva });
  m = vj.menu(s, true);
  ok(m.opciones[m.i].id === 'chau' && !m.opciones.some((o) => o.id === 'contame') && m.texto === '¿Algo más?', 'después: el cursor en chau y la historia ya contada no se ofrece');
  for (const t of ['como-andas', 'novedades', 'historia']) {
    const r = vj.elegir(s, t);
    ok(r.tipo === 'renglones' && r.renglones.length >= 1 && r.renglones.every((x) => typeof x === 'string' && x.length > 5), `el tema «${t}»: ${r.renglones[0].slice(0, 40)}`);
  }
  eq(p.vecindad.personas.ramon.hist, 1, 'la historia avanzó una parte');
  // regalar: el submenú con lo que llevás y lo que le encanta
  eq(vj.elegir(s, 'regalar'), { tipo: 'menu' });
  m = vj.menu(s);
  ok(m.tipo === 'regalar' && m.texto === '¿Qué le regalás?' && m.opciones.some((o) => o.id === 'regalar:yerba' && /\(tenés 4\)/.test(o.titulo)) && m.opciones[m.opciones.length - 1].id === 'volver', `el submenú de regalar: ${m.opciones.map((o) => o.titulo).join(' / ')}`);
  let r = vj.elegir(s, 'regalar:yerba');
  ok(r.reaccion === 'encanta' && r.renglones[0] === VOCES.ramon.encanta.yerba && p.cosas.yerba === 3, 'le encanta la yerba: lo dice y se descuenta');
  ok(!vj.menu(s).opciones.some((o) => o.id === 'regalar'), 'un regalo por día');
  ok(V.gustosConocidos('ramon', p).some((x) => x.cosa === 'yerba' && x.gusto === 'encanta'), 'y queda sabido para el cuaderno');
  // dar una mano: lo que pide sale de la mochila
  vj.elegir(s, 'ayudar');
  m = vj.menu(s);
  ok(m.tipo === 'ayudar' && m.opciones.length === AYUDAS.ramon.length + 1, 'el submenú de las ayudas');
  const conPide = AYUDAS.ramon.find((a) => a.pide);
  const antes = VJ.cantidadDe(p, conPide.pide.tipo, conPide.pide.k);
  r = vj.elegir(s, `ayudar:${conPide.id}`);
  ok(r.tipo === 'renglones' && r.renglones[0] === conPide.gracias[0], 'gracias por la mano');
  ok(VJ.cantidadDe(p, conPide.pide.tipo, conPide.pide.k) <= antes - conPide.pide.n + (conPide.devuelve?.k === conPide.pide.k ? conPide.devuelve.n : 0), 'lo pedido salió de la mochila');
  ok(!vj.menu(s).opciones.some((o) => o.id === 'ayudar'), 'una mano por día');
  // invitar: a la una y media Ramón está libre, pero sin mesa no hay mate
  vj.elegir(s, 'invitar');
  m = vj.menu(s);
  eq(m.opciones.map((o) => o.titulo), ['Un mate en tu mesa', 'Un té en la casa de té', 'Mejor no']);
  r = vj.elegir(s, 'invitar:mate');
  ok(r.tipo === 'renglones' && /mesa de campo/.test(r.renglones[0]), 'sin mesa: dónde');
  eq(vj.elegir(s, 'chau'), { tipo: 'chau' });
  ok(p.vecindad.personas.ramon.p > 10, 'la amistad subió (charla, regalo, mano)');
  ok(!notas.some((x) => /confianza/.test(x)), 'todavía no es amigo: sin aviso de amistad');
}
{
  // un regalo que no le gusta, en otra persona: la abuela y la trucha
  const p = partida({ dia: 2, horas: 10, entradas: { 'trucha-fresca': { cantidad: 1 } } });
  const { vj } = juego(p);
  const s = vj.abrir({ clave: 'aldea-abuela', claveAldea: 'abuela' }, { linea: 'Pasá, tesoro.' });
  ok(vj.menu(s).texto === 'Pasá, tesoro.', 'la línea de la aldea, de entrada');
  vj.elegir(s, 'regalar');
  const r = vj.elegir(s, 'regalar:trucha-fresca');
  ok(r.reaccion === 'noGusta' && r.renglones[0] === VOCES.abuela.noGusta && (p.entradas['trucha-fresca'].cantidad === 0), 'no le gusta: lo dice igual de amable');
  // invitar trabajando y de noche
  p.horas = 10;
  const tr = vj.elegir(vj.abrir({ clave: 'aldea-jefe', claveAldea: 'jefe' }), 'invitar:te');
  ok(tr.tipo === 'renglones' && tr.motivo === 'trabajando' && tr.renglones[0] === VOCES.jefe.ocupado, 'trabajando: dice por qué no');
  p.horas = 22.5;
  const no = vj.elegir(vj.abrir({ clave: 'aldea-nelida', claveAldea: 'nelida' }), 'invitar:te');
  ok(no.motivo === 'noche', 'de noche: mañana');
}
{
  // el poblador: lo de su oficio, primera opción
  const p = partida({ dia: 5, horas: 10 });
  const { vj } = juego(p);
  const servicio = { id: 'aldea-carpintero', partes: ['Dame esos troncos.'], seguir: 'E: dale · Escape: no', tipo: 'servicio', ofrece: true };
  const s = vj.abrir({ clave: 'poblador-carpintero', claveAldea: 'carpintero' }, { servicio });
  const m = vj.menu(s);
  ok(m.opciones[0].id === 'servicio' && m.opciones[0].titulo === '¿Qué tenés para hoy?' && m.i === 0, 'el servicio del día, primero y marcado');
  eq(vj.elegir(s, 'servicio'), { tipo: 'historia', historia: servicio }, 'se cuenta como antes (con su E: dale)');
  ok(!vj.menu(s).opciones.some((o) => o.id === 'servicio'), 'una vez');
  ok(!vj.abrir({ clave: 'aldea-jefe', claveAldea: 'jefe' }) === false, 'cualquiera de la aldea');
  const des = VJ.crearVecindadJuego({ progreso: () => p, desafio: () => true });
  eq(des.abrir({ clave: 'ramon' }), null, 'en el Desafío, la charla de siempre');
}

// ============================================================ 3. la cita
{
  // mate en tu mesa con Ramón (a la una y media está libre)
  const p = partida({ dia: 4, horas: 13 });
  const mesa = { mesa: { x: 10, z: 10 }, asientos: [{ x: 11, z: 10 }, { x: 9, z: 10 }] };
  const { vj, notas, jugadorPos } = juego(p, { mesa });
  const ramon = npcDe('ramon', 30, 10);
  const s = vj.abrir(ramon);
  const r = vj.elegir(s, 'invitar:mate', ramon);
  ok(r.tipo === 'cita' && r.renglones[0] === VOCES.ramon.acepta.replace('{lugar}', 'tu mesa') && r.charla.length >= 2, `acepta: «${r.renglones[0]}»`);
  ok(vj.empezarCita('ramon', ramon, r.que, r.charla, r.lugares), 'sale para tu mesa');
  ok(ramon.deVisita && ramon.ruta.length === 1 && Math.hypot(ramon.ruta[0].x - 11, ramon.ruta[0].z - 10) < 1e-9 && ramon.pos.x === 30, 'cerca: va caminando a su asiento');
  ok(notas.some((x) => /Don Ramón va para tu mesa/.test(x)), 'con su aviso');
  eq(vj.cita().fase, 'yendo');
  ok(vj.elegir(vj.abrir(npcDe('ema')), 'invitar:mate').renglones[0].includes('Ya quedaste con Don Ramón'), 'una invitación por vez');
  ramon.pos.x = 11; ramon.pos.z = 10;
  vj.actualizarCita();
  ok(vj.cita().fase === 'esperando' && ramon.pose === 'sentado', 'llegó: se sienta');
  ok(!vj.puedeSentarse({ x: 0, z: 0 }) && vj.puedeSentarse({ x: 9.5, z: 10.4 }), 'E te sienta al lado de tu lugar');
  ok(vj.textoSentarse() === 'Sentarte a tomar mate con Don Ramón', 'el aviso');
  const se = vj.sentarse();
  ok(se && se.tuyo.x === 9 && se.charla.length >= 2, 'te sentás en el otro asiento y charlan');
  vj.citaCharlada(); vj.citaCharlada();
  ok(vj.cita().fase === 'sobremesa' && notas.filter((x) => /Tomaste mate con Don Ramón/.test(x)).length === 1, 'la sobremesa (el aviso, una vez)');
  p.horas = 14.2;
  vj.actualizarCita();
  ok(!vj.cita() && !ramon.deVisita && ramon.pos.x === 30 && ramon.ruta[0].quieto === 5 && !ramon.pose, 'después se vuelve a lo suyo, como estaba');
  // la mesa lejos y vos lejos: te espera sentado (no camina 500 m)
  const nic = npcDe('nicanor', 300, 300);
  p.horas = 13; p.dia = 5;
  jugadorPos.x = 600;
  const r2 = vj.elegir(vj.abrir(nic), 'invitar:mate', nic);
  ok(r2.tipo === 'cita' && vj.empezarCita('nicanor', nic, 'mate', r2.charla, r2.lugares) && nic.pos.x === 11 && nic.pos.z === 10, 'la mesa queda lejos: te espera ahí');
  vj.actualizarCita();
  eq(vj.cita().fase, 'esperando');
  p.horas = 16.5;
  vj.actualizarCita();
  ok(!vj.cita() && notas.some((x) => /Nicanor se cansó de esperarte/.test(x)), 'si no venís en tres horas, se va');
  ok(!nic.deVisita && nic.pos.x === 300, 'y vuelve a su lugar');
}
{
  // el té con Nélida: va por las calles de la aldea (aldea-gente.js)
  const p = partida({ dia: 2, horas: 18.75 });
  const citas = [];
  const ag = { citar: (k, d) => { citas.push([k, d]); return true; } };
  const { vj } = juego(p, { ag });
  const tl = VJ.lugaresDeLaCasaTe();
  const nel = { clave: 'aldea-nelida', claveAldea: 'nelida', pos: vec(tl.suyo.x + 40, 0, tl.suyo.z), g: { rotation: { y: 0 } } };
  const r = vj.elegir(vj.abrir(nel), 'invitar:te', nel);
  ok(r.tipo === 'cita' && r.que === 'te', `Nélida acepta un té (${r.tipo === 'cita' ? r.renglones[0] : r.renglones[0]})`);
  vj.empezarCita('nelida', nel, 'te', r.charla, r.lugares);
  eq(citas, [['nelida', { edificio: 'casa-te', punto: 'mesa-2' }]], 'la aldea la lleva a la mesa 2 de la casa de té');
  ok(!nel.deVisita && vj.cita().porAldea, 'sin sacarla de su gente');
  nel.pos.x = tl.suyo.x; nel.pos.z = tl.suyo.z; nel.camino = [];
  vj.actualizarCita();
  eq(vj.cita().fase, 'esperando');
  vj.terminarCita();
  eq(citas[1], ['nelida', null], 'al terminar, la suelta');
}

// ============================================================ 4. lo que abre la amistad
{
  const p = partida({ dia: 10 });
  const { vj, notas } = juego(p);
  eq(vj.visitaDeCompadre(), null, 'sin compadres, nadie');
  V.abrirCharla('jefe', p, { dia: 10 });
  Object.assign(p.vecindad.personas.jefe, { p: 150, max: 2, desde: 2, contacto: 10 });
  const v = vj.visitaDeCompadre();
  ok(v && v.clave === 'jefe' && v.partes.length === 2, 'el compadre viene a tu mesa');
  eq(vj.charlaDeCompadre('jefe'), VOCES.jefe.visita);
  const texto = vj.regaloDeCompadre('jefe');
  ok(texto === VOCES.jefe.regalo && p.cosas.yerba === 2, 'y deja lo suyo');
  eq(sanearVisitas({ ultima: 3, cuenta: 2, activa: { clave: 'jefe', dia: 10, charlo: false, amistad: true } }).activa, { clave: 'jefe', dia: 10, charlo: false, amistad: true }, 'la visita del compadre se guarda');
  eq(sanearVisitas({ activa: { clave: 'jefe', dia: 10 } }).activa, null, 'sin la marca, el jefe no es de los cuatro de siempre');
  eq(sanearVisitas({ activa: { clave: '<x>', dia: 1, amistad: true } }).activa, null);
  // el regalo en la puerta al empezar el día
  p.dia = 20;
  vj.actualizar(1);
  ok(notas.some((x) => /^Te dejaron algo en la puerta · Ernesto, el jefe de estación, te dejó yerba para el mate, con una nota/.test(x)), 'el regalo en la puerta, con su nota');
  eq(p.vecindad.dia, 20, 'el día de la vecindad pasó');
  const antes = notas.length;
  vj.actualizar(1);
  eq(notas.length, antes, 'una vez por día');
}

// ============================================================ 5. la memoria
{
  const p = partida({ dia: 6 });
  const { vj } = juego(p);
  ok(vj.delDiario('cosecha', 'habas') && vj.delDiario('capitulo', 'terminé «Los vecinos»') && !vj.delDiario('foto'), 'el diario');
  ok(vj.delPez({ id: 'arcoiris', cm: 61, def: { nombre: 'Trucha arcoíris' } }), 'la trucha grande');
  ok(vj.deFotos(['f-luna', 'f-huemul']), 'la foto de un animal');
  for (let i = 0; i < 9; i++) vj.hecho('talar');
  ok(vj.hecho('aporte-obra', { lote: 'carpinteria' }), 'el aporte a la obra');
  const ids = p.vecindad.hechos.map((h) => h.id).sort();
  eq(ids, ['aporte-obra', 'capitulo', 'cosecha', 'foto-fauna', 'talar', 'trucha-grande'].sort());
  eq(p.vecindad.hechos.find((h) => h.id === 'talar').dato.n, 9, 'la tala se suma en el día');
  const c = V.comentarioSobreVos('pescador', p, 6);
  ok(c && /61 centímetros/.test(c.texto), `y lo comentan: «${c?.texto}»`);
}

// ============================================================ 6. la autonomía (aldea-gente.js)
{
  ok(G.poseDe({ sentado: true, actividad: 'leer' }) === 'leyendo' && G.poseDe({ sentado: true }) === 'sentado' && G.poseDe({ actividad: 'palear' }) === 'palear'
    && G.poseDe({ actividad: 'lena' }) === 'hachar' && G.poseDe({ lugar: 'obra' }) === 'hachar' && G.poseDe({ actividad: 'paseo' }) === 'mirar' && G.poseDe({ lugar: 'casa' }) === null, 'las poses');
  const a = A.aldeaNueva();
  const el = new Map([['nene', { lugar: 'plaza', edificio: 'casa-te', punto: 'mesa-3', actividad: 'te' }]]);
  const ds = G.destinosAldea(a, 16, 1, ['nene', 'jefe'], undefined, el);
  ok(ds.get('nene').edificio === 'casa-te' && ds.get('nene').sentado && ds.get('nene').actividad === 'te' && ds.get('jefe').edificio === 'estacion-aldea', 'lo elegido manda sobre el horario; el resto, el horario');
  ok(G.destinosAldea(a, 16, 1, ['nene']).get('nene').edificio === 'plaza', 'sin lo elegido, como antes');

  const p = partida({ dia: 1, horas: 16.6 });
  const figuras = [];
  const jugador = { estado: { pos: vec(0, 0, 0) } };
  const ctx = {
    progreso: () => p,
    gente: () => ({ gente: [], agregarPoblador: (def) => { const f = { ...def, pos: vec(def.pos.x, 0, def.pos.z), g: { rotation: { y: 0 } } }; figuras.push(f); return f; } }),
    tren: () => ({ est: { parado: 0 } }), jugador: () => jugador, alturaDePie: () => 0,
    nota: () => {}, guardar: () => {}, registrar: (id) => { p.entradas[id] = { dia: 1 }; }, hablandoCon: () => null,
    pronostico: () => '', ambiente: () => ({ clima: 'sol', estacion: 'verano' }), climaVecindad: () => ({ lluvia: 0, invierno: 0, viento: 0.2, nublado: 0.1 }), decir: () => {},
  };
  const ag = G.crearAldeaGente(ctx);
  const M = A.marcoAldea(A.PARADA_ALDEA);
  const w = M.aMundo(6, 39.5);
  jugador.estado.pos.x = w.x; jugador.estado.pos.z = w.z;
  for (let i = 0; i < 14; i++) ag.actualizar(0.6);
  let est = ag.estado();
  const libres = est.npcs.filter((x) => x.libre);
  ok(libres.length >= 1 && libres.every((x) => V.estaLibre(x.clave, 16.6, 0, p)), `a las 16:36 hay gente libre haciendo lo suyo (${libres.map((x) => `${x.clave}: ${x.actividad}`).join(', ')})`);
  ok(est.npcs.filter((x) => !x.libre).every((x) => !V.estaLibre(x.clave, 16.6, 0, p) || x.llegando), 'los que trabajan, en su trabajo');
  ok(libres.every((x) => Object.hasOwn(V.ACTIVIDADES, x.actividad)), 'actividades de la vecindad');
  ok(p.vecindad.personas[libres[0].clave].hizo === libres[0].actividad, 'y se le cumplen las ganas');
  // lo elegido dura: diez ticks más con la misma hora, lo mismo
  const antes = JSON.stringify(libres.map((x) => [x.clave, x.actividad, x.destino.punto]));
  for (let i = 0; i < 10; i++) ag.actualizar(0.6);
  est = ag.estado();
  eq(JSON.stringify(est.npcs.filter((x) => x.libre).map((x) => [x.clave, x.actividad, x.destino.punto])), antes, 'lo elegido no cambia a cada rato');
  // llegados (los dejo en su punto): la pose
  for (const [k, st] of ag.personas) if (st.npc && st.destino) { st.npc.pos.x = st.destino.x; st.npc.pos.z = st.destino.z; st.npc.camino = []; }
  ag.actualizar(0.6);
  est = ag.estado();
  ok(est.npcs.some((x) => x.pose), `con su pose (${est.npcs.filter((x) => x.pose).map((x) => `${x.clave}: ${x.pose}`).join(', ')})`);
  // de noche, nadie libre
  p.horas = 23.5;
  ag.actualizar(0.6);
  ok(ag.estado().npcs.every((x) => !x.libre && x.destino.punto.startsWith('cama')), 'de noche, todos a la cama');
  // la cita a la casa de té manda (aunque sea de noche, mientras dure)
  p.horas = 18.75;
  ag.citar('nelida', { edificio: 'casa-te', punto: 'mesa-2' });
  ag.actualizar(0.6);
  ok(ag.personas.get('nelida').destino.edificio === 'casa-te' && ag.personas.get('nelida').destino.punto === 'mesa-2', 'invitada: va a la casa de té');
  ag.citar('nelida', null);
  ag.actualizar(0.6);
  ok(ag.personas.get('nelida').destino.edificio !== 'casa-te' || ag.personas.get('nelida').destino.punto !== 'mesa-2', 'y después, a lo suyo');
  // la figura de alguien, aunque estés lejos (para la visita del compadre)
  const lejos = G.crearAldeaGente({ ...ctx, jugador: () => ({ estado: { pos: vec(0, 0, 0) } }) });
  const f = lejos.figura('abuela');
  ok(f && f.claveAldea === 'abuela' && lejos.figura('abuela') === f, 'la arma una vez, aunque estés lejos');
  eq(lejos.figura('panadera'), null, 'el que no vino, no');
  ok(typeof ag.dibujarVecinos === 'function', 'y la ficha de los vecinos');
}

// ============================================================ 7. el primer viaje
{
  const c = CAPITULO.manos;
  ok(c.objetivos.find((o) => o.id === 'hacha').texto === 'Tomá la trochita a la Aldea de los Duendes y conseguite el hacha en el almacén', 'el objetivo del hacha es el primer viaje');
  ok(c.intro.some((t) => /Estación del Valle/.test(t) && /bajate en la aldea/.test(t)) && c.intro.some((t) => /Aldea de los Duendes/.test(t)), 'el capítulo dice dónde subir y dónde bajar');
  ok(/Ercilia, que atiende el almacén de la Aldea de los Duendes/.test(CAPITULO.vecinos.intro[0]) && /Ercilia, en la aldea/.test(CAPITULO.vecinos.objetivos[0].texto), 'Ercilia vive en la aldea');
  ok(/almacén de la aldea \(en la trochita\)/.test(PASOS_RELAX.find((x) => x.id === 'madera').texto), 'los primeros pasos también');
  const main = leer('src/main.js');
  ok(main.includes("const PISTA_PRIMER_VIAJE = 'Subite a la trochita en la Estación del Valle, acá cerca del refugio, y bajate en la Aldea de los Duendes: ahí está el almacén de Ercilia';"), 'la pista del primer viaje');
  ok(main.includes("{ id: 'p-aldea', cuando: (js, p) => !desafio && !p.cosas?.hacha && !p.aldea?.descubierta"), 'una vez, sin hacha y sin conocer la aldea');
  ok(main.includes("'Está en el almacén de la Aldea de los Duendes: tomá la trochita en la Estación del Valle'"), 'H sin hacha dice dónde está');
}

// ============================================================ 8. los enganches
{
  const main = leer('src/main.js');
  for (const t of [
    "import { crearVecindadJuego, PIE_MENU, PIE_SUBMENU } from './vecindad-juego.js';",
    'vecindadJuego = crearVecindadJuego({',
    "if (!desafio) vecindadJuego?.actualizar(dt);",
    'charla.vec = vecindadJuego.abrir(npc, { historia: nueva });',
    "charla.vec = vecindadJuego.abrir(npc, { servicio: deLaAldea.tipo === 'servicio' ? deLaAldea : null, linea: deLaAldea.tipo === 'vecino' ? deLaAldea.partes[0] : null });",
    "else if (charla.vec && !charla.vec.chau) { abrirMenuCharla(!!(charla.historia || charla.encargo)); return; }",
    "if (charla.menu) { elegirEnMenuCharla(charla.menu.i); return; }",
    "if (charla.menu && /^Digit[1-9]$/.test(codigo)) { elegirEnMenuCharla(Number(codigo.slice(5)) - 1); return; }",
    'if (charla.menu) { moverMenuCharla(e.deltaY > 0 ? 1 : -1); return; }',
    'if (m.recien.objetoAnterior) { if (charla.menu) moverMenuCharla(-1); else elegirRanura(elegida - 1); }',
    "else if (charla.npc) atrasCharla();",
    'texto = charla.vec?.saludo || saludoDe(',
    'vecindadJuego?.delPez(pez);', "vecindadJuego?.hecho('talar');", 'vecindadJuego?.deFotos(vistos);', "vecindadJuego?.hecho('durmio-afuera');",
    'try { vecindadJuego?.delDiario(tipo, dato); }', "alAporteObra: (lote) => vecindadJuego?.hecho('aporte-obra', { lote }),",
    'const compadre = vecindadJuego?.visitaDeCompadre();', 'const texto = vecindadJuego.regaloDeCompadre(v.activa.clave);',
    'if (deVisita && visitas().activa.amistad && vecindadJuego) charla.historia.partes = vecindadJuego.charlaDeCompadre(visitas().activa.clave);',
    '|| aldeaGente?.figura?.(clave) || null;',
    // lo de siempre sigue
    'const deLaAldea = npc.poblador && aldeaGente ? aldeaGente.charla(npc) : null;',
    'if (charla.historia?.alTerminar && charla.parte === charla.historia.partes.length) charla.historia.alTerminar();',
    "if (deVisita) charla.historia = { id: 'visita', partes: charlaDeVisita(npc.clave, visitas().cuenta), visita: true };",
    'if (!desafio && !charla.enojado && vecindadJuego) {',
  ]) ok(main.includes(t), `main.js: ${t.slice(0, 90)}`);
  // la tecla E y el aviso, en el mismo orden: sentarse a la mesa de la cita, justo después de hablar
  const tecla = main.slice(main.indexOf("case 'KeyE': {"), main.indexOf("case 'Tab':"));
  const aviso = main.slice(main.indexOf('let aviso = objetivo ?'), main.indexOf('mostrarAviso(aviso);'));
  const orden = (t, a, b) => t.indexOf(a) >= 0 && t.indexOf(b) > t.indexOf(a);
  ok(orden(tecla, 'if (vecino) { hablar(vecino); break; }', 'vecindadJuego?.puedeSentarse(js.pos)') && orden(tecla, 'vecindadJuego?.puedeSentarse(js.pos)', 'modos?.accion(jugador.estado)'), 'la tecla E: sentarse va después de hablar y antes de la carrera');
  ok(orden(aviso, 'else if (vecino) aviso', 'vecindadJuego?.puedeSentarse(js.pos)') && orden(aviso, 'vecindadJuego?.puedeSentarse(js.pos)', 'modos?.accion(js)'), 'el aviso, en el mismo lugar');
  const pl = leer('src/plantilla.html');
  ok(pl.includes('<ul class="charla-opciones oculto" id="charla-opciones"></ul>') && pl.includes('.charla-opciones li.elegida'), 'la plantilla: la lista de opciones de la charla');
  const ge = leer('src/gente.js');
  ok(ge.includes('if (g.pose && !andando) posar(g, charlando);   // 3.6 (vida)') && ge.includes("case 'sentado': case 'leyendo':"), 'gente.js: las poses, sin piezas nuevas');
  ok(!/new THREE\.(Mesh|BoxGeometry|CylinderGeometry|Group)/.test(ge.slice(ge.indexOf('function posar('), ge.indexOf('function posar(') + 2500)), 'posar sólo gira y mueve lo que ya hay');
  const ag = leer('src/aldea-gente.js');
  ok(ag.includes('const destinos = destinosAldea(a, horas(), dia(), lista, M, elegirLibres(lista));') && ag.includes('ctx.alAporteObra?.(lote, r.usados);') && ag.includes('ctx.alServicio?.(k, s.efectos);'), 'aldea-gente.js: el tiempo libre y la memoria');
  ok(leer('src/oficios-ui.js').includes("...(aldea?.dibujarVecinos ? ['vecinos'] : [])"), 'la ficha «Tus vecinos» en «Oficios y aldea»');
  ok(leer('package.json').includes('node pruebas/verificar-3-6-vida.mjs'), 'esta prueba, en el gate');
  // los textos que el jugador lee: castellano, sin nada religioso ni de economía
  const vj = leer('src/vecindad-juego.js');
  ok(!/\b(misa|iglesia|capilla|cura|pesos|precio|cobr)/i.test(vj.replace(/\/\/.*$/gm, '')), 'sin nada religioso ni de economía');
  ok(!/^import\s+'/m.test(vj) && !/export (async )?function\*/.test(vj) && !/export .* from/.test(vj), 'armar.mjs lo entiende');
}

console.log(`OK 3.6.0 vida · ${n} verificaciones · menú de la charla, regalar, invitar, dar una mano, amistad, memoria, tiempo libre y el primer viaje`);
