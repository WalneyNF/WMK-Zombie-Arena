# Manual do editor de mapas 3D — v1.4.0

**Autor:** Walney Moreira Klein — walneyk@hotmail.com

## Iniciar
Abra `editor.html` pelo Live Server do VS Code. É necessária internet para carregar Three.js e seus controles. Acesse pelo botão **Abrir editor de mapas 3D** no menu do jogo.

## Trabalho básico
1. Clique em **Novo** ou mantenha o mapa que veio carregado.
2. Na Biblioteca, clique em Parede, Caixa, Contêiner, Cobertura ou Prédio para incluir objetos.
3. Clique no objeto da cena ou na Hierarquia; **W** move, **E** gira, **R** altera escala.
4. Ajuste posição, dimensões, cor e colisão no painel Propriedades.
5. Insira **Início jogador** e pelo menos um **Spawn zumbi** longe de obstáculos.
6. Clique em **Salvar no navegador**, **Exportar JSON** para fazer backup ou **Testar no jogo** para abrir o FPS com o mapa.

## Câmera
Botão direito orbita, roda aproxima/afasta, botão do meio arrasta a visualização. F foca no objeto. Os painéis podem ser arrastados pelo título, e suas posições são persistidas localmente.

## Atalhos
| Atalho | Função |
|---|---|
| W | Gizmo de movimentação |
| E | Gizmo de rotação |
| R | Gizmo de escala |
| Ctrl+D | Duplicar |
| Delete | Excluir |
| Ctrl+Z / Ctrl+Y | Desfazer / refazer |
| F | Focar |

## Formato JSON
`format: 'wmk-zombie-map'`, `version: 1`, `name`, `objects`. Cada objeto inclui `id`, `type`, `x`, `y`, `z`, `w`, `h`, `d`, `ry` (radianos), `color` e `solid`. `spawn` marca os pontos para zumbis; `player` marca o ponto inicial do jogador. Os demais objetos são sólidos a menos que `solid` seja `false`.

## Limitações desta versão
O editor é baseado em primitivas geométricas, não em modelos GLB. O FPS usa obstáculos retangulares 2D para movimento; a rotação usa AABB conservadora e pode tornar a colisão maior do que a malha. O editor limita a importação a 500 objetos, mas mapas densos reduzem o FPS. Ainda não existe navegação inteligente de zumbis, terreno com altura, materiais texturizados ou sistema de portas. O armazenamento no navegador vale apenas para a mesma origem (domínio e porta); **exporte o JSON para backup**. O jogo original permanece com seus três mapas além do mapa personalizado.

## Teste sugerido
Crie uma parede em X=0, Z=0 com tamanho 4 × 3 × 0,5, coloque o spawn no outro lado, salve e teste tiros e colisão. Depois rode a parede 45 graus e observe a limitação da colisão.


## Persistência (v1.4.1)

O editor mantém um **rascunho automático** no armazenamento local do navegador após alterar objetos e nome do mapa. Recarregar a página restaura este rascunho. **Salvar no navegador** confirma o mapa que será usado ao clicar em **Testar no jogo**. **Exportar JSON** baixa uma cópia e também salva no navegador. Se arquivos forem editados usando Live Server e a página atualizar automaticamente, os objetos editados devem ser restaurados. Faça exportação JSON regularmente, pois o localStorage depende do navegador e do endereço usado.
