import {allZombieTypes} from './zombie-types.js';
import {applyPrefabVisual,removePrefabVisual,PROCEDURAL_TYPES} from './prefab-visuals.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const $=s=>document.querySelector(s),scene=new THREE.Scene();scene.background=new THREE.Color('#293734');
scene.fog=new THREE.Fog('#293734',65,150);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,1000);camera.position.set(24,24,28);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;$('#viewport').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe8f4ff,0x324332,2));const sun=new THREE.DirectionalLight(0xffebbf,2.2);sun.position.set(-20,36,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(52,52),new THREE.MeshStandardMaterial({color:0x55645a,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.025;ground.receiveShadow=true;scene.add(ground);
let grid=new THREE.GridHelper(40,40,0x9fc7a0,0x6e8975);grid.position.y=.01;scene.add(grid);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,0,0);orbit.enableDamping=true;orbit.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.ROTATE,RIGHT:THREE.MOUSE.PAN};orbit.update();
const transform=new TransformControls(camera,renderer.domElement);scene.add(transform);
// Snap: posição em metros; rotação em 15 graus; escala em passos opcionais.
function configureSnap(){const enabled=$('#snapEnabled')?.checked??true;const step=Number($('#snapStep')?.value||1);transform.setTranslationSnap(enabled?step:null);transform.setRotationSnap(enabled?Math.PI/12:null);transform.setScaleSnap(enabled?.25:null)}transform.addEventListener('dragging-changed',e=>orbit.enabled=!e.value);
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let objects=[],selected=null,history=[],redo=[],counter=1,skipHistory=false;
const presets={floor:{w:8,h:.25,d:8,color:'#596463'},pillar:{w:.75,h:5,d:.75,color:'#7a8588'},beam:{w:6,h:.4,d:.5,color:'#475761'},pipe:{w:5,h:.4,d:.4,color:'#747f85'},tank:{w:2.5,h:3,d:2.5,color:'#617779'},machine:{w:3,h:1.8,d:2.3,color:'#5e7169'},shelf:{w:3,h:2.5,d:.75,color:'#866e55'},door:{w:1.5,h:2.5,d:.18,color:'#755948'},stairs:{w:3,h:1.6,d:3,color:'#7a827e'},fence:{w:5,h:2,d:.15,color:'#677d7b'},lamp:{w:.5,h:.4,d:.5,color:'#dbd9b0'},platform:{w:5,h:.35,d:5,color:'#657477'},wall:{w:5,h:3,d:.5,color:'#65746b'},crate:{w:1.8,h:1.8,d:1.8,color:'#886d48'},container:{w:6,h:2.6,d:2.7,color:'#46746e'},cover:{w:3,h:1.2,d:.8,color:'#888676'},building:{w:7,h:5,d:7,color:'#627176'},spawn:{w:.75,h:.75,d:.75,color:'#d64f3a'},player:{w:.75,h:1.7,d:.75,color:'#65cafa'},bombA:{w:1,h:.5,d:1,color:'#ffd468'},bombB:{w:1,h:.5,d:1,color:'#f2a261'}};
// Prefabs prontos: geometria autoral com opção de cor/roofColor/accentColor.
const TERROR_PRESETS={
 house:{w:8,h:5,d:7,color:'#b7a08c'},cottage:{w:6,h:4,d:6,color:'#cfbca4'},hauntedHouse:{w:10,h:7,d:9,color:'#777b73'},
 barn:{w:10,h:6,d:10,color:'#905c4c'},shack:{w:5,h:3,d:4,color:'#685a50'},shed:{w:5,h:3,d:5,color:'#788174'},
 fenceWood:{w:3,h:1.8,d:.2,color:'#7c6048'},picketFence:{w:3,h:1.2,d:.18,color:'#ded0b1'},fenceIron:{w:3,h:2,d:.18,color:'#576267'},gate:{w:3,h:2.3,d:.2,color:'#82715c'},
 tombstone:{w:1,h:1.4,d:.5,color:'#92958f'},graveCross:{w:.8,h:1.5,d:.5,color:'#929087'},mausoleum:{w:5,h:4,d:5,color:'#858982'},crypt:{w:4,h:3,d:4,color:'#757970'},
 coffin:{w:1.2,h:.55,d:2.1,color:'#6b4938'},deadTree:{w:2.4,h:5,d:2.4,color:'#555247'},streetLamp:{w:.8,h:5,d:.8,color:'#777a77'},
 well:{w:2.2,h:1.4,d:2.2,color:'#7f7e74'},barricadeWood:{w:3,h:1.5,d:.4,color:'#8f7051'},pumpkin:{w:.65,h:.6,d:.65,color:'#c47735'},
 porch:{w:4,h:3,d:2.2,color:'#907c6b'},rubble:{w:2,h:.7,d:2,color:'#77736d'}
};
Object.assign(presets,TERROR_PRESETS);
const MAP_SIZES=[40,80,160,320];let mapSize=40;
function setMapSize(v){
 const size=MAP_SIZES.includes(Number(v))?Number(v):40;mapSize=size;
 if($('#worldSize'))$('#worldSize').value=String(size);
 ground.geometry.dispose();ground.geometry=new THREE.PlaneGeometry(size+12,size+12);
 scene.remove(grid);grid.geometry.dispose();grid=new THREE.GridHelper(size,Math.max(10,size/2),0x9fc7a0,0x6e8975);grid.position.y=.01;scene.add(grid);
 orbit.maxDistance=Math.max(110,size*1.5);scene.fog.far=Math.max(150,size*2.2);
 camera.far=Math.max(700,size*3);camera.updateProjectionMatrix();
}
// Ferramentas de autoria acessíveis a iniciantes; preservam o formato JSON atual.
const LAYOUT_KEY='wmk_editor_layouts_v2';
function readLayouts(){try{const v=JSON.parse(localStorage.getItem(LAYOUT_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}}
function clampPanels(){for(const p of document.querySelectorAll('.panel')){let x=p.getBoundingClientRect().left,y=p.getBoundingClientRect().top;p.style.left=Math.max(0,Math.min(innerWidth-80,x))+'px';p.style.top=Math.max(50,Math.min(innerHeight-80,y))+'px';p.style.right='auto';p.style.bottom='auto'}}
function applyLayout(data){if(!data||!data.panels)return;for(const p of document.querySelectorAll('.panel')){const v=data.panels[p.id];if(!v)continue;p.style.left=Math.max(0,Math.min(innerWidth-80,Number(v.x)||0))+'px';p.style.top=Math.max(50,Math.min(innerHeight-80,Number(v.y)||60))+'px';p.style.right='auto';p.style.bottom='auto';if(v.w)p.style.width=Math.max(185,Math.min(innerWidth-20,Number(v.w)))+'px';if(v.h)p.style.height=Math.max(130,Math.min(innerHeight-40,Number(v.h)))+'px';p.hidden=!!v.hidden;localStorage.setItem('wmk_panel_'+p.id,JSON.stringify({x:parseInt(p.style.left),y:parseInt(p.style.top)}))}const target=data.target;if(Array.isArray(target)&&target.length===3){orbit.target.fromArray(target);orbit.update()}message('Layout restaurado.')}
function refreshLayoutList(){const el=$('#layoutList'),old=el.value;el.replaceChildren(new Option('— Layouts salvos —',''));for(const name of Object.keys(readLayouts()).sort())el.add(new Option(name,name));el.value=old}
function getLayout(){const panels={};for(const p of document.querySelectorAll('.panel')){const r=p.getBoundingClientRect();panels[p.id]={x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),hidden:p.hidden}}return {panels,target:orbit.target.toArray()}}
function setView(name){const target=orbit.target.clone();const dist=Math.max(10,camera.position.distanceTo(target));if(name==='top')camera.position.copy(target).add(new THREE.Vector3(0,dist,0.01));else if(name==='front')camera.position.copy(target).add(new THREE.Vector3(0,3,dist));else if(name==='side')camera.position.copy(target).add(new THREE.Vector3(dist,3,0));else camera.position.copy(target).add(new THREE.Vector3(dist*.7,dist*.65,dist*.7));camera.lookAt(target);orbit.update()}
function moveToGround(){if(!selected)return message('Selecione um objeto.');snapshot();const o=selected.userData.data;o.y=o.h/2;syncMesh(selected);refresh();message('Objeto apoiado no solo.')}
function edgeSnap(){if(!selected)return message('Selecione um objeto.');const a=selected.userData.data;let best=null;for(const m of objects){if(m===selected)continue;const b=m.userData.data;const candidates=[{axis:'x',value:b.x+(a.w+b.w)/2,diff:Math.abs(a.x-(b.x+(a.w+b.w)/2))},{axis:'x',value:b.x-(a.w+b.w)/2,diff:Math.abs(a.x-(b.x-(a.w+b.w)/2))},{axis:'z',value:b.z+(a.d+b.d)/2,diff:Math.abs(a.z-(b.z+(a.d+b.d)/2))},{axis:'z',value:b.z-(a.d+b.d)/2,diff:Math.abs(a.z-(b.z-(a.d+b.d)/2))}];for(const c of candidates)if(!best||c.diff<best.diff)best={...c,other:b.name}}if(!best)return message('Não existe outro objeto para encaixar.');snapshot();a[best.axis]=best.value;syncMesh(selected);refresh();message('Borda encaixada com '+best.other+' (sem calcular rotação).')}
function buildQuick(kind){const center={x:Math.round(orbit.target.x/2)*2,z:Math.round(orbit.target.z/2)*2};let specs=[];const part=(type,dx,dz,w,h,d)=>specs.push({type,x:center.x+dx,z:center.z+dz,w,h,d});
 if(kind==='corridor'){part('floor',0,0,4,.25,12);part('wall',-2,0,.3,3,12);part('wall',2,0,.3,3,12)}
 if(kind==='room'){part('floor',0,0,10,.25,10);part('wall',-5,0,.3,3,10);part('wall',5,0,.3,3,10);part('wall',0,-5,10,3,.3);part('wall',-3,5,4,3,.3);part('wall',3,5,4,3,.3);part('machine',1,0,2,1.8,2);part('shelf',-3,-2,2,2,.7)}
 if(kind==='loading'){part('floor',0,0,12,.25,8);part('platform',0,-3,10,.6,2);part('container',-3,1,5,2.6,2.7);part('container',4,1,5,2.6,2.7);part('crate',0,3,2,2,2)}
 if(kind==='snipe'){part('platform',0,0,5,.5,3);part('cover',-2,2,1.5,1.2,.5);part('cover',2,2,1.5,1.2,.5);part('fence',0,-1.5,5,1.5,.1)}
 if(!specs.length)return; if(objects.length+specs.length>1200)return message('Limite de 1200 objetos por mapa.');snapshot();for(const q of specs){const p=presets[q.type];const o=normal({...p,...q,id:'obj_'+counter++,name:q.type+'_kit_'+counter,y:q.h/2});objects.push(meshFor(o))}select(objects.at(-1));refresh();message('Kit inserido: '+kind+' ('+specs.length+' objetos).')}
const normal=o=>({id:String(o.id||`obj_${counter++}`),name:String(o.name||o.type).slice(0,60),type:Object.hasOwn(presets,o.type)?o.type:'crate',x:finite(o.x,0),y:finite(o.y,1),z:finite(o.z,0),w:clamp(o.w,.1,160,1),h:clamp(o.h,.1,80,1),d:clamp(o.d,.1,160,1),ry:finite(o.ry,0),color:/^#[0-9a-f]{6}$/i.test(o.color||'')?o.color:'#777777',roofColor:/^#[0-9a-f]{6}$/i.test(o.roofColor||'')?o.roofColor:'#5b4f4b',accentColor:/^#[0-9a-f]{6}$/i.test(o.accentColor||'')?o.accentColor:'#493c32',solid:['spawn','player','bombA','bombB','lamp'].includes(o.type)?false:o.solid!==false,zombieTypes:Array.isArray(o.zombieTypes)?o.zombieTypes.filter(x=>typeof x==='string'&&/^[a-z][a-z0-9_-]{1,35}$/.test(x)).slice(0,20):['comum'],spawnCount:clamp(o.spawnCount,1,20,1),spawnWeight:clamp(o.spawnWeight,1,100,1),minWave:clamp(o.minWave,1,100,1),model:validModel(o.model)?o.model:''});
function validModel(p){return typeof p==='string'&&/^assets\/models\/[a-z0-9_\/-]+\.glb$/i.test(p)&&!p.includes('..')&&p.length<160}
function finite(v,d){const n=Number(v);return Number.isFinite(n)?n:d}function clamp(v,min,max,d){return Math.max(min,Math.min(max,finite(v,d)))}
const gltfLoader=new GLTFLoader(),glbCache=new Map();
function meshFor(o){const marker=['spawn','player','bombA','bombB'].includes(o.type);let geo=marker?new THREE.ConeGeometry(.55,1.2,8):new THREE.BoxGeometry(1,1,1);let mat=new THREE.MeshStandardMaterial({color:o.color,roughness:.82,transparent:marker,opacity:marker?.8:1});let m=new THREE.Mesh(geo,mat);m.castShadow=!marker;m.receiveShadow=true;m.userData.data=o;scene.add(m);syncMesh(m);if(o.model)attachGLB(m,o.model);return m}
async function attachGLB(m,path,blobUrl=null){
 const old=m.userData.modelChild;if(old){m.remove(old);m.userData.modelChild=null}
 m.material.opacity=1;m.material.transparent=false;m.material.depthWrite=true;
 if(!path&&!blobUrl)return;
 try{
  const uri=blobUrl||path;
  let gltf=glbCache.get(uri);
  if(!gltf){gltf=await gltfLoader.loadAsync(uri);glbCache.set(uri,gltf)}
  if(!m.parent || (path && m.userData.data.model!==path))return;
  const child=gltf.scene.clone(true);child.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true}});
  const box=new THREE.Box3().setFromObject(child);const dim=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  child.position.sub(center);const wrapper=new THREE.Group();wrapper.add(child);wrapper.scale.set(1/Math.max(dim.x,.001),1/Math.max(dim.y,.001),1/Math.max(dim.z,.001));
  m.add(wrapper);m.userData.modelChild=wrapper;m.material.transparent=true;m.material.opacity=0;m.material.depthWrite=false;
  message('Modelo 3D carregado: '+(path||'prévia local'));
 }catch(e){message('GLB não carregou: '+e.message);console.error(e)}
}
function syncMesh(m){const o=m.userData.data;m.position.set(o.x,o.y,o.z);m.rotation.y=o.ry;m.scale.set(o.w,o.h,o.d);m.material.color.set(o.color);if(PROCEDURAL_TYPES.has(o.type)&&!o.model)applyPrefabVisual(m,o)}
function add(type,pos){snapshot();const p=presets[type];const o=normal({id:`obj_${counter++}`,name:`${type}_${counter}`,type,x:pos?.x??0,y:type==='spawn'?.8:type==='player'?1:p.h/2,z:pos?.z??0,...p});o.x=pos?.x??0;o.z=pos?.z??0;objects.push(meshFor(o));select(objects.at(-1));refresh();message('Objeto criado: '+o.name)}
function select(m){selected=m;$('#modelPath').value=m?.userData.data.model||'';transform.detach();if(m)transform.attach(m);$('#noSelection').hidden=!!m;$('#properties').hidden=!m;fillProperties();refreshList()}
function fillProperties(){if(!selected){$('#spawnOptions').hidden=true;return;}const o=selected.userData.data;
 $('#spawnOptions').hidden=o.type!=='spawn';if(o.type==='spawn'){
 const select=$('#propZombieTypes'),values=o.zombieTypes||['comum'];select.replaceChildren();
 for(const z of Object.values(allZombieTypes())){const op=new Option(z.name+' ['+z.id+']',z.id);op.selected=values.includes(z.id);select.add(op)}
 $('#propSpawnCount').value=o.spawnCount||1;$('#propSpawnWeight').value=o.spawnWeight||1;$('#propMinWave').value=o.minWave||1;
 }
$('#prefabColors').hidden=!PROCEDURAL_TYPES.has(o.type);$('#propRoofColor').value=o.roofColor||'#5b4f4b';$('#propAccentColor').value=o.accentColor||'#493c32';for(const [suffix,key] of [['Name','name'],['X','x'],['Y','y'],['Z','z'],['W','w'],['H','h'],['D','d'],['RY','ry'],['Color','color']])$('#prop'+suffix).value=key==='ry'?(o.ry*180/Math.PI).toFixed(1):o[key];$('#propSolid').checked=o.solid}
function refreshList(){const list=$('#objectList');list.replaceChildren();for(const m of objects){let b=document.createElement('button');b.textContent=`${m.userData.data.type==='spawn'?'☣':m.userData.data.type==='player'?'♙':'▣'} ${m.userData.data.name}`;b.className=m===selected?'active':'';b.onclick=()=>select(m);list.append(b)}$('#stats').textContent=`${objects.length} objetos | ${objects.filter(m=>m.userData.data.type==='spawn').length} spawns`}
function refresh(){refreshList();fillProperties();scheduleAutoSave()}
function dump(){return {format:'wmk-zombie-map',version:2,size:mapSize,name:$('#mapNameInput').value||'Meu mapa',objects:objects.map(m=>({...m.userData.data}))}}
function snapshot(){if(skipHistory)return;history.push(JSON.stringify(dump()));if(history.length>50)history.shift();redo=[];scheduleAutoSave()}
function clear(){select(null);for(const m of objects){scene.remove(m);m.geometry.dispose();m.material.dispose()}objects=[]}
function load(data,record=true){if(!data||data.format!=='wmk-zombie-map'||!Array.isArray(data.objects)||data.objects.length>1200)throw Error('Formato inválido (máximo 1200 objetos)');if(record)snapshot();clear();setMapSize(data.size||40);$('#mapNameInput').value=String(data.name||'Meu mapa').slice(0,70);for(const raw of data.objects){const o=normal(raw);objects.push(meshFor(o))}refresh();message('Mapa carregado com '+objects.length+' objetos')}
function undo(){if(!history.length)return;redo.push(JSON.stringify(dump()));load(JSON.parse(history.pop()),false)}function redoAction(){if(!redo.length)return;history.push(JSON.stringify(dump()));load(JSON.parse(redo.pop()),false)}
function remove(){if(!selected)return;snapshot();const m=selected;select(null);scene.remove(m);m.geometry.dispose();m.material.dispose();objects=objects.filter(x=>x!==m);refresh();message('Objeto excluído')}
function duplicate(){if(!selected)return;snapshot();let d={...selected.userData.data,id:`obj_${counter++}`,name:selected.userData.data.name+'_copia',x:selected.userData.data.x+1.5,z:selected.userData.data.z+1.5};objects.push(meshFor(normal(d)));select(objects.at(-1));refresh()}
function message(s){$('#message').textContent=s}
// Rascunho de recuperação: alterações do editor não se perdem ao atualizar a página.
const MAP_KEY='wmk_zombie_custom_map';
const DRAFT_KEY='wmk_zombie_editor_draft_v1';
let autosaveTimer=null;
let editorReady=false;
function persistDraft(){
  if(!editorReady)return;
  try{
    localStorage.setItem(DRAFT_KEY,JSON.stringify({savedAt:Date.now(),map:dump()}));
    $('#saveIndicator').textContent='Rascunho salvo automaticamente';
  }catch(err){
    $('#saveIndicator').textContent='⚠ Sem espaço/permissão para salvamento automático';
    console.error('Falha no salvamento automático:',err);
  }
}
function scheduleAutoSave(){
  if(!editorReady)return;
  $('#saveIndicator').textContent='Alterações pendentes…';
  clearTimeout(autosaveTimer);
  autosaveTimer=setTimeout(persistDraft,350);
}
function persistNow(){clearTimeout(autosaveTimer);persistDraft()}

let transforming=false;transform.addEventListener('mouseDown',()=>{snapshot();transforming=true});transform.addEventListener('mouseUp',()=>{transforming=false;if(selected){syncData(selected);refresh()}});transform.addEventListener('objectChange',()=>{if(selected){syncData(selected);fillProperties()}});
function syncData(m){const o=m.userData.data;o.x=+m.position.x.toFixed(3);o.y=+m.position.y.toFixed(3);o.z=+m.position.z.toFixed(3);o.ry=+m.rotation.y.toFixed(4);o.w=Math.max(.1,+m.scale.x.toFixed(3));o.h=Math.max(.1,+m.scale.y.toFixed(3));o.d=Math.max(.1,+m.scale.z.toFixed(3));scheduleAutoSave()}
for(const [suffix,key] of [['Name','name'],['X','x'],['Y','y'],['Z','z'],['W','w'],['H','h'],['D','d'],['RY','ry'],['Color','color'],['Solid','solid']]){const el=$('#prop'+suffix);el.addEventListener('change',()=>{if(!selected)return;snapshot();const o=selected.userData.data;let v=key==='solid'?el.checked:key==='name'?el.value.slice(0,60):key==='color'?el.value:finite(el.value,o[key]);if(key==='ry')v=v*Math.PI/180;if(['w','h','d'].includes(key))v=clamp(v,.1,160,o[key]);o[key]=v;syncMesh(selected);refresh()})}
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>add(b.dataset.add,{x:Math.round(orbit.target.x),z:Math.round(orbit.target.z)}));
for(const prop of ['RoofColor','AccentColor'])$('#prop'+prop).addEventListener('change',()=>{if(!selected)return;snapshot();selected.userData.data[prop==='RoofColor'?'roofColor':'accentColor']=$('#prop'+prop).value;syncMesh(selected);refresh()});
$('#worldSize').addEventListener('change',()=>{snapshot();setMapSize($('#worldSize').value);refresh();message('Terreno atualizado para '+mapSize+' × '+mapSize+' metros virtuais')});
$('#focusWorld').onclick=()=>{orbit.target.set(0,0,0);camera.position.set(mapSize*.65,mapSize*.67,mapSize*.65);orbit.update()};
$('#remove').onclick=remove;$('#duplicate').onclick=duplicate;
$('#toggleGrid').onclick=()=>{grid.visible=!grid.visible;$('#toggleGrid').textContent='Grade: '+(grid.visible?'ligada':'desligada')};
$('#newMap').onclick=()=>{if(!confirm('Criar outro mapa? O mapa atual será mantido como último salvo somente se você clicou em Salvar no navegador ou Exportar JSON.'))return;snapshot();clear();$('#mapNameInput').value='Novo mapa';setMapSize($('#worldSize').value);add('player',{x:0,z:14});add('spawn',{x:-14,z:-14});add('spawn',{x:14,z:-14});persistNow();message('Mapa novo criado')};
function saveLocal(){
  persistNow();
  try{
    localStorage.setItem(MAP_KEY,JSON.stringify(dump()));
    message('Mapa salvo no navegador! Ele será mantido após atualizar a página.');
    return true;
  }catch(err){
    message('ERRO ao salvar: '+err.message+' — exporte JSON para backup.');
    console.error('Falha ao salvar mapa:',err);
    return false;
  }
}
$('#saveLocal').onclick=e=>{e.preventDefault();saveLocal()};$('#test').onclick=e=>{e.preventDefault();if(saveLocal())location.href='index.html?map=custom'};
$('#download').onclick=e=>{e.preventDefault();saveLocal();const blob=new Blob([JSON.stringify(dump(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='wmk-mapa-'+(dump().name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').slice(0,36)||'novo')+'.json';document.body.appendChild(a);a.click();a.remove();message('JSON exportado e cópia de segurança gravada no navegador');setTimeout(()=>URL.revokeObjectURL(url),2000)};
$('#import').onclick=e=>{e.preventDefault();$('#file').click()};$('#file').onchange=async e=>{try{const file=e.target.files[0];if(file){load(JSON.parse(await file.text()));persistNow();message('JSON importado. Clique em Salvar no navegador ou Testar no jogo.')}}catch(err){alert('Falha ao importar: '+err.message)}e.target.value=''};
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0||transform.dragging||transform.axis)return;pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(objects,true);let root=hits[0]?.object;while(root&&!objects.includes(root))root=root.parent;select(root||null)});
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(e.ctrlKey&&e.code==='KeyZ'){e.preventDefault();undo()}else if(e.ctrlKey&&e.code==='KeyY'){e.preventDefault();redoAction()}else if(e.ctrlKey&&e.code==='KeyD'){e.preventDefault();duplicate()}else if(e.code==='Delete'){remove()}else if(e.code==='KeyG'){transform.setMode('translate')}else if(e.code==='KeyR'){transform.setMode('rotate')}else if(e.code==='KeyS'){transform.setMode('scale')}else if(e.code==='Numpad7'){setView('top')}else if(e.code==='Numpad1'){setView('front')}else if(e.code==='Numpad3'){setView('side')}else if(e.code==='KeyF'&&selected){orbit.target.copy(selected.position);camera.position.copy(selected.position).add(new THREE.Vector3(7,7,9))}});
// Drag dos painéis e persistência de layout
for(const panel of document.querySelectorAll('.panel')){const head=panel.querySelector('.panelHead');try{const xy=JSON.parse(localStorage.getItem('wmk_panel_'+panel.id)||'null');if(xy){panel.style.left=xy.x+'px';panel.style.top=xy.y+'px';panel.style.right='auto';panel.style.bottom='auto'}}catch{}let dragging=false,dx=0,dy=0;head.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;const r=panel.getBoundingClientRect();panel.style.left=r.left+'px';panel.style.top=r.top+'px';panel.style.right='auto';panel.style.bottom='auto';dx=e.clientX-r.left;dy=e.clientY-r.top;head.setPointerCapture(e.pointerId)});head.addEventListener('pointermove',e=>{if(!dragging)return;panel.style.left=Math.max(0,Math.min(innerWidth-60,e.clientX-dx))+'px';panel.style.top=Math.max(50,Math.min(innerHeight-70,e.clientY-dy))+'px'});head.addEventListener('pointerup',()=>{dragging=false;localStorage.setItem('wmk_panel_'+panel.id,JSON.stringify({x:parseInt(panel.style.left),y:parseInt(panel.style.top)}))})}
configureSnap();$('#snapEnabled').onchange=configureSnap;$('#snapStep').onchange=configureSnap;
$('#toolMove').onclick=()=>transform.setMode('translate');$('#toolRotate').onclick=()=>transform.setMode('rotate');$('#toolScale').onclick=()=>transform.setMode('scale');$('#placeGround').onclick=moveToGround;$('#alignEdge').onclick=edgeSnap;
$('#viewTop').onclick=()=>setView('top');$('#cameraPreset').onchange=e=>setView(e.target.value);
document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>buildQuick(b.dataset.quick));
$('#layoutSave').onclick=()=>{const name=$('#layoutName').value.trim().slice(0,48)||'Meu layout';try{const all=readLayouts();all[name]=getLayout();localStorage.setItem(LAYOUT_KEY,JSON.stringify(all));refreshLayoutList();$('#layoutList').value=name;message('Layout salvo: '+name)}catch(e){message('Falha ao salvar layout: '+e.message)}};
$('#layoutLoad').onclick=()=>{const name=$('#layoutList').value;const data=readLayouts()[name];if(data)applyLayout(data);else message('Escolha um layout salvo.')};
$('#layoutDefault').onclick=()=>{for(const p of document.querySelectorAll('.panel')){p.hidden=false;const isLeft=p.id==='panelObjects'||p.id==='panelScene';p.style.left=isLeft?'14px':Math.max(0,innerWidth-310)+'px';p.style.top=p.id==='panelScene'?'520px':p.id==='panelHelp'?Math.max(60,innerHeight-280)+'px':'66px';p.style.right='auto';p.style.bottom='auto';p.style.width=isLeft?'376px':'266px';localStorage.setItem('wmk_panel_'+p.id,JSON.stringify({x:parseInt(p.style.left),y:parseInt(p.style.top)}))}message('Layout padrão restaurado.')};refreshLayoutList();

