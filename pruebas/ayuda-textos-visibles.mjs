// 4.8.1: ayuda para las pruebas que buscan palabras en lo que el juego muestra o dice.
// `cadenasDe(texto)` devuelve las cadenas ('...', "..." y `...`, con las `${}` anidadas) del código,
// sin los comentarios, cada una con su línea; `palabrasDeNave` es la lista de lo que ya no tiene que verse.
import fs from 'node:fs';
import path from 'node:path';

export function cadenasDe(src) {
  const out = [];
  const n = src.length;
  let i = 0, linea = 1;
  // ¿lo que sigue a la barra `/` es una expresión regular? (lo anterior no es un operando)
  function esRegex() {
    let k = i - 1; while (k >= 0 && (src[k] === ' ' || src[k] === '\t')) k--;
    if (k < 0) return true;
    if (/[=(,:;!&|?{}\[+\-*%<>~^\n]/.test(src[k])) return true;
    return /\b(return|typeof|case|in|of)$/.test(src.slice(Math.max(0, k - 6), k + 1));
  }
  // una cadena (o plantilla) que abre en `i` con la comilla `q`
  function cadena(q) {
    const ini = linea; let s = ''; i++;
    while (i < n && src[i] !== q) {
      const c = src[i];
      if (c === '\\') { s += c + (src[i + 1] ?? ''); if (src[i + 1] === '\n') linea++; i += 2; continue; }
      if (c === '\n') { linea++; if (q !== '`') break; }
      if (q === '`' && c === '$' && src[i + 1] === '{') { s += '${}'; i += 2; codigo('}'); continue; }
      s += c; i++;
    }
    i++;
    out.push({ linea: ini, texto: s });
  }
  // código hasta la llave que cierra (si `cierra` es '}'), contando las llaves
  function codigo(cierra) {
    let prof = 0;
    while (i < n) {
      const c = src[i], d = src[i + 1];
      if (c === '\n') { linea++; i++; continue; }
      if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') linea++; i++; } i += 2; continue; }
      if (c === "'" || c === '"' || c === '`') { cadena(c); continue; }
      if (cierra) {
        if (c === '{') prof++;
        else if (c === '}') { if (prof === 0) { i++; return; } prof--; }
      }
      if (c === '/' && esRegex()) {
        let j = i + 1, clase = false;
        while (j < n && src[j] !== '\n' && (src[j] !== '/' || clase)) { if (src[j] === '\\') j++; else if (src[j] === '[') clase = true; else if (src[j] === ']') clase = false; j++; }
        if (src[j] === '/') { i = j + 1; continue; }
      }
      i++;
    }
  }
  codigo(null);
  return out;
}

// lo que ya no tiene que verse ni leerse en el castellano del juego
export const palabrasDeNave = /\b(naves?|nodrizas?|aliens?|alien[ií]genas?|plasma|platillos?|ovnis?|extraterrestres?|espaciales?|astronaves?|vainas?|generador(?:es)?|restos de (?:las )?naves?)\b/i;

export function archivosSrc(raiz) {
  const dir = path.join(raiz, 'src');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.js') && !f.startsWith('idioma-en')).map((f) => path.join(dir, f));
}
