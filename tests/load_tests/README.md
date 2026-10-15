# Percentis HTTP com Locust

Este projeto instala o Locust em um ambiente próprio, sem instalar as dependências
da API nem incluir o gerador de carga no runtime do backend. Requer Python 3.13+
e `uv`. Os comandos abaixo partem da raiz do repositório; após o `cd`, execute
todos os comandos nesta pasta para carregar a configuração de `pyproject.toml`.

```powershell
cd tests/load_tests
uv sync --locked
uv run --locked locust --scenario saude
```

Abra <http://127.0.0.1:8089>. O host padrão é `http://localhost:8000`, com cinco
usuários e entrada de um usuário por segundo. Confira a porta publicada da API
no seu ambiente e altere `--host` quando necessário. Na interface, escolha o
cenário e preencha a configuração antes de iniciar. A interface se vincula
somente ao loopback por padrão.

Os exemplos usam `uv` diretamente. Em um terminal configurado com o perfil RTK,
use `rtk proxy uv` no lugar de `uv`, conforme a configuração local do repositório.

## Cenários e pré-requisitos

| `--scenario` | Operações medidas | Preparação |
| --- | --- | --- |
| `saude` | `GET /health` | API iniciada; não verifica busca, banco ou inferência. |
| `painel` (padrão) | `GET /fontes-dados/` e `GET /conversas`, sorteadas com a mesma probabilidade | Conta de teste existente ou JWT. |
| `literal` | `POST /pesquisar`, `tipo_pesquisa: literal` | Autenticação e IDs de fontes próprias, ativas e com documentos indexados. |
| `hibrida` | `POST /pesquisar`, `tipo_pesquisa: hibrida` | Mesmos dados, Elasticsearch e modelo de embeddings disponível no Ollama. |
| `conversa` | `POST /conversas/perguntar` | Mesmos dados e modelo de conversa disponível; cada pergunta persiste uma nova conversa e mensagens. |

Os caminhos foram conferidos em [router.py](../../backend/src/backend/api/routes/router.py)
e nos [contratos de pesquisa](../../backend/src/backend/api/schemas/backoffice/pesquisa_schemas.py)
e [conversa](../../backend/src/backend/api/schemas/backoffice/conversa_schemas.py).
Na API direta e no [proxy Vite atual](../../frontend/vite.config.ts), o prefixo é
vazio. Para medir painel, pesquisa ou conversa pelo Vite, use
`--host http://localhost:3000`, sem `--api-prefix`. Isso inclui o proxy na latência;
não mede renderização do React, carregamento de assets nem execução no navegador.
`/health` não tem proxy no Vite atual: execute `saude` contra a API direta.
Reserve `--api-prefix /api` para outro proxy configurado para remover esse
prefixo antes de encaminhar as requisições à API.

Use uma conta e fontes destinadas aos testes. Crie a conta e indexe os documentos
antes da medição, pelos fluxos existentes da aplicação. O gerador não cadastra
usuários, não indexa documentos e não remove dados ao terminar. O cenário
`conversa` deve ser escolhido explicitamente e aumenta o volume de dados.
Cada requisição inicia uma conversa independente para manter o contexto limitado
e evitar concorrência sobre o mesmo histórico.

## Autenticação e consultas

Configure as credenciais no processo, sem salvar valores reais no repositório:

```powershell
$env:FLUIDOCS_LOAD_EMAIL = "carga@example.com"
$env:FLUIDOCS_LOAD_PASSWORD = "senha-ficticia-substitua-localmente"
$env:FLUIDOCS_LOAD_SOURCE_IDS = "1,2"
uv run --locked locust --scenario hibrida --queries-file queries.example.json
```

Os IDs são ilustrativos: substitua pelos IDs de fontes da conta de teste.
Adapte as consultas ao corpus indexado. `queries.example.json` contém perguntas
fictícias e serve como modelo de uma lista JSON UTF-8; uma pergunta é sorteada a
cada tarefa. Para uma única consulta, use `--query "termo presente no corpus"`.

Também é possível informar `FLUIDOCS_LOAD_TOKEN` com um JWT válido, sem o prefixo
`Bearer`. Ele tem precedência sobre e-mail e senha. O login usa formulário OAuth2
em `/auth/login` uma vez por usuário virtual e aparece na linha
`[preparacao] POST /auth/login`; essa linha não recebe limites de percentis.
O JWT é reutilizado durante a execução, sem renovação automática. A duração deve
caber na validade do token; falhas `401` reprovam a execução. Todos os usuários
virtuais usam a mesma conta, o que simula concorrência sobre os dados dessa conta.

