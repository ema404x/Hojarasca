// El cuaderno para compartir: el álbum de fotos, el diario y lo anotado, en una sola
// página HTML que se abre en cualquier navegador, se manda por correo o se imprime.
// Todo va adentro del archivo —las fotos también—, así que no depende de nada.
//
// Módulo puro (se prueba en Node): arma el texto; main.js lo baja como archivo.

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hora = (h) => {
  const x = ((Number(h) || 0) % 24 + 24) % 24;
  return `${String(Math.floor(x)).padStart(2, '0')}:${String(Math.floor((x % 1) * 60)).padStart(2, '0')}`;
};
// Sólo imágenes de verdad: nada de meter otra cosa en un src.
const imagenValida = (s) => typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s);

// `desafios`: la lista de fotos del juego (fotos.js). `secciones` y `entradas`: las del
// cuaderno (cuaderno.js). `progreso`: la partida.
export function datosAlbum({ progreso, desafios = [], secciones = [], entradas = [] }) {
  const p = progreso || {};
  const fotos = desafios
    .filter((d) => p.desafios?.[d.id])
    .map((d) => ({ id: d.id, nombre: d.nombre, texto: d.texto, dia: p.desafios[d.id].dia, hora: p.desafios[d.id].hora, img: imagenValida(p.desafios[d.id].img) ? p.desafios[d.id].img : null }))
    .sort((a, b) => (a.dia - b.dia) || (a.hora - b.hora));
  const diario = (Array.isArray(p.diario) ? p.diario : []).filter((x) => x && typeof x.texto === 'string');
  const anotado = secciones.map((s) => ({
    nombre: s.nombre,
    items: entradas.filter((e) => e.seccion === s.id && p.entradas?.[e.id]).map((e) => e.nombre),
  })).filter((s) => s.items.length);
  return { dia: Number(p.dia) || 1, fotos, diario, anotado, anotaciones: Object.keys(p.entradas || {}).length };
}

// `t` es el traductor del juego: para el que juega en inglés, la página sale en inglés.
export function htmlAlbum(datos, { titulo = 'Cuaderno de campo', version = '', t = (x) => x } = {}) {
  const d = datos;
  const fotos = d.fotos.map((f) => `
    <figure>
      ${f.img ? `<img src="${f.img}" alt="${esc(f.nombre)}">` : `<div class="sin-foto">${esc(t('sin la foto'))}</div>`}
      <figcaption><b>${esc(t(f.nombre))}</b><span>${esc(t(`Día ${f.dia}, ${hora(f.hora)}`))}</span><i>${esc(t(f.texto))}</i></figcaption>
    </figure>`).join('');
  const diario = d.diario.map((x) => `
    <article><h3>${esc(t(`Día ${x.dia}`))}${x.estacion ? ` · <span>${esc(t(x.estacion))}</span>` : ''}</h3><p>${esc(t(x.texto))}</p></article>`).join('');
  const anotado = d.anotado.map((s) => `
    <section><h3>${esc(t(s.nombre))}</h3><p>${s.items.map((i) => esc(t(i))).join(' · ')}</p></section>`).join('');
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t(titulo))} · Hojarasca</title>
<style>
  :root { --papel: #efe6d2; --tinta: #3a2a1a; --musgo: #4f6a3a; --sombra: #d6c8a8; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #2a241c; color: var(--tinta); font-family: Georgia, 'Times New Roman', serif; line-height: 1.5; }
  main { max-width: 900px; margin: 0 auto; padding: 32px 20px 64px; background: var(--papel); min-height: 100vh; }
  h1 { font-size: 2.2em; margin: 0; color: var(--musgo); font-weight: normal; font-style: italic; }
  .sub { margin: 4px 0 28px; opacity: .75; }
  h2 { font-weight: normal; font-style: italic; border-bottom: 1px solid var(--sombra); padding-bottom: 4px; margin: 36px 0 16px; color: var(--musgo); }
  .fotos { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 18px; }
  figure { margin: 0; background: #fbf7ee; padding: 8px 8px 12px; box-shadow: 0 2px 6px rgba(0,0,0,.18); transform: rotate(-.4deg); }
  figure:nth-child(2n) { transform: rotate(.5deg); }
  figure img { width: 100%; display: block; }
  .sin-foto { aspect-ratio: 16/9; display: grid; place-items: center; background: var(--sombra); opacity: .6; }
  figcaption { display: grid; gap: 2px; margin-top: 8px; font-size: .92em; }
  figcaption span { opacity: .65; font-size: .9em; }
  figcaption i { opacity: .8; }
  article { margin: 0 0 18px; }
  article h3, section h3 { margin: 0 0 4px; font-size: 1em; color: var(--musgo); }
  article h3 span { font-weight: normal; opacity: .7; }
  section { margin: 0 0 14px; }
  footer { margin-top: 48px; opacity: .55; font-size: .85em; text-align: center; }
  @media print { body { background: none; } main { box-shadow: none; } figure { break-inside: avoid; } }
</style></head>
<body><main>
<h1>${esc(t(titulo))}</h1>
<p class="sub">${esc(t(`Día ${d.dia} en el valle · ${d.anotaciones} ${d.anotaciones === 1 ? 'anotación' : 'anotaciones'} · ${d.fotos.length} ${d.fotos.length === 1 ? 'foto' : 'fotos'}`))}</p>
${d.fotos.length ? `<h2>${esc(t('El álbum'))}</h2><div class="fotos">${fotos}</div>` : ''}
${d.diario.length ? `<h2>${esc(t('El diario'))}</h2>${diario}` : ''}
${d.anotado.length ? `<h2>${esc(t('Lo anotado'))}</h2>${anotado}` : ''}
<footer>Hojarasca${version ? ` ${esc(version)}` : ''} · ${esc(t('un bosque andino patagónico'))}</footer>
</main></body></html>`;
}

export function nombreArchivoAlbum(progreso) {
  return `hojarasca-cuaderno-dia-${Math.max(1, Math.floor(Number(progreso?.dia) || 1))}.html`;
}
