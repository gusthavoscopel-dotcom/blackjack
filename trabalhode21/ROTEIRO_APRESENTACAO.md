# Roteiro de apresentação — Blackjack 21

**Duração total:** ~12 minutos + perguntas
**Link do jogo:** https://blackjack-21-ads.vercel.app
**Integrantes:** Pessoa 1, Pessoa 2, Pessoa 3, Pessoa 4 (troque pelos nomes)

| # | Quem | Tema | Tempo |
|---|---|---|---|
| 1 | Pessoa 1 | Abertura, problema e o jogo original | 2 min |
| 2 | Pessoa 2 | Regras e lógica (o "cérebro" do jogo) | 3 min |
| 3 | Pessoa 3 | Interface, gráficos e animações | 3 min |
| 4 | Pessoa 4 | Testes, publicação na Vercel, demo e conclusão | 4 min |

---

## Antes de começar (checklist)

- [ ] Abrir **https://blackjack-21-ads.vercel.app** numa aba (já testado na internet da sala).
- [ ] Abrir o VS Code com `script.js` e `original/main21.py` lado a lado.
- [ ] Deixar o terminal pronto na pasta do projeto para rodar `node testes.js`.
- [ ] Clicar em **Limpar estatísticas** para a demo começar do zero.
- [ ] Som do computador ligado (os efeitos sonoros ajudam na demo).
- [ ] **Plano B sem internet:** abrir o `index.html` direto da pasta — funciona igual.
- [ ] Ter o QR Code do link no último slide/tela para a turma jogar no celular.

---

## 1. Abertura — Pessoa 1 (2 min)

**Mostrar:** o jogo original rodando (`python original/main21.py`) ou um print dele.

> "Bom dia/boa noite. Nosso projeto é o **Blackjack 21**. Ele começou como um jogo em Python usando a biblioteca Pygame. Funcionava, mas tinha dois problemas: o visual era simples — retângulos e texto — e só rodava em quem tinha Python e Pygame instalados."

> "Nosso objetivo foi: **manter exatamente as mesmas regras**, mas transformar o jogo numa aplicação web, com visual de cassino digital, que qualquer pessoa abre por um link, no computador ou no celular."

> "Usamos só **HTML, CSS e JavaScript puro**, sem frameworks, e publicamos de graça na **Vercel**."

**Passa para Pessoa 2:** "O [nome] vai mostrar como as regras foram levadas do Python para o JavaScript."

---

## 2. Regras e lógica — Pessoa 2 (3 min)

**Mostrar:** `main21.py` e `script.js` lado a lado (parte 1 do `script.js`).

**Regras do jogo (rápido):**
> "Cada um recebe duas cartas. O objetivo é chegar mais perto de 21 que o dealer, sem passar. J, Q e K valem 10. O dealer é obrigado a comprar até ter 17 ou mais."

**A tradução Python → JavaScript:**
> "Cada função do Python tem uma equivalente com o mesmo papel: `criar_baralho` virou `criarBaralho`, `calcular_pontos` virou `calcularPontos`, e a classe `Jogo` continua sendo uma classe `Jogo`."

**Destaque 1 — o Ás** (apontar para `calcularPontos`):
> "O Ás é a parte mais interessante. Ele começa valendo 11. Se a mão passar de 21, ele vira 1 — e isso se repete para cada Ás. Por isso quatro Ases valem 14, e não 44."

**Destaque 2 — máquina de estados:**
> "O jogo tem só três estados, com os mesmos nomes do Python: **turno do jogador**, **turno do dealer** e **fim de jogo**. Cada ação verifica o estado antes de agir. Por exemplo, se a rodada já acabou, clicar em 'Pedir carta' não faz nada. Isso impede ações inválidas e evita contar a mesma vitória duas vezes."

**Destaque 3 — a única mudança estrutural:**
> "No Python, quando o jogador parava, o dealer comprava todas as cartas de uma vez. Na web a gente queria mostrar o dealer comprando carta por carta, então dividimos em três passos. Mas o resultado é idêntico — e provamos isso com testes, que a Pessoa 4 vai mostrar."

**Passa para Pessoa 3:** "Agora a parte que mais mudou: o visual."

---

## 3. Interface e gráficos — Pessoa 3 (3 min)

**Mostrar:** o site aberto. Ir apontando enquanto fala.

**Antes × depois:**
> "No Pygame as cartas eram retângulos com texto. Aqui **cada carta é desenhada com HTML e SVG**, sem nenhuma imagem baixada da internet: os naipes ficam na posição certa como num baralho de verdade, as figuras J, Q e K têm moldura dourada, e o verso tem um padrão próprio com o '21' no centro."

