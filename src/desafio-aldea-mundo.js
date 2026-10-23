// 4.9 dias: el tablón de la aldea, en el mundo (las reglas están en desafio-aldea.js y desafio-pronostico.js).
//
// Un tablón de madera junto a la base, con una hoja clavada por cada vecino que pidió algo (se ven desde lejos:
// cuando falta algo por entregar, hay hojas). Con E al lado se abre el cuaderno en la pestaña «La aldea», que tiene:
//   · los pedidos de hoy, con lo que cuesta cada uno, el regalito y el plazo, y el botón de entregar (sólo funciona
//     parado junto al tablón);
//   · la noche que viene: qué trae y por qué lado entran, según lo que tengas (ver desafio-pronostico.js), y el
//     punto de entrada marcado en el mapa de papel.
// Una malla, cuatro hojas y nada por cuadro: cada segundo se revisan los pedidos y se acomoda lo que se ve.
import * as THREE from 'three';
import { lam } from './vida.js';
import { hashTexto } from './semilla.js';
import { VECINOS_AYUDA, VECINOS, NIVEL_MAX, DESDE_NOCHE, GRACIAS, AYUDA_NIVEL, revisarPedidos, entregarYCobrar, puedeEntregar, pedidosActivos, quedaHoras, textoPedido, textoCosas, vencido } from './desafio-aldea.js';
import { armarPronostico } from './desafio-pronostico.js';

export const RADIO_TABLON = 3.6;       // a esta distancia del tablón, E lo abre
const LEJOS = 170;                     // más lejos que esto no se dibuja
const COLOR_HOJA = { anselmo: '#e9dcb8', herminia: '#ecd0d6', martin: '#cfdbe8', chicos: '#e8e5a8' };

