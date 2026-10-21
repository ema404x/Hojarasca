// 4.1 (borrador, F1): el creador de personaje de Bruno Castellanos. Módulo puro (sin three ni DOM): se prueba en Node.
//
// El protagonista es fijo: Bruno Castellanos, 27 años, que llega al valle buscando paz lejos del ruido de la ciudad. No se elige el sexo ni el nombre:
// se eligen DIEZ personalizaciones (ver `PERSONALIZACIONES` en creador-catalogo.js): cinco de aspecto y cinco de carácter.
//
// Qué hay acá (el catálogo, con las listas y los efectos como datos, está en creador-catalogo.js):
//   · el «genoma»: el objeto chico y versionado con lo que se eligió;
//   · `sanearGenoma`: devuelve SIEMPRE un genoma válido (una partida vieja o rota nunca rompe nada);
//   · `aspectoDeGenoma`: lo traduce al «aspecto» que entiende el motor de cuerpos (gente-cuerpo.js, la forma de `aspectoGente` de gente-ropa.js);
//   · los efectos de los rasgos sobre cuatro sistemas, con su tope (`efectosAplicados`, `afectoConVecino`), y la ficha (`resumenDeBruno`);
//   · `genomaDesdePersonajeViejo`: lo que el jugador ya había elegido en «Tu personaje» (personal-personaje.js), para precargarlo en una partida vieja.
//
// Todavía no está enchufado al juego (no registra su sección ni toca main.js): eso es de las fases 2 y 3.
import { SISTEMAS, TOPES, PIELES, CARAS, OJOS, PELOS, PEINADOS, CONTEXTURAS, ESTATURAS, LANAS, PERSONALIDADES, OFICIOS, GUSTOS, HOBBIES, VIRTUDES, DEFECTOS, PERSONALIZACIONES, GUSTOS_DE_VECINOS } from './creador-catalogo.js';

export const VERSION_GENOMA = 2;
export const PROTAGONISTA = { nombre: 'Bruno', apellido: 'Castellanos', edad: 27 };

const ids = (l) => l.map((x) => x.id);
const elegir = (v, lista, def) => (ids(lista).includes(v) ? v : def);
const de = (l, id) => l.find((x) => x.id === id) || l[0];

// Bruno, como llega si no se eligió nada: un joven de ciudad con la campera que se compró para el viaje. El carácter por defecto es el más neutro.
export function genomaDefecto() {
  return {
    version: VERSION_GENOMA,
    cara: 'suave', ojos: 'marrones', piel: 'rosada', pelo: 'castano', peinado: 'flequillo', barba: 'ninguna',
    contextura: 'media', estatura: 'media', campera: 'marron', accesorio: 'ninguno',
    personalidad: 'tranquilo', oficio: 'contador', gustos: ['mate', 'libros'], hobby: 'fotografia', virtud: 'paciente', defecto: 'impaciente',
  };
}

// Dos gustos distintos y válidos: lo que venga roto se completa con los de siempre.
function sanearGustos(v, def) {
  const vistos = [];
  for (const x of Array.isArray(v) ? v : []) if (ids(GUSTOS).includes(x) && !vistos.includes(x)) vistos.push(x);
  for (const x of def) if (vistos.length < 2 && !vistos.includes(x)) vistos.push(x);
  for (const g of GUSTOS) if (vistos.length < 2 && !vistos.includes(g.id)) vistos.push(g.id);
  return vistos.slice(0, 2);
}

export function sanearGenoma(g) {
  const x = g && typeof g === 'object' ? g : {};
  const b = genomaDefecto();
  const out = { version: VERSION_GENOMA };
  for (const p of PERSONALIZACIONES) for (const c of p.campos) {
    out[c.campo] = c.campo === 'gustos' ? sanearGustos(Object.hasOwn(x, 'gustos') ? x.gustos : undefined, b.gustos) : elegir(Object.hasOwn(x, c.campo) ? x[c.campo] : undefined, c.lista, b[c.campo]);
  }
  return out;
}

// Las opciones que se ofrecen al CREAR a Bruno: lo que pide una anotación del cuaderno (tintes) no está hasta conseguirlo (guardarropa).
export function opcionesAlCrear(campo) {
  for (const p of PERSONALIZACIONES) for (const c of p.campos) if (c.campo === campo) return c.lista.filter((o) => !o.pide);
  return [];
}

// ---------------------------------------------------------------- el aspecto, para el motor de cuerpos
export function aspectoDeGenoma(genoma) {
  const g = sanearGenoma(genoma);
  const con = de(CONTEXTURAS, g.contextura), alto = de(ESTATURAS, g.estatura).alto;
  const peinado = de(PEINADOS, g.peinado), cara = de(CARAS, g.cara);
  const pelo = de(PELOS, g.pelo).color, campera = de(LANAS, g.campera).color;
  const R = {
    mujer: false, botas: 'altas', pantalon: '#3f3a33', ...peinado.R,
    canas: g.pelo === 'canoso' ? 0.6 : 0, ...(g.barba === 'bigote' ? { bigote: true } : {}),
  };
  return {
    conocido: true, edad: PROTAGONISTA.edad,
    colores: {
      piel: de(PIELES, g.piel).color, pelo, ropa: campera, abrigo: campera, pantalon: '#3f3a33',
      ...(g.barba !== 'ninguna' ? { barba: pelo } : {}),
      bufanda: g.accesorio === 'bufanda' ? '#e2d6bd' : null,
      gorro: g.accesorio === 'gorro' ? 'gorroPunto' : null, gorroColor: g.accesorio === 'gorro' ? '#b0773a' : null,
      ...(g.accesorio === 'anteojos' ? { anteojos: true } : {}),
    },
    R,
    cuerpo: { ancho: con.ancho, fondo: con.fondo, brazos: 0.5 + 0.5 * con.ancho, piernas: 0.6 + 0.4 * con.ancho, alto, ...(con.panza ? { panza: con.panza } : {}) },
    cara: { ...cara.cara, iris: de(OJOS, g.ojos).color },
    // la guarda del cuello sólo va con la bufanda (sin ella asomaba una cinta de colores en la base del cuello)
    guardas: { puno: [1, 0, 'todo'], ...(g.accesorio === 'bufanda' ? { cuello: [1, 0, 'todo'] } : {}) },
    poses: null,
  };
}