// Barra de visibilidade; todos os painéis podem ser escondidos/mostrados.
const visibilityBar=$('#visibilityBar');
function syncVisibility(){for(const p of document.querySelectorAll('.panel')){const b=visibilityBar.querySelector('[data-panel="'+p.id+'"]');if(b){b.style.opacity=p.hidden?'.5':'1';b.setAttribute('aria-pressed',String(!p.hidden))}}}
for(const p of document.querySelectorAll('.panel')){
  const head=p.querySelector('.panelHead');const b=document.createElement('button');b.type='button';b.className='wmk-close';b.title='Ocultar painel';b.textContent='×';head.append(b);
  b.onclick=e=>{e.stopPropagation();p.hidden=true;syncVisibility();localStorage.setItem('wmk_editor_last_workspace',JSON.stringify(getLayout()))};
  const toggle=document.createElement('button');toggle.type='button';toggle.dataset.panel=p.id;toggle.textContent=p.id==='panelObjects'?'Biblioteca':p.id==='panelScene'?'Hierarquia':p.id==='panelProperties'?'Propriedades':'Atalhos';toggle.onclick=()=>{p.hidden=!p.hidden;syncVisibility();localStorage.setItem('wmk_editor_last_workspace',JSON.stringify(getLayout()))};visibilityBar.append(toggle);
  new ResizeObserver(()=>{if(editorReady)localStorage.setItem('wmk_editor_last_workspace',JSON.stringify(getLayout()))}).observe(p);
}
try{const saved=JSON.parse(localStorage.getItem('wmk_editor_last_workspace')||'null');if(saved)applyLayout(saved)}catch{}
syncVisibility();
// Layout padrão é um projeto de interface, não altera os objetos do mapa.
const _oldSave=$('#layoutSave').onclick;$('#layoutSave').onclick=()=>{_oldSave();localStorage.setItem('wmk_editor_last_workspace',JSON.stringify(getLayout()))};
const _oldLoad=$('#layoutLoad').onclick;$('#layoutLoad').onclick=()=>{_oldLoad();syncVisibility();localStorage.setItem('wmk_editor_last_workspace',JSON.stringify(getLayout()))};
const _oldDefault=$('#layoutDefault').onclick;$('#layoutDefault').onclick=()=>{_oldDefault();syncVisibility();localStorage.setItem('wmk_editor_last_workspace',JSON.stringify(getLayout()))};

