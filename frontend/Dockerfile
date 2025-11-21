# --- Build Stage ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Vite requires env vars to start with VITE_
# Railway injects runtime env vars BEFORE build, so this works.
RUN npm run build


# --- Serve Build Stage ---
FROM nginx:alpine

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

CMD sh -c "sed -i \"s|%%VITE_API_BASE_URL%%|$VITE_API_BASE_URL|g\" /usr/share/nginx/html/env.js && nginx -g 'daemon off;'"

