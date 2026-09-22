# Busca e conversas em demonstração local

- Estado: concluída
- Atualizado em: 2026-09-17
- Referência de código: branch `feature/TSK017/refatorar-front-end`; alterações sem commit.

## Objetivo e critérios de conclusão

Implementar o módulo de consumo descrito em [PRODUCT.md](../../../PRODUCT.md),
com seleção de fontes, busca e conversas com evidências, seguindo a identidade
do painel existente.

## Escopo e restrições aprovadas

O usuário confirmou nesta tarefa a demonstração local completa, com textos e
respostas fictícios identificados na interface, sem integração com o backend.
Os cadastros e históricos ficam no navegador, separados por conta de demonstração.
O destino atual após login foi preservado; acesso pelo menu Trocar módulo.

## Estado atual e referências

- [Busca](../../../frontend/src/pages/Busca.tsx): seleção obrigatória de fontes,
  resultados restritos às fontes escolhidas, trechos expansíveis e estado sem resultados.
- [Conversas](../../../frontend/src/pages/Conversas.tsx): histórico, nova conversa,
  renomeação, exclusão com confirmação e fontes fixas desde a primeira mensagem.
- [Estado local](../../../frontend/src/store/useConsumoStore.ts): persistência por
  conta, validação de dados restaurados e preservação do estado em falha de escrita.
- [Simulação](../../../frontend/src/services/consumoDemo.ts): respostas extraídas
  de textos fictícios, com referências somente aos trechos efetivamente usados.
- [Layout](../../../frontend/src/components/LayoutConsumo.tsx): navegação própria,
  temas e componentes compartilhados com gerenciamento. `/assistente` redireciona
  para `/conversas`.

## Validação

| Data | Verificação e escopo | Resultado e limite |
| --- | --- | --- |
| 2026-09-17 | Tipos, testes e build em frontend | 28 testes passaram; tipos e produção aprovados. Sem comprovação de integração com API. |
| 2026-09-17 | Navegador local | Verificados fonte obrigatória, busca com/sem resultado, trechos, criação, renomeação, continuidade sem evidência, cancelamento da exclusão, restauração após novo login e isolamento de outra conta. Exclusão definitiva e fonte removida cobertas nos testes de estado. |
| 2026-09-17 | Revisão visual Impeccable | Desktop claro e celular escuro; detector sem achados. Revisor pediu indicador móvel de expansão; correção julgada resolvida, disposition ship. Conferência documental preservou sistema existente. |

## Pendências e próximo passo

Entrega local concluída. Integração com arquivos, mecanismo de busca e modelo de IA
permanece fora do escopo aprovado. Dados fictícios de validação estão apenas na
conta `qa-consumo@example.com` deste navegador. A alteração preexistente em
`Inicio.tsx` foi preservada. Próximo passo, se solicitado: revisar o diff e preparar
commit; nenhuma autorização de commit foi inferida.
