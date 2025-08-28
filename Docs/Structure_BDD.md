# 🗄️ Structure de Base de Données - Étrange France

## 🎯 Vue d'ensemble

Cette structure de BDD couvre toutes les fonctionnalités spécifiées :
- 👥 Gestion des utilisateurs et authentification
- 🎭 Personnages (PJ) avec caractéristiques complètes
- 🤖 PNJ et entités du jeu
- 🎲 Sessions de jeu et mécaniques
- 💬 Communication (chat, dés)
- 📁 Stockage de fichiers partagés
- 📊 Logs et historique

---

## 👥 **Gestion des Utilisateurs**

### **users**
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'master', 'admin')),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

### **user_sessions** (authentification)
```sql
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎭 **Système de Personnages**

### **species** (espèces)
```sql
CREATE TABLE species (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    bonus_force INTEGER DEFAULT 0,
    bonus_agilite INTEGER DEFAULT 0,
    bonus_intelligence INTEGER DEFAULT 0,
    bonus_volonte INTEGER DEFAULT 0,
    bonus_resistance INTEGER DEFAULT 0,
    bonus_charisme INTEGER DEFAULT 0,
    special_abilities JSON, -- JSON de capacités spéciales: ["capacité1", "capacité2"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **professions** (métiers)
```sql
CREATE TABLE professions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    skill_bonuses JSON, -- {"investigation": 20, "combat": 15, ...}
    starting_equipment JSON, -- JSON d'équipements: ["item1", "item2"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **voices** (voix étranges)
```sql
CREATE TABLE voices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    power_description TEXT,
    limitation TEXT,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **characters** (personnages joueurs)
```sql
CREATE TABLE characters (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species_id INT REFERENCES species(id),
    profession_id INT REFERENCES professions(id),
    voice_id INT REFERENCES voices(id),
    avatar VARCHAR(255),
    avatar_distant VARCHAR(255),
    
    -- Caractéristiques principales
    force INTEGER DEFAULT 8 CHECK (force >= 1 AND force <= 20),
    agilite INTEGER DEFAULT 8 CHECK (agilite >= 1 AND agilite <= 20),
    intelligence INTEGER DEFAULT 8 CHECK (intelligence >= 1 AND intelligence <= 20),
    volonte INTEGER DEFAULT 8 CHECK (volonte >= 1 AND volonte <= 20),
    resistance INTEGER DEFAULT 8 CHECK (resistance >= 1 AND resistance <= 20),
    charisme INTEGER DEFAULT 8 CHECK (charisme >= 1 AND charisme <= 20),
    
    -- Compétences (JSON pour flexibilité)
    skills JSON DEFAULT '{}', -- {"investigation": 45, "combat": 30, ...}
    
    -- Santé et état
    health_current INTEGER DEFAULT 10,
    health_max INTEGER DEFAULT 10,
    wounds JSON, -- JSON de blessures: ["blessure1", "blessure2"]
    
    -- Expérience
    experience_current INTEGER DEFAULT 0,
    experience_total INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    
    -- Métadonnées
    avatar_url VARCHAR(500),
    backstory TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

### **items** (objets et équipements)
```sql
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- "weapon", "armor", "tool", "consumable", etc.
    properties JSON, -- Propriétés flexibles selon le type d'objet
    base_price INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common',
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **character_inventory** (inventaire des personnages)
```sql
CREATE TABLE character_inventory (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    character_id VARCHAR(36) REFERENCES characters(id) ON DELETE CASCADE,
    item_id INT REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    is_equipped BOOLEAN DEFAULT false,
    notes TEXT,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🤖 **PNJ et Entités**

### **npcs** (personnages non-joueurs)
```sql
CREATE TABLE npcs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    created_by VARCHAR(36) REFERENCES users(id), -- MJ qui a créé le PNJ
    name VARCHAR(100) NOT NULL,
    description TEXT,
    species_id INT REFERENCES species(id),
    profession_id INT REFERENCES professions(id),
    
    -- Caractéristiques simplifiées
    characteristics JSON DEFAULT '{}', -- {"force": 10, "agilite": 12, ...}
    
    -- Informations du MJ
    notes TEXT,
    role VARCHAR(50), -- "ally", "enemy", "neutral", "merchant", etc.
    location VARCHAR(100),
    
    -- Relation avec session (optionnel)
    session_id VARCHAR(36) REFERENCES game_sessions(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

---

## 🎲 **Sessions de Jeu**

### **game_sessions** (sessions de jeu)
```sql
CREATE TABLE game_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    master_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Paramètres de la session
    max_players INTEGER DEFAULT 6,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled')),
    
    -- Paramètres de communication
    allow_private_messages BOOLEAN DEFAULT true,
    allow_player_dice_rolls BOOLEAN DEFAULT true,
    voice_channel_id VARCHAR(100), -- ID du salon vocal Agora
    
    -- Dates
    scheduled_date TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **session_participants** (participants aux sessions)
```sql
CREATE TABLE session_participants (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    session_id VARCHAR(36) REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    character_id VARCHAR(36) REFERENCES characters(id) ON DELETE SET NULL,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('master', 'player', 'observer')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(session_id, user_id) -- Un utilisateur ne peut participer qu'une fois par session
);
```

---

## 💬 **Communication et Interactions**

### **chat_messages** (messages de chat)
```sql
CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    session_id VARCHAR(36) REFERENCES game_sessions(id) ON DELETE CASCADE,
    sender_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contenu du message
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'dice', 'system', 'private', 'action')),
    
    -- Messages privés
    target_user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE, -- NULL = message public
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);
```

### **dice_rolls** (lancers de dés)
```sql
CREATE TABLE dice_rolls (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    session_id VARCHAR(36) REFERENCES game_sessions(id) ON DELETE CASCADE,
    player_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    character_id VARCHAR(36) REFERENCES characters(id) ON DELETE SET NULL,
    
    -- Détails du lancer
    dice_type VARCHAR(10) NOT NULL, -- "D10", "D100", etc.
    result INTEGER NOT NULL,
    modifier INTEGER DEFAULT 0,
    total INTEGER NOT NULL,
    
    -- Contexte
    reason TEXT, -- "Test de Force", "Attaque au couteau", etc.
    skill_used VARCHAR(50), -- Compétence utilisée
    difficulty INTEGER, -- Seuil de difficulté
    is_success BOOLEAN,
    is_critical BOOLEAN DEFAULT false,
    
    -- Visibilité
    is_private BOOLEAN DEFAULT false, -- Lancer secret du MJ
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📁 **Stockage et Partage**

### **shared_files** (fichiers partagés)
```sql
CREATE TABLE shared_files (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    session_id VARCHAR(36) REFERENCES game_sessions(id) ON DELETE CASCADE,
    uploaded_by VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Informations du fichier
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50), -- "image", "document", "audio", "video"
    file_size INTEGER, -- en bytes
    mime_type VARCHAR(100),
    
    -- Métadonnées
    title VARCHAR(100),
    description TEXT,
    tags JSON, -- JSON de tags: ["tag1", "tag2"]
    
    -- Visibilité
    is_public BOOLEAN DEFAULT true, -- Visible par tous les participants
    visible_to_players BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📊 **Logs et Historique**

### **game_logs** (journal de partie)
```sql
CREATE TABLE game_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    session_id VARCHAR(36) REFERENCES game_sessions(id) ON DELETE CASCADE,
    
    -- Événement
    event_type VARCHAR(30) NOT NULL, -- "dice_roll", "chat_message", "character_action", "system_event"
    event_data JSON NOT NULL, -- Données flexibles selon le type d'événement
    
    -- Acteurs
    triggered_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    affected_character_id VARCHAR(36) REFERENCES characters(id) ON DELETE SET NULL,
    
    -- Timing
    happened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexation pour recherche
    searchable_text TEXT -- Text généré automatiquement pour recherche
);
```

### **system_logs** (logs système)
```sql
CREATE TABLE system_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Événement système
    action VARCHAR(50) NOT NULL, -- "login", "character_created", "session_joined", etc.
    details JSON,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔍 **Index et Optimisations**

