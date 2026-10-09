// 2.9: el velero. Aparece amarrado en la punta del varadero (plano 'varadero-velero',
// ver planos-vehiculos.js) y navega con el viento de clima.js: A y D el timón, W caza y S
// suelta la escota, Espacio un remo corto para la calma. Contra el viento no anda: hay que
// bordear. Se sube y se baja como el kayak (E); arriba, el jugador queda `enKayak` (así
// todo lo que en main.js vale para el kayak vale también acá) y además `enVela`.
// Las reglas están en `vela-reglas.js`; lo personal (casco, nombre, banderín) llega por el
// kayak (`kayak.sumarBote`), desde la sección «Tu kayak y tus botes».
import * as THREE from 'three';
import { LAGO } from './config.js';
import { clamp } from './ruido.js';
import { sanearBotes } from './personal-botes.js';
import { cartelNombre, letraSobre, desechar } from './personal-mallas.js';
import { VELA, pasoVela, rumboViento, anguloAlViento, amuraDe, estadoVela, nombreRumboViento, sanearVela } from './vela-reglas.js';

const FILAS = 5, COLS = 4;   // la vela: una grilla chica que se infla y flamea

function mallaVelero() {
  const g = new THREE.Group();
  const perfil = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    // más llena en la popa que en la proa
    const r = Math.sin(t * Math.PI) ** 0.7 * 0.78 * (0.8 + 0.2 * (1 - t)) + 0.001;
    perfil.push(new THREE.Vector2(r, (t - 0.5) * VELA.largo));
  }
  const casco = new THREE.Mesh(new THREE.LatheGeometry(perfil, 16), new THREE.MeshLambertMaterial({ color: '#d4552a' }));
  casco.rotation.x = Math.PI / 2;
  casco.scale.set(1, 1, 0.5);
  casco.position.y = 0.12;
  g.add(casco);
  const madera = new THREE.MeshLambertMaterial({ color: '#b08a5a' });
  const oscura = new THREE.MeshLambertMaterial({ color: '#5a4632' });
  // cubierta, bancada y la regala
  const cubierta = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 3.0), madera);
  cubierta.position.set(0, 0.3, -0.1);
  g.add(cubierta);
  const bancada = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.28), oscura);
  bancada.position.set(0, 0.42, -1.0);
  g.add(bancada);
  // el mástil y la botavara (que gira sobre el mástil)
  const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 5.2, 8), madera);
  mastil.position.set(0, 2.85, 0.75);
  g.add(mastil);
  const giroBotavara = new THREE.Group();
  giroBotavara.position.set(0, 1.12, 0.75);
  g.add(giroBotavara);
  const botavara = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 6), madera);
  botavara.rotation.x = Math.PI / 2;
  botavara.position.z = -1.25;
  giroBotavara.add(botavara);
  // la vela: triángulo de lana entre el mástil y la botavara, con un poco de panza
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array((FILAS + 1) * (COLS + 1) * 3);
  const idx = [];
  for (let f = 0; f < FILAS; f++) for (let k = 0; k < COLS; k++) {
    const a = f * (COLS + 1) + k, b = a + 1, c = a + COLS + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const vela = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: '#ece4d0', side: THREE.DoubleSide }));
  vela.frustumCulled = false;
  giroBotavara.add(vela);
  // la caña del timón y la pala, a popa
  const timon = new THREE.Group();
  timon.position.set(0, 0.35, -VELA.largo / 2 + 0.05);
  const pala = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.34), oscura);
  pala.position.set(0, -0.3, -0.12);
  const cana = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.9), madera);
  cana.position.set(0, 0.18, 0.4);
  timon.add(pala, cana);
  g.add(timon);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  vela.receiveShadow = false;
  g.userData = { casco, giroBotavara, vela, timon };
  return g;
}

