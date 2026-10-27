// 4.12.1 (agua y reflejos): los encuadres del agua, comunes a la herramienta de capturas (fotos-agua-4-12-1.cjs) y a la de mediciones
// (medir-vistas.cjs con VISTAS_EXTRA). `preludio` se evalúa una vez en la página (define window.__av con ayudas) y cada `donde` devuelve
// { x, z, yaw, horas, y? } (o null si el lugar no existe). El mundo no cambia entre versiones: son los mismos encuadres antes y después.
const preludio = `(() => {
  const H = window.__hojarasca, T = H.T, LX = 150, LZ = 110;
  const agua = (x, z) => T.altura(x, z) < -0.35;
  // posición del sol y de la luna a una hora (las mismas cuentas que cielo.js)
  const angHora = (h) => { h = ((h % 24) + 24) % 24; return h >= 6.5 && h < 20.5 ? ((h - 6.5) / 14) * Math.PI : Math.PI + ((((h - 20.5) % 24) + 24) % 24 / 10) * Math.PI; };
  const sol = (h) => { const a = angHora(h), v = [-Math.cos(a), Math.sin(a) * 0.9, 0.38], l = Math.hypot(...v); return v.map((q) => q / l); };
  const luna = (h) => { const a = angHora(h), v = [Math.cos(a) * 0.8, -Math.sin(a) * 0.75 + 0.18, -0.45], l = Math.hypot(...v); return v.map((q) => q / l); };
  const yawA = (dx, dz) => Math.atan2(-dx, -dz);
  // parado sobre el lago (a 1,8 m del agua, como en un bote), mirando hacia (dx, dz): el tramo de agua más largo en esa dirección
  const lagoHacia = (dx, dz, horas, atras = 8) => {
    const l = Math.hypot(dx, dz); dx /= l; dz /= l;
    let mejor = null;
    for (const lat of [0, -14, 14, -28, 28, -42, 42]) {
      let ini = null;
      for (let t = -130; t <= 130; t += 2) {
        const x = LX + dx * t - dz * lat, z = LZ + dz * t + dx * lat;
        if (agua(x, z)) { if (ini === null) ini = t; const largo = t - ini; if (!mejor || largo > mejor.largo) mejor = { largo, x: LX + dx * ini - dz * lat, z: LZ + dz * ini + dx * lat, ini }; }
        else ini = null;
      }
    }
    if (!mejor) return null;
    return { x: mejor.x + dx * atras, z: mejor.z + dz * atras, y: 1.8, yaw: yawA(dx, dz), horas };
  };
  const muelle = (ax, bx, horas, alt = 1.65) => { const M = T.lugares.muelle; if (!M) return null; const c = Math.cos(M.ang), s = Math.sin(M.ang);
    const x = M.x + c * ax - s * bx, z = M.z + s * ax + c * bx; return { x, z, yaw: yawA(c, s), horas, y: T.altura(x, z) + alt }; };
  const rio = T.rio, salto = T.saltoAgua;
  // en la orilla del arroyo (a 'lat' m del eje, mirando río arriba o abajo desde 'desde' puntos antes)
  const arroyo = (i, lat, horas, mirarA) => { const a = rio[i], b = rio[Math.min(rio.length - 1, i + 3)], p = rio[Math.max(0, i - 4)];
    const tx = b.x - p.x, tz = b.z - p.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
    const x = a.x + nx * lat, z = a.z + nz * lat; const q = rio[Math.min(rio.length - 1, i + mirarA)];
    return { x, z, y: Math.max(T.altura(x, z), a.s) + 1.7, yaw: yawA(q.x - x, q.z - z), horas }; };
  window.__av = { agua, sol, luna, yawA, lagoHacia, muelle, arroyo, rio, salto, T };
  return 1;
})()`;

