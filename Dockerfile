# Etape 1: construire l'application React.
FROM node:20-alpine AS build
WORKDIR /app

# On copie d'abord les dependances pour optimiser le cache Docker.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etape 2: servir les fichiers construits avec Nginx.
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
# Garde Nginx actif au premier plan dans le conteneur.
CMD ["nginx", "-g", "daemon off;"]