```sql
-- Index pour les requêtes fréquentes
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_active ON characters(is_active);
CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_dice_rolls_session_id ON dice_rolls(session_id);
CREATE INDEX idx_dice_rolls_player_id ON dice_rolls(player_id);
CREATE INDEX idx_game_logs_session_id ON game_logs(session_id);
CREATE INDEX idx_game_logs_happened_at ON game_logs(happened_at);

-- Index pour recherche textuelle (MySQL)
CREATE FULLTEXT INDEX idx_game_logs_searchable_text ON game_logs(searchable_text);
```

---

## 🚀 **Données de Base**

### **Espèces par défaut**
```sql
INSERT INTO species (name, description, bonus_intelligence, bonus_charisme, special_abilities) VALUES
('Humain', 'Espèce de base équilibrée', 1, 1, '["Adaptabilité", "Polyvalence"]'),
('Éveillé', 'Humain avec capacités paranormales', 2, 0, '["Sixième sens", "Résistance psychique"]'),
('Entité', 'Être surnaturel incarné', 0, 3, '["Forme éthérée", "Influence surnaturelle"]');
```

### **Professions par défaut**
```sql
INSERT INTO professions (name, description, skill_bonuses, starting_equipment) VALUES
('Enquêteur', 'Spécialiste de l''investigation', 
 '{"investigation": 25, "psychologie": 15}',
 '["Carnet de notes", "Loupe", "Appareil photo"]'),
('Agent de Terrain', 'Combattant expérimenté', 
 '{"combat": 25, "athletisme": 15}',
 '["Pistolet de service", "Gilet pare-balles", "Radio"]'),
('Occultiste', 'Expert en phénomènes paranormaux', 
 '{"occultisme": 25, "histoire": 15}',
 '["Livres anciens", "Talismans", "Bougies rituelles"]');
```

