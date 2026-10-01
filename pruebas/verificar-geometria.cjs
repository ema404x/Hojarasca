// Auditoría visual/geométrica portable. Requiere `npm install` (Electron).
// Genera pruebas/salidas/geometria-flotantes.json.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salidaDir = path.join(__dirname, 'salidas');
fs.mkdirSync(salidaDir, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function esperarJuego(w, limiteMs = 180000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    if (await w.webContents.executeJavaScript('!!window.__hojarasca').catch(() => false)) return true;
    await esperar(750);
  }
  return false;
}

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 900, height: 500, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  try {
    await w.loadFile(path.join(raiz, 'index.html'), { search: '?debug=1' });
    await js(`localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false})); localStorage.removeItem('hojarasca-v1'); 1`);
    await w.reload();
    if (!(await esperarJuego(w))) throw new Error('El juego no terminó de construir el mundo dentro del tiempo límite');
    await js(`document.getElementById('btn-entrar')?.click(); 1`); await esperar(1200);
    const out = await js(`(()=>{ const H=window.__hojarasca, T=H.T; const PASO=0.35;
      function voxelizar(malla){ const g=malla.geometry,pos=g.attributes.position,celdas=new Set(),v=new H.camara.position.constructor(),idx=g.index,cuenta=idx?idx.count:pos.count;
        const leer=(i)=>{const k=idx?idx.getX(i):i;v.fromBufferAttribute(pos,k);malla.localToWorld(v);return v.clone();};
        for(let i=0;i<cuenta;i+=3){const a=leer(i),b=leer(i+1),c=leer(i+2),lado=Math.max(a.distanceTo(b),b.distanceTo(c),c.distanceTo(a)),n=Math.min(14,Math.max(2,Math.ceil(lado/PASO*1.5)));
          for(let s=0;s<=n;s++)for(let t=0;t+s<=n;t++){const u=s/n,w=t/n,z=1-u-w,x=a.x*z+b.x*u+c.x*w,y=a.y*z+b.y*u+c.y*w,zz=a.z*z+b.z*u+c.z*w,cx=Math.round(x/PASO),cy=Math.round(y/PASO),cz=Math.round(zz/PASO);
            for(const [dx,dy,dz] of [[0,0,0],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]])celdas.add((cx+dx)+','+(cy+dy)+','+(cz+dz)); }} return celdas; }
      function componentes(celdas){const visto=new Set(),comps=[];for(const c0 of celdas){if(visto.has(c0))continue;const pila=[c0],comp=[];visto.add(c0);while(pila.length){const c=pila.pop();comp.push(c);const [x,y,z]=c.split(',').map(Number);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){const k=(x+dx)+','+(y+dy)+','+(z+dz);if(celdas.has(k)&&!visto.has(k)){visto.add(k);pila.push(k);}}}comps.push(comp);}return comps;}
      const informe=[], candidatas=[]; H.escena.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.name==='terreno')return;const g=o.geometry,n=g.index?g.index.count:(g.attributes.position?.count||0);if(n>=900&&n<=70000)candidatas.push(o);});
      for(const m of candidatas.slice(0,24)){const celdas=voxelizar(m);if(celdas.size<20)continue;const comps=componentes(celdas).sort((a,b)=>b.length-a.length);const sueltas=[];
        for(const comp of comps.slice(1)){if(comp.length<30)continue;let min=1e9,max=-1e9,sx=0,sz=0;for(const c of comp){const [x,y,z]=c.split(',').map(Number);min=Math.min(min,y*PASO);max=Math.max(max,y*PASO);sx+=x*PASO;sz+=z*PASO;}const x=sx/comp.length,z=sz/comp.length,sobre=min-T.altura(x,z);if(sobre>0.6&&!T.agua(x,z))sueltas.push({celdas:comp.length,base:+min.toFixed(2),tope:+max.toFixed(2),sobreSuelo:+sobre.toFixed(2),x:+x.toFixed(1),z:+z.toFixed(1),malla:m.name||m.parent?.name||''});}
        if(sueltas.length)informe.push({malla:m.name||m.parent?.name||'',celdas:celdas.size,partes:comps.length,flotantes:sueltas});}
      return informe;})()`);
    fs.writeFileSync(path.join(salidaDir, 'geometria-flotantes.json'), JSON.stringify(out, null, 2));
    const graves = out.flatMap((x) => x.flotantes || []).filter((x) => x.sobreSuelo > 1.25 && x.celdas > 70);
    console.log(`Auditoría geométrica: ${out.length} mallas con componentes separados; ${graves.length} candidatos graves. Informe en pruebas/salidas/geometria-flotantes.json`);
    if (graves.length) process.exitCode = 2;
  } catch (e) {
    console.error('Falló la auditoría geométrica:', e);
    process.exitCode = 1;
  } finally { w.destroy(); app.quit(); }
});
