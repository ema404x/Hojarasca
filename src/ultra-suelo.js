// 4.29.2 (A, Ultra): el suelo de cerca y el borde de los pisos. Nada de esto existe con Ultra apagado: son agregados al texto de los
// programas de Ultra del suelo y del pasto (ultra-bosque.js: parcheTerreno, parchePasto, parcheAnillo),
// que ya tienen su clave de programa propia de Ultra; los de Alta no se tocan.
//   · El grano de cerca (a menos de ~3 m, se apaga hasta los 5): en el pasto, un granulado de puntas claras y huecos oscuros y alguna
//     paja seca; en la tierra y el camino, granza (piedritas de 1 a 3 cm, claras y oscuras) y arenilla; en el piso del bosque, ramitas y
//     pinochas; y las piedras de la 4.28.0 (manchones grises lisos de cerca) se rompen en grava. Todo procedural (ruido del lugar, sin texturas que se repitan: no hay mosaico) y apagado según el tamaño del píxel
//     (no titila). Suma al relieve del grano de la 4.28.0 (la normal sigue la altura).
//   · El borde de los pisos: la máscara de los pisos (`marcarPisos`) tiene téxeles de 2 m y el pasto se cortaba en líneas rectas (calles y
//     pisos de la aldea, la fiesta, las obras). Con Ultra el pasto, las flores y los helechos leen los pisos corridos por un desvío (senos
//     torcidos y ruido, hasta ~1,4 m) a menos de 25 m: el corte queda en una franja irregular. El pasto nunca entra en un piso (el corte
//     sólo se corre hacia afuera).
//   (Afuera, por costo en la plaza: el mismo desvío en el color del suelo, con flecos finos; el relieve de las piedras del ripio; ver
//   CAMBIOS_4_29_2_A.md.)

// Cambia `de` por `a` en el texto; si no está, avisa una vez (esa parte queda como estaba)
const avisados = new Set();
function cambiar(texto, de, a, donde) {
  if (!texto.includes(de)) {
    if (!avisados.has(donde)) { avisados.add(donde); console.warn('ultra-suelo: no encontré «' + de.slice(0, 50) + '» en ' + donde); }
    return texto;
  }
  return texto.split(de).join(a);
}

// El grano de cerca: dónde empieza a apagarse y dónde ya no está (m, desde la cámara)
export const GRANO_CERCA = { desde: 3.0, hasta: 5.0 };
// El desvío del borde: metros de la escala grande y de la chica (la máscara tiene téxeles de 2 m)
export const BORDE_ULTRA = { grande: 2.2, chico: 0.7, flecos: 0.35 };

// el desvío (en metros) con que se lee la máscara cerca de cada punto: la escala grande con senos que se tuercen entre sí (barato, sin
// repetición a la vista) y, a menos de 20 m (`d`: distancia a la cámara), la chica con ruido (`vnoise`, GLSL_COMUN de materiales.js)
export const GLSL_DESVIO_BORDE_U = /* glsl */`
  vec2 desvioBordeU(vec2 b, float d) {
    vec2 o = vec2(sin(b.y * 0.83 + sin(b.x * 0.37 + 1.3) * 2.1), sin(b.x * 0.79 + sin(b.y * 0.41 + 4.1) * 2.1)) * ${(BORDE_ULTRA.grande * 0.5).toFixed(2)};
    if (d < 20.0) o += (vec2(vnoise(b * 1.9 + vec2(1.3, 7.1)), vnoise(b * 1.9 + vec2(4.4, 2.2))) - 0.5) * ${BORDE_ULTRA.chico.toFixed(2)} * (1.0 - smoothstep(12.0, 20.0, d));
    return o;
  }
`;

