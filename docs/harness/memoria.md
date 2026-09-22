# Memória de tarefas e decisões

## Quando registrar

Crie um registro para trabalho que exija retomada, atravesse sessões ou envolva
decisões, dependências e validações que seriam caras de reconstruir. Correções
triviais concluídas em uma sessão dispensam arquivo próprio.

Antes de criar, procure a tarefa no [índice](tarefas/README.md). Use um arquivo
por objetivo, nomeado `AAAA-MM-DD-assunto.md` em `tarefas/`, a partir do
[modelo de tarefa](modelos/tarefa.md). Ajuste os links relativos ao destino.

## Atualização e retomada

1. Ao retomar, leia o registro correspondente, confira o estado do Git e os
   arquivos afetados. Resultados antigos não comprovam o estado atual.
2. Atualize quando houver mudança de escopo, decisão relevante, validação,
   bloqueio ou encerramento de sessão com trabalho pendente. Não registre cada comando.
3. Mantenha o estado atual e um próximo passo executável. Substitua detalhes
   superados; conserve apenas marcos que expliquem decisões e evidências úteis.
4. Registre validações com data, escopo, resultado e limite. Use referências a
   arquivos, testes ou commits quando disponíveis, sem inventar identificadores.
5. Ao concluir, confira os critérios, registre a entrega e retire a tarefa da
   tabela de andamento. Preserve o arquivo no mesmo caminho para manter os links.

Estados: `em andamento`, `aguardando aprovação`, `bloqueada`, `concluída` ou
`cancelada`. Aguardar a aprovação de uma etapa planejada não é falha técnica.
Em bloqueios, indique a causa e a condição necessária para prosseguir.

Mantenha o registro curto: resumo, referências e pendências, sem transcrições,
logs extensos ou segredos. O índice contém apenas título, estado e link; detalhes
e próximo passo pertencem ao arquivo da tarefa. Atualize somente a tarefa afetada.

## Decisões duráveis

Se a decisão já pertence a PRODUCT, DESIGN ou outra fonte principal, registre-a
nessa fonte dentro do escopo autorizado e apenas referencie-a na tarefa.
Crie um arquivo em `decisoes/AAAA-MM-DD-assunto.md` usando o
[modelo de decisão](modelos/decisao.md) somente quando faltar uma fonte adequada
e a escolha precisar orientar trabalhos futuros. Não crie decisões para preencher pastas.

Uma proposta permanece `proposta` até haver aprovação; registre data e origem
da aprovação com evidência identificável, sem inventar links de conversa.
Uma decisão aceita que mudar deve ser marcada como `substituída`, com referência
à sucessora. As tarefas afetadas apontam para a decisão vigente.

## Autorização e manutenção

A criação deste procedimento foi aprovada na etapa 3 do harness em 10/09/2026.
Atualizar progresso, evidências e próximo passo dentro de um escopo já aprovado
faz parte de executar esse trabalho; não exige aprovar novamente cada registro.
Novas etapas ou alterações das regras/modelos do harness continuam sujeitas à
aprovação prevista no [AGENTS da raiz](../../AGENTS.md).
