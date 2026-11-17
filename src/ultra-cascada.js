// 4.29.2 (A, Ultra): la cascada del nivel Ultra. Nada de esto existe con Ultra apagado: la cortina, la espuma de la poza, la bruma y las
// gotas son las de agua.js (crearCascada) con sus materiales de siempre. Con Ultra (y la calidad que corre en Alta):
//   · la cortina: agua que cae de verdad. Arriba la lámina lisa y verde, que se rompe en hilos que aceleran al caer; la espuma baja en
//     grumos que corren con el agua y se juntan abajo; entre hilo y hilo se ve el agua oscura; y las chispas del sol en el agua batida
//     (la misma receta que el río rápido de ultra-agua.js: cada celda titila a su ritmo);
//   · la poza: la espuma se abre desde donde cae (corre hacia afuera, en remolinos), con burbujas que pasan, más ancha que en Alta;
//   · el rocío y la neblina abajo: nubes blandas que suben hasta ~7 m y se van con el aire, y gotas finas que saltan del pie (redondas,
//     no los cuadraditos de Alta). Las dos con el material de la bruma de siempre (ningún programa más).
// Dos programas nuevos (la cortina y la espuma de Ultra), con clave propia; se compilan al prender Ultra y se sueltan al apagarlo.
import * as THREE from 'three';

export const CLAVE_CASCADA_ULTRA = 'cascada-ultra-4.29.2';
export const CASCADA_ULTRA = { neblina: 64, rocio: 150, pozaAncha: 1.35 };

const GLSL_RUIDO_CU = /* glsl */`
  float hCU(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vCU(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hCU(i), hCU(i + vec2(1.0, 0.0)), f.x), mix(hCU(i + vec2(0.0, 1.0)), hCU(i + vec2(1.0, 1.0)), f.x), f.y); }
`;

// la cortina (uv: x a lo ancho, y de 0 en el labio a 1 en la poza)
export const FRAG_CORTINA_ULTRA = /* glsl */`
  uniform float uTiempo; uniform float uAlto; uniform vec3 uAmbiente; uniform vec3 uSolColor; uniform vec3 uSolDir;
  varying vec2 vUv; varying vec3 vW;
  ${GLSL_RUIDO_CU}
  void main() {
    float f = vUv.y, y = f * uAlto;
    // el agua acelera al caer: el dibujo corre parejo en el tiempo de vuelo (que crece con la raíz de lo caído), así abajo baja más
    // rápido y se estira. (No velocidad × tiempo con la velocidad según la altura: con el reloj grande eso aplasta los hilos en rayas.)
    float vuelo = sqrt(f + 0.02) * uAlto;
    // los hilos: ruido estirado a lo largo de la caída, en tres anchos, que baja con el agua
    float h1 = vCU(vec2(vUv.x * 48.0, vuelo * 0.9 - uTiempo * 2.6));
    float h2 = vCU(vec2(vUv.x * 20.0 + 3.0, vuelo * 0.45 - uTiempo * 1.7));
    float h3 = vCU(vec2(vUv.x * 7.0 + 7.0, vuelo * 0.2 - uTiempo * 1.0));
    float hilos = h1 * 0.3 + h2 * 0.4 + h3 * 0.3;
    // la espuma: grumos que caen con el agua; arriba casi nada (la lámina lisa), abajo casi todo
    float grumo = vCU(vec2(vUv.x * 12.0 + 1.7, vuelo * 1.3 - uTiempo * 3.2)) * 0.55 + vCU(vec2(vUv.x * 30.0, vuelo * 2.6 - uTiempo * 4.4)) * 0.45;
    float aire = smoothstep(0.62 - 0.5 * f, 0.9 - 0.3 * f, hilos * 0.55 + grumo * 0.45 + f * 0.18);
    float pie = smoothstep(0.72, 1.0, f) * (0.65 + 0.35 * vCU(vec2(vUv.x * 18.0, uTiempo * 3.0)));
    aire = clamp(max(aire, pie), 0.0, 1.0);
    // el agua: verde oscura y vidriosa en los huecos, clara en los hilos (arriba, la lámina refleja el cielo)
    vec3 agua = mix(vec3(0.10, 0.22, 0.24), vec3(0.36, 0.56, 0.58), smoothstep(0.25, 0.75, hilos));
    agua = mix(agua, vec3(0.5, 0.66, 0.7), (1.0 - smoothstep(0.0, 0.18, f)) * 0.5);
    vec3 luz = uAmbiente * 2.3 + uSolColor * max(uSolDir.y, 0.0) * 0.9 + 0.04;
    vec3 blanco = vec3(0.97, 0.99, 1.0) * (0.86 + 0.14 * grumo);
    vec3 col = mix(agua, blanco, aire) * luz;
    // las chispas del sol en el agua batida (como el río rápido de Ultra): celdas que titilan, más en la lámina que en la espuma
    vec2 cg = vec2(vUv.x * 26.0, vuelo * 3.0 - uTiempo * 1.5);
    vec2 ig = floor(cg);
    float hg = hCU(ig + 3.7);
    float chispa = step(0.84, hg) * pow(max(0.0, sin(uTiempo * (9.0 + hg * 14.0) + hg * 60.0)), 8.0) * smoothstep(0.38, 0.05, length(fract(cg) - 0.5));
    col += uSolColor * 2.4 * chispa * (1.0 - aire * 0.6) * smoothstep(-0.02, 0.25, uSolDir.y);
    // los bordes se deshilachan (los hilos sueltos del costado caen separados)
    float orilla = min(vUv.x, 1.0 - vUv.x);
    float borde = smoothstep(0.0, 0.06 + 0.06 * vCU(vec2(y * 0.9, 3.0 + vUv.x * 4.0)), orilla + (h2 - 0.5) * 0.08);
    float labio = smoothstep(0.0, 0.03, f);
    float a = mix(0.62, 0.97, aire) * borde * (0.6 + 0.4 * labio) * (0.82 + 0.18 * hilos);
    gl_FragColor = vec4(col, clamp(a, 0.0, 0.97));
  }
`;

