
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
