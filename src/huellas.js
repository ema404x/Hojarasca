// Las huellas en la nieve: se marcan donde pisás y se van tapando con el
// tiempo. Viven en una textura chica que sigue al jugador.
import * as THREE from 'three';
import { U } from './materiales.js';

const RES = 256;        // texeles por lado
const LADO = 64;        // metros que cubre la textura

export function crearHuellas() {
  const datos = new Uint8Array(RES * RES * 4);
  const tex = new THREE.DataTexture(datos, RES, RES, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  U.uHuellas.value = tex;
  U.uHuellasLado.value = LADO;

  const centro = new THREE.Vector2(0, 0);
  U.uHuellasCentro.value.set(0, 0);
  let ultima = new THREE.Vector2(1e9, 1e9);
  let pieIzquierdo = false;
  let acumuladoBorrado = 0;
  let sucia = false;
  const ultimasFauna = new Map();

  function limpiar() {
    datos.fill(0);
    sucia = true;
  }

  // marca una pisada ovalada, de unos veinte centímetros
  function marcar(x, z, fuerza) { marcarEscala(x, z, fuerza, 1); }

  function marcarEscala(x, z, fuerza, escala = 1) {
    const u = Math.floor(((x - centro.x) / LADO + 0.5) * RES);
    const v = Math.floor(((z - centro.y) / LADO + 0.5) * RES);
    const r = Math.max(1, Math.round(2 * escala));
    for (let dv = -r; dv <= r; dv++) {
      for (let du = -r; du <= r; du++) {
        const uu = u + du, vv = v + dv;
        if (uu < 0 || vv < 0 || uu >= RES || vv >= RES) continue;
        const caida = 1 - Math.hypot(du / r, dv / (r * 0.75));
        if (caida <= 0) continue;
        const i = (vv * RES + uu) * 4;
        const val = Math.min(255, datos[i] + caida * 235 * fuerza);
        datos[i] = val; datos[i + 1] = val; datos[i + 2] = val; datos[i + 3] = 255;
      }
    }
    sucia = true;
  }


  // RC17: rastros de fauna cercana en nieve. Sólo se marcan animales que ya
  // están siendo simulados/visibles; no agrega búsquedas globales ni IA extra.
  function actualizarFauna(sujetos, invierno) {
    if (invierno < 0.25 || !Array.isArray(sujetos)) return;
    const vivos = new Set();
    for (const s of sujetos) {
      if (!s?.id || !s?.pos || ((s.tipo !== 'huemul' && s.tipo !== 'zorro') && s.tipo !== 'guanaco' && s.tipo !== 'liebre')) continue;
      vivos.add(s.id);
      const dCentro = Math.hypot(s.pos.x - centro.x, s.pos.z - centro.y);
      if (dCentro > LADO * 0.48) continue;
      const prev = ultimasFauna.get(s.id);
      if (!prev) { ultimasFauna.set(s.id, { x: s.pos.x, z: s.pos.z }); continue; }
      const d = Math.hypot(s.pos.x - prev.x, s.pos.z - prev.z);
      const perfil = {
        huemul: { paso: 0.72, escala: 1.05, fuerza: 0.56 },
        zorro: { paso: 0.48, escala: 0.70, fuerza: 0.38 },
        guanaco: { paso: 0.82, escala: 1.12, fuerza: 0.60 },
        liebre: { paso: 0.58, escala: 0.46, fuerza: 0.27 },
      }[s.tipo];
      if (d >= perfil.paso) {
        marcarEscala(s.pos.x, s.pos.z, perfil.fuerza, perfil.escala);
        prev.x = s.pos.x; prev.z = s.pos.z;
      }
    }
    for (const id of [...ultimasFauna.keys()]) if (!vivos.has(id)) ultimasFauna.delete(id);
    if (sucia) { tex.needsUpdate = true; sucia = false; }
  }

  function actualizar(dt, js, invierno, nevando) {
    if (invierno < 0.25) {
      if (datos[0] !== 0 || sucia) { limpiar(); tex.needsUpdate = true; sucia = false; }
      return;
    }
    // si te alejaste del centro, la textura se recentra y se pierde lo viejo
    if (Math.abs(js.pos.x - centro.x) > LADO * 0.35 || Math.abs(js.pos.z - centro.y) > LADO * 0.35) {
      centro.set(js.pos.x, js.pos.z);
      U.uHuellasCentro.value.copy(centro);
      limpiar();
      ultima.set(1e9, 1e9);
    }
    // una pisada cada medio paso, alternando el pie
    if (js.enSuelo && !js.nadando) {
      const d = Math.hypot(js.pos.x - ultima.x, js.pos.z - ultima.y);
      if (d > 0.42) {
        pieIzquierdo = !pieIzquierdo;
        const lado = pieIzquierdo ? 0.16 : -0.16;
        const c = Math.cos(js.yaw), s2 = Math.sin(js.yaw);
        marcar(js.pos.x + c * lado, js.pos.z - s2 * lado, js.agachado ? 0.7 : 1);
        ultima.set(js.pos.x, js.pos.z);
      }
    }
    // la nieve va tapando lo pisado; más rápido si está nevando
    acumuladoBorrado += dt;
    const cada = nevando > 0.3 ? 0.5 : 2.2;
    if (acumuladoBorrado > cada) {
      acumuladoBorrado = 0;
      for (let i = 0; i < datos.length; i += 4) {
        if (datos[i] > 0) {
          const v = Math.max(0, datos[i] - 4);
          datos[i] = v; datos[i + 1] = v; datos[i + 2] = v;
        }
      }
      sucia = true;
    }
    if (sucia) { tex.needsUpdate = true; sucia = false; }
  }

  return { actualizar, actualizarFauna, limpiar, tex };
}
