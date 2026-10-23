// 4.10 guardian: la pestaña «Guardián» del cuaderno (las reglas están en desafio-habilidades.js y desafio-bonos.js).
//
// A la izquierda: los puntos que tenés y las tres ramas con sus dos habilidades cada una. A la derecha: la habilidad
// elegida con sus tres niveles (lo que cuesta cada uno y lo que da) y el botón de subir. Debajo, lo que sumás ahora, de
// todos los orígenes juntos. Se maneja con el ratón o con el teclado: flechas arriba y abajo recorren las habilidades,
// Enter elige y pasa al botón, Enter otra vez sube. Nada por cuadro: sólo se dibuja cuando se abre el cuaderno.
import { HABILIDADES, RAMAS, IDS_HABILIDAD, NIVEL_MAX_HABILIDAD, COSTOS, nivelDe, costoSiguiente, puedeSubir, subirHabilidad, puntosGastados, habilidadesNuevas, golpesPorMaterial, menosDano } from './desafio-habilidades.js';
import { bonoAplicado, saludMaximaConBonos } from './desafio-bonos.js';
import { SALUD_MAX } from './desafio-reglas.js';

// Lo que sumás ahora, en palabras (sólo lo que no es cero).
export function resumenDeBonos(d) {
  const filas = [];
  const pct = (v) => `${Math.round(Math.abs(v) * 100)} %`;
  const sal = saludMaximaConBonos(SALUD_MAX, d);
  if (sal !== SALUD_MAX) filas.push(`Salud máxima: ${sal} (${sal > SALUD_MAX ? '+' : ''}${sal - SALUD_MAX})`);
  const dano = bonoAplicado(d, 'dano'), alc = bonoAplicado(d, 'alcance'), rec = bonoAplicado(d, 'recarga'), cor = bonoAplicado(d, 'correr'), rep = bonoAplicado(d, 'reparar');
  if (dano) filas.push(`Daño de las armas: ${dano > 0 ? '+' : '-'}${pct(dano)}`);
  if (alc) filas.push(`Alcance: ${alc > 0 ? '+' : '-'}${pct(alc)}`);
  if (rec) filas.push(`Espera entre ataques: ${rec > 0 ? '-' : '+'}${pct(rec)}`);
  if (cor) filas.push(`Velocidad al correr: ${cor > 0 ? '+' : '-'}${pct(cor)}`);
  if (rep) filas.push(`Reparar: ${rep > 0 ? '+' : '-'}${pct(rep)} por golpe y por material`);
  if (golpesPorMaterial(d) > 3) filas.push(`Martillo: ${golpesPorMaterial(d)} golpes por material`);
  if (menosDano(d) > 0) filas.push(`Daño recibido: -${pct(menosDano(d))}`);
  return filas;
}

