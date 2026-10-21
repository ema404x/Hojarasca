// 3.1: el desafío del día, en el juego. Junta las reglas (diarios.js) con lo que main.js le
// pasa: la partida, las notas y el guardado. main.js sólo llama a `actualizar` (cada cuadro
// jugando), `pez` y `obraTerminada` (los enganches) y abre el panel.
//
// El desafío del día es del Relax (en el Desafío, la noche es otra cosa).
// 4.5.1: se sacaron las carreras contrarreloj (los postes de largada, las puertas, el fantasma) y el torneo de la semana:
// queda sólo el desafío del día (pesca, obra y trochita). Las partidas viejas traen `carreras`: guardado.js lo descarta.
import { desafioDelDia, fechaTexto, diariosNuevo, avanzarDiario, rachaVigente, textoAvance } from './diarios.js';

export const CSS_MODOS = `
.modos31 h3 { margin: 18px 0 6px; }
.modos31 .dato { opacity: .8; font-size: .92em; margin: 2px 0; }
`;

const el = (tag, clase = '', texto = '') => {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto) n.textContent = texto;
  return n;
};

export function crearModos(ctx) {
  const { esDesafio = false } = ctx;
  const nota = (a, b, n) => ctx.nota?.(a, b, n);
  const ahora = () => (typeof ctx.ahora === 'function' ? ctx.ahora() : new Date());
  let fechaForzada = null;
  const hoy = () => fechaForzada || fechaTexto(ahora());

  // lo de la partida (guardado.js lo sanea al cargar; una partida nueva no lo trae)
  const diarios = () => { const p = ctx.progreso(); if (!p.diarios || typeof p.diarios !== 'object') p.diarios = diariosNuevo(); return p.diarios; };

  function pitido(frec, dur = 0.18) {
    try { ctx.sonido?.tono?.({ frec, fin: frec, dur, tipo: 'triangle', vol: 0.12, destino: ctx.sonido?.bus?.efectos }); } catch {}
  }

  // ---------------------------------------------------------------- el desafío del día
  function alDiario(r) {
    if (!r) return;
    if (r.cumplido) {
      const racha = diarios().racha;
      nota('¡Desafío del día cumplido!', `+${r.puntos} puntos · racha de ${racha} ${racha === 1 ? 'día' : 'días'}`, true);
      pitido(1320, 0.6);
      ctx.guardar?.();
      pintarPortada();
    } else if (r.avance) {
      const def = desafioDelDia(hoy());
      nota('Desafío del día', `${r.avance} de ${def.n}`);
    } else if (r.tarde) nota('Desafío del día', 'Terminada, pero ya cayó el sol: mañana hay otro');
  }
  function pez(p) {
    if (esDesafio || !p) return;
    alDiario(avanzarDiario(diarios(), desafioDelDia(hoy()), { tipo: 'pez', id: p.id, cm: p.cm }));
  }
  function obraTerminada(plano, horas) {
    if (esDesafio) return;
    alDiario(avanzarDiario(diarios(), desafioDelDia(hoy()), { tipo: 'obra', plano, horas }));
  }
  function revisarContadores() {
    if (esDesafio) return;
    const def = desafioDelDia(hoy());
    if (def.tipo === 'tren') alDiario(avanzarDiario(diarios(), def, { tipo: 'entregas', valor: ctx.progreso()?.comercio?.entregas || 0 }));
  }

  // ---------------------------------------------------------------- cada cuadro
  let relojContadores = 0;
  function actualizar(dt) {
    relojContadores += dt;
    if (relojContadores > 1) { relojContadores = 0; revisarContadores(); }
  }

  // ---------------------------------------------------------------- la portada y el panel
  function textoPortada() {
    const def = desafioDelDia(hoy());
    if (esDesafio) return `Desafío del día (en el Relax): ${def.titulo}`;
    const d = diarios();
    const racha = rachaVigente(d, hoy());
    return `Desafío del día: ${def.titulo} · ${textoAvance(d, def)}${racha ? ` · racha de ${racha} ${racha === 1 ? 'día' : 'días'}` : ''}`;
  }
  function pintarPortada() {
    const p = document.getElementById('diario-portada');
    if (p) p.textContent = textoPortada();
  }
  const panel = () => document.getElementById('modos31');
  const panelAbierto = () => !!panel() && !panel().classList.contains('oculto');
  let origenPanel = null;
  function abrirPanel(origen) {
    origenPanel = origen;
    if (origen) document.getElementById(origen)?.classList.add('oculto');
    dibujarPanel();
    panel()?.classList.remove('oculto');
  }
  function cerrarPanel() {
    panel()?.classList.add('oculto');
    if (origenPanel) document.getElementById(origenPanel)?.classList.remove('oculto');
    origenPanel = null;
    pintarPortada();
  }
  function dibujarPanel() {
    const cont = document.getElementById('modos31-contenido');
    if (!cont) return;
    cont.textContent = '';
    cont.classList.add('modos31');
    const def = desafioDelDia(hoy());
    cont.appendChild(el('h3', '', `Desafío del día · ${def.fecha}`));
    cont.appendChild(el('p', '', def.titulo));
    cont.appendChild(el('p', 'dato', def.texto));
    if (esDesafio) cont.appendChild(el('p', 'dato', 'Se juega en el Relax: el mismo para todos los que jueguen hoy.'));
    else {
      const d = diarios();
      cont.appendChild(el('p', 'dato', `${textoAvance(d, def)} · racha: ${rachaVigente(d, hoy())} · mejor racha: ${d.mejorRacha} · ${d.total} puntos en total`));
    }
    ctx.traducir?.(cont);
  }

  // al arrancar: la portada
  pintarPortada();

  return {
    actualizar, pez, obraTerminada, abrirPanel, cerrarPanel, panelAbierto, textoPortada, pintarPortada,
    // para las pruebas (?debug=1)
    __: {
      estado: () => ({ fecha: hoy(), diarios: diarios() }),
      fecha: (f) => { fechaForzada = f || null; pintarPortada(); },
      desafio: (f) => desafioDelDia(f || hoy()),
      dibujarPanel,
    },
  };
}
