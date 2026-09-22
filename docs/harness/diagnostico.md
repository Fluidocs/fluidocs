# Diagnóstico inicial do harness

Verificado em **10 de setembro de 2026**, sobre o commit `09da11f`.
O checkout estava limpo no início da inspeção. Este é um registro datado;
mudanças posteriores exigem reconferir as evidências afetadas.

## Como interpretar este documento

- **Decisão**: intenção confirmada no documento de produto; não comprova entrega.
- **Estático**: encontrado no código/configuração; não comprova execução correta.
- **Executado**: comando ou consulta executado neste diagnóstico, com resultado abaixo.
- **Pendente**: não verificado ou sem evidência suficiente.

O diagnóstico cobre orientação, comandos, principais fluxos e lacunas de contexto.
Não equivale a auditoria exaustiva de segurança ou validação funcional ponta a ponta.
Não foram executados uploads, migrações, downloads de modelos ou reinícios de serviços.

## Fontes principais e seus limites

| Assunto | Fonte | Uso e limite |
| --- | --- | --- |
| Escopo e decisões de produto | [PRODUCT.md](../../PRODUCT.md) | Fonte das decisões confirmadas; objetivos não são capacidades já entregues. |
| Aparência da página Início | [DESIGN.md](../../DESIGN.md) | Restrito à landing page; não estender ao painel por inferência. |
| Apresentação e instalação | [README](../../README.md), [README backend](../../backend/README.md) | Ponto de entrada existente, com lacunas listadas abaixo. |
| Arquitetura | [graphify.md](../graphify.md) | Mapa estático de 09/09/2026; não gerado pelo Graphify e não validado em execução. |
| Serviços de desenvolvimento | [Compose da raiz](../../docker-compose.yml) | Declara frontend, API, worker, PostgreSQL, Elasticsearch, Ollama e Redis. |
| Dependências e comandos | [package.json](../../frontend/package.json), [pyproject.toml](../../backend/pyproject.toml) | Conferir junto de `package-lock.json` e `uv.lock`; não inferir versão instalada apenas pelo intervalo declarado. |

## Instruções e ferramentas existentes

- Nenhum `AGENTS.md` versionado foi encontrado neste checkout. A instrução recebida
  na sessão referencia `C:/Users/dev02/.codex/RTK.md`, fora do repositório, e exige
  prefixar comandos com `rtk`. Essa dependência é específica da máquina.
- [Impeccable](../../.github/skills/impeccable/SKILL.md) versão declarada 4.3.1:
  skill de interface, com referências e quatro definições de agentes em
  `.github/agents`. Seu escopo exclui tarefas sem UI. Foi inspecionada como
  configuração existente, não ativada para este diagnóstico.
- [Hook existente](../../.github/hooks/impeccable.json): declara `postToolUse`
  para edição/criação, com comando Bash. A presença do arquivo não comprova que
  o host Codex atual carregue ou execute esse hook.
- `.impeccable` guarda contexto visual e estado de trabalho. O
  [.gitignore](../../.gitignore) exclui `questions`, `review` e `mocks`;
  esses diretórios não devem ser a única memória de decisões duráveis.
- Não foram encontrados workflows de CI versionados em `.github/workflows`.

### RTK: resultado e limite

`rtk --version` respondeu `0.47.0`. `rtk proxy git status --short` funcionou.
O modo filtrado de Git falhou na inspeção anterior por resolução de diretório de
configuração (`CLAUDE_CONFIG_DIR`/`HOME`); nesta etapa, `rtk gain` falhou ao abrir
`AppData/Local/rtk/history.db` por acesso negado no ambiente restrito.

O modo `rtk proxy` permitiu executar os comandos deste diagnóstico, mas passa a
saída sem filtragem. Não há medição confiável de economia de tokens nesta etapa.
A causa e a correção persistente da configuração/permissão do RTK permanecem
pendentes; nenhuma variável global ou permissão foi alterada.

## Mapa mínimo da implementação

