/* Three.js r186 · MIT · runtime extraído del bundle original de Hojarasca para ejecución offline. */
const THREE = (() => {
var Xf=0,nd=1,Yf=2;var ho=1,$f=2,er=3,Wa=0,Hn=1,cn=2,ja=0,Fi=1,fo=2,ad=3,id=4,Zf=5;var po=100,Jf=101,Kf=102,Qf=103,e0=104,t0=200,n0=201,a0=202,i0=203,od=204,rd=205,o0=206,r0=207,s0=208,l0=209,c0=210,u0=211,d0=212,h0=213,f0=214,fl=0,pl=1,ml=2,ko=3,gl=4,xl=5,vl=6,yl=7,Jl=0,p0=1,m0=2,La=0,sd=1,ld=2,cd=3,Qr=4,ud=5,dd=6,hd=7;var fd=300,Bi=301,mo=302,Kl=303,Ql=304,es=306,bl=1e3,Ba=1001,Ml=1002,Un=1003,g0=1004;var ts=1005;var mn=1006,ec=1007;var Hi=1008;var $n=1009,pd=1010,md=1011,tr=1012,tc=1013,Da=1014,_a=1015,ta=1016,nc=1017,ac=1018,nr=1020,gd=35902,xd=35899,vd=1021,yd=1022,na=1023,Ha=1026,Oi=1027,ar=1028,ic=1029,Gi=1030,oc=1031;var rc=1033,ns=33776,as=33777,is=33778,os=33779,sc=35840,lc=35841,cc=35842,uc=35843,dc=36196,hc=37492,fc=37496,pc=37488,mc=37489,rs=37490,gc=37491,xc=37808,vc=37809,yc=37810,bc=37811,Mc=37812,_c=37813,Ec=37814,Sc=37815,Tc=37816,wc=37817,Ac=37818,Rc=37819,Cc=37820,zc=37821,Pc=36492,Ic=36494,Lc=36495,Dc=36283,Nc=36284,ss=36285,Uc=36286;var Pr=2300,_l=2301,ul=2302,Wu=2303,ju=2400,Xu=2401,Yu=2402;var x0=3200;var Fc=0,v0=1,ci="",Cn="srgb",Ir="srgb-linear",Lr="linear",Kt="srgb";var dl=7680;var y0=519,b0=512,M0=513,_0=514,Bc=515,E0=516,S0=517,Hc=518,T0=519,w0=35044;var bd="300 es",Pa=2e3,qo=2001;function ag(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function ig(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function Wo(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function A0(){let n=Wo("canvas");return n.style.display="block",n}var df={},jo=null;function Md(...n){let e="THREE."+n.shift();jo?jo("log",e,...n):console.log(e,...n)}function R0(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function xt(...n){n=R0(n);let e="THREE."+n.shift();if(jo)jo("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function bt(...n){n=R0(n);let e="THREE."+n.shift();if(jo)jo("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function io(...n){let e=n.join(" ");e in df||(df[e]=!0,xt(...n))}function C0(n,e,t){return new Promise(function(a,i){function o(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:i();break;case n.TIMEOUT_EXPIRED:setTimeout(o,t);break;default:a()}}setTimeout(o,t)})}var z0={[fl]:pl,[ml]:vl,[gl]:yl,[ko]:xl,[pl]:fl,[vl]:ml,[yl]:gl,[xl]:ko},Oa=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let a=this._listeners;a[e]===void 0&&(a[e]=[]),a[e].indexOf(t)===-1&&a[e].push(t)}hasEventListener(e,t){let a=this._listeners;return a===void 0?!1:a[e]!==void 0&&a[e].indexOf(t)!==-1}removeEventListener(e,t){let a=this._listeners;if(a===void 0)return;let i=a[e];if(i!==void 0){let o=i.indexOf(t);o!==-1&&i.splice(o,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let a=t[e.type];if(a!==void 0){e.target=this;let i=a.slice(0);for(let o=0,r=i.length;o<r;o++)i[o].call(this,e);e.target=null}}},kn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],hf=1234567,Ar=Math.PI/180,oo=180/Math.PI;function ir(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,a=Math.random()*4294967295|0;return(kn[n&255]+kn[n>>8&255]+kn[n>>16&255]+kn[n>>24&255]+"-"+kn[e&255]+kn[e>>8&255]+"-"+kn[e>>16&15|64]+kn[e>>24&255]+"-"+kn[t&63|128]+kn[t>>8&255]+"-"+kn[t>>16&255]+kn[t>>24&255]+kn[a&255]+kn[a>>8&255]+kn[a>>16&255]+kn[a>>24&255]).toLowerCase()}function Ct(n,e,t){return Math.max(e,Math.min(t,n))}function _d(n,e){return(n%e+e)%e}function og(n,e,t,a,i){return a+(n-e)*(i-a)/(t-e)}function rg(n,e,t){return n!==e?(t-n)/(e-n):0}function Rr(n,e,t){return(1-t)*n+t*e}function sg(n,e,t,a){return Rr(n,e,1-Math.exp(-t*a))}function lg(n,e=1){return e-Math.abs(_d(n,e*2)-e)}function cg(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function ug(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function dg(n,e){return n+Math.floor(Math.random()*(e-n+1))}function hg(n,e){return n+Math.random()*(e-n)}function fg(n){return n*(.5-Math.random())}function pg(n){n!==void 0&&(hf=n);let e=hf+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function mg(n){return n*Ar}function gg(n){return n*oo}function xg(n){return n>0&&Number.isInteger(n)&&2**Math.round(Math.log2(n))===n}function vg(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function yg(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function bg(n,e,t,a,i){let o=Math.cos,r=Math.sin,l=o(t/2),s=r(t/2),c=o((e+a)/2),u=r((e+a)/2),h=o((e-a)/2),d=r((e-a)/2),m=o((a-e)/2),y=r((a-e)/2);switch(i){case"XYX":n.set(l*u,s*h,s*d,l*c);break;case"YZY":n.set(s*d,l*u,s*h,l*c);break;case"ZXZ":n.set(s*h,s*d,l*u,l*c);break;case"XZX":n.set(l*u,s*y,s*m,l*c);break;case"YXY":n.set(s*m,l*u,s*y,l*c);break;case"ZYZ":n.set(s*y,s*m,l*u,l*c);break;default:xt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function Go(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:case Uint8ClampedArray:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function ea(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Oc={DEG2RAD:Ar,RAD2DEG:oo,generateUUID:ir,clamp:Ct,euclideanModulo:_d,mapLinear:og,inverseLerp:rg,lerp:Rr,damp:sg,pingpong:lg,smoothstep:cg,smootherstep:ug,randInt:dg,randFloat:hg,randFloatSpread:fg,seededRandom:pg,degToRad:mg,radToDeg:gg,isPowerOfTwo:xg,ceilPowerOfTwo:vg,floorPowerOfTwo:yg,setQuaternionFromProperEuler:bg,normalize:ea,denormalize:Go},nt=class n{static{n.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,a=this.y,i=e.elements;return this.x=i[0]*t+i[3]*a+i[6],this.y=i[1]*t+i[4]*a+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ct(this.x,e.x,t.x),this.y=Ct(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ct(this.x,e,t),this.y=Ct(this.y,e,t),this}clampLength(e,t){let a=this.length();return this.divideScalar(a||1).multiplyScalar(Ct(a,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let a=this.dot(e)/t;return Math.acos(Ct(a,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,a=this.y-e.y;return t*t+a*a}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,a){return this.x=e.x+(t.x-e.x)*a,this.y=e.y+(t.y-e.y)*a,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let a=Math.cos(t),i=Math.sin(t),o=this.x-e.x,r=this.y-e.y;return this.x=o*a-r*i+e.x,this.y=o*i+r*a+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Wn=class{constructor(e=0,t=0,a=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=a,this._w=i}static slerpFlat(e,t,a,i,o,r,l){let s=a[i+0],c=a[i+1],u=a[i+2],h=a[i+3],d=o[r+0],m=o[r+1],y=o[r+2],b=o[r+3];if(h!==b||s!==d||c!==m||u!==y){let v=s*d+c*m+u*y+h*b;v<0&&(d=-d,m=-m,y=-y,b=-b,v=-v);let x=1-l;if(v<.9995){let w=Math.acos(v),S=Math.sin(w);x=Math.sin(x*w)/S,l=Math.sin(l*w)/S,s=s*x+d*l,c=c*x+m*l,u=u*x+y*l,h=h*x+b*l}else{s=s*x+d*l,c=c*x+m*l,u=u*x+y*l,h=h*x+b*l;let w=1/Math.sqrt(s*s+c*c+u*u+h*h);s*=w,c*=w,u*=w,h*=w}}e[t]=s,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,a,i,o,r){let l=a[i],s=a[i+1],c=a[i+2],u=a[i+3],h=o[r],d=o[r+1],m=o[r+2],y=o[r+3];return e[t]=l*y+u*h+s*m-c*d,e[t+1]=s*y+u*d+c*h-l*m,e[t+2]=c*y+u*m+l*d-s*h,e[t+3]=u*y-l*h-s*d-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,a,i){return this._x=e,this._y=t,this._z=a,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let a=e._x,i=e._y,o=e._z,r=e._order,l=Math.cos,s=Math.sin,c=l(a/2),u=l(i/2),h=l(o/2),d=s(a/2),m=s(i/2),y=s(o/2);switch(r){case"XYZ":this._x=d*u*h+c*m*y,this._y=c*m*h-d*u*y,this._z=c*u*y+d*m*h,this._w=c*u*h-d*m*y;break;case"YXZ":this._x=d*u*h+c*m*y,this._y=c*m*h-d*u*y,this._z=c*u*y-d*m*h,this._w=c*u*h+d*m*y;break;case"ZXY":this._x=d*u*h-c*m*y,this._y=c*m*h+d*u*y,this._z=c*u*y+d*m*h,this._w=c*u*h-d*m*y;break;case"ZYX":this._x=d*u*h-c*m*y,this._y=c*m*h+d*u*y,this._z=c*u*y-d*m*h,this._w=c*u*h+d*m*y;break;case"YZX":this._x=d*u*h+c*m*y,this._y=c*m*h+d*u*y,this._z=c*u*y-d*m*h,this._w=c*u*h-d*m*y;break;case"XZY":this._x=d*u*h-c*m*y,this._y=c*m*h-d*u*y,this._z=c*u*y+d*m*h,this._w=c*u*h+d*m*y;break;default:xt("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let a=t/2,i=Math.sin(a);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(a),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,a=t[0],i=t[4],o=t[8],r=t[1],l=t[5],s=t[9],c=t[2],u=t[6],h=t[10],d=a+l+h;if(d>0){let m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(u-s)*m,this._y=(o-c)*m,this._z=(r-i)*m}else if(a>l&&a>h){let m=2*Math.sqrt(1+a-l-h);this._w=(u-s)/m,this._x=.25*m,this._y=(i+r)/m,this._z=(o+c)/m}else if(l>h){let m=2*Math.sqrt(1+l-a-h);this._w=(o-c)/m,this._x=(i+r)/m,this._y=.25*m,this._z=(s+u)/m}else{let m=2*Math.sqrt(1+h-a-l);this._w=(r-i)/m,this._x=(o+c)/m,this._y=(s+u)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let a=e.dot(t)+1;return a<1e-8?(a=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=a):(this._x=0,this._y=-e.z,this._z=e.y,this._w=a)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=a),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ct(this.dot(e),-1,1)))}rotateTowards(e,t){let a=this.angleTo(e);if(a===0)return this;let i=Math.min(1,t/a);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let a=e._x,i=e._y,o=e._z,r=e._w,l=t._x,s=t._y,c=t._z,u=t._w;return this._x=a*u+r*l+i*c-o*s,this._y=i*u+r*s+o*l-a*c,this._z=o*u+r*c+a*s-i*l,this._w=r*u-a*l-i*s-o*c,this._onChangeCallback(),this}slerp(e,t){let a=e._x,i=e._y,o=e._z,r=e._w,l=this.dot(e);l<0&&(a=-a,i=-i,o=-o,r=-r,l=-l);let s=1-t;if(l<.9995){let c=Math.acos(l),u=Math.sin(c);s=Math.sin(s*c)/u,t=Math.sin(t*c)/u,this._x=this._x*s+a*t,this._y=this._y*s+i*t,this._z=this._z*s+o*t,this._w=this._w*s+r*t,this._onChangeCallback()}else this._x=this._x*s+a*t,this._y=this._y*s+i*t,this._z=this._z*s+o*t,this._w=this._w*s+r*t,this.normalize();return this}slerpQuaternions(e,t,a){return this.copy(e).slerp(t,a)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),a=Math.random(),i=Math.sqrt(1-a),o=Math.sqrt(a);return this.set(i*Math.sin(e),i*Math.cos(e),o*Math.sin(t),o*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},X=class n{static{n.prototype.isVector3=!0}constructor(e=0,t=0,a=0){this.x=e,this.y=t,this.z=a}set(e,t,a){return a===void 0&&(a=this.z),this.x=e,this.y=t,this.z=a,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ff.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ff.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,a=this.y,i=this.z,o=e.elements;return this.x=o[0]*t+o[3]*a+o[6]*i,this.y=o[1]*t+o[4]*a+o[7]*i,this.z=o[2]*t+o[5]*a+o[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,a=this.y,i=this.z,o=e.elements,r=1/(o[3]*t+o[7]*a+o[11]*i+o[15]);return this.x=(o[0]*t+o[4]*a+o[8]*i+o[12])*r,this.y=(o[1]*t+o[5]*a+o[9]*i+o[13])*r,this.z=(o[2]*t+o[6]*a+o[10]*i+o[14])*r,this}applyQuaternion(e){let t=this.x,a=this.y,i=this.z,o=e.x,r=e.y,l=e.z,s=e.w,c=2*(r*i-l*a),u=2*(l*t-o*i),h=2*(o*a-r*t);return this.x=t+s*c+r*h-l*u,this.y=a+s*u+l*c-o*h,this.z=i+s*h+o*u-r*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,a=this.y,i=this.z,o=e.elements;return this.x=o[0]*t+o[4]*a+o[8]*i,this.y=o[1]*t+o[5]*a+o[9]*i,this.z=o[2]*t+o[6]*a+o[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ct(this.x,e.x,t.x),this.y=Ct(this.y,e.y,t.y),this.z=Ct(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ct(this.x,e,t),this.y=Ct(this.y,e,t),this.z=Ct(this.z,e,t),this}clampLength(e,t){let a=this.length();return this.divideScalar(a||1).multiplyScalar(Ct(a,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,a){return this.x=e.x+(t.x-e.x)*a,this.y=e.y+(t.y-e.y)*a,this.z=e.z+(t.z-e.z)*a,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let a=e.x,i=e.y,o=e.z,r=t.x,l=t.y,s=t.z;return this.x=i*s-o*l,this.y=o*r-a*s,this.z=a*l-i*r,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let a=e.dot(this)/t;return this.copy(e).multiplyScalar(a)}projectOnPlane(e){return bu.copy(this).projectOnVector(e),this.sub(bu)}reflect(e){return this.sub(bu.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let a=this.dot(e)/t;return Math.acos(Ct(a,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,a=this.y-e.y,i=this.z-e.z;return t*t+a*a+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,a){let i=Math.sin(t)*e;return this.x=i*Math.sin(a),this.y=Math.cos(t)*e,this.z=i*Math.cos(a),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,a){return this.x=e*Math.sin(t),this.y=a,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),a=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=a,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,a=Math.sqrt(1-t*t);return this.x=a*Math.cos(e),this.y=t,this.z=a*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},bu=new X,ff=new Wn,Mt=class n{static{n.prototype.isMatrix3=!0}constructor(e,t,a,i,o,r,l,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,a,i,o,r,l,s,c)}set(e,t,a,i,o,r,l,s,c){let u=this.elements;return u[0]=e,u[1]=i,u[2]=l,u[3]=t,u[4]=o,u[5]=s,u[6]=a,u[7]=r,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,a=e.elements;return t[0]=a[0],t[1]=a[1],t[2]=a[2],t[3]=a[3],t[4]=a[4],t[5]=a[5],t[6]=a[6],t[7]=a[7],t[8]=a[8],this}extractBasis(e,t,a){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),a.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let a=e.elements,i=t.elements,o=this.elements,r=a[0],l=a[3],s=a[6],c=a[1],u=a[4],h=a[7],d=a[2],m=a[5],y=a[8],b=i[0],v=i[3],x=i[6],w=i[1],S=i[4],g=i[7],L=i[2],R=i[5],z=i[8];return o[0]=r*b+l*w+s*L,o[3]=r*v+l*S+s*R,o[6]=r*x+l*g+s*z,o[1]=c*b+u*w+h*L,o[4]=c*v+u*S+h*R,o[7]=c*x+u*g+h*z,o[2]=d*b+m*w+y*L,o[5]=d*v+m*S+y*R,o[8]=d*x+m*g+y*z,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],a=e[1],i=e[2],o=e[3],r=e[4],l=e[5],s=e[6],c=e[7],u=e[8];return t*r*u-t*l*c-a*o*u+a*l*s+i*o*c-i*r*s}invert(){let e=this.elements,t=e[0],a=e[1],i=e[2],o=e[3],r=e[4],l=e[5],s=e[6],c=e[7],u=e[8],h=u*r-l*c,d=l*s-u*o,m=c*o-r*s,y=t*h+a*d+i*m;if(y===0)return this.set(0,0,0,0,0,0,0,0,0);let b=1/y;return e[0]=h*b,e[1]=(i*c-u*a)*b,e[2]=(l*a-i*r)*b,e[3]=d*b,e[4]=(u*t-i*s)*b,e[5]=(i*o-l*t)*b,e[6]=m*b,e[7]=(a*s-c*t)*b,e[8]=(r*t-a*o)*b,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,a,i,o,r,l){let s=Math.cos(o),c=Math.sin(o);return this.set(a*s,a*c,-a*(s*r+c*l)+r+e,-i*c,i*s,-i*(-c*r+s*l)+l+t,0,0,1),this}scale(e,t){return io("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Mu.makeScale(e,t)),this}rotate(e){return io("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Mu.makeRotation(-e)),this}translate(e,t){return io("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Mu.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),a=Math.sin(e);return this.set(t,-a,0,a,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,a=e.elements;for(let i=0;i<9;i++)if(t[i]!==a[i])return!1;return!0}fromArray(e,t=0){for(let a=0;a<9;a++)this.elements[a]=e[a+t];return this}toArray(e=[],t=0){let a=this.elements;return e[t]=a[0],e[t+1]=a[1],e[t+2]=a[2],e[t+3]=a[3],e[t+4]=a[4],e[t+5]=a[5],e[t+6]=a[6],e[t+7]=a[7],e[t+8]=a[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Mu=new Mt,pf=new Mt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),mf=new Mt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Mg(){let n={enabled:!0,workingColorSpace:Ir,spaces:{},convert:function(i,o,r){return this.enabled===!1||o===r||!o||!r||(this.spaces[o].transfer===Kt&&(i.r=oi(i.r),i.g=oi(i.g),i.b=oi(i.b)),this.spaces[o].primaries!==this.spaces[r].primaries&&(i.applyMatrix3(this.spaces[o].toXYZ),i.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===Kt&&(i.r=Vo(i.r),i.g=Vo(i.g),i.b=Vo(i.b))),i},workingToColorSpace:function(i,o){return this.convert(i,this.workingColorSpace,o)},colorSpaceToWorking:function(i,o){return this.convert(i,o,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===ci?Lr:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,o=this.workingColorSpace){return i.fromArray(this.spaces[o].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,o,r){return i.copy(this.spaces[o].toXYZ).multiply(this.spaces[r].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,o){return io("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(i,o)},toWorkingColorSpace:function(i,o){return io("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(i,o)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],a=[.3127,.329];return n.define({[Ir]:{primaries:e,whitePoint:a,transfer:Lr,toXYZ:pf,fromXYZ:mf,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Cn},outputColorSpaceConfig:{drawingBufferColorSpace:Cn}},[Cn]:{primaries:e,whitePoint:a,transfer:Kt,toXYZ:pf,fromXYZ:mf,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Cn}}}),n}var Dt=Mg();function oi(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Vo(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var wo,El=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let a;if(e instanceof HTMLCanvasElement)a=e;else{wo===void 0&&(wo=Wo("canvas")),wo.width=e.width,wo.height=e.height;let i=wo.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),a=wo}return a.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Wo("canvas");t.width=e.width,t.height=e.height;let a=t.getContext("2d");a.drawImage(e,0,0,e.width,e.height);let i=a.getImageData(0,0,e.width,e.height),o=i.data;for(let r=0;r<o.length;r++)o[r]=oi(o[r]/255)*255;return a.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let a=0;a<t.length;a++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[a]=Math.floor(oi(t[a]/255)*255):t[a]=oi(t[a]);return{data:t,width:e.width,height:e.height}}else return xt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},_g=0,Xo=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:_g++}),this.uuid=ir(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let a={uuid:this.uuid,url:""},i=this.data;if(i!==null){let o;if(Array.isArray(i)){o=[];for(let r=0,l=i.length;r<l;r++)i[r].isDataTexture?o.push(_u(i[r].image)):o.push(_u(i[r]))}else o=_u(i);a.url=o}return t||(e.images[this.uuid]=a),a}};function _u(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?El.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(xt("Texture: Unable to serialize Texture."),{})}var Eg=0,Eu=new X,jn=class n extends Oa{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,a=Ba,i=Ba,o=mn,r=Hi,l=na,s=$n,c=n.DEFAULT_ANISOTROPY,u=ci){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Eg++}),this.uuid=ir(),this.name="",this.source=new Xo(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=a,this.wrapT=i,this.magFilter=o,this.minFilter=r,this.anisotropy=c,this.format=l,this.internalFormat=null,this.type=s,this.offset=new nt(0,0),this.repeat=new nt(1,1),this.center=new nt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Mt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Eu).x}get height(){return this.source.getSize(Eu).y}get depth(){return this.source.getSize(Eu).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let a=e[t];if(a===void 0){xt(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){xt(`Texture.setValues(): property '${t}' does not exist.`);continue}i&&a&&i.isVector2&&a.isVector2||i&&a&&i.isVector3&&a.isVector3||i&&a&&i.isMatrix3&&a.isMatrix3?i.copy(a):this[t]=a}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let a={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(a.userData=this.userData),t||(e.textures[this.uuid]=a),a}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==fd)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case bl:e.x=e.x-Math.floor(e.x);break;case Ba:e.x=e.x<0?0:1;break;case Ml:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case bl:e.y=e.y-Math.floor(e.y);break;case Ba:e.y=e.y<0?0:1;break;case Ml:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};jn.DEFAULT_IMAGE=null;jn.DEFAULT_MAPPING=fd;jn.DEFAULT_ANISOTROPY=1;var gn=class n{static{n.prototype.isVector4=!0}constructor(e=0,t=0,a=0,i=1){this.x=e,this.y=t,this.z=a,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,a,i){return this.x=e,this.y=t,this.z=a,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,a=this.y,i=this.z,o=this.w,r=e.elements;return this.x=r[0]*t+r[4]*a+r[8]*i+r[12]*o,this.y=r[1]*t+r[5]*a+r[9]*i+r[13]*o,this.z=r[2]*t+r[6]*a+r[10]*i+r[14]*o,this.w=r[3]*t+r[7]*a+r[11]*i+r[15]*o,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,a,i,o,s=e.elements,c=s[0],u=s[4],h=s[8],d=s[1],m=s[5],y=s[9],b=s[2],v=s[6],x=s[10];if(Math.abs(u-d)<.01&&Math.abs(h-b)<.01&&Math.abs(y-v)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+b)<.1&&Math.abs(y+v)<.1&&Math.abs(c+m+x-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let S=(c+1)/2,g=(m+1)/2,L=(x+1)/2,R=(u+d)/4,z=(h+b)/4,p=(y+v)/4;return S>g&&S>L?S<.01?(a=0,i=.707106781,o=.707106781):(a=Math.sqrt(S),i=R/a,o=z/a):g>L?g<.01?(a=.707106781,i=0,o=.707106781):(i=Math.sqrt(g),a=R/i,o=p/i):L<.01?(a=.707106781,i=.707106781,o=0):(o=Math.sqrt(L),a=z/o,i=p/o),this.set(a,i,o,t),this}let w=Math.sqrt((v-y)*(v-y)+(h-b)*(h-b)+(d-u)*(d-u));return Math.abs(w)<.001&&(w=1),this.x=(v-y)/w,this.y=(h-b)/w,this.z=(d-u)/w,this.w=Math.acos((c+m+x-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ct(this.x,e.x,t.x),this.y=Ct(this.y,e.y,t.y),this.z=Ct(this.z,e.z,t.z),this.w=Ct(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ct(this.x,e,t),this.y=Ct(this.y,e,t),this.z=Ct(this.z,e,t),this.w=Ct(this.w,e,t),this}clampLength(e,t){let a=this.length();return this.divideScalar(a||1).multiplyScalar(Ct(a,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,a){return this.x=e.x+(t.x-e.x)*a,this.y=e.y+(t.y-e.y)*a,this.z=e.z+(t.z-e.z)*a,this.w=e.w+(t.w-e.w)*a,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Sl=class extends Oa{constructor(e=1,t=1,a={}){super(),a=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:mn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},a),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=a.depth,this.scissor=new gn(0,0,e,t),this.scissorTest=!1,this.viewport=new gn(0,0,e,t),this.textures=[];let i={width:e,height:t,depth:a.depth},o=new jn(i),r=a.count;for(let l=0;l<r;l++)this.textures[l]=o.clone(),this.textures[l].isRenderTargetTexture=!0,this.textures[l].renderTarget=this;this._setTextureOptions(a),this.depthBuffer=a.depthBuffer,this.stencilBuffer=a.stencilBuffer,this.resolveColorBuffer=a.resolveColorBuffer,this.resolveDepthBuffer=a.resolveDepthBuffer,this.resolveStencilBuffer=a.resolveStencilBuffer,this.storeMultisampledColorBuffer=a.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=a.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=a.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=a.depthTexture,this.samples=a.samples,this.multiview=a.multiview,this.useArrayDepthTexture=a.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:mn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let a=0;a<this.textures.length;a++)this.textures[a].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,a=1){if(this.width!==e||this.height!==t||this.depth!==a){this.width=e,this.height=t,this.depth=a;for(let i=0,o=this.textures.length;i<o;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=a,this.textures[i].isData3DTexture!==!0&&(this.textures[i].isArrayTexture=this.textures[i].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,a=e.textures.length;t<a;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let i=Object.assign({},e.textures[t].image);this.textures[t].source=new Xo(i)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Fn=class extends Sl{constructor(e=1,t=1,a={}){super(e,t,a),this.isWebGLRenderTarget=!0}},Dr=class extends jn{constructor(e=null,t=1,a=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:a,depth:i},this.magFilter=Un,this.minFilter=Un,this.wrapR=Ba,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Tl=class extends jn{constructor(e=null,t=1,a=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:a,depth:i},this.magFilter=Un,this.minFilter=Un,this.wrapR=Ba,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var At=class n{static{n.prototype.isMatrix4=!0}constructor(e,t,a,i,o,r,l,s,c,u,h,d,m,y,b,v){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,a,i,o,r,l,s,c,u,h,d,m,y,b,v)}set(e,t,a,i,o,r,l,s,c,u,h,d,m,y,b,v){let x=this.elements;return x[0]=e,x[4]=t,x[8]=a,x[12]=i,x[1]=o,x[5]=r,x[9]=l,x[13]=s,x[2]=c,x[6]=u,x[10]=h,x[14]=d,x[3]=m,x[7]=y,x[11]=b,x[15]=v,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,a=e.elements;return t[0]=a[0],t[1]=a[1],t[2]=a[2],t[3]=a[3],t[4]=a[4],t[5]=a[5],t[6]=a[6],t[7]=a[7],t[8]=a[8],t[9]=a[9],t[10]=a[10],t[11]=a[11],t[12]=a[12],t[13]=a[13],t[14]=a[14],t[15]=a[15],this}copyPosition(e){let t=this.elements,a=e.elements;return t[12]=a[12],t[13]=a[13],t[14]=a[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,a){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),a.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),a.setFromMatrixColumn(this,2),this)}makeBasis(e,t,a){return this.set(e.x,t.x,a.x,0,e.y,t.y,a.y,0,e.z,t.z,a.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,a=e.elements,i=1/Ao.setFromMatrixColumn(e,0).length(),o=1/Ao.setFromMatrixColumn(e,1).length(),r=1/Ao.setFromMatrixColumn(e,2).length();return t[0]=a[0]*i,t[1]=a[1]*i,t[2]=a[2]*i,t[3]=0,t[4]=a[4]*o,t[5]=a[5]*o,t[6]=a[6]*o,t[7]=0,t[8]=a[8]*r,t[9]=a[9]*r,t[10]=a[10]*r,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,a=e.x,i=e.y,o=e.z,r=Math.cos(a),l=Math.sin(a),s=Math.cos(i),c=Math.sin(i),u=Math.cos(o),h=Math.sin(o);if(e.order==="XYZ"){let d=r*u,m=r*h,y=l*u,b=l*h;t[0]=s*u,t[4]=-s*h,t[8]=c,t[1]=m+y*c,t[5]=d-b*c,t[9]=-l*s,t[2]=b-d*c,t[6]=y+m*c,t[10]=r*s}else if(e.order==="YXZ"){let d=s*u,m=s*h,y=c*u,b=c*h;t[0]=d+b*l,t[4]=y*l-m,t[8]=r*c,t[1]=r*h,t[5]=r*u,t[9]=-l,t[2]=m*l-y,t[6]=b+d*l,t[10]=r*s}else if(e.order==="ZXY"){let d=s*u,m=s*h,y=c*u,b=c*h;t[0]=d-b*l,t[4]=-r*h,t[8]=y+m*l,t[1]=m+y*l,t[5]=r*u,t[9]=b-d*l,t[2]=-r*c,t[6]=l,t[10]=r*s}else if(e.order==="ZYX"){let d=r*u,m=r*h,y=l*u,b=l*h;t[0]=s*u,t[4]=y*c-m,t[8]=d*c+b,t[1]=s*h,t[5]=b*c+d,t[9]=m*c-y,t[2]=-c,t[6]=l*s,t[10]=r*s}else if(e.order==="YZX"){let d=r*s,m=r*c,y=l*s,b=l*c;t[0]=s*u,t[4]=b-d*h,t[8]=y*h+m,t[1]=h,t[5]=r*u,t[9]=-l*u,t[2]=-c*u,t[6]=m*h+y,t[10]=d-b*h}else if(e.order==="XZY"){let d=r*s,m=r*c,y=l*s,b=l*c;t[0]=s*u,t[4]=-h,t[8]=c*u,t[1]=d*h+b,t[5]=r*u,t[9]=m*h-y,t[2]=y*h-m,t[6]=l*u,t[10]=b*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Sg,e,Tg)}lookAt(e,t,a){let i=this.elements;return ca.subVectors(e,t),ca.lengthSq()===0&&(ca.z=1),ca.normalize(),Si.crossVectors(a,ca),Si.lengthSq()===0&&(Math.abs(a.z)===1?ca.x+=1e-4:ca.z+=1e-4,ca.normalize(),Si.crossVectors(a,ca)),Si.normalize(),Os.crossVectors(ca,Si),i[0]=Si.x,i[4]=Os.x,i[8]=ca.x,i[1]=Si.y,i[5]=Os.y,i[9]=ca.y,i[2]=Si.z,i[6]=Os.z,i[10]=ca.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let a=e.elements,i=t.elements,o=this.elements,r=a[0],l=a[4],s=a[8],c=a[12],u=a[1],h=a[5],d=a[9],m=a[13],y=a[2],b=a[6],v=a[10],x=a[14],w=a[3],S=a[7],g=a[11],L=a[15],R=i[0],z=i[4],p=i[8],P=i[12],F=i[1],H=i[5],W=i[9],V=i[13],N=i[2],O=i[6],T=i[10],E=i[14],A=i[3],f=i[7],M=i[11],_=i[15];return o[0]=r*R+l*F+s*N+c*A,o[4]=r*z+l*H+s*O+c*f,o[8]=r*p+l*W+s*T+c*M,o[12]=r*P+l*V+s*E+c*_,o[1]=u*R+h*F+d*N+m*A,o[5]=u*z+h*H+d*O+m*f,o[9]=u*p+h*W+d*T+m*M,o[13]=u*P+h*V+d*E+m*_,o[2]=y*R+b*F+v*N+x*A,o[6]=y*z+b*H+v*O+x*f,o[10]=y*p+b*W+v*T+x*M,o[14]=y*P+b*V+v*E+x*_,o[3]=w*R+S*F+g*N+L*A,o[7]=w*z+S*H+g*O+L*f,o[11]=w*p+S*W+g*T+L*M,o[15]=w*P+S*V+g*E+L*_,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],a=e[4],i=e[8],o=e[12],r=e[1],l=e[5],s=e[9],c=e[13],u=e[2],h=e[6],d=e[10],m=e[14],y=e[3],b=e[7],v=e[11],x=e[15],w=s*m-c*d,S=l*m-c*h,g=l*d-s*h,L=r*m-c*u,R=r*d-s*u,z=r*h-l*u;return t*(b*w-v*S+x*g)-a*(y*w-v*L+x*R)+i*(y*S-b*L+x*z)-o*(y*g-b*R+v*z)}determinantAffine(){let e=this.elements,t=e[0],a=e[4],i=e[8],o=e[1],r=e[5],l=e[9],s=e[2],c=e[6],u=e[10];return t*(r*u-l*c)-a*(o*u-l*s)+i*(o*c-r*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,a){let i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=a),this}invert(){let e=this.elements,t=e[0],a=e[1],i=e[2],o=e[3],r=e[4],l=e[5],s=e[6],c=e[7],u=e[8],h=e[9],d=e[10],m=e[11],y=e[12],b=e[13],v=e[14],x=e[15],w=t*l-a*r,S=t*s-i*r,g=t*c-o*r,L=a*s-i*l,R=a*c-o*l,z=i*c-o*s,p=u*b-h*y,P=u*v-d*y,F=u*x-m*y,H=h*v-d*b,W=h*x-m*b,V=d*x-m*v,N=w*V-S*W+g*H+L*F-R*P+z*p;if(N===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let O=1/N;return e[0]=(l*V-s*W+c*H)*O,e[1]=(i*W-a*V-o*H)*O,e[2]=(b*z-v*R+x*L)*O,e[3]=(d*R-h*z-m*L)*O,e[4]=(s*F-r*V-c*P)*O,e[5]=(t*V-i*F+o*P)*O,e[6]=(v*g-y*z-x*S)*O,e[7]=(u*z-d*g+m*S)*O,e[8]=(r*W-l*F+c*p)*O,e[9]=(a*F-t*W-o*p)*O,e[10]=(y*R-b*g+x*w)*O,e[11]=(h*g-u*R-m*w)*O,e[12]=(l*P-r*H-s*p)*O,e[13]=(t*H-a*P+i*p)*O,e[14]=(b*S-y*L-v*w)*O,e[15]=(u*L-h*S+d*w)*O,this}scale(e){let t=this.elements,a=e.x,i=e.y,o=e.z;return t[0]*=a,t[4]*=i,t[8]*=o,t[1]*=a,t[5]*=i,t[9]*=o,t[2]*=a,t[6]*=i,t[10]*=o,t[3]*=a,t[7]*=i,t[11]*=o,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],a=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,a,i))}makeTranslation(e,t,a){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,a,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),a=Math.sin(e);return this.set(1,0,0,0,0,t,-a,0,0,a,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),a=Math.sin(e);return this.set(t,0,a,0,0,1,0,0,-a,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),a=Math.sin(e);return this.set(t,-a,0,0,a,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let a=Math.cos(t),i=Math.sin(t),o=1-a,r=e.x,l=e.y,s=e.z,c=o*r,u=o*l;return this.set(c*r+a,c*l-i*s,c*s+i*l,0,c*l+i*s,u*l+a,u*s-i*r,0,c*s-i*l,u*s+i*r,o*s*s+a,0,0,0,0,1),this}makeScale(e,t,a){return this.set(e,0,0,0,0,t,0,0,0,0,a,0,0,0,0,1),this}makeShear(e,t,a,i,o,r){return this.set(1,a,o,0,e,1,r,0,t,i,1,0,0,0,0,1),this}compose(e,t,a){let i=this.elements,o=t._x,r=t._y,l=t._z,s=t._w,c=o+o,u=r+r,h=l+l,d=o*c,m=o*u,y=o*h,b=r*u,v=r*h,x=l*h,w=s*c,S=s*u,g=s*h,L=a.x,R=a.y,z=a.z;return i[0]=(1-(b+x))*L,i[1]=(m+g)*L,i[2]=(y-S)*L,i[3]=0,i[4]=(m-g)*R,i[5]=(1-(d+x))*R,i[6]=(v+w)*R,i[7]=0,i[8]=(y+S)*z,i[9]=(v-w)*z,i[10]=(1-(d+b))*z,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,a){let i=this.elements;e.x=i[12],e.y=i[13],e.z=i[14];let o=this.determinantAffine();if(o===0)return a.set(1,1,1),t.identity(),this;let r=Ao.set(i[0],i[1],i[2]).length(),l=Ao.set(i[4],i[5],i[6]).length(),s=Ao.set(i[8],i[9],i[10]).length();o<0&&(r=-r),Aa.copy(this);let c=1/r,u=1/l,h=1/s;return Aa.elements[0]*=c,Aa.elements[1]*=c,Aa.elements[2]*=c,Aa.elements[4]*=u,Aa.elements[5]*=u,Aa.elements[6]*=u,Aa.elements[8]*=h,Aa.elements[9]*=h,Aa.elements[10]*=h,t.setFromRotationMatrix(Aa),a.x=r,a.y=l,a.z=s,this}makePerspective(e,t,a,i,o,r,l=Pa,s=!1){let c=this.elements,u=2*o/(t-e),h=2*o/(a-i),d=(t+e)/(t-e),m=(a+i)/(a-i),y,b;if(s)y=o/(r-o),b=r*o/(r-o);else if(l===Pa)y=-(r+o)/(r-o),b=-2*r*o/(r-o);else if(l===qo)y=-r/(r-o),b=-r*o/(r-o);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+l);return c[0]=u,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=h,c[9]=m,c[13]=0,c[2]=0,c[6]=0,c[10]=y,c[14]=b,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,a,i,o,r,l=Pa,s=!1){let c=this.elements,u=2/(t-e),h=2/(a-i),d=-(t+e)/(t-e),m=-(a+i)/(a-i),y,b;if(s)y=1/(r-o),b=r/(r-o);else if(l===Pa)y=-2/(r-o),b=-(r+o)/(r-o);else if(l===qo)y=-1/(r-o),b=-o/(r-o);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+l);return c[0]=u,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=h,c[9]=0,c[13]=m,c[2]=0,c[6]=0,c[10]=y,c[14]=b,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,a=e.elements;for(let i=0;i<16;i++)if(t[i]!==a[i])return!1;return!0}fromArray(e,t=0){for(let a=0;a<16;a++)this.elements[a]=e[a+t];return this}toArray(e=[],t=0){let a=this.elements;return e[t]=a[0],e[t+1]=a[1],e[t+2]=a[2],e[t+3]=a[3],e[t+4]=a[4],e[t+5]=a[5],e[t+6]=a[6],e[t+7]=a[7],e[t+8]=a[8],e[t+9]=a[9],e[t+10]=a[10],e[t+11]=a[11],e[t+12]=a[12],e[t+13]=a[13],e[t+14]=a[14],e[t+15]=a[15],e}},Ao=new X,Aa=new At,Sg=new X(0,0,0),Tg=new X(1,1,1),Si=new X,Os=new X,ca=new X,gf=new At,xf=new Wn,da=class n{constructor(e=0,t=0,a=0,i=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=a,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,a,i=this._order){return this._x=e,this._y=t,this._z=a,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,a=!0){let i=e.elements,o=i[0],r=i[4],l=i[8],s=i[1],c=i[5],u=i[9],h=i[2],d=i[6],m=i[10];switch(t){case"XYZ":this._y=Math.asin(Ct(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,m),this._z=Math.atan2(-r,o)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ct(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(l,m),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-h,o),this._z=0);break;case"ZXY":this._x=Math.asin(Ct(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,m),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(s,o));break;case"ZYX":this._y=Math.asin(-Ct(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(s,o)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(Ct(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,o)):(this._x=0,this._y=Math.atan2(l,m));break;case"XZY":this._z=Math.asin(-Ct(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(l,o)):(this._x=Math.atan2(-u,m),this._y=0);break;default:xt("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,a===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,a){return gf.makeRotationFromQuaternion(e),this.setFromRotationMatrix(gf,t,a)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return xf.setFromEuler(this),this.setFromQuaternion(xf,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};da.DEFAULT_ORDER="XYZ";var Yo=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},wg=0,vf=new X,Ro=new Wn,Qa=new At,Gs=new X,br=new X,Ag=new X,Rg=new Wn,yf=new X(1,0,0),bf=new X(0,1,0),Mf=new X(0,0,1),_f={type:"added"},Cg={type:"removed"},Co={type:"childadded",child:null},Su={type:"childremoved",child:null},ln=class n extends Oa{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:wg++}),this.uuid=ir(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new X,t=new da,a=new Wn,i=new X(1,1,1);function o(){a.setFromEuler(t,!1)}function r(){t.setFromQuaternion(a,void 0,!1)}t._onChange(o),a._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:a},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new At},normalMatrix:{value:new Mt}}),this.matrix=new At,this.matrixWorld=new At,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Yo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ro.setFromAxisAngle(e,t),this.quaternion.multiply(Ro),this}rotateOnWorldAxis(e,t){return Ro.setFromAxisAngle(e,t),this.quaternion.premultiply(Ro),this}rotateX(e){return this.rotateOnAxis(yf,e)}rotateY(e){return this.rotateOnAxis(bf,e)}rotateZ(e){return this.rotateOnAxis(Mf,e)}translateOnAxis(e,t){return vf.copy(e).applyQuaternion(this.quaternion),this.position.add(vf.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(yf,e)}translateY(e){return this.translateOnAxis(bf,e)}translateZ(e){return this.translateOnAxis(Mf,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Qa.copy(this.matrixWorld).invert())}lookAt(e,t,a){e.isVector3?Gs.copy(e):Gs.set(e,t,a);let i=this.parent;this.updateWorldMatrix(!0,!1),br.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Qa.lookAt(br,Gs,this.up):Qa.lookAt(Gs,br,this.up),this.quaternion.setFromRotationMatrix(Qa),i&&(Qa.extractRotation(i.matrixWorld),Ro.setFromRotationMatrix(Qa),this.quaternion.premultiply(Ro.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(bt("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(_f),Co.child=e,this.dispatchEvent(Co),Co.child=null):bt("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let a=0;a<arguments.length;a++)this.remove(arguments[a]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Cg),Su.child=e,this.dispatchEvent(Su),Su.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Qa.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Qa.multiply(e.parent.matrixWorld)),e.applyMatrix4(Qa),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(_f),Co.child=e,this.dispatchEvent(Co),Co.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let a=0,i=this.children.length;a<i;a++){let r=this.children[a].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,a=[]){this[e]===t&&a.push(this);let i=this.children;for(let o=0,r=i.length;o<r;o++)i[o].getObjectsByProperty(e,t,a);return a}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(br,e,Ag),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(br,Rg,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let a=0,i=t.length;a<i;a++)t[a].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let a=0,i=t.length;a<i;a++)t[a].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,a=e.y,i=e.z,o=this.matrix.elements;o[12]+=t-o[0]*t-o[4]*a-o[8]*i,o[13]+=a-o[1]*t-o[5]*a-o[9]*i,o[14]+=i-o[2]*t-o[6]*a-o[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let a=0,i=t.length;a<i;a++)t[a].updateMatrixWorld(e)}updateWorldMatrix(e,t,a=!1){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||a)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,a=!0),t===!0){let o=this.children;for(let r=0,l=o.length;r<l;r++)o[r].updateWorldMatrix(!1,!0,a)}}toJSON(e){let t=e===void 0||typeof e=="string",a={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},a.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,i.name=this.name,i.castShadow=this.castShadow,i.receiveShadow=this.receiveShadow,i.visible=this.visible,i.frustumCulled=this.frustumCulled,i.renderOrder=this.renderOrder,i.static=this.static,i.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(l=>({...l,boundingBox:l.boundingBox?l.boundingBox.toJSON():void 0,boundingSphere:l.boundingSphere?l.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(l=>({...l})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function o(l,s){return l[s.uuid]===void 0&&(l[s.uuid]=s.toJSON(e)),s.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=o(e.geometries,this.geometry);let l=this.geometry.parameters;if(l!==void 0&&l.shapes!==void 0){let s=l.shapes;if(Array.isArray(s))for(let c=0,u=s.length;c<u;c++){let h=s[c];o(e.shapes,h)}else o(e.shapes,s)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(o(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let l=[];for(let s=0,c=this.material.length;s<c;s++)l.push(o(e.materials,this.material[s]));i.material=l}else i.material=o(e.materials,this.material);if(this.children.length>0){i.children=[];for(let l=0;l<this.children.length;l++)i.children.push(this.children[l].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let l=0;l<this.animations.length;l++){let s=this.animations[l];i.animations.push(o(e.animations,s))}}if(t){let l=r(e.geometries),s=r(e.materials),c=r(e.textures),u=r(e.images),h=r(e.shapes),d=r(e.skeletons),m=r(e.animations),y=r(e.nodes);l.length>0&&(a.geometries=l),s.length>0&&(a.materials=s),c.length>0&&(a.textures=c),u.length>0&&(a.images=u),h.length>0&&(a.shapes=h),d.length>0&&(a.skeletons=d),m.length>0&&(a.animations=m),y.length>0&&(a.nodes=y)}return a.object=i,a;function r(l){let s=[];for(let c in l){let u=l[c];delete u.metadata,s.push(u)}return s}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let a=0;a<e.children.length;a++){let i=e.children[a];this.add(i.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};ln.DEFAULT_UP=new X(0,1,0);ln.DEFAULT_MATRIX_AUTO_UPDATE=!0;ln.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var we=class extends ln{constructor(){super(),this.isGroup=!0,this.type="Group"}},zg={type:"move"},$o=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new we,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new we,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new X,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new X),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new we,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new X,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new X,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let a of e.hand.values())this._getHandJoint(t,a)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,a){let i=null,o=null,r=null,l=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){r=!0;for(let b of e.hand.values()){let v=t.getJointPose(b,a),x=this._getHandJoint(c,b);v!==null&&(x.matrix.fromArray(v.transform.matrix),x.matrix.decompose(x.position,x.rotation,x.scale),x.matrixWorldNeedsUpdate=!0,x.jointRadius=v.radius),x.visible=v!==null}let u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),m=.02,y=.005;c.inputState.pinching&&d>m+y?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=m-y&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(o=t.getPose(e.gripSpace,a),o!==null&&(s.matrix.fromArray(o.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,o.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(o.linearVelocity)):s.hasLinearVelocity=!1,o.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(o.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:"gripUpdated",data:e,target:this})));l!==null&&(i=t.getPose(e.targetRaySpace,a),i===null&&o!==null&&(i=o),i!==null&&(l.matrix.fromArray(i.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,i.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(i.linearVelocity)):l.hasLinearVelocity=!1,i.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(i.angularVelocity)):l.hasAngularVelocity=!1,this.dispatchEvent(zg)))}return l!==null&&(l.visible=i!==null),s!==null&&(s.visible=o!==null),c!==null&&(c.visible=r!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let a=new we;a.matrixAutoUpdate=!1,a.visible=!1,e.joints[t.jointName]=a,e.add(a)}return e.joints[t.jointName]}},P0={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ti={h:0,s:0,l:0},Vs={h:0,s:0,l:0};function Tu(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var at=class{constructor(e,t,a){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,a)}set(e,t,a){if(t===void 0&&a===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,a);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Cn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Dt.colorSpaceToWorking(this,t),this}setRGB(e,t,a,i=Dt.workingColorSpace){return this.r=e,this.g=t,this.b=a,Dt.colorSpaceToWorking(this,i),this}setHSL(e,t,a,i=Dt.workingColorSpace){if(e=_d(e,1),t=Ct(t,0,1),a=Ct(a,0,1),t===0)this.r=this.g=this.b=a;else{let o=a<=.5?a*(1+t):a+t-a*t,r=2*a-o;this.r=Tu(r,o,e+1/3),this.g=Tu(r,o,e),this.b=Tu(r,o,e-1/3)}return Dt.colorSpaceToWorking(this,i),this}setStyle(e,t=Cn){function a(o){o!==void 0&&parseFloat(o)<1&&xt("Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let o,r=i[1],l=i[2];switch(r){case"rgb":case"rgba":if(o=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return a(o[4]),this.setRGB(Math.min(255,parseInt(o[1],10))/255,Math.min(255,parseInt(o[2],10))/255,Math.min(255,parseInt(o[3],10))/255,t);if(o=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return a(o[4]),this.setRGB(Math.min(100,parseInt(o[1],10))/100,Math.min(100,parseInt(o[2],10))/100,Math.min(100,parseInt(o[3],10))/100,t);break;case"hsl":case"hsla":if(o=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return a(o[4]),this.setHSL(parseFloat(o[1])/360,parseFloat(o[2])/100,parseFloat(o[3])/100,t);break;default:xt("Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let o=i[1],r=o.length;if(r===3)return this.setRGB(parseInt(o.charAt(0),16)/15,parseInt(o.charAt(1),16)/15,parseInt(o.charAt(2),16)/15,t);if(r===6)return this.setHex(parseInt(o,16),t);xt("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Cn){let a=P0[e.toLowerCase()];return a!==void 0?this.setHex(a,t):xt("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=oi(e.r),this.g=oi(e.g),this.b=oi(e.b),this}copyLinearToSRGB(e){return this.r=Vo(e.r),this.g=Vo(e.g),this.b=Vo(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Cn){return Dt.workingToColorSpace(qn.copy(this),e),Math.round(Ct(qn.r*255,0,255))*65536+Math.round(Ct(qn.g*255,0,255))*256+Math.round(Ct(qn.b*255,0,255))}getHexString(e=Cn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Dt.workingColorSpace){Dt.workingToColorSpace(qn.copy(this),t);let a=qn.r,i=qn.g,o=qn.b,r=Math.max(a,i,o),l=Math.min(a,i,o),s,c,u=(l+r)/2;if(l===r)s=0,c=0;else{let h=r-l;switch(c=u<=.5?h/(r+l):h/(2-r-l),r){case a:s=(i-o)/h+(i<o?6:0);break;case i:s=(o-a)/h+2;break;case o:s=(a-i)/h+4;break}s/=6}return e.h=s,e.s=c,e.l=u,e}getRGB(e,t=Dt.workingColorSpace){return Dt.workingToColorSpace(qn.copy(this),t),e.r=qn.r,e.g=qn.g,e.b=qn.b,e}getStyle(e=Cn){Dt.workingToColorSpace(qn.copy(this),e);let t=qn.r,a=qn.g,i=qn.b;return e!==Cn?`color(${e} ${t.toFixed(3)} ${a.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(a*255)},${Math.round(i*255)})`}offsetHSL(e,t,a){return this.getHSL(Ti),this.setHSL(Ti.h+e,Ti.s+t,Ti.l+a)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,a){return this.r=e.r+(t.r-e.r)*a,this.g=e.g+(t.g-e.g)*a,this.b=e.b+(t.b-e.b)*a,this}lerpHSL(e,t){this.getHSL(Ti),e.getHSL(Vs);let a=Rr(Ti.h,Vs.h,t),i=Rr(Ti.s,Vs.s,t),o=Rr(Ti.l,Vs.l,t);return this.setHSL(a,i,o),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,a=this.g,i=this.b,o=e.elements;return this.r=o[0]*t+o[3]*a+o[6]*i,this.g=o[1]*t+o[4]*a+o[7]*i,this.b=o[2]*t+o[5]*a+o[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},qn=new at;at.NAMES=P0;var Nr=class n{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new at(e),this.density=t}clone(){return new n(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var ro=class extends ln{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new da,this.environmentIntensity=1,this.environmentRotation=new da,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Ra=new X,ei=new X,wu=new X,ti=new X,zo=new X,Po=new X,Ef=new X,Au=new X,Ru=new X,Cu=new X,zu=new gn,Pu=new gn,Iu=new gn,Ci=class n{constructor(e=new X,t=new X,a=new X){this.a=e,this.b=t,this.c=a}static getNormal(e,t,a,i){i.subVectors(a,t),Ra.subVectors(e,t),i.cross(Ra);let o=i.lengthSq();return o>0?i.multiplyScalar(1/Math.sqrt(o)):i.set(0,0,0)}static getBarycoord(e,t,a,i,o){Ra.subVectors(i,t),ei.subVectors(a,t),wu.subVectors(e,t);let r=Ra.dot(Ra),l=Ra.dot(ei),s=Ra.dot(wu),c=ei.dot(ei),u=ei.dot(wu),h=r*c-l*l;if(h===0)return o.set(0,0,0),null;let d=1/h,m=(c*s-l*u)*d,y=(r*u-l*s)*d;return o.set(1-m-y,y,m)}static containsPoint(e,t,a,i){return this.getBarycoord(e,t,a,i,ti)===null?!1:ti.x>=0&&ti.y>=0&&ti.x+ti.y<=1}static getInterpolation(e,t,a,i,o,r,l,s){return this.getBarycoord(e,t,a,i,ti)===null?(s.x=0,s.y=0,"z"in s&&(s.z=0),"w"in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(o,ti.x),s.addScaledVector(r,ti.y),s.addScaledVector(l,ti.z),s)}static getInterpolatedAttribute(e,t,a,i,o,r){return zu.setScalar(0),Pu.setScalar(0),Iu.setScalar(0),zu.fromBufferAttribute(e,t),Pu.fromBufferAttribute(e,a),Iu.fromBufferAttribute(e,i),r.setScalar(0),r.addScaledVector(zu,o.x),r.addScaledVector(Pu,o.y),r.addScaledVector(Iu,o.z),r}static isFrontFacing(e,t,a,i){return Ra.subVectors(a,t),ei.subVectors(e,t),Ra.cross(ei).dot(i)<0}set(e,t,a){return this.a.copy(e),this.b.copy(t),this.c.copy(a),this}setFromPointsAndIndices(e,t,a,i){return this.a.copy(e[t]),this.b.copy(e[a]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,a,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,a),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ra.subVectors(this.c,this.b),ei.subVectors(this.a,this.b),Ra.cross(ei).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,a,i,o){return n.getInterpolation(e,this.a,this.b,this.c,t,a,i,o)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let a=this.a,i=this.b,o=this.c,r,l;zo.subVectors(i,a),Po.subVectors(o,a),Au.subVectors(e,a);let s=zo.dot(Au),c=Po.dot(Au);if(s<=0&&c<=0)return t.copy(a);Ru.subVectors(e,i);let u=zo.dot(Ru),h=Po.dot(Ru);if(u>=0&&h<=u)return t.copy(i);let d=s*h-u*c;if(d<=0&&s>=0&&u<=0)return r=s/(s-u),t.copy(a).addScaledVector(zo,r);Cu.subVectors(e,o);let m=zo.dot(Cu),y=Po.dot(Cu);if(y>=0&&m<=y)return t.copy(o);let b=m*c-s*y;if(b<=0&&c>=0&&y<=0)return l=c/(c-y),t.copy(a).addScaledVector(Po,l);let v=u*y-m*h;if(v<=0&&h-u>=0&&m-y>=0)return Ef.subVectors(o,i),l=(h-u)/(h-u+(m-y)),t.copy(i).addScaledVector(Ef,l);let x=1/(v+b+d);return r=b*x,l=d*x,t.copy(a).addScaledVector(zo,r).addScaledVector(Po,l)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Ga=class{constructor(e=new X(1/0,1/0,1/0),t=new X(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,a=e.length;t<a;t+=3)this.expandByPoint(Ca.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,a=e.count;t<a;t++)this.expandByPoint(Ca.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,a=e.length;t<a;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let a=Ca.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(a),this.max.copy(e).add(a),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let a=e.geometry;if(a!==void 0){let o=a.getAttribute("position");if(t===!0&&o!==void 0&&e.isInstancedMesh!==!0)for(let r=0,l=o.count;r<l;r++)e.isMesh===!0?e.getVertexPosition(r,Ca):Ca.fromBufferAttribute(o,r),Ca.applyMatrix4(e.matrixWorld),this.expandByPoint(Ca);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ks.copy(e.boundingBox)):(a.boundingBox===null&&a.computeBoundingBox(),ks.copy(a.boundingBox)),ks.applyMatrix4(e.matrixWorld),this.union(ks)}let i=e.children;for(let o=0,r=i.length;o<r;o++)this.expandByObject(i[o],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Ca),Ca.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,a;return e.normal.x>0?(t=e.normal.x*this.min.x,a=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,a=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,a+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,a+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,a+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,a+=e.normal.z*this.min.z),t<=-e.constant&&a>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Mr),qs.subVectors(this.max,Mr),Io.subVectors(e.a,Mr),Lo.subVectors(e.b,Mr),Do.subVectors(e.c,Mr),wi.subVectors(Lo,Io),Ai.subVectors(Do,Lo),eo.subVectors(Io,Do);let t=[0,-wi.z,wi.y,0,-Ai.z,Ai.y,0,-eo.z,eo.y,wi.z,0,-wi.x,Ai.z,0,-Ai.x,eo.z,0,-eo.x,-wi.y,wi.x,0,-Ai.y,Ai.x,0,-eo.y,eo.x,0];return!Lu(t,Io,Lo,Do,qs)||(t=[1,0,0,0,1,0,0,0,1],!Lu(t,Io,Lo,Do,qs))?!1:(Ws.crossVectors(wi,Ai),t=[Ws.x,Ws.y,Ws.z],Lu(t,Io,Lo,Do,qs))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ca).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ca).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ni[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ni[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ni[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ni[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ni[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ni[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ni[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ni[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ni),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},ni=[new X,new X,new X,new X,new X,new X,new X,new X],Ca=new X,ks=new Ga,Io=new X,Lo=new X,Do=new X,wi=new X,Ai=new X,eo=new X,Mr=new X,qs=new X,Ws=new X,to=new X;function Lu(n,e,t,a,i){for(let o=0,r=n.length-3;o<=r;o+=3){to.fromArray(n,o);let l=i.x*Math.abs(to.x)+i.y*Math.abs(to.y)+i.z*Math.abs(to.z),s=e.dot(to),c=t.dot(to),u=a.dot(to);if(Math.max(-Math.max(s,c,u),Math.min(s,c,u))>l)return!1}return!0}var ii=Pg();function Pg(){let n=new ArrayBuffer(4),e=new Float32Array(n),t=new Uint32Array(n),a=new Uint32Array(512),i=new Uint32Array(512);for(let s=0;s<256;++s){let c=s-127;c<-27?(a[s]=0,a[s|256]=32768,i[s]=24,i[s|256]=24):c<-14?(a[s]=1024>>-c-14,a[s|256]=1024>>-c-14|32768,i[s]=-c-1,i[s|256]=-c-1):c<=15?(a[s]=c+15<<10,a[s|256]=c+15<<10|32768,i[s]=13,i[s|256]=13):c<128?(a[s]=31744,a[s|256]=64512,i[s]=24,i[s|256]=24):(a[s]=31744,a[s|256]=64512,i[s]=13,i[s|256]=13)}let o=new Uint32Array(2048),r=new Uint32Array(64),l=new Uint32Array(64);for(let s=1;s<1024;++s){let c=s<<13,u=0;for(;(c&8388608)===0;)c<<=1,u-=8388608;c&=-8388609,u+=947912704,o[s]=c|u}for(let s=1024;s<2048;++s)o[s]=939524096+(s-1024<<13);for(let s=1;s<31;++s)r[s]=s<<23;r[31]=1199570944,r[32]=2147483648;for(let s=33;s<63;++s)r[s]=2147483648+(s-32<<23);r[63]=3347054592;for(let s=1;s<64;++s)s!==32&&(l[s]=1024);return{floatView:e,uint32View:t,baseTable:a,shiftTable:i,mantissaTable:o,exponentTable:r,offsetTable:l}}function Ig(n){Math.abs(n)>65504&&xt("DataUtils.toHalfFloat(): Value out of range."),n=Ct(n,-65504,65504),ii.floatView[0]=n;let e=ii.uint32View[0],t=e>>23&511;return ii.baseTable[t]+((e&8388607)>>ii.shiftTable[t])}function Lg(n){let e=n>>10;return ii.uint32View[0]=ii.mantissaTable[ii.offsetTable[e]+(n&1023)]+ii.exponentTable[e],ii.floatView[0]}var Ur=class{static toHalfFloat(e){return Ig(e)}static fromHalfFloat(e){return Lg(e)}},An=new X,js=new nt,Dg=0,Ft=class extends Oa{constructor(e,t,a=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Dg++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=a,this.usage=w0,this.updateRanges=[],this.gpuType=_a,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,a){e*=this.itemSize,a*=t.itemSize;for(let i=0,o=this.itemSize;i<o;i++)this.array[e+i]=t.array[a+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,a=this.count;t<a;t++)js.fromBufferAttribute(this,t),js.applyMatrix3(e),this.setXY(t,js.x,js.y);else if(this.itemSize===3)for(let t=0,a=this.count;t<a;t++)An.fromBufferAttribute(this,t),An.applyMatrix3(e),this.setXYZ(t,An.x,An.y,An.z);return this}applyMatrix4(e){for(let t=0,a=this.count;t<a;t++)An.fromBufferAttribute(this,t),An.applyMatrix4(e),this.setXYZ(t,An.x,An.y,An.z);return this}applyNormalMatrix(e){for(let t=0,a=this.count;t<a;t++)An.fromBufferAttribute(this,t),An.applyNormalMatrix(e),this.setXYZ(t,An.x,An.y,An.z);return this}transformDirection(e){for(let t=0,a=this.count;t<a;t++)An.fromBufferAttribute(this,t),An.transformDirection(e),this.setXYZ(t,An.x,An.y,An.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let a=this.array[e*this.itemSize+t];return this.normalized&&(a=Go(a,this.array)),a}setComponent(e,t,a){return this.normalized&&(a=ea(a,this.array)),this.array[e*this.itemSize+t]=a,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Go(t,this.array)),t}setX(e,t){return this.normalized&&(t=ea(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Go(t,this.array)),t}setY(e,t){return this.normalized&&(t=ea(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Go(t,this.array)),t}setZ(e,t){return this.normalized&&(t=ea(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Go(t,this.array)),t}setW(e,t){return this.normalized&&(t=ea(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,a){return e*=this.itemSize,this.normalized&&(t=ea(t,this.array),a=ea(a,this.array)),this.array[e+0]=t,this.array[e+1]=a,this}setXYZ(e,t,a,i){return e*=this.itemSize,this.normalized&&(t=ea(t,this.array),a=ea(a,this.array),i=ea(i,this.array)),this.array[e+0]=t,this.array[e+1]=a,this.array[e+2]=i,this}setXYZW(e,t,a,i,o){return e*=this.itemSize,this.normalized&&(t=ea(t,this.array),a=ea(a,this.array),i=ea(i,this.array),o=ea(o,this.array)),this.array[e+0]=t,this.array[e+1]=a,this.array[e+2]=i,this.array[e+3]=o,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var Fr=class extends Ft{constructor(e,t,a){super(new Uint16Array(e),t,a)}};var Br=class extends Ft{constructor(e,t,a){super(new Uint32Array(e),t,a)}};var Ze=class extends Ft{constructor(e,t,a){super(new Float32Array(e),t,a)}},Ng=new Ga,_r=new X,Du=new X,ya=class{constructor(e=new X,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let a=this.center;t!==void 0?a.copy(t):Ng.setFromPoints(e).getCenter(a);let i=0;for(let o=0,r=e.length;o<r;o++)i=Math.max(i,a.distanceToSquared(e[o]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let a=this.center.distanceToSquared(e);return t.copy(e),a>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;_r.subVectors(e,this.center);let t=_r.lengthSq();if(t>this.radius*this.radius){let a=Math.sqrt(t),i=(a-this.radius)*.5;this.center.addScaledVector(_r,i/a),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Du.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(_r.copy(e.center).add(Du)),this.expandByPoint(_r.copy(e.center).sub(Du))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Ug=0,va=new At,Nu=new ln,No=new X,ua=new Ga,Er=new Ga,Dn=new X,lt=class n extends Oa{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ug++}),this.uuid=ir(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(ag(e)?Br:Fr)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,a=0){this.groups.push({start:e,count:t,materialIndex:a})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let a=this.attributes.normal;if(a!==void 0){let o=new Mt().getNormalMatrix(e);a.applyNormalMatrix(o),a.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return va.makeRotationFromQuaternion(e),this.applyMatrix4(va),this}rotateX(e){return va.makeRotationX(e),this.applyMatrix4(va),this}rotateY(e){return va.makeRotationY(e),this.applyMatrix4(va),this}rotateZ(e){return va.makeRotationZ(e),this.applyMatrix4(va),this}translate(e,t,a){return va.makeTranslation(e,t,a),this.applyMatrix4(va),this}scale(e,t,a){return va.makeScale(e,t,a),this.applyMatrix4(va),this}lookAt(e){return Nu.lookAt(e),Nu.updateMatrix(),this.applyMatrix4(Nu.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(No).negate(),this.translate(No.x,No.y,No.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let a=[];for(let i=0,o=e.length;i<o;i++){let r=e[i];a.push(r.x,r.y,r.z||0)}this.setAttribute("position",new Ze(a,3))}else{let a=Math.min(e.length,t.count);for(let i=0;i<a;i++){let o=e[i];t.setXYZ(i,o.x,o.y,o.z||0)}e.length>t.count&&xt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ga);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){bt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new X(-1/0,-1/0,-1/0),new X(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let a=0,i=t.length;a<i;a++){let o=t[a];ua.setFromBufferAttribute(o),this.morphTargetsRelative?(Dn.addVectors(this.boundingBox.min,ua.min),this.boundingBox.expandByPoint(Dn),Dn.addVectors(this.boundingBox.max,ua.max),this.boundingBox.expandByPoint(Dn)):(this.boundingBox.expandByPoint(ua.min),this.boundingBox.expandByPoint(ua.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&bt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ya);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){bt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new X,1/0);return}if(e){let a=this.boundingSphere.center;if(ua.setFromBufferAttribute(e),t)for(let o=0,r=t.length;o<r;o++){let l=t[o];Er.setFromBufferAttribute(l),this.morphTargetsRelative?(Dn.addVectors(ua.min,Er.min),ua.expandByPoint(Dn),Dn.addVectors(ua.max,Er.max),ua.expandByPoint(Dn)):(ua.expandByPoint(Er.min),ua.expandByPoint(Er.max))}ua.getCenter(a);let i=0;for(let o=0,r=e.count;o<r;o++)Dn.fromBufferAttribute(e,o),i=Math.max(i,a.distanceToSquared(Dn));if(t)for(let o=0,r=t.length;o<r;o++){let l=t[o],s=this.morphTargetsRelative;for(let c=0,u=l.count;c<u;c++)Dn.fromBufferAttribute(l,c),s&&(No.fromBufferAttribute(e,c),Dn.add(No)),i=Math.max(i,a.distanceToSquared(Dn))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&bt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){bt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let a=t.position,i=t.normal,o=t.uv,r=this.getAttribute("tangent");(r===void 0||r.count!==a.count)&&(r=new Ft(new Float32Array(4*a.count),4),this.setAttribute("tangent",r));let l=[],s=[];for(let p=0;p<a.count;p++)l[p]=new X,s[p]=new X;let c=new X,u=new X,h=new X,d=new nt,m=new nt,y=new nt,b=new X,v=new X;function x(p,P,F){c.fromBufferAttribute(a,p),u.fromBufferAttribute(a,P),h.fromBufferAttribute(a,F),d.fromBufferAttribute(o,p),m.fromBufferAttribute(o,P),y.fromBufferAttribute(o,F),u.sub(c),h.sub(c),m.sub(d),y.sub(d);let H=1/(m.x*y.y-y.x*m.y);isFinite(H)&&(b.copy(u).multiplyScalar(y.y).addScaledVector(h,-m.y).multiplyScalar(H),v.copy(h).multiplyScalar(m.x).addScaledVector(u,-y.x).multiplyScalar(H),l[p].add(b),l[P].add(b),l[F].add(b),s[p].add(v),s[P].add(v),s[F].add(v))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let p=0,P=w.length;p<P;++p){let F=w[p],H=F.start,W=F.count;for(let V=H,N=H+W;V<N;V+=3)x(e.getX(V+0),e.getX(V+1),e.getX(V+2))}let S=new X,g=new X,L=new X,R=new X;function z(p){L.fromBufferAttribute(i,p),R.copy(L);let P=l[p];S.copy(P),S.sub(L.multiplyScalar(L.dot(P))).normalize(),g.crossVectors(R,P);let H=g.dot(s[p])<0?-1:1;r.setXYZW(p,S.x,S.y,S.z,H)}for(let p=0,P=w.length;p<P;++p){let F=w[p],H=F.start,W=F.count;for(let V=H,N=H+W;V<N;V+=3)z(e.getX(V+0)),z(e.getX(V+1)),z(e.getX(V+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let a=this.getAttribute("normal");if(a===void 0||a.count!==t.count)a=new Ft(new Float32Array(t.count*3),3),this.setAttribute("normal",a);else for(let d=0,m=a.count;d<m;d++)a.setXYZ(d,0,0,0);let i=new X,o=new X,r=new X,l=new X,s=new X,c=new X,u=new X,h=new X;if(e)for(let d=0,m=e.count;d<m;d+=3){let y=e.getX(d+0),b=e.getX(d+1),v=e.getX(d+2);i.fromBufferAttribute(t,y),o.fromBufferAttribute(t,b),r.fromBufferAttribute(t,v),u.subVectors(r,o),h.subVectors(i,o),u.cross(h),l.fromBufferAttribute(a,y),s.fromBufferAttribute(a,b),c.fromBufferAttribute(a,v),l.add(u),s.add(u),c.add(u),a.setXYZ(y,l.x,l.y,l.z),a.setXYZ(b,s.x,s.y,s.z),a.setXYZ(v,c.x,c.y,c.z)}else for(let d=0,m=t.count;d<m;d+=3)i.fromBufferAttribute(t,d+0),o.fromBufferAttribute(t,d+1),r.fromBufferAttribute(t,d+2),u.subVectors(r,o),h.subVectors(i,o),u.cross(h),a.setXYZ(d+0,u.x,u.y,u.z),a.setXYZ(d+1,u.x,u.y,u.z),a.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),a.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,a=e.count;t<a;t++)Dn.fromBufferAttribute(e,t),Dn.normalize(),e.setXYZ(t,Dn.x,Dn.y,Dn.z)}toNonIndexed(){function e(l,s){let c=l.array,u=l.itemSize,h=l.normalized,d=new c.constructor(s.length*u),m=0,y=0;for(let b=0,v=s.length;b<v;b++){l.isInterleavedBufferAttribute?m=s[b]*l.data.stride+l.offset:m=s[b]*u;for(let x=0;x<u;x++)d[y++]=c[m++]}return new Ft(d,u,h)}if(this.index===null)return xt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,a=this.index.array,i=this.attributes;for(let l in i){let s=i[l],c=e(s,a);t.setAttribute(l,c)}let o=this.morphAttributes;for(let l in o){let s=[],c=o[l];for(let u=0,h=c.length;u<h;u++){let d=c[u],m=e(d,a);s.push(m)}t.morphAttributes[l]=s}t.morphTargetsRelative=this.morphTargetsRelative;let r=this.groups;for(let l=0,s=r.length;l<s;l++){let c=r[l];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let s=this.parameters;for(let c in s)s[c]!==void 0&&(e[c]=s[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let a=this.attributes;for(let s in a){let c=a[s];e.data.attributes[s]=c.toJSON(e.data)}let i={},o=!1;for(let s in this.morphAttributes){let c=this.morphAttributes[s],u=[];for(let h=0,d=c.length;h<d;h++){let m=c[h];u.push(m.toJSON(e.data))}u.length>0&&(i[s]=u,o=!0)}o&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);let r=this.groups;r.length>0&&(e.data.groups=JSON.parse(JSON.stringify(r)));let l=this.boundingSphere;return l!==null&&(e.data.boundingSphere=l.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let a=e.index;a!==null&&this.setIndex(a.clone());let i=e.attributes;for(let c in i){let u=i[c];this.setAttribute(c,u.clone(t))}let o=e.morphAttributes;for(let c in o){let u=[],h=o[c];for(let d=0,m=h.length;d<m;d++)u.push(h[d].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;let r=e.groups;for(let c=0,u=r.length;c<u;c++){let h=r[c];this.addGroup(h.start,h.count,h.materialIndex)}let l=e.boundingBox;l!==null&&(this.boundingBox=l.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Uu=new X,Fg=new X,Bg=new Mt,za=class{constructor(e=new X(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,a,i){return this.normal.set(e,t,a),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,a){let i=Uu.subVectors(a,t).cross(Fg.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,a=!0){let i=e.delta(Uu),o=this.normal.dot(i);if(o===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/o;return a===!0&&(r<0||r>1)?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),a=this.distanceToPoint(e.end);return t<0&&a>0||a<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let a=t||Bg.getNormalMatrix(e),i=this.coplanarPoint(Uu).applyMatrix4(e),o=this.normal.applyMatrix3(a).normalize();return this.constant=-i.dot(o),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Hg=0,Va=class extends Oa{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Hg++}),this.uuid=ir(),this.name="",this.type="Material",this.blending=Fi,this.side=Wa,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=od,this.blendDst=rd,this.blendEquation=po,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new at(0,0,0),this.blendAlpha=0,this.depthFunc=ko,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=y0,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=dl,this.stencilZFail=dl,this.stencilZPass=dl,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let a=e[t];if(a===void 0){xt(`Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){xt(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(a):i&&i.isVector2&&a&&a.isVector2||i&&i.isEuler&&a&&a.isEuler||i&&i.isVector3&&a&&a.isVector3?i.copy(a):this[t]=a}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let a={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};a.uuid=this.uuid,a.type=this.type,a.blending=this.blending,a.side=this.side,a.shadowSide=this.shadowSide,a.vertexColors=this.vertexColors,a.opacity=this.opacity,a.transparent=this.transparent,a.blendSrc=this.blendSrc,a.blendDst=this.blendDst,a.blendEquation=this.blendEquation,a.blendSrcAlpha=this.blendSrcAlpha,a.blendDstAlpha=this.blendDstAlpha,a.blendEquationAlpha=this.blendEquationAlpha,a.blendColor=this.blendColor.getHex(),a.blendAlpha=this.blendAlpha,a.depthFunc=this.depthFunc,a.depthTest=this.depthTest,a.depthWrite=this.depthWrite,a.colorWrite=this.colorWrite,a.clipIntersection=this.clipIntersection,a.clipShadows=this.clipShadows,a.stencilWriteMask=this.stencilWriteMask,a.stencilFunc=this.stencilFunc,a.stencilRef=this.stencilRef,a.stencilFuncMask=this.stencilFuncMask,a.stencilFail=this.stencilFail,a.stencilZFail=this.stencilZFail,a.stencilZPass=this.stencilZPass,a.stencilWrite=this.stencilWrite,a.polygonOffset=this.polygonOffset,a.polygonOffsetFactor=this.polygonOffsetFactor,a.polygonOffsetUnits=this.polygonOffsetUnits,a.dithering=this.dithering,a.alphaTest=this.alphaTest,a.alphaHash=this.alphaHash,a.alphaToCoverage=this.alphaToCoverage,a.premultipliedAlpha=this.premultipliedAlpha,a.forceSinglePass=this.forceSinglePass,a.allowOverride=this.allowOverride,a.visible=this.visible,a.toneMapped=this.toneMapped,a.name=this.name,this.color&&this.color.isColor&&(a.color=this.color.getHex()),this.roughness!==void 0&&(a.roughness=this.roughness),this.metalness!==void 0&&(a.metalness=this.metalness),this.sheen!==void 0&&(a.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(a.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(a.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(a.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(a.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(a.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(a.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(a.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(a.shininess=this.shininess),this.clearcoat!==void 0&&(a.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(a.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(a.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(a.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(a.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,a.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(a.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(a.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(a.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(a.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(a.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(a.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(a.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(a.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(a.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(a.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(a.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(a.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(a.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(a.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(a.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(a.lightMap=this.lightMap.toJSON(e).uuid,a.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(a.aoMap=this.aoMap.toJSON(e).uuid,a.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(a.bumpMap=this.bumpMap.toJSON(e).uuid,a.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(a.normalMap=this.normalMap.toJSON(e).uuid,a.normalMapType=this.normalMapType,a.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(a.displacementMap=this.displacementMap.toJSON(e).uuid,a.displacementScale=this.displacementScale,a.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(a.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(a.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(a.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(a.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(a.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(a.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(a.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(a.combine=this.combine)),this.envMapRotation!==void 0&&(a.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(a.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(a.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(a.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(a.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(a.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(a.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(a.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(a.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(a.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(a.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(a.size=this.size),this.sizeAttenuation!==void 0&&(a.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(a.clippingPlanes=this.clippingPlanes.map(o=>o.toJSON())),this.rotation!==void 0&&(a.rotation=this.rotation),this.depthPacking!==void 0&&(a.depthPacking=this.depthPacking),this.linewidth!==void 0&&(a.linewidth=this.linewidth),this.linecap!==void 0&&(a.linecap=this.linecap),this.linejoin!==void 0&&(a.linejoin=this.linejoin),this.dashSize!==void 0&&(a.dashSize=this.dashSize),this.gapSize!==void 0&&(a.gapSize=this.gapSize),this.scale!==void 0&&(a.scale=this.scale),this.wireframe!==void 0&&(a.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(a.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(a.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(a.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(a.flatShading=this.flatShading),this.fog!==void 0&&(a.fog=this.fog),Object.keys(this.userData).length>0&&(a.userData=this.userData);function i(o){let r=[];for(let l in o){let s=o[l];delete s.metadata,r.push(s)}return r}if(t){let o=i(e.textures),r=i(e.images);o.length>0&&(a.textures=o),r.length>0&&(a.images=r)}return a}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new at().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(a=>new za().fromJSON(a))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let a=e.normalScale;Array.isArray(a)===!1&&(a=[a,a]),this.normalScale=new nt().fromArray(a)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new nt().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,a=null;if(t!==null){let i=t.length;a=new Array(i);for(let o=0;o!==i;++o)a[o]=t[o].clone()}return this.clippingPlanes=a,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var ai=new X,Fu=new X,Xs=new X,Ys=new X,so=class{constructor(e=new X,t=new X(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ai)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let a=t.dot(this.direction);return a<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,a)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ai.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ai.copy(this.origin).addScaledVector(this.direction,t),ai.distanceToSquared(e))}distanceSqToSegment(e,t,a,i){Fu.copy(e).add(t).multiplyScalar(.5),Xs.copy(t).sub(e).normalize(),Ys.copy(this.origin).sub(Fu);let o=e.distanceTo(t)*.5,r=-this.direction.dot(Xs),l=Ys.dot(this.direction),s=-Ys.dot(Xs),c=Ys.lengthSq(),u=Math.abs(1-r*r),h,d,m,y;if(u>0)if(h=r*s-l,d=r*l-s,y=o*u,h>=0)if(d>=-y)if(d<=y){let b=1/u;h*=b,d*=b,m=h*(h+r*d+2*l)+d*(r*h+d+2*s)+c}else d=o,h=Math.max(0,-(r*d+l)),m=-h*h+d*(d+2*s)+c;else d=-o,h=Math.max(0,-(r*d+l)),m=-h*h+d*(d+2*s)+c;else d<=-y?(h=Math.max(0,-(-r*o+l)),d=h>0?-o:Math.min(Math.max(-o,-s),o),m=-h*h+d*(d+2*s)+c):d<=y?(h=0,d=Math.min(Math.max(-o,-s),o),m=d*(d+2*s)+c):(h=Math.max(0,-(r*o+l)),d=h>0?o:Math.min(Math.max(-o,-s),o),m=-h*h+d*(d+2*s)+c);else d=r>0?-o:o,h=Math.max(0,-(r*d+l)),m=-h*h+d*(d+2*s)+c;return a&&a.copy(this.origin).addScaledVector(this.direction,h),i&&i.copy(Fu).addScaledVector(Xs,d),m}intersectSphere(e,t){if(e.radius<0)return null;ai.subVectors(e.center,this.origin);let a=ai.dot(this.direction),i=ai.dot(ai)-a*a,o=e.radius*e.radius;if(i>o)return null;let r=Math.sqrt(o-i),l=a-r,s=a+r;return s<0?null:l<0?this.at(s,t):this.at(l,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let a=-(this.origin.dot(e.normal)+e.constant)/t;return a>=0?a:null}intersectPlane(e,t){let a=this.distanceToPlane(e);return a===null?null:this.at(a,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let a,i,o,r,l,s,c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(a=(e.min.x-d.x)*c,i=(e.max.x-d.x)*c):(a=(e.max.x-d.x)*c,i=(e.min.x-d.x)*c),u>=0?(o=(e.min.y-d.y)*u,r=(e.max.y-d.y)*u):(o=(e.max.y-d.y)*u,r=(e.min.y-d.y)*u),a>r||o>i||((o>a||isNaN(a))&&(a=o),(r<i||isNaN(i))&&(i=r),h>=0?(l=(e.min.z-d.z)*h,s=(e.max.z-d.z)*h):(l=(e.max.z-d.z)*h,s=(e.min.z-d.z)*h),a>s||l>i)||((l>a||a!==a)&&(a=l),(s<i||i!==i)&&(i=s),i<0)?null:this.at(a>=0?a:i,t)}intersectsBox(e){return this.intersectBox(e,ai)!==null}intersectTriangle(e,t,a,i,o){let r=this.origin,l=this.direction,s=l.x,c=l.y,u=l.z,h=e.x-r.x,d=e.y-r.y,m=e.z-r.z,y=t.x-r.x,b=t.y-r.y,v=t.z-r.z,x=a.x-r.x,w=a.y-r.y,S=a.z-r.z,g=Math.abs(s),L=Math.abs(c),R=Math.abs(u),z,p,P,F,H,W,V,N,O,T,E,A;if(g>=L&&g>=R?(P=s,W=h,O=y,A=x,s>=0?(z=c,p=u,F=d,H=m,V=b,N=v,T=w,E=S):(z=u,p=c,F=m,H=d,V=v,N=b,T=S,E=w)):L>=R?(P=c,W=d,O=b,A=w,c>=0?(z=u,p=s,F=m,H=h,V=v,N=y,T=S,E=x):(z=s,p=u,F=h,H=m,V=y,N=v,T=x,E=S)):(P=u,W=m,O=v,A=S,u>=0?(z=s,p=c,F=h,H=d,V=y,N=b,T=x,E=w):(z=c,p=s,F=d,H=h,V=b,N=y,T=w,E=x)),P===0)return null;let f=z/P,M=p/P,_=1/P,C=F-f*W,D=H-M*W,B=V-f*O,k=N-M*O,Q=T-f*A,G=E-M*A,J=Q*k-G*B,he=C*G-D*Q,ve=B*D-k*C;if(i){if(J<0||he<0||ve<0)return null}else if((J<0||he<0||ve<0)&&(J>0||he>0||ve>0))return null;let ye=J+he+ve;if(ye===0)return null;let Z=_*(J*W+he*O+ve*A);return(ye>0?Z<0:Z>0)?null:this.at(Z/ye,o)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Xt=class extends Va{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new at(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new da,this.combine=Jl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Sf=new At,no=new so,$s=new ya,Tf=new X,Zs=new X,Js=new X,Ks=new X,Bu=new X,Qs=new X,wf=new X,el=new X,xe=class extends ln{constructor(e=new lt,t=new Xt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,a=Object.keys(t);if(a.length>0){let i=t[a[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,r=i.length;o<r;o++){let l=i[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[l]=o}}}}getVertexPosition(e,t){let a=this.geometry,i=a.attributes.position,o=a.morphAttributes.position,r=a.morphTargetsRelative;t.fromBufferAttribute(i,e);let l=this.morphTargetInfluences;if(o&&l){Qs.set(0,0,0);for(let s=0,c=o.length;s<c;s++){let u=l[s],h=o[s];u!==0&&(Bu.fromBufferAttribute(h,e),r?Qs.addScaledVector(Bu,u):Qs.addScaledVector(Bu.sub(t),u))}t.add(Qs)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let a=this.geometry,i=this.material,o=this.matrixWorld;i!==void 0&&(a.boundingSphere===null&&a.computeBoundingSphere(),$s.copy(a.boundingSphere),$s.applyMatrix4(o),no.copy(e.ray).recast(e.near),!($s.containsPoint(no.origin)===!1&&(no.intersectSphere($s,Tf)===null||no.origin.distanceToSquared(Tf)>(e.far-e.near)**2))&&(Sf.copy(o).invert(),no.copy(e.ray).applyMatrix4(Sf),!(a.boundingBox!==null&&no.intersectsBox(a.boundingBox)===!1)&&this._computeIntersections(e,t,no)))}_computeIntersections(e,t,a){let i,o=this.geometry,r=this.material,l=o.index,s=o.attributes.position,c=o.attributes.uv,u=o.attributes.uv1,h=o.attributes.normal,d=o.groups,m=o.drawRange;if(l!==null)if(Array.isArray(r))for(let y=0,b=d.length;y<b;y++){let v=d[y],x=r[v.materialIndex],w=Math.max(v.start,m.start),S=Math.min(l.count,Math.min(v.start+v.count,m.start+m.count));for(let g=w,L=S;g<L;g+=3){let R=l.getX(g),z=l.getX(g+1),p=l.getX(g+2);i=tl(this,x,e,a,c,u,h,R,z,p),i&&(i.faceIndex=Math.floor(g/3),i.face.materialIndex=v.materialIndex,t.push(i))}}else{let y=Math.max(0,m.start),b=Math.min(l.count,m.start+m.count);for(let v=y,x=b;v<x;v+=3){let w=l.getX(v),S=l.getX(v+1),g=l.getX(v+2);i=tl(this,r,e,a,c,u,h,w,S,g),i&&(i.faceIndex=Math.floor(v/3),t.push(i))}}else if(s!==void 0)if(Array.isArray(r))for(let y=0,b=d.length;y<b;y++){let v=d[y],x=r[v.materialIndex],w=Math.max(v.start,m.start),S=Math.min(s.count,Math.min(v.start+v.count,m.start+m.count));for(let g=w,L=S;g<L;g+=3){let R=g,z=g+1,p=g+2;i=tl(this,x,e,a,c,u,h,R,z,p),i&&(i.faceIndex=Math.floor(g/3),i.face.materialIndex=v.materialIndex,t.push(i))}}else{let y=Math.max(0,m.start),b=Math.min(s.count,m.start+m.count);for(let v=y,x=b;v<x;v+=3){let w=v,S=v+1,g=v+2;i=tl(this,r,e,a,c,u,h,w,S,g),i&&(i.faceIndex=Math.floor(v/3),t.push(i))}}}};function Og(n,e,t,a,i,o,r,l){let s;if(e.side===Hn?s=a.intersectTriangle(r,o,i,!0,l):s=a.intersectTriangle(i,o,r,e.side===Wa,l),s===null)return null;el.copy(l),el.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(el);return c<t.near||c>t.far?null:{distance:c,point:el.clone(),object:n}}function tl(n,e,t,a,i,o,r,l,s,c){n.getVertexPosition(l,Zs),n.getVertexPosition(s,Js),n.getVertexPosition(c,Ks);let u=Og(n,e,t,a,Zs,Js,Ks,wf);if(u){let h=new X;Ci.getBarycoord(wf,Zs,Js,Ks,h),i&&(u.uv=Ci.getInterpolatedAttribute(i,l,s,c,h,new nt)),o&&(u.uv1=Ci.getInterpolatedAttribute(o,l,s,c,h,new nt)),r&&(u.normal=Ci.getInterpolatedAttribute(r,l,s,c,h,new X),u.normal.dot(a.direction)>0&&u.normal.multiplyScalar(-1));let d={a:l,b:s,c,normal:new X,materialIndex:0};Ci.getNormal(Zs,Js,Ks,d.normal),u.face=d,u.barycoord=h}return u}var ri=class extends jn{constructor(e=null,t=1,a=1,i,o,r,l,s,c=Un,u=Un,h,d){super(null,r,l,s,c,u,i,o,h,d),this.isDataTexture=!0,this.image={data:e,width:t,height:a},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var zi=class extends Ft{constructor(e,t,a,i=1){super(e,t,a),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Uo=new At,Af=new At,nl=[],Rf=new Ga,Gg=new At,Sr=new xe,Tr=new ya,lo=class extends xe{constructor(e,t,a){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new zi(new Float32Array(a*16),16),this.instanceColor=null,this.morphTexture=null,this.count=a,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<a;i++)this.setMatrixAt(i,Gg)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ga),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let a=0;a<t;a++)this.getMatrixAt(a,Uo),Rf.copy(e.boundingBox).applyMatrix4(Uo),this.boundingBox.union(Rf)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new ya),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let a=0;a<t;a++)this.getMatrixAt(a,Uo),Tr.copy(e.boundingSphere).applyMatrix4(Uo),this.boundingSphere.union(Tr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let a=t.morphTargetInfluences,i=this.morphTexture.source.data.data,o=a.length+1,r=e*o+1;for(let l=0;l<a.length;l++)a[l]=i[r+l]}raycast(e,t){let a=this.matrixWorld,i=this.count;if(Sr.geometry=this.geometry,Sr.material=this.material,Sr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Tr.copy(this.boundingSphere),Tr.applyMatrix4(a),e.ray.intersectsSphere(Tr)!==!1))for(let o=0;o<i;o++){this.getMatrixAt(o,Uo),Af.multiplyMatrices(a,Uo),Sr.matrixWorld=Af,Sr.raycast(e,nl);for(let r=0,l=nl.length;r<l;r++){let s=nl[r];s.instanceId=o,s.object=this,t.push(s)}nl.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new zi(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let a=t.morphTargetInfluences,i=a.length+1;this.morphTexture===null&&(this.morphTexture=new ri(new Float32Array(i*this.count),i,this.count,ar,_a));let o=this.morphTexture.source.data.data,r=0;for(let c=0;c<a.length;c++)r+=a[c];let l=this.geometry.morphTargetsRelative?1:1-r,s=i*e;return o[s]=l,o.set(a,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},ao=new ya,Vg=new nt(.5,.5),al=new X,Zo=class{constructor(e=new za,t=new za,a=new za,i=new za,o=new za,r=new za){this.planes=[e,t,a,i,o,r]}set(e,t,a,i,o,r){let l=this.planes;return l[0].copy(e),l[1].copy(t),l[2].copy(a),l[3].copy(i),l[4].copy(o),l[5].copy(r),this}copy(e){let t=this.planes;for(let a=0;a<6;a++)t[a].copy(e.planes[a]);return this}setFromProjectionMatrix(e,t=Pa,a=!1){let i=this.planes,o=e.elements,r=o[0],l=o[1],s=o[2],c=o[3],u=o[4],h=o[5],d=o[6],m=o[7],y=o[8],b=o[9],v=o[10],x=o[11],w=o[12],S=o[13],g=o[14],L=o[15];if(i[0].setComponents(c-r,m-u,x-y,L-w).normalize(),i[1].setComponents(c+r,m+u,x+y,L+w).normalize(),i[2].setComponents(c+l,m+h,x+b,L+S).normalize(),i[3].setComponents(c-l,m-h,x-b,L-S).normalize(),a)i[4].setComponents(s,d,v,g).normalize(),i[5].setComponents(c-s,m-d,x-v,L-g).normalize();else if(i[4].setComponents(c-s,m-d,x-v,L-g).normalize(),t===Pa)i[5].setComponents(c+s,m+d,x+v,L+g).normalize();else if(t===qo)i[5].setComponents(s,d,v,g).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ao.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ao.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ao)}intersectsSprite(e){ao.center.set(0,0,0);let t=Vg.distanceTo(e.center);return ao.radius=.7071067811865476+t,ao.applyMatrix4(e.matrixWorld),this.intersectsSphere(ao)}intersectsSphere(e){let t=this.planes,a=e.center,i=-e.radius;for(let o=0;o<6;o++)if(t[o].distanceToPoint(a)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let a=0;a<6;a++){let i=t[a];if(al.x=i.normal.x>0?e.max.x:e.min.x,al.y=i.normal.y>0?e.max.y:e.min.y,al.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(al)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let a=0;a<6;a++)if(t[a].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ka=class extends Va{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new at(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},wl=new X,Al=new X,Cf=new At,wr=new so,il=new ya,Hu=new X,zf=new X,Jo=class extends ln{constructor(e=new lt,t=new ka){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,a=[0];for(let i=1,o=t.count;i<o;i++)wl.fromBufferAttribute(t,i-1),Al.fromBufferAttribute(t,i),a[i]=a[i-1],a[i]+=wl.distanceTo(Al);e.setAttribute("lineDistance",new Ze(a,1))}else xt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let a=this.geometry,i=this.matrixWorld,o=e.params.Line.threshold,r=a.drawRange;if(a.boundingSphere===null&&a.computeBoundingSphere(),il.copy(a.boundingSphere),il.applyMatrix4(i),il.radius+=o,e.ray.intersectsSphere(il)===!1)return;Cf.copy(i).invert(),wr.copy(e.ray).applyMatrix4(Cf);let l=o/((this.scale.x+this.scale.y+this.scale.z)/3),s=l*l,c=this.isLineSegments?2:1,u=a.index,d=a.attributes.position;if(u!==null){let m=Math.max(0,r.start),y=Math.min(u.count,r.start+r.count);for(let b=m,v=y-1;b<v;b+=c){let x=u.getX(b),w=u.getX(b+1),S=ol(this,e,wr,s,x,w,b);S&&t.push(S)}if(this.isLineLoop){let b=u.getX(y-1),v=u.getX(m),x=ol(this,e,wr,s,b,v,y-1);x&&t.push(x)}}else{let m=Math.max(0,r.start),y=Math.min(d.count,r.start+r.count);for(let b=m,v=y-1;b<v;b+=c){let x=ol(this,e,wr,s,b,b+1,b);x&&t.push(x)}if(this.isLineLoop){let b=ol(this,e,wr,s,y-1,m,y-1);b&&t.push(b)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,a=Object.keys(t);if(a.length>0){let i=t[a[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,r=i.length;o<r;o++){let l=i[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[l]=o}}}}};function ol(n,e,t,a,i,o,r){let l=n.geometry.attributes.position;if(wl.fromBufferAttribute(l,i),Al.fromBufferAttribute(l,o),t.distanceSqToSegment(wl,Al,Hu,zf)>a)return;Hu.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(Hu);if(!(c<e.near||c>e.far))return{distance:c,point:zf.clone().applyMatrix4(n.matrixWorld),index:r,face:null,faceIndex:null,barycoord:null,object:n}}var Pf=new X,If=new X,co=class extends Jo{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,a=[];for(let i=0,o=t.count;i<o;i+=2)Pf.fromBufferAttribute(t,i),If.fromBufferAttribute(t,i+1),a[i]=i===0?0:a[i-1],a[i+1]=a[i]+Pf.distanceTo(If);e.setAttribute("lineDistance",new Ze(a,1))}else xt("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var ba=class extends Va{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new at(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Lf=new At,$u=new so,rl=new ya,sl=new X,Bn=class extends ln{constructor(e=new lt,t=new ba){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let a=this.geometry,i=this.matrixWorld,o=e.params.Points.threshold,r=a.drawRange;if(a.boundingSphere===null&&a.computeBoundingSphere(),rl.copy(a.boundingSphere),rl.applyMatrix4(i),rl.radius+=o,e.ray.intersectsSphere(rl)===!1)return;Lf.copy(i).invert(),$u.copy(e.ray).applyMatrix4(Lf);let l=o/((this.scale.x+this.scale.y+this.scale.z)/3),s=l*l,c=a.index,h=a.attributes.position;if(c!==null){let d=Math.max(0,r.start),m=Math.min(c.count,r.start+r.count);for(let y=d,b=m;y<b;y++){let v=c.getX(y);sl.fromBufferAttribute(h,v),Df(sl,v,s,i,e,t,this)}}else{let d=Math.max(0,r.start),m=Math.min(h.count,r.start+r.count);for(let y=d,b=m;y<b;y++)sl.fromBufferAttribute(h,y),Df(sl,y,s,i,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,a=Object.keys(t);if(a.length>0){let i=t[a[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,r=i.length;o<r;o++){let l=i[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[l]=o}}}}};function Df(n,e,t,a,i,o,r){let l=$u.distanceSqToPoint(n);if(l<t){let s=new X;$u.closestPointToPoint(n,s),s.applyMatrix4(a);let c=i.ray.origin.distanceTo(s);if(c<i.near||c>i.far)return;o.push({distance:c,distanceToRay:Math.sqrt(l),point:s,index:e,face:null,faceIndex:null,barycoord:null,object:r})}}var Hr=class extends jn{constructor(e=[],t=Bi,a,i,o,r,l,s,c,u){super(e,t,a,i,o,r,l,s,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Pi=class extends jn{constructor(e,t,a,i,o,r,l,s,c){super(e,t,a,i,o,r,l,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Ii=class extends jn{constructor(e,t,a=Da,i,o,r,l=Un,s=Un,c,u=Ha,h=1){if(u!==Ha&&u!==Oi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:h};super(d,i,o,r,l,s,u,a,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Xo(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Rl=class extends Ii{constructor(e,t=Da,a=Bi,i,o,r=Un,l=Un,s,c=Ha){let u={width:e,height:e,depth:1},h=[u,u,u,u,u,u];super(e,e,t,a,i,o,r,l,s,c),this.image=h,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Or=class extends jn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Se=class n extends lt{constructor(e=1,t=1,a=1,i=1,o=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:a,widthSegments:i,heightSegments:o,depthSegments:r};let l=this;i=Math.floor(i),o=Math.floor(o),r=Math.floor(r);let s=[],c=[],u=[],h=[],d=0,m=0;y("z","y","x",-1,-1,a,t,e,r,o,0),y("z","y","x",1,-1,a,t,-e,r,o,1),y("x","z","y",1,1,e,a,t,i,r,2),y("x","z","y",1,-1,e,a,-t,i,r,3),y("x","y","z",1,-1,e,t,a,i,o,4),y("x","y","z",-1,-1,e,t,-a,i,o,5),this.setIndex(s),this.setAttribute("position",new Ze(c,3)),this.setAttribute("normal",new Ze(u,3)),this.setAttribute("uv",new Ze(h,2));function y(b,v,x,w,S,g,L,R,z,p,P){let F=g/z,H=L/p,W=g/2,V=L/2,N=R/2,O=z+1,T=p+1,E=0,A=0,f=new X;for(let M=0;M<T;M++){let _=M*H-V;for(let C=0;C<O;C++){let D=C*F-W;f[b]=D*w,f[v]=_*S,f[x]=N,c.push(f.x,f.y,f.z),f[b]=0,f[v]=0,f[x]=R>0?1:-1,u.push(f.x,f.y,f.z),h.push(C/z),h.push(1-M/p),E+=1}}for(let M=0;M<p;M++)for(let _=0;_<z;_++){let C=d+_+O*M,D=d+_+O*(M+1),B=d+(_+1)+O*(M+1),k=d+(_+1)+O*M;s.push(C,D,k),s.push(D,B,k),A+=6}l.addGroup(m,A,P),m+=A,d+=E}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var Xn=class n extends lt{constructor(e=1,t=32,a=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:a,thetaLength:i},t=Math.max(3,t);let o=[],r=[],l=[],s=[],c=new X,u=new nt;r.push(0,0,0),l.push(0,0,1),s.push(.5,.5);for(let h=0,d=3;h<=t;h++,d+=3){let m=a+h/t*i;c.x=e*Math.cos(m),c.y=e*Math.sin(m),r.push(c.x,c.y,c.z),l.push(0,0,1),u.x=(r[d]/e+1)/2,u.y=(r[d+1]/e+1)/2,s.push(u.x,u.y)}for(let h=1;h<=t;h++)o.push(h,h+1,0);this.setIndex(o),this.setAttribute("position",new Ze(r,3)),this.setAttribute("normal",new Ze(l,3)),this.setAttribute("uv",new Ze(s,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Le=class n extends lt{constructor(e=1,t=1,a=1,i=32,o=1,r=!1,l=0,s=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:a,radialSegments:i,heightSegments:o,openEnded:r,thetaStart:l,thetaLength:s};let c=this;i=Math.floor(i),o=Math.floor(o);let u=[],h=[],d=[],m=[],y=0,b=[],v=a/2,x=0;w(),r===!1&&(e>0&&S(!0),t>0&&S(!1)),this.setIndex(u),this.setAttribute("position",new Ze(h,3)),this.setAttribute("normal",new Ze(d,3)),this.setAttribute("uv",new Ze(m,2));function w(){let g=new X,L=new X,R=0,z=(t-e)/a;for(let p=0;p<=o;p++){let P=[],F=p/o,H=F*(t-e)+e;for(let W=0;W<=i;W++){let V=W/i,N=V*s+l,O=Math.sin(N),T=Math.cos(N);L.x=H*O,L.y=-F*a+v,L.z=H*T,h.push(L.x,L.y,L.z),g.set(O,z,T).normalize(),d.push(g.x,g.y,g.z),m.push(V,1-F),P.push(y++)}b.push(P)}for(let p=0;p<i;p++)for(let P=0;P<o;P++){let F=b[P][p],H=b[P+1][p],W=b[P+1][p+1],V=b[P][p+1];(e>0||P!==0)&&(u.push(F,H,V),R+=3),(t>0||P!==o-1)&&(u.push(H,W,V),R+=3)}c.addGroup(x,R,0),x+=R}function S(g){let L=y,R=new nt,z=new X,p=0,P=g===!0?e:t,F=g===!0?1:-1;for(let W=1;W<=i;W++)h.push(0,v*F,0),d.push(0,F,0),m.push(.5,.5),y++;let H=y;for(let W=0;W<=i;W++){let N=W/i*s+l,O=Math.cos(N),T=Math.sin(N);z.x=P*T,z.y=v*F,z.z=P*O,h.push(z.x,z.y,z.z),d.push(0,F,0),R.x=O*.5+.5,R.y=T*.5*F+.5,m.push(R.x,R.y),y++}for(let W=0;W<i;W++){let V=L+W,N=H+W;g===!0?u.push(N,N+1,V):u.push(N+1,N,V),p+=3}c.addGroup(x,p,g===!0?1:2),x+=p}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},hn=class n extends Le{constructor(e=1,t=1,a=32,i=1,o=!1,r=0,l=Math.PI*2){super(0,e,t,a,i,o,r,l),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:a,heightSegments:i,openEnded:o,thetaStart:r,thetaLength:l}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Gr=class n extends lt{constructor(e=[],t=[],a=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:a,detail:i};let o=[],r=[];l(i),c(a),u(),this.setAttribute("position",new Ze(o,3)),this.setAttribute("normal",new Ze(o.slice(),3)),this.setAttribute("uv",new Ze(r,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function l(w){let S=new X,g=new X,L=new X;for(let R=0;R<t.length;R+=3)m(t[R+0],S),m(t[R+1],g),m(t[R+2],L),s(S,g,L,w)}function s(w,S,g,L){let R=L+1,z=[];for(let p=0;p<=R;p++){z[p]=[];let P=w.clone().lerp(g,p/R),F=S.clone().lerp(g,p/R),H=R-p;for(let W=0;W<=H;W++)W===0&&p===R?z[p][W]=P:z[p][W]=P.clone().lerp(F,W/H)}for(let p=0;p<R;p++)for(let P=0;P<2*(R-p)-1;P++){let F=Math.floor(P/2);P%2===0?(d(z[p][F+1]),d(z[p+1][F]),d(z[p][F])):(d(z[p][F+1]),d(z[p+1][F+1]),d(z[p+1][F]))}}function c(w){let S=new X;for(let g=0;g<o.length;g+=3)S.x=o[g+0],S.y=o[g+1],S.z=o[g+2],S.normalize().multiplyScalar(w),o[g+0]=S.x,o[g+1]=S.y,o[g+2]=S.z}function u(){let w=new X;for(let S=0;S<o.length;S+=3){w.x=o[S+0],w.y=o[S+1],w.z=o[S+2];let g=v(w)/2/Math.PI+.5,L=x(w)/Math.PI+.5;r.push(g,1-L)}y(),h()}function h(){for(let w=0;w<r.length;w+=6){let S=r[w+0],g=r[w+2],L=r[w+4],R=Math.max(S,g,L),z=Math.min(S,g,L);R>.9&&z<.1&&(S<.2&&(r[w+0]+=1),g<.2&&(r[w+2]+=1),L<.2&&(r[w+4]+=1))}}function d(w){o.push(w.x,w.y,w.z)}function m(w,S){let g=w*3;S.x=e[g+0],S.y=e[g+1],S.z=e[g+2]}function y(){let w=new X,S=new X,g=new X,L=new X,R=new nt,z=new nt,p=new nt;for(let P=0,F=0;P<o.length;P+=9,F+=6){w.set(o[P+0],o[P+1],o[P+2]),S.set(o[P+3],o[P+4],o[P+5]),g.set(o[P+6],o[P+7],o[P+8]),R.set(r[F+0],r[F+1]),z.set(r[F+2],r[F+3]),p.set(r[F+4],r[F+5]),L.copy(w).add(S).add(g).divideScalar(3);let H=v(L);b(R,F+0,w,H),b(z,F+2,S,H),b(p,F+4,g,H)}}function b(w,S,g,L){L<0&&w.x===1&&(r[S]=w.x-1),g.x===0&&g.z===0&&(r[S]=L/2/Math.PI+.5)}function v(w){return Math.atan2(w.z,-w.x)}function x(w){return Math.atan2(-w.y,Math.sqrt(w.x*w.x+w.z*w.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.detail)}};var Ma=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){xt("Curve: .getPoint() not implemented.")}getPointAt(e,t){let a=this.getUtoTmapping(e);return this.getPoint(a,t)}getPoints(e=5){let t=[];for(let a=0;a<=e;a++)t.push(this.getPoint(a/e));return t}getSpacedPoints(e=5){let t=[];for(let a=0;a<=e;a++)t.push(this.getPointAt(a/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],a,i=this.getPoint(0),o=0;t.push(0);for(let r=1;r<=e;r++)a=this.getPoint(r/e),o+=a.distanceTo(i),t.push(o),i=a;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let a=this.getLengths(),i=0,o=a.length,r;t?r=t:r=e*a[o-1];let l=0,s=o-1,c;for(;l<=s;)if(i=Math.floor(l+(s-l)/2),c=a[i]-r,c<0)l=i+1;else if(c>0)s=i-1;else{s=i;break}if(i=s,a[i]===r)return i/(o-1);let u=a[i],d=a[i+1]-u,m=(r-u)/d;return(i+m)/(o-1)}getTangent(e,t){let i=e-1e-4,o=e+1e-4;i<0&&(i=0),o>1&&(o=1);let r=this.getPoint(i),l=this.getPoint(o),s=t||(r.isVector2?new nt:new X);return s.copy(l).sub(r).normalize(),s}getTangentAt(e,t){let a=this.getUtoTmapping(e);return this.getTangent(a,t)}computeFrenetFrames(e,t=!1){let a=new X,i=[],o=[],r=[],l=new X,s=new At;for(let m=0;m<=e;m++){let y=m/e;i[m]=this.getTangentAt(y,new X)}o[0]=new X,r[0]=new X;let c=Number.MAX_VALUE,u=Math.abs(i[0].x),h=Math.abs(i[0].y),d=Math.abs(i[0].z);u<=c&&(c=u,a.set(1,0,0)),h<=c&&(c=h,a.set(0,1,0)),d<=c&&a.set(0,0,1),l.crossVectors(i[0],a).normalize(),o[0].crossVectors(i[0],l),r[0].crossVectors(i[0],o[0]);for(let m=1;m<=e;m++){if(o[m]=o[m-1].clone(),r[m]=r[m-1].clone(),l.crossVectors(i[m-1],i[m]),l.length()>Number.EPSILON){l.normalize();let y=Math.acos(Ct(i[m-1].dot(i[m]),-1,1));o[m].applyMatrix4(s.makeRotationAxis(l,y))}r[m].crossVectors(i[m],o[m])}if(t===!0){let m=Math.acos(Ct(o[0].dot(o[e]),-1,1));m/=e,i[0].dot(l.crossVectors(o[0],o[e]))>0&&(m=-m);for(let y=1;y<=e;y++)o[y].applyMatrix4(s.makeRotationAxis(i[y],m*y)),r[y].crossVectors(i[y],o[y])}return{tangents:i,normals:o,binormals:r}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Vr=class extends Ma{constructor(e=0,t=0,a=1,i=1,o=0,r=Math.PI*2,l=!1,s=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=a,this.yRadius=i,this.aStartAngle=o,this.aEndAngle=r,this.aClockwise=l,this.aRotation=s}getPoint(e,t=new nt){let a=t,i=Math.PI*2,o=this.aEndAngle-this.aStartAngle,r=Math.abs(o)<Number.EPSILON;for(;o<0;)o+=i;for(;o>i;)o-=i;o<Number.EPSILON&&(r?o=0:o=i),this.aClockwise===!0&&!r&&(o===i?o=-i:o=o-i);let l=this.aStartAngle+e*o,s=this.aX+this.xRadius*Math.cos(l),c=this.aY+this.yRadius*Math.sin(l);if(this.aRotation!==0){let u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),d=s-this.aX,m=c-this.aY;s=d*u-m*h+this.aX,c=d*h+m*u+this.aY}return a.set(s,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Cl=class extends Vr{constructor(e,t,a,i,o,r){super(e,t,a,a,i,o,r),this.isArcCurve=!0,this.type="ArcCurve"}};function Ed(){let n=0,e=0,t=0,a=0;function i(o,r,l,s){n=o,e=l,t=-3*o+3*r-2*l-s,a=2*o-2*r+l+s}return{initCatmullRom:function(o,r,l,s,c){i(r,l,c*(l-o),c*(s-r))},initNonuniformCatmullRom:function(o,r,l,s,c,u,h){let d=(r-o)/c-(l-o)/(c+u)+(l-r)/u,m=(l-r)/u-(s-r)/(u+h)+(s-l)/h;d*=u,m*=u,i(r,l,d,m)},calc:function(o){let r=o*o,l=r*o;return n+e*o+t*r+a*l}}}var Nf=new X,Uf=new X,Ou=new Ed,Gu=new Ed,Vu=new Ed,qa=class extends Ma{constructor(e=[],t=!1,a="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=a,this.tension=i}getPoint(e,t=new X){let a=t,i=this.points,o=i.length,r=(o-(this.closed?0:1))*e,l=Math.floor(r),s=r-l;this.closed?l+=l>0?0:(Math.floor(Math.abs(l)/o)+1)*o:s===0&&l===o-1&&(l=o-2,s=1);let c,u;this.closed||l>0?c=i[(l-1)%o]:(Uf.subVectors(i[0],i[1]).add(i[0]),c=Uf);let h=i[l%o],d=i[(l+1)%o];if(this.closed||l+2<o?u=i[(l+2)%o]:(Nf.subVectors(i[o-1],i[o-2]).add(i[o-1]),u=Nf),this.curveType==="centripetal"||this.curveType==="chordal"){let m=this.curveType==="chordal"?.5:.25,y=Math.pow(c.distanceToSquared(h),m),b=Math.pow(h.distanceToSquared(d),m),v=Math.pow(d.distanceToSquared(u),m);b<1e-4&&(b=1),y<1e-4&&(y=b),v<1e-4&&(v=b),Ou.initNonuniformCatmullRom(c.x,h.x,d.x,u.x,y,b,v),Gu.initNonuniformCatmullRom(c.y,h.y,d.y,u.y,y,b,v),Vu.initNonuniformCatmullRom(c.z,h.z,d.z,u.z,y,b,v)}else this.curveType==="catmullrom"&&(Ou.initCatmullRom(c.x,h.x,d.x,u.x,this.tension),Gu.initCatmullRom(c.y,h.y,d.y,u.y,this.tension),Vu.initCatmullRom(c.z,h.z,d.z,u.z,this.tension));return a.set(Ou.calc(s),Gu.calc(s),Vu.calc(s)),a}copy(e){super.copy(e),this.points=[];for(let t=0,a=e.points.length;t<a;t++){let i=e.points[t];this.points.push(i.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,a=this.points.length;t<a;t++){let i=this.points[t];e.points.push(i.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,a=e.points.length;t<a;t++){let i=e.points[t];this.points.push(new X().fromArray(i))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Ff(n,e,t,a,i){let o=(a-e)*.5,r=(i-t)*.5,l=n*n,s=n*l;return(2*t-2*a+o+r)*s+(-3*t+3*a-2*o-r)*l+o*n+t}function kg(n,e){let t=1-n;return t*t*e}function qg(n,e){return 2*(1-n)*n*e}function Wg(n,e){return n*n*e}function Cr(n,e,t,a){return kg(n,e)+qg(n,t)+Wg(n,a)}function jg(n,e){let t=1-n;return t*t*t*e}function Xg(n,e){let t=1-n;return 3*t*t*n*e}function Yg(n,e){return 3*(1-n)*n*n*e}function $g(n,e){return n*n*n*e}function zr(n,e,t,a,i){return jg(n,e)+Xg(n,t)+Yg(n,a)+$g(n,i)}var zl=class extends Ma{constructor(e=new nt,t=new nt,a=new nt,i=new nt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=a,this.v3=i}getPoint(e,t=new nt){let a=t,i=this.v0,o=this.v1,r=this.v2,l=this.v3;return a.set(zr(e,i.x,o.x,r.x,l.x),zr(e,i.y,o.y,r.y,l.y)),a}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Pl=class extends Ma{constructor(e=new X,t=new X,a=new X,i=new X){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=a,this.v3=i}getPoint(e,t=new X){let a=t,i=this.v0,o=this.v1,r=this.v2,l=this.v3;return a.set(zr(e,i.x,o.x,r.x,l.x),zr(e,i.y,o.y,r.y,l.y),zr(e,i.z,o.z,r.z,l.z)),a}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Il=class extends Ma{constructor(e=new nt,t=new nt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new nt){let a=t;return e===1?a.copy(this.v2):(a.copy(this.v2).sub(this.v1),a.multiplyScalar(e).add(this.v1)),a}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new nt){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ll=class extends Ma{constructor(e=new X,t=new X){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new X){let a=t;return e===1?a.copy(this.v2):(a.copy(this.v2).sub(this.v1),a.multiplyScalar(e).add(this.v1)),a}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new X){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Dl=class extends Ma{constructor(e=new nt,t=new nt,a=new nt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=a}getPoint(e,t=new nt){let a=t,i=this.v0,o=this.v1,r=this.v2;return a.set(Cr(e,i.x,o.x,r.x),Cr(e,i.y,o.y,r.y)),a}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},kr=class extends Ma{constructor(e=new X,t=new X,a=new X){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=a}getPoint(e,t=new X){let a=t,i=this.v0,o=this.v1,r=this.v2;return a.set(Cr(e,i.x,o.x,r.x),Cr(e,i.y,o.y,r.y),Cr(e,i.z,o.z,r.z)),a}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Nl=class extends Ma{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new nt){let a=t,i=this.points,o=(i.length-1)*e,r=Math.floor(o),l=o-r,s=i[r===0?r:r-1],c=i[r],u=i[r>i.length-2?i.length-1:r+1],h=i[r>i.length-3?i.length-1:r+2];return a.set(Ff(l,s.x,c.x,u.x,h.x),Ff(l,s.y,c.y,u.y,h.y)),a}copy(e){super.copy(e),this.points=[];for(let t=0,a=e.points.length;t<a;t++){let i=e.points[t];this.points.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,a=this.points.length;t<a;t++){let i=this.points[t];e.points.push(i.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,a=e.points.length;t<a;t++){let i=e.points[t];this.points.push(new nt().fromArray(i))}return this}},Zg=Object.freeze({__proto__:null,ArcCurve:Cl,CatmullRomCurve3:qa,CubicBezierCurve:zl,CubicBezierCurve3:Pl,EllipseCurve:Vr,LineCurve:Il,LineCurve3:Ll,QuadraticBezierCurve:Dl,QuadraticBezierCurve3:kr,SplineCurve:Nl});var Yt=class n extends Gr{constructor(e=1,t=0){let a=(1+Math.sqrt(5))/2,i=[-1,a,0,1,a,0,-1,-a,0,1,-a,0,0,-1,a,0,1,a,0,-1,-a,0,1,-a,a,0,-1,a,0,1,-a,0,-1,-a,0,1],o=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,o,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},qr=class n extends lt{constructor(e=[new nt(0,-.5),new nt(.5,0),new nt(0,.5)],t=12,a=0,i=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:a,phiLength:i},t=Math.floor(t),i=Ct(i,0,Math.PI*2);let o=[],r=[],l=[],s=[],c=[],u=1/t,h=new X,d=new nt,m=new X,y=new X,b=new X,v=0,x=0;for(let w=0;w<=e.length-1;w++)switch(w){case 0:v=e[w+1].x-e[w].x,x=e[w+1].y-e[w].y,m.x=x*1,m.y=-v,m.z=x*0,b.copy(m),m.normalize(),s.push(m.x,m.y,m.z);break;case e.length-1:s.push(b.x,b.y,b.z);break;default:v=e[w+1].x-e[w].x,x=e[w+1].y-e[w].y,m.x=x*1,m.y=-v,m.z=x*0,y.copy(m),m.x+=b.x,m.y+=b.y,m.z+=b.z,m.normalize(),s.push(m.x,m.y,m.z),b.copy(y)}for(let w=0;w<=t;w++){let S=a+w*u*i,g=Math.sin(S),L=Math.cos(S);for(let R=0;R<=e.length-1;R++){h.x=e[R].x*g,h.y=e[R].y,h.z=e[R].x*L,r.push(h.x,h.y,h.z),d.x=w/t,d.y=R/(e.length-1),l.push(d.x,d.y);let z=s[3*R+0]*g,p=s[3*R+1],P=s[3*R+0]*L;c.push(z,p,P)}}for(let w=0;w<t;w++)for(let S=0;S<e.length-1;S++){let g=S+w*e.length,L=g,R=g+e.length,z=g+e.length+1,p=g+1;o.push(L,R,p),o.push(z,p,R)}this.setIndex(o),this.setAttribute("position",new Ze(r,3)),this.setAttribute("uv",new Ze(l,2)),this.setAttribute("normal",new Ze(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.points,e.segments,e.phiStart,e.phiLength)}};var an=class n extends lt{constructor(e=1,t=1,a=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:a,heightSegments:i};let o=e/2,r=t/2,l=Math.floor(a),s=Math.floor(i),c=l+1,u=s+1,h=e/l,d=t/s,m=[],y=[],b=[],v=[];for(let x=0;x<u;x++){let w=x*d-r;for(let S=0;S<c;S++){let g=S*h-o;y.push(g,-w,0),b.push(0,0,1),v.push(S/l),v.push(1-x/s)}}for(let x=0;x<s;x++)for(let w=0;w<l;w++){let S=w+c*x,g=w+c*(x+1),L=w+1+c*(x+1),R=w+1+c*x;m.push(S,g,R),m.push(g,L,R)}this.setIndex(m),this.setAttribute("position",new Ze(y,3)),this.setAttribute("normal",new Ze(b,3)),this.setAttribute("uv",new Ze(v,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},Ia=class n extends lt{constructor(e=.5,t=1,a=32,i=1,o=0,r=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:a,phiSegments:i,thetaStart:o,thetaLength:r},a=Math.max(3,a),i=Math.max(1,i);let l=[],s=[],c=[],u=[],h=e,d=(t-e)/i,m=new X,y=new nt;for(let b=0;b<=i;b++){for(let v=0;v<=a;v++){let x=o+v/a*r;m.x=h*Math.cos(x),m.y=h*Math.sin(x),s.push(m.x,m.y,m.z),c.push(0,0,1),y.x=(m.x/t+1)/2,y.y=(m.y/t+1)/2,u.push(y.x,y.y)}h+=d}for(let b=0;b<i;b++){let v=b*(a+1);for(let x=0;x<a;x++){let w=x+v,S=w,g=w+a+1,L=w+a+2,R=w+1;l.push(S,g,R),l.push(g,L,R)}}this.setIndex(l),this.setAttribute("position",new Ze(s,3)),this.setAttribute("normal",new Ze(c,3)),this.setAttribute("uv",new Ze(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var tn=class n extends lt{constructor(e=1,t=32,a=16,i=0,o=Math.PI*2,r=0,l=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:a,phiStart:i,phiLength:o,thetaStart:r,thetaLength:l},t=Math.max(3,Math.floor(t)),a=Math.max(2,Math.floor(a));let s=Math.min(r+l,Math.PI),c=0,u=[],h=new X,d=new X,m=[],y=[],b=[],v=[];for(let x=0;x<=a;x++){let w=[],S=x/a,g=r+S*l,L=e*Math.cos(g),R=Math.sqrt(e*e-L*L),z=0;x===0&&r===0?z=.5/t:x===a&&s===Math.PI&&(z=-.5/t);for(let p=0;p<=t;p++){let P=p/t,F=i+P*o;h.x=-R*Math.cos(F),h.y=L,h.z=R*Math.sin(F),y.push(h.x,h.y,h.z),d.copy(h).normalize(),b.push(d.x,d.y,d.z),v.push(P+z,1-S),w.push(c++)}u.push(w)}for(let x=0;x<a;x++)for(let w=0;w<t;w++){let S=u[x][w+1],g=u[x][w],L=u[x+1][w],R=u[x+1][w+1];(x!==0||r>0)&&m.push(S,g,R),(x!==a-1||s<Math.PI)&&m.push(g,L,R)}this.setIndex(m),this.setAttribute("position",new Ze(y,3)),this.setAttribute("normal",new Ze(b,3)),this.setAttribute("uv",new Ze(v,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}},Wr=class n extends Gr{constructor(e=1,t=0){let a=[1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],i=[2,1,0,0,3,2,1,3,0,2,3,1];super(a,i,e,t),this.type="TetrahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},Yn=class n extends lt{constructor(e=1,t=.4,a=12,i=48,o=Math.PI*2,r=0,l=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:a,tubularSegments:i,arc:o,thetaStart:r,thetaLength:l},a=Math.floor(a),i=Math.floor(i);let s=[],c=[],u=[],h=[],d=new X,m=new X,y=new X;for(let b=0;b<=a;b++){let v=r+b/a*l;for(let x=0;x<=i;x++){let w=x/i*o;m.x=(e+t*Math.cos(v))*Math.cos(w),m.y=(e+t*Math.cos(v))*Math.sin(w),m.z=t*Math.sin(v),c.push(m.x,m.y,m.z),d.x=e*Math.cos(w),d.y=e*Math.sin(w),y.subVectors(m,d).normalize(),u.push(y.x,y.y,y.z),h.push(x/i),h.push(b/a)}}for(let b=1;b<=a;b++)for(let v=1;v<=i;v++){let x=(i+1)*b+v-1,w=(i+1)*(b-1)+v-1,S=(i+1)*(b-1)+v,g=(i+1)*b+v;s.push(x,w,g),s.push(w,S,g)}this.setIndex(s),this.setAttribute("position",new Ze(c,3)),this.setAttribute("normal",new Ze(u,3)),this.setAttribute("uv",new Ze(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}};var si=class n extends lt{constructor(e=new kr(new X(-1,-1,0),new X(-1,1,0),new X(1,1,0)),t=64,a=1,i=8,o=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:a,radialSegments:i,closed:o};let r=e.computeFrenetFrames(t,o);this.tangents=r.tangents,this.normals=r.normals,this.binormals=r.binormals;let l=new X,s=new X,c=new nt,u=new X,h=[],d=[],m=[],y=[];b(),this.setIndex(y),this.setAttribute("position",new Ze(h,3)),this.setAttribute("normal",new Ze(d,3)),this.setAttribute("uv",new Ze(m,2));function b(){for(let S=0;S<t;S++)v(S);v(o===!1?t:0),w(),x()}function v(S){u=e.getPointAt(S/t,u);let g=r.normals[S],L=r.binormals[S];for(let R=0;R<=i;R++){let z=R/i*Math.PI*2,p=Math.sin(z),P=-Math.cos(z);s.x=P*g.x+p*L.x,s.y=P*g.y+p*L.y,s.z=P*g.z+p*L.z,s.normalize(),d.push(s.x,s.y,s.z),l.x=u.x+a*s.x,l.y=u.y+a*s.y,l.z=u.z+a*s.z,h.push(l.x,l.y,l.z)}}function x(){for(let S=1;S<=t;S++)for(let g=1;g<=i;g++){let L=(i+1)*(S-1)+(g-1),R=(i+1)*S+(g-1),z=(i+1)*S+g,p=(i+1)*(S-1)+g;y.push(L,R,p),y.push(R,z,p)}}function w(){for(let S=0;S<=t;S++)for(let g=0;g<=i;g++)c.x=S/t,c.y=g/i,m.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new Zg[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};function go(n){let e={};for(let t in n){e[t]={};for(let a in n[t]){let i=n[t][a];if(Bf(i))i.isRenderTargetTexture?(xt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][a]=null):e[t][a]=i.clone();else if(Array.isArray(i))if(Bf(i[0])){let o=[];for(let r=0,l=i.length;r<l;r++)o[r]=i[r].clone();e[t][a]=o}else e[t][a]=i.slice();else e[t][a]=i}}return e}function Zn(n){let e={};for(let t=0;t<n.length;t++){let a=go(n[t]);for(let i in a)e[i]=a[i]}return e}function Bf(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function Jg(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Sd(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Dt.workingColorSpace}var Vi={clone:go,merge:Zn},Kg=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Qg=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,$t=class extends Va{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Kg,this.fragmentShader=Qg,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=go(e.uniforms),this.uniformsGroups=Jg(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let r=this.uniforms[i].value;r&&r.isTexture?t.uniforms[i]={type:"t",value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[i]={type:"c",value:r.getHex()}:r&&r.isVector2?t.uniforms[i]={type:"v2",value:r.toArray()}:r&&r.isVector3?t.uniforms[i]={type:"v3",value:r.toArray()}:r&&r.isVector4?t.uniforms[i]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?t.uniforms[i]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?t.uniforms[i]={type:"m4",value:r.toArray()}:t.uniforms[i]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let a={};for(let i in this.extensions)this.extensions[i]===!0&&(a[i]=!0);return Object.keys(a).length>0&&(t.extensions=a),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let a in e.uniforms){let i=e.uniforms[a];switch(this.uniforms[a]={},i.type){case"t":this.uniforms[a].value=t[i.value]||null;break;case"c":this.uniforms[a].value=new at().setHex(i.value);break;case"v2":this.uniforms[a].value=new nt().fromArray(i.value);break;case"v3":this.uniforms[a].value=new X().fromArray(i.value);break;case"v4":this.uniforms[a].value=new gn().fromArray(i.value);break;case"m3":this.uniforms[a].value=new Mt().fromArray(i.value);break;case"m4":this.uniforms[a].value=new At().fromArray(i.value);break;default:this.uniforms[a].value=i.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let a in e.extensions)this.extensions[a]=e.extensions[a];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},Ul=class extends $t{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var mt=class extends Va{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new at(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new at(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Fc,this.normalScale=new nt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new da,this.combine=Jl,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Fl=class extends Va{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=x0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Bl=class extends Va{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Fo(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function ku(n){return n!==void 0&&n.inTangents!==void 0&&n.outTangents!==void 0}var Li=class{constructor(e,t,a,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(a),this.sampleValues=t,this.valueSize=a,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,a=this._cachedIndex,i=t[a],o=t[a-1];n:{e:{let r;t:{a:if(!(e<i)){for(let l=a+2;;){if(i===void 0){if(e<o)break a;return a=t.length,this._cachedIndex=a,this.copySampleValue_(a-1)}if(a===l)break;if(o=i,i=t[++a],e<i)break e}r=t.length;break t}if(!(e>=o)){let l=t[1];e<l&&(a=2,o=l);for(let s=a-2;;){if(o===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(a===s)break;if(i=o,o=t[--a-1],e>=o)break e}r=a,a=0;break t}break n}for(;a<r;){let l=a+r>>>1;e<t[l]?r=l:a=l+1}if(i=t[a],o=t[a-1],o===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return a=t.length,this._cachedIndex=a,this.copySampleValue_(a-1)}this._cachedIndex=a,this.intervalChanged_(a,o,i)}return this.interpolate_(a,o,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,a=this.sampleValues,i=this.valueSize,o=e*i;for(let r=0;r!==i;++r)t[r]=a[o+r];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Hl=class extends Li{constructor(e,t,a,i){super(e,t,a,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:ju,endingEnd:ju}}intervalChanged_(e,t,a){let i=this.parameterPositions,o=e-2,r=e+1,l=i[o],s=i[r];if(l===void 0)switch(this.getSettings_().endingStart){case Xu:o=e,l=2*t-a;break;case Yu:o=i.length-2,l=t+i[o]-i[o+1];break;default:o=e,l=a}if(s===void 0)switch(this.getSettings_().endingEnd){case Xu:r=e,s=2*a-t;break;case Yu:r=1,s=a+i[1]-i[0];break;default:r=e-1,s=t}let c=(a-t)*.5,u=this.valueSize;this._weightPrev=c/(t-l),this._weightNext=c/(s-a),this._offsetPrev=o*u,this._offsetNext=r*u}interpolate_(e,t,a,i){let o=this.resultBuffer,r=this.sampleValues,l=this.valueSize,s=e*l,c=s-l,u=this._offsetPrev,h=this._offsetNext,d=this._weightPrev,m=this._weightNext,y=(a-t)/(i-t),b=y*y,v=b*y,x=-d*v+2*d*b-d*y,w=(1+d)*v+(-1.5-2*d)*b+(-.5+d)*y+1,S=(-1-m)*v+(1.5+m)*b+.5*y,g=m*v-m*b;for(let L=0;L!==l;++L)o[L]=x*r[u+L]+w*r[c+L]+S*r[s+L]+g*r[h+L];return o}},Ol=class extends Li{constructor(e,t,a,i){super(e,t,a,i)}interpolate_(e,t,a,i){let o=this.resultBuffer,r=this.sampleValues,l=this.valueSize,s=e*l,c=s-l,u=(a-t)/(i-t),h=1-u;for(let d=0;d!==l;++d)o[d]=r[c+d]*h+r[s+d]*u;return o}},Gl=class extends Li{constructor(e,t,a,i){super(e,t,a,i)}interpolate_(e){return this.copySampleValue_(e-1)}},Vl=class extends Li{interpolate_(e,t,a,i){let o=this.resultBuffer,r=this.sampleValues,l=this.valueSize,s=e*l,c=s-l,u=this.inTangents,h=this.outTangents;if(!u||!h){let y=(a-t)/(i-t),b=1-y;for(let v=0;v!==l;++v)o[v]=r[c+v]*b+r[s+v]*y;return o}let d=l*2,m=e-1;for(let y=0;y!==l;++y){let b=r[c+y],v=r[s+y],x=m*d+y*2,w=h[x],S=h[x+1],g=e*d+y*2,L=u[g],R=u[g+1],z=tx(a,t,w,L,i);o[y]=I0(z,b,S,R,v)}return o}};function I0(n,e,t,a,i){let o=1-n;return o*o*o*e+3*o*o*n*t+3*o*n*n*a+n*n*n*i}function ex(n,e,t,a,i){let o=1-n;return 3*o*o*(t-e)+6*o*n*(a-t)+3*n*n*(i-a)}function tx(n,e,t,a,i){let o=(n-e)/(i-e);for(let r=0;r<8;r++){let l=I0(o,e,t,a,i)-n;if(Math.abs(l)<1e-10)break;let s=ex(o,e,t,a,i);if(Math.abs(s)<1e-10)break;o=Math.max(0,Math.min(1,o-l/s))}return o}var ha=class{constructor(e,t,a,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Fo(t,this.TimeBufferType),this.values=Fo(a,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,a;if(t.toJSON!==this.toJSON)a=t.toJSON(e);else{a={name:e.name,times:Fo(e.times,Array),values:Fo(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(a.interpolation=i),ku(e.settings)&&(a.settings={inTangents:Fo(e.settings.inTangents,Array),outTangents:Fo(e.settings.outTangents,Array)})}return a.type=e.ValueTypeName,a}InterpolantFactoryMethodDiscrete(e){return new Gl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ol(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Hl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Vl(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Pr:t=this.InterpolantFactoryMethodDiscrete;break;case _l:t=this.InterpolantFactoryMethodLinear;break;case ul:t=this.InterpolantFactoryMethodSmooth;break;case Wu:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let a="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(a);return xt("KeyframeTrack:",a),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Pr;case this.InterpolantFactoryMethodLinear:return _l;case this.InterpolantFactoryMethodSmooth:return ul;case this.InterpolantFactoryMethodBezier:return Wu}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let a=0,i=t.length;a!==i;++a)t[a]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let a=0,i=t.length;a!==i;++a)t[a]*=e;ku(this.settings)&&(Hf(this.settings.inTangents,e),Hf(this.settings.outTangents,e))}return this}trim(e,t){let a=this.times,i=a.length,o=0,r=i-1;for(;o!==i&&a[o]<e;)++o;for(;r!==-1&&a[r]>t;)--r;if(++r,o!==0||r!==i){o>=r&&(r=Math.max(r,1),o=r-1);let l=this.getValueSize();this.times=a.slice(o,r),this.values=this.values.slice(o*l,r*l)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(bt("KeyframeTrack: Invalid value size in track.",this),e=!1);let a=this.times,i=this.values,o=a.length;o===0&&(bt("KeyframeTrack: Track is empty.",this),e=!1);let r=null;for(let l=0;l!==o;l++){let s=a[l];if(typeof s=="number"&&isNaN(s)){bt("KeyframeTrack: Time is not a valid number.",this,l,s),e=!1;break}if(r!==null&&r>s){bt("KeyframeTrack: Out of order keys.",this,l,s,r),e=!1;break}r=s}if(i!==void 0&&ig(i))for(let l=0,s=i.length;l!==s;++l){let c=i[l];if(isNaN(c)){bt("KeyframeTrack: Value is not a valid number.",this,l,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),a=this.getValueSize(),i=this.getInterpolation()===ul,o=e.length-1,r=1;for(let l=1;l<o;++l){let s=!1,c=e[l],u=e[l+1];if(c!==u&&(l!==1||c!==e[0]))if(i)s=!0;else{let h=l*a,d=h-a,m=h+a;for(let y=0;y!==a;++y){let b=t[h+y];if(b!==t[d+y]||b!==t[m+y]){s=!0;break}}}if(s){if(l!==r){e[r]=e[l];let h=l*a,d=r*a;for(let m=0;m!==a;++m)t[d+m]=t[h+m]}++r}}if(o>0){e[r]=e[o];for(let l=o*a,s=r*a,c=0;c!==a;++c)t[s+c]=t[l+c];++r}return r!==e.length?(this.times=e.slice(0,r),this.values=t.slice(0,r*a)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),a=this.constructor,i=new a(this.name,e,t);return i.createInterpolant=this.createInterpolant,ku(this.settings)&&(i.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),i}};function Hf(n,e){for(let t=0,a=n.length;t!==a;t+=2)n[t]*=e}ha.prototype.ValueTypeName="";ha.prototype.TimeBufferType=Float32Array;ha.prototype.ValueBufferType=Float32Array;ha.prototype.DefaultInterpolation=_l;var Di=class extends ha{constructor(e,t,a){super(e,t,a)}};Di.prototype.ValueTypeName="bool";Di.prototype.ValueBufferType=Array;Di.prototype.DefaultInterpolation=Pr;Di.prototype.InterpolantFactoryMethodLinear=void 0;Di.prototype.InterpolantFactoryMethodSmooth=void 0;var kl=class extends ha{constructor(e,t,a,i){super(e,t,a,i)}};kl.prototype.ValueTypeName="color";var ql=class extends ha{constructor(e,t,a,i){super(e,t,a,i)}};ql.prototype.ValueTypeName="number";var Wl=class extends Li{constructor(e,t,a,i){super(e,t,a,i)}interpolate_(e,t,a,i){let o=this.resultBuffer,r=this.sampleValues,l=this.valueSize,s=(a-t)/(i-t),c=e*l;for(let u=c+l;c!==u;c+=4)Wn.slerpFlat(o,0,r,c-l,r,c,s);return o}},jr=class extends ha{constructor(e,t,a,i){super(e,t,a,i)}InterpolantFactoryMethodLinear(e){return new Wl(this.times,this.values,this.getValueSize(),e)}};jr.prototype.ValueTypeName="quaternion";jr.prototype.InterpolantFactoryMethodSmooth=void 0;var Ni=class extends ha{constructor(e,t,a){super(e,t,a)}};Ni.prototype.ValueTypeName="string";Ni.prototype.ValueBufferType=Array;Ni.prototype.DefaultInterpolation=Pr;Ni.prototype.InterpolantFactoryMethodLinear=void 0;Ni.prototype.InterpolantFactoryMethodSmooth=void 0;var jl=class extends ha{constructor(e,t,a,i){super(e,t,a,i)}};jl.prototype.ValueTypeName="vector";var hl={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(Of(n)||(this.files[n]=e))},get:function(n){if(this.enabled!==!1&&!Of(n))return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}};function Of(n){try{let e=n.slice(n.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var Xl=class{constructor(e,t,a){let i=this,o=!1,r=0,l=0,s,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=a,this._abortController=null,this.itemStart=function(u){l++,o===!1&&i.onStart!==void 0&&i.onStart(u,r,l),o=!0},this.itemEnd=function(u){r++,i.onProgress!==void 0&&i.onProgress(u,r,l),r===l&&(o=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(u){i.onError!==void 0&&i.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),s?s(u):u},this.setURLModifier=function(u){return s=u,this},this.addHandler=function(u,h){return c.push(u,h),this},this.removeHandler=function(u){let h=c.indexOf(u);return h!==-1&&c.splice(h,2),this},this.getHandler=function(u){for(let h=0,d=c.length;h<d;h+=2){let m=c[h],y=c[h+1];if(m.global&&(m.lastIndex=0),m.test(u))return y}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},L0=new Xl,Ko=class{constructor(e){this.manager=e!==void 0?e:L0,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let a=this;return new Promise(function(i,o){a.load(e,i,t,o)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Ko.DEFAULT_MATERIAL_NAME="__DEFAULT";var Bo=new WeakMap,Yl=class extends Ko{constructor(e){super(e)}load(e,t,a,i){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let o=this,r=hl.get(`image:${e}`);if(r!==void 0){if(r.complete===!0)o.manager.itemStart(e),setTimeout(function(){t&&t(r),o.manager.itemEnd(e)},0);else{let h=Bo.get(r);h===void 0&&(h=[],Bo.set(r,h)),h.push({onLoad:t,onError:i})}return r}let l=Wo("img");function s(){u(),t&&t(this);let h=Bo.get(this)||[];for(let d=0;d<h.length;d++){let m=h[d];m.onLoad&&m.onLoad(this)}Bo.delete(this),o.manager.itemEnd(e)}function c(h){u(),i&&i(h),hl.remove(`image:${e}`);let d=Bo.get(this)||[];for(let m=0;m<d.length;m++){let y=d[m];y.onError&&y.onError(h)}Bo.delete(this),o.manager.itemError(e),o.manager.itemEnd(e)}function u(){l.removeEventListener("load",s,!1),l.removeEventListener("error",c,!1)}return l.addEventListener("load",s,!1),l.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(l.crossOrigin=this.crossOrigin),hl.add(`image:${e}`,l),o.manager.itemStart(e),l.src=e,l}};var Xr=class extends Ko{constructor(e){super(e)}load(e,t,a,i){let o=new jn,r=new Yl(this.manager);return r.setCrossOrigin(this.crossOrigin),r.setPath(this.path),r.load(e,function(l){o.image=l,o.needsUpdate=!0,t!==void 0&&t(o)},a,i),o}},uo=class extends ln{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new at(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Yr=class extends uo{constructor(e,t,a){super(e,a),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ln.DEFAULT_UP),this.updateMatrix(),this.groundColor=new at(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},qu=new At,Gf=new X,Vf=new X,Qo=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new nt(512,512),this.mapType=$n,this.map=null,this.mapPass=null,this.matrix=new At,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Zo,this._frameExtents=new nt(1,1),this._viewportCount=1,this._viewports=[new gn(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Gf.setFromMatrixPosition(e.matrixWorld),t.position.copy(Gf),Vf.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Vf),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,a,i){qu.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),a.setFromProjectionMatrix(qu,e.coordinateSystem,e.reversedDepth);let o=this._frameExtents,r=i?i.z/o.x:1,l=i?i.w/o.y:1,s=i?i.x/o.x:0,c=i?i.y/o.y:0;e.coordinateSystem===qo||e.reversedDepth?t.set(.5*r,0,0,.5*r+s,0,.5*l,0,.5*l+c,0,0,1,0,0,0,0,1):t.set(.5*r,0,0,.5*r+s,0,.5*l,0,.5*l+c,0,0,.5,.5,0,0,0,1),t.multiply(qu)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},ll=new X,cl=new Wn,Fa=new X,$r=class extends ln{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new At,this.projectionMatrix=new At,this.projectionMatrixInverse=new At,this.coordinateSystem=Pa,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ll,cl,Fa),Fa.x===1&&Fa.y===1&&Fa.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ll,cl,Fa.set(1,1,1)).invert()}updateWorldMatrix(e,t,a=!1){super.updateWorldMatrix(e,t,a),this.matrixWorld.decompose(ll,cl,Fa),Fa.x===1&&Fa.y===1&&Fa.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ll,cl,Fa.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Ri=new X,kf=new nt,qf=new nt,Nn=class extends $r{constructor(e=50,t=1,a=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=a,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=oo*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Ar*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return oo*2*Math.atan(Math.tan(Ar*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,a){Ri.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ri.x,Ri.y).multiplyScalar(-e/Ri.z),Ri.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),a.set(Ri.x,Ri.y).multiplyScalar(-e/Ri.z)}getViewSize(e,t){return this.getViewBounds(e,kf,qf),t.subVectors(qf,kf)}setViewOffset(e,t,a,i,o,r){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=a,this.view.offsetY=i,this.view.width=o,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Ar*.5*this.fov)/this.zoom,a=2*t,i=this.aspect*a,o=-.5*i,r=this.view;if(this.view!==null&&this.view.enabled){let s=r.fullWidth,c=r.fullHeight;o+=r.offsetX*i/s,t-=r.offsetY*a/c,i*=r.width/s,a*=r.height/c}let l=this.filmOffset;l!==0&&(o+=e*l/this.getFilmWidth()),this.projectionMatrix.makePerspective(o,o+i,t,t-a,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Zu=class extends Qo{constructor(){super(new Nn(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,a=oo*2*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,o=e.distance||t.far;(a!==t.fov||i!==t.aspect||o!==t.far)&&(t.fov=a,t.aspect=i,t.far=o,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this.aspect=e.aspect,this}toJSON(){let e=super.toJSON();return e.focus=this.focus,e.aspect=this.aspect,e}},li=class extends uo{constructor(e,t,a=0,i=Math.PI/3,o=0,r=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(ln.DEFAULT_UP),this.updateMatrix(),this.target=new ln,this.distance=a,this.angle=i,this.penumbra=o,this.decay=r,this.map=null,this.shadow=new Zu}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}},Ju=class extends Qo{constructor(){super(new Nn(90,1,.5,500)),this.isPointLightShadow=!0}},bn=class extends uo{constructor(e,t,a=0,i=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=a,this.decay=i,this.shadow=new Ju}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},Ui=class extends $r{constructor(e=-1,t=1,a=1,i=-1,o=.1,r=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=a,this.bottom=i,this.near=o,this.far=r,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,a,i,o,r){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=a,this.view.offsetY=i,this.view.width=o,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),a=(this.right+this.left)/2,i=(this.top+this.bottom)/2,o=a-e,r=a+e,l=i+t,s=i-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;o+=c*this.view.offsetX,r=o+c*this.view.width,l-=u*this.view.offsetY,s=l-u*this.view.height}this.projectionMatrix.makeOrthographic(o,r,l,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Ku=class extends Qo{constructor(){super(new Ui(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Zr=class extends uo{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ln.DEFAULT_UP),this.updateMatrix(),this.target=new ln,this.shadow=new Ku}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var Jr=class extends lt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){let e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}};var Ho=-90,Oo=1,$l=class extends ln{constructor(e,t,a){super(),this.type="CubeCamera",this.renderTarget=a,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new Nn(Ho,Oo,e,t);i.layers=this.layers,this.add(i);let o=new Nn(Ho,Oo,e,t);o.layers=this.layers,this.add(o);let r=new Nn(Ho,Oo,e,t);r.layers=this.layers,this.add(r);let l=new Nn(Ho,Oo,e,t);l.layers=this.layers,this.add(l);let s=new Nn(Ho,Oo,e,t);s.layers=this.layers,this.add(s);let c=new Nn(Ho,Oo,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[a,i,o,r,l,s]=t;for(let c of t)this.remove(c);if(e===Pa)a.up.set(0,1,0),a.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),o.up.set(0,0,-1),o.lookAt(0,1,0),r.up.set(0,0,1),r.lookAt(0,-1,0),l.up.set(0,1,0),l.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===qo)a.up.set(0,-1,0),a.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),o.up.set(0,0,1),o.lookAt(0,1,0),r.up.set(0,0,-1),r.lookAt(0,-1,0),l.up.set(0,-1,0),l.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:a,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[o,r,l,s,c,u]=this.children,h=e.getRenderTarget(),d=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),y=e.xr.enabled;e.xr.enabled=!1;let b=a.texture.generateMipmaps;a.texture.generateMipmaps=!1;let v=!1;e.isWebGLRenderer===!0?v=e.state.buffers.depth.getReversed():v=e.reversedDepthBuffer,e.setRenderTarget(a,0,i),v&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(a,1,i),v&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(a,2,i),v&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(a,3,i),v&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(a,4,i),v&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),a.texture.generateMipmaps=b,e.setRenderTarget(a,5,i),v&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(h,d,m),e.xr.enabled=y,a.texture.needsPMREMUpdate=!0}},Zl=class extends Nn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var Td="\\[\\]\\.:\\/",nx=new RegExp("["+Td+"]","g"),wd="[^"+Td+"]",ax="[^"+Td.replace("\\.","")+"]",ix=/((?:WC+[\/:])*)/.source.replace("WC",wd),ox=/(WCOD+)?/.source.replace("WCOD",ax),rx=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",wd),sx=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",wd),lx=new RegExp("^"+ix+ox+rx+sx+"$"),cx=["material","materials","bones","map"],Qu=class{constructor(e,t,a){let i=a||dn.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let a=this._targetGroup.nCachedObjects_,i=this._bindings[a];i!==void 0&&i.getValue(e,t)}setValue(e,t){let a=this._bindings;for(let i=this._targetGroup.nCachedObjects_,o=a.length;i!==o;++i)a[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,a=e.length;t!==a;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,a=e.length;t!==a;++t)e[t].unbind()}},dn=class n{constructor(e,t,a){this.path=t,this.parsedPath=a||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,a){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,a):new n(e,t,a)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(nx,"")}static parseTrackName(e){let t=lx.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let a={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=a.nodeName&&a.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let o=a.nodeName.substring(i+1);cx.indexOf(o)!==-1&&(a.nodeName=a.nodeName.substring(0,i),a.objectName=o)}if(a.propertyName===null||a.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return a}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let a=e.skeleton.getBoneByName(t);if(a!==void 0)return a}if(e.children){let a=function(o){for(let r=0;r<o.length;r++){let l=o[r];if(l.name===t||l.uuid===t)return l;let s=a(l.children);if(s)return s}return null},i=a(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let a=this.resolvedProperty;for(let i=0,o=a.length;i!==o;++i)e[t++]=a[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let a=this.resolvedProperty;for(let i=0,o=a.length;i!==o;++i)a[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let a=this.resolvedProperty;for(let i=0,o=a.length;i!==o;++i)a[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let a=this.resolvedProperty;for(let i=0,o=a.length;i!==o;++i)a[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,a=t.objectName,i=t.propertyName,o=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){xt("PropertyBinding: No target node found for track: "+this.path+".");return}if(a){let c=t.objectIndex;switch(a){case"materials":if(!e.material){bt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){bt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){bt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===c){c=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){bt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){bt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[a]===void 0){bt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[a]}if(c!==void 0){if(e[c]===void 0){bt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let r=e[i];if(r===void 0){let c=t.nodeName;bt("PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e);return}let l=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?l=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(l=this.Versioning.MatrixWorldNeedsUpdate);let s=this.BindingType.Direct;if(o!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){bt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){bt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[o]!==void 0&&(o=e.morphTargetDictionary[o])}s=this.BindingType.ArrayElement,this.resolvedProperty=r,this.propertyIndex=o}else r.fromArray!==void 0&&r.toArray!==void 0?(s=this.BindingType.HasFromToArray,this.resolvedProperty=r):Array.isArray(r)?(s=this.BindingType.EntireArray,this.resolvedProperty=r):this.propertyName=i;this.getValue=this.GetterByBindingType[s],this.setValue=this.SetterByBindingTypeAndVersioning[s][l]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};dn.Composite=Qu;dn.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};dn.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};dn.prototype.GetterByBindingType=[dn.prototype._getValue_direct,dn.prototype._getValue_array,dn.prototype._getValue_arrayElement,dn.prototype._getValue_toArray];dn.prototype.SetterByBindingTypeAndVersioning=[[dn.prototype._setValue_direct,dn.prototype._setValue_direct_setNeedsUpdate,dn.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[dn.prototype._setValue_array,dn.prototype._setValue_array_setNeedsUpdate,dn.prototype._setValue_array_setMatrixWorldNeedsUpdate],[dn.prototype._setValue_arrayElement,dn.prototype._setValue_arrayElement_setNeedsUpdate,dn.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[dn.prototype._setValue_fromArray,dn.prototype._setValue_fromArray_setNeedsUpdate,dn.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var t_=new Float32Array(1);var Wf=new At,Kr=class{constructor(e,t,a=0,i=1/0){this.ray=new so(e,t),this.near=a,this.far=i,this.camera=null,this.layers=new Yo,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):bt("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Wf.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Wf),this}intersectObject(e,t=!0,a=[]){return ed(e,this,a,t),a.sort(jf),a}intersectObjects(e,t=!0,a=[]){for(let i=0,o=e.length;i<o;i++)ed(e[i],this,a,t);return a.sort(jf),a}};function jf(n,e){return n.distance-e.distance}function ed(n,e,t,a){let i=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(i=!1),i===!0&&a===!0){let o=n.children;for(let r=0,l=o.length;r<l;r++)ed(o[r],e,t,!0)}}var td=class n{static{n.prototype.isMatrix2=!0}constructor(e,t,a,i){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,a,i)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let a=0;a<4;a++)this.elements[a]=e[a+t];return this}set(e,t,a,i){let o=this.elements;return o[0]=e,o[2]=t,o[1]=a,o[3]=i,this}};function Ad(n,e,t,a){let i=ux(a);switch(t){case vd:return n*e;case ar:return n*e/i.components*i.byteLength;case ic:return n*e/i.components*i.byteLength;case Gi:return n*e*2/i.components*i.byteLength;case oc:return n*e*2/i.components*i.byteLength;case yd:return n*e*3/i.components*i.byteLength;case na:return n*e*4/i.components*i.byteLength;case rc:return n*e*4/i.components*i.byteLength;case ns:case as:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case is:case os:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case lc:case uc:return Math.max(n,16)*Math.max(e,8)/4;case sc:case cc:return Math.max(n,8)*Math.max(e,8)/2;case dc:case hc:case pc:case mc:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case fc:case rs:case gc:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case xc:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case vc:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case yc:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case bc:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case Mc:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case _c:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case Ec:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Sc:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Tc:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case wc:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Ac:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Rc:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Cc:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case zc:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Pc:case Ic:case Lc:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Dc:case Nc:return Math.ceil(n/4)*Math.ceil(e/4)*8;case ss:case Uc:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function ux(n){switch(n){case $n:case pd:return{byteLength:1,components:1};case tr:case md:case ta:return{byteLength:2,components:1};case nc:case ac:return{byteLength:2,components:4};case Da:case tc:case _a:return{byteLength:4,components:1};case gd:case xd:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?xt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function tp(){let n=null,e=!1,t=null,a=null;function i(o,r){a=n.requestAnimationFrame(i),t(o,r)}return{start:function(){e!==!0&&t!==null&&n!==null&&(a=n.requestAnimationFrame(i),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(a),e=!1},setAnimationLoop:function(o){t=o},setContext:function(o){n=o}}}function hx(n){let e=new WeakMap;function t(l,s){let c=l.array,u=l.usage,h=c.byteLength,d=n.createBuffer();n.bindBuffer(s,d),n.bufferData(s,c,u),l.onUploadCallback();let m;if(c instanceof Float32Array)m=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)m=n.HALF_FLOAT;else if(c instanceof Uint16Array)l.isFloat16BufferAttribute?m=n.HALF_FLOAT:m=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=n.SHORT;else if(c instanceof Uint32Array)m=n.UNSIGNED_INT;else if(c instanceof Int32Array)m=n.INT;else if(c instanceof Int8Array)m=n.BYTE;else if(c instanceof Uint8Array)m=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:l.version,size:h}}function a(l,s,c){let u=s.array,h=s.updateRanges;if(n.bindBuffer(c,l),h.length===0)n.bufferSubData(c,0,u);else{h.sort((m,y)=>m.start-y.start);let d=0;for(let m=1;m<h.length;m++){let y=h[d],b=h[m];b.start<=y.start+y.count+1?y.count=Math.max(y.count,b.start+b.count-y.start):(++d,h[d]=b)}h.length=d+1;for(let m=0,y=h.length;m<y;m++){let b=h[m];n.bufferSubData(c,b.start*u.BYTES_PER_ELEMENT,u,b.start,b.count)}s.clearUpdateRanges()}s.onUploadCallback()}function i(l){return l.isInterleavedBufferAttribute&&(l=l.data),e.get(l)}function o(l){l.isInterleavedBufferAttribute&&(l=l.data);let s=e.get(l);s&&(n.deleteBuffer(s.buffer),e.delete(l))}function r(l,s){if(l.isInterleavedBufferAttribute&&(l=l.data),l.isGLBufferAttribute){let u=e.get(l);(!u||u.version<l.version)&&e.set(l,{buffer:l.buffer,type:l.type,bytesPerElement:l.elementSize,version:l.version});return}let c=e.get(l);if(c===void 0)e.set(l,t(l,s));else if(c.version<l.version){if(c.size!==l.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");a(c.buffer,l,s),c.version=l.version}}return{get:i,remove:o,update:r}}var fx=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,px=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,mx=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,gx=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,xx=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,vx=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,yx=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,bx=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Mx=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,_x=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Ex=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Sx=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Tx=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,wx=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Ax=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Rx=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Cx=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,zx=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Px=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Ix=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Lx=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Dx=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Nx=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Ux=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Fx=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Bx=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Hx=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Ox=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Gx=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Vx=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,kx="gl_FragColor = linearToOutputTexel( gl_FragColor );",qx=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Wx=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,jx=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Xx=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Yx=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,$x=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Zx=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Jx=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Kx=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Qx=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,ev=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,tv=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,nv=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,av=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,iv=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,ov=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,rv=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,sv=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lv=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,cv=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,uv=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,dv=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,hv=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,fv=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,pv=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,mv=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,gv=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,xv=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,vv=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,yv=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,bv=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Mv=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,_v=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Ev=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Sv=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Tv=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,wv=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Av=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Rv=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Cv=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,zv=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Pv=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Iv=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Lv=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Dv=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Nv=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Uv=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Fv=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Bv=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Hv=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Ov=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Gv=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Vv=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,kv=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,qv=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Wv=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,jv=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Xv=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Yv=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,$v=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Zv=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Jv=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Kv=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Qv=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,e1=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,t1=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,n1=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,a1=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,i1=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,o1=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,r1=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,s1=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,l1=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,c1=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,u1=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,d1=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,h1=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,f1=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,p1=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,m1=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,g1=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,x1=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,v1=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,y1=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,b1=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,M1=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,_1=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,E1=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,S1=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,T1=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,w1=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,A1=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,R1=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,C1=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,z1=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,P1=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,I1=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,L1=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,D1=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,N1=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,U1=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,F1=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,B1=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,H1=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,O1=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,G1=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,V1=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,k1=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,q1=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,W1=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,j1=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,zt={alphahash_fragment:fx,alphahash_pars_fragment:px,alphamap_fragment:mx,alphamap_pars_fragment:gx,alphatest_fragment:xx,alphatest_pars_fragment:vx,aomap_fragment:yx,aomap_pars_fragment:bx,batching_pars_vertex:Mx,batching_vertex:_x,begin_vertex:Ex,beginnormal_vertex:Sx,bsdfs:Tx,iridescence_fragment:wx,bumpmap_pars_fragment:Ax,clipping_planes_fragment:Rx,clipping_planes_pars_fragment:Cx,clipping_planes_pars_vertex:zx,clipping_planes_vertex:Px,color_fragment:Ix,color_pars_fragment:Lx,color_pars_vertex:Dx,color_vertex:Nx,common:Ux,cube_uv_reflection_fragment:Fx,defaultnormal_vertex:Bx,displacementmap_pars_vertex:Hx,displacementmap_vertex:Ox,emissivemap_fragment:Gx,emissivemap_pars_fragment:Vx,colorspace_fragment:kx,colorspace_pars_fragment:qx,envmap_fragment:Wx,envmap_common_pars_fragment:jx,envmap_pars_fragment:Xx,envmap_pars_vertex:Yx,envmap_physical_pars_fragment:ov,envmap_vertex:$x,fog_vertex:Zx,fog_pars_vertex:Jx,fog_fragment:Kx,fog_pars_fragment:Qx,gradientmap_pars_fragment:ev,lightmap_pars_fragment:tv,lights_lambert_fragment:nv,lights_lambert_pars_fragment:av,lights_pars_begin:iv,lights_toon_fragment:rv,lights_toon_pars_fragment:sv,lights_phong_fragment:lv,lights_phong_pars_fragment:cv,lights_physical_fragment:uv,lights_physical_pars_fragment:dv,lights_fragment_begin:hv,lights_fragment_maps:fv,lights_fragment_end:pv,lightprobes_pars_fragment:mv,logdepthbuf_fragment:gv,logdepthbuf_pars_fragment:xv,logdepthbuf_pars_vertex:vv,logdepthbuf_vertex:yv,map_fragment:bv,map_pars_fragment:Mv,map_particle_fragment:_v,map_particle_pars_fragment:Ev,metalnessmap_fragment:Sv,metalnessmap_pars_fragment:Tv,morphinstance_vertex:wv,morphcolor_vertex:Av,morphnormal_vertex:Rv,morphtarget_pars_vertex:Cv,morphtarget_vertex:zv,normal_fragment_begin:Pv,normal_fragment_maps:Iv,normal_pars_fragment:Lv,normal_pars_vertex:Dv,normal_vertex:Nv,normalmap_pars_fragment:Uv,clearcoat_normal_fragment_begin:Fv,clearcoat_normal_fragment_maps:Bv,clearcoat_pars_fragment:Hv,iridescence_pars_fragment:Ov,opaque_fragment:Gv,packing:Vv,premultiplied_alpha_fragment:kv,project_vertex:qv,dithering_fragment:Wv,dithering_pars_fragment:jv,roughnessmap_fragment:Xv,roughnessmap_pars_fragment:Yv,shadowmap_pars_fragment:$v,shadowmap_pars_vertex:Zv,shadowmap_vertex:Jv,shadowmask_pars_fragment:Kv,skinbase_vertex:Qv,skinning_pars_vertex:e1,skinning_vertex:t1,skinnormal_vertex:n1,specularmap_fragment:a1,specularmap_pars_fragment:i1,tonemapping_fragment:o1,tonemapping_pars_fragment:r1,transmission_fragment:s1,transmission_pars_fragment:l1,uv_pars_fragment:c1,uv_pars_vertex:u1,uv_vertex:d1,worldpos_vertex:h1,background_vert:f1,background_frag:p1,backgroundCube_vert:m1,backgroundCube_frag:g1,cube_vert:x1,cube_frag:v1,depth_vert:y1,depth_frag:b1,distance_vert:M1,distance_frag:_1,equirect_vert:E1,equirect_frag:S1,linedashed_vert:T1,linedashed_frag:w1,meshbasic_vert:A1,meshbasic_frag:R1,meshlambert_vert:C1,meshlambert_frag:z1,meshmatcap_vert:P1,meshmatcap_frag:I1,meshnormal_vert:L1,meshnormal_frag:D1,meshphong_vert:N1,meshphong_frag:U1,meshphysical_vert:F1,meshphysical_frag:B1,meshtoon_vert:H1,meshtoon_frag:O1,points_vert:G1,points_frag:V1,shadow_vert:k1,shadow_frag:q1,sprite_vert:W1,sprite_frag:j1},je={common:{diffuse:{value:new at(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Mt},alphaMap:{value:null},alphaMapTransform:{value:new Mt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Mt}},envmap:{envMap:{value:null},envMapRotation:{value:new Mt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Mt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Mt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Mt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Mt},normalScale:{value:new nt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Mt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Mt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Mt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Mt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new at(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new X},probesMax:{value:new X},probesResolution:{value:new X}},points:{diffuse:{value:new at(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Mt},alphaTest:{value:0},uvTransform:{value:new Mt}},sprite:{diffuse:{value:new at(16777215)},opacity:{value:1},center:{value:new nt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Mt},alphaMap:{value:null},alphaMapTransform:{value:new Mt},alphaTest:{value:0}}},Ya={basic:{uniforms:Zn([je.common,je.specularmap,je.envmap,je.aomap,je.lightmap,je.fog]),vertexShader:zt.meshbasic_vert,fragmentShader:zt.meshbasic_frag},lambert:{uniforms:Zn([je.common,je.specularmap,je.envmap,je.aomap,je.lightmap,je.emissivemap,je.bumpmap,je.normalmap,je.displacementmap,je.fog,je.lights,{emissive:{value:new at(0)},envMapIntensity:{value:1}}]),vertexShader:zt.meshlambert_vert,fragmentShader:zt.meshlambert_frag},phong:{uniforms:Zn([je.common,je.specularmap,je.envmap,je.aomap,je.lightmap,je.emissivemap,je.bumpmap,je.normalmap,je.displacementmap,je.fog,je.lights,{emissive:{value:new at(0)},specular:{value:new at(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:zt.meshphong_vert,fragmentShader:zt.meshphong_frag},standard:{uniforms:Zn([je.common,je.envmap,je.aomap,je.lightmap,je.emissivemap,je.bumpmap,je.normalmap,je.displacementmap,je.roughnessmap,je.metalnessmap,je.fog,je.lights,{emissive:{value:new at(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:zt.meshphysical_vert,fragmentShader:zt.meshphysical_frag},toon:{uniforms:Zn([je.common,je.aomap,je.lightmap,je.emissivemap,je.bumpmap,je.normalmap,je.displacementmap,je.gradientmap,je.fog,je.lights,{emissive:{value:new at(0)}}]),vertexShader:zt.meshtoon_vert,fragmentShader:zt.meshtoon_frag},matcap:{uniforms:Zn([je.common,je.bumpmap,je.normalmap,je.displacementmap,je.fog,{matcap:{value:null}}]),vertexShader:zt.meshmatcap_vert,fragmentShader:zt.meshmatcap_frag},points:{uniforms:Zn([je.points,je.fog]),vertexShader:zt.points_vert,fragmentShader:zt.points_frag},dashed:{uniforms:Zn([je.common,je.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:zt.linedashed_vert,fragmentShader:zt.linedashed_frag},depth:{uniforms:Zn([je.common,je.displacementmap]),vertexShader:zt.depth_vert,fragmentShader:zt.depth_frag},normal:{uniforms:Zn([je.common,je.bumpmap,je.normalmap,je.displacementmap,{opacity:{value:1}}]),vertexShader:zt.meshnormal_vert,fragmentShader:zt.meshnormal_frag},sprite:{uniforms:Zn([je.sprite,je.fog]),vertexShader:zt.sprite_vert,fragmentShader:zt.sprite_frag},background:{uniforms:{uvTransform:{value:new Mt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:zt.background_vert,fragmentShader:zt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Mt}},vertexShader:zt.backgroundCube_vert,fragmentShader:zt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:zt.cube_vert,fragmentShader:zt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:zt.equirect_vert,fragmentShader:zt.equirect_frag},distance:{uniforms:Zn([je.common,je.displacementmap,{referencePosition:{value:new X},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:zt.distance_vert,fragmentShader:zt.distance_frag},shadow:{uniforms:Zn([je.lights,je.fog,{color:{value:new at(0)},opacity:{value:1}}]),vertexShader:zt.shadow_vert,fragmentShader:zt.shadow_frag}};Ya.physical={uniforms:Zn([Ya.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Mt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Mt},clearcoatNormalScale:{value:new nt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Mt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Mt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Mt},sheen:{value:0},sheenColor:{value:new at(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Mt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Mt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Mt},transmissionSamplerSize:{value:new nt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Mt},attenuationDistance:{value:0},attenuationColor:{value:new at(0)},specularColor:{value:new at(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Mt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Mt},anisotropyVector:{value:new nt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Mt}}]),vertexShader:zt.meshphysical_vert,fragmentShader:zt.meshphysical_frag};var Gc={r:0,b:0,g:0},X1=new At,np=new Mt;np.set(-1,0,0,0,1,0,0,0,1);function Y1(n,e,t,a,i,o){let r=new at(0),l=i===!0?0:1,s,c,u=null,h=0,d=null;function m(w){let S=w.isScene===!0?w.background:null;if(S&&S.isTexture){let g=w.backgroundBlurriness>0;S=e.get(S,g)}return S}function y(w){let S=!1,g=m(w);g===null?v(r,l):g&&g.isColor&&(v(g,1),S=!0);let L=n.xr.getEnvironmentBlendMode();L==="additive"?t.buffers.color.setClear(0,0,0,1,o):L==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,o),(n.autoClear||S)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function b(w,S){let g=m(S);g&&(g.isCubeTexture||g.mapping===es)?(c===void 0&&(c=new xe(new Se(1,1,1),new $t({name:"BackgroundCubeMaterial",uniforms:go(Ya.backgroundCube.uniforms),vertexShader:Ya.backgroundCube.vertexShader,fragmentShader:Ya.backgroundCube.fragmentShader,side:Hn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(L,R,z){this.matrixWorld.copyPosition(z.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),a.update(c)),c.material.uniforms.envMap.value=g,c.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(X1.makeRotationFromEuler(S.backgroundRotation)).transpose(),g.isCubeTexture&&g.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(np),c.material.toneMapped=Dt.getTransfer(g.colorSpace)!==Kt,(u!==g||h!==g.version||d!==n.toneMapping)&&(c.material.needsUpdate=!0,u=g,h=g.version,d=n.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null)):g&&g.isTexture&&(s===void 0&&(s=new xe(new an(2,2),new $t({name:"BackgroundMaterial",uniforms:go(Ya.background.uniforms),vertexShader:Ya.background.vertexShader,fragmentShader:Ya.background.fragmentShader,side:Wa,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),s.geometry.deleteAttribute("normal"),Object.defineProperty(s.material,"map",{get:function(){return this.uniforms.t2D.value}}),a.update(s)),s.material.uniforms.t2D.value=g,s.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,s.material.toneMapped=Dt.getTransfer(g.colorSpace)!==Kt,g.matrixAutoUpdate===!0&&g.updateMatrix(),s.material.uniforms.uvTransform.value.copy(g.matrix),(u!==g||h!==g.version||d!==n.toneMapping)&&(s.material.needsUpdate=!0,u=g,h=g.version,d=n.toneMapping),s.layers.enableAll(),w.unshift(s,s.geometry,s.material,0,0,null))}function v(w,S){w.getRGB(Gc,Sd(n)),t.buffers.color.setClear(Gc.r,Gc.g,Gc.b,S,o)}function x(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),s!==void 0&&(s.geometry.dispose(),s.material.dispose(),s=void 0)}return{getClearColor:function(){return r},setClearColor:function(w,S=1){r.set(w),l=S,v(r,l)},getClearAlpha:function(){return l},setClearAlpha:function(w){l=w,v(r,l)},render:y,addToRenderList:b,dispose:x}}function $1(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),a={},i=d(null),o=i,r=!1;function l(H,W,V,N,O){let T=!1,E=h(H,N,V,W);o!==E&&(o=E,c(o.object)),T=m(H,N,V,O),T&&y(H,N,V,O),O!==null&&e.update(O,n.ELEMENT_ARRAY_BUFFER),(T||r)&&(r=!1,g(H,W,V,N),O!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(O).buffer))}function s(){return n.createVertexArray()}function c(H){return n.bindVertexArray(H)}function u(H){return n.deleteVertexArray(H)}function h(H,W,V,N){let O=N.wireframe===!0,T=a[W.id];T===void 0&&(T={},a[W.id]=T);let E=H.isInstancedMesh===!0?H.id:0,A=T[E];A===void 0&&(A={},T[E]=A);let f=A[V.id];f===void 0&&(f={},A[V.id]=f);let M=f[O];return M===void 0&&(M=d(s()),f[O]=M),M}function d(H){let W=[],V=[],N=[];for(let O=0;O<t;O++)W[O]=0,V[O]=0,N[O]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:W,enabledAttributes:V,attributeDivisors:N,object:H,attributes:{},index:null}}function m(H,W,V,N){let O=o.attributes,T=W.attributes,E=0,A=V.getAttributes();for(let f in A)if(A[f].location>=0){let _=O[f],C=T[f];if(C===void 0&&(f==="instanceMatrix"&&H.instanceMatrix&&(C=H.instanceMatrix),f==="instanceColor"&&H.instanceColor&&(C=H.instanceColor)),_===void 0||_.attribute!==C||C&&_.data!==C.data)return!0;E++}return o.attributesNum!==E||o.index!==N}function y(H,W,V,N){let O={},T=W.attributes,E=0,A=V.getAttributes();for(let f in A)if(A[f].location>=0){let _=T[f];_===void 0&&(f==="instanceMatrix"&&H.instanceMatrix&&(_=H.instanceMatrix),f==="instanceColor"&&H.instanceColor&&(_=H.instanceColor));let C={};C.attribute=_,_&&_.data&&(C.data=_.data),O[f]=C,E++}o.attributes=O,o.attributesNum=E,o.index=N}function b(){let H=o.newAttributes;for(let W=0,V=H.length;W<V;W++)H[W]=0}function v(H){x(H,0)}function x(H,W){let V=o.newAttributes,N=o.enabledAttributes,O=o.attributeDivisors;V[H]=1,N[H]===0&&(n.enableVertexAttribArray(H),N[H]=1),O[H]!==W&&(n.vertexAttribDivisor(H,W),O[H]=W)}function w(){let H=o.newAttributes,W=o.enabledAttributes;for(let V=0,N=W.length;V<N;V++)W[V]!==H[V]&&(n.disableVertexAttribArray(V),W[V]=0)}function S(H,W,V,N,O,T,E){E===!0?n.vertexAttribIPointer(H,W,V,O,T):n.vertexAttribPointer(H,W,V,N,O,T)}function g(H,W,V,N){b();let O=N.attributes,T=V.getAttributes(),E=W.defaultAttributeValues;for(let A in T){let f=T[A];if(f.location>=0){let M=O[A];if(M===void 0&&(A==="instanceMatrix"&&H.instanceMatrix&&(M=H.instanceMatrix),A==="instanceColor"&&H.instanceColor&&(M=H.instanceColor)),M!==void 0){let _=M.normalized,C=M.itemSize,D=e.get(M);if(D===void 0)continue;let B=D.buffer,k=D.type,Q=D.bytesPerElement,G=k===n.INT||k===n.UNSIGNED_INT||M.gpuType===tc;if(M.isInterleavedBufferAttribute){let J=M.data,he=J.stride,ve=M.offset;if(J.isInstancedInterleavedBuffer){for(let ye=0;ye<f.locationSize;ye++)x(f.location+ye,J.meshPerAttribute);H.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let ye=0;ye<f.locationSize;ye++)v(f.location+ye);n.bindBuffer(n.ARRAY_BUFFER,B);for(let ye=0;ye<f.locationSize;ye++)S(f.location+ye,C/f.locationSize,k,_,he*Q,(ve+C/f.locationSize*ye)*Q,G)}else{if(M.isInstancedBufferAttribute){for(let J=0;J<f.locationSize;J++)x(f.location+J,M.meshPerAttribute);H.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=M.meshPerAttribute*M.count)}else for(let J=0;J<f.locationSize;J++)v(f.location+J);n.bindBuffer(n.ARRAY_BUFFER,B);for(let J=0;J<f.locationSize;J++)S(f.location+J,C/f.locationSize,k,_,C*Q,C/f.locationSize*J*Q,G)}}else if(E!==void 0){let _=E[A];if(_!==void 0)switch(_.length){case 2:n.vertexAttrib2fv(f.location,_);break;case 3:n.vertexAttrib3fv(f.location,_);break;case 4:n.vertexAttrib4fv(f.location,_);break;default:n.vertexAttrib1fv(f.location,_)}}}}w()}function L(){P();for(let H in a){let W=a[H];for(let V in W){let N=W[V];for(let O in N){let T=N[O];for(let E in T)u(T[E].object),delete T[E];delete N[O]}}delete a[H]}}function R(H){if(a[H.id]===void 0)return;let W=a[H.id];for(let V in W){let N=W[V];for(let O in N){let T=N[O];for(let E in T)u(T[E].object),delete T[E];delete N[O]}}delete a[H.id]}function z(H){for(let W in a){let V=a[W];for(let N in V){let O=V[N];if(O[H.id]===void 0)continue;let T=O[H.id];for(let E in T)u(T[E].object),delete T[E];delete O[H.id]}}}function p(H){for(let W in a){let V=a[W],N=H.isInstancedMesh===!0?H.id:0,O=V[N];if(O!==void 0){for(let T in O){let E=O[T];for(let A in E)u(E[A].object),delete E[A];delete O[T]}delete V[N],Object.keys(V).length===0&&delete a[W]}}}function P(){F(),r=!0,o!==i&&(o=i,c(o.object))}function F(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:l,reset:P,resetDefaultState:F,dispose:L,releaseStatesOfGeometry:R,releaseStatesOfObject:p,releaseStatesOfProgram:z,initAttributes:b,enableAttribute:v,disableUnusedAttributes:w}}function Z1(n,e,t){let a;function i(s){a=s}function o(s,c){n.drawArrays(a,s,c),t.update(c,a,1)}function r(s,c,u){u!==0&&(n.drawArraysInstanced(a,s,c,u),t.update(c,a,u))}function l(s,c,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(a,s,0,c,0,u);let d=0;for(let m=0;m<u;m++)d+=c[m];t.update(d,a,1)}this.setMode=i,this.render=o,this.renderInstances=r,this.renderMultiDraw=l}function J1(n,e,t,a){let i;function o(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){let z=e.get("EXT_texture_filter_anisotropic");i=n.getParameter(z.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function r(z){return!(z!==na&&a.convert(z)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function l(z){let p=z===ta&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(z!==$n&&z!==_a&&!p&&a.convert(z)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE))}function s(z){if(z==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";z="mediump"}return z==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",u=s(c);u!==c&&(xt("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let h=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&xt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let m=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),y=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),b=n.getParameter(n.MAX_TEXTURE_SIZE),v=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),x=n.getParameter(n.MAX_VERTEX_ATTRIBS),w=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),S=n.getParameter(n.MAX_VARYING_VECTORS),g=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),L=n.getParameter(n.MAX_SAMPLES),R=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:o,getMaxPrecision:s,textureFormatReadable:r,textureTypeReadable:l,precision:c,logarithmicDepthBuffer:h,reversedDepthBuffer:d,maxTextures:m,maxVertexTextures:y,maxTextureSize:b,maxCubemapSize:v,maxAttributes:x,maxVertexUniforms:w,maxVaryings:S,maxFragmentUniforms:g,maxSamples:L,samples:R}}function K1(n){let e=this,t=null,a=0,i=!1,o=!1,r=new za,l=new Mt,s={value:null,needsUpdate:!1};this.uniform=s,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){let m=h.length!==0||d||a!==0||i;return i=d,a=h.length,m},this.beginShadows=function(){o=!0,u(null)},this.endShadows=function(){o=!1},this.setGlobalState=function(h,d){t=u(h,d,0)},this.setState=function(h,d,m){let y=h.clippingPlanes,b=h.clipIntersection,v=h.clipShadows,x=n.get(h);if(!i||y===null||y.length===0||o&&!v)o?u(null):c();else{let w=o?0:a,S=w*4,g=x.clippingState||null;s.value=g,g=u(y,d,S,m);for(let L=0;L!==S;++L)g[L]=t[L];x.clippingState=g,this.numIntersection=b?this.numPlanes:0,this.numPlanes+=w}};function c(){s.value!==t&&(s.value=t,s.needsUpdate=a>0),e.numPlanes=a,e.numIntersection=0}function u(h,d,m,y){let b=h!==null?h.length:0,v=null;if(b!==0){if(v=s.value,y!==!0||v===null){let x=m+b*4,w=d.matrixWorldInverse;l.getNormalMatrix(w),(v===null||v.length<x)&&(v=new Float32Array(x));for(let S=0,g=m;S!==b;++S,g+=4)r.copy(h[S]).applyMatrix4(w,l),r.normal.toArray(v,g),v[g+3]=r.constant}s.value=v,s.needsUpdate=!0}return e.numPlanes=b,e.numIntersection=0,v}}var rr=4,Q1=6,ey=20,ty=256,ls=new Ui,D0=new at,Rd=null,Cd=0,zd=0,Pd=!1,ny=new X,xo=new X,kc=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,a=.1,i=100,o={}){let{size:r=256,position:l=ny}=o;Rd=this._renderer.getRenderTarget(),Cd=this._renderer.getActiveCubeFace(),zd=this._renderer.getActiveMipmapLevel(),Pd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(r);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,a,i,s,l),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=F0(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=U0(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Rd,Cd,zd),this._renderer.xr.enabled=Pd,e.scissorTest=!1,or(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Bi||e.mapping===mo?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Rd=this._renderer.getRenderTarget(),Cd=this._renderer.getActiveCubeFace(),zd=this._renderer.getActiveMipmapLevel(),Pd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let a=t||this._allocateTargets();return this._textureToCubeUV(e,a),this._applyPMREM(a),this._cleanup(a),a}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,a={magFilter:mn,minFilter:mn,generateMipmaps:!1,type:ta,format:na,colorSpace:Ir,depthBuffer:!1},i=N0(e,t,a);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=N0(e,t,a);let{_lodMax:o}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=ay(o)),this._blurMaterial=oy(o,e,t),this._ggxMaterial=iy(o,e,t)}return i}_compileMaterial(e){let t=new xe(new lt,e);this._renderer.compile(t,ls)}_sceneToCubeUV(e,t,a,i,o){let s=new Nn(90,1,t,a),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,m=h.toneMapping;h.getClearColor(D0),h.toneMapping=La,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(i),h.clearDepth(),h.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new xe(new Se,new Xt({name:"PMREM.Background",side:Hn,depthWrite:!1,depthTest:!1})));let b=this._backgroundBox,v=b.material,x=!1,w=e.background;w?w.isColor&&(v.color.copy(w),e.background=null,x=!0):(v.color.copy(D0),x=!0);for(let S=0;S<6;S++){let g=S%3;g===0?(s.up.set(0,c[S],0),s.position.set(o.x,o.y,o.z),s.lookAt(o.x+u[S],o.y,o.z)):g===1?(s.up.set(0,0,c[S]),s.position.set(o.x,o.y,o.z),s.lookAt(o.x,o.y+u[S],o.z)):(s.up.set(0,c[S],0),s.position.set(o.x,o.y,o.z),s.lookAt(o.x,o.y,o.z+u[S]));let L=this._cubeSize;or(i,g*L,S>2?L:0,L,L),h.setRenderTarget(i),x&&h.render(b,s),h.render(e,s)}h.toneMapping=m,h.autoClear=d,e.background=w}_textureToCubeUV(e,t){let a=this._renderer,i=e.mapping===Bi||e.mapping===mo;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=F0()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=U0());let o=i?this._cubemapMaterial:this._equirectMaterial,r=this._lodMeshes[0];r.material=o;let l=o.uniforms;l.envMap.value=e;let s=this._cubeSize;or(t,0,0,3*s,2*s),a.setRenderTarget(t),a.render(r,ls)}_applyPMREM(e){let t=this._renderer,a=t.autoClear;t.autoClear=!1;let i=this._lodMeshes.length;for(let o=1;o<i;o++)this._applyGGXFilter(e,o-1,o);t.autoClear=a}_applyGGXFilter(e,t,a){let i=this._renderer,o=this._pingPongRenderTarget,r=this._ggxMaterial,l=this._lodMeshes[a];l.material=r;let s=r.uniforms,c=a/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),h=Math.sqrt(c*c-u*u),d=c*1.25,m=h*d,{_lodMax:y}=this,b=this._sizeLods[a],v=3*b*(a>y-rr?a-y+rr:0),x=4*(this._cubeSize-b);s.envMap.value=e.texture,s.roughness.value=m,s.mipInt.value=y-t,or(o,v,x,3*b,2*b),i.setRenderTarget(o),i.render(l,ls),s.envMap.value=o.texture,s.roughness.value=0,s.mipInt.value=y-a,or(e,v,x,3*b,2*b),i.setRenderTarget(e),i.render(l,ls)}_blur(e,t,a,i){let o=this._pingPongRenderTarget,r=Math.min(i,Math.PI)/Math.SQRT2;this._blurPass(e,o,t,a,r),this._blurPass(o,e,a,a,r)}_blurPass(e,t,a,i,o){let r=this._renderer,l=this._blurMaterial,s=this._lodMeshes[i];s.material=l;let c=l.uniforms;c.envMap.value=e.texture,c.sigma.value=o,c.mipInt.value=this._lodMax-a;let u=this._sizeLods[i],h=3*u*(i>this._lodMax-rr?i-this._lodMax+rr:0),d=4*(this._cubeSize-u);or(t,h,d,3*u,2*u),r.setRenderTarget(t),r.render(s,ls)}};function ay(n){let e=[],t=[],a=n,i=n-rr+1+Q1;for(let o=0;o<i;o++){let r=Math.pow(2,a);e.push(r);let l=1/(r-2),s=-l,c=1+l,u=[s,s,c,s,c,c,s,s,c,c,s,c],h=6,d=6,m=3,y=new Float32Array(m*d*h),b=new Float32Array(m*d*h);for(let x=0;x<h;x++){let w=x%3*2/3-1,S=x>2?0:-1,g=[w,S,0,w+2/3,S,0,w+2/3,S+1,0,w,S,0,w+2/3,S+1,0,w,S+1,0];y.set(g,m*d*x);for(let L=0;L<d;L++){let R=u[L*2]*2-1,z=u[L*2+1]*2-1;x===0?xo.set(1,z,R):x===1?xo.set(-R,1,-z):x===2?xo.set(-R,z,1):x===3?xo.set(-1,z,-R):x===4?xo.set(-R,-1,z):xo.set(R,z,-1),xo.toArray(b,(x*d+L)*m)}}let v=new lt;v.setAttribute("position",new Ft(y,m)),v.setAttribute("outputDirection",new Ft(b,m)),t.push(new xe(v,null)),a>rr&&a--}return{lodMeshes:t,sizeLods:e}}function N0(n,e,t){let a=new Fn(n,e,t);return a.texture.mapping=es,a.texture.name="PMREM.cubeUv",a.scissorTest=!0,a}function or(n,e,t,a,i){n.viewport.set(e,t,a,i),n.scissor.set(e,t,a,i)}function iy(n,e,t){return new $t({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:ty,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:jc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:ja,depthTest:!1,depthWrite:!1})}function oy(n,e,t){return new $t({name:"SphericalGaussianBlur",defines:{SAMPLES:ey,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:jc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:ja,depthTest:!1,depthWrite:!1})}function U0(){return new $t({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:jc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:ja,depthTest:!1,depthWrite:!1})}function F0(){return new $t({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:jc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ja,depthTest:!1,depthWrite:!1})}function jc(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var qc=class extends Fn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let a={width:e,height:e,depth:1},i=[a,a,a,a,a,a];this.texture=new Hr(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let a={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new Se(5,5,5),o=new $t({name:"CubemapFromEquirect",uniforms:go(a.uniforms),vertexShader:a.vertexShader,fragmentShader:a.fragmentShader,side:Hn,blending:ja});o.uniforms.tEquirect.value=t;let r=new xe(i,o),l=t.minFilter;return t.minFilter===Hi&&(t.minFilter=mn),new $l(1,10,this).update(e,r),t.minFilter=l,r.geometry.dispose(),r.material.dispose(),this}clear(e,t=!0,a=!0,i=!0){let o=e.getRenderTarget();for(let r=0;r<6;r++)e.setRenderTarget(this,r),e.clear(t,a,i);e.setRenderTarget(o)}};function ry(n){let e=new WeakMap,t=new WeakMap,a=null;function i(d,m=!1){return d==null?null:m?r(d):o(d)}function o(d){if(d&&d.isTexture){let m=d.mapping;if(m===Kl||m===Ql)if(e.has(d)){let y=e.get(d).texture;return l(y,d.mapping)}else{let y=d.image;if(y&&y.height>0){let b=new qc(y.height);return b.fromEquirectangularTexture(n,d),e.set(d,b),d.addEventListener("dispose",c),l(b.texture,d.mapping)}else return null}}return d}function r(d){if(d&&d.isTexture){let m=d.mapping,y=m===Kl||m===Ql,b=m===Bi||m===mo;if(y||b){let v=t.get(d),x=v!==void 0?v.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==x)return a===null&&(a=new kc(n)),v=y?a.fromEquirectangular(d,v):a.fromCubemap(d,v),v.texture.pmremVersion=d.pmremVersion,t.set(d,v),v.texture;if(v!==void 0)return v.texture;{let w=d.image;return y&&w&&w.height>0||b&&w&&s(w)?(a===null&&(a=new kc(n)),v=y?a.fromEquirectangular(d):a.fromCubemap(d),v.texture.pmremVersion=d.pmremVersion,t.set(d,v),d.addEventListener("dispose",u),v.texture):null}}}return d}function l(d,m){return m===Kl?d.mapping=Bi:m===Ql&&(d.mapping=mo),d}function s(d){let m=0,y=6;for(let b=0;b<y;b++)d[b]!==void 0&&m++;return m===y}function c(d){let m=d.target;m.removeEventListener("dispose",c);let y=e.get(m);y!==void 0&&(e.delete(m),y.dispose())}function u(d){let m=d.target;m.removeEventListener("dispose",u);let y=t.get(m);y!==void 0&&(t.delete(m),y.dispose())}function h(){e=new WeakMap,t=new WeakMap,a!==null&&(a.dispose(),a=null)}return{get:i,dispose:h}}function sy(n){let e={};function t(a){if(e[a]!==void 0)return e[a];let i=n.getExtension(a);return e[a]=i,i}return{has:function(a){return t(a)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(a){let i=t(a);return i===null&&io("WebGLRenderer: "+a+" extension not supported."),i}}}function ly(n,e,t,a){let i={},o=new WeakMap;function r(h){let d=h.target;d.index!==null&&e.remove(d.index);for(let y in d.attributes)e.remove(d.attributes[y]);d.removeEventListener("dispose",r),delete i[d.id];let m=o.get(d);m&&(e.remove(m),o.delete(d)),a.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function l(h,d){return i[d.id]===!0||(d.addEventListener("dispose",r),i[d.id]=!0,t.memory.geometries++),d}function s(h){let d=h.attributes;for(let m in d)e.update(d[m],n.ARRAY_BUFFER)}function c(h){let d=[],m=h.index,y=h.attributes.position,b=0;if(y===void 0)return;if(m!==null){let w=m.array;b=m.version;for(let S=0,g=w.length;S<g;S+=3){let L=w[S+0],R=w[S+1],z=w[S+2];d.push(L,R,R,z,z,L)}}else{let w=y.array;b=y.version;for(let S=0,g=w.length/3-1;S<g;S+=3){let L=S+0,R=S+1,z=S+2;d.push(L,R,R,z,z,L)}}let v=new(y.count>=65535?Br:Fr)(d,1);v.version=b;let x=o.get(h);x&&e.remove(x),o.set(h,v)}function u(h){let d=o.get(h);if(d){let m=h.index;m!==null&&d.version<m.version&&c(h)}else c(h);return o.get(h)}return{get:l,update:s,getWireframeAttribute:u}}function cy(n,e,t){let a;function i(h){a=h}let o,r;function l(h){o=h.type,r=h.bytesPerElement}function s(h,d){n.drawElements(a,d,o,h*r),t.update(d,a,1)}function c(h,d,m){m!==0&&(n.drawElementsInstanced(a,d,o,h*r,m),t.update(d,a,m))}function u(h,d,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(a,d,0,o,h,0,m);let b=0;for(let v=0;v<m;v++)b+=d[v];t.update(b,a,1)}this.setMode=i,this.setIndex=l,this.render=s,this.renderInstances=c,this.renderMultiDraw=u}function uy(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function a(o,r,l){switch(t.calls++,r){case n.TRIANGLES:t.triangles+=l*(o/3);break;case n.LINES:t.lines+=l*(o/2);break;case n.LINE_STRIP:t.lines+=l*(o-1);break;case n.LINE_LOOP:t.lines+=l*o;break;case n.POINTS:t.points+=l*o;break;default:bt("WebGLInfo: Unknown draw mode:",r);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:a}}function dy(n,e,t){let a=new WeakMap,i=new gn;function o(r,l,s){let c=r.morphTargetInfluences,u=l.morphAttributes.position||l.morphAttributes.normal||l.morphAttributes.color,h=u!==void 0?u.length:0,d=a.get(l);if(d===void 0||d.count!==h){let P=function(){z.dispose(),a.delete(l),l.removeEventListener("dispose",P)};d!==void 0&&d.texture.dispose();let m=l.morphAttributes.position!==void 0,y=l.morphAttributes.normal!==void 0,b=l.morphAttributes.color!==void 0,v=l.morphAttributes.position||[],x=l.morphAttributes.normal||[],w=l.morphAttributes.color||[],S=0;m===!0&&(S=1),y===!0&&(S=2),b===!0&&(S=3);let g=l.attributes.position.count*S,L=1;g>e.maxTextureSize&&(L=Math.ceil(g/e.maxTextureSize),g=e.maxTextureSize);let R=new Float32Array(g*L*4*h),z=new Dr(R,g,L,h);z.type=_a,z.needsUpdate=!0;let p=S*4;for(let F=0;F<h;F++){let H=v[F],W=x[F],V=w[F],N=g*L*4*F;for(let O=0;O<H.count;O++){let T=O*p;m===!0&&(i.fromBufferAttribute(H,O),R[N+T+0]=i.x,R[N+T+1]=i.y,R[N+T+2]=i.z,R[N+T+3]=0),y===!0&&(i.fromBufferAttribute(W,O),R[N+T+4]=i.x,R[N+T+5]=i.y,R[N+T+6]=i.z,R[N+T+7]=0),b===!0&&(i.fromBufferAttribute(V,O),R[N+T+8]=i.x,R[N+T+9]=i.y,R[N+T+10]=i.z,R[N+T+11]=V.itemSize===4?i.w:1)}}d={count:h,texture:z,size:new nt(g,L)},a.set(l,d),l.addEventListener("dispose",P)}if(r.isInstancedMesh===!0&&r.morphTexture!==null)s.getUniforms().setValue(n,"morphTexture",r.morphTexture,t);else{let m=0;for(let b=0;b<c.length;b++)m+=c[b];let y=l.morphTargetsRelative?1:1-m;s.getUniforms().setValue(n,"morphTargetBaseInfluence",y),s.getUniforms().setValue(n,"morphTargetInfluences",c)}s.getUniforms().setValue(n,"morphTargetsTexture",d.texture,t),s.getUniforms().setValue(n,"morphTargetsTextureSize",d.size)}return{update:o}}function hy(n,e,t,a,i){let o=new WeakMap;function r(c){let u=i.render.frame,h=c.geometry,d=e.get(c,h);if(o.get(d)!==u&&(e.update(d),o.set(d,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",s)===!1&&c.addEventListener("dispose",s),o.get(c)!==u&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),o.set(c,u))),c.isSkinnedMesh){let m=c.skeleton;o.get(m)!==u&&(m.update(),o.set(m,u))}return d}function l(){o=new WeakMap}function s(c){let u=c.target;u.removeEventListener("dispose",s),a.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:r,dispose:l}}var fy={[sd]:"LINEAR_TONE_MAPPING",[ld]:"REINHARD_TONE_MAPPING",[cd]:"CINEON_TONE_MAPPING",[Qr]:"ACES_FILMIC_TONE_MAPPING",[dd]:"AGX_TONE_MAPPING",[hd]:"NEUTRAL_TONE_MAPPING",[ud]:"CUSTOM_TONE_MAPPING"};function py(n,e,t,a,i,o){let r=new Fn(e,t,{type:n,depthBuffer:i,stencilBuffer:o,samples:a?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),l=null,s=null,c=new lt;c.setAttribute("position",new Ze([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new Ze([0,2,0,0,2,0],2));let u=new Ul({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),h=new xe(c,u),d=new Ui(-1,1,1,-1,0,1),m=null,y=null,b=!1,v,x=null,w=[],S=!1;this.setSize=function(g,L){r.setSize(g,L),l!==null&&l.setSize(g,L),s!==null&&s.setSize(g,L);for(let R=0;R<w.length;R++){let z=w[R];z.setSize&&z.setSize(g,L)}},this.setEffects=function(g){w=g,S=w.length>0&&w[0].isRenderPass===!0;let L=r.width,R=r.height;w.length>0&&l===null&&(l=new Fn(L,R,{type:ta,depthBuffer:!1,stencilBuffer:!1}),s=new Fn(L,R,{type:ta,depthBuffer:!1,stencilBuffer:!1}));for(let z=0;z<w.length;z++){let p=w[z];p.setSize&&p.setSize(L,R)}},this.begin=function(g,L){if(b||g.toneMapping===La&&w.length===0)return!1;if(x=L,L!==null){let R=L.width,z=L.height;(r.width!==R||r.height!==z)&&this.setSize(R,z)}return S===!1&&g.setRenderTarget(r),v=g.toneMapping,g.toneMapping=La,!0},this.hasRenderPass=function(){return S},this.end=function(g,L){g.toneMapping=v,b=!0;let R=r,z=l;for(let p=0;p<w.length;p++){let P=w[p];P.enabled!==!1&&(P.render(g,z,R,L),P.needsSwap!==!1&&(R=z,z=z===l?s:l))}if(m!==g.outputColorSpace||y!==g.toneMapping){m=g.outputColorSpace,y=g.toneMapping,u.defines={},Dt.getTransfer(m)===Kt&&(u.defines.SRGB_TRANSFER="");let p=fy[y];p&&(u.defines[p]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=R.texture,g.setRenderTarget(x),g.render(h,d),x=null,b=!1},this.isCompositing=function(){return b},this.dispose=function(){r.dispose(),l!==null&&l.dispose(),s!==null&&s.dispose(),c.dispose(),u.dispose()}}var ap=new jn,Dd=new Ii(1,1),ip=new Dr,op=new Tl,rp=new Hr,B0=[],H0=[],O0=new Float32Array(16),G0=new Float32Array(9),V0=new Float32Array(4);function lr(n,e,t){let a=n[0];if(a<=0||a>0)return n;let i=e*t,o=B0[i];if(o===void 0&&(o=new Float32Array(i),B0[i]=o),e!==0){a.toArray(o,0);for(let r=1,l=0;r!==e;++r)l+=t,n[r].toArray(o,l)}return o}function zn(n,e){if(n.length!==e.length)return!1;for(let t=0,a=n.length;t<a;t++)if(n[t]!==e[t])return!1;return!0}function Pn(n,e){for(let t=0,a=e.length;t<a;t++)n[t]=e[t]}function Xc(n,e){let t=H0[e];t===void 0&&(t=new Int32Array(e),H0[e]=t);for(let a=0;a!==e;++a)t[a]=n.allocateTextureUnit();return t}function my(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function gy(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(zn(t,e))return;n.uniform2fv(this.addr,e),Pn(t,e)}}function xy(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(zn(t,e))return;n.uniform3fv(this.addr,e),Pn(t,e)}}function vy(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(zn(t,e))return;n.uniform4fv(this.addr,e),Pn(t,e)}}function yy(n,e){let t=this.cache,a=e.elements;if(a===void 0){if(zn(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Pn(t,e)}else{if(zn(t,a))return;V0.set(a),n.uniformMatrix2fv(this.addr,!1,V0),Pn(t,a)}}function by(n,e){let t=this.cache,a=e.elements;if(a===void 0){if(zn(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Pn(t,e)}else{if(zn(t,a))return;G0.set(a),n.uniformMatrix3fv(this.addr,!1,G0),Pn(t,a)}}function My(n,e){let t=this.cache,a=e.elements;if(a===void 0){if(zn(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Pn(t,e)}else{if(zn(t,a))return;O0.set(a),n.uniformMatrix4fv(this.addr,!1,O0),Pn(t,a)}}function _y(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Ey(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(zn(t,e))return;n.uniform2iv(this.addr,e),Pn(t,e)}}function Sy(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(zn(t,e))return;n.uniform3iv(this.addr,e),Pn(t,e)}}function Ty(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(zn(t,e))return;n.uniform4iv(this.addr,e),Pn(t,e)}}function wy(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Ay(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(zn(t,e))return;n.uniform2uiv(this.addr,e),Pn(t,e)}}function Ry(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(zn(t,e))return;n.uniform3uiv(this.addr,e),Pn(t,e)}}function Cy(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(zn(t,e))return;n.uniform4uiv(this.addr,e),Pn(t,e)}}function zy(n,e,t){let a=this.cache,i=t.allocateTextureUnit();a[0]!==i&&(n.uniform1i(this.addr,i),a[0]=i);let o;this.type===n.SAMPLER_2D_SHADOW?(Dd.compareFunction=t.isReversedDepthBuffer()?Hc:Bc,o=Dd):o=ap,t.setTexture2D(e||o,i)}function Py(n,e,t){let a=this.cache,i=t.allocateTextureUnit();a[0]!==i&&(n.uniform1i(this.addr,i),a[0]=i),t.setTexture3D(e||op,i)}function Iy(n,e,t){let a=this.cache,i=t.allocateTextureUnit();a[0]!==i&&(n.uniform1i(this.addr,i),a[0]=i),t.setTextureCube(e||rp,i)}function Ly(n,e,t){let a=this.cache,i=t.allocateTextureUnit();a[0]!==i&&(n.uniform1i(this.addr,i),a[0]=i),t.setTexture2DArray(e||ip,i)}function Dy(n){switch(n){case 5126:return my;case 35664:return gy;case 35665:return xy;case 35666:return vy;case 35674:return yy;case 35675:return by;case 35676:return My;case 5124:case 35670:return _y;case 35667:case 35671:return Ey;case 35668:case 35672:return Sy;case 35669:case 35673:return Ty;case 5125:return wy;case 36294:return Ay;case 36295:return Ry;case 36296:return Cy;case 35678:case 36198:case 36298:case 36306:case 35682:return zy;case 35679:case 36299:case 36307:return Py;case 35680:case 36300:case 36308:case 36293:return Iy;case 36289:case 36303:case 36311:case 36292:return Ly}}function Ny(n,e){n.uniform1fv(this.addr,e)}function Uy(n,e){let t=lr(e,this.size,2);n.uniform2fv(this.addr,t)}function Fy(n,e){let t=lr(e,this.size,3);n.uniform3fv(this.addr,t)}function By(n,e){let t=lr(e,this.size,4);n.uniform4fv(this.addr,t)}function Hy(n,e){let t=lr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function Oy(n,e){let t=lr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function Gy(n,e){let t=lr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function Vy(n,e){n.uniform1iv(this.addr,e)}function ky(n,e){n.uniform2iv(this.addr,e)}function qy(n,e){n.uniform3iv(this.addr,e)}function Wy(n,e){n.uniform4iv(this.addr,e)}function jy(n,e){n.uniform1uiv(this.addr,e)}function Xy(n,e){n.uniform2uiv(this.addr,e)}function Yy(n,e){n.uniform3uiv(this.addr,e)}function $y(n,e){n.uniform4uiv(this.addr,e)}function Zy(n,e,t){let a=this.cache,i=e.length,o=Xc(t,i);zn(a,o)||(n.uniform1iv(this.addr,o),Pn(a,o));let r;this.type===n.SAMPLER_2D_SHADOW?r=Dd:r=ap;for(let l=0;l!==i;++l)t.setTexture2D(e[l]||r,o[l])}function Jy(n,e,t){let a=this.cache,i=e.length,o=Xc(t,i);zn(a,o)||(n.uniform1iv(this.addr,o),Pn(a,o));for(let r=0;r!==i;++r)t.setTexture3D(e[r]||op,o[r])}function Ky(n,e,t){let a=this.cache,i=e.length,o=Xc(t,i);zn(a,o)||(n.uniform1iv(this.addr,o),Pn(a,o));for(let r=0;r!==i;++r)t.setTextureCube(e[r]||rp,o[r])}function Qy(n,e,t){let a=this.cache,i=e.length,o=Xc(t,i);zn(a,o)||(n.uniform1iv(this.addr,o),Pn(a,o));for(let r=0;r!==i;++r)t.setTexture2DArray(e[r]||ip,o[r])}function eb(n){switch(n){case 5126:return Ny;case 35664:return Uy;case 35665:return Fy;case 35666:return By;case 35674:return Hy;case 35675:return Oy;case 35676:return Gy;case 5124:case 35670:return Vy;case 35667:case 35671:return ky;case 35668:case 35672:return qy;case 35669:case 35673:return Wy;case 5125:return jy;case 36294:return Xy;case 36295:return Yy;case 36296:return $y;case 35678:case 36198:case 36298:case 36306:case 35682:return Zy;case 35679:case 36299:case 36307:return Jy;case 35680:case 36300:case 36308:case 36293:return Ky;case 36289:case 36303:case 36311:case 36292:return Qy}}var Nd=class{constructor(e,t,a){this.id=e,this.addr=a,this.cache=[],this.type=t.type,this.setValue=Dy(t.type)}},Ud=class{constructor(e,t,a){this.id=e,this.addr=a,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=eb(t.type)}},Fd=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,a){let i=this.seq;for(let o=0,r=i.length;o!==r;++o){let l=i[o];l.setValue(e,t[l.id],a)}}},Id=/(\w+)(\])?(\[|\.)?/g;function k0(n,e){n.seq.push(e),n.map[e.id]=e}function tb(n,e,t){let a=n.name,i=a.length;for(Id.lastIndex=0;;){let o=Id.exec(a),r=Id.lastIndex,l=o[1],s=o[2]==="]",c=o[3];if(s&&(l=l|0),c===void 0||c==="["&&r+2===i){k0(t,c===void 0?new Nd(l,n,e):new Ud(l,n,e));break}else{let h=t.map[l];h===void 0&&(h=new Fd(l),k0(t,h)),t=h}}}var sr=class{constructor(e,t){this.seq=[],this.map={};let a=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<a;++r){let l=e.getActiveUniform(t,r),s=e.getUniformLocation(t,l.name);tb(l,s,this)}let i=[],o=[];for(let r of this.seq)r.type===e.SAMPLER_2D_SHADOW||r.type===e.SAMPLER_CUBE_SHADOW||r.type===e.SAMPLER_2D_ARRAY_SHADOW?i.push(r):o.push(r);i.length>0&&(this.seq=i.concat(o))}setValue(e,t,a,i){let o=this.map[t];o!==void 0&&o.setValue(e,a,i)}setOptional(e,t,a){let i=t[a];i!==void 0&&this.setValue(e,a,i)}static upload(e,t,a,i){for(let o=0,r=t.length;o!==r;++o){let l=t[o],s=a[l.id];s.needsUpdate!==!1&&l.setValue(e,s.value,i)}}static seqWithValue(e,t){let a=[];for(let i=0,o=e.length;i!==o;++i){let r=e[i];r.id in t&&a.push(r)}return a}};function q0(n,e,t){let a=n.createShader(e);return n.shaderSource(a,t),n.compileShader(a),a}var nb=37297,ab=0;function ib(n,e){let t=n.split(`
`),a=[],i=Math.max(e-6,0),o=Math.min(e+6,t.length);for(let r=i;r<o;r++){let l=r+1;a.push(`${l===e?">":" "} ${l}: ${t[r]}`)}return a.join(`
`)}var W0=new Mt;function ob(n){Dt._getMatrix(W0,Dt.workingColorSpace,n);let e=`mat3( ${W0.elements.map(t=>t.toFixed(4))} )`;switch(Dt.getTransfer(n)){case Lr:return[e,"LinearTransferOETF"];case Kt:return[e,"sRGBTransferOETF"];default:return xt("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function j0(n,e,t){let a=n.getShaderParameter(e,n.COMPILE_STATUS),o=(n.getShaderInfoLog(e)||"").trim();if(a&&o==="")return"";let r=/ERROR: 0:(\d+)/.exec(o);if(r){let l=parseInt(r[1]);return t.toUpperCase()+`

`+o+`

`+ib(n.getShaderSource(e),l)}else return o}function rb(n,e){let t=ob(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var sb={[sd]:"Linear",[ld]:"Reinhard",[cd]:"Cineon",[Qr]:"ACESFilmic",[dd]:"AgX",[hd]:"Neutral",[ud]:"Custom"};function lb(n,e){let t=sb[e];return t===void 0?(xt("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Vc=new X;function cb(){Dt.getLuminanceCoefficients(Vc);let n=Vc.x.toFixed(4),e=Vc.y.toFixed(4),t=Vc.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function ub(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(us).join(`
`)}function db(n){let e=[];for(let t in n){let a=n[t];a!==!1&&e.push("#define "+t+" "+a)}return e.join(`
`)}function hb(n,e){let t={},a=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let i=0;i<a;i++){let o=n.getActiveAttrib(e,i),r=o.name,l=1;o.type===n.FLOAT_MAT2&&(l=2),o.type===n.FLOAT_MAT3&&(l=3),o.type===n.FLOAT_MAT4&&(l=4),t[r]={type:o.type,location:n.getAttribLocation(e,r),locationSize:l}}return t}function us(n){return n!==""}function X0(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Y0(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var fb=/^[ \t]*#include +<([\w\d./]+)>/gm;function Bd(n){return n.replace(fb,mb)}var pb=new Map;function mb(n,e){let t=zt[e];if(t===void 0){let a=pb.get(e);if(a!==void 0)t=zt[a],xt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,a);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Bd(t)}var gb=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function $0(n){return n.replace(gb,xb)}function xb(n,e,t,a){let i="";for(let o=parseInt(e);o<parseInt(t);o++)i+=a.replace(/\[\s*i\s*\]/g,"[ "+o+" ]").replace(/UNROLLED_LOOP_INDEX/g,o);return i}function Z0(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var vb={[ho]:"SHADOWMAP_TYPE_PCF",[er]:"SHADOWMAP_TYPE_VSM"};function yb(n){return vb[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var bb={[Bi]:"ENVMAP_TYPE_CUBE",[mo]:"ENVMAP_TYPE_CUBE",[es]:"ENVMAP_TYPE_CUBE_UV"};function Mb(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":bb[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var _b={[mo]:"ENVMAP_MODE_REFRACTION"};function Eb(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":_b[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Sb={[Jl]:"ENVMAP_BLENDING_MULTIPLY",[p0]:"ENVMAP_BLENDING_MIX",[m0]:"ENVMAP_BLENDING_ADD"};function Tb(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":Sb[n.combine]||"ENVMAP_BLENDING_NONE"}function wb(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,a=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:a,maxMip:t}}function Ab(n,e,t,a){let i=n.getContext(),o=t.defines,r=t.vertexShader,l=t.fragmentShader,s=yb(t),c=Mb(t),u=Eb(t),h=Tb(t),d=wb(t),m=ub(t),y=db(o),b=i.createProgram(),v,x,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(v=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,y].filter(us).join(`
`),v.length>0&&(v+=`
`),x=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,y].filter(us).join(`
`),x.length>0&&(x+=`
`)):(v=[Z0(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,y,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+s:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(us).join(`
`),x=[Z0(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,y,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+s:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==La?"#define TONE_MAPPING":"",t.toneMapping!==La?zt.tonemapping_pars_fragment:"",t.toneMapping!==La?lb("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",zt.colorspace_pars_fragment,rb("linearToOutputTexel",t.outputColorSpace),cb(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(us).join(`
`)),r=Bd(r),r=X0(r,t),r=Y0(r,t),l=Bd(l),l=X0(l,t),l=Y0(l,t),r=$0(r),l=$0(l),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,v=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+v,x=["#define varying in",t.glslVersion===bd?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===bd?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+x);let S=w+v+r,g=w+x+l,L=q0(i,i.VERTEX_SHADER,S),R=q0(i,i.FRAGMENT_SHADER,g);i.attachShader(b,L),i.attachShader(b,R),t.index0AttributeName!==void 0?i.bindAttribLocation(b,0,t.index0AttributeName):t.hasPositionAttribute===!0&&i.bindAttribLocation(b,0,"position"),i.linkProgram(b);function z(H){if(n.debug.checkShaderErrors){let W=i.getProgramInfoLog(b)||"",V=i.getShaderInfoLog(L)||"",N=i.getShaderInfoLog(R)||"",O=W.trim(),T=V.trim(),E=N.trim(),A=!0,f=!0;if(i.getProgramParameter(b,i.LINK_STATUS)===!1)if(A=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(i,b,L,R);else{let M=j0(i,L,"vertex"),_=j0(i,R,"fragment");bt("WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(b,i.VALIDATE_STATUS)+`

Material Name: `+H.name+`
Material Type: `+H.type+`

Program Info Log: `+O+`
`+M+`
`+_)}else O!==""?xt("WebGLProgram: Program Info Log:",O):(T===""||E==="")&&(f=!1);f&&(H.diagnostics={runnable:A,programLog:O,vertexShader:{log:T,prefix:v},fragmentShader:{log:E,prefix:x}})}i.deleteShader(L),i.deleteShader(R),p=new sr(i,b),P=hb(i,b)}let p;this.getUniforms=function(){return p===void 0&&z(this),p};let P;this.getAttributes=function(){return P===void 0&&z(this),P};let F=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return F===!1&&(F=i.getProgramParameter(b,nb)),F},this.destroy=function(){a.releaseStatesOfProgram(this),i.deleteProgram(b),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=ab++,this.cacheKey=e,this.usedTimes=1,this.program=b,this.vertexShader=L,this.fragmentShader=R,this}var Rb=0,Hd=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,a){let i=this._getShaderCacheForMaterial(e);return i.has(t)===!1&&(i.add(t),t.usedTimes++),i.has(a)===!1&&(i.add(a),a.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let a of t)a.usedTimes--,a.usedTimes===0&&this.shaderCache.delete(a.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,a=t.get(e);return a===void 0&&(a=new Set,t.set(e,a)),a}_getShaderStage(e){let t=this.shaderCache,a=t.get(e);return a===void 0&&(a=new Od(e),t.set(e,a)),a}},Od=class{constructor(e){this.id=Rb++,this.code=e,this.usedTimes=0}};function Cb(n){return n===Gi||n===rs||n===ss}function zb(n,e,t,a,i,o){let r=new Yo,l=new Hd,s=new Set,c=[],u=new Map,h=a.logarithmicDepthBuffer,d=a.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function y(p){return s.add(p),p===0?"uv":`uv${p}`}function b(p,P,F,H,W,V){let N=H.fog,O=W.geometry,T=p.isMeshStandardMaterial||p.isMeshLambertMaterial||p.isMeshPhongMaterial?H.environment:null,E=p.isMeshStandardMaterial||p.isMeshLambertMaterial&&!p.envMap||p.isMeshPhongMaterial&&!p.envMap,A=e.get(p.envMap||T,E),f=A&&A.mapping===es?A.image.height:null,M=m[p.type];p.precision!==null&&(d=a.getMaxPrecision(p.precision),d!==p.precision&&xt("WebGLProgram.getParameters:",p.precision,"not supported, using",d,"instead."));let _=O.morphAttributes.position||O.morphAttributes.normal||O.morphAttributes.color,C=_!==void 0?_.length:0,D=0;O.morphAttributes.position!==void 0&&(D=1),O.morphAttributes.normal!==void 0&&(D=2),O.morphAttributes.color!==void 0&&(D=3);let B,k,Q,G;if(M){let jt=Ya[M];B=jt.vertexShader,k=jt.fragmentShader}else{B=p.vertexShader,k=p.fragmentShader;let jt=l.getVertexShaderStage(p),Gt=l.getFragmentShaderStage(p);l.update(p,jt,Gt),Q=jt.id,G=Gt.id}let J=n.getRenderTarget(),he=n.state.buffers.depth.getReversed(),ve=W.isInstancedMesh===!0,ye=W.isBatchedMesh===!0,Z=!!p.map,ne=!!p.matcap,ee=!!A,ie=!!p.aoMap,q=!!p.lightMap,oe=!!p.bumpMap&&p.wireframe===!1,fe=!!p.normalMap,$=!!p.displacementMap,me=!!p.emissiveMap,Re=!!p.metalnessMap,ze=!!p.roughnessMap,te=p.anisotropy>0,ft=p.clearcoat>0,Ie=p.dispersion>0,Y=p.retroreflectivity>0,U=p.iridescence>0,se=p.sheen>0,pe=p.transmission>0,ce=te&&!!p.anisotropyMap,ge=ft&&!!p.clearcoatMap,I=ft&&!!p.clearcoatNormalMap,ue=ft&&!!p.clearcoatRoughnessMap,be=U&&!!p.iridescenceMap,Te=U&&!!p.iridescenceThicknessMap,Oe=se&&!!p.sheenColorMap,Ne=se&&!!p.sheenRoughnessMap,Fe=!!p.specularMap,Ye=!!p.specularColorMap,re=!!p.specularIntensityMap,Me=pe&&!!p.transmissionMap,ae=pe&&!!p.thicknessMap,De=!!p.gradientMap,Ae=!!p.alphaMap,Ge=p.alphaTest>0,$e=!!p.alphaHash,He=!!p.extensions,ct=La;p.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(ct=n.toneMapping);let rt={shaderID:M,shaderType:p.type,shaderName:p.name,vertexShader:B,fragmentShader:k,defines:p.defines,customVertexShaderID:Q,customFragmentShaderID:G,isRawShaderMaterial:p.isRawShaderMaterial===!0,glslVersion:p.glslVersion,precision:d,batching:ye,batchingColor:ye&&W._colorsTexture!==null,instancing:ve,instancingColor:ve&&W.instanceColor!==null,instancingMorph:ve&&W.morphTexture!==null,outputColorSpace:J===null?n.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:Dt.workingColorSpace,alphaToCoverage:!!p.alphaToCoverage,map:Z,matcap:ne,envMap:ee,envMapMode:ee&&A.mapping,envMapCubeUVHeight:f,aoMap:ie,lightMap:q,bumpMap:oe,normalMap:fe,displacementMap:$,emissiveMap:me,normalMapObjectSpace:fe&&p.normalMapType===v0,normalMapTangentSpace:fe&&p.normalMapType===Fc,packedNormalMap:fe&&p.normalMapType===Fc&&Cb(p.normalMap.format),metalnessMap:Re,roughnessMap:ze,anisotropy:te,anisotropyMap:ce,clearcoat:ft,clearcoatMap:ge,clearcoatNormalMap:I,clearcoatRoughnessMap:ue,dispersion:Ie,retroreflection:Y,iridescence:U,iridescenceMap:be,iridescenceThicknessMap:Te,sheen:se,sheenColorMap:Oe,sheenRoughnessMap:Ne,specularMap:Fe,specularColorMap:Ye,specularIntensityMap:re,transmission:pe,transmissionMap:Me,thicknessMap:ae,gradientMap:De,opaque:p.transparent===!1&&p.blending===Fi&&p.alphaToCoverage===!1,alphaMap:Ae,alphaTest:Ge,alphaHash:$e,combine:p.combine,mapUv:Z&&y(p.map.channel),aoMapUv:ie&&y(p.aoMap.channel),lightMapUv:q&&y(p.lightMap.channel),bumpMapUv:oe&&y(p.bumpMap.channel),normalMapUv:fe&&y(p.normalMap.channel),displacementMapUv:$&&y(p.displacementMap.channel),emissiveMapUv:me&&y(p.emissiveMap.channel),metalnessMapUv:Re&&y(p.metalnessMap.channel),roughnessMapUv:ze&&y(p.roughnessMap.channel),anisotropyMapUv:ce&&y(p.anisotropyMap.channel),clearcoatMapUv:ge&&y(p.clearcoatMap.channel),clearcoatNormalMapUv:I&&y(p.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ue&&y(p.clearcoatRoughnessMap.channel),iridescenceMapUv:be&&y(p.iridescenceMap.channel),iridescenceThicknessMapUv:Te&&y(p.iridescenceThicknessMap.channel),sheenColorMapUv:Oe&&y(p.sheenColorMap.channel),sheenRoughnessMapUv:Ne&&y(p.sheenRoughnessMap.channel),specularMapUv:Fe&&y(p.specularMap.channel),specularColorMapUv:Ye&&y(p.specularColorMap.channel),specularIntensityMapUv:re&&y(p.specularIntensityMap.channel),transmissionMapUv:Me&&y(p.transmissionMap.channel),thicknessMapUv:ae&&y(p.thicknessMap.channel),alphaMapUv:Ae&&y(p.alphaMap.channel),vertexTangents:!!O.attributes.tangent&&(fe||te),vertexNormals:!!O.attributes.normal,vertexColors:p.vertexColors,vertexAlphas:p.vertexColors===!0&&!!O.attributes.color&&O.attributes.color.itemSize===4,pointsUvs:W.isPoints===!0&&!!O.attributes.uv&&(Z||Ae),fog:!!N,useFog:p.fog===!0,fogExp2:!!N&&N.isFogExp2,flatShading:p.wireframe===!1&&(p.flatShading===!0||O.attributes.normal===void 0&&fe===!1&&(p.isMeshLambertMaterial||p.isMeshPhongMaterial||p.isMeshStandardMaterial||p.isMeshPhysicalMaterial)),sizeAttenuation:p.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:he,skinning:W.isSkinnedMesh===!0,hasPositionAttribute:O.attributes.position!==void 0,morphTargets:O.morphAttributes.position!==void 0,morphNormals:O.morphAttributes.normal!==void 0,morphColors:O.morphAttributes.color!==void 0,morphTargetsCount:C,morphTextureStride:D,numSunLights:P.sun.length,numDirLights:P.directional.length,numPointLights:P.point.length,numSpotLights:P.spot.length,numSpotLightMaps:P.spotLightMap.length,numRectAreaLights:P.rectArea.length,numHemiLights:P.hemi.length,numSunLightShadows:P.sunShadowMap.length,numDirLightShadows:P.directionalShadowMap.length,numPointLightShadows:P.pointShadowMap.length,numSpotLightShadows:P.spotShadowMap.length,numSpotLightShadowsWithMaps:P.numSpotLightShadowsWithMaps,numLightProbes:P.numLightProbes,numLightProbeGrids:V.length,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:p.dithering,shadowMapEnabled:n.shadowMap.enabled&&F.length>0,shadowMapType:n.shadowMap.type,toneMapping:ct,decodeVideoTexture:Z&&p.map.isVideoTexture===!0&&Dt.getTransfer(p.map.colorSpace)===Kt,decodeVideoTextureEmissive:me&&p.emissiveMap.isVideoTexture===!0&&Dt.getTransfer(p.emissiveMap.colorSpace)===Kt,premultipliedAlpha:p.premultipliedAlpha,doubleSided:p.side===cn,flipSided:p.side===Hn,useDepthPacking:p.depthPacking>=0,depthPacking:p.depthPacking||0,index0AttributeName:p.index0AttributeName,extensionClipCullDistance:He&&p.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(He&&p.extensions.multiDraw===!0||ye)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:p.customProgramCacheKey()};return rt.vertexUv1s=s.has(1),rt.vertexUv2s=s.has(2),rt.vertexUv3s=s.has(3),s.clear(),rt}function v(p){let P=[];if(p.shaderID?P.push(p.shaderID):(P.push(p.customVertexShaderID),P.push(p.customFragmentShaderID)),p.defines!==void 0)for(let F in p.defines)P.push(F),P.push(p.defines[F]);return p.isRawShaderMaterial===!1&&(x(P,p),w(P,p),P.push(n.outputColorSpace)),P.push(p.customProgramCacheKey),P.join()}function x(p,P){p.push(P.precision),p.push(P.outputColorSpace),p.push(P.envMapMode),p.push(P.envMapCubeUVHeight),p.push(P.mapUv),p.push(P.alphaMapUv),p.push(P.lightMapUv),p.push(P.aoMapUv),p.push(P.bumpMapUv),p.push(P.normalMapUv),p.push(P.displacementMapUv),p.push(P.emissiveMapUv),p.push(P.metalnessMapUv),p.push(P.roughnessMapUv),p.push(P.anisotropyMapUv),p.push(P.clearcoatMapUv),p.push(P.clearcoatNormalMapUv),p.push(P.clearcoatRoughnessMapUv),p.push(P.iridescenceMapUv),p.push(P.iridescenceThicknessMapUv),p.push(P.sheenColorMapUv),p.push(P.sheenRoughnessMapUv),p.push(P.specularMapUv),p.push(P.specularColorMapUv),p.push(P.specularIntensityMapUv),p.push(P.transmissionMapUv),p.push(P.thicknessMapUv),p.push(P.combine),p.push(P.fogExp2),p.push(P.sizeAttenuation),p.push(P.morphTargetsCount),p.push(P.morphAttributeCount),p.push(P.numSunLights),p.push(P.numDirLights),p.push(P.numPointLights),p.push(P.numSpotLights),p.push(P.numSpotLightMaps),p.push(P.numHemiLights),p.push(P.numRectAreaLights),p.push(P.numSunLightShadows),p.push(P.numDirLightShadows),p.push(P.numPointLightShadows),p.push(P.numSpotLightShadows),p.push(P.numSpotLightShadowsWithMaps),p.push(P.numLightProbes),p.push(P.shadowMapType),p.push(P.toneMapping),p.push(P.numClippingPlanes),p.push(P.numClipIntersection),p.push(P.depthPacking)}function w(p,P){r.disableAll(),P.instancing&&r.enable(0),P.instancingColor&&r.enable(1),P.instancingMorph&&r.enable(2),P.matcap&&r.enable(3),P.envMap&&r.enable(4),P.normalMapObjectSpace&&r.enable(5),P.normalMapTangentSpace&&r.enable(6),P.clearcoat&&r.enable(7),P.iridescence&&r.enable(8),P.alphaTest&&r.enable(9),P.vertexColors&&r.enable(10),P.vertexAlphas&&r.enable(11),P.vertexUv1s&&r.enable(12),P.vertexUv2s&&r.enable(13),P.vertexUv3s&&r.enable(14),P.vertexTangents&&r.enable(15),P.anisotropy&&r.enable(16),P.alphaHash&&r.enable(17),P.batching&&r.enable(18),P.dispersion&&r.enable(19),P.retroreflection&&r.enable(24),P.batchingColor&&r.enable(20),P.gradientMap&&r.enable(21),P.packedNormalMap&&r.enable(22),P.vertexNormals&&r.enable(23),p.push(r.mask),r.disableAll(),P.fog&&r.enable(0),P.useFog&&r.enable(1),P.flatShading&&r.enable(2),P.logarithmicDepthBuffer&&r.enable(3),P.reversedDepthBuffer&&r.enable(4),P.skinning&&r.enable(5),P.morphTargets&&r.enable(6),P.morphNormals&&r.enable(7),P.morphColors&&r.enable(8),P.premultipliedAlpha&&r.enable(9),P.shadowMapEnabled&&r.enable(10),P.doubleSided&&r.enable(11),P.flipSided&&r.enable(12),P.useDepthPacking&&r.enable(13),P.dithering&&r.enable(14),P.transmission&&r.enable(15),P.sheen&&r.enable(16),P.opaque&&r.enable(17),P.pointsUvs&&r.enable(18),P.decodeVideoTexture&&r.enable(19),P.decodeVideoTextureEmissive&&r.enable(20),P.alphaToCoverage&&r.enable(21),P.numLightProbeGrids>0&&r.enable(22),P.hasPositionAttribute&&r.enable(23),p.push(r.mask)}function S(p){let P=m[p.type],F;if(P){let H=Ya[P];F=Vi.clone(H.uniforms)}else F=p.uniforms;return F}function g(p,P){let F=u.get(P);return F!==void 0?++F.usedTimes:(F=new Ab(n,P,p,i),c.push(F),u.set(P,F)),F}function L(p){if(--p.usedTimes===0){let P=c.indexOf(p);c[P]=c[c.length-1],c.pop(),u.delete(p.cacheKey),p.destroy()}}function R(p){l.remove(p)}function z(){l.dispose()}return{getParameters:b,getProgramCacheKey:v,getUniforms:S,acquireProgram:g,releaseProgram:L,releaseShaderCache:R,programs:c,dispose:z}}function Pb(){let n=new WeakMap;function e(r){return n.has(r)}function t(r){let l=n.get(r);return l===void 0&&(l={},n.set(r,l)),l}function a(r){n.delete(r)}function i(r,l,s){n.get(r)[l]=s}function o(){n=new WeakMap}return{has:e,get:t,remove:a,update:i,dispose:o}}function Ib(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function J0(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function K0(){let n=[],e=0,t=[],a=[],i=[];function o(){e=0,t.length=0,a.length=0,i.length=0}function r(d){let m=0;return d.isInstancedMesh&&(m+=2),d.isSkinnedMesh&&(m+=1),m}function l(d,m,y,b,v,x){let w=n[e];return w===void 0?(w={id:d.id,object:d,geometry:m,material:y,materialVariant:r(d),groupOrder:b,renderOrder:d.renderOrder,z:v,group:x},n[e]=w):(w.id=d.id,w.object=d,w.geometry=m,w.material=y,w.materialVariant=r(d),w.groupOrder=b,w.renderOrder=d.renderOrder,w.z=v,w.group=x),e++,w}function s(d,m,y,b,v,x,w){w.reversedDepth===!0&&(v=-v);let S=l(d,m,y,b,v,x);y.transmission>0?a.push(S):y.transparent===!0?i.push(S):t.push(S)}function c(d,m,y,b,v,x){let w=l(d,m,y,b,v,x);y.transmission>0?a.unshift(w):y.transparent===!0?i.unshift(w):t.unshift(w)}function u(d,m){t.length>1&&t.sort(d||Ib),a.length>1&&a.sort(m||J0),i.length>1&&i.sort(m||J0)}function h(){for(let d=e,m=n.length;d<m;d++){let y=n[d];if(y.id===null)break;y.id=null,y.object=null,y.geometry=null,y.material=null,y.group=null}}return{opaque:t,transmissive:a,transparent:i,init:o,push:s,unshift:c,finish:h,sort:u}}function Lb(){let n=new WeakMap;function e(a,i){let o=n.get(a),r;return o===void 0?(r=new K0,n.set(a,[r])):i>=o.length?(r=new K0,o.push(r)):r=o[i],r}function t(){n=new WeakMap}return{get:e,dispose:t}}function Db(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new X,color:new at};break;case"SpotLight":t={position:new X,direction:new X,color:new at,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new X,color:new at,distance:0,decay:0};break;case"HemisphereLight":t={direction:new X,skyColor:new at,groundColor:new at};break;case"RectAreaLight":t={color:new at,position:new X,halfWidth:new X,halfHeight:new X};break}return n[e.id]=t,t}}}function Nb(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new nt};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new nt};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new nt,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var Ub=0;function Fb(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Bb(n){let e=new Db,t=Nb(),a={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)a.probe.push(new X);let i=new X,o=new At,r=new At;function l(c){let u=0,h=0,d=0;for(let W=0;W<9;W++)a.probe[W].set(0,0,0);let m=0,y=0,b=0,v=0,x=0,w=0,S=0,g=0,L=0,R=0,z=0,p=0,P=0,F=0;c.sort(Fb);for(let W=0,V=c.length;W<V;W++){let N=c[W],O=N.color,T=N.intensity,E=N.distance,A=null;if(N.shadow&&N.shadow.map&&(N.shadow.map.texture.format===Gi?A=N.shadow.map.texture:A=N.shadow.map.depthTexture||N.shadow.map.texture),N.isAmbientLight)u+=O.r*T,h+=O.g*T,d+=O.b*T;else if(N.isLightProbe){for(let f=0;f<9;f++)a.probe[f].addScaledVector(N.sh.coefficients[f],T);F++}else if(N.isSunLight){let f=e.get(N);if(f.color.copy(N.color).multiplyScalar(N.intensity),N.castShadow){let M=N.shadow,_=t.get(N);_.shadowIntensity=M.intensity,_.shadowBias=M.bias,_.shadowNormalBias=M.normalBias,_.shadowRadius=M.radius,_.shadowMapSize.copy(M.mapSize).multiply(M.getFrameExtents()),a.sunShadow[y]=_,a.sunShadowMap[y]=A;let C=M.getViewportCount();for(let D=0;D<C;D++)a.sunShadowMatrix[b+D]=M.getMatrix(D),a.sunShadowCascade[b+D]=M._cascadeData[D];b+=C,y++}a.sun[m]=f,m++}else if(N.isDirectionalLight){let f=e.get(N);if(f.color.copy(N.color).multiplyScalar(N.intensity),N.castShadow){let M=N.shadow,_=t.get(N);_.shadowIntensity=M.intensity,_.shadowBias=M.bias,_.shadowNormalBias=M.normalBias,_.shadowRadius=M.radius,_.shadowMapSize=M.mapSize,a.directionalShadow[v]=_,a.directionalShadowMap[v]=A,a.directionalShadowMatrix[v]=N.shadow.matrix,L++}a.directional[v]=f,v++}else if(N.isSpotLight){let f=e.get(N);f.position.setFromMatrixPosition(N.matrixWorld),f.color.copy(O).multiplyScalar(T),f.distance=E,f.coneCos=Math.cos(N.angle),f.penumbraCos=Math.cos(N.angle*(1-N.penumbra)),f.decay=N.decay,a.spot[w]=f;let M=N.shadow;if(N.map&&(a.spotLightMap[p]=N.map,p++,M.updateMatrices(N),N.castShadow&&P++),a.spotLightMatrix[w]=M.matrix,N.castShadow){let _=t.get(N);_.shadowIntensity=M.intensity,_.shadowBias=M.bias,_.shadowNormalBias=M.normalBias,_.shadowRadius=M.radius,_.shadowMapSize=M.mapSize,a.spotShadow[w]=_,a.spotShadowMap[w]=A,z++}w++}else if(N.isRectAreaLight){let f=e.get(N);f.color.copy(O).multiplyScalar(T),f.halfWidth.set(N.width*.5,0,0),f.halfHeight.set(0,N.height*.5,0),a.rectArea[S]=f,S++}else if(N.isPointLight){let f=e.get(N);if(f.color.copy(N.color).multiplyScalar(N.intensity),f.distance=N.distance,f.decay=N.decay,N.castShadow){let M=N.shadow,_=t.get(N);_.shadowIntensity=M.intensity,_.shadowBias=M.bias,_.shadowNormalBias=M.normalBias,_.shadowRadius=M.radius,_.shadowMapSize=M.mapSize,_.shadowCameraNear=M.camera.near,_.shadowCameraFar=M.camera.far,a.pointShadow[x]=_,a.pointShadowMap[x]=A,a.pointShadowMatrix[x]=N.shadow.matrix,R++}a.point[x]=f,x++}else if(N.isHemisphereLight){let f=e.get(N);f.skyColor.copy(N.color).multiplyScalar(T),f.groundColor.copy(N.groundColor).multiplyScalar(T),a.hemi[g]=f,g++}}S>0&&(n.has("OES_texture_float_linear")===!0?(a.rectAreaLTC1=je.LTC_FLOAT_1,a.rectAreaLTC2=je.LTC_FLOAT_2):(a.rectAreaLTC1=je.LTC_HALF_1,a.rectAreaLTC2=je.LTC_HALF_2)),a.ambient[0]=u,a.ambient[1]=h,a.ambient[2]=d;let H=a.hash;(H.sunLength!==m||H.directionalLength!==v||H.pointLength!==x||H.spotLength!==w||H.rectAreaLength!==S||H.hemiLength!==g||H.numSunShadows!==y||H.numDirectionalShadows!==L||H.numPointShadows!==R||H.numSpotShadows!==z||H.numSpotMaps!==p||H.numLightProbes!==F)&&(a.sun.length=m,a.directional.length=v,a.spot.length=w,a.rectArea.length=S,a.point.length=x,a.hemi.length=g,a.sunShadow.length=y,a.sunShadowMap.length=y,a.sunShadowMatrix.length=b,a.sunShadowCascade.length=b,a.directionalShadow.length=L,a.directionalShadowMap.length=L,a.directionalShadowMatrix.length=L,a.pointShadow.length=R,a.pointShadowMap.length=R,a.pointShadowMatrix.length=R,a.spotShadow.length=z,a.spotShadowMap.length=z,a.spotLightMatrix.length=z+p-P,a.spotLightMap.length=p,a.numSpotLightShadowsWithMaps=P,a.numLightProbes=F,H.sunLength=m,H.directionalLength=v,H.pointLength=x,H.spotLength=w,H.rectAreaLength=S,H.hemiLength=g,H.numSunShadows=y,H.numDirectionalShadows=L,H.numPointShadows=R,H.numSpotShadows=z,H.numSpotMaps=p,H.numLightProbes=F,a.version=Ub++)}function s(c,u){let h=0,d=0,m=0,y=0,b=0,v=0,x=u.matrixWorldInverse;for(let w=0,S=c.length;w<S;w++){let g=c[w];if(g.isSunLight){let L=a.sun[h];L.direction.setFromMatrixPosition(g.matrixWorld),L.direction.transformDirection(x),h++}else if(g.isDirectionalLight){let L=a.directional[d];L.direction.setFromMatrixPosition(g.matrixWorld),i.setFromMatrixPosition(g.target.matrixWorld),L.direction.sub(i),L.direction.transformDirection(x),d++}else if(g.isSpotLight){let L=a.spot[y];L.position.setFromMatrixPosition(g.matrixWorld),L.position.applyMatrix4(x),L.direction.setFromMatrixPosition(g.matrixWorld),i.setFromMatrixPosition(g.target.matrixWorld),L.direction.sub(i),L.direction.transformDirection(x),y++}else if(g.isRectAreaLight){let L=a.rectArea[b];L.position.setFromMatrixPosition(g.matrixWorld),L.position.applyMatrix4(x),r.identity(),o.copy(g.matrixWorld),o.premultiply(x),r.extractRotation(o),L.halfWidth.set(g.width*.5,0,0),L.halfHeight.set(0,g.height*.5,0),L.halfWidth.applyMatrix4(r),L.halfHeight.applyMatrix4(r),b++}else if(g.isPointLight){let L=a.point[m];L.position.setFromMatrixPosition(g.matrixWorld),L.position.applyMatrix4(x),m++}else if(g.isHemisphereLight){let L=a.hemi[v];L.direction.setFromMatrixPosition(g.matrixWorld),L.direction.transformDirection(x),v++}}}return{setup:l,setupView:s,state:a}}function Q0(n){let e=new Bb(n),t=[],a=[],i=[];function o(d){h.camera=d,t.length=0,a.length=0,i.length=0}function r(d){t.push(d)}function l(d){a.push(d)}function s(d){i.push(d)}function c(){e.setup(t)}function u(d){e.setupView(t,d)}let h={lightsArray:t,shadowsArray:a,lightProbeGridArray:i,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:o,state:h,setupLights:c,setupLightsView:u,pushLight:r,pushShadow:l,pushLightProbeGrid:s}}function Hb(n){let e=new WeakMap;function t(i,o=0){let r=e.get(i),l;return r===void 0?(l=new Q0(n),e.set(i,[l])):o>=r.length?(l=new Q0(n),r.push(l)):l=r[o],l}function a(){e=new WeakMap}return{get:t,dispose:a}}var Ob=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Gb=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Vb=[new X(1,0,0),new X(-1,0,0),new X(0,1,0),new X(0,-1,0),new X(0,0,1),new X(0,0,-1)],kb=[new X(0,-1,0),new X(0,-1,0),new X(0,0,1),new X(0,0,-1),new X(0,-1,0),new X(0,-1,0)],ep=new At,cs=new X,Ld=new X;function qb(n,e,t){let a=new Zo,i=new nt,o=new nt,r=new gn,l=new Fl,s=new Bl,c={},u=t.maxTextureSize,h={[Wa]:Hn,[Hn]:Wa,[cn]:cn},d=new $t({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new nt},radius:{value:4}},vertexShader:Ob,fragmentShader:Gb}),m=d.clone();m.defines.HORIZONTAL_PASS=1;let y=new lt;y.setAttribute("position",new Ft(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let b=new xe(y,d),v=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ho;let x=this.type;this.render=function(R,z,p){if(v.enabled===!1||v.autoUpdate===!1&&v.needsUpdate===!1||R.length===0)return;this.type===$f&&(xt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=ho);let P=n.getRenderTarget(),F=n.getActiveCubeFace(),H=n.getActiveMipmapLevel(),W=n.state;W.setBlending(ja),W.buffers.depth.getReversed()===!0?W.buffers.color.setClear(0,0,0,0):W.buffers.color.setClear(1,1,1,1),W.buffers.depth.setTest(!0),W.setScissorTest(!1);let V=x!==this.type;V&&z.traverse(function(N){N.material&&(Array.isArray(N.material)?N.material.forEach(O=>O.needsUpdate=!0):N.material.needsUpdate=!0)});for(let N=0,O=R.length;N<O;N++){let T=R[N],E=T.shadow;if(E===void 0){xt("WebGLShadowMap:",T,"has no shadow.");continue}if(E.autoUpdate===!1&&E.needsUpdate===!1)continue;i.copy(E.mapSize);let A=E.getFrameExtents();i.multiply(A),o.copy(E.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(o.x=Math.floor(u/A.x),i.x=o.x*A.x,E.mapSize.x=o.x),i.y>u&&(o.y=Math.floor(u/A.y),i.y=o.y*A.y,E.mapSize.y=o.y));let f=n.state.buffers.depth.getReversed();if(E.camera._reversedDepth=f,E.map===null||V===!0){if(E.map!==null&&(E.map.depthTexture!==null&&(E.map.depthTexture.dispose(),E.map.depthTexture=null),E.map.dispose()),this.type===er){if(T.isPointLight){xt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}E.map=new Fn(i.x,i.y,{format:Gi,type:ta,minFilter:mn,magFilter:mn,generateMipmaps:!1}),E.map.texture.name=T.name+".shadowMap",E.map.depthTexture=new Ii(i.x,i.y,_a),E.map.depthTexture.name=T.name+".shadowMapDepth",E.map.depthTexture.format=Ha,E.map.depthTexture.compareFunction=null,E.map.depthTexture.minFilter=Un,E.map.depthTexture.magFilter=Un}else T.isPointLight?(E.map=new qc(i.x),E.map.depthTexture=new Rl(i.x,Da)):(E.map=new Fn(i.x,i.y),E.map.depthTexture=new Ii(i.x,i.y,Da)),E.map.depthTexture.name=T.name+".shadowMap",E.map.depthTexture.format=Ha,this.type===ho?(E.map.depthTexture.compareFunction=f?Hc:Bc,E.map.depthTexture.minFilter=mn,E.map.depthTexture.magFilter=mn):(E.map.depthTexture.compareFunction=null,E.map.depthTexture.minFilter=Un,E.map.depthTexture.magFilter=Un);E.camera.updateProjectionMatrix()}E.map.isWebGLCubeRenderTarget!==!0&&(E.map.width!==i.x||E.map.height!==i.y)&&E.map.setSize(i.x,i.y);let M=E.map.isWebGLCubeRenderTarget?6:E.getViewportCount();T.isPointLight!==!0&&E.updateMatrices(T,p);for(let _=0;_<M;_++){let C=E.getCamera(_);if(T.isPointLight){let D=E.camera,B=E.matrix,k=T.distance||D.far;k!==D.far&&(D.far=k,D.updateProjectionMatrix()),cs.setFromMatrixPosition(T.matrixWorld),D.position.copy(cs),Ld.copy(D.position),Ld.add(Vb[_]),D.up.copy(kb[_]),D.lookAt(Ld),D.updateMatrixWorld(),B.makeTranslation(-cs.x,-cs.y,-cs.z),ep.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),E._frustum.setFromProjectionMatrix(ep,D.coordinateSystem,D.reversedDepth)}if(E.map.isWebGLCubeRenderTarget)n.setRenderTarget(E.map,_),n.clear();else{_===0&&(n.setRenderTarget(E.map),n.clear());let D=E.getViewport(_);r.set(o.x*D.x,o.y*D.y,o.x*D.z,o.y*D.w),W.viewport(r)}a=E.getFrustum(_),g(z,p,C,T,this.type)}E.isPointLightShadow!==!0&&this.type===er&&w(E,p),E.needsUpdate=!1}x=this.type,v.needsUpdate=!1,n.setRenderTarget(P,F,H)};function w(R,z){let p=e.update(b);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,m.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,m.needsUpdate=!0),R.mapPass===null?R.mapPass=new Fn(i.x,i.y,{format:Gi,type:ta}):(R.mapPass.width!==R.map.width||R.mapPass.height!==R.map.height)&&R.mapPass.setSize(R.map.width,R.map.height),d.uniforms.shadow_pass.value=R.map.depthTexture,d.uniforms.resolution.value.set(R.map.width,R.map.height),d.uniforms.radius.value=R.radius,n.setRenderTarget(R.mapPass),n.clear(),n.renderBufferDirect(z,null,p,d,b,null),m.uniforms.shadow_pass.value=R.mapPass.texture,m.uniforms.resolution.value.set(R.map.width,R.map.height),m.uniforms.radius.value=R.radius,n.setRenderTarget(R.map),n.clear(),n.renderBufferDirect(z,null,p,m,b,null)}function S(R,z,p,P){let F=null,H=p.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(H!==void 0)F=H;else if(F=p.isPointLight===!0?s:l,n.localClippingEnabled&&z.clipShadows===!0&&Array.isArray(z.clippingPlanes)&&z.clippingPlanes.length!==0||z.displacementMap&&z.displacementScale!==0||z.alphaMap&&z.alphaTest>0||z.map&&z.alphaTest>0||z.alphaToCoverage===!0){let W=F.uuid,V=z.uuid,N=c[W];N===void 0&&(N={},c[W]=N);let O=N[V];O===void 0&&(O=F.clone(),N[V]=O,z.addEventListener("dispose",L)),F=O}if(F.visible=z.visible,F.wireframe=z.wireframe,P===er?F.side=z.shadowSide!==null?z.shadowSide:z.side:F.side=z.shadowSide!==null?z.shadowSide:h[z.side],F.alphaMap=z.alphaMap,F.alphaTest=z.alphaToCoverage===!0?.5:z.alphaTest,F.map=z.map,F.clipShadows=z.clipShadows,F.clippingPlanes=z.clippingPlanes,F.clipIntersection=z.clipIntersection,F.displacementMap=z.displacementMap,F.displacementScale=z.displacementScale,F.displacementBias=z.displacementBias,F.wireframeLinewidth=z.wireframeLinewidth,F.linewidth=z.linewidth,p.isPointLight===!0&&F.isMeshDistanceMaterial===!0){let W=n.properties.get(F);W.light=p}return F}function g(R,z,p,P,F){if(R.visible===!1)return;if(R.layers.test(z.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&F===er)&&(!R.frustumCulled||R.intersectsFrustum(a))){R.modelViewMatrix.multiplyMatrices(p.matrixWorldInverse,R.matrixWorld);let V=e.update(R),N=R.material;if(Array.isArray(N)){let O=V.groups;for(let T=0,E=O.length;T<E;T++){let A=O[T],f=N[A.materialIndex];if(f&&f.visible){let M=S(R,f,P,F);R.onBeforeShadow(n,R,z,p,V,M,A),n.renderBufferDirect(p,null,V,M,R,A),R.onAfterShadow(n,R,z,p,V,M,A)}}}else if(N.visible){let O=S(R,N,P,F);R.onBeforeShadow(n,R,z,p,V,O,null),n.renderBufferDirect(p,null,V,O,R,null),R.onAfterShadow(n,R,z,p,V,O,null)}}let W=R.children;for(let V=0,N=W.length;V<N;V++)g(W[V],z,p,P,F)}function L(R){R.target.removeEventListener("dispose",L);for(let p in c){let P=c[p],F=R.target.uuid;F in P&&(P[F].dispose(),delete P[F])}}}function Wb(n,e){function t(){let ae=!1,De=new gn,Ae=null,Ge=new gn(0,0,0,0);return{setMask:function($e){Ae!==$e&&!ae&&(n.colorMask($e,$e,$e,$e),Ae=$e)},setLocked:function($e){ae=$e},setClear:function($e,He,ct,rt,jt){jt===!0&&($e*=rt,He*=rt,ct*=rt),De.set($e,He,ct,rt),Ge.equals(De)===!1&&(n.clearColor($e,He,ct,rt),Ge.copy(De))},reset:function(){ae=!1,Ae=null,Ge.set(-1,0,0,0)}}}function a(){let ae=!1,De=!1,Ae=null,Ge=null,$e=null;return{setReversed:function(He){if(De!==He){let ct=e.get("EXT_clip_control");He?ct.clipControlEXT(ct.LOWER_LEFT_EXT,ct.ZERO_TO_ONE_EXT):ct.clipControlEXT(ct.LOWER_LEFT_EXT,ct.NEGATIVE_ONE_TO_ONE_EXT),De=He;let rt=$e;$e=null,this.setClear(rt)}},getReversed:function(){return De},setTest:function(He){He?J(n.DEPTH_TEST):he(n.DEPTH_TEST)},setMask:function(He){Ae!==He&&!ae&&(n.depthMask(He),Ae=He)},setFunc:function(He){if(De&&(He=z0[He]),Ge!==He){switch(He){case fl:n.depthFunc(n.NEVER);break;case pl:n.depthFunc(n.ALWAYS);break;case ml:n.depthFunc(n.LESS);break;case ko:n.depthFunc(n.LEQUAL);break;case gl:n.depthFunc(n.EQUAL);break;case xl:n.depthFunc(n.GEQUAL);break;case vl:n.depthFunc(n.GREATER);break;case yl:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Ge=He}},setLocked:function(He){ae=He},setClear:function(He){$e!==He&&($e=He,De&&(He=1-He),n.clearDepth(He))},reset:function(){ae=!1,Ae=null,Ge=null,$e=null,De=!1}}}function i(){let ae=!1,De=null,Ae=null,Ge=null,$e=null,He=null,ct=null,rt=null,jt=null;return{setTest:function(Gt){ae||(Gt?J(n.STENCIL_TEST):he(n.STENCIL_TEST))},setMask:function(Gt){De!==Gt&&!ae&&(n.stencilMask(Gt),De=Gt)},setFunc:function(Gt,ra,la){(Ae!==Gt||Ge!==ra||$e!==la)&&(n.stencilFunc(Gt,ra,la),Ae=Gt,Ge=ra,$e=la)},setOp:function(Gt,ra,la){(He!==Gt||ct!==ra||rt!==la)&&(n.stencilOp(Gt,ra,la),He=Gt,ct=ra,rt=la)},setLocked:function(Gt){ae=Gt},setClear:function(Gt){jt!==Gt&&(n.clearStencil(Gt),jt=Gt)},reset:function(){ae=!1,De=null,Ae=null,Ge=null,$e=null,He=null,ct=null,rt=null,jt=null}}}let o=new t,r=new a,l=new i,s=new WeakMap,c=new WeakMap,u={},h={},d={},m=new WeakMap,y=[],b=null,v=!1,x=null,w=null,S=null,g=null,L=null,R=null,z=null,p=new at(0,0,0),P=0,F=!1,H=null,W=null,V=null,N=null,O=null,T=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),E=!1,A=0,f=n.getParameter(n.VERSION);f.indexOf("WebGL")!==-1?(A=parseFloat(/^WebGL (\d)/.exec(f)[1]),E=A>=1):f.indexOf("OpenGL ES")!==-1&&(A=parseFloat(/^OpenGL ES (\d)/.exec(f)[1]),E=A>=2);let M=null,_={},C=n.getParameter(n.SCISSOR_BOX),D=n.getParameter(n.VIEWPORT),B=new gn().fromArray(C),k=new gn().fromArray(D);function Q(ae,De,Ae,Ge){let $e=new Uint8Array(4),He=n.createTexture();n.bindTexture(ae,He),n.texParameteri(ae,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(ae,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let ct=0;ct<Ae;ct++)ae===n.TEXTURE_3D||ae===n.TEXTURE_2D_ARRAY?n.texImage3D(De,0,n.RGBA,1,1,Ge,0,n.RGBA,n.UNSIGNED_BYTE,$e):n.texImage2D(De+ct,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,$e);return He}let G={};G[n.TEXTURE_2D]=Q(n.TEXTURE_2D,n.TEXTURE_2D,1),G[n.TEXTURE_CUBE_MAP]=Q(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),G[n.TEXTURE_2D_ARRAY]=Q(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),G[n.TEXTURE_3D]=Q(n.TEXTURE_3D,n.TEXTURE_3D,1,1),o.setClear(0,0,0,1),r.setClear(1),l.setClear(0),J(n.DEPTH_TEST),r.setFunc(ko),oe(!1),fe(nd),J(n.CULL_FACE),ie(ja);function J(ae){u[ae]!==!0&&(n.enable(ae),u[ae]=!0)}function he(ae){u[ae]!==!1&&(n.disable(ae),u[ae]=!1)}function ve(ae,De){return d[ae]!==De?(n.bindFramebuffer(ae,De),d[ae]=De,ae===n.DRAW_FRAMEBUFFER&&(d[n.FRAMEBUFFER]=De),ae===n.FRAMEBUFFER&&(d[n.DRAW_FRAMEBUFFER]=De),!0):!1}function ye(ae,De){let Ae=y,Ge=!1;if(ae){Ae=m.get(De),Ae===void 0&&(Ae=[],m.set(De,Ae));let $e=ae.textures;if(Ae.length!==$e.length||Ae[0]!==n.COLOR_ATTACHMENT0){for(let He=0,ct=$e.length;He<ct;He++)Ae[He]=n.COLOR_ATTACHMENT0+He;Ae.length=$e.length,Ge=!0}}else Ae[0]!==n.BACK&&(Ae[0]=n.BACK,Ge=!0);Ge&&n.drawBuffers(Ae)}function Z(ae){return b!==ae?(n.useProgram(ae),b=ae,!0):!1}let ne={[po]:n.FUNC_ADD,[Jf]:n.FUNC_SUBTRACT,[Kf]:n.FUNC_REVERSE_SUBTRACT};ne[Qf]=n.MIN,ne[e0]=n.MAX;let ee={[t0]:n.ZERO,[n0]:n.ONE,[a0]:n.SRC_COLOR,[od]:n.SRC_ALPHA,[c0]:n.SRC_ALPHA_SATURATE,[s0]:n.DST_COLOR,[o0]:n.DST_ALPHA,[i0]:n.ONE_MINUS_SRC_COLOR,[rd]:n.ONE_MINUS_SRC_ALPHA,[l0]:n.ONE_MINUS_DST_COLOR,[r0]:n.ONE_MINUS_DST_ALPHA,[u0]:n.CONSTANT_COLOR,[d0]:n.ONE_MINUS_CONSTANT_COLOR,[h0]:n.CONSTANT_ALPHA,[f0]:n.ONE_MINUS_CONSTANT_ALPHA};function ie(ae,De,Ae,Ge,$e,He,ct,rt,jt,Gt){if(ae===ja){v===!0&&(he(n.BLEND),v=!1);return}if(v===!1&&(J(n.BLEND),v=!0),ae!==Zf){if(ae!==x||Gt!==F){if((w!==po||L!==po)&&(n.blendEquation(n.FUNC_ADD),w=po,L=po),Gt)switch(ae){case Fi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case fo:n.blendFunc(n.ONE,n.ONE);break;case ad:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case id:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:bt("WebGLState: Invalid blending: ",ae);break}else switch(ae){case Fi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case fo:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case ad:bt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case id:bt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:bt("WebGLState: Invalid blending: ",ae);break}S=null,g=null,R=null,z=null,p.set(0,0,0),P=0,x=ae,F=Gt}return}$e=$e||De,He=He||Ae,ct=ct||Ge,(De!==w||$e!==L)&&(n.blendEquationSeparate(ne[De],ne[$e]),w=De,L=$e),(Ae!==S||Ge!==g||He!==R||ct!==z)&&(n.blendFuncSeparate(ee[Ae],ee[Ge],ee[He],ee[ct]),S=Ae,g=Ge,R=He,z=ct),(rt.equals(p)===!1||jt!==P)&&(n.blendColor(rt.r,rt.g,rt.b,jt),p.copy(rt),P=jt),x=ae,F=!1}function q(ae,De){ae.side===cn?he(n.CULL_FACE):J(n.CULL_FACE);let Ae=ae.side===Hn;De&&(Ae=!Ae),oe(Ae),ae.blending===Fi&&ae.transparent===!1?ie(ja):ie(ae.blending,ae.blendEquation,ae.blendSrc,ae.blendDst,ae.blendEquationAlpha,ae.blendSrcAlpha,ae.blendDstAlpha,ae.blendColor,ae.blendAlpha,ae.premultipliedAlpha),r.setFunc(ae.depthFunc),r.setTest(ae.depthTest),r.setMask(ae.depthWrite),o.setMask(ae.colorWrite);let Ge=ae.stencilWrite;l.setTest(Ge),Ge&&(l.setMask(ae.stencilWriteMask),l.setFunc(ae.stencilFunc,ae.stencilRef,ae.stencilFuncMask),l.setOp(ae.stencilFail,ae.stencilZFail,ae.stencilZPass)),me(ae.polygonOffset,ae.polygonOffsetFactor,ae.polygonOffsetUnits),ae.alphaToCoverage===!0?J(n.SAMPLE_ALPHA_TO_COVERAGE):he(n.SAMPLE_ALPHA_TO_COVERAGE)}function oe(ae){H!==ae&&(ae?n.frontFace(n.CW):n.frontFace(n.CCW),H=ae)}function fe(ae){ae!==Xf?(J(n.CULL_FACE),ae!==W&&(ae===nd?n.cullFace(n.BACK):ae===Yf?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):he(n.CULL_FACE),W=ae}function $(ae){ae!==V&&(E&&n.lineWidth(ae),V=ae)}function me(ae,De,Ae){ae?(J(n.POLYGON_OFFSET_FILL),(N!==De||O!==Ae)&&(N=De,O=Ae,r.getReversed()&&(De=-De),n.polygonOffset(De,Ae))):he(n.POLYGON_OFFSET_FILL)}function Re(ae){ae?J(n.SCISSOR_TEST):he(n.SCISSOR_TEST)}function ze(ae){ae===void 0&&(ae=n.TEXTURE0+T-1),M!==ae&&(n.activeTexture(ae),M=ae)}function te(ae,De,Ae){Ae===void 0&&(M===null?Ae=n.TEXTURE0+T-1:Ae=M);let Ge=_[Ae];Ge===void 0&&(Ge={type:void 0,texture:void 0},_[Ae]=Ge),(Ge.type!==ae||Ge.texture!==De)&&(M!==Ae&&(n.activeTexture(Ae),M=Ae),n.bindTexture(ae,De||G[ae]),Ge.type=ae,Ge.texture=De)}function ft(){let ae=_[M];ae!==void 0&&ae.type!==void 0&&(n.bindTexture(ae.type,null),ae.type=void 0,ae.texture=void 0)}function Ie(){try{n.compressedTexImage2D(...arguments)}catch(ae){bt("WebGLState:",ae)}}function Y(){try{n.compressedTexImage3D(...arguments)}catch(ae){bt("WebGLState:",ae)}}function U(){try{n.texSubImage2D(...arguments)}catch(ae){bt("WebGLState:",ae)}}function se(){try{n.texSubImage3D(...arguments)}catch(ae){bt("WebGLState:",ae)}}function pe(){try{n.compressedTexSubImage2D(...arguments)}catch(ae){bt("WebGLState:",ae)}}function ce(){try{n.compressedTexSubImage3D(...arguments)}catch(ae){bt("WebGLState:",ae)}}function ge(){try{n.texStorage2D(...arguments)}catch(ae){bt("WebGLState:",ae)}}function I(){try{n.texStorage3D(...arguments)}catch(ae){bt("WebGLState:",ae)}}function ue(){try{n.texImage2D(...arguments)}catch(ae){bt("WebGLState:",ae)}}function be(){try{n.texImage3D(...arguments)}catch(ae){bt("WebGLState:",ae)}}function Te(ae){return h[ae]!==void 0?h[ae]:n.getParameter(ae)}function Oe(ae,De){h[ae]!==De&&(n.pixelStorei(ae,De),h[ae]=De)}function Ne(ae){B.equals(ae)===!1&&(n.scissor(ae.x,ae.y,ae.z,ae.w),B.copy(ae))}function Fe(ae){k.equals(ae)===!1&&(n.viewport(ae.x,ae.y,ae.z,ae.w),k.copy(ae))}function Ye(ae,De){let Ae=c.get(De);Ae===void 0&&(Ae=new WeakMap,c.set(De,Ae));let Ge=Ae.get(ae);Ge===void 0&&(Ge=n.getUniformBlockIndex(De,ae.name),Ae.set(ae,Ge))}function re(ae,De){let Ge=c.get(De).get(ae);s.get(De)!==Ge&&(n.uniformBlockBinding(De,Ge,ae.__bindingPointIndex),s.set(De,Ge))}function Me(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),r.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),u={},h={},M=null,_={},d={},m=new WeakMap,y=[],b=null,v=!1,x=null,w=null,S=null,g=null,L=null,R=null,z=null,p=new at(0,0,0),P=0,F=!1,H=null,W=null,V=null,N=null,O=null,B.set(0,0,n.canvas.width,n.canvas.height),k.set(0,0,n.canvas.width,n.canvas.height),o.reset(),r.reset(),l.reset()}return{buffers:{color:o,depth:r,stencil:l},enable:J,disable:he,bindFramebuffer:ve,drawBuffers:ye,useProgram:Z,setBlending:ie,setMaterial:q,setFlipSided:oe,setCullFace:fe,setLineWidth:$,setPolygonOffset:me,setScissorTest:Re,activeTexture:ze,bindTexture:te,unbindTexture:ft,compressedTexImage2D:Ie,compressedTexImage3D:Y,texImage2D:ue,texImage3D:be,pixelStorei:Oe,getParameter:Te,updateUBOMapping:Ye,uniformBlockBinding:re,texStorage2D:ge,texStorage3D:I,texSubImage2D:U,texSubImage3D:se,compressedTexSubImage2D:pe,compressedTexSubImage3D:ce,scissor:Ne,viewport:Fe,reset:Me}}function jb(n,e,t,a,i,o,r){let l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,s=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new nt,u=new WeakMap,h=new Set,d,m=new WeakMap,y=!1;try{y=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function b(Y,U){return y?new OffscreenCanvas(Y,U):Wo("canvas")}function v(Y,U,se){let pe=1,ce=Ie(Y);if((ce.width>se||ce.height>se)&&(pe=se/Math.max(ce.width,ce.height)),pe<1)if(typeof HTMLImageElement<"u"&&Y instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&Y instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&Y instanceof ImageBitmap||typeof VideoFrame<"u"&&Y instanceof VideoFrame){let ge=Math.floor(pe*ce.width),I=Math.floor(pe*ce.height);d===void 0&&(d=b(ge,I));let ue=U?b(ge,I):d;return ue.width=ge,ue.height=I,ue.getContext("2d").drawImage(Y,0,0,ge,I),xt("WebGLRenderer: Texture has been resized from ("+ce.width+"x"+ce.height+") to ("+ge+"x"+I+")."),ue}else return"data"in Y&&xt("WebGLRenderer: Image in DataTexture is too big ("+ce.width+"x"+ce.height+")."),Y;return Y}function x(Y){return Y.generateMipmaps}function w(Y){n.generateMipmap(Y)}function S(Y){return Y.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:Y.isWebGL3DRenderTarget?n.TEXTURE_3D:Y.isWebGLArrayRenderTarget||Y.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function g(Y,U,se,pe,ce,ge=!1){if(Y!==null){if(n[Y]!==void 0)return n[Y];xt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+Y+"'")}let I;pe&&(I=e.get("EXT_texture_norm16"),I||xt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let ue=U;if(U===n.RED&&(se===n.FLOAT&&(ue=n.R32F),se===n.HALF_FLOAT&&(ue=n.R16F),se===n.UNSIGNED_BYTE&&(ue=n.R8),se===n.UNSIGNED_SHORT&&I&&(ue=I.R16_EXT),se===n.SHORT&&I&&(ue=I.R16_SNORM_EXT)),U===n.RED_INTEGER&&(se===n.UNSIGNED_BYTE&&(ue=n.R8UI),se===n.UNSIGNED_SHORT&&(ue=n.R16UI),se===n.UNSIGNED_INT&&(ue=n.R32UI),se===n.BYTE&&(ue=n.R8I),se===n.SHORT&&(ue=n.R16I),se===n.INT&&(ue=n.R32I)),U===n.RG&&(se===n.FLOAT&&(ue=n.RG32F),se===n.HALF_FLOAT&&(ue=n.RG16F),se===n.UNSIGNED_BYTE&&(ue=n.RG8),se===n.UNSIGNED_SHORT&&I&&(ue=I.RG16_EXT),se===n.SHORT&&I&&(ue=I.RG16_SNORM_EXT)),U===n.RG_INTEGER&&(se===n.UNSIGNED_BYTE&&(ue=n.RG8UI),se===n.UNSIGNED_SHORT&&(ue=n.RG16UI),se===n.UNSIGNED_INT&&(ue=n.RG32UI),se===n.BYTE&&(ue=n.RG8I),se===n.SHORT&&(ue=n.RG16I),se===n.INT&&(ue=n.RG32I)),U===n.RGB_INTEGER&&(se===n.UNSIGNED_BYTE&&(ue=n.RGB8UI),se===n.UNSIGNED_SHORT&&(ue=n.RGB16UI),se===n.UNSIGNED_INT&&(ue=n.RGB32UI),se===n.BYTE&&(ue=n.RGB8I),se===n.SHORT&&(ue=n.RGB16I),se===n.INT&&(ue=n.RGB32I)),U===n.RGBA_INTEGER&&(se===n.UNSIGNED_BYTE&&(ue=n.RGBA8UI),se===n.UNSIGNED_SHORT&&(ue=n.RGBA16UI),se===n.UNSIGNED_INT&&(ue=n.RGBA32UI),se===n.BYTE&&(ue=n.RGBA8I),se===n.SHORT&&(ue=n.RGBA16I),se===n.INT&&(ue=n.RGBA32I)),U===n.RGB&&(se===n.UNSIGNED_SHORT&&I&&(ue=I.RGB16_EXT),se===n.SHORT&&I&&(ue=I.RGB16_SNORM_EXT),se===n.UNSIGNED_INT_5_9_9_9_REV&&(ue=n.RGB9_E5),se===n.UNSIGNED_INT_10F_11F_11F_REV&&(ue=n.R11F_G11F_B10F)),U===n.RGBA){let be=ge?Lr:Dt.getTransfer(ce);se===n.FLOAT&&(ue=n.RGBA32F),se===n.HALF_FLOAT&&(ue=n.RGBA16F),se===n.UNSIGNED_BYTE&&(ue=be===Kt?n.SRGB8_ALPHA8:n.RGBA8),se===n.UNSIGNED_SHORT&&I&&(ue=I.RGBA16_EXT),se===n.SHORT&&I&&(ue=I.RGBA16_SNORM_EXT),se===n.UNSIGNED_SHORT_4_4_4_4&&(ue=n.RGBA4),se===n.UNSIGNED_SHORT_5_5_5_1&&(ue=n.RGB5_A1)}return(ue===n.R16F||ue===n.R32F||ue===n.RG16F||ue===n.RG32F||ue===n.RGBA16F||ue===n.RGBA32F)&&e.get("EXT_color_buffer_float"),ue}function L(Y,U){let se;return Y?U===null||U===Da||U===nr?se=n.DEPTH24_STENCIL8:U===_a?se=n.DEPTH32F_STENCIL8:U===tr&&(se=n.DEPTH24_STENCIL8,xt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):U===null||U===Da||U===nr?se=n.DEPTH_COMPONENT24:U===_a?se=n.DEPTH_COMPONENT32F:U===tr&&(se=n.DEPTH_COMPONENT16),se}function R(Y,U){return x(Y)===!0||Y.isFramebufferTexture&&Y.minFilter!==Un&&Y.minFilter!==mn?Math.log2(Math.max(U.width,U.height))+1:Y.mipmaps!==void 0&&Y.mipmaps.length>0?Y.mipmaps.length:Y.isCompressedTexture&&Array.isArray(Y.image)?U.mipmaps.length:1}function z(Y){let U=Y.target;U.removeEventListener("dispose",z),P(U),U.isVideoTexture&&u.delete(U),U.isHTMLTexture&&h.delete(U)}function p(Y){let U=Y.target;U.removeEventListener("dispose",p),H(U)}function P(Y){let U=a.get(Y);if(U.__webglInit===void 0)return;let se=Y.source,pe=m.get(se);if(pe){let ce=pe[U.__cacheKey];ce.usedTimes--,ce.usedTimes===0&&F(Y),Object.keys(pe).length===0&&m.delete(se)}a.remove(Y)}function F(Y){let U=a.get(Y);n.deleteTexture(U.__webglTexture);let se=Y.source,pe=m.get(se);delete pe[U.__cacheKey],r.memory.textures--}function H(Y){let U=a.get(Y);if(Y.depthTexture&&(Y.depthTexture.dispose(),a.remove(Y.depthTexture)),Y.isWebGLCubeRenderTarget)for(let pe=0;pe<6;pe++){if(Array.isArray(U.__webglFramebuffer[pe]))for(let ce=0;ce<U.__webglFramebuffer[pe].length;ce++)n.deleteFramebuffer(U.__webglFramebuffer[pe][ce]);else n.deleteFramebuffer(U.__webglFramebuffer[pe]);U.__webglDepthbuffer&&n.deleteRenderbuffer(U.__webglDepthbuffer[pe])}else{if(Array.isArray(U.__webglFramebuffer))for(let pe=0;pe<U.__webglFramebuffer.length;pe++)n.deleteFramebuffer(U.__webglFramebuffer[pe]);else n.deleteFramebuffer(U.__webglFramebuffer);if(U.__webglDepthbuffer&&n.deleteRenderbuffer(U.__webglDepthbuffer),U.__webglMultisampledFramebuffer&&n.deleteFramebuffer(U.__webglMultisampledFramebuffer),U.__webglColorRenderbuffer)for(let pe=0;pe<U.__webglColorRenderbuffer.length;pe++)U.__webglColorRenderbuffer[pe]&&n.deleteRenderbuffer(U.__webglColorRenderbuffer[pe]);U.__webglDepthRenderbuffer&&n.deleteRenderbuffer(U.__webglDepthRenderbuffer)}let se=Y.textures;for(let pe=0,ce=se.length;pe<ce;pe++){let ge=a.get(se[pe]);ge.__webglTexture&&(n.deleteTexture(ge.__webglTexture),r.memory.textures--),a.remove(se[pe])}a.remove(Y)}let W=0;function V(){W=0}function N(){return W}function O(Y){W=Y}function T(){let Y=W;return Y>=i.maxTextures&&xt("WebGLTextures: Trying to use "+(Y+1)+" texture units while this GPU supports only "+i.maxTextures),W+=1,Y}function E(Y){let U=[];return U.push(Y.wrapS),U.push(Y.wrapT),U.push(Y.wrapR||0),U.push(Y.magFilter),U.push(Y.minFilter),U.push(Y.anisotropy),U.push(Y.internalFormat),U.push(Y.format),U.push(Y.type),U.push(Y.generateMipmaps),U.push(Y.premultiplyAlpha),U.push(Y.flipY),U.push(Y.unpackAlignment),U.push(Y.colorSpace),U.join()}function A(Y,U){let se=a.get(Y);if(Y.isVideoTexture&&te(Y),Y.isRenderTargetTexture===!1&&Y.isExternalTexture!==!0&&Y.version>0&&se.__version!==Y.version){let pe=Y.image;if(pe===null)xt("WebGLRenderer: Texture marked for update but no image data found.");else if(pe.complete===!1)xt("WebGLRenderer: Texture marked for update but image is incomplete");else{he(se,Y,U);return}}else Y.isExternalTexture&&(se.__webglTexture=Y.sourceTexture?Y.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,se.__webglTexture,n.TEXTURE0+U)}function f(Y,U){let se=a.get(Y);if(Y.isRenderTargetTexture===!1&&Y.version>0&&se.__version!==Y.version){he(se,Y,U);return}else Y.isExternalTexture&&(se.__webglTexture=Y.sourceTexture?Y.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,se.__webglTexture,n.TEXTURE0+U)}function M(Y,U){let se=a.get(Y);if(Y.isRenderTargetTexture===!1&&Y.version>0&&se.__version!==Y.version){he(se,Y,U);return}t.bindTexture(n.TEXTURE_3D,se.__webglTexture,n.TEXTURE0+U)}function _(Y,U){let se=a.get(Y);if(Y.isCubeDepthTexture!==!0&&Y.version>0&&se.__version!==Y.version){ve(se,Y,U);return}t.bindTexture(n.TEXTURE_CUBE_MAP,se.__webglTexture,n.TEXTURE0+U)}let C={[bl]:n.REPEAT,[Ba]:n.CLAMP_TO_EDGE,[Ml]:n.MIRRORED_REPEAT},D={[Un]:n.NEAREST,[g0]:n.NEAREST_MIPMAP_NEAREST,[ts]:n.NEAREST_MIPMAP_LINEAR,[mn]:n.LINEAR,[ec]:n.LINEAR_MIPMAP_NEAREST,[Hi]:n.LINEAR_MIPMAP_LINEAR},B={[b0]:n.NEVER,[T0]:n.ALWAYS,[M0]:n.LESS,[Bc]:n.LEQUAL,[_0]:n.EQUAL,[Hc]:n.GEQUAL,[E0]:n.GREATER,[S0]:n.NOTEQUAL};function k(Y,U){if(U.type===_a&&e.has("OES_texture_float_linear")===!1&&(U.magFilter===mn||U.magFilter===ec||U.magFilter===ts||U.magFilter===Hi||U.minFilter===mn||U.minFilter===ec||U.minFilter===ts||U.minFilter===Hi)&&xt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(Y,n.TEXTURE_WRAP_S,C[U.wrapS]),n.texParameteri(Y,n.TEXTURE_WRAP_T,C[U.wrapT]),(Y===n.TEXTURE_3D||Y===n.TEXTURE_2D_ARRAY)&&n.texParameteri(Y,n.TEXTURE_WRAP_R,C[U.wrapR]),n.texParameteri(Y,n.TEXTURE_MAG_FILTER,D[U.magFilter]),n.texParameteri(Y,n.TEXTURE_MIN_FILTER,D[U.minFilter]),U.compareFunction&&(n.texParameteri(Y,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(Y,n.TEXTURE_COMPARE_FUNC,B[U.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(U.magFilter===Un||U.minFilter!==ts&&U.minFilter!==Hi||U.type===_a&&e.has("OES_texture_float_linear")===!1)return;if(U.anisotropy>1||a.get(U).__currentAnisotropy){let se=e.get("EXT_texture_filter_anisotropic");n.texParameterf(Y,se.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(U.anisotropy,i.getMaxAnisotropy())),a.get(U).__currentAnisotropy=U.anisotropy}}}function Q(Y,U){let se=!1;Y.__webglInit===void 0&&(Y.__webglInit=!0,U.addEventListener("dispose",z));let pe=U.source,ce=m.get(pe);ce===void 0&&(ce={},m.set(pe,ce));let ge=E(U);if(ge!==Y.__cacheKey){ce[ge]===void 0&&(ce[ge]={texture:n.createTexture(),usedTimes:0},r.memory.textures++,se=!0),ce[ge].usedTimes++;let I=ce[Y.__cacheKey];I!==void 0&&(ce[Y.__cacheKey].usedTimes--,I.usedTimes===0&&F(U)),Y.__cacheKey=ge,Y.__webglTexture=ce[ge].texture}return se}function G(Y,U,se){return Math.floor(Math.floor(Y/se)/U)}function J(Y,U,se,pe){let ge=Y.updateRanges;if(ge.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,U.width,U.height,se,pe,U.data);else{ge.sort((Oe,Ne)=>Oe.start-Ne.start);let I=0;for(let Oe=1;Oe<ge.length;Oe++){let Ne=ge[I],Fe=ge[Oe],Ye=Ne.start+Ne.count,re=G(Fe.start,U.width,4),Me=G(Ne.start,U.width,4);Fe.start<=Ye+1&&re===Me&&G(Fe.start+Fe.count-1,U.width,4)===re?Ne.count=Math.max(Ne.count,Fe.start+Fe.count-Ne.start):(++I,ge[I]=Fe)}ge.length=I+1;let ue=t.getParameter(n.UNPACK_ROW_LENGTH),be=t.getParameter(n.UNPACK_SKIP_PIXELS),Te=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,U.width);for(let Oe=0,Ne=ge.length;Oe<Ne;Oe++){let Fe=ge[Oe],Ye=Math.floor(Fe.start/4),re=Math.ceil(Fe.count/4),Me=Ye%U.width,ae=Math.floor(Ye/U.width),De=re,Ae=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,Me),t.pixelStorei(n.UNPACK_SKIP_ROWS,ae),t.texSubImage2D(n.TEXTURE_2D,0,Me,ae,De,Ae,se,pe,U.data)}Y.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,ue),t.pixelStorei(n.UNPACK_SKIP_PIXELS,be),t.pixelStorei(n.UNPACK_SKIP_ROWS,Te)}}function he(Y,U,se){let pe=n.TEXTURE_2D;(U.isDataArrayTexture||U.isCompressedArrayTexture)&&(pe=n.TEXTURE_2D_ARRAY),U.isData3DTexture&&(pe=n.TEXTURE_3D);let ce=Q(Y,U),ge=U.source;t.bindTexture(pe,Y.__webglTexture,n.TEXTURE0+se);let I=a.get(ge);if(ge.version!==I.__version||ce===!0){if(t.activeTexture(n.TEXTURE0+se),(typeof ImageBitmap<"u"&&U.image instanceof ImageBitmap)===!1){let Ae=Dt.getPrimaries(Dt.workingColorSpace),Ge=U.colorSpace===ci?null:Dt.getPrimaries(U.colorSpace),$e=U.colorSpace===ci||Ae===Ge?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,U.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,$e)}t.pixelStorei(n.UNPACK_ALIGNMENT,U.unpackAlignment);let be=v(U.image,!1,i.maxTextureSize);be=ft(U,be);let Te=o.convert(U.format,U.colorSpace),Oe=o.convert(U.type),Ne=g(U.internalFormat,Te,Oe,U.normalized,U.colorSpace,U.isVideoTexture);k(pe,U);let Fe,Ye=U.mipmaps,re=U.isVideoTexture!==!0,Me=I.__version===void 0||ce===!0,ae=ge.dataReady,De=R(U,be);if(U.isDepthTexture)Ne=L(U.format===Oi,U.type),Me&&(re?t.texStorage2D(n.TEXTURE_2D,1,Ne,be.width,be.height):t.texImage2D(n.TEXTURE_2D,0,Ne,be.width,be.height,0,Te,Oe,null));else if(U.isDataTexture)if(Ye.length>0){re&&Me&&t.texStorage2D(n.TEXTURE_2D,De,Ne,Ye[0].width,Ye[0].height);for(let Ae=0,Ge=Ye.length;Ae<Ge;Ae++)Fe=Ye[Ae],re?ae&&t.texSubImage2D(n.TEXTURE_2D,Ae,0,0,Fe.width,Fe.height,Te,Oe,Fe.data):t.texImage2D(n.TEXTURE_2D,Ae,Ne,Fe.width,Fe.height,0,Te,Oe,Fe.data);U.generateMipmaps=!1}else re?(Me&&t.texStorage2D(n.TEXTURE_2D,De,Ne,be.width,be.height),ae&&J(U,be,Te,Oe)):t.texImage2D(n.TEXTURE_2D,0,Ne,be.width,be.height,0,Te,Oe,be.data);else if(U.isCompressedTexture)if(U.isCompressedArrayTexture){re&&Me&&t.texStorage3D(n.TEXTURE_2D_ARRAY,De,Ne,Ye[0].width,Ye[0].height,be.depth);for(let Ae=0,Ge=Ye.length;Ae<Ge;Ae++)if(Fe=Ye[Ae],U.format!==na)if(Te!==null)if(re){if(ae)if(U.layerUpdates.size>0){let $e=Ad(Fe.width,Fe.height,U.format,U.type);for(let He of U.layerUpdates){let ct=Fe.data.subarray(He*$e/Fe.data.BYTES_PER_ELEMENT,(He+1)*$e/Fe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Ae,0,0,He,Fe.width,Fe.height,1,Te,ct)}}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Ae,0,0,0,Fe.width,Fe.height,be.depth,Te,Fe.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,Ae,Ne,Fe.width,Fe.height,be.depth,0,Fe.data,0,0);else xt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else re?ae&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,Ae,0,0,0,Fe.width,Fe.height,be.depth,Te,Oe,Fe.data):t.texImage3D(n.TEXTURE_2D_ARRAY,Ae,Ne,Fe.width,Fe.height,be.depth,0,Te,Oe,Fe.data);U.layerUpdates.size>0&&U.clearLayerUpdates()}else{re&&Me&&t.texStorage2D(n.TEXTURE_2D,De,Ne,Ye[0].width,Ye[0].height);for(let Ae=0,Ge=Ye.length;Ae<Ge;Ae++)Fe=Ye[Ae],U.format!==na?Te!==null?re?ae&&t.compressedTexSubImage2D(n.TEXTURE_2D,Ae,0,0,Fe.width,Fe.height,Te,Fe.data):t.compressedTexImage2D(n.TEXTURE_2D,Ae,Ne,Fe.width,Fe.height,0,Fe.data):xt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):re?ae&&t.texSubImage2D(n.TEXTURE_2D,Ae,0,0,Fe.width,Fe.height,Te,Oe,Fe.data):t.texImage2D(n.TEXTURE_2D,Ae,Ne,Fe.width,Fe.height,0,Te,Oe,Fe.data)}else if(U.isDataArrayTexture)if(re){if(Me&&t.texStorage3D(n.TEXTURE_2D_ARRAY,De,Ne,be.width,be.height,be.depth),ae)if(U.layerUpdates.size>0){let Ae=Ad(be.width,be.height,U.format,U.type);for(let Ge of U.layerUpdates){let $e=be.data.subarray(Ge*Ae/be.data.BYTES_PER_ELEMENT,(Ge+1)*Ae/be.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,Ge,be.width,be.height,1,Te,Oe,$e)}U.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,be.width,be.height,be.depth,Te,Oe,be.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ne,be.width,be.height,be.depth,0,Te,Oe,be.data);else if(U.isData3DTexture)re?(Me&&t.texStorage3D(n.TEXTURE_3D,De,Ne,be.width,be.height,be.depth),ae&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,be.width,be.height,be.depth,Te,Oe,be.data)):t.texImage3D(n.TEXTURE_3D,0,Ne,be.width,be.height,be.depth,0,Te,Oe,be.data);else if(U.isFramebufferTexture){if(Me)if(re)t.texStorage2D(n.TEXTURE_2D,De,Ne,be.width,be.height);else{let Ae=be.width,Ge=be.height;for(let $e=0;$e<De;$e++)t.texImage2D(n.TEXTURE_2D,$e,Ne,Ae,Ge,0,Te,Oe,null),Ae>>=1,Ge>>=1}}else if(U.isHTMLTexture){if("texElementImage2D"in n){let Ae=n.canvas;if(Ae.hasAttribute("layoutsubtree")||Ae.setAttribute("layoutsubtree","true"),be.parentNode!==Ae){Ae.appendChild(be),h.add(U),Ae.onpaint=Ge=>{let $e=Ge.changedElements;for(let He of h)$e.includes(He.image)&&(He.needsUpdate=!0)},Ae.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,be);else{let $e=n.RGBA,He=n.RGBA,ct=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,$e,He,ct,be)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(Ye.length>0){if(re&&Me){let Ae=Ie(Ye[0]);t.texStorage2D(n.TEXTURE_2D,De,Ne,Ae.width,Ae.height)}for(let Ae=0,Ge=Ye.length;Ae<Ge;Ae++)Fe=Ye[Ae],re?ae&&t.texSubImage2D(n.TEXTURE_2D,Ae,0,0,Te,Oe,Fe):t.texImage2D(n.TEXTURE_2D,Ae,Ne,Te,Oe,Fe);U.generateMipmaps=!1}else if(re){if(Me){let Ae=Ie(be);t.texStorage2D(n.TEXTURE_2D,De,Ne,Ae.width,Ae.height)}ae&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,Te,Oe,be)}else t.texImage2D(n.TEXTURE_2D,0,Ne,Te,Oe,be);x(U)&&w(pe),I.__version=ge.version,U.onUpdate&&U.onUpdate(U)}Y.__version=U.version}function ve(Y,U,se){if(U.image.length!==6)return;let pe=Q(Y,U),ce=U.source;t.bindTexture(n.TEXTURE_CUBE_MAP,Y.__webglTexture,n.TEXTURE0+se);let ge=a.get(ce);if(ce.version!==ge.__version||pe===!0){t.activeTexture(n.TEXTURE0+se);let I=Dt.getPrimaries(Dt.workingColorSpace),ue=U.colorSpace===ci?null:Dt.getPrimaries(U.colorSpace),be=U.colorSpace===ci||I===ue?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,U.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,U.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,be);let Te=U.isCompressedTexture||U.image[0].isCompressedTexture,Oe=U.image[0]&&U.image[0].isDataTexture,Ne=[];for(let He=0;He<6;He++)!Te&&!Oe?Ne[He]=v(U.image[He],!0,i.maxCubemapSize):Ne[He]=Oe?U.image[He].image:U.image[He],Ne[He]=ft(U,Ne[He]);let Fe=Ne[0],Ye=o.convert(U.format,U.colorSpace),re=o.convert(U.type),Me=g(U.internalFormat,Ye,re,U.normalized,U.colorSpace),ae=U.isVideoTexture!==!0,De=ge.__version===void 0||pe===!0,Ae=ce.dataReady,Ge=R(U,Fe);k(n.TEXTURE_CUBE_MAP,U);let $e;if(Te){ae&&De&&t.texStorage2D(n.TEXTURE_CUBE_MAP,Ge,Me,Fe.width,Fe.height);for(let He=0;He<6;He++){$e=Ne[He].mipmaps;for(let ct=0;ct<$e.length;ct++){let rt=$e[ct];U.format!==na?Ye!==null?ae?Ae&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+He,ct,0,0,rt.width,rt.height,Ye,rt.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+He,ct,Me,rt.width,rt.height,0,rt.data):xt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ae?Ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+He,ct,0,0,rt.width,rt.height,Ye,re,rt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+He,ct,Me,rt.width,rt.height,0,Ye,re,rt.data)}}}else{if($e=U.mipmaps,ae&&De){$e.length>0&&Ge++;let He=Ie(Ne[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,Ge,Me,He.width,He.height)}for(let He=0;He<6;He++)if(Oe){ae?Ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+He,0,0,0,Ne[He].width,Ne[He].height,Ye,re,Ne[He].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+He,0,Me,Ne[He].width,Ne[He].height,0,Ye,re,Ne[He].data);for(let ct=0;ct<$e.length;ct++){let jt=$e[ct].image[He].image;ae?Ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+He,ct+1,0,0,jt.width,jt.height,Ye,re,jt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+He,ct+1,Me,jt.width,jt.height,0,Ye,re,jt.data)}}else{ae?Ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+He,0,0,0,Ye,re,Ne[He]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+He,0,Me,Ye,re,Ne[He]);for(let ct=0;ct<$e.length;ct++){let rt=$e[ct];ae?Ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+He,ct+1,0,0,Ye,re,rt.image[He]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+He,ct+1,Me,Ye,re,rt.image[He])}}}x(U)&&w(n.TEXTURE_CUBE_MAP),ge.__version=ce.version,U.onUpdate&&U.onUpdate(U)}Y.__version=U.version}function ye(Y,U,se,pe,ce,ge){let I=o.convert(se.format,se.colorSpace),ue=o.convert(se.type),be=g(se.internalFormat,I,ue,se.normalized,se.colorSpace),Te=a.get(U),Oe=a.get(se);if(Oe.__renderTarget=U,!Te.__hasExternalTextures){let Ne=Math.max(1,U.width>>ge),Fe=Math.max(1,U.height>>ge);ce===n.TEXTURE_3D||ce===n.TEXTURE_2D_ARRAY?t.texImage3D(ce,ge,be,Ne,Fe,U.depth,0,I,ue,null):t.texImage2D(ce,ge,be,Ne,Fe,0,I,ue,null)}t.bindFramebuffer(n.FRAMEBUFFER,Y),ze(U)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,pe,ce,Oe.__webglTexture,0,Re(U)):(ce===n.TEXTURE_2D||ce>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&ce<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,pe,ce,Oe.__webglTexture,ge),t.bindFramebuffer(n.FRAMEBUFFER,null)}function Z(Y,U,se){if(n.bindRenderbuffer(n.RENDERBUFFER,Y),U.depthBuffer){let pe=U.depthTexture,ce=pe&&pe.isDepthTexture?pe.type:null,ge=L(U.stencilBuffer,ce),I=U.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;ze(U)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Re(U),ge,U.width,U.height):se?n.renderbufferStorageMultisample(n.RENDERBUFFER,Re(U),ge,U.width,U.height):n.renderbufferStorage(n.RENDERBUFFER,ge,U.width,U.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,I,n.RENDERBUFFER,Y)}else{let pe=U.textures;for(let ce=0;ce<pe.length;ce++){let ge=pe[ce],I=o.convert(ge.format,ge.colorSpace),ue=o.convert(ge.type),be=g(ge.internalFormat,I,ue,ge.normalized,ge.colorSpace);ze(U)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Re(U),be,U.width,U.height):se?n.renderbufferStorageMultisample(n.RENDERBUFFER,Re(U),be,U.width,U.height):n.renderbufferStorage(n.RENDERBUFFER,be,U.width,U.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function ne(Y,U,se){let pe=U.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,Y),!(U.depthTexture&&U.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let ce=a.get(U.depthTexture);if(ce.__renderTarget=U,(!ce.__webglTexture||U.depthTexture.image.width!==U.width||U.depthTexture.image.height!==U.height)&&(U.depthTexture.image.width=U.width,U.depthTexture.image.height=U.height,U.depthTexture.needsUpdate=!0),pe){if(ce.__webglInit===void 0&&(ce.__webglInit=!0,U.depthTexture.addEventListener("dispose",z)),ce.__webglTexture===void 0){ce.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,ce.__webglTexture),k(n.TEXTURE_CUBE_MAP,U.depthTexture);let Te=o.convert(U.depthTexture.format),Oe=o.convert(U.depthTexture.type),Ne;U.depthTexture.format===Ha?Ne=n.DEPTH_COMPONENT24:U.depthTexture.format===Oi&&(Ne=n.DEPTH24_STENCIL8);for(let Fe=0;Fe<6;Fe++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Fe,0,Ne,U.width,U.height,0,Te,Oe,null)}}else A(U.depthTexture,0);let ge=ce.__webglTexture,I=Re(U),ue=pe?n.TEXTURE_CUBE_MAP_POSITIVE_X+se:n.TEXTURE_2D,be=U.depthTexture.format===Oi?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(U.depthTexture.format===Ha)ze(U)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,be,ue,ge,0,I):n.framebufferTexture2D(n.FRAMEBUFFER,be,ue,ge,0);else if(U.depthTexture.format===Oi)ze(U)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,be,ue,ge,0,I):n.framebufferTexture2D(n.FRAMEBUFFER,be,ue,ge,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ee(Y){let U=a.get(Y),se=Y.isWebGLCubeRenderTarget===!0;if(U.__boundDepthTexture!==Y.depthTexture){let pe=Y.depthTexture;if(U.__depthDisposeCallback&&U.__depthDisposeCallback(),pe){let ce=()=>{delete U.__boundDepthTexture,delete U.__depthDisposeCallback,pe.removeEventListener("dispose",ce)};pe.addEventListener("dispose",ce),U.__depthDisposeCallback=ce}U.__boundDepthTexture=pe}if(Y.depthTexture&&!U.__autoAllocateDepthBuffer)if(se)for(let pe=0;pe<6;pe++)ne(U.__webglFramebuffer[pe],Y,pe);else{let pe=Y.texture.mipmaps;pe&&pe.length>0?ne(U.__webglFramebuffer[0],Y,0):ne(U.__webglFramebuffer,Y,0)}else if(se){U.__webglDepthbuffer=[];for(let pe=0;pe<6;pe++)if(t.bindFramebuffer(n.FRAMEBUFFER,U.__webglFramebuffer[pe]),U.__webglDepthbuffer[pe]===void 0)U.__webglDepthbuffer[pe]=n.createRenderbuffer(),Z(U.__webglDepthbuffer[pe],Y,!1);else{let ce=Y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ge=U.__webglDepthbuffer[pe];n.bindRenderbuffer(n.RENDERBUFFER,ge),n.framebufferRenderbuffer(n.FRAMEBUFFER,ce,n.RENDERBUFFER,ge)}}else{let pe=Y.texture.mipmaps;if(pe&&pe.length>0?t.bindFramebuffer(n.FRAMEBUFFER,U.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,U.__webglFramebuffer),U.__webglDepthbuffer===void 0)U.__webglDepthbuffer=n.createRenderbuffer(),Z(U.__webglDepthbuffer,Y,!1);else{let ce=Y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ge=U.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ge),n.framebufferRenderbuffer(n.FRAMEBUFFER,ce,n.RENDERBUFFER,ge)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function ie(Y,U,se){let pe=a.get(Y);U!==void 0&&ye(pe.__webglFramebuffer,Y,Y.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),se!==void 0&&ee(Y)}function q(Y){let U=Y.texture,se=a.get(Y),pe=a.get(U);Y.addEventListener("dispose",p);let ce=Y.textures,ge=Y.isWebGLCubeRenderTarget===!0,I=ce.length>1;if(I||(pe.__webglTexture===void 0&&(pe.__webglTexture=n.createTexture()),pe.__version=U.version,r.memory.textures++),ge){se.__webglFramebuffer=[];for(let ue=0;ue<6;ue++)if(U.mipmaps&&U.mipmaps.length>0){se.__webglFramebuffer[ue]=[];for(let be=0;be<U.mipmaps.length;be++)se.__webglFramebuffer[ue][be]=n.createFramebuffer()}else se.__webglFramebuffer[ue]=n.createFramebuffer()}else{if(U.mipmaps&&U.mipmaps.length>0){se.__webglFramebuffer=[];for(let ue=0;ue<U.mipmaps.length;ue++)se.__webglFramebuffer[ue]=n.createFramebuffer()}else se.__webglFramebuffer=n.createFramebuffer();if(I)for(let ue=0,be=ce.length;ue<be;ue++){let Te=a.get(ce[ue]);Te.__webglTexture===void 0&&(Te.__webglTexture=n.createTexture(),r.memory.textures++)}if(Y.samples>0&&ze(Y)===!1){se.__webglMultisampledFramebuffer=n.createFramebuffer(),se.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,se.__webglMultisampledFramebuffer);for(let ue=0;ue<ce.length;ue++){let be=ce[ue];se.__webglColorRenderbuffer[ue]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,se.__webglColorRenderbuffer[ue]);let Te=o.convert(be.format,be.colorSpace),Oe=o.convert(be.type),Ne=g(be.internalFormat,Te,Oe,be.normalized,be.colorSpace,Y.isXRRenderTarget===!0),Fe=Re(Y);n.renderbufferStorageMultisample(n.RENDERBUFFER,Fe,Ne,Y.width,Y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ue,n.RENDERBUFFER,se.__webglColorRenderbuffer[ue])}n.bindRenderbuffer(n.RENDERBUFFER,null),Y.depthBuffer&&(se.__webglDepthRenderbuffer=n.createRenderbuffer(),Z(se.__webglDepthRenderbuffer,Y,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ge){t.bindTexture(n.TEXTURE_CUBE_MAP,pe.__webglTexture),k(n.TEXTURE_CUBE_MAP,U);for(let ue=0;ue<6;ue++)if(U.mipmaps&&U.mipmaps.length>0)for(let be=0;be<U.mipmaps.length;be++)ye(se.__webglFramebuffer[ue][be],Y,U,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,be);else ye(se.__webglFramebuffer[ue],Y,U,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0);x(U)&&w(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(I){for(let ue=0,be=ce.length;ue<be;ue++){let Te=ce[ue],Oe=a.get(Te),Ne=n.TEXTURE_2D;(Y.isWebGL3DRenderTarget||Y.isWebGLArrayRenderTarget)&&(Ne=Y.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(Ne,Oe.__webglTexture),k(Ne,Te),ye(se.__webglFramebuffer,Y,Te,n.COLOR_ATTACHMENT0+ue,Ne,0),x(Te)&&w(Ne)}t.unbindTexture()}else{let ue=n.TEXTURE_2D;if((Y.isWebGL3DRenderTarget||Y.isWebGLArrayRenderTarget)&&(ue=Y.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(ue,pe.__webglTexture),k(ue,U),U.mipmaps&&U.mipmaps.length>0)for(let be=0;be<U.mipmaps.length;be++)ye(se.__webglFramebuffer[be],Y,U,n.COLOR_ATTACHMENT0,ue,be);else ye(se.__webglFramebuffer,Y,U,n.COLOR_ATTACHMENT0,ue,0);x(U)&&w(ue),t.unbindTexture()}Y.depthBuffer&&ee(Y)}function oe(Y){let U=Y.textures;for(let se=0,pe=U.length;se<pe;se++){let ce=U[se];if(x(ce)){let ge=S(Y),I=a.get(ce).__webglTexture;t.bindTexture(ge,I),w(ge),t.unbindTexture()}}}let fe=[],$=[];function me(Y){if(Y.samples>0){if(ze(Y)===!1){let U=Y.textures,se=Y.width,pe=Y.height,ce=n.COLOR_BUFFER_BIT,ge=Y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,I=a.get(Y),ue=U.length>1;if(ue)for(let Te=0;Te<U.length;Te++)t.bindFramebuffer(n.FRAMEBUFFER,I.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Te,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,I.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Te,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,I.__webglMultisampledFramebuffer);let be=Y.texture.mipmaps;be&&be.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,I.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,I.__webglFramebuffer);for(let Te=0;Te<U.length;Te++){if(Y.resolveDepthBuffer&&(Y.depthBuffer&&(ce|=n.DEPTH_BUFFER_BIT),Y.stencilBuffer&&Y.resolveStencilBuffer&&(ce|=n.STENCIL_BUFFER_BIT)),ue){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,I.__webglColorRenderbuffer[Te]);let Oe=a.get(U[Te]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Oe,0)}n.blitFramebuffer(0,0,se,pe,0,0,se,pe,ce,n.NEAREST),s===!0&&(fe.length=0,$.length=0,fe.push(n.COLOR_ATTACHMENT0+Te),Y.depthBuffer&&Y.storeMultisampledDepthBuffer===!1&&(fe.push(ge),$.push(ge),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,$)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,fe))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ue)for(let Te=0;Te<U.length;Te++){t.bindFramebuffer(n.FRAMEBUFFER,I.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Te,n.RENDERBUFFER,I.__webglColorRenderbuffer[Te]);let Oe=a.get(U[Te]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,I.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Te,n.TEXTURE_2D,Oe,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,I.__webglMultisampledFramebuffer)}else if(Y.depthBuffer&&Y.storeMultisampledDepthBuffer===!1&&s){let U=Y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[U])}}}function Re(Y){return Math.min(i.maxSamples,Y.samples)}function ze(Y){let U=a.get(Y);return Y.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&U.__useRenderToTexture!==!1}function te(Y){let U=r.render.frame;u.get(Y)!==U&&(u.set(Y,U),Y.update())}function ft(Y,U){let se=Y.colorSpace,pe=Y.format,ce=Y.type;return Y.isCompressedTexture===!0||Y.isVideoTexture===!0||se!==Ir&&se!==ci&&(Dt.getTransfer(se)===Kt?(pe!==na||ce!==$n)&&xt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):bt("WebGLTextures: Unsupported texture color space:",se)),U}function Ie(Y){return typeof HTMLImageElement<"u"&&Y instanceof HTMLImageElement?(c.width=Y.naturalWidth||Y.width,c.height=Y.naturalHeight||Y.height):typeof VideoFrame<"u"&&Y instanceof VideoFrame?(c.width=Y.displayWidth,c.height=Y.displayHeight):(c.width=Y.width,c.height=Y.height),c}this.allocateTextureUnit=T,this.resetTextureUnits=V,this.getTextureUnits=N,this.setTextureUnits=O,this.setTexture2D=A,this.setTexture2DArray=f,this.setTexture3D=M,this.setTextureCube=_,this.rebindTextures=ie,this.setupRenderTarget=q,this.updateRenderTargetMipmap=oe,this.updateMultisampleRenderTarget=me,this.setupDepthRenderbuffer=ee,this.setupFrameBufferTexture=ye,this.useMultisampledRTT=ze,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Xb(n,e){function t(a,i=ci){let o,r=Dt.getTransfer(i);if(a===$n)return n.UNSIGNED_BYTE;if(a===nc)return n.UNSIGNED_SHORT_4_4_4_4;if(a===ac)return n.UNSIGNED_SHORT_5_5_5_1;if(a===gd)return n.UNSIGNED_INT_5_9_9_9_REV;if(a===xd)return n.UNSIGNED_INT_10F_11F_11F_REV;if(a===pd)return n.BYTE;if(a===md)return n.SHORT;if(a===tr)return n.UNSIGNED_SHORT;if(a===tc)return n.INT;if(a===Da)return n.UNSIGNED_INT;if(a===_a)return n.FLOAT;if(a===ta)return n.HALF_FLOAT;if(a===vd)return n.ALPHA;if(a===yd)return n.RGB;if(a===na)return n.RGBA;if(a===Ha)return n.DEPTH_COMPONENT;if(a===Oi)return n.DEPTH_STENCIL;if(a===ar)return n.RED;if(a===ic)return n.RED_INTEGER;if(a===Gi)return n.RG;if(a===oc)return n.RG_INTEGER;if(a===rc)return n.RGBA_INTEGER;if(a===ns||a===as||a===is||a===os)if(r===Kt)if(o=e.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(a===ns)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(a===as)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(a===is)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(a===os)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=e.get("WEBGL_compressed_texture_s3tc"),o!==null){if(a===ns)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(a===as)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(a===is)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(a===os)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(a===sc||a===lc||a===cc||a===uc)if(o=e.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(a===sc)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(a===lc)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(a===cc)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(a===uc)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(a===dc||a===hc||a===fc||a===pc||a===mc||a===rs||a===gc)if(o=e.get("WEBGL_compressed_texture_etc"),o!==null){if(a===dc||a===hc)return r===Kt?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(a===fc)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC;if(a===pc)return o.COMPRESSED_R11_EAC;if(a===mc)return o.COMPRESSED_SIGNED_R11_EAC;if(a===rs)return o.COMPRESSED_RG11_EAC;if(a===gc)return o.COMPRESSED_SIGNED_RG11_EAC}else return null;if(a===xc||a===vc||a===yc||a===bc||a===Mc||a===_c||a===Ec||a===Sc||a===Tc||a===wc||a===Ac||a===Rc||a===Cc||a===zc)if(o=e.get("WEBGL_compressed_texture_astc"),o!==null){if(a===xc)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(a===vc)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(a===yc)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(a===bc)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(a===Mc)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(a===_c)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(a===Ec)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(a===Sc)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(a===Tc)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(a===wc)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(a===Ac)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(a===Rc)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(a===Cc)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(a===zc)return r===Kt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(a===Pc||a===Ic||a===Lc)if(o=e.get("EXT_texture_compression_bptc"),o!==null){if(a===Pc)return r===Kt?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(a===Ic)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(a===Lc)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(a===Dc||a===Nc||a===ss||a===Uc)if(o=e.get("EXT_texture_compression_rgtc"),o!==null){if(a===Dc)return o.COMPRESSED_RED_RGTC1_EXT;if(a===Nc)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(a===ss)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(a===Uc)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return a===nr?n.UNSIGNED_INT_24_8:n[a]!==void 0?n[a]:null}return{convert:t}}var Yb=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,$b=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Gd=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let a=new Or(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=a}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,a=new $t({vertexShader:Yb,fragmentShader:$b,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new xe(new an(20,20),a)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Vd=class extends Oa{constructor(e,t){super();let a=this,i=null,o=1,r=null,l="local-floor",s=1,c=null,u=null,h=null,d=null,m=null,y=null,b=typeof XRWebGLBinding<"u",v=new Gd,x={},w=t.getContextAttributes(),S=null,g=null,L=[],R=[],z=new nt,p=null,P=null,F=new Nn;F.viewport=new gn;let H=new Nn;H.viewport=new gn;let W=[F,H],V=new Zl,N=null,O=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(G){let J=L[G];return J===void 0&&(J=new $o,L[G]=J),J.getTargetRaySpace()},this.getControllerGrip=function(G){let J=L[G];return J===void 0&&(J=new $o,L[G]=J),J.getGripSpace()},this.getHand=function(G){let J=L[G];return J===void 0&&(J=new $o,L[G]=J),J.getHandSpace()};function T(G){let J=R.indexOf(G.inputSource);if(J===-1)return;let he=L[J];he!==void 0&&(he.update(G.inputSource,G.frame,c||r),he.dispatchEvent({type:G.type,data:G.inputSource}))}function E(){i.removeEventListener("select",T),i.removeEventListener("selectstart",T),i.removeEventListener("selectend",T),i.removeEventListener("squeeze",T),i.removeEventListener("squeezestart",T),i.removeEventListener("squeezeend",T),i.removeEventListener("end",E),i.removeEventListener("inputsourceschange",A);for(let G=0;G<L.length;G++){let J=R[G];J!==null&&(R[G]=null,L[G].disconnect(J))}N=null,O=null,v.reset();for(let G in x)delete x[G];if(e.setRenderTarget(S),m=null,d=null,h=null,i=null,g=null,Q.stop(),a.isPresenting=!1,e.setPixelRatio(p),e.setSize(z.width,z.height,!1),P!==null){let G=P.camera;G.fov=P.fov,G.zoom=P.zoom,G.updateProjectionMatrix(),P=null}a.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(G){o=G,a.isPresenting===!0&&xt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(G){l=G,a.isPresenting===!0&&xt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||r},this.setReferenceSpace=function(G){c=G},this.getBaseLayer=function(){return d!==null?d:m},this.getBinding=function(){return h===null&&b&&(h=new XRWebGLBinding(i,t)),h},this.getFrame=function(){return y},this.getSession=function(){return i},this.setSession=async function(G){if(i=G,i!==null){if(S=e.getRenderTarget(),i.addEventListener("select",T),i.addEventListener("selectstart",T),i.addEventListener("selectend",T),i.addEventListener("squeeze",T),i.addEventListener("squeezestart",T),i.addEventListener("squeezeend",T),i.addEventListener("end",E),i.addEventListener("inputsourceschange",A),w.xrCompatible!==!0&&await t.makeXRCompatible(),p=e.getPixelRatio(),e.getSize(z),b&&"createProjectionLayer"in XRWebGLBinding.prototype){let he=null,ve=null,ye=null;w.depth&&(ye=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,he=w.stencil?Oi:Ha,ve=w.stencil?nr:Da);let Z={colorFormat:t.RGBA8,depthFormat:ye,scaleFactor:o};h=this.getBinding(),d=h.createProjectionLayer(Z),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),g=new Fn(d.textureWidth,d.textureHeight,{format:na,type:$n,depthTexture:new Ii(d.textureWidth,d.textureHeight,ve,void 0,void 0,void 0,void 0,void 0,void 0,he),stencilBuffer:w.stencil,colorSpace:e.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let he={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:o};m=new XRWebGLLayer(i,t,he),i.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),g=new Fn(m.framebufferWidth,m.framebufferHeight,{format:na,type:$n,colorSpace:e.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1,storeMultisampledDepthBuffer:m.ignoreDepthValues===!1,storeMultisampledStencilBuffer:m.ignoreDepthValues===!1})}g.isXRRenderTarget=!0,this.setFoveation(s),c=null,r=await i.requestReferenceSpace(l),Q.setContext(i),Q.start(),a.isPresenting=!0,a.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function A(G){for(let J=0;J<G.removed.length;J++){let he=G.removed[J],ve=R.indexOf(he);ve>=0&&(R[ve]=null,L[ve].disconnect(he))}for(let J=0;J<G.added.length;J++){let he=G.added[J],ve=R.indexOf(he);if(ve===-1){for(let Z=0;Z<L.length;Z++)if(Z>=R.length){R.push(he),ve=Z;break}else if(R[Z]===null){R[Z]=he,ve=Z;break}if(ve===-1)break}let ye=L[ve];ye&&ye.connect(he)}}let f=new X,M=new X;function _(G,J,he){f.setFromMatrixPosition(J.matrixWorld),M.setFromMatrixPosition(he.matrixWorld);let ve=f.distanceTo(M),ye=J.projectionMatrix.elements,Z=he.projectionMatrix.elements,ne=ye[14]/(ye[10]-1),ee=ye[14]/(ye[10]+1),ie=(ye[9]+1)/ye[5],q=(ye[9]-1)/ye[5],oe=(ye[8]-1)/ye[0],fe=(Z[8]+1)/Z[0],$=ne*oe,me=ne*fe,Re=ve/(-oe+fe),ze=Re*-oe;if(J.matrixWorld.decompose(G.position,G.quaternion,G.scale),G.translateX(ze),G.translateZ(Re),G.matrixWorld.compose(G.position,G.quaternion,G.scale),G.matrixWorldInverse.copy(G.matrixWorld).invert(),ye[10]===-1)G.projectionMatrix.copy(J.projectionMatrix),G.projectionMatrixInverse.copy(J.projectionMatrixInverse);else{let te=ne+Re,ft=ee+Re,Ie=$-ze,Y=me+(ve-ze),U=ie*ee/ft*te,se=q*ee/ft*te;G.projectionMatrix.makePerspective(Ie,Y,U,se,te,ft),G.projectionMatrixInverse.copy(G.projectionMatrix).invert()}}function C(G,J){J===null?G.matrixWorld.copy(G.matrix):G.matrixWorld.multiplyMatrices(J.matrixWorld,G.matrix),G.matrixWorldInverse.copy(G.matrixWorld).invert()}this.updateCamera=function(G){if(i===null)return;let J=G.near,he=G.far;v.texture!==null&&(v.depthNear>0&&(J=v.depthNear),v.depthFar>0&&(he=v.depthFar)),V.near=H.near=F.near=J,V.far=H.far=F.far=he,(N!==V.near||O!==V.far)&&(i.updateRenderState({depthNear:V.near,depthFar:V.far}),N=V.near,O=V.far),V.layers.mask=G.layers.mask|6,F.layers.mask=V.layers.mask&-5,H.layers.mask=V.layers.mask&-3;let ve=G.parent,ye=V.cameras;C(V,ve);for(let Z=0;Z<ye.length;Z++)C(ye[Z],ve);ye.length===2?_(V,F,H):V.projectionMatrix.copy(F.projectionMatrix),P===null&&G.isPerspectiveCamera&&(P={camera:G,fov:G.fov,zoom:G.zoom}),D(G,V,ve)};function D(G,J,he){he===null?G.matrix.copy(J.matrixWorld):(G.matrix.copy(he.matrixWorld),G.matrix.invert(),G.matrix.multiply(J.matrixWorld)),G.matrix.decompose(G.position,G.quaternion,G.scale),G.updateMatrixWorld(!0),G.projectionMatrix.copy(J.projectionMatrix),G.projectionMatrixInverse.copy(J.projectionMatrixInverse),G.isPerspectiveCamera&&(G.fov=oo*2*Math.atan(1/G.projectionMatrix.elements[5]),G.zoom=1)}this.getCamera=function(){return V},this.getFoveation=function(){if(!(d===null&&m===null))return s},this.setFoveation=function(G){s=G,d!==null&&(d.fixedFoveation=G),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=G)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(V)},this.getCameraTexture=function(G){return x[G]};let B=null;function k(G,J){if(u=J.getViewerPose(c||r),y=J,u!==null){let he=u.views;m!==null&&(e.setRenderTargetFramebuffer(g,m.framebuffer),e.setRenderTarget(g));let ve=!1;he.length!==V.cameras.length&&(V.cameras.length=0,ve=!0);for(let ee=0;ee<he.length;ee++){let ie=he[ee],q=null;if(m!==null)q=m.getViewport(ie);else{let fe=h.getViewSubImage(d,ie);q=fe.viewport,ee===0&&(e.setRenderTargetTextures(g,fe.colorTexture,fe.depthStencilTexture),e.setRenderTarget(g))}let oe=W[ee];oe===void 0&&(oe=new Nn,oe.layers.enable(ee),oe.viewport=new gn,W[ee]=oe),oe.matrix.fromArray(ie.transform.matrix),oe.matrix.decompose(oe.position,oe.quaternion,oe.scale),oe.projectionMatrix.fromArray(ie.projectionMatrix),oe.projectionMatrixInverse.copy(oe.projectionMatrix).invert(),oe.viewport.set(q.x,q.y,q.width,q.height),ee===0&&(V.matrix.copy(oe.matrix),V.matrix.decompose(V.position,V.quaternion,V.scale)),ve===!0&&V.cameras.push(oe)}let ye=i.enabledFeatures;if(ye&&ye.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&b){h=a.getBinding();let ee=h.getDepthInformation(he[0]);ee&&ee.isValid&&ee.texture&&v.init(ee,i.renderState)}if(ye&&ye.includes("camera-access")&&b){e.state.unbindTexture(),h=a.getBinding();for(let ee=0;ee<he.length;ee++){let ie=he[ee].camera;if(ie){let q=x[ie];q||(q=new Or,x[ie]=q);let oe=h.getCameraImage(ie);q.sourceTexture=oe}}}}for(let he=0;he<L.length;he++){let ve=R[he],ye=L[he];ve!==null&&ye!==void 0&&ye.update(ve,J,c||r)}B&&B(G,J),J.detectedPlanes&&a.dispatchEvent({type:"planesdetected",data:J}),y=null}let Q=new tp;Q.setAnimationLoop(k),this.setAnimationLoop=function(G){B=G},this.dispose=function(){}}},Zb=new At,sp=new Mt;sp.set(-1,0,0,0,1,0,0,0,1);function Jb(n,e){function t(v,x){v.matrixAutoUpdate===!0&&v.updateMatrix(),x.value.copy(v.matrix)}function a(v,x){x.color.getRGB(v.fogColor.value,Sd(n)),x.isFog?(v.fogNear.value=x.near,v.fogFar.value=x.far):x.isFogExp2&&(v.fogDensity.value=x.density)}function i(v,x,w,S,g){x.isNodeMaterial?x.uniformsNeedUpdate=!1:x.isMeshBasicMaterial?o(v,x):x.isMeshLambertMaterial?(o(v,x),x.envMap&&(v.envMapIntensity.value=x.envMapIntensity)):x.isMeshToonMaterial?(o(v,x),h(v,x)):x.isMeshPhongMaterial?(o(v,x),u(v,x),x.envMap&&(v.envMapIntensity.value=x.envMapIntensity)):x.isMeshStandardMaterial?(o(v,x),d(v,x),x.isMeshPhysicalMaterial&&m(v,x,g)):x.isMeshMatcapMaterial?(o(v,x),y(v,x)):x.isMeshDepthMaterial?o(v,x):x.isMeshDistanceMaterial?(o(v,x),b(v,x)):x.isMeshNormalMaterial?o(v,x):x.isLineBasicMaterial?(r(v,x),x.isLineDashedMaterial&&l(v,x)):x.isPointsMaterial?s(v,x,w,S):x.isSpriteMaterial?c(v,x):x.isShadowMaterial?(v.color.value.copy(x.color),v.opacity.value=x.opacity):x.isShaderMaterial&&(x.uniformsNeedUpdate=!1)}function o(v,x){v.opacity.value=x.opacity,x.color&&v.diffuse.value.copy(x.color),x.emissive&&v.emissive.value.copy(x.emissive).multiplyScalar(x.emissiveIntensity),x.map&&(v.map.value=x.map,t(x.map,v.mapTransform)),x.alphaMap&&(v.alphaMap.value=x.alphaMap,t(x.alphaMap,v.alphaMapTransform)),x.bumpMap&&(v.bumpMap.value=x.bumpMap,t(x.bumpMap,v.bumpMapTransform),v.bumpScale.value=x.bumpScale,x.side===Hn&&(v.bumpScale.value*=-1)),x.normalMap&&(v.normalMap.value=x.normalMap,t(x.normalMap,v.normalMapTransform),v.normalScale.value.copy(x.normalScale),x.side===Hn&&v.normalScale.value.negate()),x.displacementMap&&(v.displacementMap.value=x.displacementMap,t(x.displacementMap,v.displacementMapTransform),v.displacementScale.value=x.displacementScale,v.displacementBias.value=x.displacementBias),x.emissiveMap&&(v.emissiveMap.value=x.emissiveMap,t(x.emissiveMap,v.emissiveMapTransform)),x.specularMap&&(v.specularMap.value=x.specularMap,t(x.specularMap,v.specularMapTransform)),x.alphaTest>0&&(v.alphaTest.value=x.alphaTest);let w=e.get(x),S=w.envMap,g=w.envMapRotation;S&&(v.envMap.value=S,v.envMapRotation.value.setFromMatrix4(Zb.makeRotationFromEuler(g)).transpose(),S.isCubeTexture&&S.isRenderTargetTexture===!1&&v.envMapRotation.value.premultiply(sp),v.reflectivity.value=x.reflectivity,v.ior.value=x.ior,v.refractionRatio.value=x.refractionRatio),x.lightMap&&(v.lightMap.value=x.lightMap,v.lightMapIntensity.value=x.lightMapIntensity,t(x.lightMap,v.lightMapTransform)),x.aoMap&&(v.aoMap.value=x.aoMap,v.aoMapIntensity.value=x.aoMapIntensity,t(x.aoMap,v.aoMapTransform))}function r(v,x){v.diffuse.value.copy(x.color),v.opacity.value=x.opacity,x.map&&(v.map.value=x.map,t(x.map,v.mapTransform))}function l(v,x){v.dashSize.value=x.dashSize,v.totalSize.value=x.dashSize+x.gapSize,v.scale.value=x.scale}function s(v,x,w,S){v.diffuse.value.copy(x.color),v.opacity.value=x.opacity,v.size.value=x.size*w,v.scale.value=S*.5,x.map&&(v.map.value=x.map,t(x.map,v.uvTransform)),x.alphaMap&&(v.alphaMap.value=x.alphaMap,t(x.alphaMap,v.alphaMapTransform)),x.alphaTest>0&&(v.alphaTest.value=x.alphaTest)}function c(v,x){v.diffuse.value.copy(x.color),v.opacity.value=x.opacity,v.rotation.value=x.rotation,x.map&&(v.map.value=x.map,t(x.map,v.mapTransform)),x.alphaMap&&(v.alphaMap.value=x.alphaMap,t(x.alphaMap,v.alphaMapTransform)),x.alphaTest>0&&(v.alphaTest.value=x.alphaTest)}function u(v,x){v.specular.value.copy(x.specular),v.shininess.value=Math.max(x.shininess,1e-4)}function h(v,x){x.gradientMap&&(v.gradientMap.value=x.gradientMap)}function d(v,x){v.metalness.value=x.metalness,x.metalnessMap&&(v.metalnessMap.value=x.metalnessMap,t(x.metalnessMap,v.metalnessMapTransform)),v.roughness.value=x.roughness,x.roughnessMap&&(v.roughnessMap.value=x.roughnessMap,t(x.roughnessMap,v.roughnessMapTransform)),x.envMap&&(v.envMapIntensity.value=x.envMapIntensity)}function m(v,x,w){v.ior.value=x.ior,x.sheen>0&&(v.sheenColor.value.copy(x.sheenColor).multiplyScalar(x.sheen),v.sheenRoughness.value=x.sheenRoughness,x.sheenColorMap&&(v.sheenColorMap.value=x.sheenColorMap,t(x.sheenColorMap,v.sheenColorMapTransform)),x.sheenRoughnessMap&&(v.sheenRoughnessMap.value=x.sheenRoughnessMap,t(x.sheenRoughnessMap,v.sheenRoughnessMapTransform))),x.clearcoat>0&&(v.clearcoat.value=x.clearcoat,v.clearcoatRoughness.value=x.clearcoatRoughness,x.clearcoatMap&&(v.clearcoatMap.value=x.clearcoatMap,t(x.clearcoatMap,v.clearcoatMapTransform)),x.clearcoatRoughnessMap&&(v.clearcoatRoughnessMap.value=x.clearcoatRoughnessMap,t(x.clearcoatRoughnessMap,v.clearcoatRoughnessMapTransform)),x.clearcoatNormalMap&&(v.clearcoatNormalMap.value=x.clearcoatNormalMap,t(x.clearcoatNormalMap,v.clearcoatNormalMapTransform),v.clearcoatNormalScale.value.copy(x.clearcoatNormalScale),x.side===Hn&&v.clearcoatNormalScale.value.negate())),x.dispersion>0&&(v.dispersion.value=x.dispersion),x.retroreflectivity>0&&(v.retroreflectivity.value=x.retroreflectivity),x.iridescence>0&&(v.iridescence.value=x.iridescence,v.iridescenceIOR.value=x.iridescenceIOR,v.iridescenceThicknessMinimum.value=x.iridescenceThicknessRange[0],v.iridescenceThicknessMaximum.value=x.iridescenceThicknessRange[1],x.iridescenceMap&&(v.iridescenceMap.value=x.iridescenceMap,t(x.iridescenceMap,v.iridescenceMapTransform)),x.iridescenceThicknessMap&&(v.iridescenceThicknessMap.value=x.iridescenceThicknessMap,t(x.iridescenceThicknessMap,v.iridescenceThicknessMapTransform))),x.transmission>0&&(v.transmission.value=x.transmission,v.transmissionSamplerMap.value=w.texture,v.transmissionSamplerSize.value.set(w.width,w.height),x.transmissionMap&&(v.transmissionMap.value=x.transmissionMap,t(x.transmissionMap,v.transmissionMapTransform)),v.thickness.value=x.thickness,x.thicknessMap&&(v.thicknessMap.value=x.thicknessMap,t(x.thicknessMap,v.thicknessMapTransform)),v.attenuationDistance.value=x.attenuationDistance,v.attenuationColor.value.copy(x.attenuationColor)),x.anisotropy>0&&(v.anisotropyVector.value.set(x.anisotropy*Math.cos(x.anisotropyRotation),x.anisotropy*Math.sin(x.anisotropyRotation)),x.anisotropyMap&&(v.anisotropyMap.value=x.anisotropyMap,t(x.anisotropyMap,v.anisotropyMapTransform))),v.specularIntensity.value=x.specularIntensity,v.specularColor.value.copy(x.specularColor),x.specularColorMap&&(v.specularColorMap.value=x.specularColorMap,t(x.specularColorMap,v.specularColorMapTransform)),x.specularIntensityMap&&(v.specularIntensityMap.value=x.specularIntensityMap,t(x.specularIntensityMap,v.specularIntensityMapTransform))}function y(v,x){x.matcap&&(v.matcap.value=x.matcap)}function b(v,x){let w=e.get(x).light;v.referencePosition.value.setFromMatrixPosition(w.matrixWorld),v.nearDistance.value=w.shadow.camera.near,v.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:a,refreshMaterialUniforms:i}}function Kb(n,e,t,a){let i={},o={},r=[],l=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function s(g,L){let R=L.program;a.uniformBlockBinding(g,R)}function c(g,L){let R=i[g.id];R===void 0&&(v(g),R=u(g),i[g.id]=R,g.addEventListener("dispose",w));let z=L.program;a.updateUBOMapping(g,z);let p=e.render.frame;o[g.id]!==p&&(d(g),o[g.id]=p)}function u(g){let L=h();g.__bindingPointIndex=L;let R=n.createBuffer(),z=g.__size,p=g.usage;return n.bindBuffer(n.UNIFORM_BUFFER,R),n.bufferData(n.UNIFORM_BUFFER,z,p),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,L,R),R}function h(){for(let g=0;g<l;g++)if(r.indexOf(g)===-1)return r.push(g),g;return bt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(g){let L=i[g.id],R=g.uniforms,z=g.__cache;n.bindBuffer(n.UNIFORM_BUFFER,L);for(let p=0,P=R.length;p<P;p++){let F=R[p];if(Array.isArray(F))for(let H=0,W=F.length;H<W;H++)m(F[H],p,H,z);else m(F,p,0,z)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function m(g,L,R,z){if(b(g,L,R,z)===!0){let p=g.__offset,P=g.value;if(Array.isArray(P)){let F=0;for(let H=0;H<P.length;H++){let W=P[H],V=x(W);y(W,g.__data,F),typeof W!="number"&&typeof W!="boolean"&&!W.isMatrix3&&!ArrayBuffer.isView(W)&&(F+=V.storage/Float32Array.BYTES_PER_ELEMENT)}}else y(P,g.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,p,g.__data)}}function y(g,L,R){typeof g=="number"||typeof g=="boolean"?L[0]=g:g.isMatrix3?(L[0]=g.elements[0],L[1]=g.elements[1],L[2]=g.elements[2],L[3]=0,L[4]=g.elements[3],L[5]=g.elements[4],L[6]=g.elements[5],L[7]=0,L[8]=g.elements[6],L[9]=g.elements[7],L[10]=g.elements[8],L[11]=0):ArrayBuffer.isView(g)?L.set(new g.constructor(g.buffer,g.byteOffset,L.length)):g.toArray(L,R)}function b(g,L,R,z){let p=g.value,P=L+"_"+R;if(z[P]===void 0)return typeof p=="number"||typeof p=="boolean"?z[P]=p:ArrayBuffer.isView(p)?z[P]=p.slice():z[P]=p.clone(),!0;{let F=z[P];if(typeof p=="number"||typeof p=="boolean"){if(F!==p)return z[P]=p,!0}else{if(ArrayBuffer.isView(p))return!0;if(F.equals(p)===!1)return F.copy(p),!0}}return!1}function v(g){let L=g.uniforms,R=0,z=16;for(let P=0,F=L.length;P<F;P++){let H=Array.isArray(L[P])?L[P]:[L[P]];for(let W=0,V=H.length;W<V;W++){let N=H[W],O=Array.isArray(N.value)?N.value:[N.value];for(let T=0,E=O.length;T<E;T++){let A=O[T],f=x(A),M=R%z,_=M%f.boundary,C=M+_;R+=_,C!==0&&z-C<f.storage&&(R+=z-C),N.__data=new Float32Array(f.storage/Float32Array.BYTES_PER_ELEMENT),N.__offset=R,R+=f.storage}}}let p=R%z;return p>0&&(R+=z-p),g.__size=R,g.__cache={},this}function x(g){let L={boundary:0,storage:0};return typeof g=="number"||typeof g=="boolean"?(L.boundary=4,L.storage=4):g.isVector2?(L.boundary=8,L.storage=8):g.isVector3||g.isColor?(L.boundary=16,L.storage=12):g.isVector4?(L.boundary=16,L.storage=16):g.isMatrix3?(L.boundary=48,L.storage=48):g.isMatrix4?(L.boundary=64,L.storage=64):g.isTexture?xt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(g)?(L.boundary=16,L.storage=g.byteLength):xt("WebGLRenderer: Unsupported uniform value type.",g),L}function w(g){let L=g.target;L.removeEventListener("dispose",w);let R=r.indexOf(L.__bindingPointIndex);r.splice(R,1),n.deleteBuffer(i[L.id]),delete i[L.id],delete o[L.id]}function S(){for(let g in i)n.deleteBuffer(i[g]);r=[],i={},o={}}return{bind:s,update:c,dispose:S}}var Qb=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Xa=null;function e2(){return Xa===null&&(Xa=new ri(Qb,16,16,Gi,ta),Xa.name="DFG_LUT",Xa.minFilter=mn,Xa.magFilter=mn,Xa.wrapS=Ba,Xa.wrapT=Ba,Xa.generateMipmaps=!1,Xa.needsUpdate=!0),Xa}var Wc=class{constructor(e={}){let{canvas:t=A0(),context:a=null,depth:i=!0,stencil:o=!1,alpha:r=!1,antialias:l=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:d=!1,outputBufferType:m=$n}=e;this.isWebGLRenderer=!0;let y;if(a!==null){if(typeof WebGLRenderingContext<"u"&&a instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");y=a.getContextAttributes().alpha}else y=r;let b=m,v=new Set([rc,oc,ic]),x=new Set([$n,Da,tr,nr,nc,ac]),w=new Uint32Array(4),S=new Int32Array(4),g=new X,L=null,R=null,z=[],p=[],P=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=La,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let F=this,H=!1,W=null,V=null,N=null,O=null;this._outputColorSpace=Cn;let T=0,E=0,A=null,f=-1,M=null,_=new gn,C=new gn,D=null,B=new at(0),k=0,Q=t.width,G=t.height,J=1,he=null,ve=null,ye=new gn(0,0,Q,G),Z=new gn(0,0,Q,G),ne=!1,ee=new Zo,ie=!1,q=!1,oe=new At,fe=new X,$=new gn,me={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Re=!1;function ze(){return A===null?J:1}let te=a;function ft(j,de){return t.getContext(j,de)}let Ie,Y,U,se,pe,ce,ge,I,ue,be,Te,Oe,Ne,Fe,Ye,re,Me,ae,De,Ae,Ge,$e,He;try{let j={alpha:!0,depth:i,stencil:o,antialias:l,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",jt,!1),t.addEventListener("webglcontextrestored",Gt,!1),t.addEventListener("webglcontextcreationerror",ra,!1),te===null){let de="webgl2";if(te=ft(de,j),te===null)throw ft(de)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}ct()}catch(j){throw t.removeEventListener("webglcontextlost",jt,!1),t.removeEventListener("webglcontextrestored",Gt,!1),t.removeEventListener("webglcontextcreationerror",ra,!1),bt("WebGLRenderer: "+j.message),j}function ct(){Ie=new sy(te),Ie.init(),Ge=new Xb(te,Ie),Y=new J1(te,Ie,e,Ge),U=new Wb(te,Ie),Y.reversedDepthBuffer&&d&&U.buffers.depth.setReversed(!0),V=te.createFramebuffer(),N=te.createFramebuffer(),O=te.createFramebuffer(),se=new uy(te),pe=new Pb,ce=new jb(te,Ie,U,pe,Y,Ge,se),ge=new ry(F),I=new hx(te),$e=new $1(te,I),ue=new ly(te,I,se,$e),be=new hy(te,ue,I,$e,se),ae=new dy(te,Y,ce),Ye=new K1(pe),Te=new zb(F,ge,Ie,Y,$e,Ye),Oe=new Jb(F,pe),Ne=new Lb,Fe=new Hb(Ie),Me=new Y1(F,ge,U,be,y,s),re=new qb(F,be,Y),He=new Kb(te,se,Y,U),De=new Z1(te,Ie,se),Ae=new cy(te,Ie,se),se.programs=Te.programs,F.capabilities=Y,F.extensions=Ie,F.properties=pe,F.renderLists=Ne,F.shadowMap=re,F.state=U,F.info=se}b!==$n&&(P=new py(b,t.width,t.height,l,i,o));let rt=new Vd(F,te);this.xr=rt,this.getContext=function(){return te},this.getContextAttributes=function(){return te.getContextAttributes()},this.forceContextLoss=function(){let j=Ie.get("WEBGL_lose_context");j&&j.loseContext()},this.forceContextRestore=function(){let j=Ie.get("WEBGL_lose_context");j&&j.restoreContext()},this.getPixelRatio=function(){return J},this.setPixelRatio=function(j){j!==void 0&&(J=j,this.setSize(Q,G,!1))},this.getSize=function(j){return j.set(Q,G)},this.setSize=function(j,de,Ce=!0){if(rt.isPresenting){xt("WebGLRenderer: Can't change size while VR device is presenting.");return}Q=j,G=de,t.width=Math.floor(j*J),t.height=Math.floor(de*J),Ce===!0&&(t.style.width=j+"px",t.style.height=de+"px"),P!==null&&P.setSize(t.width,t.height),this.setViewport(0,0,j,de)},this.getDrawingBufferSize=function(j){return j.set(Q*J,G*J).floor()},this.setDrawingBufferSize=function(j,de,Ce){Q=j,G=de,J=Ce,t.width=Math.floor(j*Ce),t.height=Math.floor(de*Ce),this.setViewport(0,0,j,de)},this.setEffects=function(j){if(b===$n){bt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(j){for(let de=0;de<j.length;de++)if(j[de].isOutputPass===!0){xt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}P.setEffects(j||[])},this.getCurrentViewport=function(j){return j.copy(_)},this.getViewport=function(j){return j.copy(ye)},this.setViewport=function(j,de,Ce,_e){j.isVector4?ye.set(j.x,j.y,j.z,j.w):ye.set(j,de,Ce,_e),U.viewport(_.copy(ye).multiplyScalar(J).round())},this.getScissor=function(j){return j.copy(Z)},this.setScissor=function(j,de,Ce,_e){j.isVector4?Z.set(j.x,j.y,j.z,j.w):Z.set(j,de,Ce,_e),U.scissor(C.copy(Z).multiplyScalar(J).round())},this.getScissorTest=function(){return ne},this.setScissorTest=function(j){U.setScissorTest(ne=j)},this.setOpaqueSort=function(j){he=j},this.setTransparentSort=function(j){ve=j},this.getClearColor=function(j){return j.copy(Me.getClearColor())},this.setClearColor=function(){Me.setClearColor(...arguments)},this.getClearAlpha=function(){return Me.getClearAlpha()},this.setClearAlpha=function(){Me.setClearAlpha(...arguments)},this.clear=function(j=!0,de=!0,Ce=!0){let _e=0;if(j){let Ee=!1;if(A!==null){let tt=A.texture.format;Ee=v.has(tt)}if(Ee){let tt=A.texture.type,st=x.has(tt),et=Me.getClearColor(),ut=Me.getClearAlpha(),pt=et.r,Rt=et.g,Lt=et.b;st?(w[0]=pt,w[1]=Rt,w[2]=Lt,w[3]=ut,te.clearBufferuiv(te.COLOR,0,w)):(S[0]=pt,S[1]=Rt,S[2]=Lt,S[3]=ut,te.clearBufferiv(te.COLOR,0,S))}else _e|=te.COLOR_BUFFER_BIT}de&&(_e|=te.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Ce&&(_e|=te.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),_e!==0&&te.clear(_e)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(j){j.setRenderer(this),W=j},this.dispose=function(){t.removeEventListener("webglcontextlost",jt,!1),t.removeEventListener("webglcontextrestored",Gt,!1),t.removeEventListener("webglcontextcreationerror",ra,!1),Me.dispose(),Ne.dispose(),Fe.dispose(),pe.dispose(),ge.dispose(),be.dispose(),$e.dispose(),He.dispose(),Te.dispose(),rt.dispose(),rt.removeEventListener("sessionstart",tf),rt.removeEventListener("sessionend",nf),Qi.stop()};function jt(j){j.preventDefault(),Md("WebGLRenderer: Context Lost."),H=!0}function Gt(){Md("WebGLRenderer: Context Restored."),H=!1;let j=se.autoReset,de=re.enabled,Ce=re.autoUpdate,_e=re.needsUpdate,Ee=re.type;ct(),se.autoReset=j,re.enabled=de,re.autoUpdate=Ce,re.needsUpdate=_e,re.type=Ee}function ra(j){bt("WebGLRenderer: A WebGL context could not be created. Reason: ",j.statusMessage)}function la(j){let de=j.target;de.removeEventListener("dispose",la),Us(de)}function Us(j){Fs(j),pe.remove(j)}function Fs(j){let de=pe.get(j).programs;de!==void 0&&(de.forEach(function(Ce){Te.releaseProgram(Ce)}),j.isShaderMaterial&&Te.releaseShaderCache(j))}this.renderBufferDirect=function(j,de,Ce,_e,Ee,tt){de===null&&(de=me);let st=Ee.isMesh&&Ee.matrixWorld.determinantAffine()<0,et=eg(j,de,Ce,_e,Ee);U.setMaterial(_e,st);let ut=Ce.index,pt=1;if(_e.wireframe===!0){if(ut=ue.getWireframeAttribute(Ce),ut===void 0)return;pt=2}let Rt=Ce.drawRange,Lt=Ce.attributes.position,dt=Rt.start*pt,Jt=(Rt.start+Rt.count)*pt;tt!==null&&(dt=Math.max(dt,tt.start*pt),Jt=Math.min(Jt,(tt.start+tt.count)*pt)),ut!==null?(dt=Math.max(dt,0),Jt=Math.min(Jt,ut.count)):Lt!=null&&(dt=Math.max(dt,0),Jt=Math.min(Jt,Lt.count));let wn=Jt-dt;if(wn<0||wn===1/0)return;$e.setup(Ee,_e,et,Ce,ut);let un,on=De;if(ut!==null&&(un=I.get(ut),on=Ae,on.setIndex(un)),Ee.isMesh)_e.wireframe===!0?(U.setLineWidth(_e.wireframeLinewidth*ze()),on.setMode(te.LINES)):on.setMode(te.TRIANGLES);else if(Ee.isLine){let Vn=_e.linewidth;Vn===void 0&&(Vn=1),U.setLineWidth(Vn*ze()),Ee.isLineSegments?on.setMode(te.LINES):Ee.isLineLoop?on.setMode(te.LINE_LOOP):on.setMode(te.LINE_STRIP)}else Ee.isPoints?on.setMode(te.POINTS):Ee.isSprite&&on.setMode(te.TRIANGLES);if(Ee.isBatchedMesh)if(Ie.get("WEBGL_multi_draw"))on.renderMultiDraw(Ee._multiDrawStarts,Ee._multiDrawCounts,Ee._multiDrawCount);else{let Vn=Ee._multiDrawStarts,ot=Ee._multiDrawCounts,Qn=Ee._multiDrawCount,Vt=ut?I.get(ut).bytesPerElement:1,xa=pe.get(_e).currentProgram.getUniforms();for(let Ua=0;Ua<Qn;Ua++)xa.setValue(te,"_gl_DrawID",Ua),on.render(Vn[Ua]/Vt,ot[Ua])}else if(Ee.isInstancedMesh)on.renderInstances(dt,wn,Ee.count);else if(Ce.isInstancedBufferGeometry){let Vn=Ce._maxInstanceCount!==void 0?Ce._maxInstanceCount:1/0,ot=Math.min(Ce.instanceCount,Vn);on.renderInstances(dt,wn,ot)}else on.render(dt,wn)};function wa(j,de,Ce,_e){W!==null&&j.isNodeMaterial&&W.setObject(_e,j),ie===!0&&Ye.setState(j,Ce,!1),j.transparent===!0&&j.side===cn&&j.forceSinglePass===!1?(j.side=Hn,j.needsUpdate=!0,Hs(j,de,_e),j.side=Wa,j.needsUpdate=!0,Hs(j,de,_e),j.side=cn):Hs(j,de,_e)}this.compile=function(j,de,Ce=null){Ce===null&&(Ce=j),W!==null&&W.renderStart(j,de,Ce),R=Fe.get(Ce),R.init(de),p.push(R),Ce.traverseVisible(function(Ee){Ee.isLight&&Ee.layers.test(de.layers)&&(R.pushLight(Ee),Ee.castShadow&&R.pushShadow(Ee))}),j!==Ce&&j.traverseVisible(function(Ee){Ee.isLight&&Ee.layers.test(de.layers)&&(R.pushLight(Ee),Ee.castShadow&&R.pushShadow(Ee))}),R.setupLights(),W!==null&&W.updateLights(R.state.lightsArray),q=this.localClippingEnabled,ie=Ye.init(this.clippingPlanes,q),ie===!0&&Ye.setGlobalState(this.clippingPlanes,de),W!==null&&re.render(R.state.shadowsArray,Ce,de);let _e=new Set;return j.traverse(function(Ee){if(!(Ee.isMesh||Ee.isPoints||Ee.isLine||Ee.isSprite))return;let tt=Ee.material;if(tt)if(Array.isArray(tt))for(let st=0;st<tt.length;st++){let et=tt[st];wa(et,Ce,de,Ee),_e.add(et)}else wa(tt,Ce,de,Ee),_e.add(tt)}),R=p.pop(),W!==null&&W.renderEnd(),_e},this.compileAsync=function(j,de,Ce=null){let _e=this.compile(j,de,Ce);return new Promise(Ee=>{function tt(){if(_e.forEach(function(st){let ut=pe.get(st).currentProgram;(ut===void 0||ut.isReady())&&_e.delete(st)}),_e.size===0){Ee(j);return}setTimeout(tt,10)}Ie.get("KHR_parallel_shader_compile")!==null?tt():setTimeout(tt,10)})};let bi=null;function Km(j){bi&&bi(j)}function tf(){Qi.stop()}function nf(){Qi.start()}let Qi=new tp;Qi.setAnimationLoop(Km),typeof self<"u"&&Qi.setContext(self),this.setAnimationLoop=function(j){bi=j,rt.setAnimationLoop(j),j===null?Qi.stop():Qi.start()},rt.addEventListener("sessionstart",tf),rt.addEventListener("sessionend",nf),this.render=function(j,de){if(de!==void 0&&de.isCamera!==!0){bt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(H===!0)return;W!==null&&W.renderStart(j,de);let Ce=rt.enabled===!0&&rt.isPresenting===!0,_e=P!==null&&(A===null||Ce)&&P.begin(F,A);if(j.matrixWorldAutoUpdate===!0&&j.updateMatrixWorld(),de.parent===null&&de.matrixWorldAutoUpdate===!0&&de.updateMatrixWorld(),rt.enabled===!0&&rt.isPresenting===!0&&(P===null||P.isCompositing()===!1)&&(rt.cameraAutoUpdate===!0&&rt.updateCamera(de),de=rt.getCamera()),j.isScene===!0&&j.onBeforeRender(F,j,de,A),R=Fe.get(j,p.length),R.init(de),R.state.textureUnits=ce.getTextureUnits(),p.push(R),oe.multiplyMatrices(de.projectionMatrix,de.matrixWorldInverse),ee.setFromProjectionMatrix(oe,Pa,de.reversedDepth),q=this.localClippingEnabled,ie=Ye.init(this.clippingPlanes,q),L=Ne.get(j,z.length),L.init(),z.push(L),rt.enabled===!0&&rt.isPresenting===!0){let st=F.xr.getDepthSensingMesh();st!==null&&yu(st,de,-1/0,F.sortObjects)}yu(j,de,0,F.sortObjects),L.finish(),W!==null&&W.updateLights(R.state.lightsArray),F.sortObjects===!0&&L.sort(he,ve),Re=rt.enabled===!1||rt.isPresenting===!1||rt.hasDepthSensing()===!1,Re&&Me.addToRenderList(L,j),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),ie===!0&&Ye.beginShadows();let Ee=R.state.shadowsArray;if(re.render(Ee,j,de),ie===!0&&Ye.endShadows(),(_e&&P.hasRenderPass())===!1){let st=L.opaque,et=L.transmissive;if(R.setupLights(),de.isArrayCamera){let ut=de.cameras;if(et.length>0)for(let pt=0,Rt=ut.length;pt<Rt;pt++){let Lt=ut[pt];of(st,et,j,Lt)}Re&&Me.render(j);for(let pt=0,Rt=ut.length;pt<Rt;pt++){let Lt=ut[pt];af(L,j,Lt,Lt.viewport)}}else et.length>0&&of(st,et,j,de),Re&&Me.render(j),af(L,j,de)}A!==null&&E===0&&(ce.updateMultisampleRenderTarget(A),ce.updateRenderTargetMipmap(A)),_e&&P.end(F),j.isScene===!0&&j.onAfterRender(F,j,de),$e.resetDefaultState(),f=-1,M=null,p.pop(),p.length>0?(R=p[p.length-1],ce.setTextureUnits(R.state.textureUnits),ie===!0&&Ye.setGlobalState(F.clippingPlanes,R.state.camera)):R=null,z.pop(),z.length>0?L=z[z.length-1]:L=null,W!==null&&W.renderEnd()};function yu(j,de,Ce,_e){if(j.visible===!1)return;if(j.layers.test(de.layers)){if(j.isGroup)Ce=j.renderOrder;else if(j.isLOD)j.autoUpdate===!0&&j.update(de);else if(j.isLightProbeGrid)R.pushLightProbeGrid(j);else if(j.isLight)R.pushLight(j),j.castShadow&&R.pushShadow(j);else if(j.isSprite){if(!j.frustumCulled||j.intersectsFrustum(ee)){_e&&$.setFromMatrixPosition(j.matrixWorld).applyMatrix4(oe);let st=be.update(j),et=j.material;et.visible&&L.push(j,st,et,Ce,$.z,null,de)}}else if((j.isMesh||j.isLine||j.isPoints)&&(!j.frustumCulled||j.intersectsFrustum(ee))){let st=be.update(j),et=j.material;if(_e&&(j.boundingSphere!==void 0?(j.boundingSphere===null&&j.computeBoundingSphere(),$.copy(j.boundingSphere.center)):(st.boundingSphere===null&&st.computeBoundingSphere(),$.copy(st.boundingSphere.center)),$.applyMatrix4(j.matrixWorld).applyMatrix4(oe)),Array.isArray(et)){let ut=st.groups;for(let pt=0,Rt=ut.length;pt<Rt;pt++){let Lt=ut[pt],dt=et[Lt.materialIndex];dt&&dt.visible&&L.push(j,st,dt,Ce,$.z,Lt,de)}}else et.visible&&L.push(j,st,et,Ce,$.z,null,de)}}let tt=j.children;for(let st=0,et=tt.length;st<et;st++)yu(tt[st],de,Ce,_e)}function af(j,de,Ce,_e){let{opaque:Ee,transmissive:tt,transparent:st}=j;R.setupLightsView(Ce),ie===!0&&Ye.setGlobalState(F.clippingPlanes,Ce),_e&&U.viewport(_.copy(_e)),Ee.length>0&&Bs(Ee,de,Ce),tt.length>0&&Bs(tt,de,Ce),st.length>0&&Bs(st,de,Ce),U.buffers.depth.setTest(!0),U.buffers.depth.setMask(!0),U.buffers.color.setMask(!0),U.setPolygonOffset(!1)}function of(j,de,Ce,_e){if((Ce.isScene===!0?Ce.overrideMaterial:null)!==null)return;if(R.state.transmissionRenderTarget[_e.id]===void 0){let dt=Ie.has("EXT_color_buffer_half_float")||Ie.has("EXT_color_buffer_float");R.state.transmissionRenderTarget[_e.id]=new Fn(1,1,{generateMipmaps:!0,type:dt?ta:$n,minFilter:Hi,samples:Math.max(4,Y.samples),stencilBuffer:o,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Dt.workingColorSpace})}let tt=R.state.transmissionRenderTarget[_e.id],st=_e.viewport||_;tt.setSize(st.z*F.transmissionResolutionScale,st.w*F.transmissionResolutionScale);let et=F.getRenderTarget(),ut=F.getActiveCubeFace(),pt=F.getActiveMipmapLevel();F.setRenderTarget(tt),F.getClearColor(B),k=F.getClearAlpha(),k<1&&F.setClearColor(16777215,.5),F.clear(),Re&&Me.render(Ce);let Rt=F.toneMapping;F.toneMapping=La;let Lt=_e.viewport;if(_e.viewport!==void 0&&(_e.viewport=void 0),R.setupLightsView(_e),ie===!0&&Ye.setGlobalState(F.clippingPlanes,_e),Bs(j,Ce,_e),ce.updateMultisampleRenderTarget(tt),ce.updateRenderTargetMipmap(tt),Ie.has("WEBGL_multisampled_render_to_texture")===!1){let dt=!1;for(let Jt=0,wn=de.length;Jt<wn;Jt++){let un=de[Jt],{object:on,geometry:Vn,material:ot,group:Qn}=un;if(ot.side===cn&&on.layers.test(_e.layers)){let Vt=ot.side;ot.side=Hn,ot.needsUpdate=!0,rf(on,Ce,_e,Vn,ot,Qn),ot.side=Vt,ot.needsUpdate=!0,dt=!0}}dt===!0&&(ce.updateMultisampleRenderTarget(tt),ce.updateRenderTargetMipmap(tt))}F.setRenderTarget(et,ut,pt),F.setClearColor(B,k),Lt!==void 0&&(_e.viewport=Lt),F.toneMapping=Rt}function Bs(j,de,Ce){let _e=de.isScene===!0?de.overrideMaterial:null;for(let Ee=0,tt=j.length;Ee<tt;Ee++){let st=j[Ee],{object:et,geometry:ut,group:pt}=st,Rt=st.material;Rt.allowOverride===!0&&_e!==null&&(Rt=_e),et.layers.test(Ce.layers)&&rf(et,de,Ce,ut,Rt,pt)}}function rf(j,de,Ce,_e,Ee,tt){W!==null&&Ee.isNodeMaterial&&W.setObject(j,Ee),j.onBeforeRender(F,de,Ce,_e,Ee,tt),j.modelViewMatrix.multiplyMatrices(Ce.matrixWorldInverse,j.matrixWorld),j.normalMatrix.getNormalMatrix(j.modelViewMatrix),Ee.onBeforeRender(F,de,Ce,_e,j,tt),Ee.transparent===!0&&Ee.side===cn&&Ee.forceSinglePass===!1?(Ee.side=Hn,Ee.needsUpdate=!0,F.renderBufferDirect(Ce,de,_e,Ee,j,tt),Ee.side=Wa,Ee.needsUpdate=!0,F.renderBufferDirect(Ce,de,_e,Ee,j,tt),Ee.side=cn):F.renderBufferDirect(Ce,de,_e,Ee,j,tt),j.onAfterRender(F,de,Ce,_e,Ee,tt)}function Hs(j,de,Ce){de.isScene!==!0&&(de=me);let _e=pe.get(j),Ee=R.state.lights,tt=R.state.shadowsArray,st=Ee.state.version,et=Te.getParameters(j,Ee.state,tt,de,Ce,R.state.lightProbeGridArray),ut=Te.getProgramCacheKey(et),pt=_e.programs;_e.environment=j.isMeshStandardMaterial||j.isMeshLambertMaterial||j.isMeshPhongMaterial?de.environment:null,_e.fog=de.fog;let Rt=j.isMeshStandardMaterial||j.isMeshLambertMaterial&&!j.envMap||j.isMeshPhongMaterial&&!j.envMap;_e.envMap=ge.get(j.envMap||_e.environment,Rt),_e.envMapRotation=_e.environment!==null&&j.envMap===null?de.environmentRotation:j.envMapRotation,pt===void 0&&(j.addEventListener("dispose",la),pt=new Map,_e.programs=pt);let Lt=pt.get(ut);if(Lt!==void 0){if(_e.currentProgram===Lt&&_e.lightsStateVersion===st)return lf(j,et),Lt}else et.uniforms=Te.getUniforms(j),W!==null&&j.isNodeMaterial&&W.build(j,Ce,et),j.onBeforeCompile(et,F),Lt=Te.acquireProgram(et,ut),pt.set(ut,Lt),_e.uniforms=et.uniforms;let dt=_e.uniforms;return(!j.isShaderMaterial&&!j.isRawShaderMaterial||j.clipping===!0)&&(dt.clippingPlanes=Ye.uniform),lf(j,et),_e.needsLights=ng(j),_e.lightsStateVersion=st,_e.needsLights&&(dt.ambientLightColor.value=Ee.state.ambient,dt.lightProbe.value=Ee.state.probe,dt.sunLights.value=Ee.state.sun,dt.sunLightShadows.value=Ee.state.sunShadow,dt.directionalLights.value=Ee.state.directional,dt.directionalLightShadows.value=Ee.state.directionalShadow,dt.spotLights.value=Ee.state.spot,dt.spotLightShadows.value=Ee.state.spotShadow,dt.rectAreaLights.value=Ee.state.rectArea,dt.ltc_1.value=Ee.state.rectAreaLTC1,dt.ltc_2.value=Ee.state.rectAreaLTC2,dt.pointLights.value=Ee.state.point,dt.pointLightShadows.value=Ee.state.pointShadow,dt.hemisphereLights.value=Ee.state.hemi,dt.sunShadowMatrix.value=Ee.state.sunShadowMatrix,dt.sunShadowCascade.value=Ee.state.sunShadowCascade,dt.directionalShadowMatrix.value=Ee.state.directionalShadowMatrix,dt.spotLightMatrix.value=Ee.state.spotLightMatrix,dt.spotLightMap.value=Ee.state.spotLightMap,dt.pointShadowMatrix.value=Ee.state.pointShadowMatrix),_e.lightProbeGrid=R.state.lightProbeGridArray.length>0,_e.currentProgram=Lt,_e.uniformsList=null,Lt}function sf(j){if(j.uniformsList===null){let de=j.currentProgram.getUniforms();j.uniformsList=sr.seqWithValue(de.seq,j.uniforms)}return j.uniformsList}function lf(j,de){let Ce=pe.get(j);Ce.outputColorSpace=de.outputColorSpace,Ce.batching=de.batching,Ce.batchingColor=de.batchingColor,Ce.instancing=de.instancing,Ce.instancingColor=de.instancingColor,Ce.instancingMorph=de.instancingMorph,Ce.skinning=de.skinning,Ce.morphTargets=de.morphTargets,Ce.morphNormals=de.morphNormals,Ce.morphColors=de.morphColors,Ce.morphTargetsCount=de.morphTargetsCount,Ce.numClippingPlanes=de.numClippingPlanes,Ce.numIntersection=de.numClipIntersection,Ce.vertexAlphas=de.vertexAlphas,Ce.vertexTangents=de.vertexTangents,Ce.toneMapping=de.toneMapping}function Qm(j,de){if(j.length===0)return null;if(j.length===1)return j[0].texture!==null?j[0]:null;g.setFromMatrixPosition(de.matrixWorld);for(let Ce=0,_e=j.length;Ce<_e;Ce++){let Ee=j[Ce];if(Ee.texture!==null&&Ee.boundingBox.containsPoint(g))return Ee}return null}function eg(j,de,Ce,_e,Ee){de.isScene!==!0&&(de=me),ce.resetTextureUnits();let tt=de.fog,st=_e.isMeshStandardMaterial||_e.isMeshLambertMaterial||_e.isMeshPhongMaterial?de.environment:null,et=A===null?F.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Dt.workingColorSpace,ut=_e.isMeshStandardMaterial||_e.isMeshLambertMaterial&&!_e.envMap||_e.isMeshPhongMaterial&&!_e.envMap,pt=ge.get(_e.envMap||st,ut),Rt=_e.vertexColors===!0&&!!Ce.attributes.color&&Ce.attributes.color.itemSize===4,Lt=!!Ce.attributes.tangent&&(!!_e.normalMap||_e.anisotropy>0),dt=!!Ce.morphAttributes.position,Jt=!!Ce.morphAttributes.normal,wn=!!Ce.morphAttributes.color,un=La;_e.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(un=F.toneMapping);let on=Ce.morphAttributes.position||Ce.morphAttributes.normal||Ce.morphAttributes.color,Vn=on!==void 0?on.length:0,ot=pe.get(_e),Qn=R.state.lights;if(ie===!0&&(q===!0||j!==M)){let sn=j===M&&_e.id===f;Ye.setState(_e,j,sn)}let Vt=!1;_e.version===ot.__version?(ot.needsLights&&ot.lightsStateVersion!==Qn.state.version||ot.outputColorSpace!==et||Ee.isBatchedMesh&&ot.batching===!1||!Ee.isBatchedMesh&&ot.batching===!0||Ee.isBatchedMesh&&ot.batchingColor===!0&&Ee._colorsTexture===null||Ee.isBatchedMesh&&ot.batchingColor===!1&&Ee._colorsTexture!==null||Ee.isInstancedMesh&&ot.instancing===!1||!Ee.isInstancedMesh&&ot.instancing===!0||Ee.isSkinnedMesh&&ot.skinning===!1||!Ee.isSkinnedMesh&&ot.skinning===!0||Ee.isInstancedMesh&&ot.instancingColor===!0&&Ee.instanceColor===null||Ee.isInstancedMesh&&ot.instancingColor===!1&&Ee.instanceColor!==null||Ee.isInstancedMesh&&ot.instancingMorph===!0&&Ee.morphTexture===null||Ee.isInstancedMesh&&ot.instancingMorph===!1&&Ee.morphTexture!==null||ot.envMap!==pt||_e.fog===!0&&ot.fog!==tt||ot.numClippingPlanes!==void 0&&(ot.numClippingPlanes!==Ye.numPlanes||ot.numIntersection!==Ye.numIntersection)||ot.vertexAlphas!==Rt||ot.vertexTangents!==Lt||ot.morphTargets!==dt||ot.morphNormals!==Jt||ot.morphColors!==wn||ot.toneMapping!==un||ot.morphTargetsCount!==Vn||!!ot.lightProbeGrid!=R.state.lightProbeGridArray.length>0)&&(Vt=!0):(Vt=!0,ot.__version=_e.version);let xa=ot.currentProgram;Vt===!0&&(xa=Hs(_e,de,Ee),W&&_e.isNodeMaterial&&W.onUpdateProgram(_e,xa,ot));let Ua=!1,Mi=!1,So=!1,nn=xa.getUniforms(),En=ot.uniforms;if(U.useProgram(xa.program)&&(Ua=!0,Mi=!0,So=!0),_e.id!==f&&(f=_e.id,Mi=!0),ot.needsLights){let sn=Qm(R.state.lightProbeGridArray,Ee);ot.lightProbeGrid!==sn&&(ot.lightProbeGrid=sn,Mi=!0)}if(Ua||M!==j){U.buffers.depth.getReversed()&&j.reversedDepth!==!0&&(j._reversedDepth=!0,j.updateProjectionMatrix()),nn.setValue(te,"projectionMatrix",j.projectionMatrix),nn.setValue(te,"viewMatrix",j.matrixWorldInverse);let Ei=nn.map.cameraPosition;Ei!==void 0&&Ei.setValue(te,fe.setFromMatrixPosition(j.matrixWorld)),Y.logarithmicDepthBuffer&&nn.setValue(te,"logDepthBufFC",2/(Math.log(j.far+1)/Math.LN2)),(_e.isMeshPhongMaterial||_e.isMeshToonMaterial||_e.isMeshLambertMaterial||_e.isMeshBasicMaterial||_e.isMeshStandardMaterial||_e.isShaderMaterial)&&nn.setValue(te,"isOrthographic",j.isOrthographicCamera===!0),M!==j&&(M=j,Mi=!0,So=!0)}if(ot.needsLights&&(Qn.state.sunShadowMap.length>0&&nn.setValue(te,"sunShadowMap",Qn.state.sunShadowMap,ce),Qn.state.directionalShadowMap.length>0&&nn.setValue(te,"directionalShadowMap",Qn.state.directionalShadowMap,ce),Qn.state.spotShadowMap.length>0&&nn.setValue(te,"spotShadowMap",Qn.state.spotShadowMap,ce),Qn.state.pointShadowMap.length>0&&nn.setValue(te,"pointShadowMap",Qn.state.pointShadowMap,ce)),Ee.isSkinnedMesh){nn.setOptional(te,Ee,"bindMatrix"),nn.setOptional(te,Ee,"bindMatrixInverse");let sn=Ee.skeleton;sn&&(sn.boneTexture===null&&sn.computeBoneTexture(),nn.setValue(te,"boneTexture",sn.boneTexture,ce))}Ee.isBatchedMesh&&(nn.setOptional(te,Ee,"batchingTexture"),nn.setValue(te,"batchingTexture",Ee._matricesTexture,ce),nn.setOptional(te,Ee,"batchingIdTexture"),nn.setValue(te,"batchingIdTexture",Ee._indirectTexture,ce),nn.setOptional(te,Ee,"batchingColorTexture"),Ee._colorsTexture!==null&&nn.setValue(te,"batchingColorTexture",Ee._colorsTexture,ce));let _i=Ce.morphAttributes;if((_i.position!==void 0||_i.normal!==void 0||_i.color!==void 0)&&ae.update(Ee,Ce,xa),(Mi||ot.receiveShadow!==Ee.receiveShadow)&&(ot.receiveShadow=Ee.receiveShadow,nn.setValue(te,"receiveShadow",Ee.receiveShadow)),(_e.isMeshStandardMaterial||_e.isMeshLambertMaterial||_e.isMeshPhongMaterial)&&_e.envMap===null&&de.environment!==null&&(En.envMapIntensity.value=de.environmentIntensity),En.dfgLUT!==void 0&&(En.dfgLUT.value=e2()),Mi){if(nn.setValue(te,"toneMappingExposure",F.toneMappingExposure),ot.needsLights&&tg(En,So),tt&&_e.fog===!0&&Oe.refreshFogUniforms(En,tt),Oe.refreshMaterialUniforms(En,_e,J,G,R.state.transmissionRenderTarget[j.id]),ot.needsLights&&ot.lightProbeGrid){let sn=ot.lightProbeGrid;En.probesSH.value=sn.texture,En.probesMin.value.copy(sn.boundingBox.min),En.probesMax.value.copy(sn.boundingBox.max),En.probesResolution.value.copy(sn.resolution)}sr.upload(te,sf(ot),En,ce)}if(_e.isShaderMaterial&&_e.uniformsNeedUpdate===!0&&(sr.upload(te,sf(ot),En,ce),_e.uniformsNeedUpdate=!1),_e.isSpriteMaterial&&nn.setValue(te,"center",Ee.center),nn.setValue(te,"modelViewMatrix",Ee.modelViewMatrix),nn.setValue(te,"normalMatrix",Ee.normalMatrix),nn.setValue(te,"modelMatrix",Ee.matrixWorld),_e.uniformsGroups!==void 0){let sn=_e.uniformsGroups;for(let Ei=0,To=sn.length;Ei<To;Ei++){let uf=sn[Ei];He.update(uf,xa),He.bind(uf,xa)}}return xa}function tg(j,de){j.ambientLightColor.needsUpdate=de,j.lightProbe.needsUpdate=de,j.sunLights.needsUpdate=de,j.sunLightShadows.needsUpdate=de,j.directionalLights.needsUpdate=de,j.directionalLightShadows.needsUpdate=de,j.pointLights.needsUpdate=de,j.pointLightShadows.needsUpdate=de,j.spotLights.needsUpdate=de,j.spotLightShadows.needsUpdate=de,j.rectAreaLights.needsUpdate=de,j.hemisphereLights.needsUpdate=de}function ng(j){return j.isMeshLambertMaterial||j.isMeshToonMaterial||j.isMeshPhongMaterial||j.isMeshStandardMaterial||j.isShadowMaterial||j.isShaderMaterial&&j.lights===!0}this.getActiveCubeFace=function(){return T},this.getActiveMipmapLevel=function(){return E},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(j,de,Ce){let _e=pe.get(j);_e.__autoAllocateDepthBuffer=j.resolveDepthBuffer===!1,_e.__autoAllocateDepthBuffer===!1&&(_e.__useRenderToTexture=!1),pe.get(j.texture).__webglTexture=de,pe.get(j.depthTexture).__webglTexture=_e.__autoAllocateDepthBuffer?void 0:Ce,_e.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(j,de){let Ce=pe.get(j);Ce.__webglFramebuffer=de,Ce.__useDefaultFramebuffer=de===void 0},this.setRenderTarget=function(j,de=0,Ce=0){A=j,T=de,E=Ce;let _e=null,Ee=!1,tt=!1;if(j){let et=pe.get(j);if(et.__useDefaultFramebuffer!==void 0){U.bindFramebuffer(te.FRAMEBUFFER,et.__webglFramebuffer),_.copy(j.viewport),C.copy(j.scissor),D=j.scissorTest,U.viewport(_),U.scissor(C),U.setScissorTest(D),f=-1;return}else if(et.__webglFramebuffer===void 0)ce.setupRenderTarget(j);else if(et.__hasExternalTextures)ce.rebindTextures(j,pe.get(j.texture).__webglTexture,pe.get(j.depthTexture).__webglTexture);else if(j.depthBuffer){let Rt=j.depthTexture;if(et.__boundDepthTexture!==Rt){if(Rt!==null&&pe.has(Rt)&&(j.width!==Rt.image.width||j.height!==Rt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");ce.setupDepthRenderbuffer(j)}}let ut=j.texture;(ut.isData3DTexture||ut.isDataArrayTexture||ut.isCompressedArrayTexture)&&(tt=!0);let pt=pe.get(j).__webglFramebuffer;j.isWebGLCubeRenderTarget?(Array.isArray(pt[de])?_e=pt[de][Ce]:_e=pt[de],Ee=!0):j.samples>0&&ce.useMultisampledRTT(j)===!1?_e=pe.get(j).__webglMultisampledFramebuffer:Array.isArray(pt)?_e=pt[Ce]:_e=pt,_.copy(j.viewport),C.copy(j.scissor),D=j.scissorTest}else _.copy(ye).multiplyScalar(J).floor(),C.copy(Z).multiplyScalar(J).floor(),D=ne;if(Ce!==0&&(_e=V),U.bindFramebuffer(te.FRAMEBUFFER,_e)&&U.drawBuffers(j,_e),U.viewport(_),U.scissor(C),U.setScissorTest(D),Ee){let et=pe.get(j.texture);te.framebufferTexture2D(te.FRAMEBUFFER,te.COLOR_ATTACHMENT0,te.TEXTURE_CUBE_MAP_POSITIVE_X+de,et.__webglTexture,Ce)}else if(tt){let et=de;for(let ut=0;ut<j.textures.length;ut++){let pt=pe.get(j.textures[ut]);te.framebufferTextureLayer(te.FRAMEBUFFER,te.COLOR_ATTACHMENT0+ut,pt.__webglTexture,Ce,et)}}else if(j!==null&&Ce!==0){let et=pe.get(j.texture);te.framebufferTexture2D(te.FRAMEBUFFER,te.COLOR_ATTACHMENT0,te.TEXTURE_2D,et.__webglTexture,Ce)}f=-1};function cf(j){let de=pe.get(j);return(de.__readFormat!==j.format||de.__readType!==j.type)&&(de.__readFormat=j.format,de.__readType=j.type,de.__formatReadable=Y.textureFormatReadable(j.format),de.__typeReadable=Y.textureTypeReadable(j.type)),de}this.readRenderTargetPixels=function(j,de,Ce,_e,Ee,tt,st,et=0){if(!(j&&j.isWebGLRenderTarget)){bt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ut=pe.get(j).__webglFramebuffer;if(j.isWebGLCubeRenderTarget&&st!==void 0&&(ut=ut[st]),ut){U.bindFramebuffer(te.FRAMEBUFFER,ut);try{let pt=j.textures[et],Rt=pt.format,Lt=pt.type;j.textures.length>1&&te.readBuffer(te.COLOR_ATTACHMENT0+et);let dt=cf(pt);if(dt.__formatReadable===!1){bt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(dt.__typeReadable===!1){bt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}de>=0&&de<=j.width-_e&&Ce>=0&&Ce<=j.height-Ee&&te.readPixels(de,Ce,_e,Ee,Ge.convert(Rt),Ge.convert(Lt),tt)}finally{let pt=A!==null?pe.get(A).__webglFramebuffer:null;U.bindFramebuffer(te.FRAMEBUFFER,pt)}}},this.readRenderTargetPixelsAsync=async function(j,de,Ce,_e,Ee,tt,st,et=0){if(!(j&&j.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ut=pe.get(j).__webglFramebuffer;if(j.isWebGLCubeRenderTarget&&st!==void 0&&(ut=ut[st]),ut)if(de>=0&&de<=j.width-_e&&Ce>=0&&Ce<=j.height-Ee){U.bindFramebuffer(te.FRAMEBUFFER,ut);let pt=j.textures[et],Rt=pt.format,Lt=pt.type;j.textures.length>1&&te.readBuffer(te.COLOR_ATTACHMENT0+et);let dt=cf(pt);if(dt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(dt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Jt=te.createBuffer();te.bindBuffer(te.PIXEL_PACK_BUFFER,Jt),te.bufferData(te.PIXEL_PACK_BUFFER,tt.byteLength,te.STREAM_READ),te.readPixels(de,Ce,_e,Ee,Ge.convert(Rt),Ge.convert(Lt),0),te.bindBuffer(te.PIXEL_PACK_BUFFER,null);let wn=A!==null?pe.get(A).__webglFramebuffer:null;U.bindFramebuffer(te.FRAMEBUFFER,wn);let un=te.fenceSync(te.SYNC_GPU_COMMANDS_COMPLETE,0);return te.flush(),await C0(te,un,4),te.bindBuffer(te.PIXEL_PACK_BUFFER,Jt),te.getBufferSubData(te.PIXEL_PACK_BUFFER,0,tt),te.bindBuffer(te.PIXEL_PACK_BUFFER,null),te.deleteBuffer(Jt),te.deleteSync(un),tt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(j,de=null,Ce=0){let _e=Math.pow(2,-Ce),Ee=Math.floor(j.image.width*_e),tt=Math.floor(j.image.height*_e),st=de!==null?de.x:0,et=de!==null?de.y:0;ce.setTexture2D(j,0),te.copyTexSubImage2D(te.TEXTURE_2D,Ce,0,0,st,et,Ee,tt),U.unbindTexture()},this.copyTextureToTexture=function(j,de,Ce=null,_e=null,Ee=0,tt=0){let st,et,ut,pt,Rt,Lt,dt,Jt,wn,un=j.isCompressedTexture?j.mipmaps[tt]:j.image;if(Ce!==null)st=Ce.max.x-Ce.min.x,et=Ce.max.y-Ce.min.y,ut=Ce.isBox3?Ce.max.z-Ce.min.z:1,pt=Ce.min.x,Rt=Ce.min.y,Lt=Ce.isBox3?Ce.min.z:0;else{let En=Math.pow(2,-Ee);st=Math.floor(un.width*En),et=Math.floor(un.height*En),j.isDataArrayTexture?ut=un.depth:j.isData3DTexture?ut=Math.floor(un.depth*En):ut=1,pt=0,Rt=0,Lt=0}_e!==null?(dt=_e.x,Jt=_e.y,wn=_e.z):(dt=0,Jt=0,wn=0);let on=Ge.convert(de.format),Vn=Ge.convert(de.type),ot;de.isData3DTexture?(ce.setTexture3D(de,0),ot=te.TEXTURE_3D):de.isDataArrayTexture||de.isCompressedArrayTexture?(ce.setTexture2DArray(de,0),ot=te.TEXTURE_2D_ARRAY):(ce.setTexture2D(de,0),ot=te.TEXTURE_2D),U.activeTexture(te.TEXTURE0),U.pixelStorei(te.UNPACK_FLIP_Y_WEBGL,de.flipY),U.pixelStorei(te.UNPACK_PREMULTIPLY_ALPHA_WEBGL,de.premultiplyAlpha),U.pixelStorei(te.UNPACK_ALIGNMENT,de.unpackAlignment);let Qn=U.getParameter(te.UNPACK_ROW_LENGTH),Vt=U.getParameter(te.UNPACK_IMAGE_HEIGHT),xa=U.getParameter(te.UNPACK_SKIP_PIXELS),Ua=U.getParameter(te.UNPACK_SKIP_ROWS),Mi=U.getParameter(te.UNPACK_SKIP_IMAGES);U.pixelStorei(te.UNPACK_ROW_LENGTH,un.width),U.pixelStorei(te.UNPACK_IMAGE_HEIGHT,un.height),U.pixelStorei(te.UNPACK_SKIP_PIXELS,pt),U.pixelStorei(te.UNPACK_SKIP_ROWS,Rt),U.pixelStorei(te.UNPACK_SKIP_IMAGES,Lt);let So=j.isDataArrayTexture||j.isData3DTexture,nn=de.isDataArrayTexture||de.isData3DTexture;if(j.isDepthTexture){let En=pe.get(j),_i=pe.get(de),sn=pe.get(En.__renderTarget),Ei=pe.get(_i.__renderTarget);U.bindFramebuffer(te.READ_FRAMEBUFFER,sn.__webglFramebuffer),U.bindFramebuffer(te.DRAW_FRAMEBUFFER,Ei.__webglFramebuffer);for(let To=0;To<ut;To++)So&&(te.framebufferTextureLayer(te.READ_FRAMEBUFFER,te.COLOR_ATTACHMENT0,pe.get(j).__webglTexture,Ee,Lt+To),te.framebufferTextureLayer(te.DRAW_FRAMEBUFFER,te.COLOR_ATTACHMENT0,pe.get(de).__webglTexture,tt,wn+To)),te.blitFramebuffer(pt,Rt,st,et,dt,Jt,st,et,te.DEPTH_BUFFER_BIT,te.NEAREST);U.bindFramebuffer(te.READ_FRAMEBUFFER,null),U.bindFramebuffer(te.DRAW_FRAMEBUFFER,null)}else if(Ee!==0||j.isRenderTargetTexture||pe.has(j)){let En=pe.get(j),_i=pe.get(de);U.bindFramebuffer(te.READ_FRAMEBUFFER,N),U.bindFramebuffer(te.DRAW_FRAMEBUFFER,O);for(let sn=0;sn<ut;sn++)So?te.framebufferTextureLayer(te.READ_FRAMEBUFFER,te.COLOR_ATTACHMENT0,En.__webglTexture,Ee,Lt+sn):te.framebufferTexture2D(te.READ_FRAMEBUFFER,te.COLOR_ATTACHMENT0,te.TEXTURE_2D,En.__webglTexture,Ee),nn?te.framebufferTextureLayer(te.DRAW_FRAMEBUFFER,te.COLOR_ATTACHMENT0,_i.__webglTexture,tt,wn+sn):te.framebufferTexture2D(te.DRAW_FRAMEBUFFER,te.COLOR_ATTACHMENT0,te.TEXTURE_2D,_i.__webglTexture,tt),Ee!==0?te.blitFramebuffer(pt,Rt,st,et,dt,Jt,st,et,te.COLOR_BUFFER_BIT,te.NEAREST):nn?te.copyTexSubImage3D(ot,tt,dt,Jt,wn+sn,pt,Rt,st,et):te.copyTexSubImage2D(ot,tt,dt,Jt,pt,Rt,st,et);U.bindFramebuffer(te.READ_FRAMEBUFFER,null),U.bindFramebuffer(te.DRAW_FRAMEBUFFER,null)}else nn?j.isDataTexture||j.isData3DTexture?te.texSubImage3D(ot,tt,dt,Jt,wn,st,et,ut,on,Vn,un.data):de.isCompressedArrayTexture?te.compressedTexSubImage3D(ot,tt,dt,Jt,wn,st,et,ut,on,un.data):te.texSubImage3D(ot,tt,dt,Jt,wn,st,et,ut,on,Vn,un):j.isDataTexture?te.texSubImage2D(te.TEXTURE_2D,tt,dt,Jt,st,et,on,Vn,un.data):j.isCompressedTexture?te.compressedTexSubImage2D(te.TEXTURE_2D,tt,dt,Jt,un.width,un.height,on,un.data):te.texSubImage2D(te.TEXTURE_2D,tt,dt,Jt,st,et,on,Vn,un);U.pixelStorei(te.UNPACK_ROW_LENGTH,Qn),U.pixelStorei(te.UNPACK_IMAGE_HEIGHT,Vt),U.pixelStorei(te.UNPACK_SKIP_PIXELS,xa),U.pixelStorei(te.UNPACK_SKIP_ROWS,Ua),U.pixelStorei(te.UNPACK_SKIP_IMAGES,Mi),tt===0&&de.generateMipmaps&&te.generateMipmap(ot),U.unbindTexture()},this.initRenderTarget=function(j){pe.get(j).__webglFramebuffer===void 0&&ce.setupRenderTarget(j)},this.initTexture=function(j){j.isCubeTexture?ce.setTextureCube(j,0):j.isData3DTexture?ce.setTexture3D(j,0):j.isDataArrayTexture||j.isCompressedArrayTexture?ce.setTexture2DArray(j,0):ce.setTexture2D(j,0),U.unbindTexture()},this.resetState=function(){T=0,E=0,A=null,U.reset(),$e.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Pa}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Dt._getDrawingBufferColorSpace(e),t.unpackColorSpace=Dt._getUnpackColorSpace()}};
  return {
    ACESFilmicToneMapping: Qr,
    AdditiveBlending: fo,
    BackSide: Hn,
    BoxGeometry: Se,
    BufferAttribute: Ft,
    BufferGeometry: lt,
    CanvasTexture: Pi,
    CatmullRomCurve3: qa,
    CircleGeometry: Xn,
    Color: at,
    ConeGeometry: hn,
    CylinderGeometry: Le,
    DataTexture: ri,
    DataUtils: Ur,
    DirectionalLight: Zr,
    DoubleSide: cn,
    Euler: da,
    Float32BufferAttribute: Ze,
    FogExp2: Nr,
    FrontSide: Wa,
    Group: we,
    HalfFloatType: ta,
    HemisphereLight: Yr,
    IcosahedronGeometry: Yt,
    InstancedBufferAttribute: zi,
    InstancedBufferGeometry: Jr,
    InstancedMesh: lo,
    LatheGeometry: qr,
    Line: Jo,
    LineBasicMaterial: ka,
    LineSegments: co,
    LinearFilter: mn,
    MathUtils: Oc,
    Matrix3: Mt,
    Matrix4: At,
    Mesh: xe,
    MeshBasicMaterial: Xt,
    MeshLambertMaterial: mt,
    NormalBlending: Fi,
    Object3D: ln,
    OrthographicCamera: Ui,
    PCFShadowMap: ho,
    PerspectiveCamera: Nn,
    PlaneGeometry: an,
    PointLight: bn,
    Points: Bn,
    PointsMaterial: ba,
    Quaternion: Wn,
    RGBAFormat: na,
    Raycaster: Kr,
    RedFormat: ar,
    RingGeometry: Ia,
    SRGBColorSpace: Cn,
    Scene: ro,
    ShaderMaterial: $t,
    Sphere: ya,
    SphereGeometry: tn,
    SpotLight: li,
    TetrahedronGeometry: Wr,
    TextureLoader: Xr,
    TorusGeometry: Yn,
    TubeGeometry: si,
    UniformsLib: je,
    UniformsUtils: Vi,
    UnsignedByteType: $n,
    Vector2: nt,
    Vector3: X,
    WebGLRenderTarget: Fn,
    WebGLRenderer: Wc
  };
})();

