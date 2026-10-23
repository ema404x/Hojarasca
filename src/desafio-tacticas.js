// 4.8: las tácticas en grupo de los duendes (módulo puro: sin THREE ni DOM; se prueba en Node).
//
// Dos reglas simples, para que se entienda lo que pasa:
//   · DISTRACCIÓN. Desde la noche 3, unos pocos (los señuelos) entran por otro lado, hacen bulla y se
//     dejan ver, y se ensañan con una defensa lejana; el resto del grupo entra por el lado principal un
//     rato después. Si te les acercás o se les acaba el tiempo, dejan el juego y van por vos.
//   · RODEO. Desde la noche 3, cuando varios duendes se topan con una defensa y uno ya la está rompiendo,
//     los demás dan la vuelta por los costados en vez de amontonarse de frente (probando como mucho
//     dos veces; los pesados y los de tiro no, ellos siguen a lo suyo).
// Todo escala con la noche; nada de esto agrega duendes: sólo cambia por dónde y cuándo vienen.

export const SENUELOS = ['rastreador', 'saltador', 'tirador'];   // quiénes pueden ser señuelo (en este orden de preferencia)
export const DISTRACCION = {
  desdeNoche: 3,
  minTotal: 6,          // con menos duendes que esto no tiene sentido dividirlos
  fraccion: 0.3,        // qué parte de los que pueden ser señuelo lo son
  minimo: 2, maximo: 6,
  retraso: [5, 9],      // segundos que espera el grupo principal después del último señuelo (más cuanto más noche)
  tiempo: [20, 40],     // segundos que juegan al señuelo (después van por vos)
  seDeja: 16,           // si te les acercás a menos de esto (m), se terminó el juego
  ruidoCada: [2.2, 3.8],// segundos entre una risita y otra (de a uno del grupo)
  obraMaxima: 70,       // la defensa que eligen tiene que estar a menos de esto de su entrada
  obraMinima: 20,       // y a más de esto de vos (si no, no es una defensa «lejana»)
  tropiezo: 35,         // el punto de ruido, a esta distancia de la base (m), si no hay una defensa
};
const lerp = (a, b, t) => a + (b - a) * t;
const acotar = (t) => Math.min(1, Math.max(0, t));
// Cuánto de la escala [a, b] según la noche (de la 3 a la 12)
export const escalaNoche = (n, rango) => lerp(rango[0], rango[1], acotar((Math.floor(Number(n) || 1) - DISTRACCION.desdeNoche) / 9));

