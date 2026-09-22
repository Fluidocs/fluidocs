---
name: fluidocs-continuar-tarefa
description: Retomar uma tarefa do Fluidocs entre sessões ou preparar seu encerramento e passagem de contexto usando os registros do projeto. Use em pedidos de continuar trabalho anterior, preservar progresso ou encerrar tarefa com registro; dispense em alterações triviais sem contexto a recuperar.
---

# Continuidade de tarefas do Fluidocs

Skill local deste repositório. Os links abaixo são relativos a esta pasta.
A fonte das regras e estados é o [procedimento de memória](../../../docs/harness/memoria.md);
leia-o uma vez quando aplicar a skill. Não copie seus modelos para dentro da skill.

## Retomar

- Localize a tarefa no [índice](../../../docs/harness/tarefas/README.md). Se já houver
  um caminho explícito, abra diretamente o registro. Leia somente suas referências
  necessárias ao próximo passo; não carregue outros registros ou o diagnóstico inteiro.
- Confronte objetivo, restrições e próximo passo com a solicitação atual e o estado
  do Git/arquivos afetados. Resultados antigos permanecem datados, não são validação atual.
- Continue o escopo já autorizado. Se o próximo passo for uma etapa do harness ainda
  não aprovada, apresente a proposta antes de editar. Um registro não concede autorização.
- Se faltar registro, reconstrua somente a partir de evidências disponíveis e da
  conversa; marque lacunas. Pergunte apenas se a ambiguidade impedir escolher a tarefa
  ou a ação correta. Não invente aprovações, testes ou trabalho concluído.

## Encerrar ou preparar passagem

- Atualize o registro correspondente conforme o procedimento, com resultado,
  validações e limites, pendências e a primeira ação concreta de retomada.
- Diferencie encerramento da sessão de conclusão do objetivo. Marque concluída
  somente se os critérios forem atendidos; preserve estados de espera ou bloqueio.
- Se não houver registro e o trabalho justificar memória durável, use o
  [modelo existente](../../../docs/harness/modelos/tarefa.md). Ajuste os links ao destino.
- Atualize a linha da tarefa no índice e referencie decisões em sua fonte principal.
  Não crie um segundo relato das mesmas decisões, nem arquive tarefas do aplicativo.

## Verificação da passagem

Confira se outro agente consegue identificar objetivo, autorização, evidência de
conclusão e próximo passo sem depender de uma transcrição. Execute a verificação
documental indicada no [guia operacional](../../../docs/harness/operacao.md) para
os registros alterados. Reporte o estado real e um link para o registro atualizado.
Esta verificação não exige repetir testes da aplicação sem mudança relevante.
