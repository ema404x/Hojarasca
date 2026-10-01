// 2.0: lo que se ve, se oye y se siente de noche en el Desafío.
//
// Seis ideas chicas que juntas cambian cómo da miedo la noche. Todas puras: entra
// geometría, sale una decisión. El juego las cablea en `desafio.js` y `main.js`.
//
//   1. Los ojos reflejan la linterna. Como los de un zorro en la ruta: dos puntos
//      que se prenden en la oscuridad cuando el haz los toca, mucho antes de ver el
//      cuerpo. El reflejo vuelve hacia la luz, así que sólo se ve si el bicho te mira.
//   2. El acecho. Los rastreadores y los saltadores ya no vienen derecho: si los
//      mirás, se frenan, rodean o se esconden detrás de un árbol; si les das la
//      espalda, cargan.
//   3. El perro avisa. Gruñe hacia lo que vos todavía no ves, y ladra cuando está cerca.
//   6. Subtítulos con dirección: «[gruñido lejos · noroeste]».
//   7. La mezcla se agacha cuando algo chilla al lado: el bosque y la música se corren
//      un instante para que el grito se escuche entero.
//  10. La vibración del mando: un golpe fuerte en las manos cuando te pegan, uno suave
//      cuando algo chilla cerca, el paso del jefe.
import { rumboDe } from './oido.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------------------------------------------------------------- 1. el reflejo
// `cosLinterna` es el coseno entre hacia dónde apunta la linterna y hacia dónde está
// el bicho; `angulo`, la mitad de la apertura del haz; `frente`, cuánto te mira (0 a 1).
export const ALCANCE_REFLEJO = 1.6;   // el reflejo se ve más lejos que lo que alumbra el haz
export function reflejoOjos({ encendida, cosLinterna, angulo = 0.42, distancia, alcance = 42, frente, noche = 1 }) {
  if (!encendida || !(noche > 0.2)) return 0;
  const borde = Math.cos(angulo * 1.15);                 // un poco más allá del borde del haz
  if (cosLinterna <= borde) return 0;
  const enHaz = clamp((cosLinterna - borde) / (1 - borde) * 2.2, 0, 1);
  const lejos = alcance * ALCANCE_REFLEJO;
  if (distancia >= lejos) return 0;
  // de cerca el reflejo se pierde entre la luz que le da en la cara; de lejos se apaga
  const d = clamp(1 - distancia / lejos, 0, 1) * clamp((distancia - 2) / 6, 0, 1);
  return clamp(enHaz * d * clamp(frente, 0, 1) * clamp(noche, 0, 1) * 1.6, 0, 1);
}

// ---------------------------------------------------------------- 2. el acecho
export const ACECHAN = new Set(['rastreador', 'saltador']);
export const CONO_VISTA = 0.62;   // coseno: dentro de esto, lo estás mirando
export const RADIO_RODEO = 20;
// Qué hace un acechador este momento.
//   'normal'      de día, muy lejos o ya encima: viene como siempre
//   'esconderse'  lo estás mirando y hay un árbol a mano: va detrás
//   'rodear'      lo estás mirando: se corre de costado, sin acercarse
//   'cargar'      le diste la espalda: se viene rápido
export function modoAcecho({ tipo, distancia, mirado, noche = 1, arbol = false, herido = false }) {
  if (!ACECHAN.has(tipo) || noche < 0.5 || herido) return 'normal';
  if (distancia > 48 || distancia < 9) return 'normal';
  if (!mirado) return 'cargar';
  return arbol ? 'esconderse' : 'rodear';
}
export const VELOCIDAD_ACECHO = { normal: 1, esconderse: 1.1, rodear: 0.72, cargar: 1.55 };

// El rumbo para rodear: de costado, corrigiendo hacia el radio de rodeo para no
// alejarse ni acercarse de más. `sentido` es 1 o -1 (cada uno elige para qué lado).
export function rumboRodeo(alien, jugador, sentido = 1) {
  const dx = jugador.x - alien.x, dz = jugador.z - alien.z;
  const d = Math.hypot(dx, dz) || 1;
  const hacia = Math.atan2(dx, dz);
  const corrige = clamp((d - RADIO_RODEO) / RADIO_RODEO, -0.6, 0.6);   // lejos: se cierra; cerca: se abre
  return hacia + sentido * (Math.PI / 2 - corrige);
}

// Detrás del árbol, del lado opuesto al jugador.
export function escondite(arbol, jugador, margen = 0.9) {
  const dx = arbol.x - jugador.x, dz = arbol.z - jugador.z;
  const d = Math.hypot(dx, dz) || 1;
  const r = (arbol.r || 0.4) + margen;
  return { x: arbol.x + (dx / d) * r, z: arbol.z + (dz / d) * r };
}

// ¿Lo está mirando? Coseno entre hacia dónde mira la cámara y hacia el bicho, en el plano.
export function estaMirando(mira, desde, hacia) {
  const dx = hacia.x - desde.x, dz = hacia.z - desde.z;
  const d = Math.hypot(dx, dz), m = Math.hypot(mira.x, mira.z);
  if (!d || !m) return false;
  return (mira.x * dx + mira.z * dz) / (d * m) > CONO_VISTA;
}

// ---------------------------------------------------------------- 3. el perro
export const PERRO_GRUNE = 42, PERRO_LADRA = 18;
// `visto` es si el jugador lo tiene a la vista. El perro gruñe por lo que no ves.
export function avisoDelPerro({ distancia, visto }) {
  if (!(distancia < PERRO_GRUNE)) return null;
  if (distancia < PERRO_LADRA) return 'ladrar';
  return visto ? null : 'grunir';
}

