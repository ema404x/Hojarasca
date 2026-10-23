// 4.9 aliados: los vecinos que ayudan en las noches grandes (módulo puro: sin three ni DOM; se prueba en Node).
//
// Hasta la 4.8 los aliados del Desafío eran el perro, Don Ramón (arregla) y Josefina (flechas), que se suman a tu base
// por las noches que aguantaste (`COMPANEROS`, desafio-reglas.js). Ahora, en las NOCHES GRANDES (`esNocheGrande`: la del jefe,
// las especiales y desde la 12), cuatro vecinos de la aldea se suman a la noche según su NIVEL DE AYUDA (0, 1 o 2):
//
//   · Anselmo (el herrero) arregla las defensas rotas con su martillo, yendo de una a otra.
//   · La abuela Herminia prende fogones y faroles alrededor de la base: los duendes VIEJOS no se acercan a menos de N metros
//     de uno prendido (los traviesos no les hacen caso).
//   · Martín pasa con la trochita tocando el silbato y dispersa a los traviesos que andan cerca de la vía. Sólo si la base queda
//     a menos de 120 m de la vía; si no, pasa igual por el valle y el silbato se oye, sin efecto.
//   · Los chicos tiran piedras con hondas desde la empalizada, sin correr peligro: ni reciben daño ni nadie los alcanza.
//
// El nivel de ayuda lo manda la aldea de día (los pedidos que cumplís lo suben): es del agente «días»
// (`D().aldea.ayuda[clave]`, desafio-aldea.js). Acá se lee con `nivelDeAyuda`; si ese estado todavía no existe, el respaldo es 1
// para todos (AL JUNTAR: cambiar el cuerpo de `nivelDeAyuda` por `nivelAyuda(d, clave)` de desafio-aldea.js).
// Con nivel 0 no vienen, con 1 ayudan y con 2 ayudan más fuerte: tres números simples por vecino (las tablas de abajo).

export const NIVEL_MAX = 2;
export const VECINOS = ['anselmo', 'herminia', 'martin', 'chicos'];
export const NOMBRE_VECINO = { anselmo: 'Anselmo', herminia: 'la abuela Herminia', martin: 'Martín', chicos: 'los chicos' };
// Quién es cada cuerpo que se ve en la base (Martín va en la trochita: no tiene).
export const CUERPOS = {
  anselmo: { vecino: 'anselmo', tabla: 'poblador', ficha: 'herrero', clave: 'poblador-herrero' },
  herminia: { vecino: 'herminia', tabla: 'vecino', ficha: 'abuela', clave: 'aldea-abuela' },
  nene: { vecino: 'chicos', tabla: 'vecino', ficha: 'nene', clave: 'aldea-nene' },
  nena: { vecino: 'chicos', tabla: 'vecino', ficha: 'nena', clave: 'aldea-nena' },
};
export const CLAVES_CUERPOS = Object.keys(CUERPOS);

// 4.9 (junta): el estado real de la aldea (pedidos)
import { nivelAyuda } from './desafio-aldea.js';

// ---------------------------------------------------------------- el nivel de ayuda
const entero = (v) => Math.max(0, Math.min(NIVEL_MAX, Math.floor(Number.isFinite(Number(v)) && v !== null && v !== '' && typeof v !== 'boolean' ? Number(v) : 0)));
// 4.9 (junta): el nivel sale del estado real de la aldea (los pedidos de `desafio-aldea.js` lo suben de 0 a 2); sin pedidos cumplidos, nadie ayuda
export function nivelDeAyuda(d, clave) {
  if (!VECINOS.includes(clave)) return 0;
  return nivelAyuda(d, clave);
}
// ¿Ayuda esta noche? Sólo en las noches grandes y con nivel mayor que 0. Devuelve el nivel que ayuda (0 si no).
export const nivelEstaNoche = (d, clave, grande) => (grande ? nivelDeAyuda(d, clave) : 0);
// Los cuerpos que tienen que estar esta noche en la base (los de los vecinos con nivel > 0).
export const cuerposDeLaNoche = (d, grande) => CLAVES_CUERPOS.filter((c) => nivelEstaNoche(d, CUERPOS[c].vecino, grande) > 0);

