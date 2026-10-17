// 4.0.3: el modo foto (F2, F3, G6 y G7). El recorrido de verdad (la billetera tapada, la exposición que cambia la imagen, la oleada que no arranca con el
// deslizador) lo hace `pruebas/humo-4-0-3-foto.cjs` en Electron; acá el panel puro y los enchufes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { htmlPanelFoto, estadoFotoInicial, aplicarControl, CONTROLES_DEL_POSPROCESO } from '../src/foto-modo.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const e0 = estadoFotoInicial();
const con = htmlPanelFoto(e0), sin = htmlPanelFoto(e0, { post: false });
const apagado = (html, id) => new RegExp(`data-foto="${id}"[^>]*disabled`).test(html);
for (const id of CONTROLES_DEL_POSPROCESO) { ok(!apagado(con, id), `con posproceso: ${id} activo`); ok(apagado(sin, id), `sin posproceso: ${id} apagado`); }
for (const id of ['hora', 'fov', 'exposicion']) { ok(!apagado(sin, id), `sin posproceso: ${id} sigue activo`); }
ok(sin.includes('Necesita calidad Media o Alta'), 'y dice por qué');
ok(aplicarControl(e0, 'exposicion', 1.5).exposicion === 1.5 && aplicarControl(e0, 'exposicion', 9).exposicion === 1.75, 'la exposición se acota a su rango');
const m = leer('src/main.js'), d = leer('src/desafio.js');
for (const t of ["exposicion: (1 + (luz ? (1 - luz.dia) * 0.05 : 0) - clima.estado.lluvia * 0.02) * (foto.activo ? foto.exposicion : 1)",
  "if (!post?.uniforms) renderer.toneMappingExposure = foto.activo ? EXPOSICION_BASE * foto.exposicion : EXPOSICION_BASE;",
  "'billetera', 'base', 'logros', 'modos31', 'controles-completos', 'creditos'", 'ctxDesafio.fotoActiva = foto.activo;',
  'if (!foto.activo) fiestasJuego?.actualizar(dt);', "!desafio && !foto.activo) revisarCorreo()"]) ok(m.includes(t), `main.js: ${t.slice(0, 60)}`);
ok(d.includes('!mundo.fotoActiva) revisarHorario();'), 'desafio.js: revisarHorario no corre con el modo foto');
console.log(`OK 4.0.3 modo foto · ${n} verificaciones · panel sin posproceso, exposición y los enchufes (el recorrido real: humo-4-0-3-foto.cjs)`);
