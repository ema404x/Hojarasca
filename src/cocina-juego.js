// 3.7.2: la cocina en el juego (las reglas son de cocina-pasos.js; lo que se ve, de cocina-mundo.js). Acá:
//   · las estaciones: las obras terminadas (parrilla con cruz, horno de barro, cocina a leña) y las móviles
//     (`registrarMovil`: el vagón comedor de la 3.7.3), con su cocción guardada (en la obra, `datos.coccion`; las
//     móviles en `progreso.cocina.moviles`);
//   · E y el aviso (mismo texto, misma prioridad: main.js los pone donde van las obras que trabajan): con algo al
//     fuego, el paso que sigue; si no, el panel de recetas (los números, el clic o la ruedita eligen);
//   · el tiempo: los pasos corren con el reloj del juego (también lejos o durmiendo); con lluvia, la parrilla de
//     afuera sin techito se ahoga (no corre) y no se puede prender;
//   · el olor del asado: trae hasta tres vecinos libres de la aldea (aldea-gente.js los lleva con `destino`), que
//     esperan alrededor, comen y se quedan de sobremesa; y al perro, que se roba un chorizo (`antojoPerro`);
//   · la charla con los vecinos: te enseñan una receta y cambian ingredientes (una vez por día cada uno);
//   · comer lo de la alacena (la barra) y el recetario del cuaderno.
// Sólo en el Relax (en el Desafío ni se arma: el horno sigue horneando de una, como en la 2.4).
import { COCINA, ESTACIONES, PLANOS_ESTACION, RECETA_PASOS, RECETAS_PASOS, estacionDeObra, estacionMovil, sanearCocina, sanearCoccion, opcionesEstacion, empezar, gastarIngredientes, avanzarCoccion, hacerPaso, pasoActual, avisoEstacion, humoDe, traeVecinos, elegirInvitados, lugaresAlrededor, FRASES_ASADO, FRASES_PERRO, sabe, aprender, ENSENAN, AL_ENSENAR, CAMBIOS_VECINOS, cambiosDe, cambiar, FRASES_CAMBIO, textoPide, pideCon, efectoDeComer, esComida, cuantoHay, alacenaDe, nombreCon, pistaReceta, INGREDIENTES, textoFaltan, sinTechoConLluvia } from './cocina-pasos.js';
import { estaLibre, amistades, sumarAmistadDe, nombreCorto } from './vecindad.js';
import { diaSemanaDe, CHICOS_ALDEA, ORDEN_VECINOS_ALDEA, VECINOS_DEL_VALLE, esPobladorAldea } from './aldea.js';
import { llegadaValle } from './amor-escenas.js';

const NIVEL = { conocido: 1, amigo: 2, compadre: 3 };
const RADIO_NOTAS = 45;      // a esta distancia (o menos) te avisa que un paso está listo
const RADIO_VECINOS = 70;    // con el jugador más lejos que esto de la parrilla, no viene nadie
const RADIO_PERRO = 25;      // el perro se tienta si estás cerca del asado
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const minus = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

