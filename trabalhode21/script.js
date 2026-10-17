'use strict';
/* =========================================================
   BLACKJACK 21 — versão web
   Baseado em original/main21.py (Python + Pygame).

   Organização do arquivo:
   1. Regras e lógica do jogo  (sem DOM — mesma lógica do Python)
   2. Persistência             (localStorage)
   3. Som                      (Web Audio, sem arquivos externos)
   4. Renderização             (cria e atualiza elementos na tela)
   5. Controle da rodada       (sequência de ações + animações)
   6. Eventos                  (cliques, teclado, modais)
   ========================================================= */

/* =========================================================
   1. REGRAS E LÓGICA
   ========================================================= */

const NAIPES = [
  { id: 'espadas', simbolo: '♠', vermelho: false },
  { id: 'copas',   simbolo: '♥', vermelho: true  },
  { id: 'ouros',   simbolo: '♦', vermelho: true  },
  { id: 'paus',    simbolo: '♣', vermelho: false },
];
const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Máquina de estados (mesmos nomes do Python)
const ESTADOS = Object.freeze({
  JOGADOR_TURNO: 'jogador_turno',
  DEALER_TURNO: 'dealer_turno',
  FIM_DE_JOGO: 'fim_de_jogo',
});

/** Equivale a Carta.valor_numerico(): J/Q/K = 10, Ás = 11, demais = número. */
function valorNumerico(carta) {
  if (carta.valor === 'J' || carta.valor === 'Q' || carta.valor === 'K') return 10;
  if (carta.valor === 'A') return 11;
  return Number(carta.valor);
}

/** Equivale a criar_baralho(): 52 cartas embaralhadas (Fisher–Yates). */
function criarBaralho(aleatorio = Math.random) {
  const baralho = [];
  for (const naipe of NAIPES) {
    for (const valor of VALORES) {
      baralho.push({ id: `${valor}-${naipe.id}`, valor, naipe });
    }
  }
  for (let i = baralho.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [baralho[i], baralho[j]] = [baralho[j], baralho[i]];
  }
  return baralho;
}

/** Equivale a calcular_pontos(): Ás vale 11 e vira 1 enquanto a mão passar de 21. */
function calcularPontos(mao) {
  let pontos = mao.reduce((soma, carta) => soma + valorNumerico(carta), 0);
  let ases = mao.filter((carta) => carta.valor === 'A').length;
  while (pontos > 21 && ases > 0) {
    pontos -= 10;
    ases -= 1;
  }
  return pontos;
}

/**
 * Equivale à classe Jogo do Python.
 * Única diferença estrutural: o parar() original fazia o dealer comprar tudo de uma vez.
 * Aqui ele foi dividido em parar() + dealerComprar() + finalizarRodada() para a tela
 * poder animar cada carta do dealer. O resultado é idêntico (ver jogarDealer()).
 */
class Jogo {
  constructor(estatisticas = {}, fabricaBaralho = criarBaralho) {
    this.estatisticas = {
      vitorias: estatisticas.vitorias || 0,
      derrotas: estatisticas.derrotas || 0,
      empates: estatisticas.empates || 0,
    };
    this.fabricaBaralho = fabricaBaralho;
    this.baralho = [];
    this.maoJogador = [];
    this.maoDealer = [];
    this.estado = ESTADOS.FIM_DE_JOGO;
    this.mensagem = '';
    this.resultado = null; // 'vitoria' | 'derrota' | 'empate'
    this.blackjack = false;
  }

  novoJogo() {
    this.baralho = this.fabricaBaralho();
    this.maoJogador = [];
    this.maoDealer = [];
    this.maoJogador.push(this.comprarCarta(), this.comprarCarta());
    this.maoDealer.push(this.comprarCarta(), this.comprarCarta());
    this.estado = ESTADOS.JOGADOR_TURNO;
    this.mensagem = '';
    this.resultado = null;
    this.blackjack = false;

    // Blackjack imediato (mesma regra do original)
    if (calcularPontos(this.maoJogador) === 21) {
      this.blackjack = true;
      if (calcularPontos(this.maoDealer) === 21) {
        this.encerrar('empate', 'Empate! Ambos tiraram Blackjack.');
      } else {
        this.encerrar('vitoria', 'Blackjack! Você venceu!');
      }
    }
  }

