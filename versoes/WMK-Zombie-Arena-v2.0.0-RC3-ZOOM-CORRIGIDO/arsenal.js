import {setupZoomUI} from './zoom-controls.js';
import {WEAPONS} from './weapons.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {setupWorkspace} from './workspace.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DEFAULT_BAZUCA,loadCommunityWeapons,saveCommunityWeapon} from './custom-weapons.js';
const $=id=>document.getElementById(id);let current={...DEFAULT_BAZUCA};
const ids=['id','name','mechanic','type','slot','price','damage','magazine','reserve','reload','cooldown','spread','movementSpread','headMultiplier','pellets','length','projectileSpeed','blastRadius','modelPath','modelScale'];
const nfields=new Set(['price','damage','magazine','reserve','reload','cooldown','spread','movementSpread','headMultiplier','pellets','length','projectileSpeed','blastRadius','modelScale']);
function put(w){current={...w};for(const id of ids)$(id).value=w[id]??'';refreshModel();}
function read(){return {...current,...Object.fromEntries(ids.map(id=>[id,nfields.has(id)?Number($(id).value):$(id).value]))};}
function message(s){$('message').textContent=s}
function refreshList(){const area=$('list');area.replaceChildren();for(const w of loadCommunityWeapons()){const btn=document.createElement('button');btn.className='secondary';btn.textContent=w.name+' · '+w.id;btn.onclick=()=>put(w);area.append(btn)}if(!area.children.length)area.textContent='Nenhuma arma instalada.'}
$('save').onclick=()=>{try{const w=saveCommunityWeapon(read());put(w);refreshList();updateBases();message('Arma registrada! Recarregue o jogo e abra B → 9.')}catch(e){message('Erro: '+e.message)}};
$('export').onclick=()=>{try{const w=read(),blob=new Blob([JSON.stringify(w,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(w.id||'arma')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('JSON exportado (sem o arquivo GLB).')}catch(e){message(e.message)}};
$('import').onclick=()=>$('file').click();$('file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const w=JSON.parse(await file.text());const valid=saveCommunityWeapon(w);put(valid);refreshList();message('JSON importado e arma registrada no jogo.')}catch(error){message('JSON inválido: '+error.message)}e.target.value=''};
$('preset').onclick=()=>put(DEFAULT_BAZUCA);
function slug(v){return String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,30)}
const base=$('baseWeapon');
function updateBases(){base.replaceChildren();for(const [id,w] of Object.entries({...WEAPONS,...Object.fromEntries(loadCommunityWeapons().map(w=>[w.id,w]))})){const o=new Option(w.name+' · '+id,id);base.add(o)}}
$('duplicate').onclick=()=>{const all={...WEAPONS,...Object.fromEntries(loadCommunityWeapons().map(w=>[w.id,w]))},id=base.value,w=all[id];if(!w)return;
 const next={...w,id:'nova_'+slug(id).slice(0,24),name:w.name+' (cópia)',mechanic:w.mechanic||'hitscan',modelPath:w.modelPath||'',modelScale:w.modelScale||1,projectileSpeed:w.projectileSpeed||22,blastRadius:w.blastRadius||3};
 put(next);message('Cópia criada em memória. Altere ID e parâmetros, depois clique Salvar no jogo. A arma original permanece intacta.');};
updateBases();

const wrap=$('preview'),scene=new THREE.Scene();scene.background=new THREE.Color('#101b1e');const camera=new THREE.PerspectiveCamera(50,1,.1,100);camera.position.set(3,2.2,4);const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));wrap.append(renderer.domElement);scene.add(new THREE.HemisphereLight(0xeaf3e5,0x455146,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,7,4);scene.add(light);
const pivot=new THREE.Group();scene.add(pivot);const mat=new THREE.MeshStandardMaterial({color:0x586c47,metalness:.35,roughness:.6});function fallback(){const body=new THREE.Mesh(new THREE.CylinderGeometry(.14,.19,2,14),mat);body.rotation.z=Math.PI/2;pivot.add(body);const cone=new THREE.Mesh(new THREE.ConeGeometry(.24,.48,14),mat);cone.rotation.z=-Math.PI/2;cone.position.x=1.18;pivot.add(cone);const stock=new THREE.Mesh(new THREE.BoxGeometry(.55,.3,.25),mat);stock.position.x=-.9;pivot.add(stock)}
let previewToken=0;function refreshModel(){++previewToken;const token=previewToken;pivot.clear();fallback();pivot.scale.setScalar(Number($('modelScale').value)||1);const path=$('modelPath').value.trim();if(path&&/^assets\/models\/[a-z0-9_./-]+\.glb$/i.test(path)&&!path.includes('..'))new GLTFLoader().load('./'+path,g=>{if(token!==previewToken)return;pivot.clear();pivot.add(g.scene)},undefined,()=>message('GLB ainda não encontrado. Usando modelo provisório.'))}
$('modelPath').onchange=refreshModel;$('modelScale').oninput=()=>pivot.scale.setScalar(Number($('modelScale').value)||1);$('glbFile').onchange=e=>{const file=e.target.files[0];if(!file)return;const url=URL.createObjectURL(file);new GLTFLoader().load(url,g=>{pivot.clear();pivot.add(g.scene);URL.revokeObjectURL(url);message('Prévia carregada. Copie esse GLB para assets/models/ e informe o caminho.')},undefined,err=>{URL.revokeObjectURL(url);message('Falha ao ler GLB: '+err.message)})};

// Câmera estilo Blender: MMB orbit, Shift+MMB pan, wheel zoom. Gizmos reais Three.js.
const orbit=new OrbitControls(camera,renderer.domElement);
orbit.target.set(0,0,0);orbit.enableDamping=true;
orbit.mouseButtons={LEFT:null,MIDDLE:THREE.MOUSE.ROTATE,RIGHT:THREE.MOUSE.PAN};
const transform=new TransformControls(camera,renderer.domElement);
setupZoomUI({camera,orbit,baseDistance:5.2,minDistance:.5,maxDistance:45,focus:()=>{orbit.target.set(0,0,0);camera.position.set(3,2.2,4);orbit.update()},key:'wmk-arsenal-zoom',right:'360px',top:'64px'});scene.add(transform);transform.attach(pivot);
transform.addEventListener('dragging-changed',e=>orbit.enabled=!e.value);
const grid=new THREE.GridHelper(12,24,0x779981,0x314d43);grid.position.y=-.8;scene.add(grid);
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button===1&&e.shiftKey){orbit.mouseButtons.MIDDLE=THREE.MOUSE.PAN}else if(e.button===1)orbit.mouseButtons.MIDDLE=THREE.MOUSE.ROTATE},true);
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
const report=s=>{$('workspaceStatus').textContent=s};
const toolbar=$('arsenalToolbar');
const workspace=setupWorkspace({prefix:'wmk-arsenal',panels:['panelGun','panelModel','panelLibrary'],toolbar,
 status:report,defaults:{panelGun:{x:14,y:65,w:310,h:Math.round(innerHeight*.72),hidden:false},panelModel:{x:innerWidth-350,y:65,w:330,h:Math.round(innerHeight*.48),hidden:false},panelLibrary:{x:innerWidth-350,y:Math.round(innerHeight*.57),w:330,h:Math.round(innerHeight*.3),hidden:false}}});
