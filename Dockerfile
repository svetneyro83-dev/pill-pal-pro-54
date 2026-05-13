FROM node:20-slim AS build
WORKDIR /app
COPY package*.json bun.lock* ./
RUN npm install
COPY . .
RUN npx vite build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
