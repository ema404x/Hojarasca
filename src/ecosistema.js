// Ecosistema atmosférico RC18: registro liviano, ritmos diarios y rutas de escape.
// Mantiene sólo el frame actual y el anterior para evitar dependencias directas entre módulos.
import { clamp } from './ruido.js';
import { crearIndiceEspacial2D } from './rendimiento.js';



// RC18: ritmo diario y refugio ambiental compartidos entre especies.
// No pretende simular metabolismo; sólo evita que cada módulo invente su propio reloj ecológico.
export function actividadFaunaPatagonica(tipo, horas = 12, clima = {}) {
  const h = ((horas % 24) + 24) % 24;
  const gauss = (centro, ancho) => {
    const d0 = Math.abs(h - centro);
    const d = Math.min(d0, 24 - d0);
    return Math.exp(-(d * d) / (2 * ancho * ancho));
  };
  const amanecer = gauss(7.2, 1.7);
  const atardecer = gauss(19.4, 1.9);
  const crepusculo = clamp(amanecer + atardecer, 0, 1);
  const dia = clamp((h - 5.6) / 2.1, 0, 1) * clamp((21.1 - h) / 2.4, 0, 1);
  const noche = 1 - dia;
  const lluvia = clamp(clima.lluvia || 0, 0, 1);
  const tormenta = clima.tormenta ? 1 : 0;
  let a = 0.55;
  if (tipo === 'huemul') a = 0.26 + crepusculo * 0.62 + dia * 0.16;
  else if (tipo === 'zorro') a = 0.18 + noche * 0.60 + crepusculo * 0.28;
  else if (tipo === 'guanaco') a = 0.30 + dia * 0.58 + crepusculo * 0.12;
  else if (tipo === 'liebre') a = 0.28 + noche * 0.42 + crepusculo * 0.36;
  else if (tipo === 'zorzal' || tipo === 'bandurria') a = 0.18 + dia * 0.74;
  // La precipitación reduce la actividad visible; una tormenta fuerte no la lleva a cero.
  a *= 1 - lluvia * (tipo === 'zorro' ? 0.22 : 0.36) - tormenta * 0.22;
  return clamp(a, 0.08, 1);
}

export function perfilRefugioTerreno(T, x, z) {
  const k = T.indice(x, z);
  const bosque = clamp(T.bosque?.[k] || 0, 0, 1);
  const estepa = clamp(T.estepa?.[k] || 0, 0, 1);
  const pasto = clamp(T.pasto?.[k] || 0, 0, 1);
  const pendiente = clamp(T.pendiente?.[k] || 0, 0, 2);
  const dRio = (T.distRio?.[k] ?? 999) - (T.anchoRio?.[k] ?? 0);
  const ribera = clamp(1 - dRio / 18, 0, 1);
  const borde = clamp(1 - Math.abs(bosque - 0.46) * 2.15, 0, 1);
  const matorral = clamp(bosque * 0.52 + pasto * 0.22 + borde * 0.34 - estepa * 0.08, 0, 1);
  const abierto = clamp(estepa * 0.68 + (1 - bosque) * 0.42, 0, 1);
  const humedad = clamp(ribera * 0.72 + pasto * 0.18 + bosque * 0.12, 0, 1);
  return { bosque, estepa, pasto, pendiente, ribera, borde, matorral, abierto, humedad };
}

let actual = new Map();
let anterior = new Map();
let indiceActual = crearIndiceEspacial2D(32);
let indiceAnterior = crearIndiceEspacial2D(32);
const consultaActual = [], consultaAnterior = [];
const vistosConsulta = new Set();

export function iniciarFrameEcosistema() {
  const mapaViejo = anterior; anterior = actual; actual = mapaViejo; actual.clear();
  const indiceViejo = indiceAnterior; indiceAnterior = indiceActual; indiceActual = indiceViejo; indiceActual.limpiar();
}

export function publicarAnimal(tipo, id, pos, datos = {}) {
  if (!tipo || !id || !pos) return;
  const registro = { tipo, id, x: pos.x, y: pos.y || 0, z: pos.z, ...datos };
  actual.set(`${tipo}:${id}`, registro);
  indiceActual.insertar(registro, registro.x, registro.z);
}