// ---------------------------------------------------------------- el suelo (materialTerreno, sobre el parche de Ultra de la 4.28.0)
// (va antes del borde pisoteado de la 4.28.0, dentro del bloque del grano: usa col, p, pasto, sendero, bosque, pend, nieve, dGU, granoUB)
const MARCA_GRANO_B = '// el borde de los pisos (donde marcarPisos corta el pasto): tierra pisoteada y pasto corto, sin línea recta';
const GLSL_GRANO_CERCA = /* glsl */`// 4.29.2 (A, Ultra): el grano de cerca (menos de ~3 m): granulado del pasto, granza en la tierra, ramitas en el bosque
            {
              float cercaFU = (1.0 - smoothstep(${GRANO_CERCA.desde.toFixed(1)}, ${GRANO_CERCA.hasta.toFixed(1)}, dGU)) * (1.0 - nieve * 0.85);
              if (cercaFU > 0.01) {
                float pieFU = length(fwidth(vPosMundo.xz));
                float nitidoFU = (1.0 - smoothstep(0.008, 0.026, pieFU)) * cercaFU;
                float finoFU = (1.0 - smoothstep(0.004, 0.012, pieFU)) * cercaFU;
                // qué hay: se mira el color que ya tiene el suelo (el verde manda: el césped de la aldea tiene poca máscara de pasto)
                float verdeFU = smoothstep(0.004, 0.03, col.g - max(col.r, col.b) * 0.92) * (1.0 - smoothstep(0.3, 0.7, sendero));
                // (cada clase de suelo, en su rama: un píxel paga sólo la suya)
                vec2 qaFU = mat2(0.94, 0.34, -0.34, 0.94) * p, qbFU = mat2(0.5, -0.87, 0.87, 0.5) * p;
                float enPastoFU = verdeFU * (1.0 - bosque * 0.5);
                float enTierraFU = (1.0 - verdeFU) * (1.0 - smoothstep(0.4, 0.85, bosque) * (1.0 - sendero));
                float enBosqueFU = smoothstep(0.35, 0.8, bosque) * (1.0 - sendero);
                float relieveFU = 0.0;
                // el pasto corto: de arriba, un granulado de puntas claras y huecos oscuros (dos escalas, de ~2 y ~1 cm, sin veta: no hay tejido)
                // y alguna paja seca
                if (enPastoFU * nitidoFU > 0.01) {
                  float hebraFU = vnoise(qaFU * 52.0) * 0.6 + (finoFU > 0.01 ? vnoise(qbFU * 115.0 + 5.3) * 0.4 * (finoFU / max(cercaFU, 1e-3)) : 0.2);
                  col *= mix(vec3(1.0), mix(vec3(0.62, 0.6, 0.66), vec3(1.2, 1.24, 1.08), smoothstep(0.28, 0.78, hebraFU)), enPastoFU * nitidoFU);
                  float pajaFU = smoothstep(0.8, 0.93, vnoise(qaFU * vec2(30.0, 7.0) + 11.0)) * smoothstep(0.6, 0.9, vnoise(qbFU * 9.0));
                  col = mix(col, srgb(vec3(0.66, 0.58, 0.33)), pajaFU * 0.6 * enPastoFU * nitidoFU * (1.0 - uInvierno));
                  relieveFU += (hebraFU - 0.5) * 0.004 * enPastoFU;
                }
                // la tierra, el camino y la estepa: granza (piedritas de 1 a 3 cm, claras y oscuras, sueltas por celdas corridas) y arenilla
                if (enTierraFU * nitidoFU > 0.01) {
                  vec2 cgFU = p * 30.0;
                  vec2 igFU = floor(cgFU);
                  float hgFU = hash12(igFU + 5.3);
                  vec2 fgFU = fract(cgFU) - 0.5 - (vec2(hash12(igFU), hash12(igFU + 1.7)) - 0.5) * 0.45;
                  float piedritaFU = smoothstep(0.3, 0.15, length(fgFU) * (0.75 + 0.7 * fract(hgFU * 13.7))) * step(0.8, hgFU);
                  col = mix(col, col * mix(vec3(1.5, 1.45, 1.35), vec3(0.6, 0.57, 0.54), step(0.93, hgFU)), piedritaFU * 0.8 * enTierraFU * nitidoFU);
                  if (finoFU > 0.01) col *= mix(1.0, 0.78 + 0.4 * vnoise(p * 80.0), enTierraFU * finoFU);
                  relieveFU += piedritaFU * 0.007 * enTierraFU;
                }
                // el piso del bosque: ramitas y pinochas (trazos finos y oscuros) entre la hojarasca
                if (enBosqueFU * nitidoFU > 0.01) {
                  float ramitaFU = smoothstep(0.86, 0.96, vnoise(qbFU * vec2(9.0, 70.0) + 2.0));
                  col = mix(col, col * vec3(0.55, 0.45, 0.36), ramitaFU * 0.7 * enBosqueFU * nitidoFU);
                  relieveFU += ramitaFU * 0.003 * enBosqueFU;
                }
                // el relieve: las hebras, las piedritas y las ramitas levantan la normal (con el grano de la 4.28.0)
                granoUB += relieveFU * nitidoFU;
              }
            }
            `;

