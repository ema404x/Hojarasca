// 2.1: cinco cosas nuevas del Desafío, en lo que tienen de lógica pura.
//
//   6. Rescates. Algunas noches no te atacan a vos: atacan el lugar de un vecino. Si
//      vas y lo defendés, te lo agradece; si no, a la mañana el lugar quedó dañado y el
//      vecino no te habla por unos días.
//   7. El excavador. Un invasor que no salta ni rompe: cava por abajo de la empalizada y
//      sale adentro. Se lo oye y se ve la tierra que se mueve; donde hay losa de piedra
//      no puede salir.
//   8. Un jefe distinto cada vez: el de siempre, el que llama refuerzos, el que se hace
//      invisible y sólo se ve con la linterna, y el que tira piedras a las defensas.
//   9. Ruinas del bosque para explorar (4.8.1: antes «restos de nave»): pasillos, trampas que todavía funcionan, invasores
//      dormidos, y al fondo el premio.
//  10. La forja de cristal: la lanza que congela, las flechas que encadenan un rayo y la
//      honda que derriba.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------------------------------------------------------------- 6. rescates
// Dónde vive cada vecino (las claves de `T.lugares`) y cómo se llama su lugar.
export const RESCATES = {
  puesto: { vecino: 'ramon', nombre: 'Don Ramón', lugar: 'el puesto de Don Ramón' },
  cabana: { vecino: 'nicanor', nombre: 'Nicanor', lugar: 'la cabaña de Nicanor' },
  almacen: { vecino: 'ercilia', nombre: 'Ercilia', lugar: 'el almacén de Ercilia' },
  estacion: { vecino: 'guarda', nombre: 'Elsa', lugar: 'la estación de Elsa' },
};
export const VIDA_LUGAR = 260;
export const DIAS_ENOJADO = 2;
// Cuánto aguanta el lugar. Al principio cada golpe le sacaba la mitad del daño de obra
// y trece invasores lo tiraban en diez segundos: no había forma de llegar. Ahora el
// daño corre por tiempo y crece con la raíz de cuántos atacan: una oleada entera (13)
// lo tira en unos dos minutos, cuatro en casi cuatro. `mult` es el daño de la noche.
export const TASA_LUGAR = 0.6;
export function danoAlLugar(atacantes, dt, mult = 1) {
  if (!(atacantes > 0) || !(dt > 0)) return 0;
  return TASA_LUGAR * Math.sqrt(atacantes) * Math.max(0.5, mult || 1) * dt;
}
// ¿Esta noche atacan a un vecino? Desde la noche 3, nunca la del jefe, nunca una noche
// especial ni la final. `lugares` son las claves que existen en el mapa.
export function nocheDeRescate(n, { azar = Math.random, esJefe = false, especial = null, final = false, lugares = Object.keys(RESCATES), anterior = null } = {}) {
  if (n < 3 || esJefe || especial || final) return null;
  if (azar() > 0.24) return null;
  const posibles = lugares.filter((l) => RESCATES[l] && l !== anterior);
  if (!posibles.length) return null;
  return posibles[Math.floor(azar() * posibles.length) % posibles.length];
}
// El premio de un rescate que salió bien.
export function premioRescate(noche) {
  return { tronco: 3 + Math.min(4, Math.floor(noche / 3)), tabla: 3 + Math.min(4, Math.floor(noche / 3)), cristal: 2 };
}
// ¿Sigue enojado? `enojados` es { vecino: díaHasta }.
export function sigueEnojado(enojados, vecino, dia) {
  return !!enojados && Number.isFinite(enojados[vecino]) && dia < enojados[vecino];
}
export const SALUDO_ENOJADO = {
  ramon: 'Anoche me destrozaron el puesto y vos no viniste. Dejame tranquilo un par de días.',
  nicanor: 'No tengo ganas de hablar. Anoche la cabaña casi se viene abajo.',
  ercilia: 'Hoy no atiendo. Anoche nadie vino a ayudar.',
  guarda: 'La estación quedó hecha un desastre. Hoy no tengo cabeza para charlar.',
};
export function sanearRescates(v) {
  const s = { enojados: {}, hechos: 0 };
  if (!v || typeof v !== 'object') return s;
  if (v.enojados && typeof v.enojados === 'object') {
    for (const k of Object.values(RESCATES).map((r) => r.vecino)) {
      const n = Number(v.enojados[k]);
      if (Number.isFinite(n) && n > 0) s.enojados[k] = Math.floor(n);
    }
  }
  s.hechos = Math.max(0, Math.floor(Number(v.hechos) || 0));
  return s;
}

