# Configuração de Build Multiestágio otimizada para Leonel / Lumini CRM
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copia arquivos de pacotes para cachamento de camadas
COPY package*.json ./
RUN npm install

# Copia código-fonte completo
COPY . .

# Compila o Front-End (Vite) e bundles do Back-End (esbuild)
RUN npm run build

# --- Estágio Executor em Produção (Hardened Runner) ---
FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Instala apenas dependências de produção para manter o container leve e rápido
COPY package*.json ./
RUN npm install --omit=dev

# Copia artefatos compilados do estágio Builder
COPY --from=builder /usr/src/app/dist ./dist

# Expõe a porta oficial 3000
EXPOSE 3000

# Start script
CMD ["npm", "run", "start"]