| Opção | Variável de ambiente | Padrão |
| --- | --- | --- |
| `--scenario` | `FLUIDOCS_LOAD_SCENARIO` | `painel` |
| `--email` | `FLUIDOCS_LOAD_EMAIL` | vazio |
| `--password` | `FLUIDOCS_LOAD_PASSWORD` | vazio |
| `--token` | `FLUIDOCS_LOAD_TOKEN` | vazio |
| `--source-ids` | `FLUIDOCS_LOAD_SOURCE_IDS` | vazio |
| `--query` | `FLUIDOCS_LOAD_QUERY` | `Como solicitar férias?` |
| `--queries-file` | `FLUIDOCS_LOAD_QUERIES_FILE` | vazio |
| `--api-prefix` | `FLUIDOCS_LOAD_API_PREFIX` | vazio |
| `--request-timeout` | `FLUIDOCS_LOAD_REQUEST_TIMEOUT` | 120 segundos de leitura; conexão limitada a 5 s |
| `--p95-limit-ms` | `FLUIDOCS_LOAD_P95_LIMIT_MS` | sem limite |
| `--p99-limit-ms` | `FLUIDOCS_LOAD_P99_LIMIT_MS` | sem limite |

Senha e token ficam mascarados nos respectivos campos da interface. Prefira as
variáveis de ambiente para não incluir segredos no histórico do terminal.

## Execução sem interface e relatórios

Exemplo de pesquisa híbrida com 20 usuários, entrada de dois usuários por segundo
e cinco minutos de carga, usando as credenciais e fontes definidas acima:

```powershell
uv run --locked locust --headless --scenario hibrida --users 20 --spawn-rate 2 --run-time 5m --queries-file queries.example.json
```

O intervalo entre tarefas de cada usuário é sorteado entre um e três segundos.
Usuários concorrentes não equivalem a requisições por segundo: a vazão depende
da duração das respostas e dessas pausas. Por padrão, as estatísticas são zeradas
ao concluir a entrada dos usuários (`reset-stats`); o tempo dessa entrada faz
parte de `--run-time`. Dimensione a duração para sobrar uma janela de medição.
O encerramento aguarda até 130 s por tarefas em andamento; `--run-time` não é o
tempo total de parede do processo. Ajuste `--stop-timeout` se aumentar o timeout.

Os arquivos são escritos em `results/`, ignorada pelo Git:

- `fluidocs_stats.csv`: contagem, falhas, tempos, vazão e p50/p90/p95/p99 por operação.
- `fluidocs_stats_history.csv`: histórico de todas as operações e do agregado;
  os percentis atuais refletem a janela móvel do Locust.
- `fluidocs_failures.csv` e `fluidocs_exceptions.csv`: erros HTTP/validação e exceções.
- `fluidocs.html`: relatório navegável, com gráficos e estatísticas.

Para preservar execuções, altere os nomes, por exemplo:

```powershell
uv run --locked locust --headless --scenario literal --users 10 --spawn-rate 1 --run-time 3m --csv results/literal-10 --html results/literal-10.html
```

p95 de 800 ms significa que aproximadamente 95% das requisições medidas naquela
operação terminaram em até 800 ms. As unidades são milissegundos. O tempo medido
é o HTTP observado pelo gerador, incluindo rede e recebimento do corpo;
`meta.tempo_execucao` não é usado. Locust agrupa os tempos em histogramas, de modo
que os percentis têm arredondamento. Consulte cada operação e sua taxa de erro;
o agregado mistura operações e pode incluir login. Requisições com erro também
contribuem para as estatísticas de tempo.

Para comparar literal, híbrida e conversa, faça execuções separadas com o mesmo
corpus, consultas e concorrência. Aqueça os modelos antes de medir o estado
aquecido e registre separadamente execuções a frio. Uma busca sem resultados
pode retornar HTTP 200; na conversa, contexto insuficiente pode produzir resposta
sem inferência. Confirme que o corpus e as perguntas exercitam o fluxo pretendido
antes de interpretar os percentis como tempo do RAG. Use uma janela longa e
amostras suficientes, especialmente para p99. Registre também hardware, versões,
tamanho do corpus, concorrência, falhas e condição dos modelos.

## Limites opcionais

Para usar a execução como verificação automatizada:

```powershell
uv run --locked locust --headless --scenario literal --users 10 --spawn-rate 1 --run-time 3m --p95-limit-ms 800 --p99-limit-ms 1500
```

Os valores acima são exemplos, não metas aprovadas do produto. Não há limites
de latência por padrão. Cada operação é avaliada individualmente com os
percentis da execução inteira, excluindo o login de preparação. A execução
retorna `1` se houver requisições com falha, falha de preparação, ausência de
amostras do cenário ou violação de algum limite; configuração inválida retorna
`2`. Respostas 3xx, 4xx e 5xx e respostas 200 sem o envelope JSON esperado contam
como falha. Evite sobrescrever `--exit-code-on-error` em verificações automatizadas.

## Verificação do gerador

```powershell
uv run --locked python -m unittest discover -s tests -v
```

A suíte usa um servidor HTTP local fictício para verificar autenticação,
contratos enviados, contabilização de falhas, limites por operação e execução
headless com exportação CSV/HTML. Ela não inicia a API nem os serviços externos
e não demonstra os percentis reais do Fluidocs. Os cenários reais exigem a
aplicação e os dados preparados descritos acima.

Referências: [configuração e estatísticas do Locust](https://docs.locust.io/en/stable/configuration.html)
e [execução sem interface](https://docs.locust.io/en/stable/running-without-web-ui.html).
