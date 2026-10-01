// El refugio se va llenando con lo tuyo: las fotos colgadas, la leña apilada,
// los frascos en el estante, la caña en el rincón y la manta sobre la cama.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { materialVegetal } from './materiales.js';

const MADERA = '#6b5238';
const MADERA_OSCURA = '#4a3b2c';

export function crearRefugioVivo(T, escena) {
  const ref = T.lugares.refugio;
  const grupo = new THREE.Group();
  grupo.position.set(ref.x, ref.y, ref.z);
  grupo.rotation.y = ref.rot;
  escena.add(grupo);

  const mat = materialVegetal({ flex: 0 });
  let mallaCosas = null;
  const cuadros = [];
  let firma = '';

  const aMundo = (lx, lz) => ({
    x: ref.x + lx * Math.cos(ref.rot) + lz * Math.sin(ref.rot),
    z: ref.z - lx * Math.sin(ref.rot) + lz * Math.cos(ref.rot),
  });

  // Vuelve a armar lo que hay adentro, según el progreso
  function reconstruir(progreso) {
    const leña = Math.min(18, progreso.ramitas || 0);
    const frascos = ['pinones-tostados', 'dulce-calafate', 'frutillas-brasas', 'mate', 'te-galesa', 'chocolate'].filter((k) => progreso.entradas[k]).length;
    const caña = !!progreso.cosas?.mosca;
    const manta = !!progreso.cosas?.manta;
    const fotos = Object.entries(progreso.desafios || {}).filter(([, d]) => d && d.img).slice(-4);
    const nueva = `${leña}|${frascos}|${caña}|${manta}|${fotos.map(([k]) => k).join(',')}`;
    if (nueva === firma) return;
    firma = nueva;

    if (mallaCosas) { grupo.remove(mallaCosas); mallaCosas.geometry.dispose(); mallaCosas = null; }
    for (const cuadro of cuadros) {
      grupo.remove(cuadro);
      cuadro.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry?.dispose?.();
        const materiales = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of materiales) { m?.map?.dispose?.(); m?.dispose?.(); }
      });
    }
    cuadros.length = 0;

    const c = new Constructor();
    let algo = false;

    // leña apilada arriba de la pila del refugio (junto a la pared izquierda), de a tres
    // por hilera. 2.8: antes usaba un plano viejo y quedaba bajo el piso, en el medio.
    for (let i = 0; i < leña; i++) {
      algo = true;
      const fila = Math.floor(i / 3), col = i % 3;
      c.agregar(new THREE.CylinderGeometry(0.07, 0.08, 0.95, 6), {
        color: i % 3 ? MADERA : '#5b4a36', tipo: 0, variar: 0.12,
        matriz: matriz([-2.65, 1.02 + fila * 0.15, 1.0 + col * 0.21], [0, 0, Math.PI / 2]),
      });
    }
    // frascos y latas en el estante
    // 2.8: sobre la estantería de verdad (pared del fondo): tres en la punta libre de la
    // tabla de arriba (el resto es de las fotos) y tres entre los frascos de la de abajo
    // 3.0.1: las dos tablas ya tienen cinco frascos cada una (y la punta izquierda entra
    // en la chimenea): los tuyos van en los huecos de las dos, sin atravesar ninguno
    for (let i = 0; i < frascos; i++) {
      algo = true;
      const arriba = i < 3;
      const x = -1.875 + (i % 3) * 0.45;
      const y = arriba ? 1.91 : 1.48;
      c.agregar(new THREE.CylinderGeometry(0.075, 0.075, 0.2, 8), {
        color: ['#8a5a3c', '#6a7a4a', '#9a6a2c', '#7a4a52', '#5f7a86', '#8e9c6a'][i % 6],
        tipo: 4, variar: 0.1, matriz: matriz([x, y, -2.55]),
      });
      c.agregar(new THREE.CylinderGeometry(0.08, 0.08, 0.035, 8), { color: '#c9bfa6', tipo: 4, matriz: matriz([x, y + 0.11, -2.55]) });
    }
    // la caña apoyada en el rincón
    if (caña) {
      algo = true;
      // 2.8: en el rincón de adelante a la derecha (antes atravesaba la mesa)
      c.agregar(new THREE.CylinderGeometry(0.018, 0.028, 2.3, 5), { color: '#6b5238', tipo: 0, matriz: matriz([3.2, 1.47, 2.4], [0.17, 0, 0.1]) });
      c.agregar(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), { color: '#3f3830', tipo: 4, matriz: matriz([3.13, 0.92, 2.44], [0, 0, Math.PI / 2]) });
    }
    // la manta doblada a los pies de la cama
    if (manta) {
      algo = true;
      // 2.8: sobre la cama de verdad (contra la pared del fondo), a los pies; antes flotaba
      // en el medio del cuarto
      c.agregar(new THREE.BoxGeometry(0.5, 0.14, 0.9), { color: '#9a8f7c', tipo: 4, variar: 0.08, matriz: matriz([2.95, 0.87, -2.0]) });
      c.agregar(new THREE.BoxGeometry(0.52, 0.05, 0.92), { color: '#6b6152', tipo: 4, matriz: matriz([2.95, 0.965, -2.0]) });
    }

    if (algo) {
      mallaCosas = new THREE.Mesh(c.geometria(), mat);
      mallaCosas.castShadow = true;
      mallaCosas.receiveShadow = true;
      grupo.add(mallaCosas);
    }

    // las fotos, colgadas en la pared con su marco
    fotos.forEach(([, d], i) => {
      const tex = new THREE.TextureLoader().load(d.img);
      tex.colorSpace = THREE.SRGBColorSpace;
      const ancho = 0.46, alto = 0.34;
      const marco = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.07, alto + 0.07, 0.03), new THREE.MeshLambertMaterial({ color: 0x6b4e33 }));
      const lamina = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: tex }));
      lamina.position.z = 0.019;
      marco.add(lamina);
      // Anclaje real a la cara interior de la pared del fondo. En versiones
      // anteriores se usaba z=-1.68 aunque esa pared está cerca de z=-2.75,
      // dejando las fotos suspendidas más de un metro dentro de la habitación.
      const zPared = Number.isFinite(ref.paredFondoInteriorZ)
        ? ref.paredFondoInteriorZ
        : -((ref.dimensiones?.D ?? 5.5) / 2) + 0.20;
      // 3.0.1: por encima de la tabla de arriba y sus frascos (a 1,95 m la foto cortaba la
      // tabla y los frascos la atravesaban)
      marco.position.set(-1.4 + i * 0.62, 2.25, zPared);
      marco.rotation.z = (i % 2 ? 1 : -1) * 0.018;
      grupo.add(marco);
      cuadros.push(marco);
    });
  }

  return { grupo, reconstruir, cerca: (p) => Math.hypot(p.x - ref.x, p.z - ref.z) < 26, aMundo };
}
