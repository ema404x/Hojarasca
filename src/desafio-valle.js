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
//   9. Restos de nave para explorar: pasillos, trampas que todavía funcionan, invasores
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

// ---------------------------------------------------------------- 9. restos para explorar
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
