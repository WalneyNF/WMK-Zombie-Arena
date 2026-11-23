import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {WEAPONS} from './weapons.js';
import {loadCommunityWeapons} from './custom-weapons.js';
import {loadCommunitySkins,saveCommunitySkin,removeCommunitySkin} from './custom-skins.js';
import {setupWorkspace} from './workspace.js';
const $=id=>document.getElementById(id), W=512;
const cv=$('paintCanvas'), ctx=cv.getContext('2d',{willReadFrequently:true});
const status=s=>{$('skinStatus').textContent=s};
let layers=[],selected=0,brush='brush',painting=false,history=[],redo=[],uv=null;
const mkLayer=(name)=>{const c=document.createElement('canvas');c.width=c.height=W;return {name,canvas:c,visible:true}};
function initial(){layers=[mkLayer('Cor de fundo'),mkLayer('Detalhes')];layers[0].canvas.getContext('2d').fillStyle='#4d6951';layers[0].canvas.getContext('2d').fillRect(0,0,W,W);selected=1;sync()}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function flatten(){ctx.clearRect(0,0,W,W);for(const l of layers)if(l.visible)ctx.drawImage(l.canvas,0,0);previewSkin()}
function sync(){const el=$('layers');el.replaceChildren();layers.forEach((l,i)=>{let box=document.createElement('div');box.className='layer'+(i===selected?' active':'');let check=document.createElement('input');check.type='checkbox';check.checked=l.visible;check.onchange=()=>{l.visible=check.checked;flatten()};let b=document.createElement('button');b.textContent=l.name;b.onclick=()=>{selected=i;sync()};box.append(check,b);el.append(box)});flatten()}
function capture(){return layers.map(l=>({name:l.name,visible:l.visible,image:l.canvas.toDataURL('image/png')}))}
function snapshot(){history.push(capture());if(history.length>15)history.shift();redo=[]}
async function restore(state){layers=[];for(const item of state){const l=mkLayer(item.name);l.visible=item.visible;await drawDataURL(l.canvas,item.image);layers.push(l)}selected=Math.min(selected,layers.length-1);sync()}
function drawDataURL(canvas,url){return new Promise((resolve,reject)=>{let img=new Image();img.onload=()=>{let c=canvas.getContext('2d');c.clearRect(0,0,W,W);c.drawImage(img,0,0,W,W);resolve()};img.onerror=reject;img.src=url})}
async function undo(){if(!history.length)return;redo.push(capture());await restore(history.pop())}
async function redoStep(){if(!redo.length)return;history.push(capture());await restore(redo.pop())}
$('undo').onclick=undo;$('redo').onclick=redoStep;
for(const b of document.querySelectorAll('[data-tool]'))b.onclick=()=>{brush=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('selected',x===b))};
$('brushSize').oninput=()=>{$('brushValue').textContent=$('brushSize').value};
function xy(e){const r=cv.getBoundingClientRect();return [clamp(Math.floor((e.clientX-r.left)*W/r.width),0,W-1),clamp(Math.floor((e.clientY-r.top)*W/r.height),0,W-1)]}
function paint(e,start=false){const [x,y]=xy(e),l=layers[selected],c=l.canvas.getContext('2d',{willReadFrequently:true}),size=+$('brushSize').value;
 if(brush==='picker'){const p=ctx.getImageData(x,y,1,1).data;$('paintColor').value='#'+[...p].slice(0,3).map(t=>t.toString(16).padStart(2,'0')).join('');painting=false;return}
 if(brush==='fill'){if(start){const rgba=c.getImageData(0,0,W,W),p=rgba.data,idx=(y*W+x)*4,target=[...p.slice(idx,idx+4)];const rgb=$('paintColor').value.match(/\w\w/g).map(n=>parseInt(n,16));const replacement=[...rgb,255];if(target.every((v,i)=>v===replacement[i]))return;
 const q=[y*W+x],seen=new Uint8Array(W*W);let count=0;while(q.length){const pos=q.pop();if(seen[pos])continue;seen[pos]=1;const k=pos*4;if(p[k]!==target[0]||p[k+1]!==target[1]||p[k+2]!==target[2]||p[k+3]!==target[3])continue;p.set(replacement,k);const cx=pos%W,cy=(pos/W)|0;if(cx>0)q.push(pos-1);if(cx<W-1)q.push(pos+1);if(cy>0)q.push(pos-W);if(cy<W-1)q.push(pos+W);if(++count>W*W)break}c.putImageData(rgba,0,0);flatten()}return}
 c.save();c.lineCap='round';c.lineJoin='round';c.lineWidth=size;c.globalCompositeOperation=brush==='eraser'?'destination-out':'source-over';c.strokeStyle=$('paintColor').value;
 if(start){c.beginPath();c.arc(x,y,size/2,0,Math.PI*2);c.fillStyle=$('paintColor').value;if(brush==='eraser'){c.clearRect(x-size/2,y-size/2,size,size)}else c.fill()}
 else {c.beginPath();c.moveTo(paint.prev[0],paint.prev[1]);c.lineTo(x,y);c.stroke()}c.restore();paint.prev=[x,y];flatten()}
