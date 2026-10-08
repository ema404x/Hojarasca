// 3.1: carreras contrarreloj, desafío del día y torneo de la semana, en el juego. Junta las
// reglas (carreras.js, diarios.js, torneo.js), el dibujo (carreras-mundo.js) y la carpeta
// sincronizada (torneo-sync.js) con lo que main.js le pasa: el jugador, la partida, las
// notas y el guardado. main.js sólo llama a `accion` (la tecla E y el aviso, en el mismo
// lugar), `actualizar` (cada cuadro jugando), `pez` y `obraTerminada` (los enganches) y
// abre el panel.
//
// Las carreras y el desafío del día son del Relax (en el Desafío, la noche es otra cosa);
// el torneo se ve en los dos modos: la defensa se juega en el Desafío con el código de la
// semana.
import { CIRCUITOS, MEDIOS, GIROS, circuitoDe, claveRecord, medioDe, carreraNueva, pasoCarrera, carrerasNuevo, registrarTiempo, posFantasma, formatoTiempo, diferenciaTexto, largoDe, refDe } from './carreras.js';
import { crearCarrerasMundo } from './carreras-mundo.js';
import { desafioDelDia, fechaTexto, diariosNuevo, avanzarDiario, rachaVigente, textoAvance } from './diarios.js';
import { torneoDeLaSemana, anotarPropio, tablaSemana, todasLasEntradas, codigoPuntaje, leerCodigoPuntaje, sumarAmigo, defensaDeRecords, nombreVisible } from './torneo.js';
import { crearTorneoSync } from './torneo-sync.js';
import { sanearRecordsSemilla } from './semilla.js';

export const CSS_MODOS = `
.carrera-hud { position: absolute; top: 64px; left: 50%; transform: translateX(-50%); text-align: center; color: #f2ead8; text-shadow: 0 1px 3px rgba(0,0,0,.8); pointer-events: none; font-size: 15px; line-height: 1.35; }
.carrera-hud b { display: block; font-size: 22px; letter-spacing: .04em; }
.carrera-hud .cuenta { font-size: 64px; }
.modos31 h3 { margin: 18px 0 6px; }
.modos31 .dato { opacity: .8; font-size: .92em; margin: 2px 0; }
.modos31 table { width: 100%; border-collapse: collapse; font-size: .92em; }
.modos31 td, .modos31 th { padding: 3px 6px; text-align: left; border-bottom: 1px solid rgba(255,255,255,.08); }
.modos31 th { opacity: .7; font-weight: 600; }
.modos31 .fila-torneo { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 6px 0; }
.modos31 input { font: inherit; padding: 4px 8px; min-width: 14em; }
.modos31 .propio td { color: #ffd98a; }
`;

const el = (tag, clase = '', texto = '') => {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto) n.textContent = texto;
  return n;
};
const FLECHAS = ['↑', '↖', '←', '↙', '↓', '↘', '→', '↗'];

