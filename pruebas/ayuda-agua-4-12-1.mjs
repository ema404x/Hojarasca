// 4.12.1 (agua y reflejos): ayudas de la prueba del agua. Arma el material del agua con el three real (sin placa) en sus dos versiones (media y alta, o baja y
// mínima) y cuenta lo que cuesta cada una en el fragment shader: las llamadas a `vnoise` (la cuenta cara del agua) que corren SIEMPRE y las que quedan
// detrás de un `if` (sólo donde hay orilla, nubes, etc.). No es una medición de milisegundos (esa va en CAMBIOS_4_12_1_A.md): es el tope que se promete.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const urlDe = (src, f) => pathToFileURL(path.join(src, f)).href;

// un arroyo de mentira (el material y la cinta no necesitan más)
export const terrenoFalso = () => ({
  rio: Array.from({ length: 8 }, (_, i) => ({ x: i * 6, z: Math.sin(i) * 3, s: 2 - i * 0.1, w: 3 })),
  saltoAgua: null,
});

export async function materialDeAgua(aguaUrl, nuevo, THREE) {
  const mod = await import(aguaUrl);
  mod.ajustarAguaNueva(nuevo);
  const escena = new THREE.Scene();
  const a = mod.crearAgua(terrenoFalso(), escena);
  return a.mat;
}

// Cuenta las llamadas a `vnoise(` del cuerpo de main(): las que corren siempre y las condicionadas (dentro de un `if`/`else`/`for`, con o sin llaves).
export function contarRuido(fragmentShader) {
  const sinComentarios = fragmentShader.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const ini = sinComentarios.indexOf('void main()');
  if (ini < 0) throw new Error('no hay main()');
  let i = sinComentarios.indexOf('{', ini);
  const pila = [];
  let sentencia = '', siempre = 0, condicionadas = 0;
  const cuerpo = sinComentarios.slice(i + 1);
  pila.push(false);
  for (let k = 0; k < cuerpo.length && pila.length > 0; k++) {
    const c = cuerpo[k];
    if (c === '{') { pila.push(/^\s*(else\s+)?(if|for)\b|^\s*else\b/.test(sentencia) || pila[pila.length - 1] === true); sentencia = ''; continue; }
    if (c === '}') { pila.pop(); sentencia = ''; continue; }
    if (c === ';') { sentencia = ''; continue; }
    sentencia += c;
    if (c === '(' && /\bvnoise\($/.test(sentencia)) {
      const condicionada = pila[pila.length - 1] === true || /^\s*(else\s+)?if\s*\(.*\)\s*\S/.test(sentencia.replace(/\bvnoise\($/, 'x'));
      if (condicionada) condicionadas++; else siempre++;
    }
  }
  return { siempre, condicionadas, total: siempre + condicionadas };
}

// uniformes declarados en el fragment shader (de la forma `uniform tipo a; uniform tipo b;`)
export const uniformesDeclarados = (fragmentShader) => [...fragmentShader.matchAll(/\buniform\s+(?:float|vec2|vec3|vec4|sampler2D|int|mat3|mat4)\s+(\w+)\s*;/g)].map((m) => m[1]);

export const equilibrado = (texto, a, b) => { let n = 0; for (const c of texto) { if (c === a) n++; else if (c === b) n--; if (n < 0) return false; } return n === 0; };
