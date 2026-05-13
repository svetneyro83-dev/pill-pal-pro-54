# Используем легкий образ Node.js
FROM node:20-slim AS build
WORKDIR /app
# Копируем настройки и устанавливаем зависимости
COPY package*.json ./
RUN npm install
# Копируем весь код и собираем проект
COPY . .
RUN npm run build

# Используем nginx для раздачи готового сайта
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
