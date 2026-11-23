# Manual do usuário — WMK Zombie Arena

**Jogo-base:** v1.2.0 • **Documentação:** v1.3.0  
**Autor:** Walney Moreira Klein — walneyk@hotmail.com

## 1. Objetivo
Você controla um personagem em primeira pessoa, enfrenta zumbis e tenta sobreviver a ondas cada vez maiores. A vida chega a zero: a partida acaba. Elimine os inimigos restantes para avançar à próxima onda.

## 2. Executar
No pacote completo, mantenha `index.html`, `style.css`, `game.js` e `weapons.js` juntos. Abra com Live Server ou execute `py -m http.server 5500`. Acesse `http://localhost:5500`. Internet é necessária para carregar Three.js.

## 3. Comandos
| Comando | Ação |
|---|---|
| WASD | Movimentação |
| Mouse | Mira |
| Clique esquerdo | Tiro |
| Shift | Corrida |
| C/Ctrl | Agachar |
| Espaço | Pular |
| R | Recarga |
| 1 a 5 | Selecionar arma |
| B | Abrir painel de armas |
| Esc | Pausar / liberar mouse |

## 4. Arsenal
| Arma | Pente | Dano-base fictício |
|---|---:|---:|
| Pistola 9 mm | 15 | 28 |
| Submetralhadora | 35 | 16 |
| Rifle de assalto | 30 | 34 |
| Escopeta | 8 | 13 por fragmento (9) |
| Rifle de precisão | 5 | 115 |

O dano é modificado pela região de impacto e pelo acerto efetivo. A escopeta dispersa múltiplos fragmentos.

## 5. Mapas
**Pátio de contêineres:** cobertura por grandes blocos. **Depósito:** obstáculos próximos. **Ruas:** corredores entre volumes geométricos. São mapas de estudo, não cópias de mapas comerciais.

## 6. Estratégia
Mantenha distância para recarregar; evite cercos; use caixas e esquinas; teste diversas armas para comparar cadência e precisão. Observe vida, munição, pontos e contagem de zumbis no HUD.

## 7. Problemas comuns
**Tela vazia:** confira F12/Console, acesso ao CDN e servidor HTTP. **Mouse não responde:** clique em iniciar para permitir Pointer Lock. **Zumbi preso:** limitação da IA sem navmesh. **Mudanças não aparecem:** atualize com Ctrl+F5.

## 8. Vocabulário
**FPS:** visão em primeira pessoa. **HUD:** informações sobrepostas. **Hitscan:** disparo resolvido instantaneamente por raycast. **Spread:** dispersão. **Cooldown:** tempo mínimo entre disparos. **Wave:** onda de inimigos.
