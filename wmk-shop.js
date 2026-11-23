import {getWallet,formatW} from './wmk-economy.js';
import {SHOP_ITEMS,SHOP_CATEGORIES} from './wmk-shop-catalog.js';
import {ownedItems,purchaseItem} from './wmk-shop-inventory.js';
const $=id=>document.getElementById(id);let category='all';
function draw(){
 const wallet=getWallet(),inv=ownedItems();$('balance').textContent=formatW(wallet.balance);
 $('filters').replaceChildren();for(const [id,label] of SHOP_CATEGORIES){const b=document.createElement('button');b.type='button';b.className=category===id?'active':'';b.textContent=label;b.onclick=()=>{category=id;draw()};$('filters').append(b)}
 const query=$('search').value.toLocaleLowerCase('pt-BR').trim(),sort=$('sort').value;
 const items=SHOP_ITEMS.filter(item=>(category==='all'||item.category===category)&&(!query||(item.name+' '+item.description).toLocaleLowerCase('pt-BR').includes(query)));
 items.sort((a,b)=>sort==='price'?a.price-b.price:sort==='priceDesc'?b.price-a.price:a.category.localeCompare(b.category));
 $('catalog').replaceChildren();
 for(const item of items){
  const card=document.createElement('article');card.className='card';
  const tag=document.createElement('div');tag.className='tag';tag.textContent=item.category;
  const title=document.createElement('h3');title.textContent=item.name;
  const description=document.createElement('p');description.textContent=item.description;
  const price=document.createElement('div');price.className='price';price.textContent=item.price?formatW(item.price):'GRÁTIS';
  const button=document.createElement('button');const owned=inv[item.id]||0;button.disabled=(!item.repeatable&&owned>0)||(item.price>wallet.balance);
  button.textContent=!item.repeatable&&owned?'ADQUIRIDO':item.price>wallet.balance?'W$ INSUFICIENTE':'COMPRAR';
  button.onclick=()=>{if(item.price&&!confirm('Comprar '+item.name+' por '+formatW(item.price)+'?'))return;const result=purchaseItem(item.id);$('message').textContent=result.ok?'Adquirido: '+item.name:'Compra não realizada: '+result.error;draw()};
  card.append(tag,title,description,price,button);
  if(item.url){const link=document.createElement('a');link.href=item.url;link.textContent='Abrir conteúdo →';card.append(link)}
  $('catalog').append(card)
 }
 $('inventory').replaceChildren();const owned=SHOP_ITEMS.filter(item=>inv[item.id]);if(!owned.length){const li=document.createElement('li');li.textContent='Nenhum item adquirido';$('inventory').append(li)}
 for(const item of owned){const li=document.createElement('li');li.textContent=item.name+(inv[item.id]>1?' × '+inv[item.id]:'');$('inventory').append(li)}
 $('transactions').replaceChildren();for(const t of wallet.history.slice(-8).reverse()){const li=document.createElement('li');li.textContent=(t.type==='debit'?'− ':'+ ')+formatW(t.amount)+' • '+t.reason;$('transactions').append(li)}
}
$('search').oninput=draw;$('sort').onchange=draw;window.addEventListener('wmk-wallet-change',draw);draw();
