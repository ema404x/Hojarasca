// 4.3 · El empleo fijo, del lado del juego (las reglas están en empleo.js, lo que se ve en empleo-mundo.js). Sólo en el Relax.
//   · el cartel de turnos de cada local: E al lado pregunta «¿Querés trabajar acá?» y, si aceptás, fichás;
//   · durante el turno, cada tarea tiene su lugar en el local (una flecha dorada lo marca): E ahí la hace en unos segundos (si te movés,
//     se corta); el reloj del juego avanza con cada tarea; al terminar las ocho (o si pasa la hora o el día) se cierra el turno y se cobra;
//   · irte antes: E en el cartel (o alejarte del local) cierra el turno con lo hecho y una multa;
//   · el HUD del turno (hora, tareas, sueldo acumulado y la tarea que toca) y la página «Trabajo en la aldea» del cuaderno.
// Todo corre por eventos y a medio segundo: nada nuevo por cuadro (salvo la barra de la tarea mientras la hacés).
import { edificioEnMundo } from './aldea.js';
import { formatoPesos, hayEconomia } from './economia.js';
import { crearEmpleoMundo } from './empleo-mundo.js';
import { EMPLEO, PUESTOS, IDS_PUESTOS, ESCALONES, empleoDe, turnoActivo, tareaActual, puedeFichar, fichar, hacerTarea, cerrarTurno, motivoDeCierre, pagoDelTurno, sueldoAcumulado, deNombre, aNombre, textoPuesto, textoOferta, textoNoPodes, textoCierre, resumenEmpleo, horaReloj, escalonDe, esLocalTuyo } from './empleo.js';
import { jornalesHoy, JORNAL } from './trabajos.js';
import { dondeEstaElJefe } from './empleo-presencia.js';

export const RADIO_TAREA = 1.5, RADIO_CARTEL = 1.3, RADIO_ABANDONO = 45, RADIO_AVISO = 28, RADIO_CARTELES = 70;

