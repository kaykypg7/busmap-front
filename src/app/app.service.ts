import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';

/**
 * 📚 SERVIÇO DA API SPTRANS
 * 
 * Serviço para integração com a API SPTrans
 * 
 * Exemplo de uso:
 * 
 * // Buscar linhas
 * this.sptransService.buscarLinhas('8000').subscribe(linhas => {
 *     console.log('Linhas encontradas:', linhas);
 * });
 * 
 * // Buscar posições
 * this.sptransService.buscarPosicoes('1145').subscribe(posicoes => {
 *     console.log('Posições:', posicoes);
 * });
 * 
 * // Busca inteligente (linhas + posições)
 * this.sptransService.buscarPosicoesInteligente('8000').subscribe(resultado => {
 *     console.log('Linha:', resultado.linha);
 *     console.log('Posições:', resultado.posicoes);
 * });
 */
@Injectable({ providedIn: 'root' })
export class SptransService {

    /**
     * URL base para todas as requisições
     * 
     * DESENVOLVIMENTO: '/api' (usa proxy para localhost:8080)
     * PRODUÇÃO: 'https://busmap-back.onrender.com'
     */
    private baseURL = environment.apiUrl;

    /**
     * O HttpClient é uma ferramenta do Angular para fazer requisições HTTP
     * Ele é injetado automaticamente no construtor
     */
    constructor(private http: HttpClient) {
        console.log('🌍 Ambiente:', environment.production ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
        console.log('📡 API URL:', this.baseURL);
    }

  
    //  Faz login na API SPTrans
   
    login(): Observable<boolean> {
        const url = `${this.baseURL}/login`;
        console.log('🔐 Fazendo login...');

        return this.http.get<boolean>(url).pipe(
            catchError(erro => {
                console.error('❌ Erro ao fazer login:', erro);
                return of(false);
            })
        );
    }

    /**
     *  BUSCAR LINHAS DE ÔNIBus
     * this.sptransService.buscarLinhas('8000').subscribe(linhas => {
     *     console.log('Linhas encontradas:', linhas);
     * });
     * ```
     * 
     * @param termo - O texto para buscar (ex: '8000', 'Lapa', 'Pinheiros')
     * @returns Observable com array de linhas encontradas
     */
    buscarLinhas(termo: string): Observable<any[]> {
        const url = `${this.baseURL}/linhas?termo=${encodeURIComponent(termo)}`;
        console.log('🔍 Buscando linhas:', termo);

        return this.http.get<any[]>(url).pipe(
            catchError(erro => {
                console.error('❌ Erro ao buscar linhas:', erro);
                return of([]);
            })
        );
    }

    /**
     * BUSCAR POSIÇÕES DOS ÔNIBUS
     * ```
     * 
     * @param codigoLinha - Código da linha (ex: '1145', '2506', '8000-10')
     * @returns Observable com objeto contendo:
     *          - hr: horário da última atualização
     *          - vs: array de veículos com coordenadas (px=longitude, py=latitude)
     */
    buscarPosicoes(codigoLinha: string | number): Observable<any> {
        const url = `${this.baseURL}/Posicao/Linha?codigoLinha=${encodeURIComponent(codigoLinha)}`;
        console.log('📍 Buscando posições da linha:', codigoLinha);

        return this.http.get<any>(url).pipe(
            catchError(erro => {
                console.error('❌ Erro ao buscar posições:', erro);
                return of({ hr: '', vs: [] });
            })
        );
    }

    /**
     * 🎯 BUSCA INTELIGENTE
     * 
     * Encontra a linha pelo termo e retorna as posições automaticamente
     * Combina buscarLinhas() + buscarPosicoes() em uma única chamada
     * 
     * Exemplo de uso:
     * ```
     * this.sptransService.buscarPosicoesInteligente('8000').subscribe({
     *     next: (resultado) => {
     *         console.log('Linha:', resultado.linha);
     *         console.log('Ônibus:', resultado.posicoes.vs);
     *     },
     *     error: (erro) => {
     *         console.error('Erro:', erro);
     *     }
     * });
     * ```
     * 
     * @param termo - Termo de busca da linha (ex: '8000', 'Lapa')
     * @returns Observable com objeto contendo:
     *          - linha: informações da linha encontrada
     *          - posicoes: objeto com hr e vs (veículos)
     */
    buscarPosicoesInteligente(termo: string): Observable<any> {
        console.log('🎯 Busca inteligente para:', termo);

        return this.buscarLinhas(termo).pipe(
            switchMap(linhas => {
                // Verifica se encontrou linhas
                if (!linhas || linhas.length === 0) {
                    console.warn('⚠️ Nenhuma linha encontrada para:', termo);
                    throw new Error(`Nenhuma linha encontrada para o termo: ${termo}`);
                }

                // Pega a primeira linha encontrada
                const linha = linhas[0];

                // Busca o código da linha em diferentes campos possíveis
                const codigoLinha = linha.cl || linha.c || linha.codigo || linha.codigoLinha;

                console.log('✅ Linha encontrada:', linha);
                console.log('📌 Código da linha extraído:', codigoLinha);

                if (!codigoLinha) {
                    console.error('❌ Código da linha não encontrado em:', linha);
                    throw new Error('Código da linha não encontrado no objeto retornado');
                }

                return this.buscarPosicoes(codigoLinha).pipe(
                    map(posicoes => ({
                        linha: linha,
                        posicoes: posicoes
                    }))
                );
            }),
            catchError(erro => {
                console.error('❌ Erro na busca inteligente:', erro);
                throw erro;
            })
        );
    }

    /**
     * ✅ VERIFICAR STATUS
     * 
     * Verifica o status da autenticação da API
     * 
     * Exemplo de uso:
     * ```
     * this.sptransService.verificarStatus().subscribe(status => {
     *     console.log('Status:', status);
     * });
     * ```
     * 
     * @returns Observable com status da API
     */
    verificarStatus(): Observable<any> {
        const url = `${this.baseURL}/status`;
        console.log('✅ Verificando status da API...');

        return this.http.get<any>(url).pipe(
            catchError(erro => {
                console.error('❌ Erro ao verificar status:', erro);
                return of({ autenticado: false, erro: true });
            })
        );
    }

    // ========================================
    // MÉTODOS AUXILIARES (opcional)
    // ========================================

    /**
     * � DEBUG: Mostra a estrutura de uma linha
     * Use este método para ver quais campos estão disponíveis
     * 
     * @param termo - Termo de busca
     */
    debugEstruturaDaLinha(termo: string): Observable<any> {
        return this.buscarLinhas(termo).pipe(
            map(linhas => {
                if (!linhas || linhas.length === 0) {
                    console.log('❌ Nenhuma linha encontrada');
                    return null;
                }

                const linha = linhas[0];
                console.log('🔍 ESTRUTURA DA LINHA:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('Objeto completo:', linha);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('Campos disponíveis:');
                Object.keys(linha).forEach(key => {
                    console.log(`  ${key}: ${linha[key]}`);
                });
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('Possíveis códigos:');
                console.log('  linha.cl:', linha.cl);
                console.log('  linha.c:', linha.c);
                console.log('  linha.codigo:', linha.codigo);
                console.log('  linha.codigoLinha:', linha.codigoLinha);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                return linha;
            })
        );
    }

    /**
     * �📊 Buscar todas as posições de múltiplas linhas
     * 
     * @param termo - Termo de busca
     * @returns Observable com array de linhas e suas posições
     */
    buscarTodasPosicoes(termo: string): Observable<any[]> {
        console.log('� Buscando todas as posições para:', termo);

        return this.buscarLinhas(termo).pipe(
            switchMap(linhas => {
                if (!linhas || linhas.length === 0) {
                    return of([]);
                }

                // Cria um array de observables para buscar posições de cada linha
                const requisicoesDeposicoes = linhas.map(linha => {
                    // Busca o código em diferentes campos possíveis
                    const codigoLinha = linha.cl || linha.c || linha.codigo || linha.codigoLinha;

                    if (!codigoLinha) {
                        console.warn('⚠️ Linha sem código válido:', linha);
                        return of({
                            ...linha,
                            hr: '',
                            vs: []
                        });
                    }

                    return this.buscarPosicoes(codigoLinha).pipe(
                        map(posicoes => ({
                            ...linha,
                            hr: posicoes.hr || '',
                            vs: posicoes.vs || []
                        }))
                    );
                });

                // Retorna todos os resultados
                // Nota: Para melhor performance, use forkJoin para requisições paralelas
                // import { forkJoin } from 'rxjs';
                // return forkJoin(requisicoesDeposicoes);

                // Por enquanto, retorna sequencialmente
                return of(requisicoesDeposicoes);
            }),
            catchError(erro => {
                console.error('❌ Erro ao buscar todas as posições:', erro);
                return of([]);
            })
        );
    }
}

/**
 * �💡 DICAS PARA INICIANTES:
 * 
 * 1. Observable vs Promise:
 *    - Observable é como uma "torneira de dados"
 *    - Você se "inscreve" (subscribe) para receber os dados
 *    - É mais poderoso que Promise para requisições HTTP
 * 
 * 2. pipe() e operadores:
 *    - pipe() permite encadear operações no Observable
 *    - catchError() captura erros e permite tratar eles
 *    - switchMap() troca de um Observable para outro
 *    - map() transforma os dados
 *    - of() cria um Observable com um valor fixo
 * 
 * 3. Por que retornar dados vazios no erro?
 *    - Para não quebrar a aplicação
 *    - O componente sempre recebe algo (mesmo que vazio)
 *    - Melhor que deixar a aplicação travar
 * 
 * 4. Estrutura de dados da API SPTrans:
 *    - Linhas: array de objetos { c/cl: código, sl: sentido, ... }
 *    - Posições: { hr: horário, vs: [{ px: lng, py: lat, ta: hora, ... }] }
 * 
 * 5. Como usar Async/Await:
 *    const linhas = await this.sptransService.buscarLinhas('8000').toPromise();
 */