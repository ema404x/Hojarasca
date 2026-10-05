// 2.3: el vivero. En otoño los árboles grandes sueltan semilla: junto a un coihue, una
// lenga, un ñire o un ciprés, E la junta (una por árbol y por día). En el vivero las
// semillas germinan en unos días y salen plantines, que se plantan con B como los
// renovales pero ya crecidos a la mitad. Los piñones del pehuén también sirven.
// Puro, sin THREE.
export const VIVERO = {
  macetas: 6,         // almácigos del cajón
  diasPlantin: 3,     // de semilla a plantín
  ventaja: 7,         // días de renoval que ya trae un plantín (de 14)
  porDia: 6,          // semillas que se juntan por día, en total
};
// especie del árbol → la semilla que da y el plantín que sale
export const ARBOLES_VIVERO = {
  coihue: { semilla: 'semilla-coihue', plantin: 'plantin-coihue', nombre: 'coihue' },
  lenga: { semilla: 'semilla-lenga', plantin: 'plantin-lenga', nombre: 'lenga' },
  nire: { semilla: 'semilla-nire', plantin: 'plantin-nire', nombre: 'ñire' },
  cipres: { semilla: 'semilla-cipres', plantin: 'plantin-cipres', nombre: 'ciprés' },
  pehuen: { semilla: 'pinon', plantin: 'plantin-pehuen', nombre: 'pehuén' },
};
export const ESPECIES_VIVERO = Object.keys(ARBOLES_VIVERO);

export function viveroVacio() { return { macetas: [] }; }
// 3.7.0: `extra`: las macetas de barro que te hizo Malena, la ceramista de la aldea (hasta 4 más)
export const macetasDe = (extra = 0) => VIVERO.macetas + Math.max(0, Math.min(4, Math.floor(Number(extra) || 0)));
export function sanearVivero(v, extra = 0) {
  const x = v && typeof v === 'object' ? v : {};
  const macetas = (Array.isArray(x.macetas) ? x.macetas : [])
    .filter((m) => m && ARBOLES_VIVERO[m.especie] && Number.isFinite(Number(m.dia)))
    .slice(0, macetasDe(extra))
    .map((m) => ({ especie: m.especie, dia: Math.floor(Number(m.dia)) }));
  return { macetas };
}
export function sanearJuntadas(j, dia) {
  const x = j && typeof j === 'object' ? j : {};
  if (Number(x.dia) !== dia) return { dia, arboles: [] };
  return { dia, arboles: (Array.isArray(x.arboles) ? x.arboles : []).filter(Number.isInteger).slice(0, 64) };
}

// ¿Se puede juntar semilla de este árbol hoy? `arbol`: { i, especie, esc }
export function puedeJuntarSemilla(arbol, { otono = 0, juntadas } = {}) {
  if (!arbol || !ARBOLES_VIVERO[arbol.especie] || arbol.especie === 'pehuen') return { ok: false };
  if (otono < 0.5) return { ok: false, motivo: 'fueraDeEstacion' };
  if ((arbol.esc ?? 1) < 0.85) return { ok: false, motivo: 'chico' };
  const j = juntadas || { arboles: [] };
  if (j.arboles.includes(arbol.i)) return { ok: false, motivo: 'yaJuntada' };
  if (j.arboles.length >= VIVERO.porDia) return { ok: false, motivo: 'bastaPorHoy' };
  return { ok: true, semilla: ARBOLES_VIVERO[arbol.especie].semilla };
}

export const listaParaPlantar = (m, dia) => dia - m.dia >= VIVERO.diasPlantin;

// E en el vivero: primero se sacan los plantines listos; si no hay, se siembra todo lo
// que entre de las semillas que tengas. `entradas`: progreso.entradas.
export function usarVivero(v, entradas, dia, extra = 0) {
  if (!v) return { accion: 'nada' };
  const listas = v.macetas.filter((m) => listaParaPlantar(m, dia));
  if (listas.length) {
    v.macetas = v.macetas.filter((m) => !listaParaPlantar(m, dia));
    const porEspecie = {};
    for (const m of listas) porEspecie[m.especie] = (porEspecie[m.especie] || 0) + 1;
    return { accion: 'sacar', plantines: porEspecie, total: listas.length };
  }
  const lugar = macetasDe(extra) - v.macetas.length;
  const sembradas = {};
  let n = 0;
  for (const esp of ESPECIES_VIVERO) {
    const k = ARBOLES_VIVERO[esp].semilla;
    while (n < lugar && (entradas?.[k]?.cantidad || 0) - (sembradas[esp] || 0) > 0) {
      sembradas[esp] = (sembradas[esp] || 0) + 1; n++;
    }
  }
  if (n) {
    for (const [esp, c] of Object.entries(sembradas)) for (let i = 0; i < c; i++) v.macetas.push({ especie: esp, dia });
    return { accion: 'sembrar', sembradas, total: n };
  }
  if (v.macetas.length) {
    const prox = Math.min(...v.macetas.map((m) => VIVERO.diasPlantin - (dia - m.dia)));
    return { accion: 'creciendo', dias: Math.max(1, prox) };
  }
  return { accion: 'sinSemillas' };
}

export function avisoVivero(v, entradas, dia, extra = 0) {
  if (!v) return null;
  const listas = v.macetas.filter((m) => listaParaPlantar(m, dia)).length;
  if (listas) return `Sacar ${listas} ${listas === 1 ? 'plantín' : 'plantines'}`;
  const semillas = ESPECIES_VIVERO.reduce((s, e) => s + (entradas?.[ARBOLES_VIVERO[e].semilla]?.cantidad || 0), 0);
  if (semillas && v.macetas.length < macetasDe(extra)) return `Sembrar en el vivero (${Math.min(semillas, macetasDe(extra) - v.macetas.length)})`;
  if (v.macetas.length) return `Germinando: ${v.macetas.length} ${v.macetas.length === 1 ? 'almácigo' : 'almácigos'}`;
  return 'Vivero vacío: en otoño, juntá semillas de los árboles grandes';
}

// El primer plantín que tengas, para plantar con B. `null` si no hay ninguno.
export function plantinDisponible(entradas) {
  for (const esp of ESPECIES_VIVERO) {
    const k = ARBOLES_VIVERO[esp].plantin;
    if ((entradas?.[k]?.cantidad || 0) > 0) return { entrada: k, especie: esp, nombre: `un plantín de ${ARBOLES_VIVERO[esp].nombre}`, arbol: ARBOLES_VIVERO[esp].nombre };
  }
  return null;
}
