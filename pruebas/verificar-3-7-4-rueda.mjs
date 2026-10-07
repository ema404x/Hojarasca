// 3.7.4 "Vida social tipo Sims" (PLAN_3_7.md): lo que se ve y se oye, sin Electron.
//  · la rueda (social-rueda.js): las categorías de las reglas, lo de siempre por su lugar en el menú, «chau» al final,
//    el submenú en una sola rueda, la marca inicial, las flechas, el mouse y el palito;
//  · los íconos (social-iconos.js): un dibujo para cada uno de los 55 de las reglas y para cada emoción;
//  · las animaciones (social-anim.js): cada id de ANIM_VECINO, sin NaN, las de a dos se acercan y vuelven; tus manos
//    (social-mundo.js) con ids de ANIM_JUGADOR;
//  · las voces (social-voz.js): los chicos más agudos, los mayores más graves, corto, la pregunta sube;
//  · lo que hace el juego (social-juego.js, con figuras de mentira): la interacción, entre vecinos, la iniciativa;
//  · los enganches en main.js, gente.js, jugador.js, aldea-gente.js, sonido.js y la plantilla.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as S from '../src/vecindad-social.js';
import * as R from '../src/social-rueda.js';
import * as I from '../src/social-iconos.js';
import * as AN from '../src/social-anim.js';
import * as VZ from '../src/social-voz.js';
import { crearSocialJuego, SOCIAL } from '../src/social-juego.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

// ============================================================ los íconos
{
  const dibujo = new Set(I.iconosConDibujo());
  for (const ic of S.ICONOS) ok(dibujo.has(ic), `ícono de las reglas sin dibujo: ${ic}`);
  for (const e of S.EMOCIONES) ok(dibujo.has(e), `emoción sin dibujo: ${e}`);
  for (const c of S.CATEGORIAS_RUEDA) ok(dibujo.has(c.icono), `categoría sin dibujo: ${c.icono}`);
  ok(I.NOMBRES_ICONOS.length <= I.LADO_ATLAS * I.LADO_ATLAS && new Set(I.NOMBRES_ICONOS).size === I.NOMBRES_ICONOS.length, 'el atlas: entran todos, sin repetidos');
  ok(I.posicionCss('burbuja') === '0.000% 0.000%' && I.celdaIcono('no-existe').i === I.celdaIcono('pregunta').i, 'la celda y la posición del fondo');
  ok(leer('src/plantilla.html').includes(`background-size: ${I.LADO_ATLAS * 100}% ${I.LADO_ATLAS * 100}%;`), 'el CSS usa el mismo lado del atlas');
}

// ============================================================ la rueda
const MENU = { tipo: 'charla', texto: '¿Qué contás?', i: 0, opciones: [
  { id: 'servicio', titulo: '¿Qué tenés para hoy?' }, { id: 'como-andas', titulo: '¿Cómo andás?' }, { id: 'novedades', titulo: 'Novedades' }, { id: 'historia', titulo: 'Tu historia' },
  { id: 'regalar', titulo: 'Regalar…' }, { id: 'invitar', titulo: 'Invitar a tomar algo…' }, { id: '__lugar', titulo: 'Ver qué hay en el almacén' }, { id: 'chau', titulo: 'Nada más, chau' }] };
