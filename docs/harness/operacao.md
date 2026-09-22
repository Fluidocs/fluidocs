# Operação do harness

Este documento descreve como operar o harness do Fluidocs no estado atual.
Evidências, investigações anteriores e estados intermediários permanecem registradas
ao final deste documento como histórico e não devem ser tratadas como orientação atual.

## Princípios

- Use a menor verificação que cubra a alteração.
- Não instale dependências, inicie serviços ou aplique migrações apenas para ler contexto.
- Prefira saída filtrada quando ela preservar a informação necessária.
- Consulte a saída integral quando o filtro omitir detalhes úteis para a investigação.
- Não confunda caracteres com contagem exata de tokens.
- A economia reportada pelo RTK representa redução estimada da saída processada e
  não o consumo total de tokens do chat ou da tarefa.

## Uso atual unificado do RTK

Em PowerShell 7 ou Windows PowerShell com perfil pessoal carregado, dentro do
Fluidocs ou de suas subpastas:

```powershell
rtk git status
```

Para consultar estatísticas quando necessário:

```powershell
rtk gain --history
```

O [perfil local](../../scripts/harness/rtk-profile.ps1) define uma função `rtk`
que chama o executor do projeto.

Fora desta árvore, a função encaminha para o executável RTK normal. O executável
RTK não foi substituído.

Dentro do projeto, filtros e `gain` usam o mesmo banco local:

```text
.harness-local/rtk/history.db
```

O histórico global anterior foi preservado e não é mesclado com o histórico local.

### Integração do perfil no Windows

Nesta máquina, a integração foi adicionada aos perfis `CurrentUserAllHosts` do
Windows PowerShell e do PowerShell em `Documents`, preservando arquivos existentes
com backup quando aplicável.

A política do Windows PowerShell para o usuário foi alterada, com autorização,
para `RemoteSigned`. Essa política permite scripts locais para esse usuário e não
se limita a este projeto.

Políticas de máquina ou organização e ACLs não foram alteradas.

Terminais já abertos precisam ser reabertos ou carregar:

```powershell
. $PROFILE.CurrentUserAllHosts
```

Confira:

```powershell
Get-Command rtk
```

Dentro de um terminal com a integração ativa, o comando deve indicar `Function`.

Após mover ou remover o checkout, atualize ou remova o bloco delimitado por
`BEGIN/END Fluidocs RTK` nos perfis.

Outra máquina precisa instalar a integração localmente; versionar o script não
instala os perfis automaticamente.

Para desfazer a integração:

1. remova somente o bloco `BEGIN/END Fluidocs RTK`;
2. abra um novo terminal;
3. se também quiser reverter a política autorizada, o valor anterior de
   `CurrentUser` era `Undefined`.

Não apague históricos para desfazer a integração.

## Processos do agente sem perfil

A sessão do agente foi verificada e não carrega o perfil PowerShell por padrão.

Use:

```powershell
rtk proxy pwsh -Command 'rtk git status'
```

Para estatísticas, somente quando necessário:

```powershell
rtk proxy pwsh -Command 'rtk gain --history'
```

O proxy externo apenas inicia o PowerShell. A filtragem e o histórico pertencem
ao RTK executado dentro dele.

Passe comandos fixos com quoting adequado e nunca interpole de forma insegura
entrada externa.

Não altere a política da conta restrita. O PowerShell 7 foi validado nesse ambiente.

### Validação atual

Validado em 14/09/2026:

- PowerShell 7 restrito retornou o histórico local;
- Windows PowerShell do usuário retornou o histórico local;
- `status` funcionou também em `frontend`;
- fora do projeto, `rtk --version` retornou a versão nativa;
- nenhuma estatística global foi mesclada.

A economia depende do comando e representa saída estimada, não consumo total do chat.

## Fallback: executor local

Sem integração do perfil, na raiz use a
[entrada local](../../scripts/harness/rtk.py):

```powershell
rtk proxy python scripts/harness/rtk.py git status
```

