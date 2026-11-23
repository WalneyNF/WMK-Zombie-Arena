// Arsenal fictício para estudo: valores de balanceamento, não especificações reais.
// Menu clássico: B, depois 1 pistolas, 2 escopetas, 3 SMGs, 4 rifles, 5 metralhadoras.
const gun=(name,category,slot,price,magazine,reserve,damage,cooldown,reload,spread,length,opts={})=>({name,category,slot,price,magazine,reserve,damage,cooldown,reload,spread,length,headMultiplier:opts.headMultiplier??2,movementSpread:opts.movementSpread??spread*.8,pellets:opts.pellets??1,type:opts.type??'auto',color:opts.color??0x464e4e});
export const WEAPONS={
 pistol:gun('9 mm WMK','pistol','secondary',400,15,90,28,.24,1.3,.005,.25,{type:'semiauto'}),
 usp:gun('USP Tática','pistol','secondary',500,12,72,30,.25,1.45,.004,.29,{type:'semiauto'}),
 deagle:gun('Águia .50','pistol','secondary',650,7,35,55,.36,1.75,.012,.36,{type:'semiauto',color:0x77777a}),
 smg:gun('SMG WMK','smg','primary',1500,35,210,16,.075,1.65,.014,.38),
 mp5:gun('MP5','smg','primary',1500,30,150,21,.085,1.75,.009,.43),
 p90:gun('P90','smg','primary',2350,50,200,17,.068,2.35,.016,.40),
 shotgun:gun('Escopeta M3','shotgun','primary',1700,8,48,13,.82,2.6,.082,.65,{type:'semiauto',pellets:9}),
 xm1014:gun('Escopeta XM','shotgun','primary',3000,7,42,10,.34,2.9,.09,.66,{type:'semiauto',pellets:8}),
 rifle:gun('Rifle WMK','rifle','primary',2500,30,180,34,.105,2.05,.007,.54),
 ak47:gun('AK-47','rifle','primary',2500,30,150,36,.105,2.35,.011,.60,{color:0x554438}),
 m4a1:gun('M4A1','rifle','primary',3100,30,150,32,.09,2.3,.007,.57),
 sniper:gun('Rifle de precisão','rifle','primary',2750,5,30,115,1.2,2.8,.0012,.78,{type:'semiauto'}),
 awp:gun('AWP','rifle','primary',4750,10,30,120,1.45,3,.0009,.82,{type:'semiauto'}),
 m249:gun('M249','machine','primary',5750,100,200,26,.095,4.8,.02,.74),
 knife:gun('Faca tática','melee','melee',0,1,0,58,.52,0,0,.18,{type:'semiauto',headMultiplier:1})
};
export const WEAPON_ORDER=Object.keys(WEAPONS);
export const BUY_CATEGORIES=[
 {id:'pistol',name:'PISTOLAS',key:'1'},
 {id:'shotgun',name:'ESCOPETAS',key:'2'},
 {id:'smg',name:'SUBMETRALHADORAS',key:'3'},
 {id:'rifle',name:'RIFLES / PRECISÃO',key:'4'},
 {id:'machine',name:'METRALHADORAS',key:'5'},
 {id:'primaryAmmo',name:'MUNIÇÃO PRINCIPAL',key:'6'},
 {id:'secondaryAmmo',name:'MUNIÇÃO SECUNDÁRIA',key:'7'},
 {id:'equipment',name:'EQUIPAMENTOS (EM BREVE)',key:'8'}
];
// O nome de uma skin não altera dano, alcance, recarga ou precisão.
export const SKINS={
 classic:{name:'Original',base:null,metal:'#707d77',roughness:.54},
 graphite:{name:'Grafite',base:'#262b30',metal:'#777c84',roughness:.4},
 olive:{name:'Camuflagem oliva',base:'#48543c',metal:'#77835d',roughness:.86},
 crimson:{name:'Vermelho escuro',base:'#702e36',metal:'#383e42',roughness:.42},
 neon:{name:'Ciano tecnológico',base:'#126a73',metal:'#5bd5e8',roughness:.25},
 gold:{name:'Dourado',base:'#9f8039',metal:'#d8bb70',roughness:.3}
};
