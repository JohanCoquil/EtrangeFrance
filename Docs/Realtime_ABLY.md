# Intégration ABLY temps réel

Ce répertoire introduit des composants UI prêts à l'emploi qui s'appuient sur l'API [Ably Realtime](https://ably.com/) pour la messagerie instantanée, le partage d'images et la diffusion des tirages de jeu. Aucune modification n'est apportée aux écrans actuels : il suffit d'instancier les composants dans les vues existantes après avoir fourni un client Ably.

## 1. Initialiser le client Ably

1. **Déclarer la clé API** : Expo expose automatiquement les variables d'environnement commençant par `EXPO_PUBLIC_`. Ajoute ta clé dans un fichier `.env` (non versionné) :

   ```bash
   # .env.local
   EXPO_PUBLIC_ABLY_API_KEY=xxxxx:yyyyyy
   ```

   Ou bien renseigne `EXPO_PUBLIC_ABLY_API_KEY` dans ton environnement CI/CD.

2. **Lire la clé côté app** : le provider `AblyProvider` s'occupe d'initialiser `Ably.Realtime`. Place-le dans `App.tsx` (ou dans le navigator ciblé) :

   ```tsx
   import { AblyProvider } from '@/context/AblyProvider';

   const ABLY_API_KEY = process.env.EXPO_PUBLIC_ABLY_API_KEY;

   export default function App() {
     return (
       <AblyProvider apiKey={ABLY_API_KEY} clientId={currentPlayerId}>
         {/* le reste de l'application */}
       </AblyProvider>
     );
   }
   ```

   - `apiKey` est obligatoire (ou fournis `authUrl` pour la token auth Ably).
   - `clientId` est optionnel mais utile pour identifier les messages/presence.
   - Le provider expose également `useAblyConnectionState()` pour suivre l'état (`connected`, `disconnected`, etc.) si besoin.

3. **Sécurité** : ne commite jamais la clé API. Utilise les variables d'environnement Expo (`EXPO_PUBLIC_*`) ou un proxy d'authentification Ably (`authUrl`).

## 2. Hooks et utilitaires

- `useAblyChannel(channelName, options)` gère l'attachement au canal, les abonnements aux events (`events`), et expose deux helpers :
  - `publish(eventName, data)` renvoie une `Promise` qui se résout quand le message est accepté par Ably.
  - `fetchHistory(params)` récupère l'historique (`channel.history`).

Toutes les opérations asynchrones sont encapsulées pour éviter de manipuler les callbacks Ably directement dans les composants UI.

## 3. Composants disponibles

### `RealtimeChat`

| Prop              | Description |
|-------------------|-------------|
| `channelName`     | Nom du canal Ably (ex. `scenario:123:chat`). |
| `currentUser`     | `{ id: string; name: string; }` utilisé pour annoter les messages envoyés. |
| `messageLimit`    | Nombre maximum de messages conservés en mémoire (défaut : 100). |
| `placeholder`     | Texte du champ de saisie. |
| `emptyStateText`  | Texte d'état vide. |

Fonctionnalités :
- Récupère l'historique récent (`channel.history`).
- Déduplication des messages grâce à l'`id` embarqué dans le payload (`uuid`).
- Style simple (bulles gauche/droite) adaptable via un wrapper externe.

### `RealtimeImageBroadcast`

| Prop              | Description |
|-------------------|-------------|
| `channelName`     | Canal Ably utilisé (ex. `scenario:123:images`). |
| `currentUser`     | Identité du MJ / joueur. |
| `isGameMaster`    | Active les contrôles d'émission (URL + picker). |
| `historyLimit`    | Nombre de diffusions mémorisées (défaut : 10). |
| `emptyStateText`  | Texte affiché si aucune image n'a été reçue. |

Fonctionnalités :
- Le MJ peut diffuser soit une URL d'image publique, soit un fichier de la galerie (encodé en base64).
- Les messages incluent `caption`, `mimeType`, `senderName` pour enrichir l'affichage.
- Un mini carrousel horizontal liste les diffusions précédentes.
- Attention à la taille des images encodées : Ably limite les messages à ~64 Ko. Un avertissement s'affiche quand l'image dépasse ~60 Ko.

### `RealtimeDrawFeed`

| Prop              | Description |
|-------------------|-------------|
| `channelName`     | Canal Ably (`scenario:123:draws`). |
| `currentUser`     | Joueur courant. |
| `historyLimit`    | Taille du flux partagé (défaut : 50). |
| `diceOptions`     | Liste personnalisable des dés proposés (défaut : d4 → d100). |
| `emptyStateText`  | Texte affiché si aucun tirage. |

Fonctionnalités :
- Gestion d'un nombre de dés (1 → 10), modificateur numérique et étiquette du tirage.
- Calcul du total + détails des jets, historisés et synchronisés avec les autres joueurs.
- Mise en avant des tirages effectués par l'utilisateur courant.

## 4. Bonnes pratiques

- **Nomenclature des canaux** : garde une structure cohérente (`scenario:{id}:{feature}`) pour éviter les collisions.
- **Déconnexion propre** : `AblyProvider` ferme la connexion lors de l'unmount et `useAblyChannel` détache les canaux pour éviter les fuites.
- **Test** : pour vérifier rapidement, tu peux instancier les composants dans un écran de test et lancer deux sessions Expo (web + mobile) avec la même clé API.
- **Évolution** : les composants sont volontairement découplés. Si tu as besoin d'une logique supplémentaire (moderation, logs, etc.), tu peux dériver le hook `useAblyChannel`.

## 5. Exemple d'assemblage

```tsx
import { RealtimeChat, RealtimeImageBroadcast, RealtimeDrawFeed } from '@/components/realtime';

function ScenarioRealtimePane({ scenarioId, currentUser, isGameMaster }: Props) {
  return (
    <>
      <RealtimeChat channelName={`scenario:${scenarioId}:chat`} currentUser={currentUser} />
      <RealtimeImageBroadcast
        channelName={`scenario:${scenarioId}:images`}
        currentUser={currentUser}
        isGameMaster={isGameMaster}
      />
      <RealtimeDrawFeed channelName={`scenario:${scenarioId}:draws`} currentUser={currentUser} />
    </>
  );
}
```

En résumé : installe la clé Ably via une variable d'environnement Expo, entoure ton application avec `AblyProvider`, puis insère les composants dans les écrans où tu veux la synchronisation temps réel.
