# 🏗️ Architecture recommandée pour Étrange France

## 📁 Structure de dossiers proposée

```
src/
├── api/                     # Configuration API et services
│   ├── queryClient.ts      ✅ (existant)
│   ├── services/           # Services API par domaine
│   │   ├── characters.ts   
│   │   ├── sessions.ts     
│   │   ├── pnj.ts          
│   │   └── auth.ts         
│   └── websocket.ts        # WebSocket pour temps réel
├── components/             # Composants réutilisables
│   ├── ui/                 # Composants UI de base
│   │   ├── Button.tsx      
│   │   ├── Input.tsx       
│   │   └── Modal.tsx       
│   ├── game/               # Composants spécifiques au jeu
│   │   ├── DiceRoller.tsx  
│   │   ├── CharacterCard.tsx
│   │   └── SessionChat.tsx 
│   └── forms/              # Composants de formulaires
│       ├── CharacterForm.tsx
│       └── SessionForm.tsx
├── hooks/                  # Hooks personnalisés
│   ├── useCharacters.ts    
│   ├── useSessions.ts      
│   ├── useWebSocket.ts     
│   └── useDice.ts          
├── navigation/             # Navigation
│   ├── RootNavigator.tsx   ✅ (existant)
│   ├── types.ts           ✅ (existant)
│   └── TabNavigator.tsx    # Navigation par onglets
├── screens/               # Écrans principaux
│   ├── auth/              # Écrans d'authentification
│   ├── character/         # Écrans de personnages
│   ├── session/           # Écrans de session
│   ├── agency/            # Écrans d'agence
│   └── settings/          # Écrans de paramètres
├── store/                 # Gestion d'état
│   ├── atoms/             # Atoms Jotai
│   │   ├── characters.ts  
│   │   ├── sessions.ts    
│   │   └── ui.ts          
│   └── selectedCharacterAtom.ts ✅ (existant)
├── types/                 # Types TypeScript
│   ├── character.ts       
│   ├── session.ts         
│   ├── pnj.ts             
│   └── api.ts             
├── utils/                 # Utilitaires
│   ├── dice.ts            # Logique des dés
│   ├── character.ts       # Utilitaires personnages
│   ├── storage.ts         # Gestion stockage local
│   └── validation.ts      # Validation des données
├── constants/             # Constantes du jeu
│   ├── gameRules.ts       
│   ├── species.ts         
│   ├── professions.ts     
│   └── voices.ts          
└── assets/                # Assets spécifiques
    ├── sounds/            
    ├── images/            
    └── data/              # Données JSON statiques
```

## 🔧 Corrections immédiates à apporter

### 1. Nettoyer la navigation
- Supprimer `AppNavigator.tsx` (doublon)
- Garder uniquement `RootNavigator.tsx`
- Centraliser les types dans `types.ts`

### 2. Uniformiser les styles
- Remplacer tous les styles inline par NativeWind
- Créer un système de design cohérent

### 3. Ajouter la navigation par onglets
- Prévoir une navigation par onglets pour les fonctionnalités principales
- Séparer navigation publique/privée si authentification

## 📱 Navigation recommandée

```
RootNavigator (Stack)
├── AuthStack (si auth nécessaire)
│   ├── Login
│   └── Register
└── MainTabs (Bottom Tabs)
    ├── Home
    ├── Characters
    ├── Sessions
    └── Agency
```

## 🎯 Prochaines étapes suggérées

1. **Nettoyer l'architecture actuelle** (corrections immédiates)
2. **Créer les types de données** selon les spécifications
3. **Développer les composants de base** (Button, Input, etc.)
4. **Implémenter la gestion des personnages** (création, édition)
5. **Ajouter la logique des dés** et mécaniques de jeu
6. **Intégrer WebSocket** pour les sessions temps réel
7. **Ajouter Agora.io** pour l'audio
8. **Implémenter le stockage local** avec expo-sqlite

Cette architecture évolutive permettra de développer toutes les fonctionnalités spécifiées tout en maintenant un code propre et maintenable. 