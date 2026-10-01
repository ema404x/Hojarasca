import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createCanvas } = require('canvas');
import fs from 'fs';
import { generarTerreno } from '../src/terreno.js';
import { N, RES, MITAD, CELDA } from '../src/config.js';
const t0 = Date.now();
const T = generarTerreno();
console.log('generado en', Date.now() - t0, 'ms', 'puentes', T.puentes.length, T.puentes.map(p=>[p.x|0,p.z|0,p.alto.toFixed(1)]));
console.log('lugares', Object.fromEntries(Object.entries(T.lugares).map(([k,v])=>[k,[v.x|0,v.z|0,(v.y??0).toFixed(1)]])));
let min=1e9,max=-1e9; for (const h of T.alturas){min=Math.min(min,h);max=Math.max(max,h);} console.log('alturas',min.toFixed(1),max.toFixed(1));
const c = createCanvas(N, N), x = c.getContext('2d'); const img = x.createImageData(N, N);
for (let j=0;j<N;j++) for (let i=0;i<N;i++){ const k=j*N+i, h=T.alturas[k], p=k*4;
  const n = T.normal(i*CELDA-MITAD, j*CELDA-MITAD); const sh = 0.55+0.45*Math.max(0, n.x*-0.5+n.y*0.7+n.z*-0.5);
  let r,g,b;
  const w = T.agua(i*CELDA-MITAD, j*CELDA-MITAD);
  if (w) { r=60; g=100; b=150; }
  else { const bo=T.bosque[k]; r = 150-bo*90 + h*0.6; g = 170-bo*70 + h*0.3; b = 110-bo*60; if (T.distSendero[k]<2) {r=190;g=160;b=110;} }
  img.data[p]=r*sh; img.data[p+1]=g*sh; img.data[p+2]=b*sh; img.data[p+3]=255; }
x.putImageData(img,0,0);
x.fillStyle='red'; x.font='12px sans-serif';
for (const [k,v] of Object.entries(T.lugares)) { const px=(v.x+MITAD)/CELDA, pz=(v.z+MITAD)/CELDA; x.fillRect(px-3,pz-3,6,6); x.fillText(k, px+5, pz); }
fs.writeFileSync(new URL('./mapa.png', import.meta.url), c.toBuffer());
