# Manual do desenvolvedor — WMK Zombie Arena

**Público:** iniciante a intermediário em JavaScript/Three.js.  
**Autor:** Walney Moreira Klein — walneyk@hotmail.com

## 1. Ambiente e fluxo de execução

HTML/CSS definem a interface; `game.js` importa `three.module.js` do CDN e `WEAPONS` de `weapons.js`. Use servidor HTTP local (`py -m http.server 5500` ou Live Server). Não há `npm`, transpiler, servidor de jogo nem backend nesta versão.

## 2. Arquitetura atual

```text
index.html ─── style.css
    │
    └─ game.js (ES module)
          ├─ Three.js (CDN)
          └─ weapons.js

   Input → estado → atualização (delta time) → renderização
                  ├─ movimento/colisão
                  ├─ armas/hitscan
                  ├─ IA de zumbis
                  ├─ ondas/pontuação
                  └─ HUD/efeitos
```

### Arquivos

- `index.html`: botões, seleção de mapa, painéis, HUD, informações da partida.
- `style.css`: posicionamento absoluto de HUD, overlays, responsividade básica.
- `weapons.js`: objeto `WEAPONS` e array `WEAPON_ORDER`; facilita balanceamento sem mudar o loop.
- `game.js`: implementação ainda monolítica; contém criação de cena, mapas, controles, colisões, gerenciador de ondas, zumbis, raycasting e animação.

## 3. Parâmetros das armas

Cada objeto contém `name`, `type`, `magazine`, `reserve`, `damage`, `headMultiplier`, `cooldown`, `reload`, `spread`, `movementSpread`, `pellets`, `color` e `length`.

Exemplo didático:

```js
export const WEAPONS = {
  training: {
    name: 'Arma de treino', type: 'semiauto', magazine: 12,
    reserve: 48, damage: 20, headMultiplier: 2,
    cooldown: 0.3, reload: 1.5, spread: 0.01,
    movementSpread: 0.02, pellets: 1,
    color: 0x555555, length: 0.3
  }
};
```

Este exemplo ilustra os campos; não substitua o objeto completo por ele, pois as cinco armas já existentes e os IDs em `WEAPON_ORDER` são necessários para a versão atual.

### Relações úteis

**Cadência teórica** ≈ `60 / cooldown` disparos por minuto (sem recarga). **Dano potencial de escopeta** = `damage × pellets`, somente se todos os fragmentos acertarem, ignorando multiplicadores. **Munição total inicial** = `magazine + reserve`. Ajuste cada fator isoladamente.

## 4. Colisões e mapa

`buildMap(id)` constrói caixas no Three.js. `addBox(...)` alimenta limites retangulares de colisão. `isBlocked(x,z,radius)` resolve colisões 2D simples no chão; não há gravidade física para caixas móveis, paredes inclinadas nem suporte completo a múltiplos pavimentos. O Raycaster usa objetos bloqueadores para impedir tiros atravessando determinadas estruturas.

## 5. Zumbis e ondas

`createBot(x,z)` gera geometria simples com vida, velocidade e temporizador de ataque. `updateBots(dt)` aproxima zumbis e aplica dano por contato dentro do alcance configurado. `startWave()` cria a quantidade da rodada; `updateWaves(dt)` aguarda transição. Valores atuais relevantes: vida base `70 + wave * 18`, pontos por eliminação `100`, quantidade da onda `min(4 + wave * 2, 28)` e intervalo de aproximadamente `3.8 s` entre ondas. Não há pathfinding global nem árvore de comportamento.

## 6. Tiro, dispersão e recarga

`tryShoot()` verifica estado da partida, temporizador de cadência, munição disponível e recarga; dispara raios de Three.js (*hitscan*). `startReload()` inicia contagem de recarga; completar recarga transfere munição da reserva para o pente. A mira possui dispersão base e movimento pode acrescentar dispersão. A escopeta usa vários raios (*pellets*). Valores são de balanceamento, não balística física.

## 7. Estado e loop

O laço `requestAnimationFrame` calcula `dt`, atualiza controles, armas, inimigos, ondas, indicadores e renderiza. O tempo da atualização é limitado para reduzir saltos grandes de simulação. `Pointer Lock` ativa a câmera com mouse; `Esc` devolve controle ao navegador.

## 8. Cuidados de desempenho e segurança

- Evite recriar muitas geometrias e materiais por quadro; utilize cache, *InstancedMesh* e *object pooling* quando aumentar o número de inimigos.
- Evite fazer `scene.updateMatrixWorld(true)` e buscas de objetos mais vezes que o necessário.
- Para multiplayer futuro, NÃO confie no cliente para calcular dano, munição, posição nem pontuação: valide no servidor.
- Não injete conteúdo externo diretamente com `innerHTML`; prefira `textContent` para dados não confiáveis.
- Respeite licenças de modelos, texturas, áudio e bibliotecas. Não reutilize arquivos retirados de CS:GO/CS 1.6.

## 9. Exercícios progressivos

1. **Iniciante:** altere `pistol.damage`, depois `reload`, e documente o efeito.
2. **Iniciante:** altere o nome exibido de uma arma sem modificar seu ID.
3. **Intermediário:** crie uma dificuldade configurável em vez de constantes espalhadas.
4. **Intermediário:** destaque zumbis próximos por uma barra de vida.
5. **Avançado:** extraia `GameState`, `WeaponSystem`, `ZombieSystem`, `MapSystem` e `HUD` para módulos próprios, com testes isolados.
6. **Avançado:** implemente uma máquina de estados de zumbi (`idle`, `chase`, `attack`, `dead`) e detecção de obstáculos antes de mover.

## 10. Evolução recomendada (não implementada)

Refatoração modular (`src/`), configurações em JSON, zumbis com GLB/animações, mapas com GLTF, som espacial, navegação com navmesh, modos de dificuldade, save/config persistente e posteriormente servidor autoritativo WebSocket.
