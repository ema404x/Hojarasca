// El parte de la partida: cómo te fue, contado en números, cuando se termina el
// Desafío. Módulo puro (se prueba en Node): recibe datos, devuelve filas y HTML.

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plural = (n, uno, muchos) => `${n} ${n === 1 ? uno : muchos}`;

export const NOMBRE_DIFICULTAD = { tranquila: 'Tranquila', normal: 'Normal', implacable: 'Implacable' };

// `obras` son los datos guardados de cada pieza: { plano, etapas }.
export function contarObras(obras = [], planos = {}) {
  let enPie = 0, defensas = 0, refugios = 0;
  for (const o of obras) {
    if (!o || (o.etapas || 0) <= 0) continue;
    enPie++;
    const p = planos[o.plano];
    if (p?.categoria === 'defensa') defensas++;
    if (p?.habitable && o.etapas >= (p.etapas?.length || 1)) refugios++;
  }
  return { enPie, defensas, refugios };
}

export function resumenPartida({ desafio = {}, progreso = {}, planos = {}, logros = {}, dificultad = 'normal', final = false } = {}) {
  const obras = contarObras(progreso.obras || [], planos);
  const materiales = progreso.materiales || {};
  const talados = (progreso.talados || []).length;
  const bloques = [];

  bloques.push({
    titulo: 'La resistencia',
    filas: [
      ['Noches resistidas', String(desafio.noches || 0)],
      ['Mejor racha sin caer', plural(desafio.mejorRacha || 0, 'noche', 'noches')],
      ['Duendes abatidos', String(desafio.abatidos || 0)],
      ...((desafio.abatidosPerro || 0) > 0 ? [['Abatidos por el perro', String(desafio.abatidosPerro)]] : []),
      ['Veces que caíste', String(desafio.derrotas || 0)],
      ['Dificultad', NOMBRE_DIFICULTAD[dificultad] || dificultad],
    ],
  });

  bloques.push({
    titulo: 'Lo que levantaste',
    filas: [
      ['Piezas en pie', String(obras.enPie)],
      ['Defensas', String(obras.defensas)],
      ...(obras.refugios ? [['Refugios terminados', String(obras.refugios)]] : []),
      ['Recetas fabricadas', String((desafio.recetasHechas || []).length)],
      ...((desafio.planos || []).length ? [['Planos de los duendes', String(desafio.planos.length)]] : []),
      ...((desafio.companeros || []).length ? [['Vecinos en la base', String(desafio.companeros.length)]] : []),
    ],
  });

  bloques.push({
    titulo: 'El valle',
    filas: [
      ['Días en el bosque', String(Math.max(1, Math.floor(progreso.dia || 1)))],
      ['Árboles talados', String(talados + (progreso.taladosCerrados || 0))],
      ...(talados ? [['Tocones rebrotando', String(talados)]] : []),
      ['Renovales plantados', String((progreso.renovales || []).length)],
      ['Anotaciones en el cuaderno', String(Object.keys(progreso.entradas || {}).length)],
      ...((progreso.fotos || 0) > 0 ? [['Fotos sacadas', String(progreso.fotos)]] : []),
    ],
  });

  const guardado = ['tronco', 'tabla', 'piedra', 'cristal', 'lana']
    .map((k) => [k, (materiales[k] || 0) + ((progreso.acopio || {})[k] || 0)])
    .filter(([, n]) => n > 0);
  if (guardado.length) {
    const NOMBRES = { tronco: 'Troncos', tabla: 'Tablas', piedra: 'Piedras', cristal: 'Semillas doradas', lana: 'Vellones de lana' };
    bloques.push({ titulo: 'Lo que te queda', filas: guardado.map(([k, n]) => [NOMBRES[k], String(n)]) });
  }

  if (logros.total) {
    bloques.push({ titulo: 'Logros', filas: [['Conseguidos', `${logros.hechos || 0} de ${logros.total}`]] });
  }

  return {
    titulo: final ? 'Se derrumbó la cueva' : 'Cayó el Coihue Viejo',
    bloques,
    linea: `${plural(desafio.noches || 0, 'noche resistida', 'noches resistidas')} · ${desafio.abatidos || 0} duendes abatidos · dificultad ${NOMBRE_DIFICULTAD[dificultad] || dificultad}`,
  };
}

export function htmlParte(resumen) {
  const bloques = resumen.bloques.map((b) => {
    const filas = b.filas.map(([k, v]) => `<div class="parte-fila"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
    return `<div class="parte-bloque"><h3>${esc(b.titulo)}</h3>${filas}</div>`;
  }).join('');
  return `<div class="parte">${bloques}</div>`;
}

// Para guardarlo o pegarlo en algún lado, en texto pelado.
export function textoParte(resumen) {
  const lineas = [resumen.titulo.toUpperCase(), '='.repeat(Math.max(16, resumen.titulo.length))];
  for (const b of resumen.bloques) {
    lineas.push('', b.titulo);
    for (const [k, v] of b.filas) lineas.push(`  ${k.padEnd(28, '.')} ${v}`);
  }
  return lineas.join('\n');
}

export const CSS_PARTE = `
.parte { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px 22px; text-align: left; margin: 6px 0 2px; }
.parte-bloque h3 { margin: 0 0 4px; font-size: 14px; opacity: .72; font-weight: 600; }
.parte-fila { display: flex; justify-content: space-between; gap: 10px; font-size: 14px; line-height: 1.5; }
.parte-fila span { opacity: .82; }
.parte-fila b { font-variant-numeric: tabular-nums; }
`;
