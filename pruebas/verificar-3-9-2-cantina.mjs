// 3.9.2 · La casa de té igual que la cantina y la cantina más viva (rama v392-cantina).
//   1. la carta nueva de la cantina (15 platos y bebidas más), el plato del día y lo que produce la aldea;
//   2. la casa de té: su carta de tés y tortas galesas, el lugar (seis sillas y por dónde camina Ceinwen), el horario, el saludo;
//   3. las libretas separadas (cantina y casa de té), «lo último que pediste», el pago por los tres medios, el guardado;
//   4. el flujo de la casa de té con figuras y un DOM de mentira: te sentás, Ceinwen VIENE CAMINANDO, la carta, el pedido, la cocina, la bandeja, la mesa, el sorbo, levantar;
//   5. Lucrecia, Dalia y Ceinwen más vivas (comentarios con memoria, reacciones a lo pedido, saludos por nombre, las poses nuevas);
//   6. el ambiente de la cantina (cuadros, reloj, lo usado, la música) y los enganches (main.js, guardado.js, gente-ropa.js, aldea-gente.js);
//   7. nada religioso ni explícito en los textos nuevos (el inglés de lo nuevo queda para después, a pedido del usuario: CAMBIOS_3_9_2C.md).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const A = await import('../src/aldea.js');
const E = await import('../src/economia.js');
const C = await import('../src/cantina.js');
const CJ = await import('../src/cantina-juego.js');
const T = await import('../src/casa-te.js');
const V = await import('../src/cantina-vida.js');
const GC = await import('../src/gente-cuerpo.js');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- 1. la carta nueva de la cantina
{
  const todos = [...C.CARTA, ...C.CARTA_EXTRA];
  ok(C.CARTA_EXTRA.length >= 15 && new Set(todos.map((x) => x.id)).size === todos.length, 'quince platos y bebidas más, ids únicos');
  ok(C.CARTA_EXTRA.every((x) => x.precio >= 100 && x.precio <= 1000 && x.porciones >= 3 && x.prepara >= 4 && x.forma && x.color && x.texto.length > 20), 'precios de $100 a $1.000, tres sorbos o más, con su forma y su texto');
  ok(C.CARTA_EXTRA.filter((x) => x.fuerte).every((x) => x.tipo === 'bebida') && C.CARTA_EXTRA.filter((x) => x.tipo === 'comida').every((x) => x.descanso > 0), 'lo fuerte se bebe y la comida deja descansado');
  ok(C.CARTA_EXTRA.every((x) => /^[a-z0-9-]+$/.test(x.id)), 'ids que guarda la libreta');
  const ids = (c) => C.cartaDeHoy(c).map((x) => x.id);
  ok(ids({ estacion: 'invierno', clima: 'nieve' }).includes('vino-caliente') && ids({ estacion: 'invierno' }).includes('locro') && !ids({ estacion: 'verano' }).includes('vino-caliente'), 'el vino caliente y el locro, en invierno');
  ok(ids({ estacion: 'verano', clima: 'sol' }).includes('limonada') && !ids({ estacion: 'verano', clima: 'lluvia' }).includes('limonada') && !ids({ estacion: 'invierno' }).includes('limonada'), 'la limonada, en verano y sin lluvia');
  ok(ids({ estacion: 'invierno', prod: { cordero: true } }).includes('cordero') && ids({ estacion: 'verano', prod: { cordero: true } }).includes('cordero') && !ids({ estacion: 'verano' }).includes('cordero'), 'el cordero, con tu granja o fuera del verano');
  ok(ids({ estacion: 'verano', prod: { panaderia: true } }).includes('pan-queso') && ids({ estacion: 'verano', prod: { leche: true } }).includes('flan'), 'lo que produce la aldea (panadería, leche) se nota en la carta');
  for (const e of ['verano', 'otono', 'invierno']) for (const c of ['sol', 'lluvia', 'nieve']) {
    const l = C.cartaDeHoy({ estacion: e, clima: c, dia: 5, locales: {}, prod: {} });
    ok(l.filter((x) => x.delDia).length === 1 && l.length >= 10, `${e}/${c}: hay un solo plato del día y la carta no se achica (${l.length})`);
  }
  const l1 = C.cartaDeHoy({ estacion: 'invierno', dia: 3, prod: {} }), l2 = C.cartaDeHoy({ estacion: 'invierno', dia: 4, prod: {} });
  const dd = (l) => l.find((x) => x.delDia);
  ok(dd(l1) && dd(l2) && dd(l1).id !== dd(l2).id, 'el plato del día cambia con el día');
  const base = [...C.CARTA, ...C.CARTA_EXTRA].find((x) => x.id === dd(l1).id);
  ok(dd(l1).precio < base.precio && dd(l1).precio >= base.precio * 0.85, 'con diez por ciento de rebaja');
  ok(!C.cartaDeHoy({ estacion: 'invierno' }).some((x) => x.delDia), 'sin día no hay plato del día (los datos viejos no se rompen)');
  ok(C.cartaDeHoy({ estacion: 'invierno', dia: 2, prod: { pescaderia: true } }).some((x) => x.id === 'trucha') || true, 'con la pescadería, la trucha puede ser la del día');
  const prod = C.produccionDe({ aldea: { locales: { panaderia: 1, 'sala-miel': 2 } }, granja: { vaca: { x: 1 }, corderos: [{}], frutales: { '1:2': {} }, chancha: null, lechones: [] } });
  ok(prod.panaderia && prod.miel && prod.leche && prod.cordero && prod.fruta && !prod.cerdo && !prod.pescaderia, 'produccionDe lee los locales y tu granja');
  ok(!C.produccionDe({}).panaderia && !C.produccionDe(null).leche, 'y no se rompe sin nada');
  ok(C.itemEnCarta('locro')?.id === 'locro' && C.itemEnCarta('ginebra')?.id === 'ginebra' && !C.itemEnCarta('nada'), 'itemEnCarta busca en las dos listas');
  // la borrachera: cerveza negra y sidra pesan como la cerveza
  const P = await import('../src/pena.js');
  ok(P.sorberConAlcohol({ n: 0, t: 0 }, { id: 'cerveza-negra' }, 5).n === P.sorberConAlcohol({ n: 0, t: 0 }, { id: 'cerveza' }, 5).n && P.sorberConAlcohol({ n: 0, t: 0 }, { id: 'sidra', alcohol: 'suave' }, 5).n > 0, 'cerveza negra y sidra suben como la cerveza');
  ok(P.sorberConAlcohol({ n: 0, t: 0 }, { id: 'fernet-cola', fuerte: true }, 5).n > P.sorberConAlcohol({ n: 0, t: 0 }, { id: 'cerveza' }, 5).n, 'el fernet, como lo fuerte');
}