| Fluxo | Evidências de entrada | Estado observado |
| --- | --- | --- |
| Inicialização da API | [entrada](../../backend/src/backend/__init__.py), [configuração](../../backend/src/backend/config/__init__.py) | `backend:main` inicia Uvicorn. Lifespan configura ORM, Elasticsearch e clientes Ollama. |
| Rotas HTTP | [router](../../backend/src/backend/api/routes/router.py) | Prefixo `/api`, com auth, usuário, fontes de dados, indexação, pesquisa e conversas. |
| Autenticação | [rotas](../../backend/src/backend/api/routes/auth_routes.py), [dependência](../../backend/src/backend/api/dependencies/auth.py) | Cadastro/login e verificação de JWT Bearer no backend. Integração do painel não concluída. |
| Fontes de dados | [rotas](../../backend/src/backend/api/routes/backoffice/fontes_dados_routes.py), [modelo](../../backend/src/backend/api/models/fonte_de_dados.py) | `/api/fontes-dados`; fonte vinculada a usuário, com estados e unicidade de nome por usuário. |
| Isolamento da pesquisa | [serviço](../../backend/src/backend/api/services/pesquisa.py), [nome do índice](../../backend/src/backend/domain/indices/nome_indice.py) | Valida fontes para o usuário e usa `documentos-usuario-{usuario_id}`. Evidência estática, sem teste de isolamento executado. |
| Indexação assíncrona | [submissão](../../backend/src/backend/api/services/indexacao/submissao_indexacao.py), [workers](../../backend/src/backend/workers/tarefa_indexacao.py) | Submissão usa Celery; Compose compartilha `/tmp/docs` entre API e worker. |
| RAG e conversa | [serviço](../../backend/src/backend/api/services/conversa.py) | Chama `ServicoPesquisa` com pergunta e filtros antes da geração. Não validado com documentos/modelos reais nesta etapa. |
| Painel | [roteador](../../frontend/src/App.tsx), [cliente HTTP](../../frontend/src/services/api.ts) | React com rotas públicas e painel; `/hub` redireciona para `/busca`. Contratos HTTP divergem do backend. |

## Execução e validação

Ambiente do diagnóstico: Windows/PowerShell, Node `24.19.0`, Python `3.14.7`.
Existem `frontend/node_modules` e `backend/.venv`; sua presença não comprova que
as dependências estejam sincronizadas com os locks. Dockerfiles usam Node 22 e
Python 3.13. Os resultados locais não substituem validação nessas imagens.

| Comando/consulta | Diretório | Resultado em 10/09/2026 |
| --- | --- | --- |
| `rtk proxy npm.cmd run lint` | `frontend` | Passou; executa `tsc --noEmit`, não um lint geral de estilo. |
| `rtk proxy npm.cmd test` | `frontend` | Passou: 2 arquivos, 6 testes Vitest. |
| `rtk proxy npm.cmd run build` | `frontend` | Passou; aviso de chunk JS de 503,34 kB, acima de 500 kB. |
| Parse de todos os `.py` com `ast.parse`, UTF-8 | raiz | 94 arquivos em `backend/src` passaram; não importa dependências nem testa comportamento. |
| `rtk proxy docker compose config --quiet` | raiz | Executado com avisos de acesso à configuração Docker; não registrado como validação limpa. |
| `rtk proxy docker compose ps --all` | raiz | Consulta executada após liberação de acesso ao Docker; estado abaixo. |
| `GET http://localhost:8000/health` | HTTP local, timeout 5 s | Respondeu 200. O handler não testa saúde de dependências. |
| `uv run python -m unittest discover -s tests -v` | `backend` | Não executado: `backend/tests` não existe; comando consta no README. |

Testes existentes: [cliente HTTP](../../frontend/src/services/api.test.ts) e
[formatação da resposta](../../frontend/src/utils/respostaAgente.test.ts).
Esses seis testes não demonstram compatibilidade ponta a ponta com a API.

Na consulta Docker, API, `api-worker`, Ollama, PostgreSQL e Redis estavam em
execução; PostgreSQL e Redis reportavam `healthy`. Frontend e Elasticsearch
estavam parados. Havia também um serviço `celery-worker` parado, não declarado
no Compose atual da raiz; origem não investigada. Nenhum serviço foi alterado.

### Comandos de início encontrados, ainda não validados do zero

