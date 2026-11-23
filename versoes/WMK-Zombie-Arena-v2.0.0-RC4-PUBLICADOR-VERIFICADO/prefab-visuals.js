import * as THREE from 'three';

// Prefabs autorais: visualização procedimental, sem texturas de terceiros.
// Caixa raiz: dimensões configuradas no mapa. Todas as peças filhas estão em [-0.5,+0.5].
const TYPES = new Set(['house','cottage','hauntedHouse','barn','shack','mausoleum','crypt','tombstone','graveCross','coffin','fenceWood','fenceIron','gate','deadTree','streetLamp','well','barricadeWood','pumpkin','porch','rubble','picketFence','shed']);
export const PROCEDURAL_TYPES=TYPES;
export function removePrefabVisual(root){
  const old=root.userData?.wmkPrefab;
  if(!old)return;
  root.remove(old);
  old.traverse(node=>{if(node.isMesh){node.geometry.dispose();if(Array.isArray(node.material))node.material.forEach(m=>m.dispose());else node.material.dispose()}});
  root.userData.wmkPrefab=null;
}
export function applyPrefabVisual(root, data){
  removePrefabVisual(root);
  if(!TYPES.has(data.type)||data.model)return;
  const group=new THREE.Group(), base=data.color||'#8c8576',roof=data.roofColor||'#5b4f4b',accent=data.accentColor||'#493c32';
  const add=(shape,color,x,y,z,sx,sy,sz,ry=0)=>{
    const mesh=new THREE.Mesh(shape==='sphere'?new THREE.SphereGeometry(.5,9,7):shape==='cone'?new THREE.ConeGeometry(.5,1,4):shape==='cylinder'?new THREE.CylinderGeometry(.5,.5,1,9):new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color,roughness:.89}));
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.rotation.y=ry;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
  };
  const box=(color,x,y,z,w,h,d)=>add('box',color,x,y,z,w,h,d);
  const roofPart=(color=roof)=>add('cone',color,0,.37,0,1.34,.28,1.34,Math.PI/4);
  const window=(x,y,z)=>{box('#273c43',x,y,z,.19,.21,.018);box('#a8abb0',x,y,z+.011,.018,.21,.022);box('#a8abb0',x,y,z+.012,.19,.015,.022)};
  const t=data.type;
  if(['house','cottage','hauntedHouse','barn','shack','shed','mausoleum','crypt'].includes(t)){
    box(base,0,-.075,0,.92,.67,.84);
    if(t==='mausoleum'||t==='crypt'){box(accent,0,.33,0,1.03,.14,1.04);box('#302e34',0,-.24,.428,.28,.39,.018);box('#8b897d',-.3,.03,.428,.09,.6,.09);box('#8b897d',.3,.03,.428,.09,.6,.09)}
    else{roofPart();box(accent,0,-.23,.432,.22,.36,.025);window(-.27,-.07,.432);window(.27,-.07,.432);if(t==='barn'){box('#594737',0,-.19,.445,.42,.43,.03);box('#b3a68c',0,-.2,.466,.028,.43,.04)} }
    if(t==='hauntedHouse'){box('#262d31',-.33,.18,.422,.2,.27,.028);box('#262d31',.32,.17,.422,.19,.26,.028);add('cone','#495048',.17,.44,-.15,.25,.35,.25)}
    if(t==='cottage')box('#605e5d',.25,.55,-.13,.15,.3,.15);
  } else if(['fenceWood','fenceIron','picketFence','gate'].includes(t)){
    const color=t==='fenceIron'?'#4e555b':base;
    for(let x=-.44;x<=.45;x+=.22)box(color,x,0,0,t==='fenceIron'?.025:.11,.95,.12);
    for(const y of [-.27,.27])box(accent,0,y,0,.98,.07,.13);
    if(t==='gate'){box('#524739',-.01,0,0,.08,.97,.14);box('#b7a269',.1,-.07,.086,.045,.045,.04)}
  } else if(t==='tombstone'){
    box(base,0,-.13,0,.61,.63,.24);add('sphere',base,0,.19,0,.61,.26,.24);box('#53544f',0,-.46,0,.8,.08,.4);
    box('#343d3c',0,-.04,.131,.36,.018,.02);
  } else if(t==='graveCross'){
    box(base,0,0,0,.14,.98,.15);box(base,0,.17,0,.6,.16,.15);box(accent,0,-.43,0,.5,.11,.33);
  } else if(t==='coffin'){
    box(accent,0,-.08,0,.66,.43,.9);box(base,0,.16,0,.73,.13,.97);box('#c1a17d',0,.235,0,.25,.018,.04);
  } else if(t==='deadTree'){
    add('cylinder',base,0,-.13,0,.19,.85,.19);for(const [x,y,z,w] of [[-.2,.21,0,.42],[.23,.16,.04,.45],[.02,.33,-.18,.3]]){const b=box(base,x,y,z,w,.085,.095);b.rotation.z=x<0?.6:-.6}
  } else if(t==='streetLamp'){
    box('#444c4b',0,0,0,.1,.97,.1);box('#c7c3a4',0,.43,0,.32,.18,.32);
  } else if(t==='well'){
    add('cylinder',base,0,-.2,0,.85,.45,.85);box(accent,0,.15,0,.92,.16,.92);box('#272d2f',0,.251,0,.57,.01,.57);
  } else if(t==='barricadeWood'){
    for(let y=-.3;y<=.32;y+=.27){const b=box(base,0,y,0,.95,.19,.14);b.rotation.z=(y<0?-.12:.12)}
    box(accent,-.31,0,.05,.14,.9,.15);box(accent,.33,0,.05,.14,.9,.15);
  } else if(t==='pumpkin'){
    add('sphere',base,0,-.1,0,.86,.64,.8);box(accent,0,.28,0,.11,.2,.12);
  } else if(t==='porch'){box(base,0,-.36,0,1,.22,1);for(const x of [-.42,.42])box(accent,x,0,.38,.08,.75,.07);box(roof,0,.44,0,1.12,.13,1.14)}
  else if(t==='rubble'){for(let i=0;i<7;i++)box(i%2?accent:base,-.39+(i%3)*.36,-.31+(i%2)*.12,-.27+Math.floor(i/3)*.32,.29,.23,.3)}
  // Editor usa BoxGeometry(1,1,1) + scale; FPS usa BoxGeometry(w,h,d).
  // Ajustamos apenas os eixos já embutidos na geometria da caixa raiz.
  const geo=root.geometry?.parameters||{};group.scale.set(Number(geo.width)||1,Number(geo.height)||1,Number(geo.depth)||1);
  root.add(group);root.userData.wmkPrefab=group;
  // O collider simples permanece no mesh raiz; a malha visual não deve mudar colisão.
  root.material.transparent=true;root.material.opacity=0;root.material.depthWrite=false;
}
