# Fluidocs

<!-- impeccable:product-schema 1 -->

Contexto de produto confirmado pelo responsável pelo projeto em 9 de setembro de 2026, atualizado em 15 de setembro de 2026 com a separação dos módulos do frontend e seus comportamentos esperados. As decisões abaixo orientam trabalhos futuros; capacidades definidas como objetivos não devem ser apresentadas como já entregues sem verificar a implementação.

## Platform

web

## Users

O público principal são desenvolvedores e equipes técnicas que precisam integrar busca inteligente e geração de respostas com recuperação de documentos (RAG) em seus próprios sistemas.

Esses usuários precisam preparar bases documentais, configurar o acesso às integrações, consultar a API e acompanhar a utilização do produto. O painel atende ao gerenciamento e à utilização dessas capacidades.

## Product Purpose

Oferecer uma API para indexação, busca híbrida e respostas RAG sobre bases documentais. A API é o núcleo do Fluidocs; o frontend React oferece módulos separados para gerenciamento dos recursos da conta e consumo gráfico de busca e RAG.

O produto deve permitir que uma equipe técnica organize documentos em fontes de dados e integre consultas e respostas fundamentadas a outros sistemas. O sucesso depende da integração pela API, da recuperação de informações relevantes e da rastreabilidade das fontes utilizadas nas respostas. Não há metas quantitativas confirmadas.

## Positioning

O Fluidocs oferece busca documental e RAG como capacidades integráveis por desenvolvedores. O painel dá suporte a essa integração com gerenciamento de fontes de dados, API Keys, conversas e configurações.

Seu mecanismo combina busca lexical BM25 e busca vetorial k-NN no Elasticsearch, com modelos executados localmente pelo Ollama. Não há evidência fornecida para alegações de exclusividade, superioridade ou desempenho frente a outros produtos.

## Operating Context

- Uma equipe técnica integra a API do Fluidocs a um sistema próprio.
- O usuário organiza e envia documentos associados a fontes de dados.
- A indexação ocorre de maneira assíncrona, em segundo plano.
- A consulta híbrida recupera conteúdo por correspondência lexical e proximidade vetorial.
- O fluxo RAG usa os documentos recuperados para fundamentar respostas e permitir rastrear suas fontes.
- No módulo de gerenciamento, a conta autenticada administra suas chaves de API e fontes de dados.
- Em um módulo separado, a conta autenticada seleciona fontes para pesquisar documentos ou conversar com o agente via interface gráfica, sem precisar fazer chamadas manuais aos endpoints.

O repositório tem um ambiente de desenvolvimento com Docker Compose. Isso é evidência técnica do ambiente atual, não uma decisão sobre hospedagem ou distribuição em produção. A execução local dos modelos pelo Ollama está confirmada; uma exigência de operação totalmente offline não foi estabelecida.

## Capabilities and Constraints

### Objetivos funcionais confirmados

- API para integração por desenvolvedores.
- Indexação e organização de documentos em fontes de dados.
- Busca híbrida combinando BM25 e busca vetorial k-NN.
- Respostas via RAG fundamentadas nos documentos recuperados, com rastreabilidade das fontes.
- Autenticação de usuários e API Keys para integrações externas.
- Frontend React com separação funcional e de navegação entre gerenciamento e consumo; a API permanece como núcleo do produto.
- Processamento assíncrono de indexações.

### Comportamento esperado dos módulos do frontend

As definições desta seção foram confirmadas em 15 de setembro de 2026. São requisitos de produto, não uma declaração de funcionalidades já implementadas.

| Módulo | Responsabilidade | Funcionalidades esperadas |
| --- | --- | --- |
| Gerenciamento | Configurar os recursos da conta autenticada | CRUD de chaves de API e CRUD de fontes de dados vinculadas à conta que realizou o login. |
| Busca e conversas | Consumir graficamente as capacidades de busca e RAG | Seleção de fontes de dados, pesquisa de documentos e criação, renomeação e exclusão de conversas. |

**Os dois módulos devem permanecer separados funcionalmente e na navegação.** A administração de chaves e fontes não deve ser misturada às telas de pesquisa e conversa. Selecionar fontes para consultar pertence ao módulo de consumo; criar e administrar essas fontes pertence ao módulo de gerenciamento. Essa separação não exige, por si só, aplicações, repositórios ou implantações independentes.

Após o login, o usuário deve poder escolher entre utilizar visualmente a API no módulo de busca e conversas ou acessar seu painel de configuração no módulo de gerenciamento. Ambos ficam acessíveis à mesma conta autenticada, mantendo a separação entre configuração e consumo. Esta decisão não fixa uma tela inicial ou um redirecionamento padrão.

Uma **fonte de dados** é a representação nomeada de um conjunto de informações organizado pelo usuário e vinculado à sua conta. Por exemplo, para indexar arquivos de recursos humanos, o usuário cria uma fonte “RH” e associa esses conteúdos a ela. A seleção de fontes delimita o conteúdo consultado, favorecendo buscas mais precisas e reduzindo a mistura de assuntos para mitigar alucinações; não constitui garantia de sua eliminação.

- **Busca:** o usuário informa a consulta e deve selecionar ao menos uma fonte de dados antes de pesquisar. Não deve ser possível executar buscas sem fontes selecionadas. A pesquisa no Elasticsearch deve retornar os documentos mais relacionados à consulta dentro das fontes selecionadas.
- **Conversas:** o usuário deve selecionar ao menos uma fonte de dados antes de iniciar uma conversa; não deve ser possível iniciá-la sem fontes selecionadas. A seleção define as fontes usadas para recuperar contexto no RAG e fica fixa após o início da conversa. Para consultar outras fontes, o usuário deve criar outra conversa. Deve poder criar uma nova conversa, renomear uma existente e excluir uma existente, vinculadas à sua conta.
- **Resposta do RAG:** a interface deve apresentar a resposta do agente acompanhada dos arquivos dos quais foram extraídas as informações, identificando sua origem. Esses arquivos devem corresponder às evidências usadas na resposta, não apenas a sugestões de documentos relacionados.

