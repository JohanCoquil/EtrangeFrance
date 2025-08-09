import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = () => {
  if (!db) {
    db = SQLite.openDatabaseSync("etrange_france.db");
  }
  return db;
};

export const initDb = async () => {
  const database = getDb();
  await database.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS voies_etranges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distant_id INTEGER DEFAULT 0,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS capacites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distant_id INTEGER DEFAULT 0,
      voie_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (voie_id) REFERENCES voies_etranges(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_capacites_voie_id ON capacites(voie_id);

    CREATE TABLE IF NOT EXISTS capacite_rangs (
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

    CREATE TABLE IF NOT EXISTS character_capacites (
      distant_id INTEGER DEFAULT 0,
      character_id TEXT NOT NULL,
      capacite_id INTEGER NOT NULL,
      level INTEGER NOT NULL,
      PRIMARY KEY (character_id, capacite_id),
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (capacite_id) REFERENCES capacites(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_character_capacites_character_id ON character_capacites(character_id);

    CREATE TABLE IF NOT EXISTS hobbies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distant_id INTEGER DEFAULT 0,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distant_id INTEGER DEFAULT 0,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS professions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distant_id INTEGER DEFAULT 0,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profession_skills (
      distant_id INTEGER DEFAULT 0,
      profession_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      PRIMARY KEY (profession_id, skill_id),
      FOREIGN KEY (profession_id) REFERENCES professions(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_profession_skills_skill_id ON profession_skills(skill_id);

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      distant_id INTEGER DEFAULT 0,
      name TEXT NOT NULL,
      profession TEXT,
      profession_id INTEGER,
      profession_score INTEGER DEFAULT 0,
      hobby_id INTEGER,
      hobby_score INTEGER DEFAULT 0,
      voie_id INTEGER,
      voie_score INTEGER DEFAULT 0,
      intelligence INTEGER DEFAULT 1,
      force INTEGER DEFAULT 1,
      dexterite INTEGER DEFAULT 1,
      charisme INTEGER DEFAULT 1,
      memoire INTEGER DEFAULT 1,
      volonte INTEGER DEFAULT 1,
      sante INTEGER DEFAULT 0,
      FOREIGN KEY (profession_id) REFERENCES professions(id),
      FOREIGN KEY (hobby_id) REFERENCES hobbies(id),
      FOREIGN KEY (voie_id) REFERENCES voies_etranges(id)
    );

    INSERT OR IGNORE INTO voies_etranges (id, name, description) VALUES
      (1, 'Alchimiste', 'Vous êtes un chercheur de la véritable essence des éléments.'),
      (2, 'Chaman', 'Vous êtes le réceptacle du savoir de nombreuses générations.'),
      (3, 'Chasseur de monstres', 'Like Buffy you know !!'),
      (4, 'Goule', 'Dans vos veines coule le sang d''un tueur sans âme.');

    INSERT OR IGNORE INTO capacites (id, voie_id, name, description) VALUES
      (1, 1, 'Alchimie utilitaire', 'Permet de créer des potions utiles pour le quotidien'),
      (2, 1, 'Alchimie des remèdes magiques', 'Concocte des remèdes qui soignent la magie'),
      (3, 1, 'Alchimie de transmutation', 'Transforme la matière pour altérer ses propriétés'),
      (4, 1, 'Familier', 'Un compagnon mystique qui vous assiste'),
      (5, 1, 'Hypnose', 'Influence l’esprit des autres par la suggestion'),
      (6, 2, 'Appel de la nature', 'Invoque la force des éléments naturels'),
      (7, 2, 'Champ de protection magique', 'Érige une barrière contre les attaques mystiques'),
      (8, 2, 'Chant envoutant', 'Utilise la musique pour canaliser la magie'),
      (9, 2, 'Communion avec les esprits', 'Dialogue avec les esprits du monde invisible'),
      (10, 2, 'Rites sacrés', 'Accomplit des cérémonies ancestrales puissantes'),
      (11, 2, 'Rites de passage des cairns', 'Maîtrise les rituels des lieux sacrés'),
      (12, 2, 'Guérison mystique', 'Soigne les blessures par l’énergie spirituelle'),
      (13, 3, 'Agilité surnaturelle', 'Se déplace avec une rapidité inhumaine'),
      (14, 3, 'Croquemitaine', 'Incarne la peur pour terrifier les monstres'),
      (15, 3, 'Familier', 'Un allié animal spécialisé dans la chasse aux monstres'),
      (16, 3, 'Force surnaturelle', 'Déploie une puissance physique extraordinaire'),
      (17, 3, 'Perception surnaturelle', 'Détecte les dangers cachés et les créatures'),
      (18, 3, 'Volonté surnaturelle', 'Résiste aux influences occultes'),
      (19, 4, 'Animalisme', 'Communique et contrôle les bêtes sauvages'),
      (20, 4, 'Hypnose', 'Soumet les esprits faibles à votre volonté'),
      (21, 4, 'Force surnaturelle', 'Une puissance brute héritée du sang impur'),
      (22, 4, 'Perception surnaturelle', 'Voit dans les ténèbres et sent la chair fraîche'),
      (23, 4, 'Régénération', 'Guérit rapidement des blessures');

    INSERT OR IGNORE INTO hobbies (id, name, description) VALUES
      (1, 'Jouer au cinéma', NULL),
      (2, 'Archéologie', NULL),
      (3, 'Arts martiaux', NULL),
      (4, 'Aviation', NULL),
      (5, 'Course automobile', NULL),
      (6, 'Jeux de réflexion', NULL),
      (7, 'Cascadeur', NULL),
      (8, 'Chasse', NULL),
      (9, 'Danse', NULL),
      (10, 'Recherche documentaire', NULL),
      (11, 'Arts du cirque', NULL),
      (12, 'Enquête', NULL),
      (13, 'Hacker', NULL),
      (14, 'Humanitaire', NULL),
      (15, 'Linguistique', NULL),
      (16, 'Jouer au poker', NULL),
      (17, 'Journalisme', NULL),
      (18, 'Musique', NULL),
      (19, 'Peinture', NULL),
      (20, 'Photographie', NULL),
      (21, 'Pompier volontaire', NULL),
      (22, 'Rôliste', NULL),
      (23, 'Survie en milieu sauvage', NULL),
      (24, 'Astronomie', NULL),
      (25, 'Sport extrême', NULL),
      (26, 'Pêche', NULL),
      (27, 'Navigation', NULL),
      (28, 'Arts créatifs', NULL),
      (29, 'Collectionner un type d’objets', NULL),
      (30, 'Bricoler', NULL),
      (31, 'Jardiner', NULL),
      (32, 'Chiner dans les brocantes', NULL);

    INSERT OR IGNORE INTO skills (id, name) VALUES
      (1, 'administration'),
      (2, 'armes de guerre'),
      (3, 'art oratoire'),
      (4, 'arts'),
      (5, 'athlétisme'),
      (6, 'attention aux détails'),
      (7, 'autorité'),
      (8, 'cartographie'),
      (9, 'chant'),
      (10, 'chasse'),
      (11, 'chirurgie'),
      (12, 'combat'),
      (13, 'compréhension des systèmes complexes'),
      (14, 'concentration'),
      (15, 'coordination'),
      (16, 'dessin'),
      (17, 'diagnostic'),
      (18, 'diplomatie'),
      (19, 'discrétion'),
      (20, 'dissimulation'),
      (21, 'droit'),
      (22, 'duel'),
      (23, 'embuscade'),
      (24, 'explosifs'),
      (25, 'faussaire'),
      (26, 'finance'),
      (27, 'gestion'),
      (28, 'gestion de patrimoine'),
      (29, 'gestion financière'),
      (30, 'golf'),
      (31, 'géographie'),
      (32, 'histoire'),
      (33, 'histoire de l’art'),
      (34, 'informatique'),
      (35, 'instruments'),
      (36, 'intendance'),
      (37, 'langues'),
      (38, 'mathématiques'),
      (39, 'mimétisme'),
      (40, 'musique'),
      (41, 'mécanique'),
      (42, 'médecine de bataille'),
      (43, 'occultisme'),
      (44, 'perception'),
      (45, 'persuasion'),
      (46, 'pilotage'),
      (47, 'pièges'),
      (48, 'politique'),
      (49, 'pouvoir de conviction'),
      (50, 'premiers soins'),
      (51, 'recherche'),
      (52, 'recherche documentaire'),
      (53, 'recherches'),
      (54, 'recherches occultes'),
      (55, 'résister à la douleur'),
      (56, 'survie'),
      (57, 'séduction'),
      (58, 'utilisation d’un laboratoire'),
      (59, 'vol à la tire'),
      (60, 'éducation'),
      (61, 'éducation supérieure'),
      (62, 'électronique'),
      (63, 'étiquette'),
      (64, 'évaluation');

    INSERT OR IGNORE INTO professions (id, name, description, image) VALUES
      (1, 'Archéologue/Explorateur', NULL, ''),
      (2, 'Aristocrate', NULL, ''),
      (3, 'Arnaqueur', NULL, ''),
      (4, 'Artiste', NULL, ''),
      (5, 'Avocat', NULL, ''),
      (6, 'Bibliothécaire', NULL, ''),
      (7, 'Cambrioleur', NULL, ''),
      (8, 'Chasseur de monstre', NULL, ''),
      (9, 'Combattant martial', NULL, ''),
      (10, 'Détective privé/enquêteur', NULL, ''),
      (11, 'Écrivain', NULL, ''),
      (12, 'Espion (industriel, étatique)', NULL, ''),
      (13, 'Forces de l’ordre (policier, douanier)', NULL, ''),
      (14, 'Garde du corps/protecteur', NULL, ''),
      (15, 'Homme d’affaires', NULL, ''),
      (16, 'Historien', NULL, ''),
      (17, 'Inquisiteur', NULL, ''),
      (18, 'Ingénieur', NULL, ''),
      (19, 'Journaliste', NULL, ''),
      (20, 'Linguiste/traducteur', NULL, ''),
      (21, 'Lobbyiste', NULL, ''),
      (22, 'Majordome', NULL, ''),
      (23, 'Mécanicien', NULL, ''),
      (24, 'Médecin', NULL, ''),
      (25, 'Militaire de terrain', NULL, ''),
      (26, 'Musicien', NULL, ''),
      (27, 'Officier de l’armée', NULL, ''),
      (28, 'Personnalité politique', NULL, ''),
      (29, 'Pilote', NULL, ''),
      (30, 'Photographe', NULL, ''),
      (31, 'Religieux', NULL, ''),
      (32, 'Ranger/Surveillant des eaux et forêts', NULL, ''),
      (33, 'Scientifique', NULL, '');

    INSERT OR IGNORE INTO profession_skills (profession_id, skill_id) VALUES
      (6, 1),
      (21, 1),
      (25, 2),
      (5, 3),
      (2, 4),
      (4, 4),
      (11, 4),
      (19, 4),
      (20, 4),
      (26, 4),
      (28, 4),
      (30, 4),
      (1, 5),
      (7, 5),
      (8, 5),
      (9, 5),
      (10, 5),
      (12, 5),
      (13, 5),
      (14, 5),
      (17, 5),
      (25, 5),
      (27, 5),
      (32, 5),
      (4, 6),
      (9, 6),
      (11, 6),
      (2, 7),
      (5, 7),
      (6, 7),
      (13, 7),
      (14, 7),
      (15, 7),
      (17, 7),
      (22, 7),
      (24, 7),
      (25, 7),
      (27, 7),
      (28, 7),
      (31, 7),
      (1, 8),
      (6, 8),
      (12, 8),
      (16, 8),
      (25, 8),
      (27, 8),
      (29, 8),
      (32, 8),
      (26, 9),
      (2, 10),
      (8, 10),
      (15, 10),
      (25, 10),
      (27, 10),
      (32, 10),
      (24, 11),
      (7, 12),
      (8, 12),
      (9, 12),
      (10, 12),
      (13, 12),
      (14, 12),
      (22, 12),
      (18, 13),
      (4, 14),
      (4, 15),
      (4, 16),
      (24, 17),
      (2, 18),
      (5, 18),
      (30, 19),
      (3, 20),
      (7, 20),
      (5, 21),
      (13, 21),
      (15, 21),
      (21, 21),
      (2, 22),
      (14, 23),
      (25, 24),
      (3, 25),
      (21, 26),
      (6, 27),
      (2, 28),
      (5, 28),
      (24, 28),
      (15, 29),
      (15, 30),
      (1, 31),
      (1, 32),
      (2, 32),
      (6, 32),
      (11, 32),
      (12, 32),
      (16, 32),
      (17, 32),
      (19, 32),
      (20, 32),
      (21, 32),
      (22, 32),
      (28, 32),
      (31, 32),
      (4, 33),
      (30, 33),
      (6, 34),
      (19, 34),
      (30, 34),
      (26, 35),
      (22, 36),
      (20, 37),
      (18, 38),
      (3, 39),
      (2, 40),
      (23, 41),
      (29, 41),
      (8, 42),
      (6, 43),
      (17, 43),
      (10, 44),
      (14, 44),
      (29, 44),
      (21, 45),
      (23, 46),
      (29, 46),
      (8, 47),
      (2, 48),
      (3, 49),
      (24, 50),
      (10, 51),
      (11, 52),
      (33, 52),
      (6, 53),
      (8, 54),
      (9, 55),
      (1, 56),
      (8, 56),
      (9, 56),
      (25, 56),
      (3, 57),
      (5, 57),
      (21, 57),
      (26, 57),
      (33, 58),
      (3, 59),
      (7, 59),
      (1, 60),
      (2, 60),
      (4, 60),
      (6, 60),
      (10, 60),
      (12, 60),
      (15, 60),
      (17, 60),
      (18, 60),
      (21, 60),
      (23, 60),
      (26, 60),
      (27, 60),
      (29, 60),
      (31, 60),
      (5, 61),
      (11, 61),
      (16, 61),
      (19, 61),
      (20, 61),
      (22, 61),
      (24, 61),
      (28, 61),
      (33, 61),
      (7, 62),
      (22, 63),
      (4, 64),
      (7, 64);
  `);

  // Ensure new columns exist for older databases
  const columns = await database.getAllAsync("PRAGMA table_info(characters);");
  const hasProfessionId = columns.some((c: any) => c.name === "profession_id");
  if (!hasProfessionId) {
    await database.execAsync(
      "ALTER TABLE characters ADD COLUMN profession_id INTEGER;"
    );
  }

  const hasSante = columns.some((c: any) => c.name === "sante");
  if (!hasSante) {
    await database.execAsync(
      "ALTER TABLE characters ADD COLUMN sante INTEGER DEFAULT 0;"
    );
  }

  await database.execAsync(
    "CREATE INDEX IF NOT EXISTS idx_characters_profession_id ON characters(profession_id);"
  );
};

export const resetDb = async () => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
  await SQLite.deleteDatabaseAsync("etrange_france.db");
  await initDb();
};

