# Orientações do backend

Complementa as [instruções da raiz](../AGENTS.md) para esta pasta.

## Localização

- [Entrada](src/backend/__init__.py) e [configuração](src/backend/config/__init__.py):
  inicialização e ciclo de vida da API.
- [Router](src/backend/api/routes/router.py): confirme rotas e prefixos aqui;
  acompanhe schemas, dependências e serviços relacionados à alteração.
- Domínio em `src/backend/domain`; tarefas assíncronas em `src/backend/workers`;
  persistência em `src/backend/api/models` e `src/backend/db`.
- Para integração com o painel, confronte o contrato com o
  [cliente HTTP](../frontend/src/services/api.ts), sem presumir compatibilidade.

## Comandos e validação

- Dependências e entrada estão em [pyproject.toml](pyproject.toml) e `uv.lock`.
  `rtk proxy uv run backend`, nesta pasta, inicia a API e depende dos serviços
  configurados; não é uma verificação isolada nem deve ser executado só para ler código.
- O [Compose da raiz](../docker-compose.yml) inclui o frontend; o
  [Compose local](docker-compose.yml) usa configuração relativa a esta pasta.
  Escolha explicitamente o contexto de execução antes de operar serviços.
- Antes de selecionar uma suíte, confirme sua existência: o [README](README.md)
  registra que em 10/09/2026 `backend/tests` estava ausente. Se continuar ausente,
  reporte a lacuna e selecione uma validação adequada ao comportamento alterado.
- Checagem de sintaxe não testa imports, persistência, isolamento ou serviços externos.
  `/health` não deve ser usado como prova de funcionamento da busca e do RAG.
- Mudanças em autenticação, fontes e pesquisa precisam verificar propriedade e
  isolamento do usuário; mudanças assíncronas precisam considerar API e worker.
- Em migrações, confira modelos e histórico Aerich. Valide em banco isolado;
  não use o banco de trabalho como ambiente descartável de teste.
