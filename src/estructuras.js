// Construcciones de madera del sendero, con sus colisiones y plataformas
import * as THREE from 'three';
import { Constructor, matriz, troncoCurvo } from './geometria.js';
import { materialVegetal } from './materiales.js';
import { piezas } from './piezas.js';
import { rng, lerp } from './ruido.js';
import { LAGO } from './config.js';
import { fusionarPorMaterial } from './fusion.js';
import { registrarLuz } from './luces.js';
import { marcarConstructor } from './estilo-casa.js';
import { crearDecoRefugio } from './personal-casa-mundo.js';

const MADERA = '#6e5238', MADERA_OSCURA = '#4e3a28', TABLA = '#8a6b4a';

function cilindroEntre(c, a, b, radio, color, tipo = 0) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const largo = Math.hypot(dx, dy, dz);
  const geo = new THREE.CylinderGeometry(radio, radio, largo, 7, 1, false);
  geo.translate(0, largo / 2, 0);
  const dir = new THREE.Vector3(dx, dy, dz).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...a), q, new THREE.Vector3(1, 1, 1));
  c.agregar(geo, { color, tipo, matriz: m, variar: 0.1 });
}

function caja(c, pos, tam, color, rotY = 0, tipo = 0) {
  c.agregar(new THREE.BoxGeometry(...tam), { color, tipo, matriz: matriz(pos, [0, rotY, 0]), variar: 0.08 });
}

function cartelTextura(texto) {
  const lienzo = document.createElement('canvas');
  lienzo.width = 512; lienzo.height = 128;
  const x = lienzo.getContext('2d');
  x.fillStyle = '#6b4e33'; x.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 40; i++) {
    x.strokeStyle = `rgba(40,25,12,${0.1 + Math.random() * 0.2})`; x.lineWidth = 1 + Math.random() * 2;
    const y = Math.random() * 128;
    x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(170, y + Math.random() * 8 - 4, 340, y + Math.random() * 8 - 4, 512, y); x.stroke();
  }
  // 3.6.1 (mundo): el texto entra en la tabla (como en los carteles de la aldea): «RAMOS GENERALES» medía
  // más que el lienzo y salía sin la R ni la S (y «Ramos Generales» se pasaba del borde de la tabla)
  let tam = 58;
  x.font = `600 ${tam}px Spectral, Georgia, serif`;
  while (tam > 20 && x.measureText(texto).width > 440) { tam -= 2; x.font = `600 ${tam}px Spectral, Georgia, serif`; }
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(255,230,190,0.18)'; x.fillText(texto, 258, 68);
  x.fillStyle = '#2a1a0e'; x.fillText(texto, 256, 66);
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// 2.7.3: el mismo repaso de matrices de three r186 (Object3D.updateMatrixWorld), salvo
// que un hijo oculto no se recorre. Es lo que hace la escena con sus hijos desde la
// 2.2 (ver main.js), un nivel más adentro: acá los ocultos son los edificios que el
// LOD apagó. Cuando uno vuelve a verse se recalcula entero una vez, antes de dibujarse,
// así nunca aparece con una posición vieja (las aspas siguen girando mientras tanto).
function repasoSinOcultos(obj) {
  obj.updateMatrixWorld = function (forzar) {
    if (this.matrixAutoUpdate) this.updateMatrix();
    if (this.matrixWorldNeedsUpdate || forzar) {
      if (this.matrixWorldAutoUpdate === true) {
        if (this.parent === null) this.matrixWorld.copy(this.matrix);
        else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
      }
      this.matrixWorldNeedsUpdate = false;
      forzar = true;
    }
    const hijos = this.children;
    for (let i = 0, n = hijos.length; i < n; i++) {
      const h = hijos[i];
      if (!h.visible) { h.__sinRepaso = true; continue; }
      if (h.__sinRepaso) { h.__sinRepaso = false; h.updateMatrixWorld(true); } else h.updateMatrixWorld(forzar);
    }
  };
}

