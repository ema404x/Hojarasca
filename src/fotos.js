// Desafíos de fotos: cada foto se revisa para ver qué quedó en cuadro
import * as THREE from 'three';
import { LAGO } from './config.js';

export const DESAFIOS = [
  { id: 'f-pudu', nombre: 'Un pudú', texto: 'Fotografiá un pudú de cerca, antes de que se escape.', pista: 'Agachate y acercate despacio.' },
  { id: 'f-huemul', nombre: 'El huemul con poca luz', texto: 'Un huemul al amanecer o al atardecer.', pista: 'Buscalo en lo alto, cuando el sol está bajo.' },
  { id: 'f-zorro', nombre: 'Zorro en el sendero', texto: 'Un zorro colorado que se detiene a mirarte.', pista: 'Caminá el sendero cuando cae la noche.' },
  { id: 'f-carpintero', nombre: 'Carpintero en su tronco', texto: 'Un carpintero gigante golpeando un árbol.', pista: 'Seguí el golpeteo doble y usá los prismáticos.' },
  { id: 'f-cisnes', nombre: 'Cisnes en el lago', texto: 'Cisnes de cuello negro nadando.', pista: 'Desde la orilla o, mejor, desde el kayak.' },
  { id: 'f-condor', nombre: 'Un cóndor planeando', texto: 'Un cóndor en vuelo sobre el bosque.', pista: 'Mirá hacia arriba desde el mirador, con los prismáticos.' },
  { id: 'f-picaflor', nombre: 'Picaflor en el chilco', texto: 'Un picaflor rubí suspendido en el aire.', pista: 'Quedate quieto junto a un chilco.' },
  { id: 'f-pato', nombre: 'Pato de los torrentes', texto: 'Un pato de los torrentes en su piedra.', pista: 'Donde el arroyo baja con más fuerza.' },
  { id: 'f-bandurrias', nombre: 'Bandurrias en el pastizal', texto: 'La bandada de bandurrias buscando comida.', pista: 'En los claros abiertos, sin espantarlas.' },
  { id: 'f-trucha', nombre: 'Antes de devolverla', texto: 'Un pez recién sacado del agua, en tu mano.', pista: 'Sacá la foto apenas lo atrapás.' },
  { id: 'f-atardecer', nombre: 'Atardecer desde el muelle', texto: 'El lago con la última luz del día.', pista: 'Desde el muelle, mirando al lago, poco antes de las nueve de la noche.' },
  { id: 'f-luna', nombre: 'La luna sobre el lago', texto: 'La luna en el cielo, con el lago cerca.', pista: 'De noche, en la orilla.' },
  { id: 'f-cordillera', nombre: 'La cordillera', texto: 'Las montañas del oeste desde el mirador.', pista: 'En el Mirador del Pehuén, mirando al oeste.' },
  { id: 'f-fogata', nombre: 'Noche de fogata', texto: 'Una fogata encendida en plena noche.', pista: 'Hacé fuego después de que oscurezca.' },
  { id: 'f-otono', nombre: 'Lengas en otoño', texto: 'Una lenga con las hojas rojas.', pista: 'Elegí el otoño en los ajustes.' },
  { id: 'f-nieve', nombre: 'El refugio nevado', texto: 'El Refugio del Arroyo cubierto de nieve.', pista: 'Elegí el invierno en los ajustes.' },
  { id: 'f-ciervo', nombre: 'El bramido', texto: 'Un ciervo colorado macho, con su cornamenta.', pista: 'En otoño braman seguido; seguí el sonido.' },
  { id: 'f-manganga', nombre: 'Mangangá en la flor', texto: 'El abejorro anaranjado sobre un chilco o un amancay.', pista: 'Quedate quieto junto a un arbusto florecido al mediodía.' },
  { id: 'f-panal', nombre: 'El panal', texto: 'La colmena en el tronco hueco, con las abejas afuera.', pista: 'Buscá el zumbido en un coihue grande. No te acerques demasiado.' },
  { id: 'f-coipo', nombre: 'Coipo en el agua', texto: 'Un coipo nadando antes de zambullirse.', pista: 'Bordeá la orilla del lago sin hacer ruido.' },
  { id: 'f-murcielago', nombre: 'Caza nocturna', texto: 'Un murciélago en pleno vuelo.', pista: 'Justo cuando se va la última luz, mirá hacia arriba.' },
  { id: 'f-faro', nombre: 'El faro encendido', texto: 'La torre del faro con la luz girando, de noche.', pista: 'Del otro lado del lago; también se ve desde el kayak.' },
  { id: 'f-cabana', nombre: 'Humo en la cabaña', texto: 'Una cabaña con la ventana encendida y humo en la chimenea.', pista: 'Cualquiera de las dos cabañas aisladas, al caer la noche.' },
  { id: 'f-molino', nombre: 'Las aspas girando', texto: 'El molino de viento entero, con sus cuatro aspas.', pista: 'Alejate un poco para que entre completo.' },
  { id: 'f-torre', nombre: 'Desde la torre', texto: 'La vista del bosque desde arriba de la torre de guardaparques.', pista: 'Subí la escalera y sacá la foto desde el piso de arriba.' },
  { id: 'f-tren', nombre: 'La trochita echando humo', texto: 'El tren a vapor en marcha, con la locomotora en cuadro.', pista: 'Esperalo cerca de la vía: pasa cada tanto y silba antes de llegar.' },
  { id: 'f-galpon', nombre: 'Lana y viento', texto: 'El galpón de esquila con el molino australiano girando.', pista: 'Alejate para que entren los dos en el cuadro.' },
  { id: 'f-manos', nombre: 'Las manos', texto: 'La pared pintada de la cueva, con las manos en negativo.', pista: 'Metete adentro del alero y encuadrá la pared del fondo.' },
  { id: 'f-cascada', nombre: 'El salto', texto: 'La cascada del arroyo, con la poza abajo.', pista: 'Bajá hasta la poza y mirá para arriba.' },
  { id: 'f-kayak', nombre: 'En medio del lago', texto: 'Una foto desde el kayak, lejos de la orilla.', pista: 'Subí al kayak en el muelle.' },
  // 2.3: lo que asoma en el lago (ver `cuentos.js`)
  { id: 'f-nahuelito', nombre: 'Algo en el lago', texto: 'Eso que asomó una noche de luna, antes de hundirse.', pista: 'Después de oír las historias del lago, una noche clara, desde la orilla. Hay que tener suerte.' },
];