function insertEnvironmentKit(type){
 const cx=Math.round(orbit.target.x),cz=Math.round(orbit.target.z),specs=[];
 const put=(id,x,z,ry=0,extra={})=>specs.push({type:id,x:cx+x,z:cz+z,ry,...extra});
 if(type==='casa'){put('house',0,0);put('porch',0,5);for(let x=-7;x<=7;x+=3.5){put('picketFence',x,-6);if(Math.abs(x)>2)put('picketFence',x,7)}for(let z=-3;z<=3;z+=3){put('fenceWood',-8,z,Math.PI/2);put('fenceWood',8,z,Math.PI/2)}put('gate',0,7)}
 if(type==='cemiterio'){put('mausoleum',0,-7);for(let z=-1;z<=9;z+=3.1)for(const x of [-8,-4,4,8])put((Math.abs(x)+Math.round(z))%3===0?'graveCross':'tombstone',x,z);for(let x=-12;x<=12;x+=3)put('fenceIron',x,-13);for(const z of [-10,-7,-4,-1,2,5,8,11]){put('fenceIron',-13,z,Math.PI/2);put('fenceIron',13,z,Math.PI/2)}put('gate',0,13);put('deadTree',-10,-8);put('deadTree',11,-5);put('streetLamp',-2,3)}
 if(type==='fazenda'){put('cottage',-7,0);put('barn',8,-4);put('well',-1,7);put('shed',10,9);for(let x=-15;x<=15;x+=3){put('fenceWood',x,-14);put('fenceWood',x,15)}for(let z=-11;z<=12;z+=3){put('fenceWood',-16,z,Math.PI/2);put('fenceWood',16,z,Math.PI/2)}put('gate',0,15)}
 if(type==='rua'){for(const x of [-9,9])for(const z of [-12,0,12])put(z===0?'hauntedHouse':'house',x,z,x<0?Math.PI/2:-Math.PI/2);for(const z of [-14,0,14]){put('streetLamp',-3,z);put('streetLamp',3,z)}put('barricadeWood',0,10);put('rubble',2,-6)}
 if(objects.length+specs.length>1200)return message('O kit excede o máximo de 1200 objetos.');
 snapshot();for(const q of specs){const p=presets[q.type],o=normal({...p,...q,id:'obj_'+counter++,name:q.type+'_'+counter,y:p.h/2});objects.push(meshFor(o))}select(objects.at(-1));refresh();message('Cenário inserido: '+type+' ('+specs.length+' peças independentes, cores editáveis)');
}
document.querySelectorAll('[data-horror-kit]').forEach(b=>b.addEventListener('click',()=>insertEnvironmentKit(b.dataset.horrorKit)));
$('#mapNameInput').addEventListener('input',scheduleAutoSave);
window.addEventListener('pagehide',persistNow);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
let initial=null;
try{
  const draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
  const committed=JSON.parse(localStorage.getItem(MAP_KEY)||'null');
  initial=draft?.map?.format==='wmk-zombie-map'?draft.map:committed;
}catch(err){console.warn('Não foi possível restaurar o mapa salvo:',err)}
if(initial){try{load(initial,false)}catch{initial=null}}
if(!initial){skipHistory=true;add('player',{x:0,z:14});add('spawn',{x:-13,z:-13});add('spawn',{x:13,z:-13});add('container',{x:-6,z:0});add('wall',{x:5,z:0});skipHistory=false;history=[]}
editorReady=true;
persistNow();
if(initial)message('Mapa recuperado automaticamente ('+objects.length+' objetos).');

