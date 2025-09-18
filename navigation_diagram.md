# Diagramme de Navigation - Etrange France

## Structure de Navigation Complète

```mermaid
graph TD
    %% Point d'entrée principal
    App[App.tsx] --> RootNavigator[RootNavigator]
    
    %% Navigation principale (Stack)
    RootNavigator --> MainTabs[MainTabs - TabNavigator]
    RootNavigator --> Auth[Auth - Connexion]
    RootNavigator --> CreateCharacter[CreateCharacter - Création Personnage]
    RootNavigator --> ChooseProfession[ChooseProfession - Choisir Profession]
    RootNavigator --> ChooseHobbie[ChooseHobbie - Choisir Loisir]
    RootNavigator --> ChooseStrangePath[ChooseStrangePath - Choisir Voie Étrange]
    RootNavigator --> ChooseVoieCapacities[ChooseVoieCapacities - Capacités Voie]
    RootNavigator --> ChooseDivinity[ChooseDivinity - Choisir Divinité]
    RootNavigator --> ChooseBonus[ChooseBonus - Choisir Bonus]
    RootNavigator --> Deck[Deck - Gestion Deck]
    RootNavigator --> CardDraw[CardDraw - Pioche de Cartes]
    RootNavigator --> Logs[Logs - Journal]
    RootNavigator --> Bdd[Bdd - Base de Données]
    RootNavigator --> CharacterSheet[CharacterSheet - Fiche Personnage]
    
    %% Navigation par onglets (TabNavigator)
    MainTabs --> Home[Home - Accueil]
    MainTabs --> Characters[Characters - Personnages]
    MainTabs --> Agency[Agency - Agence]
    MainTabs --> Scenarios[Scenarios - Scénarios]
    MainTabs --> Parties[Parties - Parties]
    MainTabs --> DeckTab[Deck - Deck]
    MainTabs --> Param[Param - Paramètres]
    
    %% Navigation des scénarios (ScenariosNavigator)
    Scenarios --> ScenariosList[ScenariosList - Liste Scénarios]
    Scenarios --> SelectScenario[SelectScenario - Sélection Scénario]
    Scenarios --> ScenarioDescription[ScenarioDescription - Description Scénario]
    Scenarios --> Join[Join - Rejoindre Partie]
    
    %% Flux de création de personnage
    CreateCharacter --> ChooseProfession
    ChooseProfession --> ChooseHobbie
    ChooseHobbie --> ChooseStrangePath
    ChooseStrangePath --> ChooseVoieCapacities
    ChooseVoieCapacities --> ChooseDivinity
    ChooseDivinity --> ChooseBonus
    ChooseBonus --> Characters
    
    %% Navigation depuis l'accueil
    Home --> CreateCharacter
    Home --> Characters
    Home --> Scenarios
    Home --> Deck
    Home --> Logs
    Home --> Bdd
    
    %% Navigation depuis les personnages
    Characters --> CreateCharacter
    Characters --> CharacterSheet
    Characters --> CardDraw
    
    %% Navigation depuis les scénarios
    ScenariosList --> SelectScenario
    SelectScenario --> ScenarioDescription
    ScenarioDescription --> Join
    Join --> Parties
    
    %% Navigation depuis les parties
    Parties --> CharacterSheet
    Parties --> CardDraw
    
    %% Navigation depuis le deck
    Deck --> CardDraw
    
    %% Styles
    classDef stackScreen fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef tabScreen fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef scenarioScreen fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef modalScreen fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class RootNavigator,MainTabs,Auth,CreateCharacter,ChooseProfession,ChooseHobbie,ChooseStrangePath,ChooseVoieCapacities,ChooseDivinity,ChooseBonus,Deck,CardDraw,Logs,Bdd stackScreen
    class Home,Characters,Agency,Parties,DeckTab,Param tabScreen
    class Scenarios,ScenariosList,SelectScenario,ScenarioDescription,Join scenarioScreen
    class CharacterSheet modalScreen
```

## Description des Navigations

### 1. Navigation Principale (RootNavigator)
- **Stack Navigator** avec tous les écrans principaux
- Gère l'authentification et la création de personnages
- Contient les écrans de jeu (Deck, CardDraw, etc.)

### 2. Navigation par Onglets (TabNavigator)
- **Bottom Tab Navigator** avec 7 onglets
- Accueil, Personnages, Agence, Scénarios, Parties, Deck, Paramètres
- Chaque onglet peut naviguer vers des écrans de la stack principale

### 3. Navigation des Scénarios (ScenariosNavigator)
- **Stack Navigator** imbriqué dans l'onglet Scénarios
- Flux : Liste → Sélection → Description → Rejoindre

### 4. Flux de Création de Personnage
Séquence linéaire :
1. CreateCharacter → 2. ChooseProfession → 3. ChooseHobbie → 
4. ChooseStrangePath → 5. ChooseVoieCapacities → 6. ChooseDivinity → 
7. ChooseBonus → 8. Retour aux Personnages

### 5. Écrans Modaux
- **CharacterSheet** : Affiché en modal avec animation flip
- Accessible depuis Characters, Parties, etc.

### 6. Points d'Entrée Principaux
- **Home** : Point central avec accès à toutes les fonctionnalités
- **Characters** : Gestion des personnages
- **Scenarios** : Navigation vers les scénarios
- **Parties** : Gestion des parties en cours

## Types de Navigation

1. **Stack Navigation** : Navigation hiérarchique avec retour
2. **Tab Navigation** : Navigation par onglets en bas d'écran
3. **Modal Navigation** : Écrans superposés (CharacterSheet)
4. **Nested Navigation** : ScenariosNavigator dans TabNavigator
