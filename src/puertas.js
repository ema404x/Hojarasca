// Las puertas: se abren y se cierran de verdad, con su bisagra, su chirrido
// y su colisión, que desaparece mientras están abiertas.
import * as THREE from 'three';
import { lerp, clamp } from './ruido.js';
import { fusionarPorMaterial } from './fusion.js';

// 2.7.3: una hoja de puerta es un cuerpo rígido: tablas, travesaños, bisagras y
// picaporte giran (o corren) juntos, nunca uno respecto del otro. Se juntan en una
// malla por material (con las mismas banderas de sombra), adentro de la hoja; la hoja
// y su bisagra siguen siendo objetos propios que se mueven igual que antes. Lo que
// queda adentro no se mueve más respecto de la hoja: su matriz se calcula una vez.
function rigida(g) {
  fusionarPorMaterial(g);
  for (const m of g.children) { m.updateMatrix(); m.matrixAutoUpdate = false; }
}

export function crearPuertas(T, escena, col, sonido) {
  const lista = [];
  const tmp = new THREE.Vector3();

  const madera = new THREE.MeshLambertMaterial({ color: 0x6b5238 });
  const maderaOscura = new THREE.MeshLambertMaterial({ color: 0x4a3b2c });
  const hierro = new THREE.MeshLambertMaterial({ color: 0x3f3830 });
  const maderaPostigo = new THREE.MeshLambertMaterial({ color: 0x4d6b52 });
  const maderaPostigoOscura = new THREE.MeshLambertMaterial({ color: 0x3f5a44 });

  // Una puerta: hoja de tablas, marco, bisagras y picaporte
  function hoja(ancho, alto, tipo) {
    const g = new THREE.Group();
    const tablas = Math.max(3, Math.round(ancho / 0.26));
    for (let i = 0; i < tablas; i++) {
      const w = ancho / tablas;
      const t = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, alto, 0.06), i % 2 ? madera : maderaOscura);
      t.position.set(-ancho / 2 + w / 2 + i * w, alto / 2, 0);
      t.castShadow = true;
      g.add(t);
    }
    // travesaños en Z, como las puertas de campo
    for (const y of [alto * 0.22, alto * 0.78]) {
      const tr = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.96, 0.1, 0.03), maderaOscura);
      tr.position.set(0, y, 0.045);
      g.add(tr);
    }
    if (tipo !== 'lisa') {
      const diag = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(ancho, alto * 0.56) * 0.95, 0.08, 0.03), maderaOscura);
      diag.position.set(0, alto * 0.5, 0.045);
      diag.rotation.z = Math.atan2(alto * 0.56, ancho);
      g.add(diag);
    }
    // bisagras y picaporte
    for (const y of [alto * 0.18, alto * 0.82]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.3, 0.07, 0.04), hierro);
      b.position.set(-ancho / 2 + ancho * 0.15, y, 0.05);
      g.add(b);
    }
    const pic = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6), hierro);
    pic.position.set(ancho / 2 - 0.12, alto * 0.5, 0.08);
    pic.rotation.x = Math.PI / 2;
    g.add(pic);
    rigida(g);   // 2.7.3: de ~10 llamadas de dibujo por hoja a 4 (y de 5 a 2 en la sombra)
    return g;
  }

  // Registra una puerta en coordenadas locales de una construcción
  // lx, lz: el centro del hueco; haciaFuera: +1 si la puerta abre hacia -z local
  // Un portón que corre sobre su riel, como el del galpón de esquila
  function agregarCorrediza({ sitio, rot, lx, lz, ancho = 3, alto = 2.9, lado = -1, nombre = 'el portón', duenio = null }) {
    const g = new THREE.Group();
    const w = (a, b) => ({
      x: sitio.x + a * Math.cos(rot) + b * Math.sin(rot),
      z: sitio.z - a * Math.sin(rot) + b * Math.cos(rot),
    });
    const centro = w(lx, lz);
    const baseY = sitio.y !== undefined ? sitio.y : T.altura(sitio.x, sitio.z);
    const y = baseY + (sitio.piso || 0);
    g.position.set(centro.x, y, centro.z);
    g.rotation.y = rot;
    const h = hoja(ancho, alto, 'porton');
    g.add(h);
    escena.add(g);
    const puerta = {
      g, hoja: h, nombre, ancho, alto, lado, corrediza: true, abierta: 0, objetivo: 0,
      x: centro.x, z: centro.z, rot, y, lx, lz, sitio, duenio,
    };
    puerta.col = { seg: true, dinamico: true, duenio, r: 0.16,
      ax: w(lx - ancho / 2, lz).x, az: w(lx - ancho / 2, lz).z,
      bx: w(lx + ancho / 2, lz).x, bz: w(lx + ancho / 2, lz).z,
      alturaMin: baseY - 0.16, alturaMax: y + alto };
    col.agregar(puerta.col);
    sincronizarColision(puerta);
    lista.push(puerta);
    return puerta;
  }

  // Los postigos de una ventana: dos hojitas que se abren hacia afuera
  function agregarPostigos({ sitio, rot, lx, ly, lz, ancho = 1.1, alto = 0.8, nombre = 'los postigos', duenio = null }) {
    const g = new THREE.Group();
    const w = (a, b) => ({
      x: sitio.x + a * Math.cos(rot) + b * Math.sin(rot),
      z: sitio.z - a * Math.sin(rot) + b * Math.cos(rot),
    });
    const centro = w(lx, lz);
    const y = (sitio.y !== undefined ? sitio.y : T.altura(sitio.x, sitio.z)) + (ly || 1.4);
    g.position.set(centro.x, y, centro.z);
    g.rotation.y = rot;
    const hojas = [];
    for (const l of [-1, 1]) {
      const piv = new THREE.Group();
      piv.position.x = l * (ancho / 2);
      const tablas = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const t = new THREE.Mesh(new THREE.BoxGeometry(ancho / 2 * 0.92, alto / 3 * 0.9, 0.04), i % 2 ? maderaPostigo : maderaPostigoOscura);
        t.position.set(-l * (ancho / 4), -alto / 2 + alto / 6 + i * (alto / 3), 0);
        t.castShadow = true;
        tablas.add(t);
      }
      // 2.7.3: las tres tablas de cada hojita giran juntas con su pivote
      rigida(tablas);
      tablas.updateMatrix(); tablas.matrixAutoUpdate = false;
      piv.add(tablas);
      g.add(piv);
      hojas.push({ piv, l });
    }
    escena.add(g);
    const p = { g, hojas, nombre, postigo: true, abierta: 0, objetivo: 0, x: centro.x, z: centro.z, y, rot, alto, col: null, duenio };
    lista.push(p);
    return p;
  }

  // 3.0.1: `adentro`: la hoja se abre hacia adentro (en las cabañas, abierta hacia la
  // galería cortaba el paso: la mitad de la galería y el banco quedaban del otro lado)
  function agregar({ sitio, rot, lx, lz, ancho = 0.95, alto = 1.95, lado = 1, tipo = 'campo', nombre = 'la puerta', duenio = null, adentro = false }) {
    const g = new THREE.Group();
    const w = (a, b) => ({
      x: sitio.x + a * Math.cos(rot) + b * Math.sin(rot),
      z: sitio.z - a * Math.sin(rot) + b * Math.cos(rot),
    });
    const bisagra = w(lx - (ancho / 2) * lado, lz);
    const y = sitio.y !== undefined ? sitio.y : T.altura(sitio.x, sitio.z);
    g.position.set(bisagra.x, y + (sitio.piso || 0), bisagra.z);
    g.rotation.y = rot;
    const h = hoja(ancho, alto, tipo);
    h.position.x = (ancho / 2) * lado;
    // 2.7.3: la hoja batiente gira con `g` (su bisagra); respecto de ella queda quieta
    h.updateMatrix(); h.matrixAutoUpdate = false;
    g.add(h);
    escena.add(g);

    // el marco, que queda fijo
    const centro = w(lx, lz);
    const puerta = {
      g, nombre, ancho, alto, lado, abierta: 0, objetivo: 0,
      x: centro.x, z: centro.z, rot, y: y + (sitio.piso || 0),
      col: null, ruido: 0, duenio, adentro: !!adentro,
    };
    // mientras está cerrada, la puerta choca
    // 3.0.1: radio 0,07 (la hoja tiene 6 cm): con 0,14 se comía 14 cm de cada vano del
    // lado de la bisagra, y del otro lado no se veía nada que frenara
    puerta.col = { seg: true, dinamico: true, duenio, r: 0.07,
      ax: w(lx - ancho / 2, lz).x, az: w(lx - ancho / 2, lz).z,
      bx: w(lx + ancho / 2, lz).x, bz: w(lx + ancho / 2, lz).z,
      alturaMin: y - 0.16, alturaMax: puerta.y + alto };
    col.agregar(puerta.col);
    sincronizarColision(puerta);
    lista.push(puerta);
    return puerta;
  }

  // Las puertas de módulos construidos tienen ciclo de vida propio: al mover,
  // desmontar o rehacer una pieza hay que retirar hoja, postigos y colisión
  // dinámica de forma atómica. Los materiales se comparten y no se disponen.
  function eliminarPorDuenio(duenio) {
    if (!duenio) return 0;
    let n = 0;
    for (let i = lista.length - 1; i >= 0; i--) {
      const p = lista[i];
      if (p.duenio !== duenio) continue;
      if (p.col && col.eliminar) col.eliminar(p.col);
      p.g?.traverse?.((o) => { if (o.geometry?.dispose) o.geometry.dispose(); });
      if (p.g?.parent) p.g.parent.remove(p.g); else escena.remove(p.g);
      lista.splice(i, 1); n++;
    }
    return n;
  }

  function cerca(pos, radio = 3.2) {
    let mejor = null, d0 = radio;
    const py = Number.isFinite(pos?.y) ? pos.y : null;
    for (const p of lista) {
      const dy = py === null ? 0 : Math.abs(py - p.y);
      // En construcciones multinivel una puerta exactamente encima puede tener
      // el mismo X/Z. La tolerancia vieja (3 m) permitía accionar la planta baja
      // desde el piso superior. Una puerta interactuable debe estar en tu nivel.
      if (dy > 1.55) continue;
      const d = Math.hypot(p.x - pos.x, p.z - pos.z, dy * 0.45);
      if (d < d0) { d0 = d; mejor = p; }
    }
    return mejor;
  }

  function sincronizarColision(puerta) {
    if (!puerta?.col) return;
    // La colisión sigue físicamente a la hoja durante toda la animación. Así
    // no hay una pared invisible en el hueco ni una hoja visible atravesable.
    // La colisión está registrada como dinámica: puede cruzar límites de celda
    // o desplazarse varios metros sin quedar atada al índice de su posición inicial.
    puerta.col.alturaMax = puerta.y + puerta.alto;
    if (puerta.corrediza) {
      const desplazamiento = puerta.lado * puerta.abierta * (puerta.ancho * 0.98);
      const cos = Math.cos(puerta.rot), sin = Math.sin(puerta.rot);
      const cx = puerta.g.position.x + desplazamiento * cos;
      const cz = puerta.g.position.z - desplazamiento * sin;
      const hx = cos * puerta.ancho / 2;
      const hz = -sin * puerta.ancho / 2;
      puerta.col.ax = cx - hx; puerta.col.az = cz - hz;
      puerta.col.bx = cx + hx; puerta.col.bz = cz + hz;
      return;
    }
    const ang = puerta.g.rotation.y;
    const largo = puerta.lado * puerta.ancho;
    puerta.col.ax = puerta.g.position.x;
    puerta.col.az = puerta.g.position.z;
    puerta.col.bx = puerta.g.position.x + Math.cos(ang) * largo;
    puerta.col.bz = puerta.g.position.z - Math.sin(ang) * largo;
  }

  function accionar(puerta) {
    if (!puerta) return;
    puerta.objetivo = puerta.objetivo > 0.5 ? 0 : 1;
    if (puerta.postigo && sonido) {
      sonido.bisagra({ x: puerta.x, y: puerta.y, z: puerta.z });
      return;
    }
    if (puerta.corrediza && sonido) {
      sonido.riel({ x: puerta.x, y: puerta.y + 1, z: puerta.z });
      return;
    }
    if (sonido) {
      if (puerta.objetivo > 0.5) sonido.bisagra({ x: puerta.x, y: puerta.y + 1, z: puerta.z });
      else sonido.portazo({ x: puerta.x, y: puerta.y + 1, z: puerta.z });
    }
  }

  function actualizar(dt) {
    for (const p of lista) {
      if (Math.abs(p.abierta - p.objetivo) < 0.001) {
        sincronizarColision(p);
        continue;
      }
      p.abierta = lerp(p.abierta, p.objetivo, 1 - Math.exp(-dt * (p.corrediza ? 4 : 7)));
      if (Math.abs(p.abierta - p.objetivo) < 0.01) p.abierta = p.objetivo;
      if (p.corrediza) {
        // el portón corre sobre su riel, a un costado
        p.hoja.position.x = p.lado * p.abierta * (p.ancho * 0.98);
      } else if (p.postigo) {
        for (const h of p.hojas) h.piv.rotation.y = h.l * p.abierta * 2.0;
      } else {
        // la hoja gira sobre su bisagra, hasta noventa grados y pico
        p.g.rotation.y = p.rot - (p.adentro ? -1 : 1) * p.lado * p.abierta * 1.75;
      }
      sincronizarColision(p);
    }
  }

  function aperturaPorDuenio(duenio) {
    if (!duenio) return null;
    const puerta = lista.find((p) => p.duenio === duenio && !p.postigo);
    if (!puerta) return null;
    return { abierta: puerta.abierta || 0, objetivo: puerta.objetivo || 0, puerta };
  }

  return { agregar, agregarCorrediza, agregarPostigos, eliminarPorDuenio, cerca, accionar, actualizar, aperturaPorDuenio, lista };
}
