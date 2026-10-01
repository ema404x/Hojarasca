// Piezas estructurales con una sola fuente de verdad.
//
// El problema que resuelve: hasta ahora cada construcción se describía dos
// veces —una para dibujarla y otra para la física— y cuando los números no
// coincidían aparecían paredes que no frenan, pisos que no sostienen y suelo
// invisible en el aire. Acá cada pieza se declara UNA vez y emite las dos
// cosas, así no pueden separarse.
//
// Todo se declara en coordenadas locales de la construcción; la pieza se
// encarga de pasarlas al mundo con la posición y la rotación del sitio.
import * as THREE from 'three';

export function piezas(c, col, sitio, matriz) {
  const { x: ox, z: oz, y: oy, rot = 0 } = sitio;
  const cosr = Math.cos(rot), sinr = Math.sin(rot);
  // local -> mundo
  const w = (lx, lz) => ({ x: ox + lx * cosr + lz * sinr, z: oz - lx * sinr + lz * cosr });

  return {
    // Piso redondo: cilindro dibujado y plataforma circular con el mismo radio.
    // hueco: { centro, medio, desde } deja un sector abierto —el paso de la
    // escalera— tanto en la geometría como en la colisión.
    pisoRedondo({ lx = 0, lz = 0, radio, radioInterior = 0, alto, espesor = 0.16, color, caras = 18, hueco = null }) {
      if (radioInterior > 0) {
        // anillo: se dibuja con dos caras y su colisión también es anillo
        for (const lado of [1, -1]) {
          c.agregar(new THREE.RingGeometry(radioInterior, radio, Math.max(16, caras), 1), {
            color, tipo: 4, variar: 0.08,
            matriz: matriz([lx, alto + lado * espesor / 2, lz], [lado * Math.PI / 2, 0, 0]),
          });
        }
        // el canto del anillo, para que no se vea como papel
        c.agregar(new THREE.CylinderGeometry(radio, radio, espesor, Math.max(16, caras), 1, true), { color, tipo: 4, variar: 0.06, matriz: matriz([lx, alto, lz]) });
        const q0 = w(lx, lz);
        col.agregarPlataforma({ x: q0.x, z: q0.z, radio: radio - 0.05, radioInterior: radioInterior + 0.05, alto: oy + alto + espesor / 2, espesor });
        return { alto: oy + alto + espesor / 2, radio };
      }
      if (!hueco) {
        c.agregar(new THREE.CylinderGeometry(radio, radio, espesor, caras), {
          color, tipo: 4, variar: 0.08, matriz: matriz([lx, alto, lz]),
        });
      } else {
        // El hueco empieza a partir de `desde` y continúa HACIA AFUERA. La
        // versión anterior hacía exactamente lo contrario: en el sector de
        // escalera dibujaba el anillo exterior (donde la física decía vacío) y
        // quitaba el centro (donde la física sí sostenía). Eso producía piso
        // visible sin apoyo y apoyo invisible en faro/molino.
        const gajos = Math.max(36, caras * 2);
        const desdeHueco = Math.max(0, Math.min(radio, hueco.desde ?? 0));
        for (let k = 0; k < gajos; k++) {
          const a1 = (k / gajos) * Math.PI * 2, a2 = ((k + 1) / gajos) * Math.PI * 2;
          const medio = (a1 + a2) / 2;
          const d = medio - hueco.centro;
          const dif = Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
          const radioVisible = dif < hueco.medio ? desdeHueco : radio;
          if (radioVisible <= 1e-4) continue;
          const geo = new THREE.RingGeometry(0, radioVisible, 1, 1, a1 - Math.PI / 2, a2 - a1);
          c.agregar(geo, { color, tipo: 4, variar: 0.08, matriz: matriz([lx, alto + espesor / 2, lz], [Math.PI / 2, 0, 0]) });
          // 3.0.1: la cara de abajo gira al revés (−π/2) y con el mismo ángulo de arranque
          // quedaba espejada en z: mirando el piso desde arriba (se ve esta cara, la otra da
          // para abajo) el hueco de la escalera aparecía del otro lado. Con π/2 − a2 coincide.
          const geoAbajo = new THREE.RingGeometry(0, radioVisible, 1, 1, Math.PI / 2 - a2, a2 - a1);
          c.agregar(geoAbajo, { color, tipo: 4, variar: 0.08, matriz: matriz([lx, alto - espesor / 2, lz], [-Math.PI / 2, 0, 0]) });
        }
      }
      const q = w(lx, lz);
      col.agregarPlataforma({
        x: q.x, z: q.z, radio: radio - 0.05, alto: oy + alto + espesor / 2, espesor,
        ...(hueco ? { huecoCentro: hueco.centro - rot, huecoMedio: hueco.medio, huecoDesde: hueco.desde ?? 0 } : {}),
      });
      return { alto: oy + alto + espesor / 2, radio };
    },

    // Piso rectangular: caja dibujada y plataforma con la misma huella.
    pisoCaja({ lx = 0, lz = 0, largo, ancho, alto, espesor = 0.14, color }) {
      c.agregar(new THREE.BoxGeometry(largo, espesor, ancho), {
        color, tipo: 4, variar: 0.08, matriz: matriz([lx, alto, lz]),
      });
      const q = w(lx, lz);
      col.agregarPlataforma({ x: q.x, z: q.z, ang: -rot, largo, ancho, alto: oy + alto + espesor / 2, espesor });
      return { alto: oy + alto + espesor / 2 };
    },

    // Escalón: igual que el piso rectangular pero girado a su propio ángulo.
    // 3.0.1: `sinTecho` para los peldaños de una escalera que se solapan con el de
    // arriba: si no, el siguiente hace de techo (espacioVerticalLibre) y no se sube.
    escalon({ lx, lz, largo, ancho, alto, espesor = 0.1, color, giro = 0, sinTecho = false }) {
      c.agregar(new THREE.BoxGeometry(largo, espesor, ancho), {
        color, tipo: 4, variar: 0.08, matriz: matriz([lx, alto, lz], [0, giro, 0]),
      });
      const q = w(lx, lz);
      col.agregarPlataforma({ x: q.x, z: q.z, ang: -(rot + giro), largo, ancho, alto: oy + alto + espesor / 2, espesor, ...(sinTecho ? { sinTecho: true } : {}) });
    },

    // Pared curva: se dibuja en sectores de caja (con caras por los dos lados)
    // y se bloquea con los mismos sectores, dejando el mismo hueco de puerta.
    paredCurva({ radio, desde, hasta, espesor = 0.3, sectores = 18, color, hueco = null, alturaMin, alturaMax, dibujar = true }) {
      const alto = hasta - desde;
      const centroRadio = Math.max(0.05, radio - espesor / 2);
      // El vano puede declararse como ángulo (`medio`) o, preferentemente,
      // como ancho lineal. Con `ancho`, una puerta conserva el mismo ancho
      // real aunque la pared sea cónica y cambie de radio entre anillos.
      const huecoMedio = hueco
        ? (hueco.ancho !== undefined
            ? Math.asin(Math.min(0.999, Math.max(0, hueco.ancho / 2) / centroRadio))
            : Math.max(0, hueco.medio ?? 0))
        : 0;
      const dosPi = Math.PI * 2;
      const norm = (a) => ((a % dosPi) + dosPi) % dosPi;
      const rangosHueco = [];
      if (hueco && huecoMedio > 1e-5) {
        const c0 = norm(hueco.centro);
        const h0 = c0 - huecoMedio, h1 = c0 + huecoMedio;
        if (h0 < 0) rangosHueco.push([0, h1], [h0 + dosPi, dosPi]);
        else if (h1 > dosPi) rangosHueco.push([0, h1 - dosPi], [h0, dosPi]);
        else rangosHueco.push([h0, h1]);
      }
      const restarHueco = (a0, a1) => {
        let tramos = [[a0, a1]];
        for (const [h0, h1] of rangosHueco) {
          const sig = [];
          for (const [t0, t1] of tramos) {
            if (h1 <= t0 || h0 >= t1) sig.push([t0, t1]);
            else {
              if (h0 > t0 + 1e-5) sig.push([t0, Math.min(h0, t1)]);
              if (h1 < t1 - 1e-5) sig.push([Math.max(h1, t0), t1]);
            }
          }
          tramos = sig;
        }
        return tramos;
      };
      // 3.0.1: la colisión es una cápsula: su punta redonda sobresalía `r` dentro del
      // vano de la puerta (en el molino dejaba 8 cm de juego; en el zócalo del faro, un
      // paso de 56 cm para un cuerpo de 70). En los bordes del hueco la cápsula se acorta
      // su radio y termina donde termina la piedra que se ve.
      const rCol = espesor * 0.52;
      const recorteHueco = Math.min(0.45, rCol / Math.max(0.05, centroRadio));
      const bordesHueco = rangosHueco.length ? [norm(hueco.centro - huecoMedio), norm(hueco.centro + huecoMedio)] : [];
      const esBorde = (a, b) => b !== undefined && Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < 1e-6;
      const tramosCol = [];
      for (let k = 0; k < sectores; k++) {
        const a1 = (k / sectores) * dosPi;
        const a2 = ((k + 1) / sectores) * dosPi;
        for (const [s0, s1] of restarHueco(a1, a2)) {
          const delta = s1 - s0;
          if (delta < 1e-5) continue;
          const medio = (s0 + s1) / 2;
          if (dibujar) {
            const cuerda = 2 * centroRadio * Math.sin(delta / 2);
            c.agregar(new THREE.BoxGeometry(cuerda * 1.025, alto, espesor), {
              color, tipo: 4, variar: 0.06,
              matriz: matriz([Math.sin(medio) * centroRadio, desde + alto / 2, -Math.cos(medio) * centroRadio], [0, -medio, 0]),
            });
          }
          // La caja visual usa -medio: en Three.js una rotación Y positiva gira
          // el eje X hacia -Z; con +medio algunos sectores quedaban radiales
          // aunque la colisión siguiera correctamente la tangente del círculo.
          // La colisión vive en el centro real del espesor de la pared. Antes
          // se colocaba sobre el radio exterior y se inflaba 70 % del espesor,
          // creando una pared invisible sensiblemente más ancha que la malla.
          tramosCol.push({ s0, s1 });
        }
      }
      // 3.0.1: se acortan los tramos que tocan el hueco (si uno queda más corto que el
      // recorte, se saca y se sigue con el vecino)
      const recortar = (borde, alFinal) => {
        let resto = recorteHueco;
        let t = tramosCol.find((q) => !q.fuera && esBorde(alFinal ? q.s1 : q.s0, borde));
        while (t && resto > 1e-6) {
          const largo = t.s1 - t.s0;
          if (largo > resto + 0.01) { if (alFinal) t.s1 -= resto; else t.s0 += resto; resto = 0; break; }
          resto -= largo; t.fuera = true;
          const junta = alFinal ? t.s0 : t.s1;
          t = tramosCol.find((q) => !q.fuera && esBorde(alFinal ? q.s1 : q.s0, junta));
        }
      };
      if (bordesHueco.length) { recortar(bordesHueco[0], true); recortar(bordesHueco[1], false); }
      for (const { s0, s1, fuera } of tramosCol) {
        if (fuera) continue;
        const A = w(Math.sin(s0) * centroRadio, -Math.cos(s0) * centroRadio);
        const B = w(Math.sin(s1) * centroRadio, -Math.cos(s1) * centroRadio);
        col.agregar({
          seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: rCol,
          alturaMin: alturaMin !== undefined ? oy + alturaMin : oy + desde - 0.3,
          alturaMax: alturaMax !== undefined ? oy + alturaMax : oy + hasta,
        });
      }
    },

    // Baranda: se dibuja como postes y pasamanos, y solo frena a su altura.
    baranda({ radio, alto, base, postes = 16, color, hueco = null }) {
      const enHueco = (a) => {
        if (!hueco) return false;
        const d = a - hueco.centro;
        return Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) < hueco.medio;
      };
      const barraEntre = (a, b, radioBarra, colorBarra) => {
        const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
        const largo = Math.hypot(dx, dy, dz);
        if (largo < 1e-4) return;
        const geo = new THREE.CylinderGeometry(radioBarra, radioBarra, largo, 6);
        geo.translate(0, largo / 2, 0);
        const dir = new THREE.Vector3(dx, dy, dz).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        const m = new THREE.Matrix4().compose(
          new THREE.Vector3(...a), q, new THREE.Vector3(1, 1, 1)
        );
        c.agregar(geo, { color: colorBarra ?? color, tipo: 4, matriz: m, variar: 0.05 });
      };
      for (let i = 0; i < postes; i++) {
        const a = (i / postes) * Math.PI * 2;
        if (enHueco(a)) continue;
        const px = Math.sin(a) * radio, pz = -Math.cos(a) * radio;
        c.agregar(new THREE.CylinderGeometry(0.045, 0.045, alto - base, 6), {
          color, tipo: 4, matriz: matriz([px, (base + alto) / 2, pz]),
        });
      }
      // Antes se dibujaba un torus completo aunque hubiera una escalera abierta.
      // Eso dejaba una discrepancia visible: la física dejaba pasar y la baranda no.
      // Ahora los dos pasamanos se construyen por tramos, igual que la colisión.
      for (const y of [alto, (base + alto * 2) / 3]) {
        for (let k = 0; k < postes; k++) {
          const a1 = (k / postes) * Math.PI * 2;
          const a2 = ((k + 1) / postes) * Math.PI * 2;
          const medio = (a1 + a2) / 2;
          if (enHueco(medio)) continue;
          barraEntre(
            [Math.sin(a1) * radio, y, -Math.cos(a1) * radio],
            [Math.sin(a2) * radio, y, -Math.cos(a2) * radio],
            y === alto ? 0.05 : 0.04, color
          );
        }
      }
      for (let k = 0; k < postes; k++) {
        const a1 = (k / postes) * Math.PI * 2, a2 = ((k + 1) / postes) * Math.PI * 2;
        const medio = (a1 + a2) / 2;
        if (enHueco(medio)) continue;
        const A = w(Math.sin(a1) * radio, -Math.cos(a1) * radio);
        const B = w(Math.sin(a2) * radio, -Math.cos(a2) * radio);
        col.agregar({ seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: 0.1, alturaMin: oy + base - 0.2, alturaMax: oy + alto + 0.4 });
      }
    },

    // Pared recta entre dos puntos locales. `huecos` son tramos abiertos de
    // piso a techo (puertas), medidos en metros desde A. Las ventanas no van
    // acá: no se pasa por una ventana, así que la colisión sigue entera.
    // Con `dibujar: false` solo emite la colisión, para paredes cuyo dibujo
    // ya existe (troncos, tablas) y comparte las mismas constantes de hueco.
    paredRecta({ a, b, desde = 0, hasta, espesor = 0.3, color, huecos = [], dibujar = true, alturaMin, alturaMax }) {
      const [ax, az] = a, [bx, bz] = b;
      const largo = Math.hypot(bx - ax, bz - az);
      if (largo < 1e-4 || hasta <= desde) return;
      const ux = (bx - ax) / largo, uz = (bz - az) / largo;
      const giro = Math.atan2(-uz, ux);
      // Tramos sólidos = el largo menos los huecos, pero siempre recortados
      // al segmento real. Así una puerta mal configurada nunca fabrica una
      // colisión fuera de la pared ni un tramo invertido.
      const cortes = [...huecos]
        .map((h) => ({ desde: Math.max(0, Math.min(largo, h.desde)), hasta: Math.max(0, Math.min(largo, h.hasta)) }))
        .filter((h) => h.hasta > h.desde)
        .sort((h1, h2) => h1.desde - h2.desde);
      const tramos = [];
      let ini = 0;
      for (const h of cortes) {
        if (h.desde > ini) tramos.push([ini, h.desde]);
        ini = Math.max(ini, h.hasta);
      }
      if (ini < largo) tramos.push([ini, largo]);
      const alto = hasta - desde;
      for (const [t0, t1] of tramos) {
        const l = t1 - t0, m = (t0 + t1) / 2;
        const cx = ax + ux * m, cz = az + uz * m;
        if (dibujar) {
          c.agregar(new THREE.BoxGeometry(l, alto, espesor), { color, tipo: 4, variar: 0.06, matriz: matriz([cx, desde + alto / 2, cz], [0, giro, 0]) });
        }
        // 3.0.1: junto a una puerta la cápsula se acorta su radio: su punta redonda
        // sobresalía dentro del vano, una jamba invisible de 15 a 30 cm por lado.
        const rCol = espesor * 0.52;
        const c0 = t0 > 1e-6 ? Math.min(t0 + rCol, (t0 + t1) / 2) : t0;
        const c1 = t1 < largo - 1e-6 ? Math.max(t1 - rCol, (t0 + t1) / 2) : t1;
        const A = w(ax + ux * c0, az + uz * c0), B = w(ax + ux * c1, az + uz * c1);
        col.agregar({
          seg: true, ax: A.x, az: A.z, bx: B.x, bz: B.z, r: espesor * 0.52,
          alturaMin: alturaMin !== undefined ? oy + alturaMin : oy + desde - 0.3,
          alturaMax: alturaMax !== undefined ? oy + alturaMax : oy + hasta,
        });
      }
    },

    // Mueble: una caja dibujada que además frena al jugador (mesa, cama, hogar,
    // mostrador). Se pisa por encima si es baja, y se rodea si es alta.
    mueble({ lx, ly, lz, largo, alto, ancho, color, giro = 0, tipo = 4, variar = 0.08, pisable = false, dibujar = true }) {
      if (dibujar) c.agregar(new THREE.BoxGeometry(largo, alto, ancho), { color, tipo, variar, matriz: matriz([lx, ly, lz], [0, giro, 0]) });
      const q = w(lx, lz);
      const ang = rot + giro;
      const ux = Math.cos(ang), uz = -Math.sin(ang);      // eje largo en mundo
      const nx = Math.sin(ang), nz = Math.cos(ang);       // eje ancho en mundo
      const tope = oy + ly + alto / 2;
      // Si es un mueble bajo marcado como pisable (camas/bancos bajos), la
      // plataforma debe poder alcanzarse caminando. Rodearlo además con cuatro
      // segmentos convertía su borde en un zócalo invisible que impedía subir.
      const escalable = pisable && (tope - oy) <= 0.68;
      // cuatro lados como segmentos, que frenan solo hasta la altura del mueble
      const lados = [
        [-largo / 2, -ancho / 2, largo / 2, -ancho / 2], [largo / 2, -ancho / 2, largo / 2, ancho / 2],
        [largo / 2, ancho / 2, -largo / 2, ancho / 2], [-largo / 2, ancho / 2, -largo / 2, -ancho / 2],
      ];
      if (!escalable) for (const [a1, b1, a2, b2] of lados) {
        col.agregar({
          seg: true,
          ax: q.x + ux * a1 + nx * b1, az: q.z + uz * a1 + nz * b1,
          bx: q.x + ux * a2 + nx * b2, bz: q.z + uz * a2 + nz * b2,
          r: 0.04,
          alturaMin: oy + ly - alto / 2 - 0.04,
          alturaMax: Math.max(oy + 0.05, tope - 0.03),
        });
      }
      if (pisable) col.agregarPlataforma({
        x: q.x, z: q.z, ang: -ang, largo, ancho, alto: tope, espesor: alto,
        // Los muebles bajos se pueden subir caminando; los altos conservan la
        // regla normal de plataforma y requieren llegar desde una altura válida.
        escalonMax: escalable ? 0.70 : 0.60,
      });
    },

    aMundo: w,
  };
}
