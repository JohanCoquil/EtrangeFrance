# 🎮 Gestion des Sessions de Jeu - Étrange France

## 🎯 Vue d'ensemble

Ce document définit la structure et le workflow pour la gestion des sessions de jeu dans l'application Étrange France.

## 🔄 Workflow proposé

### **Hiérarchie des concepts :**
```
Scénario (template)
    ↓
Partie (instance du scénario avec MJ + joueurs)
    ↓
Sessions (0 à n sessions de jeu dans cette partie)
```

### **Workflow détaillé**

#### **1. Création d'une partie (déjà implémenté)**
- MJ crée une partie liée à un scénario
- Joueurs rejoignent la partie via QR code

#### **2. Gestion des sessions**
- **MJ** : Peut créer des sessions dans ses parties
- **Joueurs** : Peuvent voir l'historique et rejoindre une session active

#### **3. États des sessions**
- `scheduled` : Session programmée (pas encore commencée)
- `active` : Session en cours (joueurs peuvent rejoindre)
- `paused` : Session en pause temporaire
- `completed` : Session terminée (résumé disponible)
- `cancelled` : Session annulée

## 🗄️ Structure BDD

### **Table `sessions`**

```sql
CREATE TABLE sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Référence à la partie (INT pour correspondre à parties.id)
    partie_id INT REFERENCES parties(id) ON DELETE CASCADE,
    
    -- Informations de base
    name VARCHAR(100) NOT NULL, -- "Session 1", "La rencontre mystérieuse", etc.
    description TEXT, -- Description de la session
    
    -- État de la session
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'paused', 'completed', 'cancelled')),
    
    -- Dates et horaires
    scheduled_date TIMESTAMP, -- Date/heure programmée
    started_at TIMESTAMP, -- Quand la session a réellement commencé
    ended_at TIMESTAMP, -- Quand la session s'est terminée
    duration_minutes INTEGER, -- Durée réelle en minutes
    
    -- Résumé et compte-rendu (pour les sessions terminées)
    summary TEXT, -- Résumé de la session
    key_events JSON, -- Événements marquants : [{"event": "Rencontre avec le PNJ X", "timestamp": "2025-01-19T15:30:00Z"}]
    character_developments JSON, -- Évolutions des personnages
    notes TEXT, -- Notes du MJ
    
    -- Paramètres de la session
    max_players INTEGER DEFAULT 6,
    allow_late_join BOOLEAN DEFAULT true, -- Permettre de rejoindre en cours
    voice_channel_id VARCHAR(100), -- ID du salon vocal Agora
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Note: created_by supprimé car on peut récupérer le MJ via parties.mj_id
);
```

### **Table `session_presence` (présence en temps réel)**

```sql
CREATE TABLE session_presence (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    session_id VARCHAR(36) REFERENCES sessions(id) ON DELETE CASCADE,
    user_id INT(11) REFERENCES users(id) ON DELETE CASCADE,
    character_id CHAR(36) REFERENCES characters(id) ON DELETE SET NULL,
    
    -- État de connexion
    is_online BOOLEAN DEFAULT true,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Métadonnées
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    
    UNIQUE(session_id, user_id) -- Un utilisateur ne peut être connecté qu'une fois par session
);
```

### **Table `session_participants` (participants historiques)**

