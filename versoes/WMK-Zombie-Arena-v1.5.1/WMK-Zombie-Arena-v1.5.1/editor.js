import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
const $=s=>document.querySelector(s),scene=new THREE.Scene();scene.background=new THREE.Color('#293734');
scene.fog=new THREE.Fog('#293734',65,150);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,250);camera.position.set(24,24,28);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;$('#viewport').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe8f4ff,0x324332,2));const sun=new THREE.DirectionalLight(0xffebbf,2.2);sun.position.set(-20,36,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshStandardMaterial({color:0x55645a,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.025;ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(40,40,0x9fc7a0,0x6e8975);grid.position.y=.01;scene.add(grid);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,0,0);orbit.enableDamping=true;orbit.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.PAN,RIGHT:THREE.MOUSE.ROTATE};orbit.update();
const transform=new TransformControls(camera,renderer.domElement);scene.add(transform);transform.addEventListener('dragging-changed',e=>orbit.enabled=!e.value);
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let objects=[],selected=null,history=[],redo=[],counter=1,skipHistory=false;
const presets={wall:{w:5,h:3,d:.5,color:'#65746b'},crate:{w:1.8,h:1.8,d:1.8,color:'#886d48'},container:{w:6,h:2.6,d:2.7,color:'#46746e'},cover:{w:3,h:1.2,d:.8,color:'#888676'},building:{w:7,h:5,d:7,color:'#627176'},spawn:{w:.75,h:.75,d:.75,color:'#d64f3a'},player:{w:.75,h:1.7,d:.75,color:'#65cafa'},bombA:{w:1,h:.5,d:1,color:'#ffd468'},bombB:{w:1,h:.5,d:1,color:'#f2a261'}};
const normal=o=>({id:String(o.id||`obj_${counter++}`),name:String(o.name||o.type).slice(0,60),type:Object.hasOwn(presets,o.type)?o.type:'crate',x:finite(o.x,0),y:finite(o.y,1),z:finite(o.z,0),w:clamp(o.w,.1,80,1),h:clamp(o.h,.1,30,1),d:clamp(o.d,.1,80,1),ry:finite(o.ry,0),color:/^#[0-9a-f]{6}$/i.test(o.color||'')?o.color:'#777777',solid:['spawn','player','bombA','bombB'].includes(o.type)?false:o.solid!==false});
function finite(v,d){const n=Number(v);return Number.isFinite(n)?n:d}function clamp(v,min,max,d){return Math.max(min,Math.min(max,finite(v,d)))}
function meshFor(o){const marker=['spawn','player','bombA','bombB'].includes(o.type);let geo=marker?new THREE.ConeGeometry(.55,1.2,8):new THREE.BoxGeometry(1,1,1);let mat=new THREE.MeshStandardMaterial({color:o.color,roughness:.82,transparent:marker,opacity:marker?.8:1});let m=new THREE.Mesh(geo,mat);m.castShadow=!marker;m.receiveShadow=true;m.userData.data=o;scene.add(m);syncMesh(m);return m}
function syncMesh(m){const o=m.userData.data;m.position.set(o.x,o.y,o.z);m.rotation.y=o.ry;m.scale.set(o.w,o.h,o.d);m.material.color.set(o.color)}
function add(type,pos){snapshot();const p=presets[type];const o=normal({id:`obj_${counter++}`,name:`${type}_${counter}`,type,x:pos?.x??0,y:type==='spawn'?.8:type==='player'?1:p.h/2,z:pos?.z??0,...p});o.x=pos?.x??0;o.z=pos?.z??0;objects.push(meshFor(o));select(objects.at(-1));refresh();message('Objeto criado: '+o.name)}
function select(m){selected=m;transform.detach();if(m)transform.attach(m);$('#noSelection').hidden=!!m;$('#properties').hidden=!m;fillProperties();refreshList()}
function fillProperties(){if(!selected)return;const o=selected.userData.data;for(const [suffix,key] of [['Name','name'],['X','x'],['Y','y'],['Z','z'],['W','w'],['H','h'],['D','d'],['RY','ry'],['Color','color']])$('#prop'+suffix).value=key==='ry'?(o.ry*180/Math.PI).toFixed(1):o[key];$('#propSolid').checked=o.solid}
function refreshList(){const list=$('#objectList');list.replaceChildren();for(const m of objects){let b=document.createElement('button');b.textContent=`${m.userData.data.type==='spawn'?'☣':m.userData.data.type==='player'?'♙':'▣'} ${m.userData.data.name}`;b.className=m===selected?'active':'';b.onclick=()=>select(m);list.append(b)}$('#stats').textContent=`${objects.length} objetos | ${objects.filter(m=>m.userData.data.type==='spawn').length} spawns`}
function refresh(){refreshList();fillProperties();scheduleAutoSave()}
function dump(){return {format:'wmk-zombie-map',version:1,name:$('#mapNameInput').value||'Meu mapa',objects:objects.map(m=>({...m.userData.data}))}}
function snapshot(){if(skipHistory)return;history.push(JSON.stringify(dump()));if(history.length>50)history.shift();redo=[];scheduleAutoSave()}
function clear(){select(null);for(const m of objects){scene.remove(m);m.geometry.dispose();m.material.dispose()}objects=[]}
function load(data,record=true){if(!data||data.format!=='wmk-zombie-map'||!Array.isArray(data.objects)||data.objects.length>500)throw Error('Formato inválido (máximo 500 objetos)');if(record)snapshot();clear();$('#mapNameInput').value=String(data.name||'Meu mapa').slice(0,70);for(const raw of data.objects){const o=normal(raw);objects.push(meshFor(o))}refresh();message('Mapa carregado com '+objects.length+' objetos')}
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
for(const [suffix,key] of [['Name','name'],['X','x'],['Y','y'],['Z','z'],['W','w'],['H','h'],['D','d'],['RY','ry'],['Color','color'],['Solid','solid']]){const el=$('#prop'+suffix);el.addEventListener('change',()=>{if(!selected)return;snapshot();const o=selected.userData.data;let v=key==='solid'?el.checked:key==='name'?el.value.slice(0,60):key==='color'?el.value:finite(el.value,o[key]);if(key==='ry')v=v*Math.PI/180;if(['w','h','d'].includes(key))v=clamp(v,.1,80,o[key]);o[key]=v;syncMesh(selected);refresh()})}
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>add(b.dataset.add,{x:Math.round(orbit.target.x),z:Math.round(orbit.target.z)}));$('#remove').onclick=remove;$('#duplicate').onclick=duplicate;
$('#toggleGrid').onclick=()=>{grid.visible=!grid.visible;$('#toggleGrid').textContent='Grade: '+(grid.visible?'ligada':'desligada')};
$('#newMap').onclick=()=>{if(!confirm('Criar outro mapa? O mapa atual será mantido como último salvo somente se você clicou em Salvar no navegador ou Exportar JSON.'))return;snapshot();clear();$('#mapNameInput').value='Novo mapa';add('player',{x:0,z:14});add('spawn',{x:-14,z:-14});add('spawn',{x:14,z:-14});persistNow();message('Mapa novo criado')};
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
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0||transform.dragging||transform.axis)return;pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(objects,false);select(hits.length?hits[0].object:null)});
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(e.ctrlKey&&e.code==='KeyZ'){e.preventDefault();undo()}else if(e.ctrlKey&&e.code==='KeyY'){e.preventDefault();redoAction()}else if(e.ctrlKey&&e.code==='KeyD'){e.preventDefault();duplicate()}else if(e.code==='Delete'){remove()}else if(e.code==='KeyW'){transform.setMode('translate')}else if(e.code==='KeyE'){transform.setMode('rotate')}else if(e.code==='KeyR'){transform.setMode('scale')}else if(e.code==='KeyF'&&selected){orbit.target.copy(selected.position);camera.position.copy(selected.position).add(new THREE.Vector3(7,7,9))}});
// Drag dos painéis e persistência de layout
for(const panel of document.querySelectorAll('.panel')){const head=panel.querySelector('.panelHead');try{const xy=JSON.parse(localStorage.getItem('wmk_panel_'+panel.id)||'null');if(xy){panel.style.left=xy.x+'px';panel.style.top=xy.y+'px';panel.style.right='auto';panel.style.bottom='auto'}}catch{}let dragging=false,dx=0,dy=0;head.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;const r=panel.getBoundingClientRect();panel.style.left=r.left+'px';panel.style.top=r.top+'px';panel.style.right='auto';panel.style.bottom='auto';dx=e.clientX-r.left;dy=e.clientY-r.top;head.setPointerCapture(e.pointerId)});head.addEventListener('pointermove',e=>{if(!dragging)return;panel.style.left=Math.max(0,Math.min(innerWidth-60,e.clientX-dx))+'px';panel.style.top=Math.max(50,Math.min(innerHeight-70,e.clientY-dy))+'px'});head.addEventListener('pointerup',()=>{dragging=false;localStorage.setItem('wmk_panel_'+panel.id,JSON.stringify({x:parseInt(panel.style.left),y:parseInt(panel.style.top)}))})}
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
function animate(){requestAnimationFrame(animate);orbit.update();renderer.render(scene,camera)}animate();

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
