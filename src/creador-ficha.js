// 4.1 (F2): la ficha de Bruno Castellanos, para la pestaña «Bruno» del cuaderno. Módulo puro al importarse: sólo usa `el` (el creador de nodos del cuaderno) adentro.
// Es de sólo lectura: lo elegido al crear el carácter queda fijo y el aspecto se rehace en el espejo. Los textos salen de creador-textos.js (propuestos por Claude, a revisar por el usuario).
import { fichaDeBruno } from './creador-textos.js';

// `lista`: la columna de la izquierda del cuaderno; `ficha`: la hoja de la derecha; `el(tag, clase, texto)`; `desafio`: en el Desafío los rasgos no valen.
export function dibujarFichaBruno(lista, ficha, el, bruno, desafio = false) {
  const f = fichaDeBruno(bruno);
  lista.appendChild(el('p', 'pista', 'Quién sos en el valle. Lo que elegiste del carácter queda fijo; el aspecto se rehace en el espejo del refugio.'));
  ficha.appendChild(el('h2', '', f.nombre));
  ficha.appendChild(el('p', 'anotado', `${f.edad} años`));
  if (f.retrato) {
    const img = el('img', 'retrato-bruno');
    img.src = f.retrato; img.alt = `Retrato de ${f.nombre}`; img.width = 120; img.height = 150;
    img.style.cssText = 'float:right;margin:0 0 8px 14px;border:2px solid #b49a6a;border-radius:4px;background:#e7cfa0';
    ficha.appendChild(img);
  }
  ficha.appendChild(el('p', 'texto', f.presentacion));
  for (const [titulo, valor, frase] of f.datos) {
    const p = el('p', 'texto');
    p.appendChild(el('strong', '', `${titulo}: `));
    p.appendChild(document.createTextNode(valor));
    if (frase) p.appendChild(el('span', 'anotado', ` · ${frase}`));
    ficha.appendChild(p);
  }
  const bloque = (titulo, items, clase) => {
    if (!items.length) return;
    ficha.appendChild(el('h3', '', titulo));
    const ul = el('ul', clase);
    for (const t of items) ul.appendChild(el('li', '', t));
    ficha.appendChild(ul);
  };
  bloque('A su favor', f.pros, 'bruno-pros');
  bloque('En su contra', f.contras, 'bruno-contras');
  for (const a of f.avisos) ficha.appendChild(el('p', 'pista', a));
  if (desafio) ficha.appendChild(el('p', 'pista', 'En La noche de los duendes estos rasgos no cambian nada: sólo valen en el Relax.'));
}