### **Voix étranges par défaut**
```sql
INSERT INTO voices (name, description, power_description, limitation, rarity) VALUES
('Chuchotements', 'Voix qui murmurent des secrets', 
 'Permet d''obtenir des informations cachées', 
 'Épuise mentalement l''utilisateur', 'common'),
('Échos du Passé', 'Voix des morts qui parlent', 
 'Révèle des événements passés d''un lieu', 
 'Ne fonctionne que sur des lieux chargés d''histoire', 'uncommon'),
('Prophéties', 'Voix qui prédisent l''avenir', 
 'Donne des visions floues du futur proche', 
 'Les visions sont toujours cryptiques', 'rare');
```

### **Objets par défaut**
```sql
INSERT INTO items (name, description, category, properties, base_price, rarity) VALUES
('Carnet d''Enquêteur', 'Carnet de cuir robuste pour prendre des notes', 'tool', 
 '{"bonus_investigation": 5, "pages": 200}', 25, 'common'),
('Pistolet de Service', 'Arme de poing réglementaire', 'weapon', 
 '{"degats": "2d6", "portee": 50, "munitions": 15}', 800, 'common'),
('Amulette Protectrice', 'Petit pendentif gravé de symboles anciens', 'accessory', 
 '{"resistance_mentale": 10, "protection": "Influence surnaturelle"}', 150, 'uncommon'),
('Détecteur EMF', 'Appareil électronique détectant les anomalies', 'tool', 
 '{"detection_paranormal": true, "portee": 20}', 300, 'uncommon');
```

---

## 🔧 **Fonctionnalités Avancées**

