FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
# Эта команда ищет index.html в dist или build и копирует его куда нужно
COPY --from=build /app/dist /usr/share/nginx/html
# Если папка называется build, а не dist, раскомментируйте строку ниже (удалите #):
# COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
