FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Собираем проект
RUN npm run build
# Эта строка покажет нам в логах список файлов, чтобы мы увидели название папки
RUN ls -la

FROM nginx:stable-alpine
RUN rm -rf /usr/share/nginx/html/*
# Пробуем скопировать содержимое папки builder. 
# Если папка называется иначе, мы увидим это в логах после ls -la
COPY --from=build /app/builder /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