// Voo de inspeção: Shift+F para entrar, WASD/QE para voar, mouse para olhar, Esc para sair.
let fly=false,flyKeys=new Set(),flyLast=performance.now();
const flyInfo=document.createElement('div');flyInfo.style.cssText='position:fixed;bottom:38px;left:50%;transform:translateX(-50%);z-index:9;background:#103b36;color:#d9f5cc;padding:8px;border-radius:6px;display:none';flyInfo.textContent='VOO LIVRE: WASD mover, Q descer, E subir, mouse olhar, Esc sair';document.body.append(flyInfo);
function stopFly(){fly=false;document.exitPointerLock?.();orbit.enabled=true;flyInfo.style.display='none';flyKeys.clear()}
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(e.shiftKey&&e.code==='KeyF'&&!fly){e.preventDefault();fly=true;orbit.enabled=false;flyInfo.style.display='block';renderer.domElement.requestPointerLock().catch(()=>stopFly());return}if(fly){flyKeys.add(e.code);if(e.code==='Escape')stopFly();e.stopImmediatePropagation()}},true);
window.addEventListener('keyup',e=>flyKeys.delete(e.code));
document.addEventListener('pointerlockchange',()=>{if(fly&&document.pointerLockElement!==renderer.domElement)stopFly()});
document.addEventListener('mousemove',e=>{if(!fly)return;const angles=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');angles.y-=e.movementX*.0025;angles.x=Math.max(-1.5,Math.min(1.5,angles.x-e.movementY*.0025));camera.quaternion.setFromEuler(angles)});
function animate(){requestAnimationFrame(animate);const now=performance.now(),dt=Math.min(.05,(now-flyLast)/1000);flyLast=now;
 if(fly){const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize().negate();const speed=flyKeys.has('ShiftLeft')?14:7;const d=new THREE.Vector3();if(flyKeys.has('KeyW'))d.add(forward);if(flyKeys.has('KeyS'))d.sub(forward);if(flyKeys.has('KeyD'))d.add(right);if(flyKeys.has('KeyA'))d.sub(right);if(flyKeys.has('KeyE'))d.y++;if(flyKeys.has('KeyQ'))d.y--;if(d.lengthSq())camera.position.addScaledVector(d.normalize(),speed*dt);orbit.target.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(8))}else orbit.update();renderer.render(scene,camera)}animate();

// Integração com a pasta local, mediante autorização expressa do usuário.
let linkedFolder=null;
const fileChoice=document.querySelector('#folderMaps');
async function refreshFolder(){
  fileChoice.replaceChildren(new Option('— Arquivos JSON da pasta —',''));
  if(!linkedFolder)return;
  for await(const [name,handle] of linkedFolder.entries()){
    if(handle.kind==='file' && /^[a-z0-9_-]+\.json$/i.test(name) && name!=='index.json')fileChoice.add(new Option(name,name));
  }
  message('Pasta vinculada. '+(fileChoice.options.length-1)+' mapas encontrados.');
}
$('#folderPick').onclick=async()=>{
  if(!window.showDirectoryPicker){message('Seu navegador não permite acesso à pasta. Use Exportar/Importar JSON.');return}
  try{linkedFolder=await showDirectoryPicker({id:'wmk-mapas',mode:'readwrite'});await refreshFolder()}
  catch(err){if(err.name!=='AbortError')message('Permissão ou pasta indisponível: '+err.message)}
};
$('#folderSave').onclick=async()=>{
  if(!linkedFolder){message('Clique antes em Vincular pasta mapas/.');return}
  const name=($('#mapNameInput').value||'mapa').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)||'mapa';
  try{const handle=await linkedFolder.getFileHandle(name+'.json',{create:true});const stream=await handle.createWritable();await stream.write(JSON.stringify(dump(),null,2));await stream.close();saveLocal();await refreshFolder();message('Salvo na pasta: '+name+'.json. Para aparecer no menu do FPS, acrescente o nome a mapas/index.json.');}
  catch(err){message('Não foi possível gravar: '+err.message)}
};
$('#folderOpen').onclick=async()=>{
  if(!linkedFolder||!fileChoice.value){message('Vincule a pasta e escolha um JSON no seletor.');return}
  try{const file=await(await linkedFolder.getFileHandle(fileChoice.value)).getFile();load(JSON.parse(await file.text()));persistNow();message('Mapa importado: '+file.name)}catch(err){message('Falha ao importar: '+err.message)}
};

