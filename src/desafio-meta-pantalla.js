// 4.10 partidas: la pantalla de «Nueva partida» del Desafío (ventajas, reglas a elección y modo, todo en una sola) y la hoja
// de «Partidas y finales» del cuaderno. Es DOM sin three; la lógica (costos, máximo, incompatibilidades) está en desafio-meta.js.
// Sólo teclado y ratón: botones que se alcanzan con Tab o con las flechas, Enter o clic para elegir, Esc para volver.
import {
  MODOS, VENTAJAS, REGLAS, TIPOS_VENTAJA, CLAVES_VENTAJA, CLAVES_REGLA, MAX_VENTAJAS, validarEleccion, multiplicadorDe, textoMult, textoSemillas,
  resumenFinales, lineaRecordMeta, sanearMeta, CLAVES_MODO,
} from './desafio-meta.js';

const nodo = (tag, clase, texto) => { const n = document.createElement(tag); if (clase) n.className = clase; if (texto !== undefined) n.textContent = texto; return n; };

// `api`: { leerMeta(), esSinFin(), modoInicial(), alEmpezar(eleccion), alVolver(), traducir(el) }
export function crearPantallaNuevaPartida(api) {
  const velo = document.getElementById('nueva-partida');
  const cont = document.getElementById('np-contenido');
  let eleccion = { modo: 'normal', ventajas: [], reglas: [] };

  function alternar(lista, k, max = 99) {
    const i = lista.indexOf(k);
    if (i >= 0) lista.splice(i, 1);
    else if (lista.length < max) lista.push(k);
  }
  function chip(clave, def, activo, bloqueado, nota) {
    const b = nodo('button', 'np-chip');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(activo));
    b.dataset.clave = clave;
    if (bloqueado) { b.disabled = true; b.title = bloqueado; }
    b.appendChild(nodo('b', '', def.nombre));
    b.appendChild(nodo('span', '', def.texto));
    if (nota) b.appendChild(nodo('i', '', nota));
    return b;
  }
  function dibujar(foco = null) {
    const meta = sanearMeta(api.leerMeta());
    const sinFin = api.esSinFin();
    if (sinFin) eleccion.modo = 'sinfin';
    else if (eleccion.modo === 'sinfin') eleccion.modo = 'normal';
    if (eleccion.modo === 'pesadilla' && !meta.desbloqueos.pesadilla) eleccion.modo = 'normal';
    const v = validarEleccion(meta, eleccion);
    cont.innerHTML = '';
    cont.appendChild(nodo('h2', '', 'Nueva partida'));
    cont.appendChild(nodo('p', 'sub', `Tenés ${textoSemillas(meta.semillas)}. Se gana una por cada partida que termines, ganada o perdida, con al menos tres noches resistidas.`));

    // el modo
    cont.appendChild(nodo('h3', '', 'Cómo jugar'));
    const seg = nodo('div', 'segmentos np-modos');
    seg.setAttribute('role', 'group');
    for (const k of sinFin ? ['sinfin'] : ['normal', 'corta', 'pesadilla']) {
      const b = nodo('button', '', MODOS[k].nombre);
      b.type = 'button'; b.dataset.modo = k;
      const bloq = k === 'pesadilla' && !meta.desbloqueos.pesadilla;
      b.setAttribute('aria-pressed', String(eleccion.modo === k));
      if (bloq) { b.disabled = true; b.title = 'Se desbloquea al ganar la campaña una vez'; b.textContent = `${MODOS[k].nombre} (bloqueada)`; }
      b.addEventListener('click', () => { eleccion.modo = k; dibujar(`m:${k}`); });
      seg.appendChild(b);
    }
    cont.appendChild(seg);
    cont.appendChild(nodo('p', 'np-modo-texto', MODOS[eleccion.modo].texto));

    // las ventajas
    cont.appendChild(nodo('h3', '', `Ventajas (hasta ${MAX_VENTAJAS})`));
    for (const tipo of Object.keys(TIPOS_VENTAJA)) {
      const grupo = nodo('div', 'np-grupo');
      grupo.appendChild(nodo('h4', '', TIPOS_VENTAJA[tipo]));
      const caja = nodo('div', 'np-chips');
      for (const k of CLAVES_VENTAJA.filter((c) => VENTAJAS[c].tipo === tipo)) {
        const def = VENTAJAS[k];
        const activo = eleccion.ventajas.includes(k);
        let bloq = '';
        if (!activo && eleccion.ventajas.length >= MAX_VENTAJAS) bloq = `Ya elegiste ${MAX_VENTAJAS} ventajas`;
        else if (!activo && def.costo > meta.semillas - eleccion.ventajas.reduce((n, c) => n + VENTAJAS[c].costo, 0)) bloq = 'No te alcanzan las semillas';
        else if (!activo) {
          const t = validarEleccion({ ...meta, semillas: 99 }, { ...eleccion, ventajas: [...eleccion.ventajas, k] });
          if (!t.ok) bloq = t.motivo;
        }
        const nota = def.costo ? textoSemillas(def.costo) : `suma ${textoMult(1 + def.mult)} a los puntos`;
        const b = chip(k, def, activo, bloq, nota);
        b.addEventListener('click', () => { alternar(eleccion.ventajas, k, MAX_VENTAJAS); dibujar(`v:${k}`); });
        caja.appendChild(b);
      }
      grupo.appendChild(caja);
      cont.appendChild(grupo);
    }

    // las reglas
    cont.appendChild(nodo('h3', '', 'Reglas a elección'));
    cont.appendChild(nodo('p', 'np-modo-texto', 'Cada regla que prendas suma puntos a tu récord.'));
    const cajaR = nodo('div', 'np-chips');
    for (const k of CLAVES_REGLA) {
      const def = REGLAS[k];
      const activo = eleccion.reglas.includes(k);
      let bloq = '';
      if (!activo) {
        const t = validarEleccion({ ...meta, semillas: 99 }, { ...eleccion, reglas: [...eleccion.reglas, k] });
        if (!t.ok && !/Sólo se pueden/.test(t.motivo)) bloq = t.motivo;
      }
      const b = chip(k, def, activo, bloq, `suma ${textoMult(1 + def.mult)}`);
      b.addEventListener('click', () => { alternar(eleccion.reglas, k); dibujar(`r:${k}`); });
      cajaR.appendChild(b);
    }
    cont.appendChild(cajaR);

    // el resumen y los botones
    const mult = multiplicadorDe(eleccion.ventajas, eleccion.reglas);
    cont.appendChild(nodo('p', 'np-resumen', `Puntos del récord ${textoMult(mult)} · se gastan ${textoSemillas(v.costo)}${v.ok ? '' : ` · ${v.motivo}`}`));
    // el récord de este modo
    const rec = meta.records[eleccion.modo] || [];
    if (rec.length) {
      cont.appendChild(nodo('h3', '', `Tus mejores · ${MODOS[eleccion.modo].nombre}`));
      const ol = nodo('ol', 'corrida-lista');
      rec.slice(0, 5).forEach((r, i) => ol.appendChild(nodo('li', '', lineaRecordMeta(r, i).replace(/^\d+\. /, ''))));
      cont.appendChild(ol);
    }
    const acc = nodo('div', 'acciones-modal');
    const bE = nodo('button', 'np-empezar', 'Empezar');
    bE.type = 'button'; bE.disabled = !v.ok;
    bE.addEventListener('click', () => { if (!v.ok) return; cerrar(); api.alEmpezar({ modo: eleccion.modo, ventajas: [...eleccion.ventajas], reglas: [...eleccion.reglas] }); });
    const bV = nodo('button', '', 'Volver');
    bV.type = 'button';
    bV.addEventListener('click', () => { cerrar(); api.alVolver(); });
    acc.appendChild(bE); acc.appendChild(bV);
    cont.appendChild(acc);
    api.traducir?.(cont);
    // el foco vuelve al botón que se tocó (con el teclado no se pierde el lugar)
    const buscar = foco && (foco.startsWith('m:') ? `[data-modo="${foco.slice(2)}"]` : `[data-clave="${foco.slice(2)}"]`);
    const el = (buscar && cont.querySelector(buscar)) || cont.querySelector('.np-empezar');
    try { (el && !el.disabled ? el : cont.querySelector('.np-empezar'))?.focus({ preventScroll: true }); } catch { /* sin foco */ }
  }
  function abierta() { return !velo.classList.contains('oculto'); }
  function abrir() {
    eleccion = { modo: api.modoInicial?.() || 'normal', ventajas: [], reglas: [] };
    velo.classList.remove('oculto');
    dibujar(null);
  }
  function cerrar() { velo.classList.add('oculto'); }
  // flechas para pasar de un botón al otro, Esc para volver
  document.addEventListener('keydown', (e) => {
    if (!abierta()) return;
    if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(); api.alVolver(); return; }
    if (e.code === 'ArrowDown' || e.code === 'ArrowUp' || e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
      const bs = [...cont.querySelectorAll('button:not(:disabled)')];
      const i = bs.indexOf(document.activeElement);
      const sig = e.code === 'ArrowDown' || e.code === 'ArrowRight' ? 1 : -1;
      e.preventDefault(); e.stopPropagation();
      bs[(Math.max(0, i) + (i < 0 ? 0 : sig) + bs.length) % bs.length]?.focus();
    }
  }, true);
  return { abrir, cerrar, abierta, eleccion: () => eleccion };
}

