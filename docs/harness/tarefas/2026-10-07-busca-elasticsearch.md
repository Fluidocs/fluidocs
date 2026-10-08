# Integração da busca de arquivos com Elasticsearch

- Estado: concluída
- Atualizado em: 2026-10-08
- Referência de código: branch `main`; arquivos da implementação listados abaixo.

## Objetivo e critérios de conclusão

Conectar a tela de busca da demonstração à pesquisa implementada no backend,
com fontes obrigatórias, autenticação da conta e apresentação dos documentos
retornados. Regras de produto em [PRODUCT.md](../../../PRODUCT.md).

## Escopo e restrições aprovadas

Pedido do usuário em 2026-10-07: implementar a busca pelo endpoint de
Elasticsearch no módulo de demonstração de busca de arquivos. A integração
inclui a rota JWT necessária para o painel. Preservadas as alterações
preexistentes de gerenciamento/indexação nos arquivos compartilhados.

Em 2026-10-08, o usuário autorizou dois commits separados: primeiro a busca
via Elasticsearch, depois a indexação de documentos.
Após timeout da primeira tentativa de assinatura GPG, pediu nova tentativa
mantendo a assinatura configurada no Git.

## Estado atual e referências

- [Rota do painel](../../../backend/src/backend/api/routes/backoffice/pesquisa_routes.py):
  `POST /pesquisar`, JWT, seleção obrigatória e serviço de pesquisa existente,
  que valida a propriedade das fontes e escolhe o índice do usuário.
  A autenticação por API Key em `/api/v1/pesquisar` foi preservada.
- [Cliente HTTP](../../../frontend/src/services/api.ts): POST com consulta,
  fontes, modo híbrido e paginação; proxy Vite para a nova rota.
- [Busca](../../../frontend/src/pages/Busca.tsx) e
  [estado](../../../frontend/src/store/useBuscaStore.ts): arquivos e trechos
  da API, fontes de origem, carregamento, erros, resultado vazio e paginação.
  Respostas atrasadas são descartadas após limpeza, nova consulta ou troca de sessão.
- As conversas mantêm a simulação existente; sua integração não faz parte deste pedido.

## Validação

| Data | Verificação e escopo | Resultado e limite |
| --- | --- | --- |
| 2026-10-07 | `npm run lint`, `npm run test` e `npm run build` em frontend via RTK | Tipos e build aprovados; 99 testes passaram. Build avisou sobre chunk acima de 500 kB. |
| 2026-10-07 | `python -m unittest discover -s tests -v` em backend, usando o ambiente virtual | 10 testes passaram. JWT e propriedade das fontes verificados com SQLite em memória; motor de pesquisa simulado. |
| 2026-10-07 | Navegador com frontend e API isolados, dados fictícios | Verificados bloqueio sem fontes, duas fontes selecionadas, arquivos/trechos, página 2 e resultado vazio; inspeção em largura móvel e desktop. Processos temporários encerrados. |
| 2026-10-08 | Tipos e testes do frontend antes dos commits | Tipos aprovados e 99 testes passaram no diretório de trabalho com busca e indexação. |
| 2026-10-08 | Testes isolados do backend antes dos commits | 10 testes passaram; SQLite em memória e motor de pesquisa simulado. |

## Pendências e próximo passo

Implementação concluída. A separação dos commits reserva os hunks de busca de
`api.ts` e `vite.config.ts` para `feat(busca): integrar pesquisa de arquivos ao
Elasticsearch`, e os hunks de indexação para o commit seguinte,
`feat(indexacao): integrar envio de documentos ao backend`.

Não houve execução contra Elasticsearch/Ollama reais.
Para essa verificação, iniciar os serviços do ambiente de desenvolvimento,
indexar um arquivo de teste em uma fonte da conta autenticada e consultar seu
conteúdo em `/busca`. Os commits foram autorizados; implantação não foi solicitada.
