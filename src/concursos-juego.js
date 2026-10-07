// 3.7.5 (noticias): los concursos en el juego (sólo en el Relax). El día de la fiesta que tiene concurso (fiestas.js +
// concursos.js), Nélida anota: al hablarle te dice qué hay que traer y, si lo tenés, te anota (el dulce se lleva el
// frasco; la trucha, el poncho y la foto se muestran y vuelven). A la hora del fallo el jurado da las cintas (lo tuyo, con
// su regalo útil; si no te anotaste, igual te enterás). Las truchas que sacás quedan anotadas para el concurso.
// `ctx`: { progreso(), desafio(), nota(t, sub, nueva), guardar(), cobrar(premio) (el cobrarPremio de main.js),
// redibujar(), nombresFoto() ({ id: nombre } del álbum) }.
import { CONCURSOS, ORGANIZA, HORAS_CONCURSO, concursoDeFecha, entradaDe, inscribir, fallar, juradoDe, textoFallo, noticiaDeResultado, anotarTrucha, sanearConcursos, cintaDe, CINTAS } from './concursos.js';
import { fechaDe as fechaDeFiesta } from './fiestas.js';
import { nombreCortoDe } from './aldea-vida.js';
import { esVecinoAldea } from './aldea.js';
import { gastar } from './cocina-pasos.js';

const minus = (s) => (typeof s === 'string' && s ? s.charAt(0).toLowerCase() + s.slice(1) : '');
const unir = (l) => (l.length < 2 ? l[0] || '' : `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}`);
const nombre = (k) => (k === 'jugador' ? 'vos' : nombreCortoDe(k) || k);