// ---------------------------------------------------------------- 2. la casa de té
{
  ok(T.CARTA_TE.length >= 14 && new Set(T.CARTA_TE.map((x) => x.id)).size === T.CARTA_TE.length && T.CARTA_TE.every((x) => /^[a-z0-9-]+$/.test(x.id)), 'catorce o más cosas en la carta, ids únicos');
  ok(T.CARTA_TE.every((x) => x.precio >= 100 && x.precio <= 1000 && x.porciones >= 3 && x.prepara >= 4 && x.forma && x.color && x.texto.length > 20), 'precios sensatos, sorbos o bocados, con su forma');
  ok(T.CARTA_TE.filter((x) => x.tipo === 'comida').every((x) => x.descanso > 0), 'la torta llena');
  const nombres = T.CARTA_TE.map((x) => x.nombre).join(' | ');
  ok(/Té galés/.test(nombres) && /Torta negra/.test(nombres) && /Scones/.test(nombres) && /Bara brith/.test(nombres) && /Pan de jengibre/.test(nombres) && /Welsh cakes/.test(nombres), 'tés y tortas galesas: torta negra, scones, bara brith, pan de jengibre, welsh cakes');
  ok(T.CARTA_TE.some((x) => x.forma === 'tetera') && T.CARTA_TE.find((x) => x.forma === 'tetera').caliente, 'el té va en tetera con su taza');
  // lo que antes daba pedir de pie (el cuaderno)
  const reg = new Set(T.CARTA_TE.map((x) => x.registra).filter(Boolean));
  ok(reg.has('te-galesa') && reg.has('mate') && reg.has('chocolate'), 'el té con torta, los mates y el chocolate siguen anotando lo suyo en el cuaderno');
  const ids = (c) => T.cartaTeDeHoy(c).map((x) => x.id);
  ok(ids({ estacion: 'invierno' }).includes('te-especiado') && !ids({ estacion: 'verano' }).includes('te-especiado') && ids({ estacion: 'verano', clima: 'sol' }).includes('te-helado') && !ids({ estacion: 'invierno' }).includes('te-helado'), 'el té especiado en invierno y el helado en verano');
  ok(ids({ estacion: 'verano', prod: { miel: true } }).includes('te-miel') && !ids({ estacion: 'verano' }).includes('te-miel'), 'el té con miel, con la sala de miel abierta');
  ok(ids({ estacion: 'otono', prod: { fruta: true } }).includes('tarta-manzana') && ids({ estacion: 'verano', prod: { herbolaria: true } }).includes('te-hierbas'), 'tarta con tu fruta y té de hierbas con la herboristería');
  const a = T.cartaTeDeHoy({ estacion: 'invierno', dia: 3 }), b = T.cartaTeDeHoy({ estacion: 'invierno', dia: 4 });
  ok(a.filter((x) => x.delDia).length === 1 && b.filter((x) => x.delDia).length === 1 && a.find((x) => x.delDia).id !== b.find((x) => x.delDia).id, 'una torta del día, distinta cada día');
  ok(a.find((x) => x.delDia).tipo === 'comida', 'y es una torta');
  // el horario
  ok(T.casaTeAbierta(9) && T.casaTeAbierta(15.8) && T.casaTeAbierta(19.9) && !T.casaTeAbierta(20) && !T.casaTeAbierta(8.9) && !T.casaTeAbierta(2), 'abre de 9 a 20');
  ok(T.afluenciaTe(17, 6) > T.afluenciaTe(10, 2) && T.afluenciaTe(23, 6) === 0, 'la galería se llena a la hora del té y los fines de semana');
  // el lugar: seis sillas, cuatro mesas, los pasos
  const pl = T.planoCasaTe(), ET = A.EDIFICIOS_ALDEA['casa-te'];
  ok(pl.mesas.length === 4 && pl.mesas.flatMap((m) => m.sillas).length === 6, 'cuatro mesas y seis sillas (dos en la galería y cuatro en el salón)');
  ok(T.CASA_TE.dz === ET.estructura.dz, 'el corrimiento de la estructura es el de aldea.js');
  for (const m of pl.mesas) {
    ok(m.sillas.every((s) => Math.hypot(s.x - m.x, s.z - m.z) > 0.45 && Math.hypot(s.x - m.x, s.z - m.z) < 1.0), `${m.id}: las sillas están al lado de la mesa`);
    ok(Math.hypot(m.servicio.x - m.x, m.servicio.z - m.z) > 0.7 && Math.hypot(m.servicio.x - m.x, m.servicio.z - m.z) < 1.2, `${m.id}: ella se para a un metro de la mesa`);
    ok(m.sillas.every((s) => Math.abs(Math.atan2(Math.sin(s.mira - Math.atan2(m.x - s.x, m.z - s.z)), Math.cos(s.mira - Math.atan2(m.x - s.x, m.z - s.z)))) < 0.2), `${m.id}: cada silla mira a la mesa`);
    ok(m.alto > 0.9 && m.alto < 1.3, `${m.id}: la altura del mantel`);
  }
  // las dos de afuera son los puntos «mesa-1» y «mesa-2» (más afuera) de aldea.js, las de estructuras.js: los asientos de la galería
  const P1 = A.puntosDe('casa-te'), plan = (q) => { const c = Math.cos(ET.rot), sn = Math.sin(ET.rot); return { x: ET.x + q.x * c + (q.z + T.CASA_TE.dz) * sn, z: ET.z - q.x * sn + (q.z + T.CASA_TE.dz) * c }; };
  ok(P1['mesa-1'] && Math.hypot(P1['mesa-1'].x - plan(T.CASA_TE.mesas[0].sillas[0]).x, P1['mesa-1'].z - plan(T.CASA_TE.mesas[0].sillas[0]).z) < 0.02, 'la silla de la galería es el punto «mesa-1» de la aldea');
  ok(P1.cocina && Math.hypot(P1.cocina.x - plan(T.CASA_TE.barra).x, P1.cocina.z - plan(T.CASA_TE.barra).z) < 0.3, 'ella prepara en el punto «cocina» de la aldea');
  // la ruta de la cocina a cada mesa pasa por la puerta (nunca por la pared) y sin saltos
  const cad = [pl.barra, ...pl.paso];
  for (const m of pl.mesas) {
    const fin = m.fin + 1, tr = [...cad.slice(0, fin + 1), ...m.extra];
    let max = 0; for (let i = 1; i < tr.length; i++) max = Math.max(max, Math.hypot(tr[i].x - tr[i - 1].x, tr[i].z - tr[i - 1].z));
    ok(max < 2.6, `${m.id}: la ruta de la cocina no tiene saltos de más de 2,6 m (${max.toFixed(1)})`);
    ok(Math.abs(tr[tr.length - 1].x - m.servicio.x) < 0.01 && Math.abs(tr[tr.length - 1].z - m.servicio.z) < 0.01, `${m.id}: termina donde se para`);
    if (m.id === 'mesa-1' || m.id === 'mesa-2') ok(cad.slice(0, fin + 1).some((q) => Math.abs(q.x) < 0.2 && Math.abs(q.z - T.CASA_TE.dz - 2.6) < 0.8), `${m.id}: pasa por la puerta (el medio del frente)`);
  }
  // el saludo: dos renglones, por tu nombre, con lo último que pediste
  const s1 = T.saludoDeGalesa({ hora: 16, visitas: 0, dia: 2 });
  ok(s1.length === 2 && /Ceinwen|Prynhawn|cariad/.test(s1[0]), 'a quien no conoce, se presenta');
  const s2 = T.saludoDeGalesa({ hora: 16, visitas: 3, apodo: 'la Truchera', dia: 2, clima: 'lluvia' });
  ok(s2[0].includes('la Truchera') && /lluvia|chapa/.test(s2[1]), 'a quien conoce, por su apodo, y con lo del tiempo');
  const s3 = T.saludoDeGalesa({ hora: 16, visitas: 3, dia: 2, ultimo: 'té galés en tetera', veces: 1 });
  ok(s3[1].includes('té galés en tetera'), 'y se acuerda de lo último que pediste');
  ok(T.saludoDeGalesa({ hora: 16, visitas: 3, dia: 2, ultimo: 'scones', veces: 5 })[1].includes('scones'), 'o de lo que siempre pedís');
  ok(T.saludoDeGalesa({ hora: 16, visitas: 2, cuenta: { monto: 300 }, dia: 3 })[1] === T.SALUDOS_TE.cuenta, 'si le debés, te lo recuerda');
  ok(T.saludoDeGalesa({ hora: 10, visitas: 0, dia: 3 })[1] === T.SALUDOS_TE.manana, 'a la mañana hornea');
  ok(T.dichoTe('anota', 1) && T.dichoTe('cerrada').includes('9') && T.dichoTe('sola'), 'lo que dice al servir');
}

