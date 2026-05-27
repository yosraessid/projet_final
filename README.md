# Projet Final - React + Docker

Application frontend en React (Vite), conteneurisee avec Docker.

## 1) Lancer en local (sans Docker)

```bash
npm install
npm run dev
```

Puis ouvrir:

- http://localhost:5173

## 2) Lancer en production avec Docker

Construire et lancer le conteneur:

```bash
docker compose up --build -d
```

Ouvrir l'application:

- http://localhost:8080

Arreter:

```bash
docker compose down
```

## 3) Lancer en developpement avec Docker (rechargement auto)

Ce mode est utile pour coder: quand tu modifies un fichier React, la page se met a jour automatiquement.

Construire et lancer:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Ouvrir l'application:

- http://localhost:5173

Arreter:

```bash
docker compose -f docker-compose.dev.yml down
```

## 4) Structure Docker

- `Dockerfile`: build React puis serveur Nginx (production)
- `Dockerfile.dev`: environnement Node pour le developpement
- `docker-compose.yml`: service production sur le port `8080`
- `docker-compose.dev.yml`: service developpement sur le port `5173`
- `.dockerignore`: exclut les fichiers inutiles du contexte Docker
