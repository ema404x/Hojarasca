// 3.0: los invasores que evolucionan. Aprenden de cómo te defendés.
//
// Cada noche se anota con qué les pegaste (fuego, flechas, golpes, trampas, torretas,
// explosiones o cristal). Al amanecer, si una sola cosa hizo casi todo el daño, la nave
// se lo lleva aprendido: desde la noche siguiente una parte de los invasores viene con
// placas contra eso, y eso les entra menos. Si cambiás de táctica, lo que no usás se lo
// olvidan de a poco.
//
// Para que sea justo:
//   · las primeras noches no aprenden nada, y una noche tranquila no enseña;
//   · sube de a un nivel por noche, con tope, y nunca más de dos cosas a la vez;
//   · aun al tope, la mitad de la oleada viene como siempre y al adaptado le entra la
//     mitad (nunca es inmune);
//   · el jefe no se adapta;
//   · se avisa al atardecer, se ve en el cuerpo y queda en el bestiario.
//
// Módulo puro (sin THREE ni DOM): se prueba en Node.
import { BESTIARIO } from './desafio-noche2.js';

export const CLASES_DANO = ['fuego', 'flechas', 'cuerpo', 'trampas', 'torretas', 'explosivos', 'cristal'];

export const EVOLUCION = {
  desdeNoche: 3,        // después de la noche 3 empiezan a aprender (se nota desde la 4)
  minimo: 120,          // con menos daño que esto en toda la noche, no hay nada que aprender
  dominante: 0.45,      // la parte del daño que tiene que hacer una cosa para "ser tu táctica"
  olvido: 0.2,          // lo que usaste menos que esto, lo olvidan un nivel por noche
  tope: 3,
  porcion: [0, 0.2, 0.35, 0.5],         // qué parte de la oleada viene adaptada, por nivel
  resistencia: [0, 0.3, 0.4, 0.5],      // cuánto menos le entra al adaptado, por nivel
  maxClases: 2,
};

// Cómo se dice cada cosa (el aviso del atardecer y el bestiario).
export const RESISTENTES = {
  fuego: 'resistentes al fuego',
  flechas: 'resistentes a las flechas',
  cuerpo: 'con el cuero duro para los golpes',
  trampas: 'mirando dónde pisan: las trampas les hacen menos',
  torretas: 'blindados contra las torretas',
  explosivos: 'resistentes a las explosiones',
  cristal: 'resistentes al cristal y al rayo',
};
export const NOMBRE_CLASE = {
  fuego: 'el fuego', flechas: 'las flechas', cuerpo: 'los golpes', trampas: 'las trampas',
  torretas: 'las torretas', explosivos: 'las explosiones', cristal: 'el cristal',
};
// Placas y brillo del borde, por clase: se leen de lejos y de noche.
export const ASPECTO_CLASE = {
  fuego: { placa: '#2e2a28', borde: '#ff7a3a' },
  flechas: { placa: '#d8d2c0', borde: '#efe6cc' },
  cuerpo: { placa: '#4a3a5a', borde: '#b08ae0' },
  trampas: { placa: '#6b5a3a', borde: '#d8b06a' },
  torretas: { placa: '#7a8088', borde: '#c8d4e0' },
  explosivos: { placa: '#5a4030', borde: '#e0904a' },
  cristal: { placa: '#2a3a44', borde: '#7dfff0' },
};

// La ficha del bestiario de los adaptados (se anota como las demás: visto y abatido).
Object.assign(BESTIARIO, {
  adaptado: {
    nombre: 'Adaptado', visto: 'Uno de los de siempre, con placas de costra encima, del color de lo que aprendió a aguantar.',
    aprendido: 'Aprenden de cómo te defendés: si todas las noches usás lo mismo, cada vez vienen más preparados contra eso.',
    debil: 'Cambiá de táctica. Contra lo demás no tienen nada, y lo que dejás de usar lo olvidan en pocas noches.',
  },
});

const esClase = (c) => typeof c === 'string' && CLASES_DANO.includes(c);
const ent = (v, min, max) => Math.max(min, Math.min(max, Math.floor(Number.isFinite(Number(v)) ? Number(v) : 0)));

export function evolucionNueva() {
  return { niveles: {}, noche: {}, ultimo: null };
}