// ---------------------------------------------------------------- 7. el excavador
export const EXCAVADOR = {
  nombre: 'excavador', vida: 70, vel: 3.1, dano: 11, cadencia: 1.1, alcance: 1.6, danoObra: 10,
  radio: 0.5, altura: 1.6, cristales: [1, 2], retroceso: 0.7, excava: true,
};
export const VEL_BAJO_TIERRA = 3.4;
export const SALE_A = 3;            // metros del jugador donde asoma
// ¿Se mete bajo tierra? Cuando lo que tiene entre él y vos es una obra, y todavía está
// lejos: de cerca prefiere pegar.
export function debeCavar({ distancia, obraEnMedio }) {
  return !!obraEnMedio && distancia > 6;
}
// Dónde sale: cerca del jugador, del lado por donde venía; si ahí hay una losa de
// piedra, retrocede por su camino hasta encontrar tierra. `losa(x,z)` dice si hay piedra.
export function puntoDeSalida(bicho, jugador, losa = () => false) {
  const dx = bicho.x - jugador.x, dz = bicho.z - jugador.z;
  const d = Math.hypot(dx, dz) || 1;
  for (let r = SALE_A; r <= SALE_A + 20; r += 1) {
    const x = jugador.x + (dx / d) * r, z = jugador.z + (dz / d) * r;
    if (!losa(x, z)) return { x, z, bloqueado: r > SALE_A };
  }
  return null;
}

// ---------------------------------------------------------------- 8. los jefes
export const VARIANTES_JEFE = ['clasico', 'llamador', 'sombra', 'artillero'];
export const NOMBRE_JEFE = {
  clasico: 'el mandamás', llamador: 'el mandamás que llama', sombra: 'el mandamás sombra', artillero: 'el mandamás que tira piedras',
};
export const AVISO_JEFE = {
  clasico: 'Los hongos de la espalda son lo único blando que tiene: pegale ahí y duele el doble',
  llamador: 'Si no lo bajás rápido, llama a otros. Los hongos de la espalda siguen siendo su punto débil',
  sombra: 'No se lo ve. Con la linterna encendida (L), el haz lo descubre',
  artillero: 'Se queda lejos y tira piedras a las defensas. Salí a buscarlo',
};
// Noche 5: el de siempre; 10: el que llama; 15: la sombra; 20: el que tira piedras; y vuelve a empezar.
export function varianteJefe(noche) {
  const i = Math.max(0, Math.floor(noche / 5) - 1);
  return VARIANTES_JEFE[i % VARIANTES_JEFE.length];
}
// El llamador: cada cuánto llama y cuántos vienen, con un tope por jefe.
export const LLAMADO = { cada: 16, cuantos: 2, tope: 8 };
// La sombra: se ve si el haz de la linterna la toca, si está muy cerca o si le acaban de pegar.
export function sombraVisible({ reflejo = 0, distancia = 99, flash = 0 }) {
  return reflejo > 0.02 || distancia < 4.5 || flash > 0.15;
}
// El artillero: se queda a tiro, lejos, y tira una piedra cada tanto.
export const ARTILLERO = { distancia: 30, cada: 4.2, danoObra: 70, danoJugador: 22, radio: 2.6, vel: 22 };
// La velocidad inicial de un tiro con arco para caer en `hasta` (gravedad g).
export function tiroParabolico(desde, hasta, vel, g = 9.8) {
  const dx = hasta.x - desde.x, dz = hasta.z - desde.z, dy = (hasta.y ?? 0) - (desde.y ?? 0);
  const d = Math.hypot(dx, dz) || 1;
  const t = d / vel;
  return { x: (dx / d) * vel, y: dy / t + 0.5 * g * t, z: (dz / d) * vel };
}