const partida = () => ({ dia: 3, horas: 12, cosas: { yerba: 3 }, materiales: {}, entradas: {}, vecindad: { personas: {}, hechos: [] } });
{
  const p = partida();
  const soc = S.opcionesRueda('carpintero', p, { dia: 3, hora: 12, menu: R.menuParaRueda(MENU) });
  const r = R.armarRueda(MENU, soc, S.CATEGORIAS_RUEDA);
  const ids = r.categorias.map((c) => c.id);
  ok(r.tipo === 'categorias' && ids[ids.length - 1] === 'chau' && r.categorias.at(-1).directa?.plano === 7, `«chau» al final, directo (${ids.join(', ')})`);
  ok(['charla', 'amistosa', 'graciosa', 'juntos', 'ayuda', 'picante'].every((k) => ids.includes(k)), 'las categorías de las reglas');
  const planos = r.categorias.flatMap((c) => c.opciones.map((o) => o.plano)).filter((x) => x !== null).sort((a, b) => a - b);
  ok(JSON.stringify(planos) === '[0,1,2,3,4,5,6]', `lo de siempre está todo, una vez, por su lugar (${planos})`);
  ok(r.categorias.find((c) => c.id === 'ayuda').opciones.some((o) => o.plano === 6), 'lo del lugar, en «Regalar y ayudar»');
  ok(r.categorias.find((c) => c.id === 'ayuda').opciones[0].plano === 0, 'el servicio, primero');
  ok(r.categorias.flatMap((c) => c.opciones).filter((o) => o.social).every((o) => S.esInteraccion(o.social)), 'lo nuevo, con su id de las reglas');
  ok(R.marcaInicial(r, { primera: 0 }) === ids.indexOf('ayuda') && R.marcaInicial(r, { alFinal: true }) === ids.length - 1 && R.marcaInicial(r, { alFinal: true, volverA: 'graciosa' }) === ids.indexOf('graciosa'), 'la marca: el servicio, «chau» después de un tema, la misma categoría después de una interacción');
  const a1 = R.anillo(r, 1), a2 = R.anillo(r, 2, 'amistosa');
  ok(a1.length === r.categorias.length && a1.every((s) => s.categoria || s.opcion) && a2.every((s) => s.opcion && !s.categoria), 'los dos anillos');
  // sin reglas (alguien que no es vecino): lo de siempre igual, por categorías
  const r0 = R.armarRueda(MENU, [], S.CATEGORIAS_RUEDA);
  ok(r0.categorias.flatMap((c) => c.opciones).length === 7, 'sin reglas, lo de siempre igual');
  // un submenú: una sola rueda, como venía
  const sub = { tipo: 'regalar', texto: '¿Qué le regalás?', i: 0, opciones: [{ id: 'regalar:yerba', titulo: 'Yerba (tenés 3)' }, { id: 'volver', titulo: 'Mejor no' }] };
  const rs = R.armarRueda(sub, null, S.CATEGORIAS_RUEDA);
  ok(rs.tipo === 'lista' && rs.opciones[0].icono === 'mate' && rs.opciones[1].icono === 'volver', 'el submenú, en una rueda con sus íconos');
  // la geometría
  ok(R.sectorDeDireccion(0, -100, 8) === 0 && R.sectorDeDireccion(100, 0, 8) === 2 && R.sectorDeDireccion(0, 100, 8) === 4 && R.sectorDeDireccion(3, 3, 8, 36) === -1, 'apuntar: arriba, derecha, abajo; en el centro, nada');
  ok(R.sectorConFlecha(0, 8, 'abajo') === 4 || R.sectorConFlecha(0, 8, 'abajo') === 3 || R.sectorConFlecha(0, 8, 'abajo') === 5, 'las flechas, al de ese lado');
  const pp = R.moverPuntero({ x: 0, y: 0 }, 500, 0, 110);
  ok(Math.abs(pp.x - 110) < 1e-9, 'el puntero no sale del aro');
  ok(R.renglonCorto('Para mí que mañana llueve. Y fuerte.') === 'Para mí que mañana llueve.' && R.renglonCorto('x'.repeat(80)).endsWith('…'), 'el renglón corto');
  ok(R.iconoDeTexto('¿Fuiste a pescar truchas?') === 'pez' && R.iconoDeTexto('La trochita viene tarde') === 'tren' && R.iconoDeTexto('hola', 'leyenda') === 'luna', 'el ícono del tema');
  const rel = R.relacionVista(S.relacionDe('carpintero', p, {}));
  ok(rel.marcas.amigo === 25 && rel.marcas.compadre === 70 && rel.romanceVisible === false, 'la barra: las marcas de los niveles');
}