// la espuma de la poza (vP: el plano del disco, en metros; uR: su radio)
export const FRAG_ESPUMA_ULTRA = /* glsl */`
  uniform float uTiempo; uniform float uOp; uniform float uR; uniform vec3 uAmbiente; uniform vec3 uSolColor; uniform vec3 uSolDir;
  varying vec2 vP;
  ${GLSL_RUIDO_CU}
  void main() {
    float r = length(vP) / uR;
    float ang = atan(vP.y, vP.x);
    // la espuma corre hacia afuera desde donde cae (y gira un poco: remolinos); se rompe en vetas y se deshace en el borde
    vec2 q = vec2(ang * 3.0 + r * 1.6 + uTiempo * 0.12, r * 5.0 - uTiempo * 0.9);
    float n = vCU(q) * 0.5 + vCU(q * 2.3 + 4.0) * 0.3 + vCU(vP * 5.5 + vec2(uTiempo * 0.4, -uTiempo * 0.3)) * 0.2;
    float centro = 1.0 - smoothstep(0.0, 0.45, r);
    float masa = smoothstep(1.0, 0.15, r) * smoothstep(0.42 - 0.25 * centro, 0.72, n + centro * 0.35);
    // burbujas sueltas que pasan
    vec2 cb = vP * 9.0 + vec2(uTiempo * 0.6, -uTiempo * 0.4);
    vec2 ib = floor(cb);
    float burbuja = step(0.82, hCU(ib)) * smoothstep(0.32, 0.12, length(fract(cb) - 0.5)) * smoothstep(1.0, 0.4, r);
    vec3 luz = uAmbiente * 2.4 + uSolColor * max(uSolDir.y, 0.0) * 0.9 + 0.05;
    gl_FragColor = vec4(vec3(0.95, 0.98, 0.99) * luz, clamp((masa + burbuja * 0.6) * uOp * 1.25, 0.0, 0.95));
  }
`;

