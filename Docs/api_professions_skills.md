# Documentation API PHP-CRUD-API – Professions & Skills

Cette documentation présente des exemples d'utilisation de [PHP-CRUD-API](https://github.com/mevdschee/php-crud-api) pour manipuler trois tables :

- **professions(id, name)**
- **skills(id, name)**
- **profession_skills(profession_id, skill_id)** : table de jointure N↔N

> ⚠️ Assurez-vous que les clés étrangères sont bien créées :
> - `profession_skills.profession_id` → `professions.id`
> - `profession_skills.skill_id` → `skills.id`

## Lecture

### 1) Lister les professions + leurs skills
```bash
curl "https://ton-domaine.tld/api.php/records/professions?join=profession_skills,skills&fields=professions.id,professions.name,skills.id,skills.name&order=professions.name,asc"
```

### 2) Une profession précise + ses skills
```bash
curl "https://ton-domaine.tld/api.php/records/professions/3?join=profession_skills,skills"
```

### 3) Filtrer : professions possédant un skill par nom
```bash
curl "https://ton-domaine.tld/api.php/records/professions?join=profession_skills,skills&filter=skills.name,eq,Carpentry"
```

### 4) Lister les skills + professions associées
```bash
curl "https://ton-domaine.tld/api.php/records/skills?join=profession_skills,professions&fields=skills.id,skills.name,professions.id,professions.name"
```

## Écriture

### 5) Créer une profession
```bash
curl -X POST "https://ton-domaine.tld/api.php/records/professions"   -H "Content-Type: application/json"   -d '{"name":"Blacksmith"}'
```

### 6) Créer un skill
```bash
curl -X POST "https://ton-domaine.tld/api.php/records/skills"   -H "Content-Type: application/json"   -d '{"name":"Forging"}'
```

### 7) Lier une profession à un skill
```bash
curl -X POST "https://ton-domaine.tld/api.php/records/profession_skills"   -H "Content-Type: application/json"   -d '{"profession_id":3,"skill_id":7}'
```

### 8) Lier plusieurs skills d’un coup (insertion bulk)
```bash
curl -X POST "https://ton-domaine.tld/api.php/records/profession_skills"   -H "Content-Type: application/json"   -d '[{"profession_id":3,"skill_id":7},{"profession_id":3,"skill_id":9}]'
```

### 9) Délier (supprimer un lien)
```bash
curl -X DELETE "https://ton-domaine.tld/api.php/records/profession_skills?filter=profession_id,eq,3&filter=skill_id,eq,7"
```

### 10) Remplacer complètement les skills d’une profession
1. Supprimer les liens existants :
```bash
curl -X DELETE "https://ton-domaine.tld/api.php/records/profession_skills?filter=profession_id,eq=3"
```
2. Recréer les nouveaux liens :
```bash
curl -X POST "https://ton-domaine.tld/api.php/records/profession_skills"   -H "Content-Type: application/json"   -d '[{"profession_id":3,"skill_id":5},{"profession_id":3,"skill_id":6}]'
```

## Astuces

- **Pagination** : `&page=1,50` ou `&offset=0&limit=50`
- **Recherche partielle** : `filter=professions.name,cs,dev` (`cs` = contains, `sw` = starts with, etc.)
- **Colonnes retournées** : `fields=professions.id,professions.name,skills.name`
- **Tri multi-colonnes** : `order=professions.name,asc&order=skills.name,asc`
- **OpenAPI** : `…/api.php/openapi`

## Sécurité recommandée (extrait config api.php)

```php
'middlewares' => 'cors,basicAuth,authorization',
'basicAuth.mode' => 'required',
'basicAuth.passwordFile' => __DIR__.'/.htpasswd',

'authorization.tableHandler' => function($op, $table) {
  $allowed = ['professions','skills','profession_skills'];
  return in_array($table, $allowed, true);
},
'authorization.recordHandler' => function($op, $table) {
  if (in_array($op, ['create','update','delete'], true)) {
    return $table === 'profession_skills';
  }
  return true;
},
```
