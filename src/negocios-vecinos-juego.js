// 4.4 · Comprar el negocio de un vecino y ser su socio, del lado del juego (las reglas están en negocios-vecinos.js, lo que dicen en negocios-vecinos-voces.js
// y lo que se ve en negocios-vecinos-mundo.js). Sólo en el Relax.
//   · se propone desde la charla con el dueño: «Hablar de su negocio» (en «Hacer juntos»): comprarlo, ser socio, cómo le va, retirar la caja o tu parte,
//     avisar que te retirás. Con el gerente del banco, «Hablar de negocios»: tus cuentas y quiénes venden;
//   · el vecino reacciona según la amistad y lo que le escuchaste de su historia (y, Lucrecia, el romance): se ofende, se niega, pide que antes sepas de
//     dónde viene, pide más plata, pone condiciones o acepta con gusto; se queda de empleado a sueldo o se va a pasar el día a la plaza;
//   · al comprar, un cartel nuevo junto a la puerta dice «de Bruno»; cada día un aviso cuenta lo que rindió cada negocio (a la caja, con tope);
//   · una página del cuaderno («Negocios y sociedades»).
// Todo corre por eventos y a un segundo: nada nuevo por cuadro.
import { formatoPesos } from './economia.js';
import { cambiarAmistad, sumarAmistadDe, puntosAmistad } from './vecindad.js';
import { VOCES } from './vecindad-voces.js';
import { etapaAmor } from './amor.js';
import { edificioEnMundo, puntosMundo, fijarDesvioRutina } from './aldea.js';
import { crearNegociosVecinosMundo } from './negocios-vecinos-mundo.js';
import {
  NEGOCIOS, IDS_NEGOCIOS, COMPRA, SOCIEDAD, CONSEJERO, TIPOS_QUE_VENDEN, negocioDeVecino, tuyoDe, negocioAbierto, hayNegocios, leerNegociosVecinos,
  esTuyo, esSocio, tusNegocios, tusSociedades, vecinosQueSeFueron, evaluarCompra, anotarRechazo, comprar, retirarCaja, visitar, cajasTotal, cajaDe, pasarDia, reaccionSocio,
  entrarSocio, avisarRetiro, cancelarRetiro, montosDeAporte, rangoDeAporte, porcentajeDe, gananciaBase, gananciaDelDia, resumenNegociosVecinos, diasParaPagarse,
} from './negocios-vecinos.js';
import { VOCES_NEGOCIO, VOZ_GERENTE } from './negocios-vecinos-voces.js';

export const RADIO_CARTELES = 70;
const llenar = (t, d = {}) => String(t).replace(/\{(\w+)\}/g, (_m, k) => (d[k] === undefined || d[k] === null ? '' : String(d[k])));
const pct = (n) => `${String(Math.round(n * 10) / 10).replace('.', ',')} %`;
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const plural = (n, uno, varios) => (n === 1 ? uno : varios);
// Lo que dice el juego mismo (no el vecino): los títulos y los avisos
const FRASES = {
  abre: '¿Qué querés saber?',
  cuanto: '¿Con cuánto querés entrar? Va de {min} a {max}: te toca un porcentaje de lo que gane el negocio por día.',
  secreto: 'Eso de cuánto vende se lo cuento a los amigos, no al primero que pregunta. Vení más seguido y hablamos.',
  yaEsTuyo: 'Ya es {tuyo}, ¿no te acordás? Preguntame lo que quieras.',
  noHay: 'Hoy no hay nada de eso para hablar.',
  credito: 'Descontando lo que ya habías puesto como socio ({credito}), te quedan {precio}.',
  sociosTope: 'Ya sos socio de {n} negocios, que es lo que se puede atender. Retirate de alguno primero.',
};

