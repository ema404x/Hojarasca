// Visitas a tu casa. Si armaste una mesa de campo con al menos dos asientos alrededor
// (sillas o bancos), cada tanto un vecino se da una vuelta a la tarde: llega caminando,
// se queda junto a la mesa, charla un rato y deja algo. Los vecinos se turnan.
//
// Sólo en el Relax. Módulo puro (se prueba en Node).

export const VISITA = {
  cada: 3,        // días entre una visita y la siguiente
  llega: 16,      // a partir de qué hora puede llegar
  ventana: 2,     // horas en las que puede llegar (si no, será otro día)
  seVa: 20,       // a esta hora se vuelve a su casa
  radio: 4.5,     // asientos a esta distancia de la mesa cuentan
  asientos: 2,    // cuántos hacen falta
};

export const MESAS = ['mesa-campo'];
export const ASIENTOS = ['silla-campo', 'banco'];

export const VISITANTES = {
  ramon: {
    regalo: { cuenta: { yerba: 8 } }, textoRegalo: 'Don Ramón te dejó un kilo de yerba',
    charlas: [
      ['Pasaba con la majada y vi la mesa puesta. Uno ve una mesa con bancos y ya sabe que ahí se puede parar.', 'Te traje yerba, que la de uno siempre se acaba el día que menos pensás.'],
      ['Esta casa ya tiene olor a casa. Eso no lo da la madera: lo da el que vive.', 'Tomá, para el mate. No me digas que no.'],
    ],
  },
  nicanor: {
    regalo: { materiales: { tronco: 4 } }, textoRegalo: 'Nicanor te dejó cuatro troncos secos',
    charlas: [
      ['Hoy el lago estaba de vidrio y no picaba nada. Me dije: voy a ver cómo le va al vecino.', 'Te dejé unos troncos secos de la orilla. Para la estufa, que las noches se ponen bravas.'],
      ['Desde el agua se ve el humo de tu casa. Da gusto saber que hay alguien del otro lado.', 'Los troncos los junté a la mañana. Ya están secos.'],
    ],
  },
  ema: {
    regalo: { cuenta: { 'semillas-habas': 3 } }, textoRegalo: 'Ema te dejó semillas de habas',
    charlas: [
      ['Estaba haciendo el recorrido y dije: paso a saludar. ¡Qué linda te quedó la mesa!', 'Te traje semillas de habas del vivero del parque. Se dan bien en esta tierra.'],
      ['Vi rastros de huemul cerca del arroyo. Si los ves, no te acerques mucho: son pocos y se asustan.', 'Las semillas son de las que guardamos para repartir. Plantalas en otoño.'],
    ],
  },
  ercilia: {
    regalo: { cuenta: { harina: 4 } }, textoRegalo: 'Ercilia te dejó un kilo de harina',
    charlas: [
      ['Cerré un rato el almacén. Si alguien necesita algo, que espere: también una tiene derecho a visitar.', 'Te traje harina. Con un huevo y un fuego, torta frita. No hay nada más fácil.'],
      ['Mirá lo que es esta mesa. Cuando éramos chicos, en una mesa así comíamos doce.', 'La harina es de la buena, de la que viene en el tren de los jueves.'],
    ],
  },
};
export const ORDEN = ['ramon', 'nicanor', 'ema', 'ercilia'];

export function visitasNuevas() { return { ultima: 0, cuenta: 0, activa: null }; }
export function sanearVisitas(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return visitasNuevas();
  const n = (x) => Math.max(0, Math.floor(Number(x) || 0));
  const a = v.activa;
  const activa = a && VISITANTES[a.clave] ? { clave: a.clave, dia: n(a.dia), charlo: !!a.charlo } : null;
  return { ultima: n(v.ultima), cuenta: n(v.cuenta), activa };
}

// La mesa con sus asientos alrededor, o null. `muebles`: [{ id, x, z }] terminados.
export function mesaPuesta(muebles = []) {
  for (const m of muebles) {
    if (!MESAS.includes(m.id)) continue;
    const alrededor = muebles.filter((a) => ASIENTOS.includes(a.id) && Math.hypot(a.x - m.x, a.z - m.z) <= VISITA.radio);
    if (alrededor.length >= VISITA.asientos) return { mesa: { x: m.x, z: m.z }, asientos: alrededor.map((a) => ({ x: a.x, z: a.z })) };
  }
  return null;
}

export const quienViene = (cuenta) => ORDEN[Math.floor(Number(cuenta) || 0) % ORDEN.length];

// ¿Llega alguien ahora? Hace falta la mesa puesta, que haya pasado el tiempo y la hora.
export function tocaVisita(v, dia, horas, hayMesa) {
  if (!hayMesa || v.activa) return false;
  if (v.ultima && dia - v.ultima < VISITA.cada) return false;
  return horas >= VISITA.llega && horas < VISITA.llega + VISITA.ventana;
}
export function empezarVisita(v, dia) {
  v.activa = { clave: quienViene(v.cuenta), dia, charlo: false };
  return v.activa;
}
// ¿Ya es hora de irse? Se va a la noche, o si cambió el día (dormiste).
export const seVa = (v, dia, horas) => !!v.activa && (v.activa.dia !== dia || horas >= VISITA.seVa);
export function terminarVisita(v, dia) {
  v.ultima = v.activa?.dia || dia;
  v.cuenta += 1;
  v.activa = null;
}

export function charlaDeVisita(clave, cuenta) {
  const c = VISITANTES[clave]?.charlas || [];
  return c.length ? c[Math.floor((Number(cuenta) || 0) / ORDEN.length) % c.length] : [];
}

// Desde dónde llega: a treinta metros de la mesa, del lado contrario a donde estás.
export function puntoDeLlegada(mesa, jugador, dist = 30) {
  let dx = mesa.x - jugador.x, dz = mesa.z - jugador.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.01) { dx = 1; dz = 0; } else { dx /= d; dz /= d; }
  return { x: mesa.x + dx * dist, z: mesa.z + dz * dist };
}
// Dónde se queda: al lado del primer asiento, del lado de afuera de la mesa.
export function lugarEnLaMesa(puesta) {
  const a = puesta.asientos[0];
  const dx = a.x - puesta.mesa.x, dz = a.z - puesta.mesa.z, d = Math.hypot(dx, dz) || 1;
  return { x: a.x + (dx / d) * 0.6, z: a.z + (dz / d) * 0.6 };
}
