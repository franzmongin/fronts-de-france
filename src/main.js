// Fronts de France — version web (three.js). Généré depuis parts/ par tools/cat.sh
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const $=id=>document.getElementById(id);
const HAS3D=true;
const TAU=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t, rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.floor(Math.random()*a.length)];
const angDiff=(a,b)=>{ let d=(a-b)%TAU; if(d>Math.PI) d-=TAU; if(d<-Math.PI) d+=TAU; return d; };
function rng(seed){ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function noise(x,z){ return Math.sin(x*.137+z*.071)*.5+Math.sin(x*.053-z*.191)*.35+Math.sin(x*.41+z*.37)*.15; }

/* ================= RENDU ================= */
let R=null, scene=null, cam=null, sun=null, hemi=null, flashLight=null, quality=matchMedia("(pointer:coarse)").matches?"low":"high";
try{ const sq=localStorage.getItem("fronts3.q"); if(sq==="high"||sq==="med"||sq==="low") quality=sq; }catch(e){}
const UT={time:{value:0}};
function initRenderer(){ if(R) return true;
  try{ R=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance",stencil:false}); }catch(e){ $("loadErr").hidden=false; return false; }
  R.shadowMap.enabled=true; R.shadowMap.type=THREE.PCFShadowMap; R.outputColorSpace=THREE.SRGBColorSpace; R.toneMapping=THREE.ACESFilmicToneMapping; R.toneMappingExposure=1.0;
  $("game").prepend(R.domElement); PMREM=new THREE.PMREMGenerator(R);
  cam=new THREE.PerspectiveCamera(72,16/9,.05,700); flashLight=new THREE.PointLight(0xffb060,0,16,2); cam.add(flashLight); flashLight.position.set(.3,-.1,-1);
  new ResizeObserver(resize).observe($("game")); setQuality(quality); return true; }
function resize(){ if(!R) return; const el=$("game"); const w=Math.max(1,el.clientWidth), h=Math.max(1,el.clientHeight); R.setSize(w,h,false); cam.aspect=w/h; cam.updateProjectionMatrix(); if(FX) FX.setSize(w,h); }
/* post-traitement : occlusion ambiante, bloom léger, sortie tonemappée */
let FX=null, PMREM=null;
function buildFX(){ if(FX){ for(const ps of FX.passes) ps.dispose?.(); FX.renderTarget1.dispose(); FX.renderTarget2.dispose(); FX=null; } if(quality==="low"||!scene) return;
  const el=$("game"), w=Math.max(1,el.clientWidth), h=Math.max(1,el.clientHeight);
  const rt=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,samples:4});
  FX=new EffectComposer(R,rt); FX.setPixelRatio(R.getPixelRatio()); FX.setSize(w,h);
  FX.addPass(new RenderPass(scene,cam));
  const rt0=null; const ao=new GTAOPass(scene,cam,w,h); ao.output=GTAOPass.OUTPUT.Default; ao.blendIntensity=.85;
  ao.updateGtaoMaterial({radius:.9,distanceExponent:1.2,thickness:1.2,scale:1,samples:12}); ao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:12});
  // les sprites, points, lignes et objets transparents ne doivent pas noircir l'occlusion ambiante
  ao._overrideVisibility=function(){ const cache=this._visibilityCache; this.scene.traverse(o=>{ if(o.visible&&(o.isPoints||o.isLine||o.isSprite||(o.material&&!Array.isArray(o.material)&&o.material.transparent))){ o.visible=false; cache.push(o); } }); };
  if(quality==="high"){ FX.addPass(ao); FX.ao=ao; } else ao.dispose();
  const bl=new UnrealBloomPass(new THREE.Vector2(w,h),.2,.5,.92); FX.addPass(bl);
  FX.addPass(new OutputPass()); }
function renderFrame(){ if(FX) FX.render(); else R.render(scene,cam); }
const QN={high:"haute",med:"moyenne",low:"basse"};
function setQuality(q){ quality=q; $("qBtn").textContent="Qualité : "+QN[q]; try{ localStorage.setItem("fronts3.q",q); }catch(e){} if(!R) return;
  const dpr=Math.min(devicePixelRatio||1,q==="high"?1.5:q==="med"?1.25:1)*(q==="low"?.85:1); R.setPixelRatio(dpr);
  R.shadowMap.enabled=q!=="low"; if(sun){ sun.castShadow=q!=="low"; const ms=q==="high"?4096:2048; if(sun.shadow.mapSize.x!==ms){ sun.shadow.mapSize.set(ms,ms); sun.shadow.map?.dispose(); sun.shadow.map=null; } } buildFX();
  if(W&&W.grass) W.grass.count=q!=="low"?W.grass.userData.max:Math.floor(W.grass.userData.max*.35);
  scene&&scene.traverse(o=>{ if(o.material&&!Array.isArray(o.material)) o.material.needsUpdate=true; }); resize(); }

/* ================= TEXTURES PROCÉDURALES ================= */
const TEX={};
function ctex(name,size,draw,rep=1){ const c=document.createElement("canvas"); c.width=c.height=size; const x=c.getContext("2d"); draw(x,size); const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep,rep); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; TEX[name]=t; return t; }
function speckle(x,s,n,a,b,sz=2){ for(let i=0;i<n;i++){ const v=Math.floor(rnd(a,b)); x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(Math.random()*s,Math.random()*s,rnd(1,sz),rnd(1,sz)); } }
function initTextures(){
  ctex("ground",256,(x,s)=>{ x.fillStyle="#d8d8d8"; x.fillRect(0,0,s,s); speckle(x,s,5000,170,255,3);
    x.strokeStyle="rgba(120,120,120,.35)"; for(let i=0;i<900;i++){ const px=Math.random()*s, py=Math.random()*s; x.beginPath(); x.moveTo(px,py); x.lineTo(px+rnd(-2,2),py-rnd(3,8)); x.stroke(); } });
  ctex("stone",256,(x,s)=>{ x.fillStyle="#9a9a9a"; x.fillRect(0,0,s,s); const rh=32; for(let r=0;r<s/rh;r++){ const off=(r%2)*32; for(let c=-1;c<s/64+1;c++){ const v=Math.floor(rnd(175,235)); x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(c*64+off+2,r*rh+2,60,rh-4); } } speckle(x,s,2500,120,200,2); });
  ctex("wood",256,(x,s)=>{ for(let i=0;i<8;i++){ const v=Math.floor(rnd(170,220)); x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(i*32,0,32,s); x.fillStyle="rgba(60,60,60,.6)"; x.fillRect(i*32,0,2,s); }
    x.strokeStyle="rgba(90,90,90,.35)"; for(let i=0;i<120;i++){ const px=Math.random()*s; x.beginPath(); x.moveTo(px,0); x.bezierCurveTo(px+rnd(-6,6),s*.3,px+rnd(-6,6),s*.6,px+rnd(-3,3),s); x.stroke(); } });
  ctex("plaster",256,(x,s)=>{ x.fillStyle="#e0e0e0"; x.fillRect(0,0,s,s); speckle(x,s,3000,190,250,4); x.fillStyle="rgba(140,140,140,.18)"; for(let i=0;i<14;i++){ x.beginPath(); x.ellipse(Math.random()*s,Math.random()*s,rnd(10,40),rnd(6,20),Math.random(),0,TAU); x.fill(); } });
  ctex("cloth",128,(x,s)=>{ x.fillStyle="#dcdcdc"; x.fillRect(0,0,s,s); for(let i=0;i<s;i+=2){ x.fillStyle=`rgba(0,0,0,${rnd(.03,.09)})`; x.fillRect(i,0,1,s); x.fillRect(0,i,s,1); } speckle(x,s,600,180,240,2); });
  ctex("thatch",256,(x,s)=>{ x.fillStyle="#cfcfcf"; x.fillRect(0,0,s,s); x.strokeStyle="rgba(80,80,80,.45)"; for(let i=0;i<1400;i++){ const px=Math.random()*s, py=Math.random()*s; x.beginPath(); x.moveTo(px,py); x.lineTo(px+rnd(-2,2),py+rnd(8,20)); x.stroke(); } });
  ctex("metal",128,(x,s)=>{ const g=x.createLinearGradient(0,0,s,s); g.addColorStop(0,"#e8e8e8"); g.addColorStop(.5,"#bdbdbd"); g.addColorStop(1,"#e0e0e0"); x.fillStyle=g; x.fillRect(0,0,s,s); speckle(x,s,500,150,230,1); });
  ctex("roof",256,(x,s)=>{ x.fillStyle="#c8c8c8"; x.fillRect(0,0,s,s); for(let r=0;r<16;r++){ const off=(r%2)*8; for(let c=-1;c<17;c++){ const v=Math.floor(rnd(150,215)); x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(c*16+off+1,r*16+1,14,13); } } });
}

/* ================= MATÉRIAUX ET GÉOMÉTRIES ================= */
const MATS=new Map();
function mat(c,o={}){ const k=c+"|"+(o.tex||"")+"|"+(o.basic?1:0)+(o.side?1:0)+(o.op||"")+(o.em||""); if(MATS.has(k)) return MATS.get(k);
  const p={color:new THREE.Color(c)}; if(o.tex&&TEX[o.tex]) p.map=TEX[o.tex]; if(o.side) p.side=THREE.DoubleSide; if(o.op){ p.transparent=true; p.opacity=o.op; p.depthWrite=false; }
  if(o.em) p.emissive=new THREE.Color(o.em);
  let m; if(o.basic) m=new THREE.MeshBasicMaterial(p);
  else { const S=SURF[o.tex||""]||SURF[""]; p.roughness=S[0]; p.metalness=S[1]; if(p.map&&S[2]){ p.bumpMap=p.map; p.bumpScale=S[2]; } m=new THREE.MeshStandardMaterial(p); }
  MATS.set(k,m); return m; }
// rugosité, métal, relief par type de surface
const SURF={"":[.82,0,0],ground:[.97,0,1.2],stone:[.9,0,2.2],wood:[.78,0,1.6],plaster:[.92,0,1.2],cloth:[.95,0,.8],thatch:[.95,0,2.4],metal:[.36,.65,.4],roof:[.82,0,1.8]};
let GB,GS,GPR,GC={},GK={}; const BOXG=new Map();
function initGeo(){ GB=new THREE.BoxGeometry(1,1,1); GS=new THREE.SphereGeometry(1,14,10); const sh=new THREE.Shape(); sh.moveTo(-.5,0); sh.lineTo(.5,0); sh.lineTo(0,1); sh.lineTo(-.5,0); GPR=new THREE.ExtrudeGeometry(sh,{depth:1,bevelEnabled:false}); GPR.translate(0,0,-.5); }
const gcyl=s=>GC[s]||(GC[s]=new THREE.CylinderGeometry(1,1,1,s)), gcone=s=>GK[s]||(GK[s]=new THREE.ConeGeometry(1,1,s));
// boîte dont les UV suivent la taille réelle (texture tous les 2 m)
function boxGeo(w,h,d){ const k=[w,h,d].map(v=>v.toFixed(1)).join(","); if(BOXG.has(k)) return BOXG.get(k);
  const g=new THREE.BoxGeometry(w,h,d), uv=g.attributes.uv; const dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let f=0;f<6;f++) for(let v=0;v<4;v++){ const i=f*4+v; uv.setXY(i,uv.getX(i)*dims[f][0]/2,uv.getY(i)*dims[f][1]/2); }
  BOXG.set(k,g); return g; }
function M(geo,color,o={}){ const m=new THREE.Mesh(geo,mat(color,o)); m.castShadow=o.cast!==false; m.receiveShadow=true; return m; }
let BATCH=new Map(); const _q=new THREE.Quaternion(), _e=new THREE.Euler();
function mtx(x,y,z,ry=0,sx=1,sy=1,sz=1,rx=0,rz=0){ _e.set(rx,ry,rz); _q.setFromEuler(_e); return new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),_q.clone(),new THREE.Vector3(sx,sy,sz)); }
function inst(k,geo,color,m,o={}){ const key=k+"|"+color+"|"+(o.tex||""); if(!BATCH.has(key)) BATCH.set(key,{geo,color,list:[],o}); BATCH.get(key).list.push(m); }
function flush(){ for(const b of BATCH.values()){ const im=new THREE.InstancedMesh(b.geo,mat(b.color,{tex:b.o.tex}),b.list.length); b.list.forEach((m,i)=>im.setMatrixAt(i,m)); im.castShadow=b.o.cast!==false; im.receiveShadow=true; im.frustumCulled=false; scene.add(im); } BATCH=new Map(); }

/* ================= MONDE ================= */
let W=null;
const H=(x,z)=>W.h(x,z);
function colBox(cx,cz,w,d,ry,bot,top,o={}){ const c={cx,cz,hx:w/2,hz:d/2,ry,c:Math.cos(ry),s:Math.sin(ry),bot,top,...o}; W.col.push(c); return c; }
function colCirc(cx,cz,r,bot,top,o={}){ const c={cx,cz,r,bot,top,circ:true,...o}; W.col.push(c); return c; }
function inside(c,x,z,m=0){ if(c.off) return false; const dx=x-c.cx, dz=z-c.cz; if(c.circ) return dx*dx+dz*dz<(c.r+m)*(c.r+m); const lx=dx*c.c-dz*c.s, lz=dx*c.s+dz*c.c; return Math.abs(lx)<c.hx+m&&Math.abs(lz)<c.hz+m; }
function box(x,z,w,d,h,color,o={}){ const y=o.y!=null?o.y:H(x,z)+(o.dy||0), ry=o.ry||0; const m=new THREE.Mesh(boxGeo(w,h,d),mat(color,{tex:o.tex})); m.castShadow=o.cast!==false; m.receiveShadow=true; m.position.set(x,y+h/2,z); m.rotation.y=ry; (o.parent||scene).add(m);
  if(o.col!==false) colBox(x,z,w,d,ry,y,y+h,o.cp||{}); return m; }
function cyl(x,z,r,h,color,o={}){ const y=o.y!=null?o.y:H(x,z); const m=M(gcyl(o.seg||12),color,{tex:o.tex}); m.scale.set(r,h,r); m.position.set(x,y+h/2,z); scene.add(m); if(o.col!==false) colCirc(x,z,r,y,y+h,o.cp||{}); return m; }
function cone(x,z,r,h,color,y,o={}){ const m=M(gcone(o.seg||12),color,{tex:o.tex}); m.scale.set(r,h,r); m.position.set(x,y+h/2,z); if(o.ry) m.rotation.y=o.ry; scene.add(m); return m; }
function roof(x,z,w,d,h,color,y,ry=0,tex="roof"){ const m=M(GPR,color,{tex}); m.scale.set(w,h,d); m.position.set(x,y,z); m.rotation.y=ry; scene.add(m); return m; }
function hex(c){ return [Math.pow((c>>16&255)/255,2.2),Math.pow((c>>8&255)/255,2.2),Math.pow((c&255)/255,2.2)]; }
function mixc(a,b,t){ return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]; }
function terrain(size,seg,colorAt){ const g=new THREE.PlaneGeometry(size,size,seg,seg); g.rotateX(-Math.PI/2); const p=g.attributes.position, uv=g.attributes.uv, col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){ const x=p.getX(i), z=p.getZ(i), h=W.h(x,z); p.setY(i,h); col.set(colorAt(x,z,h),i*3); uv.setXY(i,uv.getX(i)*size/3,uv.getY(i)*size/3); }
  g.setAttribute("color",new THREE.BufferAttribute(col,3)); g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,map:TEX.ground,bumpMap:TEX.ground,bumpScale:1.4,roughness:.96,metalness:0})); m.receiveShadow=true; scene.add(m); }
