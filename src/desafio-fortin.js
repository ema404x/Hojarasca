// 2.6: el fortín. Dieciocho cosas para la base del Desafío: troneras, resina hirviendo,
// catapulta, troncos colgantes, cerco de cristal, puente levadizo, espejo del faro,
// señuelo, trampa de lazo, abrojos, embudo de empalizada, tejado de lajas, muro de
// hielo, puesto de tirador, pasarela colgante, rampa de troncos, armero y contrafuerte.
//
// Módulo puro (se prueba en Node): los números y las reglas. Las piezas se dibujan en
// construccion.js (como las demás defensas) y lo que hacen de noche vive en
// desafio-fortin-mundo.js.

export const FORTIN = {
  // la pared con aspilleras: tus tiros pasan por esta franja de altura (sobre la base)
  tronera: { desde: 1.0, hasta: 1.7 },
  // arriba del adarve o del muro almenado, E vuelca resina hirviendo
  resina: { cargas: 2, troncos: 1, dano: 55, radio: 3.8 },
  catapulta: { alcance: 46, minimo: 10, cadencia: 6, dano: 80, radio: 3.5, piedras: 10, grupo: 5 },
  troncos: { radio: 1.6, golpe: 2.6, dano: 90, derriba: 1.2 },
  cercoCristal: { radio: 0.95, dano: 12, cada: 0.8, freno: 0.6 },
  espejo: { largo: 28, angulo: 0.22, barrido: 0.7, velBarrido: 0.45, luz: 4.5, lento: 0.5 },
  senuelo: { atrae: 25, jugadorCerca: 8, llega: 1.8 },
  lazo: { radio: 1.2, colgado: 5, danoExtra: 1.3 },
  abrojos: { radio: 2.5, freno: 0.5, dps: 6, desgaste: 1.5 },
  embudo: { alcance: 13, boca: 3.2, garganta: 0.7, fondo: 2.8 },
  tejado: { radio: 2.3 },
  hielo: { factor: 0.6 },
  puesto: { radio: 1.6, dano: 1.3, cadencia: 1.6, alcance: 40 },
  rampa: { troncos: 3, vel: 9, dano: 60, largo: 26, radio: 1.1, derriba: 1 },
  contrafuerte: { radio: 3.2, factor: 0.7 },
};
// El armero rehace la munición de las armas que tenés, hasta estos topes, con lo que
// costaría en el taller (lote entero).
export const ARMERO = {
  flechas: { tope: 24, lote: 8, pide: { tabla: 1, piedra: 1 }, arma: 'arco' },
  virotes: { tope: 12, lote: 6, pide: { tabla: 1, piedra: 2 }, arma: 'ballesta' },
  boleadoras: { tope: 6, lote: 3, pide: { piedra: 3, tabla: 1 }, arma: 'boleadoras' },
};
// Las paredes que el contrafuerte apuntala y que el hielo puede cubrir.
export const PAREDES = ['empalizada', 'empalizada-reforzada', 'muro-piedra', 'muro-almenado', 'muro-tronera', 'porton-empalizada', 'porton-reforzado'];
export const HELABLES = ['muro-piedra', 'muro-almenado', 'muro-tronera'];
export const CON_RESINA = ['adarve', 'muro-almenado'];

// ---------------------------------------------------------------- troneras
// `alturaRel`: la del proyectil sobre la base de la pared.
export const pasaPorTronera = (alturaRel) => alturaRel >= FORTIN.tronera.desde && alturaRel <= FORTIN.tronera.hasta;

// ---------------------------------------------------------------- daño a las paredes
// Contrafuerte y hielo se multiplican: una pirca helada y apuntalada aguanta el doble.
export function factorPared({ apuntalada = false, helada = false } = {}) {
  return (apuntalada ? FORTIN.contrafuerte.factor : 1) * (helada ? FORTIN.hielo.factor : 1);
}
// El hielo dura mientras siga el invierno.
export const heladaActiva = (datos, invierno) => !!datos?.helada && invierno > 0.5;

// ---------------------------------------------------------------- resina hirviendo
export function usarResina(datos, { noche = false, troncos = 0 } = {}) {
  const cargas = Math.max(0, Math.floor(Number(datos.resina) || 0));
  if (noche && cargas > 0) { datos.resina = cargas - 1; return { accion: 'volcar', quedan: cargas - 1 }; }
  if (!noche && cargas < FORTIN.resina.cargas) {
    if (troncos < FORTIN.resina.troncos) return { accion: 'sinLena' };
    datos.resina = FORTIN.resina.cargas;
    return { accion: 'cargar', troncos: FORTIN.resina.troncos };
  }
  return { accion: noche ? 'vacia' : 'llena', quedan: cargas };
}
export function avisoResina(datos, { noche = false } = {}) {
  const cargas = Math.max(0, Math.floor(Number(datos?.resina) || 0));
  if (noche) return cargas > 0 ? `Volcar resina hirviendo (${cargas})` : null;
  return cargas < FORTIN.resina.cargas ? 'Cargar resina para la noche (1 tronco)' : null;
}

