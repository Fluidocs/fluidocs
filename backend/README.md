# FastAPI Backend
> Backend do Fluidocs

- FastAPI (API HTTP)
- Celery + Redis (Worker Async)
- Elasticsearch (Motor de Pesquisa)
- Ollama (Modelo de Inferência de Embeddings + Modelo GenAI)

## Instalação do Projeto
> Para instalar o projeto, é mais adequado através do WSL

- [Instalação do WSL (Youtube)](https://youtu.be/MaTe1qBTaic?si=A1uDAEnlXXOh_oJO)

### Mise
> Gerenciador de Pacotes de Linguagem de Programação

Instalação:
```bash
sudo add-apt-repository -y ppa:jdxcode/mise
sudo apt update
sudo apt install -y mise
```

Instalar Python:
```bash
mise use -g python@3.13
```

### Docker

```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Criação do grupo pra nn precisar usar sudo
sudo groupadd docker
sudo usermod -aG docker $user
sudo newgrp docker
```

*Necessário fechar o terminal e abrir de novo

### Projeto

```bash
git clone git@github.com:Fluidocs/fluidocs.git

# Buildar a aplicação
docker compose build

# Iniciar a aplicação
docker compose up
```

## Estrutura de Arquivos

```txt
- backend
  - .docker -> Dockerfile
  - scripts -> Serem executados na sua máquina após a instalação
  - src -> Arquivos fonte
    - backend -> pacote do projeto
      - api
        - handlers -> handlers de exceções customizadas
        - helpers -> funções helpers gerais, funções p/ injeção de dependência (Depends)
        - routes -> rotas da api (controller)
        - schemas -> formato de retorno para no controller (view)
        - services -> Orquestração Request > Código
      - config -> configurações do projeto
        - __init__.py -> life-cycle da aplicação, configs de inicialização
        - configuracoes.py -> configuração do formato do .env
      - core -> Núcleo da Aplicação
        - exceptions -> exceções base (request do motor de pesquisa falhou, etc...)
      - domain -> (Arquivos de Domínio da aplicação, strategies, factories, etc)
        - extraction -> logica de extração de arquivos
        - indices
          - mapping -> lógica de mapeamento de arquivos (documentos fixo, etc...)
          - exceptions -> exceções para índices do elasticsearch
      - workers (Workers Celery + Redis)
      - __init__.py -> inicialização do app
```