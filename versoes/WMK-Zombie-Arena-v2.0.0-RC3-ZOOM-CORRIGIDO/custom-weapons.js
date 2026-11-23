// Armas comunitárias. Valores são lúdicos e não correspondem a armamentos reais.
export const CUSTOM_KEY='wmk_zombie_custom_weapons_v1';
export const WEAPON_TYPES=['hitscan','projectile'];
export const DEFAULT_BAZUCA={
 id:'bazuca_wmk',name:'Bazuca WMK',category:'special',slot:'primary',price:4000,
 magazine:1,reserve:8,damage:140,cooldown:1.1,reload:2.7,
 spread:0.002,length:0.9,headMultiplier:1,movementSpread:0.005,
 pellets:1,type:'semiauto',color:4287325,
 mechanic:'projectile',projectileSpeed:23,blastRadius:4.5,
 modelPath:'assets/models/wmk-bazuca.glb',modelScale:1,modelOffset:[0,0,0],modelRotation:[0,0,0],
 skin:'olive'
};
const num=(v,min,max,def)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):def};
export function validateCommunityWeapon(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('JSON de arma inválido');
 const id=String(data.id||'').trim();
 if(!/^[a-z][a-z0-9_-]{2,35}$/.test(id))throw Error('ID deve ter 3–36 caracteres (a-z, 0-9, _ ou -)');
 const name=String(data.name||'').trim().slice(0,55);
 if(!name)throw Error('Preencha o nome da arma');
 const mechanic=data.mechanic==='projectile'?'projectile':'hitscan';
 const path=String(data.modelPath||'').trim();
 if(path && (!/^assets\/models\/[a-z0-9_./-]+\.glb$/i.test(path)||path.includes('..')))throw Error('GLB deve estar em assets/models/, sem caminhos externos');
 const vec=v=>Array.isArray(v)&&v.length===3?v.map(x=>num(x,-20,20,0)):[0,0,0];
 return {id,name,category:'special',slot:['primary','secondary','melee'].includes(data.slot)?data.slot:'primary',price:num(data.price,0,20000,2000),
 magazine:Math.round(num(data.magazine,1,200,1)),reserve:Math.round(num(data.reserve,0,1000,8)),
 damage:num(data.damage,1,500,100),cooldown:num(data.cooldown,0.08,15,1),reload:num(data.reload,0.2,20,2.5),
 spread:num(data.spread,0,0.2,.002),length:num(data.length,.15,3,.8),
 headMultiplier:num(data.headMultiplier,1,5,1),movementSpread:num(data.movementSpread,0,.2,.01),
 pellets:Math.round(num(data.pellets,1,24,1)),type:data.type==='auto'&&mechanic==='hitscan'?'auto':'semiauto',
 color:num(data.color,0,16777215,4287325),mechanic,
 projectileSpeed:num(data.projectileSpeed,3,70,22),blastRadius:num(data.blastRadius,0.5,12,4),
 modelPath:path,modelScale:num(data.modelScale,.05,20,1),modelOffset:vec(data.modelOffset),modelRotation:vec(data.modelRotation),
 skin:typeof data.skin==='string'?data.skin:'classic'};
}
export function loadCommunityWeapons(){try{const raw=JSON.parse(localStorage.getItem(CUSTOM_KEY)||'[]');return Array.isArray(raw)?raw.slice(0,40).map(v=>{try{return validateCommunityWeapon(v)}catch{return null}}).filter(Boolean):[]}catch{return []}}
export function saveCommunityWeapon(input){const item=validateCommunityWeapon(input);const all=loadCommunityWeapons().filter(w=>w.id!==item.id);if(all.length>=40)throw Error('Limite de 40 armas comunitárias');all.push(item);localStorage.setItem(CUSTOM_KEY,JSON.stringify(all));return item}
export function removeCommunityWeapon(id){localStorage.setItem(CUSTOM_KEY,JSON.stringify(loadCommunityWeapons().filter(w=>w.id!==id)))}
export function installCommunityWeapons(weapons,order){for(const item of loadCommunityWeapons()){if(!Object.hasOwn(weapons,item.id)){weapons[item.id]=item;order.push(item.id)}}}
