
# 🧠 Projet : *Étrange France – Assistant JDR*

## 🎯 Objectif
Créer une application mobile en **React Native** pour accompagner les joueurs et le MJ du jeu de rôle *Étrange France*. Elle permet de gérer les personnages, les parties, les échanges, et la narration audio/visuelle.

---

## ⚙️ Stack technique

### 💻 Frontend (app mobile)
- **Framework :** React Native via [Expo](https://expo.dev)
- **Navigation :** `@react-navigation/native`, `@react-navigation/native-stack`, `bottom-tabs`
- **Style :**
  - `nativewind` (TailwindCSS pour React Native)
  - `tailwind.config.js` personnalisé
- **State Management :** [`jotai`](https://jotai.org/)
- **App logic :** TypeScript
- **Animations :** `react-native-reanimated`
- **Assets & Partage :** `expo-image-picker`, `expo-sharing`

### 🔄 Synchronisation & Backend
- **API client :** `@tanstack/react-query`
- **Stockage local (offline) :** `expo-sqlite` pour cache et gestion hors-ligne
- **Synchronisation distante :**
  - **Render.com** (hébergement API + WebSocket + images partagées)
  - **WebSockets** pour synchronisation en temps réel
- **Compte & session :**
  - Auth facultative (pas d'auth OAuth complexe prévue)
  - Système de session MJ / joueurs

### 🔊 Communication
- **Vocal (temps réel) :** [`Agora.io`](https://www.agora.io/)
  - Création de salons vocaux de session
  - Permissions simples MJ / joueurs
- **Chat texte & actions :**
  - Interface de messagerie privée
  - Affichage des jets de dés
  - Annonces MJ
  - Partage d’images / documents

---

## 📚 Fonctionnalités

### 📋 Gestion de personnages (PJ)
- Création complète de PJ (caractéristiques, espèces, métiers, compétences)
- Attribution de voix étranges
- Ajout d’objets à l’inventaire
- Système d’XP et de montée en niveau
- Suivi des blessures et points de vie
- Génération aléatoire de personnages
- Mode hors-ligne (avant session)

### 🤖 PNJ
- Création et gestion de PNJ par le MJ
- Génération aléatoire possible (type, métier, étrangeté)
- Stockage et annotation libre

### 🧪 Mécaniques de jeu
- Émulation de jets de dés (D10, D100…)
- Calcul des résultats selon règles du système
- Partage des résultats dans le chat
- Journal de partie automatique (optionnel)

### 🕸️ Sessions de jeu
- Création d’une session (MJ)
- Invitation des joueurs
- Partage d’affichages, documents, images (table virtuelle)
- Communication :
  - Chat textuel (privé/public)
  - Salon vocal avec Agora
- Contrôle MJ :
  - Envoi d’images (indices)
  - Déclenchements synchronisés (sons, événements)
  - Dés en commun ou individuels

### 🧱 Données & métadonnées (stockées en BDD)
- PJ & PNJ
- Caractéristiques, métiers, espèces, voix étranges
- Sessions
- Objets & inventaire
- Messages & fichiers partagés
- Historique des jets & logs de partie

### 🧰 Environnement de développement
- **VS Code**
- **Continue** (plugin IA connecté à OpenAI API)
- **Cursor (optionnel)** pour test d’environnement IA assisté
- **OpenAI GPT-4o** pour assistance continue à l’écriture et aux tests
