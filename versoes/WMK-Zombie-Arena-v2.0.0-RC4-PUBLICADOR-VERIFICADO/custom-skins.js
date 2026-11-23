// Skins criadas no navegador; não alteram atributos de combate.
export const COMMUNITY_SKIN_KEY='wmk_zombie_custom_skins_v1';
const code=/^[a-z][a-z0-9_-]{2,44}$/;
export function validateSkin(s){
 if(!s||typeof s!=='object'||!code.test(String(s.id||'')))throw Error('ID de skin inválido (3–45 caracteres)');
 if(!code.test(String(s.weaponId||'')))throw Error('ID de arma inválido');
 const image=String(s.image||'');
 if(image&&!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image))throw Error('A imagem deve ser PNG em base64');
 if(image.length>850000)throw Error('PNG muito grande: use 256 ou 512 px e reduza o arquivo');
 return {id:s.id,weaponId:s.weaponId,name:String(s.name||s.id).slice(0,70),image,
  base:/^#[a-f0-9]{6}$/i.test(s.base)?s.base:'#4a6a55',metal:'#849589',roughness:Math.min(1,Math.max(0,Number(s.roughness)||.65)),metalness:Math.min(1,Math.max(0,Number(s.metalness)||.3))};
}
export function loadCommunitySkins(){try{const a=JSON.parse(localStorage.getItem(COMMUNITY_SKIN_KEY)||'[]');return Array.isArray(a)?a.map(x=>{try{return validateSkin(x)}catch{return null}}).filter(Boolean):[]}catch{return []}}
export function saveCommunitySkin(s){const o=validateSkin(s),a=loadCommunitySkins().filter(x=>!(x.id===o.id&&x.weaponId===o.weaponId));if(a.length>=80)throw Error('Limite de 80 skins');a.push(o);localStorage.setItem(COMMUNITY_SKIN_KEY,JSON.stringify(a));return o}
export function removeCommunitySkin(weaponId,id){localStorage.setItem(COMMUNITY_SKIN_KEY,JSON.stringify(loadCommunitySkins().filter(x=>x.weaponId!==weaponId||x.id!==id)))}
export function injectCommunitySkins(target){for(const skin of loadCommunitySkins()){target['custom:'+skin.weaponId+':'+skin.id]={...skin,forWeapon:skin.weaponId}}}