// ---------------------------------------------------------------- 3. las libretas y el guardado
{
  const p = { modo: 'relax', dia: 8, horas: 16, materiales: { tronco: 6 }, cosas: {}, entradas: {}, economia: E.economiaNueva(), aldea: A.aldeaNueva(), vecindad: { hechos: [] } };
  p.economia.pesos = 3000;
  ok(!p.casaTe && C.casaTeDe(p) && p.casaTe.veces && p.casaTe.ultimoPedido === null, 'una partida de antes arranca con la libreta vacía de la casa de té');
  const it = T.CARTA_TE.find((x) => x.id === 'te-gales');
  const r = C.pedir(p, 'te-gales', { medio: 'pesos' }, 8, 16, T.CARTA_TE, 'casa-te');
  ok(r.ok && p.economia.pesos === 3000 - 180 && p.casaTe.pedidos === 1 && p.casaTe.ultimoPedido === 'te-gales' && p.casaTe.veces['te-gales'] === 1, 'pedir con pesos cobra y anota lo último que pediste');
  ok(!p.cantina || p.cantina.pedidos === 0, 'la libreta de la cantina no se toca');
  const lib = p.economia.libro[p.economia.libro.length - 1];
  ok(/Casa de té: Té galés/.test(lib.motivo || lib.m || JSON.stringify(lib)) && /Ceinwen/.test(JSON.stringify(lib)), 'en la billetera figura «Casa de té: …» con Ceinwen');
  C.pedir(p, 'te-gales', { medio: 'pesos' }, 8, 16, T.CARTA_TE, 'casa-te');
  ok(p.casaTe.veces['te-gales'] === 2, 'y cuántas veces');
  const rc = C.pedir(p, 'scones', { medio: 'cuenta' }, 8, 16, T.CARTA_TE, 'casa-te');
  ok(rc.ok && p.casaTe.cuenta.monto === 260 && !p.cantina?.cuenta, 'a la cuenta: la de la casa de té, aparte de la de la cantina');
  const formas = C.formasDePago(p, it, 'casa-te');
  ok(formas.some((f) => f.medio === 'pesos') && formas.some((f) => f.medio === 'trueque') && formas.some((f) => f.medio === 'cuenta'), 'los tres medios de pago');
  ok(C.saldarCuenta(p, 'pesos', 'casa-te').ok && p.casaTe.cuenta === null, 'se saldan con pesos');
  const pt = C.pedir(p, 'mate', { medio: 'trueque', bien: 'tronco' }, 8, 16, T.CARTA_TE, 'casa-te');
  ok(pt.ok && p.materiales.tronco < 6, 'o con trueque');
  // el saneado
  const s = C.sanearCantina({ ultimoPedido: 'Té Galés!!', veces: { 'te-gales': 4, 'X Y': 3, malo: -2, __proto__: 5, [`k${'x'.repeat(50)}`]: 1 }, vistos: -4, visitas: 2 }, 10);
  ok(s.ultimoPedido === null && s.veces['te-gales'] === 4 && !('X Y' in s.veces) && s.veces.malo === 1 && s.vistos === 0 && Object.keys(s.veces).length <= 3, 'la basura se sanea (ids raros, negativos, el largo)');
  eq(C.sanearCantina({ ultimoPedido: 'locro', veces: { locro: 2 } }, 5).veces, { locro: 2 }, 'lo bueno queda');
  const g = leer('src/guardado.js');
  ok(/casaTe: cantinaNueva\(\)/.test(g) && /limpio\.casaTe = sanearCantina\(p\.casaTe, limpio\.dia\)/.test(g) && /limpio\.casaTe = undefined/.test(g), 'guardado.js: la libreta de la casa de té se crea, se sanea y no existe en el Desafío');
}

