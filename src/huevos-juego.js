// 4.2 (huevos de pascua): el enganche de los easter eggs con el juego (sólo en el Relax). Las reglas, en huevos.js; lo que se ve,
// en huevos-mundo.js. Todo por evento, nada por cuadro: `actualizar(dt)` sólo junta tiempo y mira cada 2 segundos.
// `ctx`: { progreso(), desafio(), jugador() → { estado }, sonido, nota(t, sub, nueva), diario(tipo, dato), guardar(),
//   sumarMaterial(k, n), sumarCosa(k, n), cantidad(tipo, k), refrescarBarra(), registrar(id), mundo (huevos-mundo.js), arboles() → veg.arboles,
//   refugio() → { x, z },
//   niebla() → la opacidad de la niebla de valle (0 a 0,68), camara() → la cámara, mallin() → { x, z }, agua(x, z), altura(x, z),
//   pelarPasto(x, z, radio) → cómo devolver el pasto, cobrar(pesos, motivo) → { ok }, perroPos() → la posición del perro, nombrePerro() }
import { sanearHuevos, trajoDeseo, ofrecerEstrella, pedirDeseo, deseoListo, cumplirDeseo, DESEOS, ESTRELLA, DUENDES, elegirCoihue, puedeConvidar, convidar, bultoListo, levantarBulto,
  HUEMUL, huemulAfuera, salioHuemul, seFueHuemul, avistoHuemul, seAsusta,
  HUESO, enterroHueso, lugarDelHueso, hayHueso, desenterrarHueso } from './huevos.js';
import { sumarAmistadDe, nombreCorto } from './vecindad.js';

