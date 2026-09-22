# Unificar uso e histórico do RTK

- Estado: concluída
- Atualizado em: 2026-09-14
- Autorização: usuário aprovou unificar uso com “por favor!”; instalação dos perfis
  e alteração CurrentUser para RemoteSigned autorizadas nas permissões do ambiente.

## Objetivo e entrega

Permitir `rtk git status` e `rtk gain` no terminal do Fluidocs com o mesmo banco.
Criado `scripts/harness/rtk-profile.ps1`, integrado aos dois perfis pessoais da máquina.
O encaminhamento vale somente dentro do checkout; fora dele usa RTK nativo.
AGENTS e guia operacional documentam o uso curto, a exceção do agente sem perfil
e o fallback. Histórico anterior preservado; sem mudança de ACLs ou do executável.

## Verificação e limites

- Status filtrado e gain executados em PowerShell 7; subpasta frontend verificada.
- Windows PowerShell do usuário executou ambos após a alteração autorizada da política.
- Conta restrita do agente não herda essa política: usar PowerShell 7 com perfil.
- Fora da árvore do projeto, versão nativa retornada.
- `rtk npm run lint` em frontend, pelo PowerShell 7, terminou com retorno 0 e `ok`.
- Verificação documental: 108 links válidos em 15 documentos; diff sem erro.
- [Guia operacional](../operacao.md) contém ativação, reversão e limites.

## Continuidade

Não há instalação automática em outras máquinas. O usuário deve reabrir terminais
existentes para carregar os perfis. Mudanças deste ajuste aguardam eventual pedido
de commit; o commit anterior do harness não foi alterado e nenhum push foi realizado.