export function sanearEvolucion(v) {
  const x = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const s = evolucionNueva();
  const niv = x.niveles && typeof x.niveles === 'object' ? x.niveles : {};
  for (const c of CLASES_DANO) {
    if (!Object.hasOwn(niv, c)) continue;
    const n = ent(niv[c], 0, EVOLUCION.tope);
    if (n > 0) s.niveles[c] = n;
  }
  // nunca más de dos a la vez, aunque el guardado diga otra cosa
  const activas = adaptacionesActivas(s);
  for (const a of activas.slice(EVOLUCION.maxClases)) delete s.niveles[a.clase];
  const noc = x.noche && typeof x.noche === 'object' ? x.noche : {};
  for (const c of CLASES_DANO) {
    if (!Object.hasOwn(noc, c)) continue;
    const n = Number(noc[c]);
    if (Number.isFinite(n) && n > 0) s.noche[c] = Math.min(1e6, Math.round(n * 10) / 10);
  }
  const u = x.ultimo;
  if (u && typeof u === 'object') {
    s.ultimo = {
      subio: esClase(u.subio) ? u.subio : null,
      bajaron: Array.isArray(u.bajaron) ? [...new Set(u.bajaron.filter(esClase))] : [],
      noche: ent(u.noche, 0, 1e6),
    };
  }
  return s;
}

// ¿Qué clase de daño es este golpe? `fuente` es la de siempre de herirAlien ('jugador',
// 'lanza', 'torreta', 'trampa', 'foso', 'zanja', 'fuego', 'perro'); `detalle`, si viene,
// ya es una clase (lo pasa quien sabe qué arma fue). El perro no cuenta: no es tu táctica.
export function claseDeDano(fuente, detalle = null) {
  if (esClase(detalle)) return detalle;
  switch (fuente) {
    case 'fuego': case 'zanja': return 'fuego';
    case 'trampa': case 'foso': case null: case undefined: return 'trampas';   // las estacas no dicen quién
    case 'torreta': return 'torretas';
    case 'perro': return null;
    default: return 'cuerpo';   // 'jugador', 'lanza' o true: el golpe con la mano
  }
}

// Lo que tiraste: flechas (y todo lo que se arroja), fuego, cristal o explosivos.
export function claseDeProyectil(q) {
  if (!q) return null;
  if (q.fuente === 'torreta') return 'torretas';
  if (q.flechaTipo === 'fuego') return 'fuego';
  if (q.flechaTipo === 'cristal') return 'cristal';
  switch (q.tipo) {
    case 'granada': case 'pedrusco': return 'explosivos';
    case 'rayo': case 'plasmaAliado': return 'cristal';
    default: return 'flechas';   // flecha, virote, perno, piedra, boleadora, hachuela, jabalina, arpón
  }
}

export function anotarDano(evo, clase, dano) {
  if (!evo || !esClase(clase)) return;
  const n = Number(dano);
  if (!Number.isFinite(n) || n <= 0) return;
  if (!evo.noche || typeof evo.noche !== 'object') evo.noche = {};
  evo.noche[clase] = (evo.noche[clase] || 0) + n;
}

// Lo que aprendieron, de lo más fuerte a lo más flojo: [{ clase, nivel }].
export function adaptacionesActivas(evo) {
  const niv = evo?.niveles || {};
  return CLASES_DANO.filter((c) => (niv[c] || 0) > 0)
    .map((c) => ({ clase: c, nivel: niv[c] }))
    .sort((a, b) => b.nivel - a.nivel);
}