const vistas = [
  // el lago, mirando hacia el sol (el camino de luz) y hacia la luna; en el lago abierto, sin orilla cerca
  { id: '01-lago-mediodia', pitch: -0.05, fov: 62, donde: "(()=>{ const A = window.__av, s = A.sol(12.5); return A.lagoHacia(s[0], s[2], 12.5) || A.muelle(-3, 4, 12.5) })()" },
  { id: '02-lago-tarde-dorada', pitch: 0.0, fov: 62, donde: "(()=>{ const A = window.__av, s = A.sol(19.2); return A.lagoHacia(s[0], s[2], 19.2) || A.muelle(-3, 4, 19.2) })()" },
  { id: '03-lago-ocaso', pitch: 0.04, fov: 62, donde: "(()=>{ const A = window.__av, s = A.sol(20.2); return A.lagoHacia(s[0], s[2], 20.2) || A.muelle(-3, 4, 20.2) })()" },
  { id: '04-lago-luna', pitch: 0.16, fov: 70, donde: "(()=>{ const A = window.__av, s = A.luna(21.2); return A.lagoHacia(s[0], s[2], 21.2) || A.muelle(-3, 4, 21.2) })()" },
  { id: '05-lago-noche-lejos', pitch: -0.12, fov: 62, donde: "(()=>{ const A = window.__av, s = A.luna(23); return A.lagoHacia(-s[0], -s[2], 23) || A.muelle(-3, 4, 23) })()" },
  { id: '06-lago-amanecer', pitch: 0.0, fov: 62, donde: "(()=>{ const A = window.__av, s = A.sol(7.0); return A.lagoHacia(s[0], s[2], 7.0) || A.muelle(-3, 4, 7.0) })()" },
  // el lago visto desde el muelle (lo que se ve al jugar), de día y a la tarde, y la orilla de cerca
  { id: '07-muelle-dia', pitch: -0.04, fov: 62, donde: "(()=>window.__av.muelle(-3, 4, 12.5))()" },
  { id: '08-orilla-cerca', pitch: -0.42, fov: 60, donde: "(()=>window.__av.muelle(3.2, 2, 12.5, 1.65))()" },
  { id: '09-orilla-ocaso', pitch: -0.3, fov: 60, donde: "(()=>window.__av.muelle(3.2, 2, 19.6, 1.65))()" },
  // el arroyo (costado y río abajo) y la cascada con su poza
  { id: '10-arroyo-dia', pitch: -0.2, fov: 62, donde: "(()=>{ const A = window.__av; return A.arroyo(Math.floor(A.rio.length * 0.62), 7, 12.5, 8) })()" },
  { id: '11-arroyo-tarde', pitch: -0.2, fov: 62, donde: "(()=>{ const A = window.__av; return A.arroyo(Math.floor(A.rio.length * 0.62), 7, 19.2, 8) })()" },
  { id: '12-cascada', pitch: 0.02, fov: 62, donde: `(()=>{ const A = window.__av, s = A.salto; if (!s) return null; const dx = Math.sin(s.ang), dz = Math.cos(s.ang), nx = Math.cos(s.ang), nz = -Math.sin(s.ang);
      const x = s.x + dx * 13 + nx * 3, z = s.z + dz * 13 + nz * 3; return { x, z, y: Math.max(A.T.altura(x, z), s.abajo) + 1.7, yaw: A.yawA(s.x - x, s.z - z), horas: 12.5 } })()` },
  { id: '13-cascada-tarde', pitch: 0.02, fov: 62, donde: `(()=>{ const A = window.__av, s = A.salto; if (!s) return null; const dx = Math.sin(s.ang), dz = Math.cos(s.ang), nx = Math.cos(s.ang), nz = -Math.sin(s.ang);
      const x = s.x + dx * 13 + nx * 3, z = s.z + dz * 13 + nz * 3; return { x, z, y: Math.max(A.T.altura(x, z), s.abajo) + 1.7, yaw: A.yawA(s.x - x, s.z - z), horas: 19.2 } })()` },
];

module.exports = { preludio, vistas };
