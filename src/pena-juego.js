// 3.9.1 · LA PEÑA en el juego (sólo en el Relax): lo que pasa en la cantina además de pedir y tomar.
//   · los parroquianos: los vecinos que van de noche (cada uno según su horario, ver parroquianosDeLaNoche en aldea.js) se sientan a las mesas con su vaso
//     (que baja de a poco) y se oyen charlas lejanas (el `murmullo` de cantina-mundo.js);
//   · el truco: dos vecinos juegan en la mesa del rincón; sentado a su mesa (o parado al lado) E te invita a una partida (el truco de las fiestas, truco.js);
//   · el que se arrima: sentado a tu mesa un rato, alguno de los parroquianos se levanta, viene a tu mesa, te hace compañía con dos frases y vuelve a lo suyo;
//   · la peña de los sábados (de 21:30 a 1:30): el Cholo toca la guitarra y Anselmo el bombo en el rincón (suena en pena-mundo.js) y Dalia baila: tango hasta las
//     23:30 y chamamé después. Cada tanto baja de la pista, te elige y te saca a bailar (tango o chamamé, o «más tarde»): bailás con ella en la pista unos veinte
//     segundos y rinde como bailar en la fiesta (descansado y amistad, más con lo que aprendiste con Pocha);
//   · los chistes de Dalia (invitar, elegir, el paso, los pies, el calor, mientras bailás, entre tandas y al despedirse).
// Módulo con estado pero sin three ni DOM propios (el panel y la mesa son de cantina-juego.js y cantina-mundo.js): se prueba en Node con figuras de mentira.
// Aislado en main.js con `fallaSistema`. Nada pesa cuando estás lejos (a más de 45 m no se calcula nada).
import { EDIFICIOS_ALDEA, PARADA_ALDEA, marcoAldea, PUNTOS_PENA, CANTINA, tandaDePena, cantinaAbierta, penaActiva, nocheDeCantina, parroquianosDeLaNoche } from './aldea.js';
import { nombreCortoDe } from './aldea-vida.js';
import { hayEconomia } from './economia.js';
import { cantinaDe, CARTA } from './cantina.js';
import { BAILES_PENA, IDS_BAILES_PENA, nivelDeBaile, descansoDeBaile, amistadDeBaile, INVITACION, proximaInvitacion, confianzaDe, elegirChiste, ARRIMA_TIEMPO, frasesDeArrima, cantarTruco, invitarAlTruco, faseEbrio, nivelEbrio } from './pena.js';

export const RADIO_PENA = 45;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const azarT = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return (h % 10007) / 10007; };
const NOMBRE_DALIA = 'Dalia';

