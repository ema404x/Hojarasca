// Jugar con joystick (tipo Xbox) vía la Gamepad API. Todo lo que piensa está en
// funciones puras (se prueban en Node); lo único que toca el navegador es `crearMando`,
// y recién cuando se lo llama: al importar el módulo no se toca nada.

// Botón del mando (numeración estándar del navegador) para cada acción del juego.
// Se puede pisar cualquiera desde `opciones.botones`.
export const BOTONES_MANDO = {
  saltar: 0,            // A
  agacharse: 1,         // B
  interactuar: 2,       // X
  linterna: 3,          // Y
  objetoAnterior: 4,    // L1 / LB
  objetoSiguiente: 5,   // R1 / RB
  bloquear: 6,          // L2 / LT (gatillo)
  atacar: 7,            // R2 / RT (gatillo)
  guia: 8,              // Ver / Back
  pausa: 9,             // Menú / Start
  correr: 10,           // apretar el stick izquierdo (L3)
  esquivar: 11,         // apretar el stick derecho (R3)
  mochila: 12,          // cruceta arriba
  taller: 13,           // cruceta abajo
  planos: 14,           // cruceta izquierda
  mapa: 15,             // cruceta derecha
};

// Cómo se llama cada botón cuando hay que mostrarlo en pantalla.
export const NOMBRES_BOTONES = ['A', 'B', 'X', 'Y', 'L1', 'R1', 'L2', 'R2', 'Ver', 'Menú', 'L3', 'R3', 'Cruceta ↑', 'Cruceta ↓', 'Cruceta ←', 'Cruceta →', 'Guía'];

export const ACCIONES_MANDO = Object.keys(BOTONES_MANDO);

// Los gatillos son analógicos: recién cuentan como apretados pasado el umbral.
export const OPCIONES_MANDO = {
  zonaMuerta: 0.18,        // stick izquierdo (caminar)
  zonaMuertaMirada: 0.14,  // stick derecho (mirar)
  sensibilidad: 1,         // aparte de la del mouse
  exponente: 2,            // curva de respuesta de la mirada (cuadrática)
  invertirY: false,
  umbralGatillo: 0.5,
};

export const VELOCIDAD_MIRADA = 2.6;   // radianes por segundo a fondo de stick

const limitar = (v, a, b) => (v < a ? a : v > b ? b : v);

// Zona muerta redonda: el stick apenas movido queda quieto y el resto se reparte
// de 0 a 1 otra vez, así no hay un salto al salir de la zona muerta.
export function zonaMuertaRadial(x, y, zm = OPCIONES_MANDO.zonaMuerta) {
  return zonaMuertaEn({ x: 0, y: 0, fuerza: 0 }, x, y, zm);
}
// 2.7.3: la misma cuenta, escrita en `d` (mapearMando la usa sin armar objetos por cuadro)
function zonaMuertaEn(d, x, y, zm = OPCIONES_MANDO.zonaMuerta) {
  const ex = Number.isFinite(x) ? x : 0, ey = Number.isFinite(y) ? y : 0;
  const m = Math.hypot(ex, ey);
  // 2.6.1: una zona muerta que no es número (ajuste roto) dejaba el stick muerto (NaN)
  const z = limitar(Number.isFinite(zm) ? zm : OPCIONES_MANDO.zonaMuerta, 0, 0.95);
  if (m <= z || m === 0) { d.x = 0; d.y = 0; d.fuerza = 0; return d; }
  const fuerza = limitar((m - z) / (1 - z), 0, 1);
  d.x = (ex / m) * fuerza; d.y = (ey / m) * fuerza; d.fuerza = fuerza;
  return d;
}
const izqCuadro = { x: 0, y: 0, fuerza: 0 }, derCuadro = { x: 0, y: 0, fuerza: 0 };

