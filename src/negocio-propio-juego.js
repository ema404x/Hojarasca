// 4.3 · EL NEGOCIO PROPIO, lo que toca el juego: el local (la obra que armaste), la E del mostrador, el panel de estantes y precios, y los clientes que
// llegan caminando, se paran frente al mostrador, piden y se van. Las reglas (stock, precios, demanda, reputación, caja, cola) están en
// negocio-propio.js; los planos, en planos-negocio.js. main.js lo crea una vez con lo que necesita (todo por función: se lee al usarlo).
//
// Cómo anda:
//   · el estado vive en `progreso.negocioPropio` (uno por partida); el local activo es el primero que armaste y terminaste (un segundo local se
//     queda de adorno: avisa que ya tenés uno). Si lo desarmás, la mercadería y la plata de la caja vuelven a vos;
//   · cada 0,25 s (no por cuadro) se avanza la cola: si el local está abierto, vos estás cerca y es la hora, llegan clientes (como mucho tres a la vez,
//     uno por figura libre); cada uno camina hasta el mostrador, espera y pide. E sobre él (o E junto al local) lo despacha; mantener E abre el panel;
//   · las figuras de los clientes son tres (la vecina, el hachero, el viajero), se arman de a poco y se reusan; fuera de hora o sin clientes están
//     dormidas (ni se dibujan ni se mueven). No hay luces ni nada nuevo por cuadro;
//   · si no estás cerca (más de 35 m) no llega nadie; los que esperaban se van sin que baje la fama;
//   · 4.4.1: cada día que empieza (estés donde estés) el local paga sus gastos fijos —alquiler, impuesto y luz— de la caja y, si no alcanza, de tu billetera (reglas en
//     negocio-propio-gastos.js); el panel lleva el balance, la deuda y el «Pedir al proveedor» (negocio-propio-reposicion.js).
import { formatoPesos, hayEconomia } from './economia.js';
import {
  TIPOS, IDS_LOCALES, esLocal, tipoDePlano, catalogo, negocioPropioDe, ponerAlDia, colaNueva, avanzarCola, primeroEnLaCola, despachar, armarCliente, fraseDePedido, etiquetaDe,
  surtir, surtirTodo, sacarDelEstante, unidadesSacables, ponerPrecio, retirarCaja, cerrarLocal, vistaDelLocal, firmaDeVista, filasDelPanel, avisoDelLocal, nombreDeRep, nivelDeRep, NIVELES, precioUnidad,
  textoLista, nombreUnidad, unidadesEnEstantes, CAJA_MAX, COLA, resumenDelDia, cuantasCosas, llegadasPorDia, HORA_ABRE, HORA_CIERRA,
} from './negocio-propio.js';
import { MEDIDAS, SITIOS_CLIENTES } from './planos-negocio.js';
import { cobrarGastos, pagarDeudaAMano, lineasFinanzas, cerradoPorDeuda, hayDeuda, gastoPorDia, TEXTO_GASTOS } from './negocio-propio-gastos.js';
import { pedirAlProveedor, presupuestoProveedor, textoPedido, PROVEEDOR } from './negocio-propio-reposicion.js';

const PASO = 0.25;            // cada cuánto se avanza la cola (segundos): nada por cuadro
const RADIO_FIGURAS = 110;    // a cuántos metros se arman las figuras de los clientes
// Las tres figuras de los clientes (la ropa es de acá; el cuerpo, de la clave: ver gente.js)
const LOOKS = [
  { id: 'v', clave: 'visitante-chela', nombre: 'Vecina', colores: { ropa: '#8a5a6a', abrigo: '#5a4a5a', gorro: null, pelo: '#6a4a32', bufanda: '#e0d0c0' }, perfiles: ['vecina', 'merendera', 'tejedora'] },
  { id: 'h', clave: 'visitante-mateo', nombre: 'Hachero', colores: { ropa: '#8a5a32', abrigo: '#3a4a3a', gorro: 'boina', pelo: '#3a2a1e', barba: '#4a3a2a' }, perfiles: ['hachero', 'constructor'] },
  { id: 't', clave: 'visitante-tomas', nombre: 'Viajero', colores: { ropa: '#4a7a8a', abrigo: '#7a6a3a', gorro: 'sombrero', pelo: '#2a1e16' }, perfiles: ['viajero'] },
];

