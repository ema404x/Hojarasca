// 3.9.0 · LA CANTINA en el juego: sentarse a una mesa y pedir de verdad (no es la casa de té, donde el té «aparece»).
//
// Cómo anda:
//   1. Te sentás en una silla de las cuatro mesas (E, como en cualquier banco) y la cámara baja sola.
//   2. Lucrecia, la moza, te ve y VIENE CAMINANDO desde la barra (no aparece): te saluda con lo del momento (la hora, el tiempo, lo que pasó en
//      el valle, tu apodo si ya te conoce) y se abre la carta de ese día.
//   3. Elegís y pagás: pesos de tu billetera, trueque con algo que llevás o «anotalo en la cuenta» (se salda con pesos o con un mandado).
//   4. Ella vuelve a la barra, prepara (tarda: más si está llena), levanta la bandeja con el pedido, camina hasta tu mesa con la bandeja en alto,
//      lo deja y se va a atender a otro. Le sobra un rato de caminata de verdad: nada aparece de golpe.
//   5. Vos tomás o comés (E): ves el vaso o el bocado subir hacia vos de a sorbos. Un trago fuerte o algo caliente te saca el frío; la comida
//      te deja descansado un rato (y se gasta). Cuando terminás, ella te ve y viene a ver si querés otra.
//   6. Te levantás (moviéndote, R) y ella levanta lo de la mesa después.
// Módulo con estado pero sin three ni DOM propios (la mesa y el sorbo los dibuja `ctx.visual`, cantina-mundo.js; la carta usa el DOM de `ctx`):
// se prueba en Node con figuras y un DOM de mentira. El resto del juego lo ve por `ctx` (progreso, jugador, la moza, nota, sonido…).
import { EDIFICIOS_ALDEA, PARADA_ALDEA, marcoAldea, CANTINA, cantinaAbierta, localAbierto } from './aldea.js';
import { fechaDe, apodoDe } from './aldea-vida.js';
import { formatoPesos, pesosDe, hayEconomia } from './economia.js';
import { cartaDeHoy, cantinaDe, cuentaDe, formasDePago, pedir, saldarCuenta, afluencia, demoraDe, demoraEnVerte, tomarPorcion, verboDe, saludoDeMoza, dicho, NOMBRE_MOZA, textoBien, tengoBien, CARTA, FUERTES_POR_NOCHE } from './cantina.js';
import { elegirChiste, confianzaDe, sorberConAlcohol, nivelEbrio, faseEbrio, efectoEbrio, MULT_BORRACHERA, EBRIO } from './pena.js';
import { BORRACHERA_MOZA } from './pena-voces.js';

const PISO = 0.32;
export const RADIO_CANTINA = 40;      // más lejos que esto no se calcula nada
// segundos
const ESPERA_SIN_PEDIDO = 7;          // al lado de tu mesa, esperando que elijas
const DEJAR = 1.5;                    // lo que tarda en apoyar la bandeja
const LEVANTAR = 5;                   // desde que te levantás hasta que viene a levantar la mesa
const REVER = 7;                      // desde que terminás hasta que viene a ver si querés otra
const SORBO = 1.7;                    // lo que dura un sorbo o un bocado