// Curva de respuesta: cerca del centro apenas se mueve, a fondo va entero.
export function curvaMirada(v, exponente = OPCIONES_MANDO.exponente) {
  const e = Number.isFinite(exponente) && exponente > 0 ? exponente : 1;
  return Math.sign(v) * Math.pow(Math.abs(v), e);
}

function eje(axes, i) {
  const v = Array.isArray(axes) ? Number(axes[i]) : NaN;
  return Number.isFinite(v) ? limitar(v, -1, 1) : 0;
}

// Un botón crudo puede venir como {pressed, value}, como número suelto o no venir.
function apretado(botones, i, umbral) {
  const b = Array.isArray(botones) ? botones[i] : undefined;
  if (b === undefined || b === null) return false;
  if (typeof b === 'number') return b >= umbral;
  if (typeof b.value === 'number' && !b.pressed) return b.value >= umbral;
  return !!b.pressed;
}

const enFalso = () => { const o = {}; for (const a of ACCIONES_MANDO) o[a] = false; return o; };
const NADA_APRETADO = Object.freeze(enFalso());   // 2.7.3: sólo se lee

// 2.7.3: una opción propia (aunque valga undefined) le gana a la de fábrica, igual que con
// `{ ...OPCIONES_MANDO, ...opciones }`, pero sin copiar objetos en cada cuadro.
const propia = (o, k) => Object.prototype.propertyIsEnumerable.call(o, k);
const opcion = (opciones, k) => (propia(opciones, k) ? opciones[k] : OPCIONES_MANDO[k]);

// Deja `e` (armado por estadoVacio) como recién hecho.
function vaciar(e) {
  e.conectado = false; e.nombre = '';
  e.mov.x = 0; e.mov.z = 0; e.fuerzaMov = 0;
  e.mirada.x = 0; e.mirada.y = 0;
  for (const a of ACCIONES_MANDO) { e.activos[a] = false; e.recien[a] = false; e.soltados[a] = false; }
  return e;
}

export function estadoVacio() {
  return {
    conectado: false, nombre: '',
    mov: { x: 0, z: 0 }, fuerzaMov: 0,
    mirada: { x: 0, y: 0 },
    activos: enFalso(), recien: enFalso(), soltados: enFalso(),
  };
}

// EL CORAZÓN, y es puro: ejes y botones crudos + estado anterior → estado del cuadro.
// `crudo` es un objeto tipo Gamepad ({ axes:[...], buttons:[{pressed}] }) o null si no hay mando.
// 2.7.3: `destino` (opcional, un estado armado por estadoVacio y distinto de `previo`) se
// rellena en vez de armar uno nuevo; sin él, devuelve siempre un estado nuevo, como antes.
export function mapearMando(crudo, previo = estadoVacio(), opciones = {}, destino = null) {
  const extra = opciones.botones || {};
  const antes = previo && previo.activos ? previo.activos : NADA_APRETADO;
  const salida = destino ? vaciar(destino) : estadoVacio();
  if (!crudo || crudo.connected === false) {
    // Sin mando: todo en cero, pero los botones que estaban apretados se dan por soltados.
    for (const a of ACCIONES_MANDO) salida.soltados[a] = !!antes[a];
    return salida;
  }
  salida.conectado = true;
  salida.nombre = String(crudo.id || '').trim();

  // Stick izquierdo: caminar. El eje Y viene al revés (arriba = -1) y adelante es z positivo.
  const izq = zonaMuertaEn(izqCuadro, eje(crudo.axes, 0), eje(crudo.axes, 1), opcion(opciones, 'zonaMuerta'));
  salida.mov.x = izq.x || 0;
  salida.mov.z = -izq.y || 0;   // el `|| 0` es para no devolver -0
  salida.fuerzaMov = izq.fuerza;

  // Stick derecho: mirar, con curva y con su propia sensibilidad (la del mouse no lo toca).
  const der = zonaMuertaEn(derCuadro, eje(crudo.axes, 2), eje(crudo.axes, 3), opcion(opciones, 'zonaMuertaMirada'));
  const sensibilidad = opcion(opciones, 'sensibilidad'), exponente = opcion(opciones, 'exponente');
  const sens = Number.isFinite(sensibilidad) ? sensibilidad : 1;
  salida.mirada.x = curvaMirada(der.x, exponente) * sens || 0;
  salida.mirada.y = curvaMirada(der.y, exponente) * sens * (opcion(opciones, 'invertirY') ? -1 : 1) || 0;

  // Botones, con flancos: no es lo mismo "está apretado" que "recién se apretó".
  const umbral = opcion(opciones, 'umbralGatillo');
  for (const a of ACCIONES_MANDO) {
    const i = propia(extra, a) ? extra[a] : BOTONES_MANDO[a];
    const ahora = Number.isInteger(i) && i >= 0 ? apretado(crudo.buttons, i, umbral) : false;
    salida.activos[a] = ahora;
    salida.recien[a] = ahora && !antes[a];
    salida.soltados[a] = !ahora && !!antes[a];
  }
  return salida;
}