function sky(o){ // o: top, bottom, sun:[x,y,z], cloud (0..1), cloudCol, fog, near, far
  const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(o.top)},bot:{value:new THREE.Color(o.bottom)},sunD:{value:new THREE.Vector3(...o.sun).normalize()},sunC:{value:new THREE.Color(o.sunC||0xfff2d0)},cov:{value:o.cloud??.5},cc:{value:new THREE.Color(o.cloudCol||0xffffff)},time:UT.time},
    vertexShader:"varying vec3 v; void main(){ v=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(v,1.); }",
    fragmentShader:`uniform vec3 top,bot,sunC,cc,sunD; uniform float cov,time; varying vec3 v;
      float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n2(p); p*=2.03; a*=.5; } return s; }
      void main(){ vec3 d=normalize(v-cameraPosition); float h=d.y;
        vec3 col=mix(bot,top,pow(clamp(h*1.25,0.,1.),.65));
        float sd=max(dot(d,sunD),0.); col+=sunC*(pow(sd,1400.)*2.2+pow(sd,24.)*.22+pow(sd,4.)*.06);
        if(h>0.){ vec2 uv=d.xz/(h+.12)*1.4+vec2(time*.004,time*.002); float c=fbm(uv); c=smoothstep(1.-cov*.85,1.15-cov*.5,c); float fade=smoothstep(0.,.25,h);
          vec3 cl=mix(cc*.75,cc,smoothstep(.3,.9,fbm(uv*1.7+3.)))+sunC*pow(sd,6.)*.4; col=mix(col,cl,c*fade*.92); }
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const s=new THREE.Mesh(new THREE.SphereGeometry(420,32,16),m); s.renderOrder=-1; scene.add(s); W.sky=s;
  scene.fog=new THREE.Fog(new THREE.Color(o.fog),o.near,o.far); W.fogBase={near:o.near,far:o.far};
  // éclairage d'ambiance : le ciel lui-même, préfiltré, sert de carte d'environnement
  try{ const es=new THREE.Scene(); const sm=m.clone(); sm.uniforms.time={value:0}; const sk=new THREE.Mesh(new THREE.SphereGeometry(10,32,16),sm); es.add(sk);
    const gr=new THREE.Mesh(new THREE.CircleGeometry(9.9,24),new THREE.MeshBasicMaterial({color:new THREE.Color(o.fog).multiplyScalar(.45)})); gr.rotation.x=-Math.PI/2; gr.position.y=-.3; es.add(gr);
    const rt=PMREM.fromScene(es,.02); scene.environment=rt.texture; scene.environmentIntensity=.55; W.envRT=rt; sm.dispose(); sk.geometry.dispose(); gr.geometry.dispose(); gr.material.dispose(); }catch(e){}
}
const LK=Math.PI; // facteur d'intensité (éclairage physique)
function lights(o){ hemi=new THREE.HemisphereLight(new THREE.Color(o.hs),new THREE.Color(o.hg),o.hi*LK*.55); scene.add(hemi);
  sun=new THREE.DirectionalLight(new THREE.Color(o.sc),o.si*LK*.85); sun.castShadow=quality!=="low"; const sms=quality==="high"?4096:2048; sun.shadow.mapSize.set(sms,sms);
  const c=sun.shadow.camera; c.left=-55; c.right=55; c.top=55; c.bottom=-55; c.far=240; sun.shadow.bias=-.0004; sun.shadow.normalBias=.04; sun.shadow.radius=2.5; W.sunDir=new THREE.Vector3(...o.dir).normalize(); W.sunBase=o.si*LK*.85; scene.add(sun,sun.target); }
function waterNormal(){ if(TEX.waterN) return TEX.waterN; const s=256, c=document.createElement("canvas"); c.width=c.height=s; const x=c.getContext("2d"), im=x.createImageData(s,s); const hgt=new Float32Array(s*s);
  for(let j=0;j<s;j++) for(let i=0;i<s;i++){ const u=i/s*TAU, v=j/s*TAU; hgt[j*s+i]=Math.sin(u*3+Math.sin(v*2)*.8)*.5+Math.sin(v*5+u)*.3+Math.sin((u+v)*7)*.15+Math.sin(u*11-v*4)*.08; }
  for(let j=0;j<s;j++) for(let i=0;i<s;i++){ const dx=hgt[j*s+(i+1)%s]-hgt[j*s+(i-1+s)%s], dy=hgt[((j+1)%s)*s+i]-hgt[((j-1+s)%s)*s+i]; const n=new THREE.Vector3(-dx*2.2,-dy*2.2,1).normalize(); const k=(j*s+i)*4; im.data[k]=(n.x*.5+.5)*255; im.data[k+1]=(n.y*.5+.5)*255; im.data[k+2]=(n.z*.5+.5)*255; im.data[k+3]=255; }
  x.putImageData(im,0,0); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; TEX.waterN=t; return t; }
function water(x0,z0,x1,z1,y,color){ const g=new THREE.PlaneGeometry(x1-x0,z1-z0,1,1); g.rotateX(-Math.PI/2);
  const n=waterNormal().clone(); n.repeat.set((x1-x0)/9,(z1-z0)/9); n.needsUpdate=true;
  const mt=new THREE.MeshStandardMaterial({color:new THREE.Color(color),transparent:true,opacity:.9,roughness:.06,metalness:.1,normalMap:n,normalScale:new THREE.Vector2(.35,.35),envMapIntensity:1.6});
  const m=new THREE.Mesh(g,mt); m.position.set((x0+x1)/2,y,(z0+z1)/2); m.receiveShadow=true; scene.add(m); W.upd.push((t)=>{ n.offset.set(t*.012,t*.02); }); return m; }
// herbe animée
function grass(n,colorA,colorB,avoid,h=.55){
  const g=new THREE.BufferGeometry(), pos=[], col=[]; const ca=hex(colorA), cb=hex(colorB);
  for(let b=0;b<4;b++){ const a=b/4*Math.PI+rnd(-.2,.2), w=.09, hh=h*rnd(.7,1.2), lx=Math.cos(a)*.12, lz=Math.sin(a)*.12, px=Math.cos(a+1.57)*w, pz=Math.sin(a+1.57)*w;
    pos.push(lx-px,0,lz-pz, lx+px,0,lz+pz, lx+rnd(-.08,.08),hh,lz+rnd(-.08,.08)); col.push(...ca,...ca,...cb); }
  g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); g.setAttribute("color",new THREE.Float32BufferAttribute(col,3)); g.computeVertexNormals();
  const m=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.88,metalness:0});
  m.onBeforeCompile=s=>{ s.uniforms.time=UT.time; s.vertexShader="uniform float time;\n"+s.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\n#ifdef USE_INSTANCING\n vec4 ip=instanceMatrix[3];\n transformed.x+=sin(time*1.8+ip.x*.35+ip.z*.21)*.09*position.y; transformed.z+=cos(time*1.4+ip.z*.3)*.06*position.y;\n#endif"); };
  const im=new THREE.InstancedMesh(g,m,n); let k=0; const lim=W.lim+18;
  for(let i=0;i<n*3&&k<n;i++){ const x=rnd(-lim,lim), z=rnd(-lim,lim); if(avoid&&avoid(x,z)) continue; let bad=false; for(const c of W.col){ if(!c.nolos&&inside(c,x,z,.2)){ bad=true; break; } } if(bad) continue;
    const s=rnd(.7,1.4); im.setMatrixAt(k++,mtx(x,H(x,z),z,rnd(0,TAU),s,s*rnd(.8,1.3),s)); }
  im.count=k; im.userData.max=k; im.frustumCulled=false; im.receiveShadow=true; scene.add(im); W.grass=im; if(quality==="low") im.count=Math.floor(k*.35); }

/* ================= DÉCOR ================= */
function tree(x,z,s=1,kind="leaf",snow=false){ const y=H(x,z); inst("tr",gcyl(7),0x5a4028,mtx(x,y+1.2*s,z,0,.26*s,2.4*s,.26*s),{tex:"wood"});
  if(kind==="pine"){ const c=snow?0x3e5a48:0x2f5a35; inst("pn",gcone(8),c,mtx(x,y+3.4*s,z,x,1.8*s,3.4*s,1.8*s)); inst("pn",gcone(8),c,mtx(x,y+4.9*s,z,z,1.25*s,2.5*s,1.25*s)); if(snow){ inst("sn",gcone(8),0xf2f4f6,mtx(x,y+5.8*s,z,z,.7*s,1.1*s,.7*s)); inst("sn",gcone(8),0xf2f4f6,mtx(x,y+3.9*s,z,x,1.3*s,.6*s,1.3*s)); } }
  else if(kind==="apple"){ inst("ap",GS,0x4f8a3a,mtx(x,y+2.8*s,z,0,1.9*s,1.35*s,1.9*s)); for(let i=0;i<6;i++) inst("fr",GS,0xc0392b,mtx(x+Math.cos(i*1.3)*1.5*s,y+2.5*s+(i%2)*.6,z+Math.sin(i*1.3)*1.5*s,0,.12,.12,.12)); }
  else { const c=snow?0x7a8a7a:0x4a7a3a; inst("lf",GS,c,mtx(x,y+3.2*s,z,0,1.9*s,1.7*s,1.9*s)); inst("lf2",GS,snow?0x8a9a8a:0x5a8a42,mtx(x+.7*s,y+3.8*s,z-.3*s,0,1.2*s,1.05*s,1.2*s)); inst("lf3",GS,snow?0x6a7a6a:0x426e34,mtx(x-.6*s,y+2.9*s,z+.5*s,0,1.1*s,.9*s,1.1*s)); }
  colCirc(x,z,.36*s,y,y+5*s,{tree:true}); }
function rock(x,z,s=1){ const y=H(x,z); inst("rk",GS,0x8a8a82,mtx(x,y+.35*s,z,x,1.4*s,.95*s,1.15*s),{tex:"stone"}); inst("rk2",GS,0x7a7a72,mtx(x+.6*s,y+.2*s,z+.4*s,z,.8*s,.6*s,.7*s),{tex:"stone"}); colCirc(x,z,1.15*s,y-.5,y+1.2*s); }
function crate(x,z,s=1,color=0x9a7044){ box(x,z,s,s,s,color,{tex:"wood"}); }
function barrel(x,z){ const y=H(x,z); cyl(x,z,.42,1.05,0x8a6034,{tex:"wood",seg:12}); inst("hp",gcyl(12),0x3a3a3a,mtx(x,y+.2,z,0,.44,.06,.44)); inst("hp",gcyl(12),0x3a3a3a,mtx(x,y+.85,z,0,.44,.06,.44)); }
function tent(x,z,ry,color=0xd9cfb3,w=3,d=3.6,h=2.2){ const y=H(x,z); roof(x,z,w,d,h,color,y,ry,"cloth"); colBox(x,z,w,d,ry,y,y+h); }
function hut(x,z,r){ const y=H(x,z); cyl(x,z,r,2.3,0xa88a62,{y,seg:16,tex:"plaster"}); cone(x,z,r*1.32,3,0xc4a35e,y+2.3,{seg:16,tex:"thatch"}); }
function haystack(x,z,s=1){ const y=H(x,z); cone(x,z,1.9*s,2.8*s,0xd8b45a,y,{seg:12,tex:"thatch"}); colCirc(x,z,1.6*s,y,y+2.2*s); }
function cart(x,z,ry,cover=true){ box(x,z,3.4,1.8,.9,0x7a5634,{dy:.55,ry,tex:"wood"}); const c=Math.cos(ry), s=Math.sin(ry);
  for(const sx of [-1,1]) for(const sz of [-1,1]) inst("wh",gcyl(12),0x4a3420,mtx(x+sx*1.1*c+sz*1*s,H(x,z)+.55,z-sx*1.1*s+sz*1*c,ry,.55,.1,.55,0,Math.PI/2),{tex:"wood"});
  if(cover) roof(x,z,1.8,3.2,.9,0xe8e0c8,H(x,z)+1.45,ry+Math.PI/2,"cloth"); }
function campfire(x,z){ const y=H(x,z); for(let i=0;i<6;i++) inst("st",GS,0x6a6a62,mtx(x+Math.cos(i)*0.7,y+.1,z+Math.sin(i)*.7,0,.22,.16,.22));
  const f=new THREE.Mesh(gcone(7),mat(0xff8a30,{basic:true})); f.scale.set(.45,1.1,.45); f.position.set(x,y+.55,z); scene.add(f);
  const f2=new THREE.Mesh(gcone(7),mat(0xffd060,{basic:true})); f2.scale.set(.25,.7,.25); f2.position.set(x,y+.4,z); scene.add(f2);
  W.upd.push(t=>{ f.scale.y=1+Math.sin(t*13+x)*.25; f2.scale.y=.7+Math.sin(t*17)*.2; }); smokeCol(x,y+1.2,z,6,0x777777,.5); }
function softTex(){ if(TEX.soft) return TEX.soft; const s=128, c=document.createElement("canvas"); c.width=c.height=s; const x=c.getContext("2d");
  for(let k=0;k<7;k++){ const cx=s/2+rnd(-14,14), cy=s/2+rnd(-14,14), r=rnd(30,52); const g=x.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,"rgba(255,255,255,.55)"); g.addColorStop(.6,"rgba(255,255,255,.22)"); g.addColorStop(1,"rgba(255,255,255,0)"); x.fillStyle=g; x.fillRect(0,0,s,s); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; TEX.soft=t; return t; }
function glowTex(){ if(TEX.glow) return TEX.glow; const s=64, c=document.createElement("canvas"); c.width=c.height=s; const x=c.getContext("2d"); const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2); g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(.35,"rgba(255,255,255,.7)"); g.addColorStop(1,"rgba(255,255,255,0)"); x.fillStyle=g; x.fillRect(0,0,s,s); const t=new THREE.CanvasTexture(c); TEX.glow=t; return t; }
function puffSprite(color,op,glow){ const m=new THREE.SpriteMaterial({map:glow?glowTex():softTex(),color:glow?new THREE.Color(color).multiplyScalar(glow):new THREE.Color(color),transparent:true,opacity:op,depthWrite:false,blending:glow?THREE.AdditiveBlending:THREE.NormalBlending,toneMapped:!glow,fog:!glow}); m.rotation=Math.random()*TAU; return new THREE.Sprite(m); }
function smokeCol(x,y,z,n=8,color=0xaaaaaa,spread=1,rise=12){ const ms=[]; for(let i=0;i<n;i++){ const m=puffSprite(color,.3); scene.add(m); ms.push({m,ph:i/n}); }
  W.upd.push(t=>ms.forEach(o=>{ const k=(t*.09+o.ph)%1; o.m.position.set(x+Math.sin(o.ph*20+t*.2)*spread*k*2,y+k*rise,z+Math.cos(o.ph*13)*spread*k); const s=(.6+k*3.2*spread)*2.2; o.m.scale.set(s,s,s); o.m.material.opacity=.42*(1-k)*Math.min(1,k*6); o.m.material.rotation+=.002; })); }
function banner(x,z,h,colors,o={}){ const y=H(x,z); const p=M(gcyl(6),0x6a5030,{tex:"wood"}); p.scale.set(.06,h,.06); p.position.set(x,y+h/2,z); scene.add(p);
  const g=new THREE.Group(); g.position.set(x,y+h-.75,z); scene.add(g); const w=o.w||1.8, hh=o.h||1.2;
  colors.forEach((c,i)=>{ const pl=new THREE.Mesh(new THREE.PlaneGeometry(w/colors.length,hh,4,1),mat(c,{side:1,tex:"cloth"})); pl.position.x=w/colors.length*(i+.5); pl.castShadow=true; g.add(pl); });
  if(o.lis){ for(let i=0;i<3;i++){ const f=new THREE.Mesh(new THREE.PlaneGeometry(.22,.26),mat(0xe8c35a,{side:1})); f.position.set(.4+i*.5,(i%2)*.3-.1,.01); g.add(f); } }
  g.rotation.y=o.ry||0; W.upd.push(t=>g.children.forEach((p,i)=>p.rotation.y=Math.sin(t*2.6+i*.7+x)*.22)); return g; }
function stoneWall(x0,z0,x1,z1,h,color=0xb0a898,th=1){ const len=Math.hypot(x1-x0,z1-z0), ry=-Math.atan2(z1-z0,x1-x0); box((x0+x1)/2,(z0+z1)/2,len,th,h,color,{ry,tex:"stone"}); }
function fence(x0,z0,x1,z1){ const len=Math.hypot(x1-x0,z1-z0), n=Math.ceil(len/2), ry=-Math.atan2(z1-z0,x1-x0);
  for(let i=0;i<=n;i++){ const t=i/n, x=lerp(x0,x1,t), z=lerp(z0,z1,t); inst("fp",GB,0x6a4a2a,mtx(x,H(x,z)+.55,z,ry,.14,1.1,.14),{tex:"wood"}); }
  for(const yy of [.45,.85]){ const cx=(x0+x1)/2, cz=(z0+z1)/2; inst("fr",GB,0x7a5a32,mtx(cx,H(cx,cz)+yy,cz,ry,len,.1,.06),{tex:"wood"}); }
  colBox((x0+x1)/2,(z0+z1)/2,len,.3,ry,H((x0+x1)/2,(z0+z1)/2),H((x0+x1)/2,(z0+z1)/2)+1.05,{low:true}); }
function cannonModel(x,z,ry,col=0x2a2a2a,wheel=0x5a3a20){ const g=new THREE.Group(); const b=M(gcyl(12),col,{tex:"metal"}); b.scale.set(.22,2.6,.22); b.rotation.x=Math.PI/2-.08; b.position.set(0,1.05,.4); g.add(b);
  const tr=M(GB,0x6a4a2a,{tex:"wood"}); tr.scale.set(.6,.45,2.2); tr.position.set(0,.6,-.5); tr.rotation.x=-.18; g.add(tr);
  for(const s of [-1,1]){ const w=M(gcyl(14),wheel,{tex:"wood"}); w.scale.set(.6,.12,.6); w.rotation.z=Math.PI/2; w.position.set(s*.45,.6,0); g.add(w); }
  g.position.set(x,H(x,z),z); g.rotation.y=ry; scene.add(g); colCirc(x,z,1,H(x,z),H(x,z)+1.3); return g; }
function distantArmy(cx,cz,cols,rows,color,ry=0,spacing=1.2){ const y=H(cx,cz); const c=Math.cos(ry), s=Math.sin(ry);
  for(let i=0;i<cols;i++) for(let j=0;j<rows;j++){ const lx=(i-cols/2)*spacing, lz=j*spacing*1.3; const x=cx+lx*c+lz*s, z=cz-lx*s+lz*c, yy=H(x,z);
    inst("da",GB,color,mtx(x,yy+.9,z,ry,.5,1.8,.35),{cast:false}); inst("dh",GB,0xe0b090,mtx(x,yy+1.95,z,ry,.3,.3,.3),{cast:false}); if((i+j)%5===0) inst("dp",GB,0x6a5030,mtx(x+.2,yy+2.4,z,ry,.04,2.5,.04),{cast:false}); } }

/* (personnages : voir 20_chars.js) */

/* ================= PARTICULES ================= */
let PARTS=[];
function particle(x,y,z,o){ const m=o.solid?new THREE.Mesh(GS,new THREE.MeshLambertMaterial({color:new THREE.Color(o.color),transparent:true,opacity:o.op??1})):puffSprite(o.color,o.op??(o.basic?.7:.6),o.basic?(o.glow||2.4):0);
  m.castShadow=false; m.position.set(x,y,z); m.scale.setScalar((o.s||.2)*(o.solid?1:2.4)); scene.add(m); PARTS.push({m,vx:o.vx||0,vy:o.vy||0,vz:o.vz||0,t:0,life:o.life||1,grow:o.grow??1.5,g:o.g||0,op:o.op??.6}); }
function puff(x,y,z,color=0xcccccc,n=6,s=.25,spd=1){ for(let i=0;i<n;i++) particle(x,y,z,{color,s,vx:rnd(-1,1)*spd,vy:rnd(.2,1.3)*spd,vz:rnd(-1,1)*spd,life:rnd(.6,1.3),grow:1.6}); }
function sparks(x,y,z,n=6){ for(let i=0;i<n;i++) particle(x,y,z,{basic:true,color:0xffc060,s:.04,vx:rnd(-4,4),vy:rnd(1,5),vz:rnd(-4,4),life:.35,grow:0,g:14,op:1}); }
function stepParts(dt){ for(const p of PARTS){ p.t+=dt; p.vy-=p.g*dt; p.m.position.x+=p.vx*dt; p.m.position.y+=p.vy*dt; p.m.position.z+=p.vz*dt; p.m.scale.multiplyScalar(1+dt*p.grow*.5); p.m.material.opacity=p.op*(1-p.t/p.life); if(p.t>p.life){ scene.remove(p.m); p.m.material.dispose(); } } PARTS=PARTS.filter(p=>p.t<=p.life); }

/* ================= SON ================= */
let AC=null, REV=null, MASTER=null;
function ac(){ try{ if(!AC){ AC=new (window.AudioContext||window.webkitAudioContext)(); MASTER=AC.createGain(); MASTER.gain.value=.9; MASTER.connect(AC.destination);
    REV=AC.createConvolver(); const len=AC.sampleRate*2.2, b=AC.createBuffer(2,len,AC.sampleRate); for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3); } REV.buffer=b; const rg=AC.createGain(); rg.gain.value=.28; REV.connect(rg).connect(MASTER); }
  if(AC.state==="suspended") AC.resume(); return AC; }catch(e){ return null; } }
function out(node,wet=.4){ node.connect(MASTER); if(wet>0){ const g=AC.createGain(); g.gain.value=wet; node.connect(g).connect(REV); } }
function tone(f1,f2,d,type="square",v=.05,wet=.2,delay=0){ const a=ac(); if(!a) return; const t0=a.currentTime+delay, o=a.createOscillator(), g=a.createGain(); o.type=type; o.frequency.setValueAtTime(f1,t0); o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t0+d); g.gain.setValueAtTime(v,t0); g.gain.exponentialRampToValueAtTime(.0001,t0+d); o.connect(g); out(g,wet); o.start(t0); o.stop(t0+d+.05); }
function noiseB(d,v,f,wet=.35,type="lowpass",delay=0,q=.7){ const a=ac(); if(!a) return; const n=a.createBuffer(1,Math.floor(a.sampleRate*d),a.sampleRate), ch=n.getChannelData(0); for(let i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length,2.2);
  const s=a.createBufferSource(); s.buffer=n; const fl=a.createBiquadFilter(); fl.type=type; fl.frequency.value=f; fl.Q.value=q; const g=a.createGain(); g.gain.value=v; s.connect(fl).connect(g); out(g,wet); s.start(a.currentTime+delay); }
const SND={
 throw:()=>{noiseB(.22,.25,800,.1,"bandpass",0,1.5)}, bow:()=>{tone(260,120,.14,"triangle",.1,.1);noiseB(.12,.2,3000,.1,"highpass")},
 boom:()=>{noiseB(.9,.7,1100,.6);tone(110,38,.5,"sine",.25,.3);noiseB(.05,.4,5000,.1,"highpass")}, smg:()=>{noiseB(.1,.35,2400,.25);tone(150,60,.07,"square",.06,.1)},
 hit:()=>tone(1000,1500,.05,"triangle",.06,0), head:()=>{tone(1800,2600,.06,"square",.04,0);tone(900,1400,.08,"triangle",.05,0)}, block:()=>{tone(2400,1800,.12,"square",.04,.2);noiseB(.08,.2,6000,.2,"highpass")},
 kill:()=>tone(520,200,.2,"square",.04,.1), hurt:()=>{tone(170,70,.28,"sawtooth",.07,.1);noiseB(.15,.25,500,.1)},
 reload:()=>{noiseB(.05,.25,3500,.05,"highpass");noiseB(.06,.25,2800,.05,"highpass",.3)}, ramrod:()=>{for(let i=0;i<3;i++) noiseB(.06,.2,4200,.05,"bandpass",i*.22,3)}, span:()=>{tone(90,140,.6,"sawtooth",.03,.05)},
 objective:()=>[392,523,659,784].forEach((f,i)=>tone(f,f,.25,"triangle",.07,.3,i*.12)), fail:()=>[392,330,262].forEach((f,i)=>tone(f,f,.3,"triangle",.07,.3,i*.15)),
 pick:()=>{tone(660,990,.12,"triangle",.07,.2);tone(990,1480,.16,"triangle",.07,.2,.11)}, foeShot:()=>noiseB(.25,.18,900,.6), foeBow:()=>noiseB(.1,.12,2500,.4,"highpass"),
 explo:()=>{noiseB(1.6,.9,600,.8);tone(70,25,1,"sine",.35,.5)}, distant:()=>{noiseB(1.4,.18,300,.9);}, cry:()=>{ for(let i=0;i<4;i++) tone(rnd(160,260),rnd(120,200),rnd(.6,1),"sawtooth",.012,.9,i*.07); },
 clash:()=>{tone(rnd(1800,2600),rnd(1400,2000),.15,"square",.02,.6);noiseB(.08,.08,6000,.6,"highpass")}, step:()=>noiseB(.06,.06,600,0), horse:()=>{for(let i=0;i<4;i++) noiseB(.05,.12,400,.2,"lowpass",i*.09)},
 click:()=>tone(2200,2000,.03,"square",.03,0), plane:()=>{ const a=ac(); if(!a) return; const o=a.createOscillator(), g=a.createGain(); o.type="sawtooth"; o.frequency.setValueAtTime(70,a.currentTime); o.frequency.linearRampToValueAtTime(55,a.currentTime+6); g.gain.setValueAtTime(.0001,a.currentTime); g.gain.linearRampToValueAtTime(.035,a.currentTime+2.5); g.gain.linearRampToValueAtTime(.0001,a.currentTime+6); const f=a.createBiquadFilter(); f.type="lowpass"; f.frequency.value=400; o.connect(f).connect(g); out(g,.4); o.start(); o.stop(a.currentTime+6.1); }
};
let windNode=null;
function startWind(v=.05){ const a=ac(); if(!a||windNode) return; const n=a.createBuffer(1,a.sampleRate*4,a.sampleRate), d=n.getChannelData(0); let l=0; for(let i=0;i<d.length;i++){ l=l*.98+(Math.random()*2-1)*.02; d[i]=l*6; }
  const s=a.createBufferSource(); s.buffer=n; s.loop=true; const f=a.createBiquadFilter(); f.type="lowpass"; f.frequency.value=500; const g=a.createGain(); g.gain.value=v; s.connect(f).connect(g).connect(MASTER); s.start(); windNode={s,g}; }
function setWind(v){ if(windNode) windNode.g.gain.value=v; }
/* ================= PERSONNAGES : modèles KayKit animés, recolorés par époque ================= */
const CH={lib:{},clips:{},props:{},tex:new Map(),ready:false};
const CH_S=.95, RIDE_Y=1.32;
const BASES=["Rogue","Knight","Barbarian","Rogue_Hooded"];
const bn=n=>n.replace(/[.\[\]:\/]/g,"");
async function loadChars(onProg){
  const ld=new GLTFLoader(); let done=0;
  await Promise.all(BASES.map(n=>new Promise((res,rej)=>ld.load(`./models/${n}.${import.meta.env.VITE_MODEL_EXT||"glb"}`,g=>{ CH.lib[n]=g; done++; onProg&&onProg(done/BASES.length); res(); },undefined,rej))));
  for(const a of CH.lib.Rogue.animations) CH.clips[a.name]=a;
  for(const n of BASES){ const g=CH.lib[n]; g.scene.traverse(o=>{ if(o.isMesh){ o.geometry.userData.keep=true; if(o.material.map&&!g.atlas) g.atlas=o.material.map.image; } }); }
  const grab=(n,name)=>{ let f=null; CH.lib[n].scene.traverse(o=>{ if(o.name===name) f=o; }); return f; };
  CH.props={sword:grab("Knight","1H_Sword"),shieldR:grab("Knight","Round_Shield"),shieldB:grab("Knight","Badge_Shield"),shieldS:grab("Knight","Rectangle_Shield"),axe:grab("Barbarian","1H_Axe"),xbow:grab("Rogue","2H_Crossbow"),shieldBar:grab("Barbarian","Barbarian_Round_Shield")};
  CH.heads={}; for(const n of BASES) CH.lib[n].scene.traverse(o=>{ if(o.isSkinnedMesh&&/Head/.test(o.name)) CH.heads[n]=o; });
  CH.gunQ=CH.props.xbow.quaternion.clone(); CH.gunP=CH.props.xbow.position.clone();
  CH.ready=true; }

// Recoloration : chaque case de l'atlas (8 x 4) est teintée en gardant son dégradé
const RECOL={
  Rogue:{main:{"0,1":"shirt","1,1":"shirtL","6,0":"belt","5,0":"straps","7,1":"boots","3,2":"legs"},head:{"1,0":"hair"},arms:{"0,1":"sleeve","5,2":"sleeveD","5,0":"straps","1,1":"sleeveL"},cape:{"1,1":"cape"}},
  Rogue_Hooded:{main:{"0,1":"shirt","1,1":"shirtL","6,0":"belt","5,0":"straps","7,1":"boots","3,2":"legs"},head:{"1,0":"hair","1,1":"hatc"},arms:{"0,1":"sleeve","5,2":"sleeveD","5,0":"straps","1,1":"sleeveL"},cape:{"1,1":"cape"}},
  Knight:{main:{"0,1":"shirt","1,1":"lapel","3,0":"chest","7,0":"chestD","7,1":"legs","6,0":"belt","2,1":"chest"},head:{"1,0":"hair"},arms:{"3,0":"chest","7,0":"chestD","6,0":"belt","4,0":"sleeve"},cape:{"0,1":"cape"},helm:{"3,0":"hatc","7,0":"hatcD"}},
  Barbarian:{main:{"0,1":"shirt","2,1":"shirtL","6,0":"belt","7,1":"boots","3,2":"legs","3,0":"chest"},head:{"1,0":"hair"},arms:{"1,1":"sleeve","6,0":"belt","7,2":"sleeveD","2,1":"sleeveL"},cape:{"7,0":"cape"}}
};
const shade=(c,k)=>{ if(c==null) return null; const r=Math.min(255,(c>>16&255)*k), g=Math.min(255,(c>>8&255)*k), b=Math.min(255,(c&255)*k); return (r<<16)|(g<<8)|b; };
function lookColors(o){ const shirt=o.shirt??0x7a5a3a, sleeve=o.sleeve??shirt, pants=o.pants??0x4a3a2a, chest=o.chest??0xa8aeb4, hatc=o.hatc??0x8e959c;
  return {shirt,shirtL:o.lapel??shade(shirt,1.18),sleeve,sleeveL:shade(sleeve,1.15),sleeveD:shade(sleeve,.72),legs:o.legs??pants,boots:o.boots??0x2a2018,belt:o.belt??0x3a2a1a,straps:o.straps??o.belt??0x3a2a1a,
    hair:o.hair??0x3a2a1a,cape:o.cape??null,lapel:o.lapel??o.collar??shade(shirt,1.2),chest,chestD:shade(chest,.75),hatc,hatcD:shade(hatc,.75)}; }
function atlasTex(base,group,cols){ const map=RECOL[base][group]; const key=base+"|"+group+"|"+Object.keys(map).map(k=>cols[map[k]]).join(",");
  if(CH.tex.has(key)) return CH.tex.get(key);
  const img=CH.lib[base].atlas, S=512, c=document.createElement("canvas"); c.width=c.height=S; const x=c.getContext("2d"); x.drawImage(img,0,0,S,S);
  const id=x.getImageData(0,0,S,S), d=id.data, cw=S/8, chh=S*.75/3;
  for(const k in map){ const col=cols[map[k]]; if(col==null) continue; const [ci,ri]=k.split(",").map(Number); const x0=ci*cw, y0=ri*chh;
    let sum=0,n=0; for(let y=y0;y<y0+chh;y++) for(let xx=x0;xx<x0+cw;xx++){ const i=(y*S+xx)*4; sum+=d[i]*.3+d[i+1]*.59+d[i+2]*.11; n++; } const mean=Math.max(8,sum/n);
    const tr=col>>16&255, tg=col>>8&255, tb=col&255;
    for(let y=y0;y<y0+chh;y++) for(let xx=x0;xx<x0+cw;xx++){ const i=(y*S+xx)*4; const l=(d[i]*.3+d[i+1]*.59+d[i+2]*.11)/mean, f=clamp(.55+(l-1)*.9+.45,.5,1.45);
      d[i]=Math.min(255,tr*f); d[i+1]=Math.min(255,tg*f); d[i+2]=Math.min(255,tb*f); } }
  x.putImageData(id,0,0); const t=new THREE.CanvasTexture(c); t.flipY=false; t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; CH.tex.set(key,t); return t; }
const CHMAT=new Map();
function charMat(tex,rough=.78,metal=0){ const k=tex.uuid+rough+metal; if(CHMAT.has(k)) return CHMAT.get(k); const m=new THREE.MeshStandardMaterial({map:tex,roughness:rough,metalness:metal}); CHMAT.set(k,m); return m; }

function pickBase(o){ if(o.base) return o.base; if(LI===0) return o.hat==="hood"?"Rogue_Hooded":"Barbarian";
  if(o.hat==="helm"||o.hat==="plume") return "Knight"; if(o.hat==="hood") return "Rogue_Hooded"; return "Rogue"; }
function weaponKind(w){ return w==="spear"||w==="pike"?"pole":w==="sword"||w==="axe"?"1h":w==="pistol"?"pistol":w==="bow"?"bow":w==="xbow"?"xbow":(w==="musket"||w==="rifle"||w==="arq"||w==="smg")?"gun":"none"; }

function human(o){
  const base=pickBase(o), cols=lookColors(o), headBase=o.hat==="hood"?"Rogue_Hooded":o.beard!=null?"Barbarian":"Knight";
  const root=SkeletonUtils.clone(CH.lib[base].scene); root.scale.setScalar(CH_S);
  const B={}; const strip=[], swaps=[];
  root.traverse(n=>{ if(n.isBone) B[bn(n.name)]=n;
    if(n.isMesh){ const nm=n.name; n.castShadow=true; n.receiveShadow=true;
      if(!n.isSkinnedMesh&&!/Cape|Helmet|Hat/.test(nm)){ strip.push(n); return; }
      let grp=/Cape/.test(nm)?"cape":/Helmet/.test(nm)?"helm":/Hat/.test(nm)?"hat":/Head/.test(nm)?"head":/Arm/.test(nm)?"arms":"main";
      if(grp==="hat"||(grp==="cape"&&cols.cape==null)||(grp==="helm"&&o.hat!=="helm")){ strip.push(n); return; }
      if(grp==="head"){ const src=CH.heads[headBase]; if(src&&headBase!==base){ const nh=new THREE.SkinnedMesh(src.geometry,n.material); nh.name=src.name; nh.bind(n.skeleton,n.bindMatrix); nh.castShadow=nh.receiveShadow=true; swaps.push([n,nh]); n.visible=false; n=nh; }
        n.material=charMat(atlasTex(headBase,"head",cols),.8,0); return; }
      n.material=charMat(atlasTex(base,grp,cols),grp==="helm"||(base==="Knight"&&grp!=="head"&&grp!=="cape")?.42:.8,grp==="helm"||(base==="Knight"&&(grp==="main"||grp==="arms"))?.45:0); } });
  for(const n of strip) n.parent&&n.parent.remove(n);
  for(const [a,b] of swaps){ a.parent.add(b); a.parent.remove(a); }
  const hr=B.handslotr, hl=B.handslotl, head=B.head, chest=B.chest;
  const P=(geo,c,sx,sy,sz,x,y,z,par,tex)=>{ const m=M(geo,c,{tex}); m.scale.set(sx,sy,sz); m.position.set(x,y,z); par.add(m); return m; };
  const w=o.weapon, kind=weaponKind(w);
  const prop=(k,par,tint)=>{ const s=CH.props[k]; if(!s) return null; const m=s.clone(); m.castShadow=true; if(tint!=null){ m.material=s.material.clone(); m.material.color.set(tint); } par.add(m); return m; };
  if(w==="sword") prop("sword",hr);
  if(w==="axe"){ const a=prop("axe",hr); if(o.hat==="morion"&&a){ a.scale.set(1,1.9,1); } }
  if(w==="xbow") prop("xbow",hr);
  if(kind==="pole"){ const L=w==="pike"?4.8:2.5, y0=w==="pike"?-1.1:-.6; P(gcyl(6),0x7a5a35,.035,L,.035,0,y0+L/2,0,hr,"wood"); P(gcone(6),0xd0d4d8,.075,.32,.075,0,y0+L+.16,0,hr,"metal");
    if(w==="pike"&&o.hat==="morion"){} }
  if(w==="bow"){ const bw=new THREE.Group(); hl.add(bw); const arc=new THREE.Mesh(new THREE.TorusGeometry(.75,.025,5,16,Math.PI*.9),mat(0x6a4a2a,{tex:"wood"})); arc.rotation.z=Math.PI/2-Math.PI*.45; arc.position.x=-.45; arc.castShadow=true; bw.add(arc); P(GB,0xe8e0d0,.01,1.48,.01,-.25,0,0,bw); }
  if(kind==="gun"||kind==="pistol"){ const g=new THREE.Group(); g.position.copy(CH.gunP); g.quaternion.copy(CH.gunQ); hr.add(g);
    if(w==="pistol"){ P(GB,0x5a3a20,.08,.16,.22,0,-.08,-.02,g,"wood"); P(gcyl(8),0x3a3a3a,.035,.42,.035,0,.03,.24,g,"metal").rotation.x=Math.PI/2; }
    else { const L=w==="rifle"?1.25:w==="smg"?.8:w==="arq"?1.45:1.55; const wood=w==="smg"?0x2a2a2a:0x6a4426;
      P(GB,wood,.1,.2,.55,0,-.06,-.3,g,w==="smg"?"metal":"wood"); P(GB,wood,.085,.1,L*.62,0,.02,L*.25,g,w==="smg"?"metal":"wood");
      P(gcyl(8),0x34363a,.03,L*.85,.03,0,.07,L*.38,g,"metal").rotation.x=Math.PI/2;
      if(w==="musket") P(GB,0xd0d4d8,.015,.015,.45,.03,.07,L*.82+.22,g,"metal");
      if(w==="smg") P(GB,0x1a1a1a,.04,.3,.06,-.1,0,.25,g,"metal").rotation.z=Math.PI/2;
      if(w==="arq"){ const mt=P(GB,0xff7a20,.03,.03,.06,.05,.12,-.05,g); mt.material=mat(0xff7a20,{basic:true}); } } }
  if(o.shield!=null){ const k=LI===0?"shieldBar":LI===1?"shieldB":"shieldR"; prop(k,hl,o.shield); }
  if(o.flag!=null){ const fp=new THREE.Group(); fp.position.set(-.62,.05,.28); root.add(fp); P(gcyl(6),0x6a5030,.045,4.4,.045,0,2.2,0,fp,"wood"); P(GS,0xe8c35a,.08,.08,.08,0,4.42,0,fp,"metal");
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1,6,2),mat(o.flag,{side:1,tex:"cloth"})); fl.geometry.translate(.75,0,0); fl.position.set(0,3.85,0); fl.castShadow=true; fp.add(fl); root.userData.fl=fl; }
  // couvre-chefs, barbes, sacs : ajoutés sur l'os de la tête et du torse
  const HG=new THREE.Group(); HG.scale.set(2.75,2.3,2.75); HG.position.set(0,-.02,0); head.add(HG);
  const hc=o.hatc||0x8e959c, hat=o.hat;
  if(hat==="spangen"){ P(GS,hc,.21,.2,.21,0,.38,0,HG,"metal"); P(GB,0x6a5030,.04,.24,.03,0,.44,.19,HG); }
  else if(hat==="nasal"){ P(gcone(12),hc,.22,.28,.22,0,.5,0,HG,"metal"); P(gcyl(12),hc,.215,.08,.215,0,.33,0,HG,"metal"); P(GB,hc,.035,.17,.03,0,.24,.2,HG,"metal"); }
  else if(hat==="crown"){ P(gcyl(14),0xe8c35a,.2,.09,.2,0,.4,0,HG,"metal"); for(let i=0;i<6;i++){ const a=i/6*TAU; P(gcone(4),0xe8c35a,.04,.1,.04,Math.cos(a)*.18,.49,Math.sin(a)*.18,HG,"metal"); } }
  else if(hat==="beret"){ const b=P(gcyl(14),o.hatc||0x2a2a2a,.24,.07,.24,.03,.42,0,HG,"cloth"); b.rotation.z=.22; }
  else if(hat==="morion"){ P(GS,hc,.22,.17,.22,0,.38,0,HG,"metal"); P(gcyl(16),hc,.33,.025,.25,0,.35,0,HG,"metal"); P(GB,hc,.03,.13,.36,0,.5,0,HG,"metal"); }
  else if(hat==="plume"){ P(GB,0xd03030,.07,.28,.14,0,.62,-.1,HG); P(GB,0xf2f2f2,.07,.22,.12,0,.58,.02,HG); }
  else if(hat==="bicorne"){ const b=P(GPR,o.hatc||0x1d1d1d,.2,.2,.5,0,.4,0,HG,"cloth"); b.rotation.y=Math.PI/2; P(gcyl(12),o.hatc||0x1d1d1d,.17,.06,.17,0,.42,0,HG,"cloth"); if(o.cocarde){ P(GS,0x2b4aa0,.045,.045,.02,.1,.5,.06,HG); P(GS,0xf2f2f2,.03,.03,.02,.1,.5,.07,HG); P(GS,0xd0352b,.015,.015,.02,.1,.5,.08,HG); } }
  else if(hat==="shako"){ P(gcyl(14),o.hatc||0x1d1d1d,.175,.27,.175,0,.5,0,HG,"cloth"); P(gcyl(14),0x1d1d1d,.18,.03,.18,0,.645,0,HG); P(GS,o.plume||0xd8d8d8,.035,.07,.035,0,.69,.14,HG); P(GB,0x1d1d1d,.22,.02,.1,0,.37,.17,HG); P(GS,0xe8c35a,.035,.045,.02,0,.48,.175,HG,"metal"); }
  else if(hat==="stahl"){ P(GS,hc,.235,.2,.235,0,.37,-.01,HG,"metal"); P(gcyl(16),hc,.26,.07,.27,0,.3,-.02,HG,"metal"); }
  else if(hat==="brodie"){ P(GS,hc,.22,.13,.22,0,.4,0,HG,"metal"); P(gcyl(16),hc,.34,.025,.34,0,.37,0,HG,"metal"); }
  else if(hat==="cap"){ P(gcyl(14),o.hatc||0x3a3a46,.215,.12,.215,0,.42,0,HG,"cloth"); P(GB,0x1a1a1a,.24,.02,.12,0,.37,.17,HG); }
  if(o.mustache!=null&&headBase!=="Barbarian"){ const ms=P(GS,o.mustache,.11,.025,.03,0,.115,.19,HG); }
  if(o.longHair&&o.hair!=null){ P(GS,o.hair,.19,.2,.1,0,.16,-.13,HG,"cloth"); }
  if(o.pack!=null) P(GB,o.pack,.5,.55,.24,0,.2,-.4,chest,"cloth");
  if(o.epaulette!=null){ P(GB,o.epaulette,.26,.06,.26,0,.1,0,B.upperarml); P(GB,o.epaulette,.26,.06,.26,0,.1,0,B.upperarmr); }
  if(o.lis){ for(let i=0;i<3;i++) P(GB,0xe8c35a,.09,.11,.02,(i-1)*.18,.25-(i%2)*.15,.33,chest); }
  if(o.cross){ P(GB,0xc0302a,.08,.45,.02,0,.2,.33,chest); P(GB,0xc0302a,.32,.08,.02,0,.28,.33,chest); }
  if(o.straps!=null&&base!=="Knight"){ const a=P(GB,o.straps,.08,.85,.02,0,.12,.31,chest); a.rotation.z=.55; const b=P(GB,o.straps,.08,.85,.02,0,.12,.31,chest); b.rotation.z=-.55; }
  const g=new THREE.Group(); g.add(root);
  const mixer=new THREE.AnimationMixer(root);
  const idle=kind==="pole"?"2H_Melee_Idle":"Idle";
  g.userData={root,mixer,B,kind,idle,cur:null,curA:null,onceT:0,inAtk:false,hurt:false,dying:false,fl:root.userData.fl,ph:Math.random()*6};
  act(g,idle); mixer.update(Math.random()*2);
  return g;
}
function act(h,name,o={}){ const u=h.userData, clip=CH.clips[name]; if(!clip) return;
  if(u.cur===name&&!o.once){ if(o.ts&&u.curA) u.curA.timeScale=o.ts; return; }
  const a=u.mixer.clipAction(clip); a.reset(); a.enabled=true; a.timeScale=o.ts||1; a.setEffectiveWeight(1);
  a.setLoop(o.once?THREE.LoopOnce:THREE.LoopRepeat,Infinity); a.clampWhenFinished=!!o.once;
  if(u.curA&&u.curA!==a){ a.crossFadeFrom(u.curA,o.fade??.2,false); } a.play();
  u.cur=name; u.curA=a; u.onceT=o.once?clip.duration/(o.ts||1)*(o.hold??.92):0; }
function animHuman(h,spd,t,dt,o={}){ const u=h.userData; u.onceT-=dt;
  if(o.ride){ act(h,"Sit_Chair_Pose"); }
  else {
    const atk=o.swing!=null||o.thrust!=null;
    if(atk&&!u.inAtk){ u.inAtk=true; const nm=u.kind==="pole"||o.thrust!=null?"2H_Melee_Attack_Stab":pick(["1H_Melee_Attack_Chop","1H_Melee_Attack_Slice_Diagonal"]); act(h,nm,{once:true,ts:CH.clips[nm].duration/.75,fade:.08}); }
    if(!atk) u.inAtk=false;
    const hurt=(o.lean||0)<0; if(hurt&&!u.hurt&&!atk){ act(h,"Hit_A",{once:true,ts:1.6,fade:.06}); } u.hurt=hurt;
    if(u.onceT<=0){
      if(o.aim) act(h,u.kind==="pistol"?"1H_Ranged_Aiming":u.kind==="bow"?"2H_Ranged_Aiming":"2H_Ranged_Aiming",{fade:.15});
      else if(o.crouch) act(h,"Sit_Floor_Idle",{fade:.25});
      else if(spd>3.9) act(h,"Running_A",{ts:clamp(spd/5.2,.75,1.6)});
      else if(spd>.35) act(h,"Walking_A",{ts:clamp(spd/2.1,.6,1.7)});
      else act(h,o.talk?"Idle":u.idle,{fade:.3}); } }
  if(u.fl) u.fl.rotation.y=Math.sin(t*3+u.ph)*.25;
  u.mixer.update(dt); }
function charDie(h,dt){ const u=h.userData; if(!u.dying){ u.dying=true; act(h,Math.random()<.5?"Death_A":"Death_B",{once:true,fade:.1,ts:1.15}); } u.mixer.update(dt); }

/* ================= CHEVAUX ================= */
const CAPG=new Map(); const capG=(r,l)=>{ const k=r+"|"+l; if(!CAPG.has(k)) CAPG.set(k,new THREE.CapsuleGeometry(r,l,4,10)); return CAPG.get(k); };
function horse(color=0x6a4a30,mane=0x2a1a10,barding){ const g=new THREE.Group(); const C=(r,l,c,x,y,z,rx=0,par=g,sx=1,sz=1,tex)=>{ const m=new THREE.Mesh(capG(r,l),mat(c,{tex})); m.castShadow=true; m.receiveShadow=true; m.position.set(x,y,z); m.rotation.x=rx; m.scale.set(sx,1,sz); par.add(m); return m; };
  const body=new THREE.Group(); g.add(body);
  C(.44,1.15,color,0,1.42,0,Math.PI/2,body,.92,1); C(.4,.2,color,0,1.48,.62,0,body,.9,.9); C(.42,.2,color,0,1.46,-.6,0,body,.95,.95);
  const neck=new THREE.Group(); neck.position.set(0,1.62,.82); neck.rotation.x=.95; body.add(neck); C(.2,.5,color,0,.36,0,0,neck,1,1.3); const mn=M(GB,mane); mn.scale.set(.08,.85,.14); mn.position.set(0,.45,-.22); neck.add(mn);
  const hd=new THREE.Group(); hd.position.set(0,.72,.06); hd.rotation.x=1.25; neck.add(hd); C(.15,.42,color,0,.18,0,0,hd,.85,1.1);
  for(const s of [-1,1]){ const e=M(gcone(5),color); e.scale.set(.05,.14,.05); e.position.set(s*.08,-.08,-.12); e.rotation.x=-1.2; hd.add(e); }
  const tail=M(gcone(6),mane); tail.scale.set(.12,.8,.12); tail.position.set(0,1.38,-1.05); tail.rotation.x=-2.6; body.add(tail);
  if(barding!=null){ const b=new THREE.Mesh(capG(.46,1.12),mat(barding,{tex:"cloth"})); b.rotation.x=Math.PI/2; b.scale.set(.93,1,.92); b.position.set(0,1.36,0); b.castShadow=true; body.add(b); }
  const sad=M(GB,0x4a3020,{tex:"wood"}); sad.scale.set(.7,.12,.62); sad.position.set(0,1.86,-.08); body.add(sad);
  const legs=[]; for(const [lx,lz] of [[-.22,.62],[.22,.62],[-.22,-.62],[.22,-.62]]){ const l=new THREE.Group(); l.position.set(lx,1.25,lz); g.add(l); C(.1,.5,color,0,-.32,0,0,l,1,1.2);
    const kn=new THREE.Group(); kn.position.set(0,-.62,0); l.add(kn); C(.065,.45,color,0,-.26,0,0,kn); const hf=M(gcyl(8),0x1a1a1a); hf.scale.set(.085,.1,.09); hf.position.set(0,-.55,.01); kn.add(hf); l.userData.kn=kn; legs.push(l); }
  g.userData.legs=legs; g.userData.body=body; g.userData.ph=Math.random()*6; return g; }
function animHorse(h,spd,dt){ const u=h.userData; u.ph+=dt*(spd>.5?spd*1.25:0); const a=spd>.5?Math.min(.75,spd*.085):0;
  u.legs.forEach((l,i)=>{ const p=u.ph+(i<2?0:Math.PI)+(i%2)*.6; l.rotation.x=Math.sin(p)*a; l.userData.kn.rotation.x=(i<2?1:-1)*Math.max(0,Math.sin(p+1.2))*a*1.1; });
  u.body.position.y=a>0?Math.abs(Math.sin(u.ph))*.08:0; u.body.rotation.x=a>0?Math.sin(u.ph*2)*.03:0; }

/* ================= ARMES DU JOUEUR ================= */
const WEAPONS={
 francisque:{name:"Francisque",mag:1,reload:.6,rate:.35,dmg:100,speed:30,grav:11,spread:.006,proj:"axe",snd:"throw",anim:"draw",ads:62,recoil:.012},
 arbalete:{name:"Arbalète",mag:1,reload:1.4,rate:.3,dmg:100,speed:80,grav:4,spread:.004,proj:"bolt",snd:"bow",anim:"span",ads:52,recoil:.02},
 arquebuse:{name:"Arquebuse à mèche",mag:1,reload:2.2,rate:.3,dmg:100,speed:230,grav:1,spread:.012,proj:"ball",snd:"boom",anim:"ramrod",ads:54,recoil:.09,smoke:true},
 charleville:{name:"Fusil modèle 1777",mag:1,reload:1.8,rate:.3,dmg:100,speed:250,grav:1,spread:.009,proj:"ball",snd:"boom",anim:"ramrod",ads:52,recoil:.08,smoke:true,bayonet:true},
 sten:{name:"Pistolet-mitrailleur Sten",mag:32,reload:2.1,rate:.095,dmg:34,speed:320,grav:0,spread:.02,proj:"tracer",snd:"smg",anim:"mag",ads:56,recoil:.018,auto:true,grenades:3}
};

/* ================= UNITÉS ================= */
const R_BOW={speed:32,grav:9,dmg:11,cd:[2.4,3.4],proj:"arrow",range:30,inacc:1.3,snd:"foeBow"};
const R_XBOW={speed:58,grav:4,dmg:15,cd:[3,4.2],proj:"bolt",range:32,inacc:1.1,snd:"foeBow"};
const R_ARQ={speed:160,grav:1,dmg:18,cd:[3.4,4.8],proj:"ball",range:32,inacc:1.4,snd:"foeShot",smoke:true};
const R_MUSK={speed:170,grav:1,dmg:15,cd:[2.6,3.8],proj:"ball",range:34,inacc:1.3,snd:"foeShot",smoke:true};
const R_RIFLE={speed:230,grav:0,dmg:12,cd:[1.6,2.6],proj:"tracer",range:40,inacc:1.0,snd:"foeShot"};
const R_SMG={speed:230,grav:0,dmg:7,cd:[.12,.16],burst:6,pause:[1.4,2.2],proj:"tracer",range:24,inacc:1.6,snd:"foeShot"};
const R_PISTOL={speed:200,grav:0,dmg:10,cd:[1.4,2],proj:"tracer",range:20,inacc:1.4,snd:"foeShot"};
const CAT=[
 { // 507
  warrior:{look:{shirt:0x7a3a2a,pants:0x5a4a3a,hair:0x8a6a3a,beard:0x8a6a3a,hat:"spangen",weapon:"spear",shield:0x9a3a2a,cape:0x4a3a2a},hp:100,spd:3.3,melee:{dmg:13,reach:1.9,cd:1.2},shield:true},
  axeman:{look:{shirt:0x6a5a3a,pants:0x4a3a2a,hair:0x5a3a20,beard:0x5a3a20,weapon:"axe"},hp:90,spd:3.7,melee:{dmg:16,reach:1.6,cd:1}},
  archer:{look:{shirt:0x5a5a3a,pants:0x4a3a2a,hair:0x6a4a2a,weapon:"bow",hat:"hood",hatc:0x5a4a32},hp:80,spd:3.1,ranged:R_BOW},
  chief:{look:{shirt:0x8a2a2a,pants:0x3a2a1a,hair:0x7a5a2a,beard:0x7a5a2a,hat:"spangen",hatc:0xc8a24a,weapon:"sword",shield:0x8a2a2a,cape:0x5a1a1a,chest:0xa8a8a8},hp:240,spd:3.2,melee:{dmg:22,reach:1.8,cd:1},shield:true,officer:true,name:"Chef wisigoth"},
  flag:{look:{shirt:0x6a2a5a,pants:0x3a2a1a,hair:0x8a6a3a,beard:0x8a6a3a,hat:"spangen",flag:0xa02a2a},hp:150,spd:2.8,flag:true,name:"Porte-étendard d'Alaric"},
  rider:{look:{shirt:0x7a3a2a,pants:0x4a3a2a,hair:0x6a4a2a,hat:"spangen",weapon:"spear",shield:0x9a3a2a},hp:220,spd:9,cav:{color:0x6a4a30},melee:{dmg:28,reach:2,cd:1}},
  A:{look:{shirt:0x3a5a7a,pants:0x6a5a4a,hair:0xc8a050,longHair:true,mustache:0xc8a050,weapon:"axe",shield:0x2a4a7a,cape:0x5a4a3a},hp:170,spd:3.6,melee:{dmg:34,reach:1.8,cd:1.1},shield:true}
 },
 { // 1214
  foot:{look:{shirt:0x5a6a3a,pants:0x6a6a6a,hat:"nasal",weapon:"spear",shield:0xe8c84a},hp:100,spd:3.3,melee:{dmg:14,reach:1.9,cd:1.2},shield:true},
  knight:{look:{shirt:0xe8c84a,sleeve:0x8e959c,pants:0x8e959c,legs:0x8e959c,hat:"helm",weapon:"sword",shield:0xe8c84a,chest:0x9aa0a8},hp:150,spd:3.2,melee:{dmg:19,reach:1.7,cd:1.1},shield:true},
  xbow:{look:{shirt:0x3a5a7a,sleeve:0x8e959c,pants:0x6a6a6a,hat:"nasal",weapon:"xbow"},hp:90,spd:3,ranged:R_XBOW},
  cav:{look:{shirt:0xe8c84a,sleeve:0x8e959c,pants:0x8e959c,hat:"helm",weapon:"spear",shield:0xe8c84a},hp:260,spd:9.5,cav:{color:0x3a2a1a,barding:0xe8c84a},melee:{dmg:30,reach:2,cd:1}},
  chief:{look:{shirt:0x2a6a3a,sleeve:0x8e959c,pants:0x8e959c,hat:"helm",hatc:0xc8a24a,weapon:"sword",shield:0x2a6a3a,chest:0xb0b0b0,cape:0x2a4a2a},hp:280,spd:3,melee:{dmg:24,reach:1.8,cd:1},shield:true,officer:true,name:"Renaud de Dammartin, comte de Boulogne"},
  A:{look:{shirt:0x2b4aa0,pants:0x6a5a4a,hat:"nasal",weapon:"spear",shield:0x2b4aa0},hp:170,spd:3.5,melee:{dmg:32,reach:1.9,cd:1.1},shield:true},
  A2:{look:{shirt:0x2b4aa0,pants:0x5a4a3a,hat:"hood",hatc:0x6a5a40,weapon:"xbow"},hp:140,spd:3,ranged:{...R_XBOW,dmg:45,inacc:1.6}}
 },
 { // 1515
  pike:{look:{shirt:0xd0352b,sleeve:0xf2f2f2,pants:0xf2f2f2,legs:0xd0352b,hat:"morion",weapon:"pike",hair:0x7a5a2a,beard:0x7a5a2a},hp:110,spd:3,melee:{dmg:16,reach:2.9,cd:1.3}},
  halb:{look:{shirt:0xf2f2f2,sleeve:0xd0352b,pants:0xd0352b,hat:"morion",weapon:"axe",beard:0x5a3a20},hp:110,spd:3.4,melee:{dmg:20,reach:2,cd:1.2}},
  arq:{look:{shirt:0xd0352b,pants:0xd8d0c0,hat:"beret",hatc:0x1d1d1d,weapon:"arq"},hp:90,spd:3,ranged:R_ARQ},
  captain:{look:{shirt:0xd0352b,sleeve:0xf2f2f2,pants:0xf2f2f2,hat:"plume",hatc:0xb8b8b8,weapon:"sword",chest:0xb0b0b0,beard:0x8a6a3a},hp:360,spd:3,melee:{dmg:24,reach:1.9,cd:1},officer:true,name:"Capitaine des Suisses"},
  flag:{look:{shirt:0xf2f2f2,sleeve:0xd0352b,pants:0xd0352b,hat:"morion",flag:0xd0352b},hp:150,spd:2.8,flag:true,name:"Porte-bannière suisse"},
  A:{look:{shirt:0x8a2a2a,sleeve:0xe8d8a0,pants:0x2b4aa0,legs:0xe8d8a0,hat:"beret",hatc:0x8a2a2a,weapon:"pike",beard:0x6a4a2a},hp:170,spd:3.3,melee:{dmg:32,reach:2.8,cd:1.2}},
  A2:{look:{shirt:0x2b4aa0,pants:0xd8d0c0,hat:"beret",hatc:0x2b4aa0,weapon:"arq"},hp:140,spd:3,ranged:{...R_ARQ,dmg:60,inacc:1.8}}
 },
 { // 1805
  aus:{look:{shirt:0xf0ede6,sleeve:0xf0ede6,pants:0xf0ede6,hat:"shako",weapon:"musket",straps:0x2a2a2a,lapel:0xb03030,boots:0x1a1a1a,pack:0x7a5a3a},hp:100,spd:3.1,ranged:R_MUSK,melee:{dmg:16,reach:2.2,cd:1.4}},
  rus:{look:{shirt:0x2f4a2f,sleeve:0x2f4a2f,pants:0xf0ede6,hat:"shako",weapon:"musket",straps:0xf2f2f2,lapel:0xb03030,boots:0x1a1a1a,pack:0x7a5a3a},hp:100,spd:3.1,ranged:R_MUSK,melee:{dmg:16,reach:2.2,cd:1.4}},
  gren:{look:{shirt:0x2f4a2f,sleeve:0x2f4a2f,pants:0xf0ede6,hat:"shako",plume:0xd03030,weapon:"musket",straps:0xf2f2f2,lapel:0xd03030,boots:0x1a1a1a},hp:130,spd:3.9,melee:{dmg:20,reach:2.3,cd:1.2}},
  cav:{look:{shirt:0xf0ede6,sleeve:0xf0ede6,pants:0xf0ede6,hat:"helm",hatc:0xd8c070,weapon:"sword",chest:0xc0c0c0},hp:260,spd:10,cav:{color:0x1a1a1a,barding:0xb03030},melee:{dmg:30,reach:2.1,cd:1}},
  officer:{look:{shirt:0x2f4a2f,sleeve:0x2f4a2f,pants:0xf0ede6,hat:"bicorne",weapon:"sword",epaulette:0xe8c35a,boots:0x1a1a1a,buttons:true},hp:220,spd:3,ranged:R_PISTOL,melee:{dmg:22,reach:1.8,cd:1},officer:true,name:"Officier de la Garde russe"},
  flag:{look:{shirt:0x2f4a2f,sleeve:0x2f4a2f,pants:0xf0ede6,hat:"shako",flag:0xf0ede6,boots:0x1a1a1a},hp:150,spd:2.6,flag:true,name:"Porte-drapeau russe"},
  A:{look:{shirt:0x2b4aa0,sleeve:0x2b4aa0,pants:0xf2f2f2,hat:"shako",weapon:"musket",straps:0xf2f2f2,lapel:0xd0352b,collar:0xd0352b,boots:0x1a1a1a,pack:0x7a5a3a},hp:150,spd:3,ranged:{...R_MUSK,dmg:55,inacc:1.6},melee:{dmg:30,reach:2.2,cd:1.3}}
 },
 { // 1944
  ger:{look:{shirt:0x6b7360,sleeve:0x6b7360,pants:0x5a6250,boots:0x1a1a1a,hat:"stahl",hatc:0x4b5147,weapon:"rifle",belt:0x2a2a2a,pack:0x4a4a3a},hp:100,spd:3,ranged:R_RIFLE},
  smg:{look:{shirt:0x6b7360,sleeve:0x6b7360,pants:0x5a6250,boots:0x1a1a1a,hat:"stahl",hatc:0x4b5147,weapon:"smg",belt:0x2a2a2a},hp:100,spd:3.6,ranged:R_SMG},
  gren:{look:{shirt:0x6b7360,sleeve:0x6b7360,pants:0x5a6250,boots:0x1a1a1a,hat:"stahl",hatc:0x4b5147,weapon:"rifle",belt:0x2a2a2a,straps:0x2a2a2a},hp:100,spd:3,ranged:R_RIFLE,grenades:3},
  off:{look:{shirt:0x6b7360,sleeve:0x6b7360,pants:0x5a6250,boots:0x1a1a1a,hat:"cap",hatc:0x5a6250,weapon:"pistol",belt:0x2a2a2a,collar:0x4b5147},hp:200,spd:3,ranged:R_PISTOL,officer:true,name:"Officier allemand"},
  A:{look:{shirt:0x7a7a52,sleeve:0x7a7a52,pants:0x6a6a48,boots:0x2a2018,hat:"beret",hatc:0x2f6a3a,weapon:"rifle",belt:0x5a5a40,pack:0x6a6a48},hp:160,spd:3.4,ranged:{...R_RIFLE,dmg:40,inacc:1.6}}
 }
];
const NPC={
 clovis:{name:"Clovis",role:"Roi des Francs",look:{shirt:0x8a2a22,cape:0x4a1a5a,pants:0x5a4a3a,hair:0xc8a050,longHair:true,mustache:0xc8a050,hat:"crown",weapon:"sword",chest:0xc8a24a}},
 philippe:{name:"Philippe Auguste",role:"Roi de France",look:{shirt:0x2b4aa0,lis:true,cape:0x1d3a80,pants:0x8e959c,legs:0x8e959c,hat:"crown",weapon:"sword",beard:0x7a5a3a,hair:0x7a5a3a}},
 bayard:{name:"Bayard",role:"Le chevalier sans peur et sans reproche",look:{shirt:0xb0b4b8,chest:0xc8ccd0,sleeve:0xb0b4b8,pants:0xb0b4b8,legs:0xb0b4b8,hat:"plume",hatc:0xc0c4c8,weapon:"sword",cape:0x2b4aa0}},
 francois:{name:"François Ier",role:"Roi de France",look:{shirt:0x2b4aa0,lis:true,sleeve:0xe8d8a0,cape:0x1d3a80,pants:0xe8d8a0,hat:"crown",beard:0x4a2a1a,hair:0x4a2a1a,weapon:"sword"}},
 napoleon:{name:"Napoléon",role:"Empereur des Français",look:{shirt:0x7a7f86,sleeve:0x7a7f86,pants:0xf2f2f2,boots:0x1a1a1a,hat:"bicorne",cocarde:true,collar:0x7a7f86}},
 kieffer:{name:"Philippe Kieffer",role:"Commandant du 1er bataillon de fusiliers marins commandos",look:{shirt:0x7a7a52,sleeve:0x7a7a52,pants:0x6a6a48,boots:0x2a2018,hat:"beret",hatc:0x2f6a3a,weapon:"pistol",belt:0x5a5a40}}
};

/* ================= NIVEAUX ================= */
const LV=[
{id:"vouille",y:"507",name:"Vouillé",sub:"Clovis contre les Wisigoths",weapon:"francisque",art:"linear-gradient(180deg,#9fb4cc,#dfe6ea 55%,#6f8f4a 56%,#4a6a32)",
 role:"guerrier franc",foeName:"Wisigoths",
 facts:["La francisque est une hache de jet. Les guerriers francs la lançaient sur l'ennemi juste avant la mêlée.",
  "Les rois mérovingiens sont surnommés les « rois chevelus » : leur longue chevelure est le signe de leur rang.",
  "Selon l'évêque Grégoire de Tours, Clovis tue lui-même Alaric II au cours de la bataille."],
 outro:"Vainqueurs à Vouillé, les Francs chassent les Wisigoths d'Aquitaine ; ceux-ci se replient vers l'Espagne. Clovis fait ensuite de Paris sa capitale.",
 medals:[4000,5500,7000]},
{id:"bouvines",y:"1214",name:"Bouvines",sub:"Philippe Auguste contre Otton IV",weapon:"arbalete",art:"linear-gradient(180deg,#6fa0dc,#eef4f8 55%,#c9b05a 56%,#8aa04e)",
 role:"arbalétrier du roi",foeName:"coalisés",
 facts:["Pendant la bataille, Philippe Auguste est jeté à bas de son cheval. Ses chevaliers le sauvent de justesse.",
  "Les milices des communes, venues de villes comme Amiens, Arras, Beauvais ou Compiègne, combattent aux côtés des chevaliers du roi.",
  "Le carreau d'arbalète perce une cotte de mailles. L'Église avait tenté d'interdire l'arbalète entre chrétiens en 1139."],
 outro:"Le comte de Flandre et le comte de Boulogne sont faits prisonniers, l'empereur Otton IV s'enfuit. Le retour du roi à Paris est fêté pendant une semaine.",
 medals:[3800,5300,6800]},
{id:"marignan",y:"1515",name:"Marignan",sub:"François Ier contre les Suisses",weapon:"arquebuse",art:"linear-gradient(180deg,#5a5f8f,#e8a46a 55%,#8a8a50 56%,#5a6a3a)",
 role:"arquebusier du roi",foeName:"Suisses",
 facts:["Les piquiers suisses, armés de piques de plus de cinq mètres, passent pour les meilleurs fantassins d'Europe.",
  "L'artillerie de Galiot de Genouillac, grand maître de l'artillerie, joue un rôle décisif à Marignan.",
  "Selon la tradition, François Ier se fait armer chevalier par Bayard au soir de la victoire."],
 outro:"Après deux jours de combat, les Suisses se retirent et François Ier entre dans Milan. En 1516, la France signe avec les cantons suisses une « paix perpétuelle » qui tiendra jusqu'à la Révolution.",
 medals:[4000,5500,7000]},
{id:"austerlitz",y:"1805",name:"Austerlitz",sub:"Napoléon contre deux empereurs",weapon:"charleville",art:"linear-gradient(180deg,#b8c4d0,#eef1f4 55%,#e6eaee 56%,#c6ced6)",
 role:"fantassin de la Grande Armée",foeName:"Austro-Russes",
 facts:["Austerlitz est surnommée la bataille des Trois Empereurs : Napoléon, François Ier d'Autriche et Alexandre Ier de Russie.",
  "Vers 9 heures, le soleil perce le brouillard au-dessus du plateau de Pratzen : c'est le fameux « soleil d'Austerlitz ».",
  "Un fantassin entraîné tire deux à trois coups par minute avec le fusil modèle 1777. Baïonnette au canon, l'arme devient une pique."],
 outro:"La victoire française est totale. L'Autriche signe la paix de Presbourg le 26 décembre. Avec le bronze des canons pris à l'ennemi, Napoléon fait élever la colonne Vendôme.",
 medals:[4300,5900,7500]},
{id:"normandie",y:"1944",name:"Normandie",sub:"Les commandos Kieffer dans le bocage",weapon:"sten",art:"linear-gradient(180deg,#8a9aaa,#d8dde0 55%,#5a8a3e 56%,#3e6a2e)",
 role:"commando du bataillon Kieffer",foeName:"soldats allemands",
 facts:["Le 6 juin 1944, les 177 commandos français du bataillon Kieffer débarquent à Colleville, sur la plage de Sword.",
  "Le bocage normand, avec ses haies épaisses plantées sur des talus, transforme chaque champ en forteresse et ralentit l'avance alliée.",
  "Pour préparer le Débarquement, la Résistance sabote voies ferrées et lignes téléphoniques dans toute la France."],
 outro:"La bataille de Normandie dure jusqu'à la fin août 1944. Le 25 août, Paris est libéré. Le 8 mai 1945, l'Allemagne capitule.",
 medals:[5000,6800,8600]}
];

/* ---------- constructions ---------- */
const BUILD=[
function vouille(){
  W.h=(x,z)=>noise(x*.55,z*.55)*1.1+Math.max(0,Math.hypot(x,z)-70)*.15;
  sky({top:0x5f86b8,bottom:0xdbe4ea,sun:[.5,.45,.4],cloud:.55,fog:0xc9d4da,near:35,far:210});
  lights({sc:0xfff0d6,si:2.1,hs:0xd0dcea,hg:0x4a5a32,hi:.9,dir:[.5,.6,.35]});
  terrain(260,130,(x,z,h)=>{ let c=mixc(hex(0x5c8a3e),hex(0x7f9e4a),.5+noise(x*2,z*2)*.5); if(Math.abs(z-11)<4) c=mixc(c,hex(0x6a5a40),.6); return c; });
  water(-130,9,130,13,H(0,11)-.15,0x4a7a8a);
  for(let i=-10;i<=10;i++) rock(i*6+rnd(-2,2),11+rnd(-1.5,1.5),.45);
  const r=rng(3); for(let i=0;i<170;i++){ const a=r()*TAU, d=64+r()*55; tree(Math.cos(a)*d,Math.sin(a)*d,.9+r()*.6,r()<.35?"pine":"leaf"); }
  for(let i=0;i<20;i++){ const x=-55+r()*110, z=-40+r()*95; if(Math.abs(z-11)<6||Math.hypot(x,z+40)<14) continue; tree(x,z,.8+r()*.5); }
  for(let i=0;i<22;i++){ const x=-55+r()*110, z=-30+r()*80; if(Math.abs(z-11)<4) continue; rock(x,z,.9+r()*.8); }
  for(let i=0;i<10;i++){ const x=-45+r()*90, z=-2+r()*45; if(Math.abs(z-11)<4) continue; box(x,z,4.6,.8,.8,0x6a4a2a,{ry:r()*3,tex:"wood",cp:{low:true}}); }
  // camp franc au sud
  for(let i=0;i<6;i++) tent(-24+i*9,-56+(i%2)*4,0,0xd9cfb3); campfire(-6,-50); campfire(14,-52); banner(0,-44,6.5,[0x2b4aa0],{w:2,h:1.4});
  banner(-8,-9,5.5,[0x2b4aa0]); banner(9,-9,5.5,[0x2b4aa0]);
  // camp wisigoth au nord
  for(let i=0;i<7;i++) tent(-30+i*10,64+(i%2)*4,Math.PI,0xc8b48a); campfire(0,60); banner(-12,56,6.5,[0xa02a2a]); banner(14,56,6.5,[0xa02a2a]);
  distantArmy(-60,-30,26,4,0x3a5a7a,Math.PI*.5); distantArmy(70,90,30,4,0x7a3a2a,Math.PI); distantArmy(-80,95,30,3,0x7a3a2a,Math.PI*.9);
  W.lim=72; W.start=[0,-44,0];
  grass(9000,0x3e6a2a,0x9ab85a,(x,z)=>Math.abs(z-11)<3);
  W.parch=[[-30,-20],[34,22],[-14,38]];
  W.ambient={cries:true,clash:true,cannon:false};
  W.allies=[["A",-6,-5],["A",-2,-6],["A",3,-6],["A",7,-5],["A",-10,-4]];
  W.npcs=[["clovis",0,-9,0]];
  W.cine=[{p:[-40,14,-70],to:[-10,10,-30],look:[0,2,-5],d:5,who:"",text:"Printemps 507, près de Poitiers. Clovis, roi des Francs, marche contre Alaric II, roi des Wisigoths."},
    {p:[2,2.2,-4],to:[0,2.3,-6.5],look:[0,2,-9],d:6,who:"Clovis",text:"« Je supporte avec peine que ces ariens possèdent une partie des Gaules. Marchons avec l'aide de Dieu et, après les avoir vaincus, réduisons leur pays en notre pouvoir. »"},
    {p:[0,8,0],to:[0,5,30],look:[0,2,60],d:4.5,who:"",text:"Au nord, de l'autre côté du ruisseau, l'armée wisigothe se met en ordre de bataille."}];
  W.outroCine=[{p:[0,4,20],to:[0,14,-10],look:[0,2,40],d:6,who:"",text:"Selon Grégoire de Tours, Clovis tue Alaric de sa propre main. Les Wisigoths prennent la fuite."}];
  W.obj=[
   {t:"reach",at:[0,-6],r:7,text:"Rejoins la ligne de Clovis au bord du ruisseau",onDone:()=>sub("Clovis","Francs ! Les haches au poing, et que pas un ne recule !",4)},
   {t:"wave",text:"Repousse l'avant-garde wisigothe",groups:[{u:"warrior",n:5,at:[0,62]},{u:"axeman",n:3,at:[-25,58],delay:4},{u:"archer",n:3,at:[25,60],delay:2}]},
   {t:"kill",text:"Abats le porte-étendard d'Alaric",groups:[{u:"flag",n:1,at:[18,44],tag:"target"},{u:"chief",n:1,at:[16,48]},{u:"warrior",n:4,at:[20,50]},{u:"archer",n:2,at:[24,54]}],marker:"target"},
   {t:"wave",text:"Tiens face à la dernière charge wisigothe",groups:[{u:"rider",n:3,at:[-30,66],delay:5},{u:"warrior",n:6,at:[0,64]},{u:"axeman",n:3,at:[30,60],delay:6},{u:"archer",n:3,at:[-15,62],delay:3},{u:"chief",n:1,at:[0,66],delay:8}]}];
},
function bouvines(){
  W.h=(x,z)=>noise(x*.4,z*.4)*.6+(Math.abs(z-2.5)<6?-.8*clamp(1-Math.abs(z-2.5)/6,0,1):0);
  sky({top:0x4a86d0,bottom:0xeaf2f8,sun:[-.4,.65,.4],cloud:.35,fog:0xd8e4ee,near:45,far:240});
  lights({sc:0xfff2d6,si:2.3,hs:0xdce8ff,hg:0x6a6a3a,hi:.85,dir:[-.4,.75,.4]});
  terrain(260,130,(x,z)=>{ const wheat=Math.sin(x*.045+z*.01)>.1; let c=wheat?mixc(hex(0xc9b05a),hex(0xd8c070),.5+noise(x*3,z*3)*.5):mixc(hex(0x7f9a4a),hex(0x9aaa5a),.5+noise(x*2,z*2)*.5); if(Math.abs(z-2.5)<4) c=mixc(c,hex(0x6a5a3e),.7); return c; });
  water(-130,0,130,5,-.55,0x4a7a9a); colBox(-67,2.5,126,5,0,-3,30,{nolos:true}); colBox(67,2.5,126,5,0,-3,30,{nolos:true});
  box(0,2.5,5.6,8,.45,0xa59c8a,{y:-.25,tex:"stone",cp:{low:true}}); stoneWall(-2.9,-1.5,-2.9,6.5,.9,0x9a9182,.4); stoneWall(2.9,-1.5,2.9,6.5,.9,0x9a9182,.4);
  W.via=u=>{ if(((u.z>4.5&&targetZ(u)<.5)||(u.z<.5&&targetZ(u)>4.5))&&Math.abs(u.x)>1.8) return [0,u.z>2.5?7.5:-2.5]; return null; };
  const r=rng(5);
  for(const [x,z,ry] of [[-22,-16,.3],[20,-18,-.4],[32,22,.9],[-30,26,0],[10,32,.2],[-12,-34,0],[38,-30,1]]) cart(x,z,ry);
  for(let i=0;i<10;i++){ const x=-50+r()*100, z=(r()<.5?-1:1)*(10+r()*30); crate(x,z,1.1); }
  for(let i=0;i<7;i++){ const z=(i%2?1:-1)*(16+r()*22), x=-48+i*15; box(x,z,7,1.4,1.7,0x3e6a2e,{tex:"thatch"}); }
  // village de Bouvines
  box(-42,-34,8,12,6,0xd8cfbf,{tex:"plaster"}); roof(-42,-34,8.6,12.6,4,0x5a5f6e,H(-42,-34)+6,0); box(-42,-41,3,3,12,0xd8cfbf,{tex:"plaster"}); cone(-42,-41,2.4,5,0x5a5f6e,H(-42,-41)+12,{seg:4,ry:Math.PI/4});
  for(const [x,z] of [[-30,-42],[-54,-24],[-52,-44]]){ box(x,z,6,7,4.5,0xe0d6c0,{tex:"plaster"}); roof(x,z,6.4,7.4,3,0x8a5440,H(x,z)+4.5,0,"thatch"); }
  for(let i=0;i<120;i++){ const a=r()*TAU, d=66+r()*55; tree(Math.cos(a)*d,Math.sin(a)*d,.9+r()*.5); }
  banner(-14,-26,7,[0x2b4aa0],{lis:true,w:2,h:1.5}); banner(6,34,7,[0xe8c84a],{w:2,h:1.5}); banner(-20,38,7,[0x2a6a3a]);
  distantArmy(-70,-20,30,4,0x2b4aa0,Math.PI*.5); distantArmy(-20,95,40,4,0xe8c84a,Math.PI); distantArmy(80,80,26,4,0x8a8a5a,Math.PI*1.2);
  W.lim=72; W.start=[0,-40,0];
  grass(9500,0x6a7a3a,0xd8c070,(x,z)=>Math.abs(z-2.5)<4.5,.75);
  W.parch=[[-28,-8],[30,12],[0,-30]];
  W.ambient={cries:true,clash:true};
  W.allies=[["A",-5,-10],["A",5,-10],["A",-2,-12],["A2",-8,-14],["A2",8,-14]];
  W.npcs=[["philippe",-14,-22,.4]];
  W.cine=[{p:[50,18,-60],to:[20,12,-30],look:[0,1,2],d:5,who:"",text:"Dimanche 27 juillet 1214. Près du pont de Bouvines, le roi de France fait face à la coalition de l'empereur Otton IV."},
    {p:[-12,2.1,-19.5],to:[-13.2,2.2,-20],look:[-14,2,-22],d:6,who:"Philippe Auguste",text:"Tenez le pont, mes amis. Si la Marque est franchie, c'en est fait du royaume."},
    {p:[0,6,-6],to:[0,4,10],look:[0,1,40],d:4.5,who:"",text:"De l'autre côté de la rivière, les chevaliers impériaux et les gens de pied flamands s'avancent."}];
  W.outroCine=[{p:[-10,3,-15],to:[-24,12,-35],look:[-14,1.5,-22],d:6,who:"Guillaume le Breton, chroniqueur",text:"Le roi rentre à Paris sous les acclamations. Pendant sept jours et sept nuits, la ville est en fête."}];
  W.obj=[
   {t:"hold",at:[0,-8],r:10,time:45,text:"Défends la tête de pont",cont:{units:["foot","foot","knight","xbow"],from:[[0,40],[-20,36],[20,36]],rate:2.2,max:8}},
   {t:"defend",npc:"philippe",time:45,text:"Le roi est désarçonné ! Protège Philippe Auguste",cont:{units:["foot","knight","knight","xbow"],from:[[-66,-22],[66,-26],[-60,-40]],rate:2,max:8},onStart:()=>{ center("Le roi est à terre !",2200); }},
   {t:"wave",text:"Brise la charge des chevaliers impériaux",groups:[{u:"cav",n:4,at:[-66,-14],delay:2},{u:"knight",n:4,at:[66,-20]},{u:"xbow",n:3,at:[0,36]},{u:"chief",n:1,at:[60,-24],delay:6}]}];
},
function marignan(){
  W.h=(x,z)=>noise(x*.35,z*.35)*.5;
  sky({top:0x3a3f6a,bottom:0xf0a060,sun:[.7,.12,-.4],sunC:0xffb070,cloud:.45,cloudCol:0xf0b090,fog:0xb0806a,near:30,far:190});
  lights({sc:0xffa060,si:1.9,hs:0x8a90c0,hg:0x5a4a30,hi:.75,dir:[.7,.3,-.4]});
  terrain(260,130,(x,z)=>mixc(hex(0x8a985a),hex(0xa8a068),.5+noise(x*2,z*2)*.5));
  for(const z of [-28,20]) water(-130,z-1,130,z+1,-.25,0x4a6a80);
  box(-14,-4,14,8,6,0xd8b88a,{tex:"plaster"}); roof(-14,-4,14.4,8.4,3,0xa8503a,H(-14,-4)+6,0); box(6,-6,8,6,4.5,0xd0b080,{tex:"plaster"}); roof(6,-6,8.4,6.4,2.4,0xa8503a,H(6,-6)+4.5,0);
  stoneWall(-24,6,-12,6,2.2,0xc8a87a); stoneWall(14,2,14,12,2.2,0xc8a87a);
  for(const [x,z] of [[22,-2],[-28,12],[30,28],[-34,-20],[10,40],[-12,34]]) haystack(x,z);
  W.cannons=[cannonModel(-9,-18,0),cannonModel(9,-18,0)];
  for(const [x,z] of [[-14,-22],[14,-22],[0,-24]]) barrel(x,z);
  const r=rng(9); for(let i=0;i<110;i++){ const a=r()*TAU, d=64+r()*55; tree(Math.cos(a)*d,Math.sin(a)*d,1,r()<.5?"pine":"leaf"); }
  for(let i=0;i<12;i++) crate(-40+r()*80,-30+r()*70,1.1);
  for(let i=-6;i<=6;i++) for(let j=0;j<3;j++) inst("vin",GB,0x5a7a3a,mtx(i*5,H(i*5,46+j*3)+.8,46+j*3,0,.35,1.6,2.6),{tex:"thatch"});
  for(let i=0;i<6;i++) tent(-30+i*12,-40,0,0xe8e0d0); campfire(-20,-34); campfire(20,-34); campfire(0,10);
  banner(-16,-30,7,[0x2b4aa0],{lis:true,w:2,h:1.5}); banner(4,62,7,[0xd0352b],{w:2,h:1.5});
  distantArmy(0,90,40,6,0xd0352b,Math.PI); distantArmy(-80,-20,30,4,0x2b4aa0,Math.PI*.5);
  smokeCol(-30,1,70,8,0x666666,1.2,16); smokeCol(40,1,80,8,0x666666,1.2,16);
  W.lim=70; W.start=[0,-34,0];
  grass(8000,0x4a5a2a,0xb8b070,(x,z)=>Math.abs(z+28)<1.5||Math.abs(z-20)<1.5,.6);
  W.parch=[[-24,-10],[18,14],[-6,32]];
  W.ambient={cries:true,clash:true,cannon:true};
  W.allies=[["A",-6,-12],["A",6,-12],["A",-12,-10],["A",12,-10],["A2",-4,-16],["A2",4,-16]];
  W.npcs=[["bayard",2,-21,0],["francois",-30,-40,.5]];
  W.cine=[{p:[-30,22,-60],to:[0,14,-40],look:[0,1,0],d:5,who:"",text:"13 septembre 1515, près de Milan. Le soleil décline quand les carrés de piquiers suisses s'ébranlent."},
    {p:[3.5,2.2,-19],to:[2.6,2.3,-19.3],look:[2,2,-21],d:6,who:"Bayard",text:"Arquebusiers, à vos mèches ! Le roi nous regarde. Pas un pas en arrière tant que les canons tirent."},
    {p:[0,5,0],to:[0,3,20],look:[0,1,60],d:4.5,who:"",text:"La bataille durera jusque tard dans la nuit, puis reprendra à l'aube."}];
  W.outroCine=[{p:[4,3,-16],to:[-6,10,-30],look:[2,2,-21],d:6,who:"Le maréchal de Trivulce",text:"Il dira que ses dix-huit batailles n'étaient que jeux d'enfants à côté de celle-ci : « un combat de géants »."}];
  W.obj=[
   {t:"wave",text:"Arrête le premier carré suisse",groups:[{u:"pike",n:8,at:[0,60],square:true},{u:"arq",n:3,at:[-18,58],delay:3},{u:"flag",n:1,at:[0,64]}]},
   {t:"defend",obj:"cannons",time:60,text:"Protège l'artillerie de Galiot de Genouillac",cont:{units:["pike","pike","halb","arq"],from:[[-50,50],[50,50],[0,64]],rate:2,max:9}},
   {t:"kill",text:"Abats le capitaine des Suisses",groups:[{u:"captain",n:1,at:[26,46],tag:"target"},{u:"halb",n:4,at:[24,50]},{u:"pike",n:4,at:[30,52],delay:2},{u:"arq",n:2,at:[18,56]}],marker:"target",rout:true}];
},
function austerlitz(){
  W.h=(x,z)=>noise(x*.5,z*.5)*.6+clamp((z-12)*.22,0,6);
  sky({top:0x8a9cb4,bottom:0xe8ecef,sun:[.3,.25,-.8],sunC:0xfff0c8,cloud:.25,fog:0xdfe4e8,near:6,far:42});
  lights({sc:0xfff0d8,si:.9,hs:0xe8eef4,hg:0x9aa0a8,hi:1.1,dir:[.3,.45,-.8]});
  terrain(260,130,(x,z)=>mixc(hex(0xeef1f4),hex(0xd2dae0),.5+noise(x*3,z*3)*.5));
  water(-60,-40,-22,-24,H(-40,-32)+.05,0xbfd8e6);
  const r=rng(13); for(let i=0;i<100;i++){ const a=r()*TAU, d=64+r()*55; tree(Math.cos(a)*d,Math.sin(a)*d,1,r()<.6?"pine":"leaf",true); }
  for(let i=0;i<10;i++){ const x=-40+i*9, z=-4+(i%3)*8; fence(x,z,x+5,z+r()*2); }
  for(const [x,z] of [[-14,8],[12,-10],[22,18],[-24,-14],[-6,30],[16,34]]) for(let k=0;k<3;k++) crate(x+k*1.2,z,1.1,0x8a6a48);
  for(const [x,z] of [[20,46],[30,40],[12,52]]){ box(x,z,6,8,4.5,0xe8e2d6,{tex:"plaster"}); roof(x,z,6.4,8.4,3,0x8a3a2a,H(x,z)+4.5,0); }
  box(-22,46,5,7,6,0xe8e2d6,{tex:"plaster"}); roof(-22,46,5.4,7.4,3,0x5a5f6e,H(-22,46)+6,0); box(-22,50,2.4,2.4,10,0xe8e2d6,{tex:"plaster"}); cone(-22,50,1.9,3,0x5a5f6e,H(-22,50)+10,{seg:4,ry:Math.PI/4});
  for(const [x,z,ry] of [[-8,-24,0],[8,-26,0],[0,-28,0]]) cannonModel(x,z,ry,0x3a3f30,0x5a4a3a);
  for(let i=0;i<14;i++) rock(-50+r()*100,-30+r()*80,.9);
  banner(-14,-30,7,[0x2b4aa0,0xf2f2f2,0xd0352b],{w:2.2,h:1.5}); banner(0,60,7,[0xf0ede6]);
  distantArmy(-70,-40,34,5,0x2b4aa0,Math.PI*.5); distantArmy(0,95,40,5,0x2f4a2f,Math.PI); distantArmy(80,70,30,5,0xf0ede6,Math.PI*1.3);
  W.lim=70; W.start=[0,-34,0];
  W.parch=[[-40,-32],[18,24],[-18,40]];
  W.ambient={cries:false,clash:false,cannon:true,drums:true};
  W.allies=[["A",-6,-30],["A",-3,-31],["A",3,-31],["A",6,-30],["A",-9,-29],["A",9,-29]];
  W.npcs=[["napoleon",-12,-36,.3,true]];
  W.cine=[{p:[-30,12,-60],to:[-14,6,-44],look:[-12,2,-36],d:5,who:"",text:"2 décembre 1805, au petit matin. Un brouillard épais couvre la plaine de Moravie."},
    {p:[-10.5,3.4,-33.5],to:[-11.2,3.5,-34.4],look:[-12,3,-36],d:6,who:"Napoléon, au maréchal Soult",text:"« Combien de temps vous faut-il pour gravir les hauteurs de Pratzen ? »"},
    {p:[0,4,-20],to:[0,6,0],look:[0,4,40],d:4.5,who:"",text:"Sur le plateau, les colonnes austro-russes s'éloignent pour tourner l'aile droite française. Le centre est dégarni."}];
  W.outroCine=[{p:[0,8,30],to:[0,22,10],look:[0,6,45],d:6,who:"Napoléon, proclamation du 3 décembre",text:"« Il vous suffira de dire : « J'étais à la bataille d'Austerlitz », pour que l'on réponde : « Voilà un brave ! » »"}];
  W.obj=[
   {t:"reach",at:[0,30],r:8,text:"Gravis le plateau de Pratzen dans le brouillard",groups:[{u:"aus",n:3,at:[-12,18]},{u:"aus",n:2,at:[14,24]},{u:"gren",n:2,at:[0,40],delay:6}]},
   {t:"hold",at:[0,40],r:10,time:40,text:"Prends le plateau et tiens-le",cont:{units:["aus","rus","rus","gren"],from:[[0,66],[40,60],[-40,62]],rate:2.1,max:9},onStart:()=>{ W.fogLift=0; center("Le soleil d'Austerlitz !",2600); SND.objective(); }},
   {t:"wave",text:"Repousse la contre-attaque de la Garde russe",groups:[{u:"cav",n:4,at:[-50,62],delay:3},{u:"gren",n:5,at:[0,66]},{u:"rus",n:4,at:[30,64],delay:2},{u:"officer",n:1,at:[0,68],delay:5},{u:"flag",n:1,at:[4,68],delay:5}]}];
},
function normandie(){
  W.h=(x,z)=>noise(x*.5,z*.5)*.5;
  sky({top:0x6a7d92,bottom:0xd2d8dc,sun:[.4,.6,.5],cloud:.75,cloudCol:0xe8eaec,fog:0xc2cacf,near:30,far:180});
  lights({sc:0xf4f0e6,si:1.7,hs:0xd8e0e8,hg:0x4a5a3a,hi:1.0,dir:[.4,.7,.5]});
  terrain(260,130,(x,z)=>mixc(hex(0x587f3c),hex(0x6f9a48),.5+noise(x*2,z*2)*.5));
  W.walls=[];
  const hedge=(x0,z0,x1,z1,gaps)=>{ const len=Math.hypot(x1-x0,z1-z0), n=Math.round(len/3), hz=z0===z1;
    W.walls.push({a:hz?"z":"x",v:hz?z0:x0,min:Math.min(hz?x0:z0,hz?x1:z1),max:Math.max(hz?x0:z0,hz?x1:z1),gaps:gaps.map(i=>lerp(hz?x0:z0,hz?x1:z1,(i+.5)/n))});
    for(let i=0;i<n;i++){ if(gaps.includes(i)) continue; const t=(i+.5)/n, x=lerp(x0,x1,t), z=lerp(z0,z1,t), y=H(x,z), ry=-Math.atan2(z1-z0,x1-x0);
      inst("ta",GB,0x6a5a3a,mtx(x,y+.5,z,ry,3.1,1,2),{tex:"ground"}); inst("hg",GS,0x3a6a2a,mtx(x,y+1.95,z,0,1.9,1.35,1.45)); inst("hg2",GS,0x4a7a32,mtx(x+.6,y+2.5,z+.2,0,1.1,.9,1)); colBox(x,z,3.1,2,ry,y,y+2.7); } };
  hedge(-60,-20,60,-20,[5,6,16,17,28,29]); hedge(-60,18,60,18,[8,9,20,21,33]); hedge(-20,-60,-20,-20,[6,7]); hedge(22,18,22,60,[7,8]);
  // ferme fortifiée
  stoneWall(-14,-4,2,-4,3.4,0xb8b0a0); stoneWall(-14,-4,-14,12,3.4,0xb8b0a0); stoneWall(-14,12,-4,12,3.4,0xb8b0a0); stoneWall(2,4,2,12,2.2,0xb8b0a0);
  box(-8,6,7,5,4.5,0xc8c0b0,{tex:"stone"}); roof(-8,6,7.4,5.4,2.6,0x5a4a3a,H(-8,6)+4.5,0);
  for(let i=0;i<12;i++) inst("db",GB,0x9a9282,mtx(-4+Math.sin(i)*4,H(-4,2)+.2,2+Math.cos(i*1.7)*2,i,.8,.4,.6),{tex:"stone"});
  // planeur écrasé
  box(-30,-14,2.2,9,2,0x7a7a5a,{dy:.3,ry:.4,tex:"wood"}); box(-27,-9,14,.3,2.6,0x6a6a4a,{dy:.2,ry:.4+1.4,tex:"wood",cp:{low:true}}); box(-33,-19,1.6,3,2.6,0x6a6a4a,{dy:1,ry:.4,tex:"wood"});
  // canon antichar
  W.pak=new THREE.Group(); { const g=W.pak; const s=M(GB,0x5a6250,{tex:"metal"}); s.scale.set(2.2,1.3,.12); s.position.set(0,1.1,.3); g.add(s); const b=M(gcyl(10),0x4b5147,{tex:"metal"}); b.scale.set(.09,3.2,.09); b.rotation.x=Math.PI/2; b.position.set(0,1.05,1.9); g.add(b);
    for(const sx of [-1,1]){ const w=M(gcyl(12),0x1a1a1a); w.scale.set(.45,.2,.45); w.rotation.z=Math.PI/2; w.position.set(sx*.9,.45,0); g.add(w); const tr=M(GB,0x5a6250); tr.scale.set(.12,.12,2.4); tr.position.set(sx*.4,.3,-1.3); tr.rotation.y=sx*.25; g.add(tr); }
    g.position.set(24,H(24,32),32); g.rotation.y=Math.PI; scene.add(g); colCirc(24,32,1.4,H(24,32),H(24,32)+1.6); }
  // épave de camion, arbres fruitiers, meules
  box(14,-6,4.4,2.1,1.5,0x4b5147,{dy:.45,tex:"metal"}); box(14.6,-6,2,1.9,1.1,0x3e4438,{y:H(14,-6)+1.95,tex:"metal",col:false});
  const r=rng(21); for(let i=0;i<18;i++){ const x=-50+r()*100, z=-50+r()*100; if(Math.abs(z+20)<3||Math.abs(z-18)<3||(x>-16&&x<4&&z>-6&&z<14)) continue; tree(x,z,.9,"apple"); }
  for(let i=0;i<100;i++){ const a=r()*TAU, d=66+r()*55; tree(Math.cos(a)*d,Math.sin(a)*d,1); }
  for(const [x,z] of [[30,-8],[-34,6],[38,36],[-40,-40],[8,-36]]) haystack(x,z,.8);
  for(let i=0;i<10;i++) crate(-40+r()*80,-40+r()*80,1);
  smokeCol(-8,H(-8,6)+4,6,8,0x666666,.9,14); smokeCol(14,H(14,-6)+2,-6,6,0x444444,.6);
  banner(-14,-50,7,[0x2b4aa0,0xf2f2f2,0xd0352b],{w:2.2,h:1.4});
  W.lim=72; W.start=[0,-46,0];
  W.via=u=>{ for(const w of W.walls){ const ec=w.a==="z"?u.z:u.x, tz=targetZ(u), tx=targetX(u), pc=w.a==="z"?tz:tx; if((ec-w.v)*(pc-w.v)>=0) continue;
      const t=(w.v-ec)/(pc-ec), cross=w.a==="z"?lerp(u.x,tx,t):lerp(u.z,tz,t); if(cross<w.min-1||cross>w.max+1) continue;
      const along=w.a==="z"?u.x:u.z; let g=w.gaps[0]; for(const q of w.gaps) if(Math.abs(q-along)<Math.abs(g-along)) g=q;
      const side=Math.sign(pc-w.v)||1, near=Math.abs(along-g)<1.3&&Math.abs(ec-w.v)<2.6; const tc=near?w.v+side*3:w.v-side*1.6; return w.a==="z"?[g,tc]:[tc,g]; } return null; };
  grass(9500,0x355a26,0x86a84a,null,.6);
  W.parch=[[-10,9],[34,-30],[-34,32]];
  W.ambient={cannon:true,planes:true};
  W.allies=[["A",-4,-42],["A",4,-42],["A",-8,-40],["A",8,-40]];
  W.npcs=[["kieffer",3,-48,-.4]];
  W.cine=[{p:[0,30,-80],to:[0,18,-40],look:[0,0,0],d:5,who:"Radio Londres, 1er juin 1944",text:"« Les sanglots longs des violons de l'automne… » Le message de Verlaine annonce à la Résistance que le Débarquement est imminent."},
    {p:[4.5,2.1,-46],to:[3.8,2.2,-46.6],look:[3,2,-48],d:6,who:"Philippe Kieffer",text:"Un planeur s'est écrasé près des haies. Récupérez sa radio, nettoyez la ferme, et faites sauter ce canon antichar."},
    {p:[-10,4,-30],to:[10,5,-10],look:[0,2,30],d:4,who:"",text:"Juin 1944. Dans le bocage normand, chaque haie peut cacher l'ennemi."}];
  W.outroCine=[{p:[0,2.5,-30],to:[0,6,-10],look:[0,1.5,-20],d:6,who:"",text:"Les blindés alliés arrivent par le chemin creux. La route vers l'intérieur des terres est ouverte."}];
  W.obj=[
   {t:"interact",at:[-29,-11],r:2.4,hold:3,label:"Récupérer la radio",text:"Récupère la radio dans le planeur écrasé",groups:[{u:"ger",n:3,at:[-40,8],delay:2},{u:"smg",n:1,at:[-30,10],delay:4}]},
   {t:"clear",text:"Nettoie la ferme fortifiée",groups:[{u:"ger",n:3,at:[-6,8]},{u:"smg",n:2,at:[-10,2]},{u:"gren",n:1,at:[0,8]},{u:"off",n:1,at:[-8,10]},{u:"ger",n:2,at:[-2,14]}],marker:"group"},
   {t:"interact",at:[24,28.5],r:2.4,hold:4,label:"Poser la charge",text:"Pose une charge sur le canon antichar",groups:[{u:"ger",n:3,at:[30,42]},{u:"smg",n:2,at:[12,40],delay:2},{u:"gren",n:1,at:[36,30],delay:3}]},
   {t:"timer",time:7,at:[24,32],text:"Éloigne-toi ! La charge va sauter",onDone:()=>{ explode(24,H(24,32)+1,32,9,120,null,true); W.pak.rotation.z=.6; W.pak.position.y-=.4; }},
   {t:"survive",time:60,text:"Tiens jusqu'à l'arrivée des blindés",cont:{units:["ger","ger","smg","gren"],from:[[0,64],[-50,40],[50,40],[60,-10]],rate:1.9,max:10},onDone:()=>{ spawnTank(); }}];
}];
function targetZ(u){ const t=u.tgt; return t?t.z:P.z; } function targetX(u){ const t=u.tgt; return t?t.x:P.x; }

/* ================= MENU ================= */
const LS="fronts2.pseudo", LSB="fronts2.best";
let localBest={}; try{localBest=JSON.parse(localStorage.getItem(LSB)||"{}")}catch(e){}
try{$("pseudo").value=localStorage.getItem(LS)||""}catch(e){}
function medalOf(i,score){ const m=LV[i].medals; return score>=m[2]?"g":score>=m[1]?"s":score>=m[0]?"b":""; }
const MEDN={g:"Or",s:"Argent",b:"Bronze"};
function renderCamp(){ const box=$("camp"); box.innerHTML="";
  LV.forEach((l,i)=>{ const b=document.createElement("button"); b.type="button"; b.className="mis"; b.disabled=!CH.ready; const best=localBest[l.id]||0, md=medalOf(i,best);
    b.innerHTML=`<div class="art" style="background:${l.art}"></div><span class="y">${l.y}</span><b></b><span></span><span class="medal"><i class="${md}"></i>${best?`${md?MEDN[md]+" · ":""}${best} pts`:"Pas encore jouée"}</span>`;
    b.querySelector("b").textContent=l.name; b.querySelectorAll("span")[1].textContent=l.sub+" · "+WEAPONS[l.weapon].name;
    b.onclick=()=>{ const p=$("pseudo").value.trim(); if(!p){ $("pseudo").focus(); $("pseudo").placeholder="Choisis d'abord un pseudo"; return; } try{localStorage.setItem(LS,p)}catch(e){} startLevel(i); };
    box.append(b); }); }
renderCamp();
loadChars(k=>{ $("loadBar").style.width=Math.round(k*100)+"%"; }).then(()=>{ $("loadBox").hidden=true; renderCamp(); }).catch(e=>{ console.error(e); $("loadTxt").textContent="Les modèles 3D n'ont pas pu se charger. Recharge la page."; $("loadTxt").className="err"; });
$("nameForm").addEventListener("submit",e=>e.preventDefault()); if(!HAS3D) $("loadErr").hidden=false;
$("qBtn").onclick=()=>{ setQuality(quality==="high"?"med":quality==="med"?"low":"high"); PERF.n=0; PERF.lock=true; };
// ajuste la qualité si la machine peine (seulement tant que le joueur n'a pas choisi lui-même)
const PERF={n:0,sum:0,lock:false,cool:0};
function perfWatch(dtRaw){ if(PERF.lock||quality==="low") return; if(PERF.cool>0){ PERF.cool-=dtRaw; return; } PERF.n++; PERF.sum+=dtRaw;
  if(PERF.n>=120){ const avg=PERF.sum/PERF.n; PERF.n=0; PERF.sum=0; if(avg>.034){ setQuality(quality==="high"?"med":"low"); PERF.cool=3; feed(`Qualité graphique réglée sur « ${QN[quality]} »`); } } }

/* ================= ÉTAT ================= */
let LI=0, L=null, P=null, G=null, running=false, raf=0, last=0, T=0, VM=null;
let UNITS=[], PROJ=[], GRENS=[], DEFS=[], COVER=[], OBJ=null, CINE=null, NPCE={};
const keys={}, inp={x:0,y:0,run:false,crouch:false,jumpP:false,fire:false,reload:false,melee:false,ads:false,act:false,gren:false};
let yaw=0,pitch=0,lookQ={dx:0,dy:0}, recoilOff=0, shake=0;
let uidN=0;

function disposeScene(){ if(!scene) return; const keep=new Set([GB,GS,GPR,...Object.values(GC),...Object.values(GK),...BOXG.values(),...CAPG.values()]);
  scene.traverse(o=>{ if(o.geometry&&!keep.has(o.geometry)&&!o.geometry.userData.keep) o.geometry.dispose(); if(o.material&&o.material.isShaderMaterial) o.material.dispose(); });
  scene.traverse(o=>{ if(o.isSkinnedMesh) o.skeleton.dispose(); if(o.isInstancedMesh) o.dispose(); const m=o.material; if(m&&m.normalMap&&m.normalMap!==TEX.waterN){ m.normalMap.dispose(); m.dispose(); } if(o.isSprite) o.material.dispose(); });
  if(sun){ sun.shadow.map?.dispose(); sun.shadow.map=null; sun.dispose(); } if(W&&W.envRT) W.envRT.dispose(); R.renderLists.dispose(); }
function startLevel(i){
  if(!initRenderer()) return; if(!GB){ initGeo(); initTextures(); }
  disposeScene(); scene=new THREE.Scene(); BATCH=new Map(); PARTS=[]; W={col:[],upd:[],h:()=>0}; LI=i; L=LV[i];
  BUILD[i](); flush(); scene.add(cam); buildFX(); buildCover(); buildNav();
  UNITS=[]; PROJ=[]; GRENS=[]; DEFS=[]; NPCE={};
  const WP=WEAPONS[L.weapon];
  P={x:W.start[0],z:W.start[1],y:0,vy:0,on:true,hp:100,ammo:WP.mag,reloadT:0,fireT:0,meleeT:0,kick:0,ads:0,crouch:false,grenades:WP.grenades||0,stepT:0,swing:0,dead:false};
  P.y=H(P.x,P.z); yaw=Math.PI; pitch=0; recoilOff=0;
  G={score:0,kills:0,heads:0,shots:0,hits:0,par:new Set(),t:0,objDone:0,done:false,cp:{x:P.x,z:P.z},flagDown:false,deaths:0};
  // PNJ historiques
  for(const [k,x,z,ry,mounted] of W.npcs){ const d=NPC[k]; const g=new THREE.Group(); const h=human(d.look); let hs=null; if(mounted){ hs=horse(0xd8d4cc,0x8a8a8a); g.add(hs); h.position.y=RIDE_Y; } g.add(h); g.position.set(x,H(x,z),z); g.rotation.y=ry; scene.add(g);
    colCirc(x,z,mounted?1:.45,H(x,z),H(x,z)+2); NPCE[k]={key:k,m:g,h,x,z,y:H(x,z),name:d.name,role:d.role,mounted}; }
  // alliés
  for(const [t,x,z] of W.allies) makeUnit(t,"A",x,z);
  // parchemins
  W.parchE=W.parch.map(([x,z],k)=>{ const g=new THREE.Group(); const r=M(gcyl(10),0xf1e3bd,{tex:"cloth"}); r.scale.set(.13,.6,.13); r.rotation.z=Math.PI/2; r.position.y=1; g.add(r); const s=M(GS,0xb83a2e); s.scale.set(.08,.08,.08); s.position.set(0,1,.14); g.add(s);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.6,.8,24),mat(0xffe08a,{basic:true,side:1,op:.5})); ring.rotation.x=-Math.PI/2; ring.position.y=.06; g.add(ring); g.position.set(x,H(x,z),z); scene.add(g); return {x,z,g,k,taken:false}; });
  // marqueur d'objectif
  W.marker=new THREE.Group(); { const beam=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,30,10,1,true),new THREE.MeshBasicMaterial({color:0xffc860,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide})); beam.position.y=15; W.marker.add(beam);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.1,32),mat(0xffc860,{basic:true,side:1,op:.6})); ring.rotation.x=-Math.PI/2; ring.position.y=.08; W.marker.add(ring); W.marker.userData.ring=ring; scene.add(W.marker); W.marker.visible=false; }
  W.zone=new THREE.Mesh(new THREE.RingGeometry(.97,1,64),mat(0xffc860,{basic:true,side:1,op:.55})); W.zone.rotation.x=-Math.PI/2; W.zone.visible=false; scene.add(W.zone);
  W.ambT=3; W.fogLift=null;
  if(VM) cam.remove(VM); VM=viewModel(L.weapon); cam.add(VM); cam.fov=72; cam.updateProjectionMatrix();
  $("home").hidden=true; $("play").hidden=false; $("ov").hidden=true; resize(); window.scrollTo({top:0});
  $("tGren").hidden=!WP.grenades; ac(); startWind(LI===3?.08:.05);
  OBJ=null; hud(); playCine(W.cine,()=>{ begin(); });
  cancelAnimationFrame(raf); last=performance.now(); raf=requestAnimationFrame(loop);
}
function begin(){ running=true; startObjective(0); lockPointer(); last=performance.now(); }
function toMenu(){ running=false; CINE=null; $("game").classList.remove("cine"); cancelAnimationFrame(raf); unlock(); $("play").hidden=true; $("home").hidden=false; renderCamp(); }
function overlay(h){ $("ov").innerHTML=h; $("ov").hidden=false; }

/* ================= COUVERTS ================= */
function buildCover(){ COVER=[]; const add=(x,z)=>{ if(Math.abs(x)>W.lim||Math.abs(z)>W.lim) return; for(const c of W.col) if(!c.nolos&&inside(c,x,z,.15)) return; COVER.push({x,z,occ:null}); };
  for(const c of W.col){ if(c.nolos||c.tree) continue; const h=c.top-H(c.cx,c.cz); if(h<.95) continue;
    if(c.circ){ if(c.r<.6) continue; for(let k=0;k<8;k++){ const a=k/8*TAU; add(c.cx+Math.cos(a)*(c.r+.7),c.cz+Math.sin(a)*(c.r+.7)); } }
    else { for(const [sx,sz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const len=sx?c.hz:c.hx, n=Math.max(1,Math.floor(len*2/2.4)); for(let i=0;i<n;i++){ const tl=(i+.5)/n*2-1; const lx=sx?sx*(c.hx+.7):tl*len, lz=sz?sz*(c.hz+.7):tl*len;
      add(c.cx+lx*c.c+lz*c.s,c.cz-lx*c.s+lz*c.c); } } } }
}
function blockedLOS(x0,y0,z0,x1,y1,z1){ const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/.6); for(let i=1;i<n;i++){ const t=i/n, x=lerp(x0,x1,t), y=lerp(y0,y1,t), z=lerp(z0,z1,t);
  if(y<H(x,z)) return true; for(const c of W.col){ if(c.off||c.nolos||c.top<y||c.bot>y) continue; if(c.circ&&c.r<.5) continue; if(inside(c,x,z)) return true; } } return false; }
function findCover(u,t,range){ const cand=[]; for(const c of COVER){ if(c.occ&&c.occ!==u) continue; const du=Math.hypot(c.x-u.x,c.z-u.z); if(du>30) continue; const dt=Math.hypot(c.x-t.x,c.z-t.z); if(dt<6||dt>range*.85) continue; cand.push([du,c,dt]); }
  cand.sort((a,b)=>a[0]-b[0]); let best=null,bc=1e9; const ty=t.y+1.2;
  for(const [du,c,dt] of cand.slice(0,14)){ const gy=H(c.x,c.z); if(!blockedLOS(t.x,ty,t.z,c.x,gy+.9,c.z)) continue; if(du>2&&blockedLOS(u.x,u.y+.6,u.z,c.x,gy+.6,c.z)) continue; const peek=!blockedLOS(c.x,gy+1.6,c.z,t.x,ty,t.z);
    const cost=du+Math.abs(dt-15)*.4+(peek?0:5); if(cost<bc){ bc=cost; best=c; } }
  return best; }


/* ================= NAVIGATION (grille + A*) ================= */
const CS=1.5; let NAV=null, navBudget=0;
function buildNav(){ const ext=W.lim+14, n=Math.ceil(ext*2/CS); const bl=new Uint8Array(n*n);
  for(let j=0;j<n;j++) for(let i=0;i<n;i++){ const x=-ext+(i+.5)*CS, z=-ext+(j+.5)*CS, g=H(x,z); for(const c of W.col){ if(c.off||c.top-g<.6||(c.circ&&c.r<.5)) continue; if(inside(c,x,z,.42)){ bl[j*n+i]=1; break; } } }
  NAV={n,ext,bl}; }
const cellOf=(x,z)=>[clamp(Math.floor((x+NAV.ext)/CS),0,NAV.n-1),clamp(Math.floor((z+NAV.ext)/CS),0,NAV.n-1)];
const cellPos=(i,j)=>[-NAV.ext+(i+.5)*CS,-NAV.ext+(j+.5)*CS];
function freeLine(x0,z0,x1,z1){ const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/(CS*.5)); for(let k=1;k<=n;k++){ const [i,j]=cellOf(lerp(x0,x1,k/n),lerp(z0,z1,k/n)); if(NAV.bl[j*NAV.n+i]) return false; } return true; }
function nearestFree(i,j){ const n=NAV.n; if(!NAV.bl[j*n+i]) return [i,j]; for(let r=1;r<8;r++) for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){ const a=i+di,b=j+dj; if(a<0||b<0||a>=n||b>=n) continue; if(!NAV.bl[b*n+a]) return [a,b]; } return [i,j]; }
function astar(x0,z0,x1,z1){ const n=NAV.n, bl=NAV.bl; let [si,sj]=nearestFree(...cellOf(x0,z0)), [ti,tj]=nearestFree(...cellOf(x1,z1)); const S=sj*n+si, Tg=tj*n+ti; if(S===Tg) return [[x1,z1]];
  const g=new Float32Array(n*n).fill(1e9), came=new Int32Array(n*n).fill(-1), closed=new Uint8Array(n*n); const heap=[]; const hf=(k)=>{ const i=k%n, j=(k/n)|0; const dx=Math.abs(i-ti), dz=Math.abs(j-tj); return Math.max(dx,dz)+.414*Math.min(dx,dz); };
  const push=(k,f)=>{ heap.push([f,k]); let c=heap.length-1; while(c>0){ const p=(c-1)>>1; if(heap[p][0]<=heap[c][0]) break; [heap[p],heap[c]]=[heap[c],heap[p]]; c=p; } };
  const pop=()=>{ const top=heap[0], l=heap.pop(); if(heap.length){ heap[0]=l; let c=0; for(;;){ const a=2*c+1, b=a+1; let m=c; if(a<heap.length&&heap[a][0]<heap[m][0]) m=a; if(b<heap.length&&heap[b][0]<heap[m][0]) m=b; if(m===c) break; [heap[m],heap[c]]=[heap[c],heap[m]]; c=m; } } return top; };
  g[S]=0; push(S,hf(S)); let it=0;
  while(heap.length&&it++<9000){ const [,k]=pop(); if(k===Tg) break; if(closed[k]) continue; closed[k]=1; const i=k%n, j=(k/n)|0;
    for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ if(!di&&!dj) continue; const a=i+di, b=j+dj; if(a<0||b<0||a>=n||b>=n) continue; const nk=b*n+a; if(bl[nk]) continue; if(di&&dj&&(bl[j*n+a]||bl[b*n+i])) continue;
      const ng=g[k]+(di&&dj?1.414:1); if(ng<g[nk]){ g[nk]=ng; came[nk]=k; push(nk,ng+hf(nk)); } } }
  if(came[Tg]<0) return null; const pts=[]; let k=Tg; while(k!==S&&k>=0){ pts.push(cellPos(k%n,(k/n)|0)); k=came[k]; } pts.reverse(); pts[pts.length-1]=[x1,z1];
  // lissage
  const out=[]; let cx=x0, cz=z0, idx=0; while(idx<pts.length){ let best=idx; for(let m=Math.min(pts.length-1,idx+10);m>idx;m--){ if(freeLine(cx,cz,pts[m][0],pts[m][1])){ best=m; break; } } out.push(pts[best]); cx=pts[best][0]; cz=pts[best][1]; idx=best+1; }
  return out; }
function steer(u,px,pz){ // renvoie la direction vers (px,pz) en contournant les obstacles
  if(freeLine(u.x,u.z,px,pz)){ u.path=null; return [px,pz]; }
  const goalMoved=!u.pathGoal||Math.hypot(u.pathGoal[0]-px,u.pathGoal[1]-pz)>4;
  if((!u.path||goalMoved||T-u.pathT>2.5)&&navBudget>0){ navBudget--; u.path=astar(u.x,u.z,px,pz); u.pathGoal=[px,pz]; u.pathT=T; u.pi=0; }
  if(u.path&&u.path.length){ while(u.pi<u.path.length-1&&Math.hypot(u.path[u.pi][0]-u.x,u.path[u.pi][1]-u.z)<1) u.pi++; return u.path[u.pi]; }
  return [px,pz]; }

/* ================= UNITÉS ================= */
function makeUnit(type,team,x,z,o={}){ const def=CAT[LI][type]; const g=new THREE.Group(); const hm=human(def.look); let hs=null;
  if(def.cav){ hs=horse(def.cav.color,0x1a1a1a,def.cav.barding); g.add(hs); hm.position.y=RIDE_Y; } g.add(hm);
  const y=H(x,z); g.position.set(x,y,z); scene.add(g);
  const u={id:++uidN,type,def,team,m:g,h:hm,horse:hs,x,z,y,ry:team==="A"?0:Math.PI,hp:def.hp,maxhp:def.hp,cd:rnd(.8,2.2),atk:0,hitT:0,dead:false,deadT:0,stagger:0,think:rnd(0,.4),cover:null,crouch:false,peekT:rnd(.5,1.5),aimT:0,burst:0,
    tgt:null,sees:false,flank:rnd(-1,1),tag:o.tag,obj:o.obj,flee:0,gT:rnd(5,9),grenades:def.grenades||0,lastSeen:0,detour:0,stuck:0,vx:0,vz:0,dest:null,heading:team==="A"?0:Math.PI,hitCD:{}};
  UNITS.push(u); return u; }
function freeChar(u){ const h=u.h; if(!h) return; h.userData.mixer.stopAllAction(); h.userData.mixer.uncacheRoot(h.userData.root); h.traverse(o=>{ if(o.isSkinnedMesh) o.skeleton.dispose(); }); }
function aliveB(){ return UNITS.filter(u=>u.team==="B"&&!u.dead); }
function ent(u){ return u; }
function chooseTarget(u){ let best=null, bd=1e9;
  if(u.team==="B"){ if(!P.dead){ const d=Math.hypot(P.x-u.x,P.z-u.z)*.8; if(d<bd){ bd=d; best=P; } }
    for(const a of UNITS){ if(a.team!=="A"||a.dead) continue; const d=Math.hypot(a.x-u.x,a.z-u.z); if(d<bd){ bd=d; best=a; } }
    for(const d0 of DEFS){ if(d0.hp<=0) continue; const d=Math.hypot(d0.x-u.x,d0.z-u.z)*(u.def.cav?.5:.6); if(d<bd){ bd=d; best=d0; } } }
  else { for(const b of UNITS){ if(b.team!=="B"||b.dead) continue; const d=Math.hypot(b.x-u.x,b.z-u.z)+(Math.hypot(b.x-P.x,b.z-P.z)>28?30:0); if(d<bd){ bd=d; best=b; } } if(bd>45) best=null; }
  return best; }
const PR=.35, STEP=.5;
function groundAt(x,z,y){ let g=H(x,z); for(const c of W.col){ if(c.off||c.nolos) continue; if(c.top<=y+STEP&&c.top>g&&inside(c,x,z,-.02)) g=c.top; } return g; }
function solve(e,r,y,h=1.7){ for(let it=0;it<2;it++) for(const c of W.col){ if(c.off||c.top<=y+STEP||c.bot>y+h) continue; const dx=e.x-c.cx, dz=e.z-c.cz;
  if(c.circ){ const d=Math.hypot(dx,dz), m=c.r+r; if(d<m&&d>1e-6){ e.x=c.cx+dx/d*m; e.z=c.cz+dz/d*m; } continue; }
  const lx=dx*c.c-dz*c.s, lz=dx*c.s+dz*c.c, qx=clamp(lx,-c.hx,c.hx), qz=clamp(lz,-c.hz,c.hz); let ex=lx-qx, ez=lz-qz, d=Math.hypot(ex,ez);
  if(d<r){ let nx,nz; if(d<1e-6){ const px=c.hx-Math.abs(lx), pz=c.hz-Math.abs(lz); if(px<pz){ nx=Math.sign(lx)||1; nz=0; d=-px; } else { nx=0; nz=Math.sign(lz)||1; d=-pz; } } else { nx=ex/d; nz=ez/d; }
    const push=r-d; e.x+=(nx*c.c+nz*c.s)*push; e.z+=(-nx*c.s+nz*c.c)*push; } } }
function tgtY(t){ return t===P?P.y+(P.crouch?.75:1.15):t.isDef?t.y+1:t.y+(t.crouch?.75:1.15); }
const FORM=[[-2.2,-2.5],[2.2,-2.5],[-4.4,-3.5],[4.4,-3.5],[-1.2,-5],[1.2,-5]];

function unitFire(u,t){ const R0=u.def.ranged, d=Math.hypot(t.x-u.x,t.z-u.z); const oy=u.y+(u.def.cav?2.6:1.45);
  const ox=u.x+Math.sin(u.ry)*.6, oz=u.z+Math.cos(u.ry)*.6; let inacc=R0.inacc*(.4+d/20)*(u.team==="B"&&G.flagDown?1.35:1)*(t===P&&P.crouch?1.25:1)*(t===P&&(Math.abs(inp.x)+Math.abs(inp.y)+(keys.f||keys.b||keys.l||keys.r?1:0))>0?1.2:1);
  const tx=t.x+rnd(-1,1)*inacc*.6, ty=tgtY(t)+rnd(-.7,.7)*inacc*.45, tz=t.z+rnd(-1,1)*inacc*.6;
  const dir=new THREE.Vector3(tx-ox,ty-oy+(R0.grav?d*d*R0.grav/(2*R0.speed*R0.speed):0),tz-oz).normalize();
  spawnProj(ox,oy,oz,dir,R0.speed,R0.grav||0,R0.dmg,u.team,R0.proj,u); SND[R0.snd]&&(u.team==="B"||Math.random()<.5)&&SND[R0.snd]();
  if(R0.smoke) puff(ox+dir.x*.8,oy+dir.y*.8,oz+dir.z*.8,0xdddddd,5,.3,.6); if(R0.proj==="tracer") sparks(ox+dir.x*.8,oy,oz+dir.z*.8,2); }

function updateUnit(u,dt){
  const y=H(u.x,u.z); u.y=y;
  if(u.dead){ u.deadT+=dt; const k=Math.min(1,u.deadT*2.6); charDie(u.h,dt); u.h.position.y=u.def.cav?RIDE_Y*(1-k):0; if(u.horse){ u.horse.rotation.z=k*1.4; u.horse.position.y=-k*.3; } u.m.position.set(u.x,y,u.z); if(u.deadT>9){ u.m.visible=false; u.gone=true; } return; }
  u.stagger=Math.max(0,u.stagger-dt); u.cd-=dt; u.atk=Math.max(0,u.atk-dt); u.gT-=dt; u.think-=dt; if(u.hitT>0){ u.hitT-=dt; if(u.hitT<=0) meleeHit(u); }
  if(u.think<=0){ u.think=rnd(.35,.6); u.tgt=chooseTarget(u); if(u.tgt){ u.sees=!blockedLOS(u.x,y+(u.crouch?.95:1.55),u.z,u.tgt.x,tgtY(u.tgt),u.tgt.z); if(u.sees) u.lastSeen=0; } else u.sees=false;
    if(u.team==="B"&&OBJ&&(OBJ.def.t==="wave"||OBJ.def.t==="clear"||OBJ.def.t==="kill")&&OBJ.q.every(g=>g.left<=0)&&aliveB().length<=3){ if(u.cover){ u.cover.occ=null; u.cover=null; } u.last3=true; }
    if(u.def.ranged&&u.team==="B"&&u.tgt&&!u.flee&&!u.last3){ const c=u.cover; const R0=u.def.ranged; let ok=false; if(c){ const dt2=Math.hypot(c.x-u.tgt.x,c.z-u.tgt.z); ok=dt2>5&&dt2<R0.range*.9&&blockedLOS(u.tgt.x,tgtY(u.tgt),u.tgt.z,c.x,H(c.x,c.z)+.9,c.z); }
      if(c&&u.covT>7) ok=false;
      if(!ok&&Math.random()<.6){ if(c) c.occ=null; u.cover=findCover(u,u.tgt,R0.range); u.covT=0; if(u.cover) u.cover.occ=u; } } }
  u.lastSeen+=dt;
  const t=u.tgt, def=u.def; let mx=0, mz=0, sp=0, face=null; u.crouch=false; let animO={};
  const via=null;
  const goTo=(px,pz,s)=>{ const w=steer(u,px,pz); let dx=w[0]-u.x, dz=w[1]-u.z; const d=Math.hypot(dx,dz)||1; mx=dx/d; mz=dz/d; sp=s; };
  if(u.flee>0){ u.flee-=dt; const dx=u.x-P.x, dz=u.z-P.z, d=Math.hypot(dx,dz)||1; mx=dx/d; mz=dz/d; sp=def.spd*1.2; if(u.rout&&d>48){ u.dead=true; u.gone=true; u.m.visible=false; if(u.cover) u.cover.occ=null; return; } }
  else if(def.cav){ // cavalerie : charges successives
    if(t){ if(!u.dest||Math.hypot(u.dest[0]-u.x,u.dest[1]-u.z)<3){ const dx=t.x-u.x, dz=t.z-u.z, d=Math.hypot(dx,dz)||1; u.dest=[clamp(t.x+dx/d*18,-W.lim,W.lim),clamp(t.z+dz/d*18,-W.lim,W.lim)]; if(u.team==="B") SND.horse(); }
      const wp=steer(u,u.dest[0],u.dest[1]); const want=Math.atan2(wp[0]-u.x,wp[1]-u.z); u.heading+=clamp(angDiff(want,u.heading),-2.2*dt,2.2*dt); mx=Math.sin(u.heading); mz=Math.cos(u.heading); sp=def.spd*(u.stagger>0?.4:1);
      // piétinement
      const victims=u.team==="B"?[P,...UNITS.filter(a=>a.team==="A"&&!a.dead),...DEFS.filter(d=>d.hp>0&&d.isNpc)]:UNITS.filter(b=>b.team==="B"&&!b.dead);
      for(const v of victims){ if(v===P&&P.dead) continue; const dd=Math.hypot(v.x-u.x,v.z-u.z); const k=v===P?"p":(v.id||v.key); if(dd<2&&!(u.hitCD[k]>T)){ u.hitCD[k]=T+1.4; u.atk=.5; if(v===P) hurtPlayer(def.melee.dmg,u.x,u.z,true); else if(v.isDef) v.hp-=def.melee.dmg; else damageUnit(v,def.melee.dmg,false,new THREE.Vector3(mx,0,mz),null); } } }
  }
  else if(!t){ if(u.team==="A"){ const f=FORM[(u.id)%FORM.length], c=Math.cos(yaw), s=Math.sin(yaw); const tx=P.x+f[0]*c-f[1]*s, tz=P.z-f[0]*s-f[1]*c; if(Math.hypot(tx-u.x,tz-u.z)>1.5) goTo(tx,tz,Math.hypot(tx-u.x,tz-u.z)>6?def.spd*1.3:def.spd*.8); } }
  else { const dx=t.x-u.x, dz=t.z-u.z, d=Math.hypot(dx,dz)||1;
    const melee=def.melee&&(!def.ranged||d<3.2);
    if(def.flag&&!def.melee){ // porte-étendard : suit ses compagnons à distance
      if(d>14) goTo(t.x,t.z,def.spd*.9); face=Math.atan2(dx,dz); }
    else if(melee){ const reach=def.melee.reach;
      if(d>reach*.8){ if(d>8){ const px=-dz/d, pz=dx/d, off=u.flank*Math.min(d*.35,7); goTo(t.x+px*off,t.z+pz*off,def.spd*(u.stagger>0?.3:1)); } else goTo(t.x,t.z,def.spd*1.25*(u.stagger>0?.3:1)); }
      face=Math.atan2(dx,dz);
      if(d<reach&&u.cd<=0&&u.stagger<=0){ u.cd=def.melee.cd*rnd(.9,1.25); u.atk=.55; u.hitT=.28; u.hitTgt=t; if(Math.random()<.4) SND.clash(); }
      animO=def.look.weapon==="pike"||def.look.weapon==="spear"||def.look.weapon==="musket"?{thrust:u.atk>0?Math.sin((.55-u.atk)/.55*Math.PI):null}:{swing:u.atk>0?u.atk*1.8:null}; }
    else if(def.ranged){ const R0=def.ranged; face=Math.atan2(dx,dz);
      if(u.team==="B"&&u.cover&&Math.hypot(u.cover.x-u.x,u.cover.z-u.z)>.7){ goTo(u.cover.x,u.cover.z,def.spd*1.25); face=null; u.covT=(u.covT||0)+dt; }
      else if(u.team==="B"&&u.cover){ // à couvert : se lever, viser, tirer, se baisser
        if(u.aimT>0){ u.aimT-=dt; animO={aim:true}; if(u.aimT<=0){ if(!blockedLOS(u.x,u.y+1.55,u.z,t.x,tgtY(t),t.z)) fireOrBurst(u,t); u.peekT=rnd(1.3,2.8); } }
        else if(u.burst>0){ animO={aim:true}; burstStep(u,t,dt); }
        else { u.crouch=true; u.peekT-=dt; if(u.peekT<=0&&u.cd<=0){ u.aimT=rnd(.45,.75); } } }
      else { // sans couvert
        if(!u.sees||d>R0.range*(u.last3?.45:.8)){ goTo(t.x,t.z,def.spd*(u.last3?1.2:1)); face=null; }
        else { if(u.team==="A"&&Math.hypot(P.x-u.x,P.z-u.z)>14) goTo(P.x,P.z,def.spd); else { const px=-dz/d, pz=dx/d; mx=px*u.flank; mz=pz*u.flank; sp=.7; if(Math.random()<dt*.25) u.flank*=-1; }
          if(u.burst>0){ animO={aim:true}; burstStep(u,t,dt); }
          else if(u.cd<=0){ if(u.aimT<=0) u.aimT=rnd(.4,.7); u.aimT-=dt; animO={aim:true}; if(u.aimT<=0) fireOrBurst(u,t); } } }
      if(u.grenades>0&&t===P&&u.lastSeen>2.2&&d>8&&d<26&&u.gT<=0){ u.gT=rnd(9,13); u.grenades--; throwGrenade(u.x,u.y+1.6,u.z,P.x,P.z,"B"); } } }
  // déplacement
  if(def.flag&&!t&&u.team==="B"){ }
  if(u.detour>0){ u.detour-=dt; const s=u.dside||1; const nx=-mz*s, nz=mx*s; mx=mx*.3+nx; mz=mz*.3+nz; const l=Math.hypot(mx,mz)||1; mx/=l; mz/=l; }
  const px0=u.x, pz0=u.z; u.x+=mx*sp*dt; u.z+=mz*sp*dt;
  for(const o of UNITS){ if(o===u||o.dead) continue; const sx=u.x-o.x, sz=u.z-o.z, sd=Math.hypot(sx,sz), m=(u.def.cav||o.def.cav)?1.6:.85; if(sd<m&&sd>1e-4){ u.x+=sx/sd*(m-sd)*.5; u.z+=sz/sd*(m-sd)*.5; } }
  solve(u,def.cav?.9:.4,y); u.x=clamp(u.x,-W.lim-25,W.lim+25); u.z=clamp(u.z,-W.lim-25,W.lim+25);
  if(sp>1){ const moved=Math.hypot(u.x-px0,u.z-pz0); u.stuck=moved<sp*dt*.35?u.stuck+dt:0; if(u.stuck>.45&&!(u.detour>0)){ u.detour=1.3; u.dside=Math.random()<.5?1:-1; u.stuck=0; } }
  const mv=Math.hypot(u.x-px0,u.z-pz0)/Math.max(dt,1e-4);
  const wantRy=face!=null?face:(mv>.3?Math.atan2(u.x-px0,u.z-pz0):u.ry); u.ry+=angDiff(wantRy,u.ry)*Math.min(1,dt*(def.cav?4:8));
  u.m.position.set(u.x,H(u.x,u.z),u.z); u.m.rotation.y=u.ry;
  if(u.horse){ animHorse(u.horse,mv,dt); animHuman(u.h,0,T,dt,{ride:true,swing:u.atk>0?u.atk*1.8:null}); }
  else animHuman(u.h,mv,T,dt,{crouch:u.crouch,...animO,lean:u.stagger>0?-.25:0});
}
function fireOrBurst(u,t){ const R0=u.def.ranged; if(R0.burst){ u.burst=R0.burst; u.burstT=0; } else { unitFire(u,t); u.cd=rnd(...R0.cd)*(u.team==="B"&&G.flagDown?1.3:1); } }
function burstStep(u,t,dt){ const R0=u.def.ranged; u.burstT-=dt; if(u.burstT<=0){ unitFire(u,t); u.burst--; u.burstT=rnd(...R0.cd); if(u.burst<=0){ u.cd=rnd(...R0.pause); u.peekT=rnd(1.2,2.4); } } }
function meleeHit(u){ const t=u.hitTgt; if(!t||u.dead) return; const reach=u.def.melee.reach+.5;
  if(t===P){ if(!P.dead&&Math.hypot(P.x-u.x,P.z-u.z)<reach) hurtPlayer(u.def.melee.dmg*(G.flagDown&&u.team==="B"?.85:1),u.x,u.z); }
  else if(t.isDef){ if(t.hp>0&&Math.hypot(t.x-u.x,t.z-u.z)<reach+1) t.hp-=u.def.melee.dmg; }
  else if(!t.dead&&Math.hypot(t.x-u.x,t.z-u.z)<reach){ const dir=new THREE.Vector3(t.x-u.x,0,t.z-u.z).normalize(); if(t.def.shield&&Math.random()<.3) { sparks(t.x,t.y+1.2,t.z,4); } else damageUnit(t,u.def.melee.dmg,false,dir,null); } }

function damageUnit(u,dmg,head,dir,byPlayer){ if(u.dead) return; u.hp-=dmg*(head?2:1); u.stagger=.35; if(dir){ u.x+=dir.x*.25; u.z+=dir.z*.25; }
  if(byPlayer){ G.hits++; hitMark(false); head?SND.head():SND.hit(); }
  if(u.hp<=0) killUnit(u,dir,byPlayer,head); }
function killUnit(u,dir,byPlayer,head){ u.dead=true; u.deadT=0; if(u.cover){ u.cover.occ=null; u.cover=null; } const fy=dir?Math.atan2(dir.x,dir.z):u.ry; u.m.rotation.y=fy; u.ry=fy;
  puff(u.x,u.y+.5,u.z,0xb8a890,5,.3,.8);
  if(u.team==="B"){ if(byPlayer){ G.kills++; if(head) G.heads++; let pts=100+(head?50:0); if(u.def.officer||u.def.flag) pts+=300; G.score+=pts; hitMark(true); SND.kill(); feed(`${u.def.name||"Ennemi"} abattu${head?" · à la tête":""} +${pts}`); }
    if(u.def.officer){ center(`${u.def.name} est tombé !`,2000); for(const o of UNITS) if(o.team==="B"&&!o.dead&&Math.hypot(o.x-u.x,o.z-u.z)<22) o.flee=4; }
    if(u.def.flag){ G.flagDown=true; center("L'étendard ennemi est tombé !",2000); feed("Les ennemis faiblissent"); }
    if(Math.random()<.18) dropFood(u.x,u.z); }
  else { feed("Un compagnon est tombé"); }
  hud(); }
let FOOD=[];
function dropFood(x,z){ const g=new THREE.Group(); const b=M(GS,0xc8954a); b.scale.set(.35,.2,.22); b.position.y=.4; g.add(b); const ring=new THREE.Mesh(new THREE.RingGeometry(.45,.6,20),mat(0x74c48a,{basic:true,side:1,op:.6})); ring.rotation.x=-Math.PI/2; ring.position.y=.05; g.add(ring); g.position.set(x,H(x,z),z); scene.add(g); FOOD.push({x,z,g}); }

/* ================= PROJECTILES, GRENADES, EXPLOSIONS ================= */
const PGEO={};
function projMesh(kind){ let m;
  if(kind==="axe"){ m=new THREE.Group(); const h=new THREE.Mesh(GB,mat(0x6a4a2a,{tex:"wood"})); h.scale.set(.05,.5,.05); m.add(h); const b=new THREE.Mesh(GB,mat(0xb0b4b8,{tex:"metal"})); b.scale.set(.04,.18,.2); b.position.set(0,.2,.1); m.add(b); }
  else if(kind==="bolt"||kind==="arrow"){ m=new THREE.Mesh(GB,mat(kind==="bolt"?0x4a3a2a:0x8a6a3a)); m.scale.set(.03,.03,kind==="bolt"?.45:.75); }
  else if(kind==="ball"){ m=new THREE.Mesh(GS,mat(0x2a2a2a)); m.scale.set(.05,.05,.05); }
  else { m=new THREE.Mesh(GB,mat(0xffdd88,{basic:true})); m.scale.set(.025,.025,1.1); }
  scene.add(m); return m; }
function spawnProj(x,y,z,dir,speed,grav,dmg,team,kind,src){ PROJ.push({x,y,z,vx:dir.x*speed,vy:dir.y*speed,vz:dir.z*speed,g:grav,dmg,team,kind,m:projMesh(kind),t:0,src}); }
function segSphere(ax,ay,az,bx,by,bz,cx,cy,cz,r){ const dx=bx-ax, dy=by-ay, dz=bz-az, L2=dx*dx+dy*dy+dz*dz||1e-9; let t=((cx-ax)*dx+(cy-ay)*dy+(cz-az)*dz)/L2; t=clamp(t,0,1); const px=ax+dx*t-cx, py=ay+dy*t-cy, pz=az+dz*t-cz; return px*px+py*py+pz*pz<r*r; }
function stepProj(dt){
  for(const p of PROJ){ if(p.dead) continue; p.t+=dt; const ox=p.x, oy=p.y, oz=p.z; p.vy-=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt; p.m.position.set(p.x,p.y,p.z); p.m.lookAt(p.x+p.vx,p.y+p.vy,p.z+p.vz); if(p.kind==="axe") p.m.rotateX(p.t*20);
    const dir=new THREE.Vector3(p.vx,0,p.vz).normalize();
    for(const u of UNITS){ if(u.dead||u.team===p.team) continue; const cav=u.def.cav, hy=u.y+(cav?2.85:(u.crouch?1.05:1.62)), by=u.y+(cav?2.15:(u.crouch?.55:1.02));
      let head=segSphere(ox,oy,oz,p.x,p.y,p.z,u.x,hy,u.z,.34), body=!head&&(segSphere(ox,oy,oz,p.x,p.y,p.z,u.x,by,u.z,.46)||(!u.crouch&&segSphere(ox,oy,oz,p.x,p.y,p.z,u.x,u.y+.42,u.z,.36))||(cav&&segSphere(ox,oy,oz,p.x,p.y,p.z,u.x,u.y+1.3,u.z,.85)));
      if(head||body){ p.dead=true; const fwd=new THREE.Vector3(Math.sin(u.ry),0,Math.cos(u.ry));
        if(u.def.shield&&!head&&dir.dot(fwd)<-.45&&Math.random()<.55){ sparks(p.x,p.y,p.z,8); if(p.team==="A"&&p.src===P) SND.block(); if(p.src===P) feed("Paré par le bouclier"); break; }
        damageUnit(u,p.dmg,head,dir,p.src===P); puff(p.x,p.y,p.z,0x9a8a7a,3,.12,.5); break; } }
    if(!p.dead&&p.team==="B"){ if(!P.dead&&(segSphere(ox,oy,oz,p.x,p.y,p.z,P.x,P.y+(P.crouch?.7:1.05),P.z,P.crouch?.45:.5)||(!P.crouch&&segSphere(ox,oy,oz,p.x,p.y,p.z,P.x,P.y+1.6,P.z,.25)))){ hurtPlayer(p.dmg,p.x-p.vx,p.z-p.vz); p.dead=true; }
      for(const d of DEFS){ if(!p.dead&&d.hp>0&&segSphere(ox,oy,oz,p.x,p.y,p.z,d.x,d.y+1,d.z,1.1)){ d.hp-=p.dmg; p.dead=true; } } }
    if(!p.dead){ if(p.y<H(p.x,p.z)){ p.dead=true; puff(p.x,p.y+.1,p.z,0x8a7a62,3,.15,.6); }
      else for(const c of W.col){ if(c.off||c.nolos||c.top<p.y||c.bot>p.y) continue; if(c.circ&&c.r<.5) continue; if(inside(c,p.x,p.z)){ p.dead=true; if(p.kind==="tracer"||p.kind==="ball") sparks(p.x,p.y,p.z,3); puff(p.x,p.y,p.z,0xaaaaaa,2,.12,.5); break; } } }
    if(p.t>4) p.dead=true; if(p.dead) scene.remove(p.m); }
  PROJ=PROJ.filter(p=>!p.dead); }
function throwGrenade(x,y,z,tx,tz,team){ const d=Math.hypot(tx-x,tz-z), t=clamp(d/14,.6,1.6); const g=new THREE.Group(); const b=M(gcyl(8),team==="B"?0x4b5147:0x3a4a2a,{tex:"metal"}); b.scale.set(.06,.16,.06); g.add(b); if(team==="B"){ const hnd=M(gcyl(6),0x7a5a35); hnd.scale.set(.025,.3,.025); hnd.position.y=-.2; g.add(hnd); } g.position.set(x,y,z); scene.add(g);
  GRENS.push({x,y,z,vx:(tx-x)/t,vy:9*t*.55+2,vz:(tz-z)/t,fuse:3.2,m:g,team}); }
function stepGren(dt){ for(const g of GRENS){ g.fuse-=dt; g.vy-=16*dt; let nx=g.x+g.vx*dt, nz=g.z+g.vz*dt, ny=g.y+g.vy*dt; const gh=H(nx,nz);
    for(const c of W.col){ if(!c.off&&!c.nolos&&c.top>ny&&c.bot<ny&&inside(c,nx,nz,.05)){ g.vx*=-.35; g.vz*=-.35; nx=g.x; nz=g.z; break; } }
    if(ny<gh+.08){ ny=gh+.08; g.vy=Math.abs(g.vy)>2?-g.vy*.35:0; g.vx*=.6; g.vz*=.6; } g.x=nx; g.z=nz; g.y=ny; g.m.position.set(g.x,g.y,g.z); g.m.rotation.x+=dt*8;
    if(g.fuse<=0){ g.dead=true; scene.remove(g.m); explode(g.x,g.y,g.z,5.5,95,g.team); } }
  GRENS=GRENS.filter(g=>!g.dead); }
function explode(x,y,z,r,dmg,team,big=false){ SND.explo(); for(let i=0;i<(big?26:14);i++) particle(x,y+.5,z,{basic:true,color:pick([0xffa030,0xffd060,0xff6020]),s:rnd(.3,.7)*(big?1.6:1),vx:rnd(-4,4),vy:rnd(1,6),vz:rnd(-4,4),life:rnd(.25,.5),grow:2.5,op:.95});
  for(let i=0;i<(big?18:10);i++) particle(x,y+.5,z,{color:pick([0x3a3a3a,0x5a5a5a,0x777777]),s:rnd(.6,1.2)*(big?1.5:1),vx:rnd(-2.5,2.5),vy:rnd(1,4),vz:rnd(-2.5,2.5),life:rnd(1.5,3),grow:1.4,op:.7});
  for(let i=0;i<10;i++) particle(x,y+.3,z,{solid:true,color:0x5a4a3a,s:.12,vx:rnd(-7,7),vy:rnd(3,9),vz:rnd(-7,7),life:1.2,grow:0,g:16,op:1});
  const dP=Math.hypot(P.x-x,P.z-z); shake=Math.max(shake,clamp(1.2-dP/30,0,1)*(big?1.4:1));
  if(dP<r&&!P.dead&&team!=="A") hurtPlayer(dmg*(1-dP/r)*(team==="P"?.5:1),x,z,true);
  const fr=team==="P"?"A":team;
  for(const u of UNITS){ if(u.dead) continue; const d=Math.hypot(u.x-x,u.z-z); if(d<r) damageUnit(u,dmg*(1-d/r)*(u.team===fr?.3:1),false,new THREE.Vector3(u.x-x,0,u.z-z).normalize(),team==="P"&&u.team==="B"); }
  if(team==="B") for(const d0 of DEFS){ const d=Math.hypot(d0.x-x,d0.z-z); if(d<r) d0.hp-=dmg*(1-d/r); } }

/* ================= JOUEUR ================= */
function viewModel(w){ const g=new THREE.Group(); const p=(geo,c,sx,sy,sz,x,y,z,rx=0,ry=0,rz=0,tex,par=g)=>{ const m=new THREE.Mesh(geo,mat(c,{tex})); m.scale.set(sx,sy,sz); m.position.set(x,y,z); m.rotation.set(rx,ry,rz); par.add(m); return m; };
  const cz=(c,r,len,x,y,z,tex,par=g,seg=12)=>p(gcyl(seg),c,r,len,r,x,y,z,Math.PI/2,0,0,tex,par);
  const skin=0xe2b48e, sleeve={francisque:0x3a5a7a,arbalete:0x2b4aa0,arquebuse:0x8a2a2a,charleville:0x2b4aa0,sten:0x6b6b48}[w]||0x555555, U={};
  const WOOD=0x7a4a26, DWOOD=0x5a3418, STEEL=0x9aa0a6, IRON=0x3a3c40, BRASS=0xc8a050;
  const hand=(x,y,z,rx=0,par=g)=>{ const h=new THREE.Group(); h.position.set(x,y,z); h.rotation.x=rx; par.add(h); p(GS,skin,.05,.045,.07,0,0,0,0,0,0,null,h); for(let i=0;i<4;i++) p(gcyl(6),skin,.013,.06,.013,-.035+i*.023,.028,-.025,0,0,.15,null,h);
    p(gcyl(12),sleeve,.058,.34,.058,.012,-.05,.21,Math.PI/2-.3,0,0,"cloth",h); p(gcyl(12),shade(sleeve,.8),.062,.05,.062,.004,-.012,.06,Math.PI/2-.3,0,0,"cloth",h); return h; };
  if(w==="francisque"){ U.axe=new THREE.Group(); g.add(U.axe); cz(WOOD,.022,.58,0,-.02,-.16,"wood",U.axe,8);
    const hd=new THREE.Group(); hd.position.set(0,.03,-.42); U.axe.add(hd); p(GB,IRON,.034,.06,.06,0,0,0,0,0,0,"metal",hd); p(GB,STEEL,.024,.07,.1,0,.03,-.07,-.35,0,0,"metal",hd); p(GB,STEEL,.02,.15,.05,0,.06,-.13,.25,0,0,"metal",hd); p(GB,0xd8dde2,.022,.16,.012,0,.06,-.16,.25,0,0,"metal",hd); hand(0,-.05,.04); }
  if(w==="arbalete"){ p(GB,WOOD,.07,.075,.62,0,0,-.18,0,0,0,"wood"); p(GB,DWOOD,.065,.12,.22,0,-.04,.18,0,0,0,"wood"); p(GB,IRON,.075,.02,.1,0,.045,-.36,0,0,0,"metal");
    const span=Math.PI*.75, prod=new THREE.Mesh(new THREE.TorusGeometry(.45,.016,6,24,span),mat(0x4a4a4e,{tex:"metal"})); prod.rotation.set(-Math.PI/2,0,Math.PI/2-span/2); prod.position.set(0,.03,-.25); g.add(prod);
    const st=new THREE.Mesh(new THREE.TorusGeometry(.06,.01,5,12),mat(IRON,{tex:"metal"})); st.position.set(0,.02,-.55); st.rotation.x=Math.PI/2; g.add(st);
    U.string=p(GB,0xe8e0d0,.83,.006,.006,0,.035,-.42); U.bolt=p(GB,0x4a3a2a,.016,.016,.36,0,.06,-.36); p(gcone(5),STEEL,.018,.06,.018,0,.06,-.57,-Math.PI/2,0,0,"metal"); p(GB,IRON,.01,.04,.04,0,-.05,-.02,0,0,0,"metal");
    hand(0,-.06,.04); hand(-.01,-.05,-.32,.1); }
  if(w==="arquebuse"||w==="charleville"){ const ch=w==="charleville", L2=ch?1.12:.95;
    p(GB,WOOD,.068,.14,.3,0,-.05,.14,-.12,0,0,"wood"); p(GB,WOOD,.055,.07,.18,0,-.005,-.07,0,0,0,"wood"); p(GB,WOOD,.06,.06,L2*.72,0,.005,-.16-L2*.36,0,0,0,"wood");
    cz(IRON,.017,L2*.92,0,.042,-.08-L2*.46,"metal");
    if(ch){ for(const zz of [-.38,-.7,-1.0]) cz(STEEL,.036,.025,0,.025,zz,"metal"); p(GB,STEEL,.006,.015,.42,.028,.042,-1.36,0,0,0,"metal"); cz(STEEL,.022,.06,0,.042,-1.13,"metal",g,8);
      p(GB,STEEL,.008,.045,.13,.034,.02,-.12,0,0,0,"metal"); p(GB,IRON,.01,.055,.02,.036,.06,-.07,0,0,-.3,"metal"); p(GB,IRON,.008,.03,.03,.034,.06,-.15,0,0,0,"metal"); }
    else { p(GB,BRASS,.008,.04,.12,.03,.02,-.12,0,0,0,"metal"); const sp=p(GB,IRON,.01,.09,.015,.04,.045,-.09,0,0,.5,"metal");
      U.match=new THREE.Mesh(GS,new THREE.MeshBasicMaterial({color:0xff8a30,toneMapped:false})); U.match.scale.setScalar(.012); U.match.position.set(.055,.085,-.11); g.add(U.match); cz(0xb8a080,.005,.25,.04,-.02,.1,"cloth",g,5); }
    p(GB,IRON,.008,.03,.09,0,-.055,-.09,0,0,0,"metal");
    U.ramrod=cz(STEEL,.006,.72,0,-.035,-.6,"metal",g,5);
    hand(0,-.07,.03); hand(-.005,-.06,-.42,.12); }
  if(w==="sten"){ cz(0x2e3034,.034,.42,0,0,-.2,"metal"); cz(0x26282a,.038,.2,0,0,-.5,"metal"); cz(0x1c1c1e,.012,.1,0,0,-.65,"metal",g,8); p(GB,0x1c1c1e,.006,.03,.006,0,.045,-.58,0,0,0,"metal");
    U.mag=p(GB,0x1e1e20,.26,.05,.032,-.17,-.005,-.28,0,0,0,"metal"); p(GB,0x26282a,.04,.035,.06,-.045,0,-.28,0,0,0,"metal");
    p(gcyl(6),0x26282a,.01,.3,.01,0,-.01,.12,Math.PI/2+.08,0,0,"metal"); p(gcyl(6),0x26282a,.01,.25,.01,0,-.08,.14,Math.PI/2-.2,0,0,"metal"); p(GB,0x26282a,.02,.13,.02,0,-.06,.27,0,0,0,"metal");
    p(GB,0x26282a,.035,.07,.06,0,-.05,-.05,0,0,0,"metal"); p(GB,0x1c1c1e,.008,.025,.05,0,-.07,-.08,0,0,0,"metal"); p(GB,0x2e3034,.005,.02,.04,0,.04,-.08,0,0,0,"metal");
    hand(0,-.08,-.04); }
  const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:new THREE.Color(0xffc060).multiplyScalar(4),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,toneMapped:false})); fl.scale.setScalar(.38); fl.position.set(0,.04,w==="sten"?-.74:w==="arquebuse"?-1.0:-1.18); fl.visible=false; g.add(fl); U.flash=fl;
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=false; o.receiveShadow=false; } });
  g.userData=U; g.position.set(.26,-.24,-.42); g.scale.setScalar(.85); return g; }
const ADS_POS=new THREE.Vector3(0,-.15,-.36), HIP_POS=new THREE.Vector3(.26,-.24,-.42);
function playerShoot(){ const WP=WEAPONS[L.weapon]; if(P.reloadT>0||P.fireT>0||P.dead) return; if(P.ammo<=0){ SND.click(); startReload(); return; }
  P.ammo--; P.fireT=WP.rate; G.shots++; SND[WP.snd](); P.kick=1; recoilOff+=WP.recoil*(P.ads>.5?.6:1)*(P.crouch?.7:1); yaw+=rnd(-1,1)*WP.recoil*.25;
  if(WP.smoke||WP.auto){ flashLight.intensity=WP.auto?35:70; VM.userData.flash.visible=true; setTimeout(()=>{ if(VM) VM.userData.flash.visible=false; },50); }
  const d=new THREE.Vector3(); cam.getWorldDirection(d); const moving=(Math.abs(inp.x)+Math.abs(inp.y)+(keys.f||keys.b||keys.l||keys.r?1:0))>0;
  const sp=WP.spread*(P.ads>.5?.3:1)*(moving?1.7:1)*(P.crouch?.7:1); d.x+=rnd(-sp,sp); d.y+=rnd(-sp,sp); d.z+=rnd(-sp,sp); d.normalize();
  const o=cam.position.clone().addScaledVector(d,.5); o.y-=.04; spawnProj(o.x,o.y,o.z,d,WP.speed,WP.grav,WP.dmg,"A",WP.proj,P);
  if(WP.smoke) for(let i=0;i<8;i++) particle(o.x+d.x*1.2,o.y+d.y*1.2,o.z+d.z*1.2,{color:0xe0e0e0,s:rnd(.2,.4),vx:d.x*rnd(1,3)+rnd(-.5,.5),vy:rnd(.2,.8),vz:d.z*rnd(1,3)+rnd(-.5,.5),life:rnd(1.5,2.5),grow:1.3,op:.55});
  if(WP.mag===1) setTimeout(()=>{ if(G&&!G.done&&P.ammo===0) startReload(); },WP.proj==="axe"?40:280);
  hud(); }
function startReload(){ const WP=WEAPONS[L.weapon]; if(P.reloadT>0||P.ammo===WP.mag||P.dead) return; P.reloadT=WP.reload;
  if(WP.anim==="ramrod") setTimeout(()=>SND.ramrod(),WP.reload*300); else if(WP.anim==="span") SND.span(); else if(WP.anim==="mag") SND.reload(); hud(); }
function melee(){ if(P.meleeT>0||P.dead) return; const WP=WEAPONS[L.weapon]; P.meleeT=.65; P.swing=.35; SND.throw();
  const fx0=-Math.sin(yaw), fz0=-Math.cos(yaw); for(const u of UNITS){ if(u.dead||u.team!=="B") continue; const dx=u.x-P.x, dz=u.z-P.z, d=Math.hypot(dx,dz); if(d<2.5&&(dx*fx0+dz*fz0)/d>.55) damageUnit(u,WP.bayonet?110:70,false,new THREE.Vector3(dx/d,0,dz/d),true); } }
function playerGrenade(){ if(P.grenades<=0||P.dead) return; P.grenades--; const d=new THREE.Vector3(); cam.getWorldDirection(d); const tx=P.x+d.x*18, tz=P.z+d.z*18; throwGrenade(cam.position.x+d.x*.5,cam.position.y,cam.position.z+d.z*.5,tx,tz,"P"); SND.throw(); hud(); }
function hurtPlayer(d,fx,fz,big){ if(G.done||P.dead||CINE) return; P.hp-=d; SND.hurt(); $("vign").style.boxShadow="inset 0 0 140px 50px rgba(190,20,10,.55)"; setTimeout(()=>$("vign").style.boxShadow="inset 0 0 140px 50px rgba(190,20,10,0)",200);
  if(fx!=null){ const a=Math.atan2(fx-P.x,fz-P.z), h=Math.atan2(-Math.sin(yaw),-Math.cos(yaw)); const rel=angDiff(a,h); const arcs=$("dmgdir").children; const i=Math.floor(Math.random()*3); arcs[i].style.transform=`rotate(${rel}rad)`; arcs[i].style.opacity=1; setTimeout(()=>arcs[i].style.opacity=0,600); }
  if(big) shake=Math.max(shake,.5); hud(); if(P.hp<=0) playerDown(); }
function hitMark(kill){ const h=$("hitm"); h.className="hitm"+(kill?" kill":""); h.style.opacity=1; clearTimeout(h._t); h._t=setTimeout(()=>h.style.opacity=0,kill?260:120); }

/* ================= OBJECTIFS ================= */
function startObjective(i){ const def=W.obj[i]; OBJ={i,def,t:0,prog:0,q:[],contT:1.5,next:0,failed:false};
  G.cp={x:P.x,z:P.z}; G.flagDown=false;
  for(const g of def.groups||[]) OBJ.q.push({...g,left:g.n,delay:g.delay||0});
  DEFS=[]; if(def.npc){ const n=NPCE[def.npc]; DEFS.push({isDef:true,isNpc:true,key:def.npc,x:n.x,z:n.z,y:n.y,hp:400,maxhp:400,name:n.name}); }
  if(def.obj==="cannons") W.cannons.forEach((c,k)=>DEFS.push({isDef:true,key:"c"+k,x:c.position.x,z:c.position.z,y:c.position.y,hp:450,maxhp:450,name:"Canon",cannon:c,fireT:rnd(2,4)}));
  def.onStart&&def.onStart(); hud(); center(`Objectif ${i+1}/${W.obj.length}<small>${def.text}</small>`,2600); }
function spawnFromQueue(dt){ for(const g of OBJ.q){ if(g.left<=0) continue; g.delay-=dt; if(g.delay>0) continue;
    const k=g.n-g.left; let x=g.at[0]+rnd(-3,3), z=g.at[1]+rnd(-3,3); if(g.square){ x=g.at[0]+(k%4-1.5)*1.6; z=g.at[1]+Math.floor(k/4)*1.6; }
    makeUnit(g.u,"B",x,z,{tag:g.tag,obj:OBJ.i}); g.left--; g.delay=g.square?0:.35; } }
function updateObjective(dt){ if(!OBJ) return; const def=OBJ.def;
  if(OBJ.next>0){ OBJ.next-=dt; if(OBJ.next<=0){ if(OBJ.i+1<W.obj.length) startObjective(OBJ.i+1); else win(); } return; }
  spawnFromQueue(dt);
  if(def.cont&&!OBJ.doneFlag){ OBJ.contT-=dt; if(OBJ.contT<=0&&aliveB().length<def.cont.max){ const f=pick(def.cont.from); makeUnit(pick(def.cont.units),"B",f[0]+rnd(-4,4),f[1]+rnd(-4,4),{obj:OBJ.i}); OBJ.contT=def.cont.rate*rnd(.7,1.3); } }
  const qEmpty=OBJ.q.every(g=>g.left<=0), mine=UNITS.filter(u=>u.team==="B"&&!u.dead&&u.obj===OBJ.i);
  let done=false; OBJ.status="";
  if(def.t==="reach") done=Math.hypot(P.x-def.at[0],P.z-def.at[1])<def.r;
  else if(def.t==="wave"||def.t==="clear") done=qEmpty&&mine.length===0;
  else if(def.t==="kill"){ const tg=UNITS.find(u=>u.tag==="target"&&u.obj===OBJ.i); done=qEmpty&&tg&&tg.dead; if(done&&def.rout) for(const u of mine){ u.flee=99; u.rout=true; } }
  else if(def.t==="hold"){ const inZ=Math.hypot(P.x-def.at[0],P.z-def.at[1])<def.r; if(inZ) OBJ.t+=dt; else OBJ.status="Reviens dans la zone !"; OBJ.prog=OBJ.t/def.time; done=OBJ.t>=def.time; }
  else if(def.t==="defend"){ OBJ.t+=dt; OBJ.prog=OBJ.t/def.time; for(const d of DEFS) if(d.hp<=0&&!OBJ.failed){ OBJ.failed=true; failObjective(d.isNpc?`${d.name} est tombé.`:"L'artillerie est détruite."); return; } done=OBJ.t>=def.time; }
  else if(def.t==="interact"){ const near=Math.hypot(P.x-def.at[0],P.z-def.at[1])<def.r; if(near&&inp.act&&!P.dead){ OBJ.prog+=dt/def.hold; } else OBJ.prog=Math.max(0,OBJ.prog-dt*.4); done=OBJ.prog>=1; }
  else if(def.t==="timer"||def.t==="survive"){ OBJ.t+=dt; OBJ.prog=OBJ.t/def.time; done=OBJ.t>=def.time; }
  if(done) completeObjective(); }
function completeObjective(){ const def=OBJ.def; OBJ.doneFlag=true; G.score+=500; G.objDone++; SND.objective(); def.onDone&&def.onDone(); center("Objectif accompli",2000); feed("Objectif accompli +500"); OBJ.next=2.6;
  if(LI===4) P.grenades=Math.min(5,P.grenades+1);
  if(def.t==="defend"||def.t==="hold"||def.t==="survive") for(const u of aliveB()) if(u.obj===OBJ.i){ u.flee=99; u.rout=true; } DEFS=[]; hud(); }
function failObjective(msg){ running=false; unlock(); SND.fail(); overlay(`<div class="kick">Objectif manqué</div><h2>${msg}</h2><p>Tu reprends au début de l'objectif « ${OBJ.def.text} ».</p><div class="row"><button class="primary" type="button" id="ovRe">Reprendre</button><button class="ghost" type="button" id="ovMenu">Menu</button></div>`);
  $("ovRe").onclick=retryObjective; $("ovMenu").onclick=toMenu; $("ovRe").focus({preventScroll:true}); }
