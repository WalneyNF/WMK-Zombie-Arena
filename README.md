<p align="center"><img src="assets/logo.svg" width="720" alt="WMK Zombie Arena"></p>

# WMK Zombie Arena

FPS 3D educacional de sobrevivência contra zumbis, construído com **HTML, CSS, JavaScript e Three.js**.

**Autor:** Walney Moreira Klein — walneyk@hotmail.com  
**Jogo-base:** v1.2.0 | **Documentação:** v1.3.0 | **Licença:** [MIT](LICENSE)

## Instalação

A versão jogável completa está disponível no pacote ZIP v1.3.0 entregue nesta conversa. **O código do jogo ainda precisa ser enviado a este repositório**; os arquivos de documentação podem ser consultados aqui.

Depois de extrair o ZIP, abra a pasta no VS Code e execute `index.html` pelo **Live Server** ou por `py -m http.server 5500`, visitando http://localhost:5500. O Three.js é carregado do CDN e exige internet. Não use `file://`.

## Mecânicas presentes no jogo-base

- Três mapas geométricos: pátio de contêineres, depósito e ruas.
- Ondas de zumbis com perseguição, ataques próximos e aumento de dificuldade.
- Pistola, submetralhadora, rifle de assalto, escopeta e rifle de precisão.
- Recarga e munição por arma, cadência, dispersão, tiros na cabeça e hitscan.
- HUD: vida, munição, onda, eliminações, pontos e precisão.

## Controles

| Tecla | Função |
|---|---|
| WASD | Mover |
| Mouse | Mirar |
| Clique esquerdo | Atirar |
| R | Recarregar |
| 1–5 | Trocar arma |
| B | Painel de armas |
| Shift | Correr |
| C / Ctrl | Agachar |
| Espaço | Pular |
| Esc | Pausar |

## Documentação em português

- [Manual do usuário](manuais/usuario.md)
- [Manual do desenvolvedor](manuais/desenvolvedor.md)
- [Mecânicas do jogo](manuais/mecanicas.md)
- [Roadmap](roadmap.html)

## Organização planejada/ZIP

```text
index.html
style.css
game.js
weapons.js
assets/logo.svg
manuais/usuario.md
manuais/desenvolvedor.md
manuais/mecanicas.md
roadmap.html
LICENSE
README.md
```

## Avisos

Este protótipo não contém modelos/animações GLB, áudio, multiplayer, economia de compras, física completa ou navmesh. É um projeto original para estudo e não reutiliza mapas, nomes de marca ou arquivos de jogos comerciais. Bibliotecas e recursos externos mantêm suas próprias licenças.
