// 2.9: el puesto de cargas de cada parada (el panel para comprar, vender y tomar fletes)
// y el tablero de la cabina cuando manejás la trochita. DOM, sin three: las reglas están
// en `comercio.js` y la física de la cabina en `maquinista.js`.
//
// Lo que se compra y se vende es lo que llevás encima (materiales, lo del cuaderno y las
// cosas que se cuentan), y se paga en yerba, como en el almacén. Sólo en el Relax.
import { BIENES, bienesDe, perfilDe, precios, comprar, vender, comercioDeHoy, fletesDelDia, tomarFlete, soltarFlete, entregarFletes, textoFlete, COMERCIO } from './comercio.js';
import { kmh, CABINA } from './maquinista.js';

export const MODOS_PUESTO = ['comprar', 'vender', 'fletes'];
const TITULO = { comprar: 'Comprar', vender: 'Vender', fletes: 'Fletes' };
const NOMBRE_TEMPORADA = { verano: 'verano', otono: 'otoño', invierno: 'invierno' };

// `ctx`: { panel, tablero, tren, progreso(), dia(), temporada(), nota(t, sub, importante),
//          sonido, guardar(), refrescar(), T_(texto), furgon() }
// (3.7.3: `furgon()`: con el furgón de carga enganchado al tren, { extra, aLaVez }: más fletes por día y a la vez)
export function crearPuestoDeCargas(ctx) {
  const T_ = ctx.T_ || ((t) => t);
  const estado = { abierto: false, parada: null, modo: 'comprar' };
  const P = () => ctx.progreso();
  const estaciones = () => ctx.tren.paradas.map((p) => p.nombre);
  const extraFletes = () => ctx.furgon?.()?.extra || 0;
  const aLaVez = () => ctx.furgon?.()?.aLaVez || COMERCIO.fletesALaVez;
  function comercio() {
    const p = P();
    p.comercio = comercioDeHoy(p.comercio, ctx.dia());
    return p.comercio;
  }

  // ------------------------------------------------ lo que llevás
  function tengo(bien) {
    const b = BIENES[bien], p = P();
    if (!b) return 0;
    if (b.donde === 'material') return p.materiales?.[bien] || 0;
    if (b.donde === 'cosa') return p.cosas?.[bien] || 0;
    return p.entradas?.[bien]?.cantidad || 0;
  }
  // Lo del cuaderno se compra sólo si ya lo conocés (comprarlo no lo anota por vos).
  const conocido = (bien) => BIENES[bien].donde !== 'entrada' || !!P().entradas?.[bien];
  function sumar(bien, n) {
    const b = BIENES[bien], p = P();
    if (b.donde === 'material') { p.materiales = p.materiales || {}; p.materiales[bien] = Math.max(0, (p.materiales[bien] || 0) + n); }
    else if (b.donde === 'cosa') { p.cosas = p.cosas || {}; p.cosas[bien] = Math.max(0, (p.cosas[bien] || 0) + n); }
    else { const e = p.entradas?.[bien]; if (e) e.cantidad = Math.max(0, (e.cantidad || 0) + n); }
  }
  const yerba = () => P().cosas?.yerba || 0;
  function cobrar(n) {
    const p = P();
    p.cosas = p.cosas || {};
    p.cosas.yerba = Math.max(0, (p.cosas.yerba || 0) + n);
  }
  const minuscula = (bien) => BIENES[bien].nombre.toLowerCase();
  // 3.8.3: lo que va de a uno, en singular (decía «Compraste 1 ponchos», «1 frascos de miel»)
  const UNO = { cristal: 'un cristal', miel: 'un frasco de miel', 'trucha-ahumada': 'una trucha ahumada', 'frasco-frutilla': 'un frasco de dulce', 'calafate-seco': 'un puñado de calafates secos', 'hongos-secos': 'un llao llao seco', poncho: 'un poncho' };
  const cuantos = (bien, n) => (n === 1 && Object.hasOwn(UNO, bien) ? UNO[bien] : `${n} ${minuscula(bien)}`);

  // ------------------------------------------------ las filas de cada modo
  function filas() {
    const nombre = estado.parada?.nombre;
    if (!nombre) return [];
    const c = comercio(), dia = ctx.dia(), t = ctx.temporada();
    if (estado.modo === 'fletes') {
      const ofrecidos = fletesDelDia(dia, estaciones(), nombre, extraFletes()).map((f) => {
        const tx = textoFlete(f);
        const tomado = c.hoy.tomados.includes(f.id);
        return { flete: f, titulo: `${f.tipo === 'pasajeros' ? 'Pasajeros' : 'Carga'}: ${tx.quien}`, detalle: `hasta ${tx.hasta} · pagan ${tx.paga}`, marca: tomado ? 'tomado' : c.fletes.length >= aLaVez() ? 'llevás muchos' : 'tomar', clase: tomado ? 'hecho' : c.fletes.length >= aLaVez() ? 'falta' : '' };
      });
      const llevas = c.fletes.map((f) => {
        const tx = textoFlete(f);
        return { soltar: f.id, titulo: `Llevás: ${tx.quien}`, detalle: `hasta ${tx.hasta} · ${tx.paga}`, marca: 'soltar', clase: 'hecho' };
      });
      return [...ofrecidos, ...llevas].slice(0, 9);
    }
    const lista = bienesDe(nombre).filter((b) => estado.modo === 'vender' || conocido(b));
    return lista.map((bien) => {
      const p = precios(c, nombre, bien, dia, t);
      const hay = tengo(bien);
      if (estado.modo === 'comprar') {
        const clase = p.quedanCompra <= 0 ? 'falta' : yerba() < p.compra ? 'falta' : '';
        const marca = p.quedanCompra <= 0 ? 'no queda hoy' : `${yerba() < p.compra ? 'no alcanza' : 'se puede'} · tenés ${hay}`;
        return { bien, titulo: `${BIENES[bien].nombre} ×${p.lote}`, detalle: `${p.compra} de yerba`, marca, clase };
      }
      const clase = p.quedanVenta <= 0 || hay < p.lote ? 'falta' : '';
      const marca = p.quedanVenta <= 0 ? 'hoy ya no compran' : `tenés ${hay}`;
      return { bien, titulo: `${BIENES[bien].nombre} ×${p.lote}`, detalle: `te dan ${p.venta} de yerba`, marca, clase };
    });
  }

  // ------------------------------------------------ el panel
  const $$ = (sel) => ctx.panel?.querySelector(sel);
  function dibujar() {
    if (!estado.abierto || !ctx.panel) return;
    const nombre = estado.parada.nombre;
    $$('.quien').textContent = T_(`Cargas · ${nombre} · ${TITULO[estado.modo]}`);
    const c = comercio();
    const intro = estado.modo === 'fletes'
      ? `Pasajeros y carga hasta otra parada. Se cobran al llegar manejando la trochita · llevás ${c.fletes.length} de ${aLaVez()}`
      : `${perfilDe(nombre).quien} · tenés ${yerba()} de yerba · precios de ${NOMBRE_TEMPORADA[ctx.temporada()] || 'verano'}`;
    $$('.dicho').textContent = T_(intro);
    const ul = $$('ul');
    ul.innerHTML = '';
    filas().forEach((f, i) => {
      const li = document.createElement('li');
      li.className = f.clase || '';
      const b = document.createElement('b'); b.textContent = `${i + 1}. ${T_(f.titulo)}`;
      const span = document.createElement('span'); span.textContent = ` — ${T_(f.detalle)}`;
      const marca = document.createElement('i'); marca.textContent = T_(f.marca);
      li.append(b, span, marca);
      // 3.6.2: mousedown, como el menú de la charla (el click no llegaba y el clic seguía de largo al juego)
      // (3.8.4: con el de main.js, que además pone la marca del mando en la opción del clic)
      if (ctx.alClic) ctx.alClic(li, () => elegir(i));
      else li.addEventListener('mousedown', (ev) => { if (ev.button !== 0) return; ev.preventDefault(); ev.stopPropagation(); elegir(i); });
      ul.appendChild(li);
    });
    if (!ul.children.length) {
      const li = document.createElement('li'); li.className = 'falta';
      li.textContent = T_(estado.modo === 'comprar' ? 'Por ahora no tienen nada que te sirva' : 'Nada por acá');
      ul.appendChild(li);
    }
    $$('.seguir').textContent = T_(`Tab: comprar, vender o fletes · Elegí con el número o con un clic · Escape para salir`);
  }
  function abrir(parada, modo = 'comprar') {
    if (!parada) return false;
    estado.abierto = true; estado.parada = parada; estado.modo = MODOS_PUESTO.includes(modo) ? modo : 'comprar';
    ctx.panel?.classList.remove('oculto');
    dibujar();
    return true;
  }
  function cerrar() {
    estado.abierto = false;
    ctx.panel?.classList.add('oculto');
  }
  function pasarModo(dir = 1) {
    const i = MODOS_PUESTO.indexOf(estado.modo);
    estado.modo = MODOS_PUESTO[(i + dir + MODOS_PUESTO.length) % MODOS_PUESTO.length];
    dibujar();
  }
  // Se cierra solo si te alejás del puesto (o, en la cabina, si el tren deja el andén).
  function vigilar(pos) {
    if (!estado.abierto) return;
    const aca = ctx.tren.conduciendo() ? ctx.tren.paradaCabina() === estado.parada : ctx.tren.puestoCerca(pos, 3.4) === estado.parada;
    if (!aca) cerrar();
  }

  // ------------------------------------------------ comprar, vender y los fletes
  function elegir(i) {
    const f = filas()[i];
    if (!f) return false;
    if (estado.modo === 'comprar') return comprarBien(f.bien);
    if (estado.modo === 'vender') return venderBien(f.bien);
    if (f.soltar) {
      if (!soltarFlete(comercio(), f.soltar)) return false;
      ctx.nota('Dejaste el flete', 'Otro lo va a llevar');
      ctx.guardar(); dibujar();
      return true;
    }
    const r = tomarFlete(comercio(), f.flete, aLaVez());
    if (!r.ok) {
      ctx.nota(r.motivo === 'tomado' ? 'Ese flete ya lo tomaste' : 'Ya llevás muchos fletes', r.motivo === 'tomado' ? 'Mañana hay otros' : 'Entregá alguno antes de tomar otro');
      return false;
    }
    const tx = textoFlete(r.flete);
    ctx.sonido?.anotar?.();
    ctx.nota(r.flete.tipo === 'pasajeros' ? 'Suben los pasajeros' : 'Cargaste el flete', `${tx.quien} hasta ${tx.hasta}. Se cobra al llegar manejando la trochita`, true);
    ctx.guardar(); dibujar();
    return true;
  }
  function comprarBien(bien) {
    const nombre = estado.parada?.nombre;
    if (!nombre || !BIENES[bien] || !conocido(bien)) return false;
    const r = comprar(comercio(), nombre, bien, ctx.dia(), ctx.temporada(), yerba());
    if (!r.ok) {
      if (r.motivo === 'yerba') ctx.nota('No te alcanza la yerba', `Cuesta ${r.precio}; tenés ${yerba()}. Vendé algo primero`);
      else if (r.motivo === 'agotado') ctx.nota('Hoy ya no les queda', 'Mañana vuelven a tener');
      return false;
    }
    cobrar(-r.precio);
    sumar(bien, r.cantidad);
    ctx.sonido?.juntar?.();
    ctx.nota(`Compraste ${cuantos(bien, r.cantidad)}`, `Pagaste ${r.precio} de yerba · te quedan ${yerba()}`);
    ctx.refrescar(); ctx.guardar(); dibujar();
    return true;
  }
  function venderBien(bien) {
    const nombre = estado.parada?.nombre;
    if (!nombre || !BIENES[bien]) return false;
    const r = vender(comercio(), nombre, bien, ctx.dia(), ctx.temporada(), tengo(bien));
    if (!r.ok) {
      if (r.motivo === 'falta') ctx.nota('No llevás suficiente', `Compran de a ${r.lote}; tenés ${tengo(bien)}`);
      else if (r.motivo === 'lleno') ctx.nota('Hoy ya no compran más de eso', 'Probá en otra parada');
      return false;
    }
    sumar(bien, -r.cantidad);
    cobrar(r.precio);
    ctx.sonido?.juntar?.();
    ctx.nota(`Vendiste ${cuantos(bien, r.cantidad)}`, `Te dieron ${r.precio} de yerba · tenés ${yerba()}`);
    ctx.refrescar(); ctx.guardar(); dibujar();
    return true;
  }
  // Llegaste manejando a `parada`: se entregan los fletes que iban ahí.
  function llegar(parada) {
    const listos = entregarFletes(comercio(), parada.nombre);
    if (!listos.length) return listos;
    for (const f of listos) {
      cobrar(f.premio?.yerba || 0);
      if (f.premio?.material) sumar(f.premio.material.k, f.premio.material.n);
    }
    ctx.sonido?.juntar?.();
    const pagos = listos.map((f) => textoFlete(f).paga).join(' · ');
    ctx.nota(listos.length === 1 ? 'Flete entregado' : `${listos.length} fletes entregados`, `En ${parada.nombre}: ${pagos}`, true);
    ctx.refrescar(); ctx.guardar();
    if (estado.abierto) dibujar();
    return listos;
  }

  // ------------------------------------------------ el tablero de la cabina
  let armado = false;
  const ultimo = { kmh: -1, reg: -1, pres: -1, freno: -1, prox: '' };
  function armarTablero() {
    const t = ctx.tablero;
    if (!t || armado) return;
    armado = true;
    const marcas = [];
    for (let v = 0; v <= 45; v += 5) {
      const a = Math.PI * (1 - v / 45);
      const r1 = v % 15 === 0 ? 38 : 42;
      marcas.push(`<line x1="${(60 + Math.cos(a) * r1).toFixed(1)}" y1="${(60 - Math.sin(a) * r1).toFixed(1)}" x2="${(60 + Math.cos(a) * 48).toFixed(1)}" y2="${(60 - Math.sin(a) * 48).toFixed(1)}"/>`);
    }
    t.innerHTML = `<div class="cabina-reloj"><svg viewBox="0 0 120 66" aria-hidden="true"><path class="cabina-arco" d="M 10 60 A 50 50 0 0 1 110 60"/><g class="cabina-marcas">${marcas.join('')}</g><line class="cabina-aguja" x1="60" y1="60" x2="60" y2="18"/><circle cx="60" cy="60" r="4"/></svg><p><b class="cabina-kmh">0</b> km/h</p></div>`
      + `<div class="cabina-barras"><p>${T_('Regulador')}<i><em class="cabina-regulador"></em></i></p><p>${T_('Presión')}<i><em class="cabina-presion"></em></i></p><p>${T_('Frenos')}<i><em class="cabina-freno"></em></i></p><p class="cabina-proxima"></p></div>`;
  }
  // `e`: lo que devuelve `tren.actualizar`. Oculto si no manejás.
  function tablero(e, dt = 0) {
    const t = ctx.tablero;
    if (!t) return;
    const maneja = !!e?.conduce && !!e.cabina;
    t.classList.toggle('oculto', !maneja);
    if (!maneja) return;
    armarTablero();
    comercio().km += (e.vel * dt) / 1000;
    const c = e.cabina, q = (sel) => t.querySelector(sel);
    const v = kmh(e.vel);
    if (v !== ultimo.kmh) {
      ultimo.kmh = v;
      q('.cabina-kmh').textContent = String(v);
      q('.cabina-aguja').setAttribute('transform', `rotate(${(-90 + 180 * Math.min(1, v / 45)).toFixed(1)} 60 60)`);
    }
    const barra = (clave, sel, valor) => {
      const r = Math.round(valor * 100);
      if (r === ultimo[clave]) return;
      ultimo[clave] = r;
      q(sel).style.width = `${r}%`;
    };
    barra('reg', '.cabina-regulador', c.regulador);
    barra('pres', '.cabina-presion', c.presion);
    barra('freno', '.cabina-freno', c.freno);
    const prox = e.paradaCabina ? `En el andén de ${e.paradaCabina.nombre}` : e.proxima ? `${e.proxima.nombre} en ${Math.max(0, Math.round(e.falta))} m` : '';
    if (prox !== ultimo.prox) { ultimo.prox = prox; q('.cabina-proxima').textContent = T_(prox); }
  }

  return {
    abrir, cerrar, dibujar, pasarModo, vigilar, elegir, comprarBien, venderBien, llegar, tablero, filas, tengo,
    abierto: () => estado.abierto, modo: () => estado.modo, parada: () => estado.parada, comercio,
    ventana: CABINA.ventana,
  };
}
