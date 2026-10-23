// 4.6: la gente fuera del pueblo en la charla (las reglas en gente-campo.js). Sin three ni DOM (se prueba en Node): lo que
// devuelve lo dibuja el menú de la charla de siempre (vecindad-juego.js → la rueda de main.js).
//   · a Nicanor y a Josefina (vecinos de la vecindad, con su menú de siempre) se les suman «Su pedido · …» y «Comprarle…»;
//   · Fermín, Belisario y Tobías (personas nuevas, fuera de la vecindad) tienen un menú corto: «Contame algo · …» (la
//     historia que todavía no te contó), su pedido, su tiendita y «chau».
// Los ids de las opciones empiezan con `campo:` (la rueda los pone en «Pedidos y compras»; ver social-rueda.js).
//
// `ctx`: progreso(), desafio(), dia(), horas(), lluvia(), estacion(), existe(k) (si el juego conoce la cosa: los materiales
// nuevos del agente «recursos», antes de juntar, no), cantidad(donde, k) (cuánto tenés), aplicar(efectos) (suma o resta
// [{ tipo, k, n }] como vecindad-juego.aplicarEfectos), pagar(monto, motivo, con) → bool, cobrar(monto, motivo, con),
// darHerramienta(id) → bool (el enganche con el agente «recursos»), tiene(k) (si ya tenés esa cosa o herramienta),
// nivel(oficio), nota(t, sub, nueva), guardar(), refrescarBarra(), anotarDiario(tipo, dato).
import { PERSONAS_CAMPO, esPersonaCampo, tieneTrato, saludoCampo, pedidoCampo, puedeEntregarCampo, anotarEntregaCampo, tiendaDe, anotarCompra, datoDelValle, historiaPendiente, genteCampoDe, cuantoCampo } from './gente-campo.js';
import { formatoPesos, pesosDe } from './economia.js';
import { dondeDe } from './tablon.js';
import { tratoDeEfectos } from './carga.js';

const NOMBRE = { nicanor: 'Nicanor', ema: 'Josefina' };
export const nombreCampo = (k) => (esPersonaCampo(k) ? PERSONAS_CAMPO[k].nombre : NOMBRE[k] || k);
export const TITULOS_CAMPO = { tienda: 'Comprarle algo…', volver: 'Mejor no' };
const FRASES = {
  tienda: '¿Qué te llevás?', nadaHoy: 'Por hoy no me queda nada para venderte. Volvé mañana.',
  noPide: 'Por ahora no necesito nada. Pasá en un par de días.', cupo: 'Te lo pagaría, pero hoy ya entregaste dos pedidos. Mañana, ¿dale?',
  sinPlata: (falta) => `Te faltan ${formatoPesos(falta)}. Fiado no, que acá arriba no hay libreta.`,
};