// ---------------------------------------------------------------- 6. subtítulos
// Cómo se escribe cada sonido. `null`: no se subtitula (lo hace el jugador mismo).
export const SONIDOS_ESCRITOS = {
  chillido: 'chillido', acecho: 'gruñido', embestida: 'rugido', llamado: 'llamado',
  respiro: 'respiración', latido: 'latido bajo la tierra', muerte: 'algo que cae',
  jefe: 'bramido enorme', escupir: 'escupitajo', acido: 'ácido que chisporrotea',
  salto: 'algo que salta', madera: 'golpes en la madera', derrumbe: 'derrumbe',
  zumbido: 'zumbido de la nave', aranazo: 'arañazos en la pared', puerta: 'alguien prueba la puerta',
  grunirPerro: 'el perro gruñe', ladrarPerro: 'el perro ladra', pasos: 'pasos rápidos',
  apagon: 'una antorcha se apaga', plasma: 'disparo de plasma',
  // 2.1
  excavar: 'algo cava bajo la tierra', emerger: 'la tierra se abre', roca: 'una piedra que cae',
  descarga: 'descarga eléctrica', hielo: 'algo se congela', rayoCadena: 'un rayo que salta',
  // 2.3
  aleteo: 'un aleteo', picada: 'algo baja en picada', apagar: 'una llama se apaga',
  capullo: 'algo que revienta', quemar: 'algo se quema', zanja: 'la zanja prende',
};
export function lejaniaTexto(d) {
  if (d < 6) return 'encima';
  if (d < 16) return 'cerca';
  if (d < 40) return '';
  if (d < 85) return 'lejos';
  return 'muy lejos';
}
// El texto entero. Cerca y a tus espaldas no importa el rumbo: importa que está atrás.
// `t` traduce cada pedazo por separado (el diccionario no puede partir «gruñido lejos»
// solo: no sabe dónde termina el sonido y empieza la distancia).
export function subtituloSonido({ clave, pos, jugador, mira, t = (x) => x }) {
  const nombre = SONIDOS_ESCRITOS[clave];
  if (!nombre || !pos || !jugador) return null;
  const d = Math.hypot(pos.x - jugador.x, pos.z - jugador.z);
  const lej = lejaniaTexto(d);
  let donde = d < 2 ? '' : rumboDe(jugador, pos);
  if (mira && d < 16 && d >= 2) {
    const m = Math.hypot(mira.x, mira.z) || 1;
    const cos = (mira.x * (pos.x - jugador.x) + mira.z * (pos.z - jugador.z)) / (m * d);
    if (cos < -0.5) donde = 'detrás tuyo';
  }
  return `[${t(nombre)}${lej ? ` ${t(lej)}` : ''}${donde ? ` · ${t(donde)}` : ''}]`;
}
// Una lista corta de lo último que sonó, sin repetir el mismo renglón seguido: si se
// repite, se cuenta («×3»). Cada renglón vive `VIDA_SUBTITULO` segundos.
export const VIDA_SUBTITULO = 3.2, MAX_SUBTITULOS = 3;
export function apilarSubtitulo(lista, texto, ahora) {
  const vivos = lista.filter((s) => ahora - s.t < VIDA_SUBTITULO);
  if (!texto) return vivos;
  const igual = vivos.find((s) => s.texto === texto);
  if (igual) { igual.veces++; igual.t = ahora; return vivos; }
  vivos.push({ texto, veces: 1, t: ahora });
  return vivos.slice(-MAX_SUBTITULOS);
}
export const renglonSubtitulo = (s) => (s.veces > 1 ? `${s.texto} ×${s.veces}` : s.texto);

// ---------------------------------------------------------------- 7. la mezcla se agacha
// Cuánto baja el resto (0 a 1) y cuánto tiempo se sostiene, según qué gritó y dónde.
const GRITOS = { chillido: [14, 0.5], embestida: [12, 0.6], llamado: [30, 0.45], jefe: [45, 0.7], muerte: [10, 0.3] };
export function agacheDeMezcla(clave, distancia) {
  const g = GRITOS[clave];
  if (!g || !(distancia < g[0])) return null;
  const k = 1 - distancia / g[0];
  return { profundidad: clamp(g[1] * (0.4 + k * 0.6), 0, 0.75), sostener: 0.25 + k * 0.9 };
}

// ---------------------------------------------------------------- 10. vibración
// Lo que siente la mano. `fuerte` es el motor grande (grave), `debil` el chico (agudo).
export function pulsoVibracion(evento, intensidad = 1) {
  const i = clamp(intensidad, 0, 1);
  switch (evento) {
    case 'herido': return { duracion: 120 + i * 260, fuerte: 0.45 + i * 0.55, debil: 0.3 + i * 0.4 };
    case 'caido': return { duracion: 700, fuerte: 1, debil: 0.6 };
    case 'chillido': return { duracion: 90 + i * 90, fuerte: 0, debil: 0.2 + i * 0.35 };
    case 'jefe': return { duracion: 160, fuerte: 0.35 + i * 0.5, debil: 0.05 };
    case 'derrumbe': return { duracion: 220 + i * 200, fuerte: 0.3 + i * 0.5, debil: 0.2 };
    case 'golpe': return { duracion: 45, fuerte: 0.1, debil: 0.25 + i * 0.2 };
    default: return null;
  }
}
// Que no zumbe sin parar: un pulso nuevo sólo si el anterior terminó o si es más fuerte.
export function dejarVibrar(anterior, nuevo, ahoraMs) {
  if (!nuevo) return false;
  if (!anterior) return true;
  const termina = anterior.desde + anterior.duracion;
  return ahoraMs >= termina || nuevo.fuerte > anterior.fuerte + 0.15;
}