cv.onpointerdown=e=>{if(e.button!==0)return;cv.setPointerCapture(e.pointerId);snapshot();painting=true;paint(e,true)};
cv.onpointermove=e=>{if(painting)paint(e)};
cv.onpointerup=()=>painting=false;cv.onpointercancel=()=>painting=false;
$('addLayer').onclick=()=>{snapshot();layers.push(mkLayer('Camada '+(layers.length+1)));selected=layers.length-1;sync()};
$('deleteLayer').onclick=()=>{if(layers.length<2)return;snapshot();layers.splice(selected,1);selected=Math.min(selected,layers.length-1);sync()};
$('moveLayerUp').onclick=()=>{if(selected>=layers.length-1)return;snapshot();[layers[selected],layers[selected+1]]=[layers[selected+1],layers[selected]];selected++;sync()};
$('moveLayerDown').onclick=()=>{if(selected<=0)return;snapshot();[layers[selected],layers[selected-1]]=[layers[selected-1],layers[selected]];selected--;sync()};
$('clearLayer').onclick=()=>{snapshot();layers[selected].canvas.getContext('2d').clearRect(0,0,W,W);flatten()};
function download(name,blob){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500)}
$('exportPng').onclick=()=>cv.toBlob(b=>download(($('skinId').value||'skin')+'.png',b),'image/png');
$('importPng').onclick=()=>$('pngFile').click();
$('pngFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>4e6){status('PNG maior que 4 MB');return}snapshot();const u=URL.createObjectURL(f);try{await drawDataURL(layers[selected].canvas,u);sync()}finally{URL.revokeObjectURL(u);e.target.value=''}};
$('importUv').onclick=()=>$('uvFile').click();$('uvFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const u=URL.createObjectURL(f);let img=new Image();img.onload=()=>{uv=img;URL.revokeObjectURL(u);status('Guia UV carregada para referência; não é gravada sobre a textura.');e.target.value=''};img.src=u};
const weaponList={...WEAPONS,...Object.fromEntries(loadCommunityWeapons().map(w=>[w.id,w]))};for(const [id,w] of Object.entries(weaponList))$('weaponId').add(new Option(w.name+' · '+id,id));
$('weaponId').value='ak47';
const scene=new THREE.Scene();scene.background=new THREE.Color('#142322');scene.add(new THREE.HemisphereLight('#d9f5e3','#4e5655',2.1));const sunlight=new THREE.DirectionalLight(0xffffff,2);sunlight.position.set(5,6,7);scene.add(sunlight);
const camera=new THREE.PerspectiveCamera(48,1,.1,100);camera.position.set(3,2.3,4.3);let renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));$('viewport').append(renderer.domElement);const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.mouseButtons={LEFT:null,MIDDLE:THREE.MOUSE.ROTATE,RIGHT:THREE.MOUSE.PAN};renderer.domElement.addEventListener('pointerdown',e=>{if(e.button===1)orbit.mouseButtons.MIDDLE=e.shiftKey?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE},true);
const group=new THREE.Group();scene.add(group);let previewMat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.65,metalness:.3});let currentModel=null,previewVer=0;
function fallback(){group.clear();const box=(w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),previewMat);m.position.set(x,y,z);group.add(m)};box(1.25,.22,.24,0,0,0);box(.38,.4,.15,-.3,-.29,0);box(.1,.1,.75,.65,0,0);box(.35,.17,.2,-.7,-.08,0);currentModel=group}
function previewSkin(){if(!previewMat)return;const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;const old=previewMat.map;previewMat.map=texture;previewMat.needsUpdate=true;old?.dispose();}
function updateMaterial(){previewMat.roughness=+$('roughness').value;previewMat.metalness=+$('metalness').value;$('roughnessValue').textContent=$('roughness').value;$('metalnessValue').textContent=$('metalness').value;previewMat.color.set('#ffffff')}
$('roughness').oninput=updateMaterial;$('metalness').oninput=updateMaterial;
function loadPreview(path){let version=++previewVer;fallback();if(!path)return;if(!/^assets\/models\/[a-z0-9_./-]+\.glb$/i.test(path)||path.includes('..')){status('Use GLB local em assets/models/.');return}new GLTFLoader().load('./'+path,g=>{if(version!==previewVer)return;group.clear();group.add(g.scene);g.scene.traverse(o=>{if(o.isMesh){o.material=previewMat}});currentModel=g.scene},undefined,err=>status('GLB não encontrado; mantida prévia geométrica.'))}
$('loadGameModel').onclick=()=>loadPreview($('modelPath').value.trim());
$('glbFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const u=URL.createObjectURL(f);new GLTFLoader().load(u,g=>{group.clear();group.add(g.scene);g.scene.traverse(o=>{if(o.isMesh)o.material=previewMat});status('Prévia local carregada. Para publicar, coloque o GLB em assets/models/.');URL.revokeObjectURL(u)},undefined,err=>{status('GLB inválido: '+err.message);URL.revokeObjectURL(u)})};
$('weaponId').onchange=()=>{$('modelPath').value=weaponList[$('weaponId').value]?.modelPath||'';loadPreview($('modelPath').value);refreshLibrary()};
function skinPayload(){return {id:$('skinId').value.trim(),name:$('skinName').value.trim(),weaponId:$('weaponId').value,image:cv.toDataURL('image/png'),base:$('metalColor').value,roughness:+$('roughness').value,metalness:+$('metalness').value}}
$('saveSkin').onclick=()=>{try{saveCommunitySkin(skinPayload());refreshLibrary();status('Skin salva neste navegador! Reabra o jogo, compre a arma pelo menu B e selecione a skin.')}catch(e){status('Erro ao salvar: '+e.message)}};
$('exportSkin').onclick=()=>{try{const data=skinPayload();download(data.id+'.json',new Blob([JSON.stringify({format:'wmk-weapon-skin-v1',...data},null,2)],{type:'application/json'}));status('JSON exportado; a imagem está embutida.')}catch(e){status(e.message)}};
$('importSkin').onclick=()=>$('skinFile').click();$('skinFile').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());$('weaponId').value=d.weaponId;$('skinId').value=d.id;$('skinName').value=d.name;$('roughness').value=d.roughness;$('metalness').value=d.metalness;await drawDataURL(layers[selected].canvas,d.image);updateMaterial();sync();status('Skin carregada; clique Salvar no jogo para registrar.')}catch(err){status('Importação inválida: '+err.message)}e.target.value=''};
let chosenSkin=null;function refreshLibrary(){const el=$('library');el.replaceChildren();for(const s of loadCommunitySkins().filter(x=>x.weaponId===$('weaponId').value)){const b=document.createElement('button');b.className='skin-entry';b.textContent=s.name+' · '+s.id;b.onclick=async()=>{chosenSkin=s;$('skinId').value=s.id;$('skinName').value=s.name;$('roughness').value=s.roughness;$('metalness').value=s.metalness;await drawDataURL(layers[selected].canvas,s.image);sync();updateMaterial()};el.append(b)}}
$('deleteSkin').onclick=()=>{if(!chosenSkin)return;removeCommunitySkin(chosenSkin.weaponId,chosenSkin.id);chosenSkin=null;refreshLibrary();status('Skin local excluída.')};
function resize(){const el=$('viewport'),w=el.clientWidth,h=el.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}}
addEventListener('resize',resize);function animate(){requestAnimationFrame(animate);orbit.update();renderer.render(scene,camera)}
setupWorkspace({prefix:'wmk-skins',panels:['panelPaint','panelSkins','panelLayers','panelMaterial'],toolbar:$('skinToolbar'),status:s=>$('workspaceStatus').textContent=s,defaults:{panelPaint:{x:12,y:62,w:460,h:Math.round(innerHeight*.78)},panelSkins:{x:innerWidth-315,y:62,w:300,h:Math.round(innerHeight*.53)},panelLayers:{x:innerWidth-315,y:Math.round(innerHeight*.59),w:300,h:Math.round(innerHeight*.32)},panelMaterial:{x:480,y:70,w:265,h:Math.round(innerHeight*.4)}}});
initial();updateMaterial();loadPreview('');refreshLibrary();resize();animate();
