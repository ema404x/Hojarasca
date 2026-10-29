// 4.17.0 (C): dónde se PONE al jugador antes de empezar una escena de la Historia. Módulo PURO (sin three ni DOM; se prueba en Node).
//
// Las escenas anclan sus planos al jugador (`FRENTE(…)`, `desde: 'jugador'`): la cámara sale de donde él esté y mira hacia donde mire. Pero casi todas se
// disparan al entrar en un radio de 14 a 30 m de un lugar, así que el jugador puede estar en cualquier parte del radio (de espaldas, detrás de un tronco,
// contra un muro). Cada entrada de `COLOCACION_PULIDO` dice dónde tiene que quedar parado para que la escena se vea: a `dist` metros del foco (un lugar con
// nombre, o una persona), del lado de `desde` (por defecto el refugio) girado `giro` grados, mirando al foco. Si ese punto no está libre (agua, un tronco, un
// muro) se prueba girando a un lado y al otro y acercando, hasta dar con uno libre. Se junta con `COLOCACION_ESCENA` (historia-disparadores.js, las de 4.16.0
// que usan coordenadas del refugio) y lo aplica `colocarParaEscena` de main.js.
//
// Formato de una entrada:
//   punto | npc   el foco: el nombre de un lugar (los de `puntosDeHistoria` de main.js y de T.lugares) o la clave de una persona
//   dist          metros entre el jugador y el foco (por defecto 5)
//   desde         del lado de qué lugar queda el jugador (por defecto 'refugio'); 'frente' (sólo con npc): delante de la persona, hacia donde mira
//   giro          grados que se gira ese lado (por defecto 0)
//   dx, dz        corrimiento del foco, en el mundo
//   mira          { dx, dz } corrimiento de lo que mira el jugador respecto del foco (por defecto, el foco)
//   alto          pitch inicial (por defecto −0,08)
export const COLOCACION_PULIDO = {
  // ---- acto I
  'estacion-llegada': { punto: 'estacion', dist: 8, desde: 'refugio', alto: -0.05 },
  'ramon-tranquera': { punto: 'refugio-puerta', dist: 6.5, desde: 'estacion' },
  'almacen-ercilia': { npc: 'ercilia', dist: 3.2, desde: 'frente' },
  'bolsa-coihue': { punto: 'coihue', dist: 4.9, desde: 'molino-viejo' },   // (la raíz queda 2,3 m del árbol hacia el agua: 2,6 m adelante, mirando el tronco)
  'placa-herminia': { punto: 'plaza', dist: 5.5, desde: 'estacion' },
  'mesa-visita-nicanor': { punto: 'refugio-puerta', dist: 5, desde: 'estacion' },
  'mesa-visita-ramon': { punto: 'refugio-puerta', dist: 5, desde: 'estacion' },
  'fermin-galpon': { npc: 'fermin', dist: 3.6, desde: 'frente' },
  'anden-graciela': { punto: 'estacion', dist: 8, desde: 'refugio', alto: -0.05 },
  // ---- acto II
  'piedras-molino': { punto: 'molino-viejo', dx: 2.6, dz: 1.2, dist: 4.5, desde: 'refugio' },
  'tito-coihue': { punto: 'coihue', dist: 6, desde: 'refugio' },   // (Tito y Josefina se paran a los lados del árbol, 6 m adelante)
  'coihue-en-pie': { punto: 'aserradero-propio', dist: 8.5, desde: 'refugio' },
  'coihue-talado': { punto: 'coihue', dist: 5, desde: 'refugio' },
  'rueda-gira': { punto: 'rueda-molino', dist: 2.6, desde: 'puerta-molino' },   // (la rueda está del lado del agua: se la ve desde el costado de la puerta)
  'molienda-fletes': { punto: 'estacion', dist: 8, desde: 'refugio', alto: -0.05 },
  'huellas-escarcha': { punto: 'molino-viejo', dist: 3, desde: 'raiz-ramon', giro: 180 },   // (el rastro empieza 3 m adelante y sigue hacia la raíz de Ramón)
  'ramon-raiz': { punto: 'raiz-ramon', dist: 15, desde: 'molino-viejo' },   // (escondido a quince pasos, mirando la raíz)
  'te-graciela': { punto: 'casa-te', dist: 7, desde: 'plaza' },
  'galpon-ronda': { punto: 'galpon-propio', dist: 4.5, desde: 'refugio' },
  'primera-molienda': { punto: 'molino-propio', dx: 2.4, dist: 3.2, desde: 'refugio' },   // (las diez bolsas, 2,4 m al este del molino)
  'minga-aldea': { punto: 'plaza', dist: 10, desde: 'estacion' },
  'fogon-leyenda': { punto: 'plaza', dist: 6, desde: 'estacion' },
  'pluma-umbral': { punto: 'refugio-puerta', dx: 0.7, dist: 2.4, desde: 'estacion' },
  'veta-vuelve': { punto: 'cantera', dist: 3.6, desde: 'refugio' },
};

