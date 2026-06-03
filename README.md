# Projet Final - React + Docker

Application frontend en React (Vite), conteneurisee avec Docker.

## Backend Firebase (Auth + Firestore)

Le projet utilise maintenant Firebase comme backend:

- Authentification: Firebase Authentication (email/mot de passe)
- Donnees metier: Cloud Firestore (users, projects, tasks)

### Configuration rapide

1. Creer un projet Firebase
2. Activer **Authentication > Sign-in method > Email/Password**
3. Activer **Cloud Firestore** (mode test pour commencer)
4. Copier `.env.example` vers `.env`
5. Remplir les variables avec les valeurs de ton projet Firebase

Exemple:

```bash
cp .env.example .env
```

### Structure backend (cote front)

- `src/firebase/firebaseConfig.js` : lit/valide les variables d'environnement
- `src/firebase/firebaseClient.js` : initialise Firebase (app, auth, firestore)
- `src/services/firebaseAuthService.js` : logique auth (login/register/logout + profil user)
- `src/services/firebaseAppDataService.js` : logique Firestore (projects/tasks/members)
- `src/context/AuthContext.jsx` : etat auth global (session utilisateur)
- `src/context/AppDataContext.jsx` : etat donnees global + actions CRUD

Documentation detaillee (structure + regles + exemples JSON) :

- [`docs/FIRESTORE.md`](docs/FIRESTORE.md)

Fichiers regles Firestore :

- `firestore.rules` : regles **production** (recommandees)
- `firestore.rules.dev` : regles **test** temporaires (debutant uniquement)
- `firebase.json` : configuration pour deployer les regles avec Firebase CLI

Deployer les regles :

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

Ou copier le contenu de `firestore.rules` dans Firebase Console → Firestore → Regles.

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