function playerDown(){ P.dead=true; G.deaths++; running=false; unlock(); SND.fail(); shake=0;
  overlay(`<div class="kick">Tombé au combat</div><h2>${L.name}, ${L.y}</h2><p>Les ${L.foeName} ont eu raison de toi. Bats-toi depuis un couvert, recharge à l'abri et laisse tes compagnons prendre les coups.</p><div class="row"><button class="primary" type="button" id="ovRe">Reprendre l'objectif</button><button class="ghost" type="button" id="ovMenu">Menu</button></div>`);
  $("ovRe").onclick=retryObjective; $("ovMenu").onclick=toMenu; $("ovRe").focus({preventScroll:true}); }
function retryObjective(){ for(const u of UNITS) if(u.team==="B"){ scene.remove(u.m); freeChar(u); if(u.cover) u.cover.occ=null; } UNITS=UNITS.filter(u=>u.team==="A");
  for(const p of PROJ) scene.remove(p.m); PROJ=[]; for(const g of GRENS) scene.remove(g.m); GRENS=[];
  P.dead=false; P.hp=100; P.x=G.cp.x; P.z=G.cp.z; P.y=H(P.x,P.z); P.vy=0; P.ammo=WEAPONS[L.weapon].mag; P.reloadT=0;
  for(const u of UNITS){ if(u.dead){ u.dead=false; u.gone=false; u.hp=u.maxhp; u.m.visible=true; u.h.position.y=0; const hu=u.h.userData; hu.dying=false; hu.mixer.stopAllAction(); hu.cur=null; hu.curA=null; act(u.h,hu.idle); } u.x=P.x+rnd(-4,4); u.z=P.z-rnd(2,5); }
  G.score=Math.max(0,G.score-250); $("ov").hidden=true; startObjective(OBJ.i); running=true; lockPointer(); last=performance.now(); }

