import javax.swing.*;
import java.awt.*;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class JogoGuerraHortifruti extends JPanel implements Runnable {

    // Definições de tamanho da tela
    private static final int LARGURA = 800;
    private static final int ALTURA = 500;
    
    private Thread gameThread;
    private boolean rodando = false;

    // Definição da Classe Arma (Frutas e Vegetais)
    static class Arma {
        String nome, emoji;
        int dano, velocidade;
        Color cor;

        Arma(String nome, String emoji, int dano, int velocidade, Color cor) {
            this.nome = nome;
            this.emoji = emoji;
            this.dano = dano;
            this.velocidade = velocidade;
            this.cor = cor;
        }
    }

    // Pool de armas disponíveis
    private static final Arma[] ARMAS_FRUTAS = {
        new Arma("Tomate", "🍅", 10, 7, new Color(255, 77, 77)),
        new Arma("Brócolis", "🥦", 15, 5, new Color(46, 204, 113)),
        new Arma("Melancia", "🍉", 30, 3, new Color(231, 76, 60)),
        new Arma("Banana", "🍌", 8, 10, new Color(241, 196, 15)),
        new Arma("Beringela", "🍆", 20, 4, new Color(155, 89, 182)),
        new Arma("Pimenta", "🌶️", 25, 8, new Color(230, 126, 34))
    };

    // Definição da Classe Jogador
    static class Jogador {
        int x, y, r, vida, velocidade, ultimaDirecao;
        Color cor;
        Arma armaAtual;

        Jogador(int x, int y, Color cor, int direcaoInicial) {
            this.x = x;
            this.y = y;
            this.r = 20;
            this.vida = 100;
            this.velocidade = 4;
            this.cor = cor;
            this.ultimaDirecao = direcaoInicial;
            this.armaAtual = ARMAS_FRUTAS[0];
        }
    }

    // Definição da Classe Projetil
    static class Projetil {
        int x, y, vx;
        Arma arma;
        Jogador dono;

        Projetil(int x, int y, int vx, Arma arma, Jogador dono) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.arma = arma;
            this.dono = dono;
        }
    }

    // Instanciação dos objetos globais
    private Jogador p1 = new Jogador(100, 250, new Color(46, 204, 113), 1); // Verde
    private Jogador p2 = new Jogador(700, 250, new Color(52, 152, 219), -1); // Azul
    private List<Projetil> projeteis = new ArrayList<>();
    private boolean[] teclas = new boolean[256]; // Mapeamento básico de teclas acionadas
    private Random random = new Random();

    public JogoGuerraHortifruti() {
        setPreferredSize(new Dimension(LARGURA, ALTURA));
        setBackground(new Color(17, 17, 17));
        setFocusable(true);

        // Ouvinte de Teclado
        addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                int code = e.getKeyCode();
                if (code < teclas.length) teclas[code] = true;

                // Eventos de tiro único (Prevenir rajadas contínuas segurando a tecla)
                if (p1.vida > 0 && p2.vida > 0) {
                    if (code == KeyEvent.VK_SPACE) atirar(p1, p1.ultimaDirecao);
                    if (code == KeyEvent.VK_ENTER) atirar(p2, p2.ultimaDirecao);
                }
            }

            @Override
            public void keyReleased(KeyEvent e) {
                int code = e.getKeyCode();
                if (code < teclas.length) teclas[code] = false;
            }
        });

        start();
    }

    private synchronized void start() {
        rodando = true;
        gameThread = new Thread(this);
        gameThread.start();
    }

    private void atirar(Jogador jogador, int direcao) {
        projeteis.add(new Projetil(jogador.x, jogador.y, direcao * jogador.armaAtual.velocidade, jogador.armaAtual, jogador));
        // Sorteia a próxima arma
        jogador.armaAtual = ARMAS_FRUTAS[random.nextInt(ARMAS_FRUTAS.length)];
    }

    // Loop do jogo travado a aproximadamente 60 frames por segundo
    @Override
    public void run() {
        long tempoAnterior = System.nanoTime();
        double fpsAlvo = 60.0;
        double nsPorFrame = 1000000000 / fpsAlvo;
        double delta = 0;

        while (rodando) {
            long agora = System.nanoTime();
            delta += (agora - tempoAnterior) / nsPorFrame;
            tempoAnterior = agora;

            if (delta >= 1) {
                atualizar();
                repaint(); // Redesenha a tela
                delta--;
            }

            try {
                Thread.sleep(2); // Alivia o uso de CPU
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    // Lógica e movimentação física
    private void atualizar() {
        if (p1.vida <= 0 || p2.vida <= 0) return;

        // Controles Jogador 1 (W, S, A, D)
        if (teclas[KeyEvent.VK_W] && p1.y > p1.r) p1.y -= p1.velocidade;
        if (teclas[KeyEvent.VK_S] && p1.y < ALTURA - p1.r) p1.y += p1.velocidade;
        if (teclas[KeyEvent.VK_A] && p1.x > p1.r) { p1.x -= p1.velocidade; p1.ultimaDirecao = -1; }
        if (teclas[KeyEvent.VK_D] && p1.x < LARGURA / 2 - p1.r) { p1.x += p1.velocidade; p1.ultimaDirecao = 1; }

        // Controles Jogador 2 (Setas)
        if (teclas[KeyEvent.VK_UP] && p2.y > p2.r) p2.y -= p2.velocidade;
        if (teclas[KeyEvent.VK_DOWN] && p2.y < ALTURA - p2.r) p2.y += p2.velocidade;
        if (teclas[KeyEvent.VK_LEFT] && p2.x > LARGURA / 2 + p2.r) { p2.x -= p2.velocidade; p2.ultimaDirecao = -1; }
        if (teclas[KeyEvent.VK_RIGHT] && p2.x < LARGURA - p2.r) { p2.x += p2.velocidade; p2.ultimaDirecao = 1; }

        // Atualização e colisão dos projéteis
        for (int i = projeteis.size() - 1; i >= 0; i--) {
            Projetil proj = projeteis.get(i);
            proj.x += proj.vx;

            Jogador alvo = (proj.dono == p1) ? p2 : p1;

            // Distância Euclidiana para checar impacto de colisão
            double dist = Math.hypot(proj.x - alvo.x, proj.y - alvo.y);
            if (dist < alvo.r + 15) {
                alvo.vida -= proj.arma.dono;
                if (alvo.vida < 0) alvo.vida = 0;
                projeteis.remove(i);
                continue;
            }

            // Remove o projétil se sair das bordas laterais
            if (proj.x < 0 || proj.x > LARGURA) {
                projeteis.remove(i);
            }
        }
    }

    // Renderização gráfica
    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2d = (Graphics2D) g;
        
        // Ativar suavização de bordas (Antialiasing)
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Linha Divisória Tracejada
        g2d.setColor(new Color(68, 68, 68));
        g2d.setStroke(new BasicStroke(2, BasicStroke.CAP_BUTT, BasicStroke.JOIN_MITER, 10, new float[]{10}, 0));
        g2d.drawLine(LARGURA / 2, 0, LARGURA / 2, ALTURA);

        // Fonte para textos comuns e emojis
        g2d.setFont(new Font("Segoe UI Emoji", Font.PLAIN, 16));

        // Desenhar Jogador 1
        if (p1.vida > 0) {
            g2d.setColor(p1.cor);
            g2d.fillOval(p1.x - p1.r, p1.y - p1.r, p1.r * 2, p1.r * 2);
            g2d.setColor(Color.WHITE);
            g2d.drawString("Próx: " + p1.armaAtual.emoji, p1.x - 35, p1.y - 30);
        }

        // Desenhar Jogador 2
        if (p2.vida > 0) {
            g2d.setColor(p2.cor);
            g2d.fillOval(p2.x - p2.r, p2.y - p2.r, p2.r * 2, p2.r * 2);
            g2d.setColor(Color.WHITE);
            g2d.drawString("Próx: " + p2.armaAtual.emoji, p2.x - 35, p2.y - 30);
        }

        // Desenhar os Projéteis (Emojis das armas)
        g2d.setFont(new Font("Segoe UI Emoji", Font.PLAIN, 24));
        for (Projetil proj : projeteis) {
            // Pequeno ajuste para centralizar a string do emoji baseado nas coordenadas do ponto
            g2d.drawString(proj.arma.emoji, proj.x - 12, proj.y + 10);
        }

        // Interface HUD (Pontos de Vida)
        g2d.setFont(new Font("Arial", Font.BOLD, 20));
        g2d.setColor(p1.cor);
        g2d.drawString("P1: " + p1.vida + "%", 20, 40);

        g2d.setColor(p2.cor);
        g2d.drawString("P2: " + p2.vida + "%", LARGURA - 120, 40);

        // Tela de Fim de Jogo
        if (p1.vida <= 0 || p2.vida <= 0) {
            g2d.setColor(new Color(0, 0, 0, 180));
            g2d.fillRect(0, 0, LARGURA, ALTURA);

            g2d.setFont(new Font("Arial", Font.BOLD, 40));
            g2d.setColor(Color.WHITE);
            String vencedor = p1.vida > 0 ? "Jogador 1 (Verde)" : "Jogador 2 (Azul)";
            
            // Centralização simples do texto final
            int larguraTexto = g2d.getFontMetrics().stringWidth(vencedor + " Venceu!");
            g2d.drawString(vencedor + " Venceu!", (LARGURA - larguraTexto) / 2, ALTURA / 2);
        }
    }

    // Método Inicial para carregar a Janela do Jogo
    public static void main(String[] args) {
        JFrame janela = new JFrame("Guerra de Hortifrúti 🍅 Broccoli Strike 1v1");
        JogoGuerraHortifruti jogo = new JogoGuerraHortifruti();

        janela.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        janela.add(jogo);
        janela.pack();
        janela.setLocationRelativeTo(null); // Centraliza na tela do computador
        janela.setResizable(false);
        janela.setVisible(true);
    }
}