// la vela en su lugar: `panza` hacia sotavento (+1 / -1 en x local de la botavara),
// `flameo` hace ondear la tela
function formarVela(vela, panza, flameo, t) {
  const p = vela.geometry.attributes.position.array;
  for (let f = 0; f <= FILAS; f++) for (let k = 0; k <= COLS; k++) {
    const v = f / FILAS, u = (k / COLS) * (1 - v);   // triángulo: se angosta arriba
    const i = (f * (COLS + 1) + k) * 3;
    const bolsa = Math.sin(Math.PI * (u / Math.max(0.001, 1 - v))) * (1 - v) * 0.28;
    const onda = flameo * Math.sin(t * 13 + u * 9 + v * 4) * 0.12 * (u + 0.1);
    p[i] = bolsa * panza + onda;
    p[i + 1] = 0.08 + v * 3.9;
    p[i + 2] = -u * 2.4;
  }
  vela.geometry.attributes.position.needsUpdate = true;
  vela.geometry.computeVertexNormals();
}

// el banderín del tope: cuelga hacia donde sopla (sirve de catavientos)
function mallaBanderinTope(forma, color) {
  const g = new THREE.Group();
  const v = forma === 'golondrina'
    ? [0, 0, 0, 0, -0.16, 0, 0, -0.08, -0.24, 0, 0, 0, 0, -0.08, -0.24, 0, 0, -0.4, 0, -0.16, 0, 0, -0.16, -0.4, 0, -0.08, -0.24]
    : [0, 0, 0, 0, -0.16, 0, 0, -0.08, -0.42];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })));
  return g;
}

