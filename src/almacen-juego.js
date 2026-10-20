// 4.2: el almacenaje con tope, del lado del juego. almacen.js sabe los topes y las cuentas; esto pone la E, las notas, el pago de la
// construcción desde los depósitos de alrededor, la ampliación con pesos (mantener E, en dos pasos) y la devolución de lo guardado cuando
// se desarma la obra. main.js lo crea una sola vez con lo que necesita y lo usa en pocos lugares (ver «almacenJuego» ahí).
//   · guardar: E con materiales a mano los deja en el depósito (hasta el tope); sin nada a mano, E saca todo;
//   · pagar: mientras estés a menos de 18 m de un depósito, lo que construís se paga primero del acopio, después de los depósitos
//     (el más cercano primero) y por último de la mochila;
//   · desarmar: lo guardado vuelve a tus cosas (devolverContenido de main.js, que usan todos los caminos de desarmado, del viento, del desalojo);
//   · ampliar: mantener E (0,7 s) dice qué sube y cuánto cuesta; mantener E otra vez (entre 0,6 y 12 segundos después) lo paga y lo hace.
//   · sacar: Supr junto al depósito saca todo lo guardado, lleves lo que lleves (E, con algo a mano, guarda).
import { faltan, textoFaltan } from './construccion.js';
import { puedePagarEtapa, pagarEtapa, reintegroAlDesmontar, montoReintegroAlDesmontar, devolverEtapasPagadas, listaDeFaltantes, avisoSinPlata } from './obra-pesos.js';
import { hayEconomia } from './economia.js';
import { ALMACENES, IDS_ALMACEN, esAlmacen, esDeMateriales, sanearAlmacen, guardadoDe, totalGuardado, libreDe, guardar as guardarEn, sacar as sacarDe, resumen, pasoDeLlenura, pasoDe, proximaAmpliacion, ampliar as ampliarNivel, textoAmpliacion, idPrecioAmpliacion, topeDe, contenidoEnPalabras, nombreDe, cuantosDe } from './almacen.js';

const MIN_CONFIRMAR = 600, MAX_CONFIRMAR = 12000;