// ---------------------------------------------------------------- 9. ruinas del bosque para explorar
// La ruina: un pasillo de tres cámaras, cada una con su trampa en el piso, invasores
// dormidos en la del medio y el premio al fondo. Todo en coordenadas locales: el pasillo
// va por +z, de la entrada (z = 0) al fondo.
export const RUINA = { ancho: 3.4, largo: 17, tabiques: [5.8, 11.6], puerta: 1.5, alto: 2.4 };
export function disposicionRuina(azar = Math.random) {
  const placas = [
    { x: (azar() - 0.5) * 1.2, z: 2.9 },
    { x: (azar() - 0.5) * 1.2, z: 8.7 },
    { x: (azar() - 0.5) * 1.2, z: 14.2 },
  ];
  const dormidos = [
    { tipo: 'rastreador', x: -0.9, z: 7.6 + azar() * 1.5 },
    { tipo: azar() < 0.5 ? 'saltador' : 'rastreador', x: 0.9, z: 9.2 + azar() * 1.5 },
  ];
  return { placas, dormidos, premio: { x: 0, z: RUINA.largo - 1.2 } };
}
// Las paredes de la ruina como segmentos (para las colisiones), en locales.
export function paredesRuina() {
  const { ancho, largo, tabiques, puerta } = RUINA, m = ancho / 2;
  const segs = [
    [-m, 0, -m, largo], [m, 0, m, largo], [-m, largo, m, largo],
  ];
  for (const z of tabiques) {
    segs.push([-m, z, -puerta / 2, z]);
    segs.push([puerta / 2, z, m, z]);
  }
  return segs;
}
// Las placas de descarga: prendidas un rato, apagadas otro. Cada una con su fase.
export const PLACA = { periodo: 2.6, prendida: 0.95, dano: 14, radio: 0.75 };
export function placaActiva(t, fase = 0) {
  const k = ((t + fase) % PLACA.periodo + PLACA.periodo) % PLACA.periodo;
  return k < PLACA.prendida;
}
// Los dormidos: se despiertan si pasás muy cerca, o cerca y haciendo ruido.
export function despierta({ distancia, agachado, corriendo, golpeado = false }) {
  if (golpeado) return true;
  if (distancia < 2.4) return true;
  if (distancia < 6.5 && !agachado) return true;
  return distancia < 11 && corriendo;
}
// Pasar de local a mundo: la ruina está girada `rot` y apoyada en (x0, z0).
export function aMundo(p, x0, z0, rot) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return { x: x0 + p.x * c + p.z * s, z: z0 - p.x * s + p.z * c };
}

// ---------------------------------------------------------------- 10. la forja de cristal
export const FORJA = {
  lanzaHielo: { arma: 'lanza', nombre: 'Lanza de hielo', efecto: 'hielo', contra: 'rastreadores y saltadores: los frena en seco' },
  arcoRayo: { arma: 'arco', nombre: 'Flechas de rayo', efecto: 'rayo', contra: 'los grupos: el rayo salta a los que están cerca' },
  hondaEmpuje: { arma: 'honda', nombre: 'Honda de empuje', efecto: 'empuje', contra: 'tiradores y escupidores: los derriba y no pueden apuntar' },
};
export const HIELO = { freno: 2.4, lento: 0.35 };
export const RAYO = { saltos: 2, radio: 6.5, dano: 0.6 };
export const EMPUJE = { retroceso: 3.2, derribo: 1.1 };
// El efecto de un arma, según lo que tengas forjado.
export function efectoDeArma(id, cosas = {}) {
  for (const [clave, f] of Object.entries(FORJA)) if (f.arma === id && cosas[clave]) return f.efecto;
  return null;
}
// El rayo encadenado: a quiénes salta desde el primero, los más cercanos que queden.
export function cadenaDeRayo(desde, candidatos, saltos = RAYO.saltos, radio = RAYO.radio) {
  const elegidos = [];
  let actual = desde;
  const libres = candidatos.slice();
  for (let i = 0; i < saltos; i++) {
    let mejor = -1, d0 = radio;
    libres.forEach((c, j) => { const d = Math.hypot(c.x - actual.x, c.z - actual.z); if (d < d0) { d0 = d; mejor = j; } });
    if (mejor < 0) break;
    const [c] = libres.splice(mejor, 1);
    elegidos.push(c);
    actual = c;
  }
  return elegidos;
}
// ¿Contra quién sirve más? Multiplica el efecto (no el daño): así elegir bien importa.
export function eficacia(efecto, tipo) {
  if (efecto === 'hielo') return tipo === 'rastreador' || tipo === 'saltador' ? 1.5 : tipo === 'jefe' || tipo === 'bruto' ? 0.4 : 1;
  if (efecto === 'empuje') return tipo === 'tirador' || tipo === 'escupidor' ? 1.5 : tipo === 'jefe' || tipo === 'bruto' ? 0.2 : 1;
  return 1;
}
export const clampEfecto = (v) => clamp(v, 0, 5);