// `ctx`: progreso(), desafio(), escena() (el de three; sin él no hay cartel), altura(x, z), jugador() (el del juego: estado.pos), nota(t, sub, nueva), guardar(),
// refrescarBarra(), sonido(), nombre() (cómo te llama tu cartel; por defecto «Bruno»)
export function crearNegociosVecinosJuego(ctx) {
  const prog = () => ctx.progreso();
  const activo = () => !ctx.desafio?.() && hayNegocios(prog());
  const dia = () => Math.max(1, Math.floor(Number(prog().dia) || 1));
  const nombreTuyo = () => ctx.nombre?.() || 'Bruno';
  let mundo = null;
  const el = () => { if (!mundo) { const e = ctx.escena?.(); if (e) mundo = crearNegociosVecinosMundo({ escena: e }); } return mundo; };
  let acum = 1, acumCarteles = 9, idos = new Set();
  const voz = (id) => VOCES_NEGOCIO[NEGOCIOS[id].vecino];

  // el desvío de la rutina: el que se fue a otra cosa pasa el día (de 9 a 19, menos el domingo) en la plaza
  const refrescarIdos = () => { idos = new Set(activo() ? vecinosQueSeFueron(prog()) : []); };
  const fijarRutina = () => fijarDesvioRutina((persona, h, ds) => (idos.size > 0 && idos.has(persona) && h >= 9 && h < 19 && ds !== 6 ? 'plaza' : null));
  fijarRutina();

  // ---------------------------------------------------------------- lo que el vecino sabe de vos
  function contexto(id) {
    const N = NEGOCIOS[id], p = prog(), f = p.vecindad?.personas?.[N.vecino], puntos = puntosAmistad(N.vecino, p);
    return { puntos, hist: Math.max(0, Math.floor(Number(f?.hist) || 0)), histTotal: VOCES[N.vecino]?.historia?.partes?.length || 0, etapa: N.romance ? etapaAmor(N.vecino, p) : '', dia: dia(), compadre: puntos >= 140 };
  }

  // ---------------------------------------------------------------- el menú de la charla
  function opciones(clave) {
    if (!activo()) return [];
    if (clave === CONSEJERO) return [{ id: 'negocios:resumen', titulo: 'Hablar de negocios' }];
    const id = negocioDeVecino(clave);
    if (!id || !negocioAbierto(prog(), id)) return [];
    return [{ id: 'negocios', titulo: 'Hablar de su negocio' }];
  }
  function textoDeEstado(id) {
    const p = prog(), N = NEGOCIOS[id];
    const r = resumenNegociosVecinos(p, dia());
    if (esTuyo(p, id)) {
      const x = r.propios.find((q) => q.id === id);
      return `${cap(N.corto)} es ${tuyoDe(id)} desde el día ${x.desde}. Rinde unos ${formatoPesos(x.porDia)} por día; en la caja hay ${formatoPesos(x.caja)} de ${formatoPesos(x.tope)}.`;
    }
    if (esSocio(p, id)) {
      const x = r.socios.find((q) => q.id === id);
      return `Sos socio de ${N.corto} (${pct(x.pct)}): ${formatoPesos(x.porDia)} por día; tu parte en la caja, ${formatoPesos(x.caja)}.${x.aviso ? ` Te retirás el día ${x.aviso.sale}.` : ''}`;
    }
    const { min, max } = rangoDeAporte(id);
    return `${cap(N.nombre)}: precio de lista ${formatoPesos(N.precio)} (lo que pida depende de cómo se lleven). Como socio podés poner de ${formatoPesos(min)} a ${formatoPesos(max)}.`;
  }
  function submenuPrincipal(id) {
    const p = prog(), N = NEGOCIOS[id], lista = [];
    if (esTuyo(p, id)) {
      lista.push({ id: 'negocios:cuentas', titulo: 'Cómo viene el negocio' });
      const caja = cajaDe(p, id);
      if (caja > 0) lista.push({ id: 'negocios:caja', titulo: `Retirar la caja (${formatoPesos(caja)})` });
    } else {
      if (esSocio(p, id)) {
        const s = leerNegociosVecinos(p).socios[id], caja = cajaDe(p, id);
        lista.push({ id: 'negocios:cuentas', titulo: 'Cómo viene la sociedad' });
        if (caja > 0) lista.push({ id: 'negocios:caja', titulo: `Retirar mi parte (${formatoPesos(caja)})` });
        lista.push(s.aviso ? { id: 'negocios:seguir', titulo: 'Seguir de socio' } : { id: 'negocios:retiro', titulo: 'Avisar que me retiro' });
      } else {
        lista.push({ id: 'negocios:cuentas', titulo: 'Preguntarle cómo le va' });
        lista.push({ id: 'negocios:socio', titulo: 'Proponerle ser socio' });
      }
      lista.push({ id: 'negocios:comprar', titulo: `Comprarle ${N.corto}` });
    }
    lista.push({ id: 'volver', titulo: 'Mejor no' });
    return { tipo: 'negocios', texto: textoDeEstado(id), opciones: lista, i: 0 };
  }

  // ---------------------------------------------------------------- comprar
  function textoCompra(id, r, c) {
    const v = voz(id), N = NEGOCIOS[id];
    let t = v.compra[r.tipo];
    if (N.romance && v.romance && TIPOS_QUE_VENDEN.includes(r.tipo) && Object.hasOwn(v.romance, c.etapa)) t = v.romance[c.etapa];
    return llenar(t, { precio: formatoPesos(r.precio) });
  }
  function proponerCompra(id) {
    const p = prog(), N = NEGOCIOS[id], v = voz(id), c = contexto(id);
    visitar(p, id, dia());
    const e = evaluarCompra(p, id, c);
    if (e.motivo === 'tuyo') return { tipo: 'renglones', renglones: [llenar(FRASES.yaEsTuyo, { tuyo: tuyoDe(id) })] };
    if (e.motivo === 'espera') return { tipo: 'renglones', renglones: [v.espera] };
    if (!e.reaccion) return { tipo: 'renglones', renglones: [FRASES.noHay] };
    const r = e.reaccion, texto = textoCompra(id, r, c);
    if (!TIPOS_QUE_VENDEN.includes(r.tipo)) {
      // se niega o se ofende: no vuelve a hablarse del tema unos días; el ofendido, además, te tiene menos confianza
      if (r.tipo === 'ofendido' || r.tipo === 'se-niega') {
        anotarRechazo(p, id, r.tipo, dia());
        if (r.tipo === 'ofendido') cambiarAmistad(p, N.vecino, COMPRA.amistadOfendido, dia());
        ctx.guardar?.();
      }
      return { tipo: 'renglones', renglones: [texto], reaccion: r.tipo };
    }
    const renglones = [texto];
    if (e.credito > 0) renglones.push(llenar(FRASES.credito, { credito: formatoPesos(e.credito), precio: formatoPesos(e.precio) }));
    if (e.motivo === 'dinero') { renglones.push(llenar(v.sinPlata, { faltan: formatoPesos(e.faltan) })); return { tipo: 'renglones', renglones, reaccion: r.tipo }; }
    // el trato está a un paso: la última palabra es tuya
    return { tipo: 'menu', sub: { tipo: 'negocios', texto: renglones.join(' '), opciones: [{ id: 'negocios:cerrar', titulo: `Cerrar el trato: ${formatoPesos(e.precio)}` }, { id: 'volver', titulo: 'Pensarlo' }], i: 0 } };
  }
  function cerrarCompra(id) {
    const p = prog(), N = NEGOCIOS[id], v = voz(id), c = contexto(id);
    const r = comprar(p, id, c);
    if (!r.ok) {
      if (r.motivo === 'dinero') return { tipo: 'renglones', renglones: [llenar(v.sinPlata, { faltan: formatoPesos(r.faltan || 0) })] };
      return { tipo: 'renglones', renglones: [FRASES.noHay] };
    }
    sumarAmistadDe(p, N.vecino, COMPRA.amistadAlCerrar, dia());
    refrescarIdos();
    ponerCartel(id);
    ctx.sonido?.()?.anotar?.();
    ctx.nota?.(`${cap(N.nombre)} ahora es ${tuyoDe(id)}`, `Pagaste ${formatoPesos(r.precio)} · rinde unos ${formatoPesos(r.ganancia)} por día · cada tanto pasá a retirar la caja`, true);
    ctx.refrescarBarra?.();
    ctx.guardar?.();
    return { tipo: 'renglones', renglones: [...(v.cierre[r.destino] || v.cierre.queda)], comprado: id };
  }

  // ---------------------------------------------------------------- las cuentas y la caja
  function cuentas(id) {
    const p = prog(), N = NEGOCIOS[id], v = voz(id), c = contexto(id), d = dia();
    visitar(p, id, d);
    if (!esTuyo(p, id) && !esSocio(p, id) && c.puntos < 50) return { tipo: 'renglones', renglones: [FRASES.secreto] };
    const g = gananciaDelDia(id, d - 1);
    const renglones = [llenar(v.cuentas, { ventas: formatoPesos(g.ventas), neto: formatoPesos(g.neto) })];
    const r = resumenNegociosVecinos(p, d);
    const x = r.propios.find((q) => q.id === id);
    if (x) {
      const partes = [`En un día corriente rinde unos ${formatoPesos(gananciaBase(id))}`];
      if (x.cartera < 1) partes.push(`como tenés varios negocios, tu atención se reparte y te queda el ${Math.round(x.cartera * 100)} %`);
      partes.push(`la caja tiene ${formatoPesos(x.caja)} (guarda hasta ${formatoPesos(x.tope)})`);
      if (x.sinVer > COMPRA.gestion.gracia) partes.push(`hace ${x.sinVer} días que no pasabas: rinde el ${Math.round(x.gestion * 100)} %`);
      renglones.push(`${cap(partes.join('; '))}.`);
      renglones.push(x.destino === 'se-va' ? `${N.dueno} se fue a otra cosa y atiende alguien del pueblo por ${formatoPesos(N.sueldo)} al día; con la cara nueva, se vende un poco menos.` : `${N.dueno} sigue atendiendo, a sueldo: ${formatoPesos(N.sueldo)} por día.`);
    }
    const s = r.socios.find((q) => q.id === id);
    if (s) renglones.push(`Tu parte (${pct(s.pct)}) son unos ${formatoPesos(s.porDia)} por día; en la caja hay ${formatoPesos(s.caja)}. Llevás ${s.dias} ${plural(s.dias, 'día', 'días')} de socio: si te retiraras hoy te devolverían ${formatoPesos(s.devolucion)} del aporte.`);
    return { tipo: 'renglones', renglones };
  }
  function sacarCaja(id) {
    const p = prog(), v = voz(id), r = retirarCaja(p, id, dia());
    if (!r.ok) return { tipo: 'renglones', renglones: [v.vacia] };
    ctx.sonido?.()?.anotar?.();
    ctx.refrescarBarra?.();
    ctx.guardar?.();
    return { tipo: 'renglones', renglones: [llenar(v.caja, { monto: formatoPesos(r.monto) })] };
  }

  // ---------------------------------------------------------------- la sociedad
  function proponerSocio(id) {
    const p = prog(), N = NEGOCIOS[id], v = voz(id), c = contexto(id);
    const lib = reaccionSocio(id, c);
    if (lib.tipo === 'rechaza') return { tipo: 'renglones', renglones: [v.socio.rechaza] };
    if (lib.tipo === 'resiste') return { tipo: 'renglones', renglones: [v.socio.resiste] };
    if (tusSociedades(p).length >= SOCIEDAD.maxSocios) return { tipo: 'renglones', renglones: [llenar(FRASES.sociosTope, { n: SOCIEDAD.maxSocios })] };
    const montos = montosDeAporte(id), { min, max } = rangoDeAporte(id);
    const opc = montos.map((m) => {
      const pc = porcentajeDe(id, m, lib.factor);
      return { id: `negocios:socio:${m}`, titulo: `Poner ${formatoPesos(m)} · ${pct(pc)}` };
    });
    opc.push({ id: 'volver', titulo: 'Pensarlo' });
    return { tipo: 'menu', sub: { tipo: 'negocios', texto: llenar(FRASES.cuanto, { min: formatoPesos(min), max: formatoPesos(max) }) + ` ${N.dueno} te lo da por ${lib.factor === 1 ? 'compadre' : 'amigo'}: ${pct(porcentajeDe(id, max, lib.factor))} como máximo.`, opciones: opc, i: 0 } };
  }
  function ponerPlata(id, monto) {
    const p = prog(), N = NEGOCIOS[id], v = voz(id), c = contexto(id);
    const r = entrarSocio(p, id, monto, c);
    if (!r.ok) {
      if (r.motivo === 'dinero') return { tipo: 'renglones', renglones: [llenar(v.sinPlata, { faltan: formatoPesos(r.faltan || 0) })] };
      return { tipo: 'renglones', renglones: [FRASES.noHay] };
    }
    sumarAmistadDe(p, N.vecino, 2, dia());
    ctx.sonido?.()?.anotar?.();
    ctx.nota?.(`Sos socio de ${N.corto}`, `Pusiste ${formatoPesos(r.aporte)} · te toca el ${pct(r.pct)}: unos ${formatoPesos(r.porDia)} por día`, true);
    ctx.refrescarBarra?.();
    ctx.guardar?.();
    return { tipo: 'renglones', renglones: [llenar(v.socio.acepta, { pct: pct(r.pct), aporte: formatoPesos(r.aporte) }), ...v.socio.cierre, `Tu parte va a una caja con tope de ${formatoPesos(r.tope)}: pasá a retirarla.`], socio: id };
  }
  function avisarYRetirar(id) {
    const p = prog(), v = voz(id), r = avisarRetiro(p, id, dia());
    if (!r.ok) return { tipo: 'renglones', renglones: [FRASES.noHay] };
    ctx.guardar?.();
    return { tipo: 'renglones', renglones: [llenar(v.retiro.aviso, { dia: r.sale }), `Se hace efectivo el día ${r.sale}: seguís cobrando tu parte hasta entonces y te devuelven unos ${formatoPesos(r.devolucion)} del aporte (cuantos más días de socio, más del aporte vuelve).`] };
  }
  function seguirDeSocio(id) {
    const p = prog(), v = voz(id);
    if (!cancelarRetiro(p, id)) return { tipo: 'renglones', renglones: [FRASES.noHay] };
    ctx.guardar?.();
    return { tipo: 'renglones', renglones: [v.retiro.cancela] };
  }

  // ---------------------------------------------------------------- el gerente
  function resumenGerente() {
    const p = prog(), r = resumenNegociosVecinos(p, dia()), renglones = [VOZ_GERENTE.intro];
    if (!r.hay) renglones.push(VOZ_GERENTE.sinNada);
    else {
      renglones.push(VOZ_GERENTE.conAlgo);
      for (const x of r.propios) renglones.push(`${cap(x.nombre)}: ${tuyoDe(x.id)}, rinde unos ${formatoPesos(x.porDia)} por día; en la caja, ${formatoPesos(x.caja)}${x.llena ? ' (llena)' : ''}.`);
      for (const x of r.socios) renglones.push(`${cap(x.nombre)}: sos socio (${pct(x.pct)}), ${formatoPesos(x.porDia)} por día; tu parte en la caja, ${formatoPesos(x.caja)}${x.aviso ? `; te retirás el día ${x.aviso.sale}` : ''}.`);
      renglones.push(`En total rinden unos ${formatoPesos(r.porDia)} por día y hay ${formatoPesos(r.caja)} esperándolo en las cajas.`);
      renglones.push(VOZ_GERENTE.recomendacion);
      if (r.propios.some((x) => x.llena) || r.socios.some((x) => x.caja >= x.tope)) renglones.push(VOZ_GERENTE.cajaLlena);
    }
    const libres = IDS_NEGOCIOS.filter((id) => !esTuyo(p, id) && negocioAbierto(p, id));
    if (libres.length) renglones.push(`En el pueblo hay ${libres.length} ${plural(libres.length, 'negocio con dueño', 'negocios con dueño')}: ${libres.map((id) => NEGOCIOS[id].corto).join(', ')}. De lista, desde ${formatoPesos(Math.min(...libres.map((id) => NEGOCIOS[id].precio)))}.`);
    return { tipo: 'renglones', renglones };
  }

  // ---------------------------------------------------------------- elegir
  function elegir(s, id) {
    if (!activo()) return { tipo: 'menu' };
    if (id === 'negocios:resumen') return s.clave === CONSEJERO ? resumenGerente() : { tipo: 'menu' };
    const nid = negocioDeVecino(s.clave);
    if (!nid || !negocioAbierto(prog(), nid)) return { tipo: 'menu' };
    if (id === 'negocios') { visitar(prog(), nid, dia()); return { tipo: 'menu', sub: submenuPrincipal(nid) }; }
    const [, accion, arg] = String(id).split(':');
    switch (accion) {
      case 'comprar': return proponerCompra(nid);
      case 'cerrar': return cerrarCompra(nid);
      case 'cuentas': return cuentas(nid);
      case 'caja': return sacarCaja(nid);
      case 'socio': return arg ? ponerPlata(nid, Number(arg)) : proponerSocio(nid);
      case 'retiro': return avisarYRetirar(nid);
      case 'seguir': return seguirDeSocio(nid);
      default: return { tipo: 'menu' };
    }
  }

  // ---------------------------------------------------------------- el cartel nuevo
  function lugarCartel(id) {
    const e = edificioEnMundo(id), pu = puntosMundo(id).puerta;
    if (!e || !pu) return null;
    const c = Math.cos(e.rot), s = Math.sin(e.rot), dx = 2.1, dz = 0.7;
    const x = pu.x + dx * c + dz * s, z = pu.z - dx * s + dz * c;
    const h = ctx.altura?.(x, z);
    return { x, z, y: Number.isFinite(h) ? h : e.y, giro: e.rot, cx: e.x, cz: e.z };
  }
  function ponerCartel(id) {
    const m = el(), l = m ? lugarCartel(id) : null;
    if (!m || !l) return false;
    m.ponerCartel(id, l.x, l.y, l.z, l.giro, NEGOCIOS[id].rotulo, `de ${nombreTuyo()}`);
    return true;
  }
  function ponerCarteles() {
    const p = prog(), tuyos = new Set(tusNegocios(p));
    const m = el();
    if (!m) return;
    for (const id of tuyos) if (!m.cartel(id)) ponerCartel(id);
    for (const id of m.carteles()) if (!tuyos.has(id)) m.quitarCartel(id);
  }

  // ---------------------------------------------------------------- el aviso de cada día
  function avisarDia(r) {
    if (!r) return;
    const partes = [], N = NEGOCIOS;
    const rindio = r.propios.filter((x) => x.neto > 0);
    if (r.dias > 1) partes.push(`En ${r.dias} días`);
    const t = r.total;
    if (t > 0) {
      const titulo = r.propios.length === 1 && !r.socios.length ? `${cap(N[r.propios[0].id].corto)} rindió ${formatoPesos(t)}` : `Tus negocios rindieron ${formatoPesos(t)}`;
      const llenas = [...r.propios.filter((x) => x.llena).map((x) => N[x.id].corto), ...r.socios.filter((x) => x.caja >= topeDeSocio(x.id)).map((x) => N[x.id].corto)];
      const sub = `${r.dias > 1 ? `En ${r.dias} días · ` : r.dias === 1 ? 'Ayer · ' : ''}Hay ${formatoPesos(cajasTotal(prog()))} esperando en las cajas${llenas.length ? ` · LLENA: ${llenas.join(', ')} (lo que pase del tope se pierde)` : ''}`;
      ctx.sonido?.()?.anotar?.();
      ctx.nota?.(titulo, sub, true);
    } else if (rindio.length === 0 && r.propios.length && !r.retiros.length && cajasTotal(prog()) > 0) {
      ctx.nota?.('Tus cajas están llenas', 'No entra más: pasá a retirarlas.', true);
    }
    for (const x of r.retiros) {
      ctx.sonido?.()?.anotar?.();
      ctx.nota?.(`Te retiraste de la sociedad de ${N[x.id].corto}`, `Cobraste ${formatoPesos(x.devuelto)} del aporte y ${formatoPesos(x.caja)} de tu parte`, true);
    }
    ctx.refrescarBarra?.();
    ctx.guardar?.();
  }

  // ---------------------------------------------------------------- el reloj del sistema
  function actualizar(dt) {
    if (!activo()) return;
    acum += dt; acumCarteles += dt;
    if (acumCarteles >= 1) {
      acumCarteles = 0;
      const m = mundo, js = ctx.jugador?.()?.estado;
      if (m && js) for (const id of m.carteles()) { const l = lugarCartel(id); if (l) m.verCartel(id, Math.hypot(js.pos.x - l.cx, js.pos.z - l.cz) < RADIO_CARTELES); }
    }
    if (acum < 1) return;
    acum = 0;
    if (!mundo || mundo.carteles().length !== tusNegocios(prog()).length) { ponerCarteles(); refrescarIdos(); }
    avisarDia(pasarDia(prog(), dia()));
  }
  function alCargar() { acum = 1; acumCarteles = 9; refrescarIdos(); ponerCarteles(); }

  // ---------------------------------------------------------------- el cuaderno
  function paginaCuaderno() {
    const p = prog(), r = resumenNegociosVecinos(p, dia());
    return {
      id: 'negocios-vecinos', nombre: 'Negocios y sociedades',
      marca: r.propios.length || r.socios.length ? `${r.propios.length} ${plural(r.propios.length, 'negocio', 'negocios')}${r.socios.length ? ` · ${r.socios.length} ${plural(r.socios.length, 'sociedad', 'sociedades')}` : ''}` : 'sin negocios',
      pendiente: !r.hay,
      dibujar(ficha, e) {
        ficha.appendChild(e('h2', '', 'Negocios y sociedades'));
        if (!r.hay) ficha.appendChild(e('p', 'texto', 'Todavía no tenés ningún negocio ni sociedad. Hablá con el dueño de un local (el almacén, la casa de té, la cantina, la panadería, la herrería, la pescadería, la hilandería o la sala de miel) y elegí «Hablar de su negocio»: podés comprárselo o ser su socio. Lo que pida depende de cuánto te conozca y de cuánto de su historia le hayas escuchado.'));
        else {
          ficha.appendChild(e('p', 'anotado', `Rinden unos ${formatoPesos(r.porDia)} por día · ${formatoPesos(r.caja)} esperando en las cajas · ${formatoPesos(r.total.ganado)} ganado en total`));
          ficha.appendChild(e('p', 'pista', 'Pasá por los locales a retirar la caja: tiene tope (diez días de ganancia) y, si hace muchos días que no aparecés, el negocio rinde menos.'));
        }
        for (const x of r.propios) {
          ficha.appendChild(e('h3', '', cap(x.nombre)));
          ficha.appendChild(e('p', 'texto', `${cap(tuyoDe(x.id))} desde el día ${x.desde} (pagaste ${formatoPesos(x.pagado)}). ${x.destino === 'se-va' ? `${x.dueno} se fue a otra cosa y atiende alguien del pueblo` : `${x.dueno} sigue atendiendo, a sueldo`} (${formatoPesos(x.sueldo)} por día). Rinde unos ${formatoPesos(x.porDia)} por día${x.cartera < 1 ? ` (con ${r.propios.length} negocios, tu atención se reparte: ${Math.round(x.cartera * 100)} %)` : ''}.`));
          ficha.appendChild(e('p', x.llena || x.sinVer > COMPRA.gestion.gracia ? 'pista' : 'anotado', `Caja: ${formatoPesos(x.caja)} de ${formatoPesos(x.tope)}${x.llena ? ' (llena: se pierde lo que sigue entrando)' : ''}${x.sinVer > COMPRA.gestion.gracia ? ` · hace ${x.sinVer} días que no pasás: rinde el ${Math.round(x.gestion * 100)} %` : ''} · te dejó ${formatoPesos(x.total)} hasta ahora.`));
        }
        for (const x of r.socios) {
          ficha.appendChild(e('h3', '', `Socio de ${x.nombre}`));
          ficha.appendChild(e('p', 'texto', `Desde el día ${x.desde}: pusiste ${formatoPesos(x.aporte)} y te toca el ${pct(x.pct)} (unos ${formatoPesos(x.porDia)} por día). Si te retiraras hoy te devolverían ${formatoPesos(x.devolucion)} del aporte.`));
          ficha.appendChild(e('p', x.aviso ? 'pista' : 'anotado', `Tu parte en la caja: ${formatoPesos(x.caja)} de ${formatoPesos(x.tope)}${x.aviso ? ` · avisaste que te retirás: se hace el día ${x.aviso.sale}` : ''}.`));
        }
        if (r.historial.length) {
          ficha.appendChild(e('h3', '', 'Últimos movimientos'));
          const ul = e('ul', 'habilidades');
          const TXT = { compra: 'compraste', caja: 'retiraste la caja de', parte: 'retiraste tu parte de', socio: 'te hiciste socio de', retiro: 'te retiraste de' };
          for (const h of r.historial.slice(0, 8)) ul.appendChild(e('li', '', `Día ${h.dia} · ${TXT[h.tipo] || h.tipo} ${NEGOCIOS[h.local].corto}: ${formatoPesos(Math.abs(h.monto))}`));
          ficha.appendChild(ul);
        }
        const libres = IDS_NEGOCIOS.filter((id) => !esTuyo(p, id) && !esSocio(p, id) && negocioAbierto(p, id));
        if (libres.length) {
          ficha.appendChild(e('h3', '', 'Para comprar o asociarse'));
          const ul = e('ul', 'habilidades');
          for (const id of libres) ul.appendChild(e('li', '', `${cap(NEGOCIOS[id].nombre)}: de lista ${formatoPesos(NEGOCIOS[id].precio)} · se paga solo en unos ${diasParaPagarse(id)} días`));
          ficha.appendChild(ul);
        }
      },
    };
  }
  function topeDeSocio(id) { return leerNegociosVecinos(prog())?.socios?.[id] ? resumenNegociosVecinos(prog(), dia()).socios.find((q) => q.id === id)?.tope || 0 : 0; }

  refrescarIdos();
  return {
    opciones, elegir, actualizar, alCargar, paginaCuaderno,
    mundo: () => mundo, lugarCartel, ponerCarteles, contexto, resumen: () => resumenNegociosVecinos(prog(), dia()),
    // para las pruebas y las capturas
    _submenu: submenuPrincipal, _cerrar: cerrarCompra, _avisarDia: avisarDia, _idos: () => [...idos], _refrescarIdos: refrescarIdos, _fijarRutina: fijarRutina,
  };
}
