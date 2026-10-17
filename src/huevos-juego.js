// 4.2 (huevos de pascua): el enganche de los easter eggs con el juego (sólo en el Relax). Las reglas, en huevos.js; lo que se ve,
// en huevos-mundo.js. Todo por evento, nada por cuadro: `actualizar(dt)` sólo junta tiempo y mira cada 2 segundos.
// `ctx`: { progreso(), desafio(), jugador() → { estado }, sonido, nota(t, sub, nueva), diario(tipo, dato), guardar(),
//   sumarMaterial(k, n), refrescarBarra(), registrar(id) }
import { azarDe, sanearHuevos, diaDeNoche, trajoDeseo, ofrecerEstrella, pedirDeseo, deseoListo, cumplirDeseo, DESEOS, ESTRELLA } from './huevos.js';
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

  // ------------------------------------------------------------ cada 2 segundos
  let acum = 0;
  function actualizar(dt) {
    acum += dt;
    if (acum < 2) return;
    acum = 0;
    if (!activo()) return;
    const x = h();
    if (deseoListo(x, dia(), horas())) cumplir();
  }

  return { fugazVista, actualizar, cerrarDeseo, estado: h, deseoAbierto: () => enDeseo, elegirDeseo };
}
