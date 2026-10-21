// 4.6.0 (arreglos pedidos por el usuario): tres detalles visuales de la 4.6, en Node.
//   a. Puestos de ruta: un claro sólo de árboles detrás de cada puesto (puestos-ruta-mundo.js `claros`, main.js los despeja): en
//      media, un coihue grande a 11 m detrás del Puesto de la Cantera parecía salir del techo visto de frente. Con el bosque de
//      verdad en media y en alta, después de despejar lo que despeja el juego, no queda ningún árbol en la franja de atrás.
//   b. El tablón de encargos (tablon-mundo.js): corrido para que el farol del sendero de la esquina no le quede pegado detrás;
//      sigue en el frente de la plaza, entre la vereda y el lote, lejos del cartel y del mástil.
//   c. El juncal y las hierbas del mallín (recursos-zona-mundo.js): crecido y al ras se distinguen (alto, color) y quedan en su
//      propio claro (main.js); sigue habiendo poca geometría.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const THREE = await import('three');
const { generarTerreno } = await import('../src/terreno.js');
const { generarVegetacion } = await import('../src/vegetacion.js');
const { CALIDADES } = await import('../src/config.js');
const PR = await import('../src/puestos-ruta.js');
const PM = await import('../src/puestos-ruta-mundo.js');
const AA = await import('../src/aldea-arquitectura.js');
const { LUGAR_TABLON } = await import('../src/tablon-mundo.js');
const { crearRecursosZonaMundo } = await import('../src/recursos-zona-mundo.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const T = generarTerreno();
const main = leer('src/main.js');

// ---------------------------------------------------------------- a. el claro de atrás de los puestos
{
  const nada = () => {};
  const mundo = PM.crearPuestosRutaMundo({ T, escena: new THREE.Scene(), mat: new THREE.MeshBasicMaterial(), col: { agregar: nada, agregarPlataforma: nada }, cartel: nada, sentaderos: [], cubiertas: [], progreso: () => ({}) });
  ok(Array.isArray(mundo.claros) && mundo.claros.length === 4, 'un claro por puesto');
  for (const c of mundo.claros) {
    const id = PR.IDS_PUESTOS.find((k) => PR.PUESTOS_RUTA[k].nombre === c.nombre), l = PR.aLocal(id, c.x, c.z);
    ok(l.z < -3 && Math.abs(l.x) < 0.01, `${id}: el claro va detrás del puesto (centro local ${l.x.toFixed(1)}, ${l.z.toFixed(1)})`);
  }
  ok(main.includes('for (const z of puestosRutaMundo.claros || []) veg.despejar(z.x, z.z, z.r, false);'), 'main.js despeja los claros (sólo árboles)');
  for (const cal of ['media', 'alta']) {
    const veg = generarVegetacion(T, CALIDADES[cal], new THREE.Scene());
    const antes = veg.arboles.filter((a) => { const l = PR.aLocal('A', a.x, a.z); return l.z < -1 && l.z > -12.5 && Math.abs(l.x) < 5; });
    if (cal === 'media') ok(antes.some((a) => a.especie === 'coihue' && a.esc > 1.2), 'media: el coihue grande de atrás de la Cantera está en el bosque (no se mueve ni se borra del bosque)');
    for (const z of mundo.zonas) veg.despejar(z.x, z.z, z.r);
    for (const z of mundo.claros) veg.despejar(z.x, z.z, z.r, false);
    for (const id of PR.IDS_PUESTOS) {
      const quedan = veg.arboles.filter((a) => !a.sacado).filter((a) => { const l = PR.aLocal(id, a.x, a.z); return l.z < -1 && l.z > -12.5 && Math.abs(l.x) < 5; });
      ok(!quedan.length, `${cal} ${id}: ningún árbol en la franja de atrás (${quedan.map((a) => a.especie).join(', ') || 'ninguno'})`);
    }
  }
}

// ---------------------------------------------------------------- b. el tablón y el farol
{
  const plaza = AA.armarEdificio('plaza', 4);
  const faroles = plaza.luces.filter((l) => l.clase === 'farol');
  const d = Math.min(...faroles.map((l) => Math.hypot(l.lx - LUGAR_TABLON.lx, l.lz - LUGAR_TABLON.lz)));
  ok(faroles.length === 8 && d > 3, `el farol más cercano queda a ${d.toFixed(1)} m del tablón (antes, 2,2 m: pegado detrás)`);
  // de frente (a 1,2 m, donde se lee), ningún farol de la plaza dentro del ancho del tablón (±0,85 m más un poco)
  const tapados = faroles.filter((l) => Math.abs(l.lx - LUGAR_TABLON.lx) < 1.3 && l.lz < LUGAR_TABLON.lz);
  ok(!tapados.length, 'visto de frente, ningún farol detrás del techito');
  ok(LUGAR_TABLON.lz > 7 && LUGAR_TABLON.lz < 8.2, 'sigue en el frente de la plaza, entre el lote y la vereda de la calle de la Vía');
  ok(main.includes('empleoJuego?.tapaVecino(js) || tablonJuego?.accion(js) || lugarTapaVecino(mecanicasAldea?.accion(js)?.tipo))) vecino = gente.cerca(js, camara, true);'), 'delante del tablón, la E es del tablón (al vecino de atrás, como el jefe en la soga del mástil, hay que mirarlo de frente)');
  ok(Math.abs(LUGAR_TABLON.lx - 5.4) > 5 && Math.hypot(LUGAR_TABLON.lx, LUGAR_TABLON.lz - (7 - 1.75)) > 3, 'lejos del cartel (en +5,4) y del mástil');
}

// ---------------------------------------------------------------- c. el juncal y las hierbas
{
  const escena = new THREE.Scene();
  crearRecursosZonaMundo({ T, escena, progreso: () => ({ dia: 1, horas: 10 }) });
  const g = escena.children.find((c) => c.name === 'recursos-zona');
  const malla = (nom) => g.children.find((m) => m.name === nom);
  // lo más alto sobre el suelo de ahí (el mallín no es llano)
  const alto = (m) => { const p = m.geometry.attributes.position.array; let h = 0; for (let i = 0; i < p.length; i += 3) { const x = m.position.x + p[i], z = m.position.z + p[i + 2]; h = Math.max(h, m.position.y + p[i + 1] - T.altura(x, z)); } return h; };
  const tono = (m) => { const c = m.geometry.attributes.color.array; let r = 0, gg = 0, b = 0; for (let i = 0; i < c.length; i += 3) { r += c[i]; gg += c[i + 1]; b += c[i + 2]; } const k = 3 / c.length; return { r: r * k, g: gg * k, b: b * k, luz: (r + gg + b) * k / 3 }; };
  const jc = malla('zona-juncal-hay'), jr = malla('zona-juncal-ras'), hc = malla('zona-hierbas-hay'), hr = malla('zona-hierbas-ras');
  ok(alto(jc) > 2 && alto(jr) < 0.5, `el juncal crecido pasa los 2 m (${alto(jc).toFixed(2)}) y al ras queda bajo (${alto(jr).toFixed(2)})`);
  const tc = tono(jc), tr = tono(jr);
  ok(tc.g > tc.r * 1.3 && tr.luz > tc.luz * 1.8 && tr.r > tr.b * 1.3, `crecido verde junco oscuro; al ras, claro color paja (luz ${tc.luz.toFixed(2)} → ${tr.luz.toFixed(2)})`);
  const hhc = tono(hc), hhr = tono(hr);
  ok(alto(hc) > alto(hr) * 2 && hhr.luz > hhc.luz * 1.3, 'las hierbas: crecidas, grandes y verdes; cortadas, chicas y pálidas');
  let tris = 0;
  for (const m of g.children) tris += m.geometry.attributes.position.count / 3;
  ok(tris < 3100, `poca geometría (${tris} triángulos en todo lo de zona; antes 3.048)`);
  ok(/for \(const id of \['juncal', 'hierbas'\]\) \{ const p = PUNTO_ZONA\[id\]; veg\.despejar\(p\.x, p\.z, 3\.4\); pelarPastoTemporal\(p\.x, p\.z, 3\.6\); \}/.test(main), 'main.js les hace su claro (sin helechos ni pasto alto encima)');
}

console.log(`OK 4.6.0 detalles visuales: puestos, tablón y juncal (${n} comprobaciones)`);
