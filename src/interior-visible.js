// 4.23.0 (C): no dibujar el exterior desde adentro de una casa. Reglas puras (sin three ni DOM): cuándo la cámara está
// adentro de un edificio cerrado de la aldea y no se ve nada de afuera, y qué gente queda afuera de sus paredes.
//
// La auditoría de la 4.20.0 midió que adentro de la casa de té, la cantina o la panadería la placa seguía dibujando el terreno, el pasto y
// lo instanciado de afuera (29 a 30 ms de placa a 1080p con un cuarto chico, contra 22 a 25 en la plaza). Entre las cuatro paredes y con
// los vidrios cerrados (los vidrios de la aldea son opacos: devuelven el cielo) no se ve nada de eso. Lo único que deja ver para afuera es
// una puerta: la hoja de las puertas de la aldea se dibuja abierta contra la jamba aunque su estado (`abierta`) sea 0 (se midió: la
// cantina y la seccional, con `abierta: 0`, dejan ver el valle por el vano), así que CUALQUIER puerta que caiga adentro de lo que mira la
// cámara cuenta como abierta y se dibuja todo como siempre.

// Edificios que no son un cuarto cerrado, aunque la cámara esté entre sus paredes: la torreta del observatorio se abre al cielo, el
// varadero tiene el portón abierto con los rieles al frente y el taller del tren es un galpón con portones grandes.
export const EDIFICIOS_ABIERTOS = new Set(['observatorio', 'varadero', 'taller-tren']);

// Cuánto se agranda (en radianes) el medio ángulo horizontal del cuadro para decidir que una puerta «cae a la vista»: el giro de un cuadro,
// el ancho de la puerta misma y el giro de la hoja.
export const MARGEN_VISTA = 0.25;
// Pegado a una puerta (menos de tantos metros) siempre se dibuja todo: el borde del cuadro la alcanza aunque mires para otro lado.
export const PEGADO_A_LA_PUERTA_M = 1.2;
// Mirando casi derecho para arriba o para abajo la dirección en planta no dice nada: se dibuja todo (largo de la mira en planta, de 0 a 1).
export const MIRA_PLANA_MINIMA = 0.3;

// El coseno desde el que una puerta cuenta como «a la vista», según el campo de visión vertical (en grados) y la proporción de la pantalla.
export function cosVistaDe(fovGrados, aspecto) {
  const f = Number.isFinite(fovGrados) && fovGrados > 1 ? fovGrados : 70, a = Number.isFinite(aspecto) && aspecto > 0.2 ? aspecto : 16 / 9;
  const mitad = Math.atan(Math.tan((f * Math.PI) / 360) * a) + MARGEN_VISTA;
  return mitad >= Math.PI / 2 ? -1 : Math.cos(mitad);
}

// Una puerta, ¿cae en lo que mira la cámara? `cam` y `mira` en planta ({ x, z }; `mira` unitario o no), `puertas` = [{ x, z }], `cosVista` de cosVistaDe.
export function puertaALaVista(cam, mira, puertas, cosVista) {
  if (!puertas || !puertas.length) return false;
  const ml = Math.hypot(mira.x, mira.z);
  if (!(ml > MIRA_PLANA_MINIMA)) return true;
  for (let i = 0; i < puertas.length; i++) {
    const p = puertas[i];
    const dx = p.x - cam.x, dz = p.z - cam.z, d = Math.hypot(dx, dz);
    if (d < PEGADO_A_LA_PUERTA_M) return true;
    if ((dx * mira.x + dz * mira.z) / (d * ml) > cosVista) return true;
  }
  return false;
}

// ¿Se apaga el exterior en este cuadro? `interior` = el edificio cerrado donde está la cámara (null si está afuera).
export function apagarExteriorAhora(interior, cam, mira, cosVista) {
  if (!interior) return false;
  if (EDIFICIOS_ABIERTOS.has(interior.id)) return false;
  // (sin ninguna puerta registrada —la herrería, la carpintería— el frente es un hueco: no se sabe por dónde se ve para afuera)
  if (!interior.puertas || !interior.puertas.length) return false;
  return !puertaALaVista(cam, mira, interior.puertas, cosVista);
}

// La gente que queda afuera de las paredes del edificio donde está la cámara (centro `interior.x/z`, `interior.radio` = media diagonal + 2 m).
export function quedaAfuera(g, interior) {
  return Math.hypot(g.x - interior.x, g.z - interior.z) > interior.radio;
}

// Un cuarto cerrado que no es un edificio de la aldea sino una estructura del valle puesta en la aldea (la casa de té): una caja girada
// `c` = { id, x, z, y, rot, ancho, fondo, alto, frente: [[a, b], ...] }, con `frente` = los puntos del lado de la puerta y del ventanal, en el
// marco de la caja (a = a lo ancho, b = a lo hondo; +b es el frente). La conversión es la de estructuras.js (`w`). `salida` = { puertas: [{ x, z } × frente.length] } se
// reusa (sin basura por cuadro). Devuelve `salida` (con id, x, z, radio y las puertas en el mundo) si `cam` está entre las paredes, o null.
export function interiorDeCaja(cam, c, salida) {
  if (!c || !salida) return null;
  const dx = cam.x - c.x, dz = cam.z - c.z, cs = Math.cos(c.rot), sn = Math.sin(c.rot);
  const a = dx * cs - dz * sn, b = dx * sn + dz * cs;
  if (!(Math.abs(a) < c.ancho / 2 - 0.1 && Math.abs(b) < c.fondo / 2 - 0.1)) return null;
  if (Number.isFinite(cam.y) && (cam.y < c.y - 1 || cam.y > c.y + c.alto)) return null;
  salida.id = c.id; salida.x = c.x; salida.z = c.z; salida.radio = Math.hypot(c.ancho, c.fondo) / 2 + 2;
  if (!salida.puertas || salida.puertas.length !== c.frente.length) salida.puertas = c.frente.map(() => ({ x: 0, z: 0 }));
  for (let i = 0; i < c.frente.length; i++) {
    const [pa, pb] = c.frente[i], p = salida.puertas[i];
    p.x = c.x + pa * cs + pb * sn; p.z = c.z - pa * sn + pb * cs;
  }
  return salida;
}

