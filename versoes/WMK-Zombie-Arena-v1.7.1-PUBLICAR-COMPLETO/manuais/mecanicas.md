# Mecânicas de FPS de sobrevivência — estudo completo

**Escopo:** explicar o funcionamento dos sistemas de um FPS com hordas, apontando quando a versão atual implementa a mecânica e quando é uma proposta futura. Não é um manual de uso de armas reais.

## 1. Loop central (*core gameplay loop*)

```text
Escolher mapa → Entrar na arena → Mirar e movimentar → Eliminar zumbis
        ↑                                                │
        └──── Próxima onda ← Recarregar/posicionar ←───────┘
                          │
                    Vida chega a 0 → Fim de partida
```

O incentivo é sobreviver mais tempo. Pontos e número da onda indicam progresso. **Estado:** implementado.

## 2. Movimento em primeira pessoa

O jogador controla movimento em plano horizontal usando orientação da câmera (*yaw*), e mira verticalmente usando *pitch*. A diagonal é normalizada para não conceder vantagem de velocidade. Correr altera velocidade; agachar altera posição e/ou apresentação da câmera; pulo usa velocidade vertical e gravidade simulada. **Estado:** implementado de forma simplificada.

## 3. Detecção de obstáculos

Uma colisão simplificada testa o centro do jogador com raio contra os limites `minX/maxX/minZ/maxZ` dos obstáculos. Movimentações são verificadas separadamente em X e Z para facilitar deslizamento em paredes. Não há cápsula de colisão tridimensional completa. **Estado:** implementado, com limitações.

## 4. Disparos (*hitscan*)

Quando o usuário atira, o programa constrói um ou mais raios a partir da câmera e identifica o primeiro objeto interceptado. Parede bloqueadora deve impedir dano no alvo atrás dela. A munição diminui e a próxima tentativa aguarda `cooldown`. Não há queda gravitacional de projétil nesta versão. **Estado:** implementado.

## 5. Diferenças entre armas

| Fator | Efeito jogável |
| --- | --- |
| `damage` | dano base de cada raio que acerta |
| `headMultiplier` | multiplicador quando o acerto é registrado como cabeça |
| `cooldown` | intervalo mínimo em segundos entre disparos |
| `magazine` | quantidade máxima antes de recarga |
| `reserve` | munição extra disponível |
| `reload` | duração de recarga em segundos |
| `spread` | dispersão da mira mesmo parado |
| `movementSpread` | dispersão extra ao se deslocar |
| `pellets` | número de raios por disparo, útil para escopeta |
| `type` | `auto`: segurar botão atira continuamente; `semiauto`: clique individual |

**Estado:** implementado em `weapons.js` e `game.js`.

## 6. Recarga

A arma não ganha munição infinita: o pente é preenchido com o mínimo entre o que falta e o disponível na reserva. A ação leva tempo e impede disparos nesse intervalo. Cada arma tem seu próprio inventário inicial. **Estado:** implementado.

## 7. Recuo, animação e feedback

Recuo visual desloca a representação geométrica da arma após um disparo; *muzzle flash* simula clarão; *hitmarker* marca impactos confirmados; efeitos temporários desaparecem após curto intervalo. Isso não é igual a um modelo físico de recuo nem inclui animações esqueléticas. **Estado:** feedback básico implementado; animações completas futuras.

## 8. Zumbis

A versão atual usa inimigos geométricos com vida que se aproximam do jogador e causam dano por proximidade. Vida e velocidade aumentam conforme a onda. A escolha de caminho é local/simplificada: zumbis podem ficar presos. **Estado:** implementado de forma básica; animações, tipos especiais, percepção e navmesh futuros.

## 9. Ondas

A onda 1 inicia com `min(4 + 1 × 2, 28) = 6` inimigos. A onda 2 tem 8; onda 3, 10; até o teto de 28. A próxima onda começa após o intervalo programado, e a vida é recuperada parcialmente. **Estado:** implementado.

## 10. Mapas

São layouts de blocos 3D montados por funções: contêineres, armazém e ruas. Uma boa arena deve oferecer rotas alternativas, linhas de visão, gargalos, locais de recarga e pontos de spawn fora do campo imediato do jogador. **Estado:** três mapas básicos implementados; editor visual e mapas realistas futuros.

## 11. HUD e interface

A tela mostra informações rápidas: vida, munição, pontos, onda, zumbis restantes e seleção de armas. Interface de compra com dinheiro e preços não foi implementada — o painel B é uma seleção de armas, não uma loja. **Estado:** HUD e seleção presentes; economia futura.

## 12. Progressão, economia e upgrades (propostas)

Possíveis extensões: dinheiro por eliminação, compra entre ondas, desbloqueio de armas, compra de munição, melhorias temporárias e persistência de configurações. Ainda **não implementadas**.

## 13. IA avançada (proposta)

Máquina de estados: `vagar → perceber jogador → perseguir → atacar → recuar/morrer`. Use campo de visão, sons, navegação por caminhos e comportamento em grupo. Com mais inimigos, use estados em lote, particionamento espacial e limites de atualização.

## 14. Áudio e efeitos (proposta)

Sons por arma, passos por material, vocalizações de zumbis, música dinâmica e áudio 3D. Ajustes de volume e acessibilidade: não depender apenas do som para sinalizar ataques.

## 15. Multiplayer (proposta distante)

Para partidas online, um servidor autoritativo deve validar posições, colisões, dano, munição e progresso. Cliente envia entradas, servidor reconcilia, e estados são interpolados no navegador. WebSocket sozinho não resolve latência e prevenção de trapaça.

## 16. Testes essenciais

Teste cada arma com pente cheio/vazio, troca durante recarga, escopeta junto a paredes, tiro com zumbi atrás de obstáculo, spam de ESC/B, retomada após troca de aba e performance em ondas altas. Registre resultados em uma issue do GitHub e compare FPS.
