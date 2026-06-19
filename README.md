# WorkSpace — To-Do Liste Collaborative

Application web de gestion de tâches en équipe, développée dans le cadre d'un Projet de Fin d'Études (PFE) — 3ème année Développement Web.

Construite avec **React 19 + Vite**, **Firebase** (Auth + Firestore) et conteneurisée avec **Docker**.

---

## Fonctionnalités

- **Authentification** : inscription, connexion, réinitialisation de mot de passe (Firebase Auth)
- **Projets collaboratifs** : création, édition, suppression avec confirmation
- **Membres** : ajout par nom ou email, invitations en attente, retrait
- **Tâches** : création, modification inline, changement de statut, priorité et assignation
- **Statuts colorés** : À faire (rouge) · En cours (jaune) · Terminé (vert)
- **Priorités distinctes** : Haute (rose) · Moyenne (bleu) · Basse (cyan)
- **Synchronisation temps réel** : Firestore `onSnapshot`
- **Thème clair / sombre** : persisté dans localStorage
- **Notifications in-app** : panneau scrollable avec historique persisté
- **Sécurité** : règles Firestore, rate limiting, validation emails
- **Tests unitaires** : 89 tests (Vitest + Testing Library)
- **Interface responsive** : adaptée mobile et desktop

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19, Vite |
| Routing | React Router v6 |
| Backend / BDD | Firebase Auth + Cloud Firestore |
| Styles | CSS custom (variables CSS, sans framework) |
| Tests | Vitest + @testing-library/react |
| Conteneurisation | Docker + Nginx |

---

## Prérequis

- [Node.js](https://nodejs.org/) >= 18
- Un projet Firebase avec Auth et Firestore activés
- [Docker](https://www.docker.com/) (optionnel)

---

## Installation et configuration

### 1. Cloner le projet

```bash
git clone git@github.com:yosraessid/projet_final.git
cd projet_final
```

### 2. Configurer Firebase

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activer **Authentication → Email/Password**
3. Activer **Cloud Firestore**
4. Copier les clés depuis Paramètres → Config

### 3. Créer le fichier d'environnement

```bash
cp .env.example .env
```

Remplir `.env` :

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Installer et lancer

```bash
npm install
npm run dev
```

Ouvrir : [http://localhost:5173](http://localhost:5173)

---

## Lancer les tests

```bash
npm run test
```

89 tests unitaires couvrant : validation mot de passe, config Firebase, contexte notifications, composants UI.

---

## Déploiement Docker

```bash
# Production
docker compose up --build -d
# → http://localhost:8080

# Développement (hot reload)
docker compose -f docker-compose.dev.yml up --build
# → http://localhost:5173
```

---

## Déployer les règles Firestore

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

Ou copier `firestore.rules` dans **Firebase Console → Firestore → Règles → Publier**.

---

## Structure du projet

```
src/
├── components/
│   ├── auth/              # ProtectedRoute
│   ├── layout/            # AppLayout (sidebar + topbar)
│   ├── NewProjectModal.jsx
│   ├── ProjectDetailsModal.jsx  # Modal 2 colonnes
│   ├── NotificationBell.jsx
│   ├── TaskStatusMenu.jsx
│   ├── TopbarAuth.jsx
│   ├── PasswordInput.jsx
│   └── PasswordRequirements.jsx
├── context/
│   ├── AuthContext.jsx
│   ├── AppDataContext.jsx
│   ├── NotificationsContext.jsx
│   └── ThemeContext.jsx
├── firebase/
│   ├── firebaseConfig.js
│   └── firebaseClient.js
├── hooks/
│   └── useClickOutside.js
├── pages/
│   ├── HomePage.jsx
│   ├── AuthPage.jsx
│   ├── DashboardPage.jsx
│   ├── ProfileSettingsPage.jsx
│   └── NotFoundPage.jsx
├── services/
│   ├── firebaseAuthService.js
│   └── firebaseAppDataService.js
├── tests/               # 89 tests unitaires
└── utils/
    ├── passwordValidation.js
    └── rateLimiter.js
```

---

## Structure Firestore

```
users/{uid}
  └── uid, name, email, role, updatedAt

projects/{projectId}
  ├── id, name, description, deadline, createdAt
  ├── memberUids[], pendingEmails[], memberRoles{}
  └── tasks/{taskId}
        ├── id, title, description, status
        ├── priority, assigneeUid, deadline
        └── createdAt
```

---

## Auteur

**Yosra Essid** — Projet de Fin d'Études 2026  
[github.com/yosraessid/projet_final](https://github.com/yosraessid/projet_final)