```sql
CREATE TABLE session_participants (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    session_id VARCHAR(36) REFERENCES sessions(id) ON DELETE CASCADE,
    user_id INT(11) REFERENCES users(id) ON DELETE CASCADE,
    character_id CHAR(36) REFERENCES characters(id) ON DELETE SET NULL,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('master', 'player', 'observer')),
    
    -- Historique de participation
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    total_time_minutes INTEGER, -- Temps total passé dans la session
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

## 📱 Interface utilisateur

### **Pour le MJ :**
1. **Liste des parties** → Sélectionner une partie
2. **Gestion des sessions** :
   - Voir l'historique des sessions
   - Créer une nouvelle session
   - Démarrer/Arrêter une session active
   - Rédiger le résumé d'une session terminée
   - Voir qui est connecté en temps réel

### **Pour les joueurs :**
1. **Liste des parties** → Sélectionner une partie
2. **Historique des sessions** :
   - Voir les sessions passées avec résumés
   - Rejoindre une session active (bouton "Rejoindre")
   - Voir les sessions programmées
   - Voir qui est connecté à la session

## 🎮 Fonctionnalités clés

### **Création de session (MJ)**
```typescript
interface CreateSessionRequest {
  partie_id: number; // INT pour correspondre à la BDD
  name: string;
  description?: string;
  scheduled_date?: Date;
  max_players?: number;
  allow_late_join?: boolean;
}
```

### **Rejoindre une session (Joueur)**
```typescript
interface JoinSessionRequest {
  session_id: string;
  character_id: string; // Personnage utilisé
}
```

### **Gestion des états**
- **Scheduled → Active** : MJ démarre la session
- **Active → Paused** : Pause temporaire
- **Active → Completed** : Fin de session + résumé
- **Active → Cancelled** : Annulation

### **Gestion de la présence**
- **Connexion** : Ajouter dans `session_presence`
- **Déconnexion** : Marquer `is_online = false` et `left_at`
- **Reconnexion** : Mettre à jour `is_online = true` et `last_seen`

## 🔌 API endpoints nécessaires

```typescript
// Sessions
GET /api/sessions?partie_id={id} // Liste des sessions d'une partie
POST /api/sessions // Créer une session
PUT /api/sessions/{id} // Modifier une session
POST /api/sessions/{id}/start // Démarrer une session
POST /api/sessions/{id}/end // Terminer une session
POST /api/sessions/{id}/join // Rejoindre une session
POST /api/sessions/{id}/leave // Quitter une session

// Présence
GET /api/sessions/{id}/presence // Qui est connecté à la session
POST /api/sessions/{id}/presence // Se connecter à la session
DELETE /api/sessions/{id}/presence // Se déconnecter de la session

// Participants
GET /api/sessions/{id}/participants // Participants d'une session
POST /api/sessions/{id}/participants // Ajouter un participant
```

## 🎯 Avantages de cette structure

1. **Flexibilité** : Une partie peut avoir plusieurs sessions
2. **Historique** : Résumés et compte-rendus des sessions passées
3. **Gestion d'état** : États clairs pour l'interface utilisateur
4. **Présence temps réel** : Savoir qui est connecté à tout moment
5. **Évolutivité** : Facile d'ajouter de nouvelles fonctionnalités
6. **Cohérence** : S'intègre parfaitement avec la structure existante

## 🔄 Intégration avec le système existant

### **Liens avec les tables existantes :**
- `sessions.partie_id` → `parties.id` (INT)
- `sessions` → `parties.mj_id` (pour récupérer le MJ)
- `session_presence.user_id` → `users.id`
- `session_presence.character_id` → `characters.id`

### **Compatibilité avec le système de cartes :**
- Les tirages de cartes peuvent être liés à une session
- Historique des tirages par session
- Partage des résultats dans le chat de session

## 📊 Exemples d'utilisation

### **Créer une session**
```sql
INSERT INTO sessions (partie_id, name, description, scheduled_date, max_players)
VALUES (123, 'Session 1 - La rencontre mystérieuse', 'Première session de la campagne', '2025-01-20 20:00:00', 4);
```

### **Rejoindre une session**
```sql
INSERT INTO session_presence (session_id, user_id, character_id, is_online)
VALUES ('session-uuid', 'user-uuid', 'character-uuid', true);
```

### **Voir qui est connecté**
```sql
SELECT u.username, c.name as character_name, sp.joined_at, sp.last_seen
FROM session_presence sp
JOIN users u ON sp.user_id = u.id
LEFT JOIN characters c ON sp.character_id = c.id
WHERE sp.session_id = 'session-uuid' AND sp.is_online = true;
```

---

*Document créé le 19 septembre 2025 - Version 1.0*