**A mesa:**
> "A mesa tem textura de feltro feita com um filtro SVG, borda de couro com filete dourado e a frase 'o dealer compra até 16 e para em 17' impressa em arco — como numa mesa real."

**Animações (clicar em Novo jogo e mostrar):**
> "As cartas saem do sapato, no canto da mesa, e viram no caminho. Quando eu paro, a carta escondida do dealer gira e é revelada. Ganhou? Confete dourado. Estourou? A mesa pisca em vermelho e as cartas tremem."

**Usabilidade:**
> "O indicador lá em cima mostra de quem é a vez. Os botões ficam apagados quando não podem ser usados. Os atalhos do Pygame continuam: **H** pede carta, **S** para, **N** novo jogo."

**Responsivo e acessível (redimensionar a janela ou mostrar no celular):**
> "No celular as cartas diminuem e se sobrepõem quando não cabem. Também respeitamos quem configurou o sistema para reduzir animações, e o jogo funciona inteiro pelo teclado."

**Passa para Pessoa 4:** "E para garantir que tudo isso funciona, o [nome] vai mostrar os testes e a publicação."

---

## 4. Testes, publicação e demo — Pessoa 4 (4 min)

**Testes (terminal):** rodar `node testes.js`.
> "Escrevemos 26 testes automáticos para as regras: os casos com vários Ases, Blackjack inicial, empate, jogador estourando, dealer estourando, dealer parando em 17. Um deles joga **10 mil rodadas aleatórias** e confere que as estatísticas somam exatamente 10 mil — ou seja, nenhuma rodada é contada duas vezes."

**Publicação:**
> "Como é só HTML, CSS e JavaScript, não precisa de servidor. A Vercel hospeda de graça como site estático. O fluxo é: código no GitHub, a Vercel importa o repositório, e a cada atualização o site é republicado sozinho."

**Estatísticas:**
> "O painel mostra vitórias, derrotas, empates e o percentual de vitórias. Ele fica salvo no navegador com `localStorage` — se fechar e abrir de novo, continua lá. Mas fica só naquele navegador; não vai para outro aparelho."

**Demo ao vivo (1 min):** jogar 2 ou 3 rodadas narrando:
- "Tenho 13, vou pedir carta…" (H)
- "Tenho 18, vou parar." (S) → mostrar a carta do dealer virando e ele comprando.
- Apontar o placar atualizando.

**Conclusão:**
> "Resumindo: pegamos um jogo que só rodava com Python instalado e transformamos numa aplicação web, com as **mesmas regras**, visual profissional, testes automáticos e um link que qualquer um abre. Como próximos passos, pensamos em fichas virtuais, as jogadas *double* e *split*, e transformar em app instalável."

> "O link está na tela — quem quiser pode jogar agora pelo celular. Obrigado! Ficamos à disposição para perguntas."

---

## Perguntas prováveis (quem responde)

**"Por que não usaram React ou outro framework?"** — Pessoa 3
> O projeto é pequeno e o objetivo era mostrar os fundamentos. JavaScript puro deixa o site leve (menos de 80 KB) e sem etapa de build.

**"As regras mudaram em relação ao Python?"** — Pessoa 2
> Não. A única mudança foi dividir o turno do dealer em passos para animar. O resultado é o mesmo, e os testes comprovam. As diferenças estão documentadas no README.

**"Como o Ás é calculado?"** — Pessoa 2
> Soma tudo com Ás valendo 11. Enquanto passar de 21 e ainda houver Ás contando 11, tira 10.

**"Dá para trapacear vendo a carta do dealer no 'inspecionar elemento'?"** — Pessoa 3
> Não. A frente da carta escondida só é criada no HTML no momento em que ela é revelada.

**"Onde ficam salvos os dados?"** — Pessoa 4
> No `localStorage` do navegador. Não há banco de dados nem envio de dados para nenhum servidor.

**"Envolve dinheiro ou aposta?"** — Pessoa 1
> Não. É um projeto educacional, sem apostas — está escrito no rodapé.

**"O que acontece se acabarem as cartas?"** — Pessoa 2
> Cada rodada começa com 52 cartas e nenhuma rodada usa todas. Mesmo assim, há proteção: um baralho novo é criado sem repetir as cartas que estão na mesa.

---

## Dicas para o grupo

- Ensaiem uma vez cronometrando — a demo costuma demorar mais que o previsto.
- Quem não está falando controla o computador para quem está.
- Se a sorte não ajudar na demo, clique em **Novo jogo** até sair uma mão interessante (13–16 é ótimo para mostrar a decisão).
- Troquem "Integrante 2, 3, 4" no rodapé do `index.html` pelos nomes reais antes de apresentar (linha marcada com `EDITE AQUI`).
