# Minimal Dockerfile for Vite + React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* bun.lockb* ./
RUN npm install --frozen-lockfile || npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
