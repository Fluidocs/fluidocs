# Checagem de suficiência do pedido

Antes de implementar, verifique internamente se resultado esperado, escopo,
restrições relevantes e evidência de conclusão permitem escolher uma ação útil.
Não transforme esses quatro pontos em um formulário obrigatório para o usuário.

## Resolver a lacuna com o menor custo

Use primeiro o pedido e as decisões já disponíveis na conversa. Consulte a fonte
relevante no repositório quando ela puder resolver a dúvida: produto para escopo,
código/contratos para comportamento existente, configuração para comandos.
Não percorra toda a documentação nem prolongue investigação para evitar perguntar
uma preferência que somente o usuário pode decidir.

| Situação | Conduta |
| --- | --- |
| Resposta já dada ou disponível em fonte pertinente | Recuperar a informação e seguir, sem perguntar novamente. |
| Convenção local clara, escolha técnica reversível | Aplicar a convenção dentro do escopo autorizado. |
| Detalhe de baixo impacto sem convenção | Adotar opção razoável; explicitar a suposição quando ela afetar a expectativa do usuário. |
| Interpretações que mudam comportamento, aceite ou trabalho substancial | Perguntar a decisão que distingue essas interpretações antes de implementar a parte dependente. |
| Incerteza sobre perda de dados, quebra de contrato ou ampliação de escopo | Resolver a dúvida antes da ação afetada; não inferir autorização. |
| Pedido explícito já resolve a decisão | Seguir o pedido respeitando as permissões; não exigir confirmação redundante. |

“Materialmente” significa que a resposta altera a solução, sua compatibilidade,
o risco de retrabalho ou a forma de verificar o resultado. Não exige estimativa
numérica de tokens. Considere o custo da pergunta e da investigação também.

## Fazer uma pergunta útil

Pergunte a menor decisão ainda necessária, em linguagem de produto. Diga por que
ela importa e, se útil, apresente poucas opções com consequências e recomendação.
Evite questionários extensos e decisões técnicas que o próprio código resolve.
Agrupe dúvidas relacionadas; não imponha um limite artificial que esconda uma
decisão indispensável. Use o mecanismo de pergunta disponível no ambiente.

Enquanto aguarda, avance apenas em investigação ou trabalho independente da
resposta. Preferência opcional não bloqueia a tarefa; dê oportunidade de resposta
e explicite a suposição adotada. Resposta necessária permanece pendente: silêncio,
tempo decorrido e ausência de objeção não são aprovação. Não implemente uma opção
dependente sob a justificativa de que poderá desfazê-la depois.

Esclarecimento resolve informação; aprovação autoriza ação. Respeite a aprovação
por etapa do harness, mas não peça duas confirmações se o usuário já forneceu
decisão e autorização suficientes. Atualização explícita do usuário pode substituir
decisão anterior: não trate PRODUCT como impedimento absoluto para mudanças aprovadas.

## Exemplos do Fluidocs

- “Melhore a busca”: consultar contexto pertinente; se não houver prioridade,
  perguntar se o objetivo é relevância, latência ou experiência da tela.
- “O botão excluir fonte retorna erro”: começar pela investigação do fluxo e
  contrato; perguntar reprodução/evidência apenas se ainda faltar para localizar o erro.
- “Adicione grupos de acesso”: confrontar com PRODUCT; se o pedido não esclarecer
  a mudança de modelagem, perguntar se o usuário está revisando esse limite e qual
  comportamento precisa. Se ele já aprovou isso, não repetir a pergunta de escopo.
- “Corrija o link X para Y”: conferir e editar, sem exigir critérios adicionais.

## Memória e acompanhamento

Em tarefas que já precisam de registro, use a seção opcional “Questões e suposições
relevantes” do [modelo](modelos/tarefa.md). Guarde a decisão pendente, o trabalho
afetado e a resposta com origem/data ou a suposição reversível. Substitua pendências
resolvidas por um resumo e links às fontes principais; não transcreva perguntas.
Tarefas triviais continuam dispensando registro.

Avaliação inicial: [cenários e limites](medicoes/2026-09-14-esclarecimento.md).
Revisões futuras devem observar perguntas úteis, perguntas redundantes e retrabalho
evitado ou provocado. Esta regra orienta comportamento, não garante ausência de erros
nem mede economia total de tokens.
