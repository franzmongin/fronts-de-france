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