Para estatísticas:

```powershell
rtk proxy python scripts/harness/rtk.py gain --history
```

O proxy externo atende à convenção de prefixo; o RTK interno filtra e registra.

Os argumentos após o script são comandos RTK normais.

Para trabalhar em outra pasta, use o caminho absoluto do script, preservando o
diretório de trabalho desejado.

Requer Python e RTK no `PATH`.

A entrada preserva os códigos de retorno.

### Comportamento do executor local

A entrada:

- define `CLAUDE_CONFIG_DIR` somente no processo filho quando a variável estiver ausente;
- usa `RTK_DB_PATH` em `.harness-local/rtk/history.db`;
- direciona arquivos de diagnóstico para o mesmo diretório local;
- desabilita telemetria no processo;
- não altera variáveis globais;
- não altera configurações pessoais;
- não altera ACLs;
- não altera o histórico global existente.

`.harness-local/` está ignorado pelo Git.

Não copie logs desse diretório para documentação.

Embora `gain` possa exibir `Global Scope`, por essa entrada ele consulta o banco
local. Registros anteriores não são mesclados nem apagados.

## Quando usar saída integral

Use `rtk proxy` direto quando precisar da saída original de uma ferramenta e não
houver filtro adequado.

Exemplo:

```powershell
rtk proxy git status --short
```

Proxy direto preserva a saída integral e não deve ser contabilizado como filtragem.

Se um filtro omitir detalhe útil, consulte a saída integral antes de concluir.

## Métricas do RTK

`rtk gain` é ferramenta de observabilidade, não uma etapa obrigatória da execução.

Use-a somente quando precisar medir ou diagnosticar o uso do RTK:

```powershell
rtk gain --history
```

Não execute métricas rotineiramente durante tarefas comuns apenas para registrar
economia.

Resultados anteriores demonstraram que nem todo comando ganha com filtro.

## Documentação do harness

Na raiz, com Python disponível e sem dependências adicionais:

```powershell
rtk proxy python scripts/harness/check_links.py
rtk proxy git diff --check
```

O [verificador](../../scripts/harness/check_links.py) cobre:

- AGENTS da raiz e das áreas;
- READMEs da raiz e do backend;
- todos os Markdown em `docs/harness`.

Retorna:

- `0` quando os destinos locais existem;
- `1` em links quebrados ou falhas de leitura.

Aceita arquivos específicos como argumentos. Sem argumentos, independe do
diretório atual.

O verificador cobre:

- links e imagens inline;
- caminhos com espaços entre `< >`;
- caminhos codificados.

Ele ignora:

- URLs externas;
- fragmentos sem caminho;
- exemplos dentro de blocos de código;
- código inline.

Ele não valida:

- âncoras;
- links por referência;
- HTML;
- conteúdo semântico;
- disponibilidade de URLs externas.

Use links inline relativos nesses documentos. Outros formatos exigem inspeção manual.

`git diff --check` não cobre arquivos ainda não rastreados; revise também arquivos novos.

## Frontend

Os comandos e a seleção por tipo de mudança estão no
[AGENTS frontend](../../frontend/AGENTS.md).

Execute-os em `frontend`, com dependências instaladas conforme `package-lock.json`.

Não confunda:

- `lint` com lint geral de estilo quando o script executa apenas TypeScript;
- testes simulados com integração real.

Resultados iniciais registrados no [diagnóstico](diagnostico.md) não garantem que
uma alteração posterior continue passando.

Não é necessário reler o diagnóstico para executar as verificações atuais.

## Backend e serviços

Consulte o [AGENTS backend](../../backend/AGENTS.md) e o
[README backend](../../backend/README.md).

A ausência de `backend/tests` foi reconfirmada em 10/09/2026: não havia suíte
backend certificada por essa etapa.

Mudanças de comportamento precisam de validação pertinente.

Parse de sintaxe e `/health` não substituem testes de:

