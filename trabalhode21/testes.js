// Testes das regras do jogo. Rodar com:  node testes.js
const assert = require('assert');
const { ESTADOS, criarBaralho, calcularPontos, Jogo, resumirEstatisticas, NAIPES } = require('./script.js');

const c = (valor, naipe = 'espadas') => ({ id: `${valor}-${naipe}`, valor, naipe: NAIPES.find((n) => n.id === naipe) });

/** Monta um baralho "viciado": as cartas saem na ordem da lista (pop tira do fim). */
const baralhoFixo = (...valores) => () => valores.map((v, i) => c(v, NAIPES[i % 4].id)).reverse();

let total = 0;
function teste(nome, fn) {
  fn();
  total++;
  console.log(`  ✓ ${nome}`);
}

console.log('Pontuação');
teste('J, Q e K valem 10', () => assert.strictEqual(calcularPontos([c('J'), c('Q'), c('K')]), 30));
teste('Ás + K = 21', () => assert.strictEqual(calcularPontos([c('A'), c('K')]), 21));
teste('Dois Ases = 12', () => assert.strictEqual(calcularPontos([c('A'), c('A')]), 12));
teste('Quatro Ases = 14', () => assert.strictEqual(calcularPontos([c('A'), c('A'), c('A'), c('A')]), 14));
teste('Ás + 9 + Ás = 21', () => assert.strictEqual(calcularPontos([c('A'), c('9'), c('A')]), 21));
teste('Ás + 5 + K = 16 (Ás vira 1)', () => assert.strictEqual(calcularPontos([c('A'), c('5'), c('K')]), 16));
teste('Mão vazia = 0', () => assert.strictEqual(calcularPontos([]), 0));

console.log('Baralho');
teste('52 cartas únicas', () => {
  const b = criarBaralho();
  assert.strictEqual(b.length, 52);
  assert.strictEqual(new Set(b.map((x) => x.id)).size, 52);
});
teste('Distribuição inicial: 2 + 2 e sobram 48', () => {
  const j = new Jogo();
  j.novoJogo();
  assert.strictEqual(j.maoJogador.length, 2);
  assert.strictEqual(j.maoDealer.length, 2);
  assert.strictEqual(j.baralho.length, 48);
});
teste('Baralho vazio é refeito sem repetir cartas da mesa', () => {
  const j = new Jogo();
  j.novoJogo();
  j.baralho = [];
  const nova = j.comprarCarta();
  const naMesa = [...j.maoJogador, ...j.maoDealer].map((x) => x.id);
  assert.ok(!naMesa.includes(nova.id));
  assert.strictEqual(j.baralho.length, 52 - 4 - 1);
});