// ============================================================ las animaciones
const hueso = () => ({ rotation: { x: 0, y: 0, z: 0, order: 'XYZ' }, position: { y: 0.82 }, userData: { codo: { rotation: { x: 0 } }, rodilla: { rotation: { x: 0 } } } });
const figura = (x = 0, z = 0) => ({ fase: 0, torso: hueso(), cabeza: hueso(), brazos: [hueso(), hueso()], patas: [hueso(), hueso()], pos: { x, z }, vel: 0, g: { scale: { y: 1 } } });
{
  for (const id of S.ANIM_VECINO) {
    ok(AN.animDe(id) === id, `animación de las reglas sin hacer: ${id}`);
    const g = figura();
    AN.empezarAnim(g, id, { hacia: { x: 2, z: 0 } });
    for (let i = 0; i < 30; i++) { g.fase += 0.1; AN.animarSocial(g, 0.1); }
    const nums = [g.brazos[0].rotation.x, g.brazos[1].rotation.z, g.torso.rotation.x, g.cabeza.rotation.y, g.pos.x];
    ok(nums.every(Number.isFinite), `${id}: sin NaN`);
  }
  const g = figura();
  AN.empezarAnim(g, 'abrazar', { hacia: { x: 2, z: 0 } });
  g.__gesto = 'sonrisa';
  for (let i = 0; i < 20; i++) { g.fase += 0.1; AN.animarSocial(g, 0.1); }
  ok(g.pos.x > 1 && Number.isFinite(g.animSocial.mira), `el abrazo: se acerca y mira al otro (${g.pos.x.toFixed(2)})`);
  for (let i = 0; i < 20; i++) { g.fase += 0.2; AN.animarSocial(g, 0.2); }
  ok(!g.animSocial && g.__volverA && g.__volverA.x === 0, 'termina sola y vuelve a donde estaba');
  for (let i = 0; i < 60; i++) AN.volverDeAnim(g, 0.1);
  ok(Math.abs(g.pos.x) < 0.05 && !g.__volverA, 'y llega');
  const r = figura(); r.vel = 1;
  AN.empezarAnim(r, 'reir'); r.fase += 0.1; AN.animarSocial(r, 0.1);
  ok(!r.animSocial, 'si arranca a caminar, se corta');
  ok(AN.animDe('volar') === null && !AN.empezarAnim(figura(), 'volar'), 'lo que no existe, no');
  const mm = leer('src/social-mundo.js');
  const manos = [...mm.matchAll(/^\s+(?:'([a-z-]+)'|([a-z]+)): '[a-z-]+',?/gm)];
  ok(mm.includes('export const MANOS_DE = {'), 'tus manos: la tabla');
  const tabla = mm.slice(mm.indexOf('export const MANOS_DE = {'), mm.indexOf('};', mm.indexOf('export const MANOS_DE = {')));
  const claves = [...tabla.matchAll(/(?:'([a-z-]+)'|\b([a-z]+)): '/g)].map((m) => m[1] || m[2]);
  ok(claves.length >= 12 && claves.every((k) => S.ANIM_JUGADOR.includes(k)), `tus manos, con ids de ANIM_JUGADOR (${claves.length}; ${manos.length})`);
}

// ============================================================ las voces
{
  const chico = VZ.vozDe('aldea-nene'), mujer = VZ.vozDe('poblador-panadera'), hombre = VZ.vozDe('carpintero'), abuelo = VZ.vozDe('ramon');
  ok(chico.f0 > mujer.f0 && mujer.f0 > hombre.f0 && hombre.f0 > abuelo.f0 * 0.98, `los tonos (chico ${chico.f0}, mujer ${mujer.f0}, hombre ${hombre.f0}, mayor ${abuelo.f0})`);
  ok(chico.velocidad > abuelo.velocidad && abuelo.temblor >= 0, 'los chicos hablan más rápido que los mayores');
  ok(JSON.stringify(VZ.vozDe('aldea-jefe')) === JSON.stringify(VZ.vozDe('aldea-jefe')), 'siempre la misma voz');
  const largo = VZ.planBalbuceo('Esto es un renglón larguísimo que dice muchas cosas sobre el tren, la lluvia y la pesca en el lago.', hombre, 1);
  ok(largo.dur <= VZ.BALBUCEO.maxDur + 0.6 && largo.silabas.length <= VZ.BALBUCEO.maxSilabas, `corto aunque el texto sea largo (${largo.dur} s)`);
  const preg = VZ.planBalbuceo('¿Vamos a pescar mañana temprano?', hombre, 2);
  ok(preg.silabas.at(-1).f0 > preg.silabas[Math.floor(preg.silabas.length / 2)].f0, 'la pregunta sube al final');
  const s = leer('src/sonido.js');
  ok(s.includes('  balbuceo(plan, { pos = null, vol = 0.06, cuando = 0 } = {}) {') && s.includes("const destino = pos ? this.fuente(pos, 1, 0.25) : this.bus.efectos;") && s.includes("suave.type = 'lowpass'; suave.frequency.value = 3400;"), 'el balbuceo: al bus de los efectos, con pasabajos');
}

// ============================================================ lo que hace el juego (con figuras de mentira)
{
  const p = partida();
  const llamadas = { anim: [], burbuja: [], emocion: [], voz: [], manos: [] };
  const vecina = { ...figura(0, 0), clave: 'aldea-carpintero', claveAldea: 'carpintero', nombre: 'Tito' };
  const otro = { ...figura(1.5, 0), clave: 'aldea-herrero', claveAldea: 'herrero', nombre: 'Hugo' };
  const sj = crearSocialJuego({
    social: S, progreso: () => p, dia: () => 3, hora: () => 12, ritmo: () => 'animado', desafio: () => false, jugador: () => ({ x: 0, z: 2 }),
    gente: () => [vecina, otro], claveDe: (n) => n.claveAldea, hablandoCon: () => null,
    mundo: { burbuja: (n, i, o) => llamadas.burbuja.push([n.claveAldea, i, o?.renglon || '']), emocion: (n, i) => llamadas.emocion.push([n.claveAldea, i]), quitar: () => {} },
    anim: { empezar: (g, id, o) => { llamadas.anim.push([g.claveAldea, id]); return AN.empezarAnim(g, id, o); }, terminar: (g) => AN.terminarAnim(g) },
    manos: { empezar: (id) => llamadas.manos.push(id), cachetada: () => {} }, voz: (n, t) => llamadas.voz.push([n.claveAldea, t]), nota: () => {},
  });
  const info = sj.info(vecina);
  ok(info && Number.isFinite(info.relacion.amistad) && info.emocion && typeof info.deseo === 'string', `la info de la rueda (${JSON.stringify(info).slice(0, 140)})`);
  const r = sj.interactuar(vecina, 'chiste');
  ok(r && r.renglones[0].length > 3 && llamadas.anim.some(([k]) => k === 'carpintero') && llamadas.burbuja.length && llamadas.voz.length, `una interacción: anima, burbuja y voz (${JSON.stringify(r).slice(0, 120)})`);
  ok(llamadas.manos.includes('contar'), 'y tus manos');
  const e = sj.hacerEntre(vecina, otro);
  ok(e && S.ENTRE[e.id] && llamadas.anim.filter(([k]) => k === 'herrero').length >= 1, `entre vecinos (${e?.id})`);
  ok(SOCIAL.parejas.tranquilo < SOCIAL.parejas.animado, 'el ritmo de la aldea manda en cuántos');
}

// ============================================================ los enganches
{
  const main = leer('src/main.js');
  for (const t of [
    "import { crearSocialJuego } from './social-juego.js';",
    'socialMundo?.paraCompilar();   // 3.7.4: el programa de las burbujas, con lo demás (nunca a mitad del juego)',
    "li.addEventListener('mousedown', (ev) => { if (ev.button !== 0) return; ev.preventDefault(); ev.stopPropagation(); elegirEnMenuCharla(i); });",
    "if (charla.menu && /^Arrow(Up|Down|Left|Right)$/.test(codigo)) { flechaRueda(codigo); return; }",
    "if (charla.npc && (codigo === 'Enter' || codigo === 'NumpadEnter')) { seguirCharla(); return; }",
    "capturarMirada: (dx, dy) => (!!charla.menu && !foto.activo ? apuntarRueda(dx, dy) : false),",
    "if (enRueda) { if (Math.hypot(m.mirada.x, m.mirada.y) > 0.5) apuntarRueda(m.mirada.x, m.mirada.y, true); if (m.recien.saltar) { seguirCharla(); m.recien.saltar = false; } }",
    "if (charla.menu?.nivel === 2) { volverRueda(); return; }",
    "if (!charla.historia?.social) hablaConVoz(npc, texto);",
    "alDecir: (npc, texto, tema) => socialJuego?.decir(npc, texto, { tema }),",
    "if (!desafio) socialJuego?.actualizar(dt);",
  ]) ok(main.includes(t), `main.js: ${t.slice(0, 90)}`);
  // la E y el aviso: el que te quiere decir algo, en el lugar del vecino (hablar), antes de todo lo demás
  const aviso = main.slice(main.indexOf('let aviso = objetivo ?'), main.indexOf('mostrarAviso(aviso);'));
  const orden = (t, a, b) => t.indexOf(a) >= 0 && t.indexOf(b) > t.indexOf(a);
  ok(orden(aviso, 'else if (vecino) aviso', 'socialJuego?.quiereDecir(vecino)') && orden(aviso, 'socialJuego?.quiereDecir(vecino)', 'modos?.accion(js)'), 'el aviso «te quiere decir algo», con el del vecino');
  const tecla = main.slice(main.indexOf("case 'KeyE': {"), main.indexOf("case 'Tab':"));
  ok(orden(tecla, 'if (vecino) { hablar(vecino); break; }', 'vecindadJuego?.puedeSentarse(js.pos)'), 'la E: hablar (y ahí, lo que te quería decir) en el mismo lugar');
  const hablar = main.slice(main.indexOf('function hablar(npc) {'), main.indexOf('function mostrarCharla() {'));
  ok(hablar.includes('loQueTeQueriaDecir(npc);') && hablar.includes('if (!desafio && !charla.enojado && vecindadJuego) {'), 'en el Desafío, la charla como antes (sin vecindad no hay rueda)');
  const ge = leer('src/gente.js');
  ok(ge.includes('if (g.animSocial) animarSocial(g, dt);   // 3.7.4') && ge.includes('if (g.animSocial && Number.isFinite(g.animSocial.mira)) g.rumboObjetivo = g.animSocial.mira;'), 'gente.js: las animaciones, al final de la pose');
  const ju = leer('src/jugador.js');
  ok(ju.includes('if (bloqueado && opciones.capturarMirada?.(e.movementX, e.movementY)) return;') && ju.includes('const flechas = !opciones.flechasOcupadas?.();'), 'jugador.js: el mouse y las flechas, en la rueda');
  const ag = leer('src/aldea-gente.js');
  ok(ag.includes('ctx.alEmpezarCharla?.(') && ag.includes('ctx.alDecir?.('), 'aldea-gente.js: lo que dicen y lo que hacen');
  const pl = leer('src/plantilla.html');
  ok(pl.includes('<div class="rueda oculto" id="rueda">') && pl.includes('<ul class="charla-opciones oculto" id="charla-opciones"></ul>') && pl.includes('id="rueda-marca-amigo"') && pl.includes('.renglon-social {'), 'la plantilla: la rueda, la barra con sus marcas y el renglón');
  const sm = leer('src/social-mundo.js');
  ok(sm.includes('new THREE.InstancedBufferGeometry()') && sm.includes('malla.frustumCulled = false;') && (sm.match(/new THREE\.Mesh\(/g) || []).length === 3, 'las burbujas: una sola malla (y tus dos manos)');
  const tres = leer('three-r186-inline.js');
  for (const c of ['InstancedBufferGeometry', 'InstancedBufferAttribute', 'ShaderMaterial', 'CanvasTexture', 'PlaneGeometry']) ok(new RegExp(`\\b${c}:`).test(tres), `el three local trae ${c}`);
}

console.log(`verificar-3-7-4-rueda: ${n} pruebas OK`);
