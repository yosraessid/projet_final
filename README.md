# 📋 To-Do Liste Collaborative

Application web de gestion collaborative de tâches en temps réel, développée avec React 19 et Firebase.

> **Projet de Fin d'Études (PFE)** — 3ème année Développement Web

---

## 🎯 Problématique

Comment faciliter la gestion de tâches en équipe avec une application web moderne, sécurisée et accessible sur tous les appareils ?

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 🔐 Authentification | Inscription, connexion, mot de passe oublié (Firebase Auth) |
| 📂 Gestion de projets | Créer, modifier, supprimer des projets collaboratifs |
| ✅ Gestion de tâches | CRUD complet avec statut, priorité et assignation |
| 👥 Gestion des membres | Ajout par email, rôles (Admin/Membre), invitations en attente |
| 🔔 Notifications | Système de notifications persistantes in-app |
| 🌓 Thème clair/sombre | Bascule dynamique avec persistance localStorage |
| 📱 Responsive | Desktop, tablette, téléphone (4 breakpoints) |
| ⚡ Temps réel | Synchronisation instantanée via Firestore listeners |
| 🔒 Sécurité | Rate limiting, validation MDP, sanitisation XSS, audit Firestore |
| 🧪 Tests | 89 tests unitaires automatisés (Vitest) |
| 🚀 CI/CD | Pipeline GitHub Actions (lint, tests, build) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19)                     │
├─────────────────────────────────────────────────────────────┤
│  Composants       │  Contextes        │  Services           │
│  ├─ AppLayout     │  ├─ AuthContext   │  ├─ firebaseAuth    │
│  ├─ Dashboard     │  ├─ AppData      │  ├─ firebaseAppData │
│  ├─ ProjectModal  │  ├─ Notifications│  └─ securityLogger  │
│  ├─ TaskStatus    │  └─ Theme        │                     │
│  └─ NotifBell     │                   │                     │
├─────────────────────────────────────────────────────────────┤
│                     Firebase SDK (v12)                       │
├─────────────────────────────────────────────────────────────┤
│              BACKEND (Firebase — BaaS)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Firebase    │  │ Cloud       │  │ Firestore Security  │ │
│  │ Auth (JWT)  │  │ Firestore   │  │ Rules (validation)  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Sécurité

| Couche | Mesure | Détail |
|--------|--------|--------|
| Client | Validation mot de passe | 5 règles (8-16 chars, majuscule, minuscule, chiffre, spécial) |
| Client | Rate limiting | 5 tentatives/min (login), 3/5min (inscription), 3/10min (reset) |
| Client | Sanitisation XSS | Nettoyage des entrées, détection d'injection de scripts |
| Client | Validation email | Regex stricte avant appel Firebase |
| Serveur | Firestore Security Rules | Validation types, longueurs max, whitelist statuts, appartenance |
| Serveur | Audit Firestore | Collection `audit-logs` — trace connexions réussies/échouées |
| Serveur | Token JWT | Géré automatiquement par Firebase Auth (session persistante) |

---

## 🧰 Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| React | 19.2 | Framework frontend (SPA) |
| Vite | 8.0 | Bundler et serveur de développement |
| Firebase Auth | 12.14 | Authentification (email/mot de passe) |
| Cloud Firestore | 12.14 | Base de données temps réel |
| Vitest | 4.1 | Tests unitaires |
| Testing Library | 16.3 | Tests de composants React |
| ESLint | 10.3 | Qualité de code |
| Docker | — | Conteneurisation |
| GitHub Actions | — | CI/CD automatisé |

---