### **Triggers pour mise à jour automatique**
```sql
-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_species_updated_at BEFORE UPDATE ON species
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professions_updated_at BEFORE UPDATE ON professions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voices_updated_at BEFORE UPDATE ON voices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_inventory_updated_at BEFORE UPDATE ON character_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_npcs_updated_at BEFORE UPDATE ON npcs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_participants_updated_at BEFORE UPDATE ON session_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_files_updated_at BEFORE UPDATE ON shared_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **Vues pour requêtes complexes**
```sql
-- Vue pour statistiques de session
CREATE VIEW session_stats AS
SELECT 
    gs.id,
    gs.name,
    gs.status,
    COUNT(DISTINCT sp.user_id) as total_players,
    COUNT(DISTINCT cm.id) as total_messages,
    COUNT(DISTINCT dr.id) as total_dice_rolls,
    gs.created_at
FROM game_sessions gs
LEFT JOIN session_participants sp ON gs.id = sp.session_id
LEFT JOIN chat_messages cm ON gs.id = cm.session_id
LEFT JOIN dice_rolls dr ON gs.id = dr.session_id
GROUP BY gs.id, gs.name, gs.status, gs.created_at;
```

---

## 📝 **Notes d'Implémentation**

### **Technologies recommandées**
- **MySQL 8.0+** : Base de données principale (support JSON, UUID via BINARY(16))
- **PostgreSQL** : Alternative avec support JSONB natif et arrays
- **Redis** : Cache et sessions temps réel
- **Prisma** ou **Drizzle** : ORM TypeScript

### **Sécurité**
- Hashage des mots de passe avec bcrypt
- Tokens JWT pour authentification
- Validation des permissions par session
- Sanitisation des inputs utilisateur

### **Compatibilité UUID avec MySQL**
MySQL ne supporte pas le type `UUID` natif. Voici les alternatives :

#### **Option 1 : VARCHAR(36) - Plus simple**
```sql
-- Remplacer tous les UUID par :
id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
user_id VARCHAR(36),
-- etc.
```
✅ **Avantages** : Lisible, compatible avec les outils
❌ **Inconvénients** : Plus lourd en stockage (36 bytes vs 16)

#### **Option 2 : BINARY(16) - Plus performant**
```sql
-- Remplacer tous les UUID par :
id BINARY(16) PRIMARY KEY DEFAULT (UNHEX(REPLACE(UUID(), '-', ''))),
user_id BINARY(16),
-- etc.
```
✅ **Avantages** : Stockage optimisé (16 bytes)
❌ **Inconvénients** : Moins lisible, conversion nécessaire

#### **Exemple concret - Table users pour MySQL :**

**Version VARCHAR(36) :**
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'master', 'admin')),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true
);
```

**Version BINARY(16) :**
```sql
CREATE TABLE users (
    id BINARY(16) PRIMARY KEY DEFAULT (UNHEX(REPLACE(UUID(), '-', ''))),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'master', 'admin')),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true
);

-- Fonctions utiles pour BINARY(16)
-- Conversion pour affichage :
SELECT HEX(id) as id_hex, BIN_TO_UUID(id) as id_uuid FROM users;
-- Recherche par UUID :
SELECT * FROM users WHERE id = UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440000');
```

### **Recommandation UUID pour MySQL**
🎯 **Pour un nouveau projet** : `VARCHAR(36)` pour la simplicité
🚀 **Pour la performance** : `BINARY(16)` si vous maîtrisez les conversions

### **Notes MySQL supplémentaires**
- **JSON** : Support natif depuis MySQL 5.7+, optimisé en 8.0+
- **Recherche textuelle** : Utiliser `FULLTEXT INDEX` au lieu de `gin/gist`
- **Triggers updated_at** : Syntaxe MySQL différente (voir exemple ci-dessous)
- **MySQL 8.0+** : Fonctions `UUID_TO_BIN()` et `BIN_TO_UUID()` disponibles