// ---------------------------------------------------------------- Anselmo: arregla
// repara: vida por segundo; radio: hasta dónde busca lo roto alrededor de su puesto; pausa: segundos entre un golpe y otro.
// (Don Ramón arregla 7 por segundo en un radio de 18 m.)
export const ANSELMO = [null, { repara: 9, radio: 16, pausa: 0.6 }, { repara: 15, radio: 26, pausa: 0.4 }];

// ---------------------------------------------------------------- Herminia: fogones y faroles
// fuegos: cuántos prende; radio: a cuántos metros espanta a los viejos un fogón (un farol, el 60%); tarda: segundos que le lleva cada uno.
export const HERMINIA = [null, { fuegos: 2, radio: 9, tarda: 4 }, { fuegos: 4, radio: 13, tarda: 2 }];
export const PARTE_FAROL = 0.6;
export const TIPOS_FUEGO = ['fogon', 'farol', 'fogon', 'farol'];
export const radioDeFuego = (tipo, nivel) => (HERMINIA[nivel]?.radio || 0) * (tipo === 'farol' ? PARTE_FAROL : 1);

// Dónde van los fuegos: alrededor del centro de la base, hacia adentro de las paredes. `paredes`: [{ x, z }]; `ang0`: por dónde empezar
// (el rumbo del lado por donde entran, así el primero cubre esa entrada). Cada punto queda al 60% de la distancia a la pared más cercana
// de su sector (entre 3 y 11 m del centro; sin paredes, a 6 m).
export function puntosDeFuegos(centro, n, ang0 = 0, paredes = []) {
  const r = [];
  const cuantos = Math.max(0, Math.min(4, Math.floor(n) || 0));
  for (let i = 0; i < cuantos; i++) {
    const ang = ang0 + (i * Math.PI) / 2 + (i % 2 ? 0.35 : 0);
    let cerca = Infinity;
    for (const p of paredes || []) {
      const a = Math.atan2(p.x - centro.x, p.z - centro.z);
      const dif = Math.abs(Math.atan2(Math.sin(a - ang), Math.cos(a - ang)));
      if (dif < 0.6) cerca = Math.min(cerca, Math.hypot(p.x - centro.x, p.z - centro.z));
    }
    const rad = Number.isFinite(cerca) ? Math.max(3, Math.min(11, cerca * 0.6)) : 6;
    r.push({ x: centro.x + Math.sin(ang) * rad, z: centro.z + Math.cos(ang) * rad, tipo: TIPOS_FUEGO[i] });
  }
  return r;
}

// La regla de los viejos y el fuego. `v`: hacia dónde quiere ir (vector); `p`: dónde está; `fuegos`: [{ x, z, radio }] (sólo los prendidos).
// Un VIEJO no se acerca a menos de `radio` de un fuego prendido: si quería ir hacia adentro, se le saca esa parte (bordea el círculo) y,
// si ya está adentro, se lo empuja hacia afuera. Un TRAVIESO no se entera. Devuelve el vector nuevo (o el mismo, sin copiar, si no aplica).
export function ajusteDeViejo(vx, vz, px, pz, fuegos, viejo, salida = { x: 0, z: 0, tocado: false }) {
  salida.x = vx; salida.z = vz; salida.tocado = false;
  if (!viejo || !fuegos || !fuegos.length) return salida;
  for (let i = 0; i < fuegos.length; i++) {
    const f = fuegos[i];
    const dx = f.x - px, dz = f.z - pz;
    const d = Math.hypot(dx, dz);
    if (!(d < f.radio) || d < 0.001) continue;
    const ux = dx / d, uz = dz / d;           // hacia el fuego
    const hacia = salida.x * ux + salida.z * uz;
    if (hacia > 0) { salida.x -= ux * hacia; salida.z -= uz * hacia; }          // la parte que lo acercaba, afuera
    const empuje = 0.45 + 1.4 * (1 - d / f.radio);
    salida.x -= ux * empuje; salida.z -= uz * empuje;                          // y para afuera
    salida.tocado = true;
  }
  return salida;
}
// ¿Esta posición está a salvo de los viejos por algún fuego? (para las pruebas y el aviso)
export function protegidoPorFuego(px, pz, fuegos) {
  for (const f of fuegos || []) if (Math.hypot(f.x - px, f.z - pz) < f.radio) return true;
  return false;
}

