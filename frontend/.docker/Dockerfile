# syntax=docker/dockerfile:1

# Estágio 1: Base (Instala dependências e copia o código)
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Estágio 2: Desenvolvimento (Usado pelo docker-compose)
FROM base AS dev
EXPOSE 3000
ENV HOST=0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# Estágio 3: Compilação para Produção (Gera a pasta dist)
FROM base AS builder
RUN npm run build

# Estágio 4: Servidor Nginx (Produção)
# FROM nginx:alpine AS production
# # Copia apenas o build final do estágio 3
# COPY --from=builder /app/dist /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