// `ctx`: progreso(), jugador() (el del juego: estado.pos), escena(), desafio(), nota(t, sub, nueva), sonido(), guardar(), confirmar(texto, extra) → Promise<bool>,
// avanzarHoras(h) → bool (false con la hora de tu reloj: no se salta), reloj() → bool, ver() → bool (¿se muestra el HUD?), azar() (0..1),
// fiestaEn(clave, dia, hora) → la fecha de la fiesta a la que va esa persona a esa hora, o null (4.4.2: ¿el jefe está en su local?), falla(nombre, error) (4.4.2)
export function crearEmpleoJuego(ctx) {
  const prog = () => ctx.progreso();
  const activo = () => !ctx.desafio?.() && hayEconomia(prog());
  const dia = () => Math.max(1, Math.floor(Number(prog().dia) || 1));
  const horas = () => Number(prog().horas) || 0;
  let mundo = null;
  const el = () => { if (!mundo) { const e = ctx.escena?.(); if (e) mundo = crearEmpleoMundo({ escena: e }); } return mundo; };
  let hace = null;          // la tarea que se está haciendo: { t, dur, x, z, id }
  let hud = null, barra = null, textoHud = '';
  let acum = 1, acumCarteles = 9, avisoLejos = false, ofreciendo = false;
  let horaVista = -1, memoT = 0;   // 4.4.2: la hora de la última pasada (para saber si te dormiste antes de que terminara el turno) y cada cuánto se olvida dónde estaba el jefe

  // ---------------------------------------------------------------- ¿se puede fichar? (con el cupo de jornales del día y con el jefe en su local)
  // dónde está el jefe a esa hora: se recuerda un rato (se mira cada cuarto de hora del turno y la E junto al cartel pregunta seguido)
  const memoJefe = new Map();
  function dondeJefe(clave, d, h) {
    const c = `${clave}|${d}|${Math.round(h * 8)}`;
    let r = memoJefe.get(c);
    if (!r) { r = dondeEstaElJefe(prog(), clave, d, h, ctx.fiestaEn); if (memoJefe.size > 400) memoJefe.clear(); memoJefe.set(c, r); }
    return r;
  }
  const extraFichar = () => ({ jornales: jornalesHoy(prog(), dia()), porDia: JORNAL.porDia, donde: dondeJefe });
  const fichable = (k) => puedeFichar(prog(), k, dia(), horas(), extraFichar());

  // ---------------------------------------------------------------- dónde está cada cosa
  const cacheLugar = new Map();
  function enMundo(local, bx, bz, dy = 0) {
    const e = edificioEnMundo(local);
    if (!e) return null;
    const c = Math.cos(e.rot), s = Math.sin(e.rot);
    return { x: e.x + bx * c + bz * s, z: e.z - bx * s + bz * c, y: e.y + dy, giro: e.rot, cx: e.x, cz: e.z };
  }
  function lugar(local, id) {
    const clave = `${local}|${id}`;
    if (!cacheLugar.has(clave)) {
      const P = PUESTOS[local], q = id === 'ficha' ? P.ficha : P.tareas.find((t) => t.id === id);
      cacheLugar.set(clave, q ? enMundo(local, q.x, q.z, q.dy) : null);
    }
    return cacheLugar.get(clave);
  }
  // ¿Estás a menos de `r` metros del lugar (y en su piso)?
  function cerca(js, l, r) {
    if (!l || !js?.pos) return false;
    return Math.hypot(js.pos.x - l.x, js.pos.z - l.z) < r && Math.abs(js.pos.y - l.y) < 1.7;
  }

  // ---------------------------------------------------------------- la E y el aviso
  function accion(js) {
    try { return accionSinRed(js); } catch (e) { ctx.falla?.('empleo-accion', e); return null; }   // (4.4.2: la E y el aviso no pueden caer por un error del empleo)
  }
  function accionSinRed(js) {
    if (!activo() || !js) return null;
    const p = prog(), t = turnoActivo(p);
    if (t) {
      if (hace) return { tipo: 'ocupado', texto: `${tareaActual(p)?.nombre || 'Trabajando'}…`, hacer: () => {} };
      const tarea = tareaActual(p);
      if (tarea && cerca(js, lugar(t.local, tarea.id), RADIO_TAREA)) return { tipo: 'tarea', texto: `${tarea.nombre} (${t.hechas + 1} de ${t.total})`, hacer: () => empezarTarea() };
      if (cerca(js, lugar(t.local, 'ficha'), RADIO_CARTEL)) return { tipo: 'salir', texto: `Irte del turno antes de tiempo (cobrás ${formatoPesos(pagoDelTurno(t, true).monto)})`, hacer: () => preguntarSalida() };
      return null;
    }
    for (const k of IDS_PUESTOS) {
      if (!cerca(js, lugar(k, 'ficha'), RADIO_CARTEL)) continue;
      const v = fichable(k);
      if (v.ok) return { tipo: 'ficha', local: k, texto: `Tomar el puesto: ${textoPuesto(k, v.escalon)}`, hacer: () => ofrecer(k) };
      return { tipo: 'info', local: k, texto: `Cartel de turnos: ${PUESTOS[k].completo}`, hacer: () => ctx.nota(`Cartel de turnos: ${PUESTOS[k].completo}`, `${textoPuesto(k, escalonDe(p, k))}. ${textoNoPodes(v, k)}`, true) };
    }
    return null;
  }
  // Mientras hay una tarea a mano, un vecino mirado no se come la E (el gerente detrás de la reja, Martín en el yunque…)
  const tapaVecino = (js) => { const a = accion(js); return !!a && a.tipo !== 'info'; };

  async function ofrecer(k) {
    if (ofreciendo) return;
    const p = prog(), v = fichable(k);
    if (!v.ok) { ctx.nota('No se puede fichar', textoNoPodes(v, k), true); return; }
    ofreciendo = true;
    let si = false;
    try { si = await ctx.confirmar(textoOferta(k, v.escalon, v.posibles), { si: 'Tomar el puesto', no: 'Ahora no' }); } catch { si = false; }
    ofreciendo = false;
    if (!si || !activo()) return;
    const r = fichar(prog(), k, dia(), horas(), extraFichar());   // (se vuelve a mirar: entre la pregunta y el sí no pasa el tiempo, pero el estado manda)
    if (!r.ok) { ctx.nota('No se puede fichar', textoNoPodes(r, k), true); return; }
    const P = PUESTOS[k], saludo = P.saludos[Math.floor((ctx.azar?.() ?? Math.random()) * P.saludos.length) % P.saludos.length];
    ctx.sonido?.()?.anotar?.();
    ctx.nota(`Fichaste en ${P.nombre}`, `${P.jefe}: «${saludo}» · Primera tarea: ${tareaActual(prog())?.nombre.toLowerCase()}`, true);
    ponerMarca(); dibujarHud(true); ctx.guardar?.();
  }
  async function preguntarSalida() {
    if (ofreciendo) return;
    const t = turnoActivo(prog());
    if (!t) return;
    ofreciendo = true;
    const pago = pagoDelTurno(t, true);
    const texto = t.hechas > 0
      ? `¿Te vas antes de terminar el turno? Hiciste ${t.hechas} de ${t.total} tareas: cobrás ${formatoPesos(pago.monto)} (ya descontados ${formatoPesos(pago.multa)} por irte antes) y queda anotado.`
      : '¿Te vas sin haber hecho ninguna tarea? No cobrás nada y hoy podés volver a fichar.';
    let si = false;
    try { si = await ctx.confirmar(texto, { si: 'Irme', no: 'Seguir trabajando' }); } catch { si = false; }
    ofreciendo = false;
    if (si && turnoActivo(prog())) cerrar('abandono');
  }

  // ---------------------------------------------------------------- las tareas
  function empezarTarea() {
    const p = prog(), t = turnoActivo(p), tarea = tareaActual(p), js = ctx.jugador?.()?.estado;
    if (!t || !tarea || hace || !js) return;
    hace = { id: tarea.id, t: 0, dur: tarea.seg, x: js.pos.x, z: js.pos.z };
    ctx.sonido?.()?.paso?.('madera', 0.5);
    mundo?.quitarMarca();
    dibujarHud(true);
  }
  function cortarTarea(motivo) {
    if (!hace) return;
    hace = null;
    if (motivo) ctx.nota('Quedó sin hacer', motivo);
    ponerMarca(); dibujarHud(true);
  }
  function terminarTarea() {
    const tarea = tareaActual(prog());
    hace = null;
    const r = hacerTarea(prog());
    if (!r.ok) return;
    ctx.sonido?.()?.juntar?.();
    // el reloj corre con cada tarea (con la hora de tu reloj no se salta: el turno se mide en tareas)
    if (!ctx.reloj?.()) ctx.avanzarHoras?.(EMPLEO.horasPorTarea);
    const t = turnoActivo(prog());
    if (r.terminado) { cerrar('completo'); return; }
    if (t) ctx.nota(`${tarea?.hecho || 'Tarea hecha'}`, `${r.hechas} de ${t.total} · sueldo acumulado ${formatoPesos(sueldoAcumulado(t))} · sigue: ${tareaActual(prog())?.nombre.toLowerCase()}`);
    ponerMarca(); dibujarHud(true); ctx.guardar?.();
  }

  // ---------------------------------------------------------------- cerrar el turno
  const TITULOS = { completo: (P) => `Terminó el turno en ${P.nombre}`, tiempo: (P) => `Se cerró el turno en ${P.nombre}`, dia: () => 'Pasó el día: se cerró el turno', abandono: (P) => `Te fuiste ${deNombre(P.nombre)}`, compra: (P) => `Ya es tuyo ${P.nombre}: se cerró el turno` };
  function cerrar(motivo, titulo = '') {
    const p = prog(), t = turnoActivo(p);
    if (!t) return null;
    const P = PUESTOS[t.local];
    hace = null; avisoLejos = false;
    const r = cerrarTurno(p, motivo, P.jefe);
    mundo?.quitarMarca(); dibujarHud(true);
    if (!r.ok) return r;
    if (r.monto > 0) ctx.sonido?.()?.anotar?.();
    ctx.nota(titulo || TITULOS[motivo]?.(P) || 'Terminó el turno', textoCierre(r, p), true);
    if (r.ascendio) {
      const a = r.ascendio;
      setTimeout(() => { try { ctx.sonido?.()?.anotar?.(); ctx.nota(`Ascendiste: ${a.cargo}`, `Ahora sos ${a.nombre.toLowerCase()} en ${P.nombre} y cobrás ${formatoPesos(a.sueldo)} por turno`, true); } catch { /* nada */ } }, 2200);
    }
    ctx.guardar?.();
    return r;
  }

  // ---------------------------------------------------------------- el HUD del turno
  function crearHud() {
    if (hud || typeof document === 'undefined') return;
    hud = document.createElement('div');
    hud.id = 'turno-hud';
    hud.setAttribute('aria-live', 'off');   // (4.4.2: el texto se reescribe con cada minuto del juego; el cambio de tarea ya lo anuncia la nota)
    // 4.4.2: adentro de #hud (no del body): así queda DEBAJO de la pausa, el cuaderno, el mapa y la guía, se esconde con el modo foto y crece con la letra grande
    hud.style.cssText = 'position:absolute;left:14px;top:96px;width:min(330px,40vw);padding:9px 12px 10px;border-radius:8px;background:var(--tinta-velo,rgba(20,28,23,0.72));'
      + 'color:#f1e7d6;font:14px/1.35 Spectral,Georgia,serif;pointer-events:none;text-shadow:0 1px 2px #000;display:none;backdrop-filter:blur(4px)';
    const caja = document.createElement('div'); caja.className = 'turno-texto';
    barra = document.createElement('div');
    barra.style.cssText = 'height:6px;border-radius:3px;background:rgba(241,231,214,0.18);margin-top:7px;overflow:hidden;display:none';
    const lleno = document.createElement('div'); lleno.style.cssText = 'height:100%;width:0%;background:#e8c46a';
    barra.appendChild(lleno);
    hud.appendChild(caja); hud.appendChild(barra);
    (document.getElementById('hud') || document.body).appendChild(hud);
  }
  function dibujarHud(forzar = false) {
    const p = prog(), t = activo() ? turnoActivo(p) : null;
    if (!t) { if (hud && hud.style.display !== 'none') hud.style.display = 'none'; textoHud = ''; return; }
    crearHud();
    if (!hud) return;
    const visible = ctx.ver ? ctx.ver() : true;
    if (!visible) { if (hud.style.display !== 'none') hud.style.display = 'none'; return; }
    const P = PUESTOS[t.local], tarea = tareaActual(p);
    const txt = [
      `${P.cargos[t.escalon]} · ${P.completo}`,
      `${horaReloj(horas())} · tareas ${t.hechas} de ${t.total} · sueldo ${formatoPesos(sueldoAcumulado(t))} de ${formatoPesos(t.sueldo)}`,
      tarea ? (hace ? `Haciendo: ${tarea.nombre.toLowerCase()}…` : `Ahora: ${tarea.nombre.toLowerCase()} (${tarea.donde})`) : 'Última tarea hecha',
    ].join('\n');
    if (forzar || txt !== textoHud) {
      textoHud = txt;
      const caja = hud.firstChild; caja.textContent = '';
      txt.split('\n').forEach((l, i) => { const d = document.createElement('div'); d.textContent = l; if (i === 0) d.style.cssText = 'font-weight:600;letter-spacing:.02em;color:#e8c46a;margin-bottom:2px'; if (i === 2) d.style.cssText = 'margin-top:3px'; caja.appendChild(d); });
    }
    if (hud.style.display === 'none') hud.style.display = '';
    barra.style.display = hace ? '' : 'none';
  }
  function moverBarra() {
    if (!hace || !barra) return;
    barra.firstChild.style.width = `${Math.min(100, Math.round((hace.t / hace.dur) * 100))}%`;
  }
  function ponerMarca() {
    const m = el(), p = prog(), t = activo() ? turnoActivo(p) : null, tarea = t ? tareaActual(p) : null;
    if (!m) return;
    const l = tarea ? lugar(t.local, tarea.id) : null;
    if (l) m.marcar(l.x, l.y + 0.03, l.z); else m.quitarMarca();
  }
  let cartelesListos = false;
  function ponerCarteles() {
    if (cartelesListos) return;
    const m = el();
    if (!m) return;
    cartelesListos = true;
    for (const k of IDS_PUESTOS) { const l = lugar(k, 'ficha'); if (l) m.ponerCartel(k, l.x, l.y, l.z, l.giro + (PUESTOS[k].ficha.giro || 0)); }
  }

  // ---------------------------------------------------------------- el reloj del sistema
  // 4.10.1: la consola de códigos (hora / dia) mueve el reloj: si con el nuevo día u hora el turno ya no corre, se cierra con lo hecho y SIN multa
  // (antes lo tomaba por «te fuiste a dormir» y cobraba el 25 % de multa y una falta: los códigos no dejan rastro)
  function alSaltarElTiempo(dia2, hora2) {
    const p = prog();
    if (!activo() || !turnoActivo(p)) return null;
    const motivo = motivoDeCierre(p, dia2 ?? dia(), hora2 ?? horas(), !!ctx.reloj?.());
    return motivo ? cerrar(motivo) : null;
  }
  function actualizar(dt) {
    if (!activo()) { if (hud && hud.style.display !== 'none') dibujarHud(); return; }
    ponerCarteles();
    const js = ctx.jugador?.()?.estado;
    if (hace) {
      hace.t += dt;
      if (js && Math.hypot(js.pos.x - hace.x, js.pos.z - hace.z) > 1.3) cortarTarea('Te alejaste del lugar: la tarea quedó a medias.');
      else if (hace.t >= hace.dur) terminarTarea();
      else moverBarra();
    }
    acum += dt; acumCarteles += dt;
    if (acumCarteles >= 1) {
      acumCarteles = 0;
      const m = el();
      if (m && js) {
        for (const k of IDS_PUESTOS) { const l = lugar(k, 'ficha'); if (l) m.verCartel(k, Math.hypot(js.pos.x - l.cx, js.pos.z - l.cz) < RADIO_CARTELES); }
      }
    }
    if (acum < 0.5) return;
    acum = 0;
    const p = prog(), t = turnoActivo(p);
    const horaAntes = horaVista; horaVista = horas();
    if ((memoT += 0.5) >= 10) { memoT = 0; memoJefe.clear(); }
    if (!t) { dibujarHud(); return; }
    // 4.4.2: ¿compraste el local con el turno en marcha? Se cierra con lo hecho hasta ahí (no se ficha en un negocio propio)
    if (esLocalTuyo(p, t.local)) { cerrar('compra'); return; }
    // ¿Se acabó el día o la hora? Se cierra con lo hecho. ¿Te fuiste lejos? Se cierra con multa
    const motivo = motivoDeCierre(p, dia(), horas(), !!ctx.reloj?.());
    if (motivo) {
      // 4.4.2: dormir (o la siesta) con el turno todavía abierto, sin haberlo terminado, es irse antes: lleva la multa y la falta como cualquier abandono
      if (t.hechas < t.total && horaAntes >= 0 && horaAntes < t.hasta) cerrar('abandono', 'Te fuiste a dormir sin terminar el turno');
      else cerrar(motivo);
      return;
    }
    if (js) {
      const c = lugar(t.local, 'ficha');
      const d = c ? Math.hypot(js.pos.x - c.cx, js.pos.z - c.cz) : 0;
      if (d > RADIO_ABANDONO) { cerrar('abandono'); return; }   // (4.4.2: un solo aviso: el del cierre, que dice lo que cobraste y la multa)
      if (d > RADIO_AVISO && !avisoLejos) { avisoLejos = true; ctx.nota('Estás lejos del trabajo', `Volvé ${aNombre(PUESTOS[t.local].nombre)}: si te vas, el turno se cierra con multa.`); }
      else if (d < RADIO_AVISO - 4) avisoLejos = false;
    }
    if (marcaFalta()) ponerMarca();
    dibujarHud();
  }
  const marcaFalta = () => { const m = el(); return !!m && !hace && !!tareaActual(prog()) && !m.marcaVisible(); };

  // Al cargar una partida con un turno empezado: se retoma (si ya pasó su hora o su día, actualizar() lo cierra con lo hecho)
  function alCargar() { hace = null; avisoLejos = false; acum = 1; horaVista = -1; memoJefe.clear(); ponerCarteles(); ponerMarca(); dibujarHud(true); }

  // ---------------------------------------------------------------- el cuaderno
  function paginaCuaderno() {
    const r = resumenEmpleo(prog());
    const trabajo = r.locales.filter((l) => l.trabajo);
    return {
      id: 'empleo', nombre: 'Trabajo en la aldea',
      marca: r.turno ? 'en turno' : trabajo.length ? `${r.total.turnos} turnos` : 'sin puesto',
      pendiente: !trabajo.length && !r.turno,
      dibujar(ficha, e) {
        ficha.appendChild(e('h2', '', 'Trabajo en la aldea'));
        if (!trabajo.length && !r.turno) ficha.appendChild(e('p', 'texto', 'Todavía no tomaste ningún puesto. Buscá el cartel de turnos en el almacén, la casa de té, el taller ferroviario o el banco: se ficha con E.'));
        else ficha.appendChild(e('p', 'anotado', `${r.total.turnos} ${r.total.turnos === 1 ? 'turno hecho' : 'turnos hechos'} · ${formatoPesos(r.total.cobrado)} cobrados${r.total.abandonos ? ` · ${r.total.abandonos} ${r.total.abandonos === 1 ? 'vez' : 'veces'} que te fuiste antes` : ''}`));
        if (r.turno) ficha.appendChild(e('p', 'pista', `Ahora estás trabajando en ${PUESTOS[r.turno.local].nombre}: ${r.turno.hechas} de ${r.turno.total} tareas.`));
        for (const l of r.locales) {
          ficha.appendChild(e('h3', '', `${l.nombre}${l.tuyo ? ' · es tuyo' : l.trabajo ? ` · ${l.cargo}` : ''}`));
          if (l.tuyo) { ficha.appendChild(e('p', 'texto', `Le compraste el local a ${l.jefe}: ya no se toman turnos acá.${l.trabajo ? ` Llegaste a ${l.escalonNombre.toLowerCase()} y cobraste ${formatoPesos(l.cobrado)} en total.` : ''}`)); continue; }
          const horario = `Turno de ${l.turno} · te recibe ${l.jefe} · ${formatoPesos(l.sueldo)} por turno`;
          ficha.appendChild(e('p', 'texto', l.trabajo ? `${l.escalonNombre} · ${l.dias} ${l.dias === 1 ? 'día cumplido' : 'días cumplidos'}${l.faltas ? ` · ${l.faltas} ${l.faltas === 1 ? 'vez' : 'veces'} que te fuiste antes` : ''}. ${horario}.` : `Sin empezar. ${horario}.`));
          if (l.falta.hay) {
            const partes = [];
            if (l.falta.dias > 0) partes.push(`${l.falta.dias} ${l.falta.dias === 1 ? 'día más' : 'días más'}`);
            if (l.falta.oficio > 0) partes.push(`${l.falta.oficioNombre} de nivel ${l.falta.nivelOficio}`);
            ficha.appendChild(e('p', 'pista', partes.length ? `Para ser ${l.falta.nombre.toLowerCase()}: ${partes.join(' y ')}.` : `Para ser ${l.falta.nombre.toLowerCase()}: te falta cumplir un turno más.`));
          } else if (l.escalon >= ESCALONES.length - 1) ficha.appendChild(e('p', 'pista', 'Llegaste a lo más alto del puesto.'));
        }
        if (r.historial.length) {
          ficha.appendChild(e('h3', '', 'Últimos turnos'));
          const ul = e('ul', 'habilidades');
          for (const h of r.historial) ul.appendChild(e('li', '', `Día ${h.dia} · ${PUESTOS[h.local].completo}: ${h.hechas} de ${h.total} tareas, ${formatoPesos(h.monto)}${h.motivo === 'abandono' ? ' (te fuiste antes)' : ''}`));
          ficha.appendChild(ul);
        }
      },
    };
  }

  return {
    accion, tapaVecino, actualizar, alCargar, paginaCuaderno, cerrar, alSaltarElTiempo,
    turno: () => turnoActivo(prog()), haciendo: () => !!hace, mundo: () => mundo, lugar,
    // para las pruebas y las capturas: fichar sin cartel, y hacer la tarea que toca al instante
    _fichar: (k) => { const r = fichar(prog(), k, dia(), horas()); if (r.ok) { ponerMarca(); dibujarHud(true); } return r; },
    _tareaYa: () => { if (!turnoActivo(prog())) return null; hace = { id: tareaActual(prog())?.id, t: 0, dur: 0, x: ctx.jugador().estado.pos.x, z: ctx.jugador().estado.pos.z }; terminarTarea(); return turnoActivo(prog()); },
    _hud: () => hud,
  };
}
