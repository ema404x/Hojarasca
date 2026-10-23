// 4.8.1: el aro de hongos en el mundo (antes: el platillo de una nave que bajaba con un haz y reflectores).
// Lo que se ve y se oye de las fases `llegando`, `bajando`, `vigilando` y `yendo` del Desafío (las fases, los
// tiempos y el punto de bajada son los de siempre, en desafio.js; las cuentas, en desafio-aro.js):
//   · llegando: el aro brota de la tierra, con polvo, bruma dorada y el crujido de las raíces;
//   · bajando: una columna baja de luciérnagas y esporas sube de la boca y los duendes salen de a uno;
//   · vigilando: queda acechando, con los hongos de luz que laten (sin reflectores ni luz que barra el valle);
//   · yendo: se hunde y se tapa con tierra y hojas.
// Poca cosa: tres mallas fundidas (y una tapa que sólo se ve al cerrarse) con los materiales del nido y las
// madrigueras, la luz fija de siempre (`luzNave`, ahora ámbar y tenue) y los halos de lo fijo de
// desafio-duendes.js (un solo dibujo de puntos para todos): ningún programa de shader ni luz nueva.
import * as THREE from 'three';
import { ARO } from './duendes-modelo.js';
import { registrarHalos } from './desafio-duendes.js';
import { LUZ_ARO, brotado, tapado, columna, luz as luzDelAro, brilloDeHongos, proximoCrujido, luciernaga } from './desafio-aro.js';

const _v = new THREE.Vector3();
const MIN = 1e-4;   // (un halo con `tam` 0 cuenta como 1 en desafio-duendes.js: apagado es casi nada)

// `g`: el grupo de mallaAro(); `luzFija`: la PointLight (ya registrada) que va colgada de él.
export function crearAroMundo({ T, g, luzFija, efectos, sonidos }) {
  const ud = g.userData;
  const halos = ud.halos;
  const lucis = halos.filter((h) => h.luci != null);
  const fijos = halos.filter((h) => h.luci == null);
  for (const h of halos) if (h.tam0 == null) h.tam0 = h.tam;
  luzFija.color.setHex(LUZ_ARO.color);
  luzFija.distance = LUZ_ARO.distancia; luzFija.decay = LUZ_ARO.decaimiento;
  registrarHalos(g);
  ud.brilloHalos = 1;
  let reloj = 0, tPolvo = 0, tCrujido = 0, fasePrev = 'fuera', puesto = null;

  // pega la malla al terreno: cada vértice sube o baja lo que el suelo en su lugar (una vez por noche)
  function ubicar(x, z) {
    const h0 = T.altura(x, z);
    g.position.set(x, h0, z);
    for (const geo of ud.geos) {
      const P = geo.attributes.position;
      if (!geo.userData.y0) { geo.userData.y0 = new Float32Array(P.count); for (let i = 0; i < P.count; i++) geo.userData.y0[i] = P.getY(i); }
      const y0 = geo.userData.y0;
      for (let i = 0; i < P.count; i++) {
        const dy = T.altura(x + P.getX(i), z + P.getZ(i)) - h0;
        P.setY(i, y0[i] + (Number.isFinite(dy) ? dy : 0));
      }
      P.needsUpdate = true;
    }
    for (const h of fijos) {
      if (h.y0 == null) h.y0 = h.p.y;
      const dy = T.altura(x + h.p.x, z + h.p.z) - h0;
      h.dy = Number.isFinite(dy) ? dy : 0;
    }
    puesto = { x, z };
  }

  // la bruma dorada y la tierra que saltan en el aro
  function polvear(x, z, y, n, color) {
    const a = Math.random() * Math.PI * 2, r = ARO.radioBoca * (0.4 + 0.9 * Math.random());
    _v.set(x + Math.cos(a) * r, y + 0.2, z + Math.sin(a) * r);
    efectos?.polvo?.(_v, n, color);
  }

  // un cuadro del aro: `e` es el estado de la nave (fase, t, x, z) de desafio.js
  function actualizar(e, dt) {
    if (!puesto || puesto.x !== e.x || puesto.z !== e.z || (fasePrev === 'fuera' && e.fase !== 'fuera')) ubicar(e.x, e.z);
    const entra = fasePrev !== e.fase;
    fasePrev = e.fase;
    reloj += dt;
    const k = brotado(e.fase, e.t);
    const hundido = ARO.hondo * 1.1 * (1 - k);
    ud.partes.position.y = -hundido;
    ud.partes.visible = k > 0.003;
    const tp = tapado(e.fase, e.t);
    ud.tapa.visible = tp > 0.003;
    ud.tapa.position.y = -(1 - tp) * 0.8;
    // la luz fija, ámbar y tenue, sobre la boca
    luzFija.intensity = LUZ_ARO.intensidad * luzDelAro(e.fase, e.t, reloj);
    luzFija.position.y = LUZ_ARO.altura * k;
    // los hongos de luz laten
    const b = brilloDeHongos(e.fase, e.t, reloj);
    ud.matBrillo.color.setScalar(Math.max(0.0, b));
    for (const h of fijos) {
      h.p.y = (h.y0 ?? h.p.y) + (h.dy || 0) - hundido;
      h.tam = Math.max(MIN, h.tam0 * b);
    }
    // la columna de luciérnagas y esporas (de pocos metros, no un haz hasta el cielo)
    const c = columna(e.fase, e.t);
    for (let i = 0; i < lucis.length; i++) {
      const h = lucis[i], L = luciernaga(i, lucis.length, reloj, ARO.radioBoca * 0.85, 5.2);
      h.p.set(L.x, L.y - hundido, L.z);
      h.tam = Math.max(MIN, h.tam0 * c * L.a * (1.1 + 0.25 * Math.sin(reloj * 6 + i * 2.1)));
    }
    // el polvo y la bruma al brotar y al cerrarse
    if (e.fase === 'llegando' || (e.fase === 'yendo' && e.t < 3.6)) {
      tPolvo -= dt;
      if (tPolvo <= 0) {
        tPolvo = e.fase === 'llegando' ? 0.4 : 0.5;
        const sup = T.altura(e.x, e.z);
        polvear(e.x, e.z, sup, 6, '#6b5a44');
        if (Math.random() < 0.6) polvear(e.x, e.z, sup, 8, '#d4b072');
      }
    }
    // el sonido: el que brota (y el que cierra) al entrar a la fase, y el crujido de las raíces con viento grave cada tanto
    const pos = g.position;
    if (entra && e.fase === 'llegando') { sonidos?.brota(pos); tCrujido = 3.6; }
    else if (entra && e.fase === 'yendo') { sonidos?.cierra(pos); tCrujido = 5.6; }
    else {
      tCrujido -= dt;
      if (tCrujido <= 0) { tCrujido = proximoCrujido(Math.random()); sonidos?.crujir(pos); }
    }
  }

  // un duende sube de la boca (donde pisa): tierra, un destello dorado chico y el ruido de la tierra que se abre
  function salio(x, z) {
    const y = T.altura(x, z);
    _v.set(x, y + 0.1, z);
    efectos?.polvo?.(_v, 5, '#6b5a44');
    efectos?.destello?.(_v, 0.45, '#ffc860');
    sonidos?.sale({ x, y, z });
  }

  // se acabó la noche (o se cerró la partida): todo escondido y la luz apagada
  function apagar() {
    ud.partes.visible = false; ud.tapa.visible = false;
    luzFija.intensity = 0;
    for (const h of halos) h.tam = MIN;
    fasePrev = 'fuera';
  }
  apagar();
  return { actualizar, salio, apagar, ubicar };
}