### Decisões arquiteturais confirmadas

| Componente | Decisão |
| --- | --- |
| Backend | FastAPI |
| Frontend | React |
| Persistência relacional | PostgreSQL |
| Indexação e busca | Elasticsearch |
| Execução dos modelos | Ollama, com execução local |
| Isolamento documental | Um índice Elasticsearch por usuário |
| Abstração apresentada ao usuário | Fontes de dados |
| Credenciais de integração | API Keys associadas ao usuário e tratadas como segredos |
| Indexação | Assíncrona / background |

Celery e Redis são os componentes encontrados no código para o processamento assíncrono. Essa observação descreve a implementação existente; não amplia as decisões arquiteturais expressamente confirmadas.

### Terminologia e limites de modelagem

- Usar **fontes de dados** como conceito de gerenciamento apresentado ao usuário. Evitar expor diretamente o índice Elasticsearch como recurso de produto no painel.
- O índice por usuário é um mecanismo de isolamento interno. Não confundir uma fonte de dados com um índice independente.
- API Keys são segredos vinculados ao usuário. Não usar chaves reais como exemplos, conteúdo de demonstração ou documentação pública.
- **Grupos de acesso, subusuários e hierarquia organizacional não fazem parte da modelagem atual.** O fato de o público incluir equipes técnicas não implica suporte a essas estruturas.
- Referências a grupos, organizações ou permissões hierárquicas encontradas em telas, modelos, documentação ou textos anteriores não autorizam sua inclusão no escopo atual. Quando conflitarem, prevalecem as decisões confirmadas neste documento.

### Decisões em aberto

- Hospedagem, distribuição e ambiente de produção.
- Regras específicas de retenção, exclusão e tratamento de documentos, além do isolamento e do tratamento de segredos já definidos.
- Requisitos formais de acessibilidade e necessidades específicas dos usuários.
- Metas de desempenho, limites de uso e critérios quantitativos de sucesso.
- Regras de ciclo de vida das API Keys, como expiração, rotação e escopos.
- Formato do contrato da API e detalhes visuais/interativos da apresentação dos arquivos de origem; a exibição desses arquivos junto à resposta do RAG já é requisito confirmado.

## Brand Commitments

O nome do produto é **Fluidocs**.

A única referência visual indicada pelo responsável é a logo anexada à conversa, preservada em [docs/assets/fluidocs-logo-reference.png](docs/assets/fluidocs-logo-reference.png). Ela apresenta um documento azul estilizado com linhas de texto e uma forma fluida na base, sobre fundo branco.

A imagem é uma captura de tela fornecida pelo responsável, não um arquivo vetorial mestre. Usá-la como referência da marca. Ela não define, por si só, uma paleta completa, tipografia, componentes ou tratamento visual das telas. A interface existente também não foi confirmada como referência visual vinculante.

Não foram definidos outros compromissos de voz ou identidade visual.

## Evidence on Hand

- Alinhamento do responsável em 15 de setembro de 2026: módulos separados de gerenciamento e consumo, CRUD de chaves e fontes por conta, seleção de fontes para busca/RAG, operações de conversa e exibição dos arquivos usados nas respostas. Origem: conversa de alinhamento do projeto; atualização documental expressamente aprovada.
- Logo fornecida pelo responsável: `docs/assets/fluidocs-logo-reference.png`. Origem: captura de tela anexada em 9 de setembro de 2026; cópia preservada sem edição.
- Código da API: `backend/src/backend/`.
- Código do painel: `frontend/src/`.
- Configuração do ambiente de desenvolvimento: `docker-compose.yml`.
- Instruções técnicas existentes: `README.md` e `backend/README.md`.
- Mapa estático anterior: `docs/graphify.md`. Descreve o código observado naquele momento; não substitui as decisões de produto confirmadas aqui.

O código e o mapa anteriores contêm diferenças entre os contratos do frontend e do backend, além de referências à modelagem que o responsável excluiu do escopo atual. Verificar o estado real de cada capacidade antes de descrevê-la como disponível. Este documento não corrige essas diferenças de implementação.

Não foram fornecidos clientes de referência, depoimentos, métricas de desempenho, preços ou provas comerciais. Textos promocionais ou dados de demonstração encontrados nas telas não devem ser tratados como evidência desses fatos.

## Product Principles

1. **Priorizar a integração pela API.** Decisões do painel devem apoiar o acesso e o gerenciamento das capacidades do núcleo.
2. **Fundamentar respostas em documentos recuperados.** Manter a rastreabilidade das fontes como parte do objetivo do RAG.
3. **Preservar isolamento e segredos.** Respeitar o índice por usuário e tratar API Keys como credenciais sensíveis.
4. **Apresentar fontes de dados como abstração de produto.** Detalhes internos do Elasticsearch não devem dominar o fluxo de gerenciamento.
5. **Respeitar o escopo confirmado.** Manter a indexação em segundo plano e não introduzir grupos, subusuários ou hierarquias organizacionais por inferência.
6. **Separar configuração e consumo no frontend.** Manter gerenciamento de chaves e fontes em módulo distinto da busca e das conversas, conforme os comportamentos definidos neste documento.
