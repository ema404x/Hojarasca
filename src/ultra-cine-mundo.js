// 4.29.0 (C): la pasada del cine de Ultra (ver ultra-cine.js: el estado, el círculo de confusión y el shader). Una pasada de pantalla completa que sólo corre mientras
// dura una cinemática; la arma ultra-luz-mundo.js al prender Ultra (la compila ahí) y la suelta al apagarlo.
import * as THREE from 'three';
import { CINE, CINE_PARAMS, FRAG_CINE } from './ultra-cine.js';

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
export function crearCineUltra({ renderer, camara }) {
  const proyInv = { value: new THREE.Matrix4() };
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG_CINE, depthTest: false, depthWrite: false,
    uniforms: { uColor: { value: null }, uProf: { value: null }, uProyInv: proyInv, uTexel: { value: new THREE.Vector2(1, 1) },
      uFoco: { value: 3 }, uK: { value: 1 }, uMax: { value: 10 }, uFuerza: { value: 0 } },
  });
  let rt = null;
  const nuevoRT = (w, h, tipo) => new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: tipo, depthBuffer: false });
  const out = { textura: null };
  return {
    material: mat,
    // por cuadro, dentro de la composición de Ultra: devuelve la textura desenfocada o null (fuera de las escenas, o sin fuerza)
    pasar(dst, pasada) {
      const ahora = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const dt = CINE.ultimo ? Math.min(0.1, Math.max(0, (ahora - CINE.ultimo) / 1000)) : 0;
      CINE.ultimo = ahora;
      const quiere = CINE.distancia !== null;
      const antes = CINE.fuerza;
      CINE.fuerza = quiere ? Math.min(1, CINE.fuerza + dt / CINE_PARAMS.entra) : Math.max(0, CINE.fuerza - dt / CINE_PARAMS.sale);
      if (quiere) CINE.foco += (CINE.distancia - CINE.foco) * (antes < 0.01 ? 1 : 1 - Math.exp(-dt * CINE_PARAMS.sigue));   // (al empezar, el foco ya está donde va)
      if (CINE.fuerza < 0.01) return null;
      const w = dst.width, h = dst.height;
      if (!rt || rt.width !== w || rt.height !== h) { rt?.dispose(); rt = nuevoRT(w, h, dst.texture.type); }
      const u = mat.uniforms;
      camara.updateMatrixWorld();
      proyInv.value.copy(camara.projectionMatrixInverse);
      u.uColor.value = dst.texture; u.uProf.value = dst.depthTexture;
      u.uTexel.value.set(1 / w, 1 / h);
      u.uFoco.value = CINE.foco;
      u.uMax.value = Math.max(2, h * CINE_PARAMS.radio);
      u.uK.value = u.uMax.value * CINE_PARAMS.apertura;
      u.uFuerza.value = CINE.fuerza < 1 ? CINE.fuerza * CINE.fuerza * (3 - 2 * CINE.fuerza) : 1;
      pasada(mat, rt);
      out.textura = rt.texture;
      return rt.texture;
    },
    compilar(rtDestino) {
      try { const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat), e = new THREE.Scene(), c = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); e.add(q); const previo = renderer.getRenderTarget(); renderer.setRenderTarget(rtDestino); renderer.compile(e, c); renderer.setRenderTarget(previo); } catch { /* sin compile: se arma en la primera escena */ }
    },
    dispose() { rt?.dispose(); rt = null; mat.dispose(); },
    get activo() { return CINE.fuerza > 0.01; },
  };
}
