# 📊 Structure de la Base de Données Locale - Étrange France

## 🎯 Vue d'ensemble

Cette documentation décrit la structure complète de la base de données SQLite locale utilisée dans l'application Étrange France. La BDD est gérée via Expo SQLite et inclut un système de migration automatique pour assurer la compatibilité entre les versions.

## 🗄️ Tables Implémentées

### 🎭 **Table `characters` - Personnages Joueurs**

```sql
CREATE TABLE characters (
  id TEXT PRIMARY KEY,                    -- UUID généré côté client
  distant_id INTEGER DEFAULT 0,           -- Pour synchronisation future
  name TEXT NOT NULL,                     -- Nom du personnage
  profession TEXT,                        -- Nom de la profession (legacy)
  profession_id INTEGER,                  -- ID de la profession (nouveau)
  profession_score INTEGER DEFAULT 0,     -- Score de profession
  hobby_id INTEGER,                       -- ID du hobby
  hobby_score INTEGER DEFAULT 0,          -- Score de hobby
  divinity_id INTEGER,                    -- ID de la divinité (druide)
  voie_id INTEGER,                        -- ID de la voie étrange
  voie_score INTEGER DEFAULT 0,           -- Score de voie
  
  -- Caractéristiques principales
  intelligence INTEGER DEFAULT 1,
  force INTEGER DEFAULT 1,
  dexterite INTEGER DEFAULT 1,
  charisme INTEGER DEFAULT 1,
  memoire INTEGER DEFAULT 1,
  volonte INTEGER DEFAULT 1,
  
  -- Santé et dégâts
  sante INTEGER DEFAULT 0,
  degats INTEGER DEFAULT 0,
  
  -- Informations RP
  origines TEXT,
  rencontres TEXT,
  notes TEXT,
  equipement TEXT,
  fetiches TEXT,
  trigger_effects TEXT,
  bonuses TEXT,
  avatar TEXT,               -- Chemin local de l'avatar
  avatar_distant TEXT,       -- URL distante de l'avatar
  last_sync_at TEXT,         -- Dernière synchronisation

  -- Clés étrangères
  FOREIGN KEY (profession_id) REFERENCES professions(id),
  FOREIGN KEY (hobby_id) REFERENCES hobbies(id),
  FOREIGN KEY (divinity_id) REFERENCES druide_divinites(id),
  FOREIGN KEY (voie_id) REFERENCES voies_etranges(id)
);
```

### 🌟 **Système de Voies Étranges**

#### Table `voies_etranges`
```sql
CREATE TABLE voies_etranges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distant_id INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `capacites`
```sql
CREATE TABLE capacites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distant_id INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `voie_capacite` (Relation)
```sql
CREATE TABLE voie_capacite (
  voie_id INTEGER NOT NULL,
  capacite_id INTEGER NOT NULL,
  distant_id INTEGER DEFAULT 0,
  PRIMARY KEY (voie_id, capacite_id),
  FOREIGN KEY (voie_id) REFERENCES voies_etranges(id) ON DELETE CASCADE,
  FOREIGN KEY (capacite_id) REFERENCES capacites(id) ON DELETE CASCADE
);
```

#### Table `capacite_rangs`
```sql
CREATE TABLE capacite_rangs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distant_id INTEGER DEFAULT 0,
  capacite_id INTEGER NOT NULL,
  rang INTEGER NOT NULL CHECK (rang >= 1),
  description TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (capacite_id) REFERENCES capacites(id) ON DELETE CASCADE,
  UNIQUE (capacite_id, rang)
);
```

#### Table `character_capacites`
```sql
CREATE TABLE character_capacites (
  distant_id INTEGER DEFAULT 0,
  character_id TEXT NOT NULL,
  capacite_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  last_sync_at TEXT,
  PRIMARY KEY (character_id, capacite_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (capacite_id) REFERENCES capacites(id) ON DELETE CASCADE
);
```

### 💼 **Système de Professions**

#### Table `professions`
```sql
CREATE TABLE professions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distant_id INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT NOT NULL
);
```

#### Table `skills`
```sql
CREATE TABLE skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distant_id INTEGER DEFAULT 0,
  name TEXT NOT NULL UNIQUE
);
```

#### Table `profession_skills` (Relation)
```sql
CREATE TABLE profession_skills (
  distant_id INTEGER DEFAULT 0,
  profession_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  PRIMARY KEY (profession_id, skill_id),
  FOREIGN KEY (profession_id) REFERENCES professions(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
```

#### Table `character_skills`
```sql
CREATE TABLE character_skills (
  distant_id INTEGER DEFAULT 0,
  character_id TEXT NOT NULL,
  skill_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  last_sync_at TEXT,
  PRIMARY KEY (character_id, skill_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
```

### 🎨 **Système de Hobbies**

