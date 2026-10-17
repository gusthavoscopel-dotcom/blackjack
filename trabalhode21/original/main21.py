import pygame
import random
import sys

pygame.init()

# ==================== CONFIGURAÇÕES ====================
LARGURA, ALTURA = 900, 650
tela = pygame.display.set_mode((LARGURA, ALTURA))
pygame.display.set_caption("Jogo de 21 - Blackjack")
relogio = pygame.time.Clock()

# Cores
VERDE_MESA = (20, 95, 55)
VERDE_MESA_ESCURO = (14, 70, 40)
BRANCO = (245, 245, 245)
PRETO = (20, 20, 20)
VERMELHO = (200, 40, 40)
DOURADO = (222, 184, 88)
CINZA_BOTAO = (90, 90, 90)
AZUL_BOTAO = (40, 110, 190)
AZUL_BOTAO_HOVER = (65, 140, 220)
VERDE_BOTAO = (46, 140, 87)
VERDE_BOTAO_HOVER = (60, 170, 110)
VERMELHO_BOTAO = (170, 50, 50)
VERMELHO_BOTAO_HOVER = (200, 65, 65)

# Fontes
fonte_titulo = pygame.font.SysFont("arial", 46, bold=True)
fonte_grande = pygame.font.SysFont("arial", 34, bold=True)
fonte_media = pygame.font.SysFont("arial", 26, bold=True)
fonte_pequena = pygame.font.SysFont("arial", 20)
fonte_carta = pygame.font.SysFont("arial", 28, bold=True)
fonte_carta_pequena = pygame.font.SysFont("arial", 16, bold=True)

NAIPES = ["♠", "♥", "♦", "♣"]
NAIPES_VERMELHOS = ("♥", "♦")
VALORES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

LARG_CARTA, ALT_CARTA = 90, 130

# ==================== ESTADOS DO JOGO ====================
JOGADOR_TURNO = "jogador_turno"
DEALER_TURNO = "dealer_turno"
FIM_DE_JOGO = "fim_de_jogo"


class Carta:
    def __init__(self, naipe, valor):
        self.naipe = naipe
        self.valor = valor

    def valor_numerico(self):
        if self.valor in ("J", "Q", "K"):
            return 10
        if self.valor == "A":
            return 11
        return int(self.valor)

    def cor(self):
        return VERMELHO if self.naipe in NAIPES_VERMELHOS else PRETO


def criar_baralho():
    baralho = [Carta(n, v) for n in NAIPES for v in VALORES]
    random.shuffle(baralho)
    return baralho


def calcular_pontos(mao):
    """Calcula a pontuação de uma mão, tratando o Ás como 11 ou 1."""
    pontos = sum(c.valor_numerico() for c in mao)
    ases = sum(1 for c in mao if c.valor == "A")
    while pontos > 21 and ases > 0:
        pontos -= 10
        ases -= 1
    return pontos