## 📁 Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── layout/          # AppLayout (sidebar + topbar)
│   ├── auth/            # ProtectedRoute
│   ├── NotificationBell.jsx
│   ├── ProjectDetailsModal.jsx
│   ├── TaskStatusMenu.jsx
│   └── ...
├── context/             # Contextes React (état global)
│   ├── AuthContext.jsx
│   ├── AppDataContext.jsx
│   ├── NotificationsContext.jsx
│   └── ThemeContext.jsx
├── services/            # Couche d'accès à Firebase
│   ├── firebaseAuthService.js
│   └── firebaseAppDataService.js
├── firebase/            # Configuration Firebase
│   ├── firebaseConfig.js
│   └── firebaseClient.js
├── utils/               # Utilitaires
│   ├── passwordValidation.js
│   ├── rateLimiter.js
│   ├── sanitize.js
│   └── securityLogger.js
├── hooks/               # Hooks personnalisés
│   └── useClickOutside.js
├── pages/               # Pages de l'application
│   ├── HomePage.jsx
│   ├── AuthPage.jsx
│   ├── DashboardPage.jsx
│   ├── ProjectPage.jsx
│   ├── ProfileSettingsPage.jsx
│   └── NotFoundPage.jsx
├── tests/               # Tests unitaires (89 tests)
├── App.jsx              # Routes de l'application
├── App.css              # Styles globaux + responsive
├── index.css            # Variables CSS (thème clair/sombre)
└── main.jsx             # Point d'entrée
```

---

## 🚀 Installation

### Prérequis

- Node.js 18+ et npm
- Un projet Firebase avec Auth et Firestore activés

### Étapes

```bash
# 1. Cloner le projet
git clone git@github.com:yosraessid/projet_final.git
cd projet_final

# 2. Installer les dépendances
npm install

# 3. Configurer Firebase
cp .env.example .env
# Remplir les variables avec vos clés Firebase

# 4. Publier les règles Firestore
# Copier le contenu de firestore.rules dans Firebase Console > Firestore > Règles

# 5. Lancer le serveur de développement
npm run dev
```

### Avec Docker

```bash
docker-compose -f docker-compose.dev.yml up
```

---

## 🧪 Tests

```bash
# Lancer les 89 tests unitaires
npm run test

# Mode watch (développement)
npm run test:watch
```

**Couverture :**
- Composants : PasswordInput, PasswordRequirements, TaskStatusMenu, ProtectedRoute
- Contextes : NotificationsContext
- Utilitaires : passwordValidation, firebaseConfig

---

## 📜 Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement (port 5173) |
| `npm run build` | Build de production |
| `npm run test` | Lance les tests unitaires |
| `npm run lint` | Vérifie la qualité du code |
| `npm run preview` | Prévisualise le build de production |

---

## 🔄 CI/CD

Le pipeline GitHub Actions s'exécute à chaque push sur `main` :

1. ✅ **Lint** — Vérifie le code avec ESLint
2. ✅ **Tests** — Lance les 89 tests unitaires
3. ✅ **Build** — Compile l'application pour la production

---

## 📊 Collections Firestore

| Collection | Description |
|---|---|
| `users` | Profils utilisateurs (uid, name, email, role) |
| `projects` | Projets (name, description, memberUids, deadline) |
| `projects/{id}/tasks` | Tâches d'un projet (title, status, priority, assigneeUid) |
| `audit-logs` | Logs de sécurité (action, timestamp, email, userAgent) |

---

## 🎨 Thèmes

L'application supporte deux thèmes avec transition fluide :

- **Mode sombre** (par défaut) — gradient violet/cyan
- **Mode clair** — fond clair avec accents indigo

---

## 📱 Responsive Design

| Breakpoint | Appareil | Adaptation |
|---|---|---|
| > 900px | Desktop | Layout 2 colonnes (sidebar + contenu) |
| 641–900px | Tablette | Sidebar horizontale, grilles adaptées |
| ≤ 640px | Téléphone | Tout en colonne, panels plein écran |
| ≤ 380px | Petit écran | Tailles réduites, tagline masquée |

---

## 🔮 Perspectives d'évolution

- Firebase Cloud Functions (logique serveur avancée)
- Drag & drop des tâches entre colonnes
- Statistiques visuelles (graphiques de progression)
- Notifications push (Firebase Cloud Messaging)
- Déploiement production (Firebase Hosting)
- Tests E2E (Cypress / Playwright)

---

## 👤 Auteur

**Yosra Essid** — 3ème année Développement Web

---

## 📄 Licence

Projet universitaire — PFE 2025/2026