// ---------------------------------------------------------------- 11. 4.10 coihue: lugares del valle que toman los duendes
// Desde la noche 3, cada tanto los duendes toman un lugar del valle (la estación, la orilla del lago, el bosque de
// arrayanes: los mismos de las raíces del asedio, `ZONAS_ASEDIO`, y los mismos puntos). El lugar se oscurece, le
// crecen hongos y le baja la bruma; mientras esté tomado no se talan sus árboles ni se pican sus piedras ni se
// juntan los recursos del mapa de ahí, y de noche salen duendes de ese lugar. Cada lugar tomado tiene su nido de
// hongos (ver `desafio-infestacion.js`: el mismo nido, que se quema o se rompe a golpes). Si lo sacás de día, el
// lugar baja un escalón; si lo dejás, el nido se abre de noche y el lugar se cierra un escalón más. Con todos los
// nidos fuera y el lugar en 0, queda recuperado (con premio) y unas noches de respiro. Al empezar el asedio de la
// noche final, las raíces del Coihue ocupan su lugar y esto se cierra.
export const TOMADAS = {
  ids: ['estacion', 'lago', 'bosque'],
  desdeNoche: 3,        // la primera noche en que pueden tomar un lugar
  cadaNoches: 2,        // y una nueva cada tantas noches...
  maxTomadas: 2,        // ...sin pasar de estos a la vez
  nivelMax: 3,          // lo más oscuro que llega
  radio: 18,            // la mancha (metros)
  respiro: 2,           // noches sin que vuelvan a tomarlo
  premio: 2,            // semillas doradas por recuperarlo
  nidoRadio: [3, 11],   // a cuánto del centro crece su nido
};
const NOMBRE_TOMADA = { estacion: 'la estación', lago: 'la orilla del lago', bosque: 'el bosque de arrayanes' };
export const nombreTomada = (id) => (Object.hasOwn(NOMBRE_TOMADA, id) ? NOMBRE_TOMADA[id] : 'el lugar');

