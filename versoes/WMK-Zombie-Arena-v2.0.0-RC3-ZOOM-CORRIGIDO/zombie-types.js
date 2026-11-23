// WMK Zombie Studio — tipos e validação (sem executar código do JSON).
export const ZOMBIE_STORAGE='wmk_zombie_types_v1';
export const BUILTIN_ZOMBIES={
  comum:{id:'comum',name:'Zumbi comum',health:90,speed:1.4,attack:10,attackInterval:1.3,scale:1,color:'#668c67',headMultiplier:2,points:100,model:''},
  corredor:{id:'corredor',name:'Corredor',health:58,speed:2.9,attack:7,attackInterval:.8,scale:.88,color:'#a89368',headMultiplier:2.2,points:130,model:''},
  tanque:{id:'tanque',name:'Tanque',health:320,speed:.78,attack:22,attackInterval:1.8,scale:1.55,color:'#666a76',headMultiplier:1.6,points:300,model:''},
  boss:{id:'boss',name:'Boss Mutante',health:1100,speed:1.15,attack:32,attackInterval:1.5,scale:2.25,color:'#ab4d57',headMultiplier:1.3,points:1200,model:''}
};
const num=(v,def,min,max)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):def};
export const validId=id=>typeof id==='string'&&/^[a-z][a-z0-9_-]{1,35}$/.test(id);
export function normalizeZombie(z){
 if(!z||!validId(z.id))throw Error('ID do zumbi inválido (letras minúsculas, números, _ e -).');
 return {id:z.id,name:String(z.name||z.id).slice(0,60),health:num(z.health,100,1,10000),speed:num(z.speed,1.3,0,12),attack:num(z.attack,10,0,500),attackInterval:num(z.attackInterval,1.2,.2,30),scale:num(z.scale,1,.3,5),color:/^#[0-9a-f]{6}$/i.test(z.color||'')?z.color:'#668c67',headMultiplier:num(z.headMultiplier,2,1,8),points:num(z.points,100,0,100000),model:typeof z.model==='string'&&/^assets\/models\/[a-z0-9_/-]+\.glb$/i.test(z.model)&&!z.model.includes('..')?z.model:''};
}
export function readCustomZombies(){try{const j=JSON.parse(localStorage.getItem(ZOMBIE_STORAGE)||'{}');if(!j||Array.isArray(j)||typeof j!=='object')return {};const out={};for(const [id,value] of Object.entries(j).slice(0,100)){try{const z=normalizeZombie({...value,id});if(!BUILTIN_ZOMBIES[id])out[id]=z}catch{}}return out}catch{return {}}}
export function allZombieTypes(){return {...BUILTIN_ZOMBIES,...readCustomZombies()}}
export function saveCustomZombie(raw){const z=normalizeZombie(raw);if(BUILTIN_ZOMBIES[z.id])throw Error('ID oficial protegido. Duplique para criar um tipo novo.');const data=readCustomZombies();if(!data[z.id]&&Object.keys(data).length>=100)throw Error('Limite de 100 tipos locais.');data[z.id]=z;localStorage.setItem(ZOMBIE_STORAGE,JSON.stringify(data));return z}
export function deleteCustomZombie(id){const data=readCustomZombies();delete data[id];localStorage.setItem(ZOMBIE_STORAGE,JSON.stringify(data))}
export function exportZombie(z){return JSON.stringify({format:'wmk-zombie-type',version:1,zombie:normalizeZombie(z)},null,2)}
export function parseZombieFile(json){const obj=typeof json==='string'?JSON.parse(json):json;if(obj?.format!=='wmk-zombie-type'||obj.version!==1)throw Error('Arquivo de tipo WMK inválido');return normalizeZombie(obj.zombie)}
