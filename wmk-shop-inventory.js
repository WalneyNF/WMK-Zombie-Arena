import {getWallet,spendW} from './wmk-economy.js';
import {findShopItem,SHOP_ITEMS} from './wmk-shop-catalog.js';
const KEY='wmk_shop_inventory_v1';
function read(){
 try{const o=JSON.parse(localStorage.getItem(KEY)||'null');if(o&&typeof o==='object'&&!Array.isArray(o))return Object.fromEntries(Object.entries(o).filter(([id,n])=>SHOP_ITEMS.some(item=>item.id===id)&&Number.isInteger(n)&&n>=0).map(([id,n])=>[id,Math.min(n,9999)]))}catch{}
 return {};
}
export function ownedItems(){return read()}
export function hasItem(id){return (read()[id]||0)>0}
export function upgradeMultiplier(weaponId){
 return SHOP_ITEMS.reduce((mult,item)=>mult*(item.upgrade?.weapon===weaponId&&hasItem(item.id)?item.upgrade.damageMultiplier:1),1);
}
export function purchaseItem(id){
 const item=findShopItem(id);if(!item)return {ok:false,error:'Item inexistente'};
 const inv=read();if(!item.repeatable&&inv[id])return {ok:false,error:'Item ja adquirido'};
 if(item.price>0){const result=spendW(item.price,'Loja WMK: '+item.name);if(!result.ok)return result}
 inv[id]=Math.min(9999,(inv[id]||0)+1);
 try{localStorage.setItem(KEY,JSON.stringify(inv))}catch(err){
   // Sem transacao atomica entre localStorage de carteira e inventario.
   // Para minimizar risco, credito compensatorio em falha de gravacao.
   if(item.price>0)import('./wmk-economy.js').then(m=>m.earnW(item.price,'Estorno: falha ao salvar compra'));
   return {ok:false,error:'Falha de armazenamento; estorno solicitado'}
 }
 window.dispatchEvent(new CustomEvent('wmk-shop-change',{detail:{id,count:inv[id]}}));
 return {ok:true,balance:getWallet().balance,item};
}