- Raiz: `rtk proxy docker compose build` e `rtk proxy docker compose up`
  usam o Compose com frontend e backend.
- `frontend`: `rtk proxy npm.cmd run dev` inicia Vite na porta 3000.
  [vite.config.ts](../../frontend/vite.config.ts) encaminha `/api` para
  `VITE_API_PROXY_TARGET`, com padrão `http://localhost:8000`.
- `backend`: `rtk proxy uv run backend` usa a entrada declarada no pyproject;
  exige configuração e serviços externos disponíveis.
- Worker: Compose declara `uv run celery -A backend.workers.app_celery worker`
  com opções de log e concorrência.
- O [Compose do backend](../../backend/docker-compose.yml) usa `.env` relativo
  a `backend`, enquanto o Compose da raiz usa `.env` da raiz. Ambos usam nomes
  fixos de contêiner; não presumir que podem subir simultaneamente.
- Instalação de modelos e migrações estão no README do backend. Sua sequência
  não foi executada nem certificada para um ambiente vazio.

## Lacunas prioritárias

| ID | Constatação verificável | Consequência para o harness / próximo tratamento |
| --- | --- | --- |
| H01 | Falta entrada de instruções versionada e índice de contexto. | Criar `AGENTS.md` curto e roteamento de leitura na etapa 2. |
| H02 | README anuncia testes backend ausentes. | Corrigir a orientação na etapa de comandos e planejar testes reais; nunca reportar cobertura inexistente. |
| H03 | [Entrar](../../frontend/src/pages/Entrar.tsx) e [Cadastrar](../../frontend/src/pages/Cadastrar.tsx) usam estado local simulado; cliente HTTP não adiciona Bearer automaticamente. | Registrar autenticação do painel como incompleta; integração é tarefa de produto separada. |
| H04 | Cliente chama `/repositorios/` e `/agente/conversas/`; router backend registra `/fontes-dados/` e `/conversas`. | Evitar usar testes do cliente como prova de contrato; preparar validação de contratos nas etapas posteriores. |
| H05 | `/equipe` e campos `gruposAcesso` existem no frontend, mas PRODUCT exclui grupos/subusuários/hierarquias. | Tratar como divergência de implementação; não ampliar escopo por leitura das telas. |
| H06 | README diz que pesquisa por `fonte_dados_ids` não consulta fontes; `ServicoPesquisa` chama `validar_existencia` no serviço de fontes. | Corrigir o trecho documental com base no código, preservando decisão de produto. |
| H07 | Não há rotas de gestão/autenticação por API Key no router examinado, embora API Keys sejam objetivo de produto. | Não anunciar a capacidade como entregue; validar implementação quando essa tarefa for aberta. |
| H08 | Dois arquivos de migração têm prefixo `1_`; startup usa `generate_schemas(safe=True)`. | Conferir histórico Aerich e instalação do zero em banco isolado antes de certificar migrações; risco ainda não confirmado como falha. |
| H09 | RTK filtrado/telemetria têm falhas de ambiente; proxy funciona. | Diagnosticar configuração e acesso antes de estabelecer métrica de economia. |
| H10 | API responde `/health` mesmo com Elasticsearch parado na consulta. | Health atual não certifica busca/RAG nem prontidão de todas as dependências. |

## Continuidade acordada

1. **Concluído:** diagnóstico inicial com fontes, resultados e lacunas.
2. **Próximo:** entrada curta de contexto e índice; reutilizar PRODUCT, DESIGN e
   mapa existente, com distinção entre decisão, implementação e validação.
3. Registro enxuto por tarefa e decisões duráveis, atualizado em marcos relevantes.
4. Skills apenas para procedimentos recorrentes e scripts para verificações
   mecânicas; incluir orientação de comandos e tratar H02/H06/H09.
5. Comparar tarefas representativas quanto a leitura inicial, repetição de
   investigação, qualidade da retomada, erros e custo/tempo por conclusão.

Critério da próxima etapa: uma tarefa nova deve localizar as fontes relevantes
e saber quais verificações executar sem ler todo este diagnóstico. Manter este
arquivo como evidência histórica, sem carregamento integral obrigatório.