### **Triggers MySQL pour updated_at**
```sql
-- Exemple pour une table (répéter pour chaque table)
DELIMITER $$
CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;
```

### **Récapitulatif de la Structure Hybride**
| Table                    | Type d'ID             | Justification                               |
| ------------------------ | --------------------- | ------------------------------------------- |
| **users**                | VARCHAR(36) UUID      | 🔒 Données sensibles - Anti-énumération      |
| **user_sessions**        | VARCHAR(36) UUID      | 🔒 Authentification - Sécurité critique      |
| **characters**           | VARCHAR(36) UUID      | 🔒 Personnages privés - URLs non-devinables  |
| **character_inventory**  | VARCHAR(36) UUID      | 🔒 Lié aux personnages                       |
| **npcs**                 | VARCHAR(36) UUID      | 🔒 Créations des MJ - Peuvent être sensibles |
| **game_sessions**        | VARCHAR(36) UUID      | 🔒 Sessions privées - Sécurité importante    |
| **session_participants** | VARCHAR(36) UUID      | 🔒 Lié aux sessions                          |
| **chat_messages**        | VARCHAR(36) UUID      | 🔒 Confidentialité des conversations         |
| **dice_rolls**           | VARCHAR(36) UUID      | 🔒 Lié aux sessions/messages                 |
| **shared_files**         | VARCHAR(36) UUID      | 🔒 Accès sécurisé aux fichiers               |
| **game_logs**            | VARCHAR(36) UUID      | 🔒 Lié aux sessions                          |
| **species**              | INT AUTO_INCREMENT    | ⚡ Données publiques - Performance           |
| **professions**          | INT AUTO_INCREMENT    | ⚡ Données publiques - Performance           |
| **voices**               | INT AUTO_INCREMENT    | ⚡ Données publiques - Performance           |
| **items**                | INT AUTO_INCREMENT    | ⚡ Catalogue d'objets - Performance          |
| **system_logs**          | BIGINT AUTO_INCREMENT | ⚡ Logs système - Performance critique       |

### **Champs Temporels - Récapitulatif**
| Table                | created_at  | updated_at | Autres champs temporels              |
| -------------------- | ----------- | ---------- | ------------------------------------ |
| users                | ✅           | ✅          | last_login                           |
| user_sessions        | ✅           | ❌          | expires_at, last_used                |
| species              | ✅           | ✅          | -                                    |
| professions          | ✅           | ✅          | -                                    |
| voices               | ✅           | ✅          | -                                    |
| characters           | ✅           | ✅          | -                                    |
| items                | ✅           | ✅          | -                                    |
| character_inventory  | acquired_at | ✅          | -                                    |
| npcs                 | ✅           | ✅          | -                                    |
| game_sessions        | ✅           | ✅          | scheduled_date, started_at, ended_at |
| session_participants | joined_at   | ✅          | left_at                              |
| chat_messages        | ✅           | ❌          | edited_at                            |
| dice_rolls           | ✅           | ❌          | - (immutable)                        |
| shared_files         | ✅           | ✅          | -                                    |
| game_logs            | happened_at | ❌          | - (immutable)                        |
| system_logs          | ✅           | ❌          | - (immutable)                        |

### **Performance**
- Pagination sur les messages/logs
- Cache Redis pour données fréquentes
- Index sur colonnes de recherche
- Compression des anciens logs
- **UUID MySQL** : `BINARY(16)` = 50% moins d'espace que `VARCHAR(36)`

---

## 🆔 **UUID vs ID Auto-incrémentés - Comparaison**

### **🎯 Avantages des UUID**

#### **🔒 Sécurité et confidentialité**
- **Pas d'énumération** : Impossible de deviner les IDs (`/users/123` → `/users/456`)
- **URLs opaques** : `/characters/a7b3c8d2-f1e4-4567-8901-234567890abc`
- **Pas de fuites d'informations** : Le nombre total d'enregistrements reste secret

