// 4.13.0 (A): la presencia de los duendes en la Historia, capítulos 5 y 6 (el lago y el molino). Se dejan ver de lejos, sin pelea:
//   · siluetas al anochecer, entre los árboles, que te miran y se esconden si te acercás (con trato dejan acercarse más y saludan);
//   · una risa lejana de noche;
//   · luciérnagas raras (puntos de luz azulados y violetas, no los amarillos de siempre);
//   · con trato, un regalito en la puerta del refugio por la mañana (hasta REGALOS_TOPE);
//   · el encuentro del galpón (capítulo 5): dos duendes en el Galpón de Esquila con una luz verdosa, que esperan hasta que te acercás (ahí la
//     Historia pide la tarjeta del evento `duendes-galpon`) y después se van según lo que elegiste.
// Los duendes NO hablan. Las reglas puras (ventanas de hora, puntos) se exportan para probarlas en Node; el resto usa la infraestructura de
// historia-duendes.js (`dh`) y no compila nada: todo se precalienta en la carga (ver main.js).
import * as THREE from 'three';
import { registrarHalos, soltarHalos, mallaAtadito } from './desafio-duendes.js';
import { duendesDe, hayPresencia, REGALOS_TOPE } from './historia.js';

// ---------------------------------------------------------------- reglas puras
export const VENTANAS = {
  silueta: [17.5, 21.5],   // el anochecer
  risa: [21, 4],           // la noche cerrada (cruza la medianoche)
  luz: [20, 4.5],          // las luciérnagas raras
  galpon: [18, 3],         // el encuentro del galpón
  regalo: [6, 10],         // los regalitos aparecen a la mañana
};
export function enVentana(horas, [desde, hasta]) {
  const h = ((Number(horas) % 24) + 24) % 24;
  return desde <= hasta ? h >= desde && h < hasta : h >= desde || h < hasta;
}
export const TIEMPOS = {
  primeraSilueta: [25, 50], entreSiluetas: [70, 130], vidaSilueta: 40,
  entreRisas: [45, 100], vidaLuz: 45, luces: 2,
  distSilueta: [38, 52], huyeSinTrato: 30, huyeConTrato: 13, vistaDist: 62, vistaSegundos: 2.5,
  galponAparece: 75, galponTarjeta: 14, galponSuelta: 110,
};
const entre = (r, [a, b]) => a + r() * (b - a);
// Un punto en el abanico delante de la cámara (`rumbo` = adónde mira, en la convención atan2(dx, dz)), a una distancia dada
export function puntoEnAbanico(yo, rumbo, r, [dmin, dmax], abanico = 0.9) {
  const a = rumbo + (r() * 2 - 1) * abanico, d = dmin + r() * (dmax - dmin);
  return { x: yo.x + Math.sin(a) * d, z: yo.z + Math.cos(a) * d };
}
// ¿La dirección a (px, pz) cae dentro del cono de la vista? (rumbo de la cámara, medio ángulo)
export function enLaVista(yo, rumbo, p, medio = 0.95) {
  let d = Math.atan2(p.x - yo.x, p.z - yo.z) - rumbo;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d) <= medio;
}
// Un punto del mundo a partir del galpón (misma cuenta que `aMundo` de estructuras.js)
export const delGalpon = (g, lx, lz) => ({ x: g.x + lx * Math.cos(g.rot) + lz * Math.sin(g.rot), z: g.z - lx * Math.sin(g.rot) + lz * Math.cos(g.rot) });
export const PUERTA_GALPON = { lx: 0, lz: -6.6 };   // delante del portón corredizo (a -D/2 - 0,26 del centro, con D = 8,5)

