# FastAPI Backend
> Backend do Fluidocs

- FastAPI (API HTTP)
- Celery + Redis (Worker Async)
- Elasticsearch (Motor de Pesquisa)
- Ollama (Modelo de Inferência de Embeddings + Modelo GenAI)

## Instalação do Projeto
> Para instalar o projeto, é mais adequado através do WSL

- [Instalação do WSL (Youtube)](https://youtu.be/MaTe1qBTaic?si=A1uDAEnlXXOh_oJO)

### Mise
> Gerenciador de Pacotes de Linguagem de Programação

Instalação:
```bash
sudo add-apt-repository -y ppa:jdxcode/mise
sudo apt update
sudo apt install -y mise
```

Instalar Python:
```bash
mise use -g python@3.13
```

### Docker

```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Criação do grupo pra nn precisar usar sudo
sudo groupadd docker
sudo usermod -aG docker $user
sudo newgrp docker
```

*Necessário fechar o terminal e abrir de novo

### Projeto

```bash
git clone git@github.com:Fluidocs/fluidocs.git

# Buildar a aplicação
docker compose build

# Iniciar a aplicação
docker compose up
```

## Estrutura de Arquivos

```txt
- backend
  - .docker -> Dockerfile
  - scripts -> Serem executados na sua máquina após a instalação
  - src -> Arquivos fonte
    - backend -> pacote do projeto
      - api
        - handlers -> handlers de exceções customizadas
        - helpers -> funções helpers gerais, funções p/ injeção de dependência (Depends)
        - routes -> rotas da api (controller)
        - schemas -> formato de retorno para no controller (view)
        - services -> Orquestração Request > Código
      - config -> configurações do projeto
        - __init__.py -> life-cycle da aplicação, configs de inicialização
        - configuracoes.py -> configuração do formato do .env
      - core -> Núcleo da Aplicação
        - exceptions -> exceções base (request do motor de pesquisa falhou, etc...)
      - domain -> (Arquivos de Domínio da aplicação, strategies, factories, etc)
        - extraction -> logica de extração de arquivos
        - indices
          - mapping -> lógica de mapeamento de arquivos (documentos fixo, etc...)
          - exceptions -> exceções para índices do elasticsearch
      - workers (Workers Celery + Redis)
      - __init__.py -> inicialização do app
```


## Conversas com LLM

O fluxo de `fluidocs-agente-api` esta integrado ao cliente Ollama existente.
Recebe a pergunta e chama o `ServicoPesquisa` existente, com pesquisa hibrida
no indice do usuario autenticado. Recupera a primeira pagina de 5 documentos,
com ate 5 trechos por documento. Envia ao LLM somente os 5 trechos de maior
pontuacao, sem duplicados, com ate 1.200 caracteres cada e respeitando tambem
`OLLAMA_MAX_CONTEXT_CHARS`. O prompt usa JSON compacto e o historico considera
no maximo as 20 mensagens mais recentes, dentro de `OLLAMA_MAX_HISTORY_CHARS`.
Nao e necessario enviar trechos nem executar uma pesquisa separadamente.

Configure no `.env` (valores de referencia em `.env.example`):

```dotenv
OLLAMA_CHAT_HOST=http://ollama:11434
OLLAMA_CHAT_MODEL=llama3
OLLAMA_MAX_CONTEXT_CHARS=16000
OLLAMA_MAX_HISTORY_CHARS=4000
OLLAMA_MAX_RESPONSE_TOKENS=384
OLLAMA_KEEP_ALIVE=30m
```

Baixe o modelo configurado e aplique a migracao antes de iniciar a API sobre
um banco existente. Execute os comandos a partir de `backend/`:

```bash
docker compose up -d postgresql ollama
docker compose exec ollama ollama pull llama3
docker compose exec ollama ollama pull qwen3-embedding:0.6b
docker compose run --rm --no-deps api uv run aerich upgrade
docker compose up -d api
```

A migracao `1_20260907000000_conversas.py` adiciona `comportamento_ia` ao usuario
e cria as tabelas `chave_api`, `fonte_dados`, `conversa`, `mensagem` e `anexo`.
O model anterior `ChatLLM` permanece intacto; nenhum historico legado em JSON e
convertido automaticamente. `ChaveAPI`, `FonteDados` e `Anexo` representam o
diagrama; esta entrega nao acrescenta endpoints de gestao de chaves ou upload.

As rotas de pesquisa e conversa usam uma chave de API cadastrada no header
`X-API-Key: <token>` e retornam
`BaseResponse`, com `meta`, `dados` e `paginacao`:

- `POST /api/conversas/perguntar`: envia uma pergunta, inicia ou continua uma conversa e salva as mensagens.
- `POST /api/conversas`: cria sem corpo uma conversa sem nome e sem mensagens (201).
- `PATCH /api/conversas/{conversa_id}`: altera o nome com `{"titulo": "Novo nome"}`.
- `DELETE /api/conversas/{conversa_id}`: exclui a conversa, suas mensagens e anexos.
- `GET /api/conversas?pagina=1&por_pagina=20`: lista as conversas do usuario.
- `GET /api/conversas/{conversa_id}`: retorna a conversa e suas mensagens em ordem.

Para uma integracao externa, crie a chave em `POST /api/chaves-api` usando o
JWT do dono da conta e o corpo `{"nome": "Integracao"}`. Use o token retornado
em `dados.token` no header `X-API-Key`. A chave identifica o dono dos documentos
e das conversas; chaves do mesmo usuario acessam as mesmas conversas.
Ausencia de chave, chave invalida ou removida retorna 401. O dono da chave deve
ter ao menos uma fonte ativa cadastrada; caso contrario, retorna 403.
As rotas administrativas de usuarios, fontes e chaves continuam usando JWT.

`POST /api/pesquisar` tambem usa `X-API-Key`. Sem filtro de fontes, pesquisa
somente nas fontes ativas cadastradas do dono da chave. Com filtro, valida
que todas as fontes pertencem a esse usuario e estao ativas.

Exemplo de corpo para `POST /api/conversas/perguntar`:

```json
{
  "pergunta": "Qual o prazo para solicitar ferias?",
  "fonte_dados_ids": [1]
}
```

O campo `dados` da resposta contem `conversa_id` e `resposta`. Envie esse
`conversa_id` com a proxima pergunta para continuar a conversa. Cada pergunta
executa uma nova pesquisa. `fonte_dados_ids` e obrigatorio em cada pergunta,
com pelo menos uma fonte ativa do usuario. Ausencia ou lista vazia retorna 422;
fontes inexistentes, de outro usuario ou em exclusao retornam 404 antes da
pesquisa e da chamada ao LLM. A pesquisa considera somente as fontes selecionadas.
O historico e carregado exclusivamente da tabela `mensagem`, pela conversa do
usuario autenticado. Os campos legados `historico`, `trechos`, `documentos` e
`titulo` enviados na pergunta sao ignorados; o contexto vem da pesquisa interna.
Sem `conversa_id`, a API cria automaticamente uma conversa cujo titulo e a
pergunta, limitado aos 255 caracteres da tabela. A mensagem mantem o texto inteiro.
Uma conversa criada por `POST /api/conversas` retorna `titulo: ""` e recebe o nome
da primeira pergunta, exceto se ja tiver sido renomeada pelo usuario. O titulo
escolhido e preservado nas perguntas seguintes. Nao e necessaria nova migracao.
No banco e na consulta das
mensagens, os papeis sao `U` (usuario) e `A` (assistente).

O campo opcional `anexos` aceita metadados como
`[{"nome": "Politica_de_Ferias.pdf", "extensao": "pdf"}]`. Eles sao salvos na
tabela `anexo`, vinculados a mensagem do usuario, na mesma transacao da
interacao, e retornados na consulta da conversa. Isso nao realiza upload nem
extrai conteudo: as evidencias para o LLM vem da pesquisa dos documentos indexados.
O filtro `fonte_dados_ids` é validado pelo serviço de pesquisa antes da consulta:
as fontes informadas devem existir no banco, pertencer ao usuário autenticado
e estar ativas. A pesquisa permanece restrita ao índice desse usuário.
Fontes da implementação: [pesquisa](src/backend/api/services/pesquisa.py) e
[validação das fontes](src/backend/api/services/fontes_dados.py).
Todas as operacoes de conversa validam o
proprietario; conversas de outros usuarios retornam 404.

O campo opcional `comportamento_ia` pode ser consultado e alterado pelas rotas
existentes `GET /api/me` e `PATCH /api/me`. Seu valor atual no banco e enviado
como instrucao de sistema em cada chamada ao LLM, definindo o comportamento
da resposta. Se estiver nulo ou em branco, usa o comportamento padrao. As
regras de fundamentacao em documentos permanecem em ambos os casos.

Anexos continuam ausentes da entrada. A resposta imediata em `dados.anexos` e
a consulta das mensagens retornam os anexos correspondentes aos dois trechos
mais bem pontuados enviados ao LLM (ou menos, se nao houver dois). Cada anexo
mantem o formato existente: `id`, `mensagem_id`, `nome` e `extensao`, vinculado
a mensagem do assistente. Nao inclui conteudo, pontuacao ou campo de evidencia.
O prompt pede uma sintese natural, sem listar fontes no corpo da resposta.
Os models permanecem inalterados e essa otimizacao nao exige nova migration.

Sem trechos uteis, a API salva uma resposta de contexto insuficiente sem chamar
o modelo. Falhas de comunicacao com o Ollama retornam `503` sem salvar a
interacao. Se outra mensagem for salva durante a geracao, retorna `409` para
que a pergunta seja reenviada com o historico atualizado.

## Estado das verificações

Em 10 de setembro de 2026, a pasta `backend/tests` não existe neste checkout.
A instrução anterior de executar `unittest discover -s tests` não corresponde
a uma suíte disponível e foi removida. Não há evidência aqui de testes de rotas,
autenticação, pesquisa ou persistência com SQLite em memória.

Para escolher a validação adequada, consulte as [orientações do backend](AGENTS.md)
e o [guia operacional](../docs/harness/operacao.md). Checagem de sintaxe não comprova
comportamento nem integração com serviços externos.