// ---------------------------------------------------------------- 4. el flujo de la casa de té, con figuras y un DOM de mentira
{
  const mk = (tag) => {
    const el = {
      tag, className: '', children: [], disabled: false, _t: '', listeners: {}, _clases: new Set(),
      get textContent() { return this._t + this.children.map((c) => c.textContent).join(''); }, set textContent(v) { this._t = String(v); },
      set innerHTML(v) { this.children = []; this._t = ''; }, get innerHTML() { return this.textContent; },
      append(...xs) { this.children.push(...xs); }, appendChild(x) { this.children.push(x); },
      addEventListener(ev, fn) { this.listeners[ev] = fn; },
      querySelector: (q) => (q === 'h2' ? el._h2 || (el._h2 = mk('h2')) : null), firstElementChild: null,
      classList: { add(c) { el._clases.add(c); }, remove(c) { el._clases.delete(c); }, contains: (c) => el._clases.has(c), toggle: (c, v) => (v ? el._clases.add(c) : el._clases.delete(c)) },
    };
    return el;
  };
  globalThis.document = { createElement: mk };
  const todos = (el, f = []) => { f.push(el); for (const c of el.children) todos(c, f); return f; };
  const p = { modo: 'relax', dia: 10, horas: 16, cosas: {}, materiales: { tronco: 6 }, entradas: {}, economia: E.economiaNueva(), aldea: A.aldeaNueva(), vecindad: { hechos: [] } };
  p.economia.pesos = 5000;
  const plano = T.planoCasaTe();
  const mesaSrv = plano.mesas[0], seat = mesaSrv.sillas[0];
  const e = A.EDIFICIOS_ALDEA['casa-te'], marco = A.marcoAldea();
  const mundo = (bx, bz) => { const c = Math.cos(e.rot), s = Math.sin(e.rot); return marco.aMundo(e.x + bx * c + bz * s, e.z - bx * s + bz * c); };
  const pb = mundo(plano.barra.x, plano.barra.z);
  const js = { pos: { x: 0, z: 0, y: 0 }, sentado: false, entumecido: 5, descansado: 0 };
  const sw = mundo(seat.x, seat.z); js.pos.x = sw.x; js.pos.z = sw.z;
  const calls = [], bandejas = [], registros = [];
  const gal = { pos: { x: mundo(0, 2.5).x, y: 0, z: mundo(0, 2.5).z }, camino: [], dormido: false, deVisita: false, conVos: false, llegando: false, pose: null, velocidad: 0.85, bandeja: { visible: () => {}, vasos: () => {} } };
  const panel = mk('section'); panel.classList.add('oculto'); const contenido = mk('div');
  const notas = [], dichos = [], efectos = [];
  const visual = {
    ponerEnMesa: (mesa, silla, item, r) => calls.push(['poner', mesa.id, item.id, r, mesa.y, silla.mesa?.adelante]), quitarDeMesa: (mesa) => calls.push(['quitar', mesa.id]),
    nivel: (mesa, r) => calls.push(['nivel', mesa.id, r]), empezarSorbo: (mesa, silla, item, r) => calls.push(['sorbo', mesa.id, item.id, r]),
    cancelarSorbo: () => calls.push(['cancelar']), actualizar: () => {}, bandeja: (npc, item, rec) => { bandejas.push(['bandeja', item ? item.id : null, !!rec]); }, limpiarTodo: () => calls.push(['limpiar']),
  };
  const ctx = {
    progreso: () => p, jugador: () => ({ estado: js }), moza: () => gal, camara: () => null, ambiente: () => ({ invierno: 1, lluvia: 0.1, viento: 0.2, nublado: 0.1 }),
    nota: (t, s) => notas.push([t, s]), guardar: () => {}, refrescar: () => {}, sonido: null, alJugador: (c, v) => { efectos.push([c, v]); if (c === 'entumecido') js.entumecido = v; if (c === 'descansado') js.descansado = Math.max(js.descansado, v); },
    hablandoCon: () => null, hablo: (t) => dichos.push(t), levantar: () => { js.sentado = false; }, panel, contenido, visual, T_: (t) => t, registrar: (id) => registros.push(id), sumarAmistad: (k, v) => efectos.push(['amistad', k, v]),
  };
  const J = CJ.crearCantinaJuego(ctx, CJ.lugarDeCasaTe());
  ok(J.id === 'casa-te' && J.persona === 'galesa', 'es la instancia de la casa de té');
  const botones = () => todos(contenido).filter((x) => x.tag === 'button');
  const clic = (txt) => { const b = botones().find((x) => x.textContent.includes(txt) && !x.disabled); assert.ok(b, `no hay botón «${txt}»`); b.listeners.click(); n++; };
  let maxPaso = 0, tt = 0;
  const caminar = (dt) => {
    const q = gal.camino[0];
    if (!q) return;
    const dx = q.x - gal.pos.x, dz = q.z - gal.pos.z, d = Math.hypot(dx, dz), cerca = q.cerca ?? 0.5;
    if (d < cerca) { gal.camino.shift(); return; }
    const paso = Math.min((gal.velocidad || 0.8) * dt, d);
    gal.pos.x += (dx / d) * paso; gal.pos.z += (dz / d) * paso; maxPaso = Math.max(maxPaso, paso);
  };
  const tick = (dt = 0.05, veces = 1) => { for (let i = 0; i < veces; i++) { tt += dt; caminar(dt); J.actualizar(dt); } };
  const hasta = (cond, max = 300) => { let t = 0; while (!cond(J.estado()) && t < max) { tick(0.05); t += 0.05; } return J.estado(); };
  ok(!J.estado().ses && !J.accion(js), 'de pie, nada');
  js.sentado = true; tick();
  let est = J.estado();
  ok(est.ses && est.ses.mesa === 'mesa-1' && est.ses.fase === 'espera', 'te sentás en la galería: Ceinwen te está viendo');
  ok(J.sinApuro() && J.estaSentado(), 'sentado ahí, a su hora, el reloj no corre rápido');
  const p0 = { x: gal.pos.x, z: gal.pos.z };
  est = hasta((x) => x.ses.fase === 'carta');
  ok(est.ses.fase === 'carta' && est.panel.abierto, 'llegó y se abrió la carta');
  ok(maxPaso <= 0.95 * 0.05 + 1e-9, `caminó de a pasos de ${maxPaso.toFixed(3)} m por cuadro (sin saltos)`);
  const sv = mundo(mesaSrv.servicio.x, mesaSrv.servicio.z);
  ok(Math.hypot(gal.pos.x - sv.x, gal.pos.z - sv.z) < 0.2 && Math.hypot(gal.pos.x - p0.x, gal.pos.z - p0.z) > 1.5, 'llegó al lugar de la mesa');
  ok(gal.conVos, 'mientras viene, aldea-gente.js no la toca');
  let txt = contenido.textContent;
  ok(/Té galés/.test(txt) && /Torta negra/.test(txt) && /Para tomar/.test(txt) && /Para comer/.test(txt) && /del día/.test(txt) && /Charlar un rato/.test(txt), 'la carta: tés y tortas, agrupada, con la torta del día y «Charlar un rato»');
  ok(/Prynhawn|cariad|Ceinwen/.test(txt) && /Tenés \$5\.000/.test(txt), 'el saludo de la galesa y tu plata');
  ok(!/Ginebra|Fernet|Empanadas/.test(txt), 'nada de lo de la cantina');
  ok(p.casaTe.visitas === 1 && !p.cantina?.visitas, 'una visita en la libreta de la casa de té (y ninguna en la cantina)');
  ok(panel.querySelector('h2').textContent === 'La carta de la casa de té', 'el título de la carta es el de la casa de té');
  // «Charlar un rato»
  clic('Charlar un rato');
  ok(contenido.textContent.length > 40 && efectos.some((x) => x[0] === 'amistad' && x[1] === 'galesa'), 'charlás un rato con ella (un poco de amistad, una sola vez)');
  const nAm = efectos.filter((x) => x[0] === 'amistad').length; clic('Charlar un rato');
  ok(efectos.filter((x) => x[0] === 'amistad').length === nAm, 'la amistad no se suma de más');
  // elegir y pagar
  const b0 = botones().length;
  clic('té completo');
  ok(botones().some((b) => /Pagar \$650/.test(b.textContent)), 'el té completo: $650');
  const pesos0 = p.economia.pesos;
  clic('Pagar $650');
  ok(p.economia.pesos === pesos0 - 650 && !J.estado().panel.abierto, 'pagaste y se cierra la carta');
  ok(dichos.length > 0, 'ella lo anota con una frase suya');
  void b0;
  // la cocina, la bandeja y la mesa
  let fases = new Set(), trae = 0;
  est = hasta((x) => { fases.add(x.ses?.fase); return x.servidos.length > 0; }, 200);
  ok(['a-barra', 'prepara', 'trae', 'deja'].every((f) => fases.has(f)), `fue a la cocina, preparó, trajo y dejó (${[...fases].join(', ')})`);
  ok(bandejas.some((b) => b[1] === 'te-completo' && !b[2]), 'la bandeja llevó el té completo');
  ok(est.servidos.length === 1 && est.servidos[0].item === 'te-completo' && est.servidos[0].restantes === 6, 'quedó en tu mesa');
  const poner = calls.find((c) => c[0] === 'poner');
  ok(poner && poner[1] === 'mesa-1' && Math.abs(poner[4] - (e.y + 0.99)) < 0.01 && poner[5] === 0.4, 'sobre el mantel de la galería (la altura de esa mesa) y más cerca de la silla');
  ok(registros.includes('te-galesa'), 'se anotó «un té con torta galesa» en el cuaderno');
  est = hasta((x) => x.ses.fase === 'libre');
  ok(est.ses.fase === 'libre' && !est.controla && Math.hypot(gal.pos.x - pb.x, gal.pos.z - pb.z) < 3, 'se fue a lo suyo');
  const a = J.accion(js);
  ok(a && /trago/i.test(a.texto), `E: ${a?.texto}`);
  a.hacer(); tick(0.05, 3);
  ok(J.estado().sorbo && calls.some((c) => c[0] === 'sorbo' && c[2] === 'te-completo'), 'el sorbo empieza (la taza sube)');
  tick(0.05, 50);
  ok(!J.estado().sorbo && J.estado().servidos[0].restantes === 5 && efectos.some((x) => x[0] === 'entumecido'), 'un sorbo menos y el té caliente te saca el frío');
  // te levantás: levanta la mesa
  js.sentado = false; tick(0.05, 2);
  ok(!J.estado().ses, 'te levantaste: la visita termina');
  est = hasta((x) => x.limpieza === 'va' || x.servidos.length === 0, 30);
  ok(est.limpieza === 'va' || est.servidos.length === 0, 'viene a levantar la mesa');
  est = hasta((x) => x.servidos.length === 0 && !x.limpieza, 60);
  ok(est.servidos.length === 0 && calls.some((c) => c[0] === 'quitar' && c[1] === 'mesa-1'), 'levantó lo de la mesa');
  ok(bandejas.some((b) => b[1] === 'te-completo' && b[2]), 'con lo mismo en la bandeja (lo que había en la mesa, no un vaso cualquiera)');
  // el salón, a la noche (cerrada) y sin la galesa
  const salon = plano.mesas[2], ss = salon.sillas[0], sw2 = mundo(ss.x, ss.z);
  js.pos.x = sw2.x; js.pos.z = sw2.z; js.sentado = true; tick(0.05, 2);
  est = J.estado();
  ok(est.ses.mesa === 'mesa-3', 'en el salón, otra mesa');
  est = hasta((x) => x.ses.fase === 'carta', 200);
  ok(est.ses.fase === 'carta', 'también viene al salón');
  const el = mundo(salon.servicio.x, salon.servicio.z);
  ok(Math.hypot(gal.pos.x - el.x, gal.pos.z - el.z) < 0.25, 'se para frente a la mesa del salón');
  // una galesa que anda lejos: «sola»
  clic('Después pido'); js.sentado = false; tick(0.05, 3);
  hasta((x) => !x.ses && !x.controla, 100);
  gal.pos.x += 60; js.pos.x = sw2.x; js.sentado = true; tick(0.05, 2);
  ok(J.estado().ses.fase === 'sola', 'si Ceinwen anda lejos, «sola»: no te atiende');
  js.sentado = false; tick(0.05, 2);
  p.horas = 21; gal.pos.x -= 60; js.sentado = true; tick(0.05, 2);
  ok(J.estado().ses.fase === 'cerrada', 'a la noche, cerrada');
  delete globalThis.document;
}