// ---------------------------------------------------------------- el cuaderno: «Partidas» (semillas, finales y récords)
export function dibujarHojaPartidas(ficha, el, meta) {
  const m = sanearMeta(meta);
  const fin = resumenFinales(m);
  ficha.appendChild(el('h2', '', 'Partidas y finales'));
  ficha.appendChild(el('p', 'anotado', `${textoSemillas(m.semillas)} · ${m.partidas} ${m.partidas === 1 ? 'partida terminada' : 'partidas terminadas'}`));
  ficha.appendChild(el('p', 'texto', m.desbloqueos.pesadilla ? 'La pesadilla está desbloqueada: la elegís al empezar una partida.' : 'Ganá la campaña una vez y se desbloquea la pesadilla.'));
  ficha.appendChild(el('h3', '', `Finales vistos: ${fin.vistos} de ${fin.total}`));
  const ul = el('ul', 'lista-finales');
  for (const f of fin.lista) ul.appendChild(el('li', f.visto ? '' : 'pendiente', f.visto ? f.nombre : '¿?'));
  ficha.appendChild(ul);
  ficha.appendChild(el('p', 'pista', 'El final depende de cómo juegues: cuántos vecinos te ayudaron, si la base cayó y si se perdió algún lugar de la aldea.'));
  for (const k of CLAVES_MODO) {
    const rec = m.records[k] || [];
    if (!rec.length) continue;
    ficha.appendChild(el('h3', '', `Récords · ${MODOS[k].nombre}`));
    const ol = el('ol', 'corrida-lista');
    rec.forEach((r, i) => ol.appendChild(el('li', '', lineaRecordMeta(r, i).replace(/^\d+\. /, ''))));
    ficha.appendChild(ol);
  }
}