export function crearAlmacenJuego(d) {
  const sano = new WeakMap();
  const terminada = (o) => o.datos.etapas >= o.plano.etapas.length;
  const ahora = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  let pendiente = null;   // { obra, hora }: la ampliación que mostró su precio y espera la segunda vez que mantenés E

  // El estado de una obra, saneado la primera vez que se toca en la sesión (como datosDe de main.js)
  function estado(o) {
    if (sano.get(o.datos) !== true) { o.datos.almacen = sanearAlmacen(o.datos.almacen, o.plano.id); sano.set(o.datos, true); }
    return o.datos.almacen;
  }
  // Lo que cambia lo que se ve de una obra: si cambió, hay que rehacer la malla (una vez por golpe, no por cuadro)
  const firma = (o) => { const a = estado(o), id = o.plano.id; return `${a.n}|${pasoDeLlenura(id, a)}|${ALMACENES[id].guarda.map((k) => pasoDe(id, a, k) + (ALMACENES[id].tipo === 'herramienta' ? guardadoDe(a, k) : '')).join('')}`; };
  function refrescarSiCambio(o, antes) { if (firma(o) !== antes) d.obras()?.rehacer?.(o); }

  // Los depósitos de materiales terminados a menos de `radio` de vos, el más cercano primero
  function cerca(radio) {
    const obras = d.obras(), js = d.jugador()?.estado;
    if (!obras || !js) return [];
    const lista = [];
    for (const o of obras.obrasCerca(js.pos, radio, [])) {
      if (!esDeMateriales(o.plano.id) || !terminada(o) || o === obras.editando) continue;
      const dist = Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z);
      if (dist <= radio) lista.push({ o, dist });   // (el índice devuelve por celdas: se mide acá)
    }
    return lista.sort((p, q) => p.dist - q.dist).map((x) => x.o);
  }
  // 4.4.1: los depósitos con tope (de materiales y el silo; no el herramientero) a menos de `radio` de un punto —el local, no vos—, el más cercano primero
  function cercaDe(x, z, radio) {
    const obras = d.obras();
    if (!obras) return [];
    const lista = [];
    for (const o of obras.obrasCerca({ x, z }, radio, [])) {
      const D = ALMACENES[o.plano.id];
      if (!D || D.tipo === 'herramienta' || !terminada(o) || o === obras.editando) continue;
      const dist = Math.hypot(o.datos.x - x, o.datos.z - z);
      if (dist <= radio) lista.push({ o, dist });
    }
    return lista.sort((p, q) => p.dist - q.dist).map((e) => e.o);
  }
  // Lo que ve y puede sacar quien repone el local desde esos depósitos: { n (cuántos hay), hay(k), sacar(k, n) }
  function depositosDe(x, z, radio) {
    const deps = cercaDe(x, z, radio);
    return { n: deps.length, hay: (k) => (deps.length ? totales(deps)[k] || 0 : 0), sacar: (k, n) => (deps.length ? gastar(deps, k, n) : 0) };
  }
  // Lo guardado en esos depósitos, por material
  function totales(deps) {
    const t = {};
    for (const o of deps) { const a = estado(o); for (const k of ALMACENES[o.plano.id].guarda) { const n = guardadoDe(a, k); if (n) t[k] = (t[k] || 0) + n; } }
    return t;
  }
  // Gasta `n` de `k` de esos depósitos (el primero de la lista primero); devuelve cuánto sacó
  function gastar(deps, k, n) {
    let falta = n, sacado = 0;
    for (const o of deps) {
      if (falta <= 0) break;
      const a = estado(o), antes = firma(o);
      const x = sacarDe(o.plano.id, a, k, falta);
      if (x > 0) { falta -= x; sacado += x; refrescarSiCambio(o, antes); }
    }
    return sacado;
  }
  // «en depósitos 12/30/45»: para el panel de construcción
  function textoPanel(radio) {
    const t = totales(cerca(radio));
    return Object.keys(t).length ? ` · en depósitos ${t.tronco || 0}/${t.tabla || 0}/${t.piedra || 0}${t.lana ? `/${t.lana} de lana` : ''}` : '';
  }

  // ---------------------------------------------------------------- el aviso de la E
  function aviso(o) {
    const id = o.plano.id, D = ALMACENES[id], a = estado(o), r = resumen(id, a, { soloLoQueHay: true });
    if (D.tipo === 'herramienta') {
      const tengo = (k) => !!d.progreso().cosas?.[k];
      if (D.guarda.some((k) => tengo(k) && libreDe(id, a, k) > 0)) return `Colgar tus herramientas (${resumen(id, a)})`;
      if (D.guarda.some((k) => tengo(k) && !guardadoDe(a, k))) return `Sin ganchos libres (${resumen(id, a)})${proximaAmpliacion(id, a) ? ' · mantené E para ampliar' : ''}`;
      return `${D.nombre}: ${resumen(id, a)}`;
    }
    const lleva = D.guarda.filter((k) => (D.tipo === 'cosecha' ? d.cuantoHay(k) : d.material(k)) > 0);
    const cabe = lleva.some((k) => libreDe(id, a, k) > 0);
    if (cabe) return `Guardar en ${D.articulo} (${r})`;
    if (lleva.length) return `${D.nombre} ${D.f ? 'llena' : 'lleno'} (${r}) · Supr: sacar${proximaAmpliacion(id, a) ? ' · mantené E para ampliar' : ''}`;
    if (totalGuardado(id, a) > 0) return `Sacar ${D.del} (${r})`;
    return `${D.nombre} ${D.f ? 'vacía' : 'vacío'} (${resumen(id, a)})`;
  }

  // ---------------------------------------------------------------- la E
  function usar(o) {
    const id = o.plano.id, D = ALMACENES[id], a = estado(o), antes = firma(o), p = d.progreso();
    const cantidad = (n, k) => cuantosDe(n, k);
    if (D.tipo === 'herramienta') {
      const colgadas = [];
      for (const k of D.guarda) if (p.cosas?.[k] && guardarEn(id, a, k, 1)) colgadas.push(nombreDe(k, 1));
      if (colgadas.length) { d.sonido()?.juntar?.(); d.nota(`Colgaste: ${colgadas.join(', ')}`, `${resumen(id, a)}. Siguen a mano: es para tenerlas a la vista`, true); }
      else {
        const hay = D.guarda.filter((k) => guardadoDe(a, k));
        d.nota(`${D.nombre}: ${resumen(id, a)}`, hay.length ? `Colgado: ${hay.map((k) => nombreDe(k, 1)).join(', ')}` : 'Todavía no tenés ninguna herramienta para colgar');
      }
      refrescarSiCambio(o, antes); d.guardar();
      return true;
    }
    const enMano = (k) => (D.tipo === 'cosecha' ? d.cuantoHay(k) : d.material(k));
    const lleva = D.guarda.filter((k) => enMano(k) > 0);
    if (lleva.length) {
      const partes = [], sobra = [];
      for (const k of lleva) {
        const n = guardarEn(id, a, k, enMano(k));
        if (n > 0) { if (D.tipo === 'cosecha') d.sumarEntrada(k, -n); else d.sumarMaterial(k, -n); partes.push(cantidad(n, k)); }
        if (enMano(k) > 0 && libreDe(id, a, k) <= 0) sobra.push(nombreDe(k));
      }
      if (partes.length) {
        d.sonido()?.juntar?.();
        d.nota(`Guardaste en ${D.articulo}`, `${partes.join(' · ')}. ${resumen(id, a)}${sobra.length ? `. No entró el resto de ${sobra.join(' y ')}: está lleno` : ''}`, true);
      } else {
        const sig = proximaAmpliacion(id, a);
        d.nota(`${D.nombre} ${D.f ? 'llena' : 'lleno'}`, `${resumen(id, a)}. Supr saca lo guardado. ${sig ? `Mantené E para ampliarla: ${textoAmpliacion(id, a)}` : 'No se puede ampliar más: armá otro'}`, true);
      }
    } else if (totalGuardado(id, a) > 0) {
      const partes = [];
      for (const k of D.guarda) {
        const n = sacarDe(id, a, k);
        if (n > 0) { if (D.tipo === 'cosecha') d.sumarEntrada(k, n); else d.sumarMaterial(k, n); partes.push(cantidad(n, k)); }
      }
      d.sonido()?.juntar?.();
      d.nota(`Sacaste todo ${D.del}`, partes.join(' · '));
    } else {
      d.nota(`${D.nombre} ${D.f ? 'vacía' : 'vacío'}`, D.tipo === 'cosecha' ? `Traé habas, papas, frutillas o calafates y apretá E acá. ${resumen(id, a)}` : `Traé ${D.guarda.map((k) => nombreDe(k)).join(', ')} y apretá E acá. ${resumen(id, a)}`);
    }
    refrescarSiCambio(o, antes);
    d.refrescarBarra();
    d.guardar();
    return true;
  }

  // 4.4.2 (C7): sacar todo lo guardado sin que importe lo que llevás encima (con E, si llevabas algo que se guarda, se guardaba)
  function sacarTodo(o) {
    const id = o.plano.id, D = ALMACENES[id], a = estado(o), antes = firma(o);
    if (D.tipo === 'herramienta') { d.nota(`${D.nombre}: ${resumen(id, a)}`, 'Las herramientas colgadas siguen a mano: no hay nada que sacar'); return true; }
    if (totalGuardado(id, a) <= 0) { d.nota(`${D.nombre} ${D.f ? 'vacía' : 'vacío'}`, resumen(id, a)); return true; }
    const partes = [];
    for (const k of D.guarda) {
      const n = sacarDe(id, a, k);
      if (n > 0) { if (D.tipo === 'cosecha') d.sumarEntrada(k, n); else d.sumarMaterial(k, n); partes.push(cuantosDe(n, k)); }
    }
    d.sonido()?.juntar?.();
    d.nota(`Sacaste todo ${D.del}`, partes.join(' · '));
    refrescarSiCambio(o, antes);
    d.refrescarBarra();
    d.guardar();
    return true;
  }

  // ---------------------------------------------------------------- mantener E: ampliar
  function ampliar(o) {
    const id = o.plano.id, D = ALMACENES[id], a = estado(o), p = d.progreso();
    const sig = proximaAmpliacion(id, a);
    if (!sig) {
      pendiente = null;
      d.nota(`${D.nombre}: ya está al máximo`, `${resumen(id, a)}${D.ampliaciones.length ? '' : '. Esta no se amplía: para más lugar, armá un depósito techado'}`);
      return true;
    }
    const idp = idPrecioAmpliacion(id), pago = puedePagarEtapa(p, idp, sig.indice);
    const falta = faltan(sig.pide, d.materialesVisibles());
    if (falta.length || !pago.ok) {
      pendiente = null;
      if (!falta.length) { const av = avisoSinPlata(idp, pago, 2); d.nota('Falta plata para ampliar', av.detalle); }
      else d.nota('Falta para ampliar', textoFaltan(listaDeFaltantes(falta, pago)));
      return true;
    }
    const t = ahora();
    if (!pendiente || pendiente.obra !== o || t - pendiente.hora < MIN_CONFIRMAR || t - pendiente.hora > MAX_CONFIRMAR) {
      pendiente = { obra: o, hora: t };
      d.nota(`Ampliar ${D.articulo}`, `${textoAmpliacion(id, a)}. Mantené E otra vez para confirmar`, true);
      return true;
    }
    pendiente = null;
    const antes = firma(o);
    d.conMateriales((m) => { for (const [k, n] of Object.entries(sig.pide)) m[k] = Math.max(0, (m[k] || 0) - n); });
    pagarEtapa(p, idp, sig.indice, 'Los carpinteros de la aldea');
    ampliarNivel(id, a);
    refrescarSiCambio(o, antes);
    d.sonido()?.juntar?.();
    d.nota(`Ampliaste ${D.articulo}`, `Ahora guarda hasta ${topeDe(id, a)}${D.unidad ? ` ${D.unidad}` : ''}. ${resumen(id, a)}`, true);
    d.refrescarBarra();
    d.guardar();
    return true;
  }

  // ---------------------------------------------------------------- al desarmar
  // Lo guardado en la obra `datos`, en palabras (para la nota), sin tocar nada
  function contenido(datos) {
    if (!datos || !esAlmacen(datos.plano) || ALMACENES[datos.plano].tipo === 'herramienta') return '';
    return contenidoEnPalabras(datos.plano, sanearAlmacen(datos.almacen, datos.plano));
  }
  // Lo guardado vuelve a tus cosas (a la mochila las materiales, a lo juntado la cosecha); idempotente
  function devolver(datos) {
    if (!datos || !esAlmacen(datos.plano)) return '';
    const id = datos.plano, D = ALMACENES[id], a = sanearAlmacen(datos.almacen, id), partes = [];
    if (D.tipo !== 'herramienta') for (const k of D.guarda) {
      const n = guardadoDe(a, k);
      if (!n) continue;
      if (D.tipo === 'cosecha') d.sumarEntrada(k, n); else d.sumarMaterial(k, n);
      partes.push(cuantosDe(n, k));
    }
    datos.almacen = { n: a.n, g: {} };
    return partes.join(' · ');
  }
  // Lo pagado en ampliaciones vuelve en parte (la mitad) al desmontar la obra terminada
  function reintegro(datos) {
    if (!datos || !esAlmacen(datos.plano) || !hayEconomia(d.progreso())) return 0;
    const a = sanearAlmacen(datos.almacen, datos.plano);
    return a.n > 0 ? reintegroAlDesmontar(d.progreso(), idPrecioAmpliacion(datos.plano), a.n, a.n, 'Los carpinteros de la aldea') : 0;
  }

  // 4.4.2 (C3): el desalojo al cargar (no hay lugar para la obra) devuelve las ampliaciones enteras, no a la mitad: { pesos, materiales }
  function devolucionTotal(datos) {
    if (!datos || !esAlmacen(datos.plano)) return { pesos: 0, materiales: {} };
    const n = sanearAlmacen(datos.almacen, datos.plano).n, materiales = {};
    for (let i = 0; i < n; i++) for (const [k, c] of Object.entries(ALMACENES[datos.plano].ampliaciones[i]?.pide || {})) if (c > 0) materiales[k] = (materiales[k] || 0) + c;
    return { pesos: n > 0 ? devolverEtapasPagadas(d.progreso(), idPrecioAmpliacion(datos.plano), n) : 0, materiales };
  }
  // 4.4.2: lo mismo que reintegro(), sin cobrar (para avisar cuánto vuelve antes de desmontar)
  function reintegroPrevio(datos) {
    if (!datos || !esAlmacen(datos.plano) || !hayEconomia(d.progreso())) return 0;
    const a = sanearAlmacen(datos.almacen, datos.plano);
    return a.n > 0 ? montoReintegroAlDesmontar(idPrecioAmpliacion(datos.plano), a.n, a.n) : 0;
  }

  // Los materiales de las ampliaciones que hiciste, a la mitad (como los de cada etapa de una obra: lo que costó 1 no vuelve)
  function materialesDeAmpliaciones(datos) {
    if (!datos || !esAlmacen(datos.plano)) return {};
    const n = sanearAlmacen(datos.almacen, datos.plano).n, salida = {};
    for (let i = 0; i < n; i++) for (const [k, c] of Object.entries(ALMACENES[datos.plano].ampliaciones[i]?.pide || {})) if (c > 1) salida[k] = (salida[k] || 0) + Math.max(1, Math.floor(c * 0.5));
    return salida;
  }

  return { esAlmacen: esAlmacen, ids: IDS_ALMACEN, cerca, cercaDe, depositosDe, totales, gastar, textoPanel, aviso, usar, ampliar, sacarTodo, contenido, devolver, reintegro, reintegroPrevio, devolucionTotal, materialesDeAmpliaciones, estado };
}