console.log('Rodadas');
// Ordem de compra no novoJogo: jogador, jogador, dealer, dealer (igual ao Python)
teste('Blackjack inicial vence', () => {
  const j = new Jogo({}, baralhoFixo('A', 'K', '9', '7'));
  j.novoJogo();
  assert.strictEqual(j.estado, ESTADOS.FIM_DE_JOGO);
  assert.strictEqual(j.resultado, 'vitoria');
  assert.strictEqual(j.mensagem, 'Blackjack! Você venceu!');
  assert.deepStrictEqual(j.estatisticas, { vitorias: 1, derrotas: 0, empates: 0 });
});
teste('Blackjack dos dois = empate', () => {
  const j = new Jogo({}, baralhoFixo('A', 'K', 'A', 'Q'));
  j.novoJogo();
  assert.strictEqual(j.resultado, 'empate');
  assert.strictEqual(j.mensagem, 'Empate! Ambos tiraram Blackjack.');
});
teste('Jogador estoura → derrota', () => {
  const j = new Jogo({}, baralhoFixo('K', '6', '9', '8', 'Q'));
  j.novoJogo();
  j.pedirCarta();
  assert.strictEqual(calcularPontos(j.maoJogador), 26);
  assert.strictEqual(j.resultado, 'derrota');
  assert.strictEqual(j.mensagem, 'Você estourou! O dealer venceu.');
});
teste('Dealer estoura → vitória', () => {
  // jogador 10+8=18; dealer 10+6=16 compra K → 26
  const j = new Jogo({}, baralhoFixo('10', '8', 'J', '6', 'K'));
  j.novoJogo();
  j.parar();
  j.jogarDealer();
  assert.strictEqual(calcularPontos(j.maoDealer), 26);
  assert.strictEqual(j.mensagem, 'O dealer estourou! Você venceu!');
});
teste('Dealer com mais pontos → derrota', () => {
  const j = new Jogo({}, baralhoFixo('10', '7', 'K', '9'));
  j.novoJogo();
  j.parar();
  j.jogarDealer();
  assert.strictEqual(j.mensagem, 'O dealer venceu!');
});
teste('Jogador com mais pontos → vitória', () => {
  const j = new Jogo({}, baralhoFixo('10', '9', 'K', '7'));
  j.novoJogo();
  j.parar();
  j.jogarDealer();
  assert.strictEqual(j.mensagem, 'Você venceu!');
});
teste('Pontos iguais → empate', () => {
  const j = new Jogo({}, baralhoFixo('10', '8', 'K', '8'));
  j.novoJogo();
  j.parar();
  j.jogarDealer();
  assert.strictEqual(j.mensagem, 'Empate!');
});
teste('Dealer para em 17 (não compra com 17)', () => {
  const j = new Jogo({}, baralhoFixo('10', '9', 'K', '7', '2'));
  j.novoJogo();
  j.parar();
  j.jogarDealer();
  assert.strictEqual(j.maoDealer.length, 2);
});
teste('Dealer compra com 16', () => {
  const j = new Jogo({}, baralhoFixo('10', '9', 'K', '6', '2'));
  j.novoJogo();
  j.parar();
  j.jogarDealer();
  assert.strictEqual(j.maoDealer.length, 3);
  assert.strictEqual(calcularPontos(j.maoDealer), 18);
});
teste('Chegar a 21 pedindo carta passa a vez ao dealer', () => {
  const j = new Jogo({}, baralhoFixo('10', '5', 'K', '7', '6'));
  j.novoJogo();
  j.pedirCarta();
  assert.strictEqual(calcularPontos(j.maoJogador), 21);
  assert.strictEqual(j.estado, ESTADOS.DEALER_TURNO);
  j.jogarDealer();
  assert.strictEqual(j.resultado, 'vitoria');
});

console.log('Proteções');
teste('Ações depois do fim não fazem nada e não contam duas vezes', () => {
  const j = new Jogo({}, baralhoFixo('10', '9', 'K', '7'));
  j.novoJogo();
  j.parar();
  j.jogarDealer();
  const antes = { ...j.estatisticas };
  assert.strictEqual(j.pedirCarta(), false);
  assert.strictEqual(j.parar(), false);
  assert.strictEqual(j.finalizarRodada(), false);
  assert.deepStrictEqual(j.estatisticas, antes);
});
teste('Não finaliza antes do dealer terminar de comprar', () => {
  const j = new Jogo({}, baralhoFixo('10', '9', 'K', '2', '3'));
  j.novoJogo();
  j.parar();
  assert.strictEqual(j.finalizarRodada(), false);
  assert.strictEqual(j.estado, ESTADOS.DEALER_TURNO);
});
teste('Pedir carta no turno do dealer é ignorado', () => {
  const j = new Jogo({}, baralhoFixo('10', '9', 'K', '2', '3'));
  j.novoJogo();
  j.parar();
  assert.strictEqual(j.pedirCarta(), false);
  assert.strictEqual(j.maoJogador.length, 2);
});

console.log('Estatísticas');
teste('Percentual de vitórias', () => {
  const r = resumirEstatisticas({ vitorias: 3, derrotas: 1, empates: 1 });
  assert.strictEqual(r.partidas, 5);
  assert.strictEqual(r.taxa, 60);
});
teste('Sem partidas = 0%', () => assert.strictEqual(resumirEstatisticas({ vitorias: 0, derrotas: 0, empates: 0 }).taxa, 0));
teste('10.000 rodadas aleatórias: estatísticas somam o nº de rodadas', () => {
  const j = new Jogo();
  for (let i = 0; i < 10000; i++) {
    j.novoJogo();
    while (j.estado === ESTADOS.JOGADOR_TURNO && calcularPontos(j.maoJogador) < 15) j.pedirCarta();
    if (j.estado === ESTADOS.JOGADOR_TURNO) j.parar();
    if (j.estado === ESTADOS.DEALER_TURNO) j.jogarDealer();
    assert.strictEqual(j.estado, ESTADOS.FIM_DE_JOGO);
  }
  const r = resumirEstatisticas(j.estatisticas);
  assert.strictEqual(r.partidas, 10000);
});

console.log(`\n${total} testes passaram.`);