export function crearGenteCampoJuego(ctx) {
  const progreso = () => ctx.progreso();
  const dia = () => Math.max(1, Math.floor(Number(ctx.dia?.() ?? progreso().dia) || 1));
  const activo = () => !ctx.desafio?.() && !!progreso() && progreso().modo !== 'desafio';
  const gc = () => genteCampoDe(progreso());
  const existe = (k) => (ctx.existe ? !!ctx.existe(k) : true);
  const tengo = (donde, k) => Number(ctx.cantidad?.(donde, k)) || 0;
  const ctxTienda = () => ({ existe, tiene: (k) => !!ctx.tiene?.(k), nivel: (o) => Number(ctx.nivel?.(o)) || 0 });

  // La sesión de la charla para las personas nuevas (vecindad-juego.js la usa en vez de la de la vecindad)
  function sesion(npc) {
    const k = npc?.clave;
    if (!activo() || !esPersonaCampo(k)) return null;
    const g = gc();
    if (!g.conocidos[k]) { g.conocidos[k] = dia(); ctx.anotarDiario?.('campo-conocido', PERSONAS_CAMPO[k].completo); }
    return { clave: k, campo: true, saludo: saludoCampo(k, ctx.horas?.() ?? 10, ctx.lluvia?.() ?? 0), comentario: null, nivel: null, historia: null, servicio: null, linea: null, regalo: true, invito: true, vueltas: 0, sub: null, i: 0 };
  }
  const esDeCampo = (k) => esPersonaCampo(k);
  const despedida = (k) => (esPersonaCampo(k) ? PERSONAS_CAMPO[k].despedida : null);

  // Las opciones del menú principal (antes de «chau»)
  function opciones(k) {
    if (!activo() || !tieneTrato(k)) return [];
    const lista = [];
    const h = esPersonaCampo(k) ? historiaPendiente(gc(), k) : null;
    if (h) lista.push({ id: 'campo:historia', titulo: `Contame algo · ${h.titulo}` });
    const ped = pedidoCampo(gc(), k, dia(), existe);
    if (ped) lista.push({ id: 'campo:pedido', titulo: tengo(ped.donde, ped.k) >= ped.n ? `Entregarle ${cuantoCampo(ped.n, ped.k)} · ${formatoPesos(ped.pago)}` : `Su pedido · ${cuantoCampo(ped.n, ped.k)}` });
    if (tiendaDe(gc(), k, dia(), ctxTienda()).length) lista.push({ id: 'campo:tienda', titulo: TITULOS_CAMPO.tienda });
    return lista;
  }
  // El submenú de la tienda
  function submenuTienda(s) {
    const lista = tiendaDe(gc(), s.clave, dia(), ctxTienda());
    const opciones = lista.map((c) => ({ id: `campo:comprar:${c.id}`, titulo: `${c.titulo} · ${formatoPesos(c.precio)}${c.puede ? (c.una ? '' : ` (quedan ${c.quedan})`) : ` (${c.motivo.toLowerCase()})`}` }));
    opciones.push({ id: 'volver', titulo: TITULOS_CAMPO.volver });
    s.sub = { tipo: 'campo-tienda', texto: lista.length ? `${FRASES.tienda} Tenés ${formatoPesos(pesosDe(progreso()))}.` : FRASES.nadaHoy, opciones, i: 0 };
    return s.sub;
  }
  const renglones = (r) => ({ tipo: 'renglones', renglones: Array.isArray(r) ? r : [r] });

  // Elegir: { tipo: 'menu', sub } (un submenú), { tipo: 'renglones', renglones } o { tipo: 'historia', historia }
  function elegir(s, id) {
    const k = s?.clave;
    if (!activo() || !tieneTrato(k)) return { tipo: 'menu' };
    const g = gc();
    if (id === 'campo:historia') {
      const h = historiaPendiente(g, k);
      if (!h) return renglones('Otro día te cuento otra. Hoy ya hablé de más.');
      g.historias[k] = (g.historias[k] || 0) + 1;
      ctx.guardar?.();
      return { tipo: 'historia', historia: { id: `campo-${h.id}`, titulo: h.titulo, partes: h.partes } };
    }
    if (id === 'campo:tienda') return { tipo: 'menu', sub: submenuTienda(s) };
    if (id === 'campo:pedido') return entregarPedido(k);
    const m = /^campo:comprar:(.+)$/.exec(String(id));
    if (m) return comprar(k, m[1]);
    return { tipo: 'menu' };
  }

  function entregarPedido(k) {
    const g = gc();
    const v = puedeEntregarCampo(progreso(), g, k, dia(), tengo, existe);
    if (v.motivo === 'no pide') return renglones(FRASES.noPide);
    const q = v.pedido;
    if (v.motivo === 'cupo') return renglones(FRASES.cupo);
    if (v.motivo === 'falta') {
      const hay = tengo(q.donde, q.k);
      return renglones([q.pide, `Te lo pago ${formatoPesos(q.pago)}, hasta el día ${q.hasta}.${hay ? ` (Tenés ${hay}.)` : ''}`]);
    }
    ctx.aplicar?.([{ tipo: q.donde, k: q.k, n: -q.n }]);
    anotarEntregaCampo(progreso(), g, k, dia(), q);
    ctx.cobrar?.(q.pago, `Pedido: ${cuantoCampo(q.n, q.k)}`, nombreCampo(k));
    ctx.nota?.(`Pedido cumplido: ${formatoPesos(q.pago)}`, `${nombreCampo(k)} · ${cuantoCampo(q.n, q.k)}`, true);
    ctx.refrescarBarra?.();
    ctx.guardar?.();
    return renglones([q.gracias, `Acá tenés ${formatoPesos(q.pago)}. Lo justo y el viaje.`]);
  }

  function comprar(k, idCosa) {
    const g = gc();
    const c = tiendaDe(g, k, dia(), ctxTienda()).find((x) => x.id === idCosa);
    if (!c) return renglones(FRASES.nadaHoy);
    if (!c.puede) return renglones(c.requiere && c.motivo?.startsWith('Pide') ? `Éste no te lo vendo todavía: primero aprendé a picar piedra (${c.requiere.oficio} nivel ${c.requiere.nivel}). Con el pico común, en cualquier pedrero.` : FRASES.nadaHoy);
    const plata = pesosDe(progreso());
    if (plata < c.precio) return renglones(FRASES.sinPlata(c.precio - plata));
    // 4.7 carga: lo que comprás tiene que entrar en la mochila ANTES de cobrar (la herramienta y el dato no ocupan casillas)
    // 4.10.1: sólo cuenta lo que ocupa casilla (tratoDeEfectos filtra): la mosca, las botas y la tijera son «cosas» que no son contadores y no ocupan nada
    { const { da } = tratoDeEfectos(c.tipo === 'herramienta' || c.tipo === 'dato' ? [] : [{ tipo: c.tipo, k: c.k, n: c.n }]); if (Object.keys(da).length && ctx.cabeTrato && !ctx.cabeTrato(da)) return renglones('No te entra todo eso en la mochila: hacé lugar y volvé.'); }
    if (!ctx.pagar?.(c.precio, `Compra: ${c.titulo.toLowerCase()}`, nombreCampo(k))) return renglones(FRASES.sinPlata(c.precio - plata));
    anotarCompra(g, k, c.id, dia());
    let dice = c.dice;
    if (c.tipo === 'herramienta') ctx.darHerramienta?.(c.k);
    else if (c.tipo === 'dato') dice = datoDelValle(g);
    else ctx.aplicar?.([{ tipo: dondeDe(c.k), k: c.k, n: c.n }]);   // (donde lo guarda el juego: si «recursos» hace del cuero un bien, el suyo)
    ctx.nota?.(c.titulo, `Se lo compraste a ${nombreCampo(k)} · ${formatoPesos(c.precio)}`, true);
    ctx.refrescarBarra?.();
    ctx.guardar?.();
    return renglones(dice ? [dice] : ['Trato hecho.']);
  }

  return { sesion, esDeCampo, despedida, opciones, elegir, tieneTrato };
}
