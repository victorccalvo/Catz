# Catz · Café dos Afetos

Protótipo de um jogo cozy de administração de cat café, criado para explorar uma rotina gentil de cuidados e amizades. Inspirado no gênero de simulação de vida, com pixel art original desenhada em Canvas, sem assets de Stardew Valley.

## Jogar

Abra `index.html` no navegador. Não exige instalação nem build. Para um endereço local estável, execute `node server.cjs` e abra http://127.0.0.1:8080 (requer Node, sem dependências externas).

## Celular

Execute `Jogar-no-WiFi.cmd` no Windows ou `node server.cjs --lan` na pasta do projeto. Com o celular e o PC na mesma rede Wi-Fi, abra `http://IP-LOCAL-DO-PC:8080` no navegador do celular. O IP está nos detalhes da conexão do Windows. O PC e o servidor precisam permanecer ligados. Caso o firewall peça acesso, permita somente na sua rede privada confiável. O servidor oferece apenas os arquivos do jogo, não a pasta inteira. Não configure encaminhamento de portas no roteador.

Há botões direcionais, ação contextual e câmera horizontal que acompanha a protagonista em telas estreitas. O layout aceita retrato e paisagem. O teste em viewport móvel não substitui teste em um aparelho real. Para jogar fora dessa rede, o projeto ainda precisa de hospedagem HTTPS; não há link público publicado nesta etapa.

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

Esta é uma base jogável, não o jogo completo. A protagonista agora tem quatro direções, animação de passos e respiração; móveis principais, prédios e troncos têm colisão. A arte recebeu iluminação, partículas, detalhes do café, cadeiras, estante e sofá. Os NPCs ficam em posições fixas e o atendimento ainda é simplificado. Expandir rotinas dos NPCs, receitas, inventário, decoração livre, história, estações, adoção responsável e objetivos narrativos. A arte é procedural e será refinada na direção visual final.

## Verificação

`node verify.cjs` verifica desenho das duas áreas, colisão, direção, câmera móvel, atendimento, quests, compras e salvamento. O teste usa uma simulação de DOM/Canvas; conferir também o jogo em navegador real.