// ---------------------------------------------------------------- Martín: la trochita
// alcance: hasta dónde llega el silbato (m, desde el punto de la vía más cercano a la base); dispersa: segundos que los traviesos
// salen corriendo; pasadas: cuántas pasadas por noche hacen efecto (la trochita da la vuelta a su ritmo).
export const MARTIN = [null, { alcance: 45, dispersa: 9, pasadas: 1 }, { alcance: 70, dispersa: 15, pasadas: 2 }];
export const DISTANCIA_VIA_MAX = 120;      // la base tiene que estar a menos de esto de la vía para que el silbato sirva
export const VENTANA_PASADA = 30;          // la locomotora «pasa» cuando está a menos de esto (a lo largo de la vía) del punto más cercano
export const REARME_PASADA = 90;           // y se vuelve a armar cuando se alejó más que esto
// El punto de la vía más cercano a la base: `riel` = [{ x, z, s }] (T.riel). Devuelve { d, x, z, s } o null.
export function puntoDeViaMasCercano(riel, base) {
  let mejor = null, d0 = Infinity;
  for (let i = 0; i < (riel?.length || 0); i++) {
    const p = riel[i], d = Math.hypot(p.x - base.x, p.z - base.z);
    if (d < d0) { d0 = d; mejor = p; }
  }
  return mejor ? { d: d0, x: mejor.x, z: mejor.z, s: mejor.s } : null;
}
export const silbatoServiria = (distanciaVia) => Number.isFinite(distanciaVia) && distanciaVia <= DISTANCIA_VIA_MAX;
// Distancia con signo, a lo largo de la vía (anillo de `largo` metros), de la locomotora al punto: negativa si todavía no llegó.
export function distanciaAlPunto(sLoco, sPunto, largo) {
  let d = (sLoco - sPunto) % largo;
  if (d > largo / 2) d -= largo; else if (d < -largo / 2) d += largo;
  return d;
}
// Un paso de la detección de la pasada. `est` = { armada: true }. Devuelve true cuando la locomotora acaba de pasar por el punto.
export function pasoDeLaTrochita(est, sLoco, sPunto, largo, andando = true) {
  const d = Math.abs(distanciaAlPunto(sLoco, sPunto, largo));
  if (d > REARME_PASADA) est.armada = true;
  if (est.armada && andando && d <= VENTANA_PASADA) { est.armada = false; return true; }
  return false;
}
// ¿El silbato dispersa a este duende? Sólo a los traviesos (no a los viejos), a menos de `alcance` del punto de la vía.
export function silbatoDispersa(p, centro, alcance, viejo) {
  return !viejo && Math.hypot(p.x - centro.x, p.z - centro.z) <= alcance;
}

