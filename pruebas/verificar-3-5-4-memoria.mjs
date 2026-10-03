// 3.5.4: memoria de sesiones largas. Sólo Node (la partida de verdad está en pruebas/humo-3-5-4-memoria.cjs
// y el soak largo en herramientas/soak-largo.cjs).
//  1. El contexto 3D recuperado no deja colgado al contexto viejo: main.js anota (con WeakRef) lo que
//     three sube a la placa y, al perderse el contexto, les avisa 'dispose' a los administradores
//     viejos. Se prueba el bloque de main.js tal cual, con un despachador de eventos de mentira.
//  2. La banderita de las torres de vigía suelta sus geometrías (3.6: y la gente de la aldea no
//     arma geometría propia).
//  3. Las herramientas: soak-largo.cjs (perfil propio, nunca el del jugador) y comparar-snapshots.cjs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, m) => { assert.ok(c, m); pasos++; };

// ---------------------------------------------------------------- 1. el contexto viejo
const main = leer('src/main.js');
const ini = main.indexOf('const subidosATres = new Set();');
const fin = main.indexOf('const escena = new THREE.Scene();', ini);
ok(ini > 0 && fin > ini, 'main.js anota lo que three sube a la placa (subidosATres)');
const bloque = main.slice(ini, fin);
ok(/new WeakRef\(this\)/.test(bloque), 'sin retenerlo: WeakRef');
ok(main.indexOf('const subidosATres') < main.indexOf('async function construir()'), 'el anotador se pone antes de armar el mundo (antes de subir nada)');
const perdido = main.slice(main.indexOf("lienzo.addEventListener('webglcontextlost'"), main.indexOf("lienzo.addEventListener('webglcontextrestored'"));
ok(/soltarContextoViejo\(\)/.test(perdido), 'al perderse el contexto se sueltan los administradores viejos');
ok(!/addEventListener\(\s*'dispose'/.test(fs.readdirSync(path.join(raiz, 'src')).filter((f) => f.endsWith('.js')).map((f) => leer('src/' + f)).join('\n')),
  'el juego no escucha "dispose" (avisarlo sólo le llega a three)');
{
  // un despachador como el de three: un oyente por función, sin repetir
  class Despachador {
    addEventListener(t, f) { const l = (this._l ||= {}); (l[t] ||= []); if (!l[t].includes(f)) l[t].push(f); }
    removeEventListener(t, f) { const a = this._l?.[t]; if (a) { const i = a.indexOf(f); if (i >= 0) a.splice(i, 1); } }
    dispatchEvent(e) { const a = this._l?.[e.type]; if (!a) return; e.target = this; for (const f of [...a]) f.call(this, e); }
  }
  class BufferGeometry extends Despachador {}
  class Material extends Despachador {}
  const THREE = { BufferGeometry };
  const { soltarContextoViejo, subidosATres } = new Function('THREE', `${bloque}; return { soltarContextoViejo, subidosATres };`)(THREE);
  // el administrador "viejo" de three: guarda lo suyo y lo suelta al recibir 'dispose'
  const viejo = new Set();
  const alSoltar = function (e) { viejo.delete(e.target); e.target.removeEventListener('dispose', alSoltar); };
  const subir = (o) => { viejo.add(o); o.addEventListener('dispose', alSoltar); return o; };
  const geos = Array.from({ length: 50 }, () => subir(new BufferGeometry()));
  const mats = Array.from({ length: 20 }, () => subir(new Material()));
  subir(geos[0]);   // subido dos veces: se anota una
  geos[1].addEventListener('otra', () => {});   // otro evento: no se anota
  ok(subidosATres.size === 70, `se anota cada objeto subido una vez (${subidosATres.size})`);
  const n = soltarContextoViejo();
  ok(n === 70 && viejo.size === 0, `al perderse el contexto, el administrador viejo suelta todo (${n} avisados, quedan ${viejo.size})`);
  ok(subidosATres.size === 0, 'y la lista vuelve a empezar');
  ok(geos.every((g) => (g._l.dispose || []).length === 0) && mats.every((m) => (m._l.dispose || []).length === 0), 'sin oyentes viejos colgados');
  subir(geos[2]);
  ok(subidosATres.size === 1, 'lo que se vuelve a subir con el contexto nuevo se anota de nuevo');
  const malo = subir(new BufferGeometry()); malo.addEventListener('dispose', () => { throw new Error('x'); });
  ok(soltarContextoViejo() === 2, 'un oyente que falla no corta el resto');
}

// ---------------------------------------------------------------- 2. banderita y oficio
const bandera = leer('src/personal-bandera-mundo.js');
const quitar = bandera.slice(bandera.indexOf('for (const [o, g] of torres)'), bandera.indexOf('torres.delete(o);'));
ok(/escena\.remove\(g\);[\s\S]*g\.traverse\(\(m\) => \{ if \(m\.isMesh\) m\.geometry\.dispose\(\); \}\)/.test(quitar), 'la banderita de una torre que ya no está suelta sus geometrías');
ok(!/matMastil\.dispose|matPano\.dispose/.test(quitar), 'y no sus materiales (los comparten todas)');
// 3.6: pueblo-mundo.js (lo del oficio al lado de tu casa) se sacó con el pueblo de la 3.1; la gente
// de la aldea (aldea-gente.js) no arma geometría propia y cada figura se arma una sola vez
const aldeaGente = leer('src/aldea-gente.js');
ok(!fs.existsSync(new URL('../src/pueblo-mundo.js', import.meta.url)) && !/from 'three'|new THREE/.test(aldeaGente) && aldeaGente.includes('if (st.npc || !st.destino) continue;'), 'la gente de la aldea no deja geometrías sueltas');

// ---------------------------------------------------------------- 3. las herramientas
const soak = leer('herramientas/soak-largo.cjs');
ok(/app\.setPath\('userData', path\.join\(SALIDA, 'perfil'\)\)/.test(soak), 'soak-largo.cjs usa un perfil propio');
ok(!/APPDATA|AppData/.test(soak), 'y nunca el del jugador');
for (const a of ['diaNoche', 'estaciones', 'autoCalidad', 'distancia', 'construir', 'personal', 'fotos', 'talar', 'contexto', 'vehiculos', 'paneles', 'guardar']) ok(new RegExp(`A\\.${a} = async`).test(soak), `el soak largo hace "${a}"`);
ok(/ALTERNAR/.test(soak) && /recargarEn/.test(soak), 'y alterna Relax y Desafío recargando lo guardado');
ok(fs.existsSync(path.join(raiz, 'herramientas/comparar-snapshots.cjs')), 'comparar-snapshots.cjs para buscar qué crece entre dos heap snapshots');
ok(fs.existsSync(path.join(raiz, 'pruebas/humo-3-5-4-memoria.cjs')), 'y la partida real de la 3.5.4');

console.log(`OK 3.5.4 memoria · ${pasos} verificaciones`);
