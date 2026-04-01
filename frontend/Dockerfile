# ─── ETAPA 1: Compilación con Node.js ───────────────────────────────────────
# Usamos la imagen oficial de Node.js para compilar la aplicación Angular.
# Al igual que el backend, esta etapa solo se usa para el build.
FROM node:20-alpine AS build

WORKDIR /app

# Copiamos package.json primero para aprovechar el cache de Docker.
# Si no cambia package.json, no re-instala dependencias en builds posteriores.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copiamos el resto del código fuente de Angular
COPY . .

# Compilamos Angular en modo producción.
# El resultado queda en dist/nombre-del-proyecto/
RUN npm run build -- --configuration production


# ─── ETAPA 2: Servir con Nginx ───────────────────────────────────────────────
# Nginx es un servidor web liviano ideal para servir SPAs (Single Page Apps).
# La imagen final no incluye Node.js, solo los archivos compilados + Nginx.
FROM nginx:alpine AS runtime

# Copiamos la configuración personalizada de Nginx para Angular
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos compilados de Angular al directorio de Nginx.
# Se detecta automáticamente el primer directorio dist/<app>/browser.
COPY --from=build /app/dist /tmp/dist
RUN set -eux; \
	app_dir="$(find /tmp/dist -mindepth 2 -maxdepth 2 -type d -name browser | head -n 1)"; \
	test -n "$app_dir"; \
	cp -a "$app_dir"/. /usr/share/nginx/html/; \
	rm -rf /tmp/dist

# Puerto estándar HTTP
EXPOSE 80
