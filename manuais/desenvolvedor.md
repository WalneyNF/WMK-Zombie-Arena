# Manual do desenvolvedor — WMK Zombie Arena

**Autor:** Walney Moreira Klein — walneyk@hotmail.com  
**Base do jogo:** v1.2.0; documentação v1.3.0.

## Arquitetura
```text
index.html + style.css
        |
     game.js (ES module)
       |      \
    Three.js  weapons.js
       |
Input → atualizar estado (dt) → colisões/IA/tiros/ondas → renderizar
```

**index.html:** menus, seletores, HUD e canvas. **style.css:** aparência. **game.js:** cena, câmera, mapas, movimento, IA, raycast, estado e renderização. **weapons.js:** dados de armas. Esta versão ainda usa um módulo principal grande; é importante refatorá-lo futuramente.

## Como executar
Use Live Server ou `py -m http.server 5500`. O navegador bloqueia certos imports em `file://`. O CDN do Three.js exige internet.

## Anatomia das armas
Em `weapons.js`, cada arma define: `name`, `type` (`auto` ou `semiauto`), `magazine`, `reserve`, `damage`, `headMultiplier`, `cooldown`, `reload`, `spread`, `movementSpread`, `pellets`, `color`, `length`.

**Cadência teórica** = `60 / cooldown` tiros/min, ignorando recarga.  
**Capacidade total** = `magazine + reserve`.  
**Escopeta:** dano máximo potencial por tiro é `damage * pellets` se todos os raios acertarem, antes de multiplicadores.

Exercício: mude `WEAPONS.pistol.damage` de 28 para 50; recarregue a página e compare os resultados. Parâmetros são fictícios e voltados ao balanceamento.

## Movimento e colisão
A direção do deslocamento depende do yaw da câmera; a entrada diagonal é normalizada. `isBlocked(x,z,radius)` compara a posição com retângulos dos obstáculos. Não há colisão física 3D complexa nem física em diferentes andares.

## IA de zumbis
`createBot` define vida, velocidade e temporizadores. `updateBots(dt)` realiza aproximação e ataque em curta distância. A IA é local e pode ficar presa. Planejado: máquina de estados, navmesh, percepção e animação.

## Ondas
A contagem é `min(4 + wave * 2, 28)`; a vida inicial dos zumbis é `70 + wave * 18`. Cada eliminação concede 100 pontos. Há uma pausa de aproximadamente 3,8 segundos entre ondas.

## Tiro e recarga
O disparo usa `Raycaster` (*hitscan*), dispersão e multiplicadores. A recarga transfere munição da reserva para o pente, limitada à capacidade. A escopeta usa múltiplos raios; armas automáticas permitem disparos enquanto o clique fica pressionado.

## Performance e segurança
Não crie geometria a cada quadro sem necessidade; quando houver hordas grandes, considere `InstancedMesh`, pool de objetos e particionamento espacial. Nunca confie no cliente em um multiplayer futuro: valide dano, posição, munição e pontuação no servidor. Não use `innerHTML` com dados externos e respeite licenças de conteúdo.

## Roteiro de estudos
1. Iniciante: modifique dano, capacidade e tempo de recarga.
2. Iniciante: mude nomes/cores sem quebrar os IDs.
3. Intermediário: crie dificuldade fácil, normal e difícil.
4. Intermediário: implemente HP sobre o zumbi.
5. Avançado: separe `WeaponSystem`, `ZombieSystem`, `MapSystem`, `HUD` e `GameState`.
6. Avançado: teste IA, obstáculos, munição e performance por onda.

**Não implementado:** multiplayer, editor de mapas, modelos GLB animados, áudio, navmesh, física avançada, loja e salvamento.