// ---------------------------------------------------------------- 4.26.0 (C): los interiores del valle y las casas del jugador
// La misma regla, para el refugio, las cabañas (la del Pescador y el Puesto Alto), el almacén y las casas prefabricadas del jugador. Cada
// abertura (puerta o ventana con hueco de verdad) es un tramo en el marco de la caja; se lo convierte en puntos cada `PASO_ABERTURA_M` como
// mucho, para que una ventana ancha vista de cerca no se escape entre dos puntos (el margen de la vista es de 14 grados). Las ventanas se
// cuentan como abiertas aunque tengan vidrio o postigos: los vidrios del valle son planos sin transparencia, pero entre el vidrio y los troncos
// queda luz, y es más barato dibujar todo que arriesgar un hueco al exterior.

// Las estructuras del valle con cuarto cerrado (claves de T.lugares; estructuras.js les pone `ancho`, `fondo`, `alto` y `aberturas`).
export const LUGARES_CERRADOS = ['refugio', 'cabana', 'puesto', 'almacen'];
// Las casas prefabricadas del jugador que son un cuarto cerrado con una sola salida: la puerta del frente (−z, en el centro). Las ventanas de
// estas casas son cajas opacas sobre la pared entera (planos-casas.js, `ventana`), así que no cuentan. Quedan afuera a propósito: el quincho
// (frente abierto), la galería cerrada (sin pared de atrás), las habitaciones del sistema modular (el techo modular deja los hastiales abiertos
// y las ventanas modulares son huecos de verdad con postigos) y, por la prueba de equivalencia de imagen, la casilla (los hastiales entre la
// pared y el techo quedan abiertos), el puesto de troncos (entre tronco y tronco se ve afuera) y el taller anexo, la buhardilla y la planta
// alta (en las esquinas de sus paredes de tablas queda una rendija de un píxel por la que se ve afuera).
export const CASAS_CERRADAS = new Set(['cabana-piedra', 'casa-galeria', 'casona', 'dormitorio-anexo', 'despensa-anexa',
  'cocina-ampliada', 'bodega-piedra', 'salon-grande', 'torreon-piedra']);
// Hasta dónde llegan las paredes, desde el pie de la obra: en las casas de planos-casas.js Y0 + alto − 0,35 = alto + 0,25. Arriba de eso la
// cámara ya está en el techo (o afuera).
export const TOPE_CASAS = 0.25;
// El vano de la puerta de las casas prefabricadas (planos-casas.js: PUERTA = 1,04; la casilla 1,02; el puesto 0,95), con las jambas.
export const MEDIO_VANO_CASAS = 0.6;
export const PASO_ABERTURA_M = 0.5;

// Los puntos de un tramo [a0, b0, a1, b1] (en el marco de la caja), cada `paso` metros como mucho, con las dos puntas.
export function puntosDeAbertura(t, paso = PASO_ABERTURA_M) {
  const [a0, b0, a1, b1] = t, largo = Math.hypot(a1 - a0, b1 - b0), n = Math.max(1, Math.ceil(largo / paso));
  const puntos = [];
  for (let i = 0; i <= n; i++) puntos.push([a0 + ((a1 - a0) * i) / n, b0 + ((b1 - b0) * i) / n]);
  return puntos;
}

// La caja de una estructura del valle (`l` = T.lugares[clave]), o null si le falta algo (no se adivina).
export function cajaDeLugar(clave, l) {
  if (!l || !Number.isFinite(l.x) || !Number.isFinite(l.z) || !Number.isFinite(l.y) || !(l.ancho > 0) || !(l.fondo > 0) || !(l.alto > 0)) return null;
  if (!Array.isArray(l.aberturas) || !l.aberturas.length) return null;
  const frente = [];
  for (const t of l.aberturas) frente.push(...puntosDeAbertura(t));
  return { id: clave, x: l.x, z: l.z, y: l.y, rot: l.rot || 0, ancho: l.ancho, fondo: l.fondo, alto: l.alto, frente };
}

// La caja de una casa del jugador: `o` = { id (el plano), x, z, y (el pie de la obra), rot, ancho, fondo, alto (del plano) }, o null si no es
// una casa cerrada de la lista. La puerta está en el centro del frente (−z local, el marco de construccion.js, que es el mismo de la caja).
export function cajaDeCasa(o) {
  if (!o || !CASAS_CERRADAS.has(o.id) || !Number.isFinite(o.x) || !Number.isFinite(o.z) || !Number.isFinite(o.y) || !(o.ancho > 0) || !(o.fondo > 0) || !(o.alto > 0)) return null;
  const frente = puntosDeAbertura([-MEDIO_VANO_CASAS, -o.fondo / 2, MEDIO_VANO_CASAS, -o.fondo / 2]);
  return { id: 'obra-' + o.id, x: o.x, z: o.z, y: o.y, rot: o.rot || 0, ancho: o.ancho, fondo: o.fondo, alto: o.alto + TOPE_CASAS, frente };
}
