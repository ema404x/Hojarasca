// Las matas de la huerta. Todas las de todos los canteros van en dos mallas
// instanciadas —las hojas y los frutos—, así que sumar canteros no suma llamadas de
// dibujo. Se rearman sólo cuando algo cambia (sembrar, cosechar, pasar el día).
import * as THREE from 'three';
import { CULTIVOS, avance, lista } from './huerta.js';

const MATAS_POR_CANTERO = 8;           // dos filas de cuatro
const MAX_CANTEROS = 48;
const MAX = MATAS_POR_CANTERO * MAX_CANTEROS;

// Cómo se ve cada cultivo: color de la hoja, del fruto y qué tan alto llega.
const ASPECTO = {
  habas: { hoja: '#4f7a3a', fruto: '#8fb85a', alto: 0.62, frutos: 3 },
  papas: { hoja: '#3f6b34', fruto: '#e8e2f2', alto: 0.42, frutos: 2 },    // la flor blanca de la papa
  frutillas: { hoja: '#3b6a30', fruto: '#c8322a', alto: 0.2, frutos: 4 },
  // 2.3: los calafates llegaron con la 2.2 sin aspecto, y un cantero de calafates
  // tiraba un error al dibujarse (asp era undefined)
  calafates: { hoja: '#4d6636', fruto: '#3b2c5c', alto: 0.55, frutos: 3 },   // la baya azul oscura
};
const ASPECTO_POR_DEFECTO = ASPECTO.frutillas;

export function crearMatasHuerta(escena) {
  const hojaGeo = new THREE.IcosahedronGeometry(0.16, 0);
  const frutoGeo = new THREE.IcosahedronGeometry(0.045, 0);
  const hojaMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const frutoMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const hojas = new THREE.InstancedMesh(hojaGeo, hojaMat, MAX);
  const frutos = new THREE.InstancedMesh(frutoGeo, frutoMat, MAX * 4);
  for (const m of [hojas, frutos]) {
    m.count = 0;
    m.castShadow = true;
    m.frustumCulled = false;   // se reparten por todo el valle; son pocas
    m.name = 'huerta';
    escena.add(m);
  }
  const _M = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  const _eje = new THREE.Vector3(0, 1, 0), _c = new THREE.Color();

  // `canteros`: [{ x, y, z, rot, parcela }] — parcela es null si está vacío.
  function sincronizar(canteros, dia) {
    let nh = 0, nf = 0;
    for (const k of canteros.slice(0, MAX_CANTEROS)) {
      const p = k.parcela;
      if (!p || !CULTIVOS[p.cultivo]) continue;
      const a = avance(p, dia), madura = lista(p, dia);
      const asp = ASPECTO[p.cultivo] || ASPECTO_POR_DEFECTO;
      const cos = Math.cos(k.rot || 0), sin = Math.sin(k.rot || 0);
      for (let i = 0; i < MATAS_POR_CANTERO; i++) {
        // dos filas de cuatro a lo largo del cantero, con un poco de desorden
        const lx = -0.72 + (i % 4) * 0.48 + Math.sin(i * 12.9) * 0.04;
        const lz = (i < 4 ? -0.22 : 0.22) + Math.cos(i * 7.3) * 0.03;
        const x = k.x + lx * cos + lz * sin, z = k.z - lx * sin + lz * cos;
        const crecer = 0.18 + a * 0.82;
        const alto = asp.alto * crecer;
        _q.setFromAxisAngle(_eje, i * 1.7 + (k.rot || 0));
        _M.compose(_p.set(x, k.y + 0.34 + alto * 0.5, z), _q, _s.set(crecer, alto / 0.32 * 0.6 + 0.4 * crecer, crecer));
        hojas.setMatrixAt(nh, _M);
        hojas.setColorAt(nh, _c.set(asp.hoja).offsetHSL(0, 0, (Math.sin(i * 3.1) * 0.04) - (1 - a) * 0.06));
        nh++;
        if (!madura) continue;
        for (let f = 0; f < asp.frutos; f++) {
          const ang = f * 2.1 + i;
          _M.compose(_p.set(x + Math.cos(ang) * 0.1, k.y + 0.34 + alto * (0.35 + f * 0.12), z + Math.sin(ang) * 0.1), _q.identity(), _s.set(1, 1, 1));
          frutos.setMatrixAt(nf, _M);
          frutos.setColorAt(nf, _c.set(asp.fruto));
          nf++;
        }
      }
    }
    hojas.count = nh; frutos.count = nf;
    for (const m of [hojas, frutos]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    return { matas: nh, frutos: nf };
  }

  return { sincronizar, hojas, frutos };
}
