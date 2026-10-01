// Lago y arroyo: color por profundidad, reflejo del cielo, brillo del sol y corriente
import * as THREE from 'three';
import { U, GLSL_COMUN } from './materiales.js';
import { LAGO } from './config.js';

function materialAgua() {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
  Object.assign(uniforms, {
    uTiempo: U.uTiempo, uAlturas: U.uAlturas, uSolDir: U.uSolDir, uSolColor: U.uSolColor,
    uCenit: U.uCenit, uHorizonte: U.uHorizonte, uAmbiente: U.uAmbiente, uLluvia: U.uLluvia, uViento: U.uViento, uInvierno: U.uInvierno, uJugador: U.uJugador,
  });
  return new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec2 aFlujo;
      varying vec3 vPos; varying vec2 vFlujo;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vPos = w.xyz; vFlujo = aFlujo;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_COMUN}
      uniform float uTiempo; uniform sampler2D uAlturas; uniform vec3 uSolDir; uniform vec3 uSolColor;
      uniform vec3 uCenit; uniform vec3 uHorizonte; uniform vec3 uAmbiente; uniform float uLluvia; uniform float uViento; uniform float uInvierno; uniform vec3 uJugador;
      varying vec3 vPos; varying vec2 vFlujo;
      float ondas(vec2 p, float detalle) {
        vec2 f = vFlujo * uTiempo;
        float a = vnoise(p * 0.35 - f * 0.35 + uTiempo * 0.05);
        float b = detalle > 0.01 ? vnoise(p * 1.1 + vec2(uTiempo * 0.23, -uTiempo * 0.17) - f) : a;
        float c = detalle > 0.5 ? vnoise(p * 3.2 - vec2(uTiempo * 0.4, uTiempo * 0.31) - f * 2.0) : b;
        float gotas = 0.0;
        if (uLluvia > 0.01 && detalle > 0.5) {
          vec2 celda = floor(p * 1.5); vec2 lf = fract(p * 1.5) - 0.5;
          float fase = fract(uTiempo * 0.8 + hash12(celda));
          float anillo = abs(length(lf) - fase * 0.5);
          gotas = smoothstep(0.05, 0.0, anillo) * (1.0 - fase) * uLluvia;
        }
        // las ondas que salen de vos cuando estás metido en el agua
        float estela = 0.0;
        if (detalle > 0.3) {
          float dj = length(p - uJugador.xz);
          float anillos = sin(dj * 7.0 - uTiempo * 5.5) * 0.5 + 0.5;
          estela = anillos * smoothstep(3.4, 0.25, dj) * smoothstep(0.0, 0.4, dj);
        }
        return a * 0.5 + b * 0.35 + c * 0.15 * (0.5 + uViento) + gotas * 0.35 + estela * 0.5;
      }
      void main() {
        float fondo = texture2D(uAlturas, uvTerreno(vPos.xz)).r;
        float prof = vPos.y - fondo;
        if (prof < 0.0) discard;
        vec3 V = normalize(cameraPosition - vPos);
        // el detalle de las ondas baja con la distancia: el agua lejana cuesta mucho menos
        float dist = length(cameraPosition - vPos);
        float detalle = 1.0 - smoothstep(35.0, 130.0, dist);
        float e = 0.08;
        float n0 = ondas(vPos.xz, detalle), nx = ondas(vPos.xz + vec2(e, 0.0), detalle), nz = ondas(vPos.xz + vec2(0.0, e), detalle);
        // 3.4: el agua lejana es más lisa (un lago pintado, no ruido de ondas a 300 m)
        float fuerza = (1.2 + uViento * 1.5 + length(vFlujo) * 1.5) * (0.55 + 0.45 * detalle);
        vec3 N = normalize(vec3((n0 - nx) / e * fuerza * 0.08, 1.0, (n0 - nz) / e * fuerza * 0.08));
        float fres = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 R = reflect(-V, N);
        vec3 cielo = mix(uHorizonte, uCenit, smoothstep(0.0, 0.6, R.y));
        // 3.4: el reflejo pintado. Lo que se refleja rasante no es el cielo: abajo la costa con
        // su bosque (verde azulado oscuro), arriba los cordones de la cordillera (azules, con el
        // aire de la lejanía) y recién después el cielo. La silueta de los cerros cambia con el
        // rumbo (ruido sobre el círculo, sin costura).
        vec2 rumboR = normalize(R.xz + vec2(1e-4, 0.0));
        float alturaCerros = 0.09 + 0.15 * vnoise(rumboR * 4.0 + 3.0);
        vec3 aireLejos = mix(uHorizonte, uCenit, 0.45);
        vec3 luzLejos = uAmbiente * 3.0 + uSolColor * 0.6;
        vec3 cerros = mix(srgb(vec3(0.22, 0.30, 0.34)) * luzLejos, aireLejos, 0.58);
        vec3 costa = mix(srgb(vec3(0.08, 0.15, 0.12)) * luzLejos, aireLejos, 0.22);
        cielo = mix(cerros, cielo, smoothstep(alturaCerros - 0.03, alturaCerros + 0.05, R.y));
        cielo = mix(costa, cielo, smoothstep(0.012, 0.075, R.y));
        // 3.4: verde azulado hondo; la orilla, turquesa claro sobre la arena
        vec3 aguaSomera = srgb(vec3(0.30, 0.42, 0.36));
        vec3 aguaProfunda = srgb(vec3(0.02, 0.085, 0.09));
        vec3 absorcion = exp(-vec3(0.36, 0.16, 0.08) * max(prof, 0.0));
        vec3 agua = mix(aguaProfunda, aguaSomera, absorcion);
        // En la orilla aparece una turbidez terrosa muy suave: sedimento en suspensión,
        // no una franja pintada. Desaparece enseguida al ganar profundidad.
        float sedimento = (1.0 - smoothstep(0.10, 1.05, prof)) * (0.55 + 0.45 * vnoise(vPos.xz * 0.17));
        agua = mix(agua, srgb(vec3(0.30, 0.31, 0.23)), sedimento * 0.22);
        // cáusticas: la luz que atraviesa las ondas y dibuja la red sobre el fondo
        if (detalle > 0.35 && prof < 3.2) {
          vec2 q = vPos.xz * 1.35 - vFlujo * uTiempo * 0.5;
          float c1 = vnoise(q + vec2(uTiempo * 0.21, -uTiempo * 0.13));
          float c2 = vnoise(q * 1.7 - vec2(uTiempo * 0.17, uTiempo * 0.23));
          float red = pow(max(0.0, 1.0 - abs(c1 - c2) * 3.4), 3.0);
          // 3.4: más suaves (0.5 → 0.28): una red tenue, no garabatos blancos
          agua += uSolColor * red * max(uSolDir.y, 0.0) * smoothstep(3.2, 0.2, prof) * 0.28 * detalle;
        }
        vec3 luzAgua = uAmbiente * 2.2 + uSolColor * max(uSolDir.y, 0.0) * 0.9;
        vec3 col = mix(agua * luzAgua, cielo, clamp(fres * 0.85 + 0.12, 0.0, 1.0));
        // 3.4: el lago patagónico es verde azulado aun cuando refleja el cielo
        col *= vec3(0.9, 1.0, 0.95);
        float alineadoSol = max(dot(R, uSolDir), 0.0);
        float brillo = pow(alineadoSol, 240.0) * 5.3 + pow(alineadoSol, 20.0) * 0.11;
        // Destellos pequeños repartidos por las ondas: sólo cerca/mediana distancia,
        // para que el lago gane escala sin llenar el horizonte de ruido especular.
        float chispa = pow(alineadoSol, 70.0) * smoothstep(0.42, 0.88, vnoise(vPos.xz * 5.2 + vec2(uTiempo * 0.18, -uTiempo * 0.11))) * detalle;
        col += uSolColor * (brillo + chispa * 1.4) * (1.0 - uLluvia * 0.8);
        float espuma = smoothstep(0.26, 0.0, prof) * (0.38 + 0.62 * vnoise(vPos.xz * 1.3 + vec2(uTiempo * 0.08, 0.0)));
        espuma += length(vFlujo) * smoothstep(0.55, 0.85, n0) * 0.35;
        float dj2 = length(vPos.xz - uJugador.xz);
        espuma += smoothstep(1.4, 0.25, dj2) * (0.35 + 0.35 * sin(dj2 * 9.0 - uTiempo * 6.0)) * 0.5;
        col = mix(col, uHorizonte * 0.9 + uAmbiente, espuma * 0.35);
        col = mix(col, vec3(0.75, 0.8, 0.85) * (uAmbiente * 2.5 + 0.2), uInvierno * smoothstep(0.35, 0.0, prof) * 0.5);
        float transparenciaSomera = smoothstep(0.0, 1.3, prof);
        col = mix(col, col + uHorizonte * 0.035, (1.0 - transparenciaSomera) * (1.0 - uLluvia * 0.55));
        float alfa = smoothstep(0.0, 0.3, prof) * mix(0.58, 0.95, smoothstep(0.0, 2.5, prof));
        alfa = max(alfa, fres * smoothstep(0.0, 0.08, prof));
        gl_FragColor = vec4(col, alfa);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        // 3.4: la niebla con techo (ver materiales.js), y sobre el agua un poco menos: el
        // lago lejano conserva su color y no queda una sábana pálida entre el valle y los cerros
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            float nieblaAgua = min(1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth), clamp(0.3 + fogDensity * 60.0, 0.0, 1.0) * 0.8);
          #else
            float nieblaAgua = smoothstep(fogNear, fogFar, vFogDepth);
          #endif
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, nieblaAgua);
        #endif
      }`,
  });
}

// La cortina del salto de agua, la espuma de abajo y el rocío
export function crearCascada(T, escena, U) {
  const s = T.saltoAgua;
  if (!s) return { actualizar: () => null, pos: null };
  const grupo = new THREE.Group();
  const ancho = s.ancho * 1.45;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTiempo: U.uTiempo, uAlto: { value: s.alto } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTiempo; uniform float uAlto; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      void main(){
        // hilos de agua que caen, más rápidos abajo
        float caida = uTiempo * (1.2 + vUv.y * 0.8);
        float fila = floor(vUv.x * 26.0);
        float h = hash(vec2(fila, floor(vUv.y * 3.0 + caida)));
        float hilo = smoothstep(0.35, 0.95, h);
        float franja = fract(vUv.y * 5.0 + caida + hash(vec2(fila, 1.0)));
        float brillo = 0.55 + 0.45 * smoothstep(0.2, 0.9, franja) * hilo;
        float borde = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
        vec3 col = mix(vec3(0.62, 0.74, 0.78), vec3(0.95, 0.98, 1.0), brillo);
        gl_FragColor = vec4(col, (0.34 + 0.4 * brillo * hilo) * borde);
      }`,
  });
  const cortina = new THREE.Mesh(new THREE.PlaneGeometry(ancho, s.alto + 0.7, 1, 1), mat);
  cortina.position.set(s.x + Math.sin(s.ang) * 0.9, s.arriba - (s.alto + 0.7) / 2 + 0.3, s.z + Math.cos(s.ang) * 0.9);
  cortina.rotation.y = s.ang;   // la cortina cruza el arroyo, mirando aguas abajo
  grupo.add(cortina);
  // la espuma de la poza
  const espuma = new THREE.Mesh(new THREE.CircleGeometry(ancho * 0.4, 18), new THREE.MeshBasicMaterial({ color: 0xe8f1f2, transparent: true, opacity: 0.3, depthWrite: false }));
  espuma.rotation.x = -Math.PI / 2;
  espuma.position.set(s.x + Math.sin(s.ang) * 2.2, s.abajo + 0.06, s.z + Math.cos(s.ang) * 2.2);
  grupo.add(espuma);
  // rocío: partículas que saltan al pie
  const N = 60;
  const geo = new THREE.BufferGeometry();
  const arr = new Float32Array(N * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const gotas = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdfeef0, size: 0.16, transparent: true, opacity: 0.55, depthWrite: false }));
  gotas.frustumCulled = false;
  grupo.add(gotas);
  const vidas = Array.from({ length: N }, () => Math.random());
  escena.add(grupo);

  function actualizar(dt, cam) {
    const d = Math.hypot(cam.x - s.x, cam.z - s.z);
    grupo.visible = d < 160;
    if (!grupo.visible) return s;
    const px = s.x + Math.sin(s.ang) * 2.0, pz = s.z + Math.cos(s.ang) * 2.0;
    for (let i = 0; i < N; i++) {
      vidas[i] += dt * (0.5 + (i % 5) * 0.12);
      if (vidas[i] > 1) vidas[i] -= 1;
      const v = vidas[i];
      const a = (i / N) * Math.PI * 2;
      const r = 0.4 + v * ancho * 0.45;
      arr[i * 3] = px + Math.cos(a) * r * 0.8;
      arr[i * 3 + 1] = s.abajo + Math.sin(v * Math.PI) * 1.5;
      arr[i * 3 + 2] = pz + Math.sin(a) * r * 0.8;
    }
    gotas.geometry.attributes.position.needsUpdate = true;
    espuma.material.opacity = 0.35 + Math.sin(U.uTiempo.value * 2.2) * 0.1;
    return s;
  }
  return { actualizar, pos: { x: s.x, y: s.abajo, z: s.z }, salto: s };
}