#### **🌐 Distribution et scalabilité**
- **Génération décentralisée** : Chaque serveur peut générer des IDs uniques
- **Fusion de BDD** : Pas de conflits lors de synchronisations
- **Microservices** : Chaque service génère ses propres IDs sans coordination
- **Réplication maître-maître** : Pas de collision entre serveurs

#### **🚀 Avantages techniques**
- **Génération côté client** : L'ID peut être connu avant l'insertion
- **Relations avant sauvegarde** : Utile pour les transactions complexes
- **Indépendance temporelle** : L'ordre de création n'est pas révélé

### **❌ Inconvénients des UUID**

#### **📊 Performance**
- **Taille** : 16 bytes vs 4-8 bytes (INTEGER/BIGINT)
- **Index plus lourds** : Impact sur la mémoire et vitesse
- **Tri et recherche** : Plus lents qu'avec des entiers
- **Fragmentation** : Les UUID aléatoires fragmentent les index

#### **👨‍💻 Développement**
- **URLs longues** : `/users/550e8400-e29b-41d4-a716-446655440000`
- **Lisibilité réduite** : Plus difficiles à retenir/debugger
- **Logs verbeux** : Prennent plus de place dans les logs

---

### **🔢 Avantages des ID Auto-incrémentés**

#### **⚡ Performance**
- **Compacts** : 4-8 bytes seulement
- **Index optimaux** : Insertion séquentielle, pas de fragmentation
- **Vitesse** : Comparaisons et tris ultra-rapides
- **Cache-friendly** : Meilleure localité des données

#### **👨‍💻 Développement**
- **URLs courtes** : `/users/123`
- **Debuggage facile** : `user_id: 456` est plus lisible
- **Ordre chronologique** : L'ID révèle l'ordre de création

### **❌ Inconvénients des ID Auto-incrémentés**

#### **🔓 Sécurité**
- **Énumération facile** : `/api/users/1`, `/api/users/2`, etc.
- **Révèlent des infos** : Nombre total d'utilisateurs, taux de croissance
- **Attaques séquentielles** : Facile de scraper toute la base

#### **🌐 Scalabilité**
- **Point unique** : Chaque table a son compteur centralisé
- **Conflits de réplication** : Problématique en maître-maître
- **Fusion difficile** : Collision lors de merge de bases de données
- **Microservices** : Coordination nécessaire entre services

---

### **🎯 Recommandation pour Étrange France**

#### **🎮 Contexte du projet**
- Application de jeu de rôle
- Sessions multijoueurs
- Données sensibles (personnages, sessions)
- Potentiel multi-serveurs

#### **✅ UUID recommandés pour :**
- **users** : Éviter l'énumération des comptes
- **characters** : Personnages privés, sécurité importante
- **game_sessions** : Sessions privées, URLs non-devinables
- **chat_messages** : Confidentialité des conversations
- **shared_files** : Accès sécurisé aux fichiers

#### **🔢 Auto-incréments possibles pour :**
- **species, professions, voices** : Données de référence publiques
- **items** : Catalogue d'objets (pas sensible)
- **system_logs** : Performance importante, pas de sécurité critique

#### **💡 Compromis hybride proposé**
```sql
-- Données sensibles : UUID
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    -- ...
);

-- Données de référence : Auto-increment
CREATE TABLE species (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- ...
);

-- Relations : Clés étrangères adaptées
CREATE TABLE characters (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36), -- UUID
    species_id INT,      -- Auto-increment
    -- ...
);
```

### **🏆 Conclusion**

**Pour Étrange France, je recommande une approche hybride :**
- **UUID (VARCHAR(36))** pour les données sensibles et utilisateurs
- **Auto-increment** pour les données de référence et catalogues
- Meilleur équilibre sécurité/performance/simplicité

**Cette structure couvre toutes vos fonctionnalités et est prête pour un déploiement en production !** 🚀 