// 3.6: `opciones.aldea` (sólo en el Relax): { almacen, 'casa-te' } con el sitio de cada uno en la
// Aldea de los Duendes (`sitioEstructura` de aldea.js). Ahí se arman, en vez de donde los ponía
// el sorteo; el sorteo corre igual (las mismas llamadas a r(), buscarLlano y registrarHuella, en
// el lugar de siempre), así la torre, la cueva y el galpón no se mueven. `opciones.sorteo`: el
// terreno de antes de emparejar la aldea (ver aldea-mundo.js), para que el sorteo vea lo mismo
// que sin aldea.
export function crearEstructuras(T, escena, col, veg, puertas, opciones = {}) {
  const mat = materialVegetal({ flex: 0 });
  const enAldea = opciones.aldea || null;
  const TS = opciones.sorteo || T;
  const grupo = new THREE.Group();
  escena.add(grupo);
  const r = rng(31);
  const L = T.lugares;
  const sentaderos = [];   // lugares para sentarse con buena vista
  const carteles = [];
  let fusionados = 0;      // cuántas llamadas de dibujo ahorró juntar lo que no se mueve
  let armado = false;      // 2.7.3: ya se fusionó y se fijaron las matrices (ver el final)
  // Vidrio estructural de doble cara. Las ventanas son planos muy finos; con
  // FrontSide podían desaparecer al mirarlas desde el interior y, si el resto
  // del edificio quedaba fuera de un culling defectuoso, parecían placas negras
  // flotando. Mantener MeshBasic preserva el brillo nocturno controlado desde
  // main.js, pero DoubleSide hace coherente la lectura desde ambos lados.
  const materialVidrio = (color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });

  const montar = (c, pos, rotY) => {
    const m = new THREE.Mesh(c.geometria(), mat);
    m.position.set(...pos); m.rotation.y = rotY;
    m.castShadow = true; m.receiveShadow = true;
    grupo.add(m);
    return m;
  };
  const aMundo = (base, rotY, lx, lz) => ({
    x: base.x + lx * Math.cos(rotY) + lz * Math.sin(rotY),
    z: base.z - lx * Math.sin(rotY) + lz * Math.cos(rotY),
  });
  // Altura del terreno expresada en coordenadas locales de una estructura.
  // Es la base de la pasada de terminación V7: todo elemento exterior que toca
  // el suelo consulta la cota REAL bajo sus pies, en vez de asumir que todo el
  // lote está exactamente a la altura del centro del edificio.
  const sueloLocal = (sitio, rotY, lx, lz) => {
    const q = aMundo(sitio, rotY, lx, lz);
    return T.altura(q.x, q.z) - (sitio.y ?? 0);
  };
  const posteHastaTerreno = (c, sitio, rotY, lx, lz, yTope, radio = 0.1, color = MADERA_OSCURA, enterrar = 0.14, fisico = false) => {
    const suelo = sueloLocal(sitio, rotY, lx, lz);
    const base = Math.min(yTope - radio * 1.2, suelo - enterrar);
    if (yTope - base > 0.08) cilindroEntre(c, [lx, base, lz], [lx, yTope, lz], radio, color);
    // Los pilares estructurales principales no pueden ser sólo decoración.
    // Se activa por llamada para no convertir patas de bancos/leñeras en una
    // nube de pequeñas colisiones molestas.
    if (fisico) {
      const q = aMundo(sitio, rotY, lx, lz);
      const oy = sitio.y ?? 0;
      col.agregar({ x: q.x, z: q.z, r: Math.max(0.11, radio * 1.25),
        alturaMin: oy + suelo - 0.08, alturaMax: oy + yTope + 0.06 });
    }
    return suelo;
  };
  // Detalles que comparten todas las construcciones
  const marcoVentana = (c, [x, y, z], ancho, alto, rotY = 0, postigos = true) => {
    const M = (px, py, sx, sy, sz) => c.agregar(new THREE.BoxGeometry(sx, sy, sz), { color: '#5f462d', tipo: 4, variar: 0.08, matriz: matriz([x + px * Math.cos(rotY), y + py, z - px * Math.sin(rotY)], [0, rotY, 0]) });
    M(0, alto / 2 + 0.07, ancho + 0.28, 0.14, 0.14);
    M(0, -alto / 2 - 0.07, ancho + 0.28, 0.14, 0.14);
    M(-(ancho / 2 + 0.07), 0, 0.14, alto + 0.28, 0.14);
    M(ancho / 2 + 0.07, 0, 0.14, alto + 0.28, 0.14);
    M(0, 0, 0.09, alto, 0.1);
    if (postigos) for (const l of [-1, 1]) {
      c.agregar(new THREE.BoxGeometry(ancho / 2 + 0.05, alto + 0.1, 0.07), { color: '#4d6b52', tipo: 4, variar: 0.1,
        matriz: matriz([x + l * (ancho * 0.76) * Math.cos(rotY), y, z - l * (ancho * 0.76) * Math.sin(rotY)], [0, rotY, 0]) });
    }
  };
  const mensulas = (c, y, z, xs, rotY = 0) => {
    for (const x of xs) for (const l of [-1, 1]) {
      c.agregar(new THREE.BoxGeometry(0.52, 0.1, 0.1), { color: MADERA_OSCURA, tipo: 0,
        matriz: matriz([x + l * 0.2 * Math.cos(rotY), y, z - l * 0.2 * Math.sin(rotY)], [0, rotY, l * 0.72]) });
    }
  };
  const pilaLena = (c, [x, y, z], filas = 3, largo = 1.3, rotY = 0) => {
    for (let i = 0; i < filas * 4; i++) {
      const fila = Math.floor(i / 4), col = i % 4;
      const dz = -0.33 + col * 0.22;
      cilindroEntre(c, [x - Math.cos(rotY) * largo / 2, y + 0.12 + fila * 0.22, z + dz + Math.sin(rotY) * largo / 2],
        [x + Math.cos(rotY) * largo / 2, y + 0.12 + fila * 0.22, z + dz - Math.sin(rotY) * largo / 2], 0.1, i % 2 ? MADERA : '#6a5136');
    }
  };

  // Detalle estructural reutilizable: apoyos de piedra irregulares que
  // hacen que la madera parezca realmente descansada sobre el terreno, no
  // simplemente posicionada encima de una textura. Se mantienen pequeños
  // para no cambiar la silueta jugable ni cargar demasiado la escena.
  const apoyosPiedra = (c, puntos, y = 0.08, escala = 0.42) => {
    const paleta = ['#77736b', '#88837a', '#69665f', '#918c82'];
    for (let i = 0; i < puntos.length; i++) {
      const [x, z, s = escala] = puntos[i];
      c.agregar(new THREE.IcosahedronGeometry(s, 0), {
        color: paleta[i % paleta.length], tipo: 4, variar: 0.14,
        matriz: matriz([x, y, z], [i * 0.73, i * 1.17, i * 0.29], [1.15, 0.55, 0.95]),
      });
    }
  };

  // Herrajes discretos: clavos/remaches que rompen la regularidad perfecta
  // de las piezas y además ayudan a leer cómo está montada cada estructura.
  const remache = (c, [x, y, z], rot = [Math.PI / 2, 0, 0], r = 0.025, color = '#3e3934') => {
    c.agregar(new THREE.CylinderGeometry(r, r, r * 1.8, 6), {
      color, tipo: 4, matriz: matriz([x, y, z], rot), variar: 0.03,
    });
  };

  const riostra = (c, a, b, radio = 0.055, color = MADERA_OSCURA) => {
    cilindroEntre(c, a, b, radio, color);
  };

  const listonAlero = (c, W, D, y, vuelo = 0.45, color = MADERA_OSCURA) => {
    for (const sx of [-1, 1]) {
      caja(c, [sx * (W / 4 + vuelo * 0.35), y, 0], [0.12, 0.16, D + vuelo * 1.8], color, 0, 4);
    }
  };

  // Carpintería portante compartida: hace explícita la lógica constructiva de
  // cada edificio. Soleras abajo, vigas de coronación arriba y riostras en
  // esquinas. Si se conoce la cumbrera, también añade pares visibles.
  const marcoEstructural = (c, { W, D, H, base = 0.32, techo = null, color = MADERA_OSCURA }) => {
    const viga = (a, b, radio = 0.055, col = color) => riostra(c, a, b, radio, col);
    for (const z of [-D / 2, D / 2]) caja(c, [0, base, z], [W, 0.14, 0.16], color, 0, 4);
    for (const x of [-W / 2, W / 2]) caja(c, [x, base, 0], [0.16, 0.14, D], color, 0, 4);
    const yc = H + 0.08;
    for (const z of [-D / 2, D / 2]) caja(c, [0, yc, z], [W + 0.08, 0.13, 0.16], color, 0, 4);
    for (const x of [-W / 2, W / 2]) caja(c, [x, yc, 0], [0.16, 0.13, D], color, 0, 4);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (W / 2 - 0.1), z = sz * (D / 2 - 0.1);
      viga([x, base + 0.08, z], [x - sx * 0.5, Math.min(H - 0.15, base + 1.1), z], 0.045);
    }
    if (techo !== null && techo > H + 0.2) {
      for (const x of [-W * 0.32, 0, W * 0.32]) {
        viga([x, H + 0.08, -D / 2 + 0.12], [x, techo, 0], 0.05);
        viga([x, H + 0.08, D / 2 - 0.12], [x, techo, 0], 0.05);
      }
      caja(c, [0, techo, 0], [0.16, 0.16, D + 0.3], color, 0, 4);
    }
  };

  // ---------------------------------------------------------------------------
  // Sistema arquitectónico 2.0
  //
  // Estas utilidades no son decoración arbitraria: expresan cómo se apoya,
  // arriostra y cubre un edificio. Mantenerlas acá evita que cada estructura
  // invente su propia solución y vuelva a separar lo visual de lo físico.

  // Pilotes que terminan exactamente en el terreno real bajo cada apoyo. Los
  // viejos pilotes bajaban una profundidad fija y podían asomar en una ladera
  // o quedar "flotando" si el suelo local estaba más bajo.
  // 3.0.1: `topePiso` (la cara de arriba del piso que sostienen): en una ladera la piedra
  // de apoyo, puesta sobre el terreno, asomaba por encima del piso, adentro de la casa.
  // Si quedaría más alta que el piso, no se pone (el pilote ya está enterrado).
  const pilotesAlTerreno = (c, sitio, rotY, puntos, yPiso = 0.2, radio = 0.12, color = MADERA_OSCURA, topePiso = Infinity) => {
    for (const [lx, lz] of puntos) {
      const suelo = posteHastaTerreno(c, sitio, rotY, lx, lz, yPiso, radio, color);
      if (suelo + radio * 1.79 > topePiso - 0.01) continue;
      // una piedra de apoyo hace visible la transferencia de carga al suelo
      c.agregar(new THREE.IcosahedronGeometry(radio * 2.25, 0), {
        color: '#77736b', tipo: 4, variar: 0.14,
        matriz: matriz([lx, suelo + radio * 0.55, lz], [0.1, (lx * 1.7 + lz * 0.9), 0.05], [1.15, 0.55, 0.95]),
      });
    }
  };

  // Cubierta a dos aguas construida en piezas: faldones segmentados, cabios,
  // fascia, cumbrera, goterón y (si corresponde) chapa acanalada. Sigue siendo
  // una sola malla combinada, de modo que el salto de detalle no multiplica
  // draw calls.
  const techoDosAguasDetallado = (c, {
    W, D, H, alzada, vueloX = 0.55, vueloZ = 0.55,
    estilo = 'madera', colores = null, canaleta = false, colorEstructura = MADERA_OSCURA,
    sitio = null, rotY = 0,
  }) => {
    const paleta = colores || (estilo === 'chapa'
      ? ['#77756f', '#85817a', '#706e68', '#8a7667']
      : ['#45382f', '#4b3d32', '#3f342c', '#514137']);
    const run = W / 2 + vueloX;
    const pendiente = alzada / Math.max(0.1, W / 2);
    const yAlero = H - pendiente * vueloX;
    const yCumbrera = H + alzada;
    const subida = yCumbrera - yAlero;
    const incl = Math.atan2(subida, run);
    const largo = Math.hypot(run, subida);
    const totalZ = D + vueloZ * 2;
    const modulo = estilo === 'chapa' ? 0.78 : 0.56;
    const n = Math.max(5, Math.ceil(totalZ / modulo));
    const anchoPanel = totalZ / n;

    for (const lado of [-1, 1]) {
      const rz = -lado * incl;
      for (let i = 0; i < n; i++) {
        const z = -totalZ / 2 + anchoPanel * (i + 0.5);
        c.agregar(new THREE.BoxGeometry(largo + 0.05, estilo === 'chapa' ? 0.075 : 0.095, anchoPanel + 0.025), {
          color: paleta[(i + (lado > 0 ? 1 : 0)) % paleta.length], tipo: 4, variar: estilo === 'chapa' ? 0.06 : 0.11,
          matriz: matriz([lado * run / 2, (yCumbrera + yAlero) / 2, z], [0, 0, rz]),
        });
        if (estilo === 'chapa') {
          // dos nervaduras por hoja: a distancia se lee como chapa acanalada
          for (const dz of [-anchoPanel * 0.27, anchoPanel * 0.27]) {
            c.agregar(new THREE.BoxGeometry(largo - 0.06, 0.025, 0.026), {
              color: '#5d5e5b', tipo: 4, variar: 0.03,
              matriz: matriz([lado * run / 2, (yCumbrera + yAlero) / 2 + 0.052, z + dz], [0, 0, rz]),
            });
          }
        }
      }
      // cabios vistos bajo el alero y en el interior
      const paso = 1.25;
      const nr = Math.max(3, Math.floor(totalZ / paso));
      for (let i = 0; i <= nr; i++) {
        const z = -totalZ / 2 + (i / nr) * totalZ;
        cilindroEntre(c,
          [lado * (W / 2 + vueloX - 0.06), yAlero - 0.08, z],
          [0, yCumbrera - 0.1, z], 0.045, colorEstructura);
      }
      // tabla de fascia en el borde del faldón
      caja(c, [lado * (W / 2 + vueloX), yAlero - 0.02, 0], [0.13, 0.2, totalZ + 0.06], colorEstructura, 0, 4);
      // remates inclinados en los testeros
      for (const z of [-totalZ / 2, totalZ / 2]) {
        cilindroEntre(c, [lado * (W / 2 + vueloX), yAlero, z], [0, yCumbrera, z], 0.05, colorEstructura);
      }
      if (canaleta) {
        c.agregar(new THREE.CylinderGeometry(0.065, 0.065, totalZ + 0.08, 8), {
          color: '#696d6e', tipo: 4, variar: 0.04,
          matriz: matriz([lado * (W / 2 + vueloX + 0.07), yAlero - 0.11, 0], [Math.PI / 2, 0, 0]),
        });
        const zBajada = -D / 2 + 0.18;
        const xBajada = lado * (W / 2 + vueloX + 0.07);
        const sueloBajada = sitio ? sueloLocal(sitio, rotY, xBajada, zBajada) : 0;
        cilindroEntre(c, [xBajada, sueloBajada + 0.04, zBajada], [xBajada, yAlero - 0.12, zBajada], 0.043, '#666b6d');
        caja(c, [xBajada, sueloBajada + 0.035, zBajada + 0.11], [0.10, 0.07, 0.28], '#666b6d', 0, 4);
        // 3.0.1: el caño de bajada se veía y se atravesaba
        if (sitio) {
          const qB = aMundo(sitio, rotY, xBajada, zBajada);
          col.agregar({ x: qB.x, z: qB.z, r: 0.07, alturaMin: (sitio.y ?? 0) + sueloBajada - 0.1, alturaMax: (sitio.y ?? 0) + yAlero });
        }
      }
    }
    // cumbrera continua, que además oculta la unión perfecta de los faldones
    c.agregar(new THREE.CylinderGeometry(estilo === 'chapa' ? 0.085 : 0.11, estilo === 'chapa' ? 0.085 : 0.11, totalZ + 0.12, 8), {
      color: estilo === 'chapa' ? '#62635f' : colorEstructura, tipo: 4, variar: 0.04,
      matriz: matriz([0, yCumbrera + 0.035, 0], [Math.PI / 2, 0, 0]),
    });
    return { yAlero, yCumbrera, incl, largo, totalZ };
  };

  // Cerchas verdaderas para edificios de luz grande. El galpón deja de tener
  // un techo "suspendido" y pasa a mostrar por qué puede salvar tantos metros.
  const serieCerchas = (c, { W, D, H, alzada, paso = 2.0, color = MADERA_OSCURA }) => {
    const n = Math.max(2, Math.round(D / paso));
    for (let i = 0; i <= n; i++) {
      const z = -D / 2 + (i / n) * D;
      cilindroEntre(c, [-W / 2 + 0.22, H - 0.08, z], [W / 2 - 0.22, H - 0.08, z], 0.055, color);
      cilindroEntre(c, [-W / 2 + 0.18, H, z], [0, H + alzada - 0.12, z], 0.06, color);
      cilindroEntre(c, [W / 2 - 0.18, H, z], [0, H + alzada - 0.12, z], 0.06, color);
      cilindroEntre(c, [0, H - 0.08, z], [0, H + alzada - 0.12, z], 0.045, color);
      cilindroEntre(c, [-W * 0.27, H - 0.08, z], [0, H + alzada - 0.12, z], 0.04, color);
      cilindroEntre(c, [W * 0.27, H - 0.08, z], [0, H + alzada - 0.12, z], 0.04, color);
    }
  };

  // Hiladas irregulares de piedra en la base. Son pequeñas: no alteran la
  // navegación, pero eliminan el aspecto de "caja apoyada sobre el terreno".
  // 3.0.1: `tope`, la cara de arriba del piso: del lado alto de una ladera la hilada
  // seguía al terreno y las piedras atravesaban la pared y el piso hacia adentro. No suben
  // más que lo necesario para que su cresta quede bajo el piso (en llano, igual que antes).
  const zocaloPiedra = (c, W, D, y = 0.12, paso = 0.72, sitio = null, rotY = 0, tope = Infinity) => {
    const piedra = (x, z, i, giro = 0) => {
      const py = sitio ? Math.min(sueloLocal(sitio, rotY, x, z) + 0.13, Math.max(0.13, tope - 0.24)) : y + (i % 2) * 0.035;
      c.agregar(new THREE.IcosahedronGeometry(0.29 + (i % 3) * 0.035, 0), {
        color: ['#77736b', '#8a857b', '#68665f', '#918b80'][i % 4], tipo: 4, variar: 0.15,
        matriz: matriz([x, py, z], [i * 0.21, giro + i * 0.47, i * 0.13], [1.18, 0.62, 0.9]),
      });
    };
    let i = 0;
    for (let x = -W / 2 + 0.28; x <= W / 2 - 0.2; x += paso) { piedra(x, -D / 2 - 0.04, i++); piedra(x, D / 2 + 0.04, i++); }
    for (let z = -D / 2 + 0.35; z <= D / 2 - 0.3; z += paso) { piedra(-W / 2 - 0.04, z, i++, Math.PI / 2); piedra(W / 2 + 0.04, z, i++, Math.PI / 2); }
  };

  // Falda de cimentación adaptada al terreno. En versiones anteriores varias
  // construcciones escondían el desnivel con una caja enorme enterrada bajo el
  // edificio. En una ladera eso podía asomar por un lado, cortar el terreno o
  // verse como un bloque flotante. Esta falda se construye por tramos y sólo
  // rellena el hueco REAL entre el suelo local y la cara inferior del piso.
  const faldaCimientoTerreno = (c, {
    sitio, rotY = 0, W, D, yTope = 0.12, paso = 0.72, espesor = 0.11,
    color = '#4a3b2c', variar = 0.09,
  }) => {
    const tramo = (horizontal, fijo, largo) => {
      const n = Math.max(2, Math.ceil(largo / paso));
      const len = largo / n;
      for (let i = 0; i < n; i++) {
        const q = -largo / 2 + len * (i + 0.5);
        const lx = horizontal ? q : fijo;
        const lz = horizontal ? fijo : q;
        const suelo = sueloLocal(sitio, rotY, lx, lz);
        // Si el terreno ya llega al piso, la falda queda enterrada y no hace
        // falta emitir geometría. Si baja, el panel termina unos centímetros
        // dentro del suelo para que nunca aparezca una línea de luz debajo.
        if (suelo >= yTope - 0.045) continue;
        const base = suelo - 0.08;
        const alto = yTope - base;
        if (alto < 0.08) continue;
        c.agregar(new THREE.BoxGeometry(horizontal ? len + 0.035 : espesor, alto,
          horizontal ? espesor : len + 0.035), {
          color, tipo: 4, variar,
          matriz: matriz([lx, base + alto / 2, lz]),
        });
      }
    };
    tramo(true, -D / 2, W);
    tramo(true, D / 2, W);
    tramo(false, -W / 2, D);
    tramo(false, W / 2, D);
  };

  // Entablado vertical con huecos rectangulares verdaderos. Sirve sobre todo
  // para fachadas comerciales: una vidriera ya no implica borrar la pared de
  // piso a techo ni dejar un agujero alrededor del vidrio.
  const entabladoVertical = (c, {
    W, z, y0, alto, espesor = 0.12, tabla = 0.32, huecos = [], colores = ['#9a7248', '#8a6440'], lado = 1,
  }) => {
    const tope = y0 + alto;
    let i = 0;
    for (let x = -W / 2 + tabla / 2; x < W / 2; x += tabla, i++) {
      let segmentos = [[y0, tope]];
      for (const h of huecos) {
        if (x + tabla / 2 <= h.x0 || x - tabla / 2 >= h.x1) continue;
        const nuevo = [];
        for (const [a, b] of segmentos) {
          if (h.y1 <= a || h.y0 >= b) nuevo.push([a, b]);
          else {
            if (h.y0 > a + 0.03) nuevo.push([a, Math.min(b, h.y0)]);
            if (h.y1 < b - 0.03) nuevo.push([Math.max(a, h.y1), b]);
          }
        }
        segmentos = nuevo;
      }
      for (const [a, b] of segmentos) {
        if (b - a < 0.05) continue;
        c.agregar(new THREE.BoxGeometry(tabla - 0.02, b - a, espesor), {
          color: colores[i % colores.length], tipo: 4, variar: 0.09,
          matriz: matriz([x, (a + b) / 2, z + lado * 0.002]),
        });
        // tapajunta solo sobre madera sólida: nunca cruza puertas o vidrieras
        c.agregar(new THREE.BoxGeometry(0.035, b - a, espesor * 1.18), {
          color: '#6f5237', tipo: 4, variar: 0.06,
          matriz: matriz([x + tabla / 2 - 0.018, (a + b) / 2, z + lado * 0.018]),
        });
      }
    }
  };

  const cartel = (texto, x, z, mirar) => {
    const y = T.altura(x, z);
    const c = new Constructor();
    const sitioCartel = { x, z, y };
    for (const lx of [-0.9, 0.9]) posteHastaTerreno(c, sitioCartel, mirar, lx, 0, 1.75, 0.07, MADERA_OSCURA, 0.18);
    const m = montar(c, [x, y, z], mirar);
    // Los carteles son microdetalle, no silueta estructural. A gran distancia
    // una placa de 2 m colapsa a pocos píxeles y puede leerse como un rectángulo
    // negro flotante. Se etiqueta para un LOD corto sin afectar el edificio.
    m.name = `cartel:${texto}`;
    m.userData.detalleLejano = true;
    m.userData.distanciaMax = 125;
    const matCartel = new THREE.MeshLambertMaterial({ map: cartelTextura(texto) });
    for (const lado of [0, 1]) {
      const placa = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.52), matCartel);
      placa.position.set(0, 1.45, lado ? -0.08 : 0.08);
      placa.rotation.y = lado * Math.PI;
      m.add(placa);
    }
    // La colisión corresponde a los dos postes reales. Antes había un
    // cilindro invisible en el centro del cartel y los postes se podían atravesar.
    for (const lx of [-0.9, 0.9]) {
      const q = aMundo({ x, z }, mirar, lx, 0);
      const sueloPost = T.altura(q.x, q.z);
      col.agregar({ x: q.x, z: q.z, r: 0.08, alturaMin: sueloPost - 0.18, alturaMax: y + 1.8 });
    }
    // 3.0.1: y la tabla, a su altura: se pasaba entre los postes con la cabeza adentro
    // del cartel (agachado todavía se pasa por abajo)
    {
      const A = aMundo({ x, z }, mirar, -1.05, 0), B = aMundo({ x, z }, mirar, 1.05, 0);
      col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.06, alturaMin: y + 1.17, alturaMax: y + 1.73 });
    }
    if (veg && veg.despejar) veg.despejar(x, z, 1.9);
    carteles.push({ x, z, texto });
    // 2.7.3: los carteles que se clavan después de armar el valle (los de las paradas
    // de la trochita) no pasaron por la fusión ni por el fijado de matrices del final:
    // las dos caras de la placa son una sola malla y el cartel no se mueve más.
    if (armado) {
      fusionarPorMaterial(m);
      m.traverse((o) => { o.updateMatrix(); o.matrixAutoUpdate = false; });
    }
  };

  // ---------------------------------------------------------------- refugio
  const ref = L.refugio;
  let pinturaRefugio = null;   // 2.8: la malla del refugio y qué vértices son pared, aberturas o techo
  {
    const rot = Math.atan2(L.muelle.x - ref.x, L.muelle.z - ref.z);   // la puerta (+z local) mira al lago
    ref.rot = rot;
    const c = new Constructor();
    // 2.8: se anota qué armó cada tramo (paredes, aberturas, techo) para pintarlo desde
    // Personalizar sin rehacer el edificio (personal-casa-mundo.js)
    const marcasRef = marcarConstructor(c);
    const W = 7, D = 5.5, H = 2.7;
    // Una sola fuente de verdad: el hueco de la puerta se define acá y lo usan
    // tanto los troncos dibujados como la colisión de la pared.
    const PUERTA = { x0: -0.6, x1: 0.6 };
    const PR = piezas(c, col, { x: ref.x, z: ref.z, y: ref.y, rot }, matriz);
    marcoEstructural(c, { W, D, H, techo: H + 1.8 });
    PR.pisoCaja({ largo: W + 0.4, ancho: D + 0.4, alto: 0.22, espesor: 0.3, color: TABLA });
    // Cimientos del refugio medidos contra el terreno real. Las cuatro piedras
    // fijas de la versión original podían quedar suspendidas si el lote tenía
    // unos centímetros de desnivel.
    pilotesAlTerreno(c, ref, rot,
      [[-W / 2 + 0.45, -D / 2 + 0.45], [W / 2 - 0.45, -D / 2 + 0.45],
       [-W / 2 + 0.45, D / 2 - 0.45], [W / 2 - 0.45, D / 2 - 0.45]],
      0.07, 0.12, MADERA_OSCURA, 0.37);
    const radio = 0.16;
    const hueco = (y) => y > 1.0 && y < 1.9;
    marcasRef.zona = 'pared';
    for (let i = 0; i < 9; i++) {
      const y = 0.5 + i * radio * 1.85;
      const color = i % 2 ? MADERA : '#76593e';
      cilindroEntre(c, [-W / 2 - 0.3, y, -D / 2], [W / 2 + 0.3, y, -D / 2], radio, color);
      if (!hueco(y)) cilindroEntre(c, [-W / 2, y, -D / 2 - 0.3], [-W / 2, y, D / 2 + 0.3], radio, color);
      else {
        cilindroEntre(c, [-W / 2, y, -D / 2 - 0.3], [-W / 2, y, -0.6], radio, color);
        cilindroEntre(c, [-W / 2, y, 0.6], [-W / 2, y, D / 2 + 0.3], radio, color);
      }
      cilindroEntre(c, [W / 2, y, -D / 2 - 0.3], [W / 2, y, D / 2 + 0.3], radio, color);
      if (y < 2.45) {
        cilindroEntre(c, [-W / 2 - 0.3, y, D / 2], [PUERTA.x0, y, D / 2], radio, color);
        // Ventana frontal verdadera: antes el vidrio estaba pegado encima de
        // troncos continuos, de modo que desde ciertos ángulos parecía una placa negra.
        if (hueco(y)) {
          cilindroEntre(c, [PUERTA.x1, y, D / 2], [1.65, y, D / 2], radio, color);
          cilindroEntre(c, [2.75, y, D / 2], [W / 2 + 0.3, y, D / 2], radio, color);
        } else {
          cilindroEntre(c, [PUERTA.x1, y, D / 2], [W / 2 + 0.3, y, D / 2], radio, color);
        }
      } else {
        cilindroEntre(c, [-W / 2 - 0.3, y, D / 2], [W / 2 + 0.3, y, D / 2], radio, color);
      }
    }
    for (const z of [-D / 2, D / 2]) {
      const tri = new THREE.BufferGeometry();
      tri.setAttribute('position', new THREE.Float32BufferAttribute([-W / 2, 0, 0, W / 2, 0, 0, 0, 1.7, 0, W / 2, 0, 0, -W / 2, 0, 0, 0, 1.7, 0], 3));
      c.agregar(tri, { color: '#6a4f36', tipo: 0, matriz: matriz([0, H + 0.1, z]) });
    }
    marcasRef.zona = null;
    // Chimenea del refugio: un único fuste continuo desde el hogar hasta el
    // remate. La versión anterior empezaba el tramo superior a la altura del
    // techo y además lo desplazaba más de un metro hacia el centro, dejando
    // visualmente la chimenea cortada en dos.
    const CHIM_REF = { x: -W / 2 + 1.1, z: -D / 2 + 0.45 };
    const chimRefDesde = 0.42;
    const chimRefHasta = H + 2.6;
    caja(c, [CHIM_REF.x, (chimRefDesde + chimRefHasta) / 2, CHIM_REF.z],
      [0.72, chimRefHasta - chimRefDesde, 0.76], '#6b6660', 0, 4);
    // la mesa: tabla y patas; la tabla frena, como una mesa de verdad
    // la mesa va medio metro más al centro: si no, el pasillo hasta la cama
    // queda más angosto que el jugador
    // 3.0.1: y 22 cm hacia la puerta: la tabla montaba 15 cm sobre la cama y una pata
    // quedaba clavada adentro del somier
    const MESA = { x: 1.1, z: -0.98 };
    PR.mueble({ lx: MESA.x, ly: 0.85, lz: MESA.z, largo: 1.8, alto: 0.08, ancho: 0.9, color: TABLA });
    for (const [dx, dz] of [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]]) caja(c, [MESA.x + dx, 0.55, MESA.z + dz], [0.08, 0.6, 0.08], MADERA_OSCURA);
    // cama junto a la pared del fondo: se puede rodear pero no atravesar
    PR.mueble({ lx: 2.2, ly: 0.5, lz: -D / 2 + 0.75, largo: 2.1, alto: 0.25, ancho: 1.0, color: MADERA_OSCURA, pisable: true });
    caja(c, [2.2, 0.68, -D / 2 + 0.75], [1.95, 0.14, 0.9], '#8c7a62');
    caja(c, [1.35, 0.8, -D / 2 + 0.75], [0.35, 0.12, 0.7], '#c9bca4');
    caja(c, [2.45, 0.77, -D / 2 + 0.75], [1.35, 0.06, 0.94], '#7b3a2c');
    const sueloBancoRef = sueloLocal(ref, rot, -1.8, D / 2 + 0.9);
    const yBancoRef = Math.max(0.52, sueloBancoRef + 0.48);
    // 3.0.1: 15 cm más corto del lado de la puerta: abierta, la punta de la hoja lo atravesaba
    caja(c, [-1.875, yBancoRef, D / 2 + 0.9], [2.05, 0.08, 0.45], TABLA);
    for (const x of [-2.7, -0.9]) posteHastaTerreno(c, ref, rot, x, D / 2 + 0.9, yBancoRef - 0.03, 0.055, MADERA_OSCURA);
    // hogar de piedra contra la pared del fondo: no se atraviesa
    PR.mueble({ lx: CHIM_REF.x, ly: 0.85, lz: CHIM_REF.z, largo: 1.5, alto: 1.25, ancho: 0.7, color: '#6b6660' });
    caja(c, [-W / 2 + 1.1, 0.62, -D / 2 + 0.78], [1.0, 0.78, 0.3], '#241d18');
    caja(c, [-W / 2 + 1.1, 1.55, -D / 2 + 0.5], [1.7, 0.16, 0.85], MADERA_OSCURA);
    // estantería con frascos
    for (const y of [1.35, 1.78]) {
      caja(c, [-1.2, y, -D / 2 + 0.2], [2.4, 0.06, 0.32], TABLA);
      for (let i = 0; i < 5; i++) c.agregar(new THREE.CylinderGeometry(0.07, 0.07, 0.19, 7), { color: i % 2 ? '#8e9c6a' : '#a88a52', tipo: 4, matriz: matriz([-2.1 + i * 0.45, y + 0.12, -D / 2 + 0.2]) });
    }
    // leña apilada adentro y afuera
    for (let i = 0; i < 9; i++) {
      const fila = Math.floor(i / 3), col = i % 3;
      cilindroEntre(c, [-W / 2 + 0.35, 0.5 + fila * 0.2, 1.0 + col * 0.21], [-W / 2 + 1.35, 0.5 + fila * 0.2, 1.0 + col * 0.21], 0.1, i % 2 ? MADERA : '#7a5f43');
    }
    for (let i = 0; i < 12; i++) {
      const fila = Math.floor(i / 4), col = i % 4;
      const pz = -1.4 + col * 0.23;
      const sueloLeñaA = sueloLocal(ref, rot, W / 2 + 0.45, pz);
      const sueloLeñaB = sueloLocal(ref, rot, W / 2 + 1.75, pz);
      const apilado = 0.12 + fila * 0.22;
      cilindroEntre(c, [W / 2 + 0.45, sueloLeñaA + apilado, pz], [W / 2 + 1.75, sueloLeñaB + apilado, pz], 0.11, i % 2 ? MADERA : '#6a5136');
    }
    // tronco para partir leña, con el hacha clavada, apoyado en su cota local
    const sueloTocon = sueloLocal(ref, rot, W / 2 + 2.6, -2.6);
    c.agregar(troncoCurvo(0.65, 0.32, 0.3, [0, 0], 9, 1), { color: '#7a5f43', tipo: 4, colorArriba: '#a5875f', matriz: matriz([W / 2 + 2.6, sueloTocon, -2.6]) });
    cilindroEntre(c, [W / 2 + 2.5, sueloTocon + 0.62, -2.45], [W / 2 + 2.85, sueloTocon + 1.18, -2.9], 0.035, '#6b5238');
    caja(c, [W / 2 + 2.87, sueloTocon + 1.22, -2.94], [0.06, 0.22, 0.16], '#8d9299', 0.7, 4);
    // 3.0.1: la leña de adentro, la de afuera y el tocón de partir frenan como se ven
    PR.mueble({ lx: -W / 2 + 0.85, ly: 0.7, lz: 1.21, largo: 1.0, alto: 0.62, ancho: 0.62, color: MADERA, dibujar: false });
    {
      const sueloPilaAfuera = Math.max(sueloLocal(ref, rot, W / 2 + 0.45, -1.05), sueloLocal(ref, rot, W / 2 + 1.75, -1.05));
      PR.mueble({ lx: W / 2 + 1.1, ly: sueloPilaAfuera + 0.36, lz: -1.05, largo: 1.42, alto: 0.72, ancho: 0.9, color: MADERA, dibujar: false });
      const tocon = aMundo(ref, rot, W / 2 + 2.6, -2.6);
      col.agregar({ x: tocon.x, z: tocon.z, r: 0.34, alturaMin: ref.y + sueloTocon - 0.1, alturaMax: ref.y + sueloTocon + 0.62 });
    }
    if (puertas) puertas.agregar({ sitio: { x: ref.x, z: ref.z, y: ref.y, piso: 0.37 }, rot, lx: 0, lz: D / 2 + 0.03, ancho: 1.2, alto: 1.95, lado: 1, nombre: 'la puerta del refugio' });

    // ---------- detalles finos ----------
    // canaleta de chapa bajo el alero, con su bajada y el goterón
    for (const lado of [-1, 1]) {
      c.agregar(new THREE.CylinderGeometry(0.09, 0.09, D + 0.5, 8, 1, false, 0, Math.PI), {
        color: '#7d8288', tipo: 4, variar: 0.08,
        matriz: matriz([lado * (W / 2 + 0.28), 2.52, 0], [Math.PI / 2, 0, lado > 0 ? Math.PI : 0]),
      });
      const sueloBajada = sueloLocal(ref, rot, lado * (W / 2 + 0.28), D / 2 - 0.2);
      cilindroEntre(c, [lado * (W / 2 + 0.28), sueloBajada + 0.05, D / 2 - 0.2], [lado * (W / 2 + 0.28), 2.5, D / 2 - 0.2], 0.05, '#6f757a');
      c.agregar(new THREE.BoxGeometry(0.22, 0.06, 0.22), { color: '#6f757a', tipo: 4, matriz: matriz([lado * (W / 2 + 0.28), sueloBajada + 0.03, D / 2 - 0.2]) });
    }
    // clavos de hierro en las esquinas de los troncos
    for (let i = 0; i < 7; i++) {
      for (const lado of [-1, 1]) {
        c.agregar(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 6), {
          color: '#4a443c', tipo: 4,
          matriz: matriz([lado * (W / 2 - 0.12), 0.55 + i * 0.32, D / 2 + 0.16], [Math.PI / 2, 0, 0]),
        });
      }
    }
    // estera de ramas en el umbral, para sacarse el barro
    const sueloUmbralRef = sueloLocal(ref, rot, 0, D / 2 + 0.95);
    const yEstera = Math.max(sueloUmbralRef + 0.03, 0.09);
    c.agregar(new THREE.BoxGeometry(1.25, 0.05, 0.62), { color: '#6b5f44', tipo: 4, variar: 0.12, matriz: matriz([0, yEstera, D / 2 + 0.95]) });
    for (let i = 0; i < 9; i++) {
      c.agregar(new THREE.CylinderGeometry(0.03, 0.03, 0.58, 5), { color: i % 2 ? '#7a6a4a' : '#5f5438', tipo: 0, matriz: matriz([-0.55 + i * 0.14, yEstera + 0.04, D / 2 + 0.95]) });
    }
    // leña apilada al reparo, contra la pared
    // 3.0.1: afuera, contra la pared del fondo y bajo el alero. Sus números la dejaban
    // ADENTRO: atravesaba la cama y la primera hilera quedaba bajo el piso.
    const LEÑA_FONDO = { x: 0.6, z: -D / 2 - 0.3 };
    const sueloLeñaFondo = Math.max(sueloLocal(ref, rot, LEÑA_FONDO.x - 0.75, LEÑA_FONDO.z - 0.6),
      sueloLocal(ref, rot, LEÑA_FONDO.x + 0.75, LEÑA_FONDO.z - 0.6), sueloLocal(ref, rot, LEÑA_FONDO.x, LEÑA_FONDO.z - 1.2));
    for (let f = 0; f < 3; f++) {
      for (let i = 0; i < 7; i++) {
        c.agregar(new THREE.CylinderGeometry(0.09, 0.1, 1.5, 6), {
          color: i % 3 ? '#6b5238' : '#5b4a36', tipo: 0, variar: 0.14,
          matriz: matriz([LEÑA_FONDO.x, sueloLeñaFondo + 0.09 + f * 0.19, LEÑA_FONDO.z - i * 0.2], [0, 0, Math.PI / 2]),
        });
      }
    }
    // 3.0.1: las pilas de leña y los tocones de partir se veían sólidos y se atravesaban
    PR.mueble({ lx: LEÑA_FONDO.x, ly: sueloLeñaFondo + 0.3, lz: LEÑA_FONDO.z - 0.6, largo: 1.55, alto: 0.62, ancho: 1.42, color: MADERA, dibujar: false });
    // el hacha clavada en el tocón de partir. También sigue la cota local:
    // este segundo tocón queda detrás del refugio y antes podía flotar si ese
    // extremo del lote era más bajo que el centro del edificio.
    const sueloToconAlero = sueloLocal(ref, rot, W / 2 - 0.95, -D / 2 - 0.5);
    c.agregar(new THREE.CylinderGeometry(0.28, 0.32, 0.55, 9), { color: '#6a5a44', tipo: 0, variar: 0.1, matriz: matriz([W / 2 - 0.95, sueloToconAlero + 0.27, -D / 2 - 0.5]) });
    c.agregar(new THREE.CylinderGeometry(0.03, 0.035, 0.75, 6), { color: '#7a5f43', tipo: 0, matriz: matriz([W / 2 - 1.0, sueloToconAlero + 0.85, -D / 2 - 0.5], [0.32, 0, 0.18]) });
    c.agregar(new THREE.BoxGeometry(0.1, 0.2, 0.05), { color: '#8e8d86', tipo: 4, matriz: matriz([W / 2 - 0.88, sueloToconAlero + 0.55, -D / 2 - 0.42], [0.32, 0, 0.18]) });
    {
      const toconAlero = aMundo(ref, rot, W / 2 - 0.95, -D / 2 - 0.5);
      col.agregar({ x: toconAlero.x, z: toconAlero.z, r: 0.33, alturaMin: ref.y + sueloToconAlero - 0.1, alturaMax: ref.y + sueloToconAlero + 0.58 });
    }
    // Marco de puerta terminado: dos jambas y un dintel por encima del paso.
    // Había un travesaño horizontal a y=1.05 m, literalmente cruzando el hueco
    // a la altura del pecho. Aunque no tuviera colisión, se atravesaba al entrar.
    const ALTO_MARCO_REF = 2.38;
    marcasRef.zona = 'aberturas';
    caja(c, [0, ALTO_MARCO_REF, D / 2 + 0.12], [1.5, 0.12, 0.16], TABLA);
    for (const x of [-0.72, 0.72]) {
      const baseMarco = 0.35, altoJamba = ALTO_MARCO_REF - baseMarco;
      caja(c, [x, baseMarco + altoJamba / 2, D / 2 + 0.12], [0.12, altoJamba, 0.16], TABLA);
    }
    marcasRef.zona = null;
    const sueloPasoRef = sueloLocal(ref, rot, 0, D / 2 + 0.55);
    const altoPasoRef = Math.max(0.10, sueloPasoRef + 0.07);
    PR.escalon({ lx: 0, lz: D / 2 + 0.55, largo: 1.7, ancho: 0.6,
      alto: altoPasoRef, espesor: Math.max(0.14, altoPasoRef - sueloPasoRef + 0.05), color: '#7a5f43' });

    // El techo deja de ser dos prismas lisos: ahora tiene módulos, cabios,
    // fascia y remates. Conservamos las canaletas históricas ya modeladas.
    // Las dos ventanas tienen ahora hueco y carpintería legible, no un plano
    // oscuro pegado sobre los troncos.
    marcasRef.zona = 'aberturas';
    marcoVentana(c, [2.2, 1.45, D / 2 + 0.03], 1.1, 0.8, 0, false);
    marcoVentana(c, [-W / 2 - 0.03, 1.45, 0], 1.1, 0.8, Math.PI / 2, false);
    marcasRef.zona = 'techo';
    techoDosAguasDetallado(c, {
      W, D, H, alzada: 1.7, vueloX: 0.58, vueloZ: 0.72,
      estilo: 'madera', colores: ['#43372f', '#493b31', '#3f342d', '#4d3f34'],
      canaleta: false, colorEstructura: '#44352a',
    });
    marcasRef.zona = null;

    const grupoCasa = new THREE.Group();
    grupoCasa.position.set(ref.x, ref.y, ref.z); grupoCasa.rotation.y = rot;
    const mCasa = new THREE.Mesh(c.geometria(), mat);
    mCasa.castShadow = true; mCasa.receiveShadow = true;
    grupoCasa.add(mCasa);
    pinturaRefugio = { malla: mCasa, marcas: marcasRef };
    const vidrio = materialVidrio(0x1a1612);
    const ventana = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), vidrio);
    ventana.position.set(2.2, 1.45, D / 2 + 0.02);
    grupoCasa.add(ventana);
    const ventana2 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), vidrio);
    ventana2.position.set(-W / 2 - 0.02, 1.45, 0); ventana2.rotation.y = -Math.PI / 2;
    grupoCasa.add(ventana2);
    ref.vidrio = vidrio;
    const luz = new THREE.PointLight(0xffa860, 0, 14, 1.6);
    luz.position.set(0.5, 2.0, 0);
    grupoCasa.add(luz);
    ref.luz = luz;
    // farol junto a la puerta
    const farol = new THREE.Group();
    farol.position.set(-1.15, 2.05, D / 2 + 0.18);
    const vidrioFarol = materialVidrio(0x2a2018);
    const cajaFarol = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.22), vidrioFarol);
    const techoFarol = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.12, 4), mat);
    techoFarol.position.y = 0.2;
    const gancho = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 5), mat);
    gancho.position.y = 0.34;
    farol.add(cajaFarol, techoFarol, gancho);
    grupoCasa.add(farol);
    const interior = new THREE.PointLight(0xd8e0e8, 0, 9, 1.4);
    interior.position.set(0.4, 1.6, 0.2);
    grupoCasa.add(interior);
    ref.interior = interior;
    const luzFarol = new THREE.PointLight(0xffb070, 0, 9, 1.8);
    luzFarol.position.set(-1.15, 2.05, D / 2 + 0.3);
    grupoCasa.add(luzFarol);
    ref.farol = { vidrio: vidrioFarol, luz: luzFarol };
    grupo.add(grupoCasa);

    const esquina = (lx, lz) => aMundo(ref, rot, lx, lz);
    // las cuatro paredes: los troncos ya están dibujados, acá va la colisión
    // con el mismo hueco de puerta que usaron los troncos
    const PARED = { desde: 0.3, hasta: H + 0.2, espesor: radio * 2, dibujar: false };
    PR.paredRecta({ ...PARED, a: [-W / 2, -D / 2], b: [W / 2, -D / 2] });
    PR.paredRecta({ ...PARED, a: [-W / 2, -D / 2], b: [-W / 2, D / 2] });
    PR.paredRecta({ ...PARED, a: [W / 2, -D / 2], b: [W / 2, D / 2] });
    PR.paredRecta({ ...PARED, a: [-W / 2, D / 2], b: [W / 2, D / 2], huecos: [{ desde: PUERTA.x0 + W / 2, hasta: PUERTA.x1 + W / 2 }] });
    const chim = esquina(CHIM_REF.x, CHIM_REF.z);
    ref.chimenea = { x: chim.x, y: ref.y + chimRefHasta + 0.08, z: chim.z };
    // Metadatos arquitectónicos para que objetos dinámicos (p. ej. fotos) se
    // anclen a paredes reales y no a offsets hardcodeados que pueden flotar.
    ref.dimensiones = { W, D, H };
    ref.paredFondoInteriorZ = -D / 2 + radio + 0.035;
    ref.fogon = aMundo(ref, rot, 3.2, D / 2 + 5);
    ref.fogon.y = T.altura(ref.fogon.x, ref.fogon.z);
    ref.techo = { W: W + 1, D: D + 1.5, rot };
    const banco = aMundo(ref, rot, -1.8, D / 2 + 0.9);
    sentaderos.push({ x: banco.x, z: banco.z, y: ref.y + yBancoRef + 0.04, nombre: 'el banco del refugio', mira: rot + Math.PI });
    const cama = aMundo(ref, rot, 2.2, -D / 2 + 0.75);
    sentaderos.push({ x: cama.x, z: cama.z, y: ref.y + 0.82, nombre: 'la cama del refugio', cama: true, mira: rot });
    ref.puerta = aMundo(ref, rot, 0, D / 2 + 3);
    ref.mira = rot + Math.PI;
    // 3.0.1: 2,4 m más al costado: el zaino, atado al palenque (caballo.js), quedaba con la
    // cabeza a medio metro de la tabla y al salir se la llevaba puesta
    const pc = aMundo(ref, rot, -6.2, D / 2 + 5.2);
    cartel('Refugio del Arroyo', pc.x, pc.z, rot);

    const f = new Constructor();
    const sueloFogonLocal = (lx, lz) => T.altura(ref.fogon.x + lx, ref.fogon.z + lz) - ref.fogon.y;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const lx = Math.cos(a) * 0.75, lz = Math.sin(a) * 0.75;
      const sy = sueloFogonLocal(lx, lz);
      f.agregar(new THREE.IcosahedronGeometry(0.22, 0), { color: '#6f6b66', tipo: 4, matriz: matriz([lx, sy + 0.11, lz], [r() * 0.3, r() * 6, 0], [1.2, 0.7, 1]) });
    }
    const bancosFogon = [[-1.7, 0, 0], [1.7, 0, 0], [0, -1.7, Math.PI / 2]];
    for (const [dx, dz, a] of bancosFogon) {
      const ax = dx - Math.sin(a) * 0.9, az = dz - Math.cos(a) * 0.9;
      const bx = dx + Math.sin(a) * 0.9, bz = dz + Math.cos(a) * 0.9;
      const ya = sueloFogonLocal(ax, az) + 0.16, yb = sueloFogonLocal(bx, bz) + 0.16;
      cilindroEntre(f, [ax, ya, az], [bx, yb, bz], 0.12, MADERA);
    }
    montar(f, [ref.fogon.x, ref.fogon.y, ref.fogon.z], 0);
    for (const [dx, dz] of bancosFogon) {
      const sy = sueloFogonLocal(dx, dz);
      sentaderos.push({ x: ref.fogon.x + dx, z: ref.fogon.z + dz, y: ref.fogon.y + sy + 0.34, nombre: 'un tronco junto al fogón', mira: Math.atan2(dx, dz) });
    }
  }

  // ---------------------------------------------------------------- muelle
  {
    const m = L.muelle;
    const c = new Constructor();
    const largo = m.largo, ancho = 2.2;
    for (let i = 0; i < Math.floor(largo / 0.35); i++) {
      c.agregar(new THREE.BoxGeometry(ancho, 0.07, 0.3), { color: i % 3 ? TABLA : '#7a5e42', tipo: 4, variar: 0.12, matriz: matriz([0, m.alto, i * 0.35 + 0.2], [0, (r() - 0.5) * 0.02, 0]) });
    }
    const rotMuelle = Math.atan2(Math.cos(m.ang), Math.sin(m.ang));
    const sitioMuelle = { x: m.x, z: m.z, y: 0 };
    for (let i = 0; i <= largo; i += 3.5) {
      for (const lado of [-1, 1]) posteHastaTerreno(c, sitioMuelle, rotMuelle,
        lado * (ancho / 2 - 0.1), i + 0.2, m.alto + 0.35, 0.1, MADERA_OSCURA, 0.28, true);
    }
    // bitas para amarrar, con su soga, y un cajón de pesca al final
    for (const i of [2.2, largo - 3.5]) {
      for (const lado of [-1, 1]) {
        c.agregar(new THREE.CylinderGeometry(0.11, 0.13, 0.55, 8), { color: MADERA_OSCURA, tipo: 4, matriz: matriz([lado * (ancho / 2 - 0.12), m.alto + 0.3, i]) });
        c.agregar(new THREE.TorusGeometry(0.13, 0.03, 5, 10), { color: '#8a7f68', tipo: 4, matriz: matriz([lado * (ancho / 2 - 0.12), m.alto + 0.44, i], [Math.PI / 2, 0, 0]) });
      }
    }
    c.agregar(new THREE.TorusGeometry(0.28, 0.035, 5, 12), { color: '#9a8f76', tipo: 4, matriz: matriz([-ancho / 2 + 0.25, m.alto + 0.08, 4.6], [Math.PI / 2, 0.3, 0]) });
    // 3.0.1: las bitas y el cajón de pesca se veían sólidos y se atravesaban
    {
      const rotM = Math.atan2(Math.cos(m.ang), Math.sin(m.ang));
      for (const i of [2.2, largo - 3.5]) for (const lado of [-1, 1]) {
        const q = aMundo({ x: m.x, z: m.z }, rotM, lado * (ancho / 2 - 0.12), i);
        col.agregar({ x: q.x, z: q.z, r: 0.13, alturaMin: m.alto - 0.1, alturaMax: m.alto + 0.56 });
      }
      const qc = aMundo({ x: m.x, z: m.z }, rotM, ancho / 2 - 0.45, largo - 5);
      col.agregar({ x: qc.x, z: qc.z, r: 0.4, alturaMin: m.alto - 0.1, alturaMax: m.alto + 0.43 });
    }
    caja(c, [ancho / 2 - 0.45, m.alto + 0.22, largo - 5], [0.6, 0.35, 0.9], '#7a5f43', 0.2);
    caja(c, [ancho / 2 - 0.45, m.alto + 0.42, largo - 5], [0.62, 0.06, 0.92], '#6b5238', 0.2);
    // dos largueros y travesaños bajo el tablero: desde el agua se entiende
    // cómo se sostiene el muelle, no solo una alfombra de tablas.
    for (const lado of [-1, 1]) cilindroEntre(c,
      [lado * (ancho / 2 - 0.38), m.alto - 0.2, 0.15],
      [lado * (ancho / 2 - 0.38), m.alto - 0.2, largo - 0.15], 0.095, MADERA_OSCURA);
    for (let zt = 1.2; zt < largo; zt += 2.4) {
      cilindroEntre(c, [-ancho / 2 + 0.12, m.alto - 0.18, zt], [ancho / 2 - 0.12, m.alto - 0.18, zt], 0.07, MADERA);
    }
    // escalera marinera al final del muelle
    for (const lado of [-1, 1]) cilindroEntre(c,
      [lado * 0.32, m.alto - 1.45, largo - 0.55], [lado * 0.32, m.alto + 0.15, largo - 0.55], 0.045, '#5e5142');
    for (let yy = m.alto - 1.2; yy < m.alto + 0.05; yy += 0.28)
      cilindroEntre(c, [-0.32, yy, largo - 0.55], [0.32, yy, largo - 0.55], 0.035, '#6b5a48');
    montar(c, [m.x, 0, m.z], Math.atan2(Math.cos(m.ang), Math.sin(m.ang)));   // +z local hacia el lago
    const dx = Math.cos(m.ang), dz = Math.sin(m.ang);
    const centro = { x: m.x + dx * largo / 2, z: m.z + dz * largo / 2 };
    col.agregarPlataforma({ x: centro.x, z: centro.z, ang: m.ang, largo: largo + 0.4, ancho: ancho, alto: m.alto + 0.035, espesor: 0.07 });
    const punta = { x: m.x + dx * (largo - 1), z: m.z + dz * (largo - 1) };
    sentaderos.push({ x: punta.x, z: punta.z, y: m.alto + 0.04, nombre: 'la punta del muelle', mira: Math.atan2(-dx, -dz) });
    m.punta = punta;
    const lat = { x: m.x - dz * 2.2 - dx * 3, z: m.z + dx * 2.2 - dz * 3 };
    cartel('Muelle del Lago', lat.x, lat.z, Math.atan2(-dx, -dz));
  }

  // ---------------------------------------------------------------- puentes
  for (const p of T.puentes) {
    const c = new Constructor();
    const ancho = 2.4;
    for (let i = 0; i < Math.floor(p.largo / 0.32); i++) {
      c.agregar(new THREE.BoxGeometry(0.28, 0.12, ancho), { color: i % 4 ? TABLA : '#7a5e42', tipo: 4, variar: 0.12, matriz: matriz([-p.largo / 2 + i * 0.32 + 0.16, 0, 0], [0, (r() - 0.5) * 0.04, 0]) });
    }
    for (const lado of [-1, 1]) {
      cilindroEntre(c, [-p.largo / 2, -0.15, lado * (ancho / 2 - 0.2)], [p.largo / 2, -0.15, lado * (ancho / 2 - 0.2)], 0.2, MADERA_OSCURA);
      cilindroEntre(c, [-p.largo / 2, 0.95, lado * ancho / 2], [p.largo / 2, 0.95, lado * ancho / 2], 0.07, MADERA);
      const xs = [-p.largo / 2, -p.largo / 4, 0, p.largo / 4, p.largo / 2];
      const basePuente = { x: p.x, z: p.z, y: p.alto - 0.06 };
      for (const x of xs) posteHastaTerreno(c, basePuente, -p.ang, x, lado * ancho / 2, 1.0, 0.09, MADERA_OSCURA, 0.22, true);
      // Cruces de San Andrés ancladas cerca del terreno de cada pilote.
      // La profundidad fija anterior podía dejar diagonales suspendidas sobre
      // un cauce profundo o completamente enterradas en un estribo alto.
      for (let i = 0; i < xs.length - 1; i++) {
        const sA = sueloLocal(basePuente, -p.ang, xs[i], lado * ancho / 2);
        const sB = sueloLocal(basePuente, -p.ang, xs[i + 1], lado * ancho / 2);
        const yA = Math.min(-0.28, sA + 0.18), yB = Math.min(-0.28, sB + 0.18);
        cilindroEntre(c, [xs[i], yA, lado * ancho / 2], [xs[i + 1], -0.05, lado * ancho / 2], 0.045, '#5e4632');
        cilindroEntre(c, [xs[i], -0.05, lado * ancho / 2], [xs[i + 1], yB, lado * ancho / 2], 0.045, '#5e4632');
      }
    }
    // vigas transversales bajo el tablero y topes de piedra en los estribos
    for (let x = -p.largo / 2 + 0.6; x < p.largo / 2; x += 1.6)
      cilindroEntre(c, [x, -0.25, -ancho / 2], [x, -0.25, ancho / 2], 0.065, MADERA);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const lx = sx * (p.largo / 2 + 0.18), lz = sz * (ancho / 2 - 0.1);
      const basePuente = { x: p.x, z: p.z, y: p.alto - 0.06 };
      const sueloP = sueloLocal(basePuente, -p.ang, lx, lz);
      c.agregar(new THREE.IcosahedronGeometry(0.34, 0), { color: '#716e68', tipo: 4, variar: 0.15,
        matriz: matriz([lx, sueloP + 0.18, lz], [0.2, sx * sz, 0.1], [1.25, 0.7, 1]) });
    }
    montar(c, [p.x, p.alto - 0.06, p.z], -p.ang);
    col.agregarPlataforma({ x: p.x, z: p.z, ang: p.ang, largo: p.largo, ancho: ancho, alto: p.alto, espesor: 0.12 });
    const ux = Math.cos(p.ang), uz = Math.sin(p.ang), nx = -uz, nz = ux;
    for (const lado of [-1, 1]) {
      col.agregar({
        seg: true,
        ax: p.x - ux * p.largo / 2 + nx * lado * ancho / 2,
        az: p.z - uz * p.largo / 2 + nz * lado * ancho / 2,
        bx: p.x + ux * p.largo / 2 + nx * lado * ancho / 2,
        bz: p.z + uz * p.largo / 2 + nz * lado * ancho / 2,
        r: 0.12,
        // El resolver compara la altura de LOS PIES. Para que la baranda frene
        // a quien está sobre el tablero, su rango debe incluir el nivel del piso;
        // aun así queda acotada y no bloquea a quien pasa claramente por debajo.
        alturaMin: p.alto - 0.08,
        alturaMax: p.alto + 1.35,
      });
    }
    const ext = { x: p.x - ux * (p.largo / 2 + 3) + nx * 2.2, z: p.z - uz * (p.largo / 2 + 3) + nz * 2.2 };
    cartel('Puente de Troncos', ext.x, ext.z, Math.atan2(-ux, -uz));
  }

  // ---------------------------------------------------------------- mirador
  {
    const m = L.mirador;
    const haciaLago = Math.atan2(150 - m.x, 110 - m.z);
    const c = new Constructor();
    for (let i = -4; i <= 4; i++) {
      const a = i * 0.22;
      const x = Math.sin(a) * 7, z = Math.cos(a) * 7;
      const y = T.altura(m.x + x * Math.cos(haciaLago) + z * Math.sin(haciaLago), m.z - x * Math.sin(haciaLago) + z * Math.cos(haciaLago)) - m.y;
      cilindroEntre(c, [x, y - 0.5, z], [x, y + 1.05, z], 0.08, MADERA_OSCURA);
      if (i < 4) {
        const a2 = (i + 1) * 0.22;
        const x2 = Math.sin(a2) * 7, z2 = Math.cos(a2) * 7;
        const y2 = T.altura(m.x + x2 * Math.cos(haciaLago) + z2 * Math.sin(haciaLago), m.z - x2 * Math.sin(haciaLago) + z2 * Math.cos(haciaLago)) - m.y;
        cilindroEntre(c, [x, y + 1.0, z], [x2, y2 + 1.0, z2], 0.06, MADERA);
      }
    }
    const sueloBancoMirador = sueloLocal(m, haciaLago, 0, 4.2);
    const yBancoMirador = sueloBancoMirador + 0.47;
    caja(c, [0, yBancoMirador, 4.2], [2.4, 0.09, 0.5], TABLA);
    for (const x of [-1, 1]) posteHastaTerreno(c, m, haciaLago, x, 4.2, yBancoMirador - 0.03, 0.055, MADERA_OSCURA);
    montar(c, [m.x, m.y, m.z], haciaLago);
    for (let i = -4; i <= 4; i++) {
      const a = i * 0.22;
      const w = aMundo(m, haciaLago, Math.sin(a) * 7, Math.cos(a) * 7);
      const sueloPost = T.altura(w.x, w.z);
      col.agregar({ x: w.x, z: w.z, r: 0.09, alturaMin: sueloPost - 0.55, alturaMax: sueloPost + 1.12 });
      if (i < 4) {
        const a2 = (i + 1) * 0.22;
        const w2 = aMundo(m, haciaLago, Math.sin(a2) * 7, Math.cos(a2) * 7);
        const suelo2 = T.altura(w2.x, w2.z);
        // El pasamanos visible también frena entre poste y poste. Antes solo
        // colisionaban los nueve postes y se podía atravesar la baranda por el medio.
        col.agregar({ seg: true, ax: w.x, az: w.z, bx: w2.x, bz: w2.z, r: 0.075,
          alturaMin: Math.min(sueloPost, suelo2) - 0.06,
          alturaMax: Math.max(sueloPost, suelo2) + 1.14 });
      }
    }
    const banco = aMundo(m, haciaLago, 0, 4.2);
    sentaderos.push({ x: banco.x, z: banco.z, y: m.y + yBancoMirador + 0.05, nombre: 'el banco del mirador', mira: haciaLago + Math.PI });
    const cp = aMundo(m, haciaLago, -4, 0);
    cartel('Mirador del Pehuén', cp.x, cp.z, haciaLago + Math.PI);
  }

  // ---------------------------------------------------------------- carteles sueltos
  {
    const ma = L.mallin, ar = L.arrayanes;
    const cercaSendero = (l) => {
      let mejor = null, dm = Infinity;
      for (const p of T.sendero) { const d = Math.hypot(p.x - l.x, p.z - l.z); if (d < dm) { dm = d; mejor = p; } }
      return mejor;
    };
    for (const [l, texto] of [[ma, 'Mallín'], [ar, 'Bosque de Arrayanes']]) {
      const p = cercaSendero(l);
      const ang = Math.atan2(l.x - p.x, l.z - p.z);
      cartel(texto, p.x + Math.sin(ang) * 3, p.z + Math.cos(ang) * 3, ang + Math.PI);
    }
  }

  // ---------------------------------------------------------------- cabañas aisladas
  const cabañas = [];
  // no sirve un lugar con árboles encima: se corre hasta encontrar un claro
  const arboles = (veg && veg.arboles) || [];
  const estorbos = ((veg && veg.colisiones) || []).filter((o) => o.seg || o.r > 0.5);
  // 2.2: despejado() se pregunta cientos de veces al buscar sitio, y antes recorría
  // todos los árboles y todos los estorbos del valle cada vez (casi un segundo de la
  // carga). Ahora mira sólo los que están cerca, con la misma cuenta exacta: la
  // respuesta es la misma, así que las cabañas quedan donde quedaban.
  const CELDA_ESTORBO = 16;
  const celdasEstorbo = new Map();
  const claveEstorbo = (cx, cz) => (cx + 4096) * 8192 + (cz + 4096);
  for (const o of estorbos) {
    const x0 = (o.seg ? Math.min(o.ax, o.bx) : o.x) - o.r, x1 = (o.seg ? Math.max(o.ax, o.bx) : o.x) + o.r;
    const z0 = (o.seg ? Math.min(o.az, o.bz) : o.z) - o.r, z1 = (o.seg ? Math.max(o.az, o.bz) : o.z) + o.r;
    for (let cx = Math.floor(x0 / CELDA_ESTORBO); cx <= Math.floor(x1 / CELDA_ESTORBO); cx++) {
      for (let cz = Math.floor(z0 / CELDA_ESTORBO); cz <= Math.floor(z1 / CELDA_ESTORBO); cz++) {
        const k = claveEstorbo(cx, cz);
        let l = celdasEstorbo.get(k);
        if (!l) celdasEstorbo.set(k, (l = []));
        l.push(o);
      }
    }
  }
  const estorba = (o, x, z, radio) => {
    if (o.seg) {
      const abx = o.bx - o.ax, abz = o.bz - o.az;
      const t = Math.max(0, Math.min(1, ((x - o.ax) * abx + (z - o.az) * abz) / (abx * abx + abz * abz || 1)));
      return Math.hypot(x - (o.ax + abx * t), z - (o.az + abz * t)) < radio * 0.65 + o.r;
    }
    return Math.hypot(o.x - x, o.z - z) < radio * 0.65 + o.r;
  };
  const arbolEnMedio = veg?.arbolesCerca
    ? (x, z, radio) => veg.arbolesCerca(x, z, radio).some((a) => Math.hypot(a.x - x, a.z - z) < radio)
    : (x, z, radio) => arboles.some((a) => Math.hypot(a.x - x, a.z - z) < radio);
  const despejado = (x, z, radio) => {
    if (arbolEnMedio(x, z, radio)) return false;
    // rocas grandes y troncos caídos también estorban, sobre todo en la escalera de la torre
    const alcance = radio * 0.65;
    for (let cx = Math.floor((x - alcance) / CELDA_ESTORBO); cx <= Math.floor((x + alcance) / CELDA_ESTORBO); cx++) {
      for (let cz = Math.floor((z - alcance) / CELDA_ESTORBO); cz <= Math.floor((z + alcance) / CELDA_ESTORBO); cz++) {
        const l = celdasEstorbo.get(claveEstorbo(cx, cz));
        if (l && l.some((o) => estorba(o, x, z, radio))) return false;
      }
    }
    return true;
  };

  // Registro global de huellas arquitectónicas. Todas las estructuras dinámicas
  // consultan esta lista antes de elegir sitio: ya no alcanza con que los centros
  // estén lejos, deben caber sus complejos completos (galerías, escaleras, corrales,
  // cobertizos y accesos) con un margen de circulación alrededor.
  const huellas = [];
  const registrarHuella = (nombre, objeto, radio, margen = 3.0) => {
    if (!objeto || !Number.isFinite(objeto.x) || !Number.isFinite(objeto.z)) return null;
    const r0 = Math.max(1, Number(radio ?? objeto.radio ?? 6));
    const previa = huellas.find((h) => h.objeto === objeto || (h.nombre === nombre && Math.hypot(h.x - objeto.x, h.z - objeto.z) < 0.01));
    if (previa) {
      previa.x = objeto.x; previa.z = objeto.z; previa.radio = r0; previa.margen = margen;
      return previa;
    }
    const h = { nombre, x: objeto.x, z: objeto.z, radio: r0, margen, objeto };
    huellas.push(h);
    return h;
  };
  const invadeHuella = (x, z, radio = 6, margen = 3.0, ignorar = null) => {
    const r0 = Math.max(0.5, Number(radio) || 6);
    for (const h of huellas) {
      if (ignorar && (h === ignorar || h.objeto === ignorar || h.nombre === ignorar)) continue;
      const limite = r0 + h.radio + Math.max(margen, h.margen || 0);
      if (Math.hypot(x - h.x, z - h.z) < limite) return h;
    }
    return null;
  };
  // Lugares fijos ya presentes cuando empieza esta etapa del generador.
  registrarHuella('refugio', L.refugio, 14, 5);
  registrarHuella('muelle', L.muelle, 11, 4);
  registrarHuella('mirador', L.mirador, 10, 4);
  function cabaña(clave, nombre, x, z, mirarA, opciones = {}) {
    const rot = Math.atan2(mirarA.x - x, mirarA.z - z);
    const W = opciones.ancho ?? 4.6, D = opciones.fondo ?? 4.0, H = 2.3;
    // 3.0.1: en una ladera la cabaña se apoyaba a la altura de su centro y el terreno
    // del lado alto atravesaba el piso (pasto y piedras adentro, hasta 56 cm en el Puesto
    // Alto). Se levanta lo justo para que el piso (a 0,35 m) quede sobre el terreno.
    let y = T.altura(x, z);
    for (let lx = -W / 2 - 0.25; lx <= W / 2 + 0.25 + 1e-6; lx += (W + 0.5) / 8)
      for (let lz = -D / 2 - 0.25; lz <= D / 2 + 0.25 + 1e-6; lz += (D + 0.5) / 8) {
        const q = aMundo({ x, z }, rot, lx, lz);
        y = Math.max(y, T.altura(q.x, q.z) - 0.30);
      }
    const ALTO_HASTIAL = 2.45;
    const c = new Constructor();
    // pilotes medidos contra el terreno real: cada apoyo llega al suelo que
    // tiene debajo en vez de bajar una profundidad fija.
    pilotesAlTerreno(c, { x, z, y }, rot,
      [-W / 2 + 0.3, 0, W / 2 - 0.3].flatMap(px => [-D / 2 + 0.3, D / 2 - 0.3].map(pz => [px, pz])),
      0.2, 0.13, MADERA_OSCURA, 0.35);
    // El bajo piso se cierra sólo donde realmente queda separado del terreno.
    // Así no hay un bloque rectangular enterrado/asomando en una ladera.
    faldaCimientoTerreno(c, { sitio: { x, z, y }, rotY: rot, W: W - 0.12, D: D - 0.12, yTope: 0.08 });
    zocaloPiedra(c, W + 0.04, D + 0.04, 0.07, 0.78, { x, z, y }, rot, 0.35);
    // Una sola fuente de verdad: el hueco de la puerta lo usan los troncos y la colisión
    const PUERTA = { x0: -0.55, x1: 0.55 };
    const PC = piezas(c, col, { x, z, y, rot }, matriz);
    marcoEstructural(c, { W, D, H, techo: H + ALTO_HASTIAL });
    PC.pisoCaja({ largo: W + 0.5, ancho: D + 0.5, alto: 0.2, espesor: 0.3, color: TABLA });
    const radio = 0.15;
    const hueco = (yy) => yy > 0.95 && yy < 1.75;
    for (let i = 0; i < 8; i++) {
      const yy = 0.45 + i * radio * 1.8;
      const color = i % 2 ? MADERA : '#6d5237';
      cilindroEntre(c, [-W / 2 - 0.25, yy, -D / 2], [W / 2 + 0.25, yy, -D / 2], radio, color);
      cilindroEntre(c, [W / 2, yy, -D / 2 - 0.25], [W / 2, yy, D / 2 + 0.25], radio, color);
      if (!hueco(yy)) cilindroEntre(c, [-W / 2, yy, -D / 2 - 0.25], [-W / 2, yy, D / 2 + 0.25], radio, color);
      else {
        cilindroEntre(c, [-W / 2, yy, -D / 2 - 0.25], [-W / 2, yy, -0.5], radio, color);
        cilindroEntre(c, [-W / 2, yy, 0.5], [-W / 2, yy, D / 2 + 0.25], radio, color);
      }
      if (yy < 2.28) {
        cilindroEntre(c, [-W / 2 - 0.25, yy, D / 2], [PUERTA.x0, yy, D / 2], radio, color);
        cilindroEntre(c, [PUERTA.x1, yy, D / 2], [W / 2 + 0.25, yy, D / 2], radio, color);
      } else {
        cilindroEntre(c, [-W / 2 - 0.25, yy, D / 2], [W / 2 + 0.25, yy, D / 2], radio, color);
      }
    }
    // Hastiales altos y empinados, con el ventanal triangular del frente.
    for (const zz of [-D / 2, D / 2]) {
      const frente = zz > 0;
      const tri = new THREE.BufferGeometry();
      tri.setAttribute('position', new THREE.Float32BufferAttribute(
        [-W / 2, 0, 0, W / 2, 0, 0, 0, ALTO_HASTIAL, 0, W / 2, 0, 0, -W / 2, 0, 0, 0, ALTO_HASTIAL, 0], 3));
      c.agregar(tri, { color: frente ? '#8a6a45' : '#6a4f36', tipo: 0, matriz: matriz([0, H, zz]) });
      if (frente) {
        // el ventanal del hastial: dos hojas que siguen la pendiente del techo
        for (const lado of [-1, 1]) {
          const ancho = 0.86, altoV = 1.35;
          c.agregar(new THREE.BoxGeometry(ancho, altoV, 0.12), { color: '#2a2b2c', tipo: 4, matriz: matriz([lado * 0.58, H + 0.82, zz + 0.09], [0, 0, -lado * 0.34]) });
          c.agregar(new THREE.BoxGeometry(ancho + 0.14, 0.1, 0.16), { color: '#a87c4c', tipo: 0, matriz: matriz([lado * 0.58, H + 0.14, zz + 0.1]) });
          c.agregar(new THREE.BoxGeometry(0.1, altoV + 0.1, 0.16), { color: '#a87c4c', tipo: 0, matriz: matriz([lado * (0.58 + ancho / 2), H + 0.82, zz + 0.1], [0, 0, -lado * 0.34]) });
        }
        // el tirante horizontal y el remate de la cumbrera
        c.agregar(new THREE.CylinderGeometry(0.11, 0.11, W - 0.5, 8), { color: MADERA, tipo: 0, matriz: matriz([0, H + 0.1, zz + 0.16], [0, 0, Math.PI / 2]) });
        c.agregar(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8), { color: '#8a6a45', tipo: 0, matriz: matriz([0, H + ALTO_HASTIAL - 0.28, zz + 0.16], [Math.PI / 2, 0, 0]) });
      }
    }
    // Carpintería alrededor de la ventana lateral. El hueco y los postigos
    // ya existían, pero faltaba un marco que cerrara visualmente el encuentro
    // entre troncos, vidrio y hoja móvil.
    marcoVentana(c, [-W / 2 - 0.03, 1.35, 0], 0.95, 0.70, Math.PI / 2, false);
    // Marco de acceso de las cabañas: jambas limpias y dintel alto. No se
    // dibuja ninguna pieza horizontal dentro del volumen de paso.
    const ALTO_MARCO_CAB = 2.25;
    caja(c, [0, ALTO_MARCO_CAB, D / 2 + 0.12], [1.34, 0.12, 0.16], TABLA);
    for (const px of [-0.61, 0.61]) {
      const baseMarco = 0.35, altoJamba = ALTO_MARCO_CAB - baseMarco;
      caja(c, [px, baseMarco + altoJamba / 2, D / 2 + 0.12], [0.12, altoJamba, 0.16], TABLA);
    }
    // Cubierta unificada: antes convivían dos techos superpuestos con
    // pendientes distintas (2.45 m y 1.3 m de alzada), provocando solapes y
    // z-fighting. Ahora existe una sola cubierta y coincide con el hastial.
    techoDosAguasDetallado(c, {
      W, D, H, alzada: ALTO_HASTIAL, vueloX: 0.55, vueloZ: 0.6,
      estilo: 'madera', colores: ['#45382f', '#4a3b30', '#413428', '#503f33'],
      canaleta: false, colorEstructura: '#4a382b',
    });
    // chimenea de piedra por fuera: baja hasta bien abajo para que en la
    // ladera no quede colgada, y el remate coincide con el cuerpo
    // Chimenea de piedra bola: el fuste y encima las piedras redondeadas,
    // como las que se juntan en el río.
    const chX = -W / 2 - 0.2, chZ = -0.6, chTope = H + 2.45 + 0.75;
    const chSuelo = sueloLocal({ x, z, y }, rot, chX, chZ);
    const chBase = chSuelo - 0.18;
    // 3.0.1: 6 cm menos de ancho: su cara de adentro asomaba entre troncos (líneas grises)
    caja(c, [chX - 0.03, (chTope + chBase) / 2, chZ], [0.5, chTope - chBase, 0.7], '#7d766c', 0, 4);
    for (let i = 0; i < 26; i++) {
      const fila = Math.floor(i / 3), col = i % 3;
      const yy = 0.35 + fila * 0.52 + (col % 2) * 0.16;
      if (yy > chTope - 0.2) continue;
      for (const lado of [-1, 1]) {
        // 3.0.1: las del lado de la pared (lado +1) atravesaban los troncos y se veían
        // adentro, una columna de piedras flotando junto a la ventana
        if (lado > 0) continue;
        c.agregar(new THREE.IcosahedronGeometry(0.13 + (i % 3) * 0.035, 0), {
          color: ['#8e877c', '#7a7268', '#9a9288', '#6f6a62'][i % 4], tipo: 4, variar: 0.14,
          matriz: matriz([chX + lado * 0.3, yy, chZ + (col - 1) * 0.2], [i, i * 1.7, i * 0.6], [1, 0.82, 1]),
        });
      }
      c.agregar(new THREE.IcosahedronGeometry(0.14 + (i % 2) * 0.04, 0), {
        color: ['#857d72', '#9a9288', '#6f6a62'][i % 3], tipo: 4, variar: 0.14,
        matriz: matriz([chX + (col - 1) * 0.16, yy, chZ - 0.36], [i * 1.3, i, 0], [1, 0.85, 1]),
      });
    }
    // el remate de chapa sobre la boca
    caja(c, [chX, chTope + 0.02, chZ], [0.78, 0.09, 0.92], '#57524b', 0, 4);
    for (const [sx, sz] of [[-0.3, -0.36], [0.3, -0.36], [-0.3, 0.36], [0.3, 0.36]]) {
      c.agregar(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 5), { color: '#4a443c', tipo: 4, matriz: matriz([chX + sx, chTope + 0.17, chZ + sz]) });
    }
    caja(c, [chX, chTope + 0.33, chZ], [0.82, 0.06, 0.96], '#4a443c', 0, 4);
    // ---------- la galería del frente ----------
    const GAL = 1.9;                      // lo que sale la galería
    const zGal = D / 2 + GAL / 2;
    for (let i = 0; i < 7; i++) {
      c.agregar(new THREE.BoxGeometry(W + 0.9, 0.09, GAL / 7 + 0.02), {
        color: i % 2 ? TABLA : '#8a6b4a', tipo: 4, variar: 0.1,
        matriz: matriz([0, 0.2, D / 2 + GAL / 14 + i * (GAL / 7)]),
      });
    }
    // pilotes de la galería, que bajan al suelo
    for (const px of [-W / 2 - 0.35, -1.35, 1.35, W / 2 + 0.35]) {
      posteHastaTerreno(c, { x, z, y }, rot, px, D / 2 + GAL - 0.15, 0.2, 0.1, MADERA_OSCURA);
    }
    // celosía que tapa el bajo galería. Su borde inferior sigue el terreno:
    // con la cota fija anterior podía verse suspendida en el lado bajo del lote.
    for (let i = 0; i < 14; i++) {
      const px = -W / 2 - 0.4 + i * ((W + 0.8) / 13);
      const pzCel = D / 2 + GAL - 0.05;
      const baseA = Math.min(0.10, sueloLocal({ x, z, y }, rot, px, pzCel) + 0.05);
      const baseB = Math.min(0.10, sueloLocal({ x, z, y }, rot, px + 0.35, pzCel) + 0.05);
      cilindroEntre(c, [px, baseA, pzCel], [px + 0.35, 0.14, pzCel], 0.025, '#5f4a33');
      cilindroEntre(c, [px + 0.35, baseB, pzCel], [px, 0.14, pzCel], 0.025, '#5f4a33');
    }
    // baranda de troncos: postes, pasamanos y balaustres, con el hueco de la escalera
    const barandaPost = (px, pz) => cilindroEntre(c, [px, 0.2, pz], [px, 1.15, pz], 0.075, MADERA);
    for (const px of [-W / 2 - 0.4, -1.1, 1.1, W / 2 + 0.4]) barandaPost(px, D / 2 + GAL - 0.1);
    barandaPost(-W / 2 - 0.4, D / 2 + 0.3); barandaPost(W / 2 + 0.4, D / 2 + 0.3);
    const tramo = (x1, z1, x2, z2) => {
      for (const yy of [0.72, 1.12]) cilindroEntre(c, [x1, yy, z1], [x2, yy, z2], 0.055, MADERA);
      const n = Math.max(2, Math.round(Math.hypot(x2 - x1, z2 - z1) / 0.32));
      for (let i = 1; i < n; i++) {
        const t = i / n;
        cilindroEntre(c, [x1 + (x2 - x1) * t, 0.24, z1 + (z2 - z1) * t], [x1 + (x2 - x1) * t, 1.1, z1 + (z2 - z1) * t], 0.035, '#7a5f43');
      }
    };
    tramo(-W / 2 - 0.4, D / 2 + GAL - 0.1, -1.1, D / 2 + GAL - 0.1);
    tramo(1.1, D / 2 + GAL - 0.1, W / 2 + 0.4, D / 2 + GAL - 0.1);
    tramo(-W / 2 - 0.4, D / 2 + 0.3, -W / 2 - 0.4, D / 2 + GAL - 0.1);
    tramo(W / 2 + 0.4, D / 2 + 0.3, W / 2 + 0.4, D / 2 + GAL - 0.1);
    // escalera al frente, con su pasamanos
    // 3.0.1: los cuatro peldaños bajaban sólo 25 cm: en la orilla del lago quedaban
    // colgados 1,2 m sobre la arena (la galería no tenía subida) aunque el pasamanos sí
    // bajaba hasta el suelo. Si el terreno al pie está más abajo, la escalera baja hasta
    // él con peldaños macizos (y el pasamanos con ella); en llano queda como estaba.
    let zPieEscalera = D / 2 + GAL + 1.4;
    {
      const clasica = (i) => Math.max(0.185 - i * 0.06, sueloLocal({ x, z, y }, rot, 0, D / 2 + GAL + 0.18 + i * 0.36) + 0.09);
      const baja = clasica(3) - sueloLocal({ x, z, y }, rot, 0, D / 2 + GAL + 1.26) > 0.3;
      if (!baja) for (let i = 0; i < 4; i++) {
        const lzPaso = D / 2 + GAL + 0.18 + i * 0.36;
        const sueloPaso = sueloLocal({ x, z, y }, rot, 0, lzPaso);
        const ideal = 0.14 - i * 0.06;
        const altoPaso = Math.max(ideal, sueloPaso + 0.045);
        PC.escalon({ lx: 0, lz: lzPaso,
          largo: 2.0, ancho: 0.34, alto: altoPaso, espesor: 0.09,
          color: i % 2 ? TABLA : '#8a6b4a' });
      }
      else {
        // de a 30 cm de alto y 25 de pedada: más empinada no se sube (el peldaño de tres
        // más arriba frena al cuerpo antes de pisar el siguiente)
        let tope = 0.245;
        for (let i = 0; i < 14; i++) {
          const lzPaso = D / 2 + GAL + 0.16 + i * 0.25;
          const sueloPaso = sueloLocal({ x, z, y }, rot, 0, lzPaso);
          // el primero, apenas 13 cm bajo la galería: más abajo, la tabla de la galería (9 cm
          // de espesor) le hace de techo y no deja subir
          tope = Math.max(sueloPaso + 0.09, tope - (i === 0 ? 0.13 : 0.3));
          const esp = tope - sueloPaso + 0.08;
          PC.escalon({ lx: 0, lz: lzPaso,
            largo: 2.0, ancho: 0.27, alto: tope - esp / 2, espesor: esp,
            color: i % 2 ? TABLA : '#8a6b4a' });
          zPieEscalera = lzPaso + 0.14;
          if (tope - sueloPaso < 0.12) break;
        }
      }
    }
    for (const lado of [-1, 1]) {
      const zPie = zPieEscalera;
      const sueloPie = sueloLocal({ x, z, y }, rot, lado * 1.05, zPie);
      const yPie = sueloPie + 0.06;
      cilindroEntre(c, [lado * 1.05, 0.25, D / 2 + GAL + 0.05], [lado * 1.05, yPie, zPie], 0.05, MADERA);
      cilindroEntre(c, [lado * 1.05, 1.05, D / 2 + GAL + 0.05], [lado * 1.05, yPie + 0.8, zPie], 0.05, MADERA);
      cilindroEntre(c, [lado * 1.05, 0.25, D / 2 + GAL + 0.05], [lado * 1.05, 1.05, D / 2 + GAL + 0.05], 0.05, MADERA);
      cilindroEntre(c, [lado * 1.05, yPie, zPie], [lado * 1.05, yPie + 0.8, zPie], 0.05, MADERA);
    }
    // V7 TERMINACIÓN — galería realmente techada. Antes el porche tenía piso y
    // baranda pero la fachada seguía leyendo casi igual desde lejos. Esta cubierta
    // cambia la silueta de la cabaña y explica por qué la madera exterior se conserva.
    const zTechoGaleria = D / 2 + GAL / 2 + 0.05;
    const INCL_GALERIA = 0.11; // +Z es hacia afuera: signo positivo = caída hacia el jardín
    c.agregar(new THREE.BoxGeometry(W + 1.35, 0.16, GAL + 0.75), {
      color: '#504138', tipo: 4, variar: 0.08,
      matriz: matriz([0, 2.48, zTechoGaleria], [INCL_GALERIA, 0, 0]),
    });
    caja(c, [0, 2.34, D / 2 + GAL - 0.10], [W + 1.25, 0.18, 0.18], '#4a382b');
    const zPosteGaleria = D / 2 + GAL - 0.15;
    const yPosteGaleria = 2.48 - (zPosteGaleria - zTechoGaleria) * Math.sin(INCL_GALERIA)
      - 0.08 * Math.cos(INCL_GALERIA);
    // El acceso central queda completamente libre. En la V6 había un poste
    // exactamente en x=0, delante de la escalinata: visualmente parecía sostener
    // el techo, pero convertía la entrada en un obstáculo mal diseñado.
    for (const px of [-W / 2 - 0.35, -1.35, 1.35, W / 2 + 0.35]) {
      posteHastaTerreno(c, { x, z, y }, rot, px, zPosteGaleria, yPosteGaleria, 0.095, MADERA_OSCURA, 0.14, true);
      // ménsula diagonal grande: se lee claramente desde el sendero
      cilindroEntre(c, [px, 1.78, zPosteGaleria], [px, yPosteGaleria - 0.04, D / 2 + 0.55], 0.055, MADERA);
    }
    // el banco de la galería, mirando al lago
    caja(c, [1.45, 0.62, D / 2 + 0.9], [1.5, 0.09, 0.42], TABLA);
    for (const xx of [0.85, 2.05]) caja(c, [xx, 0.4, D / 2 + 0.9], [0.1, 0.42, 0.36], MADERA_OSCURA);
    caja(c, [1.45, 0.92, D / 2 + 0.72], [1.5, 0.42, 0.07], TABLA);
    // dos travesaños que bajan al suelo y la leña apoyada encima. El rack
    // queda nivelado por encima del punto más alto del terreno bajo sus cuatro
    // apoyos, en vez de cortar la ladera o quedar suspendido de un lado.
    const zLeñera = [-1.15, -0.4];
    const sueloLeñera = Math.max(...zLeñera.flatMap(pz => [
      sueloLocal({ x, z, y }, rot, W / 2 + 0.35, pz),
      sueloLocal({ x, z, y }, rot, W / 2 + 1.55, pz),
    ]));
    const yLeñera = sueloLeñera + 0.16;
    for (const pz of zLeñera) {
      posteHastaTerreno(c, { x, z, y }, rot, W / 2 + 0.35, pz, yLeñera + 0.02, 0.07, MADERA_OSCURA);
      posteHastaTerreno(c, { x, z, y }, rot, W / 2 + 1.55, pz, yLeñera + 0.02, 0.07, MADERA_OSCURA);
      cilindroEntre(c, [W / 2 + 0.3, yLeñera, pz], [W / 2 + 1.6, yLeñera, pz], 0.06, MADERA_OSCURA);
    }
    for (let i = 0; i < 8; i++) {
      const fila = Math.floor(i / 4), col = i % 4;
      const yy = yLeñera + 0.14 + fila * 0.21;
      cilindroEntre(c, [W / 2 + 0.4, yy, -1.1 + col * 0.22], [W / 2 + 1.5, yy, -1.1 + col * 0.22], 0.1, i % 2 ? MADERA : '#6a5136');
    }
    // adentro: catre y mesita
    // 3.0.1: el catre va 35 cm más al centro: su cabecera se metía en el hogar de piedra
    const CATRE_X = -W / 2 + 1.4;
    caja(c, [CATRE_X, 0.42, -D / 2 + 0.9], [1.7, 0.2, 0.85], MADERA_OSCURA);
    caja(c, [CATRE_X, 0.56, -D / 2 + 0.9], [1.6, 0.12, 0.78], '#8c7a62');
    caja(c, [CATRE_X + 0.15, 0.63, -D / 2 + 0.9], [1.1, 0.05, 0.8], '#7b3a2c');
    caja(c, [W / 2 - 1.0, 0.75, -D / 2 + 0.8], [1.0, 0.07, 0.7], TABLA);
    for (const [mx, mz] of [[W / 2 - 1.4, -D / 2 + 0.55], [W / 2 - 0.6, -D / 2 + 0.55], [W / 2 - 1.4, -D / 2 + 1.05], [W / 2 - 0.6, -D / 2 + 1.05]]) caja(c, [mx, 0.48, mz], [0.07, 0.55, 0.07], MADERA_OSCURA);
    // hogar de piedra bajo la chimenea
    caja(c, [-W / 2 + 0.25, 0.62, -0.6], [0.5, 0.8, 0.9], '#6b6660');
    // Los muebles grandes del interior y la chimenea exterior ya no son
    // decorado atravesable. `dibujar:false` reutiliza su geometría existente
    // y emite únicamente la física correspondiente.
    PC.mueble({ lx: CATRE_X, ly: 0.50, lz: -D / 2 + 0.9,
      largo: 1.72, alto: 0.40, ancho: 0.88, color: MADERA_OSCURA, pisable: true, dibujar: false });
    // 3.0.1: la leñera de afuera también frena (se atravesaban los troncos)
    PC.mueble({ lx: W / 2 + 0.95, ly: yLeñera + 0.25, lz: -0.775, largo: 1.4, alto: 0.62, ancho: 0.95,
      color: MADERA, dibujar: false });
    PC.mueble({ lx: W / 2 - 1.0, ly: 0.49, lz: -D / 2 + 0.8,
      largo: 1.02, alto: 0.60, ancho: 0.72, color: TABLA, dibujar: false });
    PC.mueble({ lx: -W / 2 + 0.25, ly: 0.62, lz: -0.6,
      largo: 0.52, alto: 0.82, ancho: 0.92, color: '#6b6660', dibujar: false });
    PC.mueble({ lx: chX, ly: (chTope + chBase) / 2, lz: chZ,
      largo: 0.58, alto: chTope - chBase, ancho: 0.72, color: '#7d766c', dibujar: false });
    if (opciones.remos) {
      const sRemo1 = sueloLocal({ x, z, y }, rot, -W / 2 - 0.9, 1.2);
      const sRemo2 = sueloLocal({ x, z, y }, rot, -W / 2 - 0.75, 1.6);
      cilindroEntre(c, [-W / 2 - 0.9, sRemo1 + 0.03, 1.2], [-W / 2 - 0.6, sRemo1 + 2.03, 1.1], 0.04, MADERA);
      caja(c, [-W / 2 - 0.58, sRemo1 + 2.13, 1.1], [0.06, 0.4, 0.16], '#3f6a80');
      cilindroEntre(c, [-W / 2 - 0.75, sRemo2 + 0.03, 1.6], [-W / 2 - 0.5, sRemo2 + 1.93, 1.5], 0.04, MADERA);
    }
    const grupoCab = new THREE.Group();
    grupoCab.position.set(x, y, z); grupoCab.rotation.y = rot;
    const malla = new THREE.Mesh(c.geometria(), mat);
    malla.castShadow = true; malla.receiveShadow = true;
    grupoCab.add(malla);
    if (puertas) puertas.agregar({ sitio: { x, z, y, piso: 0.35 }, rot, lx: (PUERTA.x0 + PUERTA.x1) / 2, lz: D / 2 + 0.03, ancho: PUERTA.x1 - PUERTA.x0 - 0.05, alto: 1.84, lado: -1, nombre: `la puerta de ${nombre.toLowerCase()}`, adentro: true });
    const vidrio = materialVidrio(0x1a1612);
    const ventana = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.7), vidrio);
    ventana.position.set(-W / 2 - 0.02, 1.35, 0); ventana.rotation.y = -Math.PI / 2;
    grupoCab.add(ventana);
    // los postigos de esa ventana, que se abren y se cierran
    if (puertas) {
      puertas.agregarPostigos({
        sitio: { x, z, y }, rot: rot - Math.PI / 2, lx: 0, ly: 1.35, lz: W / 2 + 0.06,
        ancho: 1.06, alto: 0.78, nombre: `los postigos de ${nombre.toLowerCase()}`,
      });
    }
    const luz = new THREE.PointLight(0xffa860, 0, 12, 1.7);
    luz.position.set(0, 1.7, 0);
    const interior = new THREE.PointLight(0xd8e0e8, 0, 7, 1.4);
    interior.position.set(0, 1.5, 0);
    grupoCab.add(luz, interior);
    grupo.add(grupoCab);

    const w = (lx, lz) => aMundo({ x, z }, rot, lx, lz);
    const PARED = { desde: 0.3, hasta: H + 0.2, espesor: radio * 2, dibujar: false };
    PC.paredRecta({ ...PARED, a: [-W / 2, -D / 2], b: [W / 2, -D / 2] });
    PC.paredRecta({ ...PARED, a: [-W / 2, -D / 2], b: [-W / 2, D / 2] });
    PC.paredRecta({ ...PARED, a: [W / 2, -D / 2], b: [W / 2, D / 2] });
    PC.paredRecta({ ...PARED, a: [-W / 2, D / 2], b: [W / 2, D / 2], huecos: [{ desde: PUERTA.x0 + W / 2, hasta: PUERTA.x1 + W / 2 }] });
    // Toda la galería visual es caminable. Antes la física cubría sólo una
    // franja del lado derecho y se podía caer a través de la mitad izquierda.
    const entab = w(0, D / 2 + GAL / 2);
    col.agregarPlataforma({ x: entab.x, z: entab.z, ang: -rot, largo: W + 0.9, ancho: GAL, alto: y + 0.245, espesor: 0.09 });
    // La baranda también existe en física, dejando exactamente el hueco central
    // de la escalera que se ve en el modelo.
    const rail = (a, b) => {
      const A = w(a[0], a[1]), B = w(b[0], b[1]);
      col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.07,
        alturaMin: y + 0.18, alturaMax: y + 1.24 });
    };
    const zExterior = D / 2 + GAL - 0.1, zInterior = D / 2 + 0.3, xBorde = W / 2 + 0.4;
    rail([-xBorde, zExterior], [-1.1, zExterior]);
    rail([1.1, zExterior], [xBorde, zExterior]);
    rail([-xBorde, zInterior], [-xBorde, zExterior]);
    rail([xBorde, zInterior], [xBorde, zExterior]);
    // Los pasamanos de la escalinata también frenan. Visualmente estaban ahí,
    // pero antes se podía atravesarlos de costado y caer fuera de los peldaños.
    const zEsc0 = D / 2 + GAL + 0.05, zEsc1 = zPieEscalera;
    for (const lado of [-1, 1]) {
      const A = w(lado * 1.05, zEsc0), B = w(lado * 1.05, zEsc1);
      const s0 = sueloLocal({ x, z, y }, rot, lado * 1.05, zEsc0);
      const s1 = sueloLocal({ x, z, y }, rot, lado * 1.05, zEsc1);
      col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.06,
        alturaMin: y + Math.min(s0, s1) - 0.06, alturaMax: y + 1.18 });
    }
    const ch = w(chX, chZ);
    const banco = w(1.45, D / 2 + 0.9);
    sentaderos.push({ x: banco.x, z: banco.z, y: y + 0.68, nombre: `el banco de ${nombre.toLowerCase()}`, mira: rot + Math.PI });
    const catre = w(CATRE_X, -D / 2 + 0.9);
    sentaderos.push({ x: catre.x, z: catre.z, y: y + 0.68, nombre: 'el catre', cama: true, mira: rot });
    const puerta = w(0, D / 2 + 2.4);
    const info = { x, z, y, rot, nombre, chimenea: { x: ch.x, y: y + chTope + 0.08, z: ch.z }, vidrio, luz, interior, puerta,
      // incluye galería, escalinata y leñera; sirve para despejar vegetación/objetos
      // del volumen completo de la construcción, no solo de la caja principal.
      radio: Math.max(W / 2 + 2.2, D / 2 + GAL + 1.75) };
    T.lugares[clave] = info;
    cabañas.push(info);
    registrarHuella(clave, info, info.radio, 4);
    const pc = w(-2.4, D / 2 + 3.4);
    cartel(nombre, pc.x, pc.z, rot);
    return info;
  }

  // Cabaña del Pescador: a orillas del lago, lejos del refugio
  {
    // busca la orilla más pareja; si no encuentra, afloja las exigencias
    const buscar = (pendMax, desnivelMax, claro) => {
      let mejor = null, mejorD = 0;
      for (let i = 0; i < 3000; i++) {
        const a = (i / 3000) * Math.PI * 2;
        const rad = T.radioLago(a) + 9 + (i % 7);
        const x = LAGO.x + Math.cos(a) * rad, z = LAGO.z + Math.sin(a) * rad;
        const y = T.altura(x, z);
        if (y < 0.9 || y > 5 || T.agua(x, z)) continue;
        if (T.pendiente[T.indice(x, z)] > pendMax || T.distRiel[T.indice(x, z)] < 18) continue;
        const alturas = [[3, 0], [-3, 0], [0, 3], [0, -3]].map(([ax, az]) => T.altura(x + ax, z + az));
        if (Math.max(...alturas) - Math.min(...alturas) > desnivelMax) continue;
        if (!despejado(x, z, claro)) continue;
        if (invadeHuella(x, z, 6.5, 4)) continue;
        const d = Math.hypot(x - L.refugio.x, z - L.refugio.z) + Math.hypot(x - L.muelle.x, z - L.muelle.z);
        if (d > mejorD) { mejorD = d; mejor = { x, z }; }
      }
      return mejor;
    };
    const sitio = buscar(0.22, 1.1, 6.5) || buscar(0.3, 1.8, 5.5) || buscar(0.45, 3, 4);
    if (sitio) cabaña('cabana', 'Cabaña del Pescador', sitio.x, sitio.z, LAGO, { remos: true });
  }

  // Puesto Alto: arriba, del lado de la cordillera
  {
    const buscar = (alturaMin, pendMax, claro) => {
      let mejor = null, mejorAlto = 0;
      for (let i = 0; i < 4000; i++) {
        const x = (r() * 2 - 1) * 380, z = (r() * 2 - 1) * 380;
        const y = TS.altura(x, z);
        const k = T.indice(x, z);
        if (y < alturaMin || TS.agua(x, z) || TS.pendiente[k] > pendMax || T.distRiel[k] < 20) continue;
        if (Math.hypot(x - L.mirador.x, z - L.mirador.z) < 45) continue;
        if (!despejado(x, z, claro)) continue;
        if (invadeHuella(x, z, 6.5, 4)) continue;
        if (y > mejorAlto) { mejorAlto = y; mejor = { x, z }; }
      }
      return mejor;
    };
    const sitio = buscar(42, 0.3, 7) || buscar(34, 0.38, 5.5) || buscar(24, 0.5, 4.5);
    if (sitio) cabaña('puesto', 'Puesto Alto', sitio.x, sitio.z, LAGO, { ancho: 4.0, fondo: 3.6 });
  }

  // ---------------------------------------------------------------- faro
  let faro = null;
  {
    // Una punta del lago, lo más lejos posible del muelle. La primera pasada
    // busca el emplazamiento ideal; si la costa procedural no ofrece una meseta
    // casi perfecta, una segunda pasada elige la mejor punta disponible y la
    // cimentación absorbe el desnivel. Antes el faro podía no existir en absoluto
    // porque el terreno determinista actual no contiene NI UN punto con <0.62 m
    // de variación dentro de su huella.
    let mejor = null, mejorD = 0;
    const candidatoFaro = (a, retiro) => {
      const rad = T.radioLago(a) + retiro;
      const x = LAGO.x + Math.cos(a) * rad, z = LAGO.z + Math.sin(a) * rad;
      const y = T.altura(x, z);
      if (T.agua(x, z)) return null;
      const aro = [];
      for (let k = 0; k < 12; k++) {
        const aa = (k / 12) * Math.PI * 2;
        aro.push(T.altura(x + Math.cos(aa) * 3.55, z + Math.sin(aa) * 3.55));
      }
      return { x, z, y, sueloMin: Math.min(y, ...aro), sueloMax: Math.max(y, ...aro), desnivel: Math.max(...aro) - Math.min(...aro),
        d: Math.hypot(x - L.muelle.x, z - L.muelle.z) };
    };
    for (let i = 0; i < 2000; i++) {
      const a = (i / 2000) * Math.PI * 2;
      const q = candidatoFaro(a, 2);
      if (!q || q.y < 0.4 || q.y > 4 || q.desnivel > 0.62 || !despejado(q.x, q.z, 5)) continue;
      if (invadeHuella(q.x, q.z, 6.2, 6)) continue;
      if (q.d > mejorD) { mejorD = q.d; mejor = q; }
    }
    if (!mejor) {
      let mejorPuntaje = -Infinity;
      // En la costa actual el terreno sube muy rápido. Alejar la torre entre
      // 6 y 14 m del agua produce una implantación creíble sin perder la idea
      // de faro costero. La vegetación se despeja después, por eso no se usa
      // como requisito absoluto en este fallback.
      for (const retiro of [6, 8, 10, 12, 14]) for (let i = 0; i < 1600; i++) {
        const a = (i / 1600) * Math.PI * 2;
        const q = candidatoFaro(a, retiro);
        if (!q || q.y < 0.15 || q.y > 8 || q.desnivel > 3.2) continue;
        const k = T.indice(q.x, q.z);
        if (T.distRiel[k] < 18 || q.d < 90 || Math.hypot(q.x - L.refugio.x, q.z - L.refugio.z) < 75) continue;
        if (invadeHuella(q.x, q.z, 6.2, 5)) continue;
        const puntaje = q.d - q.desnivel * 34 - Math.abs(q.y - 1.6) * 4 - retiro * 0.35;
        if (puntaje > mejorPuntaje) { mejorPuntaje = puntaje; mejor = q; }
      }
    }
    if (mejor) {
      // El faro, ahora de dieciséis metros y para subir por dentro
      const ALTO = 16;
      const R_BASE = 2.9, R_TOPE = 1.85;
      const rot = Math.atan2(LAGO.x - mejor.x, LAGO.z - mejor.z) + Math.PI;   // la puerta, de espaldas al lago
      // La torre se apoya por encima del punto más alto de su huella y el
      // zócalo baja hasta el más bajo. Así nunca corta la ladera ni flota.
      const y0 = (mejor.sueloMax ?? mejor.y) + 0.10;
      const baseFaroLocal = (mejor.sueloMin ?? mejor.y) - y0 - 0.18;
      const radioA = (y) => R_BASE - (R_BASE - R_TOPE) * Math.min(1, y / ALTO);
      const HUECO_PUERTA = { centro: Math.PI, ancho: 1.16 };   // ancho real del vano, no un sector angular sobredimensionado
      const VUELTAS_FARO = 3.2;
      const ANG_SALIDA_FARO = Math.PI + VUELTAS_FARO * Math.PI * 2;
      const HUECO_GALERIA = { centro: ANG_SALIDA_FARO, ancho: 1.05 };
      const c = new Constructor();

      // Zócalo de piedra con el MISMO vano de la puerta. Antes era un cilindro
      // cerrado que tapaba visualmente la mitad inferior de la entrada, aunque la
      // física sí dejara pasar: una contradicción muy visible al acercarse al faro.
      const P = piezas(c, col, { x: mejor.x, z: mejor.z, y: y0, rot }, matriz);
      P.paredCurva({
        radio: R_BASE + 0.42, desde: baseFaroLocal, hasta: 1.22, espesor: 0.58, sectores: 24,
        color: '#6b6660', hueco: HUECO_PUERTA,
        alturaMin: baseFaroLocal - 0.10, alturaMax: 1.30,
      });

      // la torre a franjas: cada anillo emite su geometría Y su colisión
      const ANILLOS = 16;
      for (let i = 0; i < ANILLOS; i++) {
        const y0a = 1.0 + i * (ALTO - 1) / ANILLOS;
        const h = (ALTO - 1) / ANILLOS;
        const r0 = radioA(y0a), r1 = radioA(y0a + h);
        const blanco = i % 2 === 0;
        P.paredCurva({
          radio: (r0 + r1) / 2,
          desde: y0a, hasta: y0a + h * 1.02,
          espesor: 0.3, sectores: 18,
          color: blanco ? '#d6d0c2' : '#9e4436',
          hueco: y0a < 2.2 ? HUECO_PUERTA : (y0a > ALTO - 2.1 ? HUECO_GALERIA : null),
          // 3.0.1: el anillo que va sobre el vano de la puerta frenaba 25 cm por debajo de
          // donde empieza (un dintel invisible a 2,6 m): parado en el piso, la cabeza chocaba
          alturaMin: (i > 0 && y0a - h < 2.2) ? y0a + 0.02 : y0a - 0.25, alturaMax: y0a + h + 0.05,
        });
        // ventanitas cada cuatro anillos, alternando el lado
        if (i % 4 === 3) {
          const a2 = (i / 4) * 2.1;
          c.agregar(new THREE.BoxGeometry(0.5, 0.65, 0.2), { color: '#3f3a34', tipo: 4, matriz: matriz([Math.sin(a2) * r0, y0a + h / 2, -Math.cos(a2) * r0], [0, -a2, 0]) });
          c.agregar(new THREE.BoxGeometry(0.66, 0.1, 0.24), { color: '#e6e1d4', tipo: 4, matriz: matriz([Math.sin(a2) * r0, y0a + h / 2 + 0.38, -Math.cos(a2) * r0], [0, -a2, 0]) });
          c.agregar(new THREE.BoxGeometry(0.66, 0.1, 0.24), { color: '#e6e1d4', tipo: 4, matriz: matriz([Math.sin(a2) * r0, y0a + h / 2 - 0.38, -Math.cos(a2) * r0], [0, -a2, 0]) });
        }
      }

      // la escalera de caracol: peldaños de hierro contra la pared
      const PELDANOS = 58;
      const VUELTAS = VUELTAS_FARO;
      const peldanos = [];
      for (let i = 0; i < PELDANOS; i++) {
        const t = i / PELDANOS;
        const y = 1.15 + t * (ALTO - 1.9);
        const a2 = Math.PI + t * VUELTAS * Math.PI * 2;
        const rr = radioA(y) - 0.62;
        const px = Math.sin(a2) * rr, pz = -Math.cos(a2) * rr;
        c.agregar(new THREE.BoxGeometry(1.15, 0.1, 0.68), {
          color: i % 3 ? '#6b6158' : '#59504a', tipo: 4, variar: 0.08,
          matriz: matriz([px, y, pz], [0, Math.PI / 2 - a2, 0]),
        });
        // el eje central y el pasamanos
        if (i % 2 === 0) {
          cilindroEntre(c, [px * 0.15, y - 0.5, pz * 0.15], [px * 0.15, y + 0.5, pz * 0.15], 0.07, '#4a443c');
          cilindroEntre(c, [px * 1.12, y + 0.55, pz * 1.12], [Math.sin(a2 + 0.3) * rr * 1.12, y + 0.85, -Math.cos(a2 + 0.3) * rr * 1.12], 0.035, '#59504a');
        }
        peldanos.push({ x: px, z: pz, y, ang: a2, giro: Math.PI / 2 - a2 });
      }

      // el piso de la sala de la linterna y su galería exterior
      // el ángulo donde termina la escalera, para dejarle el paso libre
      const angFinal = ANG_SALIDA_FARO;
      // 3.0.1: el hueco de la escalera acompaña la última vuelta: con ±1 rad alrededor de
      // la llegada, los peldaños de antes pasaban bajo el piso con la cabeza adentro de la
      // losa y en el faro no se llegaba arriba (la cabeza pide 1,7 m libres: ~160° de caracol).
      // Termina justo después del último peldaño (antes quedaba un hueco de 60 cm entre el
      // último peldaño y el piso, y se caía por el medio de la torre).
      const HUECO_SALA = { centro: angFinal - 1.575, medio: 1.525, desde: 0.3 };
      P.pisoRedondo({
        radio: R_TOPE - 0.1, alto: ALTO - 0.7, color: '#8a7358', caras: 20,
        hueco: HUECO_SALA,
      });
      // Salida real a la galería. En versiones anteriores el anillo exterior
      // existía, pero la pared superior no tenía vano y quedaba 81 cm más alto
      // que el piso interior: era una galería visible pero inaccesible.
      for (const [rPaso, yPaso] of [[R_TOPE - 0.22, ALTO - 0.42], [R_TOPE + 0.26, ALTO - 0.14]]) {
        P.escalon({
          lx: Math.sin(angFinal) * rPaso, lz: -Math.cos(angFinal) * rPaso,
          largo: 0.82, ancho: 1.0, alto: yPaso, espesor: 0.12, color: '#6f665b',
          giro: Math.PI / 2 - angFinal,
        });
      }
      // dos postes marcan el hueco por donde se sube y se baja
      for (const lado of [-1, 1]) {
        const a3 = HUECO_SALA.centro + lado * HUECO_SALA.medio;   // 3.0.1: en los bordes del hueco
        cilindroEntre(c, [Math.sin(a3) * (R_TOPE - 0.25), ALTO - 0.6, -Math.cos(a3) * (R_TOPE - 0.25)],
          [Math.sin(a3) * (R_TOPE - 0.25), ALTO + 0.15, -Math.cos(a3) * (R_TOPE - 0.25)], 0.05, '#4a443c');
      }
      // la galería es un anillo alrededor de la sala: si fuera un disco, su
      // piso taparía la sala y se caminaría en el aire adentro
      P.pisoRedondo({ radio: R_TOPE + 0.75, radioInterior: R_TOPE - 0.12, alto: ALTO + 0.1, espesor: 0.18, color: '#7d766c' });
      for (let i = 0; i < 16; i++) {
        const a2 = (i / 16) * Math.PI * 2;
        cilindroEntre(c, [Math.sin(a2) * (R_TOPE + 0.6), ALTO + 0.18, -Math.cos(a2) * (R_TOPE + 0.6)],
          [Math.sin(a2) * (R_TOPE + 0.6), ALTO + 1.05, -Math.cos(a2) * (R_TOPE + 0.6)], 0.045, '#4a443c');
      }
      for (const yy of [ALTO + 0.65, ALTO + 1.05]) {
        c.agregar(new THREE.TorusGeometry(R_TOPE + 0.6, 0.04, 5, 20), { color: '#4a443c', tipo: 4, matriz: matriz([0, yy, 0], [Math.PI / 2, 0, 0]) });
      }
      // los montantes de la linterna y el techo cónico con su pararrayos
      for (let i = 0; i < 8; i++) {
        const a2 = (i / 8) * Math.PI * 2;
        cilindroEntre(c, [Math.sin(a2) * (R_TOPE - 0.2), ALTO + 0.2, -Math.cos(a2) * (R_TOPE - 0.2)],
          [Math.sin(a2) * (R_TOPE - 0.2), ALTO + 2.1, -Math.cos(a2) * (R_TOPE - 0.2)], 0.06, '#3f3a36');
      }
      // los paños de vidrio de la linterna, entre montante y montante
      for (let i = 0; i < 8; i++) {
        const a1 = (i / 8) * Math.PI * 2, a2 = ((i + 1) / 8) * Math.PI * 2;
        const medio = (a1 + a2) / 2, rr = R_TOPE - 0.2;
        const ancho = Math.hypot(Math.sin(a2) * rr - Math.sin(a1) * rr, Math.cos(a2) * rr - Math.cos(a1) * rr);
        c.agregar(new THREE.BoxGeometry(ancho * 0.92, 1.78, 0.04), {
          color: '#b9ccd6', tipo: 4, variar: 0.05,
          matriz: matriz([Math.sin(medio) * rr, ALTO + 1.14, -Math.cos(medio) * rr], [0, -medio, 0]),
        });
      }
      c.agregar(new THREE.ConeGeometry(R_TOPE + 0.3, 1.3, 14), { color: '#3f3a36', tipo: 4, matriz: matriz([0, ALTO + 2.75, 0]) });
      cilindroEntre(c, [0, ALTO + 3.4, 0], [0, ALTO + 4.1, 0], 0.035, '#8d9299');
      c.agregar(new THREE.SphereGeometry(0.1, 8, 6), { color: '#b9a271', tipo: 4, matriz: matriz([0, ALTO + 4.2, 0]) });

      // adentro, arriba: la mesa del farero, la bitácora y el bidón de kerosene
      // 3.0.1: van del lado sano del piso (el hueco de la escalera creció). La mesa, de
      // costado contra la pared: con 7 cm entre su punta y la pared, el cuerpo quedaba
      // apretado entre las dos y podía salir empujado del otro lado del muro
      const A_MESA_FARO = Math.PI * 1.945, R_MESA_FARO = R_TOPE - 0.59, GIRO_MESA_FARO = -A_MESA_FARO;
      const enMesa = (dx, dz) => [Math.sin(A_MESA_FARO) * R_MESA_FARO + dx * Math.cos(GIRO_MESA_FARO) + dz * Math.sin(GIRO_MESA_FARO),
        -Math.cos(A_MESA_FARO) * R_MESA_FARO - dx * Math.sin(GIRO_MESA_FARO) + dz * Math.cos(GIRO_MESA_FARO)];
      const [mesaFx, mesaFz] = enMesa(0, 0);
      c.agregar(new THREE.BoxGeometry(1.0, 0.07, 0.6), { color: MADERA, tipo: 4, matriz: matriz([mesaFx, ALTO - 0.05, mesaFz], [0, GIRO_MESA_FARO, 0]) });
      for (const sx of [-0.4, 0.4]) { const [px, pz] = enMesa(sx, sx * 0.5); c.agregar(new THREE.BoxGeometry(0.07, 0.62, 0.07), { color: MADERA_OSCURA, tipo: 4, matriz: matriz([px, ALTO - 0.38, pz]) }); }
      c.agregar(new THREE.BoxGeometry(0.42, 0.05, 0.3), { color: '#c9bfa6', tipo: 4, matriz: matriz([mesaFx, ALTO + 0.01, mesaFz], [0, GIRO_MESA_FARO + 0.4, 0]) });
      c.agregar(new THREE.CylinderGeometry(0.16, 0.16, 0.38, 10), { color: '#5f7a86', tipo: 4, variar: 0.1, matriz: matriz([0.70, ALTO - 0.45, -1.0]) });
      // La mesa del farero ya estaba dibujada pero era atravesable. Emitimos
      // solamente su volumen físico porque la geometría detallada ya existe.
      P.mueble({ lx: mesaFx, ly: ALTO - 0.35, lz: mesaFz, largo: 1.0, alto: 0.70, ancho: 0.62,
        color: MADERA, giro: GIRO_MESA_FARO, dibujar: false });

      // Planta baja y acceso: geometría y física nacen juntas ANTES de materializar
      // la malla. Antes estas piezas se agregaban después de c.geometria():
      // eran superficies invisibles pero caminables.
      P.pisoRedondo({ radio: R_BASE - 0.15, alto: 1.02, color: '#6b6158', caras: 16 });
      // V7 TERMINACIÓN — la escalinata exterior aterriza en la cota real del
      // terreno. Antes eran tres bloques con alturas absolutas: en una punta
      // inclinada del lago el primero podía quedar suspendido o enterrado.
      const sitioFaroFis = { x: mejor.x, z: mejor.z, y: y0 };
      const zEscFaro = [R_BASE + 1.55, R_BASE + 1.05, R_BASE + 0.55, R_BASE + 0.10];
      const sueloExteriorFaro = sueloLocal(sitioFaroFis, rot, 0, zEscFaro[0]);
      for (let i = 0; i < zEscFaro.length; i++) {
        const sueloPaso = sueloLocal(sitioFaroFis, rot, 0, zEscFaro[i]);
        const avance = (i + 1) / zEscFaro.length;
        const altoIdeal = lerp(sueloExteriorFaro + 0.16, 1.00, avance);
        const altoPaso = Math.max(sueloPaso + 0.07, altoIdeal);
        // 3.0.1: `escalon` centra la caja en `alto`: con el bloque que baja hasta el suelo,
        // la cara de arriba quedaba en altoPaso + espesor/2 (el último, a 1,67 m, medio metro
        // sobre el piso de adentro) y la cabeza chocaba el dintel: el faro no tenía entrada.
        const espesorPasoFaro = Math.max(0.14, altoPaso - sueloPaso + 0.05);
        P.escalon({
          lx: 0, lz: zEscFaro[i],
          largo: 1.82 - i * 0.08, ancho: 0.58,
          alto: altoPaso - espesorPasoFaro / 2, espesor: espesorPasoFaro,
          color: i % 2 ? '#7d766c' : '#6f6a62',
        });
      }
      const m = new THREE.Mesh(c.geometria(), mat);
      m.position.set(mejor.x, y0, mejor.z);
      m.rotation.y = rot;
      m.castShadow = true; m.receiveShadow = true;
      grupo.add(m);

      // La lente: prismas alrededor de la lámpara, que giran
      const vidrio = materialVidrio(0x2e2a22);
      const lampara = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.9, 12), vidrio);
      const lente = new THREE.Group();
      // 3.0.1: 85 cm más arriba, sobre la cabeza de quien está en la sala (el piso está a
      // ALTO − 0,62): a la altura de antes, la cámara quedaba adentro de la lámpara y los prismas
      lente.position.set(mejor.x, y0 + ALTO + 1.75, mejor.z);
      lente.add(lampara);
      const matPrisma = new THREE.MeshLambertMaterial({ color: 0xbcd6e0, transparent: true, opacity: 0.45 });
      for (let i = 0; i < 10; i++) {
        const a2 = (i / 10) * Math.PI * 2;
        const pr = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.1, 0.1), matPrisma);
        pr.position.set(Math.sin(a2) * 0.85, 0, -Math.cos(a2) * 0.85);
        pr.rotation.y = -a2;
        lente.add(pr);
      }
      grupo.add(lente);

      const haz = new THREE.SpotLight(0xffe6b0, 0, 190, 0.15, 0.6, 1.1);
      haz.position.copy(lente.position);
      const blanco = new THREE.Object3D();
      blanco.position.set(mejor.x + 40, mejor.y + 2, mejor.z);
      grupo.add(haz, blanco);
      haz.target = blanco;
      const brillo = new THREE.PointLight(0xffdca0, 0, 34, 1.6);
      brillo.position.copy(lente.position);
      grupo.add(brillo);

      // se puede subir: cada peldaño es una superficie, y arriba el piso y la galería
      const w = (lx, lz) => ({
        x: mejor.x + lx * Math.cos(rot) + lz * Math.sin(rot),
        z: mejor.z - lx * Math.sin(rot) + lz * Math.cos(rot),
      });
      for (const pe of peldanos) {
        const q = w(pe.x, pe.z);
        // 3.0.1: `sinTecho`, como en la torre: arriba del caracol los peldaños se solapan
        // y el siguiente no dejaba subir al de abajo
        col.agregarPlataforma({ x: q.x, z: q.z, ang: -(rot + pe.giro), largo: 1.20, ancho: 0.72, alto: y0 + pe.y + 0.05, espesor: 0.10, sinTecho: true });
      }
      // la baranda de la galería, para no caerse
      for (let i = 0; i < 18; i++) {
        const a1 = (i / 18) * Math.PI * 2, a2 = ((i + 1) / 18) * Math.PI * 2;
        const A = w(Math.sin(a1) * (R_TOPE + 0.62), -Math.cos(a1) * (R_TOPE + 0.62));
        const B = w(Math.sin(a2) * (R_TOPE + 0.62), -Math.cos(a2) * (R_TOPE + 0.62));
        col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.12, alturaMin: y0 + ALTO - 0.8, alturaMax: y0 + ALTO + 1.3 });
      }
      const puertaFaro = w(0, R_BASE + 1.4);
      if (puertas) {
        puertas.agregar({ sitio: { x: mejor.x, z: mejor.z, y: y0, piso: 1.05 }, rot, lx: 0, lz: R_BASE - 0.12, ancho: 0.95, alto: 1.95, lado: 1, nombre: 'la puerta del faro' });
      }
      faro = {
        x: mejor.x, z: mejor.z, y: y0, rot, alto: ALTO, nombre: 'Faro del Lago', vidrio, haz, brillo, blanco, radio: 6.2,
        pos: lente.position.clone(), lente, puerta: puertaFaro, mesa: w(mesaFx, mesaFz), altoSala: y0 + ALTO - 0.6,
      };
      T.lugares.faro = faro;
      registrarHuella('faro', faro, faro.radio, 5);
      const dx = LAGO.x - mejor.x, dz = LAGO.z - mejor.z, l = Math.hypot(dx, dz) || 1;
      // 3.0.1: el cartel va al costado de la escalinata; antes quedaba justo en el eje de
      // la puerta y la tabla se atravesaba a la altura de la cabeza
      cartel('Faro del Lago', mejor.x - (dx / l) * 6.5 + (dz / l) * 2.6, mejor.z - (dz / l) * 6.5 - (dx / l) * 2.6, Math.atan2(dx, dz) + Math.PI);
    }
  }

  // ---------------------------------------------------------------- lugar llano y despejado
  function buscarLlano({ bosqueMax = 0.3, alturaMin = 1.5, alturaMax = 999, pendMax = 0.18, desnivel = 0.9, claro = 9, radio = claro, margenHuella = 4, lejosDe = [], distancia = 70, cerca = null, cercaMax = 999 }) {
    let mejor = null, puntaje = -1;
    for (let i = 0; i < 6000; i++) {
      const x = (r() * 2 - 1) * 400, z = (r() * 2 - 1) * 400;
      const y = TS.altura(x, z);
      if (y < alturaMin || y > alturaMax || TS.agua(x, z)) continue;
      const k = T.indice(x, z);
      if (TS.pendiente[k] > pendMax || T.bosque[k] > bosqueMax) continue;
      const alrededor = [[4, 0], [-4, 0], [0, 4], [0, -4], [3, 3], [-3, -3]].map(([ax, az]) => TS.altura(x + ax, z + az));
      if (Math.max(...alrededor) - Math.min(...alrededor) > desnivel) continue;
      const retiroRiel = Math.max(22, radio + 8);
      if (T.distRiel[k] < retiroRiel) continue;   // la huella completa queda fuera de la vía/estaciones
      if (!despejado(x, z, claro)) continue;
      if (invadeHuella(x, z, radio, margenHuella)) continue;
      if (lejosDe.some((l) => l && Math.hypot(x - l.x, z - l.z) < distancia)) continue;
      if (cerca && Math.hypot(x - cerca.x, z - cerca.z) > cercaMax) continue;
      let p = 0;
      for (const l of lejosDe) if (l) p += Math.min(220, Math.hypot(x - l.x, z - l.z));
      if (cerca) p -= Math.hypot(x - cerca.x, z - cerca.z) * 1.5;
      p -= T.distSendero[k] * 2.5;   // mejor si el sendero pasa cerca
      if (p > puntaje) { puntaje = p; mejor = { x, z, y }; }
    }
    return mejor;
  }
  const haciaSendero = (x, z) => {
    let mejor = null, dm = Infinity;
    for (const p of T.sendero) { const d = Math.hypot(p.x - x, p.z - z); if (d < dm) { dm = d; mejor = p; } }
    return mejor || { x: x + 1, z };
  };

  // ---------------------------------------------------------------- molino holandés
  let molino = null;
  {
    const sitio = buscarLlano({ bosqueMax: 0.14, alturaMin: 3, pendMax: 0.14, desnivel: 0.8, claro: 12, lejosDe: [L.refugio, L.cabana, L.puesto, L.muelle, L.faro], distancia: 80 })
      || buscarLlano({ bosqueMax: 0.3, alturaMin: 2, pendMax: 0.22, desnivel: 1.4, claro: 9, lejosDe: [L.refugio, L.muelle], distancia: 50 });
    if (sitio) {
      const p = haciaSendero(sitio.x, sitio.z);
      const rot = Math.atan2(p.x - sitio.x, p.z - sitio.z);
      const c = new Constructor();
      const H = 9.2;
      // Todo el molino se arma con la misma convención que el faro:
      // x = sen(a)·r, z = -cos(a)·r, y el hueco de la puerta en a = PI (o sea -z local).
      const dir = (a, r) => [Math.sin(a) * r, -Math.cos(a) * r];
      const radioA = (y) => 2.45 - Math.max(0, (y - 2.8)) * 0.14;
      const HUECO_MOLINO = { centro: Math.PI, ancho: 1.30 };
      const PM = piezas(c, col, { x: sitio.x, z: sitio.z, y: sitio.y, rot }, matriz);

      // Base de piedra de verdad: antes era un cilindro completamente cerrado.
      // La puerta se dibujaba encima y la física dejaba pasar, por lo que el
      // jugador podía atravesar una pared de piedra visualmente intacta.
      PM.paredCurva({
        radio: 2.66, desde: -0.22, hasta: 2.66, espesor: 0.50, sectores: 20,
        color: '#7d7368', hueco: HUECO_MOLINO,
        alturaMin: -0.32, alturaMax: 2.74,
      });
      // Banda de coronación, ya por encima del dintel: puede ser continua.
      c.agregar(new THREE.CylinderGeometry(2.62, 2.62, 0.22, 16, 1, true), { color: '#5f574e', tipo: 4, matriz: matriz([0, 2.72, 0]) });

      // La torre de madera empieza arriba de la base pétrea. Antes ambas capas
      // ocupaban los mismos 2,6 m inferiores y se z-fighteaban/solapaban.
      const TORRE_DESDE = 2.60;
      const ANILLOS = 12;
      const tramoTorre = (H - 0.4 - TORRE_DESDE) / ANILLOS;
      for (let i = 0; i < ANILLOS; i++) {
        const y0 = TORRE_DESDE + i * tramoTorre;
        const h = tramoTorre;
        const r0 = radioA(y0 + h / 2);
        PM.paredCurva({
          radio: r0, desde: y0, hasta: y0 + h * 1.02, espesor: 0.22, sectores: 18,
          color: i % 2 ? '#e3ddd0' : '#d9d2c3',
          hueco: y0 < 2.2 ? HUECO_MOLINO : null,
          // 3.0.1: la torre se angosta 14 cm por metro y el cuerpo es un cilindro de 1,65 m:
          // contado hasta la coronilla, entre las muelas y la pared no quedaba lugar ni en el
          // entrepiso ni en la escalera de arriba. Cada anillo frena desde la cintura (80 cm
          // por encima de su borde de abajo): la cabeza puede inclinarse hacia la pared, y
          // la cámara igual queda a más de 20 cm de la madera.
          alturaMin: y0 + 0.8, alturaMax: y0 + h + 0.05,
        });
      }
      // marco de la puerta
      {
        const [px, pz] = dir(Math.PI, 2.66);
        c.agregar(new THREE.BoxGeometry(1.5, 0.16, 0.26), { color: '#5a4130', tipo: 4, matriz: matriz([px, 2.12, pz]) });
        for (const l of [-1, 1]) c.agregar(new THREE.BoxGeometry(0.16, 2.1, 0.26), { color: '#5a4130', tipo: 4, matriz: matriz([px + l * 0.66, 1.05, pz]) });
      }
      // ventanas, altas y en tres lados
      for (const a2 of [Math.PI * 0.35, Math.PI * 1.1, Math.PI * 1.7]) {
        const [px, pz] = dir(a2, radioA(4.4));
        c.agregar(new THREE.BoxGeometry(0.8, 0.9, 0.2), { color: '#3a322a', tipo: 4, matriz: matriz([px, 4.4, pz], [0, a2, 0]) });
        c.agregar(new THREE.BoxGeometry(0.95, 0.1, 0.24), { color: '#e6e1d4', tipo: 4, matriz: matriz([px, 4.92, pz], [0, a2, 0]) });
      }

      // Balcón exterior realmente utilizable. Antes era un disco con baranda
      // completa a 5,6 m, pero no había ningún recorrido desde la escalera que
      // termina a ~3 m: una parte visualmente atractiva pero funcionalmente falsa.
      const ANG_INICIO_ALTO = Math.PI * 0.82 + Math.PI * 1.25 + 0.28;
      const ANG_SALIDA_BALCON = ANG_INICIO_ALTO + Math.PI * 1.12;
      // 3.0.1: igual que el entrepiso: el hueco cubre la subida del segundo tramo (antes la
      // cabeza chocaba este piso y no se llegaba)
      PM.pisoRedondo({
        radio: 2.35, alto: 5.6, espesor: 0.16, color: MADERA_OSCURA, caras: 20,
        hueco: { centro: ANG_SALIDA_BALCON - 1.4, medio: 1.5, desde: 0.62 },
      });
      PM.baranda({
        radio: 2.2, base: 5.58, alto: 6.42, postes: 18, color: MADERA_OSCURA,
        hueco: { centro: ANG_SALIDA_BALCON, medio: 0.42 },
      });
      // capucha
      c.agregar(new THREE.CylinderGeometry(1.35, 1.6, 1.1, 8), { color: '#6a4f36', tipo: 4, matriz: matriz([0, H - 0.4, 0]) });
      c.agregar(new THREE.SphereGeometry(1.35, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), { color: '#5a4130', tipo: 4, matriz: matriz([0, H + 0.15, 0]) });

      // ---------- adentro ----------
      c.agregar(new THREE.CylinderGeometry(0.22, 0.26, H - 1.6, 8), { color: '#6b5238', tipo: 0, variar: 0.08, matriz: matriz([0, 1.0 + (H - 1.6) / 2, 0]) });
      // las dos muelas y su aro
      c.agregar(new THREE.CylinderGeometry(1.05, 1.05, 0.3, 16), { color: '#8a8378', tipo: 4, variar: 0.1, matriz: matriz([0, 3.35, 0]) });
      c.agregar(new THREE.CylinderGeometry(1.0, 1.0, 0.28, 16), { color: '#9a938a', tipo: 4, variar: 0.1, matriz: matriz([0, 3.65, 0]) });
      for (let i = 0; i < 12; i++) {
        const a2 = (i / 12) * Math.PI * 2;
        const [px, pz] = dir(a2, 1.2);
        c.agregar(new THREE.BoxGeometry(0.1, 0.55, 0.28), { color: MADERA, tipo: 0, matriz: matriz([px, 3.5, pz], [0, a2, 0]) });
      }
      // la tolva
      for (const l of [-1, 1]) {
        c.agregar(new THREE.BoxGeometry(0.06, 0.9, 0.85), { color: TABLA, tipo: 4, matriz: matriz([l * 0.42, 4.45, 0], [0, 0, l * 0.22]) });
        c.agregar(new THREE.BoxGeometry(0.85, 0.9, 0.06), { color: TABLA, tipo: 4, matriz: matriz([0, 4.45, l * 0.42], [l * 0.22, 0, 0]) });
      }
      c.agregar(new THREE.BoxGeometry(0.3, 0.6, 0.3), { color: MADERA, tipo: 4, matriz: matriz([0, 4.02, 0]) });
      // bolsas de harina
      for (let i = 0; i < 4; i++) {
        const [px, pz] = dir(Math.PI * 0.55 + (i % 2) * 0.28, 1.5 + Math.floor(i / 2) * 0.5);
        c.agregar(new THREE.CylinderGeometry(0.24, 0.28, 0.52, 8), { color: i % 2 ? '#cfc2a4' : '#d8cdb2', tipo: 4, variar: 0.1, matriz: matriz([px, 0.55, pz], [0.06, i, 0]) });
      }
      // la escalera: peldaños pegados a la pared, del hueco de la puerta al entrepiso
      const PASOS = 24;
      const escalon = (i) => {
        const t = (i + 0.5) / PASOS;
        // 3.0.1: arranca pasando la puerta. Salía de 0,82π y a la altura de la rodilla
        // cruzaba el vano (en π): los peldaños tapaban la entrada y el molino no se podía
        // entrar. Termina donde terminaba (2,07π: el hueco del entrepiso y el otro tramo).
        const a2 = Math.PI * 1.185 + t * Math.PI * 0.885;
        const y = 0.45 + t * 2.55;
        const [px, pz] = dir(a2, 1.75);
        return { x: px, z: pz, y, a: a2 };
      };
      for (let i = 0; i < PASOS; i += 3) {
        const e2 = escalon(i);
        cilindroEntre(c, [e2.x * 0.78, e2.y, e2.z * 0.78], [e2.x * 0.78, e2.y + 0.95, e2.z * 0.78], 0.045, MADERA_OSCURA);
      }
      // piso de la planta baja y entrepiso (con el hueco por donde sube la escalera)
      PM.pisoRedondo({ radio: 2.3, alto: 0.22, espesor: 0.14, color: TABLA, caras: 18 });
      // 3.0.1: el hueco de la escalera acompaña los últimos 1,7 m de subida (con ±0,55 rad la
      // cabeza chocaba la losa del entrepiso a 1,35 m y arriba no se llegaba)
      PM.pisoRedondo({ radio: 1.9, alto: 3.05, espesor: 0.12, color: TABLA, caras: 18, hueco: { centro: Math.PI * 0.82 + Math.PI * 1.25 - 0.95, medio: 1.05, desde: 0.55 } });
      for (let i = 0; i < PASOS; i++) {
        const e2 = escalon(i);
        PM.escalon({ lx: e2.x, lz: e2.z, largo: 1.15, ancho: 0.5, alto: e2.y, espesor: 0.1, color: i % 3 ? TABLA : '#7a5f43', giro: Math.PI / 2 - e2.a, sinTecho: true });
      }
      // Segundo tramo: del entrepiso al balcón. Se pega a la pared para liberar
      // la maquinaria central y termina exactamente en el hueco del piso alto.
      const PASOS_ALTOS = 19;
      const escalonesAltos = [];
      for (let i = 0; i < PASOS_ALTOS; i++) {
        const t = i / (PASOS_ALTOS - 1);
        const a2 = ANG_INICIO_ALTO + t * (ANG_SALIDA_BALCON - ANG_INICIO_ALTO);
        const y2 = 3.24 + t * 2.22;
        const [px, pz] = dir(a2, 1.72);
        // 3.0.1: `sinTecho`: el primero le hacía de techo al último del tramo de abajo
        PM.escalon({ lx: px, lz: pz, largo: 1.08, ancho: 0.50, alto: y2,
          espesor: 0.10, color: i % 3 ? TABLA : '#7a5f43', giro: Math.PI / 2 - a2, sinTecho: true });
        escalonesAltos.push({ x: px, z: pz, y: y2, a: a2 });
      }
      // Pasamanos helicoidal del segundo tramo: segmentos cortos evitan un tubo
      // que atraviese la torre en línea recta y hacen legible el recorrido.
      for (let i = 0; i < escalonesAltos.length - 1; i++) {
        const a = escalonesAltos[i], b = escalonesAltos[i + 1];
        cilindroEntre(c, [a.x * 1.12, a.y + 0.78, a.z * 1.12],
          [b.x * 1.12, b.y + 0.78, b.z * 1.12], 0.035, MADERA_OSCURA);
        if (i % 3 === 0) cilindroEntre(c, [a.x * 1.10, a.y, a.z * 1.10],
          [a.x * 1.10, a.y + 0.82, a.z * 1.10], 0.04, MADERA_OSCURA);
      }
      // Umbral exterior apoyado en el terreno real frente a la puerta.
      const [pasoMolX, pasoMolZ] = dir(Math.PI, 2.92);
      const sueloPasoMol = sueloLocal(sitio, rot, pasoMolX, pasoMolZ);
      const altoPasoMol = Math.max(sueloPasoMol + 0.065, 0.09);
      PM.escalon({ lx: pasoMolX, lz: pasoMolZ, largo: 1.55, ancho: 0.58,
        alto: altoPasoMol, espesor: Math.max(0.12, altoPasoMol - sueloPasoMol + 0.05),
        color: '#74695c', giro: 0 });

      const m = new THREE.Mesh(c.geometria(), mat);
      m.position.set(sitio.x, sitio.y, sitio.z);
      m.rotation.y = rot;
      m.castShadow = true; m.receiveShadow = true;
      grupo.add(m);

      // la rueda dentada, que gira con las aspas
      // 3.0.1: un poco más chica (1,08 m de radio con los dientes; era 1,6): con la otra
      // medida sus dientes atravesaban los últimos peldaños de la escalera de arriba
      const maq = new Constructor();
      for (let i = 0; i < 22; i++) {
        const a2 = (i / 22) * Math.PI * 2;
        const [px, pz] = dir(a2, 0.98);
        maq.agregar(new THREE.BoxGeometry(0.14, 0.34, 0.2), { color: MADERA, tipo: 0, variar: 0.1, matriz: matriz([px, 0, pz], [0, a2, 0]) });
      }
      maq.agregar(new THREE.CylinderGeometry(0.9, 0.9, 0.16, 20), { color: '#7a5f43', tipo: 0, variar: 0.06, matriz: matriz([0, 0, 0]) });
      for (let i = 0; i < 6; i++) {
        maq.agregar(new THREE.BoxGeometry(1.66, 0.1, 0.12), { color: MADERA_OSCURA, tipo: 0, matriz: matriz([0, -0.1, 0], [0, (i / 6) * Math.PI * 2, 0]) });
      }
      const rueda = new THREE.Mesh(maq.geometria(), mat);
      rueda.position.set(sitio.x, sitio.y + 5.45, sitio.z);
      grupo.add(rueda);

      // aspas
      const a = new Constructor();
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        const L2 = 4.6;
        a.agregar(new THREE.BoxGeometry(0.16, L2, 0.16), { color: '#6a4f36', tipo: 0, matriz: matriz([Math.sin(ang) * L2 / 2, Math.cos(ang) * L2 / 2, 0], [0, 0, -ang]) });
        for (let k = 1; k <= 6; k++) {
          const t = k / 7, d = L2 * t, ancho = 1.05 * (1 - t * 0.25);
          a.agregar(new THREE.BoxGeometry(ancho, 0.08, 0.08), { color: '#7a5f43', tipo: 0, matriz: matriz([Math.sin(ang) * d + Math.cos(ang) * ancho * 0.35, Math.cos(ang) * d - Math.sin(ang) * ancho * 0.35, 0], [0, 0, -ang]) });
        }
        a.agregar(new THREE.BoxGeometry(0.9, L2 * 0.75, 0.03), { color: '#d8cfbc', tipo: 4, matriz: matriz([Math.sin(ang) * L2 * 0.52 + Math.cos(ang) * 0.5, Math.cos(ang) * L2 * 0.52 - Math.sin(ang) * 0.5, 0.06], [0, 0, -ang]) });
      }
      a.agregar(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 8), { color: '#4a3524', tipo: 0, matriz: matriz([0, 0, 0.1], [Math.PI / 2, 0, 0]) });
      const aspas = new THREE.Mesh(a.geometria(), mat);
      aspas.castShadow = true;
      const eje = new THREE.Group();
      eje.position.set(sitio.x - Math.sin(rot) * 1.75, sitio.y + H - 0.3, sitio.z - Math.cos(rot) * 1.75);
      eje.rotation.y = rot;
      eje.add(aspas);
      grupo.add(eje);

      const luzMolino = new THREE.PointLight(0xdfe6ec, 0, 12, 1.4);
      luzMolino.position.set(sitio.x, sitio.y + 2.2, sitio.z);
      grupo.add(luzMolino);

      // ---------- colisiones: pared con su hueco, piso, escalera y entrepiso ----------
      // La maquinaria central no es decorado fantasma: el eje y las muelas
      // ocupan el mismo espacio que muestran visualmente, con altura acotada.
      col.agregar({ x: sitio.x, z: sitio.z, r: 0.28,
        alturaMin: sitio.y + 0.92, alturaMax: sitio.y + H - 0.42 });
      col.agregar({ x: sitio.x, z: sitio.z, r: 1.16,
        alturaMin: sitio.y + 3.12, alturaMax: sitio.y + 3.86 });
      const w = (lx, lz) => ({
        x: sitio.x + lx * Math.cos(rot) + lz * Math.sin(rot),
        z: sitio.z - lx * Math.sin(rot) + lz * Math.cos(rot),
      });
      const puertaMolino = w(...dir(Math.PI, 4.2));
      if (puertas) {
        const [dx2, dz2] = dir(Math.PI, 2.60);
        puertas.agregar({ sitio: { x: sitio.x, z: sitio.z, y: sitio.y, piso: 0.3 }, rot, lx: dx2, lz: dz2, ancho: 1.1, alto: 2.0, lado: 1, nombre: 'la puerta del molino' });
      }

      molino = { rueda, luzInterior: luzMolino, x: sitio.x, z: sitio.z, y: sitio.y, rot, aspas, nombre: 'Molino de Viento', puerta: puertaMolino, entrepiso: sitio.y + 3.12, radio: 7.5 };
      T.lugares.molino = molino;
      registrarHuella('molino', molino, molino.radio, 4);
      // 3.0.1: al costado del camino a la puerta (antes, en el eje: se atravesaba la tabla)
      const cc = w(2.6, 5.6);
      cartel('Molino de Viento', cc.x, cc.z, rot + Math.PI);
    }
  }

  // ---------------------------------------------------------------- casa de té
  let casaTe = null;
  // 3.6: donde la puso el sorteo (con la aldea ahí no queda nada, pero los que vienen después
  // se siguen alejando de ese lugar, como sin aldea)
  let casaTeSorteo = null;
  {
    const sorteado = buscarLlano({ bosqueMax: 0.25, alturaMin: 2, pendMax: 0.15, desnivel: 0.8, claro: 11, lejosDe: [L.refugio, L.cabana, L.puesto, molino], distancia: 70 })
      || buscarLlano({ bosqueMax: 0.4, pendMax: 0.25, desnivel: 1.5, claro: 8, lejosDe: [L.refugio], distancia: 40 });
    const aldeaTe = enAldea?.['casa-te'] || null;
    const sitio = aldeaTe ? { x: aldeaTe.x, z: aldeaTe.z, y: aldeaTe.y } : sorteado;
    if (sitio) {
      const p = haciaSendero(sitio.x, sitio.z);
      const rot = aldeaTe ? aldeaTe.rot : Math.atan2(p.x - sitio.x, p.z - sitio.z);
      const W = 6.4, D = 5.2, H = 2.7;
      const c = new Constructor();
      const PT = piezas(c, col, { x: sitio.x, z: sitio.z, y: sitio.y, rot }, matriz);
      marcoEstructural(c, { W, D, H, techo: H + 1.65, color: '#5b4633' });
      caja(c, [0, 0.22, 0], [W + 0.6, 0.32, D + 0.6], TABLA);
      pilotesAlTerreno(c, sitio, rot,
        [-W / 2, 0, W / 2].flatMap(px => [-D / 2, D / 2].map(pz => [px, pz])),
        0.2, 0.13, MADERA_OSCURA, 0.38);
      zocaloPiedra(c, W + 0.08, D + 0.08, 0.08, 0.76, sitio, rot, 0.38);
      faldaCimientoTerreno(c, { sitio, rotY: rot, W, D, yTope: 0.10, color: '#4a3b2c' });
      // paredes de tablas verticales, con ventanal al frente
      const radio = 0.16;
      for (let i = 0; i < 9; i++) {
        const yy = 0.5 + i * radio * 1.85;
        const color = i % 2 ? '#8a6b4a' : '#7a5f43';
        cilindroEntre(c, [-W / 2 - 0.3, yy, -D / 2], [W / 2 + 0.3, yy, -D / 2], radio, color);
        cilindroEntre(c, [W / 2, yy, -D / 2 - 0.3], [W / 2, yy, D / 2 + 0.3], radio, color);
        cilindroEntre(c, [-W / 2, yy, -D / 2 - 0.3], [-W / 2, yy, D / 2 + 0.3], radio, color);
        // Fachada de la Casa de Té: una puerta central verdadera y dos
        // ventanales laterales. Antes el vidrio estaba modelado, pero no había
        // ningún acceso transitable al interior.
        const izq = -W / 2 - 0.3, der = W / 2 + 0.3;
        const cortes = [[-0.58, 0.58]]; // puerta, desde el piso hasta el dintel
        if (yy > 1.02 && yy < 2.12) cortes.push([-2.08, -0.68], [0.68, 2.08]);
        if (yy > 2.18) {
          cilindroEntre(c, [izq, yy, D / 2], [der, yy, D / 2], radio, color);
        } else {
          let cursor = izq;
          for (const [a, b] of cortes.sort((u, v) => u[0] - v[0])) {
            if (a > cursor + 0.03) cilindroEntre(c, [cursor, yy, D / 2], [a, yy, D / 2], radio, color);
            cursor = Math.max(cursor, b);
          }
          if (cursor < der - 0.03) cilindroEntre(c, [cursor, yy, D / 2], [der, yy, D / 2], radio, color);
        }
      }
      for (const zz of [-D / 2, D / 2]) {
        const tri = new THREE.BufferGeometry();
        tri.setAttribute('position', new THREE.Float32BufferAttribute([-W / 2, 0, 0, W / 2, 0, 0, 0, 1.6, 0, W / 2, 0, 0, -W / 2, 0, 0, 0, 1.6, 0], 3));
        c.agregar(tri, { color: '#6a4f36', tipo: 0, matriz: matriz([0, H + 0.1, zz]) });
      }
      // Chimenea continua de la Casa de Té. La versión anterior medía 3,6 m
      // desde una altura fija: en el fallback de terreno podía flotar por abajo
      // y, peor, terminaba por debajo de la cumbrera del techo. Ahora nace en
      // la cota real del suelo y sobresale con margen sobre la cubierta.
      const CHIM_TE = { x: -W / 2 - 0.3, z: -1.2 };
      const chSueloTe = sueloLocal(sitio, rot, CHIM_TE.x, CHIM_TE.z);
      const chBaseTe = chSueloTe - 0.16;
      const chTopeTe = H + 1.6 + 0.72;
      caja(c, [CHIM_TE.x, (chBaseTe + chTopeTe) / 2, CHIM_TE.z],
        [0.65, chTopeTe - chBaseTe, 0.85], '#6b6660', 0, 4);
      caja(c, [CHIM_TE.x, chTopeTe + 0.04, CHIM_TE.z], [0.82, 0.10, 1.02], '#55504a', 0, 4);
      // galería con techito
      caja(c, [0, 0.16, D / 2 + 1.5], [W + 0.4, 0.16, 2.6], TABLA);
      // Cuatro postes flanquean el acceso; ninguno queda delante de la puerta.
      // El antiguo poste central partía la circulación de la galería en dos.
      const INCL_ALERO_TE = 0.12; // la cubierta cae hacia +Z, lejos de la fachada
      const zPosteTe = D / 2 + 2.6;
      const zCentroAleroTe = D / 2 + 1.5;
      const yPosteTe = 2.55 - (zPosteTe - zCentroAleroTe) * Math.sin(INCL_ALERO_TE)
        - 0.06 * Math.cos(INCL_ALERO_TE);
      for (const px of [-W / 2 + 0.2, -1.22, 1.22, W / 2 - 0.2]) {
        posteHastaTerreno(c, sitio, rot, px, zPosteTe, yPosteTe, 0.1, MADERA_OSCURA, 0.14, true);
      }
      pilotesAlTerreno(c, sitio, rot,
        [-W / 2 + 0.25, -1.1, 1.1, W / 2 - 0.25].map(px => [px, D / 2 + 2.35]),
        0.16, 0.10, MADERA_OSCURA, 0.24);
      // riostras triangulares: la galería no parece un tablero suspendido
      riostra(c, [-W / 2 + 0.2, 0.35, D / 2 + 2.55], [-W / 2 + 0.2, yPosteTe - 0.05, D / 2 + 2.55], 0.055);
      riostra(c, [W / 2 - 0.2, 0.35, D / 2 + 2.55], [W / 2 - 0.2, yPosteTe - 0.05, D / 2 + 2.55], 0.055);
      for (const sx of [-1, 1]) {
        riostra(c, [sx * (W / 2 - 0.2), 0.55, D / 2 + 0.8], [sx * (W / 2 - 0.2), yPosteTe - 0.08, D / 2 + 2.45], 0.045, '#6a4d34');
        // 3.0.1: la riostra cruza la punta de la galería a la altura del pecho: frena
        const A = aMundo(sitio, rot, sx * (W / 2 - 0.2), D / 2 + 0.8), B = aMundo(sitio, rot, sx * (W / 2 - 0.2), D / 2 + 2.45);
        col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.06, alturaMin: sitio.y + 0.5, alturaMax: sitio.y + yPosteTe });
      }
      // mesas y sillas en la galería
      for (const mx of [-1.9, 1.9]) {
        c.agregar(new THREE.CylinderGeometry(0.55, 0.55, 0.07, 12), { color: TABLA, tipo: 4, matriz: matriz([mx, 0.95, D / 2 + 1.4]) });
        cilindroEntre(c, [mx, 0.24, D / 2 + 1.4], [mx, 0.95, D / 2 + 1.4], 0.07, MADERA_OSCURA);
        { const q = aMundo(sitio, rot, mx, D / 2 + 1.4); col.agregar({ x: q.x, z: q.z, r: 0.5,
          alturaMin: sitio.y + 0.2, alturaMax: sitio.y + 1.05 }); }   // la mesa frena sólo donde existe
        for (const sz of [-0.85, 0.85]) {
          caja(c, [mx + sz * 0.6, 0.62, D / 2 + 1.4], [0.42, 0.07, 0.42], TABLA);
          for (const px of [-0.15, 0.15]) for (const pz of [-0.15, 0.15]) caja(c, [mx + sz * 0.6 + px, 0.42, D / 2 + 1.4 + pz], [0.05, 0.38, 0.05], MADERA_OSCURA);
        }
        // el juego de mate y la tetera sobre la mesa
        c.agregar(new THREE.SphereGeometry(0.1, 8, 6), { color: mx < 0 ? '#6b4a2c' : '#b9ae9a', tipo: 4, matriz: matriz([mx + 0.15, 1.05, D / 2 + 1.4]) });
        cilindroEntre(c, [mx + 0.15, 1.08, D / 2 + 1.4], [mx + 0.3, 1.32, D / 2 + 1.45], 0.018, '#9aa0a6');
      }
      techoDosAguasDetallado(c, {
        W, D, H, alzada: 1.6, vueloX: 0.55, vueloZ: 0.68,
        estilo: 'madera', colores: ['#4e4038', '#59483d', '#463a32', '#514238'],
        canaleta: true, colorEstructura: '#47382f', sitio, rotY: rot,
      });
      // tres tirantes visibles explican la cubierta desde la galería/interior
      for (const zt of [-D * 0.32, 0, D * 0.32]) {
        cilindroEntre(c, [-W / 2 + 0.18, H - 0.06, zt], [W / 2 - 0.18, H - 0.06, zt], 0.05, '#5b4633');
      }
      const grupoTe = new THREE.Group();
      grupoTe.position.set(sitio.x, sitio.y, sitio.z); grupoTe.rotation.y = rot;
      // La malla principal se materializa después de declarar el acceso físico.
      // Antes se cerraba acá y el peldaño añadido más abajo existía sólo para
      // la colisión: el jugador pisaba un escalón invisible.
      const t2 = new Constructor();
      caja(t2, [0, 0, 0], [W + 1.2, 0.12, 3.0], '#5a4a3e', 0, 4);
      const alero = new THREE.Mesh(t2.geometria(), mat);
      alero.position.set(0, 2.55, D / 2 + 1.5);
      alero.rotation.x = INCL_ALERO_TE;
      alero.castShadow = true;
      grupoTe.add(alero);
      const vidrio = materialVidrio(0x23201b);
      // Carpintería de la puerta central: el vano ya existía en geometría/física,
      // pero sin jambas ni dintel se leía como una rotura accidental de la pared.
      const marcoPuertaTe = new Constructor();
      caja(marcoPuertaTe, [0, 2.14, 0], [1.38, 0.14, 0.16], '#5f462d');
      for (const sx of [-1, 1]) caja(marcoPuertaTe, [sx * 0.64, 1.08, 0], [0.14, 2.12, 0.16], '#5f462d');
      const meshMarcoPuertaTe = new THREE.Mesh(marcoPuertaTe.geometria(), mat);
      meshMarcoPuertaTe.position.set(0, 0, D / 2 + 0.04);
      grupoTe.add(meshMarcoPuertaTe);
      for (const vx of [-1.36, 1.36]) {
        const marco = new Constructor();
        caja(marco, [0, 0, 0], [1.5, 0.1, 0.12], TABLA);
        caja(marco, [0, 1.0, 0], [1.5, 0.1, 0.12], TABLA);
        for (const mx of [-0.7, 0, 0.7]) caja(marco, [mx, 0.5, 0], [0.1, 1.0, 0.12], TABLA);
        const mm = new THREE.Mesh(marco.geometria(), mat);
        mm.position.set(vx, 1.05, D / 2 + 0.02);
        grupoTe.add(mm);
        const v = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.95), vidrio);
        v.position.set(vx, 1.55, D / 2 - 0.02);
        grupoTe.add(v);
      }
      const luz = new THREE.PointLight(0xffb070, 0, 16, 1.6);
      luz.position.set(0, 1.9, 0);
      const interior = new THREE.PointLight(0xd8e0e8, 0, 8, 1.4);
      interior.position.set(0, 1.6, 0);
      grupoTe.add(luz, interior);
      grupo.add(grupoTe);

      const w = (lx, lz) => aMundo(sitio, rot, lx, lz);
      // El frente combina una puerta central real y dos ventanales. La física
      // deja únicamente el vano de la puerta; los cristales siguen siendo pared sólida.
      const PARED_TE = { desde: 0.28, hasta: H + 0.15, espesor: 0.28, dibujar: false };
      PT.paredRecta({ ...PARED_TE, a: [-W / 2, -D / 2], b: [W / 2, -D / 2] });
      PT.paredRecta({ ...PARED_TE, a: [-W / 2, -D / 2], b: [-W / 2, D / 2] });
      PT.paredRecta({ ...PARED_TE, a: [W / 2, -D / 2], b: [W / 2, D / 2] });
      PT.paredRecta({ ...PARED_TE, a: [-W / 2, D / 2], b: [W / 2, D / 2],
        huecos: [{ desde: W / 2 - 0.58, hasta: W / 2 + 0.58 }] });
      PT.mueble({ lx: CHIM_TE.x, ly: (chBaseTe + chTopeTe) / 2, lz: CHIM_TE.z,
        largo: 0.67, alto: chTopeTe - chBaseTe, ancho: 0.87, color: '#6b6660', dibujar: false });
      col.agregarPlataforma({ x: sitio.x, z: sitio.z, ang: -rot, largo: W + 0.6, ancho: D + 0.6, alto: sitio.y + 0.38, espesor: 0.32 });
      const gal = w(0, D / 2 + 1.5);
      col.agregarPlataforma({ x: gal.x, z: gal.z, ang: -rot, largo: W + 0.4, ancho: 2.6, alto: sitio.y + 0.24, espesor: 0.16 });
      // Acceso terminado: puerta central y un peldaño que apoya en el terreno.
      if (puertas) puertas.agregar({ sitio: { x: sitio.x, z: sitio.z, y: sitio.y, piso: 0.30 }, rot,
        lx: 0, lz: D / 2 + 0.04, ancho: 1.08, alto: 2.02, lado: -1, nombre: 'la puerta de la casa de té' });
      const lzAccesoTe = D / 2 + 3.0;
      const sueloAccesoTe = sueloLocal(sitio, rot, 0, lzAccesoTe);
      const altoPasoTe = Math.max(0.08, sueloAccesoTe + 0.055);
      PT.escalon({ lx: 0, lz: lzAccesoTe, largo: 1.8, ancho: 0.64,
        alto: altoPasoTe, espesor: Math.max(0.11, altoPasoTe - sueloAccesoTe + 0.045), color: TABLA });
      const malla = new THREE.Mesh(c.geometria(), mat);
      malla.castShadow = true; malla.receiveShadow = true;
      grupoTe.add(malla);
      for (const mx of [-1.9, 1.9]) {
        // Una de las sillas reales de cada mesa. Antes la expresión terminaba
        // multiplicada por cero y el punto de sentarse quedaba dentro de la mesa.
        const sillaX = mx + (mx < 0 ? -0.51 : 0.51);
        const silla = w(sillaX, D / 2 + 1.4);
        sentaderos.push({ x: silla.x, z: silla.z, y: sitio.y + 0.66, nombre: 'una silla de la casa de té', mira: mx < 0 ? rot + Math.PI / 2 : rot - Math.PI / 2 });
      }
      const ch = w(CHIM_TE.x, CHIM_TE.z);
      const mostrador = w(0, D / 2 + 1.5);
      const puertaTe = w(0, D / 2 + 3.1);
      casaTe = { x: sitio.x, z: sitio.z, y: sitio.y, rot, nombre: 'Casa de Té', chimenea: { x: ch.x, y: sitio.y + chTopeTe + 0.09, z: ch.z }, vidrio, luz, interior, mostrador, puerta: puertaTe,
        radio: Math.max(W / 2 + 1.4, D / 2 + 3.5) };
      T.lugares['casa-te'] = casaTe;
      // 3.6: en la aldea, la huella queda donde la dejaba el sorteo
      casaTeSorteo = aldeaTe ? (sorteado ? { x: sorteado.x, z: sorteado.z } : null) : casaTe;
      if (casaTeSorteo) registrarHuella('casa-te', casaTeSorteo, casaTe.radio, 4);
      cabañas.push(casaTe);
      const cc = w(-3.4, D / 2 + 4.4);
      cartel('Casa de Té', cc.x, cc.z, rot);
    }
  }

  // ---------------------------------------------------------------- torre de guardaparques
  let torre = null;
  {
    // hace falta un claro grande: la escalera se aleja varios metros de la torre
    const sitio = buscarLlano({ bosqueMax: 0.3, alturaMin: 26, pendMax: 0.15, desnivel: 0.8, claro: 13, lejosDe: [L.puesto, L.mirador, molino, casaTeSorteo], distancia: 60 })
      || buscarLlano({ bosqueMax: 0.45, alturaMin: 18, pendMax: 0.22, desnivel: 1.4, claro: 11, lejosDe: [L.puesto], distancia: 30 })
      || buscarLlano({ bosqueMax: 0.6, alturaMin: 10, pendMax: 0.3, desnivel: 2, claro: 9, lejosDe: [], distancia: 0 });
    if (sitio) {
      const rot = Math.atan2(LAGO.x - sitio.x, LAGO.z - sitio.z);
      const H = 6.8, R = 1.9;
      const c = new Constructor();
      // cuatro patas con travesaños
      const pata = (sx, sz) => [sx * (R + 0.55), sz * (R + 0.55)];
      const arriba = (sx, sz) => [sx * R, sz * R];
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const [bx, bz] = pata(sx, sz), [tx, tz] = arriba(sx, sz);
        const q = aMundo(sitio, rot, bx, bz);
        const suelo = T.altura(q.x, q.z) - sitio.y - 0.12;
        cilindroEntre(c, [bx, suelo, bz], [tx, H, tz], 0.13, MADERA_OSCURA);
        c.agregar(new THREE.IcosahedronGeometry(0.32, 0), { color: '#77736b', tipo: 4, variar: 0.14,
          matriz: matriz([bx, suelo + 0.12, bz], [0.1, sx * sz, 0.1], [1.2, 0.6, 1]) });
      }
      for (const y of [1.6, 3.4, 5.2]) {
        const k = 1 - y / (H + 2.2);
        const rr = (R + 0.55) * k + R * (1 - k);
        for (let i = 0; i < 4; i++) {
          const a1 = [[-1, -1], [1, -1], [1, 1], [-1, 1]][i], a2 = [[1, -1], [1, 1], [-1, 1], [-1, -1]][i];
          cilindroEntre(c, [a1[0] * rr, y, a1[1] * rr], [a2[0] * rr, y, a2[1] * rr], 0.07, MADERA);
        }
      }
      // cruces diagonales en las cuatro caras: la torre gana rigidez y deja
      // de parecer cuatro postes unidos solo por aros horizontales.
      const caras = [
        [[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]],
      ];
      const niveles = [0.35, 2.45, 4.55, 6.45];
      for (const [a, b] of caras) for (let ni = 0; ni < niveles.length - 1; ni++) {
        const y0 = niveles[ni], y1 = niveles[ni + 1];
        const t0 = y0 / H, t1 = y1 / H;
        const rr0 = (R + 0.55) * (1 - t0) + R * t0;
        const rr1 = (R + 0.55) * (1 - t1) + R * t1;
        cilindroEntre(c, [a[0] * rr0, y0, a[1] * rr0], [b[0] * rr1, y1, b[1] * rr1], 0.045, '#5e4632');
        cilindroEntre(c, [b[0] * rr0, y0, b[1] * rr0], [a[0] * rr1, y1, a[1] * rr1], 0.045, '#5e4632');
      }
      // piso de la cabina y baranda
      caja(c, [0, H + 0.08, 0], [R * 2 + 0.9, 0.16, R * 2 + 0.9], TABLA);
      for (let i = 0; i < 4; i++) {
        const a1 = [[-1, -1], [1, -1], [1, 1], [-1, 1]][i], a2 = [[1, -1], [1, 1], [-1, 1], [-1, -1]][i];
        const p1 = [a1[0] * (R + 0.4), a1[1] * (R + 0.4)], p2 = [a2[0] * (R + 0.4), a2[1] * (R + 0.4)];
        // tres de los cuatro lados llevan baranda; el cuarto es la entrada
        cilindroEntre(c, [p1[0], H + 0.16, p1[1]], [p1[0], H + 3.05, p1[1]], 0.07, MADERA_OSCURA);
        if (i !== 0) {
          cilindroEntre(c, [p1[0], H + 1.0, p1[1]], [p2[0], H + 1.0, p2[1]], 0.05, MADERA);
          cilindroEntre(c, [p1[0], H + 1.75, p1[1]], [p2[0], H + 1.75, p2[1]], 0.06, MADERA_OSCURA);
          caja(c, [(p1[0] + p2[0]) / 2, H + 0.55, (p1[1] + p2[1]) / 2], [Math.abs(p2[0] - p1[0]) || 0.12, 0.8, Math.abs(p2[1] - p1[1]) || 0.12], '#7a5f43');
        }
      }
      // techo a cuatro aguas
      caja(c, [0, H + 3.2, 0], [R * 2 + 1.3, 0.14, R * 2 + 1.3], '#4e4038', 0, 4);
      c.agregar(new THREE.ConeGeometry(R + 0.9, 1.0, 4), { color: '#463f38', tipo: 4, matriz: matriz([0, H + 3.75, 0], [0, Math.PI / 4, 0]) });
      const m = new THREE.Mesh(c.geometria(), mat);
      m.position.set(sitio.x, sitio.y, sitio.z);
      m.rotation.y = rot;
      m.castShadow = true; m.receiveShadow = true;
      grupo.add(m);

      // escalera: dos tramos de escalones que se pueden subir
      const pasos = [];
      const escalon = new Constructor();
      const nPasos = Math.round(H / 0.38);
      for (let i = 0; i < nPasos; i++) {
        const tramo = i < nPasos / 2 ? 0 : 1;
        const avance = tramo === 0 ? -2.6 - i * 0.5 : -2.6 - (nPasos - 1 - i) * 0.5;
        const lado = tramo === 0 ? -1 : 1;
        const lx = lado * 1.5, lz = avance;
        // Los primeros peldaños no pueden quedar dentro del cerro ni suspendidos:
        // se elevan lo mínimo necesario sobre el terreno que tienen debajo.
        // 3.0.1: si el terreno queda bajo, el primero baja con él (desde el suelo quedaban
        // 63 cm y no se subía); el segundo sigue a 0,76 y la contrahuella no pasa de 0,6
        const sueloPeldano = sueloLocal(sitio, rot, lx, lz);
        const y = i === 0 ? Math.max(Math.min(0.38, sueloPeldano + 0.36), sueloPeldano + 0.14)
          : Math.max(0.38 * (i + 1), sueloPeldano + 0.14);
        caja(escalon, [lx, y, lz], [1.4, 0.14, 0.6], i % 2 ? TABLA : '#7a5f43');
        cilindroEntre(escalon, [lx + lado * 0.6, y, lz], [lx + lado * 0.6, y + 1.0, lz], 0.05, MADERA_OSCURA);
        pasos.push({ lx, lz, y });
      }
      // descanso entre tramos y unión con el piso de arriba
      caja(escalon, [0, 0.38 * Math.floor(nPasos / 2), -2.6 - Math.floor(nPasos / 2) * 0.5], [3.8, 0.16, 1.4], TABLA);
      caja(escalon, [0, H + 0.08, -1.9], [2.2, 0.16, 2.2], TABLA);
      const mitadPasos = Math.floor(nPasos / 2);
      const zDescanso = -2.6 - mitadPasos * 0.5;
      const yDescanso = 0.38 * mitadPasos;
      // El descanso alto ya no queda suspendido: cuatro pies bajan hasta el
      // terreno real y dos stringers explican cada tramo de escalera.
      pilotesAlTerreno(escalon, sitio, rot,
        [[-1.55, zDescanso - 0.45], [-1.55, zDescanso + 0.45], [1.55, zDescanso - 0.45], [1.55, zDescanso + 0.45]],
        yDescanso - 0.08, 0.085, MADERA_OSCURA, yDescanso + 0.08);
      const vuelo1 = pasos.filter((_, i) => i < nPasos / 2);
      const vuelo2 = pasos.filter((_, i) => i >= nPasos / 2);
      const stringers = (vuelo) => {
        if (vuelo.length < 2) return;
        const a = vuelo[0], b = vuelo[vuelo.length - 1];
        for (const dx of [-0.5, 0.5]) cilindroEntre(escalon,
          [a.lx + dx, a.y - 0.16, a.lz], [b.lx + dx, b.y - 0.16, b.lz], 0.055, MADERA_OSCURA);
        for (const ladoR of [-0.62, 0.62]) cilindroEntre(escalon,
          [a.lx + ladoR, a.y + 0.95, a.lz], [b.lx + ladoR, b.y + 0.95, b.lz], 0.045, MADERA);
      };
      stringers(vuelo1); stringers(vuelo2);
      // El descanso necesita una baranda propia: antes era una plataforma alta
      // con el borde posterior completamente abierto.
      for (const px of [-1.85, 0, 1.85]) cilindroEntre(escalon,
        [px, yDescanso, zDescanso - 0.63], [px, yDescanso + 1.02, zDescanso - 0.63], 0.05, MADERA_OSCURA);
      cilindroEntre(escalon, [-1.85, yDescanso + 0.98, zDescanso - 0.63],
        [1.85, yDescanso + 0.98, zDescanso - 0.63], 0.055, MADERA);
      const esc = new THREE.Mesh(escalon.geometria(), mat);
      esc.position.set(sitio.x, sitio.y, sitio.z);
      esc.rotation.y = rot;
      esc.castShadow = true; esc.receiveShadow = true;
      grupo.add(esc);

      const w = (lx, lz) => aMundo(sitio, rot, lx, lz);
      for (const p of pasos) {
        const q = w(p.lx, p.lz);
        // 3.0.1: `sinTecho`: los peldaños se solapan 12 cm y cada uno le hacía de techo al
        // de abajo (espacioVerticalLibre): la torre nunca se pudo subir caminando.
        col.agregarPlataforma({ x: q.x, z: q.z, ang: -rot, largo: 1.4, ancho: 0.62, alto: sitio.y + p.y + 0.07, espesor: 0.14, sinTecho: true });
      }
      // Los pasamanos de ambos tramos son barreras reales, no tubos atravesables.
      for (const vuelo of [vuelo1, vuelo2]) {
        if (vuelo.length < 2) continue;
        const a = vuelo[0], b = vuelo[vuelo.length - 1];
        for (const ladoR of [-0.62, 0.62]) {
          const A = w(a.lx + ladoR, a.lz), B = w(b.lx + ladoR, b.lz);
          col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.07,
            alturaMin: sitio.y + Math.min(a.y, b.y) - 0.12,
            alturaMax: sitio.y + Math.max(a.y, b.y) + 1.25 });
        }
      }
      // 3.0.1: los pies del descanso y las cruces de tres caras (la cuarta es la de la
      // escalera) se veían y se atravesaban
      for (const [px, pz] of [[-1.55, zDescanso - 0.45], [-1.55, zDescanso + 0.45], [1.55, zDescanso - 0.45], [1.55, zDescanso + 0.45]]) {
        const q = w(px, pz);
        const sp = sueloLocal(sitio, rot, px, pz);
        col.agregar({ x: q.x, z: q.z, r: 0.1, alturaMin: sitio.y + sp - 0.2, alturaMax: sitio.y + Math.min(yDescanso - 0.3, sp + 1.8) });
      }
      for (const [[ax, az], [bx, bz]] of [[[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
        const rr = R + 0.45, A = w(ax * rr, az * rr), B = w(bx * rr, bz * rr);
        col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.07, alturaMin: sitio.y - 0.4, alturaMax: sitio.y + 2.45 });
      }
      const desc = w(0, -2.6 - Math.floor(nPasos / 2) * 0.5);
      col.agregarPlataforma({ x: desc.x, z: desc.z, ang: -rot, largo: 3.8, ancho: 1.4, alto: sitio.y + yDescanso + 0.08, espesor: 0.16 });
      {
        const A = w(-1.85, zDescanso - 0.63), B = w(1.85, zDescanso - 0.63);
        col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.075,
          alturaMin: sitio.y + yDescanso - 0.05, alturaMax: sitio.y + yDescanso + 1.15 });
      }
      const arribaPos = w(0, 0);
      col.agregarPlataforma({ x: arribaPos.x, z: arribaPos.z, ang: -rot, largo: R * 2 + 0.9, ancho: R * 2 + 0.9, alto: sitio.y + H + 0.16, espesor: 0.16 });
      const puenteArr = w(0, -1.9);
      col.agregarPlataforma({ x: puenteArr.x, z: puenteArr.z, ang: -rot, largo: 2.2, ancho: 2.2, alto: sitio.y + H + 0.16, espesor: 0.16 });
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const q = w(sx * (R + 0.55), sz * (R + 0.55));
        col.agregar({ x: q.x, z: q.z, r: 0.22, alturaMin: sitio.y - 0.35, alturaMax: sitio.y + H + 0.12 });
      }
      // La baranda de la torre también existe en física; antes era solo visual.
      const railMin = sitio.y + H + 0.15, railMax = sitio.y + H + 1.9, rr = R + 0.4;
      const ladosTorre = [
        // El lado z=-rr queda abierto: es la llegada de la escalera.
        [[rr, -rr], [rr, rr]], [[rr, rr], [-rr, rr]], [[-rr, rr], [-rr, -rr]],
      ];
      for (const [[ax, az], [bx, bz]] of ladosTorre) {
        const A = w(ax, az), B = w(bx, bz);
        col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.10, alturaMin: railMin, alturaMax: railMax });
      }
      const mirador = w(0, R * 0.5);
      sentaderos.push({ x: mirador.x, z: mirador.z, y: sitio.y + H + 0.2, nombre: 'el piso de la torre', mira: rot });
      torre = { x: sitio.x, z: sitio.z, y: sitio.y, rot, alto: H, nombre: 'Torre de Guardaparques', radio: 10 };
      T.lugares.torre = torre;
      registrarHuella('torre', torre, torre.radio, 5);
      const tc = w(2.6, -5.2);
      cartel('Torre de Guardaparques', tc.x, tc.z, rot + Math.PI);
    }
  }

  // ---------------------------------------------------------------- cueva con pinturas
  let cueva = null;
  {
    // hace falta una ladera empinada y alta, lejos de todo
    let sitio = null, mejor = 0;
    for (let i = 0; i < 6000; i++) {
      const x = (r() * 2 - 1) * 400, z = (r() * 2 - 1) * 400;
      const k = T.indice(x, z);
      const y = TS.altura(x, z);
      if (y < 20 || TS.agua(x, z) || TS.pendiente[k] < 0.55) continue;
      if (T.distRio[k] < 30) continue;                     // lejos del arroyo
      if (T.puentesRiel.some((b2) => Math.hypot(b2.x - x, b2.z - z) < 45)) continue;
      if (invadeHuella(x, z, 9, 8)) continue;
      if (T.distRiel[k] < 25) continue;
      const puntaje = TS.pendiente[k] * 30 + y * 0.2;
      if (puntaje > mejor) { mejor = puntaje; sitio = { x, z, y }; }
    }
    if (sitio) {
      // mira hacia donde baja la ladera
      const n = T.normal(sitio.x, sitio.z);
      const rot = Math.atan2(n.x, n.z);
      const c = new Constructor();
      const ANCHO = 7, ALTO = 3.2, FONDO = 4.6;
      // 3.0.1: la cueva está en una ladera empinada y su piso plano quedaba bajo el cerro:
      // el pasto llenaba el abrigo y tapaba la mitad de abajo de las pinturas (y los
      // guanacos). Se levanta sobre una cornisa de roca hasta que el piso (0,34 m) quede
      // por encima del terreno de adentro; al frente, una escalera de piedra baja de costado.
      {
        let alto = -Infinity;
        for (let lx = -ANCHO / 2 + 0.2; lx <= ANCHO / 2 - 0.2 + 1e-6; lx += (ANCHO - 0.4) / 10)
          for (let lz = -FONDO + 1.05; lz <= 0.3 + 1e-6; lz += (FONDO - 0.75) / 8) {
            const q = aMundo(sitio, rot, lx, lz);
            alto = Math.max(alto, T.altura(q.x, q.z));
          }
        sitio.y = Math.max(sitio.y, alto - 0.29);
      }
      // el alero de roca y las paredes del abrigo
      c.agregar(new THREE.BoxGeometry(ANCHO + 3.4, 2.2, FONDO + 2.2), { color: '#6f6862', tipo: 4, variar: 0.16, matriz: matriz([0, ALTO + 0.9, -FONDO / 2 + 0.4], [0.06, 0, 0]) });
      for (const l of [-1, 1]) {
        // los muros bajan varios metros para que no queden colgados en la ladera
        c.agregar(new THREE.BoxGeometry(3.2, ALTO + 8, FONDO + 2), { color: '#6b645e', tipo: 4, variar: 0.18, matriz: matriz([l * (ANCHO / 2 + 1.5), ALTO / 2 - 4, -FONDO / 2 + 0.3], [0, l * 0.06, 0]) });
      }
      c.agregar(new THREE.BoxGeometry(ANCHO + 6, ALTO + 9, 3.4), { color: '#67605a', tipo: 4, variar: 0.18, matriz: matriz([0, ALTO / 2 - 3.6, -FONDO - 1.2]) });
      // el umbral, para no ver el hueco. 3.0.1: baja hasta el terreno de adelante
      const sueloUmbral = Math.min(sueloLocal(sitio, rot, -ANCHO / 2, 1.4), sueloLocal(sitio, rot, 0, 1.4), sueloLocal(sitio, rot, ANCHO / 2, 1.4));
      const bajoUmbral = Math.max(3.2, 0.1 - sueloUmbral + 0.4);
      c.agregar(new THREE.BoxGeometry(ANCHO + 1.4, bajoUmbral, 1.2), { color: '#6b645e', tipo: 4, variar: 0.16, matriz: matriz([0, 0.1 - bajoUmbral / 2, 0.8]) });
      // piso de arena y algunas piedras sueltas
      c.agregar(new THREE.BoxGeometry(ANCHO + 1, 0.4, FONDO + 0.6), { color: '#9a8d78', tipo: 4, variar: 0.1, matriz: matriz([0, 0.14, -FONDO / 2]) });
      // 3.0.1: las piedras sueltas y el fogón viejo, apoyados sobre el piso (su cara de
      // arriba está a 0,34 m: el fogón quedaba enterrado adentro de la losa)
      for (let i = 0; i < 9; i++) {
        c.agregar(new THREE.IcosahedronGeometry(0.2 + r() * 0.3, 0), { color: '#7d766c', tipo: 4, variar: 0.2, matriz: matriz([(r() - 0.5) * ANCHO, 0.36, -r() * FONDO], [r(), r() * 6, r()]) });
      }
      // un fogón viejo, de los que dejaron
      c.agregar(new THREE.CylinderGeometry(0.55, 0.6, 0.12, 10), { color: '#4a443c', tipo: 4, matriz: matriz([1.6, 0.36, -2.2]) });
      for (let i = 0; i < 7; i++) {
        const a2 = (i / 7) * Math.PI * 2;
        c.agregar(new THREE.IcosahedronGeometry(0.18, 0), { color: '#6f6862', tipo: 4, variar: 0.2, matriz: matriz([1.6 + Math.cos(a2) * 0.6, 0.4, -2.2 + Math.sin(a2) * 0.6], [r(), r() * 6, 0]) });
      }
      // 3.0.1: la escalera de piedra que baja de la cornisa, de costado contra la roca
      const pasosCueva = [];
      {
        let tope = 0.1;
        for (let k = 0; k < 16; k++) {
          const lx = -0.2 + k * 0.42, lz = 1.86;
          const suelo = Math.min(sueloLocal(sitio, rot, lx, lz - 0.45), sueloLocal(sitio, rot, lx, lz + 0.45));
          tope = Math.max(suelo + 0.08, tope - 0.24);
          const alto = tope - suelo + 0.15;
          c.agregar(new THREE.BoxGeometry(0.46, alto, 0.92), { color: k % 2 ? '#6f6862' : '#655f58', tipo: 4, variar: 0.14,
            matriz: matriz([lx, tope - alto / 2, lz]) });
          pasosCueva.push({ lx, lz, tope, alto });
          if (tope - suelo < 0.1) break;
        }
      }
      const grupoCueva = new THREE.Group();
      grupoCueva.position.set(sitio.x, sitio.y, sitio.z);
      grupoCueva.rotation.y = rot;
      const malla = new THREE.Mesh(c.geometria(), mat);
      malla.castShadow = true; malla.receiveShadow = true;
      grupoCueva.add(malla);

      // la pared pintada: manos en negativo y guanacos, dibujados por código
      const lienzo = document.createElement('canvas');
      lienzo.width = 1024; lienzo.height = 512;
      const x2 = lienzo.getContext('2d');
      x2.fillStyle = '#8a7f70'; x2.fillRect(0, 0, 1024, 512);
      for (let i = 0; i < 2600; i++) {
        x2.fillStyle = `rgba(${90 + Math.random() * 70 | 0},${80 + Math.random() * 60 | 0},${70 + Math.random() * 50 | 0},0.5)`;
        x2.fillRect(Math.random() * 1024, Math.random() * 512, 5 + Math.random() * 14, 4 + Math.random() * 10);
      }
      const mano = (cx, cy, esc, color) => {
        // la silueta se pinta soplando pigmento alrededor: queda el negativo
        x2.save(); x2.translate(cx, cy); x2.scale(esc, esc);
        for (let i = 0; i < 1100; i++) {
          // el pigmento cubre toda la zona; la mano apoyada deja el hueco
          const a2 = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * 52;
          const px = Math.cos(a2) * rr * 0.95, py = Math.sin(a2) * rr * 1.25 - 4;
          x2.fillStyle = color.replace('ALFA', (0.06 + Math.random() * 0.2).toFixed(2));
          x2.beginPath(); x2.arc(px, py, 2 + Math.random() * 6, 0, Math.PI * 2); x2.fill();
        }
        // la mano queda en el color de la roca: es el negativo
        x2.fillStyle = '#8a7f70';
        x2.beginPath(); x2.ellipse(0, 16, 22, 26, 0, 0, Math.PI * 2); x2.fill();
        x2.fillRect(-9, 16, 18, 26);                                   // muñeca
        for (let k = 0; k < 5; k++) {
          const a2 = -Math.PI / 2 + (k - 2) * 0.46;
          const largo = k === 2 ? 42 : k === 1 || k === 3 ? 38 : 28;
          x2.save(); x2.translate(0, 8); x2.rotate(a2 + Math.PI / 2);
          x2.beginPath(); x2.roundRect(-6, -largo, 12, largo, 6); x2.fill();
          x2.restore();
        }
        x2.restore();
      };
      const guanaco = (cx, cy, esc) => {
        x2.save(); x2.translate(cx, cy); x2.scale(esc, esc);
        x2.fillStyle = 'rgba(70,40,34,0.85)';
        x2.beginPath(); x2.ellipse(0, 0, 34, 17, 0, 0, Math.PI * 2); x2.fill();
        x2.fillRect(24, -40, 8, 30);                       // cuello
        x2.beginPath(); x2.ellipse(30, -44, 11, 7, 0.4, 0, Math.PI * 2); x2.fill();   // cabeza
        x2.fillRect(28, -56, 3, 12); x2.fillRect(34, -55, 3, 11);                      // orejas
        for (const px of [-22, -12, 14, 24]) x2.fillRect(px, 10, 6, 34);               // patas
        x2.restore();
      };
      const colores = ['rgba(150,58,42,ALFA)', 'rgba(56,44,40,ALFA)', 'rgba(188,142,66,ALFA)'];
      for (let i = 0; i < 16; i++) {
        mano(90 + (i % 8) * 118 + (Math.random() - 0.5) * 30, 150 + Math.floor(i / 8) * 190 + (Math.random() - 0.5) * 40,
          0.75 + Math.random() * 0.5, colores[i % 3]);
      }
      for (let i = 0; i < 5; i++) guanaco(180 + i * 190 + (Math.random() - 0.5) * 40, 430 + (Math.random() - 0.5) * 30, 0.7 + Math.random() * 0.3);
      const tex = new THREE.CanvasTexture(lienzo);
      const pared = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO + 1.4, ALTO - 0.1), new THREE.MeshLambertMaterial({ map: tex }));
      pared.position.set(0, (ALTO - 0.1) / 2 + 0.16, -FONDO + 1.05);
      grupoCueva.add(pared);
      const luz = new THREE.PointLight(0xffe0b8, 0, 16, 1.2);
      luz.position.set(0, 2.1, -FONDO * 0.35);
      grupoCueva.add(luz);
      grupo.add(grupoCueva);

      const w = (lx, lz) => aMundo(sitio, rot, lx, lz);
      const linea = (a2, b2) => { const A = w(...a2), B = w(...b2); col.agregar({ seg: true,
        ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.3,
        alturaMin: sitio.y - 6.0, alturaMax: sitio.y + ALTO + 2.3 }); };
      // 3.0.1: las paredes frenan en la cara de la roca (antes, 20 cm antes) y hasta el
      // frente del muro; el fondo frena en la pared pintada (se caminaba detrás de ella)
      linea([-ANCHO / 2 - 0.2, 1.0], [-ANCHO / 2 - 0.2, -FONDO + 1.05 - 0.3]);
      linea([ANCHO / 2 + 0.2, 1.0], [ANCHO / 2 + 0.2, -FONDO + 1.05 - 0.3]);
      linea([-ANCHO / 2 - 0.2, -FONDO + 1.05 - 0.3], [ANCHO / 2 + 0.2, -FONDO + 1.05 - 0.3]);
      // 3.0.1: la plataforma a la altura de la losa que se ve (0,34 m; estaba en 0,17) y de
      // su mismo largo: terminaba 30 cm antes y entre el piso y la cornisa había un hueco
      const pisoCueva = w(0, -FONDO / 2);
      col.agregarPlataforma({ x: pisoCueva.x, z: pisoCueva.z, ang: -rot, largo: ANCHO + 1, ancho: FONDO + 0.6, alto: sitio.y + 0.34, espesor: 0.40 });
      // la cornisa (el umbral) se pisa y, de frente, es una pared de roca
      const umbralPos = w(0, 0.8);
      col.agregarPlataforma({ x: umbralPos.x, z: umbralPos.z, ang: -rot, largo: ANCHO + 1.4, ancho: 1.2, alto: sitio.y + 0.1, espesor: bajoUmbral });
      for (const p of pasosCueva) {
        const q = w(p.lx, p.lz);
        col.agregarPlataforma({ x: q.x, z: q.z, ang: -rot, largo: 0.46, ancho: 0.92, alto: sitio.y + p.tope, espesor: p.alto });
      }
      const frente = w(0, 1.2);
      cueva = { x: sitio.x, y: sitio.y, z: sitio.z, rot, nombre: 'Cueva de las Manos', luz, pared: w(0, -FONDO + 0.6), puerta: frente, radio: 9 };
      T.lugares.cueva = cueva;
      registrarHuella('cueva', cueva, 9, 5);
      const cc = w(-3.2, 3.6);
      cartel('Cueva de las Manos', cc.x, cc.z, rot + Math.PI);
    }
  }

  // ---------------------------------------------------------------- almacén de ramos generales
  let almacen = null;
  let almacenSorteo = null;   // 3.6: como `casaTeSorteo`
  {
    const sorteado = buscarLlano({ bosqueMax: 0.2, alturaMin: 2, pendMax: 0.14, desnivel: 0.7, claro: 12, lejosDe: [L.refugio, casaTeSorteo, molino, L.cabana, L.puesto], distancia: 60 })
      || buscarLlano({ bosqueMax: 0.35, pendMax: 0.22, desnivel: 1.3, claro: 9, lejosDe: [L.refugio], distancia: 35 });
    const aldeaAlm = enAldea?.almacen || null;
    const sitio = aldeaAlm ? { x: aldeaAlm.x, z: aldeaAlm.z, y: aldeaAlm.y } : sorteado;
    if (sitio) {
      const p = haciaSendero(sitio.x, sitio.z);
      // La fachada comercial está construida sobre -Z local. Giramos 180°
      // para que puerta, vidrieras, cartel y vereda miren realmente al sendero.
      // (3.6: en la aldea, de cara a la calle Norte: el giro de `sitioEstructura` ya lo trae)
      const rot = aldeaAlm ? aldeaAlm.rot : Math.atan2(p.x - sitio.x, p.z - sitio.z) + Math.PI;
      const W = 7.5, D = 5.5, H = 2.9;
      // 3.0.1: del lado alto el terreno tapaba 34 cm de la vereda y asomaba entre los
      // tablones del salón: el piso (0,45 m) y la vereda (0,5 m) quedan por encima
      for (let lx = -W / 2 - 0.3; lx <= W / 2 + 0.3 + 1e-6; lx += (W + 0.6) / 8)
        for (let lz = -D / 2 - 2.4; lz <= D / 2 + 0.25 + 1e-6; lz += (D + 2.65) / 8) {
          const q = aMundo(sitio, rot, lx, lz);
          sitio.y = Math.max(sitio.y, T.altura(q.x, q.z) - (lz < -D / 2 - 0.25 ? 0.44 : 0.40));
        }
      const c = new Constructor();
      const PA = piezas(c, col, { x: sitio.x, z: sitio.z, y: sitio.y, rot }, matriz);
      marcoEstructural(c, { W, D, H, techo: H + 1.30, color: '#4b3b31' });
      // Zócalo adaptado al terreno: ya no hay un bloque pétreo de más de tres
      // metros enterrado bajo el local que pueda asomar en la pendiente.
      faldaCimientoTerreno(c, { sitio, rotY: rot, W: W + 0.18, D: D + 0.18, yTope: 0.18,
        paso: 0.68, espesor: 0.14, color: '#6f6a62', variar: 0.12 });
      pilotesAlTerreno(c, sitio, rot,
        [[-W / 2 + 0.35, -D / 2 + 0.35], [W / 2 - 0.35, -D / 2 + 0.35],
         [-W / 2 + 0.35, D / 2 - 0.35], [W / 2 - 0.35, D / 2 - 0.35]],
        0.15, 0.11, '#514234', 0.45);
      caja(c, [0, 0.3, 0], [W + 0.5, 0.3, D + 0.5], TABLA);
      // Fachada con huecos rectangulares reales. Antes se eliminaba cada
      // tabla completa al tocar una ventana, dejando agujeros de piso a techo.
      entabladoVertical(c, {
        W, z: -D / 2, y0: 0.45, alto: H, tabla: 0.34, lado: -1,
        huecos: [
          { x0: -0.58, x1: 0.58, y0: 0.42, y1: 2.52 },
          { x0: -3.3, x1: -1.9, y0: 1.15, y1: 2.25 },
          { x0: 1.9, x1: 3.3, y0: 1.15, y1: 2.25 },
        ],
      });
      // Fondo continuo, con el mismo ritmo de tablas.
      entabladoVertical(c, { W, z: D / 2, y0: 0.45, alto: H, tabla: 0.34, lado: 1 });
      for (const l of [-1, 1]) for (let z = -D / 2; z < D / 2 - 0.01; z += 0.34) {
        c.agregar(new THREE.BoxGeometry(0.12, H, 0.32), { color: Math.round(z * 10) % 2 ? '#9a7248' : '#8a6440', tipo: 4, variar: 0.09, matriz: matriz([l * W / 2, 0.45 + H / 2, z + 0.17]) });
      }
      // frontón, cornisa alta a la calle y cartel pintado
      caja(c, [0, H + 1.05, -D / 2 - 0.1], [W + 0.8, 1.5, 0.22], '#7d5f3f');
      caja(c, [0, H + 1.05, -D / 2 - 0.24], [W - 0.4, 0.9, 0.06], '#3f5a52');
      caja(c, [0, H + 0.3, -D / 2 - 0.2], [W + 0.9, 0.18, 0.3], '#5f462d');
      for (const dz of [-D / 2, D / 2]) {
        const tri = new THREE.BufferGeometry();
        tri.setAttribute('position', new THREE.Float32BufferAttribute([-W / 2, 0, 0, W / 2, 0, 0, 0, 1.3, 0, W / 2, 0, 0, -W / 2, 0, 0, 0, 1.3, 0], 3));
        c.agregar(tri, { color: '#6a4f36', tipo: 0, matriz: matriz([0, H + 0.45, dz]) });
      }
      // vidriera, puerta y ventanas
      marcoVentana(c, [-2.6, 1.7, -D / 2 - 0.02], 1.4, 1.1, 0, false);
      marcoVentana(c, [2.6, 1.7, -D / 2 - 0.02], 1.4, 1.1, 0, false);
      // Marco de la puerta alineado con el vano físico de 1.10 m.
      caja(c, [0, 2.5, -D / 2 - 0.02], [1.42, 0.16, 0.16], '#5f462d');
      for (const l of [-1, 1]) caja(c, [l * 0.66, 1.48, -D / 2 - 0.02], [0.16, 2.2, 0.16], '#5f462d');
      caja(c, [0, 0.55, -D / 2 - 0.55], [2.1, 0.16, 0.9], '#6f6a62', 0, 4);
      // vereda con alero y sus postes. La caída apunta hacia la calle (-Z):
      // en versiones anteriores el signo estaba invertido y el borde exterior
      // quedaba más alto que la fachada, como un techo que juntara agua adentro.
      caja(c, [0, 0.42, -D / 2 - 1.3], [W + 0.6, 0.16, 2.2], TABLA);
      const INCL_ALERO_ALM = -0.10;
      const zCentroAleroAlm = -D / 2 - 1.3, zPosteAlm = -D / 2 - 2.1;
      const yPosteAlm = 2.92 - (zPosteAlm - zCentroAleroAlm) * Math.sin(INCL_ALERO_ALM)
        - 0.07 * Math.cos(INCL_ALERO_ALM);
      for (const l of [-1, 1]) posteHastaTerreno(c, sitio, rot, l * (W / 2 - 0.3), zPosteAlm, yPosteAlm, 0.1, MADERA_OSCURA, 0.14, true);
      mensulas(c, yPosteAlm - 0.03, zPosteAlm, [-(W / 2 - 0.3), W / 2 - 0.3]);
      // La vereda deja de ser una tabla suspendida: seis apoyos bajan a
      // la cota real del terreno y un escalón central resuelve el acceso.
      pilotesAlTerreno(c, sitio, rot,
        [-W / 2 + 0.45, 0, W / 2 - 0.45].flatMap(px => [-D / 2 - 0.45, -D / 2 - 2.05].map(pz => [px, pz])),
        0.42, 0.10, MADERA_OSCURA, 0.50);
      const zPasosAlmacen = [-D / 2 - 2.78, -D / 2 - 2.38];
      const sueloExteriorAlmacen = sueloLocal(sitio, rot, 0, zPasosAlmacen[0]);
      for (let i = 0; i < zPasosAlmacen.length; i++) {
        const sueloPaso = sueloLocal(sitio, rot, 0, zPasosAlmacen[i]);
        const avance = (i + 1) / (zPasosAlmacen.length + 1);
        const altoIdeal = lerp(sueloExteriorAlmacen + 0.12, 0.49, avance);
        const altoPaso = Math.max(sueloPaso + 0.055, altoIdeal);
        // 3.0.1: la caja va centrada en `alto`: la cara de arriba quedaba en altoPaso +
        // espesor/2 y en una ladera el segundo escalón pasaba la altura de la vereda
        const espesorPasoAlm = Math.max(0.11, altoPaso - sueloPaso + 0.04);
        PA.escalon({ lx: 0, lz: zPasosAlmacen[i], largo: 2.25 - i * 0.12, ancho: 0.55,
          alto: altoPaso - espesorPasoAlm / 2, espesor: espesorPasoAlm, color: i ? '#806247' : '#745b43' });
      }

      // mostrador adentro, con la balanza y la libreta de fiado
      caja(c, [0, 1.0, 0.3], [W - 1.6, 0.18, 0.7], '#8a6b4a');
      caja(c, [0, 0.62, 0.3], [W - 1.8, 0.62, 0.5], '#6b5238');
      caja(c, [-1.9, 1.22, 0.3], [0.45, 0.3, 0.35], '#8d9299');
      c.agregar(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 12), { color: '#b9a271', tipo: 4, matriz: matriz([-1.9, 1.4, 0.3]) });
      caja(c, [1.6, 1.13, 0.3], [0.3, 0.08, 0.22], '#c9bfa6');
      // estantería del fondo, con frascos, latas y damajuanas
      for (const y of [1.15, 1.7, 2.25]) {
        caja(c, [0, y, D / 2 - 0.35], [W - 1.2, 0.08, 0.5], TABLA);
        for (let i = 0; i < 9; i++) {
          const x = -W / 2 + 0.9 + i * 0.72;
          if (i % 3 === 0) c.agregar(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 8), { color: '#8e9c6a', tipo: 4, matriz: matriz([x, y + 0.19, D / 2 - 0.35]) });
          else if (i % 3 === 1) c.agregar(new THREE.BoxGeometry(0.22, 0.28, 0.2), { color: i % 2 ? '#a8563a' : '#5f7a86', tipo: 4, variar: 0.12, matriz: matriz([x, y + 0.18, D / 2 - 0.35]) });
          else c.agregar(new THREE.CylinderGeometry(0.13, 0.15, 0.34, 8), { color: '#7d6a4a', tipo: 4, matriz: matriz([x, y + 0.21, D / 2 - 0.35]) });
        }
      }
      // El frente de estanterías es un volumen sólido. Antes se podía caminar
      // dentro de los anaqueles aunque visualmente estuvieran llenos de mercadería.
      PA.mueble({ lx: 0, ly: 1.65, lz: D / 2 - 0.35, largo: W - 1.15, alto: 1.85, ancho: 0.55,
        color: TABLA, dibujar: false });
      // bolsas y cajones apilados en un rincón
      for (let i = 0; i < 4; i++) c.agregar(new THREE.CylinderGeometry(0.28, 0.32, 0.6, 8), { color: i % 2 ? '#cfc2a4' : '#c2b391', tipo: 4, variar: 0.1, matriz: matriz([W / 2 - 1.1 - (i % 2) * 0.62, 0.75, -1.5 + Math.floor(i / 2) * 0.55], [0.06, i, 0]) });
      for (let i = 0; i < 3; i++) caja(c, [-W / 2 + 1.0, 0.68 + i * 0.42, -1.6], [0.8, 0.4, 0.6], i % 2 ? '#7d5f3f' : '#8a6a46', 0.1);
      // 3.0.1: las bolsas de harina y la pila de cajones se veían y se atravesaban
      PA.mueble({ lx: W / 2 - 1.41, ly: 0.75, lz: -1.225, largo: 1.25, alto: 0.6, ancho: 1.2, color: '#cfc2a4', dibujar: false });
      PA.mueble({ lx: -W / 2 + 1.0, ly: 1.1, lz: -1.6, largo: 0.9, alto: 1.3, ancho: 0.72, color: '#7d5f3f', dibujar: false });
      zocaloPiedra(c, W + 0.12, D + 0.12, 0.09, 0.78, sitio, rot, 0.45);
      techoDosAguasDetallado(c, {
        W, D, H, alzada: 1.3, vueloX: 0.52, vueloZ: 0.58,
        estilo: 'chapa', colores: ['#77726a', '#81796f', '#6f6c67', '#8b735f'],
        canaleta: true, colorEstructura: '#4b3b31', sitio, rotY: rot,
      });
      // tirantes del cielorraso vistos desde el salón
      for (const zt of [-D * 0.32, 0, D * 0.32]) {
        cilindroEntre(c, [-W / 2 + 0.18, H - 0.04, zt], [W / 2 - 0.18, H - 0.04, zt], 0.05, '#4b3b31');
      }
      // V7 TERMINACIÓN — mercadería exterior bajo el alero: cajones, barriles y sacos.
      // Le da escala humana y hace que el almacén se identifique sin mirar el mapa.
      for (let i = 0; i < 4; i++) {
        const bx = -2.75 + i * 0.62;
        caja(c, [bx, 0.76, -D / 2 - 1.45], [0.52, 0.52, 0.52], i % 2 ? '#825f3c' : '#936c45', i * 0.12, 4);
      }
      for (const bx of [1.85, 2.55]) {
        c.agregar(new THREE.CylinderGeometry(0.31, 0.34, 0.82, 10), {
          color: '#76563a', tipo: 4, variar: 0.1,
          matriz: matriz([bx, 0.91, -D / 2 - 1.48]),
        });
        c.agregar(new THREE.TorusGeometry(0.325, 0.025, 5, 12), { color: '#48433d', tipo: 4,
          matriz: matriz([bx, 0.71, -D / 2 - 1.48], [Math.PI / 2, 0, 0]) });
        c.agregar(new THREE.TorusGeometry(0.325, 0.025, 5, 12), { color: '#48433d', tipo: 4,
          matriz: matriz([bx, 1.10, -D / 2 - 1.48], [Math.PI / 2, 0, 0]) });
      }
      // Mercadería exterior: colisiones por conjuntos, no por cada listón. Así
      // se conserva la lectura sólida sin llenar la grilla de obstáculos diminutos.
      PA.mueble({ lx: -1.82, ly: 0.76, lz: -D / 2 - 1.45, largo: 2.45, alto: 0.56, ancho: 0.68,
        color: '#825f3c', dibujar: false });
      PA.mueble({ lx: 2.20, ly: 0.91, lz: -D / 2 - 1.48, largo: 1.38, alto: 0.84, ancho: 0.70,
        color: '#76563a', dibujar: false });

      const g = new THREE.Group();
      g.position.set(sitio.x, sitio.y, sitio.z);
      g.rotation.y = rot;
      const malla = new THREE.Mesh(c.geometria(), mat);
      malla.castShadow = true; malla.receiveShadow = true;
      g.add(malla);
      // V7 TERMINACIÓN — rótulo grande integrado a la fachada. Es deliberadamente
      // legible desde la vereda para que el edificio deje de parecer otra cabaña.
      const rotulo = new THREE.Mesh(
        new THREE.PlaneGeometry(5.6, 1.05),
        new THREE.MeshBasicMaterial({ map: cartelTextura('RAMOS GENERALES'), side: THREE.DoubleSide }),
      );
      rotulo.position.set(0, H + 1.05, -D / 2 - 0.285);
      rotulo.rotation.y = Math.PI;
      g.add(rotulo);
      // alero de la vereda
      const alero = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 0.14, 2.6), new THREE.MeshLambertMaterial({ color: 0x5a4a3e }));
      alero.position.set(0, 2.92, -D / 2 - 1.3);
      alero.rotation.x = INCL_ALERO_ALM;
      alero.castShadow = true;
      g.add(alero);
      const vidrio = materialVidrio(0x24201a);
      for (const vx of [-2.6, 2.6]) {
        const v = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0), vidrio);
        v.position.set(vx, 1.7, -D / 2 - 0.09);
        v.rotation.y = Math.PI;
        g.add(v);
      }
      const luz = new THREE.PointLight(0xffb070, 0, 18, 1.6);
      luz.position.set(0, 2.3, 0);
      const interior = new THREE.PointLight(0xdfe6ec, 0, 10, 1.3);
      interior.position.set(0, 2.1, 0);
      g.add(luz, interior);
      grupo.add(g);

      const w = (lx, lz) => aMundo(sitio, rot, lx, lz);
      const PARED_ALM = { desde: 0.35, hasta: H + 0.18, espesor: 0.31, dibujar: false };
      PA.paredRecta({ ...PARED_ALM, a: [-W / 2, -D / 2], b: [W / 2, -D / 2], huecos: [{ desde: W / 2 - 0.58, hasta: W / 2 + 0.58 }] });
      PA.paredRecta({ ...PARED_ALM, a: [-W / 2, D / 2], b: [W / 2, D / 2] });
      PA.paredRecta({ ...PARED_ALM, a: [-W / 2, -D / 2], b: [-W / 2, D / 2] });
      PA.paredRecta({ ...PARED_ALM, a: [W / 2, -D / 2], b: [W / 2, D / 2] });
      // el mostrador bloquea solo hasta su volumen real; antes era una pared infinita
      const Acont = w(-W / 2 + 0.8, 0.3), Bcont = w(W / 2 - 0.8, 0.3);
      col.agregar({ seg: true, ax: Acont.x, az: Acont.z, bx: Bcont.x, bz: Bcont.z, r: 0.24,
        alturaMin: sitio.y + 0.25, alturaMax: sitio.y + 1.18 });
      col.agregarPlataforma({ x: sitio.x, z: sitio.z, ang: -rot, largo: W + 0.5, ancho: D + 0.5, alto: sitio.y + 0.45, espesor: 0.30 });
      const vereda = w(0, -D / 2 - 1.3);
      col.agregarPlataforma({ x: vereda.x, z: vereda.z, ang: -rot, largo: W + 0.6, ancho: 2.2, alto: sitio.y + 0.5, espesor: 0.16 });
      const umbralAlm = w(0, -D / 2 - 0.55);
      col.agregarPlataforma({ x: umbralAlm.x, z: umbralAlm.z, ang: -rot, largo: 2.1, ancho: 0.9, alto: sitio.y + 0.63, espesor: 0.16 });

      const mostrador = w(0, 0.3); // centro real del mostrador dibujado
      const detras = w(0, 1.3);
      const puerta = w(0, -D / 2 - 3);
      if (puertas) puertas.agregar({ sitio: { x: sitio.x, z: sitio.z, y: sitio.y, piso: 0.46 }, rot, lx: 0, lz: -D / 2 - 0.05, ancho: 1.1, alto: 2.05, lado: 1, nombre: 'la puerta del almacén' });
      almacen = { x: sitio.x, z: sitio.z, y: sitio.y, rot, nombre: 'Almacén de Ramos Generales', vidrio, luz, interior,
        puerta, mostrador, detras, radio: 9, ancho: W, fondo: D };   // 3.0.1: ancho y fondo, para saber si estás adentro
      T.lugares.almacen = almacen;
      almacenSorteo = aldeaAlm ? (sorteado ? { x: sorteado.x, z: sorteado.z } : null) : almacen;
      if (almacenSorteo) registrarHuella('almacen', almacenSorteo, almacen.radio, 5);
      const cc = w(-4.6, -D / 2 - 3.4);
      cartel('Ramos Generales', cc.x, cc.z, rot + Math.PI);
    }
  }

  // ---------------------------------------------------------------- galpón de esquila
  let galpon = null;
  {
    // El galpón ocupa mucho más que su nave: corrales, manga, cobertizo y
    // molino australiano. El almacén se crea justo antes y debe contarse como
    // vecino real; sin esta restricción ambos complejos podían superponerse.
    const sitio = buscarLlano({ bosqueMax: 0.16, alturaMin: 2, pendMax: 0.13, desnivel: 0.7, claro: 16, lejosDe: [L.refugio, L.cabana, L.puesto, molino, casaTeSorteo, torre, almacenSorteo], distancia: 90 })
      || buscarLlano({ bosqueMax: 0.3, pendMax: 0.2, desnivel: 1.2, claro: 12, lejosDe: [L.refugio, molino, almacenSorteo], distancia: 55 });
    if (sitio) {
      const p = haciaSendero(sitio.x, sitio.z);
      // El portón, el cartel y la zona de trabajo están en -Z local; orientamos
      // esa cara hacia el sendero para que el galpón tenga una llegada lógica.
      const rot = Math.atan2(p.x - sitio.x, p.z - sitio.z) + Math.PI;
      const W = 13, D = 8.5, H = 3.4;
      // 3.0.1: el piso (a 0,39 m) no puede quedar bajo el terreno de su propia huella:
      // en una esquina el pasto asomaba 27 cm entre los tablones
      for (let lx = -W / 2 - 0.3; lx <= W / 2 + 0.3 + 1e-6; lx += (W + 0.6) / 12)
        for (let lz = -D / 2 - 0.3; lz <= D / 2 + 0.3 + 1e-6; lz += (D + 0.6) / 8) {
          const q = aMundo(sitio, rot, lx, lz);
          sitio.y = Math.max(sitio.y, T.altura(q.x, q.z) - 0.34);
        }
      const c = new Constructor();
      const PG = piezas(c, col, { x: sitio.x, z: sitio.z, y: sitio.y, rot }, matriz);
      const CHAPA = '#8d7f6c', CHAPA_OX = '#8a5a3c', PIRCA = '#7d766c';
      const RAMPA_Z0 = -1.6, RAMPA_Z1 = 1.6, RAMPA_ALTO = 2.65;
      marcoEstructural(c, { W, D, H, techo: H + 2.1, color: '#5a4938' });

      // piso de tablones sobre pilotes ajustados al suelo real
      caja(c, [0, 0.22, 0], [W + 0.6, 0.34, D + 0.6], TABLA);
      pilotesAlTerreno(c, sitio, rot,
        [-W / 2, -W / 4, 0, W / 4, W / 2].flatMap(px => [-D / 2, 0, D / 2].map(pz => [px, pz])),
        0.2, 0.16, MADERA_OSCURA, 0.39);
      faldaCimientoTerreno(c, { sitio, rotY: rot, W: W - 0.18, D: D - 0.18, yTope: 0.09,
        paso: 0.82, espesor: 0.13, color: '#4a3b2c' });
      zocaloPiedra(c, W + 0.15, D + 0.15, 0.07, 0.86, sitio, rot, 0.39);
      // rampa funcional: cada tabla visible es también una plataforma real.
      // Antes era solo geometría y el jugador podía "caer" a través de ella.
      const RAMPA_N = 7;
      const xFinRampa = W / 2 + 0.6 + (RAMPA_N - 1) * 0.42;
      const sueloFinRampa = sueloLocal(sitio, rot, xFinRampa, 0);
      // 3.0.1: si afuera el terreno está más alto que el piso, la rampa sube hasta él (con
      // el tope fijo de 0,30 la punta de la rampa quedaba enterrada)
      const altoFinalRampa = sueloFinRampa > 0.23 ? sueloFinRampa + 0.07 : Math.min(0.30, sueloFinRampa + 0.07);
      for (let i = 0; i < RAMPA_N; i++) {
        const tR = i / (RAMPA_N - 1);
        const altoR = lerp(0.34, altoFinalRampa, tR);
        PG.escalon({ lx: W / 2 + 0.6 + i * 0.42, lz: 0, largo: 0.44, ancho: 3.2,
          alto: altoR, espesor: 0.12, color: i % 2 ? TABLA : '#7a5f43' });
      }
      // 3.0.1: si del lado del portón el terreno queda más de medio metro bajo el piso
      // (0,39 m), un escalón de tablones delante del portón: sin él no se subía al galpón
      {
        const sueloPorton = Math.min(sueloLocal(sitio, rot, -1.2, -D / 2 - 0.62), sueloLocal(sitio, rot, 0, -D / 2 - 0.62), sueloLocal(sitio, rot, 1.2, -D / 2 - 0.62));
        if (0.39 - sueloPorton > 0.5) {
          const topePorton = Math.max(sueloPorton + 0.07, (0.39 + sueloPorton) / 2);
          const espPorton = topePorton - sueloPorton + 0.06;
          PG.escalon({ lx: 0, lz: -D / 2 - 0.62, largo: 3.1, ancho: 0.6, alto: topePorton - espPorton / 2, espesor: espPorton, color: '#7a5f43' });
        }
      }
      // paredes de tabla y poste, con la puerta corrediza grande al frente
      const postes = [];
      for (let x = -W / 2; x <= W / 2 + 0.01; x += W / 8) postes.push(x);
      for (const x of postes) {
        cilindroEntre(c, [x, 0.3, -D / 2], [x, H, -D / 2], 0.11, MADERA_OSCURA);
        cilindroEntre(c, [x, 0.3, D / 2], [x, H, D / 2], 0.11, MADERA_OSCURA);
      }
      for (let i = 0; i < 9; i++) {
        const yy = 0.5 + i * 0.33;
        const color = i % 3 === 1 ? '#7d5f3f' : i % 3 === 2 ? '#8a6a46' : '#6f5334';
        // fondo entero, frente con el portón abierto en el medio
        c.agregar(new THREE.BoxGeometry(W, 0.3, 0.12), { color, tipo: 4, variar: 0.1, matriz: matriz([0, yy, D / 2]) });
        if (yy > 2.9) c.agregar(new THREE.BoxGeometry(W, 0.3, 0.12), { color, tipo: 4, variar: 0.1, matriz: matriz([0, yy, -D / 2]) });
        else {
          c.agregar(new THREE.BoxGeometry(W / 2 - 1.5, 0.3, 0.12), { color, tipo: 4, variar: 0.1, matriz: matriz([-W / 4 - 0.75, yy, -D / 2]) });
          c.agregar(new THREE.BoxGeometry(W / 2 - 1.5, 0.3, 0.12), { color, tipo: 4, variar: 0.1, matriz: matriz([W / 4 + 0.75, yy, -D / 2]) });
        }
        for (const lado of [-1, 1]) {
          if (lado === 1 && yy < RAMPA_ALTO) {
            // Abertura de carga: la rampa ya no desemboca contra una pared.
            const len = RAMPA_Z0 + D / 2;
            c.agregar(new THREE.BoxGeometry(0.12, 0.3, len), { color, tipo: 4, variar: 0.1,
              matriz: matriz([W / 2, yy, (-D / 2 + RAMPA_Z0) / 2]) });
            c.agregar(new THREE.BoxGeometry(0.12, 0.3, len), { color, tipo: 4, variar: 0.1,
              matriz: matriz([W / 2, yy, (D / 2 + RAMPA_Z1) / 2]) });
          } else {
            c.agregar(new THREE.BoxGeometry(0.12, 0.3, D), { color, tipo: 4, variar: 0.1, matriz: matriz([lado * W / 2, yy, 0]) });
          }
        }
      }
      // Marco del vano lateral al que llega la rampa de carga.
      caja(c, [W / 2 + 0.02, RAMPA_ALTO + 0.03, 0], [0.18, 0.18, RAMPA_Z1 - RAMPA_Z0 + 0.32], MADERA_OSCURA);
      for (const zz of [RAMPA_Z0, RAMPA_Z1]) caja(c, [W / 2 + 0.02, RAMPA_ALTO / 2, zz], [0.18, RAMPA_ALTO, 0.18], MADERA_OSCURA);
      // el riel del portón; la hoja va aparte, porque corre
      caja(c, [0, 3.45, -D / 2 - 0.22], [W, 0.14, 0.2], MADERA_OSCURA);
      for (const dx of [-1.2, 1.2]) caja(c, [-W / 4 - 0.4 + dx, 1.9, -D / 2 - 0.3], [0.14, 2.7, 0.08], MADERA);
      for (const x of [-W / 2 + 0.45, W / 2 - 0.45]) {
        for (const yb of [0.9, 2.2, 3.25]) remache(c, [x, yb, -D / 2 - 0.31]);
      }
      // Cerchas repetidas de luz completa: tirante, pares, pendolón y diagonales.
      // Esto hace que el interior lea como un galpón real y no como una caja con techo.
      serieCerchas(c, { W, D, H, alzada: 2.1, paso: 1.7, color: '#514234' });
      // frontones y techo de chapa acanalada, a dos aguas
      for (const dz of [-D / 2, D / 2]) {
        const tri = new THREE.BufferGeometry();
        tri.setAttribute('position', new THREE.Float32BufferAttribute([-W / 2, 0, 0, W / 2, 0, 0, 0, 2.1, 0, W / 2, 0, 0, -W / 2, 0, 0, 0, 2.1, 0], 3));
        c.agregar(tri, { color: '#6a4f36', tipo: 0, matriz: matriz([0, H, dz]) });
      }
      // ventiluz del frontón
      caja(c, [0, H + 1.0, -D / 2 - 0.05], [1.5, 0.75, 0.1], '#3a3128');
      // interior: tablas de esquila, prensa de lana y fardos
      caja(c, [-2.5, 0.55, 1.2], [6.5, 0.12, 3.2], '#9a8259');
      // Durmientes bajo la tarima: sus 10 cm de elevación dejan de parecer una
      // tabla flotante sobre el piso principal del galpón.
      for (const xx of [-5.1, -3.2, -1.3, 0.6]) caja(c, [xx, 0.44, 1.2], [0.16, 0.10, 3.0], '#5e4936');
      // La mesa/plataforma de esquila es baja y está pensada para subirse:
      // antes sólo se dibujaba y el cuerpo la atravesaba.
      PG.mueble({ lx: -2.5, ly: 0.55, lz: 1.2, largo: 6.5, alto: 0.12, ancho: 3.2,
        color: '#9a8259', pisable: true, dibujar: false });
      for (const x of [-5, -3.2, -1.4, 0.4]) caja(c, [x, 0.95, 1.2], [0.1, 0.7, 3.0], MADERA_OSCURA);
      // prensa: cajón alto de madera con su palanca
      caja(c, [4.2, 1.35, 1.6], [1.5, 2.1, 1.5], '#7a5f43');
      caja(c, [4.2, 2.5, 1.6], [1.7, 0.16, 1.7], MADERA_OSCURA);
      cilindroEntre(c, [4.2, 2.6, 1.6], [5.9, 3.5, 1.6], 0.09, MADERA);
      // fardos de lana apilados
      for (let i = 0; i < 6; i++) {
        const fx = 4.6 + (i % 2) * 1.0, fy = 0.74 + Math.floor(i / 2) * 0.70, fz = -2.2;
        caja(c, [fx, fy, fz], [0.95, 0.7, 1.2], i % 2 ? '#d8cfb4' : '#cfc4a4', 0.04, 4);
        for (const cinta of [-0.25, 0.25]) caja(c, [fx, fy + cinta, fz], [0.99, 0.06, 1.24], '#6b6152', 0.04, 4);
      }
      PG.mueble({ lx: 5.1, ly: 1.46, lz: -2.2, largo: 2.1, alto: 2.22, ancho: 1.3,
        color: '#d8cfb4', dibujar: false });
      // V7 TERMINACIÓN — cobertizo lateral de trabajo. Cambia claramente la silueta
      // del galpón y crea una zona de transición entre edificio, corrales y maquinaria.
      const COB_X = -W / 2 - 2.45;
      const INCL_COB_GAL = 0.10;
      c.agregar(new THREE.BoxGeometry(4.8, 0.16, D - 0.7), {
        color: '#72695f', tipo: 4, variar: 0.10,
        matriz: matriz([COB_X, 2.72, 0], [0, 0, INCL_COB_GAL]),
      });
      caja(c, [-W / 2 - 0.18, 2.92, 0], [0.18, 0.18, D - 0.4], '#514234');
      // Piso de trabajo continuo: los aperos ya no quedan suspendidos sobre
      // un terreno que puede variar varios centímetros a esta distancia.
      caja(c, [COB_X, 0.24, 0], [4.55, 0.16, D - 0.95], '#806447', 0, 4);
      pilotesAlTerreno(c, sitio, rot,
        [COB_X - 2.05, COB_X, COB_X + 2.05].flatMap(px => [-D / 2 + 0.65, 0, D / 2 - 0.65].map(pz => [px, pz])),
        0.18, 0.10, '#514234', 0.32);
      const xPosteCob = COB_X - 2.10;
      const yPosteCob = 2.72 + (xPosteCob - COB_X) * Math.sin(INCL_COB_GAL)
        - 0.08 * Math.cos(INCL_COB_GAL);
      for (const pz of [-D / 2 + 0.55, -D / 6, D / 6, D / 2 - 0.55]) {
        posteHastaTerreno(c, sitio, rot, xPosteCob, pz, yPosteCob, 0.11, '#514234', 0.14, true);
        cilindroEntre(c, [xPosteCob, 1.55, pz], [-W / 2 - 0.18, 2.88, pz], 0.065, '#5f4935');
      }
      // aperos, cajones y un carro sencillo bajo el cobertizo
      for (let i = 0; i < 5; i++) caja(c, [COB_X - 0.5 + (i % 2) * 0.9, 0.54 + Math.floor(i / 2) * 0.44, -2.45], [0.78, 0.44, 0.72], i % 2 ? '#7d5f3f' : '#8a6a46', 0.06 * i, 4);
      for (const wz of [-0.9, 0.9]) {
        c.agregar(new THREE.TorusGeometry(0.52, 0.065, 6, 14), { color: '#40372f', tipo: 4,
          matriz: matriz([COB_X + 0.35, 0.78, wz], [0, Math.PI / 2, 0]) });
      }
      caja(c, [COB_X + 0.35, 1.00, 0], [1.65, 0.18, 2.25], '#76573c', 0, 4);
      PG.mueble({ lx: COB_X - 0.05, ly: 0.96, lz: -2.45, largo: 1.85, alto: 1.55, ancho: 0.82,
        color: '#7d5f3f', dibujar: false });
      PG.mueble({ lx: COB_X + 0.35, ly: 0.78, lz: 0, largo: 1.78, alto: 1.02, ancho: 2.30,
        color: '#76573c', dibujar: false });

      // Banco verdadero junto al umbral. El punto de descanso ya existía en
      // gameplay, pero no había ningún asiento visible en esa coordenada.
      const BANCO_GAL_LX = -W / 2 + 1.6, BANCO_GAL_LZ = -D / 2 - 1.2;
      const sueloBancoGal = sueloLocal(sitio, rot, BANCO_GAL_LX, BANCO_GAL_LZ);
      const yBancoGal = sueloBancoGal + 0.48;
      caja(c, [BANCO_GAL_LX, yBancoGal, BANCO_GAL_LZ], [2.35, 0.10, 0.48], TABLA);
      for (const dx of [-0.95, 0.95]) posteHastaTerreno(c, sitio, rot, BANCO_GAL_LX + dx, BANCO_GAL_LZ, yBancoGal - 0.04, 0.055, MADERA_OSCURA);
      caja(c, [BANCO_GAL_LX, yBancoGal + 0.35, BANCO_GAL_LZ + 0.19], [2.35, 0.55, 0.08], '#76573c');

      techoDosAguasDetallado(c, {
        W, D, H, alzada: 2.1, vueloX: 0.7, vueloZ: 0.62,
        estilo: 'chapa', colores: [CHAPA, '#81776b', '#746f68', CHAPA_OX, CHAPA],
        canaleta: true, colorEstructura: '#514234', sitio, rotY: rot,
      });
      // farol colgado de un tirante
      const vidrio = materialVidrio(0x241d16);

      const g = new THREE.Group();
      g.position.set(sitio.x, sitio.y, sitio.z);
      g.rotation.y = rot;
      const malla = new THREE.Mesh(c.geometria(), mat);
      malla.castShadow = true; malla.receiveShadow = true;
      g.add(malla);
      const farol = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.26), vidrio);
      farol.position.set(0, 2.9, -1.5);
      g.add(farol);
      const luz = new THREE.PointLight(0xffb070, 0, 16, 1.6);
      luz.position.set(0, 2.6, 0);
      const interior = new THREE.PointLight(0xdfe6ec, 0, 13, 1.3);
      interior.position.set(0, 2.3, 0);
      g.add(luz, interior);
      grupo.add(g);

      const w = (lx, lz) => aMundo(sitio, rot, lx, lz);
      const PARED_GAL = { desde: 0.28, hasta: H + 0.18, espesor: 0.31, dibujar: false };
      PG.paredRecta({ ...PARED_GAL, a: [-W / 2, D / 2], b: [W / 2, D / 2] });
      PG.paredRecta({ ...PARED_GAL, a: [-W / 2, -D / 2], b: [-W / 2, D / 2] });
      PG.paredRecta({ ...PARED_GAL, a: [W / 2, -D / 2], b: [W / 2, D / 2],
        huecos: [{ desde: RAMPA_Z0 + D / 2, hasta: RAMPA_Z1 + D / 2 }] });
      PG.paredRecta({ ...PARED_GAL, a: [-W / 2, -D / 2], b: [W / 2, -D / 2], huecos: [{ desde: W / 2 - 1.5, hasta: W / 2 + 1.5 }] });
      col.agregarPlataforma({ x: sitio.x, z: sitio.z, ang: -rot, largo: W + 0.6, ancho: D + 0.6, alto: sitio.y + 0.39, espesor: 0.34 });
      const cobPiso = w(COB_X, 0);
      col.agregarPlataforma({ x: cobPiso.x, z: cobPiso.z, ang: -rot, largo: 4.55, ancho: D - 0.95,
        alto: sitio.y + 0.32, espesor: 0.16 });
      // la prensa y los fardos ocupan lugar, pero no generan columnas invisibles infinitas
      const prensa = w(4.2, 1.6); col.agregar({ x: prensa.x, z: prensa.z, r: 1.1, alturaMin: sitio.y + 0.3, alturaMax: sitio.y + 2.7 });
      const fardos = w(5.1, -2.2); col.agregar({ x: fardos.x, z: fardos.z, r: 1.3, alturaMin: sitio.y + 0.3, alturaMax: sitio.y + 2.9 });

      // ---------- corrales de palo a pique y manga ----------
      const cor = new Constructor();
      const corral = (cx, cz, radio, lados) => {
        for (let i = 0; i < lados; i++) {
          const a1 = (i / lados) * Math.PI * 2, a2 = ((i + 1) / lados) * Math.PI * 2;
          const x1 = cx + Math.cos(a1) * radio, z1 = cz + Math.sin(a1) * radio;
          const x2 = cx + Math.cos(a2) * radio, z2 = cz + Math.sin(a2) * radio;
          if (i === 0) continue;   // el portón
          const pasos = Math.max(2, Math.round(Math.hypot(x2 - x1, z2 - z1) / 0.55));
          for (let k = 0; k <= pasos; k++) {
            const t2 = k / pasos, px = lerp(x1, x2, t2), pz = lerp(z1, z2, t2);
            const sueloP = sueloLocal(sitio, rot, px, pz);
            cilindroEntre(cor, [px, sueloP - 0.18, pz], [px, sueloP + 1.35 + (k % 3) * 0.06, pz], 0.07, k % 4 ? '#6e5741' : '#7d6448');
          }
          const s1 = sueloLocal(sitio, rot, x1, z1), s2 = sueloLocal(sitio, rot, x2, z2);
          for (const yy of [0.6, 1.15]) cilindroEntre(cor, [x1, s1 + yy, z1], [x2, s2 + yy, z2], 0.05, MADERA);
          const W2 = { x: x1, z: z1 }, B2 = { x: x2, z: z2 };
          const A = aMundo(sitio, rot, W2.x, W2.z), B = aMundo(sitio, rot, B2.x, B2.z);
          col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.14,
            alturaMin: sitio.y + Math.min(s1, s2) - 0.18, alturaMax: sitio.y + Math.max(s1, s2) + 1.55 });
        }
      };
      // 3.0.1: 2,6 m más lejos del galpón: su alambrado pasaba justo por delante del portón
      // (no se podía entrar por el frente) y atravesaba las patas del molino australiano
      corral(-2, -15.6, 9, 9);
      corral(11, -8, 5.5, 7);
      // manga: dos líneas de palos que llevan del corral a la rampa
      for (const lado of [-1, 1]) {
        let ant = null;
        let sueloMin = Infinity, sueloMax = -Infinity;
        for (let k = 0; k <= 9; k++) {
          const x = 3.5 + k * 0.85, z = -6.5 + lado * 0.75 + k * 0.1;
          const sueloP = sueloLocal(sitio, rot, x, z);
          sueloMin = Math.min(sueloMin, sueloP); sueloMax = Math.max(sueloMax, sueloP);
          cilindroEntre(cor, [x, sueloP - 0.18, z], [x, sueloP + 1.25, z], 0.06, '#6e5741');
          if (ant) for (const yy of [0.58, 1.08]) cilindroEntre(cor, [ant.x, ant.s + yy, ant.z], [x, sueloP + yy, z], 0.045, MADERA);
          ant = { x, z, s: sueloP };
        }
        const A = aMundo(sitio, rot, 3.5, -6.5 + lado * 0.75), B = aMundo(sitio, rot, 11.15, -5.6 + lado * 0.75);
        col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.12,
          alturaMin: sitio.y + sueloMin - 0.18, alturaMax: sitio.y + sueloMax + 1.45 });
      }
      // pirca de piedra al costado, lo que queda de un corral viejo
      for (let i = 0; i < 26; i++) {
        const t2 = i / 25;
        const x = -13 + t2 * 9, z = 6 + Math.sin(t2 * 3) * 1.6;
        const sueloP = sueloLocal(sitio, rot, x, z);
        const hP = 0.55 + Math.sin(i) * 0.12;
        cor.agregar(new THREE.BoxGeometry(0.8, hP, 0.7), { color: PIRCA, tipo: 4, variar: 0.16, matriz: matriz([x, sueloP + hP / 2 - 0.03, z], [0, i * 0.7, 0]) });
        if (i % 2 === 0) cor.agregar(new THREE.BoxGeometry(0.62, 0.42, 0.6), { color: PIRCA, tipo: 4, variar: 0.16, matriz: matriz([x, sueloP + hP + 0.15, z + 0.05], [0, i, 0]) });
      }
      // 3.0.1: la pirca se atravesaba: frena por tramos, a su altura
      for (let i = 0; i < 25; i += 5) {
        const pA = { x: -13 + (i / 25) * 9, z: 6 + Math.sin((i / 25) * 3) * 1.6 };
        const pB = { x: -13 + ((i + 5) / 25) * 9, z: 6 + Math.sin(((i + 5) / 25) * 3) * 1.6 };
        const sA = sueloLocal(sitio, rot, pA.x, pA.z), sB = sueloLocal(sitio, rot, pB.x, pB.z);
        const A = aMundo(sitio, rot, pA.x, pA.z), B = aMundo(sitio, rot, pB.x, pB.z);
        col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.42,
          alturaMin: sitio.y + Math.min(sA, sB) - 0.1, alturaMax: sitio.y + Math.max(sA, sB) + 0.82 });
      }
      const mallaCor = new THREE.Mesh(cor.geometria(), mat);
      mallaCor.position.set(sitio.x, sitio.y, sitio.z);
      mallaCor.rotation.y = rot;
      mallaCor.castShadow = true; mallaCor.receiveShadow = true;
      grupo.add(mallaCor);

      // ---------- molino australiano y tanque ----------
      const posMol = w(-11, -9);
      const yMol = T.altura(posMol.x, posMol.z);
      const mol = new Constructor();
      const alturaMol = 6.4;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const sueloPata = T.altura(posMol.x + sx * 1.15, posMol.z + sz * 1.15) - yMol;
        cilindroEntre(mol, [sx * 1.15, sueloPata - 0.16, sz * 1.15], [sx * 0.24, alturaMol, sz * 0.24], 0.07, '#5f5a52');
        mol.agregar(new THREE.IcosahedronGeometry(0.22, 0), { color: '#77736b', tipo: 4, variar: 0.12,
          matriz: matriz([sx * 1.15, sueloPata + 0.04, sz * 1.15], [0.1, sx * sz, 0.05], [1.15, 0.55, 0.95]) });
      }
      for (const yy of [1.6, 3.2, 4.8]) {
        const r2 = 1.15 - (yy / alturaMol) * 0.9;
        for (let i = 0; i < 4; i++) {
          const a1 = [[-1, -1], [1, -1], [1, 1], [-1, 1]][i], a2 = [[1, -1], [1, 1], [-1, 1], [-1, -1]][i];
          cilindroEntre(mol, [a1[0] * r2, yy, a1[1] * r2], [a2[0] * r2, yy, a2[1] * r2], 0.04, '#5f5a52');
        }
      }
      cilindroEntre(mol, [0, alturaMol, 0], [0, alturaMol + 0.5, 0], 0.12, '#5f5a52');
      const mallaMol = new THREE.Mesh(mol.geometria(), mat);
      mallaMol.castShadow = true;
      const torreMol = new THREE.Group();
      torreMol.position.set(posMol.x, yMol, posMol.z);
      torreMol.add(mallaMol);
      // rueda de muchas paletas y timón
      const rue = new Constructor();
      rue.agregar(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 10), { color: '#4e4a44', tipo: 4, matriz: matriz([0, 0, 0], [Math.PI / 2, 0, 0]) });
      for (let i = 0; i < 18; i++) {
        const a1 = (i / 18) * Math.PI * 2;
        rue.agregar(new THREE.BoxGeometry(0.34, 0.9, 0.05), { color: i % 2 ? '#c9c3b6' : '#b9b2a4', tipo: 4, variar: 0.08,
          matriz: matriz([Math.cos(a1) * 1.25, Math.sin(a1) * 1.25, 0.12], [0, 0.35, a1 + Math.PI / 2]) });
      }
      rue.agregar(new THREE.TorusGeometry(1.7, 0.035, 4, 20), { color: '#8a8378', tipo: 4, matriz: matriz([0, 0, 0.05]) });
      const rueda = new THREE.Mesh(rue.geometria(), mat);
      const ejeMol = new THREE.Group();
      ejeMol.position.set(0, alturaMol + 0.6, 0);
      ejeMol.add(rueda);
      const timon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 1.8), new THREE.MeshLambertMaterial({ color: 0xb9b2a4 }));
      timon.position.set(0, 0.1, -1.7);
      ejeMol.add(timon);
      torreMol.add(ejeMol);
      grupo.add(torreMol);
      col.agregar({ x: posMol.x, z: posMol.z, r: 1.4,
        alturaMin: yMol - 0.2, alturaMax: yMol + alturaMol + 1.3 });
      // tanque australiano: chapa redonda con agua
      const tan = new Constructor();
      // 3.0.1: el tanque (6 m de diámetro) estaba metido 2,4 m adentro del cobertizo: un
      // poste y los cajones quedaban en el agua. Va al costado del molino, afuera del
      // cobertizo y del corral. Se apoya por encima del punto más alto de su borde y la
      // base de mampostería baja hasta el más bajo: en la ladera ya no queda colgado.
      const posTan = w(-15, -6.5);
      let yTanMin = Infinity, yTanMax = -Infinity;
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2, h = T.altura(posTan.x + Math.cos(a) * 3.3, posTan.z + Math.sin(a) * 3.3);
        yTanMin = Math.min(yTanMin, h); yTanMax = Math.max(yTanMax, h);
      }
      const yTan = Math.max(T.altura(posTan.x, posTan.z), yTanMax - 0.2);
      // Base enterrada: evita el anillo de luz bajo el tanque cuando el terreno
      // varía unos centímetros dentro de sus más de seis metros de diámetro.
      const bajoTan = Math.max(0.37, yTan - yTanMin + 0.12);
      tan.agregar(new THREE.CylinderGeometry(3.16, 3.38, bajoTan + 0.21, 18), { color: '#676b66', tipo: 4, variar: 0.07, matriz: matriz([0, (0.21 - bajoTan) / 2, 0]) });
      tan.agregar(new THREE.CylinderGeometry(3.1, 3.1, 1.5, 18, 1, true), { color: '#7f8a84', tipo: 4, variar: 0.08, matriz: matriz([0, 0.75, 0]) });
      tan.agregar(new THREE.TorusGeometry(3.1, 0.08, 5, 20), { color: '#6e7873', tipo: 4, matriz: matriz([0, 1.5, 0], [Math.PI / 2, 0, 0]) });
      const mallaTan = new THREE.Mesh(tan.geometria(), mat);
      mallaTan.position.set(posTan.x, yTan, posTan.z);
      mallaTan.castShadow = true; mallaTan.receiveShadow = true;
      grupo.add(mallaTan);
      const agua = new THREE.Mesh(new THREE.CircleGeometry(3.0, 18), new THREE.MeshLambertMaterial({ color: 0x486a72 }));
      agua.rotation.x = -Math.PI / 2;
      agua.position.set(posTan.x, yTan + 1.15, posTan.z);
      grupo.add(agua);
      col.agregar({ x: posTan.x, z: posTan.z, r: 3.2,
        alturaMin: yTan - bajoTan - 0.05, alturaMax: yTan + 1.65 });
      // Caño del molino al tanque. Antes tenía 4.2 m fijos y altura fija,
      // aunque los dos equipos pueden quedar a cotas diferentes: terminaba
      // flotando o entrando por debajo del tanque.
      {
        const cañ = new Constructor();
        const distTan = Math.hypot(posTan.x - posMol.x, posTan.z - posMol.z);
        cilindroEntre(cañ, [0, 0.72, 0], [0, (yTan - yMol) + 0.72, distTan], 0.07, '#6e7873');
        const m2 = new THREE.Mesh(cañ.geometria(), mat);
        m2.position.set(posMol.x, yMol, posMol.z);
        m2.rotation.y = Math.atan2(posTan.x - posMol.x, posTan.z - posMol.z);
        m2.castShadow = true;
        grupo.add(m2);
      }

      const puerta = w(0, -D / 2 - 3);
      const banco = w(BANCO_GAL_LX, BANCO_GAL_LZ);
      sentaderos.push({ x: banco.x, z: banco.z, y: sitio.y + yBancoGal + 0.06, nombre: 'el banco del galpón', mira: rot + Math.PI });
      if (puertas) puertas.agregarCorrediza({ sitio: { x: sitio.x, z: sitio.z, y: sitio.y, piso: 0.4 }, rot, lx: 0, lz: -D / 2 - 0.26, ancho: 3.0, alto: 2.9, lado: -1, nombre: 'el portón del galpón' });
      galpon = { x: sitio.x, z: sitio.z, y: sitio.y, rot, nombre: 'Galpón de Esquila', vidrio, luz, interior, puerta, radio: 24,
        molino: ejeMol, agua: { x: posTan.x, z: posTan.z } };
      T.lugares.galpon = galpon;
      registrarHuella('galpon', galpon, galpon.radio, 7);
      const cc = w(-4.5, -D / 2 - 4.5);
      cartel('Galpón de Esquila', cc.x, cc.z, rot + Math.PI);
    }
  }

  // ---------------------------------------------------------------- complejos estructurales RC31
  // Cada edificio importante se convierte en una unidad de visibilidad. Varias
  // estructuras históricas se construyen con nodos separados (malla principal,
  // luces, mecanismos, tanque, caño, escalera, cartel, etc.). Si el LOD/culling
  // actúa sobre esos nodos de forma independiente aparecen piezas flotantes.
  // El agrupado se hace al final y usa un padre identidad, por lo que NO cambia
  // coordenadas, colisiones ni referencias ya guardadas a las piezas móviles.
  const conjuntos = [];
  let personal = null;
  {
    const defs = [
      ['refugio', L.refugio, 15.5],
      ['muelle', L.muelle, 15.5],
      ['puente', L.puente, 16.5],
      ['mirador', L.mirador, 11.5],
      ['cabana', L.cabana, (L.cabana?.radio || 6.2) + 2.2],
      ['puesto', L.puesto, (L.puesto?.radio || 6.2) + 2.2],
      ['faro', faro, (faro?.radio || 6.2) + 3.0],
      ['molino', molino, (molino?.radio || 7.5) + 2.5],
      ['casa-te', casaTe, (casaTe?.radio || 7.5) + 2.6],
      ['torre', torre, (torre?.radio || 10) + 2.0],
      ['cueva', cueva, (cueva?.radio || 9) + 2.5],
      ['almacen', almacen, (almacen?.radio || 9) + 2.5],
      ['galpon', galpon, (galpon?.radio || 24) + 2.5],
    ].filter(([, lugar]) => lugar && Number.isFinite(lugar.x) && Number.isFinite(lugar.z));

    const originales = [...grupo.children];
    const asignacion = new Map();
    for (const nodo of originales) {
      // Object3D sin geometría (por ejemplo el target del faro) puede vivir
      // lejos del edificio; se añade como extra explícito más abajo.
      if (!Number.isFinite(nodo.position?.x) || !Number.isFinite(nodo.position?.z)) continue;
      let mejor = null, mejorD = Infinity;
      for (const def of defs) {
        const [, lugar, radio] = def;
        const d = Math.hypot(nodo.position.x - lugar.x, nodo.position.z - lugar.z);
        if (d <= radio && d < mejorD) { mejor = def; mejorD = d; }
      }
      if (mejor) asignacion.set(nodo, mejor[0]);
    }

    const extras = new Map();
    if (faro?.blanco) extras.set(faro.blanco, 'faro');

    for (const [clave, lugar, radio] of defs) {
      const raiz = new THREE.Group();
      raiz.name = `estructura:${clave}`;
      raiz.userData.estructuraRaiz = true;
      raiz.userData.claveEstructura = clave;
      raiz.userData.x = lugar.x;
      raiz.userData.z = lugar.z;
      raiz.userData.radioEstructura = radio;
      grupo.add(raiz);
      for (const nodo of originales) if (asignacion.get(nodo) === clave) raiz.attach(nodo);
      for (const [nodo, k] of extras) if (k === clave && nodo.parent === grupo) raiz.attach(nodo);
      // Un complejo vacío no sirve como entrada de LOD. En la práctica esto
      // sólo protege futuras estructuras opcionales que no hayan generado malla.
      if (!raiz.children.length) { grupo.remove(raiz); continue; }
      conjuntos.push({ clave, obj: raiz, x: lugar.x, z: lugar.z, radio });
    }

    // Antes de colgar las puertas: juntar lo que no se mueve. Cada poste de corral,
    // cada tranquera suelta y cada pilote era una llamada de dibujo entera para doce
    // triángulos. Va acá, antes de que se enganchen las puertas y los postigos, para
    // que las hojas que giran no entren en la fusión.
    fusionados = fusionarPorMaterial(grupo);

    // 2.8: lo que elegís para tu refugio en Personalizar (pintura, adentro, afuera y el
    // mástil de tu bandera). Cuelga del complejo del refugio: el LOD lo apaga con él.
    // Va después de fusionar (sus mallas no se juntan con nada) y antes de fijar las matrices.
    const raizRefugio = conjuntos.find((k) => k.clave === 'refugio')?.obj || grupo;
    personal = crearDecoRefugio({ T, col, ref: L.refugio, raiz: raizRefugio, mat, pintable: pinturaRefugio,
      vidrioFarol: L.refugio.farol?.vidrio || null, puertas });

    // Las puertas y postigos estáticos se crean en `puertas.js` y originalmente
    // quedaban colgados directamente de la escena. Eso permitía que una hoja
    // oscura siguiera dibujándose cuando el edificio ya no estaba visible: el
    // rectángulo negro flotante que se observó en RC30. Las puertas de obras del
    // jugador (`duenio`) se excluyen porque tienen ciclo de vida independiente.
    for (const puerta of puertas?.lista || []) {
      if (puerta.duenio || !puerta.g) continue;
      let mejor = null, mejorD = Infinity;
      for (const conj of conjuntos) {
        const d = Math.hypot(puerta.x - conj.x, puerta.z - conj.z);
        if (d <= conj.radio + 3.0 && d < mejorD) { mejor = conj; mejorD = d; }
      }
      if (mejor) {
        // 3.0.1: attach() recompone el giro desde la matriz, y un giro en Y de más de
        // 90° vuelve como (π, π − giro, π). Las puertas animan sólo `rotation.y` y la
        // colisión lo lee como su ángulo: en el refugio y el faro la hoja abría espejada
        // y la cerrada no tapaba el vano. La raíz es identidad: se deja el giro en limpio.
        const giroPuerta = puerta.g.rotation.y;
        mejor.obj.attach(puerta.g); // conserva la transformación mundial aunque cambie la jerarquía
        puerta.g.rotation.set(0, giroPuerta, 0);
        puerta.estructuraClave = mejor.clave;
      }
    }

    // 2.7.3: lo que no se mueve calcula su matriz una sola vez. Los edificios quedan
    // quietos desde acá; lo único que se mueve después es lo que el juego anima por
    // su nombre: las aspas y la rueda del molino, la rueda del galpón (se la busca
    // como `molino.children[0]`), la lente del faro y el blanco de su haz, y las
    // puertas y postigos (su bisagra, el portón que corre y el pivote de cada hojita).
    // Esos siguen recalculándose en cada cuadro exactamente como antes.
    const moviles = new Set([molino?.aspas, molino?.rueda, faro?.lente, faro?.blanco,
      galpon?.molino, ...(galpon?.molino?.children || [])]);
    for (const p of puertas?.lista || []) {
      moviles.add(p.g);
      if (p.hoja) moviles.add(p.hoja);
      for (const h of p.hojas || []) moviles.add(h.piv);
    }
    grupo.traverse((o) => {
      if (moviles.has(o)) return;
      o.updateMatrix();
      o.matrixAutoUpdate = false;
    });
  }
  armado = true;
  // 2.7.3: el repaso de matrices salta los complejos apagados por el LOD (ver
  // `repasoSinOcultos`): de los ~250 objetos de las estructuras, tres de cada cuatro
  // están lejos y ocultos, y se recalculaban igual en cada cuadro.
  repasoSinOcultos(grupo);
  // 2.7.4: las luces de los edificios se anotan: cuando el LOD está por mostrar u ocultar
  // uno, los programas de la cantidad nueva de luces se compilan antes (ver luces.js)
  grupo.traverse((o) => { if (o.isLight) registrarLuz(o); });

  // 2.8: `personal` lleva lo de Personalizar → Tu refugio al mundo; `mastil` es el palo de la
  // bandera (su `grupo` es la punta, donde se cuelga el paño, y `tope` su lugar en el mundo)
  // 3.0.1: `col` viaja con las estructuras: objetos.js mira que no haya una pared entre vos y el asiento
  // 3.6: `lugaresSorteo`: dónde había caído la casa de té y el almacén en el sorteo (con la aldea
  // ahí no hay nada; trochita.js lo usa para saber cómo se llamaba antes cada parada)
  return { grupo, conjuntos, sentaderos, carteles, mat, cabañas, faro, molino, casaTe, torre, galpon, almacen, cueva, cartel, fusionados: () => fusionados,
    personal, mastil: personal?.mastil || null, col, lugaresSorteo: enAldea ? { 'casa-te': casaTeSorteo, almacen: almacenSorteo } : null };
}