export function crearAgua(T, escena) {
  const mat = materialAgua();

  // Lago: plano grande; se descarta donde el fondo queda sobre el nivel
  const gLago = new THREE.PlaneGeometry(420, 420, 1, 1);
  gLago.rotateX(-Math.PI / 2);
  gLago.setAttribute('aFlujo', new THREE.Float32BufferAttribute(new Float32Array(8), 2));
  const lago = new THREE.Mesh(gLago, mat);
  lago.position.set(LAGO.x, 0, LAGO.z);
  lago.renderOrder = 5;
  escena.add(lago);

  // Arroyo: cinta que sigue el cauce y baja con el terreno
  const pos = [], flujo = [], ind = [];
  const rio = T.rio;
  for (let i = 0; i < rio.length; i++) {
    const a = rio[Math.max(0, i - 1)], b = rio[Math.min(rio.length - 1, i + 1)];
    const tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1;
    const nx = -tz / l, nz = tx / l;
    const p = rio[i], w = p.w + 1.2;
    const y = p.s - 0.08;
    const pendiente = i > 0 ? Math.max(0, rio[i - 1].s - p.s) : 0;
    const vel = 0.6 + Math.min(2.5, pendiente * 3);
    pos.push(p.x + nx * w, y, p.z + nz * w, p.x - nx * w, y, p.z - nz * w);
    flujo.push(tx / l * vel, tz / l * vel, tx / l * vel, tz / l * vel);
    // en el salto de agua la cinta se corta: la caída la hace la cortina
    const corta = T.saltoAgua && (i === T.saltoAgua.i || i === T.saltoAgua.i + 1);
    if (i < rio.length - 1 && !corta) { const k = i * 2; ind.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const gRio = new THREE.BufferGeometry();
  gRio.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  gRio.setAttribute('aFlujo', new THREE.Float32BufferAttribute(flujo, 2));
  gRio.setIndex(ind);
  gRio.computeBoundingSphere();
  const arroyo = new THREE.Mesh(gRio, mat);
  arroyo.renderOrder = 5;
  escena.add(arroyo);

  return { lago, arroyo, mat };
}