export function crearConcursosJuego(ctx) {
  const progreso = () => ctx.progreso();
  const dia = () => Math.max(1, Math.floor(Number(progreso()?.dia) || 1));
  const hora = () => Number(progreso()?.horas) || 0;
  const activo = () => !ctx.desafio?.() && !!progreso() && !!progreso().aldea;
  const conoce = () => Math.floor(Number(progreso()?.aldea?.descubierta) || 0) > 0;
  const estado = () => {
    const p = progreso();
    if (!p.concursos || typeof p.concursos !== 'object') p.concursos = sanearConcursos(p.concursos, p.dia);
    return p.concursos;
  };
  const presentes = (k) => esVecinoAldea(k) || (progreso()?.aldea?.pobladores || []).some((p) => p?.clave === k);
  const claveDe = (npc) => npc?.claveAldea || npc?.clave || null;
  // El concurso de hoy (o null)
  const deHoy = (d = dia()) => concursoDeFecha(fechaDeFiesta(d), d);
  const yaFallo = (id, d) => (estado().resultados || []).some((r) => r.id === id && r.dia === d);
  let dicho = '';   // lo último que dijo Nélida hoy (para no repetirlo)

  // ---------------------------------------------------------------- hablar con Nélida
  function hablar(npc) {
    if (!activo() || claveDe(npc) !== ORGANIZA) return null;
    const d = dia(), h = hora(), id = deHoy(d);
    if (!id || yaFallo(id, d) || h < HORAS_CONCURSO.desde || h >= HORAS_CONCURSO.fallo) return null;
    const c = CONCURSOS[id], e = estado();
    const jurado = unir(juradoDe(id, d, presentes).map(nombre));
    if (e.inscripto?.dia === d) {
      const marca = `${d}-anotado`;
      if (dicho === marca) return null;
      dicho = marca;
      return { id: 'concurso-anotado', partes: [`Ya estás anotado con ${e.inscripto.que}. A las ${HORAS_CONCURSO.fallo} el jurado (${jurado}) da las cintas. No te pongas nervioso, que se nota.`] };
    }
    const entrada = entradaDe(id, progreso(), e, d, ctx.nombresFoto?.() || {});
    if (!entrada) {
      const marca = `${d}-falta`;
      if (dicho === marca) return null;
      dicho = marca;
      return { id: 'concurso-falta', partes: [`¡Hoy es el ${minus(c.nombre)}! Para anotarte hay que traer ${c.trae}.`, `Tenés hasta las ${HORAS_CONCURSO.fallo}. Los vecinos ya trajeron lo suyo, y vienen bravos.`] };
    }
    return { id: 'concurso-anotar', partes: [
      `¡Hoy es el ${minus(c.nombre)}! Veo que traés ${entrada.que}. ¿Te anoto? Si preferís guardarlo, no pasa nada: seguí de largo.`,
      `Anotado, con ${entrada.que}.${c.gasta ? ' Dejalo en la mesa, que el jurado lo prueba.' : ' Lo mira el jurado y te lo devuelven.'} A las ${HORAS_CONCURSO.fallo} el jurado (${jurado}) da las cintas.`,
    ], alTerminar: () => {
      if (!inscribir(estado(), id, entrada, dia(), hora())) return;
      if (c.gasta) gastar(progreso(), entrada.k, 1);
      dicho = `${dia()}-anotado`;
      ctx.nota(`Te anotaste en el ${minus(c.nombre)}`, `Con ${entrada.que}. El fallo, a las ${HORAS_CONCURSO.fallo}`, true);
      ctx.guardar(); ctx.redibujar?.();
    } };
  }

  // ---------------------------------------------------------------- el fallo, a su hora
  let acum = 0;
  function actualizar(dt) {
    acum += dt;
    if (acum < 0.5) return;
    acum = 0;
    if (!activo() || !conoce()) return;
    const d = dia(), id = deHoy(d);
    if (!id || hora() < HORAS_CONCURSO.fallo || yaFallo(id, d)) return;
    const f = fallar(estado(), id, d, presentes);
    if (!f) return;
    const t = textoFallo(f, nombre);
    ctx.nota(t.titulo, t.texto, true);
    if (f.regalo) ctx.cobrar?.({ premio: f.regalo });
    ctx.guardar(); ctx.redibujar?.();
  }

  // Una trucha sacada (main.js, al atrapar)
  function delPez(pez) {
    if (!activo()) return;
    anotarTrucha(estado(), pez, dia());
  }

  // Lo último que se falló (para la radio y el diario: de hoy o de ayer)
  function noticiaReciente(d = dia()) {
    const r = [...(estado().resultados || [])].reverse().find((x) => d - x.dia <= 1);
    return r ? noticiaDeResultado(r, nombre) : null;
  }

  // ---------------------------------------------------------------- en el cuaderno (dentro de «Noticias»)
  function dibujarCuaderno(ficha, el) {
    const e = estado();
    ficha.appendChild(el('h3', '', 'Concursos y cintas'));
    ficha.appendChild(el('p', 'texto', `En las fiestas hay concurso: ${Object.values(CONCURSOS).map((c) => minus(c.nombre)).join(', ')}. Anota Nélida desde las ${HORAS_CONCURSO.desde}; a las ${HORAS_CONCURSO.fallo}, un jurado de tres vecinos da la ${CINTAS.map((c) => c.nombre).join(', la ')} y las de mención.`));
    const id = deHoy();
    if (id && !yaFallo(id, dia())) ficha.appendChild(el('p', 'pista', e.inscripto?.dia === dia() ? `Hoy: ${minus(CONCURSOS[id].nombre)}. Estás anotado con ${e.inscripto.que}.` : `Hoy: ${minus(CONCURSOS[id].nombre)}. Traé ${CONCURSOS[id].trae} y hablale a Nélida.`));
    if (e.cintas.length) {
      const ul = el('ul', 'lista');
      for (const c of [...e.cintas].reverse()) ul.appendChild(el('li', c.puesto ? 'tiene' : '', `Día ${c.dia}: ${cintaDe(c.puesto).nombre} (${cintaDe(c.puesto).texto}) en el ${minus(CONCURSOS[c.id].nombre)}, con ${c.que}`));
      ficha.appendChild(ul);
    } else ficha.appendChild(el('p', 'texto', 'Todavía no tenés ninguna cinta.'));
    const ult = [...(e.resultados || [])].reverse().slice(0, 3);
    for (const r of ult) { const t = noticiaDeResultado(r, nombre); if (t) ficha.appendChild(el('p', 'texto', `Día ${r.dia}: ${t}`)); }
  }

  return { activo, hablar, actualizar, delPez, noticiaReciente, dibujarCuaderno, deHoy, estado: () => estado() };
}