export function crearHuevosJuego(ctx) {
  const progreso = () => ctx.progreso();
  const activo = () => !ctx.desafio?.();
  const dia = () => Math.max(1, Math.floor(Number(progreso().dia) || 1));
  const horas = () => Number(progreso().horas) || 0;
  function h() {
    const p = progreso();
    if (!p.huevos || typeof p.huevos !== 'object' || !p.huevos.estrella) p.huevos = sanearHuevos(p.huevos, p.dia);
    return p.huevos;
  }

  // ------------------------------------------------------------ 1) la estrella fugaz con deseo
  let cartel = null, tCartel = 0, enDeseo = false;
  function cerrarDeseo() {
    enDeseo = false; clearTimeout(tCartel);
    if (cartel) cartel.classList.add('oculto');
  }
  function armarCartel() {
    if (cartel) return cartel;
    cartel = document.createElement('div');
    cartel.id = 'huevo-deseo';
    cartel.className = 'huevo-deseo oculto';
    cartel.setAttribute('role', 'status');
    (document.getElementById('hud') || document.body).appendChild(cartel);
    return cartel;
  }
  function elegirDeseo(i) {
    if (!enDeseo) return;
    const d = pedirDeseo(h(), i, dia());
    cerrarDeseo();
    if (!d) return;
    ctx.sonido?.pulsar?.(91, { dur: 2.2, vol: 0.06, destino: ctx.sonido.bus?.efectos });
    ctx.nota('Pediste un deseo', DESEOS[i].texto, false);
    ctx.guardar?.();
  }
  // Las teclas 1, 2 y 3 (y Escape) sólo cuentan mientras el cartel está a la vista
  function alTecla(e) {
    if (!enDeseo) return;
    const n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
    if (n !== undefined) { e.preventDefault(); e.stopImmediatePropagation(); elegirDeseo(n); }
    else if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); cerrarDeseo(); }
  }
  window.addEventListener('keydown', alTecla, true);

  // main.js lo llama cuando de verdad viste una fugaz (`n`: las que lleva la noche)
  function fugazVista(diaNoche, n) {
    if (!activo() || enDeseo) return false;
    if (!trajoDeseo(h(), diaNoche, n)) return false;
    ofrecerEstrella(h(), diaNoche);
    enDeseo = true;
    const c = armarCartel();
    c.replaceChildren();
    const t = document.createElement('div'); t.className = 'huevo-deseo-titulo'; t.textContent = 'Una estrella fugaz. Podés pedir un deseo';
    c.appendChild(t);
    DESEOS.forEach((d, i) => {
      const f = document.createElement('div'); f.className = 'huevo-deseo-fila';
      const k = document.createElement('kbd'); k.textContent = String(i + 1);
      f.appendChild(k); f.appendChild(document.createTextNode(` ${d.texto}`));
      f.addEventListener('click', () => elegirDeseo(i));
      c.appendChild(f);
    });
    c.classList.remove('oculto');
    ctx.sonido?.pulsar?.(88, { dur: 1.8, vol: 0.05, destino: ctx.sonido.bus?.efectos });
    clearTimeout(tCartel); tCartel = setTimeout(cerrarDeseo, ESTRELLA.segundos * 1000);
    return true;
  }

  function cumplir() {
    const hoy = dia();
    const r = cumplirDeseo(h(), hoy);
    if (!r) return;
    let texto = r.texto;
    if (r.material) ctx.sumarMaterial?.(r.material.k, r.material.n);
    if (r.vecino) {
      let nombre = r.vecino;
      try { nombre = nombreCorto(r.vecino) || nombre; sumarAmistadDe(progreso(), r.vecino, r.amistad, hoy); } catch (e) { /* (un vecino que no está en esta partida) */ }
      texto = texto.replace('__NOMBRE__', nombre);
    }
    ctx.nota(r.titulo, texto, true);
    ctx.diario?.('evento', texto);
    ctx.refrescarBarra?.();
    ctx.guardar?.();
  }

  // ------------------------------------------------------------ 2) los duendes del Coihue
  let coihue = null, buscado = false;
  const cerca = (p, q, r) => !!p && !!q && Math.hypot(p.x - q.x, p.z - q.z) <= r;
  function buscarCoihue() {
    buscado = true;
    const c = elegirCoihue(ctx.arboles?.(), ctx.refugio?.() || { x: 0, z: 0 });
    if (!c) return;
    coihue = c; ctx.mundo?.ponerCoihue(c, ctx.refugio().x, ctx.refugio().z);
  }
  function ponerVista(pos) {
    if (!coihue || !ctx.mundo) return;
    const lejos = !cerca(pos, coihue, 90), d = h().duendes;
    ctx.mundo.ver({ rueda: !lejos, pila: !lejos && !!d.ofrenda && !bultoListo(h(), dia(), horas()), bulto: !lejos && bultoListo(h(), dia(), horas()) });
  }
  function dejarConvite() {
    const x = h();
    if (!convidar(x, dia())) return;
    ctx.sumarCosa?.('yerba', -1);
    ctx.refrescarBarra?.();
    ctx.sonido?.pulsar?.(76, { dur: 1.4, vol: 0.04, destino: ctx.sonido.bus?.efectos });
    ctx.nota('Dejaste un poco de yerba', 'Al pie del coihue', false);
    ponerVista(ctx.jugador?.()?.estado?.pos);
    ctx.guardar?.();
  }
  function levantar() {
    const r = levantarBulto(h(), dia());
    if (!r) return;
    if (r.material) ctx.sumarMaterial?.(r.material.k, r.material.n);
    ctx.sonido?.anotar?.();
    ctx.nota('Alguien te dejó una nota', r.nota + (r.material ? `  (${r.material.n} ${NOMBRE_MAT[r.material.k] || r.material.k})` : ''), true);
    ctx.diario?.('evento', 'Al pie del coihue había un bulto atado con hilo: ' + r.nota);
    ctx.refrescarBarra?.();
    ponerVista(ctx.jugador?.()?.estado?.pos);
    ctx.guardar?.();
  }
  const NOMBRE_MAT = { calafate: 'calafates', frutilla: 'frutillas', piedra: 'piedras', tronco: 'troncos' };

  // Lo que hace E (y dice el aviso, con la misma función) al pie del coihue
  function accion(js) {
    if (!activo() || !ctx.mundo) return null;
    if (js.enTren || js.enKayak || js.montado || js.nadando) return null;
    if (lugarHueso && hayHueso(h()) && cerca(js.pos, lugarHueso, HUESO.alcance)) return { texto: 'Excavar el montículo de tierra', hacer: cavar };
    if (!coihue || !ctx.mundo.puntoConvite || !cerca(js.pos, ctx.mundo.puntoConvite, DUENDES.alcance)) return null;
    const x = h();
    if (bultoListo(x, dia(), horas())) return { texto: 'Levantar el bulto que dejaron al pie del coihue', hacer: levantar };
    if (puedeConvidar(x, dia()) && (Number(ctx.cantidad?.('cosa', 'yerba')) || 0) >= 1) return { texto: 'Dejar un poco de yerba al pie del coihue', hacer: dejarConvite };
    return null;
  }

  // ------------------------------------------------------------ 3) el huemul blanco del mallín
  let lugarHuemul = null, buscadoHuemul = false, acumHuemul = 0;
  // El lugar fijo: en el mallín (ahí bajan los huemules), en el primer claro de tierra firme y parejo, de cara al agua
  function buscarLugarHuemul() {
    buscadoHuemul = true;
    const m = ctx.mallin?.();
    if (!m) return;
    const arboles = ctx.arboles?.() || [];
    for (const r of [9, 13, 17, 21, 26]) {
      for (let k = 0; k < 12; k++) {
        const a = k * (Math.PI / 6) + 0.4, x = m.x + Math.cos(a) * r, z = m.z + Math.sin(a) * r;
        if (ctx.agua?.(x, z)) continue;
        const y = ctx.altura(x, z);
        if (!(y > 0.6) || [[2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dz]) => Math.abs(ctx.altura(x + dx, z + dz) - y) > 0.5)) continue;
        if (arboles.some((t) => Math.abs(t.x - x) < 7 && Math.abs(t.z - z) < 7 && Math.hypot(t.x - x, t.z - z) < 6)) continue;
        lugarHuemul = { x, z, yaw: Math.atan2(m.x - x, m.z - z) };   // mira al centro del mallín
        return;
      }
    }
  }
  const distA = (p, x, z) => Math.hypot(p.x - x, p.z - z);
  function huemulSale() {
    if (!lugarHuemul || !ctx.mundo) return;
    salioHuemul(h(), dia());
    ctx.mundo.ponerHuemul(lugarHuemul.x, lugarHuemul.z, lugarHuemul.yaw);
    acumHuemul = 0;
    ctx.guardar?.();
  }
  function huemulSeVa(p) {
    const e = ctx.mundo.huemulEstado;
    if (!e.activo || e.huyendo) return;
    // se aleja del jugador (si está encima, hacia el bosque que da la espalda al mallín)
    let dx = e.x - p.x, dz = e.z - p.z;
    if (Math.hypot(dx, dz) < 0.5) { dx = -Math.sin(lugarHuemul.yaw); dz = -Math.cos(lugarHuemul.yaw); }
    ctx.mundo.huirHuemul(dx, dz, HUEMUL.fuga);
    seFueHuemul(h());
    ctx.guardar?.();
  }
  // Por cuadro sólo mientras está afuera; mirarlo se mira cuatro veces por segundo
  function pasoHuemul(dt) {
    if (!ctx.mundo.animarHuemul(dt)) { seFueHuemul(h()); return; }
    acumHuemul += dt;
    if (acumHuemul < 0.25) return;
    acumHuemul = 0;
    const p = ctx.jugador?.()?.estado?.pos, e = ctx.mundo.huemulEstado;
    if (!p || e.huyendo) return;
    const d = distA(p, e.x, e.z);
    if (seAsusta(d)) { huemulSeVa(p); return; }
    const E = ctx.camara?.()?.matrixWorld?.elements, pos = ctx.mundo.huemulPos();
    if (!E || !pos || d > HUEMUL.ver || ctx.progreso().entradas?.['avistaje-huemul']) return;
    const cx = E[12], cy = E[13], cz = E[14], vx = pos.x - cx, vy = pos.y + 1 - cy, vz = pos.z - cz, n = Math.hypot(vx, vy, vz) || 1;
    if ((vx * -E[8] + vy * -E[9] + vz * -E[10]) / n > 0.95) { avistoHuemul(h()); ctx.registrar?.('avistaje-huemul'); }
  }
  function revisarHuemul(pos) {
    if (!buscadoHuemul) buscarLugarHuemul();
    if (!lugarHuemul || !ctx.mundo) return;
    const e = ctx.mundo.huemulEstado, afuera = huemulAfuera(h(), dia(), horas(), Number(ctx.niebla?.()) || 0);
    if (afuera && !e.activo) huemulSale();
    else if (!afuera && e.activo && !e.huyendo) {
      // terminó la mañana (o se fue la niebla): si lo estás mirando de cerca se va caminando; si no, se pierde en la niebla
      if (pos && distA(pos, e.x, e.z) < 60) huemulSeVa(pos);
      else { ctx.mundo.quitarHuemul(); seFueHuemul(h()); }
    }
  }

  // ------------------------------------------------------------ 4) el hueso del perro
  let lugarHueso = null, diaLugarHueso = 0, ladroDia = 0, devolverPasto = null;
  const soltarPasto = () => { if (devolverPasto) { try { devolverPasto(); } catch (e) { /* (sin máscara: nada que devolver) */ } devolverPasto = null; } };
  // Un lugar parejo, de tierra firme y sin árboles encima, lo más cerca posible del que sortea el día (el mismo si se recarga)
  function buscarLugarHueso(diaHueso) {
    const base = ctx.refugio?.() || { x: 0, z: 0 }, arboles = ctx.arboles?.() || [], g = lugarDelHueso(diaHueso);
    for (let k = 0; k < 40; k++) {
      const a = g.ang + k * 0.7, r = Math.min(HUESO.maxR + 12, g.r + k * 1.3), x = base.x + Math.cos(a) * r, z = base.z + Math.sin(a) * r;
      if (ctx.agua?.(x, z)) continue;
      const y = ctx.altura(x, z);
      if (!(y > 0.6) || [[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]].some(([dx, dz]) => Math.abs(ctx.altura(x + dx, z + dz) - y) > 0.35)) continue;
      if (arboles.some((t) => Math.abs(t.x - x) < 4 && Math.abs(t.z - z) < 4 && Math.hypot(t.x - x, t.z - z) < 3.2)) continue;
      return { x, z, giro: g.ang * 3 };
    }
    return { x: base.x + Math.cos(g.ang) * g.r, z: base.z + Math.sin(g.ang) * g.r, giro: 0 };
  }
  function revisarHueso(pos) {
    if (!ctx.mundo) return;
    const x = h();
    if (!hayHueso(x) && enterroHueso(x, dia(), horas())) ctx.guardar?.();
    if (!hayHueso(x)) { lugarHueso = null; ctx.mundo.verMonticulo(false); soltarPasto(); return; }
    if (!lugarHueso || diaLugarHueso !== x.hueso.dia) {
      soltarPasto();
      lugarHueso = buscarLugarHueso(x.hueso.dia); diaLugarHueso = x.hueso.dia;
      ctx.mundo.ponerMonticulo(lugarHueso.x, lugarHueso.z, lugarHueso.giro);
      devolverPasto = ctx.pelarPasto?.(lugarHueso.x, lugarHueso.z, 3.2) || null;   // un claro de tierra pelada: si no, el pasto tapa el montículo
    }
    const cerca2 = !!pos && cerca(pos, lugarHueso, HUESO.ver);
    ctx.mundo.verMonticulo(cerca2);
    // el perro lo huele: un ladrido la primera vez que te acercás (no más de uno por hueso)
    if (cerca2 && ladroDia !== x.hueso.dia && cerca(pos, lugarHueso, 14)) { ladroDia = x.hueso.dia; const pp = ctx.perroPos?.(); if (pp) ctx.sonido?.ladrido?.(pp); }
  }
  function cavar() {
    const r = desenterrarHueso(h());
    if (!r) return;
    let dichoPesos = '';
    if (r.pesos > 0) {
      const c = ctx.cobrar?.(r.pesos, 'Una moneda vieja del hueso del perro');
      if (c && c.ok) dichoPesos = ` (te la cambian por ${r.pesos})`;
      else ctx.sumarMaterial?.('piedra', 1);
    }
    ctx.sonido?.juntar?.();
    const perro = ctx.nombrePerro?.() || 'El perro';
    ctx.nota(`Desenterraste ${r.texto}`, `${perro} mueve la cola, contento${dichoPesos}`, true);
    ctx.diario?.('evento', `Donde escarbó ${ctx.nombrePerro?.() || 'el perro'} había ${r.texto}.`);
    const pp = ctx.perroPos?.();
    if (pp) { ctx.sonido?.ladrido?.(pp); setTimeout(() => { const q = ctx.perroPos?.(); if (q) ctx.sonido?.ladrido?.(q); }, 650); }
    ctx.mundo?.verMonticulo(false); lugarHueso = null; soltarPasto();
    ctx.refrescarBarra?.();
    ctx.guardar?.();
  }

  // ------------------------------------------------------------ cada 2 segundos
  let acum = 0;
  function actualizar(dt) {
    if (ctx.mundo?.huemulEstado.activo) pasoHuemul(dt);
    acum += dt;
    if (acum < 2) return;
    acum = 0;
    if (!activo()) return;
    if (!buscado) buscarCoihue();
    const x = h();
    if (deseoListo(x, dia(), horas())) cumplir();
    ponerVista(ctx.jugador?.()?.estado?.pos);
    revisarHuemul(ctx.jugador?.()?.estado?.pos);
    revisarHueso(ctx.jugador?.()?.estado?.pos);
  }

  return { fugazVista, actualizar, accion, lugarHuemul: () => lugarHuemul, lugarHueso: () => lugarHueso, coihue: () => coihue, ponerVista, cerrarDeseo, estado: h, deseoAbierto: () => enDeseo, elegirDeseo };
}
