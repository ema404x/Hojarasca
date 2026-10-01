// 2.8: Personalizar → Tu refugio y tu pueblo, Tu jardín y Tu fortín con estilo.
//  · las secciones se registran y sanean cualquier cosa (partidas viejas, rotas o de otra versión),
//  · `aplicar` pasa el estilo a estilo-casa.js y llama a los enganches del mundo,
//  · las obras (armadas en una VM con el three local) se pintan, se adornan y se repintan
//    sólo cuando cambia su estilo; el jardín nace con la paleta y la conserva,
//  · la pintura del refugio vuelve exacta a la madera al elegir "natural".
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { secciones, sanearPersonal } from '../src/personal-todo.js';
import { sanearRefugio, sanearFortin, sanearJardin, aplicarRefugio, aplicarFortin, aplicarJardin } from '../src/personal-casa.js';
import * as E from '../src/estilo-casa.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

// ---------------------------------------------------------------- el registro
{
  const ids = secciones().map((s) => s.id);
  for (const id of ['refugio', 'jardin', 'fortin']) assert.ok(ids.includes(id), `falta la sección ${id}`);
  for (const s of secciones().filter((x) => ['refugio', 'jardin', 'fortin'].includes(x.id))) {
    assert.equal(typeof s.construir, 'function', `${s.id} sin construir`);
    assert.equal(typeof s.aplicar, 'function', `${s.id} sin aplicar`);
    assert.deepEqual(s.sanear(s.porDefecto()), s.porDefecto(), `${s.id}: lo de fábrica pasa el saneo igual`);
    for (const basura of [null, 7, 'x', [], { interior: 3, exterior: [], casas: 'rojo', madera: '__proto__', flores: 'constructor' }]) {
      const d = s.sanear(basura);
      assert.equal(JSON.stringify(s.sanear(d)), JSON.stringify(d), `${s.id}: el saneo es estable`);
    }
  }
  assert.match(leer('src/personal-todo.js'), /^import \{ SECCION_REFUGIO, SECCION_JARDIN, SECCION_FORTIN \} from '\.\/personal-casa\.js';$/m, 'el agregador importa las tres secciones en una línea');
}

// ---------------------------------------------------------------- sanear
{
  const r = sanearRefugio({
    pared: '#ABCDEF', aberturas: 'rojo', techo: 12,
    casas: { pared: '#112233', techo: '<b>' },
    interior: { alfombra: 'guarda', rincon: 'trono', ventana: 'vela', cuadroCama: 'f-pudu', cuadroCostado: '../../x' },
    exterior: { faroles: 'cuatro', cerco: 'muralla', mastil: 'si' },
  });
  assert.equal(r.pared, '#abcdef');
  assert.equal(r.aberturas, null);
  assert.equal(r.techo, null);
  assert.deepEqual(r.casas, { pared: '#112233', aberturas: null, techo: null });
  assert.equal(r.interior.alfombra, 'guarda');
  assert.equal(r.interior.rincon, 'nada', 'un mueble que no existe vuelve a nada');
  assert.equal(r.interior.cuadroCama, 'f-pudu');
  assert.equal(r.interior.cuadroCostado, '', 'un id de foto raro no pasa');
  assert.equal(r.exterior.faroles, 'cuatro');
  assert.equal(r.exterior.cerco, 'nada');
  assert.equal(r.exterior.mastil, true, 'el mástil viene puesto (ahí va la bandera)');
  assert.equal(sanearRefugio({ exterior: { mastil: false } }).exterior.mastil, false);

  const f = sanearFortin({ madera: 'pintada', pintura: '#123456', estandarte: '#B8342F', llama: 'constructor' });
  assert.deepEqual(f, { madera: 'pintada', pintura: '#123456', estandarte: '#b8342f', llama: 'fuego' });
  assert.equal(sanearFortin({ madera: 'hierro' }).madera, 'rustica');
  assert.deepEqual(sanearJardin({ flores: 'lupinos', seto: '__proto__', senda: 'ladrillo' }), { flores: 'lupinos', seto: 'calafate', senda: 'ladrillo' });

  // por el agregador, con lo de otras secciones al lado
  const p = sanearPersonal({ refugio: { pared: '#e6e1d3' }, fortin: 'roto', jardin: { flores: 'chilco' } });
  assert.equal(p.refugio.pared, '#e6e1d3');
  assert.deepEqual(p.fortin, E.fortinDefecto());
  assert.equal(p.jardin.flores, 'chilco');
  // el fuego "de siempre" es exactamente el de desafio-defensas.js
  const def = leer('src/desafio-defensas.js');
  for (const c of [E.LLAMAS.fuego.llama, E.LLAMAS.fuego.halo, E.LLAMAS.fuego.charco]) assert.ok(def.includes(`'${c}'`), `el fuego de fábrica usa ${c}`);
  assert.ok(def.includes('0xff9a45') && E.LLAMAS.fuego.luz === '#ff9a45');
}