// Al amanecer: lo de esta noche se vuelve aprendizaje (o se olvida). `noche` es la que
// terminó. Devuelve { subio, bajaron, dominante, total }.
export function cerrarNocheEvolucion(evo, noche) {
  const r = { subio: null, bajaron: [], dominante: null, total: 0 };
  if (!evo) return r;
  if (!evo.niveles || typeof evo.niveles !== 'object') evo.niveles = {};
  const hecho = evo.noche || {};
  const total = CLASES_DANO.reduce((s, c) => s + (hecho[c] || 0), 0);
  r.total = total;
  const parte = (c) => (total > 0 ? (hecho[c] || 0) / total : 0);
  let dom = null;
  for (const c of CLASES_DANO) if ((hecho[c] || 0) > 0 && (!dom || hecho[c] > hecho[dom])) dom = c;
  r.dominante = dom;
  const aprende = Number(noche) >= EVOLUCION.desdeNoche && total >= EVOLUCION.minimo && dom && parte(dom) >= EVOLUCION.dominante;
  if (aprende && (evo.niveles[dom] || 0) < EVOLUCION.tope) {
    evo.niveles[dom] = (evo.niveles[dom] || 0) + 1;
    r.subio = dom;
  }
  // lo que no usaste (o una noche sin pelea) se olvida un nivel
  for (const c of CLASES_DANO) {
    if (c === dom && aprende) continue;
    if (!(evo.niveles[c] > 0)) continue;
    if (total < EVOLUCION.minimo || parte(c) < EVOLUCION.olvido) {
      evo.niveles[c]--;
      r.bajaron.push(c);
      if (evo.niveles[c] <= 0) delete evo.niveles[c];
    }
  }
  // tope de dos a la vez: la más floja (que no sea la que acaba de subir) se olvida
  let activas = adaptacionesActivas(evo);
  while (activas.length > EVOLUCION.maxClases) {
    const fuera = [...activas].reverse().find((a) => a.clase !== r.subio) || activas[activas.length - 1];
    delete evo.niveles[fuera.clase];
    if (!r.bajaron.includes(fuera.clase)) r.bajaron.push(fuera.clase);
    activas = adaptacionesActivas(evo);
  }
  evo.noche = {};
  evo.ultimo = { subio: r.subio, bajaron: [...r.bajaron], noche: Math.max(0, Math.floor(Number(noche) || 0)) };
  return r;
}

// ¿Este invasor que baja viene adaptado? Devuelve la clase o null. El jefe, nunca.
export function elegirAdaptacion(evo, azar = Math.random, esJefe = false) {
  if (esJefe) return null;
  for (const { clase, nivel } of adaptacionesActivas(evo)) {
    if (azar() < (EVOLUCION.porcion[nivel] || 0)) return clase;
  }
  return null;
}

// Cuánto le entra un golpe de `clase` al que resiste `resiste` con `nivel`.
export function factorResistencia(resiste, clase, nivel) {
  if (!resiste || resiste !== clase) return 1;
  const n = Math.max(0, Math.min(EVOLUCION.tope, Math.floor(Number(nivel) || 0)));
  return 1 - (EVOLUCION.resistencia[n] || 0);
}

// El aviso al atardecer: "Vienen resistentes al fuego".
export function avisoAtardecer(evo) {
  const activas = adaptacionesActivas(evo);
  if (!activas.length) return null;
  const titulo = `Vienen ${activas.map((a) => RESISTENTES[a.clase]).join(' y ')}`;
  const cuantos = Math.round((EVOLUCION.porcion[activas[0].nivel] || 0) * 10);
  return {
    titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1),
    texto: `Aprendieron de cómo te defendés: ${cuantos} de cada 10 traen placas. Cambiá de táctica: lo que no usás, lo olvidan`,
  };
}

// Lo que se anota al amanecer, si algo cambió.
export function avisoAprendizaje(cambio) {
  if (!cambio) return null;
  if (cambio.subio) return { titulo: 'Aprendieron algo esta noche', texto: `La nave vio cómo peleaste: la próxima vez van a venir ${RESISTENTES[cambio.subio]}` };
  if (cambio.bajaron?.length) return { titulo: 'Se van olvidando', texto: `Como no usaste ${cambio.bajaron.map((c) => NOMBRE_CLASE[c]).join(' ni ')}, ya no vienen tan preparados` };
  return null;
}

// Para el bestiario: cómo vienen ahora.
export function textoAdaptaciones(evo) {
  const activas = adaptacionesActivas(evo);
  if (!activas.length) return 'Ahora mismo no vienen preparados contra nada en especial.';
  return 'Ahora: ' + activas.map((a) => `${RESISTENTES[a.clase]} (nivel ${a.nivel} de ${EVOLUCION.tope}: ${Math.round(EVOLUCION.porcion[a.nivel] * 10)} de cada 10 así; les entra un ${Math.round(EVOLUCION.resistencia[a.nivel] * 100)}% menos)`).join(' · ') + '.';
}
