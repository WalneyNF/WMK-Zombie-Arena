# WMK Zombie Arena — Mapas maiores e objetos de terror leve (v1.9.6)

**Autor:** Walney Moreira Klein — walneyk@hotmail.com

## Começando

Abra `editor.html` pelo Live Server. Selecione **Tamanho do mapa**: 40 × 40, 80 × 80, 160 × 160 ou 320 × 320 metros virtuais. O campo `size` aparece no JSON e é respeitado pelo FPS. O tamanho descreve as dimensões do solo, não o número de objetos nem o desempenho garantido.

Clique **Enquadrar terreno inteiro** para visualizar a área nova. Crie o mapa, defina início do jogador e os spawns de zumbis. Selecione **Testar no jogo** ou exporte JSON. Faça backup em arquivo, pois o armazenamento do navegador pode ser apagado.

## Biblioteca 3D original

A biblioteca foi ampliada com casas, chalés, casa abandonada, celeiro, barraco, depósito, varanda, cercas de madeira e ferro, cerca branca, portão, lápide, cruz, mausoléu, cripta, caixão, árvore seca, poste, poço, barricada, abóbora e entulho. Esses objetos são **geometrias procedimentais simples**, não modelos PBR realistas. Você pode substituí-los por um modelo GLB original do Blender.

### Como alterar a aparência de uma casa

1. Insira **Casa** ou **Casa abandonada**.
2. Selecione o objeto na hierarquia.
3. Modifique **Cor principal**, **Cor do telhado** e **Cor de detalhes** no painel Propriedades.
4. Use **G** mover, **R** girar, **S** escalar. Ajuste altura, largura e profundidade.
5. Exporte JSON. O objeto salva `type`, `color`, `roofColor`, `accentColor`, escala e posição.

### Kits de construção

**Casa + quintal**, **Cemitério**, **Fazenda** e **Rua de vila** inserem conjuntos de várias peças independentes. Cada peça pode ser selecionada, recolorida, duplicada ou removida. Esses kits são uma maneira rápida de aprender composição e escala de cenários.

## Exemplos oficiais incluídos

- `cemiterio-neblina.json` — 80 × 80 m.
- `vila-sombria.json` — 160 × 160 m.
- `fazenda-crepusculo.json` — 160 × 160 m.
- `bairros-abandonados.json` — 320 × 320 m.

Os novos mapas aparecem no catálogo `mapas/index.json`. Para adicionar o seu mapa, coloque o JSON em `mapas/` e crie uma entrada no catálogo. O GitHub Pages serve arquivos estáticos e não enumera a pasta sozinho.

## JSON de mapa v2

```json
{
  "format":"wmk-zombie-map",
  "version":2,
  "size":160,
  "name":"Minha Fazenda",
  "objects":[{
    "id":"casa_1", "name":"Casa central", "type":"house",
    "x":5,"y":2.5,"z":3,"w":8,"h":5,"d":7,
    "ry":0,"color":"#b7a08c", "roofColor":"#6c3e35",
    "accentColor":"#493c32","solid":true
  }]
}
```

Mapas antigos, sem `size`, continuam com dimensão padrão de 40 × 40 m. O novo limite de importação é de 1.200 objetos, mas **isso não significa que 1.200 objetos terão boa performance**. Prefira menos objetos e otimize modelos e texturas.

## Criando modelos mais sofisticados no Blender

1. Configure o projeto em metros e modele o objeto com dimensões coerentes.
2. Faça UV Unwrap e materiais PBR autorais, sem copiar assets de jogos comerciais.
3. Aplique transformações com Ctrl+A e organize o pivô.
4. Exporte como `.glb`.
5. Coloque o arquivo em `assets/models/` e vincule o caminho no editor.
6. Teste a escala, rotação e colisão. Atualmente a colisão de objeto usa caixa retangular simples, mesmo se o GLB tiver aberturas.

**Atenção:** as casas procedimentais dessa versão têm fachada e telhado, mas são **volumes sólidos**, sem interiores acessíveis. Para uma casa explorável, construa paredes, pisos, portas e ambientes separadamente; a física de múltiplos andares requer evolução futura.

## Limitações técnicas e próximos passos

- Colisão de caixas com aproximação 2D; não há navegação automática sofisticada, malha de navegação ou suporte completo a pisos sobrepostos.
- O FPS aumenta o chão e limites ao carregar um mapa `size=80/160/320`. A distância de desenho da névoa também aumenta. Isso não garante que os zumbis consigam atravessar bairros extensos.
- Mapas grandes têm custo de renderização, raycast e atualização de bots. Prefira `InstancedMesh`, chunks, LOD, frustum culling e occlusion culling como próximos recursos.
- Futuras opções: pisos modulares, portas funcionais, iluminação noturna, sons de ambiente, telhados com vários estilos, janelas quebráveis, vegetação e caminhos para bots.

## Checklist de publicação

- [ ] JSON válido e tamanho 40, 80, 160 ou 320.
- [ ] Spawn do jogador sem colisão e pelo menos um spawn válido para zumbis.
- [ ] Caminhos GLB relativos e arquivos dentro da pasta publicada.
- [ ] Catálogo `mapas/index.json` atualizado.
- [ ] Testar editor e FPS com mapa pequeno e grande, acompanhando F12 e FPS.
- [ ] Exportar e guardar backup dos fontes e mapas antes da publicação na branch `main`.
