# Implantação do harness do Fluidocs

- Estado: concluída (implantação inicial e piloto)
- Atualizado em: 2026-09-11
- Referência de código: diagnóstico inicial sobre `09da11f`; alterações do harness
  ainda sem commit na última consulta. Reconfirmar Git ao retomar.

## Objetivo e critérios de conclusão

Reduzir custo por tarefa correta e preservar contexto importante entre sessões.

- [x] Diagnóstico com fontes, comandos, evidências e lacunas.
- [x] Entrada curta de contexto, instruções por área e índice.
- [x] Modelos de tarefa/decisão, procedimento de atualização e exemplo de retomada.
- [x] Procedimentos recorrentes e verificações definidos, aprovados e implementados.
- [x] Piloto das três situações e comparação de saída RTK, com limites documentados.

## Escopo e restrições aprovadas

Origem: conversa de implantação do harness, em 10/09/2026. O usuário aprovou
as etapas 1, 2 e 3 em sequência; para a etapa 3 respondeu “está sim, vamos seguir!”
à proposta de modelos, índice, atualizações por marcos e este registro inicial.

A regra de aprovação por etapa está no [AGENTS da raiz](../../../AGENTS.md).
A política de memória aprovada está no [procedimento](../memoria.md).
A etapa 4A foi aprovada em 10/09/2026 com “está sim, vamos seguir!” após proposta
de guia operacional, correções documentais, verificador local e investigação RTK.
Ajustes de configuração/permissões do RTK devem ser apresentados antes de aplicados.
Em 11/09/2026, o usuário aprovou o teste de `CLAUDE_CONFIG_DIR` apenas em processo
temporário (“sim! vamos fazer.”); depois autorizou a solução local para tornar RTK
funcional, sem alteração global de variáveis ou ACLs.
A etapa 4B foi aprovada em 11/09/2026 com “vamos lá então!” para uma skill de
retomada e encerramento. A etapa 5 foi aprovada com “certo, vamos avançar então!”
para o piloto de localização, retomada e passagem, sem novas sessões/agentes.
As lacunas funcionais da aplicação não foram autorizadas como correções nesta etapa.

## Estado atual e referências

| Etapa | Estado | Entrega / próximo tratamento |
| --- | --- | --- |
| 1. Diagnóstico | Concluída | [Evidências e lacunas H01–H10](../diagnostico.md). |
| 2. Entrada mínima | Concluída | AGENTS da raiz, backend e frontend; [índice](../README.md). Atende H01. |
| 3. Memória | Concluída | [Procedimento](../memoria.md), [modelo de tarefa](../modelos/tarefa.md), [modelo de decisão](../modelos/decisao.md), [tarefas em andamento](README.md) e este registro. |
| 4A. Comandos e verificações | Concluída | [Guia operacional](../operacao.md), verificador de links e correções H02/H06. H09 resolvida pela entrada local; RTK direto ainda depende do ambiente. |
| 4B. Skills | Concluída | [Skill de continuidade](../../../.github/skills/fluidocs-continuar-tarefa/SKILL.md), com roteamento no AGENTS e reutilização do procedimento de memória. |
| 5. Medição | Piloto concluído | [Resultados e limites](../medicoes/2026-09-11-piloto.md); sem medição de custo total ou avaliação independente. |

Não foi criado um registro separado de decisão: as escolhas aprovadas do harness
já têm fonte nas instruções e no procedimento. PRODUCT e DESIGN mantêm seu papel.

## Validação

| Data | Verificação e escopo | Resultado e limite |
| --- | --- | --- |
| 2026-09-11 | Etapa 5: piloto assistido, conferência dos totais JSON, 106 links em 14 documentos e diff | Totais e retornos conferidos; links válidos e diff sem erro. Qualidade avaliada pelo mesmo agente, sem prova de economia total. |
| 2026-09-11 | Etapa 4B: estrutura da skill, 4 links próprios, 98 links do harness e diff | Links válidos; revisão manual de nome, descrição, escopo e referências. Validador oficial tentado, não executou por ausência de PyYAML; ambiente backend também indisponível por permissão. Sem instalação de dependências ou validação de descoberta automática no aplicativo. |
| 2026-09-10 | Etapa 1: frontend, sintaxe Python e consultas locais | Resultados e limites no diagnóstico; não representam validação ponta a ponta. |
| 2026-09-10 | Etapa 2: 31 links locais e `git diff --check` | Links válidos e diff sem erro de whitespace; nenhuma suíte funcional repetida. |
| 2026-09-10 | Etapa 3: 64 links locais em 8 documentos, estrutura dos registros e `git diff --check` | Links válidos; critérios, aprovação e próximo passo presentes; diff sem erro de whitespace. Alterações apenas documentais, sem testes da aplicação. |
| 2026-09-10 | Etapa 4A: verificador em 13 documentos/91 links; 3 cenários temporários; `git diff --check` | Zero links ausentes; saída 0 em caso válido e 1 para link quebrado/arquivo ausente. Incluídos espaços, URL codificada, URLs externas, fragmentos e bloco de código. Sem testes da aplicação. |

## Pendências e próximo passo

Teste temporário concluído em 11/09/2026: comando Git original retornou 1;
com `CLAUDE_CONFIG_DIR` no processo filho retornou 0. `rtk gain` continuou retornando
1 por acesso negado. Variável do processo pai preservada. Evidências no
[guia operacional](../operacao.md); nenhuma alteração persistente ou de permissões.

Em seguida, o usuário autorizou deixar o RTK funcional. Foi implementada a entrada
`scripts/harness/rtk.py`, com configuração por processo, banco local ignorado e
telemetria desabilitada. Status filtrado e histórico local funcionaram; erro Git
manteve código 128 e mensagem. O histórico global também abriu com acesso autorizado.
H09 resolvida para a entrada local; RTK direto permanece dependente do ambiente.
Resultados quantitativos e comandos atuais estão no guia operacional.

Implantação inicial e piloto encerrados. Saída de quatro comandos: 6870 bytes
diretos contra 6444 filtrados, redução de 6,20%. Registro de retomada foi reconciliado
após detectar estado RTK desatualizado. Evidências completas no relatório do piloto.

Próxima ação possível: propor avaliação em sessão nova ou tratar a validação oficial
da skill e sua descoberta no aplicativo. Requer aprovação antes de iniciar novo escopo.

Ainda não existe medição
confiável de economia total de tokens. As demais lacunas do diagnóstico
continuam como evidências históricas a reconfirmar quando forem tratadas.