  comprarCarta() {
    if (this.baralho.length === 0) {
      // O original criava um baralho novo. Aqui também, mas sem repetir as cartas que já estão na mesa.
      const naMesa = new Set([...this.maoJogador, ...this.maoDealer].map((c) => c.id));
      this.baralho = this.fabricaBaralho().filter((c) => !naMesa.has(c.id));
    }
    return this.baralho.pop();
  }

  pedirCarta() {
    if (this.estado !== ESTADOS.JOGADOR_TURNO) return false;
    this.maoJogador.push(this.comprarCarta());
    const pontos = calcularPontos(this.maoJogador);
    if (pontos > 21) {
      this.encerrar('derrota', 'Você estourou! O dealer venceu.');
    } else if (pontos === 21) {
      this.parar(); // chegou a 21: passa a vez automaticamente, como no original
    }
    return true;
  }

  parar() {
    if (this.estado !== ESTADOS.JOGADOR_TURNO) return false;
    this.estado = ESTADOS.DEALER_TURNO;
    return true;
  }

  /** Dealer compra cartas até somar 17 ou mais. */
  dealerDeveComprar() {
    return this.estado === ESTADOS.DEALER_TURNO && calcularPontos(this.maoDealer) < 17;
  }

  dealerComprar() {
    if (!this.dealerDeveComprar()) return null;
    const carta = this.comprarCarta();
    this.maoDealer.push(carta);
    return carta;
  }

  finalizarRodada() {
    // Só finaliza uma vez e só depois de o dealer terminar de comprar
    if (this.estado !== ESTADOS.DEALER_TURNO || this.dealerDeveComprar()) return false;
    const pontosJogador = calcularPontos(this.maoJogador);
    const pontosDealer = calcularPontos(this.maoDealer);

    if (pontosDealer > 21) this.encerrar('vitoria', 'O dealer estourou! Você venceu!');
    else if (pontosDealer > pontosJogador) this.encerrar('derrota', 'O dealer venceu!');
    else if (pontosDealer < pontosJogador) this.encerrar('vitoria', 'Você venceu!');
    else this.encerrar('empate', 'Empate!');
    return true;
  }

  /** Versão "de uma vez" do turno do dealer — idêntica ao parar() do Python. Usada nos testes. */
  jogarDealer() {
    while (this.dealerComprar());
    return this.finalizarRodada();
  }

  encerrar(resultado, mensagem) {
    this.estado = ESTADOS.FIM_DE_JOGO;
    this.resultado = resultado;
    this.mensagem = mensagem;
    const chave = { vitoria: 'vitorias', derrota: 'derrotas', empate: 'empates' }[resultado];
    this.estatisticas[chave] += 1;
  }
}

/** Totais e percentual de vitórias (vitórias ÷ partidas). */
function resumirEstatisticas({ vitorias, derrotas, empates }) {
  const partidas = vitorias + derrotas + empates;
  const taxa = partidas > 0 ? (vitorias / partidas) * 100 : 0;
  return { vitorias, derrotas, empates, partidas, taxa };
}

// Permite rodar os testes no Node (node testes.js) sem navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NAIPES, VALORES, ESTADOS, valorNumerico, criarBaralho, calcularPontos, Jogo, resumirEstatisticas };
}

/* =========================================================
   2–6. NAVEGADOR
   ========================================================= */
if (typeof document !== 'undefined') {
  iniciarInterface();
}