export function crearPenaJuego(ctx) {
  const E = EDIFICIOS_ALDEA.cantina;
  const T_ = ctx.T_ || ((t) => t);
  const P = () => ctx.progreso();
  const dia = () => Math.max(1, Math.floor(P().dia || 1));
  const hora = () => Number(P().horas) || 0;
  const marco = () => ctx.marco?.() || marcoAldea(PARADA_ALDEA);
  const aMundo = (bx, bz) => { const c = Math.cos(E.rot), s = Math.sin(E.rot); return marco().aMundo(E.x + bx * c + bz * s, E.z - bx * s + bz * c); };
  const rotMundo = (rot) => marco().rotMundo(E.rot + rot);
  const centro = aMundo(0, 0);
  // un lugar de la peña o una de las ocho sillas (silla-1 a silla-8, de a dos por mesa), en el mundo
  const pto = (k) => {
    const m = /^silla-(\d)$/.exec(k), s = m ? CANTINA.mesas[(Number(m[1]) - 1) >> 1]?.sillas[(Number(m[1]) - 1) & 1] : null;
    const q = s ? { x: s.x, z: s.z, rot: s.mira } : PUNTOS_PENA[k], w = aMundo(q.x, q.z);
    return { x: w.x, z: w.z, mira: rotMundo(q.rot) };
  };
  const jugadorEstado = () => ctx.jugador?.()?.estado || null;
  const cantina = () => ctx.cantina?.() || null;
  const personas = () => ctx.aldeaGente?.()?.personas || new Map();
  const npcDe = (k) => personas().get(k)?.npc || null;
  const absoluta = () => dia() * 24 + hora();
  const info = { sentados: 0, vasos: 0, murmullos: 0, arrimas: 0, bailes: 0, invitaciones: 0, rechazos: 0, trucoCantos: 0, ms: 0 };
  const semilla = () => dia() * 31 + Math.floor(hora() * 4) + info.bailes * 7 + info.arrimas * 3;

  // ---------------------------------------------------------------- quiénes están (sentados en la cantina)
  // Los que ya llegaron a su silla (o a la mesa de truco): [{ clave, npc, punto, tipo: 'silla'|'truco', i }]
  function sentados() {
    const salida = [];
    for (const [k, st] of personas()) {
      const d = st.destino, n = st.npc;
      if (!n || !d || d.edificio !== 'cantina' || n.dormido || n.conVos) continue;
      const m = /^(silla|truco)-(\d)$/.exec(d.punto || '');
      if (!m) continue;
      const q = pto(d.punto);
      if (dist(n.pos, q) > 1.1) continue;
      salida.push({ clave: k, npc: n, punto: d.punto, tipo: m[1], i: Number(m[2]) });
    }
    return salida;
  }
  const musico = (k) => { const n = npcDe(k); return n && !n.dormido && !n.conVos && n.pose && /^(tocar|bombo)$/.test(n.pose) ? n : null; };

  // ---------------------------------------------------------------- los vasos de los parroquianos (en su mesa)
  const conVaso = new Map();   // punto → { clave }
  const BEBIDAS = ['cerveza', 'vino-patero', 'ginebra', 'mate-cocido', 'cerveza', 'vino-patero'];
  function vasos(lista) {
    const v = ctx.visual;
    if (!v?.ponerEnMesa) return;
    const c = cantina();
    const sillas = c?.lugar?.sillas;
    if (!sillas) return;
    const hoy = new Set();
    for (const s of lista) {
      if (s.tipo !== 'silla') continue;
      hoy.add(s.punto);
      const sil = sillas[s.i - 1];
      if (!sil) continue;
      const item = CARTA.find((x) => x.id === BEBIDAS[Math.floor(azarT(`${s.clave}|${nocheDeCantina(dia(), hora())}|b`) * BEBIDAS.length) % BEBIDAS.length]) || CARTA[0];
      // lo que queda baja con la noche: del vaso lleno al último sorbo
      const x = parroquianosDeLaNoche(P().aldea, nocheDeCantina(dia(), hora())).find((q) => q.clave === s.clave);
      const hh = hora() < 6 ? hora() + 24 : hora();
      const f = x ? Math.max(0, Math.min(1, (hh - x.llega) / Math.max(0.5, x.sale - x.llega))) : 0.3;
      const quedan = Math.max(1, Math.round(item.porciones * (1 - 0.8 * f)));
      const ya = conVaso.get(s.punto);
      if (!ya || ya.clave !== s.clave) { v.ponerEnMesa({ id: `p-${s.punto}` }, sil, item, quedan); conVaso.set(s.punto, { clave: s.clave, quedan }); info.vasos++; }
      else if (ya.quedan !== quedan) { v.nivel?.({ id: `p-${s.punto}` }, quedan, item); ya.quedan = quedan; }
    }
    for (const [punto] of [...conVaso]) if (!hoy.has(punto)) { v.quitarDeMesa?.({ id: `p-${punto}` }); conVaso.delete(punto); }
  }
  function sinVasos() { for (const [punto] of [...conVaso]) ctx.visual?.quitarDeMesa?.({ id: `p-${punto}` }); conVaso.clear(); }

  // ---------------------------------------------------------------- controlar a un vecino un rato (como Lucrecia: nadie más lo mueve)
  const controlados = new Set();
  function tomar(n) {
    if (!n) return false;
    n.conVos = true; n.enCita = true; n.pose = null; n.asiento = undefined; n.soloCerca = 0; n.dormido = false; n.charlaVecinos = false; n.alAmor = true; n.velocidad = 0.9;
    controlados.add(n);
    return true;
  }
  function soltar(n) {
    if (!n) return;
    n.conVos = false; n.enCita = false; n.camino = []; n.velocidad = 0.85; n.pose = null;
    controlados.delete(n);
  }
  const caminar = (n, puntos, mira = null) => {
    n.camino = puntos.map((q, i) => ({ x: q.x, z: q.z, sinChoque: true, cerca: i === puntos.length - 1 ? 0.15 : 0.35 }));
    n.miraFinal = Number.isFinite(mira) ? mira : n.miraFinal; n.espera = 0;
  };
  const llego = (n) => !n || !n.camino || n.camino.length === 0;
  // De donde está al pasillo (z 1,5) y por ahí a un punto: la mesa del rincón y la pista están del lado derecho; las mesas, a la izquierda
  function ruta(desde, haciaLocal) {
    const pasillo = [aMundo(2.3, 1.5), aMundo(0.3, 1.5)];
    const meta = aMundo(haciaLocal.x, haciaLocal.z);
    if (haciaLocal.x > 2.2) return [meta];
    return [...(desde && Math.hypot(desde.x - pasillo[0].x, desde.z - pasillo[0].z) > 0.8 ? [pasillo[0]] : []), pasillo[1], meta];
  }

  // ---------------------------------------------------------------- el murmullo
  let proxMurmullo = 6;
  function murmullo(dt, d, lista) {
    proxMurmullo -= dt;
    if (proxMurmullo > 0) return;
    const hayMusica = penaActiva(dia(), hora()) && (musico('musico') || musico('herrero'));
    const n = lista.length;
    proxMurmullo = Math.max(4.5, Math.min(18, 15 / (1 + n)) * (0.7 + Math.random() * 0.8)) * (hayMusica ? 1.7 : 1);
    if (!n || d > 12 || !cantinaAbierta(hora())) return;
    const y = (cantina()?.lugar?.pisoY?.() ?? 0) + 1.4;
    if (ctx.visual?.murmullo?.(ctx.sonido, { x: centro.x, y, z: centro.z }, Math.min(1, n / 5) * (hayMusica ? 0.6 : 1))) info.murmullos++;
  }

  // ---------------------------------------------------------------- el truco
  const mesaTruco = () => aMundo(3.5, 2.4);
  function rivalesDelTruco(lista) {
    return lista.filter((s) => s.tipo === 'truco').map((s) => ({ clave: s.clave, npc: s.npc, nombre: nombreCortoDe(s.clave) || s.npc.nombre || s.clave }));
  }
  let proxCanto = 18;
  function cantosDelTruco(dt, d, lista) {
    proxCanto -= dt;
    if (proxCanto > 0) return;
    proxCanto = 22 + Math.random() * 22;
    const rivales = rivalesDelTruco(lista);
    if (rivales.length < 1 || d > 9) return;
    const r = rivales[Math.floor(Math.random() * rivales.length)];
    ctx.decir?.(r.npc, cantarTruco(semilla() + info.trucoCantos++));
  }
  function accionTruco(js) {
    const rivales = rivalesDelTruco(sentados());
    if (!rivales.length || !ctx.jugarTruco) return null;
    const m = mesaTruco();
    if (dist(js.pos, m) > 2.3) return null;
    const r = rivales[0], otro = rivales[1];
    return { tipo: 'pena-truco', texto: otro ? `Jugar un truco con ${r.nombre} (y ${otro.nombre} mira)` : `Jugar un truco con ${r.nombre}`, hacer: () => { ctx.decir?.(r.npc, invitarAlTruco(semilla())); ctx.jugarTruco(r.npc, r.clave); } };
  }

  // ---------------------------------------------------------------- el que se arrima a tu mesa
  const arrima = { fase: 'no', t: 0, espera: 30, quien: null, desde: 0, hechos: 0, nocheHecha: 0, linea: 0 };
  function arrimarse(dt, lista) {
    const c = cantina(), mi = c?.sentadoEn?.();
    if (arrima.fase === 'no') {
      if (!mi || c.ocupadaConVos?.() || !cantinaAbierta(hora()) || !lista.some((s) => s.tipo === 'silla')) { arrima.t = 0; return; }
      arrima.t += dt;
      if (arrima.t < arrima.espera) return;
      // quién: uno de los sentados (no los del truco) que no comparta tu mesa; si no hay otro, el que se sienta en tu misma mesa se da vuelta y charla
      const miMesa = Number(String(mi.mesa.id).replace(/\D/g, ''));
      const sillas = lista.filter((s) => s.tipo === 'silla' && !controlados.has(s.npc));
      const lejos = sillas.filter((s) => Math.ceil(s.i / 2) !== miMesa), mismo = sillas.filter((s) => Math.ceil(s.i / 2) === miMesa);
      const pool = lejos.length ? lejos : mismo;
      const q = pool[Math.floor(azarT(`${semilla()}|arrima`) * pool.length) % Math.max(1, pool.length)];
      if (!q) { arrima.t = 0; return; }
      arrima.quien = q; arrima.mesa = mi.mesa; arrima.desde = absoluta(); arrima.t = 0; arrima.segunda = false;
      if (!lejos.length) { arrima.fase = 'viene'; return; }   // (ya está al lado: empieza la charla enseguida)
      arrima.fase = 'viene';
      tomar(q.npc);
      const sv = mi.mesa.servicio;
      caminar(q.npc, ruta(q.npc.pos, localDe(sv)), sv.mira);
      return;
    }
    const q = arrima.quien;
    if (!q || !q.npc || !mi || mi.mesa !== arrima.mesa) { terminarArrima(true); return; }
    if (arrima.fase === 'viene') {
      if (controlados.has(q.npc) && !llego(q.npc)) { arrima.t += dt; if (arrima.t > 25) terminarArrima(true); return; }
      arrima.fase = 'charla'; arrima.t = 0;
      if (controlados.has(q.npc)) q.npc.miraFinal = Math.atan2(arrima.mesa.x - q.npc.pos.x, arrima.mesa.z - q.npc.pos.z);
      const [a, b] = frasesDeArrima(q.clave, semilla() + arrima.hechos);
      arrima.lineas = [a, b];
      ctx.decir?.(q.npc, a);
      ctx.nota?.(T_(nombreCortoDe(q.clave) || q.npc.nombre || q.clave), T_(a));
      ctx.sumarAmistad?.(q.clave, 1);
      arrima.dur = ARRIMA_TIEMPO.se_queda[0] + (ARRIMA_TIEMPO.se_queda[1] - ARRIMA_TIEMPO.se_queda[0]) * azarT(`${semilla()}|dur`);
      info.arrimas++;
      return;
    }
    if (arrima.fase === 'charla') {
      arrima.t += dt;
      if (!arrima.segunda && arrima.t > arrima.dur * 0.45) { arrima.segunda = true; ctx.decir?.(q.npc, arrima.lineas[1]); }
      if (arrima.t > arrima.dur) terminarArrima(false);
    }
  }
  function terminarArrima(cortada) {
    const q = arrima.quien;
    if (q?.npc && controlados.has(q.npc)) soltar(q.npc);
    arrima.fase = 'no'; arrima.t = 0; arrima.quien = null; arrima.segunda = false; arrima.hechos++;
    arrima.espera = ARRIMA_TIEMPO.espera[0] + (ARRIMA_TIEMPO.espera[1] - ARRIMA_TIEMPO.espera[0]) * azarT(`${semilla()}|esp`) + (cortada ? 10 : ARRIMA_TIEMPO.entre * 0.4);
  }
  // un punto del mundo (la mesa, el servicio) a lo local del edificio
  function localDe(w) { const l = marco().aLocal(w.x, w.z), c = Math.cos(E.rot), s = Math.sin(E.rot), dx = l.lx - E.x, dz = l.lz - E.z; return { x: dx * c - dz * s, z: dx * s + dz * c }; }

  // ---------------------------------------------------------------- Dalia: la pista, la invitación y el baile
  const D = { fase: 'pista', t: 0, proxima: INVITACION.primera, baile: null, dur: 0, restan: 0, notas: 0, jugadorEn: null, despuesDeRechazo: false };
  const dalia = () => { const n = npcDe('bailarina'); return n && !n.dormido ? n : null; };
  const adentro = (pos) => dist(pos, centro) < 6.2;
  const nombreD = () => nombreCortoDe('bailarina') || NOMBRE_DALIA;
  const decirDalia = (texto) => { if (!texto) return; ctx.nota?.(T_(NOMBRE_DALIA), T_(texto)); ctx.decir?.(dalia(), texto); };
  const chisteD = (situ, sub = null, siempre = false) => {
    const c = cantinaDe(P());
    return c ? elegirChiste('bailarina', situ, sub, c.chistes, { confianza: confianzaDe(P(), 'bailarina'), semilla: semilla() + info.invitaciones * 11 + D.notas, siempre }) : null;
  };
  const libreParaInvitar = (js) => {
    const c = cantina();
    if (!js || js.enTren || js.enKayak || js.montado || js.nadando || js.enCable) return false;
    if (!adentro(js.pos)) return false;
    if (ctx.hablandoCon?.() || ctx.panelAbierto?.()) return false;
    if (c?.ocupadaConVos?.()) return false;
    return true;
  };
  function cancelarDalia(nota = false) {
    const n = npcDe('bailarina');
    D.fase = 'pista'; D.t = 0; D.proxima = proximaInvitacion(semilla(), D.despuesDeRechazo); D.jugadorEn = null;
    if (n && controlados.has(n)) soltar(n);
    ctx.cantina?.()?.cerrarPanel?.();
    if (nota) ctx.nota?.(T_(NOMBRE_DALIA), T_('Como quieras. Yo no pido dos veces.'));
  }
  function dalia_actualizar(dt, js, d) {
    const n = dalia();
    const tanda = tandaDePena(dia(), hora());
    if (!n || !tanda || !hayEconomia(P())) { if (D.fase !== 'pista') cancelarDalia(false); D.t = 0; return; }
    const pista = pto('pista');
    switch (D.fase) {
      case 'pista': {
        if (!libreParaInvitar(js)) { D.t = Math.min(D.t, D.proxima * 0.8); return; }
        D.t += dt;
        // entre tanda y tanda sube a la pista diciendo algo (una sola vez por tanda)
        if (D.notaTanda !== `${nocheDeCantina(dia(), hora())}${tanda}` && D.t > 4 && dist(n.pos, pista) < 1.2) {
          D.notaTanda = `${nocheDeCantina(dia(), hora())}${tanda}`;
          const j = chisteD('pena');
          if (j) { ctx.decir?.(n, j); ctx.nota?.(T_(NOMBRE_DALIA), T_(j)); }
        }
        if (D.t < D.proxima || dist(n.pos, pista) > 1.5) return;
        // ¡te elige!
        D.fase = 'viene'; D.t = 0; info.invitaciones++;
        tomar(n);
        const dd = dist(js.pos, n.pos);
        const meta = dd < 3.5 ? { x: js.pos.x + (n.pos.x - js.pos.x) * (0.95 / Math.max(0.5, dd)), z: js.pos.z + (n.pos.z - js.pos.z) * (0.95 / Math.max(0.5, dd)) } : null;
        const cc = cantina()?.sentadoEn?.();
        if (cc) caminar(n, ruta(n.pos, localDe(cc.mesa.servicio)), cc.mesa.servicio.mira + Math.PI);
        else if (meta) caminar(n, [meta], Math.atan2(js.pos.x - meta.x, js.pos.z - meta.z));
        else { const lc = localDe(js.pos); const p = ruta(n.pos, { x: lc.x, z: lc.z }); caminar(n, p, null); }
        D.dondeEstaba = js.pos.clone ? js.pos.clone() : { x: js.pos.x, y: js.pos.y, z: js.pos.z };
        return;
      }
      case 'viene': {
        D.t += dt;
        // si te fuiste mientras venía, o tardó de más, vuelve
        if (!libreParaInvitar(js) && D.t > 1) { cancelarDalia(false); return; }
        if (D.t > 28) { cancelarDalia(false); return; }
        if (!llego(n) && dist(n.pos, js.pos) > 1.5) return;
        n.camino = []; n.miraFinal = Math.atan2(js.pos.x - n.pos.x, js.pos.z - n.pos.z);
        D.fase = 'panel'; D.t = 0;
        abrirInvitacion();
        return;
      }
      case 'panel': {
        D.t += dt;
        // el panel lo cierra el jugador (un botón o Escape); si se fue lejos, se cancela
        if (!cantina()?.panelAbierto?.() && D.t > 0.5 && D.fase === 'panel') { D.despuesDeRechazo = true; info.rechazos++; cancelarDalia(true); return; }
        n.miraFinal = Math.atan2(js.pos.x - n.pos.x, js.pos.z - n.pos.z);
        return;
      }
      case 'baila': {
        D.t += dt; D.restan -= dt;
        // vos quedás en tu lugar de la pista, mirándola; ella, en la suya, mirándote (todo el baile)
        const q = D.jugadorEn;
        if (q) { js.pos.x = q.x; js.pos.z = q.z; if (js.vel) js.vel.set?.(0, js.vel.y || 0, 0); }
        n.miraFinal = Math.atan2(js.pos.x - n.pos.x, js.pos.z - n.pos.z);
        n.pose = D.baile.pose;
        if (D.t > D.proxManos) { ctx.manos?.('bailar-lento'); D.proxManos = D.t + 5.5; }
        // a media pista, algo de lo que dice bailando
        if (D.t > 5 && D.notas === 0) { D.notas = 1; const j = chisteD('paso', null, true) || chisteD('bailando', null, true); if (j) decirDalia(j); }
        if (D.t > 12 && D.notas === 1) { D.notas = 2; const j = chisteD('bailando', null, true) || chisteD('pies', null, true); if (j) decirDalia(j); }
        if (D.restan <= 0 || (D.cancelar && D.t > 1)) terminarBaile();
        return;
      }
      case 'vuelve': {
        D.t += dt;
        if (llego(n) || D.t > 25) { soltar(n); D.fase = 'pista'; D.t = 0; D.proxima = proximaInvitacion(semilla(), D.despuesDeRechazo); D.despuesDeRechazo = false; }
        return;
      }
      default: D.fase = 'pista';
    }
  }
  function abrirInvitacion() {
    const c = cantina();
    if (!c?.abrirPanelLibre) { cancelarDalia(false); return; }
    const texto = [`${chisteD('invitar', null, true) || 'Si sabés llevar, te dejo llevar. Si no, te enseño.'}`, chisteD('elegir', null, true) || 'El tango, bien pegaditos; el chamamé, con un poco más de aire. Vos elegí.'];
    const hablado = texto[0];
    ctx.decir?.(dalia(), hablado);
    const botones = IDS_BAILES_PENA.map((id) => ({ texto: BAILES_PENA[id].texto, alClic: () => aceptar(id) }));
    botones.push({ texto: 'Más tarde', alClic: () => { D.despuesDeRechazo = true; info.rechazos++; cancelarDalia(true); } });
    const ok = c.abrirPanelLibre({ titulo: 'Dalia te saca a bailar', texto, botones, alCerrar: () => { if (D.fase === 'panel') { D.despuesDeRechazo = true; info.rechazos++; cancelarDalia(true); } } });
    if (!ok) cancelarDalia(false);
  }
  function aceptar(id) {
    const n = dalia(), js = jugadorEstado();
    if (!n || !js || !BAILES_PENA[id]) { cancelarDalia(false); return; }
    D.baile = BAILES_PENA[id]; D.fase = 'baila'; D.t = 0; D.dur = D.baile.dura; D.restan = D.baile.dura; D.notas = 0; D.proxManos = 0.5; D.cancelar = false;
    // vos de pie (si estabas sentado) y a la pista: ella queda en la suya y vos enfrente, mirándola
    ctx.levantar?.();
    const pista = pto('pista');
    const pa = aMundo(PUNTOS_PENA.pista.x - 0.74, PUNTOS_PENA.pista.z);
    const miraDalia = rotMundo(-Math.PI / 2);
    const poner = () => {
      ctx.jugador?.()?.ubicar?.(pa.x, pa.z, rotMundo(Math.PI / 2) + Math.PI);
      D.jugadorEn = { x: pa.x, z: pa.z };
      n.camino = []; n.pos.x = pista.x; n.pos.z = pista.z; n.miraFinal = miraDalia; n.rumbo = n.rumboObjetivo = miraDalia; if (n.g) n.g.rotation.y = miraDalia;
      n.pose = D.baile.pose;
    };
    if (ctx.fundir) ctx.fundir(poner); else poner();
    ctx.nota?.(T_(id === 'tango' ? 'Bailás un tango con Dalia' : 'Bailás un chamamé con Dalia'), T_('E para dejar de bailar'));
  }
  function terminarBaile() {
    const n = dalia(), b = D.baile;
    D.jugadorEn = null;
    if (n) { n.pose = null; }
    if (!b) { cancelarDalia(false); return; }
    // lo que rinde: como bailar en la fiesta (descansado y amistad), con lo que aprendiste con Pocha
    const fiestas = P().fiestas;
    const nivel = nivelDeBaile(fiestas, b.id);
    const completo = D.t >= D.dur - 0.5;
    if (completo) {
      info.bailes++;
      const cc = cantinaDe(P());
      const antesHoy = cc?.pena?.ultima === dia();
      if (cc) cc.pena = { bailes: (cc.pena?.bailes || 0) + 1, ultima: dia() };
      const primeraHoy = !antesHoy;
      ctx.alJugador?.('descansado', descansoDeBaile(nivel));
      if (primeraHoy) ctx.sumarAmistad?.('bailarina', amistadDeBaile(nivel));
      ctx.nota?.(T_(b.id === 'tango' ? 'Bailaste un tango con Dalia' : 'Bailaste un chamamé con Dalia'), T_(nivel >= 2 ? 'La pista te aplaude: se nota la mano de Pocha' : nivel ? 'Ya no la pisás' : 'Pocha da clases en la fiesta: pedile una'), true);
      const j = chisteD('despedida', null, true);
      if (j) ctx.cantina?.() && setTimeout(() => { try { decirDalia(j); } catch { /* ya */ } }, 700);
      ctx.guardar?.();
    } else ctx.nota?.(T_(NOMBRE_DALIA), T_('¿Ya te cansaste? Vuelvo a la pista, que el compás no espera.'));
    if (n) { D.fase = 'vuelve'; D.t = 0; n.conVos = true; caminar(n, [pto('pista')], pto('pista').mira); D.proxima = proximaInvitacion(semilla(), false); }
    else D.fase = 'pista';
  }
  // E mientras bailás: dejar de bailar
  const accionBaile = () => (D.fase === 'baila' ? { tipo: 'pena-baile', texto: 'Dejar de bailar', hacer: () => { D.cancelar = true; D.t = Math.max(D.t, 1.1); terminarBaile(); } } : null);

  // ---------------------------------------------------------------- el bucle
  let acum = 0, ultimaLista = [];
  function actualizar(dt) {
    const js = jugadorEstado();
    if (!js || !ctx.progreso || !hayEconomia(P())) return;
    const d = dist(js.pos, centro);
    if (d > RADIO_PENA) {
      if (controlados.size || D.fase !== 'pista' || arrima.fase !== 'no') { for (const n of [...controlados]) soltar(n); D.fase = 'pista'; D.t = 0; arrima.fase = 'no'; arrima.quien = null; }
      if (conVaso.size) sinVasos();
      return;
    }
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    acum += dt;
    if (acum > 0.5) { acum = 0; ultimaLista = sentados(); info.sentados = ultimaLista.length; vasos(ultimaLista); }
    murmullo(dt, d, ultimaLista);
    cantosDelTruco(dt, d, ultimaLista);
    arrimarse(dt, ultimaLista);
    dalia_actualizar(dt, js, d);
    info.ms = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
  }
  // lo que pide E y el aviso (la misma función)
  function accion(js) {
    if (!js || !hayEconomia(P())) return null;
    return accionBaile() || accionTruco(js);
  }
  // el que baila o el que mira el truco no le habla al vecino de adelante con E
  const tapaVecino = (js) => D.fase === 'baila' || !!accionTruco(js);
  const estado = () => ({ dalia: { fase: D.fase, baile: D.baile?.id || null, t: D.t, restan: D.restan, proxima: D.proxima }, arrima: { fase: arrima.fase, quien: arrima.quien?.clave || null, hechos: arrima.hechos }, sentados: ultimaLista.map((s) => ({ clave: s.clave, punto: s.punto })), vasos: [...conVaso.keys()], controlados: controlados.size, info: { ...info } });
  return {
    actualizar, accion, tapaVecino, estado, sentados, soltarTodos: () => { for (const n of [...controlados]) soltar(n); D.fase = 'pista'; arrima.fase = 'no'; },
    // para las pruebas y las capturas
    forzarInvitacion: () => { D.proxima = 0; D.t = 1; },
    elegirBaile: (id) => aceptar(id),
    lugar: { pto, aMundo, rotMundo, centro, mesaTruco }, bailando: () => D.fase === 'baila',
    // sentado en la cantina (en una mesa de truco, por ejemplo) la noche no se te escapa: el reloj no corre ×40
    sinApuro: () => { const js = jugadorEstado(); return !!js && !!js.sentado && cantinaAbierta(hora()) && dist(js.pos, centro) < 6.2; },
    musica: () => ({ guitarra: musico('musico'), bombo: musico('herrero') }),
    baja: () => !!(cantina()?.panelAbierto?.() || D.fase === 'panel' || arrima.fase === 'charla'),
  };
}