// ---------------------------------------------------------------- aplicar y sus enganches
{
  const llamadas = [];
  const api = {
    progreso: { desafios: {} },
    mundo: {
      estructuras: { personal: { aplicar: (d, prog) => llamadas.push(['refugio', d, prog]) } },
      obras: () => ({ repintar: () => { llamadas.push(['repintar']); return 3; } }),   // también como función
    },
  };
  const n = aplicarRefugio({ pared: '#8a3b2e', casas: { techo: '#4f6b4a' }, exterior: { cerco: 'pirca' } }, api);
  assert.equal(n, 3);
  assert.equal(llamadas[0][0], 'refugio');
  assert.equal(llamadas[0][1].pared, '#8a3b2e');
  assert.equal(llamadas[0][1].exterior.cerco, 'pirca');
  assert.equal(llamadas[0][2], api.progreso, 'el refugio recibe el progreso (las fotos de los cuadros)');
  assert.deepEqual(E.ESTILO.casas, { pared: null, aberturas: null, techo: '#4f6b4a' }, 'la paleta de tus casas queda en ESTILO');
  aplicarFortin({ madera: 'pirca', estandarte: '#2f5a74', llama: 'azufre' }, api);
  assert.equal(E.ESTILO.fortin.madera, 'pirca');
  assert.equal(E.ESTILO.fortin.llama, 'azufre');
  aplicarJardin({ flores: 'mosqueta' }, api);
  assert.equal(E.ESTILO.jardin.flores, 'mosqueta');
  assert.equal(llamadas.filter((l) => l[0] === 'repintar').length, 3);
  // sin mundo (en el menú, o una prueba): no rompe
  assert.doesNotThrow(() => { aplicarRefugio(null, {}); aplicarFortin(undefined, null); aplicarJardin({}, { mundo: 5 }); });
  const v = E.ESTILO.version;
  assert.equal(E.fijarEstilo('jardin', { ...E.ESTILO.jardin }), false, 'lo mismo no cuenta como cambio');
  assert.equal(E.ESTILO.version, v);
  assert.equal(E.fijarEstilo('version', {}), false);
  assert.equal(E.fijarEstilo('__proto__', {}), false);
}