export function crearNegocioJuego(ctx) {
  const P = () => ctx.progreso();
  const ahora = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const estado = () => (hayEconomia(P()) ? negocioPropioDe(P()) : null);
  const terminada = (o) => o.datos.etapas >= o.plano.etapas.length;
  const cola = colaNueva();
  const figuras = LOOKS.map((look) => ({ look, npc: null, tarea: null, cliente: null, fase: 'libre', t: 0, slot: -1 }));
  let acum = 0, ultimaAbs = null, cacheLocal = null, cacheHasta = 0, armando = null, sinLugar = 0, repNivelAntes = null;
  const ui = { abierto: false, tip: true };

  // ---------------------------------------------------------------- el local
  // El primer local terminado: se mira cada segundo, no cada cuadro. 4.4.2: «real» es el dueño del estado (stock, caja, tipo) aunque lo estés moviendo (mover con M);
  // `local()` es ese mismo, salvo mientras lo movés (entonces no hay: ni clientes ni empleados en el lugar viejo). Antes, mover el activo dejaba a OTRO local
  // de adorno como «el activo» y la cuenta se cerraba sola (se devolvía la mercadería, se retiraba la caja, se perdonaba la deuda).
  function localReal() {
    const ob = ctx.obras();
    if (!ob) return null;
    if (cacheLocal && ahora() < cacheHasta && cacheLocal.datos && terminada(cacheLocal)) return cacheLocal;
    cacheLocal = null; cacheHasta = ahora() + 1000;
    for (const o of ob.obras) if (esLocal(o.plano.id) && terminada(o)) { cacheLocal = o; break; }
    return cacheLocal;
  }
  function local() {
    const r = localReal();
    return r && r !== ctx.obras()?.editando ? r : null;
  }
  const esActivo = (o) => !!o && local() === o;
  const medidas = (o) => MEDIDAS[o.plano.id];
  // del marco del local (z hacia el fondo) al mundo
  function aMundo(o, lx, lz) {
    const r = o.datos.rot || 0, c = Math.cos(r), s = Math.sin(r);
    return { x: o.datos.x + lx * c + lz * s, z: o.datos.z - lx * s + lz * c };
  }
  const distA = (o) => { const js = ctx.jugador()?.estado; return js ? Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z) : Infinity; };
  // Lo que se ve del local (estantes y cartel): copia en `datos.local`; si cambió, se rehace la malla (una vez por venta o por surtido)
  function sincronizarVista(o, est) {
    const v = est.tipo === tipoDePlano(o.plano.id) ? vistaDelLocal(est) : { abierto: false, p: {} };
    if (firmaDeVista(o.datos.local) === firmaDeVista(v)) return;
    o.datos.local = v;
    ctx.obras()?.rehacer?.(o);
  }
  // El local se prepara para este tipo (la primera vez que lo usás, o si venías con otro)
  function prepararTipo(o, est) {
    const tipo = tipoDePlano(o.plano.id);
    if (est.tipo === tipo) return;
    if (est.tipo) cerrarLocal(P(), est, (k, n) => ctx.dar(k, n));
    est.tipo = tipo; est.abierto = false; est.stock = {}; est.precios = {};
  }

  // ---------------------------------------------------------------- las figuras de los clientes
  const libre = (f) => f.fase === 'libre' && f.npc && !f.cliente;
  const enMarcha = () => figuras.filter((f) => f.cliente).length;
  function avanzarArmado() {
    const g = ctx.gente?.();
    if (!g?.armarPobladorDeAPoco) return;
    let ms = ctx.msFigura?.() ?? 3;
    if (!(ms > 0)) { sinLugar++; if (sinLugar < 20) return; ms = 3; }
    sinLugar = 0;
    if (!armando) armando = figuras.find((f) => !f.npc) || null;
    if (!armando) return;
    const f = armando, o = local();
    if (!o) return;
    if (!f.tarea) {
      const p0 = aMundo(o, 0, -(medidas(o).D / 2) - 14);
      f.tarea = g.armarPobladorDeAPoco({ clave: f.look.clave, colores: f.look.colores, nombre: f.look.nombre, oficio: 'cliente', pos: { x: p0.x, z: p0.z }, mira: { x: o.datos.x, z: o.datos.z }, mano: null, velocidad: 1.25, camino: [], saludo: '', despedida: '' });
    }
    if (f.tarea.avanzar(ms)) {
      f.npc = f.tarea.npc; f.tarea = null; armando = null;
      if (f.npc) { f.npc.dormido = true; f.npc.sinFrenar = true; f.npc.clienteNegocio = true; f.npc.camino = []; f.npc.velocidad = 1.25; }
    }
  }
  function poner(f, x, z) { const n = f.npc; n.pos.set(x, ctx.alturaDePie ? ctx.alturaDePie(x, z, n.pos.y) : n.pos.y, z); }
  function quitarFiguras() {
    const g = ctx.gente?.();
    for (const f of figuras) {
      const n = f.npc || f.tarea?.npc;
      if (n) g?.quitar?.(n);
      f.npc = null; f.tarea = null; f.cliente = null; f.fase = 'libre';
    }
    armando = null;
    cola.clientes.length = 0; cola.acum = 0;
  }
  // La figura que le toca a este cliente: la de su ropa, si está libre; si no, cualquiera
  function figuraPara(c) {
    return figuras.find((f) => libre(f) && f.look.perfiles.includes(c.perfil)) || figuras.find(libre) || null;
  }
  function sitioLibre() { const usados = new Set(figuras.filter((f) => f.cliente).map((f) => f.slot)); for (let i = 0; i < 3; i++) if (!usados.has(i)) return i; return 0; }
  // Un cliente nuevo: su figura sale de unos metros al frente y camina hasta el mostrador
  function llega(c, o) {
    const f = figuraPara(c);
    if (!f) { cola.clientes.splice(cola.clientes.indexOf(c), 1); return; }
    const M = medidas(o), slot = sitioLibre(), s = SITIOS_CLIENTES(M.D)[slot];
    f.cliente = c; f.slot = slot; f.fase = 'viene'; f.t = 0; c.figura = f;
    const lado = [-5, 0, 5][(c.frase + slot) % 3];
    let d0 = aMundo(o, lado, -(M.D / 2) - 15);
    if (ctx.agua?.(d0.x, d0.z)) d0 = aMundo(o, 0, -(M.D / 2) - 9);
    const meta = aMundo(o, s.x, s.z);
    const n = f.npc;
    n.nombre = etiquetaDe(c); n.dormido = false; n.enCita = false;
    poner(f, d0.x, d0.z);
    n.camino = [{ x: meta.x, z: meta.z, cerca: 0.3 }];
    n.miraFinal = Math.atan2(o.datos.x - meta.x, o.datos.z - meta.z);
    n.velocidad = 1.25;
  }
  function sale(f, o, rapido = false) {
    const c = f.cliente; f.cliente = null; if (c) c.figura = null;
    const n = f.npc;
    if (!n) { f.fase = 'libre'; return; }
    if (rapido || !o || distA(o) > COLA.radioPartir || n.dormido) { n.dormido = true; n.camino = []; f.fase = 'libre'; return; }
    const M = medidas(o), lado = f.slot === 1 ? -7 : f.slot === 2 ? 7 : (f.look.id === 'h' ? -7 : 7);
    const fuera = aMundo(o, lado, -(M.D / 2) - 14);
    n.camino = [{ x: fuera.x, z: fuera.z, cerca: 1.2 }];
    n.velocidad = 1.3;
    f.fase = 'va'; f.t = 0;
  }
  const alMostrador = (f, o) => {
    const M = medidas(o), s = SITIOS_CLIENTES(M.D)[f.slot], meta = aMundo(o, s.x, s.z);
    return Math.hypot(f.npc.pos.x - meta.x, f.npc.pos.z - meta.z);
  };
  function moverFiguras(dt, o) {
    for (const f of figuras) {
      if (!f.npc) continue;
      if (f.fase === 'viene' && f.cliente) {
        f.t += dt;
        if (o && (alMostrador(f, o) < 0.5 || f.t > 28)) {
          if (alMostrador(f, o) >= 0.5) { const M = medidas(o), s = SITIOS_CLIENTES(M.D)[f.slot], m = aMundo(o, s.x, s.z); poner(f, m.x, m.z); }   // (si se trabó en el camino, aparece en su lugar)
          f.npc.camino = []; f.fase = 'espera'; f.cliente.listo = true;
          const c = f.cliente;
          ctx.nota?.(`${etiquetaDe(c)} en el mostrador`, `«${fraseDePedido(c)}»`, true);
          ctx.sonido?.()?.anotar?.();
        }
      } else if (f.fase === 'va') {
        f.t += dt;
        if (!f.npc.camino?.length || f.t > 22) { f.npc.dormido = true; f.npc.camino = []; f.fase = 'libre'; }
      }
    }
  }

  // ---------------------------------------------------------------- avanzar (se llama cada cuadro; trabaja cada PASO)
  function actualizar(dt) {
    const est = estado();
    if (!est) return;
    acum += dt;
    if (acum < PASO) return;
    const d = acum; acum = 0;
    const o = local();
    if (!o) {
      if (figuras.some((f) => f.npc || f.tarea)) quitarFiguras();
      // 4.4.2: lo estás moviendo: los gastos del día se cobran igual (antes se congelaban y después se perdonaban más de 7 días)
      const real = localReal();
      if (real && est.tipo) { ponerAlDia(est, P().dia); cobrarDia(est); }
      return;
    }
    prepararTipoSiHaceFalta(o, est);
    if (!est.sitio || est.sitio.x !== o.datos.x || est.sitio.z !== o.datos.z) est.sitio = { x: o.datos.x, z: o.datos.z };   // (para reconocerlo si la aldea lo desarma antes del primer cuadro)
    ponerAlDia(est, P().dia);
    cobrarDia(est);
    sincronizarVista(o, est);
    const tipo = est.tipo;
    if (!tipo) return;
    const dist = distA(o);
    // a la hora, con el local abierto y cerca, las figuras se arman; lejos, se sueltan
    const queArmar = est.abierto && dist < RADIO_FIGURAS;
    if (queArmar && figuras.some((f) => !f.npc)) avanzarArmado();
    // el reloj de juego (un salto —dormir, la siesta— no es tiempo de clientes)
    const abs = P().dia * 24 + (Number(P().horas) || 0);
    let dH = ultimaAbs === null ? 0 : abs - ultimaAbs;
    if (!(dH > 0) || dH > 0.5) dH = 0;
    ultimaAbs = abs;
    const pausa = ui.abierto;
    const libres = figuras.filter((f) => libre(f)).length;
    const presente = dist < (cola.clientes.length ? COLA.radioPartir : COLA.radioAtencion);
    const ev = avanzarCola(cola, est, tipo, pausa ? 0 : d, pausa ? 0 : dH, { hora: Number(P().horas) || 0, dia: P().dia, presente, lluvia: ctx.lluvia?.() || 0, max: cola.clientes.length + libres });
    for (const e of ev) {
      if (e.tipo === 'llega') llega(e.cliente, o);
      else if (e.tipo === 'se-cansa') {
        const f = e.cliente.figura;
        ctx.nota?.(`${etiquetaDe(e.cliente)} se cansó de esperar`, 'Se fue sin comprar: la fama del local baja un poco', false);
        if (f) sale(f, o);
        avisarRep(est);
      } else if (e.tipo === 'parte' || e.tipo === 'extravio') { const f = e.cliente.figura; if (f) sale(f, o, e.tipo === 'extravio'); }
    }
    moverFiguras(d, o);
    // si cerrás o te vas lejos con la gente armada, se sueltan (ni se dibujan)
    if (!est.abierto && enMarcha() === 0) for (const f of figuras) if (f.npc && f.fase === 'libre') f.npc.dormido = true;
  }
  // 4.4.1: los gastos fijos del día (se miran cada 0,25 s, pero sólo cuando cambia el día pasa algo)
  function cobrarDia(est) {
    const r = cobrarGastos(P(), est, P().dia);
    if (!r) return;
    const p = r.pago;
    if (p.ok) {
      const origen = p.deBilletera > 0 ? (p.deCaja > 0 ? `${formatoPesos(p.deCaja)} de la caja y ${formatoPesos(p.deBilletera)} de tu billetera` : 'de tu billetera') : 'de la caja del local';
      ctx.nota?.(`Gastos del local: −${formatoPesos(p.monto)}`, `${TEXTO_GASTOS[0].toUpperCase()}${TEXTO_GASTOS.slice(1)}${r.dias > 1 ? ` de ${r.dias} días` : ''}, ${origen}${p.monto > r.gasto ? '. Incluye lo que debías' : ''}`, false);
      if (r.abrioAhora) ctx.nota?.('Pagaste lo que debías', 'El local vuelve a abrir', true);
    } else {
      ctx.nota?.('No pudiste pagar los gastos del local', `Debés ${formatoPesos(r.deuda)} (${TEXTO_GASTOS}). ${r.cerroAhora ? 'El local cerró solo hasta que pagues: mantené E y «Pagar la deuda»' : 'Un día más sin pagar y el local cierra solo'}`, false);
    }
    ctx.guardar?.(); ctx.refrescarBarra?.();
    if (ui.abierto) dibujar();
  }
  function prepararTipoSiHaceFalta(o, est) {
    // (sólo reacomoda si el tipo guardado no es el de este local y hay algo guardado: el primer uso lo hace la E)
    if (est.tipo && est.tipo !== tipoDePlano(o.plano.id)) prepararTipo(o, est);
  }
  function avisarRep(est) {
    const n = nivelDeRep(est.rep);
    if (repNivelAntes === null) { repNivelAntes = n; return; }
    if (n !== repNivelAntes) {
      ctx.nota?.(n > repNivelAntes ? `Tu local ganó fama: ${nombreDeRep(est.rep)}` : `Tu local perdió fama: ${nombreDeRep(est.rep)}`, n > repNivelAntes ? 'Viene más gente al mostrador' : 'Atendé rápido y tené lo que piden para recuperarla', n > repNivelAntes);
      repNivelAntes = n;
    }
  }

  // ---------------------------------------------------------------- atender (E)
  // `quien`: el nombre de un empleado que atiende por vos (4.4: empleados-negocio-juego.js); sin él, atendés vos
  function atender(c, quien = null) {
    const est = estado(), o = local();
    if (!est || !o) return false;
    c = c || primeroEnLaCola(cola);
    if (!c) return false;
    if (!c.listo) { ctx.nota?.('Todavía viene caminando', 'Esperá a que llegue al mostrador'); return true; }
    const r = despachar(est, c);
    if (!r.ok) { if (quien) return false; ctx.nota?.('La caja no tiene lugar', `Hay ${formatoPesos(est.caja)} adentro y el tope es ${formatoPesos(CAJA_MAX)}. Retirá la plata (mantené E) y seguí atendiendo`); return true; }
    cola.clientes.splice(cola.clientes.indexOf(c), 1);
    const f = c.figura;
    if (f) sale(f, o);
    if (r.nada) {
      ctx.nota?.('Se fue sin comprar', `${quien ? 'No había' : 'No tenías'} nada de lo que pedía (${textoLista(r.faltan)}). Tené los estantes surtidos`, false);
    } else {
      ctx.sonido?.()?.juntar?.();
      const falta = r.faltan.length ? ` ${quien ? 'Faltó' : 'Te faltó'} ${textoLista(r.faltan)}` : '';
      ctx.nota?.(quien ? `${quien} atendió: +${formatoPesos(r.total)} en la caja` : `+${formatoPesos(r.total)} en la caja`, `${quien ? 'Le dio' : 'Le diste'} ${textoLista(r.vendidos)}.${falta}`, true);
    }
    avisarRep(est);
    sincronizarVista(o, est);
    ctx.refrescarBarra?.(); ctx.guardar?.();
    return true;
  }

  // ---------------------------------------------------------------- el panel
  const env = () => ({ tengo: (k) => ctx.tengo(k), quitar: (k, n) => ctx.quitar(k, n), dar: (k, n) => ctx.dar(k, n) });
  function el(tag, clase, texto) { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; }
  function boton(texto, alClic, { activo = true, clase = '', titulo = '' } = {}) {
    const b = el('button', clase, texto);
    b.type = 'button'; b.disabled = !activo;
    if (titulo) b.title = titulo;
    const accion = () => { if (!b.disabled) alClic(); };
    if (ctx.alClic) ctx.alClic(b, accion); else b.addEventListener('click', accion);
    b.addEventListener('keydown', (ev) => { if (ev.code === 'Enter' || ev.code === 'Space') { ev.preventDefault(); ev.stopPropagation(); accion(); } });
    return b;
  }
  function tras(fn) {
    return () => {
      const est = estado(), o = local();
      if (!est || !o) { cerrarPanel(); return; }
      fn(est, o);
      sincronizarVista(o, est);
      avisarRep(est);
      ctx.guardar?.(); ctx.refrescarBarra?.();
      dibujar();
    };
  }
  function dibujar() {
    const raiz = ctx.contenido, est = estado(), o = local();
    if (!raiz || !est || !o) return;
    const tipo = est.tipo || tipoDePlano(o.plano.id), T = TIPOS[tipo];
    const h = ctx.panel?.querySelector?.('h2'); if (h) h.textContent = T.nombre;
    raiz.innerHTML = '';
    if (ui.tip) {
      raiz.append(el('p', 'negocio-tip', 'Surtí los estantes con lo que llevás, fijá los precios y abrí. Los clientes llegan solos mientras estés cerca: atendelos con E. Mantener E vuelve a este panel. Si no estás, no se vende.'));
    }
    const rep = el('div', 'negocio-resumen');
    const barra = el('div', 'negocio-barra'); const relleno = el('i'); relleno.style.width = `${Math.round(est.rep)}%`; barra.append(relleno);
    const l1 = el('div', 'negocio-linea'); l1.append(el('span', '', 'Fama del local'), el('b', '', `${nombreDeRep(est.rep)} · ${Math.round(est.rep)}/100`));
    const l2 = el('div', 'negocio-linea'); l2.append(el('span', '', 'Caja'), el('b', '', `${formatoPesos(est.caja)} de ${formatoPesos(CAJA_MAX)}`));
    const l3 = el('div', 'negocio-linea'); l3.append(el('span', '', 'Hoy'), el('b', '', `${resumenDelDia(est)} · ${formatoPesos(est.hoy.ventas)}`));
    const esperan = Math.round(llegadasPorDia(est, tipo, {}) * 10) / 10;
    const l4 = el('div', 'negocio-linea'); l4.append(el('span', '', 'Con estos estantes y precios'), el('b', '', est.abierto && !cerradoPorDeuda(est) ? `unos ${esperan} clientes por día (de ${HORA_ABRE} a ${HORA_CIERRA} h)` : cerradoPorDeuda(est) ? 'cerrado por la deuda de gastos: no entra nadie' : 'cerrado: no entra nadie'));
    rep.append(l1, barra, l2, l3, l4);
    raiz.append(rep);
    // 4.4.1: gastos fijos, balance, deuda y el pedido al proveedor
    const pres = presupuestoProveedor(est, P(), P().dia);
    const fin = el('div', 'negocio-resumen');
    for (const l of lineasFinanzas(est, tipo, P().dia)) { const li = el('div', 'negocio-linea' + (l.alerta ? ' alerta' : '')); li.append(el('span', '', l.t), el('b', '', l.v)); fin.append(li); }
    const lp = el('div', 'negocio-linea'); lp.append(el('span', '', 'Proveedor'), el('b', '', pres.items.length ? `${textoPedido(pres)} · hoy podés pedir hasta ${formatoPesos(pres.hoyRestante)}` : pres.limite === 'lleno' ? 'los estantes están llenos' : pres.hoyRestante <= 0 ? `ya pediste lo de hoy (tope ${formatoPesos(PROVEEDOR.topeDia)} por día)` : 'no te alcanza la plata para pedir'));
    fin.append(lp);
    raiz.append(fin);
    const acciones = el('div', 'negocio-acciones');
    acciones.append(
      boton(est.abierto ? 'Cerrar el local' : 'Abrir el local', tras((e) => { e.abierto = !e.abierto; if (!e.abierto) for (const c of [...cola.clientes]) { const f = c.figura; cola.clientes.splice(cola.clientes.indexOf(c), 1); if (f) sale(f, local()); } ctx.nota?.(e.abierto ? 'Abriste el local' : 'Cerraste el local', e.abierto ? `Los clientes empiezan a llegar. ${cuantasCosas(e, e.tipo) ? '' : 'Ojo: no tenés nada en los estantes'}${e.fin.activa ? '' : ` Desde mañana paga ${formatoPesos(gastoPorDia(e.tipo))} por día de gastos fijos (${TEXTO_GASTOS}).`}` : 'El cartel dice cerrado: no entra nadie'); }), { clase: est.abierto ? '' : 'principal' }),
      boton(est.caja > 0 ? `Retirar la caja (${formatoPesos(est.caja)})` : 'La caja está vacía', tras((e) => { const m = retirarCaja(P(), e); if (m > 0) { ctx.sonido?.()?.juntar?.(); ctx.nota?.(`Retiraste ${formatoPesos(m)}`, 'Pasaron a tu billetera', true); } }), { activo: est.caja > 0 }),
      boton('Surtir con todo lo que llevás', tras((e) => { const puesto = surtirTodo(e, env()); if (puesto.length) { ctx.sonido?.()?.juntar?.(); ctx.nota?.('Surtiste los estantes', textoLista(puesto), true); } else ctx.nota?.('No hay qué poner', 'No llevás nada de lo que vende este local, o los estantes ya están llenos'); })),
      boton('Sacar toda la mercadería', tras((e) => { const sacado = []; for (const k of Object.keys(e.stock)) { const n = sacarDelEstante(e, k); if (n > 0) { ctx.dar(k, n); sacado.push({ k, n }); } } if (sacado.length) ctx.nota?.('Sacaste la mercadería', textoLista(sacado)); }), { activo: unidadesSacables(est) > 0, titulo: unidadesEnEstantes(est) > unidadesSacables(est) ? 'Lo que pediste al proveedor se vende, pero no se saca del estante' : '' }),
      boton(pres.items.length ? `Pedir al proveedor (${formatoPesos(pres.total)})` : 'Pedir al proveedor', tras((e) => {
        const r = pedirAlProveedor(P(), e, P().dia);
        if (r.ok) { ctx.sonido?.()?.juntar?.(); ctx.nota?.(`Pedido al proveedor: −${formatoPesos(r.total)}`, `${textoLista(r.items)}. Son ${formatoPesos(r.plaza)} de mercado y ${formatoPesos(r.recargo)} de recargo${r.deBilletera > 0 ? (r.deCaja > 0 ? `. Salió ${formatoPesos(r.deCaja)} de la caja y ${formatoPesos(r.deBilletera)} de tu billetera` : '. Salió de tu billetera') : '. Salió de la caja del local'}`, false); }
        else ctx.nota?.('No se pudo pedir', r.motivo === 'lleno' ? 'Los estantes ya están llenos' : r.motivo === 'tope' ? `Hoy ya pediste lo máximo (${formatoPesos(PROVEEDOR.topeDia)}). Mañana se puede de nuevo` : 'No te alcanza la plata entre la caja y la billetera');
      }), { activo: pres.items.length > 0, titulo: pres.items.length ? textoPedido(pres) : 'Surte los estantes pagando el precio de mercado más un recargo' }),
      ...(hayDeuda(est) ? [boton(`Pagar la deuda (${formatoPesos(est.fin.deuda)})`, tras((e) => {
        const r = pagarDeudaAMano(P(), e);
        if (r.ok) { ctx.sonido?.()?.juntar?.(); ctx.nota?.(`Pagaste la deuda: −${formatoPesos(r.monto)}`, r.abrioAhora ? 'El local vuelve a abrir' : 'Al día con los gastos', true); }
        else ctx.nota?.('No te alcanza para la deuda', `Debés ${formatoPesos(r.debe)} y entre la caja y la billetera faltan ${formatoPesos(r.falta)}`, false);
      }), { clase: cerradoPorDeuda(est) ? 'principal' : '', activo: est.caja + P().economia.pesos >= est.fin.deuda })] : []),
    );
    raiz.append(acciones);
    const lista = el('div', 'negocio-lista');
    const cab = el('div', 'negocio-fila negocio-cab'); cab.append(el('span', '', 'Producto'), el('span', '', 'Estante'), el('span', '', 'Surtir'), el('span', '', 'Precio de cada uno'));
    lista.append(cab);
    for (const f of filasDelPanel(est, tipo, { tengo: (k) => ctx.tengo(k) })) {
      const fila = el('div', 'negocio-fila' + (f.hay === 0 ? ' vacio' : ''));
      const nom = el('span', 'negocio-nom'); nom.append(el('b', '', f.nombre), el('i', '', `llevás ${f.enMano} · plaza ${formatoPesos(f.plaza)}`));
      const cantidad = el('span', 'negocio-cant', f.hay === 0 ? `vacío (cabe ${f.tope})` : `${f.hay} de ${f.tope}${f.prov > 0 ? ` · ${f.prov} del proveedor` : ''}`);
      const surtido = el('span', 'negocio-surtir');
      surtido.append(
        boton(`+${f.lote}`, tras((e) => { const n = surtir(e, f.k, f.lote, env()); if (n) ctx.sonido?.()?.juntar?.(); else ctx.nota?.('No se pudo surtir', f.enMano <= 0 ? `No llevás ${nombreUnidad(f.k, 2)}` : 'El estante ya está lleno'); }), { activo: f.enMano > 0 && f.hay < f.tope, titulo: `Dejar ${f.lote} en el estante` }),
        boton('Llenar', tras((e) => { const n = surtir(e, f.k, 1e5, env()); if (n) ctx.sonido?.()?.juntar?.(); }), { activo: f.enMano > 0 && f.hay < f.tope, titulo: 'Dejar todo lo que llevás, hasta el tope' }),
        boton('Sacar', tras((e) => { const n = sacarDelEstante(e, f.k); if (n) ctx.dar(f.k, n); }), { activo: f.hay - f.prov > 0, titulo: f.prov > 0 ? 'Volver a guardar lo tuyo (lo del proveedor se queda en el estante)' : 'Volver a guardar lo del estante' }),
      );
      const precios = el('span', 'negocio-precios');
      NIVELES.forEach((nv, i) => precios.append(boton(`${nv.nombre} ${formatoPesos(precioDe(f.k, i))}`, tras((e) => { ponerPrecio(e, f.k, i); }), { clase: i === f.nivel ? 'marcado' : '', titulo: `${nv.nombre}: ${i === 0 ? 'viene más gente y la fama sube más' : i === 1 ? 'el equilibrio' : 'viene menos gente, ganás más por cada uno'}` })));
      fila.append(nom, cantidad, surtido, precios);
      lista.append(fila);
    }
    raiz.append(lista);
    ctx.extraPanel?.(raiz, est);   // 4.4: la sección de los empleados (empleados-negocio-juego.js)
    const pie = el('div', 'negocio-pie');
    pie.append(boton('Todo en precio normal', tras((e) => { for (const k of catalogo(e.tipo)) ponerPrecio(e, k, 1); })), boton('Todo barato', tras((e) => { for (const k of catalogo(e.tipo)) ponerPrecio(e, k, 0); })), boton('Todo caro', tras((e) => { for (const k of catalogo(e.tipo)) ponerPrecio(e, k, 2); })), boton('Listo', () => cerrarPanel()));
    raiz.append(pie);
  }
  const precioDe = (k, i) => precioUnidad(k, i);
  function abrirPanel(o) {
    const est = estado();
    if (!est || !o) return false;
    prepararTipo(o, est);
    ui.abierto = true;
    dibujar();
    ctx.panel?.classList.remove('oculto');
    return true;
  }
  function cerrarPanel() {
    if (!ui.abierto) return;
    ui.abierto = false; ui.tip = false;
    ctx.panel?.classList.add('oculto');
    ctx.guardar?.();
  }

  // ---------------------------------------------------------------- lo que usa main.js
  const aviso = (o) => {
    const est = estado();
    if (!est) return null;
    if (!esActivo(o)) return 'Ya tenés otro local: éste no atiende';
    const tipo = tipoDePlano(o.plano.id);
    return avisoDelLocal(est, tipo, cola, Number(P().horas) || 0);
  };
  function usar(o, soloPanel = false) {
    const est = estado();
    if (!est) { ctx.nota?.('El local es del Relax', 'En La noche de los duendes no hay negocio'); return true; }
    if (!esActivo(o)) { ctx.nota?.('Ya tenés otro local', 'Sólo atiende el primero que armaste. Desarmá uno si querés cambiar'); return true; }
    if (!soloPanel && primeroEnLaCola(cola)) return atender();
    abrirPanel(o);
    return true;
  }
  // (cualquiera de las tres figuras: el que ya se está yendo con su compra tampoco se puede parar a charlar: E sigue siendo atender)
  const esCliente = (npc) => !!npc && !!npc.clienteNegocio && figuras.some((f) => f.npc === npc);
  const avisoCliente = (npc) => {
    const f = figuras.find((x) => x.npc === npc);
    if (!f) return 'Hablar';
    if (f.cliente) return f.cliente.listo ? `Atender: ${textoLista(f.cliente.pide)}` : `${etiquetaDe(f.cliente)} viene al mostrador`;
    const sig = primeroEnLaCola(cola);
    return sig ? `Atender: ${textoLista(sig.pide)}` : 'Se va con su compra';
  };
  function atenderA(npc) { const f = figuras.find((x) => x.npc === npc); return f ? atender(f.cliente || undefined) : false; }
  // Al desarmar una obra (la llama devolverContenido de main.js con los datos de la obra): si era el local activo, todo vuelve a vos
  function alDesarmar(d) {
    const est = estado();
    if (!est || !d || !esLocal(d.plano)) return '';
    // 4.4.2: ¿es el local activo? Con la caché puesta, por identidad; sin ella (partida recién cargada, el desalojo de la aldea desarma antes del primer cuadro)
    // por el lugar que el estado se acuerda (`sitio`), o, si no lo trae, sólo si no hay ningún otro local en pie. Antes, sin caché, CUALQUIER local cerraba la cuenta.
    let activo;
    if (cacheLocal) activo = cacheLocal.datos === d;
    else if (est.sitio) activo = Math.abs(est.sitio.x - d.x) < 0.5 && Math.abs(est.sitio.z - d.z) < 0.5;
    else { const otro = localReal(); activo = !otro || otro.datos === d; }
    if (!activo) return '';
    const r = cerrarLocal(P(), est, (k, n) => ctx.dar(k, n));
    quitarFiguras();
    cacheLocal = null; cacheHasta = 0;
    const partes = [];
    const deuda = r.deuda > 0 ? (r.deudaPagada ? ` Pagaste los ${formatoPesos(r.deuda)} que debías de gastos.` : ` Los ${formatoPesos(r.deuda)} que debías de gastos se perdonaron.`) : '';
    if (r.devuelto.length) partes.push(textoLista(r.devuelto));
    const perdido = r.sinDevolver > 0 ? ` Lo que le pediste al proveedor (${r.sinDevolver}) se quedó en el local.` : '';
    if (r.plata > 0) partes.push(formatoPesos(r.plata));
    if (partes.length || deuda || perdido) ctx.nota?.('Cerró tu local', `${partes.length ? `Volvió a vos: ${partes.join(' y ')}. ` : ''}La fama que te hiciste, se queda.${deuda}${perdido}`, true);
    ui.abierto = false; ctx.panel?.classList.add('oculto');
    return partes.join(' · ');
  }

  return {
    ids: IDS_LOCALES, esLocal, esActivo, local, localReal, aviso, usar, atender, atenderA, esCliente, avisoCliente, actualizar, alDesarmar,
    panelAbierto: () => ui.abierto, cerrarPanel, abrirPanel, redibujar: () => { if (ui.abierto) dibujar(); },
    // 4.4: lo que necesitan los empleados (el estado, la cola, dónde está el local y a cuánto estás)
    cola, estado, distancia: distA, aMundo, medidas,
    // para las pruebas: ver y empujar lo que hace el juego sin esperar horas de juego
    __cola: cola, __figuras: figuras, __estado: estado,
    __llegar: (semilla = 1, hora = 12) => {
      const est = estado(), o = local();
      if (!est || !o || !est.tipo) return null;
      const c = armarCliente(est, est.tipo, `forzado|${semilla}`, hora);
      if (!c || !figuraPara(c)) return null;
      cola.clientes.push(c); est.hoy.clientes++; est.total.clientes++;
      llega(c, o);
      return c;
    },
    __armarTodo: () => { for (let i = 0; i < 40 && figuras.some((f) => !f.npc); i++) avanzarArmado(); return figuras.filter((f) => f.npc).length; },
  };
}
