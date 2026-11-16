# Catz · Café dos Afetos

Protótipo de um jogo cozy de administração de cat café, criado para explorar uma rotina gentil de cuidados e amizades. Inspirado no gênero de simulação de vida, com pixel art original desenhada em Canvas, sem assets de Stardew Valley.

## Jogar

Abra `index.html` no navegador. Não exige instalação nem build. Para um endereço local estável, execute `npx --yes http-server . -p 8080` e abra http://localhost:8080 (requer Node e acesso à internet na primeira execução).

WASD ou setas para andar; E para interagir; J para abrir o diário. Há controles de toque. Ative a música pelo botão Som. O progresso é salvo no localStorage do navegador; mudar de navegador, endereço ou limpar os dados pode perder o progresso. O save ainda não sincroniza entre dispositivos.

## O que já funciona

- Café e vila exploráveis, personagem com animação de caminhada.
- Três gatos com comida, diversão, carinho e petiscos.
- Limpeza das caixinhas e atendimento de cafés para ganhar moedas.
- Três moradores, amizade e pedidos com recompensas.
- Três melhorias visuais desbloqueadas por quests.
- Ciclo de dias voluntário, diário, controles de toque e música sintetizada opcional.
- Sem penalidades por atraso, morte de gatos ou limite de tempo nos pedidos.

## Próximas etapas

Esta é uma base jogável, não o jogo completo. Expandir colisões e navegação, animações direcionais, rotinas dos NPCs, receitas, inventário, decoração livre, história, estações, adoção responsável e muitos objetivos narrativos. Atualmente a movimentação tem limites de área, mas móveis e cenário não bloqueiam o personagem; os NPCs ficam em posições fixas. O atendimento é simplificado e não usa fila real. A arte é procedural e será refinada na direção visual final.
