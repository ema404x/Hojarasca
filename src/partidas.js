// El menú de partidas: tres ranuras por modo, con día, hora y una miniatura.
// Módulo puro (se prueba en Node): arma el HTML, no toca el almacenamiento.

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function horaCorta(h) {
  const hh = Math.floor(((h % 24) + 24) % 24);
  const mm = Math.floor((((h % 24) + 24) % 24 - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function textoPartida(p) {
  if (!p.hay) return 'Vacía';
  const partes = [`Día ${p.dia}`, horaCorta(p.horas)];
  if (p.modo === 'desafio') partes.push(`${p.noches} ${p.noches === 1 ? 'noche' : 'noches'}`);
  else partes.push(`${p.anotaciones} ${p.anotaciones === 1 ? 'anotación' : 'anotaciones'}`);
  return partes.join(' · ');
}

export function fechaCorta(ms, ahora = Date.now()) {
  if (!ms) return '';
  const dias = Math.floor((ahora - ms) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;
  return `hace ${Math.floor(dias / 30)} ${Math.floor(dias / 30) === 1 ? 'mes' : 'meses'}`;
}

export function htmlPartidas(lista, modo, actual, ahora = Date.now()) {
  const nombreModo = modo === 'desafio' ? 'Desafío' : 'Relax';
  const filas = lista.map((p) => {
    const esActual = p.ranura === actual;
    const vista = p.hay && p.vista
      ? `<img src="${esc(p.vista)}" alt="">`
      : `<span class="sin-vista">${p.hay ? 'sin foto' : '—'}</span>`;
    const acciones = [
      `<button data-partida-jugar="${p.ranura}">${p.hay ? (esActual ? 'Seguir acá' : 'Cargar') : 'Empezar acá'}</button>`,
      p.hay ? `<button data-partida-exportar="${p.ranura}">Exportar</button>` : '',
      `<button data-partida-importar="${p.ranura}">Importar acá</button>`,
      p.hay ? `<button class="borrar" data-partida-borrar="${p.ranura}">Borrar</button>` : '',
    ].join('');
    return `<div class="partida${esActual ? ' actual' : ''}">
      <div class="vista">${vista}</div>
      <div class="datos"><b>Partida ${p.ranura}${esActual ? ' · en uso' : ''}</b>
        <span>${esc(textoPartida(p))}</span>
        <small>${esc(p.hay ? fechaCorta(p.guardadoEn, ahora) : 'lugar libre')}</small></div>
      <div class="acciones-partida">${acciones}</div>
    </div>`;
  }).join('');
  return `<p class="sub-partidas">Tres partidas para el modo ${esc(nombreModo)}. El otro modo tiene las suyas.</p><div class="partidas">${filas}</div>`
    + '<p class="sub-partidas">Exportar deja un archivo que podés llevarte a otra computadora y volver a importar acá.</p>';
}

export const CSS_PARTIDAS = `
#partidas .panel-modal { max-width: 620px; width: calc(100vw - 32px); }
.sub-partidas { opacity: .75; font-size: 14px; margin: 0 0 12px; }
.partidas { display: grid; gap: 10px; }
.partida { display: grid; grid-template-columns: 112px 1fr auto; gap: 12px; align-items: center; padding: 8px; border-radius: 10px; background: rgba(255,255,255,.05); }
.partida.actual { outline: 2px solid currentColor; }
.partida .vista { width: 112px; height: 63px; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.28); }
.partida .vista img { width: 100%; height: 100%; object-fit: cover; }
.partida .sin-vista { font-size: 12px; opacity: .5; }
.partida .datos { display: flex; flex-direction: column; gap: 2px; font-size: 14px; }
.partida .datos small { opacity: .6; }
.acciones-partida { display: flex; flex-direction: column; gap: 6px; }
.acciones-partida button { padding: 5px 12px; font-size: 13px; white-space: nowrap; }
.acciones-partida .borrar { opacity: .7; }
`;
