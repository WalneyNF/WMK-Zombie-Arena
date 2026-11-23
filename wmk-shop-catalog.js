// Itens originais. Valores W$ ficticios, sem microtransacoes.
export const SHOP_ITEMS=[
{id:'weapon_rifle',category:'armas',name:'Rifle WMK — Licença de coleção',price:350,description:'Registro de aquisição na coleção. No modo clássico a arma continua acessível.'},
{id:'weapon_awp',category:'armas',name:'Precisão WMK — Licença de coleção',price:600,description:'Aquisição para coleção; o inventário do FPS clássico permanece livre.'},
{id:'weapon_smg',category:'armas',name:'SMG WMK — Licença de coleção',price:250,description:'Aquisição para coleção sem restringir o modo academia.'},
{id:'upgrade_rifle_1',category:'upgrades',name:'Rifle — Dano +5%',price:220,description:'Bônus aplicado ao dano do rifle no FPS local.',upgrade:{weapon:'rifle',damageMultiplier:1.05}},
{id:'upgrade_smg_1',category:'upgrades',name:'SMG — Dano +5%',price:180,description:'Bônus aplicado ao dano da SMG no FPS local.',upgrade:{weapon:'smg',damageMultiplier:1.05}},
{id:'upgrade_pistol_1',category:'upgrades',name:'Pistola — Dano +5%',price:120,description:'Bônus aplicado ao dano da pistola inicial.',upgrade:{weapon:'pistol',damageMultiplier:1.05}},
{id:'skin_cyan',category:'skins',name:'Skin Ciano Neon',price:160,description:'Colecionável de skin; aplicação visual integrada em futura etapa.'},
{id:'skin_rust',category:'skins',name:'Skin Ferrugem Urbana',price:110,description:'Skin colecionável para oficina/arsenal.'},
{id:'skin_blood',category:'skins',name:'Skin Alerta Vermelho',price:150,description:'Pintura original colecionável.'},
{id:'map_bairro_zero',category:'mapas',name:'Pacote Bairro Zero',price:0,description:'Mapa urbano grátis; abra no editor e faça uma cópia.',url:'cidade-viva.html'},
{id:'map_cemetery',category:'mapas',name:'Kit Cenário Cemitério',price:200,description:'Licença colecionável; conteúdo 3D adicional planejado.'},
{id:'map_farm',category:'mapas',name:'Kit Fazenda Sombria',price:180,description:'Licença colecionável; prefab completo planejado.'},
{id:'avatar_guard',category:'avatares',name:'Avatar Guarda Urbano',price:240,description:'Avatar de coleção. Seleção no jogo depende de integração futura.'},
{id:'avatar_survivor',category:'avatares',name:'Avatar Sobrevivente',price:170,description:'Avatar de coleção editável no Avatar Studio futuramente.'},
{id:'survival_medkit',category:'suprimentos',name:'Kit Médico',price:80,repeatable:true,description:'Suprimento do inventário econômico; consumo em partida planejado.'},
{id:'survival_wood',category:'suprimentos',name:'Madeira para barricadas',price:35,repeatable:true,description:'Pacote de material do inventário; construção no FPS planejada.'},
{id:'survival_ammo',category:'suprimentos',name:'Caixa de munição',price:65,repeatable:true,description:'Item do inventário econômico; recarga integrada posteriormente.'}
];
export const SHOP_CATEGORIES=[['all','Tudo'],['armas','Armas'],['upgrades','Upgrades'],['skins','Skins'],['mapas','Mapas'],['avatares','Avatares'],['suprimentos','Suprimentos']];
export const findShopItem=id=>SHOP_ITEMS.find(i=>i.id===id)||null;