def desenhar_carta(x, y, carta, virada_para_cima=True, destaque=False):
    retangulo = pygame.Rect(x, y, LARG_CARTA, ALT_CARTA)

    if destaque:
        sombra = pygame.Rect(x - 4, y - 4, LARG_CARTA + 8, ALT_CARTA + 8)
        pygame.draw.rect(tela, DOURADO, sombra, border_radius=12)

    if virada_para_cima:
        pygame.draw.rect(tela, BRANCO, retangulo, border_radius=10)
        pygame.draw.rect(tela, PRETO, retangulo, width=2, border_radius=10)

        cor = carta.cor()
        texto_topo = fonte_carta.render(carta.valor, True, cor)
        tela.blit(texto_topo, (x + 8, y + 6))

        texto_naipe = fonte_carta.render(carta.naipe, True, cor)
        tela.blit(texto_naipe, (x + LARG_CARTA // 2 - 12, y + ALT_CARTA // 2 - 16))

        texto_baixo = fonte_carta_pequena.render(carta.valor, True, cor)
        texto_baixo = pygame.transform.rotate(texto_baixo, 180)
        tela.blit(texto_baixo, (x + LARG_CARTA - 24, y + ALT_CARTA - 24))
    else:
        pygame.draw.rect(tela, AZUL_BOTAO, retangulo, border_radius=10)
        pygame.draw.rect(tela, PRETO, retangulo, width=2, border_radius=10)
        pygame.draw.rect(
            tela, BRANCO,
            (x + 8, y + 8, LARG_CARTA - 16, ALT_CARTA - 16),
            width=2, border_radius=6
        )
        interrogacao = fonte_grande.render("?", True, BRANCO)
        tela.blit(interrogacao, (x + LARG_CARTA // 2 - 8, y + ALT_CARTA // 2 - 16))


def desenhar_mao(mao, x_inicial, y, esconder_primeira=False):
    espacamento = LARG_CARTA + 15
    for i, carta in enumerate(mao):
        x = x_inicial + i * espacamento
        virada = not (esconder_primeira and i == 0)
        desenhar_carta(x, y, carta, virada_para_cima=virada)


class Botao:
    def __init__(self, x, y, largura, altura, texto, cor, cor_hover):
        self.rect = pygame.Rect(x, y, largura, altura)
        self.texto = texto
        self.cor = cor
        self.cor_hover = cor_hover
        self.ativo = True

    def desenhar(self, tela):
        pos_mouse = pygame.mouse.get_pos()
        hover = self.rect.collidepoint(pos_mouse) and self.ativo

        cor = self.cor_hover if hover else self.cor
        if not self.ativo:
            cor = CINZA_BOTAO

        pygame.draw.rect(tela, cor, self.rect, border_radius=10)
        pygame.draw.rect(tela, PRETO, self.rect, width=2, border_radius=10)

        cor_texto = BRANCO if self.ativo else (170, 170, 170)
        texto_render = fonte_media.render(self.texto, True, cor_texto)
        texto_rect = texto_render.get_rect(center=self.rect.center)
        tela.blit(texto_render, texto_rect)

    def clicado(self, evento):
        if not self.ativo:
            return False
        if evento.type == pygame.MOUSEBUTTONDOWN and evento.button == 1:
            return self.rect.collidepoint(evento.pos)
        return False


class Jogo:
    def __init__(self):
        self.vitorias = 0
        self.derrotas = 0
        self.empates = 0
        self.novo_jogo()

    def novo_jogo(self):
        self.baralho = criar_baralho()
        self.mao_jogador = [self.comprar_carta(), self.comprar_carta()]
        self.mao_dealer = [self.comprar_carta(), self.comprar_carta()]
        self.estado = JOGADOR_TURNO
        self.mensagem = ""

        # Blackjack imediato
        if calcular_pontos(self.mao_jogador) == 21:
            self.estado = FIM_DE_JOGO
            if calcular_pontos(self.mao_dealer) == 21:
                self.mensagem = "Empate! Ambos tiraram Blackjack."
                self.empates += 1
            else:
                self.mensagem = "Blackjack! Você venceu!"
                self.vitorias += 1

    def comprar_carta(self):
        if not self.baralho:
            self.baralho = criar_baralho()
        return self.baralho.pop()

    def pedir_carta(self):
        if self.estado != JOGADOR_TURNO:
            return
        self.mao_jogador.append(self.comprar_carta())
        pontos = calcular_pontos(self.mao_jogador)
        if pontos > 21:
            self.estado = FIM_DE_JOGO
            self.mensagem = "Você estourou! O dealer venceu."
            self.derrotas += 1
        elif pontos == 21:
            self.parar()

    def parar(self):
        if self.estado != JOGADOR_TURNO:
            return
        self.estado = DEALER_TURNO
        # Dealer compra cartas até somar 17 ou mais
        while calcular_pontos(self.mao_dealer) < 17:
            self.mao_dealer.append(self.comprar_carta())
        self.finalizar_rodada()

    def finalizar_rodada(self):
        self.estado = FIM_DE_JOGO
        pontos_jogador = calcular_pontos(self.mao_jogador)
        pontos_dealer = calcular_pontos(self.mao_dealer)

        if pontos_dealer > 21:
            self.mensagem = "O dealer estourou! Você venceu!"
            self.vitorias += 1
        elif pontos_dealer > pontos_jogador:
            self.mensagem = "O dealer venceu!"
            self.derrotas += 1
        elif pontos_dealer < pontos_jogador:
            self.mensagem = "Você venceu!"
            self.vitorias += 1
        else:
            self.mensagem = "Empate!"
            self.empates += 1


def desenhar_texto_centralizado(texto, fonte, cor, y, largura_tela=LARGURA):
    render = fonte.render(texto, True, cor)
    rect = render.get_rect(center=(largura_tela // 2, y))
    tela.blit(render, rect)


def main():
    jogo = Jogo()

    largura_botao, altura_botao = 160, 55
    espaco = 20
    y_botoes = ALTURA - 90
    x_centro = LARGURA // 2

    botao_pedir = Botao(x_centro - largura_botao * 1.5 - espaco, y_botoes,
                         largura_botao, altura_botao, "Pedir Carta", VERDE_BOTAO, VERDE_BOTAO_HOVER)
    botao_parar = Botao(x_centro - largura_botao // 2, y_botoes,
                         largura_botao, altura_botao, "Parar", VERMELHO_BOTAO, VERMELHO_BOTAO_HOVER)
    botao_novo = Botao(x_centro + largura_botao // 2 + espaco, y_botoes,
                        largura_botao, altura_botao, "Novo Jogo", AZUL_BOTAO, AZUL_BOTAO_HOVER)

    rodando = True
    while rodando:
        for evento in pygame.event.get():
            if evento.type == pygame.QUIT:
                rodando = False

            if botao_pedir.clicado(evento):
                jogo.pedir_carta()
            if botao_parar.clicado(evento):
                jogo.parar()
            if botao_novo.clicado(evento):
                jogo.novo_jogo()

            if evento.type == pygame.KEYDOWN:
                if evento.key == pygame.K_h and jogo.estado == JOGADOR_TURNO:
                    jogo.pedir_carta()
                elif evento.key == pygame.K_s and jogo.estado == JOGADOR_TURNO:
                    jogo.parar()
                elif evento.key == pygame.K_n:
                    jogo.novo_jogo()
                elif evento.key == pygame.K_ESCAPE:
                    rodando = False

        # Botões ativos apenas durante o turno do jogador
        botao_pedir.ativo = jogo.estado == JOGADOR_TURNO
        botao_parar.ativo = jogo.estado == JOGADOR_TURNO

        # ---------- DESENHO ----------
        tela.fill(VERDE_MESA)
        pygame.draw.rect(tela, VERDE_MESA_ESCURO, (0, 0, LARGURA, ALTURA), width=25)

        desenhar_texto_centralizado("BLACKJACK - 21", fonte_titulo, DOURADO, 45)

        # Placar
        placar_texto = f"Vitórias: {jogo.vitorias}   Derrotas: {jogo.derrotas}   Empates: {jogo.empates}"
        desenhar_texto_centralizado(placar_texto, fonte_pequena, BRANCO, 85)

        # Dealer
        esconder = jogo.estado == JOGADOR_TURNO
        desenhar_texto_centralizado("Dealer", fonte_media, BRANCO, 130)
        desenhar_mao(jogo.mao_dealer, x_centro - (len(jogo.mao_dealer) * (LARG_CARTA + 15) - 15) // 2, 150,
                     esconder_primeira=esconder)

        if esconder:
            pontos_dealer_texto = "?"
        else:
            pontos_dealer_texto = str(calcular_pontos(jogo.mao_dealer))
        desenhar_texto_centralizado(f"Pontos: {pontos_dealer_texto}", fonte_pequena, BRANCO, 300)

        # Jogador
        desenhar_texto_centralizado("Você", fonte_media, BRANCO, 350)
        desenhar_mao(jogo.mao_jogador, x_centro - (len(jogo.mao_jogador) * (LARG_CARTA + 15) - 15) // 2, 370)

        pontos_jogador = calcular_pontos(jogo.mao_jogador)
        desenhar_texto_centralizado(f"Pontos: {pontos_jogador}", fonte_pequena, BRANCO, 515)

        # Mensagem de resultado
        if jogo.estado == FIM_DE_JOGO and jogo.mensagem:
            desenhar_texto_centralizado(jogo.mensagem, fonte_grande, DOURADO, 555)

        # Botões
        botao_pedir.desenhar(tela)
        botao_parar.desenhar(tela)
        botao_novo.desenhar(tela)

        desenhar_texto_centralizado("Teclas: H = Pedir | S = Parar | N = Novo Jogo | ESC = Sair",
                                     fonte_pequena, (200, 200, 200), ALTURA - 15)

        pygame.display.flip()
        relogio.tick(60)

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()