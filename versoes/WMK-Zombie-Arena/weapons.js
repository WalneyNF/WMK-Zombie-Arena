// FICHA DAS ARMAS: modifique estes valores para estudar balanceamento.
// Valores fictícios para GAMEPLAY, não são dados balísticos reais.
export const WEAPONS = {
  pistol:   {name:'Pistola 9 mm', type:'semiauto', magazine:15, reserve:90, damage:28, headMultiplier:2.1, cooldown:0.24, reload:1.3, spread:0.005, movementSpread:0.009, pellets:1, color:0x4c5158, length:0.25},
  smg:      {name:'Submetralhadora', type:'auto', magazine:35, reserve:210, damage:16, headMultiplier:1.7, cooldown:0.075, reload:1.65, spread:0.014, movementSpread:0.016, pellets:1, color:0x323b40, length:0.38},
  rifle:    {name:'Rifle de assalto', type:'auto', magazine:30, reserve:180, damage:34, headMultiplier:2, cooldown:0.105, reload:2.05, spread:0.007, movementSpread:0.019, pellets:1, color:0x45483b, length:0.54},
  shotgun:  {name:'Escopeta', type:'semiauto', magazine:8, reserve:48, damage:13, headMultiplier:1.3, cooldown:0.82, reload:2.6, spread:0.082, movementSpread:0.023, pellets:9, color:0x55483a, length:0.65},
  sniper:   {name:'Rifle de precisão', type:'semiauto', magazine:5, reserve:30, damage:115, headMultiplier:2.5, cooldown:1.2, reload:2.8, spread:0.0012, movementSpread:0.065, pellets:1, color:0x373c45, length:0.78}
};
export const WEAPON_ORDER = ['pistol','smg','rifle','shotgun','sniper'];
