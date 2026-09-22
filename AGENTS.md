# Orientações do Fluidocs

## Comece pelo escopo

- Identifique o objetivo, a área afetada e a evidência necessária para concluir.

- Antes de implementar, cheque resultado, escopo, restrições e critério de
  conclusão. Resolva lacunas pela conversa e por consulta direcionada; pergunte
  apenas quando a resposta mudar materialmente a solução. Continue trabalho
  independente enquanto aguarda, sem tratar silêncio como aprovação.

  Consulte o
  [procedimento de esclarecimento](docs/harness/esclarecimento.md)
  quando houver ambiguidade; não repita perguntas respondidas nem bloqueie por
  preferências opcionais.

- Leia as instruções da área ao trabalhar em
  [backend](backend/AGENTS.md) ou
  [frontend](frontend/AGENTS.md), inclusive em tarefas iniciadas na raiz.

- Consulte o [índice de contexto](docs/harness/README.md) quando precisar
  localizar um assunto; abra apenas os documentos e trechos relevantes para a
  tarefa.

- Para descobrir arquitetura, dependências, chamadas, fluxos ou impacto entre
  módulos, consulte primeiro o
  [Graphify](docs/harness/graphify.md) e use o resultado para limitar o conjunto
  de arquivos que precisa ser lido.

- Para localizar texto, símbolos ou ocorrências específicas quando o alvo já
  estiver razoavelmente conhecido, prefira buscas direcionadas com `rg`.

- Não leia arquivos por precaução. Amplie a exploração somente quando a
  evidência atual for insuficiente.

- O grafo auxilia descoberta e seleção de contexto; código e configuração
  continuam sendo a autoridade para confirmar a implementação atual. Se o grafo
  parecer incompleto ou divergir do checkout, confirme no código e siga o
  procedimento de atualização descrito no guia do Graphify.

- Para trabalho com retomadas, localize o registro no
  [índice de tarefas](docs/harness/tarefas/README.md) e siga o
  [procedimento de memória](docs/harness/memoria.md); tarefas triviais dispensam
  registro.

- Ao retomar trabalho entre sessões ou preparar passagem ou encerramento com
  registro, use a
  [skill de continuidade](.github/skills/fluidocs-continuar-tarefa/SKILL.md).

## Fontes e evidências

- [PRODUCT.md](PRODUCT.md) registra escopo e decisões de produto. Consulte-o ao
  alterar regras, capacidades ou textos que façam afirmações sobre o produto.

- [DESIGN.md](DESIGN.md) orienta a página Início; consulte-o em mudanças nessa
  superfície. Não estenda seu alcance ao painel por inferência.

- Código e configuração demonstram implementação; execução e testes demonstram
  somente o comportamento efetivamente verificado. Objetivos não provam entrega.

- Diante de divergência, preserve a decisão aprovada como intenção e descreva a
  diferença encontrada no código. Não transforme código legado em novo requisito.

- Confirme caminhos, símbolos e comandos antes de utilizá-los. Marque hipóteses
  e pontos não verificados; associe conclusões relevantes às suas fontes.

- Mantenha uma fonte principal por assunto e use links em vez de copiar conteúdo.

## Execução e conclusão

- Confira o estado do Git antes de editar e preserve alterações preexistentes.

- Use comandos filtrados como `rtk git status` quando houver filtro apropriado.

  No executor do agente sem perfil, use:

  ```powershell
  rtk proxy pwsh -Command 'rtk git status'
  ```

  Substitua o comando interno conforme necessário.

  O perfil encaminha para o histórico local dentro do Fluidocs. Veja o
  [guia operacional](docs/harness/operacao.md) para configuração e fallback.

  Reserve proxy direto para situações em que a saída integral seja necessária;
  não o conte como filtragem.

- Consulte `rtk gain` somente quando precisar medir ou diagnosticar o uso do RTK;
  não o execute rotineiramente durante tarefas comuns.

- Limite saídas ao necessário; amplie logs somente quando isso ajudar a
  investigar falhas.

- Escolha verificações conforme a área e o comportamento alterado. Informe o que
  foi executado, seu resultado e os limites; não apresente testes ausentes como
  sucesso.

- Em mudanças apenas documentais, confira links, coerência e diff; não execute
  novamente toda a suíte da aplicação sem motivo relacionado à mudança.

- Use exemplos fictícios e não registre valores de `.env`, tokens ou chaves reais.

- Ao concluir, indique o resultado, as verificações e as pendências relevantes.

## Aprovação das etapas do harness

- Para criar ou alterar instruções de agentes, skills, procedimentos e documentos
  do harness, apresente a proposta e aguarde aprovação explícita antes de editar.

- A aprovação vale para o escopo apresentado: implemente e verifique a etapa sem
  pedir a mesma autorização novamente. Discuta a seguinte antes de aplicá-la.

- Esta regra se limita à manutenção do harness; não exige confirmação adicional
  para tarefas comuns do produto já autorizadas pelo usuário.

- O diagnóstico é um registro histórico sob demanda; não o carregue integralmente
  em toda tarefa e não reescreva observações antigas como se fossem atuais.
