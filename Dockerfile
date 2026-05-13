FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
# Устанавливаем зависимости
RUN npm install
COPY . .
# Принудительно запускаем сборку Vite
RUN npx vite build

FROM nginx:stable-alpine
RUN rm -rf /usr/share/nginx/html/*
# Копируем содержимое папки dist (Vite по умолчанию собирает туда)
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