// ---------------------------------------------------------------- las reglas puras
{
  const pared = { id: 'pared-modular', categoria: 'refugios', pieza: true, snap: { tipo: 'muro' } };
  const techo = { id: 'techo-modular', categoria: 'refugios', pieza: true, snap: { tipo: 'techo' } };
  const piso = { id: 'piso-modular', categoria: 'refugios', pieza: true, snap: { tipo: 'piso' } };
  const puesto = { id: 'puesto', categoria: 'refugios' };
  assert.equal(E.zonaCasa(pared, '', '#8a6b4a'), 'pared');
  assert.equal(E.zonaCasa(pared, '', '#4a3b2c'), 'aberturas');
  assert.equal(E.zonaCasa(techo, '', '#4e4038'), 'techo');
  assert.equal(E.zonaCasa(techo, '', '#4a3b2c'), null, 'la cumbrera no es chapa');
  assert.equal(E.zonaCasa(piso, '', '#8a6b4a'), null);
  assert.equal(E.zonaCasa(puesto, 'Piso de tablas', '#8a6b4a'), null);
  assert.equal(E.zonaCasa(puesto, 'Paredes de tronco', '#6b5238'), 'pared');
  assert.equal(E.zonaCasa(puesto, 'Techo y terminaciones', '#453a30'), 'techo');
  assert.equal(E.zonaCasa({ categoria: 'refugios' }, 'Entramado y cerramiento', '#91a7a3'), null, 'el vidrio no se pinta');
  assert.equal(E.zonaFortin({ categoria: 'defensa' }, '#6b5238'), 'madera');
  assert.equal(E.zonaFortin({ categoria: 'defensa' }, '#7d766c'), null);

  // pintar conserva la veta y no toca lo de afuera del rango
  const a = new Float32Array([0.1, 0.08, 0.05, 0.2, 0.16, 0.1, 0.3, 0.3, 0.3]);
  const antes = a.slice();
  assert.equal(E.pintarRangos(a, [[0, 2]], '#e6e1d3'), 2);
  assert.ok(a[0] > antes[0] && a[3] > a[0], 'se aclara hacia la cal y el más claro sigue más claro');
  assert.deepEqual([...a.slice(6)], [...antes.slice(6)], 'fuera del rango, igual');
  assert.equal(E.pintarRangos(a, [[0, 2]], 'rojo'), 0);

  // casas: piezas que se tocan son una casa; la más cercana primero
  const pieza = (x, z, id = 'pared-modular', extra = {}) => ({ plano: { id, categoria: 'refugios', pieza: true, etapas: [{}] }, datos: { x, z, etapas: 1, ...extra } });
  const casas = E.agruparCasas([pieza(0, 0), pieza(1.5, 0), pieza(3, 0), pieza(40, 0), pieza(41.5, 0), pieza(80, 0, 'pared-modular', { etapas: 0 }),
    { plano: { id: 'banco', categoria: 'mobiliario', pieza: true, etapas: [{}] }, datos: { x: 0.5, z: 0, etapas: 1 } }], { x: 39, z: 0 });
  assert.deepEqual(casas.map((c) => c.n), [2, 3], 'dos casas, sin la marca sin empezar ni el banco');
  assert.ok(Math.abs(casas[0].x - 40.75) < 1e-9);

  // el mástil: coordenadas del refugio al mundo
  const m = E.posicionMastil({ x: 10, z: 20, rot: 0 });
  assert.deepEqual(m, { x: 10 + E.MASTIL_LOCAL.lx, z: 20 + E.MASTIL_LOCAL.lz });
  const m2 = E.posicionMastil({ x: 0, z: 0, rot: Math.PI / 2 });
  assert.ok(Math.abs(m2.x - E.MASTIL_LOCAL.lz) < 1e-9 && Math.abs(m2.z + E.MASTIL_LOCAL.lx) < 1e-9);
}

