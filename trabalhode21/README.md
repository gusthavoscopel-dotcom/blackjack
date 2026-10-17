# Blackjack 21 — versão web

Versão web do jogo de 21 (Blackjack) feito originalmente em Python com Pygame (`original/main21.py`).
Feito só com **HTML, CSS e JavaScript puro** — sem frameworks, sem servidor, sem Python na hospedagem.

**Link público:** https://blackjack-21-ads.vercel.app

> Projeto educacional. Não envolve apostas nem dinheiro real.

---

## Estrutura

```
trabalhode21/
├── index.html          → estrutura da página (mesa, botões, painel, modais)
├── style.css           → visual: mesa de feltro, cartas, animações, responsivo
├── script.js           → regras do jogo + tela + eventos
├── testes.js           → 26 testes das regras (node testes.js)
├── assets/
│   └── favicon.svg     → ícone da aba
├── original/
│   └── main21.py       → versão original em Pygame (referência)
├── README.md
└── ROTEIRO_APRESENTACAO.md
```

### Como o `script.js` está organizado

| Parte | O que faz | Equivalente no Python |
|---|---|---|
| 1. Regras e lógica | `criarBaralho`, `calcularPontos`, classe `Jogo` (sem nada de tela) | `criar_baralho`, `calcular_pontos`, `class Jogo` |
| 2. Persistência | Salva estatísticas e preferência de som no `localStorage` | — (novo) |
| 3. Som | Sons gerados com Web Audio (sem arquivos de áudio) | — (novo) |
| 4. Renderização | Cria as cartas em HTML + SVG, atualiza placar e estatísticas | `desenhar_carta`, `desenhar_mao` |
| 5. Controle da rodada | Sequência com animações (distribuir, revelar, turno do dealer) | laço `while rodando` |
| 6. Eventos | Cliques, atalhos H/S/N/M, modais | `pygame.event.get()` |

A **máquina de estados** é a mesma do original: `jogador_turno` → `dealer_turno` → `fim_de_jogo`.

---

## Regras preservadas do original

1. Baralho de 52 cartas embaralhado a cada rodada.
2. Duas cartas para o jogador e duas para o dealer; a primeira do dealer fica virada.
3. Jogador pede cartas enquanto for a vez dele.
4. **Parar** passa a vez ao dealer.
5. Dealer compra enquanto tiver **menos de 17**.
6. J, Q e K valem 10.
7. Ás vale 11, ou 1 quando 11 estouraria a mão.
8. Passou de 21 → derrota.
9–12. Comparação final: dealer estourou ou jogador com mais pontos → vitória; dealer com mais → derrota; iguais → empate.
13. Blackjack nas duas primeiras cartas encerra a rodada (empate se o dealer também tiver 21).
14. Chegar a 21 pedindo carta passa a vez automaticamente (igual ao original).
15. Botões bloqueados quando a ação não é válida.
16. Nova partida sem recarregar a página.

### Ajustes documentados (não mudam o resultado)

- **Turno do dealer animado:** no Python, `parar()` fazia o dealer comprar tudo de uma vez. Aqui foi dividido em `parar()` + `dealerComprar()` + `finalizarRodada()` para mostrar carta por carta. O método `jogarDealer()` faz exatamente o que o `parar()` original fazia, e os testes usam ele.
- **Novo jogo durante o turno do dealer:** fica bloqueado por ~2 segundos enquanto o dealer joga, para a rodada nunca ficar sem resultado. No original isso não acontecia porque o dealer jogava instantaneamente.
- **Baralho vazio:** o original criava um baralho novo; aqui também, mas sem repetir cartas que já estão na mesa. (Na prática nunca acontece, porque cada rodada começa com 52 cartas.)
- **Carta oculta:** o HTML da carta virada do dealer só é criado quando ela é revelada — não dá para "colar" pelo inspecionar elemento.
- **ESC:** no Pygame fechava o jogo; na web fecha as janelas de ajuda.

---

## Executar localmente

Não precisa instalar nada.

- **VS Code + Live Server:** abra a pasta, clique com o botão direito em `index.html` → *Open with Live Server*.
- **Python (qualquer versão 3):** na pasta do projeto, rode `python -m http.server 8000` e abra http://localhost:8000
- Abrir o `index.html` direto no navegador também funciona.

### Rodar os testes

Com o [Node.js](https://nodejs.org) instalado, na pasta do projeto:

```
node testes.js
```

---

## Publicar na Vercel

O site já está publicado em **https://blackjack-21-ads.vercel.app** (projeto `blackjack-21-ads`).
Para o grupo manter o projeto pelo GitHub:

1. **Organizar:** deixe os arquivos como na estrutura acima (o `index.html` precisa estar na raiz).
2. **Criar repositório:** em github.com → *New repository* → nome `blackjack-21` → *Create*.
3. **Enviar os arquivos:** na página do repositório, *uploading an existing file* e arraste tudo; ou pelo terminal:
   ```
   git init
   git add .
   git commit -m "Blackjack 21 web"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/blackjack-21.git
   git push -u origin main
   ```
4. **Importar na Vercel:** vercel.com → *Add New… → Project* → escolha o repositório.
   (Para manter o mesmo link, abra o projeto `blackjack-21-ads` → *Settings → Git* → *Connect Git Repository*.)
5. **Configurar como site estático:** *Framework Preset* = **Other**. Build Command e Output Directory ficam **vazios**. Nenhum `vercel.json` é necessário.
6. **Publicar:** clique em *Deploy*. Em ~10 segundos o site fica no ar.
7. **Testar o link público:** abra no computador e no celular, jogue algumas rodadas, confira o placar e o modal de ajuda.
8. **Atualizar depois:** qualquer `git push` na branch `main` publica a nova versão automaticamente.

---

## Testes realizados

**Regras (`node testes.js`) — 26/26 passaram:**
- Pontuação: J/Q/K = 10; Ás + K = 21; dois Ases = 12; quatro Ases = 14; Ás + 9 + Ás = 21; Ás + 5 + K = 16.
- Baralho: 52 cartas únicas; após distribuir sobram 48; baralho vazio refeito sem repetir cartas.
- Rodadas: Blackjack inicial vence; Blackjack dos dois empata; jogador estoura; dealer estoura; dealer maior; jogador maior; empate; dealer para em 17; dealer compra com 16; chegar a 21 passa a vez.
- Proteções: ações depois do fim não fazem nada e não contam estatística duas vezes; pedir carta no turno do dealer é ignorado.
- Estatísticas: percentual correto; 0% sem partidas; 10.000 rodadas aleatórias somam exatamente 10.000 partidas.

**Interface (navegador automatizado, 1440×900, 1366×768 e celular 390×844):**
- Sem rolagem horizontal nas três larguras.
- Carta do dealer só aparece ao fim da rodada (parar, estourar ou Blackjack).
- Botões desativados durante animações e após o fim da rodada.
- Nenhum erro de JavaScript no console.

**Publicação:** os arquivos publicados na Vercel têm o mesmo hash SHA-1 dos arquivos locais.

---

## Ideias de evolução

- Fichas virtuais (sem dinheiro real) com aposta e pagamento 3:2 no Blackjack.
- Regras extras: *double down*, *split* e seguro.
- Vários baralhos no sapato, com contagem de cartas.
- Histórico das últimas rodadas e ranking local.
- Modo multijogador com WebSocket.
- Instalação como app (PWA) e modo offline.