// ---------------------------------------------------------------- el controlador
// ctx: { dh, escena, historia: () => h, jugador: () => ({x, z}), rumbo: () => radianes (hacia dónde mira la cámara), altura, hora: () => horas,
//        libre: () => ¿jugando, sin tarjeta ni vehículo?, enTierra: (x, z) => bool, cercaDeArbol: (x, z) => bool,
//        refugio: () => ({x, z}), galpon: () => ({x, z, rot}) | null, cobrar: (premio) => void, nota, guardar, azar }
export function crearPresencia(ctx) {
  const azar = ctx.azar || Math.random;
  const dh = ctx.dh;
  let sil = null, silEdad = 0, silVista = 0, silVisto = false, espera = entre(azar, TIEMPOS.primeraSilueta);
  let risa = entre(azar, TIEMPOS.entreRisas);
  const luces = [];
  let regalo = null, regaloDia = -1;
  const galpon = { quiere: false, duendes: [], luz: null, hecho: false };

  const yo = () => ctx.jugador() || { x: 0, z: 0 };
  const dist = (p) => Math.hypot(p.x - yo().x, p.z - yo().z);
  const h = () => ctx.historia();

  // ---- las siluetas
  function aparecerSilueta() {
    const j = yo(), rumbo = ctx.rumbo?.() ?? 0;
    for (let i = 0; i < 14; i++) {
      const p = puntoEnAbanico(j, rumbo, azar, TIEMPOS.distSilueta);
      if (!ctx.enTierra(p.x, p.z) || !ctx.cercaDeArbol(p.x, p.z)) continue;
      const d = dh.aparecer('rastreador', { x: p.x, z: p.z, mira: true });
      if (!d) return false;
      sil = d; silEdad = 0; silVista = 0; silVisto = false;
      return true;
    }
    return false;
  }
  function actualizarSilueta(dt) {
    const d = duendesDe(h());
    if (!sil) {
      espera -= dt;
      if (espera > 0 || !enVentana(ctx.hora(), VENTANAS.silueta) || !dh.listo()) return;
      espera = aparecerSilueta() ? entre(azar, TIEMPOS.entreSiluetas) : 8;
      return;
    }
    if (sil.estado === 'fuera') { sil = null; return; }
    silEdad += dt;
    const p = sil.posicion, dd = dist(p);
    const umbral = d.trato === 'trato' ? TIEMPOS.huyeConTrato : TIEMPOS.huyeSinTrato;
    if (sil.estado === 'mirando' || sil.estado === 'quieto' || sil.estado === 'saludando') {
      if (dd < umbral || silEdad > TIEMPOS.vidaSilueta) { sil.huir(null, { desaparecer: true }); if (dd < umbral && azar() < 0.5) sil.reir(0.5); }
      else if (d.trato === 'trato' && dd < 30 && sil.estado === 'mirando' && azar() < dt * 0.15) sil.saludar(2.2);
    }
    // visto de verdad: a la vista y a tiro de ojo unos segundos
    if (!silVisto && dd < TIEMPOS.vistaDist && enLaVista(yo(), ctx.rumbo?.() ?? 0, p)) {
      silVista += dt;
      if (silVista >= TIEMPOS.vistaSegundos) { silVisto = true; d.vistos = Math.min(999, d.vistos + 1); ctx.guardar?.(); }
    }
  }

  // ---- la risa lejana
  function actualizarRisa(dt) {
    risa -= dt;
    if (risa > 0) return;
    risa = entre(azar, TIEMPOS.entreRisas);
    if (!enVentana(ctx.hora(), VENTANAS.risa) || !dh.listo()) return;
    const a = azar() * Math.PI * 2, r = 55 + azar() * 30, j = yo();
    const x = j.x + Math.sin(a) * r, z = j.z + Math.cos(a) * r;
    dh.reir({ x, y: ctx.altura(x, z) + 0.6, z }, { clase: 'chico', intensidad: 0.4, vol: 0.9 });
  }

  // ---- las luciérnagas raras: puntos de luz de otro color que andan entre los árboles
  function nuevaLuz() {
    const j = yo(), a = azar() * Math.PI * 2, r = 22 + azar() * 24;
    const o = new THREE.Object3D();
    const col = azar() < 0.5 ? '#8fd8ff' : '#c3a4ff';
    o.userData.halos = [0, 1, 2].map(() => ({ p: new THREE.Vector3(), col, tam: 0.9 }));
    o.userData.brilloHalos = 0;
    o.position.set(j.x + Math.sin(a) * r, 0, j.z + Math.cos(a) * r);
    o.position.y = ctx.altura(o.position.x, o.position.z) + 1.4;
    const l = { o, t: 0, fase: azar() * 6.28, vx: (azar() - 0.5) * 0.5, vz: (azar() - 0.5) * 0.5 };
    ctx.escena.add(o);
    registrarHalos(o);
    luces.push(l);
  }
  function quitarLuz(l) {
    soltarHalos(l.o);
    ctx.escena.remove(l.o);
    const i = luces.indexOf(l);
    if (i >= 0) luces.splice(i, 1);
  }
  function actualizarLuces(dt, hay) {
    if (hay && luces.length < TIEMPOS.luces && azar() < dt * 0.1) nuevaLuz();
    for (const l of luces.slice()) {
      l.t += dt; l.fase += dt;
      const k = Math.min(1, l.t / 4, (TIEMPOS.vidaLuz - l.t) / 4);
      l.o.userData.brilloHalos = Math.max(0, k) * 0.9;
      l.o.position.x += (l.vx + Math.sin(l.fase * 0.7) * 0.4) * dt;
      l.o.position.z += (l.vz + Math.cos(l.fase * 0.6) * 0.4) * dt;
      l.o.position.y = ctx.altura(l.o.position.x, l.o.position.z) + 1.2 + Math.sin(l.fase * 0.9) * 0.35;
      l.o.userData.halos.forEach((hh, i) => hh.p.set(Math.sin(l.fase * 1.3 + i * 2.1) * 0.5, Math.sin(l.fase * 1.7 + i) * 0.25, Math.cos(l.fase * 1.1 + i * 2.1) * 0.5));
      if (l.t > TIEMPOS.vidaLuz || !hay) quitarLuz(l);
    }
  }

  // ---- el regalito en la puerta (sólo con trato)
  function quitarRegalo() {
    if (!regalo) return;
    soltarHalos(regalo);
    ctx.escena.remove(regalo);
    regalo = null;
  }
  function actualizarRegalo(dia) {
    const d = duendesDe(h());
    if (d.trato !== 'trato' || d.regalos >= REGALOS_TOPE) { quitarRegalo(); return; }
    const horas = ctx.hora();
    if (!regalo && regaloDia !== dia && enVentana(horas, VENTANAS.regalo) && dh.listo()) {
      regaloDia = dia;
      const r = ctx.refugio(), a = azar() * Math.PI * 2;
      const x = r.x + Math.sin(a) * 4.2, z = r.z + Math.cos(a) * 4.2;
      if (!ctx.enTierra(x, z)) return;
      regalo = mallaAtadito();
      regalo.position.set(x, ctx.altura(x, z), z);
      ctx.escena.add(regalo);
      registrarHalos(regalo);
    }
    if (!regalo) return;
    if (!enVentana(horas, [6, 20])) { quitarRegalo(); return; }
    if (dist(regalo.position) < 1.8) {
      quitarRegalo();
      d.regalos += 1;
      ctx.cobrar({ ramitas: 4, texto: 'Un atadito de ramitas secas, bien prolijo' });
      ctx.nota('Alguien dejó esto en tu puerta', 'Un atadito de ramitas, atado con hilo de lana. No hay nadie a la vista', true);
      ctx.guardar?.();
    }
  }

  // ---- el encuentro del galpón
  function apagarGalpon() {
    for (const d of galpon.duendes) d.esconder();
    galpon.duendes = [];
    if (galpon.luz) { soltarHalos(galpon.luz); ctx.escena.remove(galpon.luz); galpon.luz = null; }
  }
  function armarGalpon(g) {
    if (!dh.listo()) return;
    const mirar = yo();
    for (const [lx, tipo] of [[-1.3, 'rastreador'], [1.2, 'rastreador']]) {
      const p = delGalpon(g, PUERTA_GALPON.lx + lx, PUERTA_GALPON.lz - 0.6);
      const d = dh.aparecer(tipo, { x: p.x, z: p.z, mira: true, viejo: lx > 0 });
      if (d) galpon.duendes.push(d);
    }
    const p = delGalpon(g, 0, PUERTA_GALPON.lz + 1.8);
    const o = new THREE.Object3D();
    o.userData.halos = [0, 1, 2, 3].map((i) => ({ p: new THREE.Vector3((i - 1.5) * 0.45, 0.4 + (i % 2) * 0.5, 0), col: '#9aff8a', tam: 1.3 }));
    o.userData.brilloHalos = 0.8;
    o.position.set(p.x, ctx.altura(p.x, p.z), p.z);
    ctx.escena.add(o);
    registrarHalos(o);
    galpon.luz = o;
    void mirar;
  }
  function actualizarGalpon(dt, tiempoLibre) {
    const g = ctx.galpon?.();
    const noche = enVentana(ctx.hora(), VENTANAS.galpon);
    const quiere = !!g && galpon.quiere && noche && tiempoLibre;
    if (!quiere) {
      if (galpon.duendes.length || galpon.luz) {
        if (!g || dist(g) > TIEMPOS.galponSuelta || !galpon.quiere || !noche) apagarGalpon();
      }
      return;
    }
    if (!galpon.duendes.length && dist(g) < TIEMPOS.galponAparece) armarGalpon(g);
    if (galpon.luz) galpon.luz.userData.brilloHalos = 0.7 + Math.sin(performance.now() / 700) * 0.15;
    void dt;
  }

  // lo que pasa después de elegir (se llama desde el efecto `duendes`)
  function epilogo(trato) {
    const ds = galpon.duendes.slice();
    galpon.duendes = [];
    galpon.quiere = false;
    const g = ctx.galpon?.();
    ds.forEach((d, i) => {
      if (trato === 'trato') {
        d.saludar(2.4);
        const lejos = g ? delGalpon(g, (i ? 1 : -1) * 6, -26) : null;
        setTimeout(() => { try { if (lejos) d.irA(lejos.x, lejos.z, { alLlegar: (x) => x.esconder() }); else d.esconder(); } catch { /* ya se fue */ } }, 2600 + i * 700);
      } else {
        d.huir(null, { desaparecer: true });
        d.reir(0.9);
      }
    });
    if (galpon.luz) { const l = galpon.luz; galpon.luz = null; setTimeout(() => { soltarHalos(l); ctx.escena.remove(l); }, trato === 'trato' ? 6000 : 700); }
  }

  function actualizar(dt) {
    dt = Math.min(0.2, Math.max(0, dt));
    const hist = h();
    const hay = !!hist.activa && hayPresencia(hist);
    const libre = !!ctx.libre();
    if (!hay) {
      if (sil) { sil.quitar(); sil = null; }
      actualizarLuces(dt, false);
      actualizarGalpon(dt, false);
      quitarRegalo();
      return;
    }
    if (!libre) return;
    const noche = enVentana(ctx.hora(), VENTANAS.luz);
    actualizarSilueta(dt);
    actualizarRisa(dt);
    actualizarLuces(dt, noche && dh.listo());
    actualizarRegalo(ctx.dia?.() ?? 0);
    actualizarGalpon(dt, true);
  }
  function limpiar() {
    if (sil) { sil.quitar(); sil = null; }
    for (const l of luces.slice()) quitarLuz(l);
    quitarRegalo();
    apagarGalpon();
  }
  return {
    actualizar, epilogo, limpiar,
    pedirGalpon: (si) => { galpon.quiere = !!si; },
    // ¿estás a menos de `radio` metros del galpón? (la puerta del momento del capítulo 5)
    cercaDelGalpon: (radio = TIEMPOS.galponTarjeta) => { const g = ctx.galpon?.(); return !!g && dist(delGalpon(g, PUERTA_GALPON.lx, PUERTA_GALPON.lz)) < radio; },
    hayGalpon: () => galpon.duendes.length > 0,
    silueta: () => sil, luces: () => luces.length, regalo: () => regalo,
  };
}