// ---------------------------------------------------------------- catapulta
// Al grupo más apretado que esté entre el mínimo y el alcance. `candidatos`: [{ x, z }].
export function blancoCatapulta(origen, candidatos, f = FORTIN.catapulta) {
  let mejor = null, n0 = 0, d0 = Infinity;
  for (const c of candidatos) {
    const d = Math.hypot(c.x - origen.x, c.z - origen.z);
    if (d < f.minimo || d > f.alcance) continue;
    let n = 0;
    for (const o of candidatos) if (Math.hypot(o.x - c.x, o.z - c.z) < f.grupo) n++;
    if (n > n0 || (n === n0 && d < d0)) { mejor = c; n0 = n; d0 = d; }
  }
  return mejor;
}
// Velocidad para caer a `d` metros con un tiro a 45° (y lo que sube o baja el blanco).
export function tiroParabolico(d, dy = 0, g = 9.8) {
  const alcance = Math.max(1, d);
  const v2 = (g * alcance * alcance) / Math.max(0.5, alcance - dy);
  const v = Math.sqrt(Math.max(1, v2));
  return { horizontal: v * Math.SQRT1_2, vertical: v * Math.SQRT1_2, tiempo: alcance / (v * Math.SQRT1_2) };
}

// ---------------------------------------------------------------- espejo del faro
// ¿El punto está adentro del haz? `rumbo` hacia dónde apunta (radianes, como `rot`).
export function enElHaz(origen, rumbo, punto, f = FORTIN.espejo) {
  const dx = punto.x - origen.x, dz = punto.z - origen.z, d = Math.hypot(dx, dz);
  if (d < 0.5 || d > f.largo) return false;
  const ang = Math.atan2(dx, dz);
  const dif = Math.abs(Math.atan2(Math.sin(ang - rumbo), Math.cos(ang - rumbo)));
  return dif < f.angulo;
}
export const rumboEspejo = (rot, t, f = FORTIN.espejo) => rot + Math.sin(t * f.velBarrido) * f.barrido;

// ---------------------------------------------------------------- embudo
// El embudo abre hacia +z local: la boca afuera, la garganta en el centro. Devuelve el
// punto (local) al que conviene ir, o null si ya pasó o está lejos.
export function destinoEmbudo(lx, lz, f = FORTIN.embudo) {
  if (lz < -0.3 || Math.hypot(lx, lz) > f.alcance) return null;
  // dentro de la V (prolongada): el camino recto a la garganta no cruza ningún ala
  if (Math.abs(lx) > f.garganta + (lz + 1.2) * (f.boca - f.garganta) / f.fondo) return null;
  return { lx: 0, lz: -1.2 };
}

// ---------------------------------------------------------------- armero
// Qué rehace con lo que hay. `tengo(k)` devuelve cuánto hay de cada material.
export function recargaArmero(d, cosas = {}, tengo = () => 0) {
  const gasto = {}, hecho = {};
  const alcanza = (pide) => Object.entries(pide).every(([k, n]) => tengo(k) - (gasto[k] || 0) >= n);
  for (const [k, a] of Object.entries(ARMERO)) {
    if (!cosas[a.arma]) continue;
    let actual = Math.max(0, Math.floor(Number(d?.[k]) || 0));
    while (actual < a.tope && alcanza(a.pide)) {
      for (const [m, n] of Object.entries(a.pide)) gasto[m] = (gasto[m] || 0) + n;
      const suma = Math.min(a.lote, a.tope - actual);
      actual += suma;
      hecho[k] = (hecho[k] || 0) + suma;
    }
  }
  return { hecho, gasto, algo: Object.keys(hecho).length > 0 };
}

// ---------------------------------------------------------------- rampa de troncos
export function usarRampa(datos, { troncos = 0 } = {}) {
  const cargados = Math.max(0, Math.floor(Number(datos.troncos) || 0));
  if (cargados >= FORTIN.rampa.troncos) { datos.troncos = 0; return { accion: 'soltar', troncos: cargados }; }
  const faltan = FORTIN.rampa.troncos - cargados;
  if (troncos <= 0) return { accion: 'sinTroncos', faltan };
  const pone = Math.min(faltan, troncos);
  datos.troncos = cargados + pone;
  return { accion: 'cargar', pone, lista: datos.troncos >= FORTIN.rampa.troncos };
}
export function avisoRampa(datos) {
  const n = Math.max(0, Math.floor(Number(datos?.troncos) || 0));
  return n >= FORTIN.rampa.troncos ? 'Soltar los troncos cuesta abajo' : `Cargar troncos en la rampa (${n}/${FORTIN.rampa.troncos})`;
}

// Saneo de lo que las piezas del fortín guardan en su obra.
export function sanearDatosFortin(datos) {
  if (!datos || typeof datos !== 'object') return datos;
  const n = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  if (datos.resina !== undefined) datos.resina = n(datos.resina, FORTIN.resina.cargas);
  if (datos.piedras !== undefined) datos.piedras = n(datos.piedras, FORTIN.catapulta.piedras);
  if (datos.troncos !== undefined) datos.troncos = n(datos.troncos, FORTIN.rampa.troncos);
  if (datos.armada !== undefined) datos.armada = !!datos.armada;
  if (datos.bajado !== undefined) datos.bajado = !!datos.bajado;
  if (datos.helada !== undefined) datos.helada = !!datos.helada;
  return datos;
}
