// WMK Workspace — janela flutuante, tamanho, visibilidade e layouts nomeados.
// Layouts são independentes entre editores e salvos neste navegador.
export function setupWorkspace({prefix,panels,toolbar,defaults,status}) {
  const key=prefix+':layouts:v1', last=prefix+':last:v1';
  const nodes=panels.map(id=>document.getElementById(id)).filter(Boolean);
  const $=id=>document.getElementById(id);
  const tell=(s)=>{if(status)status(s)};
  let topZ=30, saveTask;
  function all(){try {return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{return {}}}
  function capture(){const o={};for(const p of nodes){const r=p.getBoundingClientRect();o[p.id]={x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),hidden:p.hidden}}return o}
  function persist(){try{localStorage.setItem(last,JSON.stringify(capture()))}catch{tell('Armazenamento local indisponível. Exporte o layout JSON.')}}
  function defer(){clearTimeout(saveTask);saveTask=setTimeout(persist,150)}
  function apply(data){if(!data||typeof data!=='object')return;for(const p of nodes){const v=data[p.id];if(!v)continue;p.style.left=Math.max(0,Math.min(innerWidth-72,Number(v.x)||0))+'px';p.style.top=Math.max(48,Math.min(innerHeight-55,Number(v.y)||60))+'px';p.style.right='auto';p.style.bottom='auto';p.style.width=Math.max(220,Math.min(innerWidth-10,Number(v.w)||300))+'px';p.style.height=Math.max(140,Math.min(innerHeight-46,Number(v.h)||360))+'px';p.hidden=Boolean(v.hidden)}renderButtons();defer()}
  function renderButtons(){for(const p of nodes){const b=toolbar.querySelector('[data-toggle-panel="'+p.id+'"]');if(b){b.classList.toggle('off',p.hidden);b.setAttribute('aria-pressed',String(!p.hidden))}}}
  for(const p of nodes){p.classList.add('wmk-floating');let head=p.querySelector('.panelHead,.wmk-panel-head');if(!head){head=document.createElement('div');head.className='wmk-panel-head';head.textContent=p.dataset.title||p.id;p.prepend(head)}
    const hide=document.createElement('button');hide.type='button';hide.className='wmk-close';hide.title='Ocultar painel (restaurar pela barra superior)';hide.textContent='×';head.append(hide);hide.onclick=e=>{e.stopPropagation();p.hidden=true;renderButtons();defer()};
    p.addEventListener('pointerdown',()=>p.style.zIndex=String(++topZ));
    let drag=null;
    head.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,input,select,a'))return;const r=p.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};p.style.left=r.left+'px';p.style.top=r.top+'px';p.style.right='auto';p.style.bottom='auto';head.setPointerCapture(e.pointerId);e.preventDefault()});
    head.addEventListener('pointermove',e=>{if(!drag)return;p.style.left=Math.max(0,Math.min(innerWidth-70,e.clientX-drag.x))+'px';p.style.top=Math.max(48,Math.min(innerHeight-50,e.clientY-drag.y))+'px'});
    const end=()=>{if(drag){drag=null;defer()}};head.addEventListener('pointerup',end);head.addEventListener('pointercancel',end);
    new ResizeObserver(defer).observe(p);
    const b=document.createElement('button');b.type='button';b.dataset.togglePanel=p.id;b.className='wmk-toggle';b.textContent=p.dataset.title||head.firstChild?.textContent?.trim()||p.id;b.onclick=()=>{p.hidden=!p.hidden;renderButtons();defer()};toolbar.append(b)
  }
  const name=document.createElement('input');name.placeholder='Nome do layout';name.className='wmk-layout-name';name.maxLength=48;
  const list=document.createElement('select');list.className='wmk-layout-list';list.title='Layouts de trabalho';
  function refresh(){const old=list.value;list.replaceChildren(new Option('Layouts salvos',''));for(const n of Object.keys(all()).sort())list.add(new Option(n,n));list.value=old}
  function action(label,fn){let b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;toolbar.append(b)}
  toolbar.append(name,list);
  action('💾 Salvar layout',()=>{const n=name.value.trim()||'Meu layout';try{localStorage.setItem(key,JSON.stringify({...all(),[n]:capture()}));refresh();list.value=n;tell('Layout salvo: '+n)}catch(e){tell('Não foi possível salvar: '+e.message)}});
  action('📂 Carregar layout',()=>{const n=list.value;if(n&&all()[n]){apply(all()[n]);tell('Layout carregado: '+n)}});
  action('↩ Padrão',()=>{apply(defaults);tell('Layout padrão restaurado')});
  action('⬇ Layout JSON',()=>{const json=JSON.stringify({format:'wmk-workspace-layout',editor:prefix,panels:capture()},null,2);const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=prefix+'-layout.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)});
  const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.hidden=true;toolbar.append(file);
  action('⬆ Importar layout',()=>file.click());file.onchange=async()=>{try{const data=JSON.parse(await file.files[0].text());if(data.format!=='wmk-workspace-layout'||data.editor!==prefix)throw Error('Layout incompatível');apply(data.panels);tell('Layout importado')}catch(e){tell('Erro ao importar layout: '+e.message)}file.value=''};
  refresh();let saved=null;try{saved=JSON.parse(localStorage.getItem(last)||'null')}catch{}apply(saved||defaults);
  window.addEventListener('pagehide',persist);
  return {capture,apply,persist};
}
