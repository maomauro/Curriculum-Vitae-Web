# ─── ETAPA 1: Build de produccion de Angular ────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# package*.json aparte del resto del codigo para cachear "npm ci" entre builds.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# ─── ETAPA 2: Servido con Nginx ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Config propia: sirve el SPA con fallback a index.html y hace proxy de
# /api + /health hacia el backend (ver docker-compose.prod.yml).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# El builder nuevo (@angular/build:application, sin outputPath custom en
# angular.json) deja el output bajo dist/<project>/browser.
COPY --from=build /app/dist/portalcv-web/browser /usr/share/nginx/html

EXPOSE 80 443
