# Orientações do frontend

Complementa as [instruções da raiz](../AGENTS.md) para esta pasta.

## Localização e contratos

- [App.tsx](src/App.tsx) registra as rotas; páginas ficam em `src/pages`,
  componentes em `src/components`, estado em `src/store` e cliente HTTP em
  [api.ts](src/services/api.ts).

- Ao integrar funcionalidades, confronte o cliente com o
  [router backend](../backend/src/backend/api/routes/router.py) e seus schemas.
  Não presuma compatibilidade entre mocks do frontend e a API real; reconfirme
  os contratos afetados.

- Testes com respostas simuladas não comprovam compatibilidade com a API real.

- Para escopo de produto e design, siga as fontes indicadas na raiz. Referências
  existentes a grupos e equipes não autorizam ampliar a modelagem aprovada.

- Em trabalho visual, consulte a
  [skill Impeccable](../.github/skills/impeccable/SKILL.md) conforme seu escopo.
  Sua presença e a de hooks não comprovam ativação pelo host.

## Navegação e contexto

Para localizar implementações, dependências ou fluxos que envolvam múltiplos
arquivos, siga primeiro a estratégia de descoberta definida no AGENTS da raiz.

Evite buscas recursivas amplas ou leitura de vários arquivos por precaução.
Quando os arquivos relevantes já forem conhecidos, leia diretamente apenas o
contexto necessário.

## Comandos e validação

Execute nesta pasta, conforme [package.json](package.json):

| Comando no Windows | O que verifica ou executa |
| --- | --- |
| `rtk npm run lint` | Tipos com `tsc --noEmit`; não é lint geral de estilo. |
| `rtk npm run test` | Testes Vitest existentes. |
| `rtk npm run build` | Build de produção pelo Vite. |
| `rtk proxy npm.cmd run dev` | Servidor de desenvolvimento na porta 3000; não é teste. |

Os comandos curtos pressupõem o perfil RTK configurado. No executor do agente
sem perfil, envolva o comando conforme o AGENTS da raiz. Em outros sistemas,
use `npm` em lugar de `npm.cmd` no comando de desenvolvimento.

Para mudanças de lógica ou contrato, valide tipos e testes pertinentes. Para
mudanças de empacotamento ou assets, valide o build. Alterações visuais também
exigem inspeção da superfície afetada.

Informe limitações quando não puder executar a verificação necessária.