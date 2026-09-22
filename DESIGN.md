---
name: Fluidocs — página pública
description: Sistema visual da landing page Início, extraído da implementação concluída.
colors:
  cobalt: "#1553db"
  cobalt-deep: "#123fb0"
  cobalt-hover: "#1047c2"
  evidence-lime: "#d9f879"
  evidence-hover: "#e5ffa3"
  ice-ground: "#f7f9fc"
  paper: "#ffffff"
  midnight-ink: "#142435"
  muted-ink: "#586878"
  fine-rule: "#d9e1e9"
  soft-surface: "#eaf0f8"
  dark-ground: "#111d2b"
  dark-paper: "#172739"
  dark-ink: "#f0f5fc"
  dark-muted: "#adbed0"
  dark-rule: "#334659"
  dark-soft: "#21354b"
  dark-link: "#96bbff"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(3.1rem, 4.65vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2rem, 3.3vw, 3.1rem)"
    fontWeight: 700
    lineHeight: 1.17
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.9
  lead:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  tag: "4px"
  control: "5px"
  button: "7px"
  annotation: "8px"
  document: "9px"
  illustration: "10px"
spacing:
  compact: "8px"
  related: "16px"
  group: "24px"
  section-mobile: "62px"
  section-tablet: "76px"
  section-desktop: "104px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "16px 23px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-hover}"
  button-lime:
    backgroundColor: "{colors.evidence-lime}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.button}"
    padding: "16px 23px"
  button-dark:
    backgroundColor: "{colors.midnight-ink}"
    textColor: "{colors.ice-ground}"
    rounded: "{rounded.button}"
    padding: "10px 16px"
  source-disclosure:
    textColor: "{colors.cobalt}"
    rounded: "{rounded.control}"
    padding: "11px 12px"
---

# Design System: Fluidocs

## Overview

**Creative North Star: "Conhecimento com evidência"**

Este documento descreve o sistema implementado na página pública Início. A identidade combina superfícies claras de leitura, planos azuis, títulos amplos e documentos com trechos destacados. A composição e a demonstração específicas da rota permanecem no briefing de superfície.

Os tokens estão limitados à landing page. As telas de autenticação e o painel conservam seus estilos anteriores; este arquivo não afirma que foram redesenhados. A logo fornecida pelo responsável permanece como referência de marca.

**Key Characteristics:**

- Títulos amplos e composição assimétrica.
- Azul em áreas inteiras, com verde reservado a evidências e ações de destaque.
- Documentos legíveis, linhas finas e sobreposição com espaço reservado.
- Controles explícitos e transições vinculadas à interação.

## Colors

O azul cobalto organiza ações e grandes áreas; o verde evidencia trechos e ações sobre o azul. Fundo gelo, papel branco, texto escuro e linhas suaves sustentam a leitura.

No tema escuro, fundo, papel, texto, divisórias e links usam os tokens correspondentes. Os planos cobalto e os destaques verdes permanecem reconhecíveis. Texto secundário sobre azul é tingido de azul claro.

**The Evidence Rule.** O destaque de uma fonte deve manter o texto legível e a origem identificável.

## Typography

Manrope é hospedada localmente em arquivos Regular e Bold. O CSS mapeia as funções de peso 400–500 para Regular e 600–800 para Bold; não há seis arquivos de peso distintos. A licença e as origens estão junto aos arquivos da fonte.

O título principal usa a escala display; títulos de seção usam headline. O texto introdutório tem mais destaque que os parágrafos secundários. Rótulos de controle ficam abaixo dos títulos na hierarquia; metadados de documentos e rodapé usam tamanhos menores e não devem se tornar o padrão para texto principal.

Em telas menores, o título principal usa 43px até o limite de tablet, uma escala fluida entre 42 e 64px no celular e 38px abaixo de 360px. Os títulos de seção usam 32px no celular, com exceções locais para o documento e a chamada final. Números de etapas usam algarismos tabulares.

## Layout

O conteúdo tem largura máxima de 1240px. A margem total passa de 112px no desktop para 72px em telas intermediárias, 40px no celular e 32px nas telas mais estreitas. As seções principais usam o ritmo de espaçamento registrado no frontmatter.

Grades de duas colunas tornam-se uma coluna abaixo de 700px. A navegação principal muda para menu móvel abaixo de 900px. O cabeçalho permanece fixo durante a rolagem e os destinos das âncoras reservam espaço para ele.

A ordem de leitura continua sendo apresentação, conteúdo interativo, explicação e ação. Elementos sobrepostos reservam espaço no fluxo para não esconder texto nem metadados.

## Elevation & Depth

A profundidade vem principalmente de superfícies tonais e folhas sobrepostas. O documento usa sombra suave com deslocamento vertical; a anotação azul recebe uma sombra mais definida. Botões ganham elevação discreta no hover.

**The Clear Overlap Rule.** A sobreposição pode tocar a borda de uma superfície, mas não pode encobrir sua prosa, procedência ou controles.

## Shapes

Controles e documentos têm cantos levemente arredondados. Tags são mais compactas; documentos e ilustrações têm curvas discretamente maiores. Círculos aparecem em indicadores de etapa e nos diagramas, não como moldura obrigatória de todo ícone.

## Components

Botões primários usam azul com texto branco. A variante verde destaca a consulta e o cadastro sobre fundos azuis. A variante escura organiza a ação do cabeçalho. Hover desloca o botão 2px para cima; foco visível usa contorno de 3px com afastamento de 5px. Botões de consulta ficam desabilitados enquanto a simulação está em andamento.

Seletores de exemplos mantêm a opção escolhida explícita. O seletor nativo possui rótulo associado. As etapas clicáveis atualizam texto e diagrama; a consulta tem estados inicial, em andamento e concluído. A fonte é um botão de expansão com estado acessível e trecho de origem identificado.

As perguntas frequentes usam `details` e `summary`. O menu móvel fecha por Escape, clique externo e mudança para desktop; Escape devolve o foco ao botão. A página fornece um link para pular ao conteúdo.

As animações são breves e acionadas por seleção ou resposta: folha, núcleo do diagrama e revelação da resposta. O CSS desativa essas animações com `prefers-reduced-motion`; a simulação também reduz seus intervalos. O alternador de tema é o componente compartilhado já existente.

## Do's and Don'ts

- Do manter contraste e procedência legível em documentos claros e escuros.
- Do usar seleção explícita, feedback de consulta e navegação por teclado.
- Do manter dados demonstrativos identificados como fictícios.
- Don't encobrir texto com anotações ou ornamentos.
- Don't transformar rótulos pequenos em títulos auxiliares acima dos títulos principais.
- Don't aplicar estes tokens ao painel sem um pedido de mudança de escopo.