// ¿Esta noche hay distracción? `ctx`: { noche, total, hayOtroLado, jefe, final, especial }.
export function hayDistraccion({ noche = 1, total = 0, hayOtroLado = false, jefe = false, final = false, especial = null } = {}) {
  const n = Math.floor(Number(noche) || 1);
  if (!hayOtroLado || jefe || final || n < DISTRACCION.desdeNoche || total < DISTRACCION.minTotal) return false;
  // la silenciosa son tiradores quietos y el apagón es de por sí un caos: sin más complicaciones
  return especial !== 'silenciosa' && especial !== 'apagon';
}
// Quiénes de la lista son señuelos. Devuelve la lista de tipos con la marca `:s` en los señuelos y los
// señuelos PRIMERO (bajan antes: arman la bulla mientras el resto espera). Los demás siguen en su orden.
export const MARCA_SENUELO = ':s';
export function repartirGrupos(tipos, noche) {
  const elegibles = tipos.filter((t) => SENUELOS.includes(t));
  const cuantos = Math.max(DISTRACCION.minimo, Math.min(DISTRACCION.maximo, Math.round(elegibles.length * DISTRACCION.fraccion)));
  // un señuelo por vez, empezando por el tipo de más preferencia (los pillos hacen más ruido que nadie)
  const tomados = [];
  for (const tipo of SENUELOS) for (let i = 0; i < tipos.length && tomados.length < cuantos; i++) if (tipos[i] === tipo && !tomados.includes(i)) tomados.push(i);
  if (tomados.length < DISTRACCION.minimo) return { lista: tipos.slice(), senuelos: 0 };
  const sen = tomados.map((i) => tipos[i] + MARCA_SENUELO);
  const resto = tipos.filter((_, i) => !tomados.includes(i));
  void noche;
  return { lista: [...sen, ...resto], senuelos: sen.length };
}
// El elemento de la cola de bajada: 'rastreador:s' → { tipo: 'rastreador', senuelo: true }.
export function partirItem(item) {
  const s = String(item);
  return s.endsWith(MARCA_SENUELO) ? { tipo: s.slice(0, -MARCA_SENUELO.length), senuelo: true } : { tipo: s, senuelo: false };
}
// Cuánto espera la cola antes de bajar el que sigue: normal (0,55 s), y si el que bajó era señuelo y
// el que sigue no, el retraso del grupo principal.
export function ritmoDeBajada(itemQueBajo, itemQueSigue, noche) {
  const normal = 0.55;
  if (itemQueSigue === undefined) return normal;
  const antes = partirItem(itemQueBajo).senuelo, sigue = partirItem(itemQueSigue).senuelo;
  return antes && !sigue ? escalaNoche(noche, DISTRACCION.retraso) : normal;
}
// Cuánto dura el juego del señuelo esta noche, y cada cuánto hacen bulla.
export const tiempoDeSenuelo = (noche) => escalaNoche(noche, DISTRACCION.tiempo);
export const esperaDeRuido = (azar = Math.random()) => lerp(DISTRACCION.ruidoCada[0], DISTRACCION.ruidoCada[1], acotar(azar));
// ¿Termina el juego? (se acabó el tiempo, se te acercaron o ya no tiene a qué pegarle)
export function terminaSenuelo({ t, tiempo, distanciaAlJugador, conBlanco = true }) {
  return t >= tiempo || distanciaAlJugador < DISTRACCION.seDeja || !conBlanco;
}
// A qué le pegan: de las defensas (`{ x, z }`) la más cercana a su entrada que sirva (ni muy lejos de su
// entrada ni pegada a vos). Sin ninguna, un punto de ruido a `tropiezo` m de la base hacia su lado.
export function blancoDelSenuelo(entrada, base, jugador, defensas) {
  let mejor = null, dm = Infinity;
  for (const o of defensas) {
    const d = Math.hypot(o.x - entrada.x, o.z - entrada.z);
    if (d > DISTRACCION.obraMaxima || Math.hypot(o.x - jugador.x, o.z - jugador.z) < DISTRACCION.obraMinima) continue;
    if (d < dm) { dm = d; mejor = o; }
  }
  if (mejor) return { tipo: 'obra', obra: mejor, x: mejor.x, z: mejor.z };
  const dx = entrada.x - base.x, dz = entrada.z - base.z, l = Math.hypot(dx, dz) || 1;
  return { tipo: 'punto', obra: null, x: base.x + (dx / l) * DISTRACCION.tropiezo, z: base.z + (dz / l) * DISTRACCION.tropiezo };
}

// ---------------------------------------------------------------- rodear
export const RODEO = {
  desdeNoche: 3,
  vecinos: 2,           // al menos tantos más a menos de `radio` (un grupo de tres o más)
  radio: 5,
  tiempo: 3.2,          // segundos que dan la vuelta
  veces: 2,             // como mucho, dos intentos por duende
  giro: 1.25,           // rad de desvío respecto del rumbo al blanco (~70°)
};
// ¿Este duende rodea la defensa en vez de chocarla? `e`: { noche, vecinos (cuántos otros cerca), rompiendo (cuántos
// la están rompiendo ya), veces (cuántas ya rodeó), pesado, aDistancia, jefe }.
export function debeRodear({ noche = 1, vecinos = 0, rompiendo = 0, veces = 0, pesado = false, aDistancia = false, jefe = false } = {}) {
  if (pesado || aDistancia || jefe) return false;
  if (Math.floor(Number(noche) || 1) < RODEO.desdeNoche) return false;
  return rompiendo >= 1 && vecinos >= RODEO.vecinos && veces < RODEO.veces;
}
// Para qué lado: cada duende tiene el suyo (`sentido` -1/1); los que rodean la segunda vez cambian de lado.
export const sentidoDeRodeo = (sentido, veces) => (veces % 2 === 0 ? sentido : -sentido) < 0 ? -1 : 1;
export const desvioDeRodeo = (sentido, veces) => sentidoDeRodeo(sentido, veces) * RODEO.giro;
