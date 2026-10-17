// 4.0 (aplastado): el pasto, las flores y los helechos se aplastan donde pasan el jugador,
// el perro, el caballo y los pudúes cercanos, y el pasto tarda unos segundos en volver a pararse.
// Todo va en 24 «pisadas» (vec4: x, z, radio, fuerza) que leen los shaders de pasto.js: las 4 primeras
// son animales (siguen a cada uno) y las otras 20 son las huellas del jugador (un anillo: cada 1,2 m
// se anota una y se va apagando). Sólo en calidad alta (en las demás, fuerza 0 y el shader ni las lee).
import { U } from './materiales.js';

export const N_PISADAS = 24;
const N_ANIMALES = 4;
const N_HUELLAS = N_PISADAS - N_ANIMALES;
const PASO_HUELLA = 1.3;     // metros entre huella y huella
const VIDA_HUELLA = 7;       // segundos hasta que el pasto se para de nuevo (menos si corrés: ver `vidas`)
export const calidadConPisadas = (calidad) => calidad.pasto > 60000;

// el valor del uniforme: lo comparten los materiales del pasto (U.uPisadas)
// (el runtime de three no trae Vector4: va un arreglo plano de N·4 números, x z radio fuerza)
U.uPisadas = { value: (() => { const a = new Float32Array(N_PISADAS * 4); for (let i = 0; i < N_PISADAS; i++) a[i * 4 + 2] = 0.001; return a; })() };

export function crearPisadas({ calidad, perro, caballo, fauna }) {
  const activo = calidadConPisadas(calidad);
  const v = U.uPisadas.value;
  const poner4 = (i, x, z, r, f) => { v[i * 4] = x; v[i * 4 + 1] = z; v[i * 4 + 2] = r; v[i * 4 + 3] = f; };
  const edades = new Float32Array(N_HUELLAS).fill(1e3), vidas = new Float32Array(N_HUELLAS).fill(VIDA_HUELLA);
  let sinceUltima = 0, intervalo = 1;   // tiempo desde la última huella y su promedio suave
  let ultima = -1, ux = 1e9, uz = 1e9, reloj = 0;
  const cerca = [];
  return {
    actualizar(dt, pos, enCaballo = false) {
      if (!activo) return;
      reloj += dt; sinceUltima += dt;
      // las huellas del jugador (sólo si se movió lo suficiente desde la última)
      if (Math.hypot(pos.x - ux, pos.z - uz) > PASO_HUELLA) {
        ultima = (ultima + 1) % N_HUELLAS; ux = pos.x; uz = pos.z; edades[ultima] = 0;
        // si caminás rápido el anillo se recicla antes de los 7 s: cada huella se levanta del todo antes de que le toque ser pisada de nuevo (sin saltos)
        intervalo += (Math.min(sinceUltima, 2) - intervalo) * 0.4; sinceUltima = 0;
        vidas[ultima] = Math.min(VIDA_HUELLA, Math.max(1.5, N_HUELLAS * intervalo * 0.9));
        poner4(N_ANIMALES + ultima, pos.x, pos.z, enCaballo ? 1.5 : 0.8, 1);
      }
      for (let i = 0; i < N_HUELLAS; i++) {
        edades[i] += dt;
        const e = edades[i], wi = (N_ANIMALES + i) * 4 + 3, vida = vidas[i];
        // fuerza: plena un rato y después se levanta de a poco (suavizado: sin quiebre al empezar ni al terminar)
        const u = e >= vida ? 1 : e < 0.8 ? 0 : (e - 0.8) / (vida - 0.8);
        v[wi] = 1 - u * u * (3 - 2 * u);
      }
      // los animales: el perro, el caballo (si no vas montado) y los dos pudúes más cercanos
      let n = 0;
      const poner = (x, z, radio) => { if (n < N_ANIMALES) poner4(n++, x, z, radio, 0.9); };
      if (perro?.est?.pos) poner(perro.est.pos.x, perro.est.pos.z, 0.7);
      if (caballo?.est?.visible && !caballo.est.montado) poner(caballo.est.x, caballo.est.z, 1.3);
      cerca.length = 0;
      for (const p of (fauna?.pudues || [])) {
        if (!p.g?.visible) continue;
        const d = Math.hypot(p.pos.x - pos.x, p.pos.z - pos.z);
        if (d < 40) cerca.push({ d, p });
      }
      cerca.sort((a, b) => a.d - b.d);
      for (let i = 0; i < cerca.length && n < N_ANIMALES; i++) poner(cerca[i].p.pos.x, cerca[i].p.pos.z, 0.6);
      while (n < N_ANIMALES) poner4(n++, 0, 0, 0.001, 0);
    },
  };
}
