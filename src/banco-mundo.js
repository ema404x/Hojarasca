// 3.8.8 · Economía, Fases 3b y 5: el mostrador del banco del pueblo. DOM, sin three: las reglas están en `prestamos.js` (préstamos y
// abastecimiento) y `propiedad.js` (casas, alquileres y el puesto en la feria). Lo atiende el gerente, Amadeo Lezcano. Cuatro
// solapas: Préstamos, Abastecimiento, Casas y Mi puesto. Sólo en el Relax.
import { BIENES } from './comercio.js';
import { formatoPesos, pesosDe, hayEconomia } from './economia.js';
import { negociosDe } from './negocios.js';
import { lineaDeSolapa, comentarioDe } from './banco-voces.js';
import { tengoDe } from './pedidos.js';
import {
  BANCO, GERENTE, nivelBanco, topeDe, prestamoDe, costoEstimado, puedePedir, pedirPrestamo, pagarPrestamo, diasParaVencer,
  abastoDe, puedeAbastecer, cumplirAbasto, textoAbasto, efectosDeAbasto,
} from './prestamos.js';
import {
  PROPIEDAD, precioCasa, casasDe, enAlquilerDe, ponerEnAlquiler, retirarDeAlquiler, rentaDe, tienePuesto, comprarPuesto, lotesEnPuesto, totalEnPuesto,
  dejarEnPuesto, sacarDelPuesto, retirarCajaPuesto, precioDeConsigna,
} from './propiedad.js';

export const SOLAPAS = ['prestamos', 'abasto', 'casas', 'puesto'];
const TITULO = { prestamos: 'Préstamos', abasto: 'Abastecimiento', casas: 'Casas y alquiler', puesto: 'Mi puesto' };
export const MONTOS = [500, 1000, 2000, 3000, 5000, 8000, 10000, 15000];
export const PLAZOS = [6, 9, 12];
const NOMBRES_CASA = { 'cabana-piedra': 'Cabaña de tablas y piedra', 'casa-galeria': 'Casa con galería', casona: 'Casona de dos cuartos' };
const NIVELES = ['Recién llegado', 'Cliente', 'De confianza', 'Socio del pueblo'];