// `ctx`: progreso(), desafio(), obras(), jugador() (el estado: pos, descansado…), lluvia(), invierno(), horasDia?,
// nota(t, sub, nueva), guardar(), refrescarBarra(), sonido(), troncos(), gastarTroncos(n), sumarEntrada(k, n),
// sumarMaterial(k, n), diario(tipo, dato), aldea() (aldea-gente), perro(), nombrePerro(), decir(texto),
// mundo() (cocina-mundo), alClic(el, fn), traducir(texto), alturaDePie(x, z, y), sendero(), centroAldea(), seco(x, z).
export function crearCocinaJuego(ctx) {
  const progreso = () => ctx.progreso();
  const dia = () => Math.max(1, Math.floor(Number(progreso().dia) || 1));
  const horas = () => Number(progreso().horas) || 0;
  const ahora = () => dia() * 24 + horas();
  const T_ = (s) => (ctx.traducir ? ctx.traducir(s) : s);
  const activo = () => !ctx.desafio?.() && !!progreso();
  function cocina() {
    const p = progreso();
    if (!p.cocina || !p.cocina.__sana) { p.cocina = sanearCocina(p.cocina, p.dia); Object.defineProperty(p.cocina, '__sana', { value: true, enumerable: false }); }
    return p.cocina;
  }

  // ---------------------------------------------------------------- las estaciones
  const obraTerminada = (o) => o.datos.etapas >= o.plano.etapas.length;
  const saneadas = new WeakSet();
  // lo de cada cocción que no se guarda: cuánto hace que el perro huele los chorizos, cuándo se buscó gente por última vez
  const pasajero = new WeakMap();
  const pas = (c) => { let x = pasajero.get(c); if (!x) { x = { tienta: 0, busco: -1e9 }; pasajero.set(c, x); } return x; };
  function coccionDe(o) {
    if (!saneadas.has(o.datos)) { o.datos.coccion = sanearCoccion(o.datos.coccion, dia()) || undefined; if (!o.datos.coccion) delete o.datos.coccion; saneadas.add(o.datos); }
    return o.datos.coccion || null;
  }
  const posObra = (o) => ({ x: o.datos.x, y: Number.isFinite(o.datos.y) ? o.datos.y : (ctx.alturaDePie?.(o.datos.x, o.datos.z, 0) ?? 0), z: o.datos.z });
  function techoDe(o) {
    const O = ctx.obras?.();
    if (!O) return false;
    const p = posObra(o);
    return !!(O.cubiertaDePieza?.({ x: p.x, y: p.y + 0.3, z: p.z }) || O.dentro?.({ x: p.x, y: p.y + 0.3, z: p.z }));
  }
  const esEstacionObra = (o) => !!o && Object.hasOwn(PLANOS_ESTACION, o.plano?.id) && obraTerminada(o);
  const estDe = (o) => estacionDeObra(o.plano.id, techoDe(o));
  // (la lista se rehace cada medio segundo, o si cambian las obras: se mira en cada cuadro por el perro)
  const cacheEst = { t: -1, n: -1, lista: [] };
  function estaciones() {
    const O = ctx.obras?.();
    const todas = O?.obras || [];
    const ahoraMs = performance.now();
    if (cacheEst.n !== todas.length || ahoraMs - cacheEst.t > 500) { cacheEst.lista = todas.filter(esEstacionObra); cacheEst.n = todas.length; cacheEst.t = ahoraMs; }
    return cacheEst.lista;
  }
  // las móviles (3.7.3): id → { est, pos() }
  const moviles = new Map();
  function registrarMovil({ id, tipo = 'cocina-lena', techo = true, nombre = null, pos = null } = {}) {
    const est = estacionMovil({ id, tipo, techo, nombre });
    if (!est) return null;
    moviles.set(id, { id, est, pos: typeof pos === 'function' ? pos : () => null });
    return {
      id, estacion: est,
      aviso: () => avisoMovil(id), usar: () => usarMovil(id),
      coccion: () => cocina().moviles[id] || null,
      humo: () => humoDe(cocina().moviles[id] || null),
      quitar: () => moviles.delete(id),
    };
  }

  // ---------------------------------------------------------------- el panel de recetas
  let panel = null;   // { o (obra) | movil (id), est, opciones }
  const $ = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);
  function abrirPanel(est, de) {
    panel = { est, de };
    $('cocina-panel')?.classList.remove('oculto');
    dibujarPanel();
    ctx.alAbrirPanel?.();
  }
  function cerrarPanel() {
    if (!panel) return;
    panel = null;
    $('cocina-panel')?.classList.add('oculto');
  }
  const panelAbierto = () => !!panel;
  function opcionesPanel() {
    if (!panel) return [];
    return opcionesEstacion(panel.est, progreso(), ctx.troncos?.() || 0);
  }
  function dibujarPanel() {
    if (!panel) return;
    const div = $('cocina-panel');
    if (!div) return;
    const ops = opcionesPanel();
    panel.opciones = ops;
    // (se rehace sólo si cambió algo de lo que muestra)
    const firma = `${ctx.troncos?.() || 0}|${sinTechoConLluvia(panel.est, ctx.lluvia?.() || 0)}|${ops.map((o) => `${o.puede}${o.sabe}${o.variante}${o.falta?.join()}`).join(';')}`;
    if (firma === panel.firma) return;
    panel.firma = firma;
    div.querySelector('.quien').textContent = T_(panel.est.nombre);
    const lluvia = sinTechoConLluvia(panel.est, ctx.lluvia?.() || 0);
    div.querySelector('.dicho').textContent = T_(lluvia ? 'Con esta lluvia el fuego no prende: hace falta un techito encima (O → Exterior).'
      : `Leña: ${panel.est.lena === 1 ? 'un tronco' : `${panel.est.lena} troncos`} por fuego (tenés ${ctx.troncos?.() || 0}). Lo que sale va a la alacena.`);
    const ul = div.querySelector('ul');
    ul.innerHTML = '';
    ops.forEach((op, i) => {
      const li = document.createElement('li');
      li.className = op.puede && !lluvia ? '' : 'falta';
      const b = document.createElement('b');
      b.textContent = `${i + 1}. ${T_(op.sabe ? op.nombre : op.aOjo ? `${op.nombre} (a ojo)` : 'Una receta que no sabés')}`;
      const span = document.createElement('span');
      span.textContent = T_(op.sabe || op.aOjo ? `— ${textoPide(pideCon(op.rc, op.variante))}` : `— ${pistaReceta(op.rc)}`);
      const marca = document.createElement('i');
      marca.textContent = T_(op.puede ? (lluvia ? 'llueve' : 'se puede') : op.sabe ? `falta: ${op.falta.join(', ')}` : 'sin aprender');
      li.append(b, span, marca);
      ctx.alClic?.(li, () => elegirPanel(i));
      ul.appendChild(li);
    });
    div.querySelector('.seguir').textContent = T_('Elegí con el número o con un clic · Escape para salir');
  }
  function elegirPanel(i) {
    if (!panel) return;
    const op = (panel.opciones || opcionesPanel())[i];
    if (!op) return;
    const est = panel.est, de = panel.de;
    if (!op.sabe && !op.aOjo) { ctx.nota?.('Esa receta no la sabés', pistaReceta(op.rc)); return; }
    const r = empezar(op.rc, est, progreso(), ctx.troncos?.() || 0, { lluvia: ctx.lluvia?.() || 0, dia: dia() });
    if (!r.ok) {
      if (r.motivo === 'lluvia') ctx.nota?.('Con esta lluvia no prende', 'Hace falta un techito encima: el techito de la parrilla, o una galería');
      else if (r.motivo === 'falta') ctx.nota?.(`Para ${minus(op.nombre)} falta`, cap(r.falta.join(', ')));
      return;
    }
    gastarIngredientes(progreso(), r.gasta.ingredientes);
    if (r.gasta.lena) ctx.gastarTroncos?.(r.gasta.lena);
    guardarCoccion(de, r.coccion);
    cerrarPanel();
    const p0 = RECETA_PASOS[r.coccion.receta].pasos[0];
    ctx.sonido?.()?.encender?.();
    ctx.nota?.(`${p0.hecho}: ${minus(nombreCon(op.rc, r.coccion.variante))}`, `${p0.sub}. ${p0.mientras} (${textoFaltan(p0.espera)})`, true);
    ctx.mundo?.()?.refrescar?.();
    ctx.refrescarBarra?.();
    ctx.guardar?.();
  }
  function guardarCoccion(de, c) {
    if (de?.movil) { if (c) cocina().moviles[de.movil] = c; else delete cocina().moviles[de.movil]; return; }
    const o = de?.o;
    if (!o) return;
    if (c) o.datos.coccion = c; else delete o.datos.coccion;
    saneadas.add(o.datos);
  }

  // ---------------------------------------------------------------- E y el aviso
  const esDeCocina = (o) => !!o && (Object.hasOwn(PLANOS_ESTACION, o.plano?.id) || o.plano?.id === 'alacena') && obraTerminada(o);
  function aviso(o) {
    if (!activo() || !esDeCocina(o)) return null;
    if (o.plano.id === 'alacena') { const n = alacenaDe(progreso()).length; return n ? `Mirar la alacena (${n} ${n === 1 ? 'cosa' : 'cosas'})` : 'La alacena está vacía'; }
    const est = estDe(o), c = coccionDe(o);
    return avisoEstacion(est, c, c ? [] : opcionesEstacion(est, progreso(), ctx.troncos?.() || 0), ctx.lluvia?.() || 0);
  }
  function usar(o) {
    if (!activo() || !esDeCocina(o)) return false;
    if (o.plano.id === 'alacena') { mirarAlacena(); return true; }
    const est = estDe(o), c = coccionDe(o);
    if (!c) { abrirPanel(est, { o }); return true; }
    seguirPaso(est, c, { o }, posObra(o));
    return true;
  }
  function avisoMovil(id) {
    const m = moviles.get(id);
    if (!m || !activo()) return null;
    const c = cocina().moviles[id] || null;
    return avisoEstacion(m.est, c, c ? [] : opcionesEstacion(m.est, progreso(), ctx.troncos?.() || 0), 0);
  }
  function usarMovil(id) {
    const m = moviles.get(id);
    if (!m || !activo()) return false;
    const c = cocina().moviles[id] || null;
    if (!c) { abrirPanel(m.est, { movil: id }); return true; }
    seguirPaso(m.est, c, { movil: id }, m.pos?.() || null);
    return true;
  }
  function seguirPaso(est, c, de, pos) {
    const r = hacerPaso(c);
    const nombre = nombreCon(RECETA_PASOS[c.receta], c.variante);
    if (r.accion === 'espera') { ctx.nota?.(`${nombre}: todavía no`, `${r.mientras}. Faltan ${textoFaltan(c.falta)}`); return; }
    if (r.accion === 'lluvia') { ctx.nota?.('La lluvia ahogó las brasas', 'Hasta que pare, o con un techito encima, no se hace'); return; }
    if (r.accion === 'paso') {
      ctx.sonido?.()?.juntar?.();
      ctx.nota?.(r.paso.hecho, `${r.paso.sub}. ${r.paso.mientras} (${textoFaltan(r.paso.espera)})`, true);
      guardarCoccion(de, c);
      ctx.mundo?.()?.refrescar?.();
      ctx.guardar?.();
      return;
    }
    if (r.accion === 'fin') { terminar(est, c, de, pos, r); return; }
  }
  function terminar(est, c, de, pos, r) {
    const p = progreso(), coc = cocina(), rc = r.rc;
    let n = r.da.n;
    // los que vinieron por el olor comen acá (uno cada uno; siempre queda algo para la alacena)
    const presentes = (c.invitados || []).filter((k) => invitadoCerca(k, pos));
    const comen = Math.min(presentes.length, Math.max(0, n - 2));
    n -= comen;
    const total = ctx.sumarEntrada?.(r.da.id, n) ?? 0;
    coc.hechas[rc.id] = (coc.hechas[rc.id] || 0) + 1;
    const nueva = aprender(coc, rc.id, 'hecha', dia());
    guardarCoccion(de, null);
    ctx.sonido?.()?.juntar?.();
    ctx.diario?.(est.tipo === 'horno' ? 'horno' : 'cocina', minus(r.nombre));
    ctx.nota?.(r.paso.hecho, `${cap(textoCantidad(r.da.id, n))} a la alacena. Tenés ${total}`, true);
    if (nueva) setTimeout(() => ctx.nota?.(`Aprendiste: ${r.nombre}`, 'Queda en el recetario del cuaderno (J)', true), 1500);
    if (rc.chorizos && c.robado) setTimeout(() => ctx.nota?.('Faltaba un chorizo', `Ya sabés quién fue: ${ctx.nombrePerro?.() || 'el perro'}`), 2900);
    if (comen > 0) {
      const nombres = presentes.slice(0, comen).map((k) => nombreCorto(k) || k);
      for (const k of presentes.slice(0, comen)) { const am = sumarAmistadDe(p, k, COCINA.amistad, dia()); if (am?.subio) setTimeout(() => ctx.nota?.(`${nombreCorto(k)} te tiene confianza`, am.nivel === 'compadre' ? 'Ya son compadres' : 'Ya son amigos', true), 4300); }
      setTimeout(() => ctx.nota?.('Comieron todos juntos', `${unir(nombres)} ${nombres.length === 1 ? 'se quedó' : 'se quedaron'} de sobremesa`, true), 3600);
      ctx.decir?.(FRASES_ASADO.comen[(dia() + rc.id.length) % FRASES_ASADO.comen.length]);
      decirHasta = performance.now() + 5000;
      if (pos) coc.sobremesa = { x: pos.x, z: pos.z, hasta: ahora() + COCINA.sobremesa, claves: presentes.slice(0, comen) };
    }
    ctx.mundo?.()?.refrescar?.();
    ctx.refrescarBarra?.();
    ctx.guardar?.();
  }
  const textoCantidad = (id, n) => {
    const nombres = { asado: ['porción de asado', 'porciones de asado'], 'cordero-asado': ['porción de cordero', 'porciones de cordero'], locro: ['plato de locro', 'platos de locro'],
      curanto: ['plato de curanto', 'platos de curanto'], 'chocolate-caliente': ['taza de chocolate', 'tazas de chocolate'], 'dulce-leche': ['frasco de dulce de leche', 'frascos de dulce de leche'],
      'pan-casero': ['pan casero', 'panes caseros'], empanadas: ['empanada', 'empanadas'], 'frasco-frutilla': ['frasco de dulce de frutilla', 'frascos de dulce de frutilla'] };
    const nn = nombres[id] || (id.startsWith('mermelada-') ? ['frasco de mermelada', 'frascos de mermelada'] : [id, id]);
    return `${n} ${n === 1 ? nn[0] : nn[1]}`;
  };
  const unir = (l) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}` : l[0] || '');
  function mirarAlacena() {
    const l = alacenaDe(progreso());
    if (!l.length) { ctx.nota?.('La alacena está vacía', 'Lo que cocinás y lo del almacén se acomoda solo'); return; }
    const partes = l.slice(0, 6).map((x) => `${x.nombre.toLowerCase()} (${x.n})`);
    ctx.nota?.(`En la alacena: ${l.length} ${l.length === 1 ? 'cosa' : 'cosas'}`, cap(`${unir(partes)}${l.length > 6 ? '…' : ''}. Nada se echa a perder`));
  }

  // ---------------------------------------------------------------- comer
  function comer(id) {
    if (!activo() || !esComida(id)) return false;
    const p = progreso();
    if (cuantoHay(p, id) <= 0) return false;
    const ef = efectoDeComer(id, !!ctx.invierno?.());
    const e = p.entradas[id];
    if (e && e.cantidad > 0) e.cantidad -= 1; else if (p.cosas?.[id] > 0) p.cosas[id] -= 1;
    const js = ctx.jugador?.();
    if (js) {
      if (ef.calor) js.entumecido = 0;
      if (ef.descanso > 0) js.descansado = Math.max(js.descansado || 0, ef.descanso);
    }
    ctx.sonido?.()?.juntar?.();
    const quedan = cuantoHay(p, id);
    ctx.nota?.(`Comiste ${ef.porcion}`, quedan ? `${ef.sub}. Quedan ${quedan} en la alacena` : `${ef.sub}. Era lo último`);
    ctx.mundo?.()?.refrescar?.();
    ctx.refrescarBarra?.();
    ctx.guardar?.();
    return true;
  }

  // ---------------------------------------------------------------- la charla con los vecinos
  // Una sola opción en el menú de la charla («Para la cocina…»), con la receta y el trueque adentro: con la granja y el
  // amor, el menú de un vecino ya llega a diez renglones y los números sólo eligen del 1 al 9.
  const opcionesCocina = (clave) => {
    const l = [];
    const r = ENSENAN[clave];
    if (r && !sabe(cocina(), r)) l.push({ id: 'cocina-ensenar', titulo: `¿Me enseñás a hacer ${minus(RECETA_PASOS[r].nombre)}?` });
    if (Object.hasOwn(CAMBIOS_VECINOS, clave)) l.push({ id: 'cocina-cambiar', titulo: 'Cambiar algo para la cocina…' });
    return l;
  };
  function opciones(clave) {
    if (!activo()) return [];
    return opcionesCocina(clave).length ? [{ id: 'cocina', titulo: 'Para la cocina…' }] : [];
  }
  const cuantoPago = (tipo, k) => {
    const p = progreso();
    if (tipo === 'material') return Number(p.materiales?.[k]) || 0;
    if (tipo === 'cosa') return Number(p.cosas?.[k]) || 0;
    return Number(p.entradas?.[k]?.cantidad) || 0;
  };
  // devuelve lo mismo que vecindad-juego.js espera de `elegir`: { tipo: 'menu', sub } o { tipo: 'renglones', renglones }
  function elegir(s, id) {
    const clave = s?.clave;
    if (id === 'cocina-ensenar') {
      const r = ENSENAN[clave];
      if (!r) return { tipo: 'renglones', renglones: ['…'] };
      const nueva = aprender(cocina(), r, clave, dia());
      if (nueva) setTimeout(() => ctx.nota?.(`Aprendiste: ${RECETA_PASOS[r].nombre}`, 'Queda en el recetario del cuaderno (J)', true), 300);
      ctx.guardar?.();
      return { tipo: 'renglones', renglones: [...(AL_ENSENAR[clave] || ['Así se hace.'])] };
    }
    if (id === 'cocina') {
      const ops = opcionesCocina(clave);
      if (ops.length === 1) return elegir(s, ops[0].id);   // (si hay una sola cosa, va directo)
      ops.push({ id: 'volver', titulo: 'Mejor no' });
      return { tipo: 'menu', sub: { tipo: 'cocina', texto: '¿Qué precisás para la cocina?', opciones: ops, i: 0 } };
    }
    if (id === 'cocina-cambiar') {
      const lista = cambiosDe(clave, cocina(), dia(), cuantoPago);
      if (lista[0]?.hoy) return { tipo: 'renglones', renglones: [FRASES_CAMBIO.yaHoy] };
      const ops = lista.map((c) => ({ id: `cocina:cambio:${c.i}`, titulo: c.titulo }));
      ops.push({ id: 'volver', titulo: 'Mejor no' });
      return { tipo: 'menu', sub: { tipo: 'cocina', texto: FRASES_CAMBIO.abre, opciones: ops, i: 0 } };
    }
    const m = /^cocina:cambio:(\d+)$/.exec(String(id));
    if (m) {
      const r = cambiar(clave, Number(m[1]), cocina(), dia(), cuantoPago);
      if (r.ok) {
        for (const f of r.efectos) {
          if (f.tipo === 'material') ctx.sumarMaterial?.(f.k, f.n);
          else if (f.tipo === 'cosa') { const p = progreso(); p.cosas = p.cosas || {}; p.cosas[f.k] = Math.max(0, (Number(p.cosas[f.k]) || 0) + f.n); if (!p.cosas[f.k]) delete p.cosas[f.k]; }
          else ctx.sumarEntrada?.(f.k, f.n);
        }
        ctx.nota?.(`${nombreCorto(clave) || 'Te dieron'}: ${r.titulo}`, 'Para la cocina', true);
        ctx.refrescarBarra?.();
        ctx.guardar?.();
      }
      return { tipo: 'renglones', renglones: r.renglones };
    }
    return { tipo: 'menu' };
  }

  // ---------------------------------------------------------------- los vecinos por el olor del asado
  // Dónde va `k` (para aldea-gente.js, como el amor): alrededor de la parrilla mientras se asa, y de sobremesa
  const destinosCache = { t: -1, mapa: new Map() };
  function destino(k) {
    if (!activo()) return null;
    const t = Math.floor(ahora() * 60);   // un minuto del juego
    if (destinosCache.t !== t) { destinosCache.t = t; destinosCache.mapa = calcularDestinos(); }
    return destinosCache.mapa.get(k) || null;
  }
  function calcularDestinos() {
    const mapa = new Map();
    const lugar = (x, z, rot, claves) => {
      const ls = lugaresAlrededor(x, z, rot, claves.length);
      const llegada = llegadaValle({ x, z }, ctx.sendero?.() || [], ctx.centroAldea?.() || null, ctx.seco || (() => true));
      claves.forEach((k, i) => mapa.set(k, { lugar: 'asado', edificio: null, punto: `asado-${i}`, x: ls[i].x, z: ls[i].z, mira: ls[i].mira, fuera: true, adentro: false, pose: null, sentado: false, llegada, entrada: [] }));
    };
    const deDia = horas() >= COCINA.horaInvitados[0] && horas() < COCINA.horaInvitados[1];   // (de noche, cada uno a su casa)
    for (const o of estaciones()) {
      if (o.plano.id !== 'parrilla' || !deDia) continue;
      const c = coccionDe(o);
      const claves = c?.invitados || [];
      if (!claves.length) continue;
      lugar(o.datos.x, o.datos.z, o.datos.rot || 0, claves);
    }
    const s = cocina().sobremesa;
    if (s && ahora() < s.hasta) lugar(s.x, s.z, 0, s.claves.filter((k) => !mapa.has(k)));
    return mapa;
  }
  function invitadoCerca(k, pos) {
    if (!pos) return false;
    const n = ctx.aldea?.()?.personas?.get?.(k)?.npc;
    return !!n && Math.hypot(n.pos.x - pos.x, n.pos.z - pos.z) < 6;
  }
  // los que viven en la aldea (como aldea-gente.js: los vecinos, Ercilia y los pobladores que ya llegaron)
  const presentes = (p) => [...ORDEN_VECINOS_ALDEA, ...Object.keys(VECINOS_DEL_VALLE), ...(p.aldea?.pobladores || []).map((x) => x.clave).filter(esPobladorAldea)];
  function invitar(o, c) {
    const p = progreso();
    if (!p.aldea) return;
    const am = amistades(p), h = horas(), ds = diaSemanaDe(dia());
    const cand = presentes(p).map((k) => ({ clave: k, libre: estaLibre(k, h, ds, p), amistad: NIVEL[am[k]] || 0, chico: CHICOS_ALDEA.includes(k) }));
    const claves = elegirInvitados(cand);
    if (!claves.length) { pas(c).busco = ahora(); return; }   // nadie libre: se vuelve a mirar en media hora
    c.invitados = claves;
    destinosCache.t = -1;
    ctx.nota?.('El humo del asado se ve desde lejos', `${unir(claves.map((k) => nombreCorto(k) || k))} ${claves.length === 1 ? 'viene' : 'vienen'} a ver qué se cocina`, true);
    decirPendiente = { texto: FRASES_ASADO.llegan[dia() % FRASES_ASADO.llegan.length], en: performance.now() + 9000 };
    ctx.guardar?.();
  }
  let decirPendiente = null, decirHasta = 0, proximoComentario = 0;

  // ---------------------------------------------------------------- el perro y el chorizo
  let perroFase = null;   // { fase: 'va' | 'roba' | 'huye' | 'come', t, o, destino }
  function antojoPerro() { return perroFase?.destino || null; }
  function actualizarPerro(dt, js) {
    const perro = ctx.perro?.();
    if (!perro?.est) { perroFase = null; return; }
    if (perroFase) {
      perroFase.t += dt;
      const pp = perro.est.pos;
      const d = Math.hypot(pp.x - perroFase.destino.x, pp.z - perroFase.destino.z);
      if (perroFase.fase === 'va') {
        perroFase.cerca = d < 1.3 ? (perroFase.cerca || 0) + dt : 0;
        const c = coccionDe(perroFase.o);
        if (!c || c.robado) { perroFase = null; return; }
        if (perroFase.cerca > 2.2 || perroFase.t > 40) {
          c.robado = true;
          cocina().perro = dia();
          const nombre = ctx.nombrePerro?.() || '';
          ctx.nota?.(nombre ? FRASES_PERRO.roba.replace('{perro}', nombre) : FRASES_PERRO.sinNombre, FRASES_PERRO.sub, true);
          ctx.sonido?.()?.ladrido?.(pp);
          // se escapa para el lado contrario a vos
          const o = perroFase.o, ax = o.datos.x - js.pos.x, az = o.datos.z - js.pos.z, l = Math.hypot(ax, az) || 1;
          const huida = { x: o.datos.x + (ax / l) * 11, z: o.datos.z + (az / l) * 11, corre: true, cerca: 0.8 };
          if (ctx.seco && !ctx.seco(huida.x, huida.z)) { huida.x = o.datos.x - (ax / l) * 11; huida.z = o.datos.z - (az / l) * 11; }
          perroFase = { fase: 'huye', t: 0, o, destino: huida };
          ctx.mundo?.()?.chorizoEnBoca?.(true);
          ctx.mundo?.()?.refrescar?.();
          ctx.guardar?.();
        }
      } else if (perroFase.fase === 'huye') {
        if (d < 1.2 || perroFase.t > 9) perroFase = { fase: 'come', t: 0, o: perroFase.o, destino: { ...perroFase.destino, corre: false, quieto: true } };
      } else if (perroFase.fase === 'come') {
        if (perroFase.t > 5) { perroFase = null; ctx.mundo?.()?.chorizoEnBoca?.(false); }
      }
      return;
    }
    if (cocina().perro === dia()) return;
    for (const o of estaciones()) {
      if (o.plano.id !== 'parrilla') continue;
      const c = coccionDe(o);
      if (!c || !humoDe(c).chorizos) continue;
      if (Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z) > RADIO_PERRO) continue;
      pas(c).tienta += dt;
      if (pas(c).tienta < 18) continue;   // un rato después de poner los chorizos
      const g = ctx.mundo?.()?.puntoGrilla?.(o) || { x: o.datos.x + 1.1, z: o.datos.z + 0.6 };
      perroFase = { fase: 'va', t: 0, o, destino: { x: g.x, z: g.z, corre: false, cerca: 0.9 } };
      break;
    }
  }

  // ---------------------------------------------------------------- el tiempo
  let visto = null, acumulado = 0;
  function actualizar(dt) {
    if (!activo()) return;
    const js = ctx.jugador?.();
    if (panel && panel.de?.o && js && Math.hypot(js.pos.x - panel.de.o.datos.x, js.pos.z - panel.de.o.datos.z) > 4.5) cerrarPanel();
    if (js) actualizarPerro(dt, js);
    if (decirPendiente && performance.now() > decirPendiente.en) { ctx.decir?.(decirPendiente.texto); decirHasta = performance.now() + 5000; decirPendiente = null; }
    if (decirHasta && performance.now() > decirHasta) { ctx.decir?.(null); decirHasta = 0; }
    acumulado += dt;
    if (acumulado < 0.5) return;
    acumulado = 0;
    const t = ahora();
    if (visto === null || t < visto - 0.01) { visto = t; return; }
    const h = Math.min(48, t - visto);
    visto = t;
    const lluvia = ctx.lluvia?.() || 0;
    for (const o of estaciones()) {
      const c = coccionDe(o);
      if (!c) continue;
      const est = estDe(o);
      const antesPausa = c.pausa;
      const listo = avanzarCoccion(c, h, est, lluvia);
      const cerca = js && Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z) < RADIO_NOTAS;
      if (c.pausa && !antesPausa && cerca) ctx.nota?.('Se largó a llover sobre la parrilla', 'Las brasas se ahogan: hasta que pare no se hace. Un techito encima lo arregla', true);
      if (listo && cerca) { const a = pasoActual(c); if (a) ctx.nota?.(`${nombreCon(a.rc, c.variante)}: ya se puede`, a.paso.accion, true); }
      // el olor del asado trae vecinos (una vez por asado)
      if (o.plano.id === 'parrilla' && !c.invitados?.length && t - pas(c).busco >= 0.5 && traeVecinos(c, horas()) && js && Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z) < RADIO_VECINOS) invitar(o, c);
      // y de a ratos algo dicen mientras esperan
      if (o.plano.id === 'parrilla' && c.invitados?.length && cerca && performance.now() > proximoComentario && !decirHasta) {
        const k = c.invitados.find((x) => invitadoCerca(x, posObra(o)));
        if (k) { ctx.decir?.(`${nombreCorto(k)}: «${FRASES_ASADO.esperan[Math.floor(t * 3) % FRASES_ASADO.esperan.length]}»`); decirHasta = performance.now() + 5000; proximoComentario = performance.now() + 45000; }
      }
    }
    for (const [id, c] of Object.entries(cocina().moviles)) {
      const m = moviles.get(id);
      avanzarCoccion(c, h, m?.est || ESTACIONES[RECETA_PASOS[c.receta].estacion], 0);
    }
    const s = cocina().sobremesa;
    if (s && t >= s.hasta) { cocina().sobremesa = null; destinosCache.t = -1; }
    if (panel) dibujarPanel();
  }

  // ---------------------------------------------------------------- el recetario (cuaderno, pestaña «Recetario»)
  let fichaReceta = null;
  function dibujarRecetario(lista, ficha, el) {
    const coc = cocina();
    const sabidas = RECETAS_PASOS.filter((r) => sabe(coc, r.id)).length;
    lista.appendChild(el('p', 'progreso', `${sabidas} de ${RECETAS_PASOS.length} recetas en el recetario`));
    for (const tipo of Object.keys(ESTACIONES)) {
      const div = el('div', 'seccion');
      div.appendChild(el('h3', '', ESTACIONES[tipo].nombre));
      const ul = el('ul', 'lista');
      for (const rc of RECETAS_PASOS.filter((r) => r.estacion === tipo)) {
        const b = el('button');
        const s = sabe(coc, rc.id);
        b.appendChild(el('span', s ? '' : 'desconocida', s ? rc.nombre : 'Sin aprender'));
        if (coc.hechas[rc.id]) b.appendChild(el('span', 'marca', `×${coc.hechas[rc.id]}`));
        if (fichaReceta === rc.id) b.setAttribute('aria-current', 'true');
        b.addEventListener('click', () => { fichaReceta = rc.id; ctx.redibujar?.(); });
        const li = el('li'); li.appendChild(b); ul.appendChild(li);
      }
      div.appendChild(ul); lista.appendChild(div);
    }
    const rc = RECETA_PASOS[fichaReceta] || RECETAS_PASOS.find((r) => sabe(coc, r.id)) || RECETAS_PASOS[0];
    const s = sabe(coc, rc.id);
    if (!s) {
      ficha.appendChild(el('h2', '', 'Todavía no'));
      ficha.appendChild(el('p', 'pista', `Una receta de ${ESTACIONES[rc.estacion].la}. ${pistaReceta(rc)}`));
      return;
    }
    ficha.appendChild(el('h2', '', rc.nombre));
    const quien = coc.sabe[rc.id]?.de;
    ficha.appendChild(el('p', 'cientifico', `En ${ESTACIONES[rc.estacion].la}${quien && quien !== 'hecha' ? ` · te la enseñó ${nombreCorto(quien) || quien}` : rc.deEntrada ? ' · de siempre' : ' · aprendida a ojo'}`));
    ficha.appendChild(el('p', 'texto', rc.texto));
    ficha.appendChild(el('p', 'anotado', `Lleva: ${textoPide(rc.pide)}, y ${ESTACIONES[rc.estacion].lena === 1 ? 'un tronco' : `${ESTACIONES[rc.estacion].lena} troncos`} de leña.`));
    const ol = el('ol', 'lista');
    rc.pasos.forEach((p, i) => ol.appendChild(el('li', '', `${i + 1}. ${p.accion}${p.espera ? ` — ${minus(p.mientras)}, ${textoFaltan(p.espera)}` : ''}`)));
    ficha.appendChild(ol);
    ficha.appendChild(el('p', 'pista', `Rinde ${rc.da.n}. ${rc.efecto}`));
    const ings = [...new Set(rc.pide.map((x) => x.k))].filter((k) => k !== 'fruta' && INGREDIENTES[k]);
    if (ings.length) ficha.appendChild(el('p', 'pista', `De dónde: ${ings.map((k) => `${INGREDIENTES[k].corto}, ${INGREDIENTES[k].de}`).join('; ')}.`));
  }

  // ---------------------------------------------------------------- lo que el mundo pregunta
  // Las estaciones con su estado (para cocina-mundo.js): [{ o, tipo, coccion, humo, techo }]
  function estadoMundo() {
    if (!activo()) return [];
    return estaciones().map((o) => { const c = coccionDe(o); return { o, tipo: PLANOS_ESTACION[o.plano.id], coccion: c, humo: humoDe(c) }; });
  }

  return {
    activo, cocina, registrarMovil, esDeCocina, aviso, usar, panelAbierto, cerrarPanel, elegirPanel, dibujarPanel,
    lista: () => (panel ? { ul: $('cocina-panel')?.querySelector('ul'), pie: $('cocina-panel')?.querySelector('.seguir'), elegir: (i) => elegirPanel(i) } : null),
    actualizar, comer, opciones, elegir, destino, antojoPerro, dibujarRecetario, estadoMundo, estaciones, coccionDe,
    // para las pruebas (?debug=1)
    __perro: () => (perroFase ? { fase: perroFase.fase, destino: perroFase.destino } : null),
    __adelantar: (h) => { visto = (visto ?? ahora()) - h; acumulado = 1; actualizar(0); },
    __invitar: (o) => { const c = coccionDe(o); if (c) invitar(o, c); return c?.invitados; },
    __candidatos: () => { const p = progreso(), am = amistades(p), h = horas(), ds = diaSemanaDe(dia()); return presentes(p).map((k) => ({ clave: k, libre: estaLibre(k, h, ds, p), amistad: NIVEL[am[k]] || 0 })); },
  };
}

