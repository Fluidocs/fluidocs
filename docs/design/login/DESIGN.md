---
name: Fluidocs — Login
description: Registro visual restrito à tela de entrada implementada.
colors:
  primary: "#086cae"
  primary-hover: "#085888"
  story: "#095c96"
  background: "#f8fafc"
  paper: "#fff"
  ink: "#152939"
  muted: "#586b7b"
  line: "#cdd7df"
  dark-background: "#101c27"
  dark-paper: "#152633"
  dark-ink: "#edf5fa"
  dark-muted: "#acbecb"
  dark-line: "#496070"
  dark-accent: "#77c8ff"
typography:
  headline:
    fontFamily: "Login Manrope, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.27
    letterSpacing: "-1.2px"
  display:
    fontFamily: "Login Manrope, sans-serif"
    fontSize: "42px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-1.4px"
  body:
    fontFamily: "Login Manrope, sans-serif"
    fontSize: "14px"
  label:
    fontFamily: "Login Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 700
rounded:
  control: "9px"
  example: "12px"
  story: "22px"
spacing:
  field: "9px"
  form: "22px"
  desktop: "48px"
  mobile: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-demo:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "52px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "52px"
---

# Design System: Fluidocs — Login

## Overview

**Creative North Star: "Conhecimento em primeiro plano"**

Entrada espaçosa e operacional: o formulário ocupa o lado esquerdo; um painel azul apresenta exemplos ilustrativos de perguntas, respostas e fontes à direita. A marca reutiliza o ativo existente, com tipografia Manrope local.

Este registro descreve exclusivamente [Entrar.tsx](../../../frontend/src/pages/Entrar.tsx) e [Entrar.css](../../../frontend/src/pages/Entrar.css). Não amplia o sistema da página Início nem estabelece regras para o painel. [PRODUCT.md](../../../PRODUCT.md) permanece a autoridade de produto; a autenticação local de demonstração não é uma capacidade de produção comprovada.

**Key Characteristics:**

- Formulário com respiro e hierarquia curta.
- Azul documental com superfícies neutras.
- Exemplo ilustrativo interativo, removido no celular.
- Temas claro e escuro com foco visível.

## Colors

### Primary

O azul primário identifica a ação de entrada, links e foco; o azul do painel sustenta a ilustração. No tema escuro, o acento claro atende links e foco, enquanto a ação principal mantém o preenchimento azul.

### Neutral

Fundo, papel, tinta, texto secundário e linhas têm pares claros e escuros definidos no frontmatter. A ilustração preserva papel claro nos dois temas.

## Typography

Manrope local, com arquivos regular e bold, conduz títulos, campos e ações. Os títulos usam peso forte e entreletra compacta; texto operacional permanece menor e legível. O título do formulário passa a 30px até 1100px e 32px até 800px; o título ilustrativo passa a 36px até 1100px e 48px a partir de 1500px.

## Layout

**The Form First Rule.** Até 800px, ocultar o painel ilustrativo e preservar a sequência completa de acesso.

A composição desktop usa duas colunas iguais, largura máxima de 1440px e formulário de até 396px. Acima de 1500px e no celular, o formulário admite 420px. O espaçamento lateral cai de 48px para 28px até 1100px e para 24px até 800px. Cabeçalho e rodapé acompanham o mesmo limite horizontal.

## Elevation & Depth

O formulário permanece plano. A folha ilustrativa usa rotação de -2deg e sombra suave (0 18px 40px #00355b40), restritas ao contexto documental. O campo focado recebe uma sombra discreta (0 2px 9px #086cae12).

## Shapes

Controles compartilham cantos suaves; folha e painel usam curvas progressivamente maiores. Campos e ações principais têm a mesma altura. Os indicadores de exemplo passam de ponto circular para cápsula quando selecionados.

## Components

**The Honest Demo Rule.** Manter a identificação explícita de demonstração e de exemplo ilustrativo; não apresentar esses elementos como autenticação real ou resultado de consulta ao backend.

Entrada principal, demonstração secundária, campos rotulados e alternância de visibilidade de senha compõem a operação. A recuperação expande ajuda local; os três controles do painel trocam exemplos manualmente. O foco usa contorno de 3px, com afastamento de 4px; no painel azul, o contorno é branco. As transições de estado duram 180ms e são removidas com preferência por movimento reduzido.

O sidecar adjacente é um registro portátil desta superfície. Sua localização aninhada não implica descoberta automática pelo painel Impeccable da raiz.

## Do's and Don'ts

- Preservar rótulos, foco visível e ajuda de demonstração.
- Usar exemplos fictícios identificados como ilustrativos.
- Não promover a composição do login a regra global do produto.
- Não tratar autenticação simulada ou recuperação indisponível como funcionalidades entregues.
