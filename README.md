# To-Do Liste Collaborative

Application web de gestion de tâches en équipe, développée dans le cadre d'un Projet de Fin d'Études (PFE).

Construite avec **React 18 + Vite**, **Firebase** (Auth + Firestore) et conteneurisée avec **Docker**.

---

## Fonctionnalités

- **Authentification** : inscription, connexion, réinitialisation de mot de passe (Firebase Auth)
- **Projets / Groupes** : création, édition, suppression de projets collaboratifs
- **Membres** : ajout par nom ou email, invitations en attente pour les non-inscrits
- **Tâches** : création, changement de statut (À faire / En cours / Terminé), suppression avec confirmation
- **Synchronisation temps réel** : mise à jour automatique via Firestore (onSnapshot)
- **Thème clair / sombre** : persisté dans localStorage
- **Notifications in-app** : système de toasts avec historique
- **Mode hors ligne** : cache localStorage + persistance IndexedDB Firestore
- **Interface responsive** : adaptée mobile et desktop

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18, Vite |
| Routing | React Router v6 |
| Backend / BDD | Firebase Auth + Cloud Firestore |
| Styles | CSS custom (variables CSS, sans framework) |
| Conteneurisation | Docker + Nginx |

---

## Prérequis

- [Node.js](https://nodejs.org/) >= 18
- Un projet Firebase (gratuit) avec Auth et Firestore activés
- [Docker](https://www.docker.com/) (optionnel, pour le déploiement)

---

## Installation et configuration

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd Projet_final
```

### 2. Configurer Firebase

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activer **Authentication → Sign-in method → Email/Password**
3. Activer **Cloud Firestore** (mode production recommandé)
4. Dans les paramètres du projet → **Vos applications → Config**, copier les clés

### 3. Créer le fichier d'environnement

```bash
cp .env.example .env
```

Remplir `.env` avec les valeurs Firebase :

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Installer les dépendances

```bash
npm install
```

---

## Lancer l'application

### En local (développement)

```bash
npm run dev
```

Ouvrir : [http://localhost:5173](http://localhost:5173)

### En production avec Docker

```bash
docker compose up --build -d
```

Ouvrir : [http://localhost:8080](http://localhost:8080)

```bash
docker compose down   # pour arrêter
```

### En développement avec Docker (hot reload)

```bash
docker compose -f docker-compose.dev.yml up --build
```

Ouvrir : [http://localhost:5173](http://localhost:5173)

---

## Déployer les règles Firestore

Les règles de sécurité sont définies dans `firestore.rules`.  
Pour les déployer via Firebase CLI :

```bash
npm install -g firebase-tools
firebase login
firebase use --add       # sélectionner votre projet
firebase deploy --only firestore:rules
```

Ou copier le contenu de `firestore.rules` dans **Firebase Console → Firestore → Règles → Publier**.

---

## Structure du projet

```
src/
├── assets/              # Images et icônes statiques
├── components/          # Composants réutilisables
│   ├── auth/            # ProtectedRoute
│   ├── layout/          # AppLayout (sidebar + topbar)
│   ├── NewProjectModal.jsx
│   ├── ProjectDetailsModal.jsx
│   ├── NotificationBell.jsx
│   ├── TaskStatusMenu.jsx
│   ├── TopbarAuth.jsx
│   ├── PasswordInput.jsx
│   └── PasswordRequirements.jsx
├── context/             # Contextes React globaux
│   ├── AuthContext.jsx          # Session utilisateur
│   ├── AppDataContext.jsx       # Données temps réel (projets/tâches/membres)
│   ├── NotificationsContext.jsx # Toasts in-app
│   └── ThemeContext.jsx         # Thème clair/sombre
├── firebase/            # Initialisation Firebase
│   ├── firebaseConfig.js        # Lecture des variables d'environnement
│   └── firebaseClient.js        # Instance app/auth/db (lazy init)
├── hooks/               # Hooks personnalisés
│   └── useClickOutside.js
├── pages/               # Pages de l'application
│   ├── HomePage.jsx
│   ├── AuthPage.jsx             # Connexion + inscription Firebase
│   ├── DashboardPage.jsx        # Projets + tâches
│   ├── GroupsPage.jsx           # Gestion des équipes
│   ├── ProfileSettingsPage.jsx  # Profil + paramètres
│   └── NotFoundPage.jsx
├── services/            # Logique métier Firebase
│   ├── firebaseAuthService.js
│   └── firebaseAppDataService.js
└── utils/               # Utilitaires
    └── passwordValidation.js
```

---

## Structure des données Firestore

```
users/{uid}
  ├── uid, name, email, role, updatedAt

projects/{projectId}
  ├── id, name, description, deadline
  ├── memberUids[], pendingEmails[], memberRoles{}
  ├── createdAt
  └── tasks/{taskId}
        ├── id, title, description, status
        ├── priority, deadline, assigneeUid
        └── createdAt
```

Documentation complète : [`docs/FIRESTORE.md`](docs/FIRESTORE.md)

---

## Fichiers Docker

| Fichier | Description |
|---------|-------------|
| `Dockerfile` | Build React → Nginx (production) |
| `Dockerfile.dev` | Environnement Node pour le développement |
| `docker-compose.yml` | Service production sur le port `8080` |
| `docker-compose.dev.yml` | Service développement sur le port `5173` |
| `.dockerignore` | Exclut `node_modules`, `.env`, `dist` du contexte |

---

## Auteur

**Yosra Essid** — Projet de Fin d'Études 2026
