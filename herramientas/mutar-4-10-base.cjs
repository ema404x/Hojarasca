// 4.10 base: rompe a propósito cada regla clave de «las defensas que mejoran, los trofeos y el perro que aprende» y comprueba que
// pruebas/verificar-4-10-base.mjs falla (si pasa, la prueba no vigilaba eso).
// Uso: node herramientas/mutar-4-10-base.cjs [parte-del-nombre]   (cambia un archivo de src/ por vez, corre la prueba y lo devuelve; dejá el árbol limpio antes)
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const MEJ = 'src/desafio-mejoras-base.js', MEJM = 'src/desafio-mejoras-base-mundo.js', TRO = 'src/desafio-trofeos.js', TROM = 'src/desafio-trofeos-mundo.js';
const PER = 'src/desafio-perro-aprende.js', JUE = 'src/desafio-base-juego.js', DES = 'src/desafio.js';
const MUTACIONES = [
  // las defensas que mejoran
  ['defensas: el nivel 1 con una sola noche', MEJ, 'noches: [0, 2, 4, 7],', 'noches: [0, 1, 4, 7],'],
  ['defensas: el nivel 3 más tarde', MEJ, 'noches: [0, 2, 4, 7],', 'noches: [0, 2, 4, 9],'],
  ['defensas: el nivel 1 no baja el daño', MEJ, 'dano: [1, 0.9, 0.8, 0.7],', 'dano: [1, 1, 0.8, 0.7],'],
  ['defensas: el nivel 3 baja de más', MEJ, 'dano: [1, 0.9, 0.8, 0.7],', 'dano: [1, 0.9, 0.8, 0.1],'],
  ['defensas: la noche cuenta sin daño ni participación', MEJ, 'const conto = curt.t === 1;', 'const conto = true;'],
  ['defensas: cuenta la marca de otra noche', MEJ, 'if (!curt || curt.e !== Math.floor(noche)) return', 'if (!curt) return'],
  ['defensas: el daño de otra noche vale', MEJ, 'if (curt && curt.e === Math.floor(noche)) curt.t = 1;', 'if (curt) curt.t = 1;'],
  ['defensas: al anochecer se pierde lo ganado', MEJ, 'return { n: curt?.n || 0, e: Math.floor(noche), t: 0 };', 'return { n: 0, e: Math.floor(noche), t: 0 };'],
  ['defensas: sin tope de noches', MEJ, 'Math.min(CURTIDO.tope, curt.n + 1)', 'curt.n + 1'],
  ['defensas: sube de nivel y se repara entera', MEJ, 'cura: 0.2,', 'cura: 5,'],
  ['defensas: se curte lo que sea', MEJ, 'export const curtible = (plano) => !!plano && CURTIBLES.includes(plano.id) && seRompe(plano);', 'export const curtible = (plano) => true;'],
  ['defensas: se curte la antorcha', MEJ, "'catapulta', 'escudo-energia', 'faro-plasma'];", "'catapulta', 'escudo-energia', 'faro-plasma', 'antorcha'];"],
  ['defensas: la placa no mira la geometría', MEJM, 'sitioDePlaca(plano, posiciones)', 'sitioDePlaca(plano)'],
  ['defensas: la experiencia sin tope en el saneo', MEJ, 'const n = ent(v.n, 0, CURTIDO.tope, 0)', 'const n = ent(v.n, 0, 1e9, 0)'],
  ['defensas: la placa no se cuelga', MEJM, 'o.grupo.add(mesh);\n    o.userCurtido', 'o.userCurtido'],
  ['defensas: la placa de otra malla', MEJM, 'mesh.castShadow = false; mesh.receiveShadow = true;', 'mesh.castShadow = true; mesh.receiveShadow = true;'],
  ['defensas: al subir no cura', MEJM, 'o.datos.vida = Math.min(max, o.datos.vida + max * CURTIDO.cura);', ''],
  ['defensas: al anochecer no anota', MEJM, 'o.datos.curt = alAnochecer(o.datos.curt, n);', ''],
  ['defensas: el bono de reparar sin tope', JUE, 'Math.min(REPARAR_TOPE, suma * REPARAR_POR_NIVEL)', 'suma * REPARAR_POR_NIVEL'],
  ['defensas: el bono de reparar con otro origen', JUE, "bonos.sumarBono(d, ORIGEN_DEFENSA, 'reparar'", "bonos.sumarBono(d, 'trofeo', 'reparar'"],
  // los trofeos
  ['trofeos: el mandamás clásico da el hongo', TRO, "{ clasico: 'casco', llamador: 'hongo'", "{ clasico: 'hongo', llamador: 'casco'"],
  ['trofeos: el bono del hongo diez veces más', TRO, "bono: { clave: 'recarga', valor: 0.06 }", "bono: { clave: 'recarga', valor: 0.6 }"],
  ['trofeos: el casco da una clave que no existe', TRO, "bono: { clave: 'saludMax', valor: 5 },\n    texto: 'El casco", "bono: { clave: 'vida', valor: 5 },\n    texto: 'El casco"],
  ['trofeos: la corona sin el Rey caído', TRO, "if (reyCaido || victoria) ids.push('corona');", "ids.push('corona');"],
  ['trofeos: lo nuevo se repite', TRO, 'if (j >= 1 && j !== vistos.jefe) {', 'if (j >= 1) {'],
  ['trofeos: lo perdido vuelve', TRO, "ahora.includes(id) && !vistos[id]", "ahora.includes(id)"],
  ['trofeos: el saneo deja cualquier id', TRO, "for (const id of IDS_TROFEOS) {\n    if (!Object.hasOwn(v, id)) continue;", "for (const id of Object.keys(v)) {\n    if (!Object.hasOwn(v, id)) continue;"],
  ['trofeos: los bonos con el tablero caído', TROM, 'aplicarBonos(lista.length > 0);', 'aplicarBonos(true);'],
  ['trofeos: el tablero caído no pierde los trofeos', TROM, '    c.trofeos = {};\n', ''],
  ['trofeos: cualquier obra caída pierde los trofeos', TROM, "if (!caidas?.some((o) => o.plano?.id === ID_TABLERO)) return false;", "if (!caidas?.length) return false;"],
  ['trofeos: no se cuelgan', TROM, "o.datos.colgados = ganados(crece().trofeos);\n      obras.rehacer?.(o);", "obras.rehacer?.(o);"],
  ['trofeos: la E de lejos', TROM, 'let mejor = null, d0 = RADIO_E;', 'let mejor = null, d0 = 1e9;'],
  ['trofeos: el bono con otro origen', TROM, 'bonos.sumarBono(d, ORIGEN_TROFEO,', "bonos.sumarBono(d, 'habilidad',"],
  ['trofeos: la puertita siempre abierta', TROM, 'puertitaAbierta: !!d.asedio && puedeAbordar(d.asedio)', 'puertitaAbierta: true'],
  ['trofeos: el tablero cuenta como defensa', 'src/planos-trofeos.js', "defensa: { tipo: 'trofeos', oculta: true },", "defensa: { tipo: 'trofeos' },"],
  ['trofeos: un trofeo con material de otro tipo', 'src/desafio-trofeos-formas.js', "{ color: '#2d2c35', tipo: 4,", "{ color: '#2d2c35', tipo: 2,"],
  ['trofeos: no se suman al menú', 'src/construccion.js', 'PIEZAS.push(...PIEZAS_TROFEOS);', ''],
  // el perro
  ['perro: el nivel 1 con una noche', PER, 'noches: [0, 3, 6, 10],', 'noches: [0, 1, 6, 10],'],
  ['perro: no gruñe de más lejos', PER, 'alcance: [1, 1.15, 1.3, 1.5],', 'alcance: [1, 1, 1, 1],'],
  ['perro: no muerde más fuerte', PER, 'dano: [1, 1.15, 1.3, 1.5],', 'dano: [1, 1, 1, 1],'],
  ['perro: sin tope de noches', PER, 'perro.noches = Math.min(PERRO_NIVELES.tope, (perro.noches || 0) + 1);', 'perro.noches = (perro.noches || 0) + 1;'],
  ['perro: aprende sin estar con vos', JUE, 'if (api.perroPresente?.()) {', 'if (true) {'],
  // el enganche con el juego
  ['juego: el daño no baja', DES, 'n *= baseCrece.factorDano(o); baseCrece.participo(o);', 'baseCrece.participo(o);'],
  ['juego: el golpe no cuenta', DES, 'n *= baseCrece.factorDano(o); baseCrece.participo(o);', 'n *= baseCrece.factorDano(o);'],
  ['juego: la ballesta no participa', DES, '      baseCrece.participo(o);   // 4.10 base: la que tira participa de la noche\n', ''],
  ['juego: no se anota al anochecer', DES, '    if (nuevaNoche) baseCrece.alAnochecer(d.oleadas);', ''],
  ['juego: no suma al amanecer', DES, '      baseCrece.alAmanecer(d.oleadas);', ''],
  ['juego: el tablero caído no avisa', DES, '    baseCrece.alCaer(caidas);', ''],
  ['juego: no se actualiza', DES, '    baseCrece.actualizar(dt);', ''],
  ['juego: el perro no avisa de más lejos', DES, ' * baseCrece.alcancePerro();', ';'],
  ['juego: el perro no muerde más', 'src/desafio-aliados.js', '9 * (api.danoPerro?.() ?? 1) * dt', '9 * dt'],
  ['juego: la E no va a la tabla', 'src/interacciones.js', "{ id: 'trofeos', cuando", "{ id: 'trofeos-x', cuando"],
  ['juego: la pantalla no muestra el nivel', 'src/main.js', 'desafio.baseCrece?.nombreDe(o) || ', ''],
  ['juego: la pantalla no cuenta lo que creció', 'src/main.js', ', crece: desafio?.baseCrece?.resumen()', ''],
  // lo guardado
  ['guardado: la experiencia no se sanea', 'src/guardado.js', 'const c = sanearCurtido(d.curt);', 'const c = d.curt;'],
  ['guardado: los trofeos colgados no se sanean', 'src/guardado.js', 'd.colgados.filter((id) => IDS_TROFEOS.includes(id))', 'd.colgados'],
  ['guardado: crece no se sanea', 'src/desafio-reglas.js', 'crece: sanearCrece(x.crece),', 'crece: x.crece,'],
  ['guardado: la partida nueva sin crece', 'src/desafio-reglas.js', '    crece: creceNuevo() };', '    };'],
  ['guardado: el perro no se sanea', 'src/desafio-crece.js', 'perro: sanearPerro(x.perro) };', 'perro: x.perro };'],
];
const solo = process.argv[2];
let fallaron = 0, sobrevivieron = [];
for (const [nombre, archivo, de, a] of MUTACIONES) {
  if (solo && !nombre.includes(solo)) continue;
  const ruta = path.join(raiz, archivo);
  const original = fs.readFileSync(ruta, 'utf8');
  if (!original.includes(de)) { console.log(`?? ${nombre}: no encuentro el texto en ${archivo}`); sobrevivieron.push(nombre + ' (texto no encontrado)'); continue; }
  fs.writeFileSync(ruta, original.replace(de, a));
  let r;
  try { r = spawnSync('node', ['pruebas/verificar-4-10-base.mjs'], { cwd: raiz, encoding: 'utf8', timeout: 120000 }); }
  finally { fs.writeFileSync(ruta, original); }
  const cayo = r.status !== 0;
  if (cayo) fallaron++; else sobrevivieron.push(nombre);
  const motivo = cayo ? ((r.stderr || '').split('\n').find((l) => /AssertionError|Error/.test(l)) || '').slice(0, 130) : '';
  console.log(`${cayo ? 'cae ' : 'PASA'} · ${nombre}${motivo ? ' · ' + motivo : ''}`);
}
console.log(`\n${fallaron} mutaciones hicieron fallar la prueba${sobrevivieron.length ? `; sobrevivieron ${sobrevivieron.length}: ${sobrevivieron.join(' | ')}` : ' (todas)'}`);
execSync('git status --short src', { cwd: raiz, stdio: 'inherit' });