function candidatos(tipo) {
  const vistos = new Set();
  const salida = [];
  for (const fuente of [actual, anterior]) {
    for (const a of fuente.values()) {
      if (a.tipo !== tipo) continue;
      const clave = `${a.tipo}:${a.id}`;
      if (vistosConsulta.has(clave)) continue;
      vistosConsulta.add(clave);
      salida.push(a);
    }
  }
  return salida;
}

export function animalMasCercano(tipo, pos, radio = Infinity) {
  let mejor = null, dm2 = radio * radio;
  vistosConsulta.clear();
  const revisar = (lista) => {
    for (const a of lista) {
      if (a.tipo !== tipo) continue;
      // 2.6.1: el tipo ya está filtrado: alcanza el id, sin armar un texto por candidato
      if (vistosConsulta.has(a.id)) continue;
      vistosConsulta.add(a.id);
      const dx = a.x - pos.x, dz = a.z - pos.z, d2 = dx * dx + dz * dz;
      if (d2 < dm2) { dm2 = d2; mejor = a; }
    }
  };
  if (Number.isFinite(radio)) {
    revisar(indiceActual.consultar(pos.x, pos.z, radio, consultaActual));
    revisar(indiceAnterior.consultar(pos.x, pos.z, radio, consultaAnterior));
  } else {
    revisar(actual.values()); revisar(anterior.values());
  }
  return mejor ? { ...mejor, d: Math.sqrt(dm2) } : null;
}

// Busca una dirección de huida que aumente distancia a la amenaza, evite agua/pendiente
// y, cuando corresponde, premie cobertura boscosa. Se muestrea poco: sólo al iniciar
// una huida o cada varios segundos, nunca en todos los pasos de IA.
export function destinoEscapeConCobertura(T, pos, amenaza, opciones = {}) {
  const radio = opciones.radio ?? 18;
  const muestras = opciones.muestras ?? 9;
  const preferirCobertura = clamp(opciones.preferirCobertura ?? 0.55, 0, 1);
  const evitarEstepa = clamp(opciones.evitarEstepa ?? 0.25, 0, 1);
  const objetivoCobertura = opciones.objetivoCobertura;
  const preferirBorde = clamp(opciones.preferirBorde ?? 0, 0, 1);
  const base = Math.atan2(pos.x - amenaza.x, pos.z - amenaza.z);
  let mejor = null, mejorPuntaje = -Infinity;

  for (let i = 0; i < muestras; i++) {
    const t = muestras <= 1 ? 0 : i / (muestras - 1);
    const desviacion = (t - 0.5) * Math.PI * 1.15;
    const ang = base + desviacion;
    const rr = radio * (0.78 + 0.22 * Math.cos(desviacion));
    const x = pos.x + Math.sin(ang) * rr;
    const z = pos.z + Math.cos(ang) * rr;
    if (Math.abs(x) > 462 || Math.abs(z) > 462 || T.agua(x, z)) continue;
    const k = T.indice(x, z);
    const n = T.normal(x, z);
    const pendiente = 1 - clamp(n.y, 0, 1);
    if (pendiente > 0.72) continue;
    const refugio = perfilRefugioTerreno(T, x, z);
    const bosque = refugio.bosque;
    const estepa = refugio.estepa;
    const separacion = Math.hypot(x - amenaza.x, z - amenaza.z);
    const avance = Math.hypot(x - pos.x, z - pos.z);
    const cobertura = objetivoCobertura == null ? bosque * 12 * preferirCobertura : -Math.abs(refugio.matorral - objetivoCobertura) * 11 * preferirCobertura;
    const borde = refugio.borde * 8 * preferirBorde;
    const puntaje = separacion * 1.2 + avance * 0.12 + cobertura + borde - estepa * 8 * evitarEstepa - pendiente * 18;
    if (puntaje > mejorPuntaje) { mejorPuntaje = puntaje; mejor = { x, z, puntaje, bosque, estepa }; }
  }
  return mejor;
}

export function intensidadInteraccionPredadorPresa(predador, presa, radio = 24) {
  if (!predador || !presa) return 0;
  const d = Math.hypot(predador.x - presa.x, predador.z - presa.z);
  return clamp(1 - d / radio, 0, 1);
}

export function _debugEcosistema() {
  return { actual: [...actual.values()], anterior: [...anterior.values()] };
}