export function crearFotos(T, camara) {
  const ndc = new THREE.Vector3(), dir = new THREE.Vector3();
  const miniatura = document.createElement('canvas');
  miniatura.width = 320; miniatura.height = 180;

  function enCuadro(pos, maxDist, margen = 0.85) {
    const d = camara.position.distanceTo(pos);
    if (d > maxDist) return false;
    ndc.copy(pos).project(camara);
    return ndc.z < 1 && Math.abs(ndc.x) < margen && Math.abs(ndc.y) < margen;
  }

  // qué desafíos cumple esta foto
  function evaluar(c) {
    camara.getWorldDirection(dir);
    const L = T.lugares;
    const h = c.horas;
    const animal = (tipo, dist) => c.sujetos.some((s) => s.tipo === tipo && enCuadro(s.pos, dist * (c.zoom ? 3 : 1)));
    const cerca = (l, r) => Math.hypot(camara.position.x - l.x, camara.position.z - l.z) < r;
    const haciaLago = () => {
      const lx = LAGO.x - camara.position.x, lz = LAGO.z - camara.position.z, l = Math.hypot(lx, lz) || 1;
      return (dir.x * lx + dir.z * lz) / l > 0.5;
    };
    const orilla = Math.abs(Math.hypot(camara.position.x - LAGO.x, camara.position.z - LAGO.z) - T.radioLago(Math.atan2(camara.position.z - LAGO.z, camara.position.x - LAGO.x)) * 0.95);
    const cumple = {
      'f-pudu': animal('pudu', 18),
      'f-huemul': animal('huemul', 45),
      'f-zorro': animal('zorro', 30),
      'f-carpintero': animal('carpintero', 25),
      'f-cisnes': animal('cisne', 60),
      'f-condor': animal('condor', 250),
      'f-picaflor': animal('picaflor', 5),
      'f-pato': animal('pato', 30),
      'f-bandurrias': animal('bandurria', 40),
      'f-trucha': c.pezEnMano,
      'f-atardecer': cerca(L.muelle.punta || L.muelle, 32) && h > 19.4 && h < 21.3 && haciaLago(),
      'f-luna': c.noche > 0.7 && c.lunaDir && dir.dot(c.lunaDir) > 0.9 && orilla < 45,
      'f-cordillera': cerca(L.mirador, 20) && dir.x < -0.55 && c.noche < 0.5,
      'f-fogata': c.noche > 0.6 && c.fogata && enCuadro(c.fogata, 16),
      'f-otono': c.otono > 0.9 && c.arboles.some((a) => a.especie === 'lenga' && Math.hypot(a.x - camara.position.x, a.z - camara.position.z) < 35 && enCuadro(new THREE.Vector3(a.x, a.y + 9, a.z), 35, 0.9)),
      'f-nieve': c.invierno > 0.9 && enCuadro(new THREE.Vector3(L.refugio.x, L.refugio.y + 2, L.refugio.z), 90),
      'f-ciervo': animal('ciervo', 60),
      'f-manganga': animal('manganga', 5),
      'f-panal': animal('panal', 14),
      'f-coipo': animal('coipo', 30),
      'f-murcielago': animal('murcielago', 28),
      'f-faro': c.noche > 0.55 && L.faro && enCuadro(new THREE.Vector3(L.faro.x, L.faro.y + L.faro.alto, L.faro.z), 220),
      'f-cabana': c.noche > 0.5 && ['cabana', 'puesto'].some((k) => L[k] && enCuadro(new THREE.Vector3(L[k].x, L[k].y + 2, L[k].z), 55)),
      'f-molino': L.molino && enCuadro(new THREE.Vector3(L.molino.x, L.molino.y + 7, L.molino.z), 60) && Math.hypot(camara.position.x - L.molino.x, camara.position.z - L.molino.z) > 12,
      'f-torre': L.torre && camara.position.y > L.torre.y + L.torre.alto - 0.5 && Math.hypot(camara.position.x - L.torre.x, camara.position.z - L.torre.z) < 5,
      'f-tren': c.tren && c.tren.vel > 0.5 && enCuadro(new THREE.Vector3(c.tren.pos.x, c.tren.pos.y + 1.5, c.tren.pos.z), 130),
      'f-galpon': L.galpon && enCuadro(new THREE.Vector3(L.galpon.x, L.galpon.y + 3, L.galpon.z), 70) && Math.hypot(camara.position.x - L.galpon.x, camara.position.z - L.galpon.z) > 14,
      'f-manos': L.cueva && Math.hypot(camara.position.x - L.cueva.x, camara.position.z - L.cueva.z) < 9 && enCuadro(new THREE.Vector3(L.cueva.pared.x, L.cueva.y + 1.8, L.cueva.pared.z), 12),
      'f-cascada': c.cascada && enCuadro(new THREE.Vector3(c.cascada.x, c.cascada.y + 3, c.cascada.z), 45),
      'f-kayak': c.enKayak && Math.hypot(camara.position.x - LAGO.x, camara.position.z - LAGO.z) < 70,
      'f-nahuelito': !!c.nahuelito && enCuadro(c.nahuelito, 200 * (c.zoom ? 1.5 : 1)),
    };
    return DESAFIOS.filter((d) => cumple[d.id]).map((d) => d.id);
  }

  function hacerMiniatura(lienzo) {
    const x = miniatura.getContext('2d');
    const r = lienzo.width / lienzo.height;
    let sw = lienzo.width, sh = lienzo.height;
    if (r > 16 / 9) sw = sh * 16 / 9; else sh = sw * 9 / 16;
    x.drawImage(lienzo, (lienzo.width - sw) / 2, (lienzo.height - sh) / 2, sw, sh, 0, 0, 320, 180);
    return miniatura.toDataURL('image/jpeg', 0.72);
  }

  return { evaluar, hacerMiniatura, enCuadro };
}
