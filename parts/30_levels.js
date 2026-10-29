
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
