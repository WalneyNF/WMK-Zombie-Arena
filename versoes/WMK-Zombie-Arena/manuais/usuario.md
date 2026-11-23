# Manual do jogador — WMK Zombie Arena

**Versão:** jogo 1.2.0 / documentação 1.3.0  
**Autor:** Walney Moreira Klein — walneyk@hotmail.com

## 1. O que é o jogo?

É um FPS (First-Person Shooter) 3D de sobrevivência. A câmera representa a visão do personagem. Você deve sobreviver a ondas de zumbis, administrar munição, escolher armas e usar coberturas. Não é um modo competitivo com equipes nem um clone integral de CS:GO.

## 2. Como instalar e abrir

1. Descompacte os arquivos em uma pasta, mantendo `index.html`, `style.css`, `game.js` e `weapons.js` juntos.
2. Abra no Visual Studio Code.
3. Instale a extensão Live Server, clique com o botão direito no `index.html` e selecione **Open with Live Server**.
4. Alternativamente, no terminal, execute `py -m http.server 5500` e abra `http://localhost:5500`.
5. Conecte-se à internet para carregar Three.js, caso não esteja em cache.

Se aparecer uma tela em branco, abra F12 > Console e confira o carregamento dos módulos e CDN. Se o mouse não travar, clique novamente em iniciar.

## 3. Comandos

| Tecla | Resultado |
| --- | --- |
| W/S | Avançar/recuar |
| A/D | Mover lateralmente |
| Mouse | Mover a mira |
| Botão esquerdo | Disparo |
| R | Recarregar o pente |
| 1,2,3,4,5 | Selecionar uma arma |
| B | Mostrar seleção de armas |
| Shift | Correr |
| C ou Ctrl | Agachar |
| Espaço | Saltar |
| Esc | Liberar o cursor e pausar |

## 4. Objetivo, progressão e pontos

Ao começar, os zumbis aparecem na arena. Elimine todos os inimigos restantes da onda para liberar a seguinte. Cada eliminação atribui pontos; no código atual o valor base é 100. A quantidade total da onda cresce progressivamente, com limite interno; a vida do jogador recebe reposição parcial entre ondas. Se sua vida chegar a zero, a partida termina. Não há campanha ou fases narrativas.

## 5. Armas e uso recomendado

| Arma | Pente | Dano base por projétil | Perfil |
| --- | ---: | ---: | --- |
| Pistola 9 mm | 15 | 28 | Disparo individual, controle simples |
| Submetralhadora | 35 | 16 | Automática, maior dispersão |
| Rifle de assalto | 30 | 34 | Automática, versátil |
| Escopeta | 8 | 13 × 9 fragmentos | Dano concentrado de perto, grande espalhamento |
| Rifle de precisão | 5 | 115 | Alto dano por tiro, tiro lento |

O dano efetivo depende de acerto, multiplicadores e lógica de cada alvo. O jogo não tenta reproduzir uma arma real.

## 6. Estratégias para iniciantes

Evite ficar encurralado; gire em torno das caixas e estruturas; aproveite distâncias maiores para recarregar; observe o contador de zumbis; experimente o rifle antes da escopeta para aprender mira. Em armas automáticas, controlar a duração do clique ajuda a gastar menos munição.

## 7. Mapas

**Pátio de Contêineres:** blocos grandes que quebram linhas de visão. **Depósito:** pilhas de volumes e caminhos entre coberturas. **Ruas:** edifícios e corredores geométricos. São cenários procedurais simplificados, não reproduções de mapas comerciais.

## 8. Solução de problemas

- **Tela preta/branca:** cheque F12/Console e conexão à internet.
- **Clique não gira câmera:** o navegador precisa autorizar o bloqueio do ponteiro (*Pointer Lock*).
- **Mudança em arma não aparece:** salve `weapons.js` e atualize com Ctrl+F5.
- **Zumbi preso:** limitação da IA atual sem navegação de malha (*navmesh*).
- **Jogo lento:** feche outras abas e reduza resolução do monitor; otimizações de qualidade configuráveis são futuras.

## 9. Vocabulário

**FPS:** tiro em primeira pessoa. **HUD:** indicadores na tela. **Hitscan:** acerto calculado por raio instantâneo. **Pente/magazine:** capacidade carregada. **Reserve:** munição extra. **Spread:** desvio da direção do tiro. **Cooldown:** intervalo mínimo entre disparos. **Wave/onda:** grupo sequencial de zumbis.
