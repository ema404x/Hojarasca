// Clima cambiante y partículas: lluvia, nieve, hojas que caen, luciérnagas, humo y fogata
import * as THREE from 'three';
import { U } from './materiales.js';
import { clamp, lerp, smoothstep } from './ruido.js';
import { registrarLuz } from './luces.js';

function puntosMaterial({ color, tam, aditivo = false, forma = 'redonda', opacidad = 1 }) {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uColor: { value: new THREE.Color(color) }, uTam: { value: tam }, uOpacidad: { value: opacidad }, uTiempo: { value: 0 }, uLuz: { value: new THREE.Color(1, 1, 1) } }]),
    fog: true, transparent: true, depthWrite: false,
    blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      uniform float uTam; attribute float aAzar; attribute float aVida;
      varying float vAzar; varying float vVida; varying float vCerca;
      void main() {
        vAzar = aAzar; vVida = aVida;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = uTam * (0.6 + aAzar * 0.8) * (300.0 / -mvPosition.z);
        vCerca = 1.0;
        ${forma === 'humo' ? `// 3.6 (detalles): la bocanada nace chica y se abre al subir; pegada a la cámara se borra (no
        // tapa la vista: antes una pasaba por delante y cubría media pantalla)
        gl_PointSize *= 0.3 + 0.95 * aVida;
        vCerca = smoothstep(3.0, 11.0, -mvPosition.z);
        // 3.6 (optimizar): la que ya se borró (a menos de 3 m) no pinta ni un fragmento: era la más grande
        // (cientos de píxeles de lado) y, aunque transparente, la placa la pintaba entera
        if (vCerca <= 0.0) gl_PointSize = 0.0;` : ''}
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uColor; uniform float uOpacidad; uniform float uTiempo; uniform vec3 uLuz;
      varying float vAzar; varying float vVida; varying float vCerca;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float a;
        ${forma === 'hoja' ? `
          float ang = uTiempo * (1.0 + vAzar * 3.0) + vAzar * 20.0;
          p = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p;
          p.x *= 1.0 + 0.6 * sin(uTiempo * 4.0 + vAzar * 30.0);
          a = smoothstep(0.5, 0.42, length(p * vec2(1.0, 2.2)));
        ` : forma === 'brillo' ? `
          a = pow(smoothstep(0.5, 0.0, length(p)), 2.5);
        ` : `
          a = smoothstep(0.5, 0.2, length(p));
        `}
        vec3 c = uColor;
        ${forma === 'hoja' ? 'c = mix(uColor, vec3(0.55, 0.12, 0.02), fract(vAzar * 7.0)) * uLuz;' : ''}
        ${forma === 'fuego' ? 'c = mix(vec3(1.0, 0.62, 0.18), vec3(0.75, 0.12, 0.01), vVida) * 1.3; a = pow(smoothstep(0.5, 0.0, length(p)), 2.0) * (1.0 - vVida);' : ''}
        ${forma === 'humo' ? 'a = smoothstep(0.5, 0.1, length(p)) * (1.0 - vVida) * (1.0 - vVida) * vVida * 5.2 * vCerca; c = uColor * uLuz;' : ''}
        ${forma === 'redonda' ? 'c = uColor * uLuz;' : ''}
        gl_FragColor = vec4(c, a * uOpacidad);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

export function crearClima(escena, T, ajustes) {
  const estado = { nublado: 0.15, lluvia: 0, viento: 0.45, vientoBase: 0.45, rafaga: 0, objetivo: 'despejado', t: 180, relampago: 0 };
  let rafagaT = 3 + Math.random() * 5, rafagaObjetivo = 0;

  // lluvia: segmentos que caen alrededor de la cámara
  const NL = 3200, CAJA = 36;
  const posL = new Float32Array(NL * 6), velL = new Float32Array(NL);
  for (let i = 0; i < NL; i++) {
    const x = (Math.random() - 0.5) * CAJA * 2, y = Math.random() * 30, z = (Math.random() - 0.5) * CAJA * 2;
    posL.set([x, y, z, x, y - 0.5, z], i * 6); velL[i] = 14 + Math.random() * 6;
  }
  const gLluvia = new THREE.BufferGeometry();
  gLluvia.setAttribute('position', new THREE.BufferAttribute(posL, 3));
  const mLluvia = new THREE.LineBasicMaterial({ color: 0x9fb0bd, transparent: true, opacity: 0.35, depthWrite: false });
  const lluvia = new THREE.LineSegments(gLluvia, mLluvia);
  lluvia.frustumCulled = false; lluvia.visible = false;
  escena.add(lluvia);

  // nieve y hojas
  const crearNube = (n, material, caja, alto) => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3), az = new Float32Array(n), vida = new Float32Array(n);
    for (let i = 0; i < n; i++) { p.set([(Math.random() - 0.5) * caja * 2, Math.random() * alto, (Math.random() - 0.5) * caja * 2], i * 3); az[i] = Math.random(); }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aAzar', new THREE.BufferAttribute(az, 1));
    g.setAttribute('aVida', new THREE.BufferAttribute(vida, 1));
    const pts = new THREE.Points(g, material);
    pts.frustumCulled = false; pts.visible = false;
    escena.add(pts);
    return pts;
  };
  const nieve = crearNube(2600, puntosMaterial({ color: '#f4f6fa', tam: 0.35, opacidad: 0.9 }), 34, 26);
  const hojas = crearNube(500, puntosMaterial({ color: '#c8661e', tam: 0.6, forma: 'hoja' }), 30, 20);
  const luciernagas = crearNube(160, puntosMaterial({ color: '#e8ff9a', tam: 0.9, aditivo: true, forma: 'brillo' }), 40, 3);

  // humo de chimenea
  const NH = 120;   // 3.6: más bocanadas (con la aldea hay hasta ocho chimeneas a la vista)
  const humo = crearNube(NH, puntosMaterial({ color: '#b9b6b0', tam: 6, forma: 'humo', opacidad: 0.55 }), 0, 0);
  humo.visible = true;
  const humoVida = new Float32Array(NH).map(() => Math.random());

  // fogata
  const NF = 70;
  const fuego = crearNube(NF, puntosMaterial({ color: '#ffaa33', tam: 0.55, aditivo: true, forma: 'fuego', opacidad: 0.55 }), 0, 0);
  const humoFuego = crearNube(30, puntosMaterial({ color: '#9a9690', tam: 5, forma: 'humo', opacidad: 0.45 }), 0, 0);
  const vidaFuego = new Float32Array(NF).map(() => Math.random());
  const vidaHumoF = new Float32Array(30).map(() => Math.random());
  const luzFuego = new THREE.PointLight(0xff8a3a, 0, 22, 1.5);
  escena.add(luzFuego);
  registrarLuz(luzFuego);   // 2.7.4: ver luces.js
  const lenia = new THREE.Group();
  const matLenia = new THREE.MeshLambertMaterial({ color: '#4a3524' });
  const brasas = new THREE.MeshBasicMaterial({ color: '#ff6a1a' });
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.9, 6), matLenia);
    t.rotation.set(Math.PI / 2 - 0.5, (i / 4) * Math.PI * 2, 0, 'YXZ');
    t.position.set(Math.sin((i / 4) * Math.PI * 2) * 0.2, 0.22, Math.cos((i / 4) * Math.PI * 2) * 0.2);
    lenia.add(t);
  }
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), new THREE.MeshLambertMaterial({ color: '#6b6761' }));
    p.position.set(Math.cos(i * 0.785) * 0.55, 0.06, Math.sin(i * 0.785) * 0.55);
    lenia.add(p);
  }
  const brasa = new THREE.Mesh(new THREE.CircleGeometry(0.28, 10), brasas);
  brasa.rotation.x = -Math.PI / 2; brasa.position.y = 0.04;
  lenia.add(brasa);
  lenia.visible = false;
  escena.add(lenia);
  const fogata = { activa: false, pos: new THREE.Vector3(), vida: 0, contenida: false };

  function encenderFogata(x, y, z, duracion = 420, opciones = {}) {
    fogata.activa = true; fogata.vida = duracion; fogata.contenida = !!opciones.contenida;
    fogata.pos.set(x, y, z);
    lenia.position.set(x, y, z); lenia.visible = !fogata.contenida;
    fuego.visible = true; humoFuego.visible = !fogata.contenida;
  }

  // 2.9: el tiempo sale del programa de la partida (ver `meteo.js`) cuando main.js lo
  // pone; sin programa, los dados de siempre. Así la estación meteorológica acierta.
  let programa = null;
  function usarPrograma(p) { programa = p || null; estado.tramo = undefined; }
  function elegirClima() {
    if (programa) return programa.tipo((estado.tramo ?? programa.tramo()) + 1);
    const modo = ajustes.clima;
    if (modo === 'despejado') return 'despejado';
    if (modo === 'lluvioso') return Math.random() < 0.7 ? 'lluvia' : 'nublado';
    const x = Math.random();
    return x < 0.5 ? 'despejado' : x < 0.8 ? 'nublado' : 'lluvia';
  }

  // 2.6.1: tabla de objetivos y color de luz fijos: antes se armaban en cada cuadro
  const OBJETIVOS = { despejado: [0.12, 0, 0.4], nublado: [0.7, 0, 0.65], lluvia: [0.95, 1, 0.9] };
  const luz = new THREE.Color(), luzSol = new THREE.Color();

  function actualizar(dt, cam, mundo) {
    const tt = U.uTiempo.value;
    // 2.9: si cambió el tramo de tres horas (pasó el tiempo, dormiste, cargaste la
    // partida) o el ajuste, el clima se pone al día con el programa
    if (programa && (programa.tramo() !== estado.tramo || programa.firma() !== estado.firmaPrograma)) {
      const k = programa.tramo();
      estado.tramo = k; estado.firmaPrograma = programa.firma();
      estado.objetivo = programa.tipo(k); estado.proximo = programa.tipo(k + 1); estado.t = programa.segundosHasta(k + 1);
    }
    estado.t -= dt;
    // 2.1: el tiempo que viene se decide con un cambio de anticipación, así se lo puede
    // ver venir sobre la cordillera y los vecinos lo pueden anunciar (ver `pronostico.js`)
    if (!estado.proximo) estado.proximo = elegirClima();
    if (estado.t <= 0) { estado.objetivo = estado.proximo; estado.proximo = elegirClima(); estado.t = programa ? programa.segundosHasta((estado.tramo ?? programa.tramo()) + 1) : 180 + Math.random() * 300; }
    if (ajustes.clima === 'despejado') { estado.objetivo = 'despejado'; estado.proximo = 'despejado'; }
    const obj = OBJETIVOS[estado.objetivo];
    const k = 1 - Math.exp(-dt / 25);
    estado.nublado = lerp(estado.nublado, obj[0], k);
    estado.lluvia = lerp(estado.lluvia, obj[1], k * (obj[1] > estado.lluvia ? 0.6 : 1.2));
    // 2.9: los días ventosos y los temporales soplan más (ver `meteo.js`)
    const vientoPrograma = programa && ajustes.clima !== 'despejado' ? programa.viento(estado.tramo ?? programa.tramo()) : 0;
    estado.vientoBase = lerp(estado.vientoBase, obj[2] + vientoPrograma + Math.sin(tt * 0.05) * 0.1, k);
    // RC18: ráfagas locales. En estepa/exposición abierta tienen más amplitud; el bosque las amortigua.
    const kk = T.indice(cam.x, cam.z);
    const estepaLocal = clamp(T.estepa?.[kk] || 0, 0, 1);
    const bosqueLocal = clamp(T.bosque?.[kk] || 0, 0, 1);
    const exposicion = clamp(estepaLocal * 0.72 + (1 - bosqueLocal) * 0.38, 0, 1);
    rafagaT -= dt;
    if (rafagaT <= 0) {
      const prob = 0.28 + exposicion * 0.48 + estado.vientoBase * 0.16;
      rafagaObjetivo = Math.random() < prob ? (0.08 + Math.random() * (0.18 + exposicion * 0.28)) : 0;
      rafagaT = 3.5 + Math.random() * (6.5 - exposicion * 2.2);
    }
    estado.rafaga = lerp(estado.rafaga, rafagaObjetivo, 1 - Math.exp(-dt * (rafagaObjetivo > estado.rafaga ? 2.4 : 1.1)));
    estado.viento = clamp(estado.vientoBase + estado.rafaga, 0, 1.25);
    U.uViento.value = estado.viento;
    U.uLluvia.value = clamp(estado.lluvia * (1 - mundo.invierno), 0, 1);
    // RC28: humedad material con memoria. Se moja rápido y se seca despacio,
    // especialmente con cielo cubierto; así madera, piedra y suelo no cambian
    // de aspecto de forma instantánea cuando termina una lluvia.
    const objetivoMojado = U.uLluvia.value;
    const tauMojado = objetivoMojado > U.uMojado.value ? 7.5 : (150 + estado.nublado * 150);
    U.uMojado.value = lerp(U.uMojado.value, objetivoMojado, 1 - Math.exp(-dt / tauMojado));

    // relámpagos lejanos
    estado.relampago = Math.max(0, estado.relampago - dt * 4);
    if (estado.lluvia > 0.8 && mundo.invierno < 0.5 && Math.random() < dt / 70) { estado.relampago = 1; mundo.sonido.trueno(); }

    const invierno = mundo.invierno > 0.5;
    const precip = estado.lluvia;
    luz.copy(U.uAmbiente.value).multiplyScalar(Math.PI * 0.8).add(luzSol.copy(U.uSolColor.value).multiplyScalar(Math.PI * 0.5));

    // lluvia
    // bajo techo no llueve ni nieva adentro: las partículas se apagan
    const bajoTecho = !!mundo.bajoTecho;
    lluvia.visible = !invierno && precip > 0.05 && !bajoTecho;
    if (lluvia.visible) {
      mLluvia.opacity = 0.35 * precip;
      mLluvia.color.setRGB(0.55 + luz.r * 0.2, 0.6 + luz.g * 0.2, 0.66 + luz.b * 0.2);
      const n = Math.floor(NL * precip);
      gLluvia.setDrawRange(0, n * 2);
      for (let i = 0; i < n; i++) {
        const j = i * 6;
        let y = posL[j + 1] - velL[i] * dt;
        let x = posL[j], z = posL[j + 2];
        const rx = x - cam.x, rz = z - cam.z;
        if (y < cam.y - 8 || Math.abs(rx) > CAJA || Math.abs(rz) > CAJA) {
          x = cam.x + (Math.random() - 0.5) * CAJA * 2; z = cam.z + (Math.random() - 0.5) * CAJA * 2; y = cam.y + 12 + Math.random() * 14;
        }
        const inc = estado.viento * 0.12;
        posL[j] = x; posL[j + 1] = y; posL[j + 2] = z;
        posL[j + 3] = x - inc; posL[j + 4] = y - 0.55; posL[j + 5] = z - inc * 0.3;
      }
      gLluvia.attributes.position.needsUpdate = true;
    }

    // nieve
    const nevando = invierno && precip > 0.05;
    const nevadaLeve = invierno ? 0.25 : 0;
    nieve.visible = (nevando || nevadaLeve > 0) && !bajoTecho;
    if (nieve.visible) {
      const p = nieve.geometry.attributes.position.array, az = nieve.geometry.attributes.aAzar.array;
      const n = Math.floor(2600 * Math.max(precip, nevadaLeve));
      nieve.geometry.setDrawRange(0, n);
      nieve.material.uniforms.uLuz.value.copy(luz).multiplyScalar(0.9).addScalar(0.1);
      for (let i = 0; i < n; i++) {
        const j = i * 3;
        p[j] += (Math.sin(tt * 0.7 + az[i] * 30) * 0.4 + estado.viento * 0.8) * dt;
        p[j + 1] -= (0.9 + az[i] * 0.7) * dt;
        p[j + 2] += Math.cos(tt * 0.5 + az[i] * 20) * 0.3 * dt;
        if (p[j + 1] < cam.y - 6 || Math.abs(p[j] - cam.x) > 34 || Math.abs(p[j + 2] - cam.z) > 34) {
          p[j] = cam.x + (Math.random() - 0.5) * 68; p[j + 2] = cam.z + (Math.random() - 0.5) * 68; p[j + 1] = cam.y + 8 + Math.random() * 18;
        }
      }
      nieve.geometry.attributes.position.needsUpdate = true;
    }

    // hojas de otoño
    hojas.visible = mundo.otono > 0.5;
    if (hojas.visible) {
      const p = hojas.geometry.attributes.position.array, az = hojas.geometry.attributes.aAzar.array;
      hojas.material.uniforms.uTiempo.value = tt;
      hojas.material.uniforms.uLuz.value.copy(luz);
      for (let i = 0; i < 500; i++) {
        const j = i * 3;
        p[j] += (Math.sin(tt * 1.3 + az[i] * 40) * 0.8 + estado.viento * 1.4) * dt;
        p[j + 1] -= (0.6 + az[i] * 0.5) * dt;
        p[j + 2] += Math.cos(tt * 1.1 + az[i] * 25) * 0.7 * dt;
        const suelo = T.altura(p[j], p[j + 2]);
        if (p[j + 1] < suelo || Math.abs(p[j] - cam.x) > 30 || Math.abs(p[j + 2] - cam.z) > 30) {
          const x = cam.x + (Math.random() - 0.5) * 60, z = cam.z + (Math.random() - 0.5) * 60;
          p[j] = x; p[j + 2] = z; p[j + 1] = T.altura(x, z) + 6 + Math.random() * 14;
          if (T.val(T.bosque, x, z) < 0.3) p[j + 1] = -999;
        }
      }
      hojas.geometry.attributes.position.needsUpdate = true;
    }

    // luciérnagas en noches de verano
    luciernagas.visible = mundo.noche > 0.6 && mundo.otono < 0.5 && !invierno && precip < 0.3;
    if (luciernagas.visible) {
      const p = luciernagas.geometry.attributes.position.array, az = luciernagas.geometry.attributes.aAzar.array;
      luciernagas.material.uniforms.uOpacidad.value = (mundo.noche - 0.6) * 2.5;
      for (let i = 0; i < 160; i++) {
        const j = i * 3;
        p[j] += Math.sin(tt * 0.6 + az[i] * 50) * 0.5 * dt;
        p[j + 2] += Math.cos(tt * 0.5 + az[i] * 40) * 0.5 * dt;
        const suelo = T.altura(p[j], p[j + 2]);
        p[j + 1] = suelo + 0.6 + az[i] * 2 + Math.sin(tt * 0.8 + az[i] * 10) * 0.4;
        if (Math.abs(p[j] - cam.x) > 40 || Math.abs(p[j + 2] - cam.z) > 40) {
          p[j] = cam.x + (Math.random() - 0.5) * 80; p[j + 2] = cam.z + (Math.random() - 0.5) * 80;
        }
      }
      luciernagas.material.uniforms.uTam.value = 0.9;
      luciernagas.geometry.attributes.position.needsUpdate = true;
    }

    // humo de chimenea: de noche, con frío o con lluvia
    const chimeneas = mundo.chimeneas && mundo.chimeneas.length ? mundo.chimeneas : [mundo.chimenea];
    const hayHumo = mundo.noche > 0.5 || invierno || precip > 0.4 || mundo.otono > 0.5;
    humo.material.uniforms.uOpacidad.value = lerp(humo.material.uniforms.uOpacidad.value, hayHumo ? 0.5 : 0, dt);
    humo.material.uniforms.uLuz.value.copy(luz).multiplyScalar(0.8).addScalar(0.08);
    // 3.6 (optimizar): sin humo (con la opacidad en casi nada: menos de medio tono de 255, no cambia ni
    // un píxel) las bocanadas (120 desde la 3.6) no se dibujan ni se recalculan. Pintarlas transparentes
    // costaba hasta 15 ms por cuadro de día en la plaza de la aldea (una bocanada cerca es enorme). Su
    // vida sigue corriendo igual: al volver están donde estarían (la posición sale sólo de la vida, la
    // chimenea y el viento)
    humo.visible = humo.material.uniforms.uOpacidad.value > 0.002;
    {
      const p = humo.geometry.attributes.position.array, vida = humo.geometry.attributes.aVida.array;
      for (let i = 0; i < NH; i++) {
        humoVida[i] += dt * 0.12;
        if (humoVida[i] > 1) humoVida[i] -= 1;
        if (!humo.visible) continue;
        const v = humoVida[i];
        const chim = chimeneas[i % chimeneas.length];
        // 3.6: sube rápido al salir y se va frenando; el viento la tumba cada vez más y se abre
        // (antes subía derecho, a la misma velocidad, como un caño)
        // 3.6 (detalles): más fina (se abre menos) y nunca baja de la chimenea: con viento fuerte se
        // acuesta, pero sigue subiendo (antes bajaba hasta la altura de los ojos)
        const abre = 0.15 + v * v * 2.0;
        p[i * 3] = chim.x + (v * 1.2 + v * v * 5.5) * estado.viento + Math.sin(v * 9 + i) * abre;
        p[i * 3 + 1] = chim.y + Math.max(0.5 + 2.2 * v, 11 * v * (1 - 0.38 * v) - v * v * estado.viento * 2);
        p[i * 3 + 2] = chim.z + Math.cos(v * 7 + i * 1.7) * abre;
        vida[i] = v;
      }
      if (humo.visible) { humo.geometry.attributes.position.needsUpdate = true; humo.geometry.attributes.aVida.needsUpdate = true; }
    }

    // fogata
    if (fogata.activa) {
      fogata.vida -= dt;
      const brillo = clamp(fogata.vida / 40, 0, 1);
      if (fogata.vida <= -60) { fogata.activa = false; lenia.visible = false; fuego.visible = false; humoFuego.visible = false; }
      luzFuego.position.set(fogata.pos.x, fogata.pos.y + 0.9, fogata.pos.z);
      const factorContenido = fogata.contenida ? 0.72 : 1;
      const factorLluvia = fogata.contenida ? 1 : (1 - estado.lluvia * 0.4);
      luzFuego.intensity = (6 + Math.sin(tt * 13) * 1.2 + Math.sin(tt * 23.7) * 0.8) * brillo * factorContenido * factorLluvia;
      brasas.color.setRGB(1, 0.35 + Math.sin(tt * 5) * 0.08, 0.1).multiplyScalar(0.3 + 0.7 * clamp((fogata.vida + 60) / 60, 0, 1));
      const p = fuego.geometry.attributes.position.array, vida = fuego.geometry.attributes.aVida.array;
      for (let i = 0; i < NF; i++) {
        vidaFuego[i] += dt * (1.2 + (i % 5) * 0.2);
        if (vidaFuego[i] > 1) vidaFuego[i] -= 1;
        const v = vidaFuego[i], a = i * 2.39;
        // una de cada seis salta: es una chispa, sube más alto y la lleva el viento
        const chispa = i % 6 === 0;
        const escalaFuego = fogata.contenida ? 0.34 : 1;
        const abierto = (1 - v) * (chispa ? 0.5 + v * 0.9 : 0.28) * escalaFuego;
        const sube = fogata.contenida ? 0.10 + v * 0.52 * brillo : (chispa ? 0.15 + v * 3.4 * brillo : 0.15 + v * 1.1 * brillo);
        const deriva = fogata.contenida ? 0 : (chispa ? v * v * estado.viento * 2.2 : 0);
        p[i * 3] = fogata.pos.x + Math.cos(a + tt * (chispa ? 2.2 : 1)) * abierto + deriva;
        p[i * 3 + 1] = fogata.pos.y + sube;
        p[i * 3 + 2] = fogata.pos.z + Math.sin(a + tt * (chispa ? 2.2 : 1)) * abierto;
        // la chispa se apaga antes de llegar arriba
        vida[i] = brillo > 0.02 ? (chispa ? Math.min(1, v * 1.35) : v) : 1;
      }
      fuego.geometry.attributes.position.needsUpdate = true;
      fuego.geometry.attributes.aVida.needsUpdate = true;
      const ph = humoFuego.geometry.attributes.position.array, vh = humoFuego.geometry.attributes.aVida.array;
      humoFuego.material.uniforms.uLuz.value.copy(luz).multiplyScalar(0.7).addScalar(0.1);
      for (let i = 0; i < 30; i++) {
        vidaHumoF[i] += dt * 0.2;
        if (vidaHumoF[i] > 1) vidaHumoF[i] -= 1;
        const v = vidaHumoF[i];
        ph[i * 3] = fogata.pos.x + v * 3 * estado.viento + Math.sin(v * 8 + i) * v;
        ph[i * 3 + 1] = fogata.pos.y + 1 + v * 7;
        ph[i * 3 + 2] = fogata.pos.z + Math.cos(v * 6 + i) * v;
        vh[i] = v;
      }
      humoFuego.geometry.attributes.position.needsUpdate = true;
      humoFuego.geometry.attributes.aVida.needsUpdate = true;
    } else {
      luzFuego.intensity = 0;
    }
  }

  // ---------------------------------------------------------------- tormenta
  // De vez en cuando la lluvia fuerte se vuelve tormenta: relámpagos que
  // iluminan el valle y truenos que llegan después, según la distancia.
  const relampago = { luz: 0, proximo: 30 + Math.random() * 90, secuencia: 0, lejos: 1 };
  function actualizarTormenta(dt, cam, sonido) {
    estado.tormenta = estado.lluvia > 0.62 && estado.nublado > 0.7;
    if (!estado.tormenta) { relampago.luz = Math.max(0, relampago.luz - dt * 4); return relampago.luz; }
    relampago.proximo -= dt;
    if (relampago.proximo <= 0) {
      relampago.proximo = 14 + Math.random() * 46;
      relampago.secuencia = 2 + Math.floor(Math.random() * 3);
      relampago.lejos = 0.15 + Math.random() * 0.85;
      relampago.luz = 1;
      const demora = relampago.lejos * 7.5;           // el trueno tarda en llegar
      if (sonido) setTimeout(() => sonido.trueno(relampago.lejos), demora * 1000);
    }
    if (relampago.luz > 0) {
      relampago.luz -= dt * (relampago.secuencia > 0 ? 7 : 3.2);
      if (relampago.luz <= 0 && relampago.secuencia > 0) { relampago.secuencia--; relampago.luz = 0.75; }
    }
    return Math.max(0, relampago.luz) * (1.1 - relampago.lejos * 0.55);
  }

  return { estado, actualizar, actualizarTormenta, encenderFogata, fogata, usarPrograma };
}