// Botões de gizmo e snap são independentes das configurações de dano.
function addTool(text,fn){const b=document.createElement('button');b.textContent=text;b.type='button';b.onclick=fn;toolbar.append(b);return b}
addTool('G • Mover',()=>transform.setMode('translate'));
addTool('R • Girar',()=>transform.setMode('rotate'));
addTool('S • Escalar',()=>transform.setMode('scale'));
let snap=true;
const snapBtn=addTool('🧲 Snap: ligado',()=>{snap=!snap;snapBtn.textContent='🧲 Snap: '+(snap?'ligado':'desligado');applySnap()});
function applySnap(){transform.setTranslationSnap(snap?.25:null);transform.setRotationSnap(snap?Math.PI/12:null);transform.setScaleSnap(snap?.1:null)}applySnap();
function setView(axis){const d=4;const t=orbit.target;if(axis==='top')camera.position.copy(t).add(new THREE.Vector3(0,d,.001));else if(axis==='front')camera.position.copy(t).add(new THREE.Vector3(0,0,d));else if(axis==='side')camera.position.copy(t).add(new THREE.Vector3(d,0,0));camera.lookAt(t);orbit.update()}
const activeKeys=new Set();
addEventListener('keydown',e=>{
 if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)||e.ctrlKey||e.altKey)return;
 if(e.code==='KeyG')transform.setMode('translate');
 if(e.code==='KeyR')transform.setMode('rotate');
 if(e.code==='KeyS')transform.setMode('scale');
 if(e.code==='KeyF'){orbit.target.set(0,0,0);camera.position.set(3,2.2,4);orbit.update()}
 if(e.code==='Numpad7')setView('top');if(e.code==='Numpad1')setView('front');if(e.code==='Numpad3')setView('side');
 if(['KeyX','KeyY','KeyZ'].includes(e.code)){const axis=e.code.slice(-1);transform.showX=axis==='X';transform.showY=axis==='Y';transform.showZ=axis==='Z'}
 if(e.code==='Escape'){transform.showX=true;transform.showY=true;transform.showZ=true}
});
function frame(){requestAnimationFrame(frame);const w=wrap.clientWidth,h=wrap.clientHeight;
 if(w&&h&&(renderer.domElement.width!==Math.floor(w*renderer.getPixelRatio())||renderer.domElement.height!==Math.floor(h*renderer.getPixelRatio()))){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 orbit.update();renderer.render(scene,camera)}
put(loadCommunityWeapons()[0]||DEFAULT_BAZUCA);refreshList();frame();