/* ================= FIN DE MISSION ================= */
function win(){ G.done=true; running=false; unlock();
  const acc=G.shots?Math.round(G.hits/G.shots*100):0, hpB=Math.round(P.hp)*5, tB=Math.max(0,Math.round(600-G.t)), allies=UNITS.filter(u=>u.team==="A"&&!u.dead).length*80;
  G.score+=1000+hpB+tB+allies; const score=G.score, md=medalOf(LI,score);
  if(!localBest[L.id]||localBest[L.id]<score){ localBest[L.id]=score; try{localStorage.setItem(LSB,JSON.stringify(localBest))}catch(e){} }
  const show=()=>{ const facts=[...G.par].sort().map(k=>L.facts[k]);
    overlay(`<div class="kick">Victoire · ${L.name}, ${L.y}</div><h2>Mission accomplie</h2><p>${L.outro}</p>
     <div class="med" style="color:var(--${md==="g"?"gold":md==="s"?"silver":md==="b"?"bronze":"muted"})">${md?"Médaille d'"+(md==="g"?"or":md==="s"?"argent":"bronze"):"Pas de médaille cette fois"} · ${score} points</div>
     <div class="stats"><div><b>${G.kills}</b><span>ennemis</span></div><div><b>${G.heads}</b><span>à la tête</span></div><div><b>${acc} %</b><span>précision</span></div><div><b>${G.par.size}/3</b><span>parchemins</span></div><div><b>${Math.floor(G.t/60)}:${String(Math.floor(G.t%60)).padStart(2,"0")}</b><span>durée</span></div></div>
     <div class="row">${LI<4?`<button class="primary" type="button" id="ovNext">Mission suivante : ${LV[LI+1].name}, ${LV[LI+1].y}</button>`:""}<button class="${LI<4?"ghost":"primary"}" type="button" id="ovMenu">Menu</button><button class="ghost" type="button" id="ovRe">Rejouer</button></div>
     ${facts.length?`<ul>${facts.map(f=>`<li>${f}</li>`).join("")}</ul>`:`<p class="hint">Aucun parchemin trouvé : trois t'attendent sur le terrain.</p>`}`);
    if($("ovNext")) $("ovNext").onclick=()=>startLevel(LI+1); $("ovMenu").onclick=toMenu; $("ovRe").onclick=()=>startLevel(LI); ($("ovNext")||$("ovMenu")).focus({preventScroll:true}); };
  playCine(W.outroCine,show); saveScore(L.id,score); }
function spawnTank(){ const g=new THREE.Group(); const C=0x5a6248; const p=(sx,sy,sz,x,y,z,c=C)=>{ const m=M(GB,c,{tex:"metal"}); m.scale.set(sx,sy,sz); m.position.set(x,y,z); g.add(m); return m; };
  p(2.8,1.1,5.4,0,1.1,0); p(.6,.9,5.6,-1.5,.6,0,0x2a2a2a); p(.6,.9,5.6,1.5,.6,0,0x2a2a2a); const tur=M(gcyl(12),C,{tex:"metal"}); tur.scale.set(1.1,.9,1.1); tur.position.set(0,2.1,-.2); g.add(tur);
  const gun=M(gcyl(8),C,{tex:"metal"}); gun.scale.set(.1,2.8,.1); gun.rotation.x=Math.PI/2; gun.position.set(0,2.1,1.9); g.add(gun);
  const st=new THREE.Mesh(new THREE.CircleGeometry(.45,5),mat(0xf2f2f2,{basic:true,side:1})); st.position.set(1.81,1.2,0); st.rotation.y=Math.PI/2; g.add(st);
  g.position.set(0,H(0,-75),-75); scene.add(g); let t=0; W.upd.push((tt,dt)=>{ if(t>14) return; t+=dt; g.position.z=-75+t*3.4; g.position.y=H(0,g.position.z); }); }

/* ================= CINÉMATIQUES ================= */
function playCine(shots,end){ if(!shots||!shots.length){ end&&end(); return; } CINE={shots,i:0,t:0,end}; $("game").classList.add("cine"); $("skip").hidden=false; unlock(); showShot(); }
function showShot(){ const s=CINE.shots[CINE.i]; $("sub").hidden=!s.text; $("subW").textContent=s.who||""; $("subW").hidden=!s.who; $("subX").textContent=s.text||""; }
function cineStep(dt){ const s=CINE.shots[CINE.i]; CINE.t+=dt; const k=clamp(CINE.t/s.d,0,1), e=k*k*(3-2*k);
  cam.position.set(lerp(s.p[0],s.to[0],e),lerp(s.p[1],s.to[1],e),lerp(s.p[2],s.to[2],e)); cam.lookAt(...s.look);
  if(VM) VM.visible=false; if(k>=1) nextShot(); }
function nextShot(){ if(!CINE) return; CINE.i++; CINE.t=0; if(CINE.i>=CINE.shots.length){ const e=CINE.end; CINE=null; $("game").classList.remove("cine"); $("sub").hidden=true; $("skip").hidden=true; if(VM) VM.visible=true; e&&e(); } else showShot(); }
let subT=0; function sub(who,text,secs){ if(CINE) return; $("subW").textContent=who; $("subW").hidden=!who; $("subX").textContent=text; $("sub").hidden=false; clearTimeout(subT); subT=setTimeout(()=>{ if(!CINE) $("sub").hidden=true; },secs*1000); }

/* ================= ENTRÉES ================= */
const coarse=matchMedia("(pointer:coarse)").matches; let locked=false;
function lockPointer(){ if(coarse||!R) return; try{ const p=R.domElement.requestPointerLock&&R.domElement.requestPointerLock(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
function unlock(){ try{ if(document.pointerLockElement) document.exitPointerLock(); }catch(e){} }
document.addEventListener("pointerlockchange",()=>{ locked=!!R&&document.pointerLockElement===R.domElement; if(!locked&&running&&!G.done&&!CINE) pause(); });
document.addEventListener("mousemove",e=>{ if(locked){ lookQ.dx+=e.movementX; lookQ.dy+=e.movementY; } });
const KM={z:"f",w:"f",arrowup:"f",s:"b",arrowdown:"b",q:"l",a:"l",arrowleft:"l",d:"r",arrowright:"r"};
document.addEventListener("keydown",e=>{ if($("play").hidden) return; const k=e.key.toLowerCase();
  if(e.target.tagName==="BUTTON"&&(k===" "||k==="enter")) return;
  if(CINE&&(k===" "||k==="enter"||k==="escape")){ e.preventDefault(); nextShot(); return; }
  if(KM[k]){ keys[KM[k]]=true; e.preventDefault(); }
  if(k==="shift") inp.run=true; if(k==="c") inp.crouch=!inp.crouch; if(k===" "){ e.preventDefault(); inp.jumpP=true; }
  if(k==="r") inp.reload=true; if(k==="f"||k==="v") inp.melee=true; if(k==="e") inp.act=true; if(k==="g") inp.gren=true;
  if(k==="p"){ e.preventDefault(); pause(); } });
document.addEventListener("keyup",e=>{ const k=e.key.toLowerCase(); if(KM[k]) keys[KM[k]]=false; if(k==="shift") inp.run=false; if(k==="e") inp.act=false; });
window.addEventListener("blur",()=>{ for(const k in keys) keys[k]=false; inp.fire=false; inp.run=false; inp.ads=false; inp.act=false; });
const tstate={joy:null,look:new Map()};
$("game").addEventListener("pointerdown",e=>{
  if(e.target.closest("button,.ov")) return;
  if(CINE){ nextShot(); return; }
  if(e.pointerType==="mouse"){ if(!running) return; if(!locked){ lockPointer(); tstate.look.set(e.pointerId,{x:e.clientX,y:e.clientY}); } if(e.button===0) inp.fire=true; if(e.button===2) inp.ads=true; return; }
  const r=$("game").getBoundingClientRect(), lx=e.clientX-r.left;
  if(lx<r.width*.42&&!tstate.joy){ tstate.joy={id:e.pointerId,x:e.clientX,y:e.clientY}; const j=$("joy"); j.hidden=false; j.style.left=lx+"px"; j.style.top=(e.clientY-r.top)+"px"; }
  else tstate.look.set(e.pointerId,{x:e.clientX,y:e.clientY});
  $("game").setPointerCapture?.(e.pointerId); });
$("game").addEventListener("pointermove",e=>{ const j=tstate.joy;
  if(j&&j.id===e.pointerId){ let dx=e.clientX-j.x, dy=e.clientY-j.y; const d=Math.hypot(dx,dy), m=46; if(d>m){dx*=m/d;dy*=m/d;} inp.x=dx/m; inp.y=-dy/m; inp.run=d>m*1.2; $("joyK").style.transform=`translate(${dx}px,${dy}px)`; return; }
  const l=tstate.look.get(e.pointerId); if(l){ const k=e.pointerType==="mouse"?1:1.5; lookQ.dx+=(e.clientX-l.x)*k; lookQ.dy+=(e.clientY-l.y)*k; l.x=e.clientX; l.y=e.clientY; } });
const endP=e=>{ if(tstate.joy&&tstate.joy.id===e.pointerId){ tstate.joy=null; inp.x=inp.y=0; inp.run=false; $("joy").hidden=true; } tstate.look.delete(e.pointerId); if(e.pointerType==="mouse"){ if(e.button===0) inp.fire=false; if(e.button===2) inp.ads=false; } };
$("game").addEventListener("pointerup",endP); $("game").addEventListener("pointercancel",endP);
$("game").addEventListener("contextmenu",e=>e.preventDefault());
document.querySelectorAll(".tbtn button").forEach(b=>{ const k=b.dataset.b;
  b.addEventListener("pointerdown",e=>{ e.preventDefault(); e.stopPropagation(); if(CINE){ nextShot(); return; } b.classList.add("on");
    if(k==="fire") inp.fire=true; if(k==="jump") inp.jumpP=true; if(k==="reload") inp.reload=true; if(k==="melee") inp.melee=true; if(k==="act") inp.act=true; if(k==="gren") inp.gren=true;
    if(k==="crouch"){ inp.crouch=!inp.crouch; } if(k==="ads"){ inp.ads=!inp.ads; } });
  const off=()=>{ if(k==="crouch") b.classList.toggle("on",inp.crouch); else if(k==="ads") b.classList.toggle("on",inp.ads); else b.classList.remove("on"); if(k==="fire") inp.fire=false; if(k==="act") inp.act=false; };
  b.addEventListener("pointerup",off); b.addEventListener("pointercancel",off); b.addEventListener("pointerleave",off); b.addEventListener("contextmenu",e=>e.preventDefault()); });
$("fsBtn").onclick=()=>{ const g=$("game"); if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); else if(g.requestFullscreen) g.requestFullscreen().catch(()=>{$("fsBtn").hidden=true}); else $("fsBtn").hidden=true; };
document.addEventListener("visibilitychange",()=>{ if(document.hidden&&running) pause(); });
function pause(){ if(!running||!G||G.done) return; running=false; inp.fire=false; inp.ads=false; unlock();
  overlay(`<div class="kick">Pause</div><h2>${L.name}, ${L.y}</h2><p class="hint">Objectif : ${OBJ?OBJ.def.text:""}</p><div class="row"><button class="primary" type="button" id="ovGo">Reprendre</button><button class="ghost" type="button" id="ovRe">Recommencer la mission</button><button class="ghost" type="button" id="ovMenu">Menu</button></div>`);
  $("ovGo").onclick=()=>{ $("ov").hidden=true; running=true; lockPointer(); last=performance.now(); }; $("ovRe").onclick=()=>startLevel(LI); $("ovMenu").onclick=toMenu; $("ovGo").focus({preventScroll:true}); }

/* ================= HUD ================= */
function hud(){ if(!G) return; const WP=WEAPONS[L.weapon];
  $("sScore").textContent=G.score; $("sKills").textContent=G.kills; $("sPar").textContent=`${G.par.size}/3`; $("hp").style.width=Math.max(0,P.hp)+"%";
  $("wName").textContent=WP.name; const a=$("wAmmo"); a.textContent=P.reloadT>0?(WP.anim==="draw"?"…":"Recharge…"):WP.mag===1?(P.ammo?"Chargé":"Vide · R"):`${P.ammo} / ${WP.mag}`; a.className="a"+(P.ammo===0||(WP.mag>1&&P.ammo<WP.mag*.2)?" low":"");
  $("wGr").textContent=WP.grenades?`Grenades : ${P.grenades} (G)`:"";
  const al=UNITS.filter(u=>u.team==="A"), ali=al.filter(u=>!u.dead).length; $("ally").textContent=al.length?`Compagnons : ${ali}/${al.length}`:"";
  if(OBJ){ $("objT").textContent=`${L.y} · ${L.name} · objectif ${OBJ.i+1}/${W.obj.length}`; $("objX").textContent=OBJ.def.text; } }
function feed(t){ const s=document.createElement("span"); s.textContent=t; $("feed").prepend(s); setTimeout(()=>s.remove(),3000); while($("feed").children.length>5) $("feed").lastChild.remove(); }
let cT=0; function center(t,ms){ const c=$("center"); c.innerHTML=t; c.hidden=false; clearTimeout(cT); cT=setTimeout(()=>c.hidden=true,ms); }
let tT=0; function toast(t,x,ms){ $("tT").textContent=t; $("tX").textContent=x; $("toast").hidden=false; clearTimeout(tT); tT=setTimeout(()=>$("toast").hidden=true,ms); }
function objTarget(){ if(!OBJ||OBJ.next>0) return null; const d=OBJ.def;
  if(d.at) return {x:d.at[0],z:d.at[1],zone:d.r&&(d.t==="hold"||d.t==="reach")?d.r:0};
  if(d.npc){ const n=NPCE[d.npc]; return {x:n.x,z:n.z}; } if(d.obj==="cannons") return {x:0,z:-18};
  if(d.marker==="target"){ const t=UNITS.find(u=>u.tag==="target"&&u.obj===OBJ.i&&!u.dead); if(t) return {x:t.x,z:t.z}; }
  const m=UNITS.filter(u=>u.team==="B"&&!u.dead&&u.obj===OBJ.i); if(m.length){ let b=m[0],bd=1e9; for(const u of m){ const dd=Math.hypot(u.x-P.x,u.z-P.z); if(dd<bd){bd=dd;b=u;} } return {x:b.x,z:b.z}; } return null; }
const _pv=new THREE.Vector3();
function hudFrame(){ if(!G||!OBJ) return; const tg=objTarget(); const CWp=$("compass").clientWidth, heading=Math.atan2(-Math.sin(yaw),-Math.cos(yaw));
  let html=""; for(const [a,l] of [[0,"N"],[Math.PI/2,"E"],[Math.PI,"S"],[-Math.PI/2,"O"],[Math.PI/4,""],[-Math.PI/4,""],[Math.PI*.75,""],[-Math.PI*.75,""]]){ const rel=angDiff(a,heading); if(Math.abs(rel)>Math.PI/2) continue; const x=CWp/2+rel/(Math.PI/2)*CWp/2; html+=l?`<span class="l" style="left:${x}px">${l}</span>`:`<span class="s" style="left:${x}px"></span>`; }
  if(tg){ const rel=angDiff(Math.atan2(tg.x-P.x,tg.z-P.z),heading); const x=CWp/2+clamp(rel/(Math.PI/2),-1,1)*CWp/2; html+=`<span class="o" style="left:${x}px"></span>`; }
  $("compass").innerHTML=html;
  const d=tg?Math.hypot(tg.x-P.x,tg.z-P.z):0; const df=OBJ.def;
  let dtxt=tg&&OBJ.next<=0?`à ${Math.round(d)} m`:""; if(OBJ.status) dtxt=OBJ.status;
  if(df.t==="hold"||df.t==="survive"||df.t==="timer"||df.t==="defend") dtxt=(OBJ.status?OBJ.status+" · ":"")+`${Math.max(0,Math.ceil(df.time-OBJ.t))} s`;
  if(df.t==="defend"&&DEFS.length) dtxt+=" · "+DEFS.map(x=>`${x.name} ${Math.max(0,Math.round(x.hp/x.maxhp*100))} %`).join(" · ");
  if(df.t==="wave"||df.t==="clear"){ const n=UNITS.filter(u=>u.team==="B"&&!u.dead&&u.obj===OBJ.i).length+OBJ.q.reduce((a,g)=>a+g.left,0); dtxt=`${n} ennemi${n>1?"s":""} restant${n>1?"s":""}`; }
  $("objD").textContent=OBJ.next>0?"":dtxt; const pb=["hold","defend","interact","timer","survive"].includes(df.t)&&OBJ.next<=0; $("objPB").hidden=!pb; if(pb) $("objPI").style.width=Math.min(100,OBJ.prog*100)+"%";
  // marqueur 3D
  if(tg&&OBJ.next<=0){ W.marker.visible=true; W.marker.position.set(tg.x,H(tg.x,tg.z),tg.z); W.marker.userData.ring.scale.setScalar(1+Math.sin(T*3)*.08); } else W.marker.visible=false;
  if(tg&&tg.zone&&OBJ.next<=0){ W.zone.visible=true; W.zone.scale.setScalar(tg.zone); W.zone.position.set(tg.x,H(tg.x,tg.z)+.15,tg.z); } else W.zone.visible=false;
  // invite d'action
  const pr=$("prompt"); if(df.t==="interact"&&OBJ.next<=0&&Math.hypot(P.x-df.at[0],P.z-df.at[1])<df.r){ pr.hidden=false; pr.innerHTML=`<kbd>E</kbd> maintenir · ${df.label}`; } else pr.hidden=true;
  // grenades ennemies proches
  let gh=""; for(const g of GRENS){ if(g.team!=="B") continue; const dd=Math.hypot(g.x-P.x,g.z-P.z); if(dd>10) continue; _pv.set(g.x,g.y,g.z).project(cam); const r=$("game").getBoundingClientRect(); let sx=(_pv.x*.5+.5)*r.width, sy=(-_pv.y*.5+.5)*r.height; if(_pv.z>1){ sx=r.width-sx; sy=r.height-sy; } sx=clamp(sx,24,r.width-24); sy=clamp(sy,24,r.height-24); gh+=`<span class="gwarn" style="left:${sx}px;top:${sy}px">!</span>`; }
  $("gwarns").innerHTML=gh;
  $("cross").style.opacity=P.ads>.6?0:1; }

/* ================= BOUCLE ================= */
function update(dt){
  G.t+=dt; const WP=WEAPONS[L.weapon];
  yaw-=lookQ.dx*.0023*(P.ads>.5?.6:1); pitch=clamp(pitch-lookQ.dy*.0023*(P.ads>.5?.6:1),-1.35,1.35); lookQ.dx=lookQ.dy=0;
  if(!P.dead){
    let ix=inp.x+(keys.r?1:0)-(keys.l?1:0), iy=inp.y+(keys.f?1:0)-(keys.b?1:0); const il=Math.hypot(ix,iy); if(il>1){ix/=il;iy/=il;}
    P.crouch=inp.crouch; P.ads=lerp(P.ads,inp.ads?1:0,Math.min(1,dt*12)); const sp=(P.crouch?2.4:(inp.run&&iy>0&&P.ads<.3?7.6:5))*(P.ads>.5?.6:1);
    const fx=-Math.sin(yaw), fz=-Math.cos(yaw); P.x+=(fx*iy-fz*ix)*sp*dt; P.z+=(fz*iy+fx*ix)*sp*dt;
    if(il>.1&&P.on){ P.stepT-=dt*sp; if(P.stepT<=0){ P.stepT=2.4; SND.step(); } }
    if(inp.jumpP){ inp.jumpP=false; if(P.on&&!P.crouch){ P.vy=6.2; P.on=false; } }
    P.vy-=17*dt; P.y+=P.vy*dt; solve(P,PR,P.y);
    for(const u of UNITS){ if(u.dead) continue; const dx=P.x-u.x, dz=P.z-u.z, d=Math.hypot(dx,dz), m=u.def.cav?1.3:.7; if(d<m&&d>1e-4){ P.x+=dx/d*(m-d); P.z+=dz/d*(m-d); } }
    for(const k in NPCE){ const n=NPCE[k]; const dx=P.x-n.x, dz=P.z-n.z, d=Math.hypot(dx,dz); if(d<.8&&d>1e-4){ P.x+=dx/d*(.8-d); P.z+=dz/d*(.8-d); } }
    P.x=clamp(P.x,-W.lim,W.lim); P.z=clamp(P.z,-W.lim,W.lim);
    const g=groundAt(P.x,P.z,P.y); if(P.y<=g){ P.y=g; P.vy=0; P.on=true; } else if(P.y>g+.05) P.on=false;
    P.fireT=Math.max(0,P.fireT-dt); P.meleeT=Math.max(0,P.meleeT-dt); P.kick=Math.max(0,P.kick-dt*6); P.swing=Math.max(0,P.swing-dt);
    if(P.reloadT>0){ P.reloadT-=dt; if(P.reloadT<=0){ P.ammo=WP.mag; hud(); } }
    if(inp.reload){ inp.reload=false; startReload(); } if(inp.melee){ inp.melee=false; melee(); } if(inp.gren){ inp.gren=false; playerGrenade(); }
    if(inp.fire){ playerShoot(); if(!WP.auto) inp.fire=false; }
    for(const f of FOOD){ if(f.taken) continue; f.g.rotation.y=T*2; if(Math.hypot(P.x-f.x,P.z-f.z)<1.3){ f.taken=true; scene.remove(f.g); P.hp=Math.min(100,P.hp+30); SND.pick(); feed("Ravitaillement +30"); hud(); } }
    for(const p of W.parchE){ if(p.taken) continue; p.g.rotation.y=T*1.4; if(Math.hypot(P.x-p.x,P.z-p.z)<1.5){ p.taken=true; scene.remove(p.g); G.par.add(p.k); G.score+=150; SND.pick(); toast(`Parchemin ${G.par.size}/3 · ${L.name}, ${L.y}`,L.facts[p.k],9000); hud(); } }
  }
  recoilOff*=Math.pow(.0005,dt); flashLight.intensity*=Math.pow(.0001,dt); shake*=Math.pow(.02,dt);
  navBudget=3; for(const u of UNITS) updateUnit(u,dt); UNITS=UNITS.filter(u=>{ if(u.gone&&u.team==="B"){ scene.remove(u.m); freeChar(u); return false; } return true; });
  for(const d of DEFS){ if(!d.cannon||d.hp<=0) continue; d.fireT-=dt; if(d.fireT<=0){ d.fireT=rnd(4.5,6.5); const tgt=aliveB().filter(u=>u.z>d.z+10&&Math.hypot(u.x-d.x,u.z-d.z)<70); if(tgt.length){ const u=pick(tgt); SND.boom(); const c=d.cannon; puff(c.position.x,c.position.y+1.2,c.position.z+2.6,0xdddddd,12,.5,1.4); setTimeout(()=>{ if(!G.done) explode(u.x+rnd(-1.5,1.5),u.y,u.z+rnd(-1.5,1.5),3.6,160,"A"); },350); } } }
  for(const k in NPCE){ const n=NPCE[k]; const d0=DEFS.find(x=>x.key===k); animHuman(n.h,0,T,dt,{talk:!!$("sub").hidden===false,ride:n.mounted,crouch:d0&&OBJ.def.t==="defend"?false:false}); }
  stepProj(dt); stepGren(dt); updateObjective(dt); ambient(dt);
  if(W.fogLift!=null&&W.fogLift<1){ W.fogLift=Math.min(1,W.fogLift+dt*.3); const e=W.fogLift; scene.fog.near=lerp(6,50,e); scene.fog.far=lerp(42,230,e); sun.intensity=lerp(.9,2.4,e)*LK*.85; }
}
function ambient(dt){ W.ambT-=dt; if(W.ambT>0) return; W.ambT=rnd(2.5,6); const a=W.ambient||{};
  if(a.cannon&&Math.random()<.6){ SND.distant(); const ang=rnd(0,TAU), r=rnd(90,140); const x=Math.cos(ang)*r, z=Math.sin(ang)*r; for(let i=0;i<8;i++) particle(x,H(x,z)+2,z,{color:0x777777,s:rnd(2,4),vx:rnd(-1,1),vy:rnd(1,3),vz:rnd(-1,1),life:rnd(5,8),grow:.6,op:.45}); }
  if(a.cries&&Math.random()<.5) SND.cry(); if(a.clash&&Math.random()<.6) for(let i=0;i<3;i++) setTimeout(()=>SND.clash(),i*rnd(120,260));
  if(a.drums&&Math.random()<.5) for(let i=0;i<6;i++) tone(90,80,.12,"triangle",.04,.6,i*.18);
  if(a.planes&&Math.random()<.18) flyover(); }
function flyover(){ SND.plane(); const z0=rnd(-40,40); for(let k=0;k<3;k++){ const g=new THREE.Group(); const b=M(gcyl(8),0x6a7060,{tex:"metal"}); b.scale.set(.5,6,.5); b.rotation.z=Math.PI/2; g.add(b); const w=M(GB,0x6a7060,{tex:"metal"}); w.scale.set(1.4,.12,9); g.add(w); const t=M(GB,0x6a7060); t.scale.set(.8,.1,3); t.position.x=-2.6; g.add(t);
    for(const s of [-1,1]){ const st=new THREE.Mesh(new THREE.CircleGeometry(.5,5),mat(0xf2f2f2,{basic:true,side:1})); st.rotation.x=-Math.PI/2; st.position.set(0,.08,s*3); g.add(st); }
    g.position.set(-200-k*12,60+k*3,z0+k*8); scene.add(g); let t0=0; W.upd.push((tt,dt)=>{ if(t0>8){ if(g.parent) scene.remove(g); return; } t0+=dt; g.position.x+=dt*55; }); } }
function placeCam(dt){ if(CINE){ cineStep(dt); return; }
  const eye=P.y+(P.dead?.3:(P.crouch?1.05:1.62)); const sh=shake*.06; cam.position.set(P.x+rnd(-sh,sh),eye+rnd(-sh,sh),P.z+rnd(-sh,sh)); cam.rotation.order="YXZ"; cam.rotation.set(pitch+recoilOff,yaw,0);
  const WP=WEAPONS[L.weapon], fov=lerp(72,WP.ads,P.ads); if(Math.abs(cam.fov-fov)>.05){ cam.fov=fov; cam.updateProjectionMatrix(); }
  if(VM){ VM.visible=!P.dead; const moving=(Math.abs(inp.x)+Math.abs(inp.y)+(keys.f||keys.b||keys.l||keys.r?1:0))>0&&P.on; const bob=moving?Math.sin(T*(inp.run?13:9))*.014*(1-P.ads*.8):0, bx=moving?Math.cos(T*(inp.run?6.5:4.5))*.01:0;
    VM.position.lerpVectors(HIP_POS,ADS_POS,P.ads); VM.position.y+=bob; VM.position.x+=bx; VM.position.z+=P.kick*.07; VM.rotation.set(P.kick*.22,0,0);
    const U=VM.userData, k=P.reloadT>0?1-P.reloadT/WP.reload:-1, s=k>=0?Math.sin(k*Math.PI):0;
    if(U.string) U.string.position.z=-.42+(k>=0?(k<.6?k/.6*.3:.3):0)-(P.ammo===0&&k<0?0:0), U.bolt.visible=P.ammo>0||k>.65;
    if(k>=0){ if(WP.anim==="draw"){ VM.position.y-=s*.4; if(U.axe) U.axe.visible=k>.5; }
      else if(WP.anim==="span"){ VM.rotation.x-=s*.9; VM.position.y-=s*.12; }
      else if(WP.anim==="ramrod"){ VM.rotation.x-=s*1.05; VM.rotation.z=s*.35; VM.position.y-=s*.06; if(U.ramrod) U.ramrod.position.z=-.6+(k>.25&&k<.8?Math.abs(Math.sin((k-.25)*TAU*2.7))*.35:0); }
      else if(WP.anim==="mag"){ VM.rotation.z=s*.5; VM.rotation.x-=s*.25; if(U.mag) U.mag.position.y=k<.5?-k*1.2:-(1-k)*1.2; } }
    else { if(U.axe) U.axe.visible=P.ammo>0; if(U.ramrod) U.ramrod.position.z=-.6; if(U.mag) U.mag.position.y=0; }
    if(P.swing>0){ VM.rotation.x-=Math.sin(P.swing/.35*Math.PI)*1.1; VM.position.z-=Math.sin(P.swing/.35*Math.PI)*.15; }
    if(U.match) U.match.material.color.setHSL(.07,1,.5+Math.sin(T*20)*.1); }
  if(sun){ sun.position.set(P.x+W.sunDir.x*80,P.y+W.sunDir.y*80,P.z+W.sunDir.z*80); sun.target.position.set(P.x,P.y,P.z); sun.target.updateMatrixWorld(); } }
function loop(ts){ const raw=(ts-last)/1000||0, dt=Math.min(.05,raw); last=ts; if(running&&!CINE&&raw<.5) perfWatch(raw); T+=dt; UT.time.value=T;
  if(G&&W){ if(running&&!CINE) update(dt); else if(CINE){ for(const u of UNITS) if(!u.dead) animHuman(u.h,0,T,dt,{ride:!!u.horse}); for(const k in NPCE) animHuman(NPCE[k].h,0,T,dt,{talk:true,ride:NPCE[k].mounted}); }
    for(const f of W.upd) f(T,dt); stepParts(dt); placeCam(dt); if(W.sky) W.sky.position.copy(cam.position); if(running&&!CINE) hudFrame(); renderFrame(); }
  raf=requestAnimationFrame(loop); }

/* ================= RECORDS (dans ce navigateur) ================= */
const LSR="fronts3.records"; let recs=[]; try{ recs=JSON.parse(localStorage.getItem(LSR)||"[]"); }catch(e){}
function saveScore(id,score){ const p=($("pseudo").value||"").trim()||"Anonyme"; const i=LV.findIndex(l=>l.id===id);
  recs.push({pseudo:p,mission:id,score,at:Date.now()}); recs.sort((a,b)=>b.score-a.score); recs=recs.slice(0,40);
  try{ localStorage.setItem(LSR,JSON.stringify(recs)); $("saveMsg").textContent=""; }catch(e){ $("saveMsg").textContent="Ton navigateur n'a pas permis d'enregistrer le record."; }
  renderBoard(); }
function renderBoard(){ const ol=$("board"); ol.innerHTML=""; $("boardEmpty").hidden=recs.length>0;
  recs.slice(0,15).forEach((r,k)=>{ const l=LV.find(x=>x.id===r.mission); const li=document.createElement("li"); const rk=document.createElement("span"); rk.className="rk"; rk.textContent=k+1;
    const nm=document.createElement("span"); nm.className="nm"; nm.textContent=r.pseudo; const sm=document.createElement("small"); sm.textContent=l?`${l.name}, ${l.y}`:r.mission; nm.append(sm);
    const sc=document.createElement("span"); sc.className="sc"; sc.textContent=r.score; li.append(rk,nm,sc); ol.append(li); }); }
renderBoard();
if(import.meta.env.DEV) window.__eval=s=>eval(s);
