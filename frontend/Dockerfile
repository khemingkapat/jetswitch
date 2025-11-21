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

# The original content copied everything.
# We explicitly copy the new custom config file over the default NGINX one.
# It is important that 'nginx.conf' is in the same directory as the Dockerfile (frontend/).
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
