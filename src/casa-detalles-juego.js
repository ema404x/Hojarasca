// 4.31.0 (A): el enganche de las cosas que se tocan adentro (ver casa-detalles.js) con el juego: a qué apuntás (la entrada `casa` de
// interacciones.js), qué hace la E, los sonidos (con los del juego, bajito) y la luz que le toca a la casa. Lo pide main.js con lo que necesita
// por su nombre (nada de main.js se importa acá).
// (el import, en una sola línea: el armador sólo entiende así los import)
import { CASA, COSAS_REFUGIO, MUEBLES_CASA, avisoCosa, avisoMueble, cosaDisponible, puntosDeCosa, elegirMirado, brillosCasa, sanearCasa, pavaNueva, avanzarPava, campanadas, CAJON, BAUL, textoAlacena, LIBRO, CARTAS, yawHacia } from './casa-detalles.js';
import { aMundo } from './casa-viva.js';

// `api`: { progreso(), mundo (casa-detalles-mundo.js), col, sonido, nota(t, sub), leer({ quien, que, partes, despedida }), sentar({ x, y, z, mira }),
//   guardar(), obrasCerca(pos, radio) → obras terminadas, despensa() → nombres, relojHora() → partes del reloj, programaRadio() → texto o nada }
export function crearCasaDetalles(api) {
  const M = api.mundo;
  const ref = api.ref;
  const pava = pavaNueva();
  let chorroBomba = 0, chorroObra = 0, chorroEn = null, t = 0;
  let horaAntes = NaN, tic = 0, crepita = 0, radioPaso = 0, radioNota = 0, silbo = 0;
  const casa = () => { const p = api.progreso(); if (!p.casa || typeof p.casa !== 'object') p.casa = sanearCasa(p.casa); return p.casa; };
  const cerca = (pos, r) => Math.hypot(pos.x - ref.x, pos.z - ref.z) < r;
  // entre las cuatro paredes del refugio (7 × 5,5 m)
  const dentro = (p) => { const dx = p.x - ref.x, dz = p.z - ref.z, c = Math.cos(ref.rot || 0), s = Math.sin(ref.rot || 0); return Math.abs(dx * c - dz * s) < 3.4 && Math.abs(dx * s + dz * c) < 2.65; };
  const fuente = (pos, vol = 1) => (api.sonido?.ctx ? api.sonido.fuente(pos, vol, 0.45) : null);
  const ojo = { x: 0, y: 0, z: 0 }, dir = { x: 0, y: 0, z: -1 };
  const cands = [];

  // Lo que tenés de frente y a mano: las cosas del refugio y los muebles de tus casas
  function buscar(js, cam) {
    const e = casa();
    ojo.x = cam.position.x; ojo.y = cam.position.y; ojo.z = cam.position.z;
    const d = api.adelante(); dir.x = d.x; dir.y = d.y; dir.z = d.z;
    cands.length = 0;
    if (cerca(js.pos, CASA.cercaRefugio)) {
      const adentro = dentro(js.pos);
      for (const k of COSAS_REFUGIO) {
        if (!cosaDisponible(k, e)) continue;
        if (!!k.afuera === adentro && k.cortina === undefined && k.ventana === undefined) continue;   // lo de adentro, desde adentro; el farol y la bomba, desde afuera
        if (k.sentarse && js.sentado) continue;
        const pts = k.cortina !== undefined ? puntosDeCosa(k, e) : null;
        const lista = pts ? pts.map(([x, y, z]) => aMundo({ x: ref.x, y: ref.y, z: ref.z, rot: ref.rot }, x, y, z)) : M.puntos[k.id];
        for (const p of lista) cands.push({ p, r: k.r, cosa: k });
      }
    }
    for (const o of api.obrasCerca(js.pos, 3.2)) {
      const m = MUEBLES_CASA[o.plano.id];
      if (!m || (m.que === 'sentarse' && js.sentado)) continue;
      cands.push({ p: aMundo({ x: o.datos.x, y: o.datos.y, z: o.datos.z, rot: o.datos.rot || 0 }, ...m.en), r: m.r, obra: o, m });
    }
    if (!cands.length) return null;
    const i = elegirMirado(cands, ojo, dir);
    if (i < 0) return null;
    const c = cands[i];
    // tus muebles: sin una pared en el medio; las cortinas sólo desde adentro (las ventanas se abren de los dos lados)
    if (c.obra && api.col?.paredEntre?.(ojo.x, ojo.z, c.p.x, c.p.z, c.p.y)) return null;
    if (c.cosa?.cortina !== undefined && !dentro(js.pos)) return null;
    return c;
  }

  function accion(js, cam) {
    const c = buscar(js, cam);
    if (!c) return null;
    if (c.obra) {
      const id = c.obra.plano.id;
      return { tipo: 'mueble', texto: avisoMueble(id), hacer: () => usarMueble(c.obra, c.m, js) };
    }
    const e = casa();
    const texto = avisoCosa(c.cosa.id, e, { pava: pava.estado, chorro: chorroBomba });
    return { tipo: c.cosa.id, texto, hacer: () => usarCosa(c.cosa, js) };
  }

  const pos = (id) => M.puntos[id][0];
  function usarCosa(k, js) {
    const e = casa(), S = api.sonido, id = k.id;
    switch (id) {
      case 'lampara': case 'farol': case 'velas': case 'hogar': case 'radio': {
        e[id] = !e[id];
        if (e[id] && id !== 'radio') S?.encender?.();
        else { const d = fuente(pos(id), 0.8); if (d) S.golpeRuido({ dur: 0.06, frec: id === 'radio' ? 2600 : 900, q: 1.2, vol: 0.05, destino: d, buffer: S.ruido }); }
        if (id === 'hogar') api.nota(e.hogar ? 'Prendiste el hogar' : 'Apagaste el hogar', e.hogar ? 'Con la leña de la pila de adentro: el humo sale por la chimenea' : 'Quedan las brasas en la ceniza');
        if (id === 'radio' && e.radio) api.nota('Prendiste la radio', api.programaRadio?.() || 'Entre la estática se cuela un chamamé de lejos');
        if (id === 'radio') radioPaso = 0;
        break;
      }
      case 'ventana-0': case 'ventana-1': {
        const v = k.ventana; e.ventanas[v] = e.ventanas[v] ? 0 : 1;
        S?.bisagra?.(pos(id));
        break;
      }
      case 'cortina-0': case 'cortina-1': {
        const v = k.cortina; e.cortinas[v] = e.cortinas[v] ? 0 : 1;
        const d = fuente(M.puntos[id][0], 0.7); if (d) S.golpeRuido({ dur: 0.35, frec: 1500, q: 0.6, vol: 0.03, destino: d, buffer: S.ruido, fin: 900 });
        break;
      }
      case 'baul': case 'alacena': case 'cajon': {
        e[id] = !e[id];
        S?.bisagra?.(pos(id));
        if (e[id]) api.nota(id === 'baul' ? 'En el baúl' : id === 'alacena' ? 'En la alacena' : 'En el cajón de la mesa', id === 'baul' ? BAUL : id === 'alacena' ? textoAlacena(api.despensa?.() || []) : CAJON);
        break;
      }
      case 'pava': {
        if (pava.estado === 'fria') {
          if (!e.hogar) { api.nota('El hogar está apagado', 'Prendelo para calentar el agua'); return; }
          pava.estado = 'calienta'; pava.t = 0;
          const d = fuente(pos(id), 0.8); if (d) S.golpeRuido({ dur: 0.25, frec: 700, q: 0.8, vol: 0.05, destino: d, buffer: S.ruido });
          api.nota('Pusiste la pava al fuego', 'En un rato silba');
        } else if (pava.estado === 'calienta') api.nota('Todavía no silba', 'El agua para el mate no tiene que hervir');
        else {
          const primero = pava.estado === 'silba';
          pava.estado = 'lista';
          if (primero) pava.t = 0;
          S?.juntar?.();
          api.nota(primero ? 'Te cebaste un mate' : 'Otro mate', primero ? 'Amargo y calentito, mirando el fuego' : 'La yerba todavía aguanta');
        }
        return;
      }
      case 'silla': case 'sillon': api.sentar(M.sentarse[id]); return;
      case 'libro': {
        const n = e.libro % LIBRO.capitulos.length; e.libro++;
        api.leer({ quien: LIBRO.titulo, que: 'el libro de la cama', partes: LIBRO.capitulos[n], despedida: 'Cerrás el libro con el dedo adentro.' });
        break;
      }
      case 'cartas': {
        const n = e.carta % CARTAS.length; e.carta++;
        api.leer({ quien: 'Las cartas', que: 'atadas con un piolín', partes: CARTAS[n], despedida: 'Las volvés a atar.' });
        break;
      }
      case 'reloj': api.leer({ quien: 'El reloj de pared', que: 'tu refugio', partes: api.relojHora(), despedida: 'Tic, tac.' }); return;
      case 'bomba': {
        if (chorroBomba > 0) return;
        chorroBomba = CASA.chorro;
        sonarAgua(M.picoBomba);
        api.nota('Bombeaste agua', 'Fría, del pozo: para la pava y para lavarse la cara');
        return;
      }
      default: return;
    }
    api.guardar();
  }

  function usarMueble(o, m, js) {
    const S = api.sonido;
    const d = { x: o.datos.x, y: o.datos.y, z: o.datos.z, rot: o.datos.rot || 0 };
    if (m.que === 'sentarse') {
      const q = aMundo(d, 0, m.asiento + 0.05, 0.05);
      api.sentar({ x: q.x, y: q.y, z: q.z, mira: yawHacia(d.rot, 0, -1) });
    } else if (m.que === 'abrir') {
      S?.bisagra?.(aMundo(d, ...m.en));
      api.nota(`En ${m.nombre}`, m.adentro || textoAlacena(api.despensa?.() || []));
    } else if (m.que === 'leer') {
      const e = casa(), n = e.libro % LIBRO.capitulos.length; e.libro++;
      api.leer({ quien: LIBRO.titulo, que: m.nombre, partes: LIBRO.capitulos[n], despedida: 'Lo dejás en su lugar.' });
      api.guardar();
    } else if (m.que === 'agua') {
      const de = aMundo(d, ...m.pico), a = aMundo(d, m.pico[0], m.hasta, m.pico[2]);
      chorroEn = { de, a }; chorroObra = CASA.chorro;
      sonarAgua(de);
      api.nota(o.plano.id === 'mesada' ? 'Abriste la canilla' : 'Sacaste agua del barril', 'Agua fresca');
    }
  }

  function sonarAgua(p) {
    const S = api.sonido, d = fuente(p, 0.9);
    if (!d) return;
    S.golpeRuido({ dur: CASA.chorro, frec: 1700, q: 0.7, vol: 0.035, destino: d, buffer: S.ruido });
    S.golpeRuido({ dur: CASA.chorro * 0.9, frec: 600, q: 0.9, vol: 0.025, destino: d, buffer: S.ruido });
    S.bisagra?.(p);
  }

  // Cada cuadro: lo que pasa con el tiempo (la pava, el chorro, el reloj) y lo que suena. `x`: { pos (el jugador), horas, viento, vidrio (el material del vidrio del refugio) }
  function actualizar(dt, x) {
    t += dt;
    const e = casa();
    const estado = pava.estado;
    avanzarPava(pava, dt, e.hogar);
    chorroBomba = Math.max(0, chorroBomba - dt);
    chorroObra = Math.max(0, chorroObra - dt);
    if (chorroObra <= 0) chorroEn = null;
    const cercaRef = cerca(x.pos, 32);
    M.mostrar(cercaRef || !!chorroEn);
    if (cercaRef || chorroEn) M.actualizar(dt, e, { pava: pava.estado, chorroBomba, chorroEn, viento: x.viento, horas: x.horas, t }, x.vidrio);
    // las campanadas del reloj (el de tu refugio o los de tus casas), si estás cerca
    const n = campanadas(horaAntes, x.horas);
    horaAntes = x.horas;
    const S = api.sonido;
    if (!S?.ctx) return;
    if (n) {
      const reloj = cerca(x.pos, CASA.oyeReloj) ? M.puntos.reloj[0] : api.relojCerca?.(x.pos, CASA.oyeReloj);
      const d = reloj && fuente(reloj, 1);
      if (d) for (let i = 0; i < n; i++) { S.tono({ frec: 784, dur: 1.6, vol: 0.03, destino: d, cuando: i * 1.3, ataque: 0.004 }); S.tono({ frec: 1568, dur: 0.6, vol: 0.008, destino: d, cuando: i * 1.3, ataque: 0.003 }); }
    }
    if (!cerca(x.pos, 12)) return;
    // la pava empieza a silbar (y silba un rato, cada tanto)
    if (pava.estado === 'silba' && (estado !== 'silba' || (silbo -= dt) <= 0)) {
      silbo = 2.4;
      S.silbido?.({ pos: M.puntos.pava[0], dur: 1.8, frec: 2350, vol: 0.035 });
      if (estado !== 'silba') api.nota('La pava silba', 'El agua está lista para el mate');
    }
    // el tic tac, de muy cerca
    if ((tic -= dt) <= 0) {
      tic = 1;
      if (Math.hypot(x.pos.x - M.puntos.reloj[0].x, x.pos.z - M.puntos.reloj[0].z) < 4.5) { const d = fuente(M.puntos.reloj[0], 0.5); if (d) S.golpeRuido({ dur: 0.03, frec: (Math.round(t) % 2) ? 3200 : 2600, q: 3, vol: 0.02, destino: d, buffer: S.ruido }); }
    }
    // el fuego del hogar crepita
    if (e.hogar && (crepita -= dt) <= 0) {
      crepita = 0.6 + Math.random() * 0.9;
      const d = fuente(M.puntos.hogar[0], 0.6); if (d) S.chisporrotear?.(d, 2 + Math.floor(Math.random() * 3), 0.035);
    }
    // la radio: estática bajita y, por arriba, una melodía de lejos
    if (e.radio && (radioPaso -= dt) <= 0) {
      radioPaso = 0.45;
      const d = fuente(M.puntos.radio[0], 0.6);
      if (d) {
        S.golpeRuido({ dur: 0.5, frec: 3200, q: 0.5, vol: 0.006 + Math.random() * 0.004, destino: d, buffer: S.ruido });
        const MELODIA = [62, 66, 69, 66, 64, 62, 61, 62, 64, 66, 67, 66, 64, 62, 57, 62];
        if (S.pulsar) S.pulsar(MELODIA[radioNota++ % MELODIA.length], { dur: 0.6, vol: 0.012, destino: d });
      }
    }
  }

  // La luz de la casa con lo prendido (ver `brillosCasa`)
  const brillos = (encendido) => brillosCasa(casa(), encendido);
  // Para el sonido: adentro del refugio con una ventana abierta, se oye lo de afuera
  const ventanaAbierta = () => { const e = casa(); return !!(e.ventanas[0] || e.ventanas[1]); };
  const hogarPrendido = () => !!casa().hogar;

  return { accion, actualizar, brillos, ventanaAbierta, hogarPrendido, pava, puntos: (id) => M.puntos[id] || null, mundo: M, estado: () => ({ pava: pava.estado, chorroBomba, chorroObra }) };
}
