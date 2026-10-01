// Auditoría cruzada portable entre geometría visible y plataformas físicas.
// Requiere `npm install` (Electron). Genera pruebas/salidas/fisica-cruzada.json.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salidaDir = path.join(__dirname, 'salidas');
fs.mkdirSync(salidaDir, { recursive: true });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function esperarJuego(w, limiteMs=180000){const t=Date.now();while(Date.now()-t<limiteMs){if(await w.webContents.executeJavaScript('!!window.__hojarasca').catch(()=>false))return true;await esperar(750);}return false;}

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show:false, width:900, height:500, webPreferences:{ backgroundThrottling:false } });
  const js=(c)=>w.webContents.executeJavaScript(c);
  try {
    await w.loadFile(path.join(raiz,'index.html'), { search: '?debug=1' });
    await js(`localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false})); localStorage.removeItem('hojarasca-v1'); 1`);
    await w.reload();
    if (!(await esperarJuego(w))) throw new Error('El juego no terminó de construir el mundo dentro del tiempo límite');
    await js(`document.getElementById('btn-entrar')?.click(); 1`); await esperar(1200);
    const lugares=['refugio','almacen','galpon','molino','faro','casa-te','torre','estacion'];
    const informe=[];
    for(const k of lugares){
      const r=await js(`(()=>{const H=window.__hojarasca,T=H.T,THREE=H.THREE,l=T.lugares['${k}'];if(!l)return{lugar:'${k}',error:'no existe'};const rc=new THREE.Raycaster(),abajo=new THREE.Vector3(0,-1,0),radio=(l.radio||6)+1;let pisoSinColision=0,colisionSinPiso=0,coinciden=0,muestras=0;const ejemplos=[];
        for(let i=-8;i<=8;i++)for(let j=-8;j<=8;j++){const x=l.x+(i/8)*radio,z=l.z+(j/8)*radio;if(Math.hypot(x-l.x,z-l.z)>radio)continue;muestras++;rc.set(new THREE.Vector3(x,(l.y??T.altura(l.x,l.z))+30,z),abajo);rc.far=60;const hits=rc.intersectObjects(H.escena.children,true).filter(h=>h.object.isMesh&&!h.object.isInstancedMesh&&h.object.geometry&&(h.object.geometry.index?h.object.geometry.index.count:h.object.geometry.attributes.position.count)>600);const suelo=T.altura(x,z),construccion=hits.filter(h=>Math.abs(h.point.y-suelo)>0.75),visual=construccion.length?construccion[0].point.y:null;if(visual===null)continue;if(visual-(l.y??suelo)>2.5)continue;const plat=H.col.plataformaEn(x,z,visual+0.3),fisico=plat?plat.alto:suelo,dif=visual-fisico;if(Math.abs(dif)<0.35)coinciden++;else if(dif>0.35){pisoSinColision++;if(ejemplos.length<4)ejemplos.push({tipo:'piso visible sin soporte físico',dif:+dif.toFixed(2),x:+x.toFixed(1),z:+z.toFixed(1)});}else{colisionSinPiso++;if(ejemplos.length<4)ejemplos.push({tipo:'soporte físico sin piso visible',dif:+dif.toFixed(2),x:+x.toFixed(1),z:+z.toFixed(1)});}}return{lugar:'${k}',muestras,coinciden,pisoSinColision,colisionSinPiso,ejemplos};})()`);
      informe.push(r);
    }
    fs.writeFileSync(path.join(salidaDir,'fisica-cruzada.json'),JSON.stringify(informe,null,2));
    const graves=informe.filter(x=>!x.error && (x.pisoSinColision+x.colisionSinPiso)>Math.max(5,x.muestras*0.12));
    console.log(`Auditoría física: ${graves.length} lugares requieren revisión. Informe en pruebas/salidas/fisica-cruzada.json`);
    if(graves.length)process.exitCode=2;
  } catch(e){console.error('Falló la auditoría física:',e);process.exitCode=1;} finally {w.destroy();app.quit();}
});
