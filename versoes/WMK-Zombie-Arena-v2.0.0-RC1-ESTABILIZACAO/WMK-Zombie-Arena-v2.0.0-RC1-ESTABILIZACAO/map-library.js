// Catálogo estático: navegadores não listam arquivos de uma pasta HTTP automaticamente.
export const MAP_STORAGE_KEY='wmk_zombie_custom_map';
export function validateMap(data){
  if(!data || data.format!=='wmk-zombie-map' || !Array.isArray(data.objects) || data.objects.length>1200)throw Error('Mapa inválido (formato ou mais de 1200 objetos)');
  if(data.size!==undefined && ![40,80,160,320].includes(Number(data.size)))throw Error('Tamanho de mapa inválido');
  for(const o of data.objects){if(!o||!Number.isFinite(Number(o.x))||!Number.isFinite(Number(o.z)))throw Error('Objeto com coordenadas inválidas');}
  return data;
}
export async function getMapCatalog(){
  const response=await fetch('./mapas/index.json',{cache:'no-store'});
  if(!response.ok)throw Error('Não foi possível carregar mapas/index.json');
  const data=await response.json();
  if(!Array.isArray(data.maps))throw Error('Catálogo de mapas inválido');
  return data.maps.filter(m=>/^[a-z0-9-]+\.json$/.test(m.file)&&/^[a-z0-9-]+$/.test(m.id)).slice(0,100);
}
export async function loadCatalogMap(file){
  if(!/^[a-z0-9-]+\.json$/.test(file))throw Error('Nome de arquivo inválido');
  const response=await fetch('./mapas/'+file,{cache:'no-store'});
  if(!response.ok)throw Error('Mapa não encontrado: '+file);
  return validateMap(await response.json());
}
export function saveBrowserMap(data){localStorage.setItem(MAP_STORAGE_KEY,JSON.stringify(validateMap(data)))}