// las piedras de la 4.28.0 (manchas de 16 cm) de cerca eran manchones grises lisos: ahora se rompen en grava (ruido de ~3 cm)
const PIEDRA_B = 'float piedra = smoothstep(0.7, 0.86, g2) * tierraU * fino2;';
const PIEDRA_U = PIEDRA_B + ' piedra *= mix(1.0, smoothstep(0.45, 0.75, vnoise(p * 31.0)) * 1.3, (1.0 - smoothstep(4.0, 9.0, dGU)) * fino3);';
export function parcheSueloUltra(f) {
  f = cambiar(f, PIEDRA_B, PIEDRA_U, 'suelo: piedras de cerca');
  f = cambiar(f, MARCA_GRANO_B, GLSL_GRANO_CERCA + MARCA_GRANO_B, 'suelo: grano de cerca');
  return f;
}

// ---------------------------------------------------------------- el pasto (matas) y las flores y helechos: el mismo desvío
const MATAS_ESTEPA = 'vec4 estT = texture2D(uEstepa, uv);';
export function parchePastoBordeU(v) {
  // (sólo el corte de los pisos, y sólo donde ya hay algo de piso cerca: el desvío no cuesta en el resto del prado. La densidad del pasto
  // lee la máscara de siempre: en el borde de un camino el suelo corrido queda verde, y ahí un pasto corto no desentona)
  v = cambiar(v, 'void main() {', GLSL_DESVIO_BORDE_U + '\n      void main() {', 'pasto: desvío');
  v = cambiar(v, MATAS_ESTEPA, MATAS_ESTEPA + `
        float dCamBU = length(b - uCam.xz);
        if (estT.b > 0.002 && dCamBU < 25.0) estT.b = max(estT.b, texture2D(uEstepa, uvTerreno(b + desvioBordeU(b, dCamBU) * (1.0 - smoothstep(15.0, 25.0, dCamBU)))).b);`, 'pasto: pisos');
  return v;
}
const ANILLO_ESTEPA = 'vec4 est = texture2D(uEstepa, uv);';
export function parcheAnilloBordeU(v) {
  v = cambiar(v, 'void main() {', GLSL_DESVIO_BORDE_U + '\n      void main() {', 'anillo: desvío');
  v = cambiar(v, ANILLO_ESTEPA, ANILLO_ESTEPA + `
        float dCamBU = length(b - uCam.xz);
        if (est.b > 0.002 && dCamBU < 25.0) est.b = max(est.b, texture2D(uEstepa, uvTerreno(b + desvioBordeU(b, dCamBU) * (1.0 - smoothstep(15.0, 25.0, dCamBU)))).b);`, 'anillo: pisos');
  return v;
}