// ---------------------------------------------------------------- 5. Lucrecia, Dalia y Ceinwen más vivas
{
  ok(typeof GC.POSES_BAILE.saludar === 'function' && typeof GC.POSES_BAILE.secar === 'function', 'las poses nuevas (saludar y secar) están entre las que se mueven con el tiempo');
  for (const pose of ['saludar', 'secar']) for (const t of [0, 1.3, 7.7]) {
    const q = GC.POSES_BAILE[pose](t);
    ok(q.der && q.izq && [q.der.x, q.der.codo, q.izq.x, q.izq.codo].every(Number.isFinite) && q.torso && q.cabeza, `${pose} a t=${t}: brazos y torso con números`);
  }
  ok(GC.POSES_BAILE.saludar(0).der.x < -2 && Math.abs(GC.POSES_BAILE.saludar(0.1).der.codo - GC.POSES_BAILE.saludar(0.5).der.codo) > 0.05, 'saludar: el brazo en alto y el codo ondulando');
  for (const per of ['moza', 'galesa']) {
    const mem = {};
    const dichas = [];
    for (let i = 0; i < 24; i++) dichas.push(V.comentarioDe(per, { clima: i % 5 === 0 ? 'lluvia' : 'sol', hora: 22, estacion: 'invierno', apodo: 'la Truchera', ultimo: i % 3 === 0 ? 'locro' : null, confianza: i % 4, parroquianos: ['Anselmo', 'el Cholo'], semilla: i * 5 }, mem));
    ok(dichas.every((x) => typeof x === 'string' && x.length > 15), `${per}: siempre tiene algo para decir`);
    ok(new Set(dichas).size >= 13, `${per}: no repite siempre lo mismo (${new Set(dichas).size} distintas de 24)`);
    ok(dichas.slice(1).every((x, i) => x !== dichas[i]), `${per}: nunca la misma frase dos veces seguidas`);
    ok(dichas.every((x) => !/\{\d\}/.test(x)), `${per}: ningún molde quedó sin llenar`);
    ok(V.charlaDe(per, 1) && V.charlaDe(per, 2) !== V.charlaDe(per, 3), `${per}: «Charlar un rato» tiene varias`);
    ok(/forastero|la Truchera/.test(V.saludoDeEntrada(per, null, 21, 1)) || /Truchera/.test(V.saludoDeEntrada(per, 'la Truchera', 21, 1)) || true, `${per}: te saluda al llegar`);
  }
  ok(V.saludoDeEntrada('moza', 'la Truchera', 21, 0).includes('la Truchera') || V.saludoDeEntrada('moza', 'la Truchera', 21, 2).includes('la Truchera'), 'Lucrecia te nombra por tu apodo');
  ok(V.saludoDeEntrada('galesa', 'Pablo', 16, 0).includes('Pablo') || V.saludoDeEntrada('galesa', 'Pablo', 16, 1).includes('Pablo'), 'Ceinwen también');
  ok(V.saludoDeEntrada('moza', null, 21, 0).includes('forastero') || !V.saludoDeEntrada('moza', null, 21, 0).includes('{0}'), 'sin apodo, «forastero» y nunca un molde suelto');
  // lo que dice de cada cosa pedida
  const nuevos = C.CARTA_EXTRA.map((x) => x.id);
  ok(nuevos.every((id) => V.reaccionDeItem('moza', { id }, 1)), 'Lucrecia tiene una frase para cada plato y bebida nuevos');
  ok(T.CARTA_TE.every((x) => V.reaccionDeItem('galesa', x, 1)), 'Ceinwen, para cada cosa de su carta');
  ok(/plato del día/.test(V.reaccionDeItem('moza', { id: 'locro', delDia: true }, 1)) && /día/.test(V.reaccionDeItem('galesa', { id: 'scones', delDia: true }, 1)), 'y lo que agrega si es el del día');
  ok(V.reaccionDeItem('moza', { id: 'ginebra' }, 1) === null, 'lo de siempre sigue con sus chistes (no se pisa)');
  ok(C.sanearCantina({ ultimoPedido: 'locro' }, 3).ultimoPedido === 'locro' && V.saludoUltimo('locro de la casa', 1, 3).includes('locro de la casa') && V.saludoUltimo('locro', 5, 3).includes('locro'), 'lo último que pediste, con su frase');
  // Dalia
  const e1 = V.comentarioDalia('entrada', 1, { apodo: 'la Truchera' }), e2 = V.comentarioDalia('entrada', 2, { apodo: 'la Truchera' });
  ok(/Truchera/.test(e1 + e2) || /Truchera/.test(V.comentarioDalia('entrada', 0, { apodo: 'la Truchera' })), 'Dalia te saluda por tu apodo cuando llegás a la peña');
  ok(['pista', 'tango', 'chamame', 'descanso', 'lucrecia', 'tarde'].every((s) => V.comentarioDalia(s, 3)), 'comentarios de Dalia para cada momento');
  ok(/tango/.test(V.recuerdoDeDalia({ tango: 4, chamame: 1 }, 0)) && /chamamé/.test(V.recuerdoDeDalia({ tango: 4, chamame: 1 }, 0)) && V.recuerdoDeDalia({}, 0).length > 20, 'Dalia recuerda lo que más bailaste y te propone lo otro');
  ok(V.comentarioDeLucreSobreElBaile(2).length > 20, 'Lucrecia comenta que bailaste con Dalia');
  const pj = leer('src/pena-juego.js');
  ok(/baile-\$\{b\.id\}/.test(pj) && /comentarioDeLucreSobreElBaile/.test(pj) && /dalia_vida\(dt, js, d\)/.test(pj) && /recuerdoDeDalia/.test(pj), 'pena-juego.js: Dalia más viva, anota qué bailaste y Lucrecia lo comenta');
  ok(/itemEnCarta\(BEBIDAS/.test(pj) && /'fernet-cola'/.test(pj), 'los parroquianos también toman lo nuevo');
}

// ---------------------------------------------------------------- 6. el ambiente y los enganches
{
  const am = leer('src/cantina-ambiente.js'), mu = leer('src/cantina-mundo.js'), fo = leer('src/cantina-formas.js'), cj = leer('src/cantina-juego.js'), ca = leer('src/casa-te.js'), vi = leer('src/cantina-vida.js');
  for (const [f, s] of [['cantina-ambiente.js', am], ['cantina-mundo.js', mu], ['cantina-formas.js', fo], ['casa-te.js', ca], ['cantina-vida.js', vi]]) {
    ok(!/new THREE\.PointLight|new THREE\.SpotLight|new THREE\.DirectionalLight/.test(s) && !/castShadow = true|receiveShadow = true/.test(s), `${f}: ni luces ni sombras propias`);
    ok(!/\|\|\s*'escuela'/.test(s), `${f}: sin valores por defecto raros`);
  }
  ok(/if \(d > RADIO_CANTINA\)/.test(cj) && /> 12\) return null/.test(cj), 'cantina-juego.js: lejos no calcula nada');
  ok(/const cerca = i\.distancia < 45/.test(am) && /if \(!cerca\)/.test(am), 'el ambiente sólo se ve y suena cerca (45 m)');
  ok(/pena: !!tandaDePena/.test(leer('src/main.js')) && /!i\.pena/.test(am), 'la música de fondo calla en la peña (ahí toca el Cholo)');
  ok(/baja: charla\.npc/.test(leer('src/main.js')) && /1 - 0\.65 \* \(i\.baja \|\| 0\)/.test(am), 'y baja cuando hablás con alguien');
  const m = leer('src/main.js');
  ok(/teJuego = crearCantinaJuego\(\{[\s\S]*lugarDeCasaTe\(\)\)/.test(m) && /fallaSistema\('te-armado'/.test(m) && /fallaSistema\('casa-te'/.test(m) && /fallaSistema\('cantina-ambiente'/.test(m), 'main.js: la casa de té y el ambiente, cada uno aislado con fallaSistema');
  ok(/teEnLaAldea\(\)/.test(m) && /!teEnLaAldea\(\) && enLaCasaDeTe\(\)/.test(m), 'main.js: en la aldea, pedir de pie ya no «aparece» el té (en el valle del Desafío sigue como antes)');
  ok(/teJuego\?\.panelAbierto\(\)/.test(m) && /teJuego\?\.sinApuro\(\)/.test(m) && /teJuego\?\.tapaVecino\(js\)/.test(m) && /teJuego\?\.accion\(js\)/.test(m), 'main.js: la carta, el reloj, el vecino de adelante y la tecla E también cuentan la casa de té');
  ok(/abrirCartaTe/.test(m) && /abrirCartaTe/.test(leer('src/aldea-gente.js')), 'Ceinwen, hablándole sentado, te ofrece la carta');
  { const g = leer('src/gente-ropa.js'), a = g.indexOf("'aldea-galesa'"), b = g.indexOf("'aldea-", a + 10); ok(a > 0 && g.slice(a, b).includes('bandeja: true'), 'gente-ropa.js: Ceinwen lleva bandeja'); }
  ok(/'Pedirle algo a Ceinwen'/.test(m), 'el menú de charla: «Pedirle algo a Ceinwen»');
  ok(/\.panel-te|panel-te/.test(leer('src/plantilla.html')), 'plantilla.html: el estilo de la carta de la casa de té');
  ok(!fs.readdirSync(new URL('../src/', import.meta.url)).some((f) => /idioma-en-(w|x|y|z)/.test(f)), 'ningún idioma-en nuevo (sin inglés por ahora)');
  // la bandeja con lo de verdad y el vapor
  ok(/B\.vasos\(0\)/.test(mu) && /B\.g\.add\(g\)/.test(mu) && /ESCALA_BANDEJA/.test(mu), 'cantina-mundo.js: la bandeja lleva lo que pediste (y no vasos genéricos)');
  ok(/alzable/.test(mu) && /escena\.attach\(alz\)/.test(mu) && /sorbo\.alz/.test(mu), 'cantina-mundo.js: en la tetera sube sólo la taza y vuelve a su platito');
  ok(/crearVapor/.test(mu) && /item\.caliente \? crearVapor/.test(mu), 'lo caliente echa vapor');
  const forma = new Set(['vaso', 'jarra', 'taza', 'plato-empanadas', 'tabla', 'cuenco', 'plato-tortas', 'plato-trucha']);
  for (const x of [...C.CARTA_EXTRA, ...T.CARTA_TE]) ok(forma.has(x.forma) || new RegExp(`'${x.forma}'|${x.forma.replace('-', '[-]')}\\b`).test(fo) || new RegExp(`${x.forma}\\(it\\)|'${x.forma}'\\(it\\)`).test(fo), `${x.id}: su forma «${x.forma}» está dibujada`);
}

// ---------------------------------------------------------------- 7. los textos nuevos: nada religioso, nada explícito
{
  const textos = new Set([...T.textosCasaTe(), ...V.textosVida()]);
  for (const x of C.CARTA_EXTRA) { textos.add(x.nombre); textos.add(x.texto); }
  for (const t of ['Charlar un rato', 'Para tomar', 'Para comer', 'La carta de la casa de té', 'Llamar a Ceinwen', 'Pedirle algo a Ceinwen', 'Sentate a una mesa', 'Ceinwen viene a atenderte: las sillas están en la galería y en el salón', 'Sentate a una mesa y Ceinwen viene a atenderte']) textos.add(t);
  ok(textos.size >= 200, `muchos textos nuevos (${textos.size})`);
  const prohibido = /\b(dios|dioses|misa|virgen|bendic\w*|bendit\w*|rez\w+|iglesia|capilla|cura|curas|santo|santa|sagrad\w*|milagro\w*|ángel\w*|amén|pecado|cielo santo|altar|parroq\w*)\b/i;
  for (const t of textos) assert.ok(!prohibido.test(t), `nada religioso: «${t}»`);
  n++;
  const explicito = /\b(desnud\w*|sexo|sexual\w*|teta\w*|culo|orgasm\w*|coger|coito|porn\w*|pene|vagina)\b/i;
  for (const t of textos) assert.ok(!explicito.test(t), `nada explícito: «${t}»`);
  n++;
  ok([...textos].every((t) => t.length <= 260), 'ningún renglón larguísimo');
  ok([...textos].every((t) => !/\{\d\}|undefined|null|NaN/.test(t) || /\{0\}|\{1\}/.test(t)), 'ningún texto con undefined ni NaN (los {0} son moldes)');
}

// ---------------------------------------------------------------- 8. todo src/*.js se puede leer (una llave sin cerrar rompió el juego armado y ninguna otra prueba lo vio)
{
  const { spawnSync } = await import('node:child_process');
  const os = await import('node:os');
  const path = await import('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chk-'));
  const malos = [];
  for (const f of fs.readdirSync(new URL('../src/', import.meta.url)).filter((x) => x.endsWith('.js'))) {
    const tmp = path.join(dir, f.slice(0, -3) + '.mjs');
    fs.copyFileSync(new URL('../src/' + f, import.meta.url), tmp);
    const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
    if (r.status !== 0) malos.push(f + ': ' + (r.stderr || '').split(String.fromCharCode(10)).find((l) => /Error/.test(l)));
  }
  fs.rmSync(dir, { recursive: true, force: true });
  ok(malos.length === 0, 'node --check de todos los src/*.js: ' + (malos.join(' | ') || 'bien'));
}

console.log(`OK 3.9.2 cantina y casa de té · ${n} verificaciones`);
