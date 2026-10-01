// 2.3: la zanja de fuego. Una zanja delante de la empalizada: se llena de leña (E, dos
// troncos) y se prende (E otra vez) cuando llegan. Arde un minuto: los que la cruzan se
// queman y los livianos se asustan y se abren. Después hay que volver a cargarla, así
// que el momento importa. Con viento, el fuego puede escaparse al pasto y quemar lo que
// encuentre —invasores, tus obras de madera o a vos—; con lluvia, no prende. Es la idea
// del fuego que se escapa, que había quedado afuera en la 1.10. Puro, sin THREE.
export const ZANJA = {
  lena: 2,            // troncos por carga
  dura: 60,           // segundos de fuego
  dano: 22,           // por segundo, a los que están adentro
  radio: 1.15,        // metros a cada lado de la línea
  largo: 3.2,
  lluviaMax: 0.45,    // con más lluvia que esto, no prende
};
export const ESCAPE = {
  vientoMin: 0.55,    // desde este viento puede escaparse
  cada: 5,            // segundos entre intentos
  chance: 0.3,
  salto: [2.5, 4.5],  // metros que salta, a favor del viento
  dura: 18,           // lo que arde un foco en el pasto
  radioMax: 1.8,
  dano: 10,           // por segundo
  danoObra: 8,        // por segundo, a la madera
  max: 8,             // focos a la vez, como mucho
};

export function zanjaVacia() { return { lena: 0, ardiendo: 0 }; }
export function sanearZanja(z) {
  const x = z && typeof z === 'object' ? z : {};
  return { lena: Math.max(0, Math.min(ZANJA.lena, Math.floor(Number(x.lena) || 0))), ardiendo: 0 };
}

// E en la zanja: carga si está vacía, prende si está cargada.
export function usarZanja(z, { troncos = 0, lluvia = 0 } = {}) {
  if (!z) return { accion: 'nada' };
  if (z.ardiendo > 0) return { accion: 'ardiendo', queda: Math.ceil(z.ardiendo) };
  if (z.lena < ZANJA.lena) {
    const n = Math.min(ZANJA.lena - z.lena, Math.floor(troncos));
    if (n <= 0) return { accion: 'sinLena' };
    z.lena += n;
    return { accion: 'cargar', troncos: n, lista: z.lena >= ZANJA.lena };
  }
  if (lluvia > ZANJA.lluviaMax) return { accion: 'mojada' };
  z.lena = 0; z.ardiendo = ZANJA.dura;
  return { accion: 'prender' };
}
export function avisoZanja(z, { troncos = 0, lluvia = 0 } = {}) {
  if (!z) return null;
  if (z.ardiendo > 0) return `La zanja arde (${Math.ceil(z.ardiendo)} s)`;
  if (z.lena < ZANJA.lena) return troncos > 0 ? `Cargar la zanja con leña (${ZANJA.lena - z.lena})` : 'Zanja vacía: hacen falta dos troncos';
  return lluvia > ZANJA.lluviaMax ? 'Zanja cargada: con esta lluvia no prende' : 'Prender la zanja';
}
export function consumir(z, dt, lluvia = 0) {
  if (!z || !(z.ardiendo > 0)) return false;
  z.ardiendo = Math.max(0, z.ardiendo - dt * (lluvia > ZANJA.lluviaMax ? 3 : 1));
  return z.ardiendo === 0;
}

// Distancia de un punto a la línea de la zanja (centro x, z, girada `rot`, de `largo`).
export function distanciaALaZanja(p, zx, zz, rot = 0, largo = ZANJA.largo) {
  const ux = Math.cos(rot), uz = -Math.sin(rot);          // el eje largo de la pieza
  const dx = p.x - zx, dz = p.z - zz;
  const t = Math.max(-largo / 2, Math.min(largo / 2, dx * ux + dz * uz));
  return Math.hypot(dx - ux * t, dz - uz * t);
}
export const enElFuego = (p, zanja) => distanciaALaZanja(p, zanja.x, zanja.z, zanja.rot, zanja.largo) < ZANJA.radio;

// ¿Se escapa el fuego en este intento? `viento` 0..1 (el del clima), `lluvia` 0..1.
export function seEscapa(viento, lluvia, azar = Math.random) {
  if (viento < ESCAPE.vientoMin || lluvia > 0.2) return false;
  return azar() < ESCAPE.chance * (0.6 + (viento - ESCAPE.vientoMin) * 2);
}
// Adónde salta: a favor del viento (el viento del valle sopla hacia +x), con un poco de
// desvío. `desde`: un punto de la zanja o de otro foco.
export function saltoDelFuego(desde, azar = Math.random) {
  const d = ESCAPE.salto[0] + azar() * (ESCAPE.salto[1] - ESCAPE.salto[0]);
  const ang = (azar() - 0.5) * 1.2;
  return { x: desde.x + Math.cos(ang) * d, z: desde.z + Math.sin(ang) * d };
}
// Un foco en el pasto: crece, arde y se apaga. Devuelve el radio actual (0 si terminó).
export function radioFoco(edad) {
  if (edad < 0 || edad >= ESCAPE.dura) return 0;
  const crece = Math.min(1, edad / 4), apaga = Math.min(1, (ESCAPE.dura - edad) / 4);
  return ESCAPE.radioMax * Math.min(crece, apaga);
}
