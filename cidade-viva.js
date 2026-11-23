import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const $=id=>document.getElementById(id);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,0.1,700);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=false;$('viewport').append(renderer.domElement);
camera.position.set(145,125,145);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,0,0);orbit.enableDamping=true;orbit.maxDistance=420;orbit.minDistance=5;orbit.maxPolarAngle=Math.PI/2.03;orbit.update();
const hemi=new THREE.HemisphereLight(0xf7f7ed,0x4b5856,2.1);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe5b2,2.6);sun.position.set(-65,95,45);scene.add(sun);
scene.fog=new THREE.Fog(0x9eb2aa,140,370);
const world=new THREE.Group();scene.add(world);const objects=[];const vehicles=[];const meta=[];const WORLD_SIZE=256;
const palette=['#99928b','#aaa18c','#c1b9a6','#8b9b9c','#b3a091','#a79e8c','#929d8b'];
let seed=2026,ticking=true,oldTime=performance.now();
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
function material(color){return new THREE.MeshStandardMaterial({color,roughness:.86})}
function box(x,y,z,w,h,d,color,kind='decor',solid=true){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));
 mesh.position.set(x,y,z);mesh.receiveShadow=true;world.add(mesh);
 if(kind!=='decor')meta.push({id:'cv_'+(meta.length+1),name:kind+' '+(meta.length+1),type:'building',x,y,z,w,h,d,ry:0,color,solid,wmkKind:kind});
 objects.push(mesh);return mesh;
}
function clearWorld(){for(const vehicle of vehicles){vehicle.group.traverse(node=>{if(node.isMesh){node.geometry.dispose();node.material.dispose()}})}vehicles.length=0;while(world.children.length){const child=world.children[0];world.remove(child);child.traverse(node=>{if(node.isMesh){node.geometry.dispose();if(Array.isArray(node.material))node.material.forEach(m=>m.dispose());else node.material.dispose()}})}objects.length=0;meta.length=0;}
function house(x,z,kind='casa'){
 const w=10+random()*5,d=9+random()*5,h=kind==='predio'?11+random()*8:4+random()*2.2,c=palette[Math.floor(random()*palette.length)];
 box(x,h/2,z,w,h,d,c,kind);
 // detalhes sao partes visuais do objeto, nao caixas de colisao adicionais
 const roof=box(x,h+.35,z,w+.6,.7,d+.6,kind==='predio'?'#52626a':'#825b4e');
 for(let level=0;level<(kind==='predio'?3:1);level++){
  const wy=Math.min(h-1,1.8+level*3.1);
  for(const dx of [-w*.25,w*.25])box(x+dx,wy,z+d/2+.08,1.3,1.3,.11,'#526d79');
 }
 box(x,h*.21,z+d/2+.1,1.4,h*.42,.12,'#574a42');
 if(kind==='casa'){box(x-w/2-.6,.6,z,0.18,1.2,d+2,'#6c776e');box(x+w/2+.6,.6,z,.18,1.2,d+2,'#6c776e');}
 return roof;
}
function addRoads(){
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(WORLD_SIZE,WORLD_SIZE),material('#526d56'));ground.rotation.x=-Math.PI/2;ground.position.y=-.05;world.add(ground);
 for(const p of [-80,-25,30,85]){
  box(p,.025,0,11,.08,244,'#353c41');
  box(0,.025,p,244,.08,11,'#353c41');
  // centro amarelo segmentado nas ruas
  for(let n=-110;n<=110;n+=11){
   box(p,.077,n,0.12,.015,3,'#d1b978');
   box(n,.077,p,3,.015,.12,'#d1b978');
  }
 }
 // calcadas posicionadas fora das faixas, sem bloquear o leito viario
 for(const p of [-80,-25,30,85]){
  box(p-7,.07,0,2,.15,244,'#96998b');box(p+7,.07,0,2,.15,244,'#96998b');
  box(0,.07,p-7,244,.15,2,'#96998b');box(0,.07,p+7,244,.15,2,'#96998b');
 }
}
function generateBuildings(){
 for(const x of [-110,-52,3,58,112])for(const z of [-110,-52,3,58,112]){
  if(Math.abs(x)>115||Math.abs(z)>115)continue;
  if(random()<.13){box(x,.65,z,10,1.3,8,'#6c765c','praca');continue}
  house(x+(random()-.5)*5,z+(random()-.5)*5,random()<.26?'predio':'casa');
 }
 // marcos da cidade
 box(55,.9,-111,11,1.8,9,'#617c83','oficina');
 box(-110,.8,52,7,1.6,6,'#836d57','mercado');
}
const circuits=[
 [[-80,-80],[-25,-80],[30,-80],[85,-80],[85,-25],[85,30],[85,85],[30,85],[-25,85],[-80,85],[-80,30],[-80,-25]],
 [[-25,-25],[30,-25],[30,30],[-25,30]],
 [[-80,-25],[85,-25],[85,30],[-80,30]]
];
const paths=circuits.map(points=>{
 const pts=points.map(([x,z])=>new THREE.Vector3(x,0,z));let lens=[],total=0;
 for(let i=0;i<pts.length;i++){const d=pts[i].distanceTo(pts[(i+1)%pts.length]);lens.push(d);total+=d}
 return {points:pts,lens,total};
});
function sample(path,distance){
 let d=((distance%path.total)+path.total)%path.total;
 for(let i=0;i<path.points.length;i++){const length=path.lens[i];if(d<=length){const a=path.points[i],b=path.points[(i+1)%path.points.length],t=length?d/length:0;return {p:new THREE.Vector3().lerpVectors(a,b,t),angle:Math.atan2(b.x-a.x,b.z-a.z)};}d-=length}
 return {p:path.points[0].clone(),angle:0};
}
function vehicleMesh(color){
 const g=new THREE.Group();
 const chassis=new THREE.Mesh(new THREE.BoxGeometry(3.2,.8,1.6),material(color));chassis.position.y=.78;g.add(chassis);
 const cab=new THREE.Mesh(new THREE.BoxGeometry(1.7,.75,1.36),material('#456070'));cab.position.set(-.15,1.42,0);g.add(cab);
 for(const x of [-1.02,1.02])for(const z of [-.86,.86]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.25,10),material('#252c2a'));wheel.rotation.x=Math.PI/2;wheel.position.set(x,.48,z);g.add(wheel)}
 return g;
}
function resetCars(){
 for(const v of vehicles)world.remove(v.group);vehicles.length=0;
 const n=Number($('cars').value);for(let i=0;i<n;i++){
  const route=i%paths.length,path=paths[route],group=vehicleMesh(['#e0b54f','#7ba8b5','#d7e2d8','#a25e54','#7f9a73'][i%5]);
  let dist=(i+random()*.2)*path.total/Math.ceil(n/paths.length);
  const s=sample(path,dist);group.position.set(s.p.x,.08,s.p.z);group.rotation.y=s.angle;
  world.add(group);vehicles.push({group,route,dist,baseSpeed:6+random()*3.8,speed:0});
 }
 $('carCount').textContent=n;$('vehicles').textContent='Carros: '+n;
}
function updateTraffic(dt){
 for(const v of vehicles){
  const route=paths[v.route];let gap=Infinity;
  for(const other of vehicles)if(other!==v&&other.route===v.route){const ahead=(other.dist-v.dist+route.total)%route.total;if(ahead<gap)gap=ahead}
  const desired=gap<9?0:gap<18?v.baseSpeed*(gap-9)/9:v.baseSpeed;
  v.speed+=THREE.MathUtils.clamp(desired-v.speed,-9*dt,4*dt);
  v.dist=(v.dist+Math.max(0,v.speed)*dt)%route.total;
  const s=sample(route,v.dist);v.group.position.set(s.p.x,.08,s.p.z);v.group.rotation.y=s.angle;
 }
}
// WMK Cidade Viva: relógio virtual e infestação com entidades visuais de teste.
let worldTime=8*60, zombieElapsed=0;const zombies=[];
function zombieMesh(){
 const group=new THREE.Group();
 const body=new THREE.Mesh(new THREE.BoxGeometry(.75,1.25,.44),material('#668b63'));body.position.y=1.16;group.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.32,8,6),material('#a2b791'));head.position.y=2.02;group.add(head);
 const arms=new THREE.Mesh(new THREE.BoxGeometry(1.35,.25,.3),material('#75936d'));arms.position.y=1.42;group.add(arms);
 return group;
}
function clearZombies(){for(const zombie of zombies){world.remove(zombie.group);zombie.group.traverse(n=>{if(n.isMesh){n.geometry.dispose();n.material.dispose()}})}zombies.length=0}
function isNight(){return worldTime>=19*60||worldTime<5*60}
function canSpawnZombies(){const rule=$('zombieRule').value;return rule==='always'||(rule==='night'&&isNight())}
function updateZombies(dt){
 const max=Number($('zombieCount').value);
 if(!canSpawnZombies()||!max){if(zombies.length)clearZombies();$('zombieStatus').textContent='Zumbis: 0';return}
 zombieElapsed+=dt;
 if(zombieElapsed>.6&&zombies.length<max){zombieElapsed=0;const group=zombieMesh();const side=Math.floor(random()*4),edge=117,off=(random()-.5)*230;group.position.set(side===0?-edge:side===1?edge:off,0,side===2?-edge:side===3?edge:off);world.add(group);zombies.push({group,speed:.5+random()*.6,target:new THREE.Vector3((random()-.5)*45,0,(random()-.5)*45)})}
 for(const z of zombies){const delta=z.target.clone().sub(z.group.position);delta.y=0;if(delta.length()<2){z.target.set((random()-.5)*45,0,(random()-.5)*45);continue}z.group.position.addScaledVector(delta.normalize(),z.speed*dt);z.group.rotation.y=Math.atan2(delta.x,delta.z)}
 $('zombieStatus').textContent='Zumbis: '+zombies.length;
}
function updateClock(dt){
 if($('cycleMode').value==='auto'){
   worldTime=(worldTime+dt*1440/(Number($('cycleMinutes').value)*60))%1440;
   const hour=worldTime/60;
   const next=hour>=19||hour<5?'night':hour>=17?'dusk':'day';
   if($('period').value!==next){$('period').value=next;lighting()}
 }
 $('clockTime').textContent='Hora: '+String(Math.floor(worldTime/60)).padStart(2,'0')+':'+String(Math.floor(worldTime%60)).padStart(2,'0')+(isNight()?' • noite':'');
}
function build(){
 clearZombies();worldTime=8*60;zombieElapsed=0;clearWorld();seed=Math.max(1,Math.min(999999,Number($('seed').value)||2026));addRoads();generateBuildings();resetCars();
 $('state').textContent='Bairro Zero gerado • '+WORLD_SIZE+' × '+WORLD_SIZE+' m • '+(ticking?'trânsito ativo':'pausado');
 $('objects').textContent='Objetos: '+meta.length;
}
function lighting(){
 const mode=$('period').value,quality=$('quality').value;
 const params={day:['#a5c7d3',2.1,2.6,150,370],dusk:['#806a78',1.3,1.1,100,260],night:['#172735',.65,.45,55,170]}[mode];
 scene.background=new THREE.Color(params[0]);scene.fog.color.set(params[0]);scene.fog.near=params[3];scene.fog.far=params[4];hemi.intensity=params[1];sun.intensity=params[2];
 renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:quality==='medium'?1.35:1.75));
}
function exportData(){
 const data={format:'wmk-zombie-map',version:1,name:'Bairro Zero — Cidade Viva',world:{width:WORLD_SIZE,depth:WORLD_SIZE},objects:[...meta,{id:'spawn_player',name:'Jogador',type:'player',x:0,y:1,z:0,w:.75,h:1.7,d:.75,color:'#65cafa',solid:false}],roads:{format:'wmk-city-v1',loops:circuits},traffic:{enabled:true,count:vehicles.length,routes:'circuits',speedScale:Number($('speed').value)},citySimulation:{cycleMode:$('cycleMode').value,cycleMinutes:Number($('cycleMinutes').value),startTimeMinutes:Math.floor(worldTime),zombies:{rule:$('zombieRule').value,maxAlive:Number($('zombieCount').value)}},generatedBy:'WMK Cidade Viva CV-01',seed:Number($('seed').value)};
 return {...data,size:256,world:{width:256,depth:256}};
}
function download(){
 const data=exportData();
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='wmk-bairro-zero-'+seed+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2500);
 $('state').textContent='Mapa JSON exportado. Trânsito ainda requer motor Cidade Viva.';
}
function editCity(){
 try{
   const src=exportData();
   const name=prompt('Nome do NOVO mapa baseado no Bairro Zero:', 'Bairro Zero — minha versão');
   if(name===null)return;
   const copy={...src,name:String(name).trim().slice(0,70)||'Minha cidade', objects:src.objects.map(o=>({...o})), size:256};
   // Camada de ruas como geometria editável; todo objeto passa a ser selecionável no editor.
   let idx=1;
   for(const p of [-80,-25,30,85]){
      copy.objects.push({id:'road_x_'+idx++,name:'Via norte-sul',type:'floor',x:p,y:0.005,z:0,w:11,h:.09,d:244,ry:0,color:'#353c41',solid:false});
      copy.objects.push({id:'road_z_'+idx++,name:'Via leste-oeste',type:'floor',x:0,y:0.005,z:p,w:244,h:.09,d:11,ry:0,color:'#353c41',solid:false});
   }
   const draft={savedAt:Date.now(),map:copy};
   localStorage.setItem('wmk_city_edit_handoff_v1',JSON.stringify(draft));
   // Manter mapa atual: a importação só acontece no editor após clicar em editar.
   location.href='editor.html?fromCity=1';
 }catch(err){alert('Não foi possível abrir o editor: '+err.message)}
}
$('editCity').onclick=editCity;
function fit(){orbit.target.set(0,0,0);camera.position.set(145,125,145);orbit.update()}
$('zombieCount').oninput=()=>{$('zombieCountLabel').textContent=$('zombieCount').value};$('zombieRule').onchange=()=>{if(!canSpawnZombies())clearZombies()};$('cycleMode').onchange=()=>{if($('cycleMode').value==='manual')lighting()};$('generate').onclick=build;$('cars').oninput=resetCars;
$('speed').oninput=()=>{$('speedLabel').textContent=$('speed').value+'×'};
$('pause').onclick=()=>{ticking=!ticking;$('pause').textContent=ticking?'Pausar trânsito':'Continuar trânsito';$('state').textContent=ticking?'Trânsito ativo':'Trânsito pausado'};
$('export').onclick=download;$('fit').onclick=fit;$('resetCamera').onclick=fit;$('period').onchange=lighting;$('quality').onchange=lighting;
for(const panel of document.querySelectorAll('.panel')){
 const head=panel.querySelector('.head');let drag=null;head.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,left:panel.offsetLeft,top:panel.offsetTop};head.setPointerCapture(e.pointerId)});
 head.addEventListener('pointermove',e=>{if(!drag)return;panel.style.right='auto';panel.style.bottom='auto';panel.style.left=Math.max(0,Math.min(innerWidth-60,drag.left+e.clientX-drag.x))+'px';panel.style.top=Math.max(45,Math.min(innerHeight-60,drag.top+e.clientY-drag.y))+'px'});
 head.addEventListener('pointerup',()=>{drag=null;try{localStorage.setItem('wmk_city_panel_'+panel.id,JSON.stringify({left:panel.style.left,top:panel.style.top,width:panel.offsetWidth,height:panel.offsetHeight}))}catch{}});
 try{const saved=JSON.parse(localStorage.getItem('wmk_city_panel_'+panel.id)||'null');if(saved){panel.style.right='auto';panel.style.bottom='auto';for(const p of ['left','top'])if(saved[p])panel.style[p]=saved[p];if(saved.width)panel.style.width=saved.width+'px';if(saved.height)panel.style.height=saved.height+'px'}}catch{}
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
build();lighting();const clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);const dt=Math.min(.05,clock.getDelta());orbit.update();if(ticking){const scaled=dt*Number($('speed').value);updateTraffic(scaled);updateClock(scaled);updateZombies(scaled)}renderer.render(scene,camera)}animate();
