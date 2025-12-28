import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SptransService } from './app.service';
import { MapService } from './services/map.service';
import { BusDataService } from './services/bus-data.service';

/**
 * 🚌 COMPONENTE PRINCIPAL DO APP
 * 
 * Coordena a interação entre os serviços:
 * - MapService: Gerencia o mapa Leaflet
 * - BusDataService: Processa dados de ônibus
 * - SptransService: Comunicação com API
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {

  title = 'SPTrans Olho Vivo';
  termoBusca = '';          // O que o usuário digitou na busca
  carregando = false;       // Mostra o spinner de loading
  mapaCarregado = false;    // Se o mapa já foi inicializado
  totalBuscas = 0;          // Contador de buscas realizadas
  ultimoErro = '';          // Última mensagem de erro

  constructor(
    private sptransService: SptransService,
    public mapService: MapService,
    private busDataService: BusDataService
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      await this.mapService.carregarLeaflet();
    } catch (erro) {
      console.error('❌ Erro ao carregar Leaflet:', erro);
      this.ultimoErro = 'Erro ao carregar biblioteca de mapas';
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inicializarMapa();
    }, 100);
  }

  
  private inicializarMapa(): void {
    const resultado = this.mapService.criarMapa();

    if (resultado.sucesso) {
      this.mapaCarregado = true;
    } else {
      this.ultimoErro = resultado.erro || 'Erro ao criar mapa';
    }
  }


  removerMarcadores(): void {
    this.mapService.limparMarcadores();
  }

  buscarLinhas(): void {
    // Validações
    if (!this.termoBusca?.trim()) {
      alert('❌ Digite um número de linha ou nome de bairro!');
      return;
    }

    if (!this.mapService.mapaEstaCarregado()) {
      alert('❌ Aguarde o mapa carregar!');
      return;
    }

    const termo = this.termoBusca.trim();
    this.carregando = true;
    this.ultimoErro = '';
    this.totalBuscas++;
    this.mapService.limparMarcadores();

    console.log('🔍 Buscando:', termo);

    this.sptransService.buscarLinhas(termo).subscribe({
      next: (linhas: any) => {
        this.carregando = false;

        try {
          this.busDataService.processarLinhas(linhas, termo, (totalOnibus, linhasProcessadas) => {
            this.mostrarResultadoFinal(totalOnibus, linhasProcessadas, termo);
          });
        } catch (erro: any) {
          alert(`⚠️ ${erro.message}`);
        }
      },

      error: (erro: any) => {
        this.carregando = false;
        console.error('❌ Erro:', erro);
        this.mostrarErro(erro);
      }
    });
  }


  private mostrarResultadoFinal(totalOnibus: number, linhasProcessadas: number, termo: string): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESULTADO FINAL:');
    console.log(`  Linhas processadas: ${linhasProcessadas}`);
    console.log(`  Total de ônibus: ${totalOnibus}`);
    console.log(`  Marcadores no mapa: ${this.mapService.obterQuantidadeMarcadores()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (totalOnibus > 0) {
      this.mapService.ajustarZoomParaMarcadores();
      alert(`✅ Encontrados ${totalOnibus} ônibus em ${linhasProcessadas} linha(s) para "${termo}"!`);
    } else {
      alert(`⚠️ ${linhasProcessadas} linha(s) encontrada(s), mas nenhum ônibus está ativo no momento para "${termo}"`);
    }
  }



  private mostrarErro(erro: any): void {
    const { mensagem, titulo } = this.busDataService.formatarMensagemErro(erro);
    this.ultimoErro = titulo;
    alert(`Erro ao buscar linhas:\n\n${mensagem}`);
  }
}