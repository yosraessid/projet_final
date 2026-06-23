# 2. Conception et Design

---

## 2.1 Cahier des charges

### Contexte du projet

Ce projet s'inscrit dans le cadre du **Projet de Fin d'Études (PFE)** à L'école Multimédia. L'objectif est de concevoir et développer une application web de gestion collaborative de tâches en temps réel, permettant à des équipes de créer des projets partagés, d'organiser leurs tâches et de suivre leur avancement de manière synchronisée.

**Problématique :** Comment faciliter la gestion de tâches en équipe avec une application web moderne, sécurisée et accessible sur tous les appareils ?

### Objectifs du projet

- Proposer une interface intuitive et responsive pour organiser des projets et des tâches
- Permettre la collaboration en temps réel entre plusieurs utilisateurs
- Assurer la sécurité des données (authentification, règles d'accès, protection XSS)
- Fournir un système de notifications pour informer les membres des changements
- Offrir une expérience utilisateur agréable avec thème clair/sombre

---

### Acteurs

| Acteur | Rôle |
|--------|------|
| Visiteur | Consulte la page d'accueil, peut s'inscrire ou se connecter |
| Utilisateur | Crée des projets, gère ses tâches, consulte les notifications |
| Administrateur de projet | Gère les membres, modifie/supprime le projet, assigne les tâches |

---

### Contraintes techniques

| Contrainte | Choix retenu |
|------------|-------------|
| Frontend | React 19 + Vite 8 |
| Backend | Firebase (BaaS) — Auth + Firestore |
| Base de données | Cloud Firestore (NoSQL) |
| Hébergement | Vercel (déploiement automatique) |
| Tests | Vitest + Testing Library (89 tests) |
| CI/CD | GitHub Actions |
| Conteneurisation | Docker |

---

### Fonctionnalités Principales (FP)

| Code | Fonctionnalité Principale | Description |
|------|---------------------------|-------------|
| **FP1** | Authentification et gestion des comptes | Inscription, connexion, déconnexion, réinitialisation du mot de passe, routes protégées |
| **FP2** | Gestion des projets (CRUD) | Créer, modifier, supprimer et afficher des projets collaboratifs avec titre, description et deadline |
| **FP3** | Gestion des tâches | Ajouter, modifier, supprimer des tâches avec statut (À faire / En cours / Terminé) et priorité (Haute / Moyenne / Basse) |
| **FP4** | Gestion des membres et collaboration | Ajouter/supprimer des membres par email, assigner des rôles (Admin / Membre), invitations en attente |
| **FP5** | Synchronisation en temps réel | Mise à jour instantanée des données entre tous les membres d'un projet via Firestore |

---

### Fonctionnalités Secondaires (FS)

| Code | Fonctionnalité Secondaire | Description |
|------|----------------------------|-------------|
| **FS1** | Système de notifications | Notifications automatiques lors des actions, panneau flottant avec badge, marquage lu/non-lu, persistance localStorage |
| **FS2** | Thème clair/sombre | Bascule dynamique entre mode clair et sombre, préférence persistée dans localStorage |
| **FS3** | Recherche et filtrage | Filtrer les projets par nom ou description |
| **FS4** | Interface responsive | 4 breakpoints adaptatifs : desktop, tablette, mobile, très petit écran |
| **FS5** | Sécurité avancée | Rate limiting, sanitisation XSS, Firestore Security Rules, audit logs |
| **FS6** | Expérience utilisateur enrichie | Skeleton loading, micro-animations, page 404 animée |

---

---

## 2.2 Spécifications fonctionnelles

### FP1 — Authentification

| Fonctionnalité | Description |
|----------------|-------------|
| Inscription | Formulaire avec nom, email, mot de passe (5 règles de validation : longueur ≥ 8, majuscule, minuscule, chiffre, caractère spécial) |
| Connexion | Email + mot de passe, session persistante (token JWT via Firebase) |
| Mot de passe oublié | Envoi d'un email de réinitialisation via Firebase Auth |
| Déconnexion | Suppression de la session et redirection vers l'accueil |
| Routes protégées | Redirection automatique vers `/auth` si l'utilisateur n'est pas connecté |

---

### FP2 — Gestion des projets

| Fonctionnalité | Description |
|----------------|-------------|
| Créer un projet | Titre (obligatoire), description, date limite |
| Modifier un projet | Changer le titre, la description, la deadline |
| Supprimer un projet | Confirmation modale avant suppression définitive |
| Afficher les projets | Cartes interactives avec barre de progression, statistiques, liste des membres |
| Rechercher | Filtrer les projets par nom ou description |

---

### FP3 — Gestion des tâches

| Fonctionnalité | Description |
|----------------|-------------|
| Ajouter une tâche | Titre + priorité (Haute / Moyenne / Basse) |
| Modifier le statut | À faire (rouge), En cours (jaune), Terminé (vert) |
| Modifier la priorité | Haute (rose), Moyenne (bleu), Basse (cyan) |
| Assigner une tâche | Choisir un membre du projet |
| Supprimer une tâche | Confirmation avant suppression |
| Modifier le titre | Édition inline avec validation |

---

### FP4 — Gestion des membres

| Fonctionnalité | Description |
|----------------|-------------|
| Ajouter un membre | Par email ou nom — résolution dans Firestore |
| Rôles | Administrateur / Membre |
| Invitations en attente | Si l'email n'a pas de compte, l'invitation est stockée en attente |
| Supprimer un membre | Retirer un membre du projet |

---

### FS1 — Notifications

| Fonctionnalité | Description |
|----------------|-------------|
| Créer une notification | Automatique lors d'actions (ajout, modification, suppression) |
| Panneau de notifications | Panneau flottant avec badge de non-lus |
| Marquer comme lues | Bouton "Tout lire" |
| Effacer | Supprimer toutes les notifications |
| Persistance | Stockées dans localStorage (survit au rechargement) |

---

### FS2 à FS4 — Interface utilisateur

| Fonctionnalité | Description |
|----------------|-------------|
| Thème clair/sombre | Bascule dynamique, persisté dans localStorage |
| Responsive | 4 breakpoints : desktop, tablette, mobile, très petit écran |
| Skeleton loading | Cartes fantômes animées pendant le chargement |
| Animations | Micro-interactions (hover, focus, entrée modals) |
| Page 404 | Illustration SVG animée pour les URLs inexistantes |

---

### FS5 — Sécurité

| Fonctionnalité | Description |
|----------------|-------------|
| Validation mot de passe | 5 règles (longueur ≥ 8, majuscule, minuscule, chiffre, caractère spécial) |
| Validation email | Regex stricte avant appel Firebase |
| Rate limiting | 5 tentatives/min (login), 3/5min (inscription), 3/10min (reset) |
| Sanitisation XSS | Nettoyage des entrées avant envoi à Firestore |
| Firestore Security Rules | Validation des types, longueurs, statuts, appartenance au projet |
| Audit logs | Événements de sécurité envoyés vers Firestore |

---

---

## 2.3 Rétroplanning de développement

| Semaine | Phase | Tâches |
|---------|-------|--------|
| S1 | Conception | Analyse des besoins, diagrammes UML, modèle de données Firestore |
| S2 | Maquettage | Zoning, wireframes, maquettes Figma (6 pages) |
| S3 | Configuration | Installation environnement, Firebase, Docker, ESLint, Vitest |
| S4-5 | Développement core | Authentification, layout, dashboard, CRUD projets |
| S6-7 | Développement tâches | CRUD tâches, statuts, priorités, assignation, membres |
| S8 | Notifications + UX | Panneau notifications, thème clair/sombre, recherche |
| S9 | Sécurité | Rate limiting, sanitisation XSS, Firestore Rules, audit logs |
| S10 | Responsive + design | 4 breakpoints, animations, skeleton, page 404, icônes |
| S11 | Tests + CI/CD | 89 tests unitaires, pipeline GitHub Actions |
| S12 | Déploiement + docs | Vercel, README, commentaires code, dossier projet |

---

**Durée totale : 12 semaines**

---