// `ctx`: { D, nota, guardar, sonido, redibujar }
export function crearHabilidadesMundo(ctx) {
  let elegida = IDS_HABILIDAD[0];
  let foco = null;   // dónde vuelve el foco después de dibujar: 'lista:<id>' o 'subir'

  function estado() {
    const d = ctx.D();
    if (!d.habilidades) d.habilidades = habilidadesNuevas();
    return d;
  }
  const puntos = () => estado().habilidades.puntos;

  function subir(id) {
    const d = estado();
    const nombre = HABILIDADES[id]?.nombre;
    const r = subirHabilidad(d, id);
    if (!r.ok) {
      if (r.razon === 'puntos') ctx.nota(nombre, `Te faltan ${r.faltan} ${r.faltan === 1 ? 'punto' : 'puntos'} para el próximo nivel`);
      return r;
    }
    ctx.sonido?.juntar?.();
    ctx.nota(`${nombre}: nivel ${r.nivel}`, HABILIDADES[id].texto[r.nivel - 1], true);
    ctx.guardar?.();
    return r;
  }

  function dibujarCuaderno(lista, ficha, el) {
    const d = estado(), h = d.habilidades;
    lista.appendChild(el('h3', '', `Puntos del guardián: ${h.puntos}`));
    lista.appendChild(el('p', 'pista', 'Ganás un punto por cada noche que aguantás: al amanecer, si la base no cayó. Cada habilidad tiene tres niveles y cuestan 1, 2 y 3 puntos.'));
    for (const rama of RAMAS) {
      lista.appendChild(el('h3', '', rama.nombre));
      lista.appendChild(el('p', 'pista', rama.texto));
      const ul = el('ul', 'lista');
      for (const id of IDS_HABILIDAD) {
        if (HABILIDADES[id].rama !== rama.id) continue;
        const n = nivelDe(h, id);
        const b = el('button');
        b.dataset.id = id;
        b.appendChild(el('span', '', HABILIDADES[id].nombre));
        b.appendChild(el('span', 'marca', n >= NIVEL_MAX_HABILIDAD ? 'al máximo' : `nivel ${n} de ${NIVEL_MAX_HABILIDAD}`));
        if (elegida === id) b.setAttribute('aria-current', 'true');
        b.addEventListener('click', (e) => {
          elegida = id;
          foco = e.detail === 0 ? 'subir' : `lista:${id}`;   // (con el teclado, Enter elige y pasa al botón de subir)
          ctx.redibujar();
        });
        const li = el('li'); li.appendChild(b); ul.appendChild(li);
      }
      lista.appendChild(ul);
    }
    lista.onkeydown = (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const botones = [...lista.querySelectorAll('button[data-id]')];
      const i = botones.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      botones[Math.max(0, Math.min(botones.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus();
    };

    // ---- la ficha de la elegida
    const hab = HABILIDADES[elegida], n = nivelDe(h, elegida);
    ficha.appendChild(el('h2', '', hab.nombre));
    ficha.appendChild(el('p', 'anotado', `${RAMAS.find((r) => r.id === hab.rama).nombre} · ${n >= NIVEL_MAX_HABILIDAD ? 'al máximo' : `nivel ${n} de ${NIVEL_MAX_HABILIDAD}`}`));
    ficha.appendChild(el('p', 'texto', hab.descripcion));
    for (let i = 0; i < NIVEL_MAX_HABILIDAD; i++) {
      const hecho = n > i, proximo = n === i;
      const fila = el('p', hecho ? 'texto' : 'pista', `Nivel ${i + 1} (${COSTOS[i]} ${COSTOS[i] === 1 ? 'punto' : 'puntos'}): ${hab.texto[i]}${hecho ? ' · listo' : ''}`);
      if (proximo) fila.style.fontWeight = '600';
      ficha.appendChild(fila);
    }
    const p = puedeSubir(h, elegida), costo = costoSiguiente(h, elegida);
    const boton = el('button', 'boton-lamina', costo === null ? 'Ya está al máximo' : p.ok ? `Subir al nivel ${n + 1} (cuesta ${costo} ${costo === 1 ? 'punto' : 'puntos'})` : `Para el nivel ${n + 1} te ${p.faltan === 1 ? 'falta 1 punto' : `faltan ${p.faltan} puntos`}`);
    boton.dataset.subir = '1';
    boton.disabled = !p.ok;
    boton.addEventListener('click', (e) => { foco = e.detail === 0 ? 'subir' : null; subir(elegida); ctx.redibujar(); });
    ficha.appendChild(boton);
    ficha.appendChild(el('h3', '', 'Lo que sumás ahora'));
    const filas = resumenDeBonos(d);
    if (!filas.length) ficha.appendChild(el('p', 'pista', 'Todavía nada: gastá un punto y se nota enseguida.'));
    for (const f of filas) ficha.appendChild(el('p', 'texto', f));
    if (puntosGastados(h)) ficha.appendChild(el('p', 'pista', `Gastaste ${puntosGastados(h)} de ${puntosGastados(h) + h.puntos} puntos ganados.`));

    // el foco vuelve donde estaba (el cuaderno se redibuja entero)
    if (foco) {
      const f = foco; foco = null;
      const buscar = f === 'subir' ? ficha.querySelector('button[data-subir]:not([disabled])') || lista.querySelector(`button[data-id="${elegida}"]`) : lista.querySelector(`button[data-id="${f.slice(6)}"]`);
      buscar?.focus?.();
    }
  }

  return { dibujarCuaderno, subir, puntos, get elegida() { return elegida; }, elegir(id) { if (IDS_HABILIDAD.includes(id)) elegida = id; } };
}