```sql
CREATE TABLE hobbies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distant_id INTEGER DEFAULT 0,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 🛐 **Système Druidique**

```sql
CREATE TABLE druide_divinites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  domaine TEXT,
  description TEXT
);
```

### 🃏 **Système de Deck**

```sql
CREATE TABLE desk (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id TEXT NOT NULL,
  figure TEXT NOT NULL CHECK (figure IN ('Carreau','Coeur','Trèfle','Pique')),
  cards TEXT NOT NULL,
  last_sync_at TEXT,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
```

## 🔧 **Index de Performance**

```sql
-- Index sur les relations fréquemment utilisées
CREATE INDEX idx_voie_capacite_voie_id ON voie_capacite(voie_id);
CREATE INDEX idx_character_capacites_character_id ON character_capacites(character_id);
CREATE INDEX idx_profession_skills_skill_id ON profession_skills(skill_id);
CREATE INDEX idx_character_skills_character_id ON character_skills(character_id);
CREATE INDEX idx_desk_character_id ON desk(character_id);
CREATE INDEX idx_characters_profession_id ON characters(profession_id);
CREATE INDEX idx_characters_divinity_id ON characters(divinity_id);
```

## 🔄 **Système de Migration Automatique**

La base de données inclut un système de migration automatique qui vérifie et ajoute les colonnes manquantes au démarrage :

```typescript
// Exemple de migration automatique
const columns = await database.getAllAsync("PRAGMA table_info(characters);");
const hasProfessionId = columns.some((c: any) => c.name === "profession_id");
if (!hasProfessionId) {
  await database.execAsync("ALTER TABLE characters ADD COLUMN profession_id INTEGER;");
}
```

### Colonnes migrées automatiquement :
- `profession_id` dans `characters`
- `divinity_id` dans `characters`
- `sante` dans `characters`
- `degats` dans `characters`
- `origines` dans `characters`
- `rencontres` dans `characters`
- `notes` dans `characters`
- `equipement` dans `characters`
- `fetiches` dans `characters`
- `trigger_effects` dans `characters`
- `bonuses` dans `characters`
- `avatar` dans `characters`
- `avatar_distant` dans `characters`
- `distant_id` dans `voie_capacite`
- `last_sync_at` dans `characters`
- `last_sync_at` dans `character_capacites`
- `last_sync_at` dans `character_skills`
- `last_sync_at` dans `desk`

## 📊 **Types TypeScript Correspondants**

### Interface Character (types/character.ts)
```typescript
export interface Character {
  id: string;
  name: string;
  species: string;
  profession: string;
  voice: string;
  
  characteristics: {
    force: number;
    agilite: number;
    intelligence: number;
    volonte: number;
    resistance: number;
    charisme: number;
  };
  
  skills: Record<string, number>;
  
  health: {
    current: number;
    max: number;
    wounds: string[];
  };
  
  experience: {
    current: number;
    total: number;
    level: number;
  };
  
  inventory: Item[];

  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  avatar_distant?: string;
  last_sync_at?: string;
}
```

### Interface Session (types/session.ts)
```typescript
export interface Session {
  id: string;
  name: string;
  description: string;
  gameDate: Date;
  masterId: string;
  playerIds: string[];
  characterIds: string[];
  status: 'pending' | 'active' | 'paused' | 'completed';
  chatMessages: ChatMessage[];
  diceRolls: DiceRoll[];
  settings: {
    allowPrivateMessages: boolean;
    allowPlayerDiceRolls: boolean;
    voiceChannelId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 **Fonctionnalités Avancées**

### 1. **Préparation pour Synchronisation**
- Toutes les tables incluent un champ `distant_id` pour la synchronisation future
- Structure compatible avec une architecture client-serveur

### 2. **Gestion des Contraintes**
- Contraintes CHECK sur les rangs de capacités (`rang >= 1`)
- Contraintes CHECK sur les figures du deck (`IN ('Carreau','Coeur','Trèfle','Pique')`)
- Clés étrangères avec CASCADE pour maintenir l'intégrité référentielle

### 3. **Timestamps Automatiques**
- `created_at` et `updated_at` sur les tables principales
- Gestion automatique des métadonnées temporelles

## 📈 **Statistiques de la Base**

- **Nombre de tables** : 12 tables principales
- **Relations** : 8 tables de liaison
- **Index** : 8 index de performance
- **Contraintes** : 15+ clés étrangères
- **Migration** : 11+ colonnes migrées automatiquement

## 🔮 **Évolutions Futures Prévues**

### Tables à Implémenter (selon la documentation)
- `users` - Gestion des utilisateurs
- `user_sessions` - Sessions utilisateur
- `game_sessions` - Sessions de jeu
- `session_participants` - Participants aux sessions
- `chat_messages` - Messages de chat
- `dice_rolls` - Jets de dés
- `shared_files` - Fichiers partagés
- `game_logs` - Logs de jeu
- `system_logs` - Logs système
- `npcs` - Personnages non-joueurs
- `items` - Objets/équipement
- `character_inventory` - Inventaire des personnages

### Améliorations Recommandées
1. **Validation des données** : Ajouter des contraintes CHECK sur les caractéristiques
2. **Gestion des erreurs** : Wrapper pour les opérations SQL
3. **Backup automatique** : Système de sauvegarde
4. **Compression** : Optimisation de l'espace de stockage
5. **Cache** : Mise en cache des requêtes fréquentes

---

*Dernière mise à jour : Structure actuelle de la BDD locale d'Étrange France*