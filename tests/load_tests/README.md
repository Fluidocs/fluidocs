# Percentis HTTP com Locust

O gerador de carga tem um ambiente próprio, separado das dependências e do runtime
da API. Requer Python 3.13+ e `uv`. Partindo da raiz do repositório:

```powershell
cd tests/load_tests
uv sync --locked
uv run --locked locust --class-picker SaudeUser
```

Abra [a interface do Locust](http://127.0.0.1:8089). Ela se vincula somente ao
loopback por padrão. O host padrão é `http://localhost:8000`, com cinco usuários,
entrada de um usuário por segundo e duração de um minuto. Ajuste `--host` à porta
da API no seu ambiente. Selecione a classe e preencha os parâmetros antes de
iniciar; o comando acima deixa somente saúde selecionada inicialmente.

**Migração:** `--scenario` e `FLUIDOCS_LOAD_SCENARIO` foram removidos. Informe o
nome da classe na CLI ou escolha as classes com `--class-picker`. Sem uma classe
explícita, o Locust seleciona todas, inclusive `ConversaUser`, que persiste dados
e pode executar inferência. Para comparar cenários, execute uma classe por vez.

Em terminais com o perfil RTK do projeto, use `rtk proxy uv` no lugar de `uv`.
Todos os comandos a seguir partem de `tests/load_tests`, para carregar o
`pyproject.toml` e resolver os caminhos relativos dos perfis e consultas.

## Organização

- [locustfile.py](locustfile.py): expõe as classes e registra os listeners.
- [carga/config.py](carga/config.py): argumentos e funções puras de parsing.
- [carga/eventos.py](carga/eventos.py): ciclo de vida, percentis e resultado.
- [carga/validacao.py](carga/validacao.py): validações de resposta por operação.
- [carga/usuarios/](carga/usuarios/): autenticação comum e classes de cenário.
- [cenarios/](cenarios/): perfis opcionais de execução sem interface.
- [queries.example.json](queries.example.json): consultas fictícias de exemplo.

Um cenário novo herda de `FluidocsUser`, declara seus pré-requisitos, define suas
tasks e injeta um validador em `requisitar`. Exporte a classe em `locustfile.py`
para disponibilizá-la; não é preciso alterar um seletor central de cenários.

## Cenários e contratos

| Classe | Operações medidas | Preparação |
| --- | --- | --- |
| `SaudeUser` | `GET /health` | API iniciada; não verifica busca, banco ou inferência. |
| `PainelUser` | `GET /fontes-dados/` e `GET /api/v1/conversas` | JWT ou login da conta de teste **e** uma chave de API dessa mesma conta. |
| `PesquisaLiteralUser` | `POST /api/v1/pesquisar`, `tipo_pesquisa: literal` | Chave de API e IDs de fontes próprias, ativas e com documentos indexados. |
| `PesquisaHibridaUser` | `POST /api/v1/pesquisar`, `tipo_pesquisa: hibrida` | Mesmos dados, Elasticsearch e modelo de embeddings disponível no Ollama. |
| `ConversaUser` | `POST /api/v1/conversas/perguntar` | Mesmos dados e modelo de conversa disponível; cada pergunta persiste uma nova conversa e mensagens. |

No painel, as duas tasks têm peso `1`: a proporção esperada é 1:1, sem garantir
contagens iguais numa execução curta. Os caminhos canônicos têm barra final
apenas em fontes. As requisições não seguem redirects: um 307 é falha.

As rotas e credenciais foram conferidas no
[router principal](../../backend/src/backend/api/routes/router.py),
[router público v1](../../backend/src/backend/api/routes/public/v1/__init__.py),
[rotas de fontes](../../backend/src/backend/api/routes/backoffice/fontes_dados_routes.py),
[rotas de conversa](../../backend/src/backend/api/routes/public/v1/conversa_routes.py)
e na [autenticação por chave](../../backend/src/backend/api/dependencies/chave_api.py).
Pesquisa e conversas usam `X-API-Key`; o gerenciamento de fontes usa JWT.
A resposta de conversa é validada por `conversa_id`, `resposta` e `anexos`,
conforme o [schema](../../backend/src/backend/api/schemas/backoffice/conversa_schemas.py).

Na API direta e no [proxy Vite atual](../../frontend/vite.config.ts), deixe
`--api-prefix` vazio: `/api/v1` já faz parte dos caminhos de consumo. Para medir
pelo Vite, use `--host http://localhost:3000`. Isso inclui o proxy na latência,
sem medir renderização do React, assets ou execução no navegador.
`/health` não tem proxy no Vite atual: execute `SaudeUser` contra a API direta.
Use `--api-prefix /gateway` somente se outro proxy remover esse prefixo antes de
encaminhar todas as rotas à API.

## Credenciais e consultas

Prepare uma conta de teste dedicada, crie uma chave de API e indexe documentos nas
fontes dessa conta pelos fluxos existentes. O gerador não cadastra usuários, não
cria chaves, não indexa documentos e não remove dados ao terminar.

Configure segredos somente nas variáveis de ambiente do processo. Senhas, tokens
e chaves passados na CLI podem aparecer no histórico do shell e na lista de
processos, mesmo com os campos marcados como secretos na interface do Locust.

```powershell
$env:FLUIDOCS_LOAD_API_KEY = "chave-ficticia-substitua-localmente"
$env:FLUIDOCS_LOAD_SOURCE_IDS = "12,15"
$env:FLUIDOCS_LOAD_QUERIES_FILE = "queries.example.json"

# Painel também exige autenticação JWT da mesma conta:
$env:FLUIDOCS_LOAD_EMAIL = "carga@example.com"
$env:FLUIDOCS_LOAD_PASSWORD = "senha-ficticia-substitua-localmente"
# Alternativa ao login: definir FLUIDOCS_LOAD_TOKEN com um JWT válido, sem "Bearer".
```

Os IDs são ilustrativos; substitua-os pelos IDs das fontes da conta de teste.
Adapte as consultas ao corpus indexado. O arquivo deve ser uma lista JSON UTF-8
não vazia, com textos de 1 a 2000 caracteres; uma consulta é sorteada por tarefa.
Para uma consulta única, remova `FLUIDOCS_LOAD_QUERIES_FILE` e use
`--query "termo presente no corpus"`.

O JWT informado tem precedência sobre e-mail/senha. O login do painel usa
formulário OAuth2 em `/auth/login` uma vez por usuário virtual, e aparece em
`[preparacao] POST /auth/login`; essa linha não recebe limites de percentis.
Pesquisa e conversa usam somente a chave de API, sem fazer login.
Não há renovação automática de credenciais. Dimensione a duração dentro de sua
validade; respostas 401 reprovam a execução. Os usuários virtuais compartilham a
mesma conta, simulando concorrência sobre os dados dela.

| Opção | Variável de ambiente | Padrão |
| --- | --- | --- |
| `--email` | `FLUIDOCS_LOAD_EMAIL` | vazio |
| `--password` | `FLUIDOCS_LOAD_PASSWORD` | vazio |
| `--token` | `FLUIDOCS_LOAD_TOKEN` | vazio |
| `--api-key` | `FLUIDOCS_LOAD_API_KEY` | vazio |
| `--source-ids` | `FLUIDOCS_LOAD_SOURCE_IDS` | vazio |
| `--query` | `FLUIDOCS_LOAD_QUERY` | `Como solicitar férias?` |
| `--queries-file` | `FLUIDOCS_LOAD_QUERIES_FILE` | vazio |
| `--api-prefix` | `FLUIDOCS_LOAD_API_PREFIX` | vazio |
| `--request-timeout` | `FLUIDOCS_LOAD_REQUEST_TIMEOUT` | 120 s de leitura; conexão limitada a 5 s |
| `--p95-limit-ms` | `FLUIDOCS_LOAD_P95_LIMIT_MS` | sem limite |
| `--p99-limit-ms` | `FLUIDOCS_LOAD_P99_LIMIT_MS` | sem limite |

## Pesquisa literal

```powershell
uv run --locked locust PesquisaLiteralUser --headless --host http://localhost:8000 --users 50 --spawn-rate 5 --run-time 5m --p95-limit-ms 800 --p99-limit-ms 1500 --csv results/pesquisa-literal --html results/pesquisa-literal.html
```

## Pesquisa híbrida

```powershell
uv run --locked locust PesquisaHibridaUser --headless --host http://localhost:8000 --users 30 --spawn-rate 3 --run-time 5m --p95-limit-ms 2000 --p99-limit-ms 4000 --csv results/pesquisa-hibrida --html results/pesquisa-hibrida.html
```

## Conversa com LLM

Cada requisição inicia uma conversa independente, limita o crescimento do contexto
e evita concorrência no mesmo histórico. Também grava dados no banco e pode chamar
o modelo, consumindo CPU/GPU, memória e tempo de inferência. Use poucos usuários
e a conta dedicada, com consultas que encontrem contexto no corpus preparado.

`ConversaUser` espera de 5 a 10 segundos entre tarefas; saúde, painel e pesquisa
esperam de 1 a 3 segundos. Ajuste `wait_time` na classe se o perfil de uso medido
exigir outro ritmo. Usuários concorrentes não equivalem a requisições por segundo.

```powershell
uv run --locked locust ConversaUser --headless --host http://localhost:8000 --users 5 --spawn-rate 1 --run-time 10m --request-timeout 180 --stop-timeout 190 --p95-limit-ms 30000 --csv results/conversa --html results/conversa.html
```

Não há limpeza automática. Reserve dados descartáveis e remova as conversas
criadas, após a medição, pelo fluxo de exclusão da aplicação na conta de teste.
Confirme os dados antes de excluir; a limpeza não faz parte das latências medidas.

## Saúde e painel

```powershell
uv run --locked locust SaudeUser --headless --host http://localhost:8000 --users 10 --spawn-rate 10 --run-time 1m
uv run --locked locust PainelUser --headless --host http://localhost:8000 --users 20 --spawn-rate 5 --run-time 2m
```

## Perfis reutilizáveis e execução distribuída

Os três perfis equivalem aos exemplos de pesquisa e conversa acima:

```powershell
uv run --locked locust --config cenarios/pesquisa-literal.conf PesquisaLiteralUser
uv run --locked locust --config cenarios/pesquisa-hibrida.conf PesquisaHibridaUser
uv run --locked locust --config cenarios/conversa.conf ConversaUser
```

Usuários, ritmos, durações e limites são **valores ilustrativos, ainda não
calibrados em um ambiente de homologação**. Não são metas aprovadas do produto.
Após medir o baseline, registre hardware, versões, corpus, consultas, concorrência,
falhas e estado dos modelos junto aos relatórios, e ajuste os perfis.

Para distribuir a geração de carga, execute o master e o worker em terminais
separados, com o mesmo código. Configure credenciais no processo do master:

```powershell
# Terminal 1: master, que consolida os resultados e determina o código de saída
uv run --locked locust --config cenarios/pesquisa-hibrida.conf PesquisaHibridaUser --master --expect-workers 1

# Terminal 2: worker local
uv run --locked locust --worker --master-host 127.0.0.1 --csv= --html=
```

Nos workers, \x60--csv=\x60 e \x60--html=\x60 desativam os arquivos configurados no
\x60pyproject.toml\x60: exporte os relatórios consolidados apenas no master. O histórico
completo de percentis exige cache de respostas, desativado pelo Locust nos workers.

O master encaminha as opções customizadas aos workers. Se usar consultas de um
arquivo, o mesmo caminho deve existir em cada máquina. Em máquinas separadas,
`--host` deve apontar para uma API alcançável pelos workers. Use uma rede confiável
para a comunicação de controle, que transporta as credenciais da configuração.
Falhas de preparação são propagadas pelos relatórios dos workers e preservadas
mesmo quando as estatísticas HTTP são zeradas.

## Relatórios e critérios de falha

Por padrão, as estatísticas são zeradas ao concluir a entrada dos usuários
(`reset-stats`). Essa entrada conta no `--run-time`; deixe uma janela de medição
após o aquecimento. O encerramento aguarda até 130 s pelas tarefas em andamento;
ajuste `--stop-timeout` ao aumentar o timeout, como no exemplo de conversa.
O tempo total de parede pode superar `--run-time`.

Os arquivos ficam em `results/`, ignorada pelo Git. `--csv` e `--html` mudam os
nomes para preservar execuções:

- `fluidocs_stats.csv`: contagem, falhas, tempos, vazão e p50/p90/p95/p99 por operação.
- `fluidocs_stats_history.csv`: histórico das operações e do agregado; os percentis
  atuais usam a janela móvel do Locust.
- `fluidocs_failures.csv` e `fluidocs_exceptions.csv`: erros e exceções.
- `fluidocs.html`: relatório com gráficos e estatísticas.

p95 de 800 ms significa que aproximadamente 95% das requisições daquela operação
terminaram em até 800 ms. O tempo medido é o HTTP observado pelo gerador, incluindo
rede e recebimento do corpo; `meta.tempo_execucao` não é usado. Os histogramas do
Locust arredondam percentis. Avalie cada operação e a taxa de erro; o agregado
mistura operações e pode incluir login. Respostas com erro também contribuem
para as estatísticas de tempo.

Sem limites, a execução ainda reprova erros. Com `--p95-limit-ms` e/ou
`--p99-limit-ms`, cada operação é avaliada individualmente sobre a janela medida,
excluindo o login. O processo retorna `1` para erros HTTP/validação, falha de
preparação, ausência de amostras ou violação de limite; configuração inválida
retorna `2`. Respostas 3xx, 4xx, 5xx e HTTP 200 sem o envelope ou formato esperado
contam como falha. Não sobrescreva `--exit-code-on-error` em verificações automatizadas.

Compare cenários em execuções separadas com o mesmo corpus, consultas e
concorrência. Aqueça modelos antes de medir o estado aquecido e registre execuções
a frio separadamente. Pesquisa vazia pode responder HTTP 200; conversa sem contexto
suficiente pode responder sem inferência. Confira o fluxo exercitado antes de
interpretar percentis como tempo do RAG. Use janela longa e amostras suficientes,
especialmente para p99.

## Verificação do gerador

```powershell
uv run --locked python -m unittest discover -s tests -v

# Parsing puro, sem importar ou iniciar o Locust:
uv run --locked python -m unittest discover -s tests -p test_config.py -v
```

A suíte verifica parsing, pré-requisitos das classes, autenticação, contratos
HTTP, validação de respostas, limites por operação e propagação da preparação.
Um servidor HTTP local fictício permite verificar a CLI, CSV/HTML, os perfis e
uma execução com processos reais de master/worker (falha de login antes do reset)
sem iniciar a API, banco, Elasticsearch ou Ollama. Esses testes não demonstram
latências reais do Fluidocs; carga real exige o ambiente e os dados acima.