const hashCU = (k) => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// `cascada`: lo que devuelve crearCascada (agua.js); `renderer`/`camara`/`escena` para compilar al prender (pueden faltar en las pruebas)
export function crearUltraCascada(cascada, { renderer = null, camara = null, escena = null } = {}) {
  const P = cascada && cascada.partes;
  let partes = null;
  const stats = { armados: 0, desarmados: 0 };

  function armar() {
    const cortinaBase = P.cortina.material, espumaBase = P.espuma.material;
    const matCortina = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { ...cortinaBase.uniforms },
      vertexShader: cortinaBase.vertexShader, fragmentShader: FRAG_CORTINA_ULTRA,
    });
    matCortina.customProgramCacheKey = () => CLAVE_CASCADA_ULTRA + '-cortina';
    matCortina.name = 'cascada-ultra';
    const matEspuma = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { ...espumaBase.uniforms, uR: { value: P.R } },   // (uOp es el mismo de Alta: lo mueve crearCascada; vP no ve la escala)
      vertexShader: espumaBase.vertexShader, fragmentShader: FRAG_ESPUMA_ULTRA,
    });
    matEspuma.customProgramCacheKey = () => CLAVE_CASCADA_ULTRA + '-espuma';
    matEspuma.name = 'poza-ultra';
    P.cortina.material = matCortina;
    P.espuma.material = matEspuma;
    const escalaAntes = P.espuma.scale.x;
    P.espuma.scale.setScalar(CASCADA_ULTRA.pozaAncha);
    // la neblina y el rocío: puntos con el material de la bruma de siempre (aTam, aAlfa)
    const puntos = (n, nombre) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute('aTam', new THREE.BufferAttribute(new Float32Array(n), 1));
      g.setAttribute('aAlfa', new THREE.BufferAttribute(new Float32Array(n), 1));
      const m = new THREE.Points(g, P.matNube);
      m.name = nombre; m.frustumCulled = false; m.renderOrder = 7;
      P.grupo.add(m);
      return m;
    };
    const neblina = puntos(CASCADA_ULTRA.neblina, 'neblina-cascada-ultra');
    const rocio = puntos(CASCADA_ULTRA.rocio, 'rocio-cascada-ultra');
    const vidasN = Float32Array.from({ length: CASCADA_ULTRA.neblina }, (_, i) => hashCU(i + 901));
    const vidasR = Float32Array.from({ length: CASCADA_ULTRA.rocio }, (_, i) => hashCU(i + 1301));
    const gotasAntes = P.gotas.visible;
    P.gotas.visible = false;   // (los cuadraditos de Alta: el rocío de Ultra los reemplaza)
    partes = { matCortina, matEspuma, neblina, rocio, vidasN, vidasR, escalaAntes, gotasAntes, cortinaBase, espumaBase };
    if (renderer && camara && escena) { try { renderer.compile(P.grupo, camara, escena); } catch { /* se arman en el primer cuadro */ } }
    stats.armados++;
  }

  function desarmar() {
    const p = partes;
    partes = null;
    P.cortina.material = p.cortinaBase;
    P.espuma.material = p.espumaBase;
    P.espuma.scale.setScalar(p.escalaAntes);
    P.gotas.visible = p.gotasAntes;
    for (const m of [p.neblina, p.rocio]) { P.grupo.remove(m); m.geometry.dispose(); }
    p.matCortina.dispose(); p.matEspuma.dispose();
    stats.desarmados++;
  }

  // por cuadro, después de cascada.actualizar: `pedido` = esUltra(ajustes) con la calidad que corre en Alta
  function actualizar(pedido, dt, viento = 0.4) {
    if (!P) return false;
    if (pedido && !partes) armar();
    else if (!pedido && partes) desarmar();
    if (!partes || !P.grupo.visible) return !!partes;
    const p = partes, s = cascada.salto, { dx, dz, nx, nz } = P, pie = P.pie;
    const w = Math.min(1.5, Math.max(0, Number(viento) || 0));
    // la neblina: nubes grandes y blandas que nacen al pie, suben hasta ~7 m, se abren y se van río abajo con el aire
    {
      const g = p.neblina.geometry, a = g.attributes.position.array, t = g.attributes.aTam.array, al = g.attributes.aAlfa.array;
      for (let i = 0; i < p.vidasN.length; i++) {
        p.vidasN[i] += dt * (0.07 + hashCU(i + 11) * 0.06);
        if (p.vidasN[i] > 1) p.vidasN[i] -= 1;
        const v = p.vidasN[i], lat = (hashCU(i + 21) - 0.5) * s.ancho * 2.2 * (0.7 + v * 0.6), fuera = -0.6 + v * (3.5 + w * 3.0) * (0.5 + hashCU(i + 31));
        a[i * 3] = pie.x + nx * lat + dx * fuera;
        a[i * 3 + 1] = s.abajo + 0.2 + v * (3.0 + hashCU(i + 41) * 4.0);
        a[i * 3 + 2] = pie.z + nz * lat + dz * fuera;
        t[i] = 2.2 + v * 4.5 + hashCU(i + 51) * 1.5;
        al[i] = Math.sin(v * Math.PI) * (0.13 + 0.12 * hashCU(i + 61));
      }
      g.attributes.position.needsUpdate = true; g.attributes.aTam.needsUpdate = true; g.attributes.aAlfa.needsUpdate = true;
    }
    // el rocío: gotas finas que saltan del pie en arcos y caen (redondas, chicas, brillantes)
    {
      const g = p.rocio.geometry, a = g.attributes.position.array, t = g.attributes.aTam.array, al = g.attributes.aAlfa.array;
      for (let i = 0; i < p.vidasR.length; i++) {
        p.vidasR[i] += dt * (0.7 + hashCU(i + 71) * 0.6);
        if (p.vidasR[i] > 1) p.vidasR[i] -= 1;
        const v = p.vidasR[i], lat = (hashCU(i + 81) - 0.5) * s.ancho * 1.9, fuera = -0.3 + v * (1.2 + hashCU(i + 91) * 2.6);
        a[i * 3] = pie.x + nx * lat + dx * fuera;
        a[i * 3 + 1] = s.abajo + 0.15 + Math.sin(v * Math.PI) * (0.6 + hashCU(i + 101) * 1.8);
        a[i * 3 + 2] = pie.z + nz * lat + dz * fuera;
        t[i] = 0.07 + hashCU(i + 111) * 0.09;
        al[i] = Math.sin(v * Math.PI) * 0.9;
      }
      g.attributes.position.needsUpdate = true; g.attributes.aTam.needsUpdate = true; g.attributes.aAlfa.needsUpdate = true;
    }
    return true;
  }
  return { actualizar, apagar: () => { if (partes) desarmar(); }, get activo() { return !!partes; }, stats, partes: P };
}