// `ctx`: { panel, contenido, progreso(), dia(), nota(t, sub, importante), guardar(), refrescar(), T_(texto), sonido, alClic(el, fn) }
export function crearBancoMundo(ctx) {
  const T_ = ctx.T_ || ((t) => t);
  const estado = { abierto: false, solapa: 'prestamos', plazo: 12, n: 0, comentario: '' };   // (3.9.2: `n` cuántas veces se abrió el mostrador; `comentario` lo último que dijo el gerente)
  const dicho = (evento) => { estado.comentario = `${GERENTE}: «${comentarioDe(evento, { dia: dia(), n: estado.n })}»`; };
  const P = () => ctx.progreso();
  const dia = () => Math.max(1, Math.floor(P().dia || 1));

  // ------------------------------------------------ lo que llevás
  function sumar(bien, n) {
    const b = BIENES[bien], p = P();
    if (b.donde === 'material') { p.materiales = p.materiales || {}; p.materiales[bien] = Math.max(0, (p.materiales[bien] || 0) + n); }
    else if (b.donde === 'cosa') { p.cosas = p.cosas || {}; p.cosas[bien] = Math.max(0, (p.cosas[bien] || 0) + n); }
    else { const e = p.entradas?.[bien]; if (e) e.cantidad = Math.max(0, (e.cantidad || 0) + n); }
  }
  const minuscula = (bien) => BIENES[bien].nombre.toLowerCase();

  // ------------------------------------------------ los elementos
  function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = T_(texto);
    return e;
  }
  function boton(texto, alClic, { activo = true, clase = '' } = {}) {
    const b = el('button', clase, texto);
    b.type = 'button';
    b.disabled = !activo;
    const accion = () => { if (!b.disabled) alClic(); };
    if (ctx.alClic) ctx.alClic(b, accion); else b.addEventListener('click', accion);   // en el juego, el clic va por el HUD (mousedown)
    b.addEventListener('keydown', (ev) => { if (ev.code === 'Enter' || ev.code === 'Space') { ev.preventDefault(); ev.stopPropagation(); accion(); } });   // y con el teclado (Tab para pasar de un botón al otro)
    return b;
  }
  const renglon = (a, b) => { const r = el('div', 'banco-renglon'); r.append(el('span', '', a), el('b', '', b)); return r; };

  // ------------------------------------------------ cada solapa
  function solapaPrestamos(cont) {
    const p = P(), pr = prestamoDe(p), d = dia();
    const nivel = nivelBanco(p);
    cont.append(renglon('Confianza del banco', NIVELES[nivel]), renglon('Lo máximo que te presta', formatoPesos(topeDe(p))));
    if (pr) {
      const vence = diasParaVencer(p, d);
      cont.append(renglon('Debés', formatoPesos(pr.debe)), renglon('Pediste', `${formatoPesos(pr.monto)} el día ${pr.dia}`),
        renglon('Interés', `${Math.round(pr.tasa * 100)} % por día`),
        renglon(vence >= 0 ? 'Vence' : 'Venció', vence > 1 ? `el día ${pr.hasta} (en ${vence} días)` : vence === 1 ? 'mañana' : vence === 0 ? 'hoy' : `hace ${-vence} días`));
      if (vence < 0) cont.append(el('p', 'banco-aviso', 'Pasó el plazo: el interés subió y el banco no te presta hasta que lo saldes.'));
      const fila = el('div', 'banco-acciones');
      for (const m of [500, 1000, 2000]) if (m < pr.debe) fila.append(boton(`Pagar ${formatoPesos(m)}`, () => pagar(m), { activo: pesosDe(p) >= m }));
      fila.append(boton(`Saldar todo (${formatoPesos(pr.debe)})`, () => pagar(pr.debe), { activo: pesosDe(p) >= pr.debe }));
      cont.append(fila);
      return;
    }
    cont.append(el('p', 'banco-texto', `${GERENTE}: «Te presto a ${Math.round(BANCO.tasa * 100)} % por día sobre lo que debas. Un año del pueblo son 12 días. Pagás cuando puedas; si te pasás del plazo, el interés sube y dejo de prestarte hasta que saldes.»`));
    const plazo = el('div', 'banco-acciones');
    plazo.append(el('span', '', 'Plazo:'));
    for (const z of PLAZOS) plazo.append(boton(`${z} días`, () => { estado.plazo = z; dibujar(); }, { clase: estado.plazo === z ? 'marcada' : '' }));
    cont.append(plazo);
    const fila = el('div', 'banco-acciones');
    for (const m of MONTOS.filter((x) => x <= topeDe(p))) {
      const b = boton(`${formatoPesos(m)} · devolvés ${formatoPesos(costoEstimado(m, estado.plazo))}`, () => pedir(m), { activo: puedePedir(p, d, m, estado.plazo).ok });
      fila.append(b);
    }
    cont.append(fila);
    if (nivel < BANCO.topes.length - 1) cont.append(el('p', 'banco-pie', `Si devolvés a tiempo y cumplís con el abastecimiento, el banco te presta más (hasta ${formatoPesos(BANCO.topes[nivel + 1])}).`));
  }
  function pedir(m) {
    const r = pedirPrestamo(P(), dia(), m, estado.plazo);
    if (!r.ok) { ctx.nota('El banco no te presta ahora', r.motivo === 'tope' ? `El tope es ${formatoPesos(r.tope)}` : r.motivo === 'debe' ? 'Primero saldá lo que debés' : r.motivo === 'atraso' ? 'Primero saldá lo atrasado' : 'Revisá el monto y el plazo'); return; }
    ctx.sonido?.juntar?.();
    ctx.nota(`Te prestaron ${formatoPesos(r.monto)}`, `Hay que devolverlos hasta el día ${r.hasta}. El interés corre todos los días`, true);
    dicho('prestamo'); ctx.guardar(); ctx.refrescar?.(); dibujar();
  }
  function pagar(m) {
    const r = pagarPrestamo(P(), dia(), m);
    if (!r.ok) { ctx.nota('No se pudo pagar', r.motivo === 'plata' ? 'No te alcanza la plata' : 'Revisá el monto'); return; }
    ctx.sonido?.juntar?.();
    ctx.nota(r.saldado ? 'Saldaste el préstamo' : `Pagaste ${formatoPesos(r.pagado)}`, r.saldado ? 'El banco te tiene más confianza si fue a tiempo' : `Te quedan por pagar ${formatoPesos(r.resta)}`, r.saldado);
    dicho(r.saldado ? 'saldado' : 'pago'); ctx.guardar(); ctx.refrescar?.(); dibujar();
  }

  function solapaAbasto(cont) {
    const p = P(), d = dia();
    cont.append(el('p', 'banco-texto', `${GERENTE}: «El banco consigue cosas para sus clientes y las paga por encima del mercado: de un 25 a un 40 % más, según la confianza. Es un pedido por vez, cada dos días.»`));
    const a = abastoDe(p, d);
    if (!a) { cont.append(el('p', 'banco-aviso', 'Ya cumpliste el pedido de estos días. Volvé en un rato: el banco siempre necesita algo.')); return; }
    cont.append(renglon('El banco necesita', textoAbasto(a)), renglon('Tenés', `${tengoDe(p, a.k)} de ${a.n}`), renglon('Prima sobre el mercado', `${Math.round((a.prima - 1) * 100)} %`));
    const v = puedeAbastecer(p, d);
    if (v.motivo === 'atraso') cont.append(el('p', 'banco-aviso', 'Con el préstamo vencido el banco no te contrata: saldalo primero.'));
    cont.append(boton('Entregar el pedido', entregarAbasto, { activo: v.ok }));
  }
  function entregarAbasto() {
    const p = P(), a = abastoDe(p, dia());
    const r = a ? puedeAbastecer(p, dia()) : { ok: false };
    if (!r.ok) { ctx.nota('Todavía no', 'Te falta lo que pide el banco'); return; }
    const c = cumplirAbasto(p, dia());   // (revisa que lo tengas y cobra); después se saca de la mochila
    if (!c.ok) { ctx.nota('No se pudo', 'Probá de nuevo'); return; }
    for (const f of efectosDeAbasto(a)) sumar(f.k, f.n);
    ctx.sonido?.juntar?.();
    ctx.nota(`El banco te pagó ${formatoPesos(c.premio)}`, `Abastecimiento cumplido: ${minuscula(a.k)}`, true);
    dicho('abasto'); ctx.guardar(); ctx.refrescar?.(); dibujar();
  }

  function solapaCasas(cont) {
    const p = P();
    cont.append(el('p', 'banco-texto', `${GERENTE}: «Una casa nueva cuesta los materiales más el terreno y la mano de obra, que se pagan por etapa. Las que no uses, ponelas en alquiler: una familia se queda y paga todos los días.»`));
    for (const id of Object.keys(PROPIEDAD.casas)) {
      const tengo = casasDe(p, id), alq = enAlquilerDe(p, id);
      const caja = el('div', 'banco-casa');
      caja.append(el('h4', '', NOMBRES_CASA[id]), renglon('Terreno y mano de obra', formatoPesos(precioCasa(id))), renglon('Renta por día', formatoPesos(rentaDe(id))),
        renglon('Levantadas', String(tengo)), renglon('En alquiler', String(alq)));
      const fila = el('div', 'banco-acciones');
      fila.append(boton('Poner en alquiler', () => alquilar(id), { activo: tengo > alq }), boton('Retirar del alquiler', () => retirar(id), { activo: alq > 0 }));
      caja.append(fila);
      cont.append(caja);
    }
    const cobrado = negociosDe(p).casas.cobrado;
    cont.append(renglon('Alquileres cobrados en total', formatoPesos(cobrado)));
  }
  function alquilar(id) {
    const r = ponerEnAlquiler(P(), id, dia());
    if (!r.ok) { ctx.nota('No se puede', 'Necesitás una casa terminada que no esté ya alquilada'); return; }
    ctx.nota(`Alquilaste ${NOMBRES_CASA[id].toLowerCase()}`, `${r.inquilino} se instala: ${formatoPesos(r.renta)} por día`, true);
    dicho('alquiler'); ctx.guardar(); dibujar();
  }
  function retirar(id) {
    if (retirarDeAlquiler(P(), id).ok) { ctx.nota('Retiraste el alquiler', NOMBRES_CASA[id]); ctx.guardar(); dibujar(); }
  }

  function solapaPuesto(cont) {
    const p = P();
    if (!tienePuesto(p)) {
      cont.append(el('p', 'banco-texto', `${GERENTE}: «Un puesto propio en la feria: dejás mercadería en consigna y cada día se venden hasta ${PROPIEDAD.puesto.lotesPorDia} lotes, al valor de la plaza menos el ${Math.round(PROPIEDAD.puesto.comision * 100)} % del puesto. Cuesta ${formatoPesos(PROPIEDAD.puesto.precio)}.»`));
      cont.append(boton(`Comprar el puesto (${formatoPesos(PROPIEDAD.puesto.precio)})`, comprar, { activo: pesosDe(p) >= PROPIEDAD.puesto.precio }));
      return;
    }
    const pu = negociosDe(p).casas.puesto;
    cont.append(renglon('Caja del puesto', formatoPesos(pu.caja)), renglon('Lotes en consigna', `${totalEnPuesto(p)}`));
    cont.append(boton(`Retirar la caja (${formatoPesos(pu.caja)})`, retirarCaja, { activo: pu.caja > 0 }));
    const lista = el('div', 'banco-lista');
    const bienes = Object.keys(BIENES).filter((b) => tengoDe(p, b) >= BIENES[b].lote || lotesEnPuesto(p, b) > 0);
    if (!bienes.length) lista.append(el('p', 'banco-pie', 'No llevás nada para dejar en consigna.'));
    for (const b of bienes) {
      const f = el('div', 'banco-fila');
      f.append(el('span', '', `${BIENES[b].nombre} (${BIENES[b].lote} por lote)`), el('i', '', `${formatoPesos(precioDeConsigna(b))} el lote · en consigna ${lotesEnPuesto(p, b)} · llevás ${tengoDe(p, b)}`));
      f.append(boton('Dejar 1 lote', () => dejar(b), { activo: tengoDe(p, b) >= BIENES[b].lote }), boton('Sacar 1 lote', () => sacar(b), { activo: lotesEnPuesto(p, b) > 0 }));
      lista.append(f);
    }
    cont.append(lista);
  }
  function comprar() {
    const r = comprarPuesto(P(), dia());
    if (!r.ok) { ctx.nota('No te alcanza la plata', `Cuesta ${formatoPesos(PROPIEDAD.puesto.precio)}`); return; }
    ctx.sonido?.juntar?.();
    ctx.nota('Tenés tu puesto en la feria', 'Dejá mercadería en consigna: se vende todos los días', true);
    dicho('puesto'); ctx.guardar(); ctx.refrescar?.(); dibujar();
  }
  function dejar(b) {
    const r = dejarEnPuesto(P(), b, 1);
    if (!r.ok) { ctx.nota('No se puede dejar', r.motivo === 'lleno' ? 'El puesto no tiene más lugar para eso' : r.motivo === 'tipos' ? 'El puesto ya tiene muchas clases de cosas' : 'No llevás suficiente'); return; }
    sumar(b, -r.unidades); ctx.guardar(); ctx.refrescar?.(); dibujar();
  }
  function sacar(b) {
    if (ctx.cabeJuntar && !ctx.cabeJuntar(b, 1)) return;   // 4.7 carga: lo de la consigna sale sólo si entra en la mochila (si no, sigue en el puesto)
    const r = sacarDelPuesto(P(), b, 1);
    if (r.ok) { sumar(b, r.unidades); ctx.guardar(); ctx.refrescar?.(); dibujar(); }
  }
  function retirarCaja() {
    const r = retirarCajaPuesto(P());
    if (!r.ok) return;
    ctx.sonido?.juntar?.();
    ctx.nota(`Retiraste ${formatoPesos(r.monto)}`, 'Las ventas de tu puesto', true);
    dicho('caja'); ctx.guardar(); ctx.refrescar?.(); dibujar();
  }

  // ------------------------------------------------ el panel
  const SOLAPA = { prestamos: solapaPrestamos, abasto: solapaAbasto, casas: solapaCasas, puesto: solapaPuesto };
  function dibujar() {
    const raiz = ctx.contenido;
    raiz.innerHTML = '';
    if (!hayEconomia(P())) { raiz.append(el('p', 'banco-texto', 'El banco todavía no abre para esta partida.')); return; }
    raiz.append(el('p', 'banco-saldo', `Tenés ${formatoPesos(pesosDe(P()))}`));
    const tabs = el('div', 'banco-solapas');
    for (const s of SOLAPAS) tabs.append(boton(TITULO[s], () => { estado.solapa = s; estado.comentario = ''; dibujar(); }, { clase: estado.solapa === s ? 'marcada' : '' }));
    raiz.append(tabs);
    // 3.9.2: Amadeo comenta: lo último que hiciste o, si no, algo de la solapa según tus deudas y tus negocios
    raiz.append(el('p', 'banco-texto', estado.comentario || lineaDeSolapa(estado.solapa, P(), { dia: dia(), n: estado.n })));
    const cont = el('div', 'banco-cuerpo');
    SOLAPA[estado.solapa](cont);
    raiz.append(cont);
  }
  function abrir(solapa = null) {
    if (solapa && SOLAPAS.includes(solapa)) estado.solapa = solapa;
    estado.abierto = true; estado.n++; estado.comentario = '';
    dibujar();
    ctx.panel.classList.remove('oculto');
  }
  function cerrar() { estado.abierto = false; ctx.panel.classList.add('oculto'); }
  return { abrir, cerrar, dibujar, abierto: () => estado.abierto, estado };
}