export function crearModos(ctx) {
  const { T, escena, jugador, esDesafio = false } = ctx;
  const nota = (a, b, n) => ctx.nota?.(a, b, n);
  const ahora = () => (typeof ctx.ahora === 'function' ? ctx.ahora() : new Date());
  let fechaForzada = null;
  const hoy = () => fechaForzada || fechaTexto(ahora());
  const mundo = !esDesafio && T && escena ? crearCarrerasMundo(T, escena) : null;
  const leerLS = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const escribirLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const torneoSync = crearTorneoSync({ api: ctx.api || null, leer: leerLS, escribir: escribirLS });
  let torneo = torneoDeLaSemana(ahora());

  // lo de la partida (guardado.js lo sanea al cargar; una partida nueva no lo trae)
  const carreras = () => { const p = ctx.progreso(); if (!p.carreras || typeof p.carreras !== 'object') p.carreras = carrerasNuevo(); return p.carreras; };
  const diarios = () => { const p = ctx.progreso(); if (!p.diarios || typeof p.diarios !== 'object') p.diarios = diariosNuevo(); return p.diarios; };
  const mejorDe = (clave) => { const m = carreras().mejores || {}; return Object.hasOwn(m, clave) ? m[clave] : null; };
  const hud = document.getElementById('carrera-hud');

  // ---------------------------------------------------------------- las carreras
  let carrera = null, recordActual = null, finMostrado = 0, reloj = 0, avisados = new Set(), ultimoHud = '';
  const cerca = (js, c) => Math.hypot(js.pos.x - c.salida.x, js.pos.z - c.salida.z) <= MEDIOS[c.medio].poste;
  // el giro del desafío de hoy, si es este circuito y todavía no se cumplió
  function giroDelDia(c) {
    const def = desafioDelDia(hoy());
    const h = diarios().hoy;
    if (def.tipo !== 'carrera' || def.circuito !== c.id || (h?.fecha === def.fecha && h.hecho)) return undefined;
    return def.giro === 'meta' ? null : def.giro;
  }
  function accion(js) {
    if (!mundo || !js) return null;
    if (carrera && carrera.fase !== 'fin') {
      const c = circuitoDe(carrera.id);
      // sólo antes de la primera puerta: con dos vueltas se pasa por el poste a mitad de carrera
      return c && carrera.sig === 0 && cerca(js, c) ? { texto: 'Largar de nuevo', hacer: () => largar(c, carrera.giro) } : null;
    }
    const medio = medioDe(js);
    for (const c of CIRCUITOS) {
      if (c.medio !== medio || !cerca(js, c)) continue;
      const delDia = giroDelDia(c);
      const giro = delDia === undefined ? null : delDia;
      const rec = mejorDe(claveRecord(c.id, giro));
      const que = delDia !== undefined ? `Largar el desafío del día: ${c.nombre}${giro ? ` ${GIROS[giro].nombre}` : ''}` : `Largar: ${c.nombre}`;
      return { texto: `${que}${rec ? ` · récord ${formatoTiempo(rec.ms)}` : ''}`, hacer: () => largar(c, giro) };
    }
    return null;
  }
  function pitido(frec, dur = 0.18) {
    try { ctx.sonido?.tono?.({ frec, fin: frec, dur, tipo: 'triangle', vol: 0.12, destino: ctx.sonido?.bus?.efectos }); } catch {}
  }
  function largar(c, giro = null) {
    carrera = carreraNueva(c, giro);
    if (!carrera) return false;
    recordActual = mejorDe(claveRecord(c.id, giro));
    mundo?.mostrarCircuito(carrera.puntos, c.medio, MEDIOS[c.medio].radio, c.salida);
    mundo?.marcarSiguiente(0);
    finMostrado = 0;
    nota(`${c.nombre}${giro ? ` · ${GIROS[giro].nombre}` : ''}`, `En sus marcas: no te alejes del poste. ${Math.round(largoDe(c, giro))} m${recordActual ? ` · récord ${formatoTiempo(recordActual.ms)}` : ''}`);
    pitido(520);
    return true;
  }
  function terminar(demora = 5) {
    finMostrado = demora;
    mundo?.ponerFantasma(null);
  }
  function manejar(ev) {
    const c = circuitoDe(carrera.id);
    if (ev.tipo === 'cuenta') pitido(620);
    else if (ev.tipo === 'largada') pitido(990, 0.35);
    else if (ev.tipo === 'puerta') {
      const antes = recordActual?.parciales?.[ev.i];
      const dif = Number.isFinite(antes) ? ` (${diferenciaTexto(ev.ms - antes)})` : '';
      nota(`Puerta ${ev.i + 1} de ${carrera.puntos.length - 1}`, `${formatoTiempo(ev.ms)}${dif}`);
      mundo?.marcarSiguiente(carrera.sig);
      pitido(780, 0.12);
    } else if (ev.tipo === 'meta') {
      const clave = claveRecord(c.id, carrera.giro);
      const r = registrarTiempo(carreras(), clave, { ms: ev.ms, parciales: ev.parciales, fecha: hoy(), rastro: carrera.rastro, paso: carrera.paso });
      const sub = r.mejoro
        ? (r.antes ? `¡Récord! ${diferenciaTexto(ev.ms - r.antes.ms)} · el fantasma ahora es esta vuelta` : 'Primer tiempo en este circuito: la próxima vez corrés contra tu fantasma')
        : `Tu récord: ${formatoTiempo(r.antes?.ms)} (${diferenciaTexto(ev.ms - (r.antes?.ms || ev.ms))})`;
      nota(`Llegada: ${formatoTiempo(ev.ms)}`, sub, r.mejoro);
      pitido(1180, 0.5);
      // el desafío del día y el torneo
      alDiario(avanzarDiario(diarios(), desafioDelDia(hoy()), { tipo: 'carrera', circuito: c.id, giro: carrera.giro, ms: ev.ms }));
      if (!carrera.giro && c.id === torneoActual().circuito) anotarTorneo({ carreraMs: ev.ms }, `Torneo: ${formatoTiempo(ev.ms)} en ${c.nombre}`);
      ctx.guardar?.();
      ultimoResultado = { id: c.id, giro: carrera.giro, ms: ev.ms, mejoro: r.mejoro };
      terminar(6);
    } else if (ev.tipo === 'abandono') {
      nota('Carrera abandonada', ev.motivo);
      terminar(2);
    }
  }
  let ultimoResultado = null;
  function textoHud(js) {
    if (!carrera) return '';
    const c = circuitoDe(carrera.id);
    if (carrera.fase === 'cuenta') return `${c.nombre}\n${Math.max(1, Math.ceil(carrera.cuenta))}`;
    if (carrera.fase === 'fin') return ultimoResultado?.id === c.id ? `${c.nombre}\nLlegada ${formatoTiempo(ultimoResultado.ms)}` : '';
    const p = carrera.puntos[carrera.sig];
    const dx = p.x - js.pos.x, dz = p.z - js.pos.z;
    // el jugador mira hacia (-sen yaw, -cos yaw): el ángulo de la puerta respecto de eso
    let a = Math.atan2(-dx, -dz) - js.yaw;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    const flecha = FLECHAS[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
    const que = p.meta ? 'Llegada' : `Puerta ${carrera.sig + 1} de ${carrera.puntos.length - 1}`;
    return `${c.nombre}\n${formatoTiempo(carrera.t * 1000)}${recordActual ? ` · récord ${formatoTiempo(recordActual.ms)}` : ''}\n${que} · ${Math.round(Math.hypot(dx, dz))} m ${flecha}`;
  }
  function dibujarHud(js) {
    if (!hud) return;
    const t = textoHud(js);
    if (t === ultimoHud) return;
    ultimoHud = t;
    hud.classList.toggle('oculto', !t);
    hud.textContent = '';
    if (!t) return;
    const [cab, ...resto] = t.split('\n');
    hud.appendChild(el('span', '', cab));
    if (carrera?.fase === 'cuenta') hud.appendChild(el('b', 'cuenta', resto[0]));
    else resto.forEach((r, i) => hud.appendChild(el(i === 0 ? 'b' : 'span', '', r)));
  }

  // ---------------------------------------------------------------- el desafío del día
  function alDiario(r) {
    if (!r) return;
    if (r.cumplido) {
      const racha = diarios().racha;
      nota('¡Desafío del día cumplido!', `+${r.puntos} puntos · racha de ${racha} ${racha === 1 ? 'día' : 'días'}`, true);
      pitido(1320, 0.6);
      ctx.guardar?.();
      pintarPortada();
    } else if (r.avance) {
      const def = desafioDelDia(hoy());
      nota('Desafío del día', `${r.avance} de ${def.n}`);
    } else if (r.tarde) nota('Desafío del día', 'Terminada, pero ya cayó el sol: mañana hay otro');
    else if (r.lento) nota('Desafío del día', 'Llegaste, pero no alcanzó el tiempo: probá de nuevo');
  }
  function pez(p) {
    if (esDesafio || !p) return;
    alDiario(avanzarDiario(diarios(), desafioDelDia(hoy()), { tipo: 'pez', id: p.id, cm: p.cm }));
    if (p.id === torneoActual().pez) anotarTorneo({ pesca: p.cm }, `Torneo: ${torneo.pezNombre} de ${p.cm} cm`);
  }
  function obraTerminada(plano, horas) {
    if (esDesafio) return;
    alDiario(avanzarDiario(diarios(), desafioDelDia(hoy()), { tipo: 'obra', plano, horas }));
  }
  function revisarContadores() {
    if (esDesafio) return;
    const def = desafioDelDia(hoy());
    if (def.tipo === 'tren') alDiario(avanzarDiario(diarios(), def, { tipo: 'entregas', valor: ctx.progreso()?.comercio?.entregas || 0 }));
  }

  // ---------------------------------------------------------------- el torneo
  function torneoActual() {
    const t = torneoDeLaSemana(ahora());
    if (t.semana !== torneo.semana) torneo = t;
    return torneo;
  }
  let syncPendiente = 0, relojSync = 0;
  function anotarTorneo(valores, texto) {
    if (!anotarPropio(torneoSync.local, torneoActual(), valores)) return false;
    torneoSync.guardarLocal();
    if (texto) setTimeout(() => nota('Torneo de la semana', `${texto}: tu mejor marca`), 1800);
    syncPendiente = 4;
    return true;
  }
  function revisarDefensa() {
    let records = {};
    try { records = sanearRecordsSemilla(JSON.parse(localStorage.getItem('hojarasca-semillas-v1') || '{}')); } catch {}
    const d = defensaDeRecords(records, torneoActual());
    if (d.noches || d.abatidos) anotarTorneo(d, null);
  }
  async function sincronizarTorneo() {
    syncPendiente = 0;
    const r = await torneoSync.sincronizar();
    if (panelAbierto()) dibujarPanel();
    return r;
  }

  // ---------------------------------------------------------------- cada cuadro
  let relojContadores = 0, relojDefensa = 25;
  function actualizar(dt) {
    const js = jugador?.estado;
    reloj += dt;
    if (js && mundo) {
      mundo.actualizar(dt, js.pos, reloj);
      if (carrera && carrera.fase !== 'fin') {
        const ev = pasoCarrera(carrera, dt, js.pos, medioDe(js));
        if (ev) manejar(ev);
        if (carrera.fase === 'corriendo' && recordActual?.fantasma) mundo.ponerFantasma(posFantasma(recordActual.fantasma, carrera.t), carrera.medio);
      } else if (finMostrado > 0) {
        finMostrado -= dt;
        if (finMostrado <= 0) { mundo.ocultarCircuito(); carrera = null; }
      }
      dibujarHud(js);
    }
    relojContadores += dt;
    if (relojContadores > 1) {
      relojContadores = 0;
      revisarContadores();
      // cerca del poste de otra forma de correr: se avisa una vez
      if (js && mundo && !carrera) {
        const medio = medioDe(js);
        for (const c of CIRCUITOS) {
          const d = Math.hypot(js.pos.x - c.salida.x, js.pos.z - c.salida.z);
          if (d > MEDIOS[c.medio].poste + 6) { avisados.delete(c.id); continue; }
          if (c.medio !== medio && medio !== 'otro' && !avisados.has(c.id)) {
            avisados.add(c.id);
            nota(c.nombre, `Se corre ${MEDIOS[c.medio].nombre}${c.medio === 'vela' ? ': con el velero de tu varadero' : c.medio === 'kayak' ? ': el kayak está en el muelle' : ''}`);
          }
        }
      }
    }
    relojDefensa += dt;
    if (relojDefensa > 30) { relojDefensa = 0; revisarDefensa(); }
    relojSync += dt;
    if (syncPendiente > 0) { syncPendiente -= dt; if (syncPendiente <= 0) sincronizarTorneo(); }
    else if (relojSync > 300) { relojSync = 0; sincronizarTorneo(); }
  }

  // ---------------------------------------------------------------- la portada y el panel
  function textoPortada() {
    const def = desafioDelDia(hoy());
    const t = torneoActual();
    if (esDesafio) return `Desafío del día (en el Relax): ${def.titulo} · Torneo de la semana: la defensa se juega con ${t.codigo}`;
    const d = diarios();
    const racha = rachaVigente(d, hoy());
    return `Desafío del día: ${def.titulo} · ${textoAvance(d, def)}${racha ? ` · racha de ${racha} ${racha === 1 ? 'día' : 'días'}` : ''} · Torneo de la semana ${t.codigo}`;
  }
  function pintarPortada() {
    const p = document.getElementById('diario-portada');
    if (p) p.textContent = textoPortada();
  }
  const panel = () => document.getElementById('modos31');
  const panelAbierto = () => !!panel() && !panel().classList.contains('oculto');
  let origenPanel = null;
  function abrirPanel(origen) {
    origenPanel = origen;
    if (origen) document.getElementById(origen)?.classList.add('oculto');
    revisarDefensa();
    dibujarPanel();
    panel()?.classList.remove('oculto');
    if (torneoSync.hayCarpeta()) sincronizarTorneo();
  }
  function cerrarPanel() {
    panel()?.classList.add('oculto');
    if (origenPanel) document.getElementById(origenPanel)?.classList.remove('oculto');
    origenPanel = null;
    pintarPortada();
  }
  function dibujarPanel() {
    const cont = document.getElementById('modos31-contenido');
    if (!cont) return;
    cont.textContent = '';
    cont.classList.add('modos31');
    // el desafío del día
    const def = desafioDelDia(hoy());
    cont.appendChild(el('h3', '', `Desafío del día · ${def.fecha}`));
    cont.appendChild(el('p', '', def.titulo));
    cont.appendChild(el('p', 'dato', def.texto));
    if (esDesafio) cont.appendChild(el('p', 'dato', 'Se juega en el Relax: el mismo para todos los que jueguen hoy.'));
    else {
      const d = diarios();
      cont.appendChild(el('p', 'dato', `${textoAvance(d, def)} · racha: ${rachaVigente(d, hoy())} · mejor racha: ${d.mejorRacha} · ${d.total} puntos en total`));
    }
    // las carreras
    cont.appendChild(el('h3', '', 'Carreras contrarreloj'));
    if (esDesafio) cont.appendChild(el('p', 'dato', 'Los circuitos se corren en el Relax.'));
    else {
      cont.appendChild(el('p', 'dato', 'Los postes de largada están en el mapa (M). E en el poste para largar; la llegada es en el mismo poste.'));
      const tabla = el('table');
      const cab = el('tr');
      for (const h of ['Circuito', 'Cómo', 'Largo', 'Récord', 'Otras vueltas']) cab.appendChild(el('th', '', h));
      tabla.appendChild(cab);
      for (const c of CIRCUITOS) {
        const tr = el('tr');
        const rec = mejorDe(c.id);
        const otras = Object.keys(GIROS).map((g) => { const r = mejorDe(claveRecord(c.id, g)); return r ? `${GIROS[g].nombre} ${formatoTiempo(r.ms)}` : ''; }).filter(Boolean).join(' · ');
        for (const v of [c.nombre, MEDIOS[c.medio].nombre, `${Math.round(largoDe(c))} m`, rec ? `${formatoTiempo(rec.ms)}${rec.fecha ? ` (${rec.fecha})` : ''}` : `— (ref. ${formatoTiempo(refDe(c) * 1000)})`, otras || '—']) tr.appendChild(el('td', '', v));
        tabla.appendChild(tr);
      }
      cont.appendChild(tabla);
    }
    // el torneo
    const t = torneoActual();
    const local = torneoSync.local;
    cont.appendChild(el('h3', '', `Torneo de la semana · ${t.semana} · ${t.codigo}`));
    cont.appendChild(el('p', 'dato', `Pesca: la ${t.pezNombre} más grande · Carrera: ${t.circuitoNombre}, vuelta normal · Defensa: noches resistidas en La noche de los duendes con el código ${t.codigo}`));
    const filas = tablaSemana(todasLasEntradas(local), t);
    const tabla = el('table');
    const cab = el('tr');
    for (const h of ['Quién', 'Pesca', 'Carrera', 'Defensa', 'Puntos']) cab.appendChild(el('th', '', h));
    tabla.appendChild(cab);
    const yo = nombreVisible(local).toLocaleLowerCase('es');
    for (const f of filas) {
      const tr = el('tr', f.nombre.toLocaleLowerCase('es') === yo ? 'propio' : '');
      for (const v of [f.nombre, f.pesca ? `${f.pesca} cm` : '—', f.carreraMs ? formatoTiempo(f.carreraMs) : '—', f.noches || f.abatidos ? `${f.noches} noches · ${f.abatidos}` : '—', String(f.puntos.total)]) tr.appendChild(el('td', '', v));
      tabla.appendChild(tr);
    }
    if (!filas.length) { const tr = el('tr'); const td = el('td', 'dato', 'Todavía nadie anotó nada esta semana.'); td.colSpan = 5; tr.appendChild(td); tabla.appendChild(tr); }
    cont.appendChild(tabla);
    // tu nombre, el código para pasar y el de un amigo
    const filaNombre = el('div', 'fila-torneo');
    filaNombre.appendChild(el('span', '', 'Tu nombre en la tabla:'));
    const inpNombre = el('input'); inpNombre.id = 'torneo-nombre'; inpNombre.maxLength = 18; inpNombre.value = local.nombre; inpNombre.placeholder = nombreVisible(local);
    const btnNombre = el('button', '', 'Guardar');
    btnNombre.addEventListener('click', () => { torneoSync.renombrar(inpNombre.value); syncPendiente = 1; dibujarPanel(); });
    filaNombre.append(inpNombre, btnNombre);
    cont.appendChild(filaNombre);
    const mia = local.propias.find((e) => e.semana === t.semana);
    const filaCodigo = el('div', 'fila-torneo');
    filaCodigo.appendChild(el('span', '', 'Tu código para pasar:'));
    const inpCodigo = el('input'); inpCodigo.id = 'torneo-codigo'; inpCodigo.readOnly = true; inpCodigo.value = mia ? codigoPuntaje(mia) : 'Anotá algo primero';
    const btnCopiar = el('button', '', 'Copiar');
    btnCopiar.addEventListener('click', async () => { try { await navigator.clipboard.writeText(inpCodigo.value); nota('Copiado', 'Pasáselo a quien quieras: lo pega en su torneo'); } catch { inpCodigo.select(); } });
    filaCodigo.append(inpCodigo, btnCopiar);
    cont.appendChild(filaCodigo);
    const filaAmigo = el('div', 'fila-torneo');
    filaAmigo.appendChild(el('span', '', 'El código de un amigo:'));
    const inpAmigo = el('input'); inpAmigo.id = 'torneo-amigo'; inpAmigo.placeholder = 'HT1.2026S40.…'; inpAmigo.maxLength = 120;
    const btnAmigo = el('button', '', 'Sumar a la tabla');
    btnAmigo.addEventListener('click', () => { const r = importarCodigo(inpAmigo.value); if (r !== true) nota('Ese código no sirve', r); else dibujarPanel(); });
    filaAmigo.append(inpAmigo, btnAmigo);
    cont.appendChild(filaAmigo);
    const est = torneoSync.estado();
    const sync = torneoSync.hayCarpeta()
      ? `Con la carpeta sincronizada: cada compu deja su archivo y la tabla junta todos${est.ultimaLectura ? ` (leída ${new Date(est.ultimaLectura).toLocaleTimeString()})` : ''}.`
      : 'Sin carpeta sincronizada (sólo en la versión de escritorio): la tabla tiene lo tuyo y los códigos que pegues.';
    cont.appendChild(el('p', 'dato', sync + (est.error ? ` · ${est.error}` : '')));
    ctx.traducir?.(cont);
  }
  function importarCodigo(texto) {
    const e = leerCodigoPuntaje(texto);
    if (!e) return 'Revisá que esté entero: HT1, la semana, el nombre, los números y la firma';
    if (!sumarAmigo(torneoSync.local, e)) return 'Ese sos vos';
    torneoSync.guardarLocal();
    syncPendiente = 1;
    nota('Torneo de la semana', `${e.nombre} está en la tabla${e.semana !== torneoActual().semana ? ` (de la semana ${e.semana})` : ''}`);
    return true;
  }
  const marcasMapa = () => (mundo ? CIRCUITOS.map((c) => ({ x: c.salida.x, z: c.salida.z, tipo: 'parada', nombre: `Largada: ${c.nombre}` })) : []);

  // al arrancar: la portada, la defensa y, en un rato, la carpeta
  pintarPortada();
  revisarDefensa();
  setTimeout(() => { if (torneoSync.hayCarpeta()) sincronizarTorneo(); }, 4000);

  return {
    accion, actualizar, pez, obraTerminada, abrirPanel, cerrarPanel, panelAbierto, textoPortada, pintarPortada, marcasMapa, importarCodigo,
    corriendo: () => !!carrera && carrera.fase !== 'fin',
    // para las pruebas (?debug=1)
    __: {
      estado: () => ({ carrera: carrera ? { id: carrera.id, giro: carrera.giro, fase: carrera.fase, sig: carrera.sig, t: carrera.t, puntos: carrera.puntos } : null, ultimoResultado, hud: hud?.textContent || '', fecha: hoy(), torneo: torneoActual(), local: torneoSync.local, diarios: diarios(), carreras: carreras() }),
      fecha: (f) => { fechaForzada = f || null; pintarPortada(); },
      largar: (id, giro = null) => largar(circuitoDe(id), giro),
      desafio: (f) => desafioDelDia(f || hoy()),
      sincronizar: () => sincronizarTorneo(),
      torneoSync, mundo, dibujarPanel,
      codigo: () => { const m = torneoSync.local.propias.find((e) => e.semana === torneoActual().semana); return m ? codigoPuntaje(m) : ''; },
    },
  };
}
