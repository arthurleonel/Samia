# Configuração de Build Multiestágio otimizada para Leonel / Lumini CRM
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copia arquivos de pacotes explicitamente
COPY package.json package-lock.json ./
RUN npm install

# Copia código-fonte completo
COPY . .

# Compila o Front-End (Vite) e bundles do Back-End (esbuild)
RUN npm run build

# Remove as dependências de desenvolvimento para reduzir o tamanho de node_modules
RUN npm prune --omit=dev

# --- Estágio Executor em Produção (Hardened Runner) ---
FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Copia dependências de produção de forma segura e direta do estágio builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json

# Expõe a porta oficial 3000
EXPOSE 3000

# Start script
CMD ["npm", "run", "start"]
