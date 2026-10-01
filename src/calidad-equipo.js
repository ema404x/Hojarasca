// 2.7.3: con qué calidad arranca el juego la primera vez, según la placa que haya.
// Módulo puro (se prueba en Node): recibe el nombre que da WebGL y devuelve la calidad.
// Sólo se usa la primera vez que se abre el juego: después manda lo que elija el
// jugador, y la calidad automática sigue acomodando mientras se juega.

// Sin placa ni driver de video (Windows dibuja por software): lo más liviano.
const SIN_ACELERACION = /swiftshader|basic render|llvmpipe|softpipe|software|microsoft basic/i;
// Placas integradas en el procesador: la mayoría de las notebooks y PC de oficina.
const INTEGRADA = /intel|uhd|iris|hd graphics|mali|adreno|powervr|radeon\(tm\) graphics|radeon graphics|vega \d+ graphics|apple m\d/i;

export function calidadParaEquipo(nombrePlaca) {
  const n = String(nombrePlaca || '');
  if (!n) return 'baja';               // no sabemos qué hay: prudentes
  if (SIN_ACELERACION.test(n)) return 'muybaja';
  if (INTEGRADA.test(n)) return 'baja';
  return 'media';
}

export function esSinAceleracion(nombrePlaca) {
  return SIN_ACELERACION.test(String(nombrePlaca || ''));
}

// El nombre de la placa sin tocar el lienzo del juego: un contexto de prueba que se
// suelta enseguida. Devuelve '' si no hay WebGL.
export function nombrePlaca(doc = globalThis.document) {
  try {
    const c = doc.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const nombre = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return nombre;
  } catch { return ''; }
}