- autenticação;
- persistência;
- RAG;
- outros comportamentos afetados.

Para consultar o ambiente existente, na raiz:

```powershell
rtk proxy docker compose config --quiet
rtk proxy docker compose ps --all
```

Esses comandos exigem configuração e acesso ao Docker.

`config --quiet` evita imprimir configuração expandida com segredos.

Falhas de permissão não significam, por si só, falha da aplicação.

Siga o mecanismo de aprovação do ambiente quando necessário.

Início de serviços, instalação de dependências e migrações dependem do contexto
escolhido, na raiz ou no backend, e não devem ser executados apenas para obter contexto.

---

# Histórico e evidências

As seções abaixo preservam a investigação anterior para auditoria e diagnóstico.
Elas não substituem as orientações atuais acima.

## Resultados anteriores do executor local — 11/09/2026

Evidências observadas:

- `status`: 565 caracteres diretos contra 200 filtrados, redução de 64,6%;
- `log --oneline` e busca testada: redução de 0%; nem todo comando ganha com filtro;
- referência Git ausente: código `128` e mensagem de erro preservados;
- histórico local: 3 comandos, 188 tokens de entrada e 94 de saída, economia
  estimada de 50% pelo RTK nessa amostra;
- o histórico global abriu com acesso autorizado: 24 comandos e economia
  registrada zero;
- nenhuma necessidade de mudar ACLs foi demonstrada.

Essas métricas não medem o custo total do chat.

H09 ficou resolvida para execução e histórico pela entrada local. O RTK direto
no ambiente original ainda podia falhar.

## Investigação RTK — 10/09/2026

| Consulta | Resultado observado |
| --- | --- |
| `rtk --help` / `rtk config --help` | A CLI respondeu; `config --create` escreveria configuração e não foi executado. |
| `rtk git status --short` | Falha ao resolver diretório de configuração; a mensagem sugeriu `CLAUDE_CONFIG_DIR` ou `HOME`. |
| `rtk gain` | Acesso negado ao arquivo de histórico em `AppData/Local/rtk/history.db` no ambiente restrito. |
| `rtk proxy git status --short` | Funcionou e manteve a saída sem filtro. |

Naquele momento, H09 permaneceu aberta.

Os sintomas eram distintos e não havia evidência suficiente para prescrever
alteração global de permissões.

Nenhuma variável, configuração ou permissão foi modificada.

A proposta seguinte era verificar os diretórios adequados e testar a resolução
da configuração em um processo isolado, com aprovação antes de aplicar ajustes.

Não habilitar telemetria nem executar inicialização automática.

Mesmo com histórico acessível, economia de saída do RTK não mede o custo total da tarefa.

## Teste temporário aprovado — 11/09/2026

No ambiente consultado:

- `USERPROFILE` estava definido;
- `HOME` estava ausente;
- `CLAUDE_CONFIG_DIR` estava ausente;
- `C:/Users/dev02/.claude` existia.

Sem ler o conteúdo desse diretório, ele foi usado como valor de
`CLAUDE_CONFIG_DIR` exclusivamente no ambiente de processos filhos, via cópia do
ambiente em Python/subprocess.

| Teste | Resultado |
| --- | --- |
| `rtk git status --short`, ambiente original | Retorno 1: diretório de configuração não resolvido. |
| Mesmo comando, variável no processo filho | Retorno 0: status retornado corretamente. |
| `rtk gain`, mesma variável temporária | Retorno 1: acesso negado ao histórico continuou. |

A variável do processo pai permaneceu inalterada.

Não houve:

- gravação de variável persistente;
- mudança de permissões;
- execução de `rtk config --create`;
- execução de `rtk init`.

O teste confirmou a solução da resolução de diretório para esse comando e nesse
ambiente, mas não certificou todos os filtros nem o histórico.

Naquele ponto, H09 permaneceu parcialmente resolvida: adoção do ajuste e acesso
ao histórico ainda exigiam tratamento aprovado.
