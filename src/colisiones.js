// Grilla espacial de obstáculos (círculos y segmentos) y plataformas caminables
const TAM = 8;

export function crearColisiones() {
  const celdas = new Map();
  const plataformas = [];
  // Puertas/portones cambian de posición: no pueden quedar indexados para
  // siempre en la celda donde nacieron. Son pocos, así que se consultan como
  // lista dinámica global en cada resolución cercana.
  const dinamicos = [];

  // Clave exacta de celda. La versión anterior usaba un XOR de dos hashes
  // numéricos; en JavaScript el operador bitwise reduce todo a 32 bits y,
  // dentro del propio mapa de Hojarasca, celdas lejanas como (-63,-61) y
  // (63,61) podían compartir clave. Eso mezclaba obstáculos/plataformas de
  // lugares totalmente distintos y producía colisiones fantasma.
  const clave = (cx, cz) => `${cx},${cz}`;
  // 2.6.1: cada alta/baja invalida los vecindarios 3x3 cacheados más abajo.
  let generacion = 0;
  // 3.5.4: con una coordenada enorme (una partida rota con un 1e308) este recorrido no
  // terminaba nunca (1e308 + 1 === 1e308) y el juego se colgaba al cargar, para siempre. Nada
  // con qué chocar vive tan lejos ni es tan largo: eso no se indexa.
  const LEJOS = 1e5, LARGO_MAX = 4096;
  function meter(obj, x0, z0, x1, z1) {
    if (!(Math.abs(x0) < LEJOS && Math.abs(x1) < LEJOS && Math.abs(z0) < LEJOS && Math.abs(z1) < LEJOS && x1 - x0 < LARGO_MAX && z1 - z0 < LARGO_MAX)) return;
    generacion++;
    for (let cx = Math.floor(x0 / TAM); cx <= Math.floor(x1 / TAM); cx++)
      for (let cz = Math.floor(z0 / TAM); cz <= Math.floor(z1 / TAM); cz++) {
        const k = clave(cx, cz);
        if (!celdas.has(k)) celdas.set(k, []);
        celdas.get(k).push(obj);
      }
  }

  // 2.6.1: dueños con física registrada. Colocar/rehacer una obra nueva llamaba
  // a eliminarPorDuenio y barría toda la grilla aunque no hubiera nada suyo.
  const conDuenio = new Map();   // dueño -> true (Map: admite cualquier clave)
  function agregar(o) {
    if (o.duenio) conDuenio.set(o.duenio, true);
    if (o.dinamico) { dinamicos.push(o); return; }
    if (o.seg) meter(o, Math.min(o.ax, o.bx) - o.r, Math.min(o.az, o.bz) - o.r, Math.max(o.ax, o.bx) + o.r, Math.max(o.az, o.bz) + o.r);
    else meter(o, o.x - o.r, o.z - o.r, o.x + o.r, o.z + o.r);
  }

  // Las construcciones editables registran su física con un dueño estable.
  // Poder retirar por dueño evita colisiones/plataformas fantasma al mover,
  // desmontar o reconstruir una pieza. Los obstáculos del mundo que no tienen
  // `duenio` siguen funcionando exactamente igual.
  function eliminarPorDuenio(duenio) {
    if (!duenio || !conDuenio.has(duenio)) return { obstaculos: 0, plataformas: 0, dinamicos: 0 };
    conDuenio.delete(duenio);
    generacion++;
    let obstaculos = 0, quitadasPlataformas = 0, quitadosDinamicos = 0;
    for (const [k, lista] of celdas) {
      for (let i = lista.length - 1; i >= 0; i--) {
        if (lista[i]?.duenio === duenio) { lista.splice(i, 1); obstaculos++; }
      }
      if (!lista.length) celdas.delete(k);
    }
    for (let i = dinamicos.length - 1; i >= 0; i--) {
      if (dinamicos[i]?.duenio === duenio) { dinamicos.splice(i, 1); quitadosDinamicos++; }
    }
    for (const [k, lista] of celdasPlat) {
      for (let i = lista.length - 1; i >= 0; i--) {
        if (lista[i]?.duenio === duenio) lista.splice(i, 1);
      }
      if (!lista.length) celdasPlat.delete(k);
    }
    for (let i = plataformas.length - 1; i >= 0; i--) {
      if (plataformas[i]?.duenio === duenio) { plataformas.splice(i, 1); quitadasPlataformas++; }
    }
    return { obstaculos, plataformas: quitadasPlataformas, dinamicos: quitadosDinamicos };
  }


  // Retira una referencia física concreta sin tocar el resto de objetos que
  // compartan dueño. Es la operación correcta para elementos dinámicos como
  // puertas: permite destruir/recrear la hoja sin borrar las paredes de la obra.
  function eliminar(objeto) {
    if (!objeto) return false;
    generacion++;
    let quitado = false;
    for (let i = dinamicos.length - 1; i >= 0; i--) {
      if (dinamicos[i] === objeto) { dinamicos.splice(i, 1); quitado = true; }
    }
    for (const [k, lista] of celdas) {
      for (let i = lista.length - 1; i >= 0; i--) {
        if (lista[i] === objeto) { lista.splice(i, 1); quitado = true; }
      }
      if (!lista.length) celdas.delete(k);
    }
    for (const [k, lista] of celdasPlat) {
      for (let i = lista.length - 1; i >= 0; i--) {
        if (lista[i] === objeto) { lista.splice(i, 1); quitado = true; }
      }
      if (!lista.length) celdasPlat.delete(k);
    }
    for (let i = plataformas.length - 1; i >= 0; i--) {
      if (plataformas[i] === objeto) { plataformas.splice(i, 1); quitado = true; }
    }
    return quitado;
  }

  // Rectángulo orientado con altura: muelles, puentes, escalones, pisos
  const celdasPlat = new Map();
  function agregarPlataforma(p) {
    p.cos = Math.cos(p.ang || 0); p.sin = Math.sin(p.ang || 0);
    generacion++;
    if (p.duenio) conDuenio.set(p.duenio, true);
    plataformas.push(p);
    // se indexa en la grilla: con decenas de escalones no conviene recorrerlas todas
    const radio = p.radio !== undefined ? p.radio + 0.5 : Math.hypot(p.largo, p.ancho) / 2 + 0.5;
    if (!(Math.abs(p.x) < LEJOS && Math.abs(p.z) < LEJOS && radio < LARGO_MAX)) return;   // 3.5.4: ver `meter`
    for (let cx = Math.floor((p.x - radio) / TAM); cx <= Math.floor((p.x + radio) / TAM); cx++)
      for (let cz = Math.floor((p.z - radio) / TAM); cz <= Math.floor((p.z + radio) / TAM); cz++) {
        const k = clave(cx, cz);
        if (!celdasPlat.has(k)) celdasPlat.set(k, []);
        celdasPlat.get(k).push(p);
      }
  }

  // 2.6.1: las 9 listas vecinas se arman una vez y se reusan entre pasadas y
  // cuadros mientras el cuerpo siga en la misma celda y la grilla no cambie.
  // Antes cada pasada construía 9 claves de texto nuevas (hasta 90 por cuadro).
  function crearVecindario(mapa) {
    const listas = new Array(9).fill(null);
    let vcx = NaN, vcz = NaN, gen = -1;
    return (cx0, cz0) => {
      if (cx0 !== vcx || cz0 !== vcz || gen !== generacion) {
        let i = 0;
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++)
          listas[i++] = mapa.get(clave(cx0 + dx, cz0 + dz)) || null;
        vcx = cx0; vcz = cz0; gen = generacion;
      }
      return listas;
    };
  }
  const vecinosObstaculos = crearVecindario(celdas);
  const vecinosPlataformas = crearVecindario(celdasPlat);

  function cercanos(x, z) {
    const lista = celdas.get(clave(Math.floor(x / TAM), Math.floor(z / TAM)));
    return lista || [];
  }

  // Empuja un círculo (jugador) fuera de los obstáculos.
  // Se hacen unas pocas pasadas porque en una esquina una pared puede empujar
  // al jugador dentro de otra que ya había sido resuelta. La versión de una
  // sola pasada dejaba penetraciones residuales en marcos y paredes oblicuas.
  let marcaPasada = 0;
  // 2.6.1: antes era una clausura nueva por pasada; ahora devuelve si empujó.
  function empujarLista(lista, pos, radio, pie, cabeza, marca) {
    if (!lista) return false;
    let movio = false;
    for (const o of lista) {
      if (o.__pasada === marca) continue;
      o.__pasada = marca;
      // 3.6.2: lo que despejó una construcción (un árbol o una mata que ya no se ve) no frena. Antes esto se
      // arreglaba sólo en la aldea (bajándole el techo); el resto del valle tenía árboles invisibles que chocaban
      if (o.despejado) continue;
      if (o.alturaMax !== undefined && pie > o.alturaMax + 0.01) continue;
      // Si todo el cuerpo queda por debajo, no hay choque. Antes se
      // comparaban solo los pies con alturaMin y los muebles elevados
      // resultaban atravesables aun cuando el torso los intersectaba.
      if (o.alturaMin !== undefined && cabeza < o.alturaMin - 0.01) continue;
      let cx = o.x, cz = o.z;
      if (o.seg) {
        const abx = o.bx - o.ax, abz = o.bz - o.az;
        const t = Math.max(0, Math.min(1, ((pos.x - o.ax) * abx + (pos.z - o.az) * abz) / (abx * abx + abz * abz || 1)));
        cx = o.ax + abx * t; cz = o.az + abz * t;
      }
      let ddx = pos.x - cx, ddz = pos.z - cz;
      let d = Math.hypot(ddx, ddz);
      const min = o.r + radio;
      if (d < min) {
        // Si el centro del jugador cae exactamente sobre el eje/centro de la
        // colisión, elegimos una normal estable para sacarlo.
        if (d <= 1e-5) {
          if (o.seg) {
            const sx = o.bx - o.ax, sz = o.bz - o.az;
            const sl = Math.hypot(sx, sz) || 1;
            ddx = -sz / sl; ddz = sx / sl;
          } else {
            ddx = 1; ddz = 0;
          }
          d = 1;
        }
        // Un milímetro de "contact slop" evita que el redondeo deje al
        // jugador microscópicamente dentro y vuelva a engancharlo al frame siguiente.
        const objetivo = min + 0.001;
        pos.x = cx + (ddx / d) * objetivo;
        pos.z = cz + (ddz / d) * objetivo;
        movio = true;
      }
    }
    return movio;
  }

  function resolver(pos, radio, alturaCuerpo = 1.65) {
    // El jugador no es un punto a la altura de los pies: para decidir si un
    // obstáculo elevado lo toca usamos su intervalo vertical completo. Esto
    // hace que mesas, mostradores, barandas y dinteles bloqueen correctamente
    // al estar de pie, pero permite pasar por debajo cuando realmente hay
    // altura suficiente (por ejemplo, agachado).
    const pie = pos.y;
    const cabeza = pos.y + Math.max(0.2, alturaCuerpo);
    const MAX_PASADAS = 10;
    for (let pasada = 0; pasada < MAX_PASADAS; pasada++) {
      // 1.4: marca por pasada en lugar de un Set nuevo (sin basura por cuerpo y por cuadro)
      const marca = ++marcaPasada;
      let movio = false;
      const cx0 = Math.floor(pos.x / TAM), cz0 = Math.floor(pos.z / TAM);
      const vecinas = vecinosObstaculos(cx0, cz0);
      for (let i = 0; i < 9; i++) if (empujarLista(vecinas[i], pos, radio, pie, cabeza, marca)) movio = true;
      // La geometría de una puerta puede cruzar un límite de celda o un portón
      // puede desplazarse varios metros. Su posición actual manda, no la de alta.
      if (empujarLista(dinamicos, pos, radio, pie, cabeza, marca)) movio = true;
      if (!movio) break;
    }
  }

  function dentroPlataforma(p, x, z) {
    const dx = x - p.x, dz = z - p.z;
    if (p.radio !== undefined) {
      const d2 = dx * dx + dz * dz;
      if (d2 > p.radio * p.radio) return false;
      if (p.radioInterior !== undefined && d2 < p.radioInterior * p.radioInterior) return false;
      if (p.huecoMedio !== undefined) {
        if (!(p.huecoDesde !== undefined && d2 < p.huecoDesde * p.huecoDesde)) {
          const a = Math.atan2(dx, -dz);
          const d = a - p.huecoCentro;
          const dif = Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
          if (dif < p.huecoMedio) return false;
        }
      }
      return true;
    }
    const lx = dx * p.cos + dz * p.sin, lz = -dx * p.sin + dz * p.cos;
    return Math.abs(lx) <= p.largo / 2 && Math.abs(lz) <= p.ancho / 2;
  }

  // Igual que `dentroPlataforma`, pero considera el radio horizontal del
  // cuerpo. Se usa para cabeza/techos: estar 20 cm afuera con medio cuerpo
  // debajo de una losa sigue siendo una intersección real.
  function solapaPlataforma(p, x, z, radio = 0) {
    if (radio <= 1e-5) return dentroPlataforma(p, x, z);
    const dx = x - p.x, dz = z - p.z;
    if (p.radio !== undefined) {
      const d = Math.hypot(dx, dz);
      if (d > p.radio + radio) return false;
      if (p.radioInterior !== undefined && d < Math.max(0, p.radioInterior - radio)) return false;
      if (p.huecoMedio !== undefined) {
        const desde = p.huecoDesde ?? 0;
        // Sólo queda realmente dentro del hueco si TODO el círculo corporal
        // cabe tanto radial como angularmente dentro de él.
        if (d - radio >= desde && d > radio + 1e-5) {
          const a = Math.atan2(dx, -dz);
          const delta = a - p.huecoCentro;
          const dif = Math.abs(Math.atan2(Math.sin(delta), Math.cos(delta)));
          const margen = Math.asin(Math.min(0.999, radio / d));
          if (dif + margen < p.huecoMedio) return false;
        }
      }
      return true;
    }
    const lx = dx * p.cos + dz * p.sin, lz = -dx * p.sin + dz * p.cos;
    return Math.abs(lx) <= p.largo / 2 + radio && Math.abs(lz) <= p.ancho / 2 + radio;
  }

  // Plataforma que puede sostener los pies. `subidaMaxima` limita cuánto se
  // permite "subir de un paso" en esta consulta. Es crucial durante un salto:
  // antes, cualquier piso hasta 60 cm POR ENCIMA de los pies se consideraba
  // suelo y podía teletransportar al jugador a través de un entrepiso.
  function plataformaEn(x, z, yPies, subidaMaxima = null) {
    let mejor = null;
    const lista = celdasPlat.get(clave(Math.floor(x / TAM), Math.floor(z / TAM)));
    if (!lista) return null;
    for (const p of lista) {
      if (!dentroPlataforma(p, x, z)) continue;
      const pasoPropio = p.escalonMax !== undefined ? p.escalonMax : 0.6;
      const pasoMax = subidaMaxima === null ? pasoPropio : Math.min(pasoPropio, Math.max(0, subidaMaxima));
      if (p.alto <= yPies + pasoMax + 0.01 || p.siempre) {
        if (!mejor || p.alto > mejor.alto) mejor = p;
      }
    }
    return mejor;
  }

  // Cara inferior de la primera plataforma que intercepta la cabeza al subir.
  // Los pisos son sólidos por abajo: ya no se puede saltar a través de un
  // entrepiso y aparecer mágicamente sobre él.
  function techoEntre(x, z, cabezaAntes, cabezaDespues, radio = 0.35) {
    if (cabezaDespues <= cabezaAntes + 1e-5) return null;
    const lista = celdasPlat.get(clave(Math.floor(x / TAM), Math.floor(z / TAM)));
    if (!lista) return null;
    // 2.6.1: un solo objeto al final, no uno por candidata
    let mejorP = null, mejorAbajo = Infinity;
    for (const p of lista) {
      if (p.sinTecho || !solapaPlataforma(p, x, z, radio)) continue;
      const espesor = Math.max(0.02, p.espesor ?? 0.12);
      const abajo = p.alto - espesor;
      if (abajo <= cabezaAntes + 0.01 || abajo > cabezaDespues + 0.01) continue;
      if (!mejorP || abajo < mejorAbajo) { mejorP = p; mejorAbajo = abajo; }
    }
    return mejorP ? { plataforma: mejorP, abajo: mejorAbajo } : null;
  }

  // Impide caminar horizontalmente a través del canto de una plataforma cuando
  // su cara superior es demasiado alta para subirse y su intradós invade el
  // volumen del cuerpo. Antes, las plataformas sólo existían como "suelo" y
  // "techo": el lateral de un entrepiso/andén bajo podía atravesarse.
  function resolverPlataformas(pos, radio, alturaCuerpo = 1.65, pasoMaximo = 0.62) {
    const cabeza = pos.y + Math.max(0.2, alturaCuerpo);
    const MAX_PASADAS = 5;
    for (let pasada = 0; pasada < MAX_PASADAS; pasada++) {
      let movio = false;
      const marca = ++marcaPasada;
      const cx0 = Math.floor(pos.x / TAM), cz0 = Math.floor(pos.z / TAM);
      const vecinas = vecinosPlataformas(cx0, cz0);
      for (let iv = 0; iv < 9; iv++) {
        const lista = vecinas[iv];
        if (!lista) continue;
        for (const p of lista) {
          if (p.__pasada === marca || p.sinLaterales) continue;
          p.__pasada = marca;
          const espesor = Math.max(0.02, p.espesor ?? 0.12);
          const abajo = p.alto - espesor;
          const pasoPropio = p.escalonMax !== undefined ? p.escalonMax : pasoMaximo;
          const paso = Math.min(pasoMaximo, Math.max(0, pasoPropio));
          // Si el tope está al alcance de un paso, la plataforma se resuelve
          // verticalmente como escalón. Si el cuerpo cabe por debajo, tampoco
          // debe bloquear horizontalmente.
          if (p.alto <= pos.y + paso + 0.02 || abajo >= cabeza - 0.01 || p.alto <= pos.y + 0.03) continue;

          const dx = pos.x - p.x, dz = pos.z - p.z;
          if (p.radio !== undefined) {
            const dist = Math.hypot(dx, dz);
            const exterior = p.radio + radio;
            const interior = Math.max(0, (p.radioInterior ?? 0) - radio);
            if (dist >= exterior || (p.radioInterior !== undefined && dist <= interior)) continue;
            // Los huecos angulares reales (escaleras) siguen siendo huecos:
            // no queremos crear una pared invisible cruzándolos.
            if (p.huecoMedio !== undefined && dist > (p.huecoDesde ?? 0) - radio) {
              const a = Math.atan2(dx, -dz);
              const d = a - p.huecoCentro;
              const dif = Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
              if (dif < p.huecoMedio) continue;
            }
            // Disco: expulsar hacia afuera. Anillo: elegir el borde más cercano.
            const safe = dist > 1e-5 ? dist : 1;
            if (p.radioInterior !== undefined) {
              const penExt = exterior - dist;
              const bordeInterior = p.radioInterior - radio;
              const penInt = dist - bordeInterior;
              if (bordeInterior > 0 && penInt < penExt) {
                const objetivo = Math.max(0, bordeInterior - 0.001);
                pos.x = p.x + dx / safe * objetivo; pos.z = p.z + dz / safe * objetivo;
              } else {
                const objetivo = exterior + 0.001;
                const nx = dist > 1e-5 ? dx / dist : 1, nz = dist > 1e-5 ? dz / dist : 0;
                pos.x = p.x + nx * objetivo; pos.z = p.z + nz * objetivo;
              }
            } else {
              const objetivo = exterior + 0.001;
              const nx = dist > 1e-5 ? dx / dist : 1, nz = dist > 1e-5 ? dz / dist : 0;
              pos.x = p.x + nx * objetivo; pos.z = p.z + nz * objetivo;
            }
            movio = true;
            continue;
          }

          // Rectángulo orientado: resolver contra el rectángulo expandido por
          // el radio del jugador y expulsar por la cara más cercana.
          const lx = dx * p.cos + dz * p.sin, lz = -dx * p.sin + dz * p.cos;
          const hx = p.largo / 2 + radio, hz = p.ancho / 2 + radio;
          if (Math.abs(lx) >= hx || Math.abs(lz) >= hz) continue;
          const penX = hx - Math.abs(lx), penZ = hz - Math.abs(lz);
          let nlx = lx, nlz = lz;
          if (penX < penZ) nlx = (lx >= 0 ? 1 : -1) * (hx + 0.001);
          else nlz = (lz >= 0 ? 1 : -1) * (hz + 0.001);
          pos.x = p.x + nlx * p.cos - nlz * p.sin;
          pos.z = p.z + nlx * p.sin + nlz * p.cos;
          movio = true;
        }
      }
      if (!movio) break;
    }
  }

  // Sirve para ponerse de pie y para validar un step-up. Si hay un piso cuyo
  // intradós atraviesa el volumen corporal solicitado, el espacio no alcanza.
  function espacioVerticalLibre(x, z, yPies, alturaCuerpo, radio = 0.35) {
    const lista = celdasPlat.get(clave(Math.floor(x / TAM), Math.floor(z / TAM)));
    if (!lista) return true;
    const cabeza = yPies + Math.max(0.2, alturaCuerpo);
    for (const p of lista) {
      if (p.sinTecho || !solapaPlataforma(p, x, z, radio)) continue;
      const abajo = p.alto - Math.max(0.02, p.espesor ?? 0.12);
      // Ignora la plataforma que está debajo de los pies; bloquea sólo techos.
      if (abajo > yPies + 0.05 && abajo < cabeza - 0.01) return false;
    }
    return true;
  }

  // 3.0.1: ¿una pared (o una puerta cerrada, o un alambrado) corta la línea entre dos
  // puntos a la altura `y`? Los bancos, las camas y los asientos se ofrecían con E a
  // dos metros sin mirar qué había en el medio: la cama del refugio se usaba desde
  // afuera y el banco de la galería desde adentro, atravesando la pared.
  // Sólo cuentan los segmentos gruesos (r ≥ 0,13): barandas y muebles no tapan.
  const cruzan = (ax, az, bx, bz, cx, cz, dx, dz) => {
    const d1 = (bx - ax) * (cz - az) - (bz - az) * (cx - ax), d2 = (bx - ax) * (dz - az) - (bz - az) * (dx - ax);
    const d3 = (dx - cx) * (az - cz) - (dz - cz) * (ax - cx), d4 = (dx - cx) * (bz - cz) - (dz - cz) * (bx - cx);
    return d1 * d2 < 0 && d3 * d4 < 0;
  };
  // `y1` (opcional): la pared tapa si su alto se cruza con el tramo [y, y1] (el cuerpo).
  // `conPuertas`: si cuentan las hojas de las puertas (las que se mueven). `ignorar`: un
  // dueño cuya física no cuenta (la obra que se quiere usar no se tapa a sí misma).
  function paredEntre(ax, az, bx, bz, y, y1 = y, conPuertas = true, ignorar = null) {
    // (las hojas de puerta cuentan aunque sean finas: cerradas son pared)
    const tapa = (o, esPuerta = false) => o.seg && (esPuerta || o.r >= 0.13) && (ignorar === null || o.duenio !== ignorar)
      && !(o.alturaMin !== undefined && y1 < o.alturaMin) && !(o.alturaMax !== undefined && y > o.alturaMax)
      && cruzan(ax, az, bx, bz, o.ax, o.az, o.bx, o.bz);
    // 3.5.4: un tramo con una punta lejísimos (o en NaN) no se recorre celda por celda (ver `meter`)
    if (!(Math.abs(ax) < LEJOS && Math.abs(bx) < LEJOS && Math.abs(az) < LEJOS && Math.abs(bz) < LEJOS && Math.abs(bx - ax) < LARGO_MAX && Math.abs(bz - az) < LARGO_MAX)) return false;
    for (let cx = Math.floor(Math.min(ax, bx) / TAM); cx <= Math.floor(Math.max(ax, bx) / TAM); cx++)
      for (let cz = Math.floor(Math.min(az, bz) / TAM); cz <= Math.floor(Math.max(az, bz) / TAM); cz++) {
        const lista = celdas.get(clave(cx, cz));
        if (lista) for (const o of lista) if (tapa(o)) return true;
      }
    if (conPuertas) for (const o of dinamicos) if (tapa(o, true)) return true;
    return false;
  }

  // La más baja de las que cubren el punto: sirve para aparecer al nivel del suelo
  // y no arriba de todo cuando hay varias superpuestas (la torre, por ejemplo)
  function plataformaBaja(x, z) {
    const lista = celdasPlat.get(clave(Math.floor(x / TAM), Math.floor(z / TAM)));
    if (!lista) return null;
    let mejor = null;
    for (const p of lista) {
      if (!dentroPlataforma(p, x, z)) continue;
      if (!mejor || p.alto < mejor.alto) mejor = p;
    }
    return mejor;
  }

  return { agregar, agregarPlataforma, eliminar, eliminarPorDuenio, resolver, resolverPlataformas, plataformaEn, plataformaBaja, techoEntre, espacioVerticalLibre, paredEntre, cercanos, plataformas, dinamicos };
}
