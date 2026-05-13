FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Указываем Vite явно, что нам нужна статика
RUN npx vite build --outDir dist

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Добавляем конфиг, чтобы React/Vite роутинг не ломался
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
