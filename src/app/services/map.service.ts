import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * 🗺️ SERVIÇO DE MAPA
 * 
 * Responsável por gerenciar o mapa Leaflet:
 * - Inicialização do mapa
 * - Adicionar/remover marcadores
 * - Manipulação de camadas e zoom
 */
@Injectable({
    providedIn: 'root'
})
export class MapService {

    private mapa: any;
    private L: any;
    private marcadores: any[] = [];
    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) platformId: Object) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    /**
     * Carrega a biblioteca Leaflet
     */
    async carregarLeaflet(): Promise<void> {
        if (!this.isBrowser) return;

        try {
            const leaflet = await import('leaflet');
            this.L = leaflet.default;
            console.log('✅ Leaflet carregado pelo MapService');
        } catch (erro) {
            console.error('❌ Erro ao carregar Leaflet:', erro);
            throw erro;
        }
    }

    /**
     * Cria e inicializa o mapa
     */
    criarMapa(elementId: string = 'map'): { sucesso: boolean; erro?: string } {
        if (!this.L) {
            console.error('❌ Leaflet não foi carregado');
            return { sucesso: false, erro: 'Leaflet não carregado' };
        }

        try {
            const centroSP: [number, number] = [-23.55052, -46.633308];

            this.mapa = this.L.map(elementId).setView(centroSP, 12);

            this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '© OpenStreetMap'
            }).addTo(this.mapa);

            console.log('✅ Mapa criado com sucesso pelo MapService');
            return { sucesso: true };

        } catch (erro) {
            console.error('❌ Erro ao criar mapa:', erro);
            return { sucesso: false, erro: `${erro}` };
        }
    }

    /**
     * Adiciona um marcador de ônibus no mapa
     */
    adicionarMarcador(onibus: any, linha: any): void {
        if (!this.L || !this.mapa) return;

        const lat = parseFloat(onibus.py);
        const lng = parseFloat(onibus.px);

        if (isNaN(lat) || isNaN(lng)) {
            console.warn('⚠️ Coordenadas inválidas:', { lat: onibus.py, lng: onibus.px });
            return;
        }

        const direcao = (linha.sl == 1) ? linha.tp : linha.ts;

        const popupHtml = `
      <div style="font-family: Arial;">
        <h4>🚌 Linha ${linha.c || 'N/A'}</h4>
        <p><b>Destino:</b> ${direcao || 'N/A'}</p>
        <p><b>Horário:</b> ${onibus.ta || 'N/A'}</p>
        <p><b>Acessível:</b> ${onibus.a ? '♿ Sim' : 'Não'}</p>
      </div>
    `;

        const iconeOnibus = this.L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });

        const marcador = this.L.marker([lat, lng], { icon: iconeOnibus })
            .bindPopup(popupHtml)
            .addTo(this.mapa);

        this.marcadores.push(marcador);
    }

    /**
     * Remove todos os marcadores do mapa
     */
    limparMarcadores(): void {
        if (!this.mapa) return;

        this.marcadores.forEach(marcador => {
            this.mapa.removeLayer(marcador);
        });

        this.marcadores = [];
        console.log('🗑️ Marcadores removidos');
    }

    /**
     * Ajusta o zoom para mostrar todos os marcadores
     */
    ajustarZoomParaMarcadores(): void {
        if (!this.mapa || this.marcadores.length === 0) return;

        const grupo = new this.L.FeatureGroup(this.marcadores);
        this.mapa.fitBounds(grupo.getBounds().pad(0.1));
    }

    /**
     * Verifica se o mapa está inicializado
     */
    mapaEstaCarregado(): boolean {
        return !!this.mapa;
    }

    /**
     * Retorna a quantidade de marcadores no mapa
     */
    obterQuantidade(): number {
        return this.marcadores.length;
    }
}
