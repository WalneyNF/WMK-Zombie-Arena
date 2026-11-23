// WMK Backup Center v1 — guarda dados locais do mesmo dominio, sem backend.
const PREFIXES=['wmk_']; const EXACT=['wmk_zombie_custom_map'];
const MAX_FILE_BYTES=8*1024*1024,MAX_ENTRY_CHARS=2*1024*1024,MAX_ITEMS=250;
const BLOCKED=/(?:token|secret|api[_-]?key|password|credential|authorization|auth[_-]?|session|private[_-]?key)/i;
const $=id=>document.getElementById(id);
const text=(id,value)=>{$(id).textContent=value};
const permitted=key=>typeof key==='string'&&(PREFIXES.some(p=>key.startsWith(p))||EXACT.includes(key))&&!BLOCKED.test(key)&&key.length<=160;
const bytes=s=>new TextEncoder().encode(s).byteLength;
const selected=()=>[...document.querySelectorAll('input[name="entry"]:checked')].map(input=>input.value);
function entries(){
 const result=[];for(let i=0;i<localStorage.length;i++){
  const key=localStorage.key(i);if(!permitted(key))continue;
  const value=localStorage.getItem(key);if(value===null)continue;
  result.push({key,value,size:bytes(value)});
 }
 return result.sort((a,b)=>a.key.localeCompare(b.key));
}
const classify=key=>/wallet|economy|shop/i.test(key)?'Economia / loja':/map|city|prefab/i.test(key)?'Mapas / cidade':/layout|panel|workspace/i.test(key)?'Painéis / layouts':/weapon|arsenal|skin|zombie|avatar/i.test(key)?'Criações / editores':'Outros dados WMK';
function render(){
 const list=$('entries');list.replaceChildren();let data=[];
 try{data=entries()}catch(err){text('status','Não foi possível acessar o armazenamento local: '+err.message);return}
 let total=0;
 for(const item of data){
  total+=item.size;const label=document.createElement('label');label.className='item';
  const input=document.createElement('input');input.type='checkbox';input.name='entry';input.value=item.key;input.checked=true;
  const body=document.createElement('span');const b=document.createElement('b');b.textContent=item.key;
  const sub=document.createElement('small');sub.textContent=classify(item.key)+' • '+(item.size/1024).toFixed(1)+' KB';body.append(b,sub);label.append(input,body);list.append(label);
 }
 text('summary',data.length+' registros encontrados · '+(total/1024).toFixed(1)+' KB');
 if(!data.length)text('status','Nenhum save WMK neste navegador/origem. Jogue ou use os editores primeiro.');
}
function download(){
 try{
  const wanted=new Set(selected()),data=Object.fromEntries(entries().filter(x=>wanted.has(x.key)&&x.value.length<=MAX_ENTRY_CHARS).map(x=>[x.key,x.value]));
  if(!Object.keys(data).length){text('status','Nenhum dado válido selecionado.');return}
  const doc={format:'wmk-backup',schemaVersion:1,createdAt:new Date().toISOString(),app:'WMK Zombie Arena',origin:location.origin,entries:data};
  const content=JSON.stringify(doc,null,2);
  if(bytes(content)>MAX_FILE_BYTES)throw Error('Backup maior que 8 MB. Desmarque dados grandes e exporte em partes.');
  const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='WMK-Backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  text('status','Backup gerado: '+Object.keys(data).length+' registros. Guarde o JSON fora da pasta do navegador!');
 }catch(err){text('status','Falha na exportação: '+err.message)}
}
let pending=null;
async function inspectFile(file){
 pending=null;$('confirmImport').disabled=true;
 if(!file){text('importDetails','Nenhum arquivo escolhido.');return}
 if(file.size>MAX_FILE_BYTES){text('importDetails','Arquivo acima do limite de 8 MB.');return}
 try{
  const doc=JSON.parse(await file.text());
  if(!doc||doc.format!=='wmk-backup'||doc.schemaVersion!==1||!doc.entries||Array.isArray(doc.entries)||typeof doc.entries!=='object')throw Error('Não é um backup WMK válido (formato/versão).');
  const keys=Object.keys(doc.entries);if(keys.length>MAX_ITEMS)throw Error('Backup excede 250 entradas.');
  for(const key of keys){
   if(!permitted(key)||typeof doc.entries[key]!=='string'||doc.entries[key].length>MAX_ENTRY_CHARS)throw Error('Chave inválida ou grande demais: '+key);
  }
  pending=doc;
  text('importDetails','Backup de '+(doc.createdAt||'data não informada')+' • '+keys.length+' registros. ATENÇÃO: restaurar substituirá as chaves correspondentes neste navegador. Itens não incluídos serão mantidos.');
  $('confirmImport').disabled=!keys.length;
 }catch(err){text('importDetails','Importação rejeitada: '+err.message)}
}
function restore(){
 if(!pending)return;
 const obj=pending.entries,keys=Object.keys(obj);
 if(!confirm('IMPORTANTE: substituir '+keys.length+' registros existentes por dados do JSON? Faça um backup atual ANTES de continuar.'))return;
 const before=new Map();
 try{
  for(const key of keys)before.set(key,localStorage.getItem(key));
  for(const key of keys)localStorage.setItem(key,obj[key]);
  text('status','Restauração concluída: '+keys.length+' registros. Reabra o jogo e os editores para carregar os dados.');
  pending=null;$('confirmImport').disabled=true;render();
 }catch(err){
  let rollback=true;for(const [key,value] of before)try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch{rollback=false}
  text('status','Erro durante restauração: '+err.message+'. '+(rollback?'Valores anteriores restaurados.':'ATENÇÃO: restauração parcial; verifique os dados.'));
 }
}
$('refresh').onclick=render;$('export').onclick=download;$('confirmImport').onclick=restore;
$('importFile').onchange=e=>{inspectFile(e.target.files[0]);e.target.value=''};
$('checkAll').onclick=()=>document.querySelectorAll('input[name="entry"]').forEach(e=>e.checked=true);
$('checkNone').onclick=()=>document.querySelectorAll('input[name="entry"]').forEach(e=>e.checked=false);
render();
