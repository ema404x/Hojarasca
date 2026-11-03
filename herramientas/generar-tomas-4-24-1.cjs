// 4.24.1 (C): arma herramientas/auditoria-visual-4-24-1.json (los encuadres de lo que la 4.24.0 no vio: noche, lluvia, tormenta, sol bajo y huellas, ladera con parches, dientes de hojas).
const fs = require('fs');
const path = require('path');
const mirador = (horas, extra = {}) => ({ pitch: -0.14, fov: 70, donde: `(()=>{ const M = H.T.lugares.mirador, R = H.T.lugares.refugio; const dx = R.x - M.x, dz = R.z - M.z, d = Math.hypot(dx, dz); const x = M.x + dx / d * 7, z = M.z + dz / d * 7; return { x, z, y: H.T.altura(x, z) + 5.5, yaw: Math.atan2(-dx, -dz), horas: ${horas} } })()`, ...extra });
const bosque = (horas, extra = {}) => ({ pitch: -0.04, fov: 62, donde: `(()=>{ const L = H.T.lugares.refugio; return { x: L.x - 24, z: L.z - 18, yaw: Math.atan2(24, 18) + Math.PI, horas: ${horas} } })()`, ...extra });
const plaza = (horas, extra = {}) => ({ aldea: true, pitch: 0.03, fov: 62, donde: `(()=>{ const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const s = A.estadoEdificio('plaza').sitio; const fx = Math.sin(s.rot), fz = Math.cos(s.rot); return { x: s.x + fx * 16, z: s.z + fz * 16, yaw: Math.atan2(fx, fz), horas: ${horas} } })()`, ...extra });
const ladera = (horas) => ({ pitch: -0.2, fov: 70, donde: `(()=>{ const L = H.T.lugares.refugio; const ps = (H.veg.matas || []).filter((m) => (m.tipo === 'parche0' || m.tipo === 'parche1') && !m.sacado); const ar = H.veg.arboles.filter((q) => !q.sacado); let mejor = null, mp = 0; for (const m of ps) { const p = 1 - H.T.normal(m.x, m.z).y; if (p < 0.003 || p < mp) continue; if (ar.some((q) => Math.hypot(q.x - m.x, q.z - m.z) < 10)) continue; mejor = m; mp = p; } if (!mejor) return null; const n = H.T.normal(mejor.x, mejor.z); const yaw = Math.atan2(n.x, n.z); const x = mejor.x + Math.sin(yaw) * 10, z = mejor.z + Math.cos(yaw) * 10; return { x, z, y: H.T.altura(x, z) + 2.2, yaw: yaw + Math.PI, horas: ${horas} } })()` });
const cerca = (horas, tipo = 'arbol') => ({ pitch: 0.12, fov: 50, donde: `(()=>{ const L = H.T.lugares.refugio; const a = H.veg.arboles.filter((q) => !q.sacado && !q.caido).sort((p, q) => Math.hypot(p.x - L.x - 14, p.z - L.z - 10) - Math.hypot(q.x - L.x - 14, q.z - L.z - 10))[0]; const x = a.x + 7, z = a.z + 7; return { x, z, yaw: Math.atan2(-7, -7), horas: ${horas} } })()` });
const T = [];
const poner = (id, grupo, t) => T.push({ id, grupo, medir: false, ...t });
for (const [nom, h] of [['dia', 12.5], ['noche', 23.2], ['alba', 6.2]]) {
  poner(`a1-mirador-${nom}`, 'verano', mirador(h));
  poner(`a2-bosque-${nom}`, 'verano', bosque(nom === 'noche' ? 0.4 : h));
  poner(`a3-plaza-${nom}`, 'verano', plaza(nom === 'noche' ? 22.8 : h));
}
poner('b1-ladera', 'verano', ladera(11.5));
poner('b2-ladera-tarde', 'verano', ladera(17.5));
poner('c1-copa-cerca', 'verano', cerca(11.5));
poner('c2-copa-cerca-otono', 'otono', cerca(11.5));
poner('d1-lejanos', 'verano', { pitch: -0.1, fov: 22, donde: '(()=>{ const M = H.T.lugares.mirador, R = H.T.lugares.refugio; const dx = R.x - M.x, dz = R.z - M.z; return { x: M.x, z: M.z, y: H.T.altura(M.x, M.z) + 1.7, yaw: Math.atan2(-dx, -dz), horas: 11.5 } })()' });
// invierno: sol bajo, huellas
const previoHuellas = '(async()=>{ const H = window.__hojarasca; const p = H.jugador.estado.pos; const x0 = p.x, z0 = p.z; return 1 })()';
poner('e1-nieve-sol-bajo', 'invierno', mirador(9.0));
poner('e2-nieve-sol-bajo-tarde', 'invierno', bosque(16.6));
poner('e3-nieve-huellas', 'invierno', { pitch: -0.5, fov: 62, huellas: true, donde: '(()=>{ const M = H.T.lugares.mirador, R = H.T.lugares.refugio; const dx = R.x - M.x, dz = R.z - M.z, d = Math.hypot(dx, dz); const x = M.x + dx / d * 3, z = M.z + dz / d * 3; return { x, z, y: H.T.altura(x, z) + 2.6, yaw: Math.atan2(-dx, -dz), horas: 16.4 } })()' });
poner('e4-nieve-plaza-baja', 'invierno', plaza(16.8));
poner('e5-nieve-noche', 'invierno', mirador(22.5));
poner('e6-nieve-copa-cerca', 'invierno', cerca(15.5));
poner('f1-otono-sol-bajo', 'otono', mirador(17.0));
poner('f2-otono-bosque', 'otono', bosque(11.5));
poner('f3-otono-plaza', 'otono', plaza(12));
fs.writeFileSync(path.join(__dirname, 'auditoria-visual-4-24-1.json'), JSON.stringify(T, null, 2));
console.log(T.length + ' encuadres');
