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
