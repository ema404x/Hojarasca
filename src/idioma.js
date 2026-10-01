// El juego está escrito en castellano: los textos viven al lado del código que los usa,
// que es lo que hace que suenen a alguien y no a una planilla. Para el inglés, en vez de
// arrancar todo de raíz, se traduce en la salida: un diccionario castellano → inglés que
// se aplica donde el texto llega a la pantalla.
// Módulo puro (se prueba en Node): acá no hay DOM salvo en `traducirDom`, que recibe el
// nodo desde afuera.

export const IDIOMAS = [
  { id: 'es', nombre: 'Español' },
  { id: 'en', nombre: 'English' },
];

export const esIdioma = (id) => IDIOMAS.some((i) => i.id === id);

// Los textos se comparan sin importar espacios de más ni saltos de línea: el mismo
// texto escrito en dos líneas en el HTML tiene que encontrar su traducción.
export function normalizar(texto) {
  return String(texto ?? '').replace(/\s+/g, ' ').trim();
}

// Un molde es un texto con huecos: «Talar el árbol ({0}/{1})». Se compila a una
// expresión regular que, además de reconocerlo, saca lo que había en cada hueco.
function compilarMolde(molde) {
  const partes = molde.split(/(\{\d+\})/);
  let re = '^';
  const orden = [];
  for (const p of partes) {
    const hueco = /^\{(\d+)\}$/.exec(p);
    if (hueco) { orden.push(Number(hueco[1])); re += '([\\s\\S]*?)'; }
    else re += p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return { re: new RegExp(re + '$'), orden };
}

export function crearTraductor(diccionario = {}, idioma = 'es') {
  const exactos = new Map();
  const moldes = [];
  const faltantes = new Map();
  for (const [es, en] of Object.entries(diccionario)) {
    const clave = normalizar(es);
    if (!clave || !en) continue;
    // `conTexto`: el molde tiene palabras propias, no sólo huecos y signos. Uno como
    // «{0} {1}» calza con cualquier cosa, y adentro de un hueco rompería más de lo que arregla.
    if (/\{\d+\}/.test(clave)) moldes.push({ ...compilarMolde(clave), en, largo: clave.length, conTexto: /[a-záéíóúñü]{2,}/i.test(clave.replace(/\{\d+\}/g, '')) });
    else exactos.set(clave, en);
  }
  // Los moldes más largos primero: el más específico gana.
  moldes.sort((a, b) => b.largo - a.largo);

  // 2.0: lo que cae en un hueco también se traduce, si el diccionario lo tiene. «Se oye
  // {0}, {1}, hacia el {2}.» llega con «un chucao», «lejos» y «oeste» adentro, y en
  // inglés tienen que salir «a chucao», «far» y «west». Sólo textos (un número queda
  // como está), sólo más cortos que el entero (así no se muerde la cola) y sin anotar
  // como faltante lo que no se encontró: un hueco puede ser un nombre propio.
  function hueco(texto, largoEntero) {
    const c = normalizar(texto);
    if (!c || c.length >= largoEntero || !/[a-záéíóúñü]/i.test(c)) return texto;
    const directo = exactos.get(c);
    if (directo) return conMismoBorde(texto, c, directo);
    for (const m of moldes) {
      if (!m.conTexto) continue;
      const r = m.re.exec(c);
      if (r) return conMismoBorde(texto, c, rellenar(m, r, c.length));
    }
    return texto;
  }
  function rellenar(m, r, largo) {
    let salida = m.en;
    m.orden.forEach((n, i) => { salida = salida.split(`{${n}}`).join(hueco(r[i + 1], largo)); });
    return salida;
  }

  function t(texto) {
    if (idioma === 'es' || texto == null) return texto;
    const original = String(texto);
    const clave = normalizar(original);
    if (!clave) return texto;
    const directo = exactos.get(clave);
    if (directo) return conMismoBorde(original, clave, directo);
    for (const m of moldes) {
      const r = m.re.exec(clave);
      if (!r) continue;
      return conMismoBorde(original, clave, rellenar(m, r, clave.length));
    }
    if (!faltantes.has(clave)) faltantes.set(clave, 0);
    faltantes.set(clave, faltantes.get(clave) + 1);
    return texto;
  }

  // Si el original venía con espacios alrededor (pasa mucho en el HTML), se respetan.
  function conMismoBorde(original, clave, traducido) {
    const antes = /^\s*/.exec(original)[0];
    const despues = /\s*$/.exec(original)[0];
    return antes + traducido + despues;
  }

  return {
    t,
    idioma,
    get faltantes() { return [...faltantes.entries()].sort((a, b) => b[1] - a[1]); },
    cuantos: exactos.size + moldes.length,
  };
}

// Atributos de texto que también hay que traducir cuando se recorre el árbol.
const ATRIBUTOS = ['placeholder', 'title', 'aria-label', 'alt'];
const NO_ENTRAR = new Set(['SCRIPT', 'STYLE', 'CANVAS', 'TEXTAREA', 'CODE', 'PRE']);

// Recorre un nodo y traduce lo que se lee. Se llama después de dibujar cada panel.
export function traducirDom(raiz, t, doc = (typeof document !== 'undefined' ? document : null)) {
  if (!raiz || !doc || typeof doc.createTreeWalker !== 'function') return 0;
  let cambiados = 0;
  const caminante = doc.createTreeWalker(raiz, 1 | 4 /* elementos y texto */, {
    acceptNode(n) {
      if (n.nodeType === 1) return NO_ENTRAR.has(n.tagName) ? 2 /* rechazar */ : 1;
      return n.nodeValue && n.nodeValue.trim() ? 1 : 2;
    },
  });
  let n = caminante.currentNode;
  while (n) {
    if (n.nodeType === 3) {
      const nuevo = t(n.nodeValue);
      if (nuevo !== n.nodeValue) { n.nodeValue = nuevo; cambiados++; }
    } else if (n.nodeType === 1 && n.getAttribute) {
      for (const a of ATRIBUTOS) {
        const v = n.getAttribute(a);
        if (!v) continue;
        const nuevo = t(v);
        if (nuevo !== v) { n.setAttribute(a, nuevo); cambiados++; }
      }
    }
    n = caminante.nextNode();
  }
  return cambiados;
}
