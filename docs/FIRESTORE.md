# Firestore — structure et securite

Ce document explique comment les donnees sont organisees dans Firebase et comment proteger l acces.

## 1) Vue d ensemble (simple)

```
users/                    → profils utilisateurs
projects/                 → groupes / listes collaboratives
  └── {projectId}/tasks/  → taches d un projet
```

Chaque utilisateur connecte ne voit que :
- son profil (et les profils des autres membres pour afficher les noms),
- les projets dont il fait partie (`memberUids`),
- les taches de ces projets.

---

## 2) Structure des collections

### Collection `users` — document ID = `uid` Firebase Auth

| Champ       | Type     | Description                          |
|------------|----------|--------------------------------------|
| `uid`      | string   | Identifiant Firebase (meme que l ID) |
| `name`     | string   | Nom affiche                          |
| `email`    | string   | Email de connexion                   |
| `role`     | string   | Optionnel (`Admin`, `Membre`, …)     |
| `updatedAt`| timestamp| Derniere mise a jour                 |

**Exemple :**

```json
{
  "uid": "abc123firebase",
  "name": "Yosra Essid",
  "email": "yosra@email.com",
  "role": "Admin",
  "updatedAt": "2026-06-02T12:00:00Z"
}
```

Chemin Firestore : `users/abc123firebase`

---

### Collection `projects` — document ID = `id` du projet (nombre)

| Champ         | Type      | Description                              |
|--------------|-----------|------------------------------------------|
| `id`         | number    | Identifiant du projet (ex: `102`)        |
| `name`       | string    | Nom du groupe                            |
| `description`| string    | Description courte                       |
| `memberUids` | array     | Liste des `uid` membres du projet        |
| `createdAt`  | timestamp | Date de creation                         |

**Exemple :**

```json
{
  "id": 102,
  "name": "To-do collaborative",
  "description": "Liste principale de l equipe",
  "memberUids": ["abc123firebase", "def456firebase"],
  "createdAt": "2026-06-02T12:00:00Z"
}
```

Chemin Firestore : `projects/102`

---

### Sous-collection `tasks` — document ID = `id` de la tache

| Champ          | Type      | Description                                    |
|---------------|-----------|------------------------------------------------|
| `id`          | number    | Identifiant de la tache                        |
| `title`       | string    | Titre                                          |
| `description` | string    | Detail                                         |
| `status`      | string    | `A faire` \| `En cours` \| `Terminee`          |
| `priority`    | string    | `Haute` \| `Moyenne` \| `Basse`                |
| `deadline`    | string    | Date ou `—`                                    |
| `assigneeUid` | string    | `uid` du membre assigne (pas un nombre)        |
| `createdAt`   | timestamp | Date de creation                               |

**Exemple :**

```json
{
  "id": 1001,
  "title": "Faire la page accueil",
  "description": "Ecrire une presentation simple",
  "status": "A faire",
  "priority": "Haute",
  "deadline": "2026-06-10",
  "assigneeUid": "abc123firebase",
  "createdAt": "2026-06-02T12:00:00Z"
}
```

Chemin Firestore : `projects/102/tasks/1001`

> **Note :** dans le code React, le champ s appelle `assigneeId` pour l affichage. Dans Firestore, il est enregistre sous `assigneeUid`.

---

## 3) Regles de securite

### Version production (recommandee)

Fichier : `firestore.rules` (a la racine du projet)

- Seuls les utilisateurs **connectes** peuvent lire/ecrire.
- Un utilisateur ne modifie que **son** document dans `users`.
- Un projet n est visible que si ton `uid` est dans `memberUids`.
- Les taches suivent les memes droits que le projet parent.

### Version test / debutant (temporaire)

Fichier : `firestore.rules.dev`

- Tout utilisateur connecte peut tout lire/ecrire.
- Utile pour deboguer au debut.
- **A remplacer** par `firestore.rules` avant la mise en production.

### Deployer les regles dans Firebase

1. Installer Firebase CLI : `npm install -g firebase-tools`
2. Se connecter : `firebase login`
3. Lier le projet : `firebase use --add` (choisir ton projet)
4. Deployer : `firebase deploy --only firestore:rules`

Ou coller le contenu de `firestore.rules` dans la console Firebase :
**Firestore Database → Regles → Publier**

---

## 4) Index Firestore

La requete suivante est utilisee dans l app :

```
projects where memberUids array-contains {uid}
```

Firestore cree automatiquement l index pour `array-contains` sur un seul champ. Aucun index composite supplementaire n est necessaire pour l instant.

---

## 5) Premier projet automatique

Quand un nouvel utilisateur n a encore aucun projet, l application cree un projet par defaut :

- Nom : **Mon espace**
- Description : **Projet personnel cree automatiquement**
- Membre : l utilisateur connecte uniquement

Cela evite un dashboard vide apres la premiere inscription.

---

## 6) Ajouter un membre a un groupe (par email)

1. L utilisateur invite doit **deja avoir un compte** (inscription faite).
2. Sur la page Equipes, saisir les emails separes par des virgules.
3. L app cherche chaque email dans `users` et ajoute le `uid` trouve dans `memberUids`.

Si l email n existe pas encore dans Firebase, il ne sera pas ajoute (pas d erreur bloquante).

---

## 7) Fichier d exemples JSON

Voir [`firestore-examples.json`](firestore-examples.json) pour des exemples concrets a recreer manuellement dans la console Firebase (mode test).