// Cómo mostrar una acción en la interfaz cuando hay mando enchufado.
export function textoBoton(accion, botones = BOTONES_MANDO) {
  const i = botones[accion];
  return Number.isInteger(i) && NOMBRES_BOTONES[i] ? NOMBRES_BOTONES[i] : '';
}

// Aplica la mirada del stick al estado del jugador (mismos signos y tope que el mouse).
export function girarMirada(estado, mirada, dt, opciones = {}) {
  const vel = Number.isFinite(opciones.velocidad) ? opciones.velocidad : VELOCIDAD_MIRADA;
  if (!mirada || (!mirada.x && !mirada.y)) return estado;
  estado.yaw -= mirada.x * vel * dt;
  estado.pitch = limitar(estado.pitch - mirada.y * vel * dt, -1.45, 1.45);
  return estado;
}

// Lo único que mira el navegador, y sólo cuando se lo llama.
function primerMando() {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
  let lista;
  try { lista = navigator.getGamepads(); } catch { return null; }
  if (!lista) return null;
  // 2.6.1: primero uno con el mapeo estándar: un volante o un auricular que Windows
  // anuncia como mando le ganaba el lugar al joystick de verdad
  let otro = null;
  for (const g of lista) {
    if (!g || g.connected === false || !Array.isArray(g.axes)) continue;
    if (g.mapping === 'standard') return g;
    if (!otro) otro = g;
  }
  return otro;
}

// `opciones` se guarda tal cual: se le puede cambiar la sensibilidad o la zona muerta en caliente.
export function crearMando(opciones = {}) {
  let estado = estadoVacio();
  // 2.7.3: dos estados que se turnan: cada cuadro se escribe el que no es el anterior
  // (el que devolvió `actualizar` vale hasta el cuadro siguiente, que es lo que se usa)
  const turnos = [estadoVacio(), estadoVacio()];
  // Se consulta en cada cuadro (y no al crear el mando) para poder cambiar de
  // fuente en caliente: así las pruebas pueden enchufar un joystick de mentira.
  const leer = () => (typeof opciones.leerCrudo === 'function' ? opciones.leerCrudo() : primerMando());
  return {
    opciones,
    // Una vez por cuadro, antes de mover al jugador.
    actualizar() { estado = mapearMando(leer(), estado, opciones, estado === turnos[0] ? turnos[1] : turnos[0]); return estado; },
    estado: () => estado,
    hayMando: () => estado.conectado,
    nombre: () => estado.nombre,
    activo: (a) => !!estado.activos[a],
    recien: (a) => !!estado.recien[a],
    soltado: (a) => !!estado.soltados[a],
    boton: (a) => textoBoton(a, { ...BOTONES_MANDO, ...(opciones.botones || {}) }),
    // Al volver de una pausa o de un menú conviene olvidar lo anterior: nada queda apretado.
    olvidar() { estado = estadoVacio(); },
  };
}