// `zonas`: [{ id, x, z }] ya ubicadas (ver `ubicarZonas` de desafio-asedio.js; se ignora la base).
export function valleNuevo(zonas) {
  const lista = (Array.isArray(zonas) ? zonas : []).filter((z) => z && TOMADAS.ids.includes(z.id) && Number.isFinite(Number(z.x)) && Number.isFinite(Number(z.z)));
  const vistas = new Set(), sal = [];
  for (const z of lista) { if (vistas.has(z.id)) continue; vistas.add(z.id); sal.push({ id: z.id, x: Number(z.x), z: Number(z.z), nivel: 0, hasta: 0 }); }
  return sal.length ? { zonas: sal, cerrado: false, tomadas: 0, recuperadas: 0 } : null;
}
export function sanearValle(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v) || !Array.isArray(v.zonas)) return null;
  const fin = (n) => n !== null && n !== '' && typeof n !== 'boolean' && Number.isFinite(Number(n));
  const vistas = new Set(), zonas = [];
  for (const z of v.zonas.slice(0, 8)) {
    if (!z || typeof z !== 'object' || !TOMADAS.ids.includes(z.id) || vistas.has(z.id) || !fin(z.x) || !fin(z.z) || Math.abs(Number(z.x)) > 1e5 || Math.abs(Number(z.z)) > 1e5) continue;
    vistas.add(z.id);
    zonas.push({ id: z.id, x: Number(z.x), z: Number(z.z), nivel: Math.max(0, Math.min(TOMADAS.nivelMax, Math.floor(fin(z.nivel) ? Number(z.nivel) : 0))), hasta: Math.max(0, Math.min(1e6, Math.floor(fin(z.hasta) ? Number(z.hasta) : 0))) });
  }
  if (!zonas.length) return null;
  const cerrado = !!v.cerrado;
  if (cerrado) for (const z of zonas) z.nivel = 0;
  return { zonas, cerrado, tomadas: Math.max(0, Math.min(1e4, Math.floor(fin(v.tomadas) ? Number(v.tomadas) : 0))), recuperadas: Math.max(0, Math.min(1e4, Math.floor(fin(v.recuperadas) ? Number(v.recuperadas) : 0))) };
}
export const zonasTomadasDelValle = (v) => (v && !v.cerrado ? v.zonas.filter((z) => z.nivel > 0) : []);
export function defTomada(v, id) { return v?.zonas?.find((z) => z.id === id) || null; }
// Al amanecer de la noche `noche` (la que viene): ¿toman un lugar? Devuelve los sucesos [{ tipo: 'tomada', id }].
export function tomarAlAmanecer(v, noche, azar = Math.random) {
  if (!v || v.cerrado || noche < TOMADAS.desdeNoche) return [];
  if ((noche - TOMADAS.desdeNoche) % TOMADAS.cadaNoches !== 0 || zonasTomadasDelValle(v).length >= TOMADAS.maxTomadas) return [];
  const libres = v.zonas.filter((z) => z.nivel === 0 && noche >= z.hasta);
  if (!libres.length) return [];
  const z = libres[Math.floor(azar() * libres.length) % libres.length];
  z.nivel = 1;
  v.tomadas = (v.tomadas || 0) + 1;
  return [{ tipo: 'tomada', id: z.id }];
}
// Cuántos nidos le tocan a un lugar tomado: uno, y dos en lo más oscuro.
export const nidosDeZona = (z) => (z.nivel >= TOMADAS.nivelMax ? 2 : z.nivel > 0 ? 1 : 0);
// Un lugar para el nido de la zona (cerca del centro, que `esBueno` lo permita y lejos de los otros nidos).
export function lugarNidoDeZona(z, otros, esBueno = () => true, azar = Math.random) {
  const [r0, r1] = TOMADAS.nidoRadio;
  for (let i = 0; i < 40; i++) {
    const a = azar() * Math.PI * 2, r = r0 + azar() * (r1 - r0), x = z.x + Math.cos(a) * r, zz = z.z + Math.sin(a) * r;
    if (!esBueno(x, zz) || otros.some((c) => Math.hypot(c.x - x, c.z - zz) < 6)) continue;
    return { x: Math.round(x * 10) / 10, z: Math.round(zz * 10) / 10 };
  }
  return null;
}
// El nido de una zona se abrió esa noche (nadie lo sacó): el lugar se cierra un escalón más. Devuelve qué más sale.
export function extraDeZona(z) {
  return z.nivel >= 3 ? ['saltador', 'rastreador'] : z.nivel >= 2 ? ['saltador'] : [];
}
export function abrirseNidoDeZona(v, id) {
  const z = defTomada(v, id);
  if (!z || v.cerrado || z.nivel <= 0) return { ok: false };
  z.nivel = Math.min(TOMADAS.nivelMax, z.nivel + 1);
  return { ok: true, nivel: z.nivel };
}
// Sacaron un nido de la zona (de día); `quedan`: cuántos nidos de esa zona siguen. Sin ninguno, baja un escalón.
export function sacaronNidoDeZona(v, id, quedan, noche = 0) {
  const z = defTomada(v, id);
  if (!z || v.cerrado || z.nivel <= 0) return { ok: false };
  if (quedan > 0) return { ok: true, baja: false, nivel: z.nivel };
  z.nivel -= 1;
  if (z.nivel > 0) return { ok: true, baja: true, nivel: z.nivel };
  z.hasta = noche + TOMADAS.respiro;
  v.recuperadas = (v.recuperadas || 0) + 1;
  return { ok: true, baja: true, nivel: 0, recuperada: true, premio: TOMADAS.premio };
}
// Al empezar el asedio, las raíces del Coihue ocupan su lugar.
export function cerrarValle(v) {
  if (!v) return;
  v.cerrado = true;
  for (const z of v.zonas) z.nivel = 0;
}
// ¿Este punto está en un lugar tomado? Devuelve la zona o null.
export function tomadaEn(v, x, z, margen = 0) {
  for (const q of zonasTomadasDelValle(v)) if (Math.hypot(q.x - x, q.z - z) < TOMADAS.radio + margen) return q;
  return null;
}
// Para el mapa de papel: una mancha por lugar tomado.
export function marcasValle(v) {
  return zonasTomadasDelValle(v).map((z) => ({ x: z.x, z: z.z, nombre: `${nombreTomada(z.id)}, tomada`, clase: 'tomada', radio: TOMADAS.radio, nivel: z.nivel }));
}
export function textoValle(v) {
  const n = zonasTomadasDelValle(v).length;
  return n ? `${n === 1 ? 'Un lugar tomado' : `${n} lugares tomados`}` : '';
}
