# Olá a todos, utilizei IA para construção dessa documentação!

## 🚀 Como Executar o Projeto

## 📋 Passo a Passo

### 1️⃣ **Iniciar o Backend (Porta 8080)**

Primeiro, certifique-se de que seu backend está rodando na porta 8080.

```bash
# No diretório do backend
java -jar seu-backend.jar
# ou
npm run start
# ou outro comando que inicie seu backend
```

### 2️⃣ **Iniciar o Frontend (Porta 4200)**

Depois, inicie o Angular:

```bash
# No diretório do projeto Angular
ng serve
```

**OU**

```bash
npm start
```

### 3️⃣ **Acessar a Aplicação**

Abra o navegador em:
```
http://localhost:4200
```

---

## 🔧 Como Funciona o Proxy

### Antes (❌ Não funcionava):
```
Frontend (4200) → http://localhost:8080/api/linhas
                  ❌ CORS Error!
```

### Agora (✅ Funciona):
```
Frontend (4200) → /api/linhas 
                  ↓
                  Proxy redireciona
                  ↓
                  http://localhost:8080/api/linhas
                  ✅ Sucesso!
```

### Arquivo de Configuração: `proxy.conf.json`
```json
{
    "/api": {
        "target": "http://localhost:8080",
        "secure": false,
        "changeOrigin": true,
        "logLevel": "info"
    }
}
```

**O que isso faz:**
- Todas as requisições para `/api/*` são redirecionadas para `http://localhost:8080/api/*`
- `changeOrigin: true` - Muda o header Origin para evitar problemas de CORS
- `logLevel: "info"` - Mostra logs do proxy no console

---

## 🧪 Testar se Está Funcionando

### 1. Verificar o Console do Angular

Ao executar `ng serve`, você deve ver:

```
[HPM] Proxy created: /api  -> http://localhost:8080
[HPM] Proxy rewrite rule created: "^/api" ~> ""
```

### 2. Fazer uma Busca

1. Abra http://localhost:4200
2. Digite um número de linha (ex: "8000")
3. Clique em "Buscar"
4. Abra o DevTools (F12) → Aba Network
5. Veja as requisições sendo feitas para `/api/linhas`

### 3. Verificar os Logs

**Console do Angular:**
```
🔍 Buscando linhas: 8000
📡 URL das linhas: /api/linhas?termo=8000
[HPM] GET /api/linhas?termo=8000 -> http://localhost:8080
```

**Console do Navegador (F12):**
```
Request URL: http://localhost:4200/api/linhas?termo=8000
Status: 200 OK
```

---

## ⚠️ Problemas Comuns

### Problema 1: "ECONNREFUSED"
```
[HPM] Error occurred while proxying request localhost:4200/api/linhas to http://localhost:8080/
[ECONNREFUSED] (https://nodejs.org/api/errors.html#errors_common_system_errors)
```

**Solução:**
- ✅ Certifique-se de que o backend está rodando na porta 8080
- ✅ Teste diretamente: `http://localhost:8080/api/linhas?termo=8000`

### Problema 2: "404 Not Found"
```
GET http://localhost:4200/api/linhas 404 (Not Found)
```

**Solução:**
- ✅ Verifique se a URL do backend está correta
- ✅ Verifique se o endpoint existe no backend

### Problema 3: Proxy não está sendo usado
```
Request URL: http://localhost:8080/api/linhas (em vez de localhost:4200)
```

**Solução:**
- ✅ Pare o servidor: Ctrl+C
- ✅ Execute novamente: `ng serve`
- ✅ Verifique se o `angular.json` tem a configuração do proxy

---

## 🔍 Debug

### Ver Logs Detalhados do Proxy

Edite `proxy.conf.json`:
```json
{
    "/api": {
        "target": "http://localhost:8080",
        "secure": false,
        "changeOrigin": true,
        "logLevel": "debug"  // <- Mudou de "info" para "debug"
    }
}
```

### Testar Backend Diretamente

Abra o navegador ou use curl:
```bash
# Testar se o backend está respondendo
curl http://localhost:8080/api/linhas?termo=8000
```

Ou no navegador:
```
http://localhost:8080/api/linhas?termo=8000
```

---

## 📝 Checklist

Antes de executar, certifique-se:

- [ ] Backend está rodando na porta 8080
- [ ] Arquivo `proxy.conf.json` existe na raiz do projeto
- [ ] Arquivo `angular.json` tem a configuração `"proxyConfig": "proxy.conf.json"`
- [ ] Executou `ng serve` (não `ng serve --port 4200` sem proxy)
- [ ] Abriu http://localhost:4200 (não 8080)

---

## 🎯 Resumo

1. **Backend na porta 8080** ✅
2. **Frontend na porta 4200** ✅
3. **Proxy configurado** ✅
4. **Requisições /api/* redirecionadas automaticamente** ✅

**Tudo pronto para funcionar!** 🚀

---

## 💡 Dica Extra

Se você quiser mudar a porta do backend, basta editar `proxy.conf.json`:

```json
{
    "/api": {
        "target": "http://localhost:3000", 
        "secure": false,
        "changeOrigin": true,
        "logLevel": "info"
    }
}
```
