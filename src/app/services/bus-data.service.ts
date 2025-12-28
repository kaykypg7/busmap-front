import { Injectable } from '@angular/core';
import { SptransService } from '../app.service';
import { MapService } from './map.service';

/**
 * 🚌 SERVIÇO DE DADOS DE ÔNIBUS
 * 
 * Responsável pela lógica de negócio:
 * - Processar linhas retornadas pela API
 * - Buscar posições dos veículos
 * - Validar e formatar dados
 */
@Injectable({
    providedIn: 'root'
})
export class BusDataService {

    constructor(
        private sptransService: SptransService,
        private mapService: MapService
    ) { }

    /**
     * Processa as linhas e busca as posições dos veículos
     */
    processarLinhas(
        linhas: any,
        termo: string,
        callbackProgresso?: (totalOnibus: number, linhasProcessadas: number) => void
    ): void {
        console.log('📊 DADOS RECEBIDOS DA API:');
        console.log('Tipo de dados:', typeof linhas);
        console.log('É Array?:', Array.isArray(linhas));
        console.log('Dados completos:', linhas);
        console.log('Length:', linhas?.length);
        console.log('Primeiro item:', linhas?.[0]);

        // Validações
        if (!linhas) {
            console.error('❌ Dados vazios/null recebidos');
            throw new Error(`API retornou dados vazios para "${termo}"`);
        }

        if (!Array.isArray(linhas)) {
            console.error('❌ Dados não são um array:', linhas);
            throw new Error('Formato de dados inesperado da API');
        }

        if (linhas.length === 0) {
            console.warn('⚠️ Array vazio recebido');
            throw new Error(`Nenhuma linha encontrada para "${termo}"`);
        }

        console.log(`✅ ${linhas.length} linha(s) encontrada(s)`);
        console.log('🔄 Agora buscando posições de cada linha...\n');

        let totalOnibus = 0;
        let linhasProcessadas = 0;
        const totalLinhas = linhas.length;

        linhas.forEach((linha: any, index: number) => {
            console.log(`📍 Linha ${index + 1}/${totalLinhas}:`);
            console.log('  Dados da linha:', linha);

            const codigoLinha = linha.cl;
            console.log(`  Código extraído (cl): ${codigoLinha}`);

            if (!codigoLinha) {
                console.warn('  ⚠️ Linha sem código válido, ignorando...');
                linhasProcessadas++;
                if (linhasProcessadas === totalLinhas && callbackProgresso) {
                    callbackProgresso(totalOnibus, linhasProcessadas);
                }
                return;
            }

            console.log(`  🔍 Buscando posições para código: ${codigoLinha}`);

            this.sptransService.buscarPosicoes(codigoLinha).subscribe({
                next: (posicoes: any) => {
                    linhasProcessadas++;
                    console.log(`  📡 Posições recebidas:`, posicoes);
                    console.log(`  Veículos (vs):`, posicoes.vs);
                    console.log(`  Quantidade:`, posicoes.vs?.length || 0);

                    if (posicoes.vs && Array.isArray(posicoes.vs) && posicoes.vs.length > 0) {
                        console.log(`  ✅ ${posicoes.vs.length} veículo(s) encontrado(s)`);

                        posicoes.vs.forEach((onibus: any, vIndex: number) => {
                            console.log(`    🚌 Veículo ${vIndex + 1}:`, onibus);
                            this.mapService.adicionarMarcador(onibus, linha);
                            totalOnibus++;
                        });
                    } else {
                        console.log(`  ⚠️ Nenhum veículo ativo nesta linha`);
                    }

                    // Callback de progresso
                    if (linhasProcessadas === totalLinhas && callbackProgresso) {
                        callbackProgresso(totalOnibus, linhasProcessadas);
                    }
                },
                error: (erro: any) => {
                    linhasProcessadas++;
                    console.error(`  ❌ Erro ao buscar posições da linha ${codigoLinha}:`, erro);

                    // Callback de progresso mesmo com erro
                    if (linhasProcessadas === totalLinhas && callbackProgresso) {
                        callbackProgresso(totalOnibus, linhasProcessadas);
                    }
                }
            });
        });
    }

    /**
     * Valida se as coordenadas são válidas
     */
    validarCoordenadas(lat: string | number, lng: string | number): boolean {
        const latitude = parseFloat(lat as string);
        const longitude = parseFloat(lng as string);
        return !isNaN(latitude) && !isNaN(longitude);
    }

    /**
     * Formata a mensagem de erro baseado no status HTTP
     */
    formatarMensagemErro(erro: any): { mensagem: string; titulo: string } {
        let mensagem = '';
        let titulo = '';

        if (erro.status === 0) {
            titulo = 'Conexão falhou';
            mensagem = '🔗 Problema de conexão!\n';
            mensagem += '- Verifique se o backend está rodando\n';
            mensagem += '- Verifique o proxy';
        } else if (erro.status === 404) {
            titulo = 'Endpoint 404';
            mensagem = '🔍 Endpoint não encontrado!\n';
            mensagem += '- Verifique a URL da API';
        } else if (erro.status === 500) {
            titulo = 'Servidor 500';
            mensagem = '⚙️ Erro no servidor!\n';
            mensagem += '- Verifique os logs do backend';
        } else {
            titulo = `HTTP ${erro.status}`;
            mensagem = `📡 Erro HTTP ${erro.status}`;
        }

        return { mensagem, titulo };
    }
}
