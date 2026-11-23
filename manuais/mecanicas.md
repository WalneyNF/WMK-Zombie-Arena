# Mecânicas de um FPS de sobrevivência — WMK Zombie Arena

**Este documento diferencia recursos atuais de propostas futuras.** Os dados das armas são números fictícios para aprendizagem.

## Ciclo principal
```text
Selecionar mapa → Iniciar → Atirar/mover/recarregar → Derrotar zumbis
                        ↑                             |
                        └──── Nova onda ←──────────────┘
                         Vida zerada → Fim de partida
```
**Implementado.**

## Movimento e câmera
WASD desloca o jogador no chão conforme o ângulo horizontal da câmera (*yaw*). O mouse ajusta yaw e pitch. Diagonais devem ser normalizadas para não aumentar a velocidade. Shift acelera; C/Ctrl agacha; Espaço salta. **Implementação básica presente.**

## Colisão e cobertura
Obstáculos são volumes retangulares de colisão usados para limitar o movimento e bloquear determinados tiros. Não há física completa de cápsula 3D. **Implementado, simplificado.**

## Mira e tiro
`Raycaster` verifica a primeira interseção de um raio com obstáculos ou zumbis: *hitscan*, não projétil físico. Dispersão base e dispersão em movimento afetam os acertos. O corpo e a cabeça podem ter multiplicadores diferentes. **Implementado.**

## Armas
`damage` é dano por raio; `headMultiplier` altera dano em região específica; `cooldown` é intervalo entre disparos; `magazine` é capacidade; `reserve` é munição extra; `reload` é duração da recarga; `spread` e `movementSpread` afetam precisão; `pellets` controla múltiplos raios de escopeta; `type` distingue semiautomática/automática. **Implementado.**

## Recarga
A recarga consome tempo, bloqueia disparos e transfere até `min(magazine-ammo, reserve)` unidades para o pente. Cada arma mantém seus próprios valores. **Implementado.**

## Zumbis
Inimigos perseguem o jogador e causam dano quando próximos. Cada onda aumenta dificuldade com mais inimigos e maior vida/velocidade. Sem pathfinding global, podem travar em obstáculos. **Implementado de forma simplificada.**

## Ondas e pontuação
A quantidade de inimigos é `min(4+wave*2,28)`. Eliminações somam pontos e a onda seguinte inicia após pausa. Há recuperação parcial de vida entre ondas. **Implementado.**

## HUD, efeitos, mapas
Indicadores exibem vida, munição, onda, pontos, precisão e zumbis restantes. Efeitos básicos de arma e impacto informam acertos. Há três cenários geométricos básicos. **Implementado.**

## Mecânicas futuras (não presentes nesta versão)
- Economia e loja entre rodadas, upgrades e desbloqueios.
- Zumbis especiais, chefes, navegação inteligente e animações.
- Áudio 3D, passos, trilha sonora e feedback de dano avançado.
- Mapas detalhados, portas, escadas, editor de mapas e GLB/GLTF.
- Cooperação online com servidor autoritativo e prevenção de trapaça.
- Opções gráficas e controles configuráveis, persistência de progresso.

## Testes sugeridos
Teste recarga com pouca munição, troca de arma durante recarga, tiro atrás de parede, pausa e retomada, escopeta a diferentes distâncias, zumbis presos e desempenho com muitas unidades. Registre os resultados em issues.