// ---------------------------------------------------------------- los efectos (sólo en el Relax)
// Todo lo que aporta cada rasgo elegido: { clase, id, lado: 'pro' | 'contra', sistema, pasos } (`sistema` y `pasos` en null: es de sabor).
export function contribuciones(genoma) {
  const g = sanearGenoma(genoma);
  const fila = (clase, opcion, lado, ef) => ({ clase, id: opcion.id, lado, sistema: ef ? ef.sistema : null, pasos: ef ? ef.pasos : null });
  const r = [];
  for (const [clase, lista, id] of [['personalidad', PERSONALIDADES, g.personalidad], ['oficio', OFICIOS, g.oficio], ['hobby', HOBBIES, g.hobby]]) {
    const o = de(lista, id);
    r.push(fila(clase, o, 'pro', o.pro), fila(clase, o, 'contra', o.contra));
  }
  for (const id of g.gustos) r.push(fila('gustos', de(GUSTOS, id), 'contra', de(GUSTOS, id).contra));
  const v = de(VIRTUDES, g.virtud), d = de(DEFECTOS, g.defecto);
  r.push(fila('virtud', v, 'pro', v.pro), fila('defecto', d, 'contra', d.contra));
  return r;
}

// La suma de lo que aporta cada rasgo, sin tope.
export function efectosBrutos(genoma) {
  const t = Object.fromEntries(SISTEMAS.map((s) => [s, 0]));
  for (const c of contribuciones(genoma)) if (c.sistema) t[c.sistema] += c.pasos;
  return t;
}
const recortar = (sistema, pasos) => Math.max(-TOPES[sistema], Math.min(TOPES[sistema], pasos));
// Lo que cuenta de verdad: recortado al tope de cada sistema (±4 pasos, ±20 %; el abrigo ±1 punto).
export function efectosAplicados(genoma) {
  const b = efectosBrutos(genoma);
  return Object.fromEntries(SISTEMAS.map((s) => [s, recortar(s, b[s])]));
}
// ¿Algún rasgo ya no suma porque el sistema llegó al tope? Sirve para avisar en la ficha («ya estás al máximo en pesca»).
export function sistemasAlTope(genoma) {
  const b = efectosBrutos(genoma);
  return SISTEMAS.filter((s) => Math.abs(b[s]) > TOPES[s]);
}

// Afinidad con un vecino: lo que suman los gustos de Bruno que ese vecino también tiene (en pasos de afecto).
export function afinidadConVecino(genoma, vecino) {
  const g = sanearGenoma(genoma);
  const suyos = Object.hasOwn(GUSTOS_DE_VECINOS, vecino) ? GUSTOS_DE_VECINOS[vecino] : [];
  return g.gustos.filter((id) => suyos.includes(id)).reduce((s, id) => s + de(GUSTOS, id).afinidad, 0);
}
// El afecto con ese vecino: lo de la personalidad y los rasgos más la afinidad, con el mismo tope.
export function afectoConVecino(genoma, vecino) {
  return recortar('afecto', efectosBrutos(genoma).afecto + afinidadConVecino(genoma, vecino));
}

// La ficha del cuaderno: lo elegido, ordenado, con los pros y los contras de cada rasgo (los textos se agregan en la F4).
export function resumenDeBruno(genoma) {
  const g = sanearGenoma(genoma);
  const c = contribuciones(g);
  return {
    nombre: `${PROTAGONISTA.nombre} ${PROTAGONISTA.apellido}`, edad: PROTAGONISTA.edad,
    elecciones: g,
    pros: c.filter((x) => x.lado === 'pro'), contras: c.filter((x) => x.lado === 'contra'),
    aplicados: efectosAplicados(g), alTope: sistemasAlTope(g),
  };
}

// ---------------------------------------------------------------- las partidas viejas
// Lo que el jugador ya había elegido en «Tu personaje» (piel, pelo, peinado, contextura, campera, gorro y bufanda) se precarga en el genoma de Bruno,
// así nadie rehace desde cero lo que ya tenía. El carácter queda en lo neutro y se elige al crear.
const PEINADO_VIEJO = { corto: 'corto', largo: 'melena', trenza: 'coleta', rodete: 'rodete', rapado: 'corto' };
export function genomaDesdePersonajeViejo(personaje) {
  const p = personaje && typeof personaje === 'object' ? personaje : {};
  const g = genomaDefecto();
  if (Object.hasOwn(p, 'piel')) g.piel = p.piel;
  if (Object.hasOwn(p, 'pelo')) g.pelo = p.pelo;
  if (Object.hasOwn(p, 'contextura')) g.contextura = p.contextura;
  if (Object.hasOwn(p, 'campera')) g.campera = p.campera;
  if (Object.hasOwn(p, 'peinado') && Object.hasOwn(PEINADO_VIEJO, p.peinado)) g.peinado = PEINADO_VIEJO[p.peinado];
  g.accesorio = p.gorro === true ? 'gorro' : p.bufanda === true ? 'bufanda' : 'ninguno';
  return sanearGenoma(g);
}