// `ctx`: { D, progreso, nota, guardar, sonido, cuanto, gastar, sumarMaterial, base, libre, plan, meteo, tiene, hayBlanco,
//         activo, redibujar, posJugador }
export function crearAldeaMundo(T, escena, ctx) {
  const grupo = new THREE.Group();
  grupo.name = 'tablon-aldea';
  grupo.visible = false;
  escena.add(grupo);
  const sitio = { x: 0, z: 0, listo: false, clave: '' };
  const hojas = {};
  let reloj = 0;

  // ------------------------------------------------------------ la malla
  function armar() {
    const madera = lam('#6a5036'), oscura = lam('#4c3924');
    const parte = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = false; grupo.add(m); return m; };
    for (const sx of [-1, 1]) parte(new THREE.CylinderGeometry(0.07, 0.09, 2.5, 6), oscura, sx * 1.05, 1.25, 0);
    parte(new THREE.BoxGeometry(2.3, 1.3, 0.1), madera, 0, 1.55, 0);
    for (const y of [1.2, 1.55, 1.9]) parte(new THREE.BoxGeometry(2.3, 0.05, 0.12), oscura, 0, y, 0.005);   // los listones
    const techo = parte(new THREE.BoxGeometry(2.7, 0.08, 0.9), oscura, 0, 2.38, -0.1);
    techo.rotation.x = -0.22;
    VECINOS_AYUDA.forEach((k, i) => {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.012), lam(COLOR_HOJA[k]));
      h.position.set(-0.78 + i * 0.52, 1.55 + (i % 2 ? 0.1 : -0.05), 0.07);
      h.rotation.z = (i - 1.5) * 0.07;
      h.visible = false; h.castShadow = false;
      grupo.add(h); hojas[k] = h;
    });
  }
  armar();

  // ------------------------------------------------------------ dónde está
  function lugarValido(x, z) {
    if (T.agua(x, z)) return false;
    if ((T.pendiente?.[T.indice(x, z)] ?? 0) > 0.28) return false;
    for (const l of Object.values(T.lugares || {})) if (Number.isFinite(l?.x) && Math.hypot(l.x - x, l.z - z) < (l.radio || 4) + 2) return false;
    return ctx.libre(x, z);
  }
  function ubicar() {
    const b = ctx.base();
    const radio = Math.min(14, (b.radio || 5) + 6);   // (el refugio no trae radio: la cabaña llega a unos 6 m)
    const a0 = (hashTexto(`tablon|${ctx.D().semilla || ''}|${Math.round(b.x)}|${Math.round(b.z)}`) % 628) / 100;
    let punto = null;
    for (let r = radio; r <= radio + 6 && !punto; r += 3) {
      for (let i = 0; i < 24 && !punto; i++) {
        const a = a0 + i * (Math.PI * 2 / 24), x = b.x + Math.sin(a) * r, z = b.z + Math.cos(a) * r;
        if (lugarValido(x, z)) punto = { x, z };
      }
    }
    if (!punto) punto = { x: b.x + radio * 0.7, z: b.z + radio * 0.7 };
    sitio.x = punto.x; sitio.z = punto.z; sitio.listo = true; sitio.clave = `${Math.round(b.x)},${Math.round(b.z)}`;
    grupo.position.set(sitio.x, T.altura(sitio.x, sitio.z) - 0.03, sitio.z);
    grupo.rotation.y = Math.atan2(b.x - sitio.x, b.z - sitio.z);   // de frente a la base
  }
  const cerca = (pos) => sitio.listo && !!pos && Math.hypot(pos.x - sitio.x, pos.z - sitio.z) < RADIO_TABLON;

  // ------------------------------------------------------------ cada segundo
  function contexto() {
    const p = ctx.progreso(), d = ctx.D();
    return { dia: p.dia, horas: p.horas, oleadas: d.oleadas || 0, semilla: d.semilla, activo: ctx.activo(), sinAliados: Array.isArray(d.meta?.reglas) && d.meta.reglas.includes("sinAliados") };
  }
  function revisar() {
    const d = ctx.D();
    if (!d.aldea) return;
    const eventos = revisarPedidos(d.aldea, contexto());
    const nuevos = eventos.filter((e) => e.tipo === 'nuevo'), vencidos = eventos.filter((e) => e.tipo === 'vencio');
    if (nuevos.length) {
      const nombres = nuevos.map((e) => VECINOS[e.clave].nombre);
      const lista = nombres.length === 1 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
      ctx.nota(nuevos.length === 1 ? `${nombres[0]} pide algo` : 'La aldea pide cosas', `${lista} ${nuevos.length === 1 ? 'dejó' : 'dejaron'} su pedido en el tablón de la base. Hasta que caiga la noche`, true);
    }
    if (vencidos.length) ctx.nota('Se pasó el plazo de los pedidos', 'Mañana vuelven a pedir. No pasa nada: sólo ese día no sumaron ayuda');
    if (eventos.length) ctx.guardar();
  }
  function acomodar(pos) {
    const b = ctx.base();
    if (!sitio.listo || sitio.clave !== `${Math.round(b.x)},${Math.round(b.z)}` || !ctx.libre(sitio.x, sitio.z)) ubicar();   // si una obra quedó encima, se corre
    const lejos = pos ? Math.hypot(pos.x - sitio.x, pos.z - sitio.z) > LEJOS : false;
    grupo.visible = !lejos;
    const p = ctx.progreso(), d = ctx.D();
    for (const k of VECINOS_AYUDA) hojas[k].visible = !!d.aldea?.pedidos?.[k] && !vencido(d.aldea.pedidos[k], p.dia, p.horas);
  }
  function actualizar(dt, js) {
    reloj -= dt;
    if (reloj > 0) return;
    reloj = 1;
    revisar();
    acomodar(js?.pos);
  }

  // ------------------------------------------------------------ la E
  function avisoCerca(pos) {
    if (!cerca(pos)) return null;
    const p = ctx.progreso(), n = pedidosActivos(ctx.D().aldea, p.dia, p.horas).length;
    return n ? `Mirar el tablón de la aldea (${n} ${n === 1 ? 'pedido' : 'pedidos'}) y la noche que viene` : 'Mirar el tablón de la aldea: la noche que viene';
  }
  const usarCerca = (pos) => { if (!cerca(pos)) return false; ctx.abrirTablon(); return true; };

  // ------------------------------------------------------------ entregar
  function entregarPedido(clave) {
    const d = ctx.D(), p = ctx.progreso();
    if (!d.aldea) return { ok: false };
    if (!cerca(ctx.posJugador())) { ctx.nota('Entregalo en el tablón', 'Parate junto al tablón de la base y volvé a abrirlo con E'); return { ok: false, razon: 'lejos' }; }
    const r = entregarYCobrar(d, clave, { dia: p.dia, horas: p.horas, cuanto: (k) => ctx.cuanto(k), gastar: (k, n) => ctx.gastar(k, n), sumarMaterial: (k, n) => ctx.sumarMaterial(k, n) });
    if (!r.ok) {
      if (r.razon === 'falta') ctx.nota('Te falta para ese pedido', `Faltan ${textoCosas(r.falta)}`);
      else if (r.razon === 'vencido') ctx.nota('Se pasó el plazo', 'Mañana vuelve a pedir');
      return r;
    }
    const extra = Object.keys(r.regalo || {});
    ctx.sonido?.juntar?.();
    const voz = GRACIAS[clave][Math.min(1, r.nivel - 1)];
    ctx.nota(`${VECINOS[clave].nombre}: ${r.nivel >= NIVEL_MAX ? 'ahora te ayuda a pleno' : 'ahora te ayuda'}`,
      `“${voz}”${extra.length ? ` Te dejó ${textoCosas(Object.fromEntries(Object.entries(r.regalo)))}.` : ''}`, true);
    ctx.guardar();
    return r;
  }

  // ------------------------------------------------------------ el pronóstico (lo de la pestaña y la marca del mapa)
  function pronostico() {
    const p = ctx.progreso();
    return armarPronostico({ d: ctx.D(), meteo: ctx.meteo(), dia: p.dia, horas: p.horas, base: ctx.base(), plan: ctx.plan, tiene: ctx.tiene(), hayBlanco: !!ctx.hayBlanco() });
  }
  const marcaMapa = () => { try { return pronostico().marca; } catch { return null; } };

  // ------------------------------------------------------------ la trampa de miel en el camino de los duendes
  // Los duendes bajan en el punto de entrada del lado y van derecho a la base: la trampa se arma sobre esa línea, a
  // unos 18 m de la base o más (cerca de las defensas, donde podés tirarles mientras están pegados). La construye la
  // rama de las defensas (`colocarTrampaMiel`); si el juego no la tiene, no se ofrece (respaldo).
  const TRAMPA = { distancias: [18, 24, 30], desvios: [0, 3.5, -3.5, 7, -7] };
  const hayTrampa = () => typeof ctx.colocarTrampa === 'function' && !!ctx.hayTrampa?.();
  function ponerTrampa(lado) {
    if (!hayTrampa() || !lado) return { ok: false, motivo: 'No hay trampa de miel' };
    if (!cerca(ctx.posJugador())) { ctx.nota('Armala desde el tablón', 'Parate junto al tablón de la base: las trampas también se arman a mano, desde el menú de obra'); return { ok: false, motivo: 'lejos' }; }
    const b = ctx.base(), dx = lado.x - b.x, dz = lado.z - b.z, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
    let ultimo = null;
    for (const dist of TRAMPA.distancias) {
      for (const des of TRAMPA.desvios) {
        const r = ctx.colocarTrampa(b.x + ux * dist - uz * des, b.z + uz * dist + ux * des);
        if (r?.ok) {
          ctx.nota('Trampa de miel armada', `En el camino de ${lado.nombre}, a unos ${dist} m de la base: los duendes que pasen por ahí quedan pegados`, true);
          ctx.guardar();
          return { ...r, dist };
        }
        ultimo = r;
        if (/^Falta/.test(r?.motivo || '')) { ctx.nota('No alcanza para la trampa', r.motivo); return r; }   // sin tablas o sin miel: no sirve seguir probando lugares
      }
    }
    ctx.nota('No encontré dónde armarla', ultimo?.motivo || 'No hay un lugar parejo en ese camino. Probá a mano, desde el menú de obra');
    return ultimo || { ok: false };
  }
  function botonTrampa(caja, n, el, aqui) {
    if (!n.lado || !hayTrampa()) return;
    const falta = ctx.cuanto('tabla') < 2 ? 'tablas' : ctx.cuanto('miel') < 1 ? 'un frasco de miel' : null;
    const b = el('button', 'boton-lamina', falta ? `Para una trampa de miel te faltan ${falta}` : `Armar una trampa de miel en el camino de ${n.lado.nombre}`);
    b.disabled = !aqui || !!falta;
    b.addEventListener('click', () => { ponerTrampa(n.lado); ctx.redibujar(); });
    caja.appendChild(b);
    caja.appendChild(el('p', 'pista', aqui ? 'Cuesta 2 tablas y un frasco de miel. También podés armarla a mano, donde creas que van a pasar.' : 'Se arma parado junto al tablón de la base.'));
  }

  // ------------------------------------------------------------ la pestaña «La aldea» del cuaderno
  // La página de la izquierda: la noche que viene y quién te ayuda. La de la derecha: los pedidos de hoy.
  function dibujarCuaderno(lista, ficha, el, opc = {}) {
    const d = ctx.D(), p = ctx.progreso();
    const aqui = cerca(ctx.posJugador());
    // ---- izquierda: la noche que viene
    lista.appendChild(el('h3', '', 'La noche que viene'));
    let f = null;
    try { f = pronostico(); } catch { f = null; }
    if (!f) lista.appendChild(el('p', 'pista', 'Todavía no se puede saber nada de la noche.'));
    else {
      for (const n of f.noches) {
        const caja = el('div', 'ficha-aldea');
        caja.appendChild(el('p', 'anotado', `${n.cuando} · noche ${n.n}`));
        for (const t of n.avisos) caja.appendChild(el('p', 'texto', `${t}.`));
        if (n.consejo) caja.appendChild(el('p', 'pista', n.consejo));
        if (n.consejoLado) caja.appendChild(el('p', 'pista', n.consejoLado));
        botonTrampa(caja, n, el, aqui);   // 4.9: la trampa de miel (si el juego la tiene)
        lista.appendChild(caja);
      }
      lista.appendChild(el('p', 'pista', f.saber.tipoManana
        ? 'La estación meteorológica te da las dos noches. Mirá el mapa (M): marca por dónde entrarían.'
        : 'Con una radio sabés qué noche viene desde la mañana; con la estación meteorológica, también el lado y la noche de mañana. El perro huele el lado desde las tres de la tarde.'));
    }
    lista.appendChild(el('h3', '', 'Quién te ayuda'));
    for (const k of VECINOS_AYUDA) {
      const nivel = d.aldea?.ayuda?.[k] || 0;
      lista.appendChild(el('p', 'texto', `${VECINOS[k].nombre}: ayuda ${nivel} de ${NIVEL_MAX}`));
      lista.appendChild(el('p', 'pista', `${AYUDA_NIVEL[k][nivel]}.`));
    }
    // ---- derecha: los pedidos
    ficha.appendChild(el('h2', '', 'Pedidos de la aldea'));
    ficha.appendChild(el('p', 'pista', aqui
      ? 'Estás junto al tablón: acá podés entregar. Los vecinos piden de día, hasta que caiga la noche; los que cumplís te ayudan más cuando salen los duendes.'
      : 'Los vecinos piden cosas de día, hasta que caiga la noche, y las entregás en el tablón de la base. Los que cumplís te ayudan más en las noches grandes.'));
    for (const k of VECINOS_AYUDA) {
      const v = VECINOS[k], nivel = d.aldea?.ayuda?.[k] || 0, ped = d.aldea?.pedidos?.[k];
      const caja = el('div', 'ficha-aldea');
      caja.appendChild(el('p', 'anotado', `${v.nombre}, ${v.quien}`));
      if (ped && !vencido(ped, p.dia, p.horas)) {
        caja.appendChild(el('p', 'texto', `“${textoPedido(k, ped)}”`));
        caja.appendChild(el('p', 'texto', `Pide ${textoCosas(ped.pide)}.${ped.regalo ? ` A cambio, un regalito: ${textoCosas(ped.regalo)}.` : ''}`));
        const horas = Math.max(1, Math.round(quedaHoras(ped, p.dia, p.horas)));
        caja.appendChild(el('p', 'pista', `Hasta que salgan los duendes (quedan unas ${horas} ${horas === 1 ? 'hora' : 'horas'}). Lo que entregás no vuelve: también serviría para defender.`));
        const r = puedeEntregar(d.aldea, k, (c) => ctx.cuanto(c), p.dia, p.horas);
        const b = el('button', 'boton-lamina', r.ok ? 'Entregar' : r.razon === 'falta' ? `Te falta ${textoCosas(r.falta)}` : 'Entregar');
        b.disabled = !aqui || !r.ok;
        b.addEventListener('click', () => { entregarPedido(k); ctx.redibujar(); });
        caja.appendChild(b);
        if (!aqui) caja.appendChild(el('p', 'pista', 'Se entrega parado junto al tablón de la base.'));
      } else if (nivel >= NIVEL_MAX) caja.appendChild(el('p', 'pista', 'Ya no necesita nada: te ayuda a pleno.'));
      else if ((d.oleadas || 0) < DESDE_NOCHE[k]) caja.appendChild(el('p', 'pista', `Todavía no se acercó a la base: después de ${DESDE_NOCHE[k] === 1 ? 'la primera noche' : `${DESDE_NOCHE[k]} noches`} empieza a pedir.`));
      else if (d.aldea?.pidioDia?.[k] === p.dia) caja.appendChild(el('p', 'pista', 'Hoy ya no pide más.'));
      else caja.appendChild(el('p', 'pista', 'Hoy no pidió nada.'));
      ficha.appendChild(caja);
    }
  }

  ubicar();
  return {
    actualizar, cerca, avisoCerca, usarCerca, entregarPedido, pronostico, marcaMapa, dibujarCuaderno, acomodar, ponerTrampa, hayTrampa,
    get sitio() { return sitio; },
    get grupo() { return grupo; },
    get hojas() { return hojas; },
    _revisar: revisar,
  };
}
