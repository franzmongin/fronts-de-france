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
