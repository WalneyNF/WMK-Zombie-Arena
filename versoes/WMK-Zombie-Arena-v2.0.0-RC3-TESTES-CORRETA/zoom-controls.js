/** WMK Zoom 3D — controle unico de distancia para os estudios.
 * O percentual e relativo a uma distancia de referencia, nao ao FOV.
 * A roda do mouse continua a cargo de OrbitControls (IN = deltaY negativo).
 */
export function setupZoomUI({camera,orbit,baseDistance,minDistance=0.6,maxDistance=100,focus,key='wmk-zoom',right='320px',top='60px'}) {
  const getBase=()=>Math.max(0.2, Number(typeof baseDistance==='function'?baseDistance():baseDistance)||5);
  const getMax=()=>Math.max(minDistance+1,Number(typeof maxDistance==='function'?maxDistance():maxDistance)||100);
  orbit.enableZoom=true;
  orbit.zoomSpeed=0.85;
  orbit.minDistance=minDistance;
  orbit.maxDistance=getMax();
  orbit.zoomToCursor=false;
  const style=document.createElement('style');
  style.textContent=`.wmk-zoom-ui{position:fixed;z-index:80;top:60px;right:14px;background:#112925ef;border:1px solid #648e78;border-radius:9px;padding:8px;color:#e6f4e9;box-shadow:0 8px 22px #0008;font:12px system-ui;min-width:210px;max-width:min(320px,95vw)}.wmk-zoom-ui .wmk-zoom-handle{cursor:move;user-select:none;color:#b9ef9c;font-weight:700;padding:2px 3px 7px}.wmk-zoom-ui .wmk-zoom-row{display:flex;align-items:center;gap:5px;flex-wrap:wrap}.wmk-zoom-ui button,.wmk-zoom-ui select,.wmk-zoom-ui input{box-sizing:border-box;background:#24463b;color:#efffee;border:1px solid #668c76;border-radius:4px;padding:5px;font:12px system-ui}.wmk-zoom-ui button{cursor:pointer}.wmk-zoom-ui input{width:65px}.wmk-zoom-ui select{width:69px}.wmk-zoom-ui .wmk-zoom-status{display:block;color:#acc9bc;padding-top:5px}`;
  document.head.append(style);
  const pane=document.createElement('aside');pane.className='wmk-zoom-ui';pane.setAttribute('aria-label','Zoom do editor 3D');pane.style.right=right;pane.style.top=top;
  pane.innerHTML=`<div class="wmk-zoom-handle">⠿ ZOOM 3D · arraste</div><div class="wmk-zoom-row"><button type="button" data-z="out" title="Afastar (Zoom OUT)">−</button><select aria-label="Zoom predefinido"><option value="25">25%</option><option value="50">50%</option><option value="75">75%</option><option value="100">100%</option><option value="150">150%</option><option value="200">200%</option><option value="400">400%</option></select><input type="number" min="10" max="800" step="5" aria-label="Zoom percentual"><span>%</span><button type="button" data-z="in" title="Aproximar (Zoom IN)">+</button><button type="button" data-z="fit" title="Enquadrar terreno ou objeto">Ajustar</button></div><small class="wmk-zoom-status">Roda para aproximar / afastar</small>`;
  document.body.append(pane);
  const sel=pane.querySelector('select'),inp=pane.querySelector('input'),status=pane.querySelector('small');
  const distance=()=>camera.position.distanceTo(orbit.target);
  const percent=()=>Math.round(100*getBase()/Math.max(.0001,distance()));
  function sync(){orbit.minDistance=minDistance;orbit.maxDistance=getMax();const p=percent();inp.value=String(Math.min(800,Math.max(10,p)));const choices=[...sel.options].map(o=>Number(o.value));sel.value=choices.includes(p)?String(p):'';status.textContent=`Distância: ${distance().toFixed(1)} u · Roda: IN / OUT`;}
  function setPercent(p){if(!Number.isFinite(p))return;const next=Math.min(getMax(),Math.max(minDistance,getBase()*100/Math.max(10,Math.min(800,p))));const dir=camera.position.clone().sub(orbit.target);if(dir.lengthSq()<1e-8)dir.set(1,.4,1);dir.normalize().multiplyScalar(next);camera.position.copy(orbit.target).add(dir);camera.lookAt(orbit.target);orbit.update();sync();}
  sel.addEventListener('change',()=>{if(sel.value)setPercent(Number(sel.value))});
  inp.addEventListener('change',()=>setPercent(Number(inp.value)));
  pane.querySelector('[data-z="in"]').onclick=()=>setPercent(percent()*1.25);
  pane.querySelector('[data-z="out"]').onclick=()=>setPercent(percent()/1.25);
  pane.querySelector('[data-z="fit"]').onclick=()=>{if(typeof focus==='function')focus();else setPercent(100);sync()};
  const saveKey=key+'.panel';
  try{const p=JSON.parse(localStorage.getItem(saveKey)||'null');if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){pane.style.right='auto';pane.style.left=Math.max(0,Math.min(innerWidth-220,p.x))+'px';pane.style.top=Math.max(4,Math.min(innerHeight-90,p.y))+'px'}}catch{}
  let drag=null;const head=pane.querySelector('.wmk-zoom-handle');
  head.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=pane.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};head.setPointerCapture(e.pointerId);e.preventDefault()});
  head.addEventListener('pointermove',e=>{if(!drag)return;pane.style.right='auto';pane.style.left=Math.max(0,Math.min(innerWidth-180,drag.left+e.clientX-drag.x))+'px';pane.style.top=Math.max(4,Math.min(innerHeight-70,drag.top+e.clientY-drag.y))+'px'});
  function endDrag(){if(!drag)return;drag=null;try{localStorage.setItem(saveKey,JSON.stringify({x:pane.offsetLeft,y:pane.offsetTop}))}catch{}}
  head.addEventListener('pointerup',endDrag);head.addEventListener('pointercancel',endDrag);
  orbit.addEventListener('change',sync);
  sync();
  return {sync,setPercent,focus:()=>pane.querySelector('[data-z="fit"]').click()};
}
