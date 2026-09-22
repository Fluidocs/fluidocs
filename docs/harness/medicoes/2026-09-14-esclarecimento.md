# Avaliação inicial da checagem de suficiência

Data: 14/09/2026. Método: revisão manual de cenários pelo autor das instruções,
aplicando o [procedimento](../esclarecimento.md). Não é teste independente de modelo,
execução em sessão nova ou medição de redução de tokens. Não foram executadas as
mudanças de produto descritas nos exemplos.

Critérios: resolver informação disponível sem perguntar; identificar decisões que
mudam a solução; preservar autorização; separar ações dependentes e independentes;
evitar perguntas redundantes. A coluna “Aplicação” registra a decisão desta revisão.

| Cenário e contexto fornecido | Aplicação do procedimento | Avaliação |
| --- | --- | --- |
| “Melhore a busca”, sem prioridade anterior | Perguntar qual resultado priorizar: relevância, latência ou tela. Localizar o fluxo enquanto aguarda; não alterar ranking por suposição. | Identifica lacuna material. |
| “Melhore a busca”; conversa já definiu relevância e forneceu exemplos | Usar os exemplos para investigar ranking; não repetir pergunta sobre prioridade. | Reutiliza contexto. |
| “Excluir fonte retorna erro”, com rota identificável no projeto | Inspecionar chamada, contrato e erro disponível. Pedir reprodução somente se a investigação não fornecer evidência suficiente. | Não bloqueia investigação por formulário. |
| “Corrija link X para Y”, caminhos fornecidos | Conferir destino, editar e verificar link. | Não exige esclarecimento dispensável. |
| “Adicione grupos de acesso”, com decisão anterior de excluí-los e sem detalhamento | Explicar diferença de escopo e esclarecer intenção/modelagem antes da implementação; leitura independente pode continuar. | Protege contra ampliação inferida. |
| “Estou alterando o escopo: inclua grupos”, com comportamento e limites já definidos | Reconhecer decisão atual; executar o escopo autorizado, sem reconfirmar a mera existência de grupos. | Não transforma documento anterior em veto. |
| “Exclua fontes antigas”, sem definição de antigas nem alvo | Perguntar critério/alvo antes de excluir. Não tratar silêncio como resposta. Pode investigar como listar candidatas. | Mantém ação dependente suspensa. |
| Pedido definido, mas sem nome para função auxiliar | Seguir convenção local, sem perguntar ao usuário o nome. | Resolve decisão técnica reversível. |
| Etapa de harness já aprovada, seguida de “vamos implementar” | Implementar o escopo aprovado; não perguntar novamente se pode aplicar. | Distingue esclarecimento de aprovação. |

Resultado: as nove aplicações revisadas são coerentes com os critérios. Isso
verifica a consistência da orientação e seus exemplos, não prova que todo agente
terá o mesmo comportamento em execução. A instrução da raiz é curta; o procedimento
detalhado é consultado quando há ambiguidade. Nenhuma skill adicional foi criada.

Próxima avaliação possível, mediante aprovação: observar tarefas reais ou usar
sessão nova e registrar perguntas feitas, fonte que já continha a resposta,
decisões pendentes e retrabalho. Só então comparar custos com evidência disponível.
