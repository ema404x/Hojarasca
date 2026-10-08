// 2.3: la infestación. Desde la noche 4, al amanecer quedan capullos en el bosque: los
// sembró la nave al irse. De día se pueden quemar (E, con una ramita) o romper a golpes
// (tres, y el que está adentro sale en ese momento, flojo). Los que queden se abren
// cuando empieza la noche y suman invasores a la oleada, desde donde estaban. Le da
// sentido a salir de día a algo más que a juntar. Puro, sin THREE.
export const CAPULLOS = {
  desdeNoche: 4,
  base: 2,            // capullos la primera vez
  cadaNoches: 4,      // uno más cada tantas noches
  max: 6,
  distancia: [45, 170],   // del centro de la base
  separacion: 16,     // entre capullos
  golpes: 3,          // para romperlo sin fuego
  quemar: 2.5,        // segundos que tarda en consumirse una vez prendido
  radioUsar: 2.4,     // a qué distancia se puede usar
};

export function cuantosCapullos(noche) {
  if (noche < CAPULLOS.desdeNoche) return 0;
  return Math.min(CAPULLOS.max, CAPULLOS.base + Math.floor((noche - CAPULLOS.desdeNoche) / CAPULLOS.cadaNoches));
}

// Dónde crecen: en el bosque alrededor de la base, lejos entre sí. `esBueno(x, z)` dice
// si el lugar sirve (tierra firme, no en el agua, no encima de una obra).
export function lugaresCapullos(n, base, { esBueno = () => true, azar = Math.random } = {}) {
  const lista = [];
  for (let i = 0; i < n * 40 && lista.length < n; i++) {
    const ang = azar() * Math.PI * 2;
    const d = CAPULLOS.distancia[0] + azar() * (CAPULLOS.distancia[1] - CAPULLOS.distancia[0]);
    const x = base.x + Math.cos(ang) * d, z = base.z + Math.sin(ang) * d;
    if (!esBueno(x, z)) continue;
    if (lista.some((c) => Math.hypot(c.x - x, c.z - z) < CAPULLOS.separacion)) continue;
    lista.push({ x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, golpes: 0 });
  }
  return lista;
}

// Qué sale de un capullo al abrirse: un rastreador; desde la noche 10, a veces un
// saltador; desde la 12, de a dos.
export function queSale(noche, azar = Math.random) {
  const uno = () => (noche >= 10 && azar() < 0.4 ? 'saltador' : 'rastreador');
  return noche >= 12 ? [uno(), uno()] : [uno()];
}

export function sanearCapullos(v) {
  if (!Array.isArray(v)) return [];
  return v.filter((c) => c && Number.isFinite(Number(c.x)) && Number.isFinite(Number(c.z)))
    .slice(0, CAPULLOS.max)
    .map((c) => ({ x: Number(c.x), z: Number(c.z), golpes: Math.max(0, Math.min(CAPULLOS.golpes - 1, Math.floor(Number(c.golpes) || 0))) }));
}

// E junto a un capullo: si tenés una ramita y no llueve fuerte, se quema. Si no, se
// avisa que hay que pegarle.
export function usarCapullo({ ramitas = 0, lluvia = 0 } = {}) {
  if (lluvia > 0.55) return { accion: 'mojado' };
  if (ramitas < 1) return { accion: 'sinRamitas' };
  return { accion: 'quemar' };
}
// Un golpe con un arma: al tercero se rompe y el que estaba adentro sale.
export function golpearCapullo(c) {
  c.golpes = (c.golpes || 0) + 1;
  return c.golpes >= CAPULLOS.golpes;
}

export function avisoCapullo({ ramitas = 0, lluvia = 0 } = {}) {
  if (lluvia > 0.55) return 'Nido de hongos: mojado no prende, rompelo a golpes';
  return ramitas > 0 ? 'Quemar el nido de hongos (1 ramita)' : 'Nido de hongos: juntá una ramita para quemarlo, o rompelo a golpes';
}