function iniciarInterface() {
  /* ---------- 2. PERSISTÊNCIA ---------- */
  const CHAVES = { stats: 'bj21.estatisticas', som: 'bj21.som', visitou: 'bj21.visitou' };

  // localStorage pode falhar (aba anônima, bloqueio) — o jogo continua funcionando sem ele.
  const armazenamento = {
    ler(chave, padrao) {
      try {
        const valor = localStorage.getItem(chave);
        return valor === null ? padrao : JSON.parse(valor);
      } catch {
        return padrao;
      }
    },
    gravar(chave, valor) {
      try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ }
    },
    remover(chave) {
      try { localStorage.removeItem(chave); } catch { /* sem armazenamento */ }
    },
  };

  function lerEstatisticas() {
    const salvo = armazenamento.ler(CHAVES.stats, {}) || {};
    const inteiro = (n) => (Number.isInteger(n) && n >= 0 ? n : 0);
    return { vitorias: inteiro(salvo.vitorias), derrotas: inteiro(salvo.derrotas), empates: inteiro(salvo.empates) };
  }

  /* ---------- 3. SOM ---------- */
  const som = {
    ativo: armazenamento.ler(CHAVES.som, true) !== false,
    liberado: false, // navegadores só permitem áudio depois de uma interação do usuário
    ctx: null,

    contexto() {
      if (!this.ativo || !this.liberado) return null;
      if (!this.ctx) {
        const Contexto = window.AudioContext || window.webkitAudioContext;
        if (!Contexto) return null;
        this.ctx = new Contexto();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },

    tom(ctx, freq, inicio, duracao, tipo, volume) {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = tipo;
      osc.frequency.value = freq;
      ganho.gain.setValueAtTime(0.0001, inicio);
      ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.015);
      ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(inicio);
      osc.stop(inicio + duracao + 0.02);
    },

    ruido(ctx, inicio, duracao, volume, frequencia) {
      const tamanho = Math.floor(ctx.sampleRate * duracao);
      const buffer = ctx.createBuffer(1, tamanho, ctx.sampleRate);
      const dados = buffer.getChannelData(0);
      for (let i = 0; i < tamanho; i++) dados[i] = (Math.random() * 2 - 1) * (1 - i / tamanho);
      const fonte = ctx.createBufferSource();
      const filtro = ctx.createBiquadFilter();
      const ganho = ctx.createGain();
      fonte.buffer = buffer;
      filtro.type = 'bandpass';
      filtro.frequency.value = frequencia;
      filtro.Q.value = 0.8;
      ganho.gain.value = volume;
      fonte.connect(filtro).connect(ganho).connect(ctx.destination);
      fonte.start(inicio);
    },

    tocar(nome) {
      const ctx = this.contexto();
      if (!ctx) return;
      const t = ctx.currentTime;
      switch (nome) {
        case 'carta':
          this.ruido(ctx, t, 0.09, 0.35, 2600);
          break;
        case 'virar':
          this.ruido(ctx, t, 0.05, 0.25, 3400);
          this.ruido(ctx, t + 0.07, 0.06, 0.2, 2000);
          break;
        case 'vitoria':
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tom(ctx, f, t + i * 0.09, 0.4, 'triangle', 0.09));
          break;
        case 'derrota':
          this.tom(ctx, 311, t, 0.3, 'sine', 0.1);
          this.tom(ctx, 233, t + 0.2, 0.5, 'sine', 0.1);
          break;
        case 'empate':
          this.tom(ctx, 440, t, 0.3, 'sine', 0.06);
          this.tom(ctx, 440, t + 0.18, 0.3, 'sine', 0.05);
          break;
      }
    },
  };

  /* ---------- 4. RENDERIZAÇÃO ---------- */
  const $ = (id) => document.getElementById(id);
  const ui = {
    feltro: $('feltro'),
    sapato: $('sapato'),
    contagem: $('contagemBaralho'),
    maoDealer: $('maoDealer'),
    maoJogador: $('maoJogador'),
    pontosDealer: $('pontosDealer'),
    pontosJogador: $('pontosJogador'),
    lugarJogador: $('lugarJogador'),
    centroMesa: document.querySelector('.centro-mesa'),
    resultado: $('resultado'),
    resultadoSelo: $('resultadoSelo'),
    resultadoMensagem: $('resultadoMensagem'),
    resultadoPlacar: $('resultadoPlacar'),
    status: $('status'),
    statusTexto: $('statusTexto'),
    btnPedir: $('btnPedir'),
    btnParar: $('btnParar'),
    btnNovo: $('btnNovo'),
    btnJogarNovamente: $('btnJogarNovamente'),
    btnSom: $('btnSom'),
    btnAjuda: $('btnAjuda'),
    btnLimpar: $('btnLimpar'),
    btnConfirmarLimpar: $('btnConfirmarLimpar'),
    dlgAjuda: $('dlgAjuda'),
    dlgBoasVindas: $('dlgBoasVindas'),
    dlgConfirmar: $('dlgConfirmar'),
    confete: $('confete'),
    taxa: $('taxa'),
    stat: {
      vitorias: $('statVitorias'),
      derrotas: $('statDerrotas'),
      empates: $('statEmpates'),
      partidas: $('statPartidas'),
      taxa: $('statTaxa'),
    },
  };

  const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const espera = (ms) => new Promise((ok) => setTimeout(ok, movimentoReduzido.matches ? Math.min(ms, 60) : ms));

  // Posição de cada naipe nas cartas de 2 a 10 (x, y em % da área central)
  const PIPS = {
    2: [[50, 0], [50, 100]],
    3: [[50, 0], [50, 50], [50, 100]],
    4: [[0, 0], [100, 0], [0, 100], [100, 100]],
    5: [[0, 0], [100, 0], [50, 50], [0, 100], [100, 100]],
    6: [[0, 0], [100, 0], [0, 50], [100, 50], [0, 100], [100, 100]],
    7: [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [0, 100], [100, 100]],
    8: [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [50, 75], [0, 100], [100, 100]],
    9: [[0, 0], [100, 0], [0, 33.3], [100, 33.3], [50, 50], [0, 66.7], [100, 66.7], [0, 100], [100, 100]],
    10: [[0, 0], [100, 0], [50, 16.7], [0, 33.3], [100, 33.3], [0, 66.7], [100, 66.7], [50, 83.3], [0, 100], [100, 100]],
  };
  const NOMES_VALOR = { A: 'Ás', J: 'Valete', Q: 'Dama', K: 'Rei' };

  const nomeCarta = (c) => `${NOMES_VALOR[c.valor] || c.valor} de ${c.naipe.id}`;
  const svgNaipe = (naipe, classe, estilo = '') =>
    `<svg class="${classe}"${estilo} aria-hidden="true" focusable="false"><use href="#naipe-${naipe.id}"></use></svg>`;

  function htmlFrente(carta) {
    const { valor, naipe } = carta;
    const canto = `<span class="rank">${valor}</span>${svgNaipe(naipe, 'canto-naipe')}`;
    let centro;
    if (valor === 'A') {
      centro = `<div class="centro centro-as">${svgNaipe(naipe, 'naipe-as')}</div>`;
    } else if (valor === 'J' || valor === 'Q' || valor === 'K') {
      const ornamento = valor === 'J' ? 'estrela' : 'coroa';
      centro = `<div class="centro figura">
          <svg class="figura-orn" aria-hidden="true" focusable="false"><use href="#orn-${ornamento}"></use></svg>
          <span class="figura-letra">${valor}</span>
          ${svgNaipe(naipe, 'figura-naipe')}
        </div>`;
    } else {
      const pips = PIPS[valor]
        .map(([x, y]) => svgNaipe(naipe, `pip${y > 50 ? ' invertido' : ''}`, ` style="--x:${x}%;--y:${y}%"`))
        .join('');
      centro = `<div class="centro pips">${pips}</div>`;
    }
    return `<div class="canto sup">${canto}</div>${centro}<div class="canto inf">${canto}</div>`;
  }

  /** Cria o elemento da carta. Carta oculta não recebe a frente no HTML (não dá para "espiar" pelo inspecionar). */
  function criarElementoCarta(carta, oculta) {
    const el = document.createElement('div');
    el.className = `carta ${carta.naipe.vermelho ? 'vermelha' : 'preta'}${oculta ? ' oculta' : ''}`;
    el.setAttribute('role', 'img');
    if (!oculta) el.dataset.valor = carta.valor;
    el.setAttribute('aria-label', oculta ? 'Carta virada para baixo' : nomeCarta(carta));
    el.innerHTML = `<div class="carta-inner"><div class="face frente">${oculta ? '' : htmlFrente(carta)}</div><div class="face verso"></div></div>`;
    return el;
  }

  /** Sobrepõe as cartas quando não cabem lado a lado. */
  function ajustarMao(maoEl) {
    const cartas = maoEl.children;
    if (cartas.length < 2) return;
    const larguraCarta = cartas[0].offsetWidth;
    const disponivel = maoEl.clientWidth - 8;
    const espaco = larguraCarta * 0.14;
    const natural = cartas.length * larguraCarta + (cartas.length - 1) * espaco;
    const margem = natural <= disponivel
      ? espaco
      : (disponivel - larguraCarta) / (cartas.length - 1) - larguraCarta;
    maoEl.style.setProperty('--sobrepor', `${margem}px`);
  }

  /** Adiciona uma carta à mão com animação saindo do sapato. */
  function distribuirCarta(maoEl, carta, oculta = false) {
    const el = criarElementoCarta(carta, oculta);
    maoEl.appendChild(el);
    ajustarMao(maoEl);

    const origem = ui.sapato.getBoundingClientRect();
    const destino = el.getBoundingClientRect();
    el.style.setProperty('--dx', `${origem.left + origem.width / 2 - (destino.left + destino.width / 2)}px`);
    el.style.setProperty('--dy', `${origem.top + origem.height / 2 - (destino.top + destino.height / 2)}px`);
    el.classList.add('chegando');
    el.addEventListener('animationend', (e) => {
      if (e.target === el) el.classList.remove('chegando');
    });
    som.tocar('carta');
    return el;
  }

  /** Vira a carta oculta do dealer (a frente só é criada agora). */
  function revelarCarta(el, carta) {
    if (!el || !el.classList.contains('oculta')) return;
    el.querySelector('.frente').innerHTML = htmlFrente(carta);
    el.setAttribute('aria-label', nomeCarta(carta));
    el.dataset.valor = carta.valor;
    void el.offsetWidth; // garante que a transição de giro aconteça
    el.classList.remove('oculta');
    som.tocar('virar');
  }

  function atualizarPlacar(el, texto, rotulo, pontos) {
    if (el.textContent !== String(texto)) {
      el.textContent = texto;
      el.classList.remove('atualizou');
      void el.offsetWidth;
      el.classList.add('atualizou');
    }
    el.setAttribute('aria-label', rotulo);
    el.classList.toggle('vinte-um', pontos === 21);
    el.classList.toggle('estourou', pontos > 21);
  }

  /** Atualiza os pontos considerando só as cartas já visíveis na mesa. */
  function atualizarPontos() {
    const visiveisJogador = jogo.maoJogador.slice(0, ui.maoJogador.children.length);
    const pj = calcularPontos(visiveisJogador);
    atualizarPlacar(ui.pontosJogador, pj, `Seus pontos: ${pj}`, pj);
    ui.maoJogador.classList.toggle('vinte-um', pj === 21);

    const dealerOculto = ui.maoDealer.querySelector('.carta.oculta');
    if (dealerOculto || ui.maoDealer.children.length === 0) {
      atualizarPlacar(ui.pontosDealer, '?', 'Pontos do dealer: oculto', 0);
    } else {
      const pd = calcularPontos(jogo.maoDealer.slice(0, ui.maoDealer.children.length));
      atualizarPlacar(ui.pontosDealer, pd, `Pontos do dealer: ${pd}`, pd);
    }
    ui.contagem.textContent = jogo.baralho.length;
  }

  function definirStatus(estado, texto) {
    ui.status.dataset.estado = estado;
    ui.statusTexto.textContent = texto;
  }

  /** Habilita/desabilita botões conforme o estado (evita ações inválidas e cliques repetidos). */
  function atualizarControles() {
    const podeJogar = jogo.estado === ESTADOS.JOGADOR_TURNO && !ocupado;
    ui.btnPedir.disabled = !podeJogar;
    ui.btnParar.disabled = !podeJogar;
    ui.btnNovo.disabled = ocupado || jogo.estado === ESTADOS.DEALER_TURNO;
    ui.btnJogarNovamente.disabled = ocupado;
    ui.lugarJogador.classList.toggle('ativo', podeJogar);
    if (podeJogar) definirStatus('jogador', 'Sua vez — peça carta ou pare');
  }

  function renderizarEstatisticas(animar = false) {
    const r = resumirEstatisticas(jogo.estatisticas);
    const formatoTaxa = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
    for (const chave of ['vitorias', 'derrotas', 'empates', 'partidas']) {
      const el = ui.stat[chave];
      if (el.textContent !== String(r[chave])) {
        el.textContent = r[chave];
        if (animar) {
          el.classList.remove('atualizou');
          void el.offsetWidth;
          el.classList.add('atualizou');
        }
      }
    }
    ui.stat.taxa.textContent = `${formatoTaxa.format(r.taxa)}%`;
    ui.taxa.style.setProperty('--taxa', r.taxa.toFixed(2));
  }

  function mostrarResultado() {
    const pj = calcularPontos(jogo.maoJogador);
    const pd = calcularPontos(jogo.maoDealer);
    const selos = {
      vitoria: jogo.blackjack ? 'Blackjack!' : 'Vitória',
      derrota: 'Derrota',
      empate: 'Empate',
    };
    ui.resultado.dataset.tipo = jogo.resultado;
    ui.resultadoSelo.textContent = selos[jogo.resultado];
    ui.resultadoMensagem.textContent = jogo.mensagem;
    ui.resultadoPlacar.textContent = `Você ${pj} × ${pd} Dealer`;
    ui.resultado.hidden = false;
    ui.centroMesa.classList.add('com-resultado');

    // Efeitos visuais e sonoros de cada resultado
    if (jogo.resultado === 'vitoria') {
      som.tocar('vitoria');
      soltarConfete(jogo.blackjack ? 110 : 70);
    } else if (jogo.resultado === 'derrota') {
      som.tocar('derrota');
      reiniciarAnimacao(ui.feltro, 'efeito-derrota');
      if (pj > 21) {
        reiniciarAnimacao(ui.maoJogador, 'tremer');
        ui.maoJogador.lastElementChild?.classList.add('carta-estouro');
      }
    } else {
      som.tocar('empate');
    }

    armazenamento.gravar(CHAVES.stats, jogo.estatisticas);
    renderizarEstatisticas(true);
    definirStatus('fim', 'Rodada encerrada');
  }

  function esconderResultado() {
    ui.resultado.hidden = true;
    ui.centroMesa.classList.remove('com-resultado');
  }

  function reiniciarAnimacao(el, classe) {
    el.classList.remove(classe);
    void el.offsetWidth;
    el.classList.add(classe);
    el.addEventListener('animationend', () => el.classList.remove(classe), { once: true });
  }

  function soltarConfete(quantidade) {
    if (movimentoReduzido.matches) return;
    const cores = ['#e6c77d', '#f6e3ae', '#ffffff', '#6ee7a0', '#c03652'];
    const fragmento = document.createDocumentFragment();
    for (let i = 0; i < quantidade; i++) {
      const p = document.createElement('i');
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = cores[i % cores.length];
      p.style.setProperty('--dur', `${1.8 + Math.random() * 1.6}s`);
      p.style.setProperty('--atraso', `${Math.random() * 0.4}s`);
      p.style.setProperty('--deriva', `${(Math.random() - 0.5) * 240}px`);
      p.style.setProperty('--giro', `${360 + Math.random() * 720}deg`);
      if (i % 3 === 0) p.style.borderRadius = '50%';
      fragmento.appendChild(p);
    }
    ui.confete.appendChild(fragmento);
    setTimeout(() => { ui.confete.innerHTML = ''; }, 4000);
  }

  /* ---------- 5. CONTROLE DA RODADA ---------- */
  let jogo = new Jogo(lerEstatisticas());
  let ocupado = false; // true enquanto há animação: bloqueia cliques repetidos

  async function executar(acao) {
    if (ocupado) return;
    ocupado = true;
    atualizarControles();
    try {
      await acao();
    } finally {
      ocupado = false;
      atualizarControles();
    }
  }

  async function recolherCartas() {
    const cartas = [...ui.maoDealer.children, ...ui.maoJogador.children];
    if (cartas.length === 0) return;
    cartas.forEach((c, i) => {
      c.style.transitionDelay = `${i * 25}ms`;
      c.classList.add('saindo');
    });
    await espera(380);
    ui.maoDealer.innerHTML = '';
    ui.maoJogador.innerHTML = '';
    ui.maoDealer.style.removeProperty('--sobrepor');
    ui.maoJogador.style.removeProperty('--sobrepor');
    ui.maoJogador.classList.remove('vinte-um');
  }

  function novaRodada() {
    return executar(async () => {
      if (jogo.estado === ESTADOS.DEALER_TURNO) return;
      esconderResultado();
      definirStatus('distribuindo', 'Distribuindo cartas…');
      await recolherCartas();

      jogo.novoJogo();
      atualizarPontos();
      await espera(150);

      // Distribuição alternada, como em um cassino. A 1ª carta do dealer fica virada (igual ao original).
      const ordem = [
        [ui.maoJogador, jogo.maoJogador[0], false],
        [ui.maoDealer, jogo.maoDealer[0], true],
        [ui.maoJogador, jogo.maoJogador[1], false],
        [ui.maoDealer, jogo.maoDealer[1], false],
      ];
      for (const [mao, carta, oculta] of ordem) {
        distribuirCarta(mao, carta, oculta);
        atualizarPontos();
        await espera(260);
      }
      await espera(250);

      if (jogo.estado === ESTADOS.FIM_DE_JOGO) {
        // Blackjack inicial: a carta do dealer é revelada e a rodada termina
        revelarCarta(ui.maoDealer.firstElementChild, jogo.maoDealer[0]);
        await espera(600);
        atualizarPontos();
        mostrarResultado();
      }
    });
  }

  function pedirCarta() {
    return executar(async () => {
      if (!jogo.pedirCarta()) return;
      pulsar(ui.btnPedir);
      distribuirCarta(ui.maoJogador, jogo.maoJogador.at(-1));
      await espera(320);
      atualizarPontos();
      await espera(200);

      if (jogo.estado === ESTADOS.FIM_DE_JOGO) {
        // Estourou: no original a carta do dealer aparece assim que a rodada acaba
        revelarCarta(ui.maoDealer.firstElementChild, jogo.maoDealer[0]);
        await espera(600);
        atualizarPontos();
        mostrarResultado();
      } else if (jogo.estado === ESTADOS.DEALER_TURNO) {
        await turnoDealer();
      }
    });
  }

  function parar() {
    return executar(async () => {
      if (!jogo.parar()) return;
      pulsar(ui.btnParar);
      await turnoDealer();
    });
  }

  /** Turno do dealer, carta por carta (mesma regra do original: compra enquanto tiver menos de 17). */
  async function turnoDealer() {
    definirStatus('dealer', 'Vez do dealer');
    ui.lugarJogador.classList.remove('ativo');
    await espera(250);
    revelarCarta(ui.maoDealer.firstElementChild, jogo.maoDealer[0]);
    await espera(650);
    atualizarPontos();

    while (jogo.dealerDeveComprar()) {
      await espera(450);
      const carta = jogo.dealerComprar();
      distribuirCarta(ui.maoDealer, carta);
      await espera(330);
      atualizarPontos();
    }
    await espera(350);
    if (jogo.finalizarRodada()) mostrarResultado();
  }

  function pulsar(botao) {
    reiniciarAnimacao(botao, 'pulso');
  }

  /* ---------- 6. EVENTOS ---------- */
  ui.btnPedir.addEventListener('click', pedirCarta);
  ui.btnParar.addEventListener('click', parar);
  ui.btnNovo.addEventListener('click', novaRodada);
  ui.btnJogarNovamente.addEventListener('click', novaRodada);

  // Som
  function aplicarSom() {
    ui.btnSom.setAttribute('aria-pressed', String(som.ativo));
    ui.btnSom.setAttribute('aria-label', som.ativo ? 'Som ativado. Clique para desativar' : 'Som desativado. Clique para ativar');
  }
  function alternarSom() {
    som.ativo = !som.ativo;
    armazenamento.gravar(CHAVES.som, som.ativo);
    aplicarSom();
  }
  ui.btnSom.addEventListener('click', alternarSom);
  aplicarSom();
  const liberarAudio = () => { som.liberado = true; };
  window.addEventListener('pointerdown', liberarAudio, { once: true });
  window.addEventListener('keydown', liberarAudio, { once: true });

  // Modais
  const abrirModal = (dlg) => { if (!dlg.open) dlg.showModal(); };
  ui.btnAjuda.addEventListener('click', () => abrirModal(ui.dlgAjuda));
  document.querySelectorAll('[data-fechar]').forEach((b) =>
    b.addEventListener('click', () => b.closest('dialog').close()));
  document.querySelectorAll('[data-abrir-ajuda]').forEach((b) =>
    b.addEventListener('click', () => { b.closest('dialog').close(); abrirModal(ui.dlgAjuda); }));
  // Clique fora da caixa fecha o modal
  document.querySelectorAll('dialog').forEach((dlg) =>
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }));

  // Limpar estatísticas (com confirmação)
  ui.btnLimpar.addEventListener('click', () => abrirModal(ui.dlgConfirmar));
  ui.btnConfirmarLimpar.addEventListener('click', () => {
    jogo.estatisticas = { vitorias: 0, derrotas: 0, empates: 0 };
    armazenamento.remover(CHAVES.stats);
    renderizarEstatisticas(true);
    ui.dlgConfirmar.close();
  });

  // Atalhos de teclado (os mesmos do Pygame: H, S, N)
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    const tecla = e.key.toLowerCase();
    if (tecla === 'h' && !ui.btnPedir.disabled) pedirCarta();
    else if (tecla === 's' && !ui.btnParar.disabled) parar();
    else if (tecla === 'n' && !ui.btnNovo.disabled) novaRodada();
    else if (tecla === 'm') alternarSom();
  });

  // Reorganiza as cartas quando a tela muda de tamanho
  let temporizador;
  window.addEventListener('resize', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { ajustarMao(ui.maoDealer); ajustarMao(ui.maoJogador); }, 100);
  });

  // Início: boas-vindas na primeira visita, depois distribui a primeira rodada
  renderizarEstatisticas();
  atualizarControles();
  if (!armazenamento.ler(CHAVES.visitou, false)) {
    armazenamento.gravar(CHAVES.visitou, true);
    abrirModal(ui.dlgBoasVindas);
    ui.dlgBoasVindas.addEventListener('close', () => {
      if (!ui.dlgAjuda.open) novaRodada();
      else ui.dlgAjuda.addEventListener('close', novaRodada, { once: true });
    }, { once: true });
  } else {
    novaRodada();
  }
}