export function crearCantinaJuego(ctx) {
  const E = EDIFICIOS_ALDEA.cantina;
  const marco = () => ctx.marco?.() || marcoAldea(PARADA_ALDEA);
  const T_ = ctx.T_ || ((t) => t);
  const P = () => ctx.progreso();
  const dia = () => Math.max(1, Math.floor(P().dia || 1));
  const hora = () => Number(P().horas) || 0;
  // del marco del edificio (la puerta en +Z) al mundo
  const aMundo = (bx, bz) => {
    const c = Math.cos(E.rot), s = Math.sin(E.rot);
    return marco().aMundo(E.x + bx * c + bz * s, E.z - bx * s + bz * c);
  };
  const rotMundo = (rot) => marco().rotMundo(E.rot + rot);
  const centro = aMundo(0, 0);
  const pisoY = () => E.y + PISO;

  // ---------------------------------------------------------------- el lugar, en el mundo
  const mesas = CANTINA.mesas.map((m) => {
    const w = aMundo(m.x, m.z), sv = aMundo(m.servicio.x, m.servicio.z);
    const mesa = { id: m.id, x: w.x, z: w.z, servicio: { x: sv.x, z: sv.z, mira: rotMundo(m.servicio.rot) }, sillas: [] };
    m.sillas.forEach((s, i) => { const q = aMundo(s.x, s.z); mesa.sillas.push({ mesa, i, x: q.x, z: q.z, mira: rotMundo(s.mira) }); });
    return mesa;
  });
  const sillas = mesas.flatMap((m) => m.sillas);
  const barra = (() => { const w = aMundo(CANTINA.barra.x, CANTINA.barra.z); return { x: w.x, z: w.z, mira: rotMundo(Math.PI / 2) }; })();
  const paso = CANTINA.paso.map((q) => aMundo(q.x, q.z));
  // los nodos por donde camina la moza: la barra, el hueco, el pasillo de la barra y el del medio (la cadena); de ahí, a cada mesa
  const cadena = [{ x: barra.x, z: barra.z }, ...paso];
  const distancia = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  // De donde esté a la mesa (o a la barra): por la cadena (sin chocar con las mesas), todo sin choques de las colisiones
  function ruta(desde, haciaMesa) {
    let i0 = 0;
    for (let i = 1; i < cadena.length; i++) if (distancia(desde, cadena[i]) < distancia(desde, cadena[i0])) i0 = i;
    const fin = haciaMesa ? cadena.length - 1 : 0;
    const puntos = [];
    for (let i = i0; i !== fin; i += i < fin ? 1 : -1) puntos.push(cadena[i + (i < fin ? 1 : -1)]);
    if (haciaMesa) puntos.push({ x: haciaMesa.servicio.x, z: haciaMesa.servicio.z });
    return puntos;
  }

  // ---------------------------------------------------------------- el estado de la visita
  let ses = null;            // { silla, mesa, fase, t, orden, saludo }
  let limpieza = null;       // { mesa, t, fase }
  const servidos = new Map();   // mesa.id → { item, restantes, silla } (lo que hay en cada mesa)
  let sorbo = null;          // { t, aplico, item } el sorbo en curso
  let controla = null;       // la moza, mientras la manejo yo
  let avisadoCerrada = -1, pasoEbrio = 0;
  const estadoPanel = { abierto: false, sel: null, texto: [], medio: null };
  const info = { visitas: 0, servicios: 0, sorbos: 0, limpiezas: 0, ms: 0 };

  const jugadorEstado = () => ctx.jugador?.()?.estado || null;
  const moza = () => ctx.moza?.() || null;
  const ambiente = () => ctx.ambiente?.() || {};
  const hablar = (texto, semilla = 0) => {
    ctx.nota?.(NOMBRE_MOZA, T_(texto));
    ctx.hablo?.(texto, controla || moza(), semilla);   // (el balbuceo de su voz)
  };
  const afl = () => afluencia(hora(), dia());
  const absoluta = () => dia() * 24 + hora();
  // 3.9.1: un chiste de Lucrecia para esa situación (o null): según la confianza que le tengas (amistad o romance) y con memoria, para que no repita seguido
  const chiste = (situacion, sub = null, siempre = false) => {
    const p = P(), c = cantinaDe(p);
    if (!c) return null;
    return elegirChiste('moza', situacion, sub, c.chistes, { confianza: confianzaDe(p, 'moza'), semilla: dia() * 17 + c.pedidos * 5 + c.visitas * 3 + info.sorbos + info.servicios * 2, siempre });
  };
  const elegirDe = (lista, k = 0) => (Array.isArray(lista) && lista.length ? lista[Math.abs(Math.floor(dia() * 7 + info.sorbos * 3 + info.servicios + k)) % lista.length] : '');
  // la borrachera: el nivel de ahora y en qué fase estaba (para avisar cuando cambia)
  let faseAntes = 'sobrio', avisoComenta = -1;
  const nivelAhora = () => nivelEbrio(cantinaDe(P())?.ebrio, absoluta());
  const multEbrio = () => {
    const a = ctx.ajusteBorrachera?.() ?? 'normal';
    return (Object.hasOwn(MULT_BORRACHERA, a) ? MULT_BORRACHERA[a] : 1) * (ctx.movimientoCamara?.() === 'reducido' ? 0.2 : 1);
  };

  // ---------------------------------------------------------------- manejar a la moza
  function tomar(n) {
    if (!n || controla === n) return !!n;
    controla = n;
    n.conVos = true; n.enCita = true; n.pose = null; n.asiento = undefined; n.soloCerca = 0; n.dormido = false; n.charlaVecinos = false;
    n.alAmor = true; n.velocidad = 0.95;
    return true;
  }
  function soltar() {
    const n = controla;
    controla = null;
    if (!n) return;
    n.conVos = false; n.enCita = false; n.camino = []; n.velocidad = 0.85; n.pose = null;
    try { ctx.visual?.bandeja?.(n, null); } catch { /* sin bandeja */ }
  }
  // Camina por `puntos` (en el mundo) y al final mira hacia `mira`
  function caminar(puntos, mira, pose = null) {
    const n = controla; if (!n) return;
    n.camino = puntos.map((q, i) => ({ x: q.x, z: q.z, sinChoque: true, cerca: i === puntos.length - 1 ? 0.12 : 0.3 }));
    n.miraFinal = mira; n.espera = 0;
    n.pose = pose; n.velocidad = pose === 'bandeja' ? 0.8 : 0.95;
  }
  const llego = () => { const n = controla; return !n || !n.camino || n.camino.length === 0; };
  const mozaLibre = () => { const n = moza(); return !!n && !n.deVisita && !n.dormido && !n.conVos && !n.llegando && !(ctx.hablandoCon?.() === n); };
  const sirviendo = () => cantinaAbierta(hora()) && mozaLibre();

  // ---------------------------------------------------------------- la visita
  const sillaCerca = (pos) => {
    if (Math.hypot(pos.x - centro.x, pos.z - centro.z) > 12) return null;
    let mejor = null, md = 0.6;
    for (const s of sillas) { const d = Math.hypot(pos.x - s.x, pos.z - s.z); if (d < md) { md = d; mejor = s; } }
    return mejor;
  };
  function empezarVisita(silla) {
    const p = P();
    if (!hayEconomia(p)) return;
    const c = cantinaDe(p);
    const abierta = cantinaAbierta(hora());
    ses = { silla, mesa: silla.mesa, fase: abierta ? 'espera' : 'cerrada', t: 0, orden: null, parado: false };
    if (limpieza) { limpieza = null; soltar(); }   // si venía a levantar y te sentaste de vuelta
    info.visitas++;
    if (!abierta) { aviso(dicho('cerrada'), 'cerrada'); return; }
    if (!mozaLibre()) { ses.fase = 'sola'; ses.t = 3; if (!moza()) aviso(dicho('sola'), 'sola'); return; }
    ses.t = demoraEnVerte(afl());
    if (c.ultima !== dia()) c.visitas++;   // (una por día: la que te conoce)
    c.ultima = dia();
  }
  function aviso(texto, clave) {
    const k = dia() * 100 + Math.floor(hora());
    if (avisadoCerrada === k) return;
    avisadoCerrada = k;
    ctx.nota?.(NOMBRE_MOZA, T_(texto));
  }
  // Te levantaste. Con un pedido en camino (ya pagado), ella lo termina de traer igual a la mesa vacía; si no, se cierra la visita
  function terminarVisita(forzar = false) {
    if (!ses) return;
    cerrarPanel();
    sorbo = null;
    ctx.visual?.cancelarSorbo?.();
    if (!forzar && ses.orden) { ses.parado = true; return; }
    const mesa = ses.mesa;
    if (controla) soltar();
    // (3.9.1: al irte, ella te saluda con un chiste; si estás alegre, te lo dice con humor)
    if (cantinaAbierta(hora()) && !forzar) { const q = nivelAhora() >= EBRIO.alegre ? elegirDe(BORRACHERA_MOZA.alSalir, 3) : chiste('despedida'); if (q) hablar(q); }
    if (servidos.has(mesa.id)) limpieza = { mesa, t: LEVANTAR, fase: 'espera' };
    ses = null;
  }
  const haciaSilla = () => Math.atan2(ses.silla.x - ses.mesa.servicio.x, ses.silla.z - ses.mesa.servicio.z);
  const enLaMesa = () => (ses ? servidos.get(ses.mesa.id) || null : null);

  // ---------------------------------------------------------------- la carta
  const clima = () => { const a = ambiente(); return a.lluvia > 0.35 ? (a.invierno > 0.5 ? 'nieve' : 'lluvia') : a.viento > 0.75 ? 'viento' : a.nublado > 0.7 ? 'nublado' : 'sol'; };
  function contextoCarta() {
    const p = P(), a = p.aldea || null;
    return {
      estacion: fechaDe(dia()).estacion, clima: clima(),
      locales: { panaderia: a ? localAbierto(a, 'panaderia') : false, pescaderia: a ? localAbierto(a, 'pescaderia') : false, 'sala-miel': a ? localAbierto(a, 'sala-miel') : false },
    };
  }
  const cartaHoy = () => cartaDeHoy(contextoCarta());
  function saludo() {
    const p = P(), c = cantinaDe(p), a = ambiente();
    const hechos = p.vecindad?.hechos || [];
    const s = saludoDeMoza({
      hora: hora(), clima: clima(), estacion: fechaDe(dia()).estacion, apodo: apodoDe(p)?.texto || null, visitas: Math.max(0, (c?.visitas || 0) - 1),
      cuenta: c?.cuenta || null, hechos: hechos.filter((x) => dia() - x.dia <= 3), dia: dia(),
    });
    const j = chiste('sentarse');   // (3.9.1: y a veces un chiste, al sentarte)
    return j ? [...s, j] : s;
  }

  // El pedido: cobra, la moza anota y se va a la barra
  function pedirItem(item, forma) {
    if (!ses || ses.orden) return false;
    const r = pedir(P(), item.id, forma, dia(), hora(), cartaHoy());
    if (!r.ok) {
      if (r.motivo === 'ya-esta') {
        // el cuarto trago fuerte de la noche: ella te trae un mate cocido, por la casa, y te pone en tu lugar de buen modo
        const mate = cartaHoy().find((x) => x.id === 'mate-cocido') || CARTA.find((x) => x.id === 'mate-cocido');
        hablar(elegirDe(BORRACHERA_MOZA.frena) || dicho('ya_esta'));
        aceptarOrden(mate, { medio: 'casa', regalo: true });
        return true;
      }
      ctx.nota?.(T_('No se pudo pedir'), T_(r.motivo === 'plata' ? dicho('sin_plata') : r.motivo === 'cuenta' ? dicho('cuenta_llena') : 'Probá con otra cosa'));
      return false;
    }
    ctx.sonido?.juntar?.();
    if (r.medio === 'pesos') ctx.nota?.(T_('Pagaste'), formatoPesos(r.cobro.pesos));
    else if (r.medio === 'trueque') ctx.nota?.(T_('Trueque'), textoBien(r.cobro.bien, r.cobro.n));
    else ctx.nota?.(T_('Lo anotó en la cuenta'), formatoPesos(cuentaDe(P())?.monto || 0));
    ctx.guardar?.(); ctx.refrescar?.();
    aceptarOrden(item, r);
    return true;
  }
  function aceptarOrden(item, r) {
    ses.orden = { item, medio: r.medio, fase: 'anota', t: 0, regalo: !!r.regalo };
    // (3.9.1: con el pedido, a veces un chiste de lo que pediste —o de la cuenta, si la anotás— en vez del «anotado»)
    if (!r.regalo) hablar((r.medio === 'cuenta' ? chiste('cuenta') : null) || chiste('pedir', item.id) || dicho('anota', dia() + info.servicios));
    cerrarPanel();
    ses.fase = 'a-barra';
    if (controla) caminar(ruta(controla.pos, null), barra.mira);
  }

  // ---------------------------------------------------------------- el bucle
  function actualizar(dt) {
    const js = jugadorEstado();
    if (!js || !ctx.progreso || !hayEconomia(P())) return;
    const d = Math.hypot(js.pos.x - centro.x, js.pos.z - centro.z);
    if (d > RADIO_CANTINA) {
      // lejos: nada de esto se ve; se levanta la mesa y se suelta a la moza
      if (ses) terminarVisita();
      if (limpieza || servidos.size || controla) { limpieza = null; servidos.clear(); soltar(); ctx.visual?.limpiarTodo?.(); }
      return;
    }
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    // ¿te sentaste (o te levantaste)?
    const silla = js.sentado ? sillaCerca(js.pos) : null;
    if (ses?.parado) { if (silla && silla.mesa === ses.mesa) { ses.parado = false; ses.silla = silla; } }   // volviste a la misma mesa a tiempo
    else if (silla && (!ses || ses.silla !== silla)) { if (ses) terminarVisita(true); empezarVisita(silla); }
    else if (ses && (!js.sentado || !silla)) terminarVisita();
    if (ses) avanzar(dt);
    if (limpieza) avanzarLimpieza(dt, d);
    avanzarSorbo(dt);
    ctx.visual?.actualizar?.(dt, ctx.camara?.());
    pasoEbrio += dt;
    if (pasoEbrio > 1.5) { pasoEbrio = 0; const f = faseEbrio(nivelAhora()); if (f !== faseAntes) avisarFase(faseAntes, f); }
    if (typeof performance !== 'undefined') info.ms = performance.now() - t0;
  }
  function avanzar(dt) {
    const n = moza();
    switch (ses.fase) {
      case 'cerrada': case 'sola': {
        // la moza puede aparecer mientras seguís sentado (abre la cantina, vuelve)
        if (cantinaAbierta(hora()) && sirviendo()) { ses.fase = 'espera'; ses.t = demoraEnVerte(afl()); }
        break;
      }
      case 'espera': {
        if (!sirviendo()) { ses.fase = 'sola'; break; }
        ses.t -= dt;
        if (ses.t > 0) break;
        tomar(n);
        caminar(ruta(n.pos, ses.mesa), haciaSilla());
        ses.fase = 'viene';
        break;
      }
      case 'viene': {
        if (!controla) { ses.fase = 'espera'; ses.t = 1; break; }
        if (!llego()) break;
        ses.fase = 'carta'; ses.t = ESPERA_SIN_PEDIDO;
        abrirPanel(saludo());
        break;
      }
      case 'carta': {
        // ella espera al lado de tu mesa; si cerrás la carta sin pedir, un rato y se va
        if (estadoPanel.abierto) break;
        ses.t -= dt;
        if (ses.t <= 0) { ses.fase = 'se-va-sin-pedido'; if (controla) caminar(ruta(controla.pos, null), barra.mira); }
        break;
      }
      case 'se-va-sin-pedido': {
        if (llego()) { soltar(); ses.fase = 'libre'; }
        break;
      }
      case 'a-barra': {
        if (!controla) { ses.fase = 'espera'; break; }
        if (!llego()) break;
        // ya en la barra: de espaldas a vos, apoyada, preparando
        controla.pose = 'barra';
        const it = ses.orden.item;
        ses.orden.t = demoraDe(it, afl());
        ses.fase = 'prepara';
        break;
      }
      case 'prepara': {
        ses.orden.t -= dt;
        if (ses.orden.t > 0) break;
        // sirve: levanta la bandeja con lo tuyo y sale a la mesa
        ctx.visual?.bandeja?.(controla, ses.orden.item);
        caminar(ruta(controla.pos, ses.mesa), haciaSilla(), 'bandeja');
        ses.fase = 'trae';
        break;
      }
      case 'trae': {
        if (!llego()) break;
        controla.pose = 'dejar';
        ses.orden.t = DEJAR;
        ses.fase = 'deja';
        break;
      }
      case 'deja': {
        ses.orden.t -= dt;
        if (ses.orden.t > DEJAR / 2) break;
        // a la mitad del gesto, lo apoya en la mesa (el plato sale de la bandeja)
        const it = ses.orden.item;
        servidos.set(ses.mesa.id, { item: it, restantes: it.porciones, silla: ses.silla, desde: dia() * 24 + hora() });
        ctx.visual?.bandeja?.(controla, null);
        ctx.visual?.ponerEnMesa?.(ses.mesa, ses.silla, it, it.porciones);
        info.servicios++;
        hablar(dicho(it.tipo === 'bebida' && !it.caliente ? 'trae_fria' : 'trae', dia() + info.servicios));
        ctx.sonido?.juntar?.();
        ses.fase = 'apoya';
        break;
      }
      case 'apoya': {
        ses.orden.t -= dt;
        if (ses.orden.t > 0) break;
        controla.pose = null;
        caminar(ruta(controla.pos, null), barra.mira);
        ses.fase = 'se-va';
        break;
      }
      case 'se-va': {
        if (!llego()) break;
        soltar();
        ses.orden = null;
        ses.fase = 'libre'; ses.t = 0;
        break;
      }
      case 'libre': {
        if (ses.parado) { terminarVisita(true); break; }
        // si ya terminaste lo tuyo, un rato después ella te ve y viene a ver si querés otra
        const s = enLaMesa();
        if (s && s.restantes === 0 && !sorbo) {
          ses.t += dt;
          if (ses.t > REVER && sirviendo()) { hablar(dicho('vuelve_pronto')); ses.fase = 'espera'; ses.t = 0.5; ses.t = demoraEnVerte(afl()) * 0.5; }
        }
        break;
      }
      default: break;
    }
  }

  // ---------------------------------------------------------------- levantar la mesa
  function avanzarLimpieza(dt, d) {
    const n = moza();
    if (limpieza.fase === 'espera') {
      limpieza.t -= dt;
      if (limpieza.t > 0) return;
      // lejos de la mesa o sin moza: se levanta de una
      if (!mozaLibre() || d > 30) { servidos.delete(limpieza.mesa.id); ctx.visual?.quitarDeMesa?.(limpieza.mesa); limpieza = null; return; }
      tomar(n);
      caminar(ruta(n.pos, limpieza.mesa), Math.atan2(limpieza.mesa.x - limpieza.mesa.servicio.x, limpieza.mesa.z - limpieza.mesa.servicio.z));
      limpieza.fase = 'va';
    } else if (limpieza.fase === 'va') {
      if (!controla) { limpieza = null; return; }
      if (!llego()) return;
      controla.pose = 'dejar'; limpieza.t = DEJAR; limpieza.fase = 'recoge';
    } else if (limpieza.fase === 'recoge') {
      limpieza.t -= dt;
      if (limpieza.t > DEJAR / 2) return;
      servidos.delete(limpieza.mesa.id);
      ctx.visual?.quitarDeMesa?.(limpieza.mesa);
      ctx.visual?.bandeja?.(controla, CARTA[0], true);
      info.limpiezas++;
      limpieza.fase = 'vuelve'; limpieza.t = DEJAR / 2;
    } else if (limpieza.fase === 'vuelve') {
      limpieza.t -= dt;
      if (limpieza.t > 0) return;
      if (controla) { controla.pose = null; ctx.visual?.bandeja?.(controla, null); caminar(ruta(controla.pos, null), barra.mira); }
      limpieza.fase = 'se-fue';
    } else if (limpieza.fase === 'se-fue') {
      if (llego()) { soltar(); limpieza = null; }
    }
  }

  // ---------------------------------------------------------------- tomar y comer
  function sorbear() {
    const s = enLaMesa();
    if (!s || s.restantes <= 0 || sorbo || !ses) return false;
    sorbo = { t: 0, aplico: false, item: s.item, mesa: ses.mesa };
    ctx.visual?.empezarSorbo?.(ses.mesa, ses.silla, s.item, s.restantes);
    return true;
  }
  function avanzarSorbo(dt) {
    if (!sorbo) return;
    sorbo.t += dt;
    // a la mitad (cuando el vaso llega a la boca) se aplica
    if (!sorbo.aplico && sorbo.t >= SORBO * 0.5) {
      sorbo.aplico = true;
      const s = servidos.get(sorbo.mesa.id);
      if (s) {
        const entumecidoAntes = jugadorEstado()?.entumecido || 0;
        const r = tomarPorcion(s);
        info.sorbos++;
        for (const e of r.efectos) ctx.alJugador?.(e.campo, e.valor);
        ctx.visual?.nivel?.(sorbo.mesa, s.restantes, s.item);
        sorberAlcohol(s);
        if (s.restantes === s.item.porciones - 1) { const j = chiste('tomar'); if (j) hablar(j); }   // (3.9.1: «despacito, que lo bueno se saborea»)
        if (r.efectos.some((e) => e.campo === 'entumecido') && entumecidoAntes > 0) ctx.nota?.(T_('Te calentó el cuerpo'), T_('Se te fue el entumecido'));
        if (r.termino) {
          ctx.nota?.(T_(s.item.nombre), T_(dicho(s.item.tipo === 'comida' ? 'termino_comida' : 'termino_trago')));
          if (r.efectos.some((e) => e.campo === 'descansado')) ctx.nota?.(T_('Quedaste lleno'), T_('Vas a andar más descansado un rato, hasta que se te pase'));
          if (ses) { ses.t = 0; }
        }
        ctx.guardar?.();
      }
    }
    if (sorbo.t >= SORBO) sorbo = null;
  }

  // ---------------------------------------------------------------- 3.9.1: la borrachera
  // Cada sorbo de algo fuerte (y, poquito, de cerveza) sube el nivel; con el tiempo baja y un mate cocido lo baja de golpe. Leve: la imagen se mueve un poquito y al caminar te
  // vas un poco para un lado; no se pierde nada. Lucrecia lo comenta con humor y al tercer trago fuerte de la noche te frena. Se puede suavizar o apagar (ajustes).
  function sorberAlcohol(s) {
    const p = P(), c = cantinaDe(p);
    if (!c) return;
    const ahora = absoluta(), antes = nivelEbrio(c.ebrio, ahora);
    c.ebrio = sorberConAlcohol(c.ebrio, s.item, ahora);
    const despues = nivelEbrio(c.ebrio, ahora);
    const fa = faseEbrio(antes), fd = faseEbrio(despues);
    if (fd !== fa) avisarFase(fa, fd);
    // al terminar el tercer trago fuerte, ella te lo dice (el cuarto ya no te lo trae)
    if (s.restantes === 0 && s.item.fuerte && c.fuertes.n >= FUERTES_POR_NOCHE) hablar(elegirDe(BORRACHERA_MOZA.frena, 1));
  }
  function avisarFase(antes, ahora) {
    faseAntes = ahora;
    const sube = ['sobrio', 'achispado', 'alegre', 'torcido'].indexOf(ahora) > ['sobrio', 'achispado', 'alegre', 'torcido'].indexOf(antes);
    if (sube && ahora === 'alegre') { ctx.nota?.(T_('Estás alegre'), T_('Se te mueve un poquito el mundo: se pasa solo, con el tiempo o con un mate cocido')); hablar(elegirDe(BORRACHERA_MOZA.comenta)); avisoComenta = dia(); }
    else if (sube && ahora === 'torcido') ctx.nota?.(T_('Vas a caminar torcido'), T_('Un rato nomás: no pasa nada grave, y se te va con el tiempo'));
    else if (!sube && ahora === 'sobrio' && antes !== 'sobrio') ctx.nota?.(T_(NOMBRE_MOZA), T_(elegirDe(BORRACHERA_MOZA.seTePasa, 2)));
  }
  // El efecto de ahora en la cámara (o null): lo pide main.js cada cuadro dibujado
  const efectoEbrioAhora = (t) => (nivelAhora() > 0 ? efectoEbrio(nivelAhora(), t, multEbrio()) : null);

  // ---------------------------------------------------------------- lo que hace E (y dice el aviso)
  function accion(js) {
    if (!ses || ses.parado || estadoPanel.abierto || !hayEconomia(P())) return null;
    const s = enLaMesa();
    if (s && s.restantes > 0 && !sorbo && ses.fase !== 'carta') return { texto: verboDe(s.item), hacer: () => sorbear() };
    if (ses.fase === 'libre' && sirviendo() && !sorbo) return { texto: 'Llamar a la moza', hacer: () => llamar() };
    if (ses.fase === 'carta' || ses.fase === 'se-va-sin-pedido') return { texto: 'Mirar la carta', hacer: () => { abrirPanel(saludo(), false); } };
    return null;
  }
  // Con vos sentado y lo tuyo para comer o tomar, la E es de eso (y no de hablar con la moza que pasa al lado)
  const tapaVecino = (js) => !!ses && !estadoPanel.abierto && !!accion(js);
  function llamar() {
    if (!ses || !sirviendo()) return false;
    ses.fase = 'espera'; ses.t = 0.6;
    ctx.nota?.(T_(NOMBRE_MOZA), T_(dicho('llega')));
    return true;
  }

  // ---------------------------------------------------------------- el panel de la carta (DOM)
  function el(tag, clase, texto) { const e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = T_(texto); return e; }
  function boton(texto, alClic, { activo = true, clase = '' } = {}) {
    const b = el('button', clase, texto);
    b.type = 'button'; b.disabled = !activo;
    const accion = () => { if (!b.disabled) alClic(); };
    if (ctx.alClic) ctx.alClic(b, accion); else b.addEventListener('click', accion);
    b.addEventListener('keydown', (ev) => { if (ev.code === 'Enter' || ev.code === 'Space') { ev.preventDefault(); ev.stopPropagation(); accion(); } });
    return b;
  }
  const renglon = (a, b) => { const r = el('div', 'cantina-renglon'); r.append(el('span', '', a), el('b', '', b)); return r; };
  function dibujar() {
    const raiz = ctx.contenido;
    if (!raiz) return;
    raiz.innerHTML = '';
    if (estadoPanel.libre) {
      // 3.9.1: un panel de otro (la peña: Dalia te saca a bailar): su texto y sus botones
      const L = estadoPanel.libre;
      const h = ctx.panel?.querySelector?.('h2'); if (h) h.textContent = T_(L.titulo || 'La carta de hoy');
      raiz.append(el('p', 'cantina-saludo', (L.texto || []).map((x) => T_(x)).join(' ')));
      const fila = el('div', 'cantina-pagos');
      for (const b of L.botones || []) fila.append(boton(b.texto, () => { const f = b.alClic; cerrarPanel(false); f?.(); }, { activo: b.activo !== false }));
      raiz.append(fila);
      return;
    }
    { const h = ctx.panel?.querySelector?.('h2'); if (h) h.textContent = T_('La carta de hoy'); }
    const p = P();
    raiz.append(el('p', 'cantina-saludo', estadoPanel.texto.map((x) => T_(x)).join(' ')));
    raiz.append(el('p', 'cantina-saldo', `${T_('Tenés')} ${formatoPesos(pesosDe(p))}`));
    const carta = cartaHoy();
    const lista = el('div', 'cantina-lista');
    for (const it of carta) {
      const f = el('div', 'cantina-fila' + (estadoPanel.sel === it.id ? ' marcada' : ''));
      const cab = boton(it.nombre, () => { estadoPanel.sel = estadoPanel.sel === it.id ? null : it.id; dibujar(); }, { clase: 'cantina-plato' });
      f.append(cab, el('i', '', it.texto), el('b', '', formatoPesos(it.precio)));
      lista.append(f);
      if (estadoPanel.sel === it.id) {
        const fila = el('div', 'cantina-pagos');
        for (const fp of formasDePago(p, it)) fila.append(boton(fp.texto, () => pedirItem(it, fp), { activo: fp.ok, clase: fp.medio }));
        lista.append(fila);
      }
    }
    raiz.append(lista);
    const c = cuentaDe(p);
    if (c) {
      const caja = el('div', 'cantina-cuenta');
      caja.append(renglon('Tu cuenta', formatoPesos(c.monto)), renglon('Mandado', textoBien(c.k, c.n)));
      const fila = el('div', 'cantina-pagos');
      fila.append(boton(`Saldar con ${formatoPesos(c.monto)}`, () => saldar('pesos'), { activo: pesosDe(p) >= c.monto }), boton(`Saldar con el mandado (${textoBien(c.k, c.n)})`, () => saldar('mandado'), { activo: tengoBien(p, c.k) >= c.n }));
      caja.append(fila);
      raiz.append(caja);
    }
    const pie = el('div', 'cantina-pagos');
    pie.append(boton('Después pido', () => cerrarPanel()), boton('Levantarme', () => { cerrarPanel(); ctx.levantar?.(); }));
    raiz.append(pie);
  }
  function saldar(medio) {
    const r = saldarCuenta(P(), medio);
    if (!r.ok) { ctx.nota?.(T_('No se pudo saldar'), T_(r.motivo === 'plata' ? 'No te alcanza la plata' : 'Te falta lo que pide para el mandado')); return; }
    ctx.sonido?.juntar?.();
    ctx.nota?.(T_('Saldaste la cuenta'), T_(dicho(medio === 'mandado' ? 'mandado' : 'pagada')));
    ctx.guardar?.(); ctx.refrescar?.();
    dibujar();
  }
  function abrirPanel(texto, conSaludo = true) {
    estadoPanel.texto = conSaludo ? texto : [dicho('vuelve_pronto')];
    estadoPanel.abierto = true;
    estadoPanel.sel = null;
    dibujar();
    ctx.panel?.classList.remove('oculto');
    if (conSaludo && controla) ctx.hablo?.(texto[0], controla, dia());
  }
  function cerrarPanel(avisar = true) {
    if (!estadoPanel.abierto) return;
    estadoPanel.abierto = false;
    ctx.panel?.classList.add('oculto');
    const L = estadoPanel.libre;
    estadoPanel.libre = null;
    if (L && avisar) L.alCerrar?.();
  }
  // 3.9.1: un panel de cualquier otra cosa (la peña): { titulo, texto: [renglones], botones: [{ texto, alClic, activo }], alCerrar } (Escape o E lo cierra: alCerrar)
  function abrirPanelLibre(def) {
    if (!def || estadoPanel.abierto) return false;
    estadoPanel.libre = def; estadoPanel.abierto = true; estadoPanel.sel = null;
    dibujar();
    ctx.panel?.classList.remove('oculto');
    return true;
  }

  return {
    actualizar, accion, tapaVecino, panelAbierto: () => estadoPanel.abierto, cerrarPanel,
    alApretarE: () => cerrarPanel(), atras: () => cerrarPanel(),
    // el que habla con ella desde la charla («Dígame qué le sirvo»)
    abrirCarta: () => { if (!ses) return false; if (!ses.orden) { abrirPanel(saludo()); return true; } return false; },
    estaSentado: () => !!ses, sinApuro: () => !!ses && cantinaAbierta(hora()),
    // 3.9.1: la borrachera, el panel libre y lo que la peña necesita saber de tu mesa
    efectoEbrio: efectoEbrioAhora, nivelEbrio: nivelAhora, abrirPanelLibre, chiste,
    sentadoEn: () => (ses ? { mesa: ses.mesa, silla: ses.silla, fase: ses.fase } : null), ocupadaConVos: () => !!ses && ['viene', 'carta', 'a-barra', 'prepara', 'trae', 'deja', 'apoya', 'se-va'].includes(ses.fase) || !!limpieza,
    sirviendo, saludo, cartaHoy, sorbear, llamar, dibujar, pedirItem, saldar, soltar,
    // para las pruebas
    estado: () => ({ ses: ses ? { fase: ses.fase, parado: !!ses.parado, mesa: ses.mesa.id, silla: ses.silla.i, orden: ses.orden ? { item: ses.orden.item.id, fase: ses.orden.fase } : null } : null, limpieza: limpieza ? limpieza.fase : null,
      servidos: [...servidos.entries()].map(([k, v]) => ({ mesa: k, item: v.item.id, restantes: v.restantes })), controla: !!controla, panel: { ...estadoPanel }, sorbo: !!sorbo, info: { ...info } }),
    lugar: { mesas, sillas, barra, centro, paso, ruta, aMundo, rotMundo, pisoY },
    panel: estadoPanel,
  };
}
