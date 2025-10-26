import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SptransService } from './app.service';

/**
 * 🚌 COMPONENTE PRINCIPAL DO APP
 * 
 * Este é o componente principal que gerencia:
 * - O mapa Leaflet
 * - A busca de linhas de ônibus
 * - A exibição dos ônibus no mapa
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {

  // ========================================
  // PROPRIEDADES PÚBLICAS (usadas no HTML)
  // ========================================

  title = 'SPTrans Olho Vivo';
  termoBusca = '';          // O que o usuário digitou na busca
  carregando = false;       // Mostra o spinner de loading
  mapaCarregado = false;    // Se o mapa já foi inicializado
  totalBuscas = 0;          // Contador de buscas realizadas
  ultimoErro = '';          // Última mensagem de erro
  marcadoresOnibus: any[] = []; // Lista de marcadores (pública para o HTML)

  // ========================================
  // PROPRIEDADES PRIVADAS (uso interno)
  // ========================================

  private mapa: any;                    // Objeto do mapa Leaflet
  private L: any;                       // Biblioteca Leaflet
  private isBrowser: boolean;           // Se está rodando no navegador

  /**
   * CONSTRUTOR
   * O Angular chama isso primeiro, antes de tudo
   */
  constructor(
    private sptransService: SptransService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    // Verifica se está no navegador (não no servidor)
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * CICLO DE VIDA 1: ngOnInit
   * Chamado depois do construtor, quando o componente é iniciado
   */
  async ngOnInit(): Promise<void> {
    // Só carrega Leaflet se estiver no navegador
    if (!this.isBrowser) return;

    try {
      // Carrega a biblioteca Leaflet dinamicamente
      const leaflet = await import('leaflet');
      this.L = leaflet.default;
      console.log('✅ Leaflet carregado');
    } catch (erro) {
      console.error('❌ Erro ao carregar Leaflet:', erro);
    }
  }

  /**
   * CICLO DE VIDA 2: ngAfterViewInit
   * Chamado depois que o HTML está pronto
   */
  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    // Aguarda um pouco para garantir que tudo está pronto
    setTimeout(() => {
      this.criarMapa();
    }, 100);
  }

  // ========================================
  // MÉTODOS DO MAPA
  // ========================================

  /**
   * Cria e inicializa o mapa Leaflet
   */
  private criarMapa(): void {
    if (!this.L) {
      console.error('❌ Leaflet não foi carregado');
      return;
    }

    try {
      // 1. Coordenadas do centro de São Paulo
      const centroSP: [number, number] = [-23.55052, -46.633308];

      // 2. Cria o mapa na div com id="map"
      this.mapa = this.L.map('map').setView(centroSP, 12);

      // 3. Adiciona o layer de tiles (imagens do mapa)
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
      }).addTo(this.mapa);

      // Marca que o mapa foi carregado
      this.mapaCarregado = true;
      console.log('✅ Mapa criado com sucesso');

    } catch (erro) {
      console.error('❌ Erro ao criar mapa:', erro);
      this.ultimoErro = `Erro ao criar mapa: ${erro}`;
    }
  }

  /**
   * Remove todos os marcadores do mapa (método público para o HTML)
   */
  removerMarcadores(): void {
    this.limparMarcadores();
    console.log('🗑️ Marcadores removidos pelo usuário');
  }

  /**
   * Remove todos os marcadores do mapa (método privado interno)
   */
  private limparMarcadores(): void {
    if (!this.mapa) return;

    // Remove cada marcador do mapa
    this.marcadoresOnibus.forEach(marcador => {
      this.mapa.removeLayer(marcador);
    });

    // Limpa a lista
    this.marcadoresOnibus = [];
  }

  /**
   * Adiciona um marcador de ônibus no mapa
   */
  private adicionarMarcador(onibus: any, linha: any): void {
    if (!this.L || !this.mapa) return;

    // 1. Pega as coordenadas
    const lat = parseFloat(onibus.py);
    const lng = parseFloat(onibus.px);

    // 2. Valida as coordenadas
    if (isNaN(lat) || isNaN(lng)) {
      console.warn('⚠️ Coordenadas inválidas:', { lat: onibus.py, lng: onibus.px });
      return;
    }

    // 3. Cria o HTML do popup (janelinha de informações)
    const popupHtml = `
      <div style="font-family: Arial;">
        <h4>🚌 Linha ${linha.c || 'N/A'}</h4>
        <p><b>Destino:</b> ${linha.sl || 'N/A'}</p>
        <p><b>Horário:</b> ${onibus.ta || 'N/A'}</p>
        <p><b>Acessível:</b> ${onibus.a ? '♿ Sim' : 'Não'}</p>
      </div>
    `;

    // 4. Cria e adiciona o marcador
    const marcador = this.L.marker([lat, lng])
      .bindPopup(popupHtml)
      .addTo(this.mapa);

    // 5. Guarda na lista para poder remover depois
    this.marcadoresOnibus.push(marcador);
  }

  // ========================================
  // MÉTODOS DE BUSCA
  // ========================================

  /**
   * Método principal de busca (chamado pelo botão)
   */
  buscarLinhas(): void {
    // 1. VALIDAÇÕES
    if (!this.termoBusca?.trim()) {
      alert('❌ Digite um número de linha ou nome de bairro!');
      return;
    }

    if (!this.mapa) {
      alert('❌ Aguarde o mapa carregar!');
      return;
    }

    // 2. PREPARAÇÃO
    const termo = this.termoBusca.trim();
    this.carregando = true;
    this.ultimoErro = '';
    this.totalBuscas++;
    this.limparMarcadores();

    console.log('🔍 Buscando:', termo);

    // 3. FAZER A REQUISIÇÃO
    this.sptransService.buscarLinhas(termo).subscribe({
      // Quando a requisição der certo
      next: (linhas: any) => {
        this.carregando = false;
        this.processarLinhas(linhas, termo);
      },

      // Quando a requisição der erro
      error: (erro: any) => {
        this.carregando = false;
        console.error('❌ Erro:', erro);
        this.mostrarErro(erro);
      }
    });
  }

  /**
   * Processa as linhas retornadas pela API
   */
  private processarLinhas(linhas: any, termo: string): void {
    // LOG DETALHADO: Mostra EXATAMENTE o que foi recebido
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DADOS RECEBIDOS DA API:');
    console.log('Tipo de dados:', typeof linhas);
    console.log('É Array?:', Array.isArray(linhas));
    console.log('Dados completos:', linhas);
    console.log('Length:', linhas?.length);
    console.log('Primeiro item:', linhas?.[0]);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 1. Verifica se recebeu dados
    if (!linhas) {
      console.error('❌ Dados vazios/null recebidos');
      alert(`⚠️ API retornou dados vazios para "${termo}"`);
      return;
    }

    if (!Array.isArray(linhas)) {
      console.error('❌ Dados não são um array:', linhas);
      alert(`⚠️ Formato de dados inesperado da API`);
      return;
    }

    if (linhas.length === 0) {
      console.warn('⚠️ Array vazio recebido');
      alert(`⚠️ Nenhuma linha encontrada para "${termo}"`);
      return;
    }

    console.log(`✅ ${linhas.length} linha(s) encontrada(s)`);
    console.log('🔄 Agora buscando posições de cada linha...\n');

    // 2. Para cada linha, buscar suas posições
    let totalOnibus = 0;
    let linhasProcessadas = 0;
    const totalLinhas = linhas.length;

    linhas.forEach((linha: any, index: number) => {
      console.log(`📍 Linha ${index + 1}/${totalLinhas}:`);
      console.log('  Dados da linha:', linha);

      // Busca o código da linha em diferentes campos possíveis
      const codigoLinha = linha.cl || linha.c || linha.codigo || linha.codigoLinha;

      console.log(`  Código extraído (cl): ${codigoLinha}`);

      if (!codigoLinha) {
        console.warn('  ⚠️ Linha sem código válido, ignorando...');
        return;
      }

      // Buscar posições usando o código da linha
      console.log(`  🔍 Buscando posições para código: ${codigoLinha}`);

      this.sptransService.buscarPosicoes(codigoLinha).subscribe({
        next: (posicoes: any) => {
          linhasProcessadas++;
          console.log(`  📡 Posições recebidas:`, posicoes);
          console.log(`  Veículos (vs):`, posicoes.vs);
          console.log(`  Quantidade:`, posicoes.vs?.length || 0);

          if (posicoes.vs && Array.isArray(posicoes.vs) && posicoes.vs.length > 0) {
            console.log(`  ✅ ${posicoes.vs.length} veículo(s) encontrado(s)`);

            // Adiciona cada ônibus no mapa
            posicoes.vs.forEach((onibus: any, vIndex: number) => {
              console.log(`    🚌 Veículo ${vIndex + 1}:`, onibus);
              this.adicionarMarcador(onibus, linha);
              totalOnibus++;
            });

            // Se é a última linha, mostra resultado final
            if (linhasProcessadas === totalLinhas) {
              this.mostrarResultadoFinal(totalOnibus, linhasProcessadas, termo);
            }
          } else {
            console.log(`  ⚠️ Nenhum veículo ativo nesta linha`);

            // Se é a última linha, mostra resultado final
            if (linhasProcessadas === totalLinhas) {
              this.mostrarResultadoFinal(totalOnibus, linhasProcessadas, termo);
            }
          }
        },
        error: (erro: any) => {
          linhasProcessadas++;
          console.error(`  ❌ Erro ao buscar posições da linha ${codigoLinha}:`, erro);

          // Se é a última linha, mostra resultado final
          if (linhasProcessadas === totalLinhas) {
            this.mostrarResultadoFinal(totalOnibus, linhasProcessadas, termo);
          }
        }
      });
    });
  }

  /**
   * Mostra o resultado final após processar todas as linhas
   */
  private mostrarResultadoFinal(totalOnibus: number, linhasProcessadas: number, termo: string): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESULTADO FINAL:');
    console.log(`  Linhas processadas: ${linhasProcessadas}`);
    console.log(`  Total de ônibus: ${totalOnibus}`);
    console.log(`  Marcadores no mapa: ${this.marcadoresOnibus.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (totalOnibus > 0) {
      // Ajusta o zoom para mostrar todos os marcadores
      const grupo = new this.L.FeatureGroup(this.marcadoresOnibus);
      this.mapa.fitBounds(grupo.getBounds().pad(0.1));

      alert(`✅ Encontrados ${totalOnibus} ônibus em ${linhasProcessadas} linha(s) para "${termo}"!`);
    } else {
      alert(`⚠️ ${linhasProcessadas} linha(s) encontrada(s), mas nenhum ônibus está ativo no momento para "${termo}"`);
    }
  }

  /**
   * Mostra uma mensagem de erro amigável
   */
  private mostrarErro(erro: any): void {
    let mensagem = 'Erro ao buscar linhas:\n\n';

    if (erro.status === 0) {
      mensagem += '🔗 Problema de conexão!\n';
      mensagem += '- Verifique se o backend está rodando\n';
      mensagem += '- Verifique o proxy';
      this.ultimoErro = 'Conexão falhou';
    } else if (erro.status === 404) {
      mensagem += '🔍 Endpoint não encontrado!\n';
      mensagem += '- Verifique a URL da API';
      this.ultimoErro = 'Endpoint 404';
    } else if (erro.status === 500) {
      mensagem += '⚙️ Erro no servidor!\n';
      mensagem += '- Verifique os logs do backend';
      this.ultimoErro = 'Servidor 500';
    } else {
      mensagem += `📡 Erro HTTP ${erro.status}`;
      this.ultimoErro = `HTTP ${erro.status}`;
    }

    alert(mensagem);
  }
}