export function crearVela(T, escena, col, sonido, ctx = {}) {
  const barco = mallaVelero();
  barco.visible = false;
  escena.add(barco);
  const U = barco.userData;
  const est = { hay: false, activo: false, x: 0, z: 0, rumbo: 0, vel: 0, giro: 0, escota: 0.4, amura: 1, escora: 0, alfa: Math.PI / 2, flamea: false, botavara: 0, timon: 0 };
  let guardado = null, revision = 0, firma = '';
  let personal = sanearBotes(null), nombres = [], banderin = null;
  // el catavientos del tope (una cinta roja) cuando no hay banderín propio
  const tope = new THREE.Group();
  tope.position.set(0, 5.4, 0.75);
  barco.add(tope);
  const cinta = mallaBanderinTope('triangulo', '#b8322a');
  cinta.scale.set(0.6, 0.35, 0.6);
  tope.add(cinta);

  const hondo = (x, z) => T.altura(x, z) < -0.35 && Math.hypot(x - LAGO.x, z - LAGO.z) < 220;
  const obras = () => ctx.obras?.() || null;
  const varaderos = () => (obras()?.obras || []).filter((o) => o.plano.id === 'varadero-velero' && o.datos.etapas >= o.plano.etapas.length);
  const viento = () => Number(ctx.clima?.()?.estado?.viento) || 0;
  const vientoHacia = (t) => rumboViento(t, ctx.clima?.()?.estado?.direccionViento);

  // dónde queda amarrado en un varadero: al costado de la punta, o delante
  function puntoAmarre(o) {
    const rot = o.datos.rot || 0, c = Math.cos(rot), sn = Math.sin(rot), media = o.plano.fondo / 2;
    for (const [lx, lz] of [[2.05, media - 1.5], [-2.05, media - 1.5], [1.8, media - 1.2], [-1.8, media - 1.2], [0, media + 2.6]]) {
      const x = o.datos.x + lx * c + lz * sn, z = o.datos.z - lx * sn + lz * c;
      if (hondo(x, z)) return { x, z, rumbo: rot };
    }
    return null;
  }

  function amarrar(o = null) {
    if (est.activo) return false;
    const lista = o ? [o] : varaderos();
    for (const v of lista) {
      const p = puntoAmarre(v);
      if (!p) continue;
      Object.assign(est, { x: p.x, z: p.z, rumbo: p.rumbo, vel: 0, giro: 0 });
      return true;
    }
    return false;
  }

  // se revisa cada tanto si hay varadero: el primero terminado trae el velero
  function revisarVaradero() {
    const lista = varaderos();
    const f = lista.map((o) => `${o.datos.x.toFixed(2)},${o.datos.z.toFixed(2)}`).join('|');
    if (f === firma) return;
    const antes = est.hay;
    firma = f;
    est.hay = lista.length > 0;
    if (!est.hay) { if (est.activo) return; barco.visible = false; return; }
    barco.visible = true;
    if (!antes) {
      // lo guardado, si todavía flota; si no, a la punta del varadero
      if (guardado && hondo(guardado.x, guardado.z)) Object.assign(est, { x: guardado.x, z: guardado.z, rumbo: guardado.rumbo });
      else if (amarrar()) { if (guardado === null && ctx.cargado?.()) ctx.nota?.('El velero quedó amarrado en tu varadero', 'E para subir: se navega con el viento', true); }
      // 3.8.3: sin dónde amarrarlo, no aparece en el medio del mapa (0, 0): se vuelve a probar en la próxima revisión
      else { est.hay = false; barco.visible = false; firma = null; return; }
      guardado = null;
    } else if (!est.activo && !hondo(est.x, est.z)) amarrar();
  }

  function colocar(t) {
    barco.position.set(est.x, Math.sin(t * 1.2) * 0.04 - 0.05, est.z);
    const lado = est.activo ? -est.amura : 0;
    barco.rotation.set(Math.sin(t * 0.8) * 0.02, est.rumbo, Math.sin(t * 1.0) * 0.03 + lado * est.escora, 'YXZ');
    U.timon.rotation.y = est.timon * 0.5;
  }

  // la botavara y la vela según la escota y el viento; el banderín hacia donde sopla
  function aparejo(dt, t) {
    const vh = vientoHacia(t);
    const alfa = anguloAlViento(est.rumbo, vh);
    const amura = est.activo ? est.amura : amuraDe(est.rumbo, vh, est.amura);
    if (!est.activo) est.amura = amura;
    // amarrado, la vela va arriada: la botavara al centro y la tela recogida
    const objetivo = est.activo ? -amura * Math.min(est.escota * 1.35, Math.max(0.12, alfa - 0.25)) : 0;
    const antes = est.botavara;
    est.botavara += (objetivo - est.botavara) * (1 - Math.exp(-dt * (est.activo ? 2.5 : 1)));
    // la trasluchada: la botavara cruza de un lado al otro
    if (est.activo && Math.sign(antes) !== Math.sign(est.botavara) && Math.abs(antes) > 0.2) sonido?.golpeKayak?.();
    U.giroBotavara.rotation.y = est.botavara;
    const flameo = !est.activo ? 0.15 : est.flamea ? 1 : 0.05 + viento() * 0.05;
    U.vela.visible = est.activo;
    if (est.activo) formarVela(U.vela, -Math.sign(est.botavara || -amura) * (est.flamea ? 0.2 : 1) * Math.min(1, 0.3 + viento()), flameo, t);
    // hacia donde sopla, en el marco del barco (el tope gira con el casco)
    const flota = banderin || cinta;
    flota.rotation.y = vh - est.rumbo + Math.PI + Math.sin(t * 6.1) * 0.12 * (0.4 + viento());
  }

  function cerca(js) { return est.hay && !est.activo && !js.enKayak && Math.hypot(js.pos.x - est.x, js.pos.z - est.z) < 3.8; }

  function subir(jugador) {
    est.activo = true;
    est.vel = 0; est.giro = 0;
    const js = jugador.estado;
    js.enKayak = true;
    js.enVela = true;
    js.yaw = est.rumbo + Math.PI;
    js.agachado = false;
    sonido?.golpeKayak?.();
  }

  function lugarParaBajar() {
    if (!est.activo) return null;
    const plat = col.plataformas.find((p) => {
      if (p.radio !== undefined || p.alto >= 3) return false;
      const ddx = est.x - p.x, ddz = est.z - p.z;
      const lx = ddx * p.cos + ddz * p.sin, lz = -ddx * p.sin + ddz * p.cos;
      return Math.abs(lx) < p.largo / 2 + 3 && Math.abs(lz) < p.ancho / 2 + 3;
    });
    if (plat) {
      const ddx = est.x - plat.x, ddz = est.z - plat.z;
      const lx = clamp(ddx * plat.cos + ddz * plat.sin, -plat.largo / 2 + 0.5, plat.largo / 2 - 0.5);
      const lz = clamp(-ddx * plat.sin + ddz * plat.cos, -plat.ancho / 2 + 0.4, plat.ancho / 2 - 0.4);
      return { x: plat.x + lx * plat.cos - lz * plat.sin, z: plat.z + lx * plat.sin + lz * plat.cos };
    }
    for (let r = 2; r < 8.5; r += 0.5) {
      for (let a = 0; a < 20; a++) {
        const ang = (a / 20) * Math.PI * 2;
        const x = est.x + Math.cos(ang) * r, z = est.z + Math.sin(ang) * r;
        if (!T.agua(x, z) && T.altura(x, z) > 0.15) return { x, z };
      }
    }
    return null;
  }

  function bajar(jugador) {
    const p = lugarParaBajar();
    if (!p) return false;
    est.activo = false;
    est.vel = 0; est.giro = 0; est.timon = 0;
    if (!est.hay) barco.visible = false;   // 3.8.3: el varadero se desarmó con vos arriba: no queda un velero fantasma
    const js = jugador.estado;
    js.enKayak = false;
    js.enVela = false;
    jugador.ubicar(p.x, p.z, js.yaw);
    sonido?.golpeKayak?.();
    return true;
  }

  // navegando: se llama desde el jugador (como el kayak, por `alKayak`)
  function actualizar(dt, tecla, jugador, tiempo) {
    if (!est.activo) return;
    const timon = (tecla('KeyD') || tecla('ArrowRight') ? 1 : 0) - (tecla('KeyA') || tecla('ArrowLeft') ? 1 : 0);
    const escota = (tecla('KeyS') || tecla('ArrowDown') ? 1 : 0) - (tecla('KeyW') || tecla('ArrowUp') ? 1 : 0);
    const remo = tecla('Space');
    est.timon += (timon - est.timon) * (1 - Math.exp(-dt * 6));
    const vh = vientoHacia(tiempo);
    const n = pasoVela(est, { timon, escota, remo }, dt, viento(), vh);
    if (remo && (est.fase = (est.fase || 0) + dt * 2.6) > 1) { est.fase = 0; sonido?.remada?.(0.8); }
    // la proa (y un poco a los costados) tiene que seguir en agua honda y sin muelle
    const proa = { x: n.x + Math.sin(n.rumbo) * 2.3, z: n.z + Math.cos(n.rumbo) * 2.3 };
    const muelle = col.plataformaEn(proa.x, proa.z, 0.2);
    if (!hondo(proa.x, proa.z) || !hondo(n.x, n.z) || (muelle && muelle.alto < 3)) {
      if (est.vel > 0.8) sonido?.golpeKayak?.();
      Object.assign(est, { rumbo: n.rumbo, giro: n.giro, escota: n.escota, amura: n.amura, vel: 0, escora: n.escora, alfa: n.alfa, flamea: n.flamea });
    } else Object.assign(est, n);
    colocar(tiempo);
    aparejo(dt, tiempo);
    // el jugador va sentado a popa, junto a la caña
    const js = jugador.estado;
    js.pos.set(est.x - Math.sin(est.rumbo) * 1.35, 0.3, est.z - Math.cos(est.rumbo) * 1.35);
    js.velocidadActual = est.vel;
  }

  // amarrado o sin nadie: se mece y cada tanto mira si hay varadero nuevo
  function actualizarQuieto(dt, tiempo) {
    if ((revision -= dt) <= 0) { revision = 0.5; revisarVaradero(); }
    if (est.activo || !est.hay) return;
    colocar(tiempo);
    aparejo(dt, tiempo);
  }

  // lo que ofrece la tecla E (y dice el aviso, en el mismo orden): subir, o traerlo al
  // varadero si está lejos y estás parado en las tablas
  function accion(jugador) {
    const js = jugador.estado;
    if (!est.hay || est.activo || js.enKayak || js.enTren) return null;
    if (cerca(js)) return { texto: 'Subir al velero', hacer: () => { subir(jugador); ctx.nota?.('Subiste al velero', 'A y D el timón · W caza y S suelta la escota · Espacio, remo corto'); } };
    for (const o of varaderos()) {
      const rot = o.datos.rot || 0, dx = js.pos.x - o.datos.x, dz = js.pos.z - o.datos.z;
      const lx = dx * Math.cos(rot) - dz * Math.sin(rot), lz = dx * Math.sin(rot) + dz * Math.cos(rot);
      if (Math.abs(lx) > o.plano.ancho / 2 + 0.6 || Math.abs(lz) > o.plano.fondo / 2 + 0.6 || Math.abs(js.pos.y - (o.datos.y + 0.46)) > 1.6) continue;
      return { texto: 'Traer el velero al varadero', hacer: () => {
        if (amarrar(o)) { sonido?.golpeKayak?.(); ctx.nota?.('Trajiste el velero', 'Quedó amarrado en la punta'); }
        else ctx.nota?.('El velero no llega hasta acá', 'La punta tiene que dar al agua honda del lago');
      } };
    }
    return null;
  }

  function texto(tiempo) {
    const alfa = anguloAlViento(est.rumbo, vientoHacia(tiempo));
    return `Velero · viento ${nombreRumboViento(alfa)} · vela ${estadoVela(est.escota, alfa, viento())}`;
  }

  // lo que va al guardado (null si todavía no hay velero)
  function datos() { return est.hay ? { x: est.x, z: est.z, rumbo: est.rumbo } : guardado; }
  function cargar(v) { guardado = sanearVela(v); firma = null; est.hay = false; revision = 0; }
  // guardando arriba del velero: el jugador baja en la orilla más cercana; si no hay, el
  // velero vuelve a su varadero y el jugador aparece en el arranque
  function paraGuardar() {
    if (!est.activo) return null;
    const p = lugarParaBajar();
    if (p) return { pos: p, barco: datos() };
    const o = varaderos()[0];
    if (!o) return null;
    const a = puntoAmarre(o), rot = o.datos.rot || 0, lz = -o.plano.fondo / 2 + 0.6;
    return { pos: { x: o.datos.x + lz * Math.sin(rot), z: o.datos.z + lz * Math.cos(rot) }, barco: a ? { x: a.x, z: a.z, rumbo: a.rumbo } : datos() };
  }

  // 2.8 (llega por el kayak): el casco, el nombre a los dos lados de la proa y el banderín
  // en el tope del mástil (que además dice de dónde sopla)
  function personalizar(dd) {
    const d = sanearBotes(dd);
    U.casco.material.color.set(d.casco);
    const nombreCambio = d.nombre !== personal.nombre || (d.nombre && letraSobre(d.casco) !== letraSobre(personal.casco));
    if (nombreCambio || (!nombres.length && d.nombre)) {
      for (const n of nombres) { barco.remove(n); desechar(n); }
      nombres = [];
      if (d.nombre) {
        for (const lado of [-1, 1]) {
          const n = cartelNombre(d.nombre, 0.6, 0.11, { ancho: 512, alto: 100, tinta: letraSobre(d.casco), fuente: 'Caveat', peso: 700 });
          n.position.set(lado * 0.64, 0.24, 1.1);
          n.rotation.y = lado * (Math.PI / 2 - 0.2);
          barco.add(n);
          nombres.push(n);
        }
      }
    }
    if (d.banderin !== personal.banderin || d.colorBanderin !== personal.colorBanderin || (!banderin && d.banderin !== 'ninguno')) {
      if (banderin) { tope.remove(banderin); desechar(banderin); banderin = null; }
      if (d.banderin !== 'ninguno') { banderin = mallaBanderinTope(d.banderin, d.colorBanderin); tope.add(banderin); }
    }
    cinta.visible = !banderin;
    personal = d;
    return true;
  }

  return { est, barco, cerca, subir, bajar, lugarParaBajar, actualizar, actualizarQuieto, accion, amarrar, puntoAmarre, texto, datos, cargar, paraGuardar, personalizar, personal: () => personal };
}
