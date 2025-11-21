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

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

