# 🎨 Design System - Guide d'utilisation

## **Réponse à vos questions**

### **1. Radix UI → Pas adapté à React Native**
- ❌ **Radix UI** : Web/DOM uniquement
- ✅ **Solution** : Design system custom avec NativeWind + composants réutilisables

### **2. Fichier modèle commun → Oui, absolument !**
- ✅ **Créé** : `Layout`, `Card`, `Typography`, `Button`
- ✅ **Thème centralisé** : `constants/theme.ts`
- ✅ **Import simplifié** : `import { Layout, Button } from '../components/ui'`

---

## 🧩 **Composants disponibles**

### **Layout** - Conteneur principal
```tsx
import { Layout } from '../components/ui';

// Layout centré avec safe area
<Layout variant="centered" backgroundColor="gray">
  {/* Contenu */}
</Layout>

// Layout avec scroll
<Layout variant="scroll" className="px-4">
  {/* Contenu long */}
</Layout>
```

### **Typography** - Textes cohérents
```tsx
import { Title, Body, Caption } from '../components/ui';

<Title>Titre principal</Title>
<Body>Texte de contenu</Body>
<Caption>Texte secondaire</Caption>
```

### **Card** - Conteneurs
```tsx
import { Card } from '../components/ui';

<Card variant="elevated">
  {/* Contenu avec ombre */}
</Card>

<Card variant="outline">
  {/* Contenu avec bordure */}
</Card>
```

### **Button** - Boutons (déjà existant)
```tsx
import { Button } from '../components/ui';

<Button variant="primary">Action principale</Button>
<Button variant="secondary">Action secondaire</Button>
```

---

## 🎯 **Avantages du design system**

### **✅ Cohérence**
- Tous les écrans utilisent les mêmes composants
- Couleurs, tailles, espacements standardisés
- Thème centralisé dans `constants/theme.ts`

### **✅ Productivité**
- Import unique : `import { Layout, Button } from '../components/ui'`
- Moins de code répétitif
- Variants prédefinis

### **✅ Maintenance**
- Modification du thème = impact sur toute l'app
- Composants réutilisables
- TypeScript pour la sécurité

---

## 📝 **Exemple d'utilisation - Écran complet**

```tsx
import { Layout, Card, Title, Body, Button } from '../components/ui';

export default function MonEcran() {
  return (
    <Layout variant="scroll" className="px-4">
      <Title className="mb-6">Mon Titre</Title>
      
      <Card className="mb-4">
        <Body className="mb-4">
          Contenu de ma carte avec texte explicatif.
        </Body>
        <Button variant="primary" onPress={() => {}}>
          Action principale
        </Button>
      </Card>

      <Card variant="outline">
        <Body className="text-gray-500">
          Carte avec bordure et contenu secondaire.
        </Body>
      </Card>
    </Layout>
  );
}
```

---

## 🔧 **Personnalisation**

### **Modifier le thème**
Éditez `src/constants/theme.ts` pour changer :
- Couleurs principales
- Tailles de police
- Espacements
- Bordures et ombres

### **Créer de nouveaux composants**
Ajoutez vos composants dans `src/components/ui/` et exportez-les dans `index.ts`

### **Variants personnalisés**
Ajoutez de nouveaux variants aux composants existants selon vos besoins.

---

## 🚀 **Prochaines étapes**

1. **Utilisez Layout** dans tous vos écrans
2. **Remplacez Text** par Title/Body/Caption
3. **Encapsulez le contenu** dans Card
4. **Standardisez les couleurs** avec le thème
5. **Créez des composants spécialisés** pour le JDR (DiceRoller, CharacterCard, etc.)

**Votre design system est maintenant prêt et cohérent !** 🎉 