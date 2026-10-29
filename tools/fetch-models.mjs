// Télécharge les personnages KayKit (CC0, Kay Lousberg) et les allège pour le web.
import {NodeIO} from '@gltf-transform/core';
import {prune, dedup, resample} from '@gltf-transform/functions';
import {mkdirSync, existsSync} from 'node:fs';
const SRC='https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/672074b73ba276876a19e8816ecdc5241817ab47/addons/kaykit_character_pack_adventures/Characters/gltf/';
const KEEP=new Set(['Idle','Walking_A','Running_A','Walking_Backwards','2H_Ranged_Aiming','2H_Ranged_Shoot','1H_Ranged_Aiming','1H_Ranged_Shoot','1H_Melee_Attack_Chop','1H_Melee_Attack_Slice_Diagonal','2H_Melee_Attack_Stab','2H_Melee_Attack_Chop','Death_A','Death_B','Hit_A','Sit_Chair_Pose','Sit_Floor_Idle','Cheer','2H_Melee_Idle','Throw','Interact','Blocking','Unarmed_Idle','Use_Item','Jump_Idle']);
const io=new NodeIO(); mkdirSync('public/models',{recursive:true});
for(const [name,anims] of [['Rogue',true],['Knight',false],['Barbarian',false],['Rogue_Hooded',false]]){
  const out='public/models/'+name+'.glb'; if(existsSync(out)){ console.log('ok',out); continue; }
  const res=await fetch(SRC+name+'.glb'); if(!res.ok) throw new Error('download '+name+' '+res.status);
  let doc=await io.readBinary(new Uint8Array(await res.arrayBuffer())); let r=doc.getRoot();
  for(const a of r.listAnimations()){ if(!anims||!KEEP.has(a.getName())) a.dispose(); }
  await doc.transform(prune());
  doc=await io.readBinary(await io.writeBinary(doc)); r=doc.getRoot();
  for(const a of r.listAccessors()) if(a.listParents().length<=1) a.dispose();
  await doc.transform(resample(),dedup(),prune());
  await io.write(out,doc); console.log('built',out);
}