const GRADOS = Math.PI / 180;
const num = (v, d = 0) => (Number.isFinite(Number(v)) && v !== null && v !== '' && typeof v !== 'boolean' ? Number(v) : d);

// Valida una entrada (la prueba la usa): { ok, errores }
export function validarColocacion(c) {
  const e = [];
  if (!c || typeof c !== 'object') return { ok: false, errores: ['no es un objeto'] };
  if (!(typeof c.punto === 'string' && c.punto) && !(typeof c.npc === 'string' && c.npc)) e.push('sin foco (punto o npc)');
  if (c.punto && c.npc) e.push('punto y npc a la vez');
  if (c.dist !== undefined && !(Number.isFinite(c.dist) && c.dist >= 1.5 && c.dist <= 30)) e.push('dist fuera de 1,5 a 30 m');
  if (c.desde !== undefined && typeof c.desde !== 'string') e.push('desde no es un nombre');
  if (c.desde === 'frente' && !c.npc) e.push('«frente» sólo vale con una persona');
  if (c.giro !== undefined && !(Number.isFinite(c.giro) && Math.abs(c.giro) <= 360)) e.push('giro inválido');
  return { ok: !e.length, errores: e };
}

// Dónde queda parado el jugador. `ctx`: { punto(nombre) → {x, z} | null, npc(clave) → {x, z, rumbo?} | null, libre(x, z) → bool }.
// Devuelve { x, z, mira: {x, z}, yaw, pitch, intentos } o null si no se encuentra el foco o no hay ningún lugar libre.
export function resolverColocacion(c, ctx) {
  if (!validarColocacion(c).ok || !ctx) return null;
  const F0 = c.npc ? ctx.npc?.(c.npc) : ctx.punto?.(c.punto);
  if (!F0 || !Number.isFinite(F0.x) || !Number.isFinite(F0.z)) return null;
  const F = { x: F0.x + num(c.dx), z: F0.z + num(c.dz) };
  // de qué lado
  let base = 0;
  if (c.desde === 'frente') base = Number.isFinite(F0.rumbo) ? F0.rumbo : 0;
  else {
    const D = ctx.punto?.(c.desde || 'refugio') || ctx.npc?.(c.desde || 'refugio');
    if (D && Number.isFinite(D.x)) base = Math.atan2(D.x - F.x, D.z - F.z);
  }
  base += num(c.giro) * GRADOS;
  const dist = num(c.dist, 5);
  const libre = (x, z) => { try { return ctx.libre ? !!ctx.libre(x, z) : true; } catch { return false; } };
  let intentos = 0;
  for (const k of [1, 0.85, 0.7, 0.55]) {
    for (const g of [0, 25, -25, 50, -50, 80, -80, 115, -115, 150, -150, 180]) {
      intentos++;
      const a = base + g * GRADOS, x = F.x + Math.sin(a) * dist * k, z = F.z + Math.cos(a) * dist * k;
      if (!libre(x, z)) continue;
      const M = { x: F.x + num(c.mira?.dx), z: F.z + num(c.mira?.dz) };
      const yaw = Math.atan2(-(M.x - x), -(M.z - z));
      return { x, z, mira: M, yaw, pitch: Number.isFinite(c.alto) ? c.alto : -0.08, intentos };
    }
  }
  return null;
}