// ---------------------------------------------------------------- las obras, armadas en una VM
{
  const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
  const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
  const info = new Map(), orden = [], visitando = new Set(), visitado = new Set();
  const visitar = (f) => {
    f = path.resolve(f);
    if (visitado.has(f)) return;
    if (visitando.has(f)) throw new Error('ciclo en ' + f);
    visitando.add(f);
    const texto = fs.readFileSync(f, 'utf8'), deps = [];
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(normalizar(f, m[2]));
    info.set(f, texto);
    for (const d of deps) visitar(d);
    visitando.delete(f); visitado.add(f); orden.push(f);
  };
  visitar(path.join(src, 'construccion.js'));
  const transformar = (f, t) => {
    const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) =>
      `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); }).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
    t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '').replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm, '');
    return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += `
;globalThis.__CASA=(()=>{
  const C=__mod_construccion, E=__mod_estilo_casa, M=__mod_personal_casa_mundo, G=__mod_geometria;
  const col={agregar(){},agregarPlataforma(){},plataformaEn:()=>null,eliminarPorDuenio(){}};
  const T={altura:()=>0,agua:()=>false,normal:()=>new THREE.Vector3(0,1,0),indice:()=>0,distRiel:[999],distSendero:[999],lugares:{}};
  const veg={arboles:[],despejar(){}};
  const madera=new THREE.MeshLambertMaterial({color:0x6b5238});
  const lista=[];
  const inter={lista,
    agregar(o){ const g=new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(1,2,0.06),madera)); lista.push({g,duenio:o.duenio}); },
    agregarPostigos(){},
    eliminarPorDuenio(d){ for(let i=lista.length-1;i>=0;i--) if(lista[i].duenio===d) lista.splice(i,1); } };
  const S=C.crearConstruccion(T,new THREE.Scene(),col,veg,inter);
  const r={};
  const media=(o,canal)=>{ const a=o.malla.geometry.getAttribute('color').array; let s=0; for(let i=canal;i<a.length;i+=3)s+=a[i]; return s/(a.length/3); };
  const verts=(o)=>o.malla.geometry.getAttribute('position').count;
  const tipos=(o)=>[...new Set(o.malla.geometry.getAttribute('aTipo').array)].sort();
  const por=(id)=>S.obras.find(o=>o.plano.id===id);

  // tus casas
  S.sincronizar([{plano:'pared-puerta',x:0,z:0,rot:0,etapas:1},{plano:'pared-modular',x:0,z:3,rot:0,etapas:1},{plano:'techo-modular',x:0,z:1.5,y:2.3,rot:0,etapas:1},
    {plano:'piso-modular',x:0,z:1.5,rot:0,etapas:1},{plano:'puesto',x:60,z:0,rot:0,etapas:4},{plano:'banco',x:30,z:0,rot:0,etapas:1}]);
  r.sinCambio=S.repintar();
  const p=por('pared-puerta'), t=por('techo-modular'), pu=por('puesto'), pm=por('pared-modular');
  const rojoTecho0=media(t,0)-media(t,1), luzPared0=media(p,1), vertsPared=verts(p);
  E.fijarEstilo('casas',{pared:'#e6e1d3',aberturas:'#35557a',techo:'#8e3a2c'});
  r.pintadas=S.repintar();
  r.otraVez=S.repintar();
  r.paredMasClara=media(p,1)>luzPared0*1.5;
  r.techoMasRojo=(media(t,0)-media(t,1))>rojoTecho0+0.05;
  r.mismaGeometria=verts(p)===vertsPared;
  r.puertaPintada=lista.filter(x=>x.duenio===p).map(x=>'#'+x.g.children[0].material.color.getHexString());
  r.puestoPintado=pu.firmaEstilo;
  // una casa con sus colores; T le gana a la pintura
  S.pintarCasa([pm],{pared:'#8a3b2e',aberturas:null,techo:null});
  r.propia=JSON.stringify(pm.datos.pintura);
  r.propiaSinCambio=S.repintar();
  S.tenir(pm,'ocre');
  r.tenidaSinPintura=pm.datos.pintura===undefined && pm.datos.tinte==='ocre';
  r.casas=S.casas({x:59,z:0}).map(c=>c.n);
  E.fijarEstilo('casas',{pared:null,aberturas:null,techo:null});
  r.vuelta=S.repintar();
  r.puertaNatural=lista.filter(x=>x.duenio===p).map(x=>x.g.children[0].material===madera);

  // el fortín
  S.sincronizar([{plano:'empalizada',x:200,z:0,rot:0,etapas:1},{plano:'torre-vigia',x:220,z:0,rot:0,etapas:1},{plano:'porton-empalizada',x:240,z:0,rot:0,etapas:1},{plano:'muro-piedra',x:260,z:0,rot:0,etapas:1}]);
  const em=por('empalizada'), to=por('torre-vigia'), po=por('porton-empalizada'), mu=por('muro-piedra');
  const v0={em:verts(em),to:verts(to),po:verts(po),mu:verts(mu)}, rojo0=media(em,0)-media(em,2);
  E.fijarEstilo('fortin',{madera:'pirca',pintura:'#35557a',estandarte:'#b8342f',llama:'cobre'});
  r.fortinRehechas=S.repintar();
  r.pirca={em:verts(em)>v0.em,to:verts(to)>v0.to,po:verts(po)>v0.po,mu:verts(mu)===v0.mu};
  r.tiposFortin=[...new Set([...tipos(em),...tipos(to),...tipos(po)])];
  E.fijarEstilo('fortin',{madera:'pintada',pintura:'#35557a',estandarte:null,llama:'fuego'});
  S.repintar();
  r.pintadaAzul=(media(em,2)-media(em,0))>-rojo0+0.03 && verts(em)===v0.em;
  E.fijarEstilo('fortin',{madera:'rustica',pintura:'#35557a',estandarte:null,llama:'fuego'});
  S.repintar();
  r.rusticaIgual=verts(em)===v0.em && verts(to)===v0.to && Math.abs((media(em,0)-media(em,2))-rojo0)<1e-6;

  // el jardín
  E.fijarEstilo('jardin',{flores:'chilco',seto:'ligustro',senda:'ladrillo'});
  for(const [i,id] of ['cantero-flores','macizo-flores','maceton','seto','senda-piedra'].entries()){
    S.elegir(C.PLANO[id]); S.moverFantasma(400+i*20,0,0);
    const f=S.fundar(400+i*20,0,0); if(!f.ok) throw Error('no se fundó '+id+': '+f.motivo);
    const a=S.avanzar(f.obra,{tronco:99,tabla:99,piedra:99}); if(!a.ok) throw Error('no se armó '+id+': '+a.motivo);
  }
  S.elegir(null);
  const jard=S.obras.filter(o=>o.plano.jardin);
  r.jardinNace=jard.map(o=>o.datos.jardin);
  r.jardinTipos=[...new Set(jard.flatMap(o=>tipos(o)))];
  const ca=jard.find(o=>o.plano.id==='cantero-flores');
  const rojoChilco=media(ca,0)-media(ca,1);
  E.fijarEstilo('jardin',{flores:'lupinos',seto:'calafate',senda:'canto'});
  r.jardinConserva=S.repintar();
  r.restilizadas=S.restilizarJardin();
  r.cambioColor=Math.abs((media(ca,0)-media(ca,1))-rojoChilco)>0.02;
  r.jardinAhora=jard.map(o=>o.datos.jardin);
  r.planosJardin=C.PLANOS.filter(p=>p.jardin).map(p=>({id:p.id,categoria:p.categoria,soloRelax:!!p.soloRelax}));

  // el refugio: la pintura vuelve exacta y los lugares se arman
  const c=new G.Constructor(), marcas=E.marcarConstructor(c);
  marcas.zona='pared'; c.agregar(new THREE.BoxGeometry(1,1,1),{color:'#6b5238',tipo:0});
  marcas.zona='aberturas'; c.agregar(new THREE.BoxGeometry(1,1,1),{color:'#8a6b4a',tipo:4});
  marcas.zona='techo'; c.agregar(new THREE.BoxGeometry(1,1,1),{color:'#43372f',tipo:4}); c.agregar(new THREE.BoxGeometry(1,1,1),{color:'#44352a',tipo:4});
  marcas.zona=null; c.agregar(new THREE.BoxGeometry(1,1,1),{color:'#241d18',tipo:4});
  const malla=new THREE.Mesh(c.geometria(),madera);
  const colores0=malla.geometry.getAttribute('color').array.slice();
  const raizR=new THREE.Group(), obs=[];
  const colR={agregar:(o)=>obs.push(o),eliminarPorDuenio:(d)=>{for(let i=obs.length-1;i>=0;i--) if(obs[i].duenio===d) obs.splice(i,1);}};
  const puertaRef={g:new THREE.Group(),nombre:'la puerta del refugio'}; puertaRef.g.add(new THREE.Mesh(new THREE.BoxGeometry(1,2,0.06),madera));
  const deco=M.crearDecoRefugio({T,col:colR,ref:{x:5,y:1,z:5,rot:0.4},raiz:raizR,mat:madera,pintable:{malla,marcas},puertas:{lista:[puertaRef]}});
  r.decoColgado=raizR.children.includes(deco.grupo);
  r.mastilDeFabrica=deco.mastil.visible && obs.length===1 && !!deco.mastil.grupo && !!deco.mastil.bandera && Number.isFinite(deco.mastil.tope.y);
  const d={pared:'#e6e1d3',aberturas:'#35557a',techo:'#8e3a2c',casas:{},interior:{alfombra:'guarda',rincon:'sillon',rinconPuerta:'perchero',ventana:'macetas',mesa:'mate',cuadroCostado:'',cuadroCama:''},exterior:{faroles:'cuatro',cerco:'pirca',mastil:false}};
  deco.aplicar(d,{desafios:{}});
  const a=malla.geometry.getAttribute('color').array;
  const zona=(k)=>[...a.slice(k*108,(k+1)*108)].join()!==[...colores0.slice(k*108,(k+1)*108)].join();
  r.zonas=[zona(0),zona(1),zona(2),zona(3),zona(4)];
  r.puertaRef='#'+puertaRef.g.children[0].material.color.getHexString();
  r.estado=deco.estado();
  r.fisica=obs.length;
  deco.aplicar({pared:null,aberturas:null,techo:null,interior:{},exterior:{faroles:'nada',cerco:'nada',mastil:true}},null);
  r.colorExacto=[...a].join()===[...colores0].join();
  r.puertaRefNatural=puertaRef.g.children[0].material===madera;
  r.estadoVacio=deco.estado();
  r.fisicaVacia=obs.length;
  return r;
})();`;
  const ctx = { console, Math, Float32Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Date, JSON, Object, performance: { now: () => 0 } };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { timeout: 30000 });
  const r = JSON.parse(JSON.stringify(ctx.__CASA));

  assert.equal(r.sinCambio, 0, 'con el estilo de fábrica no se rehace nada');
  assert.equal(r.pintadas, 4, 'se repintan las dos paredes, el techo y el puesto (el piso y el banco no)');
  assert.equal(r.otraVez, 0, 'repintar dos veces no rehace de nuevo');
  assert.ok(r.paredMasClara, 'la pared quedó a la cal');
  assert.ok(r.techoMasRojo, 'el techo quedó de chapa colorada');
  assert.ok(r.mismaGeometria, 'pintar no cambia la forma');
  assert.equal(r.puertaPintada.length, 1);
  assert.notEqual(r.puertaPintada[0], '6b5238', 'la hoja de la puerta se pintó');
  assert.match(r.puestoPintado, /^c\|#e6e1d3\|#35557a\|#8e3a2c$/);
  assert.equal(r.propia, JSON.stringify({ pared: '#8a3b2e', aberturas: null, techo: null }));
  assert.equal(r.propiaSinCambio, 0);
  assert.ok(r.tenidaSinPintura, 'teñir con T saca la pintura propia');
  assert.deepEqual(r.casas, [1, 4], 'el puesto primero (el más cercano) y la casa modular de cuatro piezas');
  assert.equal(r.vuelta, 3, 'volver a la madera rehace lo pintado (la pieza teñida conserva su tinte)');
  assert.deepEqual(r.puertaNatural, [true], 'la puerta vuelve a su madera');

  assert.equal(r.fortinRehechas, 3, 'el muro de pirca no tiene madera ni estandarte: no se rehace');
  assert.deepEqual(r.pirca, { em: true, to: true, po: true, mu: true });
  assert.deepEqual(r.tiposFortin.filter((x) => x !== 0 && x !== 4), [], 'los adornos usan sólo madera (0) y piedra (4)');
  assert.ok(r.pintadaAzul, 'la madera pintada de azul se ve azul');
  assert.ok(r.rusticaIgual, 'volver a la madera rústica deja la pieza como era');

  assert.deepEqual(r.jardinNace, ['chilco', 'chilco', 'chilco', 'ligustro', 'ladrillo'], 'cada pieza nace con la paleta de ese momento');
  assert.deepEqual(r.jardinTipos.filter((x) => x !== 0 && x !== 4), [], 'el jardín usa sólo tipo 0/4');
  assert.equal(r.jardinConserva, 0, 'cambiar la paleta no toca lo plantado');
  assert.equal(r.restilizadas, 5);
  assert.ok(r.cambioColor, 'el cantero cambió de chilco a lupinos');
  assert.deepEqual(r.jardinAhora, ['lupinos', 'lupinos', 'lupinos', 'calafate', 'canto']);
  assert.equal(r.planosJardin.length, 5);
  for (const p of r.planosJardin) assert.ok(p.categoria === 'exterior' && p.soloRelax, `${p.id}: en Exterior y sólo en Relax`);

  assert.ok(r.decoColgado, 'lo del refugio cuelga del complejo del refugio (LOD)');
  assert.ok(r.mastilDeFabrica, 'el mástil viene puesto, con su física, su punta y el paño');
  assert.deepEqual(r.zonas, [true, true, true, false, false], 'se pintan pared, aberturas y las tablas del techo; la estructura y lo demás no');
  assert.notEqual(r.puertaRef, '6b5238', 'la puerta del refugio se pintó');
  for (const k of ['alfombra', 'rincon', 'rinconPuerta', 'ventana', 'mesa', 'faroles', 'cerco']) assert.ok(r.estado.puesto[k]?.visible, `se armó ${k}`);
  assert.equal(r.estado.mastil, false);
  assert.ok(r.fisica >= 5, 'sillón, perchero, cuatro faroles y el cerco chocan');
  assert.ok(r.colorExacto, 'volver a natural deja los colores exactos');
  assert.ok(r.puertaRefNatural);
  for (const k of ['alfombra', 'rincon', 'faroles', 'cerco']) assert.ok(!r.estadoVacio.puesto[k]?.visible, `se sacó ${k}`);
  assert.equal(r.estadoVacio.mastil, true);
  assert.equal(r.fisicaVacia, 1, 'queda sólo la física del mástil');
}

// ---------------------------------------------------------------- el código
{
  const cons = leer('src/construccion.js'), est = leer('src/estructuras.js'), fort = leer('src/desafio-fortin-mundo.js');
  assert.match(cons, /registrarAmbientacionPremium\(obra\);\n\s+pintarPuertasObra\(obra\);/, 'las puertas de las obras se pintan al colgarse');
  assert.match(est, /personal = crearDecoRefugio\(/, 'estructuras crea lo del refugio');
  assert.match(est, /personal, mastil: personal\?\.mastil \|\| null/, 'estructuras devuelve el mástil para la bandera');
  assert.match(fort, /refrescar[\s\S]*pintarLlamas\(\);/, 'el fortín pinta el fuego de las antorchas en su repaso');
  for (const f of ['estilo-casa.js', 'personal-casa.js']) {
    const t = leer('src/' + f);
    assert.ok(!/^import \* as THREE/m.test(t) && !/^\s*document\./m.test(t.split('\nfunction ')[0]), `${f} es puro al importarse`);
    for (const m of t.matchAll(/^import .*$/gm)) assert.ok(/ from '[^']+';$/.test(m[0]), `${f}: import en una línea`);
  }
  for (const f of ['estilo-casa.js', 'personal-casa.js', 'personal-casa-mundo.js']) {
    for (const m of leer('src/' + f).matchAll(/^export\s+(?:const|function)\s+([^\s=(]+)/gm)) assert.ok(/^[A-Za-z_$][\w$]*$/.test(m[1]), `${f}: ${m[1]} sin eñes ni acentos`);
  }
}

console.log('2.8 casa: ok · refugio (pintura, adentro, afuera, mástil) · tus casas (paleta y por casa) · fortín (pirca, pintada, estandarte, fuego) · jardín (5 piezas con paleta)');