// ---------------------------------------------------------------- los chicos: las hondas
// cadencia: segundos entre piedra y piedra de cada chico; alcance: metros; dano: lo que le saca a un duende (una flecha de Josefina saca 30).
export const HONDA = [null, { cadencia: 3.2, alcance: 20, dano: 4 }, { cadencia: 2.2, alcance: 28, dano: 6 }];
export const VELOCIDAD_PIEDRA = 30;
// Los chicos no corren peligro: ninguna regla del juego les saca vida y los duendes no los eligen de blanco. Esta es la regla escrita
// (la usan el código y la prueba): cualquier daño a un chico vale cero.
export const danoAChico = () => 0;
// Quién puede tirarle a quién: no a los que vuelan alto ni a los que están bajo tierra o dormidos.
export function esBlancoDeHonda(a, yTirador) {
  if (!a || a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajar' || a.estado === 'bajoTierra' || a.estado === 'dormido' || a.enNave) return false;
  if (a.def?.vuela && a.m?.g?.position && a.m.g.position.y - yTirador > 3) return false;
  return true;
}

// ---------------------------------------------------------------- los puestos
export const DISTANCIA_PUESTO_MAX = 45;   // un puesto nunca queda a más de esto del centro de la base (si el jugador lo marcó más lejos, se acerca)
// El puesto que le toca por su oficio si el jugador no marcó ninguno. `ctx`: { base, paredes: [{ x, z }], lado: rumbo del lado de la noche (o null),
// fuegos: [{ x, z }] (los puntos de Herminia) }.
export function puestoPorDefecto(clave, ctx) {
  const b = ctx.base, lado = Number.isFinite(ctx.lado) ? ctx.lado : 0;
  const en = (ang, rad) => ({ x: b.x + Math.sin(ang) * rad, z: b.z + Math.cos(ang) * rad });
  if (clave === 'herminia') {
    const f = ctx.fuegos?.[0];
    return f ? { x: f.x - Math.sin(lado) * 1.8, z: f.z - Math.cos(lado) * 1.8 } : en(lado + Math.PI, 3.5);
  }
  if (clave === 'anselmo') return en(lado + Math.PI / 2, 3);
  if (clave === 'nene' || clave === 'nena') {
    // detrás de la empalizada del lado por donde entran: la pared más cercana a ese rumbo (cada chico, de un costado), un metro y medio para adentro
    const ang = lado + (clave === 'nene' ? -0.3 : 0.3);
    let mejor = null, m0 = Infinity;
    for (const p of ctx.paredes || []) {
      const a = Math.atan2(p.x - b.x, p.z - b.z);
      const dif = Math.abs(Math.atan2(Math.sin(a - ang), Math.cos(a - ang)));
      if (dif < m0) { m0 = dif; mejor = p; }
    }
    if (mejor && m0 < 1) {
      const d = Math.hypot(mejor.x - b.x, mejor.z - b.z) || 1;
      return { x: mejor.x - ((mejor.x - b.x) / d) * 1.5, z: mejor.z - ((mejor.z - b.z) / d) * 1.5 };
    }
    return en(ang, 5);
  }
  // Ramón y Josefina: adentro de la base, del lado opuesto a por donde entran, uno a cada costado
  return en(lado + Math.PI + (clave === 'ramon' ? -0.6 : 0.6), 3.2);
}
// El puesto vigente: el que marcó el jugador (si es razonable) o el de su oficio. `puestos`: D().puestosAliados.
export function puestoDe(puestos, clave, ctx) {
  const p = puestos && Object.hasOwn(puestos, clave) ? puestos[clave] : null;
  if (p && Number.isFinite(p.x) && Number.isFinite(p.z)) {
    const dx = p.x - ctx.base.x, dz = p.z - ctx.base.z, d = Math.hypot(dx, dz);
    if (d <= DISTANCIA_PUESTO_MAX) return { x: p.x, z: p.z };
    return { x: ctx.base.x + (dx / d) * DISTANCIA_PUESTO_MAX, z: ctx.base.z + (dz / d) * DISTANCIA_PUESTO_MAX };
  }
  return puestoPorDefecto(clave, ctx);
}

// ---------------------------------------------------------------- la campana
export const CAMPANA = { radioE: 3, enfriamiento: 14, perroEspera: 60 };
// Al tocar la campana: cuáles de los que están en la base pasan a «puesto». Devuelve las claves que cambian de orden.
export function alarmaDeCampana(presentes, ordenes) {
  const r = [];
  for (const clave of presentes || []) if (ordenes?.[clave] !== 'puesto') r.push(clave);
  return r;
}
