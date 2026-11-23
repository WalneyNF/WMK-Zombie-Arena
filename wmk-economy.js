// WMK Economy v0.1 — credito virtual local, nao equivale a dinheiro real.
export const CURRENCY='W$';
const KEY='wmk_wallet_v1',INITIAL=500,MAX=999999999;
const normalize=n=>Math.max(0,Math.min(MAX,Math.trunc(Number(n)||0)));
function read(){
 try{const value=JSON.parse(localStorage.getItem(KEY)||'null');if(value&&Number.isFinite(Number(value.balance))&&Array.isArray(value.history))return {balance:normalize(value.balance),history:value.history.slice(-100)}}
 catch(err){console.warn('WMK Economy:',err)}
 return {balance:INITIAL,history:[{type:'initial',amount:INITIAL,reason:'Saldo inicial (jogo)',at:new Date().toISOString()}]};
}
export function getWallet(){return read()}
export function formatW(value){return 'W$ '+normalize(value).toLocaleString('pt-BR')}
function transact(type,amount,reason){
 const quantity=Math.trunc(Number(amount));if(!Number.isFinite(quantity)||quantity<=0||quantity>1000000)return {ok:false,error:'Valor invalido'};
 const wallet=read();if(type==='debit'&&wallet.balance<quantity)return {ok:false,error:'Saldo insuficiente'};
 wallet.balance=normalize(wallet.balance+(type==='credit'?quantity:-quantity));
 wallet.history.push({type,amount:quantity,reason:String(reason||'Transacao').slice(0,100),at:new Date().toISOString()});wallet.history=wallet.history.slice(-100);
 try{localStorage.setItem(KEY,JSON.stringify(wallet));window.dispatchEvent(new CustomEvent('wmk-wallet-change',{detail:{balance:wallet.balance}}));return {ok:true,balance:wallet.balance}}
 catch(err){return {ok:false,error:'Armazenamento indisponivel: '+err.message}}
}
export const earnW=(amount,reason)=>transact('credit',amount,reason);
export const spendW=(amount,reason)=>transact('debit',amount,reason);
