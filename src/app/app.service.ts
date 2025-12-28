import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';


// IMPORTANTE!

//obs: o numero da linha não é o mesmo do codigo da linha(CL)

// codigo da linha é obtido nos parametros do get do numero da linha

// o codigo da linha tras as coordenadas


@Injectable({ providedIn: 'root' })
export class SptransService {

    /**
     * URL base para todas as requisições
     * 
     * DESENVOLVIMENTO: '/api' (usa proxy para localhost:8080)
     * PRODUÇÃO: 'https://busmap-back.onrender.com'
     */
    private baseURL = environment.apiUrl;
    constructor(private http: HttpClient) {
        console.log('🌍 Ambiente:', environment.production ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
        console.log('📡 API URL:', this.baseURL);
    }

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

                return of(requisicoesDeposicoes);
            }),
            catchError(erro => {
                console.error('❌ Erro ao buscar todas as posições:', erro);
                return of([]);
            })
        );
    }
}