// Prefabs: são dados paramétricos e referências de assets, nunca JavaScript executável.
const PREFAB_KEY='wmk_zombie_prefabs_v1';
function readPrefabs(){try{const p=JSON.parse(localStorage.getItem(PREFAB_KEY)||'{}');return p&&typeof p==='object'&&!Array.isArray(p)?p:{}}catch{return {}}}
function refreshPrefabs(){const sel=$('#prefabList'),old=sel.value;sel.replaceChildren(new Option('— Prefabs —',''));for(const name of Object.keys(readPrefabs()).sort())sel.add(new Option(name,name));sel.value=old}
function downloadData(data,name){const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500)}
$('#savePrefab').onclick=()=>{if(!selected)return message('Selecione um objeto.');const name=prompt('Nome do prefab:',selected.userData.data.name);if(!name)return;const key=name.trim().slice(0,50);if(!key)return;const all=readPrefabs();all[key]={format:'wmk-prefab',version:1,object:{...selected.userData.data}};localStorage.setItem(PREFAB_KEY,JSON.stringify(all));refreshPrefabs();$('#prefabList').value=key;message('Prefab salvo: '+key)};
$('#insertPrefab').onclick=()=>{const data=readPrefabs()[$('#prefabList').value];if(!data)return message('Selecione um prefab.');const o=normal({...data.object,id:`obj_${counter++}`,x:orbit.target.x,y:data.object.y,z:orbit.target.z});snapshot();objects.push(meshFor(o));select(objects.at(-1));refresh();message('Prefab inserido: '+o.name)};
$('#exportPrefab').onclick=()=>{const name=$('#prefabList').value,data=readPrefabs()[name];if(data)downloadData(data,'prefab-'+name.replace(/[^a-z0-9_-]+/gi,'-')+'.json');else message('Selecione um prefab.')};
$('#importPrefab').onclick=()=>$('#prefabFile').click();$('#prefabFile').onchange=async e=>{try{const f=e.target.files[0];if(!f||f.size>100000)return message('Arquivo vazio ou acima de 100 KB');const data=JSON.parse(await f.text());if(data.format!=='wmk-prefab'||!data.object||!Object.hasOwn(presets,data.object.type))throw Error('Prefab inválido');const all=readPrefabs(),name=String(data.object.name||'Importado').slice(0,50);all[name]={format:'wmk-prefab',version:1,object:normal(data.object)};localStorage.setItem(PREFAB_KEY,JSON.stringify(all));refreshPrefabs();$('#prefabList').value=name;message('Prefab importado: '+name)}catch(err){message('Erro ao importar prefab: '+err.message)}e.target.value=''};
$('#importGlb').onclick=()=>{if(!selected)return message('Selecione primeiro um objeto.');$('#glbFile').click()};
$('#glbFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(file.size>25*1024*1024)return message('Modelo maior que 25 MB. Otimize o GLB no Blender.');if(!/\.glb$/i.test(file.name))return message('Use arquivo .glb.');const safe=file.name.toLowerCase().replace(/[^a-z0-9_.-]/g,'-');const path='assets/models/'+safe;const url=URL.createObjectURL(file);snapshot();const m=selected;m.userData.data.model=path;$('#modelPath').value=path;await attachGLB(m,path,url);refresh();message('Prévia importada. Copie '+safe+' para assets/models/ antes de publicar ou reabrir o mapa.');e.target.value=''};
$('#applyModelPath').onclick=()=>{if(!selected)return message('Selecione objeto.');const path=$('#modelPath').value.trim();if(!validModel(path))return message('Caminho permitido: assets/models/nome.glb');snapshot();selected.userData.data.model=path;attachGLB(selected,path);refresh()};
$('#clearModelPath').onclick=()=>{if(!selected)return;snapshot();selected.userData.data.model='';$('#modelPath').value='';attachGLB(selected,'');refresh();message('Modelo geométrico restaurado')};
refreshPrefabs();

// Tipos de zumbis associados a cada ponto de spawn (WMK Zombie Studio).
$('#propZombieTypes').addEventListener('change',()=>{if(!selected||selected.userData.data.type!=='spawn')return;snapshot();const v=[...$('#propZombieTypes').selectedOptions].map(x=>x.value);selected.userData.data.zombieTypes=v.length?v:['comum'];refresh()});
for(const [key,id] of [['spawnCount','propSpawnCount'],['spawnWeight','propSpawnWeight'],['minWave','propMinWave']])$('#'+id).addEventListener('change',()=>{if(!selected||selected.userData.data.type!=='spawn')return;snapshot();const limits=key==='minWave'?[1,100]:key==='spawnWeight'?[1,100]:[1,20];selected.userData.data[key]=Math.max(limits[0],Math.min(limits[1],Math.trunc(Number($('#'+id).value)||1)));refresh()});
$('#spawnAll').onclick=()=>{if(!selected||selected.userData.data.type!=='spawn')return;snapshot();selected.userData.data.zombieTypes=Object.keys(allZombieTypes());refresh()